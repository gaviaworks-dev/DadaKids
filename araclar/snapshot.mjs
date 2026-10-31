// Kaynak transferi: dadagastro.com donör sayfalarını (sunucu HTML'i) çeker,
// referans verdiği her varlığı varlik/gastro/ altına aynı alt yol yapısıyla indirir,
// yolları göreliye çevirir, izleme/kimlik kalıntılarını SİLER ve src/donor/<ad>.html yazar.
// Markup yeniden yazılmaz; yalnız yol çevirisi ve silme yapılır.
//
// Kullanım: node araclar/snapshot.mjs
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { kabukTemizle, tokenTaramasi } from './temizle.mjs';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CANLI = 'https://dadagastro.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) DadaKidsPrototip/1.0';
const VARLIK = 'varlik/gastro';

// donör adı → canlı yol
export const DONORLER = {
  ana: '/',
  tarifler: '/tarifler',
  giris: '/mutfaga-giris',
  sirlar: '/mutfak-sirlari',
  'tarif-balkabagi': '/tarif/balkabagi-puresi-6-ay-ve-uzeri-bebekler-icin',
};

// Kids kataloğunun kullandığı Gastro bebek tarifi görselleri (media id)
const MEDYA = [1403, 1404, 1405, 1406, 1407, 1409, 1410, 1412, 1952, 1953, 1959, 1962, 1965, 1966, 1967, 1980, 1981, 1983];

// Prototip içinde karşılığı olan sayfa yolları
const ICERDE = { '/': 'index.html', '/tarifler': 'tarifler.html' };

const VARLIK_UZANTI = /\.(css|js|mjs|webp|png|jpe?g|avif|gif|svg|ico|woff2?|ttf|otf|eot|json|webmanifest|mp4|webm)$/i;

const indirilen = new Map(); // yol → durum
const kuyrukCss = [];

function temizYol(u) {
  // '/a/b.css?v=1' → 'a/b.css'
  return u.split('#')[0].split('?')[0].replace(/^\/+/, '');
}

