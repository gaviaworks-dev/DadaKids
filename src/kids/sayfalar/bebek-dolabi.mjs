// kids-bebek-dolabi.html — "Dolapta Ne Var?" (sahibi: dolap). Bileşen tek kaynak: src/kids/dolap.mjs.
// Revize 2 Kas R11: hero ve kırıntı YOK; sayfa doğrudan yapışkan yaş barı (Kids Tarifleri'ndekiyle aynı bileşen, sayılar dahil)
// + "Dolapta 0 malzeme" kartıyla açılır (arama, Bebek Dolabı anahtarı, kayan kategori şeritleri, Bebek Kilerim) → sonuçlar →
// güvenlik şeridi (sonuçların altında). h1 görsel olarak gizli, <main>'in ilk öğesi (.kd-sayfa'nın önünde);
// görünür başlık kartın "Dolapta N malzeme" satırı.
import { dolapBileseni, yasSeridi } from '../dolap.mjs';

export default async function (o) {
  const icerik = `${yasSeridi(o, { aria: 'Yaş (sonuçları ve malzeme uygunluğunu süzer)' })}
${dolapBileseni(o)}
${o.guvenlikSeridi()}`;

  return [{
    dosya: 'kids-bebek-dolabi.html', aktif: 'tarifler', css: ['tarifler'], js: [],
    baslik: 'Bebek Dolabı — Dolaptaki Malzemeyle Bebek Tarifi | Dada Gastro Kids',
    aciklama: 'Evdeki malzemeleri seçin; seçili yaşa uygun, hemen yapabileceğiniz ve bir malzemesi eksik bebek tariflerini görün. Bebek Dolabı riskli malzemeleri yaşa göre dışlar.',
    main: `<h1 class="kd-gizli">Bebek Dolabı: dolabınızdaki malzemeyle bebeğinize tarif bulun</h1>\n${o.sayfa(icerik, 'tarifler')}`,
  }];
}
