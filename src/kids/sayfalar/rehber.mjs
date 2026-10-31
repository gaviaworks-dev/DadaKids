// Dada Kids — Rehber: hub + makale sayfaları (sahibi: sayfalar kolu)
// Veri: veri/rehber.json [{slug, baslik, ozet, okumaDk, kapak, ikon, evreler[], bolumler:[{baslik,paragraflar[],maddeler[]}],
//        kutu:{tur,baslik,metin}, karsilastirmaSutunlar?:{anahtar:baslik}, karsilastirma?:[{ozellik,...}], ilgiliTarifler[], kaynaklar:[{ad,url}]}]
// İlk yardım adımı yazılmaz: yalnız "acil durumda 112" ve resmi kurs bağlantısı.

const RENK = { 'ek-gidaya-gecis': 'seftali', 'blw-temelleri': 'mint', 'ogurme-mi-bogulma-mi': 'pembe', 'alerjen-tanitimi': 'mavi' };
const DONGU = ['seftali', 'mint', 'pembe', 'mavi', 'sari'];
const SUTUN_AD = { ogurme: 'Öğürme', bogulma: 'Boğulma', kasik: 'Kaşıkla beslenme', blw: 'BLW' };
const KIZILAY = 'https://www.kizilay.org.tr/';
const dizi = (x) => (Array.isArray(x) ? x.filter(Boolean) : x ? [x] : []);
const ILLUS = { 'ek-gidaya-gecis': 'rehber-ek-gida', 'blw-temelleri': 'rehber-blw', 'ogurme-mi-bogulma-mi': 'rehber-ogurme', 'alerjen-tanitimi': 'rehber-alerjen' };
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


