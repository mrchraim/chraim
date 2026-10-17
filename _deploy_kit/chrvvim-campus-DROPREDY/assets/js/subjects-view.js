// ==========================================================================
// واجهة «المواد والمقابلات ديالي» — عرض فقط (لا منطق حسابي هنا).
// البيانات من data/subjects-correspondence.json، والحساب من subjects-engine.js
// ==========================================================================
import { $, $$, esc, store } from './util.js';
import { t, pick } from './i18n.js';
import { getData } from './views.js';
import {
  STATUS, STATUS_LIST, computeResult, progressOf, buildSms,
  listTracks, subjectsOf, tracksWithSemester, pairedSemester, sortSemesters,
} from './subjects-engine.js';

const SAVE_KEY = 'chrvvim.subjects';
const CONSENT_KEY = 'chrvvim.subjects.consent';

const ui = { track: '', semester: '', statuses: {}, open: false, result: null };

function cfg() {
  return getData()?.subjectsCorrespondence || null;
}

function nameOf(s) {
  return pick(s?.name, '') || s?.id || '';
}

function statusMeta(st) {
  const map = {
    [STATUS.passed]: { icon: '✅', key: 'subjects.status.passed', cls: 'ok' },
    [STATUS.failed]: { icon: '❌', key: 'subjects.status.failed', cls: 'bad' },
    [STATUS.pending]: { icon: '⏳', key: 'subjects.status.pending', cls: 'wait' },
    [STATUS.na]: { icon: '➖', key: 'subjects.status.na', cls: 'na' },
    [STATUS.unset]: { icon: '⬜', key: 'subjects.status.unset', cls: 'unset' },
  };
  return map[st] || map[STATUS.unset];
}

// --- الاختيار الافتراضي ---------------------------------------------------
function ensureDefaults() {
  const c = cfg();
  if (!c) return;
  const semiList = sortSemesters((c.subjects || []).map((s) => s.semester));
  if (!ui.semester || !semiList.includes(ui.semester)) ui.semester = semiList[0] || 'S1';
  const tracks = tracksWithSemester(c, ui.semester);
  if (!ui.track || !tracks.some((x) => x.id === ui.track)) ui.track = tracks[0]?.id || '';
}

function restore() {
  const c = cfg();
  if (!c) return;
  const saved = store.get(SAVE_KEY);
  if (saved && saved.consent) {
    ui.semester = saved.semester || '';
    ui.track = saved.track || '';
    ui.statuses = saved.statuses && typeof saved.statuses === 'object' ? saved.statuses : {};
  }
  ensureDefaults();
}

function persist() {
  if (store.get(CONSENT_KEY) !== 'yes') return;
  store.set(SAVE_KEY, { consent: true, semester: ui.semester, track: ui.track, statuses: ui.statuses });
}

