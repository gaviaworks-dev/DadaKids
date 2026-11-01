// Boşluk kapısı: akıştaki metin bloğu ile ardından gelen kutu/kart, ve kutu ile ardından gelen buton/metin arası dikey boşluk ölçülür.
// Eşik ESIK_PX (varsayılan 16). Kutu: kendi zemini, çerçevesi ya da gölgesi olan öğe (tam genişlik bant sayılmaz).
// Muaf: kart içi satırlar (bilgi kutusu ya da iç içe kutu taşımıyorsa), chip listeleri, gizli öğeler (hidden, kapalı details, kapalı popover), yüzen yardım düğmesi/menüsü (.kd-yardim*, V2'de Pütür'ün yerine).
// Bilinçli istisna: öğeye ya da üst bloğuna data-bosluk-serbest; kapı sonunda sayısını yazar.
// Kullanım: node araclar/bosluk-kapisi.mjs [sayfa...]   (TABAN=… ile canlıda) · GENISLIK=1440,390 · ESIK_PX=16
// Tarama kipleri (kapı değil, elle denetim): DETAY_AC=1 tüm details'i açar · GIZLI_AC=1 hidden öğeleri gösterir · KART_ICI=1 kart içi satırları da ölçer.
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GENISLIK = (process.env.GENISLIK || '1440,1024,768,390').split(',').map(Number);
const ESIK = Number(process.env.ESIK_PX || 16), KART_ICI = !!process.env.KART_ICI, DETAY_AC = !!process.env.DETAY_AC, GIZLI_AC = !!process.env.GIZLI_AC;
const SAYFALAR = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync('.').filter((f) => /^kids.*\.html$/.test(f)).sort();

