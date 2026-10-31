# Dada Kids — Prototip Planı (GitHub Pages)

> Durum: **dalga 0 + 1 tamam** · 31 Ekim 2026 · yayın: https://gaviaworks-dev.github.io/DadaKids/
> Kesinleşen kararlar: nav'a kalem yok, üç giriş kapısı (§1.3) · profil URL parametresiyle (`?evre=…&c=…[&ay=…]`) · hitap "siz".
> Renkler (kontrast ölçümlü): yaş rozetleri +6 `#6D28D9` · +8 `#1D4ED8` · +9 `#B45309` · +12 `#15803D` · +18 `#0F766E` · 2–3 yaş `#1F2937`;
> tema `--kd-tema`: kız `#B8537A` · erkek `#4C7A9E` · nötr Gastro tomato. Tema ↔ rozet ΔE ≥ 30, tema rengi beyazda ≥ 4,4:1.
> Kaynaklar: `referans/Dada Kids Ürün ve Mimari Spesifikasyon Dokümanı.pdf` (v1.2), `referans/Dada Kids 6 Ana Kategori Spesifikasyon Dokümanı.pdf`, `referans/PHOTO-2026-10-31-16-19-27.jpg` (site haritası)
> Gastro incelemesi: `gastro-mysql` deposu (salt okuma) + dadagastro.com canlı HTML (curl, salt okuma). Chrome eklentisi bağlı değildi; ekran görüntüsü alınamadı, değerlendirme DOM/HTML üzerinden yapıldı.

---

## 0. Özet

- Dada Kids **ayrı site değil**: Gastro'nun kabuğu (header, global nav, mobil çekmece, alt çubuk, footer, token'lar) birebir taşınır. Değişen tek şey `<main>` içeriği. **Global nav'a kalem eklenmez** (Beyar kararı, 31 Eki). Kids'e erişim üç giriş kapısından olur: ana sayfa widget'ı, Tarifler listesi ve Tarifler mega menüsü (§1.3).
- Sayfalar Gastro'nun mevcut iki kalıbının hibritidir:
  - **Liste kalıbı** (kategori / seçki sayfası): `lst-top` hero → `lst-layout` (`lst-side` filtre paneli + `lst-grid` `r-card`) → `pagi`. Tarifler, Güvenli Kesim listesi ve Mevsimsel tezgâh bu kalıptan türer.
  - **Bilgi kalıbı** (Mutfak Sırları ailesi): `lst-top px-band` hero → `gnav` sekmeleri → `seo-intro` (metin + `seo-aside`) → `rstep-track` / `topic-grid` / `disc-grid` → `next-sec`. Dönemler, Rehber ve hub sayfaları bu kalıptan türer.
  - **Araç kalıbı** (Ölçü Birimleri): `ob-top` + `ob-tabs` + `conv-card` / `cv-result` / `cv-side`. Kids Araçlar bu kalıptan türer.
- Yeni olan her şey `kids.css` içinde, Gastro token'larını (`--ink`, `--cream`, `--tomato`, `--sp-*`, `--radius-*`) kullanan ek komponentlerdir. Gastro kanon dosyaları değiştirilmez.
- Medikal her blok **"Örnek içerik — uzman onayı bekliyor"** işaretini taşır. Araştırmada spesifikasyonun bazı tıbbi ifadelerinin ana akım rehberlerle çeliştiği görüldü (bkz. §6.2). Bu ifadeler prototipe yazılmaz; ürün kararı beklenir.

---

## 1. Gastro kabuğu: inceleme ve kaynak transferi

### 1.1 Bulgular (canlı dadagastro.com, 31 Eki)

| Parça | Seçici / dosya | Not |
|---|---|---|
| Header | `header.header.kabuk-basi` → `.h-top .wrap.kap` → `.brand` (SVG wordmark) + `nav.nav.ana-menu` + `.head-actions` | Hero üstünde `at-top tepede` (saydam), kaydırınca dolar (`baslik-zemin.js`) |
| Global nav | `.nav-item` ×5: **Tarifler** (mega menü `.mega` → `.mega-cats` + `.mega-feat`) · **Ne Pişirsem?** · **Dolapta Ne Var?** · **Püf Noktaları** · **Mutfak Sırları** (`.dropdown`, ikon + `small` alt satırlı 5 alt kalem) | ⚠ Spesifikasyon başka bir nav yazıyor: "Tarifler \| Kiler \| Dolapta Ne Var \| Tabaktan Tarife \| DADA KIDS". Canlıda Kiler ve Tabaktan Tarife yok. → Karar: nav değişmez (§1.3) |
| Head eylemleri | arama `icon-btn`, zil `head-bell` + `hb-badge`, `btn-login`, `acct-wrap` menüsü, `hamburger` | Prototipte zil sayacı ve hesap menüsü statik |
| Mobil | `drawer-nav` (çekmece, `cekmece-alt-menu.js`), `bottom-nav.alt-cubuk` (`kanon/alt-cubuk.css`) | Değişmez; Kids bağı yalnız Tarifler alt menüsünde (varsa) |
| Footer | `footer.orange` → `foot-grid` (`foot-brand`, 3 × `foot-col`, `foot-app`), `foot-corp`, `foot-legal`; `altbilgi-perde` (perde efekti, `main`e `margin-bottom` verir) | |
| Token'lar | `--ink #211E16`, `--cream #EFE5D3`, `--cream-2 #F7F1E6`, `--tomato #DC3D17` (marka), `--tomato-dark/deep/tint`, `--green #3BB77E`, `--line`, `--muted`, `--sp-1..8` (4→64px), `--radius-sm/md/lg/xl/pill`, `--lh-body 1.55`, font **Gilroy** (Medium / ExtraBold / Light, woff2) | Kaynak: `/varliklar/build/assets/tokens-*.css`, `resources/css/gilroy-font-faces.css` |
| CSS/JS yükü | Yaklaşık 30 CSS + 25 JS: `/kabuk/*`, `/kanon/{alt-cubuk,hero}.css`, `/varliklar/reference/shared/dm-*.css`, `/varliklar/build/assets/{tokens,portal,kart,parallax}-*.css`, `/gastro/*`, FontAwesome (`/varliklar/fontawesome`) | |

**Tat seçki sayfası** (`/tarifler/seckiler/tat-ile-salcali-tarifler`): canlıda **404**, çünkü yalnız reklam rezervasyonuyla açılıyor (`MarkaSayfalari::secki`). Kalıp Gastro kodundan okundu (`resources/views/reklam/secki/hero.blade.php`, donör `Gastro/tarifler__kategori__tatli.html`):
- `section.lst-top.rk-secki-hero`: tam kaplayan sahne görseli (`rk-secki-sahne`), üstünde marka renginde yarı saydam katman (`rk-secki-katman`).
- `rd-crumb` kırıntı yolu.
- `.lst-hero` → `.lh-main`: eyebrow, marka logosu, `h1`, `lead` metni ve `lst-stats` sayaçları.
- Sağda beyaz kutu içinde ürün paketleri (`rk-secki-paket`); kutu hero'nun dışına yukarı taşar.
- Altında kategori listesinin kendisi: `lst-side` filtre paketi (`fct` akordeon) + `lst-bar` (görünüm segmenti `vw-seg`, sıralama `sort-dd`) + `lst-grid` + `pagi`.

**`r-card` anatomisi** (Kids kartının çıkış noktası):
- `r-media-wrap > r-media`: arka plan görseli; sol üstte `r-chip` (kategori), `r-diet` rozetleri (`rd-b rd-glutensiz` gibi ikonlar), `m-types`.
- `r-save` (kaydet, form).
- `r-body`: `h4` başlık, `r-facts` (süre, zorluk, porsiyon, maliyet), `r-foot` (`r-author` + `r-stats`).

**Mutfak Sırları ailesi:**
- **Hub** (`/mutfak-sirlari`): `lst-top` + `lib-sec flow-cream > topic-grid > a.topic-card` (h3, p, `disc-meta` sayaç, `topic-go`). Kids hub'ının modül ızgarası buradan türer.
- **Mutfağa Giriş**: "üstte sekmeler, içerik blokları" yapısı budur.
  - `lst-top px-band` (parallax hero, `hero-ctas`, `lst-stats`).
  - `nav.gnav > button.gtab[data-target]`: sayfa içi bölüm sekmeleri, ikonlu.
  - `seo-intro` (`seo-prose` + `seo-aside` ve `seo-quick` listesi).
  - `sec guide px-band` (`rstep-track` adım rotası).
  - `topic-grid`, `disc-grid drag-scroll` (yatay kaydırmalı kartlar), `next-sec`.
