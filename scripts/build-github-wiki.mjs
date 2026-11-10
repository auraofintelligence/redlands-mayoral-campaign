import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {fullProjectNames} from './project-names.mjs';
import {wikiLyricQuote} from './lyric-excerpts.mjs';
import {projectDestination,publishedProjectUrl,publishedProjectLinks,sourceRepoName} from './project-destinations.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readJSON=async file=>JSON.parse((await readFile(path.join(root,file),'utf8')).replace(/^\uFEFF/,''));
const [content,config,exclusions,guide,music]=await Promise.all([
 readJSON('data/visual-content.json'),readJSON('data/campaign.json'),readJSON('data/public-project-exclusions.json'),readJSON('data/wiki-reading-guide.json'),readJSON('data/visual-music.json')
]);
const readingEdition=new Date(guide.reviewedOn+'T00:00:00Z').toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric',timeZone:'Australia/Brisbane'});
const wiki='https://github.com/auraofintelligence/redlands-mayoral-campaign/wiki',site=config.baseUrl;
const slug=value=>String(value).toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const pageName=entry=>`${entry.id}-${slug(entry.title)}`,pageUrl=name=>`${wiki}/${name}`;
const link=(label,url)=>`[${label}](${url})`,entryLink=entry=>link(`${entry.id} ${fullProjectNames(entry.title)}`,pageUrl(pageName(entry)));
const entries=new Map(content.options.map(entry=>[entry.id,entry]));
const projects=content.groups.flatMap(group=>group.projects),projectsByRepo=new Map(projects.map(p=>[p.repoName.toLowerCase(),p]));
const officialById=new Map(content.officialSources.map(source=>[source.id,source]));
const documentLabel=number=>guide.documents[String(number)]?.label||content.documents.find(d=>String(d.number)===String(number))?.title||`Document ${number}`;
const sections=[
 ['purpose','The idea'],['redlandsAdaptation','What this could mean for Redlands'],
 ['strategicPurpose','Why this matters'],['firstPrinciples','What it needs to work'],
 ['localApplications','Everyday uses'],['leadershipExample','Luke’s personal leadership example'],
 ['researchRationale','Health and research questions'],['route','How this could move forward'],
 ['mayoralCouncilLever','What the mayor and council could do'],['outside','Who else makes decisions'],
 ['partners','People and organisations who could be involved'],['conflictBoundary','How related interests would be handled']
];
const sourceLink=source=>{
 const repo=sourceRepoName(source.url),destination=projectDestination(repo);
 if(destination?.kind==='local-overview')return link(`${fullProjectNames(source.title)} (project introduction)`,new URL(`projects/${slug(repo)}.html`,site).href);
 const label=destination?.label?`${fullProjectNames(source.title)}: ${destination.label}`:fullProjectNames(source.title)+(destination?.kind==='source'?' (project source on GitHub)':destination?.kind==='document'?' (public document)':'');
 return link(label,publishedProjectUrl(source.url));
};
const projectIntroduction=source=>{
 const project=projectsByRepo.get(sourceRepoName(source.url).toLowerCase());
 if(!project)throw new Error(`Missing public introduction for ${fullProjectNames(source.title)}`);
 return `- **${sourceLink(source)}**. ${project.description.replace(/\bprogramme(s?)\b/g,'program$1')}`;
};
const termsFor=entry=>guide.terms.filter(term=>term.entries.includes(entry.id));
const termsSection=entry=>termsFor(entry).length?`\n\n## Words and project names\n\n${termsFor(entry).map(term=>`- **${term.name}**: ${term.meaning}`).join('\n')}`:'';
const themes=[...new Set(content.options.map(entry=>entry.theme))];
const index=themes.map(theme=>`### ${theme}\n\n${content.options.filter(entry=>entry.theme===theme).map(entry=>`- ${entryLink(entry)}`).join('\n')}`).join('\n\n');
const jra='https://auraofintelligence.github.io/joyful-responsible-abundance/index.html';
const files=new Map();
files.set('Home',`# Ideas for Redlands and the council’s role

## Welcome

${guide.aboutLuke}

${link('About Luke and the original records',new URL('about.html',site).href)} · ${link('Explore the project collection',new URL('projects.html',site).href)} · ${link('Ask a question or suggest a correction',new URL('contact.html?topic=project',site).href)}

## The shared aim: Joyful Responsible Abundance

${guide.aim}

${guide.values.map(value=>`- **${value.name}**: ${value.explanation}`).join('\n')}

${link('Read the introduction to Joyful Responsible Abundance',jra)}${wikiLyricQuote('wiki-home',site)}

## Choose a place to start

Start with an everyday concern or follow a wider question. Each page introduces the relevant work, so the ideas can be read in any order.

${guide.paths.map(route=>`- **${route.label}**: ${route.ids.map(id=>entryLink(entries.get(id))).join(' · ')}`).join('\n')}

## How to read these ideas

${guide.howToRead}

- ${link('What the mayor and council can do',pageUrl('Mayoral-role'))}
- ${link('How the ideas connect',pageUrl('Connections'))}
- ${link('Words and project names',`${pageUrl('Home')}#words-and-names`)}
- ${link('Official information and source dates',pageUrl('Official-sources'))}
- ${link('Documents and current public reading',pageUrl('Supplied-documents'))}

## Follow council decisions

${link('Redlands Coast Intelligence: dated local information and council records','https://auraofintelligence.github.io/Redlands_draft_ES2026-2031/')} · ${link('Council minutes and agendas','https://www.redland.qld.gov.au/About-Council/Council-meetings/Council-meeting-minutes-and-agendas')} · ${link('Council budget','https://www.redland.qld.gov.au/About-Council/Strategy-Planning-and-Policy/Council-plans-and-financial-information/Annual-Budget')} · ${link('Live meetings and recordings','https://www.redland.qld.gov.au/About-Council/Council-meetings/Council-meeting-livestreaming-and-video-recordings')}

## All ${content.options.length} ideas

${index}

## Words and names

These explanations describe how the terms are used in this Wiki. The linked project pages provide their own detail and sources.

${guide.terms.map(term=>`### ${term.name}\n\n${term.meaning}`).join('\n\n')}

Reading edition: ${readingEdition}. Each official source keeps its own recorded check date.
`);

for(const [position,entry] of content.options.entries()){
 const opening=entry.id==='44'?`\n\n${link('Begin with Joyful Responsible Abundance',jra)} for the whole-system direction behind this Redlands proposal.`:'';
 const terms=termsSection(entry),example=guide.examples[entry.id]?`\n\n## A practical example\n\n${guide.examples[entry.id]}`:'';
 const sourceIntro=`\n\n## Projects behind this idea\n\nThese introductions describe the source projects. The Redlands proposal above explains the possible local adaptation.\n\n${entry.projectSources.map(projectIntroduction).join('\n\n')}`;
 const fields=sections.filter(([key])=>entry[key]).map(([key,title])=>`## ${title}\n\n${entry[key]}${key==='purpose'?terms+example:''}${key==='redlandsAdaptation'?sourceIntro:''}`).join('\n\n');
 const musicSection=entry.musicConnections?.length?`\n\n## Music connections\n\n${entry.musicConnections.map(song=>{
  const track=music.tracks.find(t=>`music-track-${t.number}`===song.songAnchor),url=new URL(`music.html${song.songAnchor?'#'+song.songAnchor:''}`,site).href;
  return `- **${link(track?.title||song.title,url)}**: ${song.connection}${song.pages?` Current lyric-sheet ${song.pages.includes(',')?'pages':'page'}: ${song.pages}.`:''}`;
 }).join('\n')}\n\n${link('Read the current 22-song lyric sheet',new URL('music.html#music-lyric-sheet',site).href)}`:'';
 const official=(entry.officialSources||[]).map(id=>{
  const source=officialById.get(id);if(!source)throw new Error(`Missing official source ${id}`);
  return `- ${link(fullProjectNames(source.title),source.url)} · ${link(`Source note ${id}`,`${pageUrl('Official-sources')}#${id.toLowerCase()}`)}`;
 }).join('\n');
 const documents=(entry.documentSources||[]).map(number=>`- ${link(documentLabel(number),`${pageUrl('Supplied-documents')}#document-${number}`)}`).join('\n');
 const connections=(entry.connections||[]).map(connection=>`- ${entryLink(entries.get(connection.id))}: ${connection.relationship}`).join('\n');
 const previous=position?entryLink(content.options[position-1]):link('Wiki home',pageUrl('Home'));
 const next=position+1<content.options.length?entryLink(content.options[position+1]):link('Wiki home',pageUrl('Home'));
 files.set(pageName(entry),`# ${entry.id} ${fullProjectNames(entry.title)}\n\n${link('Wiki home',pageUrl('Home'))} · ${link('Words and names',`${pageUrl('Home')}#words-and-names`)} · ${entry.theme}\n\nAn idea by ${link('Luke Nathan Hayes',new URL('about.html',site).href)}, an Amity resident on Minjerribah / North Stradbroke Island working on digital tools, community proposals and music.${opening}\n\n${fields}${wikiLyricQuote('idea-'+entry.id,site)}${musicSection}\n\n## Official information\n\n${official||'See the shared official source register.'}\n\n## Documents behind the idea\n\n${documents||'See the related public project introductions above.'}\n\n## Related ideas\n\n${connections||link('How the ideas connect',pageUrl('Connections'))}\n\n---\n\n**Previous:** ${previous} · **Next:** ${next}\n\n${link('Back to the idea','#the-idea')} · ${link('Wiki home',pageUrl('Home'))} · ${link('Share a question or local experience',new URL('contact.html?topic=project',site).href)}\n`);
}

const roleContext=content.roleContext.map(section=>{
 const html=publishedProjectLinks(section.html).replace(/href="#(A\d+)"/g,(_,id)=>`href="${pageUrl('Official-sources')}#${id.toLowerCase()}"`);
 return `## ${section.title}\n\n${html}`;
}).join('\n\n');
files.set('Mayoral-role',`# Mayoral role and responsibilities\n\n${link('Wiki home',pageUrl('Home'))} · ${link('Words and names',`${pageUrl('Home')}#words-and-names`)}\n\nThe mayor, councillors, council administration and other governments have different jobs. Understanding those roles helps explain how a local idea can move towards a decision.\n\n${roleContext}${wikiLyricQuote('wiki-role',site)}\n\n## Follow a proposal\n\n${link('Explore the ideas',`${pageUrl('Home')}#choose-a-place-to-start`)} · ${link('Read the official information',pageUrl('Official-sources'))} · ${link('Follow council records','https://auraofintelligence.github.io/Redlands_draft_ES2026-2031/')}\n`);
files.set('Connections',`# How the ideas connect\n\n${link('Wiki home',pageUrl('Home'))} · ${link('Words and names',`${pageUrl('Home')}#words-and-names`)}\n\n${link('Joyful Responsible Abundance',jra)} is the shared direction. These ideas address connected needs while keeping their own purposes, participants and decisions. A shared building, tool or service can support several activities without combining them into one program. Follow any link below for an introduction to that idea and its source projects.\n\n${wikiLyricQuote('wiki-connections',site)}\n\n${content.overlapGuide.map(group=>`## ${group.title}\n\n${group.explanation}\n\n${group.options.map(id=>`- ${entryLink(entries.get(id))}`).join('\n')}`).join('\n\n')}\n`);
files.set('Official-sources',`# Official source references\n\n${link('Wiki home',pageUrl('Home'))}\n\nThese links support the explanations of council responsibilities, decisions and other authorities. Each source keeps its own recorded check date. Laws, services and guidance can change; the official page provides the relevant current detail. Investment announcements retain their original dates and describe what was announced at that time.\n\n${content.officialSources.map(source=>`## ${source.id}\n\n${link(fullProjectNames(source.title),source.url)}${source.checkedOn?`\n\nRecorded source check: ${source.checkedOn}.`:''}`).join('\n\n')}\n`);
files.set('Supplied-documents',`# Documents behind the ideas\n\n${link('Wiki home',pageUrl('Home'))}\n\nThese entries identify the original background documents and link to related public projects. Each project is introduced on its own page. Current public reading is linked where available, alongside the historical document title.\n\n${content.documents.map(document=>{
 const info=guide.documents[String(document.number)];if(!info)throw new Error(`Missing document introduction ${document.number}`);
 const related=info.repos.map(repo=>{const p=projectsByRepo.get(repo.toLowerCase());if(!p)throw new Error(`Missing related project ${repo}`);return sourceLink(p);});
 return `## Document ${document.number}\n\n**${info.label}**\n\nOriginal source title: ${document.title}\n\nRelated public reading: ${related.join(' · ')}.${info.currentEdition?`\n\n${link('Current 22-song lyric sheet, revised 9 November 2026',new URL(info.currentEdition,site).href)}. The original source title above records the earlier edition.`:''}`;
}).join('\n\n')}\n`);
files.set('_Sidebar',`${link('Wiki home',pageUrl('Home'))}\n\n${[['Home#choose-a-place-to-start','Choose a place to start'],['Home#words-and-names','Words and names'],['Mayoral-role','Council responsibilities'],['Connections','How the ideas connect'],['Official-sources','Official information'],['Supplied-documents','Documents and public reading']].map(([name,label])=>`- ${link(label,pageUrl(name))}`).join('\n')}\n\n${index}\n`);
files.set('_Footer',`Luke Nathan Hayes is not contesting the 2026 Redland City mayoral by-election. This Wiki is part of the Redlands civic simulation.\n\n${link('Wiki home',pageUrl('Home'))} · ${link('Council responsibilities',pageUrl('Mayoral-role'))} · ${link('Connections',pageUrl('Connections'))} · ${link('Official sources',pageUrl('Official-sources'))}\n\n${link('Redlands civic simulation',site)} · ${link('Redlands questions',new URL('ideas.html',site).href)} · ${link('Songs and lyrics',new URL('music.html',site).href)} · ${link('About Luke',new URL('about.html',site).href)} · ${link('Full interview',new URL('interview.html',site).href)}\n\n${link('Joyful Responsible Abundance',jra)} · ${link('Strange But True','https://auraofintelligence.github.io/strange-but-true/')} · ${link('Luke’s Open Record (public document)','https://github.com/auraofintelligence/open-record-luke-nathan-hayes/blob/main/README.md')}\n\nReading edition: ${readingEdition}. Original work © 2026 Luke Nathan Hayes / Strange But True / Aura of Intelligence, under the ${link('Strange But True Public Source Licence',new URL('licence.html',site).href)}. Linked material retains its own rights.\n`);

const all=[...files.values()].join('\n'),metadata=new Set(['id','theme','title']);
for(const entry of content.options)for(const [key,value] of Object.entries(entry))if(typeof value==='string'&&value&&!metadata.has(key)&&!files.get(pageName(entry)).includes(value))throw new Error(`Wiki omits narrative field ${entry.id}.${key}`);
if(/(?:[CGL]:[\\/]|myNotes|myWording|storageId|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\u2014)/i.test(all))throw new Error('Wiki contains a private field, local path, public email or forbidden punctuation');
const excludedRepos=new Set(exclusions.excludedRepos.map(repo=>repo.toLowerCase()));
for(const [value] of all.matchAll(/https?:\/\/[^\s<>"')]+/g)){
 const url=new URL(value),repo=sourceRepoName(value)||(url.hostname==='auraofintelligence.github.io'?url.pathname.split('/').filter(Boolean)[0]:'');
 if(excludedRepos.has(String(repo).toLowerCase()))throw new Error(`Excluded project reference in wiki: ${repo}`);
}
// Check every generated Wiki destination and heading anchor before writing files.
const headings=new Map([...files].map(([name,text])=>[name,new Set([...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match=>slug(match[1])))]));
for(const [name,text] of files){
 for(const [,destination] of text.matchAll(/(?:\]\(|href=")([^\s"<>]+?)(?:\)|")/g)){
  if(!destination.startsWith('#')&&!destination.startsWith(wiki+'/'))continue;
  const url=new URL(destination,destination.startsWith('#')?pageUrl(name):wiki+'/');
  const target=decodeURIComponent(url.pathname.slice(new URL(wiki).pathname.length+1))||'Home';
  if(!files.has(target))throw new Error(`${name}: missing Wiki page ${target}`);
  if(url.hash&&!headings.get(target).has(decodeURIComponent(url.hash.slice(1))))throw new Error(`${name}: missing heading ${target}${url.hash}`);
 }
}
await mkdir(path.join(root,'docs/wiki'),{recursive:true});
for(const name of await readdir(path.join(root,'docs/wiki')))if(/^\d{2}-.+\.md$/.test(name)&&!files.has(name.slice(0,-3)))await rm(path.join(root,'docs/wiki',name));
for(const [name,markdown] of files)await writeFile(path.join(root,'docs/wiki',`${name}.md`),markdown,'utf8');
console.log(`Prepared ${files.size} linked GitHub Wiki files: ${content.options.length} introduced ideas, reading guide and source context. No remote publication performed.`);
