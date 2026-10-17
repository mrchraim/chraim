#!/usr/bin/env python3
"""
verify_live.py <base-url> [password]

Verifies a deployed copy of CHRVVIM CAMPUS / AI HUB by walking the local
deploy folder (_deploy_kit/chrvvim-campus-DROPREDY) and requesting every file
from <base-url>. If the site is password protected, pass the password as the
2nd argument and the script will unlock it first.

Usage:
    python verify_live.py https://chrvvim-campus.pages.dev
    python verify_live.py https://xxx.netlify.app My-Drop-Site
"""
import sys, os, ssl, urllib.request, urllib.error, urllib.parse, http.cookiejar, json

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

if len(sys.argv) < 2:
    print("usage: python verify_live.py <base-url> [password]")
    sys.exit(2)

base = sys.argv[1].rstrip("/")
password = sys.argv[2] if len(sys.argv) > 2 else None

root = os.path.dirname(os.path.abspath(__file__))
folder = os.path.join(root, "chrvvim-campus-DROPREDY")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(cj),
    urllib.request.HTTPSHandler(context=ctx),
)
opener.addheaders = [("User-Agent", "Mozilla/5.0")]


def fetch(path):
    try:
        with opener.open(base + path, timeout=30) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except Exception as e:
        return "ERR", str(e).encode()


# --- unlock password if needed ---
st, body = fetch("/")
if st == 401 and password:
    html = body.decode("utf-8", "ignore")
    import re
    fn = re.search(r'name="form-name"[^>]*value="([^"]*)"', html)
    formname = fn.group(1) if fn else "form 1"
    data = urllib.parse.urlencode({"form-name": formname, "password": password}).encode()
    try:
        opener.open(urllib.request.Request(
            base + "/", data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}), timeout=30)
        print("unlocked with password.")
    except Exception as e:
        print("unlock failed:", e)
elif st == 401:
    print("site is 401 (password protected) and no password given -> abort")
    sys.exit(1)

files = []
for dirpath, _dirs, names in os.walk(folder):
    for n in names:
        full = os.path.join(dirpath, n)
        rel = "/" + os.path.relpath(full, folder).replace("\\", "/")
        files.append(rel)
files.sort()

fails = []
oks = 0

print("=" * 74)
print("VERIFY:", base)
print("FILES :", len(files))
print("=" * 74)

for rel in files:
    st, body = fetch(rel)
    ok = isinstance(st, int) and 200 <= st < 400
    if ok:
        oks += 1
    else:
        fails.append((rel, st))
    if not ok or rel in ("/index.html", "/manifest.webmanifest"):
        print("%-6s %-58s %d bytes" % ("OK" if ok else "FAIL", rel, len(body)))

print("-" * 74)
print("PASSED: %d / %d" % (oks, len(files)))

print("-" * 74)
st, body = fetch("/")
html = body.decode("utf-8", "ignore")
for needle in ["CHRVVIM", "hub", "app.js"]:
    print("root contains %-10s : %s" % (needle, needle.lower() in html.lower()))

st, body = fetch("/data/institutions.json")
try:
    j = json.loads(body.decode("utf-8", "ignore"))
    n = len(j) if isinstance(j, list) else len(j.get("institutions", j))
    print("institutions.json valid JSON, entries:", n)
except Exception as e:
    print("institutions.json PARSE ERROR:", e)

if fails:
    print("-" * 74)
    print("FAILURES:")
    for rel, st in fails:
        print("   ", st, rel)
    sys.exit(1)

print("-" * 74)
print("RESULT: ALL GOOD")
