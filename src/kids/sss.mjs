/* =====================================================================
   SSS — tek-açık akordeon (Beyar 1 Kas, site geneli; sahibi: lead)
   · Tüm Kids SSS'leri bu bileşenle basılır: aynı anda en fazla bir soru açık, varsayılan hepsi kapalı.
   · <h3><button aria-expanded aria-controls> + role="region" cevap; JS yokken cevaplar açık (kd-js yoksa CSS gizlemez).
   · Davranış kids.js (sssKur): tıkla/Enter/Space, açılan yenisi açık olanı kapatır, URL hash (#<soru-id>) ile açılır.
   · Görünüm kids.css (.kd-sss*): grid 0fr→1fr yumuşak yükseklik, + → × dönüşü; reduced-motion'da anında.
   · Not: "Rahatça/Dikkat/Kaçınılır" besin kartları akordeon DEĞİL (E4 kararı); bu bileşen yalnız SSS içindir.
   ===================================================================== */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sluga = (s) => String(s).toLocaleLowerCase('tr').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

/**
 * @param {{s: string, c: string|string[]}[]} sorular  s = soru, c = cevap paragraf(lar)ı (düz metin)
 * @param {{ onek?: string, renk?: string, not?: string }} ayar  onek: id öneki (sayfada tekil), not: liste altı bilgi kutusu (HTML)
 */
export function sss(sorular, { onek = 'sss', renk = '', not = '' } = {}) {
  const liste = (sorular || []).filter((x) => x && x.s && x.c);
  if (!liste.length) return '';
  const kullanilan = new Set();
  const ogeler = liste.map((x, i) => {
    let id = `${onek}-${sluga(x.s) || i + 1}`; while (kullanilan.has(id)) id += `-${i + 1}`; kullanilan.add(id);
    const cevap = (Array.isArray(x.c) ? x.c : [x.c]).map((p) => `<p>${esc(p)}</p>`).join('');
    return `<div class="kd-sss__oge" id="${id}">
     <h3 class="kd-sss__soru"><button type="button" class="kd-sss__dugme" id="${id}-d" aria-expanded="true" aria-controls="${id}-c"><span>${esc(x.s)}</span><i class="kd-sss__ikon" aria-hidden="true"></i></button></h3>
     <div class="kd-sss__cevap" id="${id}-c" role="region" aria-labelledby="${id}-d"><div class="kd-sss__ic">${cevap}</div></div>
    </div>`;
  }).join('');
  return `<div class="kd-sss" data-kd-sss${renk ? ` data-renk="${esc(renk)}"` : ''}>
   <div class="kd-sss__liste">${ogeler}</div>
   ${not ? `<div class="kd-sss__not">${not}</div>` : ''}
  </div>`;
}
