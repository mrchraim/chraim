// ==========================================================================
// عرض لوحة المؤسسات داخل البوابة (SPA): دليل + تفاصيل كل مؤسسة.
// التوجيه: #institutions  (الدليل)  و  #institutions/<slug>  (باب مؤسسة).
// ==========================================================================
import { $, $$, esc } from './util.js';
import {
  loadInstitutions, searchInstitutions, citiesOf, bySlug,
  TYPE_AR, safeHref,
} from './institutions.js';

let ROOT = null;
let DATA = null;
let filter = { q: '', city: '', type: '' };
let started = false;

function sourceLabel(source) {
  return { api: 'خادم البوابة', supabase: 'قاعدة حيّة (قراءة فقط)', static: 'ملف موثّق', none: 'لا مصدر' }[source] || source;
}

function badgeRow(e) {
  const tags = ['<span class="inst-badge ok">الاسم مؤكد في دليل الجامعة</span>'];
  if (e.website) tags.push('<span class="inst-badge">موقع رسمي</span>');
  if (e.programs_ar && e.programs_ar.length) tags.push(`<span class="inst-badge">${e.programs_ar.length} تكوين</span>`);
  return `<span class="inst-tags">${tags.join('')}</span>`;
}

function cardHtml(e) {
  const lead = (e.leadership || [])[0];
  const who = lead ? esc(`${lead.role_ar}: ${lead.name}`) : '';
  return `<a class="inst-card ${e.type === 'school' ? 'school' : ''}" href="#institutions/${esc(e.slug)}">
    <span class="kicker">${esc(TYPE_AR[e.type] || '')} · ${esc(e.city_ar || '')}</span>
    <strong>${esc(e.name_ar || '')}</strong>
    ${who ? `<span class="who">${who}</span>` : ''}
    ${badgeRow(e)}
  </a>`;
}

function shellHtml() {
  return `
  <h2>المؤسسات الجامعية</h2>
  <p class="muted" id="instLead"></p>
  <div id="instListView">
    <div class="inst-toolbar">
      <input id="instQuery" type="search" autocomplete="off" spellcheck="false" placeholder="ابحث باسم الكلية أو المدينة أو العميد…" aria-label="ابحث في المؤسسات">
      <select id="instCity" aria-label="تصفية حسب المدينة"></select>
      <button class="btn sec" type="button" data-it="">الكل</button>
      <button class="btn sec" type="button" data-it="fac">كليات</button>
      <button class="btn sec" type="button" data-it="school">مدارس</button>
      <span class="inst-count" id="instCount" role="status" aria-live="polite"></span>
    </div>
    <div class="inst-grid" id="instGrid"></div>
    <div class="inst-empty" id="instNone" hidden>لا مؤسسة تطابق بحثك.</div>
  </div>
  <div id="instDetailView" hidden></div>`;
}

function renderList() {
  if (!DATA) return;
  const listView = $('#instListView', ROOT);
  const detail = $('#instDetailView', ROOT);
  if (!listView || !detail) return;
  detail.hidden = true;
  listView.hidden = false;

  let items = DATA.establishments.slice();
  if (filter.type) items = items.filter((e) => e.type === filter.type);
  if (filter.city) items = items.filter((e) => e.city_ar === filter.city);
  const ranked = searchInstitutions(filter.q, items).map((r) => r.item);

  const grid = $('#instGrid', ROOT);
  grid.innerHTML = ranked.map(cardHtml).join('');
  $('#instNone', ROOT).hidden = ranked.length > 0;
  $('#instCount', ROOT).textContent = `${ranked.length} من ${DATA.establishments.length}`;
  const lead = $('#instLead', ROOT);
  if (lead) {
    lead.textContent = DATA.university
      ? `القائمة الرسمية (المصدر: ${sourceLabel(DATA.source)}${DATA.checked ? ' · فُحصت ' + DATA.checked : ''}). اضغط أي مؤسسة لعرض بابها الكامل.`
      : '';
  }
}

function factsHtml(e) {
  const rows = [];
  const add = (k, v, ltr = true) => { if (v) rows.push(`<div class="f"><dt>${esc(k)}</dt><dd${ltr ? '' : ' class="ar"'} style="direction:${ltr ? 'ltr' : 'rtl'}">${v}</dd></div>`); };
  if (e.address) add('العنوان', esc(e.address));
  if (e.phone) add('الهاتف', esc(e.phone));
  if (e.fax) add('الفاكس', esc(e.fax));
  if (e.website) add('الموقع', `<a href="${esc(safeHref(e.website))}" target="_blank" rel="noopener">${esc(e.website)}</a>`);
  if (e.website_alt) add('رابط إضافي', `<a href="${esc(safeHref(e.website_alt))}" target="_blank" rel="noopener">${esc(e.website_alt)}</a>`);
  for (const x of e.extra_links || []) add('رابط إضافي', `<a href="${esc(safeHref(x))}" target="_blank" rel="noopener">${esc(x)}</a>`);
  if (e.uiz_url) add('صفحة الجامعة', `<a href="${esc(e.uiz_url)}" target="_blank" rel="noopener">${esc(e.uiz_url)}</a>`);
  return `<dl class="inst-facts">${rows.join('')}</dl>`;
}

