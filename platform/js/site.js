function escapeHtml(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
/* ===== منصة الطلبة — منطق الموقع العام ===== */

// إعدادات قابلة للتغيير
const SITE = {
  name_ar: "منصة الطلبة",
  name_fr: "Plateforme des Étudiants",
  telegram: "https://t.me/",       // ضع رابط قناتك هنا
  whatsapp: "https://wa.me/",      // ضع رقم الواتساب هنا
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
  email: "contact@exemple.com",
};

// ترجمات الموقع (عربي / فرنسي)
const T = {
  ar: {
    site_desc: "منصة مجانية للامتحانات والفروض والملخصات لكل جامعات المغرب — تصفح، حمّل، وساهم!",
    home: "الرئيسية", browse: "تصفح", announcements: "إعلانات", contribute: "ساهم", about: "من نحن",
    login: "دخول", account: "حسابي", logout: "خروج",
    hero_title: "كل دروسك وامتحاناتك في مكان واحد 📚",
    hero_sub: "فروض، امتحانات محلولة، ملخصات PDF — مجاناً وبلا تسجيل معقد",
    search_ph: "ابحث عن مادة، امتحان، أو جامعة...",
    search: "بحث",
    quick_browse: "تصفح حسب الجامعة", quick_exams: "أحدث الامتحانات", quick_ann: "آخر الإعلانات",
    view_all: "عرض الكل",
    tg_title: "انضم لقناة تيليغرام", tg_sub: "تصلك الإعلانات والمحتوى الجديد فور نشره",
    join: "انضم الآن",
    footer_about: "عن المنصة", footer_links: "روابط سريعة", footer_contact: "تواصل معنا",
    footer_rights: "جميع الحقوق محفوظة",
    university: "الجامعة", department: "الشعبة", semester: "السداسي", subject: "المادة",
    all: "الكل", results: "نتيجة", no_results: "لا توجد نتائج", loading: "جاري التحميل...",
    exams_count: "امتحانات",
    exam: "امتحان", assignment: "فرض", correction: "مصحح", download: "تحميل",
    downloads: "تحميلات", year: "السنة", session: "الدورة",
    normal: "عادية", makeup: "تعويضية",
    favorite_added: "أضيف للمفضلة", favorite_removed: "أزيل من المفضلة",
    my_favorites: "مفضلتي", no_favorites: "لا توجد مفضلات بعد",
    ask_question: "اطرح سؤالاً", question_ph: "اكتب سؤالك عن هذه المادة...", send: "إرسال",
    question_sent: "تم إرسال سؤالك! سيظهر بعد المراجعة.",
    questions: "أسئلة وأجوبة",
    reg_title: "تسجيل الدخول", reg_sub: "حساب مجاني للمفضلة والمساهمة",
    email: "البريد الإلكتروني", password: "كلمة المرور", signin: "دخول", signup: "حساب جديد",
    no_account: "ليس لديك حساب؟", have_account: "لديك حساب؟",
    auth_ok: "تم بنجاح", auth_err: "خطأ في البيانات",
    contrib_title: "ساهم بامتحان أو فرض", contrib_sub: "شارك مقرراتك مع زملائك — تُراجع المساهمة قبل النشر",
    must_login: "سجّل الدخول أولاً للمساهمة",
    file: "الملف (PDF)", file_corr: "ملف التصحيح (اختياري)", submit_contrib: "أرسل المساهمة",
    contrib_ok: "تم الإرسال! تُراجع مساهمتك خلال 24 ساعة.",
    ann_cat: "التصنيف", published: "نُشر",
    registration: "تسجيلات", contest: "مسابقات", scholarship: "منح", deadline: "آجال", general: "عام",
    about_title: "من نحن", about_text: "منصة تعليمية مجانية مستقلة تهدف لمساعدة طلبة الجامعات المغربية على الوصول للمحتوى التعليمي (فروض، امتحانات، ملخصات) بسهولة ومجانية. نعتمد على مساهمات الطلبة أنفسهم مع مراجعة كل محتوى قبل النشر.",
    contact_title: "تواصل معنا", name: "الاسم", message: "الرسالة", send_msg: "إرسال الرسالة",
    msg_sent: "تم إرسال رسالتك!",
    privacy_title: "سياسة الخصوصية", support_title: "ادعمنا", support_text: "هذه المنصة مجانية بالكامل وتعتمد على تضامنكم. يمكنك دعمنا بالتبرع أو التواصل معنا للشراكات.",
    account_title: "حسابي", favs: "المفضلة",
    admin_panel: "لوحة التحكم",
  },
  fr: {
    site_desc: "Plateforme gratuite des exams, devoirs et résumés pour toutes les universités marocaines — Parcourez, téléchargez et contribuez!",
    home: "Accueil", browse: "Parcourir", announcements: "Annonces", contribute: "Contribuer", about: "À propos",
    login: "Connexion", account: "Mon compte", logout: "Déconnexion",
    hero_title: "Tous vos cours et exams au même endroit 📚",
    hero_sub: "Devoirs, exams corrigés, résumés PDF — gratuitement et sans inscription compliquée",
    search_ph: "Cherchez une matière, un exam ou une université...",
    search: "Rechercher",
    quick_browse: "Par université", quick_exams: "Derniers exams", quick_ann: "Dernières annonces",
    view_all: "Voir tout",
    tg_title: "Rejoignez notre Telegram", tg_sub: "Annonces et nouveaux contenus en temps réel",
    join: "Rejoindre",
    footer_about: "À propos", footer_links: "Liens rapides", footer_contact: "Contact",
    footer_rights: "Tous droits réservés",
    university: "Université", department: "Département", semester: "Semestre", subject: "Matière",
    all: "Tout", results: "résultats", no_results: "Aucun résultat", loading: "Chargement...",
    exams_count: "exams",
    exam: "Exam", assignment: "Devoir", correction: "Corrigé", download: "Télécharger",
    downloads: "téléchargements", year: "Année", session: "Session",
    normal: "Normale", makeup: "Rattrapage",
    favorite_added: "Ajouté aux favoris", favorite_removed: "Retiré des favoris",
    my_favorites: "Mes favoris", no_favorites: "Aucun favori",
    ask_question: "Poser une question", question_ph: "Écrivez votre question sur cette matière...", send: "Envoyer",
    question_sent: "Question envoyée! Elle apparaîtra après modération.",
    questions: "Questions / Réponses",
    reg_title: "Connexion", reg_sub: "Compte gratuit pour favoris et contributions",
    email: "E-mail", password: "Mot de passe", signin: "Se connecter", signup: "Créer un compte",
    no_account: "Pas de compte?", have_account: "Déjà un compte?",
    auth_ok: "Succès", auth_err: "Données invalides",
    contrib_title: "Contribuez avec un exam ou devoir", contrib_sub: "Partagez vos cours — chaque contribution est vérifiée avant publication",
    must_login: "Connectez-vous pour contribuer",
    file: "Fichier (PDF)", file_corr: "Fichier du corrigé (optionnel)", submit_contrib: "Envoyer",
    contrib_ok: "Envoyé! Votre contribution sera vérifiée sous 24h.",
    ann_cat: "Catégorie", published: "Publié",
    registration: "Inscriptions", contest: "Concours", scholarship: "Bourses", deadline: "Délais", general: "Général",
    about_title: "À propos", about_text: "Plateforme éducative gratuite et indépendante visant à aider les étudiants des universités marocaines à accéder facilement aux contenus pédagogiques (devoirs, exams, résumés). Nous reposons sur les contributions des étudiants, chaque contenu étant vérifié avant publication.",
    contact_title: "Contactez-nous", name: "Nom", message: "Message", send_msg: "Envoyer",
    msg_sent: "Message envoyé!",
    privacy_title: "Politique de confidentialité", support_title: "Soutenez-nous", support_text: "Cette plateforme est entièrement gratuite et repose sur votre solidarité. Vous pouvez nous soutenir par un don ou nous contacter pour des partenariats.",
    account_title: "Mon compte", favs: "Favoris",
    admin_panel: "Administration",
  },
};

let lang = localStorage.getItem("edu_lang") || "ar";

function t(key) { return (T[lang] && T[lang][key]) || T.ar[key] || key; }
function esc(s) { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function param(k) { return new URLSearchParams(location.search).get(k); }

// تطبيق اللغة على الصفحة
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = SITE["name_" + lang] + " — " + t("site_desc");
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.getAttribute("data-t")); });
  document.querySelectorAll("[data-t-ph]").forEach(el => { el.placeholder = t(el.getAttribute("data-t-ph")); });
  const lb = document.getElementById("lang-toggle");
  if (lb) lb.textContent = lang === "ar" ? "FR" : "عربي";
}
function toggleLang() {
  lang = lang === "ar" ? "fr" : "ar";
  localStorage.setItem("edu_lang", lang);
  applyLang();
  document.dispatchEvent(new Event("langchange"));
}

