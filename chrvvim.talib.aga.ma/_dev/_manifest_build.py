# -*- coding: utf-8 -*-
"""
Rebuild BUILD_MANIFEST.sha256 (sha256 of every deployable file in the site).

Included : all files under the site root.
Excluded : dev-only paths (_dev/, tools/, __pycache__/), *.pyc,
           the manifest itself, and root-level "_"-prefixed scratch files
           (_crawl.py, _crawler.py, _probe*.py, ... ) while keeping the
           real Cloudflare config files _headers / _redirects.

Usage:  python _dev/_manifest_build.py            (dry run: prints the diff)
        python _dev/_manifest_build.py --write    (rewrites the manifest)
"""
import hashlib, io, os, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAN = os.path.join(ROOT, "BUILD_MANIFEST.sha256")

EXCLUDE_DIRS = {"_dev", "tools", "__pycache__"}
KEEP_ROOT_UNDERSCORE = {"_headers", "_redirects"}


def include(rel: str) -> bool:
    top = rel.split("/")[0]
    if top in EXCLUDE_DIRS:
        return False
    if rel == "BUILD_MANIFEST.sha256":
        return False
    name = os.path.basename(rel)
    if name.endswith(".pyc") or name.endswith(".bak"):
        return False
    if "/" not in rel and name.startswith("_") and name not in KEEP_ROOT_UNDERSCORE:
        return False
    return True


def sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


files = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    for f in filenames:
        full = os.path.join(dirpath, f)
        rel = os.path.relpath(full, ROOT).replace("\\", "/")
        if include(rel):
            files.append(rel)
files.sort()

old = {}
if os.path.exists(MAN):
    for line in open(MAN, encoding="utf-8"):
        line = line.rstrip("\n")
        if line.strip():
            h, name = line.split("  ", 1)
            old[name] = h

new = {rel: sha256(os.path.join(ROOT, rel)) for rel in files}

added = sorted(set(new) - set(old))
removed = sorted(set(old) - set(new))
changed = sorted(n for n in (set(new) & set(old)) if new[n] != old[n])

print(f"old entries: {len(old)} | new entries: {len(new)}")
print(f"\n+ added   ({len(added)}):")
for n in added:
    print("   +", n)
print(f"\n- removed ({len(removed)}):")
for n in removed:
    print("   -", n)
print(f"\n~ changed ({len(changed)}):")
for n in changed:
    print("   ~", n)

if "--write" in sys.argv:
    with open(MAN, "w", encoding="utf-8", newline="\n") as f:
        for rel in files:
            f.write(f"{new[rel]}  {rel}\n")
    print("\nWROTE", MAN)
else:
    print("\n(dry run; pass --write to rewrite)")
