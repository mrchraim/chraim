#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""_check_page_i18n.py — verify every referenced i18n key exists in the dictionary."""
import re, io, json, glob, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

D = {}
for p in glob.glob(os.path.join(HERE, "page_i18n_*.json")):
    D.update(json.load(io.open(p, encoding="utf-8")))
allk = set(D)

h = io.open(os.path.join(ROOT, "index.html"), encoding="utf-8-sig").read()

html_keys = set(m.group(1) for m in
                re.finditer(r'data-i18n(?:-html|-ph|-aria|-title)?="([^"]+)"', h))

js_keys = set()
for f in ["chrvvim-studio.js", "chrvvim-plus.js", "institutions-gateway.js", "index.html"]:
    t = io.open(os.path.join(ROOT, f), encoding="utf-8-sig").read()
    for m in re.finditer(r"T\('([^']+)'", t):
        js_keys.add(m.group(1))
    for m in re.finditer(r"t\(\"([^\"]+)\"", t):   # page-i18n internal calls
        js_keys.add(m.group(1))

# Dynamic keys such as T('ig.' + KIND_KEY[kind]) leave a trailing-dot prefix; drop those.
js_keys = set(k for k in js_keys if not k.endswith("."))

PREFIX = ("day.", "mytt.kind.", "dl.kind.")
def known(k):
    return k in allk or k.startswith(PREFIX) or k in ("wa.sec","wa.small","wa.join")

miss_html = sorted(k for k in html_keys if not known(k))
miss_js = sorted(k for k in js_keys if not known(k))
unused = sorted(k for k in allk if k not in html_keys and k not in js_keys)

print("dict keys      :", len(D))
print("html keys used :", len(html_keys))
print("missing (html) :", miss_html)
print("missing (js)   :", miss_js)
print("unused (dict)  :", unused)
