/* kleid/ehh.js · Hauswerte für oberflaeche.js (Der Europäische Hof Heidelberg, privat geführtes Fünf-Sterne-Superior-Grandhotel, Friedrich-Ebert-Anlage 1; Oberchef 09.11.2026).
   Im <head> VOR allen Stilen laden (ohne defer). Rahmen «Die Bühne»: Kopf schwarz wie die Website des Hauses (#000000), Raum im warmen Hell der Website (#f3efed).
   Liegt unter _werkzeuge/oberflaeche/ und wird von den Werkzeug-Servern unter /assets/oberflaeche/ ausgeliefert (einziger Schreiber: Oberchef).
   Fotos, Schriften und Logos kommen aus _werkzeuge/assets/ (ausgeliefert unter /assets/bild/<schlüssel>-<480|1200>.webp, /assets/schrift/, /assets/logo/).
   Bildregister: /assets/bild/register.json (Schlüssel, Quelldatei in _quelle/bilder/, Größe). */
window.WO_HAUS = { kurz: 'ehh', name: 'Europäischer Hof', voll: 'Der Europäische Hof Heidelberg', ort: 'Heidelberg', welt: 'grand', rahmen: 'buehne', anrede: 'Sie',
  /* Aussenfoto des Startbilds: der Eingang mit Säulen und Schriftzug «Europäischer Hof» (_quelle/bilder/hotel-europaeischer-hof-heidelberg-5-sterne-aussen-eingang-treppenaufgang-03.jpg) */
  foto: '/assets/bild/hotel-europaeischer-hof-heidelberg-5-sterne-aussen-eingang-treppenaufgang-03-1200.webp',
  fotoKlein: '/assets/bild/hotel-europaeischer-hof-heidelberg-5-sterne-aussen-eingang-treppenaufgang-03-480.webp', fotoFarbe: '#6f6a63',
  fotoStufen: [480, 1200], fotoAlt: 'Der Eingang des Europäischen Hofs mit Säulen und rotem Teppich',
  /* Zeichen: das Wappen aus dem Logo des Hauses (_quelle/logo/logo_white_top.png), als Maske; färbt sich über color.
     zeichenDunkel: dieselbe Gravur für helle Flächen (aus _quelle/logo/EHH-Logo.jpg). Wortmarke nur als Original-PNG (logo_black_bottom / logo_white_bottom). */
  zeichen: '/assets/logo/wappen-maske.png', zeichenDunkel: '/assets/logo/wappen-maske-dunkel.png', zeichenMass: 0.615,
  logoSchwarz: '/assets/logo/logo_black_bottom.png', logoWeiss: '/assets/logo/logo_white_bottom.png', logoMass: 2.812,
  /* Namen der drei Werkzeuge: die EINE Stelle (Oberchef 09.11.2026, Namen-Regel: gewöhnliche Wörter, Funktion zuerst, ein klassisches Grandhotel).
     Dateien, Schlüssel und Adressen bleiben (carte, livre, imprimerie). Nur diese drei Werkzeuge werden gebaut. */
  namen: { karten: 'Karten & Preislisten', marke: 'Markenbuch', druck: 'Drucksachen & Feed', uebersicht: 'Die drei Werkzeuge', schulung: 'KI im Alltag des Hauses' },
  saetze: {
    karten: 'Alle Karten des Hauses an einer Stelle pflegen: Kurfürstenstube, Wein, Bar, Zigarren, Catering und Kulinarischer Kalender, daraus die PDF wie gedruckt.',
    marke: 'Wappen, Logo, Fotos, Farben und Schriften des Hauses an einem Ort, mit Herkunft jedes Bildes.',
    druck: 'Karten, Aushänge, Broschürenseiten und Einladungen im Stil der Drucksachen des Hauses selbst entwerfen.' },
  reihe: ['karten', 'marke', 'druck'],
  wege: { karten: '/_werkzeuge/carte/', marke: '/_werkzeuge/livre/', druck: '/_werkzeuge/imprimerie/', uebersicht: '/uebersicht/index.html', schulung: '/schulung/index.html' },
  /* Prüfserver je Werkzeug (cloud/haus.json); Wege zwischen Werkzeugen immer 127.0.0.1, nie localhost (Fehlerbuch 10a) */
  ports: { karten: 9461, marke: 9462, druck: 9463, uebersicht: 9464, schulung: 9464 } };
