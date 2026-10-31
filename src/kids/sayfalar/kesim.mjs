// Dada Kids — Güvenli Kesim atlası (sahibi: sayfalar kolu)
// Veri: veri/kesim.json  [{slug, ad, grup, sekil, renk, ikon, risk, pisirme, asamalar:{"6-8","9-12","12+"}, asla, ezilmeTesti}]
// Her besin kartında 3 aşama illüstrasyonu bu dosyadaki parametrik SVG üreticisiyle (sekil + renk) çizilir.

const ASAMALAR = [
  { anahtar: '6-8', ad: '6–8 ay', beceri: 'Avuç kavrama', renk: 'seftali', zemin: '#FFEBDD' },
  { anahtar: '9-12', ad: '9–12 ay', beceri: 'Kıskaç tutuşu', renk: 'mint', zemin: '#DDF4EA' },
  { anahtar: '12+', ad: '12 ay +', beceri: 'Isırma & çiğneme', renk: 'sari', zemin: '#FFF4CC' },
];
const RISK = {
  dusuk: { ad: 'Düşük', ikon: 'fa-circle-check' },
  orta: { ad: 'Orta', ikon: 'fa-circle-exclamation' },
  yuksek: { ad: 'Yüksek', ikon: 'fa-triangle-exclamation' },
};
const RENK_ADI = {
  turuncu: '#F59A4A', kirmizi: '#E8584F', yesil: '#7CC46A', 'koyu-yesil': '#4E9A55', sari: '#F7CF4B', mor: '#8E5BA8', krem: '#F4E6C8',
  kahve: '#B7835A', pembe: '#F29BB0', beyaz: '#F7F2E8', bej: '#E9D3A8', 'acik-yesil': '#B5D96B', mavi: '#7FA9D9',
};
const GRUP_AD = { sebze: 'Sebze', meyve: 'Meyve', protein: 'Protein', tahil: 'Tahıl', 'sut-urunu': 'Süt ürünü', 'süt ürünü': 'Süt ürünü', kuruyemis: 'Kuruyemiş', baklagil: 'Baklagil' };
const GRUP_IKON = { protein: 'fa-drumstick-bite', tahil: 'fa-wheat-awn', 'sut-urunu': 'fa-cheese', 'süt ürünü': 'fa-cheese', baklagil: 'fa-seedling', kuruyemis: 'fa-seedling' };
const ESANLAM_EK = { 'kiraz-domates': ['çeri domates', 'cherry domates', 'domates'], uzum: ['üzüm tanesi'], 'yaban-mersini': ['blueberry'] };

/* ---------- Türkçe duyarsız arama anahtarı (kesim.js ile aynı kural) ---------- */
export const normal = (s) => String(s || '').toLocaleLowerCase('tr')
  .replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u')
  .replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u').replace(/\s+/g, ' ').trim();

/* ---------- Renk yardımcıları ---------- */
function hexCoz(r) {
  if (typeof r === 'string' && /^#?[0-9a-f]{6}$/i.test(r.trim())) return '#' + r.trim().replace('#', '').toUpperCase();
  return RENK_ADI[normal(r).replace(/\s+/g, '-')] || '#F59A4A';
}
function karistir(hex, hedef, oran) {
  const a = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  const b = hedef.match(/\w\w/g).map((x) => parseInt(x, 16));
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * oran).toString(16).padStart(2, '0')).join('');
}

/* =====================================================================
   Parametrik kesim illüstrasyonu
   viewBox 0 0 200 130 · 1 birim ≈ 1 mm · sağda yetişkin parmak ucu (≈ 18 mm) ölçek için
   ===================================================================== */
