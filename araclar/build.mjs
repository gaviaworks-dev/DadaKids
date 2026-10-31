// Derleme: src/donor/*.html (canlı Gastro'nun birebir kopyası) + Kids içerikleri → kökte tam statik HTML.
// İlke: donör sayfa olduğu gibi alınır; yalnız <main> içeriği, <title>/description ve tanımlı ekleme
// noktaları değişir. Kabuk (header, mega menü, çekmece, alt çubuk, footer) donörden gelir.
//
// Kullanım: node araclar/build.mjs
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const oku = (p) => readFile(path.join(KOK, p), 'utf8');
const json = async (p) => JSON.parse(await oku(p));

const KATALOG = await json('veri/tarifler.json');
const EVRELER = await json('veri/evreler.json');
const SURUM = Date.now().toString(36);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ------------------------------------------------------------------ */
/* Ortak parçalar                                                      */
/* ------------------------------------------------------------------ */
const KIVAM_SVG = {
  pure: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M6 8.5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 2.2-1.2 3 0"/></svg>',
  ezilmis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11h18a9 9 0 0 1-18 0z"/><circle cx="7.5" cy="8.3" r="1.5"/><circle cx="12" cy="7.4" r="1.8"/><circle cx="16.4" cy="8.5" r="1.3"/></svg>',
  parmak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9.2" y="2.5" width="5.6" height="15" rx="2.8" transform="rotate(28 12 10)"/><path d="M5 21h14"/></svg>',
};
const kivam = (k, rozet = false) => `<span class="kd-kivam${rozet ? ' kd-kivam--rozet' : ''}">${KIVAM_SVG[k]}<span>${esc(KATALOG.kivamlar[k])}</span></span>`;
const yasEtiket = (ay) => KATALOG.kovalar.find((k) => k.ay === ay).etiket;
const yasRozet = (ay, boy = 'md', uzun = false) =>
  `<span class="kd-yas kd-yas--${ay} kd-yas--${boy}">${esc(yasEtiket(ay))}${uzun ? ' için uygundur' : ''}</span>`;

function alerjenPilleri(t, en = 3) {
  const p = [];
  for (const a of t.icerir) p.push(`<span class="kd-alerjen kd-alerjen--icerir"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> İçerir: ${esc(KATALOG.alerjenler[a])}</span>`);
  const serbest = [['glutensiz', 'Glutensiz'], ['sutsuz', 'Sütsüz'], ['yumurtasiz', 'Yumurtasız']].filter(([k]) => t[k]);
  for (const [, ad] of serbest) p.push(`<span class="kd-alerjen"><i class="fa-solid fa-check" aria-hidden="true"></i> ${ad}</span>`);
  return p.slice(0, en).join('');
}

const ornek = (metin = 'Yaş, kıvam ve alerjen bilgileri prototip için atanmış örneklerdir; çocuk doktoru / diyetisyen onayından geçmeden yayına alınmaz.') =>
  `<p class="kd-ornek" role="note"><i class="fa-solid fa-flask" aria-hidden="true"></i><span><b>Örnek içerik — uzman onayı bekliyor.</b> ${metin}</span></p>`;

const onayRozeti = () => `<div class="kd-onay kd-onay--bekliyor">
  <span class="kd-onay__ikon"><i class="fa-solid fa-user-doctor" aria-hidden="true"></i></span>
  <span class="kd-onay__metin"><b>Uzman onayı bekliyor</b><span>Çocuk doktoru / çocuk diyetisyeni incelemesi henüz yapılmadı.</span></span>
</div>`;

function tarifHref(t) { return t.kidsSayfa || `https://dadagastro.com/tarif/${t.gastroSlug}`; }

function malzAnahtarlari(t) { return [...new Set(t.malzemeler.map((m) => m.anahtar))]; }

function kart(t) {
  const disari = !t.kidsSayfa;
  return `<article class="r-card kd-kart" data-id="${t.id}" data-yas="${t.yas}" data-kivam="${t.kivam}" data-glutensiz="${t.glutensiz ? 1 : 0}" data-sutsuz="${t.sutsuz ? 1 : 0}" data-yumurtasiz="${t.yumurtasiz ? 1 : 0}" data-sure="${t.sureDk}" data-puan="${t.puan ?? ''}" data-malz="${esc(JSON.stringify(malzAnahtarlari(t)))}">
 <div class="r-media-wrap">
  <div class="r-media" style="background-image:url('${t.gorsel}')">
   ${yasRozet(t.yas)}
   <div class="kd-alerjenler">${alerjenPilleri(t, 2)}</div>
  </div>
 </div>
 <div class="r-body">
  <h4><a href="${tarifHref(t)}"${disari ? ' title="Tarif dadagastro.com\'da açılır"' : ''}>${esc(t.ad)}</a></h4>
  <div class="r-facts">
   ${kivam(t.kivam)}
   <span><i class="fa-solid fa-clock" aria-hidden="true"></i> <span class="rf-txt">${t.sureDk} dk</span></span>
  </div>
  <div class="kd-alerjenler kd-alerjenler--govde">${alerjenPilleri(t, 2)}</div>
  <div class="r-foot">
   <button class="kd-kiler-btn" type="button" aria-expanded="false" title="Kilerimdeki malzemelerle eşle (Dada Gastro Sync)"><i class="fa-solid fa-plus" aria-hidden="true"></i> Kilerimle eşle</button>
   <div class="r-stats">${t.puan ? `<span class="r-rate"><i class="fa-solid fa-star" aria-hidden="true"></i> ${t.puan.toFixed(1)}</span>` : ''}</div>
  </div>
  <p class="kd-kiler-sonuc" hidden></p>
 </div>
</article>`;
}

