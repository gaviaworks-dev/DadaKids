// Dada Kids — Mevsimsel Takvim (sahibi: sayfalar kolu)
// Veri: veri/mevsim.json {_not, aylar:[{ay, ad, kahraman:{ikon,ad,neden,secim,saklama,bebekIcin}, urunler:[{ikon,ad,tur,minAy,durum,uzmanNotu?}]}]}
// 12 ayın paneli statik basılır; varlik/kids/js/mevsim.js bu ayı seçer ve aylar arasında geçiş yapar.

const MEVSIM = (ay) => (ay === 12 || ay <= 2 ? { ad: 'Kış', renk: 'mavi', key: 'kis' } : ay <= 5 ? { ad: 'İlkbahar', renk: 'mint', key: 'ilkbahar' } : ay <= 8 ? { ad: 'Yaz', renk: 'sari', key: 'yaz' } : { ad: 'Sonbahar', renk: 'seftali', key: 'sonbahar' });
const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const AY_AD = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TUR_AD = { meyve: 'Meyve', sebze: 'Sebze', yesillik: 'Yeşillik', baklagil: 'Baklagil' };
const DURUM = { zirvede: { ad: 'Zirvede', ikon: 'fa-star' }, mevsiminde: { ad: 'Mevsiminde', ikon: 'fa-leaf' }, 'son-gunler': { ad: 'Son günler', ikon: 'fa-hourglass-end' } };

const normal = (s) => String(s || '').toLocaleLowerCase('tr')
  .replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u')
  .replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------- Tur 2: görsel varlık denetimi + bölüm ritmi (sayfalar kolu; 4 modülde aynı küçük yardımcılar) ---------- */
import { existsSync } from 'node:fs';
const KOK = new URL('../../../', import.meta.url).pathname;
const illusVar = (k) => ['webp', 'svg', 'png'].some((u) => existsSync(`${KOK}varlik/kids/illus/${k}.${u}`));
const urunVar = (k) => existsSync(`${KOK}varlik/kids/svg/urun/${k}.svg`);
const DESEN = ['nokta', 'bulut', 'konfeti'];
const zemin = (renk) => (renk ? `color-mix(in srgb, var(--kd-${renk}-a) 62%, var(--kd-krem))` : 'var(--kd-krem)');
/** Bölümleri sırayla dizer: bir krem, bir açık evre bandı (zebra + desen); aralarına dalga/bulut ayırıcı.
 *  Her bölüm (z) => html; z, section etiketinin class değerine eklenecek metindir (zebra ise data-renk'i de taşır). */
function ritim(o, bolumler, renkler, { zebraIle = true } = {}) {
  const dolu = bolumler.filter((b) => b && b(''));
  let html = ''; let onceki = null; let oncekiDesen = '';
  dolu.forEach((b, i) => {
    const zebra = (i % 2 === 0) === zebraIle ? renkler[Math.floor(i / 2) % renkler.length] : null;
    const desen = zebra ? DESEN[Math.floor(i / 2) % DESEN.length] : '';
    if (i > 0 || zebra) html += `<div class="kd-gecis${onceki ? ` kd-zebra kd-desen--${oncekiDesen}` : ''}"${onceki ? ` data-renk="${onceki}"` : ''}>${o.ayirici(i % 2 ? 'bulut' : 'dalga', zemin(zebra))}</div>\n`;
    html += b(zebra ? ` kd-zebra kd-desen--${desen}" data-renk="${zebra}` : '') + '\n';
    onceki = zebra; oncekiDesen = desen;
  });
  return html;
}

