import {readFile} from 'node:fs/promises';
const c=JSON.parse(await readFile(new URL('../data/campaign.json',import.meta.url),'utf8'));
if(c.publicationMode==='civic-simulation'){console.log('Civic simulation status recorded. Luke is not contesting the mayoral by-election.');process.exit(0);}
const missing=[];
if(!c.authorisation.name.trim()) missing.push('Authoriser name');
if(!c.authorisation.address.trim()) missing.push('Contactable public authoriser address, omitted at owner request');
if(c.authorisation.status!=='complete') missing.push('Authorisation marked complete after owner review');
if(!c.contactFormUrl) missing.push('Deployed mail contact endpoint URL after an inbox delivery check');
if(missing.length){console.error(`Release requirements outstanding:\n${missing.map(v=>`- ${v}`).join('\n')}\nA public preview label does not replace statutory authorisation.`);process.exitCode=1;}
else console.log('Configured publication authorisation complete. Recheck the ECQ requirements before distribution.');
