"""최종 out/reels_60s.mp4를 직접 열어 납품 사양과 음량 항목을 검사한다."""
import json
import os
import subprocess
import sys

import numpy as np
import pyloudnorm as pyln
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFIX = sys.argv[1] if len(sys.argv) > 1 else ""
MP4 = os.path.join(ROOT, "out", f"{PREFIX}reels_60s.mp4")
SR = 48000


def probe():
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-count_frames", "-of", "json", MP4],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def audio():
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", MP4, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def rms_db(x):
    return 10 * np.log10(np.mean(x**2) + 1e-20)


def main():
    p = probe()
    v = next(s for s in p["streams"] if s["codec_type"] == "video")
    a = next(s for s in p["streams"] if s["codec_type"] == "audio")
    # faststart: moov가 mdat보다 앞에 있는지
    with open(MP4, "rb") as f:
        head = f.read(200000)
    faststart = head.find(b"moov") != -1 and (head.find(b"mdat") == -1 or head.find(b"moov") < head.find(b"mdat"))
    y = audio()
    meter = pyln.Meter(SR)
    up = signal.resample_poly(y, 4, 1, axis=0)
    t = lambda s: int(round(s * SR))
    sections = {
        "38.5–40.0 정적": rms_db(y[t(38.5) : t(40.0)]),
        "46.7–53.3 클라이맥스": rms_db(y[t(46.667) : t(53.333)]),
    }
    # 1초 창으로 가장 조용한/큰 구간 찾기(시작·끝 1초 제외)
    win = []
    for s in np.arange(1.0, 58.5, 0.25):
        win.append((s, rms_db(y[t(s) : t(s + 1.5)])))
    quietest = min(win, key=lambda w: w[1])
    loudest = max(win, key=lambda w: w[1])
    rep = {
        "video": {
            "codec": v["codec_name"], "pix_fmt": v["pix_fmt"], "size": f'{v["width"]}x{v["height"]}',
            "fps": v["r_frame_rate"], "frames": int(v.get("nb_read_frames", 0)), "duration": float(v["duration"]),
        },
        "audio": {"codec": a["codec_name"], "sample_rate": int(a["sample_rate"]), "channels": a["channels"], "bit_rate": int(a.get("bit_rate", 0))},
        "container_duration": float(p["format"]["duration"]),
        "faststart": faststart,
        "integrated_lufs": round(meter.integrated_loudness(y), 2),
        "true_peak_dbtp": round(20 * np.log10(np.max(np.abs(up)) + 1e-20), 2),
        "clipped_samples": int(np.sum(np.abs(y) >= 1.0)),
        "sections_rms_db": {k: round(v, 1) for k, v in sections.items()},
        "quietest_1.5s_window": {"start": quietest[0], "rms_db": round(quietest[1], 1)},
        "loudest_1.5s_window": {"start": loudest[0], "rms_db": round(loudest[1], 1)},
    }
    if not PREFIX:
        rep["cut_53.3"] = {
            "before_db": round(rms_db(y[t(53.25) : t(53.30)]), 1),
            "after_first_20ms_db": round(rms_db(y[t(53.334) : t(53.354)]), 1),
        }
    json.dump(rep, open(os.path.join(ROOT, "out", f"{PREFIX}verify.json"), "w"), ensure_ascii=False, indent=2)
    print(json.dumps(rep, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    sys.exit(main())
