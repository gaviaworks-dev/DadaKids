// Derleme v2: src/donor/*.html (canlı Gastro kopyası) + Kids sayfa modülleri → kökte statik HTML.
// Gastro sayfaları (index, tarifler) olduğu gibi alınır, yalnız giriş kapıları eklenir.
// Kids sayfaları: Gastro tarif detayının kabuğu (açık header) + <main> içinde Kids kimliği (.kd-sayfa).
// Sayfa modülleri: src/kids/sayfalar/*.mjs (sözleşme: src/kids/ortak.mjs başındaki not).
//
// Kullanım: node araclar/build.mjs [modül-adı ...]   (ad verilirse yalnız o modüller + Gastro sayfaları)
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import * as ortak from '../src/kids/ortak.mjs';
import { kabukTemizle, tokenTaramasi } from './temizle.mjs';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const oku = (p) => readFile(path.join(KOK, p), 'utf8');
const varMi = async (p) => { try { await access(path.join(KOK, p)); return true; } catch { return false; } };
const SURUM = Date.now().toString(36);
const { esc } = ortak;

function zorunlu(html, eski, yeni, etiket) {
  const sayi = typeof eski === 'string' ? html.split(eski).length - 1 : (html.match(eski) || []).length;
  if (sayi < 1) throw new Error(`Ekleme noktası bulunamadı: ${etiket}`);
  return html.replace(eski, yeni);
}

/* ---------- Kabuk eklemeleri (tüm sayfalar) ---------- */
// Mega menü Dada Kids şeridi: .mega-cats altında tam genişlik (CSS: varlik/kids/css/mega.css).
// Chip'ler yalnız tarif filtresi olan evreler; her evre kendi ilk yaş kovasına gider (kids.js EVRE.kova ile aynı: 6/9/12).
// Hamilelik ve 0–6 Ay yaş kovası taşımaz (6 aydan önce ek gıda yok), şeritte chip'i yok; Keşfet ile Kids ana sayfasından erişilir.
const megaChip = (kod) => {
  const e = ortak.EVRE[kod];
  return `<a class="kd-mega-serit__chip" data-renk="${e.renk}" href="kids-tarifler.html?yas=${ortak.YASLAR.find((y) => ortak.yasEvresi(y) === kod)}" aria-label="${esc(e.ad)} tarifleri">${ortak.ikon(e.ikon, 16)}${esc(e.ad)}</a>`;
};
const MEGA_SERIT = `<div class="kd-mega-serit" role="group" aria-label="Dada Kids">
${ortak.kidsLogoSvg({ sinif: 'kd-mega-serit__logo', boy: 'header' })}<span class="kd-mega-serit__metin">Yaşa göre bebek ve çocuk tarifleri</span><span class="kd-mega-serit__chipler">${ortak.EVRE_SIRA.filter((k) => ortak.YASLAR.some((y) => ortak.yasEvresi(y) === k)).map(megaChip).join('')}</span><a class="kd-mega-serit__kesfet" href="kids.html" aria-label="Dada Kids'i keşfet">Keşfet <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
</div>`;
const CEKMECE_BAG = `<a href="kids.html"><i class="fa-solid fa-baby" aria-hidden="true"></i> <span>Dada Kids · Bebek &amp; Çocuk</span></a>`;

// Header logosu: "gastro" harf gruplarını sar + renkli "kids" ekle ("dada" yolları aynı kalır).
// Kids sayfalarında kids.js html.kd-logo-kids ekler; Gastro sayfalarında Kids bağına tıklayınca dönüşüm oynar.
const KIDS_LOGO = ortak.kidsLogoGrup();   // tek bileşen: src/kids/ortak.mjs
function logoDonusumu(html) {
  return html.replace(/(<span class="brand-word"><svg[^>]*>)([\s\S]*?)(<\/svg>)/g, (t, ac, ic, kap) => {
    if (ic.includes('kd-logo-gastro')) return t;
    const i = ic.indexOf('<g transform=');
    if (i < 0) return t;
    return ac + ic.slice(0, i) + '<g class="kd-logo-gastro">' + ic.slice(i) + '</g>' + KIDS_LOGO + kap;
  });
}

// Marka yazımı tek biçim: "Dada Gastro" / "Dada Kids" (görünür metin ve aria; URL'lere dokunmaz)
function markaYazimi(html) {
  return html.replace(/DadaGastro(?![a-z.\/])/g, 'Dada Gastro').replace(/>Dada<\/(b|strong)>Gastro/g, '>Dada</$1> Gastro');
}
// Tarifler mega menüsü ve çekmece Tarifler alt menüsü prototip içinde kalsın (canlı kategori adresleri → tarifler.html)
function tariflerIcerde(html) {
  return html.replace(/href="https:\/\/dadagastro\.com\/tarifler(?:\/kategori\/[a-z0-9-]+)?(?:\?[^"]*)?"/g, 'href="tarifler.html"');
}

