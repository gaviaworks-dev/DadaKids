// Dada Kids — ortak komponent yardımcıları (sahibi: lead).
// Sayfa modülleri (src/kids/sayfalar/*.mjs) bunları kullanır; burada değişiklik gerekiyorsa lead'e bildirin.
//
// Sayfa modülü sözleşmesi:
//   export default async function (o) { return [ { dosya, baslik, aciklama, aktif, main, css: ['kol'], js: ['kol'] }, ... ] }
//   o = bu modülün tüm dışa aktarımları + o.veri (JSON'lar)
//   main: <main> içine girecek HTML (o.sayfa(icerik, aktif) ile sarılmış olmalı → Kids alt menüsü + krem zemin)
//   css/js: varlik/kids/css/<ad>.css · varlik/kids/js/<ad>.js (yalnız adı)
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
async function jsonOku(p, yedek) { try { return JSON.parse(await readFile(path.join(KOK, p), 'utf8')); } catch { return yedek; } }

export const veri = {
  tarifler: await jsonOku('veri/kids-tarifler.json', { tarifler: [] }),
  evreler: await jsonOku('veri/evreler.json', { evreler: [] }),
  besinler: await jsonOku('veri/besinler.json', { besinler: [] }),
  kesim: await jsonOku('veri/kesim.json', []),
  mevsim: await jsonOku('veri/mevsim.json', { aylar: [] }),
  rehber: await jsonOku('veri/rehber.json', []),
  who: null, // persentil sayfası kendisi yükler (veri/who-lms.json) — 20 KB
};

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- Evreler: sabit renk, ad, ikon ---------- */
export const EVRE = {
  'hamilelik': { ad: 'Hamilelik & Lohusalık', kisa: 'Hamilelik', renk: 'pembe', ikon: 'hamile', aralik: '1., 2., 3. trimester ve emzirme' },
  '0-6-ay':    { ad: '0–6 Ay', kisa: '0–6 ay', renk: 'mavi', ikon: 'biberon', aralik: 'Sıvı beslenme' },
  '6-8-ay':    { ad: '6–8 Ay', kisa: '6–8 ay', renk: 'seftali', ikon: 'kasik', aralik: 'Ek gıdaya geçiş' },
  '9-12-ay':   { ad: '9–12 Ay', kisa: '9–12 ay', renk: 'mint', ikon: 'tabak-bolmeli', aralik: 'Pütürlü & parmak gıda' },
  '1-3-yas':   { ad: '1–3 Yaş', kisa: '1–3 yaş', renk: 'sari', ikon: 'yurumeye-baslayan', aralik: 'Aile sofrası' },
};
export const EVRE_SIRA = Object.keys(EVRE);
export const evreSayfasi = (kod) => `kids-donem-${kod}.html`;

/* ---------- Yaş rozeti (tarifler) ---------- */
export const YASLAR = [6, 8, 9, 12, 18, 24];
export const YAS_ETIKET = { 6: '+6 Ay', 8: '+8 Ay', 9: '+9 Ay', 12: '+12 Ay', 18: '+18 Ay', 24: '+24 Ay' };  // tek biçim: "+N Ay" (karar: tur 2)
export const yasEvresi = (yas) => (yas < 9 ? '6-8-ay' : yas < 12 ? '9-12-ay' : '1-3-yas');
export const yasRenk = (yas) => EVRE[yasEvresi(yas)].renk;
export const yasRozet = (yas, boy = 'm', uzun = false) =>
  `<span class="kd-yas kd-yas--${boy}" data-renk="${yasRenk(yas)}">${esc(YAS_ETIKET[yas])}${uzun ? ' için uygundur' : ''}</span>`;

