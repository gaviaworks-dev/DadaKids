/* Dada Gastro Kids — Mevsim Takvimi: ay sekmeleri (varsayılan: bu ay), oklar, klavye, #ay-N bağlantıları, tür süzgeci */
(function () {
  'use strict';
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  var kap = $('.kd-mevsim');
  var kaplar = $$('.kd-mevsim');
  var serit = $('.kd-may__serit');
  if (!kap || !serit) return;
  var sekmeler = $$('[role="tab"]', serit);
  if (!sekmeler.length) return;
  var azalt = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var buAy = new Date().getMonth() + 1;

  function sekmeAy(s) { return parseInt(s.getAttribute('data-ay'), 10); }
  function indeks(ay) { for (var i = 0; i < sekmeler.length; i++) if (sekmeAy(sekmeler[i]) === ay) return i; return -1; }

  // "Bu ay" işareti
  var bi = indeks(buAy);
  if (bi >= 0) sekmeler[bi].setAttribute('data-bu-ay', '');
  $$('.kd-myilserit li').forEach(function (li) { var a = li.querySelector('[data-ay-git]'); if (a && parseInt(a.getAttribute('data-ay-git'), 10) === buAy) li.setAttribute('data-bu-ay', ''); });

  function seritOrtala(s) {
    var hedef = s.offsetLeft - (serit.clientWidth - s.offsetWidth) / 2;
    if (serit.scrollTo) serit.scrollTo({ left: hedef, behavior: azalt ? 'auto' : 'smooth' }); else serit.scrollLeft = hedef;
  }

  var aktif = -1;
  function sec(i, opt) {
    opt = opt || {};
    i = (i + sekmeler.length) % sekmeler.length;
    aktif = i;
    sekmeler.forEach(function (s, n) {
      var acik = n === i;
      s.setAttribute('aria-selected', String(acik));
      s.tabIndex = acik ? 0 : -1;
      // E7: bir ayın tezgâh ve ürün panelleri ayrı bölümlerde; ikisi birlikte açılır
      $$('.kd-mpanel[data-ay="' + sekmeAy(s) + '"]').forEach(function (p) { p.classList.toggle('kd-acik', acik); });
    });
    var s = sekmeler[i];
    seritOrtala(s);
    if (opt.odak) s.focus();
    if (opt.adres && history.replaceState) {
      var u = new URL(location.href); u.hash = 'ay-' + sekmeAy(s);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
    // yeni panelin kartları görünsün (kids.js .kd-gir gözlemcisi gizli panelleri kaçırabilir)
    $$('.kd-mpanel[data-ay="' + sekmeAy(s) + '"] .kd-gir').forEach(function (e) { e.classList.add('kd-gorundu'); });
    turKontrol();
  }

  sekmeler.forEach(function (s, n) {
    s.addEventListener('click', function () { sec(n, { adres: true }); });
    s.addEventListener('keydown', function (e) {
      var i = null;
      if (e.key === 'ArrowRight') i = n + 1;
      else if (e.key === 'ArrowLeft') i = n - 1;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = sekmeler.length - 1;
      if (i === null) return;
      e.preventDefault();
      sec(i, { odak: true, adres: true });
    });
  });
  $$('.kd-may__ok').forEach(function (b) {
    b.addEventListener('click', function () { sec(aktif + parseInt(b.getAttribute('data-yon'), 10), { adres: true }); });
  });

  // #ay-N bağlantıları (yıl şeridi, paylaşılan adres)
  function hashtenAy() { var m = /^#ay-(\d{1,2})$/.exec(location.hash); return m ? parseInt(m[1], 10) : null; }
  function seciciyeKaydir() {
    var y = kap.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: azalt ? 'auto' : 'smooth' });
  }
  $$('[data-ay-git]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var i = indeks(parseInt(a.getAttribute('data-ay-git'), 10));
      if (i < 0) return;
      e.preventDefault();
      sec(i, { adres: true });
      seciciyeKaydir();
    });
  });
  window.addEventListener('hashchange', function () { var ay = hashtenAy(); var i = ay ? indeks(ay) : -1; if (i >= 0) { sec(i); seciciyeKaydir(); } });

  // Tür süzgeci
  var turDugmeler = $$('.kd-mtur .kd-chip');
  function turKontrol() {
    var tur = kaplar[kaplar.length - 1].getAttribute('data-tur') || '';
    $$('.kd-mpanel').forEach(function (p) {
      var bos = $('.kd-mtezgah__bos', p);
      if (!bos) return;
      var gorunen = tur ? $$('.kd-murun[data-tur="' + tur + '"]', p).length : 1;
      bos.hidden = gorunen > 0;
    });
  }
  function turSec(tur) {
    kaplar.forEach(function (k) { if (tur) k.setAttribute('data-tur', tur); else k.removeAttribute('data-tur'); });
    turDugmeler.forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-tur') || '') === tur)); });
    turKontrol();
  }
  turDugmeler.forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-tur') || '';
      turSec((kaplar[kaplar.length - 1].getAttribute('data-tur') || '') === t ? '' : t);
    });
  });
  $$('.kd-mtur-sifirla').forEach(function (b) { b.addEventListener('click', function () { turSec(''); }); });

  // Başlangıç: #ay-N varsa o ay, yoksa bu ay
  var ilk = hashtenAy();
  var ii = ilk ? indeks(ilk) : -1;
  sec(ii >= 0 ? ii : (bi >= 0 ? bi : 0));
})();
