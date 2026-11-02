// Gölge kapısı (Beyar 2 Kas): Kids'te kart/buton/sekme/çipte gölge yok; kartlar Gastro kart stilinde; Kids barı Gastro nav gibi düz.
// Ölçüt değerleri kaynaktan ölçülür (sabit yazılmaz): Gastro tarifler.html ilk .r-card → çerçeve rengi/kalınlığı + köşe (RK).
// Denetim (her Kids sayfası + index'teki Kids bandı; 1440 ve 390; reducedMotion):
//  a. Kids öğesinde (sınıfı kd- ile başlayan ya da içindeki) GÖRÜNÜR GÖLGE yok: saydam olmayan bir katman ki
//     dış + (bulanıklık > 0 ya da x/y kayması ≠ 0)  → düşen gölge,  ya da  iç + y kayması ≠ 0 → "3D" alt/üst çizgi.
//     Serbest: yalnız yayılmalı halka (0 0 0 Npx, çerçeve gibi), sol/sağ iç gösterge (inset Npx 0 0).
//     Muaf (kart değil, yüzen katman / hero görseli): YUZEN listesi.
//  b. KARTLAR: box-shadow 'none', 4 kenar çerçeve 1px (solid; boş öğün yuvası dashed), köşe = RK, renk = Gastro çizgisi
//     (seçili evre kartı / basılı dolap kartı kendi vurgu rengini taşır → renk denetiminden muaf).
//  c. Hover (1440, sayfa başına en çok 6 etkileşimli kart): transform 'none', box-shadow 'none', konum/boyut değişmez (kalkma/büyüme yok),
//     içindeki img transform 'none'.
//  d. Kids barı (.kd-ust__menu > a): box-shadow 'none'; aktif öğe zeminsiz (Gastro .nav a.active gibi yalnız renk).
// Kullanım: node araclar/golge-kapisi.mjs · TABAN=… · GENISLIK=1440,390 · SAYFA=kids.html,…   BOZ=1 → karta gölge + hover kalkma yazar (kırmızı vermeli)
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GENISLIK = (process.env.GENISLIK || '1440,390').split(',').map(Number);
const SUZ = (process.env.SAYFA || '').split(',').filter(Boolean);
const SAYFALAR = [...readdirSync('.').filter((f) => /^kids(-.+)?\.html$/.test(f) && f !== 'kids-tarif.html').sort(), 'kids-tarif.html?t=balkabagi-puresi', 'index.html']
  .filter((s) => !SUZ.length || SUZ.some((x) => s.includes(x)));
// varlik/kids/kids.css "KARTLAR = Gastro kart stili" bloğuyla aynı liste
const KARTLAR = '.kd-kart, .kd-evre, .kd-mkart, .kd-ar-mini, .kd-ar-panel, .kd-at-kayit, .kd-pr-panel, .kd-pr-ipucu, .kd-pl-slot, .kd-hm-sonuc, .kd-kesim, .kd-kokuma, .kd-kbogulma__liste li, .kd-murun, .kd-mkahraman, .kd-mmevsim, .kd-may, .kd-mtab__liste, .kd-mneden__liste li, .kd-mbilgi, .kd-rmozaik__oge, .kd-rsonraki, .kd-rtoc__kutu, .kd-rtablo-kap, .kd-rhero-ikon, .kd-dsonraki__kart, .kd-dhap, .kd-dpanel, .kd-dsekme__panel, .kd-dtablo-kap, .kd-td-buyur__kart, .kd-td-malz, .kd-td-adimlar li, .kd-mz, .kd-dolap, .kd-sss__oge, .kd-hub-besin, .kd-hub-kesim, .kd-hub-donem__liste';
const ETKILESIMLI = 'a.kd-kart, article.kd-tarif, .kd-ar-kart, a.kd-evre, .kd-ar-mini, .kd-murun, .kd-mz, .kd-rsonraki, .kd-dsonraki__kart, .kd-td-buyur__kart, .kd-rmozaik__oge, .kd-mmevsim';
const YUZEN = '.kd-ds__panel, .kd-ds__panel *, .kd-dolap__oneri, .kd-dolap__oneri *, .kd-yardim, .kd-yardim *, .kd-profil, .kd-kiler-bildirim, .kd-kiler-bildirim *, .kd-ust, .kd-pt, .kd-pt *, [class*="putur"], [class*="putur"] *, .kd-hero__gorsel img, .kd-hero__gorsel > img, .kd-dkolaj__oge, .kd-td-foto img, [role="switch"], [class*="anahtar"]';
const BOZ_CSS = 'html:root body .kd-sayfa :is(.kd-kart, .kd-murun, .kd-evre):hover { transform: translateY(-4px) !important; } .kd-ust__menu > a[aria-current] { box-shadow: inset 0 -2px 0 #1F7A68 !important; }';

