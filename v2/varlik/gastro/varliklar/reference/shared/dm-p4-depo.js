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
   ORTAK · PARTİ 4 — MAKET DEPO + TOAST + MODAL
   ---------------------------------------------------------------------
   BAĞI lead attı; İÇERİĞİNİ yalnız lead yazar.
   KAYNAK BURASI: scripts/p4-varlik/dm-p4-depo.js — ağaca kopyalanır.

   NİYE VAR — dört kulvar da "durum kalıcı · toast gerçek" istiyor
   (L3 alışveriş listesi · A2 modal · B1 erişim anahtarı · L6 plan
   taslağı). Dördü kendi deposunu yazsaydı aynı sekmede dört ayrı
   `localStorage` sözleşmesi olurdu; tek kaynak burada.

   🔴 BU BİR MAKET. Arka uç yok; durum yalnız o tarayıcıda yaşar.
      Depo bunu SAKLAMAZ — `dmDepo.maket === true` ve arayüz bunu
      yazmak zorunda. "Kaydedildi" diyen ama hiçbir yere gitmeyen bir
      yüzey yalan söyler; "bu makette tarayıcına kaydedildi" söylemez.

   🔴 localStorage HER OKUMADA ATABİLİR (gizli pencere, site verisi
      kapalı, önizleme yakalayıcısı). Her okuma/yazma try/catch içinde
      ve depo boş dönerse arayüz DOĞRU çizilir — deponun kayıtlı dersi.
      Erişilemezse bellek içi yedeğe düşer: sayfa ömrü boyunca çalışır,
      yenilenince sıfırlanır. Sessizce ölmez.
   ===================================================================== */