export function kesimSvg(sekil, renkGir, asama, { verilmez = false, baslik = '' } = {}) {
  const c = hexCoz(renkGir);
  const k = karistir(c, '#3A2E2A', 0.45); // kontur
  const a = karistir(c, '#FFFFFF', 0.45); // parlama
  const ust = karistir(c, '#FFFFFF', 0.25);
  const yan = karistir(c, '#3A2E2A', 0.18);
  const z = ASAMALAR[asama].zemin;
  const st = `stroke="${k}" stroke-width="1.6" stroke-linejoin="round"`;
  const p = [];

  const cubuk = (x, y, uz, kal, aci = 0) => p.push(`<g transform="translate(${x} ${y}) rotate(${aci})"><rect x="${-uz / 2}" y="${-kal / 2}" width="${uz}" height="${kal}" rx="${Math.min(kal / 2, 7)}" fill="${c}" ${st}/><rect x="${-uz / 2 + 4}" y="${-kal / 2 + 2.2}" width="${uz * 0.55}" height="${Math.max(1.6, kal * 0.18)}" rx="1" fill="${a}" opacity=".8"/></g>`);
  const parca = (x, y, s, aci = 0, yuvar = 3) => p.push(`<g transform="translate(${x} ${y}) rotate(${aci})"><rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${yuvar}" fill="${c}" ${st}/><circle cx="${-s / 5}" cy="${-s / 5}" r="${Math.max(1, s / 7)}" fill="${a}"/></g>`);
  const kup = (x, y, s) => {
    const d = s * 0.32;
    p.push(`<g transform="translate(${x - s / 2} ${y - s / 2})"><path d="M0 ${d}L${d} 0H${s + d}L${s} ${d}Z" fill="${ust}" ${st}/><path d="M${s} ${d}L${s + d} 0V${s}L${s} ${s + d}Z" fill="${yan}" ${st}/><rect y="${d}" width="${s}" height="${s}" rx="2" fill="${c}" ${st}/></g>`);
  };
  // boyuna çeyrek (kama): çeyrek elips, merkezden dışa doğru aralıklı
  const kama = (x, y, rx, ry, aci, ic = null) => {
    const ofs = 2.6;
    p.push(`<g transform="translate(${x} ${y}) rotate(${aci}) translate(${ofs} ${-ofs})"><path d="M0 0V${-ry}A${rx} ${ry} 0 0 1 ${rx} 0Z" fill="${ic ? '#FFFDF6' : c}" ${st}/>${ic ? `<path d="M0 0V${-ry * 0.52}A${rx * 0.52} ${ry * 0.52} 0 0 1 ${rx * 0.52} 0Z" fill="${ic}"/>` : `<path d="M${rx * 0.25} ${-ry * 0.62}q${rx * 0.25} ${-ry * 0.12} ${rx * 0.42} ${ry * 0.12}" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round"/>`}</g>`);
  };
  const dortluKama = (x, y, rx, ry, ic = null) => [0, 90, 180, 270].forEach((aci) => kama(x, y, rx, ry, aci, ic));
  const mizrak = (x, y, uz, gen, aci) => p.push(`<g transform="translate(${x} ${y}) rotate(${aci})"><path d="M${-uz / 2} 0Q${-uz / 4} ${-gen} ${uz / 2 - 4} ${-gen * 0.42}Q${uz / 2 + 2} 0 ${uz / 2 - 4} ${gen * 0.42}Q${-uz / 4} ${gen} ${-uz / 2} 0Z" fill="${c}" ${st}/><path d="M${-uz / 2 + 8} ${-gen * 0.3}Q${-uz / 6} ${-gen * 0.62} ${uz / 4} ${-gen * 0.42}" fill="none" stroke="${a}" stroke-width="2.2" stroke-linecap="round"/></g>`);
  const yarimAy = (x, y, gen, kal, aci) => p.push(`<g transform="translate(${x} ${y}) rotate(${aci})"><path d="M${-gen / 2} 0A${gen / 2} ${kal} 0 0 1 ${gen / 2} 0Z" fill="${c}" ${st}/><path d="M${-gen / 2 + 3} -1.5H${gen / 2 - 3}" stroke="${a}" stroke-width="1.6" stroke-linecap="round"/></g>`);
  const cicek = (x, y, o) => {
    const sap = karistir(c, '#FFFFFF', 0.35);
    p.push(`<g transform="translate(${x} ${y}) scale(${o})"><path d="M-6 0Q-5 -18 -2 -24H4Q6 -18 7 0Z" fill="${sap}" ${st}/>${[[-12, -28, 9], [0, -34, 10], [12, -28, 9], [-6, -38, 8], [7, -40, 8]].map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" ${st}/>`).join('')}<circle cx="-3" cy="-38" r="2.4" fill="${a}"/><circle cx="9" cy="-31" r="2" fill="${a}"/></g>`);
  };
  const serit = (x, y, uz, aci) => p.push(`<g transform="translate(${x} ${y}) rotate(${aci})"><path d="M${-uz / 2} 0q${uz / 8} -5 ${uz / 4} 0t${uz / 4} 0t${uz / 4} 0t${uz / 4} 0" fill="none" stroke="${k}" stroke-width="10.5" stroke-linecap="round"/><path d="M${-uz / 2} 0q${uz / 8} -5 ${uz / 4} 0t${uz / 4} 0t${uz / 4} 0t${uz / 4} 0" fill="none" stroke="${c}" stroke-width="7.5" stroke-linecap="round"/><path d="M${-uz / 2 + 4} -1.5q${uz / 8} -4 ${uz / 4} 0" fill="none" stroke="${a}" stroke-width="1.6" stroke-linecap="round"/></g>`);
  const lop = (x, y, s, aci) => p.push(`<g transform="translate(${x} ${y}) rotate(${aci})"><path d="M${-s / 2} ${-s / 6}Q${-s / 3} ${-s / 2} ${s / 6} ${-s / 2.3}Q${s / 1.8} ${-s / 4} ${s / 2.2} ${s / 5}Q${s / 4} ${s / 1.9} ${-s / 5} ${s / 2.4}Q${-s / 1.7} ${s / 4} ${-s / 2} ${-s / 6}Z" fill="${c}" ${st}/><circle cx="${-s / 6}" cy="${-s / 6}" r="${s / 8}" fill="${a}"/></g>`);
  const omlet = (x, y, uz, kal, aci) => p.push(`<g transform="translate(${x} ${y}) rotate(${aci})"><rect x="${-uz / 2}" y="${-kal / 2}" width="${uz}" height="${kal}" rx="5" fill="${c}" ${st}/>${[-0.3, 0, 0.28].map((f, i) => `<circle cx="${uz * f}" cy="${i % 2 ? 2 : -2}" r="1.8" fill="${a}"/>`).join('')}</g>`);
  const butunCarpi = (x, y, r) => p.push(`<g transform="translate(${x} ${y})"><circle r="${r}" fill="${c}" ${st}/><circle r="${r + 4.5}" fill="none" stroke="#C0392B" stroke-width="3"/><path d="M${-(r + 3)} ${r + 3}L${r + 3} ${-(r + 3)}" stroke="#C0392B" stroke-width="3" stroke-linecap="round"/></g>`);

  if (verilmez) {
    p.push(`<g transform="translate(86 65)"><circle r="30" fill="#FDECEC" stroke="#C0392B" stroke-width="4"/><path d="M-14 -14L14 14M14 -14L-14 14" stroke="#C0392B" stroke-width="5" stroke-linecap="round"/></g>`);
  } else {
    const s = `${sekil}|${asama}`;
    switch (s) {
      case 'cubuk|0': cubuk(84, 44, 62, 15, -8); cubuk(88, 86, 62, 15, 6); break;
      case 'cubuk|1': [[38, 40], [64, 34], [92, 42], [120, 36], [46, 74], [74, 68], [102, 78], [130, 70], [60, 100], [112, 104]].forEach(([x, y], i) => parca(x, y, 10, i * 17)); break;
      case 'cubuk|2': [30, 52, 74, 96].forEach((y, i) => cubuk(88, y, 58, 6.5, i % 2 ? 4 : -4)); break;
      case 'yuvarlak|0': dortluKama(52, 64, 14, 9.5); dortluKama(116, 64, 14, 9.5); break;
      case 'yuvarlak|1': dortluKama(52, 64, 9.5, 13); dortluKama(116, 64, 9.5, 13); break;
      case 'yuvarlak|2': dortluKama(44, 48, 9.5, 13); dortluKama(100, 48, 9.5, 13); dortluKama(66, 98, 9.5, 13); butunCarpi(130, 98, 10); break;
      case 'yumusak-dilim|0': mizrak(84, 42, 70, 22, -6); mizrak(86, 88, 70, 22, 5); break;
      case 'yumusak-dilim|1': [[40, 42], [66, 38], [94, 44], [122, 40], [52, 72], [80, 70], [108, 74], [136, 70], [66, 100], [100, 102]].forEach(([x, y], i) => parca(x, y, 11, i * 11, 3.5)); break;
      case 'yumusak-dilim|2': [[50, 44, -12], [96, 40, 8], [132, 52, 20], [62, 84, 6], [108, 88, -10]].forEach(([x, y, r]) => yarimAy(x, y, 38, 14, r)); break;
      case 'cicek|0': cicek(58, 112, 1.25); cicek(122, 112, 1.05); break;
      case 'cicek|1': [[38, 62], [72, 56], [108, 62], [140, 58], [52, 110], [92, 108], [128, 110]].forEach(([x, y]) => cicek(x, y, 0.5)); break;
      case 'cicek|2': {
        const n = [[30, 40, 4], [44, 30, 3], [58, 46, 3.5], [74, 34, 3], [90, 44, 4], [106, 32, 3], [124, 44, 3.5], [140, 34, 3], [36, 70, 3], [52, 62, 4], [70, 74, 3], [88, 64, 3.5], [104, 76, 3], [122, 66, 4], [142, 76, 3], [40, 98, 3.5], [62, 104, 3], [84, 96, 4], [104, 106, 3], [126, 98, 3.5], [146, 106, 3]];
        n.forEach(([x, y, r], i) => p.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 4 === 0 ? karistir(c, '#FFFFFF', 0.35) : c}" ${st}/>`));
        break;
      }
      case 'et|0': serit(84, 36, 64, -4); serit(80, 64, 60, 3); serit(88, 92, 62, -2); break;
      case 'et|1': [[38, 40], [66, 34], [96, 42], [128, 36], [50, 72], [80, 68], [112, 74], [140, 68], [64, 102], [100, 104], [132, 100]].forEach(([x, y], i) => lop(x, y, 12, i * 33)); break;
      case 'et|2': [[34, 36], [56, 32], [80, 38], [104, 33], [128, 38], [44, 62], [68, 66], [92, 60], [116, 66], [140, 60], [56, 94], [82, 98], [108, 92], [134, 98]].forEach(([x, y], i) => parca(x, y, 8.5, i * 13, 2)); break;
      case 'yumurta|0': omlet(84, 36, 60, 15, -5); omlet(80, 66, 60, 15, 3); omlet(88, 96, 60, 15, -2); break;
      case 'yumurta|1': [[40, 40], [68, 36], [98, 44], [128, 38], [52, 74], [82, 70], [114, 76], [66, 104], [100, 104]].forEach(([x, y], i) => parca(x, y, 13, i * 23, 4)); break;
      case 'yumurta|2': [[56, 52, -8], [118, 50, 6], [58, 98, 4], [118, 96, -6]].forEach(([x, y, r]) => p.push(`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-22 0A22 15 0 0 1 22 0Z" fill="#FFFDF6" ${st}/><path d="M-11 0A11 8 0 0 1 11 0Z" fill="${c}"/><path d="M-22 0H22" stroke="${k}" stroke-width="1.6" stroke-linecap="round"/></g>`)); break;
      case 'kup|0': kup(60, 70, 30); kup(118, 68, 30); break;
      case 'kup|1': [[40, 42], [70, 38], [100, 44], [130, 40], [50, 78], [82, 74], [114, 80], [66, 108], [100, 108]].forEach(([x, y]) => kup(x, y, 11)); break;
      case 'kup|2': [[34, 36], [58, 32], [84, 38], [110, 34], [136, 38], [44, 66], [70, 62], [96, 68], [122, 64], [56, 96], [84, 100], [112, 94], [138, 98]].forEach(([x, y]) => kup(x, y, 8)); break;
      default: [[46, 50], [84, 46], [122, 52], [64, 90], [104, 92]].forEach(([x, y]) => parca(x, y, asama === 0 ? 22 : asama === 1 ? 12 : 9));
    }
  }
  // Yetişkin parmak ucu (ölçek)
  const parmak = `<g class="kd-kparmak" fill="#FFFFFF" fill-opacity=".55" stroke="#8C796C" stroke-width="1.4" stroke-dasharray="3 2.4"><path d="M166 127V92a10 10 0 0 1 20 0v35"/><rect x="170" y="85" width="12" height="13" rx="5.5" stroke-dasharray="none" stroke-opacity=".6"/></g>`;
  return `<svg viewBox="0 0 200 130" role="img" aria-label="${baslik}" focusable="false"><rect x="2" y="2" width="196" height="126" rx="18" fill="${z}"/><rect x="2" y="2" width="196" height="126" rx="18" fill="none" stroke="#3A2E2A" stroke-opacity=".07" stroke-width="2"/>${p.join('')}${parmak}</svg>`;
}

