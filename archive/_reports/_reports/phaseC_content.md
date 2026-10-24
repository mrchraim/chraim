# Phase C — محتوى جامعي (Content) — تقرير

**تاريخ:** 2026-10-23
**الحالة:** ✅ metadata verified for all 24 institutions

---

## 1. ما تم
- **`/data/academic-sources.json`** — بنية بيانات موحّدة (source, published_date, verified_on, version, local_pdf, status).
- **24 مؤسسة** — metadata verified من المصادر الرسمية (uiz.ac.ma) — dean/director, address, phone, fax, programs, students, faculty, opened, etc.
- `pending_verification` = [] (empty).

## 2. ما لم يتم (requires deeper research / documents)
- Offre de formation (PDFs) per institution — not yet downloaded/hosted.
- شروط الولوج (conditions d'accès) per institution.
- آجال التسجيل (dates limites).
- نتائج الانتقاء (résultats de sélection).
- التقويم الجامعي (calendrier universitaire).
- دلائل الطالب (guides étudiant).
- استضافة PDFs محلياً في `/assets/docs/`.
- GitHub Action أسبوعي (فحص مصادر + PR) — deferred (no .github/).

## 3. ملاحظات
- كل metadata مأخوذ من uiz.ac.ma (المصدر الرسمي). لا تخمين.
- `published_date` / `verified_on` / `version` per document — to be added when documents are hosted.
- حقوق نشر: لخّص بصياغتك، استضف PDF فقط إن كانت وثيقة رسمية عمومية (master prompt §3.3).

## 4. التوصيات (Next Steps)
1. **Phase D (تصميم):** design tokens، header/footer موحّد، خطوط محلية (Cairo/Tajawal)، a11y، Lighthouse.
2. **Phase E (redirects + testing):** clean URLs، sitemap/robots، link audit.
3. **Phase F (تسليم):** PR final + CI (Dependabot, secret scanning, lint).
4. **Content (deeper):** download/host official PDFs per institution (requires manual effort + storage).

---

**Phase C (metadata) complete.**