/* ------------------------------------------------------------------ */
/* Kabuk eklemeleri (tüm sayfalar)                                     */
/* ------------------------------------------------------------------ */
const MEGA_KART = `<a class="mega-find kd-mega" href="kids.html"><span class="mf-ico"><i class="fa-solid fa-baby" aria-hidden="true"></i></span><span class="mf-body"><b>Dada Kids</b><small>Yaşa göre bebek tarifleri</small></span><i class="fa-solid fa-arrow-right mf-arr" aria-hidden="true"></i></a>`;
const CEKMECE_BAG = `<a href="kids.html"><i class="fa-solid fa-baby" aria-hidden="true"></i> <span>Dada Kids · Bebek &amp; Çocuk</span></a>`;

function zorunluDegistir(html, eski, yeni, etiket) {
  const sayi = typeof eski === 'string' ? html.split(eski).length - 1 : (html.match(eski) || []).length;
  if (sayi < 1) throw new Error(`Ekleme noktası bulunamadı: ${etiket}`);
  return html.replace(eski, yeni);
}

function kabukEkle(html) {
  html = zorunluDegistir(html, /(<a class="mega-find" href="https:\/\/dadagastro\.com\/dolapta-ne-var">[\s\S]*?<\/a>)/, `$1\n${MEGA_KART}`, 'mega-find');
  html = zorunluDegistir(html, /(<div class="d-sub">\s*<a href="tarifler\.html">[\s\S]*?<\/a>)/, `$1\n ${CEKMECE_BAG}`, 'çekmece Tarifler alt menüsü');
  html = zorunluDegistir(html, '</head>', `<link rel="stylesheet" href="varlik/kids/kids.css?v=${SURUM}">\n</head>`, 'head');
  html = zorunluDegistir(html, /<\/body>(?![\s\S]*<\/body>)/, `<script src="varlik/kids/kids.js?v=${SURUM}" defer></script>\n</body>`, 'body');
  return html;
}

function mainDegistir(html, yeniMain, kalanBetikler = true) {
  const a = html.indexOf('<main'); const ac = html.indexOf('>', a) + 1; const b = html.indexOf('</main>', ac);
  if (a < 0 || b < 0) throw new Error('main yok');
  const eski = html.slice(ac, b);
  const betikler = kalanBetikler ? (eski.match(/<script[^>]*src="[^"]+"[^>]*><\/script>/g) || []).join('\n') : '';
  return html.slice(0, ac) + '\n' + yeniMain + '\n' + betikler + '\n' + html.slice(b);
}

function basliklar(html, baslik, aciklama, govdeSinifi) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(baslik)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(aciklama)}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(baslik)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(aciklama)}">`);
  if (govdeSinifi) html = html.replace(/<body([^>]*) class="([^"]*)"/, `<body$1 class="${govdeSinifi} $2"`);
  return html;
}

const kidsYorumu = (donor, not) => `<!-- Dada Kids prototipi · ${not} · donör: ${donor} · araclar/build.mjs ile üretildi, elle düzenlenmez -->\n`;

/* ------------------------------------------------------------------ */
/* Sayfa: index.html — Gastro ana sayfa + Kids bandı (kapı A)          */
/* ------------------------------------------------------------------ */
function kidsBandi() {
  const evreler = EVRELER.evreler.map((e) => `<a class="chip" href="kids.html?evre=${e.kod}">${esc(e.ad)}</a>`).join('\n   ');
  return `<section class="findbar-sec kd-kidsbar-sec" aria-label="Dada Kids">
 <div class="wrap">
  <div class="findbar px-band kd-kidsbar" data-px-band="1" style="position: relative;"><div class="px-clip" style="--px-x: 50%; --px-y: 50%; --px-r: 16px; --px-shift: 0.0px;"><div class="px-media" style="background-image: url(&quot;varlik/gastro/varliklar/media/1959.webp&quot;);"></div><div class="px-veil" style="background-image: linear-gradient(90deg, rgba(28, 25, 18, 0.92), rgba(33, 30, 22, 0.7));"></div></div>
   <span class="fb-ico"><i class="fa-solid fa-baby" aria-hidden="true"></i></span>
   <div class="fb-text">
    <b>Dada Kids — bebeğiniz kaç aylık?</b>
    <span>Hamilelikten 36. aya; yaşa uygun tarifler, güvenli kesim ve beslenme rehberi.</span>
   </div>
   <div class="fb-chips">
   ${evreler}
   </div>
   <a class="btn btn-primary" href="kids.html">Dada Kids'e Git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
  </div>
 </div>
</section>`;
}

async function indexSayfasi() {
  let html = await oku('src/donor/ana.html');
  html = zorunluDegistir(html, /(<section class="findbar-sec">[\s\S]*?<\/section>)/, `$1\n${kidsBandi()}`, 'findbar-sec');
  return kidsYorumu('https://dadagastro.com/', 'yalnız Kids bandı eklendi (§1.3 kapı A)') + kabukEkle(html);
}

