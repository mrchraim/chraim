/* ============================================================
   exams.js — 🗂️ أرشيف الامتحانات (دمج منصة إدارة ملفات الطلبة)
   CHRVVIM Campus — وحدة مستقلة: تُحقن داخل #p-exams
   البيانات: Supabase (exam_files + حاوية edu-files)
   المواد: من subjects-data.js (window.CHRVVIM_SUBJECTS)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- أدوات محلية (لا تعتمد على app.js إلا UILANG اختيارياً) ---------- */
  const $x = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function lang() { try { return (typeof UILANG !== 'undefined' && UILANG) ? UILANG : 'ar'; } catch (e) { return 'ar'; } }

  /* ---------- نصوص الوحدة (ar / fr / en — مع رجوع تلقائي للعربية) ---------- */
  const S = {
    'ex.title':      { ar: '🗂️ أرشيف الامتحانات', fr: "Archive des examens", en: 'Exam archive' },
    'ex.desc':       { ar: 'امتحانات وفروض مواد كلية العلوم القانونية والسياسية بأكادير — حمّل الملفات وساهم بملفاتك (تدخل المساهمة بعد مراجعة الإدارة).', fr: "Examens et devoirs des matières de la Faculté des sciences juridiques et politiques d'Agadir — téléchargez et contribuez (contributions modérées par l'administration).", en: 'Exams and assignments for Agadir Law & Political Science Faculty subjects — download files and contribute (submissions are reviewed).' },
    'ex.search':     { ar: '🔍 ابحث عن مادة…', fr: 'Rechercher une matière…', en: 'Search a subject…' },
    'ex.allTracks':  { ar: 'كل الشعب', fr: 'Toutes les filières', en: 'All tracks' },
    'ex.allSems':    { ar: 'كل الفصول', fr: 'Tous les semestres', en: 'All semesters' },
    'ex.allTypes':   { ar: 'كل الأنواع', fr: 'Tous les types', en: 'All types' },
    'ex.exam':       { ar: 'امتحان', fr: 'Examen', en: 'Exam' },
    'ex.assignment': { ar: 'فرض', fr: 'Devoir', en: 'Assignment' },
    'ex.corr':       { ar: 'مع التصحيح', fr: 'avec correction', en: 'with correction' },
    'ex.normal':     { ar: 'دورة عادية', fr: 'Session normale', en: 'Normal session' },
    'ex.makeup':     { ar: 'دورة مُداومة', fr: 'Session rattrapage', en: 'Makeup session' },
    'ex.downloads':  { ar: 'تحميل', fr: 'téléchargements', en: 'downloads' },
    'ex.download':   { ar: '⬇️ تحميل', fr: '⬇️ Télécharger', en: '⬇️ Download' },
    'ex.loading':    { ar: '… جارٍ تحميل الملفات', fr: '… chargement des fichiers', en: '… loading files' },
    'ex.empty':      { ar: 'لا توجد ملفات مطابقة بعد — كن أول من يساهم! 🎁', fr: 'Aucun fichier pour le moment — soyez le premier à contribuer ! 🎁', en: 'No files yet — be the first to contribute! 🎁' },
    'ex.error':      { ar: 'تعذّر الاتصال بخادم الملفات — حاول لاحقاً.', fr: 'Impossible de contacter le serveur — réessayez plus tard.', en: 'Could not reach the file server — try later.' },
    'ex.count':      { ar: 'ملف متاح', fr: 'fichiers disponibles', en: 'files available' },
    'ex.contrib':    { ar: '➕ساهم بملف (امتحان أو فرض)', fr: '➕ Contribuer un fichier (examen/devoir)', en: '➕ Contribute a file (exam/assignment)' },
    'ex.cName':      { ar: 'اسمك (أو عائلتك)', fr: 'Votre nom', en: 'Your name' },
    'ex.cSubject':   { ar: 'المادة', fr: 'Matière', en: 'Subject' },
    'ex.cType':      { ar: 'النوع', fr: 'Type', en: 'Type' },
    'ex.cYear':      { ar: 'السنة الجامعية (مثال 2026)', fr: 'Année (ex. 2026)', en: 'Year (e.g. 2026)' },
    'ex.cSession':   { ar: 'الدورة', fr: 'Session', en: 'Session' },
    'ex.cFile':      { ar: 'ملف الفرض/الامتحان (PDF — 15MB كحد أقصى)', fr: 'Fichier (PDF — max 15 Mo)', en: 'File (PDF — max 15 MB)' },
    'ex.cCorr':      { ar: 'ملف التصحيح (اختياري)', fr: 'Correction (facultatif)', en: 'Correction (optional)' },
    'ex.send':       { ar: '📤 إرسال المساهمة', fr: '📤 Envoyer', en: '📤 Submit' },
    'ex.sending':    { ar: '…جارٍ الرفع', en: '…uploading', fr: '…envoi en cours' },
    'ex.ok':         { ar: '✅ وصلت مساهمتك! ستظهر للجميع بعد مراجعة الإدارة.', fr: '✅ Merci ! Votre contribution apparaîtra après validation.', en: '✅ Received! It will appear after admin review.' },
    'ex.needName':   { ar: '⚠️ اكتب اسمك من فضلك.', fr: '⚠️ Indiquez votre nom.', en: '⚠️ Please enter your name.' },
    'ex.needSubj':   { ar: '⚠️ اختر المادة.', fr: '⚠️ Choisissez la matière.', en: '⚠️ Please choose a subject.' },
    'ex.needFile':   { ar: '⚠️ اختر ملفاً للرفع.', fr: '⚠️ Choisissez un fichier.', en: '⚠️ Please choose a file.' },
    'ex.bigFile':    { ar: '⚠️ حجم الملف يتجاوز 15MB.', fr: '⚠️ Fichier trop volumineux (>15 Mo).', en: '⚠️ File exceeds 15 MB.' },
    'ex.uploadFail': { ar: 'فشل الرفع: ', fr: "Échec de l'envoi : ", en: 'Upload failed: ' },
    'ex.dlFail':     { ar: 'تعذّر تحميل الملف الآن.', fr: 'Téléchargement impossible pour le moment.', en: 'Download unavailable right now.' },
    'ex.semester':   { ar: 'الفصل', fr: 'Semestre', en: 'Semester' }
  };
  const tt = k => { const e = S[k]; const s = e ? (e[lang()] || e.ar) : k; return window.CHRVVIM_GENDER ? window.CHRVVIM_GENDER.apply(s) : s; };

  /* تسميات الشعب والفصول والأنواع */
  const TRACKS = {
    'common-ar':        { ar: 'الشعبة المشتركة', fr: 'Tronc commun', en: 'Common track' },
    'private-law':      { ar: 'القانون الخاص', fr: 'Droit privé', en: 'Private law' },
    'criminal-sciences':{ ar: 'العلوم الجنائية', fr: 'Sciences pénales', en: 'Criminal sciences' }
  };
  const trName = k => { const e = TRACKS[k]; return e ? (e[lang()] || e.ar) : k; };
  const semName = s => tt('ex.semester') + ' ' + String(s || '').replace(/^S/i, '');

  /* ---------- Supabase (نفس إعداد الموقع) ---------- */
  function SB() { const c = window.CHRVVIM_SUPABASE; return (c && c.url && c.anonKey) ? c : null; }
  const KEY = () => SB().anonKey;
  const BASE = () => String(SB().url).replace(/\/+$/, '');

  /* ---------- خريطة المواد ---------- */
  let SUBJ = {};   // id -> {track,semester,name:{ar,fr,en}}
  let SUBJ_LIST = [];
  (function buildSubjects() {
    try {
      const cs = window.CHRVVIM_SUBJECTS;
      if (cs && Array.isArray(cs.subjects)) {
        cs.subjects.forEach(s => { SUBJ[s.id] = s; SUBJ_LIST.push(s); });
      }
    } catch (e) { /* subjects-data.js قد يكون متأخراً — يُعاد البناء عند render */ }
  })();
  function ensureSubjects() {
    if (SUBJ_LIST.length) return;
    try {
      const cs = window.CHRVVIM_SUBJECTS;
      if (cs && Array.isArray(cs.subjects)) {
        cs.subjects.forEach(s => { SUBJ[s.id] = s; SUBJ_LIST.push(s); });
      }
    } catch (e) { }
  }
  function subjName(s, id) {
    if (!s) return id || '—';
    const n = s.name || {};
    return n[lang()] || n.ar || id;
  }

  /* ---------- جلب ملفات الامتحانات (مع كاش) ---------- */
  let _items = null, _loading = false;
  async function fetchExams(force) {
    if (_items && !force) return _items;
    if (_loading) return null;
    _loading = true;
    try {
      const r = await fetch(BASE() + '/rest/v1/exam_files?select=id,subject_id,exam_type,year,session,has_correction,file_path,correction_path,downloads,contributor_name,created_at&status=eq.approved&order=year.desc,created_at.desc&limit=300',
        { headers: { apikey: KEY(), Authorization: 'Bearer ' + KEY() } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const rows = await r.json();
      _items = Array.isArray(rows) ? rows : [];
      return _items;
    } catch (e) {
      _items = null;
      return null;
    } finally { _loading = false; }
  }

  /* ---------- الحالة (فلاتر) ---------- */
  const F = { q: '', track: '', sem: '', type: '' };

  /* ---------- إندرج CSS مرة واحدة ---------- */
  let _styled = false;
  function ensureStyle() {
    if (_styled || document.getElementById('exams-style')) return;
    _styled = true;
    const st = document.createElement('style');
    st.id = 'exams-style';
    st.textContent = `
.ex-wrap{display:flex;flex-direction:column;gap:14px}
.ex-h{font-size:1.02rem;font-weight:800;margin:0 0 4px}
.ex-d{color:var(--muted);font-size:.82rem;margin:0;line-height:1.8}
.ex-filters{display:grid;grid-template-columns:1fr;gap:8px}
@media(min-width:640px){.ex-filters{grid-template-columns:2fr 1fr 1fr}}
.ex-in{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--card);box-sizing:border-box}
.ex-cnt{color:var(--muted);font-size:.76rem;font-weight:700}
.ex-list{display:flex;flex-direction:column;gap:8px}
.ex-row{display:flex;gap:10px;align-items:center;padding:11px 12px;border:1px solid var(--line);border-radius:14px;background:var(--card);flex-wrap:wrap}
.ex-main{flex:1;min-width:170px}
.ex-nm{font-weight:800;font-size:.9rem;line-height:1.5}
.ex-mt{color:var(--muted);font-size:.73rem;display:flex;gap:8px;flex-wrap:wrap;margin-top:3px;align-items:center}
.ex-chip{display:inline-block;padding:2px 9px;border-radius:999px;font-size:.68rem;font-weight:800;background:var(--soft);color:var(--blue2);border:1px solid var(--line);white-space:nowrap}
:root[data-theme=dark] .ex-chip{color:var(--gold2)}
.ex-chip.ok{background:rgba(45,122,95,.12);color:var(--ok);border-color:transparent}
.ex-dl{white-space:nowrap;padding:9px 14px;font-size:.8rem}
.ex-note{padding:14px;border-radius:12px;border:1px dashed var(--line);color:var(--muted);font-size:.84rem;text-align:center;line-height:1.8}
.ex-msg{padding:11px 13px;border-radius:12px;font-weight:700;font-size:.85rem;line-height:1.7}
.ex-msg.ok{background:rgba(45,122,95,.10);border:1px solid var(--ok);color:var(--ok)}
.ex-msg.err{background:rgba(193,18,31,.07);border:1px solid var(--error);color:var(--error)}
.ex-contrib{border:1px solid var(--line);border-radius:14px;padding:4px 12px;background:var(--soft)}
.ex-contrib summary{cursor:pointer;font-weight:800;color:var(--blue2);padding:8px 2px;font-size:.9rem;list-style:none}
.ex-contrib summary::marker,.ex-contrib summary::-webkit-details-marker{display:none}
:root[data-theme=dark] .ex-contrib summary{color:var(--gold2)}
.ex-form{display:grid;gap:10px;padding:6px 2px 12px}
.ex-form .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ex-form .row2 label,.ex-form .lbl{font-weight:700;font-size:.76rem;color:var(--muted);display:block;margin-bottom:4px}
.ex-form input[type=text],.ex-form input[type=number],.ex-form input[type=file],.ex-form select{width:100%}
`;
    document.head.appendChild(st);
  }

  /* ---------- بناء الواجهة ---------- */
  let _built = false;
  function build() {
    ensureStyle();
    const p = $x('p-exams');
    if (!p) return;
    p.innerHTML =
      '<div class="ex-wrap">' +
      '<h2 class="ex-h">' + esc(tt('ex.title')) + '</h2>' +
      '<p class="ex-d">' + esc(tt('ex.desc')) + '</p>' +
      '<div class="ex-filters">' +
      '<input type="text" class="ex-in" id="ex-q" placeholder="' + esc(tt('ex.search')) + '" aria-label="' + esc(tt('ex.search')) + '">' +
      '<select class="ex-in" id="ex-track" aria-label="track"></select>' +
      '<select class="ex-in" id="ex-sem" aria-label="semester"></select>' +
      '</div>' +
      '<div class="ex-filters">' +
      '<select class="ex-in" id="ex-type" aria-label="type"></select>' +
      '<div class="ex-cnt" id="ex-count"></div>' +
      '</div>' +
      '<div class="ex-list" id="ex-list"><div class="ex-note">' + esc(tt('ex.loading')) + '</div></div>' +
      '<details class="ex-contrib" id="ex-contrib-d">' +
      '<summary>' + esc(tt('ex.contrib')) + '</summary>' +
      '<form class="ex-form" id="ex-form">' +
      '<div><label class="lbl" for="ex-f-name">' + esc(tt('ex.cName')) + '</label>' +
      '<input type="text" class="ex-in" id="ex-f-name" maxlength="60" autocomplete="name" required></div>' +
      '<div><label class="lbl" for="ex-f-subj">' + esc(tt('ex.cSubject')) + '</label>' +
      '<select class="ex-in" id="ex-f-subj" required></select></div>' +
      '<div class="row2">' +
      '<div><label for="ex-f-type">' + esc(tt('ex.cType')) + '</label>' +
      '<select class="ex-in" id="ex-f-type">' +
      '<option value="exam">' + esc(tt('ex.exam')) + '</option>' +
      '<option value="assignment">' + esc(tt('ex.assignment')) + '</option></select></div>' +
      '<div><label for="ex-f-year">' + esc(tt('ex.cYear')) + '</label>' +
      '<input type="number" class="ex-in" id="ex-f-year" min="2000" max="2035" value="' + (new Date().getFullYear()) + '"></div>' +
      '</div>' +
      '<div><label class="lbl" for="ex-f-sess">' + esc(tt('ex.cSession')) + '</label>' +
      '<select class="ex-in" id="ex-f-sess">' +
      '<option value="normal">' + esc(tt('ex.normal')) + '</option>' +
      '<option value="makeup">' + esc(tt('ex.makeup')) + '</option></select></div>' +
      '<div><label class="lbl" for="ex-f-file">' + esc(tt('ex.cFile')) + '</label>' +
      '<input type="file" class="ex-in" id="ex-f-file" accept=".pdf,application/pdf" required></div>' +
      '<div><label class="lbl" for="ex-f-corr">' + esc(tt('ex.cCorr')) + '</label>' +
      '<input type="file" class="ex-in" id="ex-f-corr" accept=".pdf,application/pdf"></div>' +
      '<div id="ex-f-msg"></div>' +
      '<button type="submit" class="btn" id="ex-f-send">' + esc(tt('ex.send')) + '</button>' +
      '</form>' +
      '</details>' +
      '</div>';

    /* فلاتر */
    fillSelect($x('ex-track'), tt('ex.allTracks'), Object.keys(TRACKS).map(k => [k, trName(k)]));
    const sems = [];
    for (let i = 1; i <= 6; i++) { const v = 'S' + i; if (SUBJ_LIST.some(s => s.semester === v)) sems.push([v, semName(v)]); }
    fillSelect($x('ex-sem'), tt('ex.allSems'), sems);
    fillSelect($x('ex-type'), tt('ex.allTypes'), [['exam', tt('ex.exam')], ['assignment', tt('ex.assignment')]]);

    /* مواد نموذج المساهمة */
    const sel = $x('ex-f-subj');
    let opts = '<option value="">—</option>';
    const groups = {};
    SUBJ_LIST.forEach(s => { const k = s.track + '|' + s.semester; (groups[k] = groups[k] || []).push(s); });
    Object.keys(groups).sort().forEach(k => {
      const [tr, sem] = k.split('|');
      opts += '<optgroup label="' + esc(trName(tr) + ' — ' + semName(sem)) + '">';
      groups[k].sort((a, b) => subjName(a, a.id).localeCompare(subjName(b, b.id), 'ar')).forEach(s => {
        opts += '<option value="' + esc(s.id) + '">' + esc(subjName(s, s.id)) + '</option>';
      });
      opts += '</optgroup>';
    });
    sel.innerHTML = opts;

    /* أحداث */
    $x('ex-q').oninput = e => { F.q = e.target.value.trim().toLowerCase(); paintList(); };
    $x('ex-track').onchange = e => { F.track = e.target.value; paintList(); };
    $x('ex-sem').onchange = e => { F.sem = e.target.value; paintList(); };
    $x('ex-type').onchange = e => { F.type = e.target.value; paintList(); };
    $x('ex-form').onsubmit = onContribute;

    _built = true;
  }

  function fillSelect(sel, allLabel, pairs) {
    if (!sel) return;
    let o = '<option value="">' + esc(allLabel) + '</option>';
    pairs.forEach(p => { o += '<option value="' + esc(p[0]) + '">' + esc(p[1]) + '</option>'; });
    sel.innerHTML = o;
  }

  /* ---------- رسم القائمة ---------- */
  function paintList() {
    const list = $x('ex-list'), cnt = $x('ex-count');
    if (!list) return;
    if (_items === null) { list.innerHTML = '<div class="ex-note">' + esc(tt('ex.error')) + '</div>'; if (cnt) cnt.textContent = ''; return; }
    const rows = _items.filter(r => {
      const s = SUBJ[r.subject_id];
      if (F.track && (!s || s.track !== F.track)) return false;
      if (F.sem && (!s || s.semester !== F.sem)) return false;
      if (F.type && r.exam_type !== F.type) return false;
      if (F.q) {
        const hay = ((s && (s.name.ar + ' ' + s.name.fr + ' ' + s.name.en)) + ' ' + r.subject_id + ' ' + (r.contributor_name || '') + ' ' + (r.year || '')).toLowerCase();
        if (hay.indexOf(F.q) < 0) return false;
      }
      return true;
    });
    if (cnt) cnt.textContent = rows.length + ' ' + tt('ex.count');
    if (!rows.length) { list.innerHTML = '<div class="ex-note">' + esc(tt('ex.empty')) + '</div>'; return; }
    list.innerHTML = rows.map(r => {
      const s = SUBJ[r.subject_id];
      const meta = [
        s ? esc(trName(s.track)) : '',
        s ? esc(semName(s.semester)) : '',
        r.year ? esc(r.year) : '',
        r.session === 'makeup' ? esc(tt('ex.makeup')) : (r.session === 'normal' ? esc(tt('ex.normal')) : ''),
        '⬇️ ' + (r.downloads || 0) + ' ' + esc(tt('ex.downloads'))
      ].filter(Boolean).join(' · ');
      const badges =
        (r.exam_type === 'assignment' ? '<span class="ex-chip">' + esc(tt('ex.assignment')) + '</span>' : '<span class="ex-chip">' + esc(tt('ex.exam')) + '</span>') +
        (r.has_correction ? ' <span class="ex-chip ok">' + esc(tt('ex.corr')) + '</span>' : '');
      return '<article class="ex-row">' +
        '<div class="ex-main">' +
        '<div class="ex-nm">' + esc(subjName(s, r.subject_id)) + '</div>' +
        '<div class="ex-mt">' + badges + '<span>' + meta + '</span></div>' +
        '</div>' +
        '<button type="button" class="btn ex-dl" data-dl="' + esc(r.id) + '">' + esc(tt('ex.download')) + '</button>' +
        '</article>';
    }).join('');
    list.querySelectorAll('[data-dl]').forEach(b => {
      b.onclick = () => {
        const r = _items.find(x => x.id === b.dataset.dl);
        if (r) download(r, b);
      };
    });
  }

  /* ---------- تحميل ملف عبر رابط مؤقت + عدّاد ---------- */
  async function download(row, btn) {
    if (!SB()) { alert(tt('ex.dlFail')); return; }
    const old = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    try {
      const r = await fetch(BASE() + '/storage/v1/object/sign/edu-files/' + row.file_path.split('/').map(encodeURIComponent).join('/'), {
        method: 'POST',
        headers: { apikey: KEY(), Authorization: 'Bearer ' + KEY(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 3600 })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.signedURL) throw new Error(j.message || 'sign failed');
      window.open(BASE() + '/storage/v1' + j.signedURL, '_blank', 'noopener');
      /* عدّاد التحميلات (RPC يتجاوز RLS) */
      fetch(BASE() + '/rest/v1/rpc/bump_exam_download', {
        method: 'POST',
        headers: { apikey: KEY(), Authorization: 'Bearer ' + KEY(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: row.id })
      }).catch(() => { });
      row.downloads = (row.downloads || 0) + 1;
      paintList();
    } catch (e) {
      alert(tt('ex.dlFail'));
      if (btn) { btn.disabled = false; btn.textContent = old; }
    }
  }

  /* ---------- المساهمة (زائر: رفع + إدراج pending) ---------- */
  function safeName(f) {
    const base = (f.name || 'file').replace(/\.[a-z0-9]+$/i, '');
    return base.replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'file';
  }
  async function uploadTo(path, file) {
    const r = await fetch(BASE() + '/storage/v1/object/edu-files/' + path.split('/').map(encodeURIComponent).join('/'), {
      method: 'POST',
      headers: { apikey: KEY(), Authorization: 'Bearer ' + KEY(), 'x-upsert': 'false', 'Content-Type': file.type || 'application/pdf' },
      body: file
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.message || j.error || ('HTTP ' + r.status));
    }
    return path;
  }
  async function onContribute(ev) {
    ev.preventDefault();
    const msg = $x('ex-f-msg'), send = $x('ex-f-send');
    const fMsg = (txt, ok) => { if (msg) msg.innerHTML = '<div class="ex-msg ' + (ok ? 'ok' : 'err') + '">' + esc(txt) + '</div>'; };
    if (!SB()) { fMsg(tt('ex.error'), false); return; }
    const name = $x('ex-f-name').value.trim();
    const subj = $x('ex-f-subj').value;
    const type = $x('ex-f-type').value;
    const year = parseInt($x('ex-f-year').value, 10) || null;
    const sess = $x('ex-f-sess').value;
    const file = $x('ex-f-file').files[0];
    const corr = $x('ex-f-corr').files[0];
    if (!name) return fMsg(tt('ex.needName'), false);
    if (!subj) return fMsg(tt('ex.needSubj'), false);
    if (!file) return fMsg(tt('ex.needFile'), false);
    if (file.size > 15 * 1024 * 1024 || (corr && corr.size > 15 * 1024 * 1024)) return fMsg(tt('ex.bigFile'), false);
    send.disabled = true; send.textContent = tt('ex.sending');
    const stamp = Date.now();
    try {
      const pMain = 'contrib/' + stamp + '_' + safeName(file) + '.pdf';
      await uploadTo(pMain, file);
      let pCorr = null;
      if (corr) { pCorr = 'contrib/' + stamp + '_corr_' + safeName(corr) + '.pdf'; await uploadTo(pCorr, corr); }
      const r = await fetch(BASE() + '/rest/v1/exam_files', {
        method: 'POST',
        headers: { apikey: KEY(), Authorization: 'Bearer ' + KEY(), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          subject_id: subj, exam_type: type, year: year, session: sess,
          has_correction: !!pCorr, file_path: pMain, correction_path: pCorr,
          status: 'pending', contributor_name: name
        })
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || j.hint || ('HTTP ' + r.status));
      }
      fMsg(tt('ex.ok'), true);
      $x('ex-form').reset();
    } catch (e) {
      fMsg(tt('ex.uploadFail') + (e.message || ''), false);
    } finally {
      send.disabled = false; send.textContent = tt('ex.send');
    }
  }

  /* ---------- الواجهة العامة ---------- */
  let _ever = false;
  window.Exams = {
    render: function () {
      ensureSubjects();
      build();
      fetchExams().then(items => { if (_ever || items !== null) { paintList(); _ever = true; } });
    },
    refresh: function () { fetchExams(true).then(() => paintList()); }
  };
})();
