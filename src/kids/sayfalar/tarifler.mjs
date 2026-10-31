// kids-tarifler.html (liste) + kids-tarif.html (detay, ?t=<slug>) — sahibi: lead
export default async function (o) {
  const { esc, veri, YASLAR, YAS_ETIKET, KIVAM_AD, OGUN_AD, yasRenk, yasEvresi, EVRE } = o;
  const T = veri.tarifler.tarifler || [];
  const bySlug = Object.fromEntries(T.map((t) => [t.slug, t]));

  /* ================= Liste ================= */
  const say = (f) => T.filter(f).length;
  // yaş chip'leri: birikimli gerçek sayılar derlemede basılır (JS filtrelerle günceller)
  const yasChip = [`<button class="kd-chip kd-yas-chip" type="button" role="radio" aria-checked="false" data-yas="tumu">Tümü <small>${T.length}</small></button>`]
    .concat(YASLAR.map((y) => `<button class="kd-chip kd-yas-chip" type="button" role="radio" aria-checked="false" data-yas="${y}" data-renk="${yasRenk(y)}">${esc(YAS_ETIKET[y])} <small>${T.filter((t) => t.yas <= y).length}</small></button>`)).join('');
  const secim = (ad, tip, liste) => `<div class="kd-secim">${liste.map(([v, et, renk, ek = '', duz]) => `<label${renk ? ` data-renk="${renk}"` : ''}><input type="${tip}" name="${ad}" value="${v}" data-ad="${esc(duz || et)}"${ek}><span>${et}</span></label>`).join('')}</div>`;
  const kivamlar = Object.entries(KIVAM_AD).map(([k, ad]) => [k, `${o.kivamSvg(k).replace('<svg ', '<svg width="18" height="18" ')}${esc(ad)} <small class="kd-ikincil">${say((t) => t.kivam === k)}</small>`, null, '', ad]);
  // alerjen filtresi kartlardaki alerjenleri tam kapsar: veride geçen her alerjen ayrı seçenek (yer fıstığı ≠ sert kabuklu)
  const alerjenSira = ['gluten', 'sut', 'yumurta', 'yerfistigi', 'sertkabuklu', 'susam', 'balik', 'soya'];
  const icermez = alerjenSira.filter((a) => T.some((t) => (t.alerjenler || []).includes(a)))
    .map((k) => [k, `${o.ALERJEN_AD[k]} içermez <small class="kd-ikincil">${T.filter((t) => !(t.alerjenler || []).includes(k)).length}</small>`, null, '', `${o.ALERJEN_AD[k]} içermez`]);
  const ogunler = Object.entries(OGUN_AD).map(([k, ad]) => [k, ad, null]);
  const sureler = [['', 'Hepsi', null, ' checked'], ['15', '15 dk ve altı', null], ['30', '30 dk ve altı', null]];

  const kolaj = `<div class="kd-tl-kolaj" aria-hidden="true">${['avokado-muz-ezmesi', 'tatli-patates-cubuklari', 'meyveli-yogurt-kasesi'].filter((s) => bySlug[s]).map((s, i) => `<span class="kd-tl-kolaj__${i + 1}">${o.foto(bySlug[s].gorsel, '', { gen: 600, yuk: 450, oncelik: i === 0 })}</span>`).join('')}<span class="kd-tl-kolaj__sus kd-yuz">${o.ikon('parilti', 56)}</span></div>`;

  const liste = `${o.hero({
    renk: 'seftali', kucuk: true,
    kirinti: [['Tarifler', 'tarifler.html'], ['Dada Kids', 'kids.html'], ['Kids Tarifleri']],
    ust: { metin: 'Kids Tarifleri', ikon: 'kase' },
    baslik: 'Yaşa göre bebek ve çocuk tarifleri',
    giris: `6. aydan 3 yaşa ${T.length} örnek tarif. Önce yaşı seçin, sonra kıvam, alerjen, öğün ve süreye göre daraltın.`,
    ek: `<div class="kd-ara kd-tl-ara"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><label class="kd-gizli" for="kdTarifAra">Tariflerde ara</label><input id="kdTarifAra" type="search" placeholder="Tarif ya da malzeme ara (ör. balkabağı)" autocomplete="off"></div>`,
    sag: o.video('tarifler', '') ? `<div class="kd-hero__gorsel kd-tl-video">${o.video('tarifler', '')}</div>` : (o.illus('hero-tarifler', '', { yedek: '' }) ? `<div class="kd-hero__gorsel kd-tl-illus">${o.illus('hero-tarifler', 'Sevimli yüzlü renkli bebek püreleri', { yedek: '' })}<span class="kd-hero__sus kd-hero__sus--2">${o.maskot('sef', { boy: 96 })}</span></div>` : kolaj),
  })}
<div class="kd-tl-yas">
 <div class="wrap">
  <span class="kd-tl-yas__bas">${o.ikon('bebek', 22)} Yaş</span>
  <div class="kd-serit" id="kdYasSerit" role="radiogroup" aria-label="Yaş filtresi (zorunlu)">${yasChip}</div>
  <span class="kd-tl-yas__kural">Seçilen yaş ve öncesine uygun tarifler</span>
 </div>
</div>
<section class="kd-bolum kd-bolum--sikisik">
 <div class="wrap">
  <div class="kd-liste">
   <aside class="kd-filtre" id="kdFiltre" aria-label="Filtreler">
    <div class="kd-filtre__ust"><h2>Filtreler</h2><div><button class="kd-chip" type="button" data-kd-temizle>Temizle</button> <button class="kd-chip kd-filtre__kapat" type="button" aria-label="Filtreleri kapat"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div></div>
    <form id="kdTarifFiltre" onsubmit="return false">
     <fieldset><legend>Kıvam</legend>${secim('kivam', 'checkbox', kivamlar)}</fieldset>
     <fieldset><legend>Alerjen içermez</legend>${secim('icermez', 'checkbox', icermez)}</fieldset>
     <fieldset><legend>Öğün</legend>${secim('ogun', 'checkbox', ogunler)}</fieldset>
     <fieldset><legend>Hazırlık süresi</legend>${secim('sure', 'radio', sureler)}</fieldset>
    </form>
    <button class="kd-btn kd-filtre__kapat" type="button">Sonuçları göster</button>
   </aside>
   <div class="kd-tl-sonuc">
    <div class="kd-sonuc-bar">
     <b id="kdSonucSayi" aria-live="polite">${T.length} tarif</b>
     <div>
      <button class="kd-btn kd-btn--hafif kd-btn--kucuk kd-filtre-ac" type="button" aria-controls="kdFiltre" aria-expanded="false"><i class="fa-solid fa-sliders" aria-hidden="true"></i> Filtrele <span data-kd-filtre-sayi></span></button>
      <label class="kd-gizli" for="kdSirala">Sıralama</label>
      <select class="kd-sec" id="kdSirala"><option value="onerilen">Önerilen</option><option value="yas">Yaşa en yakın</option><option value="hizli">En hızlı</option><option value="az">A'dan Z'ye</option></select>
     </div>
    </div>
    ${o.ornek('Yaş, kıvam ve alerjen bilgileri prototip için hazırlanmış örneklerdir. Tariflere tuz, şeker ve bal eklenmez.')}
    <div class="kd-izgara kd-tl-izgara" id="kdTarifIzgara">
${T.map((t, i) => o.tarifKart(t, { sira: i })).join('\n')}
${o.ctaKart({ href: 'kids-guvenli-kesim.html', ikonAd: 'bicak-tahta', baslik: 'Malzemeyi yaşa göre kesin', metin: 'Tarifteki besinleri 6–8 ay, 9–12 ay ve 12 ay sonrası için nasıl keseceğinizi adım adım görün.', etiket: 'Güvenli Kesim', renk: 'mint', sinif: 'kd-tl-cta' })}
    </div>
    ${o.bosDurum({ baslik: 'Bu seçimle tarif bulunamadı', metin: 'Aşağıdaki önerilerle sonuçları genişletebilirsiniz.', id: 'kdBos' })}
   </div>
  </div>
 </div>
</section>`;

  /* ================= Detay ================= */
  const evreOf = (t) => EVRE[t.evre] || EVRE[yasEvresi(t.yas)];
  function sonrakiKart(t) {
    if (!t.sonraki) return '';
    const s = t.sonraki.slug && bySlug[t.sonraki.slug];
    return `<div class="kd-td-buyur kd-gir" data-renk="${s ? yasRenk(s.yas) : evreOf(t).renk}">
  <div><span class="kd-ust-yazi">${o.ikon('parilti', 18)}Bir sonraki evrede</span><h3>Bu tarif nasıl büyür?</h3><p>${esc(t.sonraki.metin || '')}</p></div>
  ${s ? `<a class="kd-td-buyur__kart" href="${o.tarifHref(s.slug)}">${o.foto(s.gorsel, s.ad, { gen: 600, yuk: 450 })}<span>${o.yasRozet(s.yas, 's')}<b>${esc(s.ad)}</b><small>Tarife git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></small></span></a>` : ''}
 </div>`;
  }
  function detay(t, i) {
    const ev = evreOf(t);
    const benzer = o.benzerTarifler(t, T, 4);
    const hepsiEvreden = benzer.every((b) => b.evre === t.evre);
    const ogun = (t.ogun || []).map((x) => OGUN_AD[x]).join(' · ');
    return `<article class="kd-detay" data-slug="${t.slug}" data-baslik="${esc(`${t.ad} (${YAS_ETIKET[t.yas]}) | Dada Kids · Dada Gastro`)}"${i ? ' hidden' : ''}>
<section class="kd-hero kd-td-hero" data-renk="${ev.renk}">
 <div class="wrap">
  ${o.kirinti([['Tarifler', 'tarifler.html'], ['Dada Kids', 'kids.html'], ['Kids Tarifleri', 'kids-tarifler.html'], [t.ad]])}
  <div class="kd-td-ust">
   <div class="kd-td-foto">${o.foto(t.gorsel, t.ad, { gen: 1200, yuk: 900, oncelik: i === 0 })}${o.yasRozet(t.yas, 'l', true)}</div>
   <div class="kd-td-bilgi">
    ${o.ustYazi(ev.ad, { ikonAd: ev.ikon })}
    <h1>${esc(t.ad)}</h1>
    ${t.kisa ? `<p class="kd-giris">${esc(t.kisa)}</p>` : ''}
    <div class="kd-td-olgu">${o.kivamEtiket(t.kivam)}${o.alerjenPilleri(t.alerjenler, { en: 6 })}</div>
    <dl class="kd-td-meta">
     ${t.sureDk ? `<div><dt>Süre</dt><dd>${t.sureDk} dk</dd></div>` : ''}
     ${t.porsiyon ? `<div><dt>Porsiyon</dt><dd>${esc(t.porsiyon)}</dd></div>` : ''}
     ${ogun ? `<div><dt>Öğün</dt><dd>${esc(ogun)}</dd></div>` : ''}
    </dl>
    <div class="kd-td-uygun"><h2>${o.ikon('kalp', 22)} Yaşa uygunluk</h2><p>${esc(t.yasaUygunluk || `${YAS_ETIKET[t.yas]} ve sonrası için hazırlanmış örnek tarif.`)}</p></div>
   </div>
  </div>
 </div>
</section>
<section class="kd-bolum kd-bolum--sikisik">
 <div class="wrap kd-td-govde">
  <div class="kd-td-ana">
   ${t.alerjenUyari ? `<div class="kd-kutu kd-kutu--uyari kd-gir"><h3><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Alerjen uyarısı</h3><p>${esc(t.alerjenUyari)}</p></div>` : ''}
   <h2 class="kd-td-bolum">Hazırlanışı</h2>
   <ol class="kd-td-adimlar">${(t.adimlar || []).map((a, n) => `<li class="kd-gir"><span class="kd-td-no">${n + 1}</span><div><h3>${esc(a.baslik)}</h3><p>${esc(a.metin)}</p></div></li>`).join('') || '<li><div><p class="kd-ikincil">Adımlar hazırlanıyor.</p></div></li>'}</ol>
   <div class="kd-izgara kd-izgara--2 kd-td-kutular">
    ${t.kesimNotu ? `<div class="kd-kutu kd-gir" data-renk="${ev.renk}"><h3>${o.ikon('bicak-tahta', 22)} Kıvam ve kesim</h3><p>${esc(t.kesimNotu)}</p><a class="kd-bag" href="kids-guvenli-kesim.html">Güvenli kesim rehberi</a></div>` : ''}
    ${t.saklama ? `<div class="kd-kutu kd-gir"><h3>${o.ikon('kase', 22)} Saklama</h3><p>${esc(t.saklama)}</p></div>` : ''}
    ${t.ipucu ? `<div class="kd-kutu kd-gir kd-td-ipucu" data-renk="mint"><h3>${o.maskot('sef', { boy: 72 }) || o.ikon('parilti', 22)} Pütür'ün ipucu</h3><p>${esc(t.ipucu)}</p></div>` : ''}
   </div>
   ${sonrakiKart(t)}
  </div>
  <aside class="kd-td-yan">
   <div class="kd-td-malz" id="malzemeler-${t.slug}">
    <h2>${o.ikon('sepet', 24)} Malzemeler</h2>
    ${t.porsiyon ? `<p class="kd-ikincil">${esc(t.porsiyon)} için</p>` : ''}
    <ul>${(t.malzemeler || []).map((m) => `<li><b>${esc(m.miktar || '')}</b><span>${esc(m.ad)}${m.not ? ` <small>${esc(m.not)}</small>` : ''}</span></li>`).join('')}</ul>
    <p class="kd-td-not">${o.ikon('kalp', 18)} Tuz, şeker ve bal eklenmez.</p>
   </div>
   ${o.ornek('Bu tarif ve yaş önerisi prototip örneğidir; bebeğinizin gelişimine göre çocuk doktorunuza danışın.')}
   ${o.onay()}
  </aside>
 </div>
</section>
${benzer.length ? `${o.ayirici('dalga', o.zebraRenk(ev.renk))}<section class="kd-bolum kd-zebra kd-desen--nokta" data-renk="${ev.renk}"><div class="wrap">${o.bolumBasi({ ust: ev.ad, ikonAd: ev.ikon, renk: ev.renk, baslik: hepsiEvreden ? 'Bu evreden başka tarifler' : 'Benzer tarifler', sag: `<a class="kd-btn kd-btn--hafif kd-btn--kucuk" href="kids-tarifler.html?yas=${t.yas}">Tümü <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>` })}${o.tarifSeridi(benzer, { sinif: 'kd-td-oneri', kaydir: false })}</div></section>` : ''}
</article>`;
  }

  const detaySayfa = `<div class="wrap"><p class="kd-ornek kd-td-yok" id="kdDetayYok" hidden role="status"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>Aradığınız tarif bulunamadı; ilk tarifi gösteriyoruz. <a class="kd-bag" href="kids-tarifler.html">Tüm Kids tariflerine dönün.</a></span></p></div>
${T.map(detay).join('\n')}`;

  return [
    { dosya: 'kids-tarifler.html', baslik: 'Kids Tarifleri — Yaşa Göre Bebek ve Çocuk Tarifleri | Dada Gastro', aciklama: '+6 aydan 3 yaşa, yaş rozeti, kıvam ve alerjen etiketli bebek ve çocuk tarifleri. Önce yaşı seçin; kıvam, alerjen, öğün ve süreye göre daraltın.', aktif: 'tarifler', css: ['tarifler'], main: o.sayfa(liste, 'tarifler') },
    { dosya: 'kids-tarif.html', baslik: `${T[0]?.ad || 'Tarif'} | Dada Kids · Dada Gastro`, aciklama: 'Dada Kids tarif detayı: yaşa uygunluk, kıvam ve kesim notu, alerjen uyarısı, malzemeler ve adımlar.', aktif: 'tarifler', css: ['tarifler'], main: o.sayfa(detaySayfa, 'tarifler') },
  ];
}
