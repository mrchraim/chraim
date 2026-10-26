# -*- coding: utf-8 -*-
"""CHRVVIM - Ibn Zohr / Agadir official-documents crawler (stdlib only)."""
import re, io, sys, os, json, ssl, time, hashlib, urllib.request, urllib.parse, urllib.error

def _utf8_out():
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    except Exception:
        pass

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

DOC_EXT = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".ppt", ".pptx",
           ".odt", ".ods", ".odp", ".zip", ".rar", ".7z", ".txt", ".rtf"}
IMG_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
ALL_EXT = DOC_EXT | IMG_EXT


def fetch(url, timeout=30, referer=None):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,fr,en;q=0.8",
    })
    if referer:
        req.add_header("Referer", referer)
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        data = r.read()
        return data, r.geturl(), dict(r.headers)


def decode(body, headers):
    ct = (headers.get("Content-Type") or "").lower()
    m = re.search(r"charset=([\w-]+)", ct)
    enc = m.group(1) if m else "utf-8"
    for e in (enc, "utf-8", "windows-1256", "latin-1"):
        try:
            return body.decode(e)
        except Exception:
            continue
    return body.decode("utf-8", "replace")


LINK_RE = re.compile(r'<a\b[^>]*?href\s*=\s*("([^"]*)"|\'([^\']*)\'|([^\s>]+))[^>]*>(.*?)</a>', re.I | re.S)
TAG_RE = re.compile(r"<[^>]+>")


def links(html, base):
    out = []
    for m in LINK_RE.finditer(html):
        href = m.group(2) or m.group(3) or m.group(4) or ""
        text = TAG_RE.sub(" ", m.group(5) or "")
        text = re.sub(r"\s+", " ", text).strip()
        href = href.strip()
        if not href or href.startswith(("javascript:", "mailto:", "tel:", "#")):
            continue
        out.append((urllib.parse.urljoin(base, href), text))
    return out


def drive_direct(url):
    """Convert common Google Drive/Docs links to direct-download URLs."""
    m = re.search(r"drive\.google\.com/file/d/([\w-]{10,})", url)
    if m:
        return "https://drive.google.com/uc?export=download&id=" + m.group(1)
    m = re.search(r"drive\.google\.com/(?:open|uc)\?(?:[^#]*&)?id=([\w-]{10,})", url)
    if m:
        return "https://drive.google.com/uc?export=download&id=" + m.group(1)
    m = re.search(r"docs\.google\.com/document/d/([\w-]{10,})", url)
    if m:
        return "https://docs.google.com/document/d/%s/export?format=docx" % m.group(1)
    m = re.search(r"docs\.google\.com/spreadsheets/d/([\w-]{10,})", url)
    if m:
        return "https://docs.google.com/spreadsheets/d/%s/export?format=xlsx" % m.group(1)
    m = re.search(r"docs\.google\.com/presentation/d/([\w-]{10,})", url)
    if m:
        return "https://docs.google.com/presentation/d/%s/export/pptx" % m.group(1)
    return None


def ext_of(url):
    path = urllib.parse.urlparse(url).path
    return os.path.splitext(path)[1].lower()


if __name__ == "__main__":
    _utf8_out()
    mode = sys.argv[1] if len(sys.argv) > 1 else "discover"
    if mode == "discover":
        data, final, hdr = fetch("https://www.uiz.ac.ma/nos-etablissements")
        html = decode(data, hdr)
        seen = {}
        for href, text in links(html, final):
            host = urllib.parse.urlparse(href).netloc.lower()
            if "uiz.ac.ma" in host or "esta.ac.ma" in host:
                seen.setdefault(host, set()).add(text[:60])
        for host in sorted(seen):
            print("%-32s %s" % (host, " | ".join(sorted(seen[host])[:3])))
