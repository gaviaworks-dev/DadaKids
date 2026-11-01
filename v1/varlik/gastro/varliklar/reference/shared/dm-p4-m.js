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
   AJAN M · MENÜLERİM + ALIŞVERİŞ — PARTİ 4
   ---------------------------------------------------------------------
   BAĞI lead attı; İÇERİĞİNİ yalnız kendi kulvarı yazar.
   KAYNAK BURASI: scripts/p4-varlik/dm-p4-m.js — ağaca kopyalanır.
   Bağlı olduğu sayfalar: g-menulerim.html · tarif__*.html (480) ·
   en__tarif__*.html (41).

   YÜKLEME SIRASI — `defer`, `gmenulerim-duzen.js`ten SONRA (ölçüldü:
   11664 ↔ 11667). Yani o betiğin kurduğu yüzey hazırken bağlanıyoruz.

   İÇİNDE NE VAR
     M1 · tarif havuzu süzgeci — çip duvarı → aranabilir açılır
     M2 · menü listesi kapalı tile satırı (aç/kapa · klavye · senkron)
     M3a· alışveriş panosu — dmDepo'dan GERÇEK liste
     M3b· tarif detayı malzeme satırı ↔ liste (kalıcı durum)

   🔴 `gmenulerim-duzen.js` BENİM KAYNAK DOSYAM DEĞİL ve ona
      DOKUNULMADI. O betiğin `durum` nesnesi IIFE içinde kapalı;
      dışarıdan erişilemiyor. Seçilen yol: onun çizdiği `#rpCips`
      kabını CSS ile SUSTUR, kendi yüzeyimi `.rp-tools`a KARDEŞ olarak
      kur, `.rp-card` görünürlüğünü kendim süz.
      Reddedilen yol: `#rpCips` tıklamalarını taklit etmek — o çizim
      her popup açılışında sıfırlanıyor ve taklit, kendi çizdiği
      düğmeye tıklayan bir ölçüm üretirdi ("ölçüm aracı ölçtüğünü
      değiştirir" deseninin ta kendisi).
   ===================================================================== */
(function () {
  'use strict';
  if (window.dmP4M) return;                       /* iki kez bağlanmaz */
  window.dmP4M = { surum: 1 };

  var EN = (document.documentElement.lang || 'tr').toLowerCase().indexOf('en') === 0;
  /* K2 (Beyar, 25 Eki · RU kapsam düzeltmesi): metin kabuk sözlüğünden (`arayuz_kabuk_js` → `kabuk_js.alisveris.*`; `KabukSozlugu`
     kaynak dil dışında her sayfaya basar). Sözlük yoksa önceki davranış AYNEN: TR sayfa TR, EN sayfa EN. Sayılı metin (p.n) sözlükte
     `tekil|çoğul` (EN/DE) ya da `bir|az|çok` (RU) biçimini taşıyabilir: biçim Intl.PluralRules ile seçilir. */
  function S(tr, en, k, p) {
    var s = null, els = k ? document.querySelectorAll('[data-l-js-kabuk], [data-l-js]') : [];
    for (var i = 0; i < els.length && s === null; i++) {
      try { var a = els[i].getAttribute('data-l-js'); var o = JSON.parse(a ? a : els[i].textContent); if (o && typeof o[k] === 'string') s = o[k]; } catch (e) { /* bozuk sözlük → yedek */ }
    }
    if (s === null) return EN ? en : tr;
    if (s.indexOf('|') >= 0) {
      var b = s.split('|'), n = Math.abs(Number(p && p.n)) || 0, c = 'other';
      try { c = new Intl.PluralRules(document.documentElement.lang || 'tr').select(n); } catch (e) { c = n === 1 ? 'one' : 'other'; }
      s = b.length >= 3 ? (c === 'one' ? b[0] : (c === 'few' ? b[1] : b[2])) : (c === 'one' ? b[0] : b[b.length - 1]);
    }
    return p ? s.split(':n').join(String(p.n)) : s;
  }
  function esc(v) { var d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; }
  function el(t, c, m) { var e = document.createElement(t); if (c) e.className = c; if (m != null) e.textContent = m; return e; }
  function toast(m, se) { if (window.dmToast) window.dmToast(m, se); }

  /* ═══════════════════════════════════════════════════════════════════
     M1 · TARİF HAVUZU SÜZGECİ
     -----------------------------------------------------------------
     KARAR (ölçülerek): ÇOKLU seçim. Gerekçe kaynağın kendi kipi —
     `tarifler.html` süzgecinde dört grubun dördü de `<input
     type="checkbox" name="…[]">` (ölçüldü: kategori 33 · beslenme 21 ·
     süre 6 · zorluk 5 kutu; `type="radio"` SIFIR). Havuzun bugünkü tek
     seçimi kaynaktan bir SAPMAYDI; "seçilenler çip olarak altında"
     isteği ancak çoklu seçimle bir şey ifade eder.
     Grup İÇİ VEYA, gruplar ARASI VE — kaynağın facet kipi.
     ═══════════════════════════════════════════════════════════════════ */

  /* Kademeler UYDURULMADI — `gmenulerim-duzen.js`ten BİREBİR alındı;
     o da `tarifler.html` süzgecinden hasat etmiş. Değiştirilmedi. */
  var SURE_KADEME = [{"ad":dmUyeL('uye_mutfak.js.sure_1', "15 dakikadan az"),"alt":0,"ust":15},{"ad":dmUyeL('uye_mutfak.js.sure_2', "15–30 dakika"),"alt":15,"ust":30},{"ad":dmUyeL('uye_mutfak.js.sure_3', "30–45 dakika"),"alt":30,"ust":45},{"ad":dmUyeL('uye_mutfak.js.sure_4', "45–60 dakika"),"alt":45,"ust":60},{"ad":dmUyeL('uye_mutfak.js.sure_5', "1–2 saat"),"alt":60,"ust":120},{"ad":dmUyeL('uye_mutfak.js.sure_6', "2 saatten uzun"),"alt":120,"ust":1000000000}];
  var ZORLUK_SIRA = ["Çok Kolay","Kolay","Orta","Zor","Ustalık Gerektirir"].map(function (z, i) { return dmUyeL('uye_mutfak.js.zorluk_' + (i + 1), z); });
  var BESLENME_AD = {"vegan":dmUyeL('uye_mutfak.js.m.beslenme_vegan', "Vegan"),"vejetaryen":dmUyeL('uye_mutfak.js.m.beslenme_vejetaryen', "Vejetaryen"),"glutensiz":dmUyeL('uye_mutfak.js.m.beslenme_glutensiz', "Glutensiz"),"protein-agirlikli":dmUyeL('uye_mutfak.js.m.protein_agirlikli', "Protein Ağırlıklı"),"az-yagli":dmUyeL('uye_mutfak.js.m.az_yagli', "Az Yağlı"),"glutenli":dmUyeL('uye_mutfak.js.m.beslenme_glutenli', "Glutenli"),"laktozsuz":dmUyeL('uye_mutfak.js.m.beslenme_laktozsuz', "Laktozsuz"),"sut-icermez":dmUyeL('uye_mutfak.js.m.sut_icermez', "Süt İçermez"),"yumurta-icermez":dmUyeL('uye_mutfak.js.m.yumurta_icermez', "Yumurta İçermez"),"seker-ilavesiz":dmUyeL('uye_mutfak.js.m.seker_ilavesiz', "Şeker İlavesiz"),"yuksek-lifli":dmUyeL('uye_mutfak.js.m.yuksek_lifli', "Yüksek Lifli"),"tam-tahilli":dmUyeL('uye_mutfak.js.m.tam_tahilli', "Tam Tahıllı"),"acili":dmUyeL('uye_mutfak.js.m.acili', "Acılı"),"baharatli":dmUyeL('uye_mutfak.js.m.baharatli', "Baharatlı"),"diyabete-uygun":dmUyeL('uye_mutfak.js.m.beslenme_diyabet', "Diyabete Uygun"),"kalp-dostu":dmUyeL('uye_mutfak.js.m.beslenme_kalp', "Kalp Dostu"),"dusuk-kalorili":dmUyeL('uye_mutfak.js.m.dusuk_kalorili', "Düşük Kalorili"),"pesketaryen":dmUyeL('uye_mutfak.js.m.beslenme_pesketaryen', "Pesketaryen"),"kuruyemis-icermez":dmUyeL('uye_mutfak.js.m.kuruyemis_icermez', "Kuruyemiş İçermez"),"dusuk-karbonhidratli":dmUyeL('uye_mutfak.js.m.dusuk_karbonhidratli', "Düşük Karbonhidratlı"),"ketojenik":dmUyeL('uye_mutfak.js.m.beslenme_keto', "Ketojenik")};

  var GRUPLAR = [
    { k:'kategori', ad:dmUyeL('uye_mutfak.js.m.grup_kategori', 'Kategori'), ara:dmUyeL('uye_mutfak.js.m.kategori_ara', 'Kategori ara…') },
    { k:'sure',     ad:dmUyeL('uye_mutfak.js.m.sure', 'Süre'),     ara:dmUyeL('uye_mutfak.js.m.sure_ara', 'Süre ara…')     },
    { k:'zorluk',   ad:dmUyeL('uye_mutfak.js.m.grup_zorluk', 'Zorluk'),   ara:dmUyeL('uye_mutfak.js.m.zorluk_ara', 'Zorluk ara…')   },
    { k:'beslenme', ad:dmUyeL('uye_mutfak.js.m.grup_beslenme', 'Beslenme'), ara:dmUyeL('uye_mutfak.js.m.beslenme_ara', 'Beslenme ara…') }
  ];

  function sureKademesi(dk) {
    if (dk == null) return '';
    for (var i = 0; i < SURE_KADEME.length; i++)
      if (dk > SURE_KADEME[i].alt && dk <= SURE_KADEME[i].ust) return SURE_KADEME[i].ad;
    return '';
  }

  /* Süzgeç DEĞERLERİ havuzun KENDİ kartlarından okunur — `tarifHavuzu()`
     ile birebir aynı kaynak ve aynı alanlar. Veri uydurulmuyor. */
  function tarifOlgulari() {
    var ix = {};
    document.querySelectorAll('article.menu-card[data-recipe-slug]').forEach(function (k) {
      var slug = k.getAttribute('data-recipe-slug');
      if (!slug || ix[slug]) return;
      var kapAd = k.querySelector('.mc-course');
      var kategori = kapAd ? ((kapAd.childNodes[1] || {}).textContent || '').trim() : '';
      var fs = k.querySelector('.mc-facts .fa-clock');
      var sp = fs && fs.parentNode.querySelector('.rf-txt');
      var mm = sp && sp.textContent.match(/(\d+)/);
      var fz = k.querySelector('.mc-facts .fa-gauge-simple');
      var zp = fz && fz.parentNode.querySelector('.rf-txt');
      ix[slug] = {
        kategori: kategori,
        sure: sureKademesi(mm ? Number(mm[1]) : null),
        zorluk: zp ? zp.textContent.trim() : '',
        beslenme: (k.getAttribute('data-beslenme') || '').split(/\s+/).filter(Boolean)
      };
    });
    return ix;
  }

  function m1() {
    var modal  = document.getElementById('rpModal');
    var araclar = modal && modal.querySelector('.rp-tools');
    var grid   = document.getElementById('rpGrid');
    var cipKap = document.getElementById('rpCips');
    if (!modal || !araclar || !grid || !cipKap) return null;

    var sec = { kategori:[], sure:[], zorluk:[], beslenme:[] };
    var olgu = {};
    var kutular = {};

    /* ── YÜZEY ── kanon K5: `.coklu-secim` > `.coklu-kutu` + `.acilir-yuzey` */
    /* İki şerit `.rp-tools`un DOĞRUDAN çocuğu olur — sarmalayıcı,
       arama kutusuyla aynı flex satırını imkânsız kılıyordu (ölçüldü). */
    var satir = el('div', 'rp-suz rp-suz-satir');
    satir.setAttribute('data-m-suz', '');
    satir.setAttribute('role', 'group');
    satir.setAttribute('aria-label', dmUyeL('uye_mutfak.js.m.tercih_suzgeci', 'Tercih süzgeci'));
    var cipSatir = el('div', 'rp-suz rp-suz-cipler');
    cipSatir.setAttribute('role', 'group');
    cipSatir.setAttribute('aria-label', dmUyeL('uye_mutfak.js.m.secili_suzgecler', 'Seçili süzgeçler'));

    GRUPLAR.forEach(function (g) {
      var kap = el('div', 'coklu-secim rp-suz-grup');
      kap.setAttribute('data-m-grup', g.k);
      var kutu = el('button', 'coklu-kutu');
      kutu.type = 'button';
      kutu.setAttribute('aria-haspopup', 'listbox');
      kutu.setAttribute('aria-expanded', 'false');
      kutu.setAttribute('aria-label', g.ad + dmUyeL('uye_mutfak.js.m.suzgeci', ' süzgeci'));
      var ad = el('span', 'rp-suz-ad', g.ad);
      var say = el('span', 'rp-suz-say', '0'); say.hidden = true;
      var ok = el('i', 'fa-solid fa-chevron-down coklu-ok'); ok.setAttribute('aria-hidden', 'true');
      kutu.appendChild(ad); kutu.appendChild(say); kutu.appendChild(ok);

      var pop = el('div', 'acilir-yuzey'); pop.hidden = true;
      var bas = el('div', 'acilir-bas'); bas.appendChild(document.createTextNode(g.ad));
      var temizle = el('button', null, dmUyeL('uye_mutfak.js.m.temizle', 'Temizle')); temizle.type = 'button';
      bas.appendChild(temizle);
      var araSatir = el('div', 'acilir-ara-satir');
      var araIkon = el('i', 'fa-solid fa-magnifying-glass'); araIkon.setAttribute('aria-hidden', 'true');
      var ara = el('input', 'acilir-arama');
      ara.type = 'text'; ara.autocomplete = 'off';
      ara.placeholder = g.ara; ara.setAttribute('aria-label', g.ara);
      araSatir.appendChild(araIkon); araSatir.appendChild(ara);
      var liste = el('div', 'acilir-liste');
      liste.setAttribute('role', 'listbox');
      liste.setAttribute('aria-multiselectable', 'true');
      liste.setAttribute('aria-label', g.ad);
      var bos = el('p', 'acilir-bos', dmUyeL('uye_mutfak.js.m.bu_aramaya_uyan_secenek_yok', 'Bu aramaya uyan seçenek yok.')); bos.hidden = true;
      pop.appendChild(bas); pop.appendChild(araSatir); pop.appendChild(liste); pop.appendChild(bos);
      kap.appendChild(kutu); kap.appendChild(pop);
      satir.appendChild(kap);

      kutular[g.k] = { kap:kap, kutu:kutu, ad:ad, say:say, pop:pop, ara:ara, liste:liste, bos:bos };

      kutu.addEventListener('click', function (e) { e.stopPropagation(); ac(g.k, pop.hidden); });
      temizle.addEventListener('click', function (e) {
        e.stopPropagation(); sec[g.k] = []; ciz(); suz();
      });
      ara.addEventListener('input', function () { araSuz(g.k); });
      ara.addEventListener('click', function (e) { e.stopPropagation(); });
      pop.addEventListener('click', function (e) { e.stopPropagation(); });
      kutu.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); ac(g.k, true);
          var ilk = liste.querySelector('.acilir-kalem:not([hidden])'); if (ilk) ilk.focus(); }
      });
      pop.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); ac(g.k, false); kutu.focus(); }
      });
    });

    var tumTemiz = el('button', 'cip rp-suz-temiz');
    tumTemiz.type = 'button';
    tumTemiz.innerHTML = dmUyeL('uye_mutfak.js.m.suzgeci_temizle', '<i class="fa-solid fa-xmark" aria-hidden="true"></i> Süzgeci temizle');
    tumTemiz.hidden = true;
    tumTemiz.addEventListener('click', function () {
      GRUPLAR.forEach(function (g) { sec[g.k] = []; }); ciz(); suz();
      satir.querySelector('.coklu-kutu').focus();      /* odak kaybolmasın */
    });
    /* 🔴 "Süzgeci temizle" AÇILIR ŞERİDİNE DEĞİL, ÇİP ŞERİDİNE konur.
       İlk yazımda kutuların yanındaydı: seçim yapılınca satır dolup
       düğme İKİNCİ SATIRA kırılıyordu ve dört kutunun hizası
       bozuluyordu (1440 karesinde gözle görüldü,
       rapor/ss/p4/alt/m1-alt-a.png'in ilk sürümü). Düğme zaten
       SEÇİMLERLE birlikte doğup ölüyor; yeri de onların yanı. */
    cipSatir.appendChild(tumTemiz);

    araclar.appendChild(satir);
    araclar.appendChild(cipSatir);
    document.addEventListener('click', function () { GRUPLAR.forEach(function (g) { ac(g.k, false); }); });

    /* 🔴 AÇILIR PANEL MODAL KABINDAN TAŞIYORDU. Beyar ekranda gördü,
       sonra ölçüldü (1440): dört kutunun SONUNCUSU (Beslenme)
         panel sağ kenarı 1279  ↔  modal sağ kenarı 1190   → 89px TAŞMA
       Panel kart ızgarasının üstüne biniyor ve alttaki kartın metnini
       kesiyordu. Sayaçlar ve "Temizle" aslında BASILIYORDU — panel
       kırpıldığı için görünmüyorlardı; ekran görüntüsünden "eksik"
       diye okumak yanlış teşhis olurdu, ölçüm düzeltti.

       Üç kural, üçü de ÖLÇÜMLE karar veriyor (sabit "sonuncu ise sağa
       yasla" DEĞİL — 390'da kutu sayısı ve sıra değişiyor):
         1 · sağa taşıyorsa kanonun `.saga` sınıfı (`left:auto;right:0`)
         2 · yükseklik modalın görünür alanını aşarsa panelin KENDİ
             `max-height`i kısılır (kanon zaten `overflow-y:auto`
             taşıyor; modal UZAMAZ)
         3 · yığılma: panel kartların üstünde, modal başlığının altında
             (CSS'te, `.rp-head`in katından düşük)
       Ölçüm panel GÖRÜNÜR olduktan SONRA yapılır: gizli elemanın
       kutusu 0'dır ("özne yoksa kapı susar"). */
    function yerlestir(b) {
      var pop = b.pop;
      pop.classList.remove('saga');
      pop.style.removeProperty('--rp-pop-y');
      var modal = document.getElementById('rpModal');
      if (!modal) return;
      var mr = modal.getBoundingClientRect();
      var pr = pop.getBoundingClientRect();
      if (pr.right > mr.right - 8) pop.classList.add('saga');
      /* Kalan dikey alan: panelin üstünden modalın altına. */
      var kalan = Math.max(160, Math.round(mr.bottom - pr.top - 16));
      pop.style.setProperty('--rp-pop-y', kalan + 'px');
    }
    function ac(k, acik) {
      GRUPLAR.forEach(function (g) {
        var b = kutular[g.k];
        var a = (g.k === k) ? !!acik : false;
        b.pop.hidden = !a;
        b.kutu.setAttribute('aria-expanded', a ? 'true' : 'false');
        if (a) yerlestir(b);
      });
    }
    function araSuz(k) {
      var b = kutular[k], q = b.ara.value.trim().toLocaleLowerCase('tr'), n = 0;
      [].forEach.call(b.liste.children, function (kl) {
        var g = !q || kl.getAttribute('data-etiket').toLocaleLowerCase('tr').indexOf(q) >= 0;
        kl.hidden = !g; if (g) n++;
      });
      b.bos.hidden = n > 0;
    }

    /* ── ADAYLAR ── `#rpGrid`teki kartlar. O ızgara `havuzCiz()`in
       çıktısı: menüde olan tarifler zaten düşmüş, arama zaten
       uygulanmış. Kendi süzgecim ONUN üstüne biner. */
    function adaylar() {
      return [].slice.call(grid.querySelectorAll('.rp-card[data-recipe-slug]'))
        .map(function (k) {
          var s = k.getAttribute('data-recipe-slug');
          return { el:k, slug:s, o:olgu[s] || { kategori:'', sure:'', zorluk:'', beslenme:[] } };
        });
    }
    function gecer(o, haric) {
      for (var i = 0; i < GRUPLAR.length; i++) {
        var g = GRUPLAR[i].k;
        if (g === haric || !sec[g].length) continue;
        if (g === 'beslenme') {
          if (!sec[g].some(function (v) { return (o.beslenme || []).indexOf(v) >= 0; })) return false;
        } else if (sec[g].indexOf(o[g]) < 0) return false;
      }
      return true;
    }

    /* Sayaç kendi grubunun seçimini HARİÇ tutar — bugünkü mantık aynen
       korundu (`cipGecer(t, haric)`). */
    function sayaclar(k) {
      var m = {};
      adaylar().forEach(function (a) {
        if (!gecer(a.o, k)) return;
        var d = (k === 'beslenme') ? (a.o.beslenme || []) : [a.o[k]];
        d.forEach(function (v) { if (v) m[v] = (m[v] || 0) + 1; });
      });
      return m;
    }

    function etiketle(k, v) { return k === 'beslenme' ? (BESLENME_AD[v] || v) : v; }

    function ciz() {
      GRUPLAR.forEach(function (g) {
        var b = kutular[g.k], say = sayaclar(g.k);
        var anahtar = Object.keys(say);
        /* seçili ama sayacı 0 olan değer de listede kalır — yoksa
           kullanıcı kendi seçimini geri alamaz */
        sec[g.k].forEach(function (v) { if (anahtar.indexOf(v) < 0) anahtar.push(v); });
        if (g.k === 'sure')        anahtar.sort(function (a, c) { return SURE_KADEME.map(function (x) { return x.ad; }).indexOf(a) - SURE_KADEME.map(function (x) { return x.ad; }).indexOf(c); });
        else if (g.k === 'zorluk') anahtar.sort(function (a, c) { return ZORLUK_SIRA.indexOf(a) - ZORLUK_SIRA.indexOf(c); });
        else anahtar.sort(function (a, c) { return (say[c] || 0) - (say[a] || 0) || etiketle(g.k, a).localeCompare(etiketle(g.k, c), 'tr'); });

        b.liste.innerHTML = '';
        anahtar.forEach(function (v) {
          var n = say[v] || 0, secili = sec[g.k].indexOf(v) >= 0;
          var kl = el('button', 'acilir-kalem' + (secili ? ' aktif' : ''));
          kl.type = 'button';
          kl.setAttribute('role', 'option');
          kl.setAttribute('aria-selected', secili ? 'true' : 'false');
          kl.setAttribute('data-deger', v);
          kl.setAttribute('data-etiket', etiketle(g.k, v));
          if (!n && !secili) kl.disabled = true;
          var ik = el('i', secili ? 'fa-solid fa-square-check' : 'fa-regular fa-square');
          ik.setAttribute('aria-hidden', 'true');
          kl.appendChild(ik);
          kl.appendChild(el('span', null, etiketle(g.k, v)));
          kl.appendChild(el('span', 'yan', String(n)));
          kl.addEventListener('click', function (e) {
            e.stopPropagation();
            var i = sec[g.k].indexOf(v);
            if (i < 0) sec[g.k].push(v); else sec[g.k].splice(i, 1);
            ciz(); suz();
            var y = kutular[g.k].liste.querySelector('[data-deger="' + CSS.escape(v) + '"]');
            if (y) y.focus();
          });
          b.liste.appendChild(kl);
        });
        araSuz(g.k);
        /* B KİPİ için kutu içi çipler — varsayılanda CSS ile gizli;
           `.rp-tools[data-m1-alt="b"]` açar. Alternatif ölçülebilir
           kalsın diye üretiliyor, A kipinde çizime GİRMİYOR. */
        [].slice.call(b.kutu.querySelectorAll('.rp-suz-kutu-cip')).forEach(function (x) { x.remove(); });
        sec[g.k].forEach(function (v) {
          var c = el('span', 'coklu-cip rp-suz-kutu-cip', etiketle(g.k, v));
          b.kutu.insertBefore(c, b.say);
        });
        var n = sec[g.k].length;
        b.say.textContent = String(n); b.say.hidden = !n;
        b.ad.textContent = g.ad;
        b.kutu.setAttribute('aria-label', g.ad + dmUyeL('uye_mutfak.js.m.suzgeci', ' süzgeci') + (n ? ' — ' + n + dmUyeL('uye_mutfak.js.m.secili', ' seçili') : ''));
      });

      /* Seçilen çip şeridi. 🔴 `innerHTML=''` ŞERİDİ TEMİZLERKEN
         "Süzgeci temizle" DÜĞMESİNİ DE SİLİYORDU (düğme şeridin içinde
         yaşıyor): ikinci çizimden sonra düğme DOM'dan düşüyor, kapı
         `null.click()` ile ÇÖKÜYORDU. Yalnız çipler kaldırılır. */
      [].slice.call(cipSatir.querySelectorAll('.coklu-cip')).forEach(function (x) { x.remove(); });
      var toplam = 0;
      GRUPLAR.forEach(function (g) {
        sec[g.k].forEach(function (v) {
          toplam++;
          var c = el('span', 'coklu-cip');
          c.appendChild(el('span', null, etiketle(g.k, v)));
          var x = el('button', null); x.type = 'button';
          x.setAttribute('aria-label', etiketle(g.k, v) + dmUyeL('uye_mutfak.js.m.suzgecini_kaldir', ' süzgecini kaldır'));
          x.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
          x.addEventListener('click', function () {
            sec[g.k].splice(sec[g.k].indexOf(v), 1); ciz(); suz();
          });
          c.appendChild(x);
          cipSatir.insertBefore(c, tumTemiz);
        });
      });
      tumTemiz.hidden = toplam === 0;
    }

    /* ── SÜZME ── kart SİLİNMEZ, görünürlüğü kapanır. */
    var bosKart = null;
    function suz() {
      var a = adaylar(), gorunur = 0;
      a.forEach(function (x) {
        var g = gecer(x.o, null);
        if (g) { x.el.removeAttribute('data-m-suz-disi'); gorunur++; }
        else x.el.setAttribute('data-m-suz-disi', '');
      });
      if (bosKart && bosKart.parentNode) bosKart.parentNode.removeChild(bosKart);
      bosKart = null;
      if (a.length && !gorunur) {
        /* Boş hâl kalıbı `havuzCiz()`in kendi `.rp-empty`si — uydurulmadı. */
        bosKart = el('div', 'rp-empty');
        bosKart.innerHTML = '<i class="fa-solid fa-bowl-rice" aria-hidden="true"></i>' +
          dmUyeL('uye_mutfak.js.m.sectigin_suzgeclere_uyan_tarif_yok', '<p>Seçtiğin süzgeçlere uyan tarif yok.</p>');
        grid.appendChild(bosKart);
      }
    }

    /* ── POPUP AÇILIŞI ── `havuzAc()` `durum.sec`i sıfırlıyor; bizimki
       de sıfırlanmalı, yoksa iki süzgeç ayrı hatırlar. */
    var acikti = modal.classList.contains('show');
    new MutationObserver(function () {
      var a = modal.classList.contains('show');
      if (a === acikti) return;
      acikti = a;
      if (!a) return;
      olgu = tarifOlgulari();
      GRUPLAR.forEach(function (g) { sec[g.k] = []; kutular[g.k].ara.value = ''; });
      ac(null, false);
      ciz(); suz();
    }).observe(modal, { attributes:true, attributeFilter:['class'] });

    /* ── IZGARA YENİDEN ÇİZİLDİ ── (arama · yeniden açılış). */
    new MutationObserver(function () { ciz(); suz(); })
      .observe(grid, { childList:true });

    olgu = tarifOlgulari();
    ciz(); suz();
    return { sec:sec, ciz:ciz, suz:suz, satir:satir, cipSatir:cipSatir };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M2 · MENÜ TILE — AÇ / KAPA
     ═══════════════════════════════════════════════════════════════════ */
  function tileOlgu(menuEl) {
    /* Olgular menünün KENDİ araç çubuğundan okunur; `menuTazele()`
       orayı güncelliyor, biz de oradan besleniyoruz — "aynı sayı →
       kaynağa bak": tek tanık, iki yüzey. */
    var mbm = menuEl.querySelectorAll('.menu-bar-meta .mbm');
    function b(i) { var e = mbm[i] && mbm[i].querySelector('b'); return e ? e.textContent.trim() : ''; }
    var kart = menuEl.querySelectorAll('article.menu-card').length;
    return { kap:b(0) || (kart + ' kap'), sure:b(1), kisi:b(2), kart:kart };
  }
  function tileTazele(menuEl) {
    var t = menuEl.querySelector(':scope > .mnl-tile');
    if (!t) return;
    var o = tileOlgu(menuEl);
    var f = t.querySelector('.fiyat b'); if (f) f.textContent = String(o.kart);
    var s = t.querySelector('[data-mnl-sure]'); if (s) s.textContent = o.sure;
    var k = t.querySelector('[data-mnl-kisi]'); if (k) k.textContent = o.kisi;
    var ad = menuEl.querySelector('.md-title-text');
    var tb = t.querySelector('.bilgi b');
    if (ad && tb) tb.textContent = ad.textContent.trim();
  }
  function tileBagla(menuEl) {
    var t = menuEl.querySelector(':scope > .mnl-tile');
    if (!t || t.dataset.mBagli) return;
    t.dataset.mBagli = '1';
    t.addEventListener('click', function () {
      var acik = menuEl.classList.toggle('mnl-kapali') === false;
      t.setAttribute('aria-expanded', acik ? 'true' : 'false');
      if (acik) {
        /* Revize 5 · madde 17: akordeon — aynı anda en fazla bir menü açık. Tetik <button>
           olduğu için Enter/Space de bu dinleyiciden geçer. */
        [].forEach.call(document.querySelectorAll('article.menu-detail:not(.mnl-kapali)'), function (oteki) {
          if (oteki === menuEl) return;
          oteki.classList.add('mnl-kapali');
          var ot = oteki.querySelector(':scope > .mnl-tile');
          if (ot) ot.setAttribute('aria-expanded', 'false');
        });
        tileTazele(menuEl);
      }
    });
    /* kart eklenip çıktıkça satır olguları senkron kalsın */
    var set = menuEl.querySelector('.menu-set');
    if (set) new MutationObserver(function () { tileTazele(menuEl); })
      .observe(set, { childList:true, subtree:true, characterData:true });
  }
  function m2() {
    var tumu = [].slice.call(document.querySelectorAll('article.menu-detail'));
    if (!tumu.length) return null;
    tumu.forEach(tileBagla);
    /* `kopyala()` bütün article'ı KLONLUYOR — klonun tile kimliği
       çiftlenir. Panoyu izle, yeni gelen article'ı yeniden anahtarla. */
    var sayac = 0;
    document.querySelectorAll('[data-pane]').forEach(function (pano) {
      new MutationObserver(function (ml) {
        ml.forEach(function (m) {
          [].forEach.call(m.addedNodes, function (n) {
            if (n.nodeType !== 1 || !n.matches || !n.matches('article.menu-detail')) return;
            var t = n.querySelector(':scope > .mnl-tile');
            if (t) {
              var yeniK = 'mnl-kopya-' + (++sayac);
              var hedef = [];
              ['.md-head', '.menu-bar-sec', '.menu-set'].forEach(function (s, i) {
                var e = n.querySelector(':scope > ' + s);
                if (e) { e.id = yeniK + '-' + i; hedef.push(e.id); }
              });
              t.setAttribute('aria-controls', hedef.join(' '));
              delete t.dataset.mBagli;
            }
            n.classList.add('mnl-kapali');
            if (t) t.setAttribute('aria-expanded', 'false');
            tileBagla(n); tileTazele(n);
          });
        });
      }).observe(pano, { childList:true, subtree:true });
    });
    return { tile: document.querySelectorAll('.mnl-tile').length };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M3a · ALIŞVERİŞ PANOSU — dmDepo'dan GERÇEK liste
     -----------------------------------------------------------------
     🔴 Sayfa bugüne kadar 21 malzeme · "%38 tamamlandı" uydurma sabit
        veri basıyordu. Hepsi düştü; her sayı `dmDepo.liste()`den
        hesaplanıyor. Liste boşsa BOŞ HÂL görünür — sıfır gerçek bir
        sayıdır.
     ═══════════════════════════════════════════════════════════════════ */
  function m3a() {
    var liste = document.getElementById('shopList');
    if (!liste || !window.dmDepo) return null;
    var D = window.dmDepo;
    var bos     = document.getElementById('alBos');
    var sayac   = document.getElementById('alCount');
    var ssTotal = document.getElementById('ssTotal');
    var ssDone  = document.getElementById('ssDone');
    var ssBar   = document.getElementById('ssBar');
    var ssPct   = document.getElementById('ssPct');
    var ssSub   = document.getElementById('ssSub');
    var alPrint = document.getElementById('alPrint');
    var bantSayac = document.getElementById('alBantSayac');
    var clearDone = document.getElementById('clearDone');
    var addName = document.getElementById('addName');
    var addQty  = document.getElementById('addQty');
    var addReyon= document.getElementById('addReyon');
    var addBtn  = document.getElementById('addBtn');
    var paylasBtn = document.getElementById('alShare');
    var paylasPop = document.getElementById('alSharePop');

    function ciz() {
      var l = D.liste();
      var toplam = l.length;
      var alinan = l.filter(function (k) { return k.alindi; }).length;
      var yuzde = toplam ? Math.round(alinan / toplam * 100) : 0;

      /* reyon sırası deponun kendi REYONLAR dizisinden — prototipin
         `#addReyon` seçenek SIRASI (uydurulmadı). */
      var kova = {}, reyonSay = 0;
      l.forEach(function (k) { (kova[k.reyon] = kova[k.reyon] || []).push(k); });

      liste.innerHTML = '';
      D.REYONLAR.forEach(function (r) {
        var ks = kova[r.k];
        if (!ks || !ks.length) return;
        reyonSay++;
        var grup = el('div', 'shop-group');
        grup.setAttribute('data-reyon', r.k);
        var bas = el('div', 'shop-ghead');
        var i = el('i', 'fa-solid ' + r.ikon); i.setAttribute('aria-hidden', 'true');
        bas.appendChild(i);
        bas.appendChild(el('b', null, r.ad));
        bas.appendChild(el('span', 'gcnt', ks.length + ' ' + dmUyeL('uye_mutfak.menu.kalem', 'kalem')));
        var kap = el('div', 'shop-items');
        ks.forEach(function (k) {
          var lb = el('label', 'shop-item' + (k.alindi ? ' done' : ''));
          lb.setAttribute('data-id', k.id);
          var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!k.alindi;
          cb.setAttribute('aria-label', k.ad + dmUyeL('uye_mutfak.js.m.alindi_olarak_isaretle', ' — alındı olarak işaretle'));
          cb.addEventListener('change', function () { D.isaretle(k.id, cb.checked); });
          var cbx = el('span', 'cbx'); cbx.setAttribute('aria-hidden', 'true');
          var ad = el('span', 'si-name');
          ad.appendChild(document.createTextNode(k.ad));
          if (k.kaynak && k.kaynak.length) {
            ad.appendChild(el('small', 'si-src', k.kaynak.map(function (x) { return x.ad; }).join(' · ')));
          } else if (k.el) {
            ad.appendChild(el('small', 'si-src', dmUyeL('uye_mutfak.js.m.elle_eklendi', 'Elle eklendi')));
          }
          var mik = el('span', 'si-qty', k.miktar || '—');
          var sil = el('button', 'si-del'); sil.type = 'button';
          sil.setAttribute('aria-label', k.ad + dmUyeL('uye_mutfak.js.m.kalemini_listeden_cikar', ' kalemini listeden çıkar'));
          sil.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
          sil.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            var yedek = k;
            D.cikar(k.id);
            toast(dmUyeL('uye_mutfak.js.m.listeden_cikarildi', 'Listeden çıkarıldı'), { alt:k.ad, geri:{ cb:function () { D.ekle(yedek); } } });
          });
          /* Public revize R6: tarifteki sponsorlu malzemeden gelen kalem sözlükteki sponsorlu karo gibi markanın logosuyla
             çizilir (reklamsız görünümde de). İşlev aynı: işaretlenince `done` → üstü çizili. Renk bir DEĞER (sunucudan). */
          if (k.sponsor) {
            lb.className += ' al-sponsorlu';
            lb.setAttribute('data-al-sponsor', k.sponsor.marka);
            if (k.sponsor.renk) lb.style.setProperty('--al-sp-renk', k.sponsor.renk);
            if (k.sponsor.dugme) lb.style.setProperty('--al-sp-dugme', k.sponsor.dugme);
            var logo = el('span', 'al-sp-logo');
            if (k.sponsor.logo) { var im = el('img'); im.src = k.sponsor.logo; im.alt = k.sponsor.marka; im.loading = 'lazy'; logo.appendChild(im); }
            else logo.textContent = k.sponsor.marka;
            var hap = el('span', 'al-sp-hap', dmUyeL('uye_mutfak.js.m.sponsorlu', 'Sponsorlu'));
            lb.appendChild(cb); lb.appendChild(cbx); lb.appendChild(logo); lb.appendChild(ad); lb.appendChild(hap); lb.appendChild(mik); lb.appendChild(sil);
          } else {
          lb.appendChild(cb); lb.appendChild(cbx); lb.appendChild(ad); lb.appendChild(mik); lb.appendChild(sil);
          }
          kap.appendChild(lb);
        });
        grup.appendChild(bas); grup.appendChild(kap);
        liste.appendChild(grup);
      });

      /* Boş hâl ↔ liste: ikisi aynı anda görünmez. `hidden` tek kaynak. */
      if (bos) bos.hidden = toplam > 0;
      liste.hidden = toplam === 0;
      if (sayac) sayac.textContent = toplam + ' ' + dmUyeL('uye_mutfak.menu.kalem', 'kalem');
      if (ssTotal) ssTotal.textContent = String(toplam);
      if (ssDone)  ssDone.textContent  = String(alinan);
      if (ssPct)   ssPct.textContent   = String(yuzde);
      if (ssSub)   ssSub.textContent   = toplam + ' kalem · ' + reyonSay + ' reyon';
      /* 🔴 Bu bir DEĞER, markup değil: donörün `style="width:0%"`ı
         satır içi yazılmıştı, buraya çalışma zamanına taşındı. */
      if (ssBar) { ssBar.style.width = yuzde + '%';
        var p = ssBar.parentNode;
        if (p) { p.setAttribute('role','progressbar'); p.setAttribute('aria-valuenow', String(yuzde));
                 p.setAttribute('aria-valuemin','0'); p.setAttribute('aria-valuemax','100');
                 p.setAttribute('aria-label',dmUyeL('uye_mutfak.js.m.listenin_tamamlanma_orani', 'Listenin tamamlanma oranı')); } }
      /* Bandın "Listedeki malzeme" sayacı — aynı tek tanıktan.
         (Uydurma "21" enjektörde kimliğe bağlandı.) */
      if (bantSayac) bantSayac.textContent = String(toplam);
      if (clearDone) clearDone.disabled = alinan === 0;
      if (alPrint)   alPrint.disabled   = toplam === 0;

      /* pano hapları — GERÇEK sayaç */
      var hap = document.getElementById('alHaplar');
      if (hap) {
        var kaynak = {};
        l.forEach(function (k) { (k.kaynak || []).forEach(function (x) { kaynak[x.slug] = 1; }); });
        hap.innerHTML =
          '<span class="galeri-hap"><i class="fa-solid fa-basket-shopping hap-kazanildi"></i> <b>' + toplam + dmUyeL('uye_mutfak.js.m.malzeme_hap', '</b> malzeme</span>', {n: toplam}) +
          '<span class="galeri-hap"><i class="fa-solid fa-circle-check hap-kazanildi"></i> <b>' + alinan + dmUyeL('uye_mutfak.js.m.alindi', '</b> alındı</span>') +
          '<span class="galeri-hap"><i class="fa-solid fa-hourglass-half hap-yolda"></i> <b>' + (toplam - alinan) + dmUyeL('uye_mutfak.js.m.kaldi', '</b> kaldı</span>') +
          '<span class="galeri-hap"><i class="fa-solid fa-utensils hap-olcusuz"></i> <b>' + Object.keys(kaynak).length + dmUyeL('uye_mutfak.js.m.tariften_geldi', '</b> tariften geldi</span>', {n: Object.keys(kaynak).length});
      }
    }

    if (addBtn) addBtn.addEventListener('click', function () {
      var ad = (addName && addName.value || '').trim();
      if (!ad) { if (addName) addName.focus(); toast(dmUyeL('uye_mutfak.js.m.kalem_adi_gerekli', 'Kalem adı gerekli'), { tip:'hata' }); return; }
      var s = D.ekle({ ad:ad, miktar:(addQty && addQty.value || '').trim(),
                       reyon:(addReyon && addReyon.value) || undefined, el:true, kaynak:[] });
      if (addName) addName.value = ''; if (addQty) addQty.value = '';
      toast(s.durum === 'eklendi' ? dmUyeL('uye_mutfak.js.m.listeye_eklendi', 'Listeye eklendi') : dmUyeL('uye_mutfak.js.m.listede_zaten_vardi_birlestirildi', 'Listede zaten vardı, birleştirildi'),
            { alt:ad, geri:s.durum === 'eklendi' ? { cb:function () { D.cikar(s.kalem.id); } } : null });
      if (addName) addName.focus();
    });
    if (addName) addName.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addBtn && addBtn.click(); }
    });
    if (clearDone) clearDone.addEventListener('click', function () {
      var yedek = D.liste().filter(function (k) { return k.alindi; });
      if (!yedek.length) return;
      D.temizle(true);
      toast(yedek.length + dmUyeL('uye_mutfak.js.m.isaretli_kalem_silindi', ' işaretli kalem silindi'), {
        geri:{ cb:function () { yedek.forEach(function (k) { D.ekle(k); D.isaretle(k.id, true); }); } } });
    });
    function yazdir() {
      document.body.classList.add('dm-liste-yazdir');
      window.print();
    }
    window.addEventListener('afterprint', function () {
      document.body.classList.remove('dm-liste-yazdir');
    });
    if (alPrint) alPrint.addEventListener('click', yazdir);
    if (paylasBtn && paylasPop) {
      paylasBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var a = paylasPop.hidden;
        paylasPop.hidden = !a;
        paylasBtn.setAttribute('aria-expanded', a ? 'true' : 'false');
      });
      paylasPop.addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('click', function () {
        paylasPop.hidden = true; paylasBtn.setAttribute('aria-expanded', 'false');
      });
      function listeMetni() {
        return D.liste().map(function (k) {
          return '• ' + k.ad + (k.miktar ? ' — ' + k.miktar : '');
        }).join('\n');
      }
      var wa = paylasPop.querySelector('[data-share="wa"]');
      var pdf = paylasPop.querySelector('[data-share="pdf"]');
      if (wa) wa.addEventListener('click', function () {
        /* Donörün `href="#"` yer tutucusu DEĞİL: gerçek paylaşım
           niyeti, gerçek listeyle. Boşken tıklanamaz. */
        var m = listeMetni();
        if (!m) { toast(dmUyeL('uye_mutfak.js.m.listen_bos', 'Listen boş'), { tip:'bilgi' }); return; }
        wa.href = 'https://wa.me/?text=' + encodeURIComponent(dmUyeL('uye_mutfak.js.m.wa_baslik', 'Alışveriş listem') + '\n' + m);
      });
      if (pdf) pdf.addEventListener('click', function () { paylasPop.hidden = true; yazdir(); });
      var kopyala = paylasPop.querySelector('[data-share="copy"]');
      if (kopyala) kopyala.addEventListener('click', function () {
        var m = listeMetni();
        if (!m) { toast(dmUyeL('uye_mutfak.js.m.listen_bos', 'Listen boş'), { tip:'bilgi' }); paylasPop.hidden = true; return; }
        if (navigator.clipboard) navigator.clipboard.writeText(m).then(
          function () { toast(dmUyeL('uye_mutfak.js.m.liste_panoya_kopyalandi', 'Liste panoya kopyalandı'), { alt:D.liste().length + ' ' + dmUyeL('uye_mutfak.menu.kalem', 'kalem') }); },
          function () { toast(dmUyeL('uye_mutfak.js.m.panoya_kopyalanamadi', 'Panoya kopyalanamadı'), { tip:'hata' }); });
        else toast(dmUyeL('uye_mutfak.js.m.bu_tarayici_panoya_kopyalamiyor', 'Bu tarayıcı panoya kopyalamıyor'), { tip:'hata' });
        paylasPop.hidden = true;
      });
    }

    document.addEventListener('dm-depo', function (e) {
      if (!e.detail || (e.detail.bolum !== 'alisveris' && e.detail.bolum !== '*')) return;
      ciz();
    });
    ciz();
    return { ciz:ciz };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M3b · TARİF DETAYI — MALZEME SATIRI ↔ LİSTE
     -----------------------------------------------------------------
     🔴 TUZAK (deponun kayıtlı dersi + parti 3 A): `.ing-add`
        `<form onclick="event.stopPropagation()">` İÇİNDE. Delegasyon
        `document`e ULAŞMAZ — düğmeye DOĞRUDAN bağlanır ve form'un
        `submit`i `preventDefault` edilir, yoksa sayfa yeniden yüklenir.
     ═══════════════════════════════════════════════════════════════════ */
  function satirKalemi(satir) {
    var n = satir.querySelector('.in');
    if (!n) return null;
    var c = n.cloneNode(true);
    c.querySelectorAll('small').forEach(function (s) { s.remove(); });
    var ad = c.textContent.trim().replace(/\s+/g, ' ');
    if (!ad) return null;
    /* 🔴 Miktar porsiyona göre DEĞİŞİR — okuma ANINDA okunur, önbelleğe
       alınmaz (aksi hâlde porsiyon artırılınca eski miktar eklenirdi). */
    var q = satir.querySelector('.iq');
    var mik = q ? q.textContent.trim().replace(/\s+/g, ' ') : '';
    var h1 = document.querySelector('h1');
    var baslik = h1 ? h1.textContent.trim().replace(/\s+/g, ' ') : '';
    var slug = (location.pathname.split('/').pop() || '')
      .replace(/^en__/, '').replace(/^tarif__/, '').replace(/\.html$/, '');
    return { ad:ad, miktar:mik, kaynak: baslik ? [{ slug:slug, ad:baslik }] : [] };
  }

  function m3b() {
    var dugmeler = [].slice.call(document.querySelectorAll('.ing-add'));
    var hepsi = document.getElementById('addAllBtn');
    if (!dugmeler.length && !hepsi) return null;
    if (!window.dmDepo) return null;
    var D = window.dmDepo;

    /* Form gönderimi kesilir — düğme `type="submit"`. */
    document.querySelectorAll('.ing-acts form, .ing-foot form').forEach(function (f) {
      if (f.dataset.mBagli) return;
      f.dataset.mBagli = '1';
      f.addEventListener('submit', function (e) { e.preventDefault(); });
    });

    function durumTazele() {
      dugmeler.forEach(function (b) {
        var satir = b.closest('.ing-row');
        var k = satir && satirKalemi(satir);
        var v = k && D.kalemVar(k.ad);
        b.classList.toggle('listede', !!v);
        b.setAttribute('aria-pressed', v ? 'true' : 'false');
        b.title = v ? S('Alışveriş listesinden çıkar', 'Remove from shopping list', 'kabuk_js.alisveris.listeden_cikar')
                    : S('Alışveriş listesine ekle', 'Add to shopping list', 'kabuk_js.alisveris.listeye_ekle');
        b.setAttribute('aria-label', b.title);
      });
    }

    dugmeler.forEach(function (b) {
      if (b.dataset.mBagli) return;
      b.dataset.mBagli = '1';
      b.setAttribute('data-m-bagli', '1');
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var satir = b.closest('.ing-row');
        var k = satir && satirKalemi(satir);
        if (!k) return;
        if (D.kalemVar(k.ad)) {
          D.cikar(D.slugla(k.ad));
          toast(S('Listeden çıkarıldı', 'Removed from list', 'kabuk_js.alisveris.cikarildi'),
                { alt:k.ad, geri:{ metin:S('Geri al','Undo', 'kabuk_js.alisveris.geri_al'), cb:function () { D.ekle(k); } } });
        } else {
          var s = D.ekle(k);
          toast(s.durum === 'birlesti' ? S('Listede vardı, miktar eklendi', 'Already listed — amount merged', 'kabuk_js.alisveris.birlesti')
                                       : S('Listeye eklendi', 'Added to list', 'kabuk_js.alisveris.eklendi'),
                { alt:k.ad + (k.miktar ? ' · ' + k.miktar : ''),
                  geri:{ metin:S('Geri al','Undo', 'kabuk_js.alisveris.geri_al'), cb:function () { D.cikar(s.kalem.id); } } });
        }
      });
    });

    if (hepsi && !hepsi.dataset.mBagli) {
      hepsi.dataset.mBagli = '1';
      hepsi.setAttribute('data-m-bagli', '1');
      hepsi.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var eklenen = [], zaten = 0;
        [].slice.call(document.querySelectorAll('.ing-row')).forEach(function (satir) {
          var k = satirKalemi(satir);
          if (!k) return;
          if (D.kalemVar(k.ad)) { zaten++; return; }
          var s = D.ekle(k);
          if (s.durum === 'eklendi') eklenen.push(s.kalem.id);
        });
        if (!eklenen.length) {
          toast(S('Hepsi listende zaten var', 'Everything is already on your list', 'kabuk_js.alisveris.hepsi_var'),
                { tip:'bilgi', alt: S(zaten + ' malzeme', zaten + ' ingredients', 'kabuk_js.alisveris.js.n_malzeme', { n: zaten }) });
          return;
        }
        toast(S(eklenen.length + ' malzeme listeye eklendi', eklenen.length + ' ingredients added', 'kabuk_js.alisveris.js.n_eklendi', { n: eklenen.length }),
              { alt: zaten ? S(zaten + ' tanesi zaten vardı', zaten + ' were already there', 'kabuk_js.alisveris.js.n_zaten_vardi', { n: zaten }) : null,
                geri:{ metin:S('Geri al','Undo', 'kabuk_js.alisveris.geri_al'), cb:function () { eklenen.forEach(function (i) { D.cikar(i); }); } } });
      });
    }

    document.addEventListener('dm-depo', function (e) {
      if (!e.detail || (e.detail.bolum !== 'alisveris' && e.detail.bolum !== '*')) return;
      durumTazele();
    });
    /* Porsiyon değişince satırın miktarı değişir; DURUM adla tutuluyor,
       ad değişmediği için işaret kalır — yine de yeniden okunur. */
    var kap = document.getElementById('ingList');
    if (kap) new MutationObserver(durumTazele).observe(kap, { subtree:true, characterData:true, childList:true });
    durumTazele();
    return { ingAdd:dugmeler.length, addAll:!!hepsi };
  }


  /* ═══════════════════════════════════════════════════════════════════
     ORTAK · MALZEME SÖZLÜĞÜ
     -----------------------------------------------------------------
     🔴 VERİ UYDURULMAZ. `gastro-tarif-adimlari.json` canlı donörün
     tarif sayfalarından hasat edilmiş 65 tarif · 506 malzeme ve
     `gmenulerim-duzen.js`in KENDİ kullandığı kaynak — M4 ve M6 aynı
     tanıktan besleniyor ("aynı sayı → kaynağa bak"in doğru yönü:
     iki yüzey aynı sayıyı basıyorsa aynı KAYNAKTAN basmalı).
     ═══════════════════════════════════════════════════════════════════ */
  var _malzemeSoz = null;
  function malzemeler() {
    if (!_malzemeSoz) _malzemeSoz = fetch('varliklar/reference/shared/gastro-tarif-adimlari.json',
      { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });          /* null = OKUNAMADI, {} DEĞİL */
    return _malzemeSoz;
  }
  function miktarMetni(m) {
    if (m.miktar == null) return '';
    var s = String(Math.round(m.miktar * 100) / 100);
    return m.birim ? s + ' ' + m.birim : s;
  }
  /* Menünün kaplarını gezer; her kap için sözlükten malzeme çeker.
     Sözlükte OLMAYAN kap için satır BASILMAZ, adı `eksik`e yazılır. */
  function menuMalzemesi(menuEl, soz) {
    var kalem = [], eksik = [];
    [].slice.call(menuEl.querySelectorAll('article.menu-card[data-recipe-slug]')).forEach(function (k) {
      var slug = k.getAttribute('data-recipe-slug');
      var bas = k.querySelector('.mc-body h3 a');
      var ad = bas ? bas.textContent.trim().replace(/\s+/g, ' ') : slug;
      var mz = (soz[slug] || {}).malzeme || [];
      if (!mz.length) { eksik.push(ad); return; }
      mz.forEach(function (m) {
        kalem.push({ ad: m.ad, miktar: miktarMetni(m), kaynak: [{ slug: slug, ad: ad }] });
      });
    });
    return { kalem: kalem, eksik: eksik };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M4 · "ALIŞVERİŞ LİSTESİ OLUŞTUR" → dmDepo
     -----------------------------------------------------------------
     ÖNCE ölçüldü: düğme `.mnl-panel`ini açıyor (33 satır) ama
     `dmDepo.liste()` 0 → 0; toast yok. Yani özet çıkıyor, LİSTE
     doğmuyor — L3'ün "g-menulerim#alisveris o listeyi gösterir"
     cümlesinin yarısı eksikti.

     🔴 `gmenulerim-duzen.js` BENİM DOSYAM DEĞİL: paneli o açıyor,
        ben AYNI düğmeye İKİNCİ bir dinleyici bağlıyorum. Panel
        SİLİNMİYOR — özet onun, depoya yazmak benim.

     🔴 HER TIKLAMADA yazılır, panelin açık/kapalı olmasına BAKILMAZ.
        Sebep ölçüldü: `kopyala()` article'ı klonlarken `data-mnl="1"`
        niteliği de kopyalanıyor ve `menuBagla` klonu ATLIYOR — klon
        menünün çubuk düğmeleri ÖLÜ (kaynakta kusur, bildirildi).
        Panel varlığına bağlansaydım klonlarda ben de ölürdüm.
        Depo zaten BİRLEŞTİRİYOR: ikinci tık satır çoğaltmaz, toast
        "hepsi zaten listende" der. Sonuç her tıklamada DOĞRU.
     ═══════════════════════════════════════════════════════════════════ */
  function m4() {
    var dugmeler = [].slice.call(document.querySelectorAll('.menu-bar-acts [data-mnl-eylem="liste"]'));
    if (!dugmeler.length || !window.dmDepo) return null;
    var D = window.dmDepo;

    dugmeler.forEach(function (b) {
      if (b.dataset.m4) return;
      b.dataset.m4 = '1';
      b.setAttribute('data-m4-bagli', '1');
      b.addEventListener('click', function () {
        var menuEl = b.closest('article.menu-detail');
        if (!menuEl) return;
        var adEl = menuEl.querySelector('.md-title-text');
        var menuAd = adEl ? adEl.textContent.trim() : '';
        malzemeler().then(function (soz) {
          if (!soz) {                       /* okunamadı — SAYI UYDURMA */
            toast(dmUyeL('uye_mutfak.js.m.malzeme_listesi_okunamadi', 'Malzeme listesi okunamadı'), { tip:'hata',
              alt:dmUyeL('uye_mutfak.js.m.baglanti_yokken_menuden_liste_cikarilamiyor', 'Bağlantı yokken menüden liste çıkarılamıyor') });
            return;
          }
          var v = menuMalzemesi(menuEl, soz);
          var eklenen = [], zaten = 0, birlesen = 0;
          v.kalem.forEach(function (k) {
            var s = D.ekle(k);
            if (s.durum === 'eklendi') eklenen.push(s.kalem.id);
            else if (s.durum === 'birlesti') birlesen++;
            else zaten++;
          });
          var alt = [];
          if (birlesen) alt.push(birlesen + dmUyeL('uye_mutfak.js.m.satir_birlesti', ' satır birleşti', {n: birlesen}));
          if (zaten) alt.push(zaten + dmUyeL('uye_mutfak.js.m.kalem_zaten_vardi', ' kalem zaten vardı', {n: zaten}));
          if (v.eksik.length) alt.push(v.eksik.length + dmUyeL('uye_mutfak.js.m.kabin_malzeme_verisi_yok', ' kabın malzeme verisi yok', {n: v.eksik.length}));
          if (!eklenen.length) {
            toast(v.kalem.length
                    ? dmUyeL('uye_mutfak.js.m.bu_menunun_malzemeleri_zaten_listende', 'Bu menünün malzemeleri zaten listende')
                    : dmUyeL('uye_mutfak.js.m.bu_menunun_malzeme_verisi_yok', 'Bu menünün malzeme verisi yok'),
                  { tip:'bilgi', alt: alt.join(' · ') || menuAd });
            return;
          }
          toast(eklenen.length + dmUyeL('uye_mutfak.js.m.malzeme_listene_eklendi', ' malzeme listene eklendi'),
            { alt: (menuAd ? menuAd + (alt.length ? ' · ' : '') : '') + alt.join(' · '),
              geri: { metin:dmUyeL('uye_mutfak.js.m.geri_al', 'Geri al'), cb:function () { eklenen.forEach(function (i) { D.cikar(i); }); } } });
        });
      });
    });
    return { dugme: dugmeler.length };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M5 · ÖLÜ SÜZGEÇ ÇİPLERİ
     -----------------------------------------------------------------
     ÖNCE ölçüldü: `#gunluk` 5 + `#ozel-gun` 3 = SEKİZ çip; tıklamak
     hiçbir şey yapmıyor (menü sayısı değişmiyor, `aria-pressed`
     dönmüyor, veri niteliği 0). `.cip.suzgec` dinleyicisi yalnız ajan
     A'nın dosyalarında ve bu sayfada YÜKLÜ DEĞİL.

     🔴 BAŞKA KULVARIN DİNLEYİCİSİNE GÜVENİLMEDİ — kendi dinleyicim.
     🔴 Değerler enjektörde SAYFANIN KENDİ SAYILARINA karşı doğrulandı
        (bkz. gastro-p4-ajan-m.mjs §M5); burada yalnız okunuyor.
     🔴 `classList.toggle(ad, kosul)` İKİ ARGÜMANLI ÇAĞRILMAZ —
        ikinci argüman `undefined` gelirse toggle TAKAS eder ve her çip
        aktif kalır, `aria-pressed` yine doğru basar (deponun kayıtlı
        dersi). Sınıf `add`/`remove` ile açık açık yazılıyor.
     ═══════════════════════════════════════════════════════════════════ */
  function m5() {
    var kaplar = [].slice.call(document.querySelectorAll('.cipler'))
      .filter(function (k) { return k.querySelector('.cip.suzgec[data-suz-deger]'); });
    if (!kaplar.length) return null;
    var kurulan = [];

    kaplar.forEach(function (kap) {
      var pano = kap.closest('[data-pane]');
      if (!pano || kap.dataset.m5) return;
      kap.dataset.m5 = '1';
      var cipler = [].slice.call(kap.querySelectorAll('.cip.suzgec[data-suz-deger]'));
      var secili = '';

      /* Boş hâl — kanonun `.bos-durum`u; yeni bileşen açılmadı. */
      var bos = document.createElement('div');
      bos.className = 'bos-durum kart-ici mnl-suz-bos';
      bos.hidden = true;
      bos.setAttribute('role', 'status');
      bos.innerHTML = '<span class="bos-ikon"><i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i></span>' +
        dmUyeL('uye_mutfak.js.m.bu_suzgecle_menu_yok_sectigin_suzgece', '<h3>Bu süzgeçle menü yok</h3><p>Seçtiğin süzgece uyan menü bulunamadı. ') +
        dmUyeL('uye_mutfak.js.m.tumu_ne_dokunarak_listeyi_geri_getirebilirsi', '“Tümü”ne dokunarak listeyi geri getirebilirsin.</p>');
      var sonMenu = [].slice.call(pano.querySelectorAll('article.menu-detail')).pop();
      if (sonMenu && sonMenu.parentNode) sonMenu.parentNode.insertBefore(bos, sonMenu.nextSibling);

      function menuler() {
        return [].slice.call(pano.querySelectorAll('article.menu-detail'));
      }
      /* 🔴 `ciz()` DOM'a yazıyor ve gözlemci DOM'u dinliyor: ilk
         çizimde çip etiketi `appendChild` ile doğuyor ve gözlemciyi
         tetikliyor. İkinci çizimde metin düğümü zaten var (yalnız
         `nodeValue` değişir, childList değil) ve döngü kendiliğinden
         duruyor — ama bayrak açıkça yazıldı, kendiliğindenliğe
         güvenilmedi. */
      var cizimde = false;
      function ciz() {
        if (cizimde) return 0;
        cizimde = true;
        try { return cizGovde(); } finally { cizimde = false; }
      }
      function cizGovde() {
        var hepsi = menuler();
        var gorunur = 0;
        hepsi.forEach(function (m) {
          var uyar = !secili || m.getAttribute('data-suz') === secili;
          if (uyar) { m.classList.remove('mnl-suz-disi'); gorunur++; }
          else m.classList.add('mnl-suz-disi');
        });
        /* SAYAÇLAR GERÇEK — o anki DOM'dan, markup'tan değil. */
        cipler.forEach(function (c) {
          var d = c.getAttribute('data-suz-deger');
          var n = d ? hepsi.filter(function (m) { return m.getAttribute('data-suz') === d; }).length
                    : hepsi.length;
          var etiket = (c.getAttribute('data-suz-etiket') ||
            (function () { var t = c.textContent.trim().replace(/\s+\d+$/, '').trim();
                           c.setAttribute('data-suz-etiket', t); return t; })());
          var son = c.lastChild;
          if (son && son.nodeType === 3) son.nodeValue = ' ' + etiket + ' ' + n;
          else c.appendChild(document.createTextNode(' ' + etiket + ' ' + n));
          var aktif = (d || '') === secili;
          if (aktif) c.classList.add('aktif'); else c.classList.remove('aktif');
          c.setAttribute('aria-pressed', aktif ? 'true' : 'false');
        });
        bos.hidden = gorunur > 0;
        return gorunur;
      }

      cipler.forEach(function (c) {
        c.addEventListener('click', function () {
          var d = c.getAttribute('data-suz-deger') || '';
          secili = (secili === d) ? '' : d;      /* ikinci tık Tümü'ye döner */
          ciz();
          /* 🔴 TEK KAYNAK · M5 ↔ M7. Süzgeç `.mnl-suz-disi` ile gizliyor,
             sayfalama `hidden`/`.mnl-gizli` ile: İKİ BAĞIMSIZ GÖRÜNÜRLÜK
             SİSTEMİ vardı ve M7 SÜZÜLMEMİŞ nüfusu sayfalıyordu — 1. sayfada
             "5 kart" gösteriliyor ama ekranda 1 kart kalıyordu. Artık M7'nin
             nüfusu = süzgeçten geçenler; süzgeç değişince 1. sayfaya döner.
             🔴 Haber MutationObserver'dan DEĞİL tıklamadan veriliyor: gözlemci
             M7'nin kendi çizimini de görür ve iki sistem birbirini tetikler. */
          var pk = pano.getAttribute('data-pane');
          if (pk && window.dmMnlListe && window.dmMnlListe.sifirla) window.dmMnlListe.sifirla(pk);
        });
      });
      /* Menü klonlanınca/çıkarılınca sayaçlar gerçeği söylemeye devam etsin */
      new MutationObserver(function () { ciz(); })
        .observe(pano, { childList: true, subtree: true });
      ciz();
      kurulan.push({ pano: pano.getAttribute('data-pane'), cip: cipler.length });
    });
    return { kap: kurulan };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M6 · HAFTALIK PANONUN "MALZEME" HAPI
     -----------------------------------------------------------------
     Sayı artık ETKİN PLANIN kendi tariflerinden hesaplanıyor.
     ÖLÇÜLDÜ: markup'ta yazan 21 hiçbir kaynaktan türetilemiyordu —
     etkin planın 7 tarifinin ayrık malzemesi 44, alışveriş listesi 0.
     🔴 Sözlük OKUNAMAZSA sayı basılmaz, HAP GİZLENİR: yanlış sayı
        göstermektense hiç göstermemek.
     ═══════════════════════════════════════════════════════════════════ */
  function m6() {
    var el2 = document.getElementById('haftaMalzemeSayac');
    if (!el2) return null;
    var hap = el2.closest('.galeri-hap');
    var pano = document.querySelector('[data-pane="haftalik"]');
    if (!pano) return null;
    /* "Etkin plan" — eyebrow metninden okunur, sıraya güvenilmez. */
    var etkin = [].slice.call(pano.querySelectorAll('article.menu-detail')).filter(function (m) {
      var e = m.querySelector('.md-head .eyebrow');
      return e && /etkin plan/i.test(e.textContent);
    })[0];
    if (!etkin) { if (hap) hap.hidden = true; return { etkin:false }; }

    function tazele() {
      return malzemeler().then(function (soz) {
        if (!soz) { if (hap) hap.hidden = true; return null; }
        var v = menuMalzemesi(etkin, soz);
        var ayrik = {};
        v.kalem.forEach(function (k) { ayrik[window.dmDepo ? window.dmDepo.slugla(k.ad) : k.ad] = 1; });
        var n = Object.keys(ayrik).length;
        el2.textContent = String(n);
        if (hap) hap.hidden = false;
        return { sayi: n, eksikKap: v.eksik.length };
      });
    }
    var sz = tazele();
    /* Plandan kap eklenip çıkarıldıkça sayı gerçeği söylemeye devam etsin */
    var set = etkin.querySelector('.menu-set');
    if (set) new MutationObserver(function () { tazele(); })
      .observe(set, { childList: true, subtree: true });
    return { etkin: true, soz: sz };
  }

  /* ── KUR ─────────────────────────────────────────────────────────── */
  function kur() {
    window.dmP4M.m1  = m1();
    window.dmP4M.m2  = m2();
    window.dmP4M.m3a = m3a();
    window.dmP4M.m3b = m3b();
    window.dmP4M.m4  = m4();
    window.dmP4M.m5  = m5();
    window.dmP4M.m6  = m6();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();

/* ═══════════════════════════════════════════════════════════════════
   M7 · SEKME BAŞINA ARAMA + SAYFALAMA (g-menulerim · ALTI SEKME)
   -------------------------------------------------------------------
   Beyar isteği: "#gunluk dahil TÜM sekmelere sayfalama + arama."

   ÖLÇÜLEN TABAN (rapor/p4/menu-arama-once.json · 1440 ve 390):
     sekme        özne                       adet   arama  sayfalama
     gunluk       article.menu-detail          6      yok     yok
     haftalik     article.menu-detail          3      yok     yok
     ozel-gun     article.menu-detail          4      yok     yok
     taslak       tbody tr                     3      yok     yok
     paylastigim  article.menu-detail          3      yok     yok
     alisveris    .shop-item              DİNAMİK     yok     yok

   🔴 ÖZNE SEKMEDEN SEKMEYE DEĞİŞİYOR ve bu bir kusur değil, sayfanın
      kendi taksonomisi: menü sekmeleri SATIR (`article.menu-detail`),
      taslak sekmesi TABLO, alışveriş sekmesi LİSTE KALEMİ. Tek bir
      seçiciye zorlamak "denetimin öznesi kayar" kusurunu koda taşırdı;
      her sekme kendi öznesini bildiriyor.

   🔴 `alisveris` DİNAMİK: kalemler `dmDepo`dan doğuyor. `dm-depo`
      olayında yeniden dizinleniyor, yoksa arama bayat liste süzerdi.

   🔴 YENİ BİLEŞEN AÇILMADI:
      arama      → ortak `.ie-arama` (`dm-p4.css`, ikon hizası düzeltilmiş)
      sayfalama  → kanon `dm-pagi` (`.pagi` · `.pg` · `.pg.active` ·
                   `.pg.arrow` · `.pg-dots` · `.pagi-note`)
      boş hâl    → sayfanın kendi boş hâl dili

   🔴 SAYFALAMA `<a href>` DEĞİL `<button>`: sayfa değişimi aynı
      sayfada oluyor, gidilecek bir adres YOK. Kanonun `.pg` sınıfları
      aynen kullanılıyor; `href` uydurmak ölü bağ üretmek olurdu.

   🔴 SAYFA BOYU 5 — ve sayfalama YALNIZ birden çok sayfa varken
      basılıyor. Tek sayfalık bir listenin altına "1" yazan bir gezinti
      gürültüdür ve kullanıcıya yanlış bir çokluk vaat eder.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var SAYFA_BOYU = 5;

  var SEKME = {
    'gunluk':      { ozne:'article.menu-detail', ad:dmUyeL('uye_mutfak.js.m.menu', 'menü'),   yerTutucu:dmUyeL('uye_mutfak.js.m.menu_adi_ya_da_tarif', 'Menü adı ya da tarif') },
    'haftalik':    { ozne:'article.menu-detail', ad:dmUyeL('uye_mutfak.js.m.ad_plan', 'plan'),   yerTutucu:dmUyeL('uye_mutfak.js.m.plan_adi_ya_da_tarif', 'Plan adı ya da tarif') },
    'ozel-gun':    { ozne:'article.menu-detail', ad:dmUyeL('uye_mutfak.js.m.menu', 'menü'),   yerTutucu:dmUyeL('uye_mutfak.js.m.menu_adi_ya_da_tarif', 'Menü adı ya da tarif') },
    'paylastigim': { ozne:'article.menu-detail', ad:dmUyeL('uye_mutfak.js.m.menu', 'menü'),   yerTutucu:dmUyeL('uye_mutfak.js.m.menu_adi_ya_da_tarif', 'Menü adı ya da tarif') },
    'taslak':      { ozne:'tbody tr',            ad:dmUyeL('uye_mutfak.js.m.ad_taslak', 'taslak'), yerTutucu:dmUyeL('uye_mutfak.js.m.taslak_adi', 'Taslak adı') },
    'alisveris':   { ozne:'.shop-item',          ad:dmUyeL('uye_mutfak.js.m.ad_kalem', 'kalem'),  yerTutucu:dmUyeL('uye_mutfak.js.m.malzeme_adi', 'Malzeme adı'), dinamik:true }
  };

  var KAYIT = {};

  function metin(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr'); }

  /* ═══ SÖZLEŞME · PANO KENDİ ÖZNESİNİ BİLDİREBİLİR ═══════════════════
     Lead `#alisveris`i "çok liste" modeline çevirecek ve öznesi
     değişecek. `data-mnl-ozne` / `data-mnl-ad` / `data-mnl-yer-tutucu`
     panoda varsa `SEKME` tablosundaki VARSAYILANI EZER. Böylece yeni
     sekme biçimi bu dosyayı düzenlemeden bildirilebilir — "denetimin
     öznesi kayar" kusurunun tersi: özneyi sekme kendi söyler.
     ═══════════════════════════════════════════════════════════════════ */
  /* C1 2. tur: sekme adı EN sözlükte 'tekil|çoğul' (`list|lists`); sayaç sayıya göre, cümle çoğulla. TR adında '|' yok. */
  function adSec(ad, n) { var b = String(ad || '').split('|'); var bi = (function (x) { if (b.length < 3 || typeof document === 'undefined' || typeof Intl === 'undefined') return -1; var pr = new Intl.PluralRules(document.documentElement.lang || 'tr'); if (pr.resolvedOptions().pluralCategories.indexOf('few') < 0) return -1; x = Math.abs(Number(x)) || 0; if (x !== Math.floor(x)) return 1; var k = pr.select(x); return k === 'one' ? 0 : (k === 'few' ? 1 : 2); })(n); return bi >= 0 ? b[bi] : (n === 1 ? b[0] : b[b.length - 1]); }

  function tanimla(anahtar, taban) {
    var v = taban || SEKME[anahtar] || {};
    var t = { ozne: v.ozne, ad: v.ad, yerTutucu: v.yerTutucu, dinamik: !!v.dinamik };
    var pano = document.querySelector('[data-pane="' + anahtar + '"]');
    if (pano) {
      var o = pano.getAttribute('data-mnl-ozne');
      var a = pano.getAttribute('data-mnl-ad');
      var y = pano.getAttribute('data-mnl-yer-tutucu');
      if (o) t.ozne = o;
      if (a) t.ad = a;
      if (y) t.yerTutucu = y;
    }
    return t.ozne ? t : null;
  }

  /* Sayfalanan KAP — çubuk ve sayfalama onun DOĞRUDAN çocuğu olur.

     🔴 İLK İKİ YAZIM DA ÇUBUĞU SAYFA KABININ DIŞINA KOYDU ve kusuru
     sayı DEĞİL GÖZ yakaladı: DOM ölçümü "araclar:true" diyordu, ekranda
     çubuk viewport'un sol kenarına yapışıktı (x=0), sayfanın kendi
     içerik kabı ise x=132. Kök: ata bulunuyor ama ekleme onun ÖNÜNE
     yapılıyordu; oysa çubuk kabın İÇİNDE, listenin üstünde durmalı. */
  function kapBul(ozneler, pano, dinamik) {
    /* 🔴 PANO KENDİ KABINI BİLDİREBİLİR — `[data-mnl-cubuk-kap]`.

       ⚠ AD ÇAKIŞMASI ÖLÇÜLDÜ: ilk yazım `[data-mnl-kap]` sordu ve
       ağaçta o ad ZATEN TUTULU — `g-menulerim.html`de **220** kez,
       menü kartlarının içindeki tarif eylem bağlarında
       (`data-mnl-menu` + `data-mnl-kap` = "hangi menüde hangi tarif").
       `querySelector` ilk eşleşeni döndürdüğü için çubuk KAPALI bir
       menü kartının içine kuruldu: dört sekmede çubuk yüksekliği 0,
       arama görünmez, çizim sayacı 900 ms'de 30→41 (döngü).
       Ad `data-mnl-cubuk-kap`. Çakışan ad KABUL EDİLMİYOR — sorulmuyor
       bile; "kanon adı davranış çağırır".
       ÖLÇÜLEN KUSUR (lead · `#alisveris`): pano İKİ bölüm taşıyor
       (`section[data-p5-listeler]` = liste listesi, `section.al-body` =
       GİZLİ detay ekranı). Yüklemede özne sayısı 0 (kartları
       `dm-p5-l.js` sonradan çiziyor), `.shop-list` yedeği ise GİZLİ
       bölümün içinde: çubuk yanlış bölümde doğuyor, ekranda arama da
       sayfalama da YOK. Bildirilen kap özne 0 iken de çapayı DOĞRU
       bölüme koyar — "özne yoksa kapı susar"ın DOM karşılığı.
       Bildirim VARSA `.wrap` tahminini EZER: tahmin, bildirimin üstüne
       çıkamaz. */
    var bildirilen = pano.querySelector('[data-mnl-cubuk-kap]');
    if (bildirilen) {
      /* Çubuk kabın İÇİNE değil ÖNÜNE, aynı bölümün içine (lead'in
         tarifi): kap kendi liste ızgarası, çubuk onun kardeşi.
         Sayfalama da aynı çapadan: kap TEK BLOK sayıldığı için
         `sonBlok()` onu döndürür ve sayfalama kabın ARDINA iner —
         özne 0 iken bile yer doğrudur. */
      var ust = bildirilen.closest('.wrap');
      var kapUst = (ust && ust !== bildirilen) ? ust : bildirilen.parentNode;
      if (kapUst) return { kap: kapUst, ilk: bildirilen, bildirilen: true };
    }
    var ilk = ozneler[0] || (dinamik ? pano.querySelector('.shop-list') : null);
    if (!ilk) return null;
    var wrap = ilk.closest('.wrap');
    if (wrap) return { kap: wrap, ilk: ilk };
    var a = ilk.parentNode;
    for (var i = 1; i < ozneler.length; i++) {
      while (a && !a.contains(ozneler[i])) a = a.parentNode;
    }
    if (!a || !a.parentNode) return null;
    return { kap: a.parentNode, ilk: ilk };
  }

  /* `el`i içeren, `kap`ın DOĞRUDAN çocuğu olan blok. */
  function blok(kap, el) {
    var d = el;
    while (d && d.parentNode !== kap) d = d.parentNode;
    return d;
  }

  function pagiCiz(nav, sayfa, toplamSayfa, git) {
    nav.innerHTML = '';
    if (toplamSayfa < 2) { nav.hidden = true; return; }
    nav.hidden = false;
    function dugme(etiket, hedef, sinif, etiketMetni) {
      var e = document.createElement('button');
      e.type = 'button';
      e.className = 'pg' + (sinif ? ' ' + sinif : '');
      e.innerHTML = etiket;
      if (etiketMetni) e.setAttribute('aria-label', etiketMetni);
      if (hedef == null) { e.disabled = true; e.setAttribute('aria-disabled', 'true'); }
      else e.addEventListener('click', function () { git(hedef); });
      nav.appendChild(e);
      return e;
    }
    dugme('<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>',
      sayfa > 1 ? sayfa - 1 : null, 'arrow', dmUyeL('uye_mutfak.js.m.onceki_sayfa', 'Önceki sayfa'));
    for (var i = 1; i <= toplamSayfa; i++) {
      if (toplamSayfa > 7 && i > 2 && i < toplamSayfa - 1 && Math.abs(i - sayfa) > 1) {
        if (nav.lastChild && nav.lastChild.className !== 'pg-dots') {
          var d = document.createElement('span');
          d.className = 'pg-dots'; d.setAttribute('aria-hidden', 'true'); d.textContent = '…';
          nav.appendChild(d);
        }
        continue;
      }
      if (i === sayfa) {
        var a = document.createElement('span');
        a.className = 'pg active'; a.setAttribute('aria-current', 'page'); a.textContent = i;
        nav.appendChild(a);
      } else dugme(String(i), i, '', dmUyeL('uye_mutfak.js.m.n_sayfa', ':n. sayfa', {n: i}));
    }
    dugme('<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>',
      sayfa < toplamSayfa ? sayfa + 1 : null, 'arrow', dmUyeL('uye_mutfak.js.m.sonraki_sayfa', 'Sonraki sayfa'));
  }

  function sekmeKur(anahtar, tanimGiris) {
    var pano = document.querySelector('[data-pane="' + anahtar + '"]');
    if (!pano) return null;
    if (pano.getAttribute('data-mnl-liste') === '1') return KAYIT[anahtar] || null;

    var tanim = tanimla(anahtar, tanimGiris);
    if (!tanim) return null;

    var ozneler = [].slice.call(pano.querySelectorAll(tanim.ozne));
    /* Dinamik sekmede özne SONRADAN doğar; kap markupta bildirilmiş
       olmalı, yoksa kurulum ERTELENİR — uydurma kap açılmaz. */
    var kb = kapBul(ozneler, pano, tanim.dinamik);
    if (!kb) return null;
    var kap = kb.kap;
    /* Bildirilen kapta özne HENÜZ yoksa çubuk kabın BAŞINA girer
       (`insertBefore(x, null)` = sona ekler; kap boşken ikisi aynı).
       Bildirilmemiş kapta çapa bulunamazsa kurulum ERTELENİR —
       uydurma yer açılmaz. */
    var ustBlok = kb.ilk ? blok(kap, kb.ilk) : null;
    if (!ustBlok && !kb.bildirilen) return null;

    pano.setAttribute('data-mnl-liste', '1');

    /* ── ARAÇ ÇUBUĞU ─────────────────────────────────────────────────
       🔴 `<label class="alan-etiket">Bu sekmede ara</label>` KALKTI:
       çip şeridi ile arama AYNI SATIRDA duracak, etiket satırı ikinci
       bir satır doğuruyordu. Erişilebilirlik DÜŞMEDİ — yer tutucu tek
       başına etiket değildir, girdiye `aria-label` yazıldı. */
    var araclar = document.createElement('div');
    araclar.className = 'mnl-araclar';
    araclar.setAttribute('data-mnl-araclar', anahtar);
    var kimlik = 'mnlAra-' + anahtar;
    araclar.innerHTML =
      '<div class="ie-arama">' +
        '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
        '<input class="alan-girdi" id="' + kimlik + '" type="search" autocomplete="off" ' +
               'aria-label="' + dmUyeL('uye_mutfak.js.m.bu_sekmede_ara', 'Bu sekmede ara') + '" placeholder="' + tanim.yerTutucu + '">' +
        '<button class="ie-arama-sil" type="button" aria-label="' + dmUyeL('uye_mutfak.js.m.aramayi_temizle', 'Aramayı temizle') + '">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '</div>' +
      '<p class="mnl-sayac" data-mnl-sayac aria-live="polite"></p>';
    kap.insertBefore(araclar, ustBlok);

    /* ── ÇİP ŞERİDİ ÇUBUĞUN İÇİNE ────────────────────────────────────
       Çipler markupta, çubuk çalışma zamanında doğuyor; şerit ÇUBUĞUN
       İÇİNE TAŞINIR (HTML dosyasına yazılmaz).
       🔴 TAŞIMA M5'TEN SONRA: M5 bu IIFE'den ÖNCEKİ IIFE'de kuruluyor,
          dinleyicileri ve `MutationObserver`ı taşımadan etkilenmez —
          DOM taşıması dinleyiciyi düşürmez ve şerit `[data-pane]`in
          İÇİNDE kalır (M5 `kap.closest('[data-pane]')` kullanıyor). */
    var cipler = pano.querySelector('.cipler');
    if (cipler && cipler.querySelector('.cip.suzgec[data-suz-deger]') && kap.contains(cipler)) {
      araclar.insertBefore(cipler, araclar.firstChild);
      araclar.setAttribute('data-mnl-cipli', '1');
    }

    var bos = document.createElement('p');
    bos.className = 'mnl-bos';
    bos.setAttribute('data-mnl-bos', anahtar);
    bos.hidden = true;
    kap.insertBefore(bos, araclar.nextSibling);

    var nav = document.createElement('nav');
    nav.className = 'pagi mnl-pagi';
    nav.setAttribute('aria-label', dmUyeL('uye_mutfak.js.m.sayfalama', 'Sayfalama'));
    nav.hidden = true;

    var arama = araclar.querySelector('.alan-girdi');
    var aramaKap = araclar.querySelector('.ie-arama');
    var sil = araclar.querySelector('.ie-arama-sil');
    var sayac = araclar.querySelector('[data-mnl-sayac]');
    var durum = { sayfa: 1, q: '', cizim: 0 };

    /* ── SAYFALAMANIN YERİ: LİSTENİN EN ALTI ─────────────────────────
       🔴 ÖNCE: ekleme noktası İLK kart olduğu için sayfalama listenin
          ORTASINDA duruyordu (`#gunluk`te 5. kardeş, ARDINDA 5 kart).
       🔴 "İlk kartın kardeşi" varsayımına dönülmedi: özne sekmeden
          sekmeye değişiyor (`taslak` sekmesinin öznesi `tbody tr`),
          bu yüzden SON öznenin ÜST BLOĞU bulunup ondan sonrasına
          ekleniyor. Blok = sayfalanan kabın doğrudan çocuğu.
       🔴 M5'in süzgeç boş hâli (`.mnl-suz-bos`) son kartın hemen
          ardında duruyor; sayfalama ONDAN da sonra. */
    function sonBlok() {
      var l = [].slice.call(pano.querySelectorAll(tanim.ozne)).filter(function (e) { return kap.contains(e); });
      var son = l.length ? l[l.length - 1] : (kb.ilk && kap.contains(kb.ilk) ? kb.ilk : null);
      if (!son) return null;
      var b = blok(kap, son);
      if (!b) return null;
      var n = b.nextElementSibling;
      while (n && (n === bos || n.classList.contains('mnl-suz-bos'))) { b = n; n = b.nextElementSibling; }
      return b;
    }
    function konumla() {
      var b = sonBlok();
      if (!b) {
        /* Özne HENÜZ yok — sayfalama kabın sonunda bekler; kartlar
           doğunca bir sonraki çizim onu son bloğun ardına taşır. */
        if (nav.parentNode !== kap || nav.nextElementSibling) kap.appendChild(nav);
        return;
      }
      if (nav.parentNode === kap && nav.previousElementSibling === b) return;
      kap.insertBefore(nav, b.nextSibling);
    }

    /* ── NÜFUS · TEK KAYNAK ──────────────────────────────────────────
       Sayfalanan nüfus = M5 çip süzgecinden GEÇENLER. İki bağımsız
       görünürlük sistemi tek kaynağa indirildi. */
    function tumOzne() { return [].slice.call(pano.querySelectorAll(tanim.ozne)); }
    function suzuldu(e) { return e.classList.contains('mnl-suz-disi'); }

    function ciz() {
      durum.cizim++;
      var tumu = tumOzne();
      var nufus = tumu.filter(function (e) { return !suzuldu(e); });
      var q = durum.q;
      var uyan = q ? nufus.filter(function (e) { return metin(e).indexOf(q) !== -1; }) : nufus;
      var toplamSayfa = Math.max(1, Math.ceil(uyan.length / SAYFA_BOYU));
      if (durum.sayfa > toplamSayfa) durum.sayfa = toplamSayfa;
      if (durum.sayfa < 1) durum.sayfa = 1;
      var bas = (durum.sayfa - 1) * SAYFA_BOYU;
      var gosterilecek = uyan.slice(bas, bas + SAYFA_BOYU);

      /* 🔴 GÖRÜNÜRLÜK TÜM ÖZNEYE YAZILIR, yalnız nüfusa değil: süzgeç
         dışı kalan kalemin bayat `hidden`ı üstünde kalmasın. */
      tumu.forEach(function (e) {
        var g = gosterilecek.indexOf(e) !== -1;
        e.hidden = !g;
        /* `hidden` niteliği tabloda `display:table-row`u yenemiyor;
           sınıf da yazılıyor ve CSS onu `display:none` yapıyor.
           🔴 `toggle(ad, kosul)` yerine açık `add`/`remove`. */
        if (g) e.classList.remove('mnl-gizli'); else e.classList.add('mnl-gizli');
      });

      if (q) aramaKap.classList.add('dolu'); else aramaKap.classList.remove('dolu');

      /* Çip süzgeci her şeyi elediyse SÖZ M5'İN: `.mnl-suz-bos` zaten
         "Bu süzgeçle menü yok" diyor, ikinci boş hâl basılmaz. */
      var cipSuzuyor = nufus.length !== tumu.length;
      var kendiBos = uyan.length === 0 && !(cipSuzuyor && !q);
      bos.hidden = !kendiBos;
      if (kendiBos) {
        bos.textContent = q
          ? dmUyeL('uye_mutfak.js.m.aramaya_uyan_yok', '“:q” aramasına uyan :ad yok.', {q: arama.value.trim(), ad: adSec(tanim.ad)})
          : dmUyeL('uye_mutfak.js.m.sekmede_yok', 'Bu sekmede henüz :ad yok.', {ad: adSec(tanim.ad)});
        if (q) {
          var t = document.createElement('button');
          t.type = 'button'; t.className = 'mnl-bos-temizle';
          t.textContent = dmUyeL('uye_mutfak.js.m.aramayi_temizle', 'Aramayı temizle');
          t.addEventListener('click', function () { arama.value = ''; durum.q = ''; durum.sayfa = 1; ciz(); arama.focus(); });
          bos.appendChild(document.createTextNode(' '));
          bos.appendChild(t);
        }
      }

      /* 🔴 SAYAÇ GERÇEK: uydurma sayı yok. Süzgeç ya da arama daralttıysa
         "süzülen / toplam", daraltmadıysa yalnız toplam. */
      sayac.textContent = tumu.length
        ? (uyan.length !== tumu.length
            ? uyan.length + ' / ' + tumu.length + ' ' + adSec(tanim.ad, tumu.length)
            : tumu.length + ' ' + adSec(tanim.ad, tumu.length))
        : '';

      konumla();
      pagiCiz(nav, durum.sayfa, toplamSayfa, function (s) {
        durum.sayfa = s; ciz();
        araclar.scrollIntoView({ block: 'nearest' });
      });
    }

    var zaman;
    arama.addEventListener('input', function () {
      clearTimeout(zaman);
      zaman = setTimeout(function () {
        durum.q = arama.value.trim().toLocaleLowerCase('tr');
        durum.sayfa = 1;                       /* arama sayfayı BAŞA alır */
        ciz();
      }, 180);
    });
    sil.addEventListener('click', function () {
      arama.value = ''; durum.q = ''; durum.sayfa = 1; ciz(); arama.focus();
    });

    /* ── PANO DEĞİŞİRSE YENİDEN DİZİNLE ──────────────────────────────
       🔴 KENDİ ÇİZİMİNİ DUYMAZ. Gözlemci çubuğun · sayfalamanın · boş
          hâllerin İÇİNDEKİ değişimi eler; elenmeseydi `pagiCiz`in
          `innerHTML` yazımı gözlemciyi, gözlemci `ciz()`i, `ciz()`
          yeniden `pagiCiz`i çağırırdı — sonsuz döngü. */
    var gozZaman;
    var ELEK = '.mnl-araclar, .pagi.mnl-pagi, .mnl-bos, .mnl-suz-bos';
    var gozcu = new MutationObserver(function (kayitlar) {
      var ilgili = kayitlar.some(function (m) {
        var t = m.target && m.target.nodeType === 1 ? m.target : (m.target && m.target.parentElement);
        if (!t || !t.closest) return true;
        return !t.closest(ELEK);
      });
      if (!ilgili) return;
      clearTimeout(gozZaman);
      gozZaman = setTimeout(function () { ciz(); }, 80);
    });
    gozcu.observe(pano, { childList: true, subtree: true });

    ciz();
    var kayit = {
      anahtar: anahtar, pano: pano, tanim: tanim, kap: kap,
      araclar: araclar, nav: nav, bos: bos,
      durum: durum, ciz: ciz,
      sifirla: function () { durum.sayfa = 1; ciz(); },
      /* 🔴 SÖKÜLEBİLİR OLMAK ZORUNDA: yeniden kurulumda eski gözlemci
         ayakta kalırsa eski `ciz()` yeni kurulumun görünürlüğüyle
         çakışır — iki sürücü, tek yüzey. */
      durdur: function () { clearTimeout(gozZaman); gozcu.disconnect(); }
    };
    KAYIT[anahtar] = kayit;
    return kayit;
  }

  /* ═══ SÖZLEŞME · `window.dmMnlListe` ════════════════════════════════
     Lead `#alisveris` panosunun DOM'unu yeniden yazdıktan sonra
     `tazele('alisveris')` çağırıp yeniden dizinleyebilsin diye dışa
     açılıyor. Pano baştan yazıldıysa (çubuk artık ağaçta değilse)
     `tazele` KURULUMU BAŞTAN yapar — bayat referansla çizmez.
     ═══════════════════════════════════════════════════════════════════ */
  window.dmMnlListe = {
    SAYFA_BOYU: SAYFA_BOYU,
    SEKME: SEKME,
    kur: function (anahtar, tanim) { return sekmeKur(anahtar, tanim); },
    tazele: function (anahtar) {
      var pano = document.querySelector('[data-pane="' + anahtar + '"]');
      if (!pano) return null;
      var k = KAYIT[anahtar];
      if (!k) { pano.removeAttribute('data-mnl-liste'); return sekmeKur(anahtar, null); }

      /* 🔴 ÇUBUĞUN VARLIĞI DOĞRU YERDE OLDUĞUNU KANITLAMAZ.
         Eski sınama `pano.contains(k.araclar)` idi ve pano yeniden
         yazıldığında HÂLÂ true dönüyordu: çubuk panonun içinde ama
         YANLIŞ BÖLÜMDE (gizli `section.al-body`) duruyordu; `tazele`
         yeniden kurmuyor, bayat çapayla çiziyordu — arama da sayfalama
         da ekranda yoktu. Soru artık "panoda mı" değil "ÖZNELERLE AYNI
         KAPTA mı": ekleme noktası YENİDEN hesaplanıp karşılaştırılıyor.
         ("Kapı bayat kopya okur"un DOM karşılığı.) */
      var t = tanimla(anahtar, k.tanim) || k.tanim;
      var ozneler = [].slice.call(pano.querySelectorAll(t.ozne));
      var kb = kapBul(ozneler, pano, t.dinamik);
      var yerYanlis = !pano.contains(k.araclar) || !kb || k.araclar.parentNode !== kb.kap;

      if (yerYanlis) {
        if (k.durdur) k.durdur();
        /* Çip şeridi çubuğun İÇİNE taşınmıştı — çubukla birlikte
           SİLİNMESİN, önce dışarı alınır; yeni kurulum onu yeniden
           bulup yeni çubuğa taşır. */
        var cip = k.araclar.querySelector('.cipler');
        if (cip && k.araclar.parentNode) k.araclar.parentNode.insertBefore(cip, k.araclar);
        /* Eski `ciz()`in bıraktığı görünürlük DAMGASI temizlenir;
           yoksa yeni seçiciye uymayan özne bayat `hidden` ile ölü kalır. */
        [].slice.call(pano.querySelectorAll(k.tanim.ozne)).forEach(function (e) {
          e.hidden = false; e.classList.remove('mnl-gizli');
        });
        [k.araclar, k.bos, k.nav].forEach(function (e) { if (e && e.parentNode) e.parentNode.removeChild(e); });
        pano.removeAttribute('data-mnl-liste');
        delete KAYIT[anahtar];
        return sekmeKur(anahtar, k.tanim);
      }

      k.tanim = t;
      k.durum.sayfa = 1;
      k.ciz();
      return k;
    },
    sifirla: function (anahtar) {
      var k = KAYIT[anahtar];
      if (!k) return false;
      k.durum.sayfa = 1; k.ciz(); return true;
    },
    kayit: function (anahtar) { return KAYIT[anahtar] || null; }
  };

  function kur() {
    var kurulan = [];
    Object.keys(SEKME).forEach(function (k) {
      var s = sekmeKur(k, SEKME[k]);
      if (s) kurulan.push(s);
    });
    if (!kurulan.length) return;

    /* 🔴 SEKME DEĞİŞİNCE 1. SAYFAYA DÖNER. Sekme düğmesi panoyu
       gösteriyor; pano gizliyken ölçüm 0 döner, o yüzden sıfırlama
       tıklamadan SONRA ve kısa bir gecikmeyle koşuyor. */
    document.querySelectorAll('[data-tab]').forEach(function (d) {
      d.addEventListener('click', function () {
        var t = d.getAttribute('data-tab');
        setTimeout(function () {
          if (KAYIT[t]) KAYIT[t].sifirla();
        }, 0);
      });
    });

    /* Dinamik sekme: depo değişince yeniden dizinlenir. */
    document.addEventListener('dm-depo', function () {
      setTimeout(function () {
        Object.keys(SEKME).forEach(function (k) {
          if (!SEKME[k].dinamik) return;
          if (KAYIT[k]) KAYIT[k].ciz(); else sekmeKur(k, SEKME[k]);
        });
      }, 60);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
