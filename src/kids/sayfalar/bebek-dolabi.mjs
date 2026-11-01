// kids-bebek-dolabi.html — "Dolapta Ne Var?" tam ekran (sahibi: dolap). Bileşen tek kaynak: src/kids/dolap.mjs (Kids Tarifleri'nde kompakt hâli).
// Akış Dada Gastro /dolapta-ne-var ile aynı: başlık bandı → yaş şeridi → dolap paneli (seçilenler, arama, kategorili fotoğraflı kartlar,
// Bebek Kilerim) → sonuçlar ("Hemen yapabilirsin" / "1 malzeme eksik"). Kids menüsüne kalem eklenmez; giriş Kids Tarifleri'ndeki "Tam ekranda aç".
import { dolapBileseni } from '../dolap.mjs';

export default async function (o) {
  const { esc, YASLAR, yasRenk } = o;
  const T = o.veri.tarifler.tarifler || [];
  const yasChip = [`<button class="kd-chip kd-yas-chip" type="button" role="radio" aria-checked="false" data-yas="tumu">Tümü</button>`]
    .concat(YASLAR.map((y) => `<button class="kd-chip kd-yas-chip" type="button" role="radio" aria-checked="false" data-yas="${y}" data-renk="${yasRenk(y)}">${esc(o.YAS_ETIKET[y])}</button>`)).join('');

  const hero = o.hero({
    renk: 'mint', kucuk: true, serit: true,
    kirinti: [['Tarifler', 'tarifler.html'], ['Dada Gastro Kids', 'kids.html'], ['Kids Tarifleri', 'kids-tarifler.html'], ['Dolapta Ne Var?']],
    ust: { metin: 'Dolapta Ne Var?', ikon: 'sepet' },
    baslik: 'Dolabınızdaki malzemeyle bebeğinize tarif bulun',
    giris: `Elinizdeki malzemeleri işaretleyin; seçili yaşa uygun ${T.length} örnek tarif arasından hemen yapabileceklerinizi ve bir malzemesi eksik olanları gösterelim.`,
    eylemler: `<a class="kd-btn kd-btn--hafif kd-btn--kucuk" href="kids-tarifler.html"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Kids Tarifleri'ne dön</a>`,
    sag: `<div class="kd-hero__gorsel kd-tl-foto">${o.foto('varlik/kids/gorsel/bant-kids.webp', 'Pastel kâselerde balkabağı, bezelye, muz ve elma püreleri; yanında muz ve çilek dilimleri', { gen: 1800, yuk: 766, oncelik: true })}</div>`,
  });

  const icerik = `${hero}
<div class="kd-tl-yas">
 <div class="wrap">
  <span class="kd-tl-yas__bas">${o.ikon('bebek', 22)} Yaş</span>
  <div class="kd-serit" id="kdYasSerit" role="radiogroup" aria-label="Yaş (sonuçları ve malzeme uygunluğunu süzer)">${yasChip}</div>
  <span class="kd-tl-yas__kural">Seçilen yaş ve öncesine uygun tarifler</span>
 </div>
</div>
${dolapBileseni(o, { kip: 'tam' })}`;

  return [{
    dosya: 'kids-bebek-dolabi.html', aktif: 'tarifler', css: ['tarifler'], js: [],
    baslik: 'Dolapta Ne Var? — Dolaptaki Malzemeyle Bebek Tarifi | Dada Gastro Kids',
    aciklama: 'Evdeki malzemeleri fotoğraflı kartlardan seçin; seçili yaşa uygun, hemen yapabileceğiniz ve bir malzemesi eksik bebek tariflerini görün. Bebek Dolabı riskli malzemeleri yaşa göre dışlar.',
    main: o.sayfa(icerik, 'tarifler'),
  }];
}
