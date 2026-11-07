const search = document.querySelector('#project-search');
const category = document.querySelector('#project-category');
function filterProjects() {
  const query = (search?.value || '').trim().toLowerCase();
  const group = category?.value || '';
  const cards = [...document.querySelectorAll('[data-project]')];
  let count = 0;
  cards.forEach(card => {
    const match = (!query || card.textContent.toLowerCase().includes(query)) && (!group || card.dataset.category === group);
    card.hidden = !match;
    if (match) count++;
  });
  const output = document.querySelector('#result-count');
  if (output) output.textContent = `${count} of ${cards.length} projects shown`;
  const empty = document.querySelector('#empty-results');
  if (empty) empty.hidden = count !== 0;
}
search?.addEventListener('input', filterProjects);
category?.addEventListener('change', filterProjects);
if (search) { search.value = new URLSearchParams(window.location.search).get('topic') || ''; filterProjects(); }
document.querySelector('#reset-filters')?.addEventListener('click', () => { search.value = ''; category.value = ''; filterProjects(); search.focus(); });
document.querySelectorAll('.menu nav a').forEach(link => link.addEventListener('click', () => link.closest('details').open = false));
