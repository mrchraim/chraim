# CHRVVIM Campus — الحالة النهائية (2026-11-16)

**الملخص:** المشروع مستقر ومبني (✅ 48/48 tests, ✅ 1324 link, ✅ secret-scan PASS, ✅ كل workflows خضراء). كل ما يُسلم كوكيل تم في هذا السبرينت. المتبقي يحتاج قرارًا من المالك.

---

## ما أُنجز (قابل للتحقق)

| المجال                                               | الحالة | الدليل                                                 |
| ---------------------------------------------------- | ------ | ------------------------------------------------------ |
| 2FA (aal2) على إدارتيَيْ portal و platform             | ✅     | migrations مطبّقة 2026-11-15، anon RPC → `false`        |
| تشفير بيانات `auth` في الـ backups                   | ✅     | run `43752923040` (portal + platform)                  |
| مراقبة وصول المصادر الرسمية                          | ✅     | `tools/verify-official-sources.py` + workflow أسبوعي   |
| إخفاء الإعلانات المنتهية من الواجهة                  | ✅     | `ann-live` filter + `announcements-live.test.mjs`      |
| تصحيح الموقع الرسمي لـ FEGA/FSJPA                    | ✅     | الصفحات في `/etablissements/` — تيزنيت، مع مصدر البلاغ |
| IDENTITY migration المتعلقة بـ FEGA/FSJPA (city fix) | ✅     | commit `5e2bb5f`؛ عنوان العرض للدكتور ما بحسمهاش       |
| حذف الكود الميت                                      | ✅     | `legal-encyclopedia-data.js` (الجذر)                   |
| المرادفات المستقرة                                   | ✅     | `assets/search-index.json` 55 مدخلاً                    |
| Backup restore drill (locally)                       | ✅     | `openssl enc -d` + `gzip -t` passed                    |
| npm audit                                            | ✅     | 0 vulnerabilities (dev + prod)                         |

**المنشور على الإنتاج:** كل شيء أخضر — Deploy/Live routes 200 @ HEAD `d172b62`.

## المطلوب من المالك (لا يمكن تنفيذه عن بُعد)

1. **TOTP**: تسجيل الدخول وتفعيل 2FA في `admin.html` (portal) و `platform/login.html` (منصة) — جلسة حاليًا aal1؛ بعد تفعيلها تفتح كامل الميزات.
2. **CNDP**: تعبئة F-211 + F-118 (`docs/CNDP_DECLARATION.md`) + إمضاء + إرسال لـ `https://www.cndp.ma` (أو البريد المذكور فيها) — بتأمين محامي.
3. **passphrase الباكاب**: انقل `C:\Users\Mohamed Chraim\Documents\CHRAIM_BACKUP_PASSPHRASE.txt` لـ password manager + احذف الملف.
4. **التوسع الرسمي** (إن رغبت): المراجعة التحريرية لـ FEGA/FSJPA — الموقعان هما بوابتان على `uiz.ac.ma` — بالتزامن مع ما ينشره الموقع الرسمي للجامعة.

## ملاحظة صريحة

لا طُبّق أي شي من «Firebase admin» / `delete-users` / البرامج التالية على زبون حقيقي — هذي لم تُدمج في CHRAIM (البنى فيه Supabase)، ماشي Blank-slate هكذا. لو أردت بديل/سياسة إمحامو على بيانات معينة بـ precondition، نعطينا قائمة @test قبل أي حذف.

---

## روابط التشغيل (كلها خضراء)

- المستودع: https://github.com/mrchraim/chraim
- الموقع الحي: https://chraim.pages.dev/
- workflow run الأخير: Deploy / CI / Quality Gates — كلها ✅ على `d172b62`
- sitemap.xml مطابق لـ git `HEAD` (Git `Verify production` يتحقق)
