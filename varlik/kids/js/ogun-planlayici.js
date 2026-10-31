/* Dada Kids — Haftalık öğün planlayıcı (sahibi: araçlar kolu)
   Veri: sayfaya gömülü #kdTarifVeri (derlemede). Kalıcılık: localStorage "dadakids.ogunPlani.v1" (try/catch). */
(function () {
  'use strict';
  var kok = document.getElementById('kdPlanlayici');
  var veriEl = document.getElementById('kdTarifVeri');
  if (!kok || !veriEl) return;

  var ANAHTAR = 'dadakids.ogunPlani.v1';
  var TARIF = [];
  try { TARIF = JSON.parse(veriEl.textContent || '[]') || []; } catch (e) { TARIF = []; }
  var T = {}; TARIF.forEach(function (t) { T[t.s] = t; });
  var KOVALAR = [6, 8, 9, 12, 18, 24];
  var KOVA_AD = { 6: '+6 Ay', 8: '+8 Ay', 9: '+9 Ay', 12: '+12 Ay', 18: '+18 Ay', 24: '2–3 Yaş' };
  var GUNLER = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  var SLOT = [
    { k: 'kahvalti', ad: 'Kahvaltı', ogun: 'kahvalti' },
    { k: 'ogle', ad: 'Öğle', ogun: 'ana' },
    { k: 'aksam', ad: 'Akşam', ogun: 'ana' },
    { k: 'ara', ad: 'Ara öğün', ogun: 'ara' }
  ];
  var ALERJEN_AD = {};
  var IPUCU = {
    6: '<b>+6 ay:</b> Başlangıçta günde 1 öğün yeterli; birkaç hafta içinde 2–3 öğüne çıkılır. Anne sütü ya da formül mama ana besin olmaya devam eder. Ara öğün otomatik doldurulmaz.',
    8: '<b>+8 ay:</b> Günde 2–3 öğün yeterli; süt hâlâ ana besin. Ara öğün otomatik doldurulmaz, isterseniz kendiniz ekleyin.',
    9: '<b>+9 ay:</b> Günde 3 öğün ve 1–2 ara öğün. Parmak gıdalarla kendi kendine yemeyi destekleyin.',
    12: '<b>+12 ay:</b> Günde 3 ana öğün ve 1–2 ara öğün; aile sofrasına katılım başlar.',
    18: '<b>+18 ay:</b> Günde 3 ana öğün ve 1–2 ara öğün. İştah günden güne değişebilir; bu olağandır.',
    24: '<b>2–3 yaş:</b> Günde 3 ana öğün ve 1–2 ara öğün; aile ile aynı sofrada, çocuk porsiyonunda.'
  };

  var $ = function (s, k) { return (k || kok).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || kok).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  $$('[data-pl-haric] input').forEach(function (i) { ALERJEN_AD[i.value] = i.parentNode.textContent.trim(); });

  /* ---------- Depolama ---------- */
  var depo = (function () {
    var acik = false, bellek = null;
    try { var ls = window.localStorage, t = '__kd_deneme'; ls.setItem(t, '1'); ls.removeItem(t); acik = true; } catch (e) { acik = false; }
    return {
      acik: function () { return acik; },
      oku: function () { if (!acik) return bellek; try { var s = window.localStorage.getItem(ANAHTAR); return s ? JSON.parse(s) : null; } catch (e) { return bellek; } },
      yaz: function (v) { bellek = v; if (!acik) return; try { window.localStorage.setItem(ANAHTAR, JSON.stringify(v)); } catch (e) { acik = false; $('[data-pl-depo-yok]').hidden = false; } }
    };
  })();

  function profilKova() {
    try { var k = window.DadaKids && window.DadaKids.kova && window.DadaKids.kova(); return KOVALAR.indexOf(k) > -1 ? k : null; } catch (e) { return null; }
  }
  var d = (function () {
    var v = depo.oku() || {};
    var yas = KOVALAR.indexOf(v.yas) > -1 ? v.yas : (profilKova() || 6);
    var plan = {};
    if (v.plan && typeof v.plan === 'object') Object.keys(v.plan).forEach(function (k) { if (T[v.plan[k]]) plan[k] = v.plan[k]; });
    return { yas: yas, haric: Array.isArray(v.haric) ? v.haric.filter(function (a) { return ALERJEN_AD[a]; }) : [], plan: plan, alindi: (v.alindi && typeof v.alindi === 'object') ? v.alindi : {} };
  })();
  function kaydet() { depo.yaz(d); }

  /* ---------- Profil bağları (dinamik bağlar kids.js'ten sonra oluşur) ---------- */
  function href(slug) {
    var p = new URLSearchParams(); p.set('t', slug);
    try {
      var pr = window.DadaKids && window.DadaKids.profil;
      if (pr) { if (pr.evre) p.set('evre', pr.evre); if (pr.c && pr.c !== 'belirtilmedi') p.set('c', pr.c); if (pr.ay !== null && pr.ay !== undefined) p.set('ay', String(pr.ay)); }
    } catch (e) { /* yok say */ }
    return 'kids-tarif.html?' + p.toString();
  }

  /* ---------- Uygunluk ---------- */
  function uygun(t, slot) {
    if (!t || t.y > d.yas) return false;
    if ((t.o || []).indexOf(slot.ogun) < 0) return false;
    for (var i = 0; i < d.haric.length; i++) if ((t.al || []).indexOf(d.haric[i]) > -1) return false;
    return true;
  }
  function adaylar(slot) { return TARIF.filter(function (t) { return uygun(t, slot); }); }
  function anahtar(g, s) { return g + '-' + s.k; }
  function slotBul(k) { for (var i = 0; i < SLOT.length; i++) if (SLOT[i].k === k) return SLOT[i]; return null; }

  function uygunsuzlariAyikla() {
    var n = 0;
    Object.keys(d.plan).forEach(function (k) {
      var s = slotBul(k.split('-')[1]);
      if (!s || !uygun(T[d.plan[k]], s)) { delete d.plan[k]; n++; }
    });
    return n;
  }

  /* ---------- Öneri ---------- */
  function kullanimSay() { var c = {}; Object.keys(d.plan).forEach(function (k) { c[d.plan[k]] = (c[d.plan[k]] || 0) + 1; }); return c; }
  function sec(g, s, haric) {
    var gunde = {};
    SLOT.forEach(function (x) { var v = d.plan[anahtar(g, x)]; if (v && x !== s) gunde[v] = true; });
    var dun = d.plan[anahtar((g + 6) % 7, s)];
    var c = kullanimSay();
    var l = adaylar(s).filter(function (t) { return !gunde[t.s] && t.s !== haric; });
    if (!l.length) return null;
    var dunsuz = l.filter(function (t) { return t.s !== dun; });
    if (dunsuz.length) l = dunsuz;
    var en = Math.min.apply(null, l.map(function (t) { return c[t.s] || 0; }));
    l = l.filter(function (t) { return (c[t.s] || 0) === en; });
    return l[Math.floor(Math.random() * l.length)].s;
  }
  function doldur() {
    var dolu = tumuDolu();
    if (dolu) d.plan = {};
    var bos = 0;
    for (var g = 0; g < 7; g++) SLOT.forEach(function (s) {
      if (s.k === 'ara' && d.yas < 9) return;
      var k = anahtar(g, s); if (d.plan[k]) return;
      var t = sec(g, s); if (t) d.plan[k] = t; else bos++;
    });
    kaydet(); ciz();
    duyur(dolu ? 'Plan yeni önerilerle yenilendi.' : 'Boş öğünler önerilerle dolduruldu.' + (bos ? ' ' + bos + ' öğün için uygun tarif bulunamadı.' : ''));
  }
  function doldurulabilir() { var n = 0; SLOT.forEach(function (s) { if (!(s.k === 'ara' && d.yas < 9)) n += 7; }); return n; }
  function tumuDolu() {
    var n = 0; for (var g = 0; g < 7; g++) SLOT.forEach(function (s) { if (!(s.k === 'ara' && d.yas < 9) && d.plan[anahtar(g, s)]) n++; });
    return n >= doldurulabilir();
  }

  /* ---------- Çizim ---------- */
  function slotHtml(g, s) {
    var k = anahtar(g, s), t = T[d.plan[k]], l = adaylar(s);
    var etiket = GUNLER[g] + ' ' + s.ad.toLocaleLowerCase('tr');
    var secenek = '<option value="">' + (t ? 'Değiştir…' : (l.length ? 'Tarif seç…' : 'Uygun tarif yok')) + '</option>' +
      l.map(function (x) { return '<option value="' + esc(x.s) + '">' + esc(x.a) + '</option>'; }).join('');
    var id = 'pl-' + k;
    return '<div class="kd-pl-slot" data-slot="' + k + '"' + (t ? ' data-dolu' : '') + '>' +
      '<span class="kd-pl-slot__ogun" aria-hidden="true">' + s.ad + '</span>' +
      (t ? '<a class="kd-pl-slot__tarif" href="' + esc(href(t.s)) + '"><span class="kd-pl-slot__resim">' + (t.g ? '<img src="' + esc(t.g) + '" alt="" width="56" height="42" loading="lazy" decoding="async">' : '') + '</span><span class="kd-pl-slot__ad">' + esc(t.a) + '<span class="kd-gizli"> (' + esc(etiket) + ')</span></span></a>'
        : '<span class="kd-pl-slot__bos">' + (s.k === 'ara' && d.yas < 9 ? 'İsteğe bağlı' : 'Boş') + '</span>') +
      '<span class="kd-pl-slot__kontrol">' +
      '<label class="kd-gizli" for="' + id + '">' + esc(etiket) + ' için tarif seç</label>' +
      '<select id="' + id + '" class="kd-pl-sec" data-sec' + (l.length ? '' : ' disabled') + '>' + secenek + '</select>' +
      '<button type="button" class="kd-pl-ikon" data-oner' + (l.length > (t ? 1 : 0) ? '' : ' disabled') + ' aria-label="' + esc(etiket) + ' için ' + (t ? 'başka öneri' : 'öneri') + '" title="' + (t ? 'Başka öneri' : 'Öner') + '"><i class="fa-solid fa-shuffle" aria-hidden="true"></i></button>' +
      (t ? '<button type="button" class="kd-pl-ikon" data-bosalt aria-label="' + esc(etiket) + ' öğününü boşalt" title="Boşalt"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' : '') +
      '</span></div>';
  }
  function izgaraCiz() {
    var html = '<div class="kd-pl-satir kd-pl-satir--bas" aria-hidden="true"><span></span>' + SLOT.map(function (s) { return '<span>' + s.ad + '</span>'; }).join('') + '</div>';
    for (var g = 0; g < 7; g++) {
      html += '<div class="kd-pl-satir" role="group" aria-labelledby="plGun' + g + '"><h3 class="kd-pl-gun" id="plGun' + g + '"><span>' + GUNLER[g] + '</span><small>' + gunOzet(g) + '</small></h3>' +
        SLOT.map(function (s) { return slotHtml(g, s); }).join('') + '</div>';
    }
    $('[data-pl-izgara]').innerHTML = html;
  }
  function gunOzet(g) { var n = 0; SLOT.forEach(function (s) { if (d.plan[anahtar(g, s)]) n++; }); return n ? n + ' öğün' : 'boş'; }
  function slotYenile(k) {
    var el = $('.kd-pl-slot[data-slot="' + k + '"]'); if (!el) return;
    var p = k.split('-'), g = +p[0], s = slotBul(p[1]);
    el.outerHTML = slotHtml(g, s);
    var gEl = $('#plGun' + g + ' small'); if (gEl) gEl.textContent = gunOzet(g);
  }

  function listeCiz() {
    var harita = {}, sira = [], eksik = {}, tarifSay = 0, evde = false;
    Object.keys(d.plan).forEach(function (k) {
      var t = T[d.plan[k]]; if (!t) return; tarifSay++;
      if (!t.m || !t.m.length) { eksik[t.s] = true; return; }
      t.m.forEach(function (m) {
        var a = m.k; if (!a) { evde = true; return; }
        if (!harita[a]) { harita[a] = { ad: m.a || a, kez: 0, miktar: [], tarif: {} }; sira.push(a); }
        var h = harita[a];
        if (m.a && m.a.length < h.ad.length) h.ad = m.a; // en kısa ad: "Havuç" > "Rendelenmiş havuç"
        h.kez++; h.tarif[t.a] = true;
        if (m.q && h.miktar.indexOf(m.q) < 0) h.miktar.push(m.q);
      });
    });
    sira.sort(function (a, b) { return harita[a].ad.localeCompare(harita[b].ad, 'tr'); });
    var ul = $('[data-pl-malz]'), bos = $('[data-pl-malz-bos]'), ozet = $('[data-pl-liste-ozet]'), kop = $('[data-pl-kopyala]');
    ul.innerHTML = sira.map(function (a, i) {
      var h = harita[a], id = 'plM' + i, ad = h.ad.charAt(0).toLocaleUpperCase('tr') + h.ad.slice(1);
      var tarifler = Object.keys(h.tarif);
      return '<li' + (d.alindi[a] ? ' data-alindi' : '') + '><input type="checkbox" id="' + id + '" data-malz="' + esc(a) + '"' + (d.alindi[a] ? ' checked' : '') + '>' +
        '<label for="' + id + '"><b>' + esc(ad) + '</b>' + (h.kez > 1 ? '<span class="kd-pl-malz__kez">× ' + h.kez + '</span>' : '') +
        '<small>' + esc(h.miktar.slice(0, 3).join(' · ')) + (h.miktar.length > 3 ? ' …' : '') + (tarifler.length ? ' — ' + esc(tarifler.slice(0, 2).join(', ')) + (tarifler.length > 2 ? ' +' + (tarifler.length - 2) : '') : '') + '</small></label></li>';
    }).join('');
    var eksikSay = Object.keys(eksik).length;
    kop.hidden = !sira.length;
    if (!tarifSay) { ozet.textContent = 'Plan doldukça malzemeler burada toplanır.'; bos.hidden = false; bos.textContent = 'Henüz öğün seçilmedi. "Önerilerle doldur" ile başlayabilirsiniz.'; return; }
    ozet.textContent = sira.length + ' malzeme · ' + tarifSay + ' öğün' + (evde ? ' · su ve anne sütü / formül mama listeye eklenmez' : '');
    if (!sira.length) { bos.hidden = false; bos.textContent = 'Seçtiğiniz tariflerin malzeme listeleri henüz hazırlanıyor; eklendiğinde liste burada kendiliğinden oluşur.'; return; }
    bos.hidden = !eksikSay;
    bos.textContent = eksikSay ? eksikSay + ' tarifin malzeme listesi henüz eklenmedi; liste eksik olabilir.' : '';
  }

  function ayarCiz() {
    $$('[data-pl-yas] input').forEach(function (i) { i.checked = +i.value === d.yas; });
    $$('[data-pl-haric] input').forEach(function (i) { i.checked = d.haric.indexOf(i.value) > -1; });
    var say = TARIF.filter(function (t) { return t.y <= d.yas && !t.al.some(function (a) { return d.haric.indexOf(a) > -1; }); }).length;
    $('[data-pl-ipucu]').innerHTML = (IPUCU[d.yas] || '') + ' <span class="kd-pl-ipucu__say">Bu seçimlere uygun ' + say + ' tarif var.</span>';
    $('[data-pl-doldur]').innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ' + (tumuDolu() ? 'Yeniden öner' : 'Önerilerle doldur');
    $('[data-pl-yazdir-ozet]').textContent = KOVA_AD[d.yas] + (d.haric.length ? ' · İçermez: ' + d.haric.map(function (a) { return ALERJEN_AD[a]; }).join(', ') : '');
  }
  function ciz() { ayarCiz(); izgaraCiz(); listeCiz(); }
  function duyur(m) { var el = $('[data-pl-duyuru]'); if (!el) { el = document.createElement('p'); el.className = 'kd-gizli'; el.setAttribute('role', 'status'); el.setAttribute('data-pl-duyuru', ''); kok.appendChild(el); } el.textContent = ''; setTimeout(function () { el.textContent = m; }, 30); }

  /* ---------- Etkileşim ---------- */
  $('[data-pl-yas]').addEventListener('change', function (e) {
    d.yas = +e.target.value; var n = uygunsuzlariAyikla(); kaydet(); ciz();
    duyur(KOVA_AD[d.yas] + ' seçildi.' + (n ? ' Bu yaşa uymayan ' + n + ' öğün boşaltıldı.' : ''));
  });
  $('[data-pl-haric]').addEventListener('change', function () {
    d.haric = $$('[data-pl-haric] input:checked').map(function (i) { return i.value; });
    var n = uygunsuzlariAyikla(); kaydet(); ciz();
    if (n) duyur(n + ' öğün seçilen alerjeni içerdiği için boşaltıldı.');
  });
  $('[data-pl-doldur]').addEventListener('click', doldur);
  var temBtn = $('[data-pl-temizle]'), temOnay = $('#plTemizleOnay');
  temBtn.addEventListener('click', function () { var ac = temOnay.hidden; temOnay.hidden = !ac; temBtn.setAttribute('aria-expanded', String(ac)); if (ac) $('[data-pl-temizle-hayir]').focus(); });
  $('[data-pl-temizle-hayir]').addEventListener('click', function () { temOnay.hidden = true; temBtn.setAttribute('aria-expanded', 'false'); temBtn.focus(); });
  $('[data-pl-temizle-evet]').addEventListener('click', function () {
    d.plan = {}; d.alindi = {}; kaydet(); ciz(); temOnay.hidden = true; temBtn.setAttribute('aria-expanded', 'false'); temBtn.focus(); duyur('Plan temizlendi.');
  });
  $('[data-pl-yazdir]').addEventListener('click', function () { try { window.print(); } catch (e) { /* yok say */ } });

  function odakla(k, sel) { var el = $('.kd-pl-slot[data-slot="' + k + '"] ' + sel) || $('.kd-pl-slot[data-slot="' + k + '"] [data-sec]'); if (el) el.focus(); }
  kok.addEventListener('change', function (e) {
    var s = e.target;
    if (s.hasAttribute && s.hasAttribute('data-sec')) {
      var k = s.closest('.kd-pl-slot').getAttribute('data-slot');
      if (!s.value) return;
      d.plan[k] = s.value; kaydet(); slotYenile(k); listeCiz(); ayarCiz(); odakla(k, '[data-sec]');
      duyur(T[s.value].a + ' eklendi.');
    } else if (s.hasAttribute && s.hasAttribute('data-malz')) {
      var a = s.getAttribute('data-malz');
      if (s.checked) d.alindi[a] = true; else delete d.alindi[a];
      s.closest('li').toggleAttribute('data-alindi', s.checked); kaydet();
    }
  });
  kok.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    var sl = b.closest('.kd-pl-slot'); if (!sl) return;
    var k = sl.getAttribute('data-slot'), p = k.split('-'), g = +p[0], s = slotBul(p[1]);
    if (b.hasAttribute('data-oner')) {
      var t = sec(g, s, d.plan[k]); if (!t) { duyur('Bu öğün için başka uygun tarif yok.'); return; }
      d.plan[k] = t; kaydet(); slotYenile(k); listeCiz(); ayarCiz(); odakla(k, '[data-oner]'); duyur(T[t].a + ' önerildi.');
    } else if (b.hasAttribute('data-bosalt')) {
      delete d.plan[k]; kaydet(); slotYenile(k); listeCiz(); ayarCiz(); odakla(k, '[data-sec]'); duyur('Öğün boşaltıldı.');
    }
  });
  $('[data-pl-kopyala]').addEventListener('click', function () {
    var b = this;
    var metin = 'Dada Kids alışveriş listesi (' + KOVA_AD[d.yas] + ')\n' + $$('[data-pl-malz] li').map(function (li) { return '- ' + li.querySelector('b').textContent + (li.querySelector('.kd-pl-malz__kez') ? ' ' + li.querySelector('.kd-pl-malz__kez').textContent : ''); }).join('\n');
    var tamam = function () { b.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Kopyalandı'; duyur('Liste panoya kopyalandı.'); setTimeout(function () { b.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i> Listeyi kopyala'; }, 2200); };
    var olmadi = function () { b.textContent = 'Kopyalanamadı — yazdırmayı deneyin'; };
    try { navigator.clipboard.writeText(metin).then(tamam, olmadi); } catch (e) { olmadi(); }
  });
  // eksik görseller: kutu pastel kalsın
  kok.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') e.target.hidden = true; }, true);

  if (!depo.acik()) $('[data-pl-depo-yok]').hidden = false;
  if (uygunsuzlariAyikla()) kaydet();
  ciz();
})();
