/* TELEFON MASKESİ — kesitsel, 8 yüzeyde tek davranış.
 *
 * 🔴 NEDEN VAR (kullanıcı ölçtü, 2026-09-10): `/hesabim/ayarlar` telefon alanı
 * `"042150u12345u2ı35"` girdisini kabul ediyordu. Maske yoktu, parse yoktu,
 * sunucu kuralı biçim denetlemiyordu.
 *
 * 🔴 PROTOTİPTE DE BÖYLEYDİ — ama bu prototip hatasıdır, parite bahane değil
 * (kullanıcının kendi sözü). Bu yüzden DAVRANIŞ düzeltilir, MARKUP donörün
 * kalır: bu betik hiçbir alan/düzen/sınıf eklemez, yalnız var olan düğümleri
 * kullanır. Sayfanın kendi hata düğümü yoksa (üç ekranda yok) düğümü sayfanın
 * KENDİ hata sınıfını kopyalayarak ÇALIŞMA ANINDA üretir ve hata bitince
 * söker — türetilmiş markup bayt kopyası kalsın diye.
 *
 * 🔴 KANONA DOKUNULMADI. Kanonun kendi maskesi
 * `public/kanon/gomulu/j-459651d1e841.js` içinde ve yalnız `[data-tel-mask]`
 * nitelikli alanlara bağlanıyor — 8 alanın yalnız 1'inde o nitelik var
 * (`g-cozum-merkezi`), ayrıca o betik her ekranda yüklenmiyor. Kanon dosyası
 * değiştirilmez (CLAUDE.md); bu betik onun ÜSTÜNE biner. Çakışma yok: iki
 * biçimlendirici de aynı çıktıyı verir (idempotent) ve bu betiğin dinleyicisi
 * sonra bağlandığı için imleci o konumlandırır.
 *
 * 🔴 YALNIZ TÜRKİYE — ülke seçici KİLİTLİ (dürüst red). Gerekçe ölçüldü:
 * `telefon_ulke` sütunu üç serviste yalnız YAZILIYOR, hiçbir yerde okunmuyor;
 * `config/kimlik.php` ülke listesi taşımıyor; bütün formların gizli alanı `TR`
 * sabiti basıyor. Açık duran seçici "başka ülke de olur" diyen yalan yüzeydir.
 * Ayrıntı: `docs/telefon-maskesi.md`.
 */
