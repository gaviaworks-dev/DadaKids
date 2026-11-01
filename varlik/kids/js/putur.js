/* =====================================================================
   DADA GASTRO KIDS — Pütür asistanı (sahibi: v2-putur, bağımlılıksız; V2'de Beyar kararıyla kalan tek karakter)
   · Sol altta sabit <button aria-label="Pütür'e sor">; küçült/gizle → localStorage 'dadakids.putur.v1' (try/catch)
   · Durum makinesi (data-durum): idle · okuma · gezinti · arama · hover · dusunme · anlatma · tepki · surpriz
     Öncelik: surpriz > tepki > menü/balon (anlatma, dusunme) > arama > okuma > gezinti > idle; taban(): dönülecek durum
     Bağlam: scroll yönüne bakış (data-bakis), rehber makalesinde okuma, arama kutusu/filtre, hareketsizlikte gezinti
     Masaüstü: imleçle menü (200 ms aç, 400 ms kapat), tık sabitler. Klavye: odakla / Enter / Space bekletmeden açılır. Dokunmatik: dokunuş.
     Sekme görünmezken animasyon ve zamanlayıcılar durur
   · Dar ekranda sayfa kayınca kenara çekilir (kd-pt--kenar); mobil alt menünün üstünde durur
   · Tek tık: ikinci tık gelmezse 250 ms sonra radyal menü (6 seçenek) açılır, Pütür aynı anda sevinçle zıplar
     (şeffaf video varsa video, yoksa SVG/CSS)
   · Çift tık / çift dokunuş (iki tık arası ≤ 400 ms): Pütür pastel yıldız/kalp/parıltıya dönüşüp geri toplanır, el sallar
     (~2 sn, menü açılmaz). Sürpriz sonrası 9 sn içinde çift tık yeniden sürpriz başlatmaz; tek tık gibi menüyü açar
   · Cevaplar kural tabanlı, sitenin kendi verisinden (veri/*.json, çalışma anında fetch)
   · Tema (html[data-kd-tema]) + profil evresi (data-renk) Pütür'ün vurgu ve parıltı rengini boyar
   · prefers-reduced-motion: duruk poz, yalnız solma
   ===================================================================== */
