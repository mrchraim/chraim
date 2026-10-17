const DAYS=["الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const SLOTS=["08:00–10:00","10:00–12:00","12:00–14:00","14:00–16:30","16:00–18:00"];
const GROUPS="ABCDEFGHIJKLMN".split("");
const SOCIAL_CONFIG={instagram:"",facebook:"",linkedin:"",youtube:"",tiktok:"",email:"",website:""};
let timetable={metadata:{},timetable:[],verification_issues:[]};
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function setPanel(name){document.querySelectorAll(".tab").forEach(b=>{const on=b.dataset.p===name;b.classList.toggle("on",on);b.setAttribute("aria-selected",String(on));});document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("on",p.id==="p-"+name));}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setPanel(b.dataset.p)));
$("themeBtn").addEventListener("click",()=>{document.documentElement.classList.toggle("dark");$("themeBtn").textContent=document.documentElement.classList.contains("dark")?"☀️ الوضع النهاري":"🌙 الوضع الليلي";});
function initGroups(){ $("ttGroup").innerHTML=GROUPS.map(g=>`<option value="${g}">الفوج ${g}</option>`).join(""); }
function norm(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim().toUpperCase();}
function renderSearch(){const q=norm($("q").value);if(!q){$("res").innerHTML='<p class="empty">اكتب الاسم العائلي أولاً.</p>';$("surnameGroupResults").innerHTML='<p class="empty">أدخل اللقب للبحث.</p>';return;}
$("res").innerHTML='<div class="note">هذه النتيجة تقديرية حسب حدود الألقاب المنشورة في الصور، وليست بديلاً عن اللائحة الرسمية.</div>';
const lists=academicGuide.surname_group_distributions||[];const found=[];for(const list of lists){for(const g of (list.groups||[])){const n=norm(q),a=norm(g.from),b=norm(g.to);if(n===a||n===b||(n.localeCompare(a,'en')>=0&&n.localeCompare(b,'en')<=0)){found.push({semester:list.semester,track:list.track,group:g.group,groups:g.groups,from:g.from,to:g.to});}}}
$("surnameGroupResults").innerHTML=found.length?`<table><thead><tr><th>السداسي</th><th>المسلك</th><th>الفوج</th><th>المجموعات</th><th>حدود اللقب</th></tr></thead><tbody>${found.map(x=>`<tr><td>${esc(x.semester)}</td><td>${esc(x.track)}</td><td>${esc(x.group)}</td><td>${esc(x.groups||'—')}</td><td dir="ltr">${esc(x.from)} — ${esc(x.to)}</td></tr>`).join('')}</tbody></table><p class="muted">قد تظهر أكثر من نتيجة لأن بعض التوزيعات مستقلة أو متشابهة. راجع الوثيقة الرسمية إذا كان لقبك قريباً من حدّين.</p>`:'<p class="empty">لم يُعثر على تطابق ضمن حدود الألقاب المحفوظة. جرّب كتابة اللقب كما يظهر في الوثيقة الفرنسية، مع الانتباه إلى المسافات والحروف الأخيرة.</p>'; }
$("go").addEventListener("click",renderSearch);$("q").addEventListener("keydown",e=>{if(e.key==="Enter")renderSearch();});
function slotOf(r){if(r.time)return r.time;return "غير محدد — العمود "+(r.column_as_transcribed??"؟");}
function renderTimetable(){const g=$("ttGroup").value;const records=timetable.timetable.filter(r=>r.group===g);if(!records.length){$("ttBody").innerHTML='<p class="empty">لا توجد حصص مسجلة لهذا الفوج في البيانات الحالية.</p>';return;}
const body=records.map(r=>`<tr><td>${esc(r.day)}</td><td>${esc(slotOf(r))}</td><td>${esc(r.subject)}</td><td>${esc(r.subgroups)}</td><td>${esc(r.room)}</td><td>${esc(r.professor)}</td></tr>`).join("");
$("ttBody").innerHTML=`<table><thead><tr><th>اليوم</th><th>الفترة</th><th>المادة</th><th>المجموعة</th><th>القاعة</th><th>الأستاذ</th></tr></thead><tbody>${body}</tbody></table><p class="muted">عدد الحصص المسجلة للفوج ${esc(g)}: ${records.length}. الفترات غير المحددة لم تُستنتج بالتخمين.</p>`;}
$("ttShow").addEventListener("click",renderTimetable);$("printBtn").addEventListener("click",()=>window.print());
function renderSubjectsRooms(){loadPublicDirectories();}
async function loadPublicDirectories(){
 try{
  const [coursesRes,profRes,roomsRes]=await Promise.all([fetch("/api/public/courses",{cache:"no-store"}),fetch("/api/public/professors",{cache:"no-store"}),fetch("/api/public/rooms",{cache:"no-store"})]);
  const courses=coursesRes.ok?(await coursesRes.json()).items||[]:[];
  const professors=profRes.ok?(await profRes.json()).items||[]:[];
  const rooms=roomsRes.ok?(await roomsRes.json()).items||[]:[];
  const scheduledSubjects=[...new Set(timetable.timetable.map(r=>r.subject).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
  let courseHtml='';
  if(courses.length)courseHtml=`<h3>المواد المنشورة</h3><table><thead><tr><th>السداسي</th><th>المسلك</th><th>المادة</th><th>الأساتذة</th></tr></thead><tbody>${courses.map(r=>`<tr><td>${esc(r.semester)}</td><td>${esc(r.track)}</td><td>${esc(r.name)}</td><td>${esc(r.professors||"—")}</td></tr>`).join("")}</tbody></table>`;
  else if(scheduledSubjects.length){courseHtml=`<h3>المواد الواردة في الجداول المنشورة</h3><table><thead><tr><th>المادة</th><th>عدد الحصص المنشورة</th><th>الأساتذة الواردة أسماؤهم</th></tr></thead><tbody>${scheduledSubjects.map(subject=>{const rs=timetable.timetable.filter(r=>r.subject===subject);return `<tr><td>${esc(subject)}</td><td>${rs.length}</td><td>${esc([...new Set(rs.map(r=>r.professor).filter(Boolean))].join("، ")||"—")}</td></tr>`;}).join("")}</tbody></table>`;}
  else courseHtml='<p class="empty">لا توجد مواد منشورة حالياً.</p>';
  const profHtml=professors.length?`<h3>دليل الأساتذة المنشور</h3><table><thead><tr><th>الأستاذ</th><th>البريد</th><th>المكتب</th></tr></thead><tbody>${professors.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.email||"—")}</td><td>${esc(r.office||"—")}</td></tr>`).join("")}</tbody></table>`:'';
  $("subjBody").innerHTML=courseHtml+profHtml;
  const scheduleRooms=[...new Set(timetable.timetable.map(r=>r.room).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar"));
  if(rooms.length)$("roomBody").innerHTML=`<table><thead><tr><th>القاعة</th><th>المبنى</th><th>السعة</th><th>ملاحظات</th></tr></thead><tbody>${rooms.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.building||"—")}</td><td>${esc(r.capacity||"—")}</td><td>${esc(r.notes||"—")}</td></tr>`).join("")}</tbody></table>`;
  else if(scheduleRooms.length)$("roomBody").innerHTML=`<table><thead><tr><th>القاعة/المكان</th><th>عدد الحصص المنشورة</th><th>المواد</th></tr></thead><tbody>${scheduleRooms.map(room=>{const rs=timetable.timetable.filter(r=>r.room===room);return `<tr><td>${esc(room)}</td><td>${rs.length}</td><td>${esc([...new Set(rs.map(r=>r.subject))].join("، "))}</td></tr>`;}).join("")}</tbody></table>`;
  else $("roomBody").innerHTML='<p class="empty">لا توجد قاعات منشورة حالياً.</p>';
 }catch(_e){$("subjBody").innerHTML='<p class="empty">تعذر تحميل المواد المنشورة.</p>';$("roomBody").innerHTML='<p class="empty">تعذر تحميل القاعات المنشورة.</p>';}
}
async function loadFounderProfile(){
 const host=$("founderSocialLinks"); if(!host)return;
 try{
  const r=await fetch("/public/founder-profile.json",{cache:"no-store"}); if(!r.ok)throw new Error("profile");
  const profile=await r.json(); const allowedHosts={Instagram:["instagram.com"],"Instagram · RIQQA":["instagram.com"],TikTok:["tiktok.com"],Facebook:["facebook.com"],WhatsApp:["wa.me"]};
  const links=(Array.isArray(profile.socials)?profile.socials:[]).filter(item=>{try{const u=new URL(item.url);return u.protocol==="https:"&&Object.values(allowedHosts).flat().some(h=>u.hostname===h||u.hostname.endsWith("."+h))&&allowedHosts[item.platform]?.some(h=>u.hostname===h||u.hostname.endsWith("."+h));}catch(_e){return false;}});
  host.innerHTML=links.length?links.map(item=>`<a class="chrvvim-social-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.platform)} ${esc(item.label)}"><span class="chrvvim-social-icon" aria-hidden="true">${esc(item.icon||"↗")}</span><span class="chrvvim-social-copy"><strong>${esc(item.platform)}</strong><span>${esc(item.label)}</span></span><span class="chrvvim-arrow" aria-hidden="true">↗</span></a>`).join(""):'<p class="founder-muted">لم تتم إضافة روابط تواصل عامة بعد.</p>';
 }catch(_e){host.innerHTML='<p class="founder-muted">تعذر تحميل إعدادات التواصل.</p>';}
}
function renderSocials(){const names={instagram:"Instagram",facebook:"Facebook",linkedin:"LinkedIn",youtube:"YouTube",tiktok:"TikTok",email:"البريد الإلكتروني",website:"الموقع الشخصي"};const links=Object.entries(SOCIAL_CONFIG).filter(([k,v])=>v&&String(v).trim());$("socialLinks").innerHTML=links.length?links.map(([k,v])=>{let url=String(v).trim();if(k==="email"&&!url.startsWith("mailto:"))url="mailto:"+url;return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(names[k])} ↗</a>`;}).join(""):'<span class="muted">روابط الحسابات غير مهيأة بعد.</span>';}
async function loadAnnouncements(){const card=$("announcementsCard"),body=$("announcementsBody");try{const r=await fetch("/api/public/announcements",{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);const d=await r.json();const items=Array.isArray(d.items)?d.items:[];card.hidden=!items.length;if(!items.length)return;body.innerHTML=items.map(a=>`<article class="announcement ${esc(a.kind)}"><strong>${esc(a.title)}</strong><div>${esc(a.body).replace(/\n/g,"<br>")}</div><time>آخر تحديث: ${esc(a.updated_at||"")}</time></article>`).join("");}catch(_e){card.hidden=true;}}
async function loadData(){try{let managed=false;try{const apiResponse=await fetch("/api/public/schedules?semester=S3",{cache:"no-store"});if(apiResponse.ok){const payload=await apiResponse.json();if(Array.isArray(payload.items)){timetable={metadata:{status:"managed_published_data",important_note:"بيانات منشورة من لوحة الإدارة."},timetable:payload.items.map(r=>({...r,group:r.group_name,verification_status:"published"})),verification_issues:[]};managed=true;}}}catch(_e){}
if(!managed)throw new Error("تعذر الاتصال بواجهة الجداول المنشورة.");}
catch(e){$("ttNote").textContent="تعذر تحميل بيانات الجدول. تأكد من تشغيل الموقع عبر خادم محلي/استضافة، وليس فتح الملف مباشرةً.";timetable={metadata:{},timetable:[],verification_issues:[]};}
if(timetable.metadata?.status==="transcription_draft_not_finally_verified"&&timetable.verification_issues?.length){$("ttNote").textContent=`نسخة أولية غير نهائية: توجد ${timetable.verification_issues.length} ملاحظات للمراجعة. لا تعتمد الفترات التي لم تُحدد.`;}else if(timetable.metadata?.status==="managed_published_data"){$("ttNote").textContent="تعرض هذه الصفحة الحصص التي نشرتها الإدارة من لوحة CHRVVIM. راجع آخر تحديث عند الحاجة.";}
renderTimetable();renderSubjectsRooms();}

let academicGuide={s5_tracks:[],s3_french_sections:{},verification_flags:[]};
let managedS1Schedules=[], managedS3Schedules=[], managedS5Schedules=[], managedS5Courses=[];
const dayOrder={"الإثنين":1,"الثلاثاء":2,"الأربعاء":3,"الخميس":4,"الجمعة":5,"السبت":6};

function renderS1(){
 const id=$("s1Track").value;const track=academicGuide.s1_tracks.find(t=>t.id===id);
 if(!track){$("s1Body").innerHTML='<p class="empty">لا توجد بيانات للشعبة المختارة.</p>';return;}
 const rows=managedS1Schedules.filter(r=>r.track===track.name).sort((a,b)=>(dayOrder[a.day]||9)-(dayOrder[b.day]||9)||String(a.time||"").localeCompare(String(b.time||"")));
 $("s1Body").innerHTML=`<h4>${esc(track.name)} <span class="muted">${esc(track.name_fr||"")}</span></h4>`+(rows.length?`<table><thead><tr><th>اليوم</th><th>التوقيت</th><th>المادة</th><th>الأستاذ</th><th>القاعة</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.day)}</td><td dir="ltr">${esc(r.time)}</td><td>${esc(r.subject)}</td><td>${esc(r.professor||"—")}</td><td>${esc(r.room||"—")}</td></tr>`).join("")}</tbody></table><p class="muted">عدد الحصص المنشورة: ${rows.length}.</p>`:'<p class="empty">لم تنشر الإدارة جدول هذه الشعبة بعد. البيانات المستوردة تبدأ كمسودات، وتظهر هنا بعد مراجعتها ونشرها من لوحة الإدارة.</p>');
}
function renderS3Details(){const rows=managedS3Schedules.slice().sort((a,b)=>(dayOrder[a.day]||9)-(dayOrder[b.day]||9)||String(a.time||"").localeCompare(String(b.time||"")));$("s3DetailsBody").innerHTML=rows.length?`<table><thead><tr><th>المسلك</th><th>اليوم</th><th>التوقيت</th><th>المادة</th><th>الأفواج</th><th>الأستاذ</th><th>القاعة</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.track)}</td><td>${esc(r.day)}</td><td dir="ltr">${esc(r.time||"غير محدد")}</td><td>${esc(r.subject)}</td><td>${esc(r.subgroups||r.group_name||"—")}</td><td>${esc(r.professor||"—")}</td><td>${esc(r.room||"—")}</td></tr>`).join("")}</tbody></table><p class="muted">عدد الحصص المنشورة: ${rows.length}.</p>`:'<p class="empty">لا توجد حصص للسداسي الثالث منشورة بعد. ستظهر بعد مراجعتها ونشرها من لوحة الإدارة.</p>';}
function renderS3Groups(){const ranges=academicGuide.s3_group_ranges||[];const note=academicGuide.s3_group_ranges_note||"";$("s3GroupsBody").innerHTML=ranges.length?`<table><thead><tr><th>الفوج</th><th>من اللقب</th><th>إلى اللقب</th></tr></thead><tbody>${ranges.map(r=>`<tr><td>${esc(r.group)}</td><td dir="ltr">${esc(r.from)}</td><td dir="ltr">${esc(r.to)}</td></tr>`).join("")}</tbody></table><p class="note">${esc(note)}</p><p class="muted">توزيع الأفواج حسب الملخص المقدم، ويجب مراجعته مع اللائحة الرسمية قبل الاعتماد.</p>`:'<p class="empty">لم تتوفر حدود الأفواج.</p>';}

function renderS5(){const id=$("s5Track").value;const track=academicGuide.s5_tracks.find(t=>t.id===id);if(!track){$("s5Body").innerHTML='<p class="empty">لا توجد بيانات متاحة.</p>';return;}
if(track.type==="schedule"){
 const rows=managedS5Schedules.filter(r=>r.track===track.name).sort((a,b)=>(dayOrder[a.day]||9)-(dayOrder[b.day]||9)||String(a.time||"").localeCompare(String(b.time||"")));
 if(!rows.length){$("s5Body").innerHTML=`<h3>${esc(track.name)} <span class="muted">${esc(track.name_fr||"")}</span></h3><p class="empty">لا يوجد استعمال زمن منشور لهذا المسار حالياً. ستظهر البيانات هنا بعد مراجعتها ونشرها من لوحة الإدارة.</p>`;return;}
 $("s5Body").innerHTML=`<h3>${esc(track.name)} <span class="muted">${esc(track.name_fr||"")}</span></h3><table><thead><tr><th>اليوم</th><th>التوقيت</th><th>المادة</th><th>الأستاذ</th><th>القاعة</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.day)}</td><td dir="ltr">${esc(r.time)}</td><td>${esc(r.subject)}</td><td>${esc(r.professor)}</td><td dir="auto">${esc(r.room)}</td></tr>`).join("")}</tbody></table><p class="muted">عدد الحصص المنشورة: ${rows.length}.</p>`;
}else{
 const rows=managedS5Courses.filter(r=>r.track===track.name);
 if(!rows.length){$("s5Body").innerHTML=`<h3>${esc(track.name)} <span class="muted">${esc(track.name_fr||"")}</span></h3><p class="empty">لا توجد مواد منشورة لهذا المسار حالياً. ستظهر المواد بعد مراجعتها ونشرها من لوحة الإدارة.</p>`;return;}
 $("s5Body").innerHTML=`<h3>${esc(track.name)} <span class="muted">${esc(track.name_fr||"")}</span></h3><table><thead><tr><th>المادة</th><th>الأستاذ/الأساتذة</th><th>ملاحظات</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.professors||"—")}</td><td>${esc(r.notes||"—")}</td></tr>`).join("")}</tbody></table><p class="muted">عدد المواد المنشورة: ${rows.length}.</p>`;
}}
function renderFrenchSections(){const d=academicGuide.s3_french_sections?.law_public_common_core;if(!d){$("s3FrenchBody").innerHTML='<p class="empty">لم تتوفر بيانات التوزيع.</p>';return;}
const table=(title,items)=>`<h4>${esc(title)}</h4><table><thead><tr><th>القسم</th><th>من</th><th>إلى</th></tr></thead><tbody>${items.map(x=>`<tr><td>${esc(x.name)}</td><td dir="ltr">${esc(x.from)}</td><td dir="ltr">${esc(x.to)}</td></tr>`).join("")}</tbody></table>`;
$("s3FrenchBody").innerHTML=`${table("توزيع الفرنسية",d.language_sections||[])}${table("توزيع الأقسام A–D",d.sections||[])}<p class="muted">${esc(d.sorting_note||"")}</p>`;
}
async function loadAcademicGuide(){try{const r=await fetch("public/academic-guide-public.json");if(!r.ok)throw new Error("HTTP "+r.status);academicGuide=await r.json();
const [s1Res,s3Res,scheduleRes,courseRes]=await Promise.all([fetch("/api/public/schedules?semester=S1",{cache:"no-store"}),fetch("/api/public/schedules?semester=S3",{cache:"no-store"}),fetch("/api/public/schedules?semester=S5",{cache:"no-store"}),fetch("/api/public/courses?semester=S5",{cache:"no-store"})]);
if(s1Res.ok){const d=await s1Res.json();managedS1Schedules=Array.isArray(d.items)?d.items:[];}else managedS1Schedules=[];
if(s3Res.ok){const d=await s3Res.json();managedS3Schedules=Array.isArray(d.items)?d.items:[];}else managedS3Schedules=[];
if(scheduleRes.ok){const d=await scheduleRes.json();managedS5Schedules=Array.isArray(d.items)?d.items:[];}else managedS5Schedules=[];
if(courseRes.ok){const d=await courseRes.json();managedS5Courses=Array.isArray(d.items)?d.items:[];}else managedS5Courses=[];
$("s1Track").innerHTML=(academicGuide.s1_tracks||[]).map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("");$("s5Track").innerHTML=academicGuide.s5_tracks.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("");renderS1();renderS3Groups();renderS3Details();renderS5();renderFrenchSections();$("s5Note").textContent="تُعرض مواد ومسارات السداسي الخامس فقط بعد نشرها من لوحة الإدارة. توزيع الفرنسية أدناه من بيانات أولية غير مؤكدة رسمياً.";
}catch(e){$("s5Note").textContent="تعذر تحميل دليل المسالك. شغّل الموقع عبر خادم محلي أو الاستضافة.";$("s5Body").innerHTML='<p class="empty">تعذر تحميل البيانات.</p>';}}
$("s1Show").addEventListener("click",renderS1);$("s1Track").addEventListener("change",renderS1);$("s5Show").addEventListener("click",renderS5);$("s5Track").addEventListener("change",renderS5);


let academicDocuments=[];
function renderDocuments(){
 const semester=$("docSemester")?.value||"",track=$("docTrack")?.value||"";
 const docs=academicDocuments.filter(d=>(!semester||d.semester===semester)&&(!track||d.track===track));
 const target=$("documentsList");if(!target)return;
 target.innerHTML=docs.length?docs.map(d=>`<article class="document-card"><div class="document-meta">${esc(d.semester)} · ${esc(d.track)} · ${esc(d.type||"PDF")}</div><h3>${esc(d.title)}</h3><p class="muted">${esc(d.description||"وثيقة أكاديمية")}</p><a class="document-open" href="${esc(d.file)}" target="_blank" rel="noopener noreferrer" aria-label="فتح ${esc(d.title)} بصيغة PDF">↗ فتح الوثيقة PDF</a></article>`).join(""):'<p class="empty">لا توجد وثائق مطابقة لهذه التصفية.</p>';
}
async function loadDocuments(){
 try{const r=await fetch("public/academic-documents.json",{cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);const data=await r.json();academicDocuments=Array.isArray(data.documents)?data.documents:[];renderDocuments();}
 catch(_e){$("documentsList").innerHTML='<p class="empty">تعذر تحميل قائمة الوثائق. تأكد من رفع مجلد public كاملاً.</p>';}
}
$("docSemester")?.addEventListener("change",renderDocuments);
$("docTrack")?.addEventListener("change",renderDocuments);

initGroups();loadData();loadAcademicGuide();loadAnnouncements();loadFounderProfile();loadDocuments();