(function () {
  'use strict';

  /* Aşama 2 · B (ajan-b4): EN sayfada kabuk sözlüğü (`KabukSozlugu`, <script type="application/json" data-l-js-kabuk>) ve
     sayfanın kendi sözlüğü (<main data-l-js>) basılı; ikisi de okunur. TR'de sözlük yok → TR yedek AYNEN döner. */
  var dmLk = window.dmLk = window.dmLk || function (k, tr, p) {
    var s = null, els = document.querySelectorAll('[data-l-js-kabuk], [data-l-js]');
    for (var i = 0; i < els.length && s === null; i++) {
      try { var a = els[i].getAttribute('data-l-js'); var o = JSON.parse(a ? a : els[i].textContent); if (o && typeof o[k] === 'string') s = o[k]; } catch (e) { /* bozuk sözlük → TR yedek */ }
    }
    var kayitli = s !== null;
    if (s === null) s = tr;
    /* Çoğul (EN): sözlük değeri 'tekil|çoğul' — sayı p.sayi, yoksa p.toplam, yoksa p.n; 1 → ilk biçim, gerisi son biçim; RU (üç kategorili dil, 20 Eki): 'bir|az|çok', kesir → az. */
    if (kayitli && s.indexOf('|') >= 0) { var cn = p ? [p.sayi, p.toplam, p.n].filter(function (x) { return x !== undefined && x !== null && x !== ''; })[0] : undefined; var cb = s.split('|'); var cbi = (function (x) { if (cb.length < 3 || typeof document === 'undefined' || typeof Intl === 'undefined') return -1; var pr = new Intl.PluralRules(document.documentElement.lang || 'tr'); if (pr.resolvedOptions().pluralCategories.indexOf('few') < 0) return -1; x = Math.abs(Number(x)) || 0; if (x !== Math.floor(x)) return 1; var k = pr.select(x); return k === 'one' ? 0 : (k === 'few' ? 1 : 2); })(cn); s = cbi >= 0 ? cb[cbi] : (Number(cn) === 1 ? cb[0] : cb[cb.length - 1]); }
    if (!p) return s;
    /* Laravel'in kuralı: adlar uzundan kısaya, doğrudan değiştirilir (`:minpx` içinde `:min` dolar). */
    Object.keys(p).sort(function (a, b) { return b.length - a.length; }).forEach(function (n) { s = s.split(':' + n).join(String(p[n])); });
    return s;
  };
  var HANE = 10;
  var ILK = '5';
  var MESAJ_BICIM = dmLk('kabuk_js.gastro.telefon.bicim', 'Geçerli bir telefon numarası gir (5 ile başlayan 10 hane).');
  var MESAJ_EKSIK = dmLk('kabuk_js.gastro.telefon.eksik', 'Telefon numarası 10 hane olmalı.');
  var KILIT_IPUCU = dmLk('kabuk_js.f6.telefon.kilit', 'Şu an yalnız Türkiye (+90) numaraları kaydedilebiliyor.');

  /* Sayfaların hata kalıpları — sınıf → o sınıfı GÖRÜNÜR yapan anahtar.
     `null` = sınıfın kendisi zaten görünür (düğüm varsa görünür, yoksa yok). */
  var HATA_KALIPLARI = {
    'giris-hata': 'acik',    /* kimlik kartı — bilesenler.css §61 */
    'alan-hata': 'goster',   /* form alanı — bilesenler.css §3 */
    'fk-hata': 'show',       /* hesabim · odemelerim · sef-panelim gömülü CSS */
    'fk-error': null,        /* tokens.css — inline-flex, gizli doğmuyor */
    'fk-err': null
  };
  var HATA_SECICI = '.giris-hata, .alan-hata, .fk-hata, .fk-error, .fk-err';

  /* ---- BİÇİM ---------------------------------------------------------- */

  /* Ham metinden ulusal haneleri çıkarır. Kısmî girdide de çalışır — maske
     yazdıkça uygulanır. Üç yapıştırma biçimi aynı sonuca gider:
       `0532 123 45 67` · `+90 532 123 45 67` · `532 123 45 67` → `5321234567`
     `0090…` (uluslararası çıkış öneki) de çözülür. */
  function haneler(ham) {
    var d = String(ham == null ? '' : ham).replace(/\D+/g, '');
    while (d.charAt(0) === '0') { d = d.slice(1); }
    if (d.slice(0, 2) === '90' && d.length > HANE) { d = d.slice(2); }
    return d.slice(0, HANE);
  }

  /* `5321234567` → `532 123 45 67` (3-3-2-2, donörün `5__ ___ __ __` kalıbı). */
  function bicimle(d) {
    var out = d.slice(0, 3);
    if (d.length > 3) { out += ' ' + d.slice(3, 6); }
    if (d.length > 6) { out += ' ' + d.slice(6, 8); }
    if (d.length > 8) { out += ' ' + d.slice(8, 10); }
    return out;
  }

  /* İmleçten önceki HANE sayısını sayar — biçim karakterleri (boşluk) sayılmaz.
     Yeniden biçimlendirme sonrası imleç aynı haneden sonraya konur, yoksa her
     tuşta imleç sona sıçrar ve araya rakam eklenemez. */
  function haneSayisi(metin, konum) {
    return metin.slice(0, konum).replace(/\D+/g, '').length;
  }

  function haneKonumu(bicimli, kacinciHane) {
    if (kacinciHane <= 0) { return 0; }
    var sayac = 0;
    for (var i = 0; i < bicimli.length; i++) {
      if (/\d/.test(bicimli.charAt(i))) {
        sayac++;
        if (sayac === kacinciHane) { return i + 1; }
      }
    }
    return bicimli.length;
  }

  /* ---- HATA DÜĞÜMÜ ---------------------------------------------------- */

  function sinifKalibi(dugum) {
    var siniflar = (dugum.className || '').split(/\s+/);
    for (var i = 0; i < siniflar.length; i++) {
      if (Object.prototype.hasOwnProperty.call(HATA_KALIPLARI, siniflar[i])) {
        return siniflar[i];
      }
    }
    return null;
  }

  /* Alanın KENDİ hata düğümü: `aria-describedby` zincirindeki, hata sınıfı
     taşıyan düğüm. Beş alanda var (`giTelErr` · `kaTelErr` · `eTel` ·
     `ftTelHata` ×2), üçünde yok (`hsTel` · `ufTel` · iletisim `telefon`). */
  function bagliHata(girdi) {
    var idler = (girdi.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < idler.length; i++) {
      if (!idler[i]) { continue; }
      var d = document.getElementById(idler[i]);
      if (d && sinifKalibi(d)) { return d; }
    }
    return null;
  }

  /* Sayfanın kendi hata kalıbını ÖRNEKTEN öğrenir — uydurma sınıf yok. */
  function kalipSinifi(girdi) {
    var kapsam = girdi.closest('form') || document;
    var ornek = kapsam.querySelector(HATA_SECICI) || document.querySelector(HATA_SECICI);
    return (ornek && sinifKalibi(ornek)) || 'fk-error';
  }

  function metinYaz(dugum, metin) {
    var span = dugum.querySelector('span');
    if (span) { span.textContent = metin; return; }
    /* İkondan sonraki metin düğümlerini tazele. */
    var cocuklar = Array.prototype.slice.call(dugum.childNodes);
    for (var i = 0; i < cocuklar.length; i++) {
      if (cocuklar[i].nodeType === 3) { dugum.removeChild(cocuklar[i]); }
    }
    dugum.appendChild(document.createTextNode(' ' + metin));
  }

  function hataAc(durum, metin) {
    var d = durum.hata;
    if (!d) {
      var sinif = kalipSinifi(durum.girdi);
      d = document.createElement('p');
      d.className = sinif;
      d.setAttribute('role', 'alert');
      d.setAttribute('data-telefon-hatasi', '');
      var ikon = document.createElement('i');
      ikon.className = 'fa-solid fa-circle-exclamation';
      ikon.setAttribute('aria-hidden', 'true');
      d.appendChild(ikon);
      var span = document.createElement('span');
      d.appendChild(span);
      var yuva = durum.sarmal || durum.girdi;
      if (yuva.parentNode) { yuva.parentNode.insertBefore(d, yuva.nextSibling); }
      durum.hata = d;
      durum.uretilmis = true;
    }

    metinYaz(d, metin);
    var anahtar = HATA_KALIPLARI[sinifKalibi(d)];
    if (anahtar) { d.classList.add(anahtar); }
    d.removeAttribute('hidden');

    durum.girdi.setAttribute('aria-invalid', 'true');
    if (durum.sarmal) { durum.sarmal.classList.add('has-error'); }
    if (durum.girdi.classList.contains('alan-girdi')) { durum.girdi.classList.add('hatali'); }
  }

  function hataKapat(durum) {
    var d = durum.hata;
    if (d) {
      if (durum.uretilmis) {
        if (d.parentNode) { d.parentNode.removeChild(d); }
        durum.hata = null;
        durum.uretilmis = false;
      } else {
        var anahtar = HATA_KALIPLARI[sinifKalibi(d)];
        if (anahtar) { d.classList.remove(anahtar); }
        if (d.hasAttribute('data-telefon-gizle')) { d.setAttribute('hidden', ''); }
      }
    }
    durum.girdi.removeAttribute('aria-invalid');
    if (durum.sarmal) { durum.sarmal.classList.remove('has-error'); }
    durum.girdi.classList.remove('hatali');
  }

  /* ---- ÜLKE SEÇİCİ ---------------------------------------------------- */

  function ulkeyiKilitle(sarmal) {
    if (!sarmal) { return; }
    var dugmeler = sarmal.querySelectorAll('.alan-ulke');
    for (var i = 0; i < dugmeler.length; i++) {
      var b = dugmeler[i];
      b.disabled = true;
      b.setAttribute('aria-disabled', 'true');
      b.setAttribute('aria-expanded', 'false');
      /* Dürüst red: seçici görünür kalır, neden çalışmadığını SÖYLER. */
      b.setAttribute('title', KILIT_IPUCU);
    }
    var katman = sarmal.querySelector('.alan-ulke-katman');
    if (katman) { katman.setAttribute('hidden', ''); }
    /* Gizli ülke alanı tek desteklenen değere sabitlenir. */
    var gizliUlke = sarmal.querySelector(
      'input[type="hidden"][name="telefon_ulke"], input[type="hidden"][name="telefonUlke"], input[type="hidden"][name="ulke"]'
    );
    if (gizliUlke) { gizliUlke.value = 'TR'; }
  }

  /* ---- BAĞLAMA -------------------------------------------------------- */

  function bagla(girdi) {
    if (girdi.dataset.telefonMaskesi === '1') { return; }
    girdi.dataset.telefonMaskesi = '1';

    var sarmal = girdi.closest('.alan-telefon');
    var durum = {
      girdi: girdi,
      sarmal: sarmal,
      hata: bagliHata(girdi),
      uretilmis: false
    };
    /* Donör düğümü `hidden` ile doğduysa kapanışta yeniden `hidden` yapılır. */
    if (durum.hata && durum.hata.hasAttribute('hidden')) {
      durum.hata.setAttribute('data-telefon-gizle', '');
    }

    ulkeyiKilitle(sarmal);

    /* Mobil klavye rakama açılsın — donörün beşinde zaten var, üçünde yok. */
    if (!girdi.getAttribute('inputmode')) { girdi.setAttribute('inputmode', 'numeric'); }
    if (!girdi.getAttribute('autocomplete')) { girdi.setAttribute('autocomplete', 'tel-national'); }

    /* Gizli eşlikçi: `/kayit`ta görünen alanın `name`i YOK, sunucuya giden
       `kaTelDegeri` gizli alanı. Maske onu da yazmazsa kullanıcının yazdığı
       numara sunucuya HİÇ ulaşmaz. */
    var gizliDeger = sarmal
      ? sarmal.querySelector('input[type="hidden"][name="telefon"]')
      : null;

    function esitle(d) {
      if (gizliDeger) { gizliDeger.value = d; }
    }

    function denetle(odakGitti) {
      var d = haneler(girdi.value);
      if (d.length === 0) { hataKapat(durum); return; }
      if (d.charAt(0) !== ILK) { hataAc(durum, MESAJ_BICIM); return; }
      if (odakGitti && d.length < HANE) { hataAc(durum, MESAJ_EKSIK); return; }
      hataKapat(durum);
    }

    function uygula(imleciKoru) {
      var eski = girdi.value;
      var konum = imleciKoru ? (girdi.selectionStart || 0) : eski.length;
      var kacinci = haneSayisi(eski, konum);
      var d = haneler(eski);
      var yeni = bicimle(d);

      if (yeni !== eski) {
        girdi.value = yeni;
        if (imleciKoru && document.activeElement === girdi) {
          var y = haneKonumu(yeni, kacinci);
          try { girdi.setSelectionRange(y, y); } catch (e) { /* type=tel her tarayıcıda seçim taşımaz */ }
        }
      }
      esitle(d);
    }

    /* Sayfa açılışı: sunucudan gelen değer (`+905321234567` ya da 422 sonrası
       kullanıcının ham girdisi) ekranda ulusal biçime çevrilir. */
    uygula(false);
    denetle(false);

    girdi.addEventListener('input', function () { uygula(true); denetle(false); });
    girdi.addEventListener('blur', function () { uygula(false); denetle(true); });
    /* Yapıştırma `input` olayını tetikler; ayrıca `change` (otomatik doldurma). */
    girdi.addEventListener('change', function () { uygula(false); denetle(false); });
  }

  function tara(kok) {
    var alanlar = (kok || document).querySelectorAll('input[type="tel"], input[data-tel-mask]');
    for (var i = 0; i < alanlar.length; i++) { bagla(alanlar[i]); }
  }

  function baslat() {
    tara(document);
    /* Sonradan DOM'a giren alanlar (modal, sekme) — odak anında yakalanır.
       Gözlemci yerine odak: 58 ekranda sürekli koşan bir MutationObserver'ın
       bedeli, 8 ekranda bir kez koşan bu kontrolden büyüktür. */
    document.addEventListener('focusin', function (olay) {
      var h = olay.target;
      if (h && h.tagName === 'INPUT' && (h.type === 'tel' || h.hasAttribute('data-tel-mask'))) {
        bagla(h);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
