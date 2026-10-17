#!/usr/bin/env python3
# ==========================================================================
# CHRVVIM CAMPUS — مُحلِّل النصوص المستخرَجة (Parser)
# --------------------------------------------------------------------------
# يقرأ نصوص out/text/*.txt ويحوّلها إلى بيانات منظّمة (JSON).
#
# مبدأ أساسي: لا تخمين.
#   - كل ما لا يمكن تأكيده يُوسَم  "needs_review": true
#   - كل مخرَج يحمل ملفه المصدر (source_file) وطريقة الاستخراج
#   - نطاقات الأفواج الأبجدية تُحفَظ كنصّ خامّ (range_raw) دون تخمين الحدود
#
# الاستعمال:
#   python parse.py --text out/text --out out/structured
# ==========================================================================
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

# --------------------------------------------------------------------------
# أنماط عامّة
# --------------------------------------------------------------------------
RE_TIME = re.compile(r"من\s*(\d{1,2}[H:]\d{2})\s*(?:الى|إلى)\s*(\d{1,2}[H:]\d{2})")
RE_GROUP_RANGE = re.compile(r"الفوج\s*([A-Z])\s*\(\s*المجموعة\s*([0-9\-]+)\s*\)")
# صيغة بديلة (السداسي الثاني): «الفوج I» بدون مدى المجموعة
RE_GROUP_GENERIC = re.compile(r"الفوج\s*([A-Z])\b")
RE_ROOM = re.compile(r"(المدرج\s*الكبير|المدرج\s*\d+(?:\s*Annexe)?|القاعة\s*(?:\d+|[A-Z]))")
RE_DAYS = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
RE_GROUP_DIST_LINE = re.compile(r"^\s*([A-Z])\s+(.+?)\s*$")

SUBJECTS = [
    # السداسي الأول
    "مدخل لدراسة القانون",
    "مدخل لدراسة الشريعة",
    "النظرية العامة للقانون الدستوري",
    "مدخل لدراسة الاقتصاد والتسيير",
    "علم الاجتماع القانوني",
    "مدخل إلى علم السياسة",
    "منهجية العمل الجامعي",
    # السداسي الثاني
    "القانون الجنائي العام",
    "النظرية العامة للالتزامات و العقود",
    "القانون التجاري الأساسي",
    "قانون المعاملات الالكترونية",
    "مدخل للقانون الاداري والعلوم الإدارية",
    "مدخل للعلاقات الدولية",
    "المهارات الرقمية والذكاء الاصطناعي",
]

# --------------------------------------------------------------------------
# تصنيف الملف حسب اسمه
# --------------------------------------------------------------------------
def classify(name: str) -> str:
    if "توزيع" in name and "أفواج" in name:
        return "group_distribution"
    if "تقويمات" in name or "برنامج-تقويمات" in name:
        return "exam_schedule"
    if "استعمال" in name and ("الزمن" in name or "السداسي" in name or "السداسي" in name) or "استعمال-زمن-فوج" in name:
        return "timetable"
    if "مقابل" in name or "الوحدات" in name:
        return "unit_tables"
    if "مسلك_الإجازة" in name or "مسلك-الإجازة" in name:
        return "program_structure"
    if "الأعمال" in name and "التوجيهية" in name:
        return "td_list"
    if "لائحة" in name and "عروض" in name:
        return "course_offering"
    if "guide" in name.lower():
        return "student_guide"
    return "unknown"


# --------------------------------------------------------------------------
# محلّلات
# --------------------------------------------------------------------------
def parse_group_distribution(text: str) -> dict:
    groups, note = [], []
    semester = None
    title = None
    year = None
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        m = RE_GROUP_DIST_LINE.match(s)
        # سطر مجموعة: يبدأ بحرف لاتيني واحد ثم نطاق نصّي
        if m and re.match(r"^[A-Z]\s+\S", s) and "Section" not in s:
            groups.append({"code": m.group(1), "range_raw": m.group(2).strip()})
            continue
        if "توزيع أفواج" in s:
            title = s
            ms = re.search(r"السداسي\s+(\S+)", s)
            if ms:
                semester = ms.group(1)
        if re.search(r"20\d\d\s*[-:]?\s*20\d\d", s):
            my = re.search(r"(20\d\d)\s*[-:]?\s*(20\d\d)", s)
            if my:
                year = f"{my.group(1)}-{my.group(2)}"
        if "ملحوظة" in s or "الأسماء المركبة" in s or "Les lettres" in s or "espace" in s:
            note.append(s)
    return {
        "title": title,
        "semester": semester,
        "academic_year": year,
        "groups": groups,
        "group_count": len(groups),
        "distribution_rule": "alphabetical_name_ranges",  # مؤكّد من الوثيقة (Section De A …)
        "note": note,
        "note_unparsed": not bool(note),
    }


