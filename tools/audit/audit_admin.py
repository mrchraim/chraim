#!/usr/bin/env python3
"""Audit the admin console.

The console is protected by Cloudflare Access (Zero Trust). Two modes:

1. GATE MODE (default) — every console URL must answer with a redirect to the
   Cloudflare Access login portal and must NOT be served directly (200).
   That proves an anonymous visitor can never read the console.

2. CONTENT MODE — when CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET are
   exported, the script authenticates with a Cloudflare service token and
   verifies that every asset is reachable and that every security header
   is present.

Usage:
    python _tools/audit_admin.py
    # linux/mac:
    CF_ACCESS_CLIENT_ID=... CF_ACCESS_CLIENT_SECRET=... python _tools/audit_admin.py

Note: a browser-like User-Agent is required. Cloudflare's bot protection
answers 403 to the default urllib UA, which is not a real failure.
Redirects are never followed: the Access redirect is exactly what we want
to inspect.
"""
import os
import sys
import urllib.error
import urllib.request

BASE = "https://ms-ops-7f3a9c.pages.dev"
ACCESS_HOST = "cloudflareaccess.com"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36")

ASSETS = [
    "/", "/index.html", "/login", "/login.html", "/404.html", "/robots.txt",
    "/js/app.js", "/js/auth.js", "/js/i18n.js", "/js/config.js",
    "/js/dashboard-inline.js", "/js/login-inline.js",
    "/css/style.css",
]

HEADERS = [
    ("content-security-policy", lambda v: _script_src_strict(v)),
    ("content-security-policy-report-only", lambda v: "require-trusted-types-for" in v),
    ("strict-transport-security", lambda v: "max-age=63072000" in v),
    ("x-content-type-options", lambda v: v == "nosniff"),
    ("x-frame-options", lambda v: v == "DENY"),
    ("referrer-policy", lambda v: v == "no-referrer"),
    ("cross-origin-opener-policy", lambda v: v == "same-origin"),
    ("cross-origin-resource-policy", lambda v: v == "same-origin"),
    ("cross-origin-embedder-policy", lambda v: v == "require-corp"),
    ("permissions-policy", lambda v: "geolocation=()" in v),
    ("x-robots-tag", lambda v: "noindex" in v),
]


def _script_src_strict(csp):
    """script-src must not allow 'unsafe-inline' or 'unsafe-eval'."""
    for directive in csp.split(";"):
        parts = directive.strip().split()
        if parts and parts[0] == "script-src":
            return "'unsafe-inline'" not in parts and "'unsafe-eval'" not in parts
    return False


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """Never follow a redirect - the Access redirect is what we inspect."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


OPENER = urllib.request.build_opener(NoRedirect)


def request(path):
    """Return (status, headers dict, body bytes) without following redirects."""
    req = urllib.request.Request(BASE + path, method="GET")
    req.add_header("User-Agent", UA)
    req.add_header("Accept", "*/*")
    req.add_header("Accept-Language", "en-US,en;q=0.9")
    cid = os.environ.get("CF_ACCESS_CLIENT_ID")
    csec = os.environ.get("CF_ACCESS_CLIENT_SECRET")
    if cid and csec:
        req.add_header("CF-Access-Client-Id", cid)
        req.add_header("CF-Access-Client-Secret", csec)
    try:
        with OPENER.open(req) as r:
            return r.status, {k.lower(): v for k, v in r.headers.items()}, r.read()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}, e.read()


def is_gated(status, hdrs):
    """The response is the Cloudflare Access login redirect."""
    loc = hdrs.get("location", "")
    auth = hdrs.get("www-authenticate", "")
    return (status in (301, 302, 303, 307, 308)
            and ACCESS_HOST in loc
            and "Cloudflare-Access" in auth)


authenticated = bool(os.environ.get("CF_ACCESS_CLIENT_ID")
                     and os.environ.get("CF_ACCESS_CLIENT_SECRET"))
failures = 0

print("=" * 72)
print("ADMIN CONSOLE - CLOUDFLARE ACCESS GATE")
print("=" * 72)
print(f"  target          : {BASE}")
print(f"  mode            : {'content (service token)' if authenticated else 'gate only'}")
print(f"  access portal   : https://lingering-tree-508e.cloudflareaccess.com")
print()

for path in ASSETS:
    status, hdrs, body = request(path)
    if authenticated:
        if status == 200:
            print(f"  PASS  {path:<28} {status} ({len(body)} bytes)")
        else:
            print(f"  FAIL  {path:<28} {status}")
            failures += 1
    else:
        if is_gated(status, hdrs):
            print(f"  PASS  {path:<28} {status} -> Access login (gated)")
        elif status == 200:
            print(f"  FAIL  {path:<28} 200 - console served WITHOUT authentication")
            failures += 1
        else:
            print(f"  FAIL  {path:<28} {status} - not an Access redirect")
            failures += 1

print()
print("=" * 72)
print("ADMIN CONSOLE - SECURITY HEADERS")
print("=" * 72)
status, hdrs, body = request("/")
if not authenticated:
    # Without a service token the console never renders, so its own headers
    # cannot be observed - Cloudflare answers the request, not the console.
    if is_gated(status, hdrs):
        print("  SKIP  console headers are behind the Access gate.")
        print("        export CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET")
        print("        to audit the console content and its headers.")
        print()
        print(f"  gate status      : {status}")
        print(f"  www-authenticate : {hdrs.get('www-authenticate', '')[:100]}")
        print(f"  location         : {hdrs.get('location', '')[:100]}")
    else:
        print("  FAIL  the console answered without the Access gate")
        failures += 1
else:
    for name, check in HEADERS:
        val = hdrs.get(name, "")
        ok = bool(val) and check(val)
        print(f"  {'PASS' if ok else 'FAIL'}  {name:<38} {val[:55]}")
        if not ok:
            failures += 1

print()
print("=" * 72)
print(f"TOTAL FAILURES: {failures}")
print("=" * 72)
sys.exit(1 if failures else 0)
