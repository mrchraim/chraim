
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
const DAY_I18N={'الإثنين':{ar:'الإثنين',fr:'Lundi',en:'Monday'},'الثلاثاء':{ar:'الثلاثاء',fr:'Mardi',en:'Tuesday'},'الأربعاء':{ar:'الأربعاء',fr:'Mercredi',en:'Wednesday'},'الخميس':{ar:'الخميس',fr:'Jeudi',en:'Thursday'},'الجمعة':{ar:'الجمعة',fr:'Vendredi',en:'Friday'},'السبت':{ar:'السبت',fr:'Samedi',en:'Saturday'}};
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

/* ===================== لغة الواجهة (ar / fr / en) ===================== */
const UI_LANGS=['ar','fr','en'];
let UILANG=(store.get('cc_uilang')||'ar');
if(!UI_LANGS.includes(UILANG)) UILANG='ar';
const dirFor=l=>(l==='ar'?'rtl':'ltr');
const STR={
  'brand.sub':{ar:'غرفة · حرم جامعي',fr:'CHAMBRE · CAMPUS',en:'CHAMBER · CAMPUS'},
  'nav.skip':{ar:'تجاوز إلى المحتوى',fr:'Aller au contenu principal',en:'Skip to main content'},
  'tool.install':{ar:'تثبيت التطبيق',fr:"Installer l'application",en:'Install app'},
  'hero.motto':{ar:'⚖️ قانون · كلية الحقوق · أكادير ⚖️',fr:'⚖️ LEX · FACULTÉ DE DROIT · AGADIR ⚖️',en:'⚖️ LEX · FACULTY OF LAW · AGADIR ⚖️'},
  'hero.h1a':{ar:'دليل الطلبة',fr:'Guide des étudiants',en:'Students Guide'},
  'hero.h1b':{ar:'أكادير',fr:'Agadir',en:'Agadir'},
  'hero.p':{ar:'دليل الطالب بكلية العلوم القانونية والسياسية — الموسم الجامعي 2026-2027. اكتب لقبك العائلي، لقا فوجك واستعمال الزمن ديالك فثواني.',fr:'Guide de l\'étudiant à la Faculté des sciences juridiques et politiques — année universitaire 2026-2027. Saisissez votre nom, trouvez votre groupe et votre emploi du temps en quelques secondes.',en:'Student guide for the Faculty of Law and Political Science — academic year 2026-2027. Type your surname to find your group and timetable in seconds.'},
  'hero.chip':{ar:'⚠️ موقع مستقل غير رسمي · المصدر الرسمي هو موقع الكلية',fr:'⚠️ Site indépendant non officiel · La source officielle est le site de la faculté',en:'⚠️ Independent, unofficial site · The official source is the faculty website'},
  'hero.founder':{ar:'من تطوير <b>محمد شرايم</b> · مؤسس CHRVVIM',fr:'Développé par <b>Mohamed Chraim</b> · fondateur de CHRVVIM',en:'Built by <b>Mohamed Chraim</b> · founder of CHRVVIM'},
  'stat.tracks':{ar:'مسلك ومسار',fr:'filières & parcours',en:'tracks & paths'},
  'stat.sessions':{ar:'حصة',fr:'séances',en:'sessions'},
  'stat.profs':{ar:'أستاذ',fr:'professeurs',en:'professors'},
  'cfg.lang':{ar:'لغة الدراسة',fr:'Langue d\'étude',en:'Study language'},
  'cfg.sem':{ar:'السداسي',fr:'Semestre',en:'Semester'},
  'cfg.track':{ar:'المسلك / المسار',fr:'Filière / Parcours',en:'Track / Path'},
  'lang.ar':{ar:'العربية',fr:'Arabe',en:'Arabic'},
  'lang.fr':{ar:'Français',fr:'Français',en:'French'},
  'tab.smart':{ar:'🧠 المساعد الذكي',fr:'🧠 Assistant intelligent',en:'🧠 Smart Assistant'},
  'tab.search':{ar:'🔎 البحث عن فوجي',fr:'🔎 Chercher mon groupe',en:'🔎 Find my group'},
  'tab.tt':{ar:'🗓️ استعمال الزمن',fr:'🗓️ Emploi du temps',en:'🗓️ Timetable'},
  'tab.prof':{ar:'👨‍🏫 الأساتذة والمواد',fr:'👨‍🏫 Professeurs & matières',en:'👨‍🏫 Professors & courses'},
  'tab.rooms':{ar:'🏛️ القاعات',fr:'🏛️ Salles',en:'🏛️ Rooms'},
  'tab.dist':{ar:'📋 توزيع الأفواج',fr:'📋 Répartition des groupes',en:'📋 Group distribution'},
  'tab.docs':{ar:'📜 الوثائق',fr:'📜 Documents',en:'📜 Documents'},
  'tab.gpa':{ar:'🧮 حاسبة المعدل',fr:'🧮 Calculateur de moyenne',en:'🧮 GPA calculator'},
  'tab.subjects':{ar:'📚 المواد والمقابلات',fr:'📚 Matières & correspondances',en:'📚 Subjects & correspondences'},
  'tab.legal':{ar:'⚖️ المكتبة القانونية',fr:'⚖️ Bibliothèque juridique',en:'⚖️ Legal library'},
  'tab.comments':{ar:'💬 التعاليق',fr:'💬 Commentaires',en:'💬 Comments'},
  'tab.about':{ar:'✦ عن المؤسس',fr:'✦ À propos du fondateur',en:'✦ About the founder'},
  'nav.title':{ar:'⚖️  أقسام المنصة',fr:'⚖️  Sections de la plateforme',en:'⚖️  Platform sections'},
  'tab.learn':{ar:'✍️ ورشة التعلّم',fr:'✍️ Espace d\'apprentissage',en:'✍️ Learning Workspace'},
  'tab.stats':{ar:'📊 إحصائيات',fr:'📊 Statistiques',en:'📊 Statistics'},
  'stats.lead':{ar:'نظرة عامة على محتوى المنصة: المسالك، الحصص، الأساتذة، القاعات، المواد، الوثائق وتوزيعات الأفواج. الأرقام محسوبة مباشرة من البيانات المعروضة.',fr:'Aperçu du contenu de la plateforme : filières, séances, professeurs, salles, matières, documents et répartitions. Les chiffres sont calculés à partir des données affichées.',en:'Overview of the platform content: tracks, sessions, professors, rooms, subjects, documents and group distributions. Figures are computed from the displayed data.'},
  'stats.rooms':{ar:'قاعة',fr:'salles',en:'rooms'},
  'stats.subjects':{ar:'مادة',fr:'matières',en:'subjects'},
  'stats.docs':{ar:'وثيقة',fr:'documents',en:'documents'},
  'stats.groups':{ar:'فوج',fr:'groupes',en:'groups'},
  'stats.bySem':{ar:'التوزيع حسب السداسي',fr:'Répartition par semestre',en:'Breakdown by semester'},
  'stats.byLang':{ar:'التوزيع حسب لغة الدراسة',fr:'Répartition par langue d\'étude',en:'Breakdown by study language'},
  'stats.tracksTitle':{ar:'قائمة المسالك والمسارات',fr:'Liste des filières et parcours',en:'List of tracks and paths'},
  'stats.tracksCol':{ar:'عدد المسالك',fr:'Filières',en:'Tracks'},
  'th.semester':{ar:'السداسي',fr:'Semestre',en:'Semester'},
  'th.language':{ar:'اللغة',fr:'Langue',en:'Language'},
  'th.sessions':{ar:'الحصص',fr:'Séances',en:'Sessions'},
  'learn.lead':{ar:'ورشة التعلّم: ملخصات وموارد دراسية مختارة لمساعدتك على المراجعة. اضغط على أي مورد لفتحه (PDF).',fr:'Espace d\'apprentissage : résumés et ressources sélectionnés pour réviser. Cliquez sur une ressource pour l\'ouvrir (PDF).',en:'Learning workspace: selected summaries and study resources. Click a resource to open it (PDF).'},
  'learn.materials':{ar:'الموارد الدراسية',fr:'Ressources d\'étude',en:'Study resources'},
  'learn.tips':{ar:'نصيحة: راجع جدولك من قسم «استعمال الزمن»، وتحقق دائماً من النسخة الرسمية للكلية.',fr:'Conseil : consultez votre emploi du temps dans la section dédiée et vérifiez toujours la version officielle de la faculté.',en:'Tip: check your timetable in its section and always verify the faculty\'s official version.'},
  'ann.none':{ar:'ما كاين حتى إعلان منشور حالياً.',fr:'Aucune annonce publiée pour le moment.',en:'No published announcements yet.'},
  'ann.count':{ar:'عدد الإعلانات المنشورة:',fr:'Annonces publiées :',en:'Published announcements:'},
  'ann.error':{ar:'تعذر تحميل إعلانات المنصة حالياً.',fr:'Impossible de charger les annonces de la plateforme pour le moment.',en:'Could not load platform announcements right now.'},
  'btn.search':{ar:'بحث',fr:'Rechercher',en:'Search'},
  'btn.show':{ar:'عرض',fr:'Afficher',en:'Show'},
  'btn.showTT':{ar:'🗓️ عرض استعمال الزمن',fr:'🗓️ Voir l\'emploi du temps',en:'🗓️ Show timetable'},
  'btn.saveGrp':{ar:'⭐ احفظ فوجي',fr:'⭐ Enregistrer mon groupe',en:'⭐ Save my group'},
  'btn.saved':{ar:'✓ تم الحفظ',fr:'✓ Enregistré',en:'✓ Saved'},
  'btn.saveMyGrp':{ar:'⭐ خليه فوجي',fr:'⭐ Définir comme mon groupe',en:'⭐ Set as my group'},
  'btn.whatsapp':{ar:'📤 فواتساب',fr:'📤 WhatsApp',en:'📤 WhatsApp'},
  'btn.copy':{ar:'📋 نسخ',fr:'📋 Copier',en:'📋 Copy'},
  'btn.copied':{ar:'✓ تم النسخ',fr:'✓ Copié',en:'✓ Copied'},
  'btn.copyFail':{ar:'تعذر النسخ',fr:'Copie impossible',en:'Copy failed'},
  'btn.close':{ar:'إغلاق',fr:'Fermer',en:'Close'},
  'btn.saveAsGrp':{ar:'⭐ احفظ كفوجي',fr:'⭐ Enregistrer comme mon groupe',en:'⭐ Save as my group'},
  'btn.addCourse':{ar:'➕ إضافة مادة',fr:'➕ Ajouter une matière',en:'➕ Add course'},
  'btn.clearAll':{ar:'مسح الكل',fr:'Tout effacer',en:'Clear all'},
  'btn.delete':{ar:'حذف',fr:'Supprimer',en:'Delete'},
  'btn.print':{ar:'🖨️ طباعة / حفظ PDF',fr:'🖨️ Imprimer / PDF',en:'🖨️ Print / PDF'},
  'btn.contact':{ar:'💬 راسلني على واتساب',fr:'💬 Contactez-moi sur WhatsApp',en:'💬 Message me on WhatsApp'},
  'lbl.surname':{ar:'اللقب العائلي بالحروف اللاتينية (كما يظهر في اللائحة الرسمية)',fr:'Nom de famille en lettres latines (comme sur la liste officielle)',en:'Surname in Latin letters (as on the official list)'},
  'ph.surname':{ar:'Ex : CHRAIM ou EL MANSOURI ou AIT BACH',fr:'Ex : CHRAIM ou EL MANSOURI ou AIT BACH',en:'Ex: CHRAIM or EL MANSOURI or AIT BACH'},
  'hint.surname':{ar:'اكتب اللقب فقط (بدون الاسم الشخصي). الأسماء المركبة مثل «EL» و«AIT» تكتب بفراغ كما في اللائحة.',fr:'Saisissez le nom de famille uniquement. Les noms composés comme « EL » et « AIT » s\'écrivent avec un espace comme sur la liste.',en:'Enter the surname only. Compound names like "EL" and "AIT" are written with a space, as on the list.'},
  'msg.need2':{ar:'اكتب حرفين على الأقل من لقبك بالحروف اللاتينية.',fr:'Saisissez au moins deux lettres de votre nom en lettres latines.',en:'Enter at least two letters of your surname in Latin letters.'},
  'msg.noData':{ar:'لا توجد بيانات منشورة لهذا السداسي بهذه اللغة بعد.',fr:'Aucune donnée publiée pour ce semestre dans cette langue.',en:'No published data for this semester in this language yet.'},
  'msg.frUnified':{ar:'هذا الجدول موحد لكل طلبة هذا المسلك (قسم الفرنسية). لا يوجد توزيع بالأفواج في الوثائق المنشورة.',fr:'Cet emploi du temps est commun à tous les étudiants (section française). Aucune répartition par groupes dans les documents publiés.',en:'This timetable is common to all students (French section). No group distribution in the published documents.'},
  'msg.oneGroup':{ar:'هذا المسار فوج واحد (A) في الوثائق المنشورة، فلا حاجة للبحث بالاسم.',fr:'Ce parcours est un groupe unique (A) dans les documents publiés : pas besoin de chercher par nom.',en:'This path is a single group (A) in the published documents; no need to search by name.'},
  'lbl.surnameIs':{ar:'اللقب',fr:'Nom',en:'Surname'},
  'lbl.group':{ar:'الفوج',fr:'Groupe',en:'Group'},
  'lbl.subgroups':{ar:'المجموعات',fr:'Sous-groupes',en:'Subgroups'},
  'lbl.french':{ar:'الفرنسية',fr:'Français',en:'French'},
  'lbl.english':{ar:'الإنجليزية',fr:'Anglais',en:'English'},
  'note.calc':{ar:'النتيجة محسوبة من حدود الألقاب المنشورة. إذا اختلفت مع اللائحة المعلقة فاللائحة الرسمية هي المعتمدة.',fr:'Le résultat est calculé à partir des bornes de noms publiées. En cas de divergence, la liste officielle prévaut.',en:'Result computed from published surname ranges. If it differs, the official list prevails.'},
  'note.before':{ar:'اللقب يسبق أول لقب في اللائحة، النتيجة تقريبية.',fr:'Le nom précède le premier de la liste : résultat approximatif.',en:'The surname precedes the first in the list; the result is approximate.'},
  'note.after':{ar:'اللقب يأتي بعد آخر لقب منشور في التوزيع، النتيجة تقريبية.',fr:'Le nom suit le dernier publié : résultat approximatif.',en:'The surname comes after the last published one; the result is approximate.'},
  'today.title':{ar:'📅 حصص اليوم',fr:'📅 Séances d\'aujourd\'hui',en:'📅 Today\'s sessions'},
  'today.sun':{ar:' (الأحد — عطلة)',fr:' (dimanche — repos)',en:' (Sunday — off)'},
  'today.none':{ar:'لا توجد حصص اليوم 🎉',fr:'Aucune séance aujourd\'hui 🎉',en:'No sessions today 🎉'},
  'today.tag':{ar:'اليوم',fr:'aujourd\'hui',en:'today'},
  'msg.noSessions':{ar:'لا توجد حصص.',fr:'Aucune séance.',en:'No sessions.'},
  'msg.noSessionsChoice':{ar:'لا توجد حصص منشورة لهذا الاختيار.',fr:'Aucune séance publiée pour ce choix.',en:'No published sessions for this choice.'},
  'hdr.tt':{ar:'🗓️ استعمال الزمن',fr:'🗓️ Emploi du temps',en:'🗓️ Timetable'},
  'hdr.myGrp':{ar:'⭐ فوجي',fr:'⭐ Mon groupe',en:'⭐ My group'},
  'btn.viewTT':{ar:'شوف استعمال الزمن',fr:'Voir l\'emploi du temps',en:'View timetable'},
  'msg.pickGroup':{ar:'اختر الفوج ثم اضغط «عرض».',fr:'Choisissez le groupe puis cliquez sur « Afficher ».',en:'Choose the group then click "Show".'},
  'lbl.frGroup':{ar:'فوج الفرنسية',fr:'Groupe français',en:'French group'},
  'lbl.enGroup':{ar:'فوج الإنجليزية',fr:'Groupe anglais',en:'English group'},
  'msg.noResults':{ar:'لا نتائج.',fr:'Aucun résultat.',en:'No results.'},
  'hdr.searchResults':{ar:'نتائج البحث',fr:'Résultats de recherche',en:'Search results'},
  'hdr.trackCourses':{ar:'مواد المسلك المختار',fr:'Matières de la filière',en:'Courses of the selected track'},
  'th.course':{ar:'المادة',fr:'Matière',en:'Course'},
  'th.prof':{ar:'الأستاذ',fr:'Professeur',en:'Professor'},
  'th.count':{ar:'عدد الحصص',fr:'Nb séances',en:'Sessions'},
  'th.track':{ar:'المسلك',fr:'Filière',en:'Track'},
  'th.room':{ar:'القاعة',fr:'Salle',en:'Room'},
  'th.rooms':{ar:'المواد',fr:'Matières',en:'Courses'},
  'prof.searchIn':{ar:'ابحث عن أستاذ أو مادة (في كل مسالك',fr:'Chercher un professeur ou une matière (dans toutes les filières',en:'Search a professor or course (in all tracks'},
  'prof.phAr':{ar:'مثال: اطويف أو التأمين',fr:'ex : AZZI ou Droit social',en:'e.g. AZZI or Droit social'},
  'prof.phFr':{ar:'ex : AZZI ou Droit social',fr:'ex : AZZI ou Droit social',en:'e.g. AZZI or Droit social'},
  'msg.roomsIn':{ar:'القاعات المستعملة في:',fr:'Salles utilisées dans :',en:'Rooms used in:'},
  'msg.noDist':{ar:'لا يوجد توزيع بالأفواج منشور لهذا المسلك.',fr:'Aucune répartition de groupes publiée pour cette filière.',en:'No group distribution published for this track.'},
  'dist.fr':{ar:'أقسام الفرنسية',fr:'Sections françaises',en:'French sections'},
  'dist.en':{ar:'أقسام الإنجليزية',fr:'Sections anglaises',en:'English sections'},
  'dist.rule':{ar:'القاعدة المعتمدة في اللوائح: الأسماء المركبة والمصحوبة بفراغ (مثل EL MANSOURI) تأتي دائماً قبل الأسماء المتصلة (مثل ELOUARDI).',fr:'Règle des listes : les noms composés avec espace (ex. EL MANSOURI) précèdent toujours les noms collés (ex. ELOUARDI).',en:'List rule: compound names with a space (e.g. EL MANSOURI) always precede joined names (e.g. ELOUARDI).'},
  'docs.banner':{ar:'📄 هذه الوثائق نسخ أرشيفية عن الوثائق الرسمية للكلية. للنسخة الرسمية الأصلية يُرجى الرجوع إلى',fr:'📄 Ces documents sont des copies d\'archive des documents officiels. Pour l\'original officiel, consultez',en:'📄 These documents are archived copies of the official ones. For the official original, refer to'},
  'docs.banner2':{ar:'موقع الكلية',fr:'le site de la faculté',en:'the faculty website'},
  'docs.banner3':{ar:'. عند أي اختلاف، الوثيقة الرسمية هي المرجع.',fr:'. En cas de divergence, le document officiel fait foi.',en:'. In case of divergence, the official document prevails.'},
  'docs.note':{ar:'الوثائق الأصلية كما صدرت عن الكلية (PDF). <b>آخر مزامنة مع المصدر الرسمي: 12 أكتوبر 2026</b>، مع تحديث النسخ التي عدّلتها الإدارة.',fr:'Documents originaux publiés par la faculté (PDF). <b>Dernière synchro : 12 octobre 2026</b>, avec mise à jour des versions modifiées par l\'administration.',en:'Original documents as issued by the faculty (PDF). <b>Last sync: 12 October 2026</b>, including versions updated by the administration.'},
  'docs.sem':{ar:'السداسي',fr:'Semestre',en:'Semester'},
  'docs.kind':{ar:'النوع',fr:'Type',en:'Type'},
  'docs.all':{ar:'الكل',fr:'Tous',en:'All'},
  'docs.kTT':{ar:'استعمالات الزمن',fr:'Emplois du temps',en:'Timetables'},
  'docs.kDist':{ar:'توزيع الأفواج',fr:'Répartition des groupes',en:'Group distribution'},
  'docs.kLib':{ar:'📚 مكتبة المذاكرة',fr:'📚 Bibliothèque d\'étude',en:'📚 Study library'},
  'docs.kindTT':{ar:'استعمال الزمن',fr:'Emploi du temps',en:'Timetable'},
  'docs.kindDist':{ar:'توزيع الأفواج',fr:'Répartition',en:'Distribution'},
  'docs.kindLib':{ar:'📚 مذاكرة',fr:'📚 Étude',en:'📚 Study'},
  'docs.updated':{ar:'🔄 محدّث',fr:'🔄 Mis à jour',en:'🔄 Updated'},
  'docs.libNote':{ar:'📚 <b>مكتبة المذاكرة</b> — ملخصات ومؤلفات قانونية أُضيفت لمساعدتك على الفهم والتحصيل. هذه الوثائق <b>ليست وثائق رسمية</b> عن الكلية، وهي للاستعمال الشخصي في الدراسة.',fr:'📚 <b>Bibliothèque d\'étude</b> — résumés et ouvrages juridiques pour vous aider à comprendre. Ces documents <b>ne sont pas officiels</b> ; usage personnel.',en:'📚 <b>Study library</b> — summaries and legal works to help you understand. These documents are <b>not official</b>; personal use.'},
  'docs.none':{ar:'لا توجد وثائق.',fr:'Aucun document.',en:'No documents.'},
  'gpa.note':{ar:'أدخل نقطة كل مادة (على 20) ومعاملها لتحصل على المعدل الموزون. الحساب يتم داخل متصفحك ولا يحفظ شيئاً.',fr:'Entrez la note de chaque matière (sur 20) et son coefficient pour obtenir la moyenne pondérée. Le calcul se fait dans votre navigateur, sans rien enregistrer.',en:'Enter each course grade (out of 20) and its coefficient to get the weighted average. Calculated in your browser, nothing saved.'},
  'gpa.course':{ar:'المادة',fr:'Matière',en:'Course'},
  'gpa.grade':{ar:'النقطة /20',fr:'Note /20',en:'Grade /20'},
  'gpa.coef':{ar:'المعامل',fr:'Coefficient',en:'Coefficient'},
  'gpa.result':{ar:'المعدل الموزون',fr:'Moyenne pondérée',en:'Weighted average'},
  'comments.banner':{ar:'💬 <b>منصة تعاليق الطلبة</b> — التعاليق كتُحفظ فهاد المتصفح/الجهاز فقط، ما كيتشوفهاش ولا كيوصلها حتى حد آخر. ما تكتبش معلومات شخصية حساسة.',fr:'💬 <b>Espace commentaires</b> — vos commentaires restent uniquement sur ce navigateur/appareil ; personne d\'autre ne les voit. N\'écrivez pas d\'informations personnelles sensibles.',en:'💬 <b>Student comments</b> — your comments stay only on this browser/device; nobody else sees them. Do not write sensitive personal information.'},
  'comments.name':{ar:'الاسم (اختياري)',fr:'Nom (optionnel)',en:'Name (optional)'},
  'comments.about':{ar:'حول',fr:'À propos',en:'About'},
  'comments.text':{ar:'تعليقك',fr:'Votre commentaire',en:'Your comment'},
  'comments.ph':{ar:'شارك ملاحظة، سؤال، أو نصيحة لزملائك…',fr:'Partagez une remarque, une question ou un conseil…',en:'Share a note, question, or tip…'},
  'comments.post':{ar:'➕ نشر التعليق',fr:'➕ Publier',en:'➕ Post'},
  'comments.clear':{ar:'🗑️ مسح تعاليقي',fr:'🗑️ Effacer mes commentaires',en:'🗑️ Clear my comments'},
  'comments.anon':{ar:'طالب مجهول',fr:'Étudiant anonyme',en:'Anonymous student'},
  'comments.count':{ar:'تعليق',fr:'commentaire(s)',en:'comment(s)'},
  'comments.last':{ar:'آخر تعليق:',fr:'Dernier :',en:'Latest:'},
  'comments.empty':{ar:'مازال ما كاين حتى تعليق. كون أول واحد 💬',fr:'Aucun commentaire encore. Soyez le premier 💬',en:'No comments yet. Be the first 💬'},
  'comments.confirmDel':{ar:'متأكد من حذف هاد التعليق؟',fr:'Supprimer ce commentaire ?',en:'Delete this comment?'},
  'comments.confirmClr':{ar:'تأكيد مسح جميع تعاليقك من هذا المتصفح؟',fr:'Effacer tous vos commentaires de ce navigateur ?',en:'Clear all your comments from this browser?'},
  'comments.topics':{ar:'عام|البحث عن فوجي|استعمال الزمن|الأساتذة|القاعات|توزيع الأفواج|الوثائق|حاسبة المعدل',fr:'Général|Chercher mon groupe|Emploi du temps|Professeurs|Salles|Répartition|Documents|Moyenne',en:'General|Find my group|Timetable|Professors|Rooms|Distribution|Documents|GPA'},
  'smart.title':{ar:'🧠 المساعد الذكي — بطاقتك الشاملة',fr:'🧠 Assistant intelligent — votre fiche complète',en:'🧠 Smart assistant — your full card'},
  'smart.lead':{ar:'كتب اللقب العائلي (أو اختر الفوج) → نخرّج ليك بطاقة ذكية فيها المواد والأساتذة والتوقيت والقاعات، من السداسي والفوج والشعبة بالضبط.',fr:'Saisissez votre nom (ou choisissez un groupe) → une fiche intelligente avec matières, professeurs, horaires et salles, selon le semestre, le groupe et la filière.',en:'Type your surname (or pick a group) → a smart card with courses, professors, times and rooms, exactly per semester, group and track.'},
  'smart.ph':{ar:'اللقب العائلي (Ex : CHRAIM)',fr:'Nom de famille (Ex : CHRAIM)',en:'Surname (Ex: CHRAIM)'},
  'smart.group':{ar:'أو الفوج',fr:'ou groupe',en:'or group'},
  'smart.go':{ar:'🧠 استخرج بطاقتي',fr:'🧠 Générer ma fiche',en:'🧠 Generate my card'},
  'smart.track':{ar:'المسلك',fr:'Filière',en:'Track'},
  'smart.sem':{ar:'السداسي',fr:'Semestre',en:'Semester'},
  'smart.subjects':{ar:'المواد والأساتذة',fr:'Matières & professeurs',en:'Courses & professors'},
  'smart.week':{ar:'التوقيت الأسبوعي الدقيق',fr:'Emploi du temps hebdomadaire',en:'Exact weekly timetable'},
  'smart.rooms':{ar:'القاعات',fr:'Salles',en:'Rooms'},
  'smart.hours':{ar:'ساعة أسبوعياً',fr:'h/semaine',en:'h/week'},
  'smart.noTrack':{ar:'لا توجد بيانات منشورة لهذا السداسي بهذه اللغة.',fr:'Aucune donnée publiée pour ce semestre dans cette langue.',en:'No published data for this semester in this language.'},
  'gpa.g1':{ar:'ممتاز',fr:'Excellent',en:'Excellent'},
  'gpa.g2':{ar:'حسن جداً',fr:'Très bien',en:'Very good'},
  'gpa.g3':{ar:'حسن',fr:'Bien',en:'Good'},
  'gpa.g4':{ar:'مستحسن',fr:'Passable',en:'Pass'},
  'gpa.g5':{ar:'غير كافٍ',fr:'Insuffisant',en:'Insufficient'},
  'about.st1':{ar:'مسلك ومسار',fr:'filières & parcours',en:'tracks & paths'},
  'about.st2':{ar:'حصة منظمة',fr:'séances organisées',en:'organised sessions'},
  'about.st3':{ar:'وثيقة رسمية PDF',fr:'documents PDF',en:'PDF documents'},
  'about.st4':{ar:'سداسيات S1·S3·S5',fr:'semestres S1·S3·S5',en:'semesters S1·S3·S5'},
  'about.proj1':{ar:'دليل الطالب: تحديد الفوج من اللقب، استعمالات الزمن، الأساتذة والقاعات، الوثائق الرسمية وحاسبة المعدل.',fr:'Guide étudiant : trouver son groupe par le nom, emplois du temps, professeurs et salles, documents officiels et calculateur de moyenne.',en:'Student guide: find your group by surname, timetables, professors and rooms, official documents and GPA calculator.'},
  'about.proj2':{ar:'مبادرة رقمية موازية على إنستغرام (@riqqa.ma) لمحتوى طلابي ومعرفي.',fr:'Initiative numérique sur Instagram (@riqqa.ma) : contenu étudiant et pédagogique.',en:'Digital initiative on Instagram (@riqqa.ma) with student and educational content.'},
  'about.proj3':{ar:'كتابة قانونية وأدبية وفلسفية، ونشر للوعي القانوني على المنصات الاجتماعية.',fr:'Écriture juridique, littéraire et philosophique ; diffusion de la conscience juridique sur les réseaux.',en:'Legal, literary and philosophical writing; promoting legal awareness on social platforms.'},
  'about.body':{ar:'طالب في كلية العلوم القانونية والسياسية بأكادير، جامعة ابن زهر، تخصص القانون الخاص باللغة العربية. يجمع بين شغف القانون والكتابة والتقنية، ويطوّر CHRVVIM كمبادرة رقمية تضع المعلومة الجامعية الصحيحة في متناول كل طالب في مكان واحد.',fr:'Étudiant à la Faculté des sciences juridiques et politiques d\'Agadir (Université Ibn Zohr), spécialité droit privé en arabe. Allie passion du droit, de l\'écriture et de la tech, et développe CHRVVIM pour mettre l\'information universitaire à la portée de chaque étudiant.',en:'Student at the Faculty of Law and Political Science in Agadir (Ibn Zohr University), private law (Arabic). Combines a passion for law, writing and tech, building CHRVVIM to put reliable university information within every student\'s reach.'},
  'about.mission':{ar:'المعلومة الجامعية أقرب، والمسار أوضح',fr:'L\'information universitaire plus proche, le parcours plus clair',en:'University info closer, your path clearer'},
  'about.mission2':{ar:'مساحة طلابية تجمع الجداول والأفواج والإعلانات والموارد، مع احترام دقة المعلومات وبيان ما يحتاج منها إلى تحقق رسمي.',fr:'Un espace étudiant qui réunit emplois du temps, groupes, annonces et ressources, en respectant l\'exactitude et en signalant ce qui nécessite une vérification officielle.',en:'A student space gathering timetables, groups, announcements and resources, respecting accuracy and flagging what needs official verification.'},
  'src.note':{ar:'⚠️ نسخة منقولة هنا للتوضيح وتظل غير رسمية. المصدر الرسمي المعتمد:',fr:'⚠️ Copie reprise ici à titre indicatif, non officielle. Source officielle :',en:'⚠️ Copy shown here for reference, unofficial. Official source:'},
  'src.link':{ar:'الإعلان الرسمي المنشور بموقع الكلية',fr:'l\'annonce officielle publiée sur le site',en:'the official announcement on the faculty site'},
  'src.tail':{ar:'. عند أي اختلاف أو تعارض، الوثيقة واللائحة الرسميتان هما المرجع الوحيد.',fr:'. En cas de divergence, le document et la liste officiels sont la seule référence.',en:'. In case of divergence, the official document and list are the only reference.'},
  'gate.title':{ar:'🔓 باش تكمل البحث',fr:'🔓 Pour continuer la recherche',en:'🔓 To continue searching'},
  'gate.desc':{ar:'تابع الحسابات التالية على إنستغرام (كتفتح فتبويب جديد)، وبعدها غادي يتحل ليك البحث بلا حدود.',fr:'Suivez les comptes ci-dessous sur Instagram (nouvel onglet), puis la recherche sera illimitée.',en:'Follow the accounts below on Instagram (opens a new tab), then search becomes unlimited.'},
  'gate.follow':{ar:'تابع على إنستغرام',fr:'Suivre sur Instagram',en:'Follow on Instagram'},
  'gate.checking':{ar:'تأكد من المتابعة…',fr:'Confirmez le suivi…',en:'Confirming follow…'},
  'gate.ok':{ar:'أكمل البحث ✅',fr:'Continuer ✅',en:'Continue ✅'},
  'gate.later':{ar:'لاحقاً',fr:'Plus tard',en:'Later'},
  'gate.done':{ar:'تم',fr:'Fait',en:'Done'},
  'about.founder':{ar:'محمد شرايم',fr:'Mohamed Chraim',en:'Mohamed Chraim'},
  'about.role':{ar:'طالب قانون · باحث قانوني · كاتب · مطوّر منصة طلابية',fr:'Étudiant en droit · chercheur · auteur · développeur de plateforme',en:'Law student · legal researcher · writer · platform developer'},
  'about.lead':{ar:'أؤمن بأن الوصول إلى المعلومة الأكاديمية الواضحة يساعد الطالب على تنظيم مساره الجامعي، وبأن المعرفة القانونية تبدأ بالبحث الدقيق والتفكير النقدي.',fr:'Je crois qu\'un accès clair à l\'information académique aide l\'étudiant à organiser son parcours, et que la connaissance juridique commence par la recherche précise.',en:'I believe clear access to academic information helps students organise their path, and that legal knowledge starts with precise research.'},
  'about.sec.about':{ar:'نبذة',fr:'À propos',en:'About'},
  'about.sec.path':{ar:'المسار الأكاديمي',fr:'Parcours académique',en:'Academic path'},
  'about.sec.proj':{ar:'المشاريع',fr:'Projets',en:'Projects'},
  'about.sec.interests':{ar:'اهتمامات البحث',fr:'Centres d\'intérêt',en:'Research interests'},
  'about.sec.contact':{ar:'تواصل معي',fr:'Contact',en:'Contact'},
  'learn.title':{ar:'✍️ ورشة التعلّم',fr:'✍️ Espace d\'apprentissage',en:'✍️ Learning Workspace'},
  'learn.lead':{ar:'حط نص الدرس هنا (يمكن تنسخو من PDF أو الكتاب) → نحولو لملخص ذكي، كويزات، بطاقات، وخطة مراجعة. كل شيء يشتغل محليًا بدون إنترنت.',fr:'Collez le texte du cours ici → résumé, quiz, flashcards et plan de révision. Fonctionne entièrement en local.',en:'Paste your lesson text here → get a smart summary, quizzes, flashcards and a revision plan. Works fully offline.'},
  'learn.ph':{ar:'الصق نص الدرس هنا...',fr:'Collez le texte du cours ici...',en:'Paste lesson text here...'},
  'learn.load':{ar:'📄 حط مثال',fr:'📄 Exemple',en:'📄 Load example'},
  'learn.clear':{ar:'🗑️ مسح',fr:'🗑️ Effacer',en:'🗑️ Clear'},
  'learn.generate':{ar:'⚡ توليد',fr:'⚡ Générer',en:'⚡ Generate'},
  'learn.tab.sum':{ar:'ملخص',fr:'Résumé',en:'Summary'},
  'learn.tab.quiz':{ar:'كويز',fr:'Quiz',en:'Quiz'},
  'learn.tab.flash':{ar:'بطاقات',fr:'Flashcards',en:'Flashcards'},
  'learn.tab.plan':{ar:'خطة مراجعة',fr:'Plan de révision',en:'Revision Plan'},
  'learn.tab.check':{ar:'قائمة مراجعة',fr:'Checklist',en:'Checklist'},
  'learn.sum.head':{ar:'ملخص منسّق',fr:'Résumé structuré',en:'Structured summary'},
  'learn.sum.key':{ar:'المفاهيم الرئيسية',fr:'Concepts clés',en:'Key concepts'},
  'learn.sum.def':{ar:'تعريفات',fr:'Définitions',en:'Definitions'},
  'learn.sum.pts':{ar:'نقاط مهمة',fr:'Points importants',en:'Key points'},
  'learn.quiz.qcount':{ar:'عدد الأسئلة',fr:'Nb questions',en:'Questions'},
  'learn.quiz.diff':{ar:'الصعوبة',fr:'Difficulté',en:'Difficulty'},
  'learn.quiz.easy':{ar:'سهل',fr:'Facile',en:'Easy'},
  'learn.quiz.med':{ar:'متوسط',fr:'Moyen',en:'Medium'},
  'learn.quiz.hard':{ar:'صعب',fr:'Difficile',en:'Hard'},
  'learn.quiz.start':{ar:'▶️ ابدأ الكويز',fr:'▶️ Démarrer',en:'▶️ Start quiz'},
  'learn.quiz.restart':{ar:'🔄 إعادة',fr:'🔄 Recommencer',en:'🔄 Restart'},
  'learn.quiz.score':{ar:'النتيجة',fr:'Score',en:'Score'},
  'learn.quiz.correct':{ar:'صحيح',fr:'Correct',en:'Correct'},
  'learn.quiz.wrong':{ar:'خطأ',fr:'Erroné',en:'Wrong'},
  'learn.quiz.explain':{ar:'التفسير',fr:'Explication',en:'Explanation'},
  'learn.quiz.next':{ar:'التالي →',fr:'Suivant →',en:'Next →'},
  'learn.quiz.check':{ar:'تحقق',fr:'Vérifier',en:'Check'},
  'learn.flash.prev':{ar:'← السابق',fr:'← Précédent',en:'← Prev'},
  'learn.flash.next':{ar:'التالي →',fr:'Suivant →',en:'Next →'},
  'learn.flash.flip':{ar:'انقر لتقليب البطاقة',fr:'Cliquer pour retourner',en:'Click to flip'},
  'learn.flash.front':{ar:'السؤال',fr:'Question',en:'Question'},
  'learn.flash.back':{ar:'الجواب',fr:'Réponse',en:'Answer'},
  'learn.plan.title':{ar:'خطة مراجعة مقترحة',fr:'Plan de révision proposé',en:'Suggested revision plan'},
  'learn.plan.day':{ar:'اليوم',fr:'Jour',en:'Day'},
  'learn.plan.focus':{ar:'التركيز',fr:'Focus',en:'Focus'},
  'learn.plan.tasks':{ar:'المهام',fr:'Tâches',en:'Tasks'},
  'learn.check.title':{ar:'قائمة المراجعة',fr:'Liste de révision',en:'Revision checklist'},
  'learn.empty':{ar:'أدخل نص الدرس أولاً، ثم اضغط «توليد».',fr:'Collez d\'abord le texte du cours, puis cliquez sur « Générer ».',en:'Paste the lesson text first, then click "Generate".'},
  'about.disclaimer':{ar:'CHRVVIM منصة طلابية مستقلة وغير رسمية، ولا تمثل جامعة ابن زهر أو الكلية.',fr:'CHRVVIM est une plateforme étudiante indépendante et non officielle, sans lien avec l\'Université Ibn Zohr ou la faculté.',en:'CHRVVIM is an independent, unofficial student platform, not affiliated with Ibn Zohr University or the faculty.'},
  'legal.head':{ar:'⚖️ تنبيه قانوني — موقع مستقل وغير رسمي',fr:'⚖️ Avis juridique — site indépendant et non officiel',en:'⚖️ Legal notice — independent, unofficial site'},
  'legal.p1':{ar:'هذا الموقع مبادرة طلابية مستقلة من تطوير <b>محمد شرايم</b>، وليس الموقع الرسمي لكلية العلوم القانونية والسياسية بجامعة ابن زهر، ولا يمثّلها ولا يتحدّث باسمها بأي شكل من الأشكال.',fr:'Ce site est une initiative étudiante indépendante de <b>Mohamed Chraim</b>. Il n\'est pas le site officiel de la Faculté des sciences juridiques et politiques (Université Ibn Zohr) et ne la représente en aucune façon.',en:'This site is an independent student initiative by <b>Mohamed Chraim</b>. It is not the official site of the Faculty of Law and Political Science (Ibn Zohr University) and does not represent it in any way.'},
  'legal.p2':{ar:'البيانات المعروضة (الجداول، الأفواج، المسارات، الوثائق) منقولة عن الوثائق والإعلانات الرسمية المعلنة من الكلية لأغراض التوضيح والتيسير فقط. <b>المرجع الرسمي الوحيد والمعتمد هو موقع الكلية ووثائقه الأصلية</b>؛ وعند أي اختلاف أو تعارض، تكون النسخة الرسمية المعلنة هي المقدَّمة وحدها.',fr:'Les données (emplois du temps, groupes, filières, documents) sont reprises des documents et annonces officiels, à titre indicatif uniquement. <b>La seule référence officielle est le site de la faculté et ses documents</b> ; en cas de divergence, la version officielle prévaut.',en:'The data shown (timetables, groups, tracks, documents) is taken from official documents and announcements for reference only. <b>The only official reference is the faculty website and its original documents</b>; in case of divergence, the official version prevails.'},
  'legal.sources':{ar:'للمصادر الرسمية المباشرة:',fr:'Sources officielles directes :',en:'Direct official sources:'},
  'legal.archive':{ar:'تمّت أرشفة نسخة من الوثائق الرسمية لأغراض العرض في هذا الموقع. يُرجى دائماً مراجعة المصدر الرسمي للتأكد من آخر تحديث.',fr:'Une copie des documents officiels a été archivée à titre indicatif. Vérifiez toujours la source officielle pour la dernière mise à jour.',en:'A copy of the official documents has been archived for reference. Always check the official source for the latest update.'}
};
const t=k=>{const e=STR[k];return e?(e[UILANG]||e.ar):k};
function applyChrome(){
  const q=(s,r)=>{const e=document.querySelector(s);if(e&&r!==undefined)e.innerHTML=r};
  const set=(s,r)=>{const e=document.querySelector(s);if(e&&r!==undefined)e.textContent=r};
  q('.ab-brand i',t('brand.sub'));
  set('.skip-link',t('nav.skip'));
  set('#installLabel',t('tool.install'));
  set('.hero .motto',t('hero.motto'));
  q('.hero h1',t('hero.h1a')+' <b>'+t('hero.h1b')+'</b>');
  q('.hero>p',t('hero.p'));
  set('.hero .officialchip',t('hero.chip'));
  q('#hf span',t('hero.founder'));
  set('.stat:nth-child(1) span',t('stat.tracks'));
  set('.stat:nth-child(2) span',t('stat.sessions'));
  set('.stat:nth-child(3) span',t('stat.profs'));
  set('label[for=lang]',t('cfg.lang'));
  set('label[for=sem]',t('cfg.sem'));
  set('label[for=track]',t('cfg.track'));
  const langSel=$('lang'); if(langSel){langSel.options[0].textContent=t('lang.ar');langSel.options[1].textContent=t('lang.fr')}
  document.querySelectorAll('.tab').forEach(b=>{b.textContent=t('tab.'+b.dataset.p)});
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
  document.documentElement.lang=l;
  document.documentElement.dir=dirFor(l);
  document.querySelectorAll('#uilang button').forEach(b=>b.classList.toggle('on',b.dataset.ui===l));
  applyChrome();
  try{ fillTracks(); refresh(); renderDocs(); renderGpa(); renderAbout(); renderMine(); renderComments(); renderSmart(); renderStats(); renderLearn(); if(window.Subjects&&$('p-subjects')&&$('p-subjects').classList.contains('on')) window.Subjects.render(); if(window.Legal&&$('p-legal')&&$('p-legal').classList.contains('on')) window.Legal.render(); }catch(e){}
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
  el.innerHTML='<div class="official-banner">'+t('docs.banner')+' <a href="https://fsjpa.uiz.ac.ma/" target="_blank" rel="noopener">'+t('docs.banner2')+'</a>'+t('docs.banner3')+'</div><div class="note" style="margin-top:0">'+t('docs.note')+'</div><div class="grid"><div><label for="dsem">'+t('docs.sem')+'</label><select id="dsem"><option value="">'+t('docs.all')+'</option><option>S1</option><option>S3</option><option>S5</option></select></div><div><label for="dkind">'+t('docs.kind')+'</label><select id="dkind"><option value="">'+t('docs.all')+'</option><option value="tt">'+t('docs.kTT')+'</option><option value="dist">'+t('docs.kDist')+'</option><option value="lib">'+t('docs.kLib')+'</option></select></div></div><div class="dgrid" id="dlist"></div>';
  const run=()=>{
    const s=$('dsem').value,k=$('dkind').value;
    const l=DOCS.filter(d=>(!s||d.s===s||d.k==='lib')&&(!k||d.k===k));
    $('dlist').onclick=e=>{const a=e.target.closest('a.doc');if(a&&openDoc(a.getAttribute('href'))) e.preventDefault()};
    const libNote = (k === 'lib') ? '<p class="note" style="margin:0 0 12px">'+t('docs.libNote')+'</p>' : '';
    const kindChip = d => d.k === 'tt' ? t('docs.kindTT') : d.k === 'dist' ? t('docs.kindDist') : t('docs.kindLib');
    $('dlist').innerHTML = libNote + (l.map(d =>
      '<a class="doc" target="_blank" rel="noopener" href="' + esc(d.f) + '">' +
      '<b' + (d.l === 'fr' ? ' dir="ltr" style="text-align:left"' : '') + '>' + esc(d.t) + '</b>' +
      '<div class="mt"><span class="chip">' + d.s + '</span><span class="chip g">' + kindChip(d) + '</span>' +
      (d.u ? '<span class="chip" style="background:#e6f6ec;color:#0f6b39">'+t('docs.updated')+'</span>' : '') +
      '<span class="muted">PDF · ' + d.kb + ' KB</span></div></a>'
    ).join('') || '<p class="empty">'+t('docs.none')+'</p>');
  };
  $('dsem').onchange=run;$('dkind').onchange=run;run();
}