/* ------------------------------------------------------------------ */
/* Sayfa: tarifler.html — Gastro tarif listesi + Kids chip'i (kapı B)  */
/* ------------------------------------------------------------------ */
async function tariflerSayfasi() {
  let html = await oku('src/donor/tarifler.html');
  html = zorunluDegistir(html, /(<span class="lbl">Popüler:<\/span>)/, `$1\n <a class="chip kd-chip" href="kids.html"><i class="fa-solid fa-baby" aria-hidden="true"></i>Dada Kids</a>`, 'lh-chips');
  html = zorunluDegistir(html, /(<div class="subcat-track[^>]*>\s*<a class="subcat\s+active[\s\S]*?<\/a>)/,
    `$1\n <a class="subcat kd-subcat" href="kids__tarifler.html">\n <span class="sc-ico" style="background-image:url('varlik/gastro/varliklar/media/1404/thumb.webp')"></span>\n <span><b>Bebek &amp; Çocuk</b><span>Dada Kids</span></span>\n </a>`, 'subcat-track');
  return kidsYorumu('https://dadagastro.com/tarifler', 'yalnız Dada Kids chip\'i ve alt kategori kalemi eklendi (§1.3 kapı B)') + kabukEkle(html);
}

/* ------------------------------------------------------------------ */
/* Sayfa: kids.html — Hub (donör: Mutfağa Giriş)                       */
/* ------------------------------------------------------------------ */
function hubMain() {
  const ev = EVRELER.evreler;
  const evreSecim = ev.map((e) => `<label><input type="radio" name="evre" value="${e.kod}"><span>${esc(e.ad)}</span></label>`).join('');
  const evreKartlari = ev.map((e) => `<article class="kd-evre" data-evre="${e.kod}" aria-current="false">
   <div class="kd-evre__ust"><span class="kd-evre__ikon kd-ikon-zemin"><i class="fa-solid ${e.ikon}" aria-hidden="true"></i></span><div><span class="kd-evre__aralik">${esc(e.aralik)}</span><h3>${esc(e.ad)}</h3></div></div>
   <ul>
    <li><i class="fa-solid fa-droplet" aria-hidden="true"></i><span><b>Beslenme</b>${esc(e.beslenme)}</span></li>
    <li><i class="fa-solid fa-bowl-food" aria-hidden="true"></i><span><b>Kıvam &amp; dikkat</b>${esc(e.kivam)}</span></li>
    <li><i class="fa-solid fa-bullseye" aria-hidden="true"></i><span><b>Odak</b>${esc(e.odak)}</span></li>
   </ul>
   <span class="kd-evre__sen"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Sizin evreniz</span>
  </article>`).join('\n  ');
  const kartlar = KATALOG.tarifler.map((t, i) => kart(t).replace('<article class="r-card kd-kart"', `<article class="r-card kd-kart"${i >= 4 ? ' hidden' : ''}`)).join('\n');
  const moduller = [
    { ad: 'Yaşa Göre Tarifler', ac: 'Zorunlu yaş filtresi, kıvam ve alerjen etiketleriyle tarif kataloğu.', ikon: 'fa-bowl-food', href: 'kids__tarifler.html', meta: `${KATALOG.tarifler.length} örnek tarif` },
    { ad: 'Dönemler', ac: 'Hamilelikten 36. aya 5 evre: sindirim, kıvam ve serbest–riskli besinler.', ikon: 'fa-timeline', dalga: 'Dalga 3' },
    { ad: 'Güvenli Kesim', ac: 'Besin bazında 3 kademeli kesim şeması ve boğulma uyarı paneli.', ikon: 'fa-scissors', dalga: 'Dalga 2' },
    { ad: 'Mevsimsel Takvim', ac: 'Ay kadranı, mevsim tezgâhı ve ayın kahramanı.', ikon: 'fa-calendar-days', dalga: 'Dalga 3' },
    { ad: 'Rehber & Uzman', ac: '1 yaş öncesi riskli besinler, BLW temelleri, öğürme ve boğulma farkı.', ikon: 'fa-book-medical', dalga: 'Dalga 4' },
    { ad: 'Araçlar', ac: 'Bu besin verilir mi?, 3 günlük gözlem ve DSÖ persentil hesaplayıcı.', ikon: 'fa-screwdriver-wrench', dalga: 'Dalga 2 · 4' },
  ].map((m) => m.href
    ? `<a class="topic-card" href="${m.href}">
   <span class="kd-topic-ikon kd-ikon-zemin"><i class="fa-solid ${m.ikon}" aria-hidden="true"></i></span>
   <h3>${m.ad}</h3>
   <p>${m.ac}</p>
   <div class="disc-meta"><span><i class="fa-solid fa-utensils" aria-hidden="true"></i> ${m.meta}</span></div>
   <span class="topic-go">Sayfayı aç <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
  </a>`
    : `<div class="topic-card kd-yakinda" aria-disabled="true">
   <span class="kd-topic-ikon kd-ikon-zemin"><i class="fa-solid ${m.ikon}" aria-hidden="true"></i></span>
   <h3>${m.ad}</h3>
   <p>${m.ac}</p>
   <span class="kd-etiket"><i class="fa-solid fa-hourglass-half" aria-hidden="true"></i> Prototipte ${m.dalga}</span>
  </div>`).join('\n  ');

  return `<section class="below-header lst-top px-band kd-hero" style="background-image:linear-gradient(90deg,rgba(28,25,18,.93),rgba(33,30,22,.6)),url('varlik/gastro/varliklar/media/1404.webp')" data-px-band="1" data-hero-band=""><div class="px-clip" style="--px-x: 50%; --px-y: 50%; --px-r: 0px; --px-shift: 0.0px;"><div class="px-media" style="background-image: url(&quot;varlik/gastro/varliklar/media/1404.webp&quot;);"></div><div class="px-veil" style="background-image: linear-gradient(90deg, rgba(28, 25, 18, 0.93), rgba(33, 30, 22, 0.6));"></div></div>
 <span class="kd-tema-katman" aria-hidden="true"></span>
 <div class="wrap">
  <nav class="rd-crumb" aria-label="Sayfa yolu">
   <a href="index.html"><i class="fa-solid fa-house" aria-hidden="true"></i></a>
   <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
   <a href="tarifler.html">Tarifler</a>
   <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
   <b>Dada Kids</b>
  </nav>
  <div class="lst-hero">
   <div class="lh-main">
    <span class="eyebrow"><i class="fa-solid fa-baby" aria-hidden="true"></i> Dada Kids</span>
    <h1>Hamilelikten 36. aya, yaşına göre beslenme</h1>
    <p class="lead">Yaşa uygun tarifler, güvenli kesim, mevsim tezgâhı ve uzman onaylı rehberler — Dada Gastro'nun mutfağında, bebeğinizin evresine göre.</p>
    <div class="hero-ctas">
     <a class="btn btn-primary" href="kids__tarifler.html"><i class="fa-solid fa-bowl-food" aria-hidden="true"></i> Yaşa Göre Tarifler</a>
     <a class="btn btn-ghost" href="#evreler"><i class="fa-solid fa-timeline" aria-hidden="true"></i> Evreleri Keşfet</a>
    </div>
   </div>
   <div class="kd-profil" id="kdProfil" aria-live="polite">
    <form class="kd-profil__form" novalidate>
     <h2>Bebeğiniz kaç aylık?</h2>
     <p class="kd-profil__alt">Seçiminize göre tarifler ve öneriler süzülür.</p>
     <fieldset>
      <legend>Evre</legend>
      <div class="kd-secim">${evreSecim}</div>
     </fieldset>
     <div class="kd-profil__tarih"><label for="kdDogum">ya da doğum tarihi</label><input type="date" id="kdDogum" max="${new Date().toISOString().slice(0, 10)}"></div>
     <fieldset class="kd-ara">
      <legend>Cinsiyet</legend>
      <div class="kd-secim">
       <label><input type="radio" name="c" value="kiz"><span>Kız</span></label>
       <label><input type="radio" name="c" value="erkek"><span>Erkek</span></label>
       <label><input type="radio" name="c" value="belirtilmedi" checked><span>Belirtmek istemiyorum</span></label>
       <label data-kd-bilinmiyor hidden><input type="radio" name="c" value="bilinmiyor"><span>Henüz bilmiyoruz</span></label>
      </div>
     </fieldset>
     <p class="kd-ornek" data-kd-uyari hidden role="alert"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>Lütfen bir evre seçin.</span></p>
     <div class="kd-profil__alt-satir"><button class="btn btn-primary" type="submit">Uygula</button></div>
     <p class="kd-profil__not"><i class="fa-solid fa-lock" aria-hidden="true"></i> Seçim kaydedilmez; yalnız bu ziyarette Kids sayfaları arasında taşınır.</p>
    </form>
    <div class="kd-profil__ozet">
     <span class="kd-profil__ozet-ikon kd-ikon-zemin"><i class="fa-solid fa-baby" aria-hidden="true"></i></span>
     <div><b data-kd-ozet-evre></b><small data-kd-ozet-c></small></div>
     <button class="kd-degistir" type="button">değiştir</button>
    </div>
   </div>
  </div>
 </div>
</section>
<nav class="gnav" id="gnav" aria-label="Sayfa bölümleri">
 <div class="wrap">
  <button class="gtab active" type="button" data-target="evreler"><i class="fa-solid fa-timeline" aria-hidden="true"></i> Evreler</button>
  <button class="gtab" type="button" data-target="tarifler"><i class="fa-solid fa-bowl-food" aria-hidden="true"></i> Yaşa Göre Tarifler</button>
  <button class="gtab" type="button" data-target="moduller"><i class="fa-solid fa-layer-group" aria-hidden="true"></i> Dada Kids Modülleri</button>
  <button class="gtab" type="button" data-target="guven"><i class="fa-solid fa-shield-heart" aria-hidden="true"></i> Güven Merkezi</button>
 </div>
</nav>
<section class="sec flow-white" id="evreler">
 <div class="wrap">
  <div class="sec-head">
   <div>
    <span class="eyebrow"><i class="fa-solid fa-timeline" aria-hidden="true"></i> Evreler</span>
    <h2>Beş evre, her birinde aynı üç soru</h2>
    <p class="lead">Beslenme dengesi, kıvam ve odak besin: evreler arasında kaydırıp karşılaştırın.</p>
   </div>
  </div>
  <div class="kd-evreler drag-scroll" tabindex="0" aria-label="Evreler">
  ${evreKartlari}
  </div>
  ${ornek('Evre özetleri DSÖ, NHS ve AAP\'nin ortak genel ilkelerinden derlenmiş örnek metinlerdir; tıbbi tavsiye yerine geçmez.')}
 </div>
</section>
<section class="lib-sec flow-cream" id="tarifler">
 <div class="wrap">
  <div class="sec-head">
   <div>
    <span class="eyebrow"><i class="fa-solid fa-bowl-food" aria-hidden="true"></i> Yaşa Göre Tarifler</span>
    <h2 data-kd-onizleme-baslik>Ek gıdaya başlarken: ilk tarifler</h2>
   </div>
   <a class="see-all" href="kids__tarifler.html" data-kd-tumu>Tümünü Gör <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
  </div>
  <p class="kd-ornek" data-kd-erken-not hidden role="note"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span><b>Bu evrede ek gıda başlanmaz.</b> Tarifler 6. aydan itibaren; aşağıda ilk tadım tariflerini önceden inceleyebilirsiniz. (Örnek içerik — uzman onayı bekliyor.)</span></p>
  <div class="lst-grid" id="kdOnizleme">
${kartlar}
  </div>
 </div>
</section>
<section class="sec flow-white" id="moduller">
 <div class="wrap">
  <div class="sec-head">
   <div>
    <span class="eyebrow"><i class="fa-solid fa-layer-group" aria-hidden="true"></i> Dada Kids Modülleri</span>
    <h2>Altı modül, tek mutfak</h2>
    <p class="lead">Prototip dalga dalga ilerliyor; hazır olan modüller açık.</p>
   </div>
  </div>
  <div class="topic-grid">
  ${moduller}
  </div>
 </div>
</section>
<section class="seo-intro" id="guven">
 <div class="wrap">
  <div class="seo-intro-grid">
   <div class="seo-prose">
    <h2>Bu içerikler nasıl hazırlanıyor?</h2>
    <p>Dada Kids'teki her yaş, kıvam ve alerjen bilgisi <strong>tek bir besin tablosundan</strong> beslenir; aynı kural tarif kartında, evre sayfasında ve araçlarda aynı sonucu verir. Tablonun her satırı yayından önce bir <strong>çocuk doktoru ya da çocuk diyetisyeni</strong> tarafından incelenir ve inceleme tarihiyle birlikte gösterilir.</p>
    <h3>Prototipte ne görüyorsunuz?</h3>
    <p>Tarifler Dada Gastro'nun mevcut <a class="inline" href="https://dadagastro.com/tarifler/kategori/bebek-tarifleri">Bebek Tarifleri</a> kategorisinden alındı. Üzerlerindeki yaş rozeti, kıvam ve alerjen etiketleri ise prototip için atanmış <strong>örneklerdir</strong>: kaynağın belirttiğinden erken bir yaş asla gösterilmez (ör. "10 ay" yazan tarif +12 Ay rozetini alır).</p>
    <h3>Renkler ne anlatır?</h3>
    <p>Yaş rozetleri sabittir: <span class="kd-yas kd-yas--6 kd-yas--sm">+6 Ay</span> <span class="kd-yas kd-yas--8 kd-yas--sm">+8 Ay</span> <span class="kd-yas kd-yas--9 kd-yas--sm">+9 Ay</span> <span class="kd-yas kd-yas--12 kd-yas--sm">+12 Ay</span> <span class="kd-yas kd-yas--18 kd-yas--sm">+18 Ay</span> <span class="kd-yas kd-yas--24 kd-yas--sm">2–3 Yaş</span>. Profilinize göre değişen yalnız sayfanın ince vurgu rengidir; rozetler ve uyarılar hiçbir zaman değişmez.</p>
   </div>
   <aside class="seo-aside">
    <h4>Güven mührü</h4>
    ${onayRozeti()}
    <h4 class="kd-ara">Dayandığımız rehberler</h4>
    <ul class="seo-quick">
     <li><i class="fa-solid fa-earth-europe" aria-hidden="true"></i><span><b>DSÖ (WHO)</b>Ek gıda ve büyüme standartları</span></li>
     <li><i class="fa-solid fa-stethoscope" aria-hidden="true"></i><span><b>AAP · HealthyChildren</b>Ek gıda ve boğulma önleme</span></li>
     <li><i class="fa-solid fa-hospital" aria-hidden="true"></i><span><b>NHS · Start for Life</b>Kaçınılacak besinler, kıvam evreleri</span></li>
     <li><i class="fa-solid fa-landmark" aria-hidden="true"></i><span><b>T.C. Sağlık Bakanlığı</b>Ulusal beslenme rehberleri</span></li>
    </ul>
   </aside>
  </div>
 </div>
</section>
<section class="next-sec flow-white" id="sonraki">
 <div class="wrap">
  <div class="sec-head"><div><span class="eyebrow"><i class="fa-solid fa-forward" aria-hidden="true"></i> Sıradaki Adım</span><h2>Dada Gastro'da devam edin</h2></div></div>
  <div class="next-grid">
   <a class="next-card" href="kids__tarifler.html"><span class="nx-ico"><i class="fa-solid fa-bowl-food" aria-hidden="true"></i></span><div><b>Yaşa Göre Tarifler</b><span>${KATALOG.tarifler.length} örnek tarif, 6 yaş grubu</span></div><i class="fa-solid fa-arrow-right nx-go" aria-hidden="true"></i></a>
   <a class="next-card" href="https://dadagastro.com/dolapta-ne-var"><span class="nx-ico"><i class="fa-solid fa-basket-shopping" aria-hidden="true"></i></span><div><b>Dolapta Ne Var?</b><span>Elindekilerle ne pişirebilirsin?</span></div><i class="fa-solid fa-arrow-right nx-go" aria-hidden="true"></i></a>
   <a class="next-card" href="https://dadagastro.com/mutfak-sirlari"><span class="nx-ico"><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i></span><div><b>Mutfak Sırları</b><span>Temel teknikler, ansiklopedi, ölçüler</span></div><i class="fa-solid fa-arrow-right nx-go" aria-hidden="true"></i></a>
  </div>
 </div>
</section>`;
}