// --- العرض ---------------------------------------------------------------
function controlsHtml(c) {
  const semiList = sortSemesters((c.subjects || []).map((s) => s.semester));
  const tracks = tracksWithSemester(c, ui.semester);
  const next = pairedSemester(c, ui.semester, ui.track);
  const opt = (v, label, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
  return `
    <div class="row subjects-controls">
      <div class="field"><label for="subjSemester">${esc(t('subjects.semester'))}</label><select id="subjSemester">${semiList.map((s) => opt(s, t(`sem.${s}`) === `sem.${s}` ? s : t(`sem.${s}`), ui.semester)).join('')}</select></div>
      <div class="field"><label for="subjTrack">${esc(t('subjects.track'))}</label><select id="subjTrack">${tracks.length ? tracks.map((tr) => opt(tr.id, pick(tr.name, tr.id), ui.track)).join('') : `<option value="">${esc(t('subjects.noTrack'))}</option>`}</select></div>
      <div class="field"><label>${esc(t('subjects.next'))}</label><div class="chip soft" id="subjNext">${next ? esc(t(`sem.${next}`) === `sem.${next}` ? next : t(`sem.${next}`)) : '—'}</div></div>
    </div>`;
}

function cardsHtml(c) {
  const list = subjectsOf(c, { semester: ui.semester, track: ui.track });
  if (!list.length) return `<p class="empty muted">${esc(t('subjects.emptySemester'))}</p>`;
  return list.map((s) => {
    const cur = ui.statuses[s.id] || STATUS.unset;
    const btns = STATUS_LIST.map((st) => {
      const m = statusMeta(st);
      const on = cur === st ? ' on' : '';
      return `<button class="stbtn ${m.cls}${on}" type="button" data-id="${esc(s.id)}" data-status="${st}" title="${esc(t(m.key))}"><span aria-hidden="true">${m.icon}</span><span class="stbtn__t">${esc(t(m.key))}</span></button>`;
    }).join('');
    const flag = s.confidence === 'needs_review' ? `<span class="chip warn">${esc(t('subjects.needsReview'))}</span>` : '';
    return `<article class="card mini subject-card" data-id="${esc(s.id)}">
      <div class="subject-head"><h4>${esc(nameOf(s))}</h4>${flag}<span class="chip soft subj-sem">${esc(s.semester)}${s.system ? ' · ' + esc(s.system) : ''}</span></div>
      ${s.name && s.name.fr ? `<p class="muted subj-fr">${esc(s.name.fr)}</p>` : ''}
      <div class="stbtns">${btns}</div>
    </article>`;
  }).join('');
}

function listNames(arr) {
  if (!arr || !arr.length) return `<p class="empty muted">${esc(t('subjects.none'))}</p>`;
  return `<ul class="subj-list">${arr.map((s) => `<li>${esc(nameOf(s))}</li>`).join('')}</ul>`;
}

function resultHtml(r) {
  const nextRows = (r.nextSubjects || []).map((n) => {
    const reason = t(`subjects.reason.${n.reason}`) === `subjects.reason.${n.reason}` ? n.reason : t(`subjects.reason.${n.reason}`);
    const stateLabel = n.state === 'eligible' ? t('subjects.state.eligible')
      : n.state === 'review' ? t('subjects.state.review')
        : t('subjects.state.required');
    const stateCls = n.state === 'eligible' ? 'ok' : n.state === 'review' ? 'warn' : 'soft';
    return `<li class="nextrow"><div><b>${esc(nameOf(n.subject))}</b><span class="muted"> · ${esc(n.subject.semester)}${n.subject.system ? ' · ' + esc(n.subject.system) : ''} · ${esc(reason)}</span></div><span class="chip ${stateCls}">${esc(stateLabel)}${n.needsReview ? ' · ' + esc(t('subjects.needsReview')) : ''}</span></li>`;
  }).join('') || `<li class="empty muted">${esc(t('subjects.noTarget'))}</li>`;

  const reviewHtml = (r.review || []).length
    ? `<div class="subj-review"><h4>${esc(t('subjects.reviewTitle'))}</h4><ul class="subj-list">${r.review.map((x) => `<li>${esc(x.note || x.ocr || '')} <span class="muted">(${esc(x.semester || '')})</span></li>`).join('')}</ul></div>`
    : '';

  return `
    <div class="grid cards subj-sections">
      <article class="card mini"><h4>✅ ${esc(t('subjects.section.passed'))}</h4>${listNames(r.passed)}</article>
      <article class="card mini"><h4>❌ ${esc(t('subjects.section.remaining'))}</h4>${listNames([...r.failed, ...r.pending])}</article>
      <article class="card mini wide"><h4>📚 ${esc(t('subjects.section.next'))}</h4><ul class="subj-list">${nextRows}</ul></article>
    </div>
    ${reviewHtml}
    <p class="note">${esc(t('subjects.disclaimer'))}</p>
    <div class="row">
      <button class="btn" id="subjCopy" type="button">📋 ${esc(t('subjects.copy'))}</button>
      <button class="btn sec" id="subjShare" type="button">🔗 ${esc(t('subjects.share'))}</button>
      <button class="btn ghost" id="subjEdit" type="button">✏️ ${esc(t('subjects.edit'))}</button>
      <button class="btn ghost" id="subjReset" type="button">↻ ${esc(t('subjects.reset'))}</button>
    </div>`;
}

function render() {
  const host = $('#subjBody');
  if (!host) return;
  const c = cfg();
  if (!c) { host.innerHTML = `<p class="empty muted">${esc(t('subjects.noData'))}</p>`; return; }
  ensureDefaults();

  const r = computeResult(c, { semester: ui.semester, track: ui.track, statuses: ui.statuses });
  ui.result = r;
  const prog = progressOf(r);
  const consent = store.get(CONSENT_KEY) === 'yes';

  host.innerHTML = `
    ${controlsHtml(c)}
    <div class="subj-progress" role="group" aria-label="${esc(t('subjects.progress'))}">
      <div class="bar"><span style="width:${prog.pct}%"></span></div>
      <span class="muted">${esc(t('subjects.progress'))}: ${prog.done}/${prog.total} (${prog.pct}%)</span>
    </div>
    <div class="grid cards subj-cards" id="subjCards">${cardsHtml(c)}</div>
    <div class="subj-actions">
      <label class="subj-consent"><input type="checkbox" id="subjConsent"${consent ? ' checked' : ''}> ${esc(t('subjects.saveConsent'))}</label>
      <button class="btn ghost small" id="subjDelete" type="button">🗑️ ${esc(t('subjects.delete'))}</button>
    </div>
    <div id="subjResult" class="subj-result"${ui.open ? '' : ' hidden'}>${resultHtml(r)}</div>
    <div class="row" style="margin-top:10px">
      <button class="btn" id="subjCompute" type="button">📊 ${esc(t('subjects.compute'))}</button>
    </div>`;

  wire(host, c);
}

function wire(host, c) {
  host.querySelector('#subjSemester')?.addEventListener('change', (e) => { ui.semester = e.target.value; ui.track = ''; ensureDefaults(); persist(); render(); });
  host.querySelector('#subjTrack')?.addEventListener('change', (e) => { ui.track = e.target.value; persist(); render(); });

  host.querySelector('#subjCards')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.stbtn');
    if (!btn) return;
    const { id, status } = btn.dataset;
    if (ui.statuses[id] === status) delete ui.statuses[id];
    else ui.statuses[id] = status;
    persist();
    render();
  });

  host.querySelector('#subjCompute')?.addEventListener('click', () => { ui.open = true; render(); });
  host.querySelector('#subjEdit')?.addEventListener('click', () => { ui.open = false; render(); });
  host.querySelector('#subjReset')?.addEventListener('click', () => { ui.statuses = {}; ui.open = false; persist(); render(); });

  host.querySelector('#subjDelete')?.addEventListener('click', () => {
    ui.statuses = {}; ui.open = false;
    store.remove(SAVE_KEY); store.set(CONSENT_KEY, 'no');
    render();
  });

  host.querySelector('#subjConsent')?.addEventListener('change', (e) => {
    store.set(CONSENT_KEY, e.target.checked ? 'yes' : 'no');
    if (e.target.checked) persist(); else store.remove(SAVE_KEY);
  });

  host.querySelector('#subjCopy')?.addEventListener('click', () => copyResult());
  host.querySelector('#subjShare')?.addEventListener('click', () => shareResult());
}

