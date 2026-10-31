// Dada Kids — Dönemler: genel bakış + 5 evre sayfası (sahibi: sayfalar kolu)
// Veri: veri/evreler.json (+ besinler.json, kids-tarifler.json, rehber.json). Eksik alanlar sessizce atlanır.

const AY_ARALIGI = { 'hamilelik': null, '0-6-ay': [0, 5], '6-8-ay': [6, 8], '9-12-ay': [9, 11], '1-3-yas': [12, 36] };
const ILK_SUNUM_ANAHTARI = { '6-8-ay': '6', '9-12-ay': '9', '1-3-yas': '12' };
const TARIF_YASI = { '6-8-ay': 6, '9-12-ay': 9, '1-3-yas': 12 };

const dizi = (x) => (Array.isArray(x) ? x.filter((v) => v !== null && v !== undefined && v !== '') : x ? [x] : []);
const insanca = (s) => String(s).replace(/-/g, ' ').replace(/^./, (c) => c.toLocaleUpperCase('tr'));

export default async function donemler(o) {
  const { esc, EVRE, EVRE_SIRA, evreSayfasi, ikon } = o;
  const evreler = o.veri.evreler.evreler || [];
  const besinler = o.veri.besinler.besinler || [];
  const besinHarita = new Map(besinler.map((b) => [b.slug, b]));
  const tarifler = (o.veri.tarifler.tarifler || []).filter((t) => t.slug && t.ad);
  const rehber = Array.isArray(o.veri.rehber) ? o.veri.rehber : [];
  const kesimSluglari = new Set((Array.isArray(o.veri.kesim) ? o.veri.kesim : []).map((k) => k.slug));

  const v = (kod) => evreler.find((x) => x.kod === kod) || {};
  const rehberBul = (...anahtarlar) => rehber.find((r) => anahtarlar.some((a) => (r.slug || '').includes(a)));
  const rehberHref = (r) => (r ? `kids-rehber-${r.slug}.html` : 'kids-rehber.html');

  /* ---------- Ortak parçalar ---------- */
  const gunluk = (kod) => {
    const g = v(kod).gunluk || {};
    return { sut: g.sut || '', ekGida: g.ekGida || '', ogun: g.ogunSayisi || g.ogun || '' };
  };

  // Evre şeridi (zaman çizelgesi): 5 evre, aktif olan aria-current, önceki/sonraki okları
  function evreSeridi(aktif = null) {
    const i = EVRE_SIRA.indexOf(aktif);
    const onceki = i > 0 ? EVRE_SIRA[i - 1] : null;
    const sonraki = i >= 0 && i < EVRE_SIRA.length - 1 ? EVRE_SIRA[i + 1] : null;
    const ok = (kod, yon) => kod
      ? `<a class="kd-dserit__ok" href="${evreSayfasi(kod)}" aria-label="${yon === 'geri' ? 'Önceki evre' : 'Sonraki evre'}: ${esc(EVRE[kod].ad)}"><i class="fa-solid fa-chevron-${yon === 'geri' ? 'left' : 'right'}" aria-hidden="true"></i></a>`
      : `<span class="kd-dserit__ok" aria-hidden="true"><i class="fa-solid fa-chevron-${yon === 'geri' ? 'left' : 'right'}"></i></span>`;
    const ogeler = EVRE_SIRA.map((kod, n) => {
      const e = EVRE[kod];
      const simdi = kod === aktif;
      return `<li data-renk="${e.renk}"${simdi ? ' class="kd-dserit__simdi"' : ''}><a href="${evreSayfasi(kod)}"${simdi ? ' aria-current="page"' : ''}>
   <span class="kd-dserit__nokta">${ikon(e.ikon, 30)}</span>
   <span class="kd-dserit__sira">${n + 1}. evre</span>
   <b>${esc(e.ad)}</b>
   <small>${esc(v(kod).aralik || e.aralik)}</small>
  </a></li>`;
    }).join('');
    return `<nav class="kd-dserit${aktif ? ' kd-dserit--aktif' : ''}" aria-label="Evreler">
 <div class="wrap kd-dserit__ic">
  ${aktif ? ok(onceki, 'geri') : ''}
  <ol class="kd-dserit__liste">${ogeler}</ol>
  ${aktif ? ok(sonraki, 'ileri') : ''}
 </div>
</nav>`;
  }

  const liste = (ogeler, sinif = 'kd-dliste') => (ogeler.length ? `<ul class="${sinif}">${ogeler.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : '');

  /* ---------- Besin matrisi ---------- */
  function yasMetni(ay) {
    if (ay === null || ay === undefined || ay === '') return 'Yaş: uzman kararı';
    const n = Number(ay);
    if (!Number.isFinite(n)) return esc(ay);
    if (n <= 0) return 'Doğumdan itibaren';
    if (n > 12 && n % 12 === 0) return `${n / 12} yaşından itibaren`;
    return `${n}. aydan itibaren`;
  }
  function besinCoz(x) {
    if (x && typeof x === 'object') return { ad: x.ad || '', gerekce: x.neden || x.gerekce || '', minAy: x.minAy ?? x.yas ?? null, kesimSlug: x.kesimSlug || null, ilkSunum: null };
    const b = besinHarita.get(x);
    if (b) return b;
    return { ad: insanca(x), gerekce: '', minAy: undefined, kesimSlug: null };
  }
  function matrisGruplari(kod) {
    const e = v(kod);
    const al = (k) => dizi(e[k]).map(besinCoz).filter((b) => b.ad);
    let g = { uygun: al('uygun'), dikkat: al('dikkat'), henuz: al('henuz') };
    if (kod === '0-6-ay') {
      // Bu evrede katı besin yok: boş sütunlar yerine evrenin gerçeği yazılır (veri/evreler.json gunluk ile tutarlı)
      if (!g.uygun.length) g.uygun = [{ ad: 'Anne sütü ya da formül mama', gerekce: gunluk(kod).sut || 'Bu evrede bebeğinizin tek besini.', minAy: 0 }];
      if (!g.dikkat.length) g.dikkat = [{ ad: 'Ek gıdaya hazırlık', gerekce: 'Hazır olma işaretleri genellikle 6. ay civarında görülür; ek gıdaya 4. aydan önce başlanmaz. Erken doğan bebeklerde zamanlamayı hekiminizle belirleyin.', minAy: 6 }];
    }
    if (g.uygun.length + g.dikkat.length + g.henuz.length) return g;
    const ar = AY_ARALIGI[kod];
    if (!ar) return g;
    g = { uygun: [], dikkat: [], henuz: [] };
    for (const b of besinler.filter((x) => !x.hamilelik)) {
      if (b.minAy === null || b.minAy === undefined) g.dikkat.push(b);
      else if (b.minAy > ar[1]) g.henuz.push(b);
      else if (b.durum === 'hazirlikla' || b.bogulmaRiski === 'yuksek') g.dikkat.push(b);
      else g.uygun.push(b);
    }
    return g;
  }
  function matrisOge(b0, kod, tur) {
    // Hamilelik: bebek odaklı gerekçe/yaş/kesim gösterilmez; hamilelikNotu ya da hamileliğe özel kaydın gerekçesi kullanılır
    const b = kod === 'hamilelik' ? { ad: b0.ad, gerekce: b0.hamilelik ? b0.gerekce : (b0.hamilelikNotu || ''), minAy: undefined, kesimSlug: null } : b0;
    const anahtar = ILK_SUNUM_ANAHTARI[kod];
    const nasil = tur !== 'henuz' && anahtar && b.ilkSunum && b.ilkSunum[anahtar] ? b.ilkSunum[anahtar] : '';
    const kesim = b.kesimSlug && kesimSluglari.has(b.kesimSlug) ? `<a class="kd-bag kd-dmatris__kesim" href="kids-guvenli-kesim.html#${esc(b.kesimSlug)}">Nasıl kesilir?</a>` : '';
    const yas = b.minAy === undefined ? '' : `<span class="kd-dmatris__yas"><i class="fa-regular fa-calendar" aria-hidden="true"></i>${yasMetni(b.minAy)}</span>`;
    return `<li>
     <b>${esc(b.ad)}</b>
     ${b.gerekce ? `<p>${esc(b.gerekce)}</p>` : ''}
     ${nasil ? `<p class="kd-dmatris__nasil"><i class="fa-solid fa-utensils" aria-hidden="true"></i><span><span class="kd-gizli">Bu evrede sunum: </span>${esc(nasil)}</span></p>` : ''}
     ${yas || kesim ? `<div class="kd-dmatris__alt">${yas}${kesim}</div>` : ''}
    </li>`;
  }
  function matris(kod) {
    const g = matrisGruplari(kod);
    if (!g.uygun.length && !g.dikkat.length && !g.henuz.length) return '';
    const sutun = (tur, baslik, ikonSinif, aciklama) => `<section class="kd-dmatris__sutun kd-gir" data-durum="${tur}" aria-labelledby="m-${tur}">
    <header><span class="kd-dmatris__ikon"><i class="fa-solid ${ikonSinif}" aria-hidden="true"></i></span><div><h3 id="m-${tur}">${baslik}</h3><small>${aciklama}</small></div><span class="kd-dmatris__sayi">${g[tur].length}</span></header>
    ${g[tur].length ? `<ul>${g[tur].map((b) => matrisOge(b, kod, tur)).join('')}</ul>` : '<p class="kd-dmatris__bos">Bu evrede bu grupta besin yok.</p>'}
   </section>`;
    const hamile = kod === 'hamilelik';
    return `<section class="kd-bolum" id="besinler" aria-labelledby="besin-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Besin matrisi', ikonAd: 'liste', renk: EVRE[kod].renk, baslik: `<span id="besin-bas">${hamile ? 'Bu dönemde besinler' : 'Bu evrede hangi besin?'}</span>`, alt: hamile ? 'Rahatça tüketilenler, hazırlığına dikkat edilenler ve bu dönemde kaçınılanlar.' : 'Her besinde bir satır gerekçe ve açılış yaşı. Renk tek başına anlam taşımaz: ikon ve başlık her sütunda yazılı.' })}
  ${o.ornek()}
  <div class="kd-dmatris">
   ${sutun('uygun', hamile ? 'Rahatça' : 'Uygun', 'fa-circle-check', hamile ? 'Dengeli beslenmenin parçası' : 'Bu evrede verilebilir')}
   ${sutun('dikkat', 'Hazırlığa dikkat', 'fa-triangle-exclamation', hamile ? 'Pişirme ve hijyen önemli' : 'Uygun, ama hazırlık şekli kritik')}
   ${sutun('henuz', hamile ? 'Kaçınılır' : 'Henüz erken', hamile ? 'fa-ban' : 'fa-hourglass-half', hamile ? 'Bu dönemde önerilmez' : 'Açılış yaşı gelmedi')}
  </div>
 </div>
</section>`;
  }

  /* ---------- Günlük bir bakışta ---------- */
  function hapSatiri(kod) {
    const g = gunluk(kod);
    const hap = (ikonAd, etiket, deger) => (deger ? `<li class="kd-dhap kd-gir"><span class="kd-dhap__ikon">${ikon(ikonAd, 30)}</span><span><small>${etiket}</small><b>${esc(deger)}</b></span></li>` : '');
    const ogeler = [hap('biberon', kod === 'hamilelik' ? 'Süt & emzirme' : 'Süt', g.sut), hap('kasik', 'Ek gıda', g.ekGida), hap('takvim', 'Öğün', g.ogun)].join('');
    if (!ogeler) return '';
    return `<section class="kd-bolum kd-bolum--sikisik" aria-labelledby="bakis-bas" data-renk="${EVRE[kod].renk}">
 <div class="wrap">
  <h2 class="kd-dkucuk-bas" id="bakis-bas">Günlük bir bakışta</h2>
  <ul class="kd-dhaplar">${ogeler}</ul>
 </div>
</section>`;
  }

  /* ---------- Beslenme + kıvam ---------- */
  function beslenmeBolumu(kod) {
    const e = v(kod);
    const beslenme = dizi(e.beslenme);
    const kivam = dizi(e.kivamDikkat).length ? dizi(e.kivamDikkat) : dizi(e.kivam);
    if (!beslenme.length && !kivam.length && !e.ozet) return '';
    const hamile = kod === 'hamilelik';
    return `<section class="kd-bolum" aria-labelledby="beslenme-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Bu evrede', ikonAd: EVRE[kod].ikon, renk: EVRE[kod].renk, baslik: `<span id="beslenme-bas">Beslenme ve ${hamile ? 'dikkat edilecekler' : 'kıvam'}</span>` })}
  ${o.ornek()}
  <div class="kd-dikili">
   ${beslenme.length ? `<article class="kd-dpanel kd-gir"><h3><span class="kd-dpanel__ikon">${ikon('kase', 26)}</span>Beslenme</h3>${liste(beslenme)}</article>` : ''}
   ${kivam.length ? `<article class="kd-dpanel kd-dpanel--dikkat kd-gir"><h3><span class="kd-dpanel__ikon">${ikon(hamile ? 'kalp' : 'kasik', 26)}</span>${hamile ? 'Dikkat' : 'Kıvam & dikkat'}</h3>${liste(kivam)}</article>` : ''}
  </div>
 </div>
</section>`;
  }

  /* ---------- Odak besinler ---------- */
  function odakBolumu(kod) {
    const e = v(kod);
    const odak = dizi(e.odakBesinler).filter((x) => x && (x.ad || typeof x === 'string'));
    if (!odak.length) {
      if (!e.odak) return '';
      return `<section class="kd-bolum kd-bolum--sikisik"><div class="wrap"><div class="kd-kutu kd-gir" data-renk="${EVRE[kod].renk}"><h3>${ikon('parilti', 22)} Bu evrenin odağı</h3><p>${esc(e.odak)}</p></div></div></section>`;
    }
    const kart = (x, n) => {
      const ad = typeof x === 'string' ? x : x.ad;
      const ornekler = typeof x === 'string' ? [] : dizi(x.ornekler);
      return `<article class="kd-kart kd-dodak kd-gir" style="--kd-gecikme:${n * 60}ms">
     <span class="kd-dodak__no" aria-hidden="true">${String(n + 1).padStart(2, '0')}</span>
     <h3>${esc(ad)}</h3>
     ${x.neden ? `<p>${esc(x.neden)}</p>` : ''}
     ${ornekler.length ? `<div class="kd-dodak__ornek"><small>Nerede bulunur?</small><ul>${ornekler.map((s) => `<li class="kd-etiket">${esc(s)}</li>`).join('')}</ul></div>` : ''}
    </article>`;
    };
    return `<section class="kd-bolum kd-bolum--beyaz" aria-labelledby="odak-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Odak besinler', ikonAd: 'parilti', renk: EVRE[kod].renk, baslik: '<span id="odak-bas">Bu evrede öne çıkanlar</span>', alt: e.odak ? esc(e.odak) : '' })}
  <div class="kd-izgara kd-dodaklar" data-renk="${EVRE[kod].renk}">${odak.map(kart).join('')}</div>
 </div>
</section>`;
  }

  /* ---------- Hamilelik alt bölümleri (sekmeler; JS yoksa kartlar) ---------- */
  function altBolumler(kod) {
    const ab = dizi(v(kod).altBolumler).filter((x) => x && x.ad);
    if (!ab.length) return '';
    const sekmeler = ab.map((x, n) => `<button type="button" role="tab" class="kd-chip" id="sekme-${n}" aria-controls="panel-${n}" aria-selected="${n === 0}"${n ? ' tabindex="-1"' : ''}>${esc(x.ad)}</button>`).join('');
    const paneller = ab.map((x, n) => {
      const metin = dizi(x.metin).map((p) => `<p>${esc(p)}</p>`).join('');
      const maddeler = liste(dizi(x.maddeler));
      return `<section class="kd-dsekme__panel" role="tabpanel" id="panel-${n}" aria-labelledby="sekme-${n}" tabindex="0"${n ? ' data-kd-kapali' : ''}><h3>${esc(x.ad)}</h3>${metin}${maddeler}</section>`;
    }).join('');
    return `<section class="kd-bolum" aria-labelledby="alt-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Dönem dönem', ikonAd: 'takvim', renk: EVRE[kod].renk, baslik: '<span id="alt-bas">Trimesterler ve lohusalık</span>', alt: 'Her dönemin kendine özgü ihtiyaçları için kısa notlar.' })}
  <div class="kd-dsekme" data-renk="${EVRE[kod].renk}" data-kd-sekme>
   <div class="kd-dsekme__liste kd-serit" role="tablist" aria-label="Dönemler">${sekmeler}</div>
   <div class="kd-dsekme__paneller">${paneller}</div>
  </div>
 </div>
</section>`;
  }

  /* ---------- Tarifler / alternatif ---------- */
  function yardimKart(href, ikonAd, baslik, metin, renk) {
    return `<a class="kd-kart kd-modul kd-gir" href="${href}" data-renk="${renk}"><span class="kd-modul__ikon">${ikon(ikonAd, 40)}</span><h3>${esc(baslik)}</h3><p>${esc(metin)}</p><span class="kd-kart__alt">Aç <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>`;
  }
  function tarifBolumu(kod) {
    const e = EVRE[kod];
    if (kod === 'hamilelik' || kod === '0-6-ay') {
      const ekGida = rehberBul('ek-gida', 'ekgida', 'gecis');
      const blw = rehberBul('blw');
      const alerjen = rehberBul('alerjen');
      const ogurme = rehberBul('ogurme', 'bogulma');
      const kartlar = kod === '0-6-ay'
        ? [
          yardimKart('kids-arac-hazir-mi.html', 'liste', 'Bebeğim ek gıdaya hazır mı?', 'Oturma, baş kontrolü, ilgi: hazırlık belirtilerini adım adım işaretleyin.', 'mint'),
          yardimKart(rehberHref(ekGida), 'kitap', ekGida?.baslik || 'Ek gıdaya geçiş rehberi', ekGida?.ozet || 'İlk kaşıktan önce bilmeniz gerekenler.', 'seftali'),
          yardimKart(rehberHref(ogurme || blw), 'kalp', ogurme?.baslik || blw?.baslik || 'Öğürme mi, boğulma mı?', ogurme?.ozet || blw?.ozet || 'Farkı önceden öğrenmek ilk haftaları rahatlatır.', 'pembe'),
          yardimKart(evreSayfasi('6-8-ay'), 'kasik', 'Sıradaki evre: 6–8 ay', 'İlk tatlar, ilk tarifler ve kıvam geçişleri.', 'seftali'),
        ]
        : [
          yardimKart(rehberHref(alerjen), 'kitap', alerjen?.baslik || 'Alerjen tanıtımı', alerjen?.ozet || 'Bebeğinizle ilk alerjen tanışmasına önceden hazırlanın.', 'pembe'),
          yardimKart(rehberHref(ekGida), 'kase', ekGida?.baslik || 'Ek gıdaya geçiş', ekGida?.ozet || 'Altıncı aya geldiğinizde sizi neler bekliyor?', 'seftali'),
          yardimKart(evreSayfasi('0-6-ay'), 'biberon', 'Sıradaki evre: 0–6 ay', 'Anne sütü, formül mama ve hazırlık belirtileri.', 'mavi'),
          yardimKart('kids-araclar.html', 'arac', 'Araçlar', 'Hazır mı listesi, alerjen takipçisi, öğün planlayıcı ve persentil.', 'mint'),
        ];
      return `<section class="kd-bolum kd-bolum--beyaz" aria-labelledby="yardim-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: kod === '0-6-ay' ? 'Tarif yerine' : 'Bu dönemde işinize yarar', ikonAd: 'parilti', renk: e.renk, baslik: `<span id="yardim-bas">${kod === '0-6-ay' ? 'İlk kaşığa hazırlık' : 'Bebeğinize hazırlanırken'}</span>`, alt: kod === '0-6-ay' ? 'Bu evrede tarif yok: bebeğinizin tek besini anne sütü ya da formül mama. Ek gıdaya geçişe hazırlanmak için:' : 'Hamilelik tarifleri hazırlanıyor; şimdilik bu rehberler ve araçlar yanınızda.' })}
  <div class="kd-izgara">${kartlar.join('')}</div>
 </div>
</section>`;
    }
    const liste = tarifler.filter((t) => t.evre === kod);
    if (!liste.length) return '';
    const yas = TARIF_YASI[kod];
    return `<section class="kd-bolum kd-bolum--beyaz" aria-labelledby="tarif-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Bu evreye özel', ikonAd: 'kase', renk: e.renk, baslik: `<span id="tarif-bas">${esc(e.kisa)} tarifleri</span>`, alt: `${liste.length} tarif · kıvamı ve alerjenleri kartın üzerinde.`, sag: `<a class="kd-btn kd-btn--hafif" href="kids-tarifler.html?yas=${yas}">Tümünü gör <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>` })}
  <div class="kd-izgara kd-kaydir-mobil">${liste.slice(0, 8).map((t, n) => o.tarifKart(t, { sira: n })).join('')}</div>
 </div>
</section>`;
  }

  /* ---------- SSS ---------- */
  function sss(kod) {
    const s = dizi(v(kod).sss).filter((x) => x && x.s && x.c);
    if (!s.length) return '';
    return `<section class="kd-bolum" aria-labelledby="sss-bas">
 <div class="wrap kd-dsss">
  ${o.bolumBasi({ ust: 'Sık sorulanlar', ikonAd: 'kitap', renk: EVRE[kod].renk, baslik: '<span id="sss-bas">Aklınıza takılanlar</span>' })}
  ${o.ornek()}
  <div class="kd-dsss__liste" data-renk="${EVRE[kod].renk}">
   ${s.map((x) => `<details class="kd-dsss__oge"><summary><span>${esc(x.s)}</span><i class="fa-solid fa-plus" aria-hidden="true"></i></summary><div>${dizi(x.c).map((p) => `<p>${esc(p)}</p>`).join('')}</div></details>`).join('')}
  </div>
 </div>
</section>`;
  }

  /* ---------- Sonraki evre ---------- */
  function sonrakiEvre(kod) {
    const i = EVRE_SIRA.indexOf(kod);
    const onceki = EVRE_SIRA[i - 1];
    const sonraki = EVRE_SIRA[i + 1];
    const kart = (k, yon) => {
      const e = EVRE[k];
      return `<a class="kd-dsonraki__kart kd-dsonraki__kart--${yon} kd-gir" href="${evreSayfasi(k)}" data-renk="${e.renk}">
   <span class="kd-dsonraki__ikon">${ikon(e.ikon, 44)}</span>
   <span><small>${yon === 'ileri' ? 'Sıradaki evre' : 'Önceki evre'}</small><b>${esc(e.ad)}</b><span>${esc(v(k).slogan || v(k).aralik || e.aralik)}</span></span>
   <i class="fa-solid fa-arrow-${yon === 'ileri' ? 'right' : 'left'}" aria-hidden="true"></i>
  </a>`;
    };
    return `<section class="kd-bolum" aria-label="Evreler arasında gezinin">
 <div class="wrap">
  <div class="kd-dsonraki${onceki ? '' : ' kd-dsonraki--tek'}">
   ${onceki ? kart(onceki, 'geri') : ''}
   ${sonraki ? kart(sonraki, 'ileri') : `<a class="kd-dsonraki__kart kd-dsonraki__kart--ileri kd-gir" href="kids-donemler.html" data-renk="mavi"><span class="kd-dsonraki__ikon">${ikon('takvim', 44)}</span><span><small>Yolculuğun tamamı</small><b>Tüm evrelere dönün</b><span>Hamilelikten 3 yaşa beş evre</span></span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>`}
  </div>
 </div>
</section>`;
  }

  const guven = () => `<section class="kd-bolum kd-bolum--sikisik"><div class="wrap kd-dguven">${o.onay()}<p class="kd-ikincil">Bu sayfadaki bilgiler DSÖ, NHS ve AAP gibi ana akım rehberlerin uzlaştığı genel ilkeleri özetler; bebeğinize özel bir durum varsa çocuk doktorunuza danışın.</p></div></section>`;

  /* =====================================================================
     Genel bakış
     ===================================================================== */
  function kolaj() {
    const ogeler = EVRE_SIRA.map((kod, n) => `<a class="kd-dkolaj__oge" href="${evreSayfasi(kod)}" data-renk="${EVRE[kod].renk}" style="--kd-gecikme:${n * 80}ms">${o.foto(`varlik/kids/gorsel/evre-${kod}.webp`, EVRE[kod].ad, { gen: 800, yuk: 800, oncelik: n < 2 })}<span>${esc(EVRE[kod].kisa)}</span></a>`).join('');
    return `<div class="kd-dkolaj">${ogeler}</div>`;
  }

  function karsilastirma() {
    const satirlar = EVRE_SIRA.map((kod) => {
      const e = EVRE[kod];
      const g = gunluk(kod);
      const h = (x) => (x ? esc(x) : '<span class="kd-ikincil">—</span>');
      return `<tr data-renk="${e.renk}">
     <th scope="row"><a href="${evreSayfasi(kod)}"><span class="kd-dtablo__ikon">${ikon(e.ikon, 28)}</span><span><b>${esc(e.ad)}</b><small>${esc(v(kod).aralik || e.aralik)}</small></span></a></th>
     <td data-baslik="Süt">${h(g.sut)}</td>
     <td data-baslik="Ek gıda">${h(g.ekGida)}</td>
     <td data-baslik="Öğün">${h(g.ogun)}</td>
    </tr>`;
    }).join('');
    return `<section class="kd-bolum kd-bolum--beyaz" aria-labelledby="kars-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Karşılaştırın', ikonAd: 'liste', renk: 'mavi', baslik: '<span id="kars-bas">Günlük bir bakışta: evre evre</span>', alt: 'Süt, ek gıda ve öğün dengesinin beş evrede nasıl değiştiği tek tabloda.' })}
  ${o.ornek()}
  <div class="kd-dtablo-kap">
   <table class="kd-dtablo">
    <caption class="kd-gizli">Evrelere göre süt, ek gıda ve öğün dengesi</caption>
    <thead><tr><th scope="col">Evre</th><th scope="col">${ikon('biberon', 22)} Süt</th><th scope="col">${ikon('kasik', 22)} Ek gıda</th><th scope="col">${ikon('takvim', 22)} Öğün</th></tr></thead>
    <tbody>${satirlar}</tbody>
   </table>
  </div>
 </div>
</section>`;
  }

  function kivamYolculugu() {
    const adim = [
      { kod: '0-6-ay', svg: '', baslik: 'Yalnız süt', metin: 'Anne sütü ya da formül mama' },
      { kod: '6-8-ay', svg: 'puruzsuz', baslik: 'Pürüzsüzden ezilmişe', metin: 'Hızla çatal kıvamına ve yumuşak parmak gıdalara' },
      { kod: '9-12-ay', svg: 'parmak', baslik: 'Pütürlü & parmak gıda', metin: 'Küçük yumuşak parçalar, kıskaç tutuşu' },
      { kod: '1-3-yas', svg: 'aile', baslik: 'Aile sofrası', metin: 'Tuzsuz ayrılan porsiyon, güvenli kesim' },
    ];
    return `<section class="kd-bolum" aria-labelledby="kivam-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Kıvam yolculuğu', ikonAd: 'kasik', renk: 'seftali', baslik: '<span id="kivam-bas">Sütten aile sofrasına</span>', alt: 'Kıvam yaşla birlikte adım adım kalınlaşır; bebeğinizin hızını izleyin.' })}
  <ol class="kd-dyol">
   ${adim.map((a, n) => `<li class="kd-gir" data-renk="${EVRE[a.kod].renk}" style="--kd-gecikme:${n * 90}ms"><span class="kd-dyol__ikon">${a.svg ? o.kivamSvg(a.svg) : ikon('biberon', 34)}</span><small>${esc(EVRE[a.kod].kisa)}</small><b>${esc(a.baslik)}</b><span>${esc(a.metin)}</span></li>`).join('')}
  </ol>
 </div>
</section>`;
  }

  const genel = {
    dosya: 'kids-donemler.html',
    baslik: 'Dönemler: hamilelikten 3 yaşa beslenme | Dada Kids',
    aciklama: 'Hamilelik, 0–6 ay, 6–8 ay, 9–12 ay ve 1–3 yaş: her evrede süt ve ek gıda dengesi, kıvam, odak besinler ve uygun tarifler.',
    aktif: 'donemler',
    css: ['donem'],
    js: ['donem'],
    main: o.sayfa(`
${o.hero({
  renk: 'mavi',
  kirinti: [['Tarifler', 'tarifler.html'], ['Dada Kids', 'kids.html'], ['Dönemler']],
  ust: { metin: 'Beş evre', ikon: 'takvim' },
  baslik: 'Hamilelikten 3 yaşa,<br>evre evre beslenme',
  giris: 'Her evrede aynı sorular: süt ne kadar, ek gıda ne zaman, kıvam nasıl, hangi besinlere odaklanmalı? Bebeğinizin evresini seçin, gerisini birlikte düzenleyelim.',
  eylemler: `<a class="kd-btn" href="#evreler">Evrenizi seçin <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></a><a class="kd-btn kd-btn--hafif" href="kids-arac-hazir-mi.html">${ikon('liste', 20)} Ek gıdaya hazır mı?</a>`,
  sag: kolaj(),
})}
${evreSeridi(null)}
${karsilastirma()}
${kivamYolculugu()}
<section class="kd-bolum kd-bolum--beyaz" id="evreler" aria-labelledby="evre-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Evreler', ikonAd: 'kalp', renk: 'pembe', baslik: '<span id="evre-bas">Hangi evredesiniz?</span>', alt: 'Her evre sayfasında günlük denge, besin matrisi, uygun tarifler ve sık sorulanlar var.' })}
  <div class="kd-izgara kd-devreler">${EVRE_SIRA.map((k) => o.evreKart(k)).join('')}</div>
 </div>
</section>
${guven()}
`, 'donemler'),
  };

  /* =====================================================================
     Evre sayfaları
     ===================================================================== */
  const evreSayfalari = EVRE_SIRA.map((kod) => {
    const e = EVRE[kod];
    const d = v(kod);
    const i = EVRE_SIRA.indexOf(kod);
    const eylem = kod === 'hamilelik'
      ? `<a class="kd-btn" href="#besinler">Bu dönemde besinler <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></a><a class="kd-btn kd-btn--hafif" href="kids-rehber.html">${ikon('kitap', 20)} Rehber</a>`
      : kod === '0-6-ay'
        ? `<a class="kd-btn" href="kids-arac-hazir-mi.html">${ikon('liste', 20)} Ek gıdaya hazır mı?</a><a class="kd-btn kd-btn--hafif" href="${evreSayfasi('6-8-ay')}">6–8 aya göz atın</a>`
        : `<a class="kd-btn" href="kids-tarifler.html?yas=${TARIF_YASI[kod]}">${ikon('kase', 20)} ${esc(e.kisa)} tarifleri</a><a class="kd-btn kd-btn--hafif" href="#besinler">Besin matrisi</a>`;
    const giris = d.slogan && d.ozet && d.slogan !== d.ozet
      ? `<span class="kd-dslogan">${esc(d.slogan)}</span>${esc(d.ozet)}`
      : esc(d.slogan || d.ozet || (typeof d.beslenme === 'string' ? d.beslenme : ''));
    return {
      dosya: evreSayfasi(kod),
      baslik: `${e.ad}: beslenme, kıvam ve tarifler | Dada Kids`,
      aciklama: `${e.ad} evresi: günlük süt ve ek gıda dengesi, kıvam, odak besinler, uygun ve henüz erken besinler${TARIF_YASI[kod] ? ', yaşa uygun tarifler' : ''}.`,
      aktif: 'donemler',
      css: ['donem'],
      js: ['donem'],
      main: o.sayfa(`
${o.hero({
  renk: e.renk,
  kirinti: [['Tarifler', 'tarifler.html'], ['Dada Kids', 'kids.html'], ['Dönemler', 'kids-donemler.html'], [e.ad]],
  ust: { metin: `${i + 1}. evre · ${d.aralik || e.aralik}`, ikon: e.ikon },
  baslik: esc(d.ad || e.ad),
  giris,
  eylemler: eylem,
  gorsel: { yol: `varlik/kids/gorsel/evre-${kod}.webp`, alt: `${e.ad} evresi` },
})}
${evreSeridi(kod)}
${hapSatiri(kod)}
${beslenmeBolumu(kod)}
${odakBolumu(kod)}
${altBolumler(kod)}
${matris(kod)}
${tarifBolumu(kod)}
${sss(kod)}
${guven()}
${sonrakiEvre(kod)}
`, 'donemler'),
    };
  });

  return [genel, ...evreSayfalari];
}
