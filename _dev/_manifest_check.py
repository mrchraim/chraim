# -*- coding: utf-8 -*-
import io, os, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAN = os.path.join(ROOT, "BUILD_MANIFEST.sha256")

listed = []
for line in open(MAN, encoding="utf-8"):
    line = line.rstrip("\n")
    if not line.strip():
        continue
    listed.append(line.split("  ", 1)[1])

on_disk = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    for f in filenames:
        full = os.path.join(dirpath, f)
        rel = os.path.relpath(full, ROOT).replace("\\", "/")
        on_disk.append(rel)

print("listed:", len(listed), "| on disk:", len(on_disk))
print()
print("--- in manifest but NOT on disk ---")
for x in sorted(set(listed) - set(on_disk)):
    print("  ", x)
print()
print("--- on disk but NOT in manifest ---")
for x in sorted(set(on_disk) - set(listed)):
    print("  ", x)
print()
print("--- sample of manifest order (first 6) ---")
for x in listed[:6]:
    print("  ", x)
