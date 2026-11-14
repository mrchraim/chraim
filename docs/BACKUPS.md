# النسخ الاحتياطي لقواعد بيانات Supabase — CHRAIM Campus

> **الخلاصة:** باقة Supabase **Free** ما عندها نسخ احتياطي تلقائي (توثيق Supabase:
> «We recommend that free tier plan projects regularly export their data using the
> Supabase CLI `db dump` command and maintain off-site backups»).
> لهذا وجد `tools/backup-supabase.sh` + workflow أسبوعي، والمستودع **عمومي**
> فكل dump يُشفَّر قبل الرفع ولا يُرفَق أبداً بـ Git.

---

## 1) ما الذي يُنسخ؟

لكل مشروع على حدة:

| الملف | المحتوى |
|---|---|
| `<project>-<stamp>.sql.gz.enc` | الأدوار (roles) + المخطط (الجداول، الفهارس، الدوال، **سياسات RLS**) + البيانات — مضغوط ومُشفَّر AES-256-CBC |
| `<project>-<stamp>-auth.sql.gz` | إن أمكن: بيانات حسابات المستخدمين (`auth`) |
| `*.sha256` | بصمة التحقق من سلامة الملف |

المشاريع الثلاثة:

| الاسم | Project ref | يحتوي |
|---|---|---|
| `portal` | `idpafbyefrywjixskvvu` | `announcements`, `exam_files`, `admins` |
| `platform` | `uftqrgpzllvqlaztcjbq` | `exams`, `profiles`, `activity_log`, `announcements` |
| `atlas` | `pvoenvxinkipgpnddumt` | `legal_documents`, `articles`, `laws`, `sources` |

> ⚠️ كاين نقطتان خارج نطاق `pg_dump`:
> 1. كائنات **Storage** (ملفات `edu-files`…) — تُصدَّر منفصلة.
> 2. المخططات `auth`/`storage` كيستثناها الـ CLI افتراضياً؛ السكربت كيجرّبها
>    بأفضل جهد (`--schema auth`) وإن رفض، صدّرها يدوياً.

---

## 2) إعداد الأسرار (مرة واحدة)

### أ) سلسلة الاتصال لكل مشروع

الدشبورد → المشروع → **Connect** → تبويب **Direct connection** (المنفذ `5432`)
→ انسخ الـ URI وبدّل `[YOUR-PASSWORD]` بكلمة مرور قاعدة البيانات.
**لا تستعمل Session pooler (6543)** مع `pg_dump` — الـ pooling كيكسر التصدير.

### ب) ضبط الأسرار من سطر الأوامر

```bash
gh secret set SUPABASE_DB_URL_PORTAL   --body "postgresql://postgres.idpafbyefrywjixskvvu:PASSWORD@aws-0-XX.pooler.supabase.com:5432/postgres"
gh secret set SUPABASE_DB_URL_PLATFORM --body "postgresql://postgres.uftqrgpzllvqlaztcjbq:PASSWORD@aws-0-XX.pooler.supabase.com:5432/postgres"
gh secret set SUPABASE_DB_URL_ATLAS    --body "postgresql://postgres.pvoenvxinkipgpnddumt:PASSWORD@aws-0-XX.pooler.supabase.com:5432/postgres"
gh secret set BACKUP_PASSPHRASE        --body "عبارة-سريحة-طويلة-وحيدة-الاستخدام"
```

(أو من الدشبورد: Settings → Secrets and variables → Actions → New repository secret)

> 🔐 **عمّا ما تصيفط هاد الـ URIs ولا عبارات السر في الرسائل/الملفات/الـ repo.**

---

## 3) التشغيل

### أسبوعياً آلياً

`.github/workflows/backup-supabase.yml` كيجري كل اثنين 03:23 UTC ويدويًا
(Actions → **Supabase backups** → Run workflow). الناتج: artifact مشفّر
معفّض حفظه **90 يوماً**، متاح فقط لمن عنده صلاحية قراءة في المستودع.

> إن كان أحد الأسرار ناقصاً، الويركفلو **يفشل بصوت عالٍ** (مش كيتجاوّز
> بصمت) — هادي مقصودة: نسخ احتياطي ماخدّمش خاصو يبان أخضر.

### محلياً

```bash
export SUPABASE_DB_URL_PORTAL='postgresql://...'
export BACKUP_PASSPHRASE='...'
bash tools/backup-supabase.sh            # كل المشاريع
bash tools/backup-supabase.sh portal     # مشروع واحد
BACKUP_DIR=/chemin/hors/projet bash tools/backup-supabase.sh
```

المتطلبات: `supabase` CLI + Docker + `openssl` + `gzip`.
بدون `BACKUP_PASSPHRASE` السكربت كينتج `.sql` **غير مشفّر** مع تنبيه.

---

## 4) الاسترجاع (Restore)

```bash
# فك التشفير
openssl enc -d -aes-256-cbc -pbkdf2 -iter 210000 -in portal-20261114T030000Z.sql.gz.enc \
  -pass env:BACKUP_PASSPHRASE | gunzip > portal.sql

# على مشروع جديد/فارغ:
psql "$NEW_DB_URL" --single-transaction --variable ON_ERROR_STOP=1 \
  --file portal.sql
```

نقاط مهمة عند الاسترجاع:

* **`auth.users` مضمّن؟** إن خرج ملف `-auth.sql.gz` استرجِعه في آخره.
  كلمات المرور محفوظة مُجزّأة (bcrypt) فتبقى صالحة، لكن **JWT secret جديد**
  يعني إعادة تسجيل دخول الجميع.
* **مفاتيح API**: `anon`/`service_role` الجديدة تُولَّد من الدشبورد وتُستبدل في
  `supabase-config.js` و `platform/js/config.js`.
* **قبل استيراد البيانات** نفّذ:
  ```sql
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
  ```
  (الأوراق المُصدَّر كيرث كل الصلاحيات افتراضياً).
* **اختبار إلزامي**: استرجاع على مشروع تجريبي قبل الاعتماد عليه في كارثة حقيقية.
* **الكائنات (Storage)**: تنزَّل يدوياً من الدشبورد أو عبر `supabase storage`.

---

## 5) حالة التحقق

| التاريخ | النتيجة |
|---|---|
| 2026-11-14 | الويركفلو مكتوب ومُختبَر نحوياً (`bash -n` ✅). الانتظار: ضبط الأسرار الأربعة قبل أول تشغيل ناجح. |

راجع أيضاً: `docs/SECURITY_AUDIT_2026-11-14.md` (البند 26).
