# -*- coding: utf-8 -*-
"""Replace the last stock emoji in index.html controls with inline SVG (.icn). Verified per-rule."""
import io, os, re, sys, shutil

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "index.html")
BAK = os.path.join(ROOT, "index.html.pre-icons.bak")

def svg(paths):
    return ('<svg class="icn" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
            + paths + '</svg>')

EYE = svg('<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.1"/>')
MOON = svg('<path d="M20.5 14.7A8.6 8.6 0 0 1 9.3 3.5a8.6 8.6 0 1 0 11.2 11.2z"/>')
DL = svg('<path d="M12 3.5v11"/><path d="M7.5 10 12 14.5 16.5 10"/><path d="M4.5 19.5h15"/>')
WARN = svg('<path d="M12 3.6 21.4 20H2.6z"/><path d="M12 9.6v4.6"/><path d="M12 17.2h.01"/>')
CAP = svg('<path d="M21.5 9.5 12 5 2.5 9.5 12 14z"/><path d="M6 11.6v5.2c0 1.5 2.7 2.7 6 2.7s6-1.2 6-2.7v-5.2"/>')
BOOK = svg('<path d="M12 7.2C10.4 5.9 8.2 5.3 5.7 5.3c-1 0-2 .1-2.9.4v11.6c.9-.3 1.9-.4 2.9-.4 2.5 0 4.7.6 6.3 1.9 1.6-1.3 3.8-1.9 6.3-1.9 1 0 2 .1 2.9.4V5.7c-.9-.3-1.9-.4-2.9-.4-2.5 0-4.7.6-6.3 1.9z"/><path d="M12 7.2v11.6"/>')
NEWS = svg('<path d="M4.5 5.5h12a1.8 1.8 0 0 1 1.8 1.8v9.4a2 2 0 0 0 2 2H6.5a2 2 0 0 1-2-2z"/><path d="M7.8 9h6.4M7.8 12.4h6.4M7.8 15.8h3.6"/>')
LOCK = svg('<rect x="4.5" y="10.5" width="15" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>')

V = r"\uFE0F?"
RULES = [
    (r'(id="comfort"[^>]*>)' + r"\U0001F441" + V + r'(</button>)', r"\1" + EYE + r"\2"),
    (r'(id="theme"[^>]*>)' + r"\U0001F319" + V + r'(</button>)', r"\1" + MOON + r"\2"),
    (r'(<span aria-hidden="true">)' + r"\u2B07" + V + r'(</span>)', r"\1" + DL + r"\2"),
    (r'("noopener">)' + r"\u26A0" + V + r' ', r"\1" + WARN + " "),
    (r'(<span>)' + r"\U0001F512" + V + r' المهام', r"\1" + LOCK + " المهام"),
    (r'(<strong>)' + r"\u26A0" + V + r' ', r"\1" + WARN + " "),
    (r'(>)\U0001F393' + V + r'( مؤسسات)', r"\1" + CAP + r"\2"),
    (r'(>)\U0001F4DA' + V + r'( التكوينات)', r"\1" + BOOK + r"\2"),
    (r'(>)\U0001F5DE' + V + r'( المستجدات)', r"\1" + NEWS + r"\2"),
    (r'(<h2 id="gateTitle">)' + r"\U0001F513" + V + r' ', r"\1"),
    (r'(id="gateOk" disabled>[^<]*?)\s*' + r"\u2705", r"\1"),
]

s = open(SRC, encoding="utf-8").read()
total = 0
for i, (pat, rep) in enumerate(RULES, 1):
    s2, n = re.subn(pat, rep, s)
    print("rule %2d: %d replacement(s)" % (i, n))
    if n != 1:
        print("   !! expected exactly 1", pat[:60])
    s = s2
    total += n

if s != open(SRC, encoding="utf-8").read():
    if not os.path.exists(BAK):
        shutil.copy2(SRC, BAK); print("backup ->", os.path.basename(BAK))
    open(SRC, "w", encoding="utf-8", newline="").write(s)
    print("written; total replacements:", total)
else:
    print("no change")
