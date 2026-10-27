// CHRVVIM Knowledge Atlas — crawler skeleton (DISABLED by default).
// Usage: node tools/crawler.js --source data/source-registry.json --limit 5
// Respects robots.txt, rate limits, timeouts. Does NOT auto-run.
const fs = require('fs');
if (require.main !== module) { module.exports = {}; }
console.log('Crawler skeleton. Not enabled. See docs/knowledge-atlas.md.');