- **Mutfak Ansiklopedisi**: `ans-tools` (`az-nav` A–Z çubuğu + `ans-search`), `ans-catsec` / `ans-acc` / `ans-item` / `ans-detail` (akordeon), `ans-empty`. Yasaklı Gıdalar ve Güvenli Kesim araması için birebir uygun.
- **Ölçü Birimleri**: `ob-top` + `nav.ob-tabs` + `conv-card` (`cv-controls`, `fk-field`, `cv-stepper`, `cv-result is-empty`, `cv-empty-state`, `cv-chips`, `cv-hero`, `cv-ledger`) + `aside.cv-side` (`cv-seg`, `cv-tabpane`) + `ut-tabs disc-tabs` / `tbl-frame`. Kids Araçlar'ın iskeleti.
- **Sofra Düzeni**: `lh-chips drag-scroll` (hero içinde chip satırı). AgeFilterBar'ın mobil hâli buna yaslanabilir.

### 1.2 Transfer yöntemi (HTML/CSS birebir, yalnız içerik değişir)

Gastro'nun kendi dersi uygulanır: *render edilmiş DOM `<head>` dahil alınır; elle `<div>` yazılmaz.* Gerekçe: `tokenlar.css` linkinin taşınmadığı ve sayfanın çıplak render ettiği vaka.