/* Lokal zeigen die Wege zu den ANDEREN Werkzeugen auf deren eigenen Server unter 127.0.0.1, nie auf den eigenen Port. Online bleiben sie relativ. */
(function () {
  if (!/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
  Object.keys(WO_HAUS.wege).forEach(function (k) {
    var p = WO_HAUS.ports[k], w = WO_HAUS.wege[k];
    if (p && String(p) !== location.port && w.charAt(0) === '/') WO_HAUS.wege[k] = 'http://127.0.0.1:' + p + w;
  });
  WO_HAUS.wegeLokal = true;
})();
document.documentElement.setAttribute('data-wo-haus', WO_HAUS.kurz);
document.documentElement.setAttribute('data-wo-rahmen', WO_HAUS.rahmen);
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
/* Bewegung der Werkzeuge: bewegung.js neben oberflaeche.js, async und mit wenig Vorrang nachgeladen */
(function () {
  var me = document.currentScript, s = document.createElement('script');
  s.src = (me && me.src ? new URL('../bewegung.js', me.src).href : '/assets/oberflaeche/bewegung.js') + '?v=3';
  s.async = true; s.setAttribute('fetchpriority', 'low'); document.head.appendChild(s);
})();
/* Titel fliegen zeilenweise hoch (Kriterium 37). WO_ZEILEN(el) setzt jedes Wort eines Titels in <span class="wo-w"> und schreibt die Zeile als --z daran. */
window.WO_ZEILEN = function (el) {
  if (!el || el.hasAttribute('data-wo-zl')) return !!(el && el.classList.contains('wo-zl'));
  var h0 = el.offsetHeight; if (!h0) return false;
  el.setAttribute('data-wo-zl', '');
  var w0 = Math.max(el.scrollWidth, el.clientWidth), roh = el.innerHTML, tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), t, ts = [];
  while ((t = tw.nextNode())) if (/\S/.test(t.data) && !t.parentNode.closest('svg')) ts.push(t);
  if (!ts.length) return false;
  ts.forEach(function (t) {
    var f = document.createDocumentFragment();
    t.data.split(/(\s+)/).forEach(function (s) {
      if (!s) return;
      if (/^\s+$/.test(s)) { f.appendChild(document.createTextNode(s)); return; }
      var w = document.createElement('span'); w.className = 'wo-w'; w.textContent = s; f.appendChild(w);
    });
    t.parentNode.replaceChild(f, t);
  });
  if (el.offsetHeight !== h0 || el.scrollWidth > w0 + 1) { el.innerHTML = roh; return false; }
  var z = -1, oben = -1e9, halb = parseFloat(getComputedStyle(el).fontSize) * 0.5;
  el.querySelectorAll('.wo-w').forEach(function (w) { var y = w.getBoundingClientRect().top; if (y > oben + halb) { z++; oben = y; } if (z) w.style.setProperty('--z', z); });
  el.classList.add('wo-zl');
  return true;
};
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('MutationObserver' in window)) return;
  var plan = 0;
  function teile() {
    plan = 0;
    document.querySelectorAll('.wo-sb__h:not([data-wo-zl])').forEach(function (h) {
      if (document.documentElement.classList.contains('still')) return;
      var a = h.getAnimations ? h.getAnimations() : [];
      if (a.some(function (x) { return (x.currentTime || 0) > 120; })) { h.setAttribute('data-wo-zl', ''); return; }
      WO_ZEILEN(h);
    });
  }
  new MutationObserver(function () { if (!plan && document.querySelector('.wo-sb__h:not([data-wo-zl])')) { plan = 1; Promise.resolve().then(teile); } })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
