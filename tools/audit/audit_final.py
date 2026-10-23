import urllib.request, urllib.error, re

BASE = "https://management-system-16j.pages.dev/"

def fetch(path):
    req = urllib.request.Request(BASE + path.lstrip("/"), headers={"User-Agent": "final-audit"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}

print("=" * 72)
print("A. ADMIN-ONLY PATHS  (all must be 404)")
print("=" * 72)
blocked = [
    ("js/app.js", "admin app logic"),
    ("js/auth.js", "admin auth logic"),
    ("js/i18n.js", "admin i18n"),
    ("js/dashboard-inline.js", "admin inline script"),
    ("js/login-inline.js", "admin login script"),
    ("js/site-inline.js", "removed public script"),
    ("css/style.css", "admin stylesheet"),
    ("dashboard", "admin console (extension-less)"),
    ("dashboard.html", "admin console"),
    ("dashboard/", "admin console (slash)"),
    ("login", "admin login (extension-less)"),
    ("login.html", "admin login"),
    ("login/", "admin login (slash)"),
    ("admin", "admin probe"),
    ("admin/", "admin probe"),
    ("admin.html", "admin probe"),
    ("administrator", "admin probe"),
    ("administrator/", "admin probe"),
    ("signin", "login probe"),
    ("admin-console", "console dir"),
    ("admin-console/", "console dir"),
    ("admin-console/index.html", "console entry"),
    (".env", "environment file"),
    (".git/config", "git config"),
    ("js/app.js.map", "source map"),
    ("main.bak", "backup file"),
    ("db.sql", "database dump"),
]
fails = 0
for path, note in blocked:
    st, _ = fetch(path)
    ok = st == 404
    if not ok: fails += 1
    print(f"  {'PASS' if ok else 'FAIL'}  {path:28} {st}   {note}")

print()
print("=" * 72)
print("B. PUBLIC PATHS  (all must be 200)")
print("=" * 72)
allowed = [
    ("index.html", "home"), ("browse.html", "browse"),
    ("account.html", "student account"), ("about.html", "about"),
    ("announcements.html", "announcements"), ("contribute.html", "contribute"),
    ("privacy.html", "privacy"), ("subject.html", "subject"),
    ("support.html", "support"), ("404.html", "not-found page"),
    ("js/site.js", "public script"), ("js/config.js", "public config"),
    ("js/index-inline.js", "home script"), ("js/about-inline.js", "about script"),
    ("css/site.css", "public stylesheet"), ("robots.txt", "robots"),
    ("sitemap.xml", "sitemap"),
]
for path, note in allowed:
    st, _ = fetch(path)
    ok = st == 200
    if not ok: fails += 1
    print(f"  {'PASS' if ok else 'FAIL'}  {path:28} {st}   {note}")

print()
print("=" * 72)
print("C. SECURITY HEADERS ON THE PUBLIC SITE")
print("=" * 72)
_, h = fetch("/")
required = [
    "content-security-policy", "content-security-policy-report-only",
    "strict-transport-security", "x-content-type-options", "x-frame-options",
    "referrer-policy", "cross-origin-opener-policy",
    "cross-origin-resource-policy", "cross-origin-embedder-policy",
    "permissions-policy",
]
for name in required:
    present = name in h
    if not present: fails += 1
    val = h.get(name, "(missing)")
    print(f"  {'PASS' if present else 'FAIL'}  {name}")
    print(f"          {val[:150]}")

csp = h.get("content-security-policy", "")
checks = [
    ("script-src has NO 'unsafe-inline'", "unsafe-inline" not in re.search(r"script-src[^;]*", csp).group(0)),
    ("script-src has NO 'unsafe-eval'", "unsafe-eval" not in csp),
    ("img-src is NOT a bare https:", not re.search(r"img-src[^;]*\shttps:\s*;", csp + ";")),
    ("frame-ancestors 'none'", "frame-ancestors 'none'" in csp),
    ("object-src 'none'", "object-src 'none'" in csp),
    ("base-uri 'self'", "base-uri 'self'" in csp),
    ("HSTS preload", "preload" in h.get("strict-transport-security", "")),
]
print()
for label, ok in checks:
    if not ok: fails += 1
    print(f"  {'PASS' if ok else 'FAIL'}  {label}")

print()
print("=" * 72)
print("TOTAL FAILURES:", fails)
print("=" * 72)
