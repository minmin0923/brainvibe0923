"""out/soundtrack.wav의 시간별 음량(RMS 100ms) 그래프를 out/audio_levels.png로 그린다."""
import json
import os

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
y, sr = sf.read(os.path.join(ROOT, "out", "soundtrack.wav"))
rep = json.load(open(os.path.join(HERE, "report.json")))
W, H, L, R, T, B = 1800, 760, 90, 30, 70, 90
win = int(sr * 0.1)
n = len(y) // win
rms = np.array([10 * np.log10(np.mean(y[i * win : (i + 1) * win] ** 2) + 1e-12) for i in range(n)])
img = Image.new("RGB", (W, H), (251, 246, 236))
d = ImageDraw.Draw(img)
font_path = "DejaVuSans.ttf"
try:
    f = ImageFont.truetype(font_path, 22)
    fs = ImageFont.truetype(font_path, 17)
except OSError:
    f = fs = ImageFont.load_default()
x = lambda t: L + (W - L - R) * t / 60.0
yv = lambda db: T + (H - T - B) * (-(max(-60, min(0, db)))) / 60.0
for db in range(0, -61, -10):
    d.line([(L, yv(db)), (W - R, yv(db))], fill=(228, 220, 205))
    d.text((L - 60, yv(db) - 12), f"{db} dB", fill=(58, 51, 70), font=fs)
for t in range(0, 61, 5):
    d.text((x(t) - 12, H - B + 10), f"{t}s", fill=(58, 51, 70), font=fs)
for s in rep["sections"]:
    x0, x1 = x(s["from"]), x(s["to"])
    d.line([(x0, T), (x0, H - B)], fill=(214, 204, 186))
    d.line([(x0, yv(s["target_rms_db"])), (x1, yv(s["target_rms_db"]))], fill=(233, 168, 107), width=4)
    d.line([(x0, yv(s["rms_db"])), (x1, yv(s["rms_db"]))], fill=(232, 80, 138), width=3)
pts = [(x((i + 0.5) * 0.1), yv(v)) for i, v in enumerate(rms)]
d.line(pts, fill=(58, 51, 70), width=2)
d.text((L, 18), f"soundtrack level   integrated {rep['integrated_lufs']} LUFS   true peak {rep['true_peak_dbtp']} dBTP   clipped {rep['clipped_samples']}", fill=(58, 51, 70), font=f)
d.text((W - 640, H - 40), "     100ms RMS          target          measured", fill=(58, 51, 70), font=fs)
d.line([(W - 640, H - 29), (W - 625, H - 29)], fill=(58, 51, 70), width=3)
d.line([(W - 488, H - 29), (W - 473, H - 29)], fill=(233, 168, 107), width=4)
d.line([(W - 372, H - 29), (W - 357, H - 29)], fill=(232, 80, 138), width=3)
img.save(os.path.join(ROOT, "out", "audio_levels.png"))
print("out/audio_levels.png")
