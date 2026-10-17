// ==========================================================================
// تهيئة قاعدة البيانات (Seed):
//  - استيراد الجداول والمواد والأساتذة والقاعات من الدليل الأكاديمي المدمج.
//  - استيراد الجداول الأولية من ملف السداسي الثالث (timetable-s3-draft.json).
//  - إنشاء أول حساب مدير من متغيري البيئة ADMIN_EMAIL / ADMIN_PASSWORD.
// السكربت آمن للتشغيل المتكرر: لا يستبدل بيانات موجودة.
// ==========================================================================
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { get, all, run, transaction } from './lib/db.mjs';
import { hashPassword } from './lib/security.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'web', 'data');

function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, name), 'utf8'));
  } catch {
    return fallback;
  }
}

const label = (value, fallback = '') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value.ar || value.fr || value.en || fallback;
};

/** يحوّل جدولاً (مصفوفة حصص) إلى صفوف قاعدة بيانات. */
function normalizeRows(rows, base) {
  const out = [];
  for (const row of rows || []) {
    out.push({
      semester: base.semester,
      track: base.track,
      day: row.day || row[0] || '',
      time: row.time || row[1] || '',
      subject: row.subject || row[2] || '',
      professor: row.professor || row[3] || '',
      room: row.room || row[4] || '',
      group_name: base.group_name || '',
      subgroups: row.subgroups || row[5] || '',
      status: 'published',
      source_note: base.source_note || '',
    });
  }
  return out;
}

const guide = readJson('academic-guide.json', null);
const s3draft = readJson('timetable-s3-draft.json', null);

if (!guide) {
  console.error('لم يتم العثور على web/data/academic-guide.json — لا يمكن المتابعة.');
  process.exit(1);
}

const scheduleRows = [];
const courseRows = [];

// ---- الجدول الأكاديمي المدمج -------------------------------------------
for (const [semesterKey, semester] of Object.entries(guide.semesters || {})) {
  for (const track of Object.values(semester.tracks || {})) {
    const trackName = label(track.label, track.id || '');
    const sourceNote = track.source_note || '';
    if (Array.isArray(track.schedule)) {
      // جدول مشترك.
      scheduleRows.push(...normalizeRows(track.schedule, { semester: semesterKey, track: trackName, source_note: sourceNote }));
    } else if (track.schedule && typeof track.schedule === 'object') {
      // جدول حسب الفوج.
      for (const [group, rows] of Object.entries(track.schedule)) {
        scheduleRows.push(...normalizeRows(rows, { semester: semesterKey, track: trackName, group_name: group, source_note: sourceNote }));
      }
    }
    if (Array.isArray(track.courses)) {
      for (const course of track.courses) {
        courseRows.push({
          semester: semesterKey,
          track: trackName,
          name: course.subject || course.name || '',
          professors: Array.isArray(course.professors) ? course.professors.join('، ') : (course.professors || ''),
          notes: course.note || '',
          status: 'published',
        });
      }
    }
  }
}

// ---- مسودات السداسي الثالث من ملف منفصل -------------------------------
// ملاحظة: الدليل الأكاديمي المدمج هو المصدر المعتمد لبيانات السداسي الثالث،
// ولذلك لا نستورد ملف المسودة القديم تلقائياً لتجنّب الازدواجية والتعارض.
void s3draft;

const insertSchedule = `INSERT INTO schedules (semester,track,day,time,subject,professor,room,group_name,subgroups,status,source_note)
  VALUES (@semester,@track,@day,@time,@subject,@professor,@room,@group_name,@subgroups,@status,@source_note)`;
const insertCourse = `INSERT INTO courses (semester,track,name,professors,notes,status)
  VALUES (@semester,@track,@name,@professors,@notes,@status)`;
const insertProfessor = 'INSERT INTO professors (name,email,office,notes,status) VALUES (?,?,?,?,?)';
const insertRoom = 'INSERT INTO rooms (name,building,capacity,notes,status) VALUES (?,?,?,?,?)';

const seed = () => transaction(() => {
  if (get('SELECT COUNT(*) AS n FROM schedules').n === 0) {
    for (const row of scheduleRows) run(insertSchedule, row);
    console.log(`تم استيراد ${scheduleRows.length} حصة (published).`);
  } else {
    console.log('جدول الحصص غير فارغ؛ لم يتم الاستيراد.');
  }

  if (get('SELECT COUNT(*) AS n FROM courses').n === 0) {
    const seen = new Set();
    for (const row of courseRows) {
      const key = `${row.semester}|${row.track}|${row.name}`;
      if (!row.name || seen.has(key)) continue;
      seen.add(key);
      run(insertCourse, row);
    }
    console.log(`تم استيراد ${seen.size} مادة (published).`);
  } else {
    console.log('جدول المواد غير فارغ؛ لم يتم الاستيراد.');
  }

  if (get('SELECT COUNT(*) AS n FROM professors').n === 0) {
    const names = new Set();
    for (const row of all('SELECT DISTINCT professor FROM schedules')) {
      const name = (row.professor || '').trim();
      if (name && !/^—+$/.test(name)) names.add(name);
    }
    for (const row of courseRows) {
      for (const name of String(row.professors || '').split('،').map((s) => s.trim())) {
        if (name) names.add(name);
      }
    }
    for (const name of names) run(insertProfessor, name, '', '', 'مستخرج آلياً من الجداول؛ راجع الاسم قبل الاعتماد.', 'published');
    console.log(`تم استيراد ${names.size} أستاذاً (published).`);
  } else {
    console.log('دليل الأساتذة غير فارغ؛ لم يتم الاستيراد.');
  }

  if (get('SELECT COUNT(*) AS n FROM rooms').n === 0) {
    const rooms = new Set();
    for (const row of all('SELECT DISTINCT room FROM schedules')) {
      const name = (row.room || '').trim();
      if (name) rooms.add(name);
    }
    for (const name of rooms) {
      const building = /amphi|مدرج/i.test(name) ? 'المدرجات' : /annexe|ملحق/i.test(name) ? 'الملحقة' : '';
      run(insertRoom, name, building, null, '', 'published');
    }
    console.log(`تم استيراد ${rooms.size} قاعة (published).`);
  } else {
    console.log('دليل القاعات غير فارغ؛ لم يتم الاستيراد.');
  }

  // ---- أول حساب مدير ----------------------------------------------------
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (email && password) {
    if (password.length < 14) {
      throw new Error('ADMIN_PASSWORD يجب أن يكون 14 حرفاً على الأقل.');
    }
    const existing = get('SELECT id FROM admins WHERE email=?', email);
    if (!existing) {
      run('INSERT INTO admins (email,password_hash,role) VALUES (?,?,?)', email, hashPassword(password), 'admin');
      console.log(`تم إنشاء أول حساب مدير: ${email}. حافظ على سرية بياناته.`);
    } else {
      console.log('حساب المدير موجود مسبقاً؛ لم يتم تغيير كلمة المرور.');
    }
  } else {
    console.log('تنبيه: لم يتم تعريف ADMIN_EMAIL/ADMIN_PASSWORD؛ أنشئ حساباً عبر متغيرات البيئة ثم أعد التشغيل.');
  }
});

seed();
console.log('اكتملت تهيئة قاعدة البيانات. لم يتم استبدال البيانات الموجودة.');
