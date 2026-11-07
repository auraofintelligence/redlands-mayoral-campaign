import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
import model from '../operations/model.cjs';
import { OperationsStore } from '../operations/store.mjs';
import { initialiseOperations, launchTasks, optionalTaskTemplates } from '../operations/bootstrap.mjs';

const context = {id: randomUUID, now: () => '2026-11-08T05:00:00.000Z'};
const contact = {name:'Example Contact',email:'example@example.org',consent:'granted',consentScope:'Requested public updates',consentEvidence:'Example confirmation held privately',consentDate:'2026-11-08'};
const testRoot=fileURLToPath(new URL('../private/',import.meta.url));
async function temporary(){await mkdir(testRoot,{recursive:true});return mkdtemp(join(testRoot,'operations-test-'));}
async function cleanup(directory){assert.ok(resolve(directory).startsWith(resolve(testRoot)+sep));await rm(directory,{recursive:true,force:true});}

test('consent requires evidence and rejects invalid dates and unrecognised profiling fields', () => {
  assert.throws(() => model.validate('contacts',{name:'Example',consent:'granted'}),/requires/);
  assert.throws(() => model.validate('contacts',{...contact,consentDate:'2026-02-30'}),/YYYY-MM-DD/);
  assert.throws(() => model.validate('contacts',{...contact,votingIntention:'unknown'}),/Unknown field/);
});

test('suppression survives updates and prevents duplicate re-entry', () => {
  const state=model.fresh();
  const record=model.save(state,'contacts',contact,null,context);
  model.suppress(state,'EXAMPLE@example.org','Unsubscribe received',context);
  assert.equal(state.contacts[0].consent,'withdrawn');
  assert.throws(() => model.save(state,'contacts',contact,record.id,context),/suppressed/);
  assert.throws(() => model.save(state,'contacts',contact,null,context),/already/);
  assert.equal(state.suppression.length,1);
  assert.ok(state.audit.every(item=>!JSON.stringify(item).includes('example@example.org')));
});

test('publication cannot be approved or marked published without review evidence', () => {
  assert.throws(() => model.validate('publications',{title:'Notice',status:'approved'}),/Approval requires/);
  const publication={title:'Notice',status:'approved',reviewer:'Luke Nathan Hayes',reviewedDate:'2026-11-08',sourceUrl:'https://example.org/source',authorisation:'Example authorisation for test only'};
  assert.equal(model.validate('publications',publication).status,'approved');
  assert.throws(() => model.validate('publications',{...publication,reviewer:'AI agent'}),/Only Luke/);
  assert.throws(() => model.validate('publications',{...publication,status:'published'}),/published URL/);
});

test('CSV escapes formula payloads, quotes and line breaks', () => {
  const state=model.fresh();
  model.save(state,'tasks',{title:' =HYPERLINK("https://example.org")',notes:'one\ntwo'},null,context);
  const csv=model.exportCsv(state,'tasks');
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.org"")"'));
  assert.ok(csv.includes('"one\ntwo"'));
  assert.equal(model.csvCell('\t=1+1'),'"\'\t=1+1"');
});

test('transactions persist, failed changes do not overwrite state, and backup retains suppression', async () => {
  const directory=await temporary();
  try {
    const store=new OperationsStore(directory);
    const saved=await store.save('contacts',contact);
    await store.suppress(contact.email,'Unsubscribe');
    const before=await readFile(store.file,'utf8');
    await assert.rejects(store.save('contacts',contact,saved.id),/suppressed/);
    assert.equal(await readFile(store.file,'utf8'),before);
    const backup=await store.backup();
    assert.equal(JSON.parse(await readFile(join(backup,'operations.json'),'utf8')).suppression.length,1);
    assert.equal((await new OperationsStore(directory).read()).contacts[0].consent,'withdrawn');
  } finally { await cleanup(directory); }
});

