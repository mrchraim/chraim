/* CHRVVIM Plus: site-wide local search + safe PWA setup. No third-party analytics.
   UI strings are localized through window.CHRVVIM_PAGE (page-i18n.js) when present,
   and re-localized on the "cc:lang" event; the Arabic text in the markup is the
   built-in fallback so the feature still works if page-i18n.js is unavailable. */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const norm=s=>String(s||'').toLocaleLowerCase('ar').normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').trim();
function T(k,fb){try{if(window.CHRVVIM_PAGE)return window.CHRVVIM_PAGE.t(k);}catch(e){}return fb;}
function initSearch(){
 if($('#ccPlusDialog')) return;
 const launch=document.createElement('button');launch.id='ccPlusLaunch';launch.type='button';launch.textContent='⌕ بحث شامل';launch.setAttribute('aria-haspopup','dialog');launch.setAttribute('aria-controls','ccPlusDialog');launch.title='بحث في المحتوى والوثائق (Ctrl/⌘ + K)';
 const dlg=document.createElement('div');dlg.id='ccPlusDialog';dlg.hidden=true;dlg.innerHTML='<div class="cc-plus-box" role="dialog" aria-modal="true" aria-labelledby="ccPlusTitle"><div class="cc-plus-head"><h2 id="ccPlusTitle">البحث الشامل في CHRVVIM</h2><button id="ccPlusClose" type="button">إغلاق ✕</button></div><p class="cc-plus-hint">يبحث داخل النصوص والروابط الظاهرة في هذه النسخة، بما فيها أقسام المنصة والوثائق. لا يرسل كلمات البحث إلى أي خادم.</p><input id="ccPlusInput" type="search" autocomplete="off" placeholder="اكتب مادة، فوج، أستاذ، ملف PDF أو خدمة…" aria-label="البحث الشامل"><div id="ccPlusResults" aria-live="polite"><div class="cc-plus-empty">ابدأ بكتابة كلمة للبحث.</div></div><p class="cc-plus-hint">اختصار لوحة المفاتيح: <span class="cc-plus-kbd">Ctrl</span> + <span class="cc-plus-kbd">K</span> أو <span class="cc-plus-kbd">⌘</span> + <span class="cc-plus-kbd">K</span></p></div>';
 document.body.append(launch,dlg);
 const input=$('#ccPlusInput'),results=$('#ccPlusResults'),close=$('#ccPlusClose');let lastFocus=null;
 function empty(msg){const d=document.createElement('div');d.className='cc-plus-empty';d.textContent=msg;results.replaceChildren(d);}
 function localize(){
  launch.textContent=T('plus.launch','⌕ بحث شامل');
  launch.title=T('plus.launchTitle','بحث في المحتوى والوثائق (Ctrl/⌘ + K)');
  close.textContent=T('plus.close','إغلاق ✕');
  const h=$('#ccPlusTitle',dlg); if(h) h.textContent=T('plus.title','البحث الشامل في CHRVVIM');
  const hints=$$('.cc-plus-hint',dlg);
  if(hints[0]) hints[0].textContent=T('plus.hint','يبحث داخل النصوص والروابط الظاهرة في هذه النسخة، بما فيها أقسام المنصة والوثائق. لا يرسل كلمات البحث إلى أي خادم.');
  if(hints[1]) hints[1].innerHTML=T('plus.kbd','اختصار لوحة المفاتيح: <span class="cc-plus-kbd">Ctrl</span> + <span class="cc-plus-kbd">K</span> أو <span class="cc-plus-kbd">⌘</span> + <span class="cc-plus-kbd">K</span>');
  input.setAttribute('placeholder',T('plus.ph','اكتب مادة، فوج، أستاذ، ملف PDF أو خدمة…'));
  input.setAttribute('aria-label',T('plus.aria','البحث الشامل'));
  render();
 }
 function candidates(){
  const out=[], seen=new Set();
  // Prefer links so documents and official sources open directly.
  $$('a[href]').forEach(a=>{if(a.closest('#ccPlusDialog')||a.closest('#mirrorNav')===a) return; const title=(a.innerText||a.getAttribute('aria-label')||a.title||'').trim().replace(/\s+/g,' ');const href=a.getAttribute('href')||'';if(!title||title.length<2||href==='#'||href.startsWith('javascript:'))return;const key=title+'|'+href;if(seen.has(key))return;seen.add(key);const section=a.closest('.panel,section,article,.card');const context=section?((section.querySelector('h1,h2,h3,h4')||{}).innerText||section.id||T('plus.secCtx','قسم من المنصة')):T('plus.linksCtx','روابط ومصادر');out.push({title,href,context,hay:norm(title+' '+href+' '+context),el:a});});
  $$('h1,h2,h3,h4,[role="heading"],.tab').forEach(el=>{if(el.closest('#ccPlusDialog'))return;const title=(el.innerText||'').trim().replace(/\s+/g,' ');if(!title||title.length<2)return;const key=title+'|heading';if(seen.has(key))return;seen.add(key);const tab=el.closest('.panel');out.push({title,href:tab?'#'+tab.id:'#main',context:T('plus.headCtx','عنوان / قسم'),hay:norm(title+' '+(tab?.innerText||'')),el});});
  return out;
 }
 function render(){const q=norm(input.value);if(!q){empty(T('plus.empty','ابدأ بكتابة كلمة للبحث.'));return;}const terms=q.split(/\s+/).filter(Boolean);const found=candidates().map(x=>({...x,score:terms.reduce((s,t)=>s+(x.hay.includes(t)?1:0),0)})).filter(x=>x.score===terms.length).sort((a,b)=>b.score-a.score).slice(0,24);if(!found.length){empty(T('plus.none','ما لقيناش نتيجة مطابقة. جرّب كلمة أقصر أو افتح القسم المناسب من القائمة.'));return;}results.replaceChildren();found.forEach(item=>{const a=document.createElement('a');a.className='cc-plus-result';a.href=item.href;a.innerHTML='<strong></strong><small></small>';a.querySelector('strong').textContent=item.title;a.querySelector('small').textContent=item.context+' · '+item.href;if(item.href.startsWith('http')){a.target='_blank';a.rel='noopener noreferrer';}a.addEventListener('click',()=>{dlg.hidden=true;if(item.el&&item.el.classList.contains('tab'))item.el.click();else if(item.el&&item.el.closest('.panel')&&item.el.closest('.panel').id){const tab=$('.tab[data-p="'+item.el.closest('.panel').id.replace(/^p-/,'')+'"]');if(tab)tab.click();} });results.append(a);});}
 function open(){lastFocus=document.activeElement;dlg.hidden=false;input.value='';render();setTimeout(()=>input.focus(),0)}function shut(){dlg.hidden=true;if(lastFocus&&lastFocus.focus)lastFocus.focus();}
 launch.addEventListener('click',open);close.addEventListener('click',shut);input.addEventListener('input',render);dlg.addEventListener('click',e=>{if(e.target===dlg)shut()});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();dlg.hidden?open():shut()}else if(e.key==='Escape'&&!dlg.hidden)shut()});
 localize();
 document.addEventListener('cc:lang',localize);
}
function initSW(){if(!('serviceWorker'in navigator)||!/^https?:$/.test(location.protocol))return;window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=20261017t3').catch(()=>{}));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{initSearch();initSW()});else{initSearch();initSW()}
})();
