#!/bin/bash
# 클라우드 세션 시작 시 agent-browser CLI를 준비하고 브라우저 경로를 연결한다.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
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

# 3) GSD 설치 (홈 폴더는 세션마다 초기화되므로 매번 확인, 이미 있으면 건너뜀)
if [ ! -f "$HOME/.claude/skills/gsd-help/SKILL.md" ]; then
  npx --yes @opengsd/gsd-core@latest --claude --global >/dev/null 2>&1 || echo "GSD: 설치 실패 (네트워크 정책 확인 필요)" >&2
fi

agent-browser --version
