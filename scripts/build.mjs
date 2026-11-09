import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {campaignPresentation} from './pages.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse((await readFile(path.join(root,'data/campaign.json'),'utf8')).replace(/^\uFEFF/,''));
const presentation=campaignPresentation(config);
if(presentation.isLive&&!presentation.authorisationComplete)throw new Error('Live publication needs the complete authorisation and recorded owner review.');
if(config.contactFormUrl&&!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(config.contactFormUrl))throw new Error('Invalid contact form deployment URL');
const dist=path.join(root,'dist');
if(path.dirname(dist)!==root||path.basename(dist)!=='dist')throw new Error('Unsafe output path');
await rm(dist,{recursive:true,force:true,maxRetries:5,retryDelay:200});
await mkdir(dist,{recursive:true});
await cp(path.join(root,'public'),dist,{recursive:true});
await cp(path.join(root,'LICENCE.md'),path.join(dist,'LICENCE.md'));
await writeFile(path.join(dist,'.nojekyll'),'');
await writeFile(path.join(dist,'robots.txt'),`# Search discovery grants no reuse or AI-training rights.
# Only the host-root robots.txt controls the shared Pages hostname.
# Licence: ${config.baseUrl}LICENCE.md
User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

Sitemap: ${config.baseUrl}sitemap.xml
`);
// Keep an old press-download bookmark pointed at the current public fact sheet.
await mkdir(path.join(dist,'downloads'),{recursive:true});
await cp(path.join(root,'public/assets/press/Luke-Nathan-Hayes-media-facts.txt'),path.join(dist,'downloads/media-brief.txt'));
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
await writeFile(path.join(dist,'404.html'),`<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Luke Hayes for Redlands</title></head><body><h1>Page not found</h1><p><a href="${escape(config.baseUrl)}sitemap.html">Find a public page</a></p><p>${escape(presentation.authorisationText)}</p></body></html>`);
console.log('Prepared public assets. Visual pages and the native Wiki are generated separately.');
