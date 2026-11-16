// Karten & Preislisten · Bedienungsprobe (Master 3 und 4.3): jede Funktion wirklich gedrückt, auf einer Wegwerf-Kopie der Daten (CARTE_DATEN) auf eigenem Port.
// node pruef/bedienung.js [port=9409] [breite=1440]   Vorher: CARTE_DATEN=/tmp/… python3 serve.py <port> (pruef/bedienung.sh macht beides)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PORT = process.argv[2] || '9409', W = +(process.argv[3] || 1440), B = `http://127.0.0.1:${PORT}/_werkzeuge/carte/`;
const erg = []; const ok = (n, b, x = '') => { erg.push([n, !!b, x]); console.log((b ? 'ok   ' : 'FEHL ') + n + (x ? ' · ' + x : '')); };
(async () => {
  const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: W, height: W < 600 ? 844 : 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('rundgang-ehh-carte', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const fehler = [];
  p.on('pageerror', e => fehler.push(e.message)); p.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
  p.on('response', r => { if (r.status() >= 400 && !/api\/pdf\?.*q=probe/.test(r.url())) fehler.push(r.status() + ' ' + r.url()); });
  p.on('dialog', d => d.accept());
  await p.goto(B + '#kurfuerstenstube'); await p.waitForSelector('#liste .r', { timeout: 20000 }); await p.waitForTimeout(1500);
  ok('Start: Kurfürstenstube mit Liste', await p.locator('#liste .r').count() > 20);
  ok('Rand: sechs Karten als Fotokacheln', await p.locator('#rand .kw').count() === 6);
  const handy = W < 900;
  const randAuf = async () => { if (handy) { await p.click('[data-wo-rand-knopf]'); await p.waitForTimeout(400); } };
  // Klick links → rechts blinkt
  const r0 = p.locator('#liste .r').filter({ hasText: 'Tatar vom irischen' }).first();
  await r0.locator('.r__t').click(); await p.waitForTimeout(700);
  ok('Klick links: Eintrag gewählt', await r0.evaluate(e => e.classList.contains('gewaehlt')));
  ok('Klick links: rechts blinkt', await p.frameLocator('#vf').locator('.blitz').count() > 0);
  if (!handy) {
    // Klick rechts → links
    await p.frameLocator('#vf').locator('k-t', { hasText: 'Cremesuppe von Pfälzer' }).first().click(); await p.waitForTimeout(900);
    ok('Klick rechts: Liste springt hin', await p.locator('#liste .r.gewaehlt').filter({ hasText: 'Cremesuppe' }).count() === 1);
  }
  // Bearbeiten: Preis ändern, Preisform
  await r0.locator('.r__t').click(); await p.waitForTimeout(300); await r0.locator('[data-akt="edit"]').click(); await p.waitForSelector('#fenster .feld');
  const preisFeld = p.locator('#fenster .feld').filter({ hasText: /^Preis/ }).locator('input').first();
  await preisFeld.fill('41'); await p.click('#f-ok'); await p.waitForTimeout(1500);
  const t = await p.frameLocator('#vf').locator('body').innerText();
  ok('Preis in Schreibweise der Karte («41» → «€ 41,-»)', /€ 41,-/.test(t));
  ok('Leiste: Entwurf mit Änderung', /Entwurf: 1/.test(await p.locator('#leiste').innerText()));
  ok('Quittung mit Rückgängig', await p.locator('#meldung .quit button', { hasText: 'Rückgängig' }).count() > 0);
  await p.reload(); await p.waitForSelector('#liste .r'); await p.waitForTimeout(1200);
  ok('Speichern → neu laden → noch da', /€ 41,-/.test(await p.frameLocator('#vf').locator('body').innerText()));
  // Vorher, nachher
  await p.click('[data-akt="vgl"]'); await p.waitForSelector('#fenster .vgl__z');
  ok('Vorher, nachher zeigt die Stelle', /41/.test(await p.locator('#fenster').innerText())); await p.click('#fenster [data-zu]');
  // Ausblenden, kopieren, verschieben
  const r1 = p.locator('#liste .r').filter({ hasText: 'Heimischer Feldsalat' }).first();
  await r1.locator('.r__t').click(); await r1.locator('[data-akt="aus"]').click(); await p.waitForTimeout(1200);
  ok('Ausblenden: nicht mehr in der Karte', !/Heimischer Feldsalat/.test(await p.frameLocator('#vf').locator('body').innerText()));
  const r1b = p.locator('#liste .r').filter({ hasText: 'Heimischer Feldsalat' }).first();
  await r1b.locator('.r__t').click(); await r1b.locator('[data-akt="aus"]').click(); await p.waitForTimeout(1200);
  ok('Wieder zeigen', /Heimischer Feldsalat/.test(await p.frameLocator('#vf').locator('body').innerText()));
  const r2 = p.locator('#liste .r').filter({ hasText: 'Cremesuppe von Pfälzer' }).first();
  await r2.locator('.r__t').click(); await r2.locator('[data-akt="hoch"]').click(); await p.waitForTimeout(1200);
  const txt2 = await p.frameLocator('#vf').locator('body').innerText();
  ok('Verschieben nach oben', txt2.indexOf('Cremesuppe') < txt2.indexOf('Essenz von Steinpilzen mit eigenen Agnolotti, geräucherter', txt2.indexOf('Suppen')));
  const r3 = p.locator('#liste .r').filter({ hasText: '130g Kalbsfiletstreifen' }).first();
  await r3.locator('.r__t').click(); await r3.locator('[data-akt="kopie"]').click(); await p.waitForSelector('#fenster .feld');
  await p.locator('#fenster .feld').filter({ hasText: /^Deutsch|^Name/ }).locator('input,textarea').first().fill('Probe Kopie Eintrag'); await p.click('#f-ok'); await p.waitForTimeout(1300);
  ok('Kopieren: neuer Eintrag im selben Format', /Probe Kopie Eintrag/.test(await p.frameLocator('#vf').locator('body').innerText()));
  // Neue Rubrik
  await p.locator('[data-akt="rubrik-neu"]').first().click(); await p.waitForSelector('#fenster .feld'); await p.click('#f-ok'); await p.waitForTimeout(1300);
  ok('Neue Rubrik', await p.locator('#liste .r--rubrik').filter({ hasText: 'Neue Rubrik' }).count() > 0);
  // Entfernen
  const r4 = p.locator('#liste .r').filter({ hasText: 'Probe Kopie Eintrag' }).first();
  await r4.locator('.r__t').click(); await r4.locator('[data-akt="weg"]').click(); await p.click('#ja'); await p.waitForTimeout(1200);
  ok('Entfernen', !/Probe Kopie Eintrag/.test(await p.frameLocator('#vf').locator('body').innerText()));
  // Rückgängig
  await p.locator('#meldung .quit button', { hasText: 'Rückgängig' }).last().click(); await p.waitForTimeout(1500);
  ok('Rückgängig holt den Eintrag zurück', /Probe Kopie Eintrag/.test(await p.frameLocator('#vf').locator('body').innerText()));
  // Ansicht Original
  await p.click('[data-ansicht="original"]'); await p.waitForTimeout(1200);
  ok('Ansicht Original: Seiten der PDF des Hauses', await p.locator('#orig img').count() === 6 && await p.locator('#orig img').first().evaluate(i => i.complete && i.naturalWidth > 500));
  await p.click('[data-ansicht="karte"]'); await p.waitForTimeout(600);
  // Probe-PDF
  const [tab] = await Promise.all([ctx.waitForEvent('page'), p.click('[data-akt="probe"]')]);
  await p.waitForSelector('#meldung .quit a', { timeout: 120000 });
  ok('Probe-PDF gedruckt', /Probe-PDF fertig/.test(await p.locator('#meldung').innerText())); await tab.close().catch(() => {});
  // PDF sichern
  await p.click('[data-akt="veroeffentlichen"]'); await p.waitForSelector('#v-ok'); await p.click('#v-ok');
  await p.waitForSelector('#fenster h2:has-text("Gesichert")', { timeout: 180000 });
  ok('PDF sichern: gedruckt, Wort für Wort geprüft, gesichert', /Wörter geprüft/.test(await p.locator('#fenster').innerText())); await p.click('#fenster [data-zu]');
  const pdf = await p.request.get(B + 'api/pdf?z=kurfuerstenstube&q=live'); ok('Gesicherte PDF abrufbar', pdf.status() === 200 && (await pdf.body()).length > 20000);
  // Frühere Fassungen, Ursprünglicher Stand
  await randAuf(); await p.click('#rand [data-akt="verlauf"]'); await p.waitForSelector('#fenster .verlauf__z');
  ok('Frühere Fassungen mit Ursprünglichem Stand', /Ursprünglicher Stand/.test(await p.locator('#fenster').innerText()) && /Gesicherte Fassung/.test(await p.locator('#fenster').innerText()));
  await p.locator('#fenster [data-d="grundstand"]').click(); await p.waitForTimeout(1800);
  ok('Ursprünglicher Stand in den Entwurf geholt', /€ 39,-/.test(await p.frameLocator('#vf').locator('body').innerText()));
  await p.click('[data-akt="verwerfen"]'); await p.click('#ja'); await p.waitForTimeout(1500);
  ok('Entwurf verwerfen', /PDF gesichert/.test(await p.locator('#leiste').innerText()));
  // Fortgeschritten
  await randAuf(); await p.click('#rand [data-m="frei"]'); await p.waitForTimeout(1500);
  ok('Fortgeschritten: Knopf «Daten der Karte»', await p.locator('#kopf [data-akt="daten"]').count() === 1);
  if (!handy) {
    const el = p.frameLocator('#vf').locator('[data-n]').filter({ hasText: 'Kalte Vorspeisen' }).first();
    await p.click('#rand [data-z="kurfuerstenstube"]').catch(() => {});
    await el.click(); await p.waitForTimeout(700);
    ok('Fortgeschritten: Element gewählt, Gestalten offen', await p.locator('#gst:not([hidden]) .gst-name').count() === 1);
    await p.locator('#gst [data-feld="c"][data-wert="rot"]').click(); await p.waitForTimeout(800);
    ok('Gestalten: Farbe gesetzt, wartet gelb', /Noch nicht gespeichert/.test(await p.locator('#leiste').innerText()));
    await p.keyboard.press('Control+z'); await p.waitForTimeout(600);
    ok('⌘Z nimmt zurück', !/Noch nicht gespeichert/.test(await p.locator('#leiste').innerText()));
    await p.locator('#gst [data-tu="zu"]').click().catch(() => {});
  }
  await p.click('#kopf [data-akt="daten"]'); await p.waitForSelector('#j-t');
  await p.fill('#j-t', '{kein json'); await p.click('#j-ok'); ok('Daten als Text: Ungültiges abgewiesen', /kein gültiges Format/.test(await p.locator('#j-f').innerText())); await p.click('#fenster [data-zu]');
  await randAuf(); await p.click('#rand [data-m="einfach"]'); await p.waitForTimeout(800);
  // Wechsel aller Karten
  for (const z of ['weinkarte', 'barkarte', 'zigarren', 'catering', 'kalender']) {
    await randAuf(); await p.click(`#rand [data-z="${z}"]`); await p.waitForTimeout(2200);
    const n = await p.locator('#liste .r').count(); const s = await p.locator('#v-zahl').innerText();
    ok(`Karte ${z}: Liste und Vorschau`, n > 0 && /Seite/i.test(s), `${n} Zeilen · ${s}`);
  }
  // Prüfseite, Export, Anleitung, Fehlermelder
  const pr = await ctx.newPage(); await pr.goto(B + 'pruefung.html'); await pr.waitForTimeout(2500);
  ok('Prüfseite läuft', /Kurfürstenstube|kurfuerstenstube/i.test(await pr.locator('#p-karten').innerText()));
  const ex = await p.request.get(B + 'api/export'); const exj = await ex.json(); ok('Export: alle Daten in einer Datei', Object.keys(exj.karten).length === 6 && !!exj.karten.kurfuerstenstube.ursprung);
  const an = await p.request.get(B + 'anleitung.html'); ok('Anleitung erreichbar', an.status() === 200);
  const fm = await p.request.post(B + 'api/fehler', { data: { text: 'Probe des Fehlermelders', seite: 'bedienung' } }); ok('Fehlermelder nimmt Meldung an', fm.status() === 200);
  const fremd = await p.request.post(B + 'api/entwurf', { data: {}, headers: { Origin: 'http://boese.example' } }); ok('Fremde Herkunft abgewiesen (403)', fremd.status() === 403);
  ok('Keine Fehler in Konsole und Netz', fehler.length === 0, fehler.slice(0, 4).join(' | '));
  await br.close();
  const n = erg.filter(x => x[1]).length; console.log(`\n${n} von ${erg.length} bestanden (${W} px)`); process.exit(n === erg.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
