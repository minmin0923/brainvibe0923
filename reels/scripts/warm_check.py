"""2탄 체크 4: 아빠가 바깥에 있는 장면 프레임에서 '따뜻한 색' 픽셀 비율을 잰다.
따뜻한 색 = 색상 15°~65°(주황·노랑), 채도 0.25 이상, 명도 0.35 이상. 하린 관련 분홍(330°~350°)은 별도 규칙이라 제외.
사용: python3 scripts/warm_check.py out/ep2_reels_60s.mp4"""
import colorsys, subprocess, sys, json
import numpy as np

MP4 = sys.argv[1]
# (장면, 시각초) — 바깥 장면 + 비교용 집 장면
SHOTS = [("S03 첫차", 8.3), ("S04 1호선", 11.5), ("S05 계단", 14.0), ("S05 게이트", 15.8), ("S06 사무실", 17.5), ("S06 메시지", 19.5),
         ("S07 퇴근 1호선", 21.0), ("S09 역 계단", 27.2), ("S09 정류장", 29.0), ("S10 아래(정류장)", 31.5), ("S12 복도", 37.2),
         ("S12 문 열리기 전", 39.0), ("S12 문 열린 뒤(얼굴에 빛)", 39.95), ("[집] S08 엄마의 저녁", 25.0), ("[집] S13 다녀왔어", 42.5)]

def frame(t):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", MP4, "-frames:v", "1", "-vf", "scale=270:480", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(480, 270, 3) / 255.0

def warm_ratio(img, region=None):
    if region:
        y0, y1 = region
        img = img[y0:y1]
    mx, mn = img.max(2), img.min(2)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    warm = (h >= 15) & (h <= 65) & (s >= 0.25) & (v >= 0.35)
    return float(warm.mean())

res = {}
for name, t in SHOTS:
    img = frame(t)
    res[name] = round(warm_ratio(img) * 100, 2)
print(json.dumps(res, ensure_ascii=False, indent=1))