// إشعار منبثق
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2600);
}

// قائمة الجوال
function toggleMenu() { document.getElementById("site-nav")?.classList.toggle("open"); }

// حالة الطالب
let student = null;
async function getStudent() {
  if (student !== null) return student;
  const { data } = await db.auth.getUser();
  student = data.user || null;
  return student;
}
async function studentSignin() {
  const email = document.getElementById("auth-email").value.trim();
  const pass = document.getElementById("auth-pass").value;
  const { error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) return toast(t("auth_err") + ": " + error.message);
  toast(t("auth_ok"));
  location.reload();
}
async function studentSignup() {
  const email = document.getElementById("auth-email").value.trim();
  const pass = document.getElementById("auth-pass").value;
  const { error } = await db.auth.signUp({ email, password: pass });
  if (error) return toast(t("auth_err") + ": " + error.message);
  toast(t("auth_ok"));
  location.reload();
}
async function studentSignout() { await db.auth.signOut(); location.reload(); }

// ===== الرئيسية: أحدث الامتحانات + الإعلانات =====
async function loadHome() {
  const [examsRes, annRes] = await Promise.all([
    db.from("exams").select("id, exam_type, year, has_correction, downloads, created_at, subjects(name_ar, name_fr, departments(name_ar, name_fr, universities(name_ar, name_fr)))").order("created_at", { ascending: false }).limit(6),
    db.from("announcements").select("id, title_ar, category").eq("is_published", true).order("published_at", { ascending: false }).limit(3),
  ]);
  const examsEl = document.getElementById("home-exams");
  if (examsEl) {
    examsEl.innerHTML = (examsRes.data || []).map(e => examRow(e)).join("") || emptyBlock("📚");
  }
  const annEl = document.getElementById("home-ann");
  if (annEl) {
    annEl.innerHTML = (annRes.data || []).map(a => `
      <a class="item-row" href="announcements.html">
        <span class="row-icon">📢</span>
        <div class="row-body"><strong>${esc(lang === "ar" ? a.title_ar : a.title_ar)}</strong></div>
        <span class="badge badge-cat" data-t="${esc(a.category)}">${t(a.category)}</span>
      </a>`).join("") || emptyBlock("📢");
  }
}

