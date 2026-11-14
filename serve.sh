#!/usr/bin/env bash
# تشغيل تطبيق «نون» محلياً — لازم localhost عشان الأوفلاين و PWA
PORT="${1:-8080}"
echo "نون شغّال على: http://localhost:$PORT"
python3 -m http.server "$PORT" --directory "$(dirname "$0")/app"
