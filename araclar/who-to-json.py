"""DSÖ Child Growth Standards XLSX tablolarını (Month, L, M, S, P01…P999) 0–36 ay JSON'a çevirir.

Kullanım:  python3 -I araclar/who-to-json.py <xlsx-klasörü> veri/who-lms.json
Klasörde beklenen dosyalar: wfa_{boys,girls}.xlsx, lhfa_{boys,girls}_0_2.xlsx, lhfa_{boys,girls}_2_5.xlsx,
hcfa_{boys,girls}.xlsx (kaynak bağlantıları tasks/kids-plan.md §4.3).
Bağımlılık yok (zipfile + xml). Lisans: WHO, CC BY-NC-SA 3.0 IGO — atıf zorunlu.
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def satirlar(yol):
    with zipfile.ZipFile(yol) as z:
        paylasilan = []
        if "xl/sharedStrings.xml" in z.namelist():
            for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
                paylasilan.append("".join(t.text or "" for t in si.iter("{%s}t" % NS["m"])))
        sayfa = sorted(n for n in z.namelist() if re.match(r"xl/worksheets/sheet\d+\.xml", n))[0]
        kok = ET.fromstring(z.read(sayfa))
        for row in kok.iter("{%s}row" % NS["m"]):
            hucre = []
            for c in row.findall("m:c", NS):
                v = c.find("m:v", NS)
                deger = None if v is None else v.text
                if c.get("t") == "s" and deger is not None:
                    deger = paylasilan[int(deger)]
                hucre.append(deger)
            yield hucre


def tablo(yol, ay_kaydir=0):
    it = satirlar(yol)
    baslik = [str(h).strip() for h in next(it)]
    idx = {h: i for i, h in enumerate(baslik)}
    for gerekli in ("Month", "L", "M", "S", "P3", "P15", "P50", "P85", "P97"):
        if gerekli not in idx:
            raise SystemExit(f"{yol}: '{gerekli}' sütunu yok → başlık: {baslik}")
    out = {}
    for r in it:
        if not r or r[idx["Month"]] is None:
            continue
        ay = int(float(r[idx["Month"]])) + ay_kaydir
        if ay > 36:
            continue
        out[ay] = {k: round(float(r[idx[k]]), 5) for k in ("L", "M", "S", "P3", "P15", "P50", "P85", "P97")}
    return out


def main():
    kaynak, hedef = Path(sys.argv[1]), Path(sys.argv[2])
    veri = {
        "_kaynak": "WHO Child Growth Standards (2006) — https://www.who.int/tools/child-growth-standards",
        "_lisans": "CC BY-NC-SA 3.0 IGO. Prototipte ticari olmayan kullanım, atıfla. Üretim için DSÖ izni gerekir.",
        "_not": "Aylık satırlar 0–36. Boy: 0–24 ay yatarak (length), 24–36 ay ayakta (height) tablosu; 24. ayda iki ölçüm arasında ~0,7 cm fark normaldir.",
        "_formul": "z = ((X/M)^L - 1) / (L*S); L=0 ise z = ln(X/M)/S. Persentil = Φ(z).",
    }
    for cins, ad in (("erkek", "boys"), ("kiz", "girls")):
        boy = tablo(kaynak / f"lhfa_{ad}_0_2.xlsx")
        boy.update({k: v for k, v in tablo(kaynak / f"lhfa_{ad}_2_5.xlsx").items() if k > 24})
        veri[cins] = {
            "kilo": tablo(kaynak / f"wfa_{ad}.xlsx"),
            "boy": boy,
            "basCevresi": tablo(kaynak / f"hcfa_{ad}.xlsx"),
        }
        for olcu, t in veri[cins].items():
            eksik = [a for a in range(37) if a not in t]
            if eksik:
                raise SystemExit(f"{cins}/{olcu}: eksik aylar {eksik}")
    hedef.write_text(json.dumps(veri, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"✓ {hedef} · {hedef.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
