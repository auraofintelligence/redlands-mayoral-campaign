import {readFileSync} from 'node:fs';
import {lyricQuote} from './lyric-excerpts.mjs';

const profile = JSON.parse(readFileSync(new URL('../data/visual-profile.json', import.meta.url), 'utf8'));
const workHistory = JSON.parse(readFileSync(new URL('../data/visual-work-history.json', import.meta.url), 'utf8'));
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const local = (base, path) => `${base || ''}${path}`;
const makeLink = (e, href, label, className = '') => `<a${className ? ` class="${className}"` : ''} href="${e(href)}">${e(label)}</a>`;
const sourceCards = (e, links) => links.map(item => `<article class="card"><p class="eyebrow">Source collection</p><h3>${e(item.title)}</h3><p>${e(item.description)}</p>${makeLink(e, item.url, `Open ${item.title}`)}</article>`).join('');
const linkedProfileText = (e, text, base = '') => {
  const links = [
    ['Strange But True',profile.links.find(item=>item.id==='strange-but-true').url],
    ['Project Atlas',profile.links.find(item=>item.id==='project-atlas').url],
    ['Open Record',profile.links.find(item=>item.id==='open-record').url],
    ['A Protopian Gambit',local(base,'music.html')],
    ['i C. infinity',profile.links.find(item=>item.id==='music-universe').url]
  ];
  return links.reduce((html,[label,url])=>html.replaceAll(e(label),makeLink(e,url,label)),e(text));
};
const projectNotices = (e, base = '') => `<p>${linkedProfileText(e,profile.projectOrigin,base)}</p><p>${e(profile.rightsNotice)} Read the ${makeLink(e,local(base,'licence.html'),'Strange But True Public Source Licence')} and ${makeLink(e,local(base,'licensing.html'),'discuss the required agreements with Luke')}.</p>`;

export function renderAbout({e = escape, base = ''} = {}) {
  return `<section class="section prose"><div class="section-head"><p class="eyebrow">About Luke</p><h2>The person behind the work</h2></div>${lyricQuote('about',base)}
    <p class="lede">${linkedProfileText(e,profile.longBio[0],base)}</p>
    <p>${linkedProfileText(e,profile.longBio[1],base)}</p>
    <p>${linkedProfileText(e,profile.longBio[2],base)}</p>
    <p>${linkedProfileText(e,profile.longBio[3],base)}</p>
    ${projectNotices(e,base)}
    <div class="actions">${makeLink(e, local(base,'music.html'),'Listen to A Protopian Gambit','button')}${makeLink(e, local(base,'contact.html'),'Contact Luke','button outline')}</div>
  </section>
  <section class="section prose" id="councillor-training"><p class="eyebrow">Councillor training</p><h2>So You Want to Be a Councillor</h2><p>Luke completed “So You Want to Be a Councillor - Training” on 8 November 2026. The statement of completion was issued by the Department of Local Government, Water and Volunteers.</p><a class="certificate-preview" href="${e(local(base,'assets/certificates/luke-hayes-councillor-training.pdf'))}" aria-label="View Luke Hayes’ councillor training certificate (PDF)"><img src="${e(local(base,'assets/certificates/luke-hayes-councillor-training.webp'))}" alt="Statement of completion for Luke Hayes: So You Want to Be a Councillor - Training, completed 8 November 2026." width="1131" height="1600" loading="lazy" decoding="async"></a><div class="actions">${makeLink(e,local(base,'assets/certificates/luke-hayes-councillor-training.pdf'),'View the certificate (PDF, 18 KB)','button outline')}</div></section>
  <section class="section prose"><p class="eyebrow">In conversation</p><h2>Music, mirrors and the way through</h2><p>Read the full interview with Luke about music, self-reflection, Community Hours and his earlier consideration of the mayoral role. Luke has since decided not to contest this by-election.</p><a class="button" href="${e(local(base,'interview.html'))}">Read the interview</a></section>
  <section class="section" id="work-history"><div class="section-head"><p class="eyebrow">Work history</p><h2>The jobs and the work involved</h2><p>Each job title links to its record in Luke’s World of Work, with the tasks, dates and sources behind it.</p></div><ul class="work-history-records">${workHistory.records.map(record => {
    const organisation = record.organisation.startsWith('Employer not yet named') ? record.organisation.split('; ').slice(1).join('; ') : record.organisation;
    return `<li>${makeLink(e, workHistory.page+'#record-'+record.id,record.title)}<p>${e([organisation,record.location].filter(Boolean).join(' · '))}</p></li>`;
  }).join('')}</ul><div class="actions">${makeLink(e,workHistory.page,'Explore the illustrated work, education and volunteering history','button outline')}</div></section>
  <section class="section"><div class="section-head"><p class="eyebrow">Read the record</p><h2>Follow the original sources</h2><p>Choose a route through the life, work history and project collection.</p></div><div class="cards">${sourceCards(e, profile.links.slice(0,4))}</div></section>
  <section class="section prose"><p class="eyebrow">How this exploration works</p><h2>Options, questions and room to choose</h2><p>${e(profile.workingApproach)}</p><p>The project pages introduce the work. The wiki holds the detail, sources and proposed connections with council responsibilities.</p><div class="actions">${makeLink(e, local(base,'projects.html'),'Explore the projects','button outline')}${makeLink(e,'https://github.com/auraofintelligence/redlands-mayoral-campaign/wiki/Home','Read the GitHub Wiki','button outline')}</div></section>`;
}

