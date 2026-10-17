// ==========================================================================
// طبقة البيانات: تعمل أولاً من API، ثم من ملفات JSON ثابتة (النشر الشبكي).
// تشتق الجداول والمواد والأساتذة والقاعات من الدليل الأكاديمي عند غياب الخادم،
// حتى تظل البوابة كاملة الوظائف عند نشر الواجهة وحدها (Netlify مثلاً).
// ==========================================================================
import { norm, squeeze } from './util.js';
import { pick } from './i18n.js';

export const SEMESTERS = ['S1', 'S3', 'S5'];

async function tryJson(path) {
  if (!path) return null; // no API and no static fallback -> never fetch the literal "null"
  try {
    const res = await fetch(path, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!type.includes('json') && !path.split('?')[0].endsWith('.json')) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** يجلب من API إن توفّر، وإلا من ملف ثابت. */
async function getJson(apiPath, staticPath) {
  if (apiPath) {
    const data = await tryJson(apiPath);
    if (data) return data;
  }
  return tryJson(staticPath);
}

export function semesterLabel(guide, sem) {
  return pick(guide?.semesters?.[sem]?.label, sem);
}

export function trackLabel(track) {
  return pick(track?.label, track?.id || '');
}

/** خريطة (سطر: `SEM|label`) → معرّف المسلك، لتوحيد صفوف API مع الدليل. */
function buildTrackIndex(guide) {
  const map = new Map();
  for (const [sem, bucket] of Object.entries(guide?.semesters || {})) {
    for (const [id, tk] of Object.entries(bucket.tracks || {})) {
      map.set(`${sem}|${trackLabel(tk)}`, id);
    }
  }
  return map;
}

// --- الاشتقاق من الدليل ------------------------------------------------

export function deriveSchedules(guide, semesters = SEMESTERS) {
  const out = [];
  for (const sem of semesters) {
    const bucket = guide?.semesters?.[sem];
    if (!bucket) continue;
    for (const [id, tk] of Object.entries(bucket.tracks || {})) {
      const track = trackLabel(tk);
      const push = (row, group) => {
        if (!row) return;
        out.push({
          semester: sem,
          trackId: id,
          track,
          day: row.day || '',
          time: row.time || '',
          subject: row.subject || '',
          professor: row.professor || '',
          room: row.room || '',
          group_name: group || '',
          subgroups: row.subgroups || '',
          status: 'published',
          source_note: tk.source_note || '',
        });
      };
      if (Array.isArray(tk.schedule)) {
        tk.schedule.forEach((row) => push(row, ''));
      } else if (tk.schedule && typeof tk.schedule === 'object') {
        for (const [group, rows] of Object.entries(tk.schedule)) {
          (rows || []).forEach((row) => push(row, group));
        }
      }
    }
  }
  return out;
}

export function deriveCourses(guide) {
  const out = [];
  for (const [sem, bucket] of Object.entries(guide?.semesters || {})) {
    for (const [id, tk] of Object.entries(bucket.tracks || {})) {
      if (!Array.isArray(tk.courses)) continue;
      for (const course of tk.courses) {
        out.push({
          semester: sem,
          trackId: id,
          track: trackLabel(tk),
          name: course.subject || course.name || '',
          professors: Array.isArray(course.professors) ? course.professors.join('، ') : (course.professors || ''),
          notes: course.note || '',
          status: 'published',
        });
      }
    }
  }
  return out;
}

export function deriveProfessors(schedules, courses) {
  const names = new Set();
  for (const row of schedules) {
    const name = (row.professor || '').trim();
    if (name && !/^[—–-]+$/.test(name)) names.add(name);
  }
  for (const row of courses) {
    for (const name of String(row.professors || '').split(/[،,]/).map((s) => s.trim())) {
      if (name) names.add(name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'ar')).map((name) => ({ name, email: '', office: '', notes: '' }));
}

export function deriveRooms(schedules) {
  const rooms = new Map();
  for (const row of schedules) {
    const name = (row.room || '').trim();
    if (!name) continue;
    if (!rooms.has(name)) {
      const building = /amphi|مدرج/i.test(name) ? 'المدرجات' : /annexe|ملحق/i.test(name) ? 'الملحقة' : '';
      rooms.set(name, { name, building, capacity: null, notes: '' });
    }
  }
  return [...rooms.values()];
}

// --- تجميع توزيعات الأفواج --------------------------------------------

export function collectRanges(guide) {
  const out = [];
  const seen = new Set();
  const add = (item) => {
    if (!item.from || !item.to || !item.group) return;
    const key = [item.semester, item.track, item.group, item.from, item.to].join('|');
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  };
  for (const [sem, bucket] of Object.entries(guide?.semesters || {})) {
    for (const [id, tk] of Object.entries(bucket.tracks || {})) {
      const track = trackLabel(tk);
      let ranges = tk.ranges;
      if ((!ranges || !ranges.length) && tk.ranges_ref && bucket.shared_ranges?.[tk.ranges_ref]) {
        ranges = bucket.shared_ranges[tk.ranges_ref];
      }
      for (const r of ranges || []) add({ semester: sem, trackId: id, track, section: tk.section, kind: 'main', group: r.group, subgroups: r.subgroups || '', from: r.from, to: r.to });
      for (const r of tk.english_ranges || []) add({ semester: sem, trackId: id, track, section: tk.section, kind: 'english', group: r.group, subgroups: r.subgroups || '', from: r.from, to: r.to });
      if (tk.french) {
        for (const r of tk.french.language_sections || []) add({ semester: sem, trackId: id, track, section: tk.section, kind: 'french', group: r.name, subgroups: '', from: r.from, to: r.to });
      }
    }
  }
  for (const dist of guide?.surname_group_distributions || []) {
    for (const g of dist.groups || []) {
      add({ semester: dist.semester, trackId: dist.id, track: dist.track, kind: 'distribution', group: g.group, subgroups: g.groups || '', from: g.from, to: g.to });
    }
  }
  return out;
}

/** يعيد الأفواج المحتملة لاسم عائلي، مرتّبة (المطابقة التامة أولاً). */
export function findGroups(query, ranges) {
  const q = norm(query);
  if (!q) return [];
  const qs = squeeze(query);
  const results = [];
  for (const r of ranges) {
    const from = norm(r.from);
    const to = norm(r.to);
    if (!from || !to) continue;
    let hit = false;
    let exact = false;
    if (q === from || q === to) { hit = true; exact = true; }
    else if (q >= from && q <= to) { hit = true; }
    else {
      const f = squeeze(r.from);
      const t = squeeze(r.to);
      if (qs && (qs === f || qs === t)) { hit = true; exact = true; }
      else if (qs && qs >= f && qs <= t) { hit = true; }
    }
    if (hit) results.push({ ...r, exact });
  }
  const semOrder = { S1: 1, S3: 2, S5: 3 };
  return results.sort((a, b) => (b.exact - a.exact)
    || (semOrder[a.semester] - semOrder[b.semester])
    || a.track.localeCompare(b.track, 'ar'));
}

// --- التحميل الشامل ----------------------------------------------------

export async function loadAll() {
  const loaded = { guide: null, documents: [], founder: null, announcements: [], schedules: [], courses: [], professors: [], rooms: [], site: {}, source: 'static', meta: null, legalLibrary: null };

  const meta = await tryJson('/api/public/meta');
  const apiAvailable = Boolean(meta);
  loaded.meta = meta;
  const apiPath = (p) => (apiAvailable ? p : null);

  loaded.guide = (await getJson(apiPath('/api/public/guide'), 'data/academic-guide.json')) || { semesters: {}, days: [] };
  const trackIndex = buildTrackIndex(loaded.guide);

  const docData = await getJson(apiPath('/api/public/documents'), 'data/academic-documents.json');
  loaded.documents = Array.isArray(docData?.items) ? docData.items : (Array.isArray(docData?.documents) ? docData.documents : []);

  loaded.founder = (await getJson(apiPath('/api/public/founder'), 'data/founder-profile.json')) || null;

  loaded.site = (await getJson(apiPath('/api/public/site-config'), 'data/site-config.json')) || {};

  loaded.subjectsCorrespondence = await tryJson('data/subjects-correspondence.json');

  // المكتبة القانونية: بيانات ثابتة (لا خادم خاص بها). لا وثائق مختلقة — قد تكون فارغة بقصد.
  loaded.legalLibrary = await tryJson('data/legal-library.json');

  const annData = await getJson(apiPath('/api/public/announcements'), 'data/announcements.json');
  loaded.announcements = Array.isArray(annData?.items) ? annData.items : [];

  // الجداول: لكل سداسٍ، من API إن توفّر وإلا من الدليل.
  for (const sem of SEMESTERS) {
    const api = apiAvailable ? await tryJson(`/api/public/schedules?semester=${sem}`) : null;
    if (api && Array.isArray(api.items) && api.items.length) {
      api.items.forEach((row) => loaded.schedules.push({
        ...row,
        group_name: row.group_name || '',
        trackId: trackIndex.get(`${sem}|${row.track}`) || '',
      }));
    } else {
      loaded.schedules.push(...deriveSchedules(loaded.guide, [sem]));
    }
  }

  const courseData = await getJson(apiPath('/api/public/courses'), null);
  if (Array.isArray(courseData?.items) && courseData.items.length) {
    loaded.courses = courseData.items.map((row) => ({
      ...row,
      trackId: trackIndex.get(`${row.semester}|${row.track}`) || '',
    }));
  } else {
    loaded.courses = deriveCourses(loaded.guide);
  }

  const profData = await getJson(apiPath('/api/public/professors'), null);
  loaded.professors = Array.isArray(profData?.items) && profData.items.length ? profData.items : deriveProfessors(loaded.schedules, loaded.courses);

  const roomData = await getJson(apiPath('/api/public/rooms'), null);
  loaded.rooms = Array.isArray(roomData?.items) && roomData.items.length ? roomData.items : deriveRooms(loaded.schedules);

  loaded.source = apiAvailable ? 'api' : 'static';
  loaded.ranges = collectRanges(loaded.guide);
  return loaded;
}
