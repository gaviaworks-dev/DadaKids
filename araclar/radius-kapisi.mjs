// Radius kapısı (Beyar Revize 2 Kas R2): Kids öğelerinde köşe yarıçapı TEK DEĞER = Dada Gastro buton köşesi.
// Değer kaynaktan ölçülür: Gastro header "Giriş Yap" (.btn-login) border-radius → R (12px). Sabit yazılmaz.
// Denetim (her Kids sayfası + index/tarifler'deki Kids öğeleri; 1440 ve 390; reducedMotion):
//  1. Sıfır olmayan her köşe = R (±0,5). Kısmi köşe (ör. alt sheet "R R 0 0") serbest.
//  2. Kutu görünümlü öğe (dolgu ebeveynden farklı · 4 kenar çerçeve · gölge · form alanı · ≥96px görsel) keskin köşeli olamaz.
//     Muaf: tam genişlik bant (≥ %90 görünüm), tablo hücresi/satırı, yuvarlak kırpan atanın kenarına oturan iç parça.
//  İstisna: gerçek daire (|w−h| ≤ 2, r ≥ yarı kenar − 1) ve tam yuvarlak switch (role=switch / .kd-anahtar izi).
// Kids öğesi: sınıfı "kd-" ile başlayan öğe ya da onun içindekiler; Gastro header/topbar/footer içi hariç (Kids rozeti CSS ::after).
// Kullanım: node araclar/radius-kapisi.mjs · TABAN=… · GENISLIK=1440,390 · SAYFA=kids.html,…   BOZ=1 → bir karta 8px yazar (kırmızı vermeli)
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GENISLIK = (process.env.GENISLIK || '1440,390').split(',').map(Number);
const SUZ = (process.env.SAYFA || '').split(',').filter(Boolean);
const SAYFALAR = [...readdirSync('.').filter((f) => /^kids(-.+)?\.html$/.test(f)).sort(), 'kids-tarif.html?t=balkabagi-puresi', 'index.html', 'tarifler.html']
  .filter((s) => !SUZ.length || SUZ.some((x) => s.includes(x)));

