require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const root = path.join(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'public', name), 'utf8'));

const hasSchedules = db.prepare('SELECT COUNT(*) AS n FROM schedules').get().n > 0;
const hasCourses = db.prepare('SELECT COUNT(*) AS n FROM courses').get().n > 0;
const hasProfessors = db.prepare('SELECT COUNT(*) AS n FROM professors').get().n > 0;
const hasRooms = db.prepare('SELECT COUNT(*) AS n FROM rooms').get().n > 0;
const tx = db.transaction(() => {
  if (!hasSchedules) {
    const ins = db.prepare(`INSERT INTO schedules (semester,track,day,time,subject,professor,room,group_name,subgroups,status,source_note)
      VALUES (@semester,@track,@day,@time,@subject,@professor,@room,@group_name,@subgroups,@status,@source_note)`);
    const s3 = read('timetable-s3-draft.json');
    for (const r of (s3.timetable || [])) ins.run({ semester:'S3', track:'الجذع المشترك', day:r.day || '', time:r.time || '', subject:r.subject || '', professor:r.professor || '', room:r.room || '', group_name:r.group || '', subgroups:r.subgroups || '', status:'draft', source_note:`استيراد أولي؛ الحالة الأصلية: ${r.verification_status || 'غير محددة'}` });
    const guide = read('academic-guide-2026-2027.json');
    for (const t of (guide.s1_tracks || [])) for (const r of (t.schedule || [])) ins.run({ semester:'S1', track:t.name || t.id, day:r[0] || '', time:r[1] || '', subject:r[2] || '', professor:r[3] || '', room:r[4] || '', group_name:'', subgroups:'', status:'draft', source_note:'من ملخص المستخدم بتاريخ 2026-10-11؛ يحتاج إلى تأكيد رسمي قبل النشر.' });
    for (const r of (guide.s3_law_private_schedule || [])) ins.run({ semester:'S3', track:'الجذع المشترك — القانون الخاص', day:r[0] || '', time:r[1] || '', subject:r[2] || '', professor:r[3] || '', room:r[4] || '', group_name:'', subgroups:r[5] || '', status:'draft', source_note:'من ملخص المستخدم بتاريخ 2026-10-11؛ قد يتضمن تداخلات أو معلومات غير مكتملة، راجع قبل النشر.' });
    for (const r of (guide.s3_law_public_schedule || [])) ins.run({ semester:'S3', track:'الجذع المشترك — القانون العام', day:r[0] || '', time:r[1] || '', subject:r[2] || '', professor:r[3] || '', room:r[4] || '', group_name:'', subgroups:r[5] || '', status:'draft', source_note:'مستخرج من صورة جدول المستخدم لسنة 2026-2027؛ راجع قبل النشر.' });
    for (const t of (guide.s5_tracks || [])) {
      if (t.type === 'schedule') for (const r of (t.schedule || [])) ins.run({ semester:'S5', track:t.name || t.id, day:r.day || '', time:r.time || '', subject:r.subject || '', professor:r.professor || '', room:r.room || '', group_name:'', subgroups:'', status:'draft', source_note:'مستورد من ملخص المستخدم؛ يحتاج إلى تأكيد رسمي.' });
    }
    console.log('Imported S1, S3, and S5 schedule rows as DRAFT only.');
  }
  if (!hasCourses) {
    const ins = db.prepare('INSERT INTO courses (semester,track,name,professors,notes,status) VALUES (?,?,?,?,?,?)');
    const guide = read('academic-guide-2026-2027.json');
    for (const t of (guide.s5_tracks || [])) if (t.type !== 'schedule') {
      for (const c of (t.courses || [])) ins.run('S5', t.name || t.id, c.subject || '', (c.professors || []).join('، '), c.note || 'مستورد من ملخص المستخدم؛ يحتاج إلى تأكيد رسمي.', 'draft');
    }
    // Also seed subjects from the S3/S5 schedules where available.
    const scheduleRows = db.prepare('SELECT semester,track,subject,professor FROM schedules').all();
    const seen = new Set();
    for (const r of scheduleRows) { const k=[r.semester,r.track,r.subject].join('|'); if(seen.has(k)) continue; seen.add(k); ins.run(r.semester,r.track,r.subject,r.professor||'', 'مستخرج من جدول أولي؛ يحتاج إلى تحقق.', 'draft'); }
    console.log('Imported initial course rows as DRAFT only.');
  }
  if (!hasProfessors) {
    const names = new Set();
    for (const r of db.prepare('SELECT professor FROM schedules').all()) if (r.professor && r.professor.trim()) names.add(r.professor.trim());
    const guide = read('academic-guide-2026-2027.json');
    for (const t of (guide.s5_tracks || [])) for (const c of (t.courses || [])) for (const name of (c.professors || [])) if(name && name.trim()) names.add(name.trim());
    const ins = db.prepare('INSERT INTO professors (name,notes,status) VALUES (?,? ,?)');
    for (const name of names) ins.run(name,'مستخرج من بيانات أولية غير مؤكدة؛ راجع الاسم قبل النشر.','draft');
    console.log('Imported initial professor directory as DRAFT only.');
  }
  if (!hasRooms) {
    const names = new Set(db.prepare('SELECT room FROM schedules').all().map(r=>r.room).filter(v=>v && v.trim()).map(v=>v.trim()));
    const ins = db.prepare('INSERT INTO rooms (name,notes,status) VALUES (?,?,?)');
    for (const name of names) ins.run(name,'مستخرج من بيانات استعمال زمن أولية؛ وحّد الاسم بعد المراجعة.','draft');
    console.log('Imported initial room directory as DRAFT only.');
  }
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (password.length < 14) throw new Error('ADMIN_PASSWORD must be at least 14 characters.');
    const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
    if (!existing) {
      db.prepare('INSERT INTO admins (email,password_hash,role) VALUES (?,?,?)').run(email, bcrypt.hashSync(password, 12), 'admin');
      console.log(`Created initial admin account for ${email}. Keep credentials private.`);
    } else console.log('Admin account already exists; bootstrap did not replace its password.');
  }
});
tx();
console.log('Database initialization complete. Existing data was not overwritten.');
db.close();
