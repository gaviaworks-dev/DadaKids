// Dolap kapısı ("Dolapta Ne Var?" bileşeni · src/kids/dolap.mjs + varlik/kids/js/kiler.js). Playwright Chromium.
// Sayfalar: kids-tarifler.html (kompakt) · kids-bebek-dolabi.html (tam) × 1440 · 390.
//  a kartlar: kategorili fotoğraflı malzeme kartları var; her kartın görseli varlik/kids/gorsel/urun/*.webp, yüklü, alt dolu
//  b eşleşme: havuç + patates → "Hemen yapabilirsin"de havuçlu patates püresi; malzeme eklemek sonucu değiştiriyor; iki grup başlığı doğru
//  c yaş: +6 Ay'da tavuklu sebze püresi (+8) yok, +9'da var (yaş sonuçları süzer)
//  d riskli: +24'te bal seçilir; +9'a inince bal dışlanır (şeritte dışlandı, kartta "1 yaş altı" uyarısı, durum metninde "Bal");
//    bütün kuruyemiş kartı +9'da seçilmez, uyarı görünür; v2 i ile uyumlu: "bal" yazıp Enter → eklenmez, ret bildirimi
//  e kiler: "Seçilenleri kilere ekle" → localStorage dadagastrokids.kiler.v1; temizle → "Kilerden dolaba yükle" seçimi geri getirir;
//    localStorage kapalıyken (erişim hata fırlatır) sayfa çökmez, kiler bellek içi çalışır
//  f taşma/kesilme: sayfada yatay taşma yok; bileşen içinde metni kırpılan (scrollWidth > clientWidth) ya da görünür alandan taşan öğe yok
//  g görseller: .kd-sayfa içindeki her <img>'in alt metni dolu (yalnız aria-hidden kapsamındaki UI ikonu svg/ui muaf); bileşende illüstrasyon/SVG içerik görseli yok
//    (img .svg yalnız svg/ui; satır içi svg ≤ 32px UI ikonu)
//  h JS hatası yok
// Kullanım: node araclar/dolap-kapisi.mjs   · TABAN=http://localhost:8765/DadaKids/ · GENISLIK=1440,390 · SAYFA=kids-bebek-dolabi
import { chromium } from 'playwright';

const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GENISLIK = (process.env.GENISLIK || '1440,390').split(',').map(Number);
const SUZ = (process.env.SAYFA || '').split(',').filter(Boolean);
const SAYFALAR = ['kids-tarifler.html', 'kids-bebek-dolabi.html'].filter((s) => !SUZ.length || SUZ.some((x) => s.includes(x)));
const DEPO = 'dadagastrokids.kiler.v1';
const sonuc = [];
const kaydet = (harf, w, sayfa, ayrinti) => sonuc.push({ harf, w, sayfa, ok: !ayrinti.length, ayrinti });
const t = await chromium.launch();
const bag = (w, ek = {}) => t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', ...ek });

async function hazirla(p, sayfa) {
  await p.goto(TABAN + sayfa, { waitUntil: 'networkidle' });
  const ac = p.locator('[data-kd-dolap-ac][aria-expanded="false"]');
  if (await ac.count()) await ac.click();
  await p.waitForTimeout(150);
}
const yasSec = async (p, y) => { await p.locator(`#kdYasSerit .kd-yas-chip[data-yas="${y}"]`).click(); await p.waitForTimeout(150); };
async function kartTikla(p, a) {
  const k = p.locator(`.kd-mz[data-a="${a}"]`);
  const u0 = p.url();
  if (!(await k.count())) return false;
  if (!(await k.isVisible())) await k.evaluate((e) => e.closest('.kd-dolap-kat').querySelector('.kd-dolap-kat__bas button').click());
  await k.scrollIntoViewIfNeeded();
  await k.dispatchEvent('click'); await p.waitForTimeout(120);   // aria-disabled (riskli) kart da tıklanabilir: tıklayınca gerekçe söylenir
  if (p.url().split('?')[0] !== u0.split('?')[0]) throw new Error(`${a} kartı tıklanınca sayfa değişti: ${p.url()}`);
  return true;
}
const temizle = async (p) => { const b = p.locator('[data-kd-dolap-temizle]'); if (await b.isVisible()) { await b.click(); await p.waitForTimeout(120); } };
const sonucSluglar = (p) => p.evaluate(() => {
  const g = (id) => [...document.querySelectorAll(`#${id} .kd-tarif [data-kd-kiler-ekle]`)].map((b) => b.getAttribute('data-kd-kiler-ekle'));
  return { tam: document.getElementById('kdDolapGrupTam').hidden ? [] : g('kdDolapGrupTam'), eksik: document.getElementById('kdDolapGrupEksik').hidden ? [] : g('kdDolapGrupEksik'), say: +document.getElementById('kdDolapSonucSay').textContent };
});