/* ===== عن المؤسس ===== */
const SOCIALS=window.CHRVVIM.SOCIALS;
const PHOTO="assets/founder.jpg";
function renderAbout(){
  const stats=[[DATA.tracks.length,t('about.st1')],[DATA.tracks.reduce((n,x)=>n+x.sessions.length,0),t('about.st2')],[DOCS.length,t('about.st3')],['3',t('about.st4')]];
  $('p-about').innerHTML='<div class="cv"><div class="cv-hero"><div class="cv-ph"><img src="'+PHOTO+'" alt="'+t('about.founder')+' — CHRVVIM"></div><div><div class="cv-k">FOUNDER · LAW · DIGITAL EDUCATION</div><h2>'+t('about.founder')+'<small>Mohamed Chraim · CHRVVIM ®</small></h2><div class="cv-role">'+t('about.role')+'</div><p class="cv-lead">'+t('about.lead')+'</p><div class="pills"><span>القانون الخاص</span><span>العلوم الجنائية</span><span>الكتابة</span><span>التقنية التعليمية</span></div></div></div>'
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
  if(b.dataset.p==='stats') renderStats();if(b.dataset.p==='learn') renderLearn();if(b.dataset.p==='subjects'&&window.Subjects) window.Subjects.render();if(b.dataset.p==='legal'&&window.Legal) window.Legal.render();
});
function setTheme(t){document.documentElement.dataset.theme=t;$('theme').textContent=t==='dark'?'☀️':'🌙';store.set('cc_theme',t)}
$('theme').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
(function init(){
  $('sTracks').textContent=DATA.tracks.length;
  $('sSess').textContent=DATA.tracks.reduce((n,t)=>n+t.sessions.length,0);
  $('sProf').textContent=uniq(DATA.tracks.flatMap(t=>t.sessions.map(s=>s.p)).filter(Boolean)).length;
  $("hfi").src=PHOTO;$("hf").onclick=()=>{document.querySelectorAll(".tab,.panel").forEach(x=>x.classList.remove("on"));document.querySelector('[data-p=about]').classList.add("on");$("p-about").classList.add("on");$("p-about").scrollIntoView({behavior:"smooth"})};
  fillTracks();refresh();renderAbout();renderDocs();renderGpa();renderMine();renderStats();renderLearn();
  const th=store.get('cc_theme'); if(th==='dark'||(!th&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)) setTheme('dark');
})();


