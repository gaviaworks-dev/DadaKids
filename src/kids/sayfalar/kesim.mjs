// Dada Gastro Kids — Güvenli Kesim atlası (sahibi: kesim kolu)
// Veri: veri/kesim.json  [{slug, ad, grup, renk, ikon, risk, pisirme, asamalar:{'6-8','9-12','12+':{nasil, boyut, ipucu, foto}}, asla, ezilmeTesti}]
// Görseller: gerçek fotoğraf (foto turu, F4) — varlik/kids/gorsel/kesim/<slug>-{6-8,9-12,12}.webp (aşamalar, 640×448),
// <slug>.webp (kart başı ikonu, 112×112; 6–8 ay fotoğrafının kırpımı), tehlike-<tur>.webp ('Asla bütün vermeyin', 144×144).
// Üç aşama aynı tabakta, aynı zeminde, aynı açıdan çekildi; yalnız kesim/boyut değişir.
// Kural: fotoğraf = metin. Bir aşamanın metni değişirse fotoğrafı ve 'foto' alanı (alt metin) birlikte güncellenir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ---------- Görsel yolları (başka sayfalar da bunu kullanır) ---------- */
export const KESIM_GORSEL_KLASOR = 'varlik/kids/gorsel/kesim';
const ASAMA_DOSYA = { '6-8': '6-8', '9-12': '9-12', '12+': '12', '12': '12' };
/** Kesim fotoğrafının yolu. asama: '6-8' | '9-12' | '12+' (ya da '12'); verilmezse kart başı ikonu (bütün besin). */
export function kesimGorsel(slug, asama) {
  const ek = asama ? '-' + (ASAMA_DOSYA[asama] || asama) : '';
  return `${KESIM_GORSEL_KLASOR}/${slug}${ek}.webp`;
}
const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const gorselVar = (yol) => fs.existsSync(path.join(KOK, yol));

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

/* ---------- Türkçe duyarsız arama anahtarı (kesim.js ile aynı kural) ---------- */
export const normal = (s) => String(s || '').toLocaleLowerCase('tr')
  .replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u')
  .replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u').replace(/\s+/g, ' ').trim();

/* ---------- "Asla bütün vermeyin": gerçek fotoğraf + kırmızı yasak işareti (UI imi) ---------- */
const YASAK_IM = '<svg class="kd-kbogulma__yasak" viewBox="0 0 72 72" aria-hidden="true" focusable="false"><circle cx="36" cy="36" r="32" fill="none" stroke="#D2453A" stroke-width="5"/><path d="M13.4 58.6L58.6 13.4" stroke="#D2453A" stroke-width="5" stroke-linecap="round"/></svg>';
function yasakFoto(t, esc) {
  const yol = `${KESIM_GORSEL_KLASOR}/tehlike-${t.tur}.webp`;
  if (!gorselVar(yol)) return YASAK_IM;
  return `<img src="${yol}" width="144" height="144" alt="${esc(t.foto)}" loading="lazy" decoding="async">${YASAK_IM}`;
}

const TEHLIKELER = [
  { tur: 'uzum', ad: 'Bütün üzüm', neden: 'Yuvarlak ve kaygan; soluk yolunu tam olarak tıkayabilir.', yerine: 'Boyuna dörde bölün; küçük bebeklerde ayrıca hafifçe ezin.', yas: '4 yaşına kadar bütün verilmez', slug: 'uzum', foto: 'Bütün üzüm taneleri: bu hâliyle verilmez' },
  { tur: 'domates', ad: 'Kiraz (çeri) domates', neden: 'Üzüm gibi yuvarlak ve kaygandır; kabuğu da kayar.', yerine: 'Boyuna dörde bölün; yaban mersini ve zeytin için de aynısını yapın.', yas: '4 yaşına kadar bütün verilmez', slug: 'kiraz-domates', foto: 'Bütün kiraz domatesler: bu hâliyle verilmez' },
  { tur: 'kuruyemis', ad: 'Bütün kuruyemiş', neden: 'Fındık, fıstık, badem ve ceviz sert ve küçüktür; çiğnenmeden yutulabilir.', yerine: 'Şekersiz-tuzsuz ezmesini sulandırıp püreye karıştırın ya da çok ince sürün.', yas: '5 yaşına kadar bütün ya da iri parça verilmez', slug: '', foto: 'Bütün fındık, badem ve yer fıstığı: verilmez' },
  { tur: 'misir', ad: 'Patlamış mısır', neden: 'Sert taneler ve kabuk parçaları nefesle birlikte soluk yoluna kaçabilir.', yerine: 'Ağızda kolayca yumuşayan atıştırmalıklar: pişmiş sebze çubukları, olgun meyve.', yas: 'Küçük çocuklara önerilmez', slug: '', foto: 'Patlamış mısır: küçük çocuklara verilmez' },
  { tur: 'sebze', ad: 'Sert çiğ sebze ve meyve', neden: 'Çiğ havuç ya da elma dilimi gibi sert parçalar kopar ve çiğnenemeden yutulabilir.', yerine: 'Yumuşayana kadar pişirin ya da ince rendeleyin.', yas: 'Çiğneme becerisi gelişene kadar iri sert parça yok', slug: 'havuc', foto: 'Çiğ havuç çubuğu ve kabuklu çiğ elma dilimi: sert parça olarak verilmez' },
];

