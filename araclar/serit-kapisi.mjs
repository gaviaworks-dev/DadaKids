// Güvenlik şeridi kapısı (Beyar 1 Kas): şerit olan her Kids sayfasında
//  · metin BİREBİR "1 yaşından küçük bebeklere tuz, rafine şeker, bal ve inek sütü (ana içecek olarak) verilmemelidir." (varyant yok)
//  · bağ "Yasaklı Gıdalar Rehberini İncele →" → kids-rehber-yasakli-gidalar.html
//  · görünür, kesilmiyor (metin kutusu taşmıyor, şerit pencereden taşmıyor), üstüne başka öğe binmiyor (şerit ekran ortasındayken)
//  · ≤ 640px'te bağ metnin ALTINDA; 1440'ta aynı satırda olabilir
// Ayrıca: şeridi olmayan sayfalar yalnız Hamilelik ve 1–3 Yaş (V2 kararı: 1 yaş öncesi uyarısı bu dönemlerde geçerli değil).
// Kullanım: node araclar/serit-kapisi.mjs · TABAN=… · GENISLIK=1440,390,320
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GEN = (process.env.GENISLIK || '1440,390,320').split(',').map(Number);
const CUMLE = '1 yaşından küçük bebeklere tuz, rafine şeker, bal ve inek sütü (ana içecek olarak) verilmemelidir.';
const BAG = 'Yasaklı Gıdalar Rehberini İncele →';
const SERITSIZ = ['kids-donem-hamilelik.html', 'kids-donem-1-3-yas.html'];
const SAYFALAR = [...readdirSync('.').filter((f) => /^kids(-.+)?\.html$/.test(f)).sort(), 'kids-tarif.html?t=balkabagi-puresi'];
let hata = 0, olcum = 0;
const yaz = (ok, s, d = []) => { olcum++; if (!ok) hata++; console.log(`${ok ? '✓' : '✗'} ${s}`); d.forEach((x) => console.log('    ', x)); };
const t = await chromium.launch();
for (const w of GEN) {
  const p = await t.newPage({ viewport: { width: w, height: w > 600 ? 900 : 760 } });
  for (const s of SAYFALAR) {
    await p.goto(TABAN + s, { waitUntil: 'networkidle' }); await p.waitForTimeout(250);
    const n = await p.locator('.kd-guvenlik-serit').count();
    const ad = s.split('?')[0];
    if (SERITSIZ.includes(ad)) { yaz(n === 0, `${w} ${s} şerit yok (V2 kararı)`); continue; }
    if (!n) { yaz(false, `${w} ${s} şerit YOK`); continue; }
    await p.evaluate(() => { const e = document.querySelector('.kd-guvenlik-serit'); const r = e.getBoundingClientRect(); window.scrollBy(0, r.top - innerHeight / 2 + r.height / 2); });
    await p.waitForTimeout(350);
    const r = await p.evaluate(({ CUMLE, BAG }) => {
      const out = [];
      const tum = [...document.querySelectorAll('.kd-guvenlik-serit')];
      for (const e of tum) {
        const sp = e.querySelector('p > span:not(.kd-guvenlik-serit__ikon)'); const a = e.querySelector('a');
        const metin = (sp ? sp.textContent : '').replace(/\s+/g, ' ').trim();
        if (metin !== CUMLE) out.push(`metin farklı: "${metin}"`);
        if (!a || a.textContent.replace(/\s+/g, ' ').trim() !== BAG) out.push(`bağ metni: "${a ? a.textContent.trim() : '-'}"`);
        if (a && !a.getAttribute('href').endsWith('kids-rehber-yasakli-gidalar.html')) out.push(`bağ hedefi: ${a.getAttribute('href')}`);
      }
      const e = tum[0]; const sp = e.querySelector('p > span:not(.kd-guvenlik-serit__ikon)'); const a = e.querySelector('a');
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') out.push('şerit gizli');
      const eb = e.getBoundingClientRect(), sb = sp.getBoundingClientRect(), ab = a.getBoundingClientRect();
      if (eb.left < -0.5 || eb.right > innerWidth + 0.5) out.push(`şerit pencereden taşıyor ${Math.round(eb.left)}–${Math.round(eb.right)}`);
      if (sp.scrollWidth > sp.clientWidth + 1 || sp.scrollHeight > sp.clientHeight + 1) out.push('metin kutusu kesiliyor');
      if (ab.right > innerWidth + 0.5 || a.scrollWidth > a.clientWidth + 1) out.push('bağ kesiliyor');
      if (innerWidth <= 640 && ab.top < sb.bottom - 1) out.push(`mobilde bağ metnin altında değil (bağ üst ${Math.round(ab.top)} · metin alt ${Math.round(sb.bottom)})`);
      // üst üste binme: metin ve bağ üzerindeki noktalar şeridin kendi öğelerine düşmeli
      const nokta = [];
      for (const b of [sb, ab]) for (const fx of [0.1, 0.5, 0.9]) for (const fy of [0.25, 0.75]) nokta.push([b.left + b.width * fx, b.top + b.height * fy]);
      const ust = nokta.map(([x, y]) => document.elementFromPoint(x, y)).filter((x) => x && !e.contains(x));
      if (ust.length) out.push(`üstüne binen: ${[...new Set(ust.map((x) => (typeof x.className === 'string' && x.className) || x.tagName))].slice(0, 3).join(', ')}`);
      return out;
    }, { CUMLE, BAG });
    yaz(!r.length, `${w} ${s}`, r);
  }
  await p.close();
}
await t.close();
console.log(`\n${olcum - hata}/${olcum} güvenlik şeridi ölçümü ${hata ? 'KIRMIZI' : 'yeşil'}`);
process.exit(hata ? 1 : 0);
