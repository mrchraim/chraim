#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""_apply_page_i18n_js.py — make the inline scripts + focus studio + app.js
language-aware, wired to window.CHRVVIM_PAGE.

Verified exact/regex replacements; aborts if a pattern does not match.
"""
import io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

def read(p):
    with open(p, "rb") as f:
        raw = f.read()
    return raw.decode("utf-8-sig"), raw.startswith(b"\xef\xbb\xbf")

def write(p, text, bom):
    with open(p, "wb") as f:
        f.write((b"\xef\xbb\xbf" if bom else b"") + text.encode("utf-8"))

FAIL = []

# ============================================================ index.html: scripts
IDX = os.path.join(ROOT, "index.html")
html, bom = read(IDX)

# ---- 1. WhatsApp filter script -------------------------------------------
old_filter = """<script>
(function(){
  var root=document.getElementById('student-wa-groups'); if(!root)return;
  var search=root.querySelector('#waGroupSearch'), filter=root.querySelector('#waSemesterFilter'), count=root.querySelector('#waGroupCount'), empty=root.querySelector('#waNoResults');
  function apply(){
    var q=(search.value||'').trim().toLocaleLowerCase(), sem=filter.value, shown=0;
    root.querySelectorAll('.wa-group').forEach(function(card){var okSem=sem==='all'||card.getAttribute('data-sem')===sem;var hay=(card.textContent+' '+card.getAttribute('data-search')).toLocaleLowerCase();var okText=!q||hay.indexOf(q)!==-1;card.hidden=!(okSem&&okText);if(!card.hidden)shown++;});
    root.querySelectorAll('.wa-sem-block').forEach(function(block){var blockSem=block.getAttribute('data-sem-block');var visible=Array.from(block.querySelectorAll('.wa-group')).some(function(c){return !c.hidden;});block.hidden=!(visible&&(sem==='all'||sem===blockSem));});
    root.querySelectorAll('.wa-specialty').forEach(function(block){block.hidden=!(sem==='all'||sem==='S5')||!Array.from(block.querySelectorAll('.wa-group')).some(function(c){return !c.hidden;});});
    count.textContent='عدد المجموعات الظاهرة: '+shown; empty.style.display=shown?'none':'block';
  }
  search.addEventListener('input',apply);filter.addEventListener('change',apply);apply();
})();
</script>"""
new_filter = """<script>
(function(){
  var root=document.getElementById('student-wa-groups'); if(!root)return;
  var search=root.querySelector('#waGroupSearch'), filter=root.querySelector('#waSemesterFilter'), count=root.querySelector('#waGroupCount'), empty=root.querySelector('#waNoResults');
  function T(k){ try{ return window.CHRVVIM_PAGE?window.CHRVVIM_PAGE.t(k):k; }catch(e){ return k; } }
  function apply(){
    var q=(search.value||'').trim().toLocaleLowerCase(), sem=filter.value, shown=0;
    root.querySelectorAll('.wa-group').forEach(function(card){var okSem=sem==='all'||card.getAttribute('data-sem')===sem;var hay=(card.textContent+' '+card.getAttribute('data-search')).toLocaleLowerCase();var okText=!q||hay.indexOf(q)!==-1;card.hidden=!(okSem&&okText);if(!card.hidden)shown++;});
    root.querySelectorAll('.wa-sem-block').forEach(function(block){var blockSem=block.getAttribute('data-sem-block');var visible=Array.from(block.querySelectorAll('.wa-group')).some(function(c){return !c.hidden;});block.hidden=!(visible&&(sem==='all'||sem===blockSem));});
    root.querySelectorAll('.wa-specialty').forEach(function(block){block.hidden=!(sem==='all'||sem==='S5')||!Array.from(block.querySelectorAll('.wa-group')).some(function(c){return !c.hidden;});});
    count.textContent=T('wa.count').replace('{n}',shown); empty.style.display=shown?'none':'block';
  }
  search.addEventListener('input',apply);filter.addEventListener('change',apply);
  document.addEventListener('cc:lang',apply);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
})();
</script>"""
if html.count(old_filter) != 1:
    FAIL.append("wa-filter: %d" % html.count(old_filter))
else:
    html = html.replace(old_filter, new_filter)

# ---- 2. WhatsApp collapse script -----------------------------------------
old_collapse = """<script>
/* ===== Homepage organisation pass: collapsible WhatsApp semester blocks =====
   The WhatsApp section listed ~38 groups in one 2900px wall. Each semester
   block is now a toggle; the first stays open, the rest start collapsed.
   Running a search or a semester filter auto-expands whatever has matches. */
