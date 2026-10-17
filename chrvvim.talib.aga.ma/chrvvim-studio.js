/* CHRVVIM CAMPUS — Focus Studio. Stores only checklist data locally on this device. */
(function(){
  'use strict';
  function T(k){ try{ return window.CHRVVIM_PAGE?window.CHRVVIM_PAGE.t(k):k; }catch(e){ return k; } }
  function locale(){ var l=(window.CHRVVIM_PAGE?window.CHRVVIM_PAGE.lang():'ar'); return l==='fr'?'fr-MA':(l==='en'?'en-GB':'ar-MA'); }
  var root=document.getElementById('focusStudio');
  if(!root)return;
  var tasks=root.querySelector('#focusTasks');
  var dateNode=root.querySelector('#focusDate');
  var countNode=root.querySelector('#focusProgressText');
  var track=root.querySelector('#focusProgressTrack');
  var fill=root.querySelector('#focusProgressFill');
  var message=root.querySelector('#focusEncouragement');
  var form=root.querySelector('#focusAddForm');
  var input=root.querySelector('#focusCustomTask');
  var storageKey='chrvvim-focus-v1';
  var todayKey=(function(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');})();
  var defaultTasks=[
    {id:'review',title:'راجع درساً واحداً',detail:'حتى 20 دقيقة كافية للبداية'},
    {id:'schedule',title:'تأكد من استعمال الزمن',detail:'راجع الحصص وأي تغيير معلن'},
    {id:'materials',title:'حضّر وثائق الغد',detail:'ملخص، دفتر أو ملف PDF'}
  ];
  var state={date:todayKey,checked:{},custom:[]};
  try{var saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&saved.date===todayKey){state.checked=saved.checked||{};state.custom=Array.isArray(saved.custom)?saved.custom.filter(function(t){return t&&typeof t.id==='string'&&typeof t.title==='string'}).slice(0,12):[];}}catch(e){}
  function setDate(){ try{dateNode.textContent=new Intl.DateTimeFormat(locale(),{weekday:'long',day:'numeric',month:'long'}).format(new Date());}catch(e){dateNode.textContent=todayKey;} }
  setDate();
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(e){message.textContent=T('focus.msgStorage');}}
  function renderCustom(){
    tasks.querySelectorAll('[data-custom-task]').forEach(function(n){n.remove();});
    state.custom.forEach(function(t){var label=document.createElement('label');label.className='focus-task';label.setAttribute('data-custom-task','');var box=document.createElement('input');box.type='checkbox';box.checked=!!state.checked[t.id];box.setAttribute('data-focus-task',t.id);var check=document.createElement('span');check.className='task-check';check.setAttribute('aria-hidden','true');check.textContent='✓';var copy=document.createElement('span');var title=document.createElement('b');title.textContent=t.title;var detail=document.createElement('small');detail.textContent=T('focus.customDetail');copy.append(title,detail);label.append(box,check,copy);tasks.appendChild(label);});
  }
  function update(){var boxes=Array.prototype.slice.call(tasks.querySelectorAll('input[data-focus-task]'));var done=boxes.filter(function(b){return b.checked}).length;var total=boxes.length;var percent=total?Math.round(done/total*100):0;countNode.textContent=done+' / '+total;fill.style.width=percent+'%';track.setAttribute('aria-valuenow',String(percent));if(done===total&&total){message.textContent=T('focus.msgDone');}else if(done>0){message.textContent=T('focus.msgPart').replace('{n}',total-done);}else{message.textContent=T('focus.msgStart');}persist();}
  tasks.addEventListener('change',function(e){var t=e.target;if(t&&t.matches('input[data-focus-task]')){state.checked[t.getAttribute('data-focus-task')]=t.checked;update();}});
  form.addEventListener('submit',function(e){e.preventDefault();var title=(input.value||'').trim();if(!title){input.focus();return;}if(state.custom.length>=12){message.textContent=T('focus.msgMax');return;}var id='custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);state.custom.push({id:id,title:title});input.value='';renderCustom();persist();update();input.focus();});
  root.querySelector('#focusReset').addEventListener('click',function(){state.checked={};state.custom=[];renderCustom();persist();update();input.value='';message.textContent=T('focus.msgReset');});
  renderCustom();
  tasks.querySelectorAll('input[data-focus-task]').forEach(function(box){box.checked=!!state.checked[box.getAttribute('data-focus-task')];});
  update();
  document.addEventListener('cc:lang',function(){ setDate(); renderCustom(); update(); });
})();
