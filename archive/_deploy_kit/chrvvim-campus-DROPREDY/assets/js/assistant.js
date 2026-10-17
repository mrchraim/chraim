// ==========================================================================
// البحث الموحّد + مساعد الطالب.
// - البحث الموحّد: فهرس واحد فوق المؤسسات والمسالك والمواد والوثائق والإعلانات
//   والمكتبة القانونية.
// - المساعد: يشتغل بقواعد صريحة فوق البيانات المحمّلة فقط (بلا إنترنت، بلا تخمين).
//   إذا لم يجد جواباً في البيانات يقول بصراحة «لا أعرف» بدل اختلاق معلومة.
// ==========================================================================
import { $, $$, esc } from './util.js';
import { pick } from './i18n.js';
import { loadInstitutions, arabicNorm, TYPE_AR, safeHref, bySlug } from './institutions.js';

let ROOT = null;
let INDEX = [];
let INST = null;
let started = false;

/** يبني فهرس البحث الموحّد من كل المصادر المحمّلة. */
export function buildIndex(instData, app) {
  const idx = [];

  // 1) المؤسسات
  for (const e of instData?.establishments || []) {
    idx.push({
      kind: 'institution', kindLabel: 'مؤسسة',
      title: e.name_ar, sub: `${TYPE_AR[e.type] || ''} · ${e.city_ar || ''}`,
      hash: `#institutions/${e.slug}`,
      text: arabicNorm([e.name_ar, e.name_fr, e.city_ar, (e.leadership || []).map((l) => l.name).join(' ')].join(' ')),
    });
  }
  for (const o of instData?.outside || []) {
    idx.push({ kind: 'institution', kindLabel: 'مؤسسة (خارج القائمة)', title: o.name_ar, sub: TYPE_AR[o.type] || '', hash: '#institutions', text: arabicNorm(o.name_ar) });
  }

  // 2) المسالك والمواد من الدليل الأكاديمي
  for (const [sem, bucket] of Object.entries(app?.guide?.semesters || {})) {
    for (const [id, tk] of Object.entries(bucket.tracks || {})) {
      const label = pick(tk.label, id);
      idx.push({ kind: 'track', kindLabel: 'مسلك', title: label, sub: `${sem} · ${pick(bucket.label, sem)}`, hash: '#tracks', text: arabicNorm(`${label} ${sem}`) });
      for (const c of tk.courses || []) {
        const name = c.subject || c.name || '';
        idx.push({
          kind: 'subject', kindLabel: 'مادة', title: name,
          sub: `${sem} · ${label}`,
          hash: '#subjects',
          text: arabicNorm(`${name} ${label} ${sem} ${Array.isArray(c.professors) ? c.professors.join(' ') : c.professors || ''}`),
        });
      }
    }
  }

  // 3) الوثائق الرسمية
  for (const d of app?.documents || []) {
    idx.push({
      kind: 'document', kindLabel: 'وثيقة', title: d.title, sub: `${d.semester || ''} · ${d.track || ''} ${d.description || ''}`.trim(),
      url: d.file, text: arabicNorm(`${d.title} ${d.semester || ''} ${d.track || ''} ${d.description || ''}`),
    });
  }

  // 4) الإعلانات
  for (const a of app?.announcements || []) {
    idx.push({ kind: 'announcement', kindLabel: 'إعلان', title: a.title, sub: a.body || '', hash: '#timetable', text: arabicNorm(`${a.title} ${a.body || ''} ${a.kind || ''}`) });
  }

  // 5) المكتبة القانونية
  for (const doc of app?.legalLibrary?.documents || []) {
    const title = doc.title || doc.name || doc.label || '';
    if (!title) continue;
    idx.push({
      kind: 'law', kindLabel: 'مكتبة قانونية', title,
      sub: doc.category || doc.description || '',
      hash: '#library',
      text: arabicNorm(`${title} ${doc.category || ''} ${doc.description || ''} ${doc.year || ''}`),
    });
  }
  return idx;
}

function scoreEntry(entry, q, qs) {
  const t = arabicNorm(entry.title);
  if (t === q) return 5;
  if (t.startsWith(q)) return 4;
  if (t.includes(q)) return 3;
  if (entry.text.includes(q)) return 2;
  if (qs && entry.text.replace(/ /g, '').includes(qs)) return 1;
  return 0;
}