export default async function kesim(o) {
  const { esc, ikon } = o;
  const besinler = (o.veri.besinler && o.veri.besinler.besinler) || [];
  const besinHarita = new Map(besinler.map((b) => [b.slug, b]));
  const ham = Array.isArray(o.veri.kesim) ? o.veri.kesim : [];
  const atlas = ham.filter((x) => x && x.slug && x.ad).slice().sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
  const sluglar = new Set(atlas.map((x) => x.slug));
  const buyukHarf = (s) => GRUP_AD[s] || String(s || '').replace(/-/g, ' ').replace(/^./, (c) => c.toLocaleUpperCase('tr'));
  const fotoVar = (slug) => gorselVar(kesimGorsel(slug, '6-8'));
  const kucuk = (s) => String(s || '').toLocaleLowerCase('tr');
  const fotoAlt = (as, x, obj) => `${as.ad}: ${kucuk(x.ad)}, ${obj.foto || obj.boyut || obj.nasil || 'bu formda verilmez'}`;
  // Kart başı ikonu: 6–8 ay fotoğrafının kare kırpımı (besinin en tanınır, en iri hâli); başlık besin adını zaten söylüyor → dekoratif
  const besinIkon = (x) => (gorselVar(kesimGorsel(x.slug))
    ? `<img src="${kesimGorsel(x.slug)}" width="112" height="112" alt="" aria-hidden="true" loading="lazy" decoding="async">`
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
    const fotoGoster = fotoVar(x.slug) && !verilmez;
    const alt = fotoAlt(as, x, obj);
    const sekil = fotoGoster
      ? `<img src="${kesimGorsel(x.slug, as.anahtar)}" width="640" height="448" alt="${esc(alt)}" loading="lazy" decoding="async">`
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
    const asla = x.asla ? `<p class="kd-kesim__asla"><span class="kd-kesim__asla-ikon" aria-hidden="true"><i class="fa-solid fa-xmark"></i></span><span><b>Asla:</b> ${esc(x.asla)}<a class="kd-kesim__asla-bag" href="${o.YASAKLI_REHBER}">Yasaklı gıdalar rehberi <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></span></p>` : '';   // denge: yan komşu Ezilme testi notuyla boy dengesi bağ satırıyla
    return `<article class="kd-kesim kd-gir" id="${esc(x.slug)}" data-besin="${esc(x.slug)}" data-grup="${esc(x.grup || '')}" data-risk="${esc(x.risk || '')}" data-ara="${esc(ara)}" aria-labelledby="k-${esc(x.slug)}" style="--kd-gecikme:${Math.min(n % 4, 3) * 50}ms">
  <header class="kd-kesim__bas">
   <span class="kd-kesim__ikon" data-grup="${esc(x.grup || '')}">${besinIkon(x)}</span>
   <div class="kd-kesim__ad"><h3 id="k-${esc(x.slug)}">${esc(x.ad)}</h3>${x.grup ? `<small>${esc(buyukHarf(x.grup))}</small>` : ''}</div>
   ${r ? `<span class="kd-krisk" data-risk="${x.risk}"><i class="fa-solid ${r.ikon}" aria-hidden="true"></i><span><span class="kd-krisk__on">Boğulma riski: </span>${r.ad}</span></span>` : ''}
   <a class="kd-kesim__bag" href="#${esc(x.slug)}" aria-label="${esc(x.ad)} kartının bağlantısı" title="Bu kartın bağlantısı"><i class="fa-solid fa-link" aria-hidden="true"></i></a>
  </header>
  ${x.pisirme ? `<p class="kd-kesim__pisirme"><i class="fa-solid fa-fire-burner" aria-hidden="true"></i><span><b>Hazırlık:</b> ${esc(x.pisirme)}</span></p>` : ''}
  <ol class="kd-kesim__asamalar kd-hizali kd-hizali--5" aria-label="${esc(x.ad)}: yaşa göre kesim">${ASAMALAR.map((_, i) => asamaHucre(x, i)).join('')}</ol>
  <p class="kd-kesim__olcek"><i class="fa-regular fa-image" aria-hidden="true"></i> Üç fotoğraf aynı tabakta, aynı açıdan çekildi; parça boyunu “Boyut” satırıyla kıyaslayın.</p>
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
    ${TEHLIKELER.map((t, i) => `<li class="kd-ikonlu kd-gir" style="--kd-gecikme:${i * 60}ms">
     <span class="kd-kbogulma__svg kd-kbogulma__foto kd-ikonlu__ikon">${yasakFoto(t, esc)}</span>
     <h3 class="kd-ikonlu__baslik">${esc(t.ad)}</h3>
     <div class="kd-ikonlu__metin kd-kbogulma__govde">
      <span class="kd-kbogulma__yas"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${esc(t.yas)}</span>
      <p><b>Neden?</b> ${esc(t.neden)}</p>
      <p class="kd-kbogulma__yerine"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span><b>Yerine:</b> ${esc(t.yerine)}${t.slug && sluglar.has(t.slug) ? ` <a class="kd-bag" href="#${t.slug}">Kesimi göster</a>` : ''}</span></p>
     </div>
    </li>`).join('')}
    <li class="kd-kbogulma__bilgi kd-ikonlu kd-gir" style="--kd-gecikme:${TEHLIKELER.length * 60}ms">
     <span class="kd-kbogulma__svg kd-ikonlu__ikon" aria-hidden="true"><i class="fa-solid fa-hand-back-fist"></i></span>
     <h3 class="kd-ikonlu__baslik">Ezilme testi</h3>
     <div class="kd-ikonlu__metin kd-kbogulma__govde">
      <span class="kd-kbogulma__yas"><i class="fa-regular fa-lightbulb" aria-hidden="true"></i> Vermeden önce deneyin</span>
      <p>Pişmiş parçayı başparmağınızla işaret parmağınız arasında hafifçe bastırın; kolayca eziliyorsa bebeğiniz için yeterince yumuşaktır.</p>
      <p class="kd-kbogulma__yerine"><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>Her besinin kartında boyut ve kesim fotoğrafı var. <a class="kd-bag" href="#atlas">Atlasa git</a></span></p>
     </div>
    </li>
   </ul>
   <div class="kd-kbogulma__acil">
    <span class="kd-kbogulma__112" aria-hidden="true">112</span>
    <p><b>Boğulma acil durumdur: hemen 112'yi arayın.</b> Bebek ve çocuk ilk yardımını bir kitaptan değil, resmi bir kursta uygulamalı öğrenin. <a class="kd-bag" href="https://www.kizilay.org.tr/" target="_blank" rel="noopener">Türk Kızılay ilk yardım eğitimleri</a> · <a class="kd-bag" href="https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx" target="_blank" rel="noopener" hreflang="en">AAP: boğulmayı önleme</a></p>
   </div>
  </div>
 </div>
</section>`;

  const nasilOkunur = `<div class="kd-kokuma">
   <div class="kd-kokuma__metin"><h3>Kartlar nasıl okunur?</h3><p>Her besin üç aşamada, <b>aynı tabakta ve aynı açıdan</b> fotoğraflandı; aşamalar arasında yalnız kesim ve boyut değişir. Parça boyunu tabakla ve kartın <b>Boyut</b> satırıyla kıyaslayın; pişirme gereken besinler fotoğrafta pişmiş hâliyle gösterilir.</p></div>
   <ul class="kd-kokuma__asamalar">${ASAMALAR.map((a) => `<li data-renk="${a.renk}"><b>${a.ad}</b><small>${a.beceri}</small></li>`).join('')}</ul>
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

  const ornekSlug = sluglar.has('havuc') && fotoVar('havuc') ? 'havuc' : (atlas.find((x) => fotoVar(x.slug)) || {}).slug;
  const ornek = atlas.find((x) => x.slug === ornekSlug) || {};
  const ornekAd = ornek.ad || 'Havuç';
  // Hero: atlastan bir besinin üç aşaması yan yana (aynı tabak, aynı açı; gerçek fotoğraf)
  const heroAsamalar = `<div class="kd-khero"><p class="kd-khero__bas">${esc(ornekAd)}: üç aşama, aynı tabak</p><ol class="kd-khero__asamalar">${ASAMALAR.map((a, i) => {
    const v = (ornek.asamalar || {})[a.anahtar] || {};
    const alt = fotoAlt(a, ornek, v);
    return `<li data-renk="${a.renk}"><figure><img src="${kesimGorsel(ornekSlug, a.anahtar)}" width="640" height="448" alt="${esc(alt)}" decoding="async"${i ? ' loading="lazy"' : ''}><figcaption><b>${a.ad}</b><small>${esc(v.boyut || a.beceri)}</small></figcaption></figure></li>`;
  }).join('')}</ol></div>`;

  const hero = (s) => { const h = o.hero({ ...s, serit: true }); return h.includes('kd-guvenlik-serit') ? h : h + '\n' + o.guvenlikSeridi(); };
  const main = o.sayfa(`
${hero({
  renk: 'mint',
  kirinti: [['Tarifler', 'tarifler.html'], ['Dada Gastro Kids', 'kids.html'], ['Güvenli Kesim']],
  ust: { metin: 'Güvenli kesim atlası', ikon: 'bicak-tahta' },
  baslik: 'Her besin, her yaşta<br>doğru boyutta',
  giris: `${atlas.length} besin için üç aşamalı kesim: 6–8 ay avuçla kavrar, 9–12 ay iki parmakla tutar, 12 ay sonrası ısırıp çiğner. Fotoğraflara bakın, boyutu kıyaslayın, gönül rahatlığıyla hazırlayın.`,
  eylemler: `<a class="kd-btn" href="#atlas"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Besin arayın</a><a class="kd-btn kd-btn--hafif" href="#bogulma-bas">Asla bütün verilmeyenler</a>`,
  sag: heroAsamalar,
})}
${tehlikePaneli}
<section class="kd-bolum" id="atlas" aria-labelledby="atlas-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Atlas', ikonAd: 'bicak-tahta', renk: 'mint', baslik: '<span id="atlas-bas">Besin besin kesim rehberi</span>', alt: 'Arayın, gruba ya da boğulma riskine göre süzün. Her kartın bağlantısını paylaşabilirsiniz.' })}
  ${o.onay() ? `<div class="kd-kust">${o.onay()}</div>` : ''}
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
  <div class="kd-izgara kd-dortlu kd-hizali kd-hizali--4">
   ${[
     ['kids-rehber.html', 'kitap', 'Öğürme mi, boğulma mı?', 'Farkı önceden öğrenmek ilk haftaları çok rahatlatır.', 'pembe'],
     ['kids-arac-hazir-mi.html', 'liste', 'Ek gıdaya hazır mı?', 'Oturma, baş kontrolü ve ilgi: hazırlık belirtilerini işaretleyin.', 'mint'],
     ['kids-donemler.html', 'takvim', 'Evrelere göre beslenme', 'Her evrede kıvam, odak besinler ve uygun tarifler.', 'mavi'],
     ['kids-tarifler.html', 'kase', 'Parmak gıda tarifleri', 'Kesim kurallarına uygun, yaşa göre süzülen tarifler.', 'seftali'],
   ].map(([h, i, b, m, r]) => `<a class="kd-kart kd-modul kd-ikonlu kd-gir" href="${h}" data-renk="${r}"><span class="kd-modul__ikon kd-ikonlu__ikon">${ikon(i, 40)}</span><h3 class="kd-ikonlu__baslik">${b}</h3><p class="kd-ikonlu__metin">${m}</p><span class="kd-kart__alt">Aç <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>`).join('')}
  </div>
 </div>
</section>
`, 'kesim');

  return [{
    dosya: 'kids-guvenli-kesim.html',
    baslik: 'Güvenli Kesim: besin besin 6–8 ay, 9–12 ay, 12 ay+ | Dada Gastro Kids',
    aciklama: 'Bebek ve küçük çocuklar için besin besin güvenli kesim rehberi: aynı tabakta fotoğraflanmış üç aşama, boğulma riski, asla bütün verilmeyen besinler.',
    aktif: 'kesim',
    css: ['kesim'],
    js: ['kesim'],
    main,
  }];
}
