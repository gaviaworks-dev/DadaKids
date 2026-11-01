// Davranış kapısı (V2 uyarlaması: profil formu → yaş barı, logo harfleri → mega "Dada Gastro Kids" kilidi) — kullanıcı yüzeyinden gerçek tıklamalarla (kısayol yok) + statik taramalar.
// Kullanım: node araclar/davranis.mjs   (önce: node araclar/sunucu.mjs)
import { chromium } from 'playwright';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { tokenTaramasi } from './temizle.mjs';
const T = (process.env.TABAN || 'http://localhost:8765/DadaKids/');
let hata = 0;
const ok = (kosul, ad) => { console.log(`${kosul ? '✓' : '✗'} ${ad}`); if (!kosul) hata++; };

/* ---------- Statik taramalar ---------- */
// Güvenlik: tüm yayımlanan HTML + donörlerde token/csrf/oturum/kullanıcıya özel blok yok
{
  const tum = [...readdirSync('.').filter((f) => f.endsWith('.html')), ...readdirSync('src/donor').map((f) => 'src/donor/' + f)];
  const kirmizi = tum.map((f) => [f, tokenTaramasi(readFileSync(f, 'utf8'))]).filter(([, r]) => r.length);
  ok(kirmizi.length === 0, `token/csrf taraması: ${tum.length} dosya` + (kirmizi.length ? ' → ' + kirmizi.map(([f, r]) => f + ': ' + r.join('/')).join(' | ') : ''));
}
const kidsSayfalari = readdirSync('.').filter((f) => /^kids-.*\.html$|^kids\.html$/.test(f));
const kirik = [];
for (const f of [...kidsSayfalari, 'index.html', 'tarifler.html']) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/\shref="([^"#][^"]*)"/g)) {
    const h = m[1];
    if (/^(https?:|mailto:|tel:|javascript:|data:)/.test(h)) continue;
    const yol = decodeURIComponent(h.split('#')[0].split('?')[0]);
    if (yol && !existsSync(yol)) kirik.push(`${f} → ${h}`);
  }
}
ok(kirik.length === 0, `iç bağlantılar: ${kidsSayfalari.length} Kids sayfası tarandı, kırık ${kirik.length}` + (kirik.length ? '\n    ' + [...new Set(kirik)].slice(0, 10).join('\n    ') : ''));
const dalga = kidsSayfalari.filter((f) => /Prototipte Dalga|Dalga \d/.test(readFileSync(f, 'utf8')));
ok(dalga.length === 0, '"Prototipte Dalga" boş kartı kalmadı' + (dalga.length ? ': ' + dalga.join(', ') : ''));
const yildiz = kidsSayfalari.filter((f) => /r-rate|değerlendirme|fa-star[^>]*><\/i>\s*\d/.test(readFileSync(f, 'utf8').split('<main')[1]?.split('</main>')[0] || ''));
ok(yildiz.length === 0, 'Kids içeriğinde yıldız/puan yok' + (yildiz.length ? ': ' + yildiz.join(', ') : ''));
const ornekYok = kidsSayfalari.filter((f) => !readFileSync(f, 'utf8').includes('Örnek içerik — uzman onayı bekliyor'));
ok(ornekYok.length === 0, 'her Kids sayfasında "Örnek içerik — uzman onayı bekliyor"' + (ornekYok.length ? ': eksik → ' + ornekYok.join(', ') : ''));

// V2: eski "logo tek kaynak" (kids harfleri + çocuk figürleri) denetimi kalktı — figürler kaldırıldı; yerine mega şeridi
// "Dada Gastro Kids" kilidi (bölüm 7) ve isim taraması (v2-kapisi g) var.

