// geraete.js · Aufnahmen der drei Werkzeuge im Blender-Laptop für die Übersichtsseite (Oberchef 09.11.2026).
// Nimmt jedes Werkzeug bei 1440 × 932 (Fenster des Geräts, laptop.json) auf, mit gefüllter Ansicht, ohne Rundgang und Begrüßung,
// und setzt die Aufnahme hinter den durchsichtigen Bildschirm von Carlton-Europe Interlaken/_werkbank/geraet/laptop.png.
// Aufruf aus dem Repo: node "Europäischer Hof Heidelberg/uebersicht/geraete.js"   (Server 9461–9463 müssen laufen)
// Ergebnis: uebersicht/bild/laptop-<werkzeug>.webp (1600 px breit) und laptop-<werkzeug>-800.webp
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const pw = require('/opt/node-tools/node_modules/playwright');
const HIER = __dirname, REPO = path.resolve(HIER, '..', '..');
const GERAET = path.join(REPO, 'Carlton-Europe Interlaken', '_werkbank', 'geraet');
const L = JSON.parse(fs.readFileSync(path.join(GERAET, 'laptop.json'), 'utf8'));
const ZIELE = JSON.parse(fs.readFileSync(path.join(HIER, 'geraete.json'), 'utf8'));
(async () => {
  fs.mkdirSync(path.join(HIER, 'bild'), { recursive: true });
  const [W, H] = L.fenster, sx = L.schirm[2] * L.groesse[0], dpr = sx / W;
  const b = await pw.chromium.launch();
  for (const z of ZIELE) {
    const c = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
    await c.addInitScript((ls) => { try { for (const k in ls) localStorage.setItem(k, ls[k]); } catch (e) {} }, z.localStorage || {});
    const p = await c.newPage();
    await p.goto(z.url, { waitUntil: 'networkidle' }); await p.waitForTimeout(z.warte || 1500);
    for (const s of (z.klicks || [])) { await p.click(s, { timeout: 5000 }).catch(() => console.log('Klick fehlt: ' + s)); await p.waitForTimeout(900); }
    await p.addStyleTag({ content: '.rdg-karte,.rdg-licht,.rdg,[class*="rundgang"]{display:none!important}' });
    if (z.scroll) await p.evaluate(y => scrollTo(0, y), z.scroll);
    if (z.js) await p.evaluate(z.js).catch(e => console.log('js: ' + e.message));
    await p.waitForTimeout(1800);
    const roh = path.join(HIER, 'bild', '_roh-' + z.k + '.png');
    await p.screenshot({ path: roh });
    await c.close();
    execFileSync('python3', ['-c', `
import sys, json
from PIL import Image, ImageDraw
L=json.load(open(sys.argv[1])); gw,gh=L['groesse']; x,y,w,h=[round(v*(gw if i%2==0 else gh)) for i,v in enumerate(L['schirm'])]
lap=Image.open(sys.argv[2]).convert('RGBA'); s=Image.open(sys.argv[3]).convert('RGBA').resize((w,h),Image.LANCZOS)
m=Image.new('L',(w,h),0); ImageDraw.Draw(m).rounded_rectangle((0,0,w-1,h-1),radius=round(L['radius']*gw),fill=255)
bg=Image.new('RGBA',(gw,gh),(0,0,0,0)); bg.paste(s,(x,y),m); bg.alpha_composite(lap)
bb=bg.getbbox(); bg=bg.crop(bb)
bg.resize((1600,round(bg.height*1600/bg.width)),Image.LANCZOS).save(sys.argv[4]+'.webp','WEBP',quality=86)
bg.resize((800,round(bg.height*800/bg.width)),Image.LANCZOS).save(sys.argv[4]+'-800.webp','WEBP',quality=84)
print(sys.argv[4], bg.size)
`, path.join(GERAET, 'laptop.json'), path.join(GERAET, 'laptop.png'), roh, path.join(HIER, 'bild', 'laptop-' + z.k)], { stdio: 'inherit' });
    fs.unlinkSync(roh);
  }
  await b.close();
})();
