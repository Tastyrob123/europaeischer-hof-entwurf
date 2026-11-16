/* entwurf-passen.js · Setzt jede Innenseite der neuen Entwürfe: zuerst die Gerichte, dann der Teller nur, wenn genug Höhe frei ist (nie grösser als
   data-mm, die Breite, die 300 dpi tragen), danach verteilt sich der Rest gleichmässig zwischen die Gerichte: keine Leerfläche unter dem Inhalt.
   Ist eine Seite zu voll, werden nur die Abstände enger (eng, enger), der Lesetext bleibt 11 pt. Ergebnis in window.PRUEF für den Druck. */
var MM = 96 / 25.4;
function frei(s) { var l = s.querySelector('.liste'); if (!l) return 0; var k = [].slice.call(l.children), u = l.getBoundingClientRect().top;
  k.forEach(function (c) { var r = c.getBoundingClientRect(), m = parseFloat(getComputedStyle(c).marginBottom) || 0; u = Math.max(u, r.bottom + m) }); return l.getBoundingClientRect().bottom - u }
function voll(s) { var r = s.getBoundingClientRect(), h = s.querySelector('.hin'); return frei(s) < 0 || (h && h.getBoundingClientRect().bottom > r.bottom - 1.5 * MM) }
addEventListener('DOMContentLoaded', function () { document.fonts.ready.then(function () { var L = [];
  document.querySelectorAll('.seite.innen').forEach(function (s) {
    if (!s.classList.contains('wein')) ['eng', 'enger', 'am-engsten'].forEach(function (k) { if (voll(s)) s.classList.add(k) });
    var t = s.querySelector('.teller'), f = frei(s);
    if (t && f > 42 * MM) { var img = t.querySelector('img'), max = Math.min(parseFloat(img.dataset.mm) || 60, 72) * MM;
      t.style.display = 'flex'; var h = Math.min(f - 14 * MM, max); img.style.height = h + 'px'; img.style.width = 'auto';
      if (img.getBoundingClientRect().width > max) { img.style.width = max + 'px'; img.style.height = 'auto' } }
    var l = s.querySelector('.liste'); if (l && frei(s) > 6 * MM) l.style.justifyContent = 'space-evenly' });
  document.querySelectorAll('.seite').forEach(function (s, i) { var r = s.getBoundingClientRect(), aus = [];
    s.querySelectorAll('p,h1,h2,h3,h4,.g,.z,.mps,.teller img').forEach(function (el) { var q = el.getBoundingClientRect(); if (!q.height) return;
      if (q.bottom > r.bottom + .5 || q.right > r.right + .5 || q.left < r.left - .5) aus.push((el.textContent || el.tagName).trim().slice(0, 40)) });
    var im = s.querySelector('.teller img'), mm = null, grenze = null;
    if (im && im.offsetParent) { mm = Math.round(im.getBoundingClientRect().width / MM); grenze = parseFloat(im.dataset.mm); if (mm > grenze) aus.push('Foto ' + mm + ' mm > ' + grenze + ' mm (300 dpi)') }
    var rest = s.classList.contains('innen') ? Math.round(frei(s) / MM) : null;
    L.push({ seite: i + 1, aus: aus, teller_mm: mm, frei_mm: rest }) });
  window.PRUEF = L; document.documentElement.classList.add('gesetzt') }) });
