import {readFileSync} from 'node:fs';

const excerpts = JSON.parse(readFileSync(new URL('../data/lyric-excerpts.json', import.meta.url), 'utf8'));
const music = JSON.parse(readFileSync(new URL('../data/visual-music.json', import.meta.url), 'utf8'));
const tracks = new Map(music.tracks.map(track => [track.id, track]));
const quotes = new Map(excerpts.quotes.map(quote => [quote.id, quote]));
const normalise = text => text.replace(/\s+/g, ' ').trim();
const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

for (const quote of excerpts.quotes) {
  const track = tracks.get(quote.trackId);
  if (!track || !track.lyrics.includes(quote.lines[0]) || !normalise(track.lyrics).includes(normalise(quote.lines.join(' ')))) {
    throw new Error('Lyric excerpt does not match its source: '+quote.id);
  }
}
for (const id of Object.values(excerpts.placements)) if (!quotes.has(id)) throw new Error('Missing lyric excerpt: '+id);

function at(placement) {
  const quote = quotes.get(excerpts.placements[placement]);
  return quote ? {quote, track: tracks.get(quote.trackId)} : null;
}

export function lyricQuote(placement, base = '') {
  const value = at(placement);
  if (!value) return '';
  const {quote, track} = value;
  return `<figure class="lyric-excerpt" data-lyric-excerpt="${escape(quote.id)}"><blockquote><p>${quote.lines.map(escape).join('<br>')}</p></blockquote><figcaption><a href="${escape(base+'music.html#music-track-'+track.number)}">${escape(track.title)} · i C. infinity ↗</a><span>Lyrics by Luke Nathan Hayes</span>${quote.context ? `<span>${escape(quote.context)}</span>` : ''}${track.severeLanguage ? '<span class="lyric-recording-warning">Recording contains severe language.</span>' : ''}</figcaption></figure>`;
}

export function wikiLyricQuote(placement, site) {
  const value = at(placement);
  if (!value) return '';
  const {quote, track} = value;
  const url = new URL('music.html#music-track-'+track.number, site).href;
  return `\n\n## In the music\n\n${quote.lines.map(line => '> '+line).join('\n')}\n\n[${track.title} · i C. infinity](${url}). Lyrics by Luke Nathan Hayes.${quote.context ? ' '+quote.context : ''}${track.severeLanguage ? ' **Recording contains severe language.**' : ''}`;
}
