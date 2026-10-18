#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""يبني مجلّد نشر نظيف (dist/) يحتوي فقط الملفات التي يحتاجها الموقع فعلاً.

لا يحذف ولا يغيّر أي شيء في المستودع. الغاية: نشر عمومي على Cloudflare Pages
بدون تسريب ملفات داخلية (archive/, vendor/, _dev/, أدوات، سكربتات، وثائق).

الاستعمال:
    python tools/build-dist.py                 # → dist/
    python tools/build-dist.py --out dist --clean
"""

import os
import sys
import shutil
import argparse

# مجلّدات تُستثنى كلياً (بأي مستوى)
EXCLUDE_DIRS = {
    "archive", "vendor", "_dev", "tools", "supabase", "docs",
    ".git", ".github", ".wrangler", "node_modules", "__pycache__",
}

# امتدادات تُستثنى (ملفات داخلية/وثائق/سكربتات)
EXCLUDE_EXT = {
    ".md", ".py", ".pyc", ".pyo", ".sql", ".sh", ".ps1", ".bat", ".cmd",
    ".log", ".env", ".sha256", ".txt", ".yml", ".yaml", ".toml", ".lock",
}

# ملفات مسموح بها رغم استثناء امتدادها
ALLOW_FILES = {"robots.txt", "security.txt", "humans.txt", "ai.txt"}

# ملفات مسموح بها بأسمائها (إعدادات Cloudflare)
ALLOW_NAMES = {"_headers", "_redirects"}

# ملفات مستثناة بالامتداد لكن كاينين روابط ليها من صفحات الموقع
EXTRA_INCLUDE_NAMES = {
    "INSTITUTIONS_DATABASE_REPORT_AR.md",   # ← مرتبط من university-directory.html
}


def should_skip(rel_path):
    parts = rel_path.replace("\\", "/").split("/")
    if any(p in EXCLUDE_DIRS for p in parts[:-1]):
        return True
    name = parts[-1]
    if name in ALLOW_NAMES or name in ALLOW_FILES or name in EXTRA_INCLUDE_NAMES:
        return False
    if name.startswith("."):
        return True
    ext = os.path.splitext(name)[1].lower()
    return ext in EXCLUDE_EXT


def build(root, out, clean):
    out_abs = os.path.abspath(out)
    if clean and os.path.isdir(out_abs):
        shutil.rmtree(out_abs)

    copied = skipped = 0
    total = 0
    skipped_top = {}
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and d not in {".git"}]
        for f in files:
            src = os.path.join(base, f)
            rel = os.path.relpath(src, root)
            if rel.replace("\\", "/").split("/")[0] == os.path.basename(out_abs):
                continue
            if should_skip(rel):
                skipped += 1
                top = rel.replace("\\", "/").split("/")[0]
                skipped_top[top] = skipped_top.get(top, 0) + 1
                continue
            dst = os.path.join(out_abs, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            copied += 1
            total += os.path.getsize(src)

    print("dist        :", out_abs)
    print("copied      : %d ملف (%.1f MB)" % (copied, total / 1048576.0))
    print("skipped     : %d ملف" % skipped)
    print("skipped top :")
    for k in sorted(skipped_top):
        print("   - %-16s %d" % (k, skipped_top[k]))
    return 0


def main():
    ap = argparse.ArgumentParser(description="بناء مجلّد نشر نظيف")
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    ap.add_argument("--out", default="dist")
    ap.add_argument("--clean", action="store_true")
    args = ap.parse_args()
    root = os.path.abspath(args.root)
    out = args.out if os.path.isabs(args.out) else os.path.join(root, args.out)
    return build(root, out, args.clean)


if __name__ == "__main__":
    sys.exit(main())
