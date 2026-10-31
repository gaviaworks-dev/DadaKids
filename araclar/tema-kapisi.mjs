// Tema kapısı: her Kids sayfası nötr / pembe (kiz) / mavi (erkek) temada çekilir; nötre göre değişen piksel
// oranı ölçülür. Kırmızı: pembe−nötr farkı eşik altında ya da pembe/mavi fark oranı [0.6, 1.67] dışında.
// Videolar ve animasyonlar ölçümü bozmasın diye "azaltılmış hareket" taklit edilir.
// Kullanım: node araclar/tema-kapisi.mjs [sayfa...]   (TABAN=… ile canlıda) · ESIK=0.12
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const ESIK = Number(process.env.ESIK || 0.25);   // pembe−nötr en az %25 piksel değişmeli
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync('.').filter((f) => /^kids(-.+)?\.html$/.test(f));
const GENISLIK = (process.env.GENISLIK || '1440').split(',').map(Number);
const DIR = 'rapor/tmp/tema';
await mkdir(DIR, { recursive: true });
// değişen piksel ORANI: fark görüntüsü gri + eşik (%0,6 ≈ 1,5/255) → ortalama (0–1). AE metriği bu IM sürümünde güvenilmez.
const fark = (a, b) => parseFloat(execFileSync('magick', [a, b, '-compose', 'difference', '-composite', '-colorspace', 'gray', '-threshold', process.env.ESIK_PIKSEL || '0.6%', '-format', '%[fx:mean]', 'info:']).toString()) || 0;
const t = await chromium.launch();
let kirmizi = 0, n = 0;
for (const w of GENISLIK) {
  const h = w < 500 ? 844 : 900;
  const bag = await t.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  for (const s of SAYFALAR) {
    const ad = s.replace('.html', '');
    const yollar = {};
    for (const [tema, c] of [['notr', 'belirtilmedi'], ['kiz', 'kiz'], ['erkek', 'erkek']]) {
      const p = await bag.newPage();
      const ayrac = s.includes('?') ? '&' : '?';
      await p.goto(`${TABAN}${s}${ayrac}c=${c}`, { waitUntil: 'networkidle' });
      await p.evaluate(() => { document.querySelectorAll('video').forEach((v) => { v.pause(); }); });
      await p.waitForTimeout(350);
      yollar[tema] = `${DIR}/${ad}-${w}-${tema}.png`;
      await p.screenshot({ path: yollar[tema] });
      await p.close();
    }
    const pk = fark(yollar.notr, yollar.kiz), pm = fark(yollar.notr, yollar.erkek);
    const oran = pm ? pk / pm : 0;
    const sorun = [];
    if (pk < ESIK) sorun.push(`pembe−nötr farkı düşük (%${(pk * 100).toFixed(1)} < %${ESIK * 100})`);
    if (oran < 0.6 || oran > 1.67) sorun.push(`pembe/mavi oranı ${oran.toFixed(2)}`);
    n++; if (sorun.length) kirmizi++;
    console.log(`${sorun.length ? '✗' : '✓'} ${String(w).padEnd(4)} ${s.padEnd(38)} pembe %${(pk * 100).toFixed(1)} · mavi %${(pm * 100).toFixed(1)} · oran ${oran.toFixed(2)}${sorun.length ? '  ' + sorun.join(' · ') : ''}`);
  }
  await bag.close();
}
await t.close();
console.log(`\n${n - kirmizi}/${n} tema ölçümü yeşil`);
process.exit(kirmizi ? 1 : 0);