/* ---------- İkon / illüstrasyon (görsel kolunun dosyaları) ---------- */
const _dek = (alt) => (alt ? '' : ' aria-hidden="true"');   // boş alt → dekoratif
export const ikon = (ad, boy = 24, alt = '') => `<img src="varlik/kids/svg/ui/${ad}.svg" width="${boy}" height="${boy}" alt="${esc(alt)}"${_dek(alt)} loading="lazy" decoding="async">`;
export const urun = (ad, boy = 40, alt = '') => `<img src="varlik/kids/svg/urun/${ad}.svg" width="${boy}" height="${boy}" alt="${esc(alt)}"${_dek(alt)} loading="lazy" decoding="async">`;
export const sahne = (ad, alt = '') => `<img src="varlik/kids/svg/sahne/${ad}.svg" width="240" height="180" alt="${esc(alt)}"${_dek(alt)} loading="lazy" decoding="async">`;
export const foto = (yol, alt, { gen = 1200, yuk = 900, oncelik = false } = {}) =>
  `<img src="${yol}" alt="${esc(alt)}"${_dek(alt)} width="${gen}" height="${yuk}" ${oncelik ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

/* ---------- Kıvam ---------- */
const KIVAM_SVG = {
  puruzsuz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11h18a9 9 0 0 1-18 0z" fill="#FFE3D1"/><path d="M6 8.5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 2.2-1.2 3 0"/></svg>',
  ezilmis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11h18a9 9 0 0 1-18 0z" fill="#DDF4EA"/><circle cx="7.5" cy="8.3" r="1.5"/><circle cx="12" cy="7.4" r="1.8"/><circle cx="16.4" cy="8.5" r="1.3"/></svg>',
  parmak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9.2" y="2.5" width="5.6" height="15" rx="2.8" transform="rotate(28 12 10)" fill="#FFF4CC"/><path d="M5 21h14"/></svg>',
  aile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="#E4F0FB"/><circle cx="12" cy="13" r="4.5"/><path d="M2.5 4v5M4.5 4v5M3.5 9v11M21 4c-1.5 1-2 3-2 5h2v11"/></svg>',
};
export const KIVAM_AD = { puruzsuz: 'Pürüzsüz', ezilmis: 'Çatalla Ezilmiş', parmak: 'Parmak Gıda', aile: 'Aile Sofrası' };
export const kivamSvg = (k) => KIVAM_SVG[k] || '';
export const kivamEtiket = (k) => `<span class="kd-etiket">${KIVAM_SVG[k] || ''}<span>${esc(KIVAM_AD[k] || k)}</span></span>`;

/* ---------- Alerjen ---------- */
export const ALERJEN_AD = { gluten: 'Gluten', sut: 'Süt', yumurta: 'Yumurta', yerfistigi: 'Yer fıstığı', sertkabuklu: 'Sert kabuklu', susam: 'Susam', balik: 'Balık', soya: 'Soya' };
export function alerjenPilleri(liste = [], { en = 8 } = {}) {  // varsayılan: hepsi okunur biçimde
  if (!liste.length) return `<span class="kd-alerjen kd-alerjen--yok"><i class="fa-solid fa-check" aria-hidden="true"></i> Ana alerjen yok</span>`;
  const p = liste.map((a) => `<span class="kd-alerjen"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> ${esc(ALERJEN_AD[a] || a)}</span>`);
  return p.slice(0, en).join('') + (p.length > en ? `<span class="kd-alerjen">+${p.length - en}</span>` : '');
}

/* ---------- Güven katmanı ---------- */
export const ornek = (metin = 'Bu sayfadaki beslenme bilgileri prototip için hazırlanmış örneklerdir; çocuk doktoru / çocuk diyetisyeni onayından geçmeden yayına alınmaz.') =>
  `<p class="kd-ornek" role="note"><i class="fa-solid fa-flask" aria-hidden="true"></i><span><b>Örnek içerik — uzman onayı bekliyor.</b> ${metin}</span></p>`;
export const onay = () => `<div class="kd-onay"><span class="kd-onay__ikon"><i class="fa-solid fa-user-doctor" aria-hidden="true"></i></span><span><b>Uzman onayı bekliyor</b><small>Çocuk doktoru / çocuk diyetisyeni incelemesi henüz yapılmadı.</small></span></div>`;

/* ---------- Gezinme ---------- */
export const MODULLER = [
  { kod: 'kids', ad: 'Dada Kids', kisa: 'Ana Sayfa', href: 'kids.html', ikon: 'kalp', renk: 'pembe', ac: '' },
  { kod: 'tarifler', ad: 'Kids Tarifleri', kisa: 'Tarifler', href: 'kids-tarifler.html', ikon: 'kase', renk: 'seftali', ac: 'Yaşa, kıvama ve alerjene göre süzülen bebek ve çocuk tarifleri.' },
  { kod: 'donemler', ad: 'Dönemler', kisa: 'Dönemler', href: 'kids-donemler.html', ikon: 'takvim', renk: 'mavi', ac: 'Hamilelikten 3 yaşa beş evre: beslenme, kıvam, odak besinler.' },
  { kod: 'kesim', ad: 'Güvenli Kesim', kisa: 'Güvenli Kesim', href: 'kids-guvenli-kesim.html', ikon: 'bicak-tahta', renk: 'mint', ac: 'Besin besin 3 aşamalı kesim: 6–8 ay, 9–12 ay, 12 ay ve sonrası.' },
  { kod: 'mevsim', ad: 'Mevsimsel Takvim', kisa: 'Mevsim', href: 'kids-mevsim.html', ikon: 'sepet', renk: 'sari', ac: 'Ayın tezgâhı, ayın kahramanı ve o ayın tarifleri.' },
  { kod: 'rehber', ad: 'Rehber', kisa: 'Rehber', href: 'kids-rehber.html', ikon: 'kitap', renk: 'pembe', ac: 'Ek gıdaya geçiş, BLW, öğürme ve boğulma farkı, alerjen tanıtımı.' },
  { kod: 'araclar', ad: 'Araçlar', kisa: 'Araçlar', href: 'kids-araclar.html', ikon: 'arac', renk: 'mavi', ac: 'Hazır mı kontrol listesi, alerjen takipçisi, öğün planlayıcı, persentil.' },
];

export const yaziIm = (ek = '') => `<span class="kd-im ${ek}" aria-label="dada kids"><b>dada</b><span class="kd-im__kids" aria-hidden="true"><span>k</span><span>i</span><span>d</span><span>s</span></span></span>`;

export function altMenu(aktif) {
  const linkler = MODULLER.map((m) => `<a href="${m.href}"${m.kod === aktif ? ' aria-current="page"' : ''}>${ikon(m.ikon, 20)}<span>${esc(m.kisa)}</span></a>`).join('');
  return `<nav class="kd-ust" aria-label="Dada Kids menüsü"><div class="wrap"><div class="kd-ust__menu">${linkler}</div></div></nav>`;  // yazı imi header logosuna taşındı; tema seçiciyi kids.js ekler
}

export const sayfa = (icerik, aktif) => `<div class="kd-sayfa">\n${altMenu(aktif)}\n${icerik}\n</div>`;

export function kirinti(parcalar) {
  // parcalar: [['Tarifler','tarifler.html'], ['Dada Kids','kids.html'], ['Bu sayfa']]
  const ok = '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';
  const ilk = `<a href="index.html" aria-label="Dada Gastro ana sayfa"><i class="fa-solid fa-house" aria-hidden="true"></i></a>`;
  return `<nav class="kd-kirinti" aria-label="Sayfa yolu">${ilk}${parcalar.map(([ad, href]) => ok + (href ? `<a href="${href}">${esc(ad)}</a>` : `<b>${esc(ad)}</b>`)).join('')}</nav>`;
}

export function ustYazi(metin, { ikonAd, renk } = {}) {
  return `<span class="kd-ust-yazi"${renk ? ` data-renk="${renk}"` : ''}>${ikonAd ? ikon(ikonAd, 18) : ''}${esc(metin)}</span>`;
}

/**
 * hero({ renk, kirinti:[...], ust:{metin, ikon}, baslik, giris, eylemler:'html', gorsel:{yol, alt}, sag:'html (gorsel yerine)', kucuk })
 */
export function hero({ renk = 'seftali', kirinti: k = [], ust, baslik, giris, eylemler = '', gorsel, sag, kucuk = false, ek = '' }) {
  const sagHtml = sag ?? (gorsel ? `<div class="kd-hero__gorsel">${foto(gorsel.yol, gorsel.alt || '', { gen: 1200, yuk: 900, oncelik: true })}<span class="kd-hero__sus kd-hero__sus--1 kd-yuz">${ikon('parilti', 64)}</span></div>` : '');
  return `<section class="kd-hero${kucuk ? ' kd-hero--kucuk' : ''}" data-renk="${renk}">
 <div class="wrap">
  ${k.length ? kirinti(k) : ''}
  <div class="kd-hero__izgara">
   <div class="kd-hero__metin">
    ${ust ? ustYazi(ust.metin, { ikonAd: ust.ikon, renk }) : ''}
    <h1>${baslik}</h1>
    ${giris ? `<p class="kd-giris">${giris}</p>` : ''}
    ${eylemler ? `<div class="kd-hero__eylem">${eylemler}</div>` : ''}
    ${ek}
   </div>
   ${sagHtml}
  </div>
 </div>
