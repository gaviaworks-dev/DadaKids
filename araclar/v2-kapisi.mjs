// V2 kapısı (REV-2026-DK01 · tasks/v2-sozlesme.md). Playwright Chromium; tüm kids*.html (kids__ hariç) +
// kids-tarif.html?t=balkabagi-puresi; index.html ve tarifler.html yalnız Kids öğeleri için (a, b, f, g).
// Denetimler:
//  a maskot/çizgi film yok (maskot/ illus/ logo/cocuk- yolları, süs/yüz/ayırıcı/desen öğeleri, Fredoka). Pütür serbest (Beyar ek kararı: kalıyor).
//  b köşe yarıçapı Dada Gastro ölçeğinde (Beyar 1 Kas: Gastro token'ları --radius-sm 8 / -md 12 / -lg 16 / -xl 24, rozet 6, 2/4/11; ≤ 24px, pill yok) (Kids öğeleri; daire istisnası: |w−h| ≤ 2 ve r ≥ min/2 − 1; boyasız öğe — zemin/çerçeve/gölge/kırpma yok — sayılmaz)
//  c sticky: üstte Gastro header + altında .kd-ust; 900px aşağı → Gastro ana menüsü gizli, siyah üst bant (masaüstü) görünür,
//    .kd-ust top = bant altı (mobilde 0), mini logo + ev ikonu; 250px yukarı → header geri (Revize 2 Kas R3);
//    reducedMotion'da geçiş 0; 390'da kategori şeridi yatay kayar, sayfa taşmaz; menü sırası ve ev bağı
//  d yaş barı (kids.html)        e tarif kartı rozet/kıvam/kiler düğmesi     f sahte onay yok + bekliyor rozetleri
//  g isim "Dada Gastro Kids", "Mevsim Takvimi"  h güvenlik şeridi
//  i kiler: "Dolapta Ne Var?" paneli + "bal" reddi kids-bebek-dolabi.html'de (Revize 2 Kas R10: Tarifler'den kalktı),
//    kart üstü "Bebek Kilerime Ekle" kids-tarifler.html'de
//  j yardım düğmesi: karaktersiz, sayfa başıyla kesişmez (1440…320), 6 kalem, Esc kapatır
// Kullanım: node araclar/v2-kapisi.mjs   ·  TABAN=http://localhost:8765/DadaKids/v1/ (v1'e karşı)  ·  GENISLIK=1440,390  ·  SAYFA=kids.html,kids-tarifler
//           KOSUT=4 (eş zamanlı sekme) · J_GENISLIK=1440,1366,1280,1024,768,390,320
import { chromium } from 'playwright';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const KOKEN = new URL(TABAN).origin;
const GENISLIK = (process.env.GENISLIK || '1440,1024,768,390').split(',').map(Number);
const J_GENISLIK = (process.env.J_GENISLIK || '1440,1366,1280,1024,768,390,320').split(',').map(Number);
const KOSUT = Number(process.env.KOSUT || 4);
const ONAYLI = (() => { try { return JSON.parse(readFileSync('veri/uzman-onay.json', 'utf8')).onayli === true; } catch { return false; } })();
const HARF = process.env.HARF || 'abcdefghij';   // HARF=j yalnız j denetimi
const SUZ = (process.env.SAYFA || '').split(',').map((s) => s.trim()).filter(Boolean);

const KIDS = [...readdirSync('.').filter((f) => /^kids(-.+)?\.html$/.test(f)).sort(), 'kids-tarif.html?t=balkabagi-puresi'];
const GASTRO = ['index.html', 'tarifler.html'];
const sec = (s) => !SUZ.length || SUZ.some((x) => s.includes(x));
const SAYFALAR = [...KIDS, ...GASTRO].filter(sec);
const kidsMi = (s) => s.startsWith('kids');
const dosya = (s) => s.split('?')[0];

/* ---------- sonuç defteri ---------- */
const sonuc = [];   // {harf, w, sayfa, ok, ayrinti[]}
const kaydet = (harf, w, sayfa, ayrinti) => sonuc.push({ harf, w, sayfa, ok: ayrinti.length === 0, ayrinti });