function examRow(e) {
  const s = e.subjects || {};
  const name = lang === "ar" ? (s.name_ar || "") : (s.name_fr || s.name_ar || "");
  const dep = s.departments || {};
  const uni = dep.universities || {};
  const uniName = lang === "ar" ? (uni.name_ar || "") : (uni.name_fr || uni.name_ar || "");
  return `
    <div class="item-row">
      <span class="row-icon">${e.exam_type === "assignment" ? "📝" : "📋"}</span>
      <div class="row-body">
        <strong>${esc(name)}</strong>
        <small>${esc(uniName)} · ${e.year || ""} · ${t(e.downloads > 0 ? "downloads" : "exams_count")}: ${e.downloads || 0}</small>
      </div>
      <span class="badge ${e.exam_type === "assignment" ? "badge-assignment" : "badge-exam"}" data-t="${e.exam_type}">${t(e.exam_type)}</span>
      ${e.has_correction ? `<span class="badge badge-correction" data-t="correction">${t("correction")}</span>` : ""}
      <a class="btn btn-primary btn-sm" href="subject.html?id=${esc(s.id || "")}">${t("download")}</a>
    </div>`;
}

function emptyBlock(icon) {
  return `<div class="empty"><span class="icon">${icon}</span>${t("no_results")}</div>`;
}

