/* DadaGastro — Görüş Bildir davranışı.
   KAYNAK: FIT kabuk betiğinin "fbModal" IIFE'si (/Fit/fit-giris.html).
   ÜRETİLİR, ELLE DÜZENLENMEZ: scripts/gastro-public-revize.mjs --adim d7 */
(function(){
  if (window.__dmGorus) return; window.__dmGorus = true;
  var tab=document.getElementById('fbTab');
  var modal=document.getElementById('fbModal');
  var overlay=document.getElementById('fbOverlay');
  if(!tab||!modal)return;
  var form=document.getElementById('fbForm');
  var success=document.getElementById('fbBasari');
  var release=null;
  /* 🔴 BAŞLANGIÇ DURUMU ZORLANIR — ölçülmüş kusur.
     Maket sayfalarında modal ACILIYOR ama ICI BOS geliyordu: panel 131px,
     fbForm hidden=true. Kaynak, maketin KENDI paket JS'inin ayni
     modala baglanip formu gizlemesi; benim betigim yalniz close()'ta
     geri aciyordu ve kapanma hic olmuyordu. "Eleman duruyor, durumu
     yanlış" ailesinden: bütün alanlar DOM'daydı, ölçüm sayı olarak
     doğruydu (10 çip · 5 set · 5 textarea), yalnız görünmüyordu.
     Kurulumda başlangıç hâli açıkça yazılır — varsayılmaz. */

  /* FIT kabuğunun yardımcıları maket sayfalarında YOK — varsa kullan. */
  var kilit  = window.lockScroll   || function(){};
  var acKilit= window.unlockScroll || function(){};
  var tuzak  = window.trapFocus    || function(){ return null; };
  /* 🔴 MAKETIN KENDI PAKET JS'I MODALI KENDILIGINDEN ACIYORDU — kok
     sebep olculdu (DOMTokenList.add izlenerek, yigin kaydiyla):
       portal-Co4op6F_.js son satiri:  c && (o && (o.hidden = !0), r())
       c = #fbSuccess · o = #fbForm · r() = modali AC
     Yani "sayfada #fbSuccess VARSA formu gizle ve modali ac" diye bir
     dal var. Maketin KENDI modalinda #fbSuccess YOKTU, o yuzden dal hic
     kosmuyordu; FIT'in modali onu getirince dal her sayfa yuklemesinde
     tetiklendi. TEK KUSUR, IKI BELIRTI: modal kendiliginden aciliyor VE
     ici bos geliyor (form gizlenmis). "Tasinan eleman, tasinmayan bir
     kosulu uyandirdi" — yeni bir kirilma sinifi.
     Cozum: kabuk betigi acilis halini KENDI dayatir. Modul betikleri
     klasik betiklerden SONRA kostugu icin normalize gecikmeli de
     cagriliyor. Kullanici actiginda bayrak kalkar, bir daha kapatilmaz. */
  var acildi = false;
  function normalize(){
    if(form) form.hidden=false;
    if(success) success.hidden=true;
    if(!acildi && location.search.indexOf('fb=1')<0){
      modal.classList.remove('show');
      if(overlay) overlay.classList.remove('show');
    }
  }
  normalize();
  setTimeout(normalize,0); window.addEventListener('load',function(){ setTimeout(normalize,0); });
  function open(){ acildi=true; normalize();
    if(modal.classList.contains('show'))return;
    modal.classList.add('show'); if(overlay)overlay.classList.add('show'); kilit();
    release = tuzak(modal); }
  function close(){ if(!modal.classList.contains('show'))return;
    modal.classList.remove('show'); if(overlay)overlay.classList.remove('show'); acKilit();
    if(release){ release(); release=null; }
    setTimeout(function(){ if(form){form.hidden=false;form.reset();} if(success)success.hidden=true; },300); }
  tab.addEventListener('click',function(e){e.preventDefault();open();});
  var kapat=document.getElementById('fbClose'); if(kapat)kapat.addEventListener('click',close);
  if(overlay)overlay.addEventListener('click',close);
  modal.addEventListener('click',function(e){if(e.target===modal)close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  function syncPanes(){
    var a=modal.querySelector('.fb-topic.active'); if(!a)return;
    var cur=a.getAttribute('data-topic');
    modal.querySelectorAll('.fb-fields').forEach(function(p){
      var on=p.getAttribute('data-for')===cur;
      p.classList.toggle('active',on);
      p.querySelectorAll('input,textarea,select,button').forEach(function(el){el.disabled=!on});
    });
  }
  modal.querySelectorAll('.fb-topic').forEach(function(t){
    t.addEventListener('click',function(){
      modal.querySelectorAll('.fb-topic').forEach(function(x){x.classList.remove('active')});
      t.classList.add('active'); syncPanes(); });
  });
  syncPanes();
  modal.querySelectorAll('.fb-emoji button').forEach(function(b){
    b.addEventListener('click',function(){
      modal.querySelectorAll('.fb-emoji button').forEach(function(x){x.classList.remove('active')});
      b.classList.add('active'); }); });
  if(form) form.addEventListener('submit',function(e){
    e.preventDefault();
    form.hidden=true; if(success){ success.hidden=false; success.setAttribute('tabindex','-1'); success.focus(); } });
  var again=document.getElementById('fbAgain');
  if(again) again.addEventListener('click',function(){
    if(success)success.hidden=true; if(form)form.hidden=false;
    var ilk=modal.querySelector('.fb-topic'); if(ilk) ilk.focus(); });
  if(location.search.indexOf('fb=1')>-1){open();}
})();