const t = await chromium.launch();
let R = null, RK = null, kirmizi = 0, toplam = 0;
// Gölgesiz kart kararı (Beyar 2 Kas): kartlar Gastro kart köşesini taşır (tarifler.html .r-card → RK, 16px). Liste golge-kapisi.mjs KARTLAR ile aynı.
const KARTLAR = '.kd-kart, .kd-evre, .kd-mkart, .kd-ar-mini, .kd-ar-panel, .kd-at-kayit, .kd-pr-panel, .kd-pr-ipucu, .kd-pl-slot, .kd-hm-sonuc, .kd-kesim, .kd-kokuma, .kd-kbogulma__liste li, .kd-murun, .kd-mkahraman, .kd-mmevsim, .kd-may, .kd-mtab__liste, .kd-mneden__liste li, .kd-mbilgi, .kd-rmozaik__oge, .kd-rsonraki, .kd-rtoc__kutu, .kd-rtablo-kap, .kd-rhero-ikon, .kd-dsonraki__kart, .kd-dhap, .kd-dpanel, .kd-dsekme__panel, .kd-dtablo-kap, .kd-td-buyur__kart, .kd-td-malz, .kd-td-adimlar li, .kd-mz, .kd-dolap, .kd-sss__oge, .kd-hub-besin, .kd-hub-kesim, .kd-hub-donem__liste';
{ // ölçüm: Gastro "Giriş Yap"
  const p = await t.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(TABAN + 'index.html', { waitUntil: 'domcontentloaded' });
  R = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((e) => /Giriş Yap/.test(e.textContent) && e.offsetWidth); return b ? parseFloat(getComputedStyle(b).borderTopLeftRadius) : null; });
  if (!R) { console.log('✗ Gastro "Giriş Yap" düğmesi ölçülemedi'); process.exit(1); }
  await p.goto(TABAN + 'tarifler.html', { waitUntil: 'domcontentloaded' });
  RK = await p.evaluate(() => { const k = document.querySelector('.r-card'); return k ? parseFloat(getComputedStyle(k).borderTopLeftRadius) : null; });
  await p.close();
  if (!RK) { console.log('✗ Gastro .r-card ölçülemedi'); process.exit(1); }
  console.log(`Gastro buton köşesi (Giriş Yap): ${R}px → Kids tek değer · Gastro kart köşesi ${RK}px → Kids kartları`);
}
for (const w of GENISLIK) {
  const ctx = await t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
  for (const s of SAYFALAR) {
    const p = await ctx.newPage();
    await p.goto(TABAN + s, { waitUntil: 'networkidle' }).catch(() => {});
    if (process.env.BOZ) await p.addStyleTag({ content: process.env.BOZ === 'keskin' ? '.kd-kart, .kd-kutu, .kd-chip { border-radius: 0 !important; }' : '.kd-tarif, .kd-kart, .kd-kutu { border-radius: 8px !important; }' });
    await p.waitForTimeout(200);
    const hatalar = await p.evaluate(({ R, RK, KARTLAR }) => {
      const vw = innerWidth, out = [];
      const kdTok = (x) => typeof x.className === 'string' && x.className.split(/\s+/).some((c) => c.startsWith('kd-'));
      const kidsMi = (e) => { if (e.closest('header.header, .topbar, .ust-bant, footer, .footer, .drawer')) return false; for (let x = e; x && x !== document.body; x = x.parentElement) if (kdTok(x)) return true; return false; };
      const ad = (e) => (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') || e.tagName.toLowerCase();
      const seffaf = (c) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);
      const zemin = (e) => { for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; if (!seffaf(c)) return c; } return 'rgb(255, 255, 255)'; };
      const gorunur = (e, c, r) => c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05 && r.width >= 10 && r.height >= 10 && !e.closest('[hidden], [aria-hidden="true"] [hidden]');
      for (const e of document.querySelectorAll('body *')) {
        if (e instanceof SVGElement || /^(SCRIPT|STYLE|TEMPLATE|BR|SOURCE|TD|TH|TR|THEAD|TBODY|OPTION)$/.test(e.tagName)) continue;
        if (!kidsMi(e)) continue;
        const c = getComputedStyle(e), r = e.getBoundingClientRect();
        if (!gorunur(e, c, r) || !e.getClientRects().length) continue;
        const ham = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((k) => { const v = c['border' + k + 'Radius'].split(' ')[0]; return v.endsWith('%') ? parseFloat(v) / 100 * r.width : parseFloat(v) || 0; });
        const yarim = Math.min(r.width, r.height) / 2;
        if (Math.abs(r.width - r.height) <= 2 && ham.every((x) => x >= yarim - 1)) continue;                    // gerçek daire
        if (e.matches('[role="switch"], [role="switch"] *, [class*="anahtar"], [class*="anahtar"] *, [class*="switch"]')) continue; // tam yuvarlak switch
        // Gastro paritesi: Gastro sayfasındaki Kids girişi Gastro bileşen sınıfını taşıyorsa (ör. .chip.kd-chip-gastro) Kids-dışı kardeşleriyle aynı köşede kalır
        const gs = typeof e.className === 'string' ? e.className.trim().split(/\s+/).find((x) => x && !x.startsWith('kd-')) : null;
        if (gs && !e.closest('.kd-sayfa, .kd-ust') && [...document.getElementsByClassName(gs)].some((x) => x !== e && !kidsMi(x) && getComputedStyle(x).borderTopLeftRadius === c.borderTopLeftRadius)) continue;
        if (ham.some((x) => x > 0)) {
          const hedef = e.matches(KARTLAR) ? RK : R;
          if (ham.some((x) => x > 0 && Math.abs(x - hedef) > 0.5)) out.push(`farklı köşe ${ad(e)} ${ham.map((x) => Math.round(x * 10) / 10).join('/')} (${Math.round(r.width)}×${Math.round(r.height)})`);
          continue;
        }
        // keskin köşe: kutu görünümlü mü?
        if (r.width >= vw * 0.9) continue;                                                                       // tam genişlik bant / şerit
        const kenar4 = ['Top', 'Right', 'Bottom', 'Left'].every((k) => parseFloat(c['border' + k + 'Width']) > 0 && c['border' + k + 'Style'] !== 'none');
        const golge = c.boxShadow !== 'none' && !/^rgba?\([^)]*\) 0px 0px 0px 0px/.test(c.boxShadow);
        const form = /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(e.tagName) && !['checkbox', 'radio', 'hidden', 'range'].includes(e.type) && (kenar4 || !seffaf(c.backgroundColor) || golge);
        const gorsel = /^(IMG|VIDEO|PICTURE|CANVAS)$/.test(e.tagName) && r.width >= 96 && r.height >= 96 && !/\.png|pixar|seffaf/i.test(e.currentSrc || e.className);
        const dolgu = !seffaf(c.backgroundColor) && c.backgroundColor !== zemin(e.parentElement || document.body);
        if (!(kenar4 || golge || form || gorsel || dolgu)) continue;
        // yuvarlak kırpan atanın içinde kenara oturan parça
        let kirpik = false;
        for (let a = e.parentElement, i = 0; a && i < 6; a = a.parentElement, i++) {
          const ac = getComputedStyle(a); if (parseFloat(ac.borderTopLeftRadius) > 0 || parseFloat(ac.borderBottomLeftRadius) > 0) {
            const ar = a.getBoundingClientRect(); const dok = [Math.abs(r.top - ar.top), Math.abs(r.bottom - ar.bottom), Math.abs(r.left - ar.left), Math.abs(r.right - ar.right)].filter((d) => d <= 2).length;
            if (dok >= 2 && (ac.overflow !== 'visible' || ac.overflowX !== 'visible' || dok >= 3)) { kirpik = true; break; }
            if (dok >= 1 && ac.overflow !== 'visible') { kirpik = true; break; }
          }
        }
        if (kirpik) continue;
        out.push(`keskin köşe ${ad(e)} (${Math.round(r.width)}×${Math.round(r.height)})`);
      }
      return [...new Set(out)];
    }, { R, RK, KARTLAR });
    toplam++;
    if (hatalar.length) { kirmizi++; console.log(`✗ ${w} ${s}: ${hatalar.length} → ${hatalar.slice(0, 6).join(' | ')}`); }
    else console.log(`✓ ${w} ${s}`);
    await p.close();
  }
  await ctx.close();
}
await t.close();
console.log(`\nradius kapısı: ${toplam - kirmizi}/${toplam} yeşil (tek değer ${R}px)`);
process.exit(kirmizi ? 1 : 0);
