/* Karten & Preislisten · Der Europäische Hof Heidelberg (Vorlage Hotel Bareiss, Prüfung 20.11.2026) — Auftritte beim Scrollen (09.11.2026, Fehlerbuch 10a vom 09.11.2026, Prüfpunkt 11 in oberflaeche_pruefen.js:
   «was unterhalb des ersten Bildschirms steht, schwebt beim Hereinscrollen an seinen Platz (40 px, Feder, Staffel höchstens vier), Fotos zoomen in
   ihren Rahmen; nur transform, deckend ab dem ersten Bild, nichts wartet»). schweben.js bleibt für den ersten Bildschirm (R17).
   Gilt für die Liste im Modus «Einfach» (Seitenköpfe, Einträge, Knöpfe am Ende einer Seite): was beim Zeichnen der Liste unterhalb des Bildschirms
   liegt, steht 40 px tiefer (Foto der Zeile etwas größer) und federt an seinen Platz, sobald es zu einem Fünftel im Bild ist. Was beim Zeichnen schon
   im Bild ist, steht sofort ruhig da (kein Flackern nach dem Speichern). Weniger Bewegung: alles steht sofort. */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var WAS = '#liste .teil__k, #liste .r, #liste .neu-zeile';
  var io = new IntersectionObserver(function (es) {
    var k = 0;
    es.forEach(function (e) {
      if (!e.isIntersecting || (e.intersectionRatio < 0.2 && e.intersectionRect.height < innerHeight * 0.2)) return;
      e.target.style.setProperty('--esi', Math.min(k++, 4));
      e.target.classList.add('es-da');
      io.unobserve(e.target);
    });
  }, { threshold: [0, 0.1, 0.2] });
  function lauf() {
    plan = 0;
    var H = innerHeight;
    document.querySelectorAll(WAS).forEach(function (el) {
      if (el.hasAttribute('data-es')) return;
      el.setAttribute('data-es', '');
      var r = el.getBoundingClientRect();
      if (!r.height || r.top < H * 0.92) return;   // schon im Bild oder verborgen: steht ruhig
      el.classList.add('es-nach');
      io.observe(el);
    });
  }
  var plan = 0;
  function plane() { if (!plan) plan = requestAnimationFrame(lauf); }
  function los() {
    var w = document.getElementById('liste');
    if (!w) return;
    new MutationObserver(plane).observe(w, { childList: true, subtree: true });
    lauf();
    /* am Seitenende: was im Bild ist, aber nie zu einem Fünftel hineinkommt, kommt trotzdem */
    addEventListener('scroll', function () {
      if (scrollY + innerHeight < document.documentElement.scrollHeight - 4) return;
      document.querySelectorAll('.es-nach:not(.es-da)').forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) { io.unobserve(el); el.classList.add('es-da'); } });
    }, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los); else los();
})();
