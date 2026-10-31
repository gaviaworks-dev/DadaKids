// Dada Kids — Araçlar (sahibi: araçlar kolu)
// kids-araclar.html (hub) · kids-arac-hazir-mi.html · kids-arac-alerjen-takip.html
// kids-arac-ogun-planlayici.html · kids-arac-persentil.html
/* ---------- Tur 2: görsel varlık denetimi + bölüm ritmi (sayfalar kolu; 4 modülde aynı küçük yardımcılar) ---------- */
import { existsSync } from 'node:fs';
const KOK = new URL('../../../', import.meta.url).pathname;
const illusVar = (k) => ['webp', 'svg', 'png'].some((u) => existsSync(`${KOK}varlik/kids/illus/${k}.${u}`));
const urunVar = (k) => existsSync(`${KOK}varlik/kids/svg/urun/${k}.svg`);
const DESEN = ['nokta', 'bulut', 'konfeti'];
const zemin = (renk) => (renk ? `color-mix(in srgb, var(--kd-${renk}-a) 62%, var(--kd-krem))` : 'var(--kd-krem)');
/** Bölümleri sırayla dizer: bir krem, bir açık evre bandı (zebra + desen); aralarına dalga/bulut ayırıcı.
 *  Her bölüm (z) => html; z, section etiketinin class değerine eklenecek metindir (zebra ise data-renk'i de taşır). */
function ritim(o, bolumler, renkler, { zebraIle = true } = {}) {
  const dolu = bolumler.filter((b) => b && b(''));
  let html = ''; let onceki = null; let oncekiDesen = '';
  dolu.forEach((b, i) => {
    const zebra = (i % 2 === 0) === zebraIle ? renkler[Math.floor(i / 2) % renkler.length] : null;
    const desen = zebra ? DESEN[Math.floor(i / 2) % DESEN.length] : '';
    if (i > 0 || zebra) html += `<div class="kd-gecis${onceki ? ` kd-zebra kd-desen--${oncekiDesen}` : ''}"${onceki ? ` data-renk="${onceki}"` : ''}>${o.ayirici(i % 2 ? 'bulut' : 'dalga', zemin(zebra))}</div>\n`;
    html += b(zebra ? ` kd-zebra kd-desen--${desen}" data-renk="${zebra}` : '') + '\n';
    onceki = zebra; oncekiDesen = desen;
  });
  return html;
}

const ARAC_ILLUS = { 'hazir-mi': 'arac-hazir-mi', 'alerjen-takip': 'arac-alerjen', 'ogun-planlayici': 'arac-ogun', 'persentil': 'arac-persentil' };

