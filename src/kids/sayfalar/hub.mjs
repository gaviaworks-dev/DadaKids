// kids.html — Dada Gastro Kids ana sayfası (sahibi: v2-hub)
// Hero: başlık + güven rozeti + iki eylem + dinamik dönem çubuğu (tek seçimli radyo grubu) → altta VİTRİN o döneme göre süzülür.
// Vitrin içeriği sunucuda her dönem için çizilir; varlik/kids/js/hub.js yalnız gösterir/gizler, sıralar ve duyurur.
import { existsSync } from 'node:fs';
import { dogumSecici } from '../dogum.mjs';

/** Dönem çubuğu: görünür metinler revizyon dokümanındaki biçimde (kısa çizgi). */
const DONEM_ETIKET = { 'hamilelik': 'Hamilelik', '0-6-ay': '0-6 Ay', '6-8-ay': '6-8 Ay', '9-12-ay': '9-12 Ay', '1-3-yas': '1-3 Yaş' };
/** Dönem → ay aralığı (besin uygunluğu), kesim aşaması, tarif üst sınırı, tarif listesi yaş kovası. */
const DONEM = {
  'hamilelik': { alt: null, kesim: null },
  '0-6-ay': { alt: 0, kesim: '6-8', onizleme: true },
  '6-8-ay': { alt: 6, kesim: '6-8', yasUst: 8, one: 6, kova: '8' },
  '9-12-ay': { alt: 9, kesim: '9-12', yasUst: 12, one: 9, kova: '12' },
  '1-3-yas': { alt: 12, kesim: '12+', yasUst: 99, one: 12, kova: 'tumu' },
};
const KESIM_BESIN = ['havuc', 'muz', 'uzum', 'brokoli', 'avokado'];   // vitrinde dönem başına gösterilen kesim örnekleri (sayı: KESIM_ADET)
// Denge (Beyar EK): iki vitrin kartı eşit boyda; kısa kartın boşluğu içerikle dolar → kesim örneği sayısı aşamaya göre (besin kartının uzunluğuna denk)
const KESIM_ADET = { '6-8-onizleme': 4, '6-8': 5, '9-12': 5, '12+': 5 };
const KESIM_AD = { '6-8': '6–8 Ay', '9-12': '9–12 Ay', '12+': '12 Ay ve sonrası' };
const ilkCumle = (s = '') => { const m = String(s).match(/^.+?[.;](\s|$)/); return (m ? m[0] : s).trim().replace(/;$/, '.'); };

