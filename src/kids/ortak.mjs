// Dada Gastro Kids — ortak komponent yardımcıları (sahibi: v2-cekirdek; imzalar tasks/v2-sozlesme.md).
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
  'hamilelik': { ad: 'Hamilelik & Lohusalık', kisa: 'Hamilelik', renk: 'pembe', ikon: 'hamile', aralik: '1., 2., 3. trimester ve emzirme', etiket: 'Trimester & emzirme' },
  '0-6-ay':    { ad: '0–6 Ay', kisa: '0–6 ay', renk: 'mavi', ikon: 'biberon', aralik: 'Sıvı beslenme', etiket: 'Sıvı beslenme' },
  '6-8-ay':    { ad: '6–8 Ay', kisa: '6–8 ay', renk: 'seftali', ikon: 'kasik', aralik: 'Ek gıdaya geçiş', etiket: 'Ek gıdaya geçiş' },
  '9-12-ay':   { ad: '9–12 Ay', kisa: '9–12 ay', renk: 'mint', ikon: 'tabak-bolmeli', aralik: 'Pütürlü & parmak gıda', etiket: 'Parmak gıda' },
  '1-3-yas':   { ad: '1–3 Yaş', kisa: '1–3 yaş', renk: 'sari', ikon: 'yurumeye-baslayan', aralik: 'Aile sofrası', etiket: 'Aile sofrası' },
};
export const EVRE_SIRA = Object.keys(EVRE);
export const evreSayfasi = (kod) => `kids-donem-${kod}.html`;

/* ---------- Yaş rozeti (tarifler) ---------- */
export const YASLAR = [6, 8, 9, 12, 18, 24];
export const YAS_ETIKET = { 6: '+6 Ay', 8: '+8 Ay', 9: '+9 Ay', 12: '+12 Ay', 18: '+18 Ay', 24: '+24 Ay' };  // tek biçim: "+N Ay" (karar: tur 2)
export const yasEvresi = (yas) => (yas < 9 ? '6-8-ay' : yas < 12 ? '9-12-ay' : '1-3-yas');
export const yasRenk = (yas) => EVRE[yasEvresi(yas)].renk;
// Tek sistem: yaş bilgisi her yerde "+N Ay" = "N. aydan itibaren" (rozet, filtre, süzme bağı).
// Evre adı (6–8 Ay) tarifin yaşını değil, Dönemler modülündeki yaşam dönemini anlatır; rozet evre rengini taşır.
export const yasAciklama = (yas) => `${yas}. aydan itibaren uygun`;
// V2: eski yasRozet KidsAgeBadge görünümündedir (kd-age-badge); imza aynı, boy yalnız ölçek.
export const yasRozet = (yas, boy = 'm', uzun = false) =>
  `<span class="kd-age-badge kd-yas kd-yas--${boy}" data-yas="${yas}" title="${esc(yasAciklama(yas))}">+${esc(yas)} AY${uzun ? ' için uygundur' : ''}</span>`;

