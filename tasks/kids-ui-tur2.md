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

## 7. Pütür asistanı

# Pütür — kararlar
- karar: Video denemeleri kling3_0, 3 sn (modelin alt sınırı), start=end aynı idle kare, krom yeşil zemin. gerekçe: Birim maliyet 4,5–5,25 kr; 3 sn çekim sonradan 2–2,5 sn'ye hızlandırılabilir; start=end ilk/son kare idle uyumunu sağlar.
- karar: Video adayı 50420d95 (kling3_0 pro, P3) seçildi. gerekçe: 10 adaydan biçimi en iyi koruyan aday. Tur 1'de bacak/kol uzuyordu, kapak ayrılıyordu; Seedance adaylarında kapak havalanıyor ya da beyaz sticker kenarı/gölge ekleniyordu. Bu aday küçük ayak ve eldivenleri koruyor, kapak gövdede kalıyor; tek bozuk geçiş karesi (26–28) kesilecek.
- karar: Şerit rengi 5 ayrı video kopyası (zipla-pembe|mavi|seftali|mint|sari). gerekçe: Şerit evre ve temayla renk değiştiriyor; tek pembe video oynarken renk zıplıyordu. Kopyalar aynı hareket, ayıklama hattında şerit bileşeni yeniden boyanıyor, yalnız gerekli dosya iniyor.
- karar: Safari için HEVC alpha ürettim (hevc_videotoolbox), animasyonlu webp yedeğine gerek kalmadı. gerekçe: AVFoundation dosyada public.contains-alpha-channel raporladı.
- karar: Video yalnız Chromium ailesi (VP9) ve Safari'de (HEVC) oynar; Firefox ve diğerleri SVG/CSS zıplaması. gerekçe: Şeffaflık bozuk çıkma riskini almamak; iki yol da aynı koreografi.
- karar: Video kaynağında tek büyük sıçrayış + iniş sekmesi var (2–3 zıplama değil); SVG/CSS zıplaması 3 sekmeli. gerekçe: En temiz aday bu; 3 sekmeli Kling adaylarında bacak uzuyor ve kapak ayrılıyordu, tanınırlık önceliklidir.
- karar: Video kareleri %4,5 parlaklaştırıldı, ilk 4 ve son 5 kare SVG idle pozuna premultiplied karışımla bağlandı. gerekçe: Kling tüm kareyi ~%4 koyulaştırıyor; SVG ile geçiş fark edilmesin.
- karar: Dar ekranda (Pütür sol boşluğa sığmıyorsa) sayfa 48 px'ten fazla kayınca Pütür kenara çekilir (%60'ı görünür), tık/odak/menüde tam çıkar. gerekçe: Mobilde içerik sütununda boş sol kenar yok; kenara çekilmeden sabit maskot okunan içeriğin üstünde kalırdı.
- karar: Footer açılınca Pütür yasal bağların ve telif satırının üstüne kalkar (--pt-kaldir). gerekçe: Footer sabit perde; 768–1024'te telif sütunu Pütür'le kesişiyordu.
- karar: Klavyeyle açılışta (click detail 0) zıplama beklenmez, menü hemen açılır. gerekçe: Klavye/ekran okuyucu kullanıcısı 2 sn animasyon beklememeli.
- karar: Acil seçeneğinde düşünme animasyonu ve gecikme yok. gerekçe: Acil bilgi bekletilmez.
- karar: "Bu besin güvenli mi?" dönem matrisiyle aynı kuralı kullanır (minAy, durum, boğulma riski), profil hamilelikse hamilelik kayıtları görünür, bebek aramasından süzülür. gerekçe: besinler.json şeması bunu ister; site içi çelişki olmaz.
- karar: "Ek gıdaya hazır mı?" balonunda 3 işaret evreler.json'dan gelir, 5 işaretlik liste araca yönlendirilir. gerekçe: 5 işaret yalnız araç sayfasında; balonda tekrar yazmak ikinci kaynak yaratırdı.
- karar: Dosya değişikliği yapmadan önceki `rapor/tmp/putur-yarim` kopyasına dokunmadım; varlik/kids/putur/ içinde eski ad `zipla.webm` hiç üretilmedi. gerekçe: Tek kaynak varlik/kids/js/putur.js.
- karar: Safari yolu WebKit 2370 ile ölçüldü: Range destekli geçici sunucuda HEVC alpha hazır, oynadı, şeffaf (ekran görüntüsü tmp/webkit-video.png), menü açıldı, JS hatası yok. gerekçe: Ortak yerel sunucu (8765) Range yanıtı vermiyor (200, octet-stream), bu yüzden WebKit orada videoyu reddedip SVG/CSS zıplamaya düşüyor; bu sessiz ve hatasız bir yedek. GitHub Pages Range veriyor.
- karar: Firefox 1538 ile ölçüldü: video kullanmaz, SVG/CSS zıplar, menü açılır, JS hatası yok. gerekçe: Kasıtlı yedek yol.
- karar: Dar ekranda sayfanın en üstünde de, tam boy Pütür bir bağın/düğmenin ortasını örtecekse kenara çekilir. gerekçe: İlk sürümdeki "en üstte hep tam boy" kuralı içerik düzenine bağlıydı; kids-tarifler yaş şeridi yer değiştirince 390'da "Tümü" çipini örttü (kapi-taban.txt, 1996/1997). Yeni kontrol ızgara sınıfı kullanmaz.

