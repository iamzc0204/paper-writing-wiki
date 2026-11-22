const search=document.querySelector('#wiki-search');
if(search){search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase().normalize('NFKC');let count=0;for(const card of document.querySelectorAll('.wiki-card')){card.hidden=!card.dataset.search.toLowerCase().normalize('NFKC').includes(q);if(!card.hidden)count++;}document.querySelector('#wiki-count').textContent=`${count} 個主題`;document.querySelector('.wiki-empty').hidden=count!==0;});}

const slides=[...document.querySelectorAll('[data-slide]')];
if(slides.length){
 const deck=document.querySelector('.presentation');const outline=document.querySelector('#outline-dialog');const sources=document.querySelector('#source-dialog');
 const evidence=JSON.parse(document.querySelector('#slide-evidence').textContent);let index=Math.max(0,Math.min(slides.length-1,(Number(location.hash.slice(1))||1)-1));let all=false;
 function show(next,update=true){index=Math.max(0,Math.min(slides.length-1,next));slides.forEach((s,i)=>s.hidden=!all&&i!==index);document.querySelector('#prev-slide').disabled=index===0;document.querySelector('#next-slide').disabled=index===slides.length-1;document.querySelector('#deck-position').textContent=`${index+1} / ${slides.length}`;document.querySelector('.deck-progress>span').style.width=`${(index+1)/slides.length*100}%`;if(update)history.replaceState(null,'',`#${index+1}`);}
 show(index,false);
 document.querySelector('#prev-slide').addEventListener('click',()=>show(index-1));document.querySelector('#next-slide').addEventListener('click',()=>show(index+1));
 document.querySelector('#open-outline').addEventListener('click',()=>outline.showModal());
 document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
 document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>{show(Number(button.dataset.go));outline.close();}));
 document.querySelector('#read-all').addEventListener('click',event=>{all=!all;deck.classList.toggle('is-overview',all);event.currentTarget.textContent=all?'返回簡報':'閱讀全部';show(index);});
 document.querySelector('#print-deck').addEventListener('click',()=>window.print());
 document.addEventListener('keydown',event=>{if(outline.open||sources.open||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)||event.ctrlKey||event.altKey||event.metaKey)return;if(['ArrowRight','PageDown'].includes(event.key)){event.preventDefault();show(index+1);}if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();show(index-1);}if(event.key==='Home'){event.preventDefault();show(0);}if(event.key==='End'){event.preventDefault();show(slides.length-1);}});
 window.addEventListener('hashchange',()=>show((Number(location.hash.slice(1))||1)-1,false));
 document.querySelectorAll('[data-source]').forEach(button=>button.addEventListener('click',()=>{
  const body=document.querySelector('.source-dialog-body');body.replaceChildren();
  for(const claim of evidence[Number(button.dataset.source)].claims){
   const section=document.createElement('section');const title=document.createElement('h3');title.textContent=claim.id;const text=document.createElement('p');text.textContent=claim.text;
   const wiki=document.createElement('a');wiki.href=claim.wikiUrl;wiki.textContent=`Wiki：${claim.wikiTitle} ↗`;section.append(title,text,wiki);
   for(const source of claim.sourceLabels){const link=document.createElement('a');link.href=source.url;link.target='_blank';link.rel='noreferrer';link.textContent=`${source.id} ${source.title} ↗`;section.append(link);}
   const locator=document.createElement('small');locator.textContent=`原文定位：${claim.locator}`;section.append(locator);body.append(section);
  }sources.showModal();
 }));
 document.querySelectorAll('.quiz').forEach(quiz=>quiz.querySelectorAll('[data-option]').forEach(button=>button.addEventListener('click',()=>{for(const option of quiz.querySelectorAll('button'))option.setAttribute('aria-pressed',String(option===button));const correct=button.dataset.option===quiz.dataset.answer;const feedback=quiz.querySelector('.quiz-feedback');feedback.textContent=(correct?'答對了。':'再想一想。')+feedback.dataset.explanation;feedback.classList.toggle('is-wrong',!correct);})))
}
