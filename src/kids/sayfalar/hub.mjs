// kids.html — Dada Kids ana sayfası (sahibi: lead)
import { dogumSecici } from '../dogum.mjs';
export default async function (o) {
  const { esc, EVRE, EVRE_SIRA, veri } = o;
  const tarifler = veri.tarifler.tarifler || [];

  const evreSecim = EVRE_SIRA.map((k) => `<label data-renk="${EVRE[k].renk}"><input type="radio" name="evre" value="${k}"><span>${o.ikon(EVRE[k].ikon, 18)}${esc(EVRE[k].ad)}</span></label>`).join('');

  const profil = `<div class="kd-profil kd-gir" id="kdProfil" aria-live="polite">
 <form class="kd-profil__form" novalidate>
  <h2>Bebeğiniz kaç aylık?</h2>
  <p class="kd-profil__alt">Seçiminize göre tarifler ve öneriler süzülür.</p>
  <fieldset><legend>Evre</legend><div class="kd-secim">${evreSecim}</div></fieldset>
  ${dogumSecici(o)}
  <fieldset><legend>Cinsiyet <span class="kd-ikincil">(isteğe bağlı)</span></legend>
   <div class="kd-secim">
    <label><input type="radio" name="c" value="belirtilmedi" checked><span>Belirtmek istemiyorum</span></label>
    <label data-renk="pembe"><input type="radio" name="c" value="kiz"><span>Kız</span></label>
    <label data-renk="mavi"><input type="radio" name="c" value="erkek"><span>Erkek</span></label>
    <label data-kd-bilinmiyor hidden><input type="radio" name="c" value="bilinmiyor"><span>Henüz bilmiyoruz</span></label>
   </div>
  </fieldset>
  <p class="kd-ornek" data-kd-uyari hidden role="alert"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>Lütfen bir evre seçin.</span></p>
  <button class="kd-btn" type="submit">Uygula <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
  <p class="kd-profil__not"><i class="fa-solid fa-lock" aria-hidden="true"></i> Doğum ayı yalnız bu tarayıcıda saklanır; hiçbir yere gönderilmez. Evre seçimi bu ziyarette taşınır, tema rengi (cinsiyet seçimine göre) bu cihazda hatırlanır.</p>
 </form>
 <div class="kd-profil__ozet">
  <span class="kd-profil__ozet-ikon">${o.ikon('kalp', 36)}</span>
  <div><b data-kd-ozet-evre></b><small data-kd-ozet-c></small></div>
  <button class="kd-degistir" type="button">değiştir</button>
 </div>
</div>`;

  const heroMedya = o.video('hub', '') || o.illus('hero-hub', 'Pastel mama sandalyesi, kase ve meyvelerle sevimli mutfak illüstrasyonu', { yedek: '', boy: 900 })
    || o.foto('varlik/kids/gorsel/hero-mutfak.webp', 'Gün ışığı alan mutfakta, tepsisinde pastel kase ve kaşık olan ahşap mama sandalyesi', { gen: 1800, yuk: 1200, oncelik: true });
  const kahramanGorsel = `<div class="kd-hero__gorsel kd-hub-gorsel">
  ${heroMedya}
  <span class="kd-hero__sus kd-hero__sus--1 kd-yuz">${o.ikon('parilti', 64)}</span>
  <span class="kd-hero__sus kd-hero__sus--2">${o.maskot('merhaba', { boy: 120, alt: 'Dada Kids maskotu Pütür el sallıyor' })}</span>
 </div>`;

  const ustBolum = `<section class="kd-hero kd-hub-hero" data-renk="seftali">
 <div class="wrap">
  ${o.kirinti([['Tarifler', 'tarifler.html'], ['Dada Kids']])}
  <div class="kd-hero__izgara">
   <div class="kd-hero__metin">
    ${o.kidsLogoSvg({ sinif: 'kd-hub-logo' })}
    <h1>Hamilelikten 3 yaşa, minik adımlarla beslenme</h1>
    <p class="kd-giris">Yaşa uygun tarifler, güvenli kesim rehberi, mevsim tezgâhı ve pratik araçlar — Dada Gastro'nun mutfağında, bebeğinizin evresine göre.</p>
    <div class="kd-hero__eylem">
     <a class="kd-btn" href="kids-tarifler.html">${o.ikon('kase', 22)} Kids Tarifleri</a>
     <a class="kd-btn kd-btn--hafif" href="#evreler">${o.ikon('takvim', 22)} Evreleri keşfet</a>
    </div>
   </div>
   ${kahramanGorsel}
  </div>
 </div>
</section>`;

  const profilBolum = `<section class="kd-bolum kd-bolum--sikisik kd-hub-profil">
 <div class="wrap"><div class="kd-hub-profil__izgara">
  ${profil}
  <div class="kd-hub-profil__yan kd-gir">
   <div class="kd-rehberci kd-hub-pütür">${o.maskot('kalp', { boy: 96 })}<p class="kd-baloncuk"><b>Merhaba, ben Pütür!</b> Bebeğinizin evresini seçin, size uygun tarifleri ve ipuçlarını öne çıkarayım.</p></div>
   <h2>Size özel bir Kids</h2>
   <ul class="kd-hub-liste">
    <li>${o.ikon('kase', 28)}<span><b>Tarifler yaşa göre süzülür</b>Rozet, kıvam ve alerjen etiketleriyle.</span></li>
    <li>${o.ikon('takvim', 28)}<span><b>Evreniz öne çıkar</b>Beslenme, kıvam ve odak besinler.</span></li>
    <li>${o.ikon('kalp', 28)}<span><b>Bilgileriniz sizde kalır</b>Doğum ayı yalnız bu tarayıcıda saklanır, hiçbir yere gönderilmez; evre seçimi bu ziyarette taşınır.</span></li>
   </ul>
  </div>
 </div></div>
</section>`;

  const evreler = `${o.ayirici('bulut', o.zebraRenk('mavi'))}<section class="kd-bolum kd-zebra kd-desen--nokta" data-renk="mavi" id="evreler">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Dönemler', ikonAd: 'takvim', renk: 'mavi', baslik: 'Beş evre, her biri kendi renginde', alt: 'Hamilelikten 3 yaşa: hangi evrede ne yenir, kıvam nasıl olur, hangi besinler öne çıkar?', sag: '<a class="kd-btn kd-btn--hafif kd-btn--kucuk" href="kids-donemler.html">Tüm dönemler <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' })}
  <div class="kd-izgara kd-hub-evreler">${EVRE_SIRA.map((k) => o.evreKart(k)).join('\n')}</div>
 </div>
</section>`;

  const kartlar = tarifler.map((t, i) => o.tarifKart(t, { sira: i })).join('\n');
  const tarifBolum = `<section class="kd-bolum kd-zebra" data-renk="seftali" id="tarifler">
 <div class="wrap">
  <div class="kd-bas"><div>${o.ustYazi('Kids Tarifleri', { ikonAd: 'kase', renk: 'seftali' })}<h2 data-kd-onizleme-baslik>Ek gıdaya başlarken ilk tarifler</h2><p>${tarifler.length} örnek tarif; yaş rozeti, kıvam ve alerjen etiketiyle.</p></div>
   <a class="kd-btn" href="kids-tarifler.html" data-kd-tumu>Tümünü gör <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>
  <p class="kd-ornek kd-hub-not" data-kd-erken-not hidden role="note"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span><b>Bu evrede ek gıda başlanmaz.</b> Tarifler 6. aydan itibaren; ilk tadım tariflerini önceden inceleyebilirsiniz. Hazır olup olmadığını <a class="kd-bag" href="kids-arac-hazir-mi.html">kontrol listesiyle</a> görün.</span></p>
  <div class="kd-izgara" id="kdOnizleme">${kartlar}</div>
 </div>
</section>`;

  const moduller = `<section class="kd-bolum kd-desen--konfeti" id="moduller">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Modüller', ikonAd: 'parilti', renk: 'mint', baslik: 'Altı modül, tek mutfak', alt: 'Her biri açık ve dolu; dilediğinizden başlayın.' })}
  <div class="kd-izgara kd-hub-moduller">${o.MODULLER.filter((m) => m.kod !== 'kids').map((m) => o.modulKart(m)).join('\n')}</div>
 </div>
</section>`;

  // Bu ay tezgâhta (içerik varsa)
  let mevsimBolum = '';
  const aylar = veri.mevsim.aylar || [];
  if (aylar.length) {
    const panel = aylar.map((a) => `<div class="kd-hub-ay" data-ay="${a.ay}"${a.ay === 1 ? '' : ' hidden'}>
   <div class="kd-hub-ay__kahraman" data-renk="sari">${o.urun(a.kahraman.ikon, 96, a.kahraman.ad)}<div><span class="kd-ust-yazi" data-renk="sari">${esc(a.ad)} · Ayın kahramanı</span><h3>${esc(a.kahraman.ad)}</h3><p>${esc(a.kahraman.neden)}</p></div></div>
   <div class="kd-hub-ay__urunler">${a.urunler.slice(0, 8).map((u) => `<span class="kd-hub-urun">${o.urun(u.ikon, 44, '')}<small>${esc(u.ad)}</small></span>`).join('')}</div>
  </div>`).join('\n');
    mevsimBolum = `${o.ayirici('dalga', o.zebraRenk('sari'))}<section class="kd-bolum kd-zebra" data-renk="sari" id="mevsim">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Mevsimsel Takvim', ikonAd: 'sepet', renk: 'sari', baslik: 'Bu ay tezgâhta neler var?', alt: 'Mevsiminde ürün daha lezzetli ve ekonomik; Türkiye geneli için örnek bir tezgâh.', sag: '<a class="kd-btn kd-btn--hafif kd-btn--kucuk" href="kids-mevsim.html">Mevsim takvimi <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' })}
  <div class="kd-hub-mevsim kd-gir" data-kd-bu-ay>${panel}</div>
 </div>
</section>`;
  }

  // Rehber (içerik varsa)
  let rehberBolum = '';
  const rehber = Array.isArray(veri.rehber) ? veri.rehber : [];
  if (rehber.length) {
    rehberBolum = `<section class="kd-bolum" id="rehber">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Rehber', ikonAd: 'kitap', renk: 'pembe', baslik: 'Merak ettikleriniz, sade bir dille', sag: '<a class="kd-btn kd-btn--hafif kd-btn--kucuk" href="kids-rehber.html">Tüm rehber <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' })}
  <div class="kd-izgara">${rehber.map((r, i) => `<a class="kd-kart kd-gir kd-hub-makale" href="kids-rehber-${r.slug}.html" data-renk="${['seftali', 'mint', 'pembe', 'mavi'][i % 4]}">
   <div class="kd-hub-makale__kapak">${o.illus({ 'ek-gidaya-gecis': 'rehber-ek-gida', 'blw-temelleri': 'rehber-blw', 'ogurme-mi-bogulma-mi': 'rehber-ogurme', 'alerjen-tanitimi': 'rehber-alerjen' }[r.slug] || '', `${r.baslik} — kapak illüstrasyonu`, { boy: 600, yedek: '' }) || (r.kapak ? o.foto(r.kapak, `${r.baslik} — kapak fotoğrafı`, { gen: 1400, yuk: 788 }) : o.sahne('tabak-parmak-gida'))}</div>
   <div class="kd-kart__govde"><h3>${esc(r.baslik)}</h3><p>${esc(r.ozet)}</p><span class="kd-kart__alt"><span class="kd-ikincil">${r.okumaDk ? r.okumaDk + ' dk okuma' : ''}</span><span>Oku <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></span></div>
  </a>`).join('\n')}</div>
 </div>
</section>`;
  }

  const guven = `${o.ayirici('dalga', o.zebraRenk('mint'))}<section class="kd-bolum kd-zebra kd-desen--bulut" data-renk="mint" id="guven">
 <div class="wrap"><div class="kd-hub-guven">
  <div>
   ${o.ustYazi('Güven merkezi', { ikonAd: 'kalp', renk: 'mint' })}
   <h2>Bu içerikler nasıl hazırlanıyor?</h2>
   <p>Dada Kids'teki her yaş, kıvam ve alerjen bilgisi tek bir besin tablosundan beslenir; aynı kural tarif kartında, evre sayfasında ve araçlarda aynı sonucu verir. Bu prototipteki içerikler henüz bir çocuk doktoru ya da çocuk diyetisyeni tarafından incelenmedi; hepsi örnek içeriktir. Yayına alınmadan önce uzman incelemesinden geçmesi ve inceleme tarihinin gösterilmesi planlanıyor.</p>
   ${o.ornek('Prototipteki tüm beslenme bilgileri örnektir; tıbbi tavsiye yerine geçmez.')}
  </div>
  <div class="kd-hub-guven__yan">
   ${o.onay()}
   <ul class="kd-hub-kaynak">
    <li><b>DSÖ (WHO)</b> Ek gıda rehberi ve büyüme standartları</li>
    <li><b>AAP · HealthyChildren</b> Ek gıda ve boğulma önleme</li>
    <li><b>NHS · Start for Life</b> Kaçınılacak besinler, kıvam evreleri</li>
    <li><b>T.C. Sağlık Bakanlığı</b> Ulusal beslenme rehberleri</li>
   </ul>
  </div>
 </div></div>
</section>`;

  return [{
    dosya: 'kids.html',
    baslik: 'Dada Kids — Hamilelikten 3 Yaşa Beslenme | Dada Gastro',
    aciklama: 'Hamilelikten 3 yaşa, bebeğinizin evresine göre tarifler, güvenli kesim, mevsim takvimi, rehber ve pratik araçlar.',
    aktif: 'kids',
    css: ['hub', 'dogum-secici'],
    js: ['hub', 'dogum-secici'],
    main: o.sayfa([ustBolum, profilBolum, evreler, tarifBolum, moduller, mevsimBolum, rehberBolum, guven].join('\n'), 'kids'),
  }];
}
