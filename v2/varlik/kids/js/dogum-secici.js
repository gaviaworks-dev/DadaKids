/* =====================================================================
   DADA GASTRO KIDS — doğum ayı / tahmini doğum ayı seçici (sahibi: v2-hub, bağımlılıksız)
   Markup: src/kids/dogum.mjs → dogumSecici(). Her [data-kd-dogum] için kurulur.
   · Yıl: role=radiogroup (oklar seçer, APG) · Ay: role=grid (oklar gezer, Enter/Boşluk seçer)
   · Form içinde input[name="evre"] varsa: sonuç → evre çipi seçilir (change olayı ile, kids.js senkron);
     hamilelik seçilirse "tahmini doğum ayı" moduna geçer. Uygula'da DadaKids.profilAyarla({ay}).
   · Düğmeyle açılır (varsayılan kapalı): mobil (≤640px) alt sayfa, masaüstü popover; Esc ve dış tık kapatır
   · Dışarıdan açma: document.dispatchEvent(new CustomEvent('kd-dogum-ac'))
   · Saklama: yalnız bu tarayıcı — localStorage 'dadakids.dogum.v1' {y, m, mod}, try/catch
   · [data-kd-tarih] (dogumSecici({gun:true})) → kurTarih: gün hassasiyetli tarih kipi, aşağıda; açılır panel ikisinde ortak (acilirKur)
   ===================================================================== */
