// ==========================================================================
// لوحة إدارة CHRVVIM — منطق مستقل (بدون تبعيات) مع ترجمة ar/fr/en ووضع ليلي.
// يتواصل مع واجهة /api/admin/* على خادم Node. يُظهر شاشة دخول إن لم توجد جلسة.
// ==========================================================================
'use strict';

// --- ترجمة لوحة الإدارة ---------------------------------------------------
const I18N = {
  ar: {
    'adm.docTitle': 'CHRVVIM — الإدارة',
    'adm.brandSub': 'CONTROL PANEL',
    'adm.theme': 'الوضع الليلي', 'adm.themeLight': 'الوضع النهاري',
    'adm.backToSite': 'عودة إلى البوابة',
    'adm.loginTitle': 'تسجيل الدخول الإداري',
    'adm.loginLead': 'واجهة إدارة محمية بجلسة مصادق عليها من الخادم. لا تُعدَّل البيانات دون جلسة صالحة.',
    'adm.email': 'البريد الإلكتروني الإداري', 'adm.password': 'كلمة المرور',
    'adm.loginBtn': 'دخول آمن', 'adm.securityNote': 'لا تشارك كلمة المرور. استخدم HTTPS عند النشر الفعلي.',
    'adm.dashboard': 'لوحة التحكم',
    'adm.dashboardLead': 'إدارة المحتوى الأكاديمي ومراجعة التغييرات قبل نشرها في البوابة العامة.',
    'adm.logout': 'تسجيل الخروج',
    'adm.notice': 'وضع آمن افتراضياً: السجلات الجديدة تبدأ بحالة «مسودة» ولا تظهر في الواجهة العامة حتى تُنشر. يقتصر المحرر على المسودات، والحذف متاح للمدير فقط.',
    'adm.addRecord': 'إضافة سجل', 'adm.search': 'ابحث في السجلات…',
    'adm.allStatuses': 'كل الحالات', 'adm.refresh': 'تحديث', 'adm.loading': 'جارٍ التحميل…',
    'adm.prev': 'السابق', 'adm.next': 'التالي', 'adm.close': 'إغلاق',
    'adm.save': 'حفظ التغييرات', 'adm.cancel': 'إلغاء', 'adm.actions': 'الإجراءات',
    'adm.footerNote': 'سجل التعديلات مخصص للمراجعة التشغيلية. لا تخزّن بيانات الطلبة الشخصية في هذه اللوحة دون حاجة وصلاحيات واضحة.',
    'adm.createTitle': 'إضافة سجل', 'adm.editTitle': 'تعديل سجل', 'adm.edit': 'تعديل', 'adm.delete': 'حذف',
    'adm.confirmDelete': 'هل تريد حذف هذا السجل نهائياً؟ لا يمكن التراجع عن الحذف.',
    'adm.saving': 'جارٍ الحفظ…', 'adm.saved': 'تم حفظ السجل.', 'adm.deleted': 'تم حذف السجل.',
    'adm.publishAll': 'نشر كل المسودات', 'adm.publishedCount': 'تم نشر {n} سجل.',
    'adm.noRecords': 'لا توجد سجلات مطابقة.', 'adm.noUsers': 'لا توجد حسابات.', 'adm.noAudit': 'لا توجد أحداث مسجلة بعد.',
    'adm.connectionError': 'تعذر الاتصال بالخادم. شغّل الخادم وفق تعليمات README.',
    'adm.loggedIn': 'تم تسجيل الدخول.', 'adm.loggedOut': 'تم تسجيل الخروج.',
    'adm.records': '{n} سجل', 'adm.events': '{n} حدث', 'adm.accountsCount': '{n} حساب',
    'adm.page': 'الصفحة {p}', 'adm.role': 'الصلاحية',
    'adm.sessionExpired': 'انتهت الجلسة. سجّل الدخول مجدداً.',
    'ai.title': '✨ الصياغة بالذكاء الاصطناعي',
    'ai.lead': 'اكتب موضوع الإعلان واختر النبرة، فتُصاغ لك مسودة عنوان ونص جاهزة للتعديل قبل الحفظ.',
    'ai.topic': 'موضوع الإعلان', 'ai.topicPh': 'مثال: تأجيل حصص السداسي الثالث إلى الأسبوع المقبل',
    'ai.notes': 'ملاحظات إضافية (اختياري)', 'ai.notesPh': 'تفاصيل تفضّل تضمينها',
    'ai.tone': 'النبرة',
    'ai.tone.formal': 'رسمي', 'ai.tone.friendly': 'ودّي', 'ai.tone.urgent': 'عاجل', 'ai.tone.neutral': 'محايد',
    'ai.generate': 'توليد المسودة', 'ai.generating': 'جارٍ الصياغة…',
    'ai.applied': 'تم توليد المسودة (صياغة محلية). راجعها ثم احفظ.', 'ai.aiApplied': 'تم توليد المسودة بالذكاء الاصطناعي. راجعها ثم احفظ.',
    'ai.noteLocal': 'الوضع الحالي: صياغة محلية بلا إنترنت. لتفعيل الذكاء الاصطناعي الكامل أضف AI_API_KEY في إعدادات الخادم.',
    'ai.badgeAi': 'ذكاء اصطناعي', 'ai.badgeLocal': 'صياغة محلية',
    'ai.errTopic': 'أدخل موضوع الإعلان (3 أحرف على الأقل).',
    'h.schedules': 'أضف الحصص وعدّلها وراجع حالة النشر.',
    'h.courses': 'أسماء المواد والمسالك والأساتذة المذكورين.',
    'h.professors': 'دليل الأساتذة. لا تُضف بيانات اتصال إلا إذا كانت مناسبة للنشر.',
    'h.rooms': 'توحيد أسماء القاعات والمباني والسعة عند توفر مصدر موثوق.',
    'h.announcements': 'إعلانات عامة للطلبة تظهر في الصفحة العامة عند نشرها.',
    'h.accounts': 'إنشاء حسابات الإدارة وتحديد الصلاحيات وكلمات المرور.',
    'h.audit': 'آخر 100 حدث مسجّل على مستوى الإدارة.',
    'e.schedules': 'استعمال الزمن', 'e.courses': 'المواد', 'e.professors': 'الأساتذة',
    'e.rooms': 'القاعات', 'e.announcements': 'الإعلانات', 'e.accounts': 'الحسابات والصلاحيات', 'e.audit': 'سجل التعديلات',
    'st.draft': 'مسودة', 'st.published': 'منشور', 'st.archived': 'مؤرشف',
    'roles.admin': 'مدير', 'roles.editor': 'محرر', 'roles.publisher': 'ناشر',
    'kind.info': 'معلومة', 'kind.warning': 'تنبيه', 'kind.urgent': 'عاجل', 'kind.event': 'فعالية',
    'f.title': 'عنوان الإعلان', 'f.body': 'نص الإعلان', 'f.kind': 'نوع الإعلان',
    'f.starts_at': 'يبدأ في (اختياري)', 'f.ends_at': 'ينتهي في (اختياري)',
    'f.status': 'حالة النشر', 'f.semester': 'السداسي', 'f.track': 'المسلك / المسار',
    'f.day': 'اليوم', 'f.time': 'التوقيت', 'f.subject': 'المادة', 'f.professor': 'الأستاذ',
    'f.room': 'القاعة', 'f.group_name': 'الفوج', 'f.subgroups': 'المجموعة الفرعية',
    'f.source_note': 'ملاحظات المصدر / التحقق', 'f.name': 'الاسم', 'f.professors': 'الأستاذ / الأساتذة',
    'f.notes': 'ملاحظات', 'f.email': 'البريد الإلكتروني', 'f.office': 'المكتب / المؤسسة',
    'f.building': 'المبنى / الملحقة', 'f.capacity': 'السعة', 'f.password': 'كلمة مرور مؤقتة (14 حرفاً على الأقل)',
    'f.role': 'الصلاحية',
    'u.email': 'البريد', 'u.role': 'الصلاحية', 'u.status': 'الحالة', 'u.lastLogin': 'آخر دخول',
    'u.action': 'إجراء', 'u.active': 'مفعّل', 'u.inactive': 'معطّل',
    'u.enable': 'تفعيل', 'u.disable': 'تعطيل', 'u.changePassword': 'تغيير كلمة السر',
    'u.resetPrompt': 'أدخل كلمة مرور مؤقتة جديدة (14 حرفاً على الأقل). أرسلها للمستخدم عبر قناة آمنة.',
    'u.passwordShort': 'كلمة المرور يجب أن تكون 14 حرفاً على الأقل.', 'u.passwordChanged': 'تم تغيير كلمة المرور.',
    'a.time': 'التاريخ', 'a.admin': 'الحساب', 'a.action': 'العملية', 'a.entity': 'القسم',
    'a.entityId': 'رقم السجل', 'a.details': 'التفاصيل',
  },
  fr: {
    'adm.docTitle': 'CHRVVIM — Administration',
    'adm.brandSub': 'CONTROL PANEL',
    'adm.theme': 'Mode sombre', 'adm.themeLight': 'Mode clair',
    'adm.backToSite': 'Retour au portail',
    'adm.loginTitle': 'Connexion administrateur',
    'adm.loginLead': "Interface protégée par une session vérifiée par le serveur.",
    'adm.email': 'E-mail administrateur', 'adm.password': 'Mot de passe',
    'adm.loginBtn': 'Connexion sécurisée', 'adm.securityNote': 'Ne partagez pas le mot de passe. Utilisez HTTPS.',
    'adm.dashboard': 'Tableau de bord',
    'adm.dashboardLead': "Gérez le contenu académique et relisez les changements avant publication.",
    'adm.logout': 'Déconnexion',
    'adm.notice': "Mode sûr par défaut : les nouveaux enregistrements sont des brouillons invisibles au public jusqu'à publication. L'éditeur est limité aux brouillons et la suppression est réservée à l'administrateur.",
    'adm.addRecord': 'Ajouter', 'adm.search': 'Rechercher…',
    'adm.allStatuses': 'Tous les statuts', 'adm.refresh': 'Actualiser', 'adm.loading': 'Chargement…',
    'adm.prev': 'Précédent', 'adm.next': 'Suivant', 'adm.close': 'Fermer',
    'adm.save': 'Enregistrer', 'adm.cancel': 'Annuler', 'adm.actions': 'Actions',
    'adm.footerNote': "Le journal d'audit est destiné au suivi opérationnel. Ne stockez pas de données personnelles sans base claire.",
    'adm.createTitle': 'Ajouter', 'adm.editTitle': 'Modifier', 'adm.edit': 'Modifier', 'adm.delete': 'Supprimer',
    'adm.confirmDelete': 'Supprimer définitivement cet enregistrement ? Action irréversible.',
    'adm.saving': 'Enregistrement…', 'adm.saved': 'Enregistrement sauvegardé.', 'adm.deleted': 'Enregistrement supprimé.',
    'adm.publishAll': 'Publier les brouillons', 'adm.publishedCount': '{n} enregistrement(s) publié(s).',
    'adm.noRecords': 'Aucun résultat.', 'adm.noUsers': 'Aucun compte.', 'adm.noAudit': 'Aucun événement.',
    'adm.connectionError': 'Connexion au serveur impossible. Lancez le serveur selon le README.',
    'adm.loggedIn': 'Connexion réussie.', 'adm.loggedOut': 'Déconnecté.',
    'adm.records': '{n} enregistrement(s)', 'adm.events': '{n} événement(s)', 'adm.accountsCount': '{n} compte(s)',
    'adm.page': 'Page {p}', 'adm.role': 'Rôle',
    'adm.sessionExpired': 'Session expirée. Reconnectez-vous.',
    'ai.title': '✨ Rédaction assistée par IA',
    'ai.lead': "Saisissez le sujet et le ton : un brouillon de titre et de texte sera proposé, à relire avant d'enregistrer.",
    'ai.topic': "Sujet de l'annonce", 'ai.topicPh': 'Ex. : Report des séances du semestre 3 à la semaine prochaine',
    'ai.notes': 'Notes complémentaires (optionnel)', 'ai.notesPh': 'Détails à inclure',
    'ai.tone': 'Ton',
    'ai.tone.formal': 'Formel', 'ai.tone.friendly': 'Convivial', 'ai.tone.urgent': 'Urgent', 'ai.tone.neutral': 'Neutre',
    'ai.generate': 'Générer le brouillon', 'ai.generating': 'Rédaction…',
    'ai.applied': 'Brouillon généré (rédaction locale). Relisez puis enregistrez.', 'ai.aiApplied': 'Brouillon généré par IA. Relisez puis enregistrez.',
    'ai.noteLocal': "Mode actuel : rédaction locale hors ligne. Pour l'IA complète, ajoutez AI_API_KEY côté serveur.",
    'ai.badgeAi': 'IA', 'ai.badgeLocal': 'Local',
    'ai.errTopic': 'Saisissez le sujet (au moins 3 caractères).',
    'h.schedules': 'Ajoutez et modifiez les séances, contrôlez la publication.',
    'h.courses': 'Noms des matières, filières et enseignants.',
    'h.professors': "Annuaire des enseignants. N'ajoutez pas de contact sans nécessité.",
    'h.rooms': 'Uniformisez les noms de salles, bâtiments et capacités.',
    'h.announcements': 'Annonces générales visibles sur le portail une fois publiées.',
    'h.accounts': 'Créez des comptes, rôles et mots de passe.',
    'h.audit': 'Les 100 derniers événements administratifs.',
    'e.schedules': 'Emplois du temps', 'e.courses': 'Matières', 'e.professors': 'Enseignants',
    'e.rooms': 'Salles', 'e.announcements': 'Annonces', 'e.accounts': 'Comptes & rôles', 'e.audit': 'Journal',
    'st.draft': 'Brouillon', 'st.published': 'Publié', 'st.archived': 'Archivé',
    'roles.admin': 'Administrateur', 'roles.editor': 'Éditeur', 'roles.publisher': 'Éditeur-publieur',
    'kind.info': 'Info', 'kind.warning': 'Attention', 'kind.urgent': 'Urgent', 'kind.event': 'Événement',
    'f.title': "Titre de l'annonce", 'f.body': "Texte de l'annonce", 'f.kind': "Type d'annonce",
    'f.starts_at': 'Début (optionnel)', 'f.ends_at': 'Fin (optionnel)',
    'f.status': 'Statut', 'f.semester': 'Semestre', 'f.track': 'Filière',
    'f.day': 'Jour', 'f.time': 'Horaire', 'f.subject': 'Matière', 'f.professor': 'Enseignant',
    'f.room': 'Salle', 'f.group_name': 'Groupe', 'f.subgroups': 'Sous-groupe',
    'f.source_note': 'Notes source / vérification', 'f.name': 'Nom', 'f.professors': 'Enseignant(s)',
    'f.notes': 'Notes', 'f.email': 'E-mail', 'f.office': 'Bureau / institution',
    'f.building': 'Bâtiment / annexe', 'f.capacity': 'Capacité', 'f.password': 'Mot de passe temporaire (≥14)',
    'f.role': 'Rôle',
    'u.email': 'E-mail', 'u.role': 'Rôle', 'u.status': 'Statut', 'u.lastLogin': 'Dernière connexion',
    'u.action': 'Action', 'u.active': 'Actif', 'u.inactive': 'Inactif',
    'u.enable': 'Activer', 'u.disable': 'Désactiver', 'u.changePassword': 'Changer le mot de passe',
    'u.resetPrompt': 'Saisissez un mot de passe temporaire (≥14). Transmettez-le par un canal sûr.',
    'u.passwordShort': 'Le mot de passe doit comporter au moins 14 caractères.', 'u.passwordChanged': 'Mot de passe modifié.',
    'a.time': 'Date', 'a.admin': 'Compte', 'a.action': 'Action', 'a.entity': 'Section',
    'a.entityId': 'ID', 'a.details': 'Détails',
  },
  en: {
    'adm.docTitle': 'CHRVVIM — Admin',
    'adm.brandSub': 'CONTROL PANEL',
    'adm.theme': 'Dark mode', 'adm.themeLight': 'Light mode',
    'adm.backToSite': 'Back to portal',
    'adm.loginTitle': 'Administrator sign-in',
    'adm.loginLead': 'Admin interface protected by a server-verified session.',
    'adm.email': 'Admin email', 'adm.password': 'Password',
    'adm.loginBtn': 'Secure sign-in', 'adm.securityNote': 'Never share the password. Use HTTPS in production.',
    'adm.dashboard': 'Dashboard',
    'adm.dashboardLead': 'Manage academic content and review changes before publishing.',
    'adm.logout': 'Sign out',
    'adm.notice': 'Safe by default: new records start as drafts and stay hidden from the public site until published. Editors can only work on drafts; deletion is admin-only.',
    'adm.addRecord': 'Add record', 'adm.search': 'Search records…',
    'adm.allStatuses': 'All statuses', 'adm.refresh': 'Refresh', 'adm.loading': 'Loading…',
    'adm.prev': 'Previous', 'adm.next': 'Next', 'adm.close': 'Close',
    'adm.save': 'Save changes', 'adm.cancel': 'Cancel', 'adm.actions': 'Actions',
    'adm.footerNote': 'The audit log is for operational review. Do not store personal student data here without a clear legal basis.',
    'adm.createTitle': 'Add record', 'adm.editTitle': 'Edit record', 'adm.edit': 'Edit', 'adm.delete': 'Delete',
    'adm.confirmDelete': 'Delete this record permanently? This cannot be undone.',
    'adm.saving': 'Saving…', 'adm.saved': 'Record saved.', 'adm.deleted': 'Record deleted.',
    'adm.publishAll': 'Publish all drafts', 'adm.publishedCount': '{n} record(s) published.',
    'adm.noRecords': 'No matching records.', 'adm.noUsers': 'No accounts.', 'adm.noAudit': 'No events logged yet.',
    'adm.connectionError': 'Could not reach the server. Start it as described in the README.',
    'adm.loggedIn': 'Signed in.', 'adm.loggedOut': 'Signed out.',
    'adm.records': '{n} record(s)', 'adm.events': '{n} event(s)', 'adm.accountsCount': '{n} account(s)',
    'adm.page': 'Page {p}', 'adm.role': 'Role',
    'adm.sessionExpired': 'Session expired. Please sign in again.',
    'ai.title': '✨ AI-assisted drafting',
    'ai.lead': 'Enter the topic and tone; a draft title and body will be proposed for you to review before saving.',
    'ai.topic': 'Announcement topic', 'ai.topicPh': 'e.g. Postponement of semester 3 sessions to next week',
    'ai.notes': 'Extra notes (optional)', 'ai.notesPh': 'Details you want to include',
    'ai.tone': 'Tone',
    'ai.tone.formal': 'Formal', 'ai.tone.friendly': 'Friendly', 'ai.tone.urgent': 'Urgent', 'ai.tone.neutral': 'Neutral',
    'ai.generate': 'Generate draft', 'ai.generating': 'Drafting…',
    'ai.applied': 'Draft generated (local drafting). Review it, then save.', 'ai.aiApplied': 'Draft generated by AI. Review it, then save.',
    'ai.noteLocal': 'Current mode: offline local drafting. To enable full AI, set AI_API_KEY on the server.',
    'ai.badgeAi': 'AI', 'ai.badgeLocal': 'Local',
    'ai.errTopic': 'Enter the announcement topic (at least 3 characters).',
    'h.schedules': 'Add and edit sessions and control publishing.',
    'h.courses': 'Subject, track and professor names.',
    'h.professors': 'Professor directory. Do not add contact details without need.',
    'h.rooms': 'Unify room, building and capacity names.',
    'h.announcements': 'Public student announcements, visible once published.',
    'h.accounts': 'Create admin accounts, roles and passwords.',
    'h.audit': 'The last 100 administrative events.',
    'e.schedules': 'Timetables', 'e.courses': 'Subjects', 'e.professors': 'Professors',
    'e.rooms': 'Rooms', 'e.announcements': 'Announcements', 'e.accounts': 'Accounts & roles', 'e.audit': 'Audit log',
    'st.draft': 'Draft', 'st.published': 'Published', 'st.archived': 'Archived',
    'roles.admin': 'Admin', 'roles.editor': 'Editor', 'roles.publisher': 'Publisher',
    'kind.info': 'Info', 'kind.warning': 'Warning', 'kind.urgent': 'Urgent', 'kind.event': 'Event',
    'f.title': 'Announcement title', 'f.body': 'Announcement body', 'f.kind': 'Announcement type',
    'f.starts_at': 'Starts at (optional)', 'f.ends_at': 'Ends at (optional)',
    'f.status': 'Publish status', 'f.semester': 'Semester', 'f.track': 'Track',
    'f.day': 'Day', 'f.time': 'Time', 'f.subject': 'Subject', 'f.professor': 'Professor',
    'f.room': 'Room', 'f.group_name': 'Group', 'f.subgroups': 'Subgroup',
    'f.source_note': 'Source / verification notes', 'f.name': 'Name', 'f.professors': 'Professor(s)',
    'f.notes': 'Notes', 'f.email': 'Email', 'f.office': 'Office / institution',
    'f.building': 'Building / annex', 'f.capacity': 'Capacity', 'f.password': 'Temporary password (≥14)',
    'f.role': 'Role',
    'u.email': 'Email', 'u.role': 'Role', 'u.status': 'Status', 'u.lastLogin': 'Last login',
    'u.action': 'Action', 'u.active': 'Active', 'u.inactive': 'Inactive',
    'u.enable': 'Enable', 'u.disable': 'Disable', 'u.changePassword': 'Change password',
    'u.resetPrompt': 'Enter a new temporary password (≥14 chars). Deliver it over a secure channel.',
    'u.passwordShort': 'Password must be at least 14 characters.', 'u.passwordChanged': 'Password changed.',
    'a.time': 'Date', 'a.admin': 'Account', 'a.action': 'Action', 'a.entity': 'Section',
    'a.entityId': 'Record ID', 'a.details': 'Details',
  },
};

