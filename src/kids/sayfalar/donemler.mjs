// Dada Gastro Kids — Dönemler: genel bakış + 5 evre sayfası (sahibi: sayfalar kolu)
// Veri: veri/evreler.json (+ besinler.json, kids-tarifler.json, rehber.json). Eksik alanlar sessizce atlanır.

const AY_ARALIGI = { 'hamilelik': null, '0-6-ay': [0, 5], '6-8-ay': [6, 8], '9-12-ay': [9, 11], '1-3-yas': [12, 36] };
const ILK_SUNUM_ANAHTARI = { '6-8-ay': '6', '9-12-ay': '9', '1-3-yas': '12' };
const TARIF_YASI = { '6-8-ay': 6, '9-12-ay': 9, '1-3-yas': 12 };

const dizi = (x) => (Array.isArray(x) ? x.filter((v) => v !== null && v !== undefined && v !== '') : x ? [x] : []);
const insanca = (s) => String(s).replace(/-/g, ' ').replace(/^./, (c) => c.toLocaleUpperCase('tr'));

/* ---------- V2: görsel varlık denetimi + düz bölüm ritmi (karakter, süs ve dalga geçişi yok) ---------- */
import { sss as sssBilesen } from '../sss.mjs';
import { existsSync } from 'node:fs';
const KOK = new URL('../../../', import.meta.url).pathname;
// Foto turu: o.urun() gerçek ürün fotoğrafı basar (foto-urun: varlik/kids/gorsel/urun/<ad>-k.webp); fotoğrafı olmayan üründe yedek görsel kullanılır
const urunVar = (k) => !!k && existsSync(`${KOK}varlik/kids/gorsel/urun/${k}-k.webp`);
/** Bölümleri sırayla dizer: bir krem, bir açık evre bandı (düz zemin). Her bölüm (z) => html; z section class'ına eklenir. */
function ritim(bolumler, renkler, { zebraIle = true } = {}) {
  const dolu = bolumler.filter((b) => b && b(''));
  return dolu.map((b, i) => {
    const zebra = (i % 2 === 0) === zebraIle ? renkler[Math.floor(i / 2) % renkler.length] : null;
    return b(zebra ? ` kd-zebra" data-renk="${zebra}` : '');
  }).join('\n');
}
/** Evre fotoğrafı: gerçekçi, aydınlık; 0–6 ay karesi oyuncak (peluş) içermeyecek biçimde kırpıldı (karar: tasks/kids-ui-tur2.md). */
const EVRE_FOTO = { '0-6-ay': 'varlik/kids/gorsel/evre-0-6-ay-kirp.webp' };
const EVRE_FOTO_ALT = {
  'hamilelik': 'Aydınlık bir masada yeşil yapraklar, avokado, portakal, armut ve çilekli taze ürün kasesi',
  '0-6-ay': 'Süt dolu biberon, açık mavi mama kasesi ve kaşık',
  '6-8-ay': 'Şeftali rengi silikon kasede pürüzsüz meyve püresi ve bebek kaşığı',
  '9-12-ay': 'Bölmeli tabakta havuç çubukları, brokoli, avokado, muz ve ekmek dilimleri',
  '1-3-yas': 'Bölmeli çocuk tabağında sebzeli pirinç, salatalık çubukları ve köfte',
};