// ===== التصفح: شجرة التصنيف =====
async function loadBrowse() {
  const uniSel = document.getElementById("f-university");
  if (!uniSel) return;
  const { data: unis } = await db.from("universities").select("id, slug, name_ar, name_fr").eq("is_active", true).order("name_ar");
  uniSel.innerHTML = `<option value="">${t("university")}: ${t("all")}</option>` +
    (unis || []).map(u => `<option value="${u.id}">${esc(lang === "ar" ? u.name_ar : (u.name_fr || u.name_ar))}</option>`).join("");
  // استرجاع الفلاتر من الرابط
  const pUni = param("university"); if (pUni) { uniSel.value = pUni; }
  uniSel.onchange = () => loadDepartments();
  await loadDepartments();
  document.getElementById("f-department")?.addEventListener("change", loadSubjects);
  document.getElementById("f-semester")?.addEventListener("change", loadSubjects);
  document.getElementById("browse-search")?.addEventListener("input", debounce(loadSubjects, 300));
}

async function loadDepartments() {
  const uniId = document.getElementById("f-university").value;
  const depSel = document.getElementById("f-department");
  let q = db.from("departments").select("id, name_ar, name_fr").eq("is_active", true).order("name_ar");
  if (uniId) q = q.eq("university_id", uniId);
  const { data: deps } = await q;
  depSel.innerHTML = `<option value="">${t("department")}: ${t("all")}</option>` +
    (deps || []).map(d => `<option value="${d.id}">${esc(lang === "ar" ? d.name_ar : (d.name_fr || d.name_ar))}</option>`).join("");
  depSel.value = param("department") || "";
  // السداسيات (مرة واحدة)
  const semSel = document.getElementById("f-semester");
  if (semSel && !semSel.dataset.loaded) {
    const { data: sems } = await db.from("semesters").select("id, name_ar, name_fr, sort_order").order("sort_order");
    semSel.innerHTML = `<option value="">${t("semester")}: ${t("all")}</option>` +
      (sems || []).map(s => `<option value="${s.id}">${esc(lang === "ar" ? s.name_ar : (s.name_fr || s.name_ar))}</option>`).join("");
    semSel.dataset.loaded = "1";
    semSel.value = param("semester") || "";
    semSel.onchange = loadSubjects;
  }
  await loadSubjects();
}

async function loadSubjects() {
  const uniId = document.getElementById("f-university")?.value;
  const depId = document.getElementById("f-department")?.value;
  const semId = document.getElementById("f-semester")?.value;
  const search = (document.getElementById("browse-search")?.value || "").trim();
  let q = db.from("subjects").select("id, name_ar, name_fr, code, departments(name_ar, name_fr, universities(name_ar, name_fr))");
  if (depId) q = q.eq("department_id", depId);
  if (semId) q = q.eq("semester_id", semId);
  const { data: deps } = uniId ? await db.from("departments").select("id").eq("university_id", uniId) : { data: null };
  if (!depId && deps) q = q.in("department_id", deps.map(d => d.id));
  if (search) q = q.or(`name_ar.ilike.%${search}%,name_fr.ilike.%${search}%,code.ilike.%${search}%`);
  const { data: subjects } = await q.limit(60);
  const list = document.getElementById("subjects-list");
  if (!list) return;
  list.innerHTML = (subjects || []).map(s => {
    const dep = s.departments || {}; const uni = dep.universities || {};
    return `
    <a class="card" href="subject.html?id=${s.id}">
      <h3>📖 ${esc(lang === "ar" ? s.name_ar : (s.name_fr || s.name_ar))}</h3>
      <p>${esc(lang === "ar" ? dep.name_ar : (dep.name_fr || dep.name_ar) || "")} — ${esc(lang === "ar" ? uni.name_ar : (uni.name_fr || uni.name_ar) || "")}</p>
      ${s.code ? `<p><span class="badge badge-year">${esc(s.code)}</span></p>` : ""}
    </a>`;
  }).join("") || emptyBlock("🔍");
  const cnt = document.getElementById("subjects-count");
  if (cnt) cnt.textContent = (subjects || []).length + " " + t("results");
}

