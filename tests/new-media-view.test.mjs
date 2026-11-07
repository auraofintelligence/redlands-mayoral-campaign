import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';
import model from '../operations/model.cjs';

const source=await readFile(new URL('../control-room/public/app.js',import.meta.url),'utf8');
function entry(id,name,extra={}){
  return {id,name,kind:'Podcast',area:'Brisbane',region:'Brisbane',description:'Public source fixture.',website:`https://example.org/${id}`,contactUrl:null,coverageUrl:null,coverageTitle:null,coverageDate:null,verification:'outlet-verified',sourceUrls:[`https://example.org/${id}`],tags:['local'],checkedOn:'2026-11-08',notes:'Example record for interface behaviour.',...extra};
}
const fixtures=[
  entry('local-podcast','Brisbane independent podcast',{discoveryGroup:'new-media',formats:['podcast','social'],tags:['local','women-focused','relationships','banter'],sampleUrl:'https://example.org/transport-episode',sampleTitle:'A conversation about public transport',sampleDate:'2026-10-01'}),
  entry('local-video','Gold Coast creator',{kind:'Video creator',area:'Gold Coast',region:'Gold Coast',discoveryGroup:'new-media',formats:['video','social'],tags:['university','student-media']}),
  entry('local-election','Redlands podcast',{area:'Redland City',region:'Redland City',discoveryGroup:'new-media',formats:['podcast','article'],verification:'election-coverage-verified',coverageUrl:'https://example.org/redland-election',coverageTitle:'Redland election report',coverageDate:'2026-11-05'}),
  entry('national-podcast','National podcast',{area:'Australia',region:'Australia',discoveryGroup:'national-podcasts',formats:['podcast'],sampleUrl:'https://example.org/national-interview',sampleTitle:'A guest interview about public life',sampleDate:'2026-10-04'}),
  entry('traditional-paper','Traditional newspaper',{kind:'traditional-media',formats:['article']}),
  entry('women-publication','Women’s public affairs publication',{kind:'Online publication',area:'Australia',region:'Australia',discoveryGroup:'women-focused',formats:['newsletter','article'],tags:['women-focused','current-events']}),
  entry('music-radio','Queensland house music show',{kind:'music-show',discoveryGroup:'music',formats:['radio'],tags:['edm','house','reggae'],sampleUrl:'https://example.org/music-episode',sampleTitle:'New recorded music',submissionNotes:'Recorded tracks may be submitted through the linked form.',aiPolicy:'No published AI music policy verified. Ask before submitting.'}),
  entry('music-podcast','Australian music conversations',{area:'Australia',region:'Australia',discoveryGroup:'music',formats:['podcast'],tags:['pop','interviews'],submissionNotes:'Interview enquiry form. No live performance booking route verified.'}),
  entry('university-society','University music society',{kind:'Student society',discoveryGroup:'university',formats:['social'],tags:['university','music'],participationNotes:'Membership criteria are published by the society.'})
];

