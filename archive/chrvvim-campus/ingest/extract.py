#!/usr/bin/env python3
# ==========================================================================
# CHRVVIM CAMPUS — مُستخرِج البيانات (Ingestion / Extraction)
# --------------------------------------------------------------------------
# يستخرج النصّ من: PDF, DOCX, PPTX, XLSX, CSV, TXT, وأي ملف نصّي.
# لا يستنتج ولا يخترع: يكتفي باستخراج ما هو موجود فعلاً في الملف،
# ويحتفظ بالربط بين كل مخرَج وملفه الأصلي (المصدر).
#
# الاستعمال:
#   python extract.py --src "G:\My Drive" --out out --include "استعمال الزمن"
#   python extract.py --src "G:\My Drive" --out out --include "توزيع أفواج"
#
# المخرجات (داخل --out):
#   manifest.json     فهرس كل ملف: الاسم، النوع، الحجم، الصفحات، عدد الأحرف، البصمة، الحالة
#   text/<slug>.txt   النصّ الخام المستخرَج لكل ملف
#   report.md         تقرير مقروء (جرد + ما نجح وما فشل)
# ==========================================================================
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import re
import sys
import unicodedata
import zipfile
from pathlib import Path

# --------------------------------------------------------------------------
# أدوات نصّية
# --------------------------------------------------------------------------
_LRM = "\u200e"  # علامة اتجاه تُضاف أحياناً قبل اسم الملف على Windows/Drive


def clean_name(name: str) -> str:
    return name.replace(_LRM, "").strip()


def slugify(name: str) -> str:
    s = clean_name(name)
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[^\w\u0600-\u06FF.-]+", "-", s, flags=re.UNICODE)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s[:120] or "file"


def norm_text(t: str) -> str:
    return t.replace("\u00a0", " ").replace("\r\n", "\n").replace("\r", "\n")


# --------------------------------------------------------------------------
# مُستخرِجات الصيغ
# --------------------------------------------------------------------------
def from_pdf(path: Path):
    from pypdf import PdfReader
    reader = PdfReader(str(path))
    parts, pages = [], len(reader.pages)
    for pg in reader.pages:
        try:
            parts.append(pg.extract_text() or "")
        except Exception as e:  # noqa: BLE001
            parts.append(f"<page extract error: {e}>")
    return "\n\f\n".join(parts), {"pages": pages, "method": "pypdf"}


def _zip_xml_text(path: Path, member_pred) -> str:
    out = []
    with zipfile.ZipFile(path) as z:
        names = [n for n in z.namelist() if member_pred(n)]
        names.sort()
        for n in names:
            try:
                xml = z.read(n).decode("utf-8", "ignore")
            except Exception:  # noqa: BLE001
                continue
            out.append(re.sub(r"<[^>]+>", " ", xml))
    return re.sub(r"[ \t]{2,}", " ", "\n".join(out))


def from_docx(path: Path):
    # w:t يحمل النصّ الفعلي؛ نستخرج فقط وسوم <w:t>
    text = []
    with zipfile.ZipFile(path) as z:
        for n in z.namelist():
            if n.startswith("word/") and n.endswith(".xml"):
                xml = z.read(n).decode("utf-8", "ignore")
                for m in re.finditer(r"<w:t[^>]*>(.*?)</w:t>", xml, re.S):
                    text.append(m.group(1))
                text.append("\n")
    return "".join(text), {"method": "docx-xml"}


def from_pptx(path: Path):
    return _zip_xml_text(path, lambda n: n.startswith("ppt/slides/slide") and n.endswith(".xml")), {"method": "pptx-xml"}


def from_xlsx(path: Path):
    shared = []
    with zipfile.ZipFile(path) as z:
        if "xl/sharedStrings.xml" in z.namelist():
            sx = z.read("xl/sharedStrings.xml").decode("utf-8", "ignore")
            shared = [re.sub(r"<[^>]+>", "", m.group(1)) for m in re.finditer(r"<si>(.*?)</si>", sx, re.S)]
    rows = []
    with zipfile.ZipFile(path) as z:
        sheets = sorted(n for n in z.namelist() if re.match(r"xl/worksheets/sheet\d+\.xml$", n))
        for n in sheets:
            sx = z.read(n).decode("utf-8", "ignore")
            for r in re.finditer(r"<row[^>]*>(.*?)</row>", sx, re.S):
                cells = []
                for c in re.finditer(r"<c[^>]*?(?:t=\"(\w+)\")?[^>]*>(?:<v>(.*?)</v>|<is>(.*?)</is>)?</c>", r.group(1), re.S):
                    ctype, v, isv = c.group(1), c.group(2), c.group(3)
                    if ctype == "s" and v is not None:
                        try:
                            cells.append(shared[int(v)])
                        except Exception:  # noqa: BLE001
                            cells.append("")
                    elif isv:
                        cells.append(re.sub(r"<[^>]+>", "", isv))
                    else:
                        cells.append(v or "")
                rows.append("\t".join(cells))
    return "\n".join(rows), {"method": "xlsx-xml", "rows": len(rows)}


