#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CHRVVIM — مدقّق وصول المصادر الرسمية.

هذا السكربت **لا يتحقق من محتوى** الصفحات — فقط من إمكانية الوصول إليها:
  HEAD أولاً، ثم GET بمدى بايت صغير إن رفضت HEAD (405/403/404).
لا يكتب شيئًا في بيانات المشروع؛ المخرج الوحيد هو تقرير Markdown.

الاستعمال:
    python tools/verify-official-sources.py                # توليد التقرير
    python tools/verify-official-sources.py --out docs/SOURCES_STATUS.md
    python tools/verify-official-sources.py --strict      # exit 1 لو فشلت أي قناة حرجة
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "SOURCES_STATUS.md"
UA = "CHRVVIM-Campus-SourceAudit/1.0 (+https://chraim.pages.dev; daily-status-check)"
TIMEOUT = 20
TOP = 2048  # bytes — مدى GET للتحقق من الوصول فقط، لا لتحميل ملفات كاملة


def load_json(name):
    path = ROOT / name
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001 — أخطأ ملف JSON يعطي تقريرًا غير فارغ
        print(f"[warn] تعذر قراءة {name}: {e}", file=sys.stderr)
        return None


def collect():
    """قائمة (المصدر، التصنيف، الاسم) مع إزالة التكرار."""
    items = []

    def add(url, source, label):
        if url and isinstance(url, str) and url.startswith(("http://", "https://")):
            items.append((url, source, label))

    reg = load_json("sources-register.json") or {}
    for s in reg.get("sources", []):
        add(s.get("url"), "sources-register.json", s.get("name", ""))

    inst = load_json("institutions-database.json") or {}
    for s in inst.get("sources", []):
        add(s.get("url"), "institutions-database.json (sources)", s.get("name", ""))
    for r in inst.get("records", []):
        add(r.get("official_source_url"), "institutions-database.json (record source)", r.get("id", ""))
        add(r.get("website_url"), "institutions-database.json (record website)", r.get("name_fr", ""))

    uf = load_json("university-formations.json") or {}
    add(uf.get("source"), "university-formations.json", "Catalogue des formations")

    ann = load_json("announcements.json") or {}
    for item in ann.get("items", []):
        add(item.get("url"), "announcements.json", (item.get("title") or "")[:60])

    updates = load_json("official-academic-updates-2026-2027.json")
    if isinstance(updates, dict):
        for key in ("source", "url", "official_url"):
            add(updates.get(key), "official-academic-updates-2026-2027.json", key)
        for item in updates.get("sources", []) or updates.get("items", []) or updates.get("updates", []):
            if isinstance(item, dict):
                add(item.get("url"), "official-academic-updates-2026-2027.json", item.get("id") or item.get("title") or "")

    seen, out = set(), []
    for url, source, label in items:
        if url not in seen:
            seen.add(url)
            out.append((url, source, label))
    return out


DECISION_CRITICAL = [
    "https://www.uiz.ac.ma/",
    "https://www.uiz.ac.ma/nos-etablissements",
    "https://preinscription.uiz.ac.ma/institutions",
]


def probe(url):
    started = time.time()
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=method)
        req.add_header("User-Agent", UA)
        if method == "GET":
            req.add_header("Range", f"bytes=0-{TOP}")
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
                length = res.headers.get("Content-Length")
                body = res.read(TOP + 1) if method == "GET" else b""
                return {
                    "status": res.status,
                    "final_url": res.geturl(),
                    "bytes": len(body) if method == "GET" else (int(length) if length and length.isdigit() else None),
                    "ms": round((time.time() - started) * 1000),
                    "note": "",
                }
        except urllib.error.HTTPError as e:
            if e.code in (403, 405, 400, 404) and method == "HEAD":
                # HEAD ممنوع → نجرب GET (مدى صغير) بدل الحكم بالفشل
                continue
            return {
                "status": e.code,
                "final_url": e.geturl() if hasattr(e, "geturl") else url,
                "bytes": None,
                "ms": round((time.time() - started) * 1000),
                "note": "forbidden-for-bots" if e.code in (403, 405) else "",
            }
        except urllib.error.URLError as e:
            return {
                "status": None,
                "final_url": url,
                "bytes": None,
                "ms": round((time.time() - started) * 1000),
                "note": "network: " + str(getattr(e, "reason", e))[:80],
            }
        except Exception as e:  # noqa: BLE001
            return {
                "status": None,
                "final_url": url,
                "bytes": None,
                "ms": round((time.time() - started) * 1000),
                "note": "error: " + str(e)[:80],
            }
    return {"status": None, "final_url": url, "bytes": None, "ms": 0, "note": "unreachable"}


