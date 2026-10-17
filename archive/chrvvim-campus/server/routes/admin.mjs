// ==========================================================================
// مسارات الإدارة: إدارة المحتوى (CRUD) + الحسابات + سجل التدقيق.
// صلاحيات: admin (كل شيء)، publisher (نشر المحتوى)، editor (مسودات فقط).
// ==========================================================================
import { HttpError } from '../lib/router.mjs';
import { get, all, run } from '../lib/db.mjs';
import { contentSchemas, schema, KINDS, ROLES, STATUSES } from '../lib/validate.mjs';
import { hashPassword, rateLimit } from '../lib/security.mjs';
import { sendJson } from '../lib/http.mjs';
import { audit } from '../services/audit.mjs';
import { requireLogin, requireAdmin, requireRole } from './auth.mjs';
import { generateDraft, envConfig, AI_TONES, AI_LANGS } from '../services/ai.mjs';

const mutateLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120, key: 'mutate' });
/** حدّ لطيف على نداءات الصياغة كي لا يُستنزف المزوّد الخارجي. */
const aiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, key: 'ai' });

/** مخطط طلب صياغة الإعلان. */
const aiDraftSchema = schema({
  topic: (f) => f.string({ min: 3, max: 200, required: true }),
  kind: (f) => f.enum(KINDS, { required: false }),
  tone: (f) => f.enum(AI_TONES, { required: false }),
  language: (f) => f.enum(AI_LANGS, { required: false }),
  notes: (f) => f.string({ max: 600 }),
});

const TABLES = {
  schedules: 'schedules',
  courses: 'courses',
  professors: 'professors',
  rooms: 'rooms',
  announcements: 'announcements',
};

const SEARCH_COLUMNS = {
  schedules: ['subject', 'professor', 'room', 'track', 'group_name', 'semester'],
  courses: ['name', 'track', 'professors', 'semester'],
  professors: ['name', 'email', 'office'],
  rooms: ['name', 'building'],
  announcements: ['title', 'body'],
};

const LIST_COLUMNS = {
  schedules: 'id,semester,track,day,time,subject,professor,room,group_name,subgroups,status,source_note,updated_at',
  courses: 'id,semester,track,name,professors,notes,status,updated_at',
  professors: 'id,name,email,office,notes,status,updated_at',
  rooms: 'id,name,building,capacity,notes,status,updated_at',
  announcements: 'id,title,body,kind,starts_at,ends_at,status,created_by,updated_at',
};

const PAGE_SIZE = 50;

function parseId(raw) {
  const text = String(raw == null ? '' : raw).trim();
  if (!/^[0-9]+$/.test(text)) throw new HttpError(400, 'معرّف غير صالح.');
  const id = Number(text);
  if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, 'معرّف غير صالح.');
  return id;
}

/** يفلت رموز LIKE حتى لا يستعمل المستخدم أنماطاً غير مقصودة. */
function likeTerm(q) {
  return `%${String(q).replace(/[\\%_]/g, '\\$&')}%`;
}

function listEntity(entity, ctx) {
  const table = TABLES[entity];
  const q = String(ctx.query.get('q') || '').trim().slice(0, 100);
  const status = STATUSES.includes(ctx.query.get('status')) ? ctx.query.get('status') : '';
  const page = Math.max(1, Number.parseInt(ctx.query.get('page') || '1', 10) || 1);
  const where = [];
  const args = [];
  if (status) { where.push('status=?'); args.push(status); }
  if (q) {
    const cols = SEARCH_COLUMNS[entity];
    where.push(`(${cols.map((c) => `${c} LIKE ? ESCAPE '\\'`).join(' OR ')})`);
    for (const _ of cols) args.push(likeTerm(q));
  }
  const clause = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const total = get(`SELECT COUNT(*) AS n FROM ${table}${clause}`, ...args).n;
  const items = all(
    `SELECT ${LIST_COLUMNS[entity]} FROM ${table}${clause} ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?`,
    ...args, PAGE_SIZE, (page - 1) * PAGE_SIZE,
  );
  return { items, total, page, limit: PAGE_SIZE };
}