const LANGS = [{ code: 'ar', label: 'العربية' }, { code: 'fr', label: 'Français' }, { code: 'en', label: 'English' }];
const STORE_LANG = 'chrvvim.admin.lang';
const STORE_THEME = 'chrvvim.theme';

let lang = 'ar';
let theme = 'light';
try { lang = localStorage.getItem(STORE_LANG) || 'ar'; } catch { /* ignore */ }
try { theme = localStorage.getItem(STORE_THEME) || 'light'; } catch { /* ignore */ }
if (!I18N[lang]) lang = 'ar';

const $ = (id) => document.getElementById(id);
function t(key, vars) {
  let s = I18N[lang]?.[key] ?? I18N.ar[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// --- تعريف الأقسام والحقول (مطابقة تماماً لمخططات الخادم) ----------------
const ENTITIES = {
  schedules: {
    titleKey: 'e.schedules', hintKey: 'h.schedules',
    columns: ['semester', 'track', 'day', 'time', 'subject', 'professor', 'room', 'group_name', 'status'],
    defaults: { semester: 'S3', status: 'draft' },
    fields: [
      { key: 'semester', label: 'f.semester', type: 'text', required: true, max: 20 },
      { key: 'track', label: 'f.track', type: 'text', required: true, max: 200 },
      { key: 'day', label: 'f.day', type: 'text', required: true, max: 30 },
      { key: 'time', label: 'f.time', type: 'text', max: 60 },
      { key: 'subject', label: 'f.subject', type: 'text', required: true, max: 200 },
      { key: 'professor', label: 'f.professor', type: 'text', max: 200 },
      { key: 'room', label: 'f.room', type: 'text', max: 160 },
      { key: 'group_name', label: 'f.group_name', type: 'text', max: 40 },
      { key: 'subgroups', label: 'f.subgroups', type: 'text', max: 120 },
      { key: 'status', label: 'f.status', type: 'status', required: true },
      { key: 'source_note', label: 'f.source_note', type: 'textarea', max: 1000 },
    ],
  },
  courses: {
    titleKey: 'e.courses', hintKey: 'h.courses',
    columns: ['semester', 'track', 'name', 'professors', 'status'],
    defaults: { semester: 'S5', status: 'draft' },
    fields: [
      { key: 'semester', label: 'f.semester', type: 'text', required: true, max: 20 },
      { key: 'track', label: 'f.track', type: 'text', max: 200 },
      { key: 'name', label: 'f.name', type: 'text', required: true, max: 200 },
      { key: 'professors', label: 'f.professors', type: 'textarea', max: 500 },
      { key: 'notes', label: 'f.notes', type: 'textarea', max: 1000 },
      { key: 'status', label: 'f.status', type: 'status', required: true },
    ],
  },
  professors: {
    titleKey: 'e.professors', hintKey: 'h.professors',
    columns: ['name', 'email', 'office', 'status'],
    defaults: { status: 'draft' },
    fields: [
      { key: 'name', label: 'f.name', type: 'text', required: true, max: 200 },
      { key: 'email', label: 'f.email', type: 'email', max: 254 },
      { key: 'office', label: 'f.office', type: 'text', max: 160 },
      { key: 'notes', label: 'f.notes', type: 'textarea', max: 1000 },
      { key: 'status', label: 'f.status', type: 'status', required: true },
    ],
  },
  rooms: {
    titleKey: 'e.rooms', hintKey: 'h.rooms',
    columns: ['name', 'building', 'capacity', 'status'],
    defaults: { status: 'draft' },
    fields: [
      { key: 'name', label: 'f.name', type: 'text', required: true, max: 160 },
      { key: 'building', label: 'f.building', type: 'text', max: 160 },
      { key: 'capacity', label: 'f.capacity', type: 'number', min: 1, max: 5000 },
      { key: 'notes', label: 'f.notes', type: 'textarea', max: 1000 },
      { key: 'status', label: 'f.status', type: 'status', required: true },
    ],
  },
  announcements: {
    titleKey: 'e.announcements', hintKey: 'h.announcements',
    columns: ['title', 'kind', 'status', 'updated_at'],
    defaults: { kind: 'info', status: 'draft' },
    fields: [
      { key: 'title', label: 'f.title', type: 'text', required: true, max: 180 },
      { key: 'body', label: 'f.body', type: 'textarea', required: true, max: 5000 },
      { key: 'kind', label: 'f.kind', type: 'kind', required: true },
      { key: 'starts_at', label: 'f.starts_at', type: 'datetime-local' },
      { key: 'ends_at', label: 'f.ends_at', type: 'datetime-local' },
      { key: 'status', label: 'f.status', type: 'status', required: true },
    ],
  },
};

const ACCOUNT_FIELDS = [
  { key: 'email', label: 'u.email', type: 'email', required: true, max: 254 },
  { key: 'password', label: 'f.password', type: 'password', required: true, max: 200 },
  { key: 'role', label: 'f.role', type: 'role', required: true },
];

// --- الحالة ---------------------------------------------------------------
let csrfToken = '';
let currentEntity = 'schedules';
let currentPage = 1;
let total = 0;
let editingId = null;
let records = [];
let currentAdmin = null;
let aiStatus = { configured: false, provider: 'local', model: '' };

// --- طلبات API ------------------------------------------------------------
async function api(url, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const headers = { Accept: 'application/json', ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) };
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) headers['X-CSRF-Token'] = csrfToken;
  let res;
  try {
    res = await fetch(url, { ...opts, method, headers, credentials: 'same-origin' });
  } catch {
    throw new Error(t('adm.connectionError'));
  }
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) {
    if (res.status === 401) { showLogin(); throw new Error(data.error || t('adm.sessionExpired')); }
    const detail = Array.isArray(data.fields) && data.fields.length
      ? ` (${data.fields.map((f) => `${f.field}: ${f.message}`).join('، ')})` : '';
    throw new Error((data.error || `HTTP ${res.status}`) + detail);
  }
  return data;
}
async function refreshCsrf() { const d = await api('/api/admin/csrf'); csrfToken = d.csrfToken || ''; }