export default async function donemler(o) {
  const { esc, EVRE, EVRE_SIRA, evreSayfasi, ikon } = o;
  /** Sade bilgi notu (karakter/balon yok). */
  const not = (html, sinif = '') => `<p class="kd-kutu kd-not ${sinif}"><i class="fa-solid fa-circle-info" aria-hidden="true"></i><span>${html}</span></p>`;
  /** Hero + güvenlik şeridi: Hamilelik ve 1–3 Yaş hariç (o.hero serit:true desteklemiyorsa elle eklenir; çift basılmaz). */
  const hero = (s, serit = true) => { const h = o.hero({ ...s, serit }); return !serit || h.includes('kd-guvenlik-serit') ? h : h + '\n' + o.guvenlikSeridi(); };
  /** Evre görseli: gerçekçi evre fotoğrafı. */
  const evreFoto = (kod) => EVRE_FOTO[kod] || `varlik/kids/gorsel/evre-${kod}.webp`;
  const evreGorsel = (kod, alt = '', { oncelik = false } = {}) => o.foto(evreFoto(kod), alt, { gen: 1200, yuk: 900, oncelik });
  const EVRE_IPUCU = {
    'hamilelik': 'Bu dönemde "iki kişilik yemek" değil, iki kişilik özen önemli: çeşitli, iyi pişmiş ve taze besinler. Takviyeleri hekiminizle planlayın.',
    '0-6-ay': 'Bu evrede bebeğinizin tek besini anne sütü ya da formül mama. Ek gıdaya hazır olma işaretlerini birlikte izleyelim.',
    '6-8-ay': 'İlk haftalarda amaç tanışmak, doymak değil. Süt hâlâ ana besin; kıvamı adım adım çatal kıvamına taşıyın.',
    '9-12-ay': 'Kıskaç tutuşu gelişirken küçük, yumuşak parmak gıdalar keyifli bir oyun. Yuvarlak besinleri her zaman ikiye ya da dörde bölün.',
    '1-3-yas': 'Aile sofrasına hoş geldiniz! Tuz eklemeden ayırdığınız porsiyon çoğu zaman yeterli. Bütün kuruyemiş 5 yaşa kadar verilmez.',
  };
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
  /* Sekmeli besin bileşeni (matris kolu): üstte durum sekmeleri, altta dengeli kart ızgarası.
     İçerik bugünküyle aynı (ad, gerekçe, sunum, açılış yaşı, kesim bağı); yalnız sunuş değişti.
     Kapı sözleşmesi: [data-kd-matris=kod] · sekme [data-durum][data-sayi] · kart [data-besin] (0–6 ay evre notu: [data-kd-ek]) */
  const MATRIS_SINIR = 8;
  const FILTRE_GRUP = { 'sebze': 'sebze', 'meyve': 'meyve', 'protein': 'protein', 'baklagil': 'protein', 'kuruyemiş': 'protein', 'tohum': 'protein', 'tahıl': 'tahil', 'süt ürünü': 'sut' };
  const FILTRE_AD = { sebze: 'Sebze', meyve: 'Meyve', protein: 'Protein', tahil: 'Tahıl', sut: 'Süt ürünü', diger: 'Diğer' };
  const URUN_ESLE = { 'kiraz-domates': 'domates' };
  const TARIF_ESLE = { mercimek: ['kirmizi-mercimek'], kofte: ['kiyma'], balik: ['somon'], peynir: ['lor-peyniri', 'kasar'], 'yer-fistigi': ['fistik-ezmesi'] };
  const svg64 = (ic, boy = 40) => `<svg viewBox="0 0 64 64" width="${boy}" height="${boy}" fill="none" stroke="#3A2E2A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ic}</svg>`;
  const GRUP_SVG = {
    'süt ürünü': '<path d="M24 8h16v9l6 9v27a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V26l6-9z" fill="#E4F0FB"/><path d="M24 17h16"/><path d="M18 34c5-3 9 3 14 0s9-3 14 0" />',
    'protein': '<path d="M40 8c9 0 16 7 15 16-1 10-11 15-19 12l-8 8a5.5 5.5 0 1 1-7.5 1.5 5.5 5.5 0 1 1 1.5-7.5l8-8c-3-8 0-22 10-22z" fill="#FFC4A3"/><path d="M42 16c4 1 6 4 6 8" stroke-width="2"/>',
    'baklagil': '<ellipse cx="23" cy="36" rx="12" ry="9" transform="rotate(-24 23 36)" fill="#F6C58F"/><ellipse cx="42" cy="30" rx="11" ry="8" transform="rotate(22 42 30)" fill="#FFDF7E"/><path d="M19 38c3-1 6-3 7-6M39 28c2 1 5 3 6 5" stroke-width="2"/>',
    'tahıl': '<path d="M32 58V12"/><g fill="#FFDF7E"><ellipse cx="25" cy="18" rx="5" ry="8" transform="rotate(-32 25 18)"/><ellipse cx="39" cy="18" rx="5" ry="8" transform="rotate(32 39 18)"/><ellipse cx="25" cy="30" rx="5" ry="8" transform="rotate(-32 25 30)"/><ellipse cx="39" cy="30" rx="5" ry="8" transform="rotate(32 39 30)"/><ellipse cx="25" cy="42" rx="5" ry="8" transform="rotate(-32 25 42)"/><ellipse cx="39" cy="42" rx="5" ry="8" transform="rotate(32 39 42)"/></g>',
    'kuruyemiş': '<path d="M32 7c8 0 12 6 11 13-1 4-3 6-3 9s3 6 3 11c0 8-5 15-11 15s-11-7-11-15c0-5 3-8 3-11s-2-5-3-9C20 13 24 7 32 7z" fill="#F2D6A8"/><g fill="#3A2E2A" stroke="none"><circle cx="28" cy="18" r="1.4"/><circle cx="35" cy="22" r="1.4"/><circle cx="29" cy="40" r="1.4"/><circle cx="36" cy="45" r="1.4"/></g>',
    'tohum': '<g fill="#FFF4CC"><path d="M20 22c6 2 8 10 4 16-6-2-8-10-4-16z"/><path d="M40 14c6 3 7 11 2 16-6-3-7-11-2-16z"/><path d="M38 38c6 1 9 9 5 15-6-1-9-9-5-15z"/></g>',
    'tatlandırıcı': '<rect x="16" y="22" width="32" height="34" rx="11" fill="#FFDF7E"/><rect x="20" y="11" width="24" height="11" rx="3" fill="#F7B8CB"/><path d="M24 34c2 4 4 4 6 0" stroke-width="2"/>',
    'içecek': '<path d="M18 20h28l-4 34a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill="#AFD3F5"/><path d="M36 20l5-12h7"/><path d="M20 32h24" stroke-width="2"/>',
    'atıştırmalık': '<g fill="#FFF4CC"><circle cx="22" cy="22" r="7"/><circle cx="32" cy="17" r="7"/><circle cx="42" cy="22" r="7"/></g><path d="M15 26h34l-5 30H20z" fill="#F7B8CB"/><path d="M27 26l1 30M37 26l-1 30" stroke-width="2"/>',
  };
  const DURUM = {
    uygun: { ikon: () => ikon('kalkan', 28), bebek: ['Uygun hazırlık', 'Bu evrede verilebilir'], hamile: ['Rahatça', 'Dengeli beslenmenin parçası'] },
    dikkat: { ikon: () => ikon('uyari', 28), bebek: ['Dikkat', 'Uygun, ama hazırlık şekli kritik'], hamile: ['Dikkat', 'Pişirme ve hijyen önemli'] },
    henuz: { ikon: () => svg64('<path d="M22 8h20l14 14v20L42 56H22L8 42V22z" fill="#F7B8CB"/><path d="M22 32h20" stroke-width="4"/>', 28), bebek: ['Henüz erken', 'Açılış yaşı gelmedi'], hamile: ['Kaçınılır', 'Bu dönemde önerilmez'] },
  };
  const filtreGrubu = (b) => FILTRE_GRUP[b.grup] || 'diger';
  // Foto turu: ürün fotoğrafı olmayan besinde gerçek fotoğraf (varlik/kids/gorsel/bolum/besin/<slug>.webp; tarif/yasaklı gıda
  // fotoğraflarından kırpım ya da yeni üretim). Aynı türdeki besinler ortak fotoğrafı paylaşır.
  const BESIN_ORTAK = { 'meyve-suyu': 'icecek', 'bitki-cayi': 'icecek', 'cay': 'icecek', 'karaciger': 'hamile-cig', 'ciy-yumurta': 'hamile-cig', 'ciy-et': 'hamile-cig', 'yuksek-civali-balik': 'hamile-cig', 'alkol': 'hamile-kafein', 'kafein': 'hamile-kafein', 'pastorize-olmayan-peynir': 'hamile-kafein', 'pastorize-olmayan-sut': 'hamile-kafein' };
  const besinFoto = (slug) => { if (!slug) return ''; const y = `varlik/kids/gorsel/bolum/besin/${BESIN_ORTAK[slug] || slug}.webp`; return existsSync(`${KOK}${y}`) ? y : ''; };
  function besinGorsel(b, tur) {
    const u = b.slug ? (URUN_ESLE[b.slug] || b.slug) : '';
    if (u && urunVar(u)) return o.urun(u, 40);
    const bf = besinFoto(b.slug);
    if (bf) return `<img class="kd-foto-ikon__img" src="${bf}" alt="" aria-hidden="true" width="96" height="96" loading="lazy" decoding="async">`;
    if (GRUP_SVG[b.grup]) return svg64(GRUP_SVG[b.grup]);
    if (!b.slug && tur === 'uygun') return `<img class="kd-foto-ikon__img" src="varlik/kids/gorsel/bolum/odak-anne-sutu.webp" alt="" aria-hidden="true" width="160" height="160" loading="lazy" decoding="async">`;   // 0–6 ay: anne sütü / formül
    if (!b.slug) return ikon(tur === 'uygun' ? 'biberon' : 'takvim', 36);
    return ikon('kase', 36);
  }
  function tarifBul(slug, kod) {
    const ar = AY_ARALIGI[kod];
    if (!ar || !slug) return null;
    const anahtar = [slug, ...(TARIF_ESLE[slug] || [])];
    const aday = tarifler.filter((t) => Number(t.yas) <= ar[1] && (t.malzemeler || []).some((m) => anahtar.includes(m.anahtar)));
    aday.sort((a, c) => (c.evre === kod) - (a.evre === kod) || c.yas - a.yas);
    return aday[0] || null;
  }
  function matrisKart(b0, kod, tur, n) {
    // Hamilelik: bebek odaklı gerekçe/yaş/kesim gösterilmez; hamilelikNotu ya da hamileliğe özel kaydın gerekçesi kullanılır
    const hamile = kod === 'hamilelik';
    const b = hamile ? { ad: b0.ad, gerekce: b0.hamilelik ? b0.gerekce : (b0.hamilelikNotu || ''), minAy: undefined, kesimSlug: null } : b0;
    const anahtar = ILK_SUNUM_ANAHTARI[kod];
    const nasil = tur !== 'henuz' && anahtar && b.ilkSunum && b.ilkSunum[anahtar] ? b.ilkSunum[anahtar] : '';
    const notHtml = nasil ? `<span class="kd-gizli">Bu evrede sunum: </span>${esc(nasil)}` : esc(b.gerekce);
    const ek = nasil && b.gerekce ? b.gerekce : '';
    const kesim = b.kesimSlug && kesimSluglari.has(b.kesimSlug)
      ? `<a class="kd-mkart__bag" href="kids-guvenli-kesim.html#${esc(b.kesimSlug)}">${ikon('bicak-tahta', 18)}<span>Nasıl kesilir?</span><span class="kd-gizli"> (${esc(b.ad)}, Güvenli Kesim)</span></a>` : '';
    const t = !hamile && tur !== 'henuz' ? tarifBul(b0.slug, kod) : null;
    const tarif = t ? `<a class="kd-mkart__bag" href="${o.tarifHref(t.slug)}" title="${esc(t.ad)}">${ikon('kase', 18)}<span>Tarif</span><span class="kd-gizli">: ${esc(t.ad)}</span></a>` : '';
    const yas = b.minAy === undefined ? '' : `<span class="kd-mkart__yas"><i class="fa-regular fa-calendar" aria-hidden="true"></i>${yasMetni(b.minAy)}</span>`;
    const id = `mk-${kod}-${tur}-${n}`;
    const veriAttr = b0.slug ? `data-besin="${esc(b0.slug)}"` : 'data-kd-ek="evre-notu"';
    // E5: üst satır görsel + ad; açıklama satırları görselin sol hizasından tam genişlik. E4: akordeon yok, metin hep açık.
    return `<li class="kd-mkart kd-ikonlu" id="${id}" ${veriAttr} data-grup="${filtreGrubu(b0)}" tabindex="-1"${n >= MATRIS_SINIR ? ' data-kd-fazla' : ''}>
     <span class="kd-mkart__gorsel kd-ikonlu__ikon">${besinGorsel(b0, tur)}</span>
     <b class="kd-mkart__ad kd-ikonlu__baslik">${esc(b.ad)}</b>
     <div class="kd-mkart__govde kd-ikonlu__metin">
      ${yas}
      ${notHtml ? `<p class="kd-mkart__not">${notHtml}</p>` : ''}
      ${ek ? `<p class="kd-mkart__ek">${esc(ek)}</p>` : ''}
      ${kesim || tarif ? `<div class="kd-mkart__alt">${kesim}${tarif}</div>` : ''}
     </div>
    </li>`;
  }
  function matrisPanel(kod, tur, liste, acik) {
    const hamile = kod === 'hamilelik';
    const [baslik, aciklama] = DURUM[tur][hamile ? 'hamile' : 'bebek'];
    const gruplar = [...new Set(liste.map(filtreGrubu))].sort((a, c) => Object.keys(FILTRE_AD).indexOf(a) - Object.keys(FILTRE_AD).indexOf(c));
    const filtre = liste.length > MATRIS_SINIR && gruplar.length > 1
      ? `<div class="kd-mfiltre" role="group" aria-label="${esc(baslik)}: besin grubuna göre süz">
       <button class="kd-chip" type="button" data-grup="hepsi" aria-pressed="true">Tümü <span class="kd-mfiltre__n">${liste.length}</span></button>
       ${gruplar.map((g) => `<button class="kd-chip" type="button" data-grup="${g}" aria-pressed="false">${FILTRE_AD[g]} <span class="kd-mfiltre__n">${liste.filter((b) => filtreGrubu(b) === g).length}</span></button>`).join('')}
      </div>` : '';
    return `<div class="kd-mpanel" role="tabpanel" id="besinler-panel-${tur}" aria-labelledby="besinler-${tur}" data-durum="${tur}" tabindex="0"${acik ? '' : ' data-kd-kapali'}>
     <h3 class="kd-mpanel__bas">${DURUM[tur].ikon()}<span>${esc(baslik)} <span class="kd-mpanel__sayi">(${liste.length})</span></span></h3>
     <div class="kd-mpanel__ust"><p class="kd-mpanel__ac"><i class="fa-solid fa-circle-info" aria-hidden="true"></i>${esc(aciklama)}</p>${filtre}</div>
     ${liste.length ? `<ul class="kd-mizgara">${liste.map((b, n) => matrisKart(b, kod, tur, n)).join('')}</ul>` : '<p class="kd-mpanel__bos">Bu evrede bu grupta besin yok.</p>'}
     ${liste.length > MATRIS_SINIR ? `<div class="kd-mdaha"><button class="kd-btn kd-btn--hafif" type="button" data-kd-daha><span>Tümünü göster (<span data-kd-n>${liste.length}</span>)</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button></div>` : ''}
     <p class="kd-gizli" aria-live="polite" data-kd-durum></p>
    </div>`;
  }
  function matris(kod, z = '') {
    const g = matrisGruplari(kod);
    if (!g.uygun.length && !g.dikkat.length && !g.henuz.length) return '';
    const hamile = kod === 'hamilelik';
    const turler = ['uygun', 'dikkat', 'henuz'];
    const sekme = (tur, i) => {
      const [baslik] = DURUM[tur][hamile ? 'hamile' : 'bebek'];
      return `<button class="kd-msekme" type="button" role="tab" id="besinler-${tur}" aria-controls="besinler-panel-${tur}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-durum="${tur}" data-sayi="${g[tur].length}">
      <span class="kd-msekme__ikon">${DURUM[tur].ikon()}</span><span class="kd-msekme__ad">${esc(baslik)}</span><span class="kd-msekme__sayi">${g[tur].length}<span class="kd-gizli"> besin</span></span>
     </button>`;
    };
    return `<section class="kd-bolum${z}" id="besinler" aria-labelledby="besin-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Besin matrisi', ikonAd: 'liste', renk: EVRE[kod].renk, baslik: `<span id="besin-bas">${hamile ? 'Bu dönemde besinler' : 'Bu evrede hangi besin?'}</span>`, alt: hamile ? 'Rahatça tüketilenler, hazırlığına dikkat edilenler ve bu dönemde kaçınılanlar.' : 'Her besinde bir satır gerekçe ve açılış yaşı.' })}
  ${o.ornek()}
  <div class="kd-mtab kd-gir" data-kd-matris="${kod}">
   <div class="kd-mtab__liste" role="tablist" aria-label="${hamile ? 'Bu dönemde besinler' : 'Bu evrede hangi besin?'}">
    ${turler.map(sekme).join('')}
   </div>
   <div class="kd-mtab__paneller">
    ${turler.map((tur, i) => matrisPanel(kod, tur, g[tur], i === 0)).join('')}
   </div>
  </div>
 </div>
</section>`;
  }

  /* ---------- Günlük bir bakışta ---------- */
  function hapSatiri(kod, z = '') {
    const g = gunluk(kod);
    const hap = (ikonAd, etiket, deger) => (deger ? `<li class="kd-dhap kd-ikonlu kd-gir"><span class="kd-dhap__ikon kd-ikonlu__ikon">${ikon(ikonAd, 30)}</span><small class="kd-ikonlu__baslik">${etiket}</small><b class="kd-ikonlu__metin">${esc(deger)}</b></li>` : '');
    const ogeler = [hap('biberon', kod === 'hamilelik' ? 'Süt & emzirme' : 'Süt', g.sut), hap('kasik', 'Ek gıda', g.ekGida), hap('takvim', 'Öğün', g.ogun)].join('');
    if (!ogeler) return '';
    return `<section class="kd-bolum kd-dbakis${z}" aria-labelledby="bakis-bas">
 <div class="wrap kd-dbakis__ic">
  <div>
   <h2 class="kd-dkucuk-bas" id="bakis-bas">Günlük bir bakışta</h2>
   <ul class="kd-dhaplar">${ogeler}</ul>
  </div>
  ${not(esc(EVRE_IPUCU[kod]), 'kd-dbakis__not')}
 </div>
</section>`;
  }

  /* ---------- Beslenme + kıvam ---------- */
  // Denge (Beyar EK): iki panel eşit boyda; listesi kısa kalan panelin altı ilgili sayfaya bağ satırıyla dolar (yalnız mevcut sayfalar)
  const DIKILI_BAG = {
    '0-6-ay': { panel: 'kivam', baglar: [['kids-arac-hazir-mi.html', 'Ek gıdaya hazır mı? aracı'], ['kids-rehber-ek-gidaya-gecis.html', 'Ek gıdaya geçiş rehberi']] },
    '6-8-ay': { panel: 'beslenme', baglar: [['kids-rehber-alerjen-tanitimi.html', 'Alerjen tanıtımı rehberi']] },
  };
  const dikiliBag = (kod, panel) => { const b = DIKILI_BAG[kod]; return b && b.panel === panel ? `<div class="kd-dpanel__baglar">${b.baglar.map(([href, metin]) => `<a class="kd-bag" href="${href}">${esc(metin)} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>`).join('')}</div>` : ''; };
  function beslenmeBolumu(kod, z = '') {
    const e = v(kod);
    const beslenme = dizi(e.beslenme);
    const kivam = dizi(e.kivamDikkat).length ? dizi(e.kivamDikkat) : dizi(e.kivam);
    if (!beslenme.length && !kivam.length && !e.ozet) return '';
    const hamile = kod === 'hamilelik';
    return `<section class="kd-bolum${z}" aria-labelledby="beslenme-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Bu evrede', ikonAd: EVRE[kod].ikon, renk: EVRE[kod].renk, baslik: `<span id="beslenme-bas">Beslenme ve ${hamile ? 'dikkat edilecekler' : 'kıvam'}</span>` })}
  ${o.ornek()}
  <div class="kd-dikili">
   ${beslenme.length ? `<article class="kd-dpanel kd-gir"><h3><span class="kd-dpanel__ikon">${ikon('kase', 26)}</span>Beslenme</h3>${liste(beslenme)}${dikiliBag(kod, 'beslenme')}</article>` : ''}
   ${kivam.length ? `<article class="kd-dpanel kd-dpanel--dikkat kd-gir"><h3><span class="kd-dpanel__ikon">${ikon(hamile ? 'kalp' : 'kasik', 26)}</span>${hamile ? 'Dikkat' : 'Kıvam & dikkat'}</h3>${liste(kivam)}${dikiliBag(kod, 'kivam')}</article>` : ''}
  </div>
 </div>
</section>`;
  }

  /* ---------- Odak besinler ---------- */
  function odakBolumu(kod, z = '') {
    const e = v(kod);
    const odak = dizi(e.odakBesinler).filter((x) => x && (x.ad || typeof x === 'string'));
    if (!odak.length) {
      if (!e.odak) return '';
      return `<section class="kd-bolum${z}"><div class="wrap"><div class="kd-kutu kd-gir" data-renk="${EVRE[kod].renk}"><h3>${ikon('liste', 22)} Bu evrenin odağı</h3><p>${esc(e.odak)}</p></div></div></section>`;
    }
    const kart = (x, n) => {
      const ad = typeof x === 'string' ? x : x.ad;
      // ad (Demir, Folat…) ya da örneklerden biri ürün çizimiyle eşleşirse o; değilse evrenin ikonu
      const ornekler = typeof x === 'string' ? [] : dizi(x.ornekler);
      return `<article class="kd-kart kd-dodak kd-gir" style="--kd-gecikme:${n * 60}ms">
     <div class="kd-dodak__ust"><span class="kd-dodak__no" aria-hidden="true">${String(n + 1).padStart(2, '0')}</span><span class="kd-dodak__gorsel" aria-hidden="true">${odakGorsel(ad, ornekler)}</span></div>
     <h3>${esc(ad)}</h3>
     ${x.neden ? `<p>${esc(x.neden)}</p>` : ''}
     ${ornekler.length ? `<div class="kd-dodak__ornek"><small>Nerede bulunur?</small><ul>${ornekler.map((s) => `<li class="kd-etiket">${esc(s)}</li>`).join('')}</ul></div>` : ''}
    </article>`;
    };
    return `<section class="kd-bolum${z}" aria-labelledby="odak-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Odak besinler', ikonAd: 'kase', renk: EVRE[kod].renk, baslik: '<span id="odak-bas">Bu evrede öne çıkanlar</span>', alt: e.odak ? esc(e.odak) : '' })}
  <div class="kd-izgara kd-dortlu kd-hizali kd-hizali--4 kd-dodaklar" data-renk="${EVRE[kod].renk}">${odak.map(kart).join('')}${odak.length % 4 === 3 ? o.ctaKart({ href: '#besinler', ikonAd: 'liste', gorsel: 'bolum/mevsim', baslik: 'Tüm besinler', metin: kod === 'hamilelik' ? 'Bu dönemde hangi besinin nasıl tüketileceğini tek listede görün.' : 'Bu evrede hangi besinin nasıl hazırlanacağını tek listede görün.', etiket: 'Besin listesi', renk: EVRE[kod].renk, sinif: 'kd-dodak-cta' }) : ''}</div>
 </div>
</section>`;
  }

  function odakGorsel(ad, ornekler) {
    // Foto turu: ürün fotoğrafı (urun) yoksa konuya uygun gerçek fotoğraf (varlik/kids/gorsel/bolum/odak-*)
    const OZEL = { 'anne sütü': 'odak-anne-sutu', 'formül mama': 'odak-formul', 'd vitamini': 'odak-d-vitamini', 'alerjenler': 'rehber-alerjen', 'demir': 'odak-demir', 'iyot': 'odak-iyot', 'çinko': 'odak-cinko', 'kalsiyum': 'odak-kalsiyum', 'lif': 'kivam-aile' };
    const sl = (t) => String(t).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const u = ornekler.map(sl).find(urunVar);
    if (u) return o.urun(u, 56, '');
    const f = OZEL[String(ad).toLocaleLowerCase('tr')];
    return f ? o.fotoIkon(`bolum/${f}`) : ikon('kase', 44);
  }

  /* ---------- Hamilelik alt bölümleri (sekmeler; JS yoksa kartlar) ---------- */
  function altBolumler(kod, z = '') {
    const ab = dizi(v(kod).altBolumler).filter((x) => x && x.ad);
    if (!ab.length) return '';
    const sekmeler = ab.map((x, n) => `<button type="button" role="tab" class="kd-chip" id="sekme-${n}" aria-controls="panel-${n}" aria-selected="${n === 0}"${n ? ' tabindex="-1"' : ''}>${esc(x.ad)}</button>`).join('');
    const paneller = ab.map((x, n) => {
      const metin = dizi(x.metin).map((p) => `<p>${esc(p)}</p>`).join('');
      const maddeler = liste(dizi(x.maddeler));
      return `<section class="kd-dsekme__panel" role="tabpanel" id="panel-${n}" aria-labelledby="sekme-${n}" tabindex="0"${n ? ' data-kd-kapali' : ''}><h3 class="kd-rbas">${o.ikon(n === 3 ? 'biberon' : 'hamile', 32)}<span>${esc(x.ad)}</span></h3>${metin}${maddeler}</section>`;
    }).join('');
    return `<section class="kd-bolum${z}" aria-labelledby="alt-bas">
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
  function yardimKart(href, ikonAd, baslik, metin, renk, foto = '') {
    return `<a class="kd-kart kd-modul kd-ikonlu kd-dyardim kd-gir" href="${href}" data-renk="${renk}"><span class="kd-modul__ikon kd-ikonlu__ikon${foto ? ' kd-foto-ikon' : ''}">${foto ? o.fotoIkon(foto) : ikon(ikonAd, 40)}</span><h3 class="kd-ikonlu__baslik">${esc(baslik)}</h3><p class="kd-ikonlu__metin">${esc(metin)}</p><span class="kd-kart__alt">Aç <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>`;
  }
  function tarifBolumu(kod, z = '') {
    const e = EVRE[kod];
    if (kod === 'hamilelik' || kod === '0-6-ay') {
      const ekGida = rehberBul('ek-gida', 'ekgida', 'gecis');
      const blw = rehberBul('blw');
      const alerjen = rehberBul('alerjen');
      const ogurme = rehberBul('ogurme', 'bogulma');
      const kartlar = kod === '0-6-ay'
        ? [
          yardimKart('kids-arac-hazir-mi.html', 'liste', 'Bebeğim ek gıdaya hazır mı?', 'Oturma, baş kontrolü, ilgi: hazırlık belirtilerini adım adım işaretleyin.', 'mint', 'arac/hazir-mi-kare'),
          yardimKart(rehberHref(ekGida), 'kitap', ekGida?.baslik || 'Ek gıdaya geçiş rehberi', ekGida?.ozet || 'İlk kaşıktan önce bilmeniz gerekenler.', 'seftali', 'bolum/rehber'),
          yardimKart(rehberHref(ogurme || blw), 'kalp', ogurme?.baslik || blw?.baslik || 'Öğürme mi, boğulma mı?', ogurme?.ozet || blw?.ozet || 'Farkı önceden öğrenmek ilk haftaları rahatlatır.', 'pembe', 'bolum/rehber-ogurme'),
          yardimKart(evreSayfasi('6-8-ay'), 'kasik', 'Sıradaki evre: 6–8 Ay', 'İlk tatlar, ilk tarifler ve kıvam geçişleri.', 'seftali', 'bolum/evre-6-8-ay'),
        ]
        : [
          yardimKart(rehberHref(alerjen), 'kitap', alerjen?.baslik || 'Alerjen tanıtımı', alerjen?.ozet || 'Bebeğinizle ilk alerjen tanışmasına önceden hazırlanın.', 'pembe', 'bolum/rehber-alerjen'),
          yardimKart(rehberHref(ekGida), 'kase', ekGida?.baslik || 'Ek gıdaya geçiş', ekGida?.ozet || 'Altıncı aya geldiğinizde sizi neler bekliyor?', 'seftali', 'bolum/rehber'),
          yardimKart(evreSayfasi('0-6-ay'), 'biberon', 'Sıradaki evre: 0–6 Ay', 'Anne sütü, formül mama ve hazırlık belirtileri.', 'mavi', 'bolum/evre-0-6-ay'),
          yardimKart('kids-araclar.html', 'arac', 'Araçlar', 'Hazır mı listesi, alerjen takipçisi, öğün planlayıcı ve persentil.', 'mint', 'bolum/araclar'),
        ];
      return `<section class="kd-bolum${z}" aria-labelledby="yardim-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: kod === '0-6-ay' ? 'Tarif yerine' : 'Bu dönemde işinize yarar', ikonAd: 'liste', renk: e.renk, baslik: `<span id="yardim-bas">${kod === '0-6-ay' ? 'İlk kaşığa hazırlık' : 'Bebeğinize hazırlanırken'}</span>`, alt: kod === '0-6-ay' ? 'Bu evrede tarif yok: bebeğinizin tek besini anne sütü ya da formül mama. Ek gıdaya geçişe hazırlanmak için:' : 'Hamilelik tarifleri hazırlanıyor; şimdilik bu rehberler ve araçlar yanınızda.' })}
  <div class="kd-izgara kd-dortlu kd-hizali kd-hizali--4">${kartlar.join('')}</div>
 </div>
</section>`;
    }
    const liste = tarifler.filter((t) => t.evre === kod);
    if (!liste.length) return '';
    const yas = TARIF_YASI[kod];
    return `<section class="kd-bolum${z}" aria-labelledby="tarif-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Bu evreye özel', ikonAd: 'kase', renk: e.renk, baslik: `<span id="tarif-bas">${esc(e.ad)} tarifleri</span>`, alt: `${liste.length} tarif · kıvamı ve alerjenleri kartın üzerinde.`, sag: `<a class="kd-btn kd-btn--hafif" href="kids-tarifler.html?yas=${yas}">Tümünü gör <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>` })}
  ${o.tarifSeridi(liste.slice(0, 8), { tumuHref: `kids-tarifler.html?yas=${yas}`, renk: e.renk })}
 </div>
</section>`;
  }

  /* ---------- SSS ---------- */
  function sss(kod, z = '') {
    const s = dizi(v(kod).sss).filter((x) => x && x.s && x.c);
    if (!s.length) return '';
    return `<section class="kd-bolum${z}" aria-labelledby="sss-bas">
 <div class="wrap kd-dsss">
   ${o.bolumBasi({ ust: 'Sık sorulanlar', ikonAd: 'kitap', renk: EVRE[kod].renk, baslik: '<span id="sss-bas">Aklınıza takılanlar</span>' })}
   ${o.ornek()}
   ${sssBilesen(s.map((x) => ({ s: x.s, c: dizi(x.c) })), { onek: `sss-${kod}`, renk: EVRE[kod].renk, not: not('Sorunuz burada yoksa çocuk doktorunuza sormaktan çekinmeyin; küçük sorular da önemlidir.') })}
 </div>
</section>`;
  }

  /* ---------- Sonraki evre ---------- */
  function sonrakiEvre(kod, z = '') {
    const i = EVRE_SIRA.indexOf(kod);
    const onceki = EVRE_SIRA[i - 1];
    const sonraki = EVRE_SIRA[i + 1];
    const kart = (k, yon) => {
      const e = EVRE[k];
      return `<a class="kd-dsonraki__kart kd-dsonraki__kart--${yon} kd-ikonlu kd-gir" href="${evreSayfasi(k)}" data-renk="${e.renk}">
   <span class="kd-dsonraki__ikon kd-dsonraki__ikon--foto kd-ikonlu__ikon">${o.fotoIkon(`bolum/evre-${k}`, '', { gen: 176, yuk: 176 })}</span>
   <span class="kd-ikonlu__baslik"><small>${yon === 'ileri' ? 'Sıradaki evre' : 'Önceki evre'}</small><b>${esc(e.ad)}</b></span>
   <i class="fa-solid fa-arrow-${yon === 'ileri' ? 'right' : 'left'} kd-ikonlu__rozet" aria-hidden="true"></i>
   <span class="kd-ikonlu__metin kd-dsonraki__metin">${esc(v(k).slogan || v(k).aralik || e.aralik)}</span>
  </a>`;
    };
    return `<section class="kd-bolum${z}" aria-label="Evreler arasında gezinin">
 <div class="wrap">
  <div class="kd-dsonraki${onceki ? '' : ' kd-dsonraki--tek'}">
   ${onceki ? kart(onceki, 'geri') : ''}
   ${sonraki ? kart(sonraki, 'ileri') : `<a class="kd-dsonraki__kart kd-dsonraki__kart--ileri kd-ikonlu kd-gir" href="kids-donemler.html" data-renk="mavi"><span class="kd-dsonraki__ikon kd-dsonraki__ikon--foto kd-ikonlu__ikon">${o.fotoIkon('bolum/donemler')}</span><span class="kd-ikonlu__baslik"><small>Yolculuğun tamamı</small><b>Tüm evrelere dönün</b></span><i class="fa-solid fa-arrow-right kd-ikonlu__rozet" aria-hidden="true"></i><span class="kd-ikonlu__metin kd-dsonraki__metin">Hamilelikten 3 yaşa beş evre</span></a>`}
  </div>
 </div>
</section>`;
  }

  const guven = (z = '') => `<section class="kd-bolum kd-dguven-bolum${z}"><div class="wrap kd-dguven">${o.onay()}${not('Bu sayfadaki bilgiler DSÖ, NHS ve AAP gibi ana akım rehberlerin uzlaştığı genel ilkeleri özetler; bebeğinize özel bir durum varsa çocuk doktorunuza danışın.')}</div></section>`;

  /* =====================================================================
     Genel bakış
     ===================================================================== */
  function kolaj() {
    const ogeler = EVRE_SIRA.map((kod, n) => `<a class="kd-dkolaj__oge" href="${evreSayfasi(kod)}" data-renk="${EVRE[kod].renk}" style="--kd-gecikme:${n * 80}ms">${o.foto(evreFoto(kod), EVRE[kod].ad, { gen: 1200, yuk: 900, oncelik: n < 2 })}<span>${esc(EVRE[kod].ad)}</span></a>`).join('');
    return `<div class="kd-dkolaj">${ogeler}</div>`;
  }

  function karsilastirma(z = '') {
    const satirlar = EVRE_SIRA.map((kod) => {
      const e = EVRE[kod];
      const g = gunluk(kod);
      const h = (x) => (x ? esc(x) : '<span class="kd-ikincil">—</span>');
      return `<tr data-renk="${e.renk}">
     <th scope="row"><a href="${evreSayfasi(kod)}"><span class="kd-dtablo__ikon kd-foto-ikon">${o.fotoIkon(`bolum/evre-${kod}`, '', { gen: 176, yuk: 176 })}</span><span><b>${esc(e.ad)}</b><small>${esc(v(kod).aralik || e.aralik)}</small></span></a></th>
     <td data-baslik="Süt">${h(g.sut)}</td>
     <td data-baslik="Ek gıda">${h(g.ekGida)}</td>
     <td data-baslik="Öğün">${h(g.ogun)}</td>
    </tr>`;
    }).join('');
    return `<section class="kd-bolum${z}" aria-labelledby="kars-bas">
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

  function kivamYolculugu(z = '') {
    const adim = [
      { kod: '0-6-ay', svg: '', foto: 'bolum/evre-0-6-ay', baslik: 'Yalnız süt', metin: 'Anne sütü ya da formül mama' },
      { kod: '6-8-ay', svg: 'puruzsuz', foto: 'bolum/kivam-pure', baslik: 'Pürüzsüzden ezilmişe', metin: 'Hızla çatal kıvamına ve yumuşak parmak gıdalara' },
      { kod: '9-12-ay', svg: 'parmak', foto: 'bolum/kivam-parmak', baslik: 'Pütürlü & parmak gıda', metin: 'Küçük yumuşak parçalar, kıskaç tutuşu' },
      { kod: '1-3-yas', svg: 'aile', foto: 'bolum/kivam-aile', baslik: 'Aile sofrası', metin: 'Tuzsuz ayrılan porsiyon, güvenli kesim' },
    ];
    return `<section class="kd-bolum${z}" aria-labelledby="kivam-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Kıvam yolculuğu', ikonAd: 'kasik', renk: 'seftali', baslik: '<span id="kivam-bas">Sütten aile sofrasına</span>', alt: 'Kıvam yaşla birlikte adım adım kalınlaşır; bebeğinizin hızını izleyin.' })}
  <ol class="kd-dyol">
   ${adim.map((a, n) => `<li class="kd-gir" data-renk="${EVRE[a.kod].renk}" style="--kd-gecikme:${n * 90}ms"><span class="kd-dyol__ikon kd-foto-ikon">${o.fotoIkon(a.foto, '', { gen: 128, yuk: 128 })}</span><small>${esc(EVRE[a.kod].ad)}</small><b>${esc(a.baslik)}</b><span>${esc(a.metin)}</span></li>`).join('')}
  </ol>
 </div>
</section>`;
  }

  /* Evre kartı: ortak evreKart içeriği; evre fotoğrafı simge kutusunda (kırpılmış kare) */
  function evreKartGorselli(kod, n) {
    const e = EVRE[kod];
    const d = v(kod);
    return `<a class="kd-evre kd-devre-g kd-gir" href="${evreSayfasi(kod)}" data-renk="${e.renk}" data-evre="${kod}" aria-current="false" style="--kd-gecikme:${n * 70}ms">
 <div class="kd-evre__ust kd-ikonlu"><span class="kd-evre__ikon kd-evre__ikon--foto kd-ikonlu__ikon">${evreGorsel(kod, '')}</span><div class="kd-ikonlu__baslik"><span class="kd-evre__aralik">${esc(e.etiket)}</span><h3>${esc(e.ad)}</h3></div></div>
 <p>${esc(d.slogan || d.ozet || '')}</p>
 <span class="kd-evre__git">Evreye git <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
</a>`;
  }

  const genel = {
    dosya: 'kids-donemler.html',
    baslik: 'Dönemler: hamilelikten 3 yaşa beslenme | Dada Gastro Kids',
    aciklama: 'Hamilelik, 0–6 ay, 6–8 ay, 9–12 ay ve 1–3 yaş: her evrede süt ve ek gıda dengesi, kıvam, odak besinler ve uygun tarifler.',
    aktif: 'donemler',
    css: ['donem'],
    js: ['donem'],
    main: o.sayfa(`
${hero({
  renk: 'mavi',
  kirinti: [['Tarifler', 'tarifler.html'], ['Dada Gastro Kids', 'kids.html'], ['Dönemler']],
  ust: { metin: 'Beş evre', ikon: 'takvim' },
  baslik: 'Hamilelikten 3 yaşa,<br>evre evre beslenme',
  giris: 'Her evrede aynı sorular: süt ne kadar, ek gıda ne zaman, kıvam nasıl, hangi besinlere odaklanmalı? Bebeğinizin evresini seçin, gerisini birlikte düzenleyelim.',
  eylemler: `<a class="kd-btn" href="#evreler">Evrenizi seçin <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></a><a class="kd-btn kd-btn--hafif" href="kids-arac-hazir-mi.html">${ikon('liste', 20)} Ek gıdaya hazır mı?</a>`,
  sag: kolaj(),
})}
${evreSeridi(null)}
${ritim([
  karsilastirma,
  kivamYolculugu,
  (z) => `<section class="kd-bolum${z}" id="evreler" aria-labelledby="evre-bas">
 <div class="wrap">
  ${o.bolumBasi({ ust: 'Evreler', ikonAd: 'kalp', renk: 'pembe', baslik: '<span id="evre-bas">Hangi evredesiniz?</span>', alt: 'Her evre sayfasında günlük denge, besin matrisi, uygun tarifler ve sık sorulanlar var.' })}
  <div class="kd-izgara kd-devreler">${EVRE_SIRA.map(evreKartGorselli).join('')}${o.ctaKart({ href: 'kids-arac-hazir-mi.html', ikonAd: 'liste', gorsel: 'arac/hazir-mi-kare', baslik: 'Ek gıdaya hazır mı?', metin: 'Evrenizden emin değilseniz hazırlık belirtilerini işaretleyin.', etiket: 'Kontrol listesi', renk: 'mint', sinif: 'kd-evre-cta' })}</div>
 </div>
</section>`,
  guven,
], ['mavi', 'pembe'])}
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
        ? `<a class="kd-btn" href="kids-arac-hazir-mi.html">${ikon('liste', 20)} Ek gıdaya hazır mı?</a><a class="kd-btn kd-btn--hafif" href="${evreSayfasi('6-8-ay')}">6–8 Ay evresine göz atın</a>`
        : `<a class="kd-btn" href="kids-tarifler.html?yas=${TARIF_YASI[kod]}">${ikon('kase', 20)} ${esc(e.ad)} tarifleri</a><a class="kd-btn kd-btn--hafif" href="#besinler">Besin matrisi</a>`;
    const giris = d.slogan && d.ozet && d.slogan !== d.ozet
      ? `<span class="kd-dslogan">${esc(d.slogan)}</span>${esc(d.ozet)}`
      : esc(d.slogan || d.ozet || (typeof d.beslenme === 'string' ? d.beslenme : ''));
    return {
      dosya: evreSayfasi(kod),
      baslik: `${e.ad}: beslenme, kıvam ve tarifler | Dada Gastro Kids`,
      aciklama: `${e.ad} evresi: günlük süt ve ek gıda dengesi, kıvam, odak besinler, uygun ve henüz erken besinler${TARIF_YASI[kod] ? ', yaşa uygun tarifler' : ''}.`,
      aktif: 'donemler',
      css: ['donem'],
      js: ['donem'],
      main: o.sayfa(`
${hero({
  renk: e.renk,
  kirinti: [['Tarifler', 'tarifler.html'], ['Dada Gastro Kids', 'kids.html'], ['Dönemler', 'kids-donemler.html'], [e.ad]],
  ust: { metin: `${i + 1}. evre · ${d.aralik || e.aralik}`, ikon: e.ikon },
  baslik: esc(d.ad || e.ad),
  giris,
  eylemler: eylem,
  sag: `<div class="kd-hero__gorsel">${evreGorsel(kod, EVRE_FOTO_ALT[kod] || e.ad, { oncelik: true })}</div>`,
}, kod !== 'hamilelik' && kod !== '1-3-yas')}
${evreSeridi(kod)}
${ritim([
  (z) => hapSatiri(kod, z),
  (z) => beslenmeBolumu(kod, z),
  (z) => odakBolumu(kod, z),
  (z) => altBolumler(kod, z),
  (z) => matris(kod, z),
  (z) => tarifBolumu(kod, z),
  (z) => sss(kod, z),
  guven,
  (z) => sonrakiEvre(kod, z),
], [e.renk])}
`, 'donemler'),
    };
  });

  return [genel, ...evreSayfalari];
}
