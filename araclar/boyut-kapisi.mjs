// Boyut + denge kapısı: v1 dondurulmuş kopyasına (/v1/) göre kapsayıcı/kart boyutu değişen sayfa ve iki kolonda büyük yükseklik farkı kırmızıdır.
// Taban: TABAN_ESKI (varsayılan http://localhost:8765/DadaKids/v1/). Bilinçli değişiklikler araclar/boyut-istisna.json dosyasında gerekçesiyle listelenir;
// istisnada "eksen": "h" yalnız yüksekliği serbest bırakır — genişlik yine ölçülür (kart/görsel/kapsayıcı genişliği büyümez);
// "yon": "kucul" yalnız küçülmeyi serbest bırakır (büyüme yine kırmızı).
// Kullanım: node araclar/boyut-kapisi.mjs [sayfa...]   (TABAN=… ile canlıda, TABAN_ESKI=… başka taban) · GENISLIK=1440,390
import { chromium } from 'playwright';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const ESKI = process.env.TABAN_ESKI || 'http://localhost:8765/DadaKids/v1/';
const GENISLIK = (process.env.GENISLIK || '1440,1024,768,390').split(',').map(Number);
const DENGE_PX = Number(process.env.DENGE_PX || 96), DENGE_ORAN = Number(process.env.DENGE_ORAN || 0.12);
const W_TOL = 0.05, H_TOL = 0.18;   // genişlik %5, yükseklik %18 (metin satırı oynamalarını yutar)
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : [...readdirSync('.').filter((f) => /^kids(-.+)?\.html$/.test(f)), 'kids-tarif.html?t=balkabagi-puresi'];
const ISTISNA_YOL = process.env.ISTISNA || 'araclar/boyut-istisna.json';   // ISTISNA=… başka kökten koşarken (dondurulmuş kopya) ana ağaçtaki listeyi kullan
const ISTISNA = existsSync(ISTISNA_YOL) ? JSON.parse(readFileSync(ISTISNA_YOL, 'utf8')).kurallar : [];
// sinif "kd-hub-donem*" → önek eşleşmesi
// kural.taban: kural yalnız TABAN_ESKI bu metni içeriyorsa geçerli (ör. "8774" → Ek revize, taban V2 dondurulmuş kopya)
// kural.sayfa "kids-donem-*" → önek eşleşmesi
const sayfaEs = (k, s) => k.sayfa === '*' || k.sayfa === s || s.split('?')[0] === k.sayfa || (k.sayfa.endsWith('*') && s.startsWith(k.sayfa.slice(0, -1)));
const tabanEs = (k) => !k.taban || ESKI.includes(k.taban);
const sinifEs = (k, sinif) => k.sinif === sinif || k.sinif === '*' || (k.sinif.endsWith('*') && sinif.startsWith(k.sinif.slice(0, -1)));
// eksen: yok → genişlik + yükseklik serbest; 'h' → yalnız yükseklik serbest (genişlik yine ölçülür)
const istisna = (s, sinif, w, eksen = 'wh') => ISTISNA.some((k) => !k.yon && tabanEs(k) && sinifEs(k, sinif) && sayfaEs(k, s) && (!k.genislik || k.genislik === w) && (!k.eksen || eksen === k.eksen));
// kart/kapsayıcı sayılan sınıflar: sınıf adının kendisi yerleşim taşır; metin ve rozet öğeleri elenir
const ELE = /(__baslik|__metin|__ozet|__aciklama|__ad$|__sen|__etiket|baloncuk|rozet|chip|^kd-gir|^kd-ikon|kd-ornek|kd-onay|kd-zebra|kd-gecis|kd-rbas|kd-btn|kd-dugme|kd-age-badge|kd-kivam|kd-kiler-ekle|kd-guven-rozet|kd-inceleyen|kd-yardim|^kd-pt)/;
// V2'de kaldırılan süs öğeleri (illus, maskot, hero__sus, kd-yuz, ayırıcı, desen, Pütür) yeni sürümde yok → `!yeni[k]` ile zaten atlanır.
const olc = () => {
  const m = new Map();
  document.querySelectorAll('.kd-sayfa [class]').forEach((e) => {
    if (e.closest('svg')) return; const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || c.position === 'fixed') return;
    const b = e.getBoundingClientRect(); if (b.width < 120 || b.height < 48) return;
    for (const s of e.classList) { if (!s.startsWith('kd-') || s.includes('--')) continue; if (!m.has(s)) m.set(s, []); m.get(s).push([b.width, b.height]); }
  });
  const ort = {}; m.forEach((v, k) => { const med = (i) => v.map((x) => x[i]).sort((a, b) => a - b)[Math.floor(v.length / 2)]; ort[k] = [Math.round(med(0)), Math.round(med(1)), v.length]; });
  return ort;
};
const denge = ({ DENGE_PX, DENGE_ORAN }) => {
  const out = [];
  document.querySelectorAll('.kd-sayfa *').forEach((p) => {
    if (p.closest('svg') || p.closest('[class*="kd-yardim"], [class*="kd-pt"]') || p.hasAttribute('data-denge-serbest')) return;
    const pb = p.getBoundingClientRect(); if (pb.width < 680) return;
    const c = [...p.children].filter((x) => { const s = getComputedStyle(x); return s.display !== 'none' && s.position !== 'absolute' && s.position !== 'fixed' && x.getBoundingClientRect().height > 80; });
    if (c.length !== 2) return; const [a, b] = c.map((x) => x.getBoundingClientRect());
    if (Math.abs(a.top - b.top) > 60 || a.right > b.left + 1 || a.width < pb.width * .25 || b.width < pb.width * .25) return;
    const icerik = (x) => { let alt = x.getBoundingClientRect().top; x.querySelectorAll('*').forEach((d) => { if (d.closest('svg') && d.tagName.toLowerCase() !== 'svg') return; if (d.closest('details:not([open])') && !d.closest('summary')) return; const s = getComputedStyle(d); if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'absolute') return; const r = d.getBoundingClientRect(); if (r.height && r.height < 2000) alt = Math.max(alt, r.bottom); }); return alt; };
    const [x, y] = [icerik(c[0]), icerik(c[1])]; const fark = Math.abs(x - y), boy = Math.max(x, y) - Math.min(a.top, b.top);
    if (fark > DENGE_PX && fark > boy * DENGE_ORAN) out.push(`${(p.id || p.className || p.tagName).toString().slice(0, 44)} fark=${Math.round(fark)}px (${Math.round(x - a.top)} / ${Math.round(y - b.top)})`);
  });
  return out;
};
const t = await chromium.launch(); let kirmizi = 0, n = 0;
for (const w of GENISLIK) {
  const bag = await t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
  for (const s of SAYFALAR) {
    const p = await bag.newPage(); const sorun = [];
    const r0 = await p.goto(ESKI + s, { waitUntil: 'networkidle' }).catch(() => null);
    const eski = r0 && r0.status() < 400 ? await p.evaluate(olc) : null;
    await p.goto(TABAN + s, { waitUntil: 'networkidle' }); await p.waitForTimeout(200);
    const yeni = await p.evaluate(olc);
    if (eski) for (const k of Object.keys(eski)) {
      if (!yeni[k] || ELE.test(k) || istisna(s, k, w)) continue;
      const [ew, eh] = eski[k], [yw, yh] = yeni[k]; const dw = Math.abs(yw - ew) / ew, dh = Math.abs(yh - eh) / eh;
      const hSerbest = istisna(s, k, w, 'h');
      // yon:"kucul" istisnası yalnız küçülmeyi serbest bırakır (genişlik ve yükseklik büyümezse geçer)
      if (yw <= ew * (1 + W_TOL) && yh <= eh * (1 + H_TOL) && ISTISNA.some((r) => r.yon === 'kucul' && tabanEs(r) && sinifEs(r, k) && sayfaEs(r, s) && (!r.genislik || r.genislik === w) && (r.eksen !== 'h' || dw <= W_TOL))) continue;
      if (dw > W_TOL || (!hSerbest && dh > H_TOL && Math.abs(yh - eh) > 24)) sorun.push(`.${k} ${ew}×${eh} → ${yw}×${yh}${hSerbest ? ' (yükseklik istisnalı, genişlik değişti)' : ''}`);
    }
    if (w >= 900) for (const d of await p.evaluate(denge, { DENGE_PX, DENGE_ORAN })) if (!istisna(s, 'denge', w)) sorun.push('DENGE ' + d);
    n++; if (sorun.length) kirmizi++;
    console.log(`${sorun.length ? '✗' : '✓'} ${String(w).padEnd(4)} ${s}${eski ? '' : ' (tabanda yok)'}`); sorun.forEach((x) => console.log('     ' + x));
    await p.close();
  }
  await bag.close();
}
await t.close();
console.log(`\n${n - kirmizi}/${n} boyut+denge ölçümü yeşil`);
process.exit(kirmizi ? 1 : 0);
