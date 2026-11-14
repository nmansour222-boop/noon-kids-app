#!/usr/bin/env bash
# ============================================================
# نشر تطبيق «نون»
#   NETLIFY_AUTH_TOKEN=xxx ./deploy.sh netlify [اسم-الموقع]
#   VERCEL_TOKEN=xxx      ./deploy.sh vercel  [اسم-المشروع]
#   GITHUB_TOKEN=xxx GITHUB_OWNER=user REPO=name ./deploy.sh github
#   ./deploy.sh zip        # يبني ملف noon-app.zip فقط
# التوكينات تُقرأ من البيئة فقط — لا تُكتب على القرص.
# ============================================================
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$HERE/app"
ZIP="$HERE/noon-app.zip"
ACTION="${1:-zip}"

build_zip() {
  echo "→ تجهيز الأرشيف…"
  ( cd "$APP" && zip -qr "$ZIP" . )
  echo "  $ZIP  ($(du -h "$ZIP" | cut -f1))"
}

case "$ACTION" in
  zip)
    build_zip
    ;;

  netlify)
    : "${NETLIFY_AUTH_TOKEN:?لازم NETLIFY_AUTH_TOKEN}"
    SITE_NAME="${2:-noon-kids-app}"
    build_zip
    echo "→ إنشاء الموقع…"
    SITE_JSON=$(curl -sS -X POST "https://api.netlify.com/api/v1/sites" \
      -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"$SITE_NAME\"}")
    SITE_ID=$(printf '%s' "$SITE_JSON" | python3 -c "import sys,json;print(json.load(sys.stdin).get('id',''))")
    URL=$(printf '%s' "$SITE_JSON" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('ssl_url') or d.get('url',''))")
    if [ -z "$SITE_ID" ]; then
      echo "فشل إنشاء الموقع:"; printf '%s\n' "$SITE_JSON"; exit 1
    fi
    echo "  $URL  ($SITE_ID)"
    echo "→ رفع النسخة…"
    DEPLOY_JSON=$(curl -sS -X POST "https://api.netlify.com/api/v1/sites/$SITE_ID/deploys" \
      -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
      -H "Content-Type: application/zip" \
      --data-binary "@$ZIP")
    DEPLOY_ID=$(printf '%s' "$DEPLOY_JSON" | python3 -c "import sys,json;print(json.load(sys.stdin).get('id',''))")
    echo "→ انتظار المعالجة…"
    for i in $(seq 1 60); do
      sleep 3
      STATE=$(curl -sS -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
        "https://api.netlify.com/api/v1/deploys/$DEPLOY_ID" \
        | python3 -c "import sys,json;print(json.load(sys.stdin).get('state',''))")
      echo "  [$i] $STATE"
      [ "$STATE" = "ready" ] && break
      [ "$STATE" = "error" ] && { echo "فشل النشر"; exit 1; }
    done
    echo "✅ جاهز: $URL"
    ;;

  vercel)
    : "${VERCEL_TOKEN:?لازم VERCEL_TOKEN}"
    echo "→ نشر على Vercel…"
    ( cd "$HERE" && npx --yes vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN" )
    ;;

  github)
    : "${GITHUB_TOKEN:?لازم GITHUB_TOKEN}"
    : "${GITHUB_OWNER:?لازم GITHUB_OWNER}"
    : "${REPO:?لازم REPO}"
    cd "$HERE"
    if [ ! -d .git ]; then
      git init -q
      git checkout -q -b main
    fi
    git add -A
    git -c user.name="noon-deploy" -c user.email="deploy@local" commit -q -m "نون: تطبيق تعليمي للأطفال 4–5 سنوات" || echo "  (لا تغييرات جديدة)"
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://x-access-token:$GITHUB_TOKEN@github.com/$GITHUB_OWNER/$REPO.git"
    git push -u origin main
    echo "✅ https://github.com/$GITHUB_OWNER/$REPO"
    ;;

  *)
    echo "استخدم: zip | netlify | vercel | github"; exit 1
    ;;
esac