/* ===================== خلفية ديناميكية حسب القسم ===================== */
function setSection(sec){
  if(!sec) return;
  document.documentElement.setAttribute('data-sec',sec);
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{setSection(b.dataset.p); if(b.dataset.p==='stats') renderStats();if(b.dataset.p==='learn') renderLearn();if(b.dataset.p==='subjects'&&window.Subjects) window.Subjects.render();if(b.dataset.p==='legal'&&window.Legal) window.Legal.render();}));

/* ===================== المصادر الرسمية ===================== */
function renderOfficialLinks(){
  const box=document.getElementById('officialLinks'); if(!box) return;
  const items=(window.CHRVVIM&&window.CHRVVIM.OFFICIAL)||[];
  box.innerHTML=items.map(o=>'<a href="'+esc(o.u)+'" target="_blank" rel="noopener"><span class="os">'+esc(o.s)+'</span><span>'+esc(o.t)+'</span></a>').join('')
    +'<a href="https://fsjpa.uiz.ac.ma/" target="_blank" rel="noopener"><span class="os">🌐</span><span>الصفحة الرسمية لكلية العلوم القانونية والسياسية — أكادير</span></a>';
}

/* ===================== إعلانات المنصة (Supabase ← ثابتة ← خادم) ===================== */
async function loadCampusAnnouncements(){
  const status=document.getElementById('campus-announcements-status');
  const list=document.getElementById('campus-announcements-list');
  if(!status||!list) return;
  const paint=items=>{
    if(!items.length){status.textContent=t('ann.none');return}
    status.textContent=t('ann.count')+' '+items.length;
    list.innerHTML=items.map(a=>'<article style="padding:14px;margin:12px 0;border:1px solid var(--line);border-radius:12px;background:var(--soft)"><h3 style="margin:0 0 8px">'+esc(a.title)+'</h3><p style="white-space:pre-wrap;line-height:1.8;margin:0 0 8px">'+esc(a.body||'')+'</p><small class="muted">'+esc(a.updated_at||'')+'</small></article>').join('');
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
  try{paint(items);}catch(e){status.textContent=t('ann.error');}
}

/* ===================== منصة التعاليق (محلية فالمتصفح) ===================== */
const C_TOPICS=()=>t('comments.topics').split('|');
function commentsGet(){try{return JSON.parse(store.get('cc_comments')||'[]')}catch(e){return[]}}
function commentsSet(a){store.set('cc_comments',JSON.stringify((a||[]).slice(0,300)))}
function cFmt(iso){try{const loc=UILANG==='ar'?'ar-MA':(UILANG==='fr'?'fr-MA':'en-GB');return new Date(iso).toLocaleString(loc,{dateStyle:'medium',timeStyle:'short'})}catch(e){return esc(String(iso||''))}}
function renderComments(){
  const el=$('p-comments'); if(!el) return;
  el.innerHTML=
    '<div class="official-banner">'+t('comments.banner')+'</div>'
    +'<div class="cform">'
    +'<div class="grid"><div><label for="cname">'+t('comments.name')+'</label><input type="text" id="cname" maxlength="40" placeholder="'+(UILANG==='ar'?'مثال: يوسف':'e.g. Youssef')+'" autocomplete="off"></div>'
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
