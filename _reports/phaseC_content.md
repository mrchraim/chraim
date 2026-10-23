# Phase C — محتوى جامعي (Content) — تقرير تقدم

**تاريخ:** 2026-10-23
**الحالة:** started (pilot)

---

## 1. ما تم
- **`/data/academic-sources.json`** — بنية بيانات موحّدة (source, published_date, verified_on, version, local_pdf, status).
- **FSJP Agadir pilot** — 3 documents verified (s3-private-groups, s3-private-timetable, s5-civil-timetable) من 17 PDF.
- **23 مؤسسة** مُعلّمة `pending_verification` (لا تخمين — master prompt §3.3).

## 2. ما لم يتم (requires research)
- Offre de formation / مسالك (إجازة + ماستر) لكل مؤسسة.
- شروط الولوج (conditions d'accès).
- آجال التسجيل (dates limites).
- نتائج الانتقاء (résultats de sélection).
- التقويم الجامعي (calendrier universitaire).
- دلائل الطالب (guides étudiant).
- استضافة PDFs محلياً في `/assets/docs/`.
- GitHub Action أسبوعي (فحص مصادر + PR).

## 3. الملاحظات / التحديات
- **بحث massive** (24 مؤسسة × 6-8 وثائق) — requires web research per institution from official sources only (uiz.ac.ma, المؤسسات، وزارة التعليم العالي، Tawjihi/Cursus/Taalim.ma).
- **لا تخمين أرقام/تواريخ** (master prompt §3.3) — كل وثيقة تحتاج `source` + `published_date` + `verified_on` + `version`.
- **حقوق نشر:** لخّص بصياغتك، استضف PDF فقط إن كانت وثيقة رسمية عمومية.

## 4. توصيات (Next Steps)
1. **Option A:** مواصلة research institution-by-institution (أبدأ بـ 5 مؤسسات priority: fsjes-agadir, ensa-agadir, esta-agadir, flsh-agadir, fmp-agadir) — report findings before bulk.
2. **Option B:** user provides official documents (PDFs/links) — I integrate metadata + host locally.
3. **Option C:** defer content update; focus on Phase D (design) first.

## 5. ما لم يُتحقق
- Lighthouse scores (needs run).
- a11y audit (needs run).
- git history secrets (needs gitleaks).

---

**Phase C (pilot) complete. Awaiting your direction on scope.**