</section>`;
}

export function bolumBasi({ ust, ikonAd, renk, baslik, alt, sag = '' }) {
  return `<div class="kd-bas"><div>${ust ? ustYazi(ust, { ikonAd, renk }) : ''}<h2>${baslik}</h2>${alt ? `<p>${alt}</p>` : ''}</div>${sag}</div>`;
}

/* ---------- Tarif kartı ---------- */
export const tarifHref = (slug) => `kids-tarif.html?t=${encodeURIComponent(slug)}`;
export const OGUN_AD = { kahvalti: 'Kahvaltı', ana: 'Öğle / Akşam', ara: 'Ara öğün' };
export function tarifKart(t, { gir = true, sira = 0 } = {}) {
  const ogun = (t.ogun || []).map((o) => OGUN_AD[o]).join(' · ');
  return `<a class="kd-kart kd-tarif${gir ? ' kd-gir' : ''}" href="${tarifHref(t.slug)}" data-renk="${yasRenk(t.yas)}" data-yas="${t.yas}" data-kivam="${t.kivam}" data-ogun="${(t.ogun || []).join(' ')}" data-alerjen="${(t.alerjenler || []).join(' ')}" data-sure="${t.sureDk ?? 999}" data-ad="${esc(t.ad.toLocaleLowerCase('tr'))}" data-sira="${sira}" style="--kd-gecikme:${Math.min(sira, 8) * 40}ms">
 <div class="kd-tarif__medya">${foto(t.gorsel, `${t.ad}: ${(KIVAM_AD[t.kivam] || '').toLocaleLowerCase('tr')} kıvamda, ${YAS_ETIKET[t.yas]} için örnek tarif fotoğrafı`, { gen: 1200, yuk: 900 })}${yasRozet(t.yas)}</div>
 <div class="kd-kart__govde">
  <h3>${esc(t.ad)}</h3>
  <div class="kd-tarif__olgu">${kivamEtiket(t.kivam)}${alerjenPilleri(t.alerjenler)}</div>
  <div class="kd-tarif__meta">${t.sureDk ? `<span><i class="fa-regular fa-clock" aria-hidden="true"></i>${t.sureDk} dk</span>` : ''}${ogun ? `<span><i class="fa-regular fa-sun" aria-hidden="true"></i>${esc(ogun)}</span>` : ''}</div>
 </div>
