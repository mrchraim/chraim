#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""حقن «رمز العودة» العائم (assets/back-home.js) في كل صفحات HTML.

السكربت خامل (idempotent): يتجاهل كل صفحة تحتوي على السكربت أصلاً.
يُدرَج الوسم قبل `</body>`، أو قبل `</html>` إن لم يوجد `</body>` (مثل offline.html).

الاستعمال:
    python tools/add-back-home.py            # من جذر المستودع
    python tools/add-back-home.py --root .   # تحديد جذر صريح
"""
import os
import io
import sys
import argparse

EXCLUDE_DIRS = {"archive", "vendor", "_dev", "__pycache__", "node_modules", ".git", "tools"}
TAG = '<script src="/assets/back-home.js" defer></script>\n'


def main():
    ap = argparse.ArgumentParser(description="حقن رمز العودة العائم في صفحات HTML")
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    args = ap.parse_args()
    root = os.path.abspath(args.root)

    scanned = changed = 0
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for f in files:
            if not f.lower().endswith(".html"):
                continue
            scanned += 1
            p = os.path.join(base, f)
            txt = io.open(p, encoding="utf-8", errors="replace").read()
            if "back-home.js" in txt:
                continue
            idx = txt.rfind("</body>")
            if idx == -1:
                idx = txt.rfind("</html>")
            if idx == -1:
                continue
            io.open(p, "w", encoding="utf-8").write(txt[:idx] + TAG + txt[idx:])
            changed += 1
            print("  + %s" % os.path.relpath(p, root))

    print("صفحات مفحوصة: %d · محقونة: %d" % (scanned, changed))
    return 0


if __name__ == "__main__":
    sys.exit(main())
