
/* ===================== الإعدادات ===================== */

/* ===================== تقليل الحركة (إمكانية الوصول) ===================== */
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduceMotion){
  const style=document.createElement('style');
  style.textContent='*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}';
  document.head.appendChild(style);
}

const CONFIG=window.CHRVVIM.CONFIG;

/* ===================== البيانات ===================== */
const DATA=window.CHRVVIM.DATA;

/* ===================== أدوات ===================== */
const $=id=>document.getElementById(id);
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mem={};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return mem[k]||null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){mem[k]=v}}};
const DAYS=['الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const DAY_I18N={'الإثنين':{ar:'الإثنين',fr:'Lundi',en:'Monday','zgh':'ⴰⵢⵏⴰⵙ','zgh-latn':'aynas'},'الثلاثاء':{ar:'الثلاثاء',fr:'Mardi',en:'Tuesday','zgh':'ⴰⵙⵉⵏⴰⵙ','zgh-latn':'asinas'},'الأربعاء':{ar:'الأربعاء',fr:'Mercredi',en:'Wednesday','zgh':'ⴰⴽⵔⴰⵙ','zgh-latn':'akras'},'الخميس':{ar:'الخميس',fr:'Jeudi',en:'Thursday','zgh':'ⴰⴽⵡⴰⵙ','zgh-latn':'akwas'},'الجمعة':{ar:'الجمعة',fr:'Vendredi',en:'Friday','zgh':'ⴰⵙⵉⵎⵡⴰⵙ','zgh-latn':'asimwas'},'السبت':{ar:'السبت',fr:'Samedi',en:'Saturday','zgh':'ⴰⵙⵉⴹⵢⴰⵙ','zgh-latn':'asiḍyas'}};
const dayName=d=>{const e=DAY_I18N[d];return e?(e[UILANG]||e.ar):d};
const SEC={private:'قانون خاص',public:'قانون عام'};
const SECFR={private:'Droit privé',public:'Droit public'};
const uniq=a=>[...new Set(a)];
const startOf=t=>t.split('–')[0];
function trackTitle(t){
  if(t.lang==='ar') return t.sem==='S5'?SEC[t.sec]+' · '+t.label:t.label;
  return t.sem==='S5'?SECFR[t.sec]+' · '+t.label:t.label;
}
function byId(id){return DATA.tracks.find(t=>t.id===id)}
const state={track:null};
function currentTrack(){return byId($('track').value)||null}
const uniState={q:'',etab:'',dipl:'',city:''};
let _uniDeepDone=false;

/* ===================== لغة الواجهة (ar / fr / en) ===================== */
const UI_LANGS=['ar','fr','en','zgh','zgh-latn'];
let UILANG=(store.get('cc_uilang')||'ar');
if(!UI_LANGS.includes(UILANG)) UILANG='ar';
const dirFor=l=>(l==='ar'?'rtl':'ltr');
const STR={
  'brand.sub':{ar:'غرفة · حرم جامعي',fr:'CHAMBRE · CAMPUS',en:'CHAMBER · CAMPUS','zgh':'CHAMBRE · CAMPUS','zgh-latn':'CHAMBRE · CAMPUS'},
  'nav.skip':{ar:'تجاوز إلى المحتوى',fr:'Aller au contenu principal',en:'Skip to main content','zgh':'ⴷⵓ ⵖⴻⵔ ⵓⴳⴱⵓⵔ','zgh-latn':'Ddu ɣer ugbur'},
  'tool.install':{ar:'تثبيت التطبيق',fr:"Installer l'application",en:'Install app','zgh':'ⵙⴻⴱⴷⴻⴷ ⴰⵙⵏⴰⵙ','zgh-latn':'Sebded asnas'},
  'hero.motto':{ar:'⚖️ قانون · كلية الحقوق · أكادير ⚖️',fr:'⚖️ LEX · FACULTÉ DE DROIT · AGADIR ⚖️',en:'⚖️ LEX · FACULTY OF LAW · AGADIR ⚖️','zgh':'⚖️ LEX · ⵜⴰⵙⴳⴰ ⵏ ⵓⵣⵔⴻⴼ · ⴰⴳⴰⴹⵉⵔ ⚖️','zgh-latn':'⚖️ LEX · Tasga n uzref · Agaḍir ⚖️'},
  'hero.h1a':{ar:'دليل الطلبة',fr:'Guide des étudiants',en:'Students Guide','zgh':'ⴰⵎⴰⵏⴰⵔ ⵏ ⵓⵏⴻⵍⵎⴰⴷ','zgh-latn':'Amanar n unelmad'},
  'hero.h1b':{ar:'أكادير',fr:'Agadir',en:'Agadir','zgh':'ⴰⴳⴰⴹⵉⵔ','zgh-latn':'Agaḍir'},
  'hero.p':{ar:'دليل الطالب بكلية العلوم القانونية والسياسية — الموسم الجامعي 2026-2027. اكتب لقبك العائلي، لقا فوجك واستعمال الزمن ديالك فثواني.',fr:'Guide de l\'étudiant à la Faculté des sciences juridiques et politiques — année universitaire 2026-2027. Saisissez votre nom, trouvez votre groupe et votre emploi du temps en quelques secondes.',en:'Student guide for the Faculty of Law and Political Science — academic year 2026-2027. Type your surname to find your group and timetable in seconds.','zgh':'ⴰⵎⴰⵏⴰⵔ ⵏ ⵓⵏⴻⵍⵎⴰⴷ ⵏ ⵜⵙⴳⴰ ⵏ ⵓⵣⵔⴻⴼ ⴷ ⵜⵙⵔⵜⴰⵏⵜ ⵏ ⴰⴳⴰⴹⵉⵔ — ⴰⵙⴻⴳⴰⵙ ⵏ ⵜⵖⵓⵔⵉ 2026-2027. ⴰⵔⵓ ⵉⵙⵎ ⵏ ⵜⵡⴰⴽⵓⵍⵜ-ⵉⵏⴻⴽ, ⵜⴰⴼⴻⴹ ⵜⴰⴳⵔⴰⵡⵜ-ⵉⵏⴻⴽ ⴷ ⵓⵖⴰⵡⴰⵙ ⵏ ⵡⴰⴽⵓⴷ-ⵉⵏⴻⴽ ⵙ ⵜⵉⴼⵙⵉⵏ.','zgh-latn':'Amanar n unelmad n tsga n uzref d tsrtant n Agaḍir — aseggas n tɣuri 2026-2027. Aru ism n twacult-inek, tafeḍ tagrawt-inek d uɣawas n wakud-inek s tifsin.'},
  'hero.chip':{ar:'موقع مستقل غير رسمي · المصدر الرسمي هو موقع الكلية',fr:'Site indépendant non officiel · La source officielle est le site de la faculté',en:'Independent, unofficial site · The official source is the faculty website','zgh':'ⴰⵙⵎⴻⵍ ⴰⵙⵓⴼ, ⵡⴰⵔ ⵓⵏⵚⵉⴱ · ⴰⵖⴱⴰⵍⵓ ⴰⵎⴰⴷⵓⴷ ⴷ ⴰⵙⵎⴻⵍ ⵏ ⵜⵙⴳⴰ','zgh-latn':'Asmel asuf, war unṣib · Aɣbalu amaddud d asmel n tsga'},
  'hero.founder':{ar:'من تطوير <b>محمد شرايم</b> · مؤسس CHRVVIM',fr:'Développé par <b>Mohamed Chraim</b> · fondateur de CHRVVIM',en:'Built by <b>Mohamed Chraim</b> · founder of CHRVVIM','zgh':'ⵢⴻⴱⵏⴰ-ⵜ <b>Mohamed Chraim</b> · ⴰⵎⵙⵏⵓⵍⴼⵓ ⵏ CHRVVIM','zgh-latn':'Yebna-t <b>Mohamed Chraim</b> · amsnulfu n CHRVVIM'},
  'stat.tracks':{ar:'مسلك ومسار',fr:'filières & parcours',en:'tracks & paths','zgh':'ⵜⵉⴼⵉⵍⵉⵢⵉⵢⵏ ⴷ ⵢⵉⴱⵔⴷⴰⵏ','zgh-latn':'Tifiliyiyn d yibrdan'},
  'stat.sessions':{ar:'حصة',fr:'séances',en:'sessions','zgh':'ⵜⵉⵖⵔⵉⵡⵉⵏ','zgh-latn':'Tiɣriwin'},
  'stat.profs':{ar:'أستاذ',fr:'professeurs',en:'professors','zgh':'ⵉⵙⴻⵍⵎⴰⴷⴻⵏ','zgh-latn':'Iselmaden'},
  'cfg.lang':{ar:'لغة الدراسة',fr:'Langue d\'étude',en:'Study language','zgh':'ⵜⵓⵜⵍⴰⵢⵜ ⵏ ⵜⵖⵓⵔⵉ','zgh-latn':'Tutlayt n tɣuri'},
  'cfg.sem':{ar:'السداسي',fr:'Semestre',en:'Semester','zgh':'ⴰⵙⴻⵎⵙⵜⴻⵔ','zgh-latn':'Asemster'},
  'cfg.track':{ar:'المسلك / المسار',fr:'Filière / Parcours',en:'Track / Path','zgh':'ⴰⴱⵔⵉⴷ','zgh-latn':'Abrid'},
  'lang.ar':{ar:'العربية',fr:'Arabe',en:'Arabic','zgh':'ⵜⴰⵄⵔⴰⴱⵜ','zgh-latn':'Taʕrabt'},
  'lang.fr':{ar:'Français',fr:'Français',en:'French','zgh':'ⵜⴰⴼⵔⴰⵏⵙⵉⵙⵜ','zgh-latn':'Tafransist'},
  'tab.smart':{ar:'المساعد الذكي',fr:'Assistant intelligent',en:'Smart Assistant','zgh':'ⴰⵎⴰⵡⴰⵙ ⴰⵎⵓⵙⵏⴰⵏ','zgh-latn':'Amawas amussnan'},
  'tab.search':{ar:'البحث عن فوجي',fr:'Chercher mon groupe',en:'Find my group','zgh':'ⴰⴼ ⵜⴰⴳⵔⴰⵡⵜ-ⵉⵏⵓ','zgh-latn':'Af tagrawt-inu'},
  'tab.tt':{ar:'استعمال الزمن',fr:'Emploi du temps',en:'Timetable','zgh':'ⴰⵖⴰⵡⴰⵙ ⵏ ⵡⴰⴽⵓⴷ','zgh-latn':'Aɣawas n wakud'},
  'tab.prof':{ar:'الأساتذة والمواد',fr:'Professeurs & matières',en:'Professors & courses','zgh':'ⵉⵙⴻⵍⵎⴰⴷⴻⵏ ⴷ ⵜⵓⵙⵏⵉⵡⵉⵏ','zgh-latn':'Iselmaden d tusniwin'},
  'tab.rooms':{ar:'القاعات',fr:'Salles',en:'Rooms','zgh':'ⵜⵉⵅⴰⵎⵉⵏ','zgh-latn':'Tixxamin'},
  'tab.dist':{ar:'توزيع الأفواج',fr:'Répartition des groupes',en:'Group distribution','zgh':'ⴱⴹⵓ ⵏ ⵜⴳⵔⴰⵡⵉⵏ','zgh-latn':'Bḍu n tgrawin'},
  'tab.docs':{ar:'الوثائق',fr:'Documents',en:'Documents','zgh':'ⵉⵙⵏⵉⵍⵙⴻⵏ','zgh-latn':'Isnilsen'},
  'tab.gpa':{ar:'حاسبة المعدل',fr:'Calculateur de moyenne',en:'GPA calculator','zgh':'ⴰⵙⵉⴹⴻⵏ ⵏ ⵜⵎⵓⵢⴰⵏⵜ','zgh-latn':'Asiḍen n tmuyant'},
  'tab.subjects':{ar:'المواد والمقابلات',fr:'Matières & correspondances',en:'Subjects & correspondences','zgh':'ⵜⵓⵙⵏⵉⵡⵉⵏ ⴷ ⵢⵉⵎⴰⵙⴰⵏⴻⵏ','zgh-latn':'Tusniwin d yimassanen'},
  'tab.legal':{ar:'المكتبة القانونية',fr:'Bibliothèque juridique',en:'Legal library','zgh':'ⵜⴰⵙⵏⴰⵡⵉⵜ ⵜⴰⵣⵔⴼⴰⵏ','zgh-latn':'Tasnawit tazrfan'},
  'tab.comments':{ar:'التعاليق',fr:'Commentaires',en:'Comments','zgh':'ⵉⵡⴻⵏⵉⵜⴻⵏ','zgh-latn':'Iwenniten'},
  'tab.about':{ar:'عن المؤسس',fr:'À propos du fondateur',en:'About the founder','zgh':'ⵅⴼ ⵓⵎⵙⵏⵓⵍⴼⵓ','zgh-latn':'Xf umsnulfu'},
  'tab.mytt':{ar:'جدولي الشخصي',fr:'Mon emploi du temps',en:'My timetable','zgh':'ⵓⵖⴰⵡⴰⵙ ⵏ ⵡⴰⴽⵓⴷ-ⵉⵏⵓ','zgh-latn':'Uɣawas n wakud-inu'},
  'tab.deadlines':{ar:'المواعيد والامتحانات',fr:'Échéances & examens',en:'Deadlines & exams','zgh':'ⵜⵉⵎⵉⵣⴰⵔ ⴷ ⵉⵙⴻⴼⵔⴰⵏ','zgh-latn':'Timizar d isefran'},
  'tab.exams':{ar:'🗂️ أرشيف الامتحانات',fr:'Archive des examens',en:'Exam archive'},
  'uni.detail.info':{ar:'معلومات المؤسسة',fr:'Informations sur l\'établissement',en:'Institution information'},
  'uni.detail.status':{ar:'الحالة',fr:'Statut',en:'Status'},
  'uni.detail.city':{ar:'المدينة',fr:'Ville',en:'City'},
  'uni.detail.verified':{ar:'آخر تحقق',fr:'Dernière vérification',en:'Last verified'},
  'uni.detail.notes':{ar:'ملاحظات',fr:'Notes',en:'Notes'},
  'uni.detail.form':{ar:'التكوينات المرتبطة',fr:'Formations liées',en:'Related programmes'},
  'uni.detail.open':{ar:'الموقع الرسمي ↗',fr:'Site officiel ↗',en:'Official site ↗'},
  'uni.detail.close':{ar:'إغلاق',fr:'Fermer',en:'Close'},
  'uni.detail.find':{ar:'🔍 ابحث في التكوينات',fr:'🔍 Chercher les formations',en:'🔍 Search programmes'},
  'uni.detail.about':{ar:'📖 عن المؤسسة',fr:'📖 Présentation',en:'📖 About'},
  'uni.detail.lead':{ar:'👤 القيادة والمسؤولون',fr:'👤 Direction',en:'👤 Leadership'},
  'uni.detail.contact':{ar:'📍 العنوان والاتصال',fr:'📍 Adresse & contact',en:'📍 Address & contact'},
  'uni.detail.address':{ar:'العنوان',fr:'Adresse',en:'Address'},
  'uni.detail.tel':{ar:'الهاتف',fr:'Téléphone',en:'Phone'},
  'uni.detail.fax':{ar:'الفاكس',fr:'Fax',en:'Fax'},
  'uni.detail.programs':{ar:'🎓 البرامج والتكوينات',fr:'🎓 Filières & formations',en:'🎓 Programmes'},
  'uni.detail.useful':{ar:'🔗 روابط رسمية إضافية (اختيارية)',fr:'🔗 Ressources officielles',en:'🔗 Extra official resources'},
  'uni.detail.uiz':{ar:'صفحة المؤسسة في الجامعة ↗',fr:'Page UIZ ↗',en:'UIZ page ↗'},
  'uni.detail.more':{ar:'اقرأ التعريف كاملاً',fr:'Lire la présentation',en:'Read the full presentation'},
  'uni.stats':{ar:'أرقام جامعة ابن زهر',fr:"Chiffres de l'UIZ",en:'UIZ in numbers'},
  'nav.title':{ar:'أقسام المنصة',fr:'Sections de la plateforme',en:'Platform sections','zgh':'ⵜⵉⴱⴹⵉⵡⵉⵏ ⵏ ⵓⵙⵎⴻⵍ','zgh-latn':'Tibḍiwin n usmel'},
  'tab.learn':{ar:'ورشة التعلّم',fr:'Espace d\'apprentissage',en:'Learning Workspace','zgh':'ⴰⴷⵖⴰⵔ ⵏ ⵜⵖⵓⵔⵉ','zgh-latn':'Adɣar n tɣuri'},
  'tab.stats':{ar:'إحصائيات',fr:'Statistiques',en:'Statistics','zgh':'ⵜⵉⵙⵜⴰⵜⵉⵙⵜⵉⴽⵜ','zgh-latn':'Tistatistikt'},
  'tab.university':{ar:'المؤسسات والجامعة',fr:'Université & établissements',en:'University & institutions','zgh':'ⵉⵙⵖⵓⵏⴻⵏ ⵏ ⵜⵙⴷⴰⵡⵉⵜ','zgh-latn':'Isɣunen n tsdawit'},
  'uni.h':{ar:'روابط جامعة ابن زهر',fr:'Liens de l\'Université Ibn Zohr',en:'Ibn Zohr University links','zgh':'ⵉⵙⵖⵓⵏⴻⵏ ⵏ ⵜⵙⴷⴰⵡⵉⵜ Ibn Zohr','zgh-latn':'Isɣunen n tsdawit Ibn Zohr'},
  'uni.banner':{ar:'⚠️ قائمة غير رسمية: روابط منقولة عن الموقع الرسمي للجامعة لأغراض التيسير. المرجع الرسمي هو موقع الجامعة.',fr:'⚠️ Liste non officielle : liens repris du site officiel de l\'université, à titre pratique. La référence reste le site officiel.',en:'⚠️ Unofficial list: links taken from the university\'s official site for convenience. The official reference is the university site.','zgh':'⚠️ ⵜⴰⴱⴷⴰⵔⵜ ⵡⴰⵔ ⵓⵏⵚⵉⴱ: ⵉⵙⵖⵓⵏⴻⵏ ⵜⵡⴰⵟⴼⴻⵏ ⵙⴻⴳ ⵓⵙⵎⴻⵍ ⴰⵎⴰⴷⵓⴷ ⵏ ⵜⵙⴷⴰⵡⵉⵜ ⵉ ⵜⵉⵏⴰⵡⵜ. ⴰⵖⴱⴰⵍⵓ ⴰⵎⴰⴷⵓⴷ ⴷ ⴰⵙⵎⴻⵍ ⵏ ⵜⵙⴷⴰⵡⵉⵜ.','zgh-latn':'⚠️ Tabdart war unṣib: isɣunen ttwaṭṭfen seg usmel amaddud n tsdawit i tinawt. Aɣbalu amaddud d asmel n tsdawit.'},
  'uni.intro':{ar:'تضمّ جامعة ابن زهر 24 مؤسسة (كليات ومدارس) موزّعة على أكادير وآيت ملول وبقية المدن، إضافة إلى أقطاب الجامعة وخدمات الطلبة.',fr:'L\'Université Ibn Zohr regroupe 24 établissements (facultés et écoles) à Agadir, Aït Melloul et d\'autres villes, ainsi que ses pôles et services aux étudiants.',en:'Ibn Zohr University brings together 24 institutions (faculties and schools) across Agadir, Aït Melloul and other cities, plus its academic poles and student services.','zgh':'ⵜⴰⵙⴷⴰⵡⵉⵜ Ibn Zohr ⵜⴻⵙⴻⵔⵖ 24 ⵏ ⵜⵎⴰⴷⴰⵙⵉⵏ (ⵜⵉⵙⴳⵉⵡⵉⵏ ⴷ ⵜⵉⵏⵎⴰⵍ) ⴷⴻⴳ ⴰⴳⴰⴹⵉⵔ, ⴰⵢⵜ ⵎⴻⵍⵓⵍ ⴷ ⵜⵖⵉⵡⴰⵏⵉⵏ-ⵏⵉⴹⴻⵏ, ⵖⴰⵙ ⴰⴽⴻⵏ ⵉⵖⵙⴰⵏ-ⵉⵙ ⴷ ⵢⵉⵎⴰⵙⴰⵏⴻⵏ-ⵉⵙ ⵉ ⵢⵉⵏⴻⵍⵎⴰⴷⴻⵏ.','zgh-latn':'Tasdawit Ibn Zohr tesserɣ 24 n tmaddasin (tisgiwin d tinmal) deg Agaḍir, Ayt Mellul d tɣiwanin-nniḍen, ɣas akken iɣsan-is d yimassanen-is i yinelmaden.'},
  'uni.main':{ar:'الصفحة الرئيسية للجامعة',fr:'Page principale de l\'université',en:'University home page','zgh':'ⴰⵙⵎⴻⵍ ⵏ ⵜⵙⴷⴰⵡⵉⵜ','zgh-latn':'Asmel n tsdawit'},
  'uni.etab':{ar:'صفحة المؤسسات (24 مؤسسة)',fr:'Page des établissements (24)',en:'Institutions page (24)','zgh':'ⴰⵙⵎⴻⵍ ⵏ ⵜⵎⴰⴷⴰⵙⵉⵏ (24)','zgh-latn':'Asmel n tmaddasin (24)'},
  'uni.cat.fac':{ar:'كليات أكادير وآيت ملول',fr:'Facultés d\'Agadir et d\'Aït Melloul',en:'Faculties of Agadir & Aït Melloul','zgh':'ⵜⵉⵙⴳⵉⵡⵉⵏ ⵏ ⴰⴳⴰⴹⵉⵔ ⴷ ⴰⵢⵜ ⵎⴻⵍⵓⵍ','zgh-latn':'Tisgiwin n Agaḍir d Ayt Mellul'},
  'uni.cat.schools':{ar:'مدارس أكادير',fr:'Écoles d\'Agadir',en:'Schools of Agadir','zgh':'ⵜⵉⵏⵎⴰⵍ ⵏ ⴰⴳⴰⴹⵉⵔ','zgh-latn':'Tinmal n Agaḍir'},
  'uni.cat.cities':{ar:'مؤسسات باقي المدن',fr:'Établissements des autres villes',en:'Institutions in other cities','zgh':'ⵜⵎⴰⴷⴰⵙⵉⵏ ⴷⴻⴳ ⵜⵖⵉⵡⴰⵏⵉⵏ-ⵏⵉⴹⴻⵏ','zgh-latn':'Tmaddasin deg tɣiwanin-nniḍen'},
  'uni.cat.poles':{ar:'أقطاب الجامعة',fr:'Pôles de l\'université',en:'University poles','zgh':'ⵉⵖⵙⴰⵏ ⵏ ⵜⵙⴷⴰⵡⵉⵜ','zgh-latn':'Iɣsan n tsdawit'},
  'uni.cat.services':{ar:'خدمات الطلبة',fr:'Services aux étudiants',en:'Student services','zgh':'ⵉⵎⴰⵙⴰⵏⴻⵏ ⵉ ⵢⵉⵏⴻⵍⵎⴰⴷⴻⵏ','zgh-latn':'Imassanen i yinelmaden'},
  'uni.note':{ar:'ملاحظة: «كلية العلوم القانونية والسياسية» لا تظهر بهذا الاسم في لائحة الجامعة؛ أقرب مؤسسة هي كلية العلوم القانونية والاقتصادية والاجتماعية بأكادير. يُرجى التحقّق من الصفحة الرسمية.',fr:'Remarque : la « Faculté des sciences juridiques et politiques » n\'apparaît pas sous ce nom dans la liste de l\'université ; l\'établissement le plus proche est la Faculté des sciences juridiques, économiques et sociales d\'Agadir. Vérifiez la page officielle.',en:'Note: the « Faculty of Law and Political Science » does not appear under that name in the university list; the closest is the Faculty of Legal, Economic and Social Sciences in Agadir. Please verify on the official page.','zgh':'ⵜⴰⵎⴰⵜⴰⵔⵜ: «ⵜⴰⵙⴳⴰ ⵏ ⵓⵣⵔⴻⴼ ⴷ ⵜⵙⵔⵜⴰⵏⵜ» ⵓⵔ ⵜⴻⵜⵡⴰⴱⴷⴰⵔ ⵙ ⵢⵉⵙⵎ-ⴰ ⴷⴻⴳ ⵜⴰⴱⴷⴰⵔⵜ ⵏ ⵜⵙⴷⴰⵡⵉⵜ; ⴰⵇⵔⵉⴱ ⴷ «ⵜⴰⵙⴳⴰ ⵏ ⵜⵓⵙⵏⵉⵡⵉⵏ ⵜⵉⵣⵔⴼⴰⵏⵉⵏ, ⵜⵉⴷⴰⵎⵙⴰⵏⵉⵏ ⴷ ⵜⵉⵏⵎⴻⵜⵉⵢⵉⵏ» ⵏ ⴰⴳⴰⴹⵉⵔ. ⵙⴻⵏⵜⴻⵙ ⵖⴻⴼ ⵓⵙⵎⴻⵍ ⴰⵎⴰⴷⵓⴷ.','zgh-latn':'Tamatart: «Tasga n uzref d tsrtant» ur tettwabdar s yism-a deg tabdart n tsdawit; aqrib d «Tasga n tussniwin tizrfanin, tidamsanin d tinmettiyin» n Agaḍir. Ssentes ɣef usmel amaddud.'},
  'uni.source':{ar:'المصدر الرسمي',fr:'Source officielle',en:'Official source','zgh':'ⴰⵖⴱⴰⵍⵓ ⴰⵎⴰⴷⵓⴷ','zgh-latn':'Aɣbalu amaddud'},
  'uni.form.h':{ar:'🔎 البحث في التكوينات (382)',fr:'🔎 Rechercher dans les formations (382)',en:'🔎 Search programmes (382)','zgh':'🔎 ⵏⴰⴷⵉ ⵜⵉⵖⵓⵔⵉⵡⵉⵏ (382)','zgh-latn':'🔎 Nadi tiɣuriwin (382)'},
  'uni.form.intro':{ar:'ابحث في التكوينات الرسمية لجامعة ابن زهر بالاسم أو المؤسسة أو المدينة أو الدبلوم.',fr:'Recherchez parmi les formations officielles de l\'Université Ibn Zohr par intitulé, établissement, ville ou diplôme.',en:'Search Ibn Zohr University official programmes by name, institution, city or diploma.','zgh':'ⵏⴰⴷⵉ ⵜⵉⵖⵓⵔⵉⵡⵉⵏ ⵜⵉⵎⴰⴷⵓⴷⵉⵏ ⵏ ⵜⵙⴷⴰⵡⵉⵜ Ibn Zohr ⵙ ⵢⵉⵙⵎ, ⵜⴰⵎⴰⴷⴰⵙⵜ, ⵜⵖⵉⵡⴰⵏⵜ ⵏⴻⵖ ⴷⵉⴱⵍⵓⵎ.','zgh-latn':'Nadi tiɣuriwin timaddudin n tsdawit Ibn Zohr s yism, tamaddast, tɣiwant neɣ diplom.'},
  'uni.form.ph':{ar:'مثال: droit، comptabilité، أكادير، Master…',fr:'Ex. : droit, comptabilité, Agadir, Master…',en:'e.g. law, accounting, Agadir, Master…','zgh':'ⴰⵎⴻⴷⵢⴰ: ⴰⵣⵔⴻⴼ, ⵜⵉⴷⴰⵎⵙⴰ, ⴰⴳⴰⴹⵉⵔ, Master…','zgh-latn':'amedya: azref, tidamsa, Agaḍir, Master…'},
  'uni.form.hint':{ar:'اكتب كلمة للبحث في 382 تكوينًا.',fr:'Saisissez un mot pour rechercher parmi 382 formations.',en:'Type a word to search 382 programmes.','zgh':'ⴰⵔⵓ ⴰⵡⴰⵍ ⵉ ⵓⵏⴰⴷⵉ ⵏ 382 ⵏ ⵜⵖⵓⵔⵉⵡⵉⵏ.','zgh-latn':'Aru awal i unadi n 382 n tɣuriwin.'},
  'uni.form.total':{ar:'تكوينًا متوفّرًا',fr:'formations disponibles',en:'programmes available','zgh':'ⵏ ⵜⵉⵖⵓⵔⵉⵡⵉⵏ','zgh-latn':'n tiɣuriwin'},
  'uni.form.results':{ar:'نتيجة',fr:'résultat(s)',en:'result(s)','zgh':'ⵉⴳⵎⴰⴷⴻⵏ','zgh-latn':'igmaden'},
  'uni.form.none':{ar:'لا نتائج مطابقة.',fr:'Aucun résultat.',en:'No matching results.','zgh':'ⵓⵍⴰⴽ ⵉⴳⵎⴰⴷⴻⵏ ⵢⴻⵎⵚⴰⴷⴰⵏ.','zgh-latn':'Ulac igmaden yemṣadan.'},
  'uni.form.more':{ar:'تُعرض أول 80 نتيجة فقط — دقّق البحث.',fr:'Seuls les 80 premiers résultats sont affichés — affinez la recherche.',en:'Only the first 80 results are shown — refine your search.','zgh':'ⵜⵡⴰⵙⴽⴰⵏ ⴽⴰⵏ 80 ⵏ ⵉⴳⵎⴰⴷⴻⵏ ⵉⵎⴻⵣⵡⵓⵔⴰ — ⵙⵏⴻⵊⴷⴻⵍ ⴰⵏⴰⴷⵉ-ⵉⵏⴻⴽ.','zgh-latn':'Ttwaskan kan 80 n igmaden imezwura — snejdel anadi-inek.'},
  'uni.form.note':{ar:'أسماء التكوينات بالفرنسية كما وردت في المصدر الرسمي. الرابط يفتح بطاقة المسلك في موقع الجامعة.',fr:'Les intitulés des formations sont en français, tels quels dans la source officielle. Le lien ouvre la fiche du cursus sur le site de l\'université.',en:'Programme names are in French as in the official source. The link opens the programme page on the university site.','zgh':'ⵉⵙⵎⴰⵡⴻⵏ ⵏ ⵜⵉⵖⵓⵔⵉⵡⵉⵏ ⵙ ⵜⴰⴼⵔⴰⵏⵙⵉⵙⵜ ⴰⵎ ⴷⴻⴳ ⵓⵖⴱⴰⵍⵓ ⴰⵎⴰⴷⵓⴷ. ⴰⵙⵖⵓⵏ ⵢⴻⵍⴷⵉ ⵜⵙⴻⴱⵜⴰⵔⵜ ⵏ ⵜⵖⵓⵔⵉ ⴷⴻⴳ ⵓⵙⵎⴻⵍ ⵏ ⵜⵙⴷⴰⵡⵉⵜ.','zgh-latn':'Ismawen n tiɣuriwin s tafransist am deg uɣbalu amaddud. Asɣun yeldi tsebtart n tɣuri deg usmel n tsdawit.'},
  'uni.form.allEtab':{ar:'كل المؤسسات',fr:'Tous les établissements',en:'All institutions','zgh':'ⴰⴽ ⵜⵎⴰⴷⴰⵙⵉⵏ','zgh-latn':'Akk tmaddasin'},
  'uni.form.allDipl':{ar:'كل الدبلومات',fr:'Tous les diplômes',en:'All diplomas','zgh':'ⴰⴽ ⴷⵉⴱⵍⵓⵎ','zgh-latn':'Akk diplom'},
  'uni.form.allCity':{ar:'كل المدن',fr:'Toutes les villes',en:'All cities','zgh':'ⴰⴽ ⵜⵖⵉⵡⴰⵏⵉⵏ','zgh-latn':'Akk tɣiwanin'},
  'uni.form.lblEtab':{ar:'تصفية حسب المؤسسة',fr:'Filtrer par établissement',en:'Filter by institution','zgh':'ⵙⵏⴻⵙ ⵙ ⵜⵎⴰⴷⴰⵙⵜ','zgh-latn':'Snes s tmaddast'},
  'uni.form.lblDipl':{ar:'تصفية حسب الدبلوم',fr:'Filtrer par diplôme',en:'Filter by diploma','zgh':'ⵙⵏⴻⵙ ⵙ ⴷⵉⴱⵍⵓⵎ','zgh-latn':'Snes s diplom'},
  'uni.form.lblCity':{ar:'تصفية حسب المدينة',fr:'Filtrer par ville',en:'Filter by city','zgh':'ⵙⵏⴻⵙ ⵙ ⵜⵖⵉⵡⴰⵏⵜ','zgh-latn':'Snes s tɣiwant'},
  'stats.lead':{ar:'نظرة عامة على محتوى المنصة: المسالك، الحصص، الأساتذة، القاعات، المواد، الوثائق وتوزيعات الأفواج. الأرقام محسوبة مباشرة من البيانات المعروضة.',fr:'Aperçu du contenu de la plateforme : filières, séances, professeurs, salles, matières, documents et répartitions. Les chiffres sont calculés à partir des données affichées.',en:'Overview of the platform content: tracks, sessions, professors, rooms, subjects, documents and group distributions. Figures are computed from the displayed data.','zgh':'ⵜⴰⵎⵓⵖⵍⵉ ⵖⴻⴼ ⵓⴳⴱⵓⵔ ⵏ ⵓⵙⵎⴻⵍ: ⵉⴱⵔⴷⴰⵏ, ⵜⵉⵖⵔⵉⵡⵉⵏ, ⵉⵙⴻⵍⵎⴰⴷⴻⵏ, ⵜⵉⵅⴰⵎⵉⵏ, ⵜⵓⵙⵏⵉⵡⵉⵏ, ⵉⵙⵏⵉⵍⵙⴻⵏ ⴷ ⴱⴹⵓ ⵏ ⵜⴳⵔⴰⵡⵉⵏ. ⵉⵎⴹⴰⵏⴻⵏ ⵜⵡⴰⵃⵙⴰⴱⴻⵏ ⵙⴻⴳ ⵉⵙⴻⴼⴽⴰ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ.','zgh-latn':'Tamuɣli ɣef ugbur n usmel: ibrdan, tiɣriwin, iselmaden, tixxamin, tusniwin, isnilsen d bḍu n tgrawin. Imḍanen ttwaḥsaben seg isefka yettwaskanen.'},
  'stats.rooms':{ar:'قاعة',fr:'salles',en:'rooms','zgh':'ⵜⵉⵅⴰⵎⵉⵏ','zgh-latn':'tixxamin'},
  'stats.subjects':{ar:'مادة',fr:'matières',en:'subjects','zgh':'ⵜⵓⵙⵏⵉⵡⵉⵏ','zgh-latn':'tusniwin'},
  'stats.docs':{ar:'وثيقة',fr:'documents',en:'documents','zgh':'ⵉⵙⵏⵉⵍⵙⴻⵏ','zgh-latn':'isnilsen'},
  'stats.groups':{ar:'فوج',fr:'groupes',en:'groups','zgh':'ⵜⵉⴳⵔⴰⵡⵉⵏ','zgh-latn':'tigrawin'},
  'stats.bySem':{ar:'التوزيع حسب السداسي',fr:'Répartition par semestre',en:'Breakdown by semester','zgh':'ⴱⴹⵓ ⵙ ⵓⵙⴻⵎⵙⵜⴻⵔ','zgh-latn':'Bḍu s usemster'},
  'stats.byLang':{ar:'التوزيع حسب لغة الدراسة',fr:'Répartition par langue d\'étude',en:'Breakdown by study language','zgh':'ⴱⴹⵓ ⵙ ⵜⵓⵜⵍⴰⵢⵜ ⵏ ⵜⵖⵓⵔⵉ','zgh-latn':'Bḍu s tutlayt n tɣuri'},
  'stats.tracksTitle':{ar:'قائمة المسالك والمسارات',fr:'Liste des filières et parcours',en:'List of tracks and paths','zgh':'ⵜⴰⴱⴷⴰⵔⵜ ⵏ ⵉⴱⵔⴷⴰⵏ','zgh-latn':'Tabdart n ibrdan'},
  'stats.tracksCol':{ar:'عدد المسالك',fr:'Filières',en:'Tracks','zgh':'ⵉⴱⵔⴷⴰⵏ','zgh-latn':'Ibrdan'},
  'th.semester':{ar:'السداسي',fr:'Semestre',en:'Semester','zgh':'ⴰⵙⴻⵎⵙⵜⴻⵔ','zgh-latn':'Asemster'},
  'th.language':{ar:'اللغة',fr:'Langue',en:'Language','zgh':'ⵜⵓⵜⵍⴰⵢⵜ','zgh-latn':'Tutlayt'},
  'th.sessions':{ar:'الحصص',fr:'Séances',en:'Sessions','zgh':'ⵜⵉⵖⵔⵉⵡⵉⵏ','zgh-latn':'Tiɣriwin'},
  'learn.lead':{ar:'ورشة التعلّم: ملخصات وموارد دراسية مختارة لمساعدتك على المراجعة. اضغط على أي مورد لفتحه (PDF).',fr:'Espace d\'apprentissage : résumés et ressources sélectionnés pour réviser. Cliquez sur une ressource pour l\'ouvrir (PDF).',en:'Learning workspace: selected summaries and study resources. Click a resource to open it (PDF).','zgh':'ⵙⴻⵏⵟⴻⴹ ⴰⴹⵔⵉⵙ ⵏ ⵜⵖⵓⵔⵉ-ⵉⵏⴻⴽ ⴷⴰ → ⵜⴰⴼⴻⴹ ⴰⴳⵣⵓⵍ ⴰⵎⵓⵙⵏⴰⵏ, ⵜⵉⵇⵣⵉⵢⵉⵏ, ⵜⵉⴽⴰⵔⴷⴰ ⵏ ⵓⵙⵎⴻⴽⵜⵉ ⴷ ⵓⵖⴰⵡⴰⵙ ⵏ ⵓⵙⴻⵎⵜⵉ. ⵢⴻⵜⴻⴷⵓ ⵉⵎⴰⵏ-ⵉⵙ.','zgh-latn':'Senṭeḍ aḍris n tɣuri-inek da → tafeḍ agzul amussnan, tiqziyin, tikarda n usmekti d uɣawas n usemti. Yetteddu iman-is.'},
  'learn.materials':{ar:'الموارد الدراسية',fr:'Ressources d\'étude',en:'Study resources','zgh':'ⵉⵖⴱⵓⵍⴰ ⵏ ⵜⵖⵓⵔⵉ','zgh-latn':'Iɣbula n tɣuri'},
  'learn.tips':{ar:'نصيحة: راجع جدولك من قسم «استعمال الزمن»، وتحقق دائماً من النسخة الرسمية للكلية.',fr:'Conseil : consultez votre emploi du temps dans la section dédiée et vérifiez toujours la version officielle de la faculté.',en:'Tip: check your timetable in its section and always verify the faculty\'s official version.','zgh':'ⴰⵡⴰⵍⵉ: ⵙⴻⵏⵜⴻⵙ ⵖⴻⴼ ⵓⵖⴰⵡⴰⵙ ⵏ ⵡⴰⴽⵓⴷ-ⵉⵏⴻⴽ ⴷⴻⴳ ⵜⵣⴻⴳⵣⴰⵡⵜ-ⵉⵙ, ⴷⴰⵖⴻⵏ ⵙⴻⵏⵜⴻⵙ ⵖⴻⴼ ⵍⵇⴻⵎ ⴰⵎⴰⴷⵓⴷ ⵏ ⵜⵙⴳⴰ.','zgh-latn':'Awali: ssentes ɣef uɣawas n wakud-inek deg tzegzawt-is, daɣen ssentes ɣef lqem amaddud n tsga.'},
  'ann.none':{ar:'ما كاين حتى إعلان منشور حالياً.',fr:'Aucune annonce publiée pour le moment.',en:'No published announcements yet.','zgh':'ⵓⵍⴰⴽ ⵉⵙⴰⵍⴻⵏ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ ⵢⴰⴽⴰⵏ.','zgh-latn':'Ulac isallen yettwaskanen yakan.'},
  'ann.count':{ar:'عدد الإعلانات المنشورة:',fr:'Annonces publiées :',en:'Published announcements:','zgh':'ⵉⵙⴰⵍⴻⵏ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ:','zgh-latn':'Isallen yettwaskanen:'},
  'ann.error':{ar:'تعذر تحميل إعلانات المنصة حالياً.',fr:'Impossible de charger les annonces de la plateforme pour le moment.',en:'Could not load platform announcements right now.','zgh':'ⵓⵔ ⵢⴻⵣⵎⵉⵔ ⴰⵔⴰ ⴰⴷ ⴷ-ⵢⴰⵍⵉ ⵉⵙⴰⵍⴻⵏ ⵏ ⵓⵙⵎⴻⵍ ⵜⵓⵔⴰ.','zgh-latn':'Ur yezmir ara ad d-yali isallen n usmel tura.'},
  'ann.source':{ar:'المصدر الرسمي ↗',fr:'Source officielle ↗',en:'Official source ↗','zgh':'ⴰⵖⴱⴰⵍⵓ ⴰⵎⴰⴷⵓⴷ ↗','zgh-latn':'Aɣbalu amaddud ↗'},
  'ann.all':{ar:'عرض كل الإعلانات',fr:'Voir toutes les annonces',en:'View all announcements','zgh':'ⵡⴰⵍⵉ ⴰⴽ ⵉⵙⴰⵍⴻⵏ','zgh-latn':'Wali akk isallen'},
  'btn.search':{ar:'بحث',fr:'Rechercher',en:'Search','zgh':'ⵏⴰⴷⵉ','zgh-latn':'Nadi'},
  'btn.show':{ar:'عرض',fr:'Afficher',en:'Show','zgh':'ⵙⴽⴻⵏ','zgh-latn':'Ssken'},
  'btn.showTT':{ar:'عرض استعمال الزمن',fr:'Voir l\'emploi du temps',en:'Show timetable','zgh':'ⵙⴽⴻⵏ ⴰⵖⴰⵡⴰⵙ ⵏ ⵡⴰⴽⵓⴷ','zgh-latn':'Ssken aɣawas n wakud'},
  'btn.saveGrp':{ar:'احفظ فوجي',fr:'Enregistrer mon groupe',en:'Save my group','zgh':'ⵙⴻⴽⵍⴻⵙ ⵜⴰⴳⵔⴰⵡⵜ-ⵉⵏⵓ','zgh-latn':'Sekles tagrawt-inu'},
  'btn.saved':{ar:'✓ تم الحفظ',fr:'✓ Enregistré',en:'✓ Saved','zgh':'✓ ⵢⴻⵜⵡⴰⵙⴻⴽⵍⴻⵙ','zgh-latn':'✓ Yettwasekles'},
  'btn.saveMyGrp':{ar:'خليه فوجي',fr:'Définir comme mon groupe',en:'Set as my group','zgh':'ⴻⵔ-ⵜ ⴷ ⵜⴰⴳⵔⴰⵡⵜ-ⵉⵏⵓ','zgh-latn':'Err-t d tagrawt-inu'},
  'btn.whatsapp':{ar:'فواتساب',fr:'WhatsApp',en:'WhatsApp','zgh':'WhatsApp','zgh-latn':'WhatsApp'},
  'btn.copy':{ar:'نسخ',fr:'Copier',en:'Copy','zgh':'ⵏⵖⴻⵍ','zgh-latn':'Nɣel'},
  'btn.copied':{ar:'✓ تم النسخ',fr:'✓ Copié',en:'✓ Copied','zgh':'✓ ⵢⴻⵜⵡⴰⵏⵖⴻⵍ','zgh-latn':'✓ Yettwanɣel'},
  'btn.copyFail':{ar:'تعذر النسخ',fr:'Copie impossible',en:'Copy failed','zgh':'ⵓⵔ ⵢⴻⵣⵎⵉⵔ ⴰⵔⴰ ⴰⴷ ⵢⵏⵖⴻⵍ','zgh-latn':'Ur yezmir ara ad ynɣel'},
  'btn.close':{ar:'إغلاق',fr:'Fermer',en:'Close','zgh':'ⵖⵍⴻⵇ','zgh-latn':'Ɣleq'},
  'btn.saveAsGrp':{ar:'احفظ كفوجي',fr:'Enregistrer comme mon groupe',en:'Save as my group','zgh':'ⵙⴻⴽⵍⴻⵙ-ⵉⵜ ⴷ ⵜⴰⴳⵔⴰⵡⵜ-ⵉⵏⵓ','zgh-latn':'Sekles-itt d tagrawt-inu'},
  'btn.addCourse':{ar:'إضافة مادة',fr:'Ajouter une matière',en:'Add course','zgh':'ⵔⵏⵓ ⵜⵓⵙⵏⴰ','zgh-latn':'Rnu tusna'},
  'btn.clearAll':{ar:'مسح الكل',fr:'Tout effacer',en:'Clear all','zgh':'ⵙⴼⴻⴹ ⴰⴽ','zgh-latn':'Sfeḍ akk'},
  'btn.delete':{ar:'حذف',fr:'Supprimer',en:'Delete','zgh':'ⴽⴻⵙ','zgh-latn':'Kkes'},
  'btn.print':{ar:'🖨️ طباعة / حفظ PDF',fr:'🖨️ Imprimer / PDF',en:'🖨️ Print / PDF','zgh':'🖨️ ⴰⵎⴱⵔⵉⵎⵉ / PDF','zgh-latn':'🖨️ Ambrimi / PDF'},
  'btn.contact':{ar:'💬 راسلني على واتساب',fr:'💬 Contactez-moi sur WhatsApp',en:'💬 Message me on WhatsApp','zgh':'💬 ⴰⵔⵓ-ⵉⵢⵉ ⵖ WhatsApp','zgh-latn':'💬 Aru-iyi ɣ WhatsApp'},
  'lbl.surname':{ar:'اللقب العائلي بالحروف اللاتينية (كما يظهر في اللائحة الرسمية)',fr:'Nom de famille en lettres latines (comme sur la liste officielle)',en:'Surname in Latin letters (as on the official list)','zgh':'ⵉⵙⵎ ⵏ ⵜⵡⴰⴽⵓⵍⵜ ⵙ ⵢⵉⴳⵔⴼⴻⵏ ⵉⵍⴰⵜⵉⵏⴻⵏ (ⴰⵎ ⴷⴻⴳ ⵜⴰⴱⴷⴰⵔⵜ ⵜⴰⵣⵔⴼⴰⵏ)','zgh-latn':'Ism n twacult s yigrfen ilatinen (am deg tabdart tazrfan)'},
  'ph.surname':{ar:'Ex : CHRAIM ou EL MANSOURI ou AIT BACH',fr:'Ex : CHRAIM ou EL MANSOURI ou AIT BACH',en:'Ex: CHRAIM or EL MANSOURI or AIT BACH','zgh':'ⴰⵎⴻⴷⵢⴰ: CHRAIM ⵏⴻⵖ EL MANSOURI ⵏⴻⵖ AIT BACH','zgh-latn':'Amedya: CHRAIM neɣ EL MANSOURI neɣ AIT BACH'},
  'hint.surname':{ar:'اكتب اللقب فقط (بدون الاسم الشخصي). الأسماء المركبة مثل «EL» و«AIT» تكتب بفراغ كما في اللائحة.',fr:'Saisissez le nom de famille uniquement. Les noms composés comme « EL » et « AIT » s\'écrivent avec un espace comme sur la liste.',en:'Enter the surname only. Compound names like "EL" and "AIT" are written with a space, as on the list.','zgh':'ⵙⴻⴽⴻⵎ ⴽⴰⵏ ⵉⵙⵎ ⵏ ⵜⵡⴰⴽⵓⵍⵜ. ⵉⵙⵎⴰⵡⴻⵏ ⵢⴻⵎⵓⵏⴻⵏ ⴰⵎ «EL» ⴷ «AIT» ⵜⵡⴰⵔⵓⵏ ⵙ ⵓⵙⵓⴷⴻⵙ, ⴰⵎ ⴷⴻⴳ ⵜⴰⴱⴷⴰⵔⵜ.','zgh-latn':'Sekcem kan ism n twacult. Ismawen yemmunen am «EL» d «AIT» ttwarun s usuddes, am deg tabdart.'},
  'msg.need2':{ar:'اكتب حرفين على الأقل من لقبك بالحروف اللاتينية.',fr:'Saisissez au moins deux lettres de votre nom en lettres latines.',en:'Enter at least two letters of your surname in Latin letters.','zgh':'ⵙⴻⴽⴻⵎ ⵎⴰ ⴷⵔⵓⵙ ⵙⵉⵏ ⵏ ⵢⵉⴳⵔⴼⴻⵏ ⵏ ⵉⵙⵎ ⵏ ⵜⵡⴰⴽⵓⵍⵜ-ⵉⵏⴻⴽ ⵙ ⵢⵉⴳⵔⴼⴻⵏ ⵉⵍⴰⵜⵉⵏⴻⵏ.','zgh-latn':'Sekcem ma drus sin n yigrfen n ism n twacult-inek s yigrfen ilatinen.'},
  'msg.noData':{ar:'لا توجد بيانات منشورة لهذا السداسي بهذه اللغة بعد.',fr:'Aucune donnée publiée pour ce semestre dans cette langue.',en:'No published data for this semester in this language yet.','zgh':'ⵓⵍⴰⴽ ⵉⵙⴻⴼⴽⴰ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ ⵉ ⵓⵙⴻⵎⵙⵜⴻⵔ-ⴰ ⴷⴻⴳ ⵜⵓⵜⵍⴰⵢⵜ-ⴰ ⵢⴰⴽⴰⵏ.','zgh-latn':'Ulac isefka yettwaskanen i usemster-a deg tutlayt-a yakan.'},
  'msg.frUnified':{ar:'هذا الجدول موحد لكل طلبة هذا المسلك (قسم الفرنسية). لا يوجد توزيع بالأفواج في الوثائق المنشورة.',fr:'Cet emploi du temps est commun à tous les étudiants (section française). Aucune répartition par groupes dans les documents publiés.',en:'This timetable is common to all students (French section). No group distribution in the published documents.','zgh':'ⴰⵖⴰⵡⴰⵙ-ⴰ ⵏ ⵡⴰⴽⵓⴷ ⴷ ⴰⵎⴻⵣⴷⴰⵢ ⵉ ⴰⴽ ⵉⵏⴻⵍⵎⴰⴷⴻⵏ (ⵜⵉⴱⴹⵉⵜ ⵜⴰⴼⵔⴰⵏⵙⵉⵙⵜ). ⵓⵍⴰⴽ ⴱⴹⵓ ⵏ ⵜⴳⵔⴰⵡⵉⵏ ⴷⴻⴳ ⵉⵙⵏⵉⵍⵙⴻⵏ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ.','zgh-latn':'Aɣawas-a n wakud d amezday i akk inelmaden (tibḍit tafransist). Ulac bḍu n tgrawin deg isnilsen yettwaskanen.'},
  'msg.oneGroup':{ar:'هذا المسار فوج واحد (A) في الوثائق المنشورة، فلا حاجة للبحث بالاسم.',fr:'Ce parcours est un groupe unique (A) dans les documents publiés : pas besoin de chercher par nom.',en:'This path is a single group (A) in the published documents; no need to search by name.','zgh':'ⴰⴱⵔⵉⴷ-ⴰ ⴷ ⵜⴰⴳⵔⴰⵡⵜ ⵢⵉⵡⴻⵜ (ⴰ) ⴷⴻⴳ ⵉⵙⵏⵉⵍⵙⴻⵏ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ; ⵓⵍⴰⴽ ⴰⴹⴼⴰⵔ ⵙ ⵢⵉⵙⵎ.','zgh-latn':'Abrid-a d tagrawt yiwet (A) deg isnilsen yettwaskanen; ulac aḍfar s yism.'},
  'lbl.surnameIs':{ar:'اللقب',fr:'Nom',en:'Surname','zgh':'ⵉⵙⵎ ⵏ ⵜⵡⴰⴽⵓⵍⵜ','zgh-latn':'Ism n twacult'},
  'lbl.group':{ar:'الفوج',fr:'Groupe',en:'Group','zgh':'ⵜⴰⴳⵔⴰⵡⵜ','zgh-latn':'Tagrawt'},
  'lbl.subgroups':{ar:'المجموعات',fr:'Sous-groupes',en:'Subgroups','zgh':'ⵜⵉⴳⵔⴰⵡⵉⵏ ⵜⵉⵎⴻⵣⵢⴰⵏⵉⵏ','zgh-latn':'Tigrawin timezzyanin'},
  'lbl.french':{ar:'الفرنسية',fr:'Français',en:'French','zgh':'ⵜⴰⴼⵔⴰⵏⵙⵉⵙⵜ','zgh-latn':'Tafransist'},
  'lbl.english':{ar:'الإنجليزية',fr:'Anglais',en:'English','zgh':'ⵜⴰⵏⴳⵍⵉⵣⵜ','zgh-latn':'Tanglizt'},
  'note.calc':{ar:'النتيجة محسوبة من حدود الألقاب المنشورة. إذا اختلفت مع اللائحة المعلقة فاللائحة الرسمية هي المعتمدة.',fr:'Le résultat est calculé à partir des bornes de noms publiées. En cas de divergence, la liste officielle prévaut.',en:'Result computed from published surname ranges. If it differs, the official list prevails.','zgh':'ⴰⴳⵎⵓⴹ ⵢⴻⵜⵡⴰⵃⵙⴰⴱ ⵙⴻⴳ ⵢⵉⴳⵔⴰⵎ ⵏ ⵢⵉⵙⵎⴰⵡⴻⵏ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ. ⵎⴰ ⵢⴻⵎⵅⴰⵍⴰⴼ, ⵜⴰⴱⴷⴰⵔⵜ ⵜⴰⵎⴰⴷⵓⴷⵜ ⴰ ⵜ-ⵜⴻⵙⴻⵔⵖ.','zgh-latn':'Agmuḍ yettwaḥsab seg yigram n yismawen yettwaskanen. Ma yemxallaf, tabdart tamaddudt a t-tesserɣ.'},
  'note.before':{ar:'اللقب يسبق أول لقب في اللائحة، النتيجة تقريبية.',fr:'Le nom précède le premier de la liste : résultat approximatif.',en:'The surname precedes the first in the list; the result is approximate.','zgh':'ⵉⵙⵎ ⵏ ⵜⵡⴰⴽⵓⵍⵜ ⵉⵄⴻⴷⴰ ⵖⴻⴼ ⵡⴻⵎⴻⵣⵡⴰⵔⵓ ⴷⴻⴳ ⵜⴰⴱⴷⴰⵔⵜ; ⴰⴳⵎⵓⴹ ⴷ ⴰⵇⵔⵉⴱ.','zgh-latn':'Ism n twacult iɛedda ɣef wemezwaru deg tabdart; agmuḍ d aqrib.'},
  'note.after':{ar:'اللقب يأتي بعد آخر لقب منشور في التوزيع، النتيجة تقريبية.',fr:'Le nom suit le dernier publié : résultat approximatif.',en:'The surname comes after the last published one; the result is approximate.','zgh':'ⵉⵙⵎ ⵏ ⵜⵡⴰⴽⵓⵍⵜ ⵢⵓⵙⴰ-ⴷ ⴷⴻⴼⵉⵔ ⵓⵏⴻⴳⴰⵔⵓ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ; ⴰⴳⵎⵓⴹ ⴷ ⴰⵇⵔⵉⴱ.','zgh-latn':'Ism n twacult yusa-d deffir uneggaru yettwaskanen; agmuḍ d aqrib.'},
  'today.title':{ar:'📅 حصص اليوم',fr:'📅 Séances d\'aujourd\'hui',en:'📅 Today\'s sessions','zgh':'📅 ⵜⵉⵖⵔⵉⵡⵉⵏ ⵏ ⵡⴰⵙ-ⴰ','zgh-latn':'📅 Tiɣriwin n wass-a'},
  'today.sun':{ar:' (الأحد — عطلة)',fr:' (dimanche — repos)',en:' (Sunday — off)','zgh':' (ⴰⵙⴰⵎⴰⵙ — ⴰⵙⵓⵏⴼⵓ)','zgh-latn':' (Asamas — asunfu)'},
  'today.none':{ar:'لا توجد حصص اليوم 🎉',fr:'Aucune séance aujourd\'hui 🎉',en:'No sessions today 🎉','zgh':'ⵓⵍⴰⴽ ⵜⵉⵖⵔⵉⵡⵉⵏ ⴰⵙ-ⴰ 🎉','zgh-latn':'Ulac tiɣriwin ass-a 🎉'},
  'today.tag':{ar:'اليوم',fr:'aujourd\'hui',en:'today','zgh':'ⴰⵙ-ⴰ','zgh-latn':'ass-a'},
  'msg.noSessions':{ar:'لا توجد حصص.',fr:'Aucune séance.',en:'No sessions.','zgh':'ⵓⵍⴰⴽ ⵜⵉⵖⵔⵉⵡⵉⵏ.','zgh-latn':'Ulac tiɣriwin.'},
  'msg.noSessionsChoice':{ar:'لا توجد حصص منشورة لهذا الاختيار.',fr:'Aucune séance publiée pour ce choix.',en:'No published sessions for this choice.','zgh':'ⵓⵍⴰⴽ ⵜⵉⵖⵔⵉⵡⵉⵏ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ ⵉ ⵓⴼⵔⴰⵏ-ⴰ.','zgh-latn':'Ulac tiɣriwin yettwaskanen i ufran-a.'},
  'hdr.tt':{ar:'استعمال الزمن',fr:'Emploi du temps',en:'Timetable','zgh':'ⴰⵖⴰⵡⴰⵙ ⵏ ⵡⴰⴽⵓⴷ','zgh-latn':'Aɣawas n wakud'},
  'hdr.myGrp':{ar:'فوجي',fr:'Mon groupe',en:'My group','zgh':'ⵜⴰⴳⵔⴰⵡⵜ-ⵉⵏⵓ','zgh-latn':'Tagrawt-inu'},
  'btn.viewTT':{ar:'شوف استعمال الزمن',fr:'Voir l\'emploi du temps',en:'View timetable','zgh':'ⵡⴰⵍⵉ ⴰⵖⴰⵡⴰⵙ ⵏ ⵡⴰⴽⵓⴷ','zgh-latn':'Wali aɣawas n wakud'},
  'msg.pickGroup':{ar:'اختر الفوج ثم اضغط «عرض».',fr:'Choisissez le groupe puis cliquez sur « Afficher ».',en:'Choose the group then click "Show".','zgh':'ⴼⵔⴻⵏ ⵜⴰⴳⵔⴰⵡⵜ ⵙⵉⵏⴰ ⵙⵉⵜ ⵖⴻⴼ «ⵙⴽⴻⵏ».','zgh-latn':'Fren tagrawt sinna sit ɣef «Ssken».'},
  'lbl.frGroup':{ar:'فوج الفرنسية',fr:'Groupe français',en:'French group','zgh':'ⵜⴰⴳⵔⴰⵡⵜ ⵜⴰⴼⵔⴰⵏⵙⵉⵙⵜ','zgh-latn':'Tagrawt tafransist'},
  'lbl.enGroup':{ar:'فوج الإنجليزية',fr:'Groupe anglais',en:'English group','zgh':'ⵜⴰⴳⵔⴰⵡⵜ ⵜⴰⵏⴳⵍⵉⵣⵜ','zgh-latn':'Tagrawt tanglizt'},
  'msg.noResults':{ar:'لا نتائج.',fr:'Aucun résultat.',en:'No results.','zgh':'ⵓⵍⴰⴽ ⵉⴳⵎⴰⴷⴻⵏ.','zgh-latn':'Ulac igmaden.'},
  'hdr.searchResults':{ar:'نتائج البحث',fr:'Résultats de recherche',en:'Search results','zgh':'ⵉⴳⵎⴰⴷⴻⵏ ⵏ ⵓⵏⴰⴷⵉ','zgh-latn':'Igmaden n unadi'},
  'hdr.trackCourses':{ar:'مواد المسلك المختار',fr:'Matières de la filière',en:'Courses of the selected track','zgh':'ⵜⵓⵙⵏⵉⵡⵉⵏ ⵏ ⵓⴱⵔⵉⴷ ⵢⴻⵜⵡⴰⴼⵔⴻⵏ','zgh-latn':'Tusniwin n ubrid yettwafren'},
  'th.course':{ar:'المادة',fr:'Matière',en:'Course','zgh':'ⵜⵓⵙⵏⴰ','zgh-latn':'Tusna'},
  'th.prof':{ar:'الأستاذ',fr:'Professeur',en:'Professor','zgh':'ⴰⵙⴻⵍⵎⴰⴷ','zgh-latn':'Aselmad'},
  'th.count':{ar:'عدد الحصص',fr:'Nb séances',en:'Sessions','zgh':'ⵜⵉⵖⵔⵉⵡⵉⵏ','zgh-latn':'Tiɣriwin'},
  'th.track':{ar:'المسلك',fr:'Filière',en:'Track','zgh':'ⴰⴱⵔⵉⴷ','zgh-latn':'Abrid'},
  'th.room':{ar:'القاعة',fr:'Salle',en:'Room','zgh':'ⵜⴰⵅⴰⵎⵜ','zgh-latn':'Taxxamt'},
  'th.rooms':{ar:'المواد',fr:'Matières',en:'Courses','zgh':'ⵜⵓⵙⵏⵉⵡⵉⵏ','zgh-latn':'Tusniwin'},
  'prof.searchIn':{ar:'ابحث عن أستاذ أو مادة (في كل مسالك',fr:'Chercher un professeur ou une matière (dans toutes les filières',en:'Search a professor or course (in all tracks','zgh':'ⵏⴰⴷⵉ ⴰⵙⴻⵍⵎⴰⴷ ⵏⴻⵖ ⵜⵓⵙⵏⴰ (ⴷⴻⴳ ⴰⴽ ⵉⴱⵔⴷⴰⵏ)','zgh-latn':'Nadi aselmad neɣ tusna (deg akk ibrdan)'},
  'prof.phAr':{ar:'مثال: اطويف أو التأمين',fr:'ex : AZZI ou Droit social',en:'e.g. AZZI or Droit social','zgh':'ⴰⵎⴻⴷⵢⴰ: AZZI ⵏⴻⵖ Droit social','zgh-latn':'amedya: AZZI neɣ Droit social'},
  'prof.phFr':{ar:'ex : AZZI ou Droit social',fr:'ex : AZZI ou Droit social',en:'e.g. AZZI or Droit social','zgh':'ⴰⵎⴻⴷⵢⴰ: AZZI ⵏⴻⵖ Droit social','zgh-latn':'amedya: AZZI neɣ Droit social'},
  'msg.roomsIn':{ar:'القاعات المستعملة في:',fr:'Salles utilisées dans :',en:'Rooms used in:','zgh':'ⵜⵉⵅⴰⵎⵉⵏ ⵢⴻⵜⵡⴰⵙⵇⴻⴷⴽⴻⵏ ⴷⴻⴳ:','zgh-latn':'Tixxamin yettwasqedcen deg:'},
  'msg.noDist':{ar:'لا يوجد توزيع بالأفواج منشور لهذا المسلك.',fr:'Aucune répartition de groupes publiée pour cette filière.',en:'No group distribution published for this track.','zgh':'ⵓⵍⴰⴽ ⴱⴹⵓ ⵏ ⵜⴳⵔⴰⵡⵉⵏ ⵢⴻⵜⵡⴰⵙⴽⴰⵏ ⵉ ⵓⴱⵔⵉⴷ-ⴰ.','zgh-latn':'Ulac bḍu n tgrawin yettwaskan i ubrid-a.'},
  'dist.fr':{ar:'أقسام الفرنسية',fr:'Sections françaises',en:'French sections','zgh':'ⵜⵉⴱⴹⵉⵡⵉⵏ ⵜⵉⴼⵔⴰⵏⵙⵉⵙⵉⵏ','zgh-latn':'Tibḍiwin tifransisin'},
  'dist.en':{ar:'أقسام الإنجليزية',fr:'Sections anglaises',en:'English sections','zgh':'ⵜⵉⴱⴹⵉⵡⵉⵏ ⵜⵉⵏⴳⵍⵉⵣⵉⵏ','zgh-latn':'Tibḍiwin tinglizin'},
  'dist.rule':{ar:'القاعدة المعتمدة في اللوائح: الأسماء المركبة والمصحوبة بفراغ (مثل EL MANSOURI) تأتي دائماً قبل الأسماء المتصلة (مثل ELOUARDI).',fr:'Règle des listes : les noms composés avec espace (ex. EL MANSOURI) précèdent toujours les noms collés (ex. ELOUARDI).',en:'List rule: compound names with a space (e.g. EL MANSOURI) always precede joined names (e.g. ELOUARDI).','zgh':'ⴰⵍⵖⵓ ⵏ ⵜⴰⴱⴷⴰⵔⵜ: ⵉⵙⵎⴰⵡⴻⵏ ⵢⴻⵎⵓⵏⴻⵏ ⵙ ⵓⵙⵓⴷⴻⵙ (ⴰⵎⴻⴷⵢⴰ EL MANSOURI) ⴷⵉⵎⴰ ⵣⴷⴰⵜ ⵢⵉⵙⵎⴰⵡⴻⵏ ⵢⴻⵎⵓⵏⴻⵏ (ⴰⵎⴻⴷⵢⴰ ELOUARDI).','zgh-latn':'Alɣu n tabdart: ismawen yemmunen s usuddes (amedya EL MANSOURI) dima zdat yismawen yemmunen (amedya ELOUARDI).'},
  'docs.banner':{ar:'📄 هذه الوثائق نسخ أرشيفية عن الوثائق الرسمية للكلية. للنسخة الرسمية الأصلية يُرجى الرجوع إلى',fr:'📄 Ces documents sont des copies d\'archive des documents officiels. Pour l\'original officiel, consultez',en:'📄 These documents are archived copies of the official ones. For the official original, refer to','zgh':'📄 ⵉⵙⵏⵉⵍⵙⴻⵏ-ⴰ ⴷ ⵜⵉⴽⵡⵉⴱⵉ ⵏ ⵡⵉⴷ ⴰⵎⴰⴷⵓⴷ. ⵉ ⵓⵖⴱⴰⵍⵓ ⴰⵎⴰⴷⵓⴷ, ⵄⵏⴻⴷ ⵖⴻⵔ','zgh-latn':'📄 Isnilsen-a d tikwipi n wid amaddud. I uɣbalu amaddud, ɛned ɣer'},
  'docs.banner2':{ar:'موقع الكلية',fr:'le site de la faculté',en:'the faculty website','zgh':'ⴰⵙⵎⴻⵍ ⵏ ⵜⵙⴳⴰ','zgh-latn':'asmel n tsga'},
  'docs.banner3':{ar:'. عند أي اختلاف، الوثيقة الرسمية هي المرجع.',fr:'. En cas de divergence, le document officiel fait foi.',en:'. In case of divergence, the official document prevails.','zgh':'. ⵎⴰ ⵢⴻⵍⴰ ⴰⵎⵅⴰⵍⴰⴼ, ⴰⵙⵏⵉⵍⵙ ⴰⵎⴰⴷⵓⴷ ⴰ ⵜ-ⵜⵡⴰⵙⴻⵎⵖⴻⵔ.','zgh-latn':'. Ma yella amxallaf, asnils amaddud a t-ttwassemɣer.'},
  'docs.note':{ar:'الوثائق الأصلية كما صدرت عن الكلية (PDF). <b>آخر مزامنة مع المصدر الرسمي: 12 أكتوبر 2026</b>، مع تحديث النسخ التي عدّلتها الإدارة.',fr:'Documents originaux publiés par la faculté (PDF). <b>Dernière synchro : 12 octobre 2026</b>, avec mise à jour des versions modifiées par l\'administration.',en:'Original documents as issued by the faculty (PDF). <b>Last sync: 12 October 2026</b>, including versions updated by the administration.','zgh':'ⵉⵙⵏⵉⵍⵙⴻⵏ ⴰⵏⴻⵚⵍⵉⵢⴻⵏ ⴰⵎ ⵢⴰⵍ ⵜⵉ ⵜⵡⴰⴹⵃⴻⵏ ⵙ ⵜⵎⴰⴷⴰⵙⵜ (PDF). <b>ⴰⵙⴻⵎⵜⵉ ⴰⵏⴻⴳⴰⵔⵓ: 12 ⴽⵜⵓⴱⴻⵕ 2026</b>, ⵖⴰⵙ ⵍⵇⴻⵎⴰⵜ ⵢⴻⵜⵡⴰⵙⴻⵎⴷⵉⵏ ⵙⴻⴳ ⵜⴷⴰⵎⵙⴰ.','zgh-latn':'Isnilsen aneṣliyen am yal ti ttwaḍḥen s tmaddast (PDF). <b>Asemti aneggaru: 12 Ktubeṛ 2026</b>, ɣas lqemat yettwasemdin seg tdamsa.'},
  'docs.sem':{ar:'السداسي',fr:'Semestre',en:'Semester','zgh':'ⴰⵙⴻⵎⵙⵜⴻⵔ','zgh-latn':'Asemster'},
  'docs.kind':{ar:'النوع',fr:'Type',en:'Type','zgh':'ⴰⵏⴰⵡ','zgh-latn':'Anaw'},
  'docs.all':{ar:'الكل',fr:'Tous',en:'All','zgh':'ⴰⴽ','zgh-latn':'Akk'},
  'docs.kTT':{ar:'استعمالات الزمن',fr:'Emplois du temps',en:'Timetables','zgh':'ⴰⵖⴰⵡⴰⵙⴻⵏ ⵏ ⵡⴰⴽⵓⴷ','zgh-latn':'Aɣawasen n wakud'},
  'docs.kDist':{ar:'توزيع الأفواج',fr:'Répartition des groupes',en:'Group distribution','zgh':'ⴱⴹⵓ ⵏ ⵜⴳⵔⴰⵡⵉⵏ','zgh-latn':'Bḍu n tgrawin'},
  'docs.kLib':{ar:'📚 مكتبة المذاكرة',fr:'📚 Bibliothèque d\'étude',en:'📚 Study library','zgh':'📚 ⵜⴰⵙⵏⴰⵡⵉⵜ ⵏ ⵜⵖⵓⵔⵉ','zgh-latn':'📚 Tasnawit n tɣuri'},
  'docs.kindTT':{ar:'استعمال الزمن',fr:'Emploi du temps',en:'Timetable','zgh':'ⴰⵖⴰⵡⴰⵙ ⵏ ⵡⴰⴽⵓⴷ','zgh-latn':'Aɣawas n wakud'},
  'docs.kindDist':{ar:'توزيع الأفواج',fr:'Répartition',en:'Distribution','zgh':'ⴱⴹⵓ','zgh-latn':'Bḍu'},
  'docs.kindLib':{ar:'📚 مذاكرة',fr:'📚 Étude',en:'📚 Study','zgh':'📚 ⵜⵖⵓⵔⵉ','zgh-latn':'📚 Tɣuri'},
  'docs.kExt':{ar:'روابط رسمية',fr:'Liens officiels',en:'Official links','zgh':'ⵉⵙⵖⵓⵏⴻⵏ ⵉⵎⴰⴷⵓⴷⴻⵏ','zgh-latn':'Isɣunen imadduden'},
  'docs.kindExt':{ar:'رابط رسمي',fr:'Lien officiel',en:'Official link','zgh':'ⴰⵙⵖⵓⵏ ⴰⵎⴰⴷⵓⴷ','zgh-latn':'Asɣun amaddud'},
  'docs.official':{ar:'رابط رسمي ↗',fr:'Lien officiel ↗',en:'Official link ↗','zgh':'ⴰⵙⵖⵓⵏ ⴰⵎⴰⴷⵓⴷ ↗','zgh-latn':'Asɣun amaddud ↗'},
  'docs.updated':{ar:'🔄 محدّث',fr:'🔄 Mis à jour',en:'🔄 Updated','zgh':'🔄 ⵢⴻⵜⵡⴰⵙⴻⵎⵜⵉ','zgh-latn':'🔄 Yettwasemti'},
  'docs.libNote':{ar:'📚 <b>مكتبة المذاكرة</b> — ملخصات ومؤلفات قانونية أُضيفت لمساعدتك على الفهم والتحصيل. هذه الوثائق <b>ليست وثائق رسمية</b> عن الكلية، وهي للاستعمال الشخصي في الدراسة.',fr:'📚 <b>Bibliothèque d\'étude</b> — résumés et ouvrages juridiques pour vous aider à comprendre. Ces documents <b>ne sont pas officiels</b> ; usage personnel.',en:'📚 <b>Study library</b> — summaries and legal works to help you understand. These documents are <b>not official</b>; personal use.','zgh':'📚 <b>ⵜⴰⵙⵏⴰⵡⵉⵜ ⵏ ⵜⵖⵓⵔⵉ</b> — ⵉⴳⵣⵓⵍⴻⵏ ⴷ ⵢⴻⴷⵍⵉⵙⴻⵏ ⵉⵣⵔⴼⴰⵏⴻⵏ ⵉ ⵓⴼⵀⴰⵎ. ⵉⵙⵏⵉⵍⵙⴻⵏ-ⴰ <b>ⵎⴰⵞⵉ ⴷ ⵉⵎⴰⴷⵓⴷⴻⵏ</b>; ⴰⵙⴻⵇⴷⴻⴽ ⴰⵙⵓⴼ.','zgh-latn':'📚 <b>Tasnawit n tɣuri</b> — igzulen d yedlisen izrfanen i ufham. Isnilsen-a <b>mačči d imadduden</b>; aseqdec asuf.'},
  'docs.none':{ar:'لا توجد وثائق.',fr:'Aucun document.',en:'No documents.','zgh':'ⵓⵍⴰⴽ ⵉⵙⵏⵉⵍⵙⴻⵏ.','zgh-latn':'Ulac isnilsen.'},
  'gpa.note':{ar:'أدخل نقطة كل مادة (على 20) ومعاملها لتحصل على المعدل الموزون. الحساب يتم داخل متصفحك ولا يحفظ شيئاً.',fr:'Entrez la note de chaque matière (sur 20) et son coefficient pour obtenir la moyenne pondérée. Le calcul se fait dans votre navigateur, sans rien enregistrer.',en:'Enter each course grade (out of 20) and its coefficient to get the weighted average. Calculated in your browser, nothing saved.','zgh':'ⵙⴻⴽⴻⵎ ⴰⴳⵎⵓⴹ ⵏ ⵢⴰⵍ ⵜⵓⵙⵏⴰ (ⵙⴻⴳ 20) ⴷ ⵓⵎⵙⴰⵡⴰⴹ-ⵉⵙ ⵉ ⵡⴰⴼⵓ ⵏ ⵜⵎⵓⵢⴰⵏⵜ. ⵢⴻⵜⵡⴰⵃⵙⴰⴱ ⴷⴻⴳ ⵉⵎⵉⵏⵉⴳ-ⵉⵏⴻⴽ, ⵓⵍⴰⴽ ⴰⵢⴻⵏ ⵢⴻⵜⵡⴰⵙⴻⴽⵍⵉⵙⴻⵏ.','zgh-latn':'Sekcem agmuḍ n yal tusna (seg 20) d umsawaḍ-is i wafu n tmuyant. Yettwaḥsab deg iminig-inek, ulac ayen yettwaseklisen.'},
  'gpa.course':{ar:'المادة',fr:'Matière',en:'Course','zgh':'ⵜⵓⵙⵏⴰ','zgh-latn':'Tusna'},
  'gpa.grade':{ar:'النقطة /20',fr:'Note /20',en:'Grade /20','zgh':'ⴰⴳⵎⵓⴹ /20','zgh-latn':'Agmuḍ /20'},
  'gpa.coef':{ar:'المعامل',fr:'Coefficient',en:'Coefficient','zgh':'ⴰⵎⵙⴰⵡⴰⴹ','zgh-latn':'Amsawaḍ'},
  'gpa.result':{ar:'المعدل الموزون',fr:'Moyenne pondérée',en:'Weighted average','zgh':'ⵜⴰⵎⵓⵢⴰⵏⵜ ⵜⴻⵜⵡⴰⵥⵏⴻⵏ','zgh-latn':'Tamuyant tettwaẓẓnen'},
  'comments.banner':{ar:'💬 <b>منصة تعاليق الطلبة</b> — التعاليق كتُحفظ فهاد المتصفح/الجهاز فقط، ما كيتشوفهاش ولا كيوصلها حتى حد آخر. ما تكتبش معلومات شخصية حساسة.',fr:'💬 <b>Espace commentaires</b> — vos commentaires restent uniquement sur ce navigateur/appareil ; personne d\'autre ne les voit. N\'écrivez pas d\'informations personnelles sensibles.',en:'💬 <b>Student comments</b> — your comments stay only on this browser/device; nobody else sees them. Do not write sensitive personal information.','zgh':'💬 <b>ⵉⵡⴻⵏⵉⵜⴻⵏ ⵏ ⵢⵉⵏⴻⵍⵎⴰⴷⴻⵏ</b> — ⵉⵡⴻⵏⵉⵜⴻⵏ-ⵉⵏⴻⴽ ⵇⵉⵎⴻⵏ ⴽⴰⵏ ⴷⴻⴳ ⵉⵎⵉⵏⵉⴳ-ⵉⵏⴻⴽ; ⵓⵍⴰⴽ ⵡⵉⵏ-ⵏⵉⴹⴻⵏ ⴰ ⵜⴻⵏ-ⵉⵥⵕⴻⵏ. ⵓⵔ ⴰⵔⵓ ⵜⴰⵍⵖⵓⵜ ⵜⵓⴷⵎⴰⵡⴰⵏⵜ.','zgh-latn':'💬 <b>Iwenniten n yinelmaden</b> — iwenniten-inek qqimen kan deg iminig-inek; ulac win-nniḍen a ten-iẓṛen. Ur aru talɣut tudmawant.'},
  'comments.name':{ar:'الاسم (اختياري)',fr:'Nom (optionnel)',en:'Name (optional)','zgh':'ⵉⵙⴻⵎ (ⵉⵅⵜⵉⵢⴰⵔⵉ)','zgh-latn':'Isem (ixtiyari)'},
  'comments.about':{ar:'حول',fr:'À propos',en:'About','zgh':'ⵖⴻⴼ','zgh-latn':'Ɣef'},
  'comments.text':{ar:'تعليقك',fr:'Votre commentaire',en:'Your comment','zgh':'ⴰⵡⴻⵏⵉ-ⵉⵏⴻⴽ','zgh-latn':'Awenni-inek'},
  'comments.ph':{ar:'شارك ملاحظة، سؤال، أو نصيحة لزملائك…',fr:'Partagez une remarque, une question ou un conseil…',en:'Share a note, question, or tip…','zgh':'ⴱⴹⵓ ⵜⴰⵎⴰⵜⴰⵔⵜ, ⴰⵙⵜⴻⵇⵙⵉ ⵏⴻⵖ ⴰⵡⴰⵍⵉ…','zgh-latn':'Bḍu tamatart, asteqsi neɣ awali…'},
  'comments.post':{ar:'➕ نشر التعليق',fr:'➕ Publier',en:'➕ Post','zgh':'➕ ⴰⵔⵉ','zgh-latn':'➕ Ari'},
  'comments.clear':{ar:'🗑️ مسح تعاليقي',fr:'🗑️ Effacer mes commentaires',en:'🗑️ Clear my comments','zgh':'🗑️ ⵙⴼⴻⴹ ⵉⵡⴻⵏⵉⵜⴻⵏ-ⵉⵏⴻⴽ','zgh-latn':'🗑️ Sfeḍ iwenniten-inek'},
  'comments.anon':{ar:'طالب مجهول',fr:'Étudiant anonyme',en:'Anonymous student','zgh':'ⴰⵏⴻⵍⵎⴰⴷ ⵡⴰⵔ ⵉⵙⴻⵎ','zgh-latn':'Anelmad war isem'},
  'comments.count':{ar:'تعليق',fr:'commentaire(s)',en:'comment(s)','zgh':'ⵉⵡⴻⵏⵉⵜⴻⵏ','zgh-latn':'iwenniten'},
  'comments.last':{ar:'آخر تعليق:',fr:'Dernier :',en:'Latest:','zgh':'ⴰⵏⴻⴳⴰⵔⵓ:','zgh-latn':'Aneggaru:'},
  'comments.empty':{ar:'مازال ما كاين حتى تعليق. كون أول واحد 💬',fr:'Aucun commentaire encore. Soyez le premier 💬',en:'No comments yet. Be the first 💬','zgh':'ⵓⵍⴰⴽ ⵉⵡⴻⵏⵉⵜⴻⵏ ⵢⴰⴽⴰⵏ. ⴻⵔ ⴷ ⴰⵎⴻⵣⵡⴰⵔⵓ 💬','zgh-latn':'Ulac iwenniten yakan. Err d amezwaru 💬'},
  'comments.confirmDel':{ar:'متأكد من حذف هاد التعليق؟',fr:'Supprimer ce commentaire ?',en:'Delete this comment?','zgh':'ⴽⴻⵙ ⴰⵡⴻⵏⵉ-ⴰ?','zgh-latn':'Kkes awenni-a?'},
  'comments.confirmClr':{ar:'تأكيد مسح جميع تعاليقك من هذا المتصفح؟',fr:'Effacer tous vos commentaires de ce navigateur ?',en:'Clear all your comments from this browser?','zgh':'ⵙⴼⴻⴹ ⴰⴽ ⵉⵡⴻⵏⵉⵜⴻⵏ-ⵉⵏⴻⴽ ⵙⴻⴳ ⵉⵎⵉⵏⵉⴳ-ⴰ?','zgh-latn':'Sfeḍ akk iwenniten-inek seg iminig-a?'},
  'comments.topics':{ar:'عام|البحث عن فوجي|استعمال الزمن|الأساتذة|القاعات|توزيع الأفواج|الوثائق|حاسبة المعدل',fr:'Général|Chercher mon groupe|Emploi du temps|Professeurs|Salles|Répartition|Documents|Moyenne',en:'General|Find my group|Timetable|Professors|Rooms|Distribution|Documents|GPA','zgh':'ⴰⵎⴰⵜⴰ|ⴰⴼ ⵜⴰⴳⵔⴰⵡⵜ-ⵉⵏⵓ|ⴰⵖⴰⵡⴰⵙ ⵏ ⵡⴰⴽⵓⴷ|ⵉⵙⴻⵍⵎⴰⴷⴻⵏ|ⵜⵉⵅⴰⵎⵉⵏ|ⴱⴹⵓ|ⵉⵙⵏⵉⵍⵙⴻⵏ|GPA','zgh-latn':'Amata|Af tagrawt-inu|Aɣawas n wakud|Iselmaden|Tixxamin|Bḍu|Isnilsen|GPA'},
  'smart.title':{ar:'🧠 المساعد الذكي — بطاقتك الشاملة',fr:'🧠 Assistant intelligent — votre fiche complète',en:'🧠 Smart assistant — your full card','zgh':'🧠 ⴰⵎⴰⵡⴰⵙ ⴰⵎⵓⵙⵏⴰⵏ — ⵜⴽⴰⵔⴹⴰ-ⵉⵏⴻⴽ ⵜⵓⵎⵉⴷⵜ','zgh-latn':'🧠 Amawas amussnan — tkarḍa-inek tummidt'},
  'smart.lead':{ar:'كتب اللقب العائلي (أو اختر الفوج) → نخرّج ليك بطاقة ذكية فيها المواد والأساتذة والتوقيت والقاعات، من السداسي والفوج والشعبة بالضبط.',fr:'Saisissez votre nom (ou choisissez un groupe) → une fiche intelligente avec matières, professeurs, horaires et salles, selon le semestre, le groupe et la filière.',en:'Type your surname (or pick a group) → a smart card with courses, professors, times and rooms, exactly per semester, group and track.','zgh':'ⴰⵔⵓ ⵉⵙⵎ ⵏ ⵜⵡⴰⴽⵓⵍⵜ-ⵉⵏⴻⴽ (ⵏⴻⵖ ⴼⵔⴻⵏ ⵜⴰⴳⵔⴰⵡⵜ) → ⵜⴽⴰⵔⴹⴰ ⵜⵓⵙⵏⴰⵏⵜ ⵙ ⵜⵓⵙⵏⵉⵡⵉⵏ, ⵉⵙⴻⵍⵎⴰⴷⴻⵏ, ⵉⵙⵔⴰⴳⴻⵏ ⴷ ⵜⵉⵅⴰⵎⵉⵏ, ⵖⴻⴼ ⵓⵙⴻⵎⵙⵜⴻⵔ, ⵜⴰⴳⵔⴰⵡⵜ ⴷ ⵓⴱⵔⵉⴷ.','zgh-latn':'Aru ism n twacult-inek (neɣ fren tagrawt) → tkarḍa tussnant s tusniwin, iselmaden, isragen d tixxamin, ɣef usemster, tagrawt d ubrid.'},
  'smart.ph':{ar:'اللقب العائلي (Ex : CHRAIM)',fr:'Nom de famille (Ex : CHRAIM)',en:'Surname (Ex: CHRAIM)','zgh':'ⵉⵙⵎ ⵏ ⵜⵡⴰⴽⵓⵍⵜ (ⴰⵎⴻⴷⵢⴰ: CHRAIM)','zgh-latn':'Ism n twacult (amedya: CHRAIM)'},
  'smart.group':{ar:'أو الفوج',fr:'ou groupe',en:'or group','zgh':'ⵏⴻⵖ ⵜⴰⴳⵔⴰⵡⵜ','zgh-latn':'neɣ tagrawt'},
  'smart.go':{ar:'🧠 استخرج بطاقتي',fr:'🧠 Générer ma fiche',en:'🧠 Generate my card','zgh':'🧠 ⵙⵏⵓⵍⴼⵓ ⵜⴽⴰⵔⴹⴰ-ⵉⵏⵓ','zgh-latn':'🧠 Snulfu tkarḍa-inu'},
  'smart.track':{ar:'المسلك',fr:'Filière',en:'Track','zgh':'ⴰⴱⵔⵉⴷ','zgh-latn':'Abrid'},
  'smart.sem':{ar:'السداسي',fr:'Semestre',en:'Semester','zgh':'ⴰⵙⴻⵎⵙⵜⴻⵔ','zgh-latn':'Asemster'},
  'smart.subjects':{ar:'المواد والأساتذة',fr:'Matières & professeurs',en:'Courses & professors','zgh':'ⵜⵓⵙⵏⵉⵡⵉⵏ ⴷ ⵢⵉⵙⴻⵍⵎⴰⴷⴻⵏ','zgh-latn':'Tusniwin d yiselmaden'},
  'smart.week':{ar:'التوقيت الأسبوعي الدقيق',fr:'Emploi du temps hebdomadaire',en:'Exact weekly timetable','zgh':'ⴰⵖⴰⵡⴰⵙ ⵏ ⵡⴰⴽⵓⴷ ⵏ ⵉⵎⴰⵍⴰⵙ','zgh-latn':'Aɣawas n wakud n imalas'},
  'smart.rooms':{ar:'القاعات',fr:'Salles',en:'Rooms','zgh':'ⵜⵉⵅⴰⵎⵉⵏ','zgh-latn':'Tixxamin'},
  'smart.hours':{ar:'ساعة أسبوعياً',fr:'h/semaine',en:'h/week','zgh':'ⵙⴰⵄⴰⵜ / ⵉⵎⴰⵍⴰⵙ','zgh-latn':'saɛat / imalas'},
  'smart.noTrack':{ar:'لا توجد بيانات منشورة لهذا السداسي بهذه اللغة.',fr:'Aucune donnée publiée pour ce semestre dans cette langue.',en:'No published data for this semester in this language.','zgh':'ⵓⵍⴰⴽ ⵉⵙⴻⴼⴽⴰ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ ⵉ ⵓⵙⴻⵎⵙⵜⴻⵔ-ⴰ ⴷⴻⴳ ⵜⵓⵜⵍⴰⵢⵜ-ⴰ.','zgh-latn':'Ulac isefka yettwaskanen i usemster-a deg tutlayt-a.'},
  'gpa.g1':{ar:'ممتاز',fr:'Excellent',en:'Excellent','zgh':'ⵉⴳⴻⵔⴻⵣ','zgh-latn':'Igerrez'},
  'gpa.g2':{ar:'حسن جداً',fr:'Très bien',en:'Very good','zgh':'ⵢⴻⵍⵀⴰ ⴰⵟⴰⵙ','zgh-latn':'Yelha aṭas'},
  'gpa.g3':{ar:'حسن',fr:'Bien',en:'Good','zgh':'ⵢⴻⵍⵀⴰ','zgh-latn':'Yelha'},
  'gpa.g4':{ar:'مستحسن',fr:'Passable',en:'Pass','zgh':'ⵢⴻⵄⴷⴰ','zgh-latn':'Yeɛda'},
  'gpa.g5':{ar:'غير كافٍ',fr:'Insuffisant',en:'Insufficient','zgh':'ⵉⴷⵔⵓⵙ','zgh-latn':'Idrus'},
  'about.st1':{ar:'مسلك ومسار',fr:'filières & parcours',en:'tracks & paths','zgh':'ⵉⴱⵔⴷⴰⵏ','zgh-latn':'ibrdan'},
  'about.st2':{ar:'حصة منظمة',fr:'séances organisées',en:'organised sessions','zgh':'ⵜⵉⵖⵔⵉⵡⵉⵏ ⵢⴻⵜⵓⵙⵓⴷⵙⴻⵏ','zgh-latn':'tiɣriwin yettusuddsen'},
  'about.st3':{ar:'وثيقة رسمية PDF',fr:'documents PDF',en:'PDF documents','zgh':'ⵉⵙⵏⵉⵍⵙⴻⵏ PDF','zgh-latn':'isnilsen PDF'},
  'about.st4':{ar:'سداسيات S1·S3·S5',fr:'semestres S1·S3·S5',en:'semesters S1·S3·S5','zgh':'ⵉⵙⴻⵎⵙⵜⴻⵔⵢⴻⵏ S1·S3·S5','zgh-latn':'isemsteryen S1·S3·S5'},
  'about.proj1':{ar:'دليل الطالب: تحديد الفوج من اللقب، استعمالات الزمن، الأساتذة والقاعات، الوثائق الرسمية وحاسبة المعدل.',fr:'Guide étudiant : trouver son groupe par le nom, emplois du temps, professeurs et salles, documents officiels et calculateur de moyenne.',en:'Student guide: find your group by surname, timetables, professors and rooms, official documents and GPA calculator.','zgh':'ⴰⵎⴰⵏⴰⵔ ⵏ ⵓⵏⴻⵍⵎⴰⴷ: ⴰⴼ ⵜⴰⴳⵔⴰⵡⵜ-ⵉⵏⴻⴽ ⵙ ⵢⵉⵙⵎ ⵏ ⵜⵡⴰⴽⵓⵍⵜ, ⵉⵖⴰⵡⴰⵙⴻⵏ ⵏ ⵡⴰⴽⵓⴷ, ⵉⵙⴻⵍⵎⴰⴷⴻⵏ ⴷ ⵜⵉⵅⴰⵎⵉⵏ, ⵉⵙⵏⵉⵍⵙⴻⵏ ⵉⵎⴰⴷⵓⴷⴻⵏ ⴷ ⵓⵙⵉⴹⴻⵏ ⵏ ⵜⵎⵓⵢⴰⵏⵜ.','zgh-latn':'Amanar n unelmad: af tagrawt-inek s yism n twacult, iɣawasen n wakud, iselmaden d tixxamin, isnilsen imadduden d usiḍen n tmuyant.'},
  'about.proj2':{ar:'مبادرة رقمية موازية على إنستغرام (@riqqa.ma) لمحتوى طلابي ومعرفي.',fr:'Initiative numérique sur Instagram (@riqqa.ma) : contenu étudiant et pédagogique.',en:'Digital initiative on Instagram (@riqqa.ma) with student and educational content.','zgh':'ⵜⵓⴷⴰⵔⵜ ⵜⴰⴷⵉⵊⵉⵜⴰⵍⵜ ⵖⴻⴼ Instagram (@riqqa.ma) ⵙ ⵓⴳⴱⵓⵔ ⴰⵏⴻⵍⵎⴰⴷ ⴷ ⵓⵙⴳⵎⵉ.','zgh-latn':'Tudart tadijitalt ɣef Instagram (@riqqa.ma) s ugbur anelmad d usgmi.'},
  'about.proj3':{ar:'كتابة قانونية وأدبية وفلسفية، ونشر للوعي القانوني على المنصات الاجتماعية.',fr:'Écriture juridique, littéraire et philosophique ; diffusion de la conscience juridique sur les réseaux.',en:'Legal, literary and philosophical writing; promoting legal awareness on social platforms.','zgh':'ⵜⵉⵔⴰ ⵜⴰⵣⵔⴼⴰⵏ, ⵜⴰⴷⵍⵉⵙⴰⵏⵜ ⴷ ⵜⴰⴼⴻⵍⵙⴰⴼⵜ; ⴰⵙⵏⴻⵔⵏⵉ ⵏ ⵜⵎⵓⵙⵏⵉ ⵜⴰⵣⵔⴼⴰⵏ ⴷⴻⴳ ⵢⵉⵥⴻⵟⴰ ⵉⵎⴻⵜⵉ.','zgh-latn':'Tira tazrfan, tadlisant d tafelsaft; asnerni n tmusni tazrfan deg yiẓeṭṭa imetti.'},
  'about.body':{ar:'طالب في كلية العلوم القانونية والسياسية بأكادير، جامعة ابن زهر، تخصص القانون الخاص باللغة العربية. يجمع بين شغف القانون والكتابة والتقنية، ويطوّر CHRVVIM كمبادرة رقمية تضع المعلومة الجامعية الصحيحة في متناول كل طالب في مكان واحد.',fr:'Étudiant à la Faculté des sciences juridiques et politiques d\'Agadir (Université Ibn Zohr), spécialité droit privé en arabe. Allie passion du droit, de l\'écriture et de la tech, et développe CHRVVIM pour mettre l\'information universitaire à la portée de chaque étudiant.',en:'Student at the Faculty of Law and Political Science in Agadir (Ibn Zohr University), private law (Arabic). Combines a passion for law, writing and tech, building CHRVVIM to put reliable university information within every student\'s reach.','zgh':'ⴰⵏⴻⵍⵎⴰⴷ ⴷⴻⴳ ⵜⵙⴳⴰ ⵏ ⵓⵣⵔⴻⴼ ⴷ ⵜⵙⵔⵜⴰⵏⵜ ⴷⴻⴳ ⴰⴳⴰⴹⵉⵔ (ⵜⴰⵙⴷⴰⵡⵉⵜ Ibn Zohr), ⴰⵣⵔⴻⴼ ⴰⵙⵓⴼ (ⵙ ⵜⵄⵔⴰⴱⵜ). ⵢⴻⵎⵓⵏ ⵜⴰⵢⵔⵉ ⵏ ⵓⵣⵔⴻⴼ, ⵜⵉⵔⴰ ⴷ ⵜⴻⵜⵉⴽⵏⵓⵍⵓⵊⵉⵜ, ⵢⴻⴱⵏⴰ CHRVVIM ⵉ ⵓⵙⴻⵔⵙ ⵏ ⵜⴰⵍⵖⵓⵜ ⵜⴰⵣⵔⴼⴰⵏ ⵢⴻⵜⵡⴰⵎⴰⵏⴻⵏ ⵖⴻⵔ ⵢⴰⵍ ⴰⵏⴻⵍⵎⴰⴷ.','zgh-latn':'Anelmad deg tsga n uzref d tsrtant deg Agaḍir (Tasdawit Ibn Zohr), azref asuf (s tɛrabt). Yemmun tayri n uzref, tira d tetiknulujit, yebna CHRVVIM i users n talɣut tazrfan yettwamanen ɣer yal anelmad.'},
  'about.mission':{ar:'المعلومة الجامعية أقرب، والمسار أوضح',fr:'L\'information universitaire plus proche, le parcours plus clair',en:'University info closer, your path clearer','zgh':'ⵜⴰⵍⵖⵓⵜ ⵜⴰⵣⵔⴼⴰⵏ ⴰⵇⵔⵉⴱ, ⴰⴱⵔⵉⴷ-ⵉⵏⴻⴽ ⵉⴼⵚⴰⵃ','zgh-latn':'Talɣut tazrfan aqrib, abrid-inek ifṣaḥ'},
  'about.mission2':{ar:'مساحة طلابية تجمع الجداول والأفواج والإعلانات والموارد، مع احترام دقة المعلومات وبيان ما يحتاج منها إلى تحقق رسمي.',fr:'Un espace étudiant qui réunit emplois du temps, groupes, annonces et ressources, en respectant l\'exactitude et en signalant ce qui nécessite une vérification officielle.',en:'A student space gathering timetables, groups, announcements and resources, respecting accuracy and flagging what needs official verification.','zgh':'ⴰⴷⵖⴰⵔ ⵏ ⵢⵉⵏⴻⵍⵎⴰⴷⴻⵏ ⵢⴻⵙⴷⵓⴽⵍⴻⵏ ⵉⵖⴰⵡⴰⵙⴻⵏ ⵏ ⵡⴰⴽⵓⴷ, ⵜⵉⴳⵔⴰⵡⵉⵏ, ⵉⵙⴰⵍⴻⵏ ⴷ ⵢⵉⵖⴱⵓⵍⴰ, ⵙ ⵡⴰⵎⴰⵍ ⵏ ⵡⴰⵢⴻⵏ ⵢⴻⵃⵡⴰⵊ ⴰⵙⴻⵏⵜⴻⵎ ⴰⵎⴰⴷⵓⴷ.','zgh-latn':'Adɣar n yinelmaden yesdukklen iɣawasen n wakud, tigrawin, isallen d yiɣbula, s wammal n wayen yeḥwaj asentem amaddud.'},
  'src.note':{ar:'⚠️ نسخة منقولة هنا للتوضيح وتظل غير رسمية. المصدر الرسمي المعتمد:',fr:'⚠️ Copie reprise ici à titre indicatif, non officielle. Source officielle :',en:'⚠️ Copy shown here for reference, unofficial. Official source:','zgh':'⚠️ ⴰⴹⵔⵉⵙ ⵢⴻⵜⵡⴰⵙⴽⴰⵏ ⴷⴰ ⵉ ⵓⵙⴻⵏⵜⴻⵎ, ⵡⴰⵔ ⵓⵏⵚⵉⴱ. ⴰⵖⴱⴰⵍⵓ ⴰⵎⴰⴷⵓⴷ:','zgh-latn':'⚠️ Aḍris yettwaskan da i usentem, war unṣib. Aɣbalu amaddud:'},
  'src.link':{ar:'الإعلان الرسمي المنشور بموقع الكلية',fr:'l\'annonce officielle publiée sur le site',en:'the official announcement on the faculty site','zgh':'ⴰⵙⴰⵍⵉ ⴰⵎⴰⴷⵓⴷ ⵖⴻⴼ ⵓⵙⵎⴻⵍ ⵏ ⵜⵙⴳⴰ','zgh-latn':'asali amaddud ɣef usmel n tsga'},
  'src.tail':{ar:'. عند أي اختلاف أو تعارض، الوثيقة واللائحة الرسميتان هما المرجع الوحيد.',fr:'. En cas de divergence, le document et la liste officiels sont la seule référence.',en:'. In case of divergence, the official document and list are the only reference.','zgh':'. ⵎⴰ ⵢⴻⵍⴰ ⴰⵎⵅⴰⵍⴰⴼ, ⴰⵙⵏⵉⵍⵙ ⴰⵎⴰⴷⵓⴷ ⴷ ⵜⴰⴱⴷⴰⵔⵜ ⴷ ⵓⵖⴱⴰⵍⵓ ⵏ ⵓⵏⵓ.','zgh-latn':'. Ma yella amxallaf, asnils amaddud d tabdart d uɣbalu n unu.'},
  'gate.title':{ar:'باش تكمل البحث',fr:'Pour continuer la recherche',en:'To continue searching','zgh':'ⵉ ⵓⴽⴻⵎⴻⵍ ⵏ ⵓⵏⴰⴷⵉ','zgh-latn':'I ukemmel n unadi'},
  'gate.desc':{ar:'تابع الحسابات التالية على إنستغرام (كتفتح فتبويب جديد)، وبعدها غادي يتحل ليك البحث بلا حدود.',fr:'Suivez les comptes ci-dessous sur Instagram (nouvel onglet), puis la recherche sera illimitée.',en:'Follow the accounts below on Instagram (opens a new tab), then search becomes unlimited.','zgh':'ⴹⴼⴻⵔ ⵉⵎⵉⴹⴰⵏⴻⵏ-ⴰⴳⵉ ⵖⴻⴼ Instagram (ⵢⴻⵍⴷⵉ ⵜⴰⴼⵓⵕⵜ ⵜⴰⵎⴰⵢⵏⵓⵜ), ⵙⵉⵏⴰ ⴰⵏⴰⴷⵉ ⴰ ⴷ-ⵢⵉⵍⵉ ⵡⴰⵔ ⵜⴰⵍⴰⵙⵜ.','zgh-latn':'Ḍfer imiḍanen-agi ɣef Instagram (yeldi tafuṛt tamaynut), sinna anadi a d-yili war talast.'},
  'gate.follow':{ar:'تابع على إنستغرام',fr:'Suivre sur Instagram',en:'Follow on Instagram','zgh':'ⴹⴼⴻⵔ ⵖⴻⴼ Instagram','zgh-latn':'Ḍfer ɣef Instagram'},
  'gate.checking':{ar:'تأكد من المتابعة…',fr:'Confirmez le suivi…',en:'Confirming follow…','zgh':'ⴰⵙⴻⵏⵜⴻⵎ ⵏ ⵓⴹⴼⴰⵔ…','zgh-latn':'Asentem n uḍfar…'},
  'gate.ok':{ar:'أكمل البحث',fr:'Continuer',en:'Continue','zgh':'ⴽⴻⵎⴻⵍ','zgh-latn':'Kemmel'},
  'gate.later':{ar:'لاحقاً',fr:'Plus tard',en:'Later','zgh':'ⴷⴻⴼⵉⵔ','zgh-latn':'Deffir'},
  'gate.done':{ar:'تم',fr:'Fait',en:'Done','zgh':'ⵢⴻⴼⵔⴰ','zgh-latn':'Yefra'},
  'about.founder':{ar:'محمد شرايم',fr:'Mohamed Chraim',en:'Mohamed Chraim','zgh':'Mohamed Chraim','zgh-latn':'Mohamed Chraim'},
  'about.role':{ar:'طالب قانون · باحث قانوني · كاتب · مطوّر منصة طلابية',fr:'Étudiant en droit · chercheur · auteur · développeur de plateforme',en:'Law student · legal researcher · writer · platform developer','zgh':'ⴰⵏⴻⵍⵎⴰⴷ ⵏ ⵓⵣⵔⴻⴼ · ⴰⵏⴰⴷⵉ ⴰⵣⵔⴼⴰⵏ · ⴰⵎⴰⵔⵓ · ⴰⵎⵙⵏⵓⵍⴼⵓ ⵏ ⵓⵙⵎⴻⵍ','zgh-latn':'Anelmad n uzref · anadi azrfan · amaru · amsnulfu n usmel'},
  'about.lead':{ar:'أؤمن بأن الوصول إلى المعلومة الأكاديمية الواضحة يساعد الطالب على تنظيم مساره الجامعي، وبأن المعرفة القانونية تبدأ بالبحث الدقيق والتفكير النقدي.',fr:'Je crois qu\'un accès clair à l\'information académique aide l\'étudiant à organiser son parcours, et que la connaissance juridique commence par la recherche précise.',en:'I believe clear access to academic information helps students organise their path, and that legal knowledge starts with precise research.','zgh':'ⵜⵖⵉⵍⴻⵖ ⴱⴻⵍⵉ ⵓⵏⴻⴽⵓⵎ ⵉⴼⵚⴰⵃ ⵖⴻⵔ ⵜⴰⵍⵖⵓⵜ ⵜⴰⵣⵔⴼⴰⵏ ⵢⴻⵜⵄⴰⵡⴰⵏ ⵉⵏⴻⵍⵎⴰⴷⴻⵏ ⴷⴻⴳ ⵓⵙⵓⴷⴻⵙ ⵏ ⵓⴱⵔⵉⴷ-ⵏⵙⴻⵏ, ⴷⴰⵖⴻⵏ ⵜⴰⵎⵓⵙⵏⵉ ⵜⴰⵣⵔⴼⴰⵏ ⵜⴻⵜⴻⵔ ⵙⴻⴳ ⵓⵏⴰⴷⵉ ⵓⵏⵚⵉⴱ.','zgh-latn':'Ttɣileɣ belli unekcum ifṣaḥ ɣer talɣut tazrfan yettɛawan inelmaden deg usuddes n ubrid-nsen, daɣen tamusni tazrfan tetter seg unadi unṣib.'},
  'about.sec.about':{ar:'نبذة',fr:'À propos',en:'About','zgh':'ⵅⴼ-ⵉ','zgh-latn':'Xf-i'},
  'about.sec.path':{ar:'المسار الأكاديمي',fr:'Parcours académique',en:'Academic path','zgh':'ⴰⴱⵔⵉⴷ ⵏ ⵜⵖⵓⵔⵉ','zgh-latn':'Abrid n tɣuri'},
  'about.sec.proj':{ar:'المشاريع',fr:'Projets',en:'Projects','zgh':'ⵉⵙⴻⵏⴼⴰⵔ','zgh-latn':'Isenfar'},
  'about.sec.interests':{ar:'اهتمامات البحث',fr:'Centres d\'intérêt',en:'Research interests','zgh':'ⵉⵙⴻⵏⵜⴰⵍ ⵏ ⵓⵏⴰⴷⵉ','zgh-latn':'Isental n unadi'},
  'about.sec.contact':{ar:'تواصل معي',fr:'Contact',en:'Contact','zgh':'ⴰⵏⴻⵔⵎⴻⵙ','zgh-latn':'Anermes'},
  'learn.title':{ar:'✍️ ورشة التعلّم',fr:'✍️ Espace d\'apprentissage',en:'✍️ Learning Workspace','zgh':'✍️ ⴰⴷⵖⴰⵔ ⵏ ⵜⵖⵓⵔⵉ','zgh-latn':'✍️ Adɣar n tɣuri'},
  'learn.lead':{ar:'حط نص الدرس هنا (يمكن تنسخو من PDF أو الكتاب) → نحولو لملخص ذكي، كويزات، بطاقات، وخطة مراجعة. كل شيء يشتغل محليًا بدون إنترنت.',fr:'Collez le texte du cours ici → résumé, quiz, flashcards et plan de révision. Fonctionne entièrement en local.',en:'Paste your lesson text here → get a smart summary, quizzes, flashcards and a revision plan. Works fully offline.','zgh':'ⵙⴻⵏⵟⴻⴹ ⴰⴹⵔⵉⵙ ⵏ ⵜⵖⵓⵔⵉ-ⵉⵏⴻⴽ ⴷⴰ → ⵜⴰⴼⴻⴹ ⴰⴳⵣⵓⵍ ⴰⵎⵓⵙⵏⴰⵏ, ⵜⵉⵇⵣⵉⵢⵉⵏ, ⵜⵉⴽⴰⵔⴷⴰ ⵏ ⵓⵙⵎⴻⴽⵜⵉ ⴷ ⵓⵖⴰⵡⴰⵙ ⵏ ⵓⵙⴻⵎⵜⵉ. ⵢⴻⵜⴻⴷⵓ ⵉⵎⴰⵏ-ⵉⵙ.','zgh-latn':'Senṭeḍ aḍris n tɣuri-inek da → tafeḍ agzul amussnan, tiqziyin, tikarda n usmekti d uɣawas n usemti. Yetteddu iman-is.'},
  'learn.ph':{ar:'الصق نص الدرس هنا...',fr:'Collez le texte du cours ici...',en:'Paste lesson text here...','zgh':'ⵙⴻⵏⵟⴻⴹ ⴰⴹⵔⵉⵙ ⵏ ⵜⵖⵓⵔⵉ ⴷⴰ...','zgh-latn':'Senṭeḍ aḍris n tɣuri da...'},
  'learn.load':{ar:'📄 حط مثال',fr:'📄 Exemple',en:'📄 Load example','zgh':'📄 ⵙⴰⵍⵉ ⴰⵎⴻⴷⵢⴰ','zgh-latn':'📄 Sali amedya'},
  'learn.clear':{ar:'🗑️ مسح',fr:'🗑️ Effacer',en:'🗑️ Clear','zgh':'🗑️ ⵙⴼⴻⴹ','zgh-latn':'🗑️ Sfeḍ'},
  'learn.generate':{ar:'⚡ توليد',fr:'⚡ Générer',en:'⚡ Generate','zgh':'⚡ ⵙⵏⵓⵍⴼⵓ','zgh-latn':'⚡ Snulfu'},
  'learn.tab.sum':{ar:'ملخص',fr:'Résumé',en:'Summary','zgh':'ⴰⴳⵣⵓⵍ','zgh-latn':'Agzul'},
  'learn.tab.quiz':{ar:'كويز',fr:'Quiz',en:'Quiz','zgh':'ⵜⵉⵇⵣⵉⵢⵉⵏ','zgh-latn':'Tiqziyin'},
  'learn.tab.flash':{ar:'بطاقات',fr:'Flashcards',en:'Flashcards','zgh':'ⵜⵉⴽⴰⵔⴷⴰ ⵏ ⵓⵙⵎⴻⴽⵜⵉ','zgh-latn':'Tikarda n usmekti'},
  'learn.tab.plan':{ar:'خطة مراجعة',fr:'Plan de révision',en:'Revision Plan','zgh':'ⴰⵖⴰⵡⴰⵙ ⵏ ⵓⵙⴻⵎⵜⵉ','zgh-latn':'Aɣawas n usemti'},
  'learn.tab.check':{ar:'قائمة مراجعة',fr:'Checklist',en:'Checklist','zgh':'ⵜⴰⴱⴷⴰⵔⵜ ⵏ ⵓⵙⴻⵏⵇⴻⴷ','zgh-latn':'Tabdart n usenqed'},
  'learn.sum.head':{ar:'ملخص منسّق',fr:'Résumé structuré',en:'Structured summary','zgh':'ⴰⴳⵣⵓⵍ ⵢⴻⵜⵓⵙⵓⴷⵙⴻⵏ','zgh-latn':'Agzul yettusuddsen'},
  'learn.sum.key':{ar:'المفاهيم الرئيسية',fr:'Concepts clés',en:'Key concepts','zgh':'ⵜⵉⴽⵜⵉⵡⵉⵏ ⵜⵉⴳⴻⵊⴷⴰⵏⵉⵏ','zgh-latn':'Tiktiwin tigejdanin'},
  'learn.sum.def':{ar:'تعريفات',fr:'Définitions',en:'Definitions','zgh':'ⵜⵉⵙⵏⵉⵍⴰⴼ','zgh-latn':'Tisnilaf'},
  'learn.sum.pts':{ar:'نقاط مهمة',fr:'Points importants',en:'Key points','zgh':'ⵉⵙⴻⵏⵜⴰⵍ ⵉⴳⴻⵊⴷⴰⵏⴻⵏ','zgh-latn':'Isental igejdanen'},
  'learn.quiz.qcount':{ar:'عدد الأسئلة',fr:'Nb questions',en:'Questions','zgh':'ⵉⵙⵜⴻⵇⵙⵉⵢⴻⵏ','zgh-latn':'Isteqsiyen'},
  'learn.quiz.diff':{ar:'الصعوبة',fr:'Difficulté',en:'Difficulty','zgh':'ⵜⵉⵡⵇⴻⵔⵜ','zgh-latn':'Tiwqert'},
  'learn.quiz.easy':{ar:'سهل',fr:'Facile',en:'Easy','zgh':'ⴼⴻⵙⵓⵙ','zgh-latn':'Fessus'},
  'learn.quiz.med':{ar:'متوسط',fr:'Moyen',en:'Medium','zgh':'ⴰⵍⴻⵎⴰⵙ','zgh-latn':'Alemmas'},
  'learn.quiz.hard':{ar:'صعب',fr:'Difficile',en:'Hard','zgh':'ⵢⵓⵇⴻⵔ','zgh-latn':'Yuqer'},
  'learn.quiz.start':{ar:'▶️ ابدأ الكويز',fr:'▶️ Démarrer',en:'▶️ Start quiz','zgh':'▶️ ⴱⴷⵓ ⵜⵉⵇⵣⵉⵢⵉⵏ','zgh-latn':'▶️ Bdu tiqziyin'},
  'learn.quiz.restart':{ar:'🔄 إعادة',fr:'🔄 Recommencer',en:'🔄 Restart','zgh':'🔄 ⵄⴰⵡⴻⴷ','zgh-latn':'🔄 Ɛawed'},
  'learn.quiz.score':{ar:'النتيجة',fr:'Score',en:'Score','zgh':'ⴰⴳⵎⵓⴹ','zgh-latn':'Agmuḍ'},
  'learn.quiz.correct':{ar:'صحيح',fr:'Correct',en:'Correct','zgh':'ⵉⵚⴻⵃⴰ','zgh-latn':'Iṣeḥḥa'},
  'learn.quiz.wrong':{ar:'خطأ',fr:'Erroné',en:'Wrong','zgh':'ⵢⴻⵅⴹⴰ','zgh-latn':'Yexḍa'},
  'learn.quiz.explain':{ar:'التفسير',fr:'Explication',en:'Explanation','zgh':'ⴰⵙⴻⴳⵣⵉ','zgh-latn':'Assegzi'},
  'learn.quiz.next':{ar:'التالي →',fr:'Suivant →',en:'Next →','zgh':'ⵡⵉⵏⴻⴹⵏⵉ →','zgh-latn':'Wineḍni →'},
  'learn.quiz.check':{ar:'تحقق',fr:'Vérifier',en:'Check','zgh':'ⵙⴻⵏⵇⴻⴷ','zgh-latn':'Senqed'},
  'learn.flash.prev':{ar:'← السابق',fr:'← Précédent',en:'← Prev','zgh':'← ⵢⴻⵣⵔⵉⵏ','zgh-latn':'← Yezrin'},
  'learn.flash.next':{ar:'التالي →',fr:'Suivant →',en:'Next →','zgh':'ⵡⵉⵏⴻⴹⵏⵉ →','zgh-latn':'Wineḍni →'},
  'learn.flash.flip':{ar:'انقر لتقليب البطاقة',fr:'Cliquer pour retourner',en:'Click to flip','zgh':'ⵙⵉⵜ ⵖⴻⴼ ⵜⴽⴰⵔⴹⴰ','zgh-latn':'Sit ɣef tkarḍa'},
  'learn.flash.front':{ar:'السؤال',fr:'Question',en:'Question','zgh':'ⴰⵙⵜⴻⵇⵙⵉ','zgh-latn':'Asteqsi'},
  'learn.flash.back':{ar:'الجواب',fr:'Réponse',en:'Answer','zgh':'ⵜⵉⵔⵉⵔⵉⵜ','zgh-latn':'Tiririt'},
  'learn.plan.title':{ar:'خطة مراجعة مقترحة',fr:'Plan de révision proposé',en:'Suggested revision plan','zgh':'ⴰⵖⴰⵡⴰⵙ ⵏ ⵓⵙⴻⵎⵜⵉ ⵢⴻⵜⵡⴰⵙⵓⵎⵔⴻⵏ','zgh-latn':'Aɣawas n usemti yettwasumren'},
  'learn.plan.day':{ar:'اليوم',fr:'Jour',en:'Day','zgh':'ⴰⵙ','zgh-latn':'Ass'},
  'learn.plan.focus':{ar:'التركيز',fr:'Focus',en:'Focus','zgh':'ⴰⵙⴻⵏⵜⴻⵍ','zgh-latn':'Asentel'},
  'learn.plan.tasks':{ar:'المهام',fr:'Tâches',en:'Tasks','zgh':'ⵜⵉⵡⵓⵔⵉⵡⵉⵏ','zgh-latn':'Tiwuriwin'},
  'learn.check.title':{ar:'قائمة المراجعة',fr:'Liste de révision',en:'Revision checklist','zgh':'ⵜⴰⴱⴷⴰⵔⵜ ⵏ ⵓⵙⴻⵏⵇⴻⴷ ⵏ ⵓⵙⴻⵎⵜⵉ','zgh-latn':'Tabdart n usenqed n usemti'},
  'learn.empty':{ar:'أدخل نص الدرس أولاً، ثم اضغط «توليد».',fr:'Collez d\'abord le texte du cours, puis cliquez sur « Générer ».',en:'Paste the lesson text first, then click "Generate".','zgh':'ⵙⴻⵏⵟⴻⴹ ⴰⴹⵔⵉⵙ ⵏ ⵜⵖⵓⵔⵉ ⴰⵎⴻⵣⵡⴰⵔⵓ, ⵙⵉⵏⴰ ⵙⵉⵜ ⵖⴻⴼ «ⵙⵏⵓⵍⴼⵓ».','zgh-latn':'Senṭeḍ aḍris n tɣuri amezwaru, sinna sit ɣef «Snulfu».'},
  'about.disclaimer':{ar:'CHRVVIM منصة طلابية مستقلة وغير رسمية، ولا تمثل جامعة ابن زهر أو الكلية.',fr:'CHRVVIM est une plateforme étudiante indépendante et non officielle, sans lien avec l\'Université Ibn Zohr ou la faculté.',en:'CHRVVIM is an independent, unofficial student platform, not affiliated with Ibn Zohr University or the faculty.','zgh':'CHRVVIM ⴷ ⴰⵙⵎⴻⵍ ⵏ ⵢⵉⵏⴻⵍⵎⴰⴷⴻⵏ ⴰⵙⵓⴼ, ⵡⴰⵔ ⵓⵏⵚⵉⴱ, ⵓⵔ ⵢⴻⵍⵉ ⴰⵔⴰ ⵢⴻⵙⴷⵓⴽⵍⴻⵏ ⵖⴻⵔ ⵜⵙⴷⴰⵡⵉⵜ Ibn Zohr ⵏⴻⵖ ⵖⴻⵔ ⵜⵙⴳⴰ.','zgh-latn':'CHRVVIM d asmel n yinelmaden asuf, war unṣib, ur yelli ara yesdukklen ɣer tsdawit Ibn Zohr neɣ ɣer tsga.'},
  'legal.head':{ar:'تنبيه قانوني — موقع مستقل وغير رسمي',fr:'Avis juridique — site indépendant et non officiel',en:'Legal notice — independent, unofficial site','zgh':'ⵜⴰⵎⴰⵜⴰⵔⵜ ⵜⴰⵣⵔⴼⴰⵏ — ⴰⵙⵎⴻⵍ ⴰⵙⵓⴼ, ⵡⴰⵔ ⵓⵏⵚⵉⴱ','zgh-latn':'Tamatart tazrfan — asmel asuf, war unṣib'},
  'legal.p1':{ar:'هذا الموقع مبادرة طلابية مستقلة من تطوير <b>محمد شرايم</b>، وليس الموقع الرسمي لكلية العلوم القانونية والسياسية بجامعة ابن زهر، ولا يمثّلها ولا يتحدّث باسمها بأي شكل من الأشكال.',fr:'Ce site est une initiative étudiante indépendante de <b>Mohamed Chraim</b>. Il n\'est pas le site officiel de la Faculté des sciences juridiques et politiques (Université Ibn Zohr) et ne la représente en aucune façon.',en:'This site is an independent student initiative by <b>Mohamed Chraim</b>. It is not the official site of the Faculty of Law and Political Science (Ibn Zohr University) and does not represent it in any way.','zgh':'ⴰⵙⵎⴻⵍ-ⴰ ⴷ ⵜⵓⴷⴰⵔⵜ ⵏ ⵢⵉⵏⴻⵍⵎⴰⴷⴻⵏ ⵜⵓⴼⵔⵉⵏ ⵙⵖⵓⵔ <b>Mohamed Chraim</b>. ⵎⴰⵞⵉ ⴷ ⴰⵙⵎⴻⵍ ⴰⵎⴰⴷⵓⴷ ⵏ ⵜⵙⴳⴰ ⵏ ⵜⵓⵙⵏⵉⵡⵉⵏ ⵜⵉⵣⵔⴼⴰⵏⵉⵏ ⴷ ⵜⵉⵙⵔⵜⴰⵏⵉⵏ (ⵜⴰⵙⴷⴰⵡⵉⵜ Ibn Zohr), ⵓⵔ ⵜ-ⵉⵎⴻⵙⵍⴰⵢ ⴰⵔⴰ ⵙ ⵡⵓⵎⴰ.','zgh-latn':'Asmel-a d tudart n yinelmaden tufrin sɣur <b>Mohamed Chraim</b>. Mačči d asmel amaddud n tsga n tussniwin tizrfanin d tisrtanin (Tasdawit Ibn Zohr), ur tt-imeslay ara s wuma.'},
  'legal.p2':{ar:'البيانات المعروضة (الجداول، الأفواج، المسارات، الوثائق) منقولة عن الوثائق والإعلانات الرسمية المعلنة من الكلية لأغراض التوضيح والتيسير فقط. <b>المرجع الرسمي الوحيد والمعتمد هو موقع الكلية ووثائقه الأصلية</b>؛ وعند أي اختلاف أو تعارض، تكون النسخة الرسمية المعلنة هي المقدَّمة وحدها.',fr:'Les données (emplois du temps, groupes, filières, documents) sont reprises des documents et annonces officiels, à titre indicatif uniquement. <b>La seule référence officielle est le site de la faculté et ses documents</b> ; en cas de divergence, la version officielle prévaut.',en:'The data shown (timetables, groups, tracks, documents) is taken from official documents and announcements for reference only. <b>The only official reference is the faculty website and its original documents</b>; in case of divergence, the official version prevails.','zgh':'ⵉⵙⴻⴼⴽⴰ ⵢⴻⵜⵡⴰⵙⴽⴰⵏⴻⵏ (ⵉⵖⴰⵡⴰⵙⴻⵏ ⵏ ⵡⴰⴽⵓⴷ, ⵜⵉⴳⵔⴰⵡⵉⵏ, ⵉⴱⵔⴷⴰⵏ, ⵉⵙⵏⵉⵍⵙⴻⵏ) ⵜⵡⴰⵟⴼⴻⵏ ⵙⴻⴳ ⵉⵙⵏⵉⵍⵙⴻⵏ ⴷ ⵢⵉⵙⴰⵍⵉⴻⵏ ⵉⵎⴰⴷⵓⴷⴻⵏ, ⵉ ⵓⵙⴻⵏⵜⴻⵎ ⴽⴰⵏ. <b>ⴰⵖⴱⴰⵍⵓ ⴰⵎⴰⴷⵓⴷ ⵏ ⵓⵏⵓ ⴷ ⴰⵙⵎⴻⵍ ⵏ ⵜⵙⴳⴰ ⴷ ⵉⵙⵏⵉⵍⵙⴻⵏ-ⵉⵙ ⴰⵏⴻⵚⵍⵉⵢⴻⵏ</b>; ⵎⴰ ⵢⴻⵍⴰ ⴰⵎⵅⴰⵍⴰⴼ, ⵍⵇⴻⵎ ⴰⵎⴰⴷⵓⴷ ⴰ ⵜ-ⵜⵡⴰⵙⴻⵎⵖⴻⵔ.','zgh-latn':'Isefka yettwaskanen (iɣawasen n wakud, tigrawin, ibrdan, isnilsen) ttwaṭṭfen seg isnilsen d yisalien imadduden, i usentem kan. <b>Aɣbalu amaddud n unu d asmel n tsga d isnilsen-is aneṣliyen</b>; ma yella amxallaf, lqem amaddud a t-ttwassemɣer.'},
  'legal.sources':{ar:'للمصادر الرسمية المباشرة:',fr:'Sources officielles directes :',en:'Direct official sources:','zgh':'ⵉⵖⴱⵓⵍⴰ ⵉⵎⴰⴷⵓⴷⴻⵏ ⵓⵙⵔⵉⴷⴻⵏ:','zgh-latn':'Iɣbula imadduden usriden:'},
  'legal.archive':{ar:'تمّت أرشفة نسخة من الوثائق الرسمية لأغراض العرض في هذا الموقع. يُرجى دائماً مراجعة المصدر الرسمي للتأكد من آخر تحديث.',fr:'Une copie des documents officiels a été archivée à titre indicatif. Vérifiez toujours la source officielle pour la dernière mise à jour.',en:'A copy of the official documents has been archived for reference. Always check the official source for the latest update.','zgh':'ⵜⵉⴽⵡⵉⴱⵉ ⵏ ⵉⵙⵏⵉⵍⵙⴻⵏ ⵉⵎⴰⴷⵓⴷⴻⵏ ⵜⴻⵜⵡⴰⵙⴻⴽⵍⴻⵙ ⵉ ⵓⵙⴻⵏⵜⴻⵎ. ⴷⵉⵎⴰ ⵙⴻⵏⵇⴻⴷ ⴰⵖⴱⴰⵍⵓ ⴰⵎⴰⴷⵓⴷ ⵉ ⵓⵙⴻⵎⵜⵉ ⴰⵏⴻⴳⴰⵔⵓ.','zgh-latn':'Tikwipi n isnilsen imadduden tettwasekles i usentem. Dima senqed aɣbalu amaddud i usemti aneggaru.'}
};
const t=k=>{const e=STR[k];const s=e?(e[UILANG]||e.ar):k;return window.CHRVVIM_GENDER?CHRVVIM_GENDER.apply(s):s};
function applyChrome(){
  const q=(s,r)=>{const e=document.querySelector(s);if(e&&r!==undefined)e.innerHTML=r};
  const set=(s,r)=>{const e=document.querySelector(s);if(e&&r!==undefined)e.textContent=r};
  q('.ab-brand i',t('brand.sub'));
  set('.skip-link',t('nav.skip'));
  set('#installLabel',t('tool.install'));
  set('.hero .motto',t('hero.motto'));
  q('.hero h1',t('hero.h1a')+' <b>'+t('hero.h1b')+'</b>');
  q('.hero>p',t('hero.p'));
  {const _chip=document.querySelector('.hero .officialchip');if(_chip)_chip.innerHTML=ICON_WARN+' '+t('hero.chip');}
  q('#hf span',t('hero.founder'));
  set('.stat:nth-child(1) span',t('stat.tracks'));
  set('.stat:nth-child(2) span',t('stat.sessions'));
  set('.stat:nth-child(3) span',t('stat.profs'));
  set('label[for=lang]',t('cfg.lang'));
  set('label[for=sem]',t('cfg.sem'));
  set('label[for=track]',t('cfg.track'));
  const langSel=$('lang'); if(langSel){langSel.options[0].textContent=t('lang.ar');langSel.options[1].textContent=t('lang.fr')}
  document.querySelectorAll('.tab').forEach(b=>{var lbl=t('tab.'+b.dataset.p);var ic=b.querySelector('.tab-ic');if(ic){var tx=b.querySelector('.tab-tx');if(!tx){tx=document.createElement('span');tx.className='tab-tx';b.appendChild(tx)}tx.textContent=lbl}else{b.textContent=lbl}});
  buildAbNav();
  const lc=$('legalCard');
  if(lc) lc.innerHTML='<div class="frieze">⚖️ § JUSTICE § ⚖️</div><div class="legalhead">'+t('legal.head')+'</div><p>'+t('legal.p1')+'</p><p>'+t('legal.p2')+'</p><p class="muted">'+t('legal.sources')+'</p><div class="officiallinks" id="officialLinks"></div><div class="srcnote">'+t('legal.archive')+'</div>';
  const navEl=document.querySelector('.layout .tabs');
  if(navEl) navEl.style.setProperty('--navt','"'+t('nav.title').replace(/"/g,'')+'"');
}
function buildAbNav(){
  const nav=$('abnav'); if(!nav) return;
  nav.innerHTML=[...document.querySelectorAll('.tab')].map(b=>'<a href="#top" data-jump="'+b.dataset.p+'">'+esc(b.textContent.replace(/^[^\p{L}\p{N}]+\s*/u,''))+'</a>').join('');
  nav.querySelectorAll('[data-jump]').forEach(a=>a.onclick=e=>{e.preventDefault();const tab=document.querySelector('.tab[data-p="'+a.dataset.jump+'"]');if(tab)tab.click()});
}
function setUILang(l){
  if(!UI_LANGS.includes(l)) l='ar';
  UILANG=l; store.set('cc_uilang',l);
  document.documentElement.lang=(l==='zgh-latn'?'zgh-Latn':l);
  document.documentElement.dir=dirFor(l);
  document.querySelectorAll('#uilang button').forEach(b=>b.classList.toggle('on',b.dataset.ui===l));
  applyChrome();
  try{ if(window.CHRVVIM_PAGE) window.CHRVVIM_PAGE.apply(l); }catch(e){}
  try{ fillTracks(); refresh(); renderDocs(); renderGpa(); renderAbout(); renderMine(); renderComments(); renderSmart(); renderStats(); renderLearn(); renderUniversity(); if(_annItems&&_annPaint)_annPaint(_annItems); if(window.Subjects&&$('p-subjects')&&$('p-subjects').classList.contains('on')) window.Subjects.render(); if(window.Legal&&$('p-legal')&&$('p-legal').classList.contains('on')) window.Legal.render(); if(window.Exams&&$('p-exams')&&$('p-exams').classList.contains('on')) window.Exams.render(); }catch(e){}
}


/* ===== تحديد الفوج من اللقب ===== */
function normSurname(s){
  return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[-_.'’]/g,' ').replace(/[^A-Z ]/g,'').replace(/\s+/g,' ').trim();
}
// الأسماء المفصولة بفراغ تأتي قبل المتصلة (الفراغ أصغر من الحروف في المقارنة)
function findGroup(dist,name){
  const n=normSurname(name); if(!n) return null;
  let hit=null;
  for(const d of dist){ if(normSurname(d.frm)<=n) hit=d; else break; }
  let note='';
  if(!hit){hit=dist[0];note=t('note.before')}
  const last=dist[dist.length-1];
  if(hit===last && n>normSurname(last.to)) note=t('note.after');
  return {d:hit,note};
}

/* ===== حصص الطالب ===== */
function sessionsFor(t,grp,extra){
  if(!grp) return t.sessions;
  return t.sessions.filter(s=>{
    if(!s.g) return true;
    if(s.g===grp) return true;
    if(extra && s.g===extra) return true;
    if(t.id==='s3_public'){
      if(s.g==='AB'&&extra==='Fr-A'&&('AB'.includes(grp))) return true;
      if(s.g==='CD'&&extra==='Fr-B'&&('CD'.includes(grp))) return true;
    }
    if(t.id==='s1_public'){
      if(s.g==='AB'&&'AB'.includes(grp)) return true;
      if(s.g==='CD'&&'CD'.includes(grp)) return true;
    }
    return false;
  });
}
function sessionsHTML(list,opts){
  opts=opts||{};
  if(!list.length) return '<p class="empty">'+t('msg.noSessionsChoice')+'</p>';
  const now=new Date(); const todayIdx=(now.getDay()+6)%7; const isSun=now.getDay()===0;
  const todays=isSun?[]:list.filter(s=>s.d===DAYS[todayIdx]).sort((a,b)=>startOf(a.t).localeCompare(startOf(b.t)));
  let h='<div class="todaybox"><b>'+t('today.title')+(isSun?t('today.sun'):' ('+(UILANG==='ar'?DAYS[todayIdx]:dayName(DAYS[todayIdx]))+')')+'</b>';
  h+=todays.length?todays.map(s=>'<div>'+esc(s.t)+' — <b>'+esc(s.s)+'</b> · '+esc(s.r)+'</div>').join(''):'<div class="muted">'+t('today.none')+'</div>';
  h+='</div>';
  let any=false;
  DAYS.forEach((d,i)=>{
    const ds=list.filter(s=>s.d===d).sort((a,b)=>startOf(a.t).localeCompare(startOf(b.t)));
    if(!ds.length) return; any=true;
    h+='<div class="day'+(i===todayIdx&&!isSun?' today':'')+'"><h4>'+esc(dayName(d))+(i===todayIdx&&!isSun?' <span class="t">'+t('today.tag')+'</span>':'')+'</h4>';
    ds.forEach(s=>{
      h+='<div class="sess'+(s.w?' mark':'')+'"><div class="tm">'+esc(s.t)+'</div><div><div class="sb">'+esc(s.s)+(s.g&&opts.showG?' <span class="chip g">'+esc(s.g)+'</span>':'')+'</div><div class="mt">👨‍🏫 '+esc(s.p||'—')+' &nbsp;·&nbsp; 🏫 '+esc(s.r||'—')+'</div>'+(s.w?'<div class="warnbox">⚠️ '+esc(s.w)+'</div>':'')+'</div></div>';
    });
    h+='</div>';
  });
  if(!any) h+='<p class="empty">'+t('msg.noSessions')+'</p>';
  return h;
}

/* ===== بوابة المتابعة ===== */
const igUrl=h=>'https://www.instagram.com/'+encodeURIComponent(h)+'/';
const unlocked=()=>store.get('cc_unlocked')==='1';
let pendingAction=null;
function guard(action){
  if(unlocked()) return true;
  const n=parseInt(store.get('cc_count')||'0',10);
  if(n<CONFIG.FREE_SEARCHES){store.set('cc_count',String(n+1));return true}
  pendingAction=action||null; openGate(); return false;
}
let gateDone={};const timers=[];
function openGate(){
  gateDone={};
  $('gateList').innerHTML=CONFIG.ACCOUNTS.map((a,i)=>'<div class="acc" id="acc'+i+'"><div><div class="h">@'+esc(a.handle)+'</div><div class="muted">'+esc(a.label)+'</div></div><a class="btn ig" target="_blank" rel="noopener" href="'+igUrl(a.handle)+'" data-i="'+i+'">'+t('gate.follow')+'</a></div>').join('');
  $('gateList').querySelectorAll('a[data-i]').forEach(b=>b.addEventListener('click',()=>followClick(+b.dataset.i,b)));
  $('gateOk').disabled=true; $('gate').classList.add('on');
}
function followClick(i,btn){
  if(gateDone[i]||btn.dataset.busy) return;
  btn.dataset.busy='1'; let s=CONFIG.WAIT_SECONDS; btn.textContent=t('gate.checking')+' '+s;
  const tmr=setInterval(()=>{
    s--; btn.textContent=t('gate.checking')+' '+s;
    if(s<=0){clearInterval(tmr);gateDone[i]=1;btn.textContent='✓ '+t('gate.done');
      $('acc'+i).classList.add('done');
      if(Object.keys(gateDone).length===CONFIG.ACCOUNTS.length) $('gateOk').disabled=false;}
  },1000);
}
$('gateOk').onclick=()=>{store.set('cc_unlocked','1');$('gate').classList.remove('on');const a=pendingAction;pendingAction=null;if(a)a()};
$('gateClose').onclick=()=>{$('gate').classList.remove('on');pendingAction=null};

/* ===== تبويب البحث ===== */
function renderSearch(){
  const trk=currentTrack(); const el=$('p-search');
  if(!trk){el.innerHTML='<p class="empty">'+t('msg.noData')+'</p>';return}
  if(trk.lang==='fr'||!trk.dist){
    el.innerHTML='<div class="note">'+(trk.lang==='fr'?t('msg.frUnified'):t('msg.oneGroup'))+'</div><div class="actions"><button class="btn" id="goAll">'+t('btn.showTT')+'</button></div>';
    $('goAll').onclick=()=>{ if(guard(()=>showDetail({track:trk,grp:'',extra:'',name:''}))) showDetail({track:trk,grp:'',extra:'',name:''}) };
    return;
  }
  el.innerHTML='<label for="q">'+t('lbl.surname')+'</label><div class="row"><input type="text" id="q" placeholder="'+t('ph.surname')+'" autocomplete="off" inputmode="latin" dir="ltr" style="text-align:left"><button class="btn" id="go">'+t('btn.search')+'</button></div><div class="muted" style="margin-top:6px">'+t('hint.surname')+'</div><div id="res"></div>';
  $('go').onclick=doSearch; $('q').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()});
}
function doSearch(){
  const trk=currentTrack(); if(!trk) return;
  const q=$('q').value; const box=$('res');
  if(normSurname(q).length<2){box.innerHTML='<p class="empty">'+t('msg.need2')+'</p>';return}
  const run=()=>{
    const r=findGroup(DATA.dist[trk.dist],q); const g=r.d;
    let en=null; if(trk.distEn){const e=findGroup(DATA.dist[trk.distEn],q); en=e.d;}
    const ctx={track:trk,grp:g.g,extra:en?en.g:'',name:normSurname(q)};
    state.last=ctx;
    let h='<div class="result"><div class="muted">'+t('lbl.surnameIs')+': <b dir="ltr">'+esc(ctx.name)+'</b> · '+esc(trackTitle(trk))+'</div><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:8px"><div><div class="muted">'+t('lbl.group')+'</div><div class="big">'+esc(g.g)+'</div></div>';
    if(g.sub) h+='<div><div class="muted">'+t('lbl.subgroups')+'</div><div style="font-weight:800;font-size:1.2rem;direction:ltr">'+esc(g.sub.replace(/-/g,' · '))+'</div></div>';
    h+='</div>';
    if(en){h+='<div class="kv"><span class="chip b">'+(trk.id==='s3_public'?t('lbl.french'):t('lbl.english'))+': '+esc(en.g)+'</span>'+(en.sub?'<span class="chip g" dir="ltr">'+esc(en.sub.replace(/-/g,' · '))+'</span>':'')+'</div>'}
    if(r.note) h+='<div class="warnbox">'+esc(r.note)+'</div>';
    h+='<div class="actions"><button class="btn" id="open">'+t('btn.showTT')+'</button><button class="btn sec" id="save">'+t('btn.saveGrp')+'</button></div></div><div class="muted" style="margin-top:8px">'+t('note.calc')+'</div>';
    box.innerHTML=h+srcNote(trk);
    $('open').onclick=()=>showDetail(ctx);
    $('save').onclick=()=>{saveMine(ctx);$('save').textContent=t('btn.saved')};
  };
  if(guard(run)) run();
}

/* ===== نافذة التفاصيل ===== */
function ctxTitle(c){
  let s=trackTitle(c.track);
  if(c.grp) s+=' — الفوج '+c.grp+(c.extra?' + '+c.extra:'');
  return s;
}
function showDetail(c){
  const list=sessionsFor(c.track,c.grp,c.extra);
  let h='<h2>'+t('hdr.tt')+'</h2><div class="muted">'+esc(ctxTitle(c))+'</div>'+sessionsHTML(list,{showG:!c.grp&&c.track.lang==='ar'});
  h+='<div class="actions"><button class="btn" id="dSave">'+t('btn.saveMyGrp')+'</button><a class="btn sec" id="dWa" target="_blank" rel="noopener" href="#">'+t('btn.whatsapp')+'</a><button class="btn sec" id="dCopy">'+t('btn.copy')+'</button><button class="btn sec" id="dCl">'+t('btn.close')+'</button></div>';
  $('detailBox').innerHTML=h;
  const text=summaryText(c,list);
  $('dSave').onclick=()=>{saveMine(c);$('dSave').textContent=t('btn.saved')};
  $('dWa').href='https://wa.me/?text='+encodeURIComponent(text);
  $('dCopy').onclick=()=>{try{navigator.clipboard.writeText(text).then(()=>{$('dCopy').textContent=t('btn.copied')},()=>{$('dCopy').textContent=t('btn.copyFail')})}catch(e){$('dCopy').textContent=t('btn.copyFail')}};
    $('dCl').onclick=()=>$('detail').classList.remove('on');
  $('detail').classList.add('on');
}
$('detail').addEventListener('click',e=>{if(e.target.id==='detail')$('detail').classList.remove('on')});
function summaryText(c,list){
  let txt=t('hdr.tt')+' — '+ctxTitle(c)+'\n';
  DAYS.forEach(d=>{const ds=list.filter(s=>s.d===d).sort((a,b)=>startOf(a.t).localeCompare(startOf(b.t)));if(ds.length){txt+='\n'+dayName(d)+':\n'+ds.map(s=>'• '+s.t+' '+s.s+' — '+s.r).join('\n')}});
  return txt+'\n\nCHRVVIM Campus';
}
function saveMine(c){store.set('cc_mine',JSON.stringify({id:c.track.id,grp:c.grp,extra:c.extra,name:c.name||''}));renderMine()}
function renderMine(){
  let m=null;try{m=JSON.parse(store.get('cc_mine')||'null')}catch(e){}
  const el=$('mine'); const trk=m&&byId(m.id);
  if(!trk){el.style.display='none';return}
  const c={track:trk,grp:m.grp,extra:m.extra,name:m.name};
  el.style.display='block';
  el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><b>'+t('hdr.myGrp')+'</b><div class="muted">'+esc(ctxTitle(c))+'</div></div><div class="actions" style="margin:0"><button class="btn" id="mGo">'+t('btn.viewTT')+'</button><button class="btn sec" id="mDel">'+t('btn.delete')+'</button></div></div>';
  $('mGo').onclick=()=>showDetail(c);
  $('mDel').onclick=()=>{store.set('cc_mine','');renderMine()};
}

/* ===== المصدر الرسمي لكل عنصر ===== */
function srcUrlFor(t){
  if(t&&t.lang==='fr') return 'https://fsjpa.uiz.ac.ma/announcements/12';
  const map={S1:'13',S3:'11',S5:'8'};
  const n=t&&map[t.sem];
  return n?'https://fsjpa.uiz.ac.ma/announcements/'+n:'https://fsjpa.uiz.ac.ma/';
}
function srcNote(trk){
  return '<div class="srcnote">'+t('src.note')+' <a href="'+srcUrlFor(trk)+'" target="_blank" rel="noopener">'+t('src.link')+'</a>'+t('src.tail')+'</div>';
}

/* ===== تبويب استعمال الزمن ===== */
function renderTT(){
  const trk=currentTrack(); const el=$('p-tt');
  if(!trk){el.innerHTML='<p class="empty">'+t('msg.noData')+'</p>';return}
  let letters=[];
  if(trk.dist) letters=DATA.dist[trk.dist].map(d=>d.g);
  let h='<div class="grid">';
  if(letters.length){
    h+='<div><label for="ttg">'+t('lbl.group')+'</label><select id="ttg">'+letters.map(l=>'<option>'+l+'</option>').join('')+'</select></div>';
    if(trk.distEn) h+='<div><label for="tte">'+(trk.id==='s3_public'?t('lbl.frGroup'):t('lbl.enGroup'))+'</label><select id="tte">'+DATA.dist[trk.distEn].map(d=>'<option>'+d.g+'</option>').join('')+'</select></div>';
  }
  h+='<div style="display:flex;align-items:end"><button class="btn" id="ttShow" style="width:100%">'+t('btn.show')+'</button></div></div><div id="ttOut" class="muted" style="margin-top:10px">'+t('msg.pickGroup')+'</div>';
  el.innerHTML=h+srcNote(trk);
  $('ttShow').onclick=()=>{
    const c={track:trk,grp:$('ttg')?$('ttg').value:'',extra:$('tte')?$('tte').value:'',name:''};
    const run=()=>{$('ttOut').outerHTML='<div id="ttOut">'+sessionsHTML(sessionsFor(trk,c.grp,c.extra),{showG:!c.grp&&trk.lang==='ar'})+'</div><div class="actions"><button class="btn sec" id="ttSave">'+t('btn.saveAsGrp')+'</button></div>'+srcNote(c.track)+'</div>';$('ttSave').onclick=()=>{saveMine(c);$('ttSave').textContent=t('btn.saved')}};
    if(guard(run)) run();
  };
}

/* ===== الأساتذة والمواد ===== */
function renderProf(){
  const el=$('p-prof'); const lang=$('lang').value;
  const trk=currentTrack();
  el.innerHTML='<label for="pq">'+t('prof.searchIn')+' '+(lang==='ar'?t('lang.ar'):t('lang.fr'))+')</label><input type="text" id="pq" placeholder="'+(lang==='ar'?t('prof.phAr'):t('prof.phFr'))+'" autocomplete="off"><div id="pOut" style="margin-top:12px"></div>'+srcNote(trk);
  const norm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase();
  const run=()=>{
    const q=norm($('pq').value.trim()); const cur=currentTrack();
    const tracks=DATA.tracks.filter(x=>x.lang===lang&&(q?true:(cur&&x.id===cur.id)));
    const rows=[];
    tracks.forEach(x=>x.sessions.forEach(s=>{ if(!q||norm(s.s).includes(q)||norm(s.p).includes(q)) rows.push({x,s}) }));
    if(!rows.length){$('pOut').innerHTML='<p class="empty">'+t('msg.noResults')+'</p>';return}
    const map={};
    rows.forEach(({x,s})=>{const k=s.s+'||'+s.p; (map[k]=map[k]||{s:s.s,p:s.p,n:0,tr:new Set()}); map[k].n++; map[k].tr.add(trackTitle(x)+' ('+x.sem+')')});
    const list=Object.values(map).sort((a,b)=>a.s.localeCompare(b.s,lang));
    $('pOut').innerHTML='<div class="muted" style="margin-bottom:6px">'+(q?t('hdr.searchResults'):t('hdr.trackCourses'))+' — '+list.length+'</div><div class="scroll"><table><tr><th>'+t('th.course')+'</th><th>'+t('th.prof')+'</th><th>'+t('th.count')+'</th><th>'+t('th.track')+'</th></tr>'+list.map(r=>'<tr><td>'+esc(r.s)+'</td><td>'+esc(r.p)+'</td><td>'+r.n+'</td><td class="muted">'+esc([...r.tr].join(' | '))+'</td></tr>').join('')+'</table></div>';
  };
  $('pq').addEventListener('input',run); run();
}

/* ===== القاعات ===== */
function renderRooms(){
  const el=$('p-rooms'); const trk=currentTrack();
  if(!trk){el.innerHTML='<p class="empty">'+t('msg.noData')+'</p>';return}
  const map={};
  trk.sessions.forEach(s=>{(map[s.r]=map[s.r]||[]).push(s)});
  const rooms=Object.keys(map).sort((a,b)=>a.localeCompare(b,trk.lang));
  el.innerHTML='<div class="muted" style="margin-bottom:8px">'+t('msg.roomsIn')+' '+esc(trackTitle(trk))+'</div><div class="scroll"><table><tr><th>'+t('th.room')+'</th><th>'+t('th.count')+'</th><th>'+t('th.rooms')+'</th></tr>'+rooms.map(r=>'<tr><td><b>'+esc(r)+'</b></td><td>'+map[r].length+'</td><td class="muted">'+esc(uniq(map[r].map(s=>s.s)).join('، '))+'</td></tr>').join('')+'</table></div>'+srcNote(trk);
}

/* ===== توزيع الأفواج ===== */
function renderDist(){
  const el=$('p-dist'); const trk=currentTrack();
  if(!trk||!trk.dist){el.innerHTML='<p class="empty">'+t('msg.noDist')+'</p>';return}
  const tbl=(rows,title)=>'<h4 style="margin:14px 0 6px">'+title+'</h4><div class="scroll"><table dir="ltr"><tr><th>Groupe</th><th>Sous-groupes</th><th>De</th><th>À</th></tr>'+rows.map(d=>'<tr><td><b>'+esc(d.g)+'</b></td><td>'+esc(d.sub||'—')+'</td><td>'+esc(d.frm)+'</td><td>'+esc(d.to)+'</td></tr>').join('')+'</table></div>';
  let h=tbl(DATA.dist[trk.dist],esc(trackTitle(trk)));
  if(trk.distEn) h+=tbl(DATA.dist[trk.distEn],trk.id==='s3_public'?t('dist.fr'):t('dist.en'));
  h+='<div class="note">'+t('dist.rule')+'</div>';
  el.innerHTML=h+srcNote(trk);
}

const PDFDATA={};
function openDoc(f){
  const b64=PDFDATA[f]; if(!b64) return false;
  const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([u],{type:'application/pdf'}));
  const w=window.open(url,'_blank'); if(!w) location.href=url; return true;
}
/* ===== الوثائق ===== */
const DOCS=window.CHRVVIM.DOCS;
function renderDocs(){
  const el=$('p-docs');
  el.innerHTML='<div class="official-banner">'+t('docs.banner')+' <a href="https://fsjpa.uiz.ac.ma/" target="_blank" rel="noopener">'+t('docs.banner2')+'</a>'+t('docs.banner3')+'</div><div class="note" style="margin-top:0">'+t('docs.note')+'</div><div class="grid"><div><label for="dsem">'+t('docs.sem')+'</label><select id="dsem"><option value="">'+t('docs.all')+'</option><option>S1</option><option>S3</option><option>S5</option></select></div><div><label for="dkind">'+t('docs.kind')+'</label><select id="dkind"><option value="">'+t('docs.all')+'</option><option value="tt">'+t('docs.kTT')+'</option><option value="dist">'+t('docs.kDist')+'</option><option value="lib">'+t('docs.kLib')+'</option><option value="ext">'+t('docs.kExt')+'</option></select></div></div><div class="dgrid" id="dlist"></div>';
  const run=()=>{
    const s=$('dsem').value,k=$('dkind').value;
    const l=DOCS.filter(d=>(!s||d.s===s||d.k==='lib')&&(!k||d.k===k));
    $('dlist').onclick=e=>{const a=e.target.closest('a.doc');if(a&&openDoc(a.getAttribute('href'))) e.preventDefault()};
    const libNote = (k === 'lib') ? '<p class="note" style="margin:0 0 12px">'+t('docs.libNote')+'</p>' : '';
    const kindChip = d => d.k === 'tt' ? t('docs.kindTT') : d.k === 'dist' ? t('docs.kindDist') : d.k === 'ext' ? t('docs.kindExt') : t('docs.kindLib');
    $('dlist').innerHTML = libNote + (l.map(d =>
      '<a class="doc" target="_blank" rel="noopener" href="' + esc(d.f) + '">' +
      '<b' + (d.l === 'fr' ? ' dir="ltr" style="text-align:left"' : '') + '>' + esc(d.t) + '</b>' +
      '<div class="mt">' + (d.s ? '<span class="chip">' + d.s + '</span>' : '') + '<span class="chip g">' + kindChip(d) + '</span>' +
      (d.u ? '<span class="chip" style="background:#e6f6ec;color:#0f6b39">'+t('docs.updated')+'</span>' : '') +
      (d.ext ? '<span class="chip" style="background:#eef4ff;color:#0b5cc4">'+t('docs.official')+'</span><span class="muted">'+esc(d.src||'')+'</span>' : '<span class="muted">PDF · ' + d.kb + ' KB</span>') + '</div></a>'
    ).join('') || '<p class="empty">'+t('docs.none')+'</p>');
  };
  $('dsem').onchange=run;$('dkind').onchange=run;run();
}

/* ===== عن المؤسس ===== */
const SOCIALS=window.CHRVVIM.SOCIALS;
const PHOTO="assets/founder.jpg";        /* master — used for social previews */
const PHOTO_SM="assets/founder-96.jpg";  /* hero avatar (rendered 42px) */
const PHOTO_MD="assets/founder-256.jpg"; /* founder card in the About panel */
const ICON_MOON='<svg class="icn" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.5 14.7A8.6 8.6 0 0 1 9.3 3.5a8.6 8.6 0 1 0 11.2 11.2z"/></svg>';
const ICON_SUN='<svg class="icn" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></svg>';
const ICON_WARN='<svg class="icn" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.6 21.4 20H2.6z"/><path d="M12 9.6v4.6"/><path d="M12 17.2h.01"/></svg>';
function renderAbout(){
  const stats=[[DATA.tracks.length,t('about.st1')],[DATA.tracks.reduce((n,x)=>n+x.sessions.length,0),t('about.st2')],[DOCS.length,t('about.st3')],['3',t('about.st4')]];
  $('p-about').innerHTML='<div class="cv"><div class="cv-hero"><div class="cv-ph"><img src="'+PHOTO_MD+'" loading="lazy" decoding="async" alt="'+t('about.founder')+' — CHRVVIM"></div><div><div class="cv-k">FOUNDER · LAW · DIGITAL EDUCATION</div><h2>'+t('about.founder')+'<small>Mohamed Chraim · CHRVVIM ®</small></h2><div class="cv-role">'+t('about.role')+'</div><p class="cv-lead">'+t('about.lead')+'</p><div class="pills"><span>القانون الخاص</span><span>العلوم الجنائية</span><span>الكتابة</span><span>التقنية التعليمية</span></div></div></div>'
  +'<div class="cv-stats">'+stats.map(s=>'<div><b>'+s[0]+'</b><span>'+s[1]+'</span></div>').join('')+'</div>'
  +'<div class="cv-body">'
  +'<div class="cv-sec"><h3>'+t('about.sec.about')+'</h3><p style="margin:0">'+t('about.body')+'</p></div>'
  +'<div class="cv-sec"><h3>'+t('about.sec.path')+'</h3><div class="tl"><div><b>جامعة ابن زهر — كلية العلوم القانونية والسياسية</b><p>أكادير، المغرب · القانون الخاص (العربية)</p></div></div></div>'
  +'<div class="cv-sec"><h3>'+t('about.sec.proj')+'</h3><div class="proj"><div><h4>🎓 CHRVVIM Campus</h4><p>'+t('about.proj1')+'</p></div><div><h4>✦ RIQQA</h4><p>'+t('about.proj2')+'</p></div><div><h4>✍️ '+t('about.sec.proj')+'</h4><p>'+t('about.proj3')+'</p></div></div></div>'
  +'<div class="cv-sec"><h3>'+t('about.sec.interests')+'</h3><div class="tags"><span>القانون المغربي</span><span>القانون الجنائي</span><span>العلوم الجنائية</span><span>علم الإجرام</span><span>الوعي القانوني</span><span>الأدب والفلسفة</span><span>التقنية التعليمية</span></div></div>'
  +'<div class="mission"><h4>'+t('about.mission')+'</h4><p>'+t('about.mission2')+'</p></div>'
  +'<div class="cv-sec"><h3>'+t('about.sec.contact')+'</h3><div class="soc">'+SOCIALS.map(x=>'<a target="_blank" rel="noopener" href="'+esc(x.u)+'"><i>'+x.i+'</i><span><b>'+esc(x.n)+'</b><br><span dir="ltr">'+esc(x.l)+'</span></span></a>').join('')+'</div><div class="actions cta"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/212665366326?text='+encodeURIComponent('CHRVVIM Campus')+'">'+t('btn.contact')+'</a><button class="btn sec" id="cvPrint">'+t('btn.print')+'</button></div></div>'
  +'<div class="muted">'+t('about.disclaimer')+'</div></div></div>';
}


/* ===== حاسبة المعدل ===== */
function renderGpa(){
  const el=$('p-gpa');
  el.innerHTML='<div class="note" style="margin-top:0">'+t('gpa.note')+'</div><div id="grows"></div><div class="actions"><button class="btn sec" id="gadd">'+t('btn.addCourse')+'</button><button class="btn sec" id="gclr">'+t('btn.clearAll')+'</button></div><div class="gres"><span>'+t('gpa.result')+'</span><b id="gout">—</b><span class="chip" id="gmen"></span></div>';
  const row=(n,g,c)=>'<div class="grow"><input type="text" placeholder="'+t('gpa.course')+'" value="'+esc(n||'')+'" aria-label="'+t('gpa.course')+'"><input type="number" class="gg" min="0" max="20" step="0.25" inputmode="decimal" placeholder="'+t('gpa.grade')+'" value="'+(g==null?'':g)+'" aria-label="'+t('gpa.grade')+'"><input type="number" class="gc" min="0" step="0.5" inputmode="decimal" placeholder="'+t('gpa.coef')+'" value="'+(c||1)+'" aria-label="'+t('gpa.coef')+'"><button class="btn sec gx" aria-label="'+t('btn.delete')+'">✕</button></div>';
  const rows=$('grows');
  const calc=()=>{
    let sw=0,sc=0;
    rows.querySelectorAll('.grow').forEach(r=>{const g=parseFloat(r.querySelector('.gg').value),c=parseFloat(r.querySelector('.gc').value);if(!isNaN(g)&&!isNaN(c)&&c>0&&g>=0&&g<=20){sw+=g*c;sc+=c}});
    const m=sc?sw/sc:null;
    $('gout').textContent=m==null?'—':m.toFixed(2)+' / 20';
    $('gmen').textContent=m==null?'':(m>=16?t('gpa.g1'):m>=14?t('gpa.g2'):m>=12?t('gpa.g3'):m>=10?t('gpa.g4'):t('gpa.g5'));
  };
  const add=(n,g,c)=>{rows.insertAdjacentHTML('beforeend',row(n,g,c));calc()};
  ['','',''].forEach(()=>add());
  $('gadd').onclick=()=>add();
  $('gclr').onclick=()=>{rows.innerHTML='';['','',''].forEach(()=>add())};
  rows.addEventListener('input',calc);
  rows.addEventListener('click',e=>{if(e.target.classList.contains('gx')){e.target.closest('.grow').remove();calc()}});
}

/* ===== ورشة التعلّم ===== */
function renderLearn(){
  const el=$('p-learn'); if(!el) return;
  const mats=DOCS.filter(d=>d.k==='lib');
  let h='<div class="note" style="margin-top:0">'+t('learn.lead')+'</div>';
  h+='<h4 style="margin:14px 0 8px">'+t('learn.materials')+' ('+mats.length+')</h4>';
  h+= mats.length
    ? '<div class="dgrid">'+mats.map(d=>'<a class="doc" target="_blank" rel="noopener" href="'+esc(d.f)+'"><b>'+esc(d.t)+'</b><div class="mt"><span class="chip">'+esc(d.s)+'</span><span class="chip g">'+t('learn.pdf')+'</span><span class="muted">PDF · '+d.kb+' KB</span></div></a>').join('')+'</div>'
    : '<p class="empty">'+t('docs.none')+'</p>';
  h+='<div class="note">'+t('learn.tips')+'</div>';
  el.innerHTML=h;
}

/* ===== الإحصائيات ===== */
function renderStats(){
  const el=$('p-stats'); if(!el) return;
  const all=DATA.tracks.flatMap(x=>x.sessions||[]);
  const profs=uniq(all.map(s=>s.p).filter(Boolean));
  const rooms=uniq(all.map(s=>s.r).filter(Boolean));
  const subs=uniq(all.map(s=>s.s).filter(Boolean));
  const groups=Object.keys(DATA.dist||{}).reduce((n,k)=>n+(DATA.dist[k]||[]).length,0);
  const card=(n,l)=>'<div class="scard"><b>'+n+'</b><span>'+l+'</span></div>';
  let h='<div class="note" style="margin-top:0">'+t('stats.lead')+'</div>';
  h+='<div class="sgrid">'
    + card(DATA.tracks.length,t('stat.tracks'))
    + card(all.length,t('stat.sessions'))
    + card(profs.length,t('stat.profs'))
    + card(rooms.length,t('stats.rooms'))
    + card(subs.length,t('stats.subjects'))
    + card(DOCS.length,t('stats.docs'))
    + card(groups,t('stats.groups'))
    +'</div>';
  const sems=['S1','S3','S5'];
  h+='<h4 style="margin:16px 0 6px">'+t('stats.bySem')+'</h4><div class="scroll"><table><tr><th>'+t('th.semester')+'</th><th>'+t('stats.tracksCol')+'</th><th>'+t('th.sessions')+'</th></tr>'
    + sems.map(s=>{const ts=DATA.tracks.filter(x=>x.sem===s);return '<tr><td><b>'+s+'</b></td><td>'+ts.length+'</td><td>'+ts.reduce((n,x)=>n+(x.sessions||[]).length,0)+'</td></tr>';}).join('')
    +'</table></div>';
  const langs=[['ar',t('lang.ar')],['fr',t('lang.fr')]];
  h+='<h4 style="margin:16px 0 6px">'+t('stats.byLang')+'</h4><div class="scroll"><table><tr><th>'+t('th.language')+'</th><th>'+t('stats.tracksCol')+'</th><th>'+t('th.sessions')+'</th></tr>'
    + langs.map(([lc,lb])=>{const ts=DATA.tracks.filter(x=>x.lang===lc);return '<tr><td>'+lb+'</td><td>'+ts.length+'</td><td>'+ts.reduce((n,x)=>n+(x.sessions||[]).length,0)+'</td></tr>';}).join('')
    +'</table></div>';
  h+='<h4 style="margin:16px 0 6px">'+t('stats.tracksTitle')+'</h4><div class="scroll"><table><tr><th>'+t('th.track')+'</th><th>'+t('th.semester')+'</th><th>'+t('th.language')+'</th><th>'+t('th.sessions')+'</th><th>'+t('th.rooms')+'</th></tr>'
    + DATA.tracks.map(x=>'<tr><td>'+esc(trackTitle(x))+'</td><td>'+x.sem+'</td><td>'+(x.lang==='ar'?t('lang.ar'):t('lang.fr'))+'</td><td>'+(x.sessions||[]).length+'</td><td>'+uniq((x.sessions||[]).map(s=>s.r).filter(Boolean)).length+'</td></tr>').join('')
    +'</table></div>';
  el.innerHTML=h;
}

/* ===== تحديث الواجهة ===== */
function fillTracks(){
  const lang=$('lang').value,sem=$('sem').value;
  const ts=DATA.tracks.filter(t=>t.lang===lang&&t.sem===sem);
  $('track').innerHTML=ts.length?ts.map(t=>'<option value="'+esc(t.id)+'">'+esc(trackTitle(t))+'</option>').join(''):'<option value="">— لا توجد بيانات —</option>';
}
function refresh(){renderSearch();renderTT();renderProf();renderRooms();renderDist();renderSmart()}
$('lang').onchange=()=>{fillTracks();refresh()};
$('sem').onchange=()=>{fillTracks();refresh()};
$('track').onchange=refresh;
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab,.panel').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');$('p-'+b.dataset.p).classList.add('on');
  if(b.dataset.p==='stats') renderStats();if(b.dataset.p==='learn') renderLearn();if(b.dataset.p==='subjects'&&window.Subjects) window.Subjects.render();if(b.dataset.p==='legal'&&window.Legal) window.Legal.render();if(b.dataset.p==='exams'&&window.Exams) window.Exams.render();
});
function setTheme(t){document.documentElement.dataset.theme=t;$('theme').innerHTML=t==='dark'?ICON_SUN:ICON_MOON;store.set('cc_theme',t)}
$('theme').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
(function init(){
  $('sTracks').textContent=DATA.tracks.length;
  $('sSess').textContent=DATA.tracks.reduce((n,t)=>n+t.sessions.length,0);
  $('sProf').textContent=uniq(DATA.tracks.flatMap(t=>t.sessions.map(s=>s.p)).filter(Boolean)).length;
  $("hfi").src=PHOTO_SM;$("hf").onclick=()=>{document.querySelectorAll(".tab,.panel").forEach(x=>x.classList.remove("on"));document.querySelector('[data-p=about]').classList.add("on");$("p-about").classList.add("on");$("p-about").scrollIntoView({behavior:"smooth"})};
  fillTracks();refresh();renderAbout();renderDocs();renderGpa();renderMine();renderStats();renderLearn();renderUniversity();
  const th=store.get('cc_theme'); if(th==='dark'||(!th&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)) setTheme('dark');
})();


