// Ek revize kapısı (Beyar "Ek revize", 2026-11-01). Playwright Chromium. v2-kapisi.mjs (a–j) ile birlikte koşulur.
//  k segment kontrolü (evre sayfaları): kapsayıcı tam genişlik (±2px), eşit sekme genişliği (±2px), içerik ortalı (±3px);
//    etiketler: hamilelik "Rahatça / Dikkat / Kaçınılır", bebek evreleri "Uygun hazırlık / Dikkat / Henüz erken"
//  l akordeon yok (evre sayfaları): kartlarda details/summary, aria-expanded düğme, ok ikonu yok; içerik görünür; aynı satırdaki kartlar eşit yükseklik (±2px)
//  m ikonlu kart hizası: .kd-ikonlu + Güvenli Kesim "Asla bütün vermeyin" / "Bebeğinizi hazırlarken" + Dönemler kartları:
//    ikon ve başlık aynı satırda (dikey merkez ±6px), açıklamanın sol x'i = ikon sol x ±2px; "Neden?" / "Yerine:" kutuları aynı sol x
//  n footer perde: sona kaydırınca Gastro footer'ı tamamen görünür, footer noktalarında elementFromPoint footer döner; mekanizma tarifler.html ile aynı
//  o "Bebek Tarifleri" (index.html, tarifler.html: mega, kategori, çekmece, süzgeç) tıklanınca kids-tarifler.html'e gider
//  p görünür "Tarif ekle / Tarifini paylaş / Tarif gönder" CTA'sı yok; tarif detayında yazar "Dada Gastro Kids Editörü"
//  q tema seçici Kids alt menüde en sağda (bar iç sağ kenarına ≤ 24px ya da Yardım'la aynı sağ grupta), menü kalemleri ortada
//    (sol grup ile sağ grup arasındaki boş alanın ortası ±24px; ≥ 1024px)
// Kullanım: node araclar/ek-kapisi.mjs   · TABAN=… · GENISLIK=1440,390 · SAYFA=kids-donem · HARF=kl · KOSUT=4
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';

const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GENISLIK = (process.env.GENISLIK || '1440,1024,768,390').split(',').map(Number);
const HARF = process.env.HARF || 'klmnopq';
const KOSUT = Number(process.env.KOSUT || 4);
const SUZ = (process.env.SAYFA || '').split(',').map((s) => s.trim()).filter(Boolean);
const sec = (s) => !SUZ.length || SUZ.some((x) => s.includes(x));
const KIDS = [...readdirSync('.').filter((f) => /^kids(-.+)?\.html$/.test(f)).sort(), 'kids-tarif.html?t=balkabagi-puresi'].filter(sec);
const EVRE = KIDS.filter((s) => /^kids-donem-.+\.html$/.test(s));
const sonuc = [];
const kaydet = (harf, w, sayfa, ayrinti) => sonuc.push({ harf, w, sayfa, ok: ayrinti.length === 0, ayrinti });
async function havuz(isler, n) { const k = [...isler]; await Promise.all(Array.from({ length: n }, async () => { while (k.length) await k.shift()(); })); }
const t = await chromium.launch();
const yeniBag = (w, ek = {}) => t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', ...ek });