const t = await chromium.launch();
let G = null, kirmizi = 0, toplam = 0;
{ // ölçüm: Gastro tarif kartı
  const p = await t.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(TABAN + 'tarifler.html', { waitUntil: 'domcontentloaded' });
  G = await p.evaluate(() => { const k = document.querySelector('.r-card'); if (!k) return null; const c = getComputedStyle(k); return { r: parseFloat(c.borderTopLeftRadius), w: parseFloat(c.borderTopWidth), renk: c.borderTopColor }; });
  await p.close();
  if (!G) { console.log('✗ Gastro .r-card ölçülemedi'); process.exit(1); }
  console.log(`Gastro kart: köşe ${G.r}px · çerçeve ${G.w}px ${G.renk}`);
}
for (const w of GENISLIK) {
  const ctx = await t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
  for (const s of SAYFALAR) {
    const p = await ctx.newPage();
    const jsHata = []; p.on('pageerror', (e) => jsHata.push(e.message));
    const yanit = await p.goto(TABAN + s, { waitUntil: 'networkidle' }).catch(() => null);
    if (process.env.BOZ) { await p.addStyleTag({ content: BOZ_CSS }); await p.evaluate(() => { const k = [...document.querySelectorAll('.kd-sayfa :is(.kd-kart, .kd-murun, .kd-evre)')].find((x) => x.getClientRects().length); if (k) k.style.setProperty('box-shadow', '0 4px 14px rgba(0,0,0,.25)', 'important'); }); }
    await p.waitForTimeout(200);
    const hatalar = await p.evaluate(({ KARTLAR, YUZEN, G }) => {
      const out = [];
      const kdTok = (x) => typeof x.className === 'string' && x.className.split(/\s+/).some((c) => c.startsWith('kd-'));
      const kidsMi = (e) => { if (e.closest('header.header, .topbar, footer, .footer, .drawer')) return false; for (let x = e; x && x !== document.body; x = x.parentElement) if (kdTok(x)) return true; return false; };
      const ad = (e) => (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') || e.tagName.toLowerCase();
      const gorunur = (e) => { const c = getComputedStyle(e), r = e.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05 && r.width >= 4 && r.height >= 4 && e.getClientRects().length; };
      // box-shadow katmanlarını ayır: "rgba(…) 0px 4px 14px -8px inset"
      const katmanlar = (v) => v === 'none' ? [] : v.split(/,(?![^(]*\))/).map((k) => {
        const renk = (k.match(/(rgba?|color)\([^)]*\)/) || [''])[0];
        const sayi = k.replace(renk, '').match(/-?[\d.]+px/g)?.map(parseFloat) || [];
        const a = /rgba\(/.test(renk) ? parseFloat(renk.split(',')[3]) : /color\(/.test(renk) ? parseFloat((renk.match(/\/\s*([\d.]+)/) || [0, 1])[1]) : 1;
        return { inset: /inset/.test(k), x: sayi[0] || 0, y: sayi[1] || 0, blur: sayi[2] || 0, yay: sayi[3] || 0, a: renk === 'transparent' ? 0 : a };
      });
      for (const e of document.querySelectorAll('body *')) {
        if (e instanceof SVGElement || !kidsMi(e) || !gorunur(e) || e.matches(YUZEN)) continue;
        if (getComputedStyle(e).position === 'fixed') continue;   // mobil alt sheet vb. yüzen katman
        for (const k of katmanlar(getComputedStyle(e).boxShadow)) {
          if (k.a <= 0.001) continue;
          if (!k.inset && (k.blur > 0 || k.x || k.y)) { out.push(`düşen gölge ${ad(e)} (${k.x} ${k.y} ${k.blur})`); break; }
          if (k.inset && k.y) { out.push(`3D çizgi ${ad(e)} (inset 0 ${k.y}px)`); break; }
        }
      }
      for (const e of document.querySelectorAll(KARTLAR)) {
        if (!kidsMi(e) || !gorunur(e)) continue;
        const c = getComputedStyle(e);
        if (c.boxShadow !== 'none') out.push(`kartta box-shadow ${ad(e)}`);
        const kenar = ['Top', 'Right', 'Bottom', 'Left'].every((k) => Math.abs(parseFloat(c['border' + k + 'Width']) - G.w) < 0.3 && /solid|dashed/.test(c['border' + k + 'Style']));
        if (!kenar) out.push(`kart çerçevesi ${ad(e)} (${c.borderTopWidth} ${c.borderTopStyle})`);
        const r = parseFloat(c.borderTopLeftRadius);
        if (Math.abs(r - G.r) > 0.5) out.push(`kart köşesi ${ad(e)} ${r}px`);
        const vurgulu = e.matches('[aria-current="true"], [aria-pressed="true"], .kd-pl-slot:not([data-dolu])');
        if (!vurgulu && c.borderTopColor !== G.renk && !e.matches(':hover')) out.push(`kart çerçeve rengi ${ad(e)} ${c.borderTopColor}`);
      }
      for (const a of document.querySelectorAll('.kd-ust__menu > a')) {
        const c = getComputedStyle(a);
        if (c.boxShadow !== 'none') out.push(`Kids barı gölge ${ad(a)} ${c.boxShadow}`);
        if (a.getAttribute('aria-current') === 'page' && !/rgba\([^)]*,\s*0\)|transparent/.test(c.backgroundColor)) out.push(`Kids barı aktif zemin ${ad(a)} ${c.backgroundColor}`);
      }
      return [...new Set(out)];
    }, { KARTLAR, YUZEN, G });
    if (w >= 1024) { // c. hover
      const kartlar = await p.locator(ETKILESIMLI).all();
      let n = 0;
      for (const k of kartlar) {
        if (n >= 6) break;
        if (!(await k.isVisible().catch(() => false))) continue;
        n++;
        await k.scrollIntoViewIfNeeded().catch(() => {});
        await p.mouse.move(2, 2); await p.waitForTimeout(60);
        const once = await k.boundingBox();
        await k.hover({ force: true, timeout: 3000 }).catch(() => {});
        await p.waitForTimeout(420);
        const sonra = await k.boundingBox();
        const st = await k.evaluate((e) => { const c = getComputedStyle(e); return { tf: c.transform, sh: c.boxShadow, img: [...e.querySelectorAll('img')].map((i) => getComputedStyle(i).transform).find((x) => x !== 'none') || 'none', ad: e.className.split(' ').slice(0, 2).join('.') }; });
        const kayma = once && sonra ? Math.max(Math.abs(once.y - sonra.y), Math.abs(once.width - sonra.width), Math.abs(once.height - sonra.height)) : 0;
        if (st.tf !== 'none' || st.sh !== 'none' || st.img !== 'none' || kayma > 0.5) hatalar.push(`hover ${st.ad}: transform ${st.tf} · gölge ${st.sh === 'none' ? '-' : 'VAR'} · img ${st.img} · kayma ${kayma.toFixed(1)}px`);
      }
    }
    if (!yanit || yanit.status() !== 200) hatalar.push(`HTTP ${yanit ? yanit.status() : 'yok'}`);
    if (jsHata.length) hatalar.push('JS: ' + jsHata.join(' | '));
    toplam++;
    if (hatalar.length) { kirmizi++; console.log(`✗ ${w} ${s}\n   ${hatalar.slice(0, 12).join('\n   ')}${hatalar.length > 12 ? `\n   … +${hatalar.length - 12}` : ''}`); }
    else console.log(`✓ ${w} ${s}`);
    await p.close();
  }
  await ctx.close();
}
await t.close();
console.log(`${kirmizi ? '✗' : '✓'} gölge kapısı ${toplam - kirmizi}/${toplam}`);
process.exit(kirmizi ? 1 : 0);
