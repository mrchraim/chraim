#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تطبيق migration تعزيز RLS على Supabase عبر Management API.
يحتاج: SUPABASE_ACCESS_TOKEN (Personal Access Token من supabase.com/dashboard/account/tokens)
       + SUPABASE_PROJECT_REF (المعرّف ديال المشروع: idpafbyefrywjixskvvu)

الاستعمال:
    set SUPABASE_ACCESS_TOKEN=sbp_xxx
    C:\\Python315\\python.exe _tools\\apply_supabase.py --check
    C:\\Python315\\python.exe _tools\\apply_supabase.py --apply supabase\\migrations\\20261021_harden_rls_policies_v2.sql
    C:\\Python315\\python.exe _tools\\apply_supabase.py --query "select tablename from pg_tables where schemaname='public'"

ملاحظة: --check كيعرض حالة RLS لكل جدول بلا ما يبدّل والو.
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.error

REF_DEFAULT = "idpafbyefrywjixskvvu"
API = "https://api.supabase.com/v1"


def token():
    t = os.environ.get("SUPABASE_ACCESS_TOKEN") or os.environ.get("SUPABASE_TOKEN")
    if not t:
        print("ERROR: ضع SUPABASE_ACCESS_TOKEN فـ البيئة.")
        sys.exit(2)
    return t


def run_sql(ref, sql):
    url = API + "/projects/" + ref + "/database/query"
    body = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={"Authorization": "Bearer " + token(),
                 "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode("utf-8", "replace")[:800])
        raise


RLS_REPORT = """
select t.tablename,
       c.relrowsecurity   as rls_enabled,
       c.relforcerowsecurity as rls_forced,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=t.tablename) as policies
from pg_tables t
join pg_class c on c.relname=t.tablename
join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
where t.schemaname='public'
order by t.tablename;
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", default=REF_DEFAULT)
    ap.add_argument("--check", action="store_true", help="اعرض حالة RLS (قراءة فقط)")
    ap.add_argument("--apply", metavar="FILE", help="طبّق ملف SQL")
    ap.add_argument("--query", metavar="SQL", help="نفّذ استعلام")
    args = ap.parse_args()

    if args.check:
        res = run_sql(args.ref, RLS_REPORT)
        rows = res if isinstance(res, list) else res.get("result", res)
        print("جدول | RLS | FORCED | سياسات")
        print("-----|-----|--------|-------")
        for r in rows:
            print(f"{r['tablename']} | {r['rls_enabled']} | {r['rls_forced']} | {r['policies']}")

    if args.apply:
        if not os.path.exists(args.apply):
            print("ERROR: الملف ما كاينش:", args.apply); sys.exit(2)
        sql = open(args.apply, encoding="utf-8").read()
        print("→ كيتطبّق:", args.apply, "(" + str(len(sql)) + " حرف)")
        res = run_sql(args.ref, sql)
        print("✔ تم التطبيق.", json.dumps(res)[:300] if res is not None else "")

    if args.query:
        res = run_sql(args.ref, args.query)
        print(json.dumps(res, indent=2, ensure_ascii=False)[:4000])

    if not (args.check or args.apply or args.query):
        ap.print_help()


if __name__ == "__main__":
    main()