/* ortak tarayıcı yardımcıları (her evaluate'e enjekte) */
const YARDIMCI = `
  window.__g = (e) => { if (!e || !e.isConnected) return false; const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; } return true; };
  window.__n = (s) => String(s || '').replace(/\\s+/g, ' ').trim();
  window.__ad = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '')).slice(0, 60);
  // içerik kutusu: metin düğümleri + görünür ikon/görsel birleşimi (sekme içeriği ortalı mı)
  // içerik kutusu: doğrudan görünür çocuk öğelerin kutuları (rozet zemini dahil; sr-only hariç) + metin + ikon
  window.__icerikKutu = (e) => { let k = window.__metinKutu(e); [...e.children].filter((x) => window.__g(x) && x.getBoundingClientRect().width > 2 && !x.matches('.kd-gizli, .sr-only')).forEach((x) => { const b = x.getBoundingClientRect(); k = k ? { left: Math.min(k.left, b.left), right: Math.max(k.right, b.right), top: Math.min(k.top, b.top), bottom: Math.max(k.bottom, b.bottom) } : { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; }); e.querySelectorAll('img, svg').forEach((x) => { if (!window.__g(x) || (x.closest('svg') && x.tagName.toLowerCase() !== 'svg')) return; const b = x.getBoundingClientRect(); k = k ? { left: Math.min(k.left, b.left), right: Math.max(k.right, b.right), top: Math.min(k.top, b.top), bottom: Math.max(k.bottom, b.bottom) } : { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; }); return k; };
  window.__metinKutu = (e) => { const r = document.createRange(); let k = null; const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (!n.textContent.trim() || !window.__g(n.parentElement) || n.parentElement.getBoundingClientRect().width <= 2 || n.parentElement.closest('.kd-gizli, .sr-only')) continue; r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (!b.width) continue; k = k ? { left: Math.min(k.left, b.left), right: Math.max(k.right, b.right), top: Math.min(k.top, b.top), bottom: Math.max(k.bottom, b.bottom) } : { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; } return k; };
`;
const hazirla = async (p) => { await p.addInitScript(YARDIMCI); };

