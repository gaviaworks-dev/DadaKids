/* Mutfağa Giriş — hub §8 (mutfaga-giris-plan.md §6 pub-hub sahipliği).
   gnav smooth-scroll + scrollspy: hub.js'in aynı IIFE'si BİREBİR, yalnız
   section id seti brief'in 8 bölümüne göre değişti (kendisi jenerik —
   #gnav .gtab data-target okur, sabit id listesi YOK). Mobil filtre
   sheet/facet auto-submit resources/js/ui.js'in GENEL binder'ları
   (data-sheet/data-sheet-open/data-sheet-close) ile zaten çalışıyor —
   burada TEKRAR YAZILMADI. */
(function () {
  var tabs = [].slice.call(document.querySelectorAll('#gnav .gtab'));
  if (!tabs.length) return;
  var ids = tabs.map(function (t) { return t.getAttribute('data-target'); });
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var el = document.getElementById(t.getAttribute('data-target'));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  function setActive() {
    var y = (window.scrollY || 0) + 180, cur = ids[0];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= y) cur = id;
    });
    if ((window.scrollY || 0) + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      cur = ids[ids.length - 1];
    }
    tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-target') === cur); });
  }
  window.addEventListener('scroll', setActive, { passive: true });
  setActive();
})();

/* Başlangıç Rotası önizleme şeridi (§8.3) — yatay scroll track, birden fazla
   instance destekler ([data-route-track], hub.js'in tekil #routeTrack'inin
   jenerik hâli). Prev/next/progress UI'ı YOK (önizleme penceresi ≤4 kart —
   swipe/scroll yeter); yalnız kenar-maskesi senkronu (ke-filter deseniyle
   AYNI yaklaşım, docs/lessons.md overflow-scan notuna uygun kırpan-ata
   davranışı JS'te DEĞİL CSS overflow-x:auto'da zaten var). */
(function () {
  document.querySelectorAll('[data-route-track]').forEach(function (track) {
    track.setAttribute('tabindex', '0');
  });
})();
