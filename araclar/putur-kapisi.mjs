// Pütür kapısı: maskot asistanı tüm Kids sayfalarında görünür mü, hiçbir şeyi örtüyor mu, akışları doğru mu?
// Ölçülenler (1440 · 1024 · 768 · 390 · 320): görünürlük · yukarı-çık / alt menü / footer telif / çerez bandı çakışması ·
// tıklanabilir öğe erişimi · menü aç/kapa ve yay sınırları · 6 seçeneğin hedefi · sürpriz (bir kez, menü açılmadan, geri gelir) ·
// tepki ve sürpriz sırasında kare kare etkileşimli öğe örtme (SVG, parçalar, video alfası; gerçek sayfa ve yapay düğme) ·
// reduced-motion · klavye · gizle/göster · tema-evre rengi · video · filtre paneli ve tarih seçici · sayfa içi JS hatası.
// Kullanım: node araclar/putur-kapisi.mjs [sayfa...]
//   TABAN=http://localhost:9000/   doğrulanacak yayın (başka port / canlı)
//   AGAC=/yol/izole-agac           sayfa listesi ve dosya boyutları için ağaç (varsayılan: bu betiğin üst dizini)
//   GENISLIK=390,320 · HIZLI=1 yalnız akışlar
// Sayfa listesi ağaçtaki kids*.html'den okunur; çalışma dizininden bağımsızdır.
import { chromium } from 'playwright';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TABAN = (process.env.TABAN || 'http://localhost:8765/DadaKids/').replace(/\/?$/, '/');
const KOKEN = new URL(TABAN).origin;
const AGAC = process.env.AGAC || fileURLToPath(new URL('..', import.meta.url));
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(AGAC).filter((f) => /^kids.*\.html$/.test(f) && !f.startsWith('kids__'));
const GENISLIK = (process.env.GENISLIK || '1440,1024,768,390,320').split(',').map(Number);
const BOY = { 1440: 900, 1024: 800, 768: 1024, 390: 844, 320: 640 };
const YALNIZ_EK = !!process.env.YALNIZ_EK;   // yalnız boyut/konum/hover/tetikleyici bölümü
const HIZLI = !!process.env.HIZLI;

let gecen = 0, kalan = 0; const hatalar = [];
const yaz = (s) => process.stdout.write(s + '\n');
function kontrol(ad, sonuc, ayrinti = '') {
  if (sonuc) gecen++; else { kalan++; hatalar.push(ad + (ayrinti ? ' → ' + ayrinti : '')); yaz('  KALDI ' + ad + (ayrinti ? ' → ' + ayrinti : '')); }
}

const tarayici = await chromium.launch();
async function acSayfa(bag, yol, jsHata) {
  const sayfa = await bag.newPage();
  const cdp = await bag.newCDPSession(sayfa);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  sayfa.on('pageerror', (e) => jsHata.push(yol + ': ' + e.message));
  sayfa.on('response', (r) => { if (r.url().startsWith(KOKEN) && r.status() >= 400 && !/favicon/.test(r.url())) jsHata.push(yol + ': ' + r.status() + ' ' + r.url().replace(TABAN, '')); });
  await sayfa.goto(TABAN + yol, { waitUntil: 'networkidle' });
  return sayfa;
}
const merkez = (sayfa, sec) => sayfa.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sec);
const tikla = async (sayfa, sec) => { const [x, y] = await merkez(sayfa, sec); await sayfa.mouse.click(x, y); };
const kaydir = async (sayfa, y) => { await sayfa.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y); await sayfa.waitForTimeout(420); };
const durum = (sayfa) => sayfa.evaluate(() => document.querySelector('.kd-pt').getAttribute('data-durum'));
const menuAcik = (sayfa) => sayfa.evaluate(() => !document.querySelector('#kdPtMenu').hidden);
const bekleMenu = (sayfa, sn = 4000) => sayfa.waitForFunction(() => document.querySelector('#kdPtMenu.kd-acik'), null, { timeout: sn }).then(() => true, () => false);
async function sec(sayfa, kod) {
  await tikla(sayfa, '.kd-pt__btn'); await bekleMenu(sayfa); await sayfa.waitForTimeout(620);
  await tikla(sayfa, `.kd-pt__oge[data-secenek="${kod}"]`);
  await sayfa.waitForFunction(() => document.querySelector('.kd-pt__baslik'), null, { timeout: 4000 }).catch(() => {});
  await sayfa.waitForTimeout(140);
}

/* ---------- Yerleşim ölçümü (sayfa içinde) ---------- */
const OLCUM = () => {
  const kok = document.querySelector('.kd-pt'), btn = document.querySelector('.kd-pt__btn');
  const b = btn.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const kes = (a, c) => Math.min(a.right, c.right) - Math.max(a.left, c.left) > 1 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 1;
  const gorunur = (e) => { if (!e) return false; const c = getComputedStyle(e), r = e.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > .05 && r.width > 0 && r.top < H && r.bottom > 0; };
  const metinKutulari = (e) => { const z = document.createRange(); z.selectNodeContents(e); return [...z.getClientRects()].filter((r) => r.width > 1); };
  const out = { yatay: document.documentElement.scrollWidth - W, gorunurGen: Math.min(b.right, W) - Math.max(b.left, 0), ust: b.top, alt: b.bottom, cakisma: [], ortu: [] };
  if (getComputedStyle(kok).display === 'none') { out.yok = true; return out; }
  const engel = { 'yukarı çık': '#toTop', 'alt menü': '.bottom-nav', 'çerez bandı': '#cookieBanner' };
  for (const [ad, s] of Object.entries(engel)) { const e = document.querySelector(s); if (gorunur(e) && kes(b, e.getBoundingClientRect())) out.cakisma.push(ad); }
  document.querySelectorAll('.fb-left, .footer-bottom, .fb-right, .footer .legal a, .footer [class*="legal"] a').forEach((e) => {
    if (!gorunur(e)) return;
    const onde = [...metinKutulari(e)].some((r) => kes(b, r) && r.top < H && (() => { const y = document.elementFromPoint(Math.min(W - 1, r.left + r.width / 2), Math.min(H - 1, r.top + r.height / 2)); return y && (y === e || e.contains(y) || y.closest('.kd-pt')); })());
    if (onde) out.cakisma.push('footer telif: ' + (e.textContent || '').trim().slice(0, 28));
  });
  const tamBoy = !kok.classList.contains('kd-pt--kenar');
  document.querySelectorAll('a[href], button, input:not([type=hidden]), select, summary, [role=button], [role=radio], [role=tab]').forEach((e) => {
    if (e.closest('.kd-pt') || e.closest('.kd-pt-sekme')) return;
    const r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return;
    const x = r.left + r.width / 2, y = r.top + r.height / 2; if (x < 0 || y < 0 || x >= W || y >= H) return;
    if (!gorunur(e)) return;
    if (tamBoy && kes(b, r) && !e.closest('.bottom-nav')) out.ortu.push('kutu: ' + (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 34));
    const u = document.elementFromPoint(x, y);
    if (u && u.closest('.kd-pt')) out.ortu.push((e.tagName + '.' + (e.className || '') + ' ' + (e.getAttribute('aria-label') || e.textContent || '').trim()).slice(0, 46));
  });
  return out;
};

/* Kare kaydedici: tepki/sürpriz boyunca her animasyon karesinde etkileşimli öğelerin ortası örtülüyor mu?
   Ölçülen örtücüler: Pütür düğmesi (elementFromPoint), görünen karakter parçaları, uçan pastel parçalar, videoda gerçek alfa.
   Menü açılınca durur: menünün kendisi kullanıcının açtığı katmandır, ölçüm dışıdır. */