// --- التنبيهات ------------------------------------------------------------
function toast(text, kind = '') {
  const host = $('toastHost');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = text;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}
function message(id, text, ok = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = text || '';
  el.classList.toggle('success', !!ok);
}

// --- الترجمة والسمة -------------------------------------------------------
function applyTheme() {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  $('themeBtn').textContent = theme === 'dark' ? t('adm.themeLight') : t('adm.theme');
  try { localStorage.setItem(STORE_THEME, theme); } catch { /* ignore */ }
}
function applyI18n() {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.title = t('adm.docTitle');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
  applyTheme();
  if (!$('adminView').hidden) { renderNavLabels(); syncHeaderActions(); }
}
function renderNavLabels() {
  const audit = currentEntity === 'audit';
  const accounts = currentEntity === 'accounts';
  $('entityTitle').textContent = audit ? t('e.audit') : accounts ? t('e.accounts') : t(ENTITIES[currentEntity].titleKey);
  $('entityHint').textContent = audit ? t('h.audit') : accounts ? t('h.accounts') : t(ENTITIES[currentEntity].hintKey);
}

// --- الدخول/الخروج --------------------------------------------------------
function showLogin() {
  $('loginView').hidden = false;
  $('adminView').hidden = true;
}
function showAdmin(admin) {
  currentAdmin = admin;
  $('loginView').hidden = true;
  $('adminView').hidden = false;
  $('adminEmail').textContent = `${admin.email} · ${t(`roles.${admin.role}`)}`;
  for (const btn of document.querySelectorAll('[data-entity="accounts"],[data-entity="audit"]')) btn.hidden = admin.role !== 'admin';
  activateEntity(currentEntity);
}

