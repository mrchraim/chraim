// ==========================================================================
// إعدادات المشروع المركزية
// ==========================================================================
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '..');
export const WEB_DIR = path.join(ROOT, 'web');
export const DATA_DIR = path.join(__dirname, 'data');
export const PUBLIC_DATA_DIR = path.join(WEB_DIR, 'data');
export const DOCUMENTS_DIR = path.join(WEB_DIR, 'documents');

// --- تحميل اختياري لملف .env (بلا أي تبعية) قبل قراءة المتغيرات ------------
// لا نُطغى على متغيّرات البيئة الموجودة مسبقاً، فتبقى للبيئة/الاختبارات الأولوية.
try {
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const match = rawLine.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  }
} catch {
  // ملف .env اختياري تماماً؛ نتجاهل أي خطأ في قراءته.
}

export const isProd = process.env.NODE_ENV === 'production';
export const PORT = Number.parseInt(process.env.PORT || '3000', 10);

export const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'development-only-secret-change-this-before-deployment-000000';

if (isProd && SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters in production.');
}

export const DB_PATH =
  process.env.DATABASE_PATH || path.join(DATA_DIR, 'chrvvim.sqlite');

/** مقدار صلاحية الجلسة بالثواني (30 دقيقة). */
export const SESSION_TTL_SECONDS = 60 * 30;
/** مدة صلاحية ملف تعريف الارتباط للجلسة بالملّي ثانية. */
export const SESSION_COOKIE_MS = SESSION_TTL_SECONDS * 1000;
export const SESSION_COOKIE_NAME = 'chrvvim.sid';

// --- إعدادات مساعد صياغة الإعلانات (اختياري تماماً) ----------------------
// عند غياب AI_API_KEY يعمل المساعد بصياغة محلية (قالب) بلا أي اتصال خارجي.
export const AI_PROVIDER = (process.env.AI_PROVIDER || '').trim().toLowerCase();
export const AI_API_KEY = (process.env.AI_API_KEY || '').trim();
export const AI_MODEL = (process.env.AI_MODEL || '').trim();
export const AI_BASE_URL = (process.env.AI_BASE_URL || '').trim();
export const AI_TIMEOUT_MS = Number.parseInt(process.env.AI_TIMEOUT_MS || '20000', 10) || 20000;

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