/* ---------- İkon / illüstrasyon (görsel kolunun dosyaları) ---------- */
const _dek = (alt) => (alt ? '' : ' aria-hidden="true"');   // boş alt → dekoratif
export const ikon = (ad, boy = 24, alt = '') => `<img src="varlik/kids/svg/ui/${ad}.svg" width="${boy}" height="${boy}" alt="${esc(alt)}"${_dek(alt)} loading="lazy" decoding="async">`;
// Foto turu (foto-urun): ürün = gerçek ürün fotoğrafı, yuvarlak kırpım. İki çözünürlük (CSS render × 2):
// -k 192px (render ≤ 96px: ay seçici, ızgara, hub, dönem) · -b 560px (render ≤ 280px: büyük görsel).
// Kaynak: varlik/kids/gorsel/urun/<ad>-<k|b>.webp (rapor/tmp/foto/foto-urun/manifest.json).
export const urunYol = (ad, boy = 40) => `varlik/kids/gorsel/urun/${ad}-${boy > 96 ? 'b' : 'k'}.webp`;
export const urunVar = (ad) => !!ad && _var(_kok(urunYol(ad)));
export const urun = (ad, boy = 40, alt = '') => `<img class="kd-urun-foto" src="${urunYol(ad, boy)}" width="${boy}" height="${boy}" alt="${esc(alt)}"${_dek(alt)} style="border-radius:var(--kd-r-daire);object-fit:cover" loading="lazy" decoding="async">`;
// Foto turu: sahne = küçük kare gerçek fotoğraf (kutu ölçüsü aynı; .kd-foto-ikon CSS'i img'yi kutuya sığdırır). İmza aynı.
const SAHNE_FOTO = { 'bos-kase': 'bos/bos-kase', 'meyve-sepeti': 'bolum/mevsim', 'kesim-tahtasi': 'bolum/kesim', 'mama-sandalyesi-sahne': 'arac/hazir-mi-kare', 'tabak-parmak-gida': 'bolum/kivam-parmak' };
/** İkon kutusunun yerine geçen kare/küçük fotoğraf (dekoratifse alt boş). yol: varlik/kids/gorsel/ altı, uzantısız. */
export const fotoIkon = (yol, alt = '', { gen = 160, yuk = 160 } = {}) =>
  `<img class="kd-foto-ikon__img" src="varlik/kids/gorsel/${yol}.webp" alt="${esc(alt)}"${_dek(alt)} width="${gen}" height="${yuk}" loading="lazy" decoding="async">`;
