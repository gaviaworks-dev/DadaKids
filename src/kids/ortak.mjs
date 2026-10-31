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
  'hamilelik': { ad: 'Hamilelik & Lohusalık', kisa: 'Hamilelik', renk: 'pembe', ikon: 'hamile', aralik: 'Trimester 1–3 · Emzirme' },
  '0-6-ay':    { ad: '0–6 Ay', kisa: '0–6 ay', renk: 'mavi', ikon: 'biberon', aralik: 'Sıvı beslenme' },
  '6-8-ay':    { ad: '6–8 Ay', kisa: '6–8 ay', renk: 'seftali', ikon: 'kasik', aralik: 'Ek gıdaya geçiş' },
  '9-12-ay':   { ad: '9–12 Ay', kisa: '9–12 ay', renk: 'mint', ikon: 'tabak-bolmeli', aralik: 'Pütürlü & parmak gıda' },
  '1-3-yas':   { ad: '1–3 Yaş', kisa: '1–3 yaş', renk: 'sari', ikon: 'yurumeye-baslayan', aralik: 'Aile sofrası' },
};
export const EVRE_SIRA = Object.keys(EVRE);
export const evreSayfasi = (kod) => `kids-donem-${kod}.html`;

/* ---------- Yaş rozeti (tarifler) ---------- */
export const YASLAR = [6, 8, 9, 12, 18, 24];
export const YAS_ETIKET = { 6: '+6 Ay', 8: '+8 Ay', 9: '+9 Ay', 12: '+12 Ay', 18: '+18 Ay', 24: '2–3 Yaş' };
export const yasEvresi = (yas) => (yas < 9 ? '6-8-ay' : yas < 12 ? '9-12-ay' : '1-3-yas');
export const yasRenk = (yas) => EVRE[yasEvresi(yas)].renk;
export const yasRozet = (yas, boy = 'm', uzun = false) =>
  `<span class="kd-yas kd-yas--${boy}" data-renk="${yasRenk(yas)}">${esc(YAS_ETIKET[yas])}${uzun ? ' için uygundur' : ''}</span>`;

/* ---------- İkon / illüstrasyon (görsel kolunun dosyaları) ---------- */
export const ikon = (ad, boy = 24, alt = '') => `<img src="varlik/kids/svg/ui/${ad}.svg" width="${boy}" height="${boy}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
export const urun = (ad, boy = 40, alt = '') => `<img src="varlik/kids/svg/urun/${ad}.svg" width="${boy}" height="${boy}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
export const sahne = (ad, alt = '') => `<img src="varlik/kids/svg/sahne/${ad}.svg" width="240" height="180" alt="${esc(alt)}" loading="lazy" decoding="async">`;
export const foto = (yol, alt, { gen = 1200, yuk = 900, oncelik = false } = {}) =>
  `<img src="${yol}" alt="${esc(alt)}" width="${gen}" height="${yuk}" ${oncelik ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

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
export function alerjenPilleri(liste = [], { en = 3 } = {}) {
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
  { kod: 'rehber', ad: 'Rehber & Uzman', kisa: 'Rehber', href: 'kids-rehber.html', ikon: 'kitap', renk: 'pembe', ac: 'Ek gıdaya geçiş, BLW, öğürme ve boğulma farkı, alerjen tanıtımı.' },
  { kod: 'araclar', ad: 'Araçlar', kisa: 'Araçlar', href: 'kids-araclar.html', ikon: 'arac', renk: 'mavi', ac: 'Hazır mı kontrol listesi, alerjen takipçisi, öğün planlayıcı, persentil.' },
];

export const yaziIm = (ek = '') => `<span class="kd-im ${ek}" aria-label="dada kids"><b>dada</b><span class="kd-im__kids" aria-hidden="true"><span>k</span><span>i</span><span>d</span><span>s</span></span></span>`;

export function altMenu(aktif) {
  const linkler = MODULLER.map((m) => `<a href="${m.href}"${m.kod === aktif ? ' aria-current="page"' : ''}>${ikon(m.ikon, 20)}<span>${esc(m.kisa)}</span></a>`).join('');
  return `<nav class="kd-ust" aria-label="Dada Kids menüsü"><div class="wrap"><a href="kids.html" class="kd-ust__im" aria-label="Dada Kids ana sayfa">${yaziIm()}</a><div class="kd-ust__menu">${linkler}</div></div></nav>`;
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
 <div class="kd-tarif__medya">${foto(t.gorsel, t.ad, { gen: 1200, yuk: 900 })}${yasRozet(t.yas)}</div>
 <div class="kd-kart__govde">
  <h3>${esc(t.ad)}</h3>
  <div class="kd-tarif__olgu">${kivamEtiket(t.kivam)}${alerjenPilleri(t.alerjenler, { en: 2 })}</div>
  <div class="kd-tarif__meta">${t.sureDk ? `<span><i class="fa-regular fa-clock" aria-hidden="true"></i>${t.sureDk} dk</span>` : ''}${ogun ? `<span><i class="fa-regular fa-sun" aria-hidden="true"></i>${esc(ogun)}</span>` : ''}</div>
 </div>
</a>`;
}

/* ---------- Evre kartı ---------- */
export function evreKart(kod, { metin, gir = true } = {}) {
  const e = EVRE[kod];
  const v = (veri.evreler.evreler || []).find((x) => x.kod === kod) || {};
  return `<a class="kd-evre${gir ? ' kd-gir' : ''}" href="${evreSayfasi(kod)}" data-renk="${e.renk}" data-evre="${kod}" aria-current="false">
 <span class="kd-evre__sen">Sizin evreniz</span>
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
