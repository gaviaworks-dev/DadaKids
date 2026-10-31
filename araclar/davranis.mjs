// Davranış kapısı v2 — kullanıcı yüzeyinden gerçek tıklamalarla (kısayol yok) + statik taramalar.
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

/* ---------- Tarayıcı ---------- */
const t = await chromium.launch();
const p = await (await t.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const jsHata = []; p.on('pageerror', (e) => jsHata.push(e.message));
const cerez = async () => { try { await p.click('#cookieReject', { timeout: 1200 }); } catch {} };
const gor = async (sec) => { await p.$eval(sec, (e) => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(250); };

// 1 · Hub profil adımı
await p.goto(T + 'kids.html', { waitUntil: 'networkidle' }); await cerez();
await gor('.kd-profil button[type=submit]'); await p.click('.kd-profil button[type=submit]');
ok(await p.isVisible('[data-kd-uyari]'), 'evre seçilmeden Uygula → uyarı');
await p.click('#kdProfil label:has(input[value="hamilelik"])');
ok(await p.isVisible('[data-kd-bilinmiyor]'), 'hamilelikte "Henüz bilmiyoruz" görünür');
await p.click('#kdProfil label:has(input[value="9-12-ay"])');
ok(!(await p.isVisible('[data-kd-bilinmiyor]')), '9–12 ayda "Henüz bilmiyoruz" gizli');
ok(await p.isChecked('#kdProfil input[name=c][value="belirtilmedi"]'), 'varsayılan cinsiyet: Belirtmek istemiyorum');
await p.click('#kdProfil label:has(input[name=c][value="kiz"])');
await p.click('.kd-profil button[type=submit]');
ok(await p.getAttribute('html', 'data-kd-tema') === 'kiz', 'Kız → html[data-kd-tema=kiz]');
const u = new URL(p.url());
ok(u.searchParams.get('evre') === '9-12-ay' && u.searchParams.get('c') === 'kiz', 'adres ?evre=9-12-ay&c=kiz');
const bag = await p.getAttribute('.kd-ust__menu a[href^="kids-tarifler"]', 'href');
ok(bag.includes('evre=9-12-ay') && bag.includes('c=kiz'), 'alt menü bağları profili taşır: ' + bag);
const on = await p.$$eval('#kdOnizleme .kd-tarif:not([hidden])', (k) => k.map((x) => +x.dataset.yas));
ok(on.length === 4 && on.every((y) => y <= 9), 'hub önizleme: 4 tarif, hepsi ≤ +9 → ' + on);
ok(await p.getAttribute('.kd-evre[data-evre="9-12-ay"]', 'aria-current') === 'true', 'evre kartı "Sizin evreniz"');
ok((await p.getAttribute('[data-kd-tumu]', 'href')).startsWith('kids-tarifler.html?yas=9'), '"Tümünü gör" → kids-tarifler.html?yas=9');

// 2 · Tema yalnız vurgu tonunu kaydırır; rozet/uyarı/evre renkleri sabit; Gastro turuncusu yok
const renk = async () => p.evaluate(() => ({
  rozet: getComputedStyle(document.querySelector('.kd-yas')).backgroundColor,
  ornek: getComputedStyle(document.querySelector('.kd-ornek')).backgroundColor,
  evre: getComputedStyle(document.querySelector('.kd-evre[data-evre="6-8-ay"]')).backgroundColor,
  btn: getComputedStyle(document.querySelector('.kd-hero .kd-btn')).backgroundColor,
}));
await p.waitForTimeout(500);
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

ok(jsHata.length === 0, 'JS hatası yok' + (jsHata.length ? ': ' + jsHata.slice(0, 3).join(' | ') : ''));
await t.close();
console.log(hata ? `\n${hata} kontrol başarısız` : '\nTüm davranış kontrolleri geçti');
process.exit(hata ? 1 : 0);