async function hubSayfasi() {
  let html = await oku('src/donor/giris.html');
  html = mainDegistir(html, hubMain());
  html = basliklar(html, 'Dada Kids — Hamilelikten 36. Aya Beslenme Rehberi | Dada Gastro',
    'Hamilelikten 36. aya, bebeğinizin evresine göre tarifler, güvenli kesim, mevsim takvimi ve uzman onaylı beslenme rehberi.', 'pg-kids');
  return kidsYorumu('https://dadagastro.com/mutfaga-giris (+ /mutfak-sirlari topic-grid)', 'Dada Kids hub') + kabukEkle(html);
}

/* ------------------------------------------------------------------ */
/* Sayfa: kids__tarifler.html — Katalog (donör: /tarifler)             */
/* ------------------------------------------------------------------ */
function katalogMain() {
  const T = KATALOG.tarifler;
  const yasChipleri = [`<button class="kd-yas-chip kd-yas-chip--tumu" type="button" role="radio" aria-checked="false" data-yas="tumu">Tümü <small>${T.length}</small></button>`]
    .concat(KATALOG.kovalar.map((k) => `<button class="kd-yas-chip kd-yas--${k.ay}" type="button" role="radio" aria-checked="false" data-yas="${k.ay}">${esc(k.etiket)} <small>0</small></button>`)).join('\n    ');
  const say = (f) => T.filter(f).length;
  const kivamSatir = Object.entries(KATALOG.kivamlar).map(([k, ad]) => `<label class="fct-row">
     <input type="checkbox" name="kivam" value="${k}" data-ad="${esc(ad)}"><span class="cbx"></span>
     <span class="kd-fct-ikon">${KIVAM_SVG[k].replace('<svg ', '<svg width="18" height="18" ')}</span><span class="ft">${esc(ad)}</span><span class="fcnt">${say((t) => t.kivam === k)}</span>
    </label>`).join('\n    ');
  const icermez = [['glutensiz', 'Glutensiz', 'fa-wheat-awn-circle-exclamation'], ['sutsuz', 'Sütsüz', 'fa-cow'], ['yumurtasiz', 'Yumurtasız', 'fa-egg']].map(([k, ad, ik]) => `<label class="fct-row">
     <input type="checkbox" name="icermez" value="${k}" data-ad="${ad}"><span class="cbx"></span>
     <i class="fa-solid ${ik} kd-fct-ikon" aria-hidden="true"></i><span class="ft">${ad}</span><span class="fcnt">${say((t) => t[k])}</span>
    </label>`).join('\n    ');
  const sure = [[15, '15 dk ve altı'], [30, '30 dk ve altı']].map(([v, ad]) => `<label class="fct-row">
     <input type="checkbox" name="sure" value="${v}"><span class="cbx"></span>
     <i class="fa-solid fa-clock kd-fct-ikon" aria-hidden="true"></i><span class="ft">${ad}</span><span class="fcnt">${say((t) => t.sureDk <= v)}</span>
    </label>`).join('\n    ');
  const kilerChipleri = KATALOG.demoKiler.map((m) => `<button class="kd-kiler-chip" type="button" aria-pressed="true" data-m="${esc(m)}">${esc(m)}</button>`).join('');

  return `<section class="below-header lst-top px-band kd-hero" style="background-image:linear-gradient(90deg,rgba(28,25,18,.93),rgba(33,30,22,.66)),url('varlik/gastro/varliklar/media/1953.webp')" data-px-band="1" data-hero-band=""><div class="px-clip" style="--px-x: 50%; --px-y: 50%; --px-r: 0px; --px-shift: 0.0px;"><div class="px-media" style="background-image: url(&quot;varlik/gastro/varliklar/media/1953.webp&quot;);"></div><div class="px-veil" style="background-image: linear-gradient(90deg, rgba(28, 25, 18, 0.93), rgba(33, 30, 22, 0.66));"></div></div>
 <span class="kd-tema-katman" aria-hidden="true"></span>
 <div class="wrap">
  <nav class="rd-crumb" aria-label="Sayfa yolu">
   <a href="index.html"><i class="fa-solid fa-house" aria-hidden="true"></i></a>
   <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
   <a href="tarifler.html">Tarifler</a>
   <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
   <a href="kids.html">Dada Kids</a>
   <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
   <b>Yaşa Göre Tarifler</b>
  </nav>
  <div class="lst-hero">
   <div class="lh-main">
    <span class="eyebrow"><i class="fa-solid fa-baby" aria-hidden="true"></i> Dada Kids · Tarif Kataloğu</span>
    <h1>Yaşa göre bebek tarifleri</h1>
    <p class="lead">Önce yaşı seçin: rozet, kıvam ve alerjen etiketiyle her tarif bebeğinizin evresine göre süzülür.</p>
   </div>
   <div class="lst-stats">
    <div class="st"><b>${T.length}</b><span>Tarif</span></div>
    <div class="st"><b>6</b><span>Yaş Grubu</span></div>
    <div class="st"><b>3</b><span>Kıvam</span></div>
   </div>
  </div>
 </div>
</section>
<div class="kd-yas-cubugu-sar">
 <div class="wrap">
  <span class="kd-baslik"><i class="fa-solid fa-baby" aria-hidden="true"></i> Yaş</span>
  <div class="kd-yas-cubugu" role="radiogroup" aria-label="Yaş filtresi (zorunlu)">
    ${yasChipleri}
  </div>
  <span class="kd-yas-kural">Seçilen yaş ve öncesine uygun tarifler gösterilir</span>
 </div>
</div>
<section class="lst-sec">
 <div class="wrap">
  <div class="lst-layout">
   <aside class="lst-side" id="lstSide" aria-label="Filtreler">
    <div class="sheet-head">
     <h3><i class="fa-solid fa-sliders" aria-hidden="true"></i> Filtrele</h3>
     <div class="sh-right">
      <a class="fil-clear" href="#" data-kd-temizle>Temizle</a>
      <button class="sheet-close" id="sheetClose" type="button" aria-label="Filtre panelini kapat"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
     </div>
    </div>
    <form id="kdFacet" onsubmit="return false">
     <div class="sheet-body">
      <div class="fil-top"><h3><i class="fa-solid fa-sliders" aria-hidden="true"></i> Filtreler</h3></div>
      <div class="fct open" data-group="kivam">
       <button class="fct-head" type="button" aria-expanded="true"><i class="fa-solid fa-bowl-food fct-head-ico" aria-hidden="true"></i> Kıvam <span class="fct-dot">0</span><i class="fa-solid fa-chevron-down fct-car" aria-hidden="true"></i></button>
       <div class="fct-body">
    ${kivamSatir}
       </div>
      </div>
      <div class="fct open" data-group="icermez">
       <button class="fct-head" type="button" aria-expanded="true"><i class="fa-solid fa-shield-heart fct-head-ico" aria-hidden="true"></i> İçermeyenler <span class="fct-dot">0</span><i class="fa-solid fa-chevron-down fct-car" aria-hidden="true"></i></button>
       <div class="fct-body">
    ${icermez}
       </div>
      </div>
      <div class="fct open" data-group="sure">
       <button class="fct-head" type="button" aria-expanded="true"><i class="fa-solid fa-clock fct-head-ico" aria-hidden="true"></i> Hazırlık Süresi <span class="fct-dot">0</span><i class="fa-solid fa-chevron-down fct-car" aria-hidden="true"></i></button>
       <div class="fct-body">
    ${sure}
       </div>
      </div>
     </div>
     <div class="sheet-foot">
      <a class="fil-clear" href="#" data-kd-temizle>Tümünü Temizle</a>
     </div>
    </form>
   </aside>
   <div class="sheet-overlay" id="sheetOverlay"></div>
   <div class="lst-main">
    <div class="kd-kiler-panel" data-kd-kiler="${esc(JSON.stringify(KATALOG.demoKiler))}">
     <b><i class="fa-solid fa-basket-shopping kd-ikon-zemin" aria-hidden="true"></i> Demo kiler</b>
     ${kilerChipleri}
     <span class="kd-not">Prototipte örnek bir kiler kullanılır; dokunarak malzeme ekleyip çıkarın. Kartlardaki "Kilerimdeki malzemelerle eşle" bu listeye göre hesaplar. Canlıda Dada Gastro kilerine bağlanır.</span>
    </div>
    <div class="lst-bar">
     <p class="lst-sum" id="lstSum"><b>${T.length} tarif</b></p>
     <div class="lst-tools">
      <button class="btn-filter" id="btnFilter" type="button"><i class="fa-solid fa-sliders" aria-hidden="true"></i> Filtrele <span class="fb-count" id="filCount" hidden>0</span></button>
      <div class="vw-seg" id="vwSeg" data-view-seg="" role="group" aria-label="Görünüm">
       <button class="vs-btn is-on" type="button" data-view="grid" data-view-target="lstGrid" aria-label="Kafes görünümü" aria-pressed="true"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i></button>
       <button class="vs-btn" type="button" data-view="list" data-view-target="lstGrid" aria-label="Liste görünümü" aria-pressed="false"><i class="fa-solid fa-list" aria-hidden="true"></i></button>
      </div>
      <div class="sort-dd" id="sortDd">
       <button class="sort-btn" id="sortBtn" type="button" aria-haspopup="true" aria-expanded="false"><i class="fa-solid fa-arrow-down-wide-short" aria-hidden="true"></i><span class="sb-lbl">Sıralama:</span> <span id="sortCur">Önerilen</span> <i class="fa-solid fa-chevron-down sb-car" aria-hidden="true"></i></button>
       <div class="sort-menu" role="menu">
        <a href="#" role="menuitem" class="active" data-sirala="onerilen" onclick="return false"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Önerilen</a>
        <a href="#" role="menuitem" data-sirala="yasa-gore" onclick="return false"><i class="fa-solid fa-baby" aria-hidden="true"></i> Yaşa En Yakın</a>
        <a href="#" role="menuitem" data-sirala="en-hizli" onclick="return false"><i class="fa-solid fa-bolt" aria-hidden="true"></i> En Hızlı</a>
        <a href="#" role="menuitem" data-sirala="en-cok-puanlanan" onclick="return false"><i class="fa-solid fa-star" aria-hidden="true"></i> En Çok Puanlanan</a>
       </div>
      </div>
     </div>
    </div>
    ${ornek()}
    <div class="lst-grid kd-ara" id="lstGrid">
${T.map(kart).join('\n')}
    </div>
    <div class="kd-bos" id="kdBos" hidden>
     <h3>Bu filtrelerle tarif bulunamadı</h3>
     <p>Aşağıdaki seçeneklerden biriyle sonuçları genişletebilirsiniz.</p>
     <div class="kd-bos__oneriler"></div>
    </div>
   </div>
  </div>
 </div>
</section>`;
}