export function unifiedSearch(query, index = INDEX) {
  const q = arabicNorm(query);
  if (!q) return [];
  const qs = q.replace(/ /g, '');
  return index
    .map((entry) => ({ entry, score: scoreEntry(entry, q, qs) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entry);
}

function hitHtml(e) {
  const inner = `<span class="uni-kind">${esc(e.kindLabel)}</span><b>${esc(e.title)}</b>${e.sub ? `<small>${esc(e.sub)}</small>` : ''}`;
  if (e.url) return `<a class="uni-hit" href="${esc(e.url)}" target="_blank" rel="noopener">${inner}</a>`;
  return `<button class="uni-hit" type="button" data-go="${esc(e.hash || '')}">${inner}</button>`;
}

const GROUP_ORDER = ['institution', 'track', 'subject', 'document', 'law', 'announcement'];

function renderResults(query) {
  const box = $('#uniResults', ROOT);
  if (!query.trim()) { box.innerHTML = ''; return; }
  const results = unifiedSearch(query).slice(0, 40);
  if (!results.length) {
    box.innerHTML = `<div class="inst-empty">لا نتيجة في البيانات المتوفرة عن «${esc(query)}». جرّب كلمة أخرى، أو اسأل المساعد بالأسفل.</div>`;
    return;
  }
  const groups = {};
  for (const e of results) (groups[e.kind] = groups[e.kind] || []).push(e);
  box.innerHTML = GROUP_ORDER.filter((k) => groups[k]).map((k) => `
    <div class="uni-group">
      <h4>${esc(groups[k][0].kindLabel)} (${groups[k].length})</h4>
      ${groups[k].map(hitHtml).join('')}
    </div>`).join('');
  $$('.uni-hit[data-go]', box).forEach((b) => b.addEventListener('click', () => { location.hash = b.getAttribute('data-go'); }));
}

// --- المساعد -----------------------------------------------------------

function link(hash, label) { return `<a href="${esc(hash)}">${esc(label)}</a>`; }

/** يجيب على سؤال من البيانات فقط. */
export function answer(question, index = INDEX, inst = INST) {
  const raw = String(question || '').trim();
  const q = arabicNorm(raw);
  if (!q) return 'اكتب سؤالك أولاً.';

  // تحية
  if (/^(سلام|مرحبا|اهلا|صباح|مساء|مرحبتين)/.test(q)) {
    return 'أهلاً بك. اسألني عن مؤسسة، أو مسلك، أو مادة، أو وثيقة، أو استعمال الزمن — وسأجيب من بيانات البوابة فقط.';
  }

  // مؤسسة بعينها
  const instHit = searchInstitutionLocal(q, inst);
  if (instHit) {
    const e = instHit;
    const lead = (e.leadership || []).map((l) => `${esc(l.role_ar)}: ${esc(l.name)}`).join(' — ');
    const lines = [`<b>${esc(e.name_ar)}</b> (${esc(TYPE_AR[e.type] || '')} · ${esc(e.city_ar || '')})`];
    if (lead) lines.push(lead);
    if (e.address) lines.push(`العنوان: ${esc(e.address)}`);
    if (e.phone) lines.push(`الهاتف: ${esc(e.phone)}`);
    lines.push(link(`#institutions/${e.slug}`, 'افتح باب المؤسسة كاملاً'));
    return lines.join('<br>');
  }

  // نيّات عامة → توجيه للقسم المناسب مع نتائج
  const routes = [
    { re: /(فوج|افواج|لقب|عائلي|شعبة)/, hash: '#finder', label: 'ابحث عن فوجك' },
    { re: /(استعمال الزمن|جدول|توقيت|حصة|حصص|توزيع)/, hash: '#timetable', label: 'استعمال الزمن' },
    { re: /(مادة|مواد|مقابل|برنامج الدروس)/, hash: '#subjects', label: 'المواد والمقابلات' },
    { re: /(وثيق|ملف|pdf|تحميل)/, hash: '#documents', label: 'الوثائق' },
    { re: /(معدل|نقطة|نقط|GPA)/i, hash: '#gpa', label: 'حاسبة المعدل' },
    { re: /(قانون|مدونة|نص|مكتبة|دستور)/, hash: '#library', label: 'المكتبة القانونية' },
    { re: /(استاذ|اساتذة|قاعة|قاعات|دليل)/, hash: '#directory', label: 'الدليل' },
  ];
  for (const r of routes) {
    if (r.re.test(q)) {
      const results = unifiedSearch(raw, index).slice(0, 3);
      const extra = results.length ? '<br>نتائج قريبة:<ul>' + results.map((x) => `<li>${hitInline(x)}</li>`).join('') + '</ul>' : '';
      return `لتجد ذلك استعمل قسم ${link(r.hash, r.label)}.${extra}`;
    }
  }

  // بحث موحّد عام
  const results = unifiedSearch(raw, index).slice(0, 5);
  if (results.length) {
    return 'وجدت هذه النتائج في البيانات:<ul>' + results.map((x) => `<li>${hitInline(x)}</li>`).join('') + '</ul>';
  }

  return 'لا أعرف — لا تتوفر لديّ معلومة مؤكدة عن ذلك في بيانات البوابة، ولن أخترع جواباً. جرّب صياغة أخرى، أو ابحث في الأقسام أعلاه.';
}

function searchInstitutionLocal(q, inst = INST) {
  const list = inst?.establishments || [];
  let best = null;
  for (const e of list) {
    const names = [arabicNorm(e.name_ar), arabicNorm(e.name_fr)];
    if (names.some((n) => n && (n === q || (q.length >= 6 && n.includes(q))))) {
      if (!best || (e.name_ar || '').length < (best.name_ar || '').length) best = e;
    }
  }
  return best;
}

function hitInline(e) {
  if (e.url) return `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>`;
  return `<a href="${esc(e.hash || '#')}">${esc(e.title)}</a>`;
}

function pushMsg(role, html) {
  const log = $('#uniLog', ROOT);
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = html;
  log.appendChild(div);
  log.scrollIntoView({ block: 'nearest' });
}

function ask(text) {
  const q = String(text || '').trim();
  if (!q) return;
  pushMsg('user', esc(q));
  pushMsg('bot', answer(q));
}

function shellHtml() {
  return `
  <h2>البحث الموحّد ومساعد الطالب</h2>
  <p class="muted">ابحث في المؤسسات والمسالك والمواد والوثائق والإعلانات والمكتبة القانونية في مكان واحد، أو اسأل المساعد مباشرة.</p>
  <div class="uni-form">
    <input id="uniQuery" type="search" autocomplete="off" spellcheck="false" placeholder="اكتب كلمة: مثل «كلية العلوم» أو «مدونة الأسرة» أو «S5 القانون العام»…" aria-label="البحث الموحّد">
    <button class="btn" id="uniGo" type="button">ابحث</button>
  </div>
  <div class="uni-examples" id="uniExamples"></div>
  <div id="uniResults"></div>

  <hr style="margin:22px 0;border:none;border-top:1px solid var(--line)">
  <h3 style="margin:0 0 6px">مساعد الطالب</h3>
  <p class="muted" style="margin-top:0">مساعد محلي يجيب من بيانات البوابة فقط. لا يتصل بأي خدمة خارجية، ولا يختلق معلومة.</p>
  <div class="assistant-log" id="uniLog" aria-live="polite"></div>
  <div class="uni-form">
    <input id="uniAsk" type="text" autocomplete="off" placeholder="اكتب سؤالك للمساعد…" aria-label="سؤال للمساعد">
    <button class="btn gold" id="uniAskGo" type="button">اسأل</button>
  </div>`;
}

function wire() {
  const q = $('#uniQuery', ROOT);
  const examples = ['كلية العلوم', 'المدرسة الوطنية للتجارة', 'مدونة الأسرة', 'القانون العام S5', 'الداخلة'];
  $('#uniExamples', ROOT).innerHTML = examples.map((x) => `<button type="button" data-ex="${esc(x)}">${esc(x)}</button>`).join('');
  $$('#uniExamples button', ROOT).forEach((b) => b.addEventListener('click', () => { q.value = b.getAttribute('data-ex'); renderResults(q.value); }));
  $('#uniGo', ROOT).addEventListener('click', () => renderResults(q.value));
  q.addEventListener('input', () => renderResults(q.value));
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') renderResults(q.value); });
  const askInput = $('#uniAsk', ROOT);
  $('#uniAskGo', ROOT).addEventListener('click', () => { ask(askInput.value); askInput.value = ''; });
  askInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { ask(askInput.value); askInput.value = ''; } });
  pushMsg('bot', 'مرحباً! أنا مساعد البوابة. اسألني مثلاً: «ما هي كلية العلوم؟» أو «كيف أجد فوجي؟»');
}

/** يُهيّئ لوحة البحث الموحّد + المساعد. */
export async function initUnifiedView(root, app) {
  ROOT = root;
  if (started) { return; }
  started = true;
  ROOT.innerHTML = shellHtml();
  const instData = await loadInstitutions();
  INST = instData;
  INDEX = buildIndex(instData, app);
  wire();
}