/* ---------- k + l: evre sayfaları ---------- */
async function evre(p, w, s) {
  const k = [], l = [];
  // k · segment
  const seg = await p.evaluate(() => {
    const listeler = [...document.querySelectorAll('.kd-sayfa [role=tablist]')].filter(__g);
    const BEK = ['Rahatça', 'Dikkat', 'Kaçınılır'];
    const L = listeler.find((x) => { const t = [...x.querySelectorAll('[role=tab]')].map((b) => __n(b.textContent)); return t.some((y) => /^(Rahatça|Kaçınılır|Uygun|Henüz)/.test(y)); }) || listeler[0];
    if (!L) return { yok: true };
    const sek = [...L.querySelectorAll('[role=tab]')].filter(__g);
    const ad = sek.map((b) => __n((b.querySelector('[class*="__ad"]') || b).textContent));
    const kap = L.parentElement; const kc = getComputedStyle(kap); const kb = kap.getBoundingClientRect();
    const ic = kb.width - parseFloat(kc.paddingLeft) - parseFloat(kc.paddingRight) - parseFloat(kc.borderLeftWidth) - parseFloat(kc.borderRightWidth);
    const lb = L.getBoundingClientRect();
    const gen = sek.map((b) => b.getBoundingClientRect().width);
    const orta = sek.map((b) => { const bb = b.getBoundingClientRect(); const m = __icerikKutu(b); return m ? Math.round(((m.left + m.right) / 2 - (bb.left + bb.right) / 2) * 10) / 10 : null; });
    // yatay kayan şerit mi (mobilde taşma)?
    const tasar = L.scrollWidth > L.clientWidth + 1;
    return { ad, BEK, liste: Math.round(lb.width), kap: Math.round(ic), kapAd: __ad(kap), gen: gen.map(Math.round), orta, tasar };
  });
  if (seg.yok) k.push('segment kontrolü (role=tablist) yok');
  else {
    // etiketler (lead 2026-11-01): hamilelik "Rahatça / Dikkat / Kaçınılır"; bebek evreleri "Uygun hazırlık / Dikkat / Henüz erken"
    const BEK = /hamilelik/.test(s) ? ['Rahatça', 'Dikkat', 'Kaçınılır'] : ['Uygun hazırlık', 'Dikkat', 'Henüz erken'];
    if (seg.ad.length !== 3 || !BEK.every((b, i) => (seg.ad[i] || '').startsWith(b))) k.push(`sekme etiketleri [${seg.ad.join(' | ')}] ≠ [${BEK.join(' | ')}]`);
    if (Math.abs(seg.liste - seg.kap) > 2) k.push(`segment genişliği ${seg.liste} ≠ kapsayıcı (${seg.kapAd}) iç genişliği ${seg.kap}`);
    if (seg.gen.length && Math.max(...seg.gen) - Math.min(...seg.gen) > 2) k.push(`sekme genişlikleri eşit değil: ${seg.gen.join(' / ')}`);
    const kay = seg.orta.filter((x) => x === null || Math.abs(x) > 3); if (kay.length) k.push(`sekme metni ortalı değil (merkez farkı px): ${seg.orta.join(' / ')}`);
    if (seg.tasar) k.push('segment yatay taşıyor (kaydırma şeridi)');
  }
  // l · akordeon + eşit yükseklik: her sekmeyi aç, ölç
  const sekmeSay = await p.locator('.kd-sayfa [role=tablist] [role=tab]').count();
  const turlar = Math.max(1, Math.min(sekmeSay, 3));
  const birikim = new Set(), hizaSorun = new Set();
  for (let i = 0; i < turlar; i++) {
    if (sekmeSay) { await p.locator('.kd-sayfa [role=tablist] [role=tab]').nth(i).click(); await p.waitForTimeout(250); }
    const r = await p.evaluate(() => {
      const kartMi = (e) => typeof e.className === 'string' && e.className.split(/\s+/).some((c) => /kart|card/.test(c) && !c.includes('__') && !/kartlar|kart-?liste/.test(c));
      const kartlar = [...document.querySelectorAll('.kd-sayfa *')].filter((e) => kartMi(e) && __g(e) && !e.closest('[class*="kd-pt"], [class*="kd-yardim"], .kd-ust'));
      const ak = [];
      for (const c of kartlar) {
        const d = c.querySelector('details, summary'); if (d) ak.push(`${__ad(c)}: <${d.tagName.toLowerCase()}>`);
        const b = [...c.querySelectorAll('[aria-expanded]')].find(__g); if (b) ak.push(`${__ad(c)}: aria-expanded düğme ${__ad(b)}`);
        const o = [...c.querySelectorAll('.fa-chevron-down, .fa-chevron-up, .fa-angle-down, .fa-caret-down, .fa-plus, [class*="__ok"], [class*="ok-ikon"]')].find(__g); if (o) ak.push(`${__ad(c)}: ok ikonu ${__ad(o)}`);
        const gizli = [...c.querySelectorAll('[hidden]')].filter((h) => h.textContent.trim().length > 20); if (gizli.length) ak.push(`${__ad(c)}: gizli içerik ${__ad(gizli[0])}`);
      }
      // aynı satırdaki kart kardeşleri eşit yükseklik
      const hiza = [];
      const ebeveyn = new Set(kartlar.map((c) => c.parentElement));
      for (const pe of ebeveyn) {
        const kk = [...pe.children].filter((c) => kartlar.includes(c));
        const satir = new Map(); kk.forEach((c) => { const b = c.getBoundingClientRect(); const anahtar = [...satir.keys()].find((y) => Math.abs(y - b.top) < 4) ?? b.top; if (!satir.has(anahtar)) satir.set(anahtar, []); satir.get(anahtar).push(b.height); });
        for (const [, h] of satir) if (h.length > 1 && Math.max(...h) - Math.min(...h) > 2) { hiza.push(`${__ad(pe)} satır yükseklikleri ${h.map(Math.round).join('/')}`); break; }
      }
      return { ak, hiza };
    });
    r.ak.forEach((x) => birikim.add(x)); r.hiza.forEach((x) => hizaSorun.add(x));
  }
  if (birikim.size) l.push(`akordeon izi ${birikim.size}: ${[...birikim].slice(0, 3).join(' | ')}`);
  if (hizaSorun.size) l.push(`eşit yükseklik değil ${hizaSorun.size}: ${[...hizaSorun].slice(0, 3).join(' | ')}`);
  return { k, l };
}

