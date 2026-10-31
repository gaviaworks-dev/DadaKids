// Gözden geçirme: node araclar/bak.mjs <sayfa?sorgu> <genişlik> <y> <yükseklik> <çıktı> [tıkla-seçici]
import { chromium } from 'playwright';
const [s, w, y, h, cikti, tikla] = process.argv.slice(2);
const t = await chromium.launch();
const p = await (await t.newContext({ viewport: { width: +w, height: +w < 500 ? 844 : 900 } })).newPage();
await p.goto('http://localhost:8765/DadaKids/' + s, { waitUntil: 'networkidle' });
try { await p.click('#cookieReject', { timeout: 1500 }); } catch {}
if (tikla) { for (const sec of tikla.split('|')) { await p.click(sec); await p.waitForTimeout(300); } }
await p.waitForTimeout(300);
if (process.env.SEC) { const el = p.locator(process.env.SEC).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await el.screenshot({ path: cikti }); }
else if (process.env.KAYDIR) { await p.evaluate((yy) => window.scrollTo(0, yy), +y); await p.waitForTimeout(600); await p.screenshot({ path: cikti }); }
else await p.screenshot({ path: cikti, clip: { x: 0, y: +y, width: +w, height: +h }, fullPage: true });
await t.close();