// ===== صفحة المادة =====
async function loadSubject() {
  const id = param("id");
  if (!id) { location.href = "browse.html"; return; }
  const { data: subject } = await db.from("subjects").select("id, name_ar, name_fr, code, teacher, departments(name_ar, name_fr, universities(name_ar, name_fr)), semesters(name_ar, name_fr)").eq("id", id).single();
  if (!subject) return;
  const dep = subject.departments || {}; const uni = dep.universities || {}; const sem = subject.semesters || {};
  document.getElementById("subj-title").textContent = lang === "ar" ? subject.name_ar : (subject.name_fr || subject.name_ar);
  document.getElementById("subj-meta").textContent =
    [uni.name_ar, dep.name_ar, sem.name_ar, subject.code].filter(Boolean).join(" · ");
  // الامتحانات
  const { data: exams } = await db.from("exams").select("id, exam_type, year, session, has_correction, downloads, created_at").eq("subject_id", id).eq("status", "approved").order("created_at", { ascending: false });
  const list = document.getElementById("exams-list");
  list.innerHTML = (exams || []).map(e => `
    <div class="item-row">
      <span class="row-icon">${e.exam_type === "assignment" ? "📝" : "📋"}</span>
      <div class="row-body">
        <strong>${t(e.exam_type)} ${e.year || ""}</strong>
        <small>${e.session ? t(e.session) : ""} · ${e.downloads || 0} ${t("downloads")}</small>
      </div>
      ${e.has_correction ? `<span class="badge badge-correction">${t("correction")}</span>` : ""}
      <button class="btn btn-accent btn-sm" onclick="downloadExam('${e.id}')">⬇️ ${t("download")}</button>
      <button class="btn btn-outline btn-sm" onclick="toggleFav('${e.id}', this)">☆</button>
    </div>`).join("") || emptyBlock("📭");
  // أسئلة المادة المنشورة
  const { data: qs } = await db.from("edu_questions").select("id, asker_name, question, answer, created_at").eq("subject_id", id).eq("is_published", true).order("created_at", { ascending: false }).limit(10);
  const qEl = document.getElementById("questions-list");
  qEl.innerHTML = (qs || []).map(q => `
    <div class="card" style="margin-bottom:10px">
      <strong>❓ ${esc(q.question)}</strong>
      <small style="color:var(--text-muted)">— ${esc(q.asker_name)}</small>
      ${q.answer ? `<p style="margin-top:8px;color:var(--success)">✅ ${esc(q.answer)}</p>` : ""}
    </div>`).join("") || `<div class="empty" style="padding:20px">💭 ${t("questions")}</div>`;
}

async function downloadExam(examId) {
  const { data: exam } = await db.from("exams").select("file_path, downloads").eq("id", examId).single();
  if (!exam) return;
  const { data: signed, error } = await db.storage.from("edu-files").createSignedUrl(exam.file_path, 3600);
  if (error) return toast(t("auth_err"));
  db.from("exams").update({ downloads: (exam.downloads || 0) + 1 }).eq("id", examId).then(() => {});
  window.open(signed.signedUrl, "_blank");
}

async function toggleFav(examId, btn) {
  const user = await getStudent();
  if (!user) { location.href = "account.html"; return; }
  const { data: existing } = await db.from("favorites").select("id").eq("user_id", user.id).eq("exam_id", examId).maybeSingle();
  if (existing) {
    await db.from("favorites").delete().eq("id", existing.id);
    btn.textContent = "☆"; toast(t("favorite_removed"));
  } else {
    await db.from("favorites").insert({ user_id: user.id, exam_id: examId });
    btn.textContent = "★"; toast(t("favorite_added"));
  }
}