/* ---------- m: ikonlu kart hizası ---------- */
const ikonluOlc = () => {
  const out = [], adaylar = new Set();
  document.querySelectorAll('.kd-ikonlu').forEach((e) => adaylar.add(e));
  const basliklar = [...document.querySelectorAll('.kd-sayfa h2, .kd-sayfa h3, .kd-sayfa h4')];
  for (const ad of ['Asla bütün vermeyin', 'Bebeğinizi hazırlarken']) {
    const h = basliklar.find((x) => __n(x.textContent) === ad); if (!h) continue;
    const bolum = h.closest('section') || h.parentElement;
    // başlığın bölümündeki kart listesi (li ya da kart sınıflı)
    bolum.querySelectorAll('li, [class*="kart"]').forEach((e) => { if (e.querySelector('h3, h4, b, strong') && e.querySelector('img, svg, i[class*="fa-"]')) adaylar.add(e); });
  }
  if (/kids-donemler\.html/.test(location.pathname)) document.querySelectorAll('.kd-devreler > *, .kd-evre').forEach((e) => adaylar.add(e));
  let n = 0;
  for (const c of adaylar) {
    if (!__g(c) || c.closest('[class*="kd-pt"]')) continue;
    // iç içe aday: dış öğe zaten listede ve iç öğe de varsa iç öğeyi ölç
    if ([...adaylar].some((x) => x !== c && c.contains(x) && __g(x))) continue;
    const ikon = [...c.querySelectorAll('img, svg, i[class*="fa-"], [class*="ikon"]')].find((x) => { if (!__g(x) || x.closest('a.kd-bag')) return false; const b = x.getBoundingClientRect(); return b.width >= 14 && b.height >= 14; });
    const bas = [...c.querySelectorAll('h2, h3, h4, b, strong, [class*="baslik"]')].find((x) => __g(x) && __n(x.textContent).length > 1 && !/^(Neden\?|Yerine:)$/.test(__n(x.textContent)) && !x.closest('p'));
    if (!ikon || !bas) continue;
    n++;
    const ib = ikon.getBoundingClientRect(), bb = __metinKutu(bas) || bas.getBoundingClientRect();
    const ad = __n(bas.textContent).slice(0, 26);
    const sorun = [];
    const dm = Math.abs((ib.top + ib.bottom) / 2 - (bb.top + bb.bottom) / 2);
    if (dm > 6) sorun.push(`ikon–başlık dikey merkez farkı ${Math.round(dm)}px`);
    const ps = [...c.querySelectorAll('p, [class*="aciklama"], [class*="__metin"]')].filter((x) => __g(x) && !x.contains(bas) && !bas.contains(x) && __n(x.textContent).length > 8);
    const aciklama = ps.find((x) => !/^(Neden\?|Yerine:)/.test(__n(x.textContent)));
    if (aciklama) { const ab = __metinKutu(aciklama) || aciklama.getBoundingClientRect(); const d = ab.left - ib.left; if (Math.abs(d) > 2) sorun.push(`açıklama sol x farkı ${Math.round(d)}px`); }
    for (const kutu of ps.filter((x) => /^(Neden\?|Yerine:)/.test(__n(x.textContent)))) { const kb = kutu.getBoundingClientRect(); const d = kb.left - ib.left; if (Math.abs(d) > 2) sorun.push(`"${__n(kutu.textContent).slice(0, 7)}" kutusu sol x farkı ${Math.round(d)}px`); }
    if (sorun.length) out.push(`${ad}: ${sorun.join(', ')}`);
  }
  return { n, out };
};

/* ---------- n: footer perde ---------- */
const perdeOlc = async () => {
  const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
  scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }); await bekle(400);
  scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }); await bekle(300);
  const f = document.querySelector('footer.footer'); if (!f) return { yok: true };
  const c = getComputedStyle(f), fb = f.getBoundingClientRect();
  const m = document.querySelector('.page-main'); const mc = m && getComputedStyle(m);
  const acik = Math.max(fb.top, m ? m.getBoundingClientRect().bottom : fb.top);
  const nok = [];
  for (const fx of [0.25, 0.5, 0.75]) for (const y of [acik + 8, (acik + Math.min(fb.bottom, innerHeight)) / 2, Math.min(fb.bottom, innerHeight) - 8]) {
    const e = document.elementFromPoint(innerWidth * fx, y);
    if (!e || f.contains(e)) continue;
    if (e.closest('.to-top, #toTop, .bottom-nav, #cookieBar, .cookie')) continue;   // Gastro'nun kendi yüzen öğeleri
    nok.push(`(${Math.round(innerWidth * fx)},${Math.round(y)}) → ${__ad(e)}`);
  }
  return { pos: c.position, ust: Math.round(fb.top), alt: Math.round(fb.bottom), acik: Math.round(acik), h: Math.round(fb.height), vh: innerHeight, mb: mc ? Math.round(parseFloat(mc.marginBottom)) : null, nok };
};

