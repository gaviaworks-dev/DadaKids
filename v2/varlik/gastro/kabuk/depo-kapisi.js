/* DEPO KAPISI — kullanıcı verisi tarayıcıya yazılmaz.
 *
 * 🔴 KURAL (CLAUDE.md · Beyar): kullanıcının yazdığı her şey HESABA yazılır.
 * Depoya yazan, hesaba yazmış sayılmaz.
 *
 * 🔴 KUSURUN KAYNAĞI KANONDA VE KANON DEĞİŞTİRİLEMEZ. Donörün paylaşılan
 * "Şef sohbeti" bileşeni (`public/kanon/gomulu/j-*.js`, prototipin birebir
 * kopyası) sayfa açılır açılmaz `dm_fit*` anahtarlarıyla maket sohbet/plan
 * verisi yazıyor; Gastro'nun kendi prototip katmanı da `dm-gastro-p4*`
 * yazıyor. İkisi de üye ekranlarının 19'unda ve public'in 39'unda koşuyor.
 *
 * 🔴 NEDEN KABUKTA, SAYFADA DEĞİL. İlk çözüm bu betiği türetilmiş markup'ın
 * `<head>`ine, dokuz dosyaya ayrı ayrı koymuştu. Üç sakıncası ölçüldü:
 * (1) türetilmiş markup prototipin BAYT KOPYASI olmalı — ona kod eklemek
 * "git diff yalnız içerik satırı gösterir" ölçütünü kırar; (2) dokuz kopya
 * dokuz ayrı yerde bayatlar; (3) kalan 49 ekran (10 üye + 39 public) korumasız
 * kalır. Kabuk katmanı zaten her HTML yanıtının `<head>`ine enjekte ediliyor
 * (`App\Http\Middleware\KabukKimligi`) ve sayfanın kendi betiklerinden ÖNCE
 * koşuyor — doğru yer burası.
 *
 * 🔴 ENGELLEME SESSİZ DEĞİL. Engellenen her deneme `window.__dmDepoEngellenen`
 * dizisine yazılır. Sessizce yutsaydık, `f4/depo-sayimi.mjs` kapısı hiçbir
 * deneme göremez ve "temiz" derdi — oysa temizliği üreten şey BU BETİK olurdu.
 * Kapı iki sayıyı ayrı bildirir: depoya ULAŞAN yazma (0 olmalı) ve KANONUN
 * DENEDİĞİ yazma (bilgi; sıfırlanması kanonun kendi turunda olur).
 *
 * Arayüz kolaylıkları (tema · açık sekme · kapalı bölüm) DOKUNULMAZ: onlar
 * kullanıcı verisi değil, o tarayıcıya özel görünüm tercihidir.
 */
(function () {
  'use strict';

  /* Ölçülerek yazıldı, tahminle değil: `rapor/f4/taban-depo.json` bu iki
     öneki `dm_fit` (donör) ve `dm-gastro-p4` (Gastro prototip katmanı) diye
     saydı. Yeni bir önek eklemek bir KARAR'dır ve rapora geçer. */
  var YASAK = [/^dm_fit/, /^dm-gastro-p4/];

  function yasakMi(k) {
    for (var i = 0; i < YASAK.length; i++) {
      if (YASAK[i].test(k)) return true;
    }

    return false;
  }

  window.__dmDepoEngellenen = window.__dmDepoEngellenen || [];

  var asil = Storage.prototype.setItem;
  Storage.prototype.setItem = function (anahtar, deger) {
    var k = String(anahtar);
    if (yasakMi(k)) {
      try {
        window.__dmDepoEngellenen.push({
          anahtar: k,
          uzunluk: String(deger == null ? '' : deger).length,
          yigin: (new Error().stack || '').split('\n').slice(2, 4).join(' | ').slice(0, 200),
        });
      } catch (e) { /* ölçüm ürünü bozamaz */ }

      return;
    }

    return asil.apply(this, arguments);
  };

  /* Bir kez yazılmış olan da temizlenir: koruma kurulmadan önceki bir
     oturumda düşmüş anahtarlar kullanıcının tarayıcısında kalırdı. */
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (k && yasakMi(k)) localStorage.removeItem(k);
    }
  } catch (e) { /* özel kip / kapalı depo */ }
})();