/* ===================== خلفية ديناميكية حسب القسم ===================== */
function setSection(sec){
  if(!sec) return;
  document.documentElement.setAttribute('data-sec',sec);
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{setSection(b.dataset.p); if(b.dataset.p==='stats') renderStats();if(b.dataset.p==='learn') renderLearn();if(b.dataset.p==='subjects'&&window.Subjects) window.Subjects.render();if(b.dataset.p==='legal'&&window.Legal) window.Legal.render();if(b.dataset.p==='exams'&&window.Exams) window.Exams.render();}));
/* بطاقات "الاختيارات الكبرى": ضغطة مباشرة إلى القسم المطلوب */
document.querySelectorAll('.quick-card[data-jump]').forEach(b=>b.addEventListener('click',()=>{const p=document.querySelector('.tab[data-p="'+b.dataset.jump+'"]');if(p){p.click();const el=$('p-'+b.dataset.jump);if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'start'});}}));

/* ===================== المصادر الرسمية ===================== */
function renderOfficialLinks(){
  const box=document.getElementById('officialLinks'); if(!box) return;
  const items=(window.CHRVVIM&&window.CHRVVIM.OFFICIAL)||[];
  box.innerHTML=items.map(o=>'<a href="'+esc(o.u)+'" target="_blank" rel="noopener"><span class="os">'+esc(o.s)+'</span><span>'+esc(o.t)+'</span></a>').join('')
    +'<a href="https://fsjpa.uiz.ac.ma/" target="_blank" rel="noopener"><span class="os">🌐</span><span>الصفحة الرسمية لكلية العلوم القانونية والسياسية — أكادير</span></a>';
}

