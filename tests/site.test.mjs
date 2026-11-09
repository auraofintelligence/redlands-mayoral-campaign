import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const read=relative=>readFile(path.join(root,relative),'utf8');
async function files(dir){let found=[];for(const name of await readdir(dir)){const file=path.join(dir,name);found.push(...((await stat(file)).isDirectory()?await files(file):[file]));}return found;}
test('public output contains only the publication allowlist, never private operations',async()=>{
 const allowed=new Set(['assets','data','downloads','projects','LICENCE.md','.nojekyll','favicon.ico','sitemap.xml','robots.txt','llms.txt','app.js','model.js','control.css']);
 for(const name of await readdir(dist)) assert.ok(name.endsWith('.html')||allowed.has(name),`Unexpected public file: ${name}`);
 assert.deepEqual(await readdir(path.join(dist,'data')),['projects.json']);
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
test('pages have unique titles, language, accessible landmarks and preview status',async()=>{
 const titles=new Set();
 for(const file of (await files(dist)).filter(v=>v.endsWith('.html')&&!['404.html','outreach.html'].includes(path.basename(v)))){
  const html=await readFile(file,'utf8'),title=html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title);assert.ok(!titles.has(title));titles.add(title);
  assert.match(html,/<html lang="en-AU">/);assert.match(html,/<main id="main"/);assert.match(html,/href="#main"/);
  assert.equal((html.match(/<h1>/g)||[]).length,1);assert.match(html,/<link rel="canonical"/);
  assert.match(html,/Publication authorisation is incomplete/);assert.match(html,/content="noindex, follow"/);
 }
 assert.ok(titles.size>=123);
 const home=await read('dist/index.html');assert.match(home,/<main id="main"/);assert.match(home,/Ideas into practice/);assert.match(home,/assets\/visual.js/);
 const outreach=await read('dist/outreach.html');assert.match(outreach,/<main id="view"/);assert.match(outreach,/My possibilities/);assert.match(outreach,/app.js/);assert.match(outreach,/content="noindex, nofollow"/);
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
 const js=await read('public/assets/site.js');assert.doesNotMatch(js,/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\b/);
 const contact=await read('dist/contact.html'),config=JSON.parse(await read('data/campaign.json'));
 if(config.contactFormUrl){assert.ok(contact.includes(`action="${config.contactFormUrl}"`));assert.doesNotMatch(contact,/<fieldset disabled>/);assert.match(contact,/accepts it for sending/);}
 else {assert.match(contact,/<fieldset disabled>/);assert.match(contact,/not connected|unavailable|not active|not accepting messages/i);}
 assert.doesNotMatch(contact,/mailto:|gmail\.com/);
 for(const file of (await files(dist)).filter(v=>v.endsWith('.html'))){assert.doesNotMatch(await readFile(file,'utf8'),/[A-Za-z0-9._%+-]+@gmail\.com|mailto:/);}
});

test('all visual projects have reviewed descriptions and existing credited rasters, with private notes excluded',async()=>{
 const content=JSON.parse(await read('data/visual-content.json')),images=JSON.parse(await read('data/project-images.json'));
 const excluded=JSON.parse(await read('data/public-project-exclusions.json')).excludedRepos;
 const projects=content.groups.flatMap(g=>g.projects);assert.equal(projects.length,113);assert.equal(content.options.length,52);
 assert.equal(new Set(projects.map(p=>p.repoName)).size,113);
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
 const music=await read('dist/music.html');assert.match(music,/Severe language/);assert.match(music,/music-warning-dialog/);assert.doesNotMatch(music,/<iframe|<video[^>]+autoplay/);
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
