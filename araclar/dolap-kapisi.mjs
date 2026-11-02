// Dolap kapısı ("Dolapta Ne Var?" bileşeni · src/kids/dolap.mjs + varlik/kids/js/kiler.js). Playwright Chromium.
// Revize 2 Kas: bileşen yalnız kids-bebek-dolabi.html'de (a–i); Kids Tarifleri'nde yerine bant (k); yaş barı iki sayfada (j).
// Genişlik: a–h 1440 · 1024 · 390 · 320 (GENISLIK), i–k 1440 · 390.
//  a kartlar: kategorili malzeme kartları var; her kartın görseli şeffaf Pixar ikonu varlik/kids/gorsel/urun-pixar/*.webp
//    (yoksa yedek urun/ fotoğrafı — bilgi olarak yazılır), yüklü, alt dolu; ikon zeminsiz/halkasız
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
//  i kayan şerit (R4): her kategori tek satır yatay şerit (overflow-x, scroll-snap x); reducedMotion YOKKEN kendi kendine kayar;
//    imleç üstündeyken / şeritte odak varken / "Kaydırmayı durdur" basılıyken / şerit ekran dışındayken / sekme gizliyken kaymaz;
//    düğme yeniden başlatır; ok düğmeleri ileri-geri kaydırır; klavyeyle (Tab) en uzun şeridin tüm kartlarına erişilir ve odaklı
//    kart şeridin görünür alanında; reducedMotion'da kayma yok ve duraklat düğmesi gizli
//  j yaş barı (R9/R11): iki sayfada aynı bileşen (Tümü, +6 … +24 Ay, sayılı); sayfanın ilk görünür içeriği (hero/kırıntı yok, tek h1 var);
//    kaydırınca top = Kids barının alt kenarı (±1px) ve üstü örtülmüyor; güvenlik şeridi yaş barının üstünde değil
//    (Tarifler: ızgaranın altında · Bebek Dolabı: sonuçların altında); Bebek Dolabı'nda dolap doluyken sayılar sonuç sayısı
//  k Kids Tarifleri bandı (R10): dolap bileşeni yok; "Elindeki malzemelerle…" bandı yaş barının altında, listenin üstünde,
//    köşe = Gastro düğme köşesi; bağ kids-bebek-dolabi.html, profil (evre/c) ve seçili yaşı taşır
// Kullanım: node araclar/dolap-kapisi.mjs   · TABAN=http://localhost:8765/DadaKids/ · GENISLIK=1440,390 · HARF=abcdefghijk
import { chromium } from 'playwright';

const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GENISLIK = (process.env.GENISLIK || '1440,1024,390,320').split(',').map(Number);
const HARF = process.env.HARF || 'abcdefghijk';
const SUZ = (process.env.SAYFA || '').split(',').filter(Boolean);
const sec = (s) => !SUZ.length || SUZ.some((x) => s.includes(x));
const SAYFALAR = ['kids-bebek-dolabi.html'].filter(sec);
const DEPO = 'dadagastrokids.kiler.v1';
const sonuc = [];
const kaydet = (harf, w, sayfa, ayrinti) => sonuc.push({ harf, w, sayfa, ok: !ayrinti.length, ayrinti });
const t = await chromium.launch();
const bag = (w, ek = {}) => t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', ...ek });