/* ---------- tarayıcı içi: statik denetimler (a, b, c-yapı, e, f, g, h-varlık) ---------- */
function statik({ kids, sayfaAd, onayli, w }) {
  const out = { a: [], b: [], c: [], e: [], f: [], g: [], h: [] };
  const KISA = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '')).slice(0, 70);
  const gorunur = (e) => { if (!e || !e.isConnected) return false; const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || c.visibility === 'collapse' || +c.opacity === 0) return false; } return true; };
  const norm = (s) => String(s || '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const SINIR = 'header.header, footer.footer, .mega, .bottom-nav, #drawer';
  const kdTok = (e) => typeof e.className === 'string' && /(^|\s)kd-/.test(e.className);
  // Kids öğesi: .kd-sayfa içi ya da Gastro sınırına varmadan kd-* sınıflı bir ataya sahip
  const kidsOge = (e) => { if (e.closest('.kd-sayfa')) return true; for (let x = e; x && x !== document.body; x = x.parentElement) { if (x.matches(SINIR)) return false; if (kdTok(x)) return true; } return false; };
  const kidsListe = [...document.querySelectorAll('body *')].filter((e) => !(e instanceof SVGElement && e.tagName.toLowerCase() !== 'svg') && kidsOge(e));

  /* a · maskot / çizgi film */
  // Pütür (varlik/kids/putur/, js/putur.js, css/putur.css, .kd-pt*) serbest — Beyar ek kararı 2026-11-01: Pütür kalıyor
  const YASAK = /(\/|^)(maskot|illus)\/|logo\/cocuk-/i;
  const yollar = [];
  document.querySelectorAll('img, source, video, image, use, link[rel=preload], object, embed, iframe').forEach((e) => {
    for (const at of ['src', 'srcset', 'poster', 'href', 'xlink:href', 'data']) { const v = e.getAttribute(at); if (v && YASAK.test(v)) yollar.push(`${e.tagName.toLowerCase()}[${at}]=${v.slice(0, 60)}`); }
  });
  document.querySelectorAll('body *').forEach((e) => {
    for (const ps of [null, '::before', '::after']) { const bg = getComputedStyle(e, ps).backgroundImage + getComputedStyle(e, ps).maskImage; if (bg && YASAK.test(bg)) yollar.push(`${KISA(e)}${ps || ''} bg=${(bg.match(/url\("?([^")]+)/) || [])[1]?.replace(location.origin, '').slice(0, 60)}`); }
  });
  if (yollar.length) out.a.push(`yasak yol ${yollar.length}: ${[...new Set(yollar)].slice(0, 3).join(' | ')}`);
  const kaynak = [...document.querySelectorAll('script[src], link[href]')].map((e) => e.getAttribute('src') || e.getAttribute('href')).filter((u) => /maskot/i.test(u));
  if (kaynak.length) out.a.push(`maskot betik/stil yükleniyor: ${kaynak.slice(0, 2).join(' | ')}`);
  const SUS = '.kd-hero__sus, .kd-yuz, .kd-ayirici, [class*="kd-desen"], .kd-maskot, .kd-illus';
  const PUTUR = (e) => !!e.closest('[class*="kd-pt"], [id*="putur" i]');   // Pütür içindeki öğeler serbest
  const sus = [...document.querySelectorAll(SUS)].filter((e) => gorunur(e) && !PUTUR(e));
  if (sus.length) out.a.push(`süs/maskot öğesi ${sus.length}: ${sus.slice(0, 3).map(KISA).join(' | ')}`);
  const fredoka = [...document.fonts].filter((f) => /fredoka/i.test(f.family) && f.status === 'loaded');
  if (fredoka.length) out.a.push(`Fredoka yüklendi (${fredoka.length} yüz)`);
  const metin = document.body.innerText;

  /* b · köşe yarıçapı */
  const rpx = (v, ref) => { const t = String(v).split(/\s+/)[0]; return t.endsWith('%') ? parseFloat(t) / 100 * ref : parseFloat(t) || 0; };
  const boyali = (e, c) => {
    if (/^(img|video|svg|canvas|picture|iframe|input|select|textarea|button)$/i.test(e.tagName)) return true;
    const bg = c.backgroundColor; if (bg && !/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(bg)) return true;
    if (c.backgroundImage !== 'none') return true;
    if (['Top', 'Right', 'Bottom', 'Left'].some((k) => parseFloat(c['border' + k + 'Width']) > 0 && c['border' + k + 'Style'] !== 'none')) return true;
    if (c.boxShadow !== 'none' || (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0)) return true;
    if (c.overflow !== 'visible' && e.querySelector('img, video, picture, canvas')) return true;
    return false;
  };
  const yuvarlak = [];
  for (const e of kidsListe) {
    const c = getComputedStyle(e);
    if (c.display === 'none' || c.visibility === 'hidden') continue;
    const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) continue;
    const kos = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((k) => c['border' + k + 'Radius']);
    const ham = kos.map((v) => rpx(v, r.width));
    const OLCEK = [0, 2, 4, 6, 8, 11, 12, 16, 24];
    const olcekte = (x) => OLCEK.some((o) => Math.abs(o - x) <= 0.5);
    if (ham.every((x) => x <= 8.5 && olcekte(x))) continue;
    if (!boyali(e, c) || !gorunur(e)) continue;
    const yarim = Math.min(r.width, r.height) / 2;
    const etkin = ham.map((x) => Math.min(x, yarim));
    if (Math.abs(r.width - r.height) <= 2 && etkin.every((x) => x >= yarim - 1)) continue;  // daire: ikon/avatar
    const hap = etkin.some((x) => x >= yarim - 1) && Math.max(...ham) > 24.5;
    if (!hap && ham.every((x) => x <= 24.5 && (olcekte(x) || x >= yarim - 1))) continue;  // Gastro ölçeği (kısa öğede yarıçap kırpılabilir)
    // Pütür karakter gövdesi / gölge / parıltı daireleri muaf; Pütür menü/balon/chip/düğme/rozet/arama kutusu denetimde kalır
    if (e.closest('[class*="kd-pt"]')) { const ad = (typeof e.className === 'string' ? e.className : '') + ' ' + e.tagName; if (!/menu|balon|chip|btn|dugme|düğme|rozet|arama|input/i.test(ad) && !/^(BUTTON|INPUT|A|TEXTAREA|SELECT)$/.test(e.tagName) && (/^(IMG|VIDEO|CANVAS|SVG|PICTURE)$/i.test(e.tagName) || /govde|gövde|golge|gölge|parilti|parıltı|zemin|karakter|sahne|beden|figur|daire|isik|hale/i.test(ad))) continue; }
    // Gastro paritesi: Gastro bileşen sınıfını taşıyan Kids girişi (ör. a.subcat.kd-subcat) Kids-dışı kardeşleriyle aynı yarıçaptaysa Gastro'nundur
    const gs = typeof e.className === 'string' ? e.className.trim().split(/\s+/).find((x) => x && !x.startsWith('kd-')) : null;
    if (gs && !e.closest('.kd-sayfa') && [...document.getElementsByClassName(gs)].some((x) => x !== e && !kdTok(x) && getComputedStyle(x).borderTopLeftRadius === c.borderTopLeftRadius)) continue;
    yuvarlak.push(`${KISA(e)} ${kos.join('/')} (${Math.round(r.width)}×${Math.round(r.height)})`);
  }
  if (yuvarlak.length) out.b.push(`radius Gastro ölçeği dışında (pill/ >24px/ ölçek dışı): ${yuvarlak.length} öğe → ${yuvarlak.slice(0, 4).join(' | ')}`);

  /* f, g · metin kümeleri ("Amerikan Pediatri Akademisi" gibi kaynak adı serbest; "pediatrist" ünvanı yasak) */
  const ozellikMetni = (kume) => kume.flatMap((e) => ['aria-label', 'aria-description', 'title', 'alt', 'placeholder'].map((a) => e.getAttribute(a)).filter(Boolean));
  const metaMetni = [document.title, ...[...document.querySelectorAll('meta[content]')].filter((m) => /description|title|site_name|og:|twitter:/i.test(m.getAttribute('name') || m.getAttribute('property') || '')).map((m) => m.getAttribute('content'))];
  const kume = kids ? [...document.querySelectorAll('body *')] : kidsListe;
  const gorunenMetin = kids ? metin : kidsListe.filter((e) => kdTok(e) && !kidsOge(e.parentElement || document.body)).map((e) => e.innerText || '').join('\n');
  const tumMetin = [gorunenMetin, ...ozellikMetni(kume), ...(kids ? metaMetni : [])];
  const bul = (re) => tumMetin.map((m) => { const x = norm(m).toLocaleLowerCase('tr').match(re); return x ? norm(m).slice(Math.max(0, x.index - 30), x.index + 40) : null; }).filter(Boolean);
  if (!onayli) { const s = bul(/onayl[ıi]|onaylanm[ıi]ş|pediatrist/u); if (s.length) out.f.push(`sahte onay ifadesi ${s.length}: "${s.slice(0, 2).join('" | "')}"`); }
  { const s = bul(/dada\s+kids/u); if (s.length) out.g.push(`"Dada Kids" ${s.length}: "${s.slice(0, 2).join('" | "')}"`); }
  // gastro sayfalarında yalnız Kids öğelerine bakıldığı için "Dada Kids" Gastro çekmecesini de ayrıca tara (görünür bağ metni)
  if (!kids) { const d = [...document.querySelectorAll('#drawer a, .mega a')].map((a) => a.textContent).filter((t) => /dada\s+kids/i.test(norm(t))); if (d.length) out.g.push(`Gastro menüsünde "Dada Kids" bağı ${d.length}`); }

  if (!kids) return out;
  /* c · menü yapısı */
  const ust = document.querySelector('.kd-ust');
  if (!ust) out.c.push('.kd-ust yok');
  else {
    const ev = ust.querySelector('a[aria-label="Dada Gastro Kids ana sayfa"]');
    if (!ev) out.c.push('ev bağı (aria-label="Dada Gastro Kids ana sayfa") yok');
    else {
      if (!ev.querySelector('svg') && !ev.querySelector('img[src$=".svg"]')) out.c.push('ev bağında svg yok');
      else if (!ev.querySelector('svg')) out.c.push('ev bağı svg yerine <img> taşıyor');
      const metinli = [...ev.querySelectorAll('*'), ev].flatMap((x) => [...x.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())).some((n) => { const rg = document.createRange(); rg.selectNodeContents(n); const b = rg.getBoundingClientRect(); return b.width > 2 && b.height > 2; });
      if (metinli) out.c.push('ev bağında görünür metin var');
    }
    const kalem = [...ust.querySelectorAll('a')].filter((a) => a !== ev && !a.closest('[class*="logo"]') && !/logo/.test(a.className) && getComputedStyle(a).display !== 'none').map((a) => norm(a.textContent)).filter(Boolean);
    const BEK = ['Tarifler', 'Dönemler', 'Güvenli Kesim', 'Mevsim Takvimi', 'Rehber', 'Araçlar'];
    if (kalem.join('|') !== BEK.join('|')) out.c.push(`menü sırası: [${kalem.join(', ')}] ≠ [${BEK.join(', ')}]`);
    if (ev) { const ilk = [...ust.querySelectorAll('a')].find((a) => norm(a.textContent) === 'Tarifler'); if (ilk && (ev.compareDocumentPosition(ilk) & Node.DOCUMENT_POSITION_FOLLOWING) === 0) out.c.push('ev bağı "Tarifler"den önce değil'); }
    if (kalem.includes('Mevsim')) out.g.push('Kids menüsünde tam "Mevsim" kalemi var');
    if (!kalem.includes('Mevsim Takvimi')) out.g.push('Kids menüsünde "Mevsim Takvimi" yok');
    if (w <= 400) {
      const tarifA = [...ust.querySelectorAll('a')].find((a) => norm(a.textContent) === 'Tarifler');
      let kap = tarifA ? tarifA.parentElement : null;
      while (kap && kap !== ust && !/(auto|scroll)/.test(getComputedStyle(kap).overflowX)) kap = kap.parentElement;
      if (!kap || kap === ust && !/(auto|scroll)/.test(getComputedStyle(ust).overflowX)) out.c.push('390: kategori şeridinde overflow-x auto/scroll yok');
      else if (kap.scrollWidth <= kap.clientWidth) out.c.push(`390: kategori şeridi kaymıyor (scrollWidth ${kap.scrollWidth} ≤ ${kap.clientWidth})`);
    }
  }
  const tasma = document.documentElement.scrollWidth - innerWidth;
  if (tasma > 0) out.c.push(`yatay taşma ${tasma}px`);

  /* e · tarif kartları */
  const BEKKIV = ['Pürüzsüz Püre', 'Çatalla Ezilmiş', 'BLW Parmak Gıda', 'Aile Sofrası'];
  const lum = (c) => { const v = c.map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const rgba = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return [255, 255, 255, 1]; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const zemin = (e) => { const kat = []; for (let x = e; x; x = x.parentElement) { const c = rgba(getComputedStyle(x).backgroundColor); if (c[3] > 0) { kat.push(c); if (c[3] >= 1) break; } } let r = [255, 255, 255]; for (const c of kat.reverse()) r = r.map((v, i) => v * (1 - c[3]) + c[i] * c[3]); return r; };
  const kartlar = [...document.querySelectorAll('.kd-tarif')].filter(gorunur);
  const eh = new Map();
  const e_ = (k, m) => { if (!eh.has(m)) eh.set(m, []); eh.get(m).push(k); };
  for (const k of kartlar) {
    const kb = k.getBoundingClientRect();
    const ad = (k.querySelector('h3, h2')?.textContent || k.dataset.ad || '?').trim().slice(0, 28);
    const rz = k.querySelector('.kd-age-badge');
    if (!rz || !gorunur(rz)) e_(ad, 'rozet (.kd-age-badge) yok');
    else {
      const t = norm(rz.textContent); if (!/^\+\d+ AY$/.test(t)) e_(ad, `rozet metni "${t}"`);
      const rb = rz.getBoundingClientRect(); if (rb.left - kb.left > 24 || rb.top - kb.top > 24 || rb.left < kb.left - 2 || rb.top < kb.top - 2) e_(ad, `rozet sol üstte değil (${Math.round(rb.left - kb.left)},${Math.round(rb.top - kb.top)})`);
      const on = rgba(getComputedStyle(rz).color).slice(0, 3), ar = zemin(rz); const L = [lum(on), lum(ar)].sort((a, b) => b - a); const kon = (L[0] + 0.05) / (L[1] + 0.05);
      if (kon < 4.5) e_(ad, `rozet kontrastı ${kon.toFixed(2)}`);
      if (rgba(getComputedStyle(rz).backgroundColor)[3] < 0.9) e_(ad, 'rozet zemini opak değil (fotoğraf üstünde kontrast garanti değil)');
    }
    const kv = k.querySelector('.kd-kivam');
    if (!kv || !gorunur(kv)) e_(ad, 'kıvam (.kd-kivam) yok');
    else { const t = norm(kv.textContent); if (!BEKKIV.includes(t)) e_(ad, `kıvam metni "${t}"`); const vb = kv.getBoundingClientRect(); if (vb.top + vb.height / 2 < kb.top + kb.height / 2) e_(ad, 'kıvam kartın üst yarısında'); }
    const kd = k.querySelector('.kd-kiler-ekle');
    if (!kd) e_(ad, 'kiler düğmesi (.kd-kiler-ekle) yok'); else if (kd.closest('a')) e_(ad, 'kiler düğmesi <a> içinde');
  }
  out.kart = kartlar.length;
  for (const [m, l] of eh) out.e.push(`${m}: ${l.length}/${kartlar.length} kart (${[...new Set(l)].slice(0, 2).join(', ')})`);

  const hero = document.querySelector('.kd-sayfa section.kd-hero') || [...document.querySelectorAll('.kd-sayfa section')].find((s) => s.querySelector('h1'));
  /* f · onaysızken rozet alanı gizli (Beyar 1 Kas N1: "bekliyor" rozetleri/notları kaldırıldı; bileşen kodda, onayli:true iken açılır) */
  if (!onayli) {
    const r = [...document.querySelectorAll('[data-kd-onay], .kd-guven-rozet, .kd-inceleyen, .kd-ornek, .kd-onay')].filter((x) => gorunur(x) && !x.closest('[hidden]'));
    if (r.length) out.f.push(`onaysızken güven/örnek öğesi görünür ${r.length}: ${r.slice(0, 2).map((x) => norm(x.textContent).slice(0, 50)).join(' | ')}`);
  }

  /* h · güvenlik şeridi */
  const CUMLE = '1 yaşından küçük bebeklere tuz, rafine şeker, bal ve inek sütü (ana içecek olarak) verilmemelidir.';
  const serit = [...document.querySelectorAll('.kd-guvenlik-serit')].filter(gorunur);
  const muaf = /^kids-donem-(hamilelik|1-3-yas)\.html$/.test(sayfaAd);
  if (!muaf) {
    if (!serit.length) out.h.push('.kd-guvenlik-serit yok');
    else {
      if (!norm(serit[0].textContent).includes(CUMLE)) out.h.push(`şerit metni: "${norm(serit[0].textContent).slice(0, 70)}"`);
      const a = serit[0].querySelector('a[href]'); if (!a || a.getAttribute('href').split(/[?#]/)[0] !== 'kids-rehber-yasakli-gidalar.html') out.h.push(`şerit bağı: ${a ? a.getAttribute('href') : 'yok'}`);
      if (sayfaAd === 'kids.html' && hero && hero.nextElementSibling !== serit[0]) out.h.push(`şerit hero'nun hemen ardındaki kardeş değil (ardındaki: ${hero.nextElementSibling ? KISA(hero.nextElementSibling) : 'yok'})`);
    }
  }
  return out;
}

/* ---------- sticky (c) ---------- */
async function sticky(p, w) {
  const s = [];
  const olc = () => p.evaluate(() => {
    const h = document.querySelector('header.header'), u = document.querySelector('.kd-ust');
    const hb = h?.getBoundingClientRect(), ub = u?.getBoundingClientRect(); const hc = h && getComputedStyle(h);
    const hGor = !!h && hb.bottom > 0.5 && hb.height > 0 && hc.visibility !== 'hidden' && +hc.opacity > 0 && hc.display !== 'none';
    const gor = (e) => { if (!e) return false; const b = e.getBoundingClientRect(); if (b.width < 4 || b.height < 4 || b.bottom <= 0 || b.top >= innerHeight) return false; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; } return true; };
    const ev = u?.querySelector('a[aria-label="Dada Gastro Kids ana sayfa"]');
    const logo = u ? [...u.querySelectorAll('[class*="logo"], img[alt*="Gastro" i], svg[aria-label*="Gastro" i], [aria-label*="Gastro Kids" i]:not(a[aria-label="Dada Gastro Kids ana sayfa"])')].filter((x) => !ev || !ev.contains(x)) : [];
    const tb = [...document.querySelectorAll('.topbar, .ust-bant')].find((x) => getComputedStyle(x).display !== 'none' && x.offsetHeight > 0);
    const tbAlt = tb ? Math.round(tb.getBoundingClientRect().bottom) : 0;   // R3: siyah üst bant (masaüstü) hep görünür
    return { tbAlt, hGor, hAlt: hb ? Math.round(hb.bottom) : null, uUst: ub ? Math.round(ub.top) : null, uVar: !!u, y: Math.round(scrollY), boy: document.documentElement.scrollHeight, ev: gor(ev), logo: logo.some(gor) };
  });
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
  const a = await olc();
  if (!a.uVar) return ['.kd-ust yok'];
  if (!a.hGor) s.push('üstte Gastro header görünmüyor');
  if (a.uUst < a.hAlt - 2) s.push(`üstte .kd-ust header'ın altında değil (top ${a.uUst} < header alt ${a.hAlt})`);
  await p.mouse.move(6, 420);   // sol kenar boşluğu: iç kaydırma kutularına denk gelmesin
  for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 180); await p.waitForTimeout(90); if (i >= 4 && await p.evaluate(() => scrollY) >= 900) break; }
  await p.waitForTimeout(700);
  const b = await olc();
  if (b.y < 400) s.push(`kaydırma gerçekleşmedi (scrollY ${b.y}, boy ${b.boy})`);
  if (b.hGor && b.hAlt > b.tbAlt + 1) s.push(`900px aşağıda Gastro ana menüsü hâlâ görünür (alt ${b.hAlt}, bant alt ${b.tbAlt})`);
  if (Math.abs(b.uUst - b.tbAlt) > 2) s.push(`900px aşağıda .kd-ust top=${b.uUst} (siyah bandın altı ${b.tbAlt} olmalı)`);
  if (a.tbAlt && b.tbAlt !== a.tbAlt) s.push(`900px aşağıda siyah üst bant gizlendi (alt ${a.tbAlt} → ${b.tbAlt})`);
  if (!b.logo) s.push('yapışık barda mini logo görünmüyor');
  if (!b.ev) s.push('yapışık barda ev ikonu görünmüyor');
  for (let i = 0; i < 2; i++) { await p.mouse.wheel(0, -125); await p.waitForTimeout(90); }
  await p.waitForTimeout(700);
  const c = await olc();
  if (!c.hGor) s.push('250px yukarıda Gastro header geri gelmedi');
  return s;
}

