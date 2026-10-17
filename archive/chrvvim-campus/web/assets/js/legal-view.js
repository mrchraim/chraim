// ==========================================================================
// واجهة «المكتبة القانونية» — عرض فقط (لا منطق بحث هنا، بل في legal-engine.js).
// البيانات من data/legal-library.json. لا يُختلق أي محتوى قانوني.
// ==========================================================================
import { $, esc, debounce } from './util.js';
import { t, pick, getLang } from './i18n.js';
import { getData } from './views.js';
import {
  filterDocuments, sourceById, effectiveVerification, buildCitation, statusInfo,
} from './legal-engine.js';

const ui = { q: '', type: '', category: '', jurisdiction: '', verification: '', sort: 'relevance' };

function data() { return getData()?.legalLibrary || null; }
function lang() { return getLang() || 'ar'; }
function labelOf(list, id) {
  const item = (list || []).find((x) => x.id === id);
  return item ? (pick(item.label, id) || id) : (id || '');
}

function verificationChip(v) {
  const cls = v === 'verified' ? 'ok' : v === 'unverified' ? 'warn' : 'soft';
  const key = v === 'verified' ? 'library.verified' : v === 'unverified' ? 'library.unverified' : 'library.pending';
  return `<span class="chip ${cls}">${esc(t(key))}</span>`;
}

function optionsHtml(list, cur, allLabel) {
  let opts = `<option value="">${esc(allLabel)}</option>`;
  for (const x of (list || [])) {
    opts += `<option value="${esc(x.id)}"${x.id === cur ? ' selected' : ''}>${esc(pick(x.label, x.id) || x.id)}</option>`;
  }
  return opts;
}

function controlsHtml(d) {
  return `
    <div class="row legal-controls">
      <div class="field legal-q"><label for="legalQ">${esc(t('library.search'))}</label>
        <input id="legalQ" type="search" autocomplete="off" value="${esc(ui.q)}" placeholder="${esc(t('library.searchPh'))}"></div>
      <div class="field"><label for="legalType">${esc(t('library.type'))}</label><select id="legalType">${optionsHtml(d.documentTypes, ui.type, t('library.all'))}</select></div>
      <div class="field"><label for="legalCat">${esc(t('library.category'))}</label><select id="legalCat">${optionsHtml(d.categories, ui.category, t('library.all'))}</select></div>
      <div class="field"><label for="legalJur">${esc(t('library.jurisdiction'))}</label><select id="legalJur">${optionsHtml(d.jurisdictions, ui.jurisdiction, t('library.all'))}</select></div>
      <div class="field"><label for="legalVer">${esc(t('library.verification'))}</label><select id="legalVer">
        <option value="">${esc(t('library.all'))}</option>
        <option value="verified"${ui.verification === 'verified' ? ' selected' : ''}>${esc(t('library.verified'))}</option>
        <option value="unverified"${ui.verification === 'unverified' ? ' selected' : ''}>${esc(t('library.unverified'))}</option>
        <option value="pending"${ui.verification === 'pending' ? ' selected' : ''}>${esc(t('library.pending'))}</option>
      </select></div>
      <div class="field"><label for="legalSort">${esc(t('library.sort'))}</label><select id="legalSort">
        <option value="relevance"${ui.sort === 'relevance' ? ' selected' : ''}>${esc(t('library.sortRelevance'))}</option>
        <option value="date_desc"${ui.sort === 'date_desc' ? ' selected' : ''}>${esc(t('library.sortDateDesc'))}</option>
        <option value="date_asc"${ui.sort === 'date_asc' ? ' selected' : ''}>${esc(t('library.sortDateAsc'))}</option>
        <option value="title"${ui.sort === 'title' ? ' selected' : ''}>${esc(t('library.sortTitle'))}</option>
      </select></div>
    </div>
    <div class="row"><button class="btn ghost small" id="legalReset" type="button">↻ ${esc(t('library.reset'))}</button></div>`;
}

