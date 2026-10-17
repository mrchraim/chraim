# -*- coding: utf-8 -*-
import io, sys, re, urllib.parse
sys.path.insert(0, ".")
from _crawler import fetch, decode, links

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

data, final, hdr = fetch("https://www.uiz.ac.ma/nos-etablissements")
html = decode(data, hdr)
print("page bytes:", len(html), "final:", final)
print("\n=== all distinct hosts in hrefs ===")
hosts = {}
for href, text in links(html, final):
    h = urllib.parse.urlparse(href).netloc.lower()
    hosts.setdefault(h, set()).add(text[:50])
for h in sorted(hosts):
    print("  %-34s %s" % (h, " | ".join(sorted(hosts[h])[:2])))

print("\n=== text near 'ablissement' ===")
for m in re.finditer(r"tablissement", html):
    seg = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html[m.start()-120:m.start()+160]))
    print("  ...", seg.strip()[:200])
    break

print("\n=== candidate host liveness ===")
cands = ["fsjes-agadir.uiz.ac.ma","fega.uiz.ac.ma","fsa.uiz.ac.ma","fmpa.uiz.ac.ma",
         "encga.uiz.ac.ma","esef.uiz.ac.ma","ims.uiz.ac.ma","fsa-am.uiz.ac.ma",
         "www.esta.ac.ma","flsh.uiz.ac.ma","fsjes-am.uiz.ac.ma","ensa.uiz.ac.ma",
         "ens.uiz.ac.ma","est.uiz.ac.ma","esta.uiz.ac.ma","iscae.uiz.ac.ma"]
for h in cands:
    try:
        d, f, hh = fetch("https://" + h + "/", timeout=12)
        print("  OK  %-26s %d bytes -> %s" % (h, len(d), f[:60]))
    except Exception as e:
        print("  --  %-26s %s" % (h, str(e)[:60]))
