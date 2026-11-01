/* Dada Gastro Kids — Rehber: hub'da evre süzgeci · makalede "Bu sayfada" etkin bölüm vurgusu */
(function () {
  'use strict';
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  /* ---------- Hub: evre süzgeci ---------- */
  var dugmeler = $$('.kd-rsuz .kd-chip');
  var kartlar = $$('.kd-rkart');
  var durum = $('#rehber-durum');
  function suz(evre) {
    var n = 0;
    kartlar.forEach(function (k) {
      var uygun = !evre || (' ' + (k.getAttribute('data-evreler') || '') + ' ').indexOf(' ' + evre + ' ') !== -1;
      k.hidden = !uygun;
      if (uygun) { n++; k.classList.add('kd-gorundu'); }
    });
    dugmeler.forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-evre') || '') === evre)); });
    if (durum) durum.textContent = n + ' makale gösteriliyor';
  }
  dugmeler.forEach(function (b) {
    b.addEventListener('click', function () {
      var e = b.getAttribute('data-evre') || '';
      suz(b.getAttribute('aria-pressed') === 'true' && e ? '' : e);
    });
  });
  // Profilde evre varsa o evreyi öne al (yalnız makale içeriyorsa)
  var p = window.DadaKids && window.DadaKids.profil;
  if (dugmeler.length && p && p.evre && $('.kd-rsuz .kd-chip[data-evre="' + p.evre + '"]')) suz(p.evre);

  /* ---------- Makale: içindekiler ---------- */
  var toc = $('.kd-rtoc');
  if (!toc) return;
  var baglar = $$('a[href^="#"]', toc);
  var bolumler = baglar.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  // mobilde içindekiler kapalı başlasın
  var kutu = $('.kd-rtoc__kutu', toc);
  if (kutu && window.matchMedia && window.matchMedia('(max-width: 1024px)').matches) kutu.open = false;
  // masaüstünde özet tıklanınca kapanmasın
  if (kutu) $('summary', kutu).addEventListener('click', function (e) { if (window.matchMedia && !window.matchMedia('(max-width: 1024px)').matches) e.preventDefault(); });
  if (!('IntersectionObserver' in window) || !bolumler.length) return;
  function isaretle(id) { baglar.forEach(function (a) { a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + id)); }); }
  var gorunur = {};
  var io = new IntersectionObserver(function (girdiler) {
    girdiler.forEach(function (g) { gorunur[g.target.id] = g.isIntersecting; });
    for (var i = 0; i < bolumler.length; i++) if (gorunur[bolumler[i].id]) { isaretle(bolumler[i].id); return; }
  }, { rootMargin: '-20% 0px -65% 0px' });
  bolumler.forEach(function (b) { io.observe(b); });
})();
