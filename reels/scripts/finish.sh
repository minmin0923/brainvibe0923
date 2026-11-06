#!/usr/bin/env bash
# 무음 렌더 + 사운드트랙 → 최종 mp4(H.264 yuv420p CRF 20, AAC 256k, +faststart), 마지막 프레임 → cover.jpg
# Remotion 출력은 풀레인지(yuvj420p)라 표준 범위 yuv420p로 다시 인코딩한다.
# 사용: bash scripts/finish.sh [접두어]   예) bash scripts/finish.sh ep2_  → out/ep2_video_muted.mp4 + out/ep2_soundtrack.wav → out/ep2_reels_60s.mp4, out/ep2_cover.jpg
set -euo pipefail
cd "$(dirname "$0")/.."
P="${1:-}"

ffmpeg -loglevel error -y \
  -i "out/${P}video_muted.mp4" -i "out/${P}soundtrack.wav" \
  -map 0:v:0 -map 1:a:0 \
  -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -ac 2 \
  -t 60 -movflags +faststart \
  "out/${P}reels_60s.mp4"

# 마지막 정지 프레임(0.6초 유지 구간)을 썸네일로
ffmpeg -loglevel error -y -sseof -0.2 -i "out/${P}reels_60s.mp4" -frames:v 1 -q:v 2 -s 1080x1920 "out/${P}cover.jpg"
echo "out/${P}reels_60s.mp4, out/${P}cover.jpg"
