// ==========================================================================
// نقطة تشغيل الواجهة: الترجمة، السمة، التوجيه، الأحداث، وربط العرض بالبيانات.
// ==========================================================================
import { $, $$, debounce } from './util.js';
import { LANGS, t, setLang, getLang, dirLang } from './i18n.js';
import { state, setTheme, applyTheme, setLang as persistLang, setMyGroup } from './store.js';
import { loadAll } from './data.js';
import { initGate, guard as gateGuard } from './gate.js';
import * as V from './views.js';
import * as S from './subjects-view.js';
import * as L from './legal-view.js';
import { initInstitutionsView, showInstitution } from './institutions-view.js';
import { initDigitalLibrary } from './digital-library.js';
import { initUnifiedView } from './assistant.js';

// --- السمة واللغة ------------------------------------------------------
applyTheme();
document.documentElement.lang = getLang();
document.documentElement.dir = dirLang(getLang());

function fillLangSelect() {
  const sel = $('#langSelect');
  sel.innerHTML = LANGS.map((l) => `<option value="${escAttr(l.code)}">${escText(l.label)}</option>`).join('');
  sel.value = getLang();
}
function escText(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function escAttr(s) { return escText(s).replace(/"/g, '&quot;'); }

function applyI18n() {
  document.documentElement.lang = getLang();
  document.documentElement.dir = dirLang(getLang());
  for (const el of $$('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of $$('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
  document.title = getLang() === 'ar'
    ? 'CHRVVIM CAMPUS — دليل الطلبة أكادير | بوابة الطالب: الأفواج واستعمال الزمن'
    : `CHRVVIM — ${t('hero.title')}`;
  $('#themeBtn').textContent = state.theme === 'dark' ? t('tool.themeLight') : t('tool.theme');
  $('#themeBtn').setAttribute('aria-pressed', String(state.theme === 'dark'));
}

// --- التوجيه (hash) ----------------------------------------------------
const ROUTES = ['finder', 'timetable', 'tracks', 'subjects', 'library', 'directory', 'distribution', 'documents', 'gpa', 'stats', 'about', 'institutions', 'digital', 'unified'];
let dirKind = '';
function showRoute(route) {
  if (!ROUTES.includes(route)) route = 'timetable';
  document.documentElement.dataset.sec = route;
  $$('#tabs .tab').forEach((b) => {
    const on = b.dataset.route === route;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  $$('.panel').forEach((p) => p.classList.toggle('on', p.id === `p-${route}`));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
}
function onHash() {
  const raw = (location.hash || '#timetable').slice(1);
  const [route, sub] = raw.split('/');
  showRoute(route);
  if (route === 'institutions') showInstitution(sub || '');
}
window.addEventListener('hashchange', onHash);

// --- إتاحة التبويبات: WCAG 2.2 AA (أدوار ARIA + تنقّل بلوحة المفاتيح) ---
function tabsA11y() {
  const list = $('#tabs');
  if (!list) return;
  list.setAttribute('role', 'tablist');
  const tabs = $$('#tabs .tab');
  tabs.forEach((b) => {
    const route = b.dataset.route;
    b.setAttribute('role', 'tab');
    if (!b.id) b.id = `tab-${route}`;
    const panel = $(`#p-${route}`);
    if (panel) {
      b.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', b.id);
      if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
    }
  });
  list.addEventListener('keydown', (e) => {
    const cur = Math.max(0, tabs.findIndex((b) => b.classList.contains('on')));
    const rtl = document.documentElement.dir === 'rtl';
    let next = cur;
    if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight') || e.key === 'ArrowDown') next = (cur + 1) % tabs.length;
    else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft') || e.key === 'ArrowUp') next = (cur - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    location.hash = tabs[next].dataset.route;
    tabs[next].focus();
  });
}

// --- تحميل البيانات ----------------------------------------------------
let failed = false;
async function boot() {
  const loading = $('#ttResults');
  loading.innerHTML = `<p class="empty muted">${escText(t('common.loading'))}</p>`;
  try {
    const data = await loadAll();
    state.source = data.source;
    state.data = data;
    V.setData(data);
    initGate(data.site?.gate || {});
    failed = false;
    $('#offlineNote').hidden = false;
    if (data.source !== 'api') $('#offlineNote').textContent = t('common.offline');
    else $('#offlineNote').hidden = true;
    renderAll();
  } catch (error) {
    failed = true;
    $('#ttResults').innerHTML = `<div class="note danger">${escText(t('common.error'))}</div>
      <button class="btn" id="retryBtn" type="button">${escText(t('common.retry'))}</button>`;
    $('#retryBtn')?.addEventListener('click', boot);
  }
}

function renderAll() {
  V.renderAnnouncements();
  V.renderHeroStats();
  V.renderMine();
  V.syncTimetableSelectors();
  V.renderTimetable();
  V.syncTracksSelectors();
  V.renderTracks();
  S.renderSubjects();
  L.renderLibrary();
  V.renderDirectory($('#dirQuery').value, dirKind);
  V.syncDistributionSelectors();
  V.renderDistribution();
  V.syncDocumentFilters();
  V.renderDocuments();
  V.renderGpa();
  V.renderStats();
  V.renderAbout();
  V.renderOfficialLinks();

  // اللوحات الجديدة (متعدّد المؤسسات + المكتبة الرقمية + البحث/المساعد)
  initInstitutionsView($('#institutionsApp'));
  initDigitalLibrary($('#digitalApp'), state.data);
  initUnifiedView($('#unifiedApp'), state.data);
}

// --- الأحداث -----------------------------------------------------------
function wire() {
  // التبويبات
  $$('#tabs .tab').forEach((b) => b.addEventListener('click', () => { location.hash = b.dataset.route; }));

  // اللغة
  $('#langSelect').addEventListener('change', (e) => {
    const lang = e.target.value;
    setLang(lang);
    persistLang(lang);
    applyI18n();
    if (state.data) renderAll();
  });

  // السمة
  $('#themeBtn').addEventListener('click', () => {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
    applyI18n();
  });

  // البحث عن الفوج
  const runFinderNow = () => {
    const q = $('#finderQuery').value;
    if (gateGuard(() => V.runFinder(q))) V.runFinder(q);
  };
  $('#finderGo').addEventListener('click', runFinderNow);
  $('#finderQuery').addEventListener('keydown', (e) => { if (e.key === 'Enter') runFinderNow(); });
  $('#finderQuery').addEventListener('input', debounce(runFinderNow, 300));
  $('#finderReset').addEventListener('click', () => { $('#finderQuery').value = ''; V.runFinder(''); });

  // استعمال الزمن
  $('#ttSemester').addEventListener('change', () => { V.syncTimetableSelectors(); V.renderTimetable(); });
  $('#ttTrack').addEventListener('change', () => { V.syncTimetableSelectors({ keepGroup: true }); V.renderTimetable(); });
  $('#ttGroup').addEventListener('change', () => V.renderTimetable());
  $('#ttShow').addEventListener('click', () => { if (gateGuard(() => V.renderTimetable())) V.renderTimetable(); });
  $('#ttGrid').addEventListener('click', () => { state.view = 'grid'; V.renderTimetable(); });
  $('#ttList').addEventListener('click', () => { state.view = 'list'; V.renderTimetable(); });
  $('#ttPrint').addEventListener('click', () => window.print());
  $('#ttIcs').addEventListener('click', () => V.exportIcs());
  $('#ttShare').addEventListener('click', () => V.shareTimetable());
  $('#ttCopy').addEventListener('click', () => V.copyTimetable());
  $('#ttSave').addEventListener('click', () => {
    const { semester, trackId, group } = V.currentSelection();
    if (!group) { V.toast(t('tt.noGroup'), 'err'); return; }
    setMyGroup(semester, trackId, group);
    V.renderMine();
    V.toast(t('tt.saved'), 'ok');
  });

  // المسالك
  $('#tracksSemester').addEventListener('change', () => { V.syncTracksSelectors(); V.renderTracks(); });
  $('#tracksSelect').addEventListener('change', () => V.renderTracks());

  // الدليل
  $('#dirQuery').addEventListener('input', debounce(() => V.renderDirectory($('#dirQuery').value, dirKind), 200));
  $$('#dirFilters .chipbtn').forEach((b) => b.addEventListener('click', () => {
    dirKind = b.dataset.kind || '';
    $$('#dirFilters .chipbtn').forEach((x) => x.classList.toggle('on', x === b));
    V.renderDirectory($('#dirQuery').value, dirKind);
  }));

  // توزيع الأفواج
  $('#distSemester').addEventListener('change', () => V.renderDistribution());

  // عن المؤسس
  $('#aboutPrint').addEventListener('click', () => window.print());

  // الوثائق
  $('#docSemester').addEventListener('change', () => V.renderDocuments());
  $('#docTrack').addEventListener('change', () => V.renderDocuments());

  // أحداث مخصصة من طبقة العرض
  window.addEventListener('chrvvim:use-group', (e) => {
    const { semester, trackId, group } = e.detail;
    applySelection(semester, trackId, group);
    location.hash = 'timetable';
  });
  window.addEventListener('chrvvim:goto-timetable', (e) => {
    applySelection(e.detail.semester, e.detail.trackId, '');
    location.hash = 'timetable';
  });
}

function applySelection(semester, trackId, group) {
  const semSelect = $('#ttSemester');
  if (semester && semSelect.value !== semester) semSelect.value = semester;
  V.syncTimetableSelectors();
  const trackSelect = $('#ttTrack');
  if (trackId && [...trackSelect.options].some((o) => o.value === trackId)) trackSelect.value = trackId;
  V.syncTimetableSelectors({ keepGroup: true });
  const groupSelect = $('#ttGroup');
  const groups = [...groupSelect.options].map((o) => o.value);
  if (group && groups.includes(group)) groupSelect.value = group;
  if (group && trackId) setMyGroup(semester, trackId, groupSelect.value);
  V.renderTimetable();
}

// --- PWA ---------------------------------------------------------------
function wireInstall() {
  const btn = $('#installBtn');
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    btn.hidden = false;
  });
  btn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    btn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; });
}

function wireServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* تجاهل */ });
  });
}

// --- التشغيل -----------------------------------------------------------
fillLangSelect();
applyI18n();
tabsA11y();
wire();
wireInstall();
wireServiceWorker();
$('#footerYear').textContent = new Date().getFullYear();
onHash();
boot();
