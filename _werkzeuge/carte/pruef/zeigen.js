// Karten & Preislisten · zwei saubere Aufnahmen für die Übersicht: pruefung/zeigen-1440.png (1440×900) und zeigen-390.png (390×844), deviceScaleFactor 2.
// Gefüllte Ansicht: Kurfürstenstube, Liste links und Karte rechts (am Handy: Startbild und Beginn der Liste). Ohne Rundgang.  node pruef/zeigen.js [port=9461]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const path = require('path'), PORT = process.argv[2] || '9461', AUS = path.join(__dirname, '..', 'pruefung');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await c.addInitScript(() => { try { localStorage.setItem('rundgang-ehh-carte', '1'); localStorage.setItem('lc-modus', 'einfach'); } catch (e) {} });
    const p = await c.newPage();
    await p.goto(`http://127.0.0.1:${PORT}/_werkzeuge/carte/#kurfuerstenstube`); await p.waitForSelector('#liste .r'); await p.waitForTimeout(3000);
    if (w > 900) {   // bis zur Arbeitsfläche rollen: links die Liste mit Bildern, rechts die Karte wie gedruckt
      await p.evaluate(() => { const a = document.querySelector('#arbeit'); window.scrollTo(0, a.getBoundingClientRect().top + scrollY - 92); });
      await p.waitForTimeout(800);
      await p.waitForTimeout(1200);
    }
    await p.screenshot({ path: path.join(AUS, `zeigen-${w}.png`) });
    await c.close();
  }
  await b.close(); console.log('zeigen-1440.png, zeigen-390.png');
})();