async function hazirla(p, sayfa) {
  await p.goto(TABAN + sayfa, { waitUntil: 'networkidle' });
  await p.waitForTimeout(150);
}
const yasSec = async (p, y) => { await p.locator(`#kdYasSerit .kd-yas-chip[data-yas="${y}"]`).click(); await p.waitForTimeout(150); };
async function kartTikla(p, a) {
  const k = p.locator(`.kd-mz[data-a="${a}"]`);
  const u0 = p.url();
  if (!(await k.count())) return false;
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

for (const sayfa of /[a-h]/.test(HARF) ? SAYFALAR : []) for (const w of GENISLIK) {
  const c = await bag(w); const p = await c.newPage();
  const jsHata = []; p.on('pageerror', (e) => jsHata.push(e.message));
  await hazirla(p, sayfa);

  /* a */
  {
    const s = [];
    const r = await p.evaluate(async () => {
      const kartlar = [...document.querySelectorAll('.kd-mz')];
      const kat = [...document.querySelectorAll('.kd-dolap-kat')].map((k) => k.dataset.kat);
      const kotu = [], yedek = [];
      for (const k of kartlar) {
        const i = k.querySelector('img');
        if (!i) { kotu.push(k.dataset.a + ': görsel yok'); continue; }
        const src = i.getAttribute('src');
        if (/varlik\/kids\/gorsel\/urun\/.+\.webp$/.test(src)) yedek.push(k.dataset.a);
        else if (!/varlik\/kids\/gorsel\/urun-pixar\/.+-k\.webp$/.test(src)) kotu.push(k.dataset.a + ': şeffaf ürün ikonu değil ' + src);
        else { const c = getComputedStyle(i), f = getComputedStyle(i.parentElement); if (c.boxShadow !== 'none' || f.boxShadow !== 'none' || c.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(c.borderTopLeftRadius) > 0) kotu.push(k.dataset.a + ': şeffaf ikonda zemin/halka/kırpım var'); }
        if (!i.alt.trim()) kotu.push(k.dataset.a + ': alt boş');
        i.loading = 'eager'; if (!i.complete) await new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 3000); });
        if (!i.naturalWidth) kotu.push(k.dataset.a + ': görsel yüklenmedi');
      }
      return { n: kartlar.length, kat, kotu, yedek };
    });
    if (r.yedek.length && w === GENISLIK[0]) console.log(`  bilgi: Pixar ikonu olmayan (yedek fotoğraf) ${r.yedek.length}: ${r.yedek.join(', ')}`);
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
        // kayan şeritte şeridin görünür alanı dışındaki kart taşma değildir (şerit kendisi ölçülür)
        const iz = e.closest('.kd-kayan'); if (iz && iz !== e) { const b = iz.getBoundingClientRect(); if (r.right <= b.left + 1 || r.left >= b.right - 1 || r.left < b.left - 1 || r.right > b.right + 1) return; }
        if (r.right > innerWidth + 1 || r.left < -1) f.push(`görünür alan dışı: ${e.className || e.tagName} (${Math.round(r.left)}–${Math.round(r.right)})`);
        const metin = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (metin && (cs.overflowX !== 'visible' || cs.textOverflow === 'ellipsis') && e.scrollWidth > e.clientWidth + 1) f.push(`kırpılan metin: ${String(e.className).slice(0, 40)} "${e.textContent.trim().slice(0, 24)}"`);
      });
      // kapsam: tüm .kd-sayfa; boş alt yalnız aria-hidden kapsamındaki UI ikonu ya da dekoratif kategori ikonu için serbest
      document.querySelectorAll('.kd-sayfa img').forEach((i) => {
        const dek = !!i.closest('[aria-hidden="true"]') && (/varlik\/kids\/svg\/ui\//.test(i.getAttribute('src') || '') || !!i.closest('.kd-dolap-kat__kapak'));
        if (!dek && !i.alt.trim()) g.push(`alt boş: ${(i.getAttribute('src') || '').slice(-50)}`);
      });
      kok.querySelectorAll('img').forEach((i) => { const s = i.getAttribute('src') || ''; if (/\.svg($|\?)/.test(s) && !/svg\/ui\//.test(s)) g.push(`SVG içerik görseli: ${s}`); if (/(illus|maskot|putur)\//.test(s)) g.push(`illüstrasyon: ${s}`); });
      kok.querySelectorAll('svg').forEach((s) => { const r = s.getBoundingClientRect(); if (r.width > 32 || r.height > 32) g.push(`büyük satır içi SVG ${Math.round(r.width)}×${Math.round(r.height)} (${s.parentElement.className})`); });
      return { f: [...new Set(f)], g: [...new Set(g)], bilgi: [] };
    });
    kaydet('f', w, sayfa, r.f.slice(0, 6));
    kaydet('g', w, sayfa, r.g.slice(0, 6));
    if (r.bilgi.length) console.log(`  bilgi (${sayfa} ${w}): bileşen dışında dekoratif boş alt: ${r.bilgi.join(', ')}`);
  }
  kaydet('h', w, sayfa, jsHata.slice(0, 3));
  await c.close();
}
/* i · kayan şerit (reducedMotion YOK bağlamında) */
const BEKLE = 4600;   // adım 3,2 sn + kademe + tik payı
const izX = (p, id) => p.evaluate((id) => Math.round(document.getElementById(id).scrollLeft), id);
async function izGoster(p, id) {   // şeridi ekranın ortasına al, imleci sol kenar boşluğuna çek
  await p.evaluate((id) => { const e = document.getElementById(id); const r = e.getBoundingClientRect(); scrollBy(0, r.top - innerHeight / 2 + r.height / 2); }, id);
  await p.mouse.move(1, 1); await p.waitForTimeout(300);
}
if (HARF.includes('i') && sec('kids-bebek-dolabi')) for (const w of [1440, 390]) {
  const s = [];
  const c = await bag(w, { reducedMotion: 'no-preference' }); const p = await c.newPage(); const jsHata = []; p.on('pageerror', (e) => jsHata.push(e.message));
  await p.goto(TABAN + 'kids-bebek-dolabi.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  const yapi = await p.evaluate(() => [...document.querySelectorAll('.kd-dolap-kat')].map((k) => {
    const iz = k.querySelector('.kd-kayan'), cs = iz && getComputedStyle(iz); if (!iz) return { kat: k.dataset.kat, hata: 'şerit yok' };
    const ustler = [...iz.querySelectorAll('.kd-mz')].map((m) => Math.round(m.getBoundingClientRect().top));
    return { kat: k.dataset.kat, id: iz.id, ox: cs.overflowX, snap: cs.scrollSnapType, tekSatir: Math.max(...ustler) - Math.min(...ustler) <= 2, tasma: iz.scrollWidth > iz.clientWidth + 2, n: ustler.length, oklar: k.querySelectorAll('[data-kd-kayan-yon]').length };
  }));
  for (const y of yapi) {
    if (y.hata) { s.push(`${y.kat}: ${y.hata}`); continue; }
    if (!/auto|scroll/.test(y.ox) || !/x/.test(y.snap)) s.push(`${y.kat}: yatay kaydırma/scroll-snap yok (${y.ox} · ${y.snap})`);
    if (!y.tekSatir) s.push(`${y.kat}: kartlar tek satır değil`);
    if (y.oklar !== 2) s.push(`${y.kat}: önceki/sonraki düğmesi yok`);
  }
  const hedef = yapi.find((y) => y.tasma && !y.hata);
  if (!hedef) s.push('taşan şerit yok (kayma ölçülemedi)');
  else {
    const id = hedef.id, dur = p.locator('[data-kd-kayan-dur]');
    await izGoster(p, id);
    let x0 = await izX(p, id); await p.waitForTimeout(BEKLE); let x1 = await izX(p, id);
    if (x1 === x0) s.push(`kendi kendine kaymadı (${id} scrollLeft ${x0})`);
    // imleç üstünde
    const kutu = await p.locator('#' + id).boundingBox();
    await p.mouse.move(kutu.x + kutu.width / 2, kutu.y + kutu.height / 2); await p.waitForTimeout(400);
    x0 = await izX(p, id); await p.waitForTimeout(BEKLE); x1 = await izX(p, id);
    if (x1 !== x0) s.push('imleç şeridin üstündeyken kaydı');
    await p.mouse.move(1, 1);
    // odak
    await p.evaluate((id) => document.querySelector(`#${id} .kd-mz`).focus({ preventScroll: true }), id); await p.waitForTimeout(400);
    x0 = await izX(p, id); await p.waitForTimeout(BEKLE); x1 = await izX(p, id);
    if (x1 !== x0) s.push('şeritte odak varken kaydı');
    await p.evaluate(() => document.activeElement.blur());
    // duraklat düğmesi
    if (!(await dur.isVisible())) s.push('"Kaydırmayı durdur" düğmesi görünmüyor');
    else {
      await dur.click(); await p.mouse.move(1, 1); await p.evaluate(() => document.activeElement.blur()); await izGoster(p, id);
      const metin = (await dur.textContent()).trim();
      if (!/başlat/i.test(metin) || await dur.getAttribute('aria-pressed') !== 'true') s.push(`durdurunca düğme durumu: "${metin}" aria-pressed=${await dur.getAttribute('aria-pressed')}`);
      x0 = await izX(p, id); await p.waitForTimeout(BEKLE); x1 = await izX(p, id);
      if (x1 !== x0) s.push('"Kaydırmayı durdur" basılıyken kaydı');
      await dur.click(); await p.evaluate(() => document.activeElement.blur()); await izGoster(p, id);
      x0 = await izX(p, id); await p.waitForTimeout(BEKLE); x1 = await izX(p, id);
      if (x1 === x0) s.push('"Kaydırmayı başlat" sonrası yeniden kaymadı');
    }
    // sekme gizli
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    x0 = await izX(p, id); await p.waitForTimeout(BEKLE); x1 = await izX(p, id);
    if (x1 !== x0) s.push('sekme gizliyken kaydı');
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    // ekran dışı
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(400);
    const disari = await p.evaluate((id) => { const r = document.getElementById(id).getBoundingClientRect(); return r.bottom < 0 || r.top > innerHeight; }, id);
    if (disari) { x0 = await izX(p, id); await p.waitForTimeout(BEKLE); x1 = await izX(p, id); if (x1 !== x0) s.push('şerit ekran dışındayken kaydı'); }
    // ok düğmeleri
    await izGoster(p, id); await p.evaluate((id) => document.getElementById(id).scrollTo({ left: 0, behavior: 'auto' }), id); await p.waitForTimeout(200);
    const sonraki = p.locator(`[data-kd-kayan-yon="1"][aria-controls="${id}"]`), onceki = p.locator(`[data-kd-kayan-yon="-1"][aria-controls="${id}"]`);
    if (!(await onceki.isDisabled())) s.push('başta "önceki" düğmesi etkin');
    x0 = await izX(p, id); await sonraki.click(); await p.mouse.move(1, 1); await p.waitForTimeout(900); x1 = await izX(p, id);
    if (!(x1 > x0)) s.push(`"sonraki" düğmesi kaydırmadı (${x0} → ${x1})`);
    await onceki.click(); await p.mouse.move(1, 1); await p.waitForTimeout(900); const x2 = await izX(p, id);
    if (!(x2 < x1)) s.push(`"önceki" düğmesi kaydırmadı (${x1} → ${x2})`);
  }
  // klavye: en uzun şeridin tüm kartları Tab ile, odaklı kart şeridin görünür alanında
  {
    const enUzun = yapi.filter((y) => !y.hata).sort((a, b) => b.n - a.n)[0];
    await p.evaluate((id) => { document.getElementById(id).scrollLeft = 0; document.querySelector(`#${id} .kd-mz`).focus(); }, enUzun.id);
    let ulasilan = 1, gorunmez = 0;
    for (let i = 1; i < enUzun.n; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(enUzun.n > 12 ? 60 : 90);
      const r = await p.evaluate((id) => { const a = document.activeElement, iz = document.getElementById(id); if (!iz.contains(a)) return null; const b = a.getBoundingClientRect(), z = iz.getBoundingClientRect(); return b.left >= z.left - 1 && b.right <= z.right + 1; }, enUzun.id);
      if (r === null) break; ulasilan++; if (!r) gorunmez++;
    }
    if (ulasilan < enUzun.n) s.push(`klavyeyle ${enUzun.kat} şeridinde ${ulasilan}/${enUzun.n} karta ulaşıldı`);
    if (gorunmez) s.push(`${gorunmez} kart odaklıyken şeridin görünür alanında değil`);
  }
  if (jsHata.length) s.push('JS hatası: ' + jsHata[0].slice(0, 80));
  await c.close();
  // reducedMotion: kayma yok, düğme gizli
  const c2 = await bag(w); const p2 = await c2.newPage();
  await p2.goto(TABAN + 'kids-bebek-dolabi.html', { waitUntil: 'networkidle' });
  if (hedef) {
    await izGoster(p2, hedef.id);
    const x0 = await izX(p2, hedef.id); await p2.waitForTimeout(BEKLE); const x1 = await izX(p2, hedef.id);
    if (x1 !== x0) s.push('reducedMotion\'da otomatik kaydı');
  }
  if (await p2.locator('[data-kd-kayan-dur]').isVisible()) s.push('reducedMotion\'da duraklat düğmesi görünür (kayma yokken gereksiz)');
  await c2.close();
  kaydet('i', w, 'kids-bebek-dolabi.html', s);
}

