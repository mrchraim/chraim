# -*- coding: utf-8 -*-
import io, json, os, sys, re
from collections import Counter
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAMPUS = os.path.join(ROOT, "campus-data.js")
t = open(CAMPUS, encoding="utf-8").read()
m = re.search(r"DOCS:\s*(\[)", t)
s = m.start(1)
d, i, st, es = 0, s, None, False
while i < len(t):
    c = t[i]
    if st:
        if es:
            es = False
        elif c == "\\":
            es = True
        elif c == st:
            st = None
    else:
        if c in "\"'":
            st = c
        elif c == "[":
            d += 1
        elif c == "]":
            d -= 1
            if d == 0:
                break
    i += 1
arr = json.loads(t[s:i + 1])
ext = [x for x in arr if x.get("ext")]
print("total DOCS:", len(arr), "| external:", len(ext), "| local:", len(arr) - len(ext))
for k in (0, 5, 39):
    if k < len(ext):
        print("ext[%d]:" % k, json.dumps(ext[k], ensure_ascii=False))
print("distinct src:", dict(Counter(x.get("src") for x in ext)))
print("kinds ext  :", dict(Counter(x.get("k") for x in ext)))
print("sem   ext  :", dict(Counter(x.get("s") for x in ext)))
print()
di = json.load(open(os.path.join(ROOT, "documents-index.json"), encoding="utf-8"))
print("documents-index.json keys:", list(di.keys()))
print("  items:", len(di.get("items", [])), "external:", len(di.get("external", [])))
