// ==========================================================================
// المكتبة الرقمية: تجمع كل الوثائق الرقمية الحقيقية في مكان واحد —
// وثائق أكاديمية (PDF)، المكتبة القانونية، ووثائق/روابط المؤسسات.
// لا تُضاف أي وثيقة غير موجودة فعلاً؛ العدّاد يعكس ما هو محمّل فقط.
// ==========================================================================
import { $, $$, esc } from './util.js';
import { loadInstitutions, arabicNorm, safeHref } from './institutions.js';

let ROOT = null;
let ITEMS = [];
let started = false;
let filter = { q: '', kind: '' };

function collect(instData, app) {
  const out = [];

  for (const d of app?.documents || []) {
    out.push({
      kind: 'academic', kindLabel: 'وثيقة أكاديمية',
      title: d.title, sub: [d.semester, d.track, d.description].filter(Boolean).join(' · '),
      url: d.file, meta: d.type || 'PDF',
    });
  }

  for (const doc of app?.legalLibrary?.documents || []) {
    const title = doc.title || doc.name || doc.label || '';
    if (!title) continue;
    out.push({
      kind: 'legal', kindLabel: 'مكتبة قانونية',
      title, sub: [doc.category, doc.year, doc.description].filter(Boolean).join(' · '),
      url: doc.url || doc.file || doc.link || '', meta: 'مرجع قانوني',
    });
  }

  for (const e of instData?.establishments || []) {
    for (const r of e.resources || []) {
      out.push({
        kind: 'inst', kindLabel: 'وثيقة مؤسسة',
        title: r.label || r.url, sub: e.name_ar, url: r.url, meta: e.city_ar || '',
      });
    }
  }

  for (const item of out) item._text = arabicNorm(`${item.title} ${item.sub} ${item.kindLabel}`);
  return out;
}

function render() {
  const box = $('#digResults', ROOT);
  if (!box) return;
  const q = arabicNorm(filter.q);
  let items = ITEMS;
  if (filter.kind) items = items.filter((i) => i.kind === filter.kind);
  if (q) items = items.filter((i) => i._text.includes(q));

  const stats = $('#digStats', ROOT);
  if (stats) {
    const counts = { };
    for (const i of ITEMS) counts[i.kindLabel] = (counts[i.kindLabel] || 0) + 1;
    stats.textContent = `${ITEMS.length} عنصر رقمي · ` + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · ');
  }

  if (!items.length) {
    box.innerHTML = `<div class="inst-empty">لا عنصر يطابق البحث. المكتبة تعرض فقط ما هو محمّل فعلاً — لا عناصر وهمية.</div>`;
    return;
  }
  box.innerHTML = items.map((i) => {
    const inner = `<span class="uni-kind">${esc(i.kindLabel)}</span><b>${esc(i.title)}</b>${i.sub ? `<small>${esc(i.sub)}</small>` : ''}`;
    return i.url
      ? `<a class="uni-hit" href="${esc(safeHref(i.url))}" target="_blank" rel="noopener">${inner}</a>`
      : `<div class="uni-hit" style="cursor:default">${inner}</div>`;
  }).join('');
}

function shellHtml() {
  return `
  <h2>المكتبة الرقمية</h2>
  <p class="muted">كل الوثائق والمراجع الرقمية المتوفرة في البوابة في قائمة واحدة: وثائق أكاديمية، مراجع المكتبة القانونية، وروابط المؤسسات. المصدر مذكور في كل عنصر.</p>
  <p class="inst-count" id="digStats" style="margin-inline-start:0"></p>
  <div class="inst-toolbar">
    <input id="digQuery" type="search" autocomplete="off" spellcheck="false" placeholder="ابحث في الوثائق والمراجع…" aria-label="ابحث في المكتبة الرقمية">
    <button class="btn sec" type="button" data-dk="">الكل</button>
    <button class="btn sec" type="button" data-dk="academic">وثائق أكاديمية</button>
    <button class="btn sec" type="button" data-dk="legal">مكتبة قانونية</button>
    <button class="btn sec" type="button" data-dk="inst">وثائق مؤسسات</button>
  </div>
  <div id="digResults"></div>`;
}

function wire() {
  const q = $('#digQuery', ROOT);
  q.addEventListener('input', () => { filter.q = q.value; render(); });
  $$('[data-dk]', ROOT).forEach((b) => b.addEventListener('click', () => {
    filter.kind = b.getAttribute('data-dk');
    $$('[data-dk]', ROOT).forEach((x) => x.classList.toggle('on', x === b));
    render();
  }));
}

export async function initDigitalLibrary(root, app) {
  ROOT = root;
  if (started) return;
  started = true;
  ROOT.innerHTML = shellHtml();
  const instData = await loadInstitutions();
  ITEMS = collect(instData, app);
  wire();
  render();
}
