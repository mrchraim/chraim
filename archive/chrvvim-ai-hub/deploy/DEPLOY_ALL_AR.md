# دليل التنفيذ الكامل — CHRVVIM AI HUB

> هذا الدليل ينفّذ **كل** ما تبقّى لإنجاز الهدف:
> ① إنشاء مستودع GitHub `chrvvim-ai-hub` ورفع الكود.
> ② نشر إعادة التوجيه الدائم (301) على الموقعين القديمين.
> ③ التحقق من أن أي زائر يضغط الرابط القديم **يُنقل تلقائياً** إلى الموقع الجديد.

كل السكربتات جاهزة في هذا المجلد (`chrvvim-ai-hub/deploy/`). الوحيد المطلوب منك هو **تسجيل الدخول مرّة واحدة** (GitHub + Netlify).

---

## الحقيقة الأساسية قبل البدء

الموقعان القديمان الآن يعيدان `503` بسبب `usage_exceeded` (تجاوز الحصة).
في هذه الحالة **يرفض Edge الخاص بـ Netlify كل الطلبات قبل تنفيذ أي قاعدة توجيه**.
لذلك ترتيب الخطوات إلزامي: **أولاً حلّ الحصة، ثم النشر.**

---

## الخطوة 0 — تسجيل الدخول (مرّة واحدة)

### GitHub (اختر طريقة واحدة)

**أ) عبر GitHub CLI (أسهل):**
```powershell
gh auth login
```
اختر: `GitHub.com` → `HTTPS` → `Login with a web browser` → الصق الكود في المتصفح.

**ب) عبر رمز وصول (PAT):**
1. افتح https://github.com/settings/tokens → **Generate new token (classic)**.
2. اختر الصلاحية **`repo`** فقط، ثم أنشئ وانسخ الرمز.
3. احفظه في ملف:
   ```powershell
   New-Item -ItemType Directory -Force "$env:TEMP\opencode" | Out-Null
   Set-Content "$env:TEMP\opencode\gh_token.txt" "<الصق الرمز هنا>"
   ```

### Netlify

**أ) عبر Netlify CLI:**
```powershell
cmd /c "netlify login"
```

**ب) عبر رمز وصول (PAT):**
1. افتح Netlify → **User settings** → **Applications** → **Personal access tokens** → **New access token**.
2. أنشئ الرمز وانسخه، ثم:
   ```powershell
   New-Item -ItemType Directory -Force "$env:TEMP\opencode" | Out-Null
   Set-Content "$env:TEMP\opencode\netlify_token.txt" "<الصق الرمز هنا>"
   ```

> 🔐 الرموز تُقرأ من الملفات ولا تُطبع أبداً، ولا تُحفظ داخل `.git/config`.

---

## الخطوة 1 — حلّ الحصة على الموقعين القديمين (إلزامي)

اختر واحداً:

| الطريقة | متى | التكلفة |
|---|---|---|
| **ترقية الخطة إلى Personal** | فوراً | ~9$/شهر |
| **انتظار بداية دورة الفوترة** | عند التجديد | 0 |
| **تذكرة دعم Netlify** | حسب رد الدعم | 0 |

نصّ تذكرة الدعم جاهز بالإنجليزية في:
`chrvvim-ai-hub/deploy/netlify-support-ticket_EN.md`

**التحقّق من عودة المواقع:**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "chrvvim-ai-hub\deploy\verify-redirects.ps1"
```
يجب أن تختفي حالة `503`.

> ⚠️ **لا تحذف الموقعين.** الحذف لا يُحرّر الاسم ولا يمنحك الرابط في حساب آخر.

---

## الخطوة 2 — إنشاء مستودع GitHub ورفع الكود

**تجربة أولاً (بدون رفع):**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "chrvvim-ai-hub\deploy\create-and-push-repo.ps1" -DryRun
```

