/* Drucksachen-Studio · Satz: Formate, Marke laden, eine Seite als DOM setzen, Text messen.
   Alle Masse in Millimetern. Ursprung (0,0) = obere linke Ecke des Endformats, der Beschnitt (3 mm) liegt davor. */
(function () {
  const DS = window.DS = window.DS || {};
  DS.B = 3;          // Beschnitt
  DS.SICHER = 4;     // Abstand vom Rand, in dem Text sicher bleibt

  /* Tiefe der Kopfzeile wie ein gedruckter Schriftzug (Robert 29.10.2026: „ist das unscharf …?“): scharfe Buchstabenkante, darunter ein harter, leicht
     versetzter Schatten in einem dunkleren Ton der Schriftfarbe, ohne Weichzeichner. Leuchten nur auf dunklem Grund (Bühne, Nacht) und nur außerhalb der Kante:
     ein weiter, schwacher Hof, den die Schrift darüber vollständig deckt. Gilt gleich für Bildschirm (satz.js), PNG und PDF (druck.js). */
  DS.kopfTiefe = (hex, art, gr) => {
    const h = String(hex || '#d6262b').replace('#', ''), c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0);
    const mix = (z, a) => '#' + c.map((v, i) => Math.round(v + (z[i] - v) * a).toString(16).padStart(2, '0')).join('');
    return { dx: +(gr * .022).toFixed(3), dy: +(gr * .04).toFixed(3), hart: mix([20, 6, 6], .55), glow: art === 'leuchten' ? mix([255, 214, 196], .35) + '6b' : null, blur: +(gr * .5).toFixed(3) };
  };
  DS.FORMATE = {
    a6h: { name: 'A6 hoch', b: 105, h: 148, art: 'Karte, kleiner Flyer, Tischaufsteller' },
    a6q: { name: 'A6 quer', b: 148, h: 105, art: 'Postkarte, Ansichtskarte' },
    a5h: { name: 'A5 hoch', b: 148, h: 210, art: 'Flyer, Menükarte' },
    a5q: { name: 'A5 quer', b: 210, h: 148, art: 'Einladung, Flyer quer' },
    a4h: { name: 'A4 hoch', b: 210, h: 297, art: 'Aushang, Speisekarte, Infoblatt' },
    a3h: { name: 'A3 hoch', b: 297, h: 420, art: 'Großer Aushang' },
    dlh: { name: 'DL hoch', b: 99, h: 210, art: 'Menükarte schmal, Programm, Flyer lang' },
    dlq: { name: 'DL quer', b: 210, h: 99, art: 'Gutschein, Ticket' },
    q148: { name: 'Quadrat', b: 148, h: 148, art: 'Grusskarte, Einladung' },
    q210: { name: 'Quadrat 210', b: 210, h: 210, art: 'Speisekarte wie die Kurfürstenstube' },
    b170: { name: 'Broschürenformat', b: 170, h: 280, art: 'Seite wie die Image- und Hochzeitsbroschüre' },
    a7q: { name: 'A7 quer', b: 105, h: 74, art: 'Tischkarte, Platzkarte, kleine Hinweiskarte' },
  };

  /* ---------- Marke ---------- */
  DS.ladeMarke = async function (key) {
    const basis = 'haeuser/' + key + '/';
    /* Start in einem Zug (30.10.2026, Ziel erster Knopf gedrosselt unter 3 s): Markenbuch und Druckfassungen gleichzeitig mit marke.json holen,
       die Bildschirmschriften laden, sobald marke.json sie nennt; vorher lief alles nacheinander */
    const livreP = DS.ladeLivre(), druckP = fetch(basis + 'druck.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
    const M = await (await fetch(basis + 'marke.json')).json();
    M.basis = basis;
    M.eigeneMini = new Set(M.bilder.map(b => b.key));
    /* Die Kopfzeile (Anton) steht immer in Versalien: ihr woff2 trägt nur die Grossbuchstaben (bau.py), alles andere kommt aus der TTF, die erst geladen wird,
       wenn ein solches Zeichen vorkommt (30.10.2026, Start gedrosselt) */
    const GROSS = 'U+20-60,U+7B-7E,U+A0,U+AB,U+B7,U+BB,U+C0-DE,U+1E9E,U+2010-2026,U+20AC', REST = 'U+0-1F,U+61-7A,U+7F-9F,U+A1-AA,U+AC-B6,U+B8-BA,U+BC-BF,U+DF-1E9D,U+1E9F-200F,U+2027-20AB,U+20AD-10FFFF';   // REST = alles außer GROSS: Chromium lädt sonst beide
    const css = Object.entries(M.schriften).map(([rolle, s]) => rolle === 'kopf'
      ? `@font-face{font-family:'DS-${rolle}';src:url('${basis}schriften/${s.datei}') format('truetype');unicode-range:${REST};font-display:block}`
        + `@font-face{font-family:'DS-${rolle}';src:url('${basis}schriften/${s.datei.replace(/\.ttf$/, '.woff2')}') format('woff2');unicode-range:${GROSS};font-display:block}`
      : `@font-face{font-family:'DS-${rolle}';src:url('${basis}schriften/${s.datei.replace(/\.ttf$/, '.woff2')}') format('woff2'),url('${basis}schriften/${s.datei}') format('truetype');font-display:block}`).join('\n');   // am Bildschirm woff2 (Teilmenge Latein), das PDF nimmt die TTF (29.10.)
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const schriftenP = Promise.all(Object.keys(M.schriften).map(r => document.fonts.load(`20px 'DS-${r}'`, r === 'kopf' ? 'AÄ0123' : 'AaÄäß€„“0123')));
    const L = await livreP;
    if (L) {   // Le Livre ist die eine Quelle: welche Fotos, Titel, Bereich, Saison, Format, Herkunft, KI
      M.livre = L;
      /* Le Livre nennt die Größe des Originals; gedruckt wird die Datei unter dem Weg „fl“ des Markenbuchs, deren Mass in marke.json steht.
         Mit dem Original rechnete die Druckprüfung zu viele dpi (haus-winter: 186 statt 88 dpi auf A3). */
      const px = Object.fromEntries(M.bilder.map(b => [b.key, b]));
      const sonderweg = false;   // Sonderweg eines anderen Markenbuchs, hier nicht gebraucht
      if (sonderweg) {   // Das Markenbuch des Wild Side (Chat „wildside-livre“): die Bereiche nennt es selbst in livre.json; die Dateien liegen dort, wohin „fl“ und „fs“ zeigen
      }
      M.bilder = L.fotos.filter(f => !(M.raus || []).includes(f.k) && f.art !== 'ki').map(f => ({ key: f.k, alt: (f.t && (f.t.de || Object.values(f.t)[0])) || f.k, w: (px[f.k] || f).w, h: (px[f.k] || f).h, gruppe: DS.LIVRE_TEXT.b[f.b] || 'Haus',
        bereich: f.b, saison: f.s, format: f.f, herkunft: f.art, ki: !!f.ki, quelle: f.q, fl: f.fl, fs: f.fs }));
      /* Fotos, die nur diese Kopie kennt (Gastbetriebe im Haus, Hunde, Packages …), bleiben als „Weitere Fotos“ dabei */
      const da = new Set(M.bilder.map(b => b.key)), mehr = Object.values(px).filter(b => !da.has(b.key) && !(M.raus || []).includes(b.key));
      if (sonderweg && mehr.length) { DS.LIVRE_TEXT.b = Object.assign({ motive: 'Plakat-Motive' }, DS.LIVRE_TEXT.b, { weitere: 'Weitere Fotos' }); M.bilder = M.bilder.concat(mehr.filter(b => b.gruppe !== 'Plakat-Motive').map(b => Object.assign({}, b, { gruppe: 'Weitere Fotos', bereich: 'weitere', herkunft: 'haus', ki: false })), mehr.filter(b => b.gruppe === 'Plakat-Motive').map(b => Object.assign({}, b, { bereich: 'motive', herkunft: 'haus', ki: false })));   /* Robert 29.10.: Fotos zuerst, Plakate nur unter „Plakat-Motive“ */ }
    }
    M.bildIndex = Object.fromEntries(M.bilder.map(b => [b.key, b]));
    if (!L) {   // Europäischer Hof: „Logo & Farben“ ohne Lieferung des Markenbuchs, aus marke.json (Farben der Drucksachen, Original-Logos, Wappen)
      const gesehen = new Set(), F = M.farben || {}, N = M.farbnamen || {};
      M.livreErsatz = { haus: M.voll, fotos: [],
        farben: Object.keys(F).filter(k => !['pink', 'akzent'].includes(k) && !gesehen.has(F[k].toLowerCase()) && gesehen.add(F[k].toLowerCase())).map(k => ({ h: F[k], n: N[k] || k, r: '' })),
        dateien: [{ k: 'zeichen', var: [{ k: 'tinte', grund: 'hell', farbe: F.tanne, dateien: ['wappen-hell.png'] }, { k: 'weiss', grund: 'dunkel', farbe: '#ffffff', dateien: ['wappen-hell.png'] }] },
          { k: 'logo', var: [{ k: 'hell', grund: 'hell', dateien: ['logo_black_bottom.png'] }, { k: 'dunkel', grund: 'dunkel', dateien: ['logo_white_bottom.png'] }] }] };
    }
    /* Druckfassungen (_qa/druckfassungen.py): dasselbe Foto in mehr Pixeln, nur für PDF/Bild und Druckprüfung, nicht für den Bildschirm */
    const druck = await druckP;
    for (const [k, [w, h]] of Object.entries(druck)) if (M.bildIndex[k]) M.bildIndex[k].druck = { w, h, url: basis + 'druck/' + k + '.jpg' };
    if (L) DS.livreDateien(M).forEach(d => { M.bildIndex[d.key] = d; });
    (M.logos || []).forEach(d => { M.bildIndex[d.key] = { key: d.key, alt: d.alt, w: d.w, h: d.h, url: d.datei, miniUrl: d.datei, datei: true, art: 'logo', grund: d.grund }; });   // das ganze Logo nur als Original-PNG   // Logo und Wortmarke als Bild aufs Blatt (nicht in den Fotolisten)
    await schriftenP;
    DS.M = M;
    return M;
  };

  DS.farbe = (M, f) => (M.farben[f] || f || '#000');
  /* Fotos: aus Le Livre (/assets/img/<key>-l.webp, 2000 px) unter derselben Adresse; kleine Vorschauen aus dem eigenen 520-px-Satz, weil Le Livre
     nur 900 px anbietet (vierfaches Gewicht je Vorschau). Ohne Le Livre alles aus der eigenen Kopie. */
  DS.bildUrl = (M, key, mini) => M.bildIndex && M.bildIndex[key] && M.bildIndex[key].datei ? (mini ? M.bildIndex[key].miniUrl : M.bildIndex[key].url)
    : (M.bildIndex && M.bildIndex[key] && M.bildIndex[key].vorschau) ? M.basis + M.bildIndex[key].vorschau
    : /^eigen-/.test(key) ? M.basis + (mini ? 'mini/' : 'bilder/') + key + '.webp'
    : '/assets/bild/' + key + (mini ? '-480' : '-1200') + '.webp';   // Europäischer Hof: alle Fotos liegen einmal in _werkzeuge/assets/bild/ (480 und 1200 px), Druckfassungen in druck/

  /* ---------- Le Livre: Markenbuch des Hauses (Fotos, Farben, Dateien) ---------- */
  DS.LIVRE_TEXT = {
    b: { zimmer: 'Zimmer', restaurants: 'Restaurants', bar: 'Bar', spa: 'Spa', saal: 'Saal', haus: 'Haus', region: 'Region' },
    s: { jahr: 'Ganzjährig', sommer: 'Sommer', winter: 'Winter' },
    f: { hoch: 'Hochformat', quer: 'Querformat', quadrat: 'Quadrat' },
    h: { haus: 'Fotos des Hauses', frei: 'Frei lizenziert', ki: 'Mit KI erzeugt' },
    ki: 'Dieses Bild ist mit KI erzeugt und zeigt kein echtes Gericht oder Getränk des Hauses. Für Werbung nur mit diesem Hinweis oder nach einem echten Foto.',
  };
  // Das Markenbuch liegt neben der Plakatwerkstatt: lokal /_werkzeuge/livre/, online /werkzeuge/livre/. Auf dem Prüfserver (:9287) liest die Plakatwerkstatt
  // dieselben Dateien unter demselben Weg; die Seite des Markenbuchs öffnet dann auf dessen eigenem Server.
  // Unter drucksachen-studio.vercel.app steht L’Imprimerie allein, ohne Le Livre daneben: dort keine Abfrage (gab bei jedem Öffnen eine 404-Meldung,
  // Aussen-Prüfung 14.10.2026), und „Le Livre öffnen“ führt zum Markenbuch unter der Adresse des Hauses.
  DS.ALLEIN = location.hostname === 'drucksachen-studio.vercel.app';
  DS.regelSichtbar = r => String(r || '').replace(/\s*Kein Hotel, keine Zimmer\..*$/, '').trim();
  DS.LIVRE = '../livre/';
  DS.livreUrl = p => (DS.M && !DS.M.livre && /^dateien\//.test(p)) ? '/assets/logo/' + p.slice(8) : new URL(p, new URL(DS.LIVRE, location.href)).href;   // Europäischer Hof: ohne Markenbuch-Lieferung kommen Logo und Wappen aus _werkzeuge/assets/logo
  /* Foto in passender Größe (30.10.2026, Start gedrosselt): die Website legt jedes Foto in Stufen ab (640/1000/1600/2400, 700/1300/1800 oder 800/1400/2200);
     genommen wird die kleinste Stufe ab rund 1,6 × Anzeigebreite, höchstens die große Fassung des Markenbuchs. Ohne Stufen bleibt es bei DS.bildUrl. */
  const STUFEN = [[640, 1000, 1600, 2400], [700, 1300, 1800], [800, 1400, 2200]];
  DS.bildFuer = (M, key, breite) => {
    const b = M.bildIndex && M.bildIndex[key], ml = b && b.fl && /^(.*)-(\d+)\.webp$/.exec(b.fl), ms = b && b.fs && /-(\d+)\.webp$/.exec(b.fs);
    if (!M.livre || !ml || !ms || (b.vorschau || b.datei)) return DS.bildUrl(M, key, false);
    const reihe = (STUFEN.find(r => r[0] === +ms[1]) || [+ms[1]]).filter(w => w <= +ml[2]), ziel = breite * 1.6;
    return DS.livreUrl(ml[1] + '-' + (reihe.find(w => w >= ziel) || +ml[2]) + '.webp');
  };
  DS.livreSeite = () => (window.WO_HAUS && WO_HAUS.wege && WO_HAUS.wege.marke) || DS.LIVRE;   // das Markenbuch des Hauses auf seinem eigenen Server
  /* Logo, Logo quer und Wortmarke aus Le Livre: Bildschirm SVG, Blatt und PDF PNG (bis 3000 px, mit Transparenz) */
  DS.livreDateien = M => !M.livre ? (M.logos || []).map(d => ({ key: d.key, alt: d.alt, w: d.w, h: d.h, url: d.datei, miniUrl: d.datei, datei: true, art: 'logo', grund: d.grund })) : (M.livre ? M.livre.dateien : []).filter(d => ['logo', 'quer', 'wortmarke'].includes(d.k) && d.var).flatMap(d => {
    const vb = (d.vb || '0 0 4 3').split(' ').map(Number), N = { logo: 'Logo', quer: 'Logo quer', wortmarke: 'Wortmarke' }[d.k];
    return d.var.map(v => { const svg0 = v.dateien.find(x => x.endsWith('.svg')), png = v.dateien.find(x => x.endsWith('.png')) || svg0, svg = svg0 || png;   // manche Fassungen gibt es nur als SVG
      return { key: 'livre-' + png.replace(/\.(png|svg)$/, ''), alt: `${N} (${{ gold: 'Gold', tinte: 'Tinte', weiss: 'Weiß', hell: 'für helle Flächen', dunkel: 'für dunkle Flächen', taupe: 'Taupe' }[v.k] || v.k})`,
        w: vb[2], h: vb[3], url: DS.livreUrl('dateien/' + png), miniUrl: DS.livreUrl('dateien/' + svg), datei: true, art: d.k, grund: v.grund, farbe: v.farbe }; });
  });
  DS.ladeLivre = async function () {
    if (DS.ALLEIN) return null;
    try {
      const r = await fetch(DS.LIVRE + 'livre.json');   // der Server sagt no-cache; so trifft der Abruf das Vorladen in index.html (30.10.)
      if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) return null;
      const L = await r.json();
      /* Europäischer Hof (09.11.2026): Drucksachen & Feed arbeitet mit den Fotos aus _werkzeuge/assets/bild (marke.json, bau.py);
         das Markenbuch liefert nur dann Fotos, wenn es ausdrücklich dieses Haus und Drucksachen & Feed nennt */
      if (!/Europäischer Hof/.test(L.haus || '') || !L.hausdruckerei) throw new Error('Das Markenbuch liefert keine Fotos für Drucksachen & Feed');
      return L && Array.isArray(L.fotos) && L.fotos.length ? L : null;
    } catch (e) { return null; }
  };

  /* Ausschnitt eines Fotos: Größe und Lage des ganzen Bildes relativ zum Rahmen (für Bildschirm und PDF gleich) */
  DS.ausschnitt = function (el, iw, ih) {
    const z = Math.max(1, el.zoom || 1), ea = el.w / el.h, ia = iw / ih;
    let bw, bh;
    if (ia > ea) { bh = el.h * z; bw = bh * ia; } else { bw = el.w * z; bh = bw / ia; }
    const fx = el.fx ?? .5, fy = el.fy ?? .5;
    return { bw, bh, x: (el.w - bw) * fx, y: (el.h - bh) * fy };
  };

  DS.zz = (M, el) => (el && el.z === 2 && M.zeichen2) || (el && el.z === 3 && M.zeichen3) || M.zeichen;
  /* Europäischer Hof (09.11.2026): das Zeichen ist das gravierte Wappen des Hauses, keine Vektorpfade. Es steht als Maske (Alpha = Gravur) in zwei Fassungen:
     „maske“ für dunkle Farbe auf hellem Grund, „maskeHell“ für helle Farbe auf dunklem Grund. Gefärbt wird wie im Kleid über die Farbe (background + mask). */
  DS.hell = f => { const h = String(f || '').replace('#', ''); if (!/^[0-9a-f]{6}$/i.test(h)) return false; const c = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); return (c[0] * .299 + c[1] * .587 + c[2] * .114) > 150; };
  DS.zeichenUrl = (M, z, farbe) => (M.basis || '') + (DS.hell(farbe) && z.maskeHell ? z.maskeHell : z.maske);
  DS.zeichenSvg = function (M, farbe, el) {
    const z = DS.zz(M, el);
    if (z.maske) {
      const fest = /^#/.test(String(farbe)), url = DS.zeichenUrl(M, z, farbe);
      return `<span class="ds-wappen"${fest ? ' data-m="1"' : ''} style="display:block;width:100%;height:100%;background:${farbe};-webkit-mask:url('${url}') center/contain no-repeat;mask:url('${url}') center/contain no-repeat"></span>`;
    }
    return `<svg viewBox="${z.vb.join(' ')}" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:100%"><g fill="${farbe}" stroke="none">${z.pfade.map(d => `<path d="${d}"/>`).join('')}</g></svg>`;
  };
  /* Wappen in „currentColor“ (Kopf, Leisten, Karten): welche Maske passt, entscheidet die tatsächliche Schriftfarbe an der Stelle */
  if ('MutationObserver' in window) {
    let plan = 0;
    const faerben = () => { plan = 0; if (!DS.M || !DS.M.zeichen || !DS.M.zeichen.maske) return;
      document.querySelectorAll('.ds-wappen:not([data-m])').forEach(w => { if (!w.isConnected) return; const c = getComputedStyle(w).color.match(/\d+/g); if (!c) return;
        const hell = (c[0] * .299 + c[1] * .587 + c[2] * .114) > 150, url = (DS.M.basis || '') + (hell ? DS.M.zeichen.maskeHell : DS.M.zeichen.maske);
        w.style.webkitMaskImage = w.style.maskImage = `url('${url}')`; w.setAttribute('data-m', hell ? 'h' : 'd'); }); };
    new MutationObserver(() => { if (!plan) { plan = 1; requestAnimationFrame(faerben); } }).observe(document.documentElement, { childList: true, subtree: true });
  }

  function tapeteCss(M, art, S, x, y) {
    const r = M.tapete.rapport_mm * S;
    return `background-image:url('${M.basis}${M.tapete[art]}');background-size:${r}px auto;background-position:${-x * S}px ${-y * S}px;background-repeat:repeat;`;
  }
  DS.tapeteCss = tapeteCss;

  /* ---------- ein Element als DOM ---------- */
  DS.elementDom = function (M, el, S, o = {}) {
    const d = document.createElement('div');
    d.className = 'el el-' + el.typ;
    d.dataset.id = el.id;
    const B = o.ohneBeschnitt ? 0 : DS.B;
    let st = `position:absolute;left:${(el.x + B) * S}px;top:${(el.y + B) * S}px;`;
    if (el.typ === 'text') {
      st += `width:${el.w * S}px;font-family:'DS-${el.rolle}'${M && M.schriften && M.schriften[el.rolle] ? `,'${String(M.schriften[el.rolle].familie).replace(/'/g, '')}'` : ''};font-size:${el.gr * S}px;line-height:${el.zeile || 1.2};letter-spacing:${el.sperr || 0}em;` +
        `text-align:${{ l: 'left', c: 'center', r: 'right' }[el.ausr || 'l']};color:${DS.farbe(M, el.farbe)};opacity:${el.deck ?? 1};` +
        `white-space:pre-wrap;overflow-wrap:${/^(titel|kapitale|plakat|plakatfett|kopf)$/.test(el.rolle) ? 'normal' : 'break-word'};font-variant-ligatures:none;font-feature-settings:'liga' 0,'clig' 0;text-rendering:geometricPrecision;` +
        (el.gross ? 'text-transform:uppercase;' : '') +
        (el.schatten ? (t => `text-shadow:${t.dx * S}px ${t.dy * S}px 0 ${t.hart}` + (t.glow ? `,0 0 ${t.blur * S}px ${t.glow}` : '') + ';')(DS.kopfTiefe(DS.farbe(M, el.farbe), el.schatten, el.gr)) : '');   // Kopfzeile: harte Kante, gedruckter Schatten (29.10.)
      d.textContent = el.text;
      if (o.editor && /\[[^\]]*\]/.test(el.text)) d.classList.add('platzhalter');
    } else if (el.typ === 'bild') {
      st += `width:${el.w * S}px;height:${el.h * S}px;overflow:hidden;border-radius:${(el.r || 0) * S}px;`;
      const b = M.bildIndex[el.bild];
      if (b) {
        const a = DS.ausschnitt(el, b.w, b.h);
        const img = document.createElement('img');
        if (b.farbe && o.mini) d.style.background = b.farbe;   // Platzhalter in der Motivfarbe, bis das Bild da ist (29.10.)
        if (o.laden) img.loading = o.laden;   // vor src setzen, sonst lädt der Browser sofort
        if (o.prio) img.fetchPriority = o.prio;
        img.src = DS.bildUrl(M, el.bild, o.mini);
        img.draggable = false;
        img.decoding = 'async';
        img.style.cssText = `position:absolute;left:${a.x * S}px;top:${a.y * S}px;width:${a.bw * S}px;height:${a.bh * S}px;max-width:none;pointer-events:none;`;
        d.appendChild(img);
      } else st += 'background:#cfc6b6;';
    } else if (el.typ === 'flaeche') {
      st += `width:${el.w * S}px;height:${el.h * S}px;background-color:${DS.farbe(M, el.farbe)};opacity:${el.deck ?? 1};border-radius:${(el.r || 0) * S}px;`;
      if (el.tapete) st += tapeteCss(M, el.tapete, S, el.x, el.y);
    } else if (el.typ === 'linie') {
      const senk = el.h > el.w;
      st += `width:${(senk ? el.staerke : el.w) * S}px;height:${(senk ? el.h : el.staerke) * S}px;background:${DS.farbe(M, el.farbe)};opacity:${el.deck ?? 1};`;
    } else if (el.typ === 'rahmen') {
      st += `width:${el.w * S}px;height:${el.h * S}px;border:${el.staerke * S}px solid ${DS.farbe(M, el.farbe)};border-radius:${(el.r || 0) * S}px;opacity:${el.deck ?? 1};box-sizing:border-box;`;
    } else if (el.typ === 'zeichen') {
      st += `width:${el.w * S}px;height:${el.w * DS.zz(M, el).verh * S}px;opacity:${el.deck ?? 1};`;
      d.innerHTML = DS.zeichenSvg(M, DS.farbe(M, el.farbe), el);
    }
    d.style.cssText = st;
    return d;
  };

  DS.elHoehe = function (M, el) {
    if (el.typ === 'zeichen') return el.w * DS.zz(M, el).verh;
    if (el.typ === 'text') return el.h || DS.mess(el).h;
    if (el.typ === 'linie') return Math.max(el.h || 0, el.staerke);
    return el.h;
  };

  /* ---------- eine Seite ---------- */
  DS.seiteDom = function (M, doc, i, S, o = {}) {
    const f = doc.format, s = doc.seiten[i], B = DS.B;
    const p = document.createElement('div');
    p.className = 'blatt'; p.setAttribute('data-wo-bw-nie', '');   // das Blatt bewegt sich nie über das Kleid (30.10.2026: das Messblatt der Druckausgabe schwebte beim ersten Aufruf, Text 3–5 mm verschoben); Editor und Galerien haben eigene Bewegung
    let st = `position:relative;width:${(f.b + 2 * B) * S}px;height:${(f.h + 2 * B) * S}px;overflow:hidden;background-color:${DS.farbe(M, s.grund)};`;
    if (s.tapete) st += tapeteCss(M, s.tapete, S, -B, -B);
    p.style.cssText = st;
    for (const el of s.el) p.appendChild(DS.elementDom(M, el, S, o));
    return p;
  };

  /* ---------- Text messen (Höhe und breiteste Zeile, in mm) ---------- */
  let wirt;
  DS.mess = function (el) {
    if (!wirt) {
      wirt = document.createElement('div');
      wirt.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none';
      document.body.appendChild(wirt);
    }
    const S = 10;
    const d = DS.elementDom(DS.M, Object.assign({}, el, { x: 0, y: 0 }), S, { ohneBeschnitt: true });
    wirt.appendChild(d);
    const h = d.getBoundingClientRect().height / S;
    wirt.removeChild(d);
    // breiteste Zeile: Inhalt in Spannen fassen. Erst messen, wenn jemand danach fragt (nur Ansichtskarte und Preisspalte tun das);
    // spart bei jedem anderen Text das zweite Durchrechnen der Seite (12.10.2026, Galerie mit 3000 Vorlagen)
    let bw = null;
    return { h, get bw() {
      if (bw === null) {
        wirt.appendChild(d);
        const sp = document.createElement('span'); sp.textContent = d.textContent; d.textContent = ''; d.appendChild(sp);
        bw = 0; for (const r of sp.getClientRects()) bw = Math.max(bw, r.width);
        wirt.removeChild(d); bw /= S;
      }
      return bw;
    } };
  };

  /* Glyphen einer gesetzten Textbox: jede Zeichenposition in mm (für das PDF) */
  DS.glyphen = function (d, S, ursprungX, ursprungY) {
    const out = [];
    const tn = [...d.childNodes].filter(n => n.nodeType === 3);
    const r = document.createRange();
    for (const n of tn) {
      const s = n.textContent;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (/\s/.test(ch)) continue;
        // Surrogatpaare zusammenhalten
        let j = i + 1;
        if (ch.charCodeAt(0) >= 0xd800 && ch.charCodeAt(0) < 0xdc00) j++;
        r.setStart(n, i); r.setEnd(n, j);
        const rc = [...r.getClientRects()].filter(x => x.width > 0);
        if (!rc.length) continue;
        const b = rc[0];
        out.push({ ch: s.slice(i, j), x: (b.left - ursprungX) / S, top: (b.top - ursprungY) / S, hoehe: b.height / S });
        i = j - 1;
      }
    }
    return out;
  };
})();
