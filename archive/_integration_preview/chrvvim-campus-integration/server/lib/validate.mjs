// ==========================================================================
// تحقق مبسّط من المدخلات: يرمي HttpError(400) مع قائمة الحقول الخاطئة.
// ==========================================================================
import { HttpError } from './router.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class Field {
  constructor(name) { this.name = name; this.checks = []; }
  string({ min = 0, max = 255, required = false, trim = true } = {}) {
    this.kind = 'string';
    this.opts = { min, max, required, trim };
    return this;
  }
  email({ required = true } = {}) {
    this.kind = 'email';
    this.opts = { required, max: 254 };
    return this;
  }
  enum(values, { required = true } = {}) {
    this.kind = 'enum';
    this.opts = { values, required };
    return this;
  }
  int({ min, max, required = false, nullable = false } = {}) {
    this.kind = 'int';
    this.opts = { min, max, required, nullable };
    return this;
  }
  bool({ required = false } = {}) {
    this.kind = 'bool';
    this.opts = { required };
    return this;
  }
}

export function schema(definition) {
  const fields = Object.entries(definition).map(([name, cfg]) => {
    const f = new Field(name);
    return cfg(f);
  });
  return {
    parse(input = {}) {
      const out = {};
      const errors = [];
      const seen = new Set(fields.map((f) => f.name));
      for (const key of Object.keys(input)) {
        if (!seen.has(key)) errors.push({ field: key, message: 'حقل غير معروف.' });
      }
      for (const f of fields) {
        const { kind, opts } = f;
        let value = input[f.name];
        if (kind === 'bool') {
          if (value === undefined) { if (opts.required) errors.push({ field: f.name, message: 'مطلوب.' }); continue; }
          out[f.name] = value === true || value === 'true' || value === 1;
          continue;
        }
        if (value === undefined || value === null || value === '') {
          if (kind === 'int' && opts.nullable) { out[f.name] = null; continue; }
          if (opts.required) { errors.push({ field: f.name, message: 'مطلوب.' }); continue; }
          out[f.name] = kind === 'int' ? (opts.nullable ? null : undefined) : '';
          continue;
        }
        if (kind === 'int') {
          const n = Number(value);
          if (!Number.isInteger(n)) { errors.push({ field: f.name, message: 'يجب أن يكون رقماً صحيحاً.' }); continue; }
          if (opts.min !== undefined && n < opts.min) { errors.push({ field: f.name, message: `الحد الأدنى ${opts.min}.` }); continue; }
          if (opts.max !== undefined && n > opts.max) { errors.push({ field: f.name, message: `الحد الأقصى ${opts.max}.` }); continue; }
          out[f.name] = n;
          continue;
        }
        let str = String(value);
        if (opts.trim !== false) str = str.trim();
        if (kind === 'email') {
          if (!EMAIL_RE.test(str) || str.length > 254) { errors.push({ field: f.name, message: 'بريد إلكتروني غير صالح.' }); continue; }
        } else if (kind === 'enum') {
          if (!opts.values.includes(str)) { errors.push({ field: f.name, message: 'قيمة غير مسموحة.' }); continue; }
        } else {
          if (opts.min && str.length < opts.min) { errors.push({ field: f.name, message: `الحد الأدنى ${opts.min} حرف.` }); continue; }
          if (opts.max && str.length > opts.max) { errors.push({ field: f.name, message: `الحد الأقصى ${opts.max} حرف.` }); continue; }
        }
        out[f.name] = str;
      }
      if (errors.length) throw new HttpError(400, 'راجع الحقول المدخلة.', { fields: errors });
      return out;
    },
  };
}

export const STATUSES = ['draft', 'published', 'archived'];
export const KINDS = ['info', 'warning', 'urgent', 'event'];
export const ROLES = ['admin', 'editor', 'publisher'];

export const contentSchemas = {
  schedules: schema({
    semester: (f) => f.string({ min: 1, max: 20, required: true }),
    track: (f) => f.string({ min: 1, max: 200, required: true }),
    day: (f) => f.string({ min: 1, max: 30, required: true }),
    time: (f) => f.string({ max: 60 }),
    subject: (f) => f.string({ min: 1, max: 200, required: true }),
    professor: (f) => f.string({ max: 200 }),
    room: (f) => f.string({ max: 160 }),
    group_name: (f) => f.string({ max: 40 }),
    subgroups: (f) => f.string({ max: 120 }),
    status: (f) => f.enum(STATUSES, { required: true }),
    source_note: (f) => f.string({ max: 1000 }),
  }),
  courses: schema({
    semester: (f) => f.string({ min: 1, max: 20, required: true }),
    track: (f) => f.string({ max: 200 }),
    name: (f) => f.string({ min: 1, max: 200, required: true }),
    professors: (f) => f.string({ max: 500 }),
    notes: (f) => f.string({ max: 1000 }),
    status: (f) => f.enum(STATUSES, { required: true }),
  }),
  professors: schema({
    name: (f) => f.string({ min: 1, max: 200, required: true }),
    email: (f) => f.email({ required: false }),
    office: (f) => f.string({ max: 160 }),
    notes: (f) => f.string({ max: 1000 }),
    status: (f) => f.enum(STATUSES, { required: true }),
  }),
  rooms: schema({
    name: (f) => f.string({ min: 1, max: 160, required: true }),
    building: (f) => f.string({ max: 160 }),
    capacity: (f) => f.int({ min: 1, max: 5000, nullable: true }),
    notes: (f) => f.string({ max: 1000 }),
    status: (f) => f.enum(STATUSES, { required: true }),
  }),
  announcements: schema({
    title: (f) => f.string({ min: 3, max: 180, required: true }),
    body: (f) => f.string({ min: 3, max: 5000, required: true }),
    kind: (f) => f.enum(KINDS, { required: true }),
    starts_at: (f) => f.string({ max: 30 }),
    ends_at: (f) => f.string({ max: 30 }),
    status: (f) => f.enum(STATUSES, { required: true }),
  }),
};
