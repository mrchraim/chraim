# -*- coding: utf-8 -*-
"""حذف زر GitHub المكسور (404) من كل الصفحات. يحافظ على ترميز UTF-8 وأسطر CRLF."""
import io
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(ROOT)

PAT = re.compile(r'[ \t]*<a href="https://github\.com/mr1mohamed1chraim"[^>]*>GitHub</a>\r?\n')

for name in sorted(os.listdir(ROOT)):
    if not name.endswith(".html"):
        continue
    path = os.path.join(ROOT, name)
    with io.open(path, encoding="utf-8", newline="") as fh:
        html = fh.read()
    new, n = PAT.subn("", html)
    if n:
        with io.open(path, "w", encoding="utf-8", newline="") as fh:
            fh.write(new)
        print(f"  ✔ {name}: حُذف {n} رابط")
    else:
        print(f"  = {name}: لا شيء")
