/* =====================================================================
   DADA GASTRO KIDS — ortak davranış (bağımlılıksız, sahibi: v2-cekirdek)
   Sözleşme (sayfa kolları bunlara güvenebilir):
   · html.kd-js sınıfı · .kd-gir öğeleri görünür alana girince .kd-gorundu alır
   · window.DadaKids = { profil:{evre,c,ay}, EVRE, kova(), profilAyarla(p), dinle(fn) }
   · href'i "kids" ile başlayan bağlar profili taşır (?evre=…&c=…&ay=…) — depolama YOK
   · --kd-ust-bosluk: görünen Gastro katmanının alt kenarı (üstte header altı; ana menü gizliyken siyah üst bandın altı, mobilde 0)
   · --kd-bar-alt (kids.css): Kids barının alt kenarı — sayfa yapışkan barları top: var(--kd-bar-alt)
   · Yapışkan Kids barı: aşağı kayınca html.kd-ust-gizli (yalnız Gastro ana menüsü transform ile gizlenir, siyah bant + bar kalır)
   · Tema rengi kontrolü Kids barında en sağda (Yardım ile); ≤600px Yardım panelinde (DadaKids.temaSecici)
   · Filtre paneli: .kd-filtre-ac[aria-controls=ID] → #ID.kd-filtre, kapat: .kd-filtre__kapat
   ===================================================================== */