// Run the real application and event handlers against a minimal browser shell.
// Replacing a view recreates its form controls, as innerHTML does in a browser.
async function openDirectory(hash='#new-media'){
  const nodes=new Map(),handlers=new Map(),windowHandlers=new Map();
  function createNode(selector,dataset={}){
    let html='';const descendants=new Set(),classes=new Set();
    const node={dataset,value:'',textContent:'',className:'',disabled:false,open:false,
      classList:{add:(...items)=>items.forEach(item=>classes.add(item)),remove:(...items)=>items.forEach(item=>classes.delete(item)),contains:item=>classes.has(item),toggle(item,on){const next=on??!classes.has(item);if(next)classes.add(item);else classes.delete(item);return next;}},
      setAttribute(){},removeAttribute(){},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;}
    };
    Object.defineProperty(node,'innerHTML',{get:()=>html,set:value=>{
      html=value;
      for(const id of descendants)nodes.delete(id);
      descendants.clear();
      for(const match of value.matchAll(/\bid="([^"]+)"/g)){
        const id=`#${match[1]}`;descendants.add(id);createNode(id);
      }
    }});
    nodes.set(selector,node);return node;
  }
  for(const id of ['#view','#editor','#screen-title','#storage-status','#quick-add','#menu-toggle','#sidebar','#toast'])createNode(id);
  const navigation=['overview','new-media','national-podcasts','women-media','music','university','media'].map(view=>createNode(`nav-${view}`,{view}));
  const document={querySelector:selector=>nodes.get(selector)||null,querySelectorAll:selector=>selector==='[data-view]'?navigation:[],addEventListener:(type,handler)=>handlers.set(type,handler),title:''};
  const sandbox={window:{CampaignModel:model},document,location:{hostname:'example.test',port:'',hash},
    localStorage:{getItem:()=>null,setItem:()=>{throw new Error('Browsing must not write private records.');}},
    navigator:{},crypto:{randomUUID},structuredClone,URL,
    fetch:async url=>({ok:true,json:async()=>url.endsWith('media.json')?structuredClone(fixtures):url.endsWith('campaign.json')?{repository:'https://example.org/repository'}:[]}),
    addEventListener:(type,handler)=>windowHandlers.set(type,handler),setTimeout:()=>1,clearTimeout:()=>{}
  };
  vm.createContext(sandbox);vm.runInContext(source,sandbox,{timeout:1000});
  for(let i=0;i<20&&nodes.get('#storage-status').textContent!=='Saved in this browser';i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(nodes.get('#storage-status').textContent,'Saved in this browser',nodes.get('#view').innerHTML);
  return {
    node:selector=>nodes.get(selector),
    results:()=>nodes.get('#media-results').innerHTML,
    async choose(id,value){const node=nodes.get(`#${id}`);assert.ok(node,`Missing ${id}`);node.value=value;await handlers.get(id==='media-search'?'input':'change')({target:{id}});},
    async navigate(view){const nav={dataset:{view}};await handlers.get('click')({target:{closest:selector=>selector==='[data-view]'?nav:null}});},
    async action(action,id){const control={dataset:{action,id}};await handlers.get('click')({target:{closest:selector=>selector==='[data-action]'?control:null}});},
    async reset(){const action={dataset:{action:'reset-media'}};await handlers.get('click')({target:{closest:selector=>selector==='[data-action]'?action:null}});}
  };
}

test('local creator view excludes national and traditional entries while all-media retains them',async()=>{
  const app=await openDirectory();
  assert.match(app.node('#screen-title').textContent,/Local podcasts and creators/);
  assert.equal(app.node('#media-count').textContent,'3 of 3 local podcast and creator entries');
  for(const id of ['local-podcast','local-video','local-election'])assert.ok(app.results().includes(`id="source-${id}"`));
  assert.doesNotMatch(app.results(),/source-national-podcast|source-traditional-paper/);
  await app.navigate('media');
  assert.equal(app.node('#media-count').textContent,'9 of 9 entries');
  assert.match(app.results(),/source-national-podcast/);
  assert.match(app.results(),/source-traditional-paper/);
  await app.navigate('overview');
  const home=app.node('#view').innerHTML;
  assert.match(home,/data-view-target="new-media"/);
  assert.match(home,/data-view-target="national-podcasts"/);
  assert.doesNotMatch(home,/source-national-podcast|source-traditional-paper/);
});

test('national podcasts open directly and stay separate from local and all-media directories',async()=>{
  const app=await openDirectory('#national-podcasts');
  assert.equal(app.node('#screen-title').textContent,'National political podcasts');
  assert.equal(app.node('#media-count').textContent,'1 of 1 national political podcast entries');
  assert.equal(app.node('#media-region'),undefined,'National programs do not use a local area filter.');
  assert.match(app.results(),/source-national-podcast/);
  assert.doesNotMatch(app.results(),/source-local-|source-traditional-paper/);
  assert.match(app.results(),/href="https:\/\/example\.org\/national-interview"/);
  assert.match(app.results(),/Example work/);
  assert.doesNotMatch(app.results(),/Election source found/);
  await app.choose('media-search','guest interview');
  assert.equal(app.node('#media-count').textContent,'1 of 1 national political podcast entries');
  await app.choose('media-format','video');
  assert.match(app.results(),/No matching sources/);
  await app.reset();
  assert.equal(app.node('#media-count').textContent,'1 of 1 national political podcast entries');
  await app.choose('media-evidence','coverage');
  assert.match(app.results(),/No matching sources/,'A national guest interview does not establish Redland election coverage.');
  await app.navigate('new-media');
  assert.equal(app.node('#media-count').textContent,'3 of 3 local podcast and creator entries');
  assert.doesNotMatch(app.results(),/source-national-podcast/);
  await app.choose('media-region','Brisbane');
  await app.navigate('national-podcasts');
  assert.equal(app.node('#media-count').textContent,'1 of 1 national political podcast entries','Local filters must not leak into the national view.');
  assert.equal(app.node('#media-region'),undefined);
  await app.navigate('media');
  assert.equal(app.node('#media-count').textContent,'9 of 9 entries');
  for(const id of ['local-podcast','local-video','local-election','national-podcast','traditional-paper','women-publication'])assert.ok(app.results().includes(`id="source-${id}"`));
});

