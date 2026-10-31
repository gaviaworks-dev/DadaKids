// Derleme v2: src/donor/*.html (canlı Gastro kopyası) + Kids sayfa modülleri → kökte statik HTML.
// Gastro sayfaları (index, tarifler) olduğu gibi alınır, yalnız giriş kapıları eklenir.
// Kids sayfaları: Gastro tarif detayının kabuğu (açık header) + <main> içinde Kids kimliği (.kd-sayfa).
// Sayfa modülleri: src/kids/sayfalar/*.mjs (sözleşme: src/kids/ortak.mjs başındaki not).
//
// Kullanım: node araclar/build.mjs [modül-adı ...]   (ad verilirse yalnız o modüller + Gastro sayfaları)
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import * as ortak from '../src/kids/ortak.mjs';

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
const MEGA_KART = `<a class="mega-find kd-mega" href="kids.html"><span class="mf-ico"><i class="fa-solid fa-baby" aria-hidden="true"></i></span><span class="mf-body"><b>Dada Kids</b><small>Yaşa göre bebek tarifleri</small></span><i class="fa-solid fa-arrow-right mf-arr" aria-hidden="true"></i></a>`;
const CEKMECE_BAG = `<a href="kids.html"><i class="fa-solid fa-baby" aria-hidden="true"></i> <span>Dada Kids · Bebek &amp; Çocuk</span></a>`;

async function kabukEkle(html, { css = [], js = [] } = {}) {
  html = zorunlu(html, /(<a class="mega-find" href="https:\/\/dadagastro\.com\/dolapta-ne-var">[\s\S]*?<\/a>)/, `$1\n${MEGA_KART}`, 'mega-find');
  html = zorunlu(html, /(<div class="d-sub">\s*<a href="tarifler\.html">[\s\S]*?<\/a>)/, `$1\n ${CEKMECE_BAG}`, 'çekmece');
  const cssEk = [`<link rel="stylesheet" href="varlik/kids/kids.css?v=${SURUM}">`];
  for (const c of css) if (await varMi(`varlik/kids/css/${c}.css`)) cssEk.push(`<link rel="stylesheet" href="varlik/kids/css/${c}.css?v=${SURUM}">`);
  const jsEk = [`<script src="varlik/kids/kids.js?v=${SURUM}" defer></script>`];
  for (const j of js) if (await varMi(`varlik/kids/js/${j}.js`)) jsEk.push(`<script src="varlik/kids/js/${j}.js?v=${SURUM}" defer></script>`);
  html = zorunlu(html, '</head>', `${cssEk.join('\n')}\n</head>`, 'head');
  html = zorunlu(html, /<\/body>(?![\s\S]*<\/body>)/, `${jsEk.join('\n')}\n</body>`, 'body');
  return html;
}

function basliklar(html, baslik, aciklama) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(baslik)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(aciklama)}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(baslik)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(aciklama)}">`);
  html = html.replace(/<meta property="og:image" content="[^"]*">/, '');
  return html;
}
const yorum = (donor, not) => `<!-- Dada Kids prototipi · ${not} · donör: ${donor} · araclar/build.mjs ile üretildi, elle düzenlenmez -->\n`;

/* ---------- Kids sayfası kabuğu: Gastro tarif detayı (açık, düz header) ---------- */
const KABUK_HAM = await oku('src/donor/tarif-balkabagi.html');
async function kidsSayfasi({ baslik, aciklama, main, css = [], js = [] }) {
  let html = KABUK_HAM;
  const a = html.indexOf('<main'); const ac = html.indexOf('>', a) + 1; const b = html.indexOf('</main>', ac);
  html = html.slice(0, ac) + '\n' + main + '\n' + html.slice(b);   // tarif detayına özgü betikler taşınmaz
  html = html.replace(/<body([^>]*) class="([^"]*)"/, (t, n, s) => `<body${n} class="pg-kids ${s.replace('pg-tarif-detay', '').trim()}"`);
  html = basliklar(html, baslik, aciklama);
  return yorum('https://dadagastro.com (kabuk: tarif detayı)', 'Kids sayfası') + await kabukEkle(html, { css, js });
}

/* ---------- index.html — Gastro ana sayfa + Kids bandı (kapı A) ---------- */
function kidsBandi() {
  const chip = ortak.EVRE_SIRA.map((k) => `<a class="kd-chip" data-renk="${ortak.EVRE[k].renk}" href="kids.html?evre=${k}">${ortak.ikon(ortak.EVRE[k].ikon, 18)}${esc(ortak.EVRE[k].ad)}</a>`).join('');
  return `<section class="kd-bant-sec" aria-label="Dada Kids">
 <div class="wrap">
  <div class="kd-bant">
   <a class="kd-bant__gorsel" href="kids.html" tabindex="-1" aria-hidden="true"><img src="varlik/kids/gorsel/bant-kids.webp" alt="" width="240" height="240" loading="lazy" decoding="async"></a>
   <div class="kd-bant__metin">
    ${ortak.yaziIm()}
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
  let html = await oku('src/donor/ana.html');
  html = zorunlu(html, /(<section class="findbar-sec">[\s\S]*?<\/section>)/, `$1\n${kidsBandi()}`, 'findbar-sec');
  return yorum('https://dadagastro.com/', 'yalnız Kids bandı eklendi (kapı A)') + await kabukEkle(html);
}

/* ---------- tarifler.html — Gastro tarif listesi + Kids chip'i (kapı B) ---------- */
async function tariflerSayfasi() {
  let html = await oku('src/donor/tarifler.html');
  html = zorunlu(html, /(<span class="lbl">Popüler:<\/span>)/, `$1\n <a class="chip kd-chip-gastro" href="kids-tarifler.html"><i class="fa-solid fa-baby" aria-hidden="true"></i> Dada Kids</a>`, 'lh-chips');
  html = zorunlu(html, /(<div class="subcat-track[^>]*>\s*<a class="subcat\s+active[\s\S]*?<\/a>)/,
    `$1\n <a class="subcat kd-subcat" href="kids-tarifler.html">\n <span class="sc-ico" style="background-image:url('varlik/kids/gorsel/tarif/avokado-muz-ezmesi.webp')"></span>\n <span><b>Bebek &amp; Çocuk</b><span>Dada Kids</span></span>\n </a>`, 'subcat-track');
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
  await writeFile(path.join(KOK, ad), html);
  console.log('✓', ad.padEnd(40), (html.length / 1024).toFixed(0) + ' KB');
}
