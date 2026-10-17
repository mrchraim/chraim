# -*- coding: utf-8 -*-
import io, json, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
p = r"C:\Users\MOHAME~1\AppData\Local\Temp\opencode-browser-MSb0w5\0\lighthouse.json"
data = json.load(open(p, encoding="utf-8"))
aud = data["audits"]["color-contrast"]
print("score:", aud.get("score"), "| displayMode:", aud.get("scoreDisplayMode"))
items = (aud.get("details") or {}).get("items") or []
print("failing nodes:", len(items))
for it in items:
    node = it.get("node") or {}
    print("-" * 70)
    print("selector:", (node.get("selector") or "")[:160])
    print("snippet :", (node.get("snippet") or "")[:220])
    print("explain :", (it.get("node", {}).get("explanation") or it.get("explanation") or "")[:240])