async function kabukEkle(html, { css = [], js = [] } = {}) {
  html = tariflerIcerde(markaYazimi(logoDonusumu(html)));
  html = zorunlu(html, /<div class="mega-feat">/, (t) => `${MEGA_SERIT}\n${t}`, 'mega-feat');
  html = zorunlu(html, /(<div class="d-sub">\s*<a href="tarifler\.html">[\s\S]*?<\/a>)/, `$1\n ${CEKMECE_BAG}`, 'çekmece');
  const cssEk = [`<link rel="stylesheet" href="varlik/kids/kids.css?v=${SURUM}">`, `<link rel="stylesheet" href="varlik/kids/css/mega.css?v=${SURUM}">`];
  for (const c of css) if (await varMi(`varlik/kids/css/${c}.css`)) cssEk.push(`<link rel="stylesheet" href="varlik/kids/css/${c}.css?v=${SURUM}">`);
  const jsEk = [`<script src="varlik/kids/kids.js?v=${SURUM}" defer></script>`];
  for (const j of js) if (await varMi(`varlik/kids/js/${j}.js`)) jsEk.push(`<script src="varlik/kids/js/${j}.js?v=${SURUM}" defer></script>`);
  html = zorunlu(html, '</head>', `${cssEk.join('\n')}\n</head>`, 'head');
  html = zorunlu(html, /<\/body>(?![\s\S]*<\/body>)/, `${jsEk.join('\n')}\n</body>`, 'body');
  return html;
}

const YAYIN = 'https://gaviaworks-dev.github.io/DadaKids/';
/** Sayfaya özel kimlik: title + description + og + twitter (canlı sayfanın meta'ları temizlikte silinir). */
function basliklar(html, baslik, aciklama, { dosya = '', gorsel = 'varlik/kids/gorsel/hero-mutfak.webp', tur = 'website' } = {}) {
  html = html.replace(/<meta (property|name)="(og:[^"]*|twitter:[^"]*|description)"[^>]*>\s*/g, '');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(baslik)}</title>
<meta name="description" content="${esc(aciklama)}">
<meta property="og:site_name" content="Dada Kids · Dada Gastro (prototip)">
<meta property="og:locale" content="tr_TR">
<meta property="og:type" content="${tur}">
<meta property="og:url" content="${YAYIN}${dosya}">
<meta property="og:title" content="${esc(baslik)}">
<meta property="og:description" content="${esc(aciklama)}">
<meta property="og:image" content="${YAYIN}${gorsel}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(baslik)}">
<meta name="twitter:description" content="${esc(aciklama)}">
<meta name="twitter:image" content="${YAYIN}${gorsel}">`);
  return html;
}
const yorum = (donor, not) => `<!-- Dada Kids prototipi · ${not} · donör: ${donor} · araclar/build.mjs ile üretildi, elle düzenlenmez -->\n`;

/* ---------- Kids sayfası kabuğu: Gastro tarif detayı (açık, düz header) ---------- */
const KABUK_HAM = kabukTemizle(await oku('src/donor/tarif-balkabagi.html'));
async function kidsSayfasi({ dosya, baslik, aciklama, main, css = [], js = [], gorsel }) {
  let html = KABUK_HAM;
  const a = html.indexOf('<main'); const ac = html.indexOf('>', a) + 1; const b = html.indexOf('</main>', ac);
  html = html.slice(0, ac) + '\n' + main + '\n' + html.slice(b);   // tarif detayına özgü betikler taşınmaz
  html = html.replace(/<body([^>]*) class="([^"]*)"/, (t, n, s) => `<body${n} class="pg-kids ${s.replace('pg-tarif-detay', '').trim()}"`);
  // Kids içinde logo Kids ana sayfasına gider; Kids favicon'u
  html = html.replace(/(<a class="(?:brand|drawer-brand)" href=")index\.html(" aria-label=")[^"]*"/g, '$1kids.html$2Dada Kids ana sayfa"');
  html = html.replace(/<link rel="(?:shortcut )?icon"[^>]*>/g, '').replace('</title>', '</title>\n<link rel="icon" type="image/svg+xml" href="varlik/kids/logo/favicon.svg"><link rel="icon" type="image/png" sizes="32x32" href="varlik/kids/logo/favicon-32.png"><link rel="apple-touch-icon" href="varlik/kids/logo/apple-touch-icon.png">');
  html = basliklar(html, baslik, aciklama, { dosya, gorsel });
  // Pütür asistanı tüm Kids sayfalarında (dosyalar varsa)
  return yorum('https://dadagastro.com (kabuk: tarif detayı)', 'Kids sayfası') + await kabukEkle(html, { css: [...css, 'putur'], js: [...js, 'putur'] });
}

/* ---------- index.html — Gastro ana sayfa + Kids bandı (kapı A) ---------- */
function kidsBandi() {
  const chip = ortak.EVRE_SIRA.map((k) => `<a class="kd-chip" data-renk="${ortak.EVRE[k].renk}" href="kids.html?evre=${k}">${ortak.ikon(ortak.EVRE[k].ikon, 18)}${esc(ortak.EVRE[k].ad)}</a>`).join('');
  return `<section class="kd-bant-sec" aria-label="Dada Kids">
 <div class="wrap">
  <div class="kd-bant">
   <a class="kd-bant__gorsel" href="kids.html" tabindex="-1" aria-hidden="true"><img src="varlik/kids/gorsel/bant-kids.webp" alt="" width="240" height="240" loading="lazy" decoding="async"></a>
   <div class="kd-bant__metin">
    ${ortak.kidsLogoSvg({ sinif: 'kd-bant__logo', boy: 'header' })}
    <b class="kd-bant__baslik">Bebeğiniz kaç aylık?</b>
    <p>Hamilelikten 3 yaşa; yaşa uygun tarifler, güvenli kesim ve beslenme rehberi.</p>
    <div class="kd-bant__chipler">${chip}</div>
   </div>
   <a class="kd-btn" href="kids.html">Dada Kids'e Git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
  </div>
 </div>
