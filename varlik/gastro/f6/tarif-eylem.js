/* F6 · TARİF EYLEM YÜZEYİ — donörün düğmeleri GERÇEK üye uçlarına bağlanır.
 *
 * Ölçülmüş kusur (lead · gerçek üye oturumu · Chromium): tarif yüzeyindeki
 * eylem formlarının `method`i de `action`ı da yoktu, içlerinde yalnız `@csrf`
 * duruyordu. Tıklayınca tarayıcı AYNI adrese GET atıyor, token adres çubuğuna
 * düşüyordu (`/tarifler?_token=…`); hiçbir POST gitmiyor, hiçbir satır
 * yazılmıyordu. Yapışkan aksiyon barındaki üç düğme ise var olmayan adrese
 * POST atıp 405 alıyordu (`/tarif/<slug>__denedim` — rota adının SONUNA dizge
 * ekleniyordu).
 *
 * ═══ NEDEN AYRI BİR BETİK, NEDEN KANONA DOKUNULMADI ═══════════════════════
 * Kanon paketlerinde iki hazır işleyici var ve İKİSİNİN DE SÖZLEŞMESİ
 * BİZİM UÇLARIMIZLA UYUŞMUYOR (ölçüldü, tahmin edilmedi):
 *
 *   `app-Dsop9IcY.js` · `[data-engagement-toggle]`
 *       gövdesiz POST atar, yanıtta `{active:bool, count:int}` bekler.
 *   `portal-Co4op6F_.js` · `[data-save-toggle]`
 *       formun `action`ına gövdesiz POST atar, yanıtta `{active:bool}` bekler.
 *
 * Bizim uçlarımız:
 *   `POST /hesabim/mutfak-defterim/kayit/toggle` → GÖVDE ister
 *       (`hedef_tur` + `hedef_id`, `KayitIstegi`), yanıt `{ok, kayitli}`.
 *   `POST /hesabim/toplulugum/takip-et/{ad}`     → yanıt `{durum}`.
 *   `POST …/alisveris/listeler/{kod}/kalemler`   → GÖVDE ister (`ad`, `miktar`,
 *       `kaynakSlug`), yanıt `{ok, durum, kalemId}`, liste yoksa 404.
 *
 * Yani kanon işleyicisi bu uçlara bırakılsaydı: gövdesiz POST 422 alırdı ve
 * `!!yanit.active` HER ZAMAN `false` çıkacağı için kalp, satır YAZILDIĞI hâlde
 * boş kalırdı — "yazan ama göstermeyen" yüzey. Kanon dosyaları değiştirilemez
 * (CLAUDE.md), bu yüzden tıklamayı kanon işleyicileri görmeden ÖNCE burada
 * karşılıyoruz.
 *
 * 🔴 NASIL ÖNCE KOŞUYORUZ. Kanon paketleri `<script type="module">` — modüller
 * ayrıştırma BİTTİKTEN sonra koşar. Bu dosya `<head>`e KLASİK betik olarak
 * konuyor, ayrıştırma sırasında hemen koşuyor ve dinleyicisini `document`
 * üzerinde CAPTURE evresinde kuruyor. Capture evresi hedefe inmeden koştuğu
 * için kanonun düğmeye doğrudan bağladığı dinleyiciler olaya HİÇ ULAŞMAZ
 * (`stopPropagation` capture'da çağrılınca olay hedefe inmez).
 *
 * 🔴 MİSAFİRE KARIŞILMAZ. `body.is-auth` yoksa hiçbir şey yapılmaz ve olay
 * kanona BIRAKILIR: donörün `[data-lg-gate]` / `[data-engagement-toggle]`
 * işleyicisi giriş modalını açar. Modal açıcı kanon modülünün içinde kapalı,
 * taklidi yazılamaz — o yüzden o dal kanona ait kalıyor.
 *
 * `data-engagement-toggle` işlemleri de burada doğrulanır; HTTP/ağ hatası
 * mevcut görünümü korur ve kullanıcıya görünür bildirim verir.
 *
 * localStorage KULLANILMAZ. Donörün kendi `dm-p4-m.js`i `.ing-add`i
 * `window.dmDepo`ya (localStorage) bağlıyordu; `public/kabuk/depo-kapisi.js`
 * o yazmaları zaten engelliyor ve markup'taki `data-m-bagli` işareti donör
 * işleyicisinin bağlanmasını da durduruyor. Kullanıcının yazdığı her şey
 * hesaba yazılır.
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

  var KOD_YERI = '__KOD__';

  function csrf() {
    var m = document.querySelector('meta[name="csrf-token"]');

    return m ? m.getAttribute('content') : '';
  }

  function authMi() {
    return !!(document.body && document.body.classList.contains('is-auth'));
  }

  /** Tek POST — yanıt JSON değilse `veri` null döner, çağıran `ok`a bakar. */
  function gonder(uc, govde) {
    return fetch(uc, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'X-CSRF-TOKEN': csrf(),
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(govde || {}),
    }).then(function (yanit) {
      return yanit.json().then(
        function (veri) { return { ok: yanit.ok, kod: yanit.status, veri: veri }; },
        function () { return { ok: yanit.ok, kod: yanit.status, veri: null }; }
      );
    });
  }

  /* ─── görsel durum ────────────────────────────────────────────────────── */

  /**
   * Revize P1 · Kalem 14 — kullanıcının okuduğu cümle düğmenin `data-l-<ad>` özniteliğinden
   * gelir; öznitelik yoksa bugünkü Türkçe metin. Tarif detayı öznitelikleri YALNIZ kaynak dil
   * dışında basar (`ArayuzSozlugu::cevrilmis()`), yani TR sayfalar ve özniteliği hiç taşımayan
   * diğer ekranlar (dizin kartları, şef ve püf sayfaları) bu dosyadan önceki metni okur.
   */
  function metin(dugme, ad, varsayilan) {
    return dugme.getAttribute('data-l-' + ad) || varsayilan;
  }

  /* Aşama 2 · sayfa geneli metinler (toast, rozet, liste bildirimi). Sunucu yalnız çevrilmiş dilde
     `[data-l-js]` sözlüğünü basar (TR baytı değişmez); yoksa Türkçe varsayılan döner. `:ad`/`:n` yer
     tutucu; "tekil|çoğul" biçimi sayfanın diline göre `Intl.PluralRules` ile seçilir. */
  var jsSozluk = null;
  function sayfaDili() { return (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) || 'tr'; }
  function sayiDili() { return sayfaDili().indexOf('tr') === 0 ? 'tr-TR' : sayfaDili(); }
  function sayfaMetni(ad, varsayilan, degerler, sayi) {
    if (jsSozluk === null) {
      jsSozluk = {};
      var kap = typeof document !== 'undefined' && document.querySelector ? document.querySelector('[data-l-js]') : null;
      if (kap && kap.getAttribute) { try { jsSozluk = JSON.parse(kap.getAttribute('data-l-js')) || {}; } catch (e) { jsSozluk = {}; } }
    }
    /* Tarif sayfası dışında `arayuz_tarif` sözlüğü yok: aynı anahtar kabuk sözlüğünden (`tarif.js.*`, `KabukSozlugu::TARIF_JS`).
       `typeof`: birim testleri bu yardımcıyı dilimle yükler, `dmLk` o bağlamda tanımsızdır. */
    var m = jsSozluk[ad] || (typeof dmLk === 'function' ? dmLk('tarif.' + ad, varsayilan) : varsayilan);
    if (m.indexOf('|') !== -1) {
      var bicim = m.split('|');
      var bk = new Intl.PluralRules(sayfaDili()), kat = typeof sayi === 'number' ? bk.select(sayi) : 'other';
      /* RU (üç kategorili dil, 20 Eki): 'bir|az|çok' — kesir → az; iki biçimli dilde eski kural aynen. */
      m = bicim.length > 2 && bk.resolvedOptions().pluralCategories.indexOf('few') >= 0
        ? bicim[typeof sayi !== 'number' ? 2 : (sayi !== Math.floor(sayi) ? 1 : (kat === 'one' ? 0 : (kat === 'few' ? 1 : 2)))]
        : (kat === 'one' && typeof sayi === 'number' ? bicim[0] : bicim[bicim.length - 1]);
    }
    Object.keys(degerler || {}).forEach(function (k) { m = m.split(':' + k).join(String(degerler[k])); });

    return m;
  }

  /** Düğmenin SON metin düğümünü değiştirir — ikon düğümüne dokunulmaz. */
  function etiketYaz(dugme, metin) {
    for (var i = dugme.childNodes.length - 1; i >= 0; i--) {
      var n = dugme.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) {
        n.nodeValue = (n.nodeValue.charAt(0) === ' ' ? ' ' : '') + metin;

        return;
      }
    }
    dugme.appendChild(document.createTextNode(' ' + metin));
  }

  /** Kalp ikonu: `data-icon-on/off` varsa onlar, yoksa fa-solid/fa-regular. */
  function ikonYaz(dugme, acik) {
    var i = dugme.querySelector('i');
    if (!i) return;
    var acikSinif = dugme.getAttribute('data-icon-on');
    var kapaliSinif = dugme.getAttribute('data-icon-off');
    if (acikSinif && kapaliSinif) {
      i.className = acik ? acikSinif : kapaliSinif;

      return;
    }
    i.classList.toggle('fa-solid', acik);
    i.classList.toggle('fa-regular', !acik);
  }

  /** Uç hata verdi: sahte başarı GÖSTERİLMEZ, düğme eski hâline döner. */
  function hataGoster(dugme, mesaj) {
    dugme.disabled = false;
    dugme.setAttribute('data-eylem-hata', mesaj || sayfaMetni('js.save_failed', 'Kaydedilemedi'));
    dugme.title = mesaj || sayfaMetni('js.save_failed_retry', 'Kaydedilemedi — yeniden dene');
    var toast = document.getElementById('keToast');
    var yazi = document.getElementById('keToastMsg');
    if (toast && yazi) {
      yazi.textContent = dugme.title; toast.setAttribute('role', 'alert'); toast.classList.add('show');
      clearTimeout(toast._eylemSure);
      toast._eylemSure = setTimeout(function () { toast.classList.remove('show'); }, 5000);
    } else {
      var hata = dugme.parentElement.querySelector('[data-toggle-hata]');
      if (!hata) { hata = document.createElement('span'); hata.setAttribute('data-toggle-hata', ''); hata.setAttribute('role', 'alert'); dugme.parentElement.appendChild(hata); }
      hata.textContent = dugme.title;
    }
  }

  function hataTemizle(dugme) {
    dugme.removeAttribute('data-eylem-hata');
    var hata = dugme.parentElement.querySelector('[data-toggle-hata]');
    if (hata) hata.remove();
  }

  function engagement(dugme) {
    var aktif = dugme.dataset.active === '1';
    var uc = dugme.dataset.urlOff ? (aktif ? dugme.dataset.urlOff : dugme.dataset.urlOn) : dugme.dataset.url;
    if (!uc) return;
    dugme.disabled = true; hataTemizle(dugme);
    gonder(uc, {}).then(function (s) {
      if (!s.ok || !s.veri || typeof s.veri.active !== 'boolean') throw new Error('yanit');
      var acik = s.veri.active;
      dugme.dataset.active = acik ? '1' : '0';
      dugme.classList.toggle('on', acik);
      dugme.setAttribute('aria-pressed', String(acik));
      var ikon = dugme.querySelector('i');
      var sinif = acik ? dugme.dataset.iconOn : dugme.dataset.iconOff;
      if (ikon && sinif) ikon.className = sinif;
      var sayac = dugme.querySelector('[data-engagement-count]');
      if (sayac && typeof s.veri.count === 'number') sayac.textContent = s.veri.count.toLocaleString(sayiDili());
    }).catch(function () { hataGoster(dugme, sayfaMetni('js.action_failed', 'İşlem kaydedilemedi. Yeniden dene.')); })
      .finally(function () { dugme.disabled = false; });
  }

  /* ─── kayıt (kalp) ────────────────────────────────────────────────────── */

  function rozetBildir(dugme, rozetler) {
    if (!Array.isArray(rozetler) || !rozetler.length) return;
    var mesaj = sayfaMetni('js.badge_earned', 'Rozet kazandın: :ad', { ad: rozetler.map(function (r) { return r.name; }).join(', ') });
    var rozetlerim = sayfaMetni('js.see_badges', 'Rozetlerimi gör');
    if (typeof window.dmToast === 'function') {
      window.dmToast(mesaj, { sure:10000, geri:{ metin:rozetlerim, cb:function () { window.location.assign((window.dmYol || String)('/hesabim/rozetlerim')); } } });
      var kap = document.querySelector('.dm-toast-kap');
      if (kap) kap.setAttribute('data-tarif-bildirimi', '');
    } else {
      // Aynı eylem sürücüsünü kullanan sade kartlarda görünür satır içi sonuç.
      var bag = document.createElement('a'); bag.className='btn btn-outline';
      bag.href=(window.dmYol || String)('/hesabim/rozetlerim'); bag.textContent=mesaj+' · '+rozetlerim;
      bag.setAttribute('role','status'); dugme.parentElement.appendChild(bag);
    }
  }

  function kayitDurumu(dugme, acik) {
    dugme.classList.toggle(dugme.getAttribute('data-acik-sinif') || 'saved', acik);
    dugme.setAttribute('aria-pressed', String(acik));
    dugme.setAttribute('data-active', acik ? '1' : '0');
    ikonYaz(dugme, acik);
    dugme.title = acik ? metin(dugme, 'kayit-acik', dmLk('kabuk_js.f6.kayit_acik', 'Mutfak defterinden çıkar')) : metin(dugme, 'kayit-kapali', dmLk('kabuk_js.f6.kayit_kapali', 'Mutfak defterine kaydet'));
    dugme.setAttribute('aria-label', dugme.title);
  }

  function kayitDugmeleri(dugme) {
    return Array.from(document.querySelectorAll('[data-tarif-eylem="kayit"]')).filter(function (diger) {
      return diger.dataset.hedefId === dugme.dataset.hedefId
        && (diger.dataset.hedefTur || 'tarif') === (dugme.dataset.hedefTur || 'tarif');
    });
  }

  function kayitBaslangici() {
    document.querySelectorAll('[data-tarif-eylem="kayit"]').forEach(function (dugme) {
      kayitDurumu(dugme, dugme.dataset.active === '1' || dugme.classList.contains(dugme.getAttribute('data-acik-sinif') || 'saved'));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kayitBaslangici);
  else kayitBaslangici();

  function kayit(dugme) {
    var uc = dugme.getAttribute('data-uc');
    var id = parseInt(dugme.getAttribute('data-hedef-id'), 10);
    if (!uc || !id) return;

    var dugmeler = kayitDugmeleri(dugme);
    dugmeler.forEach(function (diger) { diger.disabled = true; });
    hataTemizle(dugme);
    gonder(uc, { hedef_tur: dugme.getAttribute('data-hedef-tur') || 'tarif', hedef_id: id })
      .then(function (s) {
        if (!s.ok || !s.veri || !s.veri.ok) {
          hataGoster(dugme, metin(dugme, 'hata', sayfaMetni('js.save_failed', 'Kaydedilemedi')));

          return;
        }
        rozetBildir(dugme, s.veri.badgesEarned);
        var acik = !!s.veri.kayitli;
        dugmeler.forEach(function (diger) { kayitDurumu(diger, acik); });
      })
      .catch(function () { hataGoster(dugme, metin(dugme, 'hata', sayfaMetni('js.save_failed', 'Kaydedilemedi'))); })
      .finally(function () { dugmeler.forEach(function (diger) { diger.disabled = false; }); });
  }

  /* ─── faydalı buldum (püf) ────────────────────────────────────────────── */

  /**
   * Püf noktasının "Faydalı Buldum" düğmesi.
   *
   * 🔴 NEDEN KANONA BIRAKILMIYOR. Bu düğme `[data-engagement-toggle]`
   * taşıdığı sürece MİSAFİR tıklaması kanonun kendi dalına düşüyor ve
   * tarayıcıyı `https://dadagastro.com/giris?tab=giris` adresine, yani ÜRETİM
   * alan adına götürüyordu (ölçüldü 2026-09-11, gerçek tarayıcı). Aynı
   * çubuktaki "Kaydet" düğmesi o niteliği taşımadığı için yerel `#lgGate`i
   * açıyordu. Markup'tan `data-engagement-toggle` kalkınca misafir dalı
   * kanonun `data-lg-gate` işleyicisine düşer (yerel kapı, ölçüldü) ve üye
   * dalı buraya gelir.
   *
   * Sözleşme kanonunkiyle AYNI kalır: gövdesiz POST, yanıt `{active, count}`.
   */
  function faydali(dugme) {
    var uc = dugme.getAttribute('data-uc');
    if (!uc) return;

    dugme.disabled = true;
    hataTemizle(dugme);
    gonder(uc, {})
      .then(function (s) {
        if (!s.ok || !s.veri || typeof s.veri.active !== 'boolean') {
          hataGoster(dugme, sayfaMetni('js.save_failed', 'Kaydedilemedi'));

          return;
        }
        var acik = s.veri.active;
        dugme.classList.toggle(dugme.getAttribute('data-acik-sinif') || 'on', acik);
        dugme.setAttribute('aria-pressed', acik ? 'true' : 'false');
        dugme.setAttribute('data-active', acik ? '1' : '0');
        /* Donörün biçimi: sayaç SIFIRDA hiç basılmaz (`<b data-engagement-count>`
           yok), sıfırdan büyükse düğme metninin ardında durur.
           Revize 5 · madde 50 (D3): düğüm yalnız varsa güncelleniyordu; 0 → 1'de
           sayı sayfa yenilenene kadar çıkmıyordu. Artık 0'dan çıkınca sunucunun
           bastığı kalıpla oluşturulur, 0'a dönünce kaldırılır. */
        var sayac = dugme.querySelector('[data-engagement-count]');
        var sayi = typeof s.veri.count === 'number' ? s.veri.count : 0;
        if (sayi > 0) {
          if (!sayac) {
            var son = dugme.lastChild;
            if (!son || son.nodeType !== 3 || !/\s$/.test(son.nodeValue)) { dugme.appendChild(document.createTextNode(' ')); }
            sayac = document.createElement('b');
            sayac.setAttribute('data-engagement-count', '');
            dugme.appendChild(sayac);
          }
          sayac.textContent = String(sayi);
        } else if (sayac) {
          sayac.remove();
        }
      })
      .catch(function () { hataGoster(dugme, sayfaMetni('js.save_failed', 'Kaydedilemedi')); })
      .finally(function () { dugme.disabled = false; });
  }

  /* ─── takip ───────────────────────────────────────────────────────────── */

  function takip(dugme) {
    var uc = dugme.getAttribute('data-uc');
    if (!uc) return;

    dugme.disabled = true;
    hataTemizle(dugme);
    gonder(uc, {})
      .then(function (s) {
        if (!s.ok || !s.veri || s.veri.durum !== 'takip-edildi') {
          /* 422 = kendini takip; ayrı cümle, çünkü "yeniden dene" yanlış olur. */
          hataGoster(dugme, s.kod === 422 ? metin(dugme, 'hata-kendi', dmLk('kabuk_js.f6.takip_kendi', 'Kendini takip edemezsin')) : metin(dugme, 'hata', dmLk('kabuk_js.f6.takip_hata', 'Takip edilemedi')));

          return;
        }
        dugme.classList.add('is-following');
        dugme.setAttribute('aria-pressed', 'true');
        etiketYaz(dugme, dugme.getAttribute('data-etiket-acik') || dmLk('kabuk_js.f6.takip_ediliyor', 'Takip Ediliyor'));
        /* Bırakma ucu `{takip}` id'si ister; o id bu sayfaya BASILMIYOR, yani
           buradan takibi bırakmak bağlanamıyor. Sahte düğme bırakmak yerine
           düğme kilitleniyor; bırakma yüzeyi `/hesabim/toplulugum`. */
        dugme.disabled = true;
        dugme.title = metin(dugme, 'takipte', dmLk('kabuk_js.f6.takipte', 'Takip ediliyor — takibi Topluluğum ekranından bırakabilirsin'));
      })
      .catch(function () { hataGoster(dugme, metin(dugme, 'hata', dmLk('kabuk_js.f6.takip_hata', 'Takip edilemedi'))); });
  }

  /* ─── alışveriş listesi ───────────────────────────────────────────────── */

  /* Çözülen liste kodu SAYFA ÖMRÜ boyunca tutulur — depoya YAZILMAZ. */
  var cozulenKod = null;

  function kalemUcu(sablon, kod) {
    return sablon.replace(KOD_YERI, encodeURIComponent(kod));
  }

  /**
   * Uç `{kod}` ister ama tarif sayfasına hiçbir liste kodu basılmıyor ve
   * listeleri JSON döndüren bir okuma ucu YOK. Çözüm: varsayılan listenin kodu
   * SUNUCUYLA AYNI kuralla türetiliyor (`AlisverisServisi::slugla` →
   * "Alışveriş Listem" → `alisveris-listem`); liste henüz açılmamışsa uç 404
   * döner, liste açılır (kod çakışması olmadığı için AYNI kodu alır) ve kalem
   * bir kez daha denenir. Böylece üye başına TEK varsayılan liste oluşur,
   * her tıklamada yeni liste açılmaz.
   */
  function listeyeEkle(sablon, acUc, kod, ad, kalem) {
    return gonder(kalemUcu(sablon, cozulenKod || kod), kalem).then(function (s) {
      if (s.ok) {
        /* Public revize R4: taslak ucu (`…/alisveris/taslak/kalemler`) listenin kodunu yanıtta döndürür. */
        cozulenKod = (s.veri && s.veri.kod) || cozulenKod || kod;

        return s;
      }
      if (s.kod !== 404 || !acUc) return s;

      return gonder(acUc, { ad: ad }).then(function (a) {
        if (!a.ok || !a.veri || !a.veri.kod) return s;
        cozulenKod = a.veri.kod;

        return gonder(kalemUcu(sablon, cozulenKod), kalem);
      });
    });
  }

  /**
   * Miktar PORSİYONA GÖRE değişir ve `.iq` düğümünü donörün kendi betiği
   * yeniden yazar — bu yüzden önbelleğe alınmaz, tıklama ANINDA okunur.
   */
  function satirMiktari(dugme) {
    var satir = dugme.closest('.ing-row');
    var q = satir && satir.querySelector('.iq');

    if (!q) return '';
    var copy = q.cloneNode(true), amount = copy.querySelector('[data-current-amount]');
    // Görünür kesir yazısını sayısal alışveriş birleştiricisine aynen göndermeyiz.
    if (amount) amount.textContent = amount.dataset.currentAmount.replace('.', ',');
    return copy.textContent.trim().replace(/\s+/g, ' ');
  }

  function kalemVerisi(dugme) {
    return {
      ad: dugme.getAttribute('data-ad') || '',
      miktar: satirMiktari(dugme),
      kaynakSlug: dugme.getAttribute('data-kaynak') || null,
      sponsorKreatif: dugme.getAttribute('data-sponsor-kreatif') ? Number(dugme.getAttribute('data-sponsor-kreatif')) : null,
    };
  }

  function listeGeriBildir(dugme, sonuc) {
    var panel = document.getElementById('listeGeriBildirim');
    if (!panel) return;
    var toplam = sonuc && sonuc.veri && sonuc.veri.listeKalemSayisi;
    if (typeof toplam === 'number') {
      panel.querySelector('[data-liste-adet]').textContent = String(toplam);
      panel.hidden = false;
      panel.querySelector('a').href = (window.dmYol || String)('/hesabim/menulerim') + '?liste=' + encodeURIComponent(cozulenKod || 'alisveris-listem') + '#alisveris';
    }
    var tumu = document.getElementById('addAllBtn');
    var satirlar = [].slice.call(document.querySelectorAll('[data-tarif-eylem="liste-ekle"]'));
    var hepsi = satirlar.length > 0 && satirlar.every(function (b) { return b.classList.contains('added'); });
    if (tumu && hepsi) {
      etiketYaz(tumu, sayfaMetni('js.all_in_list', metin(tumu, 'eklendi-tumu', dmLk('kabuk_js.f6.tumu_listede', 'Tümü Listede'))));
      var ikon = tumu.querySelector('i'); if (ikon) ikon.className = 'fa-solid fa-check';
      tumu.disabled = true;
    }
  }

  function eklendiIsaretle(dugme) {
    dugme.classList.add('added');
    dugme.setAttribute('aria-pressed', 'true');
    dugme.title = metin(dugme, 'eklendi', dmLk('kabuk_js.f6.eklendi', 'Alışveriş listene eklendi'));
    dugme.setAttribute('aria-label', dugme.title);
    /* Çıkarma ucu kalem id'si ister; id yanıtta geliyor ama satırın açılışta
       listede OLUP OLMADIĞI bu sayfaya basılmıyor — yani çıkarma yönü tek
       yönlü çalışırdı. Düğme kilitleniyor, çıkarma yüzeyi `/hesabim/menulerim`. */
    dugme.disabled = true;
  }

  function listeBildir(dugme, mesaj) {
    var url = (window.dmYol || String)('/hesabim/menulerim') + '?liste=' + encodeURIComponent(cozulenKod || dugme.getAttribute('data-liste-kod') || 'alisveris-listem') + '#alisveris';
    if (typeof window.dmToast === 'function') {
      window.dmToast(mesaj, { sure:10000, geri:{ metin:sayfaMetni('js.go_to_list', 'Listeye git'), cb:function () { window.location.assign(url); } } });
      var kap = document.querySelector('.dm-toast-kap');
      if (kap) kap.setAttribute('data-tarif-bildirimi', '');
    } else {
      var eski = dugme.parentElement.querySelector('[data-liste-sonucu]');
      if (eski) eski.remove();
      var bag = document.createElement('a'); bag.className='btn btn-outline';
      bag.setAttribute('data-liste-sonucu', ''); bag.setAttribute('role','status');
      bag.href=url; bag.textContent=mesaj+' '+sayfaMetni('js.go_to_list', 'Listeye git'); dugme.parentElement.appendChild(bag);
    }
  }

  function listeEkle(dugme) {
    var sablon = dugme.getAttribute('data-uc');
    if (!sablon) return;
    dugme.disabled = true;
    hataTemizle(dugme);
    listeyeEkle(
      sablon,
      dugme.getAttribute('data-liste-ac'),
      dugme.getAttribute('data-liste-kod'),
      dugme.getAttribute('data-liste-ad'),
      kalemVerisi(dugme)
    )
      .then(function (s) {
        if (!s.ok || !s.veri || s.veri.ok !== true) { hataGoster(dugme, metin(dugme, 'hata', dmLk('kabuk_js.f6.liste_hata', 'Listeye eklenemedi'))); return; }
        eklendiIsaretle(dugme);
        listeBildir(dugme, sayfaMetni('js.item_added', ':ad alışveriş listene eklendi.', { ad: dugme.getAttribute('data-ad') || sayfaMetni('js.ingredient', 'Malzeme') }));
        listeGeriBildir(dugme, s);
      })
      .catch(function () { hataGoster(dugme, metin(dugme, 'hata', dmLk('kabuk_js.f6.liste_hata', 'Listeye eklenemedi'))); });
  }

  function listeEkleTumu(dugme) {
    /* Sponsorlu satırın kendi düğmesi yok; gizli `[data-tarif-tumu-kalem]` işaretiyle o da yazılır (R6). */
    var satirlar = [].slice.call(document.querySelectorAll('[data-tarif-eylem="liste-ekle"], [data-tarif-tumu-kalem]'));
    if (!satirlar.length) return;
    var sablon = dugme.getAttribute('data-uc');
    var acUc = dugme.getAttribute('data-liste-ac');
    var kod = dugme.getAttribute('data-liste-kod');
    var ad = dugme.getAttribute('data-liste-ad');
    if (!sablon) return;

    dugme.disabled = true;
    hataTemizle(dugme);
    /* Toplu uç YOK — kalemler SIRAYLA yazılır. Paralel gönderim ilk istekte
       listeyi açar, kalanlar 404 alırdı (kod henüz çözülmemiş olurdu). */
    var basarili = 0;
    var beklenen = satirlar.filter(function (satir) { return !satir.disabled; }).length;
    satirlar
      .reduce(function (zincir, satirDugmesi) {
        return zincir.then(function () {
          if (satirDugmesi.classList.contains('added')) return null;

          return listeyeEkle(sablon, acUc, kod, ad, kalemVerisi(satirDugmesi)).then(function (s) {
            if (s.ok && s.veri && s.veri.ok === true) { basarili++; eklendiIsaretle(satirDugmesi); listeGeriBildir(satirDugmesi, s); }
          }).catch(function () { /* Diğer satırları dene; gerçek kısmi sonucu aşağıda bildir. */ });
        });
      }, Promise.resolve())
      .then(function () {
        if (!basarili) { hataGoster(dugme, metin(dugme, 'hata', dmLk('kabuk_js.f6.liste_hata', 'Listeye eklenemedi'))); return; }
        var tamam = basarili === beklenen;
        if (tamam) etiketYaz(dugme, metin(dugme, 'eklendi-tumu', dmLk('kabuk_js.f6.listeye_eklendi', 'Listeye Eklendi')));
        dugme.disabled = tamam;
        listeBildir(dugme, tamam
          ? sayfaMetni('js.items_added', ':n malzeme alışveriş listene eklendi.', { n: basarili }, basarili)
          : sayfaMetni('js.items_partial', ':n malzeme listeye eklendi. Kalanları yeniden dene.', { n: basarili + '/' + beklenen }, beklenen));
      })
      .catch(function () { hataGoster(dugme, metin(dugme, 'hata', dmLk('kabuk_js.f6.liste_hata', 'Listeye eklenemedi'))); });
  }

  // Listeyi Gör doğrudan yazılan listeyi açar; var olan yerel liste düğmesi kullanılır.
  window.addEventListener('load', function () {
    var kod = new URL(location.href).searchParams.get('liste');
    if (!kod || !document.getElementById('menulerim-pane-alisveris')) return;
    /* Public revize R2: `?liste=` artık sunucunun bastığı detay sayfası; kart tıklaması gerekmez. */
    if (document.body.classList.contains('al-detay-sayfa')) return;
    var ac = [].slice.call(document.querySelectorAll('[data-al-ac]')).find(function (n) { return n.dataset.alAc === kod; });
    if (ac) { ac.click(); document.getElementById('alisveris').scrollIntoView({ block: 'start' }); }
  });

  /* ─── tek giriş noktası ───────────────────────────────────────────────── */

  var ISLEYICI = {
    kayit: kayit,
    faydali: faydali,
    takip: takip,
    'liste-ekle': listeEkle,
    'liste-ekle-tumu': listeEkleTumu,
  };

  document.addEventListener(
    'click',
    function (olay) {
      var hedef = olay.target;
      if (!hedef || !hedef.closest) return;
      var dugme = hedef.closest('[data-tarif-eylem], [data-engagement-toggle]');
      if (!dugme) return;
      var islev = ISLEYICI[dugme.getAttribute('data-tarif-eylem')] || (dugme.hasAttribute('data-engagement-toggle') ? engagement : null);
      if (!islev) return;

      /* Misafir: olay KANONA bırakılır, giriş modalını o açar. */
      if (!authMi()) return;
      if (dugme.disabled) { olay.preventDefault(); olay.stopPropagation(); return; }

      /* Kart `onclick="location.href=…"` ile geziniyor; form `submit`i sayfayı
         yeniden yüklerdi. İkisi de burada kesiliyor. */
      olay.preventDefault();
      olay.stopPropagation();
      islev(dugme);
    },
    true
  );
})();