/* ---------- 1 · sayfa × genişlik ---------- */
const gastroPerde = {};
for (const w of GENISLIK) {
  const bag = await yeniBag(w);
  // Gastro tabanı: tarifler.html perde mekanizması
  if (HARF.includes('n')) { const p = await bag.newPage(); await hazirla(p); await p.goto(TABAN + 'tarifler.html', { waitUntil: 'networkidle' }); gastroPerde[w] = await p.evaluate(perdeOlc); await p.close(); }
  await havuz(KIDS.map((s) => async () => {
    const p = await bag.newPage(); await hazirla(p);
    const r = await p.goto(TABAN + s, { waitUntil: 'networkidle' }).catch(() => null);
    if (!r || r.status() >= 400) { for (const h of 'mnpq') if (HARF.includes(h)) kaydet(h, w, s, [`sayfa açılmadı (${r ? r.status() : 'hata'})`]); await p.close(); return; }
    await p.waitForTimeout(300);
    if (EVRE.includes(s) && /[kl]/.test(HARF)) { const e = await evre(p, w, s); if (HARF.includes('k')) kaydet('k', w, s, e.k); if (HARF.includes('l')) kaydet('l', w, s, e.l); await p.evaluate(() => scrollTo(0, 0)); }
    if (HARF.includes('m')) { const m = await p.evaluate(ikonluOlc); const zorunlu = /kids-(guvenli-kesim|donemler)\.html/.test(s); if (m.n || zorunlu) kaydet('m', w, s, [...(zorunlu && !m.n ? ['ölçülecek ikonlu kart bulunamadı'] : []), ...(m.out.length ? [`${m.out.length}/${m.n} kart hizasız: ${m.out.slice(0, 3).join(' | ')}`] : [])]); }
    if (HARF.includes('p')) {
      const r2 = await p.evaluate(() => {
        const cta = [...document.querySelectorAll('a, button, [role=button]')].filter((e) => __g(e) && /tarif(ini|inizi)?\s*(ekle|paylaş|gönder)/i.test(__n(e.textContent + ' ' + (e.getAttribute('aria-label') || '')))).map((e) => `${e.closest('header, #drawer, .bottom-nav, footer') ? 'Gastro kabuğu ' : ''}${__ad(e)} "${__n(e.textContent).slice(0, 24)}"`);
        const detay = /kids-tarif\.html/.test(location.pathname);
        const yazar = detay ? /Dada Gastro Kids Editörü/.test(document.body.innerText) : true;
        return { cta, yazar };
      });
      kaydet('p', w, s, [...(r2.cta.length ? [`tarif ekle/paylaş CTA ${r2.cta.length}: ${r2.cta.slice(0, 3).join(' | ')}`] : []), ...(r2.yazar ? [] : ['tarif detayında yazar "Dada Gastro Kids Editörü" yok'])]);
    }
    if (HARF.includes('q') && w >= 1024) {
      const q = await p.evaluate(() => {
        const ust = document.querySelector('.kd-ust'); if (!ust) return ['.kd-ust yok'];
        const s = [];
        const ts = [...ust.querySelectorAll('.kd-tema-sec, [class*="tema-sec"]')].find(__g);
        const yr = [...ust.querySelectorAll('.kd-yardim-ac, [aria-controls="kdYardim"]')].find(__g);
        const ic = ust.querySelector('.wrap') || ust; const ib = ic.getBoundingClientRect(); const cs = getComputedStyle(ic); const sag = ib.right - parseFloat(cs.paddingRight); const sol = ib.left + parseFloat(cs.paddingLeft);
        if (!ts) return ['tema seçici .kd-ust içinde yok'];
        const tb = ts.getBoundingClientRect();
        const ayniGrup = yr && ts.parentElement === yr.parentElement && ts.parentElement !== ust.querySelector('.kd-ust__menu');
        const grupSag = ayniGrup ? ts.parentElement.getBoundingClientRect().right : tb.right;
        if (sag - grupSag > 24) s.push(`tema seçici sağ kenara ${Math.round(sag - tb.right)}px uzak (≤ 24 ya da Yardım'la sağ grupta olmalı)`);
        const kalem = [...ust.querySelectorAll('a')].filter((a) => __g(a) && ['Tarifler', 'Dönemler', 'Güvenli Kesim', 'Mevsim Takvimi', 'Rehber', 'Araçlar'].includes(__n(a.textContent)));
        if (kalem.length) {
          const l = Math.min(...kalem.map((a) => a.getBoundingClientRect().left)), r = Math.max(...kalem.map((a) => a.getBoundingClientRect().right));
          // ortada = sol grup (logo/ev) ile sağ grup (tema seçici + Yardım) arasındaki boş alanın ortası (±24px)
          const kalemKap = kalem[0].parentElement;
          const solGrup = [...ust.querySelectorAll('a, button, [class*="logo"]')].filter((e) => __g(e) && !kalem.includes(e) && !kalemKap.contains(e) && e.getBoundingClientRect().right <= l + 1);
          const sagGrup = [ts, yr].filter(Boolean);
          const bosSol = solGrup.length ? Math.max(...solGrup.map((e) => e.getBoundingClientRect().right)) : sol;
          const bosSag = sagGrup.length ? Math.min(...sagGrup.map((e) => e.getBoundingClientRect().left)) : sag;
          const fark = (l + r) / 2 - (bosSol + bosSag) / 2;
          if (Math.abs(fark) > 24) s.push(`menü kalemleri sol ve sağ grup arasındaki alanın ortasında değil (merkez farkı ${Math.round(fark)}px; bar merkezine göre ${Math.round((l + r) / 2 - (sol + sag) / 2)}px)`);
          if (tb.left < r - 1) s.push('tema seçici menü kalemlerinin sağında değil');
        }
        return s;
      });
      kaydet('q', w, s, q);
    }
    if (HARF.includes('n')) {
      const n = await p.evaluate(perdeOlc); const g = gastroPerde[w]; const sorun = [];
      if (n.yok) sorun.push('footer yok');
      else {
        // pencereden uzun footer akışta (perde.js): sayfa sonunda alt kenarı pencere altına oturmalı; kısa footer tamamen görünür olmalı
        if (n.h > n.vh) { if (Math.abs(n.alt - n.vh) > 2) sorun.push(`uzun footer sayfa sonunda pencere altına oturmuyor (alt ${n.alt}, pencere ${n.vh})`); }
        else if (n.acik < -1 || n.alt > n.vh + 1 || n.alt - n.acik < n.h - 2) sorun.push(`footer tamamen görünmüyor (açılan ${n.acik}–${n.alt}, footer ${n.h}px, pencere ${n.vh})`);
        if (n.nok.length) sorun.push(`footer üstünde öğe ${n.nok.length}: ${n.nok.slice(0, 3).join(' | ')}`);
        if (g && !g.yok && g.pos !== n.pos) sorun.push(`perde mekanizması farklı: footer position ${n.pos} ≠ tarifler.html ${g.pos}`);
        if (g && g.pos === 'fixed' && n.pos === 'fixed' && Math.abs(n.mb - n.h) > 2) sorun.push(`.page-main margin-bottom ${n.mb} ≠ footer ${n.h} (tarifler.html: ${g.mb}/${g.h})`);
      }
      kaydet('n', w, s, sorun);
    }
    await p.close();
  }), KOSUT);
  await bag.close();
}

