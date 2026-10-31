// Pütür maskot üreticisi — varlik/kids/maskot/<poz>.svg
import fs from 'node:fs';
const OUT = process.argv[2];
const INK = '#4A3A34', EYE = '#3A2E2A', CREAM = '#FFF8F0', PEACH = '#FFC4A3', PINK = '#F7B8CB',
  MINT = '#A6E3CB', BLUE = '#AFD3F5', YEL = '#FFDF7E', LEAF = '#8CCB8F', ORANGE = '#F5A25D',
  BERRY = '#E96D8F', WOOD = '#E8C9A0', RIM = '#FFE9D6';
const SW = 5;

// --- parçalar -------------------------------------------------------------
const shadow = `<ellipse cx="80" cy="149" rx="42" ry="5" fill="${INK}" opacity=".09"/>`;
const feet = `<ellipse cx="63" cy="142" rx="10" ry="6.5" fill="${CREAM}"/><ellipse cx="97" cy="142" rx="10" ry="6.5" fill="${CREAM}"/>`;
const body = `<path d="M30 80H130C130 114 110 140 80 140S30 114 30 80Z" fill="${CREAM}"/>`
  + `<clipPath id="putur-govde"><path d="M30 80H130C130 114 110 140 80 140S30 114 30 80Z"/></clipPath><path clip-path="url(#putur-govde)" d="M20 110Q80 126 140 110" fill="none" stroke="${PINK}" stroke-width="5" opacity=".9"/>`
  + `<path d="M38 88Q40 104 50 116" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/>`;
const rim = `<ellipse cx="80" cy="80" rx="52" ry="11" fill="${RIM}"/>`;
const lip = `<path d="M28 80A52 11 0 0 0 132 80H124A44 4 0 0 1 36 80Z" fill="${RIM}" stroke-width="4"/>`;
// püre tepesi + kıvrım (saç bukle gibi)
const puree = (hat = false) => `<g class="tepe"><path d="M34 80C36 64 58 56 80 58S124 64 126 80" fill="${PEACH}"/>`
  + (hat ? '' : `<path d="M74 60C70 46 86 38 94 46S90 60 84 55" fill="none" stroke="${INK}" stroke-width="15"/><path d="M74 60C70 46 86 38 94 46S90 60 84 55" fill="none" stroke="${PEACH}" stroke-width="${15 - 2 * SW + 1}"/>`)
  + `<ellipse cx="62" cy="68" rx="7" ry="3" fill="#fff" opacity=".6" stroke="none"/></g>`;
const blush = `<ellipse cx="54" cy="108" rx="7" ry="4" fill="${PINK}" stroke="none"/><ellipse cx="106" cy="108" rx="7" ry="4" fill="${PINK}" stroke="none"/>`;
const eyesOpen = (dx = 0, dy = 0) => `<g class="goz" stroke="none"><ellipse cx="${66 + dx}" cy="${98 + dy}" rx="4" ry="5.2" fill="${EYE}"/><ellipse cx="${94 + dx}" cy="${98 + dy}" rx="4" ry="5.2" fill="${EYE}"/><circle cx="${67.4 + dx}" cy="${96 + dy}" r="1.5" fill="#fff"/><circle cx="${95.4 + dx}" cy="${96 + dy}" r="1.5" fill="#fff"/></g>`;
const eyesClosed = `<path d="M61 99Q66 103 71 99M89 99Q94 103 99 99" fill="none" stroke="${EYE}" stroke-width="3"/>`;
const eyesHappy = `<path d="M61 100Q66 94 71 100M89 100Q94 94 99 100" fill="none" stroke="${EYE}" stroke-width="3"/>`;
const smile = (o = 0) => `<path d="M${75 + o} 107Q80 112 ${85 + o} 107" fill="none" stroke="${EYE}" stroke-width="3"/>`;
const smileOpen = `<path d="M74 106Q80 116 86 106Z" fill="${BERRY}" stroke="${EYE}" stroke-width="2.6"/>`;
const arm = (x, y, cls = '') => `<ellipse ${cls ? `class="${cls}" ` : ''}cx="${x}" cy="${y}" rx="8" ry="9.5" fill="${CREAM}"/>`;
const spoon = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-3.5" y="0" width="7" height="34" rx="3.5" fill="${WOOD}"/><ellipse cx="0" cy="-8" rx="8" ry="10.5" fill="${WOOD}"/><ellipse cx="0" cy="-8" rx="4" ry="6" fill="#F3DFC3" stroke="none"/></g>`;
const sparkle = (x, y, s = 1, c = YEL) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-7Q1-1 7 0Q1 1 0 7Q-1 1-7 0Q-1-1 0-7Z" fill="${c}" stroke-width="${2.4 / s}"/>`;