## 9. Boyut geri alma, ızgara ve denge

Taban: e8ac2b6. Kural: öğe büyütülmez; kısa kolon içerikle doldurulur ya da düzen sadeleşir. Kapılar: araclar/boyut-kapisi.mjs, araclar/izgara-kapisi.mjs. Bilinçli sapmalar: araclar/boyut-istisna.json.

- karar (lead): tarih seçicideki gömülü küçük Pütür tamamen kaldırıldı. gerekçe: kullanıcı "buraya gömülü balonla konmasın" dedi; Pütür yalnız yüzen asistan.
- karar (lead): Ezilme testi kartına "Örnek içerik — uzman onayı bekliyor" etiketi eklendi. gerekçe: panel Atlas etiketinin dışında.
- karar (lead): evre üst etiketi tek satır, cümle düzeninde. gerekçe: kullanıcı "tek satır ve kısa" istedi.

### Geri alınan boyutlar

# FAZ 1 — boyut geri alma (denge4)

Taban: e8ac2b6 (8772) · Sonra: çalışma ağacı (8765). Sayılar tarayıcıdan ölçüldü (reducedMotion, 1440×900 / 390×844).

## Ölçüm: taban → sonra

| Sayfa · sınıf | 1440 taban | 1440 sonra | 390 taban | 390 sonra |
|---|---|---|---|---|
| araclar .kd-ar-kart | 575×431 | 576×421 | 358×405 | 358×399 |
| araclar .kd-ar-kart__ust | 511×84 | 512×84 | 314×84 | 310×84 |
| araclar .kd-ar-kart__ikon | 84×84 | 84×84 | 84×84 | 84×84 |
| araclar .kd-ar-guven | 1176×279 | 1176×269 | 358×591 | 358×591 |
| araclar .kd-ar-guven__yan | 484×175 | 491×175 | 314×239 | 310×239 |
| araclar #araclar .kd-bas | 1176×145 | 1176×145 | 358×160 | 358×160 |
| donem-6-8-ay .kd-hero__gorsel | 532×399 | 532×399 | 358×269 | 358×269 |
| donem-6-8-ay .kd-hero__izgara | 1176×399 | 1176×399 | 358×626 | 358×626 |
| rehber-ek-gidaya-gecis .kd-hero__gorsel | 364×273 | 364×273 | 358×269 | 358×269 |
| rehber-ek-gidaya-gecis .kd-hero__izgara | 1176×273 | 1176×273 | 358×604 | 358×602 |
| donem-hamilelik .kd-modul | 278×382 | 278×382 | 358×312 | 358×312 |
| donem-6-8-ay .kd-dsss | 880×402 | 880×396 | 390×458 | 390×452 |
| donem-6-8-ay .kd-dguven | 1240×72 | 1240×72 | 390×177 | 390×205 |
| donemler .kd-evre | 218×222 | 218×222 | 358×156 | 358×156 |
| donemler .kd-dyol | 1176×208 | 1176×194 | 358×559 | 358×491 |
| donemler .kd-devreler | 1176×222 | 1176×222 | 358×836 | 358×836 |
| guvenli-kesim .kd-khero | 532×330 | 532×330 | 358×269 | 358×269 |
| mevsim .kd-mhero | 532×320 | 532×320 | 358×260 | 358×260 |
| mevsim .kd-acik .kd-mpanel__bas | 1176×74 | 1176×86 | 1002×63 | 358×102 |
| mevsim .kd-mneden | 1240×372 | 1240×360 | 390×840 | 390×799 |
| mevsim .kd-mguven | 1240×72 | 1240×72 | 390×154 | 390×180 |
| tarif .kd-td-kutular | 788×190 | 788×190 | 358×501 | 358×499 |
| tarif .kd-kutu.kd-td-ipucu | - | 248×190 | - | 358×140 |
| arac-alerjen-takip .kd-at-bos | 706×96 | 709×88 | 358×137 | 358×129 |
| arac-persentil .kd-pr-bos | 764×281 | 764×265 | 358×225 | 358×217 |
| arac-persentil .kd-pr-sonuc | 764×433 | 764×409 | 358×470 | 358×454 |
| arac-hazir-mi .kd-hero__izgara | 1176×320 | 1176×320 | 358×222 | 358×222 |
| arac-hazir-mi .kd-hm-sonuc__canli | 411×151 | 411×149 | 318×136 | 318×134 |
| tarifler .kd-hero__izgara | 1176×300 | 1176×300 | 358×454 | 358×480 |
| kids .kd-hub-ay__kahraman:not([hidden]) | 544×131 | 544×131 | 322×183 | 322×183 |
| rehber-ek-gidaya-gecis .kd-rkutu | 720×124 | 720×116 | 358×147 | 358×166 |

