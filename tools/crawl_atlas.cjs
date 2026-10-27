// CHRVVIM Knowledge Atlas — crawl runner (MANUAL, not scheduled).
// Usage: node tools/crawl_atlas.js --limit 3 --delay 1000
// Respects robots.txt, rate limits, timeouts. No auto-run on build.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const limitIdx = args.indexOf('--limit');
const delayIdx = args.indexOf('--delay');
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 3;
const DELAY = delayIdx >= 0 ? parseInt(args[delayIdx + 1], 10) : 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
function writeJson(p, d) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(d, null, 2)); }

async function fetchText(url, timeout = 15000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'CHRVVIM-Knowledge-Atlas/0.1 (+https://github.com/mrchraim/chraim)' } });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch (e) { clearTimeout(t); return null; }
}

async function robotsAllows(origin, pathToCheck) {
  const txt = await fetchText(origin + '/robots.txt');
  if (!txt) return true; // no robots.txt -> allow (conservative)
  // very simple check: Disallow lines
  const lines = txt.split(/\r?\n/);
  let disallow = false;
  for (const line of lines) {
    const m = line.match(/^Disallow:\s*(.*)$/i);
    if (m) {
      const rule = m[1].trim();
      if (rule === '' ) continue;
      if (pathToCheck.startsWith(rule)) { disallow = true; break; }
    }
  }
  return !disallow;
}

function extractLinks(base, html) {
  const out = [];
  const re = /href=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1], base);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
      out.push(u.href);
    } catch (e) {}
  }
  return [...new Set(out)];
}

(async () => {
  const registry = readJson('data/source-registry.json') || [];
  const sources = registry.filter((s) => s.allowed_crawl).slice(0, LIMIT);
  const seen = new Set();
  const results = [];
  const logs = [];
  for (const src of sources) {
    const origin = new URL(src.url).origin;
    const allowed = await robotsAllows(origin, new URL(src.url).pathname);
    if (!allowed) {
      logs.push({ source_id: src.id, status: 'robots_blocked', discovered_count: 0 });
      console.log(src.id, 'robots blocked');
      continue;
    }
    const html = await fetchText(src.url);
    if (!html) {
      logs.push({ source_id: src.id, status: 'fetch_failed', discovered_count: 0 });
      console.log(src.id, 'fetch failed');
      continue;
    }
    const links = extractLinks(src.url, html).slice(0, 50);
    let added = 0;
    for (const link of links) {
      if (seen.has(link)) continue;
      seen.add(link);
      results.push({ title: '', url: link, source_id: src.id, discovered_at: new Date().toISOString(), status: 'unverified' });
      added++;
    }
    logs.push({ source_id: src.id, status: 'ok', discovered_count: added });
    console.log(src.id, '->', added);
    await sleep(DELAY);
  }
  writeJson('exports/morocco-knowledge-links.json', results);
  writeJson('exports/crawl_logs.json', logs);
  console.log('total', results.length);
})();