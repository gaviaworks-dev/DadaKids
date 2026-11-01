// Denge kapısı (Beyar EK): yan yana kartlar eşit yükseklikte ve içerikle dengeli.
// Ölçülenler (1440 · 1024):
//  · kart = görünür, kendi zemini / çerçevesi / gölgesi olan, ≥120px genişlik ve ≥56px yükseklik kutu (düğme, form öğesi, görsel değil)
//  · kardeş = aynı grid/flex ebeveyninin doğrudan çocukları (display:contents sarmalayıcı açılır); aynı satır = üst kenarı ±2px, yatayda örtüşmeyen
//  · yükseklik: aynı satırdaki kartların yükseklik farkı ≤1px
//    mozaik (bir kart iki satır kaplıyor, kısa kartın altında aynı ebeveynden başka kart var) boy ölçümünden muaf
//  · boşluk: kartın en büyük boş dikey bandı (içerik arası ya da son içerik → alt kenar; margin-top:auto ile itilmiş CTA'nın üstü de sayılır)
//    kardeşler arasında ≤24px fark → "boşluk BÜYÜTMEYLE değil İÇERİKLE doldurulmuş mu"
//  · CTA: kart içi son CTA'nın (.kd-bag, .kd-btn, .kd-kart__alt, .kd-evre__git, [data-denge-cta]; paragraf/liste içi bağ değil) alt kenarı ≤2px aynı
//  Boşluk ve CTA yalnız iki/üç kolonlu kart çiftlerinde/satırlarında ölçülür. Veri listesi muaf (yalnız boy ölçülür):
//  kartlar <li> (ul/ol veri listesi) ya da ebeveynde >3 kart ve içerik kartları aynı bileşen (besin, ürün, modül kartları).
//  Gerekçe: izgara-kapisi "dilim" kuralı aynı yapıdaki kartların iç satırlarını üstten hizalı tutar; veriden gelen kısa metnin
//  artığı kartın altında kalır, doldurmak öğe başına içerik uydurmak olur. .kd-cta-kart (ızgaranın son yuvasındaki ortalı
//  yönlendirme kartı) yalnız boyla ölçülür. Alt ızgaralı (subgrid, .kd-hizali) satırlar da dilim hizası nedeniyle muaf.
// 390: kartlar alt alta; yalnız yatay taşma ölçülür.
// kids.html: yaş çubuğunun her seçeneği (varsayılan/seçimsiz + her radyo tıklanarak) ayrı ölçülür. Sekmeler ([role=tab]) de açılır.
// Bilinçli istisna: ebeveyne ya da karta data-denge-serbest="gerekçe" (boyut kapısındaki gibi; ör. yapışkan yan panel).
// Kullanım: node araclar/denge-kapisi.mjs [sayfa...]   (TABAN=… · GENISLIK=1440,1024,390 alt küme · AYRINTI=1 tüm satırları yazar)
//           BOZ=1 kapının kırmızı verebildiğini gösterir: hub vitrinindeki besin kartının içeriğini yarıya indirir (CTA kalır; kids.html ile koşun)
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';

const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GENISLIK = (process.env.GENISLIK || '1440,1024,390').split(',').map(Number);
const ESIK = { boy: 1, bosluk: 24, cta: 2, ust: 2 };
const varsayilan = [...readdirSync('.').filter((f) => /^kids.*\.html$/.test(f) && !f.startsWith('kids__')), 'kids-tarif.html?t=balkabagi-puresi'];
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : varsayilan;

