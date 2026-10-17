# -*- coding: utf-8 -*-
import io, os, re, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(ROOT, "app.js")
s = open(p, encoding="utf-8").read()

# strip a leading warning emoji inside the hero.chip i18n values only
lines = s.split("\n")
n = 0
for i, ln in enumerate(lines):
    if "'hero.chip':" in ln:
        new = re.sub(r"(?<=(?:ar|fr|en):')\u26A0\uFE0F?\s*", "", ln)
        if new != ln:
            lines[i] = new
            n += 1
s2 = "\n".join(lines)
if s2 != s:
    open(p, "w", encoding="utf-8", newline="").write(s2)
    print("hero.chip cleaned lines:", n, " U+26A0:", s.count("\u26A0"), "->", s2.count("\u26A0"))
else:
    print("no change; U+26A0 count =", s.count("\u26A0"))


def is_emoji(ch):
    o = ord(ch)
    if o in (0xFE0F, 0x200D):
        return True
    if 0x1F000 <= o <= 0x1FAFF:
        return True
    if 0x2600 <= o <= 0x27BF:
        return True
    if 0x2B00 <= o <= 0x2BFF:
        return True
    return False


print("\n=== remaining emoji in app.js ===")
for i, ln in enumerate(s2.split("\n"), 1):
    found = sorted(set(c for c in ln if is_emoji(c) and c != "\uFE0F"))
    if found:
        print("L%-5d %s  |  %s" % (i, "".join(found), ln.strip()[:110]))