function renderDetail(slug) {
  const listView = $('#instListView', ROOT);
  const detail = $('#instDetailView', ROOT);
  const e = bySlug(slug, DATA.establishments);
  if (!e) { renderList(); return; }
  listView.hidden = true;
  detail.hidden = false;

  const leaders = (e.leadership || []).map((l) => `<li><span class="role">${esc(l.role_ar)} (${esc(l.role_fr)})</span><span class="name">${esc(l.name)}</span></li>`).join('');
  const progs = (e.programs_ar || []).length
    ? `<h4>التكوينات الواردة في المصدر</h4><ul class="inst-list progs">${e.programs_ar.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '';
  const res = (e.resources || []).length
    ? `<h4>روابط ووثائق موثّقة</h4><ul class="inst-list">${e.resources.map((r) => `<li><a href="${esc(safeHref(r.url))}" target="_blank" rel="noopener">${esc(r.label)}</a></li>`).join('')}</ul>` : '';
  const refs = (e.refs || []).length
    ? `<h4>مراجع نصية كما وردت</h4><ul class="inst-list">${e.refs.map((r) => `<li style="direction:ltr">${esc(r)}</li>`).join('')}</ul>` : '';
  const prose = e.presentation_ar
    ? `<div class="inst-prose">${esc(e.presentation_ar)}</div>`
    : `<p class="note">لا يتوفّر على الصفحة الرسمية نص تعريفي لهذه المؤسسة. المعطيات المثبتة هي المسؤولون والاتصالات فقط — دون أي وصف غير موثّق.</p>`;

  detail.innerHTML = `
    <div class="inst-detail-head">
      <button class="inst-back" type="button" id="instBack">→ العودة إلى الدليل</button>
      <h3 style="width:100%">${esc(e.name_ar)}</h3>
      <span class="fr">${esc(e.name_fr)}</span>
      <span class="inst-tags">
        <span class="inst-badge">${esc(TYPE_AR[e.type] || '')}</span>
        <span class="inst-badge">${esc(e.city_ar || '')}</span>
        <span class="inst-badge ok">✓ الاسم مؤكد في دليل الجامعة</span>
      </span>
    </div>
    <div class="inst-cols">
      <div>
        <div class="inst-box">
          <h4>عن المؤسسة</h4>
          ${prose}
          ${progs}
          ${res}
          ${refs}
          <p class="inst-src">المصدر: <a href="${esc(e.uiz_url || '')}" target="_blank" rel="noopener">صفحة المؤسسة الرسمية</a> · فُحصت ${esc(DATA.checked || '')}</p>
        </div>
      </div>
      <div style="display:grid;gap:16px">
        <div class="inst-box"><h4>المسؤولون</h4><ul class="inst-leaders">${leaders}</ul></div>
        <div class="inst-box"><h4>الاتصال والروابط</h4>${factsHtml(e)}</div>
      </div>
    </div>`;

  $('#instBack', detail).addEventListener('click', () => { location.hash = '#institutions'; });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function wire() {
  const q = $('#instQuery', ROOT);
  const city = $('#instCity', ROOT);
  city.innerHTML = `<option value="">كل المدن</option>` + citiesOf(DATA.establishments).map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  q.addEventListener('input', () => { filter.q = q.value; renderList(); });
  city.addEventListener('change', () => { filter.city = city.value; renderList(); });
  $$('[data-it]', ROOT).forEach((b) => b.addEventListener('click', () => {
    filter.type = b.getAttribute('data-it');
    $$('[data-it]', ROOT).forEach((x) => x.classList.toggle('on', x === b));
    renderList();
  }));
}

/** يُهيّئ اللوحة (مرّة واحدة). */
export async function initInstitutionsView(root) {
  ROOT = root;
  if (started) return;
  started = true;
  ROOT.innerHTML = shellHtml();
  DATA = await loadInstitutions();
  wire();
  renderList();
  // دعم الرابط المباشر: #institutions/<slug>
  const raw = (location.hash || '').slice(1);
  if (raw.startsWith('institutions')) {
    const sub = raw.split('/')[1];
    if (sub) showInstitution(sub);
  }
}

/** يعرض التفاصيل أو الدليل حسب المسار الفرعي. */
export function showInstitution(slug) {
  if (!DATA) return;
  if (slug) renderDetail(slug); else renderList();
}
