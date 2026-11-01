// "Dolapta Ne Var?" — tek kaynak bileşen (sahibi: dolap). Kids Tarifleri'nde kompakt (açılır/kapanır), kids-bebek-dolabi.html'de tam.
// Akış Dada Gastro'nun /dolapta-ne-var sayfasından (tarif-bulucu): sayaç başlığı → seçilenler şeridi → arama → kategorili,
// fotoğraflı malzeme kartları (2 sütun akordeon) → sonuçlar ("Hemen yapabilirsin" / "1 malzeme eksik").
// Davranış: varlik/kids/js/kiler.js (dolapKur). Görünüm: varlik/kids/css/kiler.css. Veri: #kdDolapVeri (derlemede gömülür).
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const jsonOku = async (p, yedek) => { try { return JSON.parse(await readFile(path.join(KOK, p), 'utf8')); } catch { return yedek; } };
const DOLAP = await jsonOku('veri/bebek-dolabi.json', { riskli: [] });

/** Kategori sırası (Gastro DolapMalzemeGrubu sırasına yakın): kod, ad, başlık fotoğrafı (ürün anahtarı). */
export const KATEGORI = [
  ['sebze', 'Sebzeler', 'havuc'],
  ['meyve', 'Meyveler', 'elma'],
  ['protein', 'Et, tavuk, balık ve yumurta', 'yumurta'],
  ['tahil', 'Tahıllar ve bakliyat', 'pirinc'],
  ['sut', 'Süt ürünleri', 'yogurt'],
  ['diger', 'Yağ, ezme, baharat ve otlar', 'zeytinyagi'],
];
const TEMEL = ['zeytinyagi'];   // "evde var sayılır" (Gastro'nun Tuz/Su/Yağ temel çipleri gibi); eksik sayılmaz

// besinler.json slug'ı → tarif sözlüğü anahtarı (aynı malzeme)
const BESIN_ESLE = { mercimek: 'kirmizi-mercimek', kofte: 'kiyma', balik: 'somon', peynir: 'lor-peyniri' };
const kucuk = (s) => String(s || '').toLocaleLowerCase('tr').trim();
const istege = (m) => /isteğe bağlı/i.test(m.not || '');

/** Kısa yaş uyarısı: "1 yaş altı verilmez" (veride `kisa` yoksa minAy'dan). */
export function kisaUyari(r) {
  if (r.kisa) return r.kisa;
  if (r.minAy == null) return 'Bebek ve küçük çocuğa önerilmez';
  return r.minAy % 12 === 0 ? `${r.minAy / 12} yaş altı önerilmez` : `${r.minAy}. aydan önce önerilmez`;
}

/** Derleme verisi: sözlük (tarif anahtarları + besinler + riskli), tarif zorunlu/isteğe bağlı malzemeleri + yaş, kart listesi. */
export function dolapVerisi(o) {
  const T = o.veri.tarifler.tarifler || [];
  const MS = o.veri.tarifler.malzemeSozlugu || {};
  const RISKLI = Object.fromEntries((DOLAP.riskli || []).map((r) => [r.anahtar, r]));
  const sozluk = new Map(); const alinan = new Set();
  const ekle = (a, ad, esler = [], kat = null) => {
    let k = sozluk.get(a);
    if (!k) { k = { a, ad, es: new Set(), kat }; sozluk.set(a, k); alinan.add(kucuk(ad)); }
    if (!k.kat && kat) k.kat = kat;
    for (const e of esler) { const x = kucuk(e); if (x && !alinan.has(x)) { alinan.add(x); k.es.add(x); } }
  };
  // öncelik: riskli > tarif sözlüğü > besinler ("süt" yemekteki süte, "içecek olarak süt" riskliye)
  for (const r of DOLAP.riskli || []) ekle(r.anahtar, r.ad, r.esAnlamlar, r.kategori || null);
  for (const [a, s] of Object.entries(MS)) ekle(a, s.ad, s.esAnlamlar, s.kategori || null);
  for (const b of o.veri.besinler.besinler || []) {
    if (b.hamilelik) continue;
    const a = BESIN_ESLE[b.slug] || b.slug;
    if (RISKLI[b.slug]) { ekle(b.slug, RISKLI[b.slug].ad, b.esAnlamlar || []); continue; }
    ekle(a, sozluk.get(a)?.ad || b.ad, [b.ad, ...(b.esAnlamlar || [])]);
  }
  const veri = {
    temel: TEMEL,
    sozluk: [...sozluk.values()].map((k) => {
      const r = RISKLI[k.a];
      const x = { a: k.a, ad: k.ad, es: [...k.es] };
      if (o.urunVar(k.a)) x.f = 1;   // ürün fotoğrafı var (seçilenler şeridinde küçük daire)
      return r ? { ...x, r: 1, n: r.neden, m: r.minAy, k: kisaUyari(r) } : x;
    }),
    tarif: Object.fromEntries(T.map((t) => {
      const g = [], i = [];
      for (const m of t.malzemeler || []) if (m.anahtar) (istege(m) ? i : g).push(m.anahtar);
      return [t.slug, { g: [...new Set(g)], i: [...new Set(i)].filter((x) => !g.includes(x)), y: t.yas }];
    })),
  };
  // kartlar: kategorisi olan ve fotoğrafı bulunan malzemeler (fotoğrafsız kart çizilmez)
  const kartlar = [...sozluk.values()].filter((k) => k.kat && o.urunVar(k.a));
  const eksikFoto = [...sozluk.values()].filter((k) => k.kat && !o.urunVar(k.a)).map((k) => k.a);
  return { veri, kartlar, eksikFoto, RISKLI };
}