export default async function mevsim(o) {
  const { esc, ikon, urun } = o;
  const ipucu = (poz, html, sinif = '') => `<div class="kd-rehberci kd-ipucu kd-gir ${sinif}">${o.maskot(poz, { boy: 104 }) || `<span class="kd-ipucu__yedek" aria-hidden="true">${ikon('parilti', 40)}</span>`}<p class="kd-baloncuk"><b>Pütür'ün notu:</b> ${html}</p></div>`;
  const mevsimIllus = (mv, alt = '', boy = 360) => (illusVar(`mevsim-${mv.key}`) ? o.illus(`mevsim-${mv.key}`, alt, { boy }) : o.sahne('meyve-sepeti', alt));
  const bos = (illusKey, baslik, metin) => `<div class="kd-mbos">${illusVar(illusKey) ? o.illus(illusKey, '', { boy: 200, sinif: 'kd-mbos__illus' }) : o.sahne('bos-kase')}<div class="kd-mbos__metin">${o.maskot('uyku', { boy: 72, sinif: 'kd-mbos__maskot' })}<p><b>${baslik}</b> ${metin}</p></div></div>`;
  const m = o.veri.mevsim || {};
  const aylar = (m.aylar || []).filter((a) => a && a.ay >= 1 && a.ay <= 12).sort((a, b) => a.ay - b.ay);
  const tarifler = (o.veri.tarifler.tarifler || []).filter((t) => t.slug && t.ad);
  const kesim = Array.isArray(o.veri.kesim) ? o.veri.kesim : [];
  const kesimBul = (u) => kesim.find((k) => k.slug === u.ikon || k.ikon === u.ikon || normal(k.ad) === normal(u.ad));

  /* ---------- Tarif eşleştirme: ürün adı tarif adında ya da malzemelerinde (kelime başında) ---------- */
  const tarifMetni = new Map(tarifler.map((t) => [t.slug, ' ' + normal([t.ad, ...(t.malzemeler || []).map((x) => (typeof x === 'string' ? x : x?.ad || ''))].join(' '))]));
  function kokler(ad) {
    const n = normal(ad);
    const k = [n];
    if (!n.includes(' ') && n.length >= 6) k.push(n.slice(0, -2)); // balkabağı → balkaba(klı), ıspanak → ıspan(aklı)
    return k;
  }
  function ayTarifleri(a) {
    const urunler = [a.kahraman, ...(a.urunler || [])].filter((u) => u && u.ad);
    const skor = new Map();
    for (const t of tarifler) {
      const metin = tarifMetni.get(t.slug);
      let s = 0;
      for (const u of urunler) if (kokler(u.ad).some((k) => metin.includes(' ' + k))) s += u === a.kahraman ? 3 : 1;
      if (s) skor.set(t.slug, s);
    }
    return tarifler.filter((t) => skor.has(t.slug)).sort((x, y) => skor.get(y.slug) - skor.get(x.slug) || x.yas - y.yas);
  }

  /* ---------- Bulunabilirlik çubuğu (12 ay) ---------- */
  function yilCubugu(ikonAd, ad) {
    const durumlar = AY_AD.map((_, i) => {
      const a = aylar.find((x) => x.ay === i + 1);
      const u = a && (a.urunler || []).find((x) => x.ikon === ikonAd);
      return u ? (u.durum === 'zirvede' ? 'zirvede' : 'var') : a && a.kahraman?.ikon === ikonAd ? 'zirvede' : '';
    });
    const bulundugu = AY_AD.filter((_, i) => durumlar[i]);
    return `<div class="kd-myil">
     <small>Tezgâhta olduğu aylar</small>
     <ol aria-hidden="true">${durumlar.map((d, i) => `<li${d ? ` data-d="${d}"` : ''}><span>${AY_KISA[i][0]}</span></li>`).join('')}</ol>
     <p class="kd-gizli">${esc(ad)}: ${bulundugu.length ? bulundugu.join(', ') : 'bilgi yok'}.</p>
     <span class="kd-myil__lejant" aria-hidden="true"><i data-d="zirvede"></i> Zirvede <i data-d="var"></i> Mevsiminde</span>
    </div>`;
  }

  /* ---------- "Bebeğinize" metnini yaş satırlarına ayır ---------- */
  function bebekIcin(metin) {
    if (!metin) return '';
    if (typeof metin === 'object') metin = Object.entries(metin).map(([k, v]) => `${k}: ${v}`).join(' ');
    const re = /(\d+\s*[–-]\s*\d+\s*(?:ay|yaş)|\d+\s*ay\s*(?:ve sonrası|\+))\s*:\s*/g;
    const parcalar = metin.split(re);
    if (parcalar.length < 3) return `<p>${esc(metin)}</p>`;
    const giris = parcalar[0].trim();
    const satirlar = [];
    // Aşama adları kesim aşamalarıyla aynı: "6–8 ay · 9–12 ay · 12+ ay"
    const asama = (e) => { const t = e.replace(/\s+/g, ' ').replace(/-/g, '–'); return /^(1\s*–\s*3 yaş|12 ay ve sonrası|12 ay\s*\+)$/i.test(t) ? '12+ ay' : t; };
    for (let i = 1; i < parcalar.length; i += 2) satirlar.push([asama(parcalar[i]), (parcalar[i + 1] || '').trim()]);
    const renk = (e) => (/^6/.test(e) ? 'seftali' : /^9/.test(e) ? 'mint' : 'sari');
    return `${giris ? `<p class="kd-mbebek__giris">${esc(giris)}</p>` : ''}<ul class="kd-mbebek">${satirlar.map(([e, t]) => `<li><span class="kd-mbebek__yas" data-renk="${renk(e)}">${esc(e)}</span><span>${esc(t.replace(/[.;]\s*$/, ''))}</span></li>`).join('')}</ul>`;
  }

  /* ---------- Ürün kartı ---------- */
  function urunKart(u, n) {
    const d = DURUM[u.durum];
    const rozet = o.YASLAR.includes(u.minAy) ? o.yasRozet(u.minAy, 's') : u.minAy ? `<span class="kd-etiket">+${u.minAy} Ay</span>` : '<span class="kd-etiket">Yaş: uzman kararı</span>';
    const k = kesimBul(u);
    return `<li class="kd-murun" data-tur="${esc(u.tur || '')}" style="--kd-gecikme:${Math.min(n, 10) * 30}ms">
     <span class="kd-murun__gorsel">${urun(u.ikon, 72, '')}</span>
     <h4>${esc(u.ad)}</h4>
     <small class="kd-murun__tur">${esc(TUR_AD[u.tur] || u.tur || '')}</small>
     <div class="kd-murun__rozet">${rozet}${d ? `<span class="kd-mdurum" data-durum="${u.durum}"><i class="fa-solid ${d.ikon}" aria-hidden="true"></i>${d.ad}</span>` : ''}</div>
     ${u.uzmanNotu ? `<details class="kd-murun__not"><summary><i class="fa-solid fa-user-doctor" aria-hidden="true"></i> Uzman notu</summary><p>${esc(u.uzmanNotu)}</p></details>` : ''}
     ${k ? `<a class="kd-murun__kesim" href="kids-guvenli-kesim.html#${esc(k.slug)}">${ikon('bicak-tahta', 18)} Nasıl kesilir?</a>` : ''}
    </li>`;
  }

  /* ---------- Ay paneli ---------- */
  function panel(a) {
    const mv = MEVSIM(a.ay);
    const kh = a.kahraman || {};
    const urunler = (a.urunler || []).filter((u) => u && u.ad);
    const turler = [...new Set(urunler.map((u) => u.tur).filter(Boolean))];
    const tarifListe = ayTarifleri(a);
    const zirvede = urunler.filter((u) => u.durum === 'zirvede').length;
    const kart = (baslik, ikonAd, govde) => (govde ? `<div class="kd-mbilgi"><h4>${ikon(ikonAd, 22)}${baslik}</h4>${govde}</div>` : '');
    return `<section class="kd-mpanel" id="ay-${a.ay}" role="tabpanel" aria-labelledby="ay-sekme-${a.ay}" data-ay="${a.ay}" data-renk="${mv.renk}" tabindex="-1">
  <header class="kd-mpanel__bas">
   <div class="kd-mpanel__bas-metin"><span class="kd-mpanel__mevsim">${esc(mv.ad)}</span><h2>${esc(a.ad || AY_AD[a.ay - 1])} tezgâhı</h2>
   <p>${urunler.length} ürün${zirvede ? ` · ${zirvede} tanesi zirvede` : ''}${turler.length ? ` · ${turler.map((t) => TUR_AD[t] || t).join(', ')}` : ''}</p></div>
   <span class="kd-mpanel__illus">${mevsimIllus(mv, `${mv.ad} mevsiminin ürünleriyle sevimli bir pazar tezgâhı illüstrasyonu`)}</span>
  </header>
  ${kh.ad ? `<article class="kd-mkahraman" aria-labelledby="kh-${a.ay}">
   <div class="kd-mkahraman__gorsel">
    <span class="kd-mkahraman__rozet">${ikon('parilti', 20)} ${esc(a.ad || AY_AD[a.ay - 1])} ayının kahramanı</span>
    <span class="kd-mkahraman__daire">${urun(kh.ikon, 200, kh.ad)}</span>
   </div>
   <div class="kd-mkahraman__metin">
    <h3 id="kh-${a.ay}">${esc(kh.ad)}</h3>
    ${kh.neden ? `<p class="kd-mkahraman__neden">${esc(kh.neden)}</p>` : ''}
    ${yilCubugu(kh.ikon, kh.ad)}
    <div class="kd-mbilgiler">
     ${kart('Nasıl seçilir?', 'sepet', kh.secim ? `<p>${esc(kh.secim)}</p>` : '')}
     ${kart('Saklama', 'kase', kh.saklama ? `<p>${esc(kh.saklama)}</p>` : '')}
    </div>
    ${kh.bebekIcin ? `<div class="kd-mbilgi kd-mbilgi--bebek"><h4>${ikon('kasik', 22)}Bebeğinize nasıl sunulur?</h4>${bebekIcin(kh.bebekIcin)}</div>` : ''}
   </div>
  </article>` : ''}
  ${urunler.length ? `<div class="kd-mtezgah">
   <h3 class="kd-mtezgah__bas">${esc(a.ad || AY_AD[a.ay - 1])} tezgâhında <span>${urunler.length}</span></h3>
   <ul class="kd-mtezgah__liste">${urunler.map(urunKart).join('')}</ul>
   <div class="kd-mtezgah__bos" hidden>${bos('bos-arama', 'Bu ay bu türde ürün yok.', '<button type="button" class="kd-bag kd-mtur-sifirla">Tümünü göster</button>')}</div>
  </div>` : ''}
  <div class="kd-mtarif">
   <div class="kd-mtarif__bas"><h3>${esc(a.ad || AY_AD[a.ay - 1])} ürünleriyle tarifler</h3>${tarifListe.length ? `<a class="kd-bag" href="kids-tarifler.html">Tüm tarifler</a>` : ''}</div>
   ${tarifListe.length
     ? o.tarifSeridi(tarifListe.slice(0, 4), { sinif: 'kd-mtarif__izgara', gir: false, dortlu: false })
     : `<div class="kd-mtarif__yok">${bos('bos-durum', 'Bu ayın ürünleriyle eşleşen tarif henüz yok.', '<a class="kd-bag" href="kids-tarifler.html">Tüm Kids tariflerine göz atın</a>')}</div>`}
  </div>
 </section>`;
  }

  /* ---------- Ay seçici ---------- */
  const seciciSekme = aylar.map((a) => {
    const mv = MEVSIM(a.ay);
    return `<button type="button" role="tab" class="kd-may__ay" id="ay-sekme-${a.ay}" aria-controls="ay-${a.ay}" aria-selected="false" tabindex="-1" data-ay="${a.ay}" data-renk="${mv.renk}">
     <span class="kd-may__ikon">${urun(a.kahraman?.ikon, 34, '')}</span>
     <b>${esc(a.ad || AY_AD[a.ay - 1])}</b>
     <small class="kd-may__bu">Bu ay</small>
    </button>`;
  }).join('');

  const turSecenek = [...new Set(aylar.flatMap((a) => (a.urunler || []).map((u) => u.tur)).filter(Boolean))];

  // Yıl boyu: dört mevsim kartı (illüstrasyon + o mevsimin üç ayı)
  const MEVSIM_SIRA = [[12, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]];
  const ayLi = (a) => `<li data-renk="${MEVSIM(a.ay).renk}"><a href="#ay-${a.ay}" data-ay-git="${a.ay}"><span>${urun(a.kahraman?.ikon, 44, '')}</span><small>${esc(a.ad)}</small><b>${esc(a.kahraman?.ad || '')}</b></a></li>`;
  const mevsimKartlari = MEVSIM_SIRA.map((grup, n) => {
    const mv = MEVSIM(grup[0]);
    const ay = grup.map((x) => aylar.find((y) => y.ay === x)).filter(Boolean);
    if (!ay.length) return '';
    return `<article class="kd-mmevsim kd-gir" data-renk="${mv.renk}" style="--kd-gecikme:${n * 80}ms">
     <div class="kd-mmevsim__resim">${mevsimIllus(mv, '', 420)}</div>
     <h3>${esc(mv.ad)}</h3>
     <ol class="kd-myilserit">${ay.map(ayLi).join('')}</ol>
    </article>`;
  }).join('');

  const heroVideo = o.video('mevsim', 'Mevsim meyve ve sebzeleriyle dolu bir pazar sepetinin sessiz döngü videosu');
  const heroGorsel = heroVideo || (illusVar('hero-mevsim') ? o.illus('hero-mevsim', 'Mevsim meyve ve sebzeleriyle dolu sevimli bir pazar sepeti illüstrasyonu', { boy: 640 }) : '');
  const heroSag = heroGorsel
    ? `<div class="kd-mhero kd-mhero--medya"><div class="kd-mhero__cerceve">${heroGorsel}</div>${['cilek', 'havuc', 'karpuz', 'brokoli'].map((u, i) => `<span class="kd-mhero__u kd-mhero__u--${i + 1} kd-yuz" style="--kd-gecikme:${i * 0.6}s">${urun(u, 64, '')}</span>`).join('')}</div>`
    : `<div class="kd-mhero">${o.sahne('meyve-sepeti', '')}${['cilek', 'havuc', 'elma', 'karpuz', 'brokoli'].map((u, i) => `<span class="kd-mhero__u kd-mhero__u--${i + 1} kd-yuz" style="--kd-gecikme:${i * 0.6}s">${urun(u, 64, '')}</span>`).join('')}</div>`;

  const tezgahBolum = (z) => `<section class="kd-bolum kd-mevsim${z}" id="tezgah" aria-label="Aylara göre tezgâh">
 <div class="wrap">
  <div class="kd-may">
   <button type="button" class="kd-may__ok" data-yon="-1" aria-label="Önceki ay"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
   <div class="kd-may__serit" role="tablist" aria-label="Aylar">${seciciSekme}</div>
   <button type="button" class="kd-may__ok" data-yon="1" aria-label="Sonraki ay"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
  </div>
  <div class="kd-marac">
   <div class="kd-serit kd-mtur" role="group" aria-label="Ürün türü">
    <button type="button" class="kd-chip" data-tur="" aria-pressed="true">Tümü</button>
    ${turSecenek.map((t) => `<button type="button" class="kd-chip" data-tur="${esc(t)}" aria-pressed="false">${esc(TUR_AD[t] || t)}</button>`).join('')}
   </div>
   <p class="kd-mnot"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Türkiye geneli; bölgeye göre değişir.</p>
  </div>
  ${o.ornek('Yaş rozetleri ve sunum önerileri prototip için hazırlanmış örneklerdir; çocuk doktoru / çocuk diyetisyeni onayından geçmeden yayına alınmaz.')}
  <div class="kd-mpaneller">${aylar.map(panel).join('\n')}</div>
 </div>
</section>`;

  const yilBolum = (z) => `<section class="kd-bolum${z}" id="yil" aria-labelledby="yil-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Yıl boyu', ikonAd: 'takvim', renk: 'sari', baslik: '<span id="yil-bas">On iki ayın kahramanları</span>', alt: 'Bir aya dokunun, o ayın tezgâhı açılsın.', sag: ipucu('takvim', 'Her mevsimin üç kahramanı var. Bir aya dokunun, tezgâh o aya geçsin.', 'kd-ipucu--sag') })}
  <div class="kd-mmevsimler">${mevsimKartlari}</div>
 </div>
</section>`;

  const nedenBolum = (z) => `<section class="kd-bolum${z}" aria-labelledby="neden-bas">
 <div class="wrap kd-mneden">
  <div>
   ${o.bolumBasi({ ust: 'Neden mevsiminde?', ikonAd: 'kalp', renk: 'mint', baslik: '<span id="neden-bas">Lezzet, bütçe ve çeşitlilik</span>' })}
   <ul class="kd-mneden__liste">
    <li class="kd-gir">${ikon('parilti', 28)}<span><b>Daha lezzetli</b>Dalında olgunlaşan ürünün tadı ve kokusu belirgindir; bebekler yeni tatları böyle daha kolay sever.</span></li>
    <li class="kd-gir" style="--kd-gecikme:80ms">${ikon('sepet', 28)}<span><b>Daha ekonomik</b>Bol olduğu ayda ürün daha uygun fiyatlıdır.</span></li>
    <li class="kd-gir" style="--kd-gecikme:160ms">${ikon('tabak-bolmeli', 28)}<span><b>Daha çeşitli</b>Her ay farklı ürünler, tabağa doğal bir çeşitlilik getirir.</span></li>
   </ul>
  </div>
  <div class="kd-kutu kd-mdondurulmus" data-renk="mavi">
   <h3><i class="fa-regular fa-snowflake" aria-hidden="true"></i> Dondurulmuş da iyi bir alternatif</h3>
   <p>Mevsimi geçmiş bir ürünü dondurulmuş olarak almak da iyi bir seçimdir; besin değerini büyük ölçüde korur. Bebekler için dondurulmuş sebze ve meyveyi <b>pişirerek</b> kullanın.</p>
   ${m._not ? `<p class="kd-mdondurulmus__not">${esc(m._not.replace(/\s*ÖRNEK İÇERİK[^.]*\.?\s*$/i, ''))}</p>` : ''}
  </div>
 </div>
</section>`;

  const guvenBolum = (z) => `<section class="kd-bolum${z}"><div class="wrap kd-mguven">${o.onay()}${ipucu('sepet', 'Takvim yaklaşık bir rehberdir; ürünlerin bulunabilirliği bölgeye, rakıma ve yılın havasına göre değişir.', 'kd-ipucu--kompakt')}</div></section>`;

  const main = o.sayfa(`
${o.hero({
  renk: 'sari',
  kirinti: [['Tarifler', 'tarifler.html'], ['Dada Kids', 'kids.html'], ['Mevsimsel Takvim']],
  ust: { metin: 'Mevsimsel takvim', ikon: 'sepet' },
  baslik: 'Bu ay tezgâhta<br>ne var?',
  giris: 'Mevsiminde ürün daha lezzetli, daha ekonomik ve daha çeşitli. Her ay için tezgâh, ayın kahramanı, yaş rozetleri ve o ayın ürünleriyle Kids tarifleri.',
  eylemler: '<a class="kd-btn" href="#tezgah"><i class="fa-solid fa-basket-shopping" aria-hidden="true"></i> Bu ayın tezgâhı</a><a class="kd-btn kd-btn--hafif" href="#yil">Yıl boyu kahramanlar</a>',
  sag: heroSag,
})}
${ritim(o, [tezgahBolum, yilBolum, nedenBolum, guvenBolum], ['sari', 'mint'])}
`, 'mevsim');

  return [{
    dosya: 'kids-mevsim.html',
    baslik: 'Mevsimsel Takvim: bu ay tezgâhta ne var? | Dada Kids',
    aciklama: 'Ay ay meyve ve sebze takvimi: ayın kahramanı, yaş rozetleri, saklama ve seçme ipuçları, o ayın ürünleriyle bebek ve çocuk tarifleri.',
    aktif: 'mevsim',
    css: ['mevsim'],
    js: ['mevsim'],
    main,
  }];
}
