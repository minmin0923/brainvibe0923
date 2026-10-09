#!/bin/bash
# 클라우드 세션 시작 시 agent-browser CLI를 준비하고 브라우저 경로를 연결한다.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# 0) ig-* 스킬이 읽고 쓰는 ~/.claude/instagram 을 저장소의 instagram/ 폴더로 연결한다.
#    (클라우드 세션은 끝나면 지워지므로 말투·레퍼런스·기록을 저장소에 남긴다)
if [ ! -e "$HOME/.claude/instagram" ] || [ -L "$HOME/.claude/instagram" ]; then
  mkdir -p "$HOME/.claude"
  ln -sfn "$CLAUDE_PROJECT_DIR/instagram" "$HOME/.claude/instagram"
fi

# 1) agent-browser CLI 설치 (이미 있으면 건너뜀)
if ! command -v agent-browser >/dev/null 2>&1; then
  npm install -g agent-browser@latest >/dev/null 2>&1
fi

# 2) 미리 설치된 Chromium이 있으면 그것을 쓰고, 없으면 다운로드를 시도한다.
chrome_path="$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | sort -V | tail -n 1 || true)"
if [ -n "$chrome_path" ] && [ -x "$chrome_path" ]; then
  if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo "export AGENT_BROWSER_EXECUTABLE_PATH=\"$chrome_path\"" >> "$CLAUDE_ENV_FILE"
  fi
else
  agent-browser install >/dev/null 2>&1 || echo "agent-browser: 브라우저 다운로드 실패 (네트워크 정책 확인 필요)" >&2
fi

agent-browser --version
