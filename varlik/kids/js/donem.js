/* Dada Kids — Dönemler: evre şeridinde aktif evreyi görünür alana kaydır + sekmeler (hamilelik alt bölümleri) */
(function () {
  'use strict';
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  // Aktif evre chip'i mobilde görünür alana gelsin (sayfa kaydırılmadan)
  $$('.kd-dserit__liste').forEach(function (liste) {
    var simdi = liste.querySelector('.kd-dserit__simdi');
    if (!simdi || liste.scrollWidth <= liste.clientWidth) return;
    liste.scrollLeft = simdi.offsetLeft - (liste.clientWidth - simdi.offsetWidth) / 2;
  });

  // Sekmeler (WAI-ARIA tabs): ok tuşları, Home/End
  $$('[data-kd-sekme]').forEach(function (kap) {
    var sekmeler = $$('[role="tab"]', kap);
    if (!sekmeler.length) return;
    function sec(i, odakla) {
      sekmeler.forEach(function (s, n) {
        var acik = n === i;
        s.setAttribute('aria-selected', String(acik));
        s.tabIndex = acik ? 0 : -1;
        var panel = document.getElementById(s.getAttribute('aria-controls'));
        if (panel) { if (acik) panel.removeAttribute('data-kd-kapali'); else panel.setAttribute('data-kd-kapali', ''); }
      });
      if (odakla) sekmeler[i].focus();
    }
    sekmeler.forEach(function (s, n) {
      s.addEventListener('click', function () { sec(n, false); });
      s.addEventListener('keydown', function (e) {
        var i = null;
        if (e.key === 'ArrowRight') i = (n + 1) % sekmeler.length;
        else if (e.key === 'ArrowLeft') i = (n - 1 + sekmeler.length) % sekmeler.length;
        else if (e.key === 'Home') i = 0;
        else if (e.key === 'End') i = sekmeler.length - 1;
        if (i === null) return;
        e.preventDefault();
        sec(i, true);
      });
    });
  });
  /* Besin sekmeleri (evre sayfaları, #besinler): WAI-ARIA tabs + hash (#besinler-<durum>) + grup chip'leri + ilk 8 */
  var azalt = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SINIR = 8;
  $$('[data-kd-matris]').forEach(function (kap) {
    var sekmeler = $$('[role="tab"]', kap);
    var alan = kap.querySelector('.kd-mtab__paneller');
    if (!sekmeler.length || !alan) return;
    var panel = function (s) { return document.getElementById(s.getAttribute('aria-controls')); };
    var simdiki = Math.max(0, sekmeler.findIndex(function (s) { return s.getAttribute('aria-selected') === 'true'; }));
    var zaman = 0;

    // Yükseklik geçişi: içerik değişirken alan eski yükseklikten yenisine kayar (sayfa zıplamaz)
    function yumusak(degistir) {
      if (azalt) { degistir(); return; }
      clearTimeout(zaman);
      var h0 = alan.getBoundingClientRect().height;
      kap.classList.remove('kd-mtab--anim'); alan.style.height = '';
      degistir();
      var h1 = alan.getBoundingClientRect().height;
      if (Math.abs(h1 - h0) < 2) return;
      alan.style.height = h0 + 'px';
      void alan.offsetHeight;
      kap.classList.add('kd-mtab--anim');
      alan.style.height = h1 + 'px';
      zaman = setTimeout(function () { kap.classList.remove('kd-mtab--anim'); alan.style.height = ''; }, 360);
    }

    // Panel içi: grup süzgeci + ilk 8 sınırı
    function uygula(p, duyur) {
      var kartlar = $$('.kd-mkart', p);
      var grup = p.getAttribute('data-kd-grup') || 'hepsi';
      var acik = p.hasAttribute('data-kd-tumu');
      var eslesen = kartlar.filter(function (k) { return grup === 'hepsi' || k.getAttribute('data-grup') === grup; });
      kartlar.forEach(function (k) {
        var i = eslesen.indexOf(k);
        if (i < 0) k.setAttribute('data-kd-suzuldu', ''); else k.removeAttribute('data-kd-suzuldu');
        if (i >= SINIR && !acik) k.setAttribute('data-kd-fazla', ''); else k.removeAttribute('data-kd-fazla');
      });
      var daha = p.querySelector('.kd-mdaha');
      if (daha) {
        daha.hidden = acik || eslesen.length <= SINIR;
        var n = daha.querySelector('[data-kd-n]'); if (n) n.textContent = eslesen.length;
      }
      var durum = p.querySelector('[data-kd-durum]');
      if (durum && duyur) durum.textContent = eslesen.length + ' besin listeleniyor' + (!acik && eslesen.length > SINIR ? ', ilk ' + SINIR + ' tanesi gösteriliyor.' : '.');
    }

    // Kart "Ayrıntı": kırpılmayan ve ek metni olmayan kartta düğmeye gerek yok
    function ayrintiDuzenle(p) {
      $$('.kd-mkart__ac', p).forEach(function (b) {
        var kart = b.closest('.kd-mkart');
        if (kart.classList.contains('kd-mkart--acik') || kart.querySelector('.kd-mkart__ek')) return;
        var not = kart.querySelector('.kd-mkart__not');
        if (!not || !not.getClientRects().length) return;
        b.hidden = not.scrollHeight <= not.clientHeight + 1;
      });
    }

    function sec(i, ops) {
      ops = ops || {};
      var onceki = simdiki;
      var degis = function () {
        sekmeler.forEach(function (s, n) {
          var acik = n === i;
          s.setAttribute('aria-selected', String(acik));
          s.tabIndex = acik ? 0 : -1;
          var p = panel(s);
          if (!p) return;
          if (acik) {
            p.removeAttribute('data-kd-kapali');
            if (ops.anim && !azalt && onceki !== i) {
              p.style.setProperty('--kd-m-yon', (i > onceki ? 16 : -16) + 'px');
              p.classList.remove('kd-mpanel--gir'); void p.offsetWidth; p.classList.add('kd-mpanel--gir');
            }
          } else p.setAttribute('data-kd-kapali', '');
        });
      };
      if (ops.anim) yumusak(degis); else degis();
      simdiki = i;
      ayrintiDuzenle(panel(sekmeler[i]));
      if (ops.odakla) sekmeler[i].focus();
      if (ops.hash) {
        var h = '#besinler-' + sekmeler[i].getAttribute('data-durum');
        if (location.hash !== h && history.replaceState) history.replaceState(null, '', h);
      }
    }

    sekmeler.forEach(function (s, n) {
      s.addEventListener('click', function () { sec(n, { anim: true, hash: true }); });
      s.addEventListener('keydown', function (e) {
        var i = null;
        if (e.key === 'ArrowRight') i = (n + 1) % sekmeler.length;
        else if (e.key === 'ArrowLeft') i = (n - 1 + sekmeler.length) % sekmeler.length;
        else if (e.key === 'Home') i = 0;
        else if (e.key === 'End') i = sekmeler.length - 1;
        if (i === null) return;
        e.preventDefault();
        sec(i, { anim: true, hash: true, odakla: true });
      });
    });

    sekmeler.forEach(function (s) {
      var p = panel(s); if (!p) return;
      uygula(p, false);
      p.addEventListener('click', function (e) {
        var chip = e.target.closest('.kd-mfiltre [data-grup]');
        if (chip) {
          $$('.kd-mfiltre [data-grup]', p).forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
          p.setAttribute('data-kd-grup', chip.getAttribute('data-grup'));
          yumusak(function () { uygula(p, true); });
          ayrintiDuzenle(p);
          return;
        }
        var daha = e.target.closest('[data-kd-daha]');
        if (daha) {
          var gorunen = $$('.kd-mkart:not([data-kd-suzuldu]):not([data-kd-fazla])', p).length;
          p.setAttribute('data-kd-tumu', '');
          yumusak(function () { uygula(p, true); });
          var yeni = $$('.kd-mkart:not([data-kd-suzuldu])', p).slice(gorunen);
          if (!azalt) yeni.forEach(function (k, n) { k.style.animationDelay = Math.min(n, 8) * 30 + 'ms'; k.classList.add('kd-mkart--yeni'); });
          ayrintiDuzenle(p);
          if (yeni[0]) yeni[0].focus({ preventScroll: true });
          return;
        }
        var ac = e.target.closest('.kd-mkart__ac');
        if (ac) {
          var kart = ac.closest('.kd-mkart');
          var acik = !kart.classList.contains('kd-mkart--acik');
          kart.classList.toggle('kd-mkart--acik', acik);
          ac.setAttribute('aria-expanded', String(acik));
          ac.setAttribute('aria-label', (kart.querySelector('.kd-mkart__ad') || {}).textContent + (acik ? ': ayrıntıyı gizle' : ': ayrıntıyı göster'));
        }
      });
    });

    // Hash: #besinler-dikkat gibi; yüklemede ve hash değişince sekmeyi seç
    function hashOku(kaydir) {
      var m = /^#besinler-(uygun|dikkat|henuz)$/.exec(location.hash);
      if (!m) return;
      var i = sekmeler.findIndex(function (s) { return s.getAttribute('data-durum') === m[1]; });
      if (i < 0) return;
      sec(i, { anim: !kaydir });
      if (kaydir) sekmeler[i].scrollIntoView({ block: 'start' });
    }
    hashOku(true);
    if (!/^#besinler-/.test(location.hash)) sec(simdiki, {});
    window.addEventListener('hashchange', function () { hashOku(false); });
    var bekle = 0;
    window.addEventListener('resize', function () { clearTimeout(bekle); bekle = setTimeout(function () { ayrintiDuzenle(panel(sekmeler[simdiki])); }, 150); });
  });
})();