/* ---------- havuz ---------- */
async function havuz(isler, n) { const kuyruk = [...isler]; await Promise.all(Array.from({ length: n }, async () => { while (kuyruk.length) await kuyruk.shift()(); })); }

const t = await chromium.launch();
const yeniBag = (w, ek = {}) => t.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1, ...ek });

/* ---------- 1 · sayfa × genişlik: a b c e f g h ---------- */
for (const w of /[abcefgh]/.test(HARF) ? GENISLIK : []) {
  const bag = await yeniBag(w);
  await havuz(SAYFALAR.map((s) => async () => {
    const p = await bag.newPage(); const ag = [], jsHata = [];
    p.on('request', (r) => { const u = r.url(); if (/\/maskot\/|\/illus\/|logo\/cocuk-|fredoka/i.test(u)) ag.push(u.replace(KOKEN, '').slice(0, 70)); });
    p.on('pageerror', (e) => jsHata.push(e.message));
    const r = await p.goto(TABAN + s, { waitUntil: 'networkidle' }).catch((e) => null);
    if (!r || r.status() >= 400) { for (const h of kidsMi(s) ? 'abcefgh' : 'abfg') kaydet(h, w, s, [`sayfa açılmadı (${r ? r.status() : 'hata'})`]); await p.close(); return; }
    await p.waitForTimeout(300);
    const o = await p.evaluate(statik, { kids: kidsMi(s), sayfaAd: s, onayli: ONAYLI, w });
    if (ag.length) o.a.unshift(`ağ isteği ${ag.length}: ${[...new Set(ag)].slice(0, 2).join(' | ')}`);
    if (kidsMi(s)) o.c.push(...await sticky(p, w));
    // gecikmeli/kaydırınca beliren maskot (ör. Pütür kenardan çıkar): kaydırma sonrası yeniden bak
    if (kidsMi(s)) { await p.waitForTimeout(1200); const geç = await p.evaluate(() => [...document.querySelectorAll('.kd-hero__sus, .kd-yuz, .kd-ayirici, [class*="kd-desen"], .kd-maskot, .kd-illus')].filter((e) => { if (e.closest('[class*="kd-pt"]')) return false; const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.display !== 'none' && c.visibility !== 'hidden'; }).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).trim().split(/\s+/).slice(0, 3).join('.'))); if (geç.length && !o.a.some((x) => x.startsWith('süs/maskot'))) o.a.push(`kaydırınca beliren süs/maskot ${geç.length}: ${[...new Set(geç)].slice(0, 3).join(' | ')}`); }
    if (jsHata.length) o.c.push(`JS hatası: ${jsHata[0].slice(0, 80)}`);
    const muafH = /^kids-donem-(hamilelik|1-3-yas)\.html$/.test(s);
    for (const h of kidsMi(s) ? 'abcefgh' : 'abfg') { if (!HARF.includes(h)) continue; if ((h === 'e' && !o.kart) || (h === 'h' && muafH)) continue; kaydet(h, w, s, o[h]); }
    await p.close();
  }), KOSUT);
  await bag.close();
}