</a>`;
}

/* ---------- Evre kartı ---------- */
export function evreKart(kod, { metin, gir = true } = {}) {
  const e = EVRE[kod];
  const v = (veri.evreler.evreler || []).find((x) => x.kod === kod) || {};
  return `<a class="kd-evre${gir ? ' kd-gir' : ''}" href="${evreSayfasi(kod)}" data-renk="${e.renk}" data-evre="${kod}" aria-current="false">
 <div class="kd-evre__ust"><span class="kd-evre__ikon">${ikon(e.ikon, 34)}</span><div><span class="kd-evre__aralik">${esc(v.aralik || e.aralik)}</span><h3>${esc(e.ad)}</h3></div></div>
 <p>${esc(metin ?? v.slogan ?? v.ozet ?? '')}</p>
 <span class="kd-evre__git">Evreye git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
</a>`;
}

/* ---------- Modül kartı ---------- */
export function modulKart(m, { gir = true } = {}) {
  return `<a class="kd-kart kd-modul${gir ? ' kd-gir' : ''}" href="${m.href}" data-renk="${m.renk}">
 <span class="kd-modul__ikon">${ikon(m.ikon, 40)}</span>
 <h3>${esc(m.ad)}</h3>
 <p>${esc(m.ac)}</p>
 <span class="kd-kart__alt">Keşfet <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
