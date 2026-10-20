#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
توليد CSP صارم (بلا unsafe-inline) عبر هاشات SHA-256 للكتل المضمّنة،
ثم تحديث ملف `_headers` تلقائيًا.

الاستخدام:
    python tools/build_csp.py            # توليد + عرض القيم فقط
    python tools/build_csp.py --write    # توليد + كتابة القيم داخل _headers
"""
import argparse
import base64
import hashlib
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ADMIN_DIR = os.path.join(os.path.dirname(ROOT), "admin-separate")

# الأصول الخارجية المسموح بها (بعد التحقّق من الجرد)
SUPABASE = "https://idpafbyefrywjixskvvu.supabase.co"
SCRIPT_EXTRA = []
STYLE_EXTRA = ["https://fonts.googleapis.com"]
FONT_EXTRA = ["https://fonts.gstatic.com", "https://fonts.googleapis.com"]

# إعدادات لوحة الإدارة المنفصلة
ADMIN_SCRIPT_EXTRA = ["https://cdn.jsdelivr.net"]
ADMIN_STYLE_EXTRA = []
ADMIN_FONT_EXTRA = []


def sha256_b64(text: str) -> str:
    """CSP hash: sha256 of the EXACT bytes of the inline block."""
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    return "'sha256-" + base64.b64encode(digest).decode("ascii") + "'"


def collect(base=ROOT):
    scripts, styles = set(), set()
    pages = sorted(f for f in os.listdir(base) if f.endswith(".html"))
    for name in pages:
        html = open(os.path.join(base, name), encoding="utf-8").read()
        for attrs, body in re.findall(r"<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>", html, re.S | re.I):
            if "application/ld+json" in attrs.lower():
                continue  # non-executable data block — not covered by script-src
            scripts.add(sha256_b64(body))
        for body in re.findall(r"<style[^>]*>(.*?)</style>", html, re.S | re.I):
            styles.add(sha256_b64(body))
    return sorted(scripts), sorted(styles)


def build_main(scripts, styles):
    script_src = " ".join(["'self'"] + SCRIPT_EXTRA + scripts)
    style_src = " ".join(["'self'"] + STYLE_EXTRA + styles)
    font_src = " ".join(["'self'", "data:"] + FONT_EXTRA)
    csp = "; ".join([
        "default-src 'self'",
        f"script-src {script_src}",
        f"style-src {style_src}",
        f"font-src {font_src}",
        "img-src 'self' data: blob:",
        f"connect-src 'self' {SUPABASE} wss://idpafbyefrywjixskvvu.supabase.co",
        "media-src 'self'",
        "worker-src 'self'",
        "manifest-src 'self'",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
        "block-all-mixed-content",
        "report-uri /cdn-cgi/csp-report",
    ])
    return csp


def build_admin(scripts, styles):
    script_src = " ".join(["'self'"] + ADMIN_SCRIPT_EXTRA + scripts)
    style_src = " ".join(["'self'"] + ADMIN_STYLE_EXTRA + styles)
    font_src = " ".join(["'self'", "data:"] + ADMIN_FONT_EXTRA)
    csp = "; ".join([
        "default-src 'self'",
        f"script-src {script_src}",
        f"style-src {style_src}",
        f"font-src {font_src}",
        "img-src 'self' data:",
        f"connect-src 'self' {SUPABASE} wss://idpafbyefrywjixskvvu.supabase.co",
        "media-src 'none'",
        "worker-src 'self'",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
        "block-all-mixed-content",
        "report-uri /cdn-cgi/csp-report",
    ])
    return csp


def write_into(headers_path, csp):
    text = open(headers_path, encoding="utf-8").read()
    new, n = re.subn(
        r"(?m)^(\s*)Content-Security-Policy:.*$",
        lambda m: m.group(1) + "Content-Security-Policy: " + csp,
        text,
        count=1,
    )
    if n == 0:
        return False
    open(headers_path, "w", encoding="utf-8", newline="").write(new)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="اكتب الـ CSP داخل _headers")
    ap.add_argument("--admin", action="store_true", help="استهدف لوحة الإدارة المنفصلة (admin-separate)")
    args = ap.parse_args()

    base = ADMIN_DIR if args.admin else ROOT
    builder = build_admin if args.admin else build_main
    if not os.path.isdir(base):
        print(f"! المجلد غير موجود: {base}", file=sys.stderr)
        return 1

    scripts, styles = collect(base)
    csp = builder(scripts, styles)
    print(f"الهدف: {base}")
    print(f"عدد هاشات السكربتات: {len(scripts)}")
    print(f"عدد هاشات الأنماط:  {len(styles)}")
    print("\n--- Content-Security-Policy ---")
    print(csp)

    if args.write:
        path = os.path.join(base, "_headers")
        if not write_into(path, csp):
            print(f"! لم يُعثر على سطر Content-Security-Policy في {path}", file=sys.stderr)
            return 1
        print(f"\n✔ حُدِّث {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