// Sayfa içinde çalışır: { sorunlar, serbest, kutuSayisi, cift }
const olc = ({ ESIK, KART_ICI }) => {
  const METIN = new Set(['P', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4']);
  const BILGI = '.kd-ornek, .kd-onay, .kd-kutu, .kd-ar-depo-not, [class*="uyari"], [class*="ipucu"], [class*="asla"], [class*="__not"], [class*="-not"]';
  const BUTON = 'button, .kd-btn, [role="button"], a.btn, input[type="submit"]';
  const FORM = 'input, select, textarea, label';
  const CHIP = /(chip|rozet|pill|etiket|kd-alerjen\b|ust-?yazi|kd-yas\b)/i;
  const vw = document.documentElement.clientWidth;
  const stil = new Map(); const cs = (e) => { if (!stil.has(e)) stil.set(e, getComputedStyle(e)); return stil.get(e); };
  const seffaf = (c) => !c || c === 'transparent' || /rgba?\([^)]*[,/]\s*0\)$/.test(c);
  const gizli = (e) => {
    if (e.closest('[hidden], .kd-gizli, svg')) return true;
    const d = e.closest('details:not([open])'); if (d && !e.closest('summary') && e !== d) return true;
    const po = e.closest('[popover]'); if (po && !po.matches(':popover-open')) return true;
    const s = cs(e); if (s.display === 'none' || s.visibility === 'hidden' || s.display === 'contents') return true;
    const b = e.getBoundingClientRect(); return b.width < 1 || b.height < 1;
  };
  const akista = (e) => { const s = cs(e); return s.position !== 'absolute' && s.position !== 'fixed' && s.float === 'none' && !e.matches('script, style, template, br, hr'); };
  const gorunenCocuk = (e) => [...e.children].filter((c) => !gizli(c) && akista(c));
  const sus = (e) => {  // kendi zemini, çerçevesi ya da gölgesi var mı
    const s = cs(e);
    const cerceve = ['Top', 'Right', 'Bottom', 'Left'].filter((k) => parseFloat(s[`border${k}Width`]) > 0 && s[`border${k}Style`] !== 'none' && !seffaf(s[`border${k}Color`])).length;
    return !seffaf(s.backgroundColor) || s.backgroundImage !== 'none' || cerceve >= 3 || (s.boxShadow !== 'none' && !/ 0px 0px 0px 0px/.test(s.boxShadow));
  };
  const chipMi = (e) => {
    const b = e.getBoundingClientRect(), s = cs(e); const ad = typeof e.className === 'string' ? e.className : '';
    if (CHIP.test(ad)) return true;
    if (b.height < 40 || b.width < 120) return true;                                       // rozet ölçeği
    if (parseFloat(s.borderTopLeftRadius) >= b.height / 2 && b.height < 56) return true;   // hap biçimi
    if (/inline/.test(s.display) && b.height < 56) return true;
    return false;
  };
  // chip listesi: adı chip/rozet olan çocuklar ya da aynı satıra dizilen kısa çocuklar (alt alta metin listesi sayılmaz)
  const chipListesi = (e) => {
    const c = gorunenCocuk(e); if (c.length < 2) return false;
    if (c.every((x) => CHIP.test(typeof x.className === 'string' ? x.className : ''))) return true;
    const r = c.map((x) => x.getBoundingClientRect());
    return r.every((x) => x.height < 48) && r.some((x, i) => i > 0 && Math.abs(x.top - r[i - 1].top) < 4);
  };
  const kutuMu = (e) => {
    if (e.matches(FORM) || e.matches(BUTON) || e.matches('summary, img, video, picture, canvas, tr, td, th, thead, tbody')) return false;
    if (e.matches('table')) return true;   // tablo tek kutu: satır çizgisi/zebrası tablodan bağımsız ölçülmez
    const b = e.getBoundingClientRect();
    return sus(e) && b.width < vw - 8 && !chipMi(e);
  };
  const dogrudanMetin = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
  // Tür: 'kutu' | 'buton' | 'metin' | null (sarmalayıcı/görsel/form)
  const tur = (e) => {
    if (e.matches(BUTON)) return CHIP.test(typeof e.className === 'string' ? e.className : '') ? null : 'buton';
    if (kutuMu(e)) return 'kutu';
    if (e.matches(FORM) || chipMi(e) && !METIN.has(e.tagName)) return null;
    if (METIN.has(e.tagName)) return chipListesi(e) ? null : 'metin';
    if (dogrudanMetin(e) && !/inline/.test(cs(e).display)) return 'metin';
    return null;
  };
  const yapraga = (e, son, ust) => {  // sarmalayıcıdan görsel olarak son/ilk gerçek öğeye in
    for (let i = 0; i < 12; i++) {
      if (tur(e)) return e;
      if (e.matches('img, video, picture, canvas, svg, figure')) return e;
      let c = gorunenCocuk(e);
      if (ust) { const u = ust.getBoundingClientRect(); const yatay = c.filter((x) => { const b = x.getBoundingClientRect(); return Math.min(b.right, u.right) - Math.max(b.left, u.left) > 8; }); if (yatay.length) c = yatay; }
      if (!c.length) return e;
      e = c.reduce((a, b) => { const r = a.getBoundingClientRect(), t = b.getBoundingClientRect(); return (son ? t.bottom > r.bottom : t.top < r.top) ? b : a; });
    }
    return e;
  };
  const ad = (e) => { const c = typeof e.className === 'string' ? e.className.trim().split(/\s+/).filter((x) => x && !/^kd-gir/.test(x)).slice(0, 2).join('.') : ''; return e.tagName.toLowerCase() + (c ? '.' + c : ''); };
  const metinOzet = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 34);
  const kartIci = (p) => { for (let e = p; e && !e.matches('.kd-sayfa'); e = e.parentElement) if (kutuMu(e)) return e; return null; };
  const serbest = (e) => e.closest('[data-bosluk-serbest]');
  const sorunlar = [], serbestler = new Set(); let cift = 0;
  document.querySelectorAll('.kd-sayfa, .kd-sayfa *').forEach((p) => {
    if (p.closest('svg, .kd-ust, [class*="kd-yardim"], [data-kd-yardim], [class*="kd-pt"]') || gizli(p)) return;
    if (p.children.length < 2) return;
    const c = gorunenCocuk(p).filter((x) => !(typeof x.className === 'string' && /(^|\s)kd-(yardim|pt)/.test(x.className)));
    if (c.length < 2) return;
    const r = c.map((x) => x.getBoundingClientRect());
    c.forEach((b, i) => {
      // b'nin hemen üstündeki kardeş: görsel sıra (ızgara/order dahil), yatay kesişen en alttaki öğe
      let ai = -1;
      r.forEach((ra, j) => {
        if (j === i) return; const rb = r[i];
        const kesisim = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
        if (kesisim < 8 || ra.top >= rb.top || ra.top + ra.height / 2 > rb.top) return;
        if (ai < 0 || ra.bottom > r[ai].bottom) ai = j;
      });
      if (ai < 0) return;
      const a = yapraga(c[ai], true, b), y = yapraga(b, false, c[ai]);
      if (a === y) return;
      const ta = tur(a), ty = tur(y);
      if (!((ta === 'metin' && ty === 'kutu') || (ta === 'kutu' && (ty === 'metin' || ty === 'buton')) || (ta === 'kutu' && ty === 'kutu' && (a.matches(BILGI) || y.matches(BILGI))))) return;
      if ((ta === 'metin' && chipListesi(a)) || (ty === 'metin' && chipListesi(y))) return;
      const kart = kartIci(p);
      if (!KART_ICI && kart && !a.matches(BILGI) && !y.matches(BILGI)) return;   // kart içi satır
      cift++;
      const bosluk = y.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
      const s = serbest(a) || serbest(y);
      if (bosluk < ESIK - 0.5) {
        if (s) { serbestler.add(s); return; }
        sorunlar.push({ tur: `${ta}→${ty}`, a: ad(a), b: ad(y), px: Math.round(bosluk * 10) / 10, y: Math.round(y.getBoundingClientRect().top + scrollY), ozet: metinOzet(y) });
      }
    });
  });
  const gir = [...document.querySelectorAll('.kd-sayfa .kd-gir')].filter((e) => !gizli(e));
  // yatay şeritte ekran dışında kalan kart tekerlekle görünmez, sayılmaz
  const girmedi = gir.filter((e) => { const b = e.getBoundingClientRect(); if (b.left >= vw || b.right <= 0) return false; const s = cs(e); return parseFloat(s.opacity) < .99 || (s.transform !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(s.transform)); }).length;
  return { sorunlar, serbest: serbestler.size, cift, girmedi };
};