/* ---------- "Asla bütün vermeyin" mini şemaları ---------- */
function yasakSvg(tur) {
  const ic = {
    uzum: '<g stroke="#5B2C6F" stroke-width="1.6"><circle cx="30" cy="27" r="9" fill="#9B59B6"/><circle cx="44" cy="31" r="9" fill="#8E44AD"/><circle cx="36" cy="43" r="9" fill="#9B59B6"/></g><path d="M37 18q3-7 9-8" stroke="#6B4F2A" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="27" cy="24" r="2.4" fill="#fff" opacity=".6"/>',
    domates: '<g stroke="#8E2A1F" stroke-width="1.6"><circle cx="30" cy="36" r="11" fill="#E74C3C"/><circle cx="46" cy="34" r="10" fill="#E8584F"/></g><path d="M26 25l4 3 4-3M42 24l4 3 4-3" stroke="#3E8E41" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="26" cy="32" r="2.4" fill="#fff" opacity=".6"/>',
    kuruyemis: '<g stroke="#6E4A2A" stroke-width="1.6"><path d="M22 40c0-9 6-16 12-16s12 7 12 16-6 12-12 12-12-3-12-12z" fill="#C48A55"/><ellipse cx="46" cy="30" rx="8" ry="10" fill="#D9A066" transform="rotate(25 46 30)"/></g><path d="M28 30q6-3 12 0" stroke="#8C5E36" stroke-width="1.4" fill="none"/>',
    misir: '<g stroke="#B08A2E" stroke-width="1.5" fill="#FFF7DC"><circle cx="28" cy="34" r="7"/><circle cx="36" cy="27" r="7"/><circle cx="43" cy="35" r="7"/><circle cx="35" cy="41" r="7"/></g><circle cx="36" cy="34" r="3" fill="#F4C542"/><circle cx="46" cy="44" r="2.4" fill="#F4C542"/>',
    sebze: '<g stroke="#9A4415" stroke-width="1.6"><rect x="16" y="31" width="40" height="11" rx="5" fill="#F59A4A" transform="rotate(-18 36 36)"/></g><path d="M52 24q5-4 9-2M52 26q5 0 8 4" stroke="#3E8E41" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M24 40l3-4M33 37l3-4M42 34l3-4" stroke="#C26A2A" stroke-width="1.4"/>',
  }[tur] || '';
  return `<svg viewBox="0 0 72 72" aria-hidden="true" focusable="false"><circle cx="36" cy="36" r="34" fill="#fff"/>${ic}<circle cx="36" cy="36" r="30" fill="none" stroke="#C0392B" stroke-width="4.5"/><path d="M15 57L57 15" stroke="#C0392B" stroke-width="4.5" stroke-linecap="round"/></svg>`;
}