(function () {
  'use strict';
  if (window.__kdPutur) return; window.__kdPutur = true;

  var ANAHTAR = 'dadakids.putur.v1';
  var DOGUM_ANAHTAR = 'dadakids.dogum.v1';             // tarih seçici ile aynı şema {y, m, mod}
  var CIFT_PENCERE = 400, TEK_BEKLE = 250, SURPRIZ_BEKLEME = 9000;   // çift tık aralığı · tek tık kararı · sürpriz sonrası bekleme (ms)
  var VIDEO = window.__kdPuturVideo === undefined ? { webm: 'varlik/kids/putur/zipla-{r}.webm', hevc: 'varlik/kids/putur/zipla-{r}-hevc.mp4' } : window.__kdPuturVideo;   // {r}: şerit rengi
  var azaltMq = matchMedia('(prefers-reduced-motion: reduce)');
  var hoverMq = matchMedia('(hover: hover) and (pointer: fine)');
  var MERHABA = 'dadakids.putur.merhaba.v1';
  var MAKALE = /kids-rehber-[^\/]+\.html/.test(location.pathname);    // rehber makalesi: sayfa türü adresten okunur
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
  var INK = '#4A3A34', EYE = '#3A2E2A', CREAM = '#FFF8F0', PEACH = '#FFC4A3', RIM = '#FFE9D6', BERRY = '#E96D8F', BLUE = '#AFD3F5', PINK = '#F7B8CB', MINT = '#A6E3CB';
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
      + '<g class="pt-kitap"><g transform="translate(0 2)"><path d="M80 120C66 112 50 112 38 116V142C50 138 66 138 80 146Z" fill="' + MINT + '"/><path d="M80 120C94 112 110 112 122 116V142C110 138 94 138 80 146Z" fill="' + MINT + '"/><path d="M80 124C68 118 54 118 44 121V138C54 135 68 135 80 141ZM80 124C92 118 106 118 116 121V138C106 135 92 135 80 141Z" fill="' + CREAM + '" stroke-width="2.6"/><path d="M80 124V141" stroke-width="2.6"/><path d="M52 126Q60 124 70 127M90 127Q100 124 108 126" fill="none" stroke="' + PINK + '" stroke-width="3"/></g></g>'
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
  var kok, btn, kucult, sekme, yakala, kopru, menu, balon, balonIc, sahne, video, ogeler = [];
  var D = { durum: 'idle', menu: false, balon: false, gizli: false, mesgul: false, ilkTik: -1e9, tekZaman: 0, sonSurpriz: -1e9, surprizSay: 0, ortamZaman: 0, kirpZaman: 0, tepkiZaman: 0, videoHazir: false, navPay: -1, kaldir: 0, guvenli: 0, poz: null, dar: false, sabit: false, odakAcik: false, odakSus: false, hoverZaman: 0, kapanZaman: 0, hareket: 0, sonGezinti: -1e9, sonEl: 0, okuyor: false, okumaBas: 0, sonY: 0, sonT: 0, bakisZaman: 0, aramaOdak: false, durdu: false, surprizBitir: null, tepkiBitir: null };

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
      '<span class="kd-pt__zemin"></span><span class="kd-pt__parilti"></span><span class="kd-pt__golge"></span><span class="kd-pt__karakter">' + karakterSvg() + '</span>');
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
    kopru = el('div', { class: 'kd-pt__kopru', 'aria-hidden': 'true' });
    kok.appendChild(kopru); kok.appendChild(btn); kok.appendChild(menu); kok.appendChild(kucult); kok.appendChild(balon); kok.appendChild(sahne);   // Tab sırası: düğme → menü
    document.body.appendChild(kok); document.body.appendChild(sekme); document.body.appendChild(yakala);

    var t = oku(ANAHTAR); if (t && t.gizli) gizle(true, true);
    renkGuncelle(); if (DK() && DK().dinle) DK().dinle(renkGuncelle);
    new MutationObserver(renkGuncelle).observe(document.documentElement, { attributes: true, attributeFilter: ['data-kd-tema'] });

    btn.addEventListener('click', tikla);
    yakala.addEventListener('click', tikla);
    btn.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && D.durum === 'idle' && !D.mesgul && !D.menu) kok.classList.add('kd-pt--ilgi'); });
    btn.addEventListener('pointerleave', function () { kok.classList.remove('kd-pt--ilgi'); });
    btn.addEventListener('focus', function () {                                 // klavye odağı menüyü açar, odak düğmede kalır
      yerlesimIste();
      if (D.odakSus || !btn.matches(':focus-visible') || D.menu || D.balon || D.mesgul || D.gizli) return;
      D.sabit = true; D.odakAcik = true; menuAc(false);
    });
    btn.addEventListener('blur', yerlesimIste);
    addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') D.imlec = performance.now(); }, { passive: true });
    kok.addEventListener('pointerenter', function (e) {                         // imleç: 200 ms sonra menü
      if (e.pointerType !== 'mouse' || !hoverMq.matches) return;
      clearTimeout(D.kapanZaman);
      // Pütür'ün kendisi imlecin altına kaydıysa (zıplama, sürpriz, kenardan çıkma) menü açılmaz: imleç gerçekten hareket etmeli
      if (!D.menu && !D.mesgul && !D.balon && performance.now() - (D.imlec || 0) < 120) D.hoverZaman = setTimeout(hoverAc, 200);
    });
    kok.addEventListener('pointerleave', function (e) {                         // imleç çıktı: 400 ms sonra kapan
      if (e.pointerType !== 'mouse') return;
      clearTimeout(D.hoverZaman);
      if (D.menu && !D.sabit) D.kapanZaman = setTimeout(function () { if (D.menu && !D.sabit) menuKapat(false); }, 400);
    });
    kucult.addEventListener('click', function () { gizle(true); });
    sekme.addEventListener('click', function () { gizle(false); });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('[data-secenek]'); if (!b) return;
      // çift tıkın ikinci tıkı, yeni açılan menünün seçeneğine denk geldiyse seçenek değil sürpriz (Pütür kenardayken menü imlecin altında açılır)
      if (e.detail && performance.now() - D.ilkTik <= CIFT_PENCERE) { tikla(e); return; }
      sec(b.getAttribute('data-secenek'));
    });
    menu.addEventListener('keydown', menuTus);
    balon.addEventListener('click', balonTik);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (D.balon) balonKapat(true); else if (D.menu) menuKapat(true);
    });
    document.addEventListener('pointerdown', function (e) {                   // dışarı tık: kapat
      if (!kok.contains(e.target) && e.target !== yakala) { if (D.menu) menuKapat(false); if (D.balon) balonKapat(false); }
    });
    kok.addEventListener('focusout', function () {                            // Tab ile çıkılınca kapan: sekme sırası tuzağa düşmez
      setTimeout(function () { if (D.menu && D.odakAcik && !kok.contains(document.activeElement)) menuKapat(false); }, 0);
    });
    document.addEventListener('focusin', function (e) {
      if (D.menu && D.odakAcik && !kok.contains(e.target)) menuKapat(false);
      if (!kok.contains(e.target) && aramaKutusu(e.target)) { D.aramaOdak = true; baglam('arama'); }
    });
    document.addEventListener('focusout', function (e) {
      if (D.aramaOdak && aramaKutusu(e.target)) { D.aramaOdak = false; if (D.durum === 'arama' && !D.balon) durum(taban()); }
    });
    document.addEventListener('change', function (e) {                        // filtre değişti: kısa araştırma
      var t = e.target; if (kok.contains(t) || !t.closest('form')) return;
      if (/^(checkbox|radio|select-one)$/.test(t.type)) baglam('arama', 2400);
    });
    document.addEventListener('click', function (e) {                         // chip tipi filtreler
      var t = e.target.closest && e.target.closest('[aria-checked], [aria-pressed]');
      if (t && !kok.contains(t) && !t.closest('[data-tema], [aria-label="Tema rengi"]')) baglam('arama', 2400);
    });
    ['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach(function (o) { addEventListener(o, function () { D.hareket = performance.now(); }, { passive: true }); });
    D.hareket = performance.now(); D.okumaBas = D.hareket;
    addEventListener('resize', function () { olc(); yerlesimIste(); if (D.menu) konumla(); if (D.balon) balonSinirla(); });
    addEventListener('scroll', function () {                           // kayarken yer sabit; durunca engele göre yerleşir
      D.kayiyor = true; clearTimeout(D.kayZaman); D.kayZaman = setTimeout(function () { D.kayiyor = false; yerlesimIste(); }, 110);
      yerlesimIste(); scrollIzle();
    }, { passive: true });
    // sayfadaki giriş animasyonu (kd-gir) ya da geçiş bitince öğe yerine oturur: Pütür'ün yeri yeniden ölçülür (seyreltilmiş)
    var oturZaman = 0;
    function oturdu(e) { if (kok.contains(e.target) || D.kayiyor) return; clearTimeout(oturZaman); oturZaman = setTimeout(yerlesimIste, 80); }
    document.addEventListener('animationend', oturdu, true); document.addEventListener('transitionend', oturdu, true);
    olc(); yerlesim(); setTimeout(function () { olc(); yerlesim(); }, 450);
    addEventListener('load', function () { olc(); yerlesim(); });
    if ('requestIdleCallback' in window) requestIdleCallback(videoHazirla, { timeout: 2500 }); else setTimeout(videoHazirla, 1200);
    var cb = document.getElementById('cookieBanner');
    if (cb) new MutationObserver(yerlesimIste).observe(cb, { attributes: true, attributeFilter: ['class'] });
    if (MAKALE && 'IntersectionObserver' in window) {                         // bölüm geçişi: okurken minik baş sallama
      var io = new IntersectionObserver(function (g) { g.forEach(function (x) { if (x.isIntersecting && D.okuyor && D.durum === 'okuma' && !azalt()) basSalla(); }); }, { rootMargin: '-45% 0px -50% 0px' });
      Array.prototype.forEach.call(document.querySelectorAll('main h2, .kd-sayfa h2'), function (h) { io.observe(h); });
    }
    D.sonY = window.scrollY || 0;
    kirpPlanla(); ortamPlanla(); ilkSelam(); merhabaPlanla();
  }

  /* ---------- Yerleşim: alt menü payı + kenara çekilme ---------- */
  var yerlesimBekliyor = false;
  function yerlesimIste() { if (yerlesimBekliyor) return; yerlesimBekliyor = true; requestAnimationFrame(function () { yerlesimBekliyor = false; yerlesim(); }); }
  function olc() {                                       // boyut değişince: alt menü payı, sol boşluk yeterli mi
    var nav = document.querySelector('.bottom-nav'), pay = 0;
    if (nav) { var cs = getComputedStyle(nav); if (cs.display !== 'none') pay = nav.offsetHeight + (parseFloat(cs.bottom) || 0); }
    if (pay !== D.navPay) { D.navPay = pay; document.documentElement.style.setProperty('--kd-pt-nav', pay + 'px'); }
    var kolon = document.querySelector('.kd-sayfa .wrap'), sol = 0;
    if (kolon) { var r = kolon.getBoundingClientRect(); sol = r.left + (parseFloat(getComputedStyle(kolon).paddingLeft) || 0); }
    var kokCss = getComputedStyle(document.documentElement);
    D.boyAsil = parseFloat(kokCss.getPropertyValue('--pt-boy')) || 112;          // genişliğe göre asıl boy (112/96/76/68)
    D.solIstenen = parseFloat(kokCss.getPropertyValue('--pt-sol')) || 32; D.kolonSol = sol;
    D.derin = Math.max(12, sol - 4); kok.style.setProperty('--pt-derin', D.derin + 'px');
    var gecerli = D.boy && D.boy < D.boyAsil;
    boyUygula(gecerli ? D.boy : D.boyAsil, gecerli && D.dinlenme ? D.dinlenme.sol : null, gecerli && D.dinlenme && D.dinlenme.yasli);
  }
  /* Boy: asıl boy yer bulamazsa (geniş ekranda) 96 → 76 → 68 denenir; küçük Pütür çoğu dizüstünde sol boşluğa tam sığar.
     Sol mesafe ve "dar" (içerik sütunuyla kesişir) boya göre hesaplanır. */
  var KUCUK = [96, 76, 68];
  function solEtkin(s) { var e = D.solIstenen; if (e + s + 8 > D.kolonSol && D.kolonSol - s - 8 >= 10) e = D.kolonSol - s - 8; return e; }   // sütuna girmeden sığıyorsa biraz içeri al
  function darMi(s) { return solEtkin(s) + s + 6 > D.kolonSol; }                // sığmıyorsa içerikle kesişir: kenara çekilir
  function boyUygula(s, sol, yasli) {
    if (s !== D.boy) { D.boy = s; if (s === D.boyAsil) kok.style.removeProperty('--pt-boy'); else kok.style.setProperty('--pt-boy', s + 'px'); kok.toggleAttribute('data-kucuk', s !== D.boyAsil); }
    var l = sol == null ? solEtkin(s) : sol;
    kok.style.setProperty('--pt-sol-etkin', l + 'px');
    D.dar = !yasli && l + s + 6 > D.kolonSol;                                   // yaslı: sütunun soluna değmeden durur
  }
  function etkilesimMerkezleri() {                       // ekrandaki bağ/düğme ortaları (sayfa düzeninden ve ızgara sınıflarından bağımsız)
    var n = document.querySelectorAll('a[href], button, input:not([type=hidden]), select, summary, [role=button], [role=radio], [role=tab]'), out = [];
    for (var i = 0; i < n.length; i++) {
      var e = n[i]; if (kok.contains(e) || e === sekme) continue;
      var r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8) continue;
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
      var c = getComputedStyle(e); if (c.visibility === 'hidden' || c.display === 'none' || +c.opacity <= .05) continue;
      out.push({ x: x, y: y, l: r.left, t: r.top, r: r.right, b: r.bottom });
    }
    return out;
  }
  function bosKutu(m, x0, y0, x1, y1) { for (var i = 0; i < m.length; i++) if (m[i].l < x1 && m[i].r > x0 && m[i].t < y1 && m[i].b > y0) return false; return true; }
  function bosMu(m, x0, y0, x1, y1) { for (var i = 0; i < m.length; i++) if (m[i].x >= x0 && m[i].x <= x1 && m[i].y >= y0 && m[i].y <= y1) return false; return true; }
  /* Engeller: dinlenme alanında okunan ya da dokunulan şey. Sayfa düzeninden ve ızgara sınıflarından bağımsız:
     etkileşimli öğe kutuları + bölge 10 px ızgarayla örneklenir (elementsFromPoint); değen öğe ve ataları için metin satırı kutuları,
     etiket/chip kutuları (zemini ya da kenarlığı olan küçük metinli kutu) toplanır. Görsel ve kart zemini engel değil. Kapı aynı tanımı ölçer. */
  var SATIR_ETKILESIM = 'a[href], button, input:not([type=hidden]), select, summary, [role=button], [role=radio], [role=tab]';
  function etiketKutusu(e) {
    var r = e.getBoundingClientRect(); if (r.width > innerWidth * .6 || r.height > 90 || !e.textContent.trim()) return null;
    var c = getComputedStyle(e), a = /rgba\([^)]*,\s*([\d.]+)\)/.exec(c.backgroundColor);
    var zemin = c.backgroundColor !== 'transparent' && (!a || +a[1] > .05), cizgi = parseFloat(c.borderTopWidth) > 0 && c.borderTopStyle !== 'none' && !/,\s*0\)$/.test(c.borderTopColor) && c.borderTopColor !== 'transparent';
    return zemin || cizgi || c.backgroundImage !== 'none' ? r : null;
  }
  /* V2 sayfa başı öğeleri adıyla da engel: geniş olanlarda (ör. güvenlik şeridi, dar ekranda güven rozeti) kutu yerine metin satırları
     ve içindeki bağlar; dar olanlarda kutunun tamamı (rozetin çerçevesi de örtülmesin). Kapı aynı listeyi ölçer. */
  var V2_ENGEL = '.kd-ust, .kd-kirinti > *, .kd-ust-yazi, .kd-hub-donem__secenek, .kd-guven-rozet, .kd-guvenlik-serit p > *';
  function v2Engeller(ekle, y0, y1) {
    var n = document.querySelectorAll(V2_ENGEL);
    for (var i = 0; i < n.length; i++) {
      var e = n[i], r = e.getBoundingClientRect(); if (r.width < 1 || r.bottom < y0 || r.top > y1) continue;
      var c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity <= .05) continue;
      if (e.matches('.kd-ust') || r.width <= innerWidth * .6) { ekle(r); continue; }
      var z = document.createRange(); z.selectNodeContents(e); var q = z.getClientRects(); for (var t = 0; t < q.length; t++) ekle(q[t]);
      Array.prototype.forEach.call(e.querySelectorAll('a, button'), function (a) { ekle(a.getBoundingClientRect()); });
    }
  }
  function engelKutulari(x0, y0, x1, y1) {
    var out = etkilesimMerkezleri(), gorulen = new Set(), xs = [], ys = [], v;
    function ekle(r) { if (r.width > 1 && r.height > 1) out.push({ l: r.left, t: r.top, r: r.right, b: r.bottom }); }
    v2Engeller(ekle, y0, y1);
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(innerWidth - 1, x1); y1 = Math.min(innerHeight - 1, y1);
    for (v = x0; v < x1; v += 10) xs.push(v); xs.push(x1);
    for (v = y0; v < y1; v += 10) ys.push(v); ys.push(y1);
    for (var i = 0; i < xs.length; i++) for (var j = 0; j < ys.length; j++) {
      var yig = document.elementsFromPoint(xs[i], ys[j]), e = null;
      for (var k = 0; k < yig.length; k++) if (!kok.contains(yig[k]) && yig[k] !== yakala && yig[k] !== sekme) { e = yig[k]; break; }
      for (; e && e !== document.body && e !== document.documentElement && !gorulen.has(e); e = e.parentElement) {
        gorulen.add(e);
        if (e.closest('.bottom-nav')) break;
        for (var n = e.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.textContent.trim()) {
          var z = document.createRange(); z.selectNodeContents(n); var q = z.getClientRects(); for (var t = 0; t < q.length; t++) ekle(q[t]);
        }
        if (e.matches(SATIR_ETKILESIM)) ekle(e.getBoundingClientRect());     // ortası ekran dışında kalan öğe de
        var et = etiketKutusu(e); if (et) ekle(et);
      }
    }
    return out;
  }
  /* Dinlenme konumu (her genişlik): EK'teki boyut ve yer yalnız altında engel varsa değişir.
     Sayfa üstteyken: tam boy (gerekirse engelden kurtulacak kadar yukarıda) > kenarda > derin kenar (yalnız sol boşluk kadar).
     Sayfa kaymışken: dar ekranda tam boy yok (içerik sütunu sürekli geçer); kayarken yer değişmez, durunca engele göre kenar ya da derin. */
  function dinlenmeKonum() {
    var kayik = (window.scrollY || 0) > 48;
    var genis = innerWidth > 640;                                               // dizüstü/tablet: kaydırınca da tam görünür olabilir
    if (kayik && D.kayiyor && D.dinlenme) return D.dar && !genis ? { kenar: true, derin: !!D.dinlenme.derin, dy: 0, boy: D.boyAsil } : D.dinlenme;
    // alt kenar boydan bağımsız (bottom ile sabit): her boy için üst = alt - boy
    var boy = D.boyAsil, alt = kok.offsetTop + btn.offsetWidth - D.kaldir, ust = ustSinir() + 8, p = 1;
    var boylar = genis ? [boy].concat(KUCUK.filter(function (s) { return s < boy; })) : [boy];
    var x1 = 0, y0 = boy * 3; boylar.forEach(function (s, i) { x1 = Math.max(x1, solEtkin(s) + s); if (i) y0 = Math.max(y0, Math.min(s * 4, 280) + s); });   // aranan en geniş/en yüksek alan
    var e = engelKutulari(0, alt - y0 - 12, x1 + 12, alt + 12), dy;
    function tamDene(s, l) {
      var u = alt - s, yukari = kayik && (s === boy || !genis) ? 0 : s === boy ? s * 2 : Math.min(s * 4, 280);   // küçük boy geniş ekranda (kaymışken de) en çok 4 boy yukarıdaki boş yere kalkabilir
      if (kayik && darMi(s) && !genis) return null;                             // telefonda kayarken sütunla kesişen tam boy yok (sütun sürekli geçer)
      for (dy = 0; dy <= yukari && u - dy >= ust; dy += 6) if (bosKutu(e, l - p, u - dy - p, l + s + p, u - dy + s + p)) return { kenar: false, dy: dy, boy: s, sol: l };
      return null;
    }
    var tam = tamDene(boy, solEtkin(boy)), kenar = null, u0 = alt - boy, yk = kayik ? 0 : boy * 2;
    for (dy = 0; dy <= yk && u0 - dy >= ust; dy += 6) if (bosKutu(e, 0, u0 - dy - p, boy * .5 + p, u0 - dy + boy + p)) { kenar = { kenar: true, dy: dy, boy: boy }; break; }
    if (tam && (!kenar || tam.dy <= kenar.dy + boy * .75)) return tam;   // tam boy, kenara göre ~¾ boy yukarı kaymaya değer
    for (var i = 1; i < boylar.length; i++) {                                   // geniş ekranda: küçülüp tam görünür (önce kendi sol mesafesi, sonra kenara yakın 4 px)
      var k = tamDene(boylar[i], solEtkin(boylar[i])) || (solEtkin(boylar[i]) > 4 ? tamDene(boylar[i], 4) : null); if (k) return k;
    }
    // son çare (geniş ekran): sol boşluğa yaslı, sütuna değmeden; en az %82'si ekranda (ör. 1280'de sütun 52 px'te: 62 px, 11 px dışarıda)
    if (genis) {
      var sy = Math.min(68, Math.floor((D.kolonSol - 1) / .82));
      if (sy >= 56) { var ya = tamDene(sy, D.kolonSol - 1 - sy); if (ya) { ya.yasli = true; return ya; } }
    }
    return kenar || { kenar: true, derin: true, dy: 0, boy: boy };
  }
  /* Dar ekranda animasyon ve menü için konum: zıplamanın süpürdüğü alan bir bağın/düğmenin ortasına değmesin.
     Önce tam boy (gerekirse yukarı kayarak; hiçbir öğe kutusuna binmeden), olmazsa kenarda (öğe ortalarına değmeden). Oranlar kareden ölçüldü: video tepesi boyun %36'sı yukarı çıkar. */
  function guvenliKonum() {
    var m = etkilesimMerkezleri(), boy = btn.offsetWidth, l = kok.offsetLeft, u = kok.offsetTop - D.kaldir;
    var H = boy * .36, pay = boy * .08, ust = ustSinir() + 8, kenarSag = boy * .5, enIyi = null;
    var dinlenme = kok.classList.contains('kd-pt--kenar') ? [0, kenarSag] : [l, l + boy];
    function dene(kenar, ek) {
      var x0 = kenar ? 0 : l - pay, x1 = kenar ? kenarSag : l + boy + pay;
      for (var dy = 0; dy <= boy * 3 && u - dy - H >= ust; dy += 6) {
        if (!bosMu(m, dinlenme[0], u - dy, dinlenme[1], u + boy)) return;      // yukarı kayarken yolda bir öğe var
        if ((kenar ? bosMu : bosKutu)(m, x0, u - dy - H, x1, u - dy + boy)) { if (!enIyi || dy + ek < enIyi.c) enIyi = { kenar: kenar, dy: dy, c: dy + ek }; return; }
      }
    }
    dene(false, 0); dene(true, boy * 1.5);
    return enIyi || { kenar: true, dy: 0 };
  }
  function hedefKutu() {                                 // geçiş bitmeden, Pütür'ün varacağı kutu
    var boy = btn.offsetWidth, kenar = kok.classList.contains('kd-pt--kenar');
    var left = kenar ? (kok.classList.contains('kd-pt--derin') ? D.derin - boy : -boy * .5) : kok.offsetLeft, top = kok.offsetTop - D.kaldir - D.guvenli;
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
    if (acik && D.dar) {                                                        // açık kaldıkça konum sabit: menü kaymaz
      // imleçle açık menüde Pütür imlecin altından kaçmaz; tıklanınca güvenli konuma geçer
      if (!D.poz) D.poz = D.menu && !D.sabit ? { hover: true, kenar: kok.classList.contains('kd-pt--kenar'), derin: kok.classList.contains('kd-pt--derin'), dy: D.guvenli } : guvenliKonum();
    } else D.poz = null;
    if (!D.poz && !(acik && D.dinlenme)) { D.dinlenme = dinlenmeKonum(); boyUygula(D.dinlenme.boy || D.boyAsil, D.dinlenme.sol, D.dinlenme.yasli); }   // açıkken yer ve boy sabit
    var durak = D.poz || D.dinlenme, kenar = durak.kenar;
    kok.classList.toggle('kd-pt--kenar', kenar);
    kok.classList.toggle('kd-pt--derin', !!durak.derin);
    var guvenli = durak.dy;
    if (guvenli !== D.guvenli) { D.guvenli = guvenli; kok.style.setProperty('--pt-guvenli', guvenli + 'px'); }
    if (D.poz) return;
    // footer perdesi açıldıysa yasal bağlara ve telif satırına binmez: üstüne çıkar
    var boy = btn.offsetWidth, ust = kok.offsetTop, alt = ust + boy, sag = kenar ? boy * .5 : kok.offsetLeft + boy, kaldir = 0;
    var bant = document.querySelector('#cookieBanner.show');                   // çerez bandı açıkken onun üstünde
    if (bant) { var bb = bant.getBoundingClientRect(); if (bb.height && bb.top < alt + 12) kaldir = alt - bb.top + 12; }
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
  function taban() { return D.balon ? 'anlatma' : (D.okuyor ? 'okuma' : 'idle'); }   // geçici durum bitince dönülecek yer
  function durum(d, sure) {
    clearTimeout(durumZaman);
    D.durum = d; kok.setAttribute('data-durum', d);
    if (sure) durumZaman = setTimeout(function () { if (D.durum === d) durum(taban()); }, sure);
  }
  var SIRA = { idle: 0, gezinti: 1, okuma: 2, arama: 3 };
  function baglam(d, sure) {                             // sayfadan gelen tetikleyici: kullanıcının açtığı şeyi ve yüksek önceliği bölmez
    if (D.durdu || D.gizli || D.mesgul || D.menu || D.balon) return;
    if (!(D.durum in SIRA) || SIRA[d] < SIRA[D.durum]) return;
    durum(d, sure);
  }
  function kirpPlanla() {
    clearTimeout(D.kirpZaman);
    D.kirpZaman = setTimeout(function () {
      if (!azalt() && !D.gizli && (D.durum === 'idle' || D.durum === 'anlatma' || D.durum === 'gezinti' || D.durum === 'okuma')) {
        kok.classList.add('kd-pt--kirp'); setTimeout(function () { kok.classList.remove('kd-pt--kirp'); }, 170);
      }
      kirpPlanla();
    }, 2600 + Math.random() * 3400);
  }
  /* Tek bir hafif zamanlayıcı: hareketsizlikte gezinti, ara sıra el sallama, makalede okuma */
  function ortamPlanla() {
    clearTimeout(D.ortamZaman);
    D.ortamZaman = setTimeout(ortamTik, 2500);
  }
  function ortamTik() {
    var simdi = performance.now(), serbest = !D.gizli && !D.mesgul && !D.menu && !D.balon;
    if (serbest && MAKALE && !D.okuyor && simdi - D.okumaBas >= 20000) { D.okuyor = true; baglam('okuma'); }
    if (serbest && !azalt() && D.durum === 'idle') {
      if (!D.gezBekle) D.gezBekle = 30000 + Math.random() * 12500;
      if (simdi - D.hareket >= D.gezBekle && simdi - D.sonGezinti >= 120000) { D.sonGezinti = simdi; D.gezBekle = 0; durum('gezinti', 2600); }
      else {
        if (!D.elBekle) { D.elBekle = 45000 + Math.random() * 45000; D.sonEl = simdi; }
        if (simdi - D.sonEl >= D.elBekle) { D.elBekle = 0; selamVer(); }
      }
    }
    ortamPlanla();
  }
  function basSalla() {
    kok.classList.add('kd-pt--bas');
    setTimeout(function () { kok.classList.remove('kd-pt--bas'); }, 540);
  }
  function scrollIzle() {                                // yön: hafif bakış; hız: hızlı kaydırma okumayı bitirir
    var y = window.scrollY || 0, t = performance.now(), dy = y - D.sonY, dt = t - D.sonT;
    D.sonY = y; D.sonT = t; D.hareket = t;
    if (!dy) return;
    if (MAKALE && dt > 0 && dt < 400 && Math.abs(dy) / dt > 2.5) {
      D.okumaBas = t;
      if (D.okuyor) { D.okuyor = false; if (D.durum === 'okuma') durum(taban()); }
    }
    if (azalt() || D.gizli) return;
    kok.setAttribute('data-bakis', dy > 0 ? 'asagi' : 'yukari');
    clearTimeout(D.bakisZaman);
    D.bakisZaman = setTimeout(function () { kok.removeAttribute('data-bakis'); }, 260);
  }
  function aramaKutusu(t) { return !!(t && t.matches && t.matches('input[type="search"], [role="searchbox"], input[id*="ara" i], input[name*="ara" i]')); }

  /* Sekme görünmezken: animasyon, zamanlayıcı, video durur; görünür olunca sürer */
  function durdur() {
    D.durdu = true;
    clearTimeout(D.kirpZaman); clearTimeout(D.ortamZaman); clearTimeout(durumZaman); clearTimeout(D.bakisZaman); clearTimeout(D.hoverZaman); clearTimeout(D.kapanZaman);
    kok.removeAttribute('data-bakis');
    if (D.surprizBitir) D.surprizBitir();
    if (D.tepkiBitir) D.tepkiBitir();
    if (D.durum !== 'tepki' && D.durum !== 'surpriz') durum(taban());
    kok.classList.add('kd-pt--dur');
    if (kok.getAnimations) kok.getAnimations({ subtree: true }).forEach(function (a) { if (a.playState === 'running' && !a.animationName) a.pause(); });
    if (video) { try { video.pause(); } catch (e) { /* yok */ } }
  }
  function surdur() {
    if (!D.durdu) return;
    D.durdu = false; kok.classList.remove('kd-pt--dur');
    if (kok.getAnimations) kok.getAnimations({ subtree: true }).forEach(function (a) { if (a.playState === 'paused' && !a.animationName) a.play(); });
    D.hareket = performance.now();
    kirpPlanla(); ortamPlanla();
  }

  /* Masaüstü imleci */
  function merhabaGizle() { var b = kok.querySelector('.kd-pt__merhaba'); if (b) { b.classList.remove('kd-acik'); b.hidden = true; } }
  function hoverAc() {
    if (D.menu || D.mesgul || D.balon || D.gizli || D.durdu) return;
    D.sabit = false; D.odakAcik = false;
    kok.classList.remove('kd-pt--ilgi');
    kok.setAttribute('data-hover', '');
    menuAc(false);
    if (!azalt()) durum('hover', 900);
  }

  /* "Merhaba!": ilk ziyarette bir kez */
  function merhabaPlanla() {
    if (D.gizli) return;
    var gormus; try { gormus = localStorage.getItem(MERHABA); } catch (e) { return; }
    if (gormus) return;
    setTimeout(function () {
      if (D.gizli || D.durdu || D.mesgul || D.menu || D.balon) return;
      var k = hedefKutu(), m = etkilesimMerkezleri(), yer = null, gen = 104, boy = 34;
      var solKayma = Math.max(0, 6 - k.left);
      if (k.top - boy - 12 > ustSinir() && bosMu(m, k.left + solKayma, k.top - boy - 12, k.left + solKayma + gen, k.top - 8)) yer = 'ust';
      else if (bosMu(m, k.right + 6, k.top + k.height * .2, k.right + 8 + gen, k.bottom)) yer = 'sag';
      if (!yer) return;                                                         // yer yoksa bu sayfada gösterme, sonrakinde dene
      try { localStorage.setItem(MERHABA, '1'); } catch (e) { return; }
      var b = el('div', { class: 'kd-pt__merhaba', role: 'status', 'data-yer': yer }, 'Merhaba!');
      if (solKayma) b.style.setProperty('--pt-m-sol', solKayma + 'px');
      kok.appendChild(b);
      requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('kd-acik'); }); });
      if (!azalt()) selamVer();
      setTimeout(function () { b.classList.remove('kd-acik'); setTimeout(function () { b.hidden = true; }, 260); }, 3000);
    }, 800);
  }

  /* ---------- Gizle / göster ---------- */
  function gizle(evet, ilk) {
    D.gizli = !!evet;
    if (evet) { menuKapat(false); balonKapat(false); }
    kok.classList.toggle('kd-pt--gizli', D.gizli);
    kok.hidden = D.gizli; sekme.hidden = !D.gizli;
    if (!ilk) {
      yaz(ANAHTAR, { gizli: D.gizli });
      if (D.gizli) sekme.focus({ preventScroll: true }); else butonaOdak();
      if (!D.gizli) { olc(); yerlesim(); if (!video) videoHazirla(); if (!azalt()) selamVer(); }
    }
  }

  /* ---------- Tık: tek tık → menü (250 ms bekleyerek), çift tık → sürpriz ---------- */
  function butonaOdak() {                                // programdan odak menüyü yeniden açmasın
    D.odakSus = true; btn.focus({ preventScroll: true });
    setTimeout(function () { D.odakSus = false; }, 0);
  }
  /* Fare çift tıkı ve dokunmatik çift dokunuş aynı yoldan gelir (click). Yerel dblclick kullanılmaz: dokunmatikte güvenilmez.
     İlk tık 250 ms bekletilir; bu sürede ikinci tık gelirse sürpriz. 250–400 ms arasında gelen ikinci tık da çift sayılır:
     o anda açılmaya başlamış menü kapanır, sürpriz oynar. */
  function tikla(e) {
    clearTimeout(D.hoverZaman);
    if (e && e.detail === 0) { tekIptal(); klavyeTik(); return; }              // Enter/Space: bekletmeden
    if (D.gizli || D.durum === 'surpriz') return;                              // sürpriz sürerken tıklar yok sayılır
    var simdi = performance.now();
    if (simdi - D.ilkTik <= CIFT_PENCERE) {                      // çiftin ikinci tıkı
      var bekliyordu = !!D.tekZaman; tekIptal(); D.ilkTik = -1e9;
      if (simdi - D.sonSurpriz > SURPRIZ_BEKLEME) { surpriz(); return; }
      if (!bekliyordu) return;                                                 // bekleme süresinde: ilk tık menüyü zaten açtı, ikinci kapatmasın
      tekTik(); return;                                                        // bekleme süresinde çift tık = tek tık
    }
    D.ilkTik = simdi;
    D.tekZaman = setTimeout(function () { D.tekZaman = 0; tekTik(); }, TEK_BEKLE);
  }
  function tekIptal() { clearTimeout(D.tekZaman); D.tekZaman = 0; }
  function klavyeTik() {
    if (D.durum === 'surpriz' || D.gizli) return;
    if (D.menu) { D.sabit = true; D.odakAcik = true; kok.removeAttribute('data-hover'); ogeler[0].focus(); return; }   // açık menüye Enter: içine gir
    if (D.mesgul) return;
    if (D.balon) balonKapat(false);
    D.sabit = true; D.odakAcik = true;
    kok.classList.remove('kd-pt--ilgi'); yerlesim(); menuAc();
  }
  function tekTik() {
    if (D.gizli || D.durum === 'surpriz') return;
    if (D.menu) {
      if (!D.sabit) {                                                           // imleçle açık: kapatmadan sabitle ve zıpla
        D.sabit = true; kok.removeAttribute('data-hover');
        if (!azalt() && !D.mesgul) tepki(true);
        return;
      }
      if (D.durum === 'tepki' && D.tepkiBitir) D.tepkiBitir();                   // zıplarken de kapatılabilir
      menuKapat(true); return;
    }
    if (D.mesgul) return;
    if (D.balon) balonKapat(false);
    D.sabit = true; D.odakAcik = false;
    kok.classList.remove('kd-pt--ilgi');
    if (azalt()) { menuAc(); return; }
    tepki(false);
  }

  /* Tek tık tepkisi: menü hemen açılır, Pütür aynı anda sevinçle zıplar (menü açıkken başlarsa yalnız zıplar) */
  function tepki(menuAcik) {
    kok.classList.remove('kd-pt--ilgi');
    if (azalt()) { if (!menuAcik) menuAc(); return; }
    yakalaGoster(btn.getBoundingClientRect()); merhabaGizle();
    if (D.poz && D.poz.hover) D.poz = null;
    D.mesgul = true; yerlesim(); durum('tepki');
    if (!menuAcik) menuAc(!D.durdu); else konumla();
    var bitir = function () {
      clearTimeout(D.tepkiZaman); if (D.durum !== 'tepki') return;
      D.tepkiBitir = null;
      videoKapat(); yakalaGizle();
      D.mesgul = false; durum(taban());
      if (D.menu) konumla();
    };
    D.tepkiBitir = bitir;
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
    clearTimeout(D.tepkiZaman); D.tepkiBitir = null; videoKapat();
    if (D.menu) menuKapat(false);
    if (D.balon) balonKapat(false);
    kok.classList.remove('kd-pt--ilgi', 'kd-pt--selam');
    if (yakala.hidden) yakalaGoster(btn.getBoundingClientRect());
    merhabaGizle();
    if (D.poz && D.poz.hover) D.poz = null;
    D.mesgul = true; D.sonSurpriz = performance.now(); D.surprizSay++;
    kok.setAttribute('data-surpriz', String(D.surprizSay));
    durum('surpriz'); yerlesim();
    var karakter = btn.querySelector('.kd-pt__karakter');
    var zaman = [];
    var bitti = function () {
      zaman.forEach(clearTimeout); D.surprizBitir = null;
      karakter.getAnimations().forEach(function (a) { a.cancel(); });
      sahne.innerHTML = ''; yakalaGizle();
      D.mesgul = false; durum(taban()); yerlesim();
      if (!azalt() && !D.durdu) selamVer();
    };
    D.surprizBitir = bitti;
    var R = renkler();
    if (azalt()) {                                                              // yalnız yumuşak solma + tek parıltı
      var tek = parca('parilti', R[1], 22); tek.style.left = '78%'; tek.style.top = '-6%';
      karakter.animate([{ opacity: 1 }, { opacity: .25 }, { opacity: 1 }], { duration: 1300, easing: 'ease-in-out' });
      tek.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 1300, easing: 'ease-in-out' });
      zaman.push(setTimeout(bitti, 1350)); return;
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
    var b = hedefKutu(), mx = Math.max(b.width / 2, 24 - b.left), my = b.height * .55, merkezler = etkilesimMerkezleri();   // kenardayken çıkış noktası ekranda
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
      var boy = Math.round((sk === 'nokta' ? 9 + (i % 3) * 2 : 15 + (i * 7) % 9) * Math.max(1, b.width / 84));
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
    zaman.push(setTimeout(function () {
      var don = karakter.animate([
        { transform: 'scale(.3)', opacity: 0 },
        { transform: kenarda ? 'scale(1.02, .97)' : 'scale(1.1, .92)', opacity: 1, offset: .55 },
        { transform: kenarda ? 'scale(.98, 1.02)' : 'scale(.96, 1.04)', opacity: 1, offset: .8 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 480, easing: 'cubic-bezier(.25,1,.5,1)', fill: 'forwards' });
      don.onfinish = function () { karakter.getAnimations().forEach(function (a) { a.cancel(); }); };
    }, 1420));
    zaman.push(setTimeout(bitti, 1960));
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
    ogeler.forEach(function (b) { b.style.setProperty('--ox', Math.max(cx - ikon, 6 - hb.left).toFixed(1) + 'px'); b.style.setProperty('--oy', (cy - h / 2).toFixed(1) + 'px'); });
    var enUst = 0, enSag = 0;                                                   // Pütür'den menüye imleç köprüsü
    ogeler.forEach(function (b) { enUst = Math.min(enUst, parseFloat(b.style.getPropertyValue('--y'))); enSag = Math.max(enSag, parseFloat(b.style.getPropertyValue('--x'))); });
    kopru.style.cssText = 'left:' + Math.min(0, Math.round(6 - hb.left)) * -1 + 'px;top:' + Math.round(enUst) + 'px;width:' + Math.round(enSag + ikon * 2) + 'px;height:' + Math.round(s - enUst) + 'px';
  }
  function menuAc(odak) {
    if (D.gizli || D.menu) return;
    merhabaGizle();
    D.menu = true; yerlesim(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('kd-pt-acik');
    konumla();
    kok.classList.add('kd-pt--menu');
    requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('kd-acik'); }); });
    if (odak !== false) ogeler[0].focus({ preventScroll: true });
  }
  function menuKapat(odakDon) {
    if (!D.menu) return;
    D.menu = false; D.sabit = false; D.odakAcik = false; clearTimeout(D.kapanZaman);
    kok.removeAttribute('data-hover');
    btn.setAttribute('aria-expanded', 'false'); kok.classList.remove('kd-pt--menu');
    if (D.durum === 'hover') durum(taban());
    menu.classList.remove('kd-acik');
    setTimeout(function () { if (!D.menu) menu.hidden = true; }, azalt() ? 180 : 320);
    if (odakDon) butonaOdak();
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
    var bekle = azalt() || acil ? 0 : 600;
    Promise.resolve().then(CEVAP[kod]).catch(function () { return '<p>Şu an bu bilgiye ulaşamadım. Sayfayı yenileyip yeniden deneyin.</p>'; })
      .then(function (html) {
        setTimeout(function () {
          if (!D.balon || sonSecenek !== kod) return;
          var kap = el('div', null, html);                                      // her cevap yeni kap: dinleyiciler birikmez
          balonIc.innerHTML = ''; balonIc.appendChild(kap); balonIc.scrollTop = 0;
          durum('anlatma');
          var bas = kap.querySelector('.kd-pt__baslik'); if (bas) { bas.setAttribute('tabindex', '-1'); bas.focus({ preventScroll: true }); }
          var kurucu = KURULUM[kod]; if (kurucu) kurucu(kap);
        }, bekle);
      });
  }
  function balonKapat(odakDon) {
    if (!D.balon) return;
    D.balon = false; kok.classList.remove('kd-pt--balon'); balon.classList.remove('kd-acik');
    setTimeout(function () { if (!D.balon) { balon.hidden = true; balonIc.innerHTML = ''; } }, azalt() ? 180 : 240);
    if (D.durum === 'anlatma' || D.durum === 'dusunme' || D.durum === 'arama') durum(taban());
    if (odakDon) butonaOdak();
    if (!D.menu) document.documentElement.classList.remove('kd-pt-acik');
    yerlesimIste();
  }
  function balonTik(e) {
    if (e.target.closest('[data-pt-kapat]')) { balonKapat(true); return; }
    if (e.target.closest('[data-pt-geri]')) { balonKapat(false); D.sabit = true; D.odakAcik = true; menuAc(); return; }
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
          sonuc.innerHTML = '<p><b>3 yaşını geçmiş.</b> Dada Gastro Kids 3 yaşa kadar eşlik ediyor; aile tarifleri Dada Gastro\'da.</p>' + dugme('tarifler.html', 'Dada Gastro tarifleri', true);
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
      var giris = ic.querySelector('#kdPtAra'), kutu = ic.querySelector('[data-pt-besin]'), zaman = 0, sira = 0, aramaZaman = 0;
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
        clearTimeout(aramaZaman);
        if (q.length < 2) { kutu.innerHTML = ''; if (D.durum === 'arama') durum(taban()); return; }
        aramaZaman = setTimeout(function () { if (bu === sira) durum('arama'); }, 140);   // veri hazırsa araştırma yanıp sönmez
        Promise.all([veri('besinler'), veri('kesim')]).then(function (v) {
          if (bu !== sira) return;
          clearTimeout(aramaZaman);
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
          durum(taban());
        }).catch(function () { kutu.innerHTML = '<p>Veriye ulaşamadım; biraz sonra yeniden deneyin.</p>'; });
      }
      giris.addEventListener('input', function () { clearTimeout(zaman); zaman = setTimeout(ara, 220); });
      giris.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(zaman); ara(); } });
    }
  };

  /* ---------- Başlat ---------- */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur); else kur();
  document.addEventListener('visibilitychange', function () { if (document.hidden) durdur(); else surdur(); });
})();