test('women-focused media includes group and tagged sources once without changing their local scope',async()=>{
  const app=await openDirectory('#women-media');
  assert.equal(app.node('#screen-title').textContent,'Women-focused media');
  assert.equal(app.node('#media-count').textContent,'2 of 2 women-focused media entries');
  assert.match(app.results(),/source-local-podcast/);
  assert.match(app.results(),/source-women-publication/);
  assert.equal((app.results().match(/id="source-women-publication"/g)||[]).length,1,'A record matching both group and tag appears once.');
  assert.doesNotMatch(app.results(),/source-national-podcast|source-traditional-paper|source-local-video/);
  await app.choose('media-format','newsletter');
  assert.equal(app.node('#media-count').textContent,'1 of 2 women-focused media entries');
  assert.doesNotMatch(app.results(),/source-local-podcast/);
  await app.reset();
  assert.equal(app.node('#media-count').textContent,'2 of 2 women-focused media entries');
  await app.navigate('new-media');
  assert.equal(app.node('#media-count').textContent,'3 of 3 local podcast and creator entries');
  assert.match(app.results(),/source-local-podcast/);
  assert.doesNotMatch(app.results(),/source-women-publication/);
  await app.navigate('media');
  assert.equal(app.node('#media-count').textContent,'9 of 9 entries');
  assert.equal((app.results().match(/id="source-local-podcast"/g)||[]).length,1);
});

test('format, area and search filters combine and reset within the chosen directory',async()=>{
  const app=await openDirectory();
  await app.choose('media-format','podcast');
  assert.equal(app.node('#media-count').textContent,'2 of 3 local podcast and creator entries');
  assert.doesNotMatch(app.results(),/source-local-video/);
  await app.choose('media-region','Brisbane');
  assert.equal(app.node('#media-count').textContent,'1 of 3 local podcast and creator entries');
  assert.match(app.results(),/source-local-podcast/);
  await app.choose('media-search','public transport');
  assert.equal(app.node('#media-count').textContent,'1 of 3 local podcast and creator entries','Search includes example-work titles.');
  await app.choose('media-region','Gold Coast');
  assert.match(app.results(),/No matching sources/);
  await app.reset();
  assert.equal(app.node('#media-count').textContent,'3 of 3 local podcast and creator entries');
  await app.navigate('media');
  await app.choose('media-format','podcast');
  assert.equal(app.node('#media-count').textContent,'4 of 9 entries');
  assert.match(app.results(),/source-national-podcast/);
});

test('example work is visible without being promoted to verified election coverage',async()=>{
  const app=await openDirectory();
  const card=app.results().match(/<article[^>]*id="source-local-podcast"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card);
  assert.match(card,/Example work/);
  assert.match(card,/href="https:\/\/example\.org\/transport-episode"/);
  assert.match(card,/2026-10-01/);
  assert.match(card,/Current Redland election coverage has not been verified/);
  assert.doesNotMatch(card,/Election source found|badge success/);
  await app.choose('media-evidence','coverage');
  assert.equal(app.node('#media-count').textContent,'1 of 3 local podcast and creator entries');
  assert.match(app.results(),/source-local-election/);
  assert.match(app.results(),/href="https:\/\/example\.org\/redland-election"/);
  assert.doesNotMatch(app.results(),/source-local-podcast/);
});