/* ===================== روابط جامعة ابن زهر (UIZ) ===================== */
function renderUniversity(){
  const el=$('p-university'); if(!el) return;
  const data=window.CHRVVIM_UNIVERSITY||{groups:[]};
  const pickAr=UILANG==='ar';
  const mainOf=it=>pickAr?(it.ar||it.fr||''):(it.fr||it.ar||'');
  const subOf =it=>pickAr?(it.fr||''):(it.ar||'');
  const _uniRows=[];
  const row=(it,gk)=>{
    const internal=/^(fac|schools|cities)$/.test(gk||'');
    const idx=internal?(_uniRows.push(it)-1):-1;
    return '<a href="'+esc(it.u)+'"'+(internal?' data-uni="'+idx+'"':'')+' target="_blank" rel="noopener"><span class="os">'+esc(it.s||'')+'</span><span><b>'+esc(mainOf(it))+'</b>'+(subOf(it)?'<small>'+esc(subOf(it))+'</small>':'')+'</span></a>';
  };
  let html='<div class="official-banner">'+t('uni.banner')+'</div>';
  html+='<h2 class="uni-h">🎓 '+esc(t('uni.h'))+'</h2>';
  html+='<p class="muted">'+esc(t('uni.intro'))+'</p>';
  const PSTAT=(window.CHRVVIM_PORTAL&&window.CHRVVIM_PORTAL.university&&window.CHRVVIM_PORTAL.university.stats)||[];
  if(PSTAT.length){
    ensureUniCss();
    html+='<div class="uni-stats" title="'+esc(t('uni.stats'))+'">'
      +PSTAT.map(s=>'<span class="uni-stat"><b>'+esc(s.value)+'</b><i>'+esc(s.label)+'</i></span>').join('')
      +'</div>';
  }
  html+='<div class="officiallinks">'
    +'<a href="https://www.uiz.ac.ma" target="_blank" rel="noopener"><span class="os">UIZ</span><span><b>'+esc(t('uni.main'))+'</b><small>uiz.ac.ma</small></span></a>'
    +'<a href="https://www.uiz.ac.ma/nos-etablissements" target="_blank" rel="noopener"><span class="os">24</span><span><b>'+esc(t('uni.etab'))+'</b><small>uiz.ac.ma/nos-etablissements</small></span></a>'
    +'</div>';
  (data.groups||[]).forEach(g=>{
    html+='<h3 class="uni-cat">'+esc(t('uni.cat.'+g.key))+'</h3>';
    html+='<div class="officiallinks">'+(g.items||[]).map(it=>row(it,g.key)).join('')+'</div>';
  });
  html+='<p class="uni-src">'+esc(t('uni.source'))+': <a href="https://www.uiz.ac.ma" target="_blank" rel="noopener">uiz.ac.ma</a></p>';
  html+='<p class="uni-src">'+esc(t('uni.note'))+'</p>';
  // بحث في التكوينات (382) — من university-formations.js
  const FD=window.CHRVVIM_FORMATIONS||{items:[],etabs:[]};
  const fEtabs=[...new Map((FD.etabs||[]).map(e=>[e.a,e])).values()].sort((x,y)=>x.a.localeCompare(y.a,'ar'));
  const fCities=uniqSorted((FD.etabs||[]).map(e=>e.c).filter(Boolean));
  const fDipls=uniqSorted((FD.items||[]).map(i=>i.d).filter(Boolean));
  const opt=(v,label,cur)=>'<option value="'+esc(v)+'"'+(cur===v?' selected':'')+'>'+esc(label)+'</option>';
  html+='<h3 class="uni-cat">'+esc(t('uni.form.h'))+'</h3>';
  html+='<p class="muted">'+esc(t('uni.form.intro'))+'</p>';
  html+='<div class="uni-search">'
    +'<label class="uni-sr" for="uniSearch">'+esc(t('uni.form.ph'))+'</label>'
    +'<input id="uniSearch" type="search" autocomplete="off" placeholder="'+esc(t('uni.form.ph'))+'" aria-describedby="uniCount">'
    +'<span id="uniCount" class="uni-count" role="status" aria-live="polite"></span>'
    +'</div>';
  html+='<div class="uni-filters">'
    +'<select id="uniEtab" aria-label="'+esc(t('uni.form.lblEtab'))+'">'+opt('',t('uni.form.allEtab'),uniState.etab)+fEtabs.map(e=>opt(e.a,e.a+(e.c?' ('+e.c+')':''),uniState.etab)).join('')+'</select>'
    +'<select id="uniDipl" aria-label="'+esc(t('uni.form.lblDipl'))+'">'+opt('',t('uni.form.allDipl'),uniState.dipl)+fDipls.map(d=>opt(d,d,uniState.dipl)).join('')+'</select>'
    +'<select id="uniCity" aria-label="'+esc(t('uni.form.lblCity'))+'">'+opt('',t('uni.form.allCity'),uniState.city)+fCities.map(c=>opt(c,c,uniState.city)).join('')+'</select>'
    +'</div>';
  html+='<div id="uniResults" class="uni-results"></div>';
  html+='<p class="uni-src">'+esc(t('uni.form.note'))+'</p>';
  el.innerHTML=html;
  bindFormations();
  bindUniDetail(_uniRows);
}
/* ===== تفاصيل المؤسسة داخل الموقع (المعلومة قبل الرابط الخارجي) ===== */
function bindUniDetail(rows){
  const el=$('p-university'); if(!el) return;
  el.querySelectorAll('a[data-uni]').forEach(a=>{
    a.addEventListener('click',ev=>{
      ev.preventDefault();
      const it=rows[parseInt(a.dataset.uni,10)];
      if(it) showUniDetail(it);
    });
  });
}
/* ===== ربط صف المؤسسة ببيانات بوابة المؤسسات الرسمية (portal-preview) ===== */
function portalFixUrl(u){ return String(u||'').replace(/\\/g,'/'); }
function portalHost(u){ try{ return portalFixUrl(u).replace(/^https?:\/\//i,'').replace(/^www\./i,'').replace(/\/+$/,'').toLowerCase(); }catch(e){ return ''; } }
function findPortalIt(it){
  const P=window.CHRVVIM_PORTAL; if(!P||!P.establishments||!it) return null;
  const u=portalHost(it.u);
  const sim=(a,b)=>{ a=String(a||'').split(/[—–-]/)[0].trim().toLowerCase(); b=String(b||'').split(/[—–-]/)[0].trim().toLowerCase(); return !!(a&&b&&(a===b||a.indexOf(b)===0||b.indexOf(a)===0)); };
  return P.establishments.find(x=>portalHost(x.uiz_url)&&portalHost(x.uiz_url)===u)
    ||P.establishments.find(x=>(x.website&&portalHost(x.website)===u)||(x.website_alt&&portalHost(x.website_alt)===u))
    ||P.establishments.find(x=>sim(x.name_fr,it.fr)&&String(it.ar||'').indexOf(String(x.city_ar||''))>=0)
    ||null;
}
function ensureUniCss(){
  if(document.getElementById('uniDetailCss')) return;
  const st=document.createElement('style');st.id='uniDetailCss';
  st.textContent='#uniDetailOv{position:fixed;inset:0;z-index:980;background:rgba(8,13,24,.55);display:flex;align-items:center;justify-content:center;padding:16px}'
    +'#uniDetailOv[hidden]{display:none}'
    +'.uni-detail{background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:18px;max-width:560px;width:100%;max-height:82vh;overflow:auto;padding:20px;position:relative;box-shadow:0 24px 70px rgba(0,0,0,.35)}'
    +'.uni-dx{position:absolute;top:10px;inset-inline-end:12px;border:0;background:var(--soft);color:inherit;width:34px;height:34px;border-radius:50%;font-size:1.1rem;cursor:pointer}'
    +'.uni-dbody h3{margin:0 0 2px}.uni-dbody .ud-fr{color:var(--muted);font-size:.85rem;margin:0 0 12px;line-height:1.6}'
    +'.uni-dbody .ud-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}'
    +'.uni-dbody .ud-tag{font-size:.72rem;font-weight:800;padding:4px 10px;border-radius:99px;background:var(--soft);border:1px solid var(--line)}'
    +'.uni-dbody dl{margin:0 0 12px;display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:.85rem}'
    +'.uni-dbody dt{color:var(--muted);font-weight:700}.uni-dbody dd{margin:0;line-height:1.7}'
    +'.uni-dbody .ud-forms{margin:6px 0 0;padding:0;list-style:none;font-size:.8rem;line-height:1.9}'
    +'.uni-dbody .ud-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}'
    +'.uni-dbody .ud-actions a{font-weight:800;font-size:.82rem;padding:10px 16px;border-radius:12px;text-decoration:none;border:1px solid var(--line)}'
    +'.uni-dbody .ud-actions a.pri{background:var(--gold);color:#0b2a6f;border-color:transparent}'
    +'.uni-dbody .ud-actions a.sec{background:var(--soft);color:var(--ink)}'
    +'.uni-dbody .ud-sec{margin:14px 0 0;border-top:1px solid var(--line);padding-top:12px}'
    +'.uni-dbody .ud-sec h4{margin:0 0 8px;font-size:.86rem}'
    +'.uni-dbody .ud-pres{font-size:.82rem;line-height:1.95;color:var(--ink);opacity:.92;margin-top:8px;text-align:justify}'
    +'.uni-dbody details.ud-det summary{cursor:pointer;font-weight:800;font-size:.82rem;color:var(--gold2);list-style:none}'
    +'.uni-dbody details.ud-det summary::-webkit-details-marker{display:none}'
    +'.uni-dbody details.ud-det summary:before{content:"▸ ";font-weight:700}'
    +'.uni-dbody details.ud-det[open] summary:before{content:"▾ "}'
    +'.uni-dbody .ud-lead{margin:0;padding:0;list-style:none;font-size:.82rem;line-height:1.95}'
    +'.uni-dbody .ud-lead b{font-weight:800;color:var(--gold2)}'
    +'.uni-dbody .ud-res{display:flex;flex-direction:column;gap:2px}'
    +'.uni-dbody .ud-res a{font-size:.8rem;line-height:1.9;text-decoration:none;color:var(--ink);opacity:.9;border-bottom:1px dashed var(--line)}'
    +'.uni-dbody .ud-res a:hover{opacity:1;color:var(--gold2)}'
    +'.uni-stats{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 16px}'
    +'.uni-stat{display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 14px;border-radius:12px;background:var(--soft);border:1px solid var(--line);min-width:74px}'
    +'.uni-stat b{font-size:1rem;color:var(--gold2)}.uni-stat i{font-style:normal;font-size:.68rem;color:var(--muted)}';
  document.head.appendChild(st);
}
function showUniDetail(it){
  let ov=document.getElementById('uniDetailOv');
  if(!ov){
    ov=document.createElement('div');ov.id='uniDetailOv';ov.hidden=true;
    ov.innerHTML='<div class="uni-detail" role="dialog" aria-modal="true" aria-labelledby="uniDetailT"><button type="button" class="uni-dx" aria-label="إغلاق">×</button><div class="uni-dbody"></div></div>';
    document.body.appendChild(ov);
    ensureUniCss();
    ov.addEventListener('click',e=>{if(e.target===ov)ov.hidden=true;});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!ov.hidden)ov.hidden=true;});
  }
  const I=(window.CHRVVIM_INSTITUTIONS||[]);
  const norm=u=>{try{return String(u||'').replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0].toLowerCase()}catch(e){return ''}};
  const inst=I.find(x=>norm(x.website_url)&&norm(x.website_url)===norm(it.u))
    ||I.find(x=>x.abbreviation&&it.s&&String(x.abbreviation).toLowerCase()===String(it.s).toLowerCase())
    ||I.find(x=>x.name_fr&&it.fr&&String(it.fr).toLowerCase().indexOf(String(x.name_fr).split('—')[0].trim().toLowerCase())===0)
    ||null;
  const forms=inst?(inst.formations_confirmed||[]):[];
  let tl='';try{const k='uni.cat.'+(inst&&inst.type||'');const s=t(k);if(s!==k)tl=s;}catch(e){}
  const pickAr=UILANG==='ar';
  const nm=inst?((pickAr?inst.name_ar:inst.name_fr)||inst.name_ar||inst.name_fr):((pickAr?it.ar:it.fr)||it.ar||it.fr);
  const fr=(inst&&inst.name_fr)||it.fr||'';
  let b='<h3 id="uniDetailT">'+esc(nm||'')+'</h3>';
  if(fr&&fr!==nm) b+='<p class="ud-fr">'+esc(fr)+'</p>';
  b+='<div class="ud-tags">'
    +(it.s?'<span class="ud-tag">'+esc(it.s)+'</span>':'')
    +(tl?'<span class="ud-tag">'+esc(tl)+'</span>':'')
    +(inst&&inst.status_label?'<span class="ud-tag">✔ '+esc(inst.status_label)+'</span>':'')
    +(inst&&inst.last_verified?'<span class="ud-tag">🕐 '+esc(inst.last_verified)+'</span>':'')
    +'</div>';
  b+='<dl>'
    +(inst&&inst.city_ar?'<dt>'+esc(t('uni.detail.city'))+'</dt><dd>'+esc(inst.city_ar)+(inst.city_fr?' — '+esc(inst.city_fr):'')+'</dd>':'')
    +(inst&&inst.status_label?'<dt>'+esc(t('uni.detail.status'))+'</dt><dd>'+esc(inst.status_label)+'</dd>':'')
    +(inst&&inst.last_verified?'<dt>'+esc(t('uni.detail.verified'))+'</dt><dd>'+esc(inst.last_verified)+'</dd>':'')
    +(inst&&inst.notes?'<dt>'+esc(t('uni.detail.notes'))+'</dt><dd>'+esc(inst.notes)+'</dd>':'')
    +'</dl>';
  if(forms.length){
    b+='<div><b style="font-size:.82rem">'+esc(t('uni.detail.form'))+' ('+forms.length+')</b><ul class="ud-forms">'
      +forms.slice(0,12).map(f=>'<li>• '+esc(typeof f==='string'?f:(f.n||f.d||''))+'</li>').join('')
      +(forms.length>12?'<li>…</li>':'')
      +'</ul></div>';
  }
  const P=findPortalIt(it);
  if(P){
    if(P.presentation_ar){
      b+='<div class="ud-sec"><h4>'+esc(t('uni.detail.about'))+'</h4>'
        +'<details class="ud-det"><summary>'+esc(t('uni.detail.more'))+'</summary><div class="ud-pres">'+esc(P.presentation_ar)+'</div></details></div>';
    }
    if(P.leadership&&P.leadership.length){
      b+='<div class="ud-sec"><h4>'+esc(t('uni.detail.lead'))+'</h4><ul class="ud-lead">'
        +P.leadership.map(x=>'<li><b>'+esc(x.role_ar||x.role_fr||'')+'</b> — '+esc(x.name||'')+'</li>').join('')
        +'</ul></div>';
    }
    const cRows=[];
    if(P.address)cRows.push([t('uni.detail.address'),P.address]);
    if(P.phone)cRows.push([t('uni.detail.tel'),P.phone]);
    if(P.fax)cRows.push([t('uni.detail.fax'),P.fax]);
    if(P.city_ar&&!(inst&&inst.city_ar))cRows.push([t('uni.detail.city'),P.city_ar]);
    if(cRows.length){
      b+='<div class="ud-sec"><h4>'+esc(t('uni.detail.contact'))+'</h4><dl>'
        +cRows.map(r=>'<dt>'+esc(r[0])+'</dt><dd dir="ltr" style="text-align:start">'+esc(r[1])+'</dd>').join('')
        +'</dl></div>';
    }
    if(P.programs_ar&&P.programs_ar.length){
      b+='<div class="ud-sec"><h4>'+esc(t('uni.detail.programs'))+' ('+P.programs_ar.length+')</h4><ul class="ud-forms">'
        +P.programs_ar.map(x=>'<li>• '+esc(x)+'</li>').join('')
        +'</ul></div>';
    }
    const res=(P.resources||[]).filter(x=>x&&x.url);
    if(res.length){
      b+='<div class="ud-sec"><h4>'+esc(t('uni.detail.useful'))+'</h4><div class="ud-res">'
        +res.slice(0,14).map(x=>'<a href="'+esc(portalFixUrl(x.url))+'" target="_blank" rel="noopener">🔗 '+esc(x.label||x.url)+'</a>').join('')
        +'</div></div>';
    }
  }
  b+='<div class="ud-actions">'
    +'<a class="pri" href="'+esc(portalFixUrl(it.u||(inst&&inst.website_url)||'#'))+'" target="_blank" rel="noopener">'+esc(t('uni.detail.open'))+'</a>'
    +((P&&P.uiz_url)?'<a class="sec" href="'+esc(portalFixUrl(P.uiz_url))+'" target="_blank" rel="noopener">'+esc(t('uni.detail.uiz'))+'</a>':'')
    +((inst||it.s)?'<a class="sec" href="#p-university" data-ud-find="'+esc((inst&&inst.abbreviation)||it.s||'')+'">'+esc(t('uni.detail.find'))+'</a>':'')
    +'</div>';
  ov.querySelector('.uni-dbody').innerHTML=b;
  ov.querySelector('.uni-dx').setAttribute('aria-label',t('uni.detail.close'));
  const findBtn=ov.querySelector('[data-ud-find]');
  if(findBtn) findBtn.addEventListener('click',ev=>{
    ev.preventDefault();
    ov.hidden=true;
    const q=findBtn.getAttribute('data-ud-find');
    const s=document.getElementById('uniSearch');
    if(s){s.value=q;s.dispatchEvent(new Event('input',{bubbles:true}));s.scrollIntoView({behavior:'smooth',block:'center'});}
  });
  ov.hidden=false;
  const x=ov.querySelector('.uni-dx'); if(x) x.focus();
}