// ===== الإعلانات =====
async function loadAnnouncements() {
  const el = document.getElementById("ann-list");
  if (!el) return;
  const cat = new URLSearchParams(location.search).get("cat") || "";
  document.querySelectorAll(".chip[data-cat]").forEach(c => c.classList.toggle("active", c.dataset.cat === cat));
  let q = db.from("announcements").select("id, title_ar, body, category, link, published_at").eq("is_published", true).order("published_at", { ascending: false });
  if (cat) q = q.eq("category", cat);
  const { data } = await q;
  el.innerHTML = (data || []).map(a => `
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
        <span class="badge badge-cat">${t(a.category)}</span>
        <small style="color:var(--text-muted)">${new Date(a.published_at).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR")}</small>
      </div>
      <h3>${esc(a.title_ar)}</h3>
      <p style="margin-top:6px">${esc(a.body || "")}</p>
      ${a.link ? `<a class="btn btn-outline btn-sm" style="margin-top:10px" href="${esc(a.link)}" target="_blank">🔗 ${t("view_all")}</a>` : ""}
    </div>`).join("") || emptyBlock("📢");
}
function filterCat(cat) { location.href = "announcements.html" + (cat ? "?cat=" + cat : ""); }

// ===== المساهمة =====
async function loadContribute() {
  const user = await getStudent();
  const formEl = document.getElementById("contrib-form");
  if (!user) {
    formEl.innerHTML = `<div class="empty"><span class="icon">🔐</span>${t("must_login")}
      <p style="margin-top:14px"><a class="btn btn-primary" href="account.html">${t("login")}</a></p></div>`;
    return;
  }
  const uniSel = document.getElementById("c-university");
  const { data: unis } = await db.from("universities").select("id, name_ar, name_fr").eq("is_active", true).order("name_ar");
  uniSel.innerHTML = `<option value="">${t("university")}...</option>` + (unis || []).map(u => `<option value="${u.id}">${esc(lang === "ar" ? u.name_ar : (u.name_fr || u.name_ar))}</option>`).join("");
  uniSel.onchange = loadContribDeps;
}
async function loadContribDeps() {
  const uniId = document.getElementById("c-university").value;
  const depSel = document.getElementById("c-department");
  const semSel = document.getElementById("c-semester");
  const subjSel = document.getElementById("c-subject");
  if (!uniId) { depSel.innerHTML = ""; subjSel.innerHTML = ""; return; }
  const { data: deps } = await db.from("departments").select("id, name_ar, name_fr").eq("university_id", uniId).order("name_ar");
  depSel.innerHTML = `<option value="">${t("department")}...</option>` + (deps || []).map(d => `<option value="${d.id}">${esc(lang === "ar" ? d.name_ar : (d.name_fr || d.name_ar))}</option>`).join("");
  depSel.onchange = async () => {
    const depId = depSel.value;
    if (!depId) { subjSel.innerHTML = ""; return; }
    const { data: sems } = await db.from("semesters").select("id, name_ar, name_fr, sort_order").order("sort_order");
    semSel.innerHTML = `<option value="">${t("semester")}...</option>` + (sems || []).map(s => `<option value="${s.id}">${esc(lang === "ar" ? s.name_ar : (s.name_fr || s.name_ar))}</option>`).join("");
    semSel.onchange = async () => {
      const semId = semSel.value;
      if (!depId || !semId) { subjSel.innerHTML = ""; return; }
      const { data: subs } = await db.from("subjects").select("id, name_ar, name_fr").eq("department_id", depId).eq("semester_id", semId).order("name_ar");
      subjSel.innerHTML = `<option value="">${t("subject")}...</option>` + (subs || []).map(s => `<option value="${s.id}">${esc(lang === "ar" ? s.name_ar : (s.name_fr || s.name_ar))}</option>`).join("");
    };
  };
}
async function submitContribution() {
  const user = await getStudent();
  if (!user) return location.href = "account.html";
  const subjectId = document.getElementById("c-subject").value;
  const type = document.getElementById("c-type").value;
  const year = document.getElementById("c-year").value;
  const session = document.getElementById("c-session").value;
  const file = document.getElementById("c-file").files[0];
  const corr = document.getElementById("c-correction").files[0];
  if (!subjectId || !file) return toast(t("auth_err"));
  const basePath = `contrib/${user.id}/${Date.now()}`;
  const filePath = `${basePath}_${file.name.replace(/[^\w.\-؀-ۿ]/g, "_")}`;
  const { error: upErr } = await db.storage.from("edu-files").upload(filePath, file);
  if (upErr) return toast(upErr.message);
  let corrPath = null;
  if (corr) {
    corrPath = `${basePath}_corr_${corr.name.replace(/[^\w.\-؀-ۿ]/g, "_")}`;
    await db.storage.from("edu-files").upload(corrPath, corr);
  }
  const { error } = await db.from("exams").insert({
    subject_id: subjectId, exam_type: type, year: year || null, session: session || null,
    has_correction: !!corr, file_path: filePath, correction_path: corrPath,
    status: "pending", contributed_by: user.id,
  });
  if (error) return toast(error.message);
  toast(t("contrib_ok"));
  document.getElementById("contrib-form-inner").reset();
}