async function doLogin(event) {
  event.preventDefault();
  message('loginMessage', t('adm.loading'));
  try {
    await refreshCsrf();
    const d = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: $('email').value.trim(), password: $('password').value }) });
    csrfToken = d.csrfToken || csrfToken;
    $('password').value = '';
    message('loginMessage', t('adm.loggedIn'), true);
    toast(t('adm.loggedIn'), 'ok');
    showAdmin(d.admin);
  } catch (err) { message('loginMessage', err.message); }
}
async function doLogout() {
  try { await api('/api/admin/logout', { method: 'POST', body: '{}' }); } catch { /* ignore */ }
  showLogin();
  await refreshCsrf().catch(() => { /* ignore */ });
  toast(t('adm.loggedOut'));
}

// --- التنقّل بين الأقسام --------------------------------------------------
function activateEntity(entity) {
  currentEntity = entity;
  currentPage = 1;
  editingId = null;
  for (const b of document.querySelectorAll('.nav-btn')) b.classList.toggle('active', b.dataset.entity === entity);
  const audit = entity === 'audit';
  const accounts = entity === 'accounts';
  renderNavLabels();
  $('toolbar').toggleAttribute('hidden', audit || accounts);
  $('searchInput').value = '';
  $('statusFilter').value = '';
  $('editorCard').hidden = true;
  $('aiAssist').hidden = true;
  $('publishAllBtn').hidden = true;
  syncHeaderActions();
  loadRecords();
}
function syncHeaderActions() {
  const audit = currentEntity === 'audit';
  const accounts = currentEntity === 'accounts';
  $('createBtn').hidden = audit || (accounts && currentAdmin?.role !== 'admin');
  const canPublish = currentAdmin && (currentAdmin.role === 'admin' || currentAdmin.role === 'publisher');
  $('publishAllBtn').hidden = audit || accounts || !canPublish;
  $('publishAllBtn').textContent = t('adm.publishAll');
}