(function () {
  'use strict';
  document.documentElement.classList.add('kd-js');

  var EVRE = {
    'hamilelik': { ad: 'Hamilelik & Lohusalık', renk: 'pembe', ikon: 'hamile', kova: null },
    '0-6-ay': { ad: '0–6 Ay', renk: 'mavi', ikon: 'biberon', kova: null },
    '6-8-ay': { ad: '6–8 Ay', renk: 'seftali', ikon: 'kasik', kova: 6 },
    '9-12-ay': { ad: '9–12 Ay', renk: 'mint', ikon: 'tabak-bolmeli', kova: 9 },
    '1-3-yas': { ad: '1–3 Yaş', renk: 'sari', ikon: 'yurumeye-baslayan', kova: 12 }
  };
  var CINSIYET = { kiz: 'Kız', erkek: 'Erkek', belirtilmedi: 'Belirtilmedi', bilinmiyor: 'Henüz bilmiyoruz' };
  var KOVALAR = [6, 8, 9, 12, 18, 24];
  var KOVA_AD = { 6: '+6 Ay', 8: '+8 Ay', 9: '+9 Ay', 12: '+12 Ay', 18: '+18 Ay', 24: '2–3 Yaş' };

  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
  var normal = function (s) { return String(s || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/â/g, 'a'); };

  /* ---------- Profil (URL) ---------- */
  var q = new URLSearchParams(location.search);
  var profil = {
    evre: EVRE[q.get('evre')] ? q.get('evre') : null,
    c: CINSIYET[q.get('c')] ? q.get('c') : null,
    ay: /^\d{1,2}$/.test(q.get('ay') || '') ? parseInt(q.get('ay'), 10) : null
  };
  if (profil.c === 'bilinmiyor' && profil.evre !== 'hamilelik') profil.c = 'belirtilmedi';
  var dinleyiciler = [];

  function evreAydan(ay) { return ay < 6 ? '0-6-ay' : ay < 9 ? '6-8-ay' : ay < 12 ? '9-12-ay' : '1-3-yas'; }
  function kova() {
    if (profil.ay !== null) { if (profil.ay < 6) return null; var k = null; KOVALAR.forEach(function (x) { if (x <= profil.ay) k = x; }); return k; }
    return profil.evre ? EVRE[profil.evre].kova : null;
  }
  function temaUygula() {
    var t = (profil.c === 'kiz' || profil.c === 'erkek') ? profil.c : null;
    if (t) document.documentElement.setAttribute('data-kd-tema', t); else document.documentElement.removeAttribute('data-kd-tema');
  }
  function profilParam(p) {
    if (profil.evre) p.set('evre', profil.evre); else p.delete('evre');
    if (profil.c && profil.c !== 'belirtilmedi') p.set('c', profil.c); else p.delete('c');
    if (profil.ay !== null) p.set('ay', String(profil.ay)); else p.delete('ay');
    return p;
  }
  function baglariGuncelle() {
    $$('a[href^="kids"]').forEach(function (a) {
      var ham = a.getAttribute('href'), parca = ham.split('#'), yol = parca[0].split('?');
      var s = profilParam(new URLSearchParams(yol[1] || '')).toString();
      a.setAttribute('href', yol[0] + (s ? '?' + s : '') + (parca[1] ? '#' + parca[1] : ''));
    });
  }
  function adresiGuncelle(ek) {
    var p = profilParam(new URLSearchParams(location.search));
    if (ek) Object.keys(ek).forEach(function (k) { if (ek[k] === null || ek[k] === '') p.delete(k); else p.set(k, ek[k]); });
    var s = p.toString();
    try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) { /* file:// vb. */ }
  }
  function profilAyarla(yeni) {
    Object.keys(yeni).forEach(function (k) { profil[k] = yeni[k]; });
    if ('c' in yeni) temaYaz(yeni.c === 'kiz' || yeni.c === 'erkek' ? yeni.c : 'notr');
    temaUygula(); adresiGuncelle(); baglariGuncelle();
    dinleyiciler.forEach(function (fn) { try { fn(profil); } catch (e) {} });
  }
  /* Tema tercihi: URL'deki c (profil) önceliklidir; yoksa bu cihazdaki tercih (localStorage, try/catch) */
  var TEMA_ANAHTAR = 'dadakids.tema.v1';
  function temaOku() { try { return localStorage.getItem(TEMA_ANAHTAR); } catch (e) { return null; } }
  function temaYaz(t) { try { localStorage.setItem(TEMA_ANAHTAR, t); } catch (e) { /* depolama kapalı: yalnız bu sayfa */ } }
  // URL'de c açıkça varsa o geçerli ve hatırlanır ('belirtilmedi'/'bilinmiyor' → nötr); yoksa cihazdaki tercih
  if (q.has('c') && profil.c) temaYaz(profil.c === 'kiz' || profil.c === 'erkek' ? profil.c : 'notr');
  else { var kayitli = temaOku(); if (kayitli === 'kiz' || kayitli === 'erkek') profil.c = kayitli; }
  temaUygula();
  /* Tema seçici (Ek revize E1): Kids barında en sağda, Yardım ile sağ grup. ≤600px'te bardan gizli;
     aynı kontrolün ikinci kopyası Yardım panelinin altında (yardim.js DadaKids.temaSecici() ile ister). Kopyalar eşzamanlı. */
  function temaSecici(sinif) {
    var kutu = document.createElement('div'); kutu.className = 'kd-tema-sec ' + (sinif || ''); kutu.setAttribute('role', 'group'); kutu.setAttribute('aria-label', 'Tema rengi');
    [['notr', 'Nötr tema'], ['kiz', 'Pembe tema'], ['erkek', 'Mavi tema']].forEach(function (x) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.tema = x[0]; b.setAttribute('aria-label', x[1]); b.title = x[1];
      b.innerHTML = '<span aria-hidden="true"></span>'; kutu.appendChild(b);
    });
    var guncelle = function () { var t = (profil.c === 'kiz' || profil.c === 'erkek') ? profil.c : 'notr'; $$('button', kutu).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tema === t)); }); };
    kutu.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var t = b.dataset.tema; temaYaz(t);
      profilAyarla({ c: t === 'notr' ? 'belirtilmedi' : t });   // dinleyiciler tüm kopyaları günceller
    });
    dinleyiciler.push(guncelle); guncelle();
    return kutu;
  }
  function temaSeciciKur() {
    var wrap = $('.kd-ust .wrap'); if (!wrap || $('.kd-tema-sec--bar')) return;
    var y = $('.kd-yardim-ac', wrap);
    wrap.insertBefore(temaSecici('kd-tema-sec--bar'), y || null);
  }
  window.DadaKids = { profil: profil, EVRE: EVRE, kova: kova, profilAyarla: profilAyarla, dinle: function (fn) { dinleyiciler.push(fn); }, normal: normal, adresiGuncelle: adresiGuncelle, temaSecici: temaSecici };

  /* ---------- Kart girişi animasyonu ---------- */
  function girisKur() {
    var ogeler = $$('.kd-gir');
    if (!ogeler.length) return;
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { ogeler.forEach(function (o) { o.classList.add('kd-gorundu'); }); return; }
    var io = new IntersectionObserver(function (girisler) {
      girisler.forEach(function (g) { if (g.isIntersecting) { g.target.classList.add('kd-gorundu'); io.unobserve(g.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .05 });
    ogeler.forEach(function (o) { io.observe(o); });
    // güvenlik ağı: 2 sn sonra hâlâ görünmeyen ekrandakiler açılsın
    setTimeout(function () { ogeler.forEach(function (o) { var r = o.getBoundingClientRect(); if (r.top < innerHeight) o.classList.add('kd-gorundu'); }); }, 2000);
  }

  /* ---------- Yapışkan tek katman: Gastro header'ı + Kids barı ----------
     Üstte: Gastro header'ı ve bar görünür. Aşağı kaydırınca Gastro header'ı (ve masaüstü üst bandı) yalnız
     sınıf + transform ile yukarı gizlenir, bar top=0'a yapışır, mini kilit görünür. Yukarı kaydırınca geri gelir.
     Mega menü / çekmece açıkken ya da header içinde odak varken gizlenmez. Gastro DOM'una öğe eklenmez. */
  function yapiskanKur() {
    var kok = document.documentElement, bar = $('.kd-ust');
    var gastro = $$('header.header, .topbar, .ust-bant').filter(function (e, i, d) { return d.indexOf(e) === i; });
    var kidsSayfa = document.body.classList.contains('pg-kids') && bar;
    var alt = 0, bant = 0, gizli = false, sonY = Math.max(0, scrollY), birikim = 0, bekliyor = false;
    function olc() {                                   // layout alt kenarı: transform'dan bağımsız (top + yükseklik)
      alt = 0; bant = 0;
      gastro.forEach(function (el) {
        var cs = getComputedStyle(el); if (cs.display === 'none' || !el.offsetHeight) return;
        if (cs.position === 'fixed' || cs.position === 'sticky') {
          var a = (parseFloat(cs.top) || 0) + el.offsetHeight; alt = Math.max(alt, a);
          if (!el.matches('header.header')) bant = Math.max(bant, a);   // R3: üst siyah bant gizlenmez
        }
      });
      bant = Math.round(bant);
      alt = Math.round(alt); kok.style.setProperty('--kd-gastro-alt', alt + 'px'); uygula();
    }
    function uygula() { kok.style.setProperty('--kd-ust-bosluk', (gizli ? bant : alt) + 'px'); kok.classList.toggle('kd-ust-gizli', gizli); }
    function acikMi() { return !!document.querySelector('.has-mega:hover, .has-mega:focus-within, .drawer.open, header.header:focus-within, .topbar:focus-within'); }
    function ayarla(yeni) { if (yeni !== gizli) { gizli = yeni; birikim = 0; uygula(); } }
    function kaydir() {
      bekliyor = false;
      var y = Math.max(0, scrollY), dy = y - sonY; sonY = y;
      if (!kidsSayfa) return;
      if (y <= alt + 24 || acikMi()) { ayarla(false); return; }
      birikim = (dy > 0) === (birikim > 0) ? birikim + dy : dy;  // yön değişince sıfırdan say: titreme yok
      if (birikim > 10) ayarla(true); else if (birikim < -10) ayarla(false);
    }
    addEventListener('scroll', function () { if (!bekliyor) { bekliyor = true; requestAnimationFrame(kaydir); } }, { passive: true });
    addEventListener('resize', olc);
    gastro.forEach(function (el) { el.addEventListener('focusin', function () { ayarla(false); }); });
    olc(); setTimeout(olc, 400);
    if (kidsSayfa) kaydir();
  }

  /* Bar mobilde yatay kayar: aktif kalem görünür alana (sayfa kaydırılmadan) */
  function menuAktifKur() {
    var m = $('.kd-ust__menu'); if (!m) return;
    function tasma() {                                 // kenar solması yalnız o yönde kaydırılacak içerik varken
      var sag = m.scrollLeft + m.clientWidth < m.scrollWidth - 2, sol = m.scrollLeft > 2;
      m.classList.toggle('kd-tasma-sag', sag); m.classList.toggle('kd-tasma-sol', sol);
    }
    m.addEventListener('scroll', tasma, { passive: true }); addEventListener('resize', tasma);
    var lg = $('.kd-ust__logo'); if (lg) lg.addEventListener('transitionend', tasma);
    new MutationObserver(tasma).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    tasma();
    var a = $('[aria-current="page"]:not(.kd-ust__ev)', m); if (!a) return;
    function goster() {
      var mr = m.getBoundingClientRect(), ar = a.getBoundingClientRect();
      if (ar.left < mr.left + 8 || ar.right > mr.right - 8) m.scrollLeft += (ar.left + ar.width / 2) - (mr.left + mr.width / 2);
    }
    goster(); addEventListener('resize', goster);
    m.addEventListener('transitionend', goster);
    var bar = $('.kd-ust__logo'); if (bar) bar.addEventListener('transitionend', function (e) { if (e.propertyName === 'max-width') goster(); });
  }

  /* ---------- Filtre paneli (mobil alt sayfa) ---------- */
  function filtrePaneliKur() {
    $$('.kd-filtre-ac[aria-controls]').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls')); if (!panel) return;
      var perde = document.createElement('div'); perde.className = 'kd-perde'; document.body.appendChild(perde);
      function ac() { panel.classList.add('kd-acik'); perde.classList.add('kd-acik'); btn.setAttribute('aria-expanded', 'true'); var i = panel.querySelector('input, button'); if (i) i.focus(); }
      function kapat() { panel.classList.remove('kd-acik'); perde.classList.remove('kd-acik'); btn.setAttribute('aria-expanded', 'false'); }
      btn.addEventListener('click', ac); perde.addEventListener('click', kapat);
      $$('.kd-filtre__kapat', panel).forEach(function (k) { k.addEventListener('click', kapat); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') kapat(); });
    });
  }

  /* ---------- Kids Tarifleri: yaş şeridi + filtreler + arama + sıralama + boş durum ---------- */
  function katalogKur() {
    var iz = $('#kdTarifIzgara'); if (!iz) return;
    var kartlar = $$('.kd-tarif', iz), ilkSira = kartlar.slice();
    var form = $('#kdTarifFiltre'), ara = $('#kdTarifAra'), sirala = $('#kdSirala');
    var bas = q.get('yas');
    var d = { yas: KOVALAR.indexOf(+bas) > -1 ? +bas : (bas === 'tumu' ? 'tumu' : (kova() || 'tumu')), q: q.get('q') || '', kivam: [], icermez: [], ogun: [], sure: null };
    if (ara) ara.value = d.q;

    function aramaMetni(k) {               // başlık + olgular + kıvam + malzeme anahtarları (düğme metni hariç)
      if (k._kdAra === undefined) k._kdAra = normal($$('h3, .kd-tarif__olgu, .kd-tarif__meta, .kd-kivam', k).map(function (e) { return e.textContent; }).join(' ') + ' ' + (k.dataset.malzeme || ''));
      return k._kdAra;
    }
    function oku() {
      var f = function (n) { return $$('input[name="' + n + '"]:checked', form).map(function (i) { return i.value; }); };
      d.kivam = f('kivam'); d.icermez = f('icermez'); d.ogun = f('ogun');
      var s = $('input[name="sure"]:checked', form); d.sure = s && s.value ? +s.value : null;
    }
    function uyar(k, haric) {
      var ek = window.KdKatalogEk; if (ek && ek.filtre && !ek.filtre(k)) return false;   // kanca: kiler.js (Bebek Dolabı)
      if (haric !== 'yas' && d.yas !== 'tumu' && +k.dataset.yas > d.yas) return false;
      if (d.kivam.length && d.kivam.indexOf(k.dataset.kivam) < 0) return false;
      var al = k.dataset.alerjen ? k.dataset.alerjen.split(' ') : [];
      for (var i = 0; i < d.icermez.length; i++) {
        var x = d.icermez[i];
        if (al.indexOf(x) > -1) return false;
      }
      if (d.ogun.length) { var og = k.dataset.ogun.split(' '); if (!d.ogun.some(function (o) { return og.indexOf(o) > -1; })) return false; }
      if (d.sure && +k.dataset.sure > d.sure) return false;
      if (d.q) { var n = normal(d.q); if (normal(k.dataset.ad).indexOf(n) < 0 && aramaMetni(k).indexOf(n) < 0) return false; }
      return true;
    }
    function ciz() {
      var n = 0;
      kartlar.forEach(function (k) { var u = uyar(k); k.hidden = !u; if (u) { n++; k.classList.add('kd-gorundu'); } });
      var s = ilkSira.slice(), mod = sirala ? sirala.value : 'onerilen';
      if (mod === 'hizli') s.sort(function (a, b) { return a.dataset.sure - b.dataset.sure; });
      if (mod === 'yas') s.sort(function (a, b) { return (b.dataset.yas - a.dataset.yas) || (a.dataset.sira - b.dataset.sira); });
      if (mod === 'az') s.sort(function (a, b) { return a.dataset.ad.localeCompare(b.dataset.ad, 'tr'); });
      var ek2 = window.KdKatalogEk; if (ek2 && ek2.sira) s.sort(ek2.sira);               // kanca: kiler.js sıralaması
      s.forEach(function (k) { iz.appendChild(k); });
      $$('.kd-yas-chip').forEach(function (c) {
        var v = c.dataset.yas, sayi = kartlar.filter(function (k) { return uyar(k, 'yas') && (v === 'tumu' || +k.dataset.yas <= +v); }).length;
        var sm = c.querySelector('small'); if (sm) sm.textContent = sayi;
        c.setAttribute('aria-checked', String(String(d.yas) === v));
      });
      var sayac = $('#kdSonucSayi'); if (sayac) sayac.textContent = n + ' tarif' + (d.yas === 'tumu' ? '' : ' · ' + KOVA_AD[d.yas] + ' ve öncesi');
      var fs = d.kivam.length + d.icermez.length + d.ogun.length + (d.sure ? 1 : 0);
      $$('[data-kd-filtre-sayi]').forEach(function (b) { b.textContent = fs ? '(' + fs + ')' : ''; });
      bos(n);
      adresiGuncelle({ yas: d.yas === 'tumu' ? null : String(d.yas), q: d.q || null });
    }
    window.DadaKids.katalogYenile = function () { oku(); ciz(); };                      // kanca: kiler.js dışarıdan yeniden çizer
    function bos(n) {
      var b = $('#kdBos'); if (!b) return; b.hidden = n > 0; if (n > 0) return;
      var on = $('.kd-bos__oneriler', b); on.innerHTML = '';
      var ekle = function (m, fn) { var x = document.createElement('button'); x.type = 'button'; x.className = 'kd-chip kd-chip--dolu'; x.textContent = m; x.addEventListener('click', fn); on.appendChild(x); };
      if (d.q) ekle('"' + d.q + '" aramasını temizle', function () { d.q = ''; ara.value = ''; ciz(); });
      if (d.yas !== 'tumu') {
        var sonraki = KOVALAR.filter(function (x) { return x > d.yas; }).filter(function (x) { var e = d.yas; d.yas = x; var v = kartlar.some(function (k) { return uyar(k); }); d.yas = e; return v; })[0];
        if (sonraki) ekle(KOVA_AD[sonraki] + ' tariflerini de göster', function () { d.yas = sonraki; ciz(); });
      }
      $$('input:checked', form).forEach(function (i) { if (!i.value) return; ekle('"' + i.dataset.ad + '" filtresini kaldır', function () { i.checked = false; oku(); ciz(); }); });
    }
    $$('.kd-yas-chip').forEach(function (c) {
      c.addEventListener('click', function () { d.yas = c.dataset.yas === 'tumu' ? 'tumu' : +c.dataset.yas; ciz(); });
      c.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var cs = $$('.kd-yas-chip'), i = cs.indexOf(c), n = cs[(i + (e.key === 'ArrowRight' ? 1 : cs.length - 1)) % cs.length];
        n.focus(); n.click(); e.preventDefault();
      });
    });
    if (form) form.addEventListener('change', function () { oku(); ciz(); });
    if (ara) { var z; ara.addEventListener('input', function () { clearTimeout(z); z = setTimeout(function () { d.q = ara.value.trim(); ciz(); }, 120); }); }
    if (sirala) sirala.addEventListener('change', ciz);
    $$('[data-kd-temizle]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); $$('input', form).forEach(function (i) { i.checked = i.value === '' && i.name === 'sure'; }); d.yas = 'tumu'; d.q = ''; if (ara) ara.value = ''; oku(); ciz(); }); });
    oku(); ciz();
    var serit = $('#kdYasSerit'), sec = $('.kd-yas-chip[aria-checked="true"]');
    if (serit && sec) serit.scrollLeft = Math.max(0, sec.offsetLeft - serit.offsetLeft - 16);
  }

  /* ---------- Tarif detayı: ?t=<slug> ---------- */
  function detayKur() {
    var hepsi = $$('.kd-detay[data-slug]'); if (!hepsi.length) return;
    var slug = q.get('t'), hedef = hepsi.filter(function (a) { return a.dataset.slug === slug; })[0] || hepsi[0];
    hepsi.forEach(function (a) { a.hidden = a !== hedef; });
    if (hedef.dataset.baslik) document.title = hedef.dataset.baslik;
    var bulunamadi = $('#kdDetayYok'); if (bulunamadi) bulunamadi.hidden = !slug || hedef.dataset.slug === slug;
    $$('.kd-gir', hedef).forEach(function (o) { o.classList.add('kd-gorundu'); });
  }

  function videoKur() {
    var vs = $$('video.kd-video'); if (!vs.length) return;
    var mq = matchMedia('(prefers-reduced-motion: reduce)');
    var uygula = function () { vs.forEach(function (v) { if (mq.matches) { v.removeAttribute('autoplay'); v.pause(); try { v.currentTime = 0; } catch (e) {} } else { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); } }); };
    uygula(); if (mq.addEventListener) mq.addEventListener('change', uygula);
  }
  function kademeKur() {
    var gruplar = new Map();
    $$('.kd-gir').forEach(function (o) { if (o.style.getPropertyValue('--kd-gecikme')) return; var p = o.parentElement; var n = gruplar.get(p) || 0; gruplar.set(p, n + 1); o.style.setProperty('--kd-gecikme', Math.min(n, 6) * 60 + 'ms'); });
  }

  /* SSS — tek-açık akordeon (src/kids/sss.mjs): varsayılan hepsi kapalı; yenisi açılınca açık olan kapanır; #<soru-id> ile açılır */
  function sssKur() {
    var gruplar = document.querySelectorAll('[data-kd-sss]'); if (!gruplar.length) return;
    function ayarla(oge, acik) {
      var d = oge.querySelector('.kd-sss__dugme'); if (!d) return;
      d.setAttribute('aria-expanded', String(acik));
      if (acik) oge.setAttribute('data-acik', ''); else oge.removeAttribute('data-acik');
    }
    function ac(oge, kaydir) {
      var grup = oge.closest('[data-kd-sss]');
      grup.querySelectorAll('.kd-sss__oge[data-acik]').forEach(function (x) { if (x !== oge) ayarla(x, false); });
      ayarla(oge, true);
      if (kaydir) { try { oge.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } catch (e) { oge.scrollIntoView(); } }
    }
    gruplar.forEach(function (g) {
      g.querySelectorAll('.kd-sss__oge').forEach(function (o) { ayarla(o, false); });
      g.addEventListener('click', function (e) {
        var d = e.target.closest('.kd-sss__dugme'); if (!d || !g.contains(d)) return;
        var oge = d.closest('.kd-sss__oge');
        if (oge.hasAttribute('data-acik')) ayarla(oge, false); else ac(oge, false);
      });
    });
    function hashAc() {
      var h = decodeURIComponent((location.hash || '').slice(1)); if (!h) return;
      var el = document.getElementById(h); if (!el) return;
      var oge = el.closest('.kd-sss__oge'); if (oge) ac(oge, true);
    }
    hashAc(); window.addEventListener('hashchange', hashAc);
  }

  function basla() { temaSeciciKur(); sssKur(); videoKur(); kademeKur(); detayKur(); girisKur(); yapiskanKur(); menuAktifKur(); filtrePaneliKur(); katalogKur(); baglariGuncelle(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla); else basla();
})();
