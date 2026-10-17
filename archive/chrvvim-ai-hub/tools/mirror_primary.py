#!/usr/bin/env python3
"""
Read-only mirror of the CHRVVIM primary static site.

Source : https://mr1mohamed1chraim.netlify.app/
Target : chrvvim-ai-hub/site/

This ONLY performs HTTP GET against the owner's own public static site.
It never writes to, deploys to, or modifies the remote site.
"""
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

BASE = "https://mr1mohamed1chraim.netlify.app"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
OUT = os.path.abspath(OUT)

UA = "Mozilla/5.0 (compatible; CHRVVIM-merge/1.0; read-only mirror)"
TIMEOUT = 40

# Seed URLs (relative paths).
SEEDS = [
    "/",
    "/admin.html",
    "/manifest.json",
    "/announcements.json",
    "/robots.txt",
    "/sitemap.xml",
    "/security.txt",
    "/supabase-config.js",
    "/app.js",
    "/campus-data.js",
    "/legal.js",
    "/legal-data.js",
    "/subjects.js",
    "/subjects-data.js",
    "/university-data.js",
    "/university-formations.js",
    "/assets/fonts/fonts.css",
    "/assets/founder.jpg",
    "/assets/pat-about.svg",
    "/assets/pat-dist.svg",
    "/assets/pat-docs.svg",
    "/assets/pat-gpa.svg",
    "/assets/pat-prof.svg",
    "/assets/pat-rooms.svg",
    "/assets/pat-search.svg",
    "/assets/pat-tt.svg",
    "/public/academic-guide-2026-2027.json",
    "/public/academic-guide-public.json",
    "/public/timetable-s3-draft.json",
]

DOC_NAMES = [
    "learn-code-famille.pdf", "learn-droit-penal-special.pdf",
    "learn-gouvernance-judiciaire.pdf", "learn-justiciables-gouvernance.pdf",
    "learn-procedure-penale.pdf", "s1-fr-private.pdf", "s1-fr-public.pdf",
    "s1-private-groups.pdf", "s1-private-timetable.pdf", "s1-public-groups.pdf",
    "s1-public-timetable.pdf", "s3-fr-private.pdf", "s3-fr-public.pdf",
    "s3-private-groups.pdf", "s3-private-timetable.pdf", "s3-public-french-groups.pdf",
    "s3-public-groups.pdf", "s3-public-timetable.pdf", "s5-admin-finance-timetable.pdf",
    "s5-business-english-groups.pdf", "s5-business-groups.pdf", "s5-business-timetable.pdf",
    "s5-civil-english-groups.pdf", "s5-civil-groups.pdf", "s5-civil-timetable.pdf",
    "s5-criminal-timetable.pdf", "s5-fr-affaires.pdf", "s5-fr-contentieux.pdf",
    "s5-fr-institutions.pdf", "s5-political-intl-timetable.pdf",
    "s5-professions-english-groups.pdf", "s5-professions-groups.pdf",
    "s5-professions-timetable.pdf",
]
SEEDS += ["/documents/" + d for d in DOC_NAMES]

TEXT_EXT = {".html", ".css", ".js", ".json", ".xml", ".txt", ".webmanifest"}
ASSET_EXT = {".js", ".css", ".svg", ".jpg", ".jpeg", ".png", ".webp",
             ".gif", ".woff2", ".woff", ".ttf", ".pdf", ".json", ".webmanifest"}

# Ref regex: absolute (/path) or bare filename with a known asset extension.
REF_RE = re.compile(r"""(?:url\(\s*['"]?|["'(\s])((?:/|\.\.?/)?[A-Za-z0-9_./\-]+\.(?:js|css|svg|jpe?g|png|webp|gif|woff2?|ttf|pdf|json|webmanifest))""")

report = {"ok": [], "fallback": [], "error": [], "skipped_external": 0}


def local_path(rel):
    rel = rel.split("?", 1)[0].split("#", 1)[0]
    if rel in ("", "/"):
        rel = "/index.html"
    rel = rel.lstrip("/")
    return os.path.join(OUT, rel.replace("/", os.sep))


def fetch(rel):
    url = BASE + rel
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = resp.read()
            ctype = resp.headers.get("Content-Type", "")
            status = resp.status
    except urllib.error.HTTPError as e:
        body = e.read()
        ctype = e.headers.get("Content-Type", "") if e.headers else ""
        status = e.code
    except Exception as e:  # noqa
        report["error"].append({"path": rel, "err": str(e)})
        return None, None
    return status, body, ctype


def is_fallback(rel, ctype):
    ext = os.path.splitext(rel.split("?")[0])[1].lower()
    if ext in (".html", "", ".txt", ".xml"):
        return False
    # A non-HTML asset served as text/html is the SPA fallback (not a real asset).
    return "text/html" in ctype


def main():
    os.makedirs(OUT, exist_ok=True)
    queue = list(dict.fromkeys(SEEDS))
    seen = set()
    manifest = []

    while queue:
        rel = queue.pop(0)
        if rel in seen:
            continue
        seen.add(rel)
        # Collapse /public/<x> and /<x> duplicates? keep both; they are real routes.
        status, body, ctype = fetch(rel)
        if status is None:
            continue
        if status != 200 or is_fallback(rel, ctype):
            report["fallback"].append({"path": rel, "status": status, "ctype": ctype})
            continue
        dest = local_path(rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as fh:
            fh.write(body)
        report["ok"].append({"path": rel, "bytes": len(body), "ctype": ctype})
        manifest.append(rel)
        ext = os.path.splitext(rel)[1].lower()
        if ext in TEXT_EXT:
            try:
                text = body.decode("utf-8", "replace")
            except Exception:
                text = ""
            for m in REF_RE.finditer(text):
                ref = m.group(1)
                if ref.startswith(("http://", "https://", "//", "data:", "mailto:")):
                    report["skipped_external"] += 1
                    continue
                if ref.startswith("/"):
                    cand = ref
                else:
                    # relative to current file dir
                    base_dir = os.path.dirname(rel)
                    cand = os.path.normpath(os.path.join(base_dir, ref)).replace(os.sep, "/")
                    cand = "/" + cand.lstrip("/")
                if cand not in seen and os.path.splitext(cand)[1].lower() in ASSET_EXT:
                    queue.append(cand)
        time.sleep(0.05)

    with open(os.path.join(OUT, "..", "docs", "_mirror_manifest.json"), "w", encoding="utf-8") as fh:
        json.dump({"base": BASE, "saved": report["ok"], "fallback": report["fallback"],
                   "error": report["error"]}, fh, ensure_ascii=False, indent=2)

    print("saved    :", len(report["ok"]))
    print("fallback :", len(report["fallback"]))
    print("errors   :", len(report["error"]))
    for f in report["fallback"]:
        print("  fallback:", f["path"], f["status"], f["ctype"])
    for e in report["error"]:
        print("  error   :", e["path"], e["err"])


if __name__ == "__main__":
    sys.exit(main())