/* tarayıcı içi ölçüm: o anki görünüm */
function olcum(ESIK) {
  const out = { satir: [], sorun: [] };
  const gorunur = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.display !== 'none' && c.visibility !== 'hidden' && c.opacity !== '0'; };
  const ad = (e) => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className).trim().split(/\s+/).slice(0, 2).join('.'));
  const seffaf = (c) => !c || c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c);
  const yuzey = (e) => {
    const q = getComputedStyle(e);
    const cerceve = ['Top', 'Right', 'Bottom', 'Left'].some((k) => parseFloat(q[`border${k}Width`]) > 0 && !seffaf(q[`border${k}Color`]) && q[`border${k}Style`] !== 'none');
    return !seffaf(q.backgroundColor) || q.backgroundImage !== 'none' || q.boxShadow !== 'none' || cerceve;
  };
  const KART_DEGIL = 'button,input,select,textarea,label,summary,img,svg,picture,video,canvas,iframe,.kd-btn,.kd-bag,[role=tab],[role=radio]';
  const kartMi = (e) => {
    if (!gorunur(e) || e.matches(KART_DEGIL)) return false;
    const p = getComputedStyle(e).position; if (p === 'absolute' || p === 'fixed') return false;
    const r = e.getBoundingClientRect(); return r.width >= 120 && r.height >= 56 && yuzey(e);
  };
  // display:contents sarmalayıcıyı aç; yüzeysiz tek-çocuklu sarmalayıcıda (sütun div'i) içteki tek kart esas alınır
  const cocuklar = (g) => [...g.children].flatMap((k) => (getComputedStyle(k).display === 'contents' ? cocuklar(k) : [k]));
  const temsil = (k) => {
    if (kartMi(k)) return k;
    if (!gorunur(k) || yuzey(k)) return null;
    const ic = cocuklar(k).filter(gorunur); return ic.length === 1 && kartMi(ic[0]) ? ic[0] : null;
  };
  // kartın en büyük boş dikey bandı: metin satırları, medya, form öğeleri ve zeminli iç öğeler "dolu" sayılır
  const enBuyukBosluk = (kart) => {
    const kb = kart.getBoundingClientRect(), q = getComputedStyle(kart);
    const ust = kb.top + parseFloat(q.paddingTop) + parseFloat(q.borderTopWidth), alt = kb.bottom - parseFloat(q.paddingBottom) - parseFloat(q.borderBottomWidth);
    const aralik = [];
    const ekle = (r) => { if (r.height > 0 && r.width > 0 && r.bottom > ust && r.top < alt) aralik.push([Math.max(ust, r.top), Math.min(alt, r.bottom)]); };
    const yuru = (e) => {
      for (const n of e.childNodes) {
        if (n.nodeType === 3) { if (n.textContent.trim()) { const rg = document.createRange(); rg.selectNodeContents(n); [...rg.getClientRects()].forEach(ekle); } continue; }
        if (n.nodeType !== 1) continue;
        const s = getComputedStyle(n); if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed') continue;
        if (n.closest('details:not([open])') && !n.closest('summary') && n.tagName !== 'SUMMARY' && n.tagName !== 'DETAILS') continue;
        if (n.matches('img,svg,picture,video,canvas,iframe,input,select,textarea,button,hr') || (yuzey(n) && n.getBoundingClientRect().height < 400)) { ekle(n.getBoundingClientRect()); if (!n.matches('svg')) yuru(n); continue; }
        yuru(n);
      }
    };
    yuru(kart);
    aralik.sort((a, b) => a[0] - b[0]);
    let imlec = ust, enb = 0, son = ust;
    for (const [a, b] of aralik) { if (a > imlec) enb = Math.max(enb, a - imlec); imlec = Math.max(imlec, b); son = Math.max(son, b); }
    enb = Math.max(enb, alt - imlec);
    return { bant: Math.round(enb), alt: Math.round(alt - son) };
  };
  const cta = (kart) => {
    const l = [...kart.querySelectorAll('.kd-bag,.kd-btn,.kd-kart__alt,.kd-evre__git,[data-denge-cta]')].filter((e) => gorunur(e) && !e.closest('p') && !e.closest('li'));
    return l[l.length - 1] || null;
  };
  const ebeveynler = [...document.querySelectorAll('.kd-sayfa *')].filter((e) => {
    if (e.closest('svg') || e.closest('[class*="kd-yardim"], [data-kd-yardim], [class*="kd-pt"]') || e.closest('[data-denge-serbest]') || !gorunur(e)) return false;
    const d = getComputedStyle(e).display; return d === 'grid' || d === 'inline-grid' || d === 'flex' || d === 'inline-flex';
  });
  for (const g of ebeveynler) {
    const kartlar = cocuklar(g).map(temsil).filter((k) => k && !k.hasAttribute('data-denge-serbest'));
    if (kartlar.length < 2) continue;
    const imza = (k) => k.tagName + '.' + [...k.classList].filter((c) => !/^kd-(gir|gorundu|acik)$/.test(c)).sort().join('.');
    const icerikKart = kartlar.filter((k) => !k.classList.contains('kd-cta-kart'));
    const listeIzgarasi = icerikKart.every((k) => k.tagName === 'LI')
      || (kartlar.length > 3 && icerikKart.every((k) => imza(k) === imza(icerikKart[0])))
      || icerikKart.some((k) => getComputedStyle(k).gridTemplateRows.startsWith('subgrid'));
    const satirlar = [];
    kartlar.map((k) => ({ k, r: k.getBoundingClientRect() })).sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left).forEach((o) => {
      const s = satirlar.find((x) => Math.abs(x[0].r.top - o.r.top) <= ESIK.ust && x.every((y) => o.r.left >= y.r.right - 1 || o.r.right <= y.r.left + 1));
      if (s) s.push(o); else satirlar.push([o]);
    });
    for (const s of satirlar) {
      if (s.length < 2) continue;
      const boy = s.map((x) => Math.round(x.r.height));
      const enAlt = Math.max(...s.map((x) => x.r.bottom));
      const mozaik = kartlar.some((k) => { if (s.some((x) => x.k === k)) return false; const r = k.getBoundingClientRect(); return r.top > s[0].r.top + ESIK.ust && r.top < enAlt - 1; });
      const ic = s.filter((x) => !x.k.classList.contains('kd-cta-kart'));
      const olc = !listeIzgarasi && ic.length >= 2;
      const bos = ic.map((x) => enBuyukBosluk(x.k));
      const c = ic.map((x) => cta(x.k)).filter(Boolean).map((e) => e.getBoundingClientRect().bottom);
      const dBoy = mozaik ? 0 : Math.max(...s.map((x) => x.r.height)) - Math.min(...s.map((x) => x.r.height));
      const dBos = olc ? Math.max(...bos.map((b) => b.bant)) - Math.min(...bos.map((b) => b.bant)) : 0;
      const dCta = olc && c.length >= 2 ? Math.max(...c) - Math.min(...c) : 0;
      const kayit = `${ad(g)}${listeIzgarasi ? ' (liste)' : ''}${mozaik ? ' (mozaik)' : ''} [${s.map((x) => ad(x.k)).join(' | ')}] boy ${boy.join('/')} · bant ${bos.map((b) => b.bant).join('/')} · alt ${bos.map((b) => b.alt).join('/')}${c.length >= 2 ? ` · cta Δ${Math.round(Math.max(...c) - Math.min(...c))}` : ''}`;
      out.satir.push(kayit);
      const neden = [];
      if (dBoy > ESIK.boy) neden.push(`boy Δ${Math.round(dBoy)}`);
      if (dBos > ESIK.bosluk) neden.push(`boşluk Δ${dBos}`);
      if (dCta > ESIK.cta) neden.push(`cta Δ${Math.round(dCta)}`);
      if (neden.length) out.sorun.push(`${neden.join(', ')} :: ${kayit}`);
    }
  }
  return out;
}

