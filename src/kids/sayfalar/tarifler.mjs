// kids-tarifler.html (katalog + "Dolapta Ne Var?") + kids-tarif.html (detay, ?t=<slug>) — sahibi: v2-tarif
// V2 (REV-2026-DK01): kartlar yalnız o.tarifKart; yaş rozeti o.kidsAgeBadge, kıvam o.kivamGostergesi, kiler o.kilerDugmesi;
// maskot / illüstrasyon / video / ayırıcı / desen / parıltı yok; hero gerçek fotoğraf; güvenlik şeridi hero'nun hemen altında.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const KOK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const jsonOku = async (p, yedek) => { try { return JSON.parse(await readFile(path.join(KOK, p), 'utf8')); } catch { return yedek; } };

export default async function (o) {
  const { esc, veri, YASLAR, YAS_ETIKET, KIVAM_AD, OGUN_AD, yasRenk, yasEvresi, EVRE } = o;
  const T = veri.tarifler.tarifler || [];
  const bySlug = Object.fromEntries(T.map((t) => [t.slug, t]));
  const DOLAP = await jsonOku('veri/bebek-dolabi.json', { riskli: [] });
  const RISKLI = Object.fromEntries((DOLAP.riskli || []).map((r) => [r.anahtar, r]));

  /* sözleşme bileşenleri v2-cekirdek'te; eski ortak.mjs ile de derlensin diye yedekli */
  const rozet = (yas) => (o.kidsAgeBadge ? o.kidsAgeBadge(yas) : o.yasRozet(yas));
  const kivam = (k) => (o.kivamGostergesi ? o.kivamGostergesi(k) : o.kivamEtiket(k));
  const kilerDugme = (t) => (o.kilerDugmesi ? o.kilerDugmesi(t) : '');
  const serit = () => (o.guvenlikSeridi ? o.guvenlikSeridi() : '');
  const heroSeritli = (ayar) => { const h = o.hero({ ...ayar, serit: true }); return h.includes('kd-guvenlik-serit') ? h : h + serit(); };
  const KIDS = ['Dada Gastro Kids', 'kids.html'];

  /* ================= "Dolapta Ne Var?" verisi (derlemede; kiler.js okur) ================= */
  // Sözlük: tarif malzeme anahtarları (kids-tarifler.json malzemeSozlugu) + besinler.json (ad + esAnlamlar) + bebek dolabı (riskli).
  // Çakışan yazımda öncelik: riskli > tarif sözlüğü > besinler (ör. "süt" yemekteki süte gider; "içecek olarak süt" riskliye).
  const BESIN_ESLE = { mercimek: 'kirmizi-mercimek', kofte: 'kiyma', balik: 'somon', peynir: 'lor-peyniri' };
  const kucuk = (s) => String(s || '').toLocaleLowerCase('tr').trim();
  const sozluk = new Map();   // anahtar → {a, ad, es:Set}
  const alinan = new Set();   // tüm yazımlar (çakışma önleme)
  const ekle = (a, ad, esler = []) => {
    let k = sozluk.get(a);
    if (!k) { k = { a, ad, es: new Set() }; sozluk.set(a, k); alinan.add(kucuk(ad)); }
    for (const e of esler) { const x = kucuk(e); if (x && !alinan.has(x)) { alinan.add(x); k.es.add(x); } }
  };
  for (const r of DOLAP.riskli || []) ekle(r.anahtar, r.ad, r.esAnlamlar);
  for (const [a, s] of Object.entries(veri.tarifler.malzemeSozlugu || {})) ekle(a, s.ad, s.esAnlamlar);
  for (const b of veri.besinler.besinler || []) {
    if (b.hamilelik) continue;
    const a = BESIN_ESLE[b.slug] || b.slug;
    if (RISKLI[b.slug]) { ekle(b.slug, RISKLI[b.slug].ad, b.esAnlamlar || []); continue; }   // riskli kayıt: yazımlar riskliye bağlanır
    ekle(a, sozluk.get(a)?.ad || b.ad, [b.ad, ...(b.esAnlamlar || [])]);
  }
  const istege = (m) => /isteğe bağlı/i.test(m.not || '');
  const dolapVeri = {
    temel: ['zeytinyagi'],
    sozluk: [...sozluk.values()].map((k) => {
      const r = RISKLI[k.a];
      return r ? { a: k.a, ad: k.ad, es: [...k.es], r: 1, n: r.neden, m: r.minAy } : { a: k.a, ad: k.ad, es: [...k.es] };
    }),
    tarif: Object.fromEntries(T.map((t) => {
      const g = [], i = [];
      for (const m of t.malzemeler || []) if (m.anahtar) (istege(m) ? i : g).push(m.anahtar);
      return [t.slug, { g: [...new Set(g)], i: [...new Set(i)].filter((x) => !g.includes(x)) }];
    })),
  };
  const jsonGom = (id, v) => `<script type="application/json" id="${id}">${JSON.stringify(v).replace(/</g, '\\u003c')}</script>`;
  const riskliOzet = Object.fromEntries((DOLAP.riskli || []).map((r) => [r.anahtar, r.ad]));

  /* ================= Liste ================= */
  const say = (f) => T.filter(f).length;
  // yaş chip'leri: birikimli gerçek sayılar derlemede basılır (JS filtrelerle günceller)
  const yasChip = [`<button class="kd-chip kd-yas-chip" type="button" role="radio" aria-checked="false" data-yas="tumu">Tümü <small>${T.length}</small></button>`]
    .concat(YASLAR.map((y) => `<button class="kd-chip kd-yas-chip" type="button" role="radio" aria-checked="false" data-yas="${y}" data-renk="${yasRenk(y)}">${esc(YAS_ETIKET[y])} <small>${T.filter((t) => t.yas <= y).length}</small></button>`)).join('');
  const secim = (ad, tip, liste) => `<div class="kd-secim">${liste.map(([v, et, renk, ek = '', duz]) => `<label${renk ? ` data-renk="${renk}"` : ''}><input type="${tip}" name="${ad}" value="${v}" data-ad="${esc(duz || et)}"${ek}><span>${et}</span></label>`).join('')}</div>`;
  const KG = o.KIVAM_GOSTERGE || KIVAM_AD;
  const kivamlar = Object.keys(KIVAM_AD).map((k) => [k, `${o.kivamSvg(k).replace('<svg ', '<svg width="18" height="18" ')}${esc(KG[k])} <small class="kd-ikincil">${say((t) => t.kivam === k)}</small>`, null, '', KG[k]]);
  // alerjen filtresi kartlardaki alerjenleri tam kapsar: veride geçen her alerjen ayrı seçenek (yer fıstığı ≠ sert kabuklu)
  const alerjenSira = ['gluten', 'sut', 'yumurta', 'yerfistigi', 'sertkabuklu', 'susam', 'balik', 'soya'];
  const icermez = alerjenSira.filter((a) => T.some((t) => (t.alerjenler || []).includes(a)))
    .map((k) => [k, `${o.ALERJEN_AD[k]} <small class="kd-ikincil">${T.filter((t) => !(t.alerjenler || []).includes(k)).length}</small>`, null, '', `${o.ALERJEN_AD[k]} içermez`]);
  const ogunler = Object.entries(OGUN_AD).map(([k, ad]) => [k, ad, null]);
  const sureler = [['', 'Hepsi', null, ' checked'], ['15', '15 dk ve altı', null], ['30', '30 dk ve altı', null]];

  const heroFoto = `<div class="kd-hero__gorsel kd-tl-foto">${o.foto('varlik/kids/gorsel/bant-kids.webp', 'Pastel kâselerde balkabağı, bezelye, muz ve elma püreleri; yanında muz ve çilek dilimleri', { gen: 1800, yuk: 766, oncelik: true })}</div>`;

  // Açılır/kapanır panel: ≤768px'te varsayılan kapalı, masaüstünde açık (kiler.js); JS yokken gövde açık kalır.
  const dolapPanel = `<section class="kd-dolap-bolum" id="dolap" aria-labelledby="kdDolapBaslik">
 <div class="wrap">
  <div class="kd-dolap" id="kdDolap" data-kd-dolap>
   <h2 class="kd-dolap__baslik" id="kdDolapBaslik"><button class="kd-dolap__ac" type="button" aria-expanded="true" aria-controls="kdDolapGovde" data-kd-dolap-ac><span class="kd-dolap__ad">${o.ikon('sepet', 24)} Dolapta Ne Var?</span><span class="kd-dolap__durum" id="kdDolapDurum">Bebek Dolabı açık</span><svg class="kd-dolap__ok" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></h2>
   <div class="kd-dolap__govde" id="kdDolapGovde">
   <div class="kd-dolap__bas">
    <div class="kd-dolap__metin">
     <p>Evdeki malzemeleri ekleyin; tam yapılabilen tarifler önce, bir malzemesi eksik olanlar sonra gelsin. Yaş, kıvam ve alerjen seçimleriniz geçerli kalır.</p>
    </div>
    <label class="kd-dolap__anahtar" for="kdBebekDolabi">
     <input type="checkbox" id="kdBebekDolabi" role="switch" checked aria-describedby="kdBebekDolabiAc">
     <span class="kd-dolap__anahtar-iz" aria-hidden="true"></span>
     <span><b>Bebek Dolabı</b><small id="kdBebekDolabiAc">Tuz, bal, salça, acı baharat gibi riskli malzemeleri dışlar</small></span>
    </label>
   </div>
   <div class="kd-dolap__giris">
    <label class="kd-dolap__etiket" for="kdDolapGir">Malzeme ekleyin</label>
    <div class="kd-dolap__alan">
     <ul class="kd-dolap__cipler" id="kdDolapCipler" aria-label="Dolaptaki malzemeler"></ul>
     <input id="kdDolapGir" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="kdDolapOneri" aria-describedby="kdDolapIpucu" autocomplete="off" enterkeyhint="done" placeholder="Malzeme yazın (ör. havuç, patates)">
    </div>
    <ul class="kd-dolap__oneri" id="kdDolapOneri" role="listbox" aria-label="Malzeme önerileri" hidden></ul>
    <p class="kd-gizli" id="kdDolapIpucu">Yazdıkça öneriler çıkar; ok tuşlarıyla seçip Enter'a basın. Virgülle birden çok malzeme yazabilirsiniz.</p>
    <p class="kd-dolap__uyari" id="kdDolapUyari" role="status" aria-live="polite"></p>
   </div>
   <div class="kd-dolap__alt">
    <p class="kd-dolap__ozet" id="kdDolapOzet" aria-live="polite">Dolap boş: tüm tarifler gösteriliyor.</p>
    <button class="kd-btn kd-btn--hafif kd-btn--kucuk" type="button" data-kd-dolap-temizle hidden>Dolabı temizle</button>
   </div>
   <div class="kd-kiler kd-ikonlu" id="kdKiler" tabindex="-1" aria-labelledby="kdKilerBaslik">
    <span class="kd-ikonlu__ikon">${o.ikon('kase', 20)}</span>
    <h3 class="kd-ikonlu__baslik" id="kdKilerBaslik">Bebek Kilerim <small id="kdKilerSayi"></small></h3>
    <div class="kd-ikonlu__rozet kd-kiler__eylem">
     <button class="kd-btn kd-btn--kucuk" type="button" data-kd-kiler-yukle disabled>Kilerdekileri dolaba yükle</button>
     <button class="kd-btn kd-btn--hafif kd-btn--kucuk" type="button" data-kd-kiler-bosalt hidden>Kileri boşalt</button>
    </div>
    <ul class="kd-kiler__liste kd-ikonlu__ek" id="kdKilerListe" aria-label="Bebek Kilerimdeki malzemeler"></ul>
    <p class="kd-kiler__bos kd-ikonlu__metin" id="kdKilerBos">Henüz boş. Tarif kartlarındaki “Bebek Kilerime Ekle” düğmesiyle malzemeleri buraya toplayın; sonra tek tıkla dolaba yükleyin.</p>
   </div>
   ${o.ornek('Bebek Dolabı listesi ve gerekçeleri örnektir; bebeğinize uygun besinler için çocuk doktorunuza danışın.')}
   </div>
  </div>
 </div>
</section>`;

  const liste = `${heroSeritli({
    renk: 'seftali', kucuk: true,
    kirinti: [['Tarifler', 'tarifler.html'], KIDS, ['Kids Tarifleri']],
    ust: { metin: 'Kids Tarifleri', ikon: 'kase' },
    baslik: 'Yaşa göre bebek ve çocuk tarifleri',
    giris: `6. aydan 3 yaşa ${T.length} örnek tarif. Önce yaşı seçin, sonra kıvam, alerjen, öğün ve süreye göre daraltın ya da dolabınızdakilerle arayın.`,
    ek: `<div class="kd-ara kd-tl-ara"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><label class="kd-gizli" for="kdTarifAra">Tariflerde ara</label><input id="kdTarifAra" type="search" placeholder="Tarif ya da malzeme ara (ör. balkabağı)" autocomplete="off"></div>`,
    sag: heroFoto,
  })}
<div class="kd-tl-yas">
 <div class="wrap">
  <span class="kd-tl-yas__bas">${o.ikon('bebek', 22)} Yaş</span>
  <div class="kd-serit" id="kdYasSerit" role="radiogroup" aria-label="Yaş filtresi (zorunlu)">${yasChip}</div>
  <span class="kd-tl-yas__kural">Seçilen yaş ve öncesine uygun tarifler</span>
 </div>
</div>
${dolapPanel}
<section class="kd-bolum kd-bolum--sikisik kd-tl-bolum">
 <div class="wrap">
  <div class="kd-liste" data-denge-serbest="filtre paneli yapışkan; uzun sonuç listesi kaydırılırken yanında kalır">
   <aside class="kd-filtre" id="kdFiltre" aria-label="Filtreler">
    <div class="kd-filtre__ust"><h2>Filtreler</h2><div><button class="kd-chip" type="button" data-kd-temizle>Temizle</button> <button class="kd-chip kd-filtre__kapat" type="button" aria-label="Filtreleri kapat"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div></div>
    <form id="kdTarifFiltre" onsubmit="return false">
     <fieldset class="kd-tl-grup kd-tl-grup--kivam"><legend>Kıvam</legend>${secim('kivam', 'checkbox', kivamlar)}</fieldset>
     <fieldset class="kd-tl-grup kd-tl-grup--iki"><legend>Alerjen içermez</legend>${secim('icermez', 'checkbox', icermez)}</fieldset>
     <fieldset class="kd-tl-grup"><legend>Öğün</legend>${secim('ogun', 'checkbox', ogunler)}</fieldset>
     <fieldset class="kd-tl-grup"><legend>Hazırlık süresi</legend>${secim('sure', 'radio', sureler)}</fieldset>
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
</section>
${jsonGom('kdDolapVeri', dolapVeri)}`;

  /* ================= Detay ================= */
  const evreOf = (t) => EVRE[t.evre] || EVRE[yasEvresi(t.yas)];
  function sonrakiKart(t) {
    if (!t.sonraki) return '';
    const s = t.sonraki.slug && bySlug[t.sonraki.slug];
    // mini bağ da sözleşme bileşenlerini taşır: yaş rozeti + kıvam göstergesi
    return `<div class="kd-td-buyur kd-gir" data-renk="${s ? yasRenk(s.yas) : evreOf(t).renk}">
  <div><span class="kd-ust-yazi">${o.ikon('takvim', 18)}Bir sonraki evrede</span><h3>Bu tarif nasıl büyür?</h3><p>${esc(t.sonraki.metin || '')}</p></div>
  ${s ? `<a class="kd-td-buyur__kart" href="${o.tarifHref(s.slug)}"><span class="kd-td-buyur__medya">${o.foto(s.gorsel, s.ad, { gen: 600, yuk: 450 })}${rozet(s.yas)}</span><span><b>${esc(s.ad)}</b>${kivam(s.kivam)}<small>Tarife git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></small></span></a>` : ''}
 </div>`;
  }
  function detay(t, i) {
    const ev = evreOf(t);
    const benzer = o.benzerTarifler(t, T, 4);
    const hepsiEvreden = benzer.every((b) => b.evre === t.evre);
    const ogun = (t.ogun || []).map((x) => OGUN_AD[x]).join(' · ');
    const riskliMalz = (t.malzemeler || []).filter((m) => m.anahtar && RISKLI[m.anahtar]);
    return `<article class="kd-detay" data-slug="${t.slug}" data-baslik="${esc(`${t.ad} (${YAS_ETIKET[t.yas]}) | Dada Gastro Kids · Dada Gastro`)}"${i ? ' hidden' : ''}>
<section class="kd-hero kd-td-hero" data-renk="${ev.renk}">
 <div class="wrap">
  ${o.kirinti([['Tarifler', 'tarifler.html'], KIDS, ['Kids Tarifleri', 'kids-tarifler.html'], [t.ad]])}
  <div class="kd-td-ust">
   <div class="kd-td-foto">${o.foto(t.gorsel, `${t.ad}: ${(KG[t.kivam] || '').toLocaleLowerCase('tr')} kıvamda örnek tarif fotoğrafı`, { gen: 1200, yuk: 900, oncelik: i === 0 })}${rozet(t.yas)}</div>
   <div class="kd-td-bilgi">
    ${o.ustYazi(ev.ad, { ikonAd: ev.ikon })}
    <h1>${esc(t.ad)}</h1>
    <div class="kd-td-imza"><p class="kd-td-yazar"><span class="kd-td-yazar__etiket">Yazar</span> <span class="kd-td-yazar__ad">Dada Gastro Kids Editörü</span></p>${o.inceleyenUzman ? o.inceleyenUzman({ sinif: 'kd-td-inceleyen' }) : ''}</div>
    ${t.kisa ? `<p class="kd-giris">${esc(t.kisa)}</p>` : ''}
    <div class="kd-td-olgu">${kivam(t.kivam)}${o.alerjenPilleri(t.alerjenler, { en: 6 })}</div>
    <dl class="kd-td-meta">
     ${t.sureDk ? `<div><dt>Süre</dt><dd>${t.sureDk} dk</dd></div>` : ''}
     ${t.porsiyon ? `<div><dt>Porsiyon</dt><dd>${esc(t.porsiyon)}</dd></div>` : ''}
     ${ogun ? `<div><dt>Öğün</dt><dd>${esc(ogun)}</dd></div>` : ''}
    </dl>
    <div class="kd-td-uygun kd-ikonlu"><span class="kd-ikonlu__ikon">${o.ikon('kalp', 22)}</span><h2 class="kd-ikonlu__baslik">Yaşa uygunluk</h2><p class="kd-ikonlu__metin">${esc(t.yasaUygunluk || `${YAS_ETIKET[t.yas]} ve sonrası için hazırlanmış örnek tarif.`)}</p></div>
   </div>
  </div>
 </div>
</section>
${serit()}
<section class="kd-bolum kd-bolum--sikisik">
 <div class="wrap kd-td-govde" data-denge-serbest="malzeme sütunu yapışkan, adımlar kaydırılırken yanında kalır">
  <div class="kd-td-ana">
   ${t.alerjenUyari ? `<div class="kd-kutu kd-kutu--uyari kd-ikonlu kd-gir"><span class="kd-ikonlu__ikon"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span><h3 class="kd-ikonlu__baslik">Alerjen uyarısı</h3><p class="kd-ikonlu__metin">${esc(t.alerjenUyari)}</p></div>` : ''}
   <h2 class="kd-td-bolum">Hazırlanışı</h2>
   <ol class="kd-td-adimlar">${(t.adimlar || []).map((a, n) => `<li class="kd-gir"><span class="kd-td-no">${n + 1}</span><div><h3>${esc(a.baslik)}</h3><p>${esc(a.metin)}</p></div></li>`).join('') || '<li><div><p class="kd-ikincil">Adımlar hazırlanıyor.</p></div></li>'}</ol>
   <div class="kd-izgara kd-izgara--2 kd-td-kutular">
    ${t.kesimNotu ? `<div class="kd-kutu kd-ikonlu kd-gir" data-renk="${ev.renk}"><span class="kd-ikonlu__ikon">${o.ikon('bicak-tahta', 22)}</span><h3 class="kd-ikonlu__baslik">Kıvam ve kesim</h3><p class="kd-ikonlu__metin">${esc(t.kesimNotu)}</p><a class="kd-bag kd-ikonlu__ek" href="kids-guvenli-kesim.html">Güvenli kesim rehberi</a></div>` : ''}
    ${t.saklama ? `<div class="kd-kutu kd-ikonlu kd-gir"><span class="kd-ikonlu__ikon">${o.ikon('kase', 22)}</span><h3 class="kd-ikonlu__baslik">Saklama</h3><p class="kd-ikonlu__metin">${esc(t.saklama)}</p></div>` : ''}
    ${t.ipucu ? `<div class="kd-kutu kd-ikonlu kd-gir kd-td-ipucu" data-renk="mint"><span class="kd-ikonlu__ikon">${o.ikon('kitap', 22)}</span><h3 class="kd-ikonlu__baslik">Hazırlık ipucu</h3><p class="kd-ikonlu__metin">${esc(t.ipucu)}</p></div>` : ''}
   </div>
   ${sonrakiKart(t)}
  </div>
  <aside class="kd-td-yan">
   <div class="kd-td-malz kd-ikonlu" id="malzemeler-${t.slug}">
    <span class="kd-ikonlu__ikon">${o.ikon('sepet', 24)}</span>
    <h2 class="kd-ikonlu__baslik">Malzemeler</h2>
    <span class="kd-ikonlu__rozet">${kilerDugme(t)}</span>
    ${t.porsiyon ? `<p class="kd-ikonlu__metin kd-ikincil">${esc(t.porsiyon)} için</p>` : ''}
    <ul class="kd-ikonlu__ek">${(t.malzemeler || []).map((m) => `<li${m.anahtar && RISKLI[m.anahtar] ? ' data-kd-riskli' : ''}><b>${esc(m.miktar || '')}</b><span>${esc(m.ad)}${m.not ? ` <small>${esc(m.not)}</small>` : ''}${m.anahtar && RISKLI[m.anahtar] ? ' <small class="kd-td-riskli">Bebek dolabına uygun değil; Bebek Kilerine eklenmez.</small>' : ''}</span></li>`).join('')}</ul>
    <p class="kd-td-not kd-ikonlu__ek">${o.ikon('kalp', 18)} Tuz, şeker ve bal eklenmez.${riskliMalz.length ? ' 1 yaş öncesinde işaretli malzemeyi kullanmayın.' : ''}</p>
   </div>
   ${o.ornek('Bu tarif ve yaş önerisi prototip örneğidir; bebeğinizin gelişimine göre çocuk doktorunuza danışın.')}
  </aside>
 </div>
</section>
${benzer.length ? `<section class="kd-bolum kd-zebra kd-td-benzer" data-renk="${ev.renk}"><div class="wrap">${o.bolumBasi({ ust: ev.ad, ikonAd: ev.ikon, renk: ev.renk, baslik: hepsiEvreden ? 'Bu evreden başka tarifler' : 'Benzer tarifler', sag: `<a class="kd-btn kd-btn--hafif kd-btn--kucuk" href="kids-tarifler.html?yas=${t.yas}">Tümü <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>` })}${o.tarifSeridi(benzer, { sinif: 'kd-td-oneri', kaydir: false })}</div></section>` : ''}
</article>`;
  }

  const detaySayfa = `<div class="wrap"><p class="kd-ornek kd-td-yok" id="kdDetayYok" hidden role="status"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>Aradığınız tarif bulunamadı; ilk tarifi gösteriyoruz. <a class="kd-bag" href="kids-tarifler.html">Tüm Kids tariflerine dönün.</a></span></p></div>
${T.map(detay).join('\n')}
${jsonGom('kdDolapVeri', { riskli: riskliOzet })}`;

  return [
    { dosya: 'kids-tarifler.html', baslik: 'Kids Tarifleri — Yaşa Göre Bebek ve Çocuk Tarifleri | Dada Gastro Kids', aciklama: '+6 aydan 3 yaşa, yaş rozeti, kıvam göstergesi ve alerjen etiketli bebek ve çocuk tarifleri. Yaşı seçin, filtreleyin ya da "Dolapta Ne Var?" ile elinizdeki malzemelerle arayın.', aktif: 'tarifler', css: ['tarifler'], main: o.sayfa(liste, 'tarifler') },
    { dosya: 'kids-tarif.html', baslik: `${T[0]?.ad || 'Tarif'} | Dada Gastro Kids · Dada Gastro`, aciklama: 'Dada Gastro Kids tarif detayı: yaş rozeti, kıvam, kesim notu, alerjen uyarısı, malzemeler ve adımlar.', aktif: 'tarifler', css: ['tarifler'], main: o.sayfa(detaySayfa, 'tarifler') },
  ];
}
