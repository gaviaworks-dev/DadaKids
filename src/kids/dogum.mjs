// Doğum ayı / tahmini doğum ayı seçici — tek, yeniden kullanılabilir bileşen (sahibi: v2-hub)
// Kapalı başlar: düğme masaüstünde popover, mobilde alt sayfa açar; dışarıdan: document 'kd-dogum-ac' olayı.
// Davranış: varlik/kids/js/dogum-secici.js · stil: varlik/kids/css/dogum-secici.css
// Kullanım (sayfa modülü): import { dogumSecici } from '../dogum.mjs'; ... ${dogumSecici(o)} ; css/js: ['dogum-secici']
// Form içinde input[name="evre"] radyoları varsa evre çipleriyle kendiliğinden senkron olur (hamilelik → tahmini doğum ayı modu).
// Saklama: yalnız bu tarayıcı, localStorage 'dadakids.dogum.v1' = {y, m, mod} (try/catch); hiçbir yere gönderilmez.
// kompakt: true → başlık yalnız ekran okuyucuya, tetik küçük bir metin bağı (hub hero'daki dönem çubuğunun yanında).

export const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const mevsim = (m) => (m === 12 || m <= 2 ? 'kis' : m <= 5 ? 'ilkbahar' : m <= 8 ? 'yaz' : 'sonbahar');

const r1 = (n) => Math.round(n * 10) / 10;
const nokta = (aci, u) => [r1(12 + Math.cos(aci) * u), r1(12 + Math.sin(aci) * u)];

/** Kar tanesi: 6 kol, her kolda iki minik dal (hesaplanmış, özgün). */
function karYolu() {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const [x, y] = nokta(a, 8.6);
    d += `M12 12L${x} ${y}`;
    const [bx, by] = nokta(a, 5.4);
    for (const s of [-1, 1]) {
      const da = a + s * 0.75;
      d += `M${bx} ${by}L${r1(bx + Math.cos(da) * 2.6)} ${r1(by + Math.sin(da) * 2.6)}`;
    }
  }
  return d;
}
function cicekYapraklari() {
  return Array.from({ length: 5 }, (_, i) => { const [x, y] = nokta((Math.PI * 2 / 5) * i - Math.PI / 2, 4.9); return `<circle cx="${x}" cy="${y}" r="3.9"/>`; }).join('');
}
function gunesIsinlari() {
  let d = '';
  for (let i = 0; i < 8; i++) { const a = (Math.PI / 4) * i; const [x1, y1] = nokta(a, 7.6); const [x2, y2] = nokta(a, 10); d += `M${x1} ${y1}L${x2} ${y2}`; }
  return d;
}

const SVG_AC = '<svg class="kd-ds__ikon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">';
export const MEVSIM_SVG = {
  kis: `${SVG_AC}<path d="${karYolu()}" fill="none" stroke="#6FA6DA" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="12" r="2.1" fill="#CFE5FA" stroke="#6FA6DA" stroke-width="1.2"/></svg>`,
  ilkbahar: `${SVG_AC}<g fill="#F9C3D4" stroke="#E68AA9" stroke-width="1">${cicekYapraklari()}</g><circle cx="12" cy="12" r="2.9" fill="#FFD35C" stroke="#E9A92A" stroke-width="1"/><circle cx="11" cy="11.4" r=".9" fill="#fff" opacity=".8"/></svg>`,
  yaz: `${SVG_AC}<path d="${gunesIsinlari()}" stroke="#F2B230" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="5.4" fill="#FFD866" stroke="#F2B230" stroke-width="1.2"/></svg>`,
  sonbahar: `${SVG_AC}<path d="M5.5 18.5C5.2 10.6 10.4 5.4 19 5.2c.2 8.5-5 13.6-13.5 13.3Z" fill="#FFBE8A" stroke="#E2874A" stroke-width="1.2" stroke-linejoin="round"/><path d="M5.5 18.5 15.2 8.8M9.4 14.6l-.3-3M11.9 12.1l-.2-2.6M9.4 14.6l3 .2M11.9 12.1l2.7.2M5.5 18.5 3.6 20.4" fill="none" stroke="#C96B2C" stroke-width="1.1" stroke-linecap="round"/></svg>`,
};

/**
 * Bileşen markup'ı. Yıl çipleri tarayıcıda o günün tarihine göre çizilir (statik sayfa yıllar sonra da doğru kalsın).
 * @param {object} o ortak yardımcılar (EVRE, evreSayfasi, esc)
 * @param {{id?: string, baslik?: string, aciklama?: string, kompakt?: boolean, tetik?: string}} opts
 */