/* ---------- 2 · c: azaltılmış hareket ---------- */
if (HARF.includes('c') && (sec('kids.html') || sec('kids-tarifler'))) {
  const bag = await yeniBag(1440, { reducedMotion: 'reduce' });
  for (const s of ['kids.html', 'kids-tarifler.html'].filter(sec)) {
    const p = await bag.newPage(); await p.goto(TABAN + s, { waitUntil: 'networkidle' });
    const sure = async () => p.evaluate(() => ['header.header', '.kd-ust'].map((q) => { const e = document.querySelector(q); if (!e) return `${q}:yok`; const c = getComputedStyle(e); const pr = c.transitionProperty.split(',').map((x) => x.trim()), su = c.transitionDuration.split(',').map((x) => parseFloat(x) || 0);
      // hareket taşıyan geçişler (renk/gölge geçişi hareket değildir)
      const hareket = pr.map((x, i) => [x, su[i % su.length]]).filter(([x, d]) => d > 0.001 && /^(all|transform|translate|top|bottom|inset|margin|margin-top|height|max-height)$/.test(x));
      const an = c.animationName !== 'none' && c.animationDuration.split(',').some((x) => parseFloat(x) > 0.001);
      return hareket.length || an ? `${q}: ${hareket.map(([x, d]) => x + ' ' + d + 's').join(', ')}${an ? ' animasyon ' + c.animationName : ''}` : ''; }).filter(Boolean));
    const s1 = await sure();
    await p.mouse.move(400, 500); for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, 180); await p.waitForTimeout(80); }
    await p.waitForTimeout(150);
    const s2 = await sure();
    kaydet('c', 'rm', s, [...new Set([...s1, ...s2])].map((x) => 'reducedMotion geçiş süresi > 0 → ' + x));
    await p.close();
  }
  await bag.close();
}

