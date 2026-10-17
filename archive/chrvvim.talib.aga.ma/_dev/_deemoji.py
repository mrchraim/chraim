# -*- coding: utf-8 -*-
"""Strip leading 'icon-emoji' from selected i18n label values in app.js (ar/fr/en)."""
import io, os, re, sys, shutil

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "app.js")
BAK = os.path.join(ROOT, "app.js.pre-emoji.bak")

KEYS = ["btn.showTT", "btn.saveGrp", "btn.saveMyGrp", "btn.whatsapp", "btn.copy",
        "btn.saveAsGrp", "btn.addCourse", "hdr.tt", "hdr.myGrp", "gate.title",
        "gate.ok", "nav.title", "legal.head"]
EMO = ["🗓️", "🗓", "⭐", "📤", "📋", "➕", "🔓", "✅", "👁️", "👁", "🌙", "⚖️", "⚖", "📢"]
PAT = re.compile(r"(?<=(?:ar|fr|en):')(?:" + "|".join(re.escape(e) for e in sorted(set(EMO), key=len, reverse=True)) + r")\s*")

lines = open(SRC, encoding="utf-8").read().split("\n")
changed = 0
for i, ln in enumerate(lines):
    if not any(("'" + k + "':") in ln for k in KEYS):
        continue
    new = PAT.sub("", ln)
    if new != ln:
        print("L%-4d - %s" % (i + 1, ln.strip()[:110]))
        print("      + %s" % new.strip()[:110])
        lines[i] = new
        changed += 1

if changed:
    if not os.path.exists(BAK):
        shutil.copy2(SRC, BAK); print("\nbackup ->", os.path.basename(BAK))
    open(SRC, "w", encoding="utf-8", newline="").write("\n".join(lines))
print("\nlines changed:", changed)
