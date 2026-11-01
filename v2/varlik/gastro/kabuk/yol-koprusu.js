/* YOL KÖPRÜSÜ — prototipin `.html` adreslerini Laravel rotalarına çevirir.
 *
 * Üç kanalı da kapsar (docs/ekran-envanteri.md · App\Kabuk\YolHaritasi):
 *   (a) markup özniteliği `href` / `action`
 *   (b) satır içi `onclick="location.href='…'"`
 *   (c) ÇALIŞMA ANINDA basılan DOM — MutationObserver
 *
 * 🔴 `defer` YOK ve kabuk betiğinden ÖNCE koşar: kabuk kendi düğümlerini
 * basmadan gözlemci kurulmuş olmalı, yoksa çalışma anında doğan bağlar ilk
 * taramaya yakalanmaz.
 *
 * 🔴 ÖNEK EŞLEMESİ UZUNDAN KISAYA. Prototip düz dosya ağacı: 480 tarif
 * `tarif__<slug>.html`, 145 şef `sefler__<kullanici>.html`. Haritada tek tek
 * durmazlar; önek tablosuyla çevrilirler. Sıra sunucudan uzunluğa göre
 * sıralı gelir — `mutfaga-giris__` daha kısa olduğu için sıralanmasaydı
 * `mutfaga-giris__konu__`u yutardı ve 7 konu sayfası yanlış adrese giderdi.
 */
(function () {
  var m = document.querySelector('meta[name="dada-yollar"]');
  if (!m) return;
  var H;
  try { H = JSON.parse(m.getAttribute('content')); } catch (e) { return; }
  var AD = H.ad || {}, ONEK = H.onek || [];

  /* C1 (5 Eki): betiklerin elle yazdığı TR yol (`location.href = '/hesabim/mutfak-defterim'`) → yanıtın dilindeki yol.
     Tablo (`yerel` = TR yol → yol, `desen` = slug tablosuna bakmayan `{#}`/`{*}` desenleri) yalnız hedef dil yanıtında
     basılır (`KabukKimligi::yerelYollar`); TR'de ve tabloda olmayan yolda adres AYNEN döner. Çağıran
     `(window.dmYol || String)(yol)` yazar — betiği vm'de koşan testlerde de TR yol döner. */
  var YEREL = H.yerel || {}, DESEN = H.desen || [];
  window.dmYol = function (adres) {
    var s = String(adres), ek = '', i = s.search(/[?#]/);
    if (i > -1) { ek = s.slice(i); s = s.slice(0, i); }
    if (Object.prototype.hasOwnProperty.call(YEREL, s)) return YEREL[s] + ek;
    var yp = s.split('/');
    for (var d = 0; d < DESEN.length; d++) {
      var kp = DESEN[d][0].split('/'), deger = [], uydu = kp.length === yp.length;
      for (var j = 0; uydu && j < kp.length; j++) {
        if (kp[j] === '{#}') { uydu = /^\d+$/.test(yp[j]); deger.push(yp[j]); }
        else if (kp[j] === '{*}') { uydu = yp[j] !== ''; deger.push(yp[j]); }
        else uydu = kp[j] === yp[j];
      }
      if (uydu) { var n = 0; return DESEN[d][1].replace(/\{[#*]\}/g, function () { return deger[n++]; }) + ek; }
    }
    return adres;
  };

  function coz(h) {
    if (!h) return null;
    /* Dış adres, çapa, protokol — dokunulmaz. */
    if (/^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(h)) return null;

    var hash = '', sorgu = '', s = h;
    var hi = s.indexOf('#'); if (hi > -1) { hash = s.slice(hi); s = s.slice(0, hi); }
    var qi = s.indexOf('?'); if (qi > -1) { sorgu = s.slice(qi); s = s.slice(0, qi); }
    s = s.replace(/^\.?\//, '').replace(/^(\.\.\/)+/, '');
    if (!/\.html$/.test(s)) return null;

    /* Maketin kendi oturum bayrağı adreste taşınmaz — oturum sunucuda. */
    sorgu = sorgu.replace(/([?&])auth=1(&|$)/, function (_, a, b) { return b ? a : ''; });
    if (sorgu === '?') sorgu = '';

    var y = AD[s];

    /* 🔴 ADRESİN KİMLİĞİ SORGUDA OLABİLİR — VE SORGU BURADA ÇOKTAN KESİLMİŞTİ.
       Donörün yasal sayfası TEK dosyaydı ve hangi metni basacağını sorgudan
       okuyordu (`yasal-v1.html?metin=kvkk`); Gastro'da her metnin kendi rotası
       var (`/yasal/kvkk`). Önek eşlemesi yalnız YOLA bakınca `?metin=` taşıyan
       önek hiçbir zaman eşleşemiyordu: iki ayrı bağ aynı ada düşüyor, ad
       tabloda olmadığı için `coz()` null dönüyor ve bağ ÖLÜ kalıyordu.
       Türetme betiği ve PHP çözücüsü aynı kusuru taşıyordu, ikisi de
       düzeltildi; bu üçüncü kanal (çalışma anında JS'in yazdığı bağ). Anahtarlı
       önekler ad+sorgu ile denenir, ötekiler eskisi gibi yalnız adla. */
    if (!y) {
      var sorgulu = s + sorgu;
      for (var k = 0; k < ONEK.length; k++) {
        if (ONEK[k][0].indexOf('?') > -1 && sorgulu.indexOf(ONEK[k][0]) === 0) {
          return ONEK[k][1] + sorgulu.slice(ONEK[k][0].length) + hash;
        }
      }
    }
    if (!y) {
      for (var i = 0; i < ONEK.length; i++) {
        if (ONEK[i][0].indexOf('?') > -1) continue;
        if (s.indexOf(ONEK[i][0]) === 0) { y = ONEK[i][1] + s.slice(ONEK[i][0].length, -5); break; }
      }
    }
    return y ? y + sorgu + hash : null;
  }

  function el(n) {
    if (n.nodeType !== 1) return;
    ['href', 'action'].forEach(function (a) {
      if (!n.hasAttribute || !n.hasAttribute(a)) return;
      var y = coz(n.getAttribute(a));
      if (y) n.setAttribute(a, y);
    });
    var oc = n.getAttribute && n.getAttribute('onclick');
    if (oc && oc.indexOf('.html') > -1) {
      n.setAttribute('onclick', oc.replace(/(['"])([^'"]+\.html[^'"]*)\1/g, function (t, q, h) {
        var y = coz(h); return y ? q + y + q : t;
      }));
    }
  }

  function tara(kok) {
    el(kok);
    if (kok.querySelectorAll) {
      var l = kok.querySelectorAll('[href],[action],[onclick]');
      for (var i = 0; i < l.length; i++) el(l[i]);
    }
  }

  new MutationObserver(function (kayitlar) {
    for (var i = 0; i < kayitlar.length; i++) {
      var k = kayitlar[i];
      if (k.type === 'attributes') { el(k.target); continue; }
      for (var j = 0; j < k.addedNodes.length; j++) tara(k.addedNodes[j]);
    }
  }).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'action', 'onclick'],
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { tara(document); });
  else tara(document);
})();