**التنفيذ الفعلي:**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "chrvvim-ai-hub\deploy\create-and-push-repo.ps1"
```

يعمل السكربت بالترتيب:
- إن كان `gh` مسجّلاً → ينشئ المستودع ويرفع (`gh repo create ... --push`).
- وإلا → يستخدم الرمز من `%TEMP%\opencode\gh_token.txt`.

**النتيجة:** `https://github.com/<حسابك>/chrvvim-ai-hub` (افتراضياً **خاص/private**، أضف `-Public` للعام).

---

## الخطوة 3 — نشر إعادة التوجيه 301 على الموقعين القديمين

**عرض المواقع المتاحة أولاً:**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "chrvvim-ai-hub\deploy\deploy-legacy-redirects.ps1" -ListSites
```

**تجربة بدون نشر:**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "chrvvim-ai-hub\deploy\deploy-legacy-redirects.ps1" -DryRun
```

**النشر الفعلي:**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "chrvvim-ai-hub\deploy\deploy-legacy-redirects.ps1"
```

القاعدة المنشورة على كل موقع قديم:
```text
/*  https://mr1mohamed1chraim.netlify.app/:splat  301!
```

- `301!` = دائم + إجباري (يعمل حتى لو وُجد ملف بنفس المسار).
- `:splat` = يحافظ على **المسار**، وNetlify تحافظ على **الاستعلام** تلقائياً.
- لا حلقة إعادة توجيه: المضيف الهدف مختلف عن المصدر.

> النشر يستبدل محتوى الموقع القديم بملفّي `_redirects` و`index.html` فقط — وهو المطلوب (الموقع كله سيحوّل). ورجوعاً ممكناً: Netlify تحتفظ بكل عمليات النشر السابقة (Deploys) ويمكنك الاسترجاع بنقرة.

---

## الخطوة 4 — التحقق النهائي

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "chrvvim-ai-hub\deploy\verify-redirects.ps1"
```

المتوقع:
```
--- https://chrvvim0k0l0a0k0.netlify.app
  /            first=301  location=https://mr1mohamed1chraim.netlify.app/
  /  followed  -> 200 https://mr1mohamed1chraim.netlify.app/
  RESULT: OK (301 -> primary, path/query preserved)
```

أو يدوياً:
```powershell
curl.exe -I https://chrvvim0k0l0a0k0.netlify.app/
curl.exe -I https://mrchraimfsjpachrvvim.netlify.app/
curl.exe -s -L -o NUL -w "%{http_code} %{url_effective}`n" "https://chrvvim0k0l0a0k0.netlify.app/أي/مسار?q=1"
```

---

## الخطوة 5 — الأمر الواحد (بعد تسجيل الدخول وحلّ الحصة)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "chrvvim-ai-hub\deploy\RUN_ALL.ps1"
```

ينفّذ الثلاث خطوات (رفع المستودع ← نشر التوجيهات ← التحقق) بالتتابع.

للتجربة الكاملة بدون أي تغيير:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "chrvvim-ai-hub\deploy\RUN_ALL.ps1" -DryRun
```

---

## الملفات في هذا المجلد

| الملف | الوظيفة |
|---|---|
| `create-and-push-repo.ps1` | ينشئ مستودع GitHub ويرفع الكود |
| `deploy-legacy-redirects.ps1` | ينشر `_redirects` (301) على الموقعين القديمين |
| `verify-redirects.ps1` | يتحقّق من 301 والحفاظ على المسار/الاستعلام |
| `RUN_ALL.ps1` | يشغّل الثلاثة بالتتابع |
| `netlify-support-ticket_EN.md` | نصّ تذكرة الدعم جاهز للإرسال |

---

## ملخّص الحالة

| البند | الحالة |
|---|---|
| الموقع الأساسي | ✅ يعمل (200) |
| الدمج/المحتوى | ✅ مكتمل (كل ملفات الموقع الثاني موجودة في الأساسي) |
| ملفات إعادة التوجيه 301 | ✅ جاهزة ومُختبَرة منطقياً |
| السكربتات (GitHub/Netlify/التحقق) | ✅ جاهزة هنا |
| رفع المستودع | ⏳ بانتظار تسجيل دخول GitHub |
| تفعيل التوجيه | ⏳ بانتظار تسجيل دخول Netlify + حلّ الحصة |