(function () {
  'use strict';
  if (window.dmDepo) return;                       /* iki kez bağlanmaz */

  var ANAHTAR = 'dm-gastro-p4';
  var bellek = null;                    /* localStorage erişilemezse yedek */
  var erisilebilir = (function () {
    try { var k = ANAHTAR + '::sinama'; localStorage.setItem(k, '1');
          localStorage.removeItem(k); return true; } catch (e) { return false; }
  })();

  function hamOku() {
    if (!erisilebilir) return bellek || {};
    try { return JSON.parse(localStorage.getItem(ANAHTAR) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function hamYaz(o) {
    bellek = o;
    if (!erisilebilir) return false;
    try { localStorage.setItem(ANAHTAR, JSON.stringify(o)); return true; }
    catch (e) { return false; }
  }

  function yay(bolum, ayrinti) {
    try {
      document.dispatchEvent(new CustomEvent('dm-depo', {
        detail: Object.assign({ bolum: bolum }, ayrinti || {}) }));
    } catch (e) {}
  }

  /* ── REYON EŞLEMESİ ────────────────────────────────────────────────
     🔴 DONÖRDE REYON NİTELİĞİ YOK — parti 2'de ölçüldü: tarif
     detayının `.ing-row`u reyon taşımıyor. Reyon ADLARI uydurulmadı,
     prototipin kendi `#addReyon` seçeneklerinden alındı
     (dadamutfak-view/alisveris-listesi-v1.html · 11 seçenek, SIRASI
     bozulmadan). Eşleşme anahtar kelimeyle yapılır; eşleşmeyen kalem
     "Bakkaliye"ye değil, prototipte de olmayan bir yere DEĞİL, ilk
     eşleşmesizler kovası olan `bakkal`a düşer ve satırında kaynağı
     yazar — kullanıcı yanlışsa taşıyabilir. */
  var REYONLAR = [
    { k:'manav',        ad:dmUyeL('uye_mutfak.js.depo.reyon_manav', 'Manav'),                 ikon:'fa-carrot' },
    { k:'kasap',        ad:dmUyeL('uye_mutfak.js.depo.kasap_sarkuteri', 'Kasap & Şarküteri'),     ikon:'fa-drumstick-bite' },
    { k:'sut',          ad:dmUyeL('uye_mutfak.js.depo.sut_kahvaltilik', 'Süt & Kahvaltılık'),     ikon:'fa-cheese' },
    { k:'firin',        ad:dmUyeL('uye_mutfak.js.depo.firin_ekmek', 'Fırın & Ekmek'),         ikon:'fa-bread-slice' },
    { k:'bakliyat',     ad:dmUyeL('uye_mutfak.js.depo.reyon_bakliyat', 'Bakliyat & Makarna'),    ikon:'fa-wheat-awn' },
    { k:'baharat',      ad:dmUyeL('uye_mutfak.js.depo.reyon_baharat', 'Baharat & Sos'),         ikon:'fa-mortar-pestle' },
    { k:'icecek',       ad:dmUyeL('uye_mutfak.js.depo.icecekler', 'İçecekler'),             ikon:'fa-mug-hot' },
    { k:'atistirmalik', ad:dmUyeL('uye_mutfak.js.depo.atistirmalik', 'Atıştırmalık'),          ikon:'fa-cookie-bite' },
    { k:'donuk',        ad:dmUyeL('uye_mutfak.js.depo.donuk_urunler', 'Donuk Ürünler'),         ikon:'fa-snowflake' },
    { k:'bakkal',       ad:dmUyeL('uye_mutfak.js.depo.reyon_bakkal', 'Bakkaliye'),             ikon:'fa-basket-shopping' },
    { k:'temizlik',     ad:dmUyeL('uye_mutfak.js.depo.reyon_temizlik', 'Temizlik & Ev'),         ikon:'fa-spray-can-sparkles' }
  ];
  var ESLEME = [
    ['manav',    ['domates','biber','soğan','sogan','salatalık','salatalik','maydanoz','limon','mantar','patates','patlıcan','patlican','kabak','havuç','havuc','marul','roka','dereotu','nane','sarımsak','sarimsak','elma','muz','portakal','ıspanak','ispanak','pırasa','pirasa','lahana','brokoli','karnabahar','avokado','çilek','cilek','üzüm','uzum','zeytin','turp','kereviz','bezelye','fasulye taze','semizotu','tere','fesleğen','feslegen','incir','armut','şeftali','seftali','kayısı','kayisi','narenciye','misir taze','taze']],
    ['kasap',    ['kıyma','kiyma','et','tavuk','hindi','kuzu','dana','but','göğüs','gogus','pastırma','pastirma','sucuk','salam','jambon','sosis','ciğer','ciger','kanat','pirzola','kuşbaşı','kusbasi','balık','balik','hamsi','levrek','çipura','cipura','somon','karides','midye','kalamar','kuyruk yağı','kuyruk yagi']],
    ['sut',      ['süt','sut','yoğurt','yogurt','peynir','kaşar','kasar','lor','tereyağ','tereyag','krema','kaymak','ayran','yumurta','labne','çökelek','cokelek','margarin']],
    ['firin',    ['ekmek','lavaş','lavas','yufka','pide','bazlama','simit','galeta','tost ekmeği','baget','hamur']],
    ['bakliyat', ['pirinç','pirinc','bulgur','mercimek','nohut','fasulye','barbunya','makarna','şehriye','sehriye','irmik','un','nişasta','nisasta','yulaf','kuskus','couscous','kinoa','arpa','buğday','bugday','tarhana','mısır unu','misir unu']],
    ['baharat',  ['tuz','karabiber','pul biber','kimyon','kekik','nane kuru','sumak','tarçın','tarcin','zerdeçal','zerdecal','köri','kori','safran','vanilya','kabartma','maya','sos','ketçap','ketcap','mayonez','hardal','sirke','salça','salca','soya','limon suyu','zeytinyağı','zeytinyagi','ayçiçek','aycicek','yağ','yag','bal','pekmez','şeker','seker','tahin','susam','kakao','çikolata','cikolata','ceviz','fındık','findik','badem','antep fıstığ','antep fistig','fıstık','fistik','kuş üzümü','kus uzumu','kuru üzüm','kuru uzum','hindistan cevizi','jelatin','glikoz','baharat']],
    ['icecek',   ['su','maden suyu','soda','çay','cay','kahve','meyve suyu','kola','gazoz','şarap','sarap','bira']],
    ['donuk',    ['dondurulmuş','dondurulmus','donuk','dondurma']],
    ['temizlik', ['deterjan','sabun','bulaşık','bulasik','çamaşır','camasir','peçete','pecete','streç','strec','folyo','poşet','poset','pişirme kağıdı','pisirme kagidi']]
  ];
  function reyonBul(ad) {
    var a = String(ad || '').toLocaleLowerCase('tr');
    for (var i = 0; i < ESLEME.length; i++)
      for (var j = 0; j < ESLEME[i][1].length; j++)
        if (a.indexOf(ESLEME[i][1][j]) !== -1) return ESLEME[i][0];
    return 'bakkal';
  }
  function reyonKaydi(k) {
    for (var i = 0; i < REYONLAR.length; i++) if (REYONLAR[i].k === k) return REYONLAR[i];
    return REYONLAR[REYONLAR.length - 2];
  }

  var slugla = function (t) {
    return String(t || '').toLocaleLowerCase('tr')
      .replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g')
      .replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  };

  /* ═══ ALIŞVERİŞ LİSTELERİ · ŞEMA SÜRÜM 2 ═════════════════════════
     PARTİ 5 · madde 11 — TEK liste yerine LİSTE DİZİSİ.

     ŞEMA
       d.alisverisV2 = {
         s: 2,
         etkin: '<listeId>',
         listeler: [ { id, ad, olusturuldu, guncellendi, kalemler:[…] } ]
       }
     Kalem şeması DEĞİŞMEDİ: { id, ad, miktar, reyon, kaynak[], alindi,
     el, eklendi } — parti 4'ün yazdığı her kalem olduğu gibi taşınır.

     🔴 GÖÇ İDEMPOTENT. "İdempotent olmayan dönüşüm" bu deponun kayıtlı
        dersi: betik iki kez koşunca veri bozulur ve üç ölçüm birden
        yeşil kalır. Kapı `alisverisV2` varlığı; ikinci koşum hiçbir şey
        yapmaz.
     🔴 VERİ KAYBI YOK — eski `d.alisveris` dizisi SİLİNMEZ, yerinde
        yedek olarak durur (`d.alisverisGoc` göçün ne zaman ve kaç
        kalemle yapıldığını yazar). Göç sonrası okuma yolu yalnız
        `alisverisV2`; eski anahtar bir daha yazılmaz.
     🔴 GERİYE UYUMLU YÜZEY: `liste/ekle/cikar/isaretle/temizle/kalemVar`
        imzaları aynı kaldı ve ETKİN listeye çalışıyor. Parti 4'ün üç
        çağıranı (dm-p4-m.js M3a·M3b·M4) değiştirilmeden koşar.
        Hepsi isteğe bağlı SON argüman olarak `listeId` alır. */

  var GOC_AD = dmUyeL('uye_mutfak.js.depo.listem', 'Listem');          /* eski tek listenin göç adı (madde 11) */

  function yeniId(ad, mevcut) {
    var t = slugla(ad) || 'liste', k = t, n = 2;
    while (mevcut.indexOf(k) !== -1) { k = t + '-' + n; n++; }
    return k;
  }

  /* Depoyu sürüm 2'ye getirir ve v2 gövdesini döndürür. */
  function kok() {
    var d = hamOku();
    var v = d.alisverisV2;
    if (v && v.s === 2 && Array.isArray(v.listeler)) return { d: d, v: v };

    var eski = Array.isArray(d.alisveris) ? d.alisveris : [];
    var t = Date.now();
    v = { s: 2, etkin: 'listem',
          listeler: [ { id:'listem', ad:GOC_AD, olusturuldu:t, guncellendi:t,
                        kalemler: eski.slice() } ] };
    d.alisverisV2 = v;
    /* eski anahtar SİLİNMEZ — yedek. Göçün kaydı da düşülür. */
    d.alisverisGoc = { zaman:t, kalem:eski.length, ad:GOC_AD };
    hamYaz(d);
    return { d: d, v: v };
  }

  function v2Yaz(v, bolum, ayrinti) {
    var d = hamOku();
    d.alisverisV2 = v;
    var ok = hamYaz(d);
    yay(bolum || 'alisveris', Object.assign({ kalici:ok, listeler:v.listeler, etkin:v.etkin }, ayrinti || {}));
    return ok;
  }

  function listeBul(v, id) {
    for (var i = 0; i < v.listeler.length; i++) if (v.listeler[i].id === id) return v.listeler[i];
    return null;
  }
  /* Etkin liste HER ZAMAN vardır: silinmiş/boş durumda ilk liste, hiç
     liste yoksa göç adıyla bir tane doğar. "Özne yoksa kapı susar" —
     çağıranın elinde null kalmasın. */
  function etkinKayit(v) {
    var l = listeBul(v, v.etkin);
    if (l) return l;
    if (!v.listeler.length) {
      var t = Date.now();
      v.listeler.push({ id:'listem', ad:GOC_AD, olusturuldu:t, guncellendi:t, kalemler:[] });
    }
    v.etkin = v.listeler[0].id;
    return v.listeler[0];
  }
  function hedefKayit(v, listeId) {
    return (listeId ? listeBul(v, listeId) : null) || etkinKayit(v);
  }

  function ozet(l) {
    var alinan = 0;
    l.kalemler.forEach(function (k) { if (k.alindi) alinan++; });
    return { id:l.id, ad:l.ad, olusturuldu:l.olusturuldu, guncellendi:l.guncellendi,
             kalem:l.kalemler.length, alinan:alinan };
  }

  /* ── ÇOK LİSTE YÜZEYİ (parti 5) ─────────────────────────────────── */
  function listeler()      { var r = kok(); etkinKayit(r.v); return r.v.listeler.map(ozet); }
  function etkinListe()    { var r = kok(); return ozet(etkinKayit(r.v)); }
  function etkinSec(id) {
    var r = kok(); if (!listeBul(r.v, id)) return false;
    r.v.etkin = id; v2Yaz(r.v, 'alisveris', { eylem:'etkin', liste:id }); return true;
  }
  function listeAc(ad) {
    var r = kok(), t = Date.now();
    var kimlik = yeniId(ad, r.v.listeler.map(function (x) { return x.id; }));
    r.v.listeler.push({ id:kimlik, ad:String(ad || GOC_AD).trim() || GOC_AD,
                        olusturuldu:t, guncellendi:t, kalemler:[] });
    r.v.etkin = kimlik;
    v2Yaz(r.v, 'alisveris', { eylem:'liste-ac', liste:kimlik });
    return kimlik;
  }
  function listeAdlandir(id, ad) {
    var r = kok(), l = listeBul(r.v, id);
    if (!l) return false;
    var y = String(ad || '').trim(); if (!y) return false;
    l.ad = y; l.guncellendi = Date.now();
    v2Yaz(r.v, 'alisveris', { eylem:'liste-ad', liste:id }); return true;
  }
  function listeKopyala(id) {
    var r = kok(), l = listeBul(r.v, id);
    if (!l) return null;
    var t = Date.now();
    var kimlik = yeniId(l.ad + ' kopya', r.v.listeler.map(function (x) { return x.id; }));
    r.v.listeler.push({ id:kimlik, ad:l.ad + dmUyeL('uye_mutfak.js.depo.kopya_eki', ' (kopya)'), olusturuldu:t, guncellendi:t,
      kalemler: l.kalemler.map(function (k) {
        return { id:k.id, ad:k.ad, miktar:k.miktar, reyon:k.reyon,
                 kaynak:(k.kaynak || []).map(function (x) { return { ad:x.ad, slug:x.slug }; }),
                 alindi:false, el:!!k.el, eklendi:t };
      }) });
    v2Yaz(r.v, 'alisveris', { eylem:'liste-kopya', liste:kimlik });
    return kimlik;
  }
  function listeSil(id) {
    var r = kok(), n = r.v.listeler.filter(function (x) { return x.id !== id; });
    if (n.length === r.v.listeler.length) return false;
    r.v.listeler = n;
    if (r.v.etkin === id) r.v.etkin = n.length ? n[0].id : '';
    v2Yaz(r.v, 'alisveris', { eylem:'liste-sil', liste:id }); return true;
  }
  function listeKalem(id) {
    var r = kok(), l = id ? listeBul(r.v, id) : etkinKayit(r.v);
    return l ? l.kalemler.slice() : [];
  }

  /* ── PARTİ 4 YÜZEYİ — imza aynı, hedef ETKİN liste ───────────────── */
  function liste(listeId) { return listeKalem(listeId); }

  function kalemVar(ad, listeId) {
    var id = slugla(ad);
    return listeKalem(listeId).some(function (k) { return k.id === id; });
  }

  /* Kalem eklenir; AYNI kalem başka tariften de geliyorsa satır
     ÇOĞALTILMAZ — kaynak listesine eklenir ve miktar satırı büyür.
     (Sayfanın kendi cümlesi: "aynı malzeme tek satırda toplanır".) */
  function ekle(kalem, listeId) {
    var r = kok(), h = hedefKayit(r.v, listeId), l = h.kalemler;
    var id = slugla(kalem.ad), v = null;
    for (var i = 0; i < l.length; i++) if (l[i].id === id) { v = l[i]; break; }
    if (v) {
      var yeni = false;
      (kalem.kaynak || []).forEach(function (k) {
        if (!v.kaynak.some(function (x) { return x.slug === k.slug; })) { v.kaynak.push(k); yeni = true; }
      });
      if (kalem.miktar && v.miktar.indexOf(kalem.miktar) === -1) { v.miktar += ' + ' + kalem.miktar; yeni = true; }
      if (yeni) { h.guncellendi = Date.now(); v2Yaz(r.v, 'alisveris', { eylem:'ekle', liste:h.id }); }
      return { durum: yeni ? 'birlesti' : 'zaten', kalem: v, liste: h.id, listeAd: h.ad };
    }
    var rey = kalem.reyon || reyonBul(kalem.ad);
    v = { id:id, ad:kalem.ad, miktar:kalem.miktar || '', reyon:rey,
          kaynak:kalem.kaynak || [], alindi:false, el:!!kalem.el, eklendi:Date.now() };
    l.push(v); h.guncellendi = Date.now();
    v2Yaz(r.v, 'alisveris', { eylem:'ekle', liste:h.id });
    return { durum:'eklendi', kalem:v, liste:h.id, listeAd:h.ad };
  }
  function cikar(id, listeId) {
    var r = kok(), h = hedefKayit(r.v, listeId);
    var n = h.kalemler.filter(function (k) { return k.id !== id; });
    if (n.length === h.kalemler.length) return false;
    h.kalemler = n; h.guncellendi = Date.now();
    v2Yaz(r.v, 'alisveris', { eylem:'cikar', liste:h.id }); return true;
  }
  function isaretle(id, alindi, listeId) {
    var r = kok(), h = hedefKayit(r.v, listeId), d = false;
    h.kalemler.forEach(function (k) { if (k.id === id) { k.alindi = !!alindi; d = true; } });
    if (d) { h.guncellendi = Date.now(); v2Yaz(r.v, 'alisveris', { eylem:'isaret', liste:h.id }); }
    return d;
  }
  function temizle(yalnizAlinan, listeId) {
    var r = kok(), h = hedefKayit(r.v, listeId);
    h.kalemler = yalnizAlinan ? h.kalemler.filter(function (k) { return !k.alindi; }) : [];
    h.guncellendi = Date.now();
    v2Yaz(r.v, 'alisveris', { eylem:'temizle', liste:h.id });
  }

  /* ═══ GENEL BÖLÜM DEPOSU — B1 · L6 · A2 buradan yazar ══════════════ */
  function bolumOku(ad, vars) { var d = hamOku(); return (ad in d) ? d[ad] : vars; }
  function bolumYaz(ad, deger) { var d = hamOku(); d[ad] = deger; var ok = hamYaz(d); yay(ad, { deger:deger, kalici:ok }); return ok; }

  window.dmDepo = {
    maket: true,
    kalici: erisilebilir,
    REYONLAR: REYONLAR,
    slugla: slugla,
    reyonBul: reyonBul,
    reyonKaydi: reyonKaydi,
    liste: liste, ekle: ekle, cikar: cikar, isaretle: isaretle,
    temizle: temizle, kalemVar: kalemVar,
    /* çok liste — parti 5 · madde 11 */
    surum: 2,
    listeler: listeler, etkinListe: etkinListe, etkinSec: etkinSec,
    listeAc: listeAc, listeAdlandir: listeAdlandir,
    listeKopyala: listeKopyala, listeSil: listeSil, listeKalem: listeKalem,
    gocBilgisi: function () { return hamOku().alisverisGoc || null; },
    oku: bolumOku, yaz: bolumYaz
  };

  /* Başka sekmede değişirse bu sekme de haberdar olur. */
  window.addEventListener('storage', function (e) {
    if (e.key === ANAHTAR) yay('*', { disaridan:true });
  });

  /* ═══ TOAST ═══════════════════════════════════════════════════════
     dmToast('Listeye eklendi', { tip:'basarili', alt:'Domates · 1 kg',
                                  geri:{ metin:'Geri al', cb:fn } }) */
  var kap = null;
  function toastKap() {
    if (kap && document.body.contains(kap)) return kap;
    kap = document.querySelector('.dm-toast-kap');
    if (!kap) {
      kap = document.createElement('div');
      kap.className = 'dm-toast-kap';
      kap.setAttribute('role', 'status');
      kap.setAttribute('aria-live', 'polite');
      document.body.appendChild(kap);
    }
    return kap;
  }
  var IKON = { basarili:'fa-circle-check', hata:'fa-circle-exclamation', bilgi:'fa-circle-info' };
  window.dmToast = function (metin, se) {
    se = se || {};
    var tip = se.tip || 'basarili';
    var t = document.createElement('div');
    t.className = 'dm-toast ' + tip;
    var i = document.createElement('i');
    i.className = 'fa-solid ' + (IKON[tip] || IKON.bilgi);
    i.setAttribute('aria-hidden', 'true');
    var g = document.createElement('div');
    g.className = 'dm-toast-govde';
    var b = document.createElement('b'); b.textContent = metin; g.appendChild(b);
    if (se.alt) { var s = document.createElement('span'); s.textContent = se.alt; g.appendChild(s); }
    t.appendChild(i); t.appendChild(g);
    if (se.geri && typeof se.geri.cb === 'function') {
      var gb = document.createElement('button');
      gb.type = 'button'; gb.className = 'dm-toast-geri';
      gb.textContent = se.geri.metin || dmUyeL('uye_mutfak.js.depo.geri_al', 'Geri al');
      gb.addEventListener('click', function () { se.geri.cb(); kaldir(); });
      t.appendChild(gb);
    }
    var k = document.createElement('button');
    k.type = 'button'; k.className = 'dm-toast-kapat';
    k.setAttribute('aria-label', dmUyeL('uye_mutfak.js.depo.bildirimi_kapat', 'Bildirimi kapat'));
    k.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    k.addEventListener('click', kaldir);
    t.appendChild(k);
    toastKap().appendChild(t);
    var zaman = setTimeout(kaldir, se.sure || 4200);
    function kaldir() {
      clearTimeout(zaman);
      if (!t.parentNode) return;
      t.classList.add('cikis');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 180);
    }
    return { kapat: kaldir };
  };

  /* ═══ MODAL ═══════════════════════════════════════════════════════
     dmModal.ac(el) / .kapat(el) — odak tuzağı + Escape + geri dönüş.
     Perde tek: sayfada kaç modal olursa olsun bir `.dm-modal-ortu`. */
  var ortu = null, acikModal = null, oncekiOdak = null;
  function perde() {
    if (ortu && document.body.contains(ortu)) return ortu;
    ortu = document.querySelector('.dm-modal-ortu');
    if (!ortu) {
      ortu = document.createElement('div');
      ortu.className = 'dm-modal-ortu';
      document.body.appendChild(ortu);
    }
    ortu.addEventListener('click', function () { if (acikModal) window.dmModal.kapat(acikModal); });
    return ortu;
  }
  var ODAKLANIR = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  window.dmModal = {
    ac: function (el) {
      if (!el) return;
      oncekiOdak = document.activeElement;
      perde().classList.add('acik');
      el.classList.add('acik');
      el.removeAttribute('hidden');
      document.body.classList.add('dm-modal-acik');
      acikModal = el;
      var ilk = el.querySelector(ODAKLANIR);
      if (ilk) ilk.focus();
    },
    kapat: function (el) {
      el = el || acikModal;
      if (!el) return;
      el.classList.remove('acik');
      el.setAttribute('hidden', '');
      if (acikModal === el) acikModal = null;
      if (!acikModal) {
        perde().classList.remove('acik');
        document.body.classList.remove('dm-modal-acik');
      }
      if (oncekiOdak && oncekiOdak.focus) oncekiOdak.focus();
    },
    acikMi: function () { return !!acikModal; }
  };
  document.addEventListener('keydown', function (e) {
    if (!acikModal) return;
    if (e.key === 'Escape') { e.preventDefault(); window.dmModal.kapat(acikModal); return; }
    if (e.key !== 'Tab') return;
    var o = [].slice.call(acikModal.querySelectorAll(ODAKLANIR))
              .filter(function (x) { return x.offsetParent !== null; });
    if (!o.length) return;
    var ilk = o[0], son = o[o.length - 1];
    if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
    else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
  });
})();
