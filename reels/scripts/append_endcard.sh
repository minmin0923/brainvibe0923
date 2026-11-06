#!/usr/bin/env bash
# 행사 엔딩 카드(6초)를 본편 뒤에 0.5초 디졸브로 붙인다.
# 사용: bash scripts/append_endcard.sh            → out/reels_60s_event.mp4 (1탄)
#       bash scripts/append_endcard.sh ep2_       → out/ep2_reels_60s_event.mp4 (2탄)
set -euo pipefail
cd "$(dirname "$0")/.."
P="${1:-}"
# 엔딩 카드 단독본(소리 포함) + 정지 이미지
if [ ! -s out/endcard.mp4 ]; then
  ffmpeg -loglevel error -y -i out/endcard_muted.mp4 -i out/endcard_audio.wav -map 0:v -map 1:a \
    -vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
    -c:a aac -b:a 256k -ar 48000 -ac 2 -shortest -movflags +faststart out/endcard.mp4
  ffmpeg -loglevel error -y -sseof -0.1 -i out/endcard.mp4 -frames:v 1 -q:v 2 out/endcard.jpg
fi
ffmpeg -loglevel error -y -i "out/${P}reels_60s.mp4" -i out/endcard.mp4 -filter_complex \
  "[0:v]format=yuv420p,settb=AVTB,fps=30[a];[1:v]format=yuv420p,settb=AVTB,fps=30[e];[a][e]xfade=transition=fade:duration=0.5:offset=59.5[v];[0:a][1:a]acrossfade=d=0.5:c1=tri:c2=tri,alimiter=limit=0.79:level=false:attack=1:release=60[au]" \
  -map "[v]" -map "[au]" -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart "out/${P}reels_60s_event.mp4"
echo "out/${P}reels_60s_event.mp4"
