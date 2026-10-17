# -*- coding: utf-8 -*-
import os, sys, io, unicodedata
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
p = os.path.join(os.path.dirname(__file__), 'index.html')


def is_emoji(ch):
    o = ord(ch)
    if o in (0xFE0F, 0x200D):
        return True
    if 0x1F000 <= o <= 0x1FAFF:   # pictographs
        return True
    if 0x2190 <= o <= 0x21FF:     # arrows
        return False
    if 0x2600 <= o <= 0x27BF:     # misc symbols / dingbats
        return True
    if 0x2B00 <= o <= 0x2BFF:
        return True
    if 0x1F1E6 <= o <= 0x1F1FF:
        return True
    return False


lines = open(p, encoding='utf-8').read().split('\n')
hits = {}
for i, ln in enumerate(lines, 1):
    found = [c for c in ln if is_emoji(c) and c not in ('\uFE0F',)]
    if found:
        hits.setdefault(''.join(sorted(set(found))), []).append((i, ln.strip()[:120]))
for ch, occ in hits.items():
    print("EMOJI %r  -> %d occurrence(s)" % (ch, len(occ)))
    for ln, txt in occ[:4]:
        print("   L%-5d %s" % (ln, txt))
