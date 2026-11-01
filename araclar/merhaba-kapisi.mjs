// Pütür "Merhaba!" balonu kapısı (Beyar 1 Kas): ≤480px'te balon içeriğin üstüne binmez.
//  · balon görünüyorsa: Pütür'ün ÜSTÜNDE (alt kenarı Pütür düğmesinin üstünde) ve sol kenara hizalı (±10px)
//  · balonun altında metin satırı / bağ / düğme / form öğesi yok (Pütür dışı, alt menü hariç)
//  · mobilde sayfa kaydırılınca balon gizlenir (içerik altından geçmez)
//  · 1440'ta da balon içerikle çakışmaz (bilgi: masaüstü konum kuralı aynı)
// Balon ilk ziyarette bir kez çıkar (localStorage dadakids.putur.merhaba.v1); kapı her sayfayı temiz depolamayla açar.
// Kullanım: node araclar/merhaba-kapisi.mjs · TABAN=… · GENISLIK=390,320,1440
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
const TABAN = process.env.TABAN || 'http://localhost:8765/DadaKids/';
const GEN = (process.env.GENISLIK || '390,320,1440').split(',').map(Number);
const SAYFALAR = [...readdirSync('.').filter((f) => /^kids(-.+)?\.html$/.test(f)).sort(), 'kids-tarif.html?t=balkabagi-puresi'];
let hata = 0, olcum = 0, gorunen = 0;
const yaz = (ok, s, d = []) => { olcum++; if (!ok) hata++; if (!ok || process.env.AYRINTI) console.log(`${ok ? '✓' : '✗'} ${s}`); d.forEach((x) => console.log('    ', x)); };
const t = await chromium.launch();
for (const w of GEN) {
  for (const s of SAYFALAR) {
    const bag = await t.newContext({ viewport: { width: w, height: w > 600 ? 900 : 760 }, hasTouch: w <= 480 });
    const p = await bag.newPage();
    await p.goto(TABAN + s, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1700);
    const r = await p.evaluate(() => {
      const b = document.querySelector('.kd-pt__merhaba.kd-acik'); if (!b || b.hidden) return { yok: true };
      const bb = b.getBoundingClientRect(); const kok = b.closest('.kd-pt') || b.parentElement;
      const btn = kok.querySelector('.kd-pt__btn, button'); const pb = btn ? btn.getBoundingClientRect() : kok.getBoundingClientRect();
      const out = [];
      if (innerWidth <= 480) {
        if (bb.bottom > pb.top + 1) out.push(`balon Pütür'ün üstünde değil (balon alt ${Math.round(bb.bottom)} · Pütür üst ${Math.round(pb.top)})`);
        if (Math.abs(bb.left - pb.left) > 10) out.push(`balon Pütür'ün sol kenarına hizalı değil (${Math.round(bb.left)} ↔ ${Math.round(pb.left)})`);
      }
      const kes = (q) => q.left < bb.right && q.right > bb.left && q.top < bb.bottom && q.bottom > bb.top && q.width > 1 && q.height > 1;
      const cak = new Set();
      const yur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = yur.nextNode(); n; n = yur.nextNode()) {
        const e = n.parentElement; if (!n.textContent.trim() || !e || kok.contains(e) || e.closest('.bottom-nav, [hidden], .kd-gizli, .sr-only')) continue;
        const c = getComputedStyle(e); if (c.visibility === 'hidden' || +c.opacity < .05) continue;
        const z = document.createRange(); z.selectNodeContents(n);
        for (const q of z.getClientRects()) if (kes(q)) { cak.add(`"${n.textContent.trim().slice(0, 24)}"`); break; }
      }
      for (const e of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, [role=button], [role=radio], [role=tab]')) {
        if (kok.contains(e) || e.closest('.bottom-nav')) continue; const q = e.getBoundingClientRect(); const c = getComputedStyle(e);
        if (c.display !== 'none' && c.visibility !== 'hidden' && kes(q)) cak.add(`<${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''}>`);
      }
      if (cak.size) out.push(`balon içerikle çakışıyor: ${[...cak].slice(0, 4).join(', ')}`);
      return { out };
    });
    if (r.yok) { yaz(true, `${w} ${s} balon gösterilmedi`); await bag.close(); continue; }
    gorunen++;
    const d = [...r.out];
    if (w <= 480) {
      await p.mouse.wheel(0, 300); await p.waitForTimeout(500);
      const kaldi = await p.evaluate(() => { const b = document.querySelector('.kd-pt__merhaba'); return !!b && !b.hidden && b.classList.contains('kd-acik'); });
      if (kaldi) d.push('mobilde kaydırınca balon gizlenmedi');
    }
    yaz(!d.length, `${w} ${s} balon görünür`, d);
    await bag.close();
  }
}
await t.close();
console.log(`\n${olcum - hata}/${olcum} Merhaba balonu ölçümü ${hata ? 'KIRMIZI' : 'yeşil'} (balon gösterilen: ${gorunen})`);
process.exit(hata ? 1 : 0);
