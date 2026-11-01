// Izgara/hizalama kapısı (tur 2): tüm Kids sayfaları + tarif detayı örnekleri × 1440 · 1024 · 768 · 390.
// Ölçülenler:
//  · yarım son satır: eşit sütunlu kart ızgarasının son satırında boş yuva (yatay kaydırma şeritleri muaf;
//    son satır ortalanmışsa geçerli)
//  · satır hizası: aynı ızgaranın aynı satırındaki kartlarda başlık / meta / CTA üst kenarı ve kart alt kenarı farkı ≤ 2px
//  · footer: tepesine kaydırınca elementFromPoint footer döner, tepe ve telif satırı tam görünür, üstünü içerik örtmez,
//    son bölümle arasında boş şerit yok
//  · öneri şeridi ([data-izgara-oneri]): açık tarif listede yok, satır tam (masaüstü 4, tablet 2'nin katı, mobil kaydırma)
// Sekmeler ([role=tab]), kapalı <details> ve aria-pressed süzgeçleri de açılarak ölçülür. Yüzen yardım düğmesi/menüsü (`.kd-yardim*`, `[data-kd-yardim]`, V2'de Pütür'ün yerine) ölçüm dışıdır.
// Bilinçli istisna: öğeye data-izgara-serbest="gerekçe" konur; bu öğe ölçülmez ama sayılır ve raporda yazılır.
// Hedefli ölçüm için kartın parçasına data-izgara-rol="baslik|meta|cta" konabilir.
// Kullanım: node araclar/izgara-kapisi.mjs [sayfa...]   (TABAN=… canlıda, GENISLIK=1440,390 alt küme)
//           BOZ=1 kapının kırmızı verebildiğini gösterir: Güvenli Kesim listesine yarım satır, tarif şeridine açık tarif ekler
import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'node:fs';

const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GENISLIK = (process.env.GENISLIK || '1440,1024,768,390').split(',').map(Number);
const TOL_PX = 2;

const tarifler = JSON.parse(readFileSync('veri/kids-tarifler.json', 'utf8')).tarifler || [];
const ornekTarif = ['6-8-ay', '9-12-ay', '1-3-yas'].flatMap((e) => {
  const l = tarifler.filter((t) => t.evre === e);
  return [l[0], l[l.length - 1]].filter(Boolean).map((t) => t.slug);
});
const varsayilan = [
  ...readdirSync('.').filter((f) => /^kids.*\.html$/.test(f) && !f.startsWith('kids__')),
  ...[...new Set(['sebzeli-bebek-omleti', ...ornekTarif])].map((s) => `kids-tarif.html?t=${s}`),
  'kids-tarifler.html?yas=6', 'kids-tarifler.html?yas=9', 'kids-tarifler.html?yas=18', 'kids-mevsim.html?ay=1', 'kids-mevsim.html?ay=7',
];
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : varsayilan;

