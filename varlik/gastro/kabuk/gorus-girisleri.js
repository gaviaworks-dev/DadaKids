/* GÖRÜŞ BİLDİR GİRİŞLERİ — Revize 5 · madde 49.
 *
 * Sağ kenar sekmesi (`#fbTab`) 640px ve altında gizli (donörün kendi kuralı,
 * dm-kabuk.css). Mobil menüye (`#drawer .drawer-nav`) pencereye bir giriş
 * eklenir: komşu `.d-item`in (Püf Noktaları) render edilmiş DOM'u KLONLANIR —
 * sınıf, etiket ve ikon yapısı aynı kalır; yalnız adres, ikon (sekmenin
 * `fa-comment-dots`i) ve metin değişir. Altbilgi girişi eklenmez: donörün
 * "Öneri ve Şikâyet" bağı aynı pencereyi zaten açıyor (Beyar kararı, 24 Eylül).
 * eklendi: donörün menüsünde bu giriş yok. Markup'a (64 Blade kopyası)
 * dokunulmaz; pencere ya da sekme olmayan sayfada hiçbir şey eklenmez.
 *
 * Açma yolu sekmenin kendisidir (`#fbTab.click()` — donörün altbilgi bağı da
 * böyle açıyor): pencerenin açılış/odak/kapanış davranışı tek yerde kalır.
 * Adres `?fb=1`: donörün "pencereyi açık yükle" kapısı — yeni sekmede açılan
 * bağ da pencereyi açar. Odak: pencere kapanınca açan öğeye döner
 * (`gorus-gonder.js` açılış anındaki etkin öğeyi saklar). Açılışta menü
 * kapanır, odak menünün açıcısı (`#hamburger`) olur — menü içindeki bağ
 * kapanmış menüde görünmez, oraya odak verilemez.
 */
(function () {
  'use strict';

  function adres() {
    var u = new URL(window.location.href);
    u.searchParams.set('fb', '1');
    u.hash = '';
    return u.pathname + u.search;
  }

  function ac(e) {
    var sekme = document.getElementById('fbTab');
    if (!sekme) return;
    e.preventDefault();
    var kapat = document.getElementById('drawerClose');
    if (kapat) kapat.click();
    var acici = document.getElementById('hamburger');
    if (acici && acici.focus) acici.focus();
    sekme.click();
  }

  function menuKur() {
    var nav = document.querySelector('#drawer .drawer-nav');
    if (!nav || nav.querySelector('[data-gorus-giris]')) return;
    var komsu = [].slice.call(nav.querySelectorAll(':scope > .d-item:not(.d-has-sub):not(.d-acct-block)')).pop();
    if (!komsu || !komsu.querySelector('a.d-link')) return;
    var oge = komsu.cloneNode(true);
    var bag = oge.querySelector('a.d-link');
    bag.setAttribute('href', adres());
    bag.setAttribute('data-gorus-giris', 'menu');
    /* Aşama 2: etiket sekmenin sözlükten basılmış görünür metninden (TR "Görüş Bildir", EN "Feedback") —
       betikte dil listesi yok, TR DOM'u eskisiyle aynı. */
    var etiket = (document.getElementById('fbTab').textContent || '').trim() || 'Görüş Bildir';
    bag.innerHTML = '<i class="fa-solid fa-comment-dots"></i> ';
    bag.appendChild(document.createTextNode(etiket));
    bag.addEventListener('click', ac);
    // Hesap bloğundan önce, son sade öğenin ardından (Mutfak Sırları ailesinin altı).
    var hesap = nav.querySelector(':scope > .d-acct-block');
    nav.insertBefore(oge, hesap || null);
  }

  function kur() {
    if (!document.getElementById('fbTab') || !document.getElementById('fbModal')) return;
    menuKur();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