const jsonGom = (id, v) => `<script type="application/json" id="${id}">${JSON.stringify(v).replace(/</g, '\\u003c')}</script>`;
const svgOk = '<svg class="kd-ok" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg>';
const svgTik = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const svgAra = '<svg class="kd-dolap__ara-ikon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';
const svgSepet = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3.5 9.5h17l-1.6 9.1a2 2 0 0 1-2 1.6H7.1a2 2 0 0 1-2-1.6z"/><path d="M8 9.5l3-5.5M16 9.5l-3-5.5M9 13.5v3M15 13.5v3M12 13.5v3"/></svg>';
const svgKase = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M8 7.5c0-1.2 1-1.7 1-2.9M12 7.5c0-1.2 1-1.7 1-2.9M16 7.5c0-1.2 1-1.7 1-2.9"/></svg>';

/** Malzeme kartı (Gastro .mz): yuvarlak ürün fotoğrafı + ad + seçili işareti; riskli olanda yaşa göre uyarı satırı (JS gösterir). */
function kart(o, k, RISKLI) {
  const r = RISKLI[k.a];
  const id = `kdMz-${k.a}`;
  return `<button type="button" class="kd-mz${r ? ' kd-mz--riskli' : ''}" data-a="${o.esc(k.a)}" aria-pressed="false" aria-labelledby="${id} ${id}-u"${r ? ` data-m="${r.minAy ?? ''}"` : ''}>`
    + `<span class="kd-mz__foto">${o.urun(k.a, 96, k.ad)}</span>`
    + `<span class="kd-mz__ad" id="${id}">${o.esc(k.ad.replace(/ \([^)]*\)$/, ''))}</span>`
    + `<span class="kd-mz__uyari" id="${id}-u"${r ? ` data-kisa="${o.esc(kisaUyari(r))}"` : ''}></span>`
    + `<span class="kd-mz__ck" aria-hidden="true">${svgTik}</span></button>`;
}

/**
 * Bileşen HTML'i. kip: 'kompakt' (Kids Tarifleri; başlık aç/kapa, sonuçlar gövdede, her grupta tek satır + "Tam ekranda aç")
 * ya da 'tam' (kids-bebek-dolabi.html; sayaç başlığı, sonuçlar panelin altında, tümü).
 */
