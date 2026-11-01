// Font kapısı (Beyar 1 Kas · tasks/kids-ui-tur2.md "Font kararları"): Kids yalnız Dada Gastro'nun yazı ailelerini kullanır.
// Playwright Chromium; tüm kids*.html (kids__ hariç) + kids-tarif.html?t=balkabagi-puresi; 1440 ve 390. Yardım paneli açılarak da ölçülür.
// Denetimler:
//  a aile        her görünür metin öğesinin (SVG <text>/<tspan>, ::before/::after içerikleri dahil) hesaplanan font-family ilk ailesi
//                Gastro kümesinde; zincirdeki her web fontu (document.fonts'ta tanımlı aile) da Gastro kümesinde. Gastro kabuğunun kendi
//                tek aralıklı yüzü (--yuz-tek: ui-monospace) yalnız kabuk öğelerinde serbest.
//  b ağ          Google Fonts / fonts.gstatic isteği 0, Kids/dış stilde CSS @import 0 (Gastro'nun kendi kanon token @import'u hariç), font dosyası isteği yalnız varlik/gastro/varliklar/(fonts|fontawesome) altından
//  c yüklü       document.fonts'ta (tanımlı ya da yüklü) Gastro dışı aile yok; Gastro dışı stil dosyasında @font-face yok
//  d token       Kids h1–h3: font-weight ve line-height oranı Gastro'nun h kuralıyla aynı (sınama öğesi, Kids dışında: 700 · --lh-head);
//                Kids p: line-height oranı Gastro p ile aynı (--lh-body); ağırlık Gastro gövdesi (500) — etiket p'leri için Gastro'nun
//                --agirlik-kalin/--agirlik-ekstra (700/800) değerleri de geçerli. (font-size serbest)
//  e kesim       Kids öğelerinde sahte kalın yok: Gilroy/GilroyLt (yalnız 500/300 kesim) ağırlık ≥ 600 ile kullanılmaz; GilroyBd/GilroyXB
//                (ExtraBold kesim) ağırlık < 600 ile kullanılmaz (bildirilenden kalın görünür)
// Kullanım: node araclar/font-kapisi.mjs  ·  TABAN=http://localhost:8765/DadaKids/  ·  GENISLIK=1440,390  ·  SAYFA=kids.html,kids-tarifler  ·  KOSUT=4
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';

const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GENISLIK = (process.env.GENISLIK || '1440,390').split(',').map(Number);
const KOSUT = Number(process.env.KOSUT || 4);
const SUZ = (process.env.SAYFA || '').split(',').map((s) => s.trim()).filter(Boolean);
const KIDS = [...readdirSync('.').filter((f) => /^kids(-.+)?\.html$/.test(f)).sort(), 'kids-tarif.html?t=balkabagi-puresi']
  .filter((s) => !SUZ.length || SUZ.some((x) => s.includes(x)));

// Gastro'nun @font-face aileleri (varlik/gastro/varliklar/build/assets/tokens-*.css · fontawesome/css/all.min.css)
const GASTRO = ['Gilroy', 'GilroyBd', 'GilroyXB', 'GilroyLt', 'Font Awesome 6 Free', 'Font Awesome 6 Brands', 'Font Awesome 5 Free', 'Font Awesome 5 Brands', 'FontAwesome'];
const KABUK_SERBEST = ['ui-monospace'];   // Gastro --yuz-tek (kabuk: .gw-code)
const GOOGLE = /fonts\.(googleapis|gstatic)\.com/i;
const FONT_YOL = /\/varlik\/gastro\/varliklar\/(fonts|fontawesome)\//;

const sonuc = [];
const kaydet = (harf, w, sayfa, ayrinti) => sonuc.push({ harf, w, sayfa, ok: ayrinti.length === 0, ayrinti });

