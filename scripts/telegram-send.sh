#!/bin/bash
# 텔레그램 봇으로 글과 파일을 보낸다. GitHub Actions(telegram-send.yml)에서 실행한다.
# 입력은 모두 환경 변수로 받는다: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TEXT, FILES
set -uo pipefail

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
  echo "::error::저장소 비밀값 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 가 없습니다. Settings > Secrets and variables > Actions 에서 추가하세요."
  exit 1
fi

api="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"
fail=0

# 응답에 "ok":true 가 있는지만 확인한다. 토큰이 들어간 주소는 출력하지 않는다.
call() {
  local out
  out="$(curl -sS --max-time 60 "$@" 2>&1)" || { echo "::error::텔레그램 요청 실패"; fail=1; return; }
  if ! printf '%s' "$out" | grep -q '"ok":true'; then
    echo "::error::텔레그램이 거절했습니다: $(printf '%s' "$out" | sed "s/${TELEGRAM_BOT_TOKEN}/***/g" | head -c 300)"
    fail=1
  fi
}

# 글: 텔레그램 한도(4096자)에 맞춰 자른다.
text="$(printf '%s' "${TEXT:-}" | head -c 11000 | python3 -c 'import sys; s=sys.stdin.read(); print(s if len(s)<=3900 else s[:3900]+"\n…(이하 생략)", end="")')"
call "$api/sendMessage" --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" --data-urlencode "text=${text}" -d "disable_web_page_preview=true"

# 파일: 저장소 안의 파일만, 최대 6개.
count=0
for f in ${FILES:-}; do
  count=$((count + 1)); [ "$count" -gt 6 ] && break
  case "$f" in /*|*..*) echo "::warning::건너뜀(허용되지 않는 경로): $f"; continue ;; esac
  [ -f "$f" ] || { echo "::warning::건너뜀(파일 없음): $f"; continue; }
  size="$(stat -c %s "$f")"
  [ "$size" -gt 45000000 ] && { echo "::warning::건너뜀(45MB 초과): $f"; continue; }
  case "${f,,}" in
    *.png|*.jpg|*.jpeg)
      if [ "$size" -le 9000000 ]; then
        call "$api/sendPhoto" -F "chat_id=${TELEGRAM_CHAT_ID}" -F "photo=@${f}"
      fi
      # 사진은 화질이 줄어들 수 있어 원본도 파일로 보낸다.
      call "$api/sendDocument" -F "chat_id=${TELEGRAM_CHAT_ID}" -F "document=@${f}"
      ;;
    *) call "$api/sendDocument" -F "chat_id=${TELEGRAM_CHAT_ID}" -F "document=@${f}" ;;
  esac
done

exit "$fail"