const TEHLIKELER = [
  { tur: 'uzum', ad: 'Bütün üzüm', neden: 'Yuvarlak ve kaygan; soluk yolunu tam olarak tıkayabilir.', yerine: 'Boyuna dörde bölün; küçük bebeklerde ayrıca hafifçe ezin.', yas: '4 yaşına kadar bütün verilmez', slug: 'uzum' },
  { tur: 'domates', ad: 'Kiraz (çeri) domates', neden: 'Üzüm gibi yuvarlak ve kaygandır; kabuğu da kayar.', yerine: 'Boyuna dörde bölün; yaban mersini ve zeytin için de aynısını yapın.', yas: '4 yaşına kadar bütün verilmez', slug: 'kiraz-domates' },
  { tur: 'kuruyemis', ad: 'Bütün kuruyemiş', neden: 'Fındık, fıstık, badem ve ceviz sert ve küçüktür; çiğnenmeden yutulabilir.', yerine: 'Şekersiz-tuzsuz ezmesini sulandırıp püreye karıştırın ya da çok ince sürün.', yas: '5 yaşına kadar bütün ya da iri parça verilmez', slug: '' },
  { tur: 'misir', ad: 'Patlamış mısır', neden: 'Sert taneler ve kabuk parçaları nefesle birlikte soluk yoluna kaçabilir.', yerine: 'Ağızda kolayca yumuşayan atıştırmalıklar: pişmiş sebze çubukları, olgun meyve.', yas: 'Küçük çocuklara önerilmez', slug: '' },
  { tur: 'sebze', ad: 'Sert çiğ sebze ve meyve', neden: 'Çiğ havuç ya da elma dilimi gibi sert parçalar kopar ve çiğnenemeden yutulabilir.', yerine: 'Yumuşayana kadar pişirin ya da ince rendeleyin.', yas: 'Çiğneme becerisi gelişene kadar iri sert parça yok', slug: 'havuc' },
];