/* j · yaş barı (iki sayfa) */
const YAS_ETIKET = ['Tümü', '+6 Ay', '+8 Ay', '+9 Ay', '+12 Ay', '+18 Ay', '+24 Ay'];
for (const sayfa of HARF.includes('j') ? ['kids-tarifler.html', 'kids-bebek-dolabi.html'].filter(sec) : []) for (const w of [1440, 390]) {
  const s = [];
  const c = await bag(w); const p = await c.newPage();
  await p.goto(TABAN + sayfa, { waitUntil: 'networkidle' }); await p.waitForTimeout(200);
  const r = await p.evaluate(() => {
    const gor = (e) => { const b = e.getBoundingClientRect(); if (b.height < 1 || b.width < 1) return false; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden') return false; } return !e.classList.contains('kd-gizli'); };
    const yas = document.querySelector('.kd-tl-yas'); if (!yas) return { hata: 'yaş barı (.kd-tl-yas) yok' };
    const ilk = [...document.querySelectorAll('.kd-sayfa > *')].filter((e) => !e.matches('.kd-ust, nav, h1.kd-gizli') && gor(e))[0];
    const yT = yas.getBoundingClientRect().top + scrollY;
    const ust = [...document.querySelectorAll('.kd-sayfa .kd-hero, .kd-sayfa .kd-kirinti, .kd-guvenlik-serit')].filter(gor).filter((e) => e.getBoundingClientRect().top + scrollY < yT).map((e) => e.className.split(' ')[0]);
    const chip = [...yas.querySelectorAll('.kd-yas-chip')].map((c) => { const k = c.cloneNode(true); const sm = k.querySelector('small'); const n = sm ? sm.textContent.trim() : ''; sm && sm.remove(); return { et: k.textContent.trim(), n }; });
    const serit = document.querySelector('.kd-guvenlik-serit'), sT = serit ? serit.getBoundingClientRect().top + scrollY : null;
    const ref = document.querySelector('#kdTarifIzgara') || document.querySelector('#kdDolapSonuc');
    return { ilk: ilk ? ilk.className : '-', ust, chip, h1: document.querySelectorAll('h1').length, serit: sT, refAlt: ref ? ref.getBoundingClientRect().bottom + scrollY : null };
  });
  if (r.hata) s.push(r.hata);
  else {
    if (!/kd-tl-yas/.test(r.ilk)) s.push(`ilk görünür içerik yaş barı değil (${r.ilk})`);
    if (r.ust.length) s.push(`yaş barının üstünde: ${r.ust.join(', ')}`);
    if (r.h1 !== 1) s.push(`h1 sayısı ${r.h1}`);
    if (JSON.stringify(r.chip.map((c) => c.et.toLocaleLowerCase('tr'))) !== JSON.stringify(YAS_ETIKET.map((x) => x.toLocaleLowerCase('tr')))) s.push(`yaş seçenekleri: ${r.chip.map((c) => c.et).join(' / ')}`);
    if (!r.chip.every((c) => /^\d+$/.test(c.n))) s.push('yaş seçeneklerinde sayı yok');
    if (r.serit == null || r.refAlt == null || r.serit < r.refAlt - 1) s.push(`güvenlik şeridi ${sayfa.includes('tarifler') ? 'ızgaranın' : 'sonuçların'} altında değil`);
  }
  await p.mouse.move(2, 420); for (let i = 0; i < 9; i++) { await p.mouse.wheel(0, 180); await p.waitForTimeout(90); }
  await p.waitForTimeout(700);
  const y = await p.evaluate(() => { const u = document.querySelector('.kd-ust').getBoundingClientRect(), b = document.querySelector('.kd-tl-yas'), r = b.getBoundingClientRect(); const ust = document.elementFromPoint(r.left + r.width / 2, r.top + 3); return { fark: r.top - u.bottom, ortulu: !!ust && !b.contains(ust), sy: scrollY }; });
  if (Math.abs(y.fark) > 1) s.push(`kaydırınca yaş barı Kids barına yapışık değil (fark ${y.fark.toFixed(1)}px, scrollY ${Math.round(y.sy)})`);
  if (y.ortulu) s.push('yapışık yaş barının üstü örtülüyor');
  if (sayfa === 'kids-bebek-dolabi.html') {
    await p.evaluate(() => scrollTo(0, 0));
    await p.locator('#kdYasSerit .kd-yas-chip[data-yas="tumu"]').click();
    await kartTikla(p, 'havuc'); await kartTikla(p, 'patates');
    const n = await p.evaluate(() => ({ cip: +document.querySelector('#kdYasSerit [data-yas="tumu"] small').textContent, sonuc: +document.getElementById('kdDolapSonucSay').textContent }));
    if (n.cip !== n.sonuc) s.push(`dolap doluyken "Tümü" sayısı ${n.cip}, sonuç ${n.sonuc}`);
  }
  await c.close();
  kaydet('j', w, sayfa, s);
}

/* k · Kids Tarifleri bandı */
if (HARF.includes('k') && sec('kids-tarifler')) for (const w of [1440, 390]) {
  const s = [];
  const c = await bag(w); const p = await c.newPage(); const jsHata = []; p.on('pageerror', (e) => jsHata.push(e.message));
  await p.goto(TABAN + 'index.html', { waitUntil: 'domcontentloaded' });
  const R = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((e) => /Giriş Yap/.test(e.textContent) && e.offsetWidth); return b ? parseFloat(getComputedStyle(b).borderTopLeftRadius) : 12; });
  await p.goto(TABAN + 'kids-tarifler.html?evre=9-12-ay&c=kiz', { waitUntil: 'networkidle' }); await p.waitForTimeout(200);
  const r = await p.evaluate(() => {
    const b = document.querySelector('[data-kd-dolap-bag]'); if (!b) return { hata: 'bant ([data-kd-dolap-bag]) yok' };
    const y = (e) => e ? e.getBoundingClientRect().top + scrollY : null, a = (e) => e.getBoundingClientRect().bottom + scrollY;
    return { dolap: !!document.querySelector('#dolap, #kdDolap, .kd-mz'), metin: b.textContent.replace(/\s+/g, ' ').trim(), href: b.getAttribute('href'), r: parseFloat(getComputedStyle(b).borderTopLeftRadius), ust: y(b), yasAlt: a(document.querySelector('.kd-tl-yas')), liste: y(document.querySelector('.kd-liste')), gen: b.getBoundingClientRect().width, wrap: b.closest('.wrap').clientWidth - parseFloat(getComputedStyle(b.closest('.wrap')).paddingLeft) * 2, boy: b.getBoundingClientRect().height };
  });
  if (r.hata) s.push(r.hata);
  else {
    if (r.dolap) s.push('Tarifler sayfasında dolap bileşeni hâlâ var');
    if (!/Elindeki malzemelerle bebeğine ne yapabilirsin\? Bebek Dolabı'nı aç/.test(r.metin)) s.push(`bant metni: "${r.metin}"`);
    if (!(r.ust >= r.yasAlt - 1 && r.ust < r.liste)) s.push(`bant yaş barı (${Math.round(r.yasAlt)}) ile liste (${Math.round(r.liste)}) arasında değil (${Math.round(r.ust)})`);
    if (Math.abs(r.r - R) > 0.5) s.push(`bant köşesi ${r.r}px (Gastro düğmesi ${R}px)`);
    if (r.gen < r.wrap - 2) s.push(`bant tam genişlik değil (${Math.round(r.gen)} / ${Math.round(r.wrap)})`);
    if (w > 640 && r.boy > 72) s.push(`bant ince değil (${Math.round(r.boy)}px)`);
    const u = new URL(r.href, p.url());
    if (!/kids-bebek-dolabi\.html$/.test(u.pathname) || u.searchParams.get('evre') !== '9-12-ay' || u.searchParams.get('c') !== 'kiz') s.push(`bant bağı profili taşımıyor: ${r.href}`);
    await p.locator('#kdYasSerit .kd-yas-chip[data-yas="12"]').click(); await p.waitForTimeout(150);
    await Promise.all([p.waitForURL(/kids-bebek-dolabi\.html/), p.locator('[data-kd-dolap-bag]').click()]);
    await p.waitForLoadState('networkidle');
    const q = new URL(p.url()).searchParams;
    if (q.get('yas') !== '12' || q.get('evre') !== '9-12-ay' || q.get('c') !== 'kiz') s.push(`bant tıklanınca adres: ${p.url().split('/').pop()}`);
    const secili = await p.getAttribute('#kdYasSerit .kd-yas-chip[aria-checked="true"]', 'data-yas');
    if (secili !== '12') s.push(`Bebek Dolabı'nda seçili yaş ${secili} (12 olmalı)`);
  }
  if (jsHata.length) s.push('JS hatası: ' + jsHata[0].slice(0, 80));
  await c.close();
  kaydet('k', w, 'kids-tarifler.html', s);
}
await t.close();

const ad = { a: 'kartlar (şeffaf ikon + alt)', b: 'eşleşme / iki grup', c: 'yaş sonuçları süzer', d: 'riskli (bal, bütün kuruyemiş)', e: 'Bebek Kilerim', f: 'taşma / kesilme', g: 'alt metin, illüstrasyon yok', h: 'JS hatası', i: 'kayan şerit', j: 'yaş barı (yapışkan, sayılı)', k: 'Tarifler: Bebek Dolabı bandı' };
let kirmizi = 0;
for (const r of sonuc) { if (!r.ok) kirmizi++; console.log(`${r.ok ? '✓' : '✗'} ${r.harf} ${ad[r.harf].padEnd(30)} ${String(r.w).padStart(4)} ${r.sayfa}${r.ok ? '' : '\n    ' + r.ayrinti.join('\n    ')}`); }
console.log(`\nDolap kapısı: ${sonuc.length - kirmizi}/${sonuc.length} yeşil`);
process.exit(kirmizi ? 1 : 0);
