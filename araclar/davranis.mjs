// Davranış kapısı: kullanıcı yüzeyinden gerçek tıklamalarla (kısayol yok).
// Kullanım: node araclar/davranis.mjs   (önce: node araclar/sunucu.mjs)
import { chromium } from 'playwright';
const T = 'http://localhost:8765/DadaKids/';
const t = await chromium.launch();
const p = await (await t.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
let hata = 0;
const ok = (kosul, ad) => { console.log(`${kosul ? '✓' : '✗'} ${ad}`); if (!kosul) hata++; };
const cerez = async () => { try { await p.click('#cookieReject', { timeout: 1200 }); } catch {} };

// 1 · Hub profil adımı
await p.goto(T + 'kids.html', { waitUntil: 'networkidle' }); await cerez();
await p.click('.kd-profil button[type=submit]');
ok(await p.isVisible('[data-kd-uyari]'), 'evre seçilmeden Uygula → uyarı görünür');
await p.click('label:has(input[value="hamilelik"])');
ok(await p.isVisible('[data-kd-bilinmiyor]'), 'hamilelikte "Henüz bilmiyoruz" görünür');
await p.click('label:has(input[value="9-12-ay"])');
ok(!(await p.isVisible('[data-kd-bilinmiyor]')), '9–12 ayda "Henüz bilmiyoruz" gizli');
await p.click('label:has(input[name=c][value="kiz"])');
await p.click('.kd-profil button[type=submit]');
ok(await p.getAttribute('html', 'data-kd-tema') === 'kiz', 'Kız → html[data-kd-tema=kiz]');
ok((await p.textContent('[data-kd-ozet-evre]')).includes('9–12'), 'özet satırı evreyi yazar');
ok(new URL(p.url()).searchParams.get('evre') === '9-12-ay' && new URL(p.url()).searchParams.get('c') === 'kiz', 'adres ?evre=9-12-ay&c=kiz');
const bag = await p.getAttribute('a.topic-card[href^="kids__tarifler"]', 'href');
ok(bag.includes('evre=9-12-ay') && bag.includes('c=kiz'), 'Kids bağları profili taşır: ' + bag);
const onizleme = await p.$$eval('#kdOnizleme .kd-kart:not([hidden])', (k) => k.map((x) => +x.dataset.yas));
ok(onizleme.length === 4 && onizleme.every((y) => y <= 9), 'hub önizleme: 4 kart, hepsi ≤ +9 → ' + onizleme);
ok(await p.getAttribute('.kd-evre[data-evre="9-12-ay"]', 'aria-current') === 'true', 'evre kartı "Sizin evreniz"');

// 2 · Tema rozet ve uyarı renklerini DEĞİŞTİRMEZ
const renk = async () => p.evaluate(() => ({ r8: getComputedStyle(document.querySelector('.kd-yas--8')).backgroundColor, ornek: getComputedStyle(document.querySelector('.kd-ornek')).backgroundColor, tema: getComputedStyle(document.documentElement).getPropertyValue('--kd-tema').trim() }));
const kiz = await renk();
await p.goto(T + 'kids.html?evre=9-12-ay&c=erkek', { waitUntil: 'networkidle' }); const erkek = await renk();
await p.goto(T + 'kids.html?evre=9-12-ay', { waitUntil: 'networkidle' }); const notr = await renk();
ok(kiz.r8 === erkek.r8 && erkek.r8 === notr.r8, '+8 Ay rozeti 3 temada aynı: ' + notr.r8);
ok(kiz.ornek === erkek.ornek && erkek.ornek === notr.ornek, 'örnek içerik şeridi 3 temada aynı');
ok(new Set([kiz.tema, erkek.tema, notr.tema]).size === 3, '--kd-tema 3 farklı değer: ' + [kiz.tema, erkek.tema, notr.tema].join(' / '));

// 3 · Katalog
await p.goto(T + 'kids__tarifler.html?evre=6-8-ay&c=kiz', { waitUntil: 'networkidle' }); await cerez();
let gorunen = await p.$$eval('#lstGrid .kd-kart:not([hidden])', (k) => k.map((x) => +x.dataset.yas));
ok(await p.getAttribute('.kd-yas-chip[data-yas="6"]', 'aria-checked') === 'true' && gorunen.every((y) => y <= 6), 'profilden varsayılan yaş +6 (evre 6–8, temkinli alt kova)');
await p.click('.kd-yas-chip[data-yas="9"]');
gorunen = await p.$$eval('#lstGrid .kd-kart:not([hidden])', (k) => k.map((x) => +x.dataset.yas));
ok(gorunen.length === 12 && gorunen.every((y) => y <= 9), 'birikimli: +9 → 12 tarif (6+8+9)');
ok(new URL(p.url()).searchParams.get('yas') === '9', 'adres ?yas=9');
await p.click('.kd-yas-chip[data-yas="6"]');
await p.click('label.fct-row:has(input[value="parmak"])');
ok(await p.isVisible('#kdBos'), '+6 & Parmak Gıda → boş durum');
const oneriler = await p.$$eval('.kd-bos__oneriler button', (b) => b.map((x) => x.textContent));
ok(oneriler.some((x) => x.includes('+9 Ay')), 'boş durum tek dokunuş önerisi: ' + oneriler.join(' | '));
await p.click('.kd-bos__oneriler button:has-text("+9 Ay")');
gorunen = await p.$$eval('#lstGrid .kd-kart:not([hidden])', (k) => k.length);
ok(gorunen === 1, 'öneriye dokununca +9 parmak gıda: ' + gorunen);
await p.click('a.fil-clear[data-kd-temizle]:visible');
await p.click('label.fct-row:has(input[value="glutensiz"])'); await p.click('label.fct-row:has(input[value="yumurtasiz"])');
const g = await p.$$eval('#lstGrid .kd-kart:not([hidden])', (k) => k.every((x) => x.dataset.glutensiz === '1' && x.dataset.yumurtasiz === '1'));
ok(g, 'İçermeyenler VE filtresi (Glutensiz + Yumurtasız)');
await p.$eval('#lstGrid .kd-kart:not([hidden]) .kd-kiler-btn', (b) => { b.scrollIntoView({ block: 'center' }); });
await p.waitForTimeout(300);
await p.click('#lstGrid .kd-kart:not([hidden]) .kd-kiler-btn >> nth=0');
ok((await p.textContent('#lstGrid .kd-kart:not([hidden]) .kd-kiler-sonuc >> nth=0')).includes('Kilerinde'), 'kart PantrySync sonucu');

// 4 · Detay
await p.goto(T + 'kids__tarif__balkabagi-puresi.html', { waitUntil: 'networkidle' }); await cerez();
ok((await p.textContent('.rd-stage .kd-yas')).toLowerCase().includes('+6 ay'), 'detay: büyük yaş rozeti');
await p.click('.kd-kiler-satir .kd-kiler-btn');
ok(await p.$$eval('#ingList .kd-durum', (e) => e.length) === 2, 'detay: malzeme satırları var/eksik işaretli');

await t.close();
console.log(hata ? `\n${hata} kontrol başarısız` : '\nTüm davranış kontrolleri geçti');
process.exit(hata ? 1 : 0);
