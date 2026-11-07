/* Public research, private choices. No outbound messaging or cloud writes. */
'use strict';
(() => {
  const M = window.CampaignModel;
  const key = 'redlands-explorer-v1';
  const $ = s => document.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link = (url, label) => /^https:\/\//.test(url || '') ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>` : '';
  const button = (action, label, attrs = '', secondary = true) => `<button type="button" class="button${secondary ? ' secondary' : ''}" data-action="${action}" ${attrs}>${esc(label)}</button>`;
  const context = {id: () => crypto.randomUUID(), now: () => new Date().toISOString()};
  let state = M.fresh(), media = [], projects = [], campaign = {}, local = false, csrf = '', current = 'overview', toastTimer;
  const views = {overview:'Explore the election',media:'Media and commentators',plan:'My possibilities',calendar:'Dates I choose',outreach:'Connections',publishing:'Drafts',inbox:'Enquiries',projects:'Source library',agents:'Explore with AI',budget:'Resources',activity:'My trail',settings:'Storage'};
  const collections = {plan:'tasks',outreach:'contacts',publishing:'publications',inbox:'enquiries',budget:'expenses'};
  const labels = {title:'Title',owner:'Who, if anyone',dueDate:'Optional date',status:'State',evidenceUrl:'Source link',notes:'Notes',name:'Name',email:'Reply email',organisation:'Organisation',channel:'Connection type',consent:'Update permission',consentScope:'Permission scope',consentEvidence:'Permission evidence',consentDate:'Permission date',reviewDate:'Optional review date',contactId:'Contact record',receivedDate:'Received on',deadline:'Optional response date',sourceUrl:'Source link',format:'Format',assetPath:'File reference',reviewer:'Reviewed by',reviewedDate:'Reviewed on',authorisation:'Authorisation wording',publishedUrl:'Published link',description:'Description',date:'Record date',amount:'Amount (AUD)',currency:'Currency',category:'Category',payee:'Payee',receiptReference:'Receipt reference',paymentReference:'Payment reference'};
  const choiceLabel = (collection, field, value) => collection === 'tasks' && field === 'status' ? ({planned:'Possibility',active:'Exploring',blocked:'Parked',done:'Finished / set aside'}[value] || value) : value.replaceAll('-', ' ');
  function toast(message, error = false) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').className = `visible${error ? ' error' : ''}`; toastTimer = setTimeout(() => { $('#toast').className = ''; $('#toast').textContent = ''; }, 6500); }
  async function api(path, body) {
    const response = await fetch(`api/${path}`, {credentials:'same-origin', ...(body === undefined ? {} : {method:'POST', headers:{'Content-Type':'application/json','X-CSRF-Token':csrf}, body:JSON.stringify(body)})});
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'The local service could not save this record.'); return data;
  }
  function validateState(value) {
    if (!value || value.version !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 0) throw new Error('This is not a supported workspace backup.');
    for (const collection of Object.keys(M.fields)) {
      if (!Array.isArray(value[collection])) throw new Error(`Missing ${collection} records.`);
      const ids = new Set();
      for (const record of value[collection]) {
        if (!record || typeof record.id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(record.id) || ids.has(record.id)) throw new Error('Invalid or duplicate record identifier.');
        ids.add(record.id);
        M.validate(collection, Object.fromEntries(Object.keys(M.fields[collection]).filter(k => k in record).map(k => [k,record[k]])));
      }
    }
    if (!Array.isArray(value.audit) || !Array.isArray(value.suppression)) throw new Error('Missing workspace history.');
    return value;
  }
  function browserState() { const raw = localStorage.getItem(key); return raw ? validateState(JSON.parse(raw)) : M.fresh(); }
  async function save(collection, record, id) {
    if (local) { state = (await api(`records/${collection}`, {record,...(id ? {id} : {})})).state; }
    else {
      const write = () => {
        const latest = browserState();
        if (latest.revision !== state.revision) { state = latest; throw new Error('Another tab changed the workspace. Your form is still open. Review the latest records before saving again.'); }
        const next = structuredClone(state); M.save(next,collection,record,id,context);
        localStorage.setItem(key,JSON.stringify(next)); state = next;
      };
      if (navigator.locks) await navigator.locks.request(key,write); else write();
    }
  }
  const intro = (title, text) => `<div class="view-intro"><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`;
  const empty = (title, text) => `<div class="empty-state"><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
  const verified = item => item.verification === 'election-coverage-verified';
  function mediaCard(item) {
    const saved = state.tasks.some(t => t.evidenceUrl === (item.coverageUrl || item.website));
    return `<article class="project-card media-card" id="source-${esc(item.id)}"><div class="tags"><span class="badge">${esc(item.kind)}</span><span class="badge ${verified(item) ? 'success' : ''}">${verified(item) ? 'Election source found' : 'Source verified'}</span></div><h3>${esc(item.name)}</h3><p class="small muted">${esc(item.area)}</p><p>${esc(item.description)}</p><div class="tags">${item.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>${item.coverageUrl ? `<p class="coverage-link">${link(item.coverageUrl,item.coverageTitle || 'Read election source')}<small class="muted">${item.coverageDate ? ` · ${esc(item.coverageDate)}` : ''}</small></p>` : '<p class="small muted">Current election coverage has not been verified.</p>'}<div class="actions">${link(item.website,'Website')}${link(item.contactUrl,'Public contact route')}</div><details><summary>Evidence and research notes</summary><p>${esc(item.notes)}</p><ul>${item.sourceUrls.map(url=>`<li>${link(url,new URL(url).hostname)}</li>`).join('')}</ul><p class="small muted">Checked ${esc(item.checkedOn)}. Verify again before relying on details.</p></details><div class="actions">${button('save-source',saved ? 'Save another thought' : 'Save a possibility',`data-id="${esc(item.id)}"`)}${button('research-source','Explore with AI',`data-id="${esc(item.id)}"`)}</div></article>`;
  }
  function overview() {
    const featured = media.filter(verified).slice(0,3);
    return `<section class="dashboard-hero"><img src="assets/photos/point-lookout-main-beach-1280.jpg" alt="Main Beach viewed from Point Lookout on Minjerribah, photographed in 2014" width="1280" height="853"><p class="eyebrow">Redlands · Luke + AI</p><h2>Follow your curiosity.<br>Choose your own next move.</h2><p>Radio, reporting, local conversations and ideas worth exploring. A place to gather possibilities as they emerge.</p>${button('view','Explore media and commentators','data-view-target="media"',false)}</section><p class="photo-credit">${link('https://commons.wikimedia.org/wiki/File:View_of_Main_Beach_from_Point_Lookout_(North_Stradbroke_Island).JPG','Main Beach, Point Lookout')} · S. Newrick · 2014 · ${link('https://creativecommons.org/licenses/by-sa/4.0/','CC BY-SA 4.0')} · Presentation crop and purple overlay.</p><div class="content"><div class="metrics"><div class="metric"><span>Places and people to explore</span><strong>${media.length}</strong><small>Outlets, individuals and organisations</small></div><div class="metric"><span>Election sources found</span><strong>${media.filter(verified).length}</strong><small>Includes reporting, official sources and forums</small></div><div class="metric"><span>Your possibilities</span><strong>${state.tasks.length}</strong><small>Only what you choose to save</small></div><div class="metric"><span>Source projects</span><strong>${projects.length}</strong><small>Existing work, proposals and prototypes</small></div></div><div class="panel-head"><div><h2>A few places to begin</h2><p>Browse in any order. No priority or commitment is implied.</p></div>${button('surprise','Show me something else')}</div><div class="project-grid" id="discovery-cards">${featured.map(mediaCard).join('')}</div><div class="panel"><h2>Your space, your pace</h2><p>Nothing is scheduled for you. Save an interesting source, add a thought, or leave it for another day.</p><div class="actions">${button('view','My possibilities','data-view-target="plan"')}${button('view','Browse the source library','data-view-target="projects"')}</div><p class="small muted">${local ? 'Working records are stored in the private folder on this computer.' : 'Saved choices stay in this browser on this device. They are not shared with Luke or other visitors. Use Storage to export a copy.'}</p></div></div>`;
  }
  function mediaView() {
    return `<div class="content">${intro('Find the election conversation','Search radio, traditional media, online publishers, public commentators, organisations and forums. This is a researched starting directory, not a claim to cover every source.')}<div class="toolbar"><label class="field">Search<input id="media-search" type="search" placeholder="Name, place or topic"></label><label class="field">Type<select id="media-kind"><option value="">Every type</option>${[...new Set(media.map(m=>m.kind))].sort().map(k=>`<option>${esc(k)}</option>`).join('')}</select></label><label class="field">Evidence<select id="media-evidence"><option value="">All sources</option><option value="coverage">Election source found</option><option value="outlet">Current election coverage unverified</option></select></label>${button('reset-media','Reset')}</div><p class="small muted" id="media-count"></p><div class="project-grid" id="media-results"></div><p class="small muted">Checked 8 November 2026. People and their outlets can appear separately and share the same coverage. Listed sources do not imply support, willingness to engage, or permission to contact. Public contact routes are provided for you to inspect.</p></div>`;
  }
  function filterMedia() {
    const query = ($('#media-search')?.value || '').toLowerCase(), kind = $('#media-kind')?.value, evidence = $('#media-evidence')?.value;
    const matches = media.filter(m=>(!query || [m.name,m.area,m.description,m.notes,...m.tags].join(' ').toLowerCase().includes(query)) && (!kind || m.kind===kind) && (!evidence || (evidence==='coverage' ? verified(m) : !verified(m))));
    $('#media-count').textContent = `${matches.length} of ${media.length} entries`;
    $('#media-results').innerHTML = matches.length ? matches.map(mediaCard).join('') : empty('No matching sources','Try another word or reset the filters.');
  }
  function recordRows(collection, items) {
    return items.length ? items.map(r=>`<div class="list-row"><div><h3>${esc(r.title || r.name || r.description)}</h3><p>${esc(r.organisation || r.notes || '')}</p><div class="meta">${r.status ? `<span class="badge">${esc(choiceLabel(collection,'status',r.status))}</span>` : ''}${r.consent ? `<span class="badge">Permission: ${esc(r.consent)}</span>` : ''}${r.dueDate ? `<span>Your date: ${esc(r.dueDate)}</span>` : ''}${r.amount ? `<span>AUD ${esc(r.amount)}</span>` : ''}${link(r.evidenceUrl || r.sourceUrl,'Source')}</div></div>${button('edit','Open',`data-collection="${collection}" data-id="${esc(r.id)}"`)}</div>`).join('') : empty('Nothing saved here yet','Add something when it is useful to you.');
  }
  function recordView(collection) {
    const copy = {tasks:['A collection of possibilities','Ideas, sources and conversations you choose to keep. A date is always optional.'],contacts:['Connections you choose to keep','Record known contacts and their actual permission preferences. The directory does not add anyone automatically.'],publications:['A place for drafts','Keep a source, working text and review notes together. Saving a draft does not publish or send it.'],enquiries:['Questions and conversations','Record enquiries you have received. The public contact form still needs its private submission service connected.'],expenses:['Resources and records','Record an expense or a possibility when useful. Amounts here are your entries, not a spending plan.']}[collection];
    return `<div class="content">${intro(...copy)}<div class="toolbar">${button('add',`Add ${collection==='tasks' ? 'a possibility' : 'a record'}`,`data-collection="${collection}"`,false)}${button('csv','Export these records',`data-collection="${collection}"`)}</div><div class="panel">${recordRows(collection,state[collection])}</div></div>`;
  }
  function calendarView() {
    const dated = state.tasks.filter(t=>t.dueDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
    return `<div class="content">${intro('Dates you choose','Only your saved possibilities with a date appear here. External election dates are shown separately as reference.')}<div class="panel">${recordRows('tasks',dated)}</div><div class="panel"><h2>Official reference</h2><p>ECQ announced the Redland mayoral by-election for 12 December 2026, with a full postal ballot. The notice of election and opening of nominations are scheduled for 10 November.</p><p>${link(campaign.electionSource,'Read ECQ’s 5 November announcement')}</p><p class="small muted">These are external dates, not a personal schedule. Nomination closing and ballot-return details should be checked in the official notice.</p></div></div>`;
  }
  function projectsView() {
    return `<div class="content">${intro('The work you can draw on','Existing projects retain their own context. A library entry does not make a proposal campaign policy.')}<div class="toolbar"><label class="field">Search projects<input id="project-search" type="search" placeholder="Try music, household or resilience"></label></div><p class="small muted" id="project-count"></p><div class="project-grid" id="project-results"></div></div>`;
  }
  function filterProjects() {
    const q = $('#project-search').value.toLowerCase(); const matches=projects.filter(p=>[p.title,p.summary,p.category,...p.tags].join(' ').toLowerCase().includes(q));
    $('#project-count').textContent=`${matches.length} of ${projects.length} projects`;
    $('#project-results').innerHTML=matches.map(p=>`<article class="project-card"><span class="badge">${esc(p.status)}</span><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="tags">${p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><div class="actions">${link(p.url,'Explore project')}${link(`${p.repo}/blob/${p.sourceCommit}/${p.sourcePath}`,'Reviewed source')}</div>${button('save-project','Save a possibility',`data-id="${esc(p.id)}"`)}</article>`).join('') || empty('No matching projects','Try another search.');
  }
  function agentsView() {
    return `<div class="content">${intro('Bring a question to an AI companion','Choose a research prompt, edit it and copy it into your preferred AI chat. These are prompts, not running agents or scheduled jobs.')}<div class="agent-grid">${[['sources','Find more public sources','Look for gaps in the radio, media and community source directory.'],['facts','Check a claim','Trace a factual claim to its original evidence and record uncertainty.'],['projects','Explore a connection','Compare a project with a local question without declaring a policy position.']].map(([id,title,description])=>`<article class="agent-card"><h3>${title}</h3><p>${description}</p>${button('prompt','Open prompt',`data-id="${id}"`)}</article>`).join('')}</div></div>`;
  }
  function settingsView() {
    return `<div class="content">${intro('Know where your work lives',local ? 'Local control room. Records are saved in this repository’s ignored private folder.' : 'Public research site. Your saved records live only in this browser profile on this device.')}<div class="panel"><h2>${local ? 'Private local storage' : 'Browser storage'}</h2><p>${local ? 'The local service writes private/operations.json. The CLI and local control room use the same records. Files are not uploaded by this interface.' : 'This is not an account login or a cloud backup. Other visitors cannot see your saved records. Anyone using this browser profile may be able to read them. Clearing site data can remove them.'}</p><div class="actions">${button('backup',local ? 'Create a local backup' : 'Download workspace backup','',false)}${button('download','Download workspace JSON')}${local ? '' : button('restore','Restore a browser backup')}</div></div><div class="panel"><h2>Private Google Drive connection</h2><p>Integration source and setup instructions are in the repository. A private folder has been prepared, but this interface is not connected to a deployed Google service. Saving here does not save to Google Drive.</p><p>${link(`${campaign.repository}/blob/main/docs/GOOGLE-DRIVE.md`,'Read setup instructions')}</p></div><div class="panel"><h2>Public enquiries</h2><p>The contact form keeps Luke’s email off the site. Submission remains unavailable until the private service is deployed and its URL configured.</p><a href="contact.html">View contact form</a></div><div class="panel"><h2>Sources and rights</h2><p>Research checked 8 November 2026. Dates and coverage can change. Original code uses the Strange But True Public Source Licence; photographs retain their credited Creative Commons licences.</p><p><a href="assets/photos/provenance.json">Photo register</a> · <a href="LICENCE.md">Licence</a> · <a href="privacy.html">Privacy</a></p></div></div>`;
  }
  function render(view=current) {
    if (!views[view]) view='overview'; current=view; location.hash=view;
    document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    $('#screen-title').textContent=views[view]; document.title=`${views[view]} | Luke’s election explorer`;
    $('#view').innerHTML=collections[view] ? recordView(collections[view]) : ({overview,media:mediaView,calendar:calendarView,projects:projectsView,agents:agentsView,settings:settingsView,activity:()=>`<div class="content">${intro('Your trail','A record of changes you explicitly saved. Browsing and opening sources are not logged.')}<div class="panel">${state.audit.length ? [...state.audit].reverse().map(a=>`<div class="audit-row"><time>${esc(a.at)}</time><span>${esc(a.action)} · ${esc(a.collection)}</span></div>`).join('') : empty('Your trail begins when you save','Explore freely. No activity is assigned to you.')}</div></div>`}[view])();
    if(view==='media')filterMedia(); if(view==='projects')filterProjects();
    $('#sidebar').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');
  }
  function openEditor(collection, id, preset={}) {
    const existing=id ? state[collection].find(r=>r.id===id) : null, record={...M.defaults[collection],...existing,...preset};
    $('#editor').innerHTML=`<form id="record-form"><div class="panel-head"><h2>${id ? 'Edit' : 'Capture'} ${collection==='tasks' ? 'a possibility' : 'a record'}</h2>${button('close','Close')}</div><div class="form-grid">${Object.entries(M.fields[collection]).map(([field,type])=>{
      const value=record[field] ?? '', required=['required','date-required','money'].includes(type), label=labels[field] || field;
      let input;
      if(Array.isArray(type))input=`<select id="field-${field}" name="${field}">${type.map(v=>`<option value="${v}"${v===value ? ' selected' : ''}>${esc(choiceLabel(collection,field,v))}</option>`).join('')}</select>`;
      else if(field==='contactId')input=`<select id="field-${field}" name="${field}"><option value="">No linked contact</option>${state.contacts.map(c=>`<option value="${esc(c.id)}"${c.id===value ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`;
      else if(['notes','authorisation','consentEvidence'].includes(field))input=`<textarea id="field-${field}" name="${field}" rows="5" maxlength="5000">${esc(value)}</textarea>`;
      else input=`<input id="field-${field}" name="${field}" type="${type.startsWith?.('date') ? 'date' : type==='email' ? 'email' : type==='url' ? 'url' : type==='money' ? 'number' : 'text'}" ${type==='money' ? 'min="0" step="0.01"' : ''} value="${esc(value)}" maxlength="5000"${required ? ' required' : ''}>`;
      return `<label class="field${field==='notes' ? ' full' : ''}" for="field-${field}"><span>${esc(label)}${required ? ' *' : ''}</span>${input}</label>`;
    }).join('')}</div><p class="help-text">${collection==='tasks' ? 'Leave the date and who fields empty if you wish. This saves a possibility, not a commitment.' : 'Saving records does not send messages, publish content or subscribe anyone.'}</p><p id="editor-error" role="alert"></p><div class="editor-actions">${button('close','Cancel')}<button type="submit" class="button">Save privately</button></div></form>`;
    $('#editor').showModal();
    $('#record-form').addEventListener('submit',async event=>{
      event.preventDefault(); const submit=event.target.querySelector('[type="submit"]');submit.disabled=true;
      try{await save(collection,Object.fromEntries(new FormData(event.target)),id);$('#editor').close();render();toast('Saved to your '+(local ? 'private local records.' : 'browser.'));}
      catch(error){$('#editor-error').textContent=error.message;}finally{submit.disabled=false;}
    });
  }
  function prompt(text) {$('#editor').innerHTML=`<div class="panel-head"><h2>Explore with AI</h2>${button('close','Close')}</div><label class="field">Edit the prompt<textarea id="ai-prompt" rows="16">${esc(text)}</textarea></label><p class="help-text">Copy this into an AI conversation when you choose. No agent is running from this page.</p><div class="editor-actions">${button('copy-prompt','Copy prompt','',false)}</div>`;$('#editor').showModal();}
  function researchPrompt(item) { return `Research the public election coverage and contact routes of ${item.name} in relation to the 2026 Redland City mayoral by-election, Queensland, Australia.\n\nStart with:\n${item.sourceUrls.join('\n')}\n\nFind original dated sources, distinguish current election commentary from outlet identity, and identify unresolved gaps. Use public professional contact routes only. Do not infer political support, privately profile citizens, send messages or make commitments. Give me options without a schedule or ranked outreach strategy. Keep summaries neutral and factual, retain source links and dates, and use no em dashes.\n\nCurrent research note: ${item.notes}`; }
  function download(text, name, type='application/json') {const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function restoreBrowser() {
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
    input.onchange=async()=>{try{
      if(!input.files[0])return;if(input.files[0].size>5000000)throw new Error('Backup exceeds the 5 MB browser restore limit.');
      const candidate=validateState(JSON.parse(await input.files[0].text()));
      $('#editor').innerHTML=`<h2>Restore this browser workspace?</h2><p>This replaces the saved records in this browser. It does not upload a file or change the local server.</p><ul>${Object.keys(M.fields).map(c=>`<li>${candidate[c].length} ${c}</li>`).join('')}</ul><p>Download your current workspace first if you want to keep it.</p><div class="editor-actions">${button('close','Cancel')}${button('download','Download current workspace')}<button type="button" class="button" id="confirm-restore">Replace browser records</button></div>`;
      $('#editor').showModal();$('#confirm-restore').onclick=()=>{try{localStorage.setItem(key,JSON.stringify(candidate));state=candidate;$('#editor').close();render();toast('Browser records restored.');}catch(error){toast(error.message,true);}};
    }catch(error){toast(error.message,true);}}; input.click();
  }
  document.addEventListener('click',async event=>{
    const nav=event.target.closest('[data-view]');if(nav){render(nav.dataset.view);return;}
    const el=event.target.closest('[data-action]');if(!el)return;
    const {action,id,collection}=el.dataset;
    try{
      if(action==='view')render(el.dataset.viewTarget);
      if(action==='close')$('#editor').close();
      if(action==='add')openEditor(collection);
      if(action==='edit')openEditor(collection,id);
      if(action==='save-source'){const item=media.find(m=>m.id===id);openEditor('tasks',null,{title:`Explore ${item.name}`,evidenceUrl:item.coverageUrl || item.website,notes:`${item.description}\n\n${item.notes}`});}
      if(action==='save-project'){const item=projects.find(p=>p.id===id);openEditor('tasks',null,{title:`Explore ${item.title}`,evidenceUrl:item.url,notes:item.summary});}
      if(action==='research-source')prompt(researchPrompt(media.find(m=>m.id===id)));
      if(action==='prompt')prompt(({sources:'Find additional public radio, print, television, online, podcast and community sources discussing the 2026 Redland City mayoral by-election in Queensland. Check original dated evidence. Return public contact routes, coverage links, research date and gaps. Do not infer support, score audiences, send messages, create schedules or collect private citizen details. Use no em dashes.',facts:'Help me check this factual claim: [paste claim]. Find primary evidence, record publication dates, explain uncertainty and separate facts from inference. Do not invent a policy position or publish anything. Use no em dashes.',projects:'Explore possible connections between this existing project [link] and this local question [question]. Describe what is already demonstrated, what is a proposal and what remains uncertain. Check council responsibilities against primary sources. Give me options without declaring commitments, scheduling activity or creating targeted political messages. Use no em dashes.'})[id]);
      if(action==='copy-prompt'){await navigator.clipboard.writeText($('#ai-prompt').value);toast('Prompt copied.');}
      if(action==='reset-media'){$('#media-search').value='';$('#media-kind').value='';$('#media-evidence').value='';filterMedia();}
      if(action==='surprise'){const shuffled=[...media];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}$('#discovery-cards').innerHTML=shuffled.slice(0,3).map(mediaCard).join('');}
      if(action==='download' || (action==='backup'&&!local))download(JSON.stringify(state,null,2)+'\n','redlands-workspace.json');
      if(action==='backup'&&local){const result=await api('backup',{});toast(`Local backup created: ${result.path}`);}
      if(action==='csv')download(M.exportCsv(state,collection),`${collection}.csv`,'text/csv');
      if(action==='restore'&&!local)await restoreBrowser();
    }catch(error){toast(error.message,true);}
  });
  document.addEventListener('input',event=>{if(event.target.id==='media-search')filterMedia();if(event.target.id==='project-search')filterProjects();});
  document.addEventListener('change',event=>{if(['media-kind','media-evidence'].includes(event.target.id))filterMedia();});
  $('#quick-add').onclick=()=>openEditor('tasks');
  $('#menu-toggle').onclick=()=>{$('#sidebar').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String($('#sidebar').classList.contains('open')));};
  addEventListener('hashchange',()=>{const view=location.hash.slice(1);if(view!==current)render(view);});
  addEventListener('storage',event=>{if(!local&&event.key===key){try{state=browserState();if(!$('#editor').open)render();toast('Workspace updated in another tab.');}catch(error){toast(error.message,true);}}});
  async function start(){
    try{
      [media,projects,campaign]=await Promise.all(['media','projects','campaign'].map(async name=>{const r=await fetch(`assets/data/${name}.json`);if(!r.ok)throw new Error(`Could not load ${name}. Please reload.`);return r.json();}));
      if(location.hostname==='127.0.0.1'&&location.port==='4183'){csrf=(await api('session')).csrfToken;state=await api('state');local=true;}
      else {try{state=browserState();}catch(error){toast(`Browser records could not be opened: ${error.message}`,true);$('#quick-add').disabled=true;throw error;}}
      $('#storage-status').textContent=local ? 'Private local records' : 'Saved in this browser';$('#storage-status').classList.add('connected');
      render(location.hash.slice(1)||'overview');
    }catch(error){$('#view').innerHTML=`<div class="content">${empty('Workspace could not open',error.message)}<p>Your existing data has not been replaced. Reload after checking storage or the local service.</p></div>`;$('#storage-status').textContent='Storage unavailable';$('#storage-status').classList.add('error');$('#quick-add').disabled=true;}
  }
  start();
})();
