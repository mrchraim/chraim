# -*- coding: utf-8 -*-
"""Reorder the homepage <main> children + move announcements inside main. Non-destructive, verified."""
import io, os, re, sys, shutil

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "index.html")
BAK = os.path.join(ROOT, "index.html.pre-rank.bak")

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}
TAG = re.compile(r"<!--.*?-->|<!\[CDATA\[.*?\]\]>|<(\/?)([a-zA-Z][\w:-]*)((?:\"[^\"]*\"|'[^']*'|[^>\"'])*?)(\/?)>", re.S)


def top_spans(text):
    """Spans of top-level elements in `text` (index into text)."""
    spans = []
    depth = 0
    cur = None
    i = 0
    while True:
        m = TAG.search(text, i)
        if not m:
            break
        raw, closing, name, attrs, selfc = m.group(0), m.group(1), m.group(2).lower(), m.group(3), m.group(4)
        if raw.startswith("<!--") or raw.startswith("<![CDATA["):
            i = m.end(); continue
        if name in ("script", "style") and not closing:
            end = text.find("</%s>" % name, m.end())
            end = (end + len("</%s>" % name)) if end != -1 else len(text)
            if depth == 0:
                spans.append((m.start(), end))
            i = end
            continue
        if closing:
            if depth > 0:
                depth -= 1
                if depth == 0 and cur is not None:
                    spans.append((cur, m.end())); cur = None
        else:
            if name in VOID or selfc:
                if depth == 0:
                    spans.append((m.start(), m.end()))
            else:
                if depth == 0:
                    cur = m.start()
                depth += 1
        i = m.end()
    return spans


html = open(SRC, encoding="utf-8").read()
orig_len = len(html)

# ---------- locate main ----------
mo = re.search(r"<main\b[^>]*>", html)
assert mo, "main not found"
main_open_end = mo.end()
# find matching </main>
depth = 1
i = main_open_end
close_idx = None
while True:
    m = TAG.search(html, i)
    if not m:
        break
    raw, closing, name, attrs, selfc = m.group(0), m.group(1), m.group(2).lower(), m.group(3), m.group(4)
    if raw.startswith("<!--") or raw.startswith("<![CDATA["):
        i = m.end(); continue
    if name in ("script", "style") and not closing:
        e = html.find("</%s>" % name, m.end())
        i = (e + len("</%s>" % name)) if e != -1 else len(html); continue
    if closing:
        if name in VOID:
            pass
        else:
            depth -= 1
            if depth == 0:
                close_idx = m.start(); break
    elif not selfc and name not in VOID:
        depth += 1
    i = m.end()
assert close_idx, "closing main not found"

inner = html[main_open_end:close_idx]
chunks = [inner[a:b] for a, b in top_spans(inner)]
print("=== current main children (%d) ===" % len(chunks))
for k, c in enumerate(chunks):
    print("  [%d] %s" % (k, c.strip().split("\n")[0][:80]))


def key_of(c):
    h = c.strip()[:200]
    if 'id="mine"' in h: return "mine"
    if 'id="homeQuick"' in h: return "quick"
    if 'class="card configbar"' in h: return "config"
    if h.startswith('<div class="layout"') or 'class="layout"' in h[:60]: return "layout"
    if 'id="focusStudio"' in h: return "focus"
    if 'id="student-wa-groups"' in h: return "wa"
    if 'id="legalCard"' in h: return "legal"
    if h.startswith("<script"): return "script"
    return "other"


keys = [key_of(c) for c in chunks]
by = {k: c for k, c in zip(keys, chunks)}
print("\nkeys:", keys)

# ---------- extract + remove campus-announcements (currently after </main>) ----------
tail = html[close_idx + len("</main>"):]
ann_marks = re.search(r'<section\b[^>]*id="campus-announcements"[^>]*>', tail)
assert ann_marks, "campus-announcements not found"
a_start, a_end = top_spans(tail[ann_marks.start():])[0]
a_start += ann_marks.start(); a_end += ann_marks.start()
ann_chunk = tail[a_start:a_end]
print("\nannouncements chunk bytes:", len(ann_chunk))
# rebuild tail without announcements
new_tail = tail[:a_start] + tail[a_end:]

# ---------- new order ----------
order = ["mine", "quick", "config", "layout", "focus", "wa", "legal"]
new_chunks = []
for k in order:
    assert k in by, "missing chunk " + k
    new_chunks.append((by[k]))
# announcements as last content section, then the wa-filter script
script_chunk = by.get("script")
body_parts = new_chunks + [ann_chunk]
if script_chunk:
    body_parts.append(script_chunk)

new_inner = "\n" + "\n".join("  " + c.strip("\n") for c in body_parts) + "\n"

new_html = html[:main_open_end] + new_inner + html[close_idx:close_idx + len("</main>")] + new_tail

# ---------- write (with backup) ----------
if not os.path.exists(BAK):
    shutil.copy2(SRC, BAK)
    print("backup ->", os.path.basename(BAK))
open(SRC, "w", encoding="utf-8", newline="").write(new_html)
print("\norig bytes=%d  new bytes=%d  delta=%+d" % (orig_len, len(new_html), len(new_html) - orig_len))
print("=== NEW main order ===")
for k in order + ["announcements"] + (["script"] if script_chunk else []):
    print("   -", k)
