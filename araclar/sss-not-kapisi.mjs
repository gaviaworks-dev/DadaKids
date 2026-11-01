// SSS + not kapısı (Beyar 1 Kas EK'leri)
//  s · SSS tek-açık akordeon: varsayılan hepsi kapalı · tıkla aç · yenisi açılınca eskisi kapanır · tekrar tık kapatır ·
//      Enter/Space ile açılır · #<soru-id> ile açılır · + → × dönüşü · reduced-motion'da geçiş 0 · button aria-expanded/aria-controls ·
//      "Sorunuz burada yoksa…" kutusu listeyle aynı genişlikte (±1px) · besin kartları (.kd-mkart) akordeon değil
//  n · "Örnek içerik / uzman onayı bekliyor / tıbbi tavsiye yerine geçmez / prototip … onayından geçmeden / İnceleme bekliyor" ifadeleri 0
//      (görünür metin + Yardım/Pütür panelleri açıkken + varlık JS'leri, yorum satırları hariç) · güven rozeti / inceleyen / örnek / onay öğesi 0
//      (veri/uzman-onay.json onayli:false iken) · "uzman onaylı" benzeri iddia 0 · güvenlik şeridi ve 112 yönlendirmesi KALIR
//  t · 1440 ve 390'da yatay taşma yok
// Kullanım: node araclar/sss-not-kapisi.mjs  · TABAN=… · GENISLIK=1440,390
import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'node:fs';
const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GEN = (process.env.GENISLIK || '1440,390').split(',').map(Number);
const SAYFALAR = [...readdirSync('.').filter((f) => /^kids(-.+)?\.html$/.test(f)).sort(), 'kids-tarif.html?t=balkabagi-puresi', 'index.html', 'tarifler.html'];
const YASAK = [/örnek içerik/i, /uzman onayı bekliyor/i, /tıbbi tavsiye yerine geçmez/i, /örnektir\b/i, /onayından geçmeden/i, /İnceleme bekliyor/, /prototip örneğidir/i, /uzman incelemesinden geçmedi/i, /prototip için hazırlanmış/i];
const IDDIA = [/uzman onaylı/i, /doktor onaylı/i, /onaylı bilgiler/i, /pediatrist/i];
const ONAYLI = JSON.parse(readFileSync('veri/uzman-onay.json', 'utf8')).onayli === true;
let hata = 0, olcum = 0;
const yaz = (ok, s, satir = []) => { olcum++; if (!ok) hata++; console.log(`${ok ? '✓' : '✗'} ${s}`); satir.forEach((x) => console.log('    ', x)); };

// n (statik): varlık JS'leri — yorum dışı satırlarda yasak ifade yok
{
  const bul = [];
  for (const f of readdirSync('varlik/kids/js')) {
    if (!f.endsWith('.js')) continue;
    readFileSync('varlik/kids/js/' + f, 'utf8').split('\n').forEach((l, i) => {
      const kod = l.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '').replace(/\/\*.*?\*\//g, '');
      if (YASAK.some((r) => r.test(kod)) || IDDIA.some((r) => r.test(kod))) bul.push(`${f}:${i + 1} ${l.trim().slice(0, 90)}`);
    });
  }
  yaz(!bul.length, `[n] varlik/kids/js yorum dışı not/iddia ifadesi 0`, bul);
}