(function () {
  'use strict';
  var ANAHTAR = 'dadakids.dogum.v1';
  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var YIL_RENK = ['mavi', 'seftali', 'mint', 'sari'];
  var mobilMq = matchMedia('(max-width: 640px)');
  var azaltMq = matchMedia('(prefers-reduced-motion: reduce)');

  function oku() { try { var s = localStorage.getItem(ANAHTAR); var v = s ? JSON.parse(s) : null; return v && typeof v === 'object' ? v : null; } catch (e) { return null; } }
  function yaz(v) { try { if (v) localStorage.setItem(ANAHTAR, JSON.stringify(v)); else localStorage.removeItem(ANAHTAR); return true; } catch (e) { return false; } }

  function bugun() { var d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1 }; }
  function ayFarki(y, m) { var b = bugun(); return (b.y - y) * 12 + (b.m - m); }           // doğum ayı = 0
  function evreAydan(ay) { return ay < 6 ? '0-6-ay' : ay < 9 ? '6-8-ay' : ay < 12 ? '9-12-ay' : '1-3-yas'; }
  function hafta(y, m) {                                                                       // ≈ 40 − (ayın ortasına kalan hafta)
    var kalan = (new Date(y, m - 1, 15).getTime() - Date.now()) / (7 * 864e5);
    return Math.max(4, Math.min(40, Math.round(40 - kalan)));
  }
  function trimester(h) { return h <= 13 ? '1. trimester' : h <= 27 ? '2. trimester' : '3. trimester'; }
  function yasMetni(n) { var y = Math.floor(n / 12), a = n % 12; return y + ' yaş' + (a ? ' ' + a + ' ay' : ''); }
  function el(etiket, ozellik, ic) { var e = document.createElement(etiket); Object.keys(ozellik || {}).forEach(function (k) { if (k === 'class') e.className = ozellik[k]; else e.setAttribute(k, ozellik[k]); }); if (ic != null) e.innerHTML = ic; return e; }

  function kur(kok) {
    // Alt sayfa açıkken panel body'ye taşınır (kart içindeki transform/z-index bağlamından kurtulmak için) → aramalar ikisinde de
    var panel = kok.querySelector('.kd-ds__panel'), perde = kok.querySelector('[data-kd-ds-perde]');
    var $ = function (s) { return kok.querySelector(s) || panel.querySelector(s); };
    var $$ = function (s) { var a = Array.prototype.slice.call(kok.querySelectorAll(s)); return panel.parentNode === kok ? a : a.concat(Array.prototype.slice.call(panel.querySelectorAll(s))); };
    var EVRE = {}; try { EVRE = JSON.parse(kok.getAttribute('data-evre') || '{}'); } catch (e) { /* boş */ }
    var form = kok.closest('form');
    var evreRadyo = function () { return form ? Array.prototype.slice.call(form.querySelectorAll('input[name="evre"]')) : []; };
    var seciliEvre = function () { var r = form && form.querySelector('input[name="evre"]:checked'); return r ? r.value : null; };
    var yillarKap = $('[data-kd-ds-yillar]'), aylarKap = $('[data-kd-ds-aylar]'), hucreler = $$('.kd-ds__ay');
    var tetik = $('.kd-ds__ac');
    var sonucKutu = $('[data-kd-ds-sonuc]'), metin = $('[data-kd-ds-metin]'), eylem = $('[data-kd-ds-eylem]');
    var d = { mod: 'dogum', y: null, m: null };
    var kendim = false;

    /* ---------- kurallar ---------- */
    function yillar() {
      var b = bugun();
      if (d.mod === 'gebelik') return b.m + 9 > 12 ? [b.y, b.y + 1] : [b.y];
      return [b.y, b.y - 1, b.y - 2, b.y - 3, 'once'];
    }
    function ayGecerli(y, m) {
      if (y === null || y === 'once') return false;
      var b = bugun();
      if (d.mod === 'gebelik') { var f = (y - b.y) * 12 + (m - b.m); return f >= 0 && f <= 9; }
      return ayFarki(y, m) >= 0;
    }
    function sonuc() {
      if (d.y === null) return { tur: 'bos' };
      if (d.mod === 'dogum') {
        if (d.y === 'once') return { tur: 'buyuk' };
        if (d.m === null) return { tur: 'ay' };
        var n = ayFarki(d.y, d.m);
        return n > 36 ? { tur: 'buyuk', ay: n } : { tur: 'tamam', ay: n, evre: evreAydan(n) };
      }
      if (d.m === null) return { tur: 'ay' };
      return { tur: 'gebelik', hafta: hafta(d.y, d.m), evre: 'hamilelik' };
    }

    /* ---------- çizim ---------- */
    function yillariCiz() {
      var b = bugun();
      yillarKap.innerHTML = '';
      yillar().forEach(function (y, i) {
        var once = y === 'once', etiket = once ? 'Daha önce' : String(y);
        var alt = once ? (b.y - 3) + ' öncesi' : y === b.y ? 'bu yıl' : (d.mod === 'gebelik' ? 'gelecek yıl' : '');
        var oz = { type: 'button', role: 'radio', class: 'kd-ds__yil' + (once ? ' kd-ds__yil--once' : ''), 'data-y': String(y), 'aria-checked': 'false', tabindex: '-1', 'aria-label': once ? (b.y - 3) + ' yılından önce' : etiket + (alt ? ', ' + alt : '') };
        if (!once) oz['data-renk'] = d.mod === 'gebelik' ? 'pembe' : YIL_RENK[i % 4];
        var btn = el('button', oz, '<b>' + etiket + '</b>' + (alt ? '<small aria-hidden="true">' + alt + '</small>' : ''));
        yillarKap.appendChild(btn);
      });
    }
    function guncelle(zip) {
      var b = bugun(), gebelik = d.mod === 'gebelik';
      kok.setAttribute('data-mod', d.mod); panel.setAttribute('data-mod', d.mod);
      ['[data-kd-ds-baslik]', '[data-kd-ds-aciklama]'].forEach(function (s) { var x = $(s); if (x) x.textContent = x.getAttribute(gebelik ? 'data-gebelik' : 'data-dogum'); });
      $('[data-kd-ds-sheet-baslik]').textContent = gebelik ? 'Tahmini doğum ayı' : 'Doğum ayı';
      // yıllar
      var yb = $$('.kd-ds__yil'), secYil = null;
      yb.forEach(function (btn) { var v = btn.getAttribute('data-y'), s = String(d.y) === v; btn.setAttribute('aria-checked', String(s)); btn.tabIndex = -1; if (s) secYil = btn; });
      (secYil || yb[0]).tabIndex = 0;
      // aylar
      var yilYok = d.y === null || d.y === 'once';
      var ipucu = $('[data-kd-ds-ay-ipucu]');
      ipucu.textContent = d.y === null ? 'önce yılı seçin' : d.y === 'once' ? '' : (gebelik ? 'geçmiş aylar kapalı' : (d.y === b.y ? 'gelecek aylar kapalı' : ''));
      aylarKap.setAttribute('aria-disabled', String(yilYok));
      var odakVar = false;
      hucreler.forEach(function (h) {
        var m = +h.getAttribute('data-m'), gecerli = ayGecerli(d.y, m), sec = !yilYok && d.m === m;
        h.setAttribute('aria-disabled', String(!gecerli));
        h.setAttribute('aria-selected', String(sec));
        h.querySelector('[data-ay-etiket]').textContent = AYLAR[m - 1] + (yilYok ? '' : ' ' + d.y) + (!gecerli && !yilYok ? (gebelik ? ', seçilemez' : ', henüz gelmedi') : '');
        if (sec) { h.tabIndex = 0; odakVar = true; } else h.tabIndex = -1;
      });
      if (!odakVar) { var ilk = hucreler.filter(function (h) { return h.getAttribute('aria-disabled') === 'false'; })[0] || hucreler[0]; ilk.tabIndex = 0; }
      if (zip) ziplat(zip);
      sonucCiz();
    }
    function ziplat(hedef) {
      if (azaltMq.matches || !hedef) return;
      hedef.classList.remove('kd-ds-zip'); void hedef.offsetWidth; hedef.classList.add('kd-ds-zip');
      hedef.addEventListener('animationend', function f() { hedef.classList.remove('kd-ds-zip'); hedef.removeEventListener('animationend', f); });
    }
    function ok() { return '<span aria-hidden="true" class="kd-ds__ok">→</span><span class="kd-gizli">, </span>'; }
    function sonucCiz() {
      var s = sonuc(), ana = '', alt = '', btn = '', kisa = '', tetikMetin = '', renk = '';
      var temizle = '<button type="button" class="kd-ds__temizle" data-kd-ds-temizle>Seçimi temizle</button>';
      if (s.tur === 'bos') {
        ana = d.mod === 'gebelik' ? 'Tahmini doğum yılını, sonra ayını seçin; kaçıncı haftada olduğunuzu birlikte bulalım.' : 'Doğum yılını, sonra ayını seçin; evresini birlikte bulalım.';
        tetikMetin = d.mod === 'gebelik' ? 'Tahmini doğum ayını seçin' : (kok.getAttribute('data-tetik-bos') || 'Doğum ayını seçin');
      } else if (s.tur === 'ay') {
        ana = d.y + ' — şimdi ' + (d.mod === 'gebelik' ? 'tahmini doğum ayını' : 'doğum ayını') + ' seçin.';
        tetikMetin = d.y + ' · ayı seçin';
      } else if (s.tur === 'tamam') {
        var e = EVRE[s.evre] || {}; renk = e.renk || '';
        ana = s.ay === 0 ? 'Bebeğiniz <b>bu ay</b> doğmuş ' + ok() + '<b>' + e.ad + '</b> evresi'
          : 'Bebeğiniz yaklaşık <b>' + s.ay + ' aylık</b> ' + ok() + '<b>' + e.ad + '</b> evresi';
        alt = AYLAR[d.m - 1] + ' ' + d.y + ' doğumlu' + (s.ay >= 12 ? ' · ' + yasMetni(s.ay) : '') + (e.aralik ? ' · ' + e.aralik : '');
        btn = '<a class="kd-btn kd-btn--kucuk" href="' + e.sayfa + '" data-kd-ds-git>Bu evreye git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' + temizle;
        kisa = s.ay + ' aylık · ' + e.ad;
        tetikMetin = AYLAR[d.m - 1] + ' ' + d.y + ' · ' + s.ay + ' aylık';
      } else if (s.tur === 'buyuk') {
        renk = 'uyari';
        ana = 'Minikiniz <b>3 yaşını geçmiş</b> görünüyor.';
        alt = 'Dada Gastro Kids 3 yaşa kadar; Dada Gastro\'nun <a class="kd-bag" href="tarifler.html">aile tariflerine</a> göz atın.';
        btn = '<a class="kd-btn kd-btn--kucuk kd-btn--hafif" href="tarifler.html">Aile tarifleri <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' + temizle;
        kisa = '3 yaş üstü';
        tetikMetin = (d.y === 'once' ? 'Daha önce' : AYLAR[d.m - 1] + ' ' + d.y) + ' · 3 yaş üstü';
      } else if (s.tur === 'gebelik') {
        var g = EVRE.hamilelik || {}; renk = g.renk || 'pembe';
        ana = 'Yaklaşık <b>' + s.hafta + '. hafta</b> ' + ok() + '<b>' + (g.kisa || 'Hamilelik') + '</b> evresi';
        alt = 'Tahmini doğum: ' + AYLAR[d.m - 1] + ' ' + d.y + ' · ' + (s.hafta >= 40 ? 'doğum ayındasınız' : trimester(s.hafta));
        btn = '<a class="kd-btn kd-btn--kucuk" href="' + (g.sayfa || 'kids-donem-hamilelik.html') + '" data-kd-ds-git>Bu evreye git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' + temizle;
        kisa = 'yaklaşık ' + s.hafta + '. hafta';
        tetikMetin = AYLAR[d.m - 1] + ' ' + d.y + ' · ~' + s.hafta + '. hafta';
      }
      sonucKutu.setAttribute('data-tur', s.tur);
      if (renk && renk !== 'uyari') sonucKutu.setAttribute('data-renk', renk); else sonucKutu.removeAttribute('data-renk');
      metin.innerHTML = '<p class="kd-ds__ana">' + ana + '</p>' + (alt ? '<p class="kd-ds__alt">' + alt + '</p>' : '');
      eylem.innerHTML = btn;
      $('[data-kd-ds-kisa]').textContent = kisa;
      $('[data-kd-ds-tetik]').textContent = tetikMetin;
      tetik.setAttribute('data-dolu', String(s.tur !== 'bos' && s.tur !== 'ay'));
    }

    /* ---------- evre çipleriyle senkron ---------- */
    function evreyeYansit() {
      var s = sonuc(); if (!s.evre || !form) return;
      var r = form.querySelector('input[name="evre"][value="' + s.evre + '"]');
      if (!r || r.checked) return;
      r.checked = true; kendim = true;
      try { r.dispatchEvent(new Event('change', { bubbles: true })); } finally { kendim = false; }
    }
    function sakla() {
      var s = sonuc();
      if (s.tur === 'tamam' || s.tur === 'gebelik' || s.tur === 'buyuk') yaz({ y: d.y, m: d.m, mod: d.mod });
    }
    function modAyarla(mod) {
      if (d.mod === mod) return false;
      d = { mod: mod, y: mod === 'gebelik' ? bugun().y : null, m: null };
      yillariCiz(); return true;
    }
    if (form) form.addEventListener('change', function (e) {
      if (kendim || !e.target || e.target.name !== 'evre') return;
      var v = e.target.value;
      if (modAyarla(v === 'hamilelik' ? 'gebelik' : 'dogum')) { guncelle(); return; }
      var s = sonuc();
      if (s.evre && s.evre !== v) { d.m = null; yaz(null); guncelle(); }   // kullanıcı başka evre seçti: ay seçimi düşer
    });

    /* ---------- seçim ---------- */
    function yilSec(v, btn) {
      var y = v === 'once' ? 'once' : +v;
      if (d.y === y) return;
      d.y = y;
      if (d.m !== null && !ayGecerli(d.y, d.m)) d.m = null;
      guncelle(btn); evreyeYansit(); sakla();
    }
    function aySec(h) {
      if (h.getAttribute('aria-disabled') === 'true') { ziplat($('[data-kd-ds-ay-ipucu]')); return; }
      d.m = +h.getAttribute('data-m');
      guncelle(h); evreyeYansit(); sakla();
      h.focus();
    }
    yillarKap.addEventListener('click', function (e) { var b = e.target.closest('.kd-ds__yil'); if (b) { yilSec(b.getAttribute('data-y'), b); b.focus(); } });
    yillarKap.addEventListener('keydown', function (e) {
      var yb = $$('.kd-ds__yil'), i = yb.indexOf(document.activeElement); if (i < 0) return;
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % yb.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + yb.length) % yb.length;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = yb.length - 1;
      if (j === null) return;
      e.preventDefault(); yb[j].focus(); yilSec(yb[j].getAttribute('data-y'), yb[j]);
    });
    aylarKap.addEventListener('click', function (e) { var h = e.target.closest('.kd-ds__ay'); if (h) aySec(h); });
    aylarKap.addEventListener('keydown', function (e) {
      var i = hucreler.indexOf(document.activeElement); if (i < 0) return;
      var j = null, k = e.key;
      if (k === 'ArrowRight') j = Math.min(11, i + 1); else if (k === 'ArrowLeft') j = Math.max(0, i - 1);
      else if (k === 'ArrowDown') j = i + 4 <= 11 ? i + 4 : i; else if (k === 'ArrowUp') j = i - 4 >= 0 ? i - 4 : i;
      else if (k === 'Home') j = e.ctrlKey ? 0 : i - (i % 4); else if (k === 'End') j = e.ctrlKey ? 11 : i - (i % 4) + 3;
      else if (k === 'Enter' || k === ' ' || k === 'Spacebar') { e.preventDefault(); aySec(hucreler[i]); return; }
      if (j === null) return;
      e.preventDefault();
      hucreler.forEach(function (h, x) { h.tabIndex = x === j ? 0 : -1; });
      hucreler[j].focus();
    });
    eylem.addEventListener('click', function (e) {
      if (e.target.closest('[data-kd-ds-temizle]')) {
        d = { mod: d.mod, y: d.mod === 'gebelik' ? bugun().y : null, m: null }; yaz(null); guncelle();
        var f = $('.kd-ds__yil[aria-checked="true"]') || $('.kd-ds__yil'); if (f) f.focus();
        return;
      }
      // "Bu evreye git": profili uygula (bağlar ?evre=…&ay=… taşır), sonra normal gezinme
      if (e.target.closest('[data-kd-ds-git]') && window.DadaKids) {
        var s = sonuc(), p = { evre: s.evre, ay: s.tur === 'tamam' ? s.ay : null };
        var c = form && form.querySelector('input[name="c"]:checked'); if (c) p.c = c.value;
        window.DadaKids.profilAyarla(p);
      }
    });

    /* ---------- Uygula (kids.js submit'inden sonra çalışır: aynı forma sonradan bağlandı) ---------- */
    if (form) form.addEventListener('submit', function () {
      var ev = seciliEvre(), s = sonuc(), DK = window.DadaKids; if (!ev || !DK) return;
      var oz = form.parentElement && form.parentElement.querySelector('[data-kd-ozet-evre]');
      var ad = (DK.EVRE[ev] || EVRE[ev] || {}).ad || '';
      if (s.tur === 'tamam' && s.evre === ev) { DK.profilAyarla({ ay: s.ay }); if (oz) oz.textContent = ad + ' · ' + s.ay + '. ay'; }
      else if (s.tur === 'gebelik' && ev === 'hamilelik' && oz) oz.textContent = ad + ' · yaklaşık ' + s.hafta + '. hafta';
      sheetKapat(false);
    });

    /* ---------- açılır panel: masaüstü popover · mobil alt sayfa (ortak: acilirKur) ---------- */
    var acilir = acilirKur(kok, panel, perde, tetik, function () {
      return $('.kd-ds__yil[aria-checked="true"]') ? hucreler.filter(function (h) { return h.tabIndex === 0; })[0] : $('.kd-ds__yil[tabindex="0"]');
    });
    var sheetAc = acilir.ac, sheetKapat = acilir.kapat;
    document.addEventListener('kd-dogum-ac', function () {
      var kart = kok.closest('[data-durum="ozet"]'), degistir = kart && kart.querySelector('.kd-degistir');
      if (degistir) degistir.click();                                                  // özet görünümündeyse önce formu aç
      if (!mobilMq.matches) tetik.scrollIntoView({ block: 'center', behavior: 'instant' });
      sheetAc();
    });

    /* ---------- başlangıç: kayıt → URL profili → evre çipi ---------- */
    (function () {
      var ev = seciliEvre(), modEv = ev ? (ev === 'hamilelik' ? 'gebelik' : 'dogum') : null;
      var k = oku(), b = bugun(), kuruldu = false;
      if (k && (k.mod === 'dogum' || k.mod === 'gebelik') && (!modEv || modEv === k.mod)) {
        var y = k.y === 'once' ? 'once' : parseInt(k.y, 10), m = k.m == null ? null : parseInt(k.m, 10);
        d.mod = k.mod;
        if (k.mod === 'dogum' && typeof y === 'number' && y < b.y - 3) y = 'once';
        var gecerli = y === 'once' ? k.mod === 'dogum' : (!isNaN(y) && m >= 1 && m <= 12 && ayGecerli(y, m));
        if (gecerli) {
          d.y = y; d.m = y === 'once' ? null : m;
          var s = sonuc();
          if (!(s.evre && ev && s.evre !== ev)) kuruldu = true;
        }
        if (!kuruldu) d = { mod: 'dogum', y: null, m: null };
      }
      if (!kuruldu) {
        var p = window.DadaKids && window.DadaKids.profil;
        d.mod = modEv || 'dogum';
        if (d.mod === 'gebelik') d.y = b.y;
        else if (p && p.ay !== null && p.ay >= 0 && p.ay <= 36) { var t = b.y * 12 + (b.m - 1) - p.ay; d.y = Math.floor(t / 12); d.m = t % 12 + 1; }
      }
      yillariCiz(); guncelle();
      if (kuruldu && !ev) evreyeYansit();
      kok.classList.add('kd-ds--hazir');
    })();
  }

  /* ---------- açılır panel (ortak): düğme ↔ popover (masaüstü) / alt sayfa (≤640px) ----------
     Esc ve dış tık kapatır, odak tetiğe döner; Tab panel içinde döner; mobilde panel body'ye taşınır.
     konum: true → popover ekrana sığdırılır (yatay kaydırma, yer yoksa tetiğin üstüne açılır, gerekirse iç kaydırma). */
  function acilirKur(kok, panel, perde, tetik, ilkOdak, secenek) {
    var konum = !!(secenek && secenek.konum), yer = document.createComment('kd-ds-panel'), acik = false, kapatZaman = null;
    function odaklanabilir() { return Array.prototype.slice.call(panel.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')).filter(function (x) { return x.offsetParent !== null || x === document.activeElement; }); }
    function rolAyarla() {
      if (acik) kapat(false);
      if (mobilMq.matches) panel.setAttribute('aria-modal', 'true'); else panel.removeAttribute('aria-modal');
    }
    function konumla() {
      panel.removeAttribute('data-yon'); panel.style.removeProperty('--ds-kay'); panel.style.removeProperty('max-height');
      if (mobilMq.matches) return;
      var r = panel.getBoundingClientRect(), kay = 0;
      if (r.right > innerWidth - 16) kay = innerWidth - 16 - r.right;
      if (r.left + kay < 16) kay = 16 - r.left;
      if (kay) panel.style.setProperty('--ds-kay', Math.round(kay) + 'px');
      // dikey: altta yer varsa alta; yoksa üstte (Kids barının altında) yer varsa üste; yoksa sayfayı kaydır, yine olmazsa geniş tarafta iç kaydırma
      var bar = document.querySelector('.kd-ust'), h = panel.scrollHeight;
      function bosluk() { var t = tetik.getBoundingClientRect(), k = kok.getBoundingClientRect(), ust = bar ? Math.max(0, bar.getBoundingClientRect().bottom) : 0; return { alt: innerHeight - t.bottom - 24, yuk: k.top - ust - 24 }; }
      var b = bosluk();
      if (h <= b.alt) return;
      if (h <= b.yuk) { panel.setAttribute('data-yon', 'ust'); return; }
      window.scrollBy({ top: Math.ceil(h - b.alt), behavior: 'instant' }); b = bosluk();
      if (h <= b.alt) return;
      if (b.yuk > b.alt) panel.setAttribute('data-yon', 'ust');
      panel.style.maxHeight = Math.max(240, Math.floor(Math.max(b.alt, b.yuk))) + 'px';
    }
    function ac() {
      if (acik) return;
      var mobil = mobilMq.matches;
      clearTimeout(kapatZaman);
      acik = true;
      if (mobil && panel.parentNode === kok) { kok.insertBefore(yer, panel); document.body.appendChild(perde); document.body.appendChild(panel); }
      perde.hidden = !mobil; void panel.offsetHeight;                                  // geçiş için bir kare
      panel.setAttribute('data-acik', ''); kok.setAttribute('data-acik', '');
      tetik.setAttribute('aria-expanded', 'true');
      if (mobil) document.documentElement.classList.add('kd-ds-kilit');
      else if (konum) konumla();
      else panel.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      var f = ilkOdak();
      setTimeout(function () { (f || panel).focus(); }, azaltMq.matches ? 0 : 60);
    }
    function yerineKoy() { if (panel.parentNode !== kok && yer.parentNode) { yer.parentNode.insertBefore(panel, yer); yer.parentNode.insertBefore(perde, yer); yer.parentNode.removeChild(yer); } }
    function kapat(odakGeri) {
      if (!acik) return;
      acik = false; panel.removeAttribute('data-acik'); kok.removeAttribute('data-acik'); perde.hidden = true;
      tetik.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('kd-ds-kilit');
      if (odakGeri !== false) tetik.focus();
      kapatZaman = setTimeout(yerineKoy, azaltMq.matches ? 0 : 360);
    }
    tetik.addEventListener('click', function () { if (acik) kapat(); else ac(); });
    document.addEventListener('pointerdown', function (e) { if (acik && !mobilMq.matches && !panel.contains(e.target) && !tetik.contains(e.target)) kapat(false); });
    document.addEventListener('keydown', function (e) { if (acik && e.key === 'Escape') kapat(); });
    perde.addEventListener('click', function () { kapat(); });
    panel.querySelector('[data-kd-ds-kapat]').addEventListener('click', function () { kapat(); });
    var tamam = panel.querySelector('[data-kd-ds-tamam]'); if (tamam) tamam.addEventListener('click', function () { kapat(); });
    panel.addEventListener('keydown', function (e) {
      if (!acik) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); kapat(); return; }
      if (e.key === 'Tab') {
        var f = odaklanabilir(); if (!f.length) return;
        var ilk = f[0], son = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === ilk || document.activeElement === panel)) { e.preventDefault(); son.focus(); }
        else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
      }
    });
    if (mobilMq.addEventListener) mobilMq.addEventListener('change', rolAyarla); else if (mobilMq.addListener) mobilMq.addListener(rolAyarla);
    rolAyarla();
    return { ac: ac, kapat: kapat, acikMi: function () { return acik; } };
  }

  /* =====================================================================
     TARİH KİPİ (gün hassasiyeti) — dogumSecici(o, {gun: true, girdi}) markup'ı ([data-kd-tarih])
     Yıl (radiogroup) → Ay (grid) → Gün (grid, Pzt başlangıçlı). Değer gizli input'a ISO (yyyy-aa-gg) yazılır ve
     'change' olayı yayılır; sayfa betiği input.value'yu okur. Gün seçilince panel kapanır, odak tetiğe döner.
     data-deger="bugun" → başlangıç bugün · data-min-girdi="id" → o input'un değeri alt sınır (canlı)
     data-onden="dogum" → yalnız okuyarak hub kaydından ('dadakids.dogum.v1') yıl+ay ön seçimi; hiçbir şey yazılmaz.
     API: kok.kdTarih = { deger(), ayarla(iso, yay), ac(), kapat() }
     ===================================================================== */
  var KISA_AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var GUN_AD = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  function iki(n) { return (n < 10 ? '0' : '') + n; }
  function iso(y, m, g) { return y + '-' + iki(m) + '-' + iki(g); }
  function bugunIso() { var d = new Date(); return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
  function isoParca(s) { var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return p ? { y: +p[1], m: +p[2], g: +p[3] } : null; }
  function ayGunu(y, m) { return new Date(y, m, 0).getDate(); }

  function kurTarih(kok) {
    var panel = kok.querySelector('.kd-ds__panel'), perde = kok.querySelector('[data-kd-ds-perde]');
    var $ = function (s) { return kok.querySelector(s) || panel.querySelector(s); };
    var girdi = kok.querySelector('input[type="hidden"]'), tetik = $('.kd-ds__ac');
    var yillarKap = $('[data-kd-ds-yillar]'), aylarKap = $('[data-kd-ds-aylar]'), gunlerKap = $('[data-kd-ds-gunler]');
    var aylar = Array.prototype.slice.call(aylarKap.querySelectorAll('.kd-ds__ay'));
    var kisaEl = $('[data-kd-ds-kisa]'), metinEl = $('[data-kd-ds-tetik]'), ayIpucu = $('[data-kd-ds-ay-ipucu]'), gunIpucu = $('[data-kd-ds-gun-ipucu]');
    var minGirdi = kok.getAttribute('data-min-girdi') ? document.getElementById(kok.getAttribute('data-min-girdi')) : null;
    var yilSayi = +kok.getAttribute('data-yil-sayi') || 5;
    var d = { y: null, m: null, g: null }, cizilen = '';

    function sinir() {
      var max = bugunIso(), min = minGirdi && isoParca(minGirdi.value) ? minGirdi.value : null;
      if (min && min > max) min = null;
      return { min: min, max: max };
    }
    function yillar() {
      var s = sinir(), ust = isoParca(s.max).y, alt = s.min ? Math.max(isoParca(s.min).y, ust - 9) : ust - yilSayi + 1, l = [];
      for (var y = ust; y >= alt; y--) l.push(y);
      return l;
    }
    function ayGecerli(y, m) { if (y === null) return false; var s = sinir(); return iso(y, m, ayGunu(y, m)) >= (s.min || '0000') && iso(y, m, 1) <= s.max; }
    function gunGecerli(y, m, g) { var s = sinir(), v = iso(y, m, g); return v >= (s.min || '0000') && v <= s.max; }
    function uzunTarih(p) { return p.g + ' ' + AYLAR[p.m - 1] + ' ' + p.y; }

    /* ---------- çizim ---------- */
    function yillariCiz() {
      var b = bugun();
      yillarKap.innerHTML = '';
      yillar().forEach(function (y, i) {
        var alt = y === b.y ? 'bu yıl' : y === b.y - 1 ? 'geçen yıl' : '';
        yillarKap.appendChild(el('button', { type: 'button', role: 'radio', class: 'kd-ds__yil', 'data-y': String(y), 'data-renk': YIL_RENK[i % 4], 'aria-checked': 'false', tabindex: '-1', 'aria-label': y + (alt ? ', ' + alt : '') }, '<b>' + y + '</b>' + (alt ? '<small aria-hidden="true">' + alt + '</small>' : '')));
      });
    }
    function gunleriCiz() {
      var anahtar = d.y + '-' + d.m + '|' + sinir().min;
      if (anahtar === cizilen) return; cizilen = anahtar;
      var bas = '<div role="row" class="kd-ds__hafta kd-ds__hafta--bas">' + ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(function (k, i) { return '<span role="columnheader" class="kd-ds__hg" aria-label="' + GUN_AD[(i + 1) % 7] + '">' + k + '</span>'; }).join('') + '</div>';
      if (d.y === null || d.m === null) { gunlerKap.innerHTML = bas; gunlerKap.setAttribute('aria-disabled', 'true'); return; }
      gunlerKap.removeAttribute('aria-disabled');
      var n = ayGunu(d.y, d.m), bosluk = (new Date(d.y, d.m - 1, 1).getDay() + 6) % 7, bu = bugunIso(), html = bas, hucre = [];
      for (var i = 0; i < bosluk; i++) hucre.push('<span role="gridcell" class="kd-ds__bos"></span>');
      for (var g = 1; g <= n; g++) {
        var gec = gunGecerli(d.y, d.m, g), haftaG = GUN_AD[new Date(d.y, d.m - 1, g).getDay()];
        hucre.push('<span role="gridcell" class="kd-ds__gun' + (iso(d.y, d.m, g) === bu ? ' kd-ds__gun--bugun' : '') + '" data-g="' + g + '" tabindex="-1" aria-selected="false" aria-disabled="' + !gec + '" aria-label="' + g + ' ' + AYLAR[d.m - 1] + ' ' + d.y + ', ' + haftaG + (iso(d.y, d.m, g) === bu ? ', bugün' : '') + (gec ? '' : ', seçilemez') + '">' + g + '</span>');
      }
      while (hucre.length % 7) hucre.push('<span role="gridcell" class="kd-ds__bos"></span>');
      for (var r = 0; r < hucre.length; r += 7) html += '<div role="row" class="kd-ds__hafta">' + hucre.slice(r, r + 7).join('') + '</div>';
      gunlerKap.innerHTML = html;
    }
    function gunler() { return Array.prototype.slice.call(gunlerKap.querySelectorAll('.kd-ds__gun')); }
    function guncelle() {
      var yb = Array.prototype.slice.call(yillarKap.querySelectorAll('.kd-ds__yil')), secYil = null;
      yb.forEach(function (btn) { var s = String(d.y) === btn.getAttribute('data-y'); btn.setAttribute('aria-checked', String(s)); btn.tabIndex = -1; if (s) secYil = btn; });
      if (yb.length) (secYil || yb[0]).tabIndex = 0;
      var yilYok = d.y === null, odak = false;
      ayIpucu.textContent = yilYok ? 'önce yılı seçin' : '';
      aylarKap.setAttribute('aria-disabled', String(yilYok));
      aylar.forEach(function (h) {
        var m = +h.getAttribute('data-m'), gec = ayGecerli(d.y, m), sec = !yilYok && d.m === m;
        h.setAttribute('aria-disabled', String(!gec)); h.setAttribute('aria-selected', String(sec));
        h.querySelector('[data-ay-etiket]').textContent = AYLAR[m - 1] + (yilYok ? '' : ' ' + d.y) + (!gec && !yilYok ? ', seçilemez' : '');
        if (sec) { h.tabIndex = 0; odak = true; } else h.tabIndex = -1;
      });
      if (!odak) (aylar.filter(function (h) { return h.getAttribute('aria-disabled') === 'false'; })[0] || aylar[0]).tabIndex = 0;
      gunleriCiz();
      gunIpucu.textContent = d.m === null ? 'önce ayı seçin' : '';
      var gl = gunler(), odakG = false;
      gl.forEach(function (h) { var sec = +h.getAttribute('data-g') === d.g; h.setAttribute('aria-selected', String(sec)); if (sec) { h.tabIndex = 0; odakG = true; } else h.tabIndex = -1; });
      if (!odakG && gl.length) (gl.filter(function (h) { return h.getAttribute('aria-disabled') === 'false'; })[0] || gl[0]).tabIndex = 0;
      // özet + tetik
      var p = isoParca(girdi.value);
      kisaEl.textContent = d.g !== null && d.m !== null ? uzunTarih(d) : d.m !== null ? AYLAR[d.m - 1] + ' ' + d.y + ' · günü seçin' : d.y !== null ? d.y + ' · ayı seçin' : '';
      if (p) {
        var bugunMu = girdi.value === bugunIso();
        metinEl.innerHTML = '<span aria-hidden="true">' + (bugunMu ? 'Bugün' : p.g + ' ' + KISA_AY[p.m - 1] + ' ' + p.y) + '</span><span class="kd-gizli">' + (bugunMu ? 'bugün, ' : '') + uzunTarih(p) + '</span>';
      } else metinEl.textContent = kok.getAttribute('data-tetik-bos') || 'Tarih seçin';
      tetik.setAttribute('data-dolu', String(!!p));
    }
    function yaz(v, yay) {
      if (girdi.value === v) return;
      girdi.value = v;
      if (yay !== false) girdi.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function isle() { yaz(d.y !== null && d.m !== null && d.g !== null ? iso(d.y, d.m, d.g) : ''); }
    function durumDegerden() { var p = isoParca(girdi.value); if (p) d = { y: p.y, m: p.m, g: p.g }; }
    function ziplat(h) { if (azaltMq.matches || !h) return; h.classList.remove('kd-ds-zip'); void h.offsetWidth; h.classList.add('kd-ds-zip'); h.addEventListener('animationend', function f() { h.classList.remove('kd-ds-zip'); h.removeEventListener('animationend', f); }); }

    /* ---------- seçim ---------- */
    function yilSec(btn) {
      var y = +btn.getAttribute('data-y'); if (d.y === y) return;
      d.y = y;
      if (d.m !== null && !ayGecerli(d.y, d.m)) { d.m = null; d.g = null; }
      if (d.g !== null && (d.g > ayGunu(d.y, d.m) || !gunGecerli(d.y, d.m, d.g))) d.g = null;
      isle(); guncelle();
    }
    function aySec(h) {
      if (h.getAttribute('aria-disabled') === 'true') { ziplat(ayIpucu); return; }
      d.m = +h.getAttribute('data-m');
      if (d.g !== null && (d.g > ayGunu(d.y, d.m) || !gunGecerli(d.y, d.m, d.g))) d.g = null;
      isle(); guncelle();
      var f = gunler().filter(function (x) { return x.tabIndex === 0; })[0];      // sıradaki adım: gün
      (f || h).focus();
    }
    function gunSec(h) {
      if (h.getAttribute('aria-disabled') === 'true') return;
      d.g = +h.getAttribute('data-g');
      isle(); guncelle();
      acilir.kapat();
    }
    yillarKap.addEventListener('click', function (e) { var b = e.target.closest('.kd-ds__yil'); if (b) { yilSec(b); b.focus(); } });
    yillarKap.addEventListener('keydown', function (e) {
      var yb = Array.prototype.slice.call(yillarKap.querySelectorAll('.kd-ds__yil')), i = yb.indexOf(document.activeElement); if (i < 0) return;
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % yb.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + yb.length) % yb.length;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = yb.length - 1;
      if (j === null) return;
      e.preventDefault(); yb[j].focus(); yilSec(yb[j]);
    });
    function izgaraGez(e, liste, sutun, sec) {
      var i = liste.indexOf(document.activeElement); if (i < 0) return;
      var j = null, k = e.key, son = liste.length - 1;
      if (k === 'ArrowRight') j = Math.min(son, i + 1); else if (k === 'ArrowLeft') j = Math.max(0, i - 1);
      else if (k === 'ArrowDown') j = i + sutun <= son ? i + sutun : i; else if (k === 'ArrowUp') j = i - sutun >= 0 ? i - sutun : i;
      else if (k === 'Home' || k === 'End') {                                    // satır başı/sonu (Ctrl: ızgara başı/sonu)
        var satir = liste[i].parentNode.querySelectorAll('.kd-ds__gun, .kd-ds__ay');
        j = e.ctrlKey ? (k === 'Home' ? 0 : son) : liste.indexOf(satir[k === 'Home' ? 0 : satir.length - 1]);
      }
      else if (k === 'Enter' || k === ' ' || k === 'Spacebar') { e.preventDefault(); sec(liste[i]); return; }
      if (j === null) return;
      e.preventDefault();
      liste.forEach(function (h, x) { h.tabIndex = x === j ? 0 : -1; });
      liste[j].focus();
    }
    aylarKap.addEventListener('click', function (e) { var h = e.target.closest('.kd-ds__ay'); if (h) aySec(h); });
    aylarKap.addEventListener('keydown', function (e) { izgaraGez(e, aylar, 4, aySec); });
    gunlerKap.addEventListener('click', function (e) { var h = e.target.closest('.kd-ds__gun'); if (h) gunSec(h); });
    gunlerKap.addEventListener('keydown', function (e) { izgaraGez(e, gunler(), 7, gunSec); });

    var acilir = acilirKur(kok, panel, perde, tetik, function () {
      durumDegerden(); guncelle();
      var q = function (kap) { return kap.querySelector('[tabindex="0"]'); };
      return d.y === null ? q(yillarKap) : d.m === null ? q(aylarKap) : (q(gunlerKap) || q(aylarKap));
    }, { konum: true });
    if (minGirdi) minGirdi.addEventListener('change', function () { cizilen = ''; yillariCiz(); if (d.y !== null && yillar().indexOf(d.y) < 0) { d.y = null; d.m = null; d.g = null; } guncelle(); });

    /* ---------- başlangıç ---------- */
    var bas = kok.getAttribute('data-deger');
    if (bas === 'bugun') girdi.value = bugunIso(); else if (isoParca(bas)) girdi.value = bas;
    durumDegerden();
    if (d.y === null && kok.getAttribute('data-onden') === 'dogum') {               // yalnız okuma: hub'da seçilen doğum ayı
      var k = oku(), b = bugun();
      if (k && k.mod === 'dogum' && k.y !== 'once') { var ky = parseInt(k.y, 10), km = parseInt(k.m, 10); if (ky >= b.y - yilSayi + 1 && km >= 1 && km <= 12 && ayGecerli(ky, km)) { d.y = ky; d.m = km; } }
    }
    yillariCiz(); guncelle();
    kok.kdTarih = {
      deger: function () { return girdi.value; },
      ayarla: function (v, yay) { var p = isoParca(v); d = p ? { y: p.y, m: p.m, g: p.g } : { y: null, m: null, g: null }; yaz(p ? v : '', yay); yillariCiz(); guncelle(); },
      ac: function () { acilir.ac(); }, kapat: function () { acilir.kapat(false); }
    };
    kok.classList.add('kd-ds--hazir');
  }

  function basla() { Array.prototype.slice.call(document.querySelectorAll('[data-kd-dogum]')).forEach(function (k) { if (k.hasAttribute('data-kd-tarih')) kurTarih(k); else kur(k); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla); else basla();
})();
