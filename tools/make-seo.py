#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""يولّد robots.txt و sitemap.xml للموقع الموحّد CHRAIM.

الاستعمال:
    python tools/make-seo.py --base https://your-domain.example
    python tools/make-seo.py            # يستعمل القيمة الافتراضية أدناه
"""
import os
import io
import sys
import argparse
import datetime

DEFAULT_BASE = "https://chraim.pages.dev"   # ← بدّلها بالدومين الحقيقي بعد النشر

# صفحات المحتوى الثابتة (نسبية من جذر الموقع)
FIXED = [
    "",                                 # الصفحة الرئيسية
    "portal.html",
    "etablissements/",
    "platform/",
    "university-directory.html",
    "academic-offer.html",
    "academic-updates.html",
    "rafiq-altalib.html",
    "students-guide.html",
]

# صفحات لا تُفهرَس ولا تدخل خريطة الموقع
NOINDEX = {
    "admin.html", "offline.html", "404.html",
    "platform/login.html", "platform/account.html", "platform/dashboard.html",
}

# مجلّدات تُضاف كل صفحاتها تلقائياً
SCAN_DIRS = ["etablissements"]


def collect(root):
    pages = [p for p in FIXED if p not in NOINDEX]
    for d in SCAN_DIRS:
        full = os.path.join(root, d)
        if not os.path.isdir(full):
            continue
        for f in sorted(os.listdir(full)):
            if f.lower().endswith(".html") and f.lower() != "index.html":
                rel = "%s/%s" % (d, f)
                if rel in NOINDEX:
                    continue
                pages.append(rel)
    # إزالة التكرار مع الحفاظ على الترتيب
    seen, out = set(), []
    for p in pages:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def write_robots(root, base):
    lines = [
        "# CHRAIM / CHRVVIM Campus — robots.txt",
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin.html",
        "Disallow: /archive/",
        "Disallow: /vendor/",
        "Disallow: /_dev/",
        "Disallow: /tools/",
        "Disallow: /platform/dashboard.html",
        "Disallow: /platform/account.html",
        "Disallow: /documents/",          # ملفات PDF للطلبة: متاحة لكن غير مفهرسة
        "",
        "Sitemap: %s/sitemap.xml" % base.rstrip("/"),
        "",
    ]
    io.open(os.path.join(root, "robots.txt"), "w", encoding="utf-8", newline="\n").write("\n".join(lines))


def write_sitemap(root, base, pages):
    today = datetime.date.today().isoformat()
    base = base.rstrip("/")
    rows = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in pages:
        loc = "%s/%s" % (base, p) if p else base + "/"
        pri = "1.0" if p == "" else ("0.9" if p in ("portal.html", "etablissements/") else "0.7")
        rows.append("  <url>")
        rows.append("    <loc>%s</loc>" % loc)
        rows.append("    <lastmod>%s</lastmod>" % today)
        rows.append("    <changefreq>weekly</changefreq>")
        rows.append("    <priority>%s</priority>" % pri)
        rows.append("  </url>")
    rows.append("</urlset>")
    io.open(os.path.join(root, "sitemap.xml"), "w", encoding="utf-8", newline="\n").write("\n".join(rows) + "\n")


def main():
    ap = argparse.ArgumentParser(description="توليد robots.txt و sitemap.xml")
    ap.add_argument("--base", default=DEFAULT_BASE)
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    args = ap.parse_args()
    root = os.path.abspath(args.root)
    pages = collect(root)
    write_robots(root, args.base)
    write_sitemap(root, args.base, pages)
    print("base   :", args.base)
    print("robots : robots.txt")
    print("sitemap: sitemap.xml  (%d رابطاً)" % len(pages))
    for p in pages:
        print("   -", p)
    return 0


if __name__ == "__main__":
    sys.exit(main())
