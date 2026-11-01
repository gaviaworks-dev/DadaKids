// Yayın düzeni (Beyar 1 Kas): /v2/ = GÜNCEL sürüm, /v1/ = dondurulmuş (DOKUNULMAZ), kök → /v2/ yönlendirme.
// Kullanım (YALNIZ yayın worktree'sinde, build + kapılardan SONRA, commit'ten ÖNCE):
//   node araclar/build.mjs && <kapılar kökte> && node araclar/yayinla.mjs
// Yaptığı:
//   1. v2/ klasörünü sıfırdan kurar: kökteki tüm *.html (derlenmiş tam sayfalar) + .nojekyll + varlik/ + veri/ kopyası.
//      Sayfalar içi bağlar göreli olduğundan /v2/ içinde kalır; mutlak canonical/og adresleri /DadaKids/v2/ yapılır.
//   2. Kökteki her *.html'i aynı adlı /v2/ sayfasına yönlendiren küçük bir sayfa yapar (query + hash korunur; JS yoksa meta refresh + bağ).
//      Böylece eski bağlantılar (/DadaKids/, /DadaKids/kids.html?evre=…#…) kırılmaz.
//   v1/ klasörüne hiçbir koşulda yazmaz.
// Ana çalışma ağacında ÇALIŞTIRMA: kök sayfalar yönlendirmeye döner, yerel kapılar (TABAN=…/DadaKids/) tam sayfa bekler.
import { readdirSync, readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import path from 'node:path';

const KOK = process.cwd();
const CANLI = 'https://gaviaworks-dev.github.io/DadaKids/';
const V2 = path.join(KOK, 'v2');
if (!existsSync(path.join(KOK, 'araclar/build.mjs'))) throw new Error('yayinla: depo kökünde çalıştır');
const sayfalar = readdirSync(KOK).filter((f) => f.endsWith('.html'));
const tam = sayfalar.filter((f) => !readFileSync(path.join(KOK, f), 'utf8').includes('data-kd-yonlendirme'));
if (tam.length !== sayfalar.length) throw new Error(`yayinla: kökte yönlendirme sayfası var (${sayfalar.length - tam.length}); önce node araclar/build.mjs`);

rmSync(V2, { recursive: true, force: true });
mkdirSync(V2);
for (const d of ['varlik', 'veri']) cpSync(path.join(KOK, d), path.join(V2, d), { recursive: true });
writeFileSync(path.join(V2, '.nojekyll'), '');
const mutlak = new RegExp(CANLI.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!v1/|v2/)', 'g');
for (const f of sayfalar) {
  const html = readFileSync(path.join(KOK, f), 'utf8').replace(mutlak, CANLI + 'v2/');
  writeFileSync(path.join(V2, f), html);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
for (const f of sayfalar) {
  const hedef = 'v2/' + (f === 'index.html' ? '' : f);
  const baslik = (readFileSync(path.join(V2, f), 'utf8').match(/<title>([^<]*)<\/title>/) || [, 'Dada Gastro Kids'])[1];
  writeFileSync(path.join(KOK, f), `<!doctype html>
<html lang="tr" data-kd-yonlendirme>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${baslik}</title>
<link rel="canonical" href="${CANLI}${hedef}">
<script>location.replace(${JSON.stringify(hedef)} + location.search + location.hash);</script>
<meta http-equiv="refresh" content="0; url=${esc(hedef)}">
</head>
<body><p><a href="${esc(hedef)}">${baslik}</a></p></body>
</html>
`);
}
console.log(`yayinla: v2/ ← ${sayfalar.length} sayfa + varlik + veri · kökte ${sayfalar.length} yönlendirme · v1/ dokunulmadı`);
