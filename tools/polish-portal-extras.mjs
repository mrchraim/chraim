/* One-shot: remove the lamp toggle from pages with no theme engine.
   nexus.html, ai-assistant.html, myuiz-guide.html render hardcoded palettes
   and cannot switch themes — a non-working toggle is not shown. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NO_THEME = ['nexus.html', 'ai-assistant.html', 'myuiz-guide.html'];

const LAMP_RE = /\s*<div class="pe-lamp-wrap"[\s\S]*?<\/button>\s*<\/div>/;

for (const name of NO_THEME) {
  const path = join(ROOT, name);
  const before = readFileSync(path, 'utf8');
  const after = before.replace(LAMP_RE, '');
  if (before === after) {
    console.log(`= ${name}: nothing to remove`);
    continue;
  }
  writeFileSync(path, after, 'utf8');
  console.log(`- ${name}: lamp removed (${before.length - after.length} bytes)`);
}
