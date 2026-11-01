/* =====================================================================
   kids.html — hub davranışı (sahibi: v2-hub, bağımlılıksız)
   · "Bu ay tezgâhta": bu ayın paneli
   · Dönem çubuğu (hero): tek seçimli radyo grubu (oklar native) → vitrin anında süzülür
     Seçim: URL ?evre= (DadaKids.profilAyarla; Kids bağları da taşır) + localStorage 'dadagastrokids.donem.v1' (try/catch)
     Öncelik: URL > localStorage. Seçim yokken vitrin 6–8 Ay ilk tadım tarifleri (çubukta seçili görünmez).
   · Dönemler bölümünde seçili dönemin kartı vurgulanır ("Sizin döneminiz")
   ===================================================================== */
(function () {
  var kap = document.querySelector('[data-kd-bu-ay]'); if (!kap) return;
  var ay = new Date().getMonth() + 1;
  var paneller = kap.querySelectorAll('.kd-hub-ay');
  var var_ = false;
  paneller.forEach(function (p) { var bu = +p.dataset.ay === ay; p.hidden = !bu; if (bu) var_ = true; });
  if (!var_ && paneller[0]) paneller[0].hidden = false;
})();

(function () {
  'use strict';
  var form = document.querySelector('[data-kd-donem]'); if (!form) return;
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  var ANAHTAR = 'dadagastrokids.donem.v1';
  var GOSTER = 4;                                             // vitrinde gösterilen tarif sayısı: tek tam satır (v1 önizlemesiyle aynı boy; dar ızgarada seriCta kuralları satırı tamamlar)
  var AD = { 'hamilelik': 'Hamilelik & Lohusalık', '0-6-ay': '0–6 Ay', '6-8-ay': '6–8 Ay', '9-12-ay': '9–12 Ay', '1-3-yas': '1–3 Yaş' };
  // ust: tarif yaş üst sınırı · one: bu yaş ve üstü öne · kova: Kids Tarifleri yaş filtresi · kesim: gösterilecek kesim paneli
  var AYAR = {
    'hamilelik': { kesim: 'hamilelik' },
    '0-6-ay': { kesim: '6-8-onizleme' },
    '6-8-ay': { ust: 8, one: 6, kova: '8', kesim: '6-8' },
    '9-12-ay': { ust: 12, one: 9, kova: '12', kesim: '9-12' },
    '1-3-yas': { ust: 99, one: 12, kova: 'tumu', kesim: '12+' }
  };
  var VARSAYILAN = '6-8-ay';

  function lsOku() { try { var v = localStorage.getItem(ANAHTAR); return AYAR[v] ? v : null; } catch (e) { return null; } }
  function lsYaz(v) { try { localStorage.setItem(ANAHTAR, v); } catch (e) { /* depolama kapalı: seçim yalnız URL'de */ } }
  function evreAydan(a) { return a < 6 ? '0-6-ay' : a < 9 ? '6-8-ay' : a < 12 ? '9-12-ay' : '1-3-yas'; }

  var izgara = $('[data-kd-vitrin-izgara]');
  var kartlar = izgara ? $$('.kd-tarif[data-yas]', izgara) : [];
  var cta = izgara ? $('.kd-seri-cta', izgara) : null;
  var tarifBlok = $('[data-kd-vitrin-tarif]');
  var baslik = $('[data-kd-vitrin-baslik]'), ozet = $('[data-kd-vitrin-ozet]'), tumu = $('[data-kd-vitrin-tumu]');
  var git = $('[data-kd-donem-git]', form);

  function tarifSuz(a) {
    var uygun = kartlar.filter(function (k) { return +k.dataset.yas <= a.ust; }).sort(function (x, y) {
      var ox = +x.dataset.yas >= a.one ? 0 : 1, oy = +y.dataset.yas >= a.one ? 0 : 1;
      return (ox - oy) || (+x.dataset.sira - +y.dataset.sira);
    });
    kartlar.forEach(function (k) { k.hidden = true; });
    uygun.forEach(function (k, i) { if (i < GOSTER) { k.hidden = false; k.classList.add('kd-gorundu'); } if (cta) izgara.insertBefore(k, cta); else izgara.appendChild(k); });
    if (izgara) izgara.scrollLeft = 0;
    return uygun.length;
  }

  function metinler(kod, secili, n) {
    if (!secili) return ['İlk tadım tarifleri', '6–8 Ay için örnek vitrin: ' + n + ' uygun tarif, güvenli kesim ve besinler. Döneminizi yukarıdan seçin.'];
    if (kod === 'hamilelik') return ['Hamilelik & Lohusalık: sizin beslenmeniz', 'Bu dönemde bebek için ek gıda yok; odak besinler, mutfakta gıda güvenliği ve kaçınılacaklar.'];
    if (kod === '0-6-ay') return ['0–6 Ay: ek gıdaya hazırlık', 'Bu dönemde ek gıda tarifi yok; hazır olma işaretleri, 6. ay önizlemesi ve 1 yaşından önce verilmeyenler.'];
    if (kod === '6-8-ay') return ['6–8 Ay: ilk tadım tarifleri', n + ' uygun tarif; güvenli kesim ve besinler de bu döneme göre.'];
    if (kod === '9-12-ay') return ['9–12 Ay için tarifler', n + ' uygun tarif, 9. ay ve sonrası önde; güvenli kesim ve besinler de bu döneme göre.'];
    return ['1–3 Yaş için tarifler', n + ' tarif, 12. ay ve sonrası önde; güvenli kesim ve besinler de bu döneme göre.'];
  }

  function vitrin(kod) {
    var secili = !!kod, etkin = kod || VARSAYILAN, a = AYAR[etkin], tarifli = !!a.ust, n = 0;
    if (tarifBlok) tarifBlok.hidden = !tarifli;
    if (tarifli) n = tarifSuz(a);
    $$('[data-kd-vitrin-erken]').forEach(function (p) { p.hidden = p.getAttribute('data-kd-vitrin-erken') !== etkin; });
    $$('[data-kd-vitrin-kesim]').forEach(function (p) { p.hidden = p.getAttribute('data-kd-vitrin-kesim') !== a.kesim; });
    $$('[data-kd-vitrin-besin]').forEach(function (p) { p.hidden = p.getAttribute('data-kd-vitrin-besin') !== etkin; });
    if (tumu) {
      if (tarifli) { tumu.setAttribute('href', 'kids-tarifler.html?yas=' + a.kova); tumu.firstChild.nodeValue = 'Tümünü gör '; }
      else { tumu.setAttribute('href', 'kids-donem-' + etkin + '.html'); tumu.firstChild.nodeValue = 'Dönem rehberi '; }
    }
    var m = metinler(etkin, secili, n);
    if (baslik && baslik.textContent !== m[0]) baslik.textContent = m[0];
    if (ozet && ozet.textContent !== m[1]) ozet.textContent = m[1];
    if (git) git.querySelector('span').textContent = (secili ? AD[etkin] + ' vitrinini gör' : 'Vitrini gör');
  }

  function vurgula(kod) {
    $$('.kd-evre[data-evre]').forEach(function (k) {
      var bu = !!kod && k.getAttribute('data-evre') === kod;
      k.setAttribute('aria-current', String(bu));
      var et = $('.kd-evre__sen', k);
      if (bu && !et) { et = document.createElement('span'); et.className = 'kd-evre__sen'; et.textContent = 'Sizin döneminiz'; k.insertBefore(et, k.firstChild); }
      else if (!bu && et) et.remove();
    });
  }

  function adresYaz(kod, ayDus) {
    var DK = window.DadaKids;
    if (DK && DK.profilAyarla) { var p = { evre: kod }; if (ayDus) p.ay = null; DK.profilAyarla(p); return; }
    try { var q = new URLSearchParams(location.search); q.set('evre', kod); if (ayDus) q.delete('ay'); history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash); } catch (e) { /* file:// vb. */ }
  }

  function uygula(kod, ilk) {
    lsYaz(kod); vitrin(kod); vurgula(kod);
    var DK = window.DadaKids, ay = DK && DK.profil ? DK.profil.ay : null;
    // elle başka dönem seçildiyse eski doğum ayı (?ay=) taşınmaz
    var ayDus = !ilk && ay !== null && ay !== undefined && (kod === 'hamilelik' || evreAydan(ay) !== kod);
    adresYaz(kod, ayDus);
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('change', function (e) {
    var t = e.target; if (!t || t.name !== 'evre' || !t.checked || !AYAR[t.value]) return;
    uygula(t.value, false);
  });

  /* ---------- başlangıç: URL > localStorage > (doğum seçicideki kayıt, dogum-secici.js change olayıyla) > varsayılan vitrin ---------- */
  var qv = new URLSearchParams(location.search).get('evre');
  var bas = AYAR[qv] ? qv : lsOku();
  if (bas) {
    var r = form.querySelector('input[name="evre"][value="' + bas + '"]'); if (r) r.checked = true;
    uygula(bas, true);
  } else vitrin(null);
  form.setAttribute('data-hazir', '');
})();
