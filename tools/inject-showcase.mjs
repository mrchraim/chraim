/* Inject the UI-kit showcase into portal.html (one shot). */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(ROOT, 'portal.html');
const markup = readFileSync(join(ROOT, 'tools', 'showcase-markup.html'), 'utf8').trim() + '\n';

let html = readFileSync(file, 'utf8');
const before = html;

/* 1. stylesheet right after portal-extras.css */
if (!html.includes('portal-showcase.css')) {
  const anchor = '<link rel="stylesheet" href="/assets/portal-extras.css">';
  if (!html.includes(anchor)) throw new Error('portal-extras.css link not found in head');
  html = html.replace(anchor, anchor + '\n<link rel="stylesheet" href="/assets/portal-showcase.css">');
}

/* 2. markup — single </main> close tag, insert right before it */
if (!html.includes('id="uiKit"')) {
  const close = html.lastIndexOf('</main>');
  if (close === -1) throw new Error('no </main> in portal.html');
  html = html.slice(0, close) + '\n' + markup + html.slice(close);
}

/* 3. scripts at the very end */
if (!html.includes('portal-showcase.js')) {
  const close = html.lastIndexOf('</body>');
  if (close === -1) throw new Error('no </body> in portal.html');
  html = html.slice(0, close) + '<script src="/assets/portal-showcase.js" defer></script>\n' + html.slice(close);
}

if (html === before) {
  console.log('already up to date');
} else {
  writeFileSync(file, html, 'utf8');
  console.log('injected: uiKit section + portal-showcase.css/js');
}

/* sanity checks */
const out = readFileSync(file, 'utf8');
for (const needle of ['portal-showcase.css', 'portal-showcase.js', 'id="uiKit"', 'pcLampBody', 'pcOtp', 'pcCourt']) {
  const n = out.split(needle).length - 1;
  console.log(`  ${needle}: ${n}`);
}