function createEntity(entity, ctx) {
  const table = TABLES[entity];
  const value = contentSchemas[entity].parse(ctx.body || {});
  if (ctx.admin.role === 'editor' && value.status !== 'draft') {
    throw new HttpError(403, 'المحرر يستطيع إنشاء المسودات فقط.');
  }
  const keys = Object.keys(value);
  const cols = [...keys];
  const vals = keys.map((k) => value[k]);
  if (entity === 'announcements') { cols.push('created_by'); vals.push(ctx.admin.id); }
  const marks = cols.map(() => '?').join(',');
  const result = run(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${marks})`, ...vals);
  audit(ctx, 'create', entity, result.lastInsertRowid, `إنشاء سجل في ${entity}`);
  return get(`SELECT ${LIST_COLUMNS[entity]} FROM ${table} WHERE id=?`, result.lastInsertRowid);
}

function updateEntity(entity, ctx, id) {
  const table = TABLES[entity];
  const value = contentSchemas[entity].parse(ctx.body || {});
  const existing = get(`SELECT id,status FROM ${table} WHERE id=?`, id);
  if (!existing) throw new HttpError(404, 'السجل غير موجود.');
  if (ctx.admin.role === 'editor' && (value.status !== 'draft' || existing.status !== 'draft')) {
    throw new HttpError(403, 'المحرر يستطيع تعديل المسودات فقط ولا يمكنه نشر السجلات.');
  }
  const keys = Object.keys(value);
  const set = keys.map((k) => `${k}=?`).join(',');
  const result = run(
    `UPDATE ${table} SET ${set}, updated_at=datetime('now') WHERE id=?`,
    ...keys.map((k) => value[k]), id,
  );
  if (!result.changes) throw new HttpError(404, 'السجل غير موجود.');
  audit(ctx, 'update', entity, id, `تعديل سجل في ${entity}`);
  return get(`SELECT ${LIST_COLUMNS[entity]} FROM ${table} WHERE id=?`, id);
}

function deleteEntity(entity, ctx, id) {
  const result = run(`DELETE FROM ${TABLES[entity]} WHERE id=?`, id);
  if (!result.changes) throw new HttpError(404, 'السجل غير موجود.');
  audit(ctx, 'delete', entity, id, `حذف سجل من ${entity}`);
}

function countActiveAdmins() {
  return get("SELECT COUNT(*) AS n FROM admins WHERE role='admin' AND active=1").n;
}

export function registerAdmin(router) {
  // --- مساعد صياغة الإعلانات (ذكاء اصطناعي اختياري) ---------------------
  router.get('/api/admin/ai/status', requireLogin, (ctx) => {
    const cfg = envConfig();
    sendJson(ctx.res, 200, {
      configured: cfg.configured,
      provider: cfg.configured ? cfg.provider : 'local',
      model: cfg.configured ? cfg.model : '',
      fallback: true,
    });
  });

  router.post('/api/admin/ai/draft', requireLogin, aiLimiter, async (ctx) => {
    const value = aiDraftSchema.parse(ctx.body || {});
    const result = await generateDraft(value);
    audit(ctx, 'ai_draft', 'announcements', null, `صياغة ذكية (${result.source})`);
    sendJson(ctx.res, 200, {
      title: result.title,
      body: result.body,
      source: result.source,
      provider: result.provider,
      model: result.model,
      configured: envConfig().configured,
    });
  });

  // --- سجل التدقيق (مدير فقط) ------------------------------------------
  router.get('/api/admin/audit', requireAdmin, (ctx) => {
    const items = all(
      `SELECT a.id,a.action,a.entity,a.entity_id,a.details,a.created_at,u.email AS admin_email
         FROM audit_logs a LEFT JOIN admins u ON u.id=a.admin_id
        ORDER BY a.id DESC LIMIT 100`,
    );
    sendJson(ctx.res, 200, { items });
  });

  // --- إدارة الحسابات (مدير فقط) ---------------------------------------
  router.get('/api/admin/users', requireAdmin, (ctx) => {
    const items = all('SELECT id,email,role,active,created_at,last_login_at FROM admins ORDER BY id ASC');
    sendJson(ctx.res, 200, { items });
  });

  router.post('/api/admin/users', requireAdmin, mutateLimiter, (ctx) => {
    const body = ctx.body || {};
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = String(body.role || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      throw new HttpError(400, 'بريد إلكتروني غير صالح.', { fields: [{ field: 'email', message: 'غير صالح.' }] });
    }
    if (password.length < 14 || password.length > 200) {
      throw new HttpError(400, 'كلمة المرور يجب أن تكون 14 حرفاً على الأقل.', { fields: [{ field: 'password', message: 'قصيرة جداً.' }] });
    }
    if (!ROLES.includes(role)) {
      throw new HttpError(400, 'صلاحية غير مسموحة.', { fields: [{ field: 'role', message: 'غير مسموح.' }] });
    }
    let result;
    try {
      result = run('INSERT INTO admins (email,password_hash,role) VALUES (?,?,?)', email, hashPassword(password), role);
    } catch (error) {
      if (String(error.message || '').includes('UNIQUE')) throw new HttpError(409, 'هذا البريد مسجل بالفعل.');
      throw error;
    }
    audit(ctx, 'create', 'admin', result.lastInsertRowid, `إنشاء حساب بصلاحية ${role}`);
    sendJson(ctx.res, 201, {
      item: get('SELECT id,email,role,active,created_at,last_login_at FROM admins WHERE id=?', result.lastInsertRowid),
    });
  });

  router.patch('/api/admin/users/:id', requireAdmin, mutateLimiter, (ctx) => {
    const id = parseId(ctx.params.id);
    const body = ctx.body || {};
    const patch = {};
    if (body.role !== undefined) {
      if (!ROLES.includes(body.role)) throw new HttpError(400, 'صلاحية غير مسموحة.');
      patch.role = body.role;
    }
    if (body.active !== undefined) patch.active = body.active === true || body.active === 'true' || body.active === 1 ? 1 : 0;
    if (body.password !== undefined) {
      const password = String(body.password);
      if (password.length < 14 || password.length > 200) {
        throw new HttpError(400, 'كلمة المرور يجب أن تكون 14 حرفاً على الأقل.');
      }
      patch.password_hash = hashPassword(password);
    }
    if (!Object.keys(patch).length) throw new HttpError(400, 'لا يوجد أي تغيير.');

    const target = get('SELECT id,role,active FROM admins WHERE id=?', id);
    if (!target) throw new HttpError(404, 'الحساب غير موجود.');

    const demoting = (patch.role && patch.role !== 'admin') || patch.active === 0;
    if (id === ctx.admin.id && demoting) {
      throw new HttpError(400, 'لا يمكن تعطيل حسابك الحالي أو سحب صلاحية المدير منه.');
    }
    if (target.role === 'admin' && target.active === 1 && demoting && countActiveAdmins() <= 1) {
      throw new HttpError(400, 'لا يمكن تعطيل أو تغيير صلاحية آخر مدير نشط.');
    }

    const fields = Object.keys(patch).map((k) => `${k}=?`);
    run(`UPDATE admins SET ${fields.join(',')} WHERE id=?`, ...Object.values(patch), id);
    audit(ctx, 'update', 'admin', id, 'تحديث صلاحيات/حالة/كلمة مرور الحساب');
    sendJson(ctx.res, 200, {
      item: get('SELECT id,email,role,active,created_at,last_login_at FROM admins WHERE id=?', id),
    });
  });

  // --- إدارة المحتوى (CRUD عام) ----------------------------------------
  for (const entity of Object.keys(TABLES)) {
    router.get(`/api/admin/${entity}`, requireLogin, (ctx) => {
      sendJson(ctx.res, 200, listEntity(entity, ctx));
    });

    router.post(`/api/admin/${entity}`, requireLogin, mutateLimiter, (ctx) => {
      sendJson(ctx.res, 201, { item: createEntity(entity, ctx) });
    });

    router.put(`/api/admin/${entity}/:id`, requireLogin, mutateLimiter, (ctx) => {
      sendJson(ctx.res, 200, { item: updateEntity(entity, ctx, parseId(ctx.params.id)) });
    });

    router.delete(`/api/admin/${entity}/:id`, requireAdmin, mutateLimiter, (ctx) => {
      deleteEntity(entity, ctx, parseId(ctx.params.id));
      sendJson(ctx.res, 200, { ok: true });
    });
  }

  // --- نشر جماعي (ميزة إضافية) -----------------------------------------
  router.post('/api/admin/:entity/publish-all', requireRole('admin', 'publisher'), mutateLimiter, (ctx) => {
    const entity = ctx.params.entity;
    if (!TABLES[entity]) throw new HttpError(404, 'القسم غير موجود.');
    const result = run(`UPDATE ${TABLES[entity]} SET status='published', updated_at=datetime('now') WHERE status='draft'`);
    audit(ctx, 'publish_all', entity, null, `نشر ${result.changes} سجل مسودة`);
    sendJson(ctx.res, 200, { ok: true, published: result.changes });
  });
}
