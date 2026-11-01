/* Dada Gastro Kids — DSÖ büyüme persentili (sahibi: araçlar kolu)
   Veri: veri/who-lms.json (çalışma anında). LMS: z = ((X/M)^L − 1)/(L·S); L=0 → ln(X/M)/S. Persentil = Φ(z).
   Hiçbir değer saklanmaz. */
(function () {
  'use strict';
  var kok = document.getElementById('kdPersentil');
  if (!kok) return;
  var $ = function (s, k) { return (k || kok).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || kok).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var OLCU = [
    { k: 'kilo', id: 'prKilo', ad: 'Kilo', ozne: 'Kilosu', birim: 'kg', min: 0.5, max: 35, ondalik: 2 },
    { k: 'boy', id: 'prBoy', ad: 'Boy', ozne: 'Boyu', birim: 'cm', min: 35, max: 125, ondalik: 1 },
    { k: 'basCevresi', id: 'prBas', ad: 'Baş çevresi', ozne: 'Baş çevresi', birim: 'cm', min: 25, max: 60, ondalik: 1 }
  ];
  var AY_GUN = 30.4375;
  var Z = { 3: -1.880794, 15: -1.036433, 50: 0, 85: 1.036433, 97: 1.880794 };

  /* ---------- Matematik ---------- */
  function erf(x) { // Abramowitz–Stegun 7.1.26 (hata < 1.5e-7)
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function lms(tablo, ay) {
    var a = Math.max(0, Math.min(36, ay)), i = Math.floor(a), f = a - i;
    var r0 = tablo[String(i)], r1 = tablo[String(Math.min(36, i + 1))] || r0;
    if (!r0) return null;
    return { L: r0.L + (r1.L - r0.L) * f, M: r0.M + (r1.M - r0.M) * f, S: r0.S + (r1.S - r0.S) * f };
  }
  function zHesap(x, p) { return Math.abs(p.L) < 1e-9 ? Math.log(x / p.M) / p.S : (Math.pow(x / p.M, p.L) - 1) / (p.L * p.S); }
  function zDeger(z, p) { return Math.abs(p.L) < 1e-9 ? p.M * Math.exp(p.S * z) : p.M * Math.pow(1 + p.L * p.S * z, 1 / p.L); }
  window.DadaKidsPersentil = { phi: phi, lms: lms, z: zHesap }; // test/inceleme için

  /* ---------- Biçim ---------- */
  function sayiOku(s) {
    s = String(s || '').trim().replace(/\s/g, '');
    if (!s) return null;
    if (/^\d+([.,]\d+)?$/.test(s)) return parseFloat(s.replace(',', '.'));
    return NaN;
  }
  function sayiYaz(n, ondalik) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: ondalik == null ? 1 : ondalik }); }
  // "%42'sinden" — Türkçe ek: sayının okunuşunun son sözcüğüne göre
  var BIRLER = ['', "'inden", "'sinden", "'ünden", "'ünden", "'inden", "'sından", "'sinden", "'inden", "'undan"];
  var ONLAR = ['', "'undan", "'sinden", "'undan", "'ından", "'sinden", "'ından", "'inden", "'inden", "'ından"];
  function ekAblatif(metin) {
    var r = metin.replace(/\D/g, ''), son = +r.slice(-1);
    if (son) return BIRLER[son];
    var on = +r.slice(-2, -1);
    if (on) return ONLAR[on];
    if (r.length >= 3) return "'ünden"; // yüz
    return "'ından"; // sıfır
  }
  function yuzdeMetni(p) { return p < 1 || p > 99 ? sayiYaz(p, 1) : String(Math.round(p)); }

  /* ---------- Tarih ---------- */
  function iki(n) { return (n < 10 ? '0' : '') + n; }
  function bugun() { var d = new Date(); return d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate()); }
  function parca(s) { var p = String(s).split('-'); return [+p[0], +p[1] - 1, +p[2]]; }
  function gecerli(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ''); }
  function yasHesap(dogum, olcum) {
    var a = parca(dogum), b = parca(olcum);
    var gun = Math.round((Date.UTC(b[0], b[1], b[2]) - Date.UTC(a[0], a[1], a[2])) / 864e5);
    var ay = (b[0] - a[0]) * 12 + (b[1] - a[1]); if (b[2] < a[2]) ay--;
    var cap = new Date(Date.UTC(a[0], a[1] + ay, 1));
    var sonGun = new Date(Date.UTC(cap.getUTCFullYear(), cap.getUTCMonth() + 1, 0)).getUTCDate();
    var capGun = Date.UTC(cap.getUTCFullYear(), cap.getUTCMonth(), Math.min(a[2], sonGun));
    var kalan = Math.round((Date.UTC(b[0], b[1], b[2]) - capGun) / 864e5);
    return { gun: gun, ay: ay, kalanGun: kalan, ayKesir: gun / AY_GUN };
  }
  function yasMetni(y) {
    var m = y.ay + ' ay' + (y.kalanGun ? ' ' + y.kalanGun + ' gün' : '');
    if (y.ay >= 12) { var yil = Math.floor(y.ay / 12), ay = y.ay % 12; m += ' (' + yil + ' yaş' + (ay ? ' ' + ay + ' ay' : '') + ')'; }
    return y.ay === 0 && y.kalanGun === 0 ? 'Yeni doğan (0 gün)' : m;
  }

  /* ---------- Veri ---------- */
  var who = null, whoSoz = null;
  function whoYukle() {
    if (whoSoz) return whoSoz;
    whoSoz = fetch('veri/who-lms.json', { cache: 'force-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { who = j; return j; })
      .catch(function (e) { whoSoz = null; throw e; });
    return whoSoz;
  }
  whoYukle().catch(function () { /* gönderimde yeniden denenir */ });

  /* ---------- Form ---------- */
  var form = $('#prForm');
  var dogumEl = $('#prDogum'), olcumEl = $('#prOlcum'), yasEl = $('[data-pr-yas]'), hataEl = $('[data-pr-hata]');
  olcumEl.value = bugun(); olcumEl.max = bugun(); dogumEl.max = bugun();
  try {
    var pc = window.DadaKids && window.DadaKids.profil && window.DadaKids.profil.c;
    if (pc === 'kiz' || pc === 'erkek') { var r = form.querySelector('input[name="cinsiyet"][value="' + pc + '"]'); if (r) r.checked = true; }
  } catch (e) { /* yok say */ }

  function hata(m, odak) { hataEl.textContent = m || ''; hataEl.hidden = !m; if (m && odak) odak.focus(); }
  function yasGoster() {
    if (!gecerli(dogumEl.value) || !gecerli(olcumEl.value)) { yasEl.textContent = ''; return null; }
    var y = yasHesap(dogumEl.value, olcumEl.value);
    if (y.gun < 0) { yasEl.textContent = 'Ölçüm tarihi doğum tarihinden önce olamaz.'; yasEl.setAttribute('data-hata', ''); return null; }
    yasEl.removeAttribute('data-hata');
    if (y.ayKesir > 36.0001) { yasEl.textContent = 'Yaş: ' + yasMetni(y) + ' — bu araç 0–36 ay için hesaplar.'; yasEl.setAttribute('data-hata', ''); return null; }
    yasEl.innerHTML = '<i class="fa-solid fa-cake-candles" aria-hidden="true"></i> Ölçüm günündeki yaş: <b>' + esc(yasMetni(y)) + '</b>';
    return y;
  }
  dogumEl.addEventListener('change', yasGoster); olcumEl.addEventListener('change', yasGoster);

  var hesaplandi = false, aktifSekme = null, zaman;
  form.addEventListener('submit', function (e) { e.preventDefault(); hesapla(true); });
  form.addEventListener('input', function () { if (!hesaplandi) return; clearTimeout(zaman); zaman = setTimeout(function () { hesapla(false); }, 350); });
  form.addEventListener('change', function (e) { if (hesaplandi && e.target.type !== 'text') hesapla(false); });

  function hesapla(kullanici) {
    hata('');
    var c = (form.querySelector('input[name="cinsiyet"]:checked') || {}).value;
    if (!c) return kullanici && hata('Lütfen cinsiyet seçin.', form.querySelector('input[name="cinsiyet"]'));
    if (!gecerli(dogumEl.value)) return kullanici && hata('Lütfen doğum tarihini girin.', dogumEl);
    if (!gecerli(olcumEl.value)) return kullanici && hata('Lütfen ölçüm tarihini girin.', olcumEl);
    var y = yasGoster();
    if (!y) return kullanici && hata(yasEl.textContent || 'Tarihleri kontrol edin.', dogumEl);
    var olculer = [], sorun = null;
    OLCU.forEach(function (o) {
      var el = $('#' + o.id), v = sayiOku(el.value);
      el.removeAttribute('aria-invalid');
      if (v === null) return;
      if (isNaN(v)) { sorun = sorun || [o.ad + ' için geçerli bir sayı girin (ör. ' + (o.k === 'kilo' ? '8,4' : '71,5') + ').', el]; el.setAttribute('aria-invalid', 'true'); return; }
      if (v < o.min || v > o.max) { sorun = sorun || [o.ad + ' değeri beklenen aralığın dışında görünüyor. Birimi kontrol edin (' + o.birim + ').', el]; el.setAttribute('aria-invalid', 'true'); return; }
      olculer.push({ o: o, x: v });
    });
    if (sorun) return (kullanici || true) && hata(sorun[0], kullanici ? sorun[1] : null);
    if (!olculer.length) return kullanici && hata('En az bir ölçüm girin: kilo, boy ya da baş çevresi.', $('#prKilo'));
    whoYukle().then(function () {
      hesaplandi = true;
      ciz(c, y, olculer.map(function (m) {
        var p = lms(who[c][m.o.k], y.ayKesir), z = zHesap(m.x, p);
        return { o: m.o, x: m.x, z: z, p: phi(z) * 100, lms: p };
      }));
      if (kullanici) { var s = $('[data-pr-sonuc]'); if (s.getBoundingClientRect().top > innerHeight * 0.6) s.scrollIntoView({ behavior: hareketAz() ? 'auto' : 'smooth', block: 'start' }); }
    }, function () { hata('Büyüme verisi yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.'); });
  }
  function hareketAz() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } }

  /* ---------- Çıktı ---------- */
  function cumle(r) {
    if (r.z < -3) return r.o.ozne + ' 3. persentilin altında.';
    if (r.z > 3) return r.o.ozne + ' 97. persentilin üstünde.';
    var t = yuzdeMetni(r.p);
    return r.o.ozne + ', yaşıtlarının yaklaşık %' + t + ekAblatif(t) + ' fazla.';
  }
  function buyukSayi(r) {
    if (r.z < -3) return '<b>&lt;3.</b><span>persentil</span>';
    if (r.z > 3) return '<b>&gt;97.</b><span>persentil</span>';
    return '<b>' + esc(yuzdeMetni(r.p)) + '.</b><span>persentil</span>';
  }
  function sekmeEtiket(r) { return r.z < -3 ? '&lt;3.' : r.z > 3 ? '&gt;97.' : esc(yuzdeMetni(r.p)) + '.'; }

  var sonCizim = null;
  function ciz(c, y, sonuclar) {
    sonCizim = [c, y, sonuclar];
    $('[data-pr-bos]').hidden = true;
    $('[data-pr-cikti]').hidden = false;
    // 1 birim ≈ 1 px: yazılar her genişlikte okunur kalsın
    var gen = $('[data-pr-paneller]').clientWidth - (innerWidth < 640 ? 32 : 48);
    G.w = Math.round(Math.max(290, Math.min(780, gen || 640)));
    G.h = G.w < 480 ? 300 : 360;
    G.l = G.w < 480 ? 44 : 52;
    var renk = c === 'kiz' ? 'pembe' : 'mavi';
    if (!sonuclar.some(function (r) { return r.o.k === aktifSekme; })) aktifSekme = sonuclar[0].o.k;
    $('[data-pr-sekmeler]').innerHTML = sonuclar.map(function (r) {
      var sec = r.o.k === aktifSekme;
      return '<button type="button" role="tab" id="prSekme-' + r.o.k + '" aria-controls="prPanel-' + r.o.k + '" aria-selected="' + sec + '" tabindex="' + (sec ? 0 : -1) + '" data-renk="' + renk + '">' +
        '<span>' + esc(r.o.ad) + '</span><b>' + sekmeEtiket(r) + '</b><small>persentil</small></button>';
    }).join('');
    $('[data-pr-paneller]').innerHTML = sonuclar.map(function (r) {
      var disarida = r.p < 3 || r.p > 97;
      var not = disarida
        ? 'Bu ölçüm 3–97 aralığının dışında. Tek bir ölçüm tanı değildir; bebeğinizin eğrisi zaman içinde değerlendirilir. Bir sonraki kontrolde doktorunuzla paylaşın.'
        : '3. ile 97. persentil arası, yaşıtların büyük çoğunluğunu kapsayan geniş bir aralıktır. Asıl önemli olan zaman içindeki eğilimdir.';
      var boyNot = r.o.k === 'boy' ? (y.ayKesir >= 24 ? ' 24. aydan sonra değerler ayakta ölçülen boy tablosuna göredir.' : ' 24. aya kadar boy yatarak ölçülür.') : '';
      return '<div class="kd-pr-panel" role="tabpanel" id="prPanel-' + r.o.k + '" aria-labelledby="prSekme-' + r.o.k + '" data-renk="' + renk + '"' + (r.o.k === aktifSekme ? '' : ' hidden') + ' tabindex="0">' +
        '<div class="kd-pr-ozet"><div class="kd-pr-ozet__sayi"><small>' + esc(r.o.ad) + ' · ' + esc(sayiYaz(r.x, r.o.ondalik)) + ' ' + r.o.birim + '</small>' + buyukSayi(r) + '</div>' +
        '<div class="kd-pr-ozet__metin"><p class="kd-pr-ozet__cumle">' + esc(cumle(r)) + '</p><p>' + esc(not + boyNot) + '</p></div></div>' +
        grafik(c, y, r) +
        tablo(c, y, r) +
        '</div>';
    }).join('');
    grafikEtkilesim();
  }

  /* ---------- SVG grafik ---------- */
  var G = { w: 640, h: 360, l: 52, r: 44, t: 30, b: 44 };
  function aralik(ay) {
    var a0 = Math.floor(ay - 6), a1 = Math.ceil(ay + 6);
    if (a0 < 0) { a1 -= a0; a0 = 0; }
    if (a1 > 36) { a0 -= a1 - 36; a1 = 36; }
    return [Math.max(0, a0), Math.min(36, a1)];
  }
  function guzelAdim(span) { var ham = span / 5, us = Math.pow(10, Math.floor(Math.log10(ham))), n = ham / us; return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * us; }

  function grafik(c, y, r) {
    var tab = who[c][r.o.k], ar = aralik(y.ayKesir), a0 = ar[0], a1 = ar[1];
    var adim = 0.25, noktalar = [];
    for (var a = a0; a <= a1 + 1e-9; a += adim) {
      var p = lms(tab, a), s = { a: a };
      Object.keys(Z).forEach(function (k) { s[k] = zDeger(Z[k], p); });
      noktalar.push(s);
    }
    var ymin = Math.min(noktalar[0][3], r.x), ymax = Math.max(noktalar[noktalar.length - 1][97], r.x);
    noktalar.forEach(function (s) { ymin = Math.min(ymin, s[3]); ymax = Math.max(ymax, s[97]); });
    var pad = (ymax - ymin) * 0.08; ymin -= pad; ymax += pad;
    var yAdim = guzelAdim(ymax - ymin);
    ymin = Math.floor(ymin / yAdim) * yAdim; ymax = Math.ceil(ymax / yAdim) * yAdim;
    var X = function (a) { return G.l + (a - a0) / (a1 - a0) * (G.w - G.l - G.r); };
    var Y = function (v) { return G.t + (1 - (v - ymin) / (ymax - ymin)) * (G.h - G.t - G.b); };
    var f = function (n) { return n.toFixed(1); };
    var yol = function (k) { return noktalar.map(function (s, i) { return (i ? 'L' : 'M') + f(X(s.a)) + ' ' + f(Y(s[k])); }).join(''); };
    var bant = function (alt, ust) {
      return noktalar.map(function (s, i) { return (i ? 'L' : 'M') + f(X(s.a)) + ' ' + f(Y(s[ust])); }).join('') +
        noktalar.slice().reverse().map(function (s) { return 'L' + f(X(s.a)) + ' ' + f(Y(s[alt])); }).join('') + 'Z';
    };
    var izgara = '', yEtiket = '';
    for (var v = ymin; v <= ymax + 1e-9; v += yAdim) {
      izgara += '<line class="kd-pr-izgara" x1="' + G.l + '" x2="' + (G.w - G.r) + '" y1="' + f(Y(v)) + '" y2="' + f(Y(v)) + '"/>';
      yEtiket += '<text class="kd-pr-eksen" x="' + (G.l - 10) + '" y="' + f(Y(v) + 4) + '" text-anchor="end">' + sayiYaz(v, yAdim < 1 ? 1 : 0) + '</text>';
    }
    var span = a1 - a0, xAdim = G.w < 420 ? 3 : span > 14 ? 3 : 2, xEtiket = '';
    for (var m = Math.ceil(a0 / xAdim) * xAdim; m <= a1; m += xAdim) {
      xEtiket += '<line class="kd-pr-tik" x1="' + f(X(m)) + '" x2="' + f(X(m)) + '" y1="' + (G.h - G.b) + '" y2="' + (G.h - G.b + 5) + '"/>' +
        '<text class="kd-pr-eksen" x="' + f(X(m)) + '" y="' + (G.h - G.b + 20) + '" text-anchor="middle">' + m + '</text>';
    }
    var son = noktalar[noktalar.length - 1], etiketler = '';
    var etiketY = [97, 85, 50, 15, 3].map(function (k) { return { k: k, y: Y(son[k]) }; });
    for (var i = 1; i < etiketY.length; i++) if (etiketY[i].y - etiketY[i - 1].y < 13) etiketY[i].y = etiketY[i - 1].y + 13;
    etiketY.forEach(function (e) { etiketler += '<text class="kd-pr-bant-etiket' + (e.k === 50 ? ' kd-pr-bant-etiket--orta' : '') + '" x="' + (G.w - G.r + 6) + '" y="' + f(e.y + 4) + '">' + e.k + '</text>'; });
    var px = X(y.ayKesir), py = Y(r.x);
    var deger = sayiYaz(r.x, r.o.ondalik) + ' ' + r.o.birim;
    var sag = px > G.w - G.r - 120;
    var etiketMetin = deger + ' · ' + (r.z < -3 ? '<3.' : r.z > 3 ? '>97.' : yuzdeMetni(r.p) + '.');
    var ew = etiketMetin.length * 7.4 + 18, ex = sag ? px - 14 - ew : px + 14, ey = Math.max(G.t + 2, Math.min(G.h - G.b - 30, py - 34));
    var aciklama = r.o.ad + ' grafiği: ' + a0 + '–' + a1 + ' ay arası DSÖ persentil bantları; bebeğiniz ' + yasMetni(y) + ' iken ' + deger + ', ' + cumle(r);
    return '<figure class="kd-pr-grafik" data-a0="' + a0 + '" data-a1="' + a1 + '">' +
      '<svg viewBox="0 0 ' + G.w + ' ' + G.h + '" role="img" aria-label="' + esc(aciklama) + '" data-x0="' + G.l + '" data-x1="' + (G.w - G.r) + '">' +
      izgara +
      '<path class="kd-pr-bant-dis" d="' + bant(3, 97) + '"/>' +
      '<path class="kd-pr-bant-ic" d="' + bant(15, 85) + '"/>' +
      '<path class="kd-pr-medyan" d="' + yol(50) + '"/>' +
      '<line class="kd-pr-eksen-cizgi" x1="' + G.l + '" x2="' + (G.w - G.r) + '" y1="' + (G.h - G.b) + '" y2="' + (G.h - G.b) + '"/>' +
      yEtiket + xEtiket + etiketler +
      '<text class="kd-pr-eksen kd-pr-eksen--baslik" x="' + ((G.l + G.w - G.r) / 2) + '" y="' + (G.h - 6) + '" text-anchor="middle">Yaş (ay)</text>' +
      '<text class="kd-pr-eksen kd-pr-eksen--baslik" x="' + (G.l - 10) + '" y="' + (G.t - 16) + '" text-anchor="end">' + r.o.birim + '</text>' +
      '<line class="kd-pr-kilavuz" x1="' + f(px) + '" x2="' + f(px) + '" y1="' + f(py) + '" y2="' + (G.h - G.b) + '"/>' +
      '<g class="kd-pr-imlec" hidden><line y1="' + G.t + '" y2="' + (G.h - G.b) + '"/></g>' +
      '<g class="kd-pr-nokta"><circle cx="' + f(px) + '" cy="' + f(py) + '" r="8"/>' +
      '<rect x="' + f(ex) + '" y="' + f(ey) + '" width="' + f(ew) + '" height="26" rx="13"/>' +
      '<text x="' + f(ex + ew / 2) + '" y="' + f(ey + 17.5) + '" text-anchor="middle">' + esc(etiketMetin) + '</text></g>' +
      '</svg>' +
      '<div class="kd-pr-ipucu" hidden></div>' +
      '<figcaption class="kd-pr-lejant"><span><i class="kd-pr-lejant__dis"></i>3–97. persentil</span><span><i class="kd-pr-lejant__ic"></i>15–85. persentil</span><span><i class="kd-pr-lejant__orta"></i>50. (ortanca)</span><span><i class="kd-pr-lejant__nokta"></i>Bebeğiniz</span></figcaption>' +
      '</figure>';
  }

  function tablo(c, y, r) {
    var tab = who[c][r.o.k], ar = aralik(y.ayKesir), satir = '', eklendi = false;
    var cocuk = '<tr class="kd-pr-tablo__cocuk"><th scope="row">Bebeğiniz · ' + esc(yasMetni(y)) + '</th><td colspan="5">' + esc(sayiYaz(r.x, r.o.ondalik) + ' ' + r.o.birim + ' — ' + cumle(r)) + '</td></tr>';
    for (var m = ar[0]; m <= ar[1]; m++) {
      if (!eklendi && y.ayKesir < m) { satir += cocuk; eklendi = true; }
      var t = tab[String(m)]; if (!t) continue;
      satir += '<tr><th scope="row">' + m + ' ay</th>' + ['P3', 'P15', 'P50', 'P85', 'P97'].map(function (k) { return '<td>' + sayiYaz(t[k], 1) + '</td>'; }).join('') + '</tr>';
    }
    if (!eklendi) satir += cocuk;
    return '<details class="kd-pr-tablo"><summary>Tablo olarak göster</summary><div class="kd-pr-tablo__kaydir"><table class="kd-ar-tablo"><caption>' + esc(r.o.ad) + ' (' + r.o.birim + ') — DSÖ persentil değerleri, ' + ar[0] + '–' + ar[1] + ' ay</caption>' +
      '<thead><tr><th scope="col">Yaş</th><th scope="col">3.</th><th scope="col">15.</th><th scope="col">50.</th><th scope="col">85.</th><th scope="col">97.</th></tr></thead><tbody>' + satir + '</tbody></table></div></details>';
  }

  var genSon = innerWidth, boyutZaman;
  addEventListener('resize', function () {
    if (!sonCizim || Math.abs(innerWidth - genSon) < 40) return;
    clearTimeout(boyutZaman); boyutZaman = setTimeout(function () { genSon = innerWidth; ciz.apply(null, sonCizim); }, 200);
  });

  /* ---------- Sekmeler + grafik imleci ---------- */
  $('[data-pr-sekmeler]').addEventListener('click', function (e) { var b = e.target.closest('[role="tab"]'); if (b) sekmeSec(b); });
  $('[data-pr-sekmeler]').addEventListener('keydown', function (e) {
    var l = $$('[role="tab"]', this), i = l.indexOf(document.activeElement); if (i < 0) return;
    var n = e.key === 'ArrowRight' ? (i + 1) % l.length : e.key === 'ArrowLeft' ? (i + l.length - 1) % l.length : e.key === 'Home' ? 0 : e.key === 'End' ? l.length - 1 : -1;
    if (n < 0) return; e.preventDefault(); sekmeSec(l[n]); l[n].focus();
  });
  function sekmeSec(b) {
    aktifSekme = b.id.replace('prSekme-', '');
    $$('[role="tab"]').forEach(function (t) { var s = t === b; t.setAttribute('aria-selected', String(s)); t.tabIndex = s ? 0 : -1; });
    $$('.kd-pr-panel').forEach(function (p) { p.hidden = p.id !== 'prPanel-' + aktifSekme; });
  }
  function grafikEtkilesim() {
    $$('.kd-pr-grafik').forEach(function (fig) {
      var svg = fig.querySelector('svg'), imlec = svg.querySelector('.kd-pr-imlec'), cizgi = imlec.querySelector('line'), ipucu = fig.querySelector('.kd-pr-ipucu');
      var a0 = +fig.getAttribute('data-a0'), a1 = +fig.getAttribute('data-a1');
      var panel = fig.closest('.kd-pr-panel'), k = panel.id.replace('prPanel-', ''), c = (form.querySelector('input[name="cinsiyet"]:checked') || {}).value;
      var o = OLCU.filter(function (x) { return x.k === k; })[0];
      function gizle() { imlec.setAttribute('hidden', ''); ipucu.hidden = true; }
      svg.addEventListener('pointermove', function (e) {
        var kutu = svg.getBoundingClientRect(), olcek = G.w / kutu.width;
        var x = (e.clientX - kutu.left) * olcek;
        if (x < G.l || x > G.w - G.r || !who) return gizle();
        var ay = a0 + (x - G.l) / (G.w - G.l - G.r) * (a1 - a0), yuv = Math.round(ay * 4) / 4;
        var p = lms(who[c][k], yuv);
        var xs = G.l + (yuv - a0) / (a1 - a0) * (G.w - G.l - G.r);
        cizgi.setAttribute('x1', xs); cizgi.setAttribute('x2', xs); imlec.removeAttribute('hidden');
        var aylar = Math.floor(yuv), gun = Math.round((yuv - aylar) * AY_GUN);
        ipucu.innerHTML = '<b>' + aylar + ' ay' + (gun ? ' ' + gun + ' gün' : '') + '</b>' +
          [97, 50, 3].map(function (z) { return '<span>' + z + '. <em>' + sayiYaz(zDeger(Z[z], p), o.ondalik) + ' ' + o.birim + '</em></span>'; }).join('');
        ipucu.hidden = false;
        var px = xs / olcek, solda = px > kutu.width / 2;
        ipucu.style.setProperty('--x', Math.round(solda ? px - ipucu.offsetWidth - 12 : px + 12) + 'px');
      });
      svg.addEventListener('pointerleave', gizle);
    });
  }
})();
