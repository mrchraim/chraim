#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Repository secret scan — deterministic, fast, dependency-free.

Scans tracked files (via `git ls-files`) for high-signal leak patterns.
Binary and very large files are skipped by design (they are not useful
for text-pattern analysis); the live source is covered.
"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PATTERNS = {
    "supabase_secret": re.compile(r"sb_secret_[A-Za-z0-9_-]{10,}"),
    "jwt_token": re.compile(r"eyJhbGciOi[A-Za-z0-9_\-\.]{20,}"),
    "aws_access_key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "gh_pat": re.compile(r"\bghp_[A-Za-z0-9]{36}\b"),
    "gh_oauth": re.compile(r"\bgho_[A-Za-z0-9]{36}\b"),
    "gh_fine": re.compile(r"\bghs_[A-Za-z0-9]{36}\b"),
    "gl_pat": re.compile(r"\bglpat-[A-Za-z0-9_-]{20,}\b"),
    "slack_token": re.compile(r"\bxox[boa]-[A-Za-z0-9-]{10,}\b"),
    "stripe_key": re.compile(r"\bsk_(live|test)_[A-Za-z0-9]{16,}\b"),
    "pem_private_key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED |)PRIVATE KEY-----"),
}

BINARY_EXTENSIONS = {
    ".zip", ".gz", ".tar", ".tgz", ".br", ".7z", ".bundle", ".pack",
    ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".mp4", ".webm", ".mp3", ".ogg", ".wav",
    ".xlsx", ".pptx", ".docx",
}

MAX_BYTES = 900 * 1024


def tracked_files():
    out = subprocess.run(
        ["git", "ls-files"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return [line for line in out.splitlines() if line.strip()]


def main():
    hits = []
    scanned = 0
    for rel in tracked_files():
        path = ROOT / rel
        try:
            if path.suffix.lower() in BINARY_EXTENSIONS and path.stat().st_size > 64 * 1024:
                continue
            if path.stat().st_size > MAX_BYTES:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        scanned += 1
        for rule, rx in PATTERNS.items():
            for m in rx.finditer(text):
                hits.append((rel, rule, m.group(0)))

    print(f"[secret-scan] scanned {scanned} tracked text files")

    if hits:
        print("[secret-scan] FAIL — potential secrets detected:")
        for rel, rule, snippet in hits:
            print(f"  [{rule}] {rel}  ->  {snippet[:160]}")
        return 1

    print("[secret-scan] PASS — no high-signal secrets detected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