def from_csv(path: Path):
    raw = path.read_text(encoding="utf-8", errors="ignore")
    try:
        rows = list(csv.reader(io.StringIO(raw)))
        return "\n".join("\t".join(r) for r in rows), {"method": "csv", "rows": len(rows)}
    except Exception:  # noqa: BLE001
        return raw, {"method": "csv-raw"}


def from_text(path: Path):
    return path.read_text(encoding="utf-8", errors="ignore"), {"method": "text"}


EXTRACTORS = {
    ".pdf": from_pdf,
    ".docx": from_docx,
    ".pptx": from_pptx,
    ".xlsx": from_xlsx,
    ".csv": from_csv,
    ".txt": from_text,
    ".md": from_text,
}


# --------------------------------------------------------------------------
# التشغيل
# --------------------------------------------------------------------------
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="مجلد المصدر")
    ap.add_argument("--out", required=True, help="مجلد المخرجات")
    ap.add_argument("--include", action="append", default=[], help="نمط (regex) لتصفية أسماء الملفات؛ يمكن تكراره")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    src = Path(args.src)
    out = Path(args.out)
    (out / "text").mkdir(parents=True, exist_ok=True)
    pats = [re.compile(p) for p in args.include] if args.include else []

    files = []
    for p in sorted(src.rglob("*")):
        if not p.is_file():
            continue
        if pats and not any(pat.search(clean_name(p.name)) for pat in pats):
            continue
        if p.suffix.lower() not in EXTRACTORS:
            continue
        files.append(p)
    if args.limit:
        files = files[: args.limit]

    manifest, report = [], []
    seen_hash: dict[str, str] = {}

    for p in files:
        rec = {
            "file": clean_name(p.name),
            "rel": str(p.relative_to(src)),
            "ext": p.suffix.lower(),
            "size_kb": round(p.stat().st_size / 1024, 1),
        }
        try:
            text, meta = EXTRACTORS[p.suffix.lower()](p)
            text = norm_text(text)
            rec.update(meta)
            rec["chars"] = len(text)
            digest = hashlib.sha1(text.encode("utf-8", "ignore")).hexdigest()[:16]
            rec["sha1_text"] = digest
            if digest in seen_hash:
                rec["status"] = "duplicate"
                rec["duplicate_of"] = seen_hash[digest]
            else:
                seen_hash[digest] = rec["file"]
                rec["status"] = "ok" if text.strip() else "empty"
                fp = out / "text" / f"{slugify(p.name)}.txt"
                fp.write_text(text, encoding="utf-8")
                rec["text_file"] = f"text/{fp.name}"
        except Exception as e:  # noqa: BLE001
            rec["status"] = "error"
            rec["error"] = str(e)[:300]
        manifest.append(rec)

    manifest.sort(key=lambda r: (r["status"] != "ok", r["file"]))
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    ok = [r for r in manifest if r["status"] == "ok"]
    dup = [r for r in manifest if r["status"] == "duplicate"]
    err = [r for r in manifest if r["status"] == "error"]
    empty = [r for r in manifest if r["status"] == "empty"]

    L = ["# تقرير استخراج البيانات — CHRVVIM CAMPUS", ""]
    L.append(f"- إجمالي الملفات المفحوصة: {len(manifest)}")
    L.append(f"- نجح الاستخراج: {len(ok)}")
    L.append(f"- مكرّر (نفس المحتوى): {len(dup)}")
    L.append(f"- فارغ (لا نصّ قابل للاستخراج — غالباً صورة ممسوحة تحتاج OCR): {len(empty)}")
    L.append(f"- فشل: {len(err)}")
    L.append("")
    L.append("## الملفات المستخرَجة")
    for r in sorted(ok, key=lambda x: x["file"]):
        L.append(f"- `{r['file']}` — {r.get('pages', '-')} صفحة، {r['chars']} حرف، طريقة: {r.get('method','?')}")
    if dup:
        L.append("")
        L.append("## ملفات مكرّرة (لم تُستخرَج مرتين)")
        for r in dup:
            L.append(f"- `{r['file']}` = نسخة من `{r.get('duplicate_of')}`")
    if empty:
        L.append("")
        L.append("## يحتاج OCR (ملفات صور بلا طبقة نصّية)")
        for r in empty:
            L.append(f"- `{r['file']}` — {r['size_kb']} KB")
    if err:
        L.append("")
        L.append("## فشل الاستخراج")
        for r in err:
            L.append(f"- `{r['file']}` — {r.get('error')}")
    (out / "report.md").write_text("\n".join(L) + "\n", encoding="utf-8")

    print(json.dumps({
        "files": len(manifest), "ok": len(ok), "duplicate": len(dup),
        "empty": len(empty), "error": len(err), "out": str(out),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