</section>`;
}
async function indexSayfasi() {
  let html = kabukTemizle(await oku('src/donor/ana.html'));
  html = zorunlu(html, /(<section class="findbar-sec">[\s\S]*?<\/section>)/, `$1\n${kidsBandi()}`, 'findbar-sec');
  html = basliklar(html, 'Dada Gastro ana sayfası + Dada Kids bandı (prototip)', 'Dada Gastro ana sayfasının prototip kopyası; Dada Kids giriş bandı eklenmiştir.', { dosya: 'index.html', gorsel: 'varlik/kids/gorsel/bant-kids.webp' });
  return yorum('https://dadagastro.com/', 'yalnız Kids bandı eklendi (kapı A)') + await kabukEkle(html);
}

/* ---------- tarifler.html — Gastro tarif listesi + Kids chip'i (kapı B) ---------- */
async function tariflerSayfasi() {
  let html = kabukTemizle(await oku('src/donor/tarifler.html'));
  html = zorunlu(html, /(<span class="lbl">Popüler:<\/span>)/, `$1\n <a class="chip kd-chip-gastro" href="kids-tarifler.html"><i class="fa-solid fa-baby" aria-hidden="true"></i> Dada Kids</a>`, 'lh-chips');
  html = zorunlu(html, /(<div class="subcat-track[^>]*>\s*<a class="subcat\s+active[\s\S]*?<\/a>)/,
    `$1\n <a class="subcat kd-subcat" href="kids-tarifler.html">\n <span class="sc-ico" style="background-image:url('varlik/kids/gorsel/tarif/avokado-muz-ezmesi.webp')"></span>\n <span><b>Bebek &amp; Çocuk</b><span>Dada Kids</span></span>\n </a>`, 'subcat-track');
  html = basliklar(html, 'Tarifler — Dada Gastro (prototip, Dada Kids girişli)', 'Dada Gastro tarif listesinin prototip kopyası; Dada Kids chip\'i ve alt kategori kalemi eklenmiştir.', { dosya: 'tarifler.html' });
  return yorum('https://dadagastro.com/tarifler', 'yalnız Dada Kids chip\'i ve alt kategori kalemi eklendi (kapı B)') + await kabukEkle(html);
}

/* ---------- Eski adresler → yönlendirme ---------- */
const yonlendir = (hedef) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${hedef}"><title>Dada Kids</title></head><body><p>Bu sayfa taşındı: <a href="${hedef}">${hedef}</a></p></body></html>\n`;

/* ---------- Derle ---------- */
const istenen = process.argv.slice(2);
const cikti = [];
cikti.push(['index.html', await indexSayfasi()]);
cikti.push(['tarifler.html', await tariflerSayfasi()]);
cikti.push(['kids__tarifler.html', yonlendir('kids-tarifler.html')]);
cikti.push(['kids__tarif__balkabagi-puresi.html', yonlendir('kids-tarif.html?t=balkabagi-puresi')]);

const modulKlasoru = path.join(KOK, 'src/kids/sayfalar');
const moduller = (await readdir(modulKlasoru)).filter((f) => f.endsWith('.mjs')).sort();
const o = { ...ortak };
for (const f of moduller) {
  const ad = f.replace('.mjs', '');
  if (istenen.length && !istenen.includes(ad)) continue;
  const mod = await import(path.join(modulKlasoru, f) + `?v=${SURUM}`);
  const sayfalar = await mod.default(o);
  for (const s of sayfalar) {
    if (!s.dosya || !s.main) throw new Error(`${f}: dosya/main eksik`);
    cikti.push([s.dosya, await kidsSayfasi(s)]);
  }
}
for (const [ad, html] of cikti) {
  const kalan = tokenTaramasi(html);
  if (kalan.length) throw new Error(`${ad}: token taraması kırmızı → ${kalan.join(', ')}`);
  await writeFile(path.join(KOK, ad), html);
  console.log('✓', ad.padEnd(40), (html.length / 1024).toFixed(0) + ' KB');
}
