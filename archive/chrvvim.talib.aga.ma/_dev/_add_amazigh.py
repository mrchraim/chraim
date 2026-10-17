#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_add_amazigh.py — add Amazigh (Standard Moroccan Tamazight) to the CHRVVIM UI.

Two new UI languages:
  * "zgh"      -> Tifinagh script  (Neo-Tifinagh, official)
  * "zgh-latn" -> Latin script

Reads the Latin-script draft from _dev/amazigh_*.json, transliterates to
Tifinagh, and injects BOTH scripts into:
  * app.js      -> STR objects  (+ DAY_I18N)  + UI_LANGS + cFmt + <html lang>
  * subjects.js -> TXT object
  * legal.js    -> TXT object
  * index.html  -> the #uilang switcher (2 extra buttons)

Idempotent: re-running replaces previously injected values.
Protected tokens: {{...}} kept verbatim (braces removed); HTML tags, digits,
punctuation, emoji and runs of >=2 uppercase ASCII letters are kept as-is.
"""
import json, os, re, shutil, sys, io

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                      # chrvvim.talib.aga.ma/
BAK  = os.path.join(HERE, "backups")

# ---------------------------------------------------------------- transliteration
TIF = {
    'a':'ⴰ','b':'ⴱ','c':'ⴽ','d':'ⴷ','ḍ':'ⴹ','e':'ⴻ','f':'ⴼ','g':'ⴳ','ɣ':'ⵖ','γ':'ⵖ',
    'h':'ⵀ','ḥ':'ⵃ','i':'ⵉ','j':'ⵊ','k':'ⴽ','l':'ⵍ','m':'ⵎ','n':'ⵏ','o':'ⵓ','p':'ⴱ',
    'q':'ⵇ','r':'ⵔ','ṛ':'ⵕ','s':'ⵙ','ṣ':'ⵚ','š':'ⵛ','t':'ⵜ','ṭ':'ⵟ','u':'ⵓ','v':'ⴼ',
    'w':'ⵡ','x':'ⵅ','y':'ⵢ','z':'ⵣ','ẓ':'ⵥ','ɛ':'ⵄ','ʕ':'ⵄ','ʷ':'ⵯ','č':'ⵞ',
}

def _is_upper_ascii(ch):
    return 'A' <= ch <= 'Z'

def to_tifinagh(text):
    """Transliterate protected Latin text to Tifinagh.

    Gemination (doubled consonants) is collapsed *only across adjacent
    transliterated letters* — never inside {{...}}, tags, acronyms, URLs or
    any other verbatim run (so CHRVVIM / riqqa.ma stay intact).
    """
    out, prev = [], None            # prev = last letter produced by transliteration
    def push(tok, is_tif):
        nonlocal prev
        if is_tif and prev == tok:
            return                   # collapse a geminate
        out.append(tok)
        prev = tok if is_tif else None
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        # {{...}}  -> keep inner verbatim
        if text.startswith('{{', i):
            j = text.find('}}', i + 2)
            if j == -1:
                push(text[i:], False); break
            push(text[i+2:j], False); i = j + 2; continue
        # <tag> -> keep
        if ch == '<':
            j = text.find('>', i)
            if j != -1:
                push(text[i:j+1], False); i = j + 1; continue
        # run of >=2 uppercase ASCII letters -> keep (acronyms like PDF, GPA)
        if _is_upper_ascii(ch):
            j = i
            while j < n and _is_upper_ascii(text[j]):
                j += 1
            if j - i >= 2:
                push(text[i:j], False); i = j; continue
        low = ch.lower()
        if low in TIF:
            push(TIF[low], True)
        else:
            push(ch, False)
        i += 1
    return ''.join(out)

def to_latin(text):
    """Latin variant: just strip the {{...}} protection markers."""
    return re.sub(r'\{\{(.*?)\}\}', r'\1', text)

def jsesc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")

# ---------------------------------------------------------------- io helpers
def read_text(path):
    with open(path, 'rb') as f:
        raw = f.read()
    bom = raw.startswith(b'\xef\xbb\xbf')
    return raw.decode('utf-8-sig'), bom

def write_text(path, text, bom):
    data = text.encode('utf-8')
    if bom:
        data = b'\xef\xbb\xbf' + data
    with open(path, 'wb') as f:
        f.write(data)

def backup(path):
    os.makedirs(BAK, exist_ok=True)
    dst = os.path.join(BAK, os.path.basename(path) + '.pre-amazigh.bak')
    if not os.path.exists(dst):
        shutil.copy2(path, dst)
        print("  backup ->", os.path.relpath(dst, HERE))

def load_json(name):
    with open(os.path.join(HERE, name), encoding='utf-8') as f:
        d = json.load(f)
    return {k: v for k, v in d.items() if not k.startswith('_')}

# ---------------------------------------------------------------- STR injection
def inject_str(app_js, str_amz):
    lines = app_js.split('\n')
    seen, missing = set(), []
    pat = re.compile(r"^(\s*)'([^']+)':\{(.*)\}(,?)(\s*)$")
    for idx, line in enumerate(lines):
        m = pat.match(line)
        if not m:
            continue
        ind, key, val, comma, trail = m.groups()
        if key not in str_amz:
            continue
        seen.add(key)
        val = re.sub(r",?'zgh':'[^']*','zgh-latn':'[^']*'", '', val)
        props = "'zgh':'%s','zgh-latn':'%s'" % (
            jsesc(to_tifinagh(str_amz[key])), jsesc(to_latin(str_amz[key])))
        lines[idx] = "%s'%s':{%s,%s}%s%s" % (ind, key, val, props, comma, trail)
    for k in str_amz:
        if k not in seen:
            missing.append(k)
    if missing:
        print("  !! keys in JSON but not found in app.js:", missing)
    return '\n'.join(lines), len(seen)

def inject_days(app_js, days):
    for day, latin in days.items():
        pat = re.compile(r"('" + re.escape(day) + r"':\{)([^}]*)\}")
        def rep(m):
            val = re.sub(r",?'zgh':'[^']*','zgh-latn':'[^']*'", '', m.group(2))
            props = "'zgh':'%s','zgh-latn':'%s'" % (
                jsesc(to_tifinagh(latin)), jsesc(to_latin(latin)))
            return m.group(1) + val + ',' + props + '}'
        app_js, n = pat.subn(rep, app_js)
        if n == 0:
            print("  !! day not found:", day)
    return app_js

# ---------------------------------------------------------------- TXT injection
def find_matching_brace(s, start):
    depth, i, q = 0, start, None
    while i < len(s):
        c = s[i]
        if q:
            if c == '\\':
                i += 2; continue
            if c == q:
                q = None
        else:
            if c in "'\"":
                q = c
            elif c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    return -1

def inject_txt(path, data, marker='var TXT = {'):
    src, bom = read_text(path)
    backup(path)
    src = re.sub(r",\s*zgh:\s*\{.*?\},\s*'zgh-latn':\s*\{.*?\}", '', src, flags=re.S)
    anchor = src.find(marker)
    if anchor == -1:
        print("  !! TXT marker not found in", os.path.basename(path)); return
    brace = src.find('{', anchor)
    end = find_matching_brace(src, brace)
    def block(tag):
        rows = ''.join("      %s: '%s',\n" % (k, jsesc(to_tifinagh(v) if tag == 'zgh' else to_latin(v)))
                       for k, v in data.items())
        return "    %s: {\n%s    }" % ("'zgh-latn'" if tag == 'zgh-latn' else tag, rows)
    insert = ",\n" + block('zgh') + ",\n" + block('zgh-latn') + "\n  "
    src = src[:end] + insert + src[end:]
    write_text(path, src, bom)
    print("  ok: %s (+%d keys x2)" % (os.path.basename(path), len(data)))

# ---------------------------------------------------------------- app.js logic edits
def patch_app_logic(src):
    subs = [
        ("const UI_LANGS=['ar','fr','en'];",
         "const UI_LANGS=['ar','fr','en','zgh','zgh-latn'];"),
        ("const loc=UILANG==='ar'?'ar-MA':(UILANG==='fr'?'fr-MA':'en-GB');",
         "const loc=UILANG==='ar'?'ar-MA':(UILANG==='fr'||/^zgh/.test(UILANG)?'fr-MA':'en-GB');"),
        ("  document.documentElement.lang=l;",
         "  document.documentElement.lang=(l==='zgh-latn'?'zgh-Latn':l);"),
        (":'e.g. Youssef')+",
         ":(/^zgh/.test(UILANG)?'amedya: Yusef':'e.g. Youssef'))+"),
    ]
    for old, new in subs:
        if new in src:
            print("  = already applied:", old[:48]); continue
        if old not in src:
            print("  !! pattern not found:", old[:60]); continue
        src = src.replace(old, new, 1)
        print("  + patched:", old[:48])
    return src

# ---------------------------------------------------------------- index.html switcher
def patch_html(path):
    src, bom = read_text(path)
    if 'data-ui="zgh"' in src:
        print("  = switcher already present"); return
    backup(path)
    old = '<button type="button" data-ui="en" aria-label="English" title="English">EN</button>'
    add = (old +
           '\n      <button type="button" data-ui="zgh" aria-label="\u2d63\u2d49\u2d3c\u2d49\u2d4f\u2d30\u2d56\u2d5c \u2014 Tifinagh" title="Tamazi\u0263t \u2014 Tifinagh">\u2d63</button>'
           '\n      <button type="button" data-ui="zgh-latn" aria-label="Tamazi\u0263t \u2014 Latin" title="Tamazi\u0263t \u2014 Latin">AZ</button>')
    if old not in src:
        print("  !! uilang EN button not found"); return
    src = src.replace(old, add, 1)
    write_text(path, src, bom)
    print("  ok: index.html switcher (+2 buttons)")

# ---------------------------------------------------------------- main
def main():
    str_amz = load_json('amazigh_str.json')
    days    = load_json('amazigh_days.json')
    subj    = load_json('amazigh_subj.json')
    legal   = load_json('amazigh_legal.json')
    print("loaded: STR=%d days=%d subj=%d legal=%d" % (len(str_amz), len(days), len(subj), len(legal)))

    app_path = os.path.join(ROOT, 'app.js')
    src, bom = read_text(app_path)
    backup(app_path)
    src, n = inject_str(src, str_amz)
    print("  ok: STR injected for %d keys" % n)
    src = inject_days(src, days)
    src = patch_app_logic(src)
    write_text(app_path, src, bom)

    inject_txt(os.path.join(ROOT, 'subjects.js'), subj)
    inject_txt(os.path.join(ROOT, 'legal.js'), legal)
    patch_html(os.path.join(ROOT, 'index.html'))
    print("done.")

if __name__ == '__main__':
    main()
