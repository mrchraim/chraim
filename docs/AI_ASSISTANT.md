# CHRAIM — مساعد ذكي (تصميم فقط — Phase 7)

**الحالة:** تصميم فقط — لا تنفيذ قبل موافقة صاحب المشروع.

## 1. الهدف
مساعد يجيب **فقط** من ملفات الموقع (RAG)، يذكر المصدر لكل جواب، ويقول «لا أعرف» عند غياب المعلومة، ولا يتنبأ بقرارات إدارية.

## 2. التصميم
- **RAG** over `assets/search-index.json`, `documents/`, `etablissements/`, `academic-offer.html`.
- **لا مفاتيح API في الواجهة.** يمر عبر Cloudflare Worker أو Supabase Edge Function.
- **تحديد معدل الطلبات** (rate limiting) على نقطة الكتابة.
- **إجابة مع source citation** (ملف + section).
- **"لا أعرف"** fallback.

## 3. التكلفة والمخاطر
- تكلفة LLM API (per query).
- خطر hallucination → mitigated by RAG + citation + refuse unknown.
- خصوصية: لا PII stored; logs anonymized.

## 4. القرارات المطلوبة (موافقة)
1. Provider (OpenAI/Anthropic/etc.).
2. Budget cap (USD/day).
3. Hosting (Cloudflare Worker vs Supabase Edge Function).
4. Scope (ar only vs ar/fr/en).

## 5. الخطوات (بعد الموافقة)
1. Prototype Worker with RAG.
2. Tests (accuracy, refusal).
3. Gradual rollout.