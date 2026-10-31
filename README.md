# Dada Kids — prototip

Dada Gastro'nun içinde yaşayan **Dada Kids** dikeyinin (hamilelikten 36. aya bebek ve çocuk beslenmesi) statik prototipi.
Yayın: GitHub Pages. Arama motorlarına kapalıdır (`noindex`).

> ⚠️ **Örnek içerik.** Bu prototipteki yaş, kıvam, alerjen, evre ve besin bilgileri **uzman onayı bekleyen örneklerdir**;
> tıbbi tavsiye değildir. Her medikal blok sayfada bu şekilde işaretlenmiştir.

## Sayfalar (dalga 0 + 1)
| Sayfa | Ne |
|---|---|
| `index.html` | Gastro ana sayfası (birebir) + **Dada Kids bandı** (giriş kapısı A) |
| `tarifler.html` | Gastro tarif listesi (birebir) + **Dada Kids chip'i ve alt kategori kalemi** (kapı B) |
| *(her sayfada)* | Tarifler mega menüsünde **Dada Kids kartı** (kapı C) ve mobil çekmecede bağ |
| `kids.html` | Kids hub: profil adımı (yaş + cinsiyet), evreler, yaşa göre tarif önizlemesi, modüller, güven merkezi |
| `kids__tarifler.html` | Yaşa göre tarif kataloğu: zorunlu yaş çubuğu, kıvam / içermeyenler / süre filtreleri, demo kiler |
| `kids__tarif__balkabagi-puresi.html` | Gastro tarif sayfası (birebir) + yaş rozeti, kıvam, alerjen, "bu yaşta nasıl sunulur", kiler eşleme |

Profil URL'de taşınır (`?evre=6-8-ay&c=kiz`); hiçbir şey kaydedilmez (localStorage/sessionStorage yok).

## Nasıl çalışır
Kaynak transferi: canlı dadagastro.com sayfaları **olduğu gibi** alınır, yalnız `<main>` ve tanımlı ekleme noktaları değişir.

```bash
npm i                         # yalnız playwright (ölçüm için)
node araclar/snapshot.mjs     # donörleri + varlıkları çek → src/donor/, varlik/gastro/
node araclar/build.mjs        # src/donor + veri/ + Kids içerikleri → kökte statik HTML
node araclar/sunucu.mjs       # http://localhost:8765/DadaKids/  (Pages alt yolunu taklit eder)
node araclar/varlik-kapisi.mjs   # 1440/390: 404, JS hatası, yatay taşma
node araclar/parite.mjs          # kabuk ↔ canlı geometri (4px); BOZ=1 ile kırmızı verdiği gösterilir
node araclar/davranis.mjs        # gerçek tıklamalarla davranış kontrolleri
python3 -I araclar/who-to-json.py <xlsx-klasörü> veri/who-lms.json
```

| Klasör | İçerik |
|---|---|
| `src/donor/` | Canlıdan alınmış, yolları göreliye çevrilmiş donör sayfalar (elle düzenlenmez) |
| `varlik/gastro/` | Gastro CSS/JS/font/görsel kopyası (değiştirilmez) |
| `varlik/kids/` | Yalnız Kids eklentileri: `kids.css`, `kids.js` |
| `veri/` | `tarifler.json` (Gastro bebek tarifleri + Kids alanları), `evreler.json`, `besinler.json` (tek kaynak besin tablosu, iskelet), `who-lms.json` |
| `tasks/kids-plan.md` | Plan ve kararlar |

## Kaynaklar ve haklar
- Arayüz, metin ve görseller: **Dada Gastro** (dadagastro.com). Tarifler Gastro'nun *Bebek Tarifleri* kategorisinden alınmıştır.
- Büyüme verisi: **WHO Child Growth Standards** — CC BY-NC-SA 3.0 IGO; prototipte ticari olmayan kullanım, atıfla. Üretimde DSÖ izni gerekir.
- Gilroy yazı tipi, Gastro'nun kendi varlığı olarak (DadaMentor prototipindeki uygulamayla aynı) taşınmıştır; lisans kapsamı ayrıca teyit edilmelidir.