function canliYolu(ham, tabanYol = '/') {
  // ham: href/src/url değeri → canlı sitede mutlak yol ('/x/y') ya da null (dış)
  if (!ham) return null;
  const v = ham.trim();
  if (/^(data:|mailto:|tel:|javascript:|#|about:)/i.test(v)) return null;
  try {
    const u = new URL(v, CANLI + tabanYol);
    if (u.origin !== CANLI) return null;
    return u.pathname + u.search;
  } catch { return null; }
}

function varlikMi(yol) { return VARLIK_UZANTI.test(yol.split('?')[0]); }

async function var_(p) { try { await access(p); return true; } catch { return false; } }

async function indir(yol) {
  const temiz = temizYol(yol);
  if (!temiz || indirilen.has(temiz)) return;
  indirilen.set(temiz, 'bekliyor');
  const hedef = path.join(KOK, VARLIK, decodeURIComponent(temiz));
  if (await var_(hedef)) { indirilen.set(temiz, 200); if (temiz.endsWith('.css')) kuyrukCss.push(temiz); return; }
  const yanit = await fetch(CANLI + '/' + temiz, { headers: { 'User-Agent': UA } });
  indirilen.set(temiz, yanit.status);
  if (!yanit.ok) { console.warn('  ✗', yanit.status, temiz); return; }
  await mkdir(path.dirname(hedef), { recursive: true });
  await writeFile(hedef, Buffer.from(await yanit.arrayBuffer()));
  if (temiz.endsWith('.css')) kuyrukCss.push(temiz);
}

// CSS içindeki url() ve @import'ları indir; mutlak yolları CSS dosyasının konumuna göre göreliye çevir
async function cssIsle(temiz) {
  const dosya = path.join(KOK, VARLIK, decodeURIComponent(temiz));
  let css = await readFile(dosya, 'utf8');
  const tabanYol = '/' + temiz;
  const bulunan = new Set();
  const cevir = (ham) => {
    const cy = canliYolu(ham, tabanYol);
    if (!cy || !varlikMi(cy)) return ham;
    bulunan.add(cy);
    const hedef = temizYol(cy);
    let rel = path.relative(path.dirname(temiz), hedef).split(path.sep).join('/');
    return rel;
  };
  css = css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (t, q, u) => `url(${q}${cevir(u)}${q})`);
  css = css.replace(/@import\s+(['"])([^'"]+)\1/g, (t, q, u) => `@import ${q}${cevir(u)}${q}`);
  await writeFile(dosya, css);
  for (const b of bulunan) await indir(b);
}

function htmlTemizle(html) {
  return html
    // izleme ve SEO kimliği (prototip canlıyla çakışmasın)
    .replace(/<script[^>]*src="[^"]*analitik\.js[^"]*"[^>]*><\/script>/g, '')
    .replace(/<meta name="dada-goruntulenme"[^>]*>/g, '')
    .replace(/<script[^>]*src="[^"]*goruntulenme\.js[^"]*"[^>]*><\/script>/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
    .replace(/<link rel="(canonical|alternate)"[^>]*>\s*/g, '')
    .replace(/<meta name="csrf-token" content="[^"]*">/, '<meta name="csrf-token" content="">')
    .replace(/(<input type="hidden" name="_token" value=")[^"]*(")/g, '$1$2')
    .replace(/<meta name="robots"[^>]*>\s*/g, '')
    // canlıdaki <base href="/"> GitHub Pages alt yolunda kökü kaydırır; prototip sayfaları kökte → gereksiz
    .replace(/<base href="[^"]*">\s*/g, '')
    .replace(/<head>/, '<head>\n<meta name="robots" content="noindex, nofollow">');
}

function htmlYollari(html, tabanYol) {
  const varliklar = new Set();
  const sayfaBagi = (cy) => {
    const [p, q] = cy.split('?');
    if (ICERDE[p] && !q) return ICERDE[p];
    return CANLI + cy;
  };
  const cevirDeger = (ham, nitelik) => {
    const cy = canliYolu(ham, tabanYol);
    if (!cy) return ham;
    if (varlikMi(cy)) { varliklar.add(cy); return `${VARLIK}/${temizYol(cy)}`; }
    if (nitelik === 'href' || nitelik === 'action' || nitelik === 'onclick') return sayfaBagi(cy);
    return ham;
  };
  html = html.replace(/\s(href|src|action|poster|data-src|data-bg)="([^"]*)"/g, (t, n, v) => ` ${n}="${cevirDeger(v, n)}"`);
  html = html.replace(/\ssrcset="([^"]*)"/g, (t, v) => ' srcset="' + v.split(',').map(p => { const [u, w] = p.trim().split(/\s+/); return [cevirDeger(u, 'src'), w].filter(Boolean).join(' '); }).join(', ') + '"');
  // satır içi stil url()'leri (hem "..." hem &quot;...&quot;)
  html = html.replace(/url\((&quot;|['"]?)([^'")&]+)\1\)/g, (t, q, u) => `url(${q}${cevirDeger(u, 'src')}${q})`);
  // onclick="location.href='/x'"
  html = html.replace(/location\.href='([^']+)'/g, (t, u) => `location.href='${cevirDeger(u, 'onclick')}'`);
  return { html, varliklar };
}

async function main() {
  await mkdir(path.join(KOK, 'src/donor'), { recursive: true });
  for (const [ad, yol] of Object.entries(DONORLER)) {
    const yanit = await fetch(CANLI + yol, { headers: { 'User-Agent': UA } });
    if (!yanit.ok) throw new Error(`${ad}: ${yanit.status}`);
    let html = await yanit.text();
    html = kabukTemizle(htmlTemizle(html));   // token/csrf/oturum/kullanıcıya özel blok kopyalanmaz
    const kalan = tokenTaramasi(html); if (kalan.length) throw new Error(`${ad}: temizlik sonrası kalan: ${kalan.join(', ')}`);
    // dm-p5-l.js pencere kalıbı CSS'ini mutlak '/revize/tur7/p-pencere.css' yoluyla ekler; Pages alt yolunda kırılır.
    // Betiğin kendi koşulu ('link[data-pencere-kalibi]' varsa ekleme) kullanılır: aynı dosya head'e yerel yolla konur.
    if (html.includes('dm-p5-l.js') && !html.includes('data-pencere-kalibi'))
      html = html.replace('</head>', '<link rel="stylesheet" href="/revize/tur7/p-pencere.css" data-pencere-kalibi>\n</head>');
    const r = htmlYollari(html, yol);
    const basa = `<!-- donör: ${CANLI}${yol} · alındı: ${new Date().toISOString().slice(0, 10)} · araclar/snapshot.mjs -->\n`;
    await writeFile(path.join(KOK, 'src/donor', `${ad}.html`), basa + r.html);
    console.log('donör', ad, r.varliklar.size, 'varlık');
    for (const v of r.varliklar) await indir(v);
  }
  for (const id of MEDYA) { await indir(`/varliklar/media/${id}.webp`); await indir(`/varliklar/media/${id}/thumb.webp`); }
  while (kuyrukCss.length) await cssIsle(kuyrukCss.shift());
  const hatali = [...indirilen].filter(([, d]) => d !== 200);
  console.log(`indirilen: ${indirilen.size} · hatalı: ${hatali.length}`);
  hatali.forEach(([y, d]) => console.log('  ', d, y));
}

main().catch(e => { console.error(e); process.exit(1); });