/* ===================== بحث التكوينات + التصفية (382) ===================== */
function uniqSorted(a){return [...new Set(a)].sort((x,y)=>String(x).localeCompare(String(y),'ar'));}
function normUni(s){return String(s||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')                 // نقص الحركات اللاتينية
  .replace(/[\u064B-\u065F\u0670\u0640]/g,'')                      // تشكيل عربي (يشمل همزة التركيب 0654) + تطويل
  .replace(/[\u0623\u0625\u0622\u0671]/g,'\u0627')                 // أ إ آ ٱ → ا
  .replace(/\u0649/g,'\u064A').replace(/\u0626/g,'\u064A')         // ى ئ → ي
  .replace(/\u0624/g,'\u0648').replace(/\u0629/g,'\u0647')         // ؤ → و ، ة → ه
  .toLowerCase();}
function readUniState(){
  uniState.q=($('uniSearch')||{}).value||'';
  uniState.etab=($('uniEtab')||{}).value||'';
  uniState.dipl=($('uniDipl')||{}).value||'';
  uniState.city=($('uniCity')||{}).value||'';
}
function syncUniURL(){
  try{
    const p=new URLSearchParams();
    if(uniState.q) p.set('q',uniState.q);
    if(uniState.etab) p.set('etab',uniState.etab);
    if(uniState.dipl) p.set('dipl',uniState.dipl);
    if(uniState.city) p.set('city',uniState.city);
    const s=p.toString();
    history.replaceState(null,'',location.pathname+(s?'?'+s:'')+location.hash);
  }catch(e){}
}
function applyUniParamsOnce(){
  if(_uniDeepDone) return; _uniDeepDone=true;
  try{
    const p=new URLSearchParams(location.search);
    const q=p.get('q'), etab=p.get('etab'), dipl=p.get('dipl'), city=p.get('city');
    if(!q&&!etab&&!dipl&&!city) return;
    const tab=document.querySelector('.tab[data-p="university"]'); if(tab) tab.click();
    if(q) uniState.q=q;
    if(etab) uniState.etab=etab;
    if(dipl) uniState.dipl=dipl;
    if(city) uniState.city=city;
  }catch(e){}
}
function renderFormations(){
  const box=$('uniResults'), cnt=$('uniCount'); if(!box) return;
  readUniState();
  const F=window.CHRVVIM_FORMATIONS||{items:[],etabs:[]};
  const all=F.items||[], etabs=F.etabs||[];
  const nq=normUni(uniState.q).trim();
  const terms=nq?nq.split(/\s+/):[];
  const active=!!nq||!!uniState.etab||!!uniState.dipl||!!uniState.city;
  if(!active){
    box.innerHTML='<p class="uni-hint">'+esc(t('uni.form.hint'))+'</p>';
    if(cnt) cnt.textContent=(F.count||all.length)+' '+t('uni.form.total');
    return;
  }
  const list=all.filter(it=>{
    const et=etabs[it.x]||{};
    if(uniState.etab&&et.a!==uniState.etab) return false;
    if(uniState.dipl&&it.d!==uniState.dipl) return false;
    if(uniState.city&&et.c!==uniState.city) return false;
    if(terms.length){const hay=normUni([it.n,it.d,it.l,et.e,et.a,et.c].join(' '));if(!terms.every(w=>hay.includes(w)))return false;}
    return true;
  });
  if(cnt) cnt.textContent=list.length+' '+t('uni.form.results');
  if(!list.length){ box.innerHTML='<p class="uni-hint">'+esc(t('uni.form.none'))+'</p>'; return; }
  const CAP=80, shown=list.slice(0,CAP);
  box.innerHTML=shown.map(it=>{
    const et=etabs[it.x]||{};
    const meta=[it.d,(it.l?it.l:'')].filter(Boolean).join(' · ');
    return '<a class="uni-res" href="'+esc(it.u)+'" target="_blank" rel="noopener">'
      +'<span class="uni-res-n">'+esc(it.n)+'</span>'
      +'<span class="uni-res-m">'+esc(meta)+' — '+esc(et.a||et.e||'')+(et.c?' ('+esc(et.c)+')':'')+'</span></a>';
  }).join('')+(list.length>CAP?'<p class="uni-hint">'+esc(t('uni.form.more'))+'</p>':'');
}
function bindFormations(){
  const inp=$('uniSearch'); if(!inp||inp._bound) return; inp._bound=true;
  applyUniParamsOnce();
  inp.value=uniState.q||'';
  const setS=(id,v)=>{const s=$(id);if(s)s.value=v||'';};
  setS('uniEtab',uniState.etab); setS('uniDipl',uniState.dipl); setS('uniCity',uniState.city);
  const run=()=>{renderFormations();syncUniURL();};
  let tm=null;
  inp.addEventListener('input',()=>{ if(tm)clearTimeout(tm); tm=setTimeout(run,120); });
  ['uniEtab','uniDipl','uniCity'].forEach(id=>{const s=$(id); if(s) s.addEventListener('change',run);});
  renderFormations();
}

/* ===================== إعلانات المنصة (Supabase ← ثابتة ← خادم) ===================== */
let _annPaint=null,_annItems=null;
async function loadCampusAnnouncements(){
  const status=document.getElementById('campus-announcements-status');
  const list=document.getElementById('campus-announcements-list');
  if(!status||!list) return;
  _annPaint=items=>{
    if(!items.length){status.textContent=t('ann.none');return}
    status.textContent=t('ann.count')+' '+items.length;
    const sorted=items.slice().sort((a,b)=>String(b.updated_at||b.date||'').localeCompare(String(a.updated_at||a.date||'')));
    const MAX=6, shown=sorted.slice(0,MAX);
    const more=items.length>MAX?'<div style="margin:14px 0;text-align:center"><a class="btn sec" href="rafiq-altalib.html#news">'+t('ann.all')+' ('+items.length+') ↗</a></div>':'';
    list.innerHTML=shown.map(a=>{
      const meta=[a.etablissement,a.updated_at||a.date].filter(Boolean).map(esc).join(' · ');
      const body=a.body?'<p style="white-space:pre-wrap;line-height:1.8;margin:0 0 8px">'+esc(a.body)+'</p>':'';
      const link=a.url?'<a href="'+esc(a.url)+'" target="_blank" rel="noopener noreferrer" style="font-weight:700;white-space:nowrap">'+t('ann.source')+'</a>':'';
      return '<article style="padding:14px;margin:12px 0;border:1px solid var(--line);border-radius:12px;background:var(--soft)"><h3 style="margin:0 0 8px">'+esc(a.title)+'</h3>'+body+'<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between">'+(meta?'<small class="muted">'+meta+'</small>':'<span></span>')+link+'</div></article>';
    }).join('')+more;
  };
  let items=null;
  // 1) إعلانات المنصة المنشورة من لوحة التحكم (Supabase عبر المفتاح العمومي) — تتقدّم على غيرها.
  const sb=window.CHRVVIM_SUPABASE;
  if(sb&&sb.url&&sb.anonKey){
    try{
      const base=String(sb.url).replace(/\/+$/,'');
      const r=await fetch(base+'/rest/v1/announcements?select=title,body,kind,starts_at,ends_at,status,updated_at&status=eq.published&order=updated_at.desc&limit=50',{headers:{apikey:sb.anonKey,Authorization:'Bearer '+sb.anonKey},cache:'no-store'});
      if(r.ok){const rows=await r.json();if(Array.isArray(rows)&&rows.length)items=rows;}
    }catch(e){}
  }
  // 2) احتياطياً: إعلانات ثابتة مرفقة بالموقع (تضمن نفس المحتوى بلا خادم).
  if(!items){try{const r=await fetch('announcements.json',{cache:'no-store'});if(r.ok){const d=await r.json();if(d&&Array.isArray(d.items))items=d.items;}}catch(e){}}
  // 3) احتياطياً أخيراً: واجهة الخادم إن كانت متاحة.
  if(!items){try{const r=await fetch('/api/public/announcements',{cache:'no-store'});if(r.ok){const d=await r.json();if(d&&Array.isArray(d.items))items=d.items;}}catch(e){}}
  if(!items){status.textContent=t('ann.error');return}
  _annItems=items; try{_annPaint(items);}catch(e){status.textContent=t('ann.error');}
}

/* ===================== منصة التعاليق (محلية فالمتصفح) ===================== */
const C_TOPICS=()=>t('comments.topics').split('|');
function commentsGet(){try{return JSON.parse(store.get('cc_comments')||'[]')}catch(e){return[]}}
function commentsSet(a){store.set('cc_comments',JSON.stringify((a||[]).slice(0,300)))}
function cFmt(iso){try{const loc=UILANG==='ar'?'ar-MA':(UILANG==='fr'||/^zgh/.test(UILANG)?'fr-MA':'en-GB');return new Date(iso).toLocaleString(loc,{dateStyle:'medium',timeStyle:'short'})}catch(e){return esc(String(iso||''))}}
function renderComments(){
  const el=$('p-comments'); if(!el) return;
  el.innerHTML=
    '<div class="official-banner">'+t('comments.banner')+'</div>'
    +'<div class="cform">'
    +'<div class="grid"><div><label for="cname">'+t('comments.name')+'</label><input type="text" id="cname" maxlength="40" placeholder="'+(UILANG==='ar'?'مثال: يوسف':(/^zgh/.test(UILANG)?'amedya: Yusef':'e.g. Youssef'))+'" autocomplete="off"></div>'
    +'<div><label for="ctag">'+t('comments.about')+'</label><select id="ctag">'+C_TOPICS().map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></div></div>'
    +'<div><label for="ctext">'+t('comments.text')+'</label><textarea id="ctext" maxlength="1200" placeholder="'+t('comments.ph')+'"></textarea></div>'
    +'<div class="actions" style="margin:0"><button class="btn" id="cadd">'+t('comments.post')+'</button><button class="btn sec" id="cclr">'+t('comments.clear')+'</button></div>'
    +'</div><div id="clist" style="margin-top:14px"></div>';
  const paint=()=>{
    const a=commentsGet();
    $('clist').innerHTML=
      '<div class="cstats"><span class="chip b">'+a.length+' '+t('comments.count')+'</span>'
      +(a.length?'<span class="chip g">'+t('comments.last')+' '+esc(cFmt(a[0].at))+'</span>':'')
      +'</div>'
      +(a.length?a.map(c=>'<div class="cmt"><div class="ch"><span class="cn">'+esc(c.name||t('comments.anon'))
        +' <span class="chip" style="background:var(--soft);color:var(--blue2)">'+esc(c.tag||t('comments.about'))+'</span></span>'
        +'<span class="cd">'+esc(cFmt(c.at))+'</span></div><p>'+esc(c.text)+'</p>'
        +'<div class="crow"><button data-del="'+esc(c.id)+'">'+t('btn.delete')+'</button></div></div>').join('')
        :'<p class="empty">'+t('comments.empty')+'</p>');
    $('clist').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
      if(confirm(t('comments.confirmDel'))){commentsSet(commentsGet().filter(c=>c.id!==b.dataset.del));paint()}
    });
  };
  $('cadd').onclick=()=>{
    const tx=$('ctext').value.trim();
    if(tx.length<2){$('ctext').focus();return}
    const a=commentsGet();
    a.unshift({id:String(Date.now())+Math.random().toString(36).slice(2,6),name:$('cname').value.trim().slice(0,40),text:tx,tag:$('ctag').value,at:new Date().toISOString()});
    commentsSet(a); $('ctext').value=''; paint();
  };
  $('cclr').onclick=()=>{ if(confirm(t('comments.confirmClr'))){commentsSet([]);paint();} };
  paint();
}

