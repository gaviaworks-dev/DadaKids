/* =====================================================================
   DADA GASTRO KIDS — Bebek Kilerim + "Dolapta Ne Var?" (sahibi: v2-tarif)
   · Tüm Kids sayfalarında yüklenir. [data-kd-kiler-ekle] düğmelerine olay delegasyonu:
     tarifin data-malzeme anahtarlarını Bebek Kilerine ekler (riskli olanlar hariç).
   · Depo: localStorage "dadagastrokids.kiler.v1" = {v:1, malzemeler:[anahtar], tarifler:[slug]};
     her erişim try/catch; depolama kapalıysa bellek içi (bildirim "yalnız bu oturumda" der).
   · Riskli liste: sayfadaki #kdDolapVeri (derlemede gömülü) → yoksa veri/bebek-dolabi.json → yoksa çekirdek yedek.
   · Katalogda (#kdDolap): otomatik tamamlamalı dolap, Bebek Dolabı anahtarı, tarif eşleşmesi.
     kids.js katalogKur ile birlikte çalışır: window.KdKatalogEk = {filtre, sira} + DadaKids.katalogYenile().
     Kanca yoksa aynı süzgeç kartlara doğrudan uygulanır (yedek yol).
   ===================================================================== */
(function () {
  'use strict';
  if (window.KdKiler) return;   // build ve sayfa aynı betiği iki kez eklerse
  var DEPO = 'dadagastrokids.kiler.v1';
  var YEDEK_RISKLI = { tuz: 'Tuz', seker: 'Rafine şeker', bal: 'Bal', 'domates-salcasi': 'Domates salçası', 'biber-salcasi': 'Biber salçası', 'aci-baharat': 'Acı baharat', bulyon: 'Bulyon', 'islenmis-et': 'İşlenmiş et', 'hazir-sos': 'Hazır soslar', 'inek-sutu-icecek': 'İnek sütü (ana içecek olarak)', 'butun-kuruyemis': 'Bütün kuruyemiş', cay: 'Çay', kafein: 'Kahve', 'kakao-cikolata': 'Kakao ve çikolata', 'meyve-suyu': 'Hazır meyve suyu' };

  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
  var normal = function (s) { return String(s || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/â/g, 'a').replace(/\s+/g, ' ').trim(); };
  var escH = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

  /* ---------- Gömülü veri ---------- */
  var V = (function () { try { var e = document.getElementById('kdDolapVeri'); return e ? JSON.parse(e.textContent) : null; } catch (x) { return null; } })() || {};
  var SOZ = {};   // anahtar → {a, ad, es[], r, n, m}
  (V.sozluk || []).forEach(function (k) { SOZ[k.a] = k; });
  var riskliSoz = null;
  if (V.sozluk) { riskliSoz = {}; V.sozluk.forEach(function (k) { if (k.r) riskliSoz[k.a] = k.ad; }); }
  else if (V.riskli) riskliSoz = V.riskli;
  var riskliSozVaadi = null;
  function riskliAl() {
    if (riskliSoz) return Promise.resolve(riskliSoz);
    if (!riskliSozVaadi) {
      riskliSozVaadi = (window.fetch ? fetch('veri/bebek-dolabi.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }) : Promise.reject(new Error('fetch yok')))
        .then(function (d) { var m = {}; (d.riskli || []).forEach(function (r) { m[r.anahtar] = r.ad; }); riskliSoz = m; return m; })
        .catch(function () { riskliSoz = YEDEK_RISKLI; return riskliSoz; });
    }
    return riskliSozVaadi;
  }
  var adOf = function (a) { return (SOZ[a] && SOZ[a].ad) || (riskliSoz && riskliSoz[a]) || a; };

  /* ---------- Depo ---------- */
  var bellek = null, kalici = true;
  function bos() { return { v: 1, malzemeler: [], tarifler: [] }; }
  function temiz(d) {
    var dizi = function (x) { return Array.isArray(x) ? x.filter(function (s) { return typeof s === 'string' && s; }) : []; };
    return d && typeof d === 'object' ? { v: 1, malzemeler: dizi(d.malzemeler), tarifler: dizi(d.tarifler) } : bos();
  }
  function kilerOku() {
    try { var h = window.localStorage.getItem(DEPO); kalici = true; if (h) return (bellek = temiz(JSON.parse(h))); return bellek || bos(); }
    catch (e) { kalici = false; return bellek || bos(); }
  }
  function kilerYaz(d) {
    bellek = temiz(d);
    try { window.localStorage.setItem(DEPO, JSON.stringify(bellek)); kalici = true; } catch (e) { kalici = false; }
    degisti();
  }
  var dinleyen = [];
  function degisti() { dinleyen.forEach(function (fn) { try { fn(); } catch (e) {} }); }

  /* ---------- Bildirim (role=status, ~3,5 sn; üzerindeyken/odaktayken bekler) ---------- */
  var bildirim, bildirimMetin, sayac;
  var dolapPanelAc = null;   // katalogda dolapKur atar: "Kilere git" paneli açar
  function bildirimKur() {
    if (bildirim) return;
    bildirim = document.createElement('div');
    bildirim.className = 'kd-kiler-bildirim';
    bildirim.setAttribute('role', 'status'); bildirim.setAttribute('aria-live', 'polite'); bildirim.setAttribute('aria-atomic', 'true');
    bildirimMetin = document.createElement('p'); bildirim.appendChild(bildirimMetin);
    document.body.appendChild(bildirim);
    var dur = function () { clearTimeout(sayac); }, devam = function () { if (bildirim.classList.contains('kd-acik')) zamanla(); };
    bildirim.addEventListener('mouseenter', dur); bildirim.addEventListener('focusin', dur);
    bildirim.addEventListener('mouseleave', devam); bildirim.addEventListener('focusout', devam);
  }
  function zamanla() { clearTimeout(sayac); sayac = setTimeout(function () { if (bildirim.contains(document.activeElement) || bildirim.matches(':hover')) return; bildirim.classList.remove('kd-acik'); }, 3500); }
  function bildir(metin, bagGoster) {
    bildirimKur();
    var katalog = !!document.getElementById('kdKiler');
    bildirimMetin.innerHTML = '<span>' + escH(metin) + '</span>' + (bagGoster ? ' <a href="' + (katalog ? '#kdKiler' : 'kids-tarifler.html#kdKiler') + '" data-kd-kilere-git>Kilere git</a>' : '');
    bildirim.classList.add('kd-acik');
    zamanla();
  }

  /* ---------- Kiler düğmeleri ---------- */
  function dugmeleriGuncelle() {
    var d = kilerOku();
    $$('[data-kd-kiler-ekle]').forEach(function (b) {
      var slug = b.getAttribute('data-kd-kiler-ekle'), ad = b.getAttribute('data-ad') || '';
      if (!b.hasAttribute('data-kd-ilk')) b.setAttribute('data-kd-ilk', b.innerHTML);
      var icinde = d.tarifler.indexOf(slug) > -1;
      if (icinde) {
        if (!b.hasAttribute('data-kd-kilerde')) { b.innerHTML = '<span aria-hidden="true">✓</span> Kilerde'; b.setAttribute('data-kd-kilerde', ''); }
        b.setAttribute('aria-label', 'Kilerde: ' + ad + ' malzemeleri Bebek Kilerinizde');
      } else {
        if (b.hasAttribute('data-kd-kilerde')) { b.innerHTML = b.getAttribute('data-kd-ilk'); b.removeAttribute('data-kd-kilerde'); }
        b.setAttribute('aria-label', 'Bebek Kilerime Ekle: ' + ad);
      }
    });
  }
  function kilereEkle(b) {
    var slug = b.getAttribute('data-kd-kiler-ekle');
    var anahtarlar = (b.getAttribute('data-malzeme') || '').split(/\s+/).filter(Boolean);
    riskliAl().then(function (R) {
      var d = kilerOku();
      var atlanan = anahtarlar.filter(function (a) { return R[a]; });
      var yeni = anahtarlar.filter(function (a) { return !R[a] && d.malzemeler.indexOf(a) < 0; });
      var zatenVardi = d.tarifler.indexOf(slug) > -1;
      d.malzemeler = d.malzemeler.concat(yeni);
      if (!zatenVardi) d.tarifler.push(slug);
      kilerYaz(d);
      var m;
      if (yeni.length) m = yeni.length + ' malzeme Bebek Kilerine eklendi.';
      else if (!anahtarlar.length) m = 'Bu tarifin kilere eklenecek malzemesi yok.';
      else m = 'Bu tarifin malzemeleri zaten Bebek Kilerinizde.';
      if (atlanan.length) m += ' ' + atlanan.map(function (a) { return R[a] || adOf(a); }).join(', ') + ' bebek dolabına uygun olmadığı için eklenmedi.';
      if (!kalici) m += ' (Yalnız bu oturumda: tarayıcı depolaması kapalı.)';
      bildir(m, true);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kd-kiler-ekle]');
    if (b) { e.preventDefault(); e.stopPropagation(); kilereEkle(b); return; }
    var g = e.target.closest && e.target.closest('[data-kd-kilere-git]');
    if (g && g.getAttribute('href') === '#kdKiler') {
      var hedef = document.getElementById('kdKiler'); if (!hedef) return;
      e.preventDefault();
      if (dolapPanelAc) dolapPanelAc(true);
      var azalt = matchMedia('(prefers-reduced-motion: reduce)').matches;
      hedef.scrollIntoView({ behavior: azalt ? 'auto' : 'smooth', block: 'start' });
      hedef.focus({ preventScroll: true });
      if (bildirim) bildirim.classList.remove('kd-acik');
    }
  }, true);
  window.addEventListener('storage', function (e) { if (e.key === DEPO) { bellek = null; degisti(); } });
  dinleyen.push(dugmeleriGuncelle);

  /* =====================================================================
     Katalog: "Dolapta Ne Var?"
     ===================================================================== */
  function dolapKur() {
    var kok = document.getElementById('kdDolap'); if (!kok || !V.sozluk) return;
    var gir = $('#kdDolapGir', kok), oneri = $('#kdDolapOneri', kok), cipler = $('#kdDolapCipler', kok);
    var uyari = $('#kdDolapUyari', kok), ozet = $('#kdDolapOzet', kok), bebekSec = $('#kdBebekDolabi', kok);
    var temizleB = $('[data-kd-dolap-temizle]', kok);
    var iz = document.getElementById('kdTarifIzgara');
    var acB = $('[data-kd-dolap-ac]', kok), govde = $('#kdDolapGovde', kok), durumE = $('#kdDolapDurum', kok);
    var TEMEL = V.temel || [];
    var dolap = [];          // kullanıcının eklediği anahtarlar (sırasıyla)
    var etkin = -1, liste = [];

    /* arama dizini */
    var DIZIN = V.sozluk.map(function (k) { return { k: k, ad: normal(k.ad), es: (k.es || []).map(normal) }; });
    var bebek = function () { return !bebekSec || bebekSec.checked; };
    var riskli = function (a) { return !!(SOZ[a] && SOZ[a].r); };

    function ara(q) {
      q = normal(q); if (!q) return [];
      var sonuc = [];
      DIZIN.forEach(function (x) {
        if (dolap.indexOf(x.k.a) > -1) return;
        var p = -1, es = '';
        if (x.ad.indexOf(q) === 0) p = 0;
        else x.es.forEach(function (e) { if (p !== 1 && e.indexOf(q) === 0) { p = 1; es = e; } });
        if (p < 0 && (' ' + x.ad).indexOf(' ' + q) > -1) p = 2;
        if (p < 0) x.es.forEach(function (e) { if (p < 0 && (' ' + e).indexOf(' ' + q) > -1) { p = 3; es = e; } });
        if (p < 0 && q.length > 2 && x.ad.indexOf(q) > -1) p = 4;
        if (p > -1) sonuc.push({ k: x.k, p: p, es: es, tam: x.ad === q || x.es.indexOf(q) > -1 });
      });
      sonuc.sort(function (a, b) {
        return (b.tam - a.tam) || (a.p - b.p) || ((bebek() ? (a.k.r ? 1 : 0) - (b.k.r ? 1 : 0) : 0)) || a.k.ad.localeCompare(b.k.ad, 'tr');
      });
      return sonuc.slice(0, 8);
    }
    function cozumle(metin) {
      var q = normal(metin); if (!q) return null;
      var tam = DIZIN.filter(function (x) { return x.ad === q || x.es.indexOf(q) > -1; });
      if (tam.length) { tam.sort(function (a, b) { return (bebek() ? (a.k.r ? 1 : 0) - (b.k.r ? 1 : 0) : 0); }); return tam[0].k; }
      var s = ara(metin); return s.length ? s[0].k : null;
    }

    /* öneri listesi (combobox / listbox) */
    function listeyiKapat() { oneri.hidden = true; oneri.innerHTML = ''; gir.setAttribute('aria-expanded', 'false'); gir.removeAttribute('aria-activedescendant'); etkin = -1; liste = []; }
    function listeyiCiz(q) {
      liste = ara(q); etkin = -1; gir.removeAttribute('aria-activedescendant');
      if (!liste.length) { listeyiKapat(); return; }
      oneri.innerHTML = liste.map(function (s, i) {
        var r = s.k.r && bebek();
        return '<li role="option" id="kdDolapOneri-' + i + '" aria-selected="false"' + (r ? ' aria-disabled="true" class="kd-dolap__secenek--riskli"' : '') + ' data-i="' + i + '">' +
          '<span>' + escH(s.k.ad) + (s.es && s.es !== normal(s.k.ad) ? ' <small>“' + escH(s.es) + '”</small>' : '') + '</span>' +
          (r ? '<small class="kd-dolap__risk">Bebek dolabına uygun değil</small>' : (s.k.r ? '<small class="kd-dolap__risk">Bebek için riskli</small>' : '')) + '</li>';
      }).join('');
      oneri.hidden = false; gir.setAttribute('aria-expanded', 'true');
    }
    function etkinYap(i) {
      if (!liste.length) return;
      etkin = (i + liste.length) % liste.length;
      $$('[role="option"]', oneri).forEach(function (li, n) { li.setAttribute('aria-selected', String(n === etkin)); if (n === etkin) li.scrollIntoView({ block: 'nearest' }); });
      gir.setAttribute('aria-activedescendant', 'kdDolapOneri-' + etkin);
    }

    /* ekleme / çıkarma */
    function uyar(metin) { uyari.textContent = metin; }   // canlı bölge hep ağaçta kalır (gizlenmez)
    function riskMetni(k) {
      return k.ad + ' bebek dolabına uygun değil' + (k.n ? ': ' + k.n.replace(/\.$/, '') : '') + (k.m && k.m <= 60 && !/yaş|ay(dan|ın)/.test(k.n || '') ? ' (' + (k.m % 12 === 0 ? (k.m / 12) + ' yaşından' : k.m + '. aydan') + ' önce önerilmez)' : '') + '. Dolaba eklenmedi.';
    }
    function sec(k) {
      if (!k) return false;
      if (k.r && bebek()) { uyar(riskMetni(k)); return false; }
      if (dolap.indexOf(k.a) < 0) dolap.push(k.a);
      uyar(k.r ? k.ad + ' eklendi; bebek için riskli malzemedir (Bebek Dolabı kapalı).' : '');
      return true;
    }
    function metniIsle(son) {
      var parca = gir.value.split(/[,;\n]/);
      var kalan = son ? '' : parca.pop();
      var reddedilen = [], bulunamayan = [], eklendi = 0;
      parca.forEach(function (p) {
        if (!normal(p)) return;
        var k = cozumle(p);
        if (!k) bulunamayan.push(p.trim());
        else if (sec(k)) eklendi++;
        else reddedilen.push(k);
      });
      gir.value = son ? '' : kalan.replace(/^\s+/, '');
      var m = [];
      if (reddedilen.length) m.push(reddedilen.length === 1 ? riskMetni(reddedilen[0]) : reddedilen.map(function (k) { return k.ad; }).join(', ') + ' bebek dolabına uygun değil; eklenmedi.');
      if (bulunamayan.length) m.push('“' + bulunamayan.join('”, “') + '” tariflerimizde geçen bir malzemeyle eşleşmedi.');
      if (m.length) uyar(m.join(' ')); else if (eklendi) uyar('');
      if (eklendi) guncelle();
      return eklendi;
    }
    function cikar(a) { dolap = dolap.filter(function (x) { return x !== a; }); guncelle(); }

    function cipleriCiz() {
      cipler.innerHTML = dolap.map(function (a) {
        var k = SOZ[a] || { ad: a }, r = riskli(a), s = r && bebek();
        return '<li class="kd-dolap__cip' + (r ? ' kd-dolap__cip--riskli' : '') + (s ? ' kd-dolap__cip--disi' : '') + '"><span>' + escH(k.ad) + (s ? ' <small>bebek dolabına uygun değil</small>' : '') + '</span>' +
          '<button type="button" data-kd-cikar="' + escH(a) + '" aria-label="' + escH(k.ad) + ' malzemesini dolaptan çıkar"><span aria-hidden="true">×</span></button></li>';
      }).join('');
      cipler.hidden = !dolap.length;
      if (temizleB) temizleB.hidden = !dolap.length;
    }

    /* eşleşme */
    var durum = {};   // slug → {tam|eksik|disi|riskli, eksik:[...]}
    function kartSlug(k) {
      var b = k.querySelector('[data-kd-kiler-ekle]'); if (b) return b.getAttribute('data-kd-kiler-ekle');
      if (k.dataset.slug) return k.dataset.slug;
      var a = k.matches('a[href]') ? k : k.querySelector('a[href*="kids-tarif.html"]');
      var m = a && /[?&]t=([^&#]+)/.exec(a.getAttribute('href')); return m ? decodeURIComponent(m[1]) : null;
    }
    function etkinDolap() { return dolap.filter(function (a) { return !(riskli(a) && bebek()); }); }
    function hesapla() {
      durum = {};
      var elde = etkinDolap(); if (!elde.length) return;
      var var_ = {}; elde.concat(TEMEL).forEach(function (a) { var_[a] = 1; });
      Object.keys(V.tarif || {}).forEach(function (slug) {
        var t = V.tarif[slug], g = t.g || [], i = t.i || [];
        if (bebek() && g.some(riskli)) { durum[slug] = { d: 'riskli', eksik: [] }; return; }
        var kullanilan = g.concat(i).filter(function (a) { return elde.indexOf(a) > -1; });
        var eksik = g.filter(function (a) { return !var_[a]; });
        var not = bebek() ? i.filter(riskli) : [];
        durum[slug] = { d: !kullanilan.length || eksik.length > 1 ? 'disi' : (eksik.length ? 'eksik' : 'tam'), eksik: eksik, not: not };
      });
    }
    var aktif = function () { return etkinDolap().length > 0; };
    var EK = {
      filtre: function (k) { if (!aktif()) return true; var s = durum[kartSlug(k)]; return !s || s.d === 'tam' || s.d === 'eksik'; },
      sira: function (a, b) { if (!aktif()) return 0; var r = function (k) { var s = durum[kartSlug(k)]; return !s ? 2 : s.d === 'tam' ? 0 : s.d === 'eksik' ? 1 : 2; }; return r(a) - r(b); }
    };
    window.KdKatalogEk = EK;

    function etiketle() {
      if (!iz) return;
      $$('.kd-tarif', iz).forEach(function (k) {
        var e = k.querySelector('.kd-dolap-durum'), s = aktif() && durum[kartSlug(k)];
        if (!s || (s.d !== 'tam' && s.d !== 'eksik')) { if (e) e.remove(); return; }
        if (!e) { e = document.createElement('p'); e.className = 'kd-dolap-durum'; var g = k.querySelector('.kd-kart__govde') || k; g.insertBefore(e, g.firstChild); }
        e.setAttribute('data-durum', s.d);
        e.innerHTML = (s.d === 'tam' ? '<span aria-hidden="true">✓</span> Tüm malzemeler dolapta' : '<span aria-hidden="true">+</span> 1 eksik: ' + escH(adOf(s.eksik[0]))) +
          (s.not && s.not.length ? ' <small>(' + escH(s.not.map(adOf).join(', ')) + ' kullanmadan)</small>' : '');
      });
    }
    /* yedek yol: kids.js kancası yoksa süzgeci kartlara biz uygularız */
    var gozcu = null, kendimiz = false;
    function yedekUygula() {
      if (!iz) return;
      kendimiz = true;
      var kartlar = $$('.kd-tarif', iz);
      kartlar.forEach(function (k) {
        var gec = EK.filtre(k);
        if (!gec && !k.hidden) { k.hidden = true; k.setAttribute('data-kd-dolap-gizli', ''); }
        else if (gec && k.hasAttribute('data-kd-dolap-gizli')) { k.hidden = false; k.removeAttribute('data-kd-dolap-gizli'); }
      });
      if (aktif()) kartlar.slice().sort(EK.sira).forEach(function (k) { iz.insertBefore(k, iz.querySelector('.kd-tl-cta')); });
      if (gozcu) gozcu.takeRecords();
      kendimiz = false;
    }
    function katalogYenile() {
      if (window.DadaKids && typeof window.DadaKids.katalogYenile === 'function') window.DadaKids.katalogYenile();
      else {
        yedekUygula();
        if (!gozcu && iz && window.MutationObserver) {
          gozcu = new MutationObserver(function () { if (!kendimiz && aktif()) { $$('[data-kd-dolap-gizli]', iz).forEach(function (k) { k.removeAttribute('data-kd-dolap-gizli'); }); yedekUygula(); etiketle(); ozetYaz(); } });
          gozcu.observe(iz, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
        }
      }
    }
    function ozetYaz() {
      if (!aktif()) {
        ozet.textContent = dolap.length ? 'Dolaptaki malzemeler Bebek Dolabına uygun değil; tüm tarifler gösteriliyor.' : 'Dolap boş: tüm tarifler gösteriliyor.';
        return;
      }
      var tam = 0, eksik = 0, riskliSay = 0;
      $$('.kd-tarif', iz).forEach(function (k) { if (k.hidden) return; var s = durum[kartSlug(k)]; if (s && s.d === 'tam') tam++; else if (s && s.d === 'eksik') eksik++; });
      Object.keys(durum).forEach(function (s) { if (durum[s].d === 'riskli') riskliSay++; });
      var temelAd = TEMEL.filter(function (a) { return dolap.indexOf(a) < 0; }).map(adOf).join(', ');
      var m = (tam || eksik) ? ('Dolabınızla ' + tam + ' tarif hazır' + (eksik ? ', ' + eksik + ' tarifte 1 malzeme eksik' : '') + '.') : 'Bu malzemelerle ve seçili filtrelerle yapılabilecek tarif bulunamadı; bir malzeme daha ekleyin ya da filtreleri gevşetin.';
      if (temelAd) m += ' ' + temelAd + ' evde var sayıldı.';
      if (riskliSay && bebek()) m += ' Riskli malzeme gerektiren ' + riskliSay + ' tarif Bebek Dolabı açıkken gösterilmez.';
      ozet.textContent = m;
    }
    function durumYaz() {
      if (!durumE) return;
      var d = kilerOku(), p = [bebek() ? 'Bebek Dolabı açık' : 'Bebek Dolabı kapalı'];
      if (dolap.length) p.push('Dolapta ' + dolap.length + ' malzeme');
      p.push(d.malzemeler.length ? 'Kilerde ' + d.malzemeler.length + ' malzeme' : 'Kiler boş');
      durumE.textContent = p.join(' · ');
    }
    function guncelle() { cipleriCiz(); hesapla(); katalogYenile(); etiketle(); ozetYaz(); durumYaz(); }

    /* olaylar */
    gir.addEventListener('input', function () {
      if (/[,;\n]/.test(gir.value)) metniIsle(false);
      listeyiCiz(gir.value);
    });
    gir.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { if (oneri.hidden) listeyiCiz(gir.value); etkinYap(etkin + 1); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { etkinYap(etkin - 1); e.preventDefault(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (etkin > -1 && liste[etkin]) { var k = liste[etkin].k; if (sec(k)) { gir.value = ''; guncelle(); } listeyiKapat(); }
        else { metniIsle(true); listeyiKapat(); }
      }
      else if (e.key === 'Escape') { if (!oneri.hidden) { listeyiKapat(); e.stopPropagation(); } else if (gir.value) gir.value = ''; }
      else if (e.key === 'Backspace' && !gir.value && dolap.length) { cikar(dolap[dolap.length - 1]); }
    });
    gir.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== gir) listeyiKapat(); }, 120); });
    oneri.addEventListener('mousedown', function (e) { e.preventDefault(); });   // odak girişte kalsın
    oneri.addEventListener('click', function (e) {
      var li = e.target.closest('[role="option"]'); if (!li) return;
      var s = liste[+li.getAttribute('data-i')]; if (!s) return;
      if (sec(s.k)) { gir.value = ''; guncelle(); }
      listeyiKapat(); gir.focus();
    });
    cipler.addEventListener('click', function (e) {
      var b = e.target.closest('[data-kd-cikar]'); if (!b) return;
      var li = b.closest('li'), kom = li.nextElementSibling || li.previousElementSibling, a = b.getAttribute('data-kd-cikar');
      var komA = kom && kom.querySelector('[data-kd-cikar]') ? kom.querySelector('[data-kd-cikar]').getAttribute('data-kd-cikar') : null;
      cikar(a);
      var odak = komA ? cipler.querySelector('[data-kd-cikar="' + komA + '"]') : null;   // anahtarlar slug: seçicide güvenli
      (odak || gir).focus();
    });
    if (bebekSec) bebekSec.addEventListener('change', function () {
      uyar(bebek() ? (dolap.some(riskli) ? 'Bebek Dolabı açık: riskli malzemeler soluk gösterilir ve eşleşmeye katılmaz.' : '') : 'Bebek Dolabı kapalı: riskli malzemeler eklenebilir ve eşleşmeye katılır.');
      guncelle(); if (!oneri.hidden) listeyiCiz(gir.value);
    });
    if (temizleB) temizleB.addEventListener('click', function () { dolap = []; uyar(''); guncelle(); gir.focus(); });

    /* Bebek Kilerim bloğu */
    var kListe = $('#kdKilerListe', kok), kBos = $('#kdKilerBos', kok), kSayi = $('#kdKilerSayi', kok);
    var yukleB = $('[data-kd-kiler-yukle]', kok), bosaltB = $('[data-kd-kiler-bosalt]', kok);
    function kileriCiz() {
      var d = kilerOku();
      kListe.innerHTML = d.malzemeler.map(function (a) {
        return '<li class="kd-dolap__cip"><span>' + escH(adOf(a)) + '</span><button type="button" data-kd-kiler-cikar="' + escH(a) + '" aria-label="' + escH(adOf(a)) + ' malzemesini Bebek Kilerinden çıkar"><span aria-hidden="true">×</span></button></li>';
      }).join('');
      kListe.hidden = !d.malzemeler.length; kBos.hidden = !!d.malzemeler.length;
      kSayi.textContent = d.malzemeler.length ? '(' + d.malzemeler.length + ' malzeme' + (kalici ? '' : ' · yalnız bu oturumda') + ')' : '';
      yukleB.disabled = !d.malzemeler.length; bosaltB.hidden = !d.malzemeler.length;
      durumYaz();
    }
    kListe.addEventListener('click', function (e) {
      var b = e.target.closest('[data-kd-kiler-cikar]'); if (!b) return;
      var a = b.getAttribute('data-kd-kiler-cikar'), d = kilerOku();
      d.malzemeler = d.malzemeler.filter(function (x) { return x !== a; });
      // malzemesi eksilen tarif artık "kilerde" sayılmaz
      d.tarifler = d.tarifler.filter(function (s) { var t = V.tarif && V.tarif[s]; return !t || (t.g || []).concat(t.i || []).indexOf(a) < 0; });
      kilerYaz(d);
      var ilk = kListe.querySelector('button'); (ilk || yukleB).focus();
    });
    yukleB.addEventListener('click', function () {
      var d = kilerOku(), once = dolap.length, red = [];
      d.malzemeler.forEach(function (a) { var k = SOZ[a]; if (!k) return; if (k.r && bebek()) { red.push(k.ad); return; } if (dolap.indexOf(a) < 0) dolap.push(a); });
      var n = dolap.length - once;
      uyar(n ? n + ' malzeme Bebek Kilerinden dolaba yüklendi.' + (red.length ? ' ' + red.join(', ') + ' bebek dolabına uygun değil.' : '') : 'Kilerdeki malzemeler zaten dolapta.');
      guncelle();
      kok.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
    bosaltB.addEventListener('click', function () { kilerYaz(bos()); bildir('Bebek Kileri boşaltıldı.', false); yukleB.focus(); });
    dinleyen.push(kileriCiz);

    /* açılır/kapanır: ≤768px'te varsayılan kapalı; dolapta malzeme varsa ya da #kdKiler / #dolap ile gelinirse açık */
    var HASH = /^#(kdKiler|dolap|kdDolap)$/;
    function panelAc(ac) {
      if (!acB || !govde) return;
      govde.hidden = !ac; acB.setAttribute('aria-expanded', String(ac));
      kok.classList.toggle('kd-dolap--kapali', !ac);
    }
    dolapPanelAc = panelAc;
    if (acB) acB.addEventListener('click', function () { panelAc(acB.getAttribute('aria-expanded') !== 'true'); });
    addEventListener('hashchange', function () { if (HASH.test(location.hash)) panelAc(true); });
    var hashIle = HASH.test(location.hash);
    panelAc(!matchMedia('(max-width: 768px)').matches || hashIle || dolap.length > 0);
    requestAnimationFrame(function () { requestAnimationFrame(function () { kok.classList.add('kd-dolap--hazir'); }); });
    if (hashIle) { var h = document.getElementById(location.hash.slice(1)); if (h) requestAnimationFrame(function () { h.scrollIntoView({ block: 'start' }); if (h.id === 'kdKiler') h.focus({ preventScroll: true }); }); }

    cipleriCiz(); kileriCiz(); hesapla(); ozetYaz(); durumYaz();
  }

  function basla() { bildirimKur(); dolapKur(); dugmeleriGuncelle(); }
  window.KdKiler = { oku: kilerOku, ekle: kilereEkle, yenile: degisti };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla); else basla();
})();