export default async function (o) {
  const { esc, EVRE, EVRE_SIRA, veri } = o;
  const tarifler = veri.tarifler.tarifler || [];
  const besinler = (veri.besinler.besinler || []);
  const bebekBesin = besinler.filter((b) => !b.hamilelik);
  const evreVeri = (k) => (veri.evreler.evreler || []).find((x) => x.kod === k) || {};
  const kesim = Array.isArray(veri.kesim) ? veri.kesim : [];
  // Foto turu: ürün görseli o.urunVar() (gerçek fotoğraf webp var mı)
  const urunVar = (ad) => o.urunVar(ad);

  /* ---------------- Hero ---------------- */
  const donemCubugu = `<form class="kd-hub-donem" data-kd-donem novalidate>
  <fieldset class="kd-hub-donem__grup">
   <legend class="kd-hub-donem__etiket" id="kdDonemEtiket">Bebeğinizin dönemi</legend>
   <div class="kd-hub-donem__kaydir"><div class="kd-hub-donem__liste">${EVRE_SIRA.map((k) => `<label class="kd-hub-donem__secenek" data-renk="${EVRE[k].renk}"><input type="radio" name="evre" value="${k}"><span>${esc(DONEM_ETIKET[k])}</span></label>`).join('')}</div></div>
  </fieldset>
  <div class="kd-hub-donem__alt">
   ${dogumSecici(o, { id: 'kdDs', baslik: 'Doğum ayından dönemi hesaplayın', aciklama: 'Gün gerekmez; ay ve yıl yeterli. Sonuç dönem çubuğuna yazılır.', kompakt: true, tetik: 'Doğum tarihinden hesapla' })}
   <a class="kd-hub-donem__git" href="#vitrin" data-kd-donem-git><span>Vitrini gör</span> <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></a>
  </div>
 </form>`;

  const ustBolum = `<section class="kd-hero kd-hub-hero" data-renk="seftali">
 <div class="wrap">
  ${o.kirinti([['Tarifler', 'tarifler.html'], ['Dada Gastro Kids']])}
  <div class="kd-hero__izgara">
   <div class="kd-hero__metin">
    <h1>Hamilelikten 3 yaşa, minik adımlarla beslenme</h1>
    ${o.guvenRozeti({ sinif: 'kd-hub-rozet' })}
    <p class="kd-giris">Yaşa uygun tarifler, güvenli kesim rehberi, mevsim tezgâhı ve pratik araçlar — Dada Gastro'nun mutfağında, bebeğinizin dönemine göre.</p>
    <div class="kd-hero__eylem">
     <a class="kd-btn" href="kids-tarifler.html">${o.ikon('kase', 22)} Kids Tarifleri</a>
     <a class="kd-btn kd-btn--hafif" href="#evreler">${o.ikon('takvim', 22)} Dönemleri keşfet</a>
    </div>
   </div>
   <div class="kd-hero__gorsel kd-hub-gorsel">
    ${o.foto('varlik/kids/gorsel/hero-mutfak-kirp.webp', 'Gün ışığı alan mutfakta, tepsisinde kase ve kaşık olan ahşap mama sandalyesi; tezgâhta taze meyve tabağı', { gen: 1028, yuk: 822, oncelik: true })}
   </div>
   ${donemCubugu}
  </div>
 </div>
</section>
${o.guvenlikSeridi()}`;

  /* ---------------- Vitrin ---------------- */
  // (a) Tarifler: tüm kartlar bir kez çizilir; hub.js döneme göre süzer, sıralar, ilk 8'i gösterir.
  const kartlar = tarifler.map((t, i) => o.tarifKart(t, { sira: i, gir: false })).join('\n');
  const tarifBlok = `<div class="kd-hub-vitrin__tarif" data-kd-vitrin-tarif>
   <div class="kd-izgara kd-dortlu kd-kaydir-mobil" data-izgara-oneri data-kd-vitrin-izgara>${kartlar}${o.seriCta({ renk: 'seftali' })}</div>
  </div>`;

  // Hamilelik ve 0–6 ay: ek gıda tarifi yok; dönem açıklaması (veri/evreler.json)
  const hamile = evreVeri('hamilelik'), yeni = evreVeri('0-6-ay');
  const ilkBesinler = bebekBesin.filter((b) => b.minAy === 6 && b.durum === 'evet').slice(0, 10);
  const erkenBlok = `<div class="kd-hub-erken" data-kd-vitrin-erken="hamilelik" data-renk="pembe" hidden>
   <div class="kd-hub-erken__giris"><h3>${esc(hamile.slogan || 'Hamilelik & Lohusalık')}</h3><p>${esc(hamile.ozet || '')}</p></div>
   <ul class="kd-hub-odak">${(hamile.odakBesinler || []).slice(0, 3).map((x) => `<li><b>${esc(x.ad)}</b><span>${esc(ilkCumle(x.neden))}</span><small>Örnek: ${esc((x.ornekler || []).slice(0, 4).join(', '))}</small></li>`).join('')}</ul>
   <a class="kd-bag" href="${o.evreSayfasi('hamilelik')}">Hamilelik & Lohusalık dönemi rehberi <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
  </div>
  <div class="kd-hub-erken" data-kd-vitrin-erken="0-6-ay" data-renk="mavi" hidden>
   <div class="kd-hub-erken__giris"><h3>${esc(yeni.slogan || '0–6 Ay')}</h3><p>${esc(yeni.ozet || '')}</p></div>
   <div class="kd-hub-erken__ikili">
    <div class="kd-hub-kutu">
     <h4>Ek gıdaya hazır mı?</h4>
     <ul class="kd-hub-madde">${(yeni.kivamDikkat || []).slice(0, 4).map((x, i) => `<li${i === 3 ? ' class="kd-hub-dar"' : ''}>${esc(x.replace(/^Hazır olma işareti \d:\s*/, ''))}</li>`).join('')}</ul>
     <a class="kd-btn kd-btn--kucuk" href="kids-arac-hazir-mi.html">${o.ikon('liste', 20)} Ek gıdaya hazır mı? aracı</a>
    </div>
    <div class="kd-hub-kutu">
     <h4>6. ay önizlemesi</h4>
     <p>Yaklaşık 6. ayda ilk tadımlar başlar. İlk tanışılan besinlerden bazıları:</p>
     <ul class="kd-hub-chipler">${ilkBesinler.map((b) => `<li>${esc(b.ad)}</li>`).join('')}</ul>
     <a class="kd-bag" href="kids-tarifler.html?yas=6">6. ay tariflerine göz atın <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </div>
   </div>
  </div>`;

  // (b) Güvenli kesim: dönemin aşamasından birkaç besin
  const kesimPanel = (asama, { onizleme = false } = {}) => {
    const satirlar = KESIM_BESIN.map((s) => kesim.find((k) => k.slug === s)).filter((k) => k && k.asamalar && k.asamalar[asama]).slice(0, KESIM_ADET[asama + (onizleme ? '-onizleme' : '')] || 4);
    return `<div class="kd-hub-kesim" data-kd-vitrin-kesim="${asama}${onizleme ? '-onizleme' : ''}" hidden>
     <h3>${onizleme ? '6. ay önizlemesi: güvenli kesim' : `Güvenli kesim · ${KESIM_AD[asama]}`}</h3>
     <ul class="kd-hub-kesim__liste">${satirlar.map((k) => `<li class="kd-ikonlu">${urunVar(k.ikon) ? `<span class="kd-ikonlu__ikon kd-hub-kesim__ikon">${o.urun(k.ikon, 24)}</span>` : ''}<h4 class="kd-ikonlu__baslik">${esc(k.ad)}</h4><p class="kd-ikonlu__metin"><b class="kd-hub-kesim__boyut">${esc(k.asamalar[asama].boyut)}</b><small>${esc(ilkCumle(k.asamalar[asama].nasil))}</small></p></li>`).join('')}</ul>
     <a class="kd-bag" href="kids-guvenli-kesim.html">Güvenli kesim şemasının tamamı <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </div>`;
  };
  const hamileGuvenlik = `<div class="kd-hub-kesim" data-kd-vitrin-kesim="hamilelik" hidden>
     <h3>Mutfakta gıda güvenliği</h3>
     <ul class="kd-hub-madde">${(hamile.kivamDikkat || []).slice(0, 5).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
     <h4>Her gün</h4>
     <ul class="kd-hub-madde">${(hamile.beslenme || []).slice(0, 4).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
     <a class="kd-bag" href="${o.evreSayfasi('hamilelik')}">Dönem rehberinde tamamı <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </div>`;
  const kesimBlok = `${hamileGuvenlik}${kesimPanel('6-8', { onizleme: true })}${kesimPanel('6-8')}${kesimPanel('9-12')}${kesimPanel('12+')}`;

  // (c) Besinler: veri/besinler.json minAy + durum
  // "Bu dönemde odak": veri/evreler.json odakBesinler adları (kısa çip satırı; kısa kartın boşluğunu içerikle doldurur)
  const odak = (kod) => { const l = evreVeri(kod).odakBesinler || []; return l.length ? `<h4>Bu dönemde odak</h4><ul class="kd-hub-chipler kd-hub-chipler--odak">${l.map((x) => `<li>${esc(x.ad)}</li>`).join('')}</ul>` : ''; };
  const henuzSatir = (b) => `<li><b>${esc(b.ad)}</b><small>${esc(ilkCumle(b.gerekce))}</small></li>`;
  const besinPanel = (kod) => {
    const d = DONEM[kod];
    if (kod === 'hamilelik') {
      const kacin = besinler.filter((b) => b.hamilelik && b.durum === 'henuz');
      const dikkat = besinler.filter((b) => b.hamilelik && b.durum === 'hazirlikla');
      return `<div class="kd-hub-besin" data-kd-vitrin-besin="hamilelik" hidden>
       <h3>Besinler · Hamilelik & Lohusalık</h3>
       <h4>Kaçınılacaklar</h4><ul class="kd-hub-henuz">${kacin.slice(0, 5).map(henuzSatir).join('')}</ul>
       ${dikkat.length ? `<h4>Sınırlı ve dikkatle</h4><ul class="kd-hub-chipler kd-hub-chipler--dikkat">${dikkat.map((b) => `<li>${esc(b.ad)}</li>`).join('')}</ul>` : ''}
       <a class="kd-bag" href="${o.YASAKLI_REHBER}">Kaçınılacaklar rehberi <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
      </div>`;
    }
    if (kod === '0-6-ay') {
      const henuz = bebekBesin.filter((b) => b.durum === 'henuz' && (b.minAy == null || b.minAy >= 12) && b.minAy !== 48 && b.minAy !== 60);
      return `<div class="kd-hub-besin" data-kd-vitrin-besin="0-6-ay" hidden>
       <h3>Besinler · 0–6 Ay</h3>
       <p>İlk 6 ayda anne sütü ya da formül mama yeterlidir; ek besin ve su gerekmez.</p>
       <h4>1 yaşından önce verilmeyenler</h4><ul class="kd-hub-henuz">${henuz.slice(0, 5).map(henuzSatir).join('')}</ul>
       ${odak(kod)}
       <a class="kd-bag" href="${o.evreSayfasi(kod)}">Dönem rehberine git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
      </div>`;
    }
    const tanimli = bebekBesin.filter((b) => b.minAy != null);
    const uygun = tanimli.filter((b) => b.minAy <= d.alt && b.durum === 'evet');
    const dikkat = tanimli.filter((b) => b.minAy <= d.alt && b.durum !== 'evet');
    const henuz = bebekBesin.filter((b) => (b.minAy != null && b.minAy > d.alt) || (b.minAy == null && b.durum === 'henuz'));
    const cip = (liste, en, sinif = '') => `<ul class="kd-hub-chipler${sinif}">${liste.slice(0, en).map((b) => `<li>${esc(b.ad)}</li>`).join('')}${liste.length > en ? `<li class="kd-hub-chipler__daha">+${liste.length - en} besin</li>` : ''}</ul>`;
    return `<div class="kd-hub-besin" data-kd-vitrin-besin="${kod}" hidden>
     <h3>Besinler · ${esc(EVRE[kod].ad)}</h3>
     <h4>Bu dönemde uygun <small>(${uygun.length})</small></h4>${cip(uygun, 10)}
     ${dikkat.length ? `<h4>Hazırlığına ya da miktarına dikkat <small>(${dikkat.length})</small></h4>${cip(dikkat, 8, ' kd-hub-chipler--dikkat')}` : ''}
     ${henuz.length ? `<h4>Henüz değil</h4><ul class="kd-hub-henuz">${henuz.slice(0, 4).map(henuzSatir).join('')}</ul>` : ''}
     <a class="kd-bag" href="${o.evreSayfasi(kod)}">Dönem rehberine git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </div>`;
  };
  const besinBlok = EVRE_SIRA.map(besinPanel).join('');

  const vitrin = `<section class="kd-bolum kd-hub-vitrin" id="vitrin" aria-labelledby="kdVitrinBaslik">
 <div class="wrap">
  <div class="kd-bas">
   <div class="kd-hub-vitrin__bas" aria-live="polite" aria-atomic="true">
    ${o.ustYazi('Vitrin', { ikonAd: 'kase', renk: 'seftali' })}
    <h2 id="kdVitrinBaslik" data-kd-vitrin-baslik>İlk tadım tarifleri</h2>
    <p data-kd-vitrin-ozet>6–8 Ay için örnek vitrin: ${tarifler.filter((t) => t.yas <= 8).length} uygun tarif, güvenli kesim ve besinler. Döneminizi yukarıdan seçin.</p>
   </div>
   <a class="kd-btn" href="kids-tarifler.html?yas=8" data-kd-vitrin-tumu>Tümünü gör <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
  </div>
  ${tarifBlok}
  ${erkenBlok}
  <div class="kd-hub-vitrin__ikili">
   <div class="kd-hub-vitrin__sutun">${kesimBlok}</div>
   <div class="kd-hub-vitrin__sutun">${besinBlok}</div>
  </div>
 </div>
</section>`;

  /* ---------------- Diğer bölümler ---------------- */
  const evreler = `<section class="kd-bolum kd-zebra" data-renk="mavi" id="evreler">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Dönemler', ikonAd: 'takvim', renk: 'mavi', baslik: 'Beş dönem, her biri kendi renginde', alt: 'Hamilelikten 3 yaşa: hangi dönemde ne yenir, kıvam nasıl olur, hangi besinler öne çıkar?', sag: '<a class="kd-btn kd-btn--hafif kd-btn--kucuk" href="kids-donemler.html">Tüm dönemler <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' })}
  <div class="kd-izgara kd-hub-evreler">${EVRE_SIRA.map((k) => o.evreKart(k)).join('\n')}${o.ctaKart({ href: 'kids-donemler.html', ikonAd: 'takvim', gorsel: 'bolum/donemler', baslik: 'Dönemleri karşılaştırın', metin: 'Süt, ek gıda ve kıvam dengesini beş dönem boyunca yan yana görün.', etiket: 'Tüm dönemler', renk: 'mavi', sinif: 'kd-evre-cta' })}</div>
 </div>
</section>`;

  const moduller = `<section class="kd-bolum" id="moduller">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Modüller', ikonAd: 'liste', renk: 'mint', baslik: 'Altı modül, tek mutfak', alt: 'Her biri açık ve dolu; dilediğinizden başlayın.' })}
  <div class="kd-izgara kd-hizali kd-hizali--4 kd-hub-moduller">${o.MODULLER.filter((m) => m.kod !== 'kids').map((m) => o.modulKart(m)).join('\n')}</div>
 </div>
</section>`;

  // Bu ay tezgâhta (içerik varsa)
  let mevsimBolum = '';
  const aylar = veri.mevsim.aylar || [];
  if (aylar.length) {
    const panel = aylar.map((a) => `<div class="kd-hub-ay" data-ay="${a.ay}"${a.ay === 1 ? '' : ' hidden'}>
   <div class="kd-hub-ay__kahraman kd-ikonlu" data-renk="sari"><span class="kd-ikonlu__ikon">${o.urun(a.kahraman.ikon, 64, a.kahraman.ad)}</span><h3 class="kd-ikonlu__baslik">${esc(a.kahraman.ad)}</h3><span class="kd-ikonlu__rozet kd-ust-yazi" data-renk="sari">${esc(a.ad)} · Ayın kahramanı</span><p class="kd-ikonlu__metin">${esc(a.kahraman.neden)}</p></div>
   <div class="kd-hub-ay__urunler">${a.urunler.slice(0, 8).map((u) => `<span class="kd-hub-urun">${o.urun(u.ikon, 44, '')}<small>${esc(u.ad)}</small></span>`).join('')}</div>
  </div>`).join('\n');
    mevsimBolum = `<section class="kd-bolum kd-zebra" data-renk="sari" id="mevsim">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Mevsim Takvimi', ikonAd: 'sepet', renk: 'sari', baslik: 'Bu ay tezgâhta neler var?', alt: 'Mevsiminde ürün daha lezzetli ve ekonomik; Türkiye geneli için örnek bir tezgâh.', sag: '<a class="kd-btn kd-btn--hafif kd-btn--kucuk" href="kids-mevsim.html">Mevsim Takvimi <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' })}
  <div class="kd-hub-mevsim kd-gir" data-kd-bu-ay>${panel}</div>
 </div>
</section>`;
  }

  // Rehber (içerik varsa): kapaklar gerçekçi fotoğraf (1400×791)
  let rehberBolum = '';
  const rehber = Array.isArray(veri.rehber) ? veri.rehber : [];
  const YEDEK_KAPAK = {};   // foto turu: her makalenin kendi kapağı var (veri/rehber.json)
  if (rehber.length) {
    rehberBolum = `<section class="kd-bolum" id="rehber">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Rehber', ikonAd: 'kitap', renk: 'pembe', baslik: 'Merak ettikleriniz, sade bir dille', sag: '<a class="kd-btn kd-btn--hafif kd-btn--kucuk" href="kids-rehber.html">Tüm rehber <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' })}
  <div class="kd-izgara kd-dortlu kd-hizali kd-hizali--4">${rehber.slice(0, 4).map((r, i) => {
    const kapak = r.kapak || YEDEK_KAPAK[r.slug];
    return `<a class="kd-kart kd-gir kd-hub-makale" href="kids-rehber-${r.slug}.html" data-renk="${['seftali', 'mint', 'pembe', 'mavi'][i % 4]}">
   <div class="kd-hub-makale__kapak">${kapak ? o.foto(kapak, r.kapakAlt || `${r.baslik} — kapak fotoğrafı`, { gen: 1400, yuk: 791 }) : o.ikon('kitap', 48)}</div>
   <div class="kd-kart__govde"><h3>${esc(r.baslik)}</h3><p>${esc(r.ozet)}</p><span class="kd-kart__alt"><span class="kd-ikincil">${r.okumaDk ? r.okumaDk + ' dk okuma' : ''}</span><span>Oku <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></span></div>
  </a>`;
  }).join('\n')}</div>
 </div>
</section>`;
  }

  const guven = `<section class="kd-bolum kd-zebra" data-renk="mint" id="guven">
 <div class="wrap"><div class="kd-hub-guven">
  <div>
   ${o.ustYazi('Güven merkezi', { ikonAd: 'kalkan', renk: 'mint' })}
   <h2>Bu içerikler nasıl hazırlanıyor?</h2>
   <p>Dada Gastro Kids'teki her yaş, kıvam ve alerjen bilgisi tek bir besin tablosundan beslenir; aynı kural tarif kartında, dönem sayfasında ve araçlarda aynı sonucu verir.</p>
  </div>
  <div class="kd-hub-guven__yan">
   ${o.guvenRozeti({ sinif: 'kd-hub-guven__rozet' })}
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
    baslik: 'Dada Gastro Kids — Hamilelikten 3 Yaşa Beslenme | Dada Gastro',
    aciklama: 'Dada Gastro Kids: hamilelikten 3 yaşa, bebeğinizin dönemine göre tarifler, güvenli kesim, Mevsim Takvimi, rehber ve pratik araçlar.',
    aktif: 'kids',
    css: ['hub', 'dogum-secici'],
    js: ['hub', 'dogum-secici'],
    main: o.sayfa([ustBolum, vitrin, evreler, moduller, mevsimBolum, rehberBolum, guven].join('\n'), 'kids'),
  }];
}