function docCardHtml(d, doc) {
  const src = sourceById(d, doc.sourceId);
  const ver = effectiveVerification(doc, src);
  const tags = (doc.tags || []).map((x) => `<span class="chip soft">${esc(x)}</span>`).join(' ');
  const srcLink = src?.url
    ? `<a class="btn sec small" href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(t('library.sourceLink'))}</a>`
    : `<span class="chip warn">${esc(t('library.noSource'))}</span>`;
  return `
    <article class="card mini legal-card">
      <div class="legal-card__head"><h4>${esc(pick(doc.title, doc.id || ''))}</h4>${verificationChip(ver)}</div>
      <p class="muted legal-meta">${esc(labelOf(d.documentTypes, doc.type))} · ${esc(labelOf(d.categories, doc.category))}${doc.date ? ' · ' + esc(doc.date) : ''}</p>
      ${pick(doc.summary, '') ? `<p>${esc(pick(doc.summary, ''))}</p>` : ''}
      ${tags ? `<div class="legal-tags">${tags}</div>` : ''}
      <details class="legal-details"><summary>${esc(t('library.details'))}</summary>
        <div class="legal-cite"><b>${esc(t('library.citation'))}:</b> ${esc(buildCitation(doc, src, lang()))}</div>
        <dl class="legal-dl">
          ${doc.reference ? `<dt>${esc(t('library.reference'))}</dt><dd>${esc(doc.reference)}</dd>` : ''}
          ${doc.date ? `<dt>${esc(t('library.date'))}</dt><dd>${esc(doc.date)}</dd>` : ''}
          ${doc.language ? `<dt>${esc(t('library.language'))}</dt><dd>${esc(doc.language)}</dd>` : ''}
          <dt>${esc(t('library.source'))}</dt><dd>${esc(src ? pick(src.name, '') : t('library.noSource'))}</dd>
        </dl>
        ${ver !== 'verified' ? `<p class="note warn-note">${esc(t('library.unverifiedWarn'))}</p>` : ''}
        <div class="row">${srcLink}</div>
      </details>
    </article>`;
}

function sourcesHtml(d) {
  if (!d.sources?.length) return '';
  const rows = d.sources.map((s) => {
    const link = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(t('library.sourceLink'))}</a>` : '';
    const note = pick(s.note, '');
    return `<li class="legal-source">${verificationChip(s.verification || 'pending')}
      <div><b>${esc(pick(s.name, ''))}</b>${pick(s.authority, '') && pick(s.authority, '') !== pick(s.name, '') ? ` <span class="muted">· ${esc(pick(s.authority, ''))}</span>` : ''}
      ${note ? `<div class="muted legal-src-note">${esc(note)}</div>` : ''}
      ${s.checkedAt ? `<div class="muted legal-src-note">${esc(t('library.checkedAt'))}: ${esc(s.checkedAt)}</div>` : ''}
      ${link ? ` <span class="legal-src-link">${link}</span>` : ''}</div></li>`;
  }).join('');
  return `<section class="legal-sources"><h3>${esc(t('library.sourcesTitle'))}</h3>
    <p class="muted">${esc(t('library.sourcesLead'))}</p><ul class="legal-source-list">${rows}</ul></section>`;
}

function bodyHtml(d) {
  if (!d) return `<p class="empty muted">${esc(t('library.pendingBody'))}</p>`;
  const st = statusInfo(d);
  const head = `<div class="row legal-status"><span class="chip soft">${st.documents} ${esc(t('library.docCount'))}</span>
    <span class="chip soft">${st.sources} ${esc(t('library.sourceCount'))}</span></div>`;
  if (!st.hasData) {
    return `${head}
      <div class="legal-pending"><h3>⏳ ${esc(t('library.pendingTitle'))}</h3><p>${esc(pick(d.notice, '') || t('library.pendingBody'))}</p></div>
      ${sourcesHtml(d)}
      <p class="note">${esc(pick(d.disclaimer, '') || t('library.disclaimer'))}</p>`;
  }
  const docs = filterDocuments(d, { ...ui, lang: lang() });
  const results = docs.length
    ? `<div class="grid cards legal-results">${docs.map((doc) => docCardHtml(d, doc)).join('')}</div>`
    : `<p class="empty muted">${esc(t('library.noResults'))}</p>`;
  return `${controlsHtml(d)}${head}
    <h3 class="legal-results-title">${esc(t('library.results'))} (${docs.length})</h3>${results}
    ${sourcesHtml(d)}
    <p class="note">${esc(pick(d.disclaimer, '') || t('library.disclaimer'))}</p>`;
}

function wire(host) {
  host.querySelector('#legalQ')?.addEventListener('input', debounce((e) => {
    ui.q = e.target.value;
    render();
    const q = document.getElementById('legalQ');
    if (q) { q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch { /* ignore */ } }
  }, 200));
  host.querySelector('#legalType')?.addEventListener('change', (e) => { ui.type = e.target.value; render(); });
  host.querySelector('#legalCat')?.addEventListener('change', (e) => { ui.category = e.target.value; render(); });
  host.querySelector('#legalJur')?.addEventListener('change', (e) => { ui.jurisdiction = e.target.value; render(); });
  host.querySelector('#legalVer')?.addEventListener('change', (e) => { ui.verification = e.target.value; render(); });
  host.querySelector('#legalSort')?.addEventListener('change', (e) => { ui.sort = e.target.value; render(); });
  host.querySelector('#legalReset')?.addEventListener('click', () => {
    ui.q = ''; ui.type = ''; ui.category = ''; ui.jurisdiction = ''; ui.verification = ''; ui.sort = 'relevance';
    render();
  });
}

function render() {
  const host = $('#libraryBody');
  if (!host) return;
  const d = data();
  host.innerHTML = bodyHtml(d);
  if (d && statusInfo(d).hasData) wire(host);
}

export function renderLibrary() {
  render();
}
