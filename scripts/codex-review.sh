#!/bin/bash
# Claude가 만든 초안을 Codex에게 검토받는다.
# 사용법: scripts/codex-review.sh <작업폴더> [라운드번호]
#   <작업폴더>/request.md  : 사용자의 원래 지시사항
#   <작업폴더>/draft.md    : Claude 초안 (코드 작업이면 변경 요약과 파일 목록)
# 결과: <작업폴더>/review-<라운드>.md
set -uo pipefail

dir="${1:?작업폴더를 지정하세요}"
round="${2:-1}"
out="$dir/review-$round.md"

for f in request.md draft.md; do
  [ -f "$dir/$f" ] || { echo "없음: $dir/$f" >&2; exit 2; }
done
command -v codex >/dev/null 2>&1 || { echo "CODEX_UNAVAILABLE: codex CLI가 없습니다" | tee "$out"; exit 3; }

prompt="$(cat <<PROMPT
너는 다른 AI(Claude)가 만든 초안을 검토하는 시니어 리뷰어다. 초안을 직접 고쳐 쓰지 말고 검토 의견만 낸다.
저장소의 파일을 읽어서 사실을 확인해도 된다. 파일을 수정하지 않는다.

## 사용자의 원래 지시사항
$(cat "$dir/request.md")

## Claude의 초안
$(cat "$dir/draft.md")

## 아래 형식으로, 한국어로 답하라
### 1. 정정할 부분
틀린 사실, 버그, 지시사항과 어긋난 점. 항목마다 근거(파일:줄 또는 이유)와 고칠 방법.
### 2. 빠진 부분
요구사항 중 다루지 않은 것, 예외 상황, 검증 단계, 위험 요소.
### 3. 더 구체화할 부분
모호한 설명을 실행 가능한 단계, 수치, 예시로 바꾸는 제안.
### 4. 다른 방식 (바리에이션)
초안과 다른 접근 2~3가지와 각각의 장단점. 초안보다 나은 것이 있으면 추천.
### 5. 우선순위 요약
반드시 반영할 것 / 반영하면 좋은 것 / 선택 사항으로 나눈 목록.
문제가 없는 항목은 "없음"이라고 쓴다. 근거 없는 칭찬은 쓰지 않는다.
PROMPT
)"

limit="${CODEX_TIMEOUT:-540}"  # 초. Bash 도구 최대 대기(600초)보다 짧게
if ! timeout "$limit" codex exec --skip-git-repo-check -s read-only -o "$out" "$prompt" \
     </dev/null >"$dir/codex-log-$round.txt" 2>&1; then
  reason="$(grep -m1 -E '^ERROR: [^R]' "$dir/codex-log-$round.txt" || echo "시간 초과 또는 알 수 없는 오류 (로그: $dir/codex-log-$round.txt)")"
  echo "CODEX_FAILED: $reason" | tee "$out"
  exit 4
fi
echo "검토 완료: $out"