async function katalogSayfasi() {
  let html = await oku('src/donor/tarifler.html');
  html = mainDegistir(html, katalogMain());
  html = basliklar(html, 'Yaşa Göre Bebek Tarifleri | Dada Kids · Dada Gastro',
    '+6 aydan 3 yaşa, yaş rozeti, kıvam ve alerjen etiketli bebek tarifleri. Önce yaşı seçin, tarifler bebeğinizin evresine göre süzülsün.', 'pg-kids');
  return kidsYorumu('https://dadagastro.com/tarifler (+ Tat seçki hero kalıbı)', 'Dada Kids tarif kataloğu') + kabukEkle(html);
}

/* ------------------------------------------------------------------ */
/* Sayfa: kids__tarif__balkabagi-puresi.html — Detay (donör: aynı tarif) */
/* ------------------------------------------------------------------ */
async function detaySayfasi() {
  const t = KATALOG.tarifler.find((x) => x.id === 1405);
  let html = await oku('src/donor/tarif-balkabagi.html');
  html = zorunluDegistir(html, '<a href="https://dadagastro.com/tarifler/kategori/bebek-tarifleri">Bebek Tarifleri</a>',
    '<a href="kids.html">Dada Kids</a><i class="fa-solid fa-chevron-right" aria-hidden="true"></i>\n <a href="kids__tarifler.html">Yaşa Göre Tarifler</a>', 'kırıntı');
  html = zorunluDegistir(html, /<span class="r-chip">Bebek Tarifleri<\/span>/, yasRozet(t.yas, 'xl', true), 'rd-stage r-chip');
  html = zorunluDegistir(html, /<div class="rd-badges">\s*<\/div>/,
    `<div class="rd-badges">${kivam(t.kivam, true)}${alerjenPilleri(t, 4)}</div>`, 'rd-badges');
  html = zorunluDegistir(html, /(<p class="rd-sub">[\s\S]*?<\/p>)/,
    `$1\n <div class="kd-detay-guven">${ornek('Yaş rozeti, kıvam, alerjen ve "bu yaşta nasıl sunulur" bilgileri prototip örneğidir; tarifin kendisi Dada Gastro\'dan birebir alınmıştır.')}${onayRozeti()}</div>`, 'rd-sub');
  const sunum = `<div class="kd-sunum" id="kd-sunum">
 <h3><span class="kd-ikon-zemin"><i class="fa-solid fa-baby" aria-hidden="true"></i></span> Bu yaşta nasıl sunulur?</h3>
 <p>Aynı balkabağı, bebeğiniz büyüdükçe farklı kıvamda sunulur.</p>
 <div class="kd-sunum__izgara">
  <div class="kd-sunum__kart">${yasRozet(6, 'sm')}${kivam('pure')}<p>Pürüzsüz ya da çatalla ezilmiş püre. Kaşıkla akmayacak, ılık kıvam.</p></div>
  <div class="kd-sunum__kart">${yasRozet(9, 'sm')}${kivam('ezilmis')}<p>Daha pütürlü ezme; iyice pişmiş, parmakla kolayca ezilen küçük yumuşak parçalar.</p></div>
  <div class="kd-sunum__kart">${yasRozet(12, 'sm')}${kivam('parmak')}<p>Aile sofrasındaki balkabağı yemeğinden tuz ve şeker eklenmeden ayrılmış porsiyon.</p></div>
 </div>
 ${ornek('Sunum önerileri genel ek gıda ilkelerinden derlenmiştir; bebeğinizin gelişimine göre çocuk doktorunuza danışın.')}
</div>`;
  html = zorunluDegistir(html, /(<div class="note-duo">)/, `${sunum}\n$1`, 'note-duo');
  html = zorunluDegistir(html, /(<ul class="ing-list" id="ingList")/,
    `<div class="kd-kiler-satir" data-kd-kiler="${esc(JSON.stringify(KATALOG.demoKiler))}">
  <button class="kd-kiler-btn" type="button" aria-expanded="false"><i class="fa-solid fa-plus" aria-hidden="true"></i> Kilerimdeki malzemelerle eşle</button>
  <span data-kd-sonuc aria-live="polite"></span>
  <button class="kd-kopyala" type="button" hidden>Eksikleri kopyala</button>
  <small>Demo kiler: ${esc(KATALOG.demoKiler.join(', '))}. Canlıda Dada Gastro kilerine bağlanır.</small>
 </div>
 $1`, 'ing-list');
  html = basliklar(html, `${t.ad} (+6 Ay) | Dada Kids · Dada Gastro`,
    '6. aydan itibaren tek malzemeli, şekersiz balkabağı püresi. Yaş rozeti, kıvam, alerjen bilgisi ve yaşa göre sunum önerileriyle.', 'pg-kids');
  return kidsYorumu('https://dadagastro.com/tarif/balkabagi-puresi-6-ay-ve-uzeri-bebekler-icin', 'Kids tarif detayı: Gastro sayfası birebir + Kids blokları') + kabukEkle(html);
}

/* ------------------------------------------------------------------ */
const SAYFALAR = {
  'index.html': indexSayfasi,
  'tarifler.html': tariflerSayfasi,
  'kids.html': hubSayfasi,
  'kids__tarifler.html': katalogSayfasi,
  'kids__tarif__balkabagi-puresi.html': detaySayfasi,
};
for (const [ad, fn] of Object.entries(SAYFALAR)) {
  const html = await fn();
  await writeFile(path.join(KOK, ad), html);
  console.log('✓', ad, (html.length / 1024).toFixed(0) + ' KB');
}