/* ===================== المساعد الذكي ===================== */
function renderSmart(){
  const el=$('p-smart'); if(!el) return;
  const trk=currentTrack();
  if(!trk){el.innerHTML='<p class="empty">'+t('smart.noTrack')+'</p>';return}
  const letters=trk.dist?DATA.dist[trk.dist].map(d=>d.g):[];
  let h='<div class="smart">';
  h+='<div class="note" style="margin:0">'+t('smart.lead')+'</div>';
  h+='<div class="smart-in">';
  h+='<div><label for="sname">'+t('smart.ph')+'</label><input type="text" id="sname" dir="ltr" style="text-align:left" placeholder="EX: CHRAIM" autocomplete="off" inputmode="latin"></div>';
  if(letters.length) h+='<div><label for="sgrp">'+t('smart.group')+'</label><select id="sgrp"><option value="">—</option>'+letters.map(x=>'<option>'+x+'</option>').join('')+'</select></div>';
  h+='<div style="display:flex;align-items:end"><button class="btn" id="sgo" style="width:100%">'+t('smart.go')+'</button></div>';
  h+='</div><div id="sOut"></div></div>';
  el.innerHTML=h;
  $('sgo').onclick=()=>{ const run=()=>smartBuild(trk); if(guard(run)) run(); };
  if($('sname')) $('sname').addEventListener('keydown',e=>{if(e.key==='Enter')$('sgo').click()});
}
function smartBuild(trk){
  const out=$('sOut'); if(!out) return;
  let grp=$('sgrp')?$('sgrp').value:'';
  let extra='', note='', name='';
  const q=$('sname')?$('sname').value.trim():'';
  if(!grp && q && normSurname(q).length>=2 && trk.dist){
    const r=findGroup(DATA.dist[trk.dist],q); grp=r.d.g; note=r.note; name=normSurname(q);
    if(trk.distEn){const e=findGroup(DATA.dist[trk.distEn],q); extra=e.d.g;}
  }
  if(!grp && trk.dist && !q){ out.innerHTML='<p class="empty">'+t('msg.need2')+'</p>'; return; }
  const c={track:trk,grp:grp,extra:extra,name:name};
  state.last=c;
  const list=sessionsFor(trk,grp,extra);
  const subs={};
  list.forEach(s=>{const k=s.s+'||'+(s.p||''); (subs[k]=subs[k]||{s:s.s,p:s.p,n:0,r:new Set()}); subs[k].n++; if(s.r)subs[k].r.add(s.r)});
  const subj=Object.values(subs).sort((a,b)=>String(a.s).localeCompare(String(b.s)));
  const rooms=uniq(list.map(s=>s.r).filter(Boolean));
  let h='<div class="smartcard"><div class="sc-head"><div><b>'+t('smart.title')+'</b><div class="muted" style="color:#cfd6e6">'+esc(ctxTitle(c))+(name?' · <span dir="ltr">'+esc(name)+'</span>':'')+'</div></div><div><span class="chip">'+esc(grp||'A')+'</span></div></div>';
  h+='<div class="sc-grid">';
  h+='<div><div class="k">'+t('lbl.group')+'</div><div class="v">'+esc(grp||'A')+'</div></div>';
  if(extra) h+='<div><div class="k">'+(trk.id==='s3_public'?t('lbl.french'):t('lbl.english'))+'</div><div class="v">'+esc(extra)+'</div></div>';
  h+='<div><div class="k">'+t('hdr.tt')+'</div><div class="v">'+list.length+'</div></div>';
  h+='<div><div class="k">'+t('smart.rooms')+'</div><div class="v">'+rooms.length+'</div></div>';
  h+='</div>';
  if(note) h+='<div class="warnbox" style="margin:12px 16px 0">'+esc(note)+'</div>';
  h+='<div class="sc-stats"><button class="btn" id="sTT">'+t('btn.showTT')+'</button><button class="btn sec" id="sSave">'+t('btn.saveGrp')+'</button></div>';
  h+='<div style="padding:0 16px 16px"><div class="sec-t">'+t('smart.subjects')+'</div><div class="scroll"><table><tr><th>'+t('th.course')+'</th><th>'+t('th.prof')+'</th><th>'+t('th.count')+'</th><th>'+t('smart.rooms')+'</th></tr>'+
    (subj.length?subj.map(x=>'<tr><td>'+esc(x.s)+'</td><td>'+esc(x.p||'—')+'</td><td>'+x.n+'</td><td class="muted">'+esc([...x.r].join('، ')||'—')+'</td></tr>').join(''):'<tr><td colspan="4" class="muted">'+t('msg.noSessions')+'</td></tr>')+
    '</table></div>';
  h+='<div class="sec-t">'+t('smart.week')+'</div>'+sessionsHTML(list,{showG:!grp&&trk.lang==='ar'});
  h+='<div class="sec-t">'+t('smart.rooms')+'</div><div class="kv">'+(rooms.length?rooms.map(r=>'<span class="chip g">🏛️ '+esc(r)+'</span>').join(''):'<span class="muted">—</span>')+'</div>';
  h+='</div>'+srcNote(trk)+'</div>';
  out.innerHTML=h;
  $('sTT').onclick=()=>showDetail(c);
  $('sSave').onclick=()=>{saveMine(c);$('sSave').textContent=t('btn.saved')};
}

