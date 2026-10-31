// Dada Kids — Güvenli Kesim atlası (sahibi: kesim kolu)
// Veri: veri/kesim.json  [{slug, ad, grup, renk, ikon, risk, pisirme, asamalar:{"6-8","9-12","12+":{nasil, boyut, ipucu, cizim}}, asla, ezilmeTesti}]
// Çizimler: aşağıdaki KESIM_CIZIM (besin başına elle kurgulanmış SVG). Derleme sırasında
// varlik/kids/svg/kesim/<slug>.svg (bütün besin) ve <slug>-{6-8,9-12,12}.svg (aşamalar) olarak yazılır.
// Kural: çizim = metin. Bir aşamanın metni değişirse çizimi ve "cizim" alanı birlikte güncellenir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
/* ÖLÇEK: viewBox 0 0 200 140 · 1 mm = 1,4 birim (tüm aşamalarda aynı) · sağda yetişkin parmak ucu (≈17 mm). Parçalarda yüz yok; yalnız bütün besin simgesinde. */
const INK = '#4A3A34';
const MM = 1.4;
const ZEMIN = ['#FFEBDD', '#DDF4EA', '#FFF4CC'];
const f = (n) => +Number(n).toFixed(1);
const st = (w = 2.4) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function egri(pts) {
  const n = pts.length; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}
function blob(rx, ry, r, n = 8, j = 0.16) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.35; const k = 1 - j + r() * j * 2; pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]); }
  return egri(pts);
}
const g = (x, y, a, ic, s = 1) => `<g transform="translate(${f(x)} ${f(y)})${a ? ` rotate(${f(a)})` : ''}${s !== 1 ? ` scale(${s})` : ''}">${ic}</g>`;
const golge = (x, y, rx, ry) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry ?? Math.max(2, rx * 0.2))}" fill="${INK}" opacity=".09"/>`;
/** parça: gölge + döndürülmüş grup (w×h yaklaşık kutu) */
function P(x, y, a, w, h, ic) {
  const r = (a * Math.PI) / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  const gw = (c * w + s * h) / 2, gh = (s * w + c * h) / 2;
  return golge(x + 1.5, y + gh * 0.88, gw * 0.92, Math.max(1.8, Math.min(gh * 0.35, gw * 0.22))) + g(x, y, a, ic);
}
const parla = (d, w = 2) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity=".75"/>`;
const buhar = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".3"><path d="M-8 7c-3-3.5 3-5.5 0-9s3-5.5 0-9"/><path d="M0 4c-3-3.5 3-5.5 0-9s3-5.5 0-9"/><path d="M8 7c-3-3.5 3-5.5 0-9s3-5.5 0-9"/></g>`;
const yasak = (x, y, r, ic) => `<g transform="translate(${f(x)} ${f(y)})"><circle r="${r}" fill="#fff" opacity=".7"/>${ic}<circle r="${r}" fill="none" stroke="#D2453A" stroke-width="3"/><path d="M${f(-r * 0.7)} ${f(r * 0.7)}L${f(r * 0.7)} ${f(-r * 0.7)}" stroke="#D2453A" stroke-width="3" stroke-linecap="round"/></g>`;