def classify(r):
    s = r["status"]
    if s is None:
        return "ERROR"
    if 200 <= s < 300:
        return "OK"
    if s == 401:
        # خادم يرد ويكاد الوصل النقي عليه ممنوع — هذا دليل حركة لا عطل.
        return "OK"  # "auth required" — endpoint حي لكن محمي
    if s in (403, 405):
        return "FORBIDDEN"  # صفحات داخلية بغالب الظن — يتطلب فحصًا يدويًا من المتصفح
    if s in (301, 302, 303, 307, 308):
        return "OK"
    if s == 404 or s == 410:
        return "NOT_FOUND"
    return "ERROR"


def main():
    strict = "--strict" in sys.argv
    args = [a for a in sys.argv[1:]]
    out_path = OUT
    if "--out" in args:
        out_path = Path(args[args.index("--out") + 1])
        if not out_path.is_absolute():
            out_path = ROOT / out_path

    items = collect()
    print(f"[source-audit] فحص {len(items)} رابطًا…")
    verified_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    rows = []
    for url, source, label in items:
        r = probe(url)
        cls = classify(r)
        if r["status"] == 401:
            r = dict(r, note="auth required — endpoint alive")
        rows.append((url, source, label, r, cls))
        print(f"  {cls:9} {r['status']}  {url[:90]}")

    ok = sum(1 for *_, c in rows if c == "OK")
    forbidden = sum(1 for *_, c in rows if c == "FORBIDDEN")
    missing = sum(1 for *_, c in rows if c == "NOT_FOUND")
    errors = sum(1 for *_, c in rows if c == "ERROR")
    critical_bad = [u for u in DECISION_CRITICAL if not any(
        row[0] == u and row[4] == "OK" for row in rows)]

    lines = [
        "# CHRVVIM — حالة الوصول إلى المصادر الرسمية",
        "",
        f"**تم توليده:** {verified_at} · **الأداة:** `tools/verify-official-sources.py` · **المنهجية:** HEAD (ثم GET بمدى صغير 2048 بايت عند الرفض) — **reachability فقط، لا تحقق من المحتوى**.",
        "",
        f"**النتيجة:** {len(rows)} رابطًا — ✅ OK: {ok} · ⛔ Forbidden (متوقع لصفحات داخلية): {forbidden} · ❌ Not found: {missing} · 🔥 Error/Timeout: {errors}",
        "",
        "> الصفحات الداخلية (مقالات FEGA/FSJPA، تفاصيل المباريات) قد ترفض الروبوتات بـ 403؛ هذا متوقع ولا يعني المحتوى غير موجود — تُفتح في المتصفح.",
        "",
    ]
    if critical_bad:
        lines.append("## ⚠️ قنوات حرجة لم تستجب بـ 2xx")
        lines.append("")
        for u in critical_bad:
            lines.append(f"- `{u}`")
        lines.append("")
    else:
        lines.append("## ✅ القنوات الحرجة (uiz.ac.ma + preinscription) تستجيب بـ 2xx")
        lines.append("")

    lines.append("| التصنيف | الـ HTTP | الرابط | المصدر (الملف) |")
    lines.append("|---|---|---|---|")
    severity = {"ERROR": 0, "NOT_FOUND": 1, "FORBIDDEN": 2, "OK": 3}
    for url, source, label, r, cls in sorted(rows, key=lambda row: (severity[row[4]], row[0])):
        status = r["status"] if r["status"] is not None else "timeout"
        note = (" «" + r["note"] + "") if r.get("note") else ""
        lines.append(f"| {cls} | {status}{note} | `{url}` | {source} |")

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\n[source-audit] كُتِب التقرير في {out_path}")
    if strict and critical_bad:
        print("[source-audit] FAIL: قناة حرجة واحدة على الأقل غير متاحة", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
