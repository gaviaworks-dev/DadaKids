// Pütür kapısı (V2): sol alttaki kâse asistanı tüm Dada Gastro Kids sayfalarında görünür mü, hiçbir şeyin üstüne biniyor mu,
// tık davranışı doğru mu, V2 görsel/içerik kurallarına uyuyor mu?
// Bölümler (BOLUM=yerlesim,davranis,arayuz ile seçilir; varsayılan hepsi):
//   yerlesim · 7 genişlik (1440 1366 1280 1024 768 390 320) × sayfalar: üstte, bir ekran aşağıda ve sonda Pütür; sayfa başı
//              etiket/başlık/chip/buton/kırıntı, V2 hero öğeleri (yaş barı, güven rozeti, güvenlik şeridi), yapışık Kids barı,
//              footer yasal satırı, yukarı-çık / alt menü ile çakışma; klavyeyle açılan menünün sınırları; yatay taşma;
//              1366/1280'de Pütür'ün görünür alanı ≥ %80 (en geç ilk ~120 px kaydırmadan sonra)
//   davranis · tek tık → menü ~250 ms sonra (zıplayarak) · çift tık / çift dokunuş → data-durum="surpriz", menü AÇILMAZ, ~2 sn,
//              geri toplanıp el sallar · yavaş çift tık (≤400 ms) da sürpriz · sürpriz sonrası 9 sn içinde çift tık sürpriz
//              başlatmaz (menü normal açılır), 9 sn sonra yeniden başlatır · Enter/Space beklemeden açar · hover menü ·
//              sürpriz parçaları etkileşimli öğe ortalarını örtmez (kare kare) · azaltılmış hareket · depolama kapalı · gizle/göster · video
//   arayuz   · touch-action: manipulation (Pütür'ün tıklanabilir alanları; html/body değil) · UI köşe yarıçapı Gastro ölçeğinde
//              (yalnız karakter gövdesi/gölge/parıltı ve eşit en-boylu ikon daireleri daire) · 6 seçeneğin cevabı ·
//              "Dada Gastro Kids", "Mevsim Takvimi", "Örnek içerik" notu YOK (Beyar 1 Kas), Acil yalnız 112 (ilk yardım adımı yok),
//              sahte onay metni yok
// Kullanım: node araclar/putur-kapisi.mjs [sayfa...]
//   TABAN=http://localhost:8771/DadaKids/   doğrulanacak yayın (başka port / canlı)
//   AGAC=/yol/izole-agac                    sayfa listesi ve dosya boyutları için ağaç (varsayılan: bu betiğin üst dizini)
//   GENISLIK=390,320 · ORNEK=1 (temsilî 9 sayfa; tam koşu varsayılan) · ESZAMAN=6 (yerleşimde paralel sekme)
//   ENJEKTE=1        sayfada putur.css/js yoksa Playwright ile eklenir (build Pütür'ü eklemeden önce deneme için)
//   PT_KAYNAK=/dizin putur.js/putur.css bu dizinden verilir (eski sürüme karşı kırmızı koşu için)
import { chromium } from 'playwright';
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TABAN = (process.env.TABAN || 'http://localhost:8765/DadaKids/').replace(/\/?$/, '/');
const KOKEN = new URL(TABAN).origin;
const AGAC = process.env.AGAC || fileURLToPath(new URL('..', import.meta.url));
const TUM = readdirSync(AGAC).filter((f) => /^kids.*\.html$/.test(f) && !f.startsWith('kids__'));
const TEMSIL = ['kids.html', 'kids-araclar.html', 'kids-tarifler.html', 'kids-tarif.html', 'kids-mevsim.html', 'kids-donem-6-8-ay.html', 'kids-guvenli-kesim.html', 'kids-rehber-blw-temelleri.html', 'kids-arac-persentil.html'];
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : process.env.ORNEK ? TEMSIL.filter((s) => TUM.includes(s)) : TUM;
const GENISLIK = (process.env.GENISLIK || '1440,1366,1280,1024,768,390,320').split(',').map(Number);
const BOY = { 1440: 900, 1366: 768, 1280: 800, 1024: 800, 768: 1024, 390: 844, 320: 640 };
const BOLUM = new Set((process.env.BOLUM || 'yerlesim,davranis,arayuz').split(','));
const ESZAMAN = +(process.env.ESZAMAN || 6);
const t0 = Date.now();

let gecen = 0, kalan = 0; const hatalar = [];
const yaz = (s) => process.stdout.write(s + '\n');
function kontrol(ad, sonuc, ayrinti = '') {
  if (sonuc) gecen++; else { kalan++; hatalar.push(ad + (ayrinti ? ' → ' + ayrinti : '')); yaz('  KALDI ' + ad + (ayrinti ? ' → ' + ayrinti : '')); }
}

const tarayici = await chromium.launch();
async function baglam(o = {}, { video = false, selam = true } = {}) {
  const b = await tarayici.newContext(o);
  if (process.env.ENJEKTE) await b.route((u) => /\/kids[^/]*\.html$/.test(u.pathname), async (r) => {
    const yanit = await r.fetch(); let govde = await yanit.text();
    if (!/varlik\/kids\/js\/putur\.js/.test(govde)) govde = govde.replace('</head>', '<link rel="stylesheet" href="varlik/kids/css/putur.css"></head>').replace(/<\/body>(?![\s\S]*<\/body>)/, '<script src="varlik/kids/js/putur.js" defer></script></body>');
    await r.fulfill({ response: yanit, body: govde, headers: { ...yanit.headers(), 'content-length': String(Buffer.byteLength(govde)) } });
  });
  if (process.env.PT_KAYNAK) await b.route(/\/putur\.(js|css)(\?|$)/, (r) => { const t = /\.js(\?|$)/.test(r.request().url()) ? 'js' : 'css'; r.fulfill({ body: readFileSync(join(process.env.PT_KAYNAK, 'putur.' + t)), contentType: t === 'js' ? 'text/javascript' : 'text/css' }); });
  await b.addInitScript(([v, s]) => {
    try { localStorage.setItem('dadakids.putur.merhaba.v1', '1'); if (s) sessionStorage.setItem('dadakids.putur.selam', '1'); } catch (e) { /* kapalı */ }
    if (!v) window.__kdPuturVideo = null;
  }, [video, selam]);
  return b;
}
async function acSayfa(bag, yol, jsHata, bekle = 'networkidle') {
  const sayfa = await bag.newPage();
  sayfa.on('pageerror', (e) => jsHata.push(yol + ': ' + e.message));
  sayfa.on('response', (r) => { if (r.url().startsWith(KOKEN) && r.status() >= 400 && !/favicon/.test(r.url())) jsHata.push(yol + ': ' + r.status() + ' ' + r.url().replace(TABAN, '')); });
  await sayfa.goto(TABAN + yol, { waitUntil: bekle });
  await sayfa.waitForSelector('.kd-pt__btn', { state: 'attached', timeout: 6000 }).catch(() => {});
  return sayfa;
}
// görünen kısmın ortası: kenara çekilmiş Pütür'de kullanıcı ekranda kalan yüze dokunur
const merkez = (sayfa, sec) => sayfa.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(), l = Math.max(r.left, 1), sg = Math.min(r.right, innerWidth - 1), u = Math.max(r.top, 1), a = Math.min(r.bottom, innerHeight - 1); return [(l + sg) / 2, (u + a) / 2]; }, sec);
const tikla = async (sayfa, sec) => { const [x, y] = await merkez(sayfa, sec); await sayfa.mouse.click(x, y); };
const kaydir = async (sayfa, y) => { await sayfa.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await sayfa.waitForTimeout(720); };   // durunca yerleşir (110 ms) + geçiş (~360 ms)
const durum = (sayfa) => sayfa.evaluate(() => document.querySelector('.kd-pt').getAttribute('data-durum'));
const menuAcik = (sayfa) => sayfa.evaluate(() => !document.querySelector('#kdPtMenu').hidden);
const bekleMenu = (sayfa, sn = 4000) => sayfa.waitForFunction(() => document.querySelector('#kdPtMenu.kd-acik'), null, { timeout: sn }).then(() => true, () => false);
async function havuz(isler, n, fn) { let i = 0; await Promise.all(Array.from({ length: Math.min(n, isler.length) }, async () => { while (i < isler.length) { const j = i++; await fn(isler[j], j); } })); }

