# CHRAIM — نظام التصميم (Design System)

**الإصدار:** 0.1 (Phase 3 scaffolding)  
**الملفات:** `index.html`, `portal.html`, `etablissements/style.css`

## 1. الألوان (متغيرات CSS)

### Primary (Navy/Gold)

| Token                | Light                 | Dark                  | Usage        |
| -------------------- | --------------------- | --------------------- | ------------ |
| `--blue` / `--blue2` | `#1F2937` / `#374151` | `#14243A` / `#2b4a7d` | خلفيات، رؤوس |
| `--gold` / `--gold2` | `#B89B5E` / `#E8D9B8` | `#C6A568` / `#EAD9A8` | تمييز، CTA   |
| `--bg`               | `#F8F6F2`             | `#080d18`             | خلفية الصفحة |
| `--card`             | `#FFFFFF`             | `#0F1626`             | بطاقات       |
| `--ink`              | `#1F2937`             | `#F7F5F0`             | نص           |
| `--muted`            | `#6B7280`             | `#9aa3b5`             | نص ثانوي     |
| `--line`             | `#E5E1D8`             | `#26304e`             | حدود         |
| `--ok`               | `#2D7A5F`             | —                     | نجاح         |
| `--warn`             | `#A4620A`             | `#fbbf6a`             | تحذير        |
| `--error`            | `#C1121F`             | —                     | خطأ          |

### Gender variants

`data-gender="male|female"` يبدّل `--blue/--gold/--bg` (انظر portal.html).

### Dark mode

`data-theme="dark"` أو `prefers-color-scheme: dark`.

## 2. الطباعة

- **UI:** `IBM Plex Sans Arabic`, `Inter`, system-ui (portal) / `Cairo` (index).
- **Serif (V3):** `Iowan Old Style`, `Palatino`, Georgia, `Noto Naskh Arabic`.
- **Scale:** `clamp()` للعناوين (`1.6rem`–`3.4rem`).
- **Line-height:** 1.65 (body), 1.9 (text areas).

## 3. المسافات

- Base: `4px` increments (Tailwind default).
- Card padding: `12px`–`22px`.
- Section gaps: `8px`–`18px`.

## 4. المكوّنات (Components)

| Component    | Class                         | States                         |
| ------------ | ----------------------------- | ------------------------------ |
| Button       | `.btn`, `.btn.sec`            | hover, disabled, focus-visible |
| Card         | `.card`                       | hover, dark                    |
| Input/Select | `input, select`               | focus (gold outline)           |
| Tab          | `.tab`, `.tab.on`             | —                              |
| Chip         | `.chip`, `.chip.b`, `.chip.g` | —                              |
| Result       | `.result`, `.result .big`     | —                              |
| Session      | `.sess`, `.sess.mark`         | today                          |
| Document     | `.doc`                        | hover                          |
| Modal        | `.overlay`, `.modal`          | on                             |
| Toast        | `.toast`                      | —                              |
| Skeleton     | `.sk`                         | —                              |
| Empty        | `.empty`                      | —                              |
| Warnbox      | `.warnbox`                    | —                              |

## 5. الحركات (Motion)

- Duration: `150ms`–`250ms` (transitions), `0.25s`–`0.55s` (animations).
- Respect `prefers-reduced-motion: reduce` → `animation:none; transition:none`.
- Respect `prefers-reduced-transparency: reduce`.

## 6. إتاحة (A11y)

- Focus-visible outline: `2px solid var(--gold)`, offset 2px.
- Touch targets ≥ 44px.
- Contrast: WCAG 2.2 AA (à vérifier).
- RTL/LTR via `dir` attribute.

## 7. الأيقونات

- Lucide 0.454.0 (local: `assets/lib/lucide-0.454.0.min.js`).
- SVG sprite (planned Phase 4).

## 8. الأصول (Assets)

- Fonts: Cairo (index), IBM Plex Sans Arabic (portal) — local woff2.
- Images: WebP/AVIF (planned), lazy-loading.

---

**ملاحظة:** هذا مستند أولي (scaffolding). سيُحدَّث في Phase 4+.
