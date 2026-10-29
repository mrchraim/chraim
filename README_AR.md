# حزمة الأتمتة والجودة لمشروع CHRAIM

هذه الحزمة تجهز بوابات جودة قابلة للتشغيل عبر GitHub Actions: البناء، اختبارات الوحدة، lint، تنسيق الكود، تدقيق الروابط المحلية، تدقيق الاعتماديات، فحص الأسرار، Lighthouse وaxe. كما تتضمن فحوصًا ثابتة لترويسات النشر ووثائق آمنة لمراجعة RLS وCloudflare Redirects.

## المحتويات
- `.github/workflows/quality-gates.yml` — CI على `main` وPull Requests.
- `.lighthouserc.json` — حدود Lighthouse.
- `tools/run-axe-audit.cjs` — فحص axe لثلاث صفحات.
- `tools/verify_deployment_config.py` — تحقق ثابت من `_headers` و`_redirects`.
- `supabase/README_RLS_APPLY_AR.md` — خطوات آمنة لتطبيق RLS.
- `cloudflare/REDIRECTS_AR.md` — إعداد redirects.

## عتبات الفشل
- Lighthouse (3 تشغيلات): Performance ≥ 80، Accessibility ≥ 90، Best Practices ≥ 90، SEO ≥ 90.
- axe: صفر مخالفات مكتشفة في الصفحات المحددة.
- npm audit: يفشل عند ثغرات High أو Critical.
- Gitleaks: يفشل عند اكتشاف أسرار.
- الروابط المحلية: يفشل عند وجود روابط محلية غير صالحة بحسب Linkinator.
- lint وformat وunit tests: مطلوبة؛ يفشل CI إن كانت أوامر `lint` أو `format:check` أو `test` غير موجودة.

## تركيبها
1. فك الضغط في جذر المستودع.
2. راجع تعارض الملفات قبل الاستبدال، خصوصًا أي workflow موجود وملف `_headers`.
3. تأكد من أن البناء ينتج `dist/index.html` وأن الصفحات `privacy.html` و`terms.html` موجودة في `dist/`. إذا اختلفت أسماء المسارات، عدّل `.lighthouserc.json` و`tools/run-axe-audit.cjs`.
4. تأكد من أن `tools/build-dist.py` هو أمر البناء الصحيح للمشروع. إن لم يكن، عدّل خطوة Build distribution إلى أمر البناء المعتمد.
5. تأكد أن `_headers` في جذر المصدر يتضمن على الأقل: `X-Content-Type-Options` و`Referrer-Policy` و`Permissions-Policy` و`Content-Security-Policy`.
6. افتح Pull Request وراجع كل نتائج Actions قبل الدمج.
7. في GitHub Settings → Branches، أنشئ Branch protection rule لـ `main` واجعل `Build, unit tests, lint, format` و`Links and security checks` و`Lighthouse and axe accessibility` فحوصًا مطلوبة. أسماء الفحوص يجب أن تطابق ما يظهر في Actions.

## حدود مهمة
- الحزمة لا تدّعي تطبيق migration في Supabase أو تعديل لوحة Cloudflare؛ هذان إجراءان يحتاجان صلاحية وبيانات مشروع ومراجعة بشرية.
- تدقيق RLS في الوثائق تشخيصي. لا تشغّل SQL تغييريًا على الإنتاج دون مراجعة migration واختباره في بيئة تجريبية.
- فحص الروابط يركّز على الروابط المحلية داخل `dist` لتقليل إخفاقات الشبكة الخارجية غير المستقرة.
- عتبات Lighthouse قد تحتاج ضبطًا بعد أول تشغيل واقعي؛ لا تخفّض العتبات لمجرد تجاوزها دون تحليل السبب.
- هذا إعداد مقترح يحتاج تشغيله في المستودع الفعلي. لم يتم push أو deploy بواسطة هذه الحزمة.