/* ---------- Ölçümler (sayfa içinde) ---------- */
/* Üstüne binme: Pütür düğme kutusu 4 px ızgarayla taranır (document.elementsFromPoint); en üstteki öğe ve ataları için metin satırı
   kutuları, zemini/kenarlığı olan küçük metinli kutular (etiket, chip) ve etkileşimli öğe kutuları Pütür kutusuyla kesiştirilir (>1 px).
   Ayrıca V2 öğeleri adıyla: yapışık Kids barı, kırıntı, sayfa başı etiketi, h1, yaş barı, güven rozeti, güvenlik şeridi, footer yasal satırı. */
const USTUNE = () => {
  const kok = document.querySelector('.kd-pt'); if (!kok || getComputedStyle(kok).display === 'none') return [];
  const b = kok.querySelector('.kd-pt__btn').getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const kes = (r) => Math.min(b.right, r.right) - Math.max(b.left, r.left) > 1 && Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top) > 1;
  const ad = (e) => (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 26);
  const etiket = (e, r) => {
    if (r.width > W * .6 || r.height > 90 || !e.textContent.trim()) return false;
    const c = getComputedStyle(e), a = /rgba\([^)]*,\s*([\d.]+)\)/.exec(c.backgroundColor);
    return (c.backgroundColor !== 'transparent' && (!a || +a[1] > .05)) || c.backgroundImage !== 'none' || (parseFloat(c.borderTopWidth) > 0 && c.borderTopStyle !== 'none' && !/,\s*0\)$/.test(c.borderTopColor) && c.borderTopColor !== 'transparent');
  };
  const gorulen = new Set(), out = new Set();
  for (let x = Math.max(0, b.left); x <= Math.min(W - 1, b.right); x += 4) for (let y = Math.max(0, b.top); y <= Math.min(H - 1, b.bottom); y += 4) {
    let e = document.elementsFromPoint(x, y).find((q) => !q.closest('.kd-pt, .kd-pt-yakala, .kd-pt-sekme'));
    for (; e && e !== document.body && e !== document.documentElement && !gorulen.has(e); e = e.parentElement) {
      gorulen.add(e);
      if (e.closest('.bottom-nav')) break;
      for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { const z = document.createRange(); z.selectNodeContents(n); if ([...z.getClientRects()].some((q) => q.width > 1 && kes(q))) out.add('metin: ' + n.textContent.trim().replace(/\s+/g, ' ').slice(0, 26)); }
      const r = e.getBoundingClientRect(); if (!kes(r)) continue;
      if (e.matches('a[href], button, input:not([type=hidden]), select, summary, [role=button], [role=radio], [role=tab]')) out.add('öğe: ' + ad(e));
      else if (etiket(e, r)) out.add('etiket: ' + ad(e));
    }
  }
  // V2 öğeleri: küçük öğede kutu, geniş öğede metin satırları ve içindeki etkileşimli öğeler
  const V2 = { 'Kids barı': '.kd-ust', 'kırıntı': '.kd-kirinti > *', 'sayfa başı etiketi': '.kd-ust-yazi', 'başlık': '.kd-sayfa h1', 'yaş barı': '.kd-hub-donem__secenek', 'güven rozeti': '.kd-guven-rozet', 'güvenlik şeridi': '.kd-guvenlik-serit p > *', 'footer yasal': '.foot-legal a, .foot-bottom > *' };
  const gorunur = (e) => { const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > .05; };
  for (const [ad2, sec] of Object.entries(V2)) document.querySelectorAll(sec).forEach((e) => {
    if (!gorunur(e)) return;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.bottom < 0 || r.top > H) return;
    let kutular = [r];
    if (ad2 !== 'Kids barı' && r.width > W * .6) { const z = document.createRange(); z.selectNodeContents(e); kutular = [...z.getClientRects()].filter((q) => q.width > 1); e.querySelectorAll('a, button').forEach((a) => kutular.push(a.getBoundingClientRect())); }
    // footer yasal: yalnız önde görünen satır (perde arkasında kalan footer örtülmüş sayılmaz)
    if (ad2 === 'footer yasal' && !kutular.some((q) => { const u = document.elementFromPoint(Math.min(W - 1, Math.max(0, q.left + q.width / 2)), Math.min(H - 1, Math.max(0, q.top + q.height / 2))); return u && (e.contains(u) || u.closest('.kd-pt')); })) return;
    if (kutular.some(kes)) out.add(ad2 + ': ' + ad(e));
  });
  return [...out];
};
/* Görünürlük, sabit öğelerle çakışma, tıklanabilir öğe ortası örtme, yatay taşma */
const OLCUM = () => {
  const kok = document.querySelector('.kd-pt'), btn = document.querySelector('.kd-pt__btn');
  const b = btn.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const kes = (a, c) => Math.min(a.right, c.right) - Math.max(a.left, c.left) > 1 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 1;
  const gorunur = (e) => { if (!e) return false; const c = getComputedStyle(e), r = e.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > .05 && r.width > 0 && r.top < H && r.bottom > 0; };
  const out = { yatay: document.documentElement.scrollWidth - W, gorunurGen: Math.min(b.right, W) - Math.max(b.left, 0), ust: b.top, alt: b.bottom, cakisma: [], ortu: [] };
  if (getComputedStyle(kok).display === 'none') { out.yok = true; return out; }
  for (const [ad, s] of Object.entries({ 'yukarı çık': '#toTop', 'alt menü': '.bottom-nav', 'çerez bandı': '#cookieBanner', 'Yardım menüsü': '.kd-yardim-ac' })) { const e = document.querySelector(s); if (gorunur(e) && kes(b, e.getBoundingClientRect())) out.cakisma.push(ad); }
  document.querySelectorAll('a[href], button, input:not([type=hidden]), select, summary, [role=button], [role=radio], [role=tab]').forEach((e) => {
    if (e.closest('.kd-pt') || e.closest('.kd-pt-sekme')) return;
    const r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return;
    const x = r.left + r.width / 2, y = r.top + r.height / 2; if (x < 0 || y < 0 || x >= W || y >= H) return;
    if (!gorunur(e)) return;
    const u = document.elementFromPoint(x, y);
    if (u && u.closest('.kd-pt')) out.ortu.push((e.tagName + ' ' + (e.getAttribute('aria-label') || e.textContent || '').trim()).slice(0, 46));
  });
  return out;
};
/* Kare kaydedici: sürpriz boyunca her animasyon karesinde etkileşimli öğelerin ortası örtülüyor mu (düğme, görünen karakter, uçan parçalar)?
   Menü açılırsa durur ve kaydeder (çift tıkta menü açılmamalı). */