/* ---------- 3 · d: yaş barı ---------- */
const YAS = [['Hamilelik', 'hamilelik', null], ['0-6 Ay', '0-6-ay', null], ['6-8 Ay', '6-8-ay', 8], ['9-12 Ay', '9-12-ay', 12], ['1-3 Yaş', '1-3-yas', 36]];
const yasBul = () => {
  const norm = (s) => String(s || '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const hero = document.querySelector('.kd-sayfa section.kd-hero') || [...document.querySelectorAll('.kd-sayfa section')].find((s) => s.querySelector('h1'));
  if (!hero) return { hata: 'hero yok' };
  const ADLAR = ['Hamilelik', '0-6 Ay', '6-8 Ay', '9-12 Ay', '1-3 Yaş'];
  const aday = [...hero.querySelectorAll('button, [role=radio], [role=tab], a, label')];
  const sec = ADLAR.map((ad) => aday.find((e) => norm(e.textContent) === ad && e.getBoundingClientRect().width > 0));
  hero.querySelectorAll('[data-v2-yas]').forEach((e) => e.removeAttribute('data-v2-yas'));
  sec.forEach((e, i) => e && e.setAttribute('data-v2-yas', i));
  const eylem = [...hero.querySelectorAll('a.kd-btn, button.kd-btn, .kd-hero__eylem a, .kd-hero__eylem button')].filter((e) => !sec.some((s) => s && (s === e || s.contains(e) || e.contains(s))) && e.getBoundingClientRect().width > 0);
  const eAlt = eylem.length ? Math.max(...eylem.slice(0, 2).map((e) => e.getBoundingClientRect().bottom)) : null;
  const sUst = sec.filter(Boolean).length ? Math.min(...sec.filter(Boolean).map((e) => e.getBoundingClientRect().top)) : null;
  const secili = sec.map((e) => !!e && (['aria-pressed', 'aria-checked', 'aria-current', 'aria-selected'].some((a) => ['true', 'page'].includes(e.getAttribute(a))) || !!e.querySelector('input:checked') || (e.tagName === 'LABEL' && e.control && e.control.checked)));
  return { eksik: ADLAR.filter((_, i) => !sec[i]), eylem: eylem.length, eAlt, sUst, secili };
};
const vitrin = () => {
  const hero = document.querySelector('.kd-sayfa section.kd-hero') || [...document.querySelectorAll('.kd-sayfa section')].find((s) => s.querySelector('h1'));
  const gor = (e) => { const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden') return false; } return true; };
  const kart = [...document.querySelectorAll('.kd-sayfa .kd-tarif')].filter((k) => !hero?.contains(k) && gor(k));
  const not = [...document.querySelectorAll('[data-kd-erken-not], .kd-sayfa [role=note]')].filter((n) => !n.closest('.kd-guvenlik-serit') && !n.classList.contains('kd-guvenlik-serit') && gor(n) && (n.hasAttribute('data-kd-erken-not') || /6\. ay|ek gıda/i.test(n.textContent)));
  const imza = [...document.querySelectorAll('.kd-sayfa > *')].filter((e) => e !== hero && !e.classList.contains('kd-ust')).map((e) => e.innerText).join('\n').replace(/\s+/g, ' ');
  return { yas: kart.map((k) => +k.dataset.yas), not: not.length, imza };
};
async function yasBari(w) {
  const sorun = [];
  const bag = await yeniBag(w); const p = await bag.newPage(); const jsHata = []; p.on('pageerror', (e) => jsHata.push(e.message));
  await p.goto(TABAN + 'kids.html', { waitUntil: 'networkidle' });
  let y = await p.evaluate(yasBul);
  if (y.hata) { await bag.close(); return [y.hata]; }
  if (y.eksik.length) { await bag.close(); return [`hero'da yaş seçeneği eksik: ${y.eksik.join(', ')}`]; }
  if (y.eylem < 2) sorun.push(`hero'da 2 eylem düğmesi yok (${y.eylem})`);
  else if (y.sUst < y.eAlt - 1) sorun.push(`yaş barı iki düğmenin altında değil (bar üst ${Math.round(y.sUst)} < düğme alt ${Math.round(y.eAlt)})`);
  let onceki = (await p.evaluate(vitrin)).imza;
  const sira = [...YAS, YAS[3]];
  for (const [ad, kod, sinir] of sira) {
    const ls0 = await p.evaluate(() => { try { return JSON.stringify(Object.entries(localStorage)); } catch { return ''; } });
    await p.evaluate(yasBul);
    await p.locator(`[data-v2-yas="${YAS.findIndex((x) => x[1] === kod)}"]`).click();
    await p.waitForTimeout(450);
    const v = await p.evaluate(vitrin);
    if (v.imza === onceki && ad !== sira[0][0]) sorun.push(`${ad}: vitrin değişmedi`);
    onceki = v.imza;
    if (sinir === null) { if (v.yas.length && !v.not) sorun.push(`${ad}: ${v.yas.length} tarif kartı var, açık not yok`); }
    else { if (!v.yas.length) sorun.push(`${ad}: vitrinde tarif kartı yok`); const kotu = v.yas.filter((x) => x > sinir); if (kotu.length) sorun.push(`${ad}: yaşa uygun olmayan kart data-yas=${[...new Set(kotu)].join(',')} (> ${sinir})`); }
    const ev = new URL(p.url()).searchParams.get('evre'); if (ev !== kod) sorun.push(`${ad}: URL evre=${ev} (${kod} olmalı)`);
    const ls = await p.evaluate(() => { try { return JSON.stringify(Object.entries(localStorage)); } catch { return ''; } });
    if (!ls.includes(kod) || (ls === ls0 && !ls0.includes(kod))) sorun.push(`${ad}: localStorage'a yazılmadı`);
    y = await p.evaluate(yasBul); const i = YAS.findIndex((x) => x[1] === kod);
    if (!y.secili[i]) sorun.push(`${ad}: tıklanan seçenek seçili işaretlenmedi (aria-pressed/checked)`);
  }
  await p.goto(TABAN + 'kids.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  y = await p.evaluate(yasBul);
  if (!y.secili?.[3]) sorun.push('yeniden yüklemede (parametresiz) 9-12 Ay seçimi korunmadı');
  else { const v = await p.evaluate(vitrin); if (v.yas.some((x) => x > 12)) sorun.push('yeniden yüklemede vitrin 9-12 Ay\'a göre süzülmedi'); }
  if (jsHata.length) sorun.push('JS hatası: ' + jsHata[0].slice(0, 80));
  await bag.close();
  // localStorage throw eden bağlam
  const bag2 = await yeniBag(w); await bag2.addInitScript(() => { try { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('kapalı', 'SecurityError'); } }); Object.defineProperty(window, 'sessionStorage', { configurable: true, get() { throw new DOMException('kapalı', 'SecurityError'); } }); } catch {} });
  const p2 = await bag2.newPage(); const h2 = []; p2.on('pageerror', (e) => h2.push(e.message));
  await p2.goto(TABAN + 'kids.html', { waitUntil: 'networkidle' });
  const y2 = await p2.evaluate(yasBul);
  if (!y2.hata && !y2.eksik.length) { await p2.locator('[data-v2-yas="2"]').click(); await p2.waitForTimeout(400); const v = await p2.evaluate(vitrin); if (v.yas.some((x) => x > 8)) sorun.push('depolama kapalıyken 6-8 Ay süzmesi çalışmıyor'); }
  if (h2.length) sorun.push('depolama kapalıyken pageerror: ' + h2[0].slice(0, 80));
  await bag2.close();
  return sorun;
}
if (HARF.includes('d') && sec('kids.html')) for (const w of [1440, 390].filter((x) => GENISLIK.includes(x) || !process.env.GENISLIK)) kaydet('d', w, 'kids.html', await yasBari(w));

