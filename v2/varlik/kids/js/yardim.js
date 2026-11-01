/* =====================================================================
   DADA GASTRO KIDS — Yardım menüsü (sahibi: v2-cekirdek; Pütür'ün yerine, karaktersiz)
   · Kids barındaki <button class="kd-yardim-ac"> (ortak.mjs altMenu) açar/kapatır; panel barın içinde
     (yapışkan katmanla birlikte hareket eder, sayfa başı öğelerinin ve footer'ın üstüne kendiliğinden binmez)
   · 6 işlev: Kaç aylık · Besin güvenli mi · Ne pişirsem · Alerjen · Ek gıdaya hazır mı · Acil (112'ye yönlendirir, ilk yardım adımı yok)
   · Cevaplar kural tabanlı, sitenin kendi verisinden (veri/*.json, çalışma anında fetch); tıbbi cevaplarda
     "Örnek içerik — uzman onayı bekliyor"
   · Klavye: Tab, Enter; Esc kapatır ve odak düğmeye döner; ok tuşları seçenekler arasında. aria-expanded.
   · Depolama yalnız doğum tarihi için (dadakids.dogum.v1, try/catch). prefers-reduced-motion: animasyon yok (CSS)
   ===================================================================== */
(function () {
  'use strict';
  if (window.__kdYardim) return; window.__kdYardim = true;
  var DOGUM_ANAHTAR = 'dadakids.dogum.v1';             // tarih seçici ile aynı şema {y, m, mod}
  var AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var AYLAR_UZUN = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var EVRE_YEDEK = {
    'hamilelik': { ad: 'Hamilelik & Lohusalık', renk: 'pembe', kova: null },
    '0-6-ay': { ad: '0–6 Ay', renk: 'mavi', kova: null },
    '6-8-ay': { ad: '6–8 Ay', renk: 'seftali', kova: 6 },
    '9-12-ay': { ad: '9–12 Ay', renk: 'mint', kova: 9 },
    '1-3-yas': { ad: '1–3 Yaş', renk: 'sari', kova: 12 }
  };
  var DK = function () { return window.DadaKids || null; };
  var EVRE = function () { return (DK() && DK().EVRE) || EVRE_YEDEK; };
  var profil = function () { return (DK() && DK().profil) || { evre: null, c: null, ay: null }; };
  var normal = function (s) { return DK() && DK().normal ? DK().normal(s) : String(s || '').toLocaleLowerCase('tr'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  function oku(k) { try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function yaz(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* depolama kapalı */ } }

  /* ---------- Profil yardımcıları ---------- */
  function evreAydan(ay) { return ay < 6 ? '0-6-ay' : ay < 9 ? '6-8-ay' : ay < 12 ? '9-12-ay' : '1-3-yas'; }
  function bag(href) {                                    // Kids bağlarına profil parametrelerini ekle (kids.js ile aynı kural)
    var p = profil(), parca = href.split('#'), yol = parca[0].split('?'), q = new URLSearchParams(yol[1] || '');
    if (p.evre) q.set('evre', p.evre);
    if (p.c && p.c !== 'belirtilmedi') q.set('c', p.c);
    if (p.ay !== null && p.ay !== undefined) q.set('ay', String(p.ay));
    var s = q.toString();
    return yol[0] + (s ? '?' + s : '') + (parca[1] ? '#' + parca[1] : '');
  }
  function kova() { return DK() && DK().kova ? DK().kova() : null; }
  function asamaAnahtari() {                              // kesim.json aşaması
    var p = profil();
    if (p.ay !== null && p.ay !== undefined) return p.ay < 6 ? null : p.ay < 9 ? '6-8' : p.ay < 12 ? '9-12' : '12+';
    return { '6-8-ay': '6-8', '9-12-ay': '9-12', '1-3-yas': '12+' }[p.evre] || null;
  }
  function cocukAyi() {                                   // bilinmiyorsa null; 0–6 ay evresinde "ek gıda henüz yok" sayılır
    var p = profil(); if (p.ay !== null && p.ay !== undefined) return p.ay;
    if (p.evre === '0-6-ay') return 5;
    return kova();
  }

  /* ---------- Veri (bir kez) ---------- */
  var veriSoz = {};
  function veri(ad) {
    if (!veriSoz[ad]) veriSoz[ad] = fetch('veri/' + ad + '.json').then(function (r) { if (!r.ok) throw new Error(ad); return r.json(); });
    return veriSoz[ad];
  }

  /* ---------- Cevaplar (kural tabanlı, site verisi) ---------- */
  var ORNEK = '<p class="kd-yd__ornek">Örnek içerik — uzman onayı bekliyor</p>';
  function baslik(m) { return '<h3 class="kd-yd__baslik">' + m + '</h3>'; }
  function dugme(href, metin, ikincil) { return '<a class="kd-yd__dugme' + (ikincil ? ' kd-yd__dugme--ikincil' : '') + '" href="' + esc(href) + '">' + metin + '</a>'; }
  function evreAdi(kod) { var e = EVRE()[kod]; return e ? e.ad : kod; }
  function mevsim(m) { return m === 12 || m <= 2 ? 'kis' : m <= 5 ? 'ilkbahar' : m <= 8 ? 'yaz' : 'sonbahar'; }

  var CEVAP = {
    yas: function () {
      var y = new Date().getFullYear();
      var yillar = [y, y - 1, y - 2, y - 3];
      return baslik('Bebeğiniz kaç aylık?')
        + '<p>Doğum yılını ve ayını seçin, evresini bulayım.</p>'
        + '<div class="kd-yd__chipler" role="radiogroup" aria-label="Doğum yılı" data-yd-yil>'
        + yillar.map(function (x) { return '<button type="button" class="kd-yd__chip" role="radio" aria-checked="false" data-yil="' + x + '">' + x + '</button>'; }).join('')
        + '</div>'
        + '<div class="kd-yd__chipler kd-yd__chipler--ay" role="radiogroup" aria-label="Doğum ayı" data-yd-ay>'
        + AYLAR.map(function (a, i) { return '<button type="button" class="kd-yd__chip" role="radio" aria-checked="false" data-ay="' + (i + 1) + '" data-mevsim="' + mevsim(i + 1) + '" aria-label="' + AYLAR_UZUN[i] + '">' + a + '</button>'; }).join('')
        + '</div>'
        + '<div class="kd-yd__sonuc" data-yd-sonuc aria-live="polite"></div>'
        + '<p class="kd-yd__kucuk"><button type="button" class="kd-yd__bag" data-yd-hamile>Hamileyim</button> · Bilgi yalnız bu tarayıcıda kalır.</p>';
    },
    besin: function () {
      veri('besinler'); veri('kesim');                                          // ön yükleme
      var as = asamaAnahtari();
      return baslik('Bu besin güvenli mi?')
        + '<label class="kd-yd__etiket" for="kdYdAra">Besin adı yazın</label>'
        + '<div class="kd-yd__ara"><input id="kdYdAra" type="search" autocomplete="off" placeholder="ör. üzüm, yumurta, bal" enterkeyhint="search"></div>'
        + '<div class="kd-yd__sonuclar" data-yd-besin aria-live="polite"></div>'
        + (as ? '<p class="kd-yd__kucuk">Sonuçlar ' + esc(as === '12+' ? '12 ay ve üzeri' : as + ' ay') + ' için hazırlığı da gösterir.</p>' : '<p class="kd-yd__kucuk">Yaşı “Kaç aylık?” ile seçerseniz yaşa uygun hazırlığı da gösteririm.</p>');
    },
    tarif: function () {
      return veri('kids-tarifler').then(function (v) {
        var liste = (v.tarifler || []).slice().sort(function (a, b) { return a.slug.localeCompare(b.slug); });
        var kv = kova(), p = profil(), erken = kv === null;
        var uygun = liste.filter(function (t) { return erken ? t.yas === 6 : t.yas <= kv; });
        var en = uygun.reduce(function (m, t) { return Math.max(m, t.yas); }, 0);
        var yakin = uygun.filter(function (t) { return t.yas >= en - 3; }); if (yakin.length < 3) yakin = uygun;
        var bas = Math.floor(Date.now() / 864e5) % yakin.length;                // gün içinde sabit, günden güne değişir
        var uc = [0, 1, 2].slice(0, yakin.length).map(function (i) { return yakin[(bas + i) % yakin.length]; });
        var ust = erken
          ? (p.evre === 'hamilelik' || p.evre === '0-6-ay' || (p.ay !== null && p.ay !== undefined && p.ay < 6)
            ? '<p>Ek gıda yaklaşık 6. ayda başlar. O gün geldiğinde ilk tarifler:</p>'
            : '<p>Yaşı seçmediniz; ek gıdaya başlarken ilk tarifler:</p>')
          : '<p>' + esc(evreAdi(p.evre || evreAydan(kv))) + ' için bugün üç öneri:</p>';
        return baslik('Bugün ne pişirsem?') + ust
          + '<ul class="kd-yd__tarifler">' + uc.map(function (t) {
            return '<li><a href="' + esc(bag('kids-tarif.html?t=' + t.slug)) + '"><img src="' + esc(t.gorsel) + '" alt="" width="52" height="52" loading="lazy" decoding="async"><span><b>' + esc(t.ad) + '</b><small>+' + t.yas + ' Ay · ' + t.sureDk + ' dk</small></span></a></li>';
          }).join('') + '</ul>'
          + dugme(bag('kids-tarifler.html' + (kv !== null ? '?yas=' + kv : '')), 'Tüm Kids tarifleri', true);
      });
    },
    alerjen: function () {
      return baslik('Alerjen tanıtımı')
        + '<p>Yeni bir alerjeni tanıştırırken üç gün boyunca gözlemlerinizi kısa notlarla kaydedin.</p>'
        + '<p class="kd-yd__kucuk">3 günlük gözlem yaygın bir uygulama, kesin tıbbi kural değil. Gözlem süresi alerjenlerin tanıştırılmasını geciktirmemeli.</p>'
        + '<div class="kd-yd__satir">' + dugme(bag('kids-arac-alerjen-takip.html'), '3 günlük gözlem') + dugme(bag('kids-rehber-alerjen-tanitimi.html'), 'Alerjen rehberi', true) + '</div>' + ORNEK;
    },
    hazir: function () {
      return veri('evreler').then(function (v) {
        var e = (v.evreler || []).filter(function (x) { return x.kod === '0-6-ay'; })[0] || {};
        var isaretler = (e.kivamDikkat || []).filter(function (m) { return /^Hazır olma işareti \d/.test(m); }).map(function (m) { return m.replace(/^Hazır olma işareti \d:\s*/, ''); });
        var ay = cocukAyi();
        return baslik('Ek gıdaya hazır mı?')
          + (isaretler.length ? '<ul class="kd-yd__liste">' + isaretler.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' : '')
          + (ay !== null && ay < 6 ? '<p class="kd-yd__kucuk">Genel öneri, ek gıdaya 6. ay civarında başlamaktır.</p>' : '')
          + '<p>Beş işaretin tamamını kontrol listesinde tek tek işaretleyin.</p>'
          + dugme(bag('kids-arac-hazir-mi.html'), 'Kontrol listesini aç') + ORNEK;
      });
    },
    acil: function () {
      return '<div class="kd-yd__acil">' + baslik('Acil durum')
        + '<p class="kd-yd__acil-metin"><b>Boğulma şüphesinde hemen 112\'yi arayın.</b></p>'
        + '<a class="kd-yd__dugme kd-yd__dugme--acil" href="tel:112">112\'yi ara</a>'
        + '<p class="kd-yd__kucuk">İlk yardımı önceden, uygulamalı bir kursta öğrenin: <a href="https://www.kizilay.org.tr/" target="_blank" rel="noopener">Türk Kızılay ilk yardım eğitimleri</a></p>' + ORNEK + '</div>';
    }
  };

  var KURULUM = {
    yas: function (ic) {
      var secim = { y: null, m: null };
      var kayit = oku(DOGUM_ANAHTAR);
      if (kayit && kayit.mod !== 'gebelik' && kayit.y && kayit.m) { secim.y = +kayit.y; secim.m = +kayit.m; }
      else { var p = profil(); if (p.ay !== null && p.ay !== undefined) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - p.ay); secim.y = d.getFullYear(); secim.m = d.getMonth() + 1; } }
      var yilKap = ic.querySelector('[data-yd-yil]'), ayKap = ic.querySelector('[data-yd-ay]'), sonuc = ic.querySelector('[data-yd-sonuc]');
      function isaretle() {
        Array.prototype.forEach.call(yilKap.children, function (b) { b.setAttribute('aria-checked', String(+b.dataset.yil === secim.y)); b.tabIndex = (+b.dataset.yil === secim.y || (secim.y === null && b === yilKap.firstElementChild)) ? 0 : -1; });
        var b0 = new Date();
        Array.prototype.forEach.call(ayKap.children, function (b) {
          var m = +b.dataset.ay, gelecek = secim.y === b0.getFullYear() && m > b0.getMonth() + 1;
          b.disabled = gelecek; b.setAttribute('aria-checked', String(m === secim.m));
          b.tabIndex = (m === secim.m || (secim.m === null && m === 1)) ? 0 : -1;
        });
        if (secim.y && secim.m && secim.y === b0.getFullYear() && secim.m > b0.getMonth() + 1) secim.m = null;
        hesapla();
      }
      function hesapla() {
        if (!secim.y || !secim.m) { sonuc.innerHTML = ''; return; }
        var b = new Date(), ay = (b.getFullYear() - secim.y) * 12 + (b.getMonth() + 1 - secim.m);
        if (ay < 0) { sonuc.innerHTML = ''; return; }
        if (ay > 36) {
          sonuc.innerHTML = '<p><b>3 yaşını geçmiş.</b> Dada Gastro Kids 3 yaşa kadar eşlik ediyor; aile tarifleri Dada Gastro\'da.</p>' + dugme('tarifler.html', 'Dada Gastro tarifleri', true);
          return;
        }
        var ev = evreAydan(ay), e = EVRE()[ev] || {};
        sonuc.setAttribute('data-renk', e.renk || '');
        sonuc.innerHTML = '<p>Yaklaşık <b>' + ay + ' aylık</b> → <b>' + esc(e.ad || ev) + '</b> evresi.</p>'
          + (ay < 6 ? '<p class="kd-yd__kucuk">Ek gıda yaklaşık 6. ayda, hazır olma işaretleriyle başlar.</p>' : '')
          + '<div class="kd-yd__satir">' + dugme(bagEvre(ev, ay), esc(e.ad || ev) + ' sayfası').replace('<a ', '<a data-yd-evre ') + '<button type="button" class="kd-yd__dugme kd-yd__dugme--ikincil" data-yd-uygula>Bu yaşı kullan</button></div>';
        sonuc.scrollIntoView({ block: 'nearest' });
      }
      function bagEvre(ev, ay) { var p = profil(), q = new URLSearchParams(); q.set('evre', ev); if (p.c && p.c !== 'belirtilmedi') q.set('c', p.c); q.set('ay', String(ay)); return 'kids-donem-' + ev + '.html?' + q.toString(); }
      function radyoTus(kap, e) {
        var dugmeler = Array.prototype.filter.call(kap.children, function (b) { return !b.disabled; });
        var i = dugmeler.indexOf(document.activeElement); if (i < 0) return;
        var j = null, n = dugmeler.length;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
        if (j !== null) { e.preventDefault(); dugmeler[j].focus(); dugmeler[j].click(); }
      }
      yilKap.addEventListener('click', function (e) { var b = e.target.closest('[data-yil]'); if (!b) return; secim.y = +b.dataset.yil; isaretle(); });
      ayKap.addEventListener('click', function (e) { var b = e.target.closest('[data-ay]'); if (!b || b.disabled) return; secim.m = +b.dataset.ay; isaretle(); });
      yilKap.addEventListener('keydown', function (e) { radyoTus(yilKap, e); });
      ayKap.addEventListener('keydown', function (e) { radyoTus(ayKap, e); });
      ic.addEventListener('click', function (e) {
        if (e.target.closest('[data-yd-evre]')) yaz(DOGUM_ANAHTAR, { y: secim.y, m: secim.m, mod: 'dogum' });
        if (e.target.closest('[data-yd-uygula]')) {
          var b = new Date(), ay = (b.getFullYear() - secim.y) * 12 + (b.getMonth() + 1 - secim.m);
          yaz(DOGUM_ANAHTAR, { y: secim.y, m: secim.m, mod: 'dogum' });
          if (DK() && DK().profilAyarla) DK().profilAyarla({ evre: evreAydan(ay), ay: ay });
          e.target.closest('[data-yd-uygula]').outerHTML = '<span class="kd-yd__onay" role="status">Kaydedildi ✓ Tarifler ve öneriler bu yaşa göre.</span>';
        }
        if (e.target.closest('[data-yd-hamile]')) {
          sonuc.setAttribute('data-renk', 'pembe');
          sonuc.innerHTML = '<p>Hamilelik ve emzirme dönemi için beslenme önerileri hazır.</p>' + dugme(bag('kids-donem-hamilelik.html'), 'Hamilelik sayfası');
        }
      });
      isaretle();
    },
    besin: function (ic) {
      var giris = ic.querySelector('#kdYdAra'), kutu = ic.querySelector('[data-yd-besin]'), zaman = 0, sira = 0;
      giris.focus({ preventScroll: true });                                     // arama alanı doğrudan yazılabilir
      var ETIKET = { uygun: 'Uygun', dikkat: 'Dikkat', henuz: 'Henüz erken' };
      function degerlendir(b, ay) {                                             // dönem matrisiyle aynı kural (donemler.mjs)
        if (b.minAy === null || b.minAy === undefined) return 'dikkat';
        if (ay !== null && b.minAy > ay) return 'henuz';
        if (ay === null && b.durum === 'henuz') return 'henuz';
        if (b.durum === 'hazirlikla' || b.bogulmaRiski === 'yuksek') return 'dikkat';
        return 'uygun';
      }
      function yasYazi(m) { return m >= 24 ? (m / 12) + ' yaş' : m + '. ay'; }
      function sunum(b, ay) {                                                   // yaşa en yakın ilk sunum satırı
        if (!b.ilkSunum || ay === null) return '';
        var k = Object.keys(b.ilkSunum).map(Number).filter(function (x) { return x <= ay; }).sort(function (x, y) { return y - x; })[0];
        return k === undefined ? '' : b.ilkSunum[k] || '';
      }
      function ara() {
        var ham = giris.value.trim(), q = normal(ham), bu = ++sira;
        if (q.length < 2) { kutu.innerHTML = ''; return; }
        Promise.all([veri('besinler'), veri('kesim')]).then(function (v) {
          if (bu !== sira) return;
          var hamile = profil().evre === 'hamilelik';
          var besinler = (v[0].besinler || []).filter(function (b) { return hamile || !b.hamilelik; }), kesim = v[1] || [];
          var kesimSlug = {}; kesim.forEach(function (k) { kesimSlug[k.slug] = k; });
          var sonuc = besinler.map(function (b) {
            var adlar = [b.ad, b.slug].concat(b.esAnlamlar || []).map(normal);
            var puan = 0; adlar.forEach(function (a, i) { if (a === q) puan = Math.max(puan, 3); else if (a.indexOf(q) === 0) puan = Math.max(puan, i ? 1.5 : 2); else if (a.indexOf(q) > 0) puan = Math.max(puan, .8); });
            return { b: b, puan: puan };
          }).filter(function (x) { return x.puan > 0; }).sort(function (a, b) { return b.puan - a.puan; }).slice(0, 3);
          if (!sonuc.length) kesim.forEach(function (k) { if (normal(k.ad).indexOf(q) === 0 && sonuc.length < 3) sonuc.push({ b: { ad: k.ad, slug: k.slug, kesimSlug: k.slug, durum: 'hazirlikla', minAy: 6, gerekce: k.pisirme }, puan: 1 }); });
          var as = asamaAnahtari(), ay = cocukAyi();
          if (!sonuc.length) { kutu.innerHTML = '<p>“' + esc(ham) + '” için kayıt bulamadım. Başka bir adla deneyin ya da <a class="kd-yd__bag" href="' + esc(bag('kids-guvenli-kesim.html')) + '">Güvenli Kesim</a> sayfasına bakın.</p>'; return; }
          kutu.innerHTML = sonuc.map(function (x) {
            var b = x.b, k = b.kesimSlug && kesimSlug[b.kesimSlug], tur = hamile ? (b.durum === 'evet' ? 'uygun' : b.durum === 'henuz' ? 'henuz' : 'dikkat') : degerlendir(b, ay);
            var etiket = hamile && tur === 'henuz' ? 'Kaçınılır' : ETIKET[tur];
            var metin = hamile ? (b.hamilelik ? b.gerekce : (b.hamilelikNotu || '')) : b.gerekce;
            var not = '';
            if (!hamile && tur === 'henuz' && b.minAy) not = '<p class="kd-yd__kucuk">En erken ' + yasYazi(b.minAy) + '.</p>';
            else if (!hamile && ay === null && b.minAy && b.minAy > 6) not = '<p class="kd-yd__kucuk">En erken ' + yasYazi(b.minAy) + '.</p>';
            var nasil = hamile || tur === 'henuz' ? '' : (k && as && k.asamalar && k.asamalar[as] ? k.asamalar[as].nasil : sunum(b, ay));
            var hazir = nasil ? '<p class="kd-yd__hazirlik"><b>' + esc(as ? (as === '12+' ? '12 ay +' : as + ' ay') : 'Hazırlık') + ':</b> ' + esc(nasil) + '</p>' : '';
            var git = k && !hamile ? '<a class="kd-yd__bag" href="' + esc(bag('kids-guvenli-kesim.html#' + k.slug)) + '">Güvenli Kesim kartı: ' + esc(k.ad) + ' →</a>' : '';
            return '<article class="kd-yd__besin" data-durum="' + tur + '"><div class="kd-yd__besin-ust"><b>' + esc(b.ad) + '</b><span class="kd-yd__rozet">' + etiket + '</span></div>'
              + (metin ? '<p>' + esc(metin) + '</p>' : '') + not + hazir + git + '</article>';
          }).join('') + ORNEK;
        }).catch(function () { kutu.innerHTML = '<p>Veriye ulaşamadım; biraz sonra yeniden deneyin.</p>'; });
      }
      giris.addEventListener('input', function () { clearTimeout(zaman); zaman = setTimeout(ara, 220); });
      giris.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(zaman); ara(); } });
    }
  };

  /* ---------- Başlat ---------- */

  /* ---------- Panel ---------- */
  var SECENEK = [
    ['yas', 'Kaç aylık?', 'takvim', 'Doğum tarihinden evreyi bulun'],
    ['besin', 'Bu besin güvenli mi?', 'bicak-tahta', 'Yaşa göre uygunluk ve hazırlık'],
    ['tarif', 'Bugün ne pişirsem?', 'kase', 'Yaşa uygun üç tarif'],
    ['alerjen', 'Alerjen tanıtımı', 'liste', '3 günlük gözlem ve rehber'],
    ['hazir', 'Ek gıdaya hazır mı?', 'mama-sandalyesi', 'Hazır olma işaretleri'],
    ['acil', 'Acil durum', 'uyari', 'Boğulma şüphesinde 112']
  ];
  var ac, panel, govde, liste, cevap, cevapIc, sonKod = null, acik = false;
  function el(etiket, ozellik, ic) {
    var e = document.createElement(etiket);
    Object.keys(ozellik || {}).forEach(function (k) { if (k === 'class') e.className = ozellik[k]; else e.setAttribute(k, ozellik[k]); });
    if (ic != null) e.innerHTML = ic; return e;
  }
  var KAPAT_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var OK_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6"/></svg>';

  function kur() {
    ac = document.querySelector('.kd-yardim-ac'); if (!ac) return;
    var yer = ac.parentNode;
    panel = el('div', { class: 'kd-yardim', id: 'kdYardim', role: 'region', 'aria-labelledby': 'kdYardimBaslik', hidden: '' });
    panel.innerHTML = '<div class="kd-yardim__ust"><div><h2 class="kd-yardim__baslik" id="kdYardimBaslik">Yardım</h2><p class="kd-yardim__alt">Sitedeki içerikten kısa cevaplar</p></div>'
      + '<button type="button" class="kd-yardim__kapat" data-yd-kapat aria-label="Yardımı kapat">' + KAPAT_SVG + '</button></div>'
      + '<div class="kd-yardim__govde"><ul class="kd-yardim__liste" role="list"></ul>'
      + '<section class="kd-yardim__cevap" hidden><button type="button" class="kd-yardim__geri" data-yd-geri><span aria-hidden="true">‹</span> Diğer sorular</button><div class="kd-yardim__cevap-ic" aria-live="polite"></div></section></div>';
    var dk = window.DadaKids;                              // Ek revize E1: dar ekranda tema rengi panelin altında
    if (dk && dk.temaSecici) { var tm = el('div', { class: 'kd-yardim__tema' }, '<span class="kd-yardim__tema-ad" aria-hidden="true">Tema rengi</span>'); tm.appendChild(dk.temaSecici('kd-tema-sec--panel')); panel.appendChild(tm); }
    govde = panel.querySelector('.kd-yardim__govde'); liste = panel.querySelector('.kd-yardim__liste');
    cevap = panel.querySelector('.kd-yardim__cevap'); cevapIc = panel.querySelector('.kd-yardim__cevap-ic');
    SECENEK.forEach(function (s) {
      var li = el('li');
      li.appendChild(el('button', { type: 'button', class: 'kd-yardim__secenek', 'data-secenek': s[0] },
        '<span class="kd-yardim__ikon" aria-hidden="true"><img src="varlik/kids/svg/ui/' + s[2] + '.svg" alt="" width="20" height="20"></span>'
        + '<span class="kd-yardim__metin"><b>' + s[1] + '</b><small>' + s[3] + '</small></span>' + OK_SVG));
      liste.appendChild(li);
    });
    yer.appendChild(panel);
    ac.hidden = false;

    ac.addEventListener('click', function () { if (acik) kapat(true); else ack(); });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-yd-kapat]')) { kapat(true); return; }
      if (e.target.closest('[data-yd-geri]')) { menuGoster(true); return; }
      var b = e.target.closest('[data-secenek]'); if (b) sec(b.getAttribute('data-secenek'));
    });
    liste.addEventListener('keydown', function (e) {
      var d = Array.prototype.slice.call(liste.querySelectorAll('[data-secenek]')), i = d.indexOf(document.activeElement); if (i < 0) return;
      var j = e.key === 'ArrowDown' ? (i + 1) % d.length : e.key === 'ArrowUp' ? (i - 1 + d.length) % d.length : e.key === 'Home' ? 0 : e.key === 'End' ? d.length - 1 : null;
      if (j !== null) { e.preventDefault(); d[j].focus(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && acik) { e.preventDefault(); kapat(true); } });
    document.addEventListener('pointerdown', function (e) { if (acik && !panel.contains(e.target) && !ac.contains(e.target)) kapat(false); });
    panel.addEventListener('focusout', function () {      // Tab ile panelden ve düğmeden çıkılınca kapan
      setTimeout(function () { var a = document.activeElement; if (acik && a && a !== document.body && !panel.contains(a) && a !== ac) kapat(false); }, 0);
    });
    addEventListener('resize', sinirla);
  }
  function sinirla() {                                   // panel ekranın altını (mobil alt menü + güvenli alan) aşmaz
    if (!acik) return;
    var nav = document.querySelector('.bottom-nav'), pay = 0;
    if (nav) { var cs = getComputedStyle(nav); if (cs.display !== 'none' && cs.visibility !== 'hidden') pay = Math.max(0, innerHeight - nav.getBoundingClientRect().top); }
    var kap = panel.parentNode.getBoundingClientRect(), ar = ac.getBoundingClientRect();
    panel.style.setProperty('--kd-yd-sag', Math.max(0, Math.round(kap.right - ar.right)) + 'px');   // sağ kenar düğmeyle hizalı
    var ust = panel.getBoundingClientRect().top;
    panel.style.setProperty('--kd-yd-max', Math.max(220, Math.round(innerHeight - ust - pay - 12)) + 'px');
  }
  function ack() {
    acik = true; panel.hidden = false; ac.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('kd-yardim-acik');
    menuGoster(false); sinirla();
    requestAnimationFrame(function () { panel.classList.add('kd-acik'); });
    var ilk = liste.querySelector('[data-secenek]'); if (ilk) ilk.focus({ preventScroll: true });
  }
  function kapat(odakDon) {
    if (!acik) return;
    acik = false; ac.setAttribute('aria-expanded', 'false'); panel.classList.remove('kd-acik'); panel.hidden = true;
    document.documentElement.classList.remove('kd-yardim-acik');
    cevapIc.innerHTML = ''; sonKod = null;
    if (odakDon) ac.focus({ preventScroll: true });
  }
  function menuGoster(odak) {
    var onceki = sonKod; sonKod = null;
    cevap.hidden = true; cevapIc.innerHTML = ''; liste.hidden = false; panel.removeAttribute('data-secenek'); govde.scrollTop = 0;
    if (odak) { var b = onceki && liste.querySelector('[data-secenek="' + onceki + '"]'); (b || liste.querySelector('[data-secenek]')).focus({ preventScroll: true }); }
  }
  function sec(kod) {
    sonKod = kod; liste.hidden = true; cevap.hidden = false; panel.setAttribute('data-secenek', kod); govde.scrollTop = 0;
    cevapIc.innerHTML = '<p class="kd-yd__yukleniyor">Yükleniyor…</p>';
    Promise.resolve().then(CEVAP[kod]).catch(function () { return '<p>Şu an bu bilgiye ulaşılamadı. Sayfayı yenileyip yeniden deneyin.</p>'; })
      .then(function (html) {
        if (!acik || sonKod !== kod) return;
        var kap = el('div', null, html);                                        // her cevap yeni kap: dinleyiciler birikmez
        cevapIc.innerHTML = ''; cevapIc.appendChild(kap);
        var bas = kap.querySelector('.kd-yd__baslik'); if (bas) { bas.setAttribute('tabindex', '-1'); bas.focus({ preventScroll: true }); }
        var kurucu = KURULUM[kod]; if (kurucu) kurucu(kap);
        sinirla();
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur); else kur();
})();
