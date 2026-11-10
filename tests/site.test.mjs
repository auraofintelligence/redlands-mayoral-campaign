import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {validatePublicFinance} from '../scripts/campaign-participation.mjs';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const read=relative=>readFile(path.join(root,relative),'utf8');
async function files(dir){let found=[];for(const name of await readdir(dir)){const file=path.join(dir,name);found.push(...((await stat(file)).isDirectory()?await files(file):[file]));}return found;}
test('public output contains only the publication allowlist, never private operations',async()=>{
 const allowed=new Set(['assets','downloads','projects','LICENCE.md','.nojekyll','favicon.ico','sitemap.xml','robots.txt','llms.txt','collaborate.html','licensing.html','volunteer.html','donations.html','reporting.html','index.html','projects.html','ideas.html','about.html','interview.html','music.html','media.html','contact.html','updates.html','sitemap.html','credits.html','privacy.html','licence.html','404.html','campaign.html','calendar.html','transparency.html']);
 for(const name of await readdir(dist)) assert.ok(allowed.has(name),`Unexpected public file: ${name}`);
 assert.ok(!(await readdir(dist)).includes('data'),'Obsolete project register was published alongside the current catalogue');
 for(const file of await files(dist)) assert.doesNotMatch(path.relative(dist,file),/(^|[\\/])(private|operations|integrations|\.env|\.git)([\\/]|$)/);
});
test('every internal page, asset and anchor resolves',async()=>{
 for(const file of (await files(dist)).filter(v=>v.endsWith('.html'))){
  const name=path.relative(dist,file),html=await readFile(file,'utf8');
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]*)"/g)){
   if(/^(https?:|mailto:|data:)/.test(url))continue;
   const [pathname,anchor]=url.split('#');const clean=pathname.split('?')[0];
   const target=clean?path.resolve(path.dirname(file),clean):file;assert.ok(target.startsWith(dist+path.sep));
   assert.ok((await stat(target)).isFile(),`${name}: missing ${url}`);
   if(anchor){const source=await readFile(target,'utf8');assert.ok(source.includes(`id="${anchor}"`),`${name}: missing anchor ${url}`);}
  }
 }
});
test('pages have unique titles, language, accessible landmarks and civic status',async()=>{
 const titles=new Set();
 for(const file of (await files(dist)).filter(v=>v.endsWith('.html')&&path.basename(v)!=='404.html')){
  const html=await readFile(file,'utf8'),title=html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title);assert.ok(!titles.has(title));titles.add(title);
  assert.match(html,/<html lang="en-AU">/);assert.match(html,/<main id="main"/);assert.match(html,/href="#main"/);
  assert.equal((html.match(/<h1>/g)||[]).length,1);assert.match(html,/<link rel="canonical"/);
  assert.match(html,/not contesting the 2026 Redland City mayoral by-election/);assert.match(html,/content="index, follow"/);assert.doesNotMatch(html,/Publication authorisation is incomplete|Self-directed campaign exploration/);
 }
 assert.ok(titles.size>=123);
 const home=await read('dist/index.html');assert.match(home,/<main id="main"/);assert.match(home,/Ideas into practice/);assert.match(home,/assets\/visual.js/);
 const publicNames=await readdir(dist);
 for(const forbidden of ['outreach.html','app.js','model.js','control.css'])assert.ok(!publicNames.includes(forbidden),'Private workspace published: '+forbidden);
 for(const forbidden of ['media.json','projects.json','campaign.json'])assert.ok(!(await readdir(path.join(dist,'assets/data'))).includes(forbidden),'Private workspace data published: '+forbidden);
 for(const file of (await files(dist)).filter(v=>v.endsWith('.html'))){const html=await readFile(file,'utf8');assert.ok(!html.includes('href="outreach.html')&&!html.includes('href="../outreach.html'),'Public command-centre link: '+file);}
 assert.ok(!(await read('dist/sitemap.xml')).includes('outreach.html'));
});
test('source register is pinned, unique and covers named recent projects',async()=>{
 const data=JSON.parse(await read('data/projects.json'));assert.ok(data.length>=30);
 assert.equal(new Set(data.map(p=>p.id)).size,data.length);
 for(const p of data){assert.match(p.sourceCommit,/^[a-f0-9]{40}$/);assert.ok(['published work','proposal','prototype'].includes(p.status));assert.match(p.repo,/^https:\/\/github.com\/auraofintelligence\//);}
 for(const id of ['sovereign-capacity-lab','outreach-cms','household-bill-check','aura-verse-box','UNGA81-Luke-Hayes'])assert.ok(data.some(p=>p.id===id));
});
test('artwork matches original provenance hashes',async()=>{
 const provenance=JSON.parse(await read('public/assets/images/provenance.json'));
 assert.equal(provenance.assets.length,4);
 for(const asset of provenance.assets){const bytes=await readFile(path.join(root,'public',asset.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.path);}
 const photos=JSON.parse(await read('public/assets/photos/provenance.json'));
 assert.equal(photos.photos.length,3);
 for(const photo of photos.photos){const bytes=await readFile(path.join(root,'public/assets/photos',photo.webFile));assert.equal(createHash('sha256').update(bytes).digest('hex'),photo.sha256);assert.ok(photo.licenceUrl.startsWith('https://creativecommons.org/'));}
});
test('public copy has no em dashes, exposed campaign email or tracking scripts',async()=>{
 for(const file of await files(dist)){if(!/\.(html|js|css|json|md|txt|xml)$/.test(file))continue;const text=await readFile(file,'utf8');assert.ok(!text.includes('\u2014'),`Em dash in ${file}`);}
 const js=await read('public/assets/visual.js');assert.doesNotMatch(js,/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\b/);
 const contact=await read('dist/contact.html'),config=JSON.parse(await read('data/campaign.json'));
 if(config.contactFormUrl){assert.ok(contact.includes(`action="${config.contactFormUrl}"`));assert.doesNotMatch(contact,/<fieldset disabled>/);assert.match(contact,/accepts it for sending/);}
 else {assert.match(contact,/<fieldset disabled>/);assert.match(contact,/not connected|unavailable|not active|not accepting messages/i);}
 assert.doesNotMatch(contact,/mailto:|gmail\.com/);
 for(const file of (await files(dist)).filter(v=>v.endsWith('.html'))){assert.doesNotMatch(await readFile(file,'utf8'),/[A-Za-z0-9._%+-]+@gmail\.com|mailto:/);}
});

test('all visual projects have reviewed descriptions and existing credited rasters, with private notes excluded',async()=>{
 const content=JSON.parse(await read('data/visual-content.json')),images=JSON.parse(await read('data/project-images.json'));
 const excluded=JSON.parse(await read('data/public-project-exclusions.json')).excludedRepos;
 const projects=content.groups.flatMap(g=>g.projects);assert.equal(projects.length,110);assert.equal(content.options.length,52);
 assert.equal(new Set(projects.map(p=>p.repoName)).size,110);
 for(const repo of ['straddie-twins','straddie-digital-twin-explainer'])assert.ok(projects.some(p=>p.repoName===repo));
 for(const repo of excluded){assert.ok(!projects.some(p=>p.repoName===repo));for(const p of projects)assert.ok(!p.adjacentProjects.some(a=>a.repoName===repo));}
 for(const p of projects)assert.ok(!excluded.includes(p.repoName));
 assert.equal(content.groups[0].id,'redlands-council-information');assert.equal(content.groups[0].projects[0].repoName,'Redlands_draft_ES2026-2031');assert.equal(content.groups[1].id,'community-places');assert.equal(content.groups.at(-1).id,'space-solar');
 assert.ok(content.groups.findIndex(g=>g.id==='care-wellbeing')<content.groups.findIndex(g=>g.id==='sovereign-capacity'));
 const hashes=new Set();
 for(const p of projects){const i=images[p.repoName],bytes=await readFile(path.join(dist,i.src)),hash=createHash('sha256').update(bytes).digest('hex');assert.ok(!hashes.has(hash),`Repeated project cover: ${p.repoName}`);hashes.add(hash);assert.equal(hash,i.sha256);assert.ok(bytes.length<=768*1024,`Oversized project image: ${p.repoName}`);assert.ok(i.thumbnailSrc);assert.ok((await stat(path.join(dist,i.thumbnailSrc))).size<=150*1024,`Oversized card image: ${p.repoName}`);}
 for(const p of projects){assert.ok(p.description.length>30);const image=images[p.repoName];assert.ok(image?.credit&&image?.licence&&image?.alt);assert.match(image.src,/\.(webp|jpg|png)$/);assert.ok((await stat(path.join(dist,image.src))).isFile());}
 const publicData=await read('dist/assets/data/visual-content.json');assert.doesNotMatch(publicData,/myWording|myNotes|storageId|[CGL]:[\\/]/);
 const icon=await readFile(path.join(dist,'favicon.ico'));assert.equal(icon.readUInt16LE(2),1);
 const music=await read('dist/music.html');assert.match(music,/Severe language/);assert.match(music,/music-warning-dialog/);assert.doesNotMatch(music,/<video[^>]+autoplay|autoplay=1/);assert.equal((music.match(/<iframe /g)||[]).length,2);
 const album=JSON.parse(await read('data/visual-music.json'));assert.equal(album.tracks.length,22);assert.equal(album.lyricSheet.entries.length,22);assert.equal(new Set(album.lyricSheet.entries.map(entry=>entry.number)).size,22);assert.match(music,/<template id="music-sheet-template">/);assert.ok(!album.lyricSheet.entries.some(entry=>entry.title.toLowerCase()==='strange but true'));
});

test('reference material uses the real GitHub Wiki and published project destinations',async()=>{
 const wiki='https://github.com/auraofintelligence/redlands-mayoral-campaign/wiki/';
 const home=await read('dist/index.html');assert.ok(home.includes(`href="${wiki}Home"`));assert.doesNotMatch(home,/wiki\/index\.html/);
 assert.ok(!(await readdir(dist)).includes('wiki'));
 const wikiFiles=await readdir(path.join(root,'docs/wiki'));assert.equal(wikiFiles.length,59);
 assert.match(await read('docs/wiki/44-redlands-sovereign-capacity-for-the-age-of-superintelligence.md'),/## What it needs to work/);
 for(const entry of JSON.parse(await read('data/visual-content.json')).options)for(const key of ['title','purpose','redlandsAdaptation','route','mayoralCouncilLever','outside','partners','conflictBoundary','strategicPurpose','firstPrinciples','localApplications','leadershipExample','researchRationale'])if(entry[key])assert.doesNotMatch(entry[key],/\b(?:you|your|yourself|yours)\b/i,`Author address in public Wiki entry ${entry.id} ${key}`);
 const content=JSON.parse(await read('data/visual-content.json')),destinations=JSON.parse(await read('data/project-destinations.json')).destinations;
 for(const p of content.groups.flatMap(g=>g.projects)){const destination=destinations[p.repoName.toLowerCase()];assert.ok(destination);if(destination.kind==='website'){const filename=p.repoName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');assert.ok((await read(`dist/projects/${filename}.html`)).includes(`href="${destination.url}"`),p.repoName);}}
});

test('old workspace bookmarks stay on the public home without redirects or storage access',async()=>{
 const script=await read('public/assets/visual.js');
 for(const hash of ['overview','new-media','national-podcasts','women-media','music','university','unions','community-networks','media','plan','calendar','outreach','publishing','inbox','projects','agents','budget','activity','settings']){
  const redirects=[];
  const context={document:{querySelector:selector=>selector==='.home-hero'?{}:null,querySelectorAll:()=>[]},location:{hash:'#'+hash,search:'',replace:url=>redirects.push(url)},URLSearchParams,localStorage:{getItem:()=>assert.fail('Public page read private browser records'),setItem:()=>assert.fail('Public page wrote browser records'),removeItem:()=>assert.fail('Public page deleted browser records')}};
  vm.runInNewContext(script,context);
  assert.deepEqual(redirects,[],`Old bookmark #${hash} redirected away from the public site`);
 }
});

test('legacy public URLs point to current pages and current press information',async()=>{
 const aliases=[['campaign.html','index.html'],['calendar.html','updates.html'],['transparency.html','updates.html']];
 const config=JSON.parse(await read('data/campaign.json'));
 for(const [file,target] of aliases){
  const html=await read('dist/'+file);
  assert.ok(html.includes(`http-equiv="refresh" content="0;url=${target}"`));
  assert.ok(html.includes(`rel="canonical" href="${config.baseUrl}${target}"`));
  assert.doesNotMatch(html,/save chosen possibilities|storage controls|private Drive storage|election explorer/i);
  assert.ok(!(await read('dist/sitemap.xml')).includes(config.baseUrl+file));
 }
 assert.equal(await read('dist/downloads/media-brief.txt'),await read('public/assets/press/Luke-Nathan-Hayes-media-facts.txt'));
 const names=await readdir(path.join(dist,'assets'));
 assert.ok(!names.includes('site.js')&&!names.includes('site.css'),'Obsolete public shell assets remain');
 assert.ok((await read('dist/sitemap.html')).includes('href="updates.html"'));
});

test('published text does not advertise removed outreach routes or personal storage',async()=>{
 for(const file of await files(dist)){
  if(!/\.(html|js|txt|xml)$/.test(file))continue;
  assert.doesNotMatch(await readFile(file,'utf8'),/outreach\.html|redlands-mayoral-command-centre|The home page is a control room|No verified press portrait supplied|save chosen possibilities|explorer[’']s storage controls/,path.relative(dist,file));
 }
});

test('ideas introduce all 52 Wiki entries once through open questions and distinct topic imagery',async()=>{
 const html=await read('dist/ideas.html'),content=JSON.parse(await read('data/visual-content.json'));
 const topics=JSON.parse(await read('data/ideas-navigation.json')).topics;
 assert.equal(topics.length,11);
 const ids=topics.flatMap(topic=>topic.ideas.map(idea=>idea.id));
 assert.equal(new Set(ids).size,52);
 assert.deepEqual([...ids].sort(),content.options.map(idea=>idea.id).sort());
 assert.deepEqual([...html.matchAll(/data-idea-id="(\d+)"/g)].map(match=>match[1]),ids);
 for(const topic of topics){
  assert.ok(topic.question.endsWith('?'));
  for(const idea of topic.ideas)assert.ok(idea.question.endsWith('?'),idea.id);
 }
 const imageSources=[...html.matchAll(/<figure><img src="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(imageSources.length,11);assert.equal(new Set(imageSources).size,11);
 for(const src of imageSources)assert.ok((await stat(path.join(dist,src))).size<150*1024,src);
 assert.match(html,/assets\/ideas\.js/);assert.match(html,/assets\/ideas\.css/);
 assert.match(html,/What have we missed\?/);assert.match(html,/Bring a question or experience/);
 assert.match(html,/idea=01&amp;ideaTitle=/);
 assert.equal((html.match(/>Add a question<\/a>/g)||[]).length,52);
 assert.ok(html.indexOf('ideas-household')<html.indexOf('ideas-sovereign-capacity',html.indexOf('aria-label="Ideas topics"')));
});

test('ideas load the matching script and stylesheet editions after a publication',async()=>{
 const html=await read('dist/ideas.html');
 const assets=[...html.matchAll(/(?:src|href)="(assets\/(?:ideas|visual)\.(?:css|js))\?v=([a-f0-9]{12})"/g)];
 assert.equal(assets.length,4);
 for(const [,file,version] of assets)assert.equal(version,createHash('sha256').update(await readFile(path.join(dist,file))).digest('hex').slice(0,12),file);
});

test('Aura descriptions retain self-reflection and the optional adult Genesis additions',async()=>{
 const content=JSON.parse(await read('data/visual-content.json'));
 const verse=content.options.find(idea=>idea.id==='25');
 for(const term of [/self-reflection/,/digital twin/,/patterning/,/learn more, learn faster/,/Joyful Responsible Abundance/])assert.match(verse.purpose,term);
 const genesis=content.options.find(idea=>idea.id==='14');
 for(const term of [/optional adult/,/healing intent/,/time-stamped biometric/,/pattern recognition/,/Truth Engine.*optional/])assert.match(genesis.purpose,term);
 assert.match(await read('docs/wiki/25-verse-box-public-access-and-installations.md'),/personal digital twin/);
 assert.match(await read('docs/wiki/14-lukes-personal-hbot-purchase-and-genesis-journey.md'),/time-stamped biometric/);
});

test('civic collaboration replaces election appeals and licensing retains ownership',async()=>{
 const home=await read('dist/index.html'),collaboration=await read('dist/collaborate.html'),licensing=await read('dist/licensing.html');
 for(const html of [home,collaboration,licensing]){
  assert.match(html,/page-sequence/);assert.match(html,/floating-nav/);
  assert.doesNotMatch(html,/Donation enquiries are open|Offer to help|Exploring a run for mayor|Create campaign material/);
 }
 assert.match(licensing,/non-exclusive licence/);assert.match(licensing,/retain ownership/);
 for(const file of ['collaborate.html','licensing.html'])assert.ok((await read('dist/sitemap.xml')).includes(file));
 const donations=await read('dist/donations.html');assert.match(donations,/not seeking election donations/);assert.doesNotMatch(donations,/<form|paypal|stripe|BSB|mailto:/i);
 const record=await read('dist/reporting.html');assert.match(record,/19 November 2026/);assert.match(record,/12 noon/);assert.match(record,/campaign-contributions.csv/);
});

test('old campaign enquiry links lead to current collaboration or historical questions',async()=>{
 const source=await read('public/assets/visual.js');
 for(const reason of ['volunteer-share-music','volunteer-own-idea','donation-enquiry']){
  const message={value:''};
  const context={URLSearchParams,location:{search:'?reason='+reason},document:{querySelector:selector=>selector==='#contact-message'?message:null,querySelectorAll:()=>[]}};
  vm.runInNewContext(source,context);
  assert.match(message.value,/Luke is not contesting the mayoral by-election/);
  assert.doesNotMatch(message.value,/Campaign volunteering:|Donation enquiry under the all-named/);
  assert.match(message.value,reason==='donation-enquiry'?/not seeking election donations/:/Independent project collaboration/);
 }
});

test('public finance data rejects private fields and unreviewed donor records',()=>{
 const empty={version:1,updated:null,coverage:'not-yet-published',contributions:[],expenses:[],budget:[]};
 assert.doesNotThrow(()=>validatePublicFinance(empty));
 assert.throws(()=>validatePublicFinance({...empty,bankAccount:'private'}),/Unexpected/);
 const row={id:'example',name:'Example Donor',kind:'donation',date:'2026-11-10',amount:'5.00',status:'accepted',note:''};
 const report={...empty,updated:'2026-11-10T00:00:00Z',coverage:'reviewed-records',contributions:[row]};
 assert.doesNotThrow(()=>validatePublicFinance(report));
 for(const change of [{address:'private'},{receiptReference:'private'},{notes:'private'},{status:'pledged'},{name:'person@example.org'}])assert.throws(()=>validatePublicFinance({...report,contributions:[{...row,...change}]}));
});

test('organisation names are expanded without changing Wiki filenames or inventing civic premises',async()=>{
 const html=await read('dist/ideas.html');
 assert.match(html,/Ready Sustainable Employment and Training Cooperative \(Ready SET Co-op\)/);
 assert.match(html,/Global Association for Joyful Responsible Abundance on Earth \(GAJRA Earth\)/);
 assert.ok(html.includes('/wiki/10-ready-set-co-op-and-missing-middle-delivery-capacity'));
 assert.ok(html.includes('/wiki/13-gajra-earth-redlands-formation-option'));
 assert.match(html,/Wiki reference 10/);
 const civic=await read('docs/wiki/49-redlands-aura-civic-establishments-and-shared-places.md');
 assert.match(civic,/9 Ballow Road/);assert.match(civic,/still vacant/);assert.match(civic,/433 Logan Road/);assert.match(civic,/remain unspecified/);
});


test('music broadcasting resources request evidenced track-level logs without claiming plays',async()=>{
 const media=await read('dist/media.html'),music=await read('dist/music.html');
 const note=await read('dist/assets/press/Luke-Nathan-Hayes-music-during-campaign.txt');
 const csv=await read('dist/assets/press/airplay-log-template.csv');
 assert.match(media,/id="music-during-campaign"/);assert.match(media,/topic=media&amp;reason=music-airplay/);
 assert.match(music,/media.html#music-during-campaign/);
 assert.match(note,/each track actually played/);assert.match(note,/Every repeat or later replay/);assert.match(note,/time zone/);
 assert.match(note,/No automatic monitoring/);assert.match(note,/do not assign an advertising value to editorial coverage or determine its legal classification/);
 assert.equal(csv.trim().split(/\r?\n/).length,1,'Template must not invent broadcasts');
 for(const field of ['title','broadcastDate','localTime','timeZone','evidenceReference','arrangement'])assert.ok(csv.includes(field));
 assert.match(await read('public/assets/visual.js'),/reason==='music-airplay'/);
});
