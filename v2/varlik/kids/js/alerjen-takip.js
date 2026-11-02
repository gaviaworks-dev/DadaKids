/* Dada Gastro Kids — 3 günlük gözlem / alerjen tanıştırma takipçisi (sahibi: araçlar kolu)
   Bağımlılıksız. Kalıcılık: localStorage "dadakids.alerjenTakip.v1" — her erişim try/catch;
   depolama yoksa bellek içinde çalışır ve küçük bir not gösterir. alert/confirm/prompt yok. */
(function () {
  'use strict';
  var kok = document.getElementById('kdAlerjen');
  if (!kok) return;

  var ANAHTAR = 'dadakids.alerjenTakip.v1';
  var BELIRTI = [
    ['doku', 'Döküntü'], ['agiz', 'Ağız çevresinde kızarıklık'], ['kusma', 'Kusma'], ['ishal', 'İshal / dışkı değişikliği'],
    ['gaz', 'Gaz'], ['huzursuz', 'Huzursuzluk'], ['sislik', 'Şişlik'], ['yok', 'Belirti yok']
  ];
  var BELIRTI_AD = {}; BELIRTI.forEach(function (b) { BELIRTI_AD[b[0]] = b[1]; });
  var SONUC_AD = { tolere: 'Tolere etti', tekrar: 'Emin değilim, tekrar denenecek', tepki: 'Tepki görüldü, doktora danışılacak' };

  var $ = function (s, k) { return (k || kok).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || kok).querySelectorAll(s)); };

  /* ---------- Depolama (her erişim korumalı) ---------- */
  var depo = (function () {
    var acik = false, bellek = null;
    try { var ls = window.localStorage; var t = '__kd_deneme'; ls.setItem(t, '1'); ls.removeItem(t); acik = true; } catch (e) { acik = false; }
    return {
      acik: function () { return acik; },
      oku: function () {
        if (!acik) return bellek;
        try { var s = window.localStorage.getItem(ANAHTAR); return s ? JSON.parse(s) : null; } catch (e) { return bellek; }
      },
      yaz: function (v) {
        bellek = v;
        if (!acik) return;
        try { window.localStorage.setItem(ANAHTAR, JSON.stringify(v)); } catch (e) { acik = false; depoNotu(); }
      },
      sil: function () {
        bellek = null;
        if (!acik) return;
        try { window.localStorage.removeItem(ANAHTAR); } catch (e) { /* yok say */ }
      }
    };
  })();
  function depoNotu() { var n = $('[data-at-depo-yok]'); if (n) n.hidden = depo.acik(); }

  function bos() { return { v: 1, kayitlar: [] }; }
  var veri = (function () {
    var v = depo.oku();
    if (!v || typeof v !== 'object' || !Array.isArray(v.kayitlar)) return bos();
    v.kayitlar = v.kayitlar.filter(function (k) { return k && k.id && k.bas && Array.isArray(k.gun); });
    return v;
  })();
  function kaydet() { depo.yaz(veri); }

  /* ---------- Tarih yardımcıları (yerel gün, YYYY-MM-DD) ---------- */
  function iki(n) { return (n < 10 ? '0' : '') + n; }
  function str(d) { return d.getFullYear() + '-' + iki(d.getMonth() + 1) + '-' + iki(d.getDate()); }
  function tarih(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function bugun() { return str(new Date()); }
  function gunEkle(s, n) { var d = tarih(s); d.setDate(d.getDate() + n); return str(d); }
  function fark(a, b) { return Math.round((Date.UTC.apply(null, parcala(b)) - Date.UTC.apply(null, parcala(a))) / 864e5); }
  function parcala(s) { var p = String(s).split('-'); return [+p[0], +p[1] - 1, +p[2]]; }
  function goster(s, gunlu) {
    try { return tarih(s).toLocaleDateString('tr-TR', gunlu ? { day: 'numeric', month: 'short', weekday: 'short' } : { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return s; }
  }
  function onceMetni(n) { return n <= 0 ? 'bugün' : n === 1 ? 'dün' : n + ' gün önce'; }
  function gecerliTarih(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(tarih(s).getTime()); }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function yeniId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function suren() { return veri.kayitlar.filter(function (k) { return !k.sonuc; }); }
  function bul(id) { for (var i = 0; i < veri.kayitlar.length; i++) if (veri.kayitlar[i].id === id) return veri.kayitlar[i]; return null; }
  function duyur(m) { var d = $('[data-at-duyuru]'); if (d) { d.textContent = ''; setTimeout(function () { d.textContent = m; }, 30); } }

  /* ---------- Form ---------- */
  var form = $('#atForm');
  var tarihGirdi = $('#atBaslangic');
  var ozelKutu = $('[data-at-ozel]');
  var ozelGirdi = $('#atOzelAd');
  var hataEl = $('[data-at-hata]');
  var uyariEl = $('[data-at-uyari]');
  var bekleyen = null;
  // Başlangıç tarihi = Kids tarih seçicisi (dogum-secici.js gün kipi; gizli input ISO). Seçici yoksa yalnız gizli değer yazılır.
  var tarihKok = tarihGirdi.closest('[data-kd-tarih]');
  function tarihAyarla(v) { if (tarihKok && tarihKok.kdTarih) tarihKok.kdTarih.ayarla(v, false); else tarihGirdi.value = v; }
  tarihAyarla(bugun());

  function hata(m) { hataEl.textContent = m || ''; hataEl.hidden = !m; }
  form.addEventListener('change', function (e) {
    if (e.target.name === 'alerjen') { ozelKutu.hidden = e.target.value !== 'ozel'; if (!ozelKutu.hidden) ozelGirdi.focus(); hata(''); uyariKapat(); }
  });
  function uyariKapat() { uyariEl.hidden = true; bekleyen = null; }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); hata(''); uyariKapat();
    var sec = form.querySelector('input[name="alerjen"]:checked');
    if (!sec) { hata('Lütfen bir besin seçin.'); return; }
    var k = sec.value, ad = sec.getAttribute('data-ad');
    if (k === 'ozel') {
      ad = ozelGirdi.value.trim().replace(/\s+/g, ' ');
      if (!ad) { hata('Lütfen besinin adını yazın.'); ozelGirdi.focus(); return; }
      ad = ad.charAt(0).toLocaleUpperCase('tr') + ad.slice(1);
    }
    var bas = tarihGirdi.value;
    if (!gecerliTarih(bas)) { hata('Lütfen geçerli bir başlangıç tarihi seçin.'); return; }
    if (fark(bas, bugun()) < 0) { hata('Başlangıç tarihi bugünden sonra olamaz.'); return; }
    var ayni = suren().filter(function (x) { return x.k === k && (k !== 'ozel' || x.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr')); })[0];
    if (ayni) { hata(ad + ' için zaten süren bir gözlem var.'); return; }
    var yeni = { id: yeniId(), k: k, ad: ad, bas: bas, gun: [{ b: [], n: '' }, { b: [], n: '' }, { b: [], n: '' }], sonuc: null, ver: [], ts: Date.now() };
    var aktif = suren();
    if (aktif.length) {
      bekleyen = yeni;
      var adlar = aktif.map(function (x) { return x.ad; }).join(', ');
      $('[data-at-uyari-metin]').textContent = 'Şu an ' + adlar + ' için gözlem sürüyor. Aynı anda ikinci bir yeni ' + (k === 'ozel' ? 'besin' : 'alerjen') +
        ' başlatmak, olası bir tepkinin hangisinden olduğunu anlamayı zorlaştırır. Önce süren gözlemi tamamlamanız önerilir.';
      uyariEl.hidden = false;
      $('[data-at-yine-de]').focus();
      return;
    }
    baslat(yeni);
  });
  $('[data-at-yine-de]').addEventListener('click', function () { if (bekleyen) { var y = bekleyen; uyariKapat(); baslat(y); } });
  $('[data-at-vazgec]').addEventListener('click', function () { uyariKapat(); form.querySelector('button[type="submit"]').focus(); });

  function baslat(k) {
    veri.kayitlar.push(k); kaydet(); sonMesaj = null;
    form.reset(); tarihAyarla(bugun()); ozelKutu.hidden = true;
    ciz();
    duyur(k.ad + ' için 3 günlük gözlem başladı.');
    var kart = $('.kd-at-kayit[data-id="' + k.id + '"]');
    if (kart) { kart.classList.add('kd-at-kayit--yeni'); var h = kart.querySelector('h3'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } kart.scrollIntoView({ block: 'nearest', behavior: hareketAz() ? 'auto' : 'smooth' }); }
  }
  function hareketAz() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } }

  /* ---------- Süren gözlem kartları ---------- */
  var sonMesaj = null; // { tur, ad, id }
  function ipucuMetni(k) {
    var belirtiler = [], hepsiYok = true, kayitli = 0;
    k.gun.forEach(function (g) {
      if (g.b.length) kayitli++;
      if (!(g.b.length === 1 && g.b[0] === 'yok')) hepsiYok = false;
      g.b.forEach(function (b) { if (b !== 'yok' && belirtiler.indexOf(b) < 0) belirtiler.push(b); });
    });
    if (belirtiler.length === 1 && belirtiler[0] === 'agiz') return { m: 'Yalnız ağız çevresinde kızarıklık not ettiniz. Bu çoğu zaman temasla oluşur ve alerji değildir; yine de yayılırsa ya da başka belirti eşlik ederse doktorunuza danışın.', o: 'tekrar' };
    if (belirtiler.length) return { m: 'Not ettiğiniz belirtiler var. Emin değilseniz "Emin değilim"i, belirgin bir tepki gördüyseniz "Tepki gördüm"ü seçin ve notlarınızı doktorunuzla paylaşın.', o: 'tepki' };
    if (kayitli === 3 && hepsiYok) return { m: 'Üç gün boyunca belirti not etmediniz. "Tolere etti"yi seçip bu besini düzenli olarak sofrada tutabilirsiniz.', o: 'tolere' };
    return { m: 'Her gün bir işaret yeterli. Gözlem bittiğinde ya da bir tepki görürseniz sonucu seçin.', o: null };
  }

  function gunHtml(k, i) {
    var g = k.gun[i], t = gunEkle(k.bas, i), f = fark(t, bugun());
    var zaman = f > 0 ? 'gecmis' : f === 0 ? 'bugun' : 'gelecek';
    var kapali = zaman === 'gelecek';
    var cipler = BELIRTI.map(function (b) {
      var bas = g.b.indexOf(b[0]) > -1;
      return '<button type="button" class="kd-at-cip' + (b[0] === 'yok' ? ' kd-at-cip--yok' : '') + '" data-b="' + b[0] + '" aria-pressed="' + bas + '"' + (kapali ? ' disabled' : '') + '>' +
        (b[0] === 'yok' ? '<i class="fa-solid fa-check" aria-hidden="true"></i> ' : '') + esc(b[1]) + '</button>';
    }).join('');
    var notId = 'atNot-' + k.id + '-' + i;
    return '<section class="kd-at-gun" data-gun="' + i + '" data-zaman="' + zaman + '">' +
      '<h4><span>Gün ' + (i + 1) + '</span><small>' + esc(goster(t, true)) + '</small>' + (zaman === 'bugun' ? '<em>Bugün</em>' : '') + (kapali ? '<em class="kd-at-gun__sonra">Henüz gelmedi</em>' : '') + '</h4>' +
      '<div class="kd-at-ciplar" role="group" aria-label="Gün ' + (i + 1) + ' belirtileri">' + cipler + '</div>' +
      '<p class="kd-at-agiz" data-agiz' + (g.b.indexOf('agiz') > -1 ? '' : ' hidden') + '><i class="fa-solid fa-lightbulb" aria-hidden="true"></i> <span>Yalnız ağız çevresindeki hafif kızarıklık çoğu zaman alerji değildir (ör. asitli besinlerin teması). Yine de not etmeniz iyi olur.</span></p>' +
      '<label class="kd-gizli" for="' + notId + '">Gün ' + (i + 1) + ' notu</label>' +
      '<textarea id="' + notId + '" rows="2" maxlength="300" placeholder="' + (kapali ? 'Bu gün geldiğinde not ekleyebilirsiniz' : 'Not: ne kadar yedi, nasıl hazırladınız…') + '"' + (kapali ? ' disabled' : '') + '>' + esc(g.n) + '</textarea>' +
      '</section>';
  }

  function kayitHtml(k) {
    var gun = Math.min(3, Math.max(1, fark(k.bas, bugun()) + 1));
    var ip = ipucuMetni(k);
    var adim = [0, 1, 2].map(function (i) { return '<span class="' + (i < gun ? 'kd-dolu' : '') + '"></span>'; }).join('');
    var dugme = function (tur, ikon, metin) {
      return '<button type="button" class="kd-at-sonuc-btn' + (ip.o === tur ? ' kd-onerilen' : '') + '" data-sonuc="' + tur + '"><i class="fa-solid fa-' + ikon + '" aria-hidden="true"></i> ' + metin + '</button>';
    };
    return '<article class="kd-at-kayit" data-id="' + k.id + '">' +
      '<header class="kd-at-kayit__bas"><div><span class="kd-at-kayit__etiket">Gözlemde</span><h3>' + esc(k.ad) + '</h3>' +
      '<p>' + esc(goster(k.bas, true)) + ' başladı · <b>Gün ' + gun + ' / 3</b></p></div>' +
      '<div class="kd-at-adim" role="img" aria-label="3 günün ' + gun + '. günü">' + adim + '</div></header>' +
      '<div class="kd-at-gunler">' + [0, 1, 2].map(function (i) { return gunHtml(k, i); }).join('') + '</div>' +
      '<div class="kd-at-sonuc"><p class="kd-at-sonuc__ipucu" data-ipucu>' + esc(ip.m) + '</p>' +
      '<div class="kd-at-sonuc__dugmeler" role="group" aria-label="' + esc(k.ad) + ' gözlem sonucu">' +
      dugme('tolere', 'face-smile', 'Tolere etti') + dugme('tekrar', 'rotate', 'Emin değilim, tekrar denerim') + dugme('tepki', 'user-doctor', 'Tepki gördüm') + '</div>' +
      '<button type="button" class="kd-at-iptal" data-iptal>Bu gözlemi sil</button></div>' +
      '</article>';
  }

  function mesajHtml() {
    if (!sonMesaj) return '';
    var m = sonMesaj, ad = esc(m.ad), geri = '<button type="button" class="kd-at-geri" data-geri="' + m.id + '">Geri al</button>';
    if (m.tur === 'tolere') return '<div class="kd-at-mesaj" data-renk="mint" role="status"><i class="fa-solid fa-face-smile" aria-hidden="true"></i><div><b>Harika, ' + ad + ' tanıştı.</b><p>Artık "Düzenli devam" listesinde. Tolere edilen alerjenleri düzenli olarak (ör. haftada birkaç kez) sofrada tutmak önerilir.</p>' + geri + '</div></div>';
    if (m.tur === 'tekrar') return '<div class="kd-at-mesaj" data-renk="sari" role="status"><i class="fa-solid fa-rotate" aria-hidden="true"></i><div><b>' + ad + ' için tekrar denenecek.</b><p>Birkaç gün sonra aynı besini yeniden deneyebilirsiniz. Kararsız kalırsanız çocuk doktorunuza danışın.</p><button type="button" class="kd-btn kd-btn--kucuk" data-yeniden="' + m.id + '">Şimdi yeniden başlat</button> ' + geri + '</div></div>';
    return '<div class="kd-at-mesaj kd-at-mesaj--tepki" role="status"><i class="fa-solid fa-user-doctor" aria-hidden="true"></i><div><b>' + ad + ' için tepki not edildi.</b><p>Bu besini yeniden vermeden önce çocuk doktorunuzla konuşun ve notlarınızı paylaşın (yazdırılabilir özet aşağıda). Nefes darlığı, yüzde şişme ya da yaygın kurdeşen gibi acil belirtilerde 112\'yi arayın.</p>' + geri + '</div></div>';
  }

  function surenCiz() {
    var liste = $('[data-at-suren-liste]');
    var aktif = suren().sort(function (a, b) { return b.ts - a.ts; });
    var html = mesajHtml();
    if (!aktif.length) {
      var bosG = document.querySelector('[data-at-bos-gorsel]');
      html += '<div class="kd-at-bos">' + (bosG && bosG.innerHTML.trim() ? '<span class="kd-ar-bos" aria-hidden="true">' + bosG.innerHTML + '</span>' : '<span class="kd-at-bos__ikon" aria-hidden="true"><i class="fa-regular fa-calendar-check"></i></span>') + '<div><b>Şu an süren gözlem yok</b><p>Yukarıdan bir besin seçip başlangıç tarihini girin; Gün 1, 2 ve 3 kartları burada açılır.</p></div></div>';
    } else html += aktif.map(kayitHtml).join('');
    liste.innerHTML = html;
    $('#atSurenBaslik').textContent = aktif.length > 1 ? 'Süren gözlemler (' + aktif.length + ')' : 'Süren gözlem';
  }

  /* ---------- Harita, düzenli devam, geçmiş ---------- */
  function sonKayit(k) {
    var l = veri.kayitlar.filter(function (x) { return x.k === k; }).sort(function (a, b) { return b.ts - a.ts; });
    return l[0] || null;
  }
  var HARITA = { yok: 'Henüz denenmedi', gozlem: 'Gözlemde', tolere: 'Tanıştı', tekrar: 'Tekrar denenecek', tepki: 'Doktora danışın' };
  function haritaCiz() {
    $$('[data-at-harita] li').forEach(function (li) {
      var s = sonKayit(li.getAttribute('data-alerjen'));
      var d = !s ? 'yok' : !s.sonuc ? 'gozlem' : s.sonuc;
      li.setAttribute('data-durum', d);
      li.querySelector('.kd-at-harita__durum').textContent = HARITA[d];
    });
  }
  function sonVerilme(k) {
    var son = gunEkle(k.bas, 2);
    if (fark(son, bugun()) < 0) son = bugun();
    (k.ver || []).forEach(function (v) { if (fark(son, v) > 0) son = v; });
    return son;
  }
  function devamListesi() {
    // tolere edilenler: her besin için en son kayıt tolere ise
    var gorulen = {}, l = [];
    veri.kayitlar.slice().sort(function (a, b) { return b.ts - a.ts; }).forEach(function (k) {
      var anahtar = k.k === 'ozel' ? 'ozel:' + k.ad.toLocaleLowerCase('tr') : k.k;
      if (gorulen[anahtar]) return; gorulen[anahtar] = true;
      if (k.sonuc === 'tolere') l.push(k);
    });
    return l;
  }
  function devamCiz() {
    var kutu = $('[data-at-devam]'), l = devamListesi();
    if (!l.length) { kutu.innerHTML = '<p class="kd-at-yan-bos">Tolere edilen besinler burada listelenir; son verilme gününü takip edebilirsiniz.</p>'; return; }
    kutu.innerHTML = '<ul class="kd-at-devam">' + l.map(function (k) {
      var son = sonVerilme(k), n = fark(son, bugun()), bugunVerildi = n <= 0;
      return '<li data-id="' + k.id + '"' + (n > 7 ? ' data-uzun' : '') + '><div><b>' + esc(k.ad) + '</b><small>Son verilme: ' + onceMetni(n) + (n > 7 ? ' · bu hafta sofraya ekleyin' : '') + '</small></div>' +
        '<button type="button" class="kd-btn kd-btn--kucuk' + (bugunVerildi ? ' kd-btn--hafif' : '') + '" data-verdim' + (bugunVerildi ? ' disabled' : '') + '>' +
        (bugunVerildi ? '<i class="fa-solid fa-check" aria-hidden="true"></i> Bugün verildi' : 'Bugün verdim') + '<span class="kd-gizli"> (' + esc(k.ad) + ')</span></button></li>';
    }).join('') + '</ul>';
  }
  function gecmisCiz() {
    var l = veri.kayitlar.filter(function (k) { return k.sonuc; }).sort(function (a, b) { return b.ts - a.ts; });
    $('[data-at-gecmis-bolum]').hidden = !l.length;
    $('[data-at-gecmis]').innerHTML = l.map(function (k) {
      return '<li data-sonuc="' + k.sonuc + '"><span><b>' + esc(k.ad) + '</b><small>' + esc(goster(k.bas, true)) + ' · ' + esc(SONUC_AD[k.sonuc] || '') + '</small></span>' +
        (k.sonuc === 'tekrar' ? '<button type="button" class="kd-at-geri" data-yeniden="' + k.id + '">Yeniden dene</button>' : '') + '</li>';
    }).join('');
  }

  /* ---------- Yazdırılabilir özet ---------- */
  function ozetCiz() {
    var l = veri.kayitlar.slice().sort(function (a, b) { return a.ts - b.ts; });
    var satir = l.map(function (k) {
      var gunler = k.gun.map(function (g) {
        var b = g.b.map(function (x) { return BELIRTI_AD[x] || x; }).join(', ') || '—';
        return '<td>' + esc(b) + (g.n ? '<br><i>' + esc(g.n) + '</i>' : '') + '</td>';
      }).join('');
      return '<tr><th scope="row">' + esc(k.ad) + '</th><td>' + esc(goster(k.bas, true)) + '</td>' + gunler + '<td>' + esc(k.sonuc ? SONUC_AD[k.sonuc] : 'Gözlemde') + '</td><td>' + (k.sonuc === 'tolere' ? esc(goster(sonVerilme(k), true)) : '—') + '</td></tr>';
    }).join('');
    $('[data-at-ozet]').innerHTML = '<div class="kd-ar-yazdir__bas"><b>Dada Gastro Kids · Alerjen tanıştırma gözlem özeti</b><span>Yazdırma: ' + esc(goster(bugun())) + '</span></div>' +
      (l.length ? '<table class="kd-ar-tablo"><thead><tr><th scope="col">Besin</th><th scope="col">Başlangıç</th><th scope="col">Gün 1</th><th scope="col">Gün 2</th><th scope="col">Gün 3</th><th scope="col">Sonuç</th><th scope="col">Son verilme</th></tr></thead><tbody>' + satir + '</tbody></table>' : '<p>Henüz kayıt yok.</p>') +
      '<p class="kd-ar-yazdir__not">Ebeveyn gözlem notlarıdır; tanı değildir. "3 günlük gözlem" yaygın bir uygulamadır, kesin tıbbi kural değildir. Acil belirtilerde 112.</p>';
  }

  function ciz() { surenCiz(); haritaCiz(); devamCiz(); gecmisCiz(); ozetCiz(); depoNotu(); }

  /* ---------- Etkileşimler (olay delegasyonu) ---------- */
  kok.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t || t.disabled) return;
    var kart = t.closest('.kd-at-kayit'), k = kart ? bul(kart.getAttribute('data-id')) : null;

    if (t.classList.contains('kd-at-cip') && k) {
      var gunEl = t.closest('.kd-at-gun'), i = +gunEl.getAttribute('data-gun'), g = k.gun[i], b = t.getAttribute('data-b');
      var var_ = g.b.indexOf(b) > -1;
      if (var_) g.b = g.b.filter(function (x) { return x !== b; });
      else if (b === 'yok') g.b = ['yok'];
      else g.b = g.b.filter(function (x) { return x !== 'yok'; }).concat(b);
      kaydet();
      $$('.kd-at-cip', gunEl).forEach(function (c) { c.setAttribute('aria-pressed', String(g.b.indexOf(c.getAttribute('data-b')) > -1)); });
      $('[data-agiz]', gunEl).hidden = g.b.indexOf('agiz') < 0;
      var ip = ipucuMetni(k);
      $('[data-ipucu]', kart).textContent = ip.m;
      $$('.kd-at-sonuc-btn', kart).forEach(function (s) { s.classList.toggle('kd-onerilen', s.getAttribute('data-sonuc') === ip.o); });
      ozetCiz();
      return;
    }
    if (t.hasAttribute('data-sonuc') && k) {
      k.sonuc = t.getAttribute('data-sonuc'); k.bitis = bugun(); kaydet();
      sonMesaj = { tur: k.sonuc, ad: k.ad, id: k.id };
      ciz(); duyur(k.ad + ': ' + SONUC_AD[k.sonuc] + '.');
      var m = $('.kd-at-mesaj'); if (m) { m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: false }); }
      return;
    }
    if (t.hasAttribute('data-iptal') && k) {
      if (t.getAttribute('data-onay') !== '1') { t.setAttribute('data-onay', '1'); t.textContent = 'Emin misiniz? Silmek için tekrar dokunun'; t.classList.add('kd-at-iptal--onay'); return; }
      veri.kayitlar = veri.kayitlar.filter(function (x) { return x !== k; }); kaydet(); sonMesaj = null; ciz(); duyur(k.ad + ' gözlemi silindi.');
      return;
    }
    if (t.hasAttribute('data-geri')) {
      var g2 = bul(t.getAttribute('data-geri')); if (!g2) return;
      g2.sonuc = null; delete g2.bitis; kaydet(); sonMesaj = null; ciz(); duyur(g2.ad + ' gözlemi yeniden süren listede.');
      return;
    }
    if (t.hasAttribute('data-yeniden')) {
      var eski = bul(t.getAttribute('data-yeniden')); if (!eski) return;
      var sec = form.querySelector('input[name="alerjen"][value="' + eski.k + '"]');
      if (sec) { sec.checked = true; ozelKutu.hidden = eski.k !== 'ozel'; if (eski.k === 'ozel') ozelGirdi.value = eski.ad; }
      tarihAyarla(bugun());
      if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true }));
      return;
    }
    if (t.hasAttribute('data-verdim')) {
      var d = bul(t.closest('li').getAttribute('data-id')); if (!d) return;
      d.ver = (d.ver || []).filter(function (v) { return v !== bugun(); }).concat(bugun()); kaydet();
      devamCiz(); ozetCiz(); duyur(d.ad + ': bugün verildi olarak işaretlendi.');
      var yeni = $('[data-at-devam] li[data-id="' + d.id + '"] button'); if (yeni) { yeni.setAttribute('tabindex', '-1'); yeni.focus(); }
      return;
    }
  });
  var notZaman;
  kok.addEventListener('input', function (e) {
    var ta = e.target; if (ta.tagName !== 'TEXTAREA') return;
    var kart = ta.closest('.kd-at-kayit'), k = kart && bul(kart.getAttribute('data-id')); if (!k) return;
    k.gun[+ta.closest('.kd-at-gun').getAttribute('data-gun')].n = ta.value.slice(0, 300);
    clearTimeout(notZaman); notZaman = setTimeout(function () { kaydet(); ozetCiz(); }, 300);
  });

  /* ---------- Yazdır + tümünü sil (iki adımlı, sayfa içi) ---------- */
  $('[data-at-yazdir]').addEventListener('click', function () { ozetCiz(); try { window.print(); } catch (e) { /* yok say */ } });
  var silBtn = $('[data-at-sil]'), silOnay = $('#atSilOnay');
  silBtn.addEventListener('click', function () {
    var ac = silOnay.hidden; silOnay.hidden = !ac; silBtn.setAttribute('aria-expanded', String(ac));
    if (ac) $('[data-at-sil-hayir]').focus();
  });
  $('[data-at-sil-hayir]').addEventListener('click', function () { silOnay.hidden = true; silBtn.setAttribute('aria-expanded', 'false'); silBtn.focus(); });
  $('[data-at-sil-evet]').addEventListener('click', function () {
    veri = bos(); depo.sil(); sonMesaj = null; ciz();
    silOnay.hidden = true; silBtn.setAttribute('aria-expanded', 'false'); silBtn.focus();
    duyur('Tüm gözlem kayıtları silindi.');
  });

  // gün değişimi (sayfa açık kalırsa) — sekmeye dönüldüğünde yeniden çiz
  var sonGun = bugun();
  document.addEventListener('visibilitychange', function () { if (!document.hidden && bugun() !== sonGun) { sonGun = bugun(); if (tarihGirdi.value > sonGun) tarihAyarla(sonGun); ciz(); } });

  ciz();
})();