1. **Anlık görüntü:** Playwright (yerelde, tek seferlik betik) ile JS çalışmış DOM, 1440 ve 390 genişlikte alınır. Alınacak sayfalar: dadagastro.com ana sayfa, `/tarifler/kategori/tatli`, `/mutfak-sirlari`, `/mutfaga-giris`, `/mutfak-ansiklopedisi`, `/olcu-birimleri` ve tarif detayı (ör. `/tarif/...`). Seçki hero'su için donör `gaviaworks-dev.github.io/DadaMentor/Gastro/tarifler__kategori__tatli.html` artı `rk-secki-*` CSS'i.
2. **Varlık indirme:** `<link>` / `<script>` / `url()` ile referans verilen her CSS, JS, font ve görsel `varlik/gastro/` altına **aynı alt yol yapısıyla** indirilir (`varlik/gastro/kabuk/…`, `varlik/gastro/varliklar/…`). Kök-mutlak yollar (`/kabuk/x.css`) GitHub Pages alt yolunda (`/<repo>/`) kırılacağı için **göreli yola** çevrilir. CSS içindeki `url(/…)` de çevrilir.
3. **Temizlik (yalnız silme, yeniden yazma yok):** CSRF token, `analitik.js`, çerez bandı, reklam slot betikleri (`data-rk-*`), oturum formlarının `action`'ları ve `onclick="location.href=/giris"` gibi canlıya giden bağlar çıkarılır. Bağlar `#` yerine ya prototip içi sayfaya ya da `https://dadagastro.com/...` mutlak adresine gider; tıklanınca hiçbir şey olmayan düğme bırakılmaz.
4. **Nav değişmez.** `nav.ana-menu` canlıdaki 5 kalemiyle aynen kalır. Kids sayfalarında aktif kalem **Tarifler** olur (Kids, Tarifler'in altında bir dikey olarak konumlanır). Kırıntı yolu: Ana Sayfa › Tarifler › Dada Kids › … Kids içi gezinme, Kids hub'ındaki modül ızgarası ve her sayfadaki `gnav` sekmeleriyle sağlanır. Giriş kapıları §1.3'te.
5. **Kabuk parçaları:** header, çekmece, alt çubuk ve footer, `src/parcalar/*.html` olarak **anlık görüntüden kesilip** saklanır. Her sayfa bunları bir derleme betiğiyle içerir (§8.2).
6. **Kapı (kabul ölçütü):**
   - Her varlık yerelde 200 döner (`npx serve` + betik).
   - Kabuk parite: canlıyla `getBoundingClientRect` karşılaştırması, 4px tolerans, 1440 ve 390.
   - Her sayfanın başında `<!-- donör: <url> -->` yorumu bulunur (Gastro'nun Blade disiplini; sonradan Laravel'e taşırken işe yarar).

### 1.3 Kids'e giriş kapıları (nav kalemi yerine)

Üçü de Gastro'nun mevcut bileşenlerinden türer; yeni şablon açılmaz.

| Kapı | Yer | Donör kalıp | İçerik |
|---|---|---|---|
| **A · Ana sayfa widget'ı** `kidsbar` | `index.html`, `findbar-sec`in ("Tarif bul — elindekiyle") hemen altında, ayrı bir bant | Ana sayfadaki `findbar` (px-band zemin, `fb-ico`, `fb-text`, `fb-chips`, `btn btn-primary`) | Bebek ikonu · "Dada Kids — hamilelikten 36. aya" · "Bebeğiniz kaç aylık?" · 5 evre chip'i (her biri `kids.html?evre=…` adresine gider ve KidsProfil'i önceden doldurur) · "Dada Kids'e git" düğmesi. Mobilde chip'ler yatay kaydırmalı. Raporda `eklendi:` olarak işaretlenir |
| **B · Tarifler listesi** | `tarifler.html` (canlı `/tarifler` anlık görüntüsü; prototipe yeni sayfa) | Hero'daki `lh-chips` ("Popüler:" satırı) ve `subcat-strip` (alt kategori şeridi) | `lh-chips`e "Dada Kids" chip'i (bebek ikonlu, ilk sırada) ve `subcat-strip`e "Bebek & Çocuk · Dada Kids" kalemi |
| **C · Tarifler mega menüsü** | Kabuk; tüm sayfalarda | `.mega-feat` içindeki `a.mega-find` ("Dolapta Ne Var?" kartı) | Altına ikinci bir `mega-find` kartı: "Dada Kids — Yaşa göre bebek tarifleri" → `kids.html`. Mobil çekmecede Tarifler alt menüsü varsa aynı bağ oraya eklenir |

Hepsinin hedefi `kids.html` (A'da evre parametresiyle). Tarifler bağlamından gelen kullanıcı için Kids hub'ının hero'sunda "Yaşa göre tarifler" kısayolu öne çıkar.

---

## 2. Sayfa listesi ve blok yapısı

Dosya adlandırma, Gastro prototipinin kuralına uyar (`tarifler__kategori__tatli.html`); böylece ileride Blade türetirken donör adresi doğrudan eşleşir.

| # | Dosya | Rota (ürün) | Kalıp / donör |
|---|---|---|---|
| 1 | `kids.html` | `/kids` | Bilgi kalıbı: Mutfak Sırları hub'ı + Mutfağa Giriş |
| 2 | `kids__donemler.html` | `/kids/donemler` | Bilgi kalıbı |
| 3–7 | `kids__donemler__{hamilelik-lohusalik,0-6-ay,6-8-ay,9-12-ay,1-3-yas}.html` | `/kids/donemler/*` | Bilgi kalıbı + liste parçası |
| 8 | `kids__tarifler.html` | `/kids/tarifler` | Liste kalıbı: seçki hero'su + kategori listesi |
| 9–11 | `kids__tarif__{balkabakli-bebek-irmigi, …2 tane daha}.html` | `/kids/tarifler/[slug]` | Gastro tarif detayı |
| 12 | `kids__guvenli-kesim.html` | `/kids/guvenli-kesim` | Ansiklopedi (arama, A–Z) + liste ızgarası |
| 13–17 | `kids__guvenli-kesim__{havuc,elma,uzum,muz,avokado}.html` | `/kids/guvenli-kesim/[besin]` | Bilgi kalıbı + CutGuideCard |
| 18 | `kids__mevsimsel-takvim.html` | `/kids/mevsimsel-takvim` | Liste kalıbı (tezgâh) + `disc-grid` |
| 19 | `kids__rehber.html` | `/kids/rehber` | Mutfak Sırları hub'ı (`topic-grid`) |
| 20 | `kids__rehber__yasakli-gidalar.html` | `/kids/rehber/yasakli-gidalar` | Ansiklopedi akordeonu |
| 21 | `kids__rehber__blw-temelleri.html` | `/kids/rehber/blw-temelleri` | Mutfağa Giriş (`gnav`, `seo-intro`, `rstep-track`) |
| 22 | `kids__araclar.html` | `/kids/araclar` | Mutfak Sırları hub'ı + Ölçü Birimleri |
| 23 | `kids__araclar__bu-besin-verilir-mi.html` | `/kids/araclar/bu-besin-verilir-mi` | Ölçü Birimleri (`conv-card`) + Ansiklopedi araması |
| 24 | `kids__araclar__3-gun-kurali-takip.html` | `/kids/araclar/3-gun-kurali-takip` | Ölçü Birimleri (`cv-*` form + `cv-ledger`) |
| 25 | `kids__araclar__persentil-hesaplayici.html` | `/kids/araclar/persentil-hesaplayici` | Ölçü Birimleri (`conv-card` + `cv-side`) |
| — | `index.html` | `/` | Gastro ana sayfa anlık görüntüsü; tek ekleme Kids widget'ı (§1.3 kapı A) |
| — | `tarifler.html` | `/tarifler` | Gastro tarif listesi anlık görüntüsü; tek ekleme "Dada Kids" chip'i ve alt kategori kalemi (§1.3 kapı B) |

"Sık Karşılaşılan Sorunlar" (iştahsızlık, ek gıda reddi, diş çıkarma, kabızlık, alerjik reaksiyon) spesifikasyonda Rehber'in içinde geçiyor. Prototipte `kids__rehber.html` hub'ında kart olarak durur; içeriği uzman onayı gelene kadar **açılmaz** (kart gösterilmez ya da "yakında" yerine hiç basılmaz). Yalan yüzey kuralı gereği.

### 2.1 Blok yapıları

**1 · `kids.html` (Hub)**
1. `lst-top px-band` hero: eyebrow "DADA KIDS", h1, lead ("Hamilelikten 36. aya…") ve **KidsProfil adımı**: 5 evre chip'i, isteğe bağlı doğum tarihi ve cinsiyet (Kız / Erkek / Belirtmek istemiyorum; hamilelikte ayrıca "Henüz bilmiyoruz"). Seçim yapıldıktan sonra adım tek satırlık özete döner ("6–8 ay · Kız · değiştir"). Tema vurgusu anında uygulanır (§3.1). Seçim tüm Kids sayfalarına bağlam olarak taşınır.
2. `gnav` sekmeleri: Evreler · Bu Besin Verilir mi? · Tarifler · Bu Ay Tezgâhta · Güven Merkezi.
3. TimelineSlider (kompakt): 5 evre kartı; seçili evrenin 3 hap bilgisi ve "Evreye git".
4. Hızlı arama kartı: "Bu besin verilir mi?" giriş alanı. Sonuç kartı yerinde açılır (§4.1).
5. `lst-grid` 4 × `r-card` (Kids varyantı): seçili yaşa uygun öne çıkan tarifler.
6. Mevsim Spotlight şeridi (`disc-fig` kalıbı): bu ayın kahramanı + "Tezgâha git".
7. `topic-grid` × 6 modül kartı (Mutfak Sırları hub'ı birebir): Dönemler, Tarifler, Güvenli Kesim, Mevsimsel Takvim, Rehber, Araçlar.
8. Güven şeridi: DoctorVerifyBadge (bekliyor durumu) ve "Kaynaklarımız: DSÖ · AAP · NHS · T.C. Sağlık Bakanlığı".
9. `next-sec`.

**2 · `kids__donemler.html` ve 3–7 · evre sayfaları**
1. `lst-top px-band` hero; evreye göre görsel ve renk vurgusu (evre rengi = baskın yaş rozeti rengi).
2. **TimelineSlider** (sticky; `gnav` konumunda): 5 evre, her chip'te aralık yazılı ("6–8 ay", "1. trimester · 1–13. hafta"); önceki/sonraki okları. Hamilelik evresinde ikinci satırda T1 · T2 · T3 · Lohusalık alt sekmeleri.
3. `seo-intro`: `seo-prose` (evrenin özeti) + `seo-aside` "Bu evrede bir bakışta" (`seo-quick` listesi).
4. **StagePills** (4–5 hap infografik): her evrede **aynı alanlar** — süt / ek gıda dengesi, öğün sayısı, kıvam, öne çıkan besin öğesi (demir, çinko, folat), "bu evrenin odağı". Detay "Neden?" açılırında.
5. **FoodMatrix** (Serbest ve Yasaklılar): 3 durumlu (uygun / hazırlığa dikkat / henüz erken). Her kırmızı hücrede bir satır gerekçe ve "X. aydan itibaren". Veri ortak besin tablosundan gelir.
6. "Bu evreye özel tarifler": `lst-grid` `r-card`; yalnız evre aralığıyla eşleşen tarifler, "Tümünü gör" ile `kids__tarifler.html?yas=…`.
7. `next-sec`: önceki ve sonraki evre.
- 0–6 ay sayfasında tarif ızgarası yok; yerine "Anne sütü & formül mama" bilgi blokları (`rstep-track`) gelir. Hamilelik sayfasında tarifler "Hamilelik" rozetiyle (yaş rozeti değil) gösterilir → Açık soru 4.

**8 · `kids__tarifler.html` (Katalog)**
1. Hero: Tat seçki hero'sunun iskeleti (`lst-top` + sahne görseli + renk katmanı + `lh-main` + `lst-stats`). Sağdaki ürün paketi kutusunun yerine "Bu hafta en çok yapılanlar" mini kutusu ya da sponsor alanı → Açık soru 11.
2. **AgeFilterBar** (zorunlu, sticky, hero'nun hemen altında): +6 · +8 · +9 · +12 · +18 Ay · 2–3 Yaş. Tek seçim, birikimli (+9 seçilince 6–8–9 tarifleri de gelir; kural chip altında yazılı). Her chip'te sonuç sayısı. Renk = KidsAgeBadge rengi.
3. `lst-layout`: `lst-side` (`fct` akordeonları): **Kıvam** (Pürüzsüz Püre / Çatalla Ezilmiş / Parmak Gıda), **İçermeyenler** (AllergenPill: Glutensiz, Sütsüz, Yumurtasız, Fıstıksız…; birleşen VE filtresi), Öğün, Hazırlık süresi. Mobilde Gastro'nun `sheet` paneli.
4. `lst-bar`: sıralama (`sort-dd`) ve sonuç sayısı.
5. `lst-grid` × Kids `r-card` (§3, Kids Tarif Kartı).
6. Boş durum: hangi filtrenin sonucu sıfırladığı yazılır ve tek dokunuşla düzeltme önerilir ("+8 ay göster", "Sütsüz filtresini kaldır").
7. `pagi`.

**9–11 · Tarif detayı** (donör: Gastro tarif detay sayfası, ör. `tarif__laz-boregi-….html`; dalga 1'de anlık görüntüsü alınır)
1. Hero: büyük KidsAgeBadge ("+6 AY İÇİN UYGUNDUR"), başlık, TextureIcon + metin, AllergenPill'ler, süre ve porsiyon ("bebek porsiyonu").
2. Malzemeler + **PantrySync** ("Kilerimde var" işaretleme, "Eksikleri listeye at").
3. Hazırlanışı (Gastro adım bileşeni).
4. "Bu yaşta nasıl sunulur": ilgili CutGuideCard'a bağ ve kıvam notu.
5. Besin değeri özeti (demir, çinko vb.; örnek içerik işaretli).
6. "Yaşa göre uyarlama": aynı tarifin +9 ve +12 sürümü için kısa notlar.
7. DoctorVerifyBadge + kaynaklar.
8. Benzer tarifler (`r-card`).

**12 · `kids__guvenli-kesim.html` (Atlas)**
1. Hero (`lst-top`) + **ChokingHazardPanel** (kırmızı çarpılı şema): üzüm, kiraz domates, bütün fındık / fıstık, patlamış mısır, sert çiğ sebze. "Neden" satırı, güvenli alternatif ve "4 yaşına kadar bütün verilmez".
2. `ans-tools`: `ans-search` (canlı filtre, eş anlamlılar: "çeri domates" = "kiraz domates") + `az-nav` + filtre chip'leri (Boğulma riski: Düşük / Orta / Yüksek; Besin grubu).
3. Besin ızgarası (`lst-grid` kart varyantı): besin illüstrasyonu, en erken yaş mini rozeti, boğulma riski etiketi.
4. `next-sec` (BLW Temelleri ve Bu Besin Verilir mi bağları).

**13–17 · Besin kesim detayı**
1. Başlık + karo satırı (Solid Starts dersi, kendi yorumumuzla): **En erken yaş · Boğulma riski · Alerjen · Demir**.
2. **CutGuideCard** (3 kademe): 6–8 ay · 9–12 ay · 12–36 ay. Kademeler besine özgü; uygun değilse "bu formda verilmez" durumu.
3. **SquishTest** bloğu: yalnız pişmiş meyve ve sebzede. "Yumuşak / Pişirilmeli / Sert — verilmez".
4. Bu besinle tarifler (`r-card` ×3).
5. DoctorVerifyBadge.

**18 · `kids__mevsimsel-takvim.html`**
1. Hero + **MonthDial** (masaüstünde dairesel kadran ve oklar, mobilde 12 aylık yatay chip şeridi). Varsayılan: bu ay ("Bu ay" etiketi). Aralık → Ocak döngüsel.
2. **Spotlight** "Ayın Kahramanı": görsel, 12 aylık bulunabilirlik çubuğu, "nasıl seçilir" 2–3 tazelik ipucu, saklama, seçili yaşa göre süzülmüş 2 tarif.
3. **Tezgâh** (`lst-grid` ProduceCard): sebze / meyve / yeşillik sekmeleri; her kartta mini yaş rozeti ve tazelik durumu (zirvede / mevsiminde / son günler).
4. Yaş filtresi (AgeFilterBar mini): seçili yaşın altındakiler soluklaşır, gizlenmez.
5. "Bu ay sezonu bitenler" şeridi.
6. İkincil görünüm: "Tüm yıl" matrisi (masaüstünde tablo, mobilde dikey liste).
7. Not: "Türkiye geneli; bölgeye göre değişir."

**19–21 · Rehber**
- `kids__rehber.html`: hub `topic-grid` (Yasaklı Gıdalar, BLW Temelleri, [Sık Sorunlar — onay sonrası]) + uzman profil kartları (DoctorVerifyBadge geniş varyant) + editoryal ilke kutusu.
- `kids__rehber__yasakli-gidalar.html`: Ansiklopedi akordeonu. Kategori grubu → besin → **yaş sınırı → kısa gerekçe → yerine ne yapılır** (NHS kalıbı). "Bu sayfada" atlama bağları.
- `kids__rehber__blw-temelleri.html`: `gnav` (BLW nedir · Hazır mı? · Öğürme mi Boğulma mı? · Oturuş · İlk hafta). Öğürme ve boğulma **iki sütunlu karşılaştırma** (ses, renk, ne yapılır → ilk yardım için resmi kaynağa bağ, adım adım talimat yok). 90° dik oturuş şeması (SVG). `rstep-track` ile "ilk hafta rotası".

**22–25 · Araçlar** → §4.

---

## 3. Yeni komponentler

Hepsi `varlik/kids/kids.css` ve `kids.js` içinde. BEM benzeri Türkçe sınıf öneki: `kd-`.

| Komponent | Tasarım notu | Esin / ders |
|---|---|---|
| **KidsAgeBadge** `kd-yas` | En yüksek görsel hiyerarşi. Kartta sol üstte, `r-chip`in yerinde, görselin üzerinde. Gövde metninden büyük (≥ 15px, ExtraBold, büyük harf), dolu zemin, beyaz metin, AA kontrast, ince beyaz halka. Renk: mor +6, mavi +8, turuncu +9, yeşil +12; **+18 ve 2–3 yaş tanımsız** (Açık soru 4). Renk tek başına anlam taşımaz; metin ("+9 AY") her zaman yazılı. Boyutlar: `--xl` (detay hero'su), `--md` (kart), `--sm` (tezgâh ve matris) | Spesifikasyon §4; Solid Starts'taki "+N ay" eşik gösterimi |
| **AgeFilterBar** `kd-yas-cubugu` | Sticky; chip renkleri rozetle aynı. Tek seçim ve birikimli; kural chip altında bir satırla yazılır. Seçim URL parametresine (`?yas=9`) yazılır, paylaşılabilir. Mobilde Sofra Düzeni'nin `lh-chips drag-scroll` davranışı: aktif chip görünür alana kaydırılır | Annabel Karmel'deki tutarsız etiket ve belirsiz "+" sorunu, babyfoode'daki facet ve Reset |
| **KidsProfil** `kd-profil` (eski adıyla AgeContextPicker) | İlk girişte, hub'da tek adımda iki soru: "Bebeğiniz kaç aylık?" (evre chip'i ya da doğum tarihi) ve **cinsiyet** (Kız / Erkek / Belirtmek istemiyorum; hamilelik evresi seçiliyse ek olarak "Henüz bilmiyoruz"). Seçim tek bir profil nesnesinde tutulur. AgeFilterBar, TimelineSlider ve Spotlight'ın varsayılanını ve tema vurgusunu (§3.1) besler; persentil hesaplayıcıya otomatik geçer. Hub'da küçük bir "değiştir" bağlantısıyla yeniden açılır | BabyCenter'ın tarihe göre otomatik "bugün" görünümü |
| **AllergenPill** `kd-alerjen` | İki rol. (a) Kartta "İçermez" etiketi (Glutensiz, Sütsüz…); Gastro `rd-b` ikon diliyle. (b) Filtre pili (VE). 9 ana alerjen (süt, yumurta, yer fıstığı, sert kabuklu, susam, buğday, soya, balık, kabuklu deniz ürünü). Dil: "yasak" değil, "erken ve tek tek tanıştır" | AAP / NHS / ASCIA erken tanıştırma; Solid Starts'ın dağınık alerjen bilgisine karşı tek blok |
| **TextureIcon** `kd-kivam` | 3 piktogram: Pürüzsüz Püre · Çatalla Ezilmiş · Parmak Gıda (BLW). Her zaman ikon ve metin birlikte. `r-facts` satırına girer | NHS kıvam evreleri |
| **CutGuideCard** `kd-kesim` | 3 sütun (mobilde yatay kaydırmalı 3 kart). Her kademede: yaş chip'i, motor beceri ("avuç kavrama / kıskaç tutuşu / ısırma-çiğneme"), SVG şema, tek ölçek referansı (yetişkin parmağı silüeti), 1–2 satır talimat. **Besine özgü**: yuvarlak besinlerde 6–8 ay "şerit" değil, "pişir-ez" ya da "boyuna dörde böl". "Bu formda verilmez" durumu kırmızı çarpıyla | Solid Starts yaş blokları; AAP'de görsel olmaması boşluğu |
| **ChokingHazardPanel** `kd-bogulma` | Kırmızı, çarpılı şema ve ikonla birlikte metin. Her öğede neden (yuvarlak, sert, kaygan), güvenli alternatif ve yaş ("4 yaşına kadar bütün verilmez"; bütün kuruyemiş 5 yaş). İlk yardım için resmi kaynağa bağ | AAP Choking Prevention, CDC choking hazards |
| **SquishTest** `kd-ezilme` | Etkileşimli: başparmak ve işaret parmağı arasında ezilme animasyonu (CSS). 3 sonuç durumu. Yalnız pişmiş meyve ve sebzede gösterilir | Solid Starts sezgisi (resmî rehber değil, öyle etiketlenir) |
| **CanEatCard** `kd-verilir-mi` | Önce büyük cevap cümlesi ("Evet, 6. aydan itibaren, yumuşayana kadar pişirerek"). 3 durum: **Evet / Hazırlıkla evet / Henüz değil**. Altında karolar (yaş, boğulma, alerjen, demir), ilk sunum şekli, CutGuide bağı, ilgili tarif. "Bulunamadı" ve eş anlamlı yönetimi | Solid Starts üst veri karoları; ikili Evet/Hayır'ın zayıflığı |
| **TimelineSlider** `kd-evre` | 5 evre chip'i, aralık metinli; scroll-snap; önceki ve sonraki okları; aktif evre görünür alana kayar; klavye ok tuşları. Hamilelikte alt sekme satırı | BabyCenter hafta şeridi (ama haftalık değil, evresel); NHS'in evreler arası geçiş eksikliği |
| **StagePills** `kd-hap` | 4–5 sabit alanlı hap kartı; evreler arasında karşılaştırılabilir. Detay "Neden?" açılırında | NHS "first foods" yaş blokları |
| **FoodMatrix** `kd-matris` | 3 durum: uygun (yeşil-tint) / hazırlığa dikkat (amber) / henüz erken (kırmızı). İkon, metin ve kilit açılış yaşı. Ortak besin tablosundan üretilir | NHS foods-to-avoid; renk körlüğü dersi |
| **MonthDial** `kd-ay` | Masaüstünde dairesel kadran (SVG) + ok tuşları; mobilde 12 chip'lik şerit. Ay adı her zaman metin olarak yazılı. Döngüsel | Eat the Seasons'ın "bugün" varsayılanı; Olive matrisinin mobil başarısızlığı |
| **ProduceCard** `kd-urun` | Organik kart (illüstrasyon), mini KidsAgeBadge, tazelik durumu (zirvede / mevsiminde / son günler), demir ve alerjen mini ikonları. Dokununca CanEatCard ya da CutGuide | Eat the Seasons iki seviyeli tazelik; Solid Starts besin sayfası |
| **Spotlight** `kd-kahraman` | 12 aylık bulunabilirlik çubuğu, seçme ve saklama ipuçları, yaşa göre süzülmüş 2 tarif. "En besleyici" gibi üstünlük iddiası yok; "Ayın Kahramanı" adı yeterli | Seasonal Food Guide yıl çubuğu |
| **DoctorVerifyBadge** `kd-onay` | AAP kalıbı: ad, unvan (Çocuk Doktoru / Çocuk Diyetisyeni), kısa biyografi bağı, "son inceleme: tarih", izlenen rehberler, editoryal ilke bağı. Sayfa başında (başlık altında), footer'da değil. **Prototipte yalnız "Uzman onayı bekliyor" durumu**; sahte doktor adı ya da sahte onay basılmaz | AAP HealthyChildren; Acıbadem'deki "editör kurulu" belirsizliği |
| **PantrySync** `kd-kiler` | Kartta ikincil, detayda birincil düğme: "Kilerimdeki malzemelerle eşle". Detayda malzeme satırları "var / eksik" olarak işaretlenir, "Eksikleri listeye at". Eşleşme yaş ve alerjen filtresini her zaman korur | Spesifikasyon §2.2; Gastro "Dolapta Ne Var?" → Açık soru 7 |
| **OrnekIcerik** `kd-ornek` | Medikal blokların üstünde ince amber şerit: "Örnek içerik — uzman onayı bekliyor". Kaldırılamaz | §6 |

### 3.1 Kişiselleştirme: profil ve yumuşak tema vurgusu

**Profil nesnesi** (tek kaynak, `kids.js` içinde):
```
{ evre: "6-8-ay", dogum: "2026-03-14" | null, cinsiyet: "kiz" | "erkek" | "belirtilmedi" | "bilinmiyor" }
```
- **Seçenekler:** "Henüz bilmiyoruz" (`bilinmiyor`) yalnız hamilelik evresinde gösterilir. Evre hamilelikten bebek evresine değişirse bu değer `belirtilmedi`ye düşer.
- **Kalıcılık:** kalıcı kayıt yok; localStorage kullanılmaz. Ama site çok sayfalı, salt bellek içi tutulan durum ilk tıklamada kaybolur. Bu yüzden öneri: profil, **Kids içi bağlara URL parametresi olarak** taşınır (`?evre=6-8-ay&c=kiz`). `kids.js` sayfa açılışında bu parametreyi okur ve Kids bağlarına yeniden yazar. Depolama yok, sekme kapanınca biter. Alternatif `sessionStorage` (yalnız o sekme, kapanınca silinir) → Açık soru 14.
- **Persentil köprüsü:** cinsiyet Kız ya da Erkek ise hesaplayıcıda önceden seçili gelir, değiştirilebilir. "Belirtmek istemiyorum" ya da "Henüz bilmiyoruz" seçildiyse DSÖ tabloları cinsiyete göre ayrıldığı için araç yalnız kendi içinde sorar ("Hesaplama için gerekli; profile kaydedilmez"). Doğum tarihi de profilden geçer.
- **İçerik:** cinsiyet **içeriği değiştirmez**. Tarifler, metinler ve öneriler aynı kalır; değişen yalnız tema vurgusu ve persentil tablosu. Kalıp yargı içeren metin yazılmaz.

**Tema: tek değişken, 3 değer** (ayrı sayfa ya da şablon yok)
```
:root                        { --kd-tema: <Gastro nötr vurgu> }   /* belirtilmedi · bilinmiyor */
html[data-kd-tema="kiz"]     { --kd-tema: <yumuşak gül pembesi> }
html[data-kd-tema="erkek"]   { --kd-tema: <yumuşak çelik/gök mavisi> }
```
- Açık tonlar aynı değişkenden türetilir; ikinci bir değişken açılmaz. Örnek: `color-mix(in srgb, var(--kd-tema) 12%, #fff)` zemin için, `… 35%, transparent` hero katmanı için.
- **Yalnız şu üç yerde kullanılır:**
  1. Hero katmanı: `lst-top` üzerindeki renk katmanı, seçki hero'sundaki `rk-secki-katman` mantığıyla.
  2. Seçili sekme ve chip alt çizgisi (`gtab.active`, TimelineSlider, MonthDial seçili ay).
  3. Küçük ikon zeminleri (`topic-card` ikonları, StagePills ikon dairesi).
- **Temadan etkilenmeyenler:** KidsAgeBadge, AgeFilterBar chip dolguları, FoodMatrix durum renkleri, ChokingHazardPanel, `kd-ornek` şeridi, DoctorVerifyBadge ve birincil düğmeler (Gastro tomato kalır). Bu bileşenler `--kd-tema`yı hiç okumaz; CSS'te kendi sabit token'larını kullanır.
- **Renk ayrımı:**
  - Tema mavisi düşük doygunlukta, gri-yeşile çalan bir çelik mavisi. +8 ay rozeti ise doygun, koyu kraliyet mavisi. İkisinin ton açısı ve doygunluğu belirgin ayrılır.
  - Tema pembesi sıcak gül tonu; +6 ay morundan (soğuk mor) uzak tutulur. Magenta kullanılmaz.
  - Kabul: alt çizgi ve ikon kenarı beyaz zeminde ≥ 3:1 kontrast (WCAG metin dışı öğe). Tema rengi ile her yaş rozeti rengi yan yana konup gözle ayırt edilebilirlik kontrolü yapılır. Değerler dalga 0'da kontrast ölçümüyle kesinleşir.
- **Nötr tema:** Gastro'nun kendi vurgusu (krem zemin, tomato alt çizgi). Kids, Gastro'nun içinde "varsayılan" görünür.

**Kids Tarif Kartı** (`r-card` + `kd-` ekleri; spesifikasyondaki wireframe ile bire bir):
- `r-media` sol üst: KidsAgeBadge (`r-chip`in yerine).
- Görselin alt kenarı: AllergenPill'ler ("Glutensiz", "Yumurtasız").
- `r-save` olduğu gibi kalır.
- `r-body h4` başlık.
- `r-facts`: TextureIcon ve metin, hazırlık süresi, bebek porsiyonu (maliyet ₺ satırı kalkar).
- `r-foot`: `r-author` yerine PantrySync satırı ("[+] Kilerimdeki malzemelerle eşle"), `r-stats` kalır.

---

## 4. Araçlar: prototipte nasıl çalışır (statik demo verisi)

Tümü istemci tarafında, vanilla JS, sunucu yok. **Tek kaynak ilkesi:** `veri/besinler.json`, CanEatCard, FoodMatrix, ProduceCard rozetleri, Güvenli Kesim listesi ve tarif alerjen filtrelerinin **ortak** tablosudur. Uzman bu tabloyu tek yerde gözden geçirir.

### 4.1 Bu Besin Verilir mi?
- **Veri:** `veri/besinler.json`, 40–50 besin. Alanlar: `ad`, `esAnlamlar[]`, `grup`, `minAy`, `durum` (`evet | hazirlikla | henuz`), `ilkSunum` (6–8 / 9–12 / 12+ için kısa metin), `alerjen` (9 ana alerjenden hangisi), `demirZengini`, `bogulmaRiski` (`dusuk | orta | yuksek`), `kesimSlug`, `mevsim[]` (ay listesi), `kaynaklar[]`, `onay: "bekliyor"`.
- **Arama:** Türkçe normalize (ı/i, ş/s, ğ/g, ü/u, ö/o, ç/c), eş anlamlı eşleşme, önek ve bulanık eşleşme (basit Levenshtein ≤ 1). Yazarken öneri listesi (`cv-combo` kalıbı).
- **Sonuç:** CanEatCard. Hub'da yerinde açılır, araç sayfasında `conv-card` içinde.
- **Değerler:** yalnız ana akım rehberlerin **uzlaştığı** bilgilerle doldurulur (ör. bal 12 ay, bütün üzüm 4 yaş); tartışmalı olanlar (ıspanak 6 mı 8 mi) "uzman kararı bekliyor" olarak boş bırakılır. Her kart `kd-ornek` işaretlidir.

### 4.2 3 Günlük Gözlem (3 Gün Kuralı Takip)
- **Adlandırma:** rota adı spesifikasyondaki gibi kalır; arayüzde "3 Günlük Gözlem", alt satırda "yaygın uygulama; kesin tıbbi kural değil" (§6.2).
- **Akış:** besin seç (`besinler.json`'dan) → başlangıç tarihi → Gün 1 / 2 / 3 kartları. Her günde belirti chip'leri (döküntü, dışkı değişikliği, gaz, kusma, şişlik, **yok**) ve not.
- **Sonuç:** Tolere etti / Emin değilim, tekrar dene / Reaksiyon → doktora danış.
- **Kurallar:** Aynı anda ikinci **yeni alerjen** başlatılırsa uyarı verilir. Sabit "Acil belirtiler → 112" kutusu. "Yalnız ağız çevresinde hafif kızarıklık" ipucu (ASCIA). Tolere edilen alerjen için "devam: son verilme N gün önce" bakım görünümü.
- **Köprü:** reaksiyon işaretlenen alerjen, Tarifler sayfasında kaldırılabilir bir "İçermez" pili olarak önerilir.
- **Kalıcılık:** bkz. Açık soru 8. Varsayılan öneri: sayfada önceden doldurulmuş örnek bir kayıt ve yalnız bellek içi demo, üstte "Demo — kayıt tutulmaz" şeridi.

### 4.3 DSÖ Persentil Hesaplayıcı
- **Veri:** DSÖ Child Growth Standards XLSX tabloları (sütunlar: `Month, L, M, S, P01…P999`). Tek seferlik dönüştürme betiği (`araclar/who-to-json.py`, `openpyxl`) ile `veri/who-lms.json` dosyasına çevrilir; 0–36 ay, kız ve erkek. Ağırlık için `tab_wfa_*_p_0_5`, boy için `tab_lhfa_*_p_0_2` + `tab_lhfa_*_p_2_5`, baş çevresi için `tab_hcfa_*_p_0_5`. Toplam birkaç KB.
  - Kaynak: <https://www.who.int/tools/child-growth-standards/standards/weight-for-age>, `/length-height-for-age`, `/head-circumference-for-age>`.
- **Hesap:** LMS (Box-Cox): `z = ((X/M)^L − 1) / (L·S)`; L = 0 ise `z = ln(X/M)/S`. Persentil = Φ(z), erf yaklaşımıyla. Aylar arasında L, M, S doğrusal ara değerlenir. |z| > 3 ise kesin sayı yerine "3. persentilin altında / 97. persentilin üstünde" yazılır.
- **Girdi:**
  - Cinsiyet ve doğum tarihi KidsProfil'den önceden dolu gelir (§3.1); profilde cinsiyet belirtilmemişse araç kendi içinde sorar ve profile yazmaz. Yaş hesaplanıp gösterilir: "8 ay 12 gün".
  - Ölçüm tarihi; varsayılan bugün.
  - Kilo (kg), boy (cm) ve baş çevresi (cm). Ondalık virgül kabul edilir. Her ölçüm isteğe bağlı; her girilen ölçüm için ayrı grafik çizilir.
- **Grafik:** kütüphanesiz inline SVG. 3–97 bandı yumuşak dolgu, 15–85 daha koyu iç bant, medyan çizgisi **soluk** (hedef algısı oluşmasın; RCPCH dersi). Çocuğun noktası ve tooltip. Mobilde ölçüm başına sekme ve x ekseni yaş ±6 ay kırpılır. Erişilebilir tablo yedeği. 24. ayda "boy (yatarak) → boy (ayakta)" notu.
- **Dil:**
  - Eğilim odaklı tek cümle: "Bebeğinizin kilosu yaşıtlarının yaklaşık %40'ından fazla."
  - "Düşük" ve "kötü" gibi sözcükler ve kırmızı renk kullanılmaz.
  - 3–97 dışında sonuç: "Bir sonraki kontrolde doktorunuzla paylaşın."
  - Kalıcı not: "DSÖ standardı; tanı değildir."
  - "Erken mi doğdu?" düzeltmesi kapsam dışı; yalnız bilgi notu.
- **Lisans:** DSÖ verisi CC BY-NC-SA 3.0 IGO. Ticari olmayan prototipte atıfla kullanılabilir. **dadagastro.com reklamlı olduğu için üretimde DSÖ izin formu gerekir** (Açık soru 10). DSÖ logosu ya da onay izlenimi kullanılmaz.

---

## 5. Mobil (390) ve masaüstü (1440) düzeni

| Sayfa | 1440 | 390 |
|---|---|---|
| Kabuk | Gastro header aynen; Tarifler mega menüsünde Dada Kids `mega-find` kartı | Hamburger → `drawer-nav` aynen (Tarifler alt menüsü varsa Kids bağı); `bottom-nav.alt-cubuk` değişmez |
| Ana sayfa widget'ı | `findbar` düzeni: ikon, metin, 5 evre chip'i ve düğme tek satırda | Gastro'nun 390 `findbar` düzeni: alt alta; chip'ler yatay kaydırmalı |
| Hub | Hero sol metin, sağda yaş seçici; modül ızgarası 3×2 | Tek sütun; yaş seçici hero altında tam genişlik chip satırı; modül ızgarası 1 sütun (`topic-card`) |
| Dönemler | TimelineSlider tam genişlik 5 chip; StagePills 4–5 sütun; matris 3 sütun (durum başına) | Slider yatay kaydırmalı (scroll-snap, aktif ortada); haplar 2×2; matris durum sekmeleri (Uygun / Dikkat / Erken) |
| Tarifler | `lst-side` sol 280px + 3 sütun `r-card`; AgeFilterBar header altında sticky | AgeFilterBar sticky ve yatay kaydırmalı; filtreler `sheet` alt paneli ("Filtrele" düğmesi); kartlar 1 sütun (Gastro'nun 390 kart düzeni). Rozet okunurluğu 390'da da ≥ 15px |
| Tarif detayı | Gastro detay düzeni (sol içerik, sağ malzeme kutusu) | Gastro 390 detay; PantrySync alt eylem çubuğunda (`alt-eylem-cubugu` kalıbı) |
| Güvenli Kesim | Hazard panel yatay; ızgara 4 sütun; detayda CutGuide 3 sütun | Panel dikey liste; ızgara 2 sütun; CutGuide yatay kaydırmalı 3 kart ve kademe göstergesi |
| Mevsimsel | Dairesel MonthDial + yanında Spotlight; tezgâh 4 sütun; "Tüm yıl" tablosu | 12 aylık chip şeridi; Spotlight tam genişlik; tezgâh 2 sütun; "Tüm yıl" dikey liste |
| Rehber | Akordeon 2 sütun (kategori + içerik); BLW karşılaştırması 2 sütun | Akordeon tek sütun; karşılaştırma alt alta (ya da 2 dar sütun tablo) |
| Araçlar | `conv-card` sol, `cv-side` sağ (ipuçları, kaynak) | `conv-card` tam genişlik, `cv-side` altına; persentil grafiği ölçüm sekmeli |

---

## 6. Medikal içerik ilkesi

### 6.1 Kurallar
1. Medikal her blok `kd-ornek` şeridini taşır: **"Örnek içerik — uzman onayı bekliyor."**
2. DoctorVerifyBadge yalnız "bekliyor" durumunda gösterilir; uydurma uzman adı ya da fotoğraf basılmaz.
3. Yalnız ana akım rehberlerin (DSÖ, AAP, NHS, ASCIA, T.C. Sağlık Bakanlığı) **uzlaştığı** bilgi yazılır. Tartışmalı değerler boş bırakılır ve "uzman kararı" diye işaretlenir.
4. İlk yardım adımları yazılmaz; resmi kaynağa bağ verilir.
5. Her kuralın bir satırlık **gerekçesi** ve **"yerine ne yapılır"** satırı olur (NHS kalıbı). Gerekçesiz yasak yazılmaz.
6. Kaynaklar sayfa sonunda listelenir; kaynak sayfaların metni kopyalanmaz.

### 6.2 Spesifikasyonda düzeltme gerektiren ifadeler (ürün kararı bekliyor)

| Spesifikasyon | Ana akım rehber | Prototipte öneri |
|---|---|---|
| Patlıcan "1 yaş öncesi yasaklı" (§2.5) | Destekleyen ana akım rehber bulunamadı; Solid Starts 6. aydan itibaren, iyi pişmiş olarak listeliyor | Yasaklılar listesine **alınmaz**; uzmana sorulur |
| Bakla (favizm) | Risk G6PD eksikliğine özgü | "G6PD eksikliği olan bebeklerde" bağlamıyla, uzman onayıyla |
| İnek sütü (böbrek yükü) | "12 aydan önce **ana içecek olarak** verilmez"; yemekte ve yoğurtta olur | Ayrım açıkça yazılır |
| Mevsimsel takvim: "dondurulmuş … riskli gıdalar yerine" (§2.4) | NHS ve HSE dondurulmuşu eşdeğer sayar; asıl uyarı "iyice pişir" (listeria; ithal dondurulmuş meyvede hepatit A notu) | Gerekçe güvenlik değil, **lezzet, ekonomi, çeşitlilik ve yerellik**. Ek not: "dondurulmuş da iyi bir alternatif; bebekler için pişirerek kullanın" |
| "3 Gün Kuralı" | AAP 3–5 gün; NHS ve ASCIA sabit bekleme yok, tek tek tanıştır ve düzenli devam et; alerjenler geciktirilmemeli | "3 günlük gözlem — yaygın uygulama", alerjen geciktirme mesajı verilmez |
| Güvenli kesim 12–36 ay "çeyrek dilim" | Doğru; ama yuvarlak besinler **4 yaşına kadar bütün verilmez** (AAP), bütün kuruyemiş 5 yaşına kadar (NHS) | 12–36 ay kademesi "artık bütün olur" çağrışımı yapmaz |
| 6–8 ay "parmak şerit" (tüm besinlere) | Yuvarlak ve küçük besinlerde şerit mümkün değil | Kademeler besine özgü (§3 CutGuideCard) |
| Ispanak +8 ay (örnek rozet) | Kaynaklar 6–9 ay arasında farklı (nitrat) | Rozet yaşını uzman belirler |
| Yumurta ve yer fıstığı (riskli algısı) | Erken tanıştırma öneriliyor; geciktirmek alerjiyi önlemiyor | Yasaklılara konmaz; "iyi pişmiş yumurta", "fıstık ezmesi ince sürülmüş" |
| "Ayın en besleyici 1 besini" | Üstünlük iddiası, kanıtlanamaz | "Ayın Kahramanı" adı korunur, "en besleyici" ifadesi kullanılmaz |

---

## 7. Araştırma özeti (modül başına: gerçek dünyada nasıl, biz nasıl daha iyi)

> Chrome eklentisi bağlı olmadığı için ajanlar web fetch ve arama kullandı. BabyCenter, What to Expect, BBC Good Food ve Yummy Toddler otomatik erişimi engelledi; bu sitelerle ilgili notlar ikinci elden.

- **Güvenli Kesim:** Solid Starts besin sayfasının üstünde yaş, demir ve alerjen karoları ve yaş blokları var; ama app satışı güveni zedeliyor, uzman ve tarih görünmüyor, boğulma filtresi yok. AAP güven yapısında en güçlüsü ama görseli yok. → Biz: **görsel kesim + AAP tipi güven mührü + boğulma riski filtresi**, reklamsız güvenlik kartları.
  Kaynak: [solidstarts.com/foods](https://solidstarts.com/foods/), [AAP Choking](https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx), [CDC](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html)
- **Bu besin verilir mi:** Mevcut örnekler ikili ya da uzun metin. → Biz: **3 durumlu tek cümle cevap**, ardından karolar, eş anlamlı Türkçe arama ve tek veri tablosundan beslenen tutarlılık.
- **Rehber / Yasaklılar:** NHS kategori grubu + madde başına bir satır gerekçe en iyi kalıp, ama tarih ve görsel yok. Acıbadem'de tarih var, isimli uzman ve kaynak yok. → Biz: **gerekçe + alternatif + isimli uzman + tarih**, öğürme ve boğulma karşılaştırma tablosu.
  Kaynak: [NHS foods to avoid](https://www.nhs.uk/best-start-in-life/baby/weaning/safe-weaning/food-and-drinks-to-avoid/), [Acıbadem BLW](https://www.acibadem.com.tr/ilgi-alani/blw-nedir/)
- **Dönemler:** BabyCenter tarihe göre otomatik "bugün" ama haftalık sahte hassasiyet var. NHS evre bloklarında sabit alanlar var ama evreler arası geçiş yok. → Biz: **5 kaba evre, sabit alanlı haplar, önceki/sonraki geçiş, yerel yaş seçimi** ve tek tablodan üretilen 3 durumlu matris.
  Kaynak: [NHS Start for Life](https://www.nhs.uk/start-for-life/), [NHS first foods](https://www.nhs.uk/conditions/baby/weaning-and-feeding/babys-first-solid-foods/)
- **Mevsimsel Takvim:** Eat the Seasons bugünü varsayılan alıyor ve iki seviyeli tazelik gösteriyor ama metin listesi. Seasonal Food Guide'da yıl çubuğu var. Olive'in matrisi mobilde çöküyor. Türk takvimlerinde yaş bilgisi yok. → Biz: **yaş rozetli ilk Türkçe takvim**, mobilde chip şeridi, paylaşılabilir "Kasım tezgâhı" kartı.
  Kaynak: [eattheseasons.co.uk](https://www.eattheseasons.co.uk/), [seasonalfoodguide.org](https://www.seasonalfoodguide.org/), [yemek.com](https://yemek.com/hangi-mevsimde-hangi-meyve-sebze/)
- **Tarifler:** Annabel Karmel'de filtreler birleşmiyor ve yaş etiketleri tutarsız. babyfoode'da facet'ler iyi ama kartta yaş rozeti yok. Nefis Yemek Tarifleri "Bebekler İçin"de hiç yaş bilgisi yok. → Biz: **tek etiket seti, birikimli kural yazılı, baskın rozet, birleşen alerjen filtresi**, sıfır sonuçta tek dokunuşla düzeltme.
  Kaynak: [annabelkarmel.com/recipes](https://www.annabelkarmel.com/recipes/), [babyfoode.com/recipes](https://babyfoode.com/recipes/)
- **3 Gün Kuralı:** Solid Starts ve Huckleberry'de iyi takipçiler var ama ücretli. RSF ve Lil Mixins ürüne bağlı. → Biz: **ücretsiz ve ürünsüz**; "son verilme N gün önce" bakım görünümü, reaksiyondan tarif filtresine köprü.
  Kaynak: [AAP Starting Solids](https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Starting-Solid-Foods.aspx), [NHS food allergies](https://www.nhs.uk/baby/weaning-and-feeding/food-allergies-in-babies-and-young-children/), [ASCIA](https://www.allergy.org.au/patients/allergy-prevention/ascia-how-to-introduce-solid-foods-to-babies)
- **Persentil:** DSÖ yalnız veri sunuyor. Pampers yalnız ay girişi alıyor ve tüm alanlar zorunlu. RCPCH soluk medyan ve aileye uygun dil kullanıyor ama klinik odaklı. Türkçe iyi bir interaktif araç yok. → Biz: **doğum tarihinden yaş, isteğe bağlı alanlar, soluk medyan, alarm vermeyen dil**.
  Kaynak: [WHO standards](https://www.who.int/tools/child-growth-standards), [RCPCH](https://growth.rcpch.ac.uk/about/about), [Pampers UK](https://www.pampers.co.uk/baby/growth-chart-calculator)

---

## 8. GitHub Pages yapısı

### 8.1 Repo önerisi
- **Öneri A (tercih):** `gaviaworks-dev/DadaKids` → `https://gaviaworks-dev.github.io/DadaKids/`. Bağımsız, hızlı yayın; Gastro prototipiyle aynı organizasyonda.
- **Öneri B:** `DadaMentor` reposunun içinde `Gastro/kids/` klasörü → `…/DadaMentor/Gastro/kids__tarifler.html`. Gastro'nun "donör = `DadaMentor/<Marka>/`" kuralına tam uyar; Laravel'e geçişte donör adresi hazır olur. Ama DadaMentor reposunu etkiler.
- Yerel çalışma klasörü: bu depo (`dadakids-prototip`).

### 8.2 Klasör yapısı
```
/                          ← GitHub Pages kökü (derlenmiş statik HTML commit'lenir)
  index.html               ← Gastro ana sayfa anlık görüntüsü + Kids widget'ı
  tarifler.html            ← Gastro tarif listesi anlık görüntüsü + Kids chip'i
  kids.html, kids__*.html  ← 25 Kids sayfası
  varlik/
    gastro/…               ← canlıdan birebir indirilen CSS/JS/font/ikon (alt yol yapısı korunur, değiştirilmez)
    kids/kids.css          ← yalnız yeni komponentler (Gastro token'larıyla)
    kids/kids.js           ← AgeFilter, TimelineSlider, MonthDial, arama, araçlar
    kids/svg/              ← kesim şemaları, piktogramlar, oturuş şeması (kendi çizimimiz)
    kids/gorsel/           ← tarif ve besin görselleri (Açık soru 9)
  veri/
    besinler.json          ← tek kaynak besin tablosu (40–50)
    tarifler.json          ← 12–16 örnek tarif
    evreler.json           ← 5 evre için hap alanları
    mevsim.json            ← ay → ürün listesi, spotlight
    who-lms.json           ← DSÖ LMS 0–36 ay
src/                       ← derleme girdisi (Pages'te yayınlanmaz ya da zararsız)
  parcalar/{header,cekmece,alt-cubuk,footer}.html  ← anlık görüntüden kesilmiş kabuk
  sayfalar/*.html          ← her sayfanın <main> içeriği
araclar/
  snapshot.mjs             ← Playwright anlık görüntü + varlık indirme + yol çevirme
  build.mjs                ← parçaları birleştirip kökte tam statik HTML üretir (bağımlılıksız Node)
  who-to-json.py           ← DSÖ XLSX → JSON
  parite.mjs               ← 1440/390 kabuk parite ölçümü
tasks/kids-plan.md
```
Neden derleme betiği: kabuk 25 sayfada birebir aynı kalmalı. JS ile çalışma anında enjekte etmek "render edilmiş DOM" ilkesini bozar ve SEO/donör kullanımını zayıflatır. Çıktı tam statik HTML'dir.

### 8.3 İş sırası (dalgalar)

| Dalga | İçerik | Neden bu sırada | Kabul |
|---|---|---|---|
| **0 · Temel** | Repo iskeleti; `snapshot.mjs` ile kabuk transferi (1440 ve 390); varlıkların 200 kapısı; giriş kapıları (ana sayfa widget'ı, `tarifler.html` chip'i, mega menü kartı); `kids.css` token köprüsü; `--kd-tema` ve 3 tema değeri; yaş rozeti paleti; KidsAgeBadge, AgeFilterBar ve `kd-ornek`; `besinler.json` iskeleti; `who-lms.json` dönüştürme | Her şey kabuğa ve ortak veriye yaslanıyor; tema ve rozet renkleri birlikte seçilmeli | Kabuk canlıyla 4px parite; boş bir `kids.html` Gastro'nun içinde duruyor; tema ve rozet renkleri kontrast tablosuyla onaylı |
| **1 · Vitrin** | `kids.html` (hub, KidsProfil adımı ve "değiştir" bağlantısı) + `kids__tarifler.html` + 1 tarif detayı | Kritik kuralı (yaş rozeti hiyerarşisi), hibrit kabuğu ve kişiselleştirmeyi en erken gösterir | Rozet 390'da ≥ 15px ve ilk bakışta okunuyor; filtre birikimli ve URL'li; profil sayfalar arası taşınıyor, 3 temada rozet ve uyarı renkleri değişmiyor |
| **2 · Güvenlik çekirdeği** | `kids__guvenli-kesim.html` + 3 besin detayı + `bu-besin-verilir-mi` | Aynı `besinler.json`'ı paylaşırlar; ürünün en güçlü farkı | Arama Türkçe normalize; 3 durumlu kart; hazard panel |
| **3 · Yolculuk** | `kids__donemler.html` + 5 evre + `kids__mevsimsel-takvim.html` | Slider ve kadran gibi etkileşimli bileşenler; dalga 1–2 verisini yeniden kullanır | Varsayılan evre ve ay doğru; klavye ve dokunmatik çalışıyor |
| **4 · Güven + araçlar** | Rehber (hub, yasaklılar, BLW) + 3 günlük gözlem + persentil | Metin ağırlıklı ve uzman girdisine en bağımlı kısım; araçlar teknik olarak bağımsız | Persentil, DSÖ tablosundaki P3/P50/P97 değerleriyle test noktalarında örtüşüyor |
| **5 · Cila** | 390/1440 tüm sayfa turu, erişilebilirlik (kontrast, odak, renk-bağımsız anlam), boş durumlar, parite raporu, `rapor/ss/` ekran görüntüleri | | Tüm sayfalar iki genişlikte gözden geçirilmiş |

---

## 9. Açık sorular

> **Karar durumu (31 Eki):** Soru 1 → **hayır**: nav'a kalem eklenmez; erişim ana sayfa widget'ı + Tarifler listesi + mega menü kartıyla (§1.3). Diğer sorularda Beyar "önerilerinle devam" yönünde; her sorudaki öneri varsayılan karar sayılır, aksi söylenirse değişir.

1. ~~**Global nav:** DADA KIDS 6. kalem mi?~~ → **Hayır.** Nav canlıdaki gibi kalır; Kids'e §1.3'teki üç kapıdan erişilir.
2. **Donör kaynağı:** Kabuk **canlı dadagastro.com**'dan mı alınsın (önerim; en güncel revizyonlar canlıda), yoksa Gastro'nun kanon prototipi `gaviaworks-dev.github.io/DadaMentor/Gastro/`'dan mı?
3. **Repo:** Ayrı `gaviaworks-dev/DadaKids` mi, yoksa `DadaMentor/Gastro/kids/` mi?
4. **Rozet renkleri:** +18 Ay ve 2–3 Yaş için renk tanımlı değil (öneri: +18 camgöbeği, 2–3 yaş lacivert). Turuncu (+9), Gastro'nun marka rengi tomato'ya (#DC3D17) çok yakın; daha amber bir ton kabul mü? Yeşil (+12), matristeki "uygun" yeşiliyle karışabilir. Hamilelik içerikleri için ayrı bir "Hamilelik T1/T2/T3" rozeti olsun mu?
5. **Spesifikasyon düzeltmeleri (§6.2):** Patlıcanın yasaklılardan çıkarılması, "dondurulmuş riskli" ifadesinin değişmesi, "3 gün kuralı"nın "gözlem" olarak çerçevelenmesi, inek sütü ve bakla ayrımları onaylı mı?
6. **Gilroy fontu:** Lisans, public GitHub Pages'te woff2 dosyalarının yayımlanmasına izin veriyor mu? İzin vermiyorsa prototip fontu dadagastro.com'dan çapraz kaynaklı çekebilir (CORS izni gerekir) ya da yedek font kullanılır.
7. **PantrySync / Kiler:** Canlıda "Kiler" yok, "Dolapta Ne Var?" var. Prototipte düğme örnek bir kilerle (önceden tanımlı 10 malzeme, "Demo kiler" etiketli) mi eşleşsin, yoksa "Dolapta Ne Var?"a mı bağlansın? "Eksikleri sepete at" hangi sepete gider?
8. **3 günlük gözlem kalıcılığı:** Gastro'nun "localStorage'da kullanıcı verisi yasak" kuralı prototip için de geçerli mi? Önerim: bellek içi demo + "Demo — kayıt tutulmaz" şeridi. Alternatif: yalnız bu cihazda localStorage + açık uyarı.
9. **Görseller:** Kids tarifleri için fotoğraf kaynağı ne olacak: Gastro medya kütüphanesi, stok görsel ya da kendi çekim/yer tutucu? Kesim şemaları ve piktogramlar için kendi basit SVG'lerimiz yeterli mi, yoksa bir illüstratör stili mi bekleniyor?
10. **DSÖ verisi:** Prototip ticari değil (atıfla serbest). Üretim için DSÖ izin başvurusunu kim yapacak? Prototipte sayfa altına atıf yeterli mi?
11. **Reklam / sponsorluk:** Tarifler hero'su Tat seçki kalıbından geliyor. Kids'te bir marka seçkisi alanı (ör. bebek maması markası) prototipte gösterilsin mi? Araştırma, güvenlik içeriğinin yanında reklamın güveni zedelediğini gösteriyor; önerim reklamı yalnız tarif listesinde göstermek, güvenlik ve araç sayfalarında hiç göstermemek.
12. **Hitap:** Gastro "sen" diliyle konuşuyor ("Dolabındakilerle ne pişersin?"). Kids'in medikal tonu için "siz" mi, tutarlılık için "sen" mi?
13. **Örnek içerik hacmi:** 12–16 örnek tarif, 40–50 besin ve 5 kesim detayı yeterli mi? Öncelikli görmek istediğiniz besin ya da tarif var mı?
14. **Profilin sayfalar arası taşınması:** Site çok sayfalı olduğu için salt bellek içi durum ilk bağ tıklamasında kaybolur. Önerim: profili Kids içi bağlara URL parametresi olarak taşımak (`?evre=6-8-ay&c=kiz`); depolama yok. Alternatif: `sessionStorage` (yalnız o sekme, kapanınca silinir).
15. **Tema tonları:** Pembe ve mavi için "yumuşak gül" ve "çelik mavisi" yönü uygun mu, yoksa elinizde bir referans ton var mı? (+8 ay mavisinden ayrışma ve kontrast ölçümü dalga 0'da yapılacak.)