// --- تحميل السجلات --------------------------------------------------------
async function loadRecords() {
  message('listMessage', '');
  $('records').innerHTML = `<p class="empty">${esc(t('adm.loading'))}</p>`;
  $('prevBtn').disabled = true; $('nextBtn').disabled = true;
  try {
    if (currentEntity === 'accounts') {
      const d = await api('/api/admin/users');
      records = d.items || []; total = records.length;
      $('countLabel').textContent = t('adm.accountsCount', { n: total });
      renderUsers();
      return;
    }
    if (currentEntity === 'audit') {
      const d = await api('/api/admin/audit');
      records = d.items || []; total = records.length;
      $('countLabel').textContent = t('adm.events', { n: total });
      renderAudit(records);
      return;
    }
    const params = new URLSearchParams({ page: String(currentPage), q: $('searchInput').value.trim(), status: $('statusFilter').value });
    const d = await api(`/api/admin/${currentEntity}?${params}`);
    records = d.items || []; total = d.total ?? records.length;
    renderRecords();
    $('countLabel').textContent = `${t('adm.records', { n: total })} · ${t('adm.page', { p: currentPage })}`;
    $('prevBtn').disabled = currentPage <= 1;
    $('nextBtn').disabled = currentPage * 50 >= total;
  } catch (err) {
    $('records').innerHTML = `<p class="empty">${esc(err.message)}</p>`;
  }
}