export function renderMedia({e = escape, base = ''} = {}) {
  const downloads = [
    ['Luke-Nathan-Hayes-media-kit.zip','Download the media kit (ZIP)'],
    ['Luke-Nathan-Hayes-short-bio.txt','Download short biography'],
    ['Luke-Nathan-Hayes-biography.txt','Download biography'],
    ['Luke-Nathan-Hayes-work-history.txt','Download work history and individual record links'],
    ['Luke-Nathan-Hayes-media-facts.txt','Download media fact sheet'],
    ['Luke-Nathan-Hayes-music-during-campaign.txt','Download music broadcasting note'],
    ['airplay-log-template.csv','Download blank airplay-log CSV']
  ].map(([path,label]) => `<li><a href="${e(local(base,`assets/press/${path}`))}" download>${e(label)}</a></li>`).join('');
  return `<section class="section prose"><div class="section-head"><p class="eyebrow">Media kit</p><h2>Luke Nathan Hayes</h2><p>Biography, source material and recorded-music resources for interviews and reporting.</p></div>
    <p class="lede">${linkedProfileText(e,profile.shortBio,base)}</p><p>Luke is not contesting the 2026 Redland City mayoral by-election. The current site is Redlands Civic Lab, an independent civic simulation.</p>${projectNotices(e,base)}<div class="actions">${makeLink(e, local(base,'contact.html?topic=media'),'Make a media enquiry','button')}${makeLink(e, profile.links[0].url,'Open the source record','button outline')}</div>
  </section>
  <section class="section prose"><p class="eyebrow">Full conversation</p><h2>An interview with Luke</h2><p>Fifteen questions and answers about music, self-reflection, civic participation, GAJRA Earth and his earlier consideration of the Redlands mayoral role. Luke is not contesting this by-election.</p>${makeLink(e,local(base,'interview.html'),'Read the full interview','button')}</section>
  <section class="section"><div class="section-head"><h2>Biographies and facts</h2><p>Editable plain-text resources, with the source routes kept alongside them.</p></div><div class="cards"><article class="card"><h3>Download the press notes</h3><ul class="resource-list">${downloads}</ul></article><article class="card"><h3>Short biography</h3><p>${linkedProfileText(e,profile.shortBio,base)}</p></article><article class="card"><h3>Names and music credits</h3><dl><dt>Name</dt><dd>${e(profile.name)}</dd><dt>Artist</dt><dd>${e(profile.artistName)}</dd><dt>Lyrics</dt><dd>Written by Luke Nathan Hayes.</dd><dt>Music creation</dt><dd>Created using generative AI.</dd><dt>Performance</dt><dd>Luke does not currently perform the music live.</dd></dl></article></div></section>
  <section class="section prose" id="music-during-campaign"><p class="eyebrow">For broadcasters and presenters</p><h2>Recorded music and airplay records</h2><p>Luke is not contesting the 2026 Redland City mayoral by-election. This note continues his request for accurate records of known broadcasts. Its existing address is retained for earlier links.</p><p>As i C. infinity, Luke writes his lyrics and creates his music using generative AI. The songs carry ideas from his wider work, including projects discussed in this civic collection. Stations should know about those connections when considering a song or interview.</p><p>Luke asks for a record of every known play and appearance as part of his approach to accurate, transparent records. Please share a playlist, transmission log or confirmation with the station, programme, song and version, broadcast date, start time, time zone, duration if known and any replay link or evidence reference. Mark approximate times and leave unknown times unknown.</p><p>For a full-album feature, list each track actually played. Record interviews separately, include repeats with their own dates and times, and identify simultaneous radio and online streaming as a simulcast.</p><p>Programming and interview decisions remain with the station. Please state any advertising, sponsorship, payment, exchange, discount or other offered support separately. A recorded editorial play is not automatically treated as a donation or assigned an advertising value. The record does not itself settle the legal classification.</p><p>Scheduled items, reported plays and confirmed broadcasts are kept distinct. Complete coverage depends on station records and confirmed reports; no automatic monitoring of every station or guaranteed completeness is claimed. Private correspondence and unreviewed records are not automatically published.</p><div class="actions">${makeLink(e,local(base,'contact.html?topic=media&reason=music-airplay'),'Send a playlist or broadcast log','button')}${makeLink(e,local(base,'assets/press/Luke-Nathan-Hayes-music-during-campaign.txt'),'Read the full broadcaster note','button outline')}${makeLink(e,local(base,'assets/press/airplay-log-template.csv'),'Blank airplay-log CSV','button outline')}</div><p class="small">An outlet’s existing log is also welcome. The note and CSV are included in the media-kit ZIP. Stations retain their own broadcasting obligations. See ${makeLink(e,'https://www.ecq.qld.gov.au/election-participants/local-election-participants/broadcasters-and-publishers/overview','ECQ broadcaster guidance')} and ${makeLink(e,'https://www.acma.gov.au/publications/2019-08/guide/guidelines-broadcast-political-matter','ACMA political and election matter guidance')}.</p></section>
  <section class="section prose"><h2>Published portrait</h2><p><a class="button outline" href="${e(local(base,'assets/press/luke-hayes-published-portrait.webp'))}" download>Download Luke Hayes’ published portrait (WebP, 104 KB)</a></p><p class="small">Luke Hayes’ portrait from the ${makeLink(e,'https://auraofintelligence.github.io/strange-but-true/about.html','Strange But True About page')}, copied unchanged. Credit: Luke Nathan Hayes / Strange But True. Rights: ${makeLink(e,local(base,'licence.html'),'Strange But True Public Source Licence')}. The portrait is also included in the media kit.</p></section>
  <section class="section"><div class="section-head"><h2>Interview topics</h2><p>Questions can follow one project or explore the wider body of work.</p></div><div class="cards">${profile.interviewTopics.map(topic => `<article class="card"><h3>${e(topic.title)}</h3><p>${e(topic.description)}</p></article>`).join('')}</div></section>
  <section class="section"><div class="section-head"><h2>Music and image resources</h2></div><div class="cards"><article class="card"><h3>A Protopian Gambit</h3><p>The complete album spans EDM and house, pop, rock, cultural, reggae and coastal styles. The music page includes landscape and portrait players, a lyric sheet and the severe-language warning for “Don't Try to Fix Me”.</p>${makeLink(e, local(base,'music.html'),'Open the album and lyric sheet')}</article><article class="card"><h3>Photographs and project artwork</h3><p>Real local photography and generated project imagery have separate credits. Read the credit and licence attached to each asset before reuse.</p>${makeLink(e, local(base,'credits.html'),'Open image credits')}${makeLink(e, local(base,'licence.html'),'Read the Strange But True licence')}</article><article class="card"><h3>Research and reporting</h3><p>The Open Record links life history, original documents, public submissions and project source material. The work-history site provides its own readable source record.</p>${makeLink(e, profile.links[0].url,'Read the Open Record')}${makeLink(e, profile.links[1].url,'Read the work history')}</article></div></section>`;
}

function validFormUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'script.google.com' && /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname);
  } catch { return false; }
}

export function renderContact({e = escape, base = '', contactFormUrl = ''} = {}) {
  const ready = validFormUrl(contactFormUrl);
  const action = ready ? ` action="${e(contactFormUrl)}"` : '';
  return `<section class="section prose"><div class="section-head"><p class="eyebrow">Contact Luke</p><h2>Start a conversation</h2><p>For a project question, interview, correction or accessibility request, use the form below.</p></div>
    ${ready ? '<p>Your message will be submitted to Luke’s private contact inbox. A receipt appears after the service accepts it for sending.</p>' : '<div class="notice contact-state" role="status"><h3>Message delivery is being connected</h3><p>The form is not accepting messages yet. It will open once its private delivery service has been configured and checked.</p></div>'}
    <form class="contact-form" method="post" enctype="application/x-www-form-urlencoded"${action} data-contact-ready="${ready}">
      <fieldset${ready ? '' : ' disabled'}><legend>Your message</legend>
        <label for="contact-name">Name <span aria-hidden="true">*</span></label><input id="contact-name" name="name" autocomplete="name" maxlength="120" required>
        <label for="contact-email">Reply email <span aria-hidden="true">*</span></label><input id="contact-email" name="email" type="email" autocomplete="email" maxlength="254" required>
        <label for="contact-topic">Topic</label><select id="contact-topic" name="topic"><option value="general">General enquiry</option><option value="media">Media or interview request</option><option value="project">Project conversation</option><option value="correction">Correction or source question</option><option value="accessibility">Accessibility</option><option value="privacy">Privacy</option></select>
        <label for="contact-message">Message <span aria-hidden="true">*</span></label><textarea id="contact-message" name="message" rows="9" minlength="1" maxlength="5000" required></textarea>
        <div class="honeypot" aria-hidden="true" hidden><label for="contact-website">Website</label><input id="contact-website" name="website" tabindex="-1" autocomplete="off"></div>
        <p class="small">${ready ? 'Your' : 'When delivery is connected, your'} name, reply address, topic and message are sent to Luke’s contact inbox. Include only the information needed for your enquiry. This form does not subscribe you to updates.</p>
        <button class="button" type="submit"${ready ? '' : ' disabled'}>Send message</button>
      </fieldset>
    </form><p class="small">${makeLink(e, local(base,'privacy.html'),'Read the privacy notice')}</p>${lyricQuote('contact',base)}
  </section>`;
}
