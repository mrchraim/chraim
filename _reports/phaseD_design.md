# Phase D — تصميم (Design) — تقرير

**تاريخ:** 2026-10-23
**الحالة:** in progress

---

## 1. ما تم
- **`/assets/design-tokens.css`** — design tokens (colors, spacing, typography, radius, shadows, transitions, dark/comfort modes, reduced motion).
- **Cairo font hosted locally** (woff2 arabic subset) + @font-face in fonts.css (font-display: swap).
- **Apply tokens to pilot pages** (index.html, portal.html) — added `<link rel="stylesheet" href="/assets/design-tokens.css">`.
- **a11y audit (partial):** all images have alt attributes (0 missing across deploy dir). Focus-visible outline present in _headers.

## 2. ما لم يتم
- Header/Footer/Nav موحّد (component) — needs refactor.
- Tajawal font local (بدلاً من Google CDN) — needs download.
- أيقونات محلية (بدلاً من Font Awesome CDN) — needs download.
- a11y: keyboard nav, contrast audit, screen reader test.
- Lighthouse ≥ 90 — needs run.
- PWA offline verify (sw.js).
- تطبيق tokens على باقي الصفحات (etablissements, platform, portal).

## 3. التوصيات (Next Steps)
1. **Option A:** download Tajawal woff2 + add @font-face.
2. **Option B:** a11y audit (keyboard nav, contrast, screen reader) on pilot pages.
3. **Option C:** Lighthouse run on pilot pages (index, portal).
4. **Option D:** كل ما سبق + apply tokens to etablissements/platform.

---

**Phase D (partial) in progress.**