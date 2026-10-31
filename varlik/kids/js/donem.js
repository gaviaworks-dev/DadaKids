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
})();
