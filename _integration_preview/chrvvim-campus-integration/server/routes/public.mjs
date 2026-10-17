// ==========================================================================
// مسارات API العامة (قراءة فقط): الدليل، الإعلانات، الوثائق، الجداول، الأدلة.
// لا تتطلب تسجيل دخول، وتُنشر فقط السجلات التي حالتها «منشور».
// ==========================================================================
import path from 'node:path';
import { readJson, sendJson } from '../lib/http.mjs';
import { get, all } from '../lib/db.mjs';
import { PUBLIC_DATA_DIR } from '../config.mjs';

const file = (name) => path.join(PUBLIC_DATA_DIR, name);

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
}

/** يقرأ ملف JSON مع قيمة احتياطية عند غيابه حتى لا يسقط الطلب. */
function safeRead(name, fallback) {
  try {
    return readJson(file(name));
  } catch {
    return fallback;
  }
}

export function registerPublic(router) {
  // --- البيانات الوصفية والقدرات -----------------------------------------
  router.get('/api/public/meta', (ctx) => {
    const guide = safeRead('academic-guide.json', { meta: {}, sections: {}, days: [], verification: [] });
    const counts = {
      schedules: get('SELECT COUNT(*) AS n FROM schedules').n,
      published_schedules: get("SELECT COUNT(*) AS n FROM schedules WHERE status='published'").n,
      courses: get('SELECT COUNT(*) AS n FROM courses').n,
      professors: get('SELECT COUNT(*) AS n FROM professors').n,
      rooms: get('SELECT COUNT(*) AS n FROM rooms').n,
      announcements: get("SELECT COUNT(*) AS n FROM announcements WHERE status='published'").n,
    };
    noStore(ctx.res);
    sendJson(ctx.res, 200, {
      ...(guide.meta || {}),
      sections: guide.sections || {},
      days: guide.days || [],
      day_translations: guide.day_translations || {},
      verification: guide.verification || [],
      counts,
      capabilities: { api: true, database: true, admin: true },
      server_time: new Date().toISOString(),
    });
  });

  // --- الدليل الأكاديمي الكامل ------------------------------------------
  router.get('/api/public/guide', (ctx) => {
    const guide = safeRead('academic-guide.json', {});
    noStore(ctx.res);
    sendJson(ctx.res, 200, guide);
  });

  // --- الوثائق الرسمية --------------------------------------------------
  router.get('/api/public/documents', (ctx) => {
    const data = safeRead('academic-documents.json', { documents: [] });
    noStore(ctx.res);
    sendJson(ctx.res, 200, {
      academic_year: data.academic_year || '',
      note: data.note || '',
      items: Array.isArray(data.documents) ? data.documents : [],
    });
  });

  // --- ملف المؤسس -------------------------------------------------------
  router.get('/api/public/founder', (ctx) => {
    noStore(ctx.res);
    sendJson(ctx.res, 200, safeRead('founder-profile.json', {}));
  });

  // --- إعدادات الموقع (الروابط الرسمية + البوابة) ----------------------
  router.get('/api/public/site-config', (ctx) => {
    noStore(ctx.res);
    sendJson(ctx.res, 200, safeRead('site-config.json', {}));
  });

  // --- الإعلانات المنشورة ----------------------------------------------
  router.get('/api/public/announcements', (ctx) => {
    const rows = all(
      `SELECT id,title,body,kind,starts_at,ends_at,updated_at
         FROM announcements
        WHERE status='published'
          AND (starts_at='' OR starts_at<=datetime('now'))
          AND (ends_at=''   OR ends_at>=datetime('now'))
        ORDER BY CASE kind WHEN 'urgent' THEN 0 WHEN 'warning' THEN 1 WHEN 'event' THEN 2 ELSE 3 END,
                 updated_at DESC
        LIMIT 30`,
    );
    noStore(ctx.res);
    sendJson(ctx.res, 200, { items: rows });
  });

  // --- الجداول المنشورة -------------------------------------------------
  router.get('/api/public/schedules', (ctx) => {
    const semester = String(ctx.query.get('semester') || 'S3').slice(0, 20);
    const track = ctx.query.get('track');
    const group = ctx.query.get('group');
    let sql = `SELECT id,semester,track,day,time,subject,professor,room,group_name,subgroups,status,updated_at
                 FROM schedules WHERE semester=? AND status='published'`;
    const args = [semester];
    if (track) { sql += ' AND track=?'; args.push(String(track).slice(0, 200)); }
    if (group) { sql += ' AND group_name=?'; args.push(String(group).slice(0, 40)); }
    sql += ' ORDER BY day,time,id';
    noStore(ctx.res);
    sendJson(ctx.res, 200, { items: all(sql, ...args), semester });
  });

  // --- المواد المنشورة --------------------------------------------------
  router.get('/api/public/courses', (ctx) => {
    const semester = String(ctx.query.get('semester') || '').slice(0, 20);
    const items = semester
      ? all("SELECT id,semester,track,name,professors,notes,updated_at FROM courses WHERE status='published' AND semester=? ORDER BY track,name", semester)
      : all("SELECT id,semester,track,name,professors,notes,updated_at FROM courses WHERE status='published' ORDER BY semester,track,name LIMIT 500");
    noStore(ctx.res);
    sendJson(ctx.res, 200, { items });
  });

  // --- دليل الأساتذة المنشور -------------------------------------------
  router.get('/api/public/professors', (ctx) => {
    const items = all("SELECT id,name,email,office,notes,updated_at FROM professors WHERE status='published' ORDER BY name LIMIT 500");
    noStore(ctx.res);
    sendJson(ctx.res, 200, { items });
  });

  // --- دليل القاعات المنشور --------------------------------------------
  router.get('/api/public/rooms', (ctx) => {
    const items = all("SELECT id,name,building,capacity,notes,updated_at FROM rooms WHERE status='published' ORDER BY building,name LIMIT 500");
    noStore(ctx.res);
    sendJson(ctx.res, 200, { items });
  });

  // --- فحص صحة الخدمة ---------------------------------------------------
  router.get('/api/public/health', (ctx) => {
    noStore(ctx.res);
    sendJson(ctx.res, 200, { ok: true, uptime: Math.round(process.uptime()), time: new Date().toISOString() });
  });
}