const t = await chromium.launch(); let kirmizi = 0, n = 0, toplam = 0, cift = 0; const serbest = {};
const ESZAMAN = Number(process.env.ESZAMAN || 4);
const tekSayfa = async (bag, w, s) => {
    const p = await bag.newPage();
    await p.goto(TABAN + s, { waitUntil: 'networkidle' });
    await p.click('#cookieReject', { timeout: 800 }).catch(() => {});
    // .kd-gir girişleri için gerçek tekerlek kaydırması
    const boy = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < boy + 900; y += 500) { await p.mouse.wheel(0, 500); await p.waitForTimeout(70); }
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(900);
    if (DETAY_AC) await p.evaluate(() => document.querySelectorAll('.kd-sayfa details').forEach((d) => { d.open = true; }));
    if (GIZLI_AC) await p.evaluate(() => document.querySelectorAll('.kd-sayfa [hidden]').forEach((d) => { d.hidden = false; }));
    let r = await p.evaluate(olc, { ESIK, KART_ICI });
    if (r.girmedi) { await p.waitForTimeout(800); r = await p.evaluate(olc, { ESIK, KART_ICI }); }
    await p.close();
    return r;
};
for (const w of GENISLIK) {
  const bag = await t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1 });
  const sonuc = new Array(SAYFALAR.length); let sira = 0;
  await Promise.all(Array.from({ length: ESZAMAN }, async () => { while (sira < SAYFALAR.length) { const i = sira++; sonuc[i] = await tekSayfa(bag, w, SAYFALAR[i]); } }));
  SAYFALAR.forEach((s, i) => {
    const r = sonuc[i];
    n++; cift += r.cift; toplam += r.sorunlar.length;
    if (r.serbest) serbest[s] = Math.max(serbest[s] || 0, r.serbest);
    const kotu = r.sorunlar.length || r.girmedi;
    if (kotu) kirmizi++;
    console.log(`${kotu ? '✗' : '✓'} ${String(w).padEnd(4)} ${s}${r.sorunlar.length ? `  ${r.sorunlar.length} bitişik` : ''}${r.girmedi ? `  .kd-gir görünmedi: ${r.girmedi}` : ''}`);
    r.sorunlar.forEach((x) => console.log(`     ${x.px}px ${x.tur} · ${x.a} → ${x.b} · y=${x.y} · "${x.ozet}"`));
  });
  await bag.close();
}
await t.close();
console.log(`\ndata-bosluk-serbest: ${Object.values(serbest).reduce((a, b) => a + b, 0)} öğe${Object.keys(serbest).length ? ' (' + Object.entries(serbest).map(([k, v]) => `${k}:${v}`).join(', ') + ')' : ''}`);
console.log(`${cift} ölçülen çift · ${toplam} bitişik · ${n - kirmizi}/${n} boşluk ölçümü yeşil`);
process.exit(kirmizi ? 1 : 0);
