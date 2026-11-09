const projectSearch=document.querySelector('#visual-project-search');
const projectTopic=document.querySelector('#visual-project-topic');
function filterVisualProjects(){
  const q=(projectSearch?.value||'').trim().toLowerCase(),topic=projectTopic?.value||'';let total=0;
  document.querySelectorAll('[data-visual-project]').forEach(card=>{const match=(!q||card.textContent.toLowerCase().includes(q))&&(!topic||card.dataset.subject===topic);card.hidden=!match;if(match)total++});
  document.querySelectorAll('[data-project-section]').forEach(section=>section.hidden=![...section.querySelectorAll('[data-visual-project]')].some(card=>!card.hidden));
  const count=document.querySelector('#visual-project-count');if(count)count.textContent=total+(total===1?' project':' projects');
  const empty=document.querySelector('#visual-project-empty');if(empty)empty.hidden=total!==0;
}
projectSearch?.addEventListener('input',filterVisualProjects);projectTopic?.addEventListener('change',filterVisualProjects);
document.querySelector('#visual-project-reset')?.addEventListener('click',()=>{projectSearch.value='';projectTopic.value='';filterVisualProjects();projectSearch.focus()});
if(projectSearch){const topic=new URLSearchParams(location.search).get('subject');if(topic&&[...projectTopic.options].some(o=>o.value===topic))projectTopic.value=topic;filterVisualProjects()}
document.querySelectorAll('.nav-menu nav a').forEach(a=>a.addEventListener('click',()=>a.closest('details').open=false));
const contactTopic=document.querySelector('select[name="topic"]');const requestedTopic=new URLSearchParams(location.search).get('topic');if(contactTopic&&[...contactTopic.options].some(o=>o.value===requestedTopic))contactTopic.value=requestedTopic;
const contactMessage=document.querySelector('#contact-message');
if(contactMessage&&!contactMessage.value){
  const parameters=new URLSearchParams(location.search),idea=parameters.get('idea'),title=(parameters.get('ideaTitle')||'').replace(/[\r\n]/g,' ').slice(0,200);
  if(/^(?:0[1-9]|[1-4][0-9]|5[0-2])$/.test(idea||''))contactMessage.value=`About Redlands idea ${idea}${title?': '+title:''}\n\nMy question, experience or source:\n`;
}
