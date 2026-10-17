require('dotenv').config();
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { z } = require('zod');
const db = require('./db');

const app = express();
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const isProd = process.env.NODE_ENV === 'production';
if (isProd && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) throw new Error('Set a SESSION_SECRET of at least 32 characters in production.');
const sessionSecret = process.env.SESSION_SECRET || 'development-only-secret-change-this-before-deployment-000000';
app.disable('x-powered-by');
if (isProd) app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], objectSrc: ["'none'"],
    baseUri: ["'self'"], frameAncestors: ["'none'"], formAction: ["'self'"]
  } },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use(express.json({ limit: '100kb', strict: true }));
app.use(session({
  name: 'chrvvim.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: DATA_DIR, table: 'sessions' }),
  cookie: { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 1000 * 60 * 30, path: '/' }
}));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'محاولات كثيرة. انتظر 15 دقيقة ثم حاول مجدداً.' } });
const mutateLimiter = rateLimit({ windowMs: 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false });
const emailSchema = z.string().trim().email().max(254);
const idSchema = z.coerce.number().int().positive();
const statusSchema = z.enum(['draft','published','archived']);
const schemas = {
  schedules: z.object({ semester:z.string().trim().min(2).max(20), track:z.string().trim().min(1).max(160), day:z.string().trim().min(1).max(30), time:z.string().trim().max(60), subject:z.string().trim().min(1).max(200), professor:z.string().trim().max(200), room:z.string().trim().max(160), group_name:z.string().trim().max(40), subgroups:z.string().trim().max(80), status:statusSchema, source_note:z.string().trim().max(1000) }).strict(),
  courses: z.object({ semester:z.string().trim().min(2).max(20), track:z.string().trim().max(160), name:z.string().trim().min(1).max(200), professors:z.string().trim().max(500), notes:z.string().trim().max(1000), status:statusSchema }).strict(),
  professors: z.object({ name:z.string().trim().min(1).max(200), email:z.string().trim().max(254).refine(v=>!v||emailSchema.safeParse(v).success,'بريد إلكتروني غير صالح'), office:z.string().trim().max(160), notes:z.string().trim().max(1000), status:statusSchema }).strict(),
  rooms: z.object({ name:z.string().trim().min(1).max(160), building:z.string().trim().max(160), capacity:z.union([z.number().int().min(1).max(5000),z.null()]), notes:z.string().trim().max(1000), status:statusSchema }).strict(),
  announcements: z.object({ title:z.string().trim().min(3).max(180), body:z.string().trim().min(3).max(5000), kind:z.enum(['info','warning','urgent','event']), starts_at:z.string().trim().max(30).transform(v=>v.replace('T',' ')), ends_at:z.string().trim().max(30).transform(v=>v.replace('T',' ')), status:statusSchema }).strict()
};
const tableNames = { schedules:'schedules', courses:'courses', professors:'professors', rooms:'rooms', announcements:'announcements' };
const labels = { schedules:'الجدول', courses:'المواد', professors:'الأساتذة', rooms:'القاعات', announcements:'الإعلانات' };
function csrfToken(req) { if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex'); return req.session.csrfToken; }
function csrfGuard(req,res,next) {
  if (!['POST','PUT','PATCH','DELETE'].includes(req.method)) return next();
  const supplied = req.get('x-csrf-token');
  if (!supplied || !req.session.csrfToken) return res.status(403).json({ error:'تعذر التحقق من الطلب. حدّث الصفحة وحاول مجدداً.' });
  const suppliedBuf=Buffer.from(supplied); const expectedBuf=Buffer.from(req.session.csrfToken);
  if (suppliedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(suppliedBuf, expectedBuf)) return res.status(403).json({ error:'تعذر التحقق من الطلب. حدّث الصفحة وحاول مجدداً.' });
  next();
}
app.use('/api', csrfGuard);
function requireRoles(...roles) {
  return (req,res,next)=>{
    const sessionAdmin = req.session.admin;
    if (!sessionAdmin || !sessionAdmin.id) return res.status(401).json({error:'يلزم تسجيل الدخول.'});

    // Do not trust a role cached in the session: an administrator may have
    // disabled this account or changed its role from another active session.
    const current = db.prepare('SELECT id,email,role,active FROM admins WHERE id=?').get(sessionAdmin.id);
    if (!current || current.active !== 1) {
      return req.session.destroy(()=>{
        res.clearCookie('chrvvim.sid',{path:'/'});
        res.status(401).json({error:'انتهت صلاحية الحساب الإداري أو تم تعطيله. سجّل الدخول مجدداً.'});
      });
    }
    if (sessionAdmin.role !== current.role || sessionAdmin.email !== current.email) {
      req.session.admin = {id:current.id,email:current.email,role:current.role};
      return req.session.save(err=>{
        if (err) return safeError(res,err);
        if (!roles.includes(current.role)) return res.status(403).json({error:'ليست لديك صلاحية لتنفيذ هذا الإجراء.'});
        next();
      });
    }
    if (!roles.includes(current.role)) return res.status(403).json({error:'ليست لديك صلاحية لتنفيذ هذا الإجراء.'});
    next();
  };
}
function requireLogin(req,res,next) { return requireRoles('admin','editor','publisher')(req,res,next); }
const requireAdmin = requireRoles('admin');
const requireContentEditor = requireRoles('admin','editor','publisher');
function audit(req,action,entity,entityId,details='') { db.prepare('INSERT INTO audit_logs (admin_id,action,entity,entity_id,details) VALUES (?,?,?,?,?)').run(req.session.admin?.id || null,action,entity,entityId,details.slice(0,500)); }
function safeError(res,error) { if (error?.name === 'ZodError') return res.status(400).json({ error:'راجع الحقول المدخلة.', fields:error.issues.map(i=>({field:i.path.join('.'),message:i.message})) }); console.error(error); return res.status(500).json({error:'حدث خطأ داخلي. لم يتم عرض تفاصيل الخادم.'}); }

app.get('/api/admin/csrf', (req,res)=>res.json({csrfToken:csrfToken(req)}));
app.get('/api/admin/me', (req,res)=>res.json({authenticated:!!req.session.admin,admin:req.session.admin || null}));
app.post('/api/admin/login', loginLimiter, async (req,res)=>{
  try {
    const parsed = z.object({email:emailSchema,password:z.string().min(1).max(200)}).strict().parse(req.body);
    const user = db.prepare('SELECT id,email,password_hash,role,active FROM admins WHERE email=? COLLATE NOCASE').get(parsed.email);
    const ok = user && user.active === 1 && await bcrypt.compare(parsed.password,user.password_hash);
    if (!ok) { audit(req,'login_failed','admin',null,'Rejected login attempt'); return res.status(401).json({error:'البريد الإلكتروني أو كلمة المرور غير صحيحة.'}); }
    req.session.regenerate(err=>{
      if (err) return safeError(res,err);
      req.session.admin={id:user.id,email:user.email,role:user.role};
      req.session.csrfToken=crypto.randomBytes(32).toString('hex');
      db.prepare("UPDATE admins SET last_login_at=datetime('now') WHERE id=?").run(user.id);
      audit(req,'login','admin',user.id,'Successful login');
      req.session.save(saveErr=>{ if(saveErr) return safeError(res,saveErr); res.json({ok:true,admin:req.session.admin,csrfToken:req.session.csrfToken}); });
    });
  } catch(e) { safeError(res,e); }
});
app.post('/api/admin/logout', requireLogin, (req,res)=>{ const id=req.session.admin.id; audit(req,'logout','admin',id,'Session ended'); req.session.destroy(err=>{ if(err) return safeError(res,err); res.clearCookie('chrvvim.sid',{path:'/'}); res.json({ok:true}); }); });

for (const [entity,table] of Object.entries(tableNames)) {
  app.get(`/api/admin/${entity}`,requireContentEditor,(req,res)=>{
    const q = String(req.query.q||'').trim().slice(0,100);
    const status = ['draft','published','archived'].includes(req.query.status) ? req.query.status : '';
    const page = Math.max(1,Math.min(10000,Number.parseInt(req.query.page||'1',10)||1));
    const limit = 50; const offset=(page-1)*limit;
    const searchColumns = {schedules:['subject','professor','room','track','group_name'],courses:['name','track','professors'],professors:['name','email','office'],rooms:['name','building'],announcements:['title','body']}[entity];
    const where=[]; const args=[];
    if(status){where.push('status=?');args.push(status);}
    if(q){where.push('('+searchColumns.map(c=>`${c} LIKE ? ESCAPE '\\'`).join(' OR ')+')');for(let i=0;i<searchColumns.length;i++)args.push(`%${q.replace(/[\\%_]/g,'\\$&')}%`);}
    const clause=where.length?' WHERE '+where.join(' AND '):'';
    const rows=db.prepare(`SELECT * FROM ${table}${clause} ORDER BY updated_at DESC,id DESC LIMIT ? OFFSET ?`).all(...args,limit,offset);
    const total=db.prepare(`SELECT COUNT(*) AS n FROM ${table}${clause}`).get(...args).n;
    res.json({items:rows,total,page,limit});
  });
  app.post(`/api/admin/${entity}`,requireContentEditor,mutateLimiter,(req,res)=>{
    try { const v=schemas[entity].parse(req.body); if(req.session.admin.role==='editor' && v.status!=='draft') return res.status(403).json({error:'المحرر يستطيع إنشاء المسودات فقط.'}); const keys=Object.keys(v); const cols=[...keys,...(entity==='announcements'?['created_by']:[])].join(','); const marks=[...keys,...(entity==='announcements'?[req.session.admin.id]:[])].map(()=>'?').join(','); const vals=[...keys.map(k=>v[k]),...(entity==='announcements'?[req.session.admin.id]:[])]; const result=db.prepare(`INSERT INTO ${table} (${cols}) VALUES (${marks})`).run(...vals); audit(req,'create',entity,result.lastInsertRowid,`Created ${entity} record`); res.status(201).json({item:db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(result.lastInsertRowid)}); }
    catch(e){safeError(res,e);}
  });
  app.put(`/api/admin/${entity}/:id`,requireContentEditor,mutateLimiter,(req,res)=>{
    try { const id=idSchema.parse(req.params.id); const v=schemas[entity].parse(req.body); const existing=db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id); if(!existing)return res.status(404).json({error:'السجل غير موجود.'}); if(req.session.admin.role==='editor' && (v.status!=='draft' || existing.status!=='draft')) return res.status(403).json({error:'المحرر يستطيع تعديل المسودات فقط ولا يمكنه نشر السجلات.'}); const keys=Object.keys(v); const set=keys.map(k=>`${k}=?`).join(','); const vals=keys.map(k=>v[k]); const result=db.prepare(`UPDATE ${table} SET ${set},updated_at=datetime('now') WHERE id=?`).run(...vals,id); if(!result.changes)return res.status(404).json({error:'السجل غير موجود.'}); audit(req,'update',entity,id,`Updated ${entity} record`); res.json({item:db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id)}); }
    catch(e){safeError(res,e);}
  });
  app.delete(`/api/admin/${entity}/:id`,requireAdmin,mutateLimiter,(req,res)=>{
    try { const id=idSchema.parse(req.params.id); const result=db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id); if(!result.changes)return res.status(404).json({error:'السجل غير موجود.'}); audit(req,'delete',entity,id,`Deleted ${entity} record`); res.json({ok:true}); }
    catch(e){safeError(res,e);}
  });
}
app.get('/api/admin/audit',requireAdmin,(req,res)=>{const rows=db.prepare(`SELECT a.id,a.action,a.entity,a.entity_id,a.details,a.created_at,u.email AS admin_email FROM audit_logs a LEFT JOIN admins u ON u.id=a.admin_id ORDER BY a.id DESC LIMIT 100`).all();res.json({items:rows});});
// Account management: only the primary administrator can create or change accounts.
app.get('/api/admin/users',requireAdmin,(req,res)=>{
  const items=db.prepare('SELECT id,email,role,active,created_at,last_login_at FROM admins ORDER BY id ASC').all();
  res.json({items});
});
app.post('/api/admin/users',requireAdmin,mutateLimiter,(req,res)=>{
  try {
    const v=z.object({email:emailSchema,password:z.string().min(14).max(200),role:z.enum(['admin','editor','publisher'])}).strict().parse(req.body);
    const result=db.prepare('INSERT INTO admins (email,password_hash,role) VALUES (?,?,?)').run(v.email.toLowerCase(),bcrypt.hashSync(v.password,12),v.role);
    audit(req,'create','admin',result.lastInsertRowid,`Created account with role ${v.role}`);
    res.status(201).json({item:db.prepare('SELECT id,email,role,active,created_at,last_login_at FROM admins WHERE id=?').get(result.lastInsertRowid)});
  } catch(e) { if(String(e.message||'').includes('UNIQUE constraint failed')) return res.status(409).json({error:'هذا البريد مسجل بالفعل.'}); safeError(res,e); }
});
app.patch('/api/admin/users/:id',requireAdmin,mutateLimiter,(req,res)=>{
  try {
    const id=idSchema.parse(req.params.id);
    const v=z.object({role:z.enum(['admin','editor','publisher']).optional(),active:z.boolean().optional(),password:z.string().min(14).max(200).optional()}).strict().refine(o=>Object.keys(o).length>0).parse(req.body);
    if(id===req.session.admin.id && (v.active===false || (v.role && v.role!=='admin'))) return res.status(400).json({error:'لا يمكن تعطيل حسابك الحالي أو سحب صلاحية المدير منه.'});
    const target=db.prepare('SELECT id,role,active FROM admins WHERE id=?').get(id); if(!target)return res.status(404).json({error:'الحساب غير موجود.'}); if(target.role==='admin' && target.active===1 && (v.active===false || (v.role && v.role!=='admin'))){const activeAdmins=db.prepare("SELECT COUNT(*) AS n FROM admins WHERE role='admin' AND active=1").get().n;if(activeAdmins<=1)return res.status(400).json({error:'لا يمكن تعطيل أو تغيير صلاحية آخر مدير نشط.'});}
    const fields=[]; const args=[];
    if(v.role){fields.push('role=?');args.push(v.role);} if(v.active!==undefined){fields.push('active=?');args.push(v.active?1:0);} if(v.password){fields.push('password_hash=?');args.push(bcrypt.hashSync(v.password,12));}
    args.push(id); db.prepare(`UPDATE admins SET ${fields.join(',')} WHERE id=?`).run(...args);
    audit(req,'update','admin',id,'Updated account permissions/status/password');
    res.json({item:db.prepare('SELECT id,email,role,active,created_at,last_login_at FROM admins WHERE id=?').get(id)});
  } catch(e){safeError(res,e);}
});