export function dolapBileseni(o, { kip = 'kompakt' } = {}) {
  const { veri, kartlar, RISKLI } = dolapVerisi(o);
  const T = o.veri.tarifler.tarifler || [];
  const kompakt = kip === 'kompakt';
  const sira = (a, b) => (RISKLI[a.a] ? 1 : 0) - (RISKLI[b.a] ? 1 : 0) || a.ad.localeCompare(b.ad, 'tr');
  const acikSay = kompakt ? 0 : 2;   // tam: Gastro gibi ilk iki kategori açık; kompakt (Kids Tarifleri): hepsi kapalı başlar (lead, 1 Kas)
  const kategoriler = KATEGORI.map(([kod, ad, kapak], n) => {
    const l = kartlar.filter((k) => k.kat === kod).sort(sira);
    if (!l.length) return '';
    const acik = n < acikSay;
    const kapakYol = o.urunVar(kapak) ? o.urunYol(kapak, 40) : o.urunYol(l[0].a, 40);
    return `<section class="kd-dolap-kat${acik ? ' kd-acik' : ''}" data-kat="${kod}">
     <h3 class="kd-dolap-kat__bas"><button type="button" aria-expanded="${acik}" aria-controls="kdKat-${kod}"><span class="kd-dolap-kat__kapak" style="background-image:url('${kapakYol}')" aria-hidden="true"></span><span class="kd-dolap-kat__ad">${o.esc(ad)}</span><span class="kd-dolap-kat__n">${l.length} malzeme</span><span class="kd-dolap-kat__secili" data-kd-kat-say hidden></span>${svgOk}</button></h3>
     <div class="kd-dolap-kat__kartlar" id="kdKat-${kod}" role="group" aria-label="${o.esc(ad)}"${acik ? '' : ' hidden'}>${l.map((k) => kart(o, k, RISKLI)).join('')}</div>
    </section>`;
  }).join('');

  const bas = kompakt
    ? `<div class="kd-dolap__bas">
    <h2 class="kd-dolap__baslik" id="kdDolapBaslik"><button class="kd-dolap__ac" type="button" aria-expanded="true" aria-controls="kdDolapGovde" data-kd-dolap-ac><span class="kd-dolap__ad"><span class="kd-dolap__ikon">${svgSepet}</span>Dolapta Ne Var?</span><span class="kd-dolap__durum" id="kdDolapDurum">Dolap boş</span>${svgOk}</button></h2>
    <a class="kd-dolap__tam kd-bag" href="kids-bebek-dolabi.html" data-kd-dolap-tam>Tam ekranda aç <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
   </div>`
    : `<div class="kd-dolap__bas">
    <h2 class="kd-dolap__baslik" id="kdDolapBaslik"><span class="kd-dolap__ikon">${svgSepet}</span><span>Dolapta <b class="kd-dolap__say" id="kdDolapSay">0</b> malzeme</span></h2>
    <span class="kd-dolap__durum kd-gizli" id="kdDolapDurum"></span>
   </div>`;

  const ust = `<div class="kd-dolap__ust">
     <div class="kd-dolap__secili">
      <p class="kd-dolap__secili-bos" id="kdDolapSeciliBos">Henüz seçim yok. Malzemeye dokunun ya da arayın.</p>
      <ul class="kd-dolap__cipler" id="kdDolapCipler" aria-label="Dolaptaki malzemeler" hidden></ul>
      <button class="kd-dolap__temizle" type="button" data-kd-dolap-temizle hidden>Tümünü temizle</button>
     </div>
     <div class="kd-dolap__giris">
      <label class="kd-gizli" for="kdDolapGir">Malzeme ara</label>
      <div class="kd-dolap__alan">${svgAra}<input id="kdDolapGir" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="kdDolapOneri" aria-describedby="kdDolapIpucu" autocomplete="off" enterkeyhint="done" placeholder="Malzeme ara (ör. havuç)"></div>
      <ul class="kd-dolap__oneri" id="kdDolapOneri" role="listbox" aria-label="Malzeme önerileri" hidden></ul>
      <p class="kd-gizli" id="kdDolapIpucu">Yazdıkça öneriler çıkar; ok tuşlarıyla seçip Enter'a basın. Virgülle birden çok malzeme yazabilirsiniz.</p>
     </div>
     <p class="kd-dolap__uyari" id="kdDolapUyari" role="status" aria-live="polite"></p>
     <label class="kd-dolap__anahtar" for="kdBebekDolabi"><input type="checkbox" id="kdBebekDolabi" role="switch" checked><span class="kd-dolap__anahtar-iz" aria-hidden="true"></span><b>Bebek Dolabı</b><small>Seçili yaşa riskli malzemeleri dışlar</small></label>
    </div>`;

  const kiler = `<div class="kd-kiler kd-ikonlu" id="kdKiler" tabindex="-1" aria-labelledby="kdKilerBaslik">
     <span class="kd-ikonlu__ikon kd-kiler__ikon">${svgKase}</span>
     <h3 class="kd-ikonlu__baslik" id="kdKilerBaslik">Bebek Kilerim <small id="kdKilerSayi"></small></h3>
     <div class="kd-ikonlu__rozet kd-kiler__eylem">
      <button class="kd-btn kd-btn--kucuk" type="button" data-kd-kiler-yukle hidden>Kilerden dolaba yükle</button>
      <button class="kd-btn kd-btn--hafif kd-btn--kucuk" type="button" data-kd-kiler-kaydet hidden>Seçilenleri kilere ekle</button>
      <button class="kd-btn kd-btn--hafif kd-btn--kucuk" type="button" data-kd-kiler-bosalt hidden>Kileri boşalt</button>
     </div>
     <ul class="kd-kiler__liste kd-ikonlu__ek" id="kdKilerListe" aria-label="Bebek Kilerimdeki malzemeler" hidden></ul>
     <p class="kd-kiler__bos kd-ikonlu__metin" id="kdKilerBos">Kileriniz boş: malzeme seçip buradan kilere ekleyin.</p>
    </div>`;

  const sonuc = `<div class="kd-dolap-sonuc" id="kdDolapSonuc" aria-labelledby="kdDolapSonucBaslik">
    <div class="kd-dolap-sonuc__bar">
     <h2 class="kd-dolap-sonuc__baslik" id="kdDolapSonucBaslik"><b id="kdDolapSonucSay">0</b> tarif</h2>
     <p class="kd-dolap-sonuc__meta" id="kdDolapOzet" aria-live="polite">Malzeme seçince tarifler burada.</p>
    </div>
    <div class="kd-dolap-sonuc__bos" id="kdDolapBos">${kompakt ? '' : `<span class="kd-dolap-sonuc__bos-foto">${o.foto('varlik/kids/gorsel/bos/bos-kase.webp', 'Krem keten üzerinde boş pastel bebek kâsesi', { gen: 128, yuk: 128 })}</span>`}<div><h3>Dolabınız boş görünüyor</h3><p>Birkaç malzeme seçin; seçili yaşa uygun tarifleri hemen gösterelim.</p></div></div>
    <section class="kd-dolap-grup" id="kdDolapGrupTam" aria-labelledby="kdDolapGrupTamB" hidden><h3 class="kd-dolap-grup__baslik" id="kdDolapGrupTamB"><span class="kd-dolap-grup__isaret" data-durum="tam" aria-hidden="true">${svgTik}</span>Hemen yapabilirsin <small data-kd-grup-say></small></h3><div class="kd-izgara kd-dolap-izgara" data-kd-grup="tam"></div></section>
    <section class="kd-dolap-grup" id="kdDolapGrupEksik" aria-labelledby="kdDolapGrupEksikB" hidden><h3 class="kd-dolap-grup__baslik" id="kdDolapGrupEksikB"><span class="kd-dolap-grup__isaret" data-durum="eksik" aria-hidden="true">+1</span>1 malzeme eksik <small data-kd-grup-say></small></h3><div class="kd-izgara kd-dolap-izgara" data-kd-grup="eksik"></div></section>
    <div class="kd-dolap-sonuc__yok" id="kdDolapYok" hidden><p><b>Bu seçimle tarif çıkmadı.</b> <span data-kd-yok-metin></span></p><div class="kd-dolap-oneri-cip" data-kd-yok-oneri></div></div>
    ${kompakt ? '<a class="kd-btn kd-btn--hafif kd-btn--kucuk kd-dolap-sonuc__tumu" href="kids-bebek-dolabi.html" data-kd-dolap-tam hidden>Tüm sonuçlar tam ekranda <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' : ''}
   </div>`;

  const sablon = `<template id="kdDolapKartlar">${T.map((t, i) => o.tarifKart(t, { gir: false, sira: i })).join('')}</template>`;

  const govde = kompakt
    ? `<div class="kd-dolap__govde" id="kdDolapGovde">${ust}<div class="kd-dolap__kategoriler">${kategoriler}</div>${kiler}${sonuc}</div>`
    : `<div class="kd-dolap__govde" id="kdDolapGovde">${ust}<div class="kd-dolap__kategoriler">${kategoriler}</div>${kiler}</div>`;
  return `<section class="kd-dolap-bolum kd-dolap-bolum--${kip}" id="dolap" aria-labelledby="kdDolapBaslik">
 <div class="wrap">
  <div class="kd-dolap kd-dolap--${kip}" id="kdDolap" data-kd-dolap data-kip="${kip}">
   ${bas}
   ${govde}
  </div>
  ${kompakt ? '' : sonuc}
  ${sablon}
  ${jsonGom('kdDolapVeri', veri)}
 </div>
</section>`;
}