/* ---------- 4 · i: kiler ---------- */
if (HARF.includes('i') && (sec('kids-tarifler') || sec('kids-bebek-dolabi'))) for (const iw of [1440, 390].filter((x) => GENISLIK.includes(x) || !process.env.GENISLIK)) {
  const sorun = [];
  const bag = await yeniBag(iw); const p = await bag.newPage(); const jsHata = []; p.on('pageerror', (e) => jsHata.push(e.message));
  await p.goto(TABAN + 'kids-bebek-dolabi.html', { waitUntil: 'networkidle' });
  // mobilde panel kapalı başlayabilir: panel içindeki aria-expanded="false" düğmesiyle (kullanıcı yüzeyinden) aç
  await p.evaluate(() => { const h = [...document.querySelectorAll('.kd-sayfa h1, .kd-sayfa h2, .kd-sayfa h3, .kd-sayfa h4, .kd-sayfa legend, .kd-sayfa summary')].find((x) => /Dolapta (Ne Var\?|\d+ malzeme)/.test(x.textContent)); const pn = h && (h.closest('[data-kd-kiler-panel], [data-kd-dolap], form, section, aside, details, fieldset') || h.parentElement); const b = pn && pn.querySelector('[aria-expanded="false"][aria-controls]:not([role=combobox])'); if (b) b.setAttribute('data-v2-kiler-ac', ''); });
  if (await p.locator('[data-v2-kiler-ac]').count()) { await p.locator('[data-v2-kiler-ac]').click(); await p.waitForTimeout(400); if (await p.getAttribute('[data-v2-kiler-ac]', 'aria-expanded') !== 'true') sorun.push('kapalı dolap paneli açılmadı'); }
  const panel = await p.evaluate(() => {
    const gor = (e) => { const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden') return false; } return true; };
    const bas = [...document.querySelectorAll('.kd-sayfa h1, .kd-sayfa h2, .kd-sayfa h3, .kd-sayfa h4, .kd-sayfa legend, .kd-sayfa summary, .kd-sayfa strong, .kd-sayfa b')].find((h) => /Dolapta (Ne Var\?|\d+ malzeme)/.test(h.textContent) && gor(h));
    if (!bas) return { hata: '"Dolapta Ne Var?" paneli yok' };
    const pn = bas.closest('[data-kd-kiler-panel], [data-kd-dolap], form, section, aside, details, fieldset') || bas.parentElement; pn.setAttribute('data-v2-kiler', '');
    const bd = [...document.querySelectorAll('.kd-sayfa label, .kd-sayfa button, .kd-sayfa [role=switch], .kd-sayfa [role=checkbox], .kd-sayfa a')].find((e) => /Bebek Dolabı/.test(e.textContent) && gor(e));
    const inp = [...pn.querySelectorAll('input[type=search], input[type=text], input:not([type])')].find(gor);
    if (inp) inp.setAttribute('data-v2-kiler-girdi', '');
    return { bebekDolabi: !!bd, girdi: !!inp };
  });
  if (panel.hata) sorun.push(panel.hata);
  else {
    if (!panel.bebekDolabi) sorun.push('"Bebek Dolabı" filtresi yok');
    if (!panel.girdi) sorun.push('panelde malzeme girdisi yok');
    else {
      const chip = () => p.evaluate(() => [...document.querySelectorAll('[data-v2-kiler] *')].filter((e) => e.children.length === 0 && /^bal$/i.test(e.textContent.trim()) && e.getBoundingClientRect().width > 0 && !e.closest('[role=alert],[role=status],[aria-live]')).length);
      const c0 = await chip();
      await p.fill('[data-v2-kiler-girdi]', 'bal'); await p.press('[data-v2-kiler-girdi]', 'Enter'); await p.waitForTimeout(400);
      const c1 = await chip();
      const ret = await p.evaluate(() => [...document.querySelectorAll('[data-v2-kiler] [role=alert], [data-v2-kiler] [role=status], [data-v2-kiler] [aria-live], [role=alert], [role=status]')].filter((e) => e.getBoundingClientRect().width > 0 && /bal/i.test(e.textContent)).map((e) => e.textContent.trim().slice(0, 80)));
      if (c1 > c0) sorun.push('"bal" malzeme olarak eklendi (reddedilmeli)');
      if (!ret.length) sorun.push('"bal" için görünür ret bildirimi (role=alert/status, "bal" geçen) yok');
    }
  }
  await p.goto(TABAN + 'kids-tarifler.html', { waitUntil: 'networkidle' });
  const dug = p.locator('.kd-tarif .kd-kiler-ekle:visible').first();
  if (!(await dug.count())) sorun.push('görünür .kd-kiler-ekle düğmesi yok');
  else {
    const slug = await dug.getAttribute('data-kd-kiler-ekle');
    const u0 = p.url();
    await dug.click(); await p.waitForTimeout(450);
    if (p.url() !== u0) sorun.push('kiler düğmesi sayfadan ayrıldı (bağ tıklandı)');
    const st = await p.evaluate(() => [...document.querySelectorAll('[role=status]')].filter((e) => e.getBoundingClientRect().width > 0 && e.textContent.trim()).map((e) => e.textContent.trim().slice(0, 60)));
    if (!st.length) sorun.push('tıklayınca görünür role=status bildirimi yok');
    const ls = await p.evaluate(() => { try { return localStorage.getItem('dadagastrokids.kiler.v1'); } catch { return null; } });
    if (!ls) sorun.push('localStorage dadagastrokids.kiler.v1 yazılmadı');
    else if (slug && !ls.includes(slug)) sorun.push(`localStorage kaydında ${slug} yok`);
  }
  if (jsHata.length) sorun.push('JS hatası: ' + jsHata[0].slice(0, 80));
  kaydet('i', iw, 'kids-bebek-dolabi + kids-tarifler', sorun);
  await bag.close();
}

/* ---------- 5 · j: yardım ---------- */
const YARDIM_DUGME = '.kd-yardim-ac, button[aria-controls="kdYardim"], [data-kd-yardim] > button, button[data-kd-yardim], button[data-kd-yardim-ac], .kd-yardim > button, .kd-yardim__dugme, button[aria-label*="ardım"]';
const yardimOlc = (SEC) => {
  const gor = (e) => { const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; } return true; };
  const d = [...document.querySelectorAll(SEC)].find(gor);
  if (!d) return { yok: true };
  d.setAttribute('data-v2-yardim', '');
  const kap = d.closest('.kd-yardim, [data-kd-yardim]') || d;
  const db = d.getBoundingClientRect();
  const hedef = [...document.querySelectorAll('.kd-sayfa h1, .kd-kirinti, .kd-kirinti a, .kd-sayfa [class*="kirinti"] a, .kd-ust-yazi, .kd-etiket, .kd-age-badge, .kd-sayfa [class*="chip"], .kd-sayfa .kd-btn, .kd-sayfa button, .kd-sayfa a.kd-btn, .kd-sayfa input, .kd-ust a, .bottom-nav a')]
    .filter((e) => !kap.contains(e) && !e.contains(d) && gor(e));
  const kes = [];
  // görünen kutu: overflow ile kırpan atalarla kesiştirilmiş dikdörtgen (kayan şeritte taşan kalemler görünmez)
  const kirp = (e) => { let b = e.getBoundingClientRect(); b = { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) { const c = getComputedStyle(x); if (c.overflowX !== 'visible' || c.overflowY !== 'visible') { const a = x.getBoundingClientRect(); if (c.overflowX !== 'visible') { b.left = Math.max(b.left, a.left); b.right = Math.min(b.right, a.right); } if (c.overflowY !== 'visible') { b.top = Math.max(b.top, a.top); b.bottom = Math.min(b.bottom, a.bottom); } } } return b; };
  for (const e of hedef) { const b = kirp(e); if (b.right - b.left <= 0 || b.bottom - b.top <= 0 || b.bottom < 0 || b.top > innerHeight) continue; const x = Math.min(b.right, db.right) - Math.max(b.left, db.left), y = Math.min(b.bottom, db.bottom) - Math.max(b.top, db.top); if (x > 0.5 && y > 0.5) kes.push((e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ' "' + (e.textContent || '').trim().slice(0, 18) + '"')); }
  const gorsel = [...d.querySelectorAll('img')].map((i) => i.getAttribute('src')).filter((s) => /maskot|putur|illus|cocuk-/.test(s || ''));
  return { kes: [...new Set(kes)].slice(0, 3), gorsel, kutu: [Math.round(db.left), Math.round(db.top), Math.round(db.width), Math.round(db.height)] };
};
for (const w of HARF.includes('j') ? J_GENISLIK : []) {
  const bag = await yeniBag(w);
  await havuz(KIDS.filter(sec).map((s) => async () => {
    const p = await bag.newPage();
    const r = await p.goto(TABAN + s, { waitUntil: 'networkidle' }).catch(() => null);
    if (!r || r.status() >= 400) { kaydet('j', w, s, [`sayfa açılmadı (${r ? r.status() : 'hata'})`]); await p.close(); return; }
    await p.waitForTimeout(250);
    const y = await p.evaluate(yardimOlc, YARDIM_DUGME);
    const sorun = [];
    if (y.yok) sorun.push('yardım düğmesi yok');
    else {
      if (y.kes.length) sorun.push(`sayfa başıyla kesişiyor [${y.kutu}]: ${y.kes.join(' | ')}`);
      if (y.gorsel.length) sorun.push('yardım düğmesinde karakter görseli: ' + y.gorsel[0]);
      if ((w === 1440 || w === 390) && ['kids.html', 'kids-tarifler.html', 'kids-rehber.html'].includes(s)) {
        await p.locator('[data-v2-yardim]').click(); await p.waitForTimeout(350);
        const m = await p.evaluate(() => {
          const gor = (e) => { const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden') return false; } return true; };
          const d = document.querySelector('[data-v2-yardim]'); const id = d.getAttribute('aria-controls');
          const menu = (id && document.getElementById(id)) || [...document.querySelectorAll('.kd-yardim__menu, [data-kd-yardim-menu], .kd-yardim [role=menu], .kd-yardim [role=dialog]')].find(gor);
          if (!menu || !gor(menu)) return { acik: false, genis: d.getAttribute('aria-expanded') };
          const k = [...menu.querySelectorAll('a, button')].filter((e) => gor(e) && e.textContent.trim() && !/kapat/i.test(e.textContent + (e.getAttribute('aria-label') || ''))).map((e) => e.textContent.replace(/\s+/g, ' ').trim());
          menu.setAttribute('data-v2-yardim-menu', '');
          return { acik: true, genis: d.getAttribute('aria-expanded'), k };
        });
        if (!m.acik) sorun.push('tıklayınca yardım menüsü açılmadı');
        else {
          const BEK = [/kaç aylık/i, /besin güvenli mi/i, /ne pişirsem/i, /alerjen/i, /ek gıdaya hazır mı/i, /acil/i];
          const lo = m.k.map((x) => x.toLocaleLowerCase('tr'));
          const eksik = BEK.filter((re) => !lo.some((x) => re.test(x)));
          if (m.k.length !== 6) sorun.push(`menüde ${m.k.length} kalem (6 olmalı): ${m.k.join(' | ').slice(0, 120)}`);
          if (eksik.length) sorun.push('menüde eksik kalem: ' + eksik.map(String).join(', '));
          if (m.genis !== 'true') sorun.push('açıkken aria-expanded="true" değil');
          await p.keyboard.press('Escape'); await p.waitForTimeout(300);
          const kapali = await p.evaluate(() => { const m = document.querySelector('[data-v2-yardim-menu]'); if (!m) return true; const r = m.getBoundingClientRect(); const c = getComputedStyle(m); return r.width === 0 || r.height === 0 || c.display === 'none' || c.visibility === 'hidden' || m.hidden; });
          if (!kapali) sorun.push('Esc menüyü kapatmadı');
        }
      }
    }
    kaydet('j', w, s, sorun);
    await p.close();
  }), KOSUT);
  await bag.close();
}

/* h: yasaklı gıdalar rehberi bağı 200 */
if (HARF.includes('h') && sec('kids.html')) { const r = await (await t.newContext()).request.get(TABAN + 'kids-rehber-yasakli-gidalar.html').catch(() => null); kaydet('h', '—', 'kids-rehber-yasakli-gidalar.html → 200', r && r.status() === 200 ? [] : [`durum ${r ? r.status() : 'hata'}`]); }
await t.close();

/* ---------- rapor ---------- */
const AD = { a: 'maskot/çizgi film yok', b: 'radius Gastro ölçeğinde', c: 'sticky + menü', d: 'yaş barı', e: 'tarif kartı rozet/kıvam/kiler', f: 'sahte onay yok + onaysız rozet gizli', g: 'isim + Mevsim Takvimi', h: 'güvenlik şeridi', i: 'kiler', j: 'yardım düğmesi' };
console.log(`V2 kapısı · TABAN=${TABAN} · genişlik ${GENISLIK.join(',')} · j ${J_GENISLIK.join(',')} · uzman onayı ${ONAYLI ? 'VAR' : 'yok'}\n`);
for (const h of Object.keys(AD)) {
  const l = sonuc.filter((x) => x.harf === h); if (!l.length) continue;
  console.log(`— ${h} · ${AD[h]}`);
  for (const x of l) console.log(`${x.ok ? '✓' : '✗'} [${h}] ${String(x.w).padEnd(4)} ${x.sayfa}${x.ok ? '' : '\n      ' + x.ayrinti.join('\n      ')}`);
}
console.log('\nÖzet:');
for (const h of Object.keys(AD)) { const l = sonuc.filter((x) => x.harf === h); if (l.length) console.log(`  ${l.every((x) => x.ok) ? '✓' : '✗'} ${h} ${AD[h].padEnd(30)} ${l.filter((x) => x.ok).length}/${l.length}`); }
const yesil = sonuc.filter((x) => x.ok).length;
console.log(`\n${yesil}/${sonuc.length} V2 ölçümü yeşil`);
process.exit(yesil === sonuc.length ? 0 : 1);