for (const sayfa of SAYFALAR) for (const w of GENISLIK) {
  const c = await bag(w); const p = await c.newPage();
  const jsHata = []; p.on('pageerror', (e) => jsHata.push(e.message));
  await hazirla(p, sayfa);

  /* a */
  {
    const s = [];
    const r = await p.evaluate(async () => {
      const kartlar = [...document.querySelectorAll('.kd-mz')];
      const kat = [...document.querySelectorAll('.kd-dolap-kat')].map((k) => k.dataset.kat);
      const kotu = [];
      for (const k of kartlar) {
        const i = k.querySelector('img');
        if (!i) { kotu.push(k.dataset.a + ': görsel yok'); continue; }
        if (!/varlik\/kids\/gorsel\/urun\/.+\.webp$/.test(i.getAttribute('src'))) kotu.push(k.dataset.a + ': ürün fotoğrafı değil ' + i.getAttribute('src'));
        if (!i.alt.trim()) kotu.push(k.dataset.a + ': alt boş');
        i.loading = 'eager'; if (!i.complete) await new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 3000); });
        if (!i.naturalWidth) kotu.push(k.dataset.a + ': görsel yüklenmedi');
      }
      return { n: kartlar.length, kat, kotu };
    });
    if (r.n < 40) s.push(`yalnız ${r.n} malzeme kartı`);
    for (const k of ['sebze', 'meyve', 'protein', 'tahil', 'sut', 'diger']) if (!r.kat.includes(k)) s.push(`kategori yok: ${k}`);
    s.push(...r.kotu.slice(0, 5));
    kaydet('a', w, sayfa, s);
  }

  /* b + c */
  {
    const s = [];
    await yasSec(p, '24');
    await kartTikla(p, 'havuc'); await kartTikla(p, 'patates');
    const r1 = await sonucSluglar(p);
    if (!r1.tam.includes('havuclu-patates-puresi')) s.push('havuç + patates → "Hemen yapabilirsin"de havuçlu patates püresi yok');
    const basliklar = await p.evaluate(() => [...document.querySelectorAll('.kd-dolap-grup:not([hidden]) .kd-dolap-grup__baslik')].map((h) => { const k = h.cloneNode(true); k.querySelectorAll('[aria-hidden="true"]').forEach((x) => x.remove()); return k.textContent.trim(); }));
    if (!basliklar.some((b) => /^Hemen yapabilirsin/.test(b))) s.push('"Hemen yapabilirsin" başlığı yok');
    if (r1.eksik.length && !basliklar.some((b) => /^1 malzeme eksik/.test(b))) s.push('"1 malzeme eksik" başlığı yok');
    const rozet = await p.evaluate(() => [...document.querySelectorAll('#kdDolapGrupEksik .kd-dolap-rozet')].map((e) => e.textContent.trim()));
    if (r1.eksik.length && !rozet.every((x) => /^Eksik: /.test(x))) s.push('eksik grubunda "Eksik: …" rozeti yok');
    await kartTikla(p, 'tavuk'); await kartTikla(p, 'kabak');
    const r2 = await sonucSluglar(p);
    if (JSON.stringify(r1) === JSON.stringify(r2)) s.push('malzeme eklenince sonuç değişmedi');
    if (!r2.tam.includes('tavuklu-sebze-puresi')) s.push('havuç+patates+tavuk+kabak → tavuklu sebze püresi hazır değil');
    kaydet('b', w, sayfa, s);
    const s2 = [];
    await yasSec(p, '6');
    const r3 = await sonucSluglar(p);
    if ([...r3.tam, ...r3.eksik].includes('tavuklu-sebze-puresi')) s2.push('+6 Ay seçiliyken +8 tarif (tavuklu sebze püresi) sonuçta');
    await yasSec(p, '9');
    const r4 = await sonucSluglar(p);
    if (!r4.tam.includes('tavuklu-sebze-puresi')) s2.push('+9 Ay seçiliyken tavuklu sebze püresi sonuçta yok');
    kaydet('c', w, sayfa, s2);
  }

  /* d */
  {
    const s = [];
    await temizle(p); await yasSec(p, '24');
    await kartTikla(p, 'bal');
    if (await p.getAttribute('.kd-mz[data-a="bal"]', 'aria-pressed') !== 'true') s.push('+24 Ay\'da bal seçilemedi');
    await yasSec(p, '9');
    const d = await p.evaluate(() => ({
      cip: !!document.querySelector('#kdDolapCipler .kd-dolap__cip--disi'),
      kart: document.querySelector('.kd-mz[data-a="bal"] .kd-mz__uyari')?.textContent.trim(),
      kartGor: (() => { const e = document.querySelector('.kd-mz[data-a="bal"] .kd-mz__uyari'); return !!e && e.getBoundingClientRect().height > 0; })(),
      uyari: document.getElementById('kdDolapUyari').textContent, ozet: document.getElementById('kdDolapOzet').textContent,
    }));
    if (!d.cip) s.push('yaş +9\'a inince bal şeritte dışlanmadı');
    if (!/1 yaş/.test(d.kart || '') || !d.kartGor) s.push(`bal kartında yaş uyarısı yok/görünmüyor ("${d.kart}")`);
    if (!/Bal/.test(d.uyari)) s.push('yaş değişince "Bal" uyarısı (role=status) yok');
    if (!/Bal[^.]*dışlandı/.test(d.ozet)) s.push('özet satırında "Bal … dışlandı" yok');
    await kartTikla(p, 'butun-kuruyemis');
    const k = await p.evaluate(() => ({ basili: document.querySelector('.kd-mz[data-a="butun-kuruyemis"]').getAttribute('aria-pressed'), uyari: document.getElementById('kdDolapUyari').textContent, kart: document.querySelector('.kd-mz[data-a="butun-kuruyemis"] .kd-mz__uyari').textContent }));
    if (k.basili === 'true') s.push('bütün kuruyemiş +9\'da seçildi');
    if (!/kuruyemiş/i.test(k.uyari) || !/5 yaş/.test(k.kart)) s.push('bütün kuruyemiş için ret uyarısı/kart uyarısı yok');
    await temizle(p);
    await p.fill('#kdDolapGir', 'bal'); await p.press('#kdDolapGir', 'Enter'); await p.waitForTimeout(150);
    const yazili = await p.evaluate(() => ({ cip: document.querySelectorAll('#kdDolapCipler li').length, uyari: document.getElementById('kdDolapUyari').textContent }));
    if (yazili.cip) s.push('"bal" yazıp Enter: dolaba eklendi');
    if (!/Bal/.test(yazili.uyari)) s.push('"bal" yazıp Enter: ret bildirimi yok');
    kaydet('d', w, sayfa, s);
  }

  /* e */
  {
    const s = [];
    await temizle(p); await yasSec(p, '9');
    await kartTikla(p, 'havuc'); await kartTikla(p, 'yogurt');
    const kaydetB = p.locator('[data-kd-kiler-kaydet]');
    if (!(await kaydetB.isVisible())) s.push('"Seçilenleri kilere ekle" görünmüyor');
    else {
      await kaydetB.click(); await p.waitForTimeout(150);
      const ls = await p.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, DEPO);
      if (!ls || !ls.malzemeler.includes('havuc') || !ls.malzemeler.includes('yogurt')) s.push('localStorage kiler kaydında havuç/yoğurt yok');
      await temizle(p);
      const yukle = p.locator('[data-kd-kiler-yukle]');
      if (!(await yukle.isVisible())) s.push('"Kilerden dolaba yükle" görünmüyor');
      else {
        await yukle.click(); await p.waitForTimeout(150);
        const n = await p.locator('#kdDolapCipler li').count();
        if (n < 2) s.push(`kilerden yükleyince dolapta ${n} malzeme`);
      }
    }
    // depolama kapalı
    const c2 = await bag(w); await c2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('depolama kapalı'); } }); });
    const p2 = await c2.newPage(); const h2 = []; p2.on('pageerror', (e) => h2.push(e.message));
    await hazirla(p2, sayfa); await yasSec(p2, '9');
    await kartTikla(p2, 'havuc');
    const kb = p2.locator('[data-kd-kiler-kaydet]');
    if (await kb.isVisible()) {
      await kb.click(); await p2.waitForTimeout(150);
      const txt = await p2.evaluate(() => document.getElementById('kdDolapUyari').textContent + ' | ' + document.getElementById('kdKilerSayi').textContent);
      if (!/bu oturumda/.test(txt)) s.push('depolama kapalıyken "yalnız bu oturumda" bildirimi yok');
    } else s.push('depolama kapalıyken kilere ekle düğmesi yok');
    if (h2.length) s.push('depolama kapalıyken JS hatası: ' + h2[0].slice(0, 80));
    await c2.close();
    kaydet('e', w, sayfa, s);
  }

  /* f + g (seçimli, sonuçlu hâlde) */
  {
    await temizle(p); await yasSec(p, '24');
    for (const a of ['havuc', 'patates', 'yumurta', 'kabak', 'yogurt', 'bal']) await kartTikla(p, a);
    await p.evaluate(() => document.querySelectorAll('.kd-dolap-kat__bas button[aria-expanded="false"]').forEach((b) => b.click()));
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => {
      const f = [], g = [];
      const tasma = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      if (tasma > 0) f.push(`sayfa yatay taşma ${tasma}px`);
      const kok = document.getElementById('dolap');
      const gor = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      kok.querySelectorAll('*').forEach((e) => {
        if (!gor(e) || e.closest('template, .kd-gizli, svg')) return;
        const cs = getComputedStyle(e), r = e.getBoundingClientRect();
        if (r.right > innerWidth + 1 || r.left < -1) f.push(`görünür alan dışı: ${e.className || e.tagName} (${Math.round(r.left)}–${Math.round(r.right)})`);
        const metin = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (metin && (cs.overflowX !== 'visible' || cs.textOverflow === 'ellipsis') && e.scrollWidth > e.clientWidth + 1) f.push(`kırpılan metin: ${String(e.className).slice(0, 40)} "${e.textContent.trim().slice(0, 24)}"`);
      });
      // kapsam: tam sayfada (kids-bebek-dolabi) tüm .kd-sayfa; Kids Tarifleri'nde yalnız bileşen (#dolap) — katalogdaki dekoratif
      // fotoIkon/bosDurum görselleri (alt="" + aria-hidden, foto-genel) bilgi olarak yazılır, kırmızı sayılmaz
      const tam = /kids-bebek-dolabi/.test(location.pathname);
      document.querySelectorAll(tam ? '.kd-sayfa img' : '#dolap img').forEach((i) => {
        const ui = /varlik\/kids\/svg\/ui\//.test(i.getAttribute('src') || '') && !!i.closest('[aria-hidden="true"]');
        if (!ui && !i.alt.trim()) g.push(`alt boş: ${(i.getAttribute('src') || '').slice(-50)}`);
      });
      kok.querySelectorAll('img').forEach((i) => { const s = i.getAttribute('src') || ''; if (/\.svg($|\?)/.test(s) && !/svg\/ui\//.test(s)) g.push(`SVG içerik görseli: ${s}`); if (/(illus|maskot|putur)\//.test(s)) g.push(`illüstrasyon: ${s}`); });
      kok.querySelectorAll('svg').forEach((s) => { const r = s.getBoundingClientRect(); if (r.width > 32 || r.height > 32) g.push(`büyük satır içi SVG ${Math.round(r.width)}×${Math.round(r.height)} (${s.parentElement.className})`); });
      const bilgi = tam ? [] : [...document.querySelectorAll('.kd-sayfa img')].filter((i) => !kok.contains(i) && !i.alt.trim() && !/svg\/ui\//.test(i.getAttribute('src') || '')).map((i) => (i.getAttribute('src') || '').slice(-40));
      return { f: [...new Set(f)], g: [...new Set(g)], bilgi: [...new Set(bilgi)] };
    });
    kaydet('f', w, sayfa, r.f.slice(0, 6));
    kaydet('g', w, sayfa, r.g.slice(0, 6));
    if (r.bilgi.length) console.log(`  bilgi (${sayfa} ${w}): bileşen dışında dekoratif boş alt: ${r.bilgi.join(', ')}`);
  }
  kaydet('h', w, sayfa, jsHata.slice(0, 3));
  await c.close();
}
await t.close();

const ad = { a: 'kartlar (foto + alt)', b: 'eşleşme / iki grup', c: 'yaş sonuçları süzer', d: 'riskli (bal, bütün kuruyemiş)', e: 'Bebek Kilerim', f: 'taşma / kesilme', g: 'alt metin, illüstrasyon yok', h: 'JS hatası' };
let kirmizi = 0;
for (const r of sonuc) { if (!r.ok) kirmizi++; console.log(`${r.ok ? '✓' : '✗'} ${r.harf} ${ad[r.harf].padEnd(30)} ${String(r.w).padStart(4)} ${r.sayfa}${r.ok ? '' : '\n    ' + r.ayrinti.join('\n    ')}`); }
console.log(`\nDolap kapısı: ${sonuc.length - kirmizi}/${sonuc.length} yeşil`);
process.exit(kirmizi ? 1 : 0);
