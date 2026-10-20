#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""إدراج روابط الأيقونة (favicon.ico + apple-touch-icon) في رؤوس الصفحات الناقصة."""
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ICONS = (
    '<link rel="icon" type="image/x-icon" href="/favicon.ico">'
    '<link rel="apple-touch-icon" href="/assets/chrvvim-icon.svg">'
)

TARGETS = [
    "academic-offer.html",
    "academic-updates.html",
    "offline.html",
    "rafiq-altalib.html",
    "students-guide.html",
    "university-directory.html",
]

for name in TARGETS:
    path = os.path.join(ROOT, name)
    with io.open(path, encoding="utf-8", newline="") as fh:
        html = fh.read()
    if 'rel="icon"' in html:
        print(f"  = {name}: فيه أيقونة سابقًا")
        continue
    # نُدرج بعد وسم theme-color إن وُجد، وإلا بعد <title>...</title>
    m = re.search(r'<meta name="theme-color"[^>]*>', html)
    if m:
        new = html[:m.end()] + ICONS + html[m.end():]
    else:
        m = re.search(r'<title>.*?</title>', html, re.S)
        if not m:
            print(f"  ! {name}: ما لقيتش موضع الإدراج")
            continue
        new = html[:m.end()] + ICONS + html[m.end():]
    with io.open(path, "w", encoding="utf-8", newline="") as fh:
        fh.write(new)
    print(f"  ✔ {name}")