const tarayici = await chromium.launch();
let hata = 0, sayac = 0, satirTop = 0;
const tekil = (l) => [...new Set(l)];

for (const w of GENISLIK) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  for (const s of SAYFALAR) {
    const sayfa = await bag.newPage();
    await sayfa.goto(TABAN + s, { waitUntil: 'networkidle' });
    await sayfa.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important} .kd-gir{opacity:1!important;transform:none!important}' });
    await sayfa.waitForTimeout(150);
    const sorun = [];
    if (w < 900) {
      const tasma = await sayfa.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (tasma > 1) sorun.push(`yatay taşma ${tasma}px`);
    } else {
      if (process.env.BOZ) await sayfa.evaluate(() => {
        const k = ['.kd-hub-besin:not([hidden])', '.kd-dpanel', '.kd-hub-kutu'].map((q) => [...document.querySelectorAll('.kd-sayfa ' + q)].find((e) => e.getBoundingClientRect().height > 0)).find(Boolean);
        if (k) { const l = [...k.children]; l.slice(Math.ceil(l.length / 2), -1).forEach((x) => x.remove()); }
      });
      const durumlar = [['', null]];
      const radyo = s.startsWith('kids.html') ? await sayfa.evaluate(() => [...document.querySelectorAll('[data-kd-donem] input[type=radio]')].map((r) => r.value)) : [];
      radyo.forEach((v) => durumlar.push([`evre=${v}`, v]));
      const r = [];
      for (const [etiket, v] of durumlar) {
        if (v) { await sayfa.evaluate((x) => { const i = document.querySelector(`[data-kd-donem] input[value="${x}"]`); i.click(); }, v); await sayfa.waitForTimeout(120); }
        const x = await sayfa.evaluate(olcum, ESIK);
        satirTop += x.satir.length;
        if (process.env.AYRINTI) x.satir.forEach((q) => console.log(`   · ${w} ${s}${etiket ? ' ' + etiket : ''} ${q}`));
        x.sorun.forEach((q) => r.push(`${etiket ? etiket + ' ' : ''}${q}`));
      }
      // sekmeler
      const sekme = await sayfa.evaluate(() => [...document.querySelectorAll('.kd-sayfa [role="tab"]')].map((b, i) => { b.setAttribute('data-denge-i', i); return i; }));
      for (const i of sekme) {
        const loc = sayfa.locator(`[data-denge-i="${i}"]`);
        if (!(await loc.isVisible().catch(() => false))) continue;
        await loc.evaluate((b) => b.click()); await sayfa.waitForTimeout(60);
        const x = await sayfa.evaluate(olcum, ESIK);
        satirTop += x.satir.length;
        x.sorun.forEach((q) => r.push(`sekme ${i}: ${q}`));
      }
      sorun.push(...tekil(r));
    }
    sayac++; if (sorun.length) hata++;
    console.log(`${sorun.length ? '✗' : '✓'} ${String(w).padEnd(4)} ${s}`);
    sorun.forEach((q) => console.log('     ' + q));
    await sayfa.close();
  }
  await bag.close();
}
await tarayici.close();
console.log(`\n${satirTop} kart satırı ölçüldü · ${sayac - hata}/${sayac} ölçüm yeşil`);
process.exit(hata ? 1 : 0);