/* ---------- tarayıcı içi ölçüm ---------- */
function olc({ GASTRO, KABUK_SERBEST, kapsam }) {
  const GOOGLE_RE = /fonts\.(googleapis|gstatic)\.com/i;
  const out = { a: [], c: [], d: [], e: [], say: { oge: 0, h: 0, p: 0, pKalin: 0 } };
  const KISA = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : (e.className && e.className.baseVal ? '.' + e.className.baseVal.split(/\s+/)[0] : ''))).slice(0, 60);
  const gorunur = (e) => { const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; } return true; };
  const SINIR = 'header.header, footer.footer, .mega, .bottom-nav, #drawer';
  const kidsOge = (e) => { if (e.closest('.kd-sayfa')) return true; for (let x = e; x && x !== document.body; x = x.parentElement) { if (x.matches(SINIR)) return false; const k = typeof x.className === 'string' ? x.className : ''; if (/(^|\s)kd-/.test(k)) return true; } return false; };
  // header "kids" rozeti (.pg-kids .brand::after) Kids'indir; kabukta olduğu halde Kids sayılır
  const rozetMi = (e, ps) => ps === '::after' && e.matches('.pg-kids .header .brand, .pg-kids .drawer-brand');
  const zincir = (ff) => ff.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  const webAile = new Set([...document.fonts].map((f) => f.family.replace(/^["']|["']$/g, '')));
  const g = new Set(GASTRO);

  const denetle = (e, ps, c, kids) => {
    out.say.oge++;
    const z = zincir(c.fontFamily); const ilk = z[0] || '';
    const serbest = !kids && KABUK_SERBEST.includes(ilk);
    if (!g.has(ilk) && !serbest) out.a.push(`${KISA(e)}${ps || ''}: ilk aile "${ilk}" (${c.fontFamily.slice(0, 70)})`);
    const disWeb = z.filter((a) => webAile.has(a) && !g.has(a));
    if (disWeb.length) out.a.push(`${KISA(e)}${ps || ''}: zincirde Gastro dışı web fontu ${disWeb.join(', ')}`);
    if (kids) {
      const w = Number(c.fontWeight);
      if ((ilk === 'Gilroy' || ilk === 'GilroyLt') && w >= 600) out.e.push(`${KISA(e)}${ps || ''}: ${ilk} ${w} → sahte kalın`);
      if ((ilk === 'GilroyBd' || ilk === 'GilroyXB') && w < 600) out.e.push(`${KISA(e)}${ps || ''}: ${ilk} ${w} → bildirilenden kalın`);
    }
  };
  const kok = kapsam ? document.querySelectorAll(kapsam) : [document.body];
  const ogeler = new Set(); for (const k of kok) { ogeler.add(k); k.querySelectorAll('*').forEach((e) => ogeler.add(e)); }
  for (const e of ogeler) {
    if (e.closest('script, style, noscript, template, title')) continue;
    const metin = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const psler = ['::before', '::after'].filter((ps) => { const pc = getComputedStyle(e, ps); return pc.content && !['none', 'normal', '""', "''"].includes(pc.content) && pc.display !== 'none'; });
    if (!metin && !psler.length) continue;
    if (!gorunur(e)) continue;
    const kids = kidsOge(e);
    if (metin) denetle(e, null, getComputedStyle(e), kids);
    for (const ps of psler) denetle(e, ps, getComputedStyle(e, ps), kids || rozetMi(e, ps));
  }

  /* c · document.fonts + @font-face kaynağı */
  for (const f of document.fonts) { const a = f.family.replace(/^["']|["']$/g, ''); if (!g.has(a)) out.c.push(`document.fonts: "${a}" ${f.weight} (${f.status})`); }
  const imp = [];
  const tara = (kurallar, href) => { for (const r of kurallar) {
    // Gastro'nun kendi token @import'ları (f4/f6 → kanon/tokenlar.css) font değildir; Kids/dış stilde ya da Gastro dışına giden @import yasak
    if (r instanceof CSSImportRule) { const hedef = new URL(r.href, href.startsWith('http') ? href : location.href); if (!/\/varlik\/gastro\//.test(href) || GOOGLE_RE.test(hedef.href) || !/\/varlik\/gastro\//.test(hedef.pathname)) imp.push(`${href.replace(location.origin, '')} @import ${r.href}`); if (r.styleSheet) { try { tara(r.styleSheet.cssRules, hedef.href); } catch { /* */ } } }
    else if (r instanceof CSSFontFaceRule && !/\/varlik\/gastro\//.test(href)) out.c.push(`@font-face Gastro dışı stilde: ${href.replace(location.origin, '')} (${r.style.getPropertyValue('font-family')})`);
    else if (r.cssRules) tara(r.cssRules, href);
  } };
  for (const s of document.styleSheets) { try { tara(s.cssRules, s.href || 'inline'); } catch { /* çapraz köken */ } }
  out.imp = imp;

  /* d · Gastro token eşleşmesi: Gastro'nun kendi h2/p kuralını Kids dışındaki sınama öğesinden oku */
  const sinama = document.createElement('div'); sinama.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px'; sinama.innerHTML = '<h1>Aa</h1><h2>Aa</h2><h3>Aa</h3><p>Aa</p>';
  document.body.appendChild(sinama);
  const oran = (c) => c.lineHeight === 'normal' ? NaN : parseFloat(c.lineHeight) / parseFloat(c.fontSize);
  const G = {}; for (const t of ['h1', 'h2', 'h3', 'p']) { const c = getComputedStyle(sinama.querySelector(t)); G[t] = { w: Number(c.fontWeight), lh: oran(c) }; }
  sinama.remove();
  out.gastro = G;
  const KALIN = [700, 800];   // Gastro --agirlik-kalin / --agirlik-ekstra
  for (const e of ogeler) {
    if (!/^(H1|H2|H3|P)$/.test(e.tagName) || !kidsOge(e) || !gorunur(e)) continue;
    const t = e.tagName.toLowerCase(); const c = getComputedStyle(e); const w = Number(c.fontWeight); const lh = oran(c);
    if (t === 'p') { out.say.p++; if (w !== G.p.w) out.say.pKalin++; } else out.say.h++;
    const wOk = t === 'p' ? (w === G.p.w || KALIN.includes(w)) : w === G[t].w;
    const lhOk = Math.abs(lh - G[t].lh) <= 0.011;
    if (!wOk || !lhOk) out.d.push(`${KISA(e)}: ağırlık ${w}${wOk ? '' : ` (Gastro ${G[t].w})`} · satır ${Number.isNaN(lh) ? 'normal' : lh.toFixed(3)}${lhOk ? '' : ` (Gastro ${G[t].lh.toFixed(3)})`}`);
  }
  return out;
}

/* ---------- sayfa koşusu ---------- */
async function kos(tarayici, w, sayfa) {
  const ctx = await tarayici.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const ag = [];
  p.on('request', (r) => { const u = r.url(); if (GOOGLE.test(u)) ag.push(`Google Fonts: ${u.slice(0, 80)}`); else if (r.resourceType() === 'font' && !FONT_YOL.test(new URL(u).pathname)) ag.push(`font dosyası Gastro dışı: ${new URL(u).pathname}`); });
  try {
    await p.goto(TABAN + sayfa, { waitUntil: 'networkidle', timeout: 60000 });
    await p.evaluate(() => document.fonts.ready);
    // tembel yüklenen bölümler için sayfayı baştan sona kaydır
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
    await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(olc, { GASTRO, KABUK_SERBEST, kapsam: null });
    // Yardım paneli açıkken (Kids barındaki düğme)
    const ac = await p.$('.kd-yardim-ac');
    if (ac && await ac.isVisible()) {
      await ac.click().catch(() => {}); await p.waitForTimeout(250); await p.evaluate(() => document.fonts.ready);
      const y = await p.evaluate(olc, { GASTRO, KABUK_SERBEST, kapsam: 'body .kd-yardim' });
      for (const h of ['a', 'e']) r[h].push(...y[h].map((s) => 'yardım: ' + s));
      r.say.oge += y.say.oge;
      await p.keyboard.press('Escape').catch(() => {});
    }
    await p.waitForLoadState('networkidle').catch(() => {});
    const uniq = (a) => { const m = new Map(); for (const s of a) m.set(s, (m.get(s) || 0) + 1); return [...m].map(([s, n]) => n > 1 ? `${s} ×${n}` : s); };
    kaydet('a', w, sayfa, uniq(r.a));
    kaydet('b', w, sayfa, uniq([...ag, ...r.imp]));
    kaydet('c', w, sayfa, uniq(r.c));
    kaydet('d', w, sayfa, uniq(r.d));
    kaydet('e', w, sayfa, uniq(r.e));
    return r;
  } catch (err) {
    kaydet('a', w, sayfa, [`yüklenemedi: ${err.message.split('\n')[0]}`]);
  } finally { await ctx.close(); }
}

const tarayici = await chromium.launch();
const isler = []; for (const w of GENISLIK) for (const s of KIDS) isler.push([w, s]);
let gastroToken = null; const say = { oge: 0, h: 0, p: 0, pKalin: 0 };
const havuz = Array.from({ length: KOSUT }, async () => { while (isler.length) { const [w, s] = isler.shift(); const r = await kos(tarayici, w, s); if (r) { gastroToken ||= r.gastro; for (const k in say) say[k] += r.say[k]; } } });
await Promise.all(havuz);
await tarayici.close();

const AD = { a: 'aile Gastro kümesinde', b: 'Google Fonts/@import/dış font 0', c: 'document.fonts yalnız Gastro', d: 'h1–h3 · p ağırlık/satır = Gastro', e: 'sahte kalın yok' };
for (const h of Object.keys(AD)) for (const r of sonuc.filter((x) => x.harf === h).sort((x, y) => y.w - x.w || x.sayfa.localeCompare(y.sayfa))) {
  console.log(`${r.ok ? '✓' : '✗'} [${h}] ${String(r.w).padEnd(5)} ${r.sayfa}`);
  for (const a of r.ayrinti.slice(0, 8)) console.log('     ' + a);
  if (r.ayrinti.length > 8) console.log(`     … +${r.ayrinti.length - 8}`);
}
console.log(`\nGastro token (sınama öğesi): ${gastroToken ? Object.entries(gastroToken).map(([t, v]) => `${t} ${v.w}/${v.lh.toFixed(3)}`).join(' · ') : '?'}`);
console.log(`Ölçülen: ${say.oge} metin öğesi · Kids h1–h3 ${say.h} · Kids p ${say.p} (${say.pKalin} etiket p'si 700/800)`);
console.log('\nÖzet:');
let top = 0, ok = 0;
for (const [h, ad] of Object.entries(AD)) { const l = sonuc.filter((x) => x.harf === h); const y = l.filter((x) => x.ok).length; top += l.length; ok += y; console.log(`  ${y === l.length ? '✓' : '✗'} ${h} ${ad.padEnd(36)} ${y}/${l.length}`); }
console.log(`\n${ok}/${top} font ölçümü yeşil`);
process.exit(ok === top ? 0 : 1);
