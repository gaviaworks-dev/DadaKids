# Foto turu — ajan sözleşmesi (Yasin Bey kararı, 1 Kas; lead: ana oturum)

İlerleme: `tasks/handoff-kids.md` → "▶ SIRADAKİ — FOTO TURU" (F0–F7). V2 sözleşmesinin (tasks/v2-sozlesme.md) ortak kuralları aynen geçerli: git yok (yalnız lead), sahte onay yok, köşe yalnız var(--kd-r-*) token (1 Kas: token değerleri Dada Gastro ölçeği — rozet 6, chip 8, düğme 12, kart 16, büyük 24; sabit px yazma), Gastro header/footer yapısı korunur, boyut/ızgara/boşluk kapıları geçerli, Pütür kalır.

## Kural
- İçerik görsellerinin TAMAMI gerçek, fotoğraf kalitesinde. Kawaii/cartoon illüstrasyon, yüzlü yiyecek/obje, çizgi film öğesi yok. İçerik yerindeki çizgisel ikon panoları/SVG besin çizimleri de fotoğrafa döner.
- UI ikonları (menü, buton, rozet, liste imi, sekme ikonu gibi küçük çizgisel ikonlar) illüstrasyon sayılmaz, kalır.
- "Kids" hissi sahneden: silikon bebek kaseleri, yumuşak kaşıklar, mama sandalyesi, önlük, bölmeli tabaklar, küçük porsiyonlar, pastel/krem zemin, yumuşak gün ışığı, sade temiz kompozisyon, aydınlık ton.
- Bebek/çocuk yüzü yakın plan YOK (eller olabilir; yetişkin eli ölçek için olabilir). Marka/logo/yazı YOK. Tarifte olmayan malzeme YOK.
- Her görsel CSS render boyutunda webp (2× yoğunluk için render genişliğinin 2 katı yeterli; `width`/`height` öznitelikleri gerçek oran), anlamlı Türkçe alt metin (dekoratif değilse boş alt yok).
- QC: 1440 ve 390'da kırpımda ana nesne kesilmiyor. YZ bozukluğu (fazla/eksik parmak, erimiş kaşık, anlamsız yazı, yüz, logo) olan elenir ve yeniden üretilir. Elenenler `rapor/tmp/foto/elenen/<ajan>/` altına (neden dosya adında ya da manifestte).

## Stil tarifi (tek; tüm set)
Model: `seedream_v5_pro` (mevcut 27 tarif fotoğrafıyla aynı; `varlik/kids/gorsel/manifest.json`), 2k. Her prompt'un sonuna AYNEN eklenir:

> bright natural daylight from the left, airy high-key food photography, soft diffused shadows, warm cream linen or pale light-wood surface, pastel ceramic or food-grade silicone baby tableware (peach, mint, butter yellow), small baby-sized portions, clean minimal composition, generous negative space, fresh and appetizing, shallow depth of field, photorealistic, no text, no logos, no brand names, no cartoon, no illustration, no faces

Ürün tekli çekimleri: "single fresh <ürün>, centered, whole, on warm cream linen, top-down 3/4 view, soft left daylight" + stil tarifi (yuvarlak kırpıma uygun: nesne kadrajın ortasında, kenarlara ≥%15 boşluk).
Kesim aşamaları: aynı tabak (pastel mint silikon bölmesiz tabak), aynı zemin, aynı açı (üstten 3/4), her aşamada yalnız kesim/boyut değişir. Mümkünse ilk aşama görselini `higgsfield upload` + `--image` referansıyla sonrakilere taşı (tabak/zemin tutarlılığı).

## Kredi
Başlangıç bakiyesi 1049,63 (lead ölçtü). Tur tavanı ~400 → bakiye **650'nin altına inmez**. Ajan bütçeleri: foto-kesim 170 · foto-urun 100 · foto-genel 90 · yedek 40 (lead). Her üretimden önce `higgsfield generate cost …` ile maliyeti bil; bütçen dolarsa DUR, lead'e yaz. Her iş `rapor/tmp/foto/<ajan>/manifest.json`'a: dosya, model, prompt, jobId, kredi, deneme sayısı, elendi mi + neden. Başta ve sonda `higgsfield account status` çıktısını manifeste yaz.

## Sahiplik (iki ajan aynı dosyaya yazmaz)
| Ajan | Dosyalar |
|---|---|
| foto-kesim | `src/kids/sayfalar/kesim.mjs`, `varlik/kids/css/kesim.css`, `varlik/kids/js/kesim.js`, `veri/kesim.json`, yeni `varlik/kids/gorsel/kesim/*`, `varlik/kids/svg/kesim/*` (kaldırma) |
| foto-urun | `src/kids/ortak.mjs` içinde YALNIZ `urun()` yardımcısı, `src/kids/sayfalar/mevsim.mjs`, `varlik/kids/css/mevsim.css`, `varlik/kids/js/mevsim.js`, `veri/mevsim.json`, yeni `varlik/kids/gorsel/urun/*`, `varlik/kids/svg/urun/*` (kaldırma) |
| foto-genel | `src/kids/ortak.mjs` (urun() hariç: bosDurum, sahne, hero, modulKart, ctaKart vb.), `src/kids/sayfalar/{hub,araclar,rehber,donemler,tarifler}.mjs` + aynı adlı css/js (`hub, araclar, rehber, donem, tarifler, kiler, dogum-secici`), `src/kids/dogum.mjs`, `veri/rehber.json`, yeni `varlik/kids/gorsel/{rehber,arac,bolum,bos}/*` |
| foto-kapi (sonra) | yeni `araclar/foto-kapisi.mjs`, `rapor/tmp/foto/*` |

"Önce" görüntüleri: V2 yayın ağacı http://localhost:8771/DadaKids/ (dokunma). "Sonra": ana ağaç 8765.
Başkasının dosyası gerekirse SendMessage ile lead'e (`main`) yaz. Derleme: `node araclar/build.mjs <modül>`; yerel sunucu http://localhost:8765/DadaKids/.

## Teslim
Lead'e SendMessage: değişen dosyalar, üretilen/elenen görsel sayısı, harcanan kredi (başlangıç/son bakiye), önce/sonra görüntü yolları (`rapor/tmp/foto/<ajan>/once-sonra/`, 1440+390), kendi kontrolün (build + v2-kapisi/ek-kapisi/boyut/izgara ilgili sayfalar), açık kalan.
