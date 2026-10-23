# Phase D — تصميم (Design) — تقرير تقدم

**تاريخ:** 2026-10-23
**الحالة:** started (tokens)

---

## 1. ما تم
- **`/assets/design-tokens.css`** — design tokens (colors, spacing, typography, radius, shadows, transitions, dark/comfort modes, reduced motion). Source of truth for the design system.

## 2. ما لم يتم (requires broader refactor)
- **Header/Footer/Nav موحّد** (component) — إزالة التكرار عبر صفحات.
- **خطوط محلية:** Cairo/Tajawal (بدلاً من Google CDN) — needs download + @font-face.
- **أيقونات محلية** (بدلاً من Font Awesome CDN).
- **a11y audit** (WCAG 2.2 AA) — تباين، تنقل بلوحة مفاتيح، alt.
- **Lighthouse** ≥ 90 (4 محاور) — needs run.
- **PWA:** offline للصفحات الثابتة (sw.js verify).
- **تطبيق tokens** على صفحات (refactor inline styles → tokens).

## 3. ملاحظات
- Fonts currently hosted: IBM Plex Sans Arabic + Inter (local woff2). Alexandria/Cairo via Google CDN (in fsjp-portal). master prompt wants Cairo/Tajawal محلياً.
- Icons: Font Awesome CDN (fsjp-portal) + inline SVG. master prompt wants استضافة محلياً.

## 4. التوصيات (Next Steps)
1. **Option A:** apply tokens to index.html + portal.html (pilot) → measure Lighthouse.
2. **Option B:** download Cairo/Tajawal woff2 + add @font-face (local hosting).
3. **Option C:** a11y audit (keyboard nav, contrast, alt) on pilot pages.
4. **Option D:** كل ما سبق.

---

**Phase D (tokens) complete. Awaiting your direction.**