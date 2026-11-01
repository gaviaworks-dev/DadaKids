/* ===== F2 — TARİF LİSTE / ARAMA: mobil filtre sheet'i =====
   ref tarif-liste-v1.html satır 2931-2942 ("mobil filtre sheet'i" IIFE) —
   literal transfer. side/applyBtn ref'te dışarıdaki sahte-veri motoru
   IIFE'sinde tanımlıydı (motor bu turda taşınmadı — bkz. handoff); bu iki
   var burada yeniden tanımlanır, davranış (open/close/Escape/SS param)
   DEĞİŞMEDİ. computeCount/render/clearAll/pagination-mock/hero-chip-click
   (ref satır 2774-2960, 2954-2960 hariç yaklaşık tamamı) bilerek dışarıda
   bırakıldı — gerçek sonuç sayısı/chip/pagination sunucudan gelir. */
(function(){
  var side=document.getElementById('lstSide');
  var overlay=document.getElementById('sheetOverlay');
  var applyBtn=document.getElementById('sheetApply');
  if(!side||!overlay)return;
  // Sheet açıkken alttan-yükselen panel, kabuğun fixed bottom-nav'ı + DadaMentor
  // mini panelini örtmesin (ikisi de root z-index'te sheet'in üstünde kalıyor:
  // .lst-sec{z-index:2} tüm alt-ağacı — sheet dahil — köke bu seviyede sabitliyor).
  // Kabuğun KENDİ gizleme sınıflarını (bn-hidden/foot-hide) sheet süresince uygula;
  // kapanışta kaldır (kabuğun scroll/resize handler'ı doğru durumu yeniden kurar).
  // Bu iki eleman layout'ta @yield('content') SONRASINDA include ediliyor; bu script
  // ise content İÇİNDE çalışıyor → IIFE ilk çalıştığında henüz DOM'da yoklar. Bu yüzden
  // referansları önden değil, her open/close çağrısında (lazy) sorgula.
  function open(){side.classList.add('open');overlay.classList.add('open');document.body.style.overflow='hidden';document.body.classList.add('bn-lock');var bnav=document.querySelector('.bottom-nav');var mentor=document.getElementById('mentorPanel');if(bnav)bnav.classList.add('bn-hidden');if(mentor)mentor.classList.add('foot-hide');}
  function close(){side.classList.remove('open');overlay.classList.remove('open');document.body.style.overflow='';document.body.classList.remove('bn-lock');var bnav=document.querySelector('.bottom-nav');var mentor=document.getElementById('mentorPanel');if(bnav)bnav.classList.remove('bn-hidden');if(mentor)mentor.classList.remove('foot-hide');}
  document.getElementById('btnFilter').addEventListener('click',open);
  document.getElementById('sheetClose').addEventListener('click',close);
  overlay.addEventListener('click',close);
  if(applyBtn)applyBtn.addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  if(location.search.indexOf('sheet=1')>-1)open();   // SS paramı
})();

/* ===== sıralama dropdown'ı (ref satır 2892-2911, aç/kapa kısmı literal) =====
   Seçenekler artık gerçek <a href> (server-side sıralama) — yalnız açma/kapama
   + dışarı tıklayınca kapanma JS'te kalır; "active" etiketi server render eder,
   bu yüzden ref'teki click-time DOM güncellemesi (sortCur/active class) taşınmadı. */
(function(){
  var dd=document.getElementById('sortDd');
  var btn=document.getElementById('sortBtn');
  if(!dd||!btn)return;
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    var open=dd.classList.toggle('open');
    btn.setAttribute('aria-expanded',open?'true':'false');
  });
  document.addEventListener('click',function(e){
    if(!e.target.closest('#sortDd')){dd.classList.remove('open');btn.setAttribute('aria-expanded','false');}
  });
})();

/* Görünüm geçişi (Kafes/Liste) → resources/js/ui.js bindViewToggle()
   (data-view-seg/data-view-target; .lst-grid.is-list CSS aynı sözleşme) —
   burada AYRICA bağlanmaz (çift dinleyici olurdu). */
