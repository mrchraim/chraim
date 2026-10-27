# CHRVVIM Knowledge Atlas (scaffold)

**الحالة:** scaffold فقط — لا crawling فعلي (احترام robots/ToS).

## 1. ما تم
- `data/source-registry.json` — 10 مصادر (MEN, SGG, عدالة, ENSUP, ANEAQ, tarbiaa, UIZ, FSJP).
- `exports/*.json` — placeholders (arrays).
- `tools/crawler.js` — skeleton (disabled by default).

## 2. ما لم يُنجز (يتطلب وقت/مصادر/موافقة)
- crawling فعلي (يحتاج robots compliance, rate limits, review).
- full source inventory (آلاف الروابط).
- OCR/processing.
- لوحة إدارة (admin).
- scheduled jobs.

## 3. مبادئ
- لا حذف، لا fabrication.
- robots.txt respected.
- no SSRF, no login bypass.
- rate limiting + timeouts.

## 4. الخطوات التالية
1. إضافة sources (أكاديميات، جامعات، منصات).
2. تطبيق crawler (batch small) + review.
3. تصدير JSON/CSV.
4. UI search integration.