export default async function (o) {
  const { esc, ikon, veri } = o;
  const ipucu = (poz, html, sinif = '') => `<div class="kd-rehberci kd-ipucu kd-gir ${sinif}">${o.maskot(poz, { boy: 104 }) || `<span class="kd-ipucu__yedek" aria-hidden="true">${ikon('parilti', 40)}</span>`}<p class="kd-baloncuk"><b>Pütür'ün notu:</b> ${html}</p></div>`;
  const aracIllus = (a, alt = '', boy = 480) => (illusVar(ARAC_ILLUS[a.kod]) ? o.illus(ARAC_ILLUS[a.kod], alt, { boy }) : '');
  const bosGorsel = (anahtar = 'bos-durum') => `${illusVar(anahtar) ? o.illus(anahtar, '', { boy: 200, sinif: 'kd-ar-bos__illus' }) : ''}${o.maskot('uyku', { boy: 72, sinif: 'kd-ar-bos__maskot' })}`;
  const ok = '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
  const fa = (ad, ek = 'solid') => `<i class="fa-${ek} fa-${ad}" aria-hidden="true"></i>`;

  const ARACLAR = [
    { kod: 'hazir-mi', href: 'kids-arac-hazir-mi.html', ad: 'Ek gıdaya hazır mı?', ikon: 'mama-sandalyesi', renk: 'seftali', tur: 'Kontrol listesi', sure: '1 dakika',
      ac: 'Beş işaretle bebeğinizin katı gıdaya hazır olup olmadığını birlikte gözden geçirin.',
      maddeler: ['Sık anılan 5 hazır olma işareti', 'Tanı değil, sohbet başlatıcı', 'Rehber ve ilk tariflere köprü'] },
    { kod: 'alerjen-takip', href: 'kids-arac-alerjen-takip.html', ad: '3 günlük gözlem', ikon: 'takvim', renk: 'pembe', tur: 'Alerjen takipçisi', sure: 'Her gün 1 dakika',
      ac: 'Yeni bir alerjeni tanıştırırken üç gün boyunca gözlemlerinizi kısa notlarla kaydedin.',
      maddeler: ['9 yaygın alerjen ya da kendi besininiz', 'Gün gün belirti notları', 'Düzenli devam hatırlatıcısı'] },
    { kod: 'ogun-planlayici', href: 'kids-arac-ogun-planlayici.html', ad: 'Haftalık öğün planlayıcı', ikon: 'tabak-bolmeli', renk: 'mint', tur: 'Planlayıcı', sure: '5 dakika',
      ac: 'Yaşa uygun Kids tarifleriyle 7 günlük plan yapın, alışveriş listesi kendiliğinden çıksın.',
      maddeler: ['Yaşa ve öğüne göre tarifler', 'Tek tıkla çeşitli öneriler', 'Yazdırılabilir alışveriş listesi'] },
    { kod: 'persentil', href: 'kids-arac-persentil.html', ad: 'Büyüme persentili', ikon: 'cetvel', renk: 'mavi', tur: 'Hesaplayıcı', sure: '2 dakika',
      ac: 'DSÖ büyüme standartlarına göre kilo, boy ve baş çevresinin yaşıtlarıyla karşılaştırması.',
      maddeler: ['0–36 ay, kız ve erkek', 'Grafik ve tablo görünümü', 'Hiçbir veri kaydedilmez'] },
  ];
  const A = Object.fromEntries(ARACLAR.map((a) => [a.kod, a]));
  const kirinti = (ad) => [['Dada Kids', 'kids.html'], ['Araçlar', 'kids-araclar.html'], [ad]];

  // Araç sayfası kahramanının sağ tarafı: büyük pastel ikon rozeti
  const aracRozet = (a, ek = '') => (illusVar(ARAC_ILLUS[a.kod]) ? `<div class="kd-hero__gorsel kd-ar-hero-illus" data-renk="${a.renk}">${aracIllus(a, `${a.ad} aracını anlatan sevimli illüstrasyon`, 560)}</div>` : `<div class="kd-ar-rozet" data-renk="${a.renk}" aria-hidden="true">
   <span class="kd-ar-rozet__daire">${ikon(a.ikon, 96)}</span>
   <span class="kd-ar-rozet__nokta kd-ar-rozet__nokta--1"></span><span class="kd-ar-rozet__nokta kd-ar-rozet__nokta--2"></span><span class="kd-ar-rozet__nokta kd-ar-rozet__nokta--3"></span>
   <span class="kd-ar-rozet__sus kd-yuz">${ikon('parilti', 44)}</span>
   ${ek}
  </div>`);

  const aracHero = (a, { baslik, giris, eylemler = '', ek = '' }) => o.hero({
    renk: a.renk, kucuk: true, kirinti: kirinti(a.ad), ust: { metin: a.tur, ikon: a.ikon }, baslik, giris, eylemler, ek, sag: aracRozet(a),
  });

  const noscript = '<noscript><p class="kd-kutu kd-kutu--uyari">Bu araç çalışmak için JavaScript gerektirir. Lütfen tarayıcınızda JavaScript\'i açın.</p></noscript>';

  const digerAraclar = (haric) => (z) => `<section class="kd-bolum kd-ar-diger${z}">
 <div class="wrap">
  <h2 class="kd-ar-diger__baslik">Diğer araçlar</h2>
  <div class="kd-ar-diger__liste">${ARACLAR.filter((a) => a.kod !== haric).map((a) => `<a class="kd-ar-mini" href="${a.href}" data-renk="${a.renk}"><span class="kd-ar-mini__ikon${illusVar(ARAC_ILLUS[a.kod]) ? ' kd-ar-mini__ikon--illus' : ''}">${aracIllus(a, '', 120) || ikon(a.ikon, 30)}</span><span><b>${esc(a.ad)}</b><small>${esc(a.tur)}</small></span>${ok}</a>`).join('')}</div>
 </div>
</section>`;

  /* =====================================================================
     1 · HUB
     ===================================================================== */
  const hubKart = (a, i) => `<article class="kd-kart kd-ar-kart kd-gir" data-renk="${a.renk}" style="--kd-gecikme:${i * 70}ms">
  ${illusVar(ARAC_ILLUS[a.kod]) ? `<div class="kd-ar-kart__resim">${aracIllus(a, '', 560)}</div>` : ''}
  <div class="kd-ar-kart__ust">
   <span class="kd-ar-kart__ikon">${ikon(a.ikon, 52)}</span>
   <span class="kd-ar-kart__tur">${esc(a.tur)}<small>${fa('clock', 'regular')} ${esc(a.sure)}</small></span>
  </div>
  <h3><a href="${a.href}">${esc(a.ad)}</a></h3>
  <p>${esc(a.ac)}</p>
  <ul class="kd-ar-kart__maddeler">${a.maddeler.map((m) => `<li>${fa('check')}<span>${esc(m)}</span></li>`).join('')}</ul>
  <span class="kd-btn kd-ar-kart__ac" aria-hidden="true">Aç ${ok}</span>
 </article>`;

  const hubKolaj = `<div class="kd-ar-kolaj" aria-hidden="true">
  ${ARACLAR.map((a, i) => `<span class="kd-ar-kolaj__kare kd-ar-kolaj__kare--${i + 1}" data-renk="${a.renk}">${ikon(a.ikon, 64)}</span>`).join('')}
  <span class="kd-ar-kolaj__sus kd-yuz">${ikon('parilti', 48)}</span>
 </div>`;

  const hub = {
    dosya: 'kids-araclar.html', aktif: 'araclar', css: ['araclar'], js: [],
    baslik: 'Araçlar — Dada Kids',
    aciklama: 'Ek gıdaya hazır mı kontrol listesi, 3 günlük alerjen gözlemi, haftalık öğün planlayıcı ve DSÖ büyüme persentili hesaplayıcı.',
    main: o.sayfa(`${o.hero({
      renk: 'mavi', kirinti: [['Dada Kids', 'kids.html'], ['Araçlar']], ust: { metin: 'Araçlar', ikon: 'arac' },
      baslik: 'Beslenme yolculuğunda küçük yardımcılar',
      giris: 'İlk kaşıktan aile sofrasına; hazır olma işaretleri, alerjen gözlemi, haftalık plan ve büyüme takibi için dört sade araç. Hepsi tarayıcınızda çalışır, hesap gerekmez.',
      eylemler: `<a class="kd-btn" href="#araclar">Araçları gör ${fa('arrow-down')}</a>`,
      sag: illusVar('hero-araclar') ? `<div class="kd-hero__gorsel kd-ar-hero-illus">${o.illus('hero-araclar', 'Kontrol listesi, takvim, tabak ve cetvelle çevrili sevimli bir mutfak masası illüstrasyonu', { boy: 640 })}</div>` : hubKolaj,
    })}
${ritim(o, [(z) => `<section class="kd-bolum${z}" id="araclar">
 <div class="wrap">
  ${o.bolumBasi({ ust: '4 araç', ikonAd: 'arac', renk: 'mavi', baslik: 'Hangisine ihtiyacınız var?', alt: 'Her araç bir soruya odaklanır. Sonuçlar bilgilendirme amaçlıdır; kararları çocuk doktorunuzla birlikte verin.', sag: ipucu('merhaba', 'Hepsi tarayıcınızda çalışır, hesap gerekmez. Birini seçin, birlikte bakalım!', 'kd-ipucu--sag') })}
  <div class="kd-ar-izgara">${ARACLAR.map(hubKart).join('\n')}</div>
 </div>
</section>`, (z) => `<section class="kd-bolum${z}">
 <div class="wrap">
  <div class="kd-ar-guven kd-gir">
   <div class="kd-ar-guven__metin">
    <h2>Bu araçlar nasıl çalışır?</h2>
    <ul>
     <li>${fa('stethoscope')}<span><b>Tanı koymaz.</b> Sonuçlar genel rehberlere dayanan bilgilendirmedir; yerine geçtiği bir muayene yoktur.</span></li>
     <li>${fa('mobile-screen')}<span><b>Veriler cihazınızda kalır.</b> Alerjen gözlemi ve öğün planı yalnız bu tarayıcıda saklanır; persentil hesaplayıcı hiçbir şey kaydetmez.</span></li>
     <li>${fa('book-open')}<span><b>Kaynaklar açık.</b> DSÖ, AAP, NHS ve ASCIA gibi ana akım rehberlerin uzlaştığı bilgiler kullanılır.</span></li>
    </ul>
   </div>
   <div class="kd-ar-guven__yan">${ipucu('kalp', 'Sonuçlar bir sohbet başlangıcıdır; kararları çocuk doktorunuzla birlikte verin.')}${o.onay()}${o.ornek('Araçlardaki metinler ve eşikler prototip için hazırlanmıştır; çocuk doktoru / çocuk diyetisyeni onayından geçmeden yayına alınmaz.')}</div>
  </div>
 </div>
</section>`], ['mavi'])}`, 'araclar'),
  };

  /* =====================================================================
     2 · EK GIDAYA HAZIR MI?
     ===================================================================== */
  const ISARETLER = [
    { kod: 'ay', fa: 'cake-candles', baslik: 'Yaklaşık 6 aylık', metin: 'Ek gıdaya genellikle 6. ay civarında başlanır. 4. aydan önce başlanmaz.' },
    { kod: 'otur', fa: 'child-reaching', baslik: 'Destekle oturuyor, başını dik tutuyor', metin: 'Mama sandalyesinde desteklenerek oturabiliyor ve başını sabit tutabiliyor.' },
    { kod: 'ilgi', fa: 'eye', baslik: 'Yiyeceğe ilgi gösteriyor', metin: 'Siz yerken izliyor, tabağa uzanıyor, kaşık yaklaşınca ağzını açıyor.' },
    { kod: 'el', fa: 'hand', baslik: 'Elindekini ağzına götürebiliyor', metin: 'Bir nesneyi kavrayıp kendi başına ağzına götürebiliyor.' },
    { kod: 'yut', fa: 'face-smile', baslik: 'Yutabiliyor, diliyle dışarı itmiyor', metin: 'Dil itme refleksi azalmış; yiyeceği ağzının önünden geri itmek yerine yutabiliyor.' },
  ];
  const hm = A['hazir-mi'];
  const isaretKart = (s, i) => `<li class="kd-hm-isaret">
   <input type="checkbox" id="hm-${s.kod}" name="isaret" value="${s.kod}">
   <label for="hm-${s.kod}">
    <span class="kd-hm-isaret__no" aria-hidden="true">${i + 1}</span>
    <span class="kd-hm-isaret__ikon" aria-hidden="true">${fa(s.fa)}</span>
    <span class="kd-hm-isaret__metin"><b>${esc(s.baslik)}</b><small>${esc(s.metin)}</small></span>
    <span class="kd-hm-isaret__kutu" aria-hidden="true">${fa('check')}</span>
   </label>
  </li>`;

  const hazirMi = {
    dosya: 'kids-arac-hazir-mi.html', aktif: 'araclar', css: ['araclar'], js: ['hazir-mi'],
    baslik: 'Ek gıdaya hazır mı? Kontrol listesi — Dada Kids',
    aciklama: 'Bebeğiniz katı gıdaya hazır mı? Sık anılan beş hazır olma işaretini işaretleyin, çocuk doktorunuzla konuşmadan önce birlikte gözden geçirin.',
    main: o.sayfa(`${aracHero(hm, {
      baslik: 'Ek gıdaya hazır mı?',
      giris: 'Hazır olma tek bir tarihle değil, birkaç işaretin bir araya gelmesiyle anlaşılır. Bebeğinizde gördüklerinizi işaretleyin; sonuç bir tanı değil, doktorunuzla konuşmak için bir başlangıç noktasıdır.',
    })}
${ritim(o, [(z) => `<section class="kd-bolum${z}">
 <div class="wrap">
  ${noscript}
  <form class="kd-hm" id="kdHazirMi" data-renk="seftali" novalidate>
   <div class="kd-hm__sol">
    <fieldset class="kd-ar-panel">
     <legend class="kd-ar-panel__baslik"><span>Bebeğinizde hangilerini görüyorsunuz?</span><small>Gözlemlerinize göre işaretleyin. Emin değilseniz boş bırakın.</small></legend>
     <ol class="kd-hm-liste">${ISARETLER.map(isaretKart).join('')}</ol>
    </fieldset>
    <div class="kd-ar-panel kd-ar-panel--ince">
     <label class="kd-ar-anahtar" for="hm-erken">
      <input type="checkbox" id="hm-erken" name="erken">
      <span class="kd-ar-anahtar__ray" aria-hidden="true"></span>
      <span><b>Bebeğim erken doğdu (prematüre)</b><small>Erken doğan bebeklerde başlama zamanı farklı değerlendirilebilir.</small></span>
     </label>
    </div>
   </div>
   <aside class="kd-hm__sag">
    <div class="kd-hm-sonuc" data-durum="bos">
     <div class="kd-hm-sonuc__olcer" aria-hidden="true">${ISARETLER.map(() => '<span></span>').join('')}</div>
     <div class="kd-hm-sonuc__canli" aria-live="polite" aria-atomic="true">
      <p class="kd-hm-sonuc__sayi"><b data-hm-sayi>0</b> / ${ISARETLER.length} işaret</p>
      <h2 data-hm-baslik>İşaretledikçe sonuç burada belirir</h2>
      <p data-hm-metin>Her bebek kendi hızında gelişir. İşaretler genellikle birkaç hafta içinde bir araya gelir.</p>
     </div>
     <p class="kd-hm-sonuc__erken" data-hm-erken hidden>${fa('circle-info')} <span>Erken doğan bebeklerde ek gıdaya ne zaman başlanacağını çocuk doktorunuzla birlikte belirleyin; düzeltilmiş yaş da göz önüne alınabilir.</span></p>
     <div class="kd-hm-sonuc__eylem">
      <a class="kd-btn" href="kids-rehber-ek-gidaya-gecis.html">${ikon('kitap', 22)} Ek gıdaya geçiş rehberi</a>
      <a class="kd-btn kd-btn--hafif" href="kids-tarifler.html?yas=6">${ikon('kase', 22)} +6 Ay ilk tarifler</a>
     </div>
    </div>
    ${o.ornek('Hazır olma işaretleri DSÖ, NHS ve AAP\'nin sık andığı işaretlerden derlenmiştir; uzman onayından geçmeden yayına alınmaz.')}
   </aside>
  </form>
 </div>
</section>`, (z) => `<section class="kd-bolum${z}">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Bilmekte fayda var', ikonAd: 'kitap', renk: 'seftali', baslik: 'Sık karıştırılanlar', sag: ipucu('kasik', 'Her bebek kendi hızında hazır olur. Birkaç hafta beklemek de gayet olağan.', 'kd-ipucu--sag') })}
  <div class="kd-hm-bilgi">
   <div class="kd-kutu kd-gir" data-renk="sari">
    <h3>${fa('lightbulb')} Hazır olma işareti sanılanlar</h3>
    <p>Yumruğunu çiğnemek, gece daha sık uyanmak ya da daha fazla süt istemek tek başına katı gıdaya hazır olma işareti sayılmaz. Bunlar büyümenin olağan parçaları olabilir.</p>
   </div>
   <div class="kd-kutu kd-gir" data-renk="mint">
    <h3>${fa('heart')} Süt hâlâ ana besin</h3>
    <p>Ek gıdaya başladıktan sonra da anne sütü ya da formül mama ilk yıl boyunca beslenmenin temeli olmayı sürdürür. İlk haftalarda amaç tanışmaktır, doymak değil.</p>
   </div>
   <div class="kd-kutu kd-gir" data-renk="mavi">
    <h3>${fa('user-doctor')} Ne zaman danışmalı?</h3>
    <p>Bebeğiniz 6 aya yaklaştığı hâlde işaretlerin çoğu yoksa, prematüre doğduysa ya da yutma ve beslenmeyle ilgili bir endişeniz varsa çocuk doktorunuzla konuşun.</p>
   </div>
  </div>
 </div>
</section>`, digerAraclar('hazir-mi')], ['seftali'], { zebraIle: false })}`, 'araclar'),
  };

  /* =====================================================================
     3 · 3 GÜNLÜK GÖZLEM (alerjen takipçisi)
     ===================================================================== */
  const ALERJENLER = [
    ['sut', 'Süt', 'mavi'], ['yumurta', 'Yumurta', 'sari'], ['yerfistigi', 'Yer fıstığı', 'seftali'], ['sertkabuklu', 'Sert kabuklu', 'seftali'],
    ['susam', 'Susam', 'sari'], ['bugday', 'Gluten', 'sari'], ['soya', 'Soya', 'mint'], ['balik', 'Balık', 'mavi'], ['kabuklu', 'Kabuklu deniz ürünü', 'pembe'],
  ];
  const BELIRTILER = [
    ['doku', 'Döküntü'], ['agiz', 'Ağız çevresinde kızarıklık'], ['kusma', 'Kusma'], ['ishal', 'İshal / dışkı değişikliği'],
    ['gaz', 'Gaz'], ['huzursuz', 'Huzursuzluk'], ['sislik', 'Şişlik'], ['yok', 'Belirti yok'],
  ];
  const at = A['alerjen-takip'];
  const bugun = new Date().toISOString().slice(0, 10);
  const alerjenSecim = ALERJENLER.map(([k, ad, r]) => `<label data-renk="${r}"><input type="radio" name="alerjen" value="${k}" data-ad="${esc(ad)}"><span>${esc(ad)}</span></label>`).join('')
    + `<label><input type="radio" name="alerjen" value="ozel" data-ad="Başka bir besin"><span>${fa('plus')} Başka bir besin</span></label>`;

  const alerjenTakip = {
    dosya: 'kids-arac-alerjen-takip.html', aktif: 'araclar', css: ['araclar'], js: ['alerjen-takip'],
    baslik: '3 günlük gözlem: alerjen tanıştırma takipçisi — Dada Kids',
    aciklama: 'Yeni bir alerjeni tanıştırırken üç gün boyunca gözlemlerinizi kaydedin. Yaygın bir uygulama; kesin tıbbi kural değil. Kayıtlar yalnız bu cihazda tutulur.',
    main: o.sayfa(`${aracHero(at, {
      baslik: '3 günlük gözlem',
      giris: 'Yeni bir alerjeni tanıştırırken birkaç gün gözlem yapmak <b>yaygın bir uygulamadır; kesin bir tıbbi kural değildir.</b> Bu takipçi gözlemlerinizi düzenli tutmanıza ve doktorunuzla paylaşmanıza yardım eder.',
      eylemler: '<a class="kd-btn" href="#atYeni">Gözlem başlat ' + fa('arrow-down') + '</a>',
    })}
${ritim(o, [(z) => `<section class="kd-bolum${z}">
 <div class="wrap kd-at-ust">
  <div class="kd-ar-acil" role="note" aria-labelledby="atAcilBaslik">
   <span class="kd-ar-acil__ikon" aria-hidden="true">${fa('phone')}</span>
   <div>
    <h2 id="atAcilBaslik">Acil belirtiler: hemen 112</h2>
    <p>Nefes darlığı ya da hırıltı, yüzde, dudaklarda veya dilde şişme, vücuda yayılan kurdeşen, solukluk ya da belirgin halsizlik görürseniz beklemeden <a href="tel:112"><b>112</b></a>'yi arayın.</p>
   </div>
  </div>
  <div class="kd-kutu kd-at-cerceve" data-renk="mavi">
   <h3>${ikon('kalkan', 26)} Gözlem, alerjenleri geciktirmek için bir neden değildir</h3>
   <p>Amerikan Pediatri Akademisi (AAP) yeni besinler arasında 3–5 gün bırakmayı önerir; NHS ve ASCIA ise sabit bir bekleme süresi koymaz. Ortak öneri: <b>alerjenleri birer birer tanıştırın</b> ve tolere edilenleri <b>düzenli olarak sofrada tutun</b>. Yaygın alerjenleri (yumurta, yer fıstığı gibi) ilk yılda tanıştırmak önerilir; geciktirmek alerjiyi önlemez.</p>
  </div>
 </div>
</section>`, (z) => `<section class="kd-bolum${z}">
 <div class="wrap">
  ${noscript}
  <template data-at-bos-gorsel>${bosGorsel('bos-durum')}</template>
  ${ipucu('buyutec', 'Bir seferde tek bir yeni alerjen tanıştırın; tolere ettiklerini haftada birkaç kez sofrada tutmayı unutmayın.', 'kd-at-ipucu')}
  <div class="kd-at" id="kdAlerjen" data-renk="pembe">
   <p class="kd-ar-depo-not" data-at-depo-yok hidden role="status">${fa('triangle-exclamation')} <span>Tarayıcınız bu sayfada kayıt tutmaya izin vermiyor. Takipçi çalışır, ancak sayfayı kapatınca kayıtlar silinir.</span></p>
   <div class="kd-at__izgara">
    <div class="kd-at__ana">
     <section class="kd-ar-panel" id="atYeni" aria-labelledby="atYeniBaslik">
      <h2 class="kd-ar-panel__baslik" id="atYeniBaslik"><span>${o.ikon('kasik', 28)} Yeni gözlem başlat</span><small>Bir seferde tek bir yeni alerjen.</small></h2>
      <form class="kd-at-form" id="atForm" novalidate>
       <fieldset>
        <legend>Hangi besini tanıştırıyorsunuz?</legend>
        <div class="kd-secim">${alerjenSecim}</div>
       </fieldset>
       <div class="kd-ar-alan" data-at-ozel hidden>
        <label for="atOzelAd">Besinin adı</label>
        <input type="text" id="atOzelAd" maxlength="40" autocomplete="off" placeholder="ör. kivi">
       </div>
       <div class="kd-ar-alan kd-ar-alan--kisa">
        <label for="atBaslangic">Başlangıç tarihi</label>
        <input type="date" id="atBaslangic" value="${bugun}" max="${bugun}">
       </div>
       <p class="kd-at-hata" data-at-hata hidden role="alert"></p>
       <div class="kd-at-uyari" data-at-uyari hidden role="alert">
        <p>${fa('hand')} <span data-at-uyari-metin></span></p>
        <div class="kd-at-uyari__eylem">
         <button type="button" class="kd-btn kd-btn--kucuk" data-at-yine-de>Yine de başlat</button>
         <button type="button" class="kd-btn kd-btn--kucuk kd-btn--hafif" data-at-vazgec>Vazgeç</button>
        </div>
       </div>
       <button class="kd-btn" type="submit">${fa('play')} Gözlemi başlat</button>
      </form>
     </section>
     <section class="kd-at-suren" id="atSuren" aria-labelledby="atSurenBaslik" aria-live="polite">
      <h2 class="kd-at-bolum-baslik" id="atSurenBaslik">Süren gözlem</h2>
      <div data-at-suren-liste></div>
     </section>
    </div>
    <aside class="kd-at__yan">
     <section class="kd-ar-panel" aria-labelledby="atHaritaBaslik">
      <h2 class="kd-ar-panel__baslik" id="atHaritaBaslik"><span>${o.ikon('tabak-bolmeli', 28)} Alerjen haritası</span><small>9 yaygın alerjende nerede olduğunuz.</small></h2>
      <ul class="kd-at-harita" data-at-harita>${ALERJENLER.map(([k, ad, r]) => `<li data-alerjen="${k}" data-renk="${r}" data-durum="yok"><span class="kd-at-harita__ad">${esc(ad)}</span><span class="kd-at-harita__durum">Henüz denenmedi</span></li>`).join('')}</ul>
     </section>
     <section class="kd-ar-panel" aria-labelledby="atDevamBaslik">
      <h2 class="kd-ar-panel__baslik" id="atDevamBaslik"><span>${o.ikon('takvim', 28)} Düzenli devam</span><small>Tanıştığı alerjenleri sofrada tutmak önerilir.</small></h2>
      <div data-at-devam aria-live="polite"></div>
     </section>
     <section class="kd-ar-panel kd-ar-panel--ince" aria-labelledby="atGecmisBaslik" data-at-gecmis-bolum hidden>
      <h2 class="kd-ar-panel__baslik" id="atGecmisBaslik"><span>${o.ikon('liste', 28)} Geçmiş</span></h2>
      <ul class="kd-at-gecmis" data-at-gecmis></ul>
     </section>
    </aside>
   </div>
   <div class="kd-at-alt">
    <p class="kd-at-alt__not">${fa('lock')} <span><b>Kayıtlar yalnız bu cihazda tutulur.</b> Hiçbir sunucuya gönderilmez; tarayıcı verilerini silerseniz kayıtlar da silinir.</span></p>
    <div class="kd-at-alt__eylem">
     <button type="button" class="kd-btn kd-btn--hafif kd-btn--kucuk" data-at-yazdir>${fa('print')} Özeti yazdır</button>
     <button type="button" class="kd-btn kd-btn--hafif kd-btn--kucuk kd-ar-btn-sil" data-at-sil aria-expanded="false" aria-controls="atSilOnay">${fa('trash-can', 'regular')} Tüm kayıtları sil</button>
    </div>
    <div class="kd-ar-sil-onay" id="atSilOnay" hidden role="group" aria-labelledby="atSilSoru">
     <p id="atSilSoru"><b>Emin misiniz?</b> Bu cihazdaki tüm gözlem kayıtları kalıcı olarak silinir.</p>
     <div>
      <button type="button" class="kd-btn kd-btn--kucuk kd-ar-btn-sil-onay" data-at-sil-evet>Evet, hepsini sil</button>
      <button type="button" class="kd-btn kd-btn--kucuk kd-btn--hafif" data-at-sil-hayir>Vazgeç</button>
     </div>
    </div>
    <p class="kd-gizli" data-at-duyuru role="status" aria-live="polite"></p>
   </div>
   <section class="kd-ar-yazdir" data-at-ozet aria-hidden="true"></section>
  </div>
  <div class="kd-at-son">
   ${o.ornek('Belirti listesi, eşikler ve sonuç metinleri ana akım rehberlerden (AAP, NHS, ASCIA) derlenmiştir; uzman onayından geçmeden yayına alınmaz.')}
   <p class="kd-at-son__bag">Daha fazlası: <a class="kd-bag" href="kids-rehber-alerjen-tanitimi.html">Rehber: alerjen tanıştırma</a> · <a class="kd-bag" href="kids-tarifler.html">Alerjene göre tarif süz</a></p>
  </div>
 </div>
</section>`, digerAraclar('alerjen-takip')], ['pembe'], { zebraIle: false })}`, 'araclar'),
  };

  /* =====================================================================
     4 · HAFTALIK ÖĞÜN PLANLAYICI
     ===================================================================== */
  const anahtar = (metin) => String(metin || '')
    .toLocaleLowerCase('tr')
    .replace(/\(.*?\)/g, ' ')
    .replace(/^[\s\d½¼¾⅓⅔.,/–-]+/, '')
    .replace(/^(adet|tane|su bardağı|çay bardağı|yemek kaşığı|tatlı kaşığı|çay kaşığı|kahve fincanı|gram|gr|g|kg|ml|lt|litre|dilim|avuç|tutam|kase|demet|diş|yaprak|paket|kutu|küçük boy|orta boy|büyük boy|küçük|orta|büyük|yarım|çeyrek)\b\s*/g, '')
    .replace(/^(adet|tane|küçük|orta|büyük|boy)\b\s*/g, '')
    .replace(/[,.;:].*$/, '')
    .trim();
  // Alışveriş listesi için: { a: ad, q: miktar, k: gruplama anahtarı | null (su/süt gibi evde olanlar listeye girmez) }
  const malzDuz = (liste) => (Array.isArray(liste) ? liste : []).flatMap((m) => {
    if (!m) return [];
    if (typeof m === 'string') { const k = anahtar(m); return k ? [{ a: m, q: '', k }] : []; }
    if (Array.isArray(m.liste || m.malzemeler)) return malzDuz(m.liste || m.malzemeler);
    const ad = m.ad || m.metin || '';
    if (!ad) return [];
    const k = m.anahtar === null ? null : String(m.anahtar || anahtar(ad)).trim() || null;
    return [{ a: ad, q: [m.miktar, m.birim].filter(Boolean).join(' '), k }];
  });
  const tarifler = (veri.tarifler.tarifler || []).filter((t) => t && t.slug && t.ad);
  const planVeri = tarifler.map((t) => ({
    s: t.slug, a: t.ad, y: t.yas, o: t.ogun || [], al: t.alerjenler || [], g: t.gorsel || '', k: t.kivam || '', m: malzDuz(t.malzemeler),
  }));
  const jsonGom = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  const op = A['ogun-planlayici'];
  const yasSecim = o.YASLAR.map((y) => `<label data-renk="${o.yasRenk(y)}"><input type="radio" name="yas" value="${y}"><span>${esc(o.YAS_ETIKET[y])}</span></label>`).join('');
  const PLAN_ALERJEN = Object.entries(o.ALERJEN_AD);
  const haricSecim = PLAN_ALERJEN.map(([k, ad]) => `<label><input type="checkbox" name="haric" value="${k}"><span>${esc(ad)}</span></label>`).join('');

  const ogunPlanlayici = {
    dosya: 'kids-arac-ogun-planlayici.html', aktif: 'araclar', css: ['araclar'], js: ['ogun-planlayici'],
    baslik: 'Haftalık öğün planlayıcı — Dada Kids',
    aciklama: 'Bebeğinizin yaşına uygun Kids tarifleriyle 7 günlük öğün planı yapın; istemediğiniz alerjenleri dışarıda bırakın, alışveriş listesini yazdırın.',
    main: o.sayfa(`${aracHero(op, {
      baslik: 'Haftalık öğün planlayıcı',
      giris: 'Yaşı seçin, öğünleri Kids tarifleriyle doldurun ya da önerilere bırakın. Alışveriş listesi siz planladıkça kendiliğinden oluşur.',
      eylemler: '<a class="kd-btn" href="#plAyar">Planlamaya başla ' + fa('arrow-down') + '</a>',
    })}
${ritim(o, [(z) => `<section class="kd-bolum${z}">
 <div class="wrap">
  ${noscript}
  ${ipucu('sef', 'Bebeğiniz bir tarifi sevmediyse birkaç gün sonra yeniden deneyin; yeni tatlar çoğu zaman birkaç denemede kabul edilir.', 'kd-pl-ipucu-putur')}
  <script type="application/json" id="kdTarifVeri">${jsonGom(planVeri)}</script>
  <div class="kd-pl" id="kdPlanlayici" data-renk="mint">
   <p class="kd-ar-depo-not" data-pl-depo-yok hidden role="status">${fa('triangle-exclamation')} <span>Tarayıcınız bu sayfada kayıt tutmaya izin vermiyor. Plan çalışır, ancak sayfayı kapatınca silinir.</span></p>
   <div class="kd-ar-panel kd-pl-ayar" id="plAyar">
    <fieldset>
     <legend>Bebeğinizin yaşı</legend>
     <div class="kd-secim" data-pl-yas>${yasSecim}</div>
    </fieldset>
    <fieldset>
     <legend>Bu alerjenleri içermesin <span class="kd-ikincil">(isteğe bağlı)</span></legend>
     <div class="kd-secim kd-ar-secim-sade" data-pl-haric>${haricSecim}</div>
    </fieldset>
    <div class="kd-pl-ayar__eylem">
     <button type="button" class="kd-btn" data-pl-doldur>${fa('wand-magic-sparkles')} Önerilerle doldur</button>
     <button type="button" class="kd-btn kd-btn--hafif" data-pl-temizle aria-expanded="false" aria-controls="plTemizleOnay">${fa('eraser')} Planı temizle</button>
     <button type="button" class="kd-btn kd-btn--hafif" data-pl-yazdir>${fa('print')} Yazdır</button>
    </div>
    <div class="kd-ar-sil-onay" id="plTemizleOnay" hidden role="group" aria-labelledby="plTemizleSoru">
     <p id="plTemizleSoru"><b>Plan temizlensin mi?</b> Haftadaki tüm seçimler kaldırılır.</p>
     <div>
      <button type="button" class="kd-btn kd-btn--kucuk kd-ar-btn-sil-onay" data-pl-temizle-evet>Evet, temizle</button>
      <button type="button" class="kd-btn kd-btn--kucuk kd-btn--hafif" data-pl-temizle-hayir>Vazgeç</button>
     </div>
    </div>
    <p class="kd-pl-ipucu" data-pl-ipucu aria-live="polite"></p>
   </div>
   <div class="kd-ar-yazdir kd-pl-yazdir">
    <div class="kd-ar-yazdir__bas"><b>Dada Kids · Haftalık öğün planı</b><span data-pl-yazdir-ozet></span></div>
    <div class="kd-pl-tablo" data-pl-izgara aria-live="polite"></div>
    <section class="kd-ar-panel kd-pl-liste" aria-labelledby="plListeBaslik">
     <div class="kd-pl-liste__bas">
      <h2 class="kd-ar-panel__baslik" id="plListeBaslik"><span>${o.ikon('sepet', 28)} Alışveriş listesi</span><small data-pl-liste-ozet>Plan doldukça malzemeler burada toplanır.</small></h2>
      <button type="button" class="kd-btn kd-btn--hafif kd-btn--kucuk" data-pl-kopyala hidden>${fa('copy', 'regular')} Listeyi kopyala</button>
     </div>
     <ul class="kd-pl-malz" data-pl-malz></ul>
     <p class="kd-pl-liste__bos" data-pl-malz-bos hidden></p>
    </section>
   </div>
   <p class="kd-pl-not">${fa('lock')} Plan yalnız bu cihazda saklanır. Tuz, şeker ve bal eklenmeyen Kids tarifleri kullanılır.</p>
  </div>
  ${o.ornek('Öğün sayıları ve yaş eşikleri genel rehberlere göre örneklenmiştir; bebeğinizin iştahı ve gelişimi önceliklidir. Uzman onayından geçmeden yayına alınmaz.')}
 </div>
</section>`, digerAraclar('ogun-planlayici')], ['mint'], { zebraIle: false })}`, 'araclar'),
  };

  /* =====================================================================
     5 · DSÖ PERSENTİL
     ===================================================================== */
  const pr = A['persentil'];
  const olcuAlan = (id, etiket, birim, ipucu) => `<div class="kd-ar-alan kd-ar-alan--olcu">
   <label for="${id}">${etiket} <span class="kd-ikincil">(isteğe bağlı)</span></label>
   <div class="kd-ar-birimli"><input type="text" id="${id}" inputmode="decimal" autocomplete="off" placeholder="${ipucu}" aria-describedby="${id}-b"><span id="${id}-b">${birim}</span></div>
  </div>`;

  const persentil = {
    dosya: 'kids-arac-persentil.html', aktif: 'araclar', css: ['araclar'], js: ['persentil'],
    baslik: 'Büyüme persentili hesaplayıcı (DSÖ) — Dada Kids',
    aciklama: 'DSÖ Çocuk Büyüme Standartlarına göre 0–36 ay için kilo, boy ve baş çevresi persentili. Grafik ve tablo görünümü; hiçbir veri kaydedilmez.',
    main: o.sayfa(`${aracHero(pr, {
      baslik: 'Büyüme persentili',
      giris: 'Ölçümlerinizi girin; bebeğinizin aynı yaştaki çocuklarla karşılaştırmasını DSÖ büyüme standartlarına göre görün. Tek bir ölçümden çok <b>zaman içindeki eğilim</b> önemlidir.',
    })}
${ritim(o, [(z) => `<section class="kd-bolum${z}">
 <div class="wrap">
  ${noscript}
  <div class="kd-pr" id="kdPersentil" data-renk="mavi">
   <form class="kd-ar-panel kd-pr-form" id="prForm" novalidate>
    <h2 class="kd-ar-panel__baslik"><span>${o.ikon('cetvel', 28)} Ölçümler</span><small>Hiçbir değer kaydedilmez.</small></h2>
    <fieldset>
     <legend>Cinsiyet</legend>
     <div class="kd-secim">
      <label data-renk="pembe"><input type="radio" name="cinsiyet" value="kiz"><span>Kız</span></label>
      <label data-renk="mavi"><input type="radio" name="cinsiyet" value="erkek"><span>Erkek</span></label>
     </div>
     <p class="kd-ar-alan__ipucu">DSÖ tabloları kız ve erkek için ayrıdır.</p>
    </fieldset>
    <div class="kd-pr-form__tarih">
     <div class="kd-ar-alan"><label for="prDogum">Doğum tarihi</label><input type="date" id="prDogum" max="${bugun}"></div>
     <div class="kd-ar-alan"><label for="prOlcum">Ölçüm tarihi</label><input type="date" id="prOlcum" value="${bugun}"></div>
    </div>
    <p class="kd-pr-yas" data-pr-yas aria-live="polite"></p>
    ${olcuAlan('prKilo', 'Kilo', 'kg', 'ör. 8,4')}
    ${olcuAlan('prBoy', 'Boy', 'cm', 'ör. 71,5')}
    ${olcuAlan('prBas', 'Baş çevresi', 'cm', 'ör. 44')}
    <p class="kd-at-hata" data-pr-hata hidden role="alert"></p>
    <button class="kd-btn" type="submit">${fa('chart-line')} Hesapla</button>
    <p class="kd-ar-alan__ipucu">Ondalık için virgül ya da nokta kullanabilirsiniz. 24. aydan sonra boy ayakta ölçülür; 24. ayda iki ölçüm arasında ~0,7 cm fark olağandır.</p>
   </form>
   <div class="kd-pr-sonuc" data-pr-sonuc>
    <div class="kd-pr-bos" data-pr-bos>
     ${illusVar('bos-durum') ? `<span class="kd-ar-bos">${bosGorsel('bos-durum')}</span>` : `<span class="kd-pr-bos__ikon" aria-hidden="true">${fa('chart-line')}</span>`}
     <h2>Sonuçlar burada görünecek</h2>
     <p>Cinsiyet, doğum tarihi ve en az bir ölçüm girip <b>Hesapla</b>'ya dokunun.</p>
    </div>
    <div data-pr-cikti hidden>
     <div class="kd-pr-sekmeler" role="tablist" aria-label="Ölçümler" data-pr-sekmeler></div>
     <div data-pr-paneller aria-live="polite"></div>
    </div>
    <div class="kd-kutu kd-pr-dil" data-renk="mavi">
     <h3>${fa('circle-info')} Persentil ne anlatır?</h3>
     <p>50. persentil "olması gereken" değil, ortadaki değerdir. 3. ile 97. persentil arası geniş bir sağlıklı çeşitliliği kapsar. Asıl önemli olan, bebeğinizin kendi eğrisini zaman içinde nasıl izlediğidir. Sorularınızı bir sonraki kontrolde doktorunuzla paylaşın. DSÖ standardı tanı değildir.</p>
    </div>
   </div>
  </div>
  <div class="kd-pr-son">
   ${o.ornek('Hesaplama DSÖ LMS yöntemiyle yapılır; metinler ve gösterim örnektir, uzman onayı bekliyor. Erken doğan bebekler için düzeltilmiş yaş kullanılması gerekebilir; bu araç düzeltme yapmaz.')}
   <p class="kd-pr-lisans">${fa('scale-balanced')} <span>Veri: <a class="kd-bag" href="https://www.who.int/tools/child-growth-standards" rel="noopener" target="_blank">WHO Child Growth Standards (2006)</a>, CC BY-NC-SA 3.0 IGO — ticari olmayan prototip kullanımı; üretimde DSÖ izni gerekir. DSÖ bu aracı onaylamış değildir.</span></p>
  </div>
 </div>
</section>`, digerAraclar('persentil')], ['mavi'], { zebraIle: false })}`, 'araclar'),
  };

  return [hub, hazirMi, alerjenTakip, ogunPlanlayici, persentil];
}