</a>`;
}

export function bosDurum({ baslik = 'Sonuç bulunamadı', metin = '', id = '' } = {}) {
  return `<div class="kd-bos"${id ? ` id="${id}"` : ''} hidden>${sahne('bos-kase')}<h3>${esc(baslik)}</h3><p>${esc(metin)}</p><div class="kd-bos__oneriler"></div></div>`;
}

/* =====================================================================
   TUR 2 yardımcıları — illüstrasyon, maskot, ayırıcı, bant/desen, video, tema seçici
   ===================================================================== */
import { existsSync as _var } from 'node:fs';
const _kok = (p) => path.join(KOK, p);

/** Kawaii illüstrasyon (varlik/kids/illus/<key>.webp|.svg). Dosya yoksa sahne SVG'sine ya da boşa düşer (kırık görsel yok). */
export function illus(key, alt = '', { boy = 480, sinif = '', yedek = 'meyve-sepeti' } = {}) {
  for (const uz of ['webp', 'svg', 'png']) {
    const yol = `varlik/kids/illus/${key}.${uz}`;
    if (_var(_kok(yol))) return `<img class="kd-illus ${sinif}" src="${yol}" width="${boy}" height="${boy}" alt="${esc(alt)}"${alt ? '' : ' aria-hidden="true"'} loading="lazy" decoding="async">`;
  }
  return yedek ? `<img class="kd-illus ${sinif}" src="varlik/kids/svg/sahne/${yedek}.svg" width="240" height="180" alt="${esc(alt)}"${alt ? '' : ' aria-hidden="true"'} loading="lazy" decoding="async">` : '';
}

/** Dada Kids maskotu (varlik/kids/maskot/<poz>.svg). Pozlar: merhaba, kasik, kitap, buyutec, takvim, uyku, kalp, sef, sepet, bicak. */
export function maskot(poz = 'merhaba', { boy = 120, alt = '', sinif = '' } = {}) {
  const yol = `varlik/kids/maskot/${poz}.svg`;
  if (!_var(_kok(yol))) return '';
  return `<img class="kd-maskot ${sinif}" src="${yol}" width="${boy}" height="${boy}" alt="${esc(alt)}"${alt ? '' : ' aria-hidden="true"'} loading="lazy" decoding="async">`;
}

/** Bölüm ayırıcı: üstteki bölümün altına konur; `renk` bir sonraki bölümün zemini (CSS değişkeni ya da renk adı). */
export function ayirici(tip = 'dalga', renk = 'var(--kd-krem)', { ters = false, once = '' } = {}) {
  const d = {
    dalga: 'M0,32 C120,8 240,8 360,28 C480,48 600,52 720,34 C840,16 960,10 1080,26 C1200,42 1320,44 1440,30 L1440,64 L0,64 Z',
    bulut: 'M0,64 L0,40 C40,40 50,18 90,22 C120,4 170,8 190,30 C220,16 260,22 270,40 C300,28 340,30 350,46 C380,30 420,26 440,44 C470,20 520,18 540,40 C570,30 600,32 610,44 C650,24 700,20 720,42 C750,22 800,24 815,42 C845,30 880,30 895,46 C925,24 975,22 990,42 C1020,28 1060,30 1070,44 C1100,20 1150,18 1170,40 C1200,30 1240,32 1250,46 C1280,26 1330,24 1345,42 C1380,32 1420,34 1440,40 L1440,64 Z',
  }[tip] || '';
  return `<div class="kd-ayirici${ters ? ' kd-ayirici--ters' : ''}" aria-hidden="true"${once ? ` style="background:${once}"` : ''}><svg viewBox="0 0 1440 64" preserveAspectRatio="none"><path d="${d}" style="fill:${renk}"/></svg></div>`;
}

/** Sessiz döngü video: autoplay muted loop playsinline; azaltılmış harekette yalnız poster (kids.js durdurur). */
export function video(ad, alt = '', { sinif = '' } = {}) {
  const k = `varlik/kids/video/${ad}`;
  if (!_var(_kok(`${k}.mp4`)) && !_var(_kok(`${k}.webm`))) return '';
  const poster = _var(_kok(`${k}.webp`)) ? `${k}.webp` : (_var(_kok(`${k}.jpg`)) ? `${k}.jpg` : '');
  return `<video class="kd-video ${sinif}" autoplay muted loop playsinline preload="metadata"${poster ? ` poster="${poster}"` : ''}${alt ? ` aria-label="${esc(alt)}"` : ' aria-hidden="true"'}>${_var(_kok(`${k}.webm`)) ? `<source src="${k}.webm" type="video/webm">` : ''}${_var(_kok(`${k}.mp4`)) ? `<source src="${k}.mp4" type="video/mp4">` : ''}</video>`;
}

/** Zebra bant zemin rengi (ayırıcı dolgusu için): .kd-zebra[data-renk] ile aynı formül */
export const zebraRenk = (renk) => renk ? `color-mix(in srgb, var(--kd-${renk}-a) 45%, var(--kd-krem))` : 'var(--kd-krem)';

/* =====================================================================
   Dada Kids LOGO — tek SVG bileşeni (header grubu, bant, hub hero, sade varyant, favicon)
   "dada" = Gastro logosunun 4 yolu (birebir) · "kids" = oyuncu, hafif dağınık harfler
   (her harf ±6–12°, zıplayan taban, düzensiz aralık, mevcut renkler) · 2 özgün tel kollu çocuk.
   Koordinatlar Gastro logo viewBox'ında (921.855 214.449 1721.825 348.042); figürler kutu dışına
   taşabilir (svg overflow:visible) — logo kutusu/header yüksekliği değişmez.
   ===================================================================== */
const _dadaYollari = (() => {
  try {
    const s = readFileSync(path.join(KOK, 'src/donor/ana.html'), 'utf8');
    const i = s.indexOf('<span class="brand-word"><svg'); const j = s.indexOf('</svg>', i);
    return (s.slice(i, j).split('<g transform=')[0].match(/<path[^>]*>(?:<\/path>)?/g) || []).join('');
  } catch { return ''; }
})();
import { readFileSync } from 'node:fs';

const KIDS_HARF = [
  // [harf, x, taban-y, açı, renk] — düzensiz aralık: 14 · 30 · 10
  ['k', 1812, 498, -8, '#D4557C'],
  ['i', 1982, 480, 10, '#3F82C4'],
  ['d', 2078, 505, -6, '#D9783A'],
  ['s', 2297, 487, 12, '#23906C'],
];
const HARF_GEN = { k: 156, i: 66, d: 209, s: 148 };

function _harfler() {
  return KIDS_HARF.map(([h, x, y, a, renk]) => {
    const cx = x + HARF_GEN[h] / 2;
    return `<text x="${x}" y="${y}" fill="${renk}" transform="rotate(${a} ${cx} ${y - 80})">${h}</text>`;
  }).join('');
}

// Logo figürleri (Higgsfield, seçim: tasks/kids-ui-tur2.md): şeffaf WebP. Yerleşim tek; dosya render boyuna göre değişir.
const LOGO_COCUKLARI = [
  // [dosya, yan, x, y, genişlik, yükseklik] — logo koordinatı
  ['salla', 'sol', 650, 167, 256, 408],
  ['tutun', 'sag', 2402, 138, 366, 408],
];
const _cocuklar = (boy) => LOGO_COCUKLARI.map(([ad, yan, x, y, g, h]) => `<g class="kd-logo-cocuk kd-logo-cocuk--${yan}"><image class="kd-cocuk kd-cocuk--${ad}" href="varlik/kids/logo/cocuk-${ad}-${boy}.webp" x="${x}" y="${y}" width="${g}" height="${h}"/></g>`).join('');

/** Header'daki Gastro logosunun içine giren grup (gastro harflerinin yerine geçer). */
export function kidsLogoGrup({ cocuk = true } = {}) {
  return `<g class="kd-logo-kids" aria-hidden="true"><g class="kd-logo-harfler" font-family="GilroyLt, Gilroy, sans-serif" font-weight="300" font-size="324">${_harfler()}</g>${cocuk ? _cocuklar('header') : ''}</g>`;
}

/** Bağımsız "dada kids" logosu (bant, hub hero, pafta). sade: figürsüz; boy: figür dosyası (hero|header). Renk: CSS color (dada + çizgiler). */
export function kidsLogoSvg({ sade = false, sinif = '', etiket = 'Dada Kids', boy = 'hero' } = {}) {
  const vb = sade ? '900 200 1580 380' : '640 120 2140 470';
  return `<svg class="kd-logo-svg ${sinif}" viewBox="${vb}" role="img" aria-label="${esc(etiket)}" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor">${_dadaYollari}</g><g class="kd-logo-kids kd-logo-kids--acik"><g class="kd-logo-harfler" font-family="GilroyLt, Gilroy, sans-serif" font-weight="300" font-size="324">${_harfler()}</g>${sade ? '' : _cocuklar(boy)}</g></svg>`;
}