function cellContent(key, row) {
  const value = row[key];
  if (key === 'status') return `<span class="badge ${esc(value)}">${esc(t(`st.${value}`))}</span>`;
  if (key === 'kind') return `<span class="kind-${esc(value)}">${esc(t(`kind.${value}`))}</span>`;
  return esc(value == null || value === '' ? '—' : value);
}

function renderRecords() {
  const cfg = ENTITIES[currentEntity];
  const titles = Object.fromEntries(cfg.columns.map((c) => [c, cfg.fields.find((f) => f.key === c)?.label || c]));
  if (!records.length) { $('records').innerHTML = `<p class="empty">${esc(t('adm.noRecords'))}</p>`; return; }
  const head = cfg.columns.map((c) => `<th>${esc(c === 'updated_at' ? t('a.time') : t(titles[c]))}</th>`).join('');
  const body = records.map((r) => {
    const cells = cfg.columns.map((c) => `<td>${cellContent(c, r)}</td>`).join('');
    const isEditor = currentAdmin?.role === 'editor';
    const editDisabled = isEditor && r.status !== 'draft';
    const delBtn = currentAdmin?.role === 'admin' ? `<button class="btn small danger" data-delete="${r.id}">${esc(t('adm.delete'))}</button>` : '';
    return `<tr>${cells}<td><div class="actions"><button class="btn small secondary" data-edit="${r.id}" ${editDisabled ? 'disabled' : ''}>${esc(t('adm.edit'))}</button>${delBtn}</div></td></tr>`;
  }).join('');
  $('records').innerHTML = `<table><thead><tr>${head}<th>${esc(t('adm.actions'))}</th></tr></thead><tbody>${body}</tbody></table>`;
  for (const b of document.querySelectorAll('[data-edit]')) b.addEventListener('click', () => openEditor(Number(b.dataset.edit)));
  for (const b of document.querySelectorAll('[data-delete]')) b.addEventListener('click', () => deleteRecord(Number(b.dataset.delete)));
}

function renderUsers() {
  if (!records.length) { $('records').innerHTML = `<p class="empty">${esc(t('adm.noUsers'))}</p>`; return; }
  const rows = records.map((r) => {
    const self = r.id === currentAdmin?.id;
    const roleSel = `<select data-role="${r.id}" ${self ? 'disabled' : ''}>${['editor', 'publisher', 'admin'].map((k) => `<option value="${k}" ${r.role === k ? 'selected' : ''}>${esc(t(`roles.${k}`))}</option>`).join('')}</select>`;
    const toggle = `<button class="btn small secondary" data-toggle-user="${r.id}" ${self ? 'disabled' : ''}>${esc(r.active ? t('u.disable') : t('u.enable'))}</button>`;
    const reset = `<button class="btn small secondary" data-reset-user="${r.id}" ${self ? 'disabled' : ''}>${esc(t('u.changePassword'))}</button>`;
    return `<tr><td dir="ltr">${esc(r.email)}</td><td>${roleSel}</td><td>${esc(r.active ? t('u.active') : t('u.inactive'))}</td><td dir="ltr">${esc(r.last_login_at || '—')}</td><td><div class="actions">${toggle}${reset}</div></td></tr>`;
  }).join('');
  $('records').innerHTML = `<table><thead><tr><th>${esc(t('u.email'))}</th><th>${esc(t('u.role'))}</th><th>${esc(t('u.status'))}</th><th>${esc(t('u.lastLogin'))}</th><th>${esc(t('u.action'))}</th></tr></thead><tbody>${rows}</tbody></table>`;
  for (const el of document.querySelectorAll('[data-role]')) el.addEventListener('change', async () => {
    try { await api(`/api/admin/users/${el.dataset.role}`, { method: 'PATCH', body: JSON.stringify({ role: el.value }) }); message('listMessage', t('adm.saved'), true); await loadRecords(); }
    catch (e) { message('listMessage', e.message); await loadRecords(); }
  });
  for (const el of document.querySelectorAll('[data-toggle-user]')) el.addEventListener('click', async () => {
    const row = records.find((x) => x.id === Number(el.dataset.toggleUser));
    try { await api(`/api/admin/users/${row.id}`, { method: 'PATCH', body: JSON.stringify({ active: !row.active }) }); message('listMessage', t('adm.saved'), true); await loadRecords(); }
    catch (e) { message('listMessage', e.message); }
  });
  for (const el of document.querySelectorAll('[data-reset-user]')) el.addEventListener('click', async () => {
    const password = prompt(t('u.resetPrompt'));
    if (!password) return;
    if (password.length < 14) { message('listMessage', t('u.passwordShort')); return; }
    try { await api(`/api/admin/users/${el.dataset.resetUser}`, { method: 'PATCH', body: JSON.stringify({ password }) }); message('listMessage', t('u.passwordChanged'), true); }
    catch (e) { message('listMessage', e.message); }
  });
}

