"""엔딩 카드(6초)용 소리: 두 편의 마지막 C장조를 이어받는 조용한 피아노 분산화음 + 아주 약한 공기음. 1탄과 같은 악기·잔향."""
import os, sys
import numpy as np
import soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import score as s1  # noqa: E402

L = 6.0
notes = [s1.Note(0.35 + i * 0.42, 3.6 - i * 0.3, m, 44) for i, m in enumerate((60, 64, 67, 72))]
notes += [s1.Note(2.4, 3.3, m, 36) for m in (48, 55, 64)]
st = {k: np.zeros((s1.sec(L), 2), np.float32) for k in s1.PROG}
st["piano"] = s1.render_stem(s1.PROG["piano"], notes, L)
music = s1.music_bus(st)[: s1.sec(L)]
fx = np.zeros((s1.sec(L), 2))
s1.ambience(fx, 0, L, 0.004, 300, 1500)
out = music + fx
# 마지막 0.6초 페이드아웃
n = s1.sec(0.6)
out[-n:] *= np.linspace(1, 0, n)[:, None]
# 본편 엔딩(−15~−17 dB RMS)보다 한 단계 낮게: 약 −24 dB RMS
out *= 10 ** ((-24 - s1.rms_db(out[: s1.sec(5.4)])) / 20)
sf.write(os.path.join(os.path.dirname(HERE), "out", "endcard_audio.wav"), out.astype(np.float32), s1.SR, subtype="PCM_24")
print("out/endcard_audio.wav", round(s1.rms_db(out), 1), "dB RMS, peak", round(20 * np.log10(np.abs(out).max()), 1), "dBFS")
