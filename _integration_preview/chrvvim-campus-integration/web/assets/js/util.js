// ==========================================================================
// أدوات مساعدة عامة (بدون تبعيات).
// ==========================================================================

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/** تهريب النص قبل إدراجه في HTML. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** تطبيع الاسم للمقارنة: إزالة التشكيل، توحيد المسافات، أحرف كبيرة. */
export function norm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'`´]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/** نسخة مضغوطة (بلا مسافات أو رموز) لتقريب التطابق. */
export function squeeze(value) {
  return norm(value).replace(/[^A-Z0-9\u0600-\u06FF]/g, '');
}

export function debounce(fn, ms = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** تخزين محلي آمن (لا ينهار في وضع التصفح الخاص). */
export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};

/** تنزيل نص كملف. */
export function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** ينسّق التاريخ بصيغة YYYY-MM-DD. */
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

/** يحوّل قائمة حصص إلى ملف تقويم iCalendar. */
export function toIcs(events, calendarName = 'CHRVVIM') {
  const dayIndex = { 'الإثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CHRVVIM//Campus//AR', `X-WR-CALNAME:${calendarName}`];
  for (const ev of events) {
    const target = dayIndex[ev.day];
    if (!target || !ev.time) continue;
    const [startPart, endPart] = String(ev.time).replace('–', '-').split('-');
    if (!startPart) continue;
    const toMinutes = (t) => {
      const [h, m] = t.trim().split(':').map(Number);
      return { h: Number.isFinite(h) ? h : 8, m: Number.isFinite(m) ? m : 0 };
    };
    const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const delta = ((target - base.getUTCDay()) + 7) % 7;
    base.setUTCDate(base.getUTCDate() + delta);
    const s = toMinutes(startPart);
    const e = toMinutes(endPart || '');
    const d1 = new Date(base); d1.setUTCHours(s.h, s.m, 0, 0);
    const d2 = new Date(base); d2.setUTCHours(e.h, e.m || 0, 0, 0);
    if (d2 <= d1) d2.setUTCMinutes(d1.getUTCMinutes() + 90);
    const fmt = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid('ev')}@chrvvim`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmt(d1)}`,
      `DTEND:${fmt(d2)}`,
      `SUMMARY:${String(ev.subject || '').replace(/[,;]/g, ' ')}`,
      `LOCATION:${String(ev.room || '').replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:${String(ev.professor || '').replace(/[,;]/g, ' ')}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** ينشئ عنصر HTML من نص. */
export function html(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}
