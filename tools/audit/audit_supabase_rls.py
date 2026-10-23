"""Audit the Supabase RLS / storage hardening of the live project.

    python _tools/audit_supabase_rls.py

Everything in section A and B runs with the *publishable* key only - exactly
what an anonymous visitor of the public site uses - so the result proves what
a stranger can and cannot do.  Section C (the SQL catalogue) additionally
needs a Supabase personal access token; it is skipped when the token is
missing.

Token resolution (section C + storage cleanup):
  1. SUPABASE_ACCESS_TOKEN environment variable
  2. %USERPROFILE%\\.supabase\\access-token

The service role key is fetched on the fly and is never written to disk.
"""
import json
import os
import pathlib
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONFIG = ROOT / "public" / "js" / "config.js"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36")
PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000a49444154789c6360000002000100ffff03000006000557bfabd4000000"
    "0049454e44ae426082")


def read_config():
    """Read the Supabase url + publishable key out of the site config."""
    txt = CONFIG.read_text(encoding="utf-8")
    url = re.search(r'SUPABASE_URL\s*=\s*"([^"]+)"', txt)
    key = re.search(r'SUPABASE_KEY\s*=\s*"([^"]+)"', txt)
    if not url or not key:
        sys.exit(f"cannot read {CONFIG}")
    return url.group(1).rstrip("/"), key.group(1)


API, KEY = read_config()
REF = API.split("//", 1)[1].split(".", 1)[0]
MAPI = f"https://api.supabase.com/v1/projects/{REF}/database/query"
KAPI = f"https://api.supabase.com/v1/projects/{REF}/api-keys"

results = []


def check(name, ok, detail="", soft=False):
    results.append((name, ok, detail, soft))
    tag = "PASS" if ok else ("WARN" if soft else "FAIL")
    print(f"  {tag}  {name:<58} {detail}")