/* ---------- 2 · o: Bebek Tarifleri yönlendirmesi ---------- */
if (HARF.includes('o')) for (const w of [1440, 390].filter((x) => GENISLIK.includes(x) || !process.env.GENISLIK)) {
  const bag = await yeniBag(w);
  for (const s of ['index.html', 'tarifler.html']) {
    const p = await bag.newPage(); await hazirla(p);
    await p.goto(TABAN + s, { waitUntil: 'networkidle' });
    const adaylar = await p.evaluate(() => {
      const yap = new Set();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) if (/Bebek Tarifleri/i.test(n.textContent)) { const e = n.parentElement.closest('a, button, [onclick], label, [role=link], [data-slug], [data-href]'); if (e) yap.add(e); }
      document.querySelectorAll('[title="Bebek Tarifleri"], [aria-label="Bebek Tarifleri"]').forEach((e) => yap.add(e.closest('a, button, [onclick], label, [data-slug]') || e));
      return [...yap].map((e, i) => { e.setAttribute('data-ek-bebek', i); const bolge = e.closest('.mega') ? 'mega' : e.closest('#drawer') ? 'çekmece' : e.closest('header') ? 'header' : e.closest('footer') ? 'footer' : 'sayfa'; return { i, bolge, ad: __ad(e), href: e.getAttribute('href') || e.getAttribute('onclick') || e.getAttribute('data-slug') || '' }; });
    });
    const sorun = [];
    if (!adaylar.length) sorun.push('"Bebek Tarifleri" bağı yok');
    for (const a of adaylar) {
      const q = await bag.newPage(); await hazirla(q);
      await q.goto(TABAN + s, { waitUntil: 'networkidle' });
      await q.evaluate(() => { const yap = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (/Bebek Tarifleri/i.test(n.textContent)) { const e = n.parentElement.closest('a, button, [onclick], label, [role=link], [data-slug], [data-href]'); if (e && !yap.includes(e)) yap.push(e); } document.querySelectorAll('[title="Bebek Tarifleri"], [aria-label="Bebek Tarifleri"]').forEach((e) => { const x = e.closest('a, button, [onclick], label, [data-slug]') || e; if (!yap.includes(x)) yap.push(x); }); yap.forEach((e, i) => e.setAttribute('data-ek-bebek', i)); });
      // tıklama JS ile (gizli mega/çekmece öğeleri de); ana çerçevenin ilk gezinme isteği hedeftir, dış siteye gidilmez (istek kesilir)
      let hedef = '';
      await q.route('**/*', (r) => (r.request().isNavigationRequest() && !r.request().url().startsWith(new URL(TABAN).origin) ? r.abort() : r.continue()));
      q.on('request', (r) => { if (!hedef && r.isNavigationRequest() && r.frame() === q.mainFrame()) hedef = r.url(); });
      await q.evaluate((i) => document.querySelector(`[data-ek-bebek="${i}"]`)?.click(), a.i);
      await q.waitForTimeout(1500);
      const yol = hedef ? new URL(hedef).pathname.split('/').pop() : '(gitmedi)';
      if (yol !== 'kids-tarifler.html') sorun.push(`${a.bolge} ${a.ad} → ${hedef ? hedef.replace(TABAN, '') : '(tıklama bir yere gitmedi)'}`);
      await q.close();
    }
    kaydet('o', w, s, sorun.length ? [`${sorun.length}/${adaylar.length} bağ kids-tarifler.html'e gitmiyor: ${sorun.slice(0, 4).join(' | ')}`] : []);
    await p.close();
  }
  await bag.close();
}
await t.close();

