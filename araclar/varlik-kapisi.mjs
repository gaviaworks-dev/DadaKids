// Genişletilmiş görsel kapı (tur 2): her sayfa 1440 · 1024 · 768 · 390'da açılır.
// Ölçülenler: yerel 4xx/5xx · JS hatası · yatay taşma · kırık görsel · başlık/görsel kesilmesi (yapışkan
// alt menü altında) · görselsiz bölüm · bitişik kart (spacing) · Güvenli Kesim metin-çizim uyumu.
// Kullanım: node araclar/varlik-kapisi.mjs [sayfa...]   (TABAN=… ile canlıda)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const KOKEN = new URL(TABAN).origin;
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync('.').filter((f) => f.endsWith('.html') && !f.startsWith('kids__'));
const GENISLIK = (process.env.GENISLIK || '1440,1024,768,390').split(',').map(Number);
await mkdir('rapor/tmp/kapi', { recursive: true });
const tarayici = await chromium.launch();
let hata = 0, olcum = 0;
for (const w of GENISLIK) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1 });
  for (const s of SAYFALAR) {
    const sayfa = await bag.newPage();
    const kotu = [], jsHata = [];
    sayfa.on('response', (r) => { if (r.url().startsWith(KOKEN) && r.status() >= 400) kotu.push(r.status() + ' ' + r.url().replace(TABAN, '')); });
    sayfa.on('pageerror', (e) => jsHata.push(e.message));
    await sayfa.goto(TABAN + s, { waitUntil: 'networkidle' });
    // kart girişleri ve tembel görseller için gerçek tekerlek kaydırması
    const boy = await sayfa.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < boy; y += 700) { await sayfa.mouse.wheel(0, 700); await sayfa.waitForTimeout(70); }
    await sayfa.evaluate(() => scrollTo(0, 0)); await sayfa.waitForTimeout(500);
    const r = await sayfa.evaluate(() => {
      const out = { yatay: document.documentElement.scrollWidth - innerWidth, kirik: [], kesik: [], gorselsiz: [], bitisik: [], kesim: [], alt: [] };
      const kids = document.body.classList.contains('pg-kids');
      // kırık görsel
      document.querySelectorAll('img').forEach((i) => { if (i.complete && i.naturalWidth === 0 && getComputedStyle(i).display !== 'none' && i.getBoundingClientRect().width > 0) out.kirik.push(i.getAttribute('src')); });
      if (!kids) return out;
      // kesilme: ilk ekrandaki h1/h2/hero görselleri yapışkan Kids menüsünün altında kalmasın; başlıklar taşmasın
      const ust = document.querySelector('.kd-ust'); const ustAlt = ust ? ust.getBoundingClientRect().bottom : 0;
      document.querySelectorAll('.kd-sayfa h1, .kd-sayfa h2, .kd-hero__gorsel, .kd-hero img').forEach((e) => {
        const b = e.getBoundingClientRect(); if (b.width === 0 || b.top > innerHeight) return;
        if (b.top < ustAlt - 1 && b.bottom > 0) out.kesik.push((e.tagName + '.' + (e.className || '')).slice(0, 40) + ` üst=${Math.round(b.top)} menü=${Math.round(ustAlt)}`);
        if (/^H/.test(e.tagName) && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible') out.kesik.push(e.tagName + ' yatay kırpık: ' + e.textContent.trim().slice(0, 30));
        if (b.right > innerWidth + 1 || b.left < -1) out.kesik.push((e.tagName + ' ekran dışı: ' + (e.textContent || '').trim().slice(0, 24)));
      });
      // görselsiz bölüm: her Kids bölümünde en az bir görsel öğe (img/svg/video, FA ikonu sayılmaz)
      document.querySelectorAll('.kd-sayfa section').forEach((sec) => {
        if (sec.closest('[hidden]') || sec.getBoundingClientRect().height < 80) return;
        const var_ = [...sec.querySelectorAll('img, video, svg')].some((g) => { const b = g.getBoundingClientRect(); return b.width >= 16 && b.height >= 16 && !g.closest('i'); });
        if (!var_) out.gorselsiz.push((sec.id || sec.className || 'section').slice(0, 40));
      });
      // spacing: ızgara çocukları birbirine bitişik olmasın (aynı satırda ≥ 8px, alt alta ≥ 8px)
      document.querySelectorAll('.kd-izgara, .kd-kaydir, .kd-liste').forEach((g) => {
        const c = [...g.children].filter((x) => !x.hidden && x.getBoundingClientRect().width > 0).map((x) => x.getBoundingClientRect());
        for (let i = 1; i < c.length; i++) {
          const a = c[i - 1], b = c[i];
          const ayniSatir = Math.abs(a.top - b.top) < 4;
          const bosluk = ayniSatir ? b.left - a.right : b.top - a.bottom;
          if (bosluk < 7 && bosluk > -1) { out.bitisik.push((g.id || g.className).slice(0, 30) + ` boşluk=${Math.round(bosluk)}`); break; }
        }
      });
      // alt metin: Kids içeriğindeki her görsel ya anlamlı alt taşır ya da dekoratif işaretlidir
      out.alt = [...document.querySelectorAll('.kd-sayfa img')].filter((i) => !i.hasAttribute('alt') || (i.getAttribute('alt').trim() === '' && i.getAttribute('aria-hidden') !== 'true' && i.getAttribute('role') !== 'presentation' && !i.closest('[aria-hidden="true"]'))).map((i) => i.getAttribute('src'));
      // Güvenli Kesim: aynı besinin aşama çizimleri birbirinden farklı (metinler farklıysa)
      document.querySelectorAll('[data-besin]').forEach((k) => {
        const as = [...k.querySelectorAll('[data-asama]')].map((a) => { const g = a.querySelector('svg, img'); return { ad: a.dataset.asama, cizim: g ? (g.tagName === 'IMG' ? g.getAttribute('src') : g.innerHTML.replace(/\s+/g, ' ')) : '', metin: a.textContent.replace(/\s+/g, ' ').trim() }; });
        for (let i = 0; i < as.length; i++) for (let j = i + 1; j < as.length; j++) if (as[i].cizim && as[i].cizim === as[j].cizim && as[i].metin !== as[j].metin) out.kesim.push(`${k.dataset.besin}: ${as[i].ad} = ${as[j].ad}`);
        if (as.length && as.length !== 3) out.kesim.push(`${k.dataset.besin}: ${as.length} aşama`);
      });
      return out;
    });
    if (w === 1440 || w === 390) await sayfa.screenshot({ path: `rapor/tmp/kapi/${s.replace('.html', '')}-${w}.png`, fullPage: false });
    const sorun = [];
    if (kotu.length) sorun.push(`404:${kotu.length} (${kotu.slice(0, 3).join(', ')})`);
    if (jsHata.length) sorun.push(`JS:${jsHata[0].slice(0, 90)}`);
    if (r.yatay > 0) sorun.push(`yatay taşma ${r.yatay}px`);
    if (r.kirik.length) sorun.push(`kırık görsel ${r.kirik.length} (${r.kirik.slice(0, 2).join(', ')})`);
    if (r.kesik.length) sorun.push(`kesilme ${r.kesik.length} (${r.kesik.slice(0, 2).join(' | ')})`);
    if (r.gorselsiz.length) sorun.push(`görselsiz bölüm ${r.gorselsiz.length} (${r.gorselsiz.slice(0, 3).join(', ')})`);
    if (r.bitisik.length) sorun.push(`bitişik ${r.bitisik.length} (${r.bitisik[0]})`);
    if (r.alt.length) sorun.push(`alt metinsiz içerik görseli ${r.alt.length} (${r.alt.slice(0, 2).join(', ')})`);
    if (r.kesim.length) sorun.push(`kesim çizim=metin uyumsuz ${r.kesim.length} (${r.kesim.slice(0, 3).join(', ')})`);
    olcum++;
    if (sorun.length) hata++;
    console.log(`${sorun.length ? '✗' : '✓'} ${String(w).padEnd(4)} ${s}${sorun.length ? '  ' + sorun.join(' · ') : ''}`);
    await sayfa.close();
  }
  await bag.close();
}
await tarayici.close();
console.log(`\n${olcum - hata}/${olcum} ölçüm yeşil`);
process.exit(hata ? 1 : 0);