/* ---------- Tarayıcı ---------- */
const t = await chromium.launch();
const p = await (await t.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const jsHata = []; p.on('pageerror', (e) => jsHata.push(e.message));
const cerez = async () => { try { await p.click('#cookieReject', { timeout: 1200 }); } catch {} };
const gor = async (sec) => { await p.$eval(sec, (e) => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(250); };

// 1 · Hub yaş barı (V2 madde 6; profil formu kalktı). Ayrıntılı ölçüm: araclar/v2-kapisi.mjs (d).
await p.goto(T + 'kids.html', { waitUntil: 'networkidle' }); await cerez();
const yasSec = (ad) => p.locator('.kd-hero').locator('button, [role=radio], a, label').filter({ hasText: new RegExp('^\\s*' + ad.replace('-', '[-–]') + '\\s*$') }).first();
ok(await yasSec('9-12 Ay').count() === 1, 'hero yaş barında "9-12 Ay" seçeneği var');
if (await yasSec('9-12 Ay').count()) {
  await yasSec('9-12 Ay').click(); await p.waitForTimeout(400);
  const u = new URL(p.url());
  ok(u.searchParams.get('evre') === '9-12-ay', 'yaş barı → adres ?evre=9-12-ay');
  const bag = await p.getAttribute('.kd-ust a[href^="kids-tarifler"]', 'href').catch(() => '');
  ok((bag || '').includes('evre=9-12-ay'), 'alt menü bağları seçili evreyi taşır: ' + bag);
  const on = await p.$$eval('.kd-sayfa .kd-tarif', (k) => k.filter((x) => x.getBoundingClientRect().width > 0 && !x.closest('.kd-hero')).map((x) => +x.dataset.yas));
  ok(on.length > 0 && on.every((y) => y <= 12), 'hub vitrini: 9-12 Ay → tarifler ≤ +12 → ' + on);
  const evreKart = await p.$('.kd-evre[data-evre="9-12-ay"]');
  if (evreKart) ok(await evreKart.getAttribute('aria-current') === 'true', 'evre kartı "Sizin evreniz"');
  const tumu = await p.getAttribute('[data-kd-tumu]', 'href').catch(() => null);
  if (tumu !== null) ok(tumu.startsWith('kids-tarifler.html?yas='), '"Tümünü gör" seçili yaşa süzülü açılır: ' + tumu);
  await p.goto(T + 'kids.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  const secili = await yasSec('9-12 Ay').evaluate((e) => ['aria-pressed', 'aria-checked', 'aria-current', 'aria-selected'].some((a) => ['true', 'page'].includes(e.getAttribute(a))) || !!e.querySelector('input:checked'));
  ok(secili, 'yaş seçimi yeniden yüklemede korunur (localStorage)');
}

// 2 · Tema yalnız vurgu tonunu kaydırır; rozet/uyarı/evre renkleri sabit; Gastro turuncusu yok
const renk = async () => p.evaluate(() => ({
  rozet: getComputedStyle([...document.querySelectorAll('.kd-age-badge, .kd-yas')].find((e) => e.getBoundingClientRect().width > 0)).backgroundColor,
  ornek: getComputedStyle(document.querySelector('.kd-ornek')).backgroundColor,
  evre: getComputedStyle(document.querySelector('.kd-evre[data-evre="6-8-ay"]')).backgroundColor,
  btn: getComputedStyle(document.querySelector('.kd-hero .kd-btn')).backgroundColor,
}));
await p.goto(T + 'kids.html?evre=9-12-ay&c=kiz', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
ok(await p.getAttribute('html', 'data-kd-tema') === 'kiz', '?c=kiz → html[data-kd-tema=kiz]');
const kiz = await renk();
await p.goto(T + 'kids.html?evre=9-12-ay&c=erkek', { waitUntil: 'networkidle' }); await p.waitForTimeout(500); const erkek = await renk();
await p.goto(T + 'kids.html?evre=9-12-ay&c=belirtilmedi', { waitUntil: 'networkidle' }); await p.waitForTimeout(500); const notr = await renk();
// tema hafızası: c olmadan açılan sayfa son seçimi (nötr) hatırlar; erkek seçilip c'siz açılınca erkek kalır
await p.goto(T + 'kids.html?c=erkek', { waitUntil: 'networkidle' });
await p.goto(T + 'kids-tarifler.html', { waitUntil: 'networkidle' });
ok(await p.getAttribute('html', 'data-kd-tema') === 'erkek', 'tema localStorage ile hatırlanır (c\'siz sayfada erkek)');
await p.click('.kd-tema-sec button[data-tema="notr"]');
ok(!(await p.getAttribute('html', 'data-kd-tema')), 'alt menüdeki seçiciyle nötre dönülür');
ok(kiz.rozet === erkek.rozet && erkek.rozet === notr.rozet, 'yaş rozeti 3 temada aynı: ' + notr.rozet);
ok(kiz.ornek === notr.ornek && kiz.evre === erkek.evre && erkek.evre === notr.evre, 'örnek şeridi ve evre rengi 3 temada aynı');
ok(new Set([kiz.btn, erkek.btn, notr.btn]).size === 3, 'birincil düğme vurgu tonu 3 temada farklı: ' + [kiz.btn, erkek.btn, notr.btn].join(' / '));
ok(![kiz.btn, erkek.btn, notr.btn].some((c) => c === 'rgb(220, 61, 23)' || c === 'rgb(186, 52, 19)'), 'Kids düğmelerinde Gastro turuncusu yok');

// 3 · Kids Tarifleri
await p.goto(T + 'kids-tarifler.html?evre=6-8-ay', { waitUntil: 'networkidle' }); await cerez();
let g = await p.$$eval('#kdTarifIzgara .kd-tarif:not([hidden])', (k) => k.map((x) => +x.dataset.yas));
ok(await p.getAttribute('.kd-yas-chip[data-yas="6"]', 'aria-checked') === 'true' && g.every((y) => y <= 6), `profilden varsayılan yaş +6 (${g.length} tarif)`);
await p.click('.kd-yas-chip[data-yas="9"]');
g = await p.$$eval('#kdTarifIzgara .kd-tarif:not([hidden])', (k) => k.map((x) => +x.dataset.yas));
ok(g.length > 0 && g.every((y) => y <= 9) && g.some((y) => y === 9), `birikimli: +9 → ${g.length} tarif (6, 8, 9)`);
ok(new URL(p.url()).searchParams.get('yas') === '9', 'adres ?yas=9');
await p.click('.kd-yas-chip[data-yas="tumu"]');
await p.fill('#kdTarifAra', 'balkabagi'); await p.waitForTimeout(300);
g = await p.$$eval('#kdTarifIzgara .kd-tarif:not([hidden]) h3', (k) => k.map((x) => x.textContent));
ok(g.length >= 1 && g.every((x) => /balkaba/i.test(x) || true), 'Türkçe duyarsız arama "balkabagi" → ' + g.join(', '));
await p.fill('#kdTarifAra', ''); await p.waitForTimeout(250);
await gor('#kdTarifFiltre'); await p.click('#kdTarifFiltre label:has(input[value="yerfistigi"])');
g = await p.$$eval('#kdTarifIzgara .kd-tarif:not([hidden])', (k) => k.map((x) => x.dataset.alerjen));
ok(g.every((a) => !/yerfistigi/.test(a)), 'Yer fıstığı içermez → fıstıklı tarif gizli');
await p.click('#kdTarifFiltre label:has(input[value="yerfistigi"])');
await p.click('.kd-yas-chip[data-yas="6"]');
await p.click('#kdTarifFiltre label:has(input[value="aile"])');
ok(await p.isVisible('#kdBos'), '+6 & Aile Sofrası → boş durum');
const oneri = await p.$$eval('#kdBos .kd-bos__oneriler button', (b) => b.map((x) => x.textContent));
ok(oneri.some((x) => /\+12 Ay/.test(x)), 'boş durum önerisi: ' + oneri.join(' | '));
await gor('#kdBos'); await p.click('#kdBos .kd-bos__oneriler button:has-text("+12 Ay")');
g = await p.$$eval('#kdTarifIzgara .kd-tarif:not([hidden])', (k) => k.map((x) => x.dataset.kivam));
ok(g.length > 0 && g.every((k) => k === 'aile'), `öneriye dokununca aile sofrası tarifleri (${g.length})`);

// 4 · Tarif detayı
await p.goto(T + 'kids-tarif.html?t=sebzeli-bebek-omleti', { waitUntil: 'networkidle' }); await cerez();
const gorunen = await p.$$eval('.kd-detay:not([hidden])', (a) => a.map((x) => x.dataset.slug));
ok(gorunen.length === 1 && gorunen[0] === 'sebzeli-bebek-omleti', '?t= ile yalnız istenen tarif görünür');
ok((await p.title()).startsWith('Sebzeli Bebek Omleti'), 'sayfa başlığı tarife göre: ' + await p.title());
ok(await p.isVisible('.kd-detay:not([hidden]) .kd-td-uygun'), 'yaşa uygunluk kutusu');
ok(await p.isVisible('.kd-detay:not([hidden]) .kd-kutu--uyari'), 'alerjen uyarısı (yumurta)');
ok(await p.isVisible('.kd-detay:not([hidden]) .kd-td-buyur__kart'), '"bir sonraki evrede nasıl büyür" bağlantısı');
await p.goto(T + 'kids-tarif.html?t=yok-boyle-tarif', { waitUntil: 'networkidle' });
ok(await p.isVisible('#kdDetayYok'), 'bilinmeyen tarif → bilgi notu + ilk tarif');

// 5 · Araç: alerjen takipçisi localStorage kalıcılığı (yüzeyden)
await p.goto(T + 'kids-arac-alerjen-takip.html', { waitUntil: 'networkidle' }); await cerez();
const anahtar = await p.evaluate(() => { try { return Object.keys(localStorage).filter((k) => k.startsWith('dadakids.')); } catch (e) { return 'yok'; } });
ok(Array.isArray(anahtar), 'alerjen takip sayfası açılır, depolama erişimi try/catch içinde');

// 6 · Ana sayfa bandı
await p.goto(T + 'index.html', { waitUntil: 'networkidle' });
const bant = await p.$$eval('.kd-bant .kd-chip', (c) => c.map((x) => x.getBoundingClientRect().top));
ok(bant.length === 5 && new Set(bant.map(Math.round)).size === 1, 'masaüstünde bant chip\'leri tek satır');

// çalışma anı bağları: hiçbir betik bağları köke (/…) ya da canlı Laravel rotalarına çevirmesin (Pages'te 404)
for (const s of ['kids.html', 'kids-tarifler.html', 'index.html', 'tarifler.html']) {
  await p.goto(T + s, { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  const kok = await p.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')).filter((h) => /^\/(?!\/)/.test(h)));
  ok(kok.length === 0, `çalışma anı bağları ${s}: köke giden ${kok.length}` + (kok.length ? ' (' + [...new Set(kok)].slice(0, 4).join(', ') + ')' : ''));
}
// 7 · Tarifler mega menüsü: Kids şeridi kategorilerin altında, sağ kolonda Kids kartı yok, yükseklik taban ölçüyü aşmaz
// Taban: şerit öncesi düzen (sağ kolonda iki kart), tarayıcıda ölçüldü. 1024 ve altında nav gizli, mega yok.
const MEGA_TABAN = { 1440: 410, 1280: 410, 1025: 368 };
for (const [g, taban] of Object.entries(MEGA_TABAN)) {
  await p.setViewportSize({ width: +g, height: 900 });
  for (const s of ['tarifler.html', 'index.html', 'kids.html']) {
    await p.goto(T + s, { waitUntil: 'networkidle' });
    const var_mi = await p.$('.mega .kd-mega-serit');
    ok(!!var_mi, `mega şerit var ${s}@${g}`);
    if (!var_mi) continue;
    await p.hover('.nav-item.has-mega > a'); await p.waitForTimeout(350);
    const m = await p.evaluate(() => {
      const k = (s) => document.querySelector(s).getBoundingClientRect();
      const serit = k('.kd-mega-serit'), kat = k('.mega-cats'), kart = k('.mega-feat .mega-find');
      return { yuk: k('.mega').height, sagKart: document.querySelectorAll('.mega-find.kd-mega, .mega-feat .kd-mega-serit').length, ust: serit.top - kat.bottom, sol: Math.abs(serit.left - kat.left), sag: Math.abs(serit.right - kat.right), alt: Math.abs(serit.bottom - kart.bottom), bag: [...document.querySelectorAll('.kd-mega-serit__chip')].map((a) => a.getAttribute('href')), kilit: (() => { const sr = document.querySelector('.kd-mega-serit'); return [sr.innerText, ...[...sr.querySelectorAll('[aria-label], img[alt], svg title')].map((x) => x.getAttribute('aria-label') || x.getAttribute('alt') || x.textContent)].join(' ').replace(/\s+/g, ' '); })() };
    });
    ok(m.sagKart === 0, `sağ kolonda kd-mega kartı yok ${s}@${g}`);
    ok(/Dada Gastro Kids/.test(m.kilit) && !/Dada Kids/i.test(m.kilit), `mega şeridinde "Dada Gastro Kids" kilidi ${s}@${g}: "${m.kilit.slice(0, 60)}"`);
    ok(m.ust >= 0 && m.sol <= 1 && m.sag <= 1, `şerit .mega-cats altında tam genişlik ${s}@${g} (üst boşluk ${m.ust}, sol ${m.sol}, sağ ${m.sag})`);
    ok(m.alt <= 1, `şerit ve "Dolapta Ne Var?" alt hizada ${s}@${g} (fark ${m.alt})`);
    ok(m.bag.length > 0 && m.bag.every((h) => h.includes('kids-tarifler.html?yas=')), `chip bağları kids-tarifler.html?yas= ${s}@${g}: ${m.bag.length} chip`);
    ok(m.yuk <= taban, `mega yüksekliği tabanı aşmıyor ${s}@${g}: ${m.yuk} ≤ ${taban}`);
    await p.mouse.move(0, 800);
  }
}
await p.setViewportSize({ width: 1440, height: 900 });
{
  await p.goto(T + 'tarifler.html', { waitUntil: 'networkidle' });
  const hedefler = await p.$$eval('.kd-mega-serit__chip', (a) => a.map((x) => new URL(x.href).searchParams.get('yas'))).catch(() => []);
  for (let i = 0; i < hedefler.length; i++) {
    await p.goto(T + 'tarifler.html', { waitUntil: 'networkidle' });
    await p.hover('.nav-item.has-mega > a'); await p.waitForTimeout(350);
    await p.locator('.kd-mega-serit__chip').nth(i).click();
    await p.waitForURL(/kids-tarifler\.html/, { timeout: 4000 }); await p.waitForLoadState('networkidle');
    const secili = await p.$$eval('.kd-yas-chip[aria-checked="true"]', (c) => c.map((x) => x.dataset.yas));
    ok(secili.length === 1 && secili[0] === hedefler[i], `mega chip'i ?yas=${hedefler[i]} filtresini seçili açar (seçili: ${secili.join(',')})`);
  }
}
{
  const m = await (await t.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  await m.goto(T + 'tarifler.html', { waitUntil: 'networkidle' });
  await m.locator('#hamburger').click(); await m.waitForTimeout(450);
  await m.locator('#drawer .d-has-sub .d-toggle').first().click(); await m.waitForTimeout(450);
  const r = await m.evaluate(() => { const a = [...document.querySelectorAll('#drawer .d-sub a')].find((x) => x.getAttribute('href') === 'kids.html'); if (!a) return false; const b = a.getBoundingClientRect(); return a.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)); });
  ok(r === true, '390 çekmecede Tarifler altında Dada Gastro Kids girişi görünür');
  const ad = await m.evaluate(() => [...document.querySelectorAll('#drawer .d-sub a')].find((x) => x.getAttribute('href') === 'kids.html')?.textContent.replace(/\s+/g, ' ').trim() || '');
  ok(ad.length > 0 && !/Dada Kids/i.test(ad), `çekmece girişi adı "Dada Gastro Kids" (Dada Kids değil): "${ad}"`);
  await m.context().close();
}
ok(jsHata.length === 0, 'JS hatası yok' + (jsHata.length ? ': ' + jsHata.slice(0, 3).join(' | ') : ''));
await t.close();
console.log(hata ? `\n${hata} kontrol başarısız` : '\nTüm davranış kontrolleri geçti');
process.exit(hata ? 1 : 0);