/* ---------- rapor ---------- */
const AD = { k: 'segment kontrolü', l: 'akordeon yok + eşit yükseklik', m: 'ikonlu kart hizası', n: 'footer perde', o: 'Bebek Tarifleri → Kids', p: 'tarif ekle CTA yok + editör', q: 'tema seçici sağda, menü ortada' };
console.log(`Ek revize kapısı · TABAN=${TABAN} · genişlik ${GENISLIK.join(',')}\n`);
for (const h of Object.keys(AD)) {
  const l = sonuc.filter((x) => x.harf === h); if (!l.length) continue;
  console.log(`— ${h} · ${AD[h]}`);
  for (const x of l) console.log(`${x.ok ? '✓' : '✗'} [${h}] ${String(x.w).padEnd(4)} ${x.sayfa}${x.ok ? '' : '\n      ' + x.ayrinti.join('\n      ')}`);
}
console.log('\nÖzet:');
for (const h of Object.keys(AD)) { const l = sonuc.filter((x) => x.harf === h); if (l.length) console.log(`  ${l.every((x) => x.ok) ? '✓' : '✗'} ${h} ${AD[h].padEnd(32)} ${l.filter((x) => x.ok).length}/${l.length}`); }
const yesil = sonuc.filter((x) => x.ok).length;
console.log(`\n${yesil}/${sonuc.length} ek ölçüm yeşil`);
process.exit(yesil === sonuc.length ? 0 : 1);
