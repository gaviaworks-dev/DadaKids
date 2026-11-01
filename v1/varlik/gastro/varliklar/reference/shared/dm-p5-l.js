/* Aşama 2 · B (ajan-b3) — arayüz çevirisi. Sayfa kaynak dilin DIŞINDAYKEN Blade `parcalar.menu.js-sozluk` parçası
   <script type="application/json" id="dmUyeSozluk"> basar (TR'de hiçbir şey basmaz); burada okunur. Anahtar yoksa TR yedeği
   döner ve :ad yer tutucuları TR yedeğinde de doldurulur — TR çıktısı eskisiyle bayt bayt aynı. MutationObserver yok. */
window.dmUyeL = window.dmUyeL || (function () {
  var s = null;
  function sozluk() {
    if (s) return s;
    var el = document.getElementById('dmUyeSozluk');
    if (!el) return {}; /* öğe henüz yok (TR ya da betik gövdeden önce koştu): önbelleğe alınmaz */
    try { s = JSON.parse(el.textContent) || {}; } catch (e) { s = {}; }
    return s;
  }
  return function (k, tr, p) {
    var v = sozluk()[k];
    if (typeof v !== 'string') v = tr;
    /* C1 2. tur: sözlük (EN) değeri 'tekil|çoğul' ise sayı p.sayi → p.toplam → p.n'den seçilir, 1 → ilk biçim (dmL ile aynı kural).
       Sayı verilmezse değer olduğu gibi döner. TR yedeği bölünmez — TR'de sözlük yok, metin aynen. */
    else if (v.indexOf('|') >= 0 && p) {
      var n = [p.sayi, p.toplam, p.n].filter(function (x) { return x !== undefined && x !== null && x !== ''; })[0];
      if (n !== undefined) { var b = v.split('|'); var bi = (function (x) { if (b.length < 3 || typeof document === 'undefined' || typeof Intl === 'undefined') return -1; var pr = new Intl.PluralRules(document.documentElement.lang || 'tr'); if (pr.resolvedOptions().pluralCategories.indexOf('few') < 0) return -1; x = Math.abs(Number(x)) || 0; if (x !== Math.floor(x)) return 1; var k = pr.select(x); return k === 'one' ? 0 : (k === 'few' ? 1 : 2); })(n); v = bi >= 0 ? b[bi] : (Number(n) === 1 ? b[0] : b[b.length - 1]); }
    }
    return String(v).replace(/:([a-z_]+)/g, function (m, a) { return p && Object.prototype.hasOwnProperty.call(p, a) ? String(p[a]) : m; });
  };
})();
/* =====================================================================
   GASTRO PUBLIC · PARTİ 5 · LEAD — ALIŞVERİŞ: ÇOK LİSTE (madde 8-12)
   ---------------------------------------------------------------------
   Bağlı olduğu sayfalar:
     g-menulerim.html            → liste listesi + detay + seçim
     tarif__*.html / en__tarif__* → yalnız L10 (liste seçim penceresi)

   KAYNAK BURASI: scripts/p5-varlik/dm-p5-l.js — ağaca KOPYALANIR.
   Şema `dm-p4-depo.js`te (sürüm 2). Arama + sayfalama ajan D'nin
   `dm-p4-m.js` M7'sinde; bu dosya panoya `data-mnl-ozne` sözleşmesini
   kullandırıyor ve kart çizdikten sonra `dmMnlListe.tazele` çağırıyor.

   🔴 LİSTE ADI KULLANICI GİRDİSİ — her yerde `textContent`, hiçbir
      yerde `innerHTML`. (Ad "<img onerror>" olabilir.)
   🔴 `window.prompt` KULLANILMADI: bazı bağlamlarda engelli ve kabuğun
      dili değil. Ad sorma da kanonun `.dm-modal`ıyla.
   🔴 YALAN DÜĞME 0: çizilen her düğmenin bir işi var; bağlanamayan
      yüzey basılmaz.
   ===================================================================== */
