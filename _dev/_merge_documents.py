# -*- coding: utf-8 -*-
"""
Merge the incoming UIZ document index (CSV, 40 rows) into:
  1) documents-index.json  -> additive "external" array (keeps the 33 local PDFs)
  2) campus-data.js DOCS   -> external official links, marked {ext:1, src:...}
                             so they appear in the documents panel next to the PDFs.

Nothing is deleted: existing DOCS entries and documents-index items are preserved.
"""
import csv, io, json, os, re, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, "_dev", "incoming-2026-10-17", "CHRVVIM_Uiz_Document_Index 2.csv")
DOCS_INDEX = os.path.join(ROOT, "documents-index.json")
CAMPUS = os.path.join(ROOT, "campus-data.js")

rows = list(csv.reader(open(CSV_PATH, encoding="utf-8")))
header, data = rows[0], [r for r in rows[1:] if any(c.strip() for c in r)]
COL = {name.strip().lstrip("\ufeff"): i for i, name in enumerate(header)}
print("CSV header:", header)
print("CSV rows  :", len(data))


def g(row, name):
    i = COL.get(name)
    return (row[i].strip() if i is not None and i < len(row) else "")


def sem(s):
    u = (s or "").upper()
    for k in ("S1", "S3", "S5"):
        if k in u:
            return k
    return ""


def kind(dtype):
    d = dtype or ""
    if "استعمال الزمن" in d or "جداول الماستر" in d or "بوابة استعمالات الزمن" in d:
        return "tt"
    if any(w in d for w in ("مجموعات", "لوائح", "لائحة", "توزيع", "تقويم")):
        return "dist"
    return "ext"


external, ext_docs = [], []
for r in data:
    etab = g(r, "المؤسسة")
    semv = g(r, "الفصل/المستوى")
    subj = g(r, "الشعبة/المسلك")
    dtype = g(r, "نوع الوثيقة")
    year = g(r, "السنة الجامعية")
    url = g(r, "الرابط الأصلي")
    note = g(r, "حالة التحقق / ملاحظات")
    if not url:
        continue
    rec = {"etablissement": etab, "semester": semv, "program": subj, "type": dtype,
           "year": year, "url": url, "note": note}
    external.append(rec)
    title = (dtype + " — " + subj).strip(" —")
    ext_docs.append({
        "f": url,
        "t": title + " (" + etab + ")",
        "s": sem(semv),
        "l": "ar",
        "k": kind(dtype),
        "ext": 1,
        "src": etab,
    })

print("external links:", len(external))

# ---------- 1) documents-index.json ----------
di = json.load(open(DOCS_INDEX, encoding="utf-8"))
di["external"] = external
di["external_count"] = len(external)
di["external_source"] = "CHRVVIM_Uiz_Document_Index (official UIZ faculty pages, 2026-10-17)"
json.dump(di, open(DOCS_INDEX, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("documents-index.json: items=%d external=%d" % (len(di.get("items", [])), len(external)))

# ---------- 2) campus-data.js DOCS ----------
src = open(CAMPUS, encoding="utf-8").read()
m = re.search(r"DOCS:\s*(\[)", src)
assert m, "DOCS: not found"
start = m.start(1)
# bracket-scan honouring strings
depth, i, in_str, esc = 0, start, None, False
while i < len(src):
    ch = src[i]
    if in_str:
        if esc:
            esc = False
        elif ch == "\\":
            esc = True
        elif ch == in_str:
            in_str = None
    else:
        if ch in "\"'":
            in_str = ch
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                break
    i += 1
end = i + 1
arr = json.loads(src[start:end])
print("existing DOCS:", len(arr))
arr = arr + ext_docs
new_json = json.dumps(arr, ensure_ascii=False)
src2 = src[:start] + new_json + src[end:]
open(CAMPUS, "w", encoding="utf-8", newline="").write(src2)
print("campus-data.js DOCS:", len(arr), "(+%d external)" % len(ext_docs))
