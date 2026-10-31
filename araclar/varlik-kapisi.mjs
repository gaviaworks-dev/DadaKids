// Kapı: her sayfa 1440 ve 390'da açılır; yerel 4xx/5xx istek, JS hatası ve ekran görüntüsü toplanır.
// Kullanım: node araclar/varlik-kapisi.mjs [sayfa...]   (önce: node araclar/sunucu.mjs)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
import { readdirSync } from 'node:fs';
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync('.').filter((f) => f.endsWith('.html') && !f.startsWith('kids__'));
const GENISLIK = [[1440, 900], [390, 844]];
await mkdir('rapor/tmp', { recursive: true });
const tarayici = await chromium.launch();
let hata = 0;
for (const [w, h] of GENISLIK) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  for (const s of SAYFALAR) {
    const sayfa = await bag.newPage();
    const kotu = [], jsHata = [];
    sayfa.on('response', (r) => { if (r.url().startsWith(TABAN.replace(/\/DadaKids\/$/, '')) && r.status() >= 400) kotu.push(r.status() + ' ' + r.url().replace(TABAN, '')); });
    sayfa.on('pageerror', (e) => jsHata.push(e.message));
    await sayfa.goto(TABAN + s, { waitUntil: 'networkidle' });
    await sayfa.waitForTimeout(400);
    await sayfa.screenshot({ path: `rapor/tmp/${s.replace('.html', '')}-${w}.png`, fullPage: true });
    const yatay = await sayfa.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const durum = (kotu.length || jsHata.length || yatay > 0) ? '✗' : '✓';
    if (durum === '✗') hata++;
    console.log(`${durum} ${w} ${s}  404:${kotu.length} js:${jsHata.length} yatayTaşma:${yatay}px`);
    kotu.slice(0, 8).forEach((k) => console.log('    ', k));
    jsHata.slice(0, 5).forEach((k) => console.log('     JS', k.slice(0, 200)));
    await sayfa.close();
  }
  await bag.close();
}
await tarayici.close();
process.exit(hata ? 1 : 0);