app.get('/api/public/courses',(req,res)=>{const semester=String(req.query.semester||'').slice(0,20);const rows=semester?db.prepare("SELECT id,semester,track,name,professors,notes,updated_at FROM courses WHERE status='published' AND semester=? ORDER BY track,name").all(semester):db.prepare("SELECT id,semester,track,name,professors,notes,updated_at FROM courses WHERE status='published' ORDER BY semester,track,name LIMIT 500").all();res.set('Cache-Control','no-store');res.json({items:rows});});
app.get('/api/public/professors',(req,res)=>{const items=db.prepare("SELECT id,name,email,office,notes,updated_at FROM professors WHERE status='published' ORDER BY name LIMIT 500").all();res.set('Cache-Control','no-store');res.json({items});});
app.get('/api/public/rooms',(req,res)=>{const items=db.prepare("SELECT id,name,building,capacity,notes,updated_at FROM rooms WHERE status='published' ORDER BY building,name LIMIT 500").all();res.set('Cache-Control','no-store');res.json({items});});
app.get('/api/public/announcements',(req,res)=>{const items=db.prepare("SELECT id,title,body,kind,starts_at,ends_at,updated_at FROM announcements WHERE status='published' AND (starts_at='' OR starts_at<=datetime('now')) AND (ends_at='' OR ends_at>=datetime('now')) ORDER BY CASE kind WHEN 'urgent' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,updated_at DESC LIMIT 30").all();res.set('Cache-Control','no-store');res.json({items});});
app.get('/api/public/schedules',(req,res)=>{const semester=String(req.query.semester||'S3').slice(0,20);const rows=db.prepare("SELECT id,semester,track,day,time,subject,professor,room,group_name,subgroups,status,updated_at FROM schedules WHERE semester=? AND status='published' ORDER BY day,time,id").all(semester);res.set('Cache-Control','no-store');res.json({items:rows,semester});});