test('music directory filters recorded-music options and displays submission and AI policy facts',async()=>{
  const app=await openDirectory('#music');
  assert.equal(app.node('#screen-title').textContent,'Music shows and podcasts');
  assert.equal(app.node('#media-count').textContent,'2 of 2 music show and podcast entries');
  assert.match(app.node('#view').innerHTML,/A Protopian Gambit is complete/);
  assert.match(app.node('#view').innerHTML,/wrote the lyrics and used generative AI/);
  assert.match(app.node('#view').innerHTML,/do not currently perform it live/);
  assert.match(app.results(),/Recorded tracks may be submitted/);
  assert.match(app.results(),/No published AI music policy verified/);
  assert.doesNotMatch(app.results(),/Current Redland election coverage|separate from verified Redland election coverage|source-national-podcast/);
  await app.choose('media-format','radio');
  await app.choose('media-topic','house');
  await app.choose('media-region','Brisbane');
  assert.equal(app.node('#media-count').textContent,'1 of 2 music show and podcast entries');
  assert.match(app.results(),/source-music-radio/);
  await app.choose('media-search','recorded tracks');
  assert.equal(app.node('#media-count').textContent,'1 of 2 music show and podcast entries','Submission notes are searchable.');
  await app.choose('media-topic','pop');
  assert.match(app.results(),/No matching sources/);
  await app.reset();
  assert.equal(app.node('#media-count').textContent,'2 of 2 music show and podcast entries');
  await app.action('research-source','music-radio');
  assert.match(app.node('#editor').innerHTML,/He wrote the lyrics and used generative AI/);
  assert.match(app.node('#editor').innerHTML,/published generative AI policy/);
  assert.doesNotMatch(app.node('#editor').innerHTML,/mayoral by-election/);
  await app.navigate('overview');
  assert.match(app.node('#view').innerHTML,/data-view-target="music"/);
});

test('women-focused topics and regions filter without carrying into other directories',async()=>{
  const app=await openDirectory('#women-media');
  assert.match(app.node('#view').innerHTML,/banter, relationships, pop culture, current events/);
  assert.doesNotMatch(app.results(),/Current Redland election coverage|separate from verified Redland election coverage/);
  assert.match(app.node('#view').innerHTML,/<label class="field" for="media-evidence" hidden>/);
  await app.choose('media-topic','relationships');
  assert.equal(app.node('#media-count').textContent,'1 of 2 women-focused media entries');
  await app.choose('media-region','Australia');
  assert.match(app.results(),/No matching sources/);
  await app.reset();
  assert.equal(app.node('#media-count').textContent,'2 of 2 women-focused media entries');
  await app.action('research-source','local-podcast');
  assert.match(app.node('#editor').innerHTML,/general banter, relationships, culture and current events/);
  assert.doesNotMatch(app.node('#editor').innerHTML,/mayoral by-election/);
  await app.navigate('music');
  assert.equal(app.node('#media-count').textContent,'2 of 2 music show and podcast entries');
});

test('university networks reuse tagged student media and preserve existing local discovery',async()=>{
  const app=await openDirectory('#university');
  assert.equal(app.node('#screen-title').textContent,'University networks');
  assert.equal(app.node('#media-count').textContent,'2 of 2 university network entries');
  assert.match(app.results(),/source-local-video/);
  assert.match(app.results(),/source-university-society/);
  assert.doesNotMatch(app.results(),/Current Redland election coverage|source-music-radio/);
  await app.choose('media-region','Gold Coast');
  assert.equal(app.node('#media-count').textContent,'1 of 2 university network entries');
  await app.reset();
  assert.equal(app.node('#media-count').textContent,'2 of 2 university network entries');
  await app.action('research-source','local-video');
  assert.match(app.node('#editor').innerHTML,/actual membership, contribution or event participation rules/);
  assert.doesNotMatch(app.node('#editor').innerHTML,/mayoral by-election/);
  await app.navigate('new-media');
  assert.equal(app.node('#media-count').textContent,'3 of 3 local podcast and creator entries');
  assert.match(app.results(),/source-local-video/);
  await app.navigate('overview');
  assert.match(app.node('#view').innerHTML,/data-view-target="university"/);
});
