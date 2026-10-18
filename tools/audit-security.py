#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""فحص أمني سريع للموقع الموحّد (CHRAIM).

الاستعمال:
    python tools/audit-security.py

كيفحص:
  1) أسرار مكشوفة فالكود (service_role, tokens, private keys...)   → FAIL
  2) روابط target="_blank" بلا rel="noopener"                     → FAIL
  3) دومينات الموارد الخارجية مقابل سياسة CSP في _headers          → FAIL
  4) ملفات داخلية غادي تتسرّب فالنشر (archive/, vendor/...)        → WARN
  5) دوال خطيرة (document.write / eval / new Function)             → WARN
  6) رؤوس أمان ناقصة فـ_headers                                    → WARN
  7) حماية /admin.html (noindex + X-Robots-Tag)                    → WARN

كيخرج بالرمز 1 إذا كان شي FAIL (مناسب لـCI).
"""

import os
import re
import io
import sys

EXCLUDE_DIRS = {"archive", "vendor", ".git", "_dev", "dist", "node_modules", "__pycache__"}
INTERNAL_TOP = {"archive", "vendor", "_dev", "tools", "supabase"}

# أنماط عالية الخطورة → FAIL
SECRET_PATTERNS = [
    (r"service_role['\"\s]*[:=]\s*['\"][^'\"]{20,}", "service_role كقيمة"),
    (r"\bsb_secret_[A-Za-z0-9_\-]{10,}", "Supabase secret key"),
    (r"\bsk_live_[0-9a-zA-Z]{10,}", "Stripe live key"),
    (r"\bsk_test_[0-9a-zA-Z]{10,}", "Stripe test key"),
    (r"\bghp_[0-9A-Za-z]{20,}", "GitHub token (ghp_)"),
    (r"\bgithub_pat_[0-9A-Za-z_]{20,}", "GitHub PAT"),
    (r"\bAIza[0-9A-Za-z_\-]{30,}", "Google API key"),
    (r"\bAKIA[0-9A-Z]{16}\b", "AWS access key"),
    (r"\bxox[baprs]-[0-9A-Za-z-]{10,}", "Slack token"),
    (r"-----BEGIN [A-Z ]*PRIVATE KEY-----", "private key"),
]

# أنماط تستحق مراجعة بشرية → WARN
SECRET_WARN = [
    (r"\beyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{10,}", "JWT ظاهر (تأكد أنو anon فقط)"),
    (r"\bsb_publishable_[A-Za-z0-9_\-]{10,}", "مفتاح publishable (عام — للمعلومة)"),
]

FAIL = []
WARN = []
INFO = []


def walk(root, exts=None):
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for f in files:
            if exts is None or f.lower().endswith(exts):
                yield os.path.join(base, f)


def read(p):
    return io.open(p, encoding="utf-8", errors="replace").read()


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    htmls = list(walk(root, (".html",)))
    texts = list(walk(root, (".html", ".js", ".css", ".json")))

    # 1) أسرار -------------------------------------------------------------
    seen_warn = set()
    for p in texts:
        t = read(p)
        for pat, label in SECRET_PATTERNS:
            for m in re.finditer(pat, t):
                ctx = t[max(0, m.start() - 40):m.end() + 40].replace("\n", " ")
                FAIL.append("سرّ محتمل (%s) في %s: …%s…" % (label, os.path.relpath(p, root), ctx.strip()))
        for pat, label in SECRET_WARN:
            for m in re.finditer(pat, t):
                key = (label, os.path.relpath(p, root))
                if key in seen_warn:
                    continue
                seen_warn.add(key)
                WARN.append("%s ← %s" % (label, os.path.relpath(p, root)))

    # 2) tabnabbing --------------------------------------------------------
    for p in htmls:
        t = read(p)
        for m in re.finditer(r"<a\b[^>]*target\s*=\s*[\"']_blank[\"'][^>]*>", t, re.I):
            tag = m.group(0)
            if "noopener" not in tag.lower() and "noreferrer" not in tag.lower():
                FAIL.append("target=_blank بلا noopener في %s: %s" % (os.path.relpath(p, root), tag[:90]))

    # 3) دومينات الموارد مقابل CSP ----------------------------------------
    headers = os.path.join(root, "_headers")
    csp = ""
    if os.path.isfile(headers):
        h = read(headers)
        mm = re.search(r"Content-Security-Policy:\s*(.+)", h)
        csp = mm.group(1) if mm else ""
    allowed = set()
    for key in ("script-src", "style-src", "font-src", "img-src", "connect-src", "default-src"):
        mm = re.search(key + r"\s+([^;]+)", csp)
        if mm:
            for tok in mm.group(1).split():
                if tok.startswith("https://"):
                    allowed.add(tok.replace("https://", "").rstrip("/").lower())

    def is_allowed(host):
        host = host.lower()
        for a in allowed:
            if a == host or (a.startswith("*.") and host.endswith(a[1:])):
                return True
        return False

    # rel ليست مورداً (روابط دلالية فقط — ما كتحكمش فيها CSP)
    NON_RESOURCE_REL = {"canonical", "preconnect", "dns-prefetch", "alternate", "me",
                        "author", "publisher", "license", "help", "next", "prev",
                        "search", "profile", "home"}
    res = re.compile(r"<(script|link|img|source)\b[^>]*>", re.I)
    attr = re.compile(r"(?:src|href)\s*=\s*[\"'](https?://[^\"']+)", re.I)
    relp = re.compile(r"rel\s*=\s*[\"']([^\"']+)", re.I)
    for p in texts:
        if not p.lower().endswith((".html", ".js")):
            continue
        for m in res.finditer(read(p)):
            tag = m.group(0)
            a = attr.search(tag)
            if not a:
                continue
            rel = (relp.search(tag).group(1).lower() if relp.search(tag) else "")
            if set(rel.split()) & NON_RESOURCE_REL:
                continue
            host = re.sub(r"^https?://([^/]+).*$", r"\1", a.group(1))
            if not is_allowed(host):
                FAIL.append("مورد خارجي غير مسموح في CSP: %s  (%s)"
                            % (a.group(1), os.path.relpath(p, root)))

    # 4) ملفات داخلية ------------------------------------------------------
    for name in sorted(os.listdir(root)):
        full = os.path.join(root, name)
        if name in INTERNAL_TOP and os.path.isdir(full):
            WARN.append("مجلّد داخلي كاين فالجذر: %s/ (يجب استثناؤه من النشر — tools/build-dist.py)" % name)

    # 5) دوال خطيرة --------------------------------------------------------
    def strip_comments(t):
        t = re.sub(r"/\*.*?\*/", " ", t, flags=re.S)
        return re.sub(r"(?m)//[^\n]*", " ", t)

    danger = re.compile(r"document\.write|document\.writeln|\beval\s*\(|new\s+Function\s*\(")
    for p in texts:
        hits = danger.findall(strip_comments(read(p)))
        if hits:
            WARN.append("دوال خطيرة في %s: %s" % (os.path.relpath(p, root), ", ".join(sorted(set(hits)))))

    # 6) رؤوس أمان ---------------------------------------------------------
    if not csp:
        WARN.append("ما كايناش Content-Security-Policy فـ_headers")
    for need in ["X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy",
                 "Strict-Transport-Security", "Permissions-Policy"]:
        if need not in read(headers if os.path.isfile(headers) else os.devnull):
            WARN.append("رأس أمان ناقص فـ_headers: " + need)

    # 7) admin.html --------------------------------------------------------
    admin = os.path.join(root, "admin.html")
    if os.path.isfile(admin):
        t = read(admin)
        if 'name="robots"' not in t and "noindex" not in t:
            WARN.append("admin.html بلا noindex")
        else:
            INFO.append("admin.html: noindex موجود 👍")

    # ---------------- التقرير ----------------
    print("=== فحص أمني: %s ===" % root)
    print("HTML: %d | ملفات نصية: %d\n" % (len(htmls), len(texts)))
    for title, items in (("❌ FAIL", FAIL), ("⚠️  WARN", WARN), ("ℹ️  INFO", INFO)):
        print("%s (%d)" % (title, len(items)))
        for it in items:
            print("   -", it)
        print()
    print("النتيجة:", "❌ فشل — كاينين مشاكل خاصها إصلاح" if FAIL else
          ("⚠️  تحذيرات فقط" if WARN else "✅ نظيف"))
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
