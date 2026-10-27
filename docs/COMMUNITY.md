# CHRAIM — Community & Content (Phase 6)

**الحالة:** تصميم/توثيق فقط — لا تغييرات Supabase في هذا الـ commit.

## 1. الأهداف
- مساهمة الطلبة (امتحانات، ملخصات) مع مراجعة إدارية قبل النشر.
- تقييم (👍 فقط) بدون تعليقات علنية في البداية.
- صفحة «المستجدات» مع تصفية + RSS.
- لوحة إدارة: سجل تعديلات، أدوار (مشرف/محرر)، تصدير.

## 2. RLS (Supabase)
- `supabase/01_portal_schema.sql` و `02_platform_schema.sql` موجودان.
- **TODO:** مراجعة + اختبارات в `supabase/tests/` (مستخدم مجهول يقرأ فقط العام، لا يكتب خارج المسموح).
- لا service_role key في الواجهة (مفتاح publishable فقط).

## 3. المخاطر
- إشراف (moderation) يدوي → حمل.
- حقوق نشر (امتحانات) → إبلاغ/إزالة.

## 4. الخطوات التالية
1. إنشاء `supabase/tests/` (SQL tests).
2. RLS review checklist.
3. RSS endpoint.