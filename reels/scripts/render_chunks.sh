#!/usr/bin/env bash
# 60초 본편을 300프레임씩 나눠 렌더(브라우저를 새로 띄워 긴 렌더의 메모리 누적을 피함) → 이어 붙여 out/video_muted.mp4
# 사용: bash scripts/render_chunks.sh [컴포지션 ID=Reels] [출력=out/video_muted.mp4]
set -euo pipefail
cd "$(dirname "$0")/.."
COMP="${1:-Reels}"
OUT="${2:-out/video_muted.mp4}"
DIR="out/chunks/${COMP}"
mkdir -p "$DIR"
: > "$DIR/list.txt"
for start in 0 300 600 900 1200 1500; do
  end=$((start + 299))
  f="$DIR/part_${start}.mp4"
  if [ ! -s "$f" ]; then
    npx remotion render src/index.ts "$COMP" "$f" --muted --codec=h264 --crf=20 --pixel-format=yuv420p \
      --concurrency=4 --timeout=120000 --frames="${start}-${end}"
  fi
  echo "file 'part_${start}.mp4'" >> "$DIR/list.txt"
  echo "done ${start}-${end}"
done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$DIR/list.txt" -c copy "$OUT"
echo "$OUT"
