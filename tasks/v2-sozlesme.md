# Dada Gastro Kids V2 — ajan sözleşmesi (lead: ana oturum)

Kaynak: `/Users/gaviaworks/Desktop/Dada Gastro Kids Kapsamlı Revizyon Dokümanı.pdf` (REV-2026-DK01, yönetim kararı; önceki tur kararlarıyla çelişirse bu geçerli). Metin: `pdftotext -layout "<yol>" -`.
İlerleme listesi: `tasks/handoff-kids.md` → "▶ ŞU AN — V2". v1 karşılaştırma: yerelde `http://localhost:8765/DadaKids/v1/kids.html` (dokunma: `v1/` klasörü dondurulmuş kopyadır).

## Ortak kurallar (her ajan)
- **Git yok** (commit/push/reset/checkout yalnız lead). Kendi dosyalarına yaz; başkasının dosyasına yazman gerekirse SendMessage ile lead'e (`main`) yaz.
- Derleme: `node araclar/build.mjs <modül>` (yalnız kendi modülün + Gastro sayfaları) ya da tam `node araclar/build.mjs`. Yerel sunucu: `http://localhost:8765/DadaKids/` (ana ağacı sunar).
- Gastro header/footer yapısı korunur (yalnız sticky davranışı değişir; DOM'a öğe eklenmez, yalnız sınıf/CSS). Nav'a DADA KIDS kalemi eklenmez. `src/donor/*` ve Gastro CSS'ine dokunulmaz. Gastro kodu (DadaMentor/gastro-mysql) salt okunur.
- Tıbbi içerik: "Örnek içerik — uzman onayı bekliyor" (`o.ornek()`). **Sahte onay yasak**: "onaylı", "uzman onaylı", "doktor onaylı" iddiası yalnız `o.guvenRozeti()`/`o.inceleyenUzman()` üzerinden ve `veri/uzman-onay.json` `onayli:true` iken çıkar. "Pediatrist" kelimesi KULLANILMAZ. Uydurma doktor/yorum/puan yok. İlk yardım adımı yok.
- İsim: görünür her yerde **"Dada Gastro Kids"** (title, meta, og:site_name, breadcrumb, aria-label, metin). "Dada Kids" kalmaz (URL/dosya adları/kod tanımlayıcıları değişmez).
- **"Mevsim" → "Mevsim Takvimi"** (menü, başlık, breadcrumb, bağ metinleri; dosya adı `kids-mevsim.html` aynı).
- Görsel dil: profesyonel FoodTech. Maskot, Pütür, yüzlü karakter, kawaii illüstrasyon (`varlik/kids/illus/*`, `varlik/kids/maskot/*`, `varlik/kids/putur/*`, `varlik/kids/logo/cocuk-*`), bulut/yıldız/parıltı süsleri (`.kd-hero__sus`, `kd-yuz`, `ikon('parilti')` süs olarak), dalga/bulut ayırıcı (`o.ayirici`), desenler (`kd-desen--*`), konfeti YOK. Yerine: `varlik/kids/gorsel/*.webp` ve `varlik/kids/gorsel/tarif/*.webp` gerçekçi fotoğraflar ya da sade çizgisel ikonlar (`o.ikon`, v2-cekirdek çizgisel olarak yeniden çizer; dosya adları aynı). Hero videoları (`o.video`) kawaii ise kaldır, foto kullan.
- **Köşe yarıçapı ≤ 8px.** Token'lar (kids.css, v2-cekirdek): `--kd-r-s:4px --kd-r-m:6px --kd-r-l:8px --kd-r-xl:8px --kd-r-tam:6px --kd-r-daire:50%`. Kendi CSS'inde yalnız `var(--kd-r-*)` kullan; sabit `border-radius` > 8px ya da `999px`/`50%` (daire olmayan öğede) YOK. Daire yalnız avatar/ikon dairesi (eşit en-boy) için `var(--kd-r-daire)`.
- Boyut/ızgara/boşluk kuralları ve kapıları geçerli (bosluk ≥24px metin→kutu, mobil 20; spacing ölçeği; yarım ızgara). Kart/görsel boyutlarını dengelemek için büyütme yok.
- Erişilebilirlik: klavye, görünür odak, `prefers-reduced-motion` (animasyonsuz), 390 ve 320 px'te yatay taşma yok.
- localStorage her okuma/yazmada try/catch; depolama kapalıyken sayfa çalışır.

## Ortak bileşenler (src/kids/ortak.mjs — imzalar SABİT, görünüm/CSS v2-cekirdek)
- `o.guvenRozeti({sinif})` → hero güven rozeti (onaysız: "Uzman onayı bekliyor — Çocuk doktoru & çocuk diyetisyeni incelemesi").
- `o.inceleyenUzman({sinif})` → makale/tarif "İnceleyen uzman: İnceleme bekliyor".
- `o.guvenlikSeridi()` → hero'nun hemen altına konan kalıcı uyarı şeridi; bağ `o.YASAKLI_REHBER` = `kids-rehber-yasakli-gidalar.html`.
- `o.kidsAgeBadge(yas)` → "+6 AY"; `o.kivamGostergesi(kivam)` → Pürüzsüz Püre / Çatalla Ezilmiş / BLW Parmak Gıda / Aile Sofrası.
- `o.kilerDugmesi(t)` → `<button class="kd-kiler-ekle" data-kd-kiler-ekle=slug data-ad data-malzeme="anahtar …">`; davranış `varlik/kids/js/kiler.js` (v2-tarif).
- `o.tarifKart(t)` → TÜM bebek tarif kartlarının tek bileşeni (v2-cekirdek yeniden yazar: `<article class="kd-kart kd-tarif" data-yas data-kivam data-malzeme …>`, sol üstte kidsAgeBadge, altta kivamGostergesi + kilerDugmesi, başlıkta uzatılmış bağ). Başka yerde tarif kartı elle çizilmez; mini liste gerekiyorsa da rozet + kıvam taşır.
- `o.hero({...})` → v2-cekirdek süsleri kaldırır; `serit:true` seçeneğiyle güvenlik şeridini hero'nun hemen altına ekler.
- Build (v2-cekirdek): tüm Kids sayfalarına `yardim` (Pütür yerine) ve `kiler` css/js eklenir; Pütür dosyaları yüklenmez.

## Sahiplik (iki ajan aynı dosyaya yazmaz)
| Ajan | Dosyalar |
|---|---|
| v2-cekirdek | `src/kids/ortak.mjs`, `araclar/build.mjs`, `varlik/kids/kids.css`, `varlik/kids/kids.js`, `varlik/kids/css/mega.css`, `varlik/kids/svg/ui/*`, `varlik/kids/logo/*`, yeni `varlik/kids/js/yardim.js` + `css/yardim.css`; `putur.*` kaldırma |
| v2-hub | `src/kids/sayfalar/hub.mjs`, `varlik/kids/js/hub.js`, `varlik/kids/css/hub.css`, `src/kids/dogum.mjs`, `varlik/kids/js/dogum-secici.js`, `varlik/kids/css/dogum-secici.css` |
| v2-sayfalar | `src/kids/sayfalar/{araclar,donemler,kesim,mevsim,rehber}.mjs` + aynı adlı `varlik/kids/css/*.css` (`araclar,donem,kesim,mevsim,rehber`) ve `varlik/kids/js/*.js` (araç js'leri, donem, kesim, mevsim, rehber), `veri/rehber.json`, `veri/mevsim.json`, `veri/kesim.json`, `veri/evreler.json` |
| v2-tarif | `src/kids/sayfalar/tarifler.mjs`, `varlik/kids/css/tarifler.css`, yeni `varlik/kids/js/kiler.js` + `css/kiler.css`, yeni `veri/bebek-dolabi.json`, `veri/kids-tarifler.json`, `veri/besinler.json` |
| v2-kapi | `araclar/*-kapisi.mjs`, `araclar/davranis.mjs`, `araclar/varlik-kapisi.mjs`, yeni `araclar/v2-kapisi.mjs`, `rapor/tmp/v2/*` |

## Teslim
İş bitince lead'e (`main`) SendMessage: değişen dosyalar, ne yapıldı (madde no), kendi kontrolün (build + ilgili kapı/ölçüm sonucu), açık kalan.