export const sahne = (ad, alt = '') => `<span class="kd-bos__ikon kd-sahne-ikon kd-foto-ikon">${fotoIkon(SAHNE_FOTO[ad] || 'bos/bos-kase', alt, { gen: 128, yuk: 128 })}</span>`;
export const foto = (yol, alt, { gen = 1200, yuk = 900, oncelik = false } = {}) =>
  `<img src="${yol}" alt="${esc(alt)}"${_dek(alt)} width="${gen}" height="${yuk}" ${oncelik ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;

/* ---------- Kıvam ---------- */
const _ks = (ic) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ic}</svg>`;
const KIVAM_SVG = {   // V2: çizgisel, dolgusuz (kase + doku)
  puruzsuz: _ks('<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M7 8.2c1.3-1 2.7-1 4 0s2.7 1 4 0"/>'),
  ezilmis: _ks('<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M7.5 8.2h.01M11.5 7h.01M15.5 8.2h.01M9.5 4.8h.01M13.8 5h.01"/>'),
  parmak: _ks('<rect x="9.5" y="3" width="5" height="13" rx="1.5" transform="rotate(25 12 9.5)"/><path d="M4.5 20.5h15"/>'),
  aile: _ks('<circle cx="12.5" cy="12.5" r="7.5"/><circle cx="12.5" cy="12.5" r="4"/><path d="M2.5 4v4.5M4.5 4v4.5M3.5 8.5V20"/>'),
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
/* Beyar 1 Kas: "Örnek içerik / uzman onayı bekliyor / tıbbi tavsiye yerine geçmez" türü notlar site genelinde KALDIRILDI.
   ornek() imzası korunur (çağrılar kırılmasın) ama hiçbir şey basmaz. Onay iddiası YOK: onaylı metinler yalnız veri/uzman-onay.json onayli:true iken çıkar. */
export const ornek = () => '';
/** Uzman kutusu: yalnız onaylıyken (veri/uzman-onay.json) görünür; onaysızken boş (bekliyor notu kaldırıldı). */
export const onay = () => (_onayli() ? `<div class="kd-onay kd-ikonlu"><span class="kd-onay__ikon kd-ikonlu__ikon"><i class="fa-solid fa-user-doctor" aria-hidden="true"></i></span><b class="kd-ikonlu__baslik">Çocuk doktoru &amp; çocuk diyetisyeni incelemesi</b><small class="kd-ikonlu__metin">İnceleyen: ${_uzmanAdlari()}${ONAY.tarih ? ' · ' + esc(ONAY.tarih) : ''}</small></div>` : '');

/* ---------- Gezinme ---------- */
export const MODULLER = [
  { kod: 'kids', ad: 'Dada Gastro Kids', kisa: 'Ana Sayfa', href: 'kids.html', ikon: 'kalp', renk: 'pembe', ac: '' },
  { kod: 'tarifler', ad: 'Kids Tarifleri', kisa: 'Tarifler', href: 'kids-tarifler.html', ikon: 'kase', renk: 'seftali', foto: 'bolum/tarifler', ac: 'Yaşa, kıvama ve alerjene göre süzülen bebek ve çocuk tarifleri.' },
  { kod: 'donemler', ad: 'Dönemler', kisa: 'Dönemler', href: 'kids-donemler.html', ikon: 'takvim', renk: 'mavi', foto: 'bolum/donemler', ac: 'Hamilelikten 3 yaşa beş evre: beslenme, kıvam, odak besinler.' },
  { kod: 'kesim', ad: 'Güvenli Kesim', kisa: 'Güvenli Kesim', href: 'kids-guvenli-kesim.html', ikon: 'bicak-tahta', renk: 'mint', foto: 'bolum/kesim', ac: 'Besin besin 3 aşamalı kesim: 6–8 ay, 9–12 ay, 12 ay ve sonrası.' },
  { kod: 'mevsim', ad: 'Mevsim Takvimi', kisa: 'Mevsim Takvimi', href: 'kids-mevsim.html', ikon: 'sepet', renk: 'sari', foto: 'bolum/mevsim', ac: 'Ayın tezgâhı, ayın kahramanı ve o ayın tarifleri.' },
  { kod: 'rehber', ad: 'Rehber', kisa: 'Rehber', href: 'kids-rehber.html', ikon: 'kitap', renk: 'pembe', foto: 'bolum/rehber', ac: 'Ek gıdaya geçiş, BLW, öğürme ve boğulma farkı, alerjen tanıtımı.' },
  { kod: 'araclar', ad: 'Araçlar', kisa: 'Araçlar', href: 'kids-araclar.html', ikon: 'arac', renk: 'mavi', foto: 'bolum/araclar', ac: 'Hazır mı kontrol listesi, alerjen takipçisi, öğün planlayıcı, persentil.' },
];

/** Eski "dada kids" yazı imi → V2 kilidi (Gastro logosu + kids rozeti). */
export const yaziIm = (ek = '') => kidsLogoSvg({ sinif: `kd-im ${ek}` });

// Ev ikonu (inline, çizgisel, currentColor): Kids menüsünde "Ana Sayfa" metninin yerine
const EV_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false"><path d="M11.3 3.27a1.1 1.1 0 0 1 1.4 0l8.4 7.06c.78.66.32 1.94-.71 1.94H19v7.63c0 .61-.49 1.1-1.1 1.1h-3.6v-5.4a.9.9 0 0 0-.9-.9h-2.8a.9.9 0 0 0-.9.9V21H6.1c-.61 0-1.1-.49-1.1-1.1v-7.63H3.61c-1.03 0-1.49-1.28-.71-1.94z"/></svg>';
const YARDIM_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><path d="M12 17.2v.1"/></svg>';

/**
 * Kids alt menüsü = yapışkan tek katman (kids.js: aşağı kayınca Gastro header'ı gizlenir, bar top=0'a yapışır).
 * Sol: mini kilit (yalnız yapışıkken görünür, odaklanmaz) + ev ikonu · orta/sağ: kategoriler (mobilde yatay kaydırma) ·
 * en sağ: Yardım düğmesi (yardim.js açar; JS yoksa gizli kalır).
 */
export function altMenu(aktif) {
  const ev = MODULLER[0];
  const evBag = `<a class="kd-ust__ev" href="${ev.href}" aria-label="Dada Gastro Kids ana sayfa"${aktif === ev.kod ? ' aria-current="page"' : ''}>${EV_SVG}</a>`;
  const linkler = MODULLER.slice(1).map((m) => `<a href="${m.href}"${m.kod === aktif ? ' aria-current="page"' : ''}>${esc(m.kisa)}</a>`).join('');
  return `<nav class="kd-ust" aria-label="Dada Gastro Kids menüsü"><div class="wrap">`
    + `<a class="kd-ust__logo" href="${ev.href}" tabindex="-1" aria-hidden="true">${kidsLogoSvg({ sinif: 'kd-ust__logo-svg', etiket: '' })}</a>`
    + `<div class="kd-ust__menu">${evBag}${linkler}</div>`
    + `<button type="button" class="kd-yardim-ac" aria-label="Yardım" aria-expanded="false" aria-controls="kdYardim" hidden>${YARDIM_SVG}<span>Yardım</span></button>`
    + `</div></nav>`;
}

export const sayfa = (icerik, aktif) => `<div class="kd-sayfa">\n${altMenu(aktif)}\n${icerik}\n</div>`;

export function kirinti(parcalar) {
  // parcalar: [['Tarifler','tarifler.html'], ['Dada Gastro Kids','kids.html'], ['Bu sayfa']]
  const ok = '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>';
  const ilk = `<a href="index.html" aria-label="Dada Gastro ana sayfa"><i class="fa-solid fa-house" aria-hidden="true"></i></a>`;
  const AD = { 'Dada Kids': 'Dada Gastro Kids', 'Mevsim': 'Mevsim Takvimi', 'Mevsimsel Takvim': 'Mevsim Takvimi' };   // V2 adları (emniyet ağı)
  return `<nav class="kd-kirinti" aria-label="Sayfa yolu">${ilk}${parcalar.map(([ad, href]) => { ad = AD[ad] || ad; return ok + (href ? `<a href="${href}">${esc(ad)}</a>` : `<b>${esc(ad)}</b>`); }).join('')}</nav>`;
}

export function ustYazi(metin, { ikonAd, renk } = {}) {
  return `<span class="kd-ust-yazi"${renk ? ` data-renk="${renk}"` : ''}>${ikonAd ? ikon(ikonAd, 18) : ''}${esc(metin)}</span>`;
}

/**
 * hero({ renk, kirinti:[...], ust:{metin, ikon}, baslik, giris, eylemler:'html', gorsel:{yol, alt}, sag:'html (gorsel yerine)', kucuk, serit })
 * V2: süs yok (parıltı/bulut). serit:true → güvenlik şeridi hero section'ın hemen ardına eklenir.
 */
export function hero({ renk = 'seftali', kirinti: k = [], ust, baslik, giris, eylemler = '', gorsel, sag, kucuk = false, ek = '', serit = false }) {
  const sagHtml = sag ?? (gorsel ? `<div class="kd-hero__gorsel">${foto(gorsel.yol, gorsel.alt || '', { gen: 1200, yuk: 900, oncelik: true })}</div>` : '');
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
</section>${serit ? '\n' + guvenlikSeridi() : ''}`;
}

export function bolumBasi({ ust, ikonAd, renk, baslik, alt, sag = '' }) {
  return `<div class="kd-bas"><div>${ust ? ustYazi(ust, { ikonAd, renk }) : ''}<h2>${baslik}</h2>${alt ? `<p>${alt}</p>` : ''}</div>${sag}</div>`;
}

/* ---------- Tarif kartı ---------- */
export const tarifHref = (slug) => `kids-tarif.html?t=${encodeURIComponent(slug)}`;
export const OGUN_AD = { kahvalti: 'Kahvaltı', ana: 'Öğle · Akşam', ara: 'Ara öğün' };
/**
 * Tüm bebek tarif kartlarının tek bileşeni (V2). <article>: başlık bağı ::after ile tüm kartı tıklanır yapar
 * (uzatılmış bağ); Kiler düğmesi bağın DIŞINDA ve üst katmanda. data-* kids.js katalog filtresi/sıralaması içindir.
 */
export function tarifKart(t, { gir = true, sira = 0 } = {}) {
  const ogun = (t.ogun || []).map((o) => OGUN_AD[o]).join(' · ');
  const malzeme = (t.malzemeler || []).map((m) => m.anahtar).filter(Boolean).join(' ');
  return `<article class="kd-kart kd-tarif${gir ? ' kd-gir' : ''}" data-renk="${yasRenk(t.yas)}" data-yas="${t.yas}" data-kivam="${t.kivam}" data-ogun="${(t.ogun || []).join(' ')}" data-alerjen="${(t.alerjenler || []).join(' ')}" data-sure="${t.sureDk ?? 999}" data-ad="${esc(t.ad.toLocaleLowerCase('tr'))}" data-malzeme="${esc(malzeme)}" data-sira="${sira}" style="--kd-gecikme:${Math.min(sira, 8) * 40}ms">
 <div class="kd-tarif__medya">${foto(t.gorsel, `${t.ad}: ${(KIVAM_GOSTERGE[t.kivam] || '').toLocaleLowerCase('tr')} kıvamda, ${YAS_ETIKET[t.yas]} için örnek tarif fotoğrafı`, { gen: 1200, yuk: 900 })}${kidsAgeBadge(t.yas)}</div>
 <div class="kd-kart__govde">
  <h3><a class="kd-tarif__bag" href="${tarifHref(t.slug)}">${esc(t.ad)}</a></h3>
  <div class="kd-tarif__olgu">${alerjenPilleri(t.alerjenler)}</div>
  <div class="kd-tarif__meta">${t.sureDk ? `<span><i class="fa-regular fa-clock" aria-hidden="true"></i>${t.sureDk} dk</span>` : ''}${ogun ? `<span><i class="fa-solid fa-utensils" aria-hidden="true"></i>${esc(ogun)}</span>` : ''}</div>
  <div class="kd-tarif__alt"><div class="kd-tarif__alt-ic">${kivamGostergesi(t.kivam)}${kilerDugmesi(t)}</div></div>
 </div>
</article>`;
}

/* ---------- Öneri şeridi: satır her zaman tam ---------- */
/**
 * Bir tarife `adet` öneri: önce aynı evreden, yetmezse komşu evrelerden yaşı en yakın olanlar
 * (küçük yaş önce: bebeğe daha erken tanışılmış kıvam). Açık tarif hiçbir zaman listede olmaz.
 */
export function benzerTarifler(t, hepsi, adet = 4) {
  const sira = (e) => EVRE_SIRA.indexOf(e);
  const uzak = (x) => [Math.abs(sira(x.evre) - sira(t.evre)), x.yas > t.yas ? 1 : 0, Math.abs(x.yas - t.yas)];
  const komsu = hepsi.filter((x) => x.slug !== t.slug && x.evre !== t.evre).map((x, i) => [uzak(x), i, x])
    .sort(([a, i], [b, j]) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || i - j).map(([, , x]) => x);
  return [...hepsi.filter((x) => x.slug !== t.slug && x.evre === t.evre), ...komsu].slice(0, adet);
}
/** Şeridin boş yuvasını CSS ile dolduran kart: görünürlüğü ve genişliği yalnız boş yuvaya göre belirlenir. */
export const seriCta = ({ href = 'kids-tarifler.html', renk = 'mint' } = {}) => ctaKart({ href, ikonAd: 'kase', gorsel: 'bolum/tarifler', baslik: 'Tüm tarifler', metin: 'Yaşa, kıvama ve alerjene göre süzün.', etiket: 'Tarif listesi', renk, sinif: 'kd-seri-cta' });
/** Dörtlü şerit: masaüstü 4 · tablet 2+2 · mobil yatay kaydırma. Kapı [data-izgara-oneri] üzerinden denetler. */
export const tarifSeridi = (liste, { sinif = '', gir = true, tumuHref = 'kids-tarifler.html', renk = 'mint', dortlu = true, kaydir = true } = {}) =>
  `<div class="kd-izgara${dortlu ? ' kd-dortlu' : ''}${kaydir ? ' kd-kaydir-mobil' : ''} ${sinif}" data-izgara-oneri>${liste.map((t, n) => tarifKart(t, { sira: n, gir })).join('')}${seriCta({ href: tumuHref, renk })}</div>`;
/** İçerik sayısı tutmayan ızgarada son yuvayı dolduran yönlendirme kartı (uydurma içerik yok, yalnız yönlendirme). */
export const ctaKart = ({ href, ikonAd, gorsel, baslik, metin, etiket, renk = 'mint', sinif = '' }) =>
  `<a class="kd-kart kd-cta-kart ${sinif}" href="${href}" data-renk="${renk}"><span class="kd-cta-kart__metin kd-ikonlu"><span class="kd-modul__ikon kd-ikonlu__ikon${gorsel ? ' kd-foto-ikon' : ''}">${gorsel ? fotoIkon(gorsel) : ikon(ikonAd, 40)}</span><h3 class="kd-ikonlu__baslik">${esc(baslik)}</h3><p class="kd-ikonlu__metin">${esc(metin)}</p></span><span class="kd-kart__alt">${esc(etiket)} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>`;

/* ---------- Evre kartı ---------- */
export function evreKart(kod, { metin, gir = true } = {}) {
  const e = EVRE[kod];
  const v = (veri.evreler.evreler || []).find((x) => x.kod === kod) || {};
  return `<a class="kd-evre${gir ? ' kd-gir' : ''}" href="${evreSayfasi(kod)}" data-renk="${e.renk}" data-evre="${kod}" aria-current="false">
 <div class="kd-evre__ust kd-ikonlu"><span class="kd-evre__ikon kd-ikonlu__ikon kd-foto-ikon">${fotoIkon(`bolum/evre-${kod}`, '', { gen: 176, yuk: 176 })}</span><div class="kd-ikonlu__baslik"><span class="kd-evre__aralik">${esc(e.etiket)}</span><h3>${esc(e.ad)}</h3></div></div>
 <p>${esc(metin ?? v.slogan ?? v.ozet ?? '')}</p>
 <span class="kd-evre__git">Evreye git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
</a>`;
}

/* ---------- Modül kartı ---------- */
export function modulKart(m, { gir = true } = {}) {
  return `<a class="kd-kart kd-modul kd-ikonlu${gir ? ' kd-gir' : ''}" href="${m.href}" data-renk="${m.renk}">
 <span class="kd-modul__ikon kd-ikonlu__ikon${m.foto ? ' kd-foto-ikon' : ''}">${m.foto ? fotoIkon(m.foto) : ikon(m.ikon, 40)}</span>
 <h3 class="kd-ikonlu__baslik">${esc(m.ad)}</h3>
 <p class="kd-ikonlu__metin">${esc(m.ac)}</p>
 <span class="kd-kart__alt">Keşfet <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
</a>`;
}

export function bosDurum({ baslik = 'Sonuç bulunamadı', metin = '', id = '' } = {}) {
  return `<div class="kd-bos"${id ? ` id="${id}"` : ''} hidden><div class="kd-ikonlu kd-bos__ust"><span class="kd-bos__ikon kd-ikonlu__ikon kd-foto-ikon">${fotoIkon('bos/bos-kase', '', { gen: 128, yuk: 128 })}</span><h3 class="kd-ikonlu__baslik">${esc(baslik)}</h3>${metin ? `<p class="kd-ikonlu__metin">${esc(metin)}</p>` : ''}</div><div class="kd-bos__oneriler"></div></div>`;
}

/* =====================================================================
   TUR 2 yardımcıları — video, zebra bant (illüstrasyon/maskot/ayırıcı V2'de boş)
   ===================================================================== */
import { existsSync as _var } from 'node:fs';
const _kok = (p) => path.join(KOK, p);

/** V2: kawaii illüstrasyon, maskot ve dalga/bulut ayırıcı YOK. Çağrılar boş döner (emniyet ağı; sayfa ajanları çağrıları kaldırıyor). */
export const illus = () => '';
export const maskot = () => '';
export const ayirici = () => '';

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
   Dada Gastro Kids LOGO — V2: Dada Gastro kurumsal logosu AYNEN + sade pastel "kids" rozeti.
   Header'da logo değişmez; rozet yalnız CSS (.pg-kids .brand::after, kids.css). Bağımsız kilit
   (mega şeridi, ana sayfa bandı, hub, yapışkan bar mini logosu) bu SVG'dir. Dağınık harf ve figür yok.
   Koordinatlar Gastro logo viewBox'ında (921.855 214.449 1721.825 348.042); rozet sağa eklenir.
   ===================================================================== */
import { readFileSync } from 'node:fs';
const _gastroLogo = (() => {
  try {
    const s = readFileSync(path.join(KOK, 'src/donor/ana.html'), 'utf8');
    const i = s.indexOf('<span class="brand-word"><svg'); const ac = s.indexOf('>', s.indexOf('<svg', i)) + 1; const j = s.indexOf('</svg>', ac);
    return s.slice(ac, j).replace(/<title>[\s\S]*?<\/title>/g, '');
  } catch { return ''; }
})();
// "kids": v1'deki renkli harfler (pembe/mavi/turuncu/yeşil), düz (döndürme yok), Gilroy ExtraBold; zemin/rozet kutusu yok (Beyar 1 Kas).
const KIDS_HARF = [['k', '#D4557C'], ['i', '#3F82C4'], ['d', '#D9783A'], ['s', '#23906C']];
const ROZET = { x: 2700, y: 300, g: 470, h: 222 };
const _rozet = () => `<text class="kd-logo-rozet" aria-hidden="true" x="${ROZET.x}" y="${ROZET.y + 196}" font-family="GilroyXB, Gilroy, sans-serif" font-weight="800" font-size="250" textLength="${ROZET.g}" lengthAdjust="spacingAndGlyphs">${KIDS_HARF.map(([h, r]) => `<tspan fill="${r}">${h}</tspan>`).join('')}</text>`;

/** Eski header grubu (dağınık "kids" + figürler) V2'de yok: header logosu değişmez. */
export const kidsLogoGrup = () => '';

/** "Dada Gastro Kids" kilidi: Gastro logosu + kids rozeti. Renk: CSS color (Gastro logo yolları currentColor). */
export function kidsLogoSvg({ sinif = '', etiket = 'Dada Gastro Kids' } = {}) {
  const sonX = ROZET.x + ROZET.g + 8;
  const vb = `921.855 214.449 ${(sonX - 921.855).toFixed(3)} 348.042`;
  const erisim = etiket ? `role="img" aria-label="${esc(etiket)}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="kd-logo-svg ${sinif}" viewBox="${vb}" ${erisim} xmlns="http://www.w3.org/2000/svg">${_gastroLogo}${_rozet()}</svg>`;
}

/* =====================================================================
   V2 SÖZLEŞMESİ (tasks/v2-sozlesme.md) — bileşen imzaları sabit; görünüm v2-cekirdek'te
   ===================================================================== */
/** Uzman onayı tek kaynak: veri/uzman-onay.json. onayli=false iken onay iddiası YOK. */
export const ONAY = await jsonOku('veri/uzman-onay.json', { onayli: false, uzmanlar: [], tarih: null });
const _onayli = () => ONAY.onayli === true && Array.isArray(ONAY.uzmanlar) && ONAY.uzmanlar.length > 0;
const _uzmanAdlari = () => ONAY.uzmanlar.map((u) => `${esc(u.ad)}${u.unvan ? ', ' + esc(u.unvan) : ''}`).join(' · ');
/** Hero güven rozeti: yalnız onaylıyken görünür (veri/uzman-onay.json tek bayrak); onaysızken boş. */
export function guvenRozeti({ sinif = '' } = {}) {
  if (_onayli()) return `<p class="kd-guven-rozet kd-guven-rozet--onayli ${sinif}" data-kd-onay="onayli"><span class="kd-guven-rozet__ikon" aria-hidden="true"></span><span><b>Çocuk Doktoru &amp; Çocuk Diyetisyeni Onaylı Bilgiler</b><small>İnceleyen: ${_uzmanAdlari()}${ONAY.tarih ? ' · ' + esc(ONAY.tarih) : ''}</small></span></p>`;
  return '';  // onaysızken rozet alanı gizli (Beyar 1 Kas); onay gelince veri/uzman-onay.json onayli:true → yukarıdaki satır
}
/** Makale / tarif sayfası: "İnceleyen uzman" alanı; yalnız onaylıyken görünür. */
export function inceleyenUzman({ sinif = '' } = {}) {
  if (!_onayli()) return '';  // onaysızken "İnceleme bekliyor" satırı gizli (Beyar 1 Kas)
  const deger = `${_uzmanAdlari()}${ONAY.tarih ? ` <span class="kd-ikincil">· ${esc(ONAY.tarih)}</span>` : ''}`;
  return `<p class="kd-inceleyen ${sinif}" data-kd-onay="${_onayli() ? 'onayli' : 'bekliyor'}"><span class="kd-inceleyen__etiket">İnceleyen uzman</span> <span class="kd-inceleyen__deger">${deger}</span></p>`;
}
/** Hero altı kalıcı güvenlik şeridi (kapatılamaz). */
export const YASAKLI_REHBER = 'kids-rehber-yasakli-gidalar.html';
export function guvenlikSeridi() {
  return `<aside class="kd-guvenlik-serit" role="note" aria-label="1 yaş öncesi güvenlik uyarısı"><div class="wrap"><p><span class="kd-guvenlik-serit__ikon" aria-hidden="true">⚠</span><span>1 yaşından küçük bebeklere tuz, rafine şeker, bal ve inek sütü (ana içecek olarak) verilmemelidir.</span> <a href="${YASAKLI_REHBER}">Yasaklı Gıdalar Rehberini İncele <span aria-hidden="true">→</span></a></p></div></aside>`;
}
/** KidsAgeBadge: tarif kartı sol üst, yüksek kontrast, "+N AY". Tek bileşen. */
export const kidsAgeBadge = (yas) => `<span class="kd-age-badge" data-yas="${yas}" title="${esc(yasAciklama(yas))}">+${yas} AY</span>`;
/** Kıvam göstergesi: kart altında. Etiketler sabit. */
export const KIVAM_GOSTERGE = { puruzsuz: 'Pürüzsüz Püre', ezilmis: 'Çatalla Ezilmiş', parmak: 'BLW Parmak Gıda', aile: 'Aile Sofrası' };
export const kivamGostergesi = (k) => `<span class="kd-kivam" data-kivam="${esc(k)}">${KIVAM_SVG[k] || ''}<span>${esc(KIVAM_GOSTERGE[k] || k)}</span></span>`;
/** Bebek Kilerime Ekle düğmesi (davranış: varlik/kids/js/kiler.js, olay delegasyonu). */
export const kilerDugmesi = (t) => `<button type="button" class="kd-kiler-ekle" data-kd-kiler-ekle="${esc(t.slug)}" data-ad="${esc(t.ad)}" data-malzeme="${esc((t.malzemeler || []).map((m) => m.anahtar).filter(Boolean).join(' '))}"><span aria-hidden="true">+</span> Bebek Kilerime Ekle</button>`;
