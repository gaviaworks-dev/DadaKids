/* =====================================================================
   DADA GASTRO KIDS — Bebek Kilerim + "Dolapta Ne Var?" (sahibi: dolap ajanı; önce v2-tarif)
   · Tüm Kids sayfalarında yüklenir. [data-kd-kiler-ekle] düğmelerine olay delegasyonu:
     tarifin data-malzeme anahtarlarını Bebek Kilerine ekler (riskli olanlar hariç).
   · Depo: localStorage "dadagastrokids.kiler.v1" = {v:1, malzemeler:[anahtar], tarifler:[slug]};
     her erişim try/catch; depolama kapalıysa bellek içi (bildirim "yalnız bu oturumda" der).
   · Riskli liste: sayfadaki #kdDolapVeri (derlemede gömülü) → yoksa veri/bebek-dolabi.json → yoksa çekirdek yedek.
   · "Dolapta Ne Var?" bileşeni (#kdDolap, src/kids/dolap.mjs; yalnız kids-bebek-dolabi.html): kategori başına kendi kendine
     kayan şerit (kayanKur) + şeffaf ürün ikonlu kartlar + combobox, yaşa göre riskli uyarısı, iki grup sonuç
     ("Hemen yapabilirsin" / "1 malzeme eksik"), Bebek Kilerim (ekle / yükle). Yaşı #kdYasSerit'ten okur; yaş barı sayıları dolaba göre.
   · Kids Tarifleri: [data-kd-dolap-bag] bandı tıklanınca seçili yaşı (?yas) Bebek Dolabı bağına ekler (profil kids.js'ten).
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
  /* çip görseli: şeffaf Pixar ikonu (p) ya da yedek yuvarlak ürün fotoğrafı (f) */
  var cipFoto = function (a) {
    var k = SOZ[a]; if (!k || !(k.p || k.f)) return '';
    return '<span class="kd-dolap__cip-foto' + (k.p ? ' kd-dolap__cip-foto--pixar' : '') + '" style="background-image:url(\'varlik/kids/gorsel/' + (k.p ? 'urun-pixar/' : 'urun/') + escH(a) + '-k.webp\')" aria-hidden="true"></span>';
  };

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
    bildirimMetin.innerHTML = '<span>' + escH(metin) + '</span>' + (bagGoster ? ' <a href="' + (katalog ? '#kdKiler' : 'kids-bebek-dolabi.html#kdKiler') + '" data-kd-kilere-git>Kilere git</a>' : '');
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
      var azalt = matchMedia('(prefers-reduced-motion: reduce)').matches;
      hedef.scrollIntoView({ behavior: azalt ? 'auto' : 'smooth', block: 'start' });
      hedef.focus({ preventScroll: true });
      if (bildirim) bildirim.classList.remove('kd-acik');
    }
  }, true);
  window.addEventListener('storage', function (e) { if (e.key === DEPO) { bellek = null; degisti(); } });
  dinleyen.push(dugmeleriGuncelle);

  /* =====================================================================
     "Dolapta Ne Var?" bileşeni (src/kids/dolap.mjs): yalnız kids-bebek-dolabi.html (Kids Tarifleri'nde yerine bant).
     Akış (Gastro tarif-bulucu): fotoğraflı malzeme kartı / arama → seçilenler şeridi → "Hemen yapabilirsin" + "1 malzeme eksik".
     Yaş: #kdYasSerit .kd-yas-chip[aria-checked=true] (Kids Tarifleri'nde kids.js yönetir, tam sayfada burada).
     Riskli: seçili yaş < minAy (null = her yaşta) → kartta kısa uyarı; Bebek Dolabı açıkken eklenmez ve eşleşmeye katılmaz.
     ===================================================================== */
  function dolapKur() {
    var kok = document.getElementById('kdDolap'); if (!kok || !V.sozluk) return;
    var gir = $('#kdDolapGir'), oneri = $('#kdDolapOneri'), cipler = $('#kdDolapCipler'), seciliBos = $('#kdDolapSeciliBos');
    var uyari = $('#kdDolapUyari'), ozet = $('#kdDolapOzet'), bebekSec = $('#kdBebekDolabi');
    var temizleB = $('[data-kd-dolap-temizle]'), sayE = $('#kdDolapSay'), durumE = $('#kdDolapDurum');
    var sablon = document.getElementById('kdDolapKartlar');
    var grupTam = $('#kdDolapGrupTam'), grupEksik = $('#kdDolapGrupEksik'), bosE = $('#kdDolapBos'), yokE = $('#kdDolapYok');
    var sonucSay = $('#kdDolapSonucSay');
    var TEMEL = V.temel || [], TARIF = V.tarif || {};
    var dolap = [], etkin = -1, liste = [];
    var ilk = true;

    /* tarif kartı şablonları (o.tarifKart; derlemede <template> içinde) */
    var KART = {};
    if (sablon && sablon.content) $$('.kd-tarif', sablon.content).forEach(function (k) { var b = k.querySelector('[data-kd-kiler-ekle]'); if (b) KART[b.getAttribute('data-kd-kiler-ekle')] = k; });

    /* yaş */
    var serit = document.getElementById('kdYasSerit');
    function yas() { var c = serit && serit.querySelector('.kd-yas-chip[aria-checked="true"]'); var v = c ? c.getAttribute('data-yas') : 'tumu'; return v === 'tumu' || !v ? 'tumu' : +v; }
    function yasEtkin() { var y = yas(); return y === 'tumu' ? 6 : y; }
    function yasAd() { var y = yas(); return y === 'tumu' ? 'tüm yaşlar' : '+' + y + ' Ay'; }
    var bebek = function () { return !bebekSec || bebekSec.checked; };
    var riskliSimdi = function (a) { var k = SOZ[a]; return !!(k && k.r && (k.m == null || k.m > yasEtkin())); };
    var disi = function (a) { return bebek() && riskliSimdi(a); };
    var kisa = function (k) { return k.k || 'Bebek için riskli'; };

    /* ---------- arama (combobox) ---------- */
    var DIZIN = V.sozluk.map(function (k) { return { k: k, ad: normal(k.ad), es: (k.es || []).map(normal) }; });
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
      sonuc.sort(function (a, b) { return (b.tam - a.tam) || (a.p - b.p) || ((disi(a.k.a) ? 1 : 0) - (disi(b.k.a) ? 1 : 0)) || a.k.ad.localeCompare(b.k.ad, 'tr'); });
      return sonuc.slice(0, 8);
    }
    function cozumle(metin) {
      var q = normal(metin); if (!q) return null;
      var tam = DIZIN.filter(function (x) { return x.ad === q || x.es.indexOf(q) > -1; });
      if (tam.length) { tam.sort(function (a, b) { return (disi(a.k.a) ? 1 : 0) - (disi(b.k.a) ? 1 : 0); }); return tam[0].k; }
      var s = ara(metin); return s.length ? s[0].k : null;
    }
    function listeyiKapat() { oneri.hidden = true; oneri.innerHTML = ''; gir.setAttribute('aria-expanded', 'false'); gir.removeAttribute('aria-activedescendant'); etkin = -1; liste = []; }
    function listeyiCiz(q) {
      liste = ara(q); etkin = -1; gir.removeAttribute('aria-activedescendant');
      if (!liste.length) { listeyiKapat(); return; }
      oneri.innerHTML = liste.map(function (s, i) {
        var d = disi(s.k.a), r = riskliSimdi(s.k.a);
        return '<li role="option" id="kdDolapOneri-' + i + '" aria-selected="false"' + (d ? ' aria-disabled="true" class="kd-dolap__secenek--riskli"' : '') + ' data-i="' + i + '">' +
          '<span>' + escH(s.k.ad) + (s.es && s.es !== normal(s.k.ad) ? ' <small>“' + escH(s.es) + '”</small>' : '') + '</span>' +
          (r ? '<small class="kd-dolap__risk">' + escH(kisa(s.k)) + '</small>' : '') + '</li>';
      }).join('');
      oneri.hidden = false; gir.setAttribute('aria-expanded', 'true');
    }
    function etkinYap(i) {
      if (!liste.length) return;
      etkin = (i + liste.length) % liste.length;
      $$('[role="option"]', oneri).forEach(function (li, n) { li.setAttribute('aria-selected', String(n === etkin)); if (n === etkin) li.scrollIntoView({ block: 'nearest' }); });
      gir.setAttribute('aria-activedescendant', 'kdDolapOneri-' + etkin);
    }

    /* ---------- seçim ---------- */
    function uyar(metin) { uyari.textContent = metin; }   // canlı bölge hep ağaçta
    function riskMetni(k) { return k.ad + ': ' + kisa(k) + ' (seçili yaş: ' + yasAd() + '). Dolaba eklenmedi.'; }
    function sec(k) {
      if (!k) return false;
      if (disi(k.a)) { uyar(riskMetni(k)); salla(k.a); return false; }
      if (dolap.indexOf(k.a) < 0) dolap.push(k.a);
      uyar(riskliSimdi(k.a) ? k.ad + ' eklendi; ' + kisa(k).toLocaleLowerCase('tr') + ' (Bebek Dolabı kapalı).' : '');
      return true;
    }
    function salla(a) {
      var c = kok.querySelector('.kd-mz[data-a="' + a + '"]'); if (!c) return;
      c.classList.remove('kd-mz--red'); void c.offsetWidth; c.classList.add('kd-mz--red');
    }
    function metniIsle(son) {
      var parca = gir.value.split(/[,;\n]/);
      var kalan = son ? '' : parca.pop();
      var red = [], yok = [], eklendi = 0;
      parca.forEach(function (p) {
        if (!normal(p)) return;
        var k = cozumle(p);
        if (!k) yok.push(p.trim()); else if (sec(k)) eklendi++; else red.push(k);
      });
      gir.value = son ? '' : kalan.replace(/^\s+/, '');
      var m = [];
      if (red.length) m.push(red.length === 1 ? riskMetni(red[0]) : red.map(function (k) { return k.ad; }).join(', ') + ' seçili yaşa uygun değil; dolaba eklenmedi.');
      if (yok.length) m.push('“' + yok.join('”, “') + '” tariflerimizde geçen bir malzemeyle eşleşmedi.');
      if (m.length) uyar(m.join(' ')); else if (eklendi) uyar('');
      if (eklendi) guncelle();
      return eklendi;
    }
    function cikar(a) { dolap = dolap.filter(function (x) { return x !== a; }); guncelle(); }

    /* ---------- kartlar + şerit ---------- */
    function kartlariGuncelle() {
      $$('.kd-mz', kok).forEach(function (c) {
        var a = c.getAttribute('data-a'), r = riskliSimdi(a), d = disi(a), u = c.querySelector('.kd-mz__uyari');
        c.setAttribute('aria-pressed', String(dolap.indexOf(a) > -1));
        c.classList.toggle('kd-mz--uyari', r);
        if (d) c.setAttribute('aria-disabled', 'true'); else c.removeAttribute('aria-disabled');
        if (u) u.textContent = r ? (u.getAttribute('data-kisa') || '') : '';
      });
      $$('.kd-dolap-kat', kok).forEach(function (s) {
        var n = $$('.kd-mz[aria-pressed="true"]', s).length, e = s.querySelector('[data-kd-kat-say]');
        if (e) { e.hidden = !n; e.textContent = n ? n + ' seçili' : ''; }
      });
    }
    function cipleriCiz() {
      cipler.innerHTML = dolap.map(function (a) {
        var k = SOZ[a] || { ad: a }, r = riskliSimdi(a), s = disi(a);
        return '<li class="kd-dolap__cip' + (r ? ' kd-dolap__cip--riskli' : '') + (s ? ' kd-dolap__cip--disi' : '') + '">' +
          cipFoto(a) +
          '<span>' + escH(k.ad) + (s ? ' <small>dışlandı</small>' : '') + '</span>' +
          '<button type="button" data-kd-cikar="' + escH(a) + '" aria-label="' + escH(k.ad) + ' malzemesini dolaptan çıkar"><span aria-hidden="true">×</span></button></li>';
      }).join('');
      cipler.hidden = !dolap.length; seciliBos.hidden = !!dolap.length;
      if (temizleB) temizleB.hidden = !dolap.length;
      if (sayE) sayE.textContent = dolap.length;
    }

    /* ---------- eşleşme ---------- */
    var son = { tam: [], eksik: [], yakin: [], riskli: 0, yasDisi: 0 };
    function hesapla() { son = esle(yas()); }
    /* y: 'tumu' ya da ay; riskli eşiği o yaşa göre (yaş barı sayıları her yaş için ayrı hesaplanır) */
    function esle(y) {
      var son = { tam: [], eksik: [], yakin: [], riskli: 0, yasDisi: 0 };
      var yE = y === 'tumu' ? 6 : y;
      var riskliY = function (a) { var k = SOZ[a]; return !!(k && k.r && (k.m == null || k.m > yE)); };
      var disiY = function (a) { return bebek() && riskliY(a); };
      var elde = dolap.filter(function (a) { return !disiY(a); }); if (!elde.length) return son;
      var var_ = {}; elde.concat(TEMEL).forEach(function (a) { var_[a] = 1; });
      Object.keys(TARIF).forEach(function (slug) {
        if (!KART[slug]) return;
        var t = TARIF[slug], g = t.g || [], i = t.i || [];
        var kullanilan = g.concat(i).filter(function (a) { return elde.indexOf(a) > -1; });
        if (!kullanilan.length) return;
        var eksik = g.filter(function (a) { return !var_[a]; });
        if (eksik.length > 2) return;
        if (y !== 'tumu' && t.y > y) { if (eksik.length < 2) son.yasDisi++; return; }
        if (bebek() && g.some(riskliY)) { son.riskli++; return; }
        var o = { s: slug, u: kullanilan.length, eksik: eksik, not: bebek() ? i.filter(riskliY) : [], y: t.y };
        (eksik.length === 0 ? son.tam : eksik.length === 1 ? son.eksik : son.yakin).push(o);
      });
      var sira = function (a, b) { return (b.u - a.u) || (b.y - a.y); };
      son.tam.sort(sira); son.eksik.sort(sira); son.yakin.sort(sira);
      return son;
    }
    /* yaş barı sayıları (Kids Tarifleri'ndeki gibi): dolap boşken birikimli tarif sayısı, doluyken o yaşta çıkan sonuç (hazır + 1 eksik) */
    var yasIlk = {};
    function yasSayilari() {
      if (!serit) return;
      $$('.kd-yas-chip', serit).forEach(function (c) {
        var v = c.getAttribute('data-yas'), sm = c.querySelector('small'); if (!sm) return;
        if (!(v in yasIlk)) yasIlk[v] = sm.textContent;
        if (!dolap.length) { sm.textContent = yasIlk[v]; return; }
        var r = esle(v === 'tumu' ? 'tumu' : +v); sm.textContent = r.tam.length + r.eksik.length;
      });
    }
    /* en sık eksik malzemeler (öneri çipleri): 1 eksikler önce, sonra 2 eksikler */
    function oneriler(kaynak, adet) {
      var say = {};
      kaynak.forEach(function (o) { o.eksik.forEach(function (a) { if (!disi(a) && dolap.indexOf(a) < 0) say[a] = (say[a] || 0) + 1; }); });
      return Object.keys(say).sort(function (a, b) { return say[b] - say[a] || adOf(a).localeCompare(adOf(b), 'tr'); }).slice(0, adet).map(function (a) { return { a: a, n: say[a] }; });
    }
    var oneriCip = function (l) { return l.map(function (o) { return '<button type="button" class="kd-dolap__oneri-ekle" data-kd-oneri-ekle="' + escH(o.a) + '"><span aria-hidden="true">+</span> ' + escH(adOf(o.a)) + '</button>'; }).join(''); };

    function kartYap(o, grup) {
      var k = KART[o.s].cloneNode(true);
      k.classList.add('kd-gorundu');
      $$('img[loading="lazy"]', k).forEach(function (i) { i.loading = 'eager'; });   // dinamik kart: görünür alana girmeden de yüklensin
      var m = k.querySelector('.kd-tarif__medya') || k;
      var r = document.createElement('span');
      r.className = 'kd-dolap-rozet'; r.setAttribute('data-durum', grup);
      r.innerHTML = grup === 'tam' ? '<span aria-hidden="true">✓</span> Hepsi dolapta' : 'Eksik: ' + escH(adOf(o.eksik[0]));
      if (o.not.length) r.innerHTML += ' <small>· ' + escH(o.not.map(adOf).join(', ')) + ' olmadan</small>';
      m.appendChild(r);
      return k;
    }
    function sutun(iz) { var c = getComputedStyle(iz).gridTemplateColumns; return c && c !== 'none' ? c.split(/\s+/).filter(Boolean).length : 1; }
    function dolgu(span, ic) {
      var d = document.createElement('div');
      d.className = 'kd-kart kd-cta-kart kd-dolap-dolgu';
      d.style.gridColumn = 'span ' + span;
      d.innerHTML = ic;
      return d;
    }
    function grupCiz(bolum, l, grup) {
      var iz = bolum.querySelector('.kd-dolap-izgara');
      bolum.hidden = !l.length; iz.innerHTML = '';
      var sayE2 = bolum.querySelector('[data-kd-grup-say]'); if (sayE2) sayE2.textContent = l.length ? '(' + l.length + ')' : '';
      if (!l.length) return false;
      var c = sutun(iz);
      l.forEach(function (o) { iz.appendChild(kartYap(o, grup)); });
      var bos = c >= 2 ? (c - l.length % c) % c : 0;
      if (bos) {
        var on = oneriler(grup === 'tam' ? son.eksik.concat(son.yakin) : son.yakin.concat(son.eksik), 3);
        var imza = on.map(function (x) { return x.a; }).join(',');
        if (grup === 'eksik' && imza && imza === oneriImza) on = [];   // aynı öneriler iki kez çıkmasın: ikinci dolgu tüm tariflere yönlendirir
        if (grup === 'tam') oneriImza = imza;
        iz.appendChild(dolgu(bos, on.length
          ? '<span class="kd-dolap-dolgu__ust">Daha çok tarif</span><h3>Bir malzeme daha ekleyin</h3><p>Dolabınızda varsa ekleyin; eşleşen tarifler artsın.</p><div class="kd-dolap-oneri-cip">' + oneriCip(on) + '</div>'
          : '<span class="kd-dolap-dolgu__ust">Daha çok tarif</span><h3>Kids Tarifleri</h3><p>Yaşa, kıvama ve alerjene göre tüm tariflere göz atın.</p><a class="kd-btn kd-btn--hafif kd-btn--kucuk" href="kids-tarifler.html">Tüm tarifler <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>'));
      }
      return false;
    }
    var oneriImza = '';
    function sonuclariCiz() {
      oneriImza = '';
      var aktif = dolap.some(function (a) { return !disi(a); });
      bosE.hidden = aktif;
      if (!aktif) { grupTam.hidden = true; grupEksik.hidden = true; yokE.hidden = true; }
      else {
        // önce görünür yap (sütun sayısı ölçülebilsin), sonra çiz
        grupTam.hidden = !son.tam.length; grupEksik.hidden = !son.eksik.length;
        grupCiz(grupTam, son.tam, 'tam'); grupCiz(grupEksik, son.eksik, 'eksik');
        var hic = !son.tam.length && !son.eksik.length;
        yokE.hidden = !hic;
        if (hic) {
          var m = 'Bir malzeme daha ekleyin' + (son.yakin.length ? ':' : '.');
          var on = oneriler(son.yakin, 4), ek = '';
          if (son.yasDisi && yas() !== 'tumu') {
            var sonraki = [8, 9, 12, 18, 24].filter(function (x) { return x > yas(); })[0];
            if (sonraki && serit && serit.querySelector('.kd-yas-chip[data-yas="' + sonraki + '"]')) ek = '<button type="button" class="kd-dolap__oneri-ekle" data-kd-yas-ac="' + sonraki + '">+' + sonraki + ' Ay tariflerini de göster</button>';
          }
          if (!on.length && !ek) m = 'Başka bir malzeme deneyin ya da Bebek Dolabı ve yaş seçimini gözden geçirin.';
          $('[data-kd-yok-metin]', yokE).textContent = m;
          $('[data-kd-yok-oneri]', yokE).innerHTML = oneriCip(on) + ek;
        }
      }
      var n = aktif ? son.tam.length + son.eksik.length : 0;
      sonucSay.textContent = n;
      dugmeleriGuncelle();
    }
    function ozetYaz() {
      var aktif = dolap.some(function (a) { return !disi(a); });
      var p = [yas() === 'tumu' ? 'Tüm yaşlar' : '+' + yas() + ' Ay ve öncesi'];
      if (!dolap.length) { ozet.textContent = p[0] + ' · malzeme seçince tarifler burada.'; return; }
      if (aktif) p.push(son.tam.length + ' hazır, ' + son.eksik.length + ' tarifte 1 eksik');
      var temelAd = TEMEL.filter(function (a) { return dolap.indexOf(a) < 0; }).map(adOf).join(', ');
      if (temelAd && aktif) p.push(temelAd + ' evde var sayıldı');
      var dis = dolap.filter(disi).map(adOf);
      if (dis.length) p.push(dis.join(', ') + ' bu yaş için dışlandı');
      if (son.riskli && bebek()) p.push(son.riskli + ' tarif riskli malzeme gerektirdiği için gizlendi');
      ozet.textContent = p.join(' · ') + '.';
    }
    function durumYaz() {
      if (!durumE) return;
      var d = kilerOku(), p = [];
      p.push(dolap.length ? 'Dolapta ' + dolap.length + ' malzeme' : 'Dolap boş');
      if (dolap.length) p.push(son.tam.length + ' tarif hazır');
      p.push(d.malzemeler.length ? 'Kilerde ' + d.malzemeler.length : 'Kiler boş');
      if (!bebek()) p.push('Bebek Dolabı kapalı');
      durumE.textContent = p.join(' · ');
    }
    function adresYaz() {
      if (ilk) return;
      if (window.DadaKids && window.DadaKids.adresiGuncelle) window.DadaKids.adresiGuncelle({ m: dolap.length ? dolap.join(',') : null });
    }
    function guncelle() { cipleriCiz(); kartlariGuncelle(); hesapla(); sonuclariCiz(); ozetYaz(); durumYaz(); kileriCiz(); yasSayilari(); adresYaz(); }

    /* ---------- olaylar ---------- */
    gir.addEventListener('input', function () { if (/[,;\n]/.test(gir.value)) metniIsle(false); listeyiCiz(gir.value); });
    gir.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { if (oneri.hidden) listeyiCiz(gir.value); etkinYap(etkin + 1); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { etkinYap(etkin - 1); e.preventDefault(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (etkin > -1 && liste[etkin]) { if (sec(liste[etkin].k)) { gir.value = ''; guncelle(); } listeyiKapat(); }
        else { metniIsle(true); listeyiKapat(); }
      }
      else if (e.key === 'Escape') { if (!oneri.hidden) { listeyiKapat(); e.stopPropagation(); } else if (gir.value) gir.value = ''; }
      else if (e.key === 'Backspace' && !gir.value && dolap.length) { cikar(dolap[dolap.length - 1]); }
    });
    gir.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== gir) listeyiKapat(); }, 120); });
    oneri.addEventListener('mousedown', function (e) { e.preventDefault(); });
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
      var odak = komA ? cipler.querySelector('[data-kd-cikar="' + komA + '"]') : null;
      (odak || gir).focus();
    });
    kok.addEventListener('click', function (e) {
      var c = e.target.closest('.kd-mz');
      if (c) {
        var a = c.getAttribute('data-a'), k = SOZ[a]; if (!k) return;
        if (dolap.indexOf(a) > -1) { cikar(a); uyar(''); return; }
        if (sec(k)) { c.classList.remove('kd-mz--pop'); void c.offsetWidth; c.classList.add('kd-mz--pop'); guncelle(); }
      }
    });
    document.addEventListener('click', function (e) {
      var o = e.target.closest && e.target.closest('[data-kd-oneri-ekle]');
      if (o && kok.parentNode.contains(o)) { var k = SOZ[o.getAttribute('data-kd-oneri-ekle')]; if (sec(k)) { uyar(k.ad + ' dolaba eklendi.'); guncelle(); gir.focus({ preventScroll: true }); } return; }
      var y = e.target.closest && e.target.closest('[data-kd-yas-ac]');
      if (y) { var ch = serit && serit.querySelector('.kd-yas-chip[data-yas="' + y.getAttribute('data-kd-yas-ac') + '"]'); if (ch) ch.click(); }
    });
    if (bebekSec) bebekSec.addEventListener('change', function () {
      var dis = dolap.filter(riskliSimdi).map(adOf);
      uyar(bebek() ? (dis.length ? dis.join(', ') + ' bu yaş için dışlandı; eşleşmeye katılmaz.' : 'Bebek Dolabı açık: seçili yaşa riskli malzemeler eklenmez.') : 'Bebek Dolabı kapalı: riskli malzemeler uyarıyla eklenebilir.');
      guncelle(); if (!oneri.hidden) listeyiCiz(gir.value);
    });
    if (temizleB) temizleB.addEventListener('click', function () { dolap = []; uyar(''); guncelle(); gir.focus(); });

    /* yaş değişimi: Kids Tarifleri'nde kids.js şeridi yönetir (biz yalnız dinleriz); tam sayfada şerit bizim */
    var oncekiYas = yas();
    function yasDegisti() {
      var y = yas(); if (y === oncekiYas) return; oncekiYas = y;
      var dis = dolap.filter(disi).map(adOf);
      uyar(dis.length ? dis.join(', ') + ' ' + yasAd() + ' için uygun değil (' + dolap.filter(disi).map(function (a) { return kisa(SOZ[a]).toLocaleLowerCase('tr'); }).join('; ') + '); sonuçlardan çıkarıldı.' : '');
      guncelle(); if (!oneri.hidden) listeyiCiz(gir.value);
    }
    if (serit) {
      {
        var cs = $$('.kd-yas-chip', serit), bas = new URLSearchParams(location.search).get('yas');
        var kv = window.DadaKids && window.DadaKids.kova ? window.DadaKids.kova() : null;
        var ilkY = cs.some(function (c) { return c.getAttribute('data-yas') === bas; }) ? bas : (kv ? String(kv) : 'tumu');
        var isaretle = function (v) { cs.forEach(function (c) { var s = c.getAttribute('data-yas') === v; c.setAttribute('aria-checked', String(s)); c.tabIndex = s ? 0 : -1; }); };
        isaretle(ilkY); oncekiYas = yas();
        cs.forEach(function (c) {
          c.addEventListener('click', function () {
            isaretle(c.getAttribute('data-yas'));
            if (window.DadaKids && window.DadaKids.adresiGuncelle) window.DadaKids.adresiGuncelle({ yas: c.getAttribute('data-yas') === 'tumu' ? null : c.getAttribute('data-yas') });
            yasDegisti();
          });
          c.addEventListener('keydown', function (e) {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            var i = cs.indexOf(c), n = cs[(i + (e.key === 'ArrowRight' ? 1 : cs.length - 1)) % cs.length];
            n.focus(); n.click(); e.preventDefault();
          });
        });
      }
    }

    /* ---------- Bebek Kilerim ---------- */
    var kListe = $('#kdKilerListe'), kBos = $('#kdKilerBos'), kSayi = $('#kdKilerSayi');
    var yukleB = $('[data-kd-kiler-yukle]'), kaydetB = $('[data-kd-kiler-kaydet]'), bosaltB = $('[data-kd-kiler-bosalt]');
    var kilereGirer = function (a) { return !(SOZ[a] && SOZ[a].r); };   // riskli malzeme hiçbir yaşta kilere girmez
    function kileriCiz() {
      var d = kilerOku();
      kListe.innerHTML = d.malzemeler.map(function (a) {
        return '<li class="kd-dolap__cip">' + cipFoto(a) + '<span>' + escH(adOf(a)) + '</span><button type="button" data-kd-kiler-cikar="' + escH(a) + '" aria-label="' + escH(adOf(a)) + ' malzemesini Bebek Kilerinden çıkar"><span aria-hidden="true">×</span></button></li>';
      }).join('');
      var yeni = dolap.filter(function (a) { return kilereGirer(a) && d.malzemeler.indexOf(a) < 0; });
      kListe.hidden = !d.malzemeler.length;
      kSayi.textContent = d.malzemeler.length ? '(' + d.malzemeler.length + ' malzeme' + (kalici ? '' : ' · yalnız bu oturumda') + ')' : '';
      yukleB.hidden = !d.malzemeler.length || d.malzemeler.every(function (a) { return dolap.indexOf(a) > -1; });
      kaydetB.hidden = !yeni.length;
      kaydetB.textContent = yeni.length ? 'Seçilenleri kilere ekle (' + yeni.length + ')' : 'Seçilenleri kilere ekle';
      bosaltB.hidden = !d.malzemeler.length;
      kBos.hidden = false;
      kBos.textContent = d.malzemeler.length
        ? (yukleB.hidden ? 'Kilerdeki malzemelerin hepsi dolapta.' : 'Kilerdekileri tek tıkla dolaba yükleyin.')
        : (dolap.length ? 'Kileriniz boş: seçtiklerinizi “Seçilenleri kilere ekle” ile saklayın.' : 'Kileriniz boş: malzeme seçin, sonra buradan kilere ekleyin.');
      durumYaz();
    }
    kListe.addEventListener('click', function (e) {
      var b = e.target.closest('[data-kd-kiler-cikar]'); if (!b) return;
      var a = b.getAttribute('data-kd-kiler-cikar'), d = kilerOku();
      d.malzemeler = d.malzemeler.filter(function (x) { return x !== a; });
      d.tarifler = d.tarifler.filter(function (s) { var t = TARIF[s]; return !t || (t.g || []).concat(t.i || []).indexOf(a) < 0; });
      kilerYaz(d);
      var ilkB = kListe.querySelector('button'); (ilkB || kok).focus();
    });
    kaydetB.addEventListener('click', function () {
      var d = kilerOku(), atla = dolap.filter(function (a) { return !kilereGirer(a); });
      var yeni = dolap.filter(function (a) { return kilereGirer(a) && d.malzemeler.indexOf(a) < 0; });
      d.malzemeler = d.malzemeler.concat(yeni); kilerYaz(d);
      var m = yeni.length + ' malzeme Bebek Kilerine eklendi.';
      if (atla.length) m += ' ' + atla.map(adOf).join(', ') + ' bebek dolabına uygun olmadığı için eklenmedi.';
      if (!kalici) m += ' (Yalnız bu oturumda: tarayıcı depolaması kapalı.)';
      bildir(m, false); uyar(m);
      (yukleB.hidden ? bosaltB : yukleB).focus();
    });
    yukleB.addEventListener('click', function () {
      var d = kilerOku(), once = dolap.length, red = [];
      d.malzemeler.forEach(function (a) { var k = SOZ[a]; if (!k) return; if (disi(a)) { red.push(k.ad); return; } if (dolap.indexOf(a) < 0) dolap.push(a); });
      var n = dolap.length - once;
      uyar(n ? n + ' malzeme Bebek Kilerinden dolaba yüklendi.' + (red.length ? ' ' + red.join(', ') + ' seçili yaşa uygun değil.' : '') : 'Kilerdeki malzemeler zaten dolapta.');
      guncelle();
      var s = $('#kdDolapSonuc'); if (s) s.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      gir.focus({ preventScroll: true });
    });
    bosaltB.addEventListener('click', function () { kilerYaz(bos()); bildir('Bebek Kileri boşaltıldı.', false); kok.focus && gir.focus({ preventScroll: true }); });
    dinleyen.push(kileriCiz);

    /* başlangıç: ?m=… ile gelen seçim (Tam ekranda aç / paylaşılan bağ) */
    (new URLSearchParams(location.search).get('m') || '').split(',').forEach(function (a) { a = a.trim(); if (SOZ[a] && dolap.indexOf(a) < 0 && !disi(a)) dolap.push(a); });
    if (/^#kdKiler$/.test(location.hash)) { var h = document.getElementById('kdKiler'); if (h) requestAnimationFrame(function () { h.scrollIntoView({ block: 'start' }); h.focus({ preventScroll: true }); }); }
    guncelle(); ilk = false;
    kayanKur(kok);
    /* sütun sayısı değişince grupları yeniden diz (dolgu kartı satırı tamamlar) */
    var sonGen = innerWidth, zz;
    addEventListener('resize', function () { if (innerWidth === sonGen) return; sonGen = innerWidth; clearTimeout(zz); zz = setTimeout(sonuclariCiz, 120); });
  }

  /* =====================================================================
     Kayan kategori şeritleri (Revize 2 Kas R4; Gastro .mz-grid yatay şeridi + kendi kendine kayma)
     · .kd-kayan: yatay kaydırma + scroll-snap; her ~3,2 sn bir kart kayar, sonda başa döner (satırlar kademeli başlar)
     · Durur: imleç şeridin üstündeyken, şeritte odak varken, dokunma/sürükleme/tekerlek sonrası 6 sn, sekme gizliyken,
       şerit ekranda değilken (IntersectionObserver), "Kaydırmayı durdur" düğmesiyle (WCAG 2.2.2; kalıcı, yeniden başlatılabilir)
     · prefers-reduced-motion: reduce → otomatik kayma YOK, düğme gizli; ok düğmeleri anında (smooth yok) kaydırır
     · Klavye: kartlar sekme sırasında (odak gelen kart görünür alana kayar); şeritte ←/→ komşu karta geçer
     · Kenar durumu: .kd-kayan--tasma / --bas / --son (kenar solması + ok düğmelerinin disabled hâli)
     ===================================================================== */
  function kayanKur(kok) {
    var izler = $$('.kd-kayan', kok); if (!izler.length) return;
    var mq = matchMedia('(prefers-reduced-motion: reduce)');
    var durB = $('[data-kd-kayan-dur]', kok), durMetin = durB && $('[data-kd-kayan-dur-metin]', durB);
    var kullaniciDurdu = false, ADIM = 3200, BEKLE = 6000;
    var D = izler.map(function (iz, i) {
      var sec = iz.closest('.kd-dolap-kat') || iz.parentNode;
      return { iz: iz, oklar: $$('[data-kd-kayan-yon]', sec), gor: !('IntersectionObserver' in window), ust: false, odak: false, bekle: 0, son: Date.now() + i * 650 };
    });
    var azalt = function () { return mq.matches; };
    function kenar(d) {
      var iz = d.iz, t = iz.scrollWidth > iz.clientWidth + 2;
      var bas = iz.scrollLeft <= 2, son = iz.scrollLeft + iz.clientWidth >= iz.scrollWidth - 2;
      iz.classList.toggle('kd-kayan--tasma', t); iz.classList.toggle('kd-kayan--bas', !t || bas); iz.classList.toggle('kd-kayan--son', !t || son);
      d.oklar.forEach(function (b) { var geri = b.getAttribute('data-kd-kayan-yon') === '-1'; b.disabled = !t || (geri ? bas : son); });
      return t;
    }
    function kartGen(d) { var k = d.iz.querySelector('.kd-mz'); if (!k) return 120; var g = parseFloat(getComputedStyle(d.iz).columnGap) || 8; return k.getBoundingClientRect().width + g; }
    function kaydir(d, dx, mutlak) {
      var o = { behavior: azalt() ? 'auto' : 'smooth' };
      if (mutlak) { o.left = dx; d.iz.scrollTo(o); } else { o.left = dx; d.iz.scrollBy(o); }
    }
    function adim(d) {
      if (!kenar(d)) return;
      if (d.iz.scrollLeft + d.iz.clientWidth >= d.iz.scrollWidth - 2) kaydir(d, 0, true); else kaydir(d, kartGen(d));
    }
    /* odaklanan kart tam görünsün: scroll-snap (mandatory) tarayıcının odak kaydırmasını kart başına geri hizalayıp kartı yarım
       bırakabiliyor → kartı tümüyle gösteren en yakın kart başına (snap noktası) anında kaydır */
    function odakGoster(d, k) {
      if (!k) return;
      var iz = d.iz, pad = parseFloat(getComputedStyle(iz).scrollPaddingLeft) || 0, sol = iz.scrollLeft, w = iz.clientWidth;
      var bas = k.offsetLeft - iz.firstElementChild.offsetLeft, son = bas + k.offsetWidth;
      var hedef = null;
      if (bas - pad < sol) hedef = bas - pad;
      else if (son + pad > sol + w) {
        var gerek = son + pad - w;
        $$('.kd-mz', iz).some(function (m) { var x = m.offsetLeft - iz.firstElementChild.offsetLeft - pad; if (x >= gerek - 1) { hedef = x; return true; } return false; });
        if (hedef === null) hedef = iz.scrollWidth;
      }
      if (hedef !== null) iz.scrollTo({ left: Math.max(0, hedef), behavior: 'auto' });
    }
    function dursunMu(d, simdi) { return azalt() || kullaniciDurdu || document.hidden || !d.gor || d.ust || d.odak || simdi < d.bekle; }
    setInterval(function () {
      var simdi = Date.now();
      D.forEach(function (d) {
        if (dursunMu(d, simdi)) { d.son = Math.max(d.son, simdi); return; }   // durunca sayaç baştan: yeniden başlayınca hemen zıplamaz
        if (simdi - d.son >= ADIM) { d.son = simdi; adim(d); }
      });
    }, 250);
    D.forEach(function (d) {
      var iz = d.iz;
      iz.addEventListener('scroll', function () { kenar(d); }, { passive: true });
      iz.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') d.ust = true; });
      iz.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { d.ust = false; d.son = Date.now(); } });
      ['pointerdown', 'touchstart', 'wheel'].forEach(function (t) { iz.addEventListener(t, function () { d.bekle = Date.now() + BEKLE; }, { passive: true }); });
      iz.addEventListener('focusin', function (e) { d.odak = true; odakGoster(d, e.target.closest('.kd-mz')); });
      iz.addEventListener('focusout', function (e) { if (!iz.contains(e.relatedTarget)) { d.odak = false; d.son = Date.now(); } });
      iz.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var k = $$('.kd-mz', iz), i = k.indexOf(document.activeElement); if (i < 0) return;
        var n = k[i + (e.key === 'ArrowRight' ? 1 : -1)]; if (n) { n.focus(); e.preventDefault(); }
      });
      d.oklar.forEach(function (b) {
        b.addEventListener('click', function () {
          var yon = +b.getAttribute('data-kd-kayan-yon'), sayfa = Math.max(kartGen(d), iz.clientWidth - kartGen(d));
          d.bekle = Date.now() + BEKLE; kaydir(d, yon * sayfa);
        });
      });
      kenar(d);
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (g) { g.forEach(function (x) { var d = D.filter(function (y) { return y.iz === x.target; })[0]; if (d) { d.gor = x.isIntersecting; if (d.gor) d.son = Date.now(); } }); }, { threshold: 0.6 });
      D.forEach(function (d) { io.observe(d.iz); });
    }
    addEventListener('resize', function () { D.forEach(kenar); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) D.forEach(function (d) { d.son = Date.now(); }); });
    function durYaz() {
      if (!durB) return;
      durB.hidden = azalt();
      durB.setAttribute('aria-pressed', String(kullaniciDurdu));
      durB.classList.toggle('kd-kayan-dur--durdu', kullaniciDurdu);
      if (durMetin) durMetin.textContent = kullaniciDurdu ? 'Kaydırmayı başlat' : 'Kaydırmayı durdur';
    }
    if (durB) durB.addEventListener('click', function () { kullaniciDurdu = !kullaniciDurdu; D.forEach(function (d) { d.son = Date.now(); }); durYaz(); });
    if (mq.addEventListener) mq.addEventListener('change', durYaz);
    durYaz();
    window.KdKayan = { durdur: function (v) { kullaniciDurdu = v !== false; durYaz(); }, durum: function () { return { durdu: kullaniciDurdu, azalt: azalt(), izler: D.map(function (d) { return { id: d.iz.id, gor: d.gor, x: Math.round(d.iz.scrollLeft) }; }) }; } };
  }

  /* Kids Tarifleri: Bebek Dolabı bandı seçili yaşı taşır (profil parametreleri kids.js baglariGuncelle'den zaten bağda) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-kd-dolap-bag]'); if (!a) return;
    var c = document.querySelector('#kdYasSerit .kd-yas-chip[aria-checked="true"]'), y = c ? c.getAttribute('data-yas') : 'tumu';
    var ham = a.getAttribute('href'), parca = ham.split('#'), yol = parca[0].split('?'), p = new URLSearchParams(yol[1] || '');
    if (y && y !== 'tumu') p.set('yas', y); else p.delete('yas');
    var s = p.toString(); a.setAttribute('href', yol[0] + (s ? '?' + s : '') + (parca[1] ? '#' + parca[1] : ''));
  }, true);

  function basla() { bildirimKur(); dolapKur(); dugmeleriGuncelle(); }
  window.KdKiler = { oku: kilerOku, ekle: kilereEkle, yenile: degisti };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla); else basla();
})();
