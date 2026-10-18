#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""فحص روابط الموقع الموحّد CHRAIM.

يمرّ على كل ملفات HTML و CSS داخل المستودع (مع استثناء مجلّدات الأرشيف
والتطبيقات الخارجية) ويتحقّق من وجود كل هدف داخلي:
  • وسوم HTML: href / src (روابط، صور، أنماط، سكربتات …)
  • مراجع CSS: url(...)
الروابط الخارجية (http/https) و mailto:/tel:/data:/# تُتجاهل.

الاستعمال:
    python tools/audit-links.py            # من جذر المستودع
    python tools/audit-links.py --root .   # تحديد جذر صريح

يعيد رمز الخروج 1 عند وجود أي رابط مكسور (مناسب لـ CI).
"""
import os
import re
import sys
import io
import argparse

EXCLUDE_DIRS = {"archive", "vendor", "_dev", "dist", "supabase", "__pycache__", "node_modules", ".git", "tools"}
SKIP_PREFIXES = ("http://", "https://", "mailto:", "tel:", "data:", "javascript:", "#", "//")

HTML_ATTR = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.I)
CSS_URL = re.compile(r'url\(\s*["\']?([^"\')]+)["\']?\s*\)', re.I)


def walk_files(root, exts):
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for f in files:
            if f.lower().endswith(exts):
                yield os.path.join(base, f)


def resolve(root, page, url):
    """يحوّل رابطاً إلى مسار على القرص؛ يعيد None للروابط المُتجاهلة."""
    u = url.strip()
    if not u or u.lower().startswith(SKIP_PREFIXES):
        return None
    path = u.split("#")[0].split("?")[0]
    if not path:
        return None
    if path.startswith("/"):
        return os.path.normpath(os.path.join(root, path.lstrip("/")))
    return os.path.normpath(os.path.join(os.path.dirname(page), path))


def exists(target):
    if os.path.exists(target):
        return True
    if os.path.isdir(target) and os.path.exists(os.path.join(target, "index.html")):
        return True
    # دليل بلا امتداد: /foo  ⇒  /foo/index.html
    if not os.path.splitext(target)[1] and os.path.exists(os.path.join(target, "index.html")):
        return True
    return False


def main():
    ap = argparse.ArgumentParser(description="فحص روابط الموقع الموحّد CHRAIM")
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()
    root = os.path.abspath(args.root)

    broken = {}
    checked = 0

    for page in walk_files(root, (".html",)):
        txt = io.open(page, encoding="utf-8", errors="replace").read()
        for m in HTML_ATTR.finditer(txt):
            target = resolve(root, page, m.group(1))
            if target is None:
                continue
            checked += 1
            if not exists(target):
                broken.setdefault(os.path.relpath(page, root), set()).add(m.group(1).strip())

    for css in walk_files(root, (".css",)):
        txt = io.open(css, encoding="utf-8", errors="replace").read()
        for m in CSS_URL.finditer(txt):
            target = resolve(root, css, m.group(1))
            if target is None:
                continue
            checked += 1
            if not exists(target):
                broken.setdefault(os.path.relpath(css, root), set()).add("url(%s)" % m.group(1).strip())

    total = sum(len(v) for v in broken.values())
    print("روابط مُتحقَّق منها : %d" % checked)
    print("ملفات بها كسر     : %d" % len(broken))
    print("روابط مكسورة      : %d" % total)
    if total and not args.quiet:
        print("")
        for rel in sorted(broken):
            print("### %s" % rel)
            for u in sorted(broken[rel]):
                print("    - %s" % u)
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
