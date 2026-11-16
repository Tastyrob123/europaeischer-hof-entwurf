const { chromium } = require('/Users/robertreff/Desktop/Website-Projekte/_Befund-Vorschlaege/node_modules/playwright');
const path = require('path');
(async () => { const [q, pdf, png] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.resolve(q), { waitUntil: 'load' }); await p.waitForFunction(() => document.documentElement.classList.contains('gesetzt'));
  const pr = await p.evaluate(() => window.PRUEF); console.log(JSON.stringify(pr));
  await p.pdf({ path: pdf, width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true });
  await b.close(); })();
