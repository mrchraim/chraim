# -*- coding: utf-8 -*-
import io, sys, re, urllib.parse
sys.path.insert(0, ".")
from _crawler import fetch, decode, links

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

def hosts_from(url):
    try:
        d, f, h = fetch(url)
        html = decode(d, h)
    except Exception as e:
        print("  ERR", url, str(e)[:70]); return set()
    found = set()
    for href, text in links(html, f):
        hh = urllib.parse.urlparse(href).netloc.lower()
        if hh and "uiz.ac.ma" in hh:
            found.add(hh)
    for m in re.finditer(r"([a-z0-9-]+\.uiz\.ac\.ma)", html, re.I):
        found.add(m.group(1).lower())
    return found

allh = set()
for u in ["https://www.uiz.ac.ma/", "https://www.uiz.ac.ma/nos-etablissements",
          "https://www.uiz.ac.ma/sitemap.xml", "https://ar.uiz.ac.ma/"]:
    hs = hosts_from(u)
    print("%-45s -> %d hosts" % (u, len(hs)))
    allh |= hs

print("\n=== all uiz subdomains discovered ===")
for h in sorted(allh):
    print("  ", h)

print("\n=== extra candidates ===")
extra = ["flsh-agadir.uiz.ac.ma","flshm.uiz.ac.ma","lettres.uiz.ac.ma","ensa-agadir.uiz.ac.ma",
         "ensaa.uiz.ac.ma","est-agadir.uiz.ac.ma","estam.uiz.ac.ma","fsjesam.uiz.ac.ma",
         "fsjes-am.uiz.ac.ma","fsjesaitmelloul.uiz.ac.ma","eheio.uiz.ac.ma","ispits.uiz.ac.ma",
         "iscae-agadir.uiz.ac.ma","crefoc.uiz.ac.ma","cite.uiz.ac.ma"]
for h in extra:
    try:
        d, f, hh = fetch("https://" + h + "/", timeout=10)
        print("  OK  %-30s %d bytes" % (h, len(d)))
    except Exception as e:
        print("  --  %-30s %s" % (h, str(e)[:45]))