(function(){
  var root=document.getElementById('student-wa-groups'); if(!root) return;
  var blocks=[].slice.call(root.querySelectorAll('.wa-sem-block'));
  var setters=[];
  blocks.forEach(function(block,i){
    var head=block.querySelector('.wa-sem-heading'); if(!head) return;
    var count=block.querySelectorAll('.wa-group').length;
    var btn=document.createElement('button');
    btn.type='button'; btn.className='wa-toggle';
    var tx=document.createElement('span'); tx.className='wa-toggle-tx';
    var cn=document.createElement('span'); cn.className='wa-toggle-count';
    cn.textContent=count+' مجموع'+(count===1?'ة':'ات');
    btn.appendChild(tx); btn.appendChild(cn);
    var set=function(open){
      if(open){ block.removeAttribute('data-collapsed'); btn.setAttribute('aria-expanded','true'); tx.textContent='إخفاء'; }
      else{ block.setAttribute('data-collapsed','1'); btn.setAttribute('aria-expanded','false'); tx.textContent='عرض'; }
    };
    btn.addEventListener('click',function(){ set(block.hasAttribute('data-collapsed')); });
    set(i===0);
    head.appendChild(btn);
    setters.push(set);
  });
  var search=root.querySelector('#waGroupSearch'), filter=root.querySelector('#waSemesterFilter');
  var expandAll=function(){ setters.forEach(function(s){ s(true); }); };
  var active=function(){ return (search&&search.value.trim().length>0)||(filter&&filter.value!=='all'); };
  if(search)['input','keyup','search'].forEach(function(ev){ search.addEventListener(ev,function(){ if(active()) expandAll(); }); });
  if(filter) filter.addEventListener('change',function(){ if(active()) expandAll(); });
})();
</script>"""
new_collapse = """<script>
/* ===== Homepage organisation pass: collapsible WhatsApp semester blocks =====
   The WhatsApp section listed ~38 groups in one 2900px wall. Each semester
   block is now a toggle; the first stays open, the rest start collapsed.
   Running a search or a semester filter auto-expands whatever has matches.
   Labels follow the UI language (window.CHRVVIM_PAGE). */
(function(){
  var root=document.getElementById('student-wa-groups'); if(!root) return;
  function T(k){ try{ return window.CHRVVIM_PAGE?window.CHRVVIM_PAGE.t(k):k; }catch(e){ return k; } }
  var blocks=[].slice.call(root.querySelectorAll('.wa-sem-block'));
  var setters=[], refreshers=[];
  blocks.forEach(function(block,i){
    var head=block.querySelector('.wa-sem-heading'); if(!head) return;
    var count=block.querySelectorAll('.wa-group').length;
    var btn=document.createElement('button');
    btn.type='button'; btn.className='wa-toggle';
    var tx=document.createElement('span'); tx.className='wa-toggle-tx';
    var cn=document.createElement('span'); cn.className='wa-toggle-count';
    var refresh=function(){
      cn.textContent=(count===1?T('wa.groupsOne'):T('wa.groupsMany')).replace('{n}',count);
      var open=!block.hasAttribute('data-collapsed');
      tx.textContent=open?T('wa.toggleHide'):T('wa.toggleShow');
      btn.setAttribute('aria-expanded',open?'true':'false');
    };
    var set=function(open){
      if(open){ block.removeAttribute('data-collapsed'); }
      else{ block.setAttribute('data-collapsed','1'); }
      refresh();
    };
    btn.appendChild(tx); btn.appendChild(cn);
    btn.addEventListener('click',function(){ set(block.hasAttribute('data-collapsed')); });
    set(i===0);
    head.appendChild(btn);
    setters.push(set); refreshers.push(refresh);
  });
  var search=root.querySelector('#waGroupSearch'), filter=root.querySelector('#waSemesterFilter');
  var expandAll=function(){ setters.forEach(function(s){ s(true); }); };
  var active=function(){ return (search&&search.value.trim().length>0)||(filter&&filter.value!=='all'); };
  if(search)['input','keyup','search'].forEach(function(ev){ search.addEventListener(ev,function(){ if(active()) expandAll(); }); });
  if(filter) filter.addEventListener('change',function(){ if(active()) expandAll(); });
  document.addEventListener('cc:lang',function(){ refreshers.forEach(function(r){ r(); }); });
})();
</script>"""
if html.count(old_collapse) != 1:
    FAIL.append("wa-collapse: %d" % html.count(old_collapse))
else:
    html = html.replace(old_collapse, new_collapse)

# ---- 3. Tools script (regex, block is long) ------------------------------
tools_re = re.compile(r"<script>\n/\* ===== Merged tools from \u0631\u0641\u064a\u0642 \u0627\u0644\u0637\u0627\u0644\u0628.*?</script>", re.S)
new_tools = """<script>
/* ===== Merged tools from رفيق الطالب — جدولي الشخصي + المواعيد =====
   Self-contained; data is stored only in this browser (localStorage).
   Wording follows the UI language (window.CHRVVIM_PAGE). */
