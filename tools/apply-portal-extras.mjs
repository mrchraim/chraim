/* One-shot: inject portal-extras (stats / lamp / download) into every CHRAIM page.
   Run with: node tools/apply-portal-extras.mjs */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSS_TAG = '<link rel="stylesheet" href="/assets/portal-extras.css">\n';
const JS_TAG = '<script src="/assets/portal-extras.js" defer></script>\n';

/* Error/system pages keep their own minimal layout — the block would break them. */
const SKIP = new Set(['404.html', 'offline.html']);

const SECTION = `<section class="pe-section" aria-labelledby="peTitle">
  <h2 id="peTitle">لوحة مؤشرات CHRAIM</h2>
  <div class="pe-stats">
    <div class="pe-stat">
      <p class="pe-title">مؤسسات</p>
      <p class="pe-value" lang="en" data-count-to="23">23</p>
      <p class="pe-change"><span aria-hidden="true">&#8599;</span> 24 اسم في الدليل</p>
    </div>
    <div class="pe-stat">
      <p class="pe-title">مسالك</p>
      <p class="pe-value" lang="en" data-count-to="241">241</p>
      <p class="pe-change"><span aria-hidden="true">&#8599;</span> 8 مدن جامعية</p>
    </div>
    <div class="pe-stat">
      <p class="pe-title">طلاب</p>
      <p class="pe-value" lang="en" data-count-to="147806">147,806</p>
      <p class="pe-change"><span aria-hidden="true">&#8599;</span> 1,592 أستاذ باحث</p>
    </div>
    <div class="pe-stat">
      <p class="pe-title">هياكل بحث</p>
      <p class="pe-value" lang="en" data-count-to="92">92</p>
      <p class="pe-change"><span aria-hidden="true">&#8599;</span> 2026-2027</p>
    </div>
  </div>
  <div class="pe-row">
    <div class="pe-lamp-wrap" id="peLampWrap">
      <div class="pe-lamp-glow" aria-hidden="true"></div>
      <button class="pe-lamp-btn" id="peLampBtn" type="button" aria-pressed="false" aria-label="تبديل الوضع الليلي">
        <svg class="pe-lamp-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 21h6"/><path d="M10 17h4"/>
          <path d="M12 3a6 6 0 0 0-4 10.5c-.6 1.3-.5 2.5 0 3.5h8c.5-1 .6-2.2 0-3.5A6 6 0 0 0 12 3z"/>
        </svg>
      </button>
    </div>
    <a class="pe-download" href="/institutions-database.csv" download>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      تحميل دليل المؤسسات
    </a>
  </div>
</section>
`;

function stripExisting(html) {
  return html.replace(/<section class="pe-section"[\s\S]*?<\/section>\s*/g, '');
}

/* Find the index just past the opening <main ...> tag, skipping leading
   comments / <noscript> blocks, and past a leading .hero section if present. */
function mainInsertPoint(html) {
  const open = html.match(/<main[^>]*>/i);
  if (!open) return -1;
  let i = open.index + open[0].length;

  // Skip leading whitespace, comments and <noscript> blocks.
  for (;;) {
    const rest = html.slice(i);
    const ws = rest.match(/^\s+/);
    if (ws) { i += ws[0].length; continue; }
    const comment = rest.match(/^<!--[\s\S]*?-->/);
    if (comment) { i += comment[0].length; continue; }
    const noscript = rest.match(/^<noscript[\s\S]*?<\/noscript>/i);
    if (noscript) { i += noscript[0].length; continue; }
    break;
  }

  // If main opens with a hero section, place the block after that hero.
  const hero = html.slice(i).match(/^<section class="hero"/i);
  if (hero) {
    let depth = 0, j = i;
    const re = /<\/?section\b[^>]*>/gi;
    re.lastIndex = i;
    let m;
    while ((m = re.exec(html))) {
      depth += m[0][1] === '/' ? -1 : 1;
      j = m.index + m[0].length;
      if (depth === 0) break;
    }
    return j;
  }
  return i;
}

const files = readdirSync(ROOT).filter((f) => f.endsWith('.html') && !SKIP.has(f)).sort();
let touched = 0;

for (const name of files) {
  const path = join(ROOT, name);
  const original = readFileSync(path, 'utf8');
  let html = stripExisting(original);

  // 1. Section markup
  let at = mainInsertPoint(html);
  if (at === -1) {
    const close = html.lastIndexOf('</body>');
    if (close === -1) { console.log(`  ! ${name}: no insertion point, skipped`); continue; }
    at = close;
  }
  html = html.slice(0, at) + '\n' + SECTION + html.slice(at);

  // 2. Stylesheet
  if (!html.includes('portal-extras.css')) {
    const head = html.lastIndexOf('</head>');
    if (head === -1) { console.log(`  ! ${name}: no </head>, skipped`); continue; }
    html = html.slice(0, head) + CSS_TAG + html.slice(head);
  }

  // 3. Script (after the markup so the DOM node already exists)
  if (!html.includes('portal-extras.js')) {
    const body = html.lastIndexOf('</body>');
    if (body === -1) { console.log(`  ! ${name}: no </body>, skipped`); continue; }
    html = html.slice(0, body) + JS_TAG + html.slice(body);
  }

  if (html !== original) {
    writeFileSync(path, html, 'utf8');
    touched++;
    console.log(`  + ${name}`);
  } else {
    console.log(`  = ${name} (already applied)`);
  }
}

console.log(`\n${touched}/${files.length} pages updated`);
