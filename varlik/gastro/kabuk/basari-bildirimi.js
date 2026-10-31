/* ORTAK BAŞARI BİLDİRİMİ — Revize 5 · madde 47.
 *
 * İletişim, destek talebi, öneri/şikâyet ve Görüş Bildir aynı bileşeni
 * kullanır: ikon + başlık + kısa metin + takip numarası (kopyala) + tek düğme.
 * Revize 7 · madde 87: ortak pencere giriş kapısının kalıbında (`.lg-gate` ·
 * `.lg-panel` · sağ üst `.lg-close`); Görüş Bildir kendi penceresinin
 * `.fb-success`ini doldurur.
 *
 *  - `GastroBasari.goster(ayar)`: sayfadaki `#basariBildirimi` penceresini
 *    doldurup açar (`parcalar/basari-bildirimi`). Yönlendirme sonrası sunucu
 *    pencereyi zaten açık basmışsa betik yalnız davranışı bağlar.
 *  - `GastroBasari.doldur(kap, ayar)`: herhangi bir `.fb-success` kabını aynı
 *    içerikle doldurur. Görüş Bildir'in kendi penceresi bunu kullanır; iki
 *    pencere üst üste açılmaz.
 *
 * ayar = { baslik, metin, takip, dugme, adres, kapaninca }
 * `adres` varsa düğme ve kapatma o adrese götürür ("Talebe git").
 */
