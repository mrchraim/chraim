#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""حزم لوحة الإدارة المنفصلة في admin-panel-separate.zip للرفع على Cloudflare Pages.

الاستخدام:
    python make_admin_zip.py
"""
import os
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(ROOT, "admin-separate")
OUT = os.path.join(ROOT, "admin-panel-separate.zip")

EXCLUDE = {"__pycache__", ".DS_Store", "Thumbs.db"}

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for cur, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if d not in EXCLUDE]
        for f in files:
            if f in EXCLUDE:
                continue
            fp = os.path.join(cur, f)
            z.write(fp, os.path.relpath(fp, BASE))

print(f"✔ {OUT} ({os.path.getsize(OUT)} bytes)")