/* ---------- kesim.json yoksa besinler.json'dan asgari atlas ---------- */
const YEDEK_SEKIL = { uzum: ['yuvarlak', 'mor'], 'kiraz-domates': ['yuvarlak', 'kirmizi'], havuc: ['cubuk', 'turuncu'], elma: ['yumusak-dilim', 'acik-yesil'], muz: ['yumusak-dilim', 'sari'], avokado: ['yumusak-dilim', 'yesil'], balkabagi: ['cubuk', 'turuncu'], yumurta: ['yumurta', 'sari'], balik: ['et', 'krem'] };
function yedekAtlas(besinler) {
  return besinler.filter((b) => YEDEK_SEKIL[b.slug] && b.ilkSunum).map((b) => ({
    slug: b.slug, ad: b.ad, grup: b.grup, sekil: YEDEK_SEKIL[b.slug][0], renk: YEDEK_SEKIL[b.slug][1], ikon: b.slug, risk: b.bogulmaRiski || 'orta',
    pisirme: '', asamalar: { '6-8': { nasil: b.ilkSunum['6'] }, '9-12': { nasil: b.ilkSunum['9'] }, '12+': { nasil: b.ilkSunum['12'] } }, asla: b.bogulmaRiski === 'yuksek' ? b.gerekce : '', ezilmeTesti: false,
  }));
}

