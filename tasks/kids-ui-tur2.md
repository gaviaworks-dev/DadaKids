# Dada Kids — UI tur 2

> Araştırma kolu · 31 Eki 2026 · Chrome eklentisi bağlı değildi → herkese açık HTML/CSS (curl) + web araması. Giriş yok, metin/görsel/kod kopyalanmadı; yalnız desen ve ölçü.

## 1. Araştırma bulguları

- **Solid Starts** · solidstarts.com · Çalışan: lacivert-gri mürekkep (#2F374D) + çok açık mavi/krem zeminler, büyük yuvarlatma (16–36px, butonlar tam hap), 9 ayrı `prefers-reduced-motion` kuralı. Animasyon kısa (.15–.3s), tek "vurgu nabzı" (.6s × 2). **Alınacak:** kısa geçişler, hareket azaltmaya tam saygı. **Kaçınılacak:** çizim azlığı, biraz klinik.
- **BabyCenter** · babycenter.com · Dalgayı tam genişlik ayırıcı yerine **köşe süsü** olarak kullanıyor (sağ üst / sol alt, `::after` + SVG). Radius 10–15px, kart gölgesi 300ms. **Alınacak:** köşe dalgası, sakin kart.
- **Tinybeans** · tinybeans.com · Yuvarlak hatlı font, 36/56px hap butonlar, kartta 32–36px radius, hamburger'da hafif yaylanma eğrisi (overshoot). 28 reduced-motion kuralı. **Alınacak:** yuvarlak başlık + büyük radius uyumu, yaylanmanın yalnız küçük öğede kullanılması. **Kaçınılacak:** pembe-kırmızı degrade CTA (çocuk sitesinde bağırıyor).
- **Yummy Toddler Food** · yummytoddlerfood.com · Cloudflare doğrulamasının arkasında; aşılmadı, incelenmedi.
- **Little Spoon** · littlespoon.com · Yenilenen kimlik (Little Big Brands / Smakk basın notları): her ürüne kendi ikonik illüstrasyonu, tek imza rengi (turkuaz), **tırtıklı (scalloped) daire rozetler** "test edildi / anne ilhamı" gibi güven mesajlarında. **Alınacak:** güven rozetini tırtıklı daire ile sevimli yapmak. **Kaçınılacak:** yüksek doygunluk, siyah ağırlıklı UI.
- **Cerebelly** · cerebelly.com · Markupta bulut motifleri; koyu lacivert + çok açık mavi. **Alınacak:** bulutu dekor, koyu tonu yalnız metinde tutmak.
- **Lalo** · meetlalo.com (sayfa içeriği gelmedi; basın) · Ana renkleri bilinçli bırakıp pastel, "yetişkin ev eşyası" estetiği. **Alınacak:** ebeveyne hitap eden olgun pastel.
- **Lovevery** · lovevery.com · Pentagram kimliği: el boyaması desenler, renk sekmeleri. Sitede **"renkli çubuklar" dekor şeridi** (mobil 14px / masaüstü 24px, yatay tekrar) ve yeşil/sarı dekoratif ayırıcılar; geri kalan her yer krem + lacivert ve çok sade. **Alınacak:** ince renkli şerit = bölüm ritmi; desen az yerde, sade zemin her yerde.
- **Huckleberry** · huckleberrycare.com · En yakın referans: tam genişlik **dalga ayırıcı** (absolute, bottom:-1px, svg width:100%), bölüm üstü/altı **beyaz bulut SVG'leri**, masaüstünde **yüzen illüstrasyon** (mobilde gizli), başlıkta fade-up (80px, 1s, easeOutQuart, .4s gecikme). Basma: scale(.95). Palet: açık mavi #DAE9F5, bej, krem #F8F6F3, şeftali #F6AB83. **Alınacak:** bulut/dalga + yüzen çizim + mobilde sadeleştirme. **Kaçınılacak:** 80px yükselme bizim yoğun sayfalarda fazla.
- **Dribbble / Contra "kids app UI"** · dribbble.com/shots/21844683, dribbble.com/shots/20264861, contra.com/p/XWoRl7oF · Karakter rehberli akış, kart tabanlı düzen, "yumuşak renk = güvenli ve yaklaşılabilir" gerekçesi.

**Ortak ders:** Güven = sade zemin + net metin + kısa hareket; tatlılık = az sayıda ama karakterli çizim, yuvarlak hatlar ve ayırıcı/rozet gibi "kenar" detayları. Dekor içeriğin arkasında kalıyor, asla üstünde değil.

## 2. Uygulanacak desenler

1. **Dalga ayırıcı:** bantlar arasında SVG dalga, yükseklik 40px (390) / 56px (≥1024), `fill` = **sonraki** bandın rengi, `position:absolute; bottom:-1px; line-height:0` (piksel boşluğu kalmasın). Sayfa başına en fazla 3; dalga ve bulut dönüşümlü.
2. **Bulut ayırıcı:** hub ve evre hero altında 3–4 tepecikli bulut kenarı (`--kd-beyaz` veya krem), 48–64px; ikinci katman %50 opak ve 12px kaydırılmış → derinlik.
3. **Evre zebra bantları:** bölüm zemini evrenin `-a` tonu ile kremin karışımı: `color-mix(in srgb, var(--kd-mavi-a) 45%, var(--kd-krem))`; ardışık bantlar krem ↔ evre tonu. Dikey dolgu 64px (390) / 96px (≥1024) = `--kd-s8`/`--kd-s9`.
4. **Nokta deseni:** yalnız hero ve CTA bandında, `radial-gradient` 2px nokta, 18–22px aralık, renk `-o` tonu, opaklık %10–12; `mask-image` ile kenarlara doğru sönsün. Metin bloklarının arkasına gelmesin.
5. **Konfeti/serpiştirme:** 5–7 küçük SVG (yıldız, kalp, damla, kaşık) hero köşelerinde, 8–16px, `-o` tonlarında, `aria-hidden`. Köşe süsü dalgası (BabyCenter tarzı) kart gruplarında sağ üst / sol alt.
6. **Renkli şerit:** footer üstünde ve hub bölüm başlıkları altında 5 evre renginden oluşan çubuk şerit, 10px (390) / 14px (≥1024), segment başı 24px radius.
7. **Tırtıklı güven rozeti:** "uzman onaylı / kaynaklı / alerjen bilgisi" için 12–14 dişli scalloped daire SVG (72–96px), `-o` zemin + `-k` ikon.
8. **Maskot rehber:** her ana sayfada en fazla 1 maskot + konuşma balonu (balon radius `--kd-r-l`, kuyruk 12px üçgen, max 2 satır ipucu). Balon metni içerik değil yönlendirme ("Önce kesim rehberine bak"). ≥1024'te yanda yüzer, 390'da başlık altında 64px satır içi.
9. **Görünüm animasyonu:** mevcut `.kd-gir` korunur, değerler: 12–16px yükselme, 320–400ms, `cubic-bezier(.25,1,.5,1)`, kardeş kademe 60ms (en fazla 6 öğe → 360ms tavan). Hero bir kez, ilk yüklemede.
10. **Hover / basma:** kart hover `translateY(-4px)` + `--kd-golge-yuksek`, 200ms; buton basma `scale(.96–.97)` 120ms; chip seçimi küçük yaylanma (overshoot eğrisi yalnız ≤40px öğede). Dokunmatikte hover yerine `:active`.
11. **Yüzen illüstrasyon:** mevcut `kd-suzul` 6–7s döngü, genlik ≤7px / ≤1.5°, ekranda en fazla 2 öğe; 390'da kapalı ya da statik. `prefers-reduced-motion` → tüm döngüler ve reveal kapalı, ayırıcılar kalır.
12. **Ritim:** başlık→giriş 12px, giriş→içerik 32px, kartlar arası 16px (390) / 24px (≥1024), bölümler arası 64/96px. Kart radius `--kd-r-l` (28px), buton hap. Sayfa başına tek vurgu rengi (evre `-k`).

## 3. Kaçınılacaklar

- Ana renk (kırmızı-sarı-mavi) doygun palet, neon, degrade CTA → güven ve ebeveyn estetiği düşer.
- Metnin arkasında desen, dalga veya konfeti; kontrast AA'nın altına düşen pastel üzerine pastel yazı (metin daima `--kd-murekkep` / `-k`).
- Sürekli dönen/zıplayan öğeler, otomatik oynayan karuseller, 600ms'den uzun etkileşim geri bildirimi.
- Güvenlik içeriğinde (boğulma, alerjen, kesim) şaka/maskot espri tonu; orada maskot yalnız işaret eder, uyarı kutusu sade kalır.
- Her bölüme ayırıcı koymak (ritim kaybolur); 3D/hiper gerçekçi stok görsel ile düz çizimi aynı bantta karıştırmak.
- Mobilde masaüstü dekorunu küçültmek yerine gizlemek/sadeleştirmek şart; yatay taşma yaratan absolute süsler (`overflow-x:clip` bandın kendisinde).
- Rakip çizim/metin/ikon birebir alınmaz.

## 4. Kararlar (lead)

- **karar:** Sayfa başına en fazla 3 dalga/bulut ayırıcı; bölüm ritmi zebra bant (`.kd-zebra[data-renk]`, açık ton %45 krem karışımı) + düz krem dönüşümü. **gerekçe:** araştırma (Huckleberry/Lovevery) ve "her bölüme ayırıcı koyma" uyarısı.
- **karar:** Yaş rozeti biçimi tek: "+N Ay" (eski "2–3 Yaş" → "+24 Ay"); evre adları "1–3 Yaş" olarak kalır. **gerekçe:** chip/rozet birliği; evre ≠ rozet.
- **karar:** Başlık fontu Fredoka (OFL, kendi barındırma `varlik/kids/font/`), gövde Gilroy. **gerekçe:** frontend-design skill "tipografi kişiliği taşır"; Gastro gövdesiyle tutarlılık.
- **karar:** İmza öğe = özgün maskot "Pütür" (krem bebek kasesi, şeftali püre buklesi); sayfa başına bir rehber konuşma balonu. **gerekçe:** skill "cesaretini tek yerde harca" + araştırma deseni.
- **karar:** İllüstrasyonlar nano_banana_pro (tek stil öneki + ilk onaylı görsel referansı), videolar kling3_0 (başlangıç=bitiş karesi, sabit kamera). **gerekçe:** 3'er model denemesi; en tutarlı çizgi ve döngü.
- **karar:** Güvenli Kesim çizimleri Higgsfield yerine el yapımı SVG (45 aşama + 15 bütün besin), tek ölçek (1 mm = 1,4 birim, yetişkin parmak ucu). **gerekçe:** boyut/şekil doğruluğu üretici modelde garanti edilemez; sevimlilik doğruluğu bozmamalı.
- **karar:** Logo dönüşümü: Gastro'da Kids bağına tıklayınca "gastro" → renkli "kids" (420 ms) sonra gidiş; Kids sayfası "dada kids" ile açılır; tersi Kids→Gastro. View Transitions (`@view-transition`) destekleyen tarayıcıda ek çapraz geçiş. **gerekçe:** ilk karede yanıp sönme yok, JS'siz de doğru logo.
- **karar:** Tema (cinsiyet) `localStorage['dadakids.tema.v1']` (try/catch), URL'deki `c` önceliklidir; alt menüdeki 3 noktalı seçici; zemin hafif kayar (kız #FFF6F4, erkek #F7F8FC), evre/uyarı renkleri sabit. **gerekçe:** kullanıcı isteği; AA korunur.
- **karar:** Kabuktan çerez bandı da kaldırıldı (prototipte analitik yok; bant yanıltıcı olurdu); parite ölçümü canlıda bandı "Reddet" ile kapatıp karşılaştırır. **gerekçe:** "kabukta yalnız görsel header/footer/nav".
- **karar:** Alerjen filtresi veride geçen her alerjeni ayrı seçenek yapar (yer fıstığı ≠ sert kabuklu; susam, balık); veride olmayan (sert kabuklu, soya) gösterilmez. **gerekçe:** sıfır sonuçlu seçenek kafa karıştırır.

## 5. Güvenli Kesim metin–çizim denetimi (özet)
Eski çizimler yalnız `sekil` anahtarından üretiliyordu; aynı şekilli besinler aynı çizimi alıyordu. 45 aşamanın hepsi besine özel yeniden çizildi ve metinle eşlendi. Öne çıkanlar:
- **Çilek** 6–8 ay: büyük olgun çilek boyuna ikiye kesilip bastırılmış (eskiden 9–12 ile aynı çizim) · 9–12 ay: ~1 cm (nohut) parçalar · 12+: boyuna dörtte bir / ince dilim.
- **Üzüm / kiraz domates**: 6–8 bastırılmış dörtte bir, 9–12 ayrı dörtte bir, 12+ dörtte bir + çarpılı bütün tane (4 yaşa kadar).
- **Havuç / elma 12+**: metin "çiğse yalnız rendelenmiş / kâğıt inceliğinde" olarak düzeltildi (eski çizim çiğ çubuk gösteriyordu).
- **Peynir 6–8**: lor + rendelenmiş kaşar (eski çizim iki büyük küptü, "asla" satırıyla çelişiyordu).
- **Salatalık 6–8**: parmaktan uzun kalın soyulmuş çubuk (eski "parmak boyu" metinle çelişiyordu).
- Ölçek birliği: 9–12 ≈ 1 cm (nohut), 12+ ≈ 1,5 cm lokma. Tüm tablo: kesim2 raporu (handoff tarihçesi).

## 6. Tema teşhisi (pembe neden görünmüyordu)
- **Uygulanıyor muydu?** Evet: `html[data-kd-tema="kiz"]` doğru yazılıyor, localStorage `dadakids.tema.v1` okunuyor, kids.js tema sınıfını ilk boyamadan önce (betik başında) uyguluyor. Sorun uygulama sırası değildi.
- **Neden görünmüyordu?** Pembe tema zemin token'larını mavinin yarısı kadar değiştiriyordu ve kremle aynı sıcak tonda kalıyordu: ΔE(nötr→pembe / nötr→mavi) krem 3,2 / 6,7 · krem-2 6,2 / 12,5 · çizgi 7,7 / 14,6. Mavi soğuk yöne kaydığı için krem zeminde belirgin, pembe ise şeftali/krem ailesinde kaybolduğu için fark edilmiyordu. Yalnız butonlar (tema rengi) değişiyordu.
- **Düzeltme:** pembe lila-fuşya aralığına alındı (krem #FDF2FA, krem-2 #F8E2F3, çizgi #EDD5E9, tema #A23585, tema-açık #F5DEF2): zemin ΔE 8,4 (mavi 6,7), krem-2 16,1 (mavi 12,5); Hamilelik pembesinden (tema-açık ↔ pembe-a 7,4; tema ↔ pembe-k 23,8) ve şeftaliden (16) ayrık; beyaz/tema 6,2:1 (AA). İki tema da aynı yüzeyleri değiştirir: zemin, bantlar, çizgiler, gölge tonu (`--kd-golge-ton`), hero zemini (tema-açık radyal), alt menü aktif sekme, butonlar, seçili chip'ler. Evre ve uyarı renkleri sabit.
- **karar:** mavi tema-açık #DCE9F9 ve zemin #F5F8FD'ye hafifçe güçlendirildi (pembe ile simetri). **gerekçe:** tema kapısında iki temanın değişen piksel oranı benzer olmalı.
- **karar:** Modül adı "Rehber & Uzman" → "Rehber" (görünen her yerde). **gerekçe:** içerik henüz uzman tarafından incelenmedi; "Uzman" ifadesi onay varmış izlenimi veriyordu (site turu bulgusu S1 ile aynı dürüstlük ilkesi).

## 8. Logo figürleri (çöp adam → Higgsfield cartoon)
- karar: eski SVG çöp adamlar kaldırıldı; nano_banana_pro 2k, 4 aday (işler e44d6ad5, e724fb8c, 1ab8093d, ef082041; tek çizimde iki çocuk, aynı stil garantisi). gerekçe: kullanıcı kaba bulduğu figürlerin yeniden üretilmesini istedi.
- karar: Aday 1 seçildi. gerekçe: kıvırcık saç Pütür'ün kapak kıvrımını yankılıyor, domates tişört "dada" rengiyle aynı, sarı elbise küçük boyda ayrışıyor, ince çöp kol/bacak korunuyor.
- karar: düz yeşil zemin + kendi kroma ayıklaması, şeffaf WebP (vektör değil). gerekçe: potrace tek renkli; WebP'de gölge ve renk korunuyor, dosyalar 3–12 KB.
- karar: `<image>` tek yerleşim (`LOGO_COCUKLARI`), iki dosya: header 102px (34px @3x, çizgi optik kalınlaştırılmış), hero 240px. bant header dosyasını kullanır. gerekçe: logo tek bileşen, boyuta göre ayrı dosya.
- karar: yerleşim: el sallayan çocuk sol altta "d"nin yanında, zıplayan çocuk sağ üstte "s"nin ucuna tutunuyor; harflerin üstüne binmez. 320px'te de sığıyor (eylem düğmelerine 8px), ≤360 gizleme kuralı kaldırıldı.
- karar: favicon ve dokunma ikonu yalnız "k" (figürsüz); `dada-kids-sade.svg` figürsüz kalır; `dada-kids.svg` figürleri gömülü taşır.

