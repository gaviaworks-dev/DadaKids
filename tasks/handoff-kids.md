# Dada Kids — yenileme turu (handoff)

> Compact/clear sonrası İLK İŞ: bu dosyanın "▶ ŞU AN" bölümünü oku, oradan devam et.
> Görev metni: Beyar'ın 31 Eki "kapsamlı yenile" isteği (görsel kimlik + tüm modüller dolu + Kids tarifleri). Push ÖNCESİ DUR ve Beyar'a sor.

## ▶ ŞU AN
- **yapılanlar:** handoff kuruldu · Higgsfield başlangıç kredisi 5095,93 (ultra plan) · model maliyetleri: nano_banana_pro 2 · seedream_v5_pro 2,5 · flux_2 1 · gpt_image_2 6,5
- **QA geçti:** varlık kapısı 46/46 (23 sayfa × 2 genişlik) · davranış 35/35 (iç bağlantı taraması, Dalga/puan yok, tema değişmezliği, katalog, detay) · parite 14/14
- **sıradakiler:** Beyar'dan PUSH onayı bekleniyor (9 commit yerelde, origin/main'in önünde). Onay gelince: git push → Pages derlemesini bekle → canlıda varlik-kapisi (TABAN=https://gaviaworks-dev.github.io/DadaKids/)
- **commitler:** 3c1e959 tasarım sistemi · 7189dbd görseller · 526ca0d içerik · 47c058c hub+tarifler · 078bd29 dönem/kesim/mevsim/rehber · 8ddbc03 araçlar · 5046d72 bant+yönlendirme · ff0d62c kapılar · (bu) docs
- **teslim görüntüleri:** rapor/tmp/teslim/ (gitignored)
- **QA notu:** bak.mjs artık tekerlekle kaydırıyor (kd-gir animasyonları için) · hub hero kadrajı 5:4 / %82
- **lead tamamladı:** kids.js v2 · hub.mjs (+css/hub.css, js/hub.js) · tarifler.mjs (kids-tarifler + kids-tarif, +css/tarifler.css) · .kd-sayfa padding = --header-offset (112/62) · görsel kadrajları
- **görsel BİTTİ:** 37 foto (Seedream v5 Pro) + 56 SVG · manifest varlik/kids/gorsel/manifest.json · bizim harcama 126 kredi (48 iş × 2,5 + 6 test); hesapta başka bir oturumun Nano Banana işleri de var (~44 kr, bizim değil)
- **içerik BİTTİ:** 27 tarif dolu · evreler 5 · rehber 4 · kesim 15 · mevsim 12 ay · besinler 48 (hamilelik:true 8 kayıt) · lead düzeltmesi: bulgur pilavı + mücver evre→1-3-yas (yaş 12)
- **araçlar BİTTİ:** kids-araclar + 4 araç (hazır mı · 3 günlük gözlem localStorage dadakids.alerjenTakip.v1 · öğün planlayıcı dadakids.ogunPlani.v1 · persentil) · Playwright 1440/390 geçti · not: tam sayfa görüntüde footer boş görünüyor (altbilgi-perde) → lead kontrol edecek
- **sayfalar BİTTİ:** donemler (1+5) · guvenli-kesim · mevsim · rehber (1+4) — 13 sayfa
- **açık ajanlar:** yok (hepsi bitti)
- **yazıldı (lead):** varlik/kids/kids.css v2 · src/kids/ortak.mjs · araclar/build.mjs v2 (Kids kabuğu = tarif detayı donörü; eski kids__*.html → yönlendirme)
- **iskelet:** veri/kids-tarifler.json 27 tarif (12×6–8 ay, 8×9–12 ay, 7×1–3 yaş) yazıldı
- **bekleyen kararlar:** —
- **bekleyen onaylar:** commit (concern bazında) · PUSH (Beyar'a sorulacak)

## Mimari (yeni tur)
- Dosya adları: kullanıcı kuralı **tireli** (`kids-tarifler.html`, `kids-tarif.html?t=<slug>`). Eski `kids__*.html` → yönlendirme sayfası.
- `araclar/build.mjs` (lead): kabuk + global eklemeler + `src/kids/sayfalar/*.mjs` modüllerini döngüyle derler.
- `src/kids/ortak.mjs` (lead): ortak komponent yardımcıları (rozet, chip, kart, hero, örnek şeridi…).
- `varlik/kids/kids.css` (lead): tasarım sistemi v2 (token'lar + çekirdek komponentler). Sayfa kollarının CSS'i `varlik/kids/css/<kol>.css`, JS'i `varlik/kids/js/<kol>.js` — her dosyanın tek sahibi var.
- Veri: `veri/kids-tarifler.json` · `veri/evreler.json` · `veri/kesim.json` · `veri/mevsim.json` · `veri/rehber.json` · `veri/besinler.json` · `veri/who-lms.json`.

## Dosya sahipliği (iki ajan aynı dosyaya yazmaz)
| Kol | Dosyalar |
|---|---|
| lead | build.mjs, ortak.mjs, kids.css, kids.js, hub (kids.html), kids-tarifler / kids-tarif, index bandı, tarifler.html bağları, handoff, commit |
| görsel | varlik/kids/gorsel/**, varlik/kids/svg/** |
| içerik | veri/kids-tarifler.json (iskelet sonrası), veri/evreler.json, veri/rehber.json, veri/kesim.json, veri/mevsim.json |
| sayfalar | src/kids/sayfalar/{donemler,kesim,mevsim,rehber}.mjs, varlik/kids/css/{donem,kesim,mevsim,rehber}.css, varlik/kids/js/{kesim,mevsim}.js |
| araçlar | src/kids/sayfalar/araclar.mjs, varlik/kids/css/araclar.css, varlik/kids/js/{hazir-mi,alerjen-takip,ogun-planlayici,persentil}.js |

## Kurallar (her ajan brief'inde)
- Tıbbi içerik "Örnek içerik — uzman onayı bekliyor" etiketli; uydurma doktor adı/yorum/puan yok.
- tasks/kids-plan.md §6.2 düzeltmeleri (patlıcan yasaklı değil; dondurulmuş "riskli" değil; 3 gün = gözlem; inek sütü ana içecek 12 ay; bal 12 ay; yuvarlak besinler 4 yaşa kadar bütün değil; bütün kuruyemiş 5 yaş; yumurta/fıstık erken tanıştırma).
- Gastro header/footer aynen; Kids içerik alanı Kids kimliğinde. Nav'a kalem yok.
- Git yalnız lead'de; ajan commit atmaz.

## Tarihçe
- 31 Eki: dalga 0+1 yayında (https://gaviaworks-dev.github.io/DadaKids/), 5 commit pushlandı.