export default async function kesim(o) {
  const { esc, ikon, urun } = o;
  const besinler = o.veri.besinler.besinler || [];
  const besinHarita = new Map(besinler.map((b) => [b.slug, b]));
  const ham = Array.isArray(o.veri.kesim) && o.veri.kesim.length ? o.veri.kesim : yedekAtlas(besinler);
  const atlas = ham.filter((x) => x && x.slug && x.ad).slice().sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
  const sluglar = new Set(atlas.map((x) => x.slug));
  const buyukHarf = (s) => GRUP_AD[s] || String(s || '').replace(/-/g, ' ').replace(/^./, (c) => c.toLocaleUpperCase('tr'));
  const besinIkon = (x) => (x.ikon ? urun(x.ikon, 52) : `<i class="fa-solid ${x.slug === 'yumurta' ? 'fa-egg' : GRUP_IKON[x.grup] || 'fa-utensils'}" aria-hidden="true"></i>`);

  // Gruplar (çoktan aza)
  const grupSay = new Map();
  for (const x of atlas) if (x.grup) grupSay.set(x.grup, (grupSay.get(x.grup) || 0) + 1);
  const gruplar = [...grupSay.entries()].sort((a, b) => b[1] - a[1]);
  const riskSay = { dusuk: 0, orta: 0, yuksek: 0 };
  for (const x of atlas) if (riskSay[x.risk] !== undefined) riskSay[x.risk]++;

  /* ---------- Besin kartı ---------- */
  function asamaHucre(x, n) {
    const as = ASAMALAR[n];
    const v = (x.asamalar || {})[as.anahtar] || {};
    const obj = typeof v === 'string' ? { nasil: v } : v;
    const verilmez = obj.verilmez === true || !(obj.nasil || obj.boyut);
    const aciklama = verilmez ? `${x.ad}, ${as.ad}: bu formda verilmez` : `${x.ad}, ${as.ad}: ${obj.boyut || obj.nasil}`;
    return `<li class="kd-kasama${verilmez ? ' kd-kasama--yok' : ''}" data-renk="${as.renk}">
      <div class="kd-kasama__ust"><span class="kd-kasama__yas">${as.ad}</span><small>${as.beceri}</small></div>
      <figure class="kd-kasama__sekil">${kesimSvg(x.sekil, x.renk, n, { verilmez, baslik: esc(aciklama) })}</figure>
      ${verilmez
        ? `<p class="kd-kasama__yok"><i class="fa-solid fa-ban" aria-hidden="true"></i> Bu formda verilmez</p>${obj.ipucu ? `<p class="kd-kasama__ipucu">${esc(obj.ipucu)}</p>` : ''}`
        : `${obj.boyut ? `<p class="kd-kasama__boyut"><i class="fa-solid fa-ruler" aria-hidden="true"></i><span><span class="kd-gizli">Boyut: </span>${esc(obj.boyut)}</span></p>` : ''}
      ${obj.nasil ? `<p class="kd-kasama__nasil">${esc(obj.nasil)}</p>` : ''}
      ${obj.ipucu ? `<p class="kd-kasama__ipucu"><i class="fa-regular fa-lightbulb" aria-hidden="true"></i><span>${esc(obj.ipucu)}</span></p>` : ''}`}
    </li>`;
  }

  function kart(x, n) {
    const b = besinHarita.get(x.slug) || {};
    const ara = normal([x.ad, x.grup, ...(x.esAnlamlar || []), ...(b.esAnlamlar || []), ...(ESANLAM_EK[x.slug] || [])].join(' '));
    const r = RISK[x.risk] || null;
    const ezilme = x.ezilmeTesti
      ? `<p class="kd-kesim__ezilme"><span class="kd-kesim__ezilme-ikon" aria-hidden="true"><i class="fa-solid fa-hand-back-fist"></i></span><span><b>Ezilme testi</b> ${esc(typeof x.ezilmeTesti === 'string' ? x.ezilmeTesti : 'Pişmiş parçayı başparmağınızla işaret parmağınız arasında hafifçe bastırın; kolayca eziliyorsa bebeğiniz için yeterince yumuşaktır.')}</span></p>`
      : '';
    const asla = x.asla ? `<p class="kd-kesim__asla"><span class="kd-kesim__asla-ikon" aria-hidden="true"><i class="fa-solid fa-xmark"></i></span><span><b>Asla:</b> ${esc(x.asla)}</span></p>` : '';
    return `<article class="kd-kesim kd-gir" id="${esc(x.slug)}" data-grup="${esc(x.grup || '')}" data-risk="${esc(x.risk || '')}" data-ara="${esc(ara)}" aria-labelledby="k-${esc(x.slug)}" style="--kd-gecikme:${Math.min(n % 4, 3) * 50}ms">
  <header class="kd-kesim__bas">
   <span class="kd-kesim__ikon" data-grup="${esc(x.grup || '')}">${besinIkon(x)}</span>
   <div class="kd-kesim__ad"><h3 id="k-${esc(x.slug)}">${esc(x.ad)}</h3>${x.grup ? `<small>${esc(buyukHarf(x.grup))}</small>` : ''}</div>
   ${r ? `<span class="kd-krisk" data-risk="${x.risk}"><i class="fa-solid ${r.ikon}" aria-hidden="true"></i><span><span class="kd-krisk__on">Boğulma riski: </span>${r.ad}</span></span>` : ''}
   <a class="kd-kesim__bag" href="#${esc(x.slug)}" aria-label="${esc(x.ad)} kartının bağlantısı" title="Bu kartın bağlantısı"><i class="fa-solid fa-link" aria-hidden="true"></i></a>
  </header>
  ${x.pisirme ? `<p class="kd-kesim__pisirme"><i class="fa-solid fa-fire-burner" aria-hidden="true"></i><span><b>Hazırlık:</b> ${esc(x.pisirme)}</span></p>` : ''}
  <ol class="kd-kesim__asamalar" aria-label="${esc(x.ad)}: yaşa göre kesim">${ASAMALAR.map((_, i) => asamaHucre(x, i)).join('')}</ol>
  ${asla || ezilme ? `<footer class="kd-kesim__alt">${asla}${ezilme}</footer>` : ''}
 </article>`;
  }

  /* ---------- Bölümler ---------- */
  const tehlikePaneli = `<section class="kd-bolum kd-bolum--sikisik" aria-labelledby="bogulma-bas">
 <div class="wrap">
  <div class="kd-kbogulma">
   <div class="kd-kbogulma__bas">
    <span class="kd-kbogulma__rozet"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Boğulma riski</span>
    <h2 id="bogulma-bas">Asla bütün vermeyin</h2>
    <p>Bu besinler küçük çocukların soluk yolu genişliğine yakın boyuttadır. Neden riskli olduklarını ve yerine ne yapabileceğinizi bilmek yeterli.</p>
   </div>
   <ul class="kd-kbogulma__liste">
    ${TEHLIKELER.map((t, i) => `<li class="kd-gir" style="--kd-gecikme:${i * 60}ms">
     <span class="kd-kbogulma__svg">${yasakSvg(t.tur)}</span>
     <div>
      <h3>${esc(t.ad)}</h3>
      <span class="kd-kbogulma__yas"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${esc(t.yas)}</span>
      <p><b>Neden?</b> ${esc(t.neden)}</p>
      <p class="kd-kbogulma__yerine"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span><b>Yerine:</b> ${esc(t.yerine)}${t.slug && sluglar.has(t.slug) ? ` <a class="kd-bag" href="#${t.slug}">Kesimi göster</a>` : ''}</span></p>
     </div>
    </li>`).join('')}
   </ul>
   <div class="kd-kbogulma__acil">
    <span class="kd-kbogulma__112" aria-hidden="true">112</span>
    <p><b>Boğulma acil durumdur: hemen 112'yi arayın.</b> Bebek ve çocuk ilk yardımını bir kitaptan değil, resmi bir kursta uygulamalı öğrenin. <a class="kd-bag" href="https://www.kizilay.org.tr/" target="_blank" rel="noopener">Türk Kızılay ilk yardım eğitimleri</a> · <a class="kd-bag" href="https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx" target="_blank" rel="noopener" hreflang="en">AAP: boğulmayı önleme</a></p>
   </div>
  </div>
 </div>
</section>`;

  const nasilOkunur = `<div class="kd-kokuma">
   <div class="kd-kokuma__metin"><h3>Kartlar nasıl okunur?</h3><p>Her besin üç aşamada çizildi. Çizimlerdeki kesikli çizgi bir <b>yetişkin parmak ucu</b>; parçaların boyunu onunla kıyaslayın.</p></div>
   <ul class="kd-kokuma__asamalar">${ASAMALAR.map((a) => `<li data-renk="${a.renk}"><b>${a.ad}</b><small>${a.beceri}</small></li>`).join('')}</ul>
   <svg class="kd-kokuma__parmak" viewBox="0 0 40 52" aria-hidden="true"><path d="M10 51V20a10 10 0 0 1 20 0v31" fill="#fff" stroke="#8C796C" stroke-width="1.6" stroke-dasharray="3 2.4"/><rect x="14" y="13" width="12" height="13" rx="5.5" fill="none" stroke="#8C796C" stroke-opacity=".6" stroke-width="1.4"/></svg>
  </div>`;

  const chip = (veri, deger, metin, sayi, basili = false) => `<button type="button" class="kd-chip" ${veri}="${esc(deger)}" aria-pressed="${basili}">${metin}<span class="kd-ksayi">${sayi}</span></button>`;
  const araclar = `<div class="kd-karac">
   <div class="kd-ara"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><label class="kd-gizli" for="kesim-ara">Besin arayın</label><input id="kesim-ara" type="search" placeholder="Besin arayın: üzüm, havuç, brokoli…" autocomplete="off" spellcheck="false" enterkeyhint="search"></div>
   <div class="kd-karac__satir"><span class="kd-karac__etiket" id="grup-etiket">Grup</span><div class="kd-serit" role="group" aria-labelledby="grup-etiket" data-kd-filtre="grup">${chip('data-grup', '', 'Tümü', atlas.length, true)}${gruplar.map(([g, s]) => chip('data-grup', g, esc(buyukHarf(g)), s)).join('')}</div></div>
   <div class="kd-karac__satir"><span class="kd-karac__etiket" id="risk-etiket">Boğulma riski</span><div class="kd-serit" role="group" aria-labelledby="risk-etiket" data-kd-filtre="risk">${chip('data-risk', '', 'Hepsi', atlas.length, true)}${Object.keys(RISK).filter((k) => riskSay[k]).map((k) => `<button type="button" class="kd-chip kd-chip--risk" data-risk="${k}" aria-pressed="false"><i class="fa-solid ${RISK[k].ikon}" aria-hidden="true"></i>${RISK[k].ad}<span class="kd-ksayi">${riskSay[k]}</span></button>`).join('')}</div></div>
  </div>`;

  const dizin = `<details class="kd-kdizin">
   <summary><span>${ikon('liste', 22)} Tüm besinler (A–Z)</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary>
   <nav aria-label="Besin dizini"><ul>${atlas.map((x) => `<li><a class="kd-chip" href="#${esc(x.slug)}">${esc(x.ad)}</a></li>`).join('')}</ul></nav>
  </details>`;

  const main = o.sayfa(`
${o.hero({
  renk: 'mint',
  kirinti: [['Tarifler', 'tarifler.html'], ['Dada Kids', 'kids.html'], ['Güvenli Kesim']],
  ust: { metin: 'Güvenli kesim atlası', ikon: 'bicak-tahta' },
  baslik: 'Her besin, her yaşta<br>doğru boyutta',
  giris: `${atlas.length} besin için üç aşamalı kesim: 6–8 ay avuçla kavrar, 9–12 ay iki parmakla tutar, 12 ay sonrası ısırıp çiğner. Çizimlere bakın, parmak ucunuzla kıyaslayın, gönül rahatlığıyla hazırlayın.`,
  eylemler: `<a class="kd-btn" href="#atlas"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Besin arayın</a><a class="kd-btn kd-btn--hafif" href="#bogulma-bas">Asla bütün verilmeyenler</a>`,
  sag: `<div class="kd-khero">${o.sahne('kesim-tahtasi', '')}<div class="kd-khero__ornek">${kesimSvg('cubuk', 'turuncu', 0, { baslik: 'Örnek: 6–8 ay için parmak boyu havuç şeritleri' })}<span>6–8 ay · parmak boyu şerit</span></div></div>`,
})}
${tehlikePaneli}
<section class="kd-bolum" id="atlas" aria-labelledby="atlas-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Atlas', ikonAd: 'bicak-tahta', renk: 'mint', baslik: '<span id="atlas-bas">Besin besin kesim rehberi</span>', alt: 'Arayın, gruba ya da boğulma riskine göre süzün. Her kartın bağlantısını paylaşabilirsiniz.' })}
  <div class="kd-kust">${o.ornek('Kesim önerileri ana akım rehberlerin (AAP, NHS) genel ilkelerine göre hazırlanmış örneklerdir; çocuk doktoru / çocuk diyetisyeni onayından geçmeden yayına alınmaz.')}${o.onay()}</div>
  ${nasilOkunur}
  ${araclar}
  ${dizin}
  <div class="kd-sonuc-bar"><b role="status" aria-live="polite"><span id="kesim-sayi">${atlas.length}</span> besin gösteriliyor</b><button type="button" class="kd-btn kd-btn--hafif kd-btn--kucuk" id="kesim-temizle" hidden><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Filtreleri temizle</button></div>
  <div class="kd-katlas" id="kesim-liste">${atlas.map(kart).join('\n')}</div>
  ${o.bosDurum({ baslik: 'Bu aramayla eşleşen besin yok', metin: 'Yazımı kontrol edin ya da filtreleri temizleyin. Aradığınız besin henüz atlasta olmayabilir.', id: 'kesim-bos' })}
 </div>
</section>
<section class="kd-bolum kd-bolum--beyaz" aria-labelledby="devam-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Devam edin', ikonAd: 'kitap', renk: 'pembe', baslik: '<span id="devam-bas">Kesimden sonrası</span>' })}
  <div class="kd-izgara">
   ${[
     ['kids-rehber.html', 'kitap', 'Öğürme mi, boğulma mı?', 'Farkı önceden öğrenmek ilk haftaları çok rahatlatır.', 'pembe'],
     ['kids-arac-hazir-mi.html', 'liste', 'Ek gıdaya hazır mı?', 'Oturma, baş kontrolü ve ilgi: hazırlık belirtilerini işaretleyin.', 'mint'],
     ['kids-donemler.html', 'takvim', 'Evrelere göre beslenme', 'Her evrede kıvam, odak besinler ve uygun tarifler.', 'mavi'],
     ['kids-tarifler.html', 'kase', 'Parmak gıda tarifleri', 'Kesim kurallarına uygun, yaşa göre süzülen tarifler.', 'seftali'],
   ].map(([h, i, b, m, r]) => `<a class="kd-kart kd-modul kd-gir" href="${h}" data-renk="${r}"><span class="kd-modul__ikon">${ikon(i, 40)}</span><h3>${b}</h3><p>${m}</p><span class="kd-kart__alt">Aç <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>`).join('')}
  </div>
 </div>
</section>
`, 'kesim');

  return [{
    dosya: 'kids-guvenli-kesim.html',
    baslik: 'Güvenli Kesim: besin besin 6–8 ay, 9–12 ay, 12 ay+ | Dada Kids',
    aciklama: 'Bebek ve küçük çocuklar için besin besin güvenli kesim rehberi: çizimli üç aşama, boğulma riski, asla bütün verilmeyen besinler.',
    aktif: 'kesim',
    css: ['kesim'],
    js: ['kesim'],
    main,
  }];
}
