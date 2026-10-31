// Kabuk paritesi: prototip sayfası ↔ canlı donör; header/nav/footer/alt çubuk geometrisi + temel computed style.
// Tolerans 4px. Footer'ın y'si içerik uzunluğuna bağlı olduğundan footer'da yalnız x/genişlik/yükseklik ölçülür.
// Kullanım: node araclar/parite.mjs   (önce: node araclar/sunucu.mjs)
import { chromium } from 'playwright';
const YEREL = process.env.TABAN || 'http://localhost:8765/DadaKids/';   // TABAN=… ile izole ağaç ya da canlı
const D = 'https://dadagastro.com/tarif/balkabagi-puresi-6-ay-ve-uzeri-bebekler-icin'; // Kids kabuğunun donörü
const CIFTLER = [
  ['index.html', 'https://dadagastro.com/'],
  ['tarifler.html', 'https://dadagastro.com/tarifler'],
  ['kids.html', D],
  ['kids-tarifler.html', D],
  ['kids-tarif.html', D],
  ['kids-donem-6-8-ay.html', D],
  ['kids-arac-persentil.html', D],
];
const SECICILER = [
  ['header.header', 'xywh'], ['header .brand', 'xywh'], ['nav.ana-menu', 'xywh'], ['nav.ana-menu > .nav-item:nth-child(1)', 'xywh'],
  ['nav.ana-menu > .nav-item:nth-child(5)', 'xywh'], ['.head-actions', 'xywh'], ['footer.footer', 'xwh'], ['footer .foot-grid', 'xwh'],
  ['.bottom-nav', 'xywh'],
];
const TOL = 4;
async function olc(sayfa, url) {
  await sayfa.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await sayfa.waitForTimeout(500);
  // canlıda çerez bandı alt çubuğu iter; prototipte bant yok (temizlendi) → canlıda 'Reddet' ile kapatıp ölç
  if (!url.startsWith(YEREL)) { try { await sayfa.click('#cookieReject', { timeout: 2000 }); await sayfa.waitForTimeout(600); } catch {} }
  // BOZ=1: kapının kırmızı verebildiğini göstermek için yerel sayfada logoyu 12px kaydırır
  if (process.env.BOZ && url.startsWith(YEREL)) await sayfa.addStyleTag({ content: 'header .brand{margin-left:12px!important}' });
  return sayfa.evaluate((sec) => sec.map(([s]) => {
    const el = document.querySelector(s); if (!el) return null;
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    const footer = s.startsWith('footer');
    return { x: r.x, y: footer ? 0 : r.y, w: r.width, h: r.height, gorunur: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0, font: cs.fontFamily.split(',')[0], renk: cs.backgroundColor };
  }), SECICILER);
}
const t = await chromium.launch();
let sapma = 0;
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const bag = await t.newContext({ viewport: { width: w, height: h } });
  const a = await bag.newPage(), b = await bag.newPage();
  for (const [yerel, canli] of CIFTLER) {
    const [ra, rb] = [await olc(a, YEREL + yerel), await olc(b, canli)];
    const satir = [];
    SECICILER.forEach(([s, alan], i) => {
      const p = ra[i], c = rb[i];
      if (!p && !c) return;
      if (!p || !c) { satir.push(`${s}: ${p ? 'canlıda yok' : 'prototipte yok'}`); return; }
      if (p.gorunur !== c.gorunur) { satir.push(`${s}: görünürlük ${p.gorunur}≠${c.gorunur}`); return; }
      if (!p.gorunur) return;
      for (const k of alan.replace('xywh', 'xywh').split('')) {
        const anahtar = k === 'w' ? 'w' : k === 'h' ? 'h' : k;
        const fark = Math.abs(p[anahtar] - c[anahtar]);
        if (fark > TOL) satir.push(`${s} ${k}: ${p[anahtar].toFixed(0)} ↔ ${c[anahtar].toFixed(0)}`);
      }
      if (p.font !== c.font) satir.push(`${s} font: ${p.font} ↔ ${c.font}`);
    });
    if (satir.length) sapma++;
    console.log(`${satir.length ? '✗' : '✓'} ${w} ${yerel}`); satir.forEach((x) => console.log('    ', x));
  }
  await bag.close();
}
await t.close();
process.exit(sapma ? 1 : 0);
