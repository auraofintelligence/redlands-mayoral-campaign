'use strict';
(() => {
  const browser=document.querySelector('[data-ideas-browser]');
  if(!browser)return;
  const search=browser.querySelector('#ideas-search');
  const panels=[...browser.querySelectorAll('[data-ideas-panel]')];
  const cards=[...browser.querySelectorAll('[data-idea-card]')];
  const topics=panels.map(panel=>panel.dataset.ideasPanel);
  const links=[...document.querySelectorAll('[data-ideas-topic]')];
  const results=browser.querySelector('#ideas-result-count');
  const empty=browser.querySelector('.ideas-no-results');
  const more=browser.querySelector('.ideas-browse-more');
  const next=browser.querySelector('[data-ideas-next]');
  const topicPicker=browser.querySelector('.ideas-topic-menu');
  const compact=window.matchMedia('(max-width:760px)');
  topicPicker.open=!compact.matches;
  compact.addEventListener('change',event=>{topicPicker.open=!event.matches;});
  let current=topics[0];
  const topicLabel=topic=>browser.querySelector(`[data-ideas-topic="${topic}"] span`)?.textContent;
  const topicForHash=()=>{
    const hash=location.hash.slice(1);
    if(hash==='ideas-all')return 'all';
    if(hash.startsWith('idea-'))return panels.find(panel=>panel.querySelector('#'+CSS.escape(hash)))?.dataset.ideasPanel;
    const topic=hash.replace(/^ideas-/,'');
    return topics.includes(topic)?topic:null;
  };
  function render(){
    const query=search.value.trim().toLocaleLowerCase('en-AU');
    let total=0;
    for(const panel of panels){
      const topic=panel.dataset.ideasPanel;
      let count=0;
      for(const card of panel.querySelectorAll('[data-idea-card]')){
        const text=card.textContent.toLocaleLowerCase('en-AU');
        const matchesSearch=query.split(/\s+/).every(term=>{
          if(term==='ai')return /\bai\b/.test(text);
          const variants=[term];
          if(term.endsWith('ies'))variants.push(term.slice(0,-3)+'y');
          else if(term.length>3&&term.endsWith('s'))variants.push(term.slice(0,-1));
          if(/^volunteer(?:ing|s)?$/.test(term))variants.push('voluntary');
          return variants.some(value=>text.includes(value));
        });
        const match=(!query?(current==='all'||current===topic):matchesSearch);
        card.hidden=!match;if(match)count++;
      }
      panel.hidden=count===0;
      panel.querySelector('.ideas-connections').hidden=Boolean(query);
      total+=count;
    }
    for(const link of links){
      if(!query&&link.dataset.ideasTopic===current)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
    }
    const label=topicLabel(current)||'all topics';
    results.textContent=query?`${total} of ${cards.length} ideas match “${search.value.trim()}”.`:current==='all'?`All ${cards.length} ideas, grouped by topic.`:`${total} ideas · ${label}`;
    empty.hidden=total>0;
    more.hidden=Boolean(query)||current==='all';
    const nextTopic=topics[(topics.indexOf(current)+1)%topics.length];
    const nextLabel=topicLabel(nextTopic);
    next.href='#ideas-'+nextTopic;next.textContent=nextLabel+' →';
  }
  function choose(topic,{scroll=false}={}){
    if(topic!=='all'&&!topics.includes(topic))return;
    current=topic;search.value='';render();
    if(compact.matches)topicPicker.open=false;
    if(scroll){
      browser.scrollIntoView({block:'start'});
      const heading=panels.find(panel=>!panel.hidden)?.querySelector('h2');
      heading?.focus({preventScroll:true});
    }
  }
  for(const link of links)link.addEventListener('click',event=>{
    event.preventDefault();
    const topic=link.dataset.ideasTopic;
    history.pushState(null,'','#ideas-'+topic);choose(topic,{scroll:true});
  });
  next.addEventListener('click',event=>{
    event.preventDefault();const topic=next.hash.replace('#ideas-','');history.pushState(null,'',next.hash);choose(topic,{scroll:true});
  });
  search.addEventListener('input',render);
  browser.querySelector('[data-ideas-search-form]').addEventListener('submit',event=>event.preventDefault());
  browser.querySelector('[data-ideas-reset]').addEventListener('click',()=>{search.value='';render();search.focus();});
  for(const event of ['hashchange','popstate'])window.addEventListener(event,()=>{
    choose(topicForHash()||topics[0]);
    const hash=location.hash.slice(1);
    if(/^idea-\d{2}$/.test(hash))document.getElementById(hash)?.scrollIntoView({block:'start'});
  });
  choose(topicForHash()||topics[0]);
  if(/^#idea-\d{2}$/.test(location.hash))document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'});
})();