/* ===================== شريط التقدّم + الرجوع لأعلى ===================== */
function initScrollUI(){
  const bar=document.querySelector('#progress i');
  const top=$('totop');
  const upd=()=>{
    const h=document.documentElement, max=h.scrollHeight-h.clientHeight;
    if(bar) bar.style.width=(max>0?(h.scrollTop/max*100):0)+'%';
    if(top) top.classList.toggle('on',h.scrollTop>480);
  };
  window.addEventListener('scroll',upd,{passive:true});
  window.addEventListener('resize',upd);
  if(top) top.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  upd();
}

/* ===================== تهيئة ===================== */
(function extraInit(){
  // لغة الواجهة
  document.querySelectorAll('#uilang button').forEach(b=>b.onclick=()=>setUILang(b.dataset.ui));
  // راحة العين
  const comfort=$('comfort');
  const applyComfort=on=>{document.documentElement.setAttribute('data-comfort',on?'on':'off');if(comfort)comfort.classList.toggle('on',!!on)};
  let co=store.get('cc_comfort')==='1'; applyComfort(co);
  if(comfort) comfort.onclick=()=>{co=!co;store.set('cc_comfort',co?'1':'0');applyComfort(co)};
  // زر تثبيت التطبيق (PWA): يظهر فقط إذا أتاح المتصفح التثبيت
  (function installPrompt(){
    const btn=$('install');
    if(!btn) return;
    let evt=null;
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();evt=e;btn.hidden=false});
    btn.addEventListener('click',async()=>{
      btn.hidden=true;
      const p=evt; evt=null;
      try{ if(p){ p.prompt(); await p.userChoice; } }catch(e){}
    });
    window.addEventListener('appinstalled',()=>{btn.hidden=true;evt=null});
  })();
  // ليل/نهار تلقائي مباشر
  try{
    const mq=window.matchMedia('(prefers-color-scheme: dark)');
    const onCh=e=>{ if(!store.get('cc_theme')) setTheme(e.matches?'dark':'light') };
    mq.addEventListener?mq.addEventListener('change',onCh):mq.addListener(onCh);
  }catch(e){}
  // injected hero mouse element (parallax layers)
  const hero=document.querySelector('.hero');
  if(hero){
    const m=document.createElement('div');
    m.className='hero-mouse';
    m.ariaHidden='true';
    hero.insertBefore(m,hero.firstChild);
  }
  // reveal classes for panels on load (stagger entrance)
  const panels=document.querySelectorAll('.panel');
  panels.forEach((p,i)=>{p.classList.add('reveal');p.classList.add('reveal-'+(i+1))});
  setUILang(UILANG);
  setSection((document.querySelector('.tab.on')||{dataset:{}}).dataset.p||'smart');

  // ===== وصولية (WCAG 2.2): نمط ARIA الكامل لمجموعة التبويبات =====
  (function tabsA11y(){
    const list=document.querySelector('.layout .tabs');
    if(!list) return;
    const tabs=[...list.querySelectorAll('.tab')];
    if(!tabs.length) return;
    tabs.forEach(b=>{
      b.setAttribute('role','tab');
      if(!b.id) b.id='tab-'+b.dataset.p;
      const panel=document.getElementById('p-'+b.dataset.p);
      if(panel){
        b.setAttribute('aria-controls',panel.id);
        panel.setAttribute('role','tabpanel');
        panel.setAttribute('aria-labelledby',b.id);
        if(!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex','0');
      }
    });
    const sync=()=>tabs.forEach(b=>{
      const on=b.classList.contains('on');
      b.setAttribute('aria-selected',on?'true':'false');
      b.setAttribute('tabindex',on?'0':'-1');
      const panel=document.getElementById('p-'+b.dataset.p);
      if(panel) panel.setAttribute('aria-hidden',on?'false':'true');
    });
    document.addEventListener('click',sync); // bubble phase → runs after the tab handlers
    list.addEventListener('keydown',e=>{
      const cur=Math.max(0,tabs.findIndex(b=>b.classList.contains('on')));
      let ni=cur;
      if(e.key==='ArrowDown'||e.key==='ArrowRight') ni=(cur+1)%tabs.length;
      else if(e.key==='ArrowUp'||e.key==='ArrowLeft') ni=(cur-1+tabs.length)%tabs.length;
      else if(e.key==='Home') ni=0;
      else if(e.key==='End') ni=tabs.length-1;
      else return;
      e.preventDefault();tabs[ni].focus();tabs[ni].click();
    });
    sync();
  })();
  renderOfficialLinks();
  renderUniversity();
  renderComments();
  initScrollUI();
  if(typeof renderLearn==='function') renderLearn();
  if(typeof initAchieve==='function') initAchieve();
  const cv=document.getElementById('cvPrint');
  if(cv) cv.addEventListener('click',()=>window.print());
  loadCampusAnnouncements();

  // ===== دخول المسؤول المخفي (خاص بالمالك فقط) =====
  // لا يوجد أي رابط ظاهر للوحة. ثلاث طرق: اختصار Ctrl/Cmd+Shift+A، أو 3 نقرات على التذييل، أو فتح #admin.
  // الأمان الحقيقي هو تسجيل الدخول إلى Supabase Auth؛ هذا إخفاء فقط.
  (function ownerAccess(){
    const go=()=>{ location.href='admin.html'; };
    let n=0,timer=null;
    const foot=document.getElementById('siteFooter');
    if(foot) foot.addEventListener('click',()=>{ n++; clearTimeout(timer); timer=setTimeout(()=>{n=0},700); if(n>=3){ n=0; go(); } });
    window.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&e.shiftKey&&(e.key==='A'||e.key==='a')){ e.preventDefault(); go(); } });
    if(location.hash==='#admin') go();
  })();

/* ===================== تحسين التركيز بلوحة المفاتيح ===================== */
document.addEventListener('DOMContentLoaded',()=>{
  const style=document.createElement('style');
  style.textContent=':focus-visible{outline:2px solid var(--gold);outline-offset:2px}';
  document.head.appendChild(style);
});

})();