function smsText() {
  const labels = {
    title: t('subjects.sms.title'),
    current: t('subjects.sms.current'),
    next: t('subjects.sms.next'),
    passed: t('subjects.section.passed'),
    remaining: t('subjects.section.remainingShort'),
    nextSubjects: t('subjects.section.next'),
    review: t('subjects.reviewTitle'),
    note: t('subjects.sms.note'),
    none: t('subjects.none'),
  };
  return buildSms(ui.result, nameOf, labels);
}

async function copyResult() {
  if (!ui.result) return;
  const text = smsText();
  try {
    await navigator.clipboard.writeText(text);
    flash(t('subjects.copied'));
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); flash(t('subjects.copied')); } catch { flash(t('subjects.copyFail'), 'err'); }
    ta.remove();
  }
}

function shareResult() {
  if (!ui.result) return;
  const text = smsText();
  if (navigator.share) {
    navigator.share({ title: t('subjects.title'), text }).catch(() => {});
  } else {
    copyResult();
  }
}

function flash(msg, cls = '') {
  const el = document.createElement('div');
  el.className = `note ${cls}`;
  el.style.marginTop = '8px';
  el.textContent = msg;
  const host = $('#subjBody');
  if (host) { host.appendChild(el); setTimeout(() => el.remove(), 2200); }
}

export function renderSubjects() {
  restore();
  render();
}

export function subjectsReset() {
  ui.statuses = {};
  render();
}
