// ==========================================================================
// طبقة العرض: بناء محتوى اللوحات ديناميكياً من البيانات المحمّلة.
// ==========================================================================
import { $, esc, norm, download, toIcs } from './util.js';
import { t, pick, dayName } from './i18n.js';
import * as D from './data.js';
import { state, getMyGroup, setMyGroup, myGroupEntries } from './store.js';

let DATA = {};
export function setData(data) { DATA = data || {}; }
export function getData() { return DATA; }

const guide = () => DATA.guide || { days: [], semesters: {} };
const els = () => ({
  announceCard: $('#announceCard'),
  announceBody: $('#announceBody'),
});

/** تنبيه عائم بسيط. */
export function toast(message, type = '') {
  const host = $('#toastHost');
  if (!host) return;
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  host.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

function kindLabel(kind) {
  return {
    main: t('finder.kindMain'),
    english: t('finder.kindEnglish'),
    french: t('finder.kindFrench'),
    distribution: t('finder.kindDistribution'),
  }[kind] || kind;
}

// --- الإعلانات ---------------------------------------------------------
export function renderAnnouncements() {
  const { announceCard, announceBody } = els();
  const items = DATA.announcements || [];
  announceCard.hidden = !items.length;
  if (!items.length) { announceBody.innerHTML = ''; return; }
  announceBody.innerHTML = items.map((a) => `
    <article class="announcement ${esc(a.kind || 'info')}">
      <strong>${esc(a.title)}</strong>
      <div>${esc(a.body).replace(/\n/g, '<br>')}</div>
      <time>${esc(a.updated_at || '')}</time>
    </article>`).join('');
}

// --- البحث عن الفوج ----------------------------------------------------
export function runFinder(query) {
  const host = $('#finderResults');
  const q = String(query || '').trim();
  if (!q) { host.innerHTML = `<p class="empty muted">${esc(t('finder.hint'))}</p>`; return; }
  const matches = D.findGroups(q, DATA.ranges || []);
  if (!matches.length) { host.innerHTML = `<div class="note danger">${esc(t('finder.noresult'))}</div>`; return; }
  const rows = matches.slice(0, 80).map((m) => `
    <tr>
      <td>${esc(D.semesterLabel(guide(), m.semester))}</td>
      <td class="start">${esc(m.track)}</td>
      <td><span class="chip blue">${esc(m.group)}</span></td>
      <td>${esc(m.subgroups || '—')}</td>
      <td><span class="chip soft">${esc(kindLabel(m.kind))}</span></td>
      <td dir="ltr">${esc(m.from)} — ${esc(m.to)}</td>
      <td>${m.exact ? `<span class="chip green">${esc(t('finder.exact'))}</span>` : '—'}</td>
      <td><button class="btn sec small" type="button" data-use="${esc(m.semester)}|${esc(m.trackId)}|${esc(m.group)}">${esc(t('finder.useGroup'))}</button></td>
    </tr>`).join('');
  host.innerHTML = `
    <p class="muted">${matches.length} ${esc(t('finder.matches'))} · ${esc(t('finder.resultNote'))}</p>
    <div class="scroll"><table>
      <thead><tr>
        <th>${esc(t('finder.semester'))}</th><th>${esc(t('finder.track'))}</th>
        <th>${esc(t('finder.group'))}</th><th>${esc(t('finder.subgroups'))}</th>
        <th>${esc(t('finder.kind'))}</th><th>${esc(t('finder.range'))}</th><th></th><th></th>
      </tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  host.querySelectorAll('[data-use]').forEach((btn) => btn.addEventListener('click', () => {
    const [semester, trackId, group] = btn.dataset.use.split('|');
    window.dispatchEvent(new CustomEvent('chrvvim:use-group', { detail: { semester, trackId, group } }));
  }));
}

// --- استعمال الزمن -----------------------------------------------------
function trackMap(semester) {
  return guide()?.semesters?.[semester]?.tracks || {};
}

export function groupsForTrack(semester, trackId) {
  const tk = trackMap(semester)[trackId];
  if (!tk) return [];
  if (tk.schedule && !Array.isArray(tk.schedule)) return Object.keys(tk.schedule);
  let ranges = tk.ranges;
  if ((!ranges || !ranges.length) && tk.ranges_ref && guide()?.semesters?.[semester]?.shared_ranges?.[tk.ranges_ref]) {
    ranges = guide().semesters[semester].shared_ranges[tk.ranges_ref];
  }
  return [...new Set((ranges || []).map((r) => r.group))];
}

/** المسالك التي تملك حصصاً في سداسٍ معيّن. */
export function scheduleTracks(semester) {
  const ids = new Set();
  for (const row of DATA.schedules || []) {
    if (row.semester === semester && row.trackId) ids.add(row.trackId);
  }
  return Object.entries(trackMap(semester))
    .filter(([id]) => ids.has(id))
    .map(([id, tk]) => ({ id, name: D.trackLabel(tk) }));
}

const SEM_ORDER = { S1: 1, S3: 2, S5: 3 };
function dayOrder(day) {
  const idx = (guide().days || []).indexOf(day);
  return idx === -1 ? 9 : idx;
}
function byDayTime(a, b) {
  return dayOrder(a.day) - dayOrder(b.day) || String(a.time || '').localeCompare(String(b.time || ''));
}

export function currentRows(semester, trackId, group) {
  const tk = trackMap(semester)[trackId];
  const trackName = tk ? D.trackLabel(tk) : '';
  return (DATA.schedules || [])
    .filter((r) => r.semester === semester && (r.trackId === trackId || (!r.trackId && r.track === trackName)))
    .filter((r) => !group || r.group_name === group)
    .sort(byDayTime);
}

export function renderTimetable() {
  const semester = $('#ttSemester').value;
  const trackId = $('#ttTrack').value;
  const group = $('#ttGroup').value;
  const host = $('#ttResults');
  const rows = currentRows(semester, trackId, group);
  if (!rows.length) { host.innerHTML = `<p class="empty muted">${esc(t('tt.empty'))}</p>`; renderToday(); return; }

  if (state.view === 'list') {
    host.innerHTML = `<div class="scroll"><table>
      <thead><tr><th>${esc(t('tt.day'))}</th><th>${esc(t('tt.time'))}</th><th>${esc(t('tt.subject'))}</th><th>${esc(t('tt.professor'))}</th><th>${esc(t('tt.room'))}</th><th>${esc(t('tt.group'))}</th></tr></thead>
      <tbody>${rows.map((r) => `<tr>
        <td>${esc(dayName(r.day, guide()))}</td><td dir="ltr">${esc(r.time || '—')}</td>
        <td class="start">${esc(r.subject)}</td><td>${esc(r.professor || '—')}</td>
        <td>${esc(r.room || '—')}</td><td>${esc(r.group_name || t('tt.noGroup'))}</td>
      </tr>`).join('')}</tbody></table></div>
      <p class="muted">${esc(t('tt.count'))}: ${rows.length}</p>`;
    renderToday(rows);
    return;
  }

  // شبكة أسبوعية: الأيام أعمدة والفترات صفوف.
  const days = guide().days || [];
  const slots = [...new Set(rows.map((r) => r.time || '—'))].sort((a, b) => a.localeCompare(b));
  const cell = (day, slot) => rows.filter((r) => r.day === day && (r.time || '—') === slot)
    .map((r) => `<div class="tt-event"><b>${esc(r.subject)}</b>
      <span class="meta">${esc(r.professor || '—')}</span>
      <span class="room">${esc(r.room || '')}</span></div>`).join('') || '<span class="muted">·</span>';
  host.innerHTML = `<div class="scroll"><table class="tt-grid">
    <thead><tr><th>${esc(t('tt.time'))}</th>${days.map((d) => `<th>${esc(dayName(d, guide()))}</th>`).join('')}</tr></thead>
    <tbody>${slots.map((slot) => `<tr><td dir="ltr"><b>${esc(slot)}</b></td>${days.map((d) => `<td class="tt-cell">${cell(d, slot)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div><p class="muted">${esc(t('tt.count'))}: ${rows.length}</p>`;
  renderToday(rows);
}

function todayArabicDay() {
  const days = guide().days || [];
  const jsDay = new Date().getDay(); // 0=Sunday
  const index = jsDay - 1; // Monday -> 0
  return index >= 0 && index < days.length ? days[index] : '';
}

export function renderToday(rows) {
  const box = $('#ttToday');
  const current = rows || currentRows($('#ttSemester').value, $('#ttTrack').value, $('#ttGroup').value);
  const today = todayArabicDay();
  if (!today) { box.hidden = true; return; }
  const list = current.filter((r) => r.day === today);
  box.hidden = false;
  box.innerHTML = `<b>${esc(t('tt.today'))} · ${esc(dayName(today, guide()))}</b>` + (list.length
    ? `<ul style="margin:6px 0 0;padding-inline-start:18px">${list.map((r) => `<li dir="auto">${esc(r.time)} — ${esc(r.subject)}${r.room ? ` (${esc(r.room)})` : ''}</li>`).join('')}</ul>`
    : ` <span class="muted">${esc(t('tt.noneToday'))}</span>`);
}

/** يهيّئ خيارات السداسي والمسلك والفوج للجدول. */
export function syncTimetableSelectors({ keepGroup = false } = {}) {
  const semSelect = $('#ttSemester');
  const trackSelect = $('#ttTrack');
  const groupSelect = $('#ttGroup');
  const semesters = Object.keys(guide().semesters || {}).sort((a, b) => (SEM_ORDER[a] || 9) - (SEM_ORDER[b] || 9));
  if (!semSelect.options.length) {
    semSelect.innerHTML = semesters.map((s) => `<option value="${esc(s)}">${esc(D.semesterLabel(guide(), s))}</option>`).join('');
    if (semesters.includes('S3')) semSelect.value = 'S3';
  }
  const semester = semSelect.value;
  const tracks = scheduleTracks(semester);
  const prevTrack = trackSelect.value;
  trackSelect.innerHTML = tracks.length
    ? tracks.map((tk) => `<option value="${esc(tk.id)}">${esc(tk.name)}</option>`).join('')
    : `<option value="">—</option>`;
  if (tracks.some((tk) => tk.id === prevTrack)) trackSelect.value = prevTrack;
  const trackId = trackSelect.value;
  const prevGroup = keepGroup ? groupSelect.value : '';
  const groups = trackId ? groupsForTrack(semester, trackId) : [];
  const saved = getMyGroup(semester, trackId);
  groupSelect.innerHTML = groups.length
    ? `<option value="">${esc(t('tt.noGroup'))}</option>` + groups.map((g) => `<option value="${esc(g)}">${esc(t('tt.group'))} ${esc(g)}</option>`).join('')
    : `<option value="">${esc(t('tt.noGroup'))}</option>`;
  const desired = groups.includes(prevGroup) ? prevGroup : (groups.includes(saved) ? saved : '');
  if (desired) groupSelect.value = desired;
}

// --- المسالك والمسارات -------------------------------------------------
export function syncTracksSelectors() {
  const semSelect = $('#tracksSemester');
  const trackSelect = $('#tracksSelect');
  const semesters = Object.keys(guide().semesters || {}).sort((a, b) => (SEM_ORDER[a] || 9) - (SEM_ORDER[b] || 9));
  if (!semSelect.options.length) {
    semSelect.innerHTML = semesters.map((s) => `<option value="${esc(s)}">${esc(D.semesterLabel(guide(), s))}</option>`).join('');
  }
  const semester = semSelect.value;
  const tracks = Object.entries(trackMap(semester)).map(([id, tk]) => ({ id, tk }));
  const prev = trackSelect.value;
  trackSelect.innerHTML = tracks.map(({ id, tk }) => `<option value="${esc(id)}">${esc(D.trackLabel(tk))}</option>`).join('');
  if (tracks.some(({ id }) => id === prev)) trackSelect.value = prev;
}

function rangesTable(ranges) {
  if (!ranges || !ranges.length) return '';
  return `<div class="scroll"><table><thead><tr><th>${esc(t('finder.group'))}</th><th>${esc(t('finder.subgroups'))}</th><th>${esc(t('finder.range'))}</th></tr></thead>
    <tbody>${ranges.map((r) => `<tr><td><span class="chip blue">${esc(r.group)}</span></td><td>${esc(r.subgroups || '—')}</td><td dir="ltr">${esc(r.from)} — ${esc(r.to)}</td></tr>`).join('')}</tbody></table></div>`;
}

export function renderTracks() {
  const host = $('#tracksResults');
  const semester = $('#tracksSemester').value;
  const trackId = $('#tracksSelect').value;
  const tk = trackMap(semester)[trackId];
  if (!tk) { host.innerHTML = `<p class="empty muted">${esc(t('dir.empty'))}</p>`; return; }
  const parts = [`<h3>${esc(D.trackLabel(tk))} <span class="chip soft">${tk.type === 'pathway' ? esc(t('tracks.partOfPath')) : esc('schedule')}</span></h3>`];
  if (tk.source_note) parts.push(`<p class="note">${esc(tk.source_note)}</p>`);

  if (tk.type === 'pathway' && Array.isArray(tk.courses)) {
    parts.push(`<h4>${esc(t('tracks.courses'))}</h4>`);
    parts.push(`<div class="scroll"><table><thead><tr><th>${esc(t('tt.subject'))}</th><th>${esc(t('tracks.professors'))}</th><th>${esc(t('tracks.notes'))}</th></tr></thead>
      <tbody>${tk.courses.map((c) => `<tr><td class="start">${esc(c.subject || '')}</td><td>${esc(Array.isArray(c.professors) ? c.professors.join('، ') : (c.professors || '—'))}</td><td class="start muted">${esc(c.note || '—')}</td></tr>`).join('')}</tbody></table></div>`);
  } else {
    const count = currentRows(semester, trackId, '').length;
    parts.push(`<p class="muted">${esc(t('tt.count'))}: ${count}</p>
      <p><button class="btn sec small" type="button" data-goto-tt="${esc(semester)}|${esc(trackId)}">${esc(t('nav.timetable'))} →</button></p>`);
  }

  let ranges = tk.ranges;
  if ((!ranges || !ranges.length) && tk.ranges_ref && guide()?.semesters?.[semester]?.shared_ranges?.[tk.ranges_ref]) {
    ranges = guide().semesters[semester].shared_ranges[tk.ranges_ref];
  }
  if (ranges && ranges.length) { parts.push(`<h4>${esc(t('tracks.ranges'))}</h4>`); parts.push(rangesTable(ranges)); }
  if (tk.english_ranges && tk.english_ranges.length) { parts.push(`<h4>English</h4>`); parts.push(rangesTable(tk.english_ranges)); }
  if (tk.french) { parts.push(`<h4>${esc(pick(tk.french.label, 'Français'))}</h4>`); parts.push(rangesTable(tk.french.language_sections)); }

  host.innerHTML = parts.join('');
  host.querySelectorAll('[data-goto-tt]').forEach((b) => b.addEventListener('click', () => {
    const [sem, track] = b.dataset.gotoTt.split('|');
    window.dispatchEvent(new CustomEvent('chrvvim:goto-timetable', { detail: { semester: sem, trackId: track } }));
  }));
}

// --- الدليل الأكاديمي --------------------------------------------------
function subjectIndex() {
  const map = new Map();
  for (const c of DATA.courses || []) {
    const key = `${c.semester}|${c.name}`;
    if (!map.has(key)) map.set(key, { name: c.name, semester: c.semester, track: c.track, professors: c.professors || '' });
  }
  for (const r of DATA.schedules || []) {
    const key = `${r.semester}|${r.subject}`;
    if (!r.subject) continue;
    if (!map.has(key)) map.set(key, { name: r.subject, semester: r.semester, track: r.track, professors: r.professor || '' });
    else if (r.professor && !map.get(key).professors.includes(r.professor)) {
      map.get(key).professors = [map.get(key).professors, r.professor].filter(Boolean).join('، ');
    }
  }
  return [...map.values()].sort((a, b) => (SEM_ORDER[a.semester] || 9) - (SEM_ORDER[b.semester] || 9) || a.name.localeCompare(b.name, 'ar'));
}

export function renderDirectory(query = '', kind = '') {
  const host = $('#dirResults');
  const q = norm(query);
  const subjects = subjectIndex();
  const professors = DATA.professors || [];
  const rooms = DATA.rooms || [];

  const hits = [];
  for (const s of subjects) {
    if (!q || norm(`${s.name} ${s.track} ${s.professors}`).includes(q)) hits.push({ kindKey: 'subject', kind: t('dir.subjects'), title: s.name, meta: `${D.semesterLabel(guide(), s.semester)} · ${s.track}`, extra: s.professors });
  }
  for (const p of professors) {
    if (!q || norm(`${p.name} ${p.email || ''} ${p.office || ''}`).includes(q)) hits.push({ kindKey: 'professor', kind: t('dir.professors'), title: p.name, meta: p.office || '', extra: p.email || '' });
  }
  for (const r of rooms) {
    if (!q || norm(`${r.name} ${r.building || ''}`).includes(q)) hits.push({ kindKey: 'room', kind: t('dir.rooms'), title: r.name, meta: r.building || '', extra: r.capacity ? `سعة ${r.capacity}` : '' });
  }

  const filtered = kind ? hits.filter((h) => h.kindKey === kind) : hits;
  if (!filtered.length) { host.innerHTML = `<p class="empty muted">${esc(t('dir.empty'))}</p>`; return; }
  host.innerHTML = `<p class="muted">${filtered.length} × ${esc(t('dir.kind'))}</p>` + filtered.slice(0, 300).map((h) => `
    <div class="list-item">
      <div class="titles"><b>${esc(h.title)}</b><small>${esc(h.meta)}${h.extra ? ` · ${esc(h.extra)}` : ''}</small></div>
      <span class="chip soft kind">${esc(h.kind)}</span>
    </div>`).join('');
}

// --- الوثائق -----------------------------------------------------------
export function syncDocumentFilters() {
  const semSelect = $('#docSemester');
  const trackSelect = $('#docTrack');
  const semesters = [...new Set((DATA.documents || []).map((d) => d.semester).filter(Boolean))].sort();
  const tracks = [...new Set((DATA.documents || []).map((d) => d.track).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar'));
  const fill = (el, values, allLabel) => {
    const current = el.value;
    el.innerHTML = `<option value="">${esc(allLabel)}</option>` + values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    if (values.includes(current)) el.value = current;
  };
  fill(semSelect, semesters, t('docs.all'));
  fill(trackSelect, tracks, t('docs.all'));
}

export function renderDocuments() {
  const host = $('#docResults');
  const semester = $('#docSemester').value;
  const track = $('#docTrack').value;
  const docs = (DATA.documents || []).filter((d) => (!semester || d.semester === semester) && (!track || d.track === track));
  if (!docs.length) { host.innerHTML = `<p class="empty muted">${esc(t('docs.empty'))}</p>`; return; }
  host.innerHTML = docs.map((d) => `
    <article class="doc-card">
      <div class="muted">${esc(d.semester || '')} · ${esc(d.track || '')} · ${esc(d.type || 'PDF')}</div>
      <h3>${esc(d.title)}</h3>
      <p class="muted">${esc(d.description || '')}</p>
      <a class="doc-open" href="${esc(d.file)}" target="_blank" rel="noopener noreferrer">↗ ${esc(t('docs.open'))}</a>
    </article>`).join('');
}

// --- الإحصائيات --------------------------------------------------------
export function renderStats() {
  const host = $('#statsResults');
  const counts = DATA.meta?.counts || {};
  const cards = [
    [t('stats.schedules'), (DATA.schedules || []).length],
    [t('stats.courses'), (DATA.courses || []).length],
    [t('stats.professors'), (DATA.professors || []).length],
    [t('stats.rooms'), (DATA.rooms || []).length],
    [t('stats.documents'), (DATA.documents || []).length],
    [t('stats.announcements'), (DATA.announcements || []).length],
  ];
  host.innerHTML = cards.map(([label, value]) => `<div class="mini stat"><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join('');
  const updated = DATA.meta?.updated_at || '';
  const sourceLabel = DATA.source === 'api' ? t('stats.sourceApi') : t('stats.sourceStatic');
  $('#statsVerification').innerHTML = `
    <div class="list-item"><div class="titles"><b>${esc(t('stats.updated'))}</b><small>${esc(updated || '—')}</small></div></div>
    <div class="list-item"><div class="titles"><b>${esc(t('stats.source'))}</b><small>${esc(sourceLabel)}</small></div></div>
    ${(guide().verification || []).map((v) => `<div class="list-item"><div class="titles"><b>${esc(v.type || '')}</b><small>${esc(v.note || '')}</small></div></div>`).join('')}`;
}

// --- عن المؤسس ---------------------------------------------------------
const ALLOWED_HOSTS = {
  Instagram: ['instagram.com'],
  'Instagram · RIQQA': ['instagram.com'],
  TikTok: ['tiktok.com'],
  Facebook: ['facebook.com'],
  WhatsApp: ['wa.me'],
};

export function renderAbout() {
  const socialHost = $('#aboutSocial');
  const interests = $('#aboutInterests');
  const profile = DATA.founder || {};
  if (interests) {
    interests.innerHTML = (profile.interests || []).slice(0, 12).map((i) => `<span class="chip soft">${esc(i)}</span>`).join('');
  }
  const links = (Array.isArray(profile.socials) ? profile.socials : []).filter((item) => {
    try {
      const u = new URL(item.url);
      const allowed = ALLOWED_HOSTS[item.platform];
      return u.protocol === 'https:' && allowed && allowed.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
    } catch { return false; }
  });
  socialHost.innerHTML = links.length ? links.map((item) => `
    <a class="social-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">
      <span class="social-icon" aria-hidden="true">${esc(item.icon || '↗')}</span>
      <span><b>${esc(item.platform)}</b><br><small class="muted">${esc(item.label || '')}</small></span>
    </a>`).join('') : `<p class="muted">—</p>`;
}

// --- تصدير/مشاركة الجدول ----------------------------------------------
export function currentSelection() {
  const semester = $('#ttSemester').value;
  const trackId = $('#ttTrack').value;
  const group = $('#ttGroup').value;
  const trackName = trackMap(semester)[trackId] ? D.trackLabel(trackMap(semester)[trackId]) : '';
  return { semester, trackId, group, trackName, rows: currentRows(semester, trackId, group) };
}

export function exportIcs() {
  const { rows, trackName, group } = currentSelection();
  if (!rows.length) { toast(t('tt.empty'), 'err'); return; }
  const label = `CHRVVIM ${trackName}${group ? ` - ${t('tt.group')} ${group}` : ''}`;
  download(`chrvvim-${rows[0].semester}-${(group || 'all')}.ics`, toIcs(rows, label), 'text/calendar;charset=utf-8');
  toast('ICS ✓', 'ok');
}

export function shareTimetable() {
  const { rows, trackName, group } = currentSelection();
  if (!rows.length) { toast(t('tt.empty'), 'err'); return; }
  const lines = rows.map((r) => `• ${dayName(r.day, guide())} ${r.time} — ${r.subject}${r.room ? ` (${r.room})` : ''}`);
  const text = `${t('common.shareText')} — ${trackName}${group ? ` (${group})` : ''}\n${lines.join('\n')}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}

/** ينسخ نص الجدول الحالي إلى الحافظة. */
export function copyTimetable() {
  const { rows, trackName, group } = currentSelection();
  if (!rows.length) { toast(t('tt.empty'), 'err'); return; }
  const lines = rows.map((r) => `• ${dayName(r.day, guide())} ${r.time} — ${r.subject}${r.room ? ` (${r.room})` : ''}`);
  const text = `${t('common.shareText')} — ${trackName}${group ? ` (${group})` : ''}\n${lines.join('\n')}`;
  const done = () => toast(t('common.copied'), 'ok');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => toast('✕', 'err'));
  else toast('✕', 'err');
}

// --- الأرقام في الترويسة -------------------------------------------------
function totalTracks() {
  let n = 0;
  for (const sem of Object.values(guide().semesters || {})) n += Object.keys(sem.tracks || {}).length;
  return n;
}

export function renderHeroStats() {
  const set = (id, value) => { const el = $(id); if (el) el.textContent = String(value); };
  set('#heroTracks', totalTracks());
  set('#heroSessions', (DATA.schedules || []).length);
  set('#heroProfessors', (DATA.professors || []).length);
  set('#heroDocs', (DATA.documents || []).length);
}

// --- بطاقة «فوجي المحفوظ» ------------------------------------------------
export function renderMine() {
  const host = $('#mineCard');
  if (!host) return;
  const entries = myGroupEntries();
  if (!entries.length) { host.hidden = true; host.innerHTML = ''; return; }
  host.hidden = false;
  host.innerHTML = `<h2>${esc(t('mine.title'))}</h2>` + entries.map((e) => {
    const tk = trackMap(e.semester)[e.trackId];
    const name = tk ? D.trackLabel(tk) : e.trackId;
    return `<div class="mine-row">
      <div class="titles"><b>${esc(name)}</b> <span class="chip blue">${esc(e.group)}</span> <span class="muted">${esc(D.semesterLabel(guide(), e.semester))}</span></div>
      <div class="row">
        <button class="btn small" type="button" data-mine-view="${esc(e.semester)}|${esc(e.trackId)}">${esc(t('mine.view'))}</button>
        <button class="btn ghost small" type="button" data-mine-del="${esc(e.semester)}|${esc(e.trackId)}">${esc(t('mine.delete'))}</button>
      </div></div>`;
  }).join('');
  host.querySelectorAll('[data-mine-view]').forEach((b) => b.addEventListener('click', () => {
    const [semester, trackId] = b.dataset.mineView.split('|');
    window.dispatchEvent(new CustomEvent('chrvvim:use-group', { detail: { semester, trackId, group: getMyGroup(semester, trackId) } }));
  }));
  host.querySelectorAll('[data-mine-del]').forEach((b) => b.addEventListener('click', () => {
    const [semester, trackId] = b.dataset.mineDel.split('|');
    setMyGroup(semester, trackId, '');
    renderMine();
    toast(t('tt.removed'), 'ok');
  }));
}

// --- توزيع الأفواج (لوحة مستقلة) ----------------------------------------
function trackRangeSets(semester, tk) {
  let ranges = tk.ranges;
  if ((!ranges || !ranges.length) && tk.ranges_ref && guide()?.semesters?.[semester]?.shared_ranges?.[tk.ranges_ref]) {
    ranges = guide().semesters[semester].shared_ranges[tk.ranges_ref];
  }
  return {
    main: ranges || [],
    english: tk.english_ranges || [],
    french: (tk.french && Array.isArray(tk.french.language_sections)) ? tk.french.language_sections : [],
  };
}

function semesterHasDistribution(semester) {
  return Object.values(trackMap(semester)).some((tk) => {
    const r = trackRangeSets(semester, tk);
    return r.main.length || r.english.length || r.french.length;
  });
}

export function syncDistributionSelectors() {
  const semSelect = $('#distSemester');
  if (!semSelect) return;
  const semesters = Object.keys(guide().semesters || {})
    .filter((s) => semesterHasDistribution(s))
    .sort((a, b) => (SEM_ORDER[a] || 9) - (SEM_ORDER[b] || 9));
  const prev = semSelect.value;
  semSelect.innerHTML = semesters.map((s) => `<option value="${esc(s)}">${esc(D.semesterLabel(guide(), s))}</option>`).join('');
  if (semesters.includes(prev)) semSelect.value = prev;
}

export function renderDistribution() {
  const host = $('#distResults');
  const semester = $('#distSemester')?.value;
  if (!semester) { host.innerHTML = `<p class="empty muted">${esc(t('dist.empty'))}</p>`; return; }
  const sections = [];
  for (const [id, tk] of Object.entries(trackMap(semester))) {
    const r = trackRangeSets(semester, tk);
    if (!r.main.length && !r.english.length && !r.french.length) continue;
    const parts = [`<h3 class="dist-track">${esc(D.trackLabel(tk))}</h3>`];
    if (r.main.length) parts.push(`<h4>${esc(t('dist.main'))}</h4>${rangesTable(r.main)}`);
    if (r.english.length) parts.push(`<h4>${esc(t('dist.english'))}</h4>${rangesTable(r.english)}`);
    if (r.french.length) parts.push(`<h4>${esc(t('dist.french'))}</h4>${rangesTable(r.french)}`);
    sections.push(`<div class="dist-block">${parts.join('')}</div>`);
  }
  if (!sections.length) { host.innerHTML = `<p class="empty muted">${esc(t('dist.empty'))}</p>`; return; }
  host.innerHTML = `<p class="note">${esc(t('dist.rule'))}</p>${sections.join('')}`;
}

// --- حاسبة المعدل الموزون ------------------------------------------------
function gpaRow(subject = '', grade = '', coef = '1') {
  return `<div class="gpa-row">
    <input type="text" class="gpa-subject" placeholder="${esc(t('gpa.subject'))}" aria-label="${esc(t('gpa.subject'))}" value="${esc(subject)}">
    <input type="number" class="gpa-grade" min="0" max="20" step="0.25" inputmode="decimal" placeholder="${esc(t('gpa.grade'))}" aria-label="${esc(t('gpa.grade'))}" value="${esc(grade)}">
    <input type="number" class="gpa-coef" min="0" step="0.5" inputmode="decimal" placeholder="${esc(t('gpa.coef'))}" aria-label="${esc(t('gpa.coef'))}" value="${esc(coef)}">
    <button class="btn ghost small gpa-x" type="button" aria-label="${esc(t('gpa.remove'))}">✕</button>
  </div>`;
}

function mentionFor(value) {
  if (value == null) return '';
  if (value >= 16) return t('gpa.m16');
  if (value >= 14) return t('gpa.m14');
  if (value >= 12) return t('gpa.m12');
  if (value >= 10) return t('gpa.m10');
  return t('gpa.m0');
}

export function renderGpa() {
  const host = $('#gpaRows');
  if (!host) return;
  host.innerHTML = [gpaRow(), gpaRow(), gpaRow()].join('');
  const calc = () => {
    let sum = 0; let coefSum = 0;
    host.querySelectorAll('.gpa-row').forEach((row) => {
      const g = parseFloat(row.querySelector('.gpa-grade').value);
      const c = parseFloat(row.querySelector('.gpa-coef').value);
      if (!Number.isNaN(g) && !Number.isNaN(c) && c > 0 && g >= 0 && g <= 20) { sum += g * c; coefSum += c; }
    });
    const avg = coefSum ? sum / coefSum : null;
    const out = $('#gpaOut');
    const mention = $('#gpaMention');
    if (out) out.textContent = avg == null ? '—' : `${avg.toFixed(2)} / 20`;
    if (mention) mention.textContent = mentionFor(avg);
  };
  const add = (subject, grade, coef) => { host.insertAdjacentHTML('beforeend', gpaRow(subject, grade, coef)); calc(); };
  host.oninput = calc;
  host.onclick = (e) => {
    if (e.target.classList.contains('gpa-x')) { e.target.closest('.gpa-row')?.remove(); calc(); }
  };
  $('#gpaAdd').onclick = () => add();
  $('#gpaClear').onclick = () => { host.innerHTML = [gpaRow(), gpaRow(), gpaRow()].join(''); calc(); };
  $('#gpaLoad').onclick = () => {
    const { rows } = currentSelection();
    const subjects = [...new Set((rows || []).map((r) => r.subject).filter(Boolean))];
    if (!subjects.length) { toast(t('tt.empty'), 'err'); return; }
    host.innerHTML = subjects.map((s) => gpaRow(s, '', '1')).join('');
    calc();
  };
  calc();
}

// --- المصادر الرسمية -----------------------------------------------------
function safeUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' ? u.href : '';
  } catch { return ''; }
}

export function renderOfficialLinks() {
  const host = $('#officialLinks');
  if (!host) return;
  const site = DATA.site || {};
  const links = Array.isArray(site.official_links) ? site.official_links : [];
  const items = links.map((o) => {
    const href = safeUrl(o.u);
    if (!href) return '';
    return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"><span class="os">${esc(o.s || '•')}</span><span>${esc(o.t || '')}</span></a>`;
  }).join('');
  const siteUrl = safeUrl(site.official_site || 'https://fsjpa.uiz.ac.ma/');
  const siteItem = siteUrl
    ? `<a href="${esc(siteUrl)}" target="_blank" rel="noopener noreferrer"><span class="os">🌐</span><span>${esc(t('official.site'))}</span></a>`
    : '';
  host.innerHTML = items + siteItem;
}
