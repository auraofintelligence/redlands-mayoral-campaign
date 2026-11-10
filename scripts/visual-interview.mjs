import {readFileSync} from 'node:fs';

const interview = JSON.parse(readFileSync(new URL('../data/visual-interview.json', import.meta.url), 'utf8'));

export function renderInterview({e}) {
  const sections = new Map(interview.sections.map(section => [section.start, section]));
  return `<section class="section prose interview-introduction"><p class="eyebrow">Full interview · 10 November 2026</p><h2>In Luke’s words</h2><p class="notice">This conversation took place while Luke was considering the mayoral role. He later decided not to contest the by-election. The answers retain his thinking at the time.</p><p>The questions were asked by an AI assistant. Luke’s answers are presented in full, with spelling, punctuation and paragraph breaks tidied for reading.</p><p>Community Hour, or C-hour, is Luke’s proposal for a time-based reciprocity ledger, where each person’s hour counts equally. GAJRA Earth means Global Association for Joyful Responsible Abundance on Earth. Both are introduced in the conversation.</p><nav class="interview-contents" aria-label="Interview topics">${interview.sections.map(section => `<a href="#${e(section.id)}">${e(section.title)}</a>`).join('')}</nav></section>
  <div class="prose interview-conversation">${interview.exchanges.map((exchange, index) => {
    const section = sections.get(index);
    return `${section ? `<h2 id="${e(section.id)}">${e(section.title)}</h2>` : ''}${index === 5 ? '<p class="interview-context"><strong>Interviewer:</strong> The immediate audience is radio presenters, producers and journalists who haven’t met you, then their listeners and readers, including Redlands residents. The pack should help them understand how you think and ask informed questions.</p>' : ''}<article class="interview-answer" id="question-${index+1}"><h3><span class="eyebrow">Question ${index+1}</span>${e(exchange.question)}</h3>${exchange.answer.split('\n\n').map((paragraph, part) => `<p>${part === 0 ? '<strong>Luke:</strong> ' : ''}${e(paragraph)}</p>`).join('')}</article>`;
  }).join('')}</div>
  <section class="section prose"><h2>Follow the conversation</h2><p><a href="music.html">Listen to A Protopian Gambit and read the lyrics</a>, <a href="ideas.html">explore the Redlands questions</a>, or <a href="contact.html">send Luke a question</a>.</p><p>For more personal background, read <a href="https://auraofintelligence.github.io/strange-but-true/about.html">About Luke at Strange But True</a>. The <a href="about.html#work-history">work history</a> links to individual job records.</p></section>`;
}