const IZ_BASLAT = () => {
  const W = innerWidth, H = innerHeight;
  const merkezler = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, summary, [role=button], [role=radio], [role=tab]')].map((e) => {
    if (e.closest('.kd-pt') || e.closest('.kd-pt-sekme') || e.closest('.kd-pt-yakala')) return null;
    const r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return null;
    const x = r.left + r.width / 2, y = r.top + r.height / 2; if (x < 0 || y < 0 || x >= W || y >= H) return null;
    const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity <= .05) return null;
    return { x, y, e, r, ad: (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 24) };
  }).filter(Boolean);
  const iz = { kare: 0, video: 0, ihlal: {}, calis: true, merkez: merkezler.length };
  const ihlal = (m, kaynak) => { const k = kaynak + ': ' + m.ad; iz.ihlal[k] = (iz.ihlal[k] || 0) + 1; };
  const tuval = document.createElement('canvas'); tuval.width = 240; tuval.height = 240;
  const cx = tuval.getContext('2d', { willReadFrequently: true });
  const icinde = (r, m, pay = 0) => m.x >= r.left - pay && m.x <= r.right + pay && m.y >= r.top - pay && m.y <= r.bottom + pay;
  function kare() {
    if (!iz.calis) return;
    if (!document.querySelector('#kdPtMenu').hidden) { iz.calis = false; return; }
    iz.kare++;
    const kok = document.querySelector('.kd-pt'), karakter = kok.querySelector('.kd-pt__karakter'), video = kok.querySelector('.kd-pt__video');
    const videoda = kok.classList.contains('kd-pt--video');
    const dugme = kok.querySelector('.kd-pt__btn').getBoundingClientRect();
    // tam boy ve yerine oturmuşken öğe kutusuna hiç binmez; kenardayken (yer yoksa) yalnız orta noktası korunur
    const oturdu = !kok.classList.contains('kd-pt--kenar') && Math.abs(dugme.left - kok.offsetLeft) < 1;
    merkezler.forEach((m) => {
      if (oturdu && m.r.left < dugme.right && m.r.right > dugme.left && m.r.top < dugme.bottom && m.r.bottom > dugme.top) ihlal(m, 'kutu');
      if (icinde(dugme, m)) ihlal(m, 'düğme');
      const u = document.elementFromPoint(m.x, m.y);
      if (u && u.closest('.kd-pt, .kd-pt-yakala') && !u.closest('.kd-pt__menu, .kd-pt__balon')) ihlal(m, 'elementFromPoint[' + (u.getAttribute('class') || u.tagName) + ']');
    });
    if (videoda && video) {
      iz.video++;
      const r = video.getBoundingClientRect(); cx.clearRect(0, 0, 240, 240); cx.drawImage(video, 0, 0, 240, 240);
      merkezler.forEach((m) => { if (!icinde(r, m)) return; const px = Math.floor((m.x - r.left) / r.width * 240), py = Math.floor((m.y - r.top) / r.height * 240); if (cx.getImageData(px, py, 1, 1).data[3] > 40) ihlal(m, 'video'); });
    } else if (+getComputedStyle(karakter).opacity > .05) {
      kok.querySelectorAll('.pt-egim > path, .pt-bukle path, .pt-ayak-sol, .pt-ayak-sag, .pt-kol ellipse').forEach((p) => { const r = p.getBoundingClientRect(); merkezler.forEach((m) => { if (icinde(r, m)) ihlal(m, 'karakter'); }); });
    }
    kok.querySelectorAll('.kd-pt__parca').forEach((p) => { if (+getComputedStyle(p).opacity <= .1) return; const r = p.getBoundingClientRect(); merkezler.forEach((m) => { if (icinde(r, m)) ihlal(m, 'parça'); }); });
    requestAnimationFrame(kare);
  }
  window.__ptIz = iz; requestAnimationFrame(kare);
};
const IZ_BITIR = () => { const iz = window.__ptIz; iz.calis = false; const k = document.querySelector('.kd-pt'); return { kare: iz.kare, video: iz.video, merkez: iz.merkez, ihlal: iz.ihlal, surpriz: k.getAttribute('data-surpriz'), menu: !document.querySelector('#kdPtMenu').hidden }; };
const ihlalYazi = (iz) => Object.entries(iz.ihlal).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} (${n} kare)`).join(' | ');

/* Yapay düğmeler: düzenden bağımsızlık için Pütür'ün üstüne, zıplama yoluna ve yanına konur */
const YAPAY = () => {
  const k = document.querySelector('.kd-pt'), l = k.offsetLeft, u = k.offsetTop, boy = k.offsetWidth;
  [[l + boy / 2, u + boy / 2], [l + boy / 2, u - boy * .3], [l + boy + 34, u + boy / 2]].forEach(([x, y], i) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = 'yapay ' + (i + 1); b.setAttribute('data-yapay', i);
    b.style.cssText = `position:fixed;z-index:30;margin:0;padding:0;left:${x - 22}px;top:${y - 14}px;width:44px;height:28px;font-size:10px`;
    document.body.appendChild(b);
  });
  dispatchEvent(new Event('resize'));
};

const jsHata = [];

/* ---------- 0 · Kurulum ve kimlik: Pütür yüklü mü, karakter hero maskotuyla aynı mı ---------- */
{
  const bag = await tarayici.newContext({ viewport: { width: 1440, height: 900 } });
  await bag.addInitScript(() => { window.__kdPuturVideo = null; });
  const eksik = [];
  for (const s of SAYFALAR) {
    const sayfa = await bag.newPage();
    await sayfa.goto(TABAN + s, { waitUntil: 'domcontentloaded' });
    const var_ = await sayfa.waitForSelector('.kd-pt__btn', { timeout: 6000, state: 'attached' }).then(() => true, () => false);
    if (!var_) eksik.push(s);
    await sayfa.close();
  }
  if (eksik.length) {
    yaz(`\nPütür yüklenmedi (${eksik.length}/${SAYFALAR.length} sayfa): ${eksik.slice(0, 5).join(', ')}`);
    yaz('Bu sayfaların HTML\'inde varlik/kids/css/putur.css ve varlik/kids/js/putur.js etiketleri var mı, dosyalar kopyalandı mı kontrol edin.');
    await tarayici.close();
    yaz(`\nPütür kapısı: 0/${SAYFALAR.length} geçti — KALDI (Pütür yüklü değil)`);
    process.exit(1);
  }
  kontrol(`kurulum: ${SAYFALAR.length} sayfanın hepsinde Pütür yüklü`, true);
  const s = await acSayfa(bag, SAYFALAR.includes('kids.html') ? 'kids.html' : SAYFALAR[0], jsHata);
  const k = await s.evaluate(async () => {
    const kaynak = await (await fetch('varlik/kids/maskot/merhaba.svg')).text();
    const dok = new DOMParser().parseFromString(kaynak, 'image/svg+xml');
    const canli = document.querySelector('.kd-pt__svg');
    const yollar = (d) => [...d.querySelectorAll('path')].map((e) => e.getAttribute('d'));
    const elipsler = (d) => [...d.querySelectorAll('ellipse')].map((e) => ['cx', 'cy', 'rx', 'ry'].map((a) => e.getAttribute(a)).join(' '));
    const cCanli = new Set(yollar(canli)), eCanli = new Set(elipsler(canli));
    const KOL = /^138 66 |^80 149 /;                                        // merhaba pozuna özgü kaldırılmış el ve zemin gölgesi
    const AGIZ_EL = /^M148 50/;                                             // el sallama çizgileri
    return {
      eksikYol: yollar(dok).filter((d) => !cCanli.has(d) && !AGIZ_EL.test(d)),
      eksikElips: elipsler(dok).filter((e) => !eCanli.has(e) && !KOL.test(e)),
      renk: ['#4A3A34', '#FFF8F0', '#FFC4A3', '#FFE9D6', '#3A2E2A', '#E96D8F'].filter((c) => !canli.outerHTML.includes(c)),
    };
  });
  kontrol('kimlik: gövde, kapak, kıvrım, kenar, yüz yolları merhaba.svg ile aynı', k.eksikYol.length === 0 && k.eksikElips.length === 0, JSON.stringify(k));
  kontrol('kimlik: maskot renk paleti aynı', k.renk.length === 0, k.renk.join(' '));
  await s.close(); await bag.close();
}

/* ---------- 1 · Tüm sayfalar × tüm genişlikler: görünürlük, çakışma, menü ---------- */
if (!HIZLI && !YALNIZ_EK) for (const w of GENISLIK) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: BOY[w] || 900 } });
  await bag.addInitScript(() => { try { sessionStorage.setItem('dadakids.putur.selam', '1'); } catch (e) {} window.__kdPuturVideo = null; });
  let n = 0;
  for (const s of SAYFALAR) {
    const sayfa = await acSayfa(bag, s, jsHata);
    await sayfa.waitForTimeout(260);
    const etk = `${w} ${s}`;
    const boy = await sayfa.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (const [ad, y] of [['üst', 0], ['orta', Math.round(boy / 2)], ['sonun yakını', Math.round(boy * .92)], ['son', boy]]) {
      await kaydir(sayfa, y);
      const r = await sayfa.evaluate(OLCUM);
      kontrol(`${etk} ${ad}: görünür`, !r.yok && r.gorunurGen >= 24 && r.ust >= 0 && r.alt <= (BOY[w] || 900), JSON.stringify([r.gorunurGen, r.ust, r.alt]));
      kontrol(`${etk} ${ad}: çakışma yok`, r.cakisma.length === 0, r.cakisma.join(' | '));
      kontrol(`${etk} ${ad}: tıklanabilir öğe örtülmüyor`, r.ortu.length === 0, r.ortu.slice(0, 3).join(' | '));
      kontrol(`${etk} ${ad}: yatay taşma yok`, r.yatay <= 0, String(r.yatay));
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
      const tt = document.querySelector('#toTop'), ttc = tt && getComputedStyle(tt), ttr = tt && tt.getBoundingClientRect();
      const ttVar = tt && ttc.visibility !== 'hidden' && +ttc.opacity > .05;
      const nav = document.querySelector('.bottom-nav'), navc = nav && getComputedStyle(nav), navr = nav && nav.getBoundingClientRect();
      return {
        n: og.length,
        ekranDisi: r.filter((x) => x.left < 2 || x.right > W - 2 || x.bottom > H || x.top < ustAlt - 1).length,
        kesik: og.filter((e) => { const ad = e.querySelector('.kd-pt__oge-ad'); return ad.scrollWidth > ad.clientWidth + 1; }).length,
        ust: r.filter((a, i) => r.some((c, j) => j > i && kes(a, c))).length,
        yukari: ttVar ? r.filter((x) => kes(x, ttr)).length : 0,
        altMenu: nav && navc.display !== 'none' ? r.filter((x) => kes(x, navr)).length : 0,
        odak: document.activeElement && document.activeElement.getAttribute('data-secenek'),
        erisim: r.filter((x) => { const y = document.elementFromPoint(x.left + 18, x.top + x.height / 2); return !(y && y.closest('.kd-pt__oge')); }).length,
      };
    });
    kontrol(`${etk} menü: 6 seçenek`, m.n === 6, String(m.n));
    kontrol(`${etk} menü: ekranda ve üst menünün altında`, m.ekranDisi === 0, String(m.ekranDisi));
    kontrol(`${etk} menü: etiket kesilmiyor, üst üste binmiyor`, m.kesik === 0 && m.ust === 0, JSON.stringify([m.kesik, m.ust]));
    kontrol(`${etk} menü: yukarı-çık ve alt menüyle çakışmıyor`, m.yukari === 0 && m.altMenu === 0, JSON.stringify([m.yukari, m.altMenu]));
    kontrol(`${etk} menü: tıklanabilir, odak ilk seçenekte`, m.erisim === 0 && m.odak === 'yas', JSON.stringify([m.erisim, m.odak]));
    await sayfa.keyboard.press('Escape'); await sayfa.waitForTimeout(380);
    const k = await sayfa.evaluate(() => ({ gizli: document.querySelector('#kdPtMenu').hidden, odak: document.activeElement === document.querySelector('.kd-pt__btn'), acik: document.querySelector('.kd-pt__btn').getAttribute('aria-expanded') }));
    kontrol(`${etk} menü: Esc kapatır, odak döner`, k.gizli && k.odak && k.acik === 'false', JSON.stringify(k));
    await sayfa.close();
    n++;
  }
  yaz(`· ${w}px: ${n} sayfa ölçüldü (${gecen} geçti, ${kalan} kaldı)`);
  await bag.close();
}

/* ---------- 2 · Akışlar: her seçenek doğru yere gider ---------- */
if (!YALNIZ_EK) for (const w of GENISLIK) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: BOY[w] || 900 } });
  await bag.addInitScript(() => { window.__kdPuturVideo = null; });
  const yil = new Date().getFullYear(), ayNo = new Date().getMonth() + 1;

  // Kaç aylık → evre → evre sayfası
  let s = await acSayfa(bag, 'kids-tarifler.html', jsHata);
  await sec(s, 'yas');
  const d8 = new Date(); d8.setDate(1); d8.setMonth(d8.getMonth() - 8);
  await tikla(s, `[data-yil="${d8.getFullYear()}"]`); await tikla(s, `[data-ay="${d8.getMonth() + 1}"]`);
  await s.waitForFunction(() => document.querySelector('[data-pt-evre]'), null, { timeout: 2500 }).catch(() => {});
  const ic = await s.evaluate(() => { const b = document.querySelector('.kd-pt__balon').getBoundingClientRect(), ic = document.querySelector('.kd-pt__balon-ic'); return { sol: b.left, sag: innerWidth - b.right, ust: b.top, alt: innerHeight - b.bottom, bar: ic.scrollHeight - ic.clientHeight, metin: ic.textContent }; });
  kontrol(`${w} yaş: evre sonucu`, /8 aylık/.test(ic.metin) && /6–8 Ay/.test(ic.metin), ic.metin.slice(0, 80));
  kontrol(`${w} balon: ekranda`, ic.sol >= 0 && ic.sag >= 0 && ic.alt >= 0, JSON.stringify(ic));
  // balon ikinci kez açılınca eski dinleyici kalmaz: "Bu yaşı kullan" hata vermeden profili yazar
  await s.evaluate(() => document.querySelector('[data-pt-geri]').click()); await bekleMenu(s); await s.waitForTimeout(620);
  await tikla(s, '.kd-pt__oge[data-secenek="yas"]');
  await s.waitForFunction(() => document.querySelector('[data-pt-yil]'), null, { timeout: 2500 }).catch(() => {});
  await tikla(s, `[data-yil="${d8.getFullYear()}"]`); await tikla(s, `[data-ay="${d8.getMonth() + 1}"]`);
  await s.waitForFunction(() => document.querySelector('[data-pt-evre]'), null, { timeout: 2500 }).catch(() => {});
  await s.evaluate(() => { const a = document.querySelector('[data-pt-uygula]'); a.scrollIntoView({ block: 'nearest' }); });
  await tikla(s, '[data-pt-uygula]'); await s.waitForTimeout(120);
  kontrol(`${w} yaş: "Bu yaşı kullan" profili yazar`, await s.evaluate(() => window.DadaKids.profil.ay === 8 && window.DadaKids.profil.evre === '6-8-ay' && !!document.querySelector('.kd-pt__onay') && document.querySelector('.kd-pt').getAttribute('data-renk') === 'seftali'));
  await s.evaluate(() => { const a = document.querySelector('[data-pt-evre]'); a.scrollIntoView({ block: 'nearest' }); });
  await tikla(s, '[data-pt-evre]'); await s.waitForURL(/kids-donem-6-8-ay\.html/, { timeout: 6000 }).catch(() => {});
  kontrol(`${w} yaş: evre sayfasına gider`, /kids-donem-6-8-ay\.html/.test(s.url()) && /ay=8/.test(s.url()), s.url());
  kontrol(`${w} yaş: doğum ayı saklanır`, await s.evaluate(() => { try { return JSON.parse(localStorage.getItem('dadakids.dogum.v1')).mod === 'dogum'; } catch (e) { return false; } }));
  await s.evaluate(() => localStorage.removeItem('dadakids.dogum.v1'));
  await s.close();

  // Besin → Güvenli Kesim kartı (aşamasıyla)
  s = await acSayfa(bag, 'kids-tarifler.html?ay=8&evre=6-8-ay', jsHata);
  await sec(s, 'besin');
  await s.fill('#kdPtAra', 'üzüm');
  await s.waitForFunction(() => document.querySelector('.kd-pt__besin'), null, { timeout: 4000 }).catch(() => {});
  let m = await s.evaluate(() => document.querySelector('.kd-pt__sonuclar').textContent);
  kontrol(`${w} besin: üzüm kartı aşamayla`, /Üzüm/.test(m) && /6-8 ay/.test(m) && /Dikkat/.test(m), m.slice(0, 120));
  kontrol(`${w} besin: örnek içerik etiketi`, /Örnek içerik — uzman onayı bekliyor/.test(m));
  const kesimBag = await s.evaluate(() => document.querySelector('.kd-pt__besin a').getAttribute('href'));
  kontrol(`${w} besin: kesim bağı`, /kids-guvenli-kesim\.html.*#uzum$/.test(kesimBag), kesimBag);
  await s.fill('#kdPtAra', 'bal');
  await s.waitForFunction(() => /Henüz erken/.test(document.querySelector('.kd-pt__sonuclar').textContent), null, { timeout: 3000 }).catch(() => {});
  m = await s.evaluate(() => document.querySelector('.kd-pt__sonuclar').textContent);
  kontrol(`${w} besin: bal 8 ayda henüz erken, en erken 12. ay`, /Henüz erken/.test(m) && /12\. ay/.test(m), m.slice(0, 120));
  await s.fill('#kdPtAra', 'zzqq');
  await s.waitForFunction(() => /kayıt bulamadım/.test(document.querySelector('.kd-pt__sonuclar').textContent), null, { timeout: 3000 }).catch(() => {});
  m = await s.evaluate(() => document.querySelector('.kd-pt__sonuclar').textContent);
  kontrol(`${w} besin: bilinmeyen besinde uydurmaz`, /kayıt bulamadım/.test(m), m.slice(0, 100));
  await s.fill('#kdPtAra', 'üzüm');
  await s.waitForFunction(() => document.querySelector('.kd-pt__besin a'), null, { timeout: 3000 }).catch(() => {});
  await s.evaluate(() => document.querySelector('.kd-pt__besin a').scrollIntoView({ block: 'nearest' }));
  await tikla(s, '.kd-pt__besin a'); await s.waitForURL(/kids-guvenli-kesim\.html/, { timeout: 6000 }).catch(() => {});
  await s.waitForTimeout(700);
  const hedef = await s.evaluate(() => { const e = document.getElementById('uzum'); if (!e) return null; const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  kontrol(`${w} besin: Güvenli Kesim kartına gider`, hedef === true, s.url());
  await s.close();

  // Bugün ne pişirsem → evreye göre 3 tarif → tarif sayfası
  s = await acSayfa(bag, 'kids-tarifler.html?evre=9-12-ay', jsHata);
  await sec(s, 'tarif');
  const tarifler = await s.evaluate(() => [...document.querySelectorAll('.kd-pt__tarifler a')].map((a) => ({ h: a.getAttribute('href'), yas: +(a.querySelector('small').textContent.match(/\+(\d+)/) || [])[1], ad: a.querySelector('b').textContent })));
  kontrol(`${w} tarif: 3 öneri, evreye uygun`, tarifler.length === 3 && tarifler.every((t) => t.yas <= 9 && /kids-tarif\.html\?/.test(t.h)), JSON.stringify(tarifler));
  await tikla(s, '.kd-pt__tarifler a'); await s.waitForURL(/kids-tarif\.html/, { timeout: 6000 }).catch(() => {});
  await s.waitForTimeout(300);
  const h1 = await s.evaluate(() => [...document.querySelectorAll('h1')].filter((h) => h.getBoundingClientRect().height > 0).map((h) => h.textContent.trim()).join(' '));
  kontrol(`${w} tarif: seçilen tarif açılır`, h1.includes(tarifler[0] ? tarifler[0].ad : '§'), h1);
  await s.close();

  // Alerjen, hazır mı, acil
  s = await acSayfa(bag, 'kids.html', jsHata);
  await sec(s, 'alerjen');
  m = await s.evaluate(() => { const k = document.querySelector('.kd-pt__balon-ic'); return { t: k.textContent, a: k.querySelector('a').getAttribute('href') }; });
  kontrol(`${w} alerjen: 3 günlük gözlem, kesin kural değil, örnek etiketi`, /3 günlük gözlem/.test(m.t) && /kesin tıbbi kural değil/.test(m.t) && /uzman onayı bekliyor/.test(m.t), m.t.slice(0, 120));
  await tikla(s, '.kd-pt__balon-ic a'); await s.waitForURL(/kids-arac-alerjen-takip\.html/, { timeout: 6000 }).catch(() => {});
  kontrol(`${w} alerjen: takip aracına gider`, /kids-arac-alerjen-takip\.html/.test(s.url()), s.url());
  await s.close();

  s = await acSayfa(bag, 'kids.html', jsHata);
  await sec(s, 'hazir');
  m = await s.evaluate(() => { const k = document.querySelector('.kd-pt__balon-ic'); return { t: k.textContent, n: k.querySelectorAll('.kd-pt__liste li').length }; });
  kontrol(`${w} hazır mı: veriden işaretler, örnek etiketi`, m.n === 3 && /uzman onayı bekliyor/.test(m.t), JSON.stringify(m).slice(0, 120));
  await s.evaluate(() => document.querySelector('.kd-pt__balon-ic a').scrollIntoView({ block: 'nearest' }));
  await tikla(s, '.kd-pt__balon-ic a'); await s.waitForURL(/kids-arac-hazir-mi\.html/, { timeout: 6000 }).catch(() => {});
  kontrol(`${w} hazır mı: kontrol listesine gider`, /kids-arac-hazir-mi\.html/.test(s.url()), s.url());
  await s.close();

  s = await acSayfa(bag, 'kids.html', jsHata);
  await sec(s, 'acil');
  m = await s.evaluate(() => { const k = document.querySelector('.kd-pt__balon'); return { t: k.textContent, tel: !!k.querySelector('a[href="tel:112"]'), kiz: !!k.querySelector('a[href*="kizilay.org.tr"]'), nf: document.activeElement && document.activeElement.className }; });
  kontrol(`${w} acil: 112 ve Kızılay eğitim bağlantısı`, m.tel && m.kiz && /hemen 112/.test(m.t), m.t.slice(0, 120));
  kontrol(`${w} acil: ilk yardım adımı yok`, !/(sırt|vurun|vurma|karın|bastır|heimlich|ters çevir|parmağı|ağzını açın)/i.test(m.t), m.t);
  kontrol(`${w} balon: Dada Mentor notu`, /Dada Mentor bağlantısı canlıda gelecek/.test(m.t));
  kontrol(`${w} balon: aria-live`, await s.evaluate(() => document.querySelector('.kd-pt__balon-ic').getAttribute('aria-live') === 'polite'));
  await s.keyboard.press('Escape'); await s.waitForTimeout(340);
  kontrol(`${w} balon: Esc kapatır, odak butonda`, await s.evaluate(() => document.querySelector('.kd-pt__balon').hidden && document.activeElement === document.querySelector('.kd-pt__btn')));
  await s.close();

  // Tek tık: zıplama sonra menü; hızlı tık: sürpriz bir kez, menü açılmaz, Pütür geri gelir
  s = await acSayfa(bag, 'kids-tarifler.html', jsHata);
  await s.waitForTimeout(1800);
  await tikla(s, '.kd-pt__btn');
  kontrol(`${w} tek tık: zıplıyor`, (await durum(s)) === 'tepki', await durum(s));
  kontrol(`${w} tek tık: menü hemen açılmıyor`, !(await menuAcik(s)));
  const acildi = await bekleMenu(s, 3200);
  kontrol(`${w} tek tık: ardından menü açılıyor`, acildi);
  await s.keyboard.press('Escape'); await s.waitForTimeout(350);
  const [x, y] = await merkez(s, '.kd-pt__btn');
  for (let i = 0; i < 8; i++) { await s.mouse.click(x, y); await s.waitForTimeout(90); }
  const izler = { menu: 0, tasma: 0, parca: 0, sure: 0 };
  const t0 = Date.now();
  while (Date.now() - t0 < 3400) {
    const a = await s.evaluate(() => {
      const p = [...document.querySelectorAll('.kd-pt__parca')].map((e) => e.getBoundingClientRect());
      return { d: document.querySelector('.kd-pt').getAttribute('data-durum'), m: !document.querySelector('#kdPtMenu').hidden, n: p.length, t: p.filter((r) => r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1).length };
    });
    if (a.m) izler.menu++; if (a.t) izler.tasma++; izler.parca = Math.max(izler.parca, a.n);
    if (a.d === 'idle' && !izler.sure && Date.now() - t0 > 300) izler.sure = Date.now() - t0;
    await s.waitForTimeout(70);
  }
  const son = await s.evaluate(() => { const k = document.querySelector('.kd-pt__karakter'); return { say: document.querySelector('.kd-pt').getAttribute('data-surpriz'), d: document.querySelector('.kd-pt').getAttribute('data-durum'), op: getComputedStyle(k).opacity, sahne: document.querySelector('.kd-pt__sahne').children.length, tr: getComputedStyle(k).transform }; });
  kontrol(`${w} sürpriz: bir kez oynadı`, son.say === '1', JSON.stringify(son));
  kontrol(`${w} sürpriz: pastel parçalar çıktı, ekrandan taşmadı`, izler.parca >= 10 && izler.tasma === 0, JSON.stringify(izler));
  kontrol(`${w} sürpriz: bu sırada menü açılmadı`, izler.menu === 0, JSON.stringify(izler));
  kontrol(`${w} sürpriz: ~2 sn içinde Pütür geri geldi`, son.d === 'idle' && son.op === '1' && son.sahne === 0 && izler.sure > 0 && izler.sure < 2700, JSON.stringify({ ...son, sure: izler.sure }));
  for (let i = 0; i < 6; i++) { await s.mouse.click(x, y); await s.waitForTimeout(80); }
  await s.waitForTimeout(500);
  kontrol(`${w} sürpriz: bekleme süresinde tekrar oynamaz`, (await s.evaluate(() => document.querySelector('.kd-pt').getAttribute('data-surpriz'))) === '1');
  await s.close();

  // Tepki ve sürpriz anı: dar ekranda kareler boyunca etkileşimli öğelerin ortası örtülmez
  if (w <= 768) for (const [ad, yol, yapay] of [['kids-tarifler üst', 'kids-tarifler.html', false], ['yapay düğme', 'kids.html', true]]) {
    for (const tur of ['tepki', 'sürpriz']) {
      const a = await acSayfa(bag, yol, jsHata);
      await a.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      if (yapay) await a.evaluate(YAPAY);
      await a.waitForTimeout(520);
      const [ax, ay] = await merkez(a, '.kd-pt__btn');
      await a.evaluate(IZ_BASLAT);
      if (tur === 'tepki') { await a.mouse.click(ax, ay); await bekleMenu(a, 3600); await a.waitForTimeout(120); }
      else { for (let i = 0; i < 6; i++) { await a.mouse.click(ax, ay); await a.waitForTimeout(90); } await a.waitForTimeout(2300); }
      const iz = await a.evaluate(IZ_BITIR);
      kontrol(`${w} ${ad} ${tur}: animasyon gerçekten ölçüldü`, iz.kare >= 30 && iz.merkez > 0 && (tur === 'tepki' ? iz.menu : iz.surpriz === '1'), JSON.stringify({ kare: iz.kare, merkez: iz.merkez, menu: iz.menu, surpriz: iz.surpriz }));
      kontrol(`${w} ${ad} ${tur}: etkileşimli öğelerin ortası hiçbir karede örtülmüyor`, Object.keys(iz.ihlal).length === 0, ihlalYazi(iz));
      if (tur === 'tepki') {
        await a.waitForTimeout(620);                                            // kademeli açılış bitsin
        const m = await a.evaluate(() => { const b = document.querySelector('.kd-pt__btn').getBoundingClientRect(), W = innerWidth; const og = [...document.querySelectorAll('.kd-pt__oge')].map((e) => e.getBoundingClientRect()); return { ekranDisi: og.filter((r) => r.left < 2 || r.right > W - 2 || r.top < 0).length, btn: [b.left, b.top, b.right, b.bottom].map(Math.round) }; });
        kontrol(`${w} ${ad} tepki sonrası: menü ekranda`, m.ekranDisi === 0, JSON.stringify(m));
      }
      await a.close();
    }
  }
  // Aynı an, video yolunda: gerçek alfa kanalıyla
  if (w <= 768 && existsSync(join(AGAC, 'varlik/kids/putur'))) {
    const vb = await tarayici.newContext({ viewport: { width: w, height: BOY[w] || 900 } });
    const a = await acSayfa(vb, 'kids-tarifler.html', jsHata);
    await a.waitForFunction(() => document.querySelector('.kd-pt').getAttribute('data-video') === 'hazir', null, { timeout: 8000 }).catch(() => {});
    await a.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await a.waitForTimeout(520);
    const [ax, ay] = await merkez(a, '.kd-pt__btn');
    await a.evaluate(IZ_BASLAT);
    await a.mouse.click(ax, ay); await bekleMenu(a, 4200); await a.waitForTimeout(120);
    const iz = await a.evaluate(IZ_BITIR);
    kontrol(`${w} kids-tarifler üst video: alfa ile ölçüldü`, iz.video >= 20, JSON.stringify({ video: iz.video, kare: iz.kare }));
    kontrol(`${w} kids-tarifler üst video: etkileşimli öğelerin ortası örtülmüyor`, Object.keys(iz.ihlal).length === 0, ihlalYazi(iz));
    await a.close(); await vb.close();
  }

  // Düzenden bağımsızlık: sayfa en üstteyken Pütür'ün altına bir düğme gelirse kenara çekilir (dar ekran)
  {
    const d = await acSayfa(bag, 'kids.html', jsHata);
    const sonuc = await d.evaluate(async () => {
      const kok = document.querySelector('.kd-pt'), r = kok.getBoundingClientRect();
      const kolon = document.querySelector('.kd-sayfa .wrap'), sol = kolon ? kolon.getBoundingClientRect().left + parseFloat(getComputedStyle(kolon).paddingLeft) : 0;
      if (r.right + 6 <= sol) return { atla: true };
      scrollTo({ top: 0, behavior: 'instant' });
      await new Promise((t) => setTimeout(t, 120));
      const once = kok.classList.contains('kd-pt--kenar');
      const b = document.createElement('button'); b.textContent = 'deneme';
      b.style.cssText = `position:fixed;z-index:1;left:${r.left + 6}px;top:${r.top + 6}px;width:${r.width - 12}px;height:${r.height - 12}px`;
      document.body.appendChild(b); dispatchEvent(new Event('resize'));
      await new Promise((t) => setTimeout(t, 120));
      const sonra = kok.classList.contains('kd-pt--kenar');
      b.remove(); dispatchEvent(new Event('resize'));
      await new Promise((t) => setTimeout(t, 120));
      return { once, sonra, geri: kok.classList.contains('kd-pt--kenar') };
    });
    if (!sonuc.atla) kontrol(`${w} düzenden bağımsız: altına gelen düğmede kenara çekilir, gidince döner`, sonuc.sonra === true && sonuc.geri === sonuc.once, JSON.stringify(sonuc));
    await d.close();
  }

  // Filtre paneli ve tarih seçici (alt sayfa) Pütür'ün üstünde kalır
  if (w <= 768) {
    s = await acSayfa(bag, 'kids-tarifler.html', jsHata);
    const acButon = await s.$('.kd-filtre-ac');
    if (acButon && await acButon.isVisible()) {
      await acButon.scrollIntoViewIfNeeded(); await acButon.click(); await s.waitForTimeout(420);
      const fp = await s.evaluate(() => { const p = document.querySelector('.kd-filtre').getBoundingClientRect(), b = document.querySelector('.kd-pt__btn').getBoundingClientRect(); const x = Math.max(p.left, b.left + b.width / 2), y = Math.max(p.top, b.top + b.height / 2); const u = document.elementFromPoint(Math.min(x, innerWidth - 1), Math.min(y, innerHeight - 1)); return { pt: !!(u && u.closest('.kd-pt')) }; });
      kontrol(`${w} filtre paneli: Pütür örtmüyor`, !fp.pt, JSON.stringify(fp));
    }
    await s.close();
  }
  if (w <= 640) {
    s = await acSayfa(bag, 'kids.html', jsHata);
    const tetik = await s.$('.kd-ds__ac');
    if (tetik && await tetik.isVisible()) {
      await tetik.scrollIntoViewIfNeeded(); await tetik.click(); await s.waitForTimeout(460);
      const ds = await s.evaluate(() => { const p = document.querySelector('.kd-ds__panel'); if (!p) return { yok: true }; const r = p.getBoundingClientRect(), b = document.querySelector('.kd-pt__btn').getBoundingClientRect(); const u = document.elementFromPoint(b.left + b.width / 2, Math.max(r.top + 4, b.top + b.height / 2)); return { pt: !!(u && u.closest('.kd-pt')) }; });
      kontrol(`${w} tarih seçici: Pütür örtmüyor`, !ds.pt, JSON.stringify(ds));
    }
    await s.close();
  }
  yaz(`· ${w}px akışlar bitti (${gecen} geçti, ${kalan} kaldı)`);
  await bag.close();
}

/* ---------- 3 · Azaltılmış hareket ---------- */
if (!YALNIZ_EK) {
  const bag = await tarayici.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const s = await acSayfa(bag, 'kids-tarifler.html', jsHata);
  await s.waitForTimeout(600);
  const anim = () => s.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.target && (a.effect.target.closest('.kd-pt') || a.effect.target.closest('.kd-pt-sekme'))).map((a) => ({ ad: a.animationName || a.transitionProperty || 'waapi', tur: a.constructor.name, kare: a.effect.getKeyframes ? a.effect.getKeyframes().flatMap((k) => Object.keys(k)).filter((x) => !['offset', 'computedOffset', 'easing', 'composite'].includes(x)) : [] })));
  kontrol('reduced: idle animasyon yok', (await anim()).length === 0, JSON.stringify(await anim()));
  await tikla(s, '.kd-pt__btn');
  kontrol('reduced: zıplama yok, menü doğrudan', (await durum(s)) === 'idle' && await menuAcik(s), await durum(s));
  await s.waitForTimeout(260);
  const a2 = await anim();
  kontrol('reduced: menüde hareket yok (yalnız solma)', a2.every((a) => a.ad === 'opacity' || (a.kare.length && a.kare.every((k) => k === 'opacity'))), JSON.stringify(a2.slice(0, 3)));
  await s.keyboard.press('Escape'); await s.waitForTimeout(260);
  const [x, y] = await merkez(s, '.kd-pt__btn');
  for (let i = 0; i < 5; i++) { await s.mouse.click(x, y); await s.waitForTimeout(90); }
  await s.waitForTimeout(240);
  const a3 = await anim();
  const su = await s.evaluate(() => ({ d: document.querySelector('.kd-pt').getAttribute('data-durum'), n: document.querySelectorAll('.kd-pt__parca').length, m: !document.querySelector('#kdPtMenu').hidden }));
  kontrol('reduced: sürpriz solma + tek parıltı', su.d === 'surpriz' && su.n === 1 && !su.m && a3.filter((a) => a.tur !== 'CSSTransition').every((a) => a.kare.every((k) => k === 'opacity')), JSON.stringify({ su, a3: a3.slice(0, 4) }));
  await s.waitForTimeout(1500);
  kontrol('reduced: geri döner', (await durum(s)) === 'idle');
  await bag.close();
}

/* ---------- 4 · Klavye, gizle/göster, depolama kapalı, tema-evre ---------- */
if (!YALNIZ_EK) {
  const bag = await tarayici.newContext({ viewport: { width: 1440, height: 900 } });
  await bag.addInitScript(() => { window.__kdPuturVideo = null; });
  let s = await acSayfa(bag, 'kids-tarifler.html', jsHata);
  kontrol('erişilebilirlik: aria-label', await s.evaluate(() => document.querySelector('.kd-pt__btn').getAttribute('aria-label') === "Pütür'e sor"));
  await s.focus('.kd-pt__btn'); await s.keyboard.press('Enter'); await bekleMenu(s); await s.waitForTimeout(200);
  await s.keyboard.press('ArrowDown'); const o1 = await s.evaluate(() => document.activeElement.getAttribute('data-secenek'));
  await s.keyboard.press('ArrowUp'); await s.keyboard.press('ArrowUp'); const o2 = await s.evaluate(() => document.activeElement.getAttribute('data-secenek'));
  await s.keyboard.press('Home'); await s.keyboard.press('Tab'); const o3 = await s.evaluate(() => document.activeElement.getAttribute('data-secenek'));
  kontrol('klavye: ok ve Tab menüde gezer', o1 === 'besin' && o2 === 'acil' && o3 === 'besin', JSON.stringify([o1, o2, o3]));
  await s.keyboard.press('Escape');
  const halka = await s.evaluate(() => { const b = document.querySelector('.kd-pt__btn'), c = getComputedStyle(b); return { st: c.outlineStyle, gen: parseFloat(c.outlineWidth), odak: document.activeElement === b }; });
  kontrol('klavye: görünür odak halkası', halka.odak && halka.st === 'solid' && halka.gen >= 2, JSON.stringify(halka));

  await s.hover('.kd-pt__btn'); await s.waitForTimeout(220);
  await tikla(s, '.kd-pt__kucult'); await s.waitForTimeout(120);
  kontrol('gizle: sekme görünür, Pütür gizli', await s.evaluate(() => document.querySelector('.kd-pt').hidden && !document.querySelector('.kd-pt-sekme').hidden));
  await s.reload({ waitUntil: 'networkidle' });
  kontrol('gizle: yenilemede hatırlanır', await s.evaluate(() => document.querySelector('.kd-pt').hidden));
  await tikla(s, '.kd-pt-sekme'); await s.waitForTimeout(120);
  kontrol('gizle: sekme geri getirir', await s.evaluate(() => !document.querySelector('.kd-pt').hidden && document.activeElement === document.querySelector('.kd-pt__btn')));

  const serit = () => s.evaluate(() => getComputedStyle(document.querySelector('.pt-serit')).stroke);
  const ilk = await serit();
  await s.evaluate(() => window.DadaKids.profilAyarla({ evre: '9-12-ay' }));
  const mint = await serit();
  const r1 = await s.evaluate(() => document.querySelector('.kd-pt').getAttribute('data-renk'));
  await s.evaluate(() => window.DadaKids.profilAyarla({ evre: null, c: 'erkek' })); await s.waitForTimeout(120);
  const mavi = await serit();
  const tema = await s.evaluate(() => getComputedStyle(document.querySelector('.kd-pt')).getPropertyValue('--pt-halka'));
  await s.evaluate(() => window.DadaKids.profilAyarla({ c: 'belirtilmedi' }));
  kontrol('tema: evre rengi şeride canlı yansır', r1 === 'mint' && mint === 'rgb(166, 227, 203)' && ilk !== mint, JSON.stringify([ilk, mint, r1]));
  kontrol('tema: mavi tema şeride ve halkaya yansır', mavi === 'rgb(175, 211, 245)' && /--kd-tema|#|rgb/.test(tema), JSON.stringify([mavi, tema]));
  await s.close(); await bag.close();

  const bag2 = await tarayici.newContext({ viewport: { width: 390, height: 844 } });
  await bag2.addInitScript(() => { window.__kdPuturVideo = null; const k = Storage.prototype.getItem, y = Storage.prototype.setItem; Storage.prototype.getItem = function () { throw new Error('kapalı'); }; Storage.prototype.setItem = function () { throw new Error('kapalı'); }; void k; void y; });
  const onceHata = jsHata.length;
  s = await acSayfa(bag2, 'kids-tarifler.html', jsHata);
  await tikla(s, '.kd-pt__btn'); const am = await bekleMenu(s, 3000);
  kontrol('depolama kapalı: Pütür çalışır, hata yok', am && jsHata.length === onceHata, jsHata.slice(onceHata).join(' | '));
  await bag2.close();
}

/* ---------- 5 · Video ---------- */
if (!YALNIZ_EK) {
  const bag = await tarayici.newContext({ viewport: { width: 1440, height: 900 } });
  const s = await acSayfa(bag, 'kids-tarifler.html', jsHata);
  await s.waitForFunction(() => /hazir|yok/.test(document.querySelector('.kd-pt').getAttribute('data-video') || ''), null, { timeout: 6000 }).catch(() => {});
  const v = await s.evaluate(() => document.querySelector('.kd-pt').getAttribute('data-video'));
  const klasor = join(AGAC, 'varlik/kids/putur');
  const dosyalar = existsSync(klasor) ? readdirSync(klasor).filter((f) => /\.(webm|mp4|webp|png)$/.test(f)) : [];
  const buyuk = dosyalar.filter((f) => statSync(join(klasor, f)).size > 600 * 1024);
  if (dosyalar.some((f) => f.endsWith('.webm'))) {
    kontrol('video: Chromium VP9 alpha hazır', v === 'hazir', String(v));
    kontrol('video: her dosya <600 KB', buyuk.length === 0, buyuk.join(' '));
    await s.waitForTimeout(800);
    await tikla(s, '.kd-pt__btn');
    await s.waitForFunction(() => document.querySelector('.kd-pt--video'), null, { timeout: 1200 }).then(() => kontrol('video: tık sonrası oynuyor', true), () => kontrol('video: tık sonrası oynuyor', false));
    const yay = await s.evaluate(() => { const r = document.querySelector('.kd-pt__video').getBoundingClientRect(), b = document.querySelector('.kd-pt__btn').getBoundingClientRect(); return { r: [r.left, r.top, r.width], b: [b.left, b.top, b.width], sn: document.querySelector('.kd-pt__video').duration }; });
    kontrol('video: 1,5–2,5 sn', yay.sn >= 1.5 && yay.sn <= 2.5, JSON.stringify(yay));
    const acildi = await bekleMenu(s, 4000);
    const bitti = await s.evaluate(() => ({ cls: document.querySelector('.kd-pt').className, sv: getComputedStyle(document.querySelector('.kd-pt__svg')).visibility }));
    kontrol('video: bitince SVG döner ve menü açılır', acildi && bitti.sv === 'visible' && !/kd-pt--video/.test(bitti.cls), JSON.stringify(bitti));
    await s.evaluate(() => window.DadaKids.profilAyarla({ evre: '9-12-ay' }));
    await s.waitForFunction(() => /zipla-mint/.test((document.querySelector('.kd-pt__video') || {}).src || ''), null, { timeout: 2500 }).then(() => kontrol('video: evre rengine göre kaynak değişir', true), () => kontrol('video: evre rengine göre kaynak değişir', false));
  }
  await bag.close();
}

/* ---------- 6 · Boyut ve konum (EK) ---------- */
const HEDEF = { 1440: { boy: 112, alt: 32, sol: 32 }, 1024: { boy: 96, alt: 24, sol: 24 }, 768: { boy: 96, alt: 24, sol: 24 }, 390: { boy: 76, alt: 20, sol: 20 }, 320: { boy: 68, alt: 20, sol: 20 } };
const BANT = () => {
  const d = document.createElement('div'); d.id = 'cookieBanner'; d.className = 'cookie-banner show';
  d.innerHTML = '<div class="cookie-inner"><div class="cookie-text"><p>Çerez bandı denemesi: gerçek sitedeki bandın sınıflarıyla.</p></div><button type="button">Kabul et</button></div>';
  document.body.appendChild(d); dispatchEvent(new Event('resize'));
};
for (const w of GENISLIK) {
  const h = HEDEF[w]; if (!h) continue;
  const bag = await tarayici.newContext({ viewport: { width: w, height: BOY[w] || 900 } });
  await bag.addInitScript(() => { try { localStorage.setItem('dadakids.putur.merhaba.v1', '1'); sessionStorage.setItem('dadakids.putur.selam', '1'); } catch (e) {} window.__kdPuturVideo = null; });
  for (const yol of ['kids-tarifler.html', 'kids.html', 'kids-guvenli-kesim.html']) {
    const a = await acSayfa(bag, yol, jsHata); await a.waitForTimeout(520);
    const o = await a.evaluate(() => {
      const k = document.querySelector('.kd-pt'), n = document.querySelector('.bottom-nav'), nc = n && getComputedStyle(n), navVar = n && nc.display !== 'none';
      const kol = document.querySelector('.kd-sayfa .wrap'), kolSol = kol ? kol.getBoundingClientRect().left + parseFloat(getComputedStyle(kol).paddingLeft) : 0;
      return { boy: k.offsetWidth, sol: k.offsetLeft, alt: innerHeight - k.offsetTop - k.offsetHeight, navPay: navVar ? n.offsetHeight + (parseFloat(nc.bottom) || 0) : 0, kolSol };
    });
    kontrol(`${w} ${yol} boyut ~${h.boy}px`, Math.abs(o.boy - h.boy) <= 3, JSON.stringify(o));
    kontrol(`${w} ${yol} alt mesafe ~${h.alt}px (alt çubuk varsa onun üstünde)`, Math.abs(o.alt - o.navPay - h.alt) <= 3, JSON.stringify(o));
    const sigiyor = h.sol + h.boy + 8 <= o.kolSol;
    kontrol(`${w} ${yol} sol mesafe ~${h.sol}px ya da kolona girmeyecek kadar içeride`, Math.abs(o.sol - h.sol) <= 3 || (!sigiyor && o.sol >= 10 && o.sol + o.boy + 8 <= o.kolSol), JSON.stringify(o));
    await a.close();
  }
  // yukarı çık ile aynı alt hiza
  const t = await acSayfa(bag, 'kids-tarifler.html', jsHata);
  await t.evaluate(() => scrollTo({ top: 900, behavior: 'instant' })); await t.waitForTimeout(700);
  const hiz = await t.evaluate(() => { const tt = document.querySelector('#toTop'), k = document.querySelector('.kd-pt'); if (!tt) return null; const r = tt.getBoundingClientRect(); return { tt: Math.round(innerHeight - r.bottom), pt: Math.round(innerHeight - k.offsetTop - k.offsetHeight), gor: getComputedStyle(tt).visibility }; });
  kontrol(`${w} yukarı-çık ile aynı alt hiza`, hiz && hiz.gor === 'visible' && Math.abs(hiz.tt - hiz.pt) <= 3, JSON.stringify(hiz));
  await t.close();
  // çerez bandı açıkken: dinlenme, tepki, sürpriz
  for (const tur of ['dinlenme', 'tepki', 'sürpriz']) {
    const a = await acSayfa(bag, 'kids-tarifler.html', jsHata);
    await a.evaluate(BANT); await a.waitForTimeout(620);
    const r0 = await a.evaluate(() => { const b = document.querySelector('.kd-pt__btn').getBoundingClientRect(), c = document.querySelector('#cookieBanner').getBoundingClientRect(); return { btnAlt: Math.round(b.bottom), bantUst: Math.round(c.top) }; });
    if (tur === 'dinlenme') { kontrol(`${w} çerez bandı açık: Pütür bandın üstünde`, r0.btnAlt <= r0.bantUst, JSON.stringify(r0)); await a.close(); continue; }
    const [ax, ay] = await merkez(a, '.kd-pt__btn');
    await a.evaluate(IZ_BASLAT);
    if (tur === 'tepki') { await a.mouse.click(ax, ay); await bekleMenu(a, 3600); await a.waitForTimeout(120); } else { for (let i = 0; i < 6; i++) { await a.mouse.click(ax, ay); await a.waitForTimeout(90); } await a.waitForTimeout(2300); }
    const iz = await a.evaluate(IZ_BITIR);
    const r1 = await a.evaluate(() => { const b = document.querySelector('.kd-pt__btn').getBoundingClientRect(), c = document.querySelector('#cookieBanner').getBoundingClientRect(); return { btnAlt: Math.round(b.bottom), bantUst: Math.round(c.top) }; });
    kontrol(`${w} çerez bandı açık ${tur}: band ve öğeler örtülmüyor`, iz.kare >= 30 && Object.keys(iz.ihlal).length === 0 && r1.btnAlt <= r1.bantUst, ihlalYazi(iz) + ' ' + JSON.stringify({ ...r1, kare: iz.kare }));
    await a.close();
  }
  await bag.close();
}

/* ---------- 7 · Hover menü, tıklama sabitleme, dokunmatik, klavye (EK) ---------- */
const menuAcikMi = (s) => s.evaluate(() => !!document.querySelector('#kdPtMenu.kd-acik'));
for (const w of GENISLIK.filter((x) => x >= 1024)) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: BOY[w] || 900 } });
  await bag.addInitScript(() => { try { localStorage.setItem('dadakids.putur.merhaba.v1', '1'); sessionStorage.setItem('dadakids.putur.selam', '1'); } catch (e) {} window.__kdPuturVideo = null; });
  const s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.waitForTimeout(500);
  const [x, y] = await merkez(s, '.kd-pt__btn');
  await s.mouse.move(x, y, { steps: 3 }); await s.waitForTimeout(90);
  kontrol(`${w} hover: gecikme öncesi menü kapalı`, !(await menuAcikMi(s)));
  await s.waitForTimeout(520);
  kontrol(`${w} hover: ~200 ms sonra menü açık`, await menuAcikMi(s));
  kontrol(`${w} hover: küçük merhaba tepkisi, video zıplaması değil`, await s.evaluate(() => { const k = document.querySelector('.kd-pt'); return k.getAttribute('data-durum') !== 'tepki' && !k.classList.contains('kd-pt--video'); }));
  kontrol(`${w} hover: tepki state'i izlendi`, await s.evaluate(() => document.querySelector('.kd-pt').hasAttribute('data-hover')));
  // Pütür → menü geçişi: boşluktan geçerken kapanmaz
  const hedefOge = await merkez(s, '.kd-pt__oge[data-secenek="acil"]');
  const adim = 8; let kapandi = false;
  for (let i = 1; i <= adim; i++) { await s.mouse.move(x + (hedefOge[0] - x) * i / adim, y + (hedefOge[1] - y) * i / adim); await s.waitForTimeout(70); if (!(await menuAcikMi(s))) kapandi = true; }
  kontrol(`${w} hover: Pütür→menü geçişinde kapanmıyor`, !kapandi);
  await s.waitForTimeout(520);
  kontrol(`${w} hover: menü üstündeyken açık kalıyor`, await menuAcikMi(s));
  await s.mouse.move(w - 200, 300, { steps: 2 }); await s.waitForTimeout(220);
  kontrol(`${w} hover: çıkınca hemen kapanmıyor`, await menuAcikMi(s));
  await s.waitForTimeout(560);
  kontrol(`${w} hover: ~400 ms sonra kapanıyor`, !(await menuAcikMi(s)));
  // hover ile açıkken tıklama: sabitler ve zıplatır, kapatıp açmaz
  await s.mouse.move(x, y, { steps: 2 }); await bekleMenu(s, 1500); await s.waitForTimeout(420);
  await s.mouse.down(); await s.mouse.up();
  const izTk = []; for (let i = 0; i < 14; i++) { izTk.push(await menuAcikMi(s)); await s.waitForTimeout(40); }
  kontrol(`${w} tıklama: açık menüyü kapatıp yeniden açmaz`, izTk.every(Boolean), izTk.join(','));
  kontrol(`${w} tıklama: zıplatır`, (await durum(s)) === 'tepki', await durum(s));
  await s.waitForTimeout(1800);
  await s.mouse.move(w - 200, 300, { steps: 2 }); await s.waitForTimeout(800);
  kontrol(`${w} tıklama: imleç çıksa da açık kalır`, await menuAcikMi(s));
  await s.mouse.click(w - 200, 300); await s.waitForTimeout(420);
  kontrol(`${w} tıklama: dışarı tıklama kapatır`, !(await menuAcikMi(s)));
  await s.close();
  // hover + 5 tık: sürpriz aynen, menü kapalı
  const h = await acSayfa(bag, 'kids-tarifler.html', jsHata); await h.waitForTimeout(500);
  await h.mouse.move(x, y, { steps: 2 }); await bekleMenu(h, 1500); await h.waitForTimeout(300);
  for (let i = 0; i < 6; i++) { await h.mouse.click(x, y); await h.waitForTimeout(80); }
  await h.waitForTimeout(300);
  const sv = await h.evaluate(() => ({ d: document.querySelector('.kd-pt').getAttribute('data-durum'), say: document.querySelector('.kd-pt').getAttribute('data-surpriz'), m: !!document.querySelector('#kdPtMenu.kd-acik') }));
  kontrol(`${w} hover menüsü açıkken 5 tık: sürpriz oynar, menü kapanır`, sv.d === 'surpriz' && sv.say === '1' && !sv.m, JSON.stringify(sv));
  await h.waitForTimeout(2300);
  kontrol(`${w} sürpriz sonrası: tek oynadı, menü kendiliğinden açılmadı`, await h.evaluate(() => document.querySelector('.kd-pt').getAttribute('data-surpriz') === '1' && !document.querySelector('#kdPtMenu.kd-acik')));
  await h.close();
  // klavye
  const k = await acSayfa(bag, 'kids-tarifler.html', jsHata); await k.waitForTimeout(400);
  await k.evaluate(() => { document.activeElement && document.activeElement.blur(); });
  await k.keyboard.press('Shift+Tab'); await k.keyboard.press('Shift+Tab'); await k.waitForTimeout(160);
  const o1 = await k.evaluate(() => ({ odak: document.activeElement === document.querySelector('.kd-pt__btn'), ad: document.activeElement.className }));
  await k.waitForTimeout(560);
  kontrol(`${w} klavye: odak gelince menü açılır`, o1.odak && await menuAcikMi(k), JSON.stringify(o1));
  await k.keyboard.press('Tab'); const t1 = await k.evaluate(() => document.activeElement.getAttribute('data-secenek'));
  await k.keyboard.press('ArrowDown'); const t2 = await k.evaluate(() => document.activeElement.getAttribute('data-secenek'));
  kontrol(`${w} klavye: Tab ve ok menüde gezer`, t1 === 'yas' && t2 === 'besin', JSON.stringify([t1, t2]));
  await k.keyboard.press('Escape'); await k.waitForTimeout(420);
  const o2 = await k.evaluate(() => ({ btn: document.activeElement === document.querySelector('.kd-pt__btn') }));
  kontrol(`${w} klavye: Esc kapatır, odak butonda, yeniden açılmaz`, o2.btn && !(await menuAcikMi(k)), JSON.stringify(o2));
  await k.keyboard.press('Shift+Tab'); await k.waitForTimeout(320);
  kontrol(`${w} klavye: geri sekmede tuzak yok`, await k.evaluate(() => !document.activeElement.closest('.kd-pt') && !!document.activeElement && !document.querySelector('#kdPtMenu.kd-acik')));
  await k.close();
  const k2 = await acSayfa(bag, 'kids-tarifler.html', jsHata); await k2.waitForTimeout(300);
  await k2.evaluate(() => document.activeElement && document.activeElement.blur());
  await k2.keyboard.press('Shift+Tab'); await k2.keyboard.press('Shift+Tab'); await k2.waitForTimeout(420);
  for (let i = 0; i < 9; i++) await k2.keyboard.press('Tab');
  await k2.waitForTimeout(320);
  kontrol(`${w} klavye: ileri sekmede tuzak yok, menü kapanır`, await k2.evaluate(() => !document.activeElement.closest('.kd-pt') && !document.querySelector('#kdPtMenu.kd-acik')), await k2.evaluate(() => document.activeElement.tagName + '.' + document.activeElement.className));
  await k2.close();
  await bag.close();
}
for (const w of GENISLIK.filter((x) => x <= 768)) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: BOY[w] || 900 }, hasTouch: true, isMobile: true });
  await bag.addInitScript(() => { try { localStorage.setItem('dadakids.putur.merhaba.v1', '1'); } catch (e) {} window.__kdPuturVideo = null; });
  const s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.waitForTimeout(500);
  const [x, y] = await merkez(s, '.kd-pt__btn');
  await s.touchscreen.tap(x, y); await s.waitForTimeout(160);
  kontrol(`${w} dokunmatik: ilk dokunuş zıplama`, (await durum(s)) === 'tepki', await durum(s));
  kontrol(`${w} dokunmatik: ardından menü açılır`, await bekleMenu(s, 3200));
  await s.close(); await bag.close();
}