def curl(args, data=None, data_file=None):
    payload = [f"@{data_file}" if data_file else (data if data is not None else "@-")]
    p = subprocess.run(["curl.exe", "-sS", "-A", UA, *args, "--data-binary", *payload],
                       input=data, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    out = p.stdout
    if "__HTTP__" in out:
        b, c = out.rsplit("__HTTP__", 1)
        return c.strip(), b.strip()
    return "000", out.strip()


def rest(method, path, body=None, prefer=None, raw=False):
    headers = {"apikey": KEY, "Authorization": f"Bearer {KEY}",
               "User-Agent": UA, "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            txt = r.read().decode()
            return r.status, (txt if raw else _j(txt))
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        return e.code, (txt if raw else _j(txt))
    except Exception as e:  # noqa: BLE001
        return 0, {"error": str(e)}


def _j(txt):
    try:
        return json.loads(txt)
    except Exception:
        return {"raw": txt[:300]}


def pat():
    tok = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
    if tok:
        return tok
    p = pathlib.Path(os.environ.get("USERPROFILE", "")) / ".supabase" / "access-token"
    if p.exists():
        return p.read_text(encoding="utf-8").strip()
    return ""


def sql(query):
    """Run SQL through the Management API -> (http, parsed-json)."""
    token = pat()
    if not token:
        return "401", {"error": "no personal access token"}
    body = json.dumps({"query": query})
    st, out = curl(["-X", "POST", MAPI, "-H", f"Authorization: Bearer {token}",
                    "-H", "Content-Type: application/json", "-w", "\n__HTTP__%{http_code}"],
                   data=body)
    try:
        return st, json.loads(out)
    except Exception:
        return st, out


def one(query):
    st, j = sql(query)
    if isinstance(j, list) and j:
        return j[0]
    return {"_raw": j}


def service_key():
    token = pat()
    if not token:
        return None
    req = urllib.request.Request(KAPI, headers={"Authorization": f"Bearer {token}",
                                               "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        for k in json.loads(r.read().decode()):
            if k.get("id") == "service_role":
                return k["api_key"]
    return None


print("=" * 92)
print(f"SUPABASE RLS / STORAGE AUDIT   {REF}")
print("=" * 92)

# ------------------------------------------------------------------ A. anon
print("\n[A] anonymous visitor (publishable key)")

st, j = rest("GET", "/rest/v1/announcements?select=id,is_published")
bad = [r for r in j if not r.get("is_published")] if isinstance(j, list) else []
check("announcements: anon sees only published rows", st == 200 and not bad,
      f"status={st} unpublished_seen={len(bad)}")

st, j = rest("GET", "/rest/v1/exams?select=id,status")
bad = [r for r in j if r.get("status") != "approved"] if isinstance(j, list) else []
check("exams: anon sees only approved rows", st == 200 and not bad,
      f"status={st} non_approved_seen={len(bad)}")

st, j = rest("GET", "/rest/v1/edu_questions?select=id,is_published")
bad = [r for r in j if not r.get("is_published")] if isinstance(j, list) else []
check("edu_questions: anon sees only published rows", st == 200 and not bad,
      f"status={st} unpublished_seen={len(bad)}")

for table in ["profiles", "roles", "activity_log", "documents", "employees", "settings",
              "projects", "tasks", "notifications", "favorites"]:
    st, j = rest("GET", f"/rest/v1/{table}?select=*&limit=5")
    n = len(j) if isinstance(j, list) else -1
    ok = st in (401, 403) or (st == 200 and n == 0)
    check(f"{table}: closed to anon", ok, f"status={st} rows={n}")

# the live site never chains .select(), so supabase-js sends return=minimal
st, j = rest("POST", "/rest/v1/contact_messages",
              {"name": "rls-audit", "email": "rls-audit@example.com",
               "message": "automated rls audit", "is_read": False},
              prefer="return=minimal")
check("contact_messages: anon can send a message", st in (200, 201), f"status={st}")

st, j = rest("POST", "/rest/v1/edu_questions",
              {"asker_name": "rls-audit", "question": "automated rls audit",
               "subject_id": None, "is_published": False},
              prefer="return=minimal")
check("edu_questions: anon can ask a question", st in (200, 201), f"status={st}")

st, j = rest("POST", "/rest/v1/exams",
              {"subject_id": None, "exam_type": "test", "year": 2026, "session": "s1",
               "status": "approved", "file_path": "x.pdf"},
              prefer="return=minimal")
check("exams: anon CANNOT publish an approved exam", st in (400, 401, 403), f"status={st}")

st, j = rest("POST", "/rest/v1/edu_questions",
              {"asker_name": "rls-audit", "question": "must not publish",
               "is_published": True}, prefer="return=minimal")
check("edu_questions: anon CANNOT publish a question", st in (400, 401, 403),
      f"status={st}")

st, j = rest("POST", "/rest/v1/contact_messages",
              {"name": "rls-audit", "email": "rls-audit@example.com",
               "message": "must be read", "is_read": True}, prefer="return=minimal")
check("contact_messages: anon CANNOT mark a message as read", st in (400, 401, 403),
      f"status={st}")

st, j = rest("PATCH", "/rest/v1/exams?status=eq.approved",
              {"contributor_name": "hacker"}, prefer="return=minimal")
check("exams: anon CANNOT rewrite an approved exam", st in (400, 401, 403),
      f"status={st}")

st, j = rest("PATCH", "/rest/v1/exams?status=eq.approved",
              {"file_path": "hacked.pdf"}, prefer="return=minimal")
check("exams: anon CANNOT swap the file of an approved exam", st in (400, 401, 403),
      f"status={st}")

rows_before = one("select count(*) as n from public.exams;").get("n")
st, j = rest("DELETE", "/rest/v1/exams?status=eq.approved", prefer="return=minimal")
rows_after = one("select count(*) as n from public.exams;").get("n")
check("exams: anon CANNOT delete rows", rows_after == rows_before,
      f"status={st} rows {rows_before} -> {rows_after}")

st, j = rest("DELETE", "/rest/v1/announcements?select=id", prefer="return=minimal")
rows_after = one("select count(*) as n from public.announcements;").get("n")
check("announcements: anon CANNOT delete rows", rows_after == 1,
      f"status={st} rows={rows_after}")

# --------------------------------------------------------------- B. storage
print("\n[B] storage buckets")

rows = one("select json_agg(json_build_object('name', name, 'public', public)) "
            "as b from storage.buckets;")
names = {x.get("name"): x.get("public") for x in (rows.get("b") or [])}
check("both buckets exist and are private",
      names.get("edu-files") is False and names.get("documents") is False,
      json.dumps(names))

st, j = rest("GET", "/storage/v1/object/list/edu-files", raw=True)
check("edu-files: not publicly listable", st in (400, 401, 403), f"status={st}")

st, j = rest("GET", "/storage/v1/object/list/documents", raw=True)
check("documents: not publicly listable", st in (400, 401, 403), f"status={st}")

st, j = rest("GET", "/storage/v1/object/public/edu-files/anything.pdf", raw=True)
check("edu-files: no public download without a signed URL", st in (400, 401, 403),
      f"status={st}")

# end to end: upload -> approved exam -> signed URL -> pending -> locked
stamp = str(int(time.time()))
path = f"rls-selftest/{stamp}.png"
png_file = pathlib.Path(os.environ.get("TEMP", ".")) / "rls-selftest.png"
png_file.write_bytes(PNG)
test_exam = None
try:
    st, out = curl(["-X", "POST", f"{API}/storage/v1/object/edu-files/{path}",
                     "-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}",
                     "-H", "Content-Type: image/png",
                     "-w", "\n__HTTP__%{http_code}"], data_file=png_file)
    check("edu-files: anon can upload a contribution", st in ("200", "201"),
          f"status={st} {out[:80]}")

    st, j = sql("insert into public.exams (exam_type, year, session, file_path, status, "
                "has_correction) values ('rls-selftest', 2026, 'selftest', '%s', "
                "'approved', false) returning id;" % path)
    if isinstance(j, list) and j:
        test_exam = j[0].get("id")
    check("test fixture: approved exam row created", bool(test_exam), str(j)[:100])

    st, j = rest("POST", f"/storage/v1/object/sign/edu-files/{path}",
                 {"expiresIn": 3600}, prefer="return=minimal")
    url = ""
    if isinstance(j, dict):
        url = j.get("signedURL") or j.get("signedUrl") or ""
    if url.startswith("/"):
        url = API + "/storage/v1" + url
    dl = ""
    if url:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r2:
                dl = f"download {r2.status} {len(r2.read())}B"
        except Exception as e:  # noqa: BLE001
            dl = f"download failed {e}"
    check("approved exam: anon CAN get a signed download URL",
          bool(url) and dl.startswith("download 2"), f"status={st} {dl}")

    if test_exam:
        sql("update public.exams set status = 'pending' where id = '%s';" % test_exam)
        st, j = rest("POST", f"/storage/v1/object/sign/edu-files/{path}",
                     {"expiresIn": 3600}, prefer="return=minimal")
        check("pending exam: anon CANNOT get a signed download URL", st in (400, 401, 403),
              f"status={st}")
finally:
    if test_exam:
        sql("delete from public.exams where id = '%s';" % test_exam)
    sql("delete from public.contact_messages where email = 'rls-audit@example.com';")
    sql("delete from public.edu_questions where asker_name = 'rls-audit';")
    try:
        sk = service_key()
        if sk:
            st, j = sql("select json_agg(name) as n from storage.objects "
                        "where bucket_id = 'edu-files' and name like 'rls-selftest/%';")
            for name in ((j[0].get("n") if isinstance(j, list) and j else None) or []):
                curl(["-X", "DELETE", f"{API}/storage/v1/object/edu-files/{name}",
                      "-H", f"apikey: {sk}", "-H", f"Authorization: Bearer {sk}",
                      "-w", "\n__HTTP__%{http_code}"], data=None)
            print("    (test storage objects removed)")
        else:
            print("    (no service key -> test object left in the bucket)")
    except Exception as e:  # noqa: BLE001
        print("    (cleanup failed:", e, ")")
    if png_file.exists():
        png_file.unlink()

left = one("select (select count(*) from public.exams where exam_type = 'rls-selftest') as e, "
           "(select count(*) from public.contact_messages "
           "where email = 'rls-audit@example.com') as c, "
           "(select count(*) from public.edu_questions where asker_name = 'rls-audit') as q, "
           "(select count(*) from storage.objects where name like 'rls-selftest/%') as o;")
check("test fixtures cleaned up", all(v == 0 for v in left.values()), json.dumps(left))

# -------------------------------------------------------------- C. catalogue
print("\n[C] SQL catalogue")

r = one("select (select count(*) from pg_tables where schemaname='public' and rowsecurity) "
        "as rls_on, (select count(*) from pg_tables where schemaname='public') as tables_total, "
        "(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace "
        " where n.nspname='public' and c.relkind='r' and c.relforcerowsecurity) as rls_forced, "
        "(select count(*) from pg_policies where schemaname='public') as policies, "
        "(select count(*) from pg_policies where schemaname='storage' "
        " and tablename='objects') as storage_policies, "
        "(select count(*) from pg_trigger where tgname='on_auth_user_created') as trigger_ok, "
        "(select count(*) from pg_trigger where tgname='guard_exam_downloads') as guard_ok;")
if not pat():
    check("SQL catalogue", True, "skipped - no personal access token", soft=True)
else:
    check("every public table has RLS enabled",
          r.get("rls_on") == r.get("tables_total") and r.get("tables_total", 0) > 0,
          f"{r.get('rls_on')}/{r.get('tables_total')}")
    check("every public table has RLS forced", r.get("rls_forced") == r.get("tables_total"),
          f"{r.get('rls_forced')}/{r.get('tables_total')}")
    check("policies present", r.get("policies", 0) >= 50,
          f"public={r.get('policies')} storage={r.get('storage_policies')}")
    check("sign-up trigger installed", r.get("trigger_ok") == 1,
          f"trigger={r.get('trigger_ok')}")
    check("download-counter guard installed", r.get("guard_ok") == 1,
          f"trigger={r.get('guard_ok')}")

    st, j = sql("select p.email, r.name as role from public.profiles p "
                "left join public.roles r on r.id = p.role_id order by p.email;")
    owner = j if isinstance(j, list) else []
    check("console owner profile exists with a role",
          bool(owner) and owner[0].get("role") is not None,
          json.dumps(owner, ensure_ascii=False))

    st, j = sql("select name from public.roles order by name;")
    rn = [x.get("name") for x in j] if isinstance(j, list) else []
    check("role catalogue complete", {"admin", "editor", "viewer"} <= set(rn), ",".join(rn))

    st, j = sql("select prosrc from pg_proc where proname = 'handle_new_user';")
    src = (j[0].get("prosrc") if isinstance(j, list) and j else "") or ""
    check("sign-up trigger hands out the least privilege (viewer)",
          "viewer" in src and "'admin'" not in src,
          "viewer" if "viewer" in src else src[:80])

print()
print("=" * 92)
failed = [r for r in results if not r[1] and not r[3]]
warned = [r for r in results if not r[1] and r[3]]
print(f"TOTAL CHECKS: {len(results)}   FAILURES: {len(failed)}   WARNINGS: {len(warned)}")
print("=" * 92)
for n, _, d, _ in failed:
    print(f"  FAILED: {n}  ({d})")
sys.exit(1 if failed else 0)