const IZ_BASLAT = () => {
  const W = innerWidth, H = innerHeight;
  const merkezler = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, summary, [role=button], [role=radio], [role=tab]')].map((e) => {
    if (e.closest('.kd-pt') || e.closest('.kd-pt-sekme') || e.closest('.kd-pt-yakala')) return null;
    const r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return null;
    const x = r.left + r.width / 2, y = r.top + r.height / 2; if (x < 0 || y < 0 || x >= W || y >= H) return null;
    const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity <= .05) return null;
    return { x, y, ad: (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 24) };
  }).filter(Boolean);
  const iz = { kare: 0, ihlal: {}, calis: true, merkez: merkezler.length, menu: false };
  const ihlal = (m, kaynak) => { const k = kaynak + ': ' + m.ad; iz.ihlal[k] = (iz.ihlal[k] || 0) + 1; };
  const icinde = (r, m) => m.x >= r.left && m.x <= r.right && m.y >= r.top && m.y <= r.bottom;
  function kare() {
    if (!iz.calis) return;
    if (!document.querySelector('#kdPtMenu').hidden) { iz.menu = true; iz.calis = false; return; }
    iz.kare++;
    const kok = document.querySelector('.kd-pt'), karakter = kok.querySelector('.kd-pt__karakter');
    const dugme = kok.querySelector('.kd-pt__btn').getBoundingClientRect();
    merkezler.forEach((m) => {
      if (icinde(dugme, m)) ihlal(m, 'düğme');
      const u = document.elementFromPoint(m.x, m.y);
      if (u && u.closest('.kd-pt, .kd-pt-yakala') && !u.closest('.kd-pt__menu, .kd-pt__balon')) ihlal(m, 'üstte Pütür');
    });
    if (+getComputedStyle(karakter).opacity > .05) kok.querySelectorAll('.pt-egim > path, .pt-bukle path, .pt-ayak-sol, .pt-ayak-sag, .pt-kol ellipse').forEach((p) => { const r = p.getBoundingClientRect(); merkezler.forEach((m) => { if (icinde(r, m)) ihlal(m, 'karakter'); }); });
    kok.querySelectorAll('.kd-pt__parca').forEach((p) => { if (+getComputedStyle(p).opacity <= .1) return; const r = p.getBoundingClientRect(); merkezler.forEach((m) => { if (icinde(r, m)) ihlal(m, 'parça'); }); });
    requestAnimationFrame(kare);
  }
  window.__ptIz = iz; requestAnimationFrame(kare);
};
const IZ_BITIR = () => { const iz = window.__ptIz; iz.calis = false; return { kare: iz.kare, merkez: iz.merkez, ihlal: iz.ihlal, menu: iz.menu, surpriz: document.querySelector('.kd-pt').getAttribute('data-surpriz') }; };
const ihlalYazi = (iz) => Object.entries(iz.ihlal).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} (${n} kare)`).join(' | ');
/* Zaman çizelgesi: tık/tuş anları, menünün açıldığı anlar, durum geçişleri, selam (el sallama) */
const SAAT = () => {
  const k = document.querySelector('.kd-pt'), m = document.querySelector('#kdPtMenu'), z = { tik: [], tus: [], menu: [], durum: [], selam: 0, parca: 0, tasma: 0 };
  document.addEventListener('click', (e) => { if (e.target.closest('.kd-pt__btn, .kd-pt-yakala')) z.tik.push(performance.now()); }, true);
  document.addEventListener('keydown', (e) => { if (/^(Enter| )$/.test(e.key)) z.tus.push(performance.now()); }, true);
  new MutationObserver(() => { if (!m.hidden) z.menu.push(performance.now()); }).observe(m, { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(() => { z.durum.push([k.getAttribute('data-durum'), performance.now()]); }).observe(k, { attributes: true, attributeFilter: ['data-durum'] });
  new MutationObserver(() => { if (k.classList.contains('kd-pt--selam')) z.selam++; }).observe(k, { attributes: true, attributeFilter: ['class'] });
  (function bak() { const p = [...document.querySelectorAll('.kd-pt__parca')]; z.parca = Math.max(z.parca, p.length); if (p.some((e) => { const r = e.getBoundingClientRect(); return r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1; })) z.tasma++; requestAnimationFrame(bak); })();
  window.__ptSaat = z;
};
const SAAT_OKU = () => { const z = window.__ptSaat; return { ...z, simdi: performance.now(), surpriz: document.querySelector('.kd-pt').getAttribute('data-surpriz'), acik: !!document.querySelector('#kdPtMenu.kd-acik'), d: document.querySelector('.kd-pt').getAttribute('data-durum') }; };
const SAAT_SIFIRLA = () => { const z = window.__ptSaat; z.tik = []; z.tus = []; z.menu = []; z.durum = []; z.selam = 0; z.parca = 0; z.tasma = 0; };

const jsHata = [];

/* ---------- 0 · Kurulum: Pütür her sayfada yüklü ---------- */
{
  const bag = await baglam({ viewport: { width: 1440, height: 900 } });
  const eksik = [];
  await havuz(SAYFALAR, ESZAMAN, async (s) => {
    const sayfa = await bag.newPage();
    await sayfa.goto(TABAN + s, { waitUntil: 'domcontentloaded' });
    if (!(await sayfa.waitForSelector('.kd-pt__btn', { timeout: 6000, state: 'attached' }).then(() => true, () => false))) eksik.push(s);
    await sayfa.close();
  });
  await bag.close();
  if (eksik.length) {
    yaz(`\nPütür yüklenmedi (${eksik.length}/${SAYFALAR.length} sayfa): ${eksik.slice(0, 5).join(', ')}`);
    yaz('Sayfaların HTML\'inde varlik/kids/css/putur.css ve varlik/kids/js/putur.js var mı (build), ya da ENJEKTE=1 ile deneyin.');
    await tarayici.close();
    yaz(`\nPütür kapısı: 0/${SAYFALAR.length} geçti — KALDI (Pütür yüklü değil)`);
    process.exit(1);
  }
  kontrol(`kurulum: ${SAYFALAR.length} sayfanın hepsinde Pütür yüklü${process.env.ENJEKTE ? ' (ENJEKTE)' : ''}`, true);
  const vdir = join(AGAC, 'varlik/kids/putur'), vd = existsSync(vdir) ? readdirSync(vdir) : [];
  const renkler = ['pembe', 'mavi', 'seftali', 'mint', 'sari'];
  kontrol('varlık: 5 renk × (webm + hevc) zıplama videosu, her biri < 600 KB', renkler.every((r) => vd.includes(`zipla-${r}.webm`) && vd.includes(`zipla-${r}-hevc.mp4`)) && vd.every((f) => statSync(join(vdir, f)).size < 600 * 1024), vd.join(' '));
}

/* ---------- 1 · Yerleşim: 7 genişlik × sayfalar ---------- */
if (BOLUM.has('yerlesim')) for (const w of GENISLIK) {
  const bag = await baglam({ viewport: { width: w, height: BOY[w] || 900 } });
  await havuz(SAYFALAR, ESZAMAN, async (s) => {
    const sayfa = await acSayfa(bag, s, jsHata);
    await sayfa.waitForTimeout(300);
    const etk = `${w} ${s}`;
    const boy = await sayfa.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (const [ad, y] of [['üst', 0], ['bir ekran aşağı', BOY[w] || 900], ['son', boy]]) {
      if (y > boy && ad !== 'son') continue;
      await kaydir(sayfa, y);
      const u = await sayfa.evaluate(USTUNE);
      kontrol(`${etk} ${ad}: Pütür hiçbir öğenin üstüne binmiyor`, u.length === 0, u.slice(0, 4).join(' | '));
      const r = await sayfa.evaluate(OLCUM);
      kontrol(`${etk} ${ad}: görünür`, !r.yok && r.gorunurGen >= 12 && r.ust >= 0 && r.alt <= (BOY[w] || 900), JSON.stringify([r.gorunurGen, r.ust, r.alt]));
      kontrol(`${etk} ${ad}: sabit öğelerle çakışma yok`, r.cakisma.length === 0, r.cakisma.join(' | '));
      kontrol(`${etk} ${ad}: tıklanabilir öğe ortası örtülmüyor`, r.ortu.length === 0, r.ortu.slice(0, 3).join(' | '));
      if (ad === 'üst') kontrol(`${etk}: yatay taşma yok`, r.yatay <= 0, String(r.yatay));
    }
    // dizüstü: Pütür'ün görünür alanı ≥ %80 (sayfa üstünde ya da en geç ilk ~120 px kaydırmadan sonra); o konumda da hiçbir şeye binmez
    if (w === 1280 || w === 1366) {
      const oran = () => sayfa.evaluate(() => { const r = document.querySelector('.kd-pt__btn').getBoundingClientRect(); return Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / (r.width * r.height); });
      await kaydir(sayfa, 0); const o0 = await oran();
      await kaydir(sayfa, Math.min(120, boy)); const o1 = await oran();
      kontrol(`${etk} dizüstü: Pütür görünür alanı ≥ %80 (en geç ilk kaydırmadan sonra)`, o0 >= .8 || o1 >= .8, JSON.stringify({ ust: +o0.toFixed(2), k120: +o1.toFixed(2) }));
      const u = await sayfa.evaluate(USTUNE);
      kontrol(`${etk} 120 px aşağı: Pütür hiçbir öğenin üstüne binmiyor`, u.length === 0, u.slice(0, 4).join(' | '));
    }
    // menü: klavye ile aç (bekleme yok), sınırları ölç, Esc ile kapat
    await kaydir(sayfa, Math.round(boy * .4));
    await sayfa.focus('.kd-pt__btn'); await sayfa.keyboard.press('Enter');
    await bekleMenu(sayfa); await sayfa.waitForTimeout(640);
    const m = await sayfa.evaluate(() => {
      const og = [...document.querySelectorAll('.kd-pt__oge')], W = innerWidth, H = innerHeight;
      const r = og.map((e) => e.getBoundingClientRect());
      const ust = document.querySelector('.kd-ust'), ustAlt = ust ? ust.getBoundingClientRect().bottom : 0;
      const kes = (a, c) => Math.min(a.right, c.right) - Math.max(a.left, c.left) > 1 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 1;
      const tt = document.querySelector('#toTop'), ttc = tt && getComputedStyle(tt), ttVar = tt && ttc.visibility !== 'hidden' && +ttc.opacity > .05;
      const nav = document.querySelector('.bottom-nav'), navVar = nav && getComputedStyle(nav).display !== 'none';
      return {
        n: og.length,
        ekranDisi: r.filter((x) => x.left < 2 || x.right > W - 2 || x.bottom > H || x.top < ustAlt - 1).length,
        kesik: og.filter((e) => { const a = e.querySelector('.kd-pt__oge-ad'); return a.scrollWidth > a.clientWidth + 1; }).length,
        ust: r.filter((a, i) => r.some((c, j) => j > i && kes(a, c))).length,
        sabit: r.filter((x) => (ttVar && kes(x, tt.getBoundingClientRect())) || (navVar && kes(x, nav.getBoundingClientRect()))).length,
        odak: document.activeElement && document.activeElement.getAttribute('data-secenek'),
        erisim: r.filter((x) => { const y = document.elementFromPoint(x.left + 18, x.top + x.height / 2); return !(y && y.closest('.kd-pt__oge')); }).length,
      };
    });
    kontrol(`${etk} menü: 6 seçenek, ekranda, Kids barının altında`, m.n === 6 && m.ekranDisi === 0, JSON.stringify([m.n, m.ekranDisi]));
    kontrol(`${etk} menü: etiket kesilmiyor, üst üste binmiyor, yukarı-çık/alt menüyle çakışmıyor`, m.kesik === 0 && m.ust === 0 && m.sabit === 0, JSON.stringify([m.kesik, m.ust, m.sabit]));
    kontrol(`${etk} menü: tıklanabilir, odak ilk seçenekte`, m.erisim === 0 && m.odak === 'yas', JSON.stringify([m.erisim, m.odak]));
    await sayfa.keyboard.press('Escape'); await sayfa.waitForTimeout(380);
    kontrol(`${etk} menü: Esc kapatır, odak döner`, await sayfa.evaluate(() => document.querySelector('#kdPtMenu').hidden && document.activeElement === document.querySelector('.kd-pt__btn') && document.querySelector('.kd-pt__btn').getAttribute('aria-expanded') === 'false'));
    await sayfa.close();
  });
  await bag.close();
  yaz(`· ${w}px: ${SAYFALAR.length} sayfa (${gecen} geçti, ${kalan} kaldı) ${Math.round((Date.now() - t0) / 1000)} sn`);
}

/* ---------- 2 · Davranış: tek tık, çift tık, bekleme, klavye, dokunmatik, hover ---------- */
if (BOLUM.has('davranis')) {
  const ilkMenu = (z, t) => z.menu.find((x) => x >= t);
  // 2a · Fare, masaüstü ve dizüstü
  for (const w of [1440, 1024].filter((x) => GENISLIK.includes(x) || !process.env.GENISLIK)) {
    const bag = await baglam({ viewport: { width: w, height: BOY[w] } });
    let s = await acSayfa(bag, 'kids-tarifler.html', jsHata);
    await s.waitForTimeout(500); await s.evaluate(SAAT);
    let [x, y] = await merkez(s, '.kd-pt__btn');
    // tek tık → ~250 ms sonra menü (zıplayarak)
    await s.mouse.click(x, y); await s.waitForTimeout(120);
    kontrol(`${w} tek tık: 120 ms'de menü henüz kapalı (ikinci tık bekleniyor)`, !(await menuAcik(s)));
    await s.waitForTimeout(600);
    let z = await s.evaluate(SAAT_OKU), gec = ilkMenu(z, z.tik[0]) - z.tik[0];
    kontrol(`${w} tek tık: menü ~250 ms sonra açık`, z.acik && gec >= 220 && gec <= 450, JSON.stringify({ gec: Math.round(gec), acik: z.acik }));
    kontrol(`${w} tek tık: zıplama (tepki) state'i, sürpriz yok`, z.durum.some(([d]) => d === 'tepki') && !z.surpriz, JSON.stringify(z.durum.map(([d]) => d)));
    await s.waitForTimeout(1500);
    await s.mouse.click(x, y); await s.waitForTimeout(700);
    kontrol(`${w} tek tık: açık menüde ikinci tek tık menüyü kapatır`, !(await menuAcik(s)));
    await s.mouse.move(w - 200, 300); await s.waitForTimeout(500);
    // çift tık → sürpriz, menü açılmaz, ~2 sn, el sallar
    await s.evaluate(SAAT_SIFIRLA);
    await s.mouse.dblclick(x, y);
    await s.waitForTimeout(2900);
    z = await s.evaluate(SAAT_OKU);
    const bas = (z.durum.find(([d]) => d === 'surpriz') || [])[1], son = (z.durum.find(([d, t]) => t > bas && d !== 'surpriz') || [])[1];
    kontrol(`${w} çift tık: data-durum="surpriz"`, z.surpriz === '1' && !!bas, JSON.stringify(z.durum.map(([d]) => d)));
    kontrol(`${w} çift tık: menü hiç açılmadı`, z.menu.length === 0 && !z.acik, JSON.stringify(z.menu.length));
    kontrol(`${w} çift tık: ~2 sn sürer, idle'a döner`, son && son - bas >= 1500 && son - bas <= 2600 && z.d === 'idle', JSON.stringify({ sure: Math.round(son - bas), d: z.d }));
    kontrol(`${w} çift tık: pastel parçalar çıkar, ekrandan taşmaz`, z.parca >= 8 && z.tasma === 0, JSON.stringify({ parca: z.parca, tasma: z.tasma }));
    kontrol(`${w} çift tık: geri toplanıp el sallar`, z.selam >= 1 && await s.evaluate(() => getComputedStyle(document.querySelector('.kd-pt__karakter')).opacity === '1' && !document.querySelector('.kd-pt__sahne').children.length), JSON.stringify({ selam: z.selam }));
    // 9 sn bekleme: çift tık sürpriz başlatmaz, menü normal açılır
    await s.evaluate(SAAT_SIFIRLA);
    await s.mouse.dblclick(x, y); await s.waitForTimeout(900);
    z = await s.evaluate(SAAT_OKU);
    kontrol(`${w} bekleme (9 sn): ikinci çift tık sürpriz başlatmaz`, z.surpriz === '1' && !z.durum.some(([d]) => d === 'surpriz'), JSON.stringify({ say: z.surpriz, d: z.durum.map(([d]) => d) }));
    kontrol(`${w} bekleme (9 sn): çift tık tek tık gibi menüyü açar`, z.acik, JSON.stringify(z.menu.length));
    await s.keyboard.press('Escape'); await s.mouse.move(w - 200, 300); await s.waitForTimeout(400);
    if (w === 1440) {                                                          // 9 sn dolunca yeniden sürpriz
      const kalanSure = 9000 - (await s.evaluate((b) => performance.now() - b, bas)) + 250;
      await s.waitForTimeout(Math.max(0, kalanSure));
      await s.evaluate(SAAT_SIFIRLA);
      await s.mouse.dblclick(x, y); await s.waitForTimeout(400);
      z = await s.evaluate(SAAT_OKU);
      kontrol(`${w} bekleme: 9 sn sonra çift tık yeniden sürpriz`, z.surpriz === '2' && z.d === 'surpriz' && !z.acik, JSON.stringify({ say: z.surpriz, d: z.d }));
      await s.waitForTimeout(2300);
    }
    await s.close();
    // yavaş çift tık (iki tık arası ~330 ms): yine sürpriz, sonunda menü kapalı
    s = await acSayfa(bag, 'kids.html', jsHata); await s.waitForTimeout(400); await s.evaluate(SAAT);
    [x, y] = await merkez(s, '.kd-pt__btn');
    await s.mouse.click(x, y); await s.waitForTimeout(330); await s.mouse.click(x, y);
    await s.waitForTimeout(2600);
    z = await s.evaluate(SAAT_OKU);
    kontrol(`${w} yavaş çift tık (330 ms): sürpriz oynar, menü kapalı kalır`, z.surpriz === '1' && !z.acik, JSON.stringify({ say: z.surpriz, acik: z.acik }));
    await s.close();
    // hover menüsü açıkken çift tık: menü kapanır, sürpriz oynar, sonra menü kendiliğinden açılmaz
    s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.waitForTimeout(400);
    [x, y] = await merkez(s, '.kd-pt__btn');
    await s.mouse.move(x + 30, y - 120); await s.mouse.move(x, y, { steps: 4 }); await s.waitForTimeout(520);
    kontrol(`${w} hover: imleçle ~200 ms sonra menü açılır`, await s.evaluate(() => !!document.querySelector('#kdPtMenu.kd-acik') && document.querySelector('.kd-pt').hasAttribute('data-hover')));
    await s.evaluate(SAAT);
    await s.mouse.dblclick(x, y); await s.waitForTimeout(300);
    z = await s.evaluate(SAAT_OKU);
    kontrol(`${w} hover + çift tık: menü kapanır, sürpriz oynar`, z.d === 'surpriz' && !z.acik, JSON.stringify({ d: z.d, acik: z.acik }));
    await s.waitForTimeout(2500);
    kontrol(`${w} hover + çift tık: sürpriz sonrası menü kendiliğinden açılmaz`, !(await menuAcik(s)));
    await s.mouse.move(w - 200, 300, { steps: 2 }); await s.waitForTimeout(300);
    await s.mouse.move(x, y, { steps: 3 }); await s.waitForTimeout(520);
    kontrol(`${w} hover: imleç geri gelince menü yine açılır`, await menuAcik(s));
    await s.mouse.move(w - 200, 300, { steps: 2 }); await s.waitForTimeout(800);
    kontrol(`${w} hover: imleç çıkınca ~400 ms sonra kapanır`, !(await menuAcik(s)));
    await s.close();
    // klavye: Enter ve Space beklemeden açar
    s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.waitForTimeout(300);
    await s.focus('.kd-pt__btn'); await bekleMenu(s, 1500);
    await s.keyboard.press('Escape'); await s.waitForTimeout(400);
    await s.evaluate(SAAT);
    for (const tus of ['Enter', ' ']) {
      await s.evaluate(SAAT_SIFIRLA);
      await s.keyboard.press(tus === ' ' ? 'Space' : tus); await s.waitForTimeout(300);
      z = await s.evaluate(SAAT_OKU); const g = ilkMenu(z, z.tus[0]) - z.tus[0];
      kontrol(`${w} klavye ${tus === ' ' ? 'Space' : 'Enter'}: menü beklemeden (< 100 ms) açılır`, z.acik && g < 100, JSON.stringify({ gec: Math.round(g), acik: z.acik }));
      await s.keyboard.press('Escape'); await s.waitForTimeout(420);
    }
    kontrol(`${w} klavye: Esc sonrası odak düğmede`, await s.evaluate(() => document.activeElement === document.querySelector('.kd-pt__btn')));
    await s.close();
    await bag.close();
  }

  // 2b · Dokunmatik: tek dokunuş → menü ~250 ms, çift dokunuş → sürpriz, sayfa yakınlaşmaz
  for (const w of [390, 768].filter((x) => GENISLIK.includes(x) || !process.env.GENISLIK)) {
    const bag = await baglam({ viewport: { width: w, height: BOY[w] }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    let s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.waitForTimeout(500); await s.evaluate(SAAT);
    let [x, y] = await merkez(s, '.kd-pt__btn');
    await s.touchscreen.tap(x, y); await s.waitForTimeout(700);
    let z = await s.evaluate(SAAT_OKU), g = ilkMenu(z, z.tik[0]) - z.tik[0];
    kontrol(`${w} dokunmatik tek dokunuş: menü ~250 ms sonra`, z.acik && g >= 220 && g <= 450, JSON.stringify({ gec: Math.round(g), acik: z.acik }));
    await s.close();
    s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.waitForTimeout(500); await s.evaluate(SAAT);
    [x, y] = await merkez(s, '.kd-pt__btn');
    await s.touchscreen.tap(x, y); await s.waitForTimeout(110); await s.touchscreen.tap(x, y);
    await s.waitForTimeout(400);
    z = await s.evaluate(SAAT_OKU);
    kontrol(`${w} çift dokunuş: sürpriz, menü açılmaz`, z.surpriz === '1' && z.d === 'surpriz' && z.menu.length === 0, JSON.stringify({ say: z.surpriz, d: z.d, menu: z.menu.length }));
    kontrol(`${w} çift dokunuş: sayfa yakınlaşmadı`, await s.evaluate(() => !window.visualViewport || Math.abs(visualViewport.scale - 1) < .01), await s.evaluate(() => String(window.visualViewport && visualViewport.scale)));
    await s.waitForTimeout(2400);
    kontrol(`${w} çift dokunuş: geri döner, menü kapalı`, (await durum(s)) === 'idle' && !(await menuAcik(s)));
    await s.close();
    await bag.close();
  }

  // 2c · Sürpriz anı: etkileşimli öğelerin ortası hiçbir karede örtülmez (dar ekranlar, kalabalık sayfa başları)
  for (const w of [768, 390, 320].filter((x) => GENISLIK.includes(x))) {
    const bag = await baglam({ viewport: { width: w, height: BOY[w] } });
    for (const yol of ['kids-tarifler.html', 'kids-araclar.html', 'kids.html']) {
      const a = await acSayfa(bag, yol, jsHata);
      await a.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await a.waitForTimeout(520);
      const [ax, ay] = await merkez(a, '.kd-pt__btn');
      await a.evaluate(IZ_BASLAT);
      await a.mouse.dblclick(ax, ay); await a.waitForTimeout(2400);
      const iz = await a.evaluate(IZ_BITIR);
      kontrol(`${w} ${yol} sürpriz: kare kare ölçüldü, menü açılmadı`, iz.kare >= 30 && iz.merkez > 0 && iz.surpriz === '1' && !iz.menu, JSON.stringify({ kare: iz.kare, merkez: iz.merkez, surpriz: iz.surpriz, menu: iz.menu }));
      kontrol(`${w} ${yol} sürpriz: etkileşimli öğelerin ortası hiçbir karede örtülmüyor`, Object.keys(iz.ihlal).length === 0, ihlalYazi(iz));
      await a.close();
    }
    await bag.close();
  }

  // 2d · Azaltılmış hareket: tek tık menü (zıplamasız), çift tık yalnız solma + tek parıltı
  {
    const bag = await baglam({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.waitForTimeout(500); await s.evaluate(SAAT);
    const [x, y] = await merkez(s, '.kd-pt__btn');
    await s.mouse.click(x, y); await s.waitForTimeout(600);
    let z = await s.evaluate(SAAT_OKU);
    kontrol('reduced: tek tık zıplamasız menü', z.acik && !z.durum.some(([d]) => d === 'tepki'), JSON.stringify(z.durum.map(([d]) => d)));
    await s.keyboard.press('Escape'); await s.mouse.move(1200, 300); await s.waitForTimeout(400);
    await s.mouse.dblclick(x, y); await s.waitForTimeout(250);
    const su = await s.evaluate(() => ({ d: document.querySelector('.kd-pt').getAttribute('data-durum'), n: document.querySelectorAll('.kd-pt__parca').length, m: !document.querySelector('#kdPtMenu').hidden }));
    kontrol('reduced: çift tık sürprizi solma + tek parıltı, menü yok', su.d === 'surpriz' && su.n === 1 && !su.m, JSON.stringify(su));
    await s.waitForTimeout(1500);
    kontrol('reduced: geri döner', (await durum(s)) === 'idle');
    await bag.close();
  }

  // 2e · Depolama kapalı, gizle/göster, video
  {
    const kapali = await baglam({ viewport: { width: 390, height: 844 } });
    await kapali.addInitScript(() => { Storage.prototype.getItem = function () { throw new Error('kapalı'); }; Storage.prototype.setItem = function () { throw new Error('kapalı'); }; });
    const once = jsHata.length;
    const s = await acSayfa(kapali, 'kids-tarifler.html', jsHata);
    await tikla(s, '.kd-pt__btn'); const am = await bekleMenu(s, 3000);
    kontrol('depolama kapalı: Pütür çalışır, hata yok', am && jsHata.length === once, jsHata.slice(once).join(' | '));
    await kapali.close();

    const g = await baglam({ viewport: { width: 1440, height: 900 } });
    const p = await acSayfa(g, 'kids-tarifler.html', jsHata);
    await p.hover('.kd-pt__btn'); await p.waitForTimeout(260);
    await tikla(p, '.kd-pt__kucult'); await p.waitForTimeout(150);
    kontrol('gizle: sekme görünür, Pütür gizli', await p.evaluate(() => document.querySelector('.kd-pt').hidden && !document.querySelector('.kd-pt-sekme').hidden));
    await p.reload({ waitUntil: 'networkidle' });
    kontrol('gizle: yenilemede hatırlanır', await p.evaluate(() => document.querySelector('.kd-pt').hidden));
    await tikla(p, '.kd-pt-sekme'); await p.waitForTimeout(150);
    kontrol('gizle: sekme geri getirir', await p.evaluate(() => !document.querySelector('.kd-pt').hidden));
    await g.close();

    const v = await baglam({ viewport: { width: 1440, height: 900 } }, { video: true });
    const q = await acSayfa(v, 'kids-tarifler.html', jsHata);
    await q.waitForFunction(() => /hazir|yok/.test(document.querySelector('.kd-pt').getAttribute('data-video') || ''), null, { timeout: 8000 }).catch(() => {});
    kontrol('video: Chromium VP9 alfa hazır', (await q.evaluate(() => document.querySelector('.kd-pt').getAttribute('data-video'))) === 'hazir');
    await q.waitForTimeout(500);
    await tikla(q, '.kd-pt__btn');
    const oynadi = await q.waitForFunction(() => document.querySelector('.kd-pt--video'), null, { timeout: 1500 }).then(() => true, () => false);
    kontrol('video: tek tıkta zıplama videosu oynar, menü açık', oynadi && await menuAcik(q));
    await q.waitForTimeout(2800);
    kontrol('video: bitince SVG döner, menü açık kalır', await q.evaluate(() => !document.querySelector('.kd-pt--video') && getComputedStyle(document.querySelector('.kd-pt__svg')).visibility === 'visible' && !document.querySelector('#kdPtMenu').hidden));
    await v.close();
  }
  yaz(`· davranış bitti (${gecen} geçti, ${kalan} kaldı) ${Math.round((Date.now() - t0) / 1000)} sn`);
}

/* ---------- 3 · Arayüz: touch-action, köşe yarıçapı, cevaplar ve V2 metin kuralları ---------- */
const YARICAP = () => {
  const KARAKTER = '.kd-pt__btn, .kd-pt__zemin, .kd-pt__golge, .kd-pt__parilti, .kd-pt__karakter, .kd-pt__karakter *, .kd-pt__sahne, .kd-pt__sahne *';
  const out = [];
  for (const e of document.querySelectorAll('.kd-pt, .kd-pt *, .kd-pt-sekme, .kd-pt-sekme *')) {
    if (e.matches(KARAKTER) || e instanceof SVGElement) continue;
    for (const ps of [null, '::before', '::after']) {
      const c = getComputedStyle(e, ps);
      if (ps ? c.content === 'none' || c.content === 'normal' : c.display === 'none') continue;
      const r = e.getBoundingClientRect(); let gen = ps ? parseFloat(c.width) : r.width, yuk = ps ? parseFloat(c.height) : r.height;
      if (!e.getClientRects().length) continue;                                 // görünmeyen (gizli üst öğe)
      if (ps && !(gen > 0)) { gen = r.width; yuk = r.height; }                  // inset ile boyutlanan sözde öğe: üst öğenin oranı
      const kare = Math.abs(gen - yuk) <= 1;
      for (const k of ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']) {
        const v = c[k]; if (!v || v === '0px') continue;
        const yuzde = /%/.test(v), px = parseFloat(v);
        // Beyar 2 Kas R2: köşe TEK DEĞER = Gastro buton köşesi 12px (kısa öğede yarı kenara kırpılması serbest); daire yalnız kare öğede
        const ok = yuzde ? (px === 50 && kare) : Math.abs(px - 12) <= .51 || (kare && px >= Math.min(gen, yuk) / 2 - .5);
        if (!ok) { out.push(`${(e.className && e.className.baseVal === undefined ? e.className : e.tagName)}${ps || ''} ${k.replace('border', '').replace('Radius', '')}=${v} (${Math.round(gen)}×${Math.round(yuk)})`); break; }
      }
    }
  }
  return [...new Set(out)];
};
const METIN_KURAL = (t) => {
  const s = [];
  if (/Dada Kids/.test(t)) s.push('"Dada Kids"');
  if (/\bMevsim\b(?! Takvimi)/.test(t)) s.push('"Mevsim" (Takvimi olmadan)');
  if (/(uzman|doktor|hekim)\s+onaylı|\bonaylı\b|\bonaylanmış\b|Pediatrist/i.test(t)) s.push('sahte onay');
  return s;
};
if (BOLUM.has('arayuz')) for (const w of [1440, 390].filter((x) => GENISLIK.includes(x) || !process.env.GENISLIK)) {
  const bag = await baglam({ viewport: { width: w, height: BOY[w] }, hasTouch: w < 768 });
  const s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.waitForTimeout(400);
  const ta = await s.evaluate(() => {
    const t = (sec) => [...document.querySelectorAll(sec)].map((e) => getComputedStyle(e).touchAction);
    return { btn: t('.kd-pt__btn'), kucult: t('.kd-pt__kucult'), oge: t('.kd-pt__oge'), sekme: t('.kd-pt-sekme'), yakala: t('.kd-pt-yakala'), html: getComputedStyle(document.documentElement).touchAction, body: getComputedStyle(document.body).touchAction };
  });
  const hepsi = [...ta.btn, ...ta.kucult, ...ta.oge, ...ta.sekme, ...ta.yakala];
  kontrol(`${w} touch-action: Pütür'ün tıklanabilir alanlarında manipulation`, hepsi.length >= 10 && hepsi.every((v) => v === 'manipulation'), JSON.stringify(ta));
  kontrol(`${w} touch-action: sayfa geneli değişmedi (html/body)`, ta.html !== 'manipulation' && ta.body !== 'manipulation', JSON.stringify([ta.html, ta.body]));
  await s.focus('.kd-pt__btn'); await s.keyboard.press('Enter'); await bekleMenu(s); await s.waitForTimeout(650);
  let yr = await s.evaluate(YARICAP);
  kontrol(`${w} köşe yarıçapı: menü, küçült düğmesi Gastro ölçeğinde (daire yalnız ikon dairesi)`, yr.length === 0, yr.slice(0, 4).join(' | '));
  const metinler = [await s.evaluate(() => document.querySelector('.kd-pt').innerText + ' ' + [...document.querySelectorAll('.kd-pt [aria-label], .kd-pt-sekme')].map((e) => e.getAttribute('aria-label')).join(' '))];
  const balon = async (kod) => {
    if (!(await menuAcik(s))) { await s.focus('.kd-pt__btn'); await s.keyboard.press('Enter'); await bekleMenu(s); await s.waitForTimeout(650); }
    await tikla(s, `.kd-pt__oge[data-secenek="${kod}"]`);
    await s.waitForFunction(() => document.querySelector('.kd-pt__baslik'), null, { timeout: 4000 }).catch(() => {});
    await s.waitForTimeout(260);
  };
  const ic = () => s.evaluate(() => document.querySelector('.kd-pt__balon').innerText);
  const kapat = async () => { await s.keyboard.press('Escape'); await s.waitForTimeout(320); };
  const yil = new Date().getFullYear();
  // Kaç aylık: 3 yaşı geçmiş → "Dada Gastro Kids"
  await balon('yas');
  await tikla(s, `[data-yil="${yil - 3}"]`); await tikla(s, '[data-ay="1"]'); await s.waitForTimeout(150);
  let t = await ic(); metinler.push(t);
  kontrol(`${w} yaş: 3 yaş üstünde "Dada Gastro Kids 3 yaşa kadar"`, /Dada Gastro Kids 3 yaşa kadar/.test(t), t.slice(0, 160));
  yr = await s.evaluate(YARICAP);
  kontrol(`${w} köşe yarıçapı: balon, chip, düğme Gastro ölçeğinde`, yr.length === 0, yr.slice(0, 4).join(' | '));
  const tb = await s.evaluate(() => [...document.querySelectorAll('.kd-pt__balon button, .kd-pt__balon a')].map((e) => getComputedStyle(e).touchAction));
  kontrol(`${w} touch-action: balon düğmeleri manipulation`, tb.length > 10 && tb.every((v) => v === 'manipulation'), [...new Set(tb)].join(','));
  await kapat();
  // Besin: üzüm → rozet, örnek etiketi
  await balon('besin');
  await s.fill('#kdPtAra', 'üzüm');
  await s.waitForFunction(() => document.querySelector('.kd-pt__besin'), null, { timeout: 4000 }).catch(() => {});
  t = await ic(); metinler.push(t);
  kontrol(`${w} besin: üzüm kartı, "Örnek içerik / uzman onayı bekliyor" notu YOK (Beyar 1 Kas)`, /Üzüm/.test(t) && !/Örnek içerik|uzman onayı bekliyor/i.test(t), t.slice(0, 160));
  yr = await s.evaluate(YARICAP);
  kontrol(`${w} köşe yarıçapı: arama kutusu, besin kartı, rozet Gastro ölçeğinde`, yr.length === 0, yr.slice(0, 4).join(' | '));
  await kapat();
  // Tarif: 3 öneri, kart görselleri
  await balon('tarif');
  t = await ic(); metinler.push(t);
  kontrol(`${w} tarif: 3 öneri`, (await s.evaluate(() => document.querySelectorAll('.kd-pt__tarifler a').length)) === 3, t.slice(0, 120));
  yr = await s.evaluate(YARICAP);
  kontrol(`${w} köşe yarıçapı: tarif listesi Gastro ölçeğinde`, yr.length === 0, yr.slice(0, 4).join(' | '));
  await kapat();
  for (const kod of ['alerjen', 'hazir']) {
    await balon(kod); t = await ic(); metinler.push(t);
    kontrol(`${w} ${kod}: "Örnek içerik / uzman onayı bekliyor" notu YOK (Beyar 1 Kas)`, !/Örnek içerik|uzman onayı bekliyor/i.test(t), t.slice(0, 120));
    await kapat();
  }
  // Acil: yalnız 112, ilk yardım adımı yok
  await balon('acil');
  t = await ic(); metinler.push(t);
  const acil = await s.evaluate(() => ({ tel: [...document.querySelectorAll('.kd-pt__balon a[href^="tel:"]')].map((a) => a.getAttribute('href')) }));
  kontrol(`${w} acil: yalnız 112'ye yönlendirir`, acil.tel.length === 1 && acil.tel[0] === 'tel:112' && /112/.test(t), JSON.stringify(acil));
  kontrol(`${w} acil: ilk yardım adımı yok`, !/(sırt|vurun|vurma|karın|bastır|heimlich|ters çevir|parmağı|ağzını açın|kalp masajı|suni solunum)/i.test(t), t.slice(0, 200));
  yr = await s.evaluate(YARICAP);
  kontrol(`${w} köşe yarıçapı: acil kutusu Gastro ölçeğinde`, yr.length === 0, yr.slice(0, 4).join(' | '));
  await kapat();
  // gizli sekme
  await s.hover('.kd-pt__btn').catch(() => {}); await s.waitForTimeout(200);
  await s.evaluate(() => document.querySelector('.kd-pt__kucult').click()); await s.waitForTimeout(150);
  yr = await s.evaluate(YARICAP);
  kontrol(`${w} köşe yarıçapı: gizli sekme Gastro ölçeğinde`, yr.length === 0, yr.slice(0, 4).join(' | '));
  await s.evaluate(() => document.querySelector('.kd-pt-sekme').click());
  const ihlal = [...new Set(metinler.flatMap(METIN_KURAL))];
  kontrol(`${w} V2 metin: "Dada Gastro Kids", "Mevsim Takvimi", sahte onay yok`, ihlal.length === 0, ihlal.join(' | '));
  await bag.close();
}

kontrol('sayfa içi JS hatası / yerel 4xx yok', jsHata.length === 0, [...new Set(jsHata)].slice(0, 6).join(' | '));
await tarayici.close();
yaz(`\nPütür kapısı: ${gecen}/${gecen + kalan} geçti${kalan ? ' — KALDI' : ''} (${SAYFALAR.length} sayfa, ${Math.round((Date.now() - t0) / 1000)} sn)`);
if (kalan) { yaz('İlk kalanlar:'); hatalar.slice(0, 12).forEach((h) => yaz('  · ' + h)); }
process.exit(kalan ? 1 : 0);
