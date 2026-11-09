import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {projectDestination,publishedProjectUrl,publishedProjectLinks,sourceRepoName} from './project-destinations.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readJSON=async file=>JSON.parse((await readFile(path.join(root,file),'utf8')).replace(/^\uFEFF/,''));
const [content,config,exclusions]=await Promise.all([
  readJSON('data/visual-content.json'),readJSON('data/campaign.json'),readJSON('data/public-project-exclusions.json')
]);
const wiki='https://github.com/auraofintelligence/redlands-mayoral-campaign/wiki';
const site=config.baseUrl;
const slug=value=>String(value).toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const pageName=entry=>`${entry.id}-${slug(entry.title)}`;
const pageUrl=name=>`${wiki}/${name}`;
const link=(label,url)=>`[${label}](${url})`;
const entryLink=entry=>link(`${entry.id} ${entry.title}`,pageUrl(pageName(entry)));
const entries=new Map(content.options.map(entry=>[entry.id,entry]));
const sections=[
  ['purpose','Purpose'],['redlandsAdaptation','What this could mean for Redlands'],
  ['strategicPurpose','Strategic purpose'],['firstPrinciples','First-principles foundation'],
  ['localApplications','Local uses'],['leadershipExample','Personal leadership example'],
  ['researchRationale','Health and research connection'],['route','Decision route'],
  ['mayoralCouncilLever','What the mayor and council could do'],['outside','Other decision-makers'],
  ['partners','Possible partners'],['conflictBoundary','Interests and independent decisions']
];
const sourceLink=source=>{
  const repo=sourceRepoName(source.url),destination=projectDestination(repo);
  if(destination?.kind==='local-overview')return link(`${source.title} (project overview)`,new URL(`projects/${slug(repo)}.html`,site).href);
  const label=destination?.label?`${source.title}: ${destination.label}`:source.title+(destination?.kind==='source'?' (project source on GitHub)':destination?.kind==='document'?' (public document)':'');
  return link(label,publishedProjectUrl(source.url));
};
const themes=[...new Set(content.options.map(entry=>entry.theme))];
const index=themes.map(theme=>`## ${theme}\n\n${content.options.filter(entry=>entry.theme===theme).map(entry=>`- ${entryLink(entry)}`).join('\n')}`).join('\n\n');
const files=new Map();
files.set('Home',`# Ideas for Redlands and the council’s role

Explore Luke Nathan Hayes’ ideas for Redlands, what they could mean for residents, and how the mayor, council, communities and other levels of government could contribute. Each proposal explains the purpose, possible local action, responsibilities and relevant interests. These ideas remain options for public discussion, rather than adopted council policy or a declared programme.

${link('Open the visual project site',site)} · ${link('Browse the project collection',new URL('projects.html',site).href)}

## Understanding the council’s role

- ${link('What the mayor and council can do',pageUrl('Mayoral-role'))}
- ${link('How the ideas connect',pageUrl('Connections'))}
- ${link('Official sources',pageUrl('Official-sources'))}
- ${link('Documents behind the proposals',pageUrl('Supplied-documents'))}

## Explore the ${content.options.length} proposals

${index}
`);

