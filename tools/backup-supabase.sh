#!/usr/bin/env bash
# =============================================================================
#  CHRAIM Campus — نسخ احتياطي لقواعد بيانات Supabase
#  -----------------------------------------------------------------------
#  لماذا هذا الملف: مشاريع Supabase من الباقة المجانية (Free) ما عندها نسخ
#  احتياطي تلقائي — التوثيق الرسمي كينصح باستعمال `supabase db dump` دوراني
#  وتخزينه خارج المنصة.
#
#  المتطلبات:
#    * supabase CLI  (https://supabase.com/docs/guides/local-development/cli)
#    * Docker (الـ CLI كيشغّل pg_dump داخل حاوية)
#    * openssl + gzip (اختياري: للتشفير)
#
#  الاستعمال:
#    export SUPABASE_DB_URL_PORTAL='postgresql://postgres.<ref>:<pass>@<host>:5432/postgres'
#    export SUPABASE_DB_URL_PLATFORM='...'
#    export SUPABASE_DB_URL_ATLAS='...'
#    export BACKUP_PASSPHRASE='phrase-de-chiffrement'   # اختياري لكن موصى به
#    ./tools/backup-supabase.sh                         # كل المشاريع
#    ./tools/backup-supabase.sh portal                  # مشروع واحد فقط
#
#  ⚠️  مجلد backups/ مُستبعد من Git (شوف .gitignore) — المستودع عمومي.
#      عمّا ما ترفع أي dump أو توكن إلى المستودع أبداً.
# =============================================================================
set -euo pipefail

OUT_DIR="${BACKUP_DIR:-backups}"
PASSPHRASE="${BACKUP_PASSPHRASE:-}"
ALL_PROJECTS="portal platform atlas"

if ! command -v supabase >/dev/null 2>&1; then
  echo "❌ supabase CLI غير مثبّت. ثبّته أولاً (npm i -g supabase أوbrew install supabase/tap/supabase)." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker ما خدّام — `supabase db dump` كيحتاج حاوية لتشغيل pg_dump." >&2
  exit 1
fi

TARGETS="${1:-$ALL_PROJECTS}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$OUT_DIR"
ok=0
skipped=0
failed=0

dump_project() {
  local name="$1"
  local var="SUPABASE_DB_URL_$(printf '%s' "$name" | tr '[:lower:]' '[:upper:]')"
  local url="${!var:-}"

  if [ -z "$url" ]; then
    echo "⏭️  $name: ماكتش هاد المتغير $var — تخطّي."
    skipped=$((skipped + 1))
    return 0
  fi

  echo "▶️  $name: نبدأ النسخ الاحتياطي..."
  local tmp
  tmp="$WORK/$name"
  rm -rf "$tmp"
  mkdir -p "$tmp"

  # 1) الأدوار (roles) — للإرجاع الكامل على مشروع جديد
  supabase db dump --db-url "$url" --role-only -f "$tmp/roles.sql" >/dev/null
  # 2) المخطط: الجداول، الفهارس، الدوال، سياسات RLS (public فقط — المخططات
  #    المُدارة auth/storage كيستثناها الـ CLI افتراضياً)
  supabase db dump --db-url "$url" -f "$tmp/schema.sql" >/dev/null
  # 3) البيانات — بصيغة COPY لتوافقية أفضل بين إصدارات Postgres
  supabase db dump --db-url "$url" --data-only --use-copy -f "$tmp/data.sql" >/dev/null

  {
    echo "-- CHRAIM Campus backup | project=$name | utc=$STAMP"
    echo "-- restore: psql --single-transaction --variable ON_ERROR_STOP=1 --file <this>"
    echo
    cat "$tmp/roles.sql"
    echo
    cat "$tmp/schema.sql"
    echo
    cat "$tmp/data.sql"
  } > "$OUT_DIR/${name}-${STAMP}.sql"

  # 4) أفضل جهد: حسابات المستخدمين (auth) — قد يرفضه الـ CLI حسب الإصدار
  if supabase db dump --db-url "$url" --data-only --schema auth -f "$tmp/auth-data.sql" >/dev/null 2>&1; then
    if [ -s "$tmp/auth-data.sql" ]; then
      gzip -c "$tmp/auth-data.sql" > "$OUT_DIR/${name}-${STAMP}-auth.sql.gz"
      echo "   ✅ auth data: $OUT_DIR/${name}-${STAMP}-auth.sql.gz"
    fi
  else
    echo "   ⚠️  ما قدرنا نصدّر schema auth — صدّرو يدوياً من Dashboard → SQL Editor."
  fi

  # 5) التجميع + التشفير
  local final="$OUT_DIR/${name}-${STAMP}.sql"
  if [ -n "$PASSPHRASE" ] && command -v openssl >/dev/null 2>&1; then
    gzip -c "$final" | openssl enc -aes-256-cbc -pbkdf2 -iter 210000 -salt \
      -pass env:BACKUP_PASSPHRASE -out "$final.gz.enc"
    rm -f "$final"
    final="$final.gz.enc"
    echo "   🔒 مشفّر: $final"
  else
    echo "   ⚠️  بدون تشفير (ماكانش BACKUP_PASSPHRASE ولا openssl): $final"
  fi

  local size
  size="$(wc -c < "$final" | tr -d ' ')"
  sha256sum "$final" 2>/dev/null | tee "$final.sha256" || shasum -a 256 "$final" | tee "$final.sha256"
  echo "   ✅ $name → $final (${size} bytes)"
  ok=$((ok + 1))
}

for p in $TARGETS; do
  if ! dump_project "$p"; then
    echo "❌ خطأ في النسخ الاحتياطي لمشروع: $p" >&2
    failed=$((failed + 1))
  fi
done

echo
echo "النتيجة: ✅ $ok | ⏭️ $skipped | ❌ $failed"
echo "⚠️  تذكّر: backups/ عمّا ما تدخل Git (المستودع عمومي)."
[ "$failed" -eq 0 ] || exit 1
