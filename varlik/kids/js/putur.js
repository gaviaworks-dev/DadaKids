/* =====================================================================
   DADA KIDS — Pütür asistanı (sahibi: putur kolu, bağımlılıksız)
   · Sol altta sabit <button aria-label="Pütür'e sor">; küçült/gizle → localStorage 'dadakids.putur.v1' (try/catch)
   · Durum makinesi (data-durum): idle · arama · dusunme · gezinti · anlatma · tepki · surpriz
   · Dar ekranda sayfa kayınca kenara çekilir (kd-pt--kenar); mobil alt menünün üstünde durur
   · Tek tık: sevinç zıplaması (şeffaf video varsa video, yoksa SVG/CSS) → radyal menü (6 seçenek)
   · ~5 hızlı tık: Pütür pastel yıldız/kalp/parıltıya dönüşüp geri toplanır (bekleme süreli, menü açılmaz)
   · Cevaplar kural tabanlı, sitenin kendi verisinden (veri/*.json, çalışma anında fetch)
   · Tema (html[data-kd-tema]) + profil evresi (data-renk) Pütür'ün vurgu ve parıltı rengini boyar
   · prefers-reduced-motion: duruk poz, yalnız solma
   ===================================================================== */
(function () {
  'use strict';
  if (window.__kdPutur) return; window.__kdPutur = true;

  var ANAHTAR = 'dadakids.putur.v1';
  var DOGUM_ANAHTAR = 'dadakids.dogum.v1';             // tarih seçici ile aynı şema {y, m, mod}
  var SURPRIZ_TIK = 5, SURPRIZ_PENCERE = 1700, SURPRIZ_BEKLEME = 9000;
  var VIDEO = window.__kdPuturVideo === undefined ? { webm: 'varlik/kids/putur/zipla-{r}.webm', hevc: 'varlik/kids/putur/zipla-{r}-hevc.mp4' } : window.__kdPuturVideo;   // {r}: şerit rengi
  var azaltMq = matchMedia('(prefers-reduced-motion: reduce)');
  var azalt = function () { return azaltMq.matches; };

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

  /* ---------- SVG karakter (varlik/kids/maskot/kaynak/putur.mjs parçalarıyla birebir) ---------- */
  var INK = '#4A3A34', EYE = '#3A2E2A', CREAM = '#FFF8F0', PEACH = '#FFC4A3', RIM = '#FFE9D6', BERRY = '#E96D8F', BLUE = '#AFD3F5', PINK = '#F7B8CB';
  var GOVDE = 'M30 80H130C130 114 110 140 80 140S30 114 30 80Z';
  function karakterSvg() {
    var kol = function (yan, cx) { return '<g class="pt-kol pt-kol-' + yan + '"><g class="pt-kol-ic-' + yan + '"><ellipse cx="' + cx + '" cy="104" rx="8" ry="9.5" fill="' + CREAM + '"/></g></g>'; };
    var goz = function (yan, cx) { return '<g class="pt-goz-' + yan + '"><ellipse cx="' + cx + '" cy="98" rx="4" ry="5.2" fill="' + EYE + '"/><circle cx="' + (cx + 1.4) + '" cy="96" r="1.5" fill="#fff"/></g>'; };
    return '<svg class="kd-pt__svg" viewBox="0 0 160 160" aria-hidden="true" focusable="false">'
      + '<defs><clipPath id="kdpt-govde"><path d="' + GOVDE + '"/></clipPath></defs>'
      + '<g stroke="' + INK + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">'
      + '<g class="pt-hop"><g class="pt-ezil">'
      + '<ellipse class="pt-ayak-sol" cx="63" cy="142" rx="10" ry="6.5" fill="' + CREAM + '"/><ellipse class="pt-ayak-sag" cx="97" cy="142" rx="10" ry="6.5" fill="' + CREAM + '"/>'
      + '<g class="pt-nefes"><g class="pt-egim">'
      + '<path d="' + GOVDE + '" fill="' + CREAM + '"/>'
      + '<path class="pt-serit" clip-path="url(#kdpt-govde)" d="M20 110Q80 126 140 110" fill="none" stroke-width="5" opacity=".9" style="stroke:var(--pt-vurgu,' + PINK + ')"/>'
      + '<path d="M38 88Q40 104 50 116" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/>'
      + '<ellipse cx="80" cy="80" rx="52" ry="11" fill="' + RIM + '"/>'
      + '<g class="pt-tepe"><path d="M34 80C36 64 58 56 80 58S124 64 126 80" fill="' + PEACH + '"/>'
      + '<g class="pt-bukle"><path d="M74 60C70 46 86 38 94 46S90 60 84 55" fill="none" stroke="' + INK + '" stroke-width="15"/><path d="M74 60C70 46 86 38 94 46S90 60 84 55" fill="none" stroke="' + PEACH + '" stroke-width="6"/></g>'
      + '<ellipse cx="62" cy="68" rx="7" ry="3" fill="#fff" opacity=".6" stroke="none"/></g>'
      + '<path d="M28 80A52 11 0 0 0 132 80H124A44 4 0 0 1 36 80Z" fill="' + RIM + '" stroke-width="4"/>'
      + '<ellipse cx="54" cy="108" rx="7" ry="4" fill="' + PINK + '" stroke="none"/><ellipse cx="106" cy="108" rx="7" ry="4" fill="' + PINK + '" stroke="none"/>'
      + '<g class="pt-goz"><g class="pt-goz-ac" stroke="none">' + goz('sol', 66) + goz('sag', 94) + '</g>'
      + '<path class="pt-goz-mutlu" d="M61 100Q66 94 71 100M89 100Q94 94 99 100" fill="none" stroke="' + EYE + '" stroke-width="3"/></g>'
      + '<path class="pt-agiz-k" d="M75 107Q80 112 85 107" fill="none" stroke="' + EYE + '" stroke-width="3"/>'
      + '<path class="pt-agiz-a" d="M74 106Q80 116 86 106Z" fill="' + BERRY + '" stroke="' + EYE + '" stroke-width="2.6"/>'
      + kol('sol', 28)
      + '<g class="pt-buyutec"><g class="pt-tara"><rect x="121" y="104" width="10" height="34" rx="5" transform="rotate(-30 126 121)" fill="' + PINK + '"/><circle cx="118" cy="88" r="20" fill="' + BLUE + '" fill-opacity=".55"/><path d="M106 80Q110 74 116 73" fill="none" stroke="#fff" stroke-width="3.5"/></g></g>'
      + kol('sag', 132)
      + '</g></g>'
      + '</g></g>'
      + '<g class="pt-dusunce" stroke-width="2.6"><circle class="pt-d1" cx="122" cy="44" r="3.6" fill="#fff"/><circle class="pt-d2" cx="133" cy="31" r="4.6" fill="#fff"/><circle class="pt-d3" cx="146" cy="15" r="6" fill="#fff"/></g>'
      + '</g></svg>';
  }
  function miniSvg() {                                    // gizliyken sekmede küçük yüz
    return '<svg viewBox="26 36 108 90" aria-hidden="true" focusable="false"><g stroke="' + INK + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="' + GOVDE + '" fill="' + CREAM + '"/><path d="M34 80C36 64 58 56 80 58S124 64 126 80" fill="' + PEACH + '"/>'
      + '<path d="M74 60C70 46 86 38 94 46S90 60 84 55" fill="none" stroke-width="16"/><path d="M74 60C70 46 86 38 94 46S90 60 84 55" fill="none" stroke="' + PEACH + '" stroke-width="6"/>'
      + '<path d="M28 80A52 11 0 0 0 132 80H124A44 4 0 0 1 36 80Z" fill="' + RIM + '" stroke-width="4"/>'
      + '<ellipse cx="66" cy="99" rx="5" ry="6" fill="' + EYE + '" stroke="none"/><ellipse cx="94" cy="99" rx="5" ry="6" fill="' + EYE + '" stroke="none"/>'
      + '<path d="M74 108Q80 114 86 108" fill="none" stroke-width="4"/></g></svg>';
  }
  var IKON = {
    yas: 'takvim', besin: 'bicak-tahta', tarif: 'kase', alerjen: 'liste', hazir: 'mama-sandalyesi', acil: 'uyari'
  };
  var SECENEK = [
    ['yas', 'Kaç aylık?', 'mavi'],
    ['besin', 'Bu besin güvenli mi?', 'mint'],
    ['tarif', 'Bugün ne pişirsem?', 'seftali'],
    ['alerjen', 'Alerjen tanıtımı', 'pembe'],
    ['hazir', 'Ek gıdaya hazır mı?', 'sari'],
    ['acil', 'Acil durum', null]
  ];

  /* ---------- DOM ---------- */
  var kok, btn, kucult, sekme, yakala, menu, balon, balonIc, sahne, video, ogeler = [];
  var D = { durum: 'idle', menu: false, balon: false, gizli: false, mesgul: false, tiklar: [], sonSurpriz: -1e9, surprizSay: 0, ortamZaman: 0, kirpZaman: 0, tepkiZaman: 0, videoHazir: false, navPay: -1, kaldir: 0, guvenli: 0, poz: null, dar: false };

  function el(etiket, ozellik, ic) {
    var e = document.createElement(etiket);
    Object.keys(ozellik || {}).forEach(function (k) { if (k === 'class') e.className = ozellik[k]; else e.setAttribute(k, ozellik[k]); });
    if (ic != null) e.innerHTML = ic; return e;
  }

  function kur() {
    if (document.querySelector('.kd-pt')) return;
    kok = el('div', { class: 'kd-pt', 'data-durum': 'idle' });
    sahne = el('div', { class: 'kd-pt__sahne', 'aria-hidden': 'true' });
    btn = el('button', { type: 'button', class: 'kd-pt__btn', 'aria-label': "Pütür'e sor", 'aria-expanded': 'false', 'aria-controls': 'kdPtMenu' },
      '<span class="kd-pt__parilti"></span><span class="kd-pt__golge"></span><span class="kd-pt__karakter">' + karakterSvg() + '</span>');
    kucult = el('button', { type: 'button', class: 'kd-pt__kucult', 'aria-label': "Pütür'ü gizle", title: "Pütür'ü gizle" },
      '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>');
    menu = el('div', { class: 'kd-pt__menu', id: 'kdPtMenu', role: 'group', 'aria-label': 'Pütür seçenekleri', hidden: '' });
    SECENEK.forEach(function (s, i) {
      var oz = { type: 'button', class: 'kd-pt__oge', 'data-secenek': s[0], style: '--i:' + i };
      if (s[2]) oz['data-renk'] = s[2];
      var b = el('button', oz, '<span class="kd-pt__oge-ikon" aria-hidden="true"><img src="varlik/kids/svg/ui/' + IKON[s[0]] + '.svg" alt="" width="22" height="22"></span><span class="kd-pt__oge-ad">' + s[1] + '</span>');
      menu.appendChild(b); ogeler.push(b);
    });
    balon = el('section', { class: 'kd-pt__balon', id: 'kdPtBalon', 'aria-label': 'Pütür’ün cevabı', hidden: '' });
    balon.innerHTML = '<div class="kd-pt__balon-ust"><button type="button" class="kd-pt__geri" data-pt-geri><span aria-hidden="true">‹</span> Diğer sorular</button>'
      + '<button type="button" class="kd-pt__kapat" data-pt-kapat aria-label="Cevabı kapat"><svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>'
      + '<div class="kd-pt__balon-ic" aria-live="polite" aria-atomic="false"></div>'
      + '<p class="kd-pt__mentor">Dada Mentor bağlantısı canlıda gelecek</p>';
    balonIc = balon.querySelector('.kd-pt__balon-ic');
    sekme = el('button', { type: 'button', class: 'kd-pt-sekme', 'aria-label': "Pütür'ü göster", title: "Pütür'ü göster", hidden: '' }, miniSvg());

    yakala = el('div', { class: 'kd-pt-yakala', 'aria-hidden': 'true', hidden: '' });
    kok.appendChild(balon); kok.appendChild(menu); kok.appendChild(btn); kok.appendChild(kucult); kok.appendChild(sahne);
    document.body.appendChild(kok); document.body.appendChild(sekme); document.body.appendChild(yakala);

    var t = oku(ANAHTAR); if (t && t.gizli) gizle(true, true);
    renkGuncelle(); if (DK() && DK().dinle) DK().dinle(renkGuncelle);
    new MutationObserver(renkGuncelle).observe(document.documentElement, { attributes: true, attributeFilter: ['data-kd-tema'] });

    btn.addEventListener('click', tikla);
    yakala.addEventListener('click', tikla);
    btn.addEventListener('pointerenter', function () { if (D.durum === 'idle' && !D.mesgul && !D.menu) kok.classList.add('kd-pt--ilgi'); });
    btn.addEventListener('pointerleave', function () { kok.classList.remove('kd-pt--ilgi'); });
    btn.addEventListener('focus', yerlesimIste); btn.addEventListener('blur', yerlesimIste);
    kucult.addEventListener('click', function () { gizle(true); });
    sekme.addEventListener('click', function () { gizle(false); });
    menu.addEventListener('click', function (e) { var b = e.target.closest('[data-secenek]'); if (b) sec(b.getAttribute('data-secenek')); });
    menu.addEventListener('keydown', menuTus);
    balon.addEventListener('click', balonTik);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (D.balon) balonKapat(true); else if (D.menu) menuKapat(true);
    });
    document.addEventListener('pointerdown', function (e) {                   // dışarı tık: kapat
      if (!kok.contains(e.target)) { if (D.menu) menuKapat(false); if (D.balon) balonKapat(false); }
    });
    kok.addEventListener('focusout', function () {                            // Tab ile menüden çıkılınca kapan
      setTimeout(function () { if (D.menu && document.activeElement !== document.body && !kok.contains(document.activeElement)) menuKapat(false); }, 0);
    });
    addEventListener('resize', function () { olc(); yerlesimIste(); if (D.menu) konumla(); if (D.balon) balonSinirla(); });
    addEventListener('scroll', yerlesimIste, { passive: true });
    olc(); yerlesim(); setTimeout(function () { olc(); yerlesim(); }, 450);
    addEventListener('load', function () { olc(); yerlesim(); });
    if ('requestIdleCallback' in window) requestIdleCallback(videoHazirla, { timeout: 2500 }); else setTimeout(videoHazirla, 1200);
    kirpPlanla(); ortamPlanla(); ilkSelam();
  }

  /* ---------- Yerleşim: alt menü payı + kenara çekilme ---------- */
  var yerlesimBekliyor = false;
  function yerlesimIste() { if (yerlesimBekliyor) return; yerlesimBekliyor = true; requestAnimationFrame(function () { yerlesimBekliyor = false; yerlesim(); }); }
  function olc() {                                       // boyut değişince: alt menü payı, sol boşluk yeterli mi
    var nav = document.querySelector('.bottom-nav'), pay = 0;
    if (nav) { var cs = getComputedStyle(nav); if (cs.display !== 'none') pay = nav.offsetHeight + (parseFloat(cs.bottom) || 0); }
    if (pay !== D.navPay) { D.navPay = pay; kok.style.setProperty('--pt-nav', pay + 'px'); sekme.style.setProperty('--pt-nav', pay + 'px'); }
    var kolon = document.querySelector('.kd-sayfa .wrap'), sol = 0;
    if (kolon) { var r = kolon.getBoundingClientRect(); sol = r.left + (parseFloat(getComputedStyle(kolon).paddingLeft) || 0); }
    D.dar = btn.offsetWidth + kok.offsetLeft + 6 > sol;                         // sol boşluğa sığmıyorsa içerikle kesişir
  }
  function etkilesimMerkezleri() {                       // ekrandaki bağ/düğme ortaları (sayfa düzeninden ve ızgara sınıflarından bağımsız)
    var n = document.querySelectorAll('a[href], button, input:not([type=hidden]), select, summary, [role=button], [role=radio], [role=tab]'), out = [];
    for (var i = 0; i < n.length; i++) {
      var e = n[i]; if (kok.contains(e) || e === sekme) continue;
      var r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8) continue;
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
      var c = getComputedStyle(e); if (c.visibility === 'hidden' || c.display === 'none' || +c.opacity <= .05) continue;
      out.push({ x: x, y: y });
    }
    return out;
  }
  function bosMu(m, x0, y0, x1, y1) { for (var i = 0; i < m.length; i++) if (m[i].x >= x0 && m[i].x <= x1 && m[i].y >= y0 && m[i].y <= y1) return false; return true; }
  function altindaEtkilesim() {                          // tam boy Pütür bir bağın ya da düğmenin ortasını örter mi?
    var l = kok.offsetLeft, u = kok.offsetTop, boy = btn.offsetWidth;
    return !bosMu(etkilesimMerkezleri(), l - 2, u - 2, l + boy + 2, u + boy + 2);
  }
  /* Dar ekranda animasyon ve menü için konum: zıplamanın süpürdüğü alan bir bağın/düğmenin ortasına değmesin.
     Önce tam boy (gerekirse yukarı kayarak), olmazsa kenarda. Oranlar kareden ölçüldü: video tepesi boyun %36'sı yukarı çıkar. */
  function guvenliKonum() {
    var m = etkilesimMerkezleri(), boy = btn.offsetWidth, l = kok.offsetLeft, u = kok.offsetTop - D.kaldir;
    var H = boy * .36, pay = boy * .08, ust = ustSinir() + 8, kenarSag = boy * .6, enIyi = null;
    var dinlenme = kok.classList.contains('kd-pt--kenar') ? [0, kenarSag] : [l, l + boy];
    function dene(kenar, ek) {
      var x0 = kenar ? 0 : l - pay, x1 = kenar ? kenarSag : l + boy + pay;
      for (var dy = 0; dy <= boy * 3 && u - dy - H >= ust; dy += 6) {
        if (!bosMu(m, dinlenme[0], u - dy, dinlenme[1], u + boy)) return;      // yukarı kayarken yolda bir öğe var
        if (bosMu(m, x0, u - dy - H, x1, u - dy + boy)) { if (!enIyi || dy + ek < enIyi.c) enIyi = { kenar: kenar, dy: dy, c: dy + ek }; return; }
      }
    }
    dene(false, 0); dene(true, boy * 1.5);
    return enIyi || { kenar: true, dy: 0 };
  }
  function hedefKutu() {                                 // geçiş bitmeden, Pütür'ün varacağı kutu
    var boy = btn.offsetWidth, kenar = kok.classList.contains('kd-pt--kenar');
    var left = kenar ? -boy * .4 : kok.offsetLeft, top = kok.offsetTop - D.kaldir - D.guvenli;
    return { left: left, top: top, right: left + boy, bottom: top + boy, width: boy, height: boy };
  }
  /* Pütür güvenli konuma kayarken hızlı dokunuşlar boşa gitmesin: dinlenme yerini animasyon boyunca tutar */
  function yakalaGoster(r) {
    if (!D.dar) return;
    var sol = Math.max(0, r.left);
    yakala.style.cssText = 'left:' + sol + 'px;top:' + r.top + 'px;width:' + (r.right - sol) + 'px;height:' + r.height + 'px';
    yakala.hidden = false;
  }
  function yakalaGizle() { yakala.hidden = true; }
  function yerlesim() {
    if (D.gizli) return;
    var acik = D.menu || D.balon || D.mesgul || btn.matches(':focus-visible');
    if (acik && D.dar) { if (!D.poz) D.poz = guvenliKonum(); } else D.poz = null;  // açık kaldıkça konum sabit: menü kaymaz
    var kenar = D.dar && (D.poz ? D.poz.kenar : ((window.scrollY || 0) > 48 || altindaEtkilesim()));
    kok.classList.toggle('kd-pt--kenar', kenar);
    var guvenli = D.poz ? D.poz.dy : 0;
    if (guvenli !== D.guvenli) { D.guvenli = guvenli; kok.style.setProperty('--pt-guvenli', guvenli + 'px'); }
    if (D.poz) return;
    // footer perdesi açıldıysa yasal bağlara ve telif satırına binmez: üstüne çıkar
    var boy = btn.offsetWidth, ust = kok.offsetTop, alt = ust + boy, sag = kenar ? boy * .6 : kok.offsetLeft + boy, kaldir = 0;
    var ana = document.querySelector('.page-main'), anaAlt = ana ? ana.getBoundingClientRect().bottom : 0;
    if (anaAlt < alt) {
      var satir = [];
      Array.prototype.forEach.call(document.querySelectorAll('.foot-bottom > *, .foot-legal a'), function (e) {
        var z = document.createRange(); z.selectNodeContents(e);
        Array.prototype.forEach.call(z.getClientRects(), function (r) { if (r.width > 1 && r.top >= anaAlt - 1 && r.left < sag) satir.push(r); });
      });
      for (var tur = 0, degisti = true; degisti && tur < 8; tur++) {
        degisti = false;
        for (var i = 0; i < satir.length; i++) {
          var r = satir[i];
          if (r.top < alt - kaldir && r.bottom > ust - kaldir) { kaldir = alt - r.top + 8; degisti = true; }
        }
      }
    }
    if (kaldir !== D.kaldir) { D.kaldir = kaldir; kok.style.setProperty('--pt-kaldir', kaldir + 'px'); }
  }

  /* İlk açılışta bir kez el sallar (sekme başına) */
  function ilkSelam() {
    if (azalt() || D.gizli) return;
    try { if (sessionStorage.getItem('dadakids.putur.selam')) return; sessionStorage.setItem('dadakids.putur.selam', '1'); } catch (e) { return; }
    setTimeout(function () { if (D.durum === 'idle' && !D.mesgul && !D.menu && !D.balon) selamVer(); }, 900);
  }
  function selamVer() {
    kok.classList.add('kd-pt--selam');
    setTimeout(function () { kok.classList.remove('kd-pt--selam'); }, 1250);
  }

  /* ---------- Renk: tema + evre ---------- */
  function renkGuncelle() {
    var p = profil(), ev = p.evre && EVRE()[p.evre];
    if (ev && ev.renk) kok.setAttribute('data-renk', ev.renk); else kok.removeAttribute('data-renk');
    videoRengi();
  }

  /* ---------- Durum makinesi ---------- */
  var durumZaman = 0;
  function durum(d, sure) {
    clearTimeout(durumZaman);
    D.durum = d; kok.setAttribute('data-durum', d);
    if (sure) durumZaman = setTimeout(function () { if (D.durum === d) durum('idle'); }, sure);
  }
  function kirpPlanla() {
    clearTimeout(D.kirpZaman);
    D.kirpZaman = setTimeout(function () {
      if (!azalt() && !D.gizli && !document.hidden && (D.durum === 'idle' || D.durum === 'anlatma' || D.durum === 'gezinti')) {
        kok.classList.add('kd-pt--kirp'); setTimeout(function () { kok.classList.remove('kd-pt--kirp'); }, 170);
      }
      kirpPlanla();
    }, 2600 + Math.random() * 3400);
  }
  function ortamPlanla() {                                // ara sıra etrafa bakma / küçük gezinti / düşünme
    clearTimeout(D.ortamZaman);
    D.ortamZaman = setTimeout(function () {
      if (!azalt() && !D.gizli && !document.hidden && !D.mesgul && !D.menu && !D.balon && D.durum === 'idle' && !kok.classList.contains('kd-pt--ilgi')) {
        var r = Math.random();
        if (r < .42) durum('arama', 3200); else if (r < .8) durum('gezinti', 2600); else durum('dusunme', 2400);
      }
      ortamPlanla();
    }, 9000 + Math.random() * 8000);
  }

  /* ---------- Gizle / göster ---------- */
  function gizle(evet, ilk) {
    D.gizli = !!evet;
    if (evet) { menuKapat(false); balonKapat(false); }
    kok.classList.toggle('kd-pt--gizli', D.gizli);
    kok.hidden = D.gizli; sekme.hidden = !D.gizli;
    if (!ilk) {
      yaz(ANAHTAR, { gizli: D.gizli });
      (D.gizli ? sekme : btn).focus({ preventScroll: true });
      if (!D.gizli) { olc(); yerlesim(); if (!video) videoHazirla(); if (!azalt()) selamVer(); }
    }
  }

  /* ---------- Tık: tek tık tepkisi + hızlı tık sürprizi ---------- */
  function tikla(e) {
    var simdi = performance.now();
    D.tiklar = D.tiklar.filter(function (t) { return simdi - t < SURPRIZ_PENCERE; }); D.tiklar.push(simdi);
    if (D.durum === 'surpriz') return;                                          // sürpriz sürerken tıklar yok sayılır
    if (D.tiklar.length >= SURPRIZ_TIK && simdi - D.sonSurpriz > SURPRIZ_BEKLEME) { D.tiklar = []; surpriz(); return; }
    if (D.mesgul) return;                                                       // zıplama sürüyor: tık sayılır, başka şey olmaz
    if (D.menu) { menuKapat(true); return; }
    if (D.balon) balonKapat(false);
    if (e && e.detail === 0) { kok.classList.remove('kd-pt--ilgi'); yerlesim(); menuAc(); return; }   // klavye: bekletmeden aç
    tepki();
  }

  function tepki() {
    kok.classList.remove('kd-pt--ilgi');
    if (azalt()) { menuAc(); return; }
    yakalaGoster(btn.getBoundingClientRect());
    D.mesgul = true; yerlesim(); durum('tepki');
    var bitir = function () {
      clearTimeout(D.tepkiZaman); if (D.durum !== 'tepki') return;
      var fark = performance.now() - (D.tiklar[D.tiklar.length - 1] || 0);
      if (D.tiklar.length >= 2 && fark < 420) { D.tepkiZaman = setTimeout(bitir, 420 - fark); return; }   // hızlı tık sürüyorsa menü açılmaz
      videoKapat(); yakalaGizle();
      D.mesgul = false; durum('idle'); menuAc();
    };
    D.tepkiZaman = setTimeout(bitir, 1600);                                     // SVG/CSS zıplaması (putur.css: pt-zipla)
    if (!D.videoHazir || !video) return;
    try {
      video.currentTime = 0;
      video.onplaying = function () {
        if (D.durum !== 'tepki') { videoKapat(); return; }
        clearTimeout(D.tepkiZaman);
        kok.classList.add('kd-pt--video');
        video.onended = bitir;
        D.tepkiZaman = setTimeout(bitir, (video.duration || 2.2) * 1000 + 240);
      };
      var oyna = video.play();
      if (oyna && oyna.catch) oyna.catch(function () { videoKapat(); });
    } catch (e) { videoKapat(); }
  }
  function videoKapat() {
    kok.classList.remove('kd-pt--video');
    if (video) { video.onplaying = null; video.onended = null; try { video.pause(); video.currentTime = 0; } catch (e) { /* yok */ } }
  }

  /* ---------- Sürpriz: parıltıya dönüşüp geri gelme (~2,1 sn) ---------- */
  function renkler() {
    var cs = getComputedStyle(kok);
    var v = function (n, y) { var x = cs.getPropertyValue(n).trim(); return x || y; };
    return [v('--pt-vurgu', '#F7B8CB'), '#FFDF7E', v('--pt-ikinci', '#AFD3F5'), '#FFC4A3', v('--pt-vurgu', '#F7B8CB'), '#A6E3CB'];
  }
  var SEKIL = {
    yildiz: 'M12 2.6l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.6l-5.4 2.9 1-6.1L3.2 9.1l6.1-.9z',
    kalp: 'M12 20.4C6 16.6 3.2 13.4 3.2 9.9 3.2 7.4 5.1 5.6 7.5 5.6c1.9 0 3.4 1.1 4.5 2.7 1.1-1.6 2.6-2.7 4.5-2.7 2.4 0 4.3 1.8 4.3 4.3 0 3.5-2.8 6.7-8.8 10.5z',
    parilti: 'M12 2.5Q13.4 10.6 21.5 12Q13.4 13.4 12 21.5Q10.6 13.4 2.5 12Q10.6 10.6 12 2.5z',
    nokta: 'M12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10z'
  };
  function parca(sekil, renk, boy) {
    var s = el('span', { class: 'kd-pt__parca' }, '<svg viewBox="0 0 24 24" width="' + boy + '" height="' + boy + '" aria-hidden="true" focusable="false"><path d="' + SEKIL[sekil] + '" fill="' + renk + '" stroke="#4A3A34" stroke-opacity=".55" stroke-width="1.4" stroke-linejoin="round"/></svg>');
    sahne.appendChild(s); return s;
  }
  function surpriz() {
    clearTimeout(D.tepkiZaman); videoKapat();
    if (D.menu) menuKapat(false);
    if (D.balon) balonKapat(false);
    kok.classList.remove('kd-pt--ilgi', 'kd-pt--selam');
    if (yakala.hidden) yakalaGoster(btn.getBoundingClientRect());
    D.mesgul = true; D.sonSurpriz = performance.now(); D.surprizSay++;
    kok.setAttribute('data-surpriz', String(D.surprizSay));
    durum('surpriz'); yerlesim();
    var karakter = btn.querySelector('.kd-pt__karakter');
    var bitti = function () {
      sahne.innerHTML = ''; yakalaGizle();
      D.mesgul = false; durum('idle'); yerlesim();
      if (!azalt()) selamVer();
    };
    var R = renkler();
    if (azalt()) {                                                              // yalnız yumuşak solma + tek parıltı
      var tek = parca('parilti', R[1], 22); tek.style.left = '78%'; tek.style.top = '-6%';
      karakter.animate([{ opacity: 1 }, { opacity: .25 }, { opacity: 1 }], { duration: 1300, easing: 'ease-in-out' });
      tek.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 1300, easing: 'ease-in-out' });
      setTimeout(bitti, 1350); return;
    }
    // 1) hafif şişip yumuşakça "pıt" (0–360 ms); kenardaysa şişmez, yanındaki öğeye taşmaz
    var kenarda = kok.classList.contains('kd-pt--kenar');
    karakter.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: kenarda ? 'scale(1.02, .96)' : 'scale(1.08, .94)', opacity: 1, offset: .4 },
      { transform: kenarda ? 'scale(1.03)' : 'scale(1.14)', opacity: .9, offset: .7 },
      { transform: 'scale(.3)', opacity: 0 }
    ], { duration: 360, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    // 2) parçalar süzülür (280–1000), 3) geri toplanır (1000–1560); sol ve alt kenardan taşmaz
    var b = hedefKutu(), mx = b.width / 2, my = b.height * .55, merkezler = etkilesimMerkezleri();
    var sekiller = ['yildiz', 'kalp', 'parilti', 'nokta', 'yildiz', 'parilti', 'kalp', 'parilti', 'nokta', 'yildiz', 'kalp', 'parilti', 'nokta', 'parilti'];
    var yaricap = Math.max(84, b.width * 1.25), ox = b.left + mx, oy = b.top + my;
    function yolTemiz(dx, dy, boy) {                                            // parçanın yolu bir bağın/düğmenin ortasından geçmesin
      for (var t = .15; t <= 1.01; t += .085) {
        var pay = (boy * .8 + 4) * (.35 + .65 * Math.min(1, t / .5)), x = ox + dx * t, y = oy + (dy - 14) * t;
        if (!bosMu(merkezler, x - pay, y - pay, x + pay, y + pay)) return false;
      }
      return true;
    }
    function hedefSec(i, boy) {
      for (var d = 0; d < 28; d++) {
        var aci = (-105 + ((i + d * 5) % sekiller.length) / (sekiller.length - 1) * 130 + (Math.random() * 14 - 7)) * Math.PI / 180;
        var r = yaricap * (.55 + (((i + d) * 37) % 10) / 22) * (d > 14 ? .7 : 1);
        var dx = Math.cos(aci) * r, dy = Math.sin(aci) * r - 10;
        dx = Math.min(Math.max(dx, boy - ox), innerWidth - ox - boy);
        dy = Math.max(Math.min(dy, innerHeight - oy - boy), boy + 14 - oy);
        if (yolTemiz(dx, dy, boy)) return [dx, dy];
      }
      return null;                                                              // güvenli yol yoksa bu parça hiç çıkmaz
    }
    sekiller.forEach(function (sk, i) {
      var boy = sk === 'nokta' ? 9 + (i % 3) * 2 : 15 + (i * 7) % 9;
      var hedef = hedefSec(i, boy); if (!hedef) return;
      var p = parca(sk, R[i % R.length], boy), dx = hedef[0], dy = hedef[1];
      p.style.left = mx + 'px'; p.style.top = my + 'px';
      var don = (i % 2 ? 1 : -1) * (40 + (i * 23) % 70);
      p.animate([
        { transform: 'translate(-50%,-50%) translate(0,0) scale(.2) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%,-50%) translate(' + dx * .55 + 'px,' + dy * .55 + 'px) scale(1.05) rotate(' + don * .4 + 'deg)', opacity: 1, offset: .22 },
        { transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + (dy - 8) + 'px) scale(1) rotate(' + don + 'deg)', opacity: 1, offset: .5 },
        { transform: 'translate(-50%,-50%) translate(' + dx * .92 + 'px,' + (dy - 14) + 'px) scale(.92) rotate(' + don * 1.1 + 'deg)', opacity: 1, offset: .62 },
        { transform: 'translate(-50%,-50%) translate(' + dx * .22 + 'px,' + dy * .22 + 'px) scale(.62) rotate(' + don * 1.4 + 'deg)', opacity: .92, offset: .92 },
        { transform: 'translate(-50%,-50%) translate(0,0) scale(.2) rotate(' + don * 1.6 + 'deg)', opacity: 0 }
      ], { duration: 1240, delay: 280 + i * 12, fill: 'both' });
    });
    // 4) Pütür parçaların toplandığı anda geri gelir (1420–1900), ardından göz kırpıp el sallar
    setTimeout(function () {
      var don = karakter.animate([
        { transform: 'scale(.3)', opacity: 0 },
        { transform: kenarda ? 'scale(1.02, .97)' : 'scale(1.1, .92)', opacity: 1, offset: .55 },
        { transform: kenarda ? 'scale(.98, 1.02)' : 'scale(.96, 1.04)', opacity: 1, offset: .8 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 480, easing: 'cubic-bezier(.25,1,.5,1)', fill: 'forwards' });
      don.onfinish = function () { karakter.getAnimations().forEach(function (a) { a.cancel(); }); };
    }, 1420);
    setTimeout(bitti, 1960);
  }

  /* ---------- Video (tek tık tepkisi) ---------- */
  function vurguAdi() {                                  // videonun şerit rengi: evre > mavi tema > Pütür'ün pembesi
    var r = kok.getAttribute('data-renk'); if (r) return r;
    return document.documentElement.getAttribute('data-kd-tema') === 'erkek' ? 'mavi' : 'pembe';
  }
  function videoKaynagi() {
    var ua = navigator.userAgent || '', krom = /Chrome|Chromium|Edg\//.test(ua);
    var dene = document.createElement('video'), sablon = null;
    if (/Apple/.test(navigator.vendor || '') && VIDEO.hevc && dene.canPlayType('video/mp4; codecs="hvc1"')) sablon = VIDEO.hevc;
    else if (krom && VIDEO.webm && dene.canPlayType('video/webm; codecs="vp9"')) sablon = VIDEO.webm;     // diğerleri SVG/CSS zıplar
    return sablon && sablon.replace('{r}', vurguAdi());
  }
  function videoHazirla() {
    if (azalt() || !VIDEO || D.gizli) return;
    var src = videoKaynagi(); if (!src) return;
    var v = document.createElement('video');
    v.className = 'kd-pt__video'; v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true'); v.setAttribute('tabindex', '-1');
    v.disablePictureInPicture = true;
    v.addEventListener('canplaythrough', function () { D.videoHazir = true; kok.setAttribute('data-video', 'hazir'); kok.style.setProperty('--pt-video-sn', (v.duration || 2) + 's'); });
    v.addEventListener('error', function () { D.videoHazir = false; kok.setAttribute('data-video', 'yok'); if (v.parentNode) v.parentNode.removeChild(v); video = null; });
    v.src = src; D.videoAd = src;
    btn.querySelector('.kd-pt__karakter').appendChild(v); video = v;
    try { v.load(); } catch (e) { /* yok */ }
  }
  function videoRengi() {                                // tema/evre değişince aynı hareketin o renkteki kopyası yüklenir
    if (!video || D.durum === 'tepki') return;
    var src = videoKaynagi(); if (!src || src === D.videoAd) return;
    D.videoHazir = false; D.videoAd = src; kok.removeAttribute('data-video'); video.src = src;
    try { video.load(); } catch (e) { /* yok */ }
  }

  /* ---------- Menü ---------- */
  function ustSinir() {                                   // yapışkan üst menülerin altı
    var alt = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kd-ust-bosluk')) || 0;
    var ust = document.querySelector('.kd-ust'); if (ust) { var r = ust.getBoundingClientRect(); if (r.height && r.top < 240) alt = Math.max(alt, r.bottom); }
    return alt;
  }
  function konumla() {                                   // dörtte bir yay: Pütür'ün üstünden sağına; sığmazsa iki sütun
    var hb = hedefKutu(), s = hb.width || 72, n = ogeler.length;
    var dar = innerWidth <= 640, h = dar ? 42 : 44;
    kok.style.setProperty('--pt-oge', h + 'px');
    var cx = s / 2, cy = s / 2, ikon = 22;                                      // ikon merkezi yay üstünde
    var sinir = hb.top + cy - ustSinir() - h / 2 - 8;                           // merkezden yukarı kullanılabilir yükseklik
    var ara = Math.min(dar ? 47 : 52, sinir / (n - 1));
    var iki = ara < h + 2;
    var i, x, y;
    if (iki) {                                                                  // kısa pencere: sağda 2 sütun × 3 satır
      var sag = s + 10, sutun = 0;
      ogeler.forEach(function (b) { sutun = Math.max(sutun, b.offsetWidth); });
      ogeler.forEach(function (b, k) {
        x = sag + (k % 2) * (sutun + 8); y = s - h - (2 - Math.floor(k / 2)) * (h + 6);
        b.style.setProperty('--x', x.toFixed(1) + 'px'); b.style.setProperty('--y', y.toFixed(1) + 'px');
      });
    } else {
      var a = s / 2 + (dar ? 32 : 40), bb = ara * (n - 1);
      for (i = 0; i < n; i++) {
        var t = i / (n - 1), b = ogeler[i];
        x = cx + a * Math.sqrt(Math.max(0, t * (2 - t))) - ikon;
        y = cy - bb * (1 - t) - h / 2;
        var tasma = hb.left + x + b.offsetWidth + 8 - innerWidth;
        if (tasma > 0) x -= tasma;
        x = Math.max(x, 6 - hb.left);                                           // Pütür kenardayken yay ekranda kalır
        b.style.setProperty('--x', x.toFixed(1) + 'px'); b.style.setProperty('--y', y.toFixed(1) + 'px');
      }
    }
    ogeler.forEach(function (b) { b.style.setProperty('--ox', (cx - ikon).toFixed(1) + 'px'); b.style.setProperty('--oy', (cy - h / 2).toFixed(1) + 'px'); });
  }
  function menuAc() {
    if (D.gizli || D.menu) return;
    D.menu = true; yerlesim(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('kd-pt-acik');
    konumla();
    kok.classList.add('kd-pt--menu');
    requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('kd-acik'); }); });
    ogeler[0].focus({ preventScroll: true });
  }
  function menuKapat(odakDon) {
    if (!D.menu) return;
    D.menu = false; btn.setAttribute('aria-expanded', 'false'); kok.classList.remove('kd-pt--menu');
    menu.classList.remove('kd-acik');
    setTimeout(function () { if (!D.menu) menu.hidden = true; }, azalt() ? 180 : 320);
    if (odakDon) btn.focus({ preventScroll: true });
    if (!D.balon) document.documentElement.classList.remove('kd-pt-acik');
    yerlesimIste();
  }
  function menuTus(e) {
    var i = ogeler.indexOf(document.activeElement); if (i < 0) return;
    var n = ogeler.length, j = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % n;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = n - 1;
    if (j !== null) { e.preventDefault(); ogeler[j].focus(); }
  }

  /* ---------- Balon (cevap) ---------- */
  var sonSecenek = null;
  function balonSinirla() {
    var hb = hedefKutu(), dar = innerWidth <= 640;
    var alan = (dar ? hb.top - 12 : hb.bottom - 2) - ustSinir() - 8;
    kok.style.setProperty('--pt-balon-max', Math.max(180, Math.round(alan)) + 'px');
    kok.style.setProperty('--pt-balon-sol', Math.max(0, kok.offsetLeft - hb.left) + 'px');
  }
  function sec(kod) {
    sonSecenek = kod;
    D.balon = true;
    menuKapat(false);
    menu.hidden = true;
    document.documentElement.classList.add('kd-pt-acik');
    balon.hidden = false; kok.classList.add('kd-pt--balon');
    balonSinirla();
    balon.setAttribute('data-secenek', kod);
    var acil = kod === 'acil';                                                  // acil cevap bekletilmez
    if (!acil) { balonIc.innerHTML = '<p class="kd-pt__yaziyor"><span></span><span></span><span></span><span class="kd-gizli-pt">Pütür düşünüyor…</span></p>'; durum('dusunme'); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { balon.classList.add('kd-acik'); }); });
    var bekle = azalt() || acil ? 0 : 520;
    Promise.resolve().then(CEVAP[kod]).catch(function () { return '<p>Şu an bu bilgiye ulaşamadım. Sayfayı yenileyip yeniden deneyin.</p>'; })
      .then(function (html) {
        setTimeout(function () {
          if (!D.balon || sonSecenek !== kod) return;
          var kap = el('div', null, html);                                      // her cevap yeni kap: dinleyiciler birikmez
          balonIc.innerHTML = ''; balonIc.appendChild(kap); balonIc.scrollTop = 0;
          durum('anlatma', 2600);
          var bas = kap.querySelector('.kd-pt__baslik'); if (bas) { bas.setAttribute('tabindex', '-1'); bas.focus({ preventScroll: true }); }
          var kurucu = KURULUM[kod]; if (kurucu) kurucu(kap);
        }, bekle);
      });
  }
  function balonKapat(odakDon) {
    if (!D.balon) return;
    D.balon = false; kok.classList.remove('kd-pt--balon'); balon.classList.remove('kd-acik');
    setTimeout(function () { if (!D.balon) { balon.hidden = true; balonIc.innerHTML = ''; } }, azalt() ? 180 : 240);
    if (D.durum === 'anlatma' || D.durum === 'dusunme' || D.durum === 'arama') durum('idle');
    if (odakDon) btn.focus({ preventScroll: true });
    if (!D.menu) document.documentElement.classList.remove('kd-pt-acik');
    yerlesimIste();
  }
  function balonTik(e) {
    if (e.target.closest('[data-pt-kapat]')) { balonKapat(true); return; }
    if (e.target.closest('[data-pt-geri]')) { balonKapat(false); menuAc(); return; }
  }

  /* ---------- Cevaplar (kural tabanlı, site verisi) ---------- */
  var ORNEK = '<p class="kd-pt__ornek">Örnek içerik — uzman onayı bekliyor</p>';
  function baslik(m) { return '<h2 class="kd-pt__baslik">' + m + '</h2>'; }
  function dugme(href, metin, ikincil) { return '<a class="kd-pt__dugme' + (ikincil ? ' kd-pt__dugme--ikincil' : '') + '" href="' + esc(href) + '">' + metin + '</a>'; }
  function evreAdi(kod) { var e = EVRE()[kod]; return e ? e.ad : kod; }
  function mevsim(m) { return m === 12 || m <= 2 ? 'kis' : m <= 5 ? 'ilkbahar' : m <= 8 ? 'yaz' : 'sonbahar'; }

  var CEVAP = {
    yas: function () {
      var y = new Date().getFullYear();
      var yillar = [y, y - 1, y - 2, y - 3];
      return baslik('Bebeğiniz kaç aylık?')
        + '<p>Doğum yılını ve ayını seçin, evresini bulayım.</p>'
        + '<div class="kd-pt__chipler" role="radiogroup" aria-label="Doğum yılı" data-pt-yil>'
        + yillar.map(function (x) { return '<button type="button" class="kd-pt__chip" role="radio" aria-checked="false" data-yil="' + x + '">' + x + '</button>'; }).join('')
        + '</div>'
        + '<div class="kd-pt__chipler kd-pt__chipler--ay" role="radiogroup" aria-label="Doğum ayı" data-pt-ay>'
        + AYLAR.map(function (a, i) { return '<button type="button" class="kd-pt__chip" role="radio" aria-checked="false" data-ay="' + (i + 1) + '" data-mevsim="' + mevsim(i + 1) + '" aria-label="' + AYLAR_UZUN[i] + '">' + a + '</button>'; }).join('')
        + '</div>'
        + '<div class="kd-pt__sonuc" data-pt-sonuc aria-live="polite"></div>'
        + '<p class="kd-pt__kucuk"><button type="button" class="kd-pt__bag" data-pt-hamile>Hamileyim</button> · Bilgi yalnız bu tarayıcıda kalır.</p>';
    },
    besin: function () {
      veri('besinler'); veri('kesim');                                          // ön yükleme
      var as = asamaAnahtari();
      return baslik('Bu besin güvenli mi?')
        + '<label class="kd-pt__etiket" for="kdPtAra">Besin adı yazın</label>'
        + '<div class="kd-pt__ara"><input id="kdPtAra" type="search" autocomplete="off" placeholder="ör. üzüm, yumurta, bal" enterkeyhint="search"></div>'
        + '<div class="kd-pt__sonuclar" data-pt-besin aria-live="polite"></div>'
        + (as ? '<p class="kd-pt__kucuk">Sonuçlar ' + esc(as === '12+' ? '12 ay ve üzeri' : as + ' ay') + ' için hazırlığı da gösterir.</p>' : '<p class="kd-pt__kucuk">Yaşı “Kaç aylık?” ile seçerseniz yaşa uygun hazırlığı da gösteririm.</p>');
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
          + '<ul class="kd-pt__tarifler">' + uc.map(function (t) {
            return '<li><a href="' + esc(bag('kids-tarif.html?t=' + t.slug)) + '"><img src="' + esc(t.gorsel) + '" alt="" width="52" height="52" loading="lazy" decoding="async"><span><b>' + esc(t.ad) + '</b><small>+' + t.yas + ' Ay · ' + t.sureDk + ' dk</small></span></a></li>';
          }).join('') + '</ul>'
          + dugme(bag('kids-tarifler.html' + (kv !== null ? '?yas=' + kv : '')), 'Tüm Kids tarifleri', true);
      });
    },
    alerjen: function () {
      return baslik('Alerjen tanıtımı')
        + '<p>Yeni bir alerjeni tanıştırırken üç gün boyunca gözlemlerinizi kısa notlarla kaydedin.</p>'
        + '<p class="kd-pt__kucuk">3 günlük gözlem yaygın bir uygulama, kesin tıbbi kural değil. Gözlem süresi alerjenlerin tanıştırılmasını geciktirmemeli.</p>'
        + '<div class="kd-pt__satir">' + dugme(bag('kids-arac-alerjen-takip.html'), '3 günlük gözlem') + dugme(bag('kids-rehber-alerjen-tanitimi.html'), 'Alerjen rehberi', true) + '</div>' + ORNEK;
    },
    hazir: function () {
      return veri('evreler').then(function (v) {
        var e = (v.evreler || []).filter(function (x) { return x.kod === '0-6-ay'; })[0] || {};
        var isaretler = (e.kivamDikkat || []).filter(function (m) { return /^Hazır olma işareti \d/.test(m); }).map(function (m) { return m.replace(/^Hazır olma işareti \d:\s*/, ''); });
        var ay = cocukAyi();
        return baslik('Ek gıdaya hazır mı?')
          + (isaretler.length ? '<ul class="kd-pt__liste">' + isaretler.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' : '')
          + (ay !== null && ay < 6 ? '<p class="kd-pt__kucuk">Genel öneri, ek gıdaya 6. ay civarında başlamaktır.</p>' : '')
          + '<p>Beş işaretin tamamını kontrol listesinde tek tek işaretleyin.</p>'
          + dugme(bag('kids-arac-hazir-mi.html'), 'Kontrol listesini aç') + ORNEK;
      });
    },
    acil: function () {
      return '<div class="kd-pt__acil">' + baslik('Acil durum')
        + '<p class="kd-pt__acil-metin"><b>Boğulma şüphesinde hemen 112\'yi arayın.</b></p>'
        + '<a class="kd-pt__dugme kd-pt__dugme--acil" href="tel:112">112\'yi ara</a>'
        + '<p class="kd-pt__kucuk">İlk yardımı önceden, uygulamalı bir kursta öğrenin: <a href="https://www.kizilay.org.tr/" target="_blank" rel="noopener">Türk Kızılay ilk yardım eğitimleri</a></p>' + ORNEK + '</div>';
    }
  };

  var KURULUM = {
    yas: function (ic) {
      var secim = { y: null, m: null };
      var kayit = oku(DOGUM_ANAHTAR);
      if (kayit && kayit.mod !== 'gebelik' && kayit.y && kayit.m) { secim.y = +kayit.y; secim.m = +kayit.m; }
      else { var p = profil(); if (p.ay !== null && p.ay !== undefined) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - p.ay); secim.y = d.getFullYear(); secim.m = d.getMonth() + 1; } }
      var yilKap = ic.querySelector('[data-pt-yil]'), ayKap = ic.querySelector('[data-pt-ay]'), sonuc = ic.querySelector('[data-pt-sonuc]');
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
          sonuc.innerHTML = '<p><b>3 yaşını geçmiş.</b> Dada Kids 3 yaşa kadar eşlik ediyor; aile tarifleri Dada Gastro\'da.</p>' + dugme('tarifler.html', 'Dada Gastro tarifleri', true);
          return;
        }
        var ev = evreAydan(ay), e = EVRE()[ev] || {};
        sonuc.setAttribute('data-renk', e.renk || '');
        sonuc.innerHTML = '<p>Yaklaşık <b>' + ay + ' aylık</b> → <b>' + esc(e.ad || ev) + '</b> evresi.</p>'
          + (ay < 6 ? '<p class="kd-pt__kucuk">Ek gıda yaklaşık 6. ayda, hazır olma işaretleriyle başlar.</p>' : '')
          + '<div class="kd-pt__satir">' + dugme(bagEvre(ev, ay), esc(e.ad || ev) + ' sayfası').replace('<a ', '<a data-pt-evre ') + '<button type="button" class="kd-pt__dugme kd-pt__dugme--ikincil" data-pt-uygula>Bu yaşı kullan</button></div>';
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
        if (e.target.closest('[data-pt-evre]')) yaz(DOGUM_ANAHTAR, { y: secim.y, m: secim.m, mod: 'dogum' });
        if (e.target.closest('[data-pt-uygula]')) {
          var b = new Date(), ay = (b.getFullYear() - secim.y) * 12 + (b.getMonth() + 1 - secim.m);
          yaz(DOGUM_ANAHTAR, { y: secim.y, m: secim.m, mod: 'dogum' });
          if (DK() && DK().profilAyarla) DK().profilAyarla({ evre: evreAydan(ay), ay: ay });
          renkGuncelle();
          e.target.closest('[data-pt-uygula]').outerHTML = '<span class="kd-pt__onay" role="status">Kaydedildi ✓ Tarifler ve öneriler bu yaşa göre.</span>';
        }
        if (e.target.closest('[data-pt-hamile]')) {
          sonuc.setAttribute('data-renk', 'pembe');
          sonuc.innerHTML = '<p>Hamilelik ve emzirme dönemi için beslenme önerileri hazır.</p>' + dugme(bag('kids-donem-hamilelik.html'), 'Hamilelik sayfası');
        }
      });
      isaretle();
    },
    besin: function (ic) {
      var giris = ic.querySelector('#kdPtAra'), kutu = ic.querySelector('[data-pt-besin]'), zaman = 0, sira = 0;
      giris.focus({ preventScroll: true });
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
        if (q.length < 2) { kutu.innerHTML = ''; if (D.durum === 'arama') durum('anlatma', 600); return; }
        durum('arama');
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
          if (!sonuc.length) { kutu.innerHTML = '<p>“' + esc(ham) + '” için kayıt bulamadım. Başka bir adla deneyin ya da <a class="kd-pt__bag" href="' + esc(bag('kids-guvenli-kesim.html')) + '">Güvenli Kesim</a> sayfasına bakın.</p>'; durum('dusunme', 1400); return; }
          kutu.innerHTML = sonuc.map(function (x) {
            var b = x.b, k = b.kesimSlug && kesimSlug[b.kesimSlug], tur = hamile ? (b.durum === 'evet' ? 'uygun' : b.durum === 'henuz' ? 'henuz' : 'dikkat') : degerlendir(b, ay);
            var etiket = hamile && tur === 'henuz' ? 'Kaçınılır' : ETIKET[tur];
            var metin = hamile ? (b.hamilelik ? b.gerekce : (b.hamilelikNotu || '')) : b.gerekce;
            var not = '';
            if (!hamile && tur === 'henuz' && b.minAy) not = '<p class="kd-pt__kucuk">En erken ' + yasYazi(b.minAy) + '.</p>';
            else if (!hamile && ay === null && b.minAy && b.minAy > 6) not = '<p class="kd-pt__kucuk">En erken ' + yasYazi(b.minAy) + '.</p>';
            var nasil = hamile || tur === 'henuz' ? '' : (k && as && k.asamalar && k.asamalar[as] ? k.asamalar[as].nasil : sunum(b, ay));
            var hazir = nasil ? '<p class="kd-pt__hazirlik"><b>' + esc(as ? (as === '12+' ? '12 ay +' : as + ' ay') : 'Hazırlık') + ':</b> ' + esc(nasil) + '</p>' : '';
            var git = k && !hamile ? '<a class="kd-pt__bag" href="' + esc(bag('kids-guvenli-kesim.html#' + k.slug)) + '">Güvenli Kesim kartı: ' + esc(k.ad) + ' →</a>' : '';
            return '<article class="kd-pt__besin" data-durum="' + tur + '"><div class="kd-pt__besin-ust"><b>' + esc(b.ad) + '</b><span class="kd-pt__rozet">' + etiket + '</span></div>'
              + (metin ? '<p>' + esc(metin) + '</p>' : '') + not + hazir + git + '</article>';
          }).join('') + ORNEK;
          durum('anlatma', 1800);
        }).catch(function () { kutu.innerHTML = '<p>Veriye ulaşamadım; biraz sonra yeniden deneyin.</p>'; });
      }
      giris.addEventListener('input', function () { clearTimeout(zaman); zaman = setTimeout(ara, 220); });
      giris.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(zaman); ara(); } });
    }
  };

  /* ---------- Başlat ---------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur); else kur();
  document.addEventListener('visibilitychange', function () { if (document.hidden && D.durum !== 'tepki' && D.durum !== 'surpriz') durum('idle'); });
})();
