/* GÖRÜŞ BİLDİR — pencereyi gerçek bir kayda bağlar.
 *
 * 🔴 Prototipin `dm-gorus.js`i gönderime basınca formu gizleyip
 * "Görüşün gönderilmedi — burası maket" panelini açıyordu: hiçbir istek yok,
 * hiçbir kayıt yok. 58 ekranın hepsinde. Bu betik o dinleyicinin ÖNÜNE geçer
 * (capture evresi + stopImmediatePropagation), alanları AKTİF panelden okur
 * ve `POST /gorus`a gönderir.
 *
 * Neden donörün dosyasını düzenlemedik: `varliklar/**` prototipin kendi
 * render motoru ve "olduğu gibi taşınır" kararı var (`fazlar.md`). Bizim
 * katmanımız `public/kabuk/**`; fark burada durursa iki ağaç arasındaki
 * fark ölçülebilir kalır.
 *
 * Alanların `name` özniteliği YOK (donörde hiç basılmamış) — bu yüzden değer
 * DOM'dan okunur. Okuma AKTİF panelle sınırlı: pencere beş konu paneli
 * taşıyor ve dördü `disabled`; hepsini toplayan bir okuma, seçilmemiş
 * panelin boş alanlarını da gönderirdi.
 *
 * Revize 5 · madde 43–44:
 *  - "Ekran görüntüsü ekle" (`.fb-shot`) gerçek bir dosya girdisine bağlandı.
 *    Seçim `gastro/gorsel-hazirla.js` hattından geçer (HEIC → JPEG, büyük
 *    görsel küçültülür); tek görsel, JPG/PNG/WebP/HEIC, en çok 5 MB,
 *    önizleme ve kaldır. Sunucu görseli yeniden kodlar, EXIF'i atar.
 *  - Gövde çok parçalı gönderilir; spam kalkanının bal küpü, süre jetonu ve
 *    (açıksa) captcha yanıtı `<meta name="dada-kalkan">`dan eklenir.
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

  var AZAMI_BAYT = 5 * 1024 * 1024;
  var TURLER = ['image/jpeg', 'image/png', 'image/webp'];

  function jeton() {
    var m = document.querySelector('meta[name="dada-kimlik"]');
    try { return JSON.parse(m.getAttribute('content')).csrf; } catch (e) { return null; }
  }

  function kalkan() {
    var m = document.querySelector('meta[name="dada-kalkan"]');
    try { return JSON.parse(m.getAttribute('content')); } catch (e) { return null; }
  }

  function aktifPanel(modal) {
    return modal.querySelector('.fb-fields.active') || modal.querySelector('.fb-fields');
  }

  function metin(el) { return el ? (el.value || '').trim() : ''; }

  function kimlik() {
    var m = document.querySelector('meta[name="dada-kimlik"]');
    try { return JSON.parse(m.getAttribute('content')) || {}; } catch (e) { return {}; }
  }

  /* Panel seçimi `alan` olarak gider: öneride alan çipi, soruda konu, teknik
     sorunda sorunun yaşandığı yer, ihlalde ihlal türü. "Sayfa" (`yuzey`)
     formun gönderildiği adres; ihlalde sunucu onu bildirilen bağlantıyla değiştirir. */
  function topla(modal) {
    var konu = modal.querySelector('.fb-topic.active');
    var panel = aktifPanel(modal);
    var alanCipi = panel && panel.querySelector('.fb-chiprow .chip.active');
    var secim = panel && panel.querySelector('select');
    var govde = panel && panel.querySelector('textarea');
    var eposta = panel && panel.querySelector('input[type="email"]');
    var baglanti = panel && panel.querySelector('input[type="url"]');
    var onay = modal.querySelector('.fb-kvkk input[type="checkbox"]') || modal.querySelector('input[type="checkbox"]');
    var ek = panel && panel.querySelector('input[data-gorus-ek]');

    /* Puan: emoji şeridinde seçili düğmenin SIRASI (1–5). */
    var emojiler = [].slice.call(modal.querySelectorAll('.fb-emoji button'));
    var secili = emojiler.filter(function (b) { return b.classList.contains('active'); })[0];
    var puan = secili ? emojiler.indexOf(secili) + 1 : null;

    return {
      tur: konu ? (konu.getAttribute('data-topic') || 'oneri') : 'oneri',
      alan: alanCipi ? (alanCipi.textContent || '').trim() : (secim && metin(secim)) || null,
      yuzey: location.pathname,
      baglanti: metin(baglanti) || null,
      govde: metin(govde),
      eposta: metin(eposta) || null,
      puan: puan,
      kvkk_onay: onay ? !!onay.checked : false,
      ekran_goruntusu: ek && ek.files && ek.files[0] ? ek.files[0] : null,
    };
  }

  /* ── Alan hataları: tarayıcının balonu yerine alanın altında, kanonun
     `.fb-ek-hata` diliyle (eklendi: donörde hata satırı yok). */
  var HATA_ALANLARI = { govde: 'textarea', eposta: 'input[type="email"]', baglanti: 'input[type="url"]', alan: 'select', puan: '.fb-emoji', ekran_goruntusu: 'input[data-gorus-ek]' };

  function hataKabi(el) {
    if (!el) return null;
    if (el.matches('.fb-kvkk input')) return el.closest('.fb-kvkk');
    if (el.matches('input[data-gorus-ek]')) return null; // ek kendi hata satırını taşır
    return el.closest('.fb-field') || el.closest('.fb-emoji') || el;
  }

  function hataTemizle(form) {
    [].slice.call(form.querySelectorAll('[data-gorus-alan-hata]')).forEach(function (p) { p.remove(); });
    [].slice.call(form.querySelectorAll('[aria-invalid="true"]')).forEach(function (el) { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
  }

  var hataSayaci = 0;
  function hataGoster(el, mesaj) {
    if (el && el.matches('input[data-gorus-ek]')) {
      var ekHata = el.parentNode.querySelector('.fb-ek-hata');
      if (ekHata) { ekHata.textContent = mesaj; ekHata.hidden = false; }
      return;
    }
    var kap = hataKabi(el);
    if (!kap) return;
    var p = document.createElement('p');
    p.className = 'fb-ek-hata fb-alan-hata';
    p.id = 'fbAlanHata' + (++hataSayaci);
    p.setAttribute('data-gorus-alan-hata', '');
    p.setAttribute('role', 'alert');
    p.textContent = mesaj;
    kap.insertAdjacentElement('afterend', p);
    var odak = el.matches('.fb-emoji') ? el.querySelector('button') : el;
    if (odak) { odak.setAttribute('aria-invalid', 'true'); odak.setAttribute('aria-describedby', p.id); }
  }

  /* İstemci denetimi sunucunun kurallarının aynısı (GorusIstegi); sunucu
     yine denetler ve 422'sini aynı alanlara yazar. */
  function denetle(modal, veri) {
    var panel = aktifPanel(modal);
    var uye = !!kimlik().auth;
    var hatalar = [];
    var ekle = function (el, mesaj) { if (el) hatalar.push([el, mesaj]); };
    var secim = panel.querySelector('select');
    if (secim && secim.required && !metin(secim)) ekle(secim, dmLk('kabuk_js.gorus.secenek_sec', 'Bir seçenek seç.'));
    var baglanti = panel.querySelector('input[type="url"]');
    if (baglanti) {
      if (!veri.baglanti) ekle(baglanti, dmLk('kabuk_js.gorus.baglanti_yaz', 'İhlal içeren sayfanın bağlantısını yaz.'));
      else if (!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(veri.baglanti)) ekle(baglanti, dmLk('kabuk_js.gorus.baglanti_gecersiz', 'Bağlantı https:// ile başlayan geçerli bir adres olmalı.'));
    }
    var govde = panel.querySelector('textarea');
    if (veri.tur !== 'puan' && !veri.govde) ekle(govde, dmLk('kabuk_js.gorus.gorus_yaz', 'Görüşünü yazman gerekiyor.'));
    else if (veri.govde && veri.govde.length < 3) ekle(govde, dmLk('kabuk_js.gorus.gorus_kisa', 'Görüşün çok kısa.'));
    if (veri.tur === 'puan' && !veri.puan) ekle(panel.querySelector('.fb-emoji'), dmLk('kabuk_js.gorus.puan_sec', 'Bir puan seç.'));
    var eposta = panel.querySelector('input[type="email"]');
    if (eposta) {
      if (veri.eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(veri.eposta)) ekle(eposta, dmLk('kabuk_js.gorus.eposta_gecersiz', 'E-posta adresi geçerli görünmüyor.'));
      else if (!veri.eposta && eposta.hasAttribute('required') && !uye) ekle(eposta, dmLk('kabuk_js.gorus.eposta_yaz', 'E-posta adresini yaz; cevabı buraya göndereceğiz.'));
    }
    if (!veri.kvkk_onay) ekle(modal.querySelector('.fb-kvkk input[type="checkbox"]'), dmLk('kabuk_js.gorus.kvkk', 'Devam etmek için aydınlatma metnini onaylaman gerekiyor.'));

    return hatalar;
  }

  function uyariGoster(form, mesaj) {
    var kutu = form.querySelector('[data-gorus-uyari]');
    if (!kutu) {
      kutu = document.createElement('p');
      kutu.setAttribute('data-gorus-uyari', '');
      kutu.className = 'fb-uyari';
      kutu.setAttribute('role', 'alert');
      form.insertBefore(kutu, form.firstChild);
    }
    kutu.textContent = mesaj;
    kutu.hidden = false;
  }

  function boyut(bayt) {
    return bayt >= 1048576 ? (bayt / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(bayt / 1024)) + ' KB';
  }

  /* ── Ekran görüntüsü: `.fb-shot` düğmesi gizli bir dosya girdisini açar.
     eklendi: önizleme kutusu, "Kaldır" ve alan hatası (donörde yok;
     görünüşleri `kabuk/gorus-ek.css`). */
  function ekKur(dugme) {
    if (dugme.dataset.gorusEkBagli === '1') return;
    dugme.dataset.gorusEkBagli = '1';

    var girdi = document.createElement('input');
    girdi.type = 'file';
    girdi.hidden = true;
    girdi.accept = '.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif';
    girdi.setAttribute('data-gorus-ek', '');
    girdi.setAttribute('data-gorsel-hazirla', '');
    girdi.setAttribute('data-azami-bayt', String(AZAMI_BAYT));
    girdi.setAttribute('aria-label', dmLk('kabuk_js.gorus.ek_sec', 'Ekran görüntüsü seç'));
    girdi.disabled = dugme.disabled;

    var kutu = document.createElement('div');
    kutu.className = 'fb-ek';
    kutu.hidden = true;
    var resim = document.createElement('img');
    resim.alt = dmLk('kabuk_js.gorus.ek_alt', 'Eklenen ekran görüntüsü');
    var ad = document.createElement('span');
    ad.className = 'fb-ek-ad';
    var kaldir = document.createElement('button');
    kaldir.type = 'button';
    kaldir.className = 'fb-ek-kaldir';
    kaldir.innerHTML = dmLk('kabuk_js.gorus.kaldir', '<i class="fa-solid fa-xmark" aria-hidden="true"></i> Kaldır');
    kaldir.setAttribute('aria-label', dmLk('kabuk_js.gorus.ek_kaldir', 'Ekran görüntüsünü kaldır'));
    kutu.append(resim, ad, kaldir);

    var hata = document.createElement('p');
    hata.className = 'fb-ek-hata';
    hata.setAttribute('role', 'alert');
    hata.hidden = true;

    dugme.insertAdjacentElement('afterend', girdi);
    girdi.insertAdjacentElement('afterend', kutu);
    kutu.insertAdjacentElement('afterend', hata);

    var bekleyenHata = null;
    function hataYaz(m) { hata.textContent = m || ''; hata.hidden = !m; }
    function temizle() {
      if (resim.src && /^blob:/.test(resim.src)) URL.revokeObjectURL(resim.src);
      resim.removeAttribute('src');
      girdi.value = '';
      kutu.hidden = true;
      dugme.hidden = false;
    }

    dugme.addEventListener('click', function (e) {
      e.preventDefault();
      if (!girdi.disabled) girdi.click();
    });
    girdi.addEventListener('gorsel-hazirla', function (e) {
      bekleyenHata = e.detail && e.detail.hatalar ? e.detail.hatalar[0] : null;
    });
    girdi.addEventListener('change', function () {
      var f = girdi.files && girdi.files[0];
      var neden = bekleyenHata;
      bekleyenHata = null;
      if (!f) return;
      if (!neden && TURLER.indexOf(f.type) === -1) neden = dmLk('kabuk_js.gorus.ek_tur', 'Yalnız JPG, PNG, WebP veya HEIC görsel ekleyebilirsin.');
      if (!neden && f.size > AZAMI_BAYT) neden = dmLk('kabuk_js.gorus.ek_boyut', 'Ekran görüntüsü en fazla 5 MB olabilir. Daha küçük bir görsel seç.');
      if (neden) { temizle(); hataYaz(neden); return; }
      hataYaz(null);
      if (resim.src && /^blob:/.test(resim.src)) URL.revokeObjectURL(resim.src);
      resim.src = URL.createObjectURL(f);
      ad.textContent = f.name;
      var alt = document.createElement('small');
      alt.textContent = boyut(f.size);
      ad.appendChild(alt);
      kutu.hidden = false;
      dugme.hidden = true;
    });
    kaldir.addEventListener('click', function () { temizle(); hataYaz(null); dugme.focus(); });
    // Pencere kapanınca donör formu sıfırlar; önizleme de onunla gider.
    var form = dugme.closest('form');
    if (form) form.addEventListener('reset', function () { temizle(); hataYaz(null); });
    // Panel değişince donör girdileri kapatıp açar; gizli girdi düğmeyle aynı hâlde kalır.
    new MutationObserver(function () { girdi.disabled = dugme.disabled; })
      .observe(dugme, { attributes: true, attributeFilter: ['disabled'] });
  }

  function govdeKur(veri, ayar, bal) {
    var fd = new FormData();
    fd.append('tur', veri.tur);
    if (veri.alan) fd.append('alan', veri.alan);
    if (veri.yuzey) fd.append('yuzey', veri.yuzey);
    if (veri.baglanti) fd.append('baglanti', veri.baglanti);
    fd.append('govde', veri.govde);
    if (veri.eposta) fd.append('eposta', veri.eposta);
    if (veri.puan) fd.append('puan', String(veri.puan));
    fd.append('kvkk_onay', veri.kvkk_onay ? '1' : '0');
    if (veri.ekran_goruntusu) fd.append('ekran_goruntusu', veri.ekran_goruntusu, veri.ekran_goruntusu.name);
    if (ayar) {
      fd.append(ayar.bal, bal ? bal.value : '');
      fd.append(ayar.zamanAlani, ayar.zaman || '');
    }

    return fd;
  }

  function captchaAl(ayar) {
    if (!ayar || !ayar.captcha || !window.GastroCaptcha) return Promise.resolve(null);
    return window.GastroCaptcha.al('gorus').catch(function () { return null; });
  }

  /* Pencere sıfırlanınca (başarı sonrası ya da kapanışta donörün `form.reset()`i)
     yalnız girdiler değil seçimler de ilk hâline döner: tekrar açılan pencere temiz. */
  function sifirla(form, kap) {
    hataTemizle(form);
    var uyari = form.querySelector('[data-gorus-uyari]');
    if (uyari) uyari.hidden = true;
    [].slice.call(kap.querySelectorAll('.fb-emoji button.active')).forEach(function (b) { b.classList.remove('active'); });
    [].slice.call(kap.querySelectorAll('.fb-chiprow')).forEach(function (sira) {
      [].slice.call(sira.querySelectorAll('.chip')).forEach(function (c, i) { c.classList.toggle('active', i === 0); });
    });
    var ilk = kap.querySelector('.fb-topic');
    if (ilk && !ilk.classList.contains('active')) ilk.click();
  }

  /* Klavye: açılınca odak pencereye girer, Tab pencerede döner, kapanınca
     odak açan öğeye geri gider. Esc'i donörün `dm-gorus.js`i kapatıyor.
     Donör odak tuzağını kabuğun `trapFocus` yardımcısına bırakmıştı; bu
     sayfalarda o yardımcı yok, tuzak burada. */
  function odakKur(modal) {
    if (!modal) return;
    var acan = null;
    var odaklanabilir = function () {
      return [].slice.call(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(function (el) { return !el.disabled && el.tabIndex >= 0 && el.checkVisibility && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); });
    };
    var izle = function () {
      var acik = modal.classList.contains('show');
      if (acik && acan === null) {
        acan = document.activeElement && document.activeElement !== document.body ? document.activeElement : document.getElementById('fbTab');
        var odakla = function () { var ilk = modal.querySelector('.fb-topic.active') || odaklanabilir()[0]; if (ilk && !modal.contains(document.activeElement)) ilk.focus(); };
        // Geçiş (transform) sürerken ve sayfanın kendi `load` işleri bitince yeniden denenir.
        setTimeout(odakla, 50);
        if (document.readyState !== 'complete') {
          window.addEventListener('load', function () { [0, 300, 1000].forEach(function (ms) { setTimeout(odakla, ms); }); }, { once: true });
        }
      } else if (!acik && acan !== null) {
        var geri = acan;
        acan = null;
        if (geri && geri.isConnected && geri.focus) geri.focus();
      }
    };
    new MutationObserver(izle).observe(modal, { attributes: true, attributeFilter: ['class'] });
    // `?fb=1` pencereyi bu betik kurulmadan açmış olabilir.
    izle();
    // Belge düzeyinde: odak pencerenin dışındaysa (ör. `?fb=1` ile açılış) ilk Tab onu içeri alır.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !modal.classList.contains('show')) return;
      var liste = odaklanabilir();
      if (!liste.length) return;
      var ilk = liste[0], son = liste[liste.length - 1];
      if (e.shiftKey && (document.activeElement === ilk || !modal.contains(document.activeElement))) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && (document.activeElement === son || !modal.contains(document.activeElement))) { e.preventDefault(); ilk.focus(); }
    });
  }

  /* Revize 7 · madde 87: pencere giriş kapısının kalıbında. Başlık ortalı ve
     üstünde kapının `.lg-ico` dairesi (Görüş Bildir sekmesinin ikonu,
     `fa-comment-dots`); × sağ üst köşede. Pencerenin markup'ı 64 sayfa
     Blade'inde gömülü — ikon burada, kutu `gorus-ek.css`te kurulur. */
  function kalipBasligi(modal) {
    var bas = modal && modal.querySelector('.fb-head');
    if (!bas || bas.querySelector('.lg-ico')) return;
    var ikon = document.createElement('span');
    ikon.className = 'lg-ico';
    ikon.setAttribute('aria-hidden', 'true');
    ikon.innerHTML = '<i class="fa-solid fa-comment-dots"></i>';
    bas.insertBefore(ikon, bas.firstChild);
  }

  function kur() {
    var modal = document.getElementById('fbModal') || document.querySelector('.fb-modal');
    var form = document.getElementById('fbForm');
    if (!form || form.dataset.gorusBagli === '1') return;
    form.dataset.gorusBagli = '1';
    var kap = modal || form.closest('div') || document;
    // Tarayıcının balonları yerine alan altı hata satırları (denetle · hataGoster).
    form.noValidate = true;

    [].slice.call(form.querySelectorAll('.fb-shot')).forEach(ekKur);
    odakKur(modal);
    kalipBasligi(modal);

    /* Bal küpü: insanın görmediği, botun doldurduğu alan. Donörün formunda
       yok; kalkanın sorusu olduğu için buraya eklenir ve değeri gönderilir. */
    var ayar = kalkan();
    var bal = null;
    if (ayar && ayar.bal) {
      bal = document.createElement('input');
      bal.type = 'text';
      bal.name = ayar.bal;
      bal.hidden = true;
      bal.tabIndex = -1;
      bal.autocomplete = 'off';
      bal.setAttribute('aria-hidden', 'true');
      form.appendChild(bal);
    }

    form.addEventListener('reset', function () { sifirla(form, kap); });
    /* Başarı panelinin tek düğmesi "Tamam": pencereyi kapatır. Donörün
       "Forma dön" dinleyicisi aynı düğmede; önce bu koşar ve onu durdurur. */
    var tamam = document.getElementById('fbAgain');
    if (tamam) tamam.addEventListener('click', function (e) {
      e.stopImmediatePropagation();
      var kapat = document.getElementById('fbClose');
      if (kapat) kapat.click();
    }, true);
    // Düzeltilen alanın hatası kalkar.
    var duzeltildi = function (e) {
      var el = e.target.closest('.fb-emoji') || e.target;
      var kapsayan = hataKabi(el);
      var sonraki = kapsayan && kapsayan.nextElementSibling;
      if (sonraki && sonraki.hasAttribute('data-gorus-alan-hata')) sonraki.remove();
      var odak = el.matches && el.matches('.fb-emoji') ? el.querySelector('[aria-invalid]') : el;
      if (odak && odak.removeAttribute) { odak.removeAttribute('aria-invalid'); odak.removeAttribute('aria-describedby'); }
    };
    form.addEventListener('input', duzeltildi);
    form.addEventListener('change', duzeltildi);
    kap.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.fb-emoji button')) duzeltildi({ target: e.target.closest('.fb-emoji') }); });

    form.addEventListener('submit', function (olay) {
      olay.preventDefault();
      /* 🔴 Donörün kendi dinleyicisi de bu olaya bağlı ve paneli "gönderilmedi"
         hâline çeviriyor. Capture'da durdurmak yetmez — o dinleyici aynı
         hedefte, bu yüzden ANINDA yayılım kesilir. */
      olay.stopImmediatePropagation();

      hataTemizle(form);
      var uyari = form.querySelector('[data-gorus-uyari]');
      if (uyari) uyari.hidden = true;
      var veri = topla(kap);
      var eksikler = denetle(kap, veri);
      if (eksikler.length) {
        eksikler.forEach(function (h) { hataGoster(h[0], h[1]); });
        var ilk = eksikler[0][0];
        (ilk.matches('.fb-emoji') ? ilk.querySelector('button') : ilk).focus();
        return;
      }
      var dugme = form.querySelector('button[type="submit"]');
      if (dugme) dugme.disabled = true;

      captchaAl(ayar).then(function (captcha) {
        var govde = govdeKur(veri, ayar, bal);
        if (captcha) govde.append(ayar.captcha.alan, captcha);

        return fetch('/gorus', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': jeton() || '',
          },
          credentials: 'same-origin',
          body: govde,
        });
      }).then(function (c) {
        return c.json().then(function (g) { return { durum: c.status, govde: g }; });
      }).then(function (y) {
        if (dugme) dugme.disabled = false;
        if (y.durum !== 201) {
          /* Sessiz düşen yazma, yalanın kardeşi: 422 ve 429 GÖRÜNÜR olmalı.
             Alanı olan hata alanın altına, kalanı pencerenin başına. */
          var hatalar = (y.govde && y.govde.errors) || {};
          var panel = aktifPanel(kap);
          var genel = [];
          Object.keys(hatalar).forEach(function (anahtar) {
            var el = anahtar === 'kvkk_onay' ? kap.querySelector('.fb-kvkk input[type="checkbox"]')
              : (HATA_ALANLARI[anahtar] && panel.querySelector(HATA_ALANLARI[anahtar]));
            if (el) hataGoster(el, hatalar[anahtar][0]); else genel.push(hatalar[anahtar][0]);
          });
          if (!Object.keys(hatalar).length) genel.push((y.govde && y.govde.message) || dmLk('kabuk_js.gorus.gonderilemedi', 'Görüşün gönderilemedi, tekrar dener misin?'));
          if (genel.length) uyariGoster(form, genel[0]);

          return;
        }
        var basari = document.getElementById('fbBasari');
        form.hidden = true;
        form.reset();
        if (basari) {
          /* Madde 47: ortak başarı bildirimi — pencerenin kendi `.fb-success`i
             aynı içerikle dolar (ikinci bir pencere açılmaz). */
          if (window.GastroBasari) {
            window.GastroBasari.doldur(basari, {
              baslik: dmLk('kabuk_js.gorus.basari_baslik', 'Mesajın alındı'),
              metin: veri.eposta || kimlik().auth
                ? dmLk('kabuk_js.gorus.basari_eposta', 'Görüşün kaydedildi. Ekibimiz okuyacak; gerekirse e-posta adresinden döneriz.')
                : dmLk('kabuk_js.gorus.basari_epostasiz', 'Görüşün kaydedildi. Ekibimiz okuyacak. Bir e-posta adresi bırakmadığın için sana dönüş yapamayız.'),
              /* Revize 6 · madde 68 (Beyar): Görüş Bildir başarısında takip numarası ve Kopyala YOK.
                 Numara sunucu yanıtında, tabanda (kayıt kimliğinden) ve yönetim listesinde aynen durur;
                 iletişim ve destek talebi kendi takip numarasını göstermeye devam eder. */
              dugme: dmLk('kabuk_js.gorus.tamam', 'Tamam'),
            });
          }
          basari.hidden = false;
          var tamam = basari.querySelector('.fb-again');
          if (tamam) tamam.focus(); else { basari.setAttribute('tabindex', '-1'); basari.focus(); }
        }
      }).catch(function () {
        if (dugme) dugme.disabled = false;
        uyariGoster(form, dmLk('kabuk_js.gorus.gonderilemedi', 'Görüşün gönderilemedi, tekrar dener misin?'));
      });
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
