import {readFile,writeFile,cp,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const source=path.join(root,'control-room','public');
const readJSON=async file=>JSON.parse((await readFile(path.join(root,file),'utf8')).replace(/^\uFEFF/,''));
const media=(await Promise.all(['radio','print-online','organisations','independent','digital-creators','national-podcasts','women','community'].map(name=>readJSON(`data/media-${name}.json`)))).flat();
if(new Set(media.map(m=>m.id)).size!==media.length)throw new Error('Duplicate media IDs');
await mkdir(path.join(dist,'assets','data'),{recursive:true});
await writeFile(path.join(dist,'assets','data','media.json'),JSON.stringify(media,null,2)+'\n');
for(const file of ['projects','campaign'])await cp(path.join(root,'data',`${file}.json`),path.join(dist,'assets','data',`${file}.json`));
await cp(path.join(root,'operations','model.cjs'),path.join(dist,'model.js'));
for(const file of ['index.html','app.js','control.css'])await cp(path.join(source,file),path.join(dist,file));
// Mirror only the generated public artifact. The local server never serves repository root.
for(const name of await readdir(dist)){
  if(['index.html','app.js','control.css'].includes(name))continue;
  await cp(path.join(dist,name),path.join(source,name),{recursive:true});
}
console.log(`Built election explorer: ${media.length} researched directory entries. Working records are never bundled.`);