function renderAudit(items) {
  if (!items.length) { $('records').innerHTML = `<p class="empty">${esc(t('adm.noAudit'))}</p>`; return; }
  const cols = [['created_at', 'a.time'], ['admin_email', 'a.admin'], ['action', 'a.action'], ['entity', 'a.entity'], ['entity_id', 'a.entityId'], ['details', 'a.details']];
  const rows = items.map((r) => `<tr>${cols.map((c) => `<td ${c[0] === 'created_at' || c[0] === 'admin_email' ? 'dir="ltr"' : ''}>${esc(r[c[0]] == null || r[c[0]] === '' ? '—' : r[c[0]])}</td>`).join('')}</tr>`).join('');
  $('records').innerHTML = `<table><thead><tr>${cols.map((c) => `<th>${esc(t(c[1]))}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}

// --- نموذج التحرير --------------------------------------------------------
function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(value)) ? '' : 'Z'));
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fieldControl(field, rawValue) {
  const { key, label, type, required, max, min } = field;
  const req = required ? 'required' : '';
  const id = `f-${key}`;
  let value = rawValue;
  if (type === 'datetime-local') value = toLocalInput(rawValue);
  if (type === 'status') {
    const opts = currentAdmin?.role === 'editor' ? ['draft'] : ['draft', 'published', 'archived'];
    const sel = value || 'draft';
    return `<div class="field ${type === 'textarea' ? 'full-row' : ''}"><label for="${id}">${esc(t(label))}</label><select id="${id}" name="${key}" ${req}>${opts.map((o) => `<option value="${o}" ${sel === o ? 'selected' : ''}>${esc(t(`st.${o}`))}</option>`).join('')}</select></div>`;
  }
  if (type === 'kind') {
    const sel = value || 'info';
    return `<div class="field"><label for="${id}">${esc(t(label))}</label><select id="${id}" name="${key}" ${req}>${['info', 'warning', 'urgent', 'event'].map((o) => `<option value="${o}" ${sel === o ? 'selected' : ''}>${esc(t(`kind.${o}`))}</option>`).join('')}</select></div>`;
  }
  if (type === 'role') {
    const sel = value || 'editor';
    return `<div class="field"><label for="${id}">${esc(t(label))}</label><select id="${id}" name="${key}" ${req}>${['editor', 'publisher', 'admin'].map((o) => `<option value="${o}" ${sel === o ? 'selected' : ''}>${esc(t(`roles.${o}`))}</option>`).join('')}</select></div>`;
  }
  if (type === 'textarea') {
    return `<div class="field full-row"><label for="${id}">${esc(t(label))}</label><textarea id="${id}" name="${key}" rows="3" maxlength="${max || 1000}" ${req}>${esc(value || '')}</textarea></div>`;
  }
  const inputType = type === 'number' ? 'number' : type === 'email' ? 'email' : type === 'password' ? 'password' : type === 'datetime-local' ? 'datetime-local' : 'text';
  const bounds = type === 'number' ? `${min !== undefined ? `min="${min}"` : ''} ${max !== undefined ? `max="${max}"` : ''}` : '';
  const maxLen = type === 'number' ? '' : `maxlength="${max || 500}"`;
  return `<div class="field"><label for="${id}">${esc(t(label))}</label><input id="${id}" name="${key}" type="${inputType}" value="${esc(value ?? '')}" ${req} ${bounds} ${maxLen}></div>`;
}