(function(){
  'use strict';
  function T(k){ try{ return window.CHRVVIM_PAGE?window.CHRVVIM_PAGE.t(k):k; }catch(e){ return k; } }
  function load(key){try{var v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
  function save(key,arr){try{localStorage.setItem(key,JSON.stringify(arr))}catch(e){}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  /* ---- جدولي الشخصي ---- */
  var TT_KEY='chrvvim-mytt-v1';
  var DAYS=['mon','tue','wed','thu','fri','sat'];
  var AR_DAY={'الاثنين':'mon','الثلاثاء':'tue','الأربعاء':'wed','الخميس':'thu','الجمعة':'fri','السبت':'sat'};
  function dayKey(v){return DAYS.indexOf(v)>=0?v:(AR_DAY[v]||v);}
  function kindTxt(v){var s=T('mytt.kind.'+v);return s===('mytt.kind.'+v)?v:s;}
  var ttForm=document.getElementById('myttForm');
  var ttRender=null;
  if(ttForm){
    var ttView=document.getElementById('myttView');
    var ttItems=load(TT_KEY);
    ttRender=function(){
      if(!ttItems.length){ttView.innerHTML='<p class="tool-empty">'+esc(T('mytt.empty'))+'</p>';return;}
      var h='';
      DAYS.forEach(function(day){
        var rows=ttItems.filter(function(x){return dayKey(x.day)===day}).sort(function(a,b){return (a.from||'').localeCompare(b.from||'')});
        if(!rows.length)return;
        h+='<div class="tool-day"><h4>'+esc(T('day.'+day))+'</h4><ul class="tool-list">';
        rows.forEach(function(x){
          h+='<li class="tool-item"><span class="ti-tag">'+esc(x.from||'')+'–'+esc(x.to||'')+'</span><span class="ti-main"><b>'+esc(x.subj||'—')+'</b><small>'+esc([x.kind?kindTxt(x.kind):'',x.room].filter(Boolean).join(' · '))+'</small></span><button class="ti-del" type="button" data-id="'+esc(x.id)+'" aria-label="'+esc(T('mytt.del'))+'">✕</button></li>';
        });
        h+='</ul></div>';
      });
      ttView.innerHTML=h;
    };
    ttForm.addEventListener('submit',function(e){
      e.preventDefault();
      var subj=document.getElementById('myttSubj').value.trim();
      if(!subj){document.getElementById('myttSubj').focus();return;}
      ttItems.push({id:String(Date.now())+Math.random().toString(16).slice(2,6),day:document.getElementById('myttDay').value,from:document.getElementById('myttFrom').value,to:document.getElementById('myttTo').value,subj:subj,kind:document.getElementById('myttKind').value,room:document.getElementById('myttRoom').value.trim()});
      save(TT_KEY,ttItems);
      document.getElementById('myttSubj').value='';document.getElementById('myttRoom').value='';
      ttRender();
    });
    ttView.addEventListener('click',function(e){var b=e.target.closest('.ti-del');if(!b)return;ttItems=ttItems.filter(function(x){return x.id!==b.getAttribute('data-id')});save(TT_KEY,ttItems);ttRender();});
    document.getElementById('myttClear').addEventListener('click',function(){if(confirm(T('mytt.confirm'))){ttItems=[];save(TT_KEY,ttItems);ttRender();}});
    document.getElementById('myttPrint').addEventListener('click',function(){window.print();});
    document.getElementById('myttExport').addEventListener('click',function(){
      try{var blob=new Blob([JSON.stringify(ttItems,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='chrvvim-jadwali.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},1000);}catch(err){}
    });
  }

  /* ---- المواعيد والامتحانات ---- */
  var DL_KEY='chrvvim-deadlines-v1';
  var AR_KIND={'امتحان':'exam','تسليم واجب':'assign','مناقشة':'discuss','أخرى':'other'};
  function dlKindTxt(v){var k=AR_KIND[v]||v;var s=T('dl.kind.'+k);return s===('dl.kind.'+k)?v:s;}
  var dlForm=document.getElementById('dlForm');
  var dlRender=null;
  if(dlForm){
    var dlView=document.getElementById('dlView');
    var dlItems=load(DL_KEY);
    var daysLeft=function(d){var t=new Date();t.setHours(0,0,0,0);var x=new Date(d+'T00:00:00');return Math.round((x-t)/86400000)};
    dlRender=function(){
      if(!dlItems.length){dlView.innerHTML='<p class="tool-empty">'+esc(T('dl.empty'))+'</p>';return;}
      var sorted=dlItems.slice().sort(function(a,b){return (a.date||'').localeCompare(b.date||'')});
      var h='<ul class="tool-list">';
      sorted.forEach(function(x){
        var n=x.date?daysLeft(x.date):null, tag='', cls='';
        if(n!==null){ if(n<0){tag=T('dl.past');cls=' dl-past';} else if(n===0){tag=T('dl.today');cls=' tool-today';} else if(n===1){tag=T('dl.tomorrow');} else {tag=T('dl.inDays').replace('{n}',n);} }
        h+='<li class="tool-item'+cls+'"><span class="ti-tag'+((n!==null&&n>=0&&n<=2)?' dl-soon':'')+'">'+esc(tag)+'</span><span class="ti-main"><b>'+esc(x.title)+'</b><small>'+esc((x.kind?dlKindTxt(x.kind)+' · ':'')+(x.date||''))+'</small></span><button class="ti-del" type="button" data-id="'+esc(x.id)+'" aria-label="'+esc(T('dl.del'))+'">✕</button></li>';
      });
      h+='</ul>';
      dlView.innerHTML=h;
    };
    dlForm.addEventListener('submit',function(e){
      e.preventDefault();
      var title=document.getElementById('dlTitle').value.trim(), date=document.getElementById('dlDate').value;
      if(!title){document.getElementById('dlTitle').focus();return;}
      if(!date){document.getElementById('dlDate').focus();return;}
      dlItems.push({id:String(Date.now())+Math.random().toString(16).slice(2,6),title:title,kind:document.getElementById('dlKind').value,date:date});
      save(DL_KEY,dlItems);
      document.getElementById('dlTitle').value='';document.getElementById('dlDate').value='';
      dlRender();
    });
    dlView.addEventListener('click',function(e){var b=e.target.closest('.ti-del');if(!b)return;dlItems=dlItems.filter(function(x){return x.id!==b.getAttribute('data-id')});save(DL_KEY,dlItems);dlRender();});
    document.getElementById('dlClear').addEventListener('click',function(){if(confirm(T('dl.confirm'))){dlItems=[];save(DL_KEY,dlItems);dlRender();}});
  }

  function render(){ if(ttRender)ttRender(); if(dlRender)dlRender(); }
  document.addEventListener('cc:lang',render);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',render); else render();
})();
</script>"""
tri = tools_re.findall(html)
if len(tri) != 1:
    FAIL.append("tools-block: %d" % len(tri))
else:
    html = tools_re.sub(lambda m: new_tools, html, count=1)

if FAIL:
    print("index.html ABORTED:", FAIL)
else:
    write(IDX, html, bom)
    print("index.html scripts updated")

# ============================================================ chrvvim-studio.js
ST = os.path.join(ROOT, "chrvvim-studio.js")
js, jbom = read(ST)
S = [
 ("helper",
  "  'use strict';\n  var root=document.getElementById('focusStudio');",
  "  'use strict';\n  function T(k){ try{ return window.CHRVVIM_PAGE?window.CHRVVIM_PAGE.t(k):k; }catch(e){ return k; } }\n  function locale(){ var l=(window.CHRVVIM_PAGE?window.CHRVVIM_PAGE.lang():'ar'); return l==='fr'?'fr-MA':(l==='en'?'en-GB':'ar-MA'); }\n  var root=document.getElementById('focusStudio');"),
 ("date",
  "  try{dateNode.textContent=new Intl.DateTimeFormat('ar-MA',{weekday:'long',day:'numeric',month:'long'}).format(new Date());}catch(e){dateNode.textContent=todayKey;}",
  "  function setDate(){ try{dateNode.textContent=new Intl.DateTimeFormat(locale(),{weekday:'long',day:'numeric',month:'long'}).format(new Date());}catch(e){dateNode.textContent=todayKey;} }\n  setDate();"),
 ("persist",
  "catch(e){message.textContent='التخزين المحلي غير متاح في هذا المتصفح؛ ستبقى المهام حتى إغلاق الصفحة.';}}",
  "catch(e){message.textContent=T('focus.msgStorage');}}"),
 ("customDetail",
  "var detail=document.createElement('small');detail.textContent='مهمة شخصية';",
  "var detail=document.createElement('small');detail.textContent=T('focus.customDetail');"),
 ("update-msgs",
  "if(done===total&&total){message.textContent='برافو! كملتي مهام اليوم. خذ استراحة تستاهلها ✨';}else if(done>0){message.textContent='مزيان! باقي '+(total-done)+' مهمة، كمل بالوتيرة ديالك.';}else{message.textContent='اختار مهمة وابدأ على مهلك.';}",
  "if(done===total&&total){message.textContent=T('focus.msgDone');}else if(done>0){message.textContent=T('focus.msgPart').replace('{n}',total-done);}else{message.textContent=T('focus.msgStart');}"),
 ("max",
  "if(state.custom.length>=12){message.textContent='وصلتي للحد الأقصى: 12 مهمة شخصية لليوم.';return;}",
  "if(state.custom.length>=12){message.textContent=T('focus.msgMax');return;}"),
 ("reset",
  "message.textContent='تصفّرت المهام. اختار أول خطوة جديدة.';});",
  "message.textContent=T('focus.msgReset');});"),
 ("lang-listener",
  "  update();\n})();",
  "  update();\n  document.addEventListener('cc:lang',function(){ setDate(); renderCustom(); update(); });\n})();"),
]
sfail = []
for lbl, o, n in S:
    if js.count(o) != 1:
        sfail.append("%s=%d" % (lbl, js.count(o)))
        continue
    js = js.replace(o, n)
if sfail:
    print("chrvvim-studio.js ABORTED:", sfail)
else:
    write(ST, js, jbom)
    print("chrvvim-studio.js updated")

# ============================================================ app.js hook
AP = os.path.join(ROOT, "app.js")
ap, abom = read(AP)
old_ap = "  applyChrome();\n  try{ fillTracks();"
new_ap = "  applyChrome();\n  try{ if(window.CHRVVIM_PAGE) window.CHRVVIM_PAGE.apply(l); }catch(e){}\n  try{ fillTracks();"
if ap.count(old_ap) != 1:
    print("app.js ABORTED: %d" % ap.count(old_ap))
else:
    write(AP, ap.replace(old_ap, new_ap), abom)
    print("app.js hook added")
