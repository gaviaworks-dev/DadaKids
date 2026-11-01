// Matris kapısı: evre sayfalarındaki sekmeli besin bileşeni evre verisiyle birebir mi?
// Her evre sayfasında (derlenmiş HTML) sekme sayıları (data-sayi), panel kart sırası (data-besin) ve kart adları
// veri/evreler.json uygun/dikkat/henuz + veri/besinler.json ile karşılaştırılır. Uyuşmazlıkta çıkış kodu 1.
// Ek revize: kart sınıfı "kd-mkart kd-ikonlu", ad "kd-mkart__ad kd-ikonlu__baslik" (ek sınıflara izin verilir).
// İstisna: 0–6 ay'da veride boş olan uygun/dikkat gruplarına sayfa evre notu kartı koyar ([data-kd-ek], data-besin yok).
// Kullanım: node araclar/matris-kapisi.mjs [sayfa.html ...]   (varsayılan: 5 evre sayfası, depo kökünde)
import { readFileSync } from 'node:fs';
import path from 'node:path';

const KOK = process.env.KOK || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');   // KOK=… dondurulmuş kopya
const evreler = JSON.parse(readFileSync(path.join(KOK, 'veri/evreler.json'), 'utf8')).evreler;
const besinler = new Map(JSON.parse(readFileSync(path.join(KOK, 'veri/besinler.json'), 'utf8')).besinler.map((b) => [b.slug, b]));
const TURLER = ['uygun', 'dikkat', 'henuz'];
const coz = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const ozellik = (attrs, ad) => { const m = new RegExp(`\\s${ad}="([^"]*)"`).exec(attrs); return m ? m[1] : null; };

const dosyalar = process.argv.slice(2).length ? process.argv.slice(2) : evreler.map((e) => path.join(KOK, `kids-donem-${e.kod}.html`));
let hata = 0;
for (const dosya of dosyalar) {
  const html = readFileSync(dosya, 'utf8');
  const ad = path.basename(dosya);
  const sorun = [];
  const kapM = /<div class="kd-mtab[^"]*" data-kd-matris="([^"]+)">/.exec(html);
  if (!kapM) { console.log(`✗ ${ad}: data-kd-matris bulunamadı`); hata++; continue; }
  const kod = kapM[1];
  const evre = evreler.find((e) => e.kod === kod);
  if (!evre) { console.log(`✗ ${ad}: evre verisi yok (${kod})`); hata++; continue; }
  const kap = html.slice(kapM.index);
  const ozet = [];
  for (const tur of TURLER) {
    const beklenen = Array.isArray(evre[tur]) ? evre[tur].filter(Boolean) : [];
    // sekme
    const sekmeM = new RegExp(`<button class="kd-msekme"([^>]*data-durum="${tur}"[^>]*)>`).exec(kap);
    const sayi = sekmeM ? Number(ozellik(sekmeM[1], 'data-sayi')) : NaN;
    // panel → kartlar
    const pBas = kap.indexOf(`id="besinler-panel-${tur}"`);
    const pSon = TURLER.slice(TURLER.indexOf(tur) + 1).map((t) => kap.indexOf(`id="besinler-panel-${t}"`)).find((i) => i > 0) ?? kap.indexOf('</section>');
    if (pBas < 0) { sorun.push(`${tur}: panel yok`); continue; }
    const panel = kap.slice(pBas, pSon);
    const kartlar = [...panel.matchAll(/<li class="kd-mkart(?:\s[^"]*)?"([^>]*)>[\s\S]*?<b class="kd-mkart__ad[^"]*">([\s\S]*?)<\/b>/g)].map((m) => ({ slug: ozellik(m[1], 'data-besin'), ek: ozellik(m[1], 'data-kd-ek'), ad: coz(m[2]) }));
    const sluglar = kartlar.filter((k) => k.slug !== null).map((k) => k.slug);
    const ekler = kartlar.filter((k) => k.slug === null);
    if (!sekmeM) sorun.push(`${tur}: sekme yok`);
    if (sayi !== kartlar.length) sorun.push(`${tur}: sekme sayısı ${sayi} ≠ kart ${kartlar.length}`);
    if (sluglar.join(',') !== beklenen.join(',')) {
      const eksik = beklenen.filter((s) => !sluglar.includes(s)); const fazla = sluglar.filter((s) => !beklenen.includes(s));
      sorun.push(`${tur}: kartlar veriyle aynı değil${eksik.length ? ` · eksik ${eksik.join(',')}` : ''}${fazla.length ? ` · fazla ${fazla.join(',')}` : ''}${!eksik.length && !fazla.length ? ' · sıra farklı' : ''}`);
    }
    if (beklenen.length && sayi !== beklenen.length) sorun.push(`${tur}: sekme sayısı ${sayi} ≠ veri ${beklenen.length}`);
    if (ekler.length && (beklenen.length || kod !== '0-6-ay' || ekler.some((k) => k.ek !== 'evre-notu'))) sorun.push(`${tur}: veride olmayan ${ekler.length} kart`);
    for (const k of kartlar) if (k.slug !== null) {
      const b = besinler.get(k.slug);
      if (!b) sorun.push(`${tur}: ${k.slug} besinler.json'da yok`);
      else if (b.ad !== k.ad) sorun.push(`${tur}: ${k.slug} adı "${k.ad}" ≠ "${b.ad}"`);
    }
    ozet.push(`${tur} ${sayi}${ekler.length ? ` (evre notu ${ekler.length})` : ''}`);
  }
  if (sorun.length) { hata++; console.log(`✗ ${ad} [${kod}]\n   - ${sorun.join('\n   - ')}`); }
  else console.log(`✓ ${ad} [${kod}] ${ozet.join(' · ')}`);
}
console.log(hata ? `\nMATRİS KAPISI KIRMIZI: ${hata}/${dosyalar.length} sayfa` : `\nMATRİS KAPISI YEŞİL: ${dosyalar.length}/${dosyalar.length} sayfa`);
process.exit(hata ? 1 : 0);
