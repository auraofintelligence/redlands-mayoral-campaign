import {readFileSync} from 'node:fs';

const {destinations} = JSON.parse(readFileSync(new URL('../data/project-destinations.json', import.meta.url), 'utf8'));

export function sourceRepoName(value = '') {
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    return url.hostname === 'github.com' && parts[0]?.toLowerCase() === 'auraofintelligence'
      ? (parts[1] || '').replace(/\.git$/, '') : '';
  } catch { return ''; }
}

export function projectDestination(repoName) {
  return destinations[String(repoName || '').toLowerCase()];
}

// Preserve exact file/licence citations. Only repository landing pages and their
// README doorway are replaced by the project's recorded published destination.
export function publishedProjectUrl(value = '') {
  const repoName = sourceRepoName(value), destination = projectDestination(repoName);
  if (!destination?.url) return value;
  const parts = new URL(value).pathname.split('/').filter(Boolean);
  return parts.length === 2 || (parts.length === 5 && parts[2] === 'blob' && /^readme(?:\.md)?$/i.test(parts[4]))
    ? destination.url : value;
}

export function publishedProjectLinks(html) {
  return html.replace(/href="(https:\/\/github\.com\/auraofintelligence\/[^"<>]+)"/g,
    (attribute, url) => `href="${publishedProjectUrl(url)}"`);
}