(function () {
  'use strict';
  /* Aşama 2 · B (ajan-b4): EN sayfada kabuk sözlüğü (`KabukSozlugu`, <script type="application/json" data-l-js-kabuk>) ve
     sayfanın kendi sözlüğü (<main data-l-js>) basılı; ikisi de okunur. TR'de sözlük yok → TR yedek AYNEN döner. */
  var dmLk = window.dmLk = window.dmLk || function (k, tr, p) {
    var s = null, els = document.querySelectorAll('[data-l-js-kabuk], [data-l-js]');
    for (var i = 0; i < els.length && s === null; i++) {
      try { var a = els[i].getAttribute('data-l-js'); var o = JSON.parse(a ? a : els[i].textContent); if (o && typeof o[k] === 'string') s = o[k]; } catch (e) { /* bozuk sözlük → TR yedek */ }
    }
    var kayitli = s !== null;
    if (s === null) s = tr;
    /* Çoğul (EN): sözlük değeri 'tekil|çoğul' — sayı p.sayi, yoksa p.toplam, yoksa p.n; 1 → ilk biçim, gerisi son biçim; RU (üç kategorili dil, 20 Eki): 'bir|az|çok', kesir → az. */
    if (kayitli && s.indexOf('|') >= 0) { var cn = p ? [p.sayi, p.toplam, p.n].filter(function (x) { return x !== undefined && x !== null && x !== ''; })[0] : undefined; var cb = s.split('|'); var cbi = (function (x) { if (cb.length < 3 || typeof document === 'undefined' || typeof Intl === 'undefined') return -1; var pr = new Intl.PluralRules(document.documentElement.lang || 'tr'); if (pr.resolvedOptions().pluralCategories.indexOf('few') < 0) return -1; x = Math.abs(Number(x)) || 0; if (x !== Math.floor(x)) return 1; var k = pr.select(x); return k === 'one' ? 0 : (k === 'few' ? 1 : 2); })(cn); s = cbi >= 0 ? cb[cbi] : (Number(cn) === 1 ? cb[0] : cb[cb.length - 1]); }
    if (!p) return s;
    /* Laravel'in kuralı: adlar uzundan kısaya, doğrudan değiştirilir (`:minpx` içinde `:min` dolar). */
    Object.keys(p).sort(function (a, b) { return b.length - a.length; }).forEach(function (n) { s = s.split(':' + n).join(String(p[n])); });
    return s;
  };

  // Kopyala düğmesi donörün 2FA penceresindeki `#tfaKopyala`nın aynısı (g-hesabim.html):
  // btn-ghost · fa-copy · sonuç düğmenin kendisinde 2,5 sn (onay ya da uyarı ikonu).
  var KOPYALA = dmLk('kabuk_js.basari.kopyala', '<i class="fa-solid fa-copy" aria-hidden="true"></i> <span aria-live="polite">Kopyala</span>');

  function takipKutusu(kap) {
    var kutu = kap.querySelector('[data-basari-takip-kutu]');
    if (kutu) return kutu;
    // Görüş Bildir'in `.fb-success`inde kutu yok: partial'daki yapının aynısı kurulur.
    kutu = document.createElement('div');
    kutu.className = 'sir-kutu basari-takip';
    kutu.setAttribute('data-basari-takip-kutu', '');
    kutu.innerHTML = '<span>' + dmLk('kabuk_js.basari.takip_no', 'Takip numaran') + '</span><code data-basari-takip></code>'
      + '<button class="btn btn-ghost basari-kopyala" type="button" data-basari-kopyala>' + KOPYALA + '</button>';
    var p = kap.querySelector('p');
    if (p) p.insertAdjacentElement('afterend', kutu); else kap.appendChild(kutu);
    return kutu;
  }

  function kopyalaBagla(kap) {
    var dugme = kap.querySelector('[data-basari-kopyala]');
    if (!dugme || dugme.dataset.bagli === '1') return;
    dugme.dataset.bagli = '1';
    var zaman = null;
    function bitir(ok) {
      dugme.innerHTML = ok
        ? dmLk('kabuk_js.basari.kopyalandi', '<i class="fa-solid fa-check" aria-hidden="true"></i> <span aria-live="polite">Kopyalandı</span>')
        : dmLk('kabuk_js.basari.kopyalanamadi', '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> <span aria-live="polite">Kopyalanamadı</span>');
      clearTimeout(zaman);
      zaman = setTimeout(function () { dugme.innerHTML = KOPYALA; }, 2500);
    }
    dugme.addEventListener('click', function () {
      var kodEl = kap.querySelector('[data-basari-takip]');
      var kod = kodEl ? kodEl.textContent.trim() : '';
      var yaz = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(kod) : Promise.reject();
      yaz.then(function () { bitir(true); }, function () {
        // Pano izni yoksa numara seçili bırakılır; kullanıcı kendisi kopyalar.
        bitir(false);
        if (!kodEl) return;
        var sec = document.createRange();
        sec.selectNodeContents(kodEl);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(sec);
      });
    });
  }

  function doldur(kap, ayar) {
    var baslik = kap.querySelector('[data-basari-baslik]') || kap.querySelector('h4');
    var metin = kap.querySelector('[data-basari-metin]') || kap.querySelector('p');
    if (baslik) baslik.textContent = ayar.baslik || dmLk('kabuk_js.basari.baslik', 'Mesajın alındı');
    if (metin) metin.textContent = ayar.metin || '';
    var kutu = takipKutusu(kap);
    kutu.hidden = !ayar.takip;
    kutu.querySelector('[data-basari-takip]').textContent = ayar.takip || '';
    kopyalaBagla(kap);
    var dugme = kap.querySelector('[data-basari-tamam]') || kap.querySelector('.fb-again');
    if (dugme) {
      var ikon = dugme.querySelector('i');
      dugme.textContent = ayar.dugme || 'Tamam';
      if (ikon) dugme.insertBefore(ikon, dugme.firstChild);
      // Görüş Bildir'in `.fb-again`i de aynı düğme ölçüsünü alır (basari-bildirimi.css).
      dugme.classList.add('basari-tamam');
      if (dugme.tagName === 'A' && ayar.adres) dugme.setAttribute('href', ayar.adres);
    }
    return kap;
  }

  var acan = null;
  var ayarlar = {};

  function pencere() { return document.getElementById('basariBildirimi'); }

  function kapat() {
    var m = pencere();
    if (!m || !m.classList.contains('show')) return;
    var ortu = document.querySelector('[data-basari-ortu]');
    m.classList.remove('show');
    if (ortu) ortu.classList.remove('show');
    if (ayarlar.adres) { window.location.href = ayarlar.adres; return; }
    if (typeof ayarlar.kapaninca === 'function') ayarlar.kapaninca();
    if (acan && acan.isConnected && acan.focus) acan.focus();
    acan = null;
  }

  function odaklanabilir(m) {
    return [].slice.call(m.querySelectorAll('a[href], button')).filter(function (el) {
      return !el.disabled && el.checkVisibility && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    });
  }

  function bagla() {
    var m = pencere();
    if (!m || m.dataset.bagli === '1') return;
    m.dataset.bagli = '1';
    var ortu = document.querySelector('[data-basari-ortu]');
    var tamam = m.querySelector('[data-basari-tamam]');
    kopyalaBagla(m);
    if (tamam) tamam.addEventListener('click', function (e) { e.preventDefault(); kapat(); });
    // Revize 7 · madde 87: giriş kapısının kalıbı — sağ üst × (`.lg-close`).
    var carpi = m.querySelector('[data-basari-kapat]');
    if (carpi) carpi.addEventListener('click', kapat);
    if (ortu) ortu.addEventListener('click', kapat);
    m.addEventListener('click', function (e) { if (e.target === m) kapat(); });
    document.addEventListener('keydown', function (e) {
      if (!m.classList.contains('show')) return;
      if (e.key === 'Escape') { e.preventDefault(); kapat(); return; }
      if (e.key !== 'Tab') return;
      var liste = odaklanabilir(m);
      if (!liste.length) return;
      var ilk = liste[0], son = liste[liste.length - 1];
      if (e.shiftKey && (document.activeElement === ilk || !m.contains(document.activeElement))) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && (document.activeElement === son || !m.contains(document.activeElement))) { e.preventDefault(); ilk.focus(); }
    });
    // Sunucu açık bastıysa (yönlendirme sonrası): ayar düğmenin adresinden okunur, odak içeri girer.
    if (m.classList.contains('show')) {
      var adres = tamam && tamam.getAttribute('href');
      ayarlar = { adres: adres && adres !== '#' ? adres : null };
      setTimeout(function () { if (tamam) tamam.focus(); }, 50);
    }
  }

  function goster(ayar) {
    var m = pencere();
    if (!m) return false;
    bagla();
    ayarlar = ayar || {};
    doldur(m.querySelector('[data-basari-icerik]'), ayarlar);
    acan = document.activeElement;
    var ortu = document.querySelector('[data-basari-ortu]');
    m.classList.add('show');
    if (ortu) ortu.classList.add('show');
    setTimeout(function () { var t = m.querySelector('[data-basari-tamam]'); if (t) t.focus(); }, 50);
    return true;
  }

  window.GastroBasari = { goster: goster, doldur: doldur, kapat: kapat };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bagla);
  else bagla();
})();