test('concurrent write lock refuses another writer', async () => {
  const directory=await temporary();
  try {
    await writeFile(join(directory,'.write-lock'),'');
    await assert.rejects(new OperationsStore(directory).save('tasks',{title:'Example'}),/Another writer/);
  } finally { await cleanup(directory); }
});

test('Drive portal rejects missing or different owner identities before storage access', async () => {
  const source=await readFile(new URL('../integrations/google-drive/Code.gs',import.meta.url),'utf8');
  let storageTouched=false;
  const properties={OWNER_EMAIL:'owner@example.com'};
  const sandbox={PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]||null})},Session:{getActiveUser:()=>({getEmail:()=>''}),getEffectiveUser:()=>({getEmail:()=> 'owner@example.com'})},DriveApp:{getFolderById:()=>{storageTouched=true;}}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  assert.throws(()=>sandbox.getDashboard(),/Owner sign-in required/);
  assert.equal(storageTouched,false);
  sandbox.Session.getActiveUser=()=>({getEmail:()=> 'somebody@example.org'});
  assert.throws(()=>sandbox.exportRecords('contacts'),/Owner sign-in required/);
  sandbox.Session.getActiveUser=()=>({getEmail:()=> 'owner@example.com'});
  assert.doesNotThrow(()=>sandbox.assertOwner_());
  delete properties.OWNER_EMAIL;
  assert.throws(()=>sandbox.getDashboard(),/Owner configuration required/);
  assert.equal(storageTouched,false);
});

test('Apps Script model matches canonical local validation source', async () => {
  const generated=await readFile(new URL('../integrations/google-drive/Model.gs',import.meta.url),'utf8');
  const canonical=await readFile(new URL('../operations/model.cjs',import.meta.url),'utf8');
  assert.equal(generated, '// Generated from operations/model.cjs. Run node operations/build-apps-script.mjs after changes.\n'+canonical.replace("if (typeof module !== 'undefined') module.exports = CampaignModel;",''));
});

test('initialisation creates an empty store without tasks, dates, contacts or approvals', async () => {
  const directory=await temporary();
  try {
    const store=new OperationsStore(directory);
    const result=await initialiseOperations(store);
    const state=await store.read();
    assert.equal(result.added,0);
    assert.equal(result.total,0);
    assert.equal(state.revision,0);
    for (const collection of ['tasks','contacts','publications','enquiries','expenses','audit']) {
      assert.deepEqual(state[collection],[]);
    }
    assert.deepEqual(launchTasks,[]);
    assert.ok(optionalTaskTemplates.length>0);
    assert.ok(optionalTaskTemplates.every(template=>template.dueDate===''));
  } finally {await cleanup(directory);}
});

test('initialisation preserves existing private records, dates and revision on repeated calls', async () => {
  const directory=await temporary();
  try {
    const store=new OperationsStore(directory);
    await store.save('tasks',{title:'Existing private task',status:'active',dueDate:'2026-11-11'});
    const before=await store.read();
    const first=await initialiseOperations(store);
    const again=await initialiseOperations(store);
    assert.equal(first.added,0);
    assert.equal(again.added,0);
    assert.equal(first.total,1);
    assert.equal(again.total,1);
    assert.deepEqual(await store.read(),before);
  } finally {await cleanup(directory);}
});

test('Windows UTF-8 BOM backups are readable and invalid revisions fail closed', async () => {
  const directory=await temporary();
  try {
    const store=new OperationsStore(directory);
    await writeFile(store.file,'\uFEFF'+JSON.stringify(model.fresh()));
    assert.equal((await store.read()).revision,0);
    await writeFile(store.file,JSON.stringify({...model.fresh(),revision:'1'}));
    await assert.rejects(store.save('tasks',{title:'Cannot overwrite damaged state'}),/damaged/);
    assert.equal(JSON.parse(await readFile(store.file,'utf8')).revision,'1');
  } finally {await cleanup(directory);}
});
