// ==========================================================================
// توليد ملفات السيو (SEO) وحقن روابط الموقع المطلقة في web/index.html.
// يعمل محلياً أو كجزء من أمر البناء:   node scripts/seo.mjs
// لتغيير النطاق:  SITE_URL="https://example.netlify.app" node scripts/seo.mjs
// إن لم يُحدَّد SITE_URL يُستعمل URL / DEPLOY_PRIME_URL القادمان من Netlify،
// ثم القيمة الافتراضية أدناه.
// ==========================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WEB = path.join(ROOT, 'web');

const DEFAULT_SITE = 'https://mr1mohamed1chraim.netlify.app';
const SITE = String(
  process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || DEFAULT_SITE,
).replace(/\/+$/, '');

const NAME = 'دليل الطلبة أكادير — CHRVVIM CAMPUS';
const DESC = 'دليل الطلبة أكادير وبوابة الطالب بكلية العلوم القانونية والسياسية بأكادير (جامعة ابن زهر): دلائل الأفواج واستعمال الزمن والمواد والقاعات والوثائق الرسمية وحاسبة المعدل. موقع طلابي مستقل غير رسمي.';
const CONTACT = 'https://wa.me/212665366326';

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: NAME,
  alternateName: ['دليل الطلبة أكادير', 'بوابة الطالب CHRVVIM', 'CHRVVIM CAMPUS'],
  url: `${SITE}/`,
  description: DESC,
  inLanguage: ['ar', 'fr', 'en'],
  publisher: { '@type': 'Person', name: 'Mohamed Chraim', alternateName: 'CHRVVIM' },
};

// --- 1) حقن روابط الموقع المطلقة بين علامتي seo:urls (قابل لإعادة التشغيل) --
const urlsBlock = [
  '<!-- seo:urls:start -->',
  `<link rel="canonical" href="${SITE}/">`,
  `<meta property="og:url" content="${SITE}/">`,
  `<meta property="og:image" content="${SITE}/assets/img/founder.jpeg">`,
  `<meta property="og:image:alt" content="${NAME}">`,
  `<meta name="twitter:image" content="${SITE}/assets/img/founder.jpeg">`,
  `<meta name="twitter:image:alt" content="${NAME}">`,
  `<script type="application/ld+json">${JSON.stringify(JSON_LD)}</script>`,
  '<!-- seo:urls:end -->',
].join('\n');

const indexPath = path.join(WEB, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const marker = /<!-- seo:urls:start -->[\s\S]*?<!-- seo:urls:end -->/;
if (!marker.test(html)) {
  console.error('seo.mjs: لم أجد علامتي seo:urls في web/index.html');
  process.exit(1);
}
fs.writeFileSync(indexPath, html.replace(marker, urlsBlock), 'utf8');

// --- 2) robots.txt ---------------------------------------------------------
fs.writeFileSync(path.join(WEB, 'robots.txt'), [
  'User-agent: *',
  'Allow: /',
  'Disallow: /admin',
  'Disallow: /admin/',
  '',
  `Sitemap: ${SITE}/sitemap.xml`,
  '',
].join('\n'), 'utf8');

// --- 3) sitemap.xml --------------------------------------------------------
fs.writeFileSync(path.join(WEB, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`, 'utf8');

// --- 4) security.txt (RFC 9116) في الجذر وفي /.well-known/ ------------------
const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
const securityTxt = [
  `Contact: ${CONTACT}`,
  `Expires: ${expires}`,
  'Preferred-Languages: ar, fr, en',
  `Canonical: ${SITE}/.well-known/security.txt`,
  '',
].join('\n');
fs.writeFileSync(path.join(WEB, 'security.txt'), securityTxt, 'utf8');
fs.mkdirSync(path.join(WEB, '.well-known'), { recursive: true });
fs.writeFileSync(path.join(WEB, '.well-known', 'security.txt'), securityTxt, 'utf8');

console.log(`seo.mjs: SITE_URL = ${SITE}`);
console.log('seo.mjs: تم تحديث index.html · robots.txt · sitemap.xml · security.txt');