for(const entry of content.options){
  const opening=entry.id==='44'?`\n\n${link('Begin with Joyful Responsible Abundance','https://auraofintelligence.github.io/joyful-responsible-abundance/index.html')} for the whole-system direction behind this Redlands proposal.`:'';
  const fields=sections.filter(([key])=>entry[key]).map(([key,title])=>`## ${title}\n\n${entry[key]}`).join('\n\n');
  const music=entry.musicConnections?.length?`\n\n## Music connections\n\n${entry.musicConnections.map(song=>`- **${song.title}**: ${song.connection}`).join('\n')}\n\n${link('Listen and read the lyric sheet',new URL('music.html',site).href)}`:'';
  const official=(entry.officialSources||[]).map(id=>`- ${link(id,`${pageUrl('Official-sources')}#${id.toLowerCase()}`)}`).join('\n');
  const documents=(entry.documentSources||[]).map(number=>{
    const document=content.documents.find(item=>String(item.number)===String(number));
    return `- ${link(`Document ${number}${document?`: ${document.title}`:''}`,`${pageUrl('Supplied-documents')}#document-${number}`)}`;
  }).join('\n');
  const connections=(entry.connections||[]).map(connection=>`- ${entryLink(entries.get(connection.id))}: ${connection.relationship}`).join('\n');
  files.set(pageName(entry),`# ${entry.id} ${entry.title}\n\n${link('Wiki home',pageUrl('Home'))} · ${entry.theme}${opening}\n\n${fields}${music}\n\n## Project sources\n\n${entry.projectSources.map(source=>`- ${sourceLink(source)}`).join('\n')}\n\n## Official references\n\n${official||'See the shared official source register.'}\n\n## Supplied source documents\n\n${documents||'No supplied document is specifically attached to this entry.'}\n\n## Connected entries\n\n${connections||'See the shared connections and boundaries guide.'}\n`);
}

const roleContext=content.roleContext.map(section=>{
  const html=publishedProjectLinks(section.html).replace(/href="#(A\d+)"/g,(_,id)=>`href="${pageUrl('Official-sources')}#${id.toLowerCase()}"`);
  return `## ${section.title}\n\n${html}`;
}).join('\n\n');
files.set('Mayoral-role',`# Mayoral role and responsibilities\n\n${link('Wiki home',pageUrl('Home'))}\n\nThe mayor, councillors, council administration and other governments have different responsibilities. These distinctions explain how the proposals could be advanced. The official source checks below were recorded on 8 November 2026.\n\n${roleContext}\n`);
files.set('Connections',`# How the ideas connect\n\n${link('Wiki home',pageUrl('Home'))}\n\nThese proposals address connected needs while retaining their own purposes, participants and decision-makers. The links below explain those relationships.\n\n${content.overlapGuide.map(group=>`## ${group.title}\n\n${group.explanation}\n\n${group.options.map(id=>`- ${entryLink(entries.get(id))}`).join('\n')}`).join('\n\n')}\n`);
files.set('Official-sources',`# Official source references\n\n${link('Wiki home',pageUrl('Home'))}\n\nThese official references support the explanations of council powers, responsibilities and other decision routes. Each source retains its recorded check date.\n\n${content.officialSources.map(source=>`## ${source.id}\n\n${link(source.title,source.url)}${source.checkedOn?`\n\nSource check recorded: ${source.checkedOn}.`:''}`).join('\n\n')}\n`);
files.set('Supplied-documents',`# Supplied source documents\n\n${link('Wiki home',pageUrl('Home'))}\n\nThe titles below identify documents used in developing these proposals.\n\n${content.documents.map(document=>`## Document ${document.number}\n\n${document.title}`).join('\n\n')}\n`);
files.set('_Sidebar',`${link('Wiki home',pageUrl('Home'))}\n\n${[['Mayoral-role','Council responsibilities'],['Connections','How the ideas connect'],['Official-sources','Official sources'],['Supplied-documents','Source documents']].map(([name,label])=>`- ${link(label,pageUrl(name))}`).join('\n')}\n\n${index.replace(/^## /gm,'### ')}\n`);
files.set('_Footer',`${link('Visual project site',site)} · ${link('Strange But True','https://auraofintelligence.github.io/strange-but-true/')} · ${link('Luke’s Open Record (public document)','https://github.com/auraofintelligence/open-record-luke-nathan-hayes/blob/main/README.md')}\n\nOriginal work © 2026 Luke Nathan Hayes / Strange But True / Aura of Intelligence, under the ${link('Strange But True Public Source Licence',new URL('licence.html',site).href)}. Linked material retains its own rights.\n`);

const all=[...files.values()].join('\n');
const metadata=new Set(['id','theme','title']);
for(const entry of content.options){
  const markdown=files.get(pageName(entry));
  for(const [key,value] of Object.entries(entry)){
    if(typeof value==='string'&&value&&!metadata.has(key)&&!markdown.includes(value))throw new Error(`Wiki omits narrative field ${entry.id}.${key}`);
  }
}
if(/(?:[CGL]:[\\/]|myNotes|myWording|storageId|sbt4183@|auraofintelligence@gmail|\u2014)/i.test(all))throw new Error('Wiki contains a private field, local path, public email or forbidden punctuation');
const excludedRepos=new Set(exclusions.excludedRepos.map(repo=>repo.toLowerCase()));
for(const [value] of all.matchAll(/https?:\/\/[^\s<>"')]+/g)){
  const url=new URL(value);
  const repo=sourceRepoName(value)||(url.hostname==='auraofintelligence.github.io'?url.pathname.split('/').filter(Boolean)[0]:'');
  if(excludedRepos.has(String(repo).toLowerCase()))throw new Error(`Excluded project reference in wiki: ${repo}`);
}
await mkdir(path.join(root,'docs/wiki'),{recursive:true});
for(const name of await readdir(path.join(root,'docs/wiki'))){
  if(/^\d{2}-.+\.md$/.test(name)&&!files.has(name.slice(0,-3)))await rm(path.join(root,'docs/wiki',name));
}
for(const [name,markdown] of files)await writeFile(path.join(root,'docs/wiki',`${name}.md`),markdown,'utf8');
console.log(`Prepared ${files.size} GitHub Wiki Markdown files: ${content.options.length} entries and shared context. No remote publication performed.`);