## Geri alınan sınıflar (head → sonra)

- `.kd-ar-kart` 576×659 → 576×421 (390: 358×536 → 358×399). `.kd-ar-kart__resim` bandı kaldırıldı; illüstrasyon `.kd-ar-kart__ikon--illus` ile 84px simge kutusunda. Köşe dairesi `::before` geri geldi.
- `.kd-ar-izgara`, `.kd-gorundu` kart üzerinden tabana döndü.
- `.kd-ar-guven__yan` 491×291 → 491×175; ipucu kutudan çıkıp `.kd-ar-guven` altına `.kd-ar-guven-not` olarak indi. `.kd-ar-guven` 355 → 269.
- `.kd-ar-hero-illus`: araç sayfası 340 → 320 (rozet boyutu), hub 440 → 400 (kolaj boyutu). ≤1024 araç sayfasında gizli (tabandaki rozet gibi), hub'da 140px.
- `.kd-hero__gorsel` (dönem) 480×480 → 532×399; (rehber) 364×364 → 364×273; 390: 358×358 → 358×269. Kutu 4:3, kare görsel `object-fit: contain` ve kırpılmadan ortalı (kids.css'te tek kural; araclar/rehber/donem/mevsim.css kopyaları silindi).
- `.kd-hero__izgara` dönem 480 → 399, rehber 364 → 273.
- `.kd-modul` 278×514 → 278×382; `.kd-modul__illus` yerine `.kd-modul__ikon--illus` (64px). `.kd-dyardim` padding override'ı silindi (22px'e döndü).
- `.kd-evre` 218×408 → 218×222; `.kd-devre-g__resim` bandı yerine `.kd-evre__ikon--illus` (52px). `.kd-devreler` 408 → 222; 390: 2169 → 836.
- `.kd-dyol` 329 → 194; `.kd-dyol__resim` silindi, kıvam ikonu tabandaki 60px kutuda.
- `.kd-dsss` 1440×396 → 880×396; `.kd-dsss__ana`, `.kd-dsss__yan` kaldırıldı; Pütür notu ayrı `.kd-dsss__not` satırında (880px).
- `.kd-dguven` 116 → 72; 390: 269 → 205. `.kd-mguven` 104 → 72; 390: 238 → 180. Yeni ortak `.kd-ipucu--kompakt`.
- `.kd-mhero` 532×508 → 532×320; çerçeve 460×460 → 391×313 (video 5:4, contain). 390: 358×352 → 358×260.
- `.kd-mpanel__bas` 232 → 86; illüstrasyon 200 → 64 (390'da 56), metin satırı tabandaki gibi yan yana.
- `.kd-mneden` 577 → 360; `.kd-mneden__resim` silindi, kutu tabandaki gibi sağ kolonda, `align-items: center`.
- `.kd-mmevsim__resim` ≤1100'de gizli; yıl bölümü 390'da 2014 → 964 (taban 769; üç sütunlu ay blokları site turu bulgusu, kalan fark bundan).
- `.kd-murun` 768: 171 → 231; `minmax(172px)` ile sütun sayısı tabana döndü (12px boşluk 4. sütunu sığdırıyordu).
- `.kd-khero` 532×418 → 532×330; padding silindi, görsel en çok 330 yükseklik (390: 269), ölçek kartı tabandaki konumda.
- `.kd-td-kutular`, `.kd-kutu` 229 → 190; maskot başlık satırına indi (36px), metin kolonu 208px'e döndü.
- `.kd-at-bos` 164 → 88; 390: 235 → 129, sütun düzeni kaldırıldı. Görsel 56px.
- `.kd-pr-bos` 369 → 265; `.kd-pr-sonuc` 513 → 409. Görsel 76px.
- `.kd-hm-sonuc` padding 28px'e döndü; `__canli` 419×117 → 411×149.
- `.kd-bas` 390: 241/322 → 107/160; `.kd-ipucu--sag` ≤1024'te gizli (kids.css).
- `.kd-tl-video` 390: 358×269 → 240×180; 1024: 293 genişlik. `.kd-hero__izgara` 569 → 480.
- `.kd-hub-ay__kahraman` 544×157 → 544×131; 390: 279 → 183. `.kd-hub-ay__illus` silindi. `.kd-hub-mevsim`, `.kd-hub-ay` tabana döndü.
- `.kd-at-alt` padding yatay 20px'e döndü.

## Rehber makalesi: "içeri girmiş" bulgusu

`.kd-rmakale` 7 genişlikte tabanla aynı (1440: 720px, sol 518.8). İç öğelerde iki gerçek daralma bulundu ve düzeltildi:

1. `.kd-rfigur` sağa yüzüyordu: 3. bölümde başlık ve liste 720 → 486px, `li` 684 → 454px. Figür kaldırıldı (`.kd-rbolum--figur`, `.kd-rfigur`, `SAHNE`); bölüm 427 → 330px (taban 336).
2. `.kd-rkutu-putur`: padding + 104px maskot + balon içi padding metni L132/R16'ya itiyordu (metin 524px, taban 676px). Tabandaki `.kd-kutu.kd-rkutu` geri geldi, metin 672px; küçük Pütür başlık satırında (36px).

Ek: giriş ipucu `.kd-rgiris-ipucu` kompakt (maskot 104 → 64), balon metni genişledi. Liste `li` kenarı 18 → 16px (token yuvarlaması), tablo ve kaynak listesi tabanla aynı genişlikte.

## Değişen dosyalar

varlik/kids/kids.css · varlik/kids/css/{araclar,donem,hub,kesim,mevsim,rehber,tarifler}.css · src/kids/sayfalar/{araclar,donemler,hub,mevsim,rehber,tarifler}.mjs · araclar/boyut-kapisi.mjs (istisnada `genislik` alanı) · araclar/boyut-istisna.json · derlenen kids*.html

### Denge listesi

# Denge listesi (FAZ 3)

Kapı eşiği 96px ve %12. Ek tarama: 64px ve %8, 1440 ve 1024 (rapor/tmp/denge/denge-tarama.log).

| Sayfa | Bulgu (head) | Çözüm | Sonra |
|---|---|---|---|
| kids.html · `.kd-hub-profil__izgara` | 838 / 399, tarih seçici kart içinde hep açık | Seçici düğmeyle açılan popover / alt sheet; sağ kolona seçili evrenin 2 tarifi, Pütür balonu kaldırıldı | kart 721×423 (taban 399), sağ 433×405, fark 18px |
| kids-mevsim.html · `.kd-mneden` | 360 / 577 | FAZ 1'de sağdaki görsel kaldırıldı, taban düzeni `align-items: center` | 360 / 251, dikey ortalı |
| kids-rehber.html · `.kd-rguven` | 703 / 1287 | 1287 kapı hatasıydı: kapalı `details` içeriği sayılıyordu, kapı düzeltildi. Gerçek fark 148; ilk gösterilen kaynak 7 → 8 | 703 / 618 |
| kids-arac-persentil.html · `kdPersentil` | 689 / 513 | Boy notu "Ölçerken" kutusuna, örnek + lisans notu sağ kolona alındı | kapı yeşil |
| kids-arac-hazir-mi.html · `kdHazirMi` | 603 / 410 | Sonuç paneli yapışkan, liste kaydırılırken yanında kalır: `data-denge-serbest` | muaf |
| kids-tarif.html · `.kd-td-govde` | 880 / 498 | Malzeme sütunu yapışkan: `data-denge-serbest` | muaf |

Eşik altında kalan, dokunulmayanlar (64px taraması): `.kd-mkahraman` 408/487 (mevsim 1440), `.kd-hub-guven` 264/341 (hub 1440), `.kd-dikili` 434/360 (0-6 ay 1024). Üçü de 96px altında, bu yüzden değiştirilmedi.

### Kararlar

karar: Boşluk tokenı yuvarlamaları (22→24, 20→16 gibi ±2–6px) kalır; yalnız tur 2'nin bileşen özel padding override'ları ve kartı daraltan/uzatan olanlar tabana döndü (.kd-dyardim, .kd-devre-g, .kd-khero, .kd-mhero, .kd-hm-sonuc, .kd-at-alt). gerekçe: proje kuralı kd-s tokenı istiyor; kalanlar kapı toleransının altında.
karar: Kartlardaki illüstrasyonlar silinmedi, tabandaki simge kutusuna alındı (84/64/52px). gerekçe: kart boyutu tabanda kalırken üretilmiş görseller kullanılmaya devam eder.
karar: .kd-dyol illüstrasyonu tamamen kaldırıldı, kıvam ikonu kaldı. gerekçe: ikon evrenin kıvamını anlatıyor; 60px kutuya ikisi sığmaz.
karar: Kare hero görseli 4:3 kutuda kare olarak ortalı (kutu 532×399, görsel 399×399). gerekçe: object-fit contain + img genişliği %100 olsa köşe yuvarlaması görselin kenarına oturmaz.
karar: Mevsim videosu 5:4 olduğundan çerçeve 391×313. gerekçe: kırpma yok, tabandaki 420×315 yüksekliği korunur.
karar: Başlık yanı ipucu (.kd-ipucu--sag) ≤1024'te gizli. gerekçe: lead .kd-bas'ın tabana dönmesini istedi; bu notlar temel içerik değil, yüzen Pütür sayfada duruyor. Bilinen bedel: mobilde bu notlar görünmez.
karar: .kd-ipucu--kompakt ≤640'ta "Pütür'ün notu:" önekini gizler. gerekçe: .kd-dguven 390'da 18% sınırına ancak böyle sığıyor; metnin kendisi kalır.
karar: Araç sayfası hero illüstrasyonu ≤1024'te gizli. gerekçe: taban rozeti de gizliydi; 222px hero 446'ya çıkıyordu.
karar: .kd-ar-guven ipucu kutunun altına indi. gerekçe: kutu içinde kaldığında .kd-ar-guven__yan 291 oluyordu.
karar: SSS Pütür notu .kd-dsss içinde değil, altında ayrı satır. gerekçe: .kd-dsss 880 genişliğe dönünce yan sütun sığmıyor.
karar: Boyut kapısına istisnada isteğe bağlı `genislik` alanı eklendi. gerekçe: eşik gevşetme değil, istisnayı tek genişliğe daraltır; kids-mevsim 390'da taban 1002px taşıyordu, kıyas anlamsız.

# FAZ 2
karar: izgara3 yaması süzülerek `git apply --3way` ile uygulandı (scratchpad/izgara3-suz.patch). Atılan hunk'lar: donemler.mjs:477 (kaldırılan görsel bandı), hub.css (--kd-min silen), mevsim.css:80 ve :157 (4 sütun zorlayan), kids.css (tümü elle yazıldı). gerekçe: FAZ 1 boyutları ve sütun sayısı korunsun.
karar: .kd-sutun-N, .kd-evre-izgara, .kd-hizali--6, .kd-devre-g görsel kuralları, evre kartında dikey .kd-evre__ust alınmadı. gerekçe: kart genişliği/yüksekliği değiştiriyorlardı.
karar: .kd-dortlu sütunları .kd-izgara'nın otomatik sayısıyla aynı (4 / 3 / 2 / 1; 1160 ve 856 eşikleri ölçüldü). 3 sütunda altı izli ızgara. gerekçe: kart genişliği tabanda kalır, tek kalan kart ortalanabilir.
karar: Boş yuva kartları: Tüm besinler (.kd-dodak-cta, 4 ve 2 sütunda), Tüm tarifler (.kd-seri-cta), Evreleri karşılaştırın ve Ek gıdaya hazır mı (.kd-evre-cta, 5 sütunda gizli), Ezilme testi (.kd-kbogulma__bilgi, tek sütunda gizli). gerekçe: yalnız mevcut sayfalara yönlendirme ya da yamadaki metin; uydurma tıbbi içerik yok.
karar: Şerit 4 kart + 3 sütunda dördüncü kart gizli. gerekçe: orta genişlikte CTA ile iki satır olunca tarif detayı ve ogurme büyüyordu (366 → 757); gizleme satırı tam tutar, kart boyutu değişmez. Bedel: 1024'te 4. öneri görünmez, bu yüzden 16 küçülme istisnası eklendi.
karar: Tarif detay ve hub şeritleri mobilde yatay kaydırmaz, alt alta kalır; tarif detayında mobilde 3 kart. gerekçe: taban böyle; kaydırıcı kartı 358 → 240 daraltıyordu.
karar: Ay tarifleri kendi sütun kuralını taşır (1016 üstü 4, 766 üstü 3, 641 üstü 2), .kd-dortlu kullanmaz. gerekçe: tabanda --kd-min 230.
karar: .kd-mtezgah__liste sarmalı flex, sütun 6/5/4/3/2. gerekçe: tür süzgeci kart sayısını değiştirir; yamadaki sabit 4 sütun kartı 185 → 285 genişletiyordu.
karar: izgara-kapisi.mjs öneri denetimi span ve 6 izli 3 sütunu sayar, 3 sütunda 3 kart satırı tam kabul edilir. gerekçe: "sütun sayısı tabandaki gibi" kuralı; BOZ=1 ile kapı hâlâ kırmızı veriyor (2 sayfada doğrulandı).
karar: .kd-evre__aralik ≥641'de iki satır yer ayırır, alta hizalı. gerekçe: etiket satır sayısı başlık hizasını 14px bozuyordu; satır yüksekliğini en uzun kart belirlediği için kart büyümez.

# FAZ 3
karar: Tarih seçici sonuç kartı (.kd-ds__sonuc, küçük Pütür) açılır panelin içine alındı, kaldırılmadı; hub'daki .kd-hub-pütür balonu silindi. gerekçe: lead "görünüm ve mantık aynı" ve "gömülü balonu kaldır" dedi; sonuç metni seçici davranışının parçası.
karar: Popover modal değil ama Tab paneli içinde döner. gerekçe: alt sheet ile tek kod yolu; Esc ve dış tık kapatır.
karar: Panel açılınca sayfa en az miktarda kaydırılır (scrollIntoView nearest, instant). gerekçe: hero altındaki kart yüksek ekranda kesilmesin; sticky menü için scroll-margin var.
karar: Sağ kolondaki 2 tarif yalnız ≥1025'te. gerekçe: alt alta düzende denge sorunu yok, mobil büyümesin. Tarifi olmayan evrede (hamilelik, 0–6 ay) başlık "Ek gıdaya geçince" ve 6–8 ay tarifleri görünür.
karar: Üçüncü madde metni kısaldı ("Hiçbir yere gönderilmez, bu tarayıcıda durur."). gerekçe: .kd-hub-liste tabana dönsün; ayrıntı formun altındaki notta duruyor.
karar: Persentil .kd-pr-son sağ kolona alındı, .kd-pr ≤1024'te uzadı; istisna eklendi. gerekçe: içerik aynı, sayfa toplamı değişmedi.
karar: boyut-kapisi.mjs kapalı details içeriğini saymıyor. gerekçe: hata düzeltmesi, kd-rguven 1287 sahteydi; eşik değişmedi.
karar: hazirMi ve td-govde data-denge-serbest. gerekçe: yapışkan yan sütun, kalıcı boş alan yok.