// ===== سؤال =====
async function sendQuestion() {
  const name = document.getElementById("q-name")?.value.trim() || (lang === "ar" ? "طالب" : "Étudiant");
  const question = document.getElementById("q-text")?.value.trim();
  if (!question) return;
  const { error } = await db.from("edu_questions").insert({ asker_name: name, question, subject_id: param("id") || null });
  if (error) return toast(error.message);
  toast(t("question_sent"));
  document.getElementById("q-text").value = "";
}

// ===== تواصل معنا =====
async function sendContact() {
  const name = document.getElementById("ct-name").value.trim();
  const email = document.getElementById("ct-email").value.trim();
  const msg = document.getElementById("ct-msg").value.trim();
  if (!name || !msg) return;
  const { error } = await db.from("contact_messages").insert({ name, email, message: msg });
  if (error) return toast(error.message);
  toast(t("msg_sent"));
  document.getElementById("ct-form").reset();
}

// ===== مفضلتي =====
async function loadFavorites() {
  const user = await getStudent();
  const el = document.getElementById("favs-list");
  if (!user) { el.innerHTML = `<div class="empty"><span class="icon">🔐</span>${t("must_login")}<p style="margin-top:14px"><a class="btn btn-primary" href="account.html">${t("login")}</a></p></div>`; return; }
  const { data } = await db.from("favorites").select("id, exams(id, exam_type, year, subjects(name_ar, name_fr, id))").eq("user_id", user.id);
  el.innerHTML = (data || []).map(f => {
    const e = f.exams || {}; const s = e.subjects || {};
    return `<div class="item-row">
      <span class="row-icon">${e.exam_type === "assignment" ? "📝" : "📋"}</span>
      <div class="row-body"><strong>${esc(lang === "ar" ? s.name_ar : (s.name_fr || s.name_ar))}</strong><small>${t(e.exam_type)} ${e.year || ""}</small></div>
      <a class="btn btn-primary btn-sm" href="subject.html?id=${esc(s.id || "")}">${t("download")}</a>
    </div>`;
  }).join("") || emptyBlock("⭐");
}

function debounce(fn, ms) { let tmr; return (...a) => { clearTimeout(tmr); tmr = setTimeout(() => fn(...a), ms); }; }

// إعداد عام لجميع الصفحات
async function initSite() {
  applyLang();
  // روابط حسب اللغة
  document.querySelectorAll("[data-t]").forEach(el => { if (el.tagName === "A" && !el.textContent.trim()) el.textContent = t(el.getAttribute("data-t")); });
  // حالة الحساب في الترويسة
  const user = await getStudent();
  const accEl = document.getElementById("account-link");
  if (accEl && user) { accEl.href = "account.html"; accEl.textContent = "⭐ " + t("account"); }
  // رابط لوحة التحكم في تذييل الموقع العام
  const fb = document.querySelector(".footer-bottom");
  if (fb && !document.getElementById("admin-link")) {
    const a = document.createElement("a");
    a.id = "admin-link"; a.href = "login.html";
    a.style.cssText = "display:inline-block;margin-inline-start:12px;opacity:.8;text-decoration:underline;font-weight:700";
    a.textContent = "🔐 " + t("admin_panel");
    fb.appendChild(a);
  }
}