/* ---------- 8 · "Merhaba!" balonu (EK) ---------- */
for (const w of GENISLIK.filter((x) => x === 1440 || x === 390 || x === 320)) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: BOY[w] || 900 } });
  await bag.addInitScript(() => { window.__kdPuturVideo = null; });
  const s = await bag.newPage(); s.on('pageerror', (e) => jsHata.push('merhaba: ' + e.message));
  await s.goto(TABAN + 'kids-tarifler.html', { waitUntil: 'domcontentloaded' });
  const gor = await s.waitForFunction(() => { const e = document.querySelector('.kd-pt__merhaba'); return e && !e.hidden && getComputedStyle(e).opacity > .5; }, null, { timeout: 4000 }).then(() => true, () => false);
  const t = await s.evaluate(() => { const e = document.querySelector('.kd-pt__merhaba'); if (!e) return null; const r = e.getBoundingClientRect(); return { yazi: e.textContent.trim(), sol: r.left, sag: innerWidth - r.right, ust: r.top }; });
  kontrol(`${w} Merhaba: ilk ziyarette görünür ve ekranda`, gor && t && /Merhaba!/.test(t.yazi) && t.sol >= 0 && t.sag >= 0 && t.ust >= 0, JSON.stringify(t));
  await s.waitForTimeout(3700);
  kontrol(`${w} Merhaba: ~3 sn sonra kaybolur`, await s.evaluate(() => { const e = document.querySelector('.kd-pt__merhaba'); return !e || e.hidden || +getComputedStyle(e).opacity === 0; }));
  await s.reload({ waitUntil: 'domcontentloaded' }); await s.waitForTimeout(1600);
  kontrol(`${w} Merhaba: ikinci ziyarette gösterilmez`, await s.evaluate(() => { const e = document.querySelector('.kd-pt__merhaba'); return !e || e.hidden || +getComputedStyle(e).opacity === 0; }));
  await s.close(); await bag.close();
}
{
  const bag = await tarayici.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await bag.addInitScript(() => { window.__kdPuturVideo = null; });
  const s = await bag.newPage(); await s.goto(TABAN + 'kids-tarifler.html', { waitUntil: 'domcontentloaded' }); await s.waitForTimeout(1300);
  const m = await s.evaluate(() => ({ an: document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.kd-pt')).length, var_: !!document.querySelector('.kd-pt__merhaba') }));
  kontrol('reduced: Merhaba animasyonsuz', m.var_ && m.an === 0, JSON.stringify(m));
  await s.close(); await bag.close();
}

/* ---------- 9 · Bağlama duyarlı tetikleyiciler (EK) ---------- */
{
  const bag = await tarayici.newContext({ viewport: { width: 1440, height: 900 } });
  await bag.addInitScript(() => { try { localStorage.setItem('dadakids.putur.merhaba.v1', '1'); sessionStorage.setItem('dadakids.putur.selam', '1'); } catch (e) {} window.__kdPuturVideo = null; });
  // scroll yönüne bakma
  let s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.waitForTimeout(400);
  await s.mouse.move(700, 400); await s.mouse.wheel(0, 300); await s.waitForTimeout(80);
  const b1 = await s.evaluate(() => document.querySelector('.kd-pt').getAttribute('data-bakis'));
  await s.mouse.wheel(0, -200); await s.waitForTimeout(80);
  const b2 = await s.evaluate(() => document.querySelector('.kd-pt').getAttribute('data-bakis'));
  await s.waitForTimeout(560);
  const b3 = await s.evaluate(() => ({ b: document.querySelector('.kd-pt').getAttribute('data-bakis'), d: document.querySelector('.kd-pt').getAttribute('data-durum') }));
  kontrol('tetikleyici: scroll yönüne bakar, durunca idle', b1 === 'asagi' && b2 === 'yukari' && !b3.b && b3.d === 'idle', JSON.stringify([b1, b2, b3]));
  // arama kutusu ve filtre
  await s.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await s.waitForTimeout(200);
  const aramaVar = await s.$('input[type="search"], input[role="searchbox"]');
  if (aramaVar) {
    await aramaVar.focus(); await s.waitForTimeout(160);
    kontrol('tetikleyici: arama kutusuna odak → araştırma', (await durum(s)) === 'arama', await durum(s));
    await s.evaluate(() => document.activeElement.blur()); await s.waitForTimeout(420);
    kontrol('tetikleyici: odak gidince idle', (await durum(s)) === 'idle', await durum(s));
  } else kontrol('tetikleyici: arama kutusu bulundu', false);
  const filtre = await s.$('form input[type="checkbox"]');
  if (filtre) {
    await s.evaluate(() => { const i = document.querySelector('form input[type="checkbox"]'); i.click(); }); await s.waitForTimeout(160);
    kontrol('tetikleyici: filtre değişince araştırma', (await durum(s)) === 'arama', await durum(s));
    await s.waitForTimeout(2800);
    kontrol('tetikleyici: filtreden sonra idle', (await durum(s)) === 'idle', await durum(s));
  } else kontrol('tetikleyici: filtre bulundu', false);
  await s.close();
  // menü seçimi: ~0,6 sn düşünme → anlatma, balon açıkken anlatma sürer
  s = await acSayfa(bag, 'kids-tarifler.html', jsHata);
  await s.evaluate(() => { const k = document.querySelector('.kd-pt'); window.__sira = []; const t0 = performance.now(); new MutationObserver(() => window.__sira.push([Math.round(performance.now() - t0), k.getAttribute('data-durum')])).observe(k, { attributes: true, attributeFilter: ['data-durum'] }); });
  await sec(s, 'alerjen'); await s.waitForTimeout(3400);
  const si = await s.evaluate(() => window.__sira);
  const dus = si.findIndex((x) => x[1] === 'dusunme'), anl = si.findIndex((x) => x[1] === 'anlatma');
  const fark = dus >= 0 && anl > dus ? si[anl][0] - si[dus][0] : -1;
  kontrol('tetikleyici: seçim → ~0,6 sn düşünme → anlatma', fark >= 480 && fark <= 900, JSON.stringify(si));
  kontrol('tetikleyici: balon açıkken anlatma sürer', (await durum(s)) === 'anlatma', await durum(s));
  await s.keyboard.press('Escape'); await s.waitForTimeout(320);
  kontrol('tetikleyici: balon kapanınca idle', (await durum(s)) === 'idle', await durum(s));
  await s.close();
  // besin aramasında durum titremez
  s = await acSayfa(bag, 'kids-tarifler.html?evre=9-12-ay', jsHata);
  await s.evaluate(() => { const k = document.querySelector('.kd-pt'); window.__sira = []; const t0 = performance.now(); new MutationObserver(() => window.__sira.push([Math.round(performance.now() - t0), k.getAttribute('data-durum')])).observe(k, { attributes: true, attributeFilter: ['data-durum'] }); });
  await sec(s, 'besin'); await s.fill('#kdPtAra', 'üzüm'); await s.waitForTimeout(900);
  const sb = await s.evaluate(() => window.__sira);
  const kisa = sb.filter((x, i) => i + 1 < sb.length && sb[i + 1][0] - x[0] < 120);
  kontrol('doğrulama: besin aramasında durum titremesi yok', kisa.length === 0, JSON.stringify(sb));
  await s.close();
  // okuma: rehber makalesi, 20+ sn yavaş okuma; başka sayfada yok
  s = await acSayfa(bag, 'kids-rehber-alerjen-tanitimi.html', jsHata);
  await s.mouse.move(700, 400);
  await s.evaluate(() => { window.__bas = 0; new MutationObserver(() => { if (document.querySelector('.kd-pt').classList.contains('kd-pt--bas')) window.__bas++; }).observe(document.querySelector('.kd-pt'), { attributes: true, attributeFilter: ['class'] }); });
  for (let i = 0; i < 12; i++) { await s.mouse.wheel(0, 90); await s.waitForTimeout(1900); }
  await s.waitForTimeout(800);
  const ok1 = await s.evaluate(() => ({ d: document.querySelector('.kd-pt').getAttribute('data-durum'), kitap: +getComputedStyle(document.querySelector('.pt-kitap') || document.body).opacity, kitapVar: !!document.querySelector('.pt-kitap') }));
  kontrol('tetikleyici: makalede 20+ sn → okuma pozu, kitapçık görünür', ok1.d === 'okuma' && ok1.kitapVar && ok1.kitap > .9, JSON.stringify(ok1));
  for (let i = 0; i < 14; i++) { await s.mouse.wheel(0, 160); await s.waitForTimeout(420); }
  kontrol('tetikleyici: okurken bölüm geçişinde baş sallar', (await s.evaluate(() => window.__bas)) > 0, String(await s.evaluate(() => window.__bas)));
  await s.close();
  s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.mouse.move(700, 400);
  for (let i = 0; i < 6; i++) { await s.mouse.wheel(0, 90); await s.waitForTimeout(600); }
  kontrol('tetikleyici: makale dışında okuma pozu yok', (await durum(s)) !== 'okuma');
  await s.close();
  // hareketsizlik: gezinti, sonra idle
  s = await acSayfa(bag, 'kids-tarifler.html', jsHata);
  await s.evaluate(() => { const k = document.querySelector('.kd-pt'); window.__sira = []; const t0 = performance.now(); new MutationObserver(() => window.__sira.push([Math.round(performance.now() - t0), k.getAttribute('data-durum')])).observe(k, { attributes: true, attributeFilter: ['data-durum'] }); });
  await s.mouse.move(700, 400); await s.waitForTimeout(29000);
  const on = await s.evaluate(() => window.__sira.filter((x) => x[1] === 'gezinti').length);
  await s.waitForTimeout(21000);
  const sg = await s.evaluate(() => window.__sira);
  const gz = sg.filter((x) => x[1] === 'gezinti');
  kontrol('tetikleyici: 30 sn dolmadan gezinti yok', on === 0, JSON.stringify(sg));
  kontrol('tetikleyici: 30–45 sn hareketsizlikte bir kez gezinti, sonra idle', gz.length === 1 && gz[0][0] >= 29000 && gz[0][0] <= 47000 && sg[sg.length - 1][1] === 'idle', JSON.stringify(sg));
  await s.close();
  // sekme gizliyken her şey durur
  s = await acSayfa(bag, 'kids-tarifler.html', jsHata); await s.waitForTimeout(400);
  await s.evaluate(() => { window.__tm = 0; const st = window.setTimeout; window.setTimeout = function (f, t, ...a) { window.__tm++; return st(f, t, ...a); }; });
  await s.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await s.waitForTimeout(300);
  const g0 = await s.evaluate(() => { window.__tm = 0; return document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.kd-pt') && a.playState === 'running').length; });
  await s.waitForTimeout(7000);
  const g1 = await s.evaluate(() => window.__tm);
  kontrol('gizli sekme: çalışan animasyon yok', g0 === 0, String(g0));
  kontrol('gizli sekme: zamanlayıcı uyanmıyor', g1 === 0, String(g1));
  await s.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
  await s.waitForTimeout(300);
  kontrol('gizli sekme: görünür olunca animasyon sürer', await s.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.kd-pt') && a.playState === 'running').length > 0));
  await s.close(); await bag.close();
}

kontrol('sayfa içi JS hatası / yerel 4xx yok', jsHata.length === 0, [...new Set(jsHata)].slice(0, 6).join(' | '));
await tarayici.close();
if (hatalar.length) { yaz('\nKalanlar (ilk 40):'); hatalar.slice(0, 40).forEach((h) => yaz(' - ' + h)); }
yaz(`\nPütür kapısı: ${gecen}/${gecen + kalan} geçti${kalan ? ' — KALDI' : ''}`);
process.exit(kalan ? 1 : 0);
