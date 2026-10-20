#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
نشر الموقع العمومي + لوحة الإدارة المنفصلة على Cloudflare Pages عبر الـ API.
يحتاج فقط: CLOUDFLARE_API_TOKEN (وفيه صلاحية Pages:Edit + Account:Read).

الاستعمال:
    set CLOUDFLARE_API_TOKEN=xxxx
    C:\\Python315\\python.exe _tools\\deploy_cloudflare.py --list
    C:\\Python315\\python.exe _tools\\deploy_cloudflare.py --site
    C:\\Python315\\python.exe _tools\\deploy_cloudflare.py --admin chrvvim-ops-7f3a9c

ملاحظات:
- ما كيرفعش الملفات الحسّاسة: كيحترم قائمة EXCLUDE.
- كيرفع الموقع العمومي من chrvvim.talib.aga.ma/ واللوحة من admin-separate/.
- كيبني ZIP فـ الذاكرة ويرفعو (نفس طريقة wrangler/pages direct upload).
"""
import argparse
import io
import json
import os
import sys
import zipfile
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://api.cloudflare.com/client/v4"

# ما كيرفعش هاد الملفات/المجلدات (أمان + حجم)
EXCLUDE_DIRS = {
    "__pycache__", "node_modules", ".git", "_dev", "_reports", "_archive",
    "_deploy_kit", "_integration_preview", "site_doctor_report", "supabase",
    "tools", ".well-known", "documents",
}
EXCLUDE_EXTS = {".map", ".bak", ".pyc", ".py", ".md", ".csv"}
EXCLUDE_NAMES = {
    "BUILD_MANIFEST.sha256", "robots.txt.md", "package.json", "package-lock.json",
    "wrangler.toml", "wrangler.jsonc", "netlify.toml", "Dockerfile", "docker-compose.yml",
    ".gitignore", ".gitattributes",
}


def token():
    t = os.environ.get("CLOUDFLARE_API_TOKEN") or os.environ.get("CF_API_TOKEN")
    if not t:
        print("ERROR: ضع CLOUDFLARE_API_TOKEN فـ البيئة قبل التشغيل.")
        sys.exit(2)
    return t


def api(method, path, body=None, ctype="application/json", raw=None):
    url = API + path
    headers = {"Authorization": "Bearer " + token()}
    data = None
    if raw is not None:
        headers["Content-Type"] = ctype
        data = raw
    elif body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as e:
        txt = e.read().decode("utf-8", "replace")
        print("HTTP", e.code, txt[:500])
        raise


def account_id():
    r = api("GET", "/accounts")
    accs = r.get("result") or []
    if not accs:
        print("ERROR: ما لقيتش أي حساب Cloudflare بهاد التوكن.")
        sys.exit(2)
    if len(accs) > 1:
        print("تنبيه: كاينين", len(accs), "حسابات؛ غادي نستعمل:", accs[0]["name"])
    return accs[0]["id"]


def build_zip(src_dir):
    buf = io.BytesIO()
    n = 0
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for cur, dirs, files in os.walk(src_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for f in files:
                if f in EXCLUDE_NAMES or os.path.splitext(f)[1].lower() in EXCLUDE_EXTS:
                    continue
                fp = os.path.join(cur, f)
                rel = os.path.relpath(fp, src_dir).replace("\\", "/")
                z.write(fp, rel)
                n += 1
    buf.seek(0)
    return buf, n


def deploy(name, src_dir, acc):
    if not os.path.isdir(src_dir):
        print("ERROR: المجلد ما كاينش:", src_dir)
        sys.exit(2)
    zbuf, n = build_zip(src_dir)
    print("→ النشر:", name, "| ملفات:", n, "| مصدر:", src_dir)
    r = api("POST",
            "/accounts/" + acc + "/pages/projects/" + name + "/deployments",
            raw=zbuf.read(), ctype="application/zip")
    res = r.get("result") or {}
    print("✔ تم. الرابط:", res.get("url") or "(راجع لوحة Cloudflare)")


def list_projects(acc):
    r = api("GET", "/accounts/" + acc + "/pages/projects")
    for p in r.get("result") or []:
        print("-", p.get("name"), "|", p.get("subdomain"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true", help="اعرض مشاريع Pages")
    ap.add_argument("--site", action="store_true", help="انشر الموقع العمومي")
    ap.add_argument("--admin", metavar="PROJECT", help="انشر اللوحة لمشروع منفصل (اسم غير قابل للتخمين)")
    ap.add_argument("--site-name", default="chrvvim-campus", help="اسم مشروع الموقع (افتراضي chrvvim-campus)")
    args = ap.parse_args()

    acc = account_id()
    if args.list:
        list_projects(acc)
    if args.site:
        deploy(args.site_name, os.path.join(ROOT, "chrvvim.talib.aga.ma"), acc)
    if args.admin:
        deploy(args.admin, os.path.join(ROOT, "admin-separate"), acc)
    if not (args.list or args.site or args.admin):
        ap.print_help()


if __name__ == "__main__":
    main()
