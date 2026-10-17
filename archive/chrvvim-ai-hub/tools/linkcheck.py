#!/usr/bin/env python3
"""
Local link / asset checker for the CHRVVIM primary site mirror.

Serves nothing itself; point it at either:
  * a running local static server  ->  python tools/linkcheck.py http://localhost:8080
  * the live site                  ->  python tools/linkcheck.py https://mr1mohamed1chraim.netlify.app

It walks index.html + admin.html, extracts internal href/src references,
and reports the HTTP status of each (follows the SPA fallback false-positive
by flagging non-HTML assets served as text/html).
"""
import re
import sys
import urllib.request
import urllib.error
from urllib.parse import urljoin, urlparse

UA = "Mozilla/5.0 (compatible; CHRVVIM-linkcheck/1.0)"
REF = re.compile(r'''(?:href|src)\s*=\s*["']([^"']+)["']''', re.I)


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.headers.get("Content-Type", ""), len(r.read())
    except urllib.error.HTTPError as e:
        return e.code, (e.headers.get("Content-Type", "") if e.headers else ""), 0
    except Exception as e:  # noqa
        return None, str(e), 0


def main():
    base = sys.argv[1].rstrip("/") + "/"
    pages = ["", "admin.html"]
    seen, refs = set(), []
    for p in pages:
        st, ct, _ = get(urljoin(base, p))
        print(f"page {p or '/'} -> {st} {ct}")
        if st != 200:
            continue
        req = urllib.request.Request(urljoin(base, p), headers={"User-Agent": UA})
        html = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "replace")
        for m in REF.finditer(html):
            raw = m.group(1).strip()
            if raw.startswith(("http://", "https://", "//", "data:", "mailto:", "#", "javascript:")):
                continue
            if raw not in seen:
                seen.add(raw)
                refs.append(raw)

    ok = bad = fallback = 0
    for ref in refs:
        url = urljoin(base, ref)
        st, ct, size = get(url)
        ext = urlparse(url).path.rsplit(".", 1)[-1].lower()
        is_fallback = ("text/html" in ct) and ext not in ("html", "")
        if st == 200 and not is_fallback:
            ok += 1
        elif st == 200 and is_fallback:
            fallback += 1
            print(f"  FALLBACK {ref} -> 200 (served app shell, file likely absent)")
        else:
            bad += 1
            print(f"  BROKEN   {ref} -> {st} {ct}")
    print(f"\nchecked={len(refs)} ok={ok} fallback={fallback} broken={bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