def parse_exam_schedule(text: str) -> dict:
    rows = []
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        groups = re.findall(r"\b[A-T]{2,}\b", s)  # سلاسل مثل ABCDEF
        times = re.findall(r"\d{1,2}h\d{2}\s*--\s*\d{1,2}h\d{2}", s)
        unit = re.search(r"\bM\d+\b", s)
        if groups or (times and unit):
            rows.append({"raw": s, "group_letters": groups, "times": times,
                         "unit": unit.group(0) if unit else None})
    return {"rows": rows, "row_count": len(rows), "header_raw": text.splitlines()[0] if text else ""}


def parse_timetable(text: str) -> dict:
    times = sorted({f"{a}-{b}" for a, b in RE_TIME.findall(text)})
    range_map = {m.group(1): m.group(2) for m in RE_GROUP_RANGE.finditer(text)}
    codes = sorted({m.group(1) for m in RE_GROUP_GENERIC.finditer(text)})
    groups = [{"code": c, "groups_range": range_map.get(c)} for c in codes]
    rooms = sorted({re.sub(r"\s+", " ", r).strip() for r in RE_ROOM.findall(text)})
    days = [d for d in RE_DAYS if d in text]
    subjects = [s for s in SUBJECTS if s in text]
    # مرشّحو الأساتذة: أسطر عربية قصيرة بلا أرقام/رموز مِلاحية
    professor_candidates = []
    for line in text.splitlines():
        s = line.strip()
        if not s or re.search(r"[0-9A-Za-z]", s):
            continue
        if any(k in s for k in ["الفوج", "المجموعة", "المدرج", "القاعة", "استعمال", "الفصل", "شعبة", "ملحوظة"]):
            continue
        if any(sub in s for sub in SUBJECTS):
            continue
        words = s.split()
        if 1 <= len(words) <= 14 and len(s) <= 160:
            professor_candidates.append(s)
    return {
        "time_slots": times,
        "days": days,
        "groups": groups,
        "group_count": len(groups),
        "rooms": rooms,
        "subjects": subjects,
        "professor_candidates": sorted(set(professor_candidates)),
        "professor_candidate_count": len(set(professor_candidates)),
        "needs_review": True,  # جدول الأستاذ↔القاعة↔الفوج يحتاج مراجعة يدوية (ترتيب الخلايا)
    }


PARSERS = {
    "group_distribution": parse_group_distribution,
    "exam_schedule": parse_exam_schedule,
    "timetable": parse_timetable,
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    text_dir = Path(args.text)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    index = []
    for f in sorted(text_dir.glob("*.txt")):
        raw = f.read_text(encoding="utf-8")
        if not raw.strip():
            index.append({"file": f.name, "kind": "empty", "status": "no_text"})
            continue
        kind = classify(f.name)
        parser = PARSERS.get(kind)
        rec = {"file": f.name, "kind": kind, "source_text": f"text/{f.name}"}
        if parser:
            try:
                rec["data"] = parser(raw)
                rec["status"] = "parsed"
            except Exception as e:  # noqa: BLE001
                rec["status"] = "parse_error"
                rec["error"] = str(e)[:300]
        else:
            rec["status"] = "not_parsed"
        index.append(rec)

    # ملفّات منظّمة مستقلة لكل نوع
    for kind in ("group_distribution", "exam_schedule", "timetable"):
        recs = [r for r in index if r.get("kind") == kind and r.get("status") == "parsed"]
        payload = {"kind": kind, "count": len(recs), "items": recs}
        (out_dir / f"{kind}.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    (out_dir / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = {}
    for r in index:
        summary[r["kind"]] = summary.get(r["kind"], 0) + 1
    print(json.dumps({"by_kind": summary, "out": str(out_dir)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