// Explicitly serve only public assets. The database, .env and server source are not web-accessible.
app.get('/',(req,res)=>res.sendFile(path.join(ROOT,'index.html')));
app.get('/app.js',(req,res)=>res.sendFile(path.join(ROOT,'app.js')));
app.get('/admin',(req,res)=>res.sendFile(path.join(ROOT,'admin','index.html')));
app.get('/admin/',(req,res)=>res.sendFile(path.join(ROOT,'admin','index.html')));
app.get('/admin/admin.js',(req,res)=>res.sendFile(path.join(ROOT,'admin','admin.js')));
app.get('/admin/admin.css',(req,res)=>res.sendFile(path.join(ROOT,'admin','admin.css')));
app.get('/public/assets/:file',(req,res,next)=>{const allowed=new Set(['founder-mohamed-chraim.jpeg']);if(!allowed.has(req.params.file))return res.sendStatus(404);res.set('Cache-Control','public, max-age=86400');res.sendFile(path.join(ROOT,'public','assets',req.params.file),err=>{if(err)next();});});
app.get('/public/:file', (req,res,next)=>{const allowed=new Set(['academic-guide-public.json','founder-profile.json']);if(!allowed.has(req.params.file))return res.sendStatus(404);res.sendFile(path.join(ROOT,'public',req.params.file),err=>{if(err)next();});});
app.use((req,res)=>res.status(404).json({error:'المسار غير موجود.'}));
app.use((err,req,res,next)=>{if(err instanceof SyntaxError && 'body' in err)return res.status(400).json({error:'صيغة JSON غير صالحة.'});safeError(res,err);});
const port=Number(process.env.PORT||3000);
app.listen(port,()=>console.log(`CHRVVIM portal listening on http://localhost:${port}`));