(function () {
  'use strict';
  if (window.dmP5L) return;
  window.dmP5L = {};

  var D = null;                                   /* dmDepo — kur()'da bağlanır */
  var $  = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return [].slice.call((k || document).querySelectorAll(s)); };

  function el(tag, sinif, metin) {
    var e = document.createElement(tag);
    if (sinif) e.className = sinif;
    if (metin != null) e.textContent = metin;               /* ASLA innerHTML */
    return e;
  }
  function ikon(e, sinif) {
    var i = document.createElement('i');
    i.className = sinif; i.setAttribute('aria-hidden', 'true');
    e.appendChild(i); e.appendChild(document.createTextNode(' '));
    return i;
  }
  function toast(m, se) { if (window.dmToast) window.dmToast(m, se); }

  /* Göreli tarih — sayfanın kendi dili ("Son güncelleme"). Uydurma yok:
     kaynak `guncellendi` damgası. */
  function tarih(ms) {
    if (!ms) return '';
    var f = Date.now() - ms;
    if (f < 60000) return dmUyeL('uye_mutfak.js.l.az_once', 'az önce');
    if (f < 3600000) return dmUyeL('uye_mutfak.js.l.dk_once', ':n dk önce', {n: Math.floor(f / 60000)});
    if (f < 86400000) return dmUyeL('uye_mutfak.js.l.saat_once', ':n saat önce', {n: Math.floor(f / 3600000)});
    if (f < 7 * 86400000) return dmUyeL('uye_mutfak.js.l.gun_once', ':n gün önce', {n: Math.floor(f / 86400000)});
    try {
      return new Date(ms).toLocaleDateString(/^en/i.test(document.documentElement.lang || '') ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long' });
    } catch (e) { return ''; }
  }

  /* ═══ ORTAK · AD SORAN PENCERE ═════════════════════════════════════
     Kanonun `.dm-modal`ı (parti 4 · ortak katman). Yeni bileşen
     açılmadı; yalnız gövdesi bu işe göre dolduruluyor. */
  var adModali = null;
  function adSor(se, cb) {
    if (!window.dmModal) { cb(null); return; }
    if (!adModali) {
      adModali = el('div', 'dm-modal al-ad-modal lg-kalip');
      adModali.setAttribute('role', 'dialog');
      adModali.setAttribute('aria-modal', 'true');
      adModali.setAttribute('hidden', '');

      var bas = el('div', 'dm-modal-bas');
      var ico = el('span', 'lg-ico'); ikon(ico, 'fa-solid fa-basket-shopping');
      var yazi = el('div');
      var h = el('h2', null, ''); h.id = 'alAdBaslik';
      var p = el('p', null, '');
      yazi.appendChild(h); yazi.appendChild(p);
      var kapat = el('button', 'lg-close');
      kapat.type = 'button'; kapat.setAttribute('aria-label', dmUyeL('uye_mutfak.js.l.pencereyi_kapat', 'Pencereyi kapat'));
      ikon(kapat, 'fa-solid fa-xmark');
      bas.appendChild(ico); bas.appendChild(yazi); bas.appendChild(kapat);

      var govde = el('div', 'dm-modal-govde');
      var alan = el('div', 'al-ad-alan');
      var etiket = el('label', 'alan-etiket', dmUyeL('uye_mutfak.js.l.liste_adi', 'Liste adı'));
      etiket.setAttribute('for', 'alAdGirdi');
      var girdi = el('input', 'alan-girdi'); girdi.type = 'text'; girdi.id = 'alAdGirdi';
      girdi.setAttribute('maxlength', '60'); girdi.setAttribute('autocomplete', 'off');
      var uyari = el('p', 'al-ad-uyari'); uyari.hidden = true;
      alan.appendChild(etiket); alan.appendChild(girdi); alan.appendChild(uyari);
      govde.appendChild(alan);

      var ayak = el('div', 'dm-modal-ayak');
      var sag = el('span', 'sag');
      var vaz = el('button', 'dugme ikincil', dmUyeL('uye_mutfak.js.l.vazgec', 'Vazgeç')); vaz.type = 'button';
      var tamam = el('button', 'dugme birincil', dmUyeL('uye_mutfak.js.l.kaydet', 'Kaydet')); tamam.type = 'button';
      sag.appendChild(vaz); sag.appendChild(tamam); ayak.appendChild(sag);

      adModali.appendChild(bas); adModali.appendChild(govde); adModali.appendChild(ayak);
      document.body.appendChild(adModali);

      adModali._parca = { h: h, p: p, girdi: girdi, uyari: uyari, tamam: tamam };
      kapat.addEventListener('click', function () { window.dmModal.kapat(adModali); });
      vaz.addEventListener('click', function () { window.dmModal.kapat(adModali); });
      girdi.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); adModali._parca.tamam.click(); }
      });
    }
    var q = adModali._parca;
    q.h.textContent = se.baslik;
    q.p.textContent = se.alt || '';
    q.girdi.value = se.deger || '';
    q.uyari.hidden = true;
    q.tamam.textContent = se.dugme || dmUyeL('uye_mutfak.js.l.kaydet', 'Kaydet');
    adModali.setAttribute('aria-labelledby', 'alAdBaslik');

    var yeniTamam = q.tamam.cloneNode(true);
    q.tamam.parentNode.replaceChild(yeniTamam, q.tamam);
    q.tamam = yeniTamam;
    yeniTamam.addEventListener('click', function () {
      var v = q.girdi.value.trim();
      if (!v) { q.uyari.hidden = false; q.uyari.textContent = dmUyeL('uye_mutfak.js.l.ad_bos_olamaz', 'Liste adı boş olamaz.'); q.girdi.focus(); return; }
      window.dmModal.kapat(adModali);
      cb(v);
    });
    window.dmModal.ac(adModali);
    setTimeout(function () { q.girdi.focus(); q.girdi.select(); }, 30);
  }

  /* ═══ ORTAK · LİSTE SEÇME PENCERESİ (madde 10) ═════════════════════ */
  var secModali = null;
  function listeSec(se, cb) {
    var l = D.listeler();
    /* 🔴 TEK LİSTE VARSA SEÇİM EKRANI ÇIKMAZ — doğrudan ona yazılır. */
    if (l.length <= 1) { cb(l.length ? l[0].id : D.etkinListe().id); return; }
    if (!window.dmModal) { cb(D.etkinListe().id); return; }

    if (!secModali) {
      secModali = el('div', 'dm-modal al-sec-modal lg-kalip');
      secModali.setAttribute('role', 'dialog');
      secModali.setAttribute('aria-modal', 'true');
      secModali.setAttribute('hidden', '');
      var bas = el('div', 'dm-modal-bas');
      var ico = el('span', 'lg-ico'); ikon(ico, 'fa-solid fa-basket-shopping');
      var yazi = el('div');
      var h = el('h2', null, dmUyeL('uye_mutfak.js.l.hangi_listeye', 'Hangi listeye eklensin?')); h.id = 'alSecBaslik';
      var p = el('p');
      yazi.appendChild(h); yazi.appendChild(p);
      var kapat = el('button', 'lg-close');
      kapat.type = 'button'; kapat.setAttribute('aria-label', dmUyeL('uye_mutfak.js.l.pencereyi_kapat', 'Pencereyi kapat'));
      ikon(kapat, 'fa-solid fa-xmark');
      bas.appendChild(ico); bas.appendChild(yazi); bas.appendChild(kapat);
      var govde = el('div', 'dm-modal-govde');
      var kutu = el('div', 'al-sec-kutu');
      govde.appendChild(kutu);
      secModali.appendChild(bas); secModali.appendChild(govde);
      secModali.setAttribute('aria-labelledby', 'alSecBaslik');
      document.body.appendChild(secModali);
      secModali._parca = { p: p, kutu: kutu };
      kapat.addEventListener('click', function () { window.dmModal.kapat(secModali); });
    }
    var q = secModali._parca;
    q.p.textContent = se.alt || '';
    q.kutu.innerHTML = '';

    l.forEach(function (x) {
      var b = el('button', 'al-sec-kalem'); b.type = 'button';
      var sol = el('span', 'al-sec-ikon'); ikon(sol, 'fa-solid fa-basket-shopping');
      var org = el('span', 'al-sec-bilgi');
      org.appendChild(el('b', null, x.ad));
      org.appendChild(el('span', null, dmUyeL('uye_mutfak.js.l.sec_satiri', ':n kalem · :a/:n tamamlandı', {n: x.kalem, a: x.alinan})));
      b.appendChild(sol); b.appendChild(org);
      if (x.id === D.etkinListe().id) {
        var rz = el('span', 'rozet olumlu', dmUyeL('uye_mutfak.js.l.etkin', 'Etkin')); b.appendChild(rz);
      }
      b.addEventListener('click', function () { window.dmModal.kapat(secModali); cb(x.id); });
      q.kutu.appendChild(b);
    });

    var yeni = el('button', 'al-sec-kalem al-sec-yeni'); yeni.type = 'button';
    var yi = el('span', 'al-sec-ikon'); ikon(yi, 'fa-solid fa-plus');
    var yb = el('span', 'al-sec-bilgi');
    yb.appendChild(el('b', null, dmUyeL('uye_mutfak.js.l.yeni_liste_olustur', 'Yeni liste oluştur')));
    yb.appendChild(el('span', null, dmUyeL('uye_mutfak.js.l.yeni_listeye_yazilir', 'Malzemeler yeni listeye yazılır')));
    yeni.appendChild(yi); yeni.appendChild(yb);
    yeni.addEventListener('click', function () {
      window.dmModal.kapat(secModali);
      adSor({ baslik: dmUyeL('uye_mutfak.js.l.yeni_liste', 'Yeni liste'), alt: dmUyeL('uye_mutfak.js.l.ad_ver', 'Listene bir ad ver.'), deger: '', dugme: dmUyeL('uye_mutfak.js.l.olustur', 'Oluştur') },
        function (ad) { if (!ad) return; cb(D.listeAc(ad)); });
    });
    q.kutu.appendChild(yeni);
    window.dmModal.ac(secModali);
  }

  /* ═══════════════════════════════════════════════════════════════════
     L10 · "ALIŞVERİŞ LİSTESİNE EKLE" ARTIK LİSTE SEÇTİRİR
     -------------------------------------------------------------------
     🔴 AJAN D'NİN DOSYASINA DOKUNULMADI. Ekleme davranışı `dm-p4-m.js`
        M3b (tarif satırı · "Tümünü") ve M4 (menü kartı) içinde ve o
        dosya D'nin kulvarı. Buradaki katman düğmeye ÖNCE giriyor:
        `capture` evresinde document üzerinde dinleniyor, seçim
        alınınca ETKİN liste ayarlanıp tıklama düğmeye BIRAKILIYOR.
     🔴 `stopPropagation` capture evresinde çağrılınca olay HEDEFE HİÇ
        ULAŞMAZ — M3b'nin kendi dinleyicisi de bu yüzden koşmaz.
     🔴 İÇ İÇE `click()` YOK: ikinci tıklama kullanıcı seçimini
        bekledikten SONRA (ayrı görev) atılıyor, bayrakla bir kez.
        (Deponun kayıtlı dersi: iç içe click sessizce yutulur.)
     🔴 ÇIKARMA İŞLEMİNE KARIŞILMAZ: düğme `.listede` ise tıklama
        listeden çıkarmadır, seçilecek bir şey yok. */
  var EKLE_SECICI = '.ing-add, #addAllBtn, [data-mnl-eylem="liste"]';
  function l10() {
    document.addEventListener('click', function (e) {
      if (!D) return;
      var b = e.target.closest ? e.target.closest(EKLE_SECICI) : null;
      if (!b) return;
      if (b.dataset.p5Gec === '1') { delete b.dataset.p5Gec; return; }  /* ikinci geçiş */
      if (b.classList.contains('listede')) return;                     /* çıkarma */
      if (D.listeler().length < 2) return;                             /* tek liste */
      e.preventDefault(); e.stopPropagation();
      listeSec({ alt: dmUyeL('uye_mutfak.js.l.secilen_listeye', 'Bu malzemeler seçtiğin listeye yazılacak.') }, function (id) {
        if (!id) return;
        D.etkinSec(id);
        b.dataset.p5Gec = '1';
        b.click();
      });
    }, true);                                                          /* CAPTURE */
    return { secici: EKLE_SECICI, dugme: $$(EKLE_SECICI).length };
  }

  /* ═══════════════════════════════════════════════════════════════════
     L8 · LİSTE LİSTESİ  +  L9 · DETAY GEÇİŞİ
     -------------------------------------------------------------------
     Kart kalıbı sayfanın KENDİ `.paket-satiri` satırı; kart menüsü
     sayfanın kendi `.al-share-wrap`/`.al-share-pop` açılırı.
     Kart tıklanabilir ama menü düğmesi kartın İÇİNDE — iç içe `button`
     geçersiz olurdu; kart `<article>`, açma düğmesi gerilmiş bağ
     (`.al-liste-ac::after{inset:0}`), menü onun ÜSTÜNDE. */
  function l8() {
    var pano = $('[data-pane="alisveris"]');
    if (!pano) return null;
    var kutu = $('[data-al-kutu]', pano);
    var bos  = $('#alListeBos', pano);
    var kok  = $('[data-p5-listeler]', pano);
    var ust  = $('section.al-top', pano);
    var govde= $('section.al-body', pano);
    if (!kutu || !kok || !ust || !govde) return null;

    var yeniDugme = $('[data-al-yeni-liste]', pano);
    var geriDugme = $('[data-al-geri]', pano);
    var baslik = $('#alCount', pano) ? $('#alCount', pano).parentNode : null;

    /* Detay başlığına liste adı — `<h2>Alışveriş listen <span#alCount>`
       cümlesinin öznesi artık BELLİ bir liste. Metin düğümü yerinde
       değiştiriliyor, `#alCount` (D'nin çizdiği sayaç) korunuyor. */
    var basMetin = null;
    if (baslik) {
      for (var i = 0; i < baslik.childNodes.length; i++) {
        if (baslik.childNodes[i].nodeType === 3 && baslik.childNodes[i].nodeValue.trim()) {
          basMetin = baslik.childNodes[i]; break;
        }
      }
    }

    var kip = 'liste';                                     /* 'liste' | 'detay' */

    function kipYaz() {
      var detay = kip === 'detay';
      kok.hidden = detay;
      ust.hidden = !detay;
      govde.hidden = !detay;
      pano.setAttribute('data-al-kip', kip);
      if (detay && basMetin) {
        var e = D.etkinListe();
        basMetin.nodeValue = e && e.ad ? e.ad + ' ' : dmUyeL('uye_mutfak.js.l.alisveris_listen', 'Alışveriş listen ');
      }
    }

    function kartCiz(x) {
      var k = el('article', 'paket-satiri al-liste-karti');
      k.setAttribute('data-al-liste', x.id);

      var av = el('span', 'avatar al-liste-ikon');
      av.setAttribute('aria-hidden', 'true');
      ikon(av, 'fa-solid fa-basket-shopping');
      k.appendChild(av);

      var bilgi = el('span', 'bilgi');
      var b = el('b');
      var ac = el('button', 'al-liste-ac', x.ad);
      ac.type = 'button';
      ac.setAttribute('data-al-ac', x.id);
      b.appendChild(ac); bilgi.appendChild(b);

      var plan = el('span', 'plan');
      ikon(plan, 'fa-solid fa-list-check');
      plan.appendChild(document.createTextNode(dmUyeL('uye_mutfak.js.l.a_n_tamamlandi', ':a / :n tamamlandı', {a: x.alinan, n: x.kalem})));
      bilgi.appendChild(plan);

      var not = el('span', 'not');
      ikon(not, 'fa-solid fa-clock');
      not.appendChild(document.createTextNode(dmUyeL('uye_mutfak.js.l.guncelleme', 'Güncelleme :zaman', {zaman: tarih(x.guncellendi)})));
      bilgi.appendChild(not);
      k.appendChild(bilgi);

      var fiyat = el('span', 'fiyat');
      fiyat.appendChild(el('b', null, String(x.kalem)));
      fiyat.appendChild(el('span', null, dmUyeL('uye_mutfak.js.l.kalem', 'kalem')));
      k.appendChild(fiyat);

      /* Kart menüsü — sayfanın kendi açılır kalıbı */
      var sar = el('span', 'al-share-wrap al-liste-menu');
      var mac = el('button', 'al-liste-menu-ac');
      mac.type = 'button';
      mac.setAttribute('aria-haspopup', 'true');
      mac.setAttribute('aria-expanded', 'false');
      mac.setAttribute('aria-label', dmUyeL('uye_mutfak.js.l.liste_islemleri', ':ad — liste işlemleri', {ad: x.ad}));
      ikon(mac, 'fa-solid fa-ellipsis-vertical');
      var pop = el('div', 'al-share-pop'); pop.hidden = true;

      [['adlandir', 'fa-solid fa-pen', dmUyeL('uye_mutfak.js.l.yeniden_adlandir', 'Yeniden adlandır')],
       ['kopyala',  'fa-solid fa-copy', dmUyeL('uye_mutfak.js.l.kopyala', 'Kopyala')],
       ['sil',      'fa-regular fa-trash-can', dmUyeL('uye_mutfak.js.l.sil', 'Sil')]].forEach(function (t) {
        var d = el('button'); d.type = 'button';
        d.setAttribute('data-al-eylem', t[0]);
        ikon(d, t[1]);
        d.appendChild(el('span', null, t[2]));
        pop.appendChild(d);
      });
      sar.appendChild(mac); sar.appendChild(pop);
      k.appendChild(sar);

      mac.addEventListener('click', function (e) {
        e.stopPropagation();
        var acik = !pop.hidden;
        kapatHepsi();
        pop.hidden = acik;
        mac.setAttribute('aria-expanded', acik ? 'false' : 'true');
      });
      pop.addEventListener('click', function (e) {
        var d = e.target.closest('[data-al-eylem]');
        if (!d) return;
        e.stopPropagation();
        kapatHepsi();
        eylem(d.getAttribute('data-al-eylem'), x);
      });
      ac.addEventListener('click', function () { detayAc(x.id); });
      return k;
    }

    function kapatHepsi() {
      $$('.al-liste-menu .al-share-pop', kutu).forEach(function (p) { p.hidden = true; });
      $$('.al-liste-menu-ac', kutu).forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    }
    document.addEventListener('click', kapatHepsi);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') kapatHepsi(); });

    function detayAc(id) {
      /* Public revize R2: liste detayı kendi sayfası (`?liste=<kod>`, bantlı giriş). Yeni açılan listenin kodu
         sunucu onayından sonra kesinleşir; ondan önce geçiş yapılmaz. */
      if (D.kesinKod) {
        D.kesinKod(id).then(function (kod) {
          window.location.assign((window.dmYol || String)('/hesabim/menulerim') + '?liste=' + encodeURIComponent(kod) + '#alisveris');
        });
        return;
      }
      D.etkinSec(id);
      kip = 'detay';
      kipYaz();
      ust.scrollIntoView({ block: 'start' });
    }
    function listeyeDon() { kip = 'liste'; kipYaz(); ciz(); kok.scrollIntoView({ block: 'start' }); }

    function eylem(ad, x) {
      if (ad === 'adlandir') {
        adSor({ baslik: dmUyeL('uye_mutfak.js.l.listeyi_adlandir', 'Listeyi yeniden adlandır'), alt: dmUyeL('uye_mutfak.js.l.yeni_adi_yaz', 'Yeni adı yaz.'), deger: x.ad },
          function (v) {
            if (!v) return;
            D.listeAdlandir(x.id, v);
            toast(dmUyeL('uye_mutfak.js.l.ad_degisti', 'Liste adı değişti'), { alt: v });
          });
      } else if (ad === 'kopyala') {
        var y = D.listeKopyala(x.id);
        if (y) toast(dmUyeL('uye_mutfak.js.l.kopyalandi', 'Liste kopyalandı'), { alt: dmUyeL('uye_mutfak.js.l.kopya_alt', ':ad (kopya) · :n kalem', {ad: x.ad, n: x.kalem}) });
      } else if (ad === 'sil') {
        onayla(dmUyeL('uye_mutfak.js.l.silinsin_mi', 'Liste silinsin mi?'),
          dmUyeL('uye_mutfak.js.l.silinecek', '“:ad” ve içindeki :n kalem silinecek. Bu işlem geri alınamaz.', {ad: x.ad, n: x.kalem}),
          function () {
            if (D.listeSil(x.id)) toast(dmUyeL('uye_mutfak.js.l.silindi', 'Liste silindi'), { tip: 'bilgi', alt: x.ad });
          });
      }
    }

    /* Onay — kanonun `.dm-modal`ı; `window.confirm` kabuğun dili değil. */
    var onayModali = null;
    function onayla(baslik, alt, cb) {
      if (!window.dmModal) { cb(); return; }
      if (!onayModali) {
        onayModali = el('div', 'dm-modal al-onay-modal lg-kalip');
        onayModali.setAttribute('role', 'dialog');
        onayModali.setAttribute('aria-modal', 'true');
        onayModali.setAttribute('hidden', '');
        var bas = el('div', 'dm-modal-bas');
        var ico = el('span', 'lg-ico'); ikon(ico, 'fa-solid fa-triangle-exclamation');
        var yz = el('div');
        var h = el('h2'); h.id = 'alOnayBaslik';
        var p = el('p');
        yz.appendChild(h); yz.appendChild(p);
        var kp = el('button', 'lg-close'); kp.type = 'button';
        kp.setAttribute('aria-label', dmUyeL('uye_mutfak.js.l.pencereyi_kapat', 'Pencereyi kapat')); ikon(kp, 'fa-solid fa-xmark');
        bas.appendChild(ico); bas.appendChild(yz); bas.appendChild(kp);
        var ayak = el('div', 'dm-modal-ayak');
        var sag = el('span', 'sag');
        var vaz = el('button', 'dugme ikincil', dmUyeL('uye_mutfak.js.l.vazgec', 'Vazgeç')); vaz.type = 'button';
        var evet = el('button', 'dugme tehlike', dmUyeL('uye_mutfak.js.l.sil', 'Sil')); evet.type = 'button';
        sag.appendChild(vaz); sag.appendChild(evet); ayak.appendChild(sag);
        onayModali.appendChild(bas); onayModali.appendChild(ayak);
        onayModali.setAttribute('aria-labelledby', 'alOnayBaslik');
        document.body.appendChild(onayModali);
        onayModali._parca = { h: h, p: p, evet: evet };
        kp.addEventListener('click', function () { window.dmModal.kapat(onayModali); });
        vaz.addEventListener('click', function () { window.dmModal.kapat(onayModali); });
      }
      var q = onayModali._parca;
      q.h.textContent = baslik; q.p.textContent = alt;
      var yeni = q.evet.cloneNode(true);
      q.evet.parentNode.replaceChild(yeni, q.evet); q.evet = yeni;
      yeni.addEventListener('click', function () { window.dmModal.kapat(onayModali); cb(); });
      window.dmModal.ac(onayModali);
    }

    function ciz() {
      /* R4: tariften gelen, henüz kaydedilmemiş (taslak) liste "Alışveriş listelerin"de görünmez. */
      var l = D.listeler().filter(function (x) { return x.kaydedildi !== false; });
      /* Beyar kararı A (3 Eki): en yeni oluşturulan üstte — `olusturuldu` azalan; eşitlikte depo sırasının tersi
         (sunucu id artan verir → id azalan). Yalnız çizim sırası; depoya dokunulmaz. */
      l = l.map(function (x, i) { return { x: x, i: i }; })
        .sort(function (a, b) { return ((b.x.olusturuldu || 0) - (a.x.olusturuldu || 0)) || (b.i - a.i); })
        .map(function (o) { return o.x; });
      kutu.innerHTML = '';
      l.forEach(function (x) { kutu.appendChild(kartCiz(x)); });
      bos.hidden = l.length > 0;
      kutu.hidden = l.length === 0;
      /* madde 12 · arama + sayfalama ajan D'nin M7'sinde; özne yeniden
         doğduğu için yeniden dizinlenmeli. */
      if (window.dmMnlListe && window.dmMnlListe.tazele) window.dmMnlListe.tazele('alisveris');
      return l.length;
    }

    if (yeniDugme) yeniDugme.addEventListener('click', function () {
      adSor({ baslik: dmUyeL('uye_mutfak.js.l.yeni_liste', 'Yeni liste'), alt: dmUyeL('uye_mutfak.js.l.ad_ver_ornek', 'Listene bir ad ver — örneğin “Haftalık Market”.'),
              deger: '', dugme: dmUyeL('uye_mutfak.js.l.olustur', 'Oluştur') }, function (ad) {
        if (!ad) return;
        var id = D.listeAc(ad);
        toast(dmUyeL('uye_mutfak.js.l.olusturuldu', 'Liste oluşturuldu'), { alt: ad });
        detayAc(id);
      });
    });
    if (geriDugme) geriDugme.addEventListener('click', listeyeDon);

    document.addEventListener('dm-depo', function (e) {
      if (!e.detail || (e.detail.bolum !== 'alisveris' && e.detail.bolum !== '*')) return;
      if (kip === 'liste') ciz(); else kipYaz();
    });

    kipYaz();
    var n = ciz();
    return { liste: n, kip: kip };
  }

  function kur() {
    D = window.dmDepo;
    if (!D || D.surum !== 2) { window.dmP5L.hata = 'dmDepo sürüm 2 yok'; return; }
    window.dmP5L.l10 = l10();
    window.dmP5L.l8 = l8();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();

/* Revize 7 · madde 87 — pencereler giriş kapısının kalıbında: kabuk kuralları
   `public/revize/tur7/p-pencere.css`te (`.lg-kalip`). Sayfa onu yüklemiyorsa
   bir kez eklenir; pencere ilk açılmadan yüklü olsun diye betik yüklenirken. */
(function () {
  'use strict';
  if (typeof document === 'undefined' || typeof document.createElement !== 'function' || !document.head
    || document.querySelector('link[data-pencere-kalibi]')) return;
  var l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = '/revize/tur7/p-pencere.css';
  l.setAttribute('data-pencere-kalibi', '');
  document.head.appendChild(l);
})();
