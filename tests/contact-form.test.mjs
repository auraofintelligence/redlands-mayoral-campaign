import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHmac, randomUUID } from 'node:crypto';
import vm from 'node:vm';

const source=await readFile(new URL('../integrations/contact-form/Code.gs',import.meta.url),'utf8');
const example={name:'Example visitor',email:'visitor@example.org',topic:'general',message:'Please clarify the source for this public item.',website:''};
function event(values=example){const body=new URLSearchParams(values).toString();return {parameter:values,parameters:Object.fromEntries(Object.entries(values).map(([key,value])=>[key,[value]])),contentLength:Buffer.byteLength(body),postData:{type:'application/x-www-form-urlencoded',contents:body}};}
function runtime(options={}){
  const properties={OWNER_EMAIL:'owner@example.org',ROOT_FOLDER_ID:'root-folder',INBOUND_FOLDER_ID:'inbound-folder',RATE_LIMIT_SECRET:'test-secret'};
  const files=[];
  const owner=()=>({getEmail:()=>options.effectiveOwner||'owner@example.org'});
  const root={getId:()=> 'root-folder',getOwner:owner,getSharingAccess:()=>options.shared?'ANYONE':'PRIVATE',getEditors:()=>[],getViewers:()=>[]};
  const inbound={...root,getId:()=> 'inbound-folder',getParents:()=>{let read=false;return {hasNext:()=>!read,next:()=>{read=true;return root;}};},createFile:(name,content)=>{if(options.storageFails)throw new Error('Private storage issue');files.push({name,content});return {getBlob:()=>({getDataAsString:()=>options.readbackFails?'bad readback':content})};}};
  const sandbox={Date,Number,JSON,String,Object,Array,Error,PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]||null,setProperty:(key,value)=>{properties[key]=value;}})},Session:{getEffectiveUser:owner,getActiveUser:owner},LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},DriveApp:{Access:{PRIVATE:'PRIVATE'},getFolderById:id=>{if(id==='root-folder')return root;if(id==='inbound-folder')return inbound;throw new Error('Unexpected storage ID');}},Utilities:{getUuid:randomUUID,computeHmacSha256Signature:(value,key)=>Array.from(createHmac('sha256',key).update(value).digest())},MimeType:{PLAIN_TEXT:'text/plain'},HtmlService:{createHtmlOutput:html=>({html,setTitle(){return this;}})}};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);return {sandbox,files,properties};
}

test('contact endpoint acknowledges only a saved and read-back private JSON record',()=>{
  const {sandbox,files}=runtime();
  const result=sandbox.doPost(event({...example,updates:'yes',message:'<script>alert(1)</script> =SUM(1,2)'}));
  assert.match(result.html,/<h1>Message received<\/h1>/);
  assert.equal(files.length,1);
  const saved=JSON.parse(files[0].content);
  assert.equal(saved.consentStatus,'requested');
  assert.equal(saved.message,'<script>alert(1)</script> =SUM(1,2)');
  assert.ok(result.html.includes(saved.reference));
  assert.ok(!result.html.includes(example.email));
  assert.ok(!result.html.includes(example.name));
  assert.ok(!result.html.includes('owner@example.org'));
  assert.ok(!result.html.includes('<script>'));
});

test('invalid fields, honeypot, oversized bodies and duplicates never receive a receipt or create files',()=>{
  const {sandbox,files}=runtime();
  const samples=[event({...example,website:'spam'}),event({...example,email:'invalid'}),event({...example,topic:'voting-preferences'}),event({...example,extra:'unexpected'}),event({...example,updates:'automatic'}),event({...example,message:'a'.repeat(5001)})];
  const oversized=event();oversized.contentLength=40000;samples.push(oversized);
  const repeated=event();repeated.parameters.email.push('another@example.org');samples.push(repeated);
  for(const input of samples){const result=sandbox.doPost(input);assert.match(result.html,/<h1>Message not submitted<\/h1>/);assert.ok(!result.html.includes('<strong>Reference:</strong>'));}
  assert.equal(files.length,0);
});

test('storage failure and failed readback cannot claim receipt',()=>{
  for(const options of [{storageFails:true},{readbackFails:true},{shared:true},{effectiveOwner:'different@example.org'}]){
    const {sandbox}=runtime(options);
    const result=sandbox.doPost(event());
    assert.match(result.html,/<h1>Receipt not confirmed<\/h1>/);
    assert.ok(!result.html.includes('<strong>Reference:</strong>'));
    assert.ok(!result.html.includes('Private storage issue'));
  }
});

test('hashed-address rate limit persists without a plaintext address',()=>{
  const {sandbox,files,properties}=runtime();
  for(let i=0;i<3;i++)assert.match(sandbox.doPost(event()).html,/<h1>Message received<\/h1>/);
  assert.match(sandbox.doPost(event()).html,/too many submissions/);
  assert.equal(files.length,3);
  assert.ok(!properties.CONTACT_RATE_STATE.includes(example.email));
});

test('global rate limit caps writes across different submitted addresses',()=>{
  const {sandbox,files}=runtime();
  for(let i=0;i<50;i++)assert.match(sandbox.doPost(event({...example,email:`visitor${i}@example.org`})).html,/<h1>Message received<\/h1>/);
  assert.match(sandbox.doPost(event({...example,email:'one-more@example.org'})).html,/too many submissions/);
  assert.equal(files.length,50);
});

test('contact manifest has anonymous intake and no Gmail or mail-sending scope',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../integrations/contact-form/appsscript.json',import.meta.url),'utf8'));
  assert.equal(manifest.webapp.access,'ANYONE_ANONYMOUS');
  assert.equal(manifest.webapp.executeAs,'USER_DEPLOYING');
  assert.ok(manifest.oauthScopes.every(scope=>!scope.includes('gmail')&&!scope.includes('mail.google')));
  assert.ok(!/@gmail\.com/i.test(source));
});