/* tarayıcı içi ölçüm: tek görünüm (o anda açık sekmeler) */
function olcum(TOL) {
  const out = { yarim: [], hiza: [], serbest: [], oneri: [], izgara: 0 };
  const gorunur = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.display !== 'none' && c.visibility !== 'hidden'; };
  const ad = (e) => (e.id ? '#' + e.id : '.' + String(e.className).trim().split(/\s+/).slice(0, 2).join('.'));
  const px = (s) => parseFloat(s) || 0;
  document.querySelectorAll('[data-izgara-serbest]').forEach((e) => { if (gorunur(e)) out.serbest.push(`${ad(e)}: ${e.getAttribute('data-izgara-serbest')}`); });
  const adaylar = [...document.querySelectorAll('.kd-sayfa *')].filter((e) => {
    if (e.closest('svg') || e.closest('[class*="kd-yardim"], [data-kd-yardim], [class*="kd-pt"]') || e.closest('[data-izgara-serbest]') || !gorunur(e)) return false;
    const c = getComputedStyle(e);
    return c.display === 'grid' || c.display === 'inline-grid' || (c.display === 'flex' && c.flexWrap === 'wrap');
  });
  for (const g of adaylar) {
    const c = getComputedStyle(g);
    const flex = c.display === 'flex';
    const cocuk = [...g.children].filter((k) => { const p = getComputedStyle(k).position; return gorunur(k) && p !== 'absolute' && p !== 'fixed' && !String(k.className).includes('kd-gizli'); });
    if (!cocuk.length) continue;
    // yatay kaydırma şeridi: satır kuralından muaf
    const kaydir = /(auto|scroll)/.test(c.overflowX) && (c.gridAutoFlow.startsWith('column') || flex || g.scrollWidth > g.clientWidth + 1);
    if (kaydir) continue;
    let sutun, izGen;
    if (flex) {
      // yalnız eşit genişlikli, kart boyutlu öğeler taşıyan sarmalı flex (chip dizileri değil)
      if (cocuk.length < 3) continue;
      const gen = cocuk.map((k) => k.getBoundingClientRect().width);
      if (Math.max(...gen) - Math.min(...gen) > 1.5 || gen[0] < 120) continue;
      izGen = gen[0];
      sutun = cocuk.filter((k) => Math.abs(k.getBoundingClientRect().top - cocuk[0].getBoundingClientRect().top) < 4).length;
    } else {
      const iz = c.gridTemplateColumns.split(/\s+/).map(parseFloat).filter((n) => !Number.isNaN(n) && n > 0);
      if (iz.length < 2) continue;
      if (Math.max(...iz) - Math.min(...iz) > 1.5) continue;   // eşit olmayan sütun = düzen ızgarası, kart ızgarası değil
      sutun = iz.length; izGen = iz[0];
    }
    const kutu = g.getBoundingClientRect();
    const solK = kutu.left + px(c.paddingLeft) + px(c.borderLeftWidth), sagK = kutu.right - px(c.paddingRight) - px(c.borderRightWidth);
    // satırlara ayır
    const satirlar = [];
    cocuk.map((k) => ({ k, r: k.getBoundingClientRect() })).sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left).forEach((o) => {
      const s = satirlar.find((x) => o.r.top < x[0].r.bottom - 1);   // dikey ortalı öğeler de aynı satır sayılır
      if (s) s.push(o); else satirlar.push([o]);
    });
    out.izgara++;
    // yarım son satır
    const son = satirlar[satirlar.length - 1];
    const bas = Math.min(...son.map((x) => x.r.left)), bit = Math.max(...son.map((x) => x.r.right));
    const bosSol = bas - solK, bosSag = sagK - bit;
    if (bosSag > izGen / 2 && Math.abs(bosSol - bosSag) > 4) out.yarim.push(`${ad(g)}: ${sutun} sütun, ${cocuk.length} öğe, son satırda ${son.length}`);
    // satır hizası
    const rol = (k, ad_) => {
      const acik = k.querySelector(`[data-izgara-rol="${ad_}"]`); if (acik) return acik;
      const hepsi = {
        baslik: 'h2,h3,h4,h5,.kd-baslik',
        meta: '.kd-tarif__meta',
        cta: '.kd-kart__alt,.kd-evre__git,.kd-btn,.kd-bag',
      }[ad_];
      const l = [...k.querySelectorAll(hepsi)].filter((e) => gorunur(e) && !(ad_ === 'cta' && e.closest('p')));   // metin içi bağ CTA değil
      return ad_ === 'cta' ? l[l.length - 1] : l[0];
    };
    for (const s of satirlar) {
      if (s.length < 2) continue;
      // kart = kendi zemini ya da gölgesi olan öğe; düz düzen ızgaralarında (foto + metin) boy eşitliği aranmaz
      const yuzey = (k) => { const q = getComputedStyle(k); return q.boxShadow !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(q.backgroundColor); };
      if (s.every((x) => yuzey(x.k) && x.r.height >= 56)) {   // sekme içi rozet/ikon gibi küçük öğeler kart değil
        const alt = s.map((x) => x.r.bottom);
        if (Math.max(...alt) - Math.min(...alt) > TOL) out.hiza.push(`${ad(g)} kart altı Δ${Math.round(Math.max(...alt) - Math.min(...alt))}px`);
      }
      // dilim: aynı yapıdaki kartlarda k. iç öğenin üst kenarı (etiket, başlık, açıklama sırası kaymasın)
      const yapi = s.filter((x) => !x.k.classList.contains('kd-cta-kart')).map((x) => {
        const ic = x.k.querySelector(':scope > .kd-kart__govde') || x.k;
        return [...ic.children].filter((c) => gorunur(c) && !['absolute', 'fixed'].includes(getComputedStyle(c).position));
      });
      if (yapi.length >= 2 && yapi.every((l) => l.length === yapi[0].length && l.every((c, i) => c.tagName === yapi[0][i].tagName))) {
        for (let i = 0; i < yapi[0].length; i++) {
          const y = yapi.map((l) => l[i].getBoundingClientRect().top);
          if (Math.max(...y) - Math.min(...y) > TOL) { out.hiza.push(`${ad(g)} ${i + 1}. dilim Δ${Math.round(Math.max(...y) - Math.min(...y))}px`); break; }
        }
      }
      for (const r of ['baslik', 'meta', 'cta']) {
        // .kd-cta-kart: ızgaranın son yuvasını dolduran yönlendirme kartı; görsel/etiket satırı yoktur, boyu (yukarıda) ölçülür
        const y = s.filter((x) => !x.k.classList.contains('kd-cta-kart')).map((x) => rol(x.k, r)).filter(Boolean).map((e) => e.getBoundingClientRect().top);
        if (y.length >= 2 && Math.max(...y) - Math.min(...y) > TOL) out.hiza.push(`${ad(g)} ${r} Δ${Math.round(Math.max(...y) - Math.min(...y))}px`);
      }
    }
  }
  // öneri şeridi
  const acik = new URLSearchParams(location.search).get('t');
  document.querySelectorAll('[data-izgara-oneri]').forEach((s) => {
    if (!gorunur(s)) return;
    const kart = [...s.children].filter(gorunur);
    const bag = kart.map((k) => k.getAttribute('href') || '');
    const c = getComputedStyle(s);
    if (acik && bag.some((h) => h.includes(`t=${encodeURIComponent(acik)}`) && !h.includes(`t=${encodeURIComponent(acik)}x`))) out.oneri.push(`açık tarif listede: ${acik}`);
    const kaydir = /(auto|scroll)/.test(c.overflowX);
    let sutunSay = 4;   // masaüstü ve mobil şerit 4 kart; 3 sütunlu görünümde 3 kart satırı tamdır
    if (!kaydir) {
      // yuva sayımı: geniş kart (span N) N yuva, 6 izli üç sütun düzeninde her kart 2 iz tutar
      const iz = c.gridTemplateColumns.split(/\s+/).length;
      const yuva = kart.reduce((t, k) => { const q = getComputedStyle(k); return t + (parseInt(((q.gridColumnStart + ' ' + q.gridColumnEnd).match(/span (\d+)/) || [])[1], 10) || 1); }, 0);
      if (yuva % iz) out.oneri.push(`${kart.length} kart ${iz} sütuna tam oturmuyor`);
      sutunSay = iz === 6 ? 3 : iz;
    }
    if (kart.length < Math.min(4, sutunSay) && !s.hasAttribute('data-izgara-az')) out.oneri.push(`yalnız ${kart.length} öneri`);
  });
  return out;
}