export default async function rehber(o) {
  const { esc, ikon, EVRE, EVRE_SIRA } = o;
  const ipucu = (poz, html, sinif = '') => `<div class="kd-rehberci kd-ipucu kd-gir ${sinif}">${o.maskot(poz, { boy: 104 }) || `<span class="kd-ipucu__yedek" aria-hidden="true">${ikon('parilti', 40)}</span>`}<p class="kd-baloncuk">${html}</p></div>`;
  const illusAnahtar = (m) => (ILLUS[m.slug] && illusVar(ILLUS[m.slug]) ? ILLUS[m.slug] : '');
  const makaleler = (Array.isArray(o.veri.rehber) ? o.veri.rehber : []).filter((m) => m && m.slug && m.baslik);
  const tarifHarita = new Map((o.veri.tarifler.tarifler || []).map((t) => [t.slug, t]));
  const renk = (m, i) => RENK[m.slug] || DONGU[i % DONGU.length];
  const href = (m) => `kids-rehber-${m.slug}.html`;
  const alanAdi = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

  const evreChip = (kod, a = true) => (EVRE[kod] ? `<${a ? `a href="${o.evreSayfasi(kod)}"` : 'span'} class="kd-chip kd-rchip" data-renk="${EVRE[kod].renk}">${ikon(EVRE[kod].ikon, 18)}${esc(EVRE[kod].ad)}</${a ? 'a' : 'span'}>` : '');
  const okuma = (m) => (m.okumaDk ? `<span class="kd-rokuma"><i class="fa-regular fa-clock" aria-hidden="true"></i>${m.okumaDk} dk okuma</span>` : '');
  const kapakSvg = (m, i, boy = 140) => `<div class="kd-rkapak-svg" data-renk="${renk(m, i)}">${o.sahne('tabak-parmak-gida', '')}<span class="kd-rkapak-svg__ikon">${ikon(m.ikon || 'kitap', boy * 0.45)}</span></div>`;
  const kapak = (m, i, opt = {}) => (illusAnahtar(m) ? o.illus(illusAnahtar(m), opt.alt ?? m.baslik, { boy: 640 }) : m.kapak ? o.foto(m.kapak, m.baslik, { gen: 1200, yuk: 900, ...opt }) : kapakSvg(m, i));

  const kaynakOge = (k) => `<li><a href="${esc(k.url)}" target="_blank" rel="noopener"${/\.tr$/.test(alanAdi(k.url)) ? '' : ' hreflang="en"'}><span>${esc(k.ad)}</span><small>${esc(alanAdi(k.url))} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></small></a></li>`;
  const kaynakListesi = (liste, ilk = 0) => (ilk && liste.length > ilk + 2
    ? `<ol class="kd-rkaynak">${liste.slice(0, ilk).map(kaynakOge).join('')}</ol><details class="kd-rkaynak-daha"><summary>Tüm kaynaklar (${liste.length}) <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary><ol class="kd-rkaynak" start="${ilk + 1}">${liste.slice(ilk).map(kaynakOge).join('')}</ol></details>`
    : `<ol class="kd-rkaynak">${liste.map(kaynakOge).join('')}</ol>`);

  /* =====================================================================
     Hub
     ===================================================================== */
  const dkler = makaleler.map((m) => m.okumaDk).filter(Boolean);
  const okumaAralik = dkler.length ? (Math.min(...dkler) === Math.max(...dkler) ? `${dkler[0]}` : `${Math.min(...dkler)}–${Math.max(...dkler)}`) : '';
  const evreSayi = Object.fromEntries(EVRE_SIRA.map((k) => [k, makaleler.filter((m) => dizi(m.evreler).includes(k)).length]));
  const hubKart = (m, i) => `<a class="kd-kart kd-rkart kd-gir" href="${href(m)}" data-renk="${renk(m, i)}" data-evreler="${dizi(m.evreler).join(' ')}" style="--kd-gecikme:${i * 70}ms">
   <div class="kd-rkart__medya">${kapak(m, i, { alt: '' })}<span class="kd-rkart__ikon">${ikon(m.ikon || 'kitap', 30)}</span></div>
   <div class="kd-kart__govde">
    <div class="kd-rkart__evre">${dizi(m.evreler).map((k) => evreChip(k, false)).join('')}</div>
    <h3>${esc(m.baslik)}</h3>
    <p>${esc(m.ozet || '')}</p>
    <span class="kd-kart__alt">${okuma(m)}<span class="kd-rkart__oku">Okuyun <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></span>
   </div>
  </a>`;

  const tumKaynaklar = [];
  const gorulen = new Set();
  for (const m of makaleler) for (const k of dizi(m.kaynaklar)) if (k.url && !gorulen.has(k.url)) { gorulen.add(k.url); tumKaynaklar.push(k); }

  const fan = makaleler.filter((m) => m.kapak).slice(0, 3);
  const hubSag = fan.length
    ? `<div class="kd-rfan">${fan.map((m, i) => `<a href="${href(m)}" class="kd-rfan__oge kd-rfan__oge--${i + 1}" data-renk="${renk(m, makaleler.indexOf(m))}">${o.foto(m.kapak, m.baslik, { gen: 800, yuk: 600, oncelik: i === 0 })}<span>${esc(m.baslik.split(/[:(]/)[0].trim())}</span></a>`).join('')}<span class="kd-rfan__sus kd-yuz">${ikon('kitap', 56)}</span></div>`
    : '';

  const hub = {
    dosya: 'kids-rehber.html',
    baslik: 'Rehber: ek gıda, BLW, öğürme ve alerjenler | Dada Kids',
    aciklama: 'Ek gıdaya geçiş, BLW temelleri, öğürme ile boğulma farkı ve alerjen tanıtımı: ana akım rehberlere dayanan, kaynaklı ve sade anlatım.',
    aktif: 'rehber',
    css: ['rehber'],
    js: ['rehber'],
    main: o.sayfa(`
${o.hero({
  renk: 'pembe',
  kirinti: [['Tarifler', 'tarifler.html'], ['Dada Kids', 'kids.html'], ['Rehber']],
  ust: { metin: 'Rehber', ikon: 'kitap' },
  baslik: 'Sakin, kaynaklı,<br>adım adım',
  giris: 'İlk kaşıktan alerjen tanışmasına kadar en çok merak edilen konular. Her makale DSÖ, NHS, AAP gibi ana akım rehberlerin uzlaştığı bilgilere dayanır ve kaynaklarını sonunda listeler.',
  eylemler: `<a class="kd-btn" href="#makaleler">${ikon('kitap', 20)} Makaleler</a><a class="kd-btn kd-btn--hafif" href="#ilkeler">Editoryal ilkelerimiz</a>`,
  sag: illusVar('hero-rehber') ? `<div class="kd-hero__gorsel kd-rhero-illus">${o.illus('hero-rehber', 'Kitap okuyan bir ebeveyn ve bebeğin sakin, sevimli illüstrasyonu', { boy: 640 })}</div>` : hubSag,
})}
${ritim(o, [(z) => `<section class="kd-bolum${z}" id="makaleler" aria-labelledby="mak-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: `${makaleler.length} makale`, ikonAd: 'kitap', renk: 'pembe', baslik: '<span id="mak-bas">Konuya göre okuyun</span>', alt: 'Evrenizi seçin; size uygun makaleler öne çıksın.', sag: ipucu('kitap', `<b>Pütür'ün notu:</b> ${okumaAralik ? `Her makale ${okumaAralik} dakikalık. ` : ''}Sonunda kaynakları ve ilgili tarifleri bulacaksınız.`, 'kd-ipucu--sag') })}
  <div class="kd-serit kd-rsuz" role="group" aria-label="Evreye göre süz">
   <button type="button" class="kd-chip" data-evre="" aria-pressed="true">Tümü <span class="kd-rsuz__sayi">${makaleler.length}</span></button>
   ${EVRE_SIRA.filter((k) => evreSayi[k]).map((k) => `<button type="button" class="kd-chip" data-evre="${k}" data-renk="${EVRE[k].renk}" aria-pressed="false">${ikon(EVRE[k].ikon, 18)}${esc(EVRE[k].ad)} <span class="kd-rsuz__sayi">${evreSayi[k]}</span></button>`).join('')}
  </div>
  <p class="kd-gizli" role="status" aria-live="polite" id="rehber-durum"></p>
  <div class="kd-rizgara kd-hizali kd-hizali--5">${makaleler.map(hubKart).join('')}</div>
 </div>
</section>`, (z) => `<section class="kd-bolum${z}" id="ilkeler" aria-labelledby="ilke-bas">
 <div class="wrap kd-rguven">
  <div>
   ${o.bolumBasi({ ust: 'Güven', ikonAd: 'kalp', renk: 'mint', baslik: '<span id="ilke-bas">Editoryal ilkelerimiz</span>' })}
   <ul class="kd-rilke">
    <li><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i><span><b>Yalnız uzlaşılan bilgi.</b> DSÖ, NHS, AAP, ASCIA ve T.C. Sağlık Bakanlığı'nın ortak noktaları yazılır; tartışmalı değerler "uzman kararı" olarak işaretlenir.</span></li>
    <li><i class="fa-solid fa-circle-question" aria-hidden="true"></i><span><b>Gerekçesiz yasak yok.</b> Her kuralın bir satırlık nedeni ve "yerine ne yapılır" önerisi vardır.</span></li>
    <li><i class="fa-solid fa-kit-medical" aria-hidden="true"></i><span><b>İlk yardım adımı yazmayız.</b> Acil durumda 112; ilk yardımı resmi bir kursta uygulamalı öğrenmenizi öneririz.</span></li>
    <li><i class="fa-solid fa-user-doctor" aria-hidden="true"></i><span><b>Uydurma uzman yok.</b> İnceleme yapılana kadar her sayfada "uzman onayı bekliyor" yazar.</span></li>
   </ul>
   ${ipucu('kalp', '<b>Pütür\'ün notu:</b> Bir konuda içiniz rahat değilse makaleyi çocuk doktorunuzla birlikte okuyun; sorularınızı not almak işinizi kolaylaştırır.')}
   <div class="kd-rguven__muhur">${o.ornek()}${o.onay()}</div>
  </div>
  <aside class="kd-rguven__kaynak" aria-labelledby="kaynak-bas">
   <h3 id="kaynak-bas">${ikon('liste', 22)} Başvurduğumuz kaynaklar</h3>
   ${kaynakListesi(tumKaynaklar, 8)}
  </aside>
 </div>
</section>`], ['pembe', 'mint'])}
`, 'rehber'),
  };

  /* =====================================================================
     Makale sayfaları
     ===================================================================== */
  function karsilastirmaTablosu(m, r) {
    const satir = dizi(m.karsilastirma).filter((x) => x && x.ozellik);
    if (!satir.length) return { html: '', baslik: '' };
    let sut = m.karsilastirmaSutunlar;
    let anahtarlar;
    if (Array.isArray(sut)) { anahtarlar = sut.map((s) => (typeof s === 'string' ? s : s.anahtar)); sut = Object.fromEntries(dizi(m.karsilastirmaSutunlar).map((s) => (typeof s === 'string' ? [s, SUTUN_AD[s] || s] : [s.anahtar, s.baslik]))); }
    else { sut = sut || {}; anahtarlar = Object.keys(sut).length ? Object.keys(sut) : Object.keys(satir[0]).filter((k) => k !== 'ozellik'); }
    const ad = (k) => sut[k] || SUTUN_AD[k] || k;
    const tehlikeli = anahtarlar.includes('bogulma');
    const baslik = `${ad(anahtarlar[0])} mi, ${ad(anahtarlar[1]).toLocaleLowerCase('tr')} mu?`;
    const html = `<section class="kd-rbolum kd-rkars" id="karsilastirma" aria-labelledby="kars-bas">
     <h2 id="kars-bas" class="kd-rbas">${o.ikon('liste', 32)}<span>Bir bakışta: ${esc(ad(anahtarlar[0]))} ve ${esc(ad(anahtarlar[1]).toLocaleLowerCase('tr'))}</span></h2>
     <div class="kd-rtablo-kap">
      <table class="kd-rtablo${tehlikeli ? ' kd-rtablo--bogulma' : ''}" data-renk="${r}">
       <caption class="kd-gizli">${esc(baslik)} karşılaştırma tablosu</caption>
       <thead><tr><th scope="col"><span class="kd-gizli">Özellik</span></th>${anahtarlar.map((k, i) => `<th scope="col" data-sutun="${esc(k)}"${tehlikeli ? ` data-durum="${i === 0 ? 'olagan' : 'acil'}"` : ''}>${tehlikeli ? `<i class="fa-solid ${i === 0 ? 'fa-face-grimace' : 'fa-triangle-exclamation'}" aria-hidden="true"></i>` : ''}${esc(ad(k))}</th>`).join('')}</tr></thead>
       <tbody>${satir.map((s) => `<tr><th scope="row">${esc(s.ozellik)}</th>${anahtarlar.map((k, i) => `<td data-baslik="${esc(ad(k))}"${tehlikeli ? ` data-durum="${i === 0 ? 'olagan' : 'acil'}"` : ''}>${esc(s[k] || '—')}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
     </div>
     ${tehlikeli ? (() => {
       const k = m.kutu && /112/.test(m.kutu.metin || '') ? m.kutu : null; // makalenin 112 kutusu varsa onu kullan (tekrar yok)
       return `<div class="kd-racil" role="note"><span class="kd-racil__112" aria-hidden="true">112</span><p><b>${esc(k?.baslik ? k.baslik + '.' : 'Boğulma acil durumdur: vakit kaybetmeden 112\'yi arayın.')}</b> ${esc(k?.metin || 'Bebek ve çocuk ilk yardımını önceden, uygulamalı bir kursta öğrenin.')} <a class="kd-bag" href="${KIZILAY}" target="_blank" rel="noopener">Türk Kızılay ilk yardım eğitimleri</a></p></div>`;
     })() : ''}
    </section>`;
    return { html, baslik: `Bir bakışta: ${ad(anahtarlar[0])} ve ${ad(anahtarlar[1]).toLocaleLowerCase('tr')}` };
  }

  function makale(m, i) {
    const r = renk(m, i);
    const bolumler = dizi(m.bolumler).filter((b) => b && b.baslik);
    const kars = karsilastirmaTablosu(m, r);
    const karsSonra = Math.min(1, bolumler.length - 1); // 2. bölümden sonra
    const kutuSonra = bolumler.length > 3 ? Math.floor(bolumler.length / 2) : bolumler.length - 1;
    const kutuTablodaMi = dizi(m.karsilastirma).length && Object.keys(m.karsilastirmaSutunlar || {}).includes('bogulma') && /112/.test(m.kutu?.metin || '');
    const kutu = m.kutu && m.kutu.metin && !kutuTablodaMi
      ? `<aside class="kd-kutu kd-rkutu${m.kutu.tur === 'uyari' ? ' kd-kutu--uyari' : ''}"${m.kutu.tur === 'uyari' ? '' : ` data-renk="${r}"`}><h3>${m.kutu.tur === 'uyari' ? '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' : o.maskot('kitap', { boy: 72 }) || '<i class="fa-solid fa-lightbulb" aria-hidden="true"></i>'}${esc(m.kutu.baslik || (m.kutu.tur === 'uyari' ? 'Dikkat' : 'İpucu'))}</h3><p>${esc(m.kutu.metin)}</p></aside>`
      : '';

    const icindekiler = [];
    const govde = bolumler.map((b, n) => {
      const id = `b-${n + 1}`;
      icindekiler.push([id, b.baslik]);
      let h = `<section class="kd-rbolum" id="${id}" aria-labelledby="${id}-bas">
      <h2 id="${id}-bas" class="kd-rbas">${o.ikon(['kasik', 'kase', 'tabak-bolmeli', 'kalp', 'parilti', 'liste', 'kitap'][n % 7], 32)}<span>${esc(b.baslik)}</span></h2>
      ${dizi(b.paragraflar).map((p) => `<p>${esc(p)}</p>`).join('')}
      ${dizi(b.maddeler).length ? `<ul class="kd-rmadde">${dizi(b.maddeler).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
     </section>`;
      if (kars.html && n === karsSonra) { h += kars.html; icindekiler.push(['karsilastirma', kars.baslik]); }
      if (kutu && n === kutuSonra) h += kutu;
      return h;
    }).join('\n');
    if (dizi(m.kaynaklar).length) icindekiler.push(['kaynaklar', 'Kaynaklar']);

    const ilgiliHam = dizi(m.ilgiliTarifler).map((s) => tarifHarita.get(s)).filter((t) => t && t.ad);
    // şerit her zaman 4 kart: seçilen tariflere en yakın tariflerle tamamlanır (yaş rozeti kartta görünür)
    const ilgili = ilgiliHam.length ? [...ilgiliHam, ...o.benzerTarifler(ilgiliHam[ilgiliHam.length - 1], [...tarifHarita.values()], 8).filter((t) => !ilgiliHam.includes(t))].slice(0, 4) : [];
    const sonraki = makaleler[(i + 1) % makaleler.length];
    const toc = `<ol>${icindekiler.map(([id, ad]) => `<li><a href="#${id}">${esc(ad)}</a></li>`).join('')}</ol>`;

    return {
      dosya: href(m),
      baslik: `${m.baslik} | Dada Kids Rehber`,
      aciklama: m.ozet || m.baslik,
      aktif: 'rehber',
      css: ['rehber'],
      js: ['rehber'],
      main: o.sayfa(`
${o.hero({
  renk: r,
  kucuk: true,
  kirinti: [['Dada Kids', 'kids.html'], ['Rehber', 'kids-rehber.html'], [m.baslik]],
  ust: { metin: 'Rehber', ikon: m.ikon || 'kitap' },
  baslik: esc(m.baslik),
  giris: esc(m.ozet || ''),
  ek: `<div class="kd-rmeta">${okuma(m)}${dizi(m.evreler).map((k) => evreChip(k)).join('')}</div>`,
  sag: illusAnahtar(m) ? `<div class="kd-hero__gorsel kd-rhero-illus">${o.illus(illusAnahtar(m), m.slug === 'ogurme-mi-bogulma-mi' ? 'Mama sandalyesinde sakin sakin yemek yiyen bebek ve yanında oturan ebeveyn' : `${m.baslik} konusunu anlatan sevimli illüstrasyon`, { boy: 640 })}</div>` : m.kapak ? `<div class="kd-hero__gorsel">${o.foto(m.kapak, m.baslik, { gen: 1200, yuk: 900, oncelik: true })}</div>` : `<div class="kd-rhero-svg">${kapakSvg(m, i, 180)}</div>`,
})}
${ritim(o, [(z) => `<div class="kd-bolum kd-rduzen-kap${z}">
 <div class="wrap kd-rduzen">
  <nav class="kd-rtoc" aria-labelledby="toc-bas">
   <details class="kd-rtoc__kutu" open>
    <summary id="toc-bas"><span>${ikon('liste', 20)} Bu sayfada</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary>
    ${toc}
   </details>
   <div class="kd-rtoc__onay">${o.onay()}</div>
  </nav>
  <article class="kd-rmakale" data-renk="${r}">
   ${o.ornek()}
   ${ipucu('kitap', `<b>Pütür bu yazıda size eşlik ediyor.</b> ${bolumler.length} bölüm${m.okumaDk ? `, yaklaşık ${m.okumaDk} dakika` : ''}. Acele etmeyin; soldaki listeden istediğiniz bölüme atlayabilirsiniz.`, 'kd-rgiris-ipucu kd-ipucu--kompakt')}
   ${govde}
   ${dizi(m.kaynaklar).length ? `<section class="kd-rbolum kd-rkaynaklar" id="kaynaklar" aria-labelledby="kaynaklar-bas"><h2 id="kaynaklar-bas" class="kd-rbas">${o.ikon('kitap', 32)}<span>Kaynaklar</span></h2><p class="kd-ikincil">Metin bu kaynakların uzlaştığı genel ilkeleri kendi sözlerimizle özetler; kaynak metinleri kopyalanmamıştır.</p>${kaynakListesi(dizi(m.kaynaklar))}</section>` : ''}
   <div class="kd-rsonu">${o.onay()}<p class="kd-ikincil">Bebeğinize özel bir durum varsa (erken doğum, alerji öyküsü, kronik hastalık) çocuk doktorunuza danışın.</p></div>
  </article>
 </div>
</div>`, (z) => (ilgili.length ? `<section class="kd-bolum${z}" aria-labelledby="ilgili-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Mutfağa geçin', ikonAd: 'kase', renk: r, baslik: '<span id="ilgili-bas">Bu konuyla ilgili tarifler</span>', sag: '<a class="kd-btn kd-btn--hafif" href="kids-tarifler.html">Tüm tarifler <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' })}
  ${o.tarifSeridi(ilgili, { sinif: 'kd-rilgili' })}
 </div>
</section>` : ''), (z) => (sonraki && sonraki !== m ? `<section class="kd-bolum${z}" aria-label="Sıradaki makale">
 <div class="wrap">
  <a class="kd-rsonraki kd-gir" href="${href(sonraki)}" data-renk="${renk(sonraki, makaleler.indexOf(sonraki))}">
   <div class="kd-rsonraki__medya">${kapak(sonraki, makaleler.indexOf(sonraki), { alt: '' })}</div>
   <div class="kd-rsonraki__metin"><small>Sıradaki makale</small><b>${esc(sonraki.baslik)}</b><p>${esc(sonraki.ozet || '')}</p><span class="kd-rsonraki__git">Okumaya devam <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></div>
  </a>
 </div>
</section>` : '')], [r], { zebraIle: false })}
`, 'rehber'),
    };
  }

  return [hub, ...makaleler.map(makale)];
}
