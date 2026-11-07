import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory=fileURLToPath(new URL('../data/',import.meta.url));
const files=(await readdir(directory)).filter(file=>/^media-(?:radio|print-online|organisations)\.json$/.test(file)).sort();
const datasets=await Promise.all(files.map(async file=>({file,rows:JSON.parse((await readFile(path.join(directory,file),'utf8')).replace(/^\uFEFF/,''))})));
const records=datasets.flatMap(({file,rows})=>Array.isArray(rows)?rows.map(row=>({file,row})):[]);
const fields=['id','name','kind','area','description','website','contactUrl','coverageUrl','coverageTitle','coverageDate','verification','sourceUrls','tags','checkedOn','notes'];
function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
function publicURL(value,label){assert.equal(typeof value,'string',label);const url=new URL(value);assert.equal(url.protocol,'https:',label);assert.equal(url.username,'',label);assert.equal(url.password,'',label);assert.ok(!['localhost','127.0.0.1'].includes(url.hostname),label);}

test('directory source files use the public options schema and unique identifiers',context=>{
  for(const required of ['media-radio.json','media-print-online.json','media-organisations.json'])assert.ok(files.includes(required),`${required} must exist.`);
  context.diagnostic(`Validated source files: ${files.join(', ')}`);
  const ids=new Set();
  for(const {file,rows} of datasets){assert.ok(Array.isArray(rows),`${file} must contain an array.`);assert.ok(rows.length,`${file} must not be empty.`);}
  for(const {file,row} of records){
    for(const field of fields)assert.ok(Object.hasOwn(row,field),`${file}: missing ${field}`);
    assert.match(row.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.ok(!ids.has(row.id),`Duplicate identifier ${row.id}`);ids.add(row.id);
    for(const key of ['name','kind','area','description','notes'])assert.ok(typeof row[key]==='string'&&row[key].trim(),`${row.id}: ${key}`);
    assert.ok(Array.isArray(row.sourceUrls)&&row.sourceUrls.length>0,`${row.id}: sources`);
    assert.ok(Array.isArray(row.tags)&&row.tags.length>0&&row.tags.every(tag=>typeof tag==='string'&&tag.trim()),`${row.id}: tags`);
    assert.equal(new Set(row.tags).size,row.tags.length,`${row.id}: duplicate tag`);
    if(file==='media-radio.json')assert.equal(row.kind,'Radio');
    assert.ok(validDate(row.checkedOn),`${row.id}: checkedOn must be an actual calendar date.`);
    assert.ok(['outlet-verified','election-coverage-verified'].includes(row.verification),`${row.id}: verification state`);
  }
});

test('directory links are public HTTPS sources without copied email addresses or em dashes',()=>{
  for(const {row} of records){
    publicURL(row.website,`${row.id}: website`);
    if(row.contactUrl!==null)publicURL(row.contactUrl,`${row.id}: contactUrl`);
    for(const url of row.sourceUrls)publicURL(url,`${row.id}: source`);
    const serialised=JSON.stringify(row);
    assert.ok(!/\u2014/.test(serialised),`${row.id}: em dash`);
    assert.ok(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialised),`${row.id}: copied email address`);
  }
});

test('election coverage is separately evidenced and never inferred from outlet verification',()=>{
  for(const {row} of records){
    if(row.verification==='outlet-verified'){
      assert.equal(row.coverageUrl,null,`${row.id}: unverified coverage URL`);
      assert.equal(row.coverageTitle,null,`${row.id}: unverified coverage title`);
      assert.equal(row.coverageDate,null,`${row.id}: unverified coverage date`);
    }else{
      publicURL(row.coverageUrl,`${row.id}: coverage URL`);
      assert.ok(typeof row.coverageTitle==='string'&&row.coverageTitle.trim(),`${row.id}: coverage title`);
      assert.ok(row.sourceUrls.includes(row.coverageUrl),`${row.id}: exact coverage URL must be a source`);
      assert.ok(row.coverageDate===null||validDate(row.coverageDate),`${row.id}: coverage date`);
      if(row.coverageDate!==null)assert.ok(row.coverageDate<=row.checkedOn,`${row.id}: future coverage date`);
      else assert.match(row.notes,/date|undated/i,`${row.id}: explain an unknown publication date`);
    }
  }
});
