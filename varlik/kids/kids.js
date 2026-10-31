/* =====================================================================
   DADA KIDS — prototip davranışı (bağımlılıksız)
   · Profil (evre + cinsiyet + isteğe bağlı ay) URL parametresiyle taşınır:
     ?evre=6-8-ay&c=kiz[&ay=7]  — depolama YOK (localStorage/sessionStorage kullanılmaz).
   · Tema: html[data-kd-tema] → --kd-tema (kids.css). Rozet ve uyarı renkleri temadan bağımsız.
   ===================================================================== */
(function () {
  'use strict';

  var EVRELER = {
    'hamilelik': { ad: 'Hamilelik & Lohusalık', kisa: 'Hamilelik', kova: null },
    '0-6-ay':    { ad: '0–6 Ay',  kisa: '0–6 ay',  kova: null },
    '6-8-ay':    { ad: '6–8 Ay',  kisa: '6–8 ay',  kova: 6 },
    '9-12-ay':   { ad: '9–12 Ay', kisa: '9–12 ay', kova: 9 },
    '1-3-yas':   { ad: '1–3 Yaş', kisa: '1–3 yaş', kova: 12 }
  };
  var CINSIYET = { kiz: 'Kız', erkek: 'Erkek', belirtilmedi: 'Belirtilmedi', bilinmiyor: 'Henüz bilmiyoruz' };
  var KOVALAR = [6, 8, 9, 12, 18, 24];
  var KOVA_ETIKET = { 6: '+6 Ay', 8: '+8 Ay', 9: '+9 Ay', 12: '+12 Ay', 18: '+18 Ay', 24: '2–3 Yaş' };

  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  /* ---------- Profil ---------- */
  var q = new URLSearchParams(location.search);
  var profil = {
    evre: EVRELER[q.get('evre')] ? q.get('evre') : null,
    c: CINSIYET[q.get('c')] ? q.get('c') : null,
    ay: /^\d{1,2}$/.test(q.get('ay') || '') ? parseInt(q.get('ay'), 10) : null
  };
  if (profil.c === 'bilinmiyor' && profil.evre !== 'hamilelik') profil.c = 'belirtilmedi';

  function evreAydan(ay) {
    if (ay < 6) return '0-6-ay';
    if (ay < 9) return '6-8-ay';
    if (ay < 12) return '9-12-ay';
    return '1-3-yas';
  }
  // Tarif kovası: biliniyorsa aydan (≤ ay olan en büyük kova), değilse evrenin EN ALT kovası (temkinli)
  function profilKovasi() {
    if (profil.ay !== null) {
      if (profil.ay < 6) return null;
      var k = null; KOVALAR.forEach(function (x) { if (x <= profil.ay) k = x; }); return k;
    }
    return profil.evre ? EVRELER[profil.evre].kova : null;
  }

  function temaUygula() {
    var t = (profil.c === 'kiz' || profil.c === 'erkek') ? profil.c : null;
    if (t) document.documentElement.setAttribute('data-kd-tema', t);
    else document.documentElement.removeAttribute('data-kd-tema');
  }

  function profilParam(p) {
    if (profil.evre) p.set('evre', profil.evre); else p.delete('evre');
    if (profil.c) p.set('c', profil.c); else p.delete('c');
    if (profil.ay !== null) p.set('ay', String(profil.ay)); else p.delete('ay');
    return p;
  }

  // Kids içi bağlar profili taşır (href "kids" ile başlayan göreli bağlar)
  function baglariGuncelle() {
    $$('a[href^="kids"]').forEach(function (a) {
      var ham = a.getAttribute('href');
      var parca = ham.split('#');
      var yol = parca[0].split('?');
      var p = profilParam(new URLSearchParams(yol[1] || ''));
      var s = p.toString();
      a.setAttribute('href', yol[0] + (s ? '?' + s : '') + (parca[1] ? '#' + parca[1] : ''));
    });
  }
  function adresiGuncelle(ek) {
    var p = profilParam(new URLSearchParams(location.search));
    if (ek) Object.keys(ek).forEach(function (k) { if (ek[k] === null) p.delete(k); else p.set(k, ek[k]); });
    var s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }

  temaUygula();
  document.addEventListener('DOMContentLoaded', baglariGuncelle);
  if (document.readyState !== 'loading') baglariGuncelle();

  /* ---------- Hub: KidsProfil ---------- */
  function hubKur() {
    var kutu = $('#kdProfil'); if (!kutu) return;
    var form = $('.kd-profil__form', kutu);
    var bilinmiyor = $('[data-kd-bilinmiyor]', kutu);
    var tarih = $('#kdDogum', kutu);

    function bilinmiyorGoster() {
      var ev = (form.querySelector('input[name="evre"]:checked') || {}).value;
      var hamile = ev === 'hamilelik';
      bilinmiyor.hidden = !hamile;
      if (!hamile) { var r = bilinmiyor.querySelector('input'); if (r.checked) { r.checked = false; form.querySelector('input[name="c"][value="belirtilmedi"]').checked = true; } }
      tarih.closest('.kd-profil__tarih').hidden = hamile;
    }
    function formuDoldur() {
      if (profil.evre) { var e = form.querySelector('input[name="evre"][value="' + profil.evre + '"]'); if (e) e.checked = true; }
      if (profil.c) { var c = form.querySelector('input[name="c"][value="' + profil.c + '"]'); if (c) c.checked = true; }
      bilinmiyorGoster();
    }
    function ozetiYaz() {
      var ev = EVRELER[profil.evre];
      var metin = ev.ad + (profil.ay !== null ? ' · ' + profil.ay + '. ay' : '');
      $('[data-kd-ozet-evre]', kutu).textContent = metin;
      $('[data-kd-ozet-c]', kutu).textContent = CINSIYET[profil.c || 'belirtilmedi'];
      kutu.setAttribute('data-durum', 'ozet');
    }
    form.addEventListener('change', function (e) {
      if (e.target === tarih && tarih.value) {
        var d = new Date(tarih.value + 'T00:00:00'), b = new Date();
        var ay = (b.getFullYear() - d.getFullYear()) * 12 + (b.getMonth() - d.getMonth()) - (b.getDate() < d.getDate() ? 1 : 0);
        if (ay >= 0 && ay <= 36) {
          form.querySelector('input[name="evre"][value="' + evreAydan(ay) + '"]').checked = true;
          tarih.setAttribute('data-ay', ay);
        }
      }
      if (e.target.name === 'evre') tarih.removeAttribute('data-ay'), (e.isTrusted && (tarih.value = ''));
      bilinmiyorGoster();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ev = form.querySelector('input[name="evre"]:checked');
      if (!ev) { $('[data-kd-uyari]', kutu).hidden = false; return; }
      $('[data-kd-uyari]', kutu).hidden = true;
      profil.evre = ev.value;
      profil.c = (form.querySelector('input[name="c"]:checked') || {}).value || 'belirtilmedi';
      profil.ay = tarih.hasAttribute('data-ay') && ev.value !== 'hamilelik' ? parseInt(tarih.getAttribute('data-ay'), 10) : null;
      temaUygula(); adresiGuncelle(); baglariGuncelle(); ozetiYaz(); hubGuncelle();
    });
    $('.kd-degistir', kutu).addEventListener('click', function () {
      kutu.removeAttribute('data-durum'); formuDoldur();
      var ilk = form.querySelector('input:checked') || form.querySelector('input'); if (ilk) ilk.focus();
    });
    formuDoldur();
    if (profil.evre) ozetiYaz();
    hubGuncelle();
  }

  function hubGuncelle() {
    $$('.kd-evre').forEach(function (k) { k.setAttribute('aria-current', String(k.getAttribute('data-evre') === profil.evre)); });
    var kova = profilKovasi();
    var izgara = $('#kdOnizleme'); if (!izgara) return;
    var n = 0;
    $$('.kd-kart', izgara).forEach(function (k) {
      var uygun = kova === null ? true : parseInt(k.getAttribute('data-yas'), 10) <= kova;
      // seçili kovaya en yakın (en büyük ≤ kova) tarifler önce
      k.hidden = !(uygun && n < 4); if (!k.hidden) n++;
    });
    if (kova !== null) {
      var kartlar = $$('.kd-kart', izgara).filter(function (k) { return parseInt(k.getAttribute('data-yas'), 10) <= kova; })
        .sort(function (a, b) { return parseInt(b.getAttribute('data-yas'), 10) - parseInt(a.getAttribute('data-yas'), 10); });
      $$('.kd-kart', izgara).forEach(function (k) { k.hidden = true; });
      kartlar.slice(0, 4).forEach(function (k) { k.hidden = false; izgara.appendChild(k); });
    }
    var baslik = $('[data-kd-onizleme-baslik]');
    if (baslik) baslik.textContent = kova !== null ? KOVA_ETIKET[kova] + ' ve öncesi için seçilenler' : 'Ek gıdaya başlarken: ilk tarifler';
    var tumu = $('[data-kd-tumu]');
    if (tumu) { tumu.setAttribute('href', 'kids__tarifler.html' + (kova !== null ? '?yas=' + kova : '')); baglariGuncelle(); }
    var not = $('[data-kd-erken-not]');
    if (not) not.hidden = !(profil.evre === '0-6-ay' || profil.evre === 'hamilelik' || (profil.ay !== null && profil.ay < 6));
  }

  /* ---------- Katalog: AgeFilterBar + facet'ler + sıralama + boş durum ---------- */
  function katalogKur() {
    var izgara = $('#lstGrid'); if (!izgara || !$('.kd-yas-cubugu')) return;
    var kartlar = $$('.kd-kart', izgara);
    var sira0 = kartlar.slice();
    var bas = q.get('yas');
    var durum = {
      yas: bas === 'tumu' ? 'tumu' : (KOVALAR.indexOf(parseInt(bas, 10)) > -1 ? parseInt(bas, 10) : (profilKovasi() || 'tumu')),
      kivam: [], icermez: [], sure: null, sirala: 'onerilen'
    };
    var form = $('#kdFacet');

    function uyar(k, haric) {
      var y = parseInt(k.getAttribute('data-yas'), 10);
      if (haric !== 'yas' && durum.yas !== 'tumu' && y > durum.yas) return false;
      if (durum.kivam.length && durum.kivam.indexOf(k.getAttribute('data-kivam')) < 0) return false;
      for (var i = 0; i < durum.icermez.length; i++) if (k.getAttribute('data-' + durum.icermez[i]) !== '1') return false;
      if (durum.sure && parseInt(k.getAttribute('data-sure'), 10) > durum.sure) return false;
      return true;
    }
    function ciz() {
      var gorunen = 0;
      kartlar.forEach(function (k) { var u = uyar(k); k.hidden = !u; if (u) gorunen++; });
      // sıralama
      var sirali = sira0.slice();
      if (durum.sirala === 'en-hizli') sirali.sort(function (a, b) { return a.dataset.sure - b.dataset.sure; });
      if (durum.sirala === 'en-cok-puanlanan') sirali.sort(function (a, b) { return (parseFloat(b.dataset.puan) || 0) - (parseFloat(a.dataset.puan) || 0); });
      if (durum.sirala === 'yasa-gore') sirali.sort(function (a, b) { return b.dataset.yas - a.dataset.yas; });
      sirali.forEach(function (k) { izgara.appendChild(k); });
      // yaş chip'leri: sayılar diğer filtrelere göre
      $$('.kd-yas-chip').forEach(function (c) {
        var v = c.getAttribute('data-yas');
        var sayi = kartlar.filter(function (k) { return uyar(k, 'yas') && (v === 'tumu' || parseInt(k.dataset.yas, 10) <= parseInt(v, 10)); }).length;
        c.querySelector('small').textContent = sayi;
        c.setAttribute('aria-checked', String(String(durum.yas) === v));
      });
      $('#lstSum').innerHTML = '<b>' + gorunen + ' tarif</b> ' + (durum.yas === 'tumu' ? 'tüm yaşlar için' : KOVA_ETIKET[durum.yas] + ' ve öncesine uygun');
      var fc = durum.kivam.length + durum.icermez.length + (durum.sure ? 1 : 0);
      var fb = $('#filCount'); fb.textContent = fc; fb.hidden = fc === 0;
      $$('.fct').forEach(function (g) { var d = g.querySelector('.fct-dot'); if (d) d.textContent = g.querySelectorAll('input:checked').length; });
      bosDurum(gorunen);
      adresiGuncelle({ yas: durum.yas === 'tumu' ? null : String(durum.yas) });
    }
    function bosDurum(gorunen) {
      var bos = $('#kdBos'); bos.hidden = gorunen > 0; if (gorunen > 0) return;
      var oneri = $('.kd-bos__oneriler', bos); oneri.innerHTML = '';
      var ekle = function (metin, fn) { var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-ghost'; b.textContent = metin; b.addEventListener('click', fn); oneri.appendChild(b); };
      if (durum.yas !== 'tumu') {
        var sonraki = KOVALAR.filter(function (x) { return x > durum.yas; }).find(function (x) {
          var eski = durum.yas; durum.yas = x; var var_ = kartlar.some(function (k) { return uyar(k); }); durum.yas = eski; return var_;
        });
        if (sonraki) ekle(KOVA_ETIKET[sonraki] + ' tariflerini de göster', function () { durum.yas = sonraki; ciz(); });
      }
      durum.icermez.forEach(function (a) { ekle('"' + $('input[value="' + a + '"]', form).getAttribute('data-ad') + '" filtresini kaldır', function () { $('input[value="' + a + '"]', form).checked = false; okuForm(); ciz(); }); });
      durum.kivam.forEach(function (a) { ekle('"' + $('input[value="' + a + '"]', form).getAttribute('data-ad') + '" kıvamını kaldır', function () { $('input[value="' + a + '"]', form).checked = false; okuForm(); ciz(); }); });
      if (durum.sure) ekle('Süre sınırını kaldır', function () { $$('input[name="sure"]', form).forEach(function (i) { i.checked = false; }); okuForm(); ciz(); });
    }
    function okuForm() {
      durum.kivam = $$('input[name="kivam"]:checked', form).map(function (i) { return i.value; });
      durum.icermez = $$('input[name="icermez"]:checked', form).map(function (i) { return i.value; });
      var s = $('input[name="sure"]:checked', form); durum.sure = s ? parseInt(s.value, 10) : null;
    }
    $('.kd-yas-cubugu').addEventListener('click', function (e) {
      var c = e.target.closest('.kd-yas-chip'); if (!c) return;
      var v = c.getAttribute('data-yas'); durum.yas = v === 'tumu' ? 'tumu' : parseInt(v, 10); ciz();
      c.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    });
    $('.kd-yas-cubugu').addEventListener('keydown', function (e) {
      if (['ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0) return;
      var cs = $$('.kd-yas-chip'), i = cs.indexOf(document.activeElement); if (i < 0) return;
      var n = cs[(i + (e.key === 'ArrowRight' ? 1 : cs.length - 1)) % cs.length]; n.focus(); n.click(); e.preventDefault();
    });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'sure' && e.target.checked) $$('input[name="sure"]', form).forEach(function (i) { if (i !== e.target) i.checked = false; });
      okuForm(); ciz();
    });
    $$('[data-kd-temizle]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); $$('input', form).forEach(function (i) { i.checked = false; }); okuForm(); durum.yas = 'tumu'; ciz(); }); });
    $$('.sort-menu [data-sirala]').forEach(function (b) {
      b.addEventListener('click', function () {
        durum.sirala = b.getAttribute('data-sirala');
        $$('.sort-menu [data-sirala]').forEach(function (x) { x.classList.toggle('active', x === b); });
        $('#sortCur').textContent = b.textContent.trim();
        $('#sortDd').classList.remove('open'); ciz();
      });
    });
    ciz();
    // açılışta seçili yaş chip'ini (sayfayı değil) çubuğun içinde görünür yap
    var cubuk = $('.kd-yas-cubugu'), secili = $('.kd-yas-chip[aria-checked="true"]');
    if (cubuk && secili) cubuk.scrollLeft = Math.max(0, secili.offsetLeft - cubuk.offsetLeft - 16);
  }

  /* ---------- PantrySync (demo kiler) ---------- */
  function kilerKur() {
    var panel = $('[data-kd-kiler]'); if (!panel) return;
    var kiler = JSON.parse(panel.getAttribute('data-kd-kiler'));
    var secili = {}; kiler.forEach(function (m) { secili[m] = true; });
    $$('.kd-kiler-chip', panel).forEach(function (c) {
      c.addEventListener('click', function () {
        var m = c.getAttribute('data-m'); secili[m] = !secili[m];
        c.setAttribute('aria-pressed', String(secili[m]));
        $$('.kd-kiler-sonuc:not([hidden])').forEach(function (s) { eslestir(s.closest('.kd-kart')); });
      });
    });
    function eslestir(kart) {
      var malz = JSON.parse(kart.getAttribute('data-malz'));
      var var_ = malz.filter(function (m) { return secili[m]; });
      var eksik = malz.filter(function (m) { return !secili[m]; });
      var s = $('.kd-kiler-sonuc', kart);
      s.innerHTML = '<b>Kilerinde ' + var_.length + '/' + malz.length + ' malzeme.</b> ' + (eksik.length ? 'Eksik: ' + eksik.join(', ') + '.' : 'Hepsi var, hemen yapabilirsin.');
      s.hidden = false;
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.kd-kart .kd-kiler-btn'); if (!b) return;
      var kart = b.closest('.kd-kart'), s = $('.kd-kiler-sonuc', kart);
      if (!s.hidden) { s.hidden = true; b.setAttribute('aria-expanded', 'false'); return; }
      eslestir(kart); b.setAttribute('aria-expanded', 'true');
    });
  }

  /* ---------- Tarif detayı: malzeme satırlarını demo kilerle eşle ---------- */
  function detayKilerKur() {
    var satir = $('.kd-kiler-satir'); if (!satir) return;
    var kiler = JSON.parse(satir.getAttribute('data-kd-kiler'));
    var btn = $('.kd-kiler-btn', satir), kopya = $('.kd-kopyala', satir), sonuc = $('[data-kd-sonuc]', satir);
    var eksikler = [];
    btn.addEventListener('click', function () {
      eksikler = [];
      $$('#ingList .ing-row').forEach(function (r) {
        var ad = ($('.in', r).childNodes[0] || {}).textContent.trim();
        var kucuk = ad.toLocaleLowerCase('tr');
        var var_ = kiler.some(function (m) { return kucuk.indexOf(m) > -1; });
        var eski = $('.kd-durum', r); if (eski) eski.remove();
        var e = document.createElement('span');
        e.className = 'kd-durum ' + (var_ ? 'kd-durum--var' : 'kd-durum--eksik');
        e.textContent = var_ ? 'Kilerde var' : 'Eksik';
        $('.in', r).appendChild(e);
        if (!var_) eksikler.push(ad);
      });
      sonuc.textContent = eksikler.length ? eksikler.length + ' eksik malzeme' : 'Tüm malzemeler kilerinde';
      kopya.hidden = !eksikler.length;
      btn.setAttribute('aria-expanded', 'true');
    });
    kopya.addEventListener('click', function () {
      var metin = 'Eksikler: ' + eksikler.join(', ');
      (navigator.clipboard ? navigator.clipboard.writeText(metin) : Promise.reject()).then(function () {
        kopya.textContent = 'Kopyalandı';
      }, function () { kopya.textContent = metin; });
    });
  }

  /* ---------- Yapışkan yaş çubuğu: Gastro header'ının gerçek alt kenarına oturur ---------- */
  function ustBoslukKur() {
    if (!$('.kd-yas-cubugu-sar')) return;
    var bekliyor = false;
    function olc() {
      bekliyor = false;
      var alt = 0;
      $$('header.header, .ust-serit, .top-bar').forEach(function (el) {
        var cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.position === 'sticky') { var r = el.getBoundingClientRect(); if (r.bottom > alt && r.top < 200) alt = r.bottom; }
      });
      document.documentElement.style.setProperty('--kd-ust-bosluk', Math.round(alt) + 'px');
    }
    function iste() { if (!bekliyor) { bekliyor = true; requestAnimationFrame(olc); } }
    window.addEventListener('scroll', iste, { passive: true });
    window.addEventListener('resize', iste);
    olc(); setTimeout(olc, 400);
  }

  function basla() { hubKur(); katalogKur(); kilerKur(); detayKilerKur(); ustBoslukKur(); baglariGuncelle(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla); else basla();
})();