export function dogumSecici(o, { id = 'kdDs', baslik = 'ya da doğum ayını seçin', aciklama = 'Gün gerekmez; ay ve yıl yeterli.', kompakt = false, tetik = 'Doğum ayını seçin' } = {}) {
  const { esc } = o;
  const evreVeri = Object.fromEntries(Object.entries(o.EVRE).map(([k, e]) => [k, { ad: e.ad, kisa: e.kisa, renk: e.renk, aralik: e.aralik, sayfa: o.evreSayfasi(k) }]));
  const satirlar = [0, 1, 2].map((r) => `<div role="row" class="kd-ds__satir">${[0, 1, 2, 3].map((c) => {
    const m = r * 4 + c + 1;
    return `<div role="gridcell" class="kd-ds__ay" data-m="${m}" data-mevsim="${mevsim(m)}" tabindex="${m === 1 ? 0 : -1}" aria-selected="false" aria-disabled="true">${MEVSIM_SVG[mevsim(m)]}<span class="kd-ds__ay-ad" aria-hidden="true"><span class="kd-ds__uzun">${AYLAR[m - 1]}</span><span class="kd-ds__kisa">${KISA[m - 1]}</span></span><span class="kd-gizli" data-ay-etiket>${AYLAR[m - 1]}</span></div>`;
  }).join('')}</div>`).join('');
  const kalem = (yol) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="${yol}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const takvim = '<svg class="kd-ds__ikon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M4 7h16v13H4zM4 11h16M8 4v5M16 4v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const gebelikBaslik = kompakt ? 'Tahmini doğum ayı' : 'ya da tahmini doğum ayını seçin';
  return `<div class="kd-ds${kompakt ? ' kd-ds--kompakt' : ''}" data-kd-dogum data-mod="dogum" id="${id}" aria-live="off" data-tetik-bos="${esc(tetik)}" data-evre='${esc(JSON.stringify(evreVeri))}'>
 <div class="kd-ds__bas${kompakt ? ' kd-gizli' : ''}">
  <span class="kd-ds__baslik" id="${id}Baslik" data-kd-ds-baslik data-dogum="${esc(baslik)}" data-gebelik="${esc(gebelikBaslik)}">${esc(baslik)}</span>
 </div>
 <button type="button" class="kd-ds__ac" aria-haspopup="dialog" aria-expanded="false" aria-controls="${id}Panel">
  <span class="kd-ds__ac-ikon">${kompakt ? takvim : MEVSIM_SVG.ilkbahar}</span><span class="kd-ds__ac-metin" data-kd-ds-tetik>${esc(tetik)}</span>${kompakt ? '' : kalem('M9 6l6 6-6 6')}
 </button>
 <div class="kd-ds__perde" data-kd-ds-perde hidden></div>
 <div class="kd-ds__panel" id="${id}Panel" role="dialog" aria-labelledby="${id}Baslik" tabindex="-1">
  <div class="kd-ds__sheet-bas"><span class="kd-ds__tutamak" aria-hidden="true"></span><b data-kd-ds-sheet-baslik>Doğum ayı</b><button type="button" class="kd-ds__kapat" data-kd-ds-kapat aria-label="Kapat">${kalem('M6 6l12 12M18 6 6 18')}</button></div>
  <small class="kd-ds__aciklama" data-kd-ds-aciklama data-dogum="${esc(aciklama)}" data-gebelik="Bugünden itibaren önümüzdeki 9 ay seçilebilir.">${esc(aciklama)}</small>
  <div class="kd-ds__grup-ad" id="${id}YilAd">Yıl</div>
  <div class="kd-ds__yillar" role="radiogroup" aria-labelledby="${id}YilAd" data-kd-ds-yillar></div>
  <div class="kd-ds__grup-ad" id="${id}AyAd">Ay <small data-kd-ds-ay-ipucu>önce yılı seçin</small></div>
  <div class="kd-ds__aylar" role="grid" aria-labelledby="${id}AyAd" data-kd-ds-aylar>${satirlar}</div>
  <div class="kd-ds__sonuc" data-kd-ds-sonuc data-tur="bos">
   <div class="kd-ds__metin" aria-live="polite" aria-atomic="true" data-kd-ds-metin><p class="kd-ds__ana">Doğum yılını, sonra ayını seçin; evresini birlikte bulalım.</p></div>
   <div class="kd-ds__eylem" data-kd-ds-eylem></div>
  </div>
  <div class="kd-ds__sheet-alt"><span data-kd-ds-kisa aria-hidden="true"></span><button type="button" class="kd-btn kd-btn--kucuk" data-kd-ds-tamam>Tamam</button></div>
 </div>
</div>`;
}