const t = await chromium.launch();
for (const w of GEN) {
  const bag = await t.newContext({ viewport: { width: w, height: w > 600 ? 900 : 844 } });
  for (const s of SAYFALAR) {
    const p = await bag.newPage();
    const r = await p.goto(TABAN + s, { waitUntil: 'networkidle' }).catch(() => null);
    if (!r || r.status() >= 400) { yaz(false, `[t] ${w} ${s} yüklenemedi`); await p.close(); continue; }
    await p.waitForTimeout(250);
    // n · görünür metin + Yardım paneli + Pütür menüsü açıkken
    const metinler = [await p.evaluate(() => document.body.innerText)];
    for (const sec of ['.kd-yardim-ac', '[data-kd-yardim-ac]']) { const d = await p.$(sec); if (d && await d.isVisible()) { await d.click().catch(() => {}); await p.waitForTimeout(300); metinler.push(await p.evaluate(() => document.body.innerText)); await p.keyboard.press('Escape'); break; } }
    const tum = metinler.join('\n');
    const nb = [...YASAK, ...IDDIA].filter((r) => r.test(tum)).map((r) => { const m = tum.match(new RegExp(`.{0,40}${r.source}.{0,40}`, r.flags.replace('g', ''))); return `${r.source}: "${m ? m[0].replace(/\s+/g, ' ') : ''}"`; });
    const og = await p.evaluate(() => ({ rozet: [...document.querySelectorAll('.kd-guven-rozet, .kd-inceleyen, .kd-ornek, .kd-onay, .kd-yd__ornek, .kd-pt__ornek, .kd-kbogulma__ornek')].filter((e) => !e.closest('[hidden]') && e.getClientRects().length).length, serit: document.querySelectorAll('.kd-guvenlik-serit').length }));
    if (!ONAYLI && og.rozet) nb.push(`onaysızken güven/örnek öğesi ${og.rozet} adet`);
    yaz(!nb.length, `[n] ${w} ${s}${og.serit ? ' (güvenlik şeridi var)' : ''}`, nb);
    // t · taşma
    const tas = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    yaz(tas <= 1, `[t] ${w} ${s} yatay taşma ${tas}px`);
    // s · SSS
    const n = await p.locator('[data-kd-sss] .kd-sss__oge').count();
    if (n) {
      const sb = [];
      const durum = () => p.evaluate(() => [...document.querySelectorAll('[data-kd-sss] .kd-sss__oge')].map((o) => { const d = o.querySelector('.kd-sss__dugme'); const c = document.getElementById(d.getAttribute('aria-controls')); const r = c.getBoundingClientRect(); return { acik: d.getAttribute('aria-expanded') === 'true', h: Math.round(r.height), gor: getComputedStyle(c).visibility !== 'hidden', rol: c.getAttribute('role'), ctl: !!c, tag: d.tagName, don: getComputedStyle(o.querySelector('.kd-sss__ikon')).transform }; }));
      let d0 = await durum();
      if (d0.some((x) => x.acik || x.h > 2 || x.gor)) sb.push(`varsayılan kapalı değil: ${d0.map((x) => +x.acik).join('')}`);
      if (d0.some((x) => x.tag !== 'BUTTON' || !x.ctl || x.rol !== 'region')) sb.push('button/aria-controls/region eksik');
      const dug = p.locator('[data-kd-sss] .kd-sss__dugme');
      await dug.nth(0).click(); await p.waitForTimeout(400);
      let d1 = await durum();
      if (!d1[0].acik || d1[0].h < 10 || !d1[0].gor) sb.push('1. soru tıklayınca açılmadı');
      if (d1[0].don === 'none') sb.push('ikon dönüşü yok (+ → ×)');
      if (n > 1) {
        await dug.nth(1).click(); await p.waitForTimeout(400);
        const d2 = await durum();
        if (d2[0].acik || d2[0].h > 2) sb.push('2. açılınca 1. kapanmadı');
        if (!d2[1].acik) sb.push('2. soru açılmadı');
        if (d2.filter((x) => x.acik).length > 1) sb.push('aynı anda birden çok açık');
        await dug.nth(1).click(); await p.waitForTimeout(400);
        if ((await durum()).some((x) => x.acik)) sb.push('açık soruya tekrar tık kapatmadı');
      }
      const k = Math.min(n - 1, 2);
      await dug.nth(k).focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
      if (!(await durum())[k].acik) sb.push('Enter ile açılmadı');
      await p.keyboard.press('Space'); await p.waitForTimeout(400);
      if ((await durum())[k].acik) sb.push('Space ile kapanmadı');
      // genişlik: not kutusu = liste
      const gen = await p.evaluate(() => { const g = document.querySelector('[data-kd-sss]'); const l = g.querySelector('.kd-sss__liste').getBoundingClientRect(); const nn = g.querySelector('.kd-sss__not > *'); if (!nn) return null; const r = nn.getBoundingClientRect(); return { l: [Math.round(l.left), Math.round(l.width)], n: [Math.round(r.left), Math.round(r.width)] }; });
      if (gen && (Math.abs(gen.l[0] - gen.n[0]) > 1 || Math.abs(gen.l[1] - gen.n[1]) > 1)) sb.push(`not kutusu liste genişliğinde değil: liste x${gen.l[0]} w${gen.l[1]} · not x${gen.n[0]} w${gen.n[1]}`);
      // hash
      const id = await p.evaluate(() => document.querySelectorAll('[data-kd-sss] .kd-sss__oge')[Math.min(1, document.querySelectorAll('[data-kd-sss] .kd-sss__oge').length - 1)].id);
      const q = await bag.newPage(); await q.goto(TABAN + s.replace(/#.*/, '') + '#' + id, { waitUntil: 'networkidle' }); await q.waitForTimeout(500);
      const hs = await q.evaluate((i) => document.getElementById(i).querySelector('.kd-sss__dugme').getAttribute('aria-expanded'), id);
      if (hs !== 'true') sb.push(`#${id} ile açılmadı`);
      await q.close();
      // reduced-motion
      const rm = await bag.newPage(); await rm.emulateMedia({ reducedMotion: 'reduce' }); await rm.goto(TABAN + s, { waitUntil: 'networkidle' });
      const sure = await rm.evaluate(() => { const c = document.querySelector('[data-kd-sss] .kd-sss__cevap'); return getComputedStyle(c).transitionDuration; });
      if (!/^0s(, 0s)*$/.test(sure)) sb.push(`reduced-motion geçiş süresi ${sure}`);
      await rm.close();
      // besin kartları akordeon değil
      const mk = await p.evaluate(() => document.querySelectorAll('.kd-mkart [aria-expanded], .kd-mkart details').length);
      if (mk) sb.push(`besin kartında akordeon öğesi ${mk}`);
      yaz(!sb.length, `[s] ${w} ${s} SSS ${n} soru`, sb);
    }
    await p.close();
  }
  await bag.close();
}
await t.close();
console.log(`\n${olcum - hata}/${olcum} SSS+not ölçümü ${hata ? 'KIRMIZI' : 'yeşil'}`);
process.exit(hata ? 1 : 0);
