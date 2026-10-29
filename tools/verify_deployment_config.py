#!/usr/bin/env python3
"""Static checks for Cloudflare Pages deployment configuration."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
errors = []
headers = root / "_headers"
redirects = root / "_redirects"

if headers.exists():
    content = headers.read_text(encoding="utf-8")
    required = [
        "X-Content-Type-Options:",
        "Referrer-Policy:",
        "Permissions-Policy:",
        "Content-Security-Policy:",
    ]
    for item in required:
        if item not in content:
            errors.append(f"_headers is missing expected header: {item}")
else:
    errors.append("Missing _headers file at repository root.")

# Redirects are optional for a static project, but if present each non-comment
# line must have at least source and destination fields.
if redirects.exists():
    for number, line in enumerate(redirects.read_text(encoding="utf-8").splitlines(), 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        fields = stripped.split()
        if len(fields) < 2:
            errors.append(f"_redirects:{number}: expected source and destination.")
        if len(fields) >= 2 and not fields[1].startswith(("/", "https://", "http://")):
            errors.append(f"_redirects:{number}: destination should be a path or absolute URL.")

if errors:
    print("Deployment config check FAILED:")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print("Deployment config static checks passed.")
print("Note: static checks do not prove CSP compatibility or that redirect targets are correct.")