function openEditor(id = null) {
  editingId = id;
  const isAccounts = currentEntity === 'accounts';
  const cfg = ENTITIES[currentEntity];
  const row = id && !isAccounts ? records.find((r) => r.id === id) : null;
  const fields = isAccounts ? ACCOUNT_FIELDS : cfg.fields;
  $('editorTitle').textContent = id ? t('adm.editTitle') : t('adm.createTitle');
  $('formFields').innerHTML = fields.map((f) => {
    const fallback = isAccounts ? (f.key === 'role' ? 'editor' : '') : (row ? row[f.key] : cfg.defaults[f.key] ?? '');
    return fieldControl(f, row ? row[f.key] : fallback);
  }).join('');
  message('formMessage', '');
  $('editorCard').hidden = false;
  renderAiAssist();
  $('editorCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function closeEditor() { $('editorCard').hidden = true; editingId = null; $('aiAssist').hidden = true; }

// --- مساعد الصياغة بالذكاء الاصطناعي -------------------------------------
function aiAssistHtml() {
  const tones = ['formal', 'friendly', 'urgent', 'neutral'];
  const badge = aiStatus.configured ? t('ai.badgeAi') : t('ai.badgeLocal');
  return `
    <div class="ai-head">
      <div>
        <p class="eyebrow">AI ASSIST</p>
        <b>${esc(t('ai.title'))}</b>
      </div>
      <span id="aiBadge" class="ai-badge ${aiStatus.configured ? 'on' : ''}">${esc(badge)}</span>
    </div>
    <p class="muted ai-lead">${esc(t('ai.lead'))}</p>
    <div class="ai-grid">
      <div class="field">
        <label for="ai-topic">${esc(t('ai.topic'))}</label>
        <input id="ai-topic" type="text" maxlength="200" placeholder="${esc(t('ai.topicPh'))}">
      </div>
      <div class="field">
        <label for="ai-tone">${esc(t('ai.tone'))}</label>
        <select id="ai-tone">${tones.map((o) => `<option value="${o}">${esc(t(`ai.tone.${o}`))}</option>`).join('')}</select>
      </div>
      <div class="field full-row">
        <label for="ai-notes">${esc(t('ai.notes'))}</label>
        <textarea id="ai-notes" rows="2" maxlength="600" placeholder="${esc(t('ai.notesPh'))}"></textarea>
      </div>
    </div>
    <div class="ai-actions">
      <button id="aiGenBtn" class="btn gold" type="button">${esc(t('ai.generate'))}</button>
      <span id="aiMsg" class="message" role="status"></span>
    </div>
    ${aiStatus.configured ? '' : `<p class="ai-hint">${esc(t('ai.noteLocal'))}</p>`}`;
}

function renderAiAssist(preserve = false) {
  const host = $('aiAssist');
  if (!host) return;
  if (currentEntity !== 'announcements') { host.hidden = true; host.innerHTML = ''; return; }
  const prev = preserve ? { topic: $('ai-topic')?.value || '', tone: $('ai-tone')?.value || 'formal', notes: $('ai-notes')?.value || '' } : null;
  host.hidden = false;
  host.innerHTML = aiAssistHtml();
  if (prev) {
    if (prev.topic) $('ai-topic').value = prev.topic;
    if (prev.notes) $('ai-notes').value = prev.notes;
    if ($('ai-tone') && prev.tone) $('ai-tone').value = prev.tone;
  }
  $('aiGenBtn').addEventListener('click', generateAiDraft);
}

async function generateAiDraft() {
  const topic = ($('ai-topic')?.value || '').trim();
  if (topic.length < 3) { message('aiMsg', t('ai.errTopic')); return; }
  const payload = {
    topic,
    kind: $('f-kind')?.value || 'info',
    tone: $('ai-tone')?.value || 'formal',
    language: ['ar', 'fr', 'en'].includes(lang) ? lang : 'ar',
    notes: ($('ai-notes')?.value || '').trim(),
  };
  const btn = $('aiGenBtn');
  btn.disabled = true;
  message('aiMsg', t('ai.generating'));
  try {
    const d = await api('/api/admin/ai/draft', { method: 'POST', body: JSON.stringify(payload) });
    if ($('f-title')) $('f-title').value = d.title || '';
    if ($('f-body')) $('f-body').value = d.body || '';
    if (typeof d.configured === 'boolean') aiStatus.configured = d.configured;
    const badge = $('aiBadge');
    if (badge) { badge.textContent = aiStatus.configured ? t('ai.badgeAi') : t('ai.badgeLocal'); badge.classList.toggle('on', aiStatus.configured); }
    message('aiMsg', d.source === 'ai' ? t('ai.aiApplied') : t('ai.applied'), true);
  } catch (err) {
    message('aiMsg', err.message);
  } finally {
    btn.disabled = false;
  }
}

async function submitRecord(event) {
  event.preventDefault();
  const body = {};
  const fields = currentEntity === 'accounts' ? ACCOUNT_FIELDS : ENTITIES[currentEntity].fields;
  for (const f of fields) {
    const el = $(`f-${f.key}`);
    if (!el) continue;
    if (f.type === 'number') body[f.key] = el.value.trim() ? Number(el.value) : null;
    else if (f.type === 'datetime-local') body[f.key] = el.value ? new Date(el.value).toISOString().slice(0, 19).replace('T', ' ') : '';
    else body[f.key] = el.value.trim();
  }
  message('formMessage', t('adm.saving'));
  try {
    const base = currentEntity === 'accounts' ? '/api/admin/users' : `/api/admin/${currentEntity}`;
    const method = currentEntity === 'accounts' ? 'POST' : editingId ? 'PUT' : 'POST';
    await api(editingId && currentEntity !== 'accounts' ? `${base}/${editingId}` : base, { method, body: JSON.stringify(body) });
    message('formMessage', t('adm.saved'), true);
    toast(t('adm.saved'), 'ok');
    closeEditor();
    await loadRecords();
  } catch (err) { message('formMessage', err.message); }
}

async function deleteRecord(id) {
  if (!confirm(t('adm.confirmDelete'))) return;
  try {
    await api(`/api/admin/${currentEntity}/${id}`, { method: 'DELETE', body: '{}' });
    toast(t('adm.deleted'), 'ok');
    await loadRecords();
  } catch (err) { message('listMessage', err.message); }
}

async function publishAll() {
  try {
    const d = await api(`/api/admin/${currentEntity}/publish-all`, { method: 'POST', body: '{}' });
    message('listMessage', t('adm.publishedCount', { n: d.published ?? 0 }), true);
    toast(t('adm.publishedCount', { n: d.published ?? 0 }), 'ok');
    await loadRecords();
  } catch (err) { message('listMessage', err.message); }
}

// --- الربط والتشغيل -------------------------------------------------------
function fillLangSelect() {
  $('langSelect').innerHTML = LANGS.map((l) => `<option value="${l.code}">${esc(l.label)}</option>`).join('');
  $('langSelect').value = lang;
}

function wire() {
  $('loginForm').addEventListener('submit', doLogin);
  $('logoutBtn').addEventListener('click', doLogout);
  $('langSelect').addEventListener('change', (e) => {
    lang = I18N[e.target.value] ? e.target.value : 'ar';
    try { localStorage.setItem(STORE_LANG, lang); } catch { /* ignore */ }
    applyI18n();
    if (currentAdmin) { $('adminEmail').textContent = `${currentAdmin.email} · ${t(`roles.${currentAdmin.role}`)}`; syncHeaderActions(); }
    if (!$('adminView').hidden && currentEntity !== 'audit' && currentEntity !== 'accounts' && records.length) renderRecords();
    if (!$('editorCard').hidden) renderAiAssist(true);
  });
  $('themeBtn').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
  for (const b of document.querySelectorAll('.nav-btn')) b.addEventListener('click', () => activateEntity(b.dataset.entity));
  $('createBtn').addEventListener('click', () => openEditor());
  $('publishAllBtn').addEventListener('click', publishAll);
  $('refreshBtn').addEventListener('click', () => { currentPage = 1; loadRecords(); });
  $('searchInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { currentPage = 1; loadRecords(); } });
  $('statusFilter').addEventListener('change', () => { currentPage = 1; loadRecords(); });
  $('prevBtn').addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadRecords(); } });
  $('nextBtn').addEventListener('click', () => { if (currentPage * 50 < total) { currentPage++; loadRecords(); } });
  $('recordForm').addEventListener('submit', submitRecord);
  $('cancelEditBtn').addEventListener('click', closeEditor);
  $('cancelEditBtn2').addEventListener('click', closeEditor);
}

(async function boot() {
  fillLangSelect();
  applyI18n();
  wire();
  try {
    await refreshCsrf();
    const d = await api('/api/admin/me');
    if (d.authenticated) {
      showAdmin(d.admin);
      try { const s = await api('/api/admin/ai/status'); if (s && typeof s.configured === 'boolean') aiStatus = s; } catch { /* ignore */ }
    } else showLogin();
  } catch (err) {
    showLogin();
    message('loginMessage', err.message);
  }
})();