const tekil = (l) => [...new Set(l)];
const tarayici = await chromium.launch();
let hata = 0, sayac = 0, izgaraTop = 0;
const serbestler = new Set();

for (const w of GENISLIK) {
  const bag = await tarayici.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1 });
  for (const s of SAYFALAR) {
    const sayfa = await bag.newPage();
    await sayfa.goto(TABAN + s, { waitUntil: 'networkidle' });
    await sayfa.addStyleTag({ content: `*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important} .kd-gir{opacity:1!important;transform:none!important}` });
    if (process.env.BOZ) await sayfa.evaluate(() => {
      const g = document.querySelector('.kd-kbogulma__liste'); if (g) g.lastElementChild?.remove();
      const o = document.querySelector('.kd-detay:not([hidden]) [data-izgara-oneri]');
      if (o) { const k = o.firstElementChild.cloneNode(true); k.setAttribute('href', `kids-tarif.html?t=${new URLSearchParams(location.search).get('t')}`); o.appendChild(k); }
    });
    await sayfa.waitForTimeout(200);
    const r = { yarim: [], hiza: [], oneri: [] };
    const birlestir = (x) => { r.yarim.push(...x.yarim); r.hiza.push(...x.hiza); r.oneri.push(...x.oneri); x.serbest.forEach((q) => serbestler.add(`${s}: ${q}`)); izgaraTop += x.izgara; };
    birlestir(await sayfa.evaluate(olcum, TOL_PX));
    // tüm sekmeler + kapalı ayrıntılar
    const sekme = await sayfa.evaluate(() => [...document.querySelectorAll('.kd-sayfa [role="tab"]')].map((b, i) => { b.setAttribute('data-izgara-i', i); return i; }));
    for (const i of sekme) {
      const loc = sayfa.locator(`[data-izgara-i="${i}"]`);
      if (!(await loc.isVisible().catch(() => false))) continue;
      await loc.evaluate((b) => b.click());
      await sayfa.waitForTimeout(60);
      birlestir(await sayfa.evaluate(olcum, TOL_PX));
    }
    await sayfa.evaluate(() => document.querySelectorAll('.kd-sayfa details').forEach((d) => { d.open = true; }));
    await sayfa.waitForTimeout(60);
    birlestir(await sayfa.evaluate(olcum, TOL_PX));
    // süzgeçler: görünür aria-pressed düğmeleri tek tek açılıp kapanır (kart sayısı değişince yarım satır kalmasın)
    if (!s.startsWith('kids-arac')) {
      const dugme = await sayfa.evaluate(() => [...document.querySelectorAll('.kd-sayfa button[aria-pressed]')].filter((b) => !b.closest('.kd-tema-sec') && !b.closest('[class*="kd-yardim"], [data-kd-yardim], [class*="kd-pt"]') && b.getBoundingClientRect().width > 0).map((b, i) => { b.setAttribute('data-izgara-f', i); return i; }));
      for (const i of dugme) {
        await sayfa.evaluate((n) => document.querySelector(`[data-izgara-f="${n}"]`).click(), i);
        await sayfa.waitForTimeout(40);
        birlestir(await sayfa.evaluate(olcum, TOL_PX));
        await sayfa.evaluate((n) => document.querySelector(`[data-izgara-f="${n}"]`).click(), i);
      }
    }
    // footer: tepesine kaydır, sonra sona
    const footer = await sayfa.evaluate(async () => {
      const bekle = (ms) => new Promise((t) => setTimeout(t, ms));
      const f = document.querySelector('footer.footer'); if (!f) return ['footer yok'];
      const sorun = [];
      const headerAlt = () => { const h = document.querySelector('header.header'); if (!h) return 0; const b = h.getBoundingClientRect(); return b.bottom > 0 && getComputedStyle(h).visibility !== 'hidden' ? b.bottom : 0; };
      const icinde = (e) => !!e && (e === f || f.contains(e));
      const yukle = async (y) => { scrollTo(0, y); await bekle(120); };
      // perde footer (Gastro altbilgi-perde, ≥641px'te position:fixed): footer'ın tepesi, sayfa sonunda ana içeriğin
      // altından açılan yerdir → sona kaydırıp açılan kenarı ölç. Akıştaki footer: tepesinin 200px üstüne kaydır.
      const perde = getComputedStyle(f).position === 'fixed';
      const tepeY = f.getBoundingClientRect().top + scrollY;
      await yukle(perde ? document.documentElement.scrollHeight : Math.max(0, tepeY - 200));
      if (perde) await bekle(200);
      let fr = f.getBoundingClientRect();
      if (perde) { const m = document.querySelector('.page-main')?.getBoundingClientRect(); const acik = m ? Math.max(fr.top, m.bottom) : fr.top; fr = { top: acik, bottom: fr.bottom }; }
      // tepe: footer'ın üst kenarı pencerede ise üstünde içerik yok
      for (const x of [.08, .5, .92]) {
        const px_ = innerWidth * x, py = Math.min(innerHeight - 2, Math.max(headerAlt() + 2, fr.top + 6));
        const e = document.elementFromPoint(px_, py);
        if (fr.top < innerHeight - 8 && e && !icinde(e) && !e.closest('[class*="kd-yardim"], [data-kd-yardim], [class*="kd-pt"]') && !e.closest('.bottom-nav') && fr.top >= 0 && py >= fr.top) sorun.push(`tepe örtülü (${e.tagName}.${String(e.className).slice(0, 24)})`);
      }
      // telif satırı: sonuna kaydır
      await yukle(document.documentElement.scrollHeight);
      await bekle(200);
      fr = f.getBoundingClientRect();
      const t = f.querySelector('.fb-left');
      if (!t) sorun.push('telif satırı yok');
      else {
        const b = t.getBoundingClientRect();
        if (b.top < 0 || b.bottom > innerHeight + 1) sorun.push(`telif pencere dışı (${Math.round(b.top)}-${Math.round(b.bottom)})`);
        const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (!icinde(e) && !(e && e.closest('[class*="kd-yardim"], [data-kd-yardim], [class*="kd-pt"]'))) sorun.push(`telif örtülü (${e ? e.tagName + '.' + String(e.className).slice(0, 24) : 'yok'})`);
      }
      if (fr.bottom < innerHeight - 1) sorun.push(`footer altında boşluk ${Math.round(innerHeight - fr.bottom)}px`);
      const sayfaAlt = document.querySelector('.kd-sayfa')?.getBoundingClientRect().bottom;
      if (sayfaAlt && fr.top - sayfaAlt > 2) sorun.push(`son bölümle footer arasında ${Math.round(fr.top - sayfaAlt)}px boşluk`);
      // tepe ile içerik çakışmıyor: ana içerik footer'ın tepesini kapatmıyor (akışta da perdede de)
      const ana = document.querySelector('.page-main');
      if (ana) { const m = ana.getBoundingClientRect(); if (m.bottom > fr.top + 2) sorun.push(`ana içerik footer tepesini ${Math.round(m.bottom - fr.top)}px örtüyor`); }
      return sorun;
    });
    const sorun = [];
    const yarim = tekil(r.yarim), hiza = tekil(r.hiza), oneri = tekil(r.oneri);
    if (yarim.length) sorun.push(`yarım satır ${yarim.length} (${yarim.slice(0, 3).join(' | ')})`);
    if (hiza.length) sorun.push(`hiza ${hiza.length} (${hiza.slice(0, 4).join(' | ')})`);
    if (oneri.length) sorun.push(`öneri ${oneri.length} (${oneri.slice(0, 2).join(' | ')})`);
    if (footer.length) sorun.push(`footer (${footer.join(' | ')})`);
    sayac++;
    if (sorun.length) hata++;
    console.log(`${sorun.length ? '✗' : '✓'} ${String(w).padEnd(4)} ${s}${sorun.length ? '  ' + sorun.join(' · ') : ''}`);
    await sayfa.close();
  }
  await bag.close();
}
await tarayici.close();
if (serbestler.size) {
  console.log(`\nBilinçli istisna (data-izgara-serbest) ${serbestler.size}:`);
  [...serbestler].forEach((x) => console.log('  ·', x));
}
console.log(`\n${izgaraTop} ızgara görünümü · istisna ${serbestler.size} · ${sayac - hata}/${sayac} ölçüm yeşil`);
process.exit(hata ? 1 : 0);