const face = (eyes = eyesOpen(), mouth = smile()) => blush + eyes + mouth;
const base = ({ hat = false, eyes, mouth, front = '' } = {}) => shadow + feet + body + rim + puree(hat) + lip + face(eyes, mouth) + front;

// --- pozlar ---------------------------------------------------------------
const P = {};
P.merhaba = {
  css: `.el{transform-origin:132px 86px;animation:salla 1.6s ease-in-out infinite}@keyframes salla{0%,100%{transform:rotate(0)}50%{transform:rotate(-18deg)}}`,
  g: base({ mouth: smileOpen }) + arm(28, 104)
    + `<g class="el"><ellipse cx="138" cy="66" rx="8" ry="9.5" fill="${CREAM}"/></g>`
    + `<path d="M148 50l5-5M152 62h7M145 41l1-7" fill="none" stroke-width="3"/>`
};
P.kasik = {
  css: `.ks{transform-origin:136px 96px;animation:kal 2s ease-in-out infinite}@keyframes kal{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`,
  g: base({ eyes: eyesHappy, mouth: smileOpen }) + arm(28, 104)
    + `<g class="ks">${spoon(138, 58, 12)}${arm(136, 92)}</g>` + sparkle(150, 28, .9)
};
P.kitap = {
  g: base({ eyes: eyesOpen(0, 3), mouth: smile() })
    + `<g transform="translate(0 2)"><path d="M80 120C66 112 50 112 38 116V142C50 138 66 138 80 146Z" fill="${MINT}"/><path d="M80 120C94 112 110 112 122 116V142C110 138 94 138 80 146Z" fill="${MINT}"/><path d="M80 124C68 118 54 118 44 121V138C54 135 68 135 80 141ZM80 124C92 118 106 118 116 121V138C106 135 92 135 80 141Z" fill="${CREAM}" stroke-width="2.6"/><path d="M80 124V141" stroke-width="2.6"/><path d="M52 126Q60 124 70 127M90 127Q100 124 108 126" fill="none" stroke="${PINK}" stroke-width="3"/></g>`
    + arm(40, 126) + arm(120, 126) + sparkle(132, 46, .8, PINK)
};
P.buyutec = {
  css: `.bu{transform-origin:126px 116px;animation:ara 2.4s ease-in-out infinite}@keyframes ara{0%,100%{transform:rotate(0)}50%{transform:rotate(8deg)}}`,
  g: base({ eyes: eyesOpen(4, -1), mouth: smile(3) }) + arm(28, 104)
    + `<g class="bu"><rect x="121" y="104" width="10" height="34" rx="5" transform="rotate(-30 126 121)" fill="${PINK}"/><circle cx="118" cy="88" r="20" fill="${BLUE}" fill-opacity=".55"/><path d="M106 80Q110 74 116 73" fill="none" stroke="#fff" stroke-width="3.5"/>${arm(132, 118)}</g>`
};
P.takvim = {
  g: base({ eyes: eyesOpen(0, -2), mouth: smileOpen })
    + `<g transform="translate(0 7) rotate(-6 80 126)"><rect x="52" y="106" width="56" height="40" rx="8" fill="${CREAM}"/><path d="M52 118V114a8 8 0 0 1 8-8h40a8 8 0 0 1 8 8v4Z" fill="${YEL}"/><path d="M66 102v8M94 102v8" stroke-width="4"/>`
    + [[60, 124, MINT], [74, 124, PINK], [88, 124, BLUE], [60, 135, PEACH], [74, 135, YEL], [88, 135, MINT]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="9" height="7" rx="2" fill="${c}" stroke="none"/>`).join('')
    + `<path d="M99 135l2.5 3 4-5" fill="none" stroke="${BERRY}" stroke-width="2.6"/></g>` + arm(48, 134) + arm(112, 134)
};
P.uyku = {
  css: `.nf{transform-origin:80px 140px;animation:nefes 3.2s ease-in-out infinite}@keyframes nefes{0%,100%{transform:scale(1)}50%{transform:scale(1.025,.975)}}.ba{animation:bal 3.2s ease-in-out infinite}@keyframes bal{0%,100%{opacity:.4;transform:translateY(2px)}50%{opacity:1;transform:translateY(-2px)}}`,
  g: `<g class="nf">${base({ eyes: eyesClosed, mouth: `<ellipse cx="80" cy="109" rx="2.6" ry="2" fill="${EYE}" stroke="none"/>` })}${arm(30, 108)}${arm(130, 108)}</g>`
    + `<g class="ba"><circle cx="122" cy="48" r="7" fill="${BLUE}" fill-opacity=".6"/><circle cx="136" cy="32" r="4.5" fill="${BLUE}" fill-opacity=".6"/></g>`
    + `<path d="M34 28A12 12 0 1 0 48 44A10 10 0 0 1 34 28Z" fill="${YEL}"/>` + sparkle(20, 56, .6) + sparkle(56, 22, .5)
};
P.kalp = {
  css: `.kp{transform-origin:80px 122px;animation:atis 1.4s ease-in-out infinite}@keyframes atis{0%,100%{transform:scale(1)}15%{transform:scale(1.08)}30%{transform:scale(1)}}`,
  g: base({ eyes: eyesHappy, mouth: smile() })
    + `<g class="kp"><g transform="translate(0 6)"><path d="M80 146C58 134 52 122 52 113C52 105 58 100 65 100C72 100 77 104 80 109C83 104 88 100 95 100C102 100 108 105 108 113C108 122 102 134 80 146Z" fill="${BERRY}"/><ellipse cx="64" cy="110" rx="4" ry="2.5" fill="#fff" opacity=".6" stroke="none"/></g></g>`
    + arm(52, 124) + arm(108, 124) + sparkle(134, 52, .8, PINK) + sparkle(24, 66, .6, PINK)
};
P.sef = {
  g: base({ hat: true, eyes: eyesOpen(), mouth: smileOpen }) + arm(28, 104)
    + `<path d="M58 66V52C46 50 44 34 56 30C58 18 74 16 80 24C86 16 102 18 104 30C116 34 114 50 102 52V66Z" fill="#fff"/><path d="M58 58H102" stroke-width="3"/><path d="M70 50V40M90 50V40" fill="none" stroke-width="2.6" opacity=".5"/>`
    + spoon(138, 64, 18) + arm(136, 96)
};
P.sepet = {
  g: base({ eyes: eyesOpen(-2, 0), mouth: smileOpen })
    + `<g transform="translate(66 40) scale(.74)" stroke-width="6"><path d="M58 118Q80 82 102 118" fill="none" stroke="${WOOD}" stroke-width="6"/><path d="M58 118Q80 82 102 118" fill="none" stroke-width="2"/>`
    + `<circle cx="68" cy="116" r="9" fill="${ORANGE}"/><circle cx="84" cy="112" r="9" fill="${BERRY}"/><circle cx="96" cy="117" r="8" fill="${YEL}"/><path d="M84 103q4-6 9-5q-2 6-9 5Z" fill="${LEAF}" stroke-width="2.4"/>`
    + `<path d="M50 118H110L104 144H56Z" fill="${WOOD}"/><path d="M54 127H106M57 136H103M70 118L72 144M90 118L88 144" fill="none" stroke-width="2.4" opacity=".55"/></g>`
    + arm(28, 104) + arm(108, 124)
};
P.bicak = {
  g: base({ eyes: eyesOpen(-3, -1), mouth: smile(-3) }) + arm(28, 104)
    + `<g transform="translate(2 36)"><path d="M114 70V64M146 70V64" stroke-width="4"/><path d="M110 70H150V82q-3.3 5-6.7 0t-6.7 0t-6.7 0t-6.7 0t-6.6 0t-6.6 0Z" fill="#DCE9F2"/><rect x="108" y="50" width="44" height="14" rx="7" fill="${MINT}"/><path d="M118 57h24" stroke-width="2.6" opacity=".5"/></g>`
    + arm(150, 92) + sparkle(138, 40, .8, MINT)
};

fs.mkdirSync(OUT, { recursive: true });
for (const [k, { g, css }] of Object.entries(P)) {
  const style = css ? `<style>${css}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="Pütür">${style}<g stroke="${INK}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round">${g}</g></svg>\n`;
  fs.writeFileSync(`${OUT}/${k}.svg`, svg);
  console.log(k, svg.length);
}
