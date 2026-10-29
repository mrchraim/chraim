const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

(async () => {
  const browser = await chromium.launch({ headless: true });
  let failed = false;
  try {
    for (const route of ['/', '/privacy.html', '/terms.html']) {
      const page = await browser.newPage();
      const response = await page.goto(`http://127.0.0.1:8000${route}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      if (!response || response.status() >= 400) {
        console.error(`[axe] Route failed to load: ${route} (${response?.status() ?? 'no response'})`);
        failed = true;
        await page.close();
        continue;
      }
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      console.log(`\\n[axe] ${route}: ${results.violations.length} violation(s)`);
      for (const violation of results.violations) {
        console.error(`- ${violation.impact ?? 'unknown'}: ${violation.id} — ${violation.help}`);
        for (const node of violation.nodes.slice(0, 5)) {
          console.error(`  ${node.target.join(', ')} :: ${node.failureSummary?.replace(/\\s+/g, ' ').slice(0, 240)}`);
        }
      }
      if (results.violations.length > 0) failed = true;
      await page.close();
    }
  } catch (error) {
    console.error(error);
    failed = true;
  } finally {
    await browser.close();
  }
  if (failed) process.exit(1);
  console.log('\\n[axe] PASS: no detected violations on configured routes.');
})();
