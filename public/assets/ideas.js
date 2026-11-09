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
  const previous=browser.querySelector('[data-ideas-previous]');
  const pageLinks=[...document.querySelectorAll('.page-sequence a')];
  const floatingLinks=[...document.querySelectorAll('.floating-nav a')];
  const pageTargets=pageLinks.map(link=>({href:link.getAttribute('href'),label:link.textContent.replace(/^(Previous|Next)\s*[←→]?|[←→]$/g,'').trim(),topic:false}));
  const topicPicker=browser.querySelector('.ideas-topic-menu');
  const compact=window.matchMedia('(max-width:760px)');
  topicPicker.open=!compact.matches;
  compact.addEventListener('change',event=>{topicPicker.open=!event.matches;});
  let current=topics[0];
  const topicLabel=topic=>browser.querySelector(`[data-ideas-topic="${topic}"] span`)?.textContent;
  function updateSequence(query){
    document.querySelector('.page-sequence').setAttribute('aria-label','Previous and next');
    document.querySelector('.floating-nav').setAttribute('aria-label','Floating navigation');
    more.setAttribute('aria-label','Previous and next');
    const index=topics.indexOf(current);
    const topicTarget=position=>({href:'#ideas-'+topics[position],label:topicLabel(topics[position]),topic:true});
    const targets=query||index<0?pageTargets:[index===0?pageTargets[0]:topicTarget(index-1),index===topics.length-1?pageTargets[1]:topicTarget(index+1)];
    for(const [position,target] of targets.entries()){
      const direction=position===0?'Previous':'Next',arrow=position===0?'←':'→';
      const label=direction+(target.topic?' topic':' page');
      const pageLink=pageLinks[position],floatingLink=floatingLinks[position===0?0:2],topicLink=position===0?previous:next;
      for(const link of [pageLink,floatingLink,topicLink]){
        link.setAttribute('href',target.href);
        link.setAttribute('aria-label',label+': '+target.label);
        link.title=label+': '+target.label;
      }
      pageLink.replaceChildren(Object.assign(document.createElement('span'),{textContent:label}),document.createTextNode(arrow+' '+target.label));
      topicLink.replaceChildren(Object.assign(document.createElement('span'),{textContent:label}),Object.assign(document.createElement('strong'),{textContent:(position===0?arrow+' ':'')+target.label+(position===1?' '+arrow:'')}));
    }
  }
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
    updateSequence(query);
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
  for(const link of [previous,next,...pageLinks,floatingLinks[0],floatingLinks[2]])link.addEventListener('click',event=>{
    const target=link.getAttribute('href');
    if(!target.startsWith('#ideas-'))return;
    event.preventDefault();const topic=target.replace('#ideas-','');history.pushState(null,'',target);choose(topic,{scroll:true});
  });
  search.addEventListener('input',render);
  browser.querySelector('[data-ideas-search-form]').addEventListener('submit',event=>event.preventDefault());
  browser.querySelector('[data-ideas-reset]').addEventListener('click',()=>{search.value='';render();search.focus();});
  for(const event of ['hashchange','popstate'])window.addEventListener(event,()=>{
    const topic=topicForHash();
    if(topic)choose(topic);
    else if(!location.hash)choose(topics[0]);
    const hash=location.hash.slice(1);
    if(/^idea-\d{2}$/.test(hash))document.getElementById(hash)?.scrollIntoView({block:'start'});
  });
  choose(topicForHash()||topics[0]);
  if(/^#idea-\d{2}$/.test(location.hash))document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'});
})();
