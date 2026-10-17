#!/usr/bin/env python3
# ==========================================================================
# CHRVVIM CAMPUS — مُولّد SQL للبيانات المستخرَجة (Extraction → Staging)
# --------------------------------------------------------------------------
# يقرأ out/structured/*.json ويُنتج ملف SQL يُدخل البيانات في «منطقة الانتظار»
# public.extracted_records بحالة status='pending' — أي أنها:
#   ⚠️ لا تُنشَر تلقائياً، بل تنتظر اعتماد المسؤول (مطابق لمبدأ طابور المراجعة).
#
# لا يُولّد أي إدخال مباشر في الجداول المنشورة (groups/subjects/sessions …).
#
# ⚠️ مطابق للمخطط المرجعي 0010_canonical_schema.sql:
#     - رأس الاستيراد: public.import_jobs
#     - منطقة الانتظار: public.extracted_records (import_job_id)
#
# الاستعمال:
#   python to_sql.py --structured out/structured --out out/sql/seed_staging.sql
# ==========================================================================
from __future__ import annotations

import argparse
import json
from pathlib import Path

# ثقة تقديرية حسب نوع الوثيقة (قابلة للتعديل من المسؤول لاحقاً)
CONFIDENCE = {
    "group_distribution": "0.90",
    "exam_schedule": "0.80",
    "timetable": "0.65",   # ترتيب الخلايا يحتاج مراجعة
}


def q(s: str) -> str:
    """تهريب النص لقيمة SQL نصّية."""
    return "'" + str(s).replace("'", "''") + "'"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--structured", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--import-note", default="استخراج آلي — ينتظر المراجعة")
    ap.add_argument("--file-type", default="mixed")
    args = ap.parse_args()

    sdir = Path(args.structured)
    index = json.loads((sdir / "index.json").read_text(encoding="utf-8"))

    parsed = [r for r in index if r.get("status") == "parsed" and r.get("data")]
    stats = {
        "ok": sum(1 for r in index if r.get("status") == "parsed"),
        "empty": sum(1 for r in index if r.get("status") == "no_text"),
        "total": len(index),
    }

    values = []
    for r in parsed:
        kind = r["kind"]
        payload = json.dumps(r["data"], ensure_ascii=False)
        conf = CONFIDENCE.get(kind, "0.50")
        values.append(
            f"    ({q(kind)}, {q(payload)}::jsonb, {conf}::numeric, 'pending', {q(r.get('source_text') or r['file'])})"
        )

    summary = json.dumps(
        {"note": args.import_note, "records": len(parsed), **stats},
        ensure_ascii=False,
    )

    lines = []
    lines.append("-- ==========================================================")
    lines.append("-- CHRVVIM CAMPUS — إدخال بيانات مستخرَجة إلى منطقة الانتظار")
    lines.append("-- مُولَّد آلياً من ingest/out/structured — لا تنشره قبل المراجعة.")
    lines.append("-- شغّله بعد 0010_canonical_schema.sql (المخطط المرجعي).")
    lines.append("-- ==========================================================")
    lines.append("begin;")
    lines.append("")
    lines.append("with imp as (")
    lines.append("  insert into public.import_jobs")
    lines.append("    (file_name, file_type, status, rows_detected, rows_new, rows_conflicting, summary, finished_at)")
    lines.append("  values (")
    lines.append(f"    {q('G:\\My Drive (مصدر الوثائق)')}, {q(args.file_type)}, 'parsed',")
    lines.append(f"    {stats['total']}, {stats['ok']}, 0,")
    lines.append(f"    {q(summary)}::jsonb, now()")
    lines.append("  )")
    lines.append("  returning id")
    lines.append(")")
    lines.append("insert into public.extracted_records (import_job_id, kind, payload, confidence, status, source_file)")
    lines.append("select imp.id, v.kind, v.payload, v.confidence, v.status, v.source_file")
    lines.append("from imp, (values")
    lines.append(",\n".join(values) if values else "    ('unknown', '{}'::jsonb, 0.50::numeric, 'pending', 'n/a')")
    lines.append(") as v(kind, payload, confidence, status, source_file);")
    lines.append("")
    lines.append("-- تحقّق:")
    lines.append("-- select kind, status, count(*) from public.extracted_records group by 1,2 order by 1;")
    lines.append("commit;")
    lines.append("")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"parsed_records": len(parsed), "out": str(out)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