/* ---------- birleşik kontur: önce kalın mürekkep, sonra dolgu (iç çizgiler görünmez) ---------- */
function birlesik(sekiller, dolgu, w = 2.4) {
  return `<g fill="${INK}" stroke="${INK}" stroke-width="${w * 2}" stroke-linejoin="round">${sekiller.join('')}</g><g fill="${dolgu}">${sekiller.join('')}</g>`;
}
/* ---------- rende yığını ---------- */
function rende(cx, cy, rx, ry, renk, alt, seed, n = 16) {
  const r = rng(seed);
  let s = golge(cx + 1, cy + ry * 0.75, rx * 1.05, ry * 0.32) + `<ellipse cx="${f(cx)}" cy="${f(cy + ry * 0.25)}" rx="${f(rx * 0.9)}" ry="${f(ry * 0.55)}" fill="${alt}"/>`;
  const teller = [];
  for (let i = 0; i < n; i++) {
    const t = i / n; const yy = cy + ry * (0.55 - t * 1.1) * (0.6 + r() * 0.4); const gen = rx * (1 - Math.abs(yy - cy) / (ry * 1.3));
    const x = cx + (r() - 0.5) * 2 * gen * 0.8; const L = 8 + r() * 7; const a = (r() - 0.5) * 2.4; const b = (r() - 0.5) * 6;
    teller.push(`M${f(x - Math.cos(a) * L / 2)} ${f(yy - Math.sin(a) * L / 2)}q${f(Math.cos(a) * L / 2 + b)} ${f(Math.sin(a) * L / 2 - 2)} ${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}`);
  }
  teller.forEach((d) => { s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${renk}" stroke-width="2.4" stroke-linecap="round"/>`; });
  return s;
}

/* ---------- temel parça biçimleri (merkez 0,0, yatay) ---------- */
function cubuk(L, T, dolgu, { cekirdek = '', w = 2.4, rx = 0.45 } = {}) {
  let s = `<rect x="${f(-L / 2)}" y="${f(-T / 2)}" width="${f(L)}" height="${f(T)}" rx="${f(T * rx)}" fill="${dolgu}" ${st(w)}/>`;
  if (cekirdek) s += `<path d="M${f(-L / 2 + T * 0.7)} ${f(T * 0.06)}H${f(L / 2 - T * 0.7)}" stroke="${cekirdek}" stroke-width="${f(T * 0.24)}" stroke-linecap="round"/>`;
  return s + parla(`M${f(-L / 2 + T * 0.55)} ${f(-T * 0.22)}H${f(-L / 2 + L * 0.4)}`, Math.max(1.6, T * 0.13));
}
function kup(s, on, ust, yan, w = 2) {
  const h = s / 2, d = s * 0.3;
  return `<path d="M${f(-h)} ${f(-h + d / 2)}L${f(-h + d)} ${f(-h - d / 2)}H${f(h + d)}L${f(h)} ${f(-h + d / 2)}Z" fill="${ust}" ${st(w)}/><path d="M${f(h)} ${f(-h + d / 2)}L${f(h + d)} ${f(-h - d / 2)}V${f(h - d / 2)}L${f(h)} ${f(h + d / 2)}Z" fill="${yan}" ${st(w)}/><rect x="${f(-h)}" y="${f(-h + d / 2)}" width="${f(s)}" height="${f(s)}" rx="${f(s * 0.16)}" fill="${on}" ${st(w)}/>`;
}
function yumusakKare(s, dolgu, r, w = 2) {
  const h = s / 2, j = () => (r() - 0.5) * s * 0.18;
  return `<path d="${egri([[-h + j(), -h + j()], [j(), -h * 1.05 + j()], [h + j(), -h + j()], [h * 1.05 + j(), j()], [h + j(), h + j()], [j(), h * 1.05 + j()], [-h + j(), h + j()], [-h * 1.05 + j(), j()]])}" fill="${dolgu}" ${st(w)}/>`;
}
function yarimAy(d, dolgu, ic = '', w = 2.2) {
  const r = d / 2;
  return `<path d="M${f(-r)} ${f(r * 0.3)}A${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(r * 0.3)}Z" fill="${dolgu}" ${st(w)}/>${ic}` + parla(`M${f(-r * 0.62)} ${f(-r * 0.1)}A${f(r * 0.7)} ${f(r * 0.7)} 0 0 1 ${f(-r * 0.15)} ${f(-r * 0.4)}`, 1.6);
}
/** boyuna çeyrek (yandan): üstte kabuk kavisi, altta kesik yüz */
function ceyrek(L, H, kabuk, et, ic = '', w = 2.2) {
  const ust = `M${f(-L / 2)} 0Q0 ${f(-H * 1.3)} ${f(L / 2)} 0`;
  return `<path d="${ust}Q0 ${f(H * 0.62)} ${f(-L / 2)} 0Z" fill="${et}"/><path d="${ust}Q0 ${f(-H * 0.58)} ${f(-L / 2)} 0Z" fill="${kabuk}"/>${ic}<path d="${ust}Q0 ${f(H * 0.62)} ${f(-L / 2)} 0Z" fill="none" ${st(w)}/>` + parla(`M${f(-L * 0.2)} ${f(-H * 0.5)}q${f(L * 0.14)} ${f(-H * 0.14)} ${f(L * 0.28)} ${f(-H * 0.06)}`, 1.5);
}
/** bastırılıp yassılaştırılmış çeyrek: düzensiz geniş biçim, kenarda kabuk */
function ezik(rx, ry, kabuk, et, r, ic = '') {
  const dis = blob(rx, ry, r, 9, 0.12);
  return `<path d="${dis}" fill="${kabuk}" ${st(2.2)}/><g transform="translate(0.5 1.6) scale(.8 .72)"><path d="${dis}" fill="${et}"/></g>${ic}<path d="M${f(-rx * 0.45)} ${f(-ry * 0.05)}q${f(rx * 0.12)} ${f(ry * 0.25)} ${f(rx * 0.26)} 0M${f(rx * 0.1)} ${f(ry * 0.15)}q${f(rx * 0.12)} ${f(ry * 0.25)} ${f(rx * 0.26)} 0" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" opacity=".35"/>`;
}
/** uzun kama / dilim (elma, avokado): dışa bombeli */
function kamaD(L, H) { return `M${f(-L / 2)} ${f(H * 0.28)}C${f(-L * 0.3)} ${f(-H * 0.95)} ${f(L * 0.3)} ${f(-H * 0.95)} ${f(L / 2)} ${f(H * 0.28)}C${f(L * 0.2)} ${f(H * 0.55)} ${f(-L * 0.2)} ${f(H * 0.55)} ${f(-L / 2)} ${f(H * 0.28)}Z`; }

/* ---------- yetişkin parmak ucu (ölçek, her aşamada aynı) ---------- */
const PARMAK = `<g class="kd-kparmak"><ellipse cx="183" cy="138" rx="16" ry="3" fill="${INK}" opacity=".06"/><path d="M170 141V86a12 12 0 0 1 24 0v55" fill="#FDE8DA" stroke="${INK}" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/><path d="M176 87.5a6 6 0 0 1 12 0v5.5a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="#FFF6F1" stroke="${INK}" stroke-opacity=".38" stroke-width="1.5"/><path d="M175.5 117q6.5 2.6 13 0M177 122q5 1.8 10 0" fill="none" stroke="${INK}" stroke-opacity=".28" stroke-width="1.4" stroke-linecap="round"/><path d="M173.5 92v12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>`;

function sahne(n, ic, baslik = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="200" height="140"${baslik ? ` role="img" aria-label="${baslik}"` : ''}><rect x="1" y="1" width="198" height="138" rx="16" fill="${ZEMIN[n]}"/><path d="M14 132H158" stroke="${INK}" stroke-opacity=".06" stroke-width="2" stroke-linecap="round"/>${ic}${PARMAK}</svg>`;
}

/* ---------- küçük kawaii yüz (yalnız bütün besin) ---------- */
const yuz = (x, y, s = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><ellipse cx="-9" cy="4.5" rx="3.6" ry="2.3" fill="#F48FA0" opacity=".55"/><ellipse cx="9" cy="4.5" rx="3.6" ry="2.3" fill="#F48FA0" opacity=".55"/><circle cx="-5.5" cy="0" r="2.2" fill="${INK}"/><circle cx="5.5" cy="0" r="2.2" fill="${INK}"/><circle cx="-4.8" cy="-.8" r=".7" fill="#fff"/><circle cx="6.2" cy="-.8" r=".7" fill="#fff"/><path d="M-2.6 3.6q2.6 2.6 5.2 0" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/></g>`;
const butunKap = (ic) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80"><ellipse cx="40" cy="72" rx="24" ry="4" fill="${INK}" opacity=".08"/>${ic}</svg>`;

/* =====================================================================
   BESİNLER — her biri: butun(), a[0] 6–8 ay, a[1] 9–12 ay, a[2] 12 ay+
   ===================================================================== */
const C = {};

/* ---------------- HAVUÇ ---------------- */
{
  const turuncu = '#FFA65F', ozu = '#FFCB98', rende_ = '#F7913F';
  const halka = (d) => yarimAy(d, turuncu, `<path d="M${f(-d * 0.22)} ${f(d * 0.15)}A${f(d * 0.22)} ${f(d * 0.22)} 0 0 1 ${f(d * 0.22)} ${f(d * 0.15)}" fill="${ozu}"/>`);
  C.havuc = {
    butun: () => butunKap(`<path d="M50 20c4-8 2-14-2-16M50 20c6-5 13-5 16-2M50 20c-1-7-6-11-11-11" fill="none" stroke="#5FA548" stroke-width="5" stroke-linecap="round"/><path d="M50 20c-1-7-6-11-11-11M50 20c6-5 13-5 16-2M50 20c4-8 2-14-2-16" fill="none" stroke="#86C96A" stroke-width="2.2" stroke-linecap="round"/><path d="M38 22c8-6 20-2 20 8 0 6-6 12-14 20L22 68c-3 3-7 0-5-4l12-28c3-7 5-11 9-14z" fill="#FFA65F" ${st()}/><path d="M30 44l5 2M26 54l5 2M38 33l4 2" stroke="#E07C2E" stroke-width="2" stroke-linecap="round"/>${parla('M36 28c4-3 9-3 12-1')}${yuz(42, 36, 0.8)}`),
    a: [
      () => buhar(62, 28) + buhar(104, 24, 0.9) + P(78, 64, -7, 91, 18, cubuk(91, 18, turuncu, { cekirdek: ozu })) + P(82, 104, 5, 91, 18, cubuk(91, 18, turuncu, { cekirdek: ozu })),
      () => {
        const s = 12.6, r = rng(11);
        const yer = [[22, 54], [44, 46], [68, 56], [30, 80], [54, 84], [80, 76], [24, 108], [50, 112], [76, 104]];
        return buhar(46, 22, 0.8) + yer.map(([x, y]) => golge(x + 2, y + s * 0.7, s * 0.6) + g(x, y, (r() - 0.5) * 16, kup(s, turuncu, '#FFC08A', '#F39A55'))).join('') + rende(128, 94, 22, 16, rende_, '#FFE1C2', 3);
      },
      () => {
        const d = 28, yer = [[30, 56, -10], [68, 50, 12], [106, 58, -6], [40, 98, 8], [80, 100, -14]];
        return buhar(66, 24, 0.8) + yer.map(([x, y, a]) => P(x, y, a, d, d * 0.6, halka(d))).join('') + rende(130, 106, 16, 11, rende_, '#FFE1C2', 5, 11);
      },
    ],
  };
}

/* ---------------- ELMA ---------------- */
{
  const et = '#FFF1C6', cekirdek = '#EED08A';
  const kama = (L, H) => `<path d="${kamaD(L, H)}" fill="${et}" ${st()}/><path d="M${f(-L * 0.22)} ${f(H * 0.3)}q${f(L * 0.22)} ${f(-H * 0.32)} ${f(L * 0.44)} 0" fill="none" stroke="${cekirdek}" stroke-width="1.8" stroke-linecap="round"/>` + parla(`M${f(-L * 0.3)} ${f(-H * 0.2)}q${f(L * 0.18)} ${f(-H * 0.32)} ${f(L * 0.4)} ${f(-H * 0.38)}`);
  const ince = (L, T) => `<path d="M0 0C${f(L * 0.3)} ${f(-T)} ${f(L * 0.7)} ${f(-T)} ${f(L)} 0C${f(L * 0.7)} ${f(T * 0.4)} ${f(L * 0.3)} ${f(T * 0.4)} 0 0Z" fill="#FFF6DC" fill-opacity=".94" ${st(1.8)}/><path d="M${f(L * 0.18)} ${f(-T * 0.32)}Q${f(L * 0.5)} ${f(-T * 0.62)} ${f(L * 0.82)} ${f(-T * 0.32)}" fill="none" stroke="${cekirdek}" stroke-width="1" opacity=".8"/>`;
  C.elma = {
    butun: () => butunKap(`<path d="M40 22c-6-6-20-6-24 6-5 14 4 34 14 38 4 2 7 0 10-1 3 1 6 3 10 1 10-4 19-24 14-38-4-12-18-12-24-6z" fill="#F0625A" ${st()}/><path d="M40 22c0-6 1-10 4-13" fill="none" ${st(2.6)}/><path d="M44 14c4-6 12-6 15-3-3 5-10 7-15 3z" fill="#7CC46A" ${st(2)}/>${parla('M22 30c1-5 5-8 10-8')}${yuz(40, 42, 0.85)}`),
    a: [
      () => buhar(70, 26) + P(80, 62, -6, 91, 24, kama(91, 24)) + P(82, 104, 6, 91, 24, kama(91, 24)),
      () => {
        const r = rng(21), yer = [[24, 56], [46, 50], [70, 58], [34, 82], [58, 86], [84, 78], [28, 110], [54, 112], [80, 106]];
        return buhar(52, 26, 0.8) + yer.map(([x, y]) => golge(x + 1, y + 8, 7.5) + g(x, y, 0, yumusakKare(12.6, et, r))).join('') + rende(128, 94, 22, 16, '#F5DE96', '#FFF6DA', 7);
      },
      () => [-62, -46, -30, -14, 2].map((a, i) => g(34, 112, a, ince(74, 11))).join('') + golge(64, 116, 40, 4) + rende(132, 102, 18, 12, '#F5DE96', '#FFF6DA', 9, 12),
    ],
  };
}

/* ---------------- MUZ ---------------- */
{
  const et = '#FFF3C4', cek = '#B89A62', kabuk = '#FFD84D';
  const tohum = (x0, x1, y) => { let s = ''; for (let x = x0; x <= x1; x += 6) s += `<circle cx="${f(x)}" cy="${f(y)}" r="1.1" fill="${cek}"/>`; return s; };
  const yarim = `<path d="M-52 2C-50-12-20-18 10-17C30-16 46-14 52-10V10C40 12 25 13 10 13C-20 13-48 14-52 2Z" fill="${et}" ${st()}/>${tohum(-42, 0, -1)}${parla('M-44-6C-34-12-20-14-6-14')}<path d="M6-19C28-19 44-17 55-13V13C41 15 24 16 6 15L13 8L2 3L12-3L3-9Z" fill="${kabuk}" ${st()}/><path d="M20-12C32-12 42-11 50-9M20 9C32 10 42 10 50 9" fill="none" stroke="#E2B52C" stroke-width="1.6" stroke-linecap="round"/><path d="M55-13V13" ${st(2.4)} fill="none"/><rect x="52" y="-6" width="6" height="12" rx="2" fill="#8A6A3A" ${st(1.8)}/>`;
  const mizrak = (L, T) => `<path d="M${f(-L / 2)} 0C${f(-L / 2)} ${f(-T * 0.6)} ${f(-L * 0.2)} ${f(-T * 0.72)} 0 ${f(-T * 0.68)}S${f(L / 2)} ${f(-T * 0.42)} ${f(L / 2)} 0C${f(L / 2)} ${f(T * 0.5)} ${f(L * 0.2)} ${f(T * 0.58)} 0 ${f(T * 0.55)}S${f(-L / 2)} ${f(T * 0.5)} ${f(-L / 2)} 0Z" fill="${et}" ${st()}/>${tohum(-L * 0.36, L * 0.36, T * 0.18)}` + parla(`M${f(-L * 0.38)} ${f(-T * 0.3)}H${f(L * 0.05)}`, 1.6);
  const parca = (r) => yumusakKare(12, et, r) + `<circle cx="-1.6" cy="-1" r=".95" fill="${cek}"/><circle cx="1.8" cy="-.6" r=".95" fill="${cek}"/><circle cx=".1" cy="2" r=".95" fill="${cek}"/>`;
  const ay = (d) => yarimAy(d, et, (() => { let s = ''; for (let i = 0; i < 3; i++) { const a = Math.PI * (0.3 + i * 0.2); s += `<circle cx="${f(Math.cos(a) * d * 0.16)}" cy="${f(d * 0.08 - Math.sin(a) * d * 0.16)}" r="1" fill="${cek}"/>`; } return s; })());
  C.muz = {
    butun: () => butunKap(`<path d="M14 26c-2 18 10 36 30 38 10 1 18-3 22-8-12 2-26-2-34-12-6-8-8-14-8-20-4-2-8-1-10 2z" fill="#FFD84D" ${st()}/><path d="M14 26l-2-6 6-2 4 6" fill="#8A6A3A" ${st(2)}/><path d="M66 56l4 1" ${st(3)}/>${parla('M20 34c2 8 6 14 12 18')}${yuz(40, 48, 0.8)}`),
    a: [
      () => P(76, 46, -4, 112, 32, yarim) + P(76, 94, 3, 86, 14, mizrak(86, 14)) + P(80, 118, -2, 86, 14, mizrak(86, 14)),
      () => {
        const r = rng(31), yer = [[24, 50], [46, 44], [70, 52], [34, 76], [58, 80], [84, 72], [28, 104], [54, 108], [80, 100]];
        return yer.map(([x, y]) => golge(x + 1, y + 8, 7) + g(x, y, 0, parca(r))).join('') + golge(130, 104, 22, 4) + g(128, 96, 0, `<path d="${blob(22, 11, rng(32), 10, 0.14)}" fill="${et}" ${st()}/><path d="M-10 0q6-6 12-2t8 3" fill="none" stroke="#EBD58F" stroke-width="1.8" stroke-linecap="round"/>`);
      },
      () => [[30, 54, -10], [74, 48, 10], [116, 56, -6], [40, 102, 8], [84, 104, -12], [126, 100, 6]].map(([x, y, a]) => P(x, y, a, 36, 22, ay(36))).join(''),
    ],
  };
}

/* ---------------- AVOKADO ---------------- */
{
  const et = '#E2F2AE', kenar = '#BCDC7E', kabuk = '#557F3E';
  const dilim = (L, H, kabuklu = false) => `<path d="${kamaD(L, H)}" fill="${kenar}" ${st()}/><g transform="translate(0 ${f(H * 0.12)}) scale(.9 .78)"><path d="${kamaD(L, H)}" fill="${et}"/></g>${kabuklu ? `<path d="M${f(L * 0.02)} ${f(-H * 0.69)}C${f(L * 0.26)} ${f(-H * 0.66)} ${f(L * 0.44)} ${f(-H * 0.2)} ${f(L / 2)} ${f(H * 0.28)}" fill="none" stroke="${kabuk}" stroke-width="6" stroke-linecap="round"/>` : ''}<path d="${kamaD(L, H)}" fill="none" ${st()}/>` + parla(`M${f(-L * 0.32)} ${f(-H * 0.12)}q${f(L * 0.16)} ${f(-H * 0.36)} ${f(L * 0.36)} ${f(-H * 0.42)}`);
  C.avokado = {
    butun: () => butunKap(`<path d="M40 8c-12 0-16 14-20 24-6 14-4 36 20 36s26-22 20-36C56 22 52 8 40 8z" fill="${kabuk}" ${st()}/><path d="M40 13c-9 0-12 11-15 20-5 12-3 30 15 30s20-18 15-30c-3-9-6-20-15-20z" fill="${et}"/><circle cx="40" cy="47" r="11" fill="#B9794A" ${st(2.2)}/>${parla('M35 42a6 6 0 0 1 5-4')}${yuz(40, 28, 0.72)}`),
    a: [
      () => P(80, 62, -6, 91, 28, dilim(91, 28, true)) + P(82, 106, 6, 91, 28, dilim(91, 28)),
      () => { const r = rng(41), yer = [[24, 50], [46, 44], [70, 52], [34, 76], [58, 80], [84, 72], [28, 104], [54, 108], [80, 100], [106, 94]]; return yer.map(([x, y]) => golge(x + 1, y + 8, 7) + g(x, y, 0, yumusakKare(12.6, et, r))).join(''); },
      () => { const r = rng(42); return P(60, 42, -8, 64, 14, dilim(64, 14)) + P(64, 68, 4, 64, 14, dilim(64, 14)) + [[34, 104], [64, 108], [94, 100], [124, 106], [128, 60]].map(([x, y]) => golge(x + 1, y + 12, 10) + g(x, y, 0, yumusakKare(18, et, r))).join(''); },
    ],
  };
}

/* ---------------- ÜZÜM ---------------- */
{
  const kab = '#A57AC8', et = '#DCEFBF';
  const c4 = (L, H) => ceyrek(L, H, kab, et);
  const grup = (x, y, L, H) => P(x - L * 0.62, y - H * 0.85, -8, L, H, c4(L, H)) + P(x + L * 0.62, y - H * 0.75, 10, L, H, c4(L, H)) + P(x - L * 0.6, y + H * 1.05, 6, L, H, c4(L, H)) + P(x + L * 0.64, y + H * 1.1, -6, L, H, c4(L, H));
  const butunUzum = (r) => `<ellipse rx="${r * 0.85}" ry="${r}" fill="${kab}" ${st(2.2)}/>${parla(`M${-r * 0.4} ${-r * 0.3}a${r * 0.4} ${r * 0.5} 0 0 1 ${r * 0.35} ${-r * 0.4}`, 1.6)}`;
  const enineYarim = (r) => `<path d="M${-r} 0A${r} ${r} 0 0 1 ${r} 0Z" fill="${kab}" ${st(2)}/><path d="M${-r} 0H${r}A${r} ${r * 0.35} 0 0 1 ${-r} 0Z" fill="${et}" ${st(2)}/>`;
  C.uzum = {
    butun: () => butunKap(`<path d="M40 14c0-6 3-9 6-10" fill="none" ${st(2.6)}/><path d="M42 12c6-6 14-4 16 0-5 4-12 5-16 0z" fill="#7CC46A" ${st(2)}/>${[[30, 28], [50, 28], [40, 40], [24, 46], [56, 46], [32, 58], [48, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${kab}" ${st(2.2)}/>`).join('')}<circle cx="40" cy="44" r="13" fill="#B489D4" ${st(2.2)}/>${parla('M33 40a7 7 0 0 1 5-5')}${yuz(40, 46, 0.7)}`),
    a: [
      () => { const r = rng(51); return [[28, 46, -10], [64, 42, 8], [100, 48, -4], [134, 44, 12], [32, 92, 6], [68, 96, -8], [104, 90, 10], [138, 96, -6]].map(([x, y, a]) => P(x, y, a, 34, 18, ezik(17, 8.5, kab, et, r))).join(''); },
      () => grup(44, 52, 28, 13) + grup(118, 58, 28, 13) + grup(80, 108, 28, 13),
      () => grup(46, 48, 28, 13) + grup(46, 104, 28, 13) + yasak(128, 46, 19, butunUzum(11)) + yasak(128, 102, 19, g(0, 3, 0, enineYarim(11))),
    ],
  };
}

/* ---------------- KİRAZ DOMATES ---------------- */
{
  const kab = '#F2685C', et = '#FFA597', cek = '#FFE08A';
  const ic = (L, H) => `<path d="M${f(-L * 0.28)} ${f(-H * 0.02)}Q0 ${f(-H * 0.42)} ${f(L * 0.28)} ${f(-H * 0.02)}Q0 ${f(H * 0.2)} ${f(-L * 0.28)} ${f(-H * 0.02)}Z" fill="${cek}"/>` + [-0.14, 0, 0.14].map((k) => `<ellipse cx="${f(L * k)}" cy="${f(-H * 0.06)}" rx="1.5" ry="1" fill="#E3B84A"/>`).join('');
  const c4 = (L, H) => ceyrek(L, H, kab, et, ic(L, H));
  const grup = (x, y, L, H) => P(x - L * 0.62, y - H * 0.85, -8, L, H, c4(L, H)) + P(x + L * 0.62, y - H * 0.75, 10, L, H, c4(L, H)) + P(x - L * 0.6, y + H * 1.05, 6, L, H, c4(L, H)) + P(x + L * 0.64, y + H * 1.1, -6, L, H, c4(L, H));
  const butun = (r) => `<circle r="${r}" fill="${kab}" ${st(2.2)}/><path d="M-4 ${-r + 1}l4 3 4-3M0 ${-r + 4}v-4" fill="none" stroke="#4E9A55" stroke-width="2.2" stroke-linecap="round"/>`;
  C['kiraz-domates'] = {
    butun: () => butunKap(`<circle cx="26" cy="46" r="14" fill="#E85A4F" ${st(2.2)}/><circle cx="44" cy="44" r="20" fill="${kab}" ${st()}/><path d="M36 26l8 5 8-5M44 31v-9" fill="none" stroke="#4E9A55" stroke-width="3" stroke-linecap="round"/><path d="M36 26l8 5 8-5" fill="none" stroke="${INK}" stroke-width="1" opacity=".3"/>${parla('M32 38a10 10 0 0 1 7-7')}${yuz(45, 47, 0.8)}`),
    a: [
      () => { const r = rng(61), ic2 = `<circle cx="-4" cy="0" r="1.4" fill="#E3B84A"/><circle cx="2" cy="1.5" r="1.4" fill="#E3B84A"/>`; return [[30, 46, -10], [72, 42, 8], [114, 48, -4], [32, 96, 6], [74, 100, -8], [116, 94, 10]].map(([x, y, a]) => P(x, y, a, 40, 20, ezik(20, 10, kab, et, r, ic2))).join(''); },
      () => grup(44, 46, 35, 15) + grup(114, 100, 35, 15),
      () => grup(50, 46, 35, 15) + grup(50, 104, 35, 15) + yasak(130, 74, 22, butun(13)),
    ],
  };
}

/* ---------------- BROKOLİ ---------------- */
{
  const koyu = '#68B04C', acik = '#8FCD6E', sap = '#CFE7A0';
  const cicek = (H, k = 1) => {
    const w = H * 0.11, tep = [[-0.27, -0.66, 0.2], [0.27, -0.66, 0.2], [0, -0.74, 0.22], [-0.18, -0.92, 0.18], [0.18, -0.92, 0.18], [0, -1.0, 0.15]].map(([x, y, r]) => [x * k, -0.58 + (y + 0.58) * k, r * k]);
    const daireler = tep.map(([x, y, r]) => `<circle cx="${f(x * H)}" cy="${f(y * H)}" r="${f(r * H)}"/>`);
    const lw = H < 25 ? 1.8 : 2.4;
    let s = `<path d="M${f(-w)} 0Q${f(-w * 0.8)} ${f(-H * 0.4)} ${f(-w * 2.2)} ${f(-H * 0.58)}H${f(w * 2.2)}Q${f(w * 0.8)} ${f(-H * 0.4)} ${f(w)} 0Z" fill="${sap}" ${st(lw)}/>`;
    s += birlesik(daireler, koyu, lw);
    if (H >= 25) tep.forEach(([x, y, r]) => { s += `<circle cx="${f((x - r * 0.25) * H)}" cy="${f((y - r * 0.25) * H)}" r="${f(r * H * 0.38)}" fill="${acik}"/>`; });
    else s += `<circle cx="${f(-0.1 * H)}" cy="${f(-0.86 * H)}" r="${f(0.12 * H)}" fill="${acik}"/>`;
    return s;
  };
  const yer = (x, y, a, H, k = 1) => golge(x + 2, y + 1, H * 0.32, 3) + g(x, y, a, cicek(H, k));
  C.brokoli = {
    butun: () => butunKap(`<path d="M34 70c2-10 2-18-2-26h16c-4 8-4 16-2 26z" fill="${sap}" ${st()}/>${birlesik(['<circle cx="24" cy="34" r="12"/>', '<circle cx="56" cy="34" r="12"/>', '<circle cx="40" cy="26" r="14"/>', '<circle cx="30" cy="16" r="9"/>', '<circle cx="50" cy="16" r="9"/>'], koyu)}<circle cx="21" cy="31" r="4" fill="${acik}"/><circle cx="37" cy="22" r="5" fill="${acik}"/><circle cx="53" cy="30" r="4" fill="${acik}"/>${yuz(40, 56, 0.62)}`),
    a: [
      () => buhar(140, 24, 0.8) + yer(56, 132, -16, 104, 0.66) + yer(118, 132, 14, 86, 0.66),
      () => buhar(70, 22, 0.75) + [[22, 66], [48, 58], [76, 68], [102, 60], [128, 70], [32, 104], [60, 110], [88, 102], [116, 112]].map(([x, y], i) => yer(x, y, (i % 3 - 1) * 14, 17)).join(''),
      () => [[28, 66, -10], [70, 60, 8], [112, 68, -4], [44, 118, 10], [88, 120, -12], [130, 118, 6]].map(([x, y, a]) => yer(x, y, a, 27)).join(''),
    ],
  };
}

/* ---------------- SALATALIK ---------------- */
{
  const et = '#DDF0B5', ic = '#F1F8D6', tohum = '#B4D47A';
  const uzun = (L, T) => `<rect x="${f(-L / 2)}" y="${f(-T / 2)}" width="${f(L)}" height="${f(T)}" rx="${f(T * 0.42)}" fill="${et}" ${st()}/><path d="M${f(-L / 2 + T * 0.4)} ${f(T * 0.22)}H${f(L / 2 - T * 0.4)}" stroke="${ic}" stroke-width="${f(T * 0.42)}" stroke-linecap="round"/>` + Array.from({ length: Math.floor(L / 9) }, (_, i) => `<ellipse cx="${f(-L / 2 + T * 0.6 + i * 9)}" cy="${f(T * 0.22)}" rx="2.2" ry="1.2" fill="${tohum}"/>`).join('') + parla(`M${f(-L / 2 + T * 0.5)} ${f(-T * 0.24)}H${f(-L / 2 + L * 0.4)}`, 2);
  const ay = (d) => yarimAy(d, et, `<path d="M${f(-d * 0.3)} ${f(d * 0.15)}A${f(d * 0.3)} ${f(d * 0.3)} 0 0 1 ${f(d * 0.3)} ${f(d * 0.15)}Z" fill="${ic}"/>` + [0.25, 0.42, 0.58, 0.75].map((k) => { const a = Math.PI * k; return `<ellipse cx="${f(Math.cos(a) * d * 0.2)}" cy="${f(d * 0.12 - Math.sin(a) * d * 0.2)}" rx="1.8" ry="1" transform="rotate(${f(-k * 180)} ${f(Math.cos(a) * d * 0.2)} ${f(d * 0.12 - Math.sin(a) * d * 0.2)})" fill="${tohum}"/>`; }).join(''));
  C.salatalik = {
    butun: () => butunKap(`<rect x="10" y="26" width="60" height="28" rx="14" fill="#6FB050" ${st()} transform="rotate(-12 40 40)"/><path d="M20 44l2-1M30 46l2-1M44 30l2-1M56 34l2-1" stroke="#4E8A36" stroke-width="2" stroke-linecap="round"/>${parla('M20 36c8-4 18-6 28-6')}${yuz(40, 42, 0.8)}`),
    a: [
      () => P(80, 52, -4, 134, 22, uzun(134, 22)) + rende(58, 106, 22, 14, '#C8E39A', '#EEF7DA', 13, 13),
      () => [[64, 30, -6], [70, 42, 4], [62, 54, -2]].map(([x, y, a]) => P(x, y, a, 70, 4.6, cubuk(70, 4.6, et, { w: 1.8, rx: 0.5 }))).join('') + rende(76, 100, 34, 20, '#C8E39A', '#EEF7DA', 15, 22),
      () => [[30, 56, -10], [74, 50, 10], [118, 58, -6], [44, 104, 8], [92, 106, -12]].map(([x, y, a]) => P(x, y, a, 42, 26, ay(42))).join(''),
    ],
  };
}

/* ---------------- ÇİLEK ---------------- */
{
  const kab = '#F2555D', et = '#FFB3AE', oz = '#FFE7E2', tohum = '#FFE38A';
  const kalp = (W, H) => `M0 ${f(-H * 0.38)}C${f(W * 0.2)} ${f(-H * 0.55)} ${f(W * 0.5)} ${f(-H * 0.5)} ${f(W * 0.5)} ${f(-H * 0.18)}C${f(W * 0.5)} ${f(H * 0.15)} ${f(W * 0.2)} ${f(H * 0.4)} 0 ${f(H * 0.5)}C${f(-W * 0.2)} ${f(H * 0.4)} ${f(-W * 0.5)} ${f(H * 0.15)} ${f(-W * 0.5)} ${f(-H * 0.18)}C${f(-W * 0.5)} ${f(-H * 0.5)} ${f(-W * 0.2)} ${f(-H * 0.55)} 0 ${f(-H * 0.38)}Z`;
  const kesik = (W, H, ezilmis = false) => `<path d="${kalp(W, H)}" fill="${kab}" ${st()}/><g transform="translate(0 1) scale(.84)"><path d="${kalp(W, H)}" fill="${et}"/></g><path d="M0 ${f(-H * 0.28)}C${f(W * 0.12)} ${f(-H * 0.1)} ${f(W * 0.06)} ${f(H * 0.2)} 0 ${f(H * 0.34)}C${f(-W * 0.06)} ${f(H * 0.2)} ${f(-W * 0.12)} ${f(-H * 0.1)} 0 ${f(-H * 0.28)}Z" fill="${oz}"/><path d="M0 ${f(-H * 0.2)}C${f(-W * 0.22)} ${f(-H * 0.1)} ${f(-W * 0.26)} ${f(H * 0.1)} ${f(-W * 0.12)} ${f(H * 0.26)}M0 ${f(-H * 0.2)}C${f(W * 0.22)} ${f(-H * 0.1)} ${f(W * 0.26)} ${f(H * 0.1)} ${f(W * 0.12)} ${f(H * 0.26)}" fill="none" stroke="${oz}" stroke-width="1.6" stroke-linecap="round"/>${ezilmis ? `<path d="M${f(-W * 0.62)} ${f(-H * 0.05)}h-4M${f(W * 0.62)} ${f(-H * 0.05)}h4M${f(-W * 0.56)} ${f(H * 0.16)}l-3 2M${f(W * 0.56)} ${f(H * 0.16)}l3 2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>` : ''}`;
  const ceyrekC = (L, H) => `<path d="M${f(-L / 2)} 0C${f(-L * 0.45)} ${f(-H * 0.75)} ${f(L * 0.1)} ${f(-H * 0.7)} ${f(L / 2)} 0C${f(L * 0.1)} ${f(H * 0.6)} ${f(-L * 0.45)} ${f(H * 0.55)} ${f(-L / 2)} 0Z" fill="${kab}" ${st(2.2)}/><path d="M${f(-L * 0.4)} ${f(H * 0.08)}C${f(-L * 0.3)} ${f(-H * 0.2)} ${f(L * 0.1)} ${f(-H * 0.18)} ${f(L * 0.38)} ${f(H * 0.02)}C${f(L * 0.1)} ${f(H * 0.4)} ${f(-L * 0.3)} ${f(H * 0.36)} ${f(-L * 0.4)} ${f(H * 0.08)}Z" fill="${et}"/><path d="M${f(-L * 0.3)} ${f(H * 0.1)}L${f(L * 0.25)} ${f(H * 0.06)}" stroke="${oz}" stroke-width="2" stroke-linecap="round"/>` + [[-0.2, -0.36], [0.05, -0.38], [0.25, -0.22]].map(([x, y]) => `<ellipse cx="${f(x * L)}" cy="${f(y * H)}" rx="1.4" ry="1" fill="${tohum}"/>`).join('');
  const kucuk = (r) => { const d = blob(6.6, 6, r, 7, 0.14); return `<path d="${d}" fill="${kab}" ${st(2)}/><g transform="translate(1 1.2) scale(.62)"><path d="${d}" fill="${et}"/></g><ellipse cx="-2.6" cy="-3" rx="1.1" ry=".8" fill="${tohum}"/>`; };
  C.cilek = {
    butun: () => butunKap(`<path d="M40 24c10-4 24-2 24 12 0 14-12 28-24 34C28 64 16 50 16 36c0-14 14-16 24-12z" fill="${kab}" ${st()}/><path d="M28 20l12 6 12-6-6 8 8 2-14 2-14-2 8-2z" fill="#6DBB5A" ${st(2)}/>${[[26, 38], [54, 38], [30, 52], [50, 52], [40, 62], [22, 30], [58, 30]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.2" fill="${tohum}"/>`).join('')}${parla('M24 32c2-4 6-6 10-6')}${yuz(40, 42, 0.8)}`),
    a: [
      () => P(48, 72, -10, 58, 52, kesik(58, 52, true)) + P(116, 72, 8, 58, 52, kesik(58, 52, true)),
      () => { const r = rng(71); return [[22, 48], [46, 42], [72, 50], [100, 44], [32, 76], [58, 80], [86, 74], [24, 106], [50, 110], [78, 102], [108, 106]].map(([x, y]) => golge(x + 1, y + 8, 7) + g(x, y, 0, kucuk(r))).join(''); },
      () => P(32, 46, -12, 42, 18, ceyrekC(42, 18)) + P(78, 42, 8, 42, 18, ceyrekC(42, 18)) + P(34, 78, 6, 42, 18, ceyrekC(42, 18)) + P(80, 80, -6, 42, 18, ceyrekC(42, 18)) + P(128, 56, 10, 34, 36, kesik(30, 34)) + P(124, 104, -8, 34, 36, kesik(30, 34)),
    ],
  };
}

/* ---------------- KARPUZ ---------------- */
{
  const et = '#FF8E8E', ust = '#FFB0AE', yan = '#F27373';
  const ucgen = `<path d="M-30 26Q-31 33-24 33H24Q31 33 30 26L4-32Q0-39-4-32Z" fill="${et}" ${st()}/><path d="M-30 26Q-31 33-24 33H24Q31 33 30 26Z" fill="#EEF6D6"/><path d="M-31 30Q-31 37-24 37H24Q31 37 31 30" fill="#6BB35A" ${st()}/><path d="M-30 26Q-31 33-24 33H24Q31 33 30 26L4-32Q0-39-4-32Z" fill="none" ${st()}/>${parla('M-14 10L-2-18', 2)}`;
  C.karpuz = {
    butun: () => butunKap(`<path d="M8 30h64c0 20-14 36-32 36S8 50 8 30z" fill="#6BB35A" ${st()}/><path d="M13 30h54c0 16-12 30-27 30S13 46 13 30z" fill="#EEF6D6"/><path d="M17 30h46c0 13-10 25-23 25S17 43 17 30z" fill="#FF8E8E"/><path d="M8 30h64c0 20-14 36-32 36S8 50 8 30z" fill="none" ${st()}/>${parla('M22 34c2 6 6 10 10 12')}${yuz(40, 38, 0.82)}`),
    a: [
      () => P(52, 70, -6, 62, 72, ucgen) + P(120, 72, 82, 91, 18, cubuk(91, 18, et)),
      () => { const r = rng(81), yer = [[22, 54], [44, 46], [68, 56], [96, 48], [30, 80], [54, 84], [80, 76], [24, 108], [50, 112], [76, 104], [104, 100]]; return yer.map(([x, y]) => golge(x + 2, y + 9, 7.5) + g(x, y, (r() - 0.5) * 16, kup(12.6, et, ust, yan))).join(''); },
      () => { const tri = (s) => `<path d="M${f(-s / 2)} ${f(s * 0.36)}L0 ${f(-s * 0.48)}L${f(s / 2)} ${f(s * 0.36)}Z" fill="${et}" ${st(2.2)}/>${parla(`M${f(-s * 0.18)} ${f(s * 0.1)}L${f(-s * 0.02)} ${f(-s * 0.2)}`, 1.6)}`; return [[30, 54, -10], [72, 48, 14], [114, 56, -6], [40, 102, 8], [82, 104, -16], [124, 100, 4]].map(([x, y, a]) => P(x, y, a, 21, 18, tri(21))).join(''); },
    ],
  };
}

/* ---------------- TAVUK ---------------- */
{
  const et = '#F7DDAE', lif = '#E2B97A';
  const serit = (L, T, r) => { const pts = []; const n = 14; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const k = 1 + (r() - 0.5) * 0.12; pts.push([Math.cos(a) * L / 2 * (Math.abs(Math.cos(a)) > 0.9 ? 0.98 : 1), Math.sin(a) * T / 2 * k]); } return `<path d="${egri(pts)}" fill="${et}" ${st()}/>` + [-0.2, 0.08, 0.28].map((k, i) => `<path d="M${f(-L * 0.36 + i * 4)} ${f(k * T)}q${f(L * 0.2)} ${f(-1.6)} ${f(L * 0.5)} 0" fill="none" stroke="${lif}" stroke-width="1.4" stroke-linecap="round"/>`).join('') + parla(`M${f(-L * 0.38)} ${f(-T * 0.3)}H${f(-L * 0.05)}`, 1.6); };
  const parca = (r, s) => { const d = blob(s / 2, s * 0.4, r, 8, 0.18); return `<path d="${d}" fill="${et}" ${st(2.2)}/><path d="M${f(-s * 0.28)} ${f(-s * 0.06)}q${f(s * 0.28)} -1.5 ${f(s * 0.5)} ${f(s * 0.08)}M${f(-s * 0.22)} ${f(s * 0.14)}q${f(s * 0.22)} -1.2 ${f(s * 0.4)} ${f(s * 0.04)}" fill="none" stroke="${lif}" stroke-width="1.3" stroke-linecap="round"/>`; };
  C.tavuk = {
    butun: () => butunKap(`<path d="M50 52l12 12" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M50 52l12 12" stroke="#FFF8EE" stroke-width="5.4" stroke-linecap="round"/><circle cx="64" cy="62" r="5" fill="#FFF8EE" ${st(2)}/><circle cx="60" cy="68" r="5" fill="#FFF8EE" ${st(2)}/><path d="M34 12c14 0 24 12 22 26-1 10-6 16-12 18-10 4-26 0-30-12-4-14 6-32 20-32z" fill="#E8B26A" ${st()}/>${parla('M22 26c3-6 8-9 14-9')}${yuz(36, 36, 0.85)}`),
    a: [
      () => { const r = rng(91); return buhar(118, 22, 0.8) + P(76, 40, -5, 91, 16, serit(91, 16, r)) + P(80, 72, 3, 91, 16, serit(91, 16, r)) + P(78, 104, -2, 91, 16, serit(91, 16, r)); },
      () => {
        const r = rng(92); let s = golge(68, 110, 52, 6) + `<ellipse cx="68" cy="88" rx="48" ry="22" fill="#FCEBD0"/>`;
        for (let i = 0; i < 30; i++) { const x = 30 + r() * 70, y = 72 + r() * 30, L = 10 + r() * 12, a = (r() - 0.5) * 2.2, b = (r() - 0.5) * 8, d = `M${f(x)} ${f(y)}c${f(Math.cos(a) * L / 3 + b)} ${f(Math.sin(a) * L / 3 - b / 2)} ${f(Math.cos(a) * L * 0.66 - b)} ${f(Math.sin(a) * L * 0.66 + b / 2)} ${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}`; s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${i % 4 ? et : '#EECB91'}" stroke-width="2.2" stroke-linecap="round"/>`; }
        return s + golge(136, 64, 16, 3) + g(136, 52, 0, `<path d="${blob(16, 11, rng(93), 9, 0.12)}" fill="#FFFDF7" ${st()}/><path d="M-6-2q4-5 9-1" fill="none" stroke="${INK}" stroke-width="1.4" opacity=".3" stroke-linecap="round"/>`);
      },
      () => { const r = rng(94); return [[26, 50, -10], [62, 44, 12], [100, 52, -4], [134, 46, 8], [36, 92, 6], [74, 98, -12], [112, 92, 10], [56, 124, 4]].map(([x, y, a]) => P(x, y, a, 19, 15, parca(r, 19))).join(''); },
    ],
  };
}

/* ---------------- KÖFTE ---------------- */
{
  const dis = '#B07A55', ic = '#CB9C76', y = '#7CB65A', t = '#F39A4A';
  const benek = (r, rx, ry, n) => Array.from({ length: n }, (_, i) => `<circle cx="${f((r() - 0.5) * rx * 1.5)}" cy="${f((r() - 0.5) * ry * 1.2)}" r="1.4" fill="${i % 2 ? y : t}"/>`).join('');
  const oval = (L, T, r) => `<path d="${blob(L / 2, T / 2, r, 12, 0.05)}" fill="${dis}" ${st()}/>${benek(r, L / 2, T / 2, 7)}` + parla(`M${f(-L * 0.36)} ${f(-T * 0.22)}q${f(L * 0.2)} ${f(-T * 0.18)} ${f(L * 0.42)} ${f(-T * 0.16)}`, 1.8);
  const kirinti = (r) => { const s = 5 + r() * 2.6; return `<path d="${blob(s, s * 0.85, r, 7, 0.24)}" fill="${r() > 0.4 ? dis : ic}" ${st(1.9)}/>`; };
  const yarim = (d) => { const R = d / 2; return `<path d="M${-R} 0A${R} ${R} 0 0 1 ${R} 0Z" fill="${dis}" ${st(2.2)}/><path d="M${f(-R * 0.86)} -.4A${f(R * 0.86)} ${f(R * 0.86)} 0 0 1 ${f(R * 0.86)} -.4Z" fill="${ic}"/><circle cx="-4" cy="-5" r="1.3" fill="${y}"/><circle cx="4" cy="-8" r="1.3" fill="${t}"/><path d="M${-R} 0H${R}" ${st(2.2)}/>`; };
  const ceyrekK = (d) => { const R = d / 2; return `<path d="M0 0H${R}A${R} ${R} 0 0 0 0 ${-R}Z" fill="${dis}" ${st(2.2)}/><path d="M1.6 -1.6H${f(R * 0.86)}A${f(R * 0.86)} ${f(R * 0.86)} 0 0 0 1.6 ${f(-R * 0.86)}Z" fill="${ic}"/><circle cx="6" cy="-6" r="1.2" fill="${y}"/><path d="M0 0H${R}M0 0V${-R}" ${st(2.2)}/>`; };
  C.kofte = {
    butun: () => butunKap(`<ellipse cx="40" cy="44" rx="28" ry="22" fill="${dis}" ${st()}/><circle cx="24" cy="38" r="1.8" fill="${y}"/><circle cx="56" cy="36" r="1.8" fill="${t}"/><circle cx="52" cy="56" r="1.8" fill="${y}"/>${parla('M20 34c4-6 10-9 16-9')}${yuz(40, 46, 0.85)}`),
    a: [
      () => { const r = rng(101); return buhar(120, 24, 0.8) + P(76, 58, -6, 91, 24, oval(91, 24, r)) + P(80, 100, 5, 91, 24, oval(91, 24, r)); },
      () => { const r = rng(102); return [[22, 50], [42, 44], [62, 52], [86, 46], [108, 54], [30, 76], [52, 80], [76, 74], [98, 82], [24, 106], [46, 110], [70, 102], [94, 108], [120, 102]].map(([x, yy]) => golge(x + 1, yy + 7, 6) + g(x, yy, 0, kirinti(r))).join(''); },
      () => golge(30, 62, 20, 3.5) + g(30, 54, -6, yarim(36)) + golge(78, 66, 20, 3.5) + g(78, 50, 180, yarim(36)) + golge(56, 124, 26, 4) + g(54, 104, 0, `<g transform="translate(-2 2)">${ceyrekK(36)}</g><g transform="translate(2 2) rotate(90)">${ceyrekK(36)}</g><g transform="translate(2 -2) rotate(180)">${ceyrekK(36)}</g><g transform="translate(-2 -2) rotate(270)">${ceyrekK(36)}</g>`) + yasak(126, 78, 22, `<circle r="13" fill="${dis}" ${st(2.2)}/>`),
    ],
  };
}

/* ---------------- YUMURTA ---------------- */
{
  const ak = '#FFFDF5', sari = '#FFD256', omlet = '#FFE27E', benek = '#F2BE3C', ot = '#7CB65A';
  const ceyrekY = (L, H) => { const ust = `M${f(-L / 2)} 0C${f(-L * 0.42)} ${f(-H * 1.05)} ${f(L * 0.3)} ${f(-H * 1.1)} ${f(L / 2)} 0`; return `<path d="${ust}Q0 ${f(H * 0.5)} ${f(-L / 2)} 0Z" fill="${ak}" ${st()}/><path d="M${f(-L * 0.3)} ${f(-H * 0.08)}C${f(-L * 0.22)} ${f(-H * 0.62)} ${f(L * 0.16)} ${f(-H * 0.64)} ${f(L * 0.3)} ${f(-H * 0.08)}Q0 ${f(H * 0.2)} ${f(-L * 0.3)} ${f(-H * 0.08)}Z" fill="${sari}"/>` + parla(`M${f(-L * 0.36)} ${f(-H * 0.5)}q${f(L * 0.1)} ${f(-H * 0.36)} ${f(L * 0.26)} ${f(-H * 0.46)}`, 1.6); };
  const serit = (L, T) => `<rect x="${f(-L / 2)}" y="${f(-T / 2)}" width="${f(L)}" height="${f(T)}" rx="5" fill="${omlet}" ${st()}/>` + [[-0.32, -0.15, benek], [-0.1, 0.18, ot], [0.08, -0.2, benek], [0.28, 0.12, ot], [0.4, -0.12, benek]].map(([x, y, c]) => `<circle cx="${f(x * L)}" cy="${f(y * T)}" r="1.6" fill="${c}"/>`).join('') + parla(`M${f(-L * 0.42)} ${f(-T * 0.26)}H${f(-L * 0.1)}`, 1.6);
  const kare = (s) => `<rect x="${f(-s / 2)}" y="${f(-s / 2)}" width="${f(s)}" height="${f(s)}" rx="${f(s * 0.18)}" fill="${omlet}" ${st(2)}/><circle cx="${f(-s * 0.15)}" cy="${f(-s * 0.1)}" r="1.3" fill="${benek}"/><circle cx="${f(s * 0.18)}" cy="${f(s * 0.15)}" r="1.2" fill="${ot}"/>`;
  const dilim = (rx, ry) => `<ellipse rx="${rx}" ry="${ry}" fill="${ak}" ${st()}/><circle cx="${f(rx * 0.08)}" cy="1" r="${f(ry * 0.56)}" fill="${sari}" ${st(1.6)}/>` + parla(`M${f(-rx * 0.7)} ${f(-ry * 0.2)}a${f(rx * 0.7)} ${f(ry * 0.7)} 0 0 1 ${f(rx * 0.4)} ${f(-ry * 0.5)}`, 1.6);
  C.yumurta = {
    butun: () => butunKap(`<path d="M40 8c-14 0-24 24-24 38 0 14 10 24 24 24s24-10 24-24C64 32 54 8 40 8z" fill="${ak}" ${st()}/>${parla('M26 30c2-8 6-14 10-16')}${yuz(40, 46, 0.85)}`),
    a: [
      () => P(42, 50, -8, 60, 22, ceyrekY(60, 22)) + P(112, 54, 10, 60, 22, ceyrekY(60, 22)) + P(80, 104, -3, 91, 17, serit(91, 17)),
      () => { const r = rng(111); let s = ''; [[22, 50], [44, 58], [30, 76], [56, 84], [20, 104], [46, 110]].forEach(([x, y]) => { s += golge(x + 1, y + 7, 6) + g(x, y, 0, `<path d="${blob(6.6, 5.6, r, 7, 0.2)}" fill="${ak}" ${st(1.9)}/>`); }); [[60, 44], [74, 64], [36, 94], [66, 104]].forEach(([x, y]) => { s += golge(x + 1, y + 5, 4) + g(x, y, 0, `<path d="${blob(4.6, 4, r, 6, 0.2)}" fill="${sari}" ${st(1.8)}/>`); }); [[96, 50], [120, 56], [100, 80], [126, 86], [98, 108], [124, 112]].forEach(([x, y]) => { s += golge(x + 1, y + 8, 7) + g(x, y, (r() - 0.5) * 20, kare(12.6)); }); return s; },
      () => P(40, 50, -6, 52, 38, dilim(26, 18)) + P(102, 46, 8, 52, 38, dilim(26, 18)) + [[34, 106], [70, 110], [106, 104], [140, 100]].map(([x, y], i) => P(x, y, (i % 2 ? 1 : -1) * 10, 19, 19, kare(19))).join(''),
    ],
  };
}

/* ---------------- MAKARNA ---------------- */
{
  const m = '#FFE08A', koyu = '#E8BC50', delik = '#F0CB66';
  const burgu = (L, T) => { let s = `<rect x="${f(-L / 2)}" y="${f(-T / 2)}" width="${f(L)}" height="${f(T)}" rx="${f(T * 0.48)}" fill="${m}" ${st()}/>`; const n = Math.round(L / (T * 0.62)); for (let i = 0; i < n; i++) { const x = -L / 2 + T * 0.4 + i * ((L - T * 0.8) / (n - 1)); s += `<path d="M${f(x - T * 0.3)} ${f(T * 0.44)}Q${f(x + T * 0.12)} 0 ${f(x + T * 0.3)} ${f(-T * 0.44)}" fill="none" stroke="${koyu}" stroke-width="${f(T * 0.16)}" stroke-linecap="round"/><path d="M${f(x - T * 0.3)} ${f(T * 0.44)}Q${f(x + T * 0.12)} 0 ${f(x + T * 0.3)} ${f(-T * 0.44)}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" opacity=".45"/>`; } return s + `<rect x="${f(-L / 2)}" y="${f(-T / 2)}" width="${f(L)}" height="${f(T)}" rx="${f(T * 0.48)}" fill="none" ${st()}/>`; };
  const kalem = (L, T, w = 2.4) => { const e = T * 0.4; return `<path d="M${f(-L / 2 + e)} ${f(-T / 2)}H${f(L / 2)}L${f(L / 2 - e)} ${f(T / 2)}H${f(-L / 2)}Z" fill="${m}" ${st(w)}/>` + [0.25, 0.5, 0.75].map((k) => `<path d="M${f(-L / 2 + e * (1 - k) + 3)} ${f(-T / 2 + T * k)}H${f(L / 2 - e * k - 3)}" stroke="${koyu}" stroke-width="1.4" stroke-linecap="round"/>`).join('') + `<ellipse cx="${f(L / 2 - e / 2)}" cy="0" rx="${f(e * 0.42)}" ry="${f(T * 0.42)}" transform="rotate(${f(Math.atan2(e, T) * 57)} ${f(L / 2 - e / 2)} 0)" fill="${delik}" ${st(Math.min(w, 1.8))}/>`; };
  const deniz = (s) => `<path d="M0 ${f(s * 0.5)}C${f(-s * 0.7)} ${f(s * 0.3)} ${f(-s * 0.6)} ${f(-s * 0.55)} 0 ${f(-s * 0.5)}C${f(s * 0.6)} ${f(-s * 0.55)} ${f(s * 0.7)} ${f(s * 0.3)} 0 ${f(s * 0.5)}Z" fill="${m}" ${st(2)}/><path d="M0 ${f(s * 0.4)}V${f(-s * 0.35)}M0 ${f(s * 0.4)}L${f(-s * 0.3)} ${f(-s * 0.3)}M0 ${f(s * 0.4)}L${f(s * 0.3)} ${f(-s * 0.3)}" stroke="${koyu}" stroke-width="1.3" stroke-linecap="round"/>`;
  C.makarna = {
    butun: () => butunKap(`<path d="M24 14H56L50 66H30Z" fill="${m}" ${st()}/><ellipse cx="40" cy="14" rx="16" ry="5" fill="${delik}" ${st(2.2)}/><path d="M30 24h20M30 54h20" stroke="${koyu}" stroke-width="2" stroke-linecap="round"/>${yuz(40, 40, 0.85)}`),
    a: [
      () => P(52, 46, -14, 63, 21, burgu(63, 21)) + P(112, 54, 18, 63, 21, kalem(63, 21)) + P(70, 104, 6, 63, 21, burgu(63, 21)),
      () => [[24, 50, -10], [52, 44, 14], [82, 52, -4], [30, 80, 20], [62, 84, -16], [92, 78, 8]].map(([x, y, a]) => P(x, y, a, 17, 10, kalem(17, 10, 1.9))).join('') + [[26, 110, 0], [54, 114, 20], [84, 108, -14], [114, 104, 8], [118, 70, -10]].map(([x, y, a]) => P(x, y, a, 13, 13, deniz(13))).join(''),
      () => { const r = rng(121); let s = golge(66, 76, 54, 6); for (let i = 0; i < 11; i++) { const x = 22 + r() * 70, y = 34 + r() * 36, a = (r() - 0.5) * 1.6, L = 49, b = (r() - 0.5) * 10, d = `M${f(x)} ${f(y)}q${f(Math.cos(a) * L / 2 + b)} ${f(Math.sin(a) * L / 2 - b)} ${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}`; s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${m}" stroke-width="3" stroke-linecap="round"/>`; } return s + [[34, 106, -8], [80, 110, 10], [128, 100, -16]].map(([x, y, a]) => P(x, y, a, 35, 13, kalem(35, 13, 2.1))).join(''); },
    ],
  };
}

/* ---------------- PEYNİR ---------------- */
{
  const lor = '#FFFDF3', kasar = '#FFE58A', koyu = '#EFC548';
  const lorYigin = (seed) => { const r = rng(seed), d = []; for (let i = 0; i < 22; i++) { const a = r() * Math.PI * 2, k = Math.sqrt(r()); d.push(`<circle cx="${f(Math.cos(a) * 26 * k)}" cy="${f(Math.sin(a) * 12 * k - (1 - k) * 6)}" r="${f(4 + r() * 3)}"/>`); } return golge(2, 16, 32, 4) + birlesik(d, lor, 2.2) + `<g fill="#F1E9D2">${d.slice(0, 8).map((c) => c.replace(/r="[\d.]+"/, 'r="1.4"')).join('')}</g>`; };
  const dilimK = (s, kat = 1.6) => `<path d="M${f(-s / 2)} ${f(s / 2)}h${f(s)}v${f(-kat)}h${f(-s)}z" fill="${koyu}" ${st(1.6)}/><path d="M${f(-s / 2)} ${f(-s / 2)}H${f(s / 2)}V${f(s / 2 - kat - s * 0.22)}Q${f(s / 2 - s * 0.05)} ${f(s / 2 - kat)} ${f(s / 2 - s * 0.24)} ${f(s / 2 - kat)}H${f(-s / 2)}Z" fill="${kasar}" ${st(2)}/><path d="M${f(s / 2)} ${f(s / 2 - kat - s * 0.22)}Q${f(s / 2 - s * 0.22)} ${f(s / 2 - kat - s * 0.2)} ${f(s / 2 - s * 0.24)} ${f(s / 2 - kat)}" fill="#FFF3BF" ${st(1.6)}/>` + (s > 20 ? `<circle cx="${f(s * 0.12)}" cy="${f(-s * 0.08)}" r="2.6" fill="${koyu}" opacity=".55"/><circle cx="${f(-s * 0.22)}" cy="${f(s * 0.18)}" r="1.8" fill="${koyu}" opacity=".55"/>` : '') + parla(`M${f(-s * 0.36)} ${f(-s * 0.3)}H${f(-s * 0.05)}`, 1.4);
  C.peynir = {
    butun: () => butunKap(`<path d="M10 40L56 16l14 24v24H10z" fill="${kasar}" ${st()}/><path d="M10 40h60" ${st()}/><path d="M10 40L56 16l14 24z" fill="#FFF0B3" ${st()}/><circle cx="22" cy="52" r="4" fill="${koyu}"/><circle cx="58" cy="58" r="3" fill="${koyu}"/>${yuz(40, 52, 0.8)}`),
    a: [
      () => g(58, 78, 0, lorYigin(131)) + rende(128, 88, 22, 15, '#F7D45E', '#FFF4C4', 133, 18),
      () => P(48, 52, -8, 40, 40, dilimK(36)) + [[28, 104, -6], [58, 108, 10], [96, 50, 14], [100, 82, -10]].map(([x, y, a]) => P(x, y, a, 17, 17, dilimK(17, 1.2))).join('') + rende(130, 106, 16, 11, '#F7D45E', '#FFF4C4', 137, 11),
      () => [[64, 34, -6], [68, 52, 3], [62, 70, -2], [70, 88, 5]].map(([x, y, a]) => P(x, y, a, 70, 8.4, `<rect x="-35" y="-4.2" width="70" height="8.4" rx="2" fill="${kasar}" ${st(2)}/>${parla('M-30-1.2H-6', 1.4)}`)).join('') + P(124, 112, 8, 34, 30, dilimK(30)),
    ],
  };
}

const KESIM_CIZIM = C;
const ASAMA_DOSYA = ['6-8', '9-12', '12'];
/** Tüm çizim dosyaları: [{ad, svg}] */
export function kesimDosyalari(etiket = () => '') {
  const out = [];
  for (const [slug, c] of Object.entries(C)) {
    out.push({ ad: `${slug}.svg`, svg: c.butun() });
    c.a.forEach((fn, i) => out.push({ ad: `${slug}-${ASAMA_DOSYA[i]}.svg`, svg: sahne(i, fn(), etiket(slug, i)) }));
  }
  return out;
}


/* =====================================================================
   SAYFA
   ===================================================================== */
const ASAMALAR = [
  { anahtar: '6-8', dosya: '6-8', ad: '6–8 ay', beceri: 'Avuç kavrama', renk: 'seftali' },
  { anahtar: '9-12', dosya: '9-12', ad: '9–12 ay', beceri: 'Kıskaç tutuşu', renk: 'mint' },
  { anahtar: '12+', dosya: '12', ad: '12 ay +', beceri: 'Isırma & çiğneme', renk: 'sari' },
];
const RISK = {
  dusuk: { ad: 'Düşük', ikon: 'fa-circle-check' },
  orta: { ad: 'Orta', ikon: 'fa-circle-exclamation' },
  yuksek: { ad: 'Yüksek', ikon: 'fa-triangle-exclamation' },
};
const GRUP_AD = { sebze: 'Sebze', meyve: 'Meyve', protein: 'Protein', tahil: 'Tahıl', 'sut-urunu': 'Süt ürünü', 'süt ürünü': 'Süt ürünü', kuruyemis: 'Kuruyemiş', baklagil: 'Baklagil' };
const GRUP_IKON = { protein: 'fa-drumstick-bite', tahil: 'fa-wheat-awn', 'sut-urunu': 'fa-cheese', 'süt ürünü': 'fa-cheese', baklagil: 'fa-seedling', kuruyemis: 'fa-seedling' };
const ESANLAM_EK = { 'kiraz-domates': ['çeri domates', 'cherry domates', 'domates'], uzum: ['üzüm tanesi'], 'yaban-mersini': ['blueberry'] };
const SVG_KLASOR = 'varlik/kids/svg/kesim';

/* ---------- Türkçe duyarsız arama anahtarı (kesim.js ile aynı kural) ---------- */
export const normal = (s) => String(s || '').toLocaleLowerCase('tr')
  .replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u')
  .replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u').replace(/\s+/g, ' ').trim();

/* ---------- Çizim dosyalarını yaz (yalnız değişenleri) ---------- */
function cizimleriYaz() {
  const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..', SVG_KLASOR);
  fs.mkdirSync(kok, { recursive: true });
  let n = 0;
  for (const { ad, svg } of kesimDosyalari()) {
    const yol = path.join(kok, ad);
    const icerik = svg + '\n';
    if (!fs.existsSync(yol) || fs.readFileSync(yol, 'utf8') !== icerik) { fs.writeFileSync(yol, icerik); n++; }
  }
  return n;
}

/* ---------- "Asla bütün vermeyin" mini şemaları ---------- */
function yasakSvg(tur) {
  const ic = {
    uzum: '<g stroke="#4A3A34" stroke-width="1.8"><circle cx="30" cy="27" r="9" fill="#A57AC8"/><circle cx="44" cy="31" r="9" fill="#B489D4"/><circle cx="36" cy="43" r="9" fill="#A57AC8"/></g><path d="M37 18q3-7 9-8" stroke="#4A3A34" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="27" cy="24" r="2.4" fill="#fff" opacity=".6"/>',
    domates: '<g stroke="#4A3A34" stroke-width="1.8"><circle cx="30" cy="36" r="11" fill="#E85A4F"/><circle cx="46" cy="34" r="10" fill="#F2685C"/></g><path d="M26 25l4 3 4-3M42 24l4 3 4-3" stroke="#4E9A55" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="26" cy="32" r="2.4" fill="#fff" opacity=".6"/>',
    kuruyemis: '<g stroke="#4A3A34" stroke-width="1.8"><path d="M22 40c0-9 6-16 12-16s12 7 12 16-6 12-12 12-12-3-12-12z" fill="#C48A55"/><ellipse cx="46" cy="30" rx="8" ry="10" fill="#D9A066" transform="rotate(25 46 30)"/></g><path d="M28 30q6-3 12 0" stroke="#8C5E36" stroke-width="1.4" fill="none"/>',
    misir: '<g stroke="#4A3A34" stroke-width="1.6" fill="#FFF7DC"><circle cx="28" cy="34" r="7"/><circle cx="36" cy="27" r="7"/><circle cx="43" cy="35" r="7"/><circle cx="35" cy="41" r="7"/></g><circle cx="36" cy="34" r="3" fill="#F4C542"/><circle cx="46" cy="44" r="2.4" fill="#F4C542"/>',
    sebze: '<g stroke="#4A3A34" stroke-width="1.8"><rect x="16" y="31" width="40" height="11" rx="5" fill="#FFA65F" transform="rotate(-18 36 36)"/></g><path d="M52 24q5-4 9-2M52 26q5 0 8 4" stroke="#4E9A55" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
  }[tur] || '';
  return `<svg viewBox="0 0 72 72" aria-hidden="true" focusable="false"><circle cx="36" cy="36" r="34" fill="#fff"/>${ic}<circle cx="36" cy="36" r="30" fill="none" stroke="#D2453A" stroke-width="4.5"/><path d="M15 57L57 15" stroke="#D2453A" stroke-width="4.5" stroke-linecap="round"/></svg>`;
}

const TEHLIKELER = [
  { tur: 'uzum', ad: 'Bütün üzüm', neden: 'Yuvarlak ve kaygan; soluk yolunu tam olarak tıkayabilir.', yerine: 'Boyuna dörde bölün; küçük bebeklerde ayrıca hafifçe ezin.', yas: '4 yaşına kadar bütün verilmez', slug: 'uzum' },
  { tur: 'domates', ad: 'Kiraz (çeri) domates', neden: 'Üzüm gibi yuvarlak ve kaygandır; kabuğu da kayar.', yerine: 'Boyuna dörde bölün; yaban mersini ve zeytin için de aynısını yapın.', yas: '4 yaşına kadar bütün verilmez', slug: 'kiraz-domates' },
  { tur: 'kuruyemis', ad: 'Bütün kuruyemiş', neden: 'Fındık, fıstık, badem ve ceviz sert ve küçüktür; çiğnenmeden yutulabilir.', yerine: 'Şekersiz-tuzsuz ezmesini sulandırıp püreye karıştırın ya da çok ince sürün.', yas: '5 yaşına kadar bütün ya da iri parça verilmez', slug: '' },
  { tur: 'misir', ad: 'Patlamış mısır', neden: 'Sert taneler ve kabuk parçaları nefesle birlikte soluk yoluna kaçabilir.', yerine: 'Ağızda kolayca yumuşayan atıştırmalıklar: pişmiş sebze çubukları, olgun meyve.', yas: 'Küçük çocuklara önerilmez', slug: '' },
  { tur: 'sebze', ad: 'Sert çiğ sebze ve meyve', neden: 'Çiğ havuç ya da elma dilimi gibi sert parçalar kopar ve çiğnenemeden yutulabilir.', yerine: 'Yumuşayana kadar pişirin ya da ince rendeleyin.', yas: 'Çiğneme becerisi gelişene kadar iri sert parça yok', slug: 'havuc' },
];

const PARMAK_MINI = `<svg class="kd-kokuma__parmak" viewBox="164 70 34 72" aria-hidden="true" focusable="false">${PARMAK}</svg>`;

export default async function kesim(o) {
  const { esc, ikon } = o;
  cizimleriYaz();
  const besinler = (o.veri.besinler && o.veri.besinler.besinler) || [];
  const besinHarita = new Map(besinler.map((b) => [b.slug, b]));
  const ham = Array.isArray(o.veri.kesim) ? o.veri.kesim : [];
  const atlas = ham.filter((x) => x && x.slug && x.ad).slice().sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
  const sluglar = new Set(atlas.map((x) => x.slug));
  const buyukHarf = (s) => GRUP_AD[s] || String(s || '').replace(/-/g, ' ').replace(/^./, (c) => c.toLocaleUpperCase('tr'));
  const besinIkon = (x) => (KESIM_CIZIM[x.slug]
    ? `<img src="${SVG_KLASOR}/${x.slug}.svg" width="56" height="56" alt="" loading="lazy" decoding="async">`
    : `<i class="fa-solid ${x.slug === 'yumurta' ? 'fa-egg' : GRUP_IKON[x.grup] || 'fa-utensils'}" aria-hidden="true"></i>`);

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
    const cizimVar = !!KESIM_CIZIM[x.slug] && !verilmez;
    const alt = `${as.ad}: ${x.ad} · ${obj.cizim || obj.boyut || obj.nasil || 'bu formda verilmez'}`;
    const sekil = cizimVar
      ? `<img src="${SVG_KLASOR}/${x.slug}-${as.dosya}.svg" width="200" height="140" alt="${esc(alt)}" loading="lazy" decoding="async">`
      : `<div class="kd-kasama__bos"><svg viewBox="0 0 72 72" role="img" aria-label="${esc(alt)}"><circle cx="36" cy="36" r="26" fill="#FDECEC" stroke="#D2453A" stroke-width="4"/><path d="M24 24l24 24M48 24L24 48" stroke="#D2453A" stroke-width="5" stroke-linecap="round"/></svg></div>`;
    return `<li class="kd-kasama${verilmez ? ' kd-kasama--yok' : ''}" data-asama="${as.anahtar}" data-renk="${as.renk}">
      <div class="kd-kasama__ust"><span class="kd-kasama__yas">${as.ad}</span><small>${as.beceri}</small></div>
      <figure class="kd-kasama__sekil">${sekil}</figure>
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
      ? `<p class="kd-kesim__ezilme"><span class="kd-kesim__ezilme-ikon" aria-hidden="true"><i class="fa-solid fa-hand-back-fist"></i></span><span><b>Ezilme testi</b> ${esc(typeof x.ezilmeTesti === 'string' ? x.ezilmeTesti : (x.pisirme && /pişir/i.test(x.pisirme) && !/^Çiğ olarak/i.test(x.pisirme) ? 'Pişmiş parçayı' : 'Parçayı') + ' başparmağınızla işaret parmağınız arasında hafifçe bastırın; kolayca eziliyorsa bebeğiniz için yeterince yumuşaktır.')}</span></p>`
      : '';
    const asla = x.asla ? `<p class="kd-kesim__asla"><span class="kd-kesim__asla-ikon" aria-hidden="true"><i class="fa-solid fa-xmark"></i></span><span><b>Asla:</b> ${esc(x.asla)}</span></p>` : '';
    return `<article class="kd-kesim kd-gir" id="${esc(x.slug)}" data-besin="${esc(x.slug)}" data-grup="${esc(x.grup || '')}" data-risk="${esc(x.risk || '')}" data-ara="${esc(ara)}" aria-labelledby="k-${esc(x.slug)}" style="--kd-gecikme:${Math.min(n % 4, 3) * 50}ms">
  <header class="kd-kesim__bas">
   <span class="kd-kesim__ikon" data-grup="${esc(x.grup || '')}">${besinIkon(x)}</span>
   <div class="kd-kesim__ad"><h3 id="k-${esc(x.slug)}">${esc(x.ad)}</h3>${x.grup ? `<small>${esc(buyukHarf(x.grup))}</small>` : ''}</div>
   ${r ? `<span class="kd-krisk" data-risk="${x.risk}"><i class="fa-solid ${r.ikon}" aria-hidden="true"></i><span><span class="kd-krisk__on">Boğulma riski: </span>${r.ad}</span></span>` : ''}
   <a class="kd-kesim__bag" href="#${esc(x.slug)}" aria-label="${esc(x.ad)} kartının bağlantısı" title="Bu kartın bağlantısı"><i class="fa-solid fa-link" aria-hidden="true"></i></a>
  </header>
  ${x.pisirme ? `<p class="kd-kesim__pisirme"><i class="fa-solid fa-fire-burner" aria-hidden="true"></i><span><b>Hazırlık:</b> ${esc(x.pisirme)}</span></p>` : ''}
  <ol class="kd-kesim__asamalar" aria-label="${esc(x.ad)}: yaşa göre kesim">${ASAMALAR.map((_, i) => asamaHucre(x, i)).join('')}</ol>
  <p class="kd-kesim__olcek"><i class="fa-regular fa-hand-point-up" aria-hidden="true"></i> Çizimlerin sağındaki parmak: yetişkin parmak ucu ölçeği (üç aşamada aynı boyut).</p>
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
   <div class="kd-kokuma__metin"><h3>Kartlar nasıl okunur?</h3><p>Her besin üç aşamada, aynı ölçekte çizildi. Çizimin sağındaki parmak <b>yetişkin parmak ucu ölçeği</b>; parçaların boyunu onunla kıyaslayın. Buhar çizgisi olan parçalar pişmiş, üstü kırmızı çizili olanlar o yaşta verilmez.</p></div>
   <ul class="kd-kokuma__asamalar">${ASAMALAR.map((a) => `<li data-renk="${a.renk}"><b>${a.ad}</b><small>${a.beceri}</small></li>`).join('')}</ul>
   ${PARMAK_MINI}
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

  const illus = o.illus ? o.illus('hero-kesim', 'Kesme tahtasında yaşa göre kesilmiş meyve ve sebzeler', { yedek: 'kesim-tahtasi', sinif: 'kd-khero__illus' }) : o.sahne('kesim-tahtasi', '');
  const maskot = o.maskot ? o.maskot('bicak', { boy: 96, sinif: 'kd-khero__maskot' }) : '';
  const ornekSlug = KESIM_CIZIM.havuc ? 'havuc' : Object.keys(KESIM_CIZIM)[0];

  const main = o.sayfa(`
${o.hero({
  renk: 'mint',
  kirinti: [['Tarifler', 'tarifler.html'], ['Dada Kids', 'kids.html'], ['Güvenli Kesim']],
  ust: { metin: 'Güvenli kesim atlası', ikon: 'bicak-tahta' },
  baslik: 'Her besin, her yaşta<br>doğru boyutta',
  giris: `${atlas.length} besin için üç aşamalı kesim: 6–8 ay avuçla kavrar, 9–12 ay iki parmakla tutar, 12 ay sonrası ısırıp çiğner. Çizimlere bakın, parmak ucunuzla kıyaslayın, gönül rahatlığıyla hazırlayın.`,
  eylemler: `<a class="kd-btn" href="#atlas"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Besin arayın</a><a class="kd-btn kd-btn--hafif" href="#bogulma-bas">Asla bütün verilmeyenler</a>`,
  sag: `<div class="kd-khero">${illus}${maskot}<figure class="kd-khero__ornek"><img src="${SVG_KLASOR}/${ornekSlug}-6-8.svg" width="200" height="140" alt="Örnek: 6–8 ay için parmak boyunda, pişmiş havuç çubukları ve yetişkin parmak ucu ölçeği" decoding="async"><figcaption>6–8 ay · parmak boyu, pişmiş</figcaption></figure></div>`,
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
${o.ayirici ? o.ayirici('dalga', '#fff') : ''}
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
    aciklama: 'Bebek ve küçük çocuklar için besin besin güvenli kesim rehberi: aynı ölçekte çizilmiş üç aşama, boğulma riski, asla bütün verilmeyen besinler.',
    aktif: 'kesim',
    css: ['kesim'],
    js: ['kesim'],
    main,
  }];
}
