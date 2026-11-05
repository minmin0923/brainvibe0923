"""
「의정부의 염원을 싣고」 60초 사운드트랙.

- 타이밍: music/timeline.json (src/timeline.ts에서 내보낸 값) 하나만 쓴다.
- 악기: GeneralUser GS (tinysoundfont) — Grand Piano / Slow Strings / Cello / Concert Choir / Celeste
- 잔향: pedalboard Reverb(room_size=0.85, wet_level=0.3), 효과음은 room_size=0.3, wet_level=0.1
- 음량: pyloudnorm으로 통합 −14 LUFS, 트루피크 −1 dBTP 이하
- 0:53.3 컷아웃은 앞(0–53.3)·뒤(53.3–60) 구간을 따로 렌더해 붙인다(잔향 꼬리까지 끊김).

사용:  python3 music/score.py      (reels/ 에서 실행)
출력:  out/soundtrack.wav, music/stems/*.wav, music/report.json
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from dataclasses import dataclass

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
import tinysoundfont
from pedalboard import Compressor, Limiter, Pedalboard, Reverb
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 48000
SF2 = os.path.join(HERE, "sf2", "gugs", "GeneralUser-GS.sf2")
SF2_REPO = "https://github.com/mrbumpy409/GeneralUser-GS.git"

TL = json.load(open(os.path.join(HERE, "timeline.json")))
FPS = TL["fps"]
TOTAL_S = TL["total"] / FPS  # 60.0
BEAT_S = TL["beat"] / FPS  # 0.8333
BAR_S = TL["bar"] / FPS  # 3.3333
EV = TL["events"]


def f2s(frame: float) -> float:
    return frame / FPS


def bar_t(n: int, beat: float = 0.0) -> float:
    """n번째 마디(1부터) + beat박 → 초"""
    return (n - 1) * BAR_S + beat * BEAT_S


CUT_S = f2s(EV["climaxCut"])  # 53.333
SIL_FROM = f2s(EV["silenceFrom"])  # 38.5
SIL_TO = f2s(EV["silenceTo"])  # 40.0
N = int(round(TOTAL_S * SR))

# ---------------------------------------------------------------- 화성·선율
# 진행 Am – F – C – G 반복(1마디 = Am), 엔딩 2마디는 F – C(sus4→C)
CHORDS = {
    "Am": {"root": 45, "tones": [57, 60, 64]},
    "F": {"root": 41, "tones": [53, 57, 60]},
    "C": {"root": 48, "tones": [55, 60, 64]},
    "G": {"root": 43, "tones": [55, 59, 62]},
}


def chord_of_bar(n: int) -> str:
    if n == 17:
        return "F"
    if n == 18:
        return "C"
    return ["Am", "F", "C", "G"][(n - 1) % 4]


# 주제 선율: (MIDI, 박) — 쉼은 None
THEME = [
    [(76, 2), (74, 1), (72, 1)],
    [(72, 2), (69, 1), (72, 1)],
    [(67, 2), (76, 1), (74, 1)],
    [(74, 3), (None, 1)],
]
MOTIF = [88, 84, 81]  # 하린의 모티프 E6–C6–A5

PROG = {"piano": 0, "celesta": 8, "cello": 42, "strings": 49, "choir": 52}


@dataclass
class Note:
    t: float
    dur: float
    midi: int
    vel: int


def theme_bar(start: float, idx: int, vel: int, octave: int = 0) -> list[Note]:
    out, t = [], start
    for m, beats in THEME[idx]:
        if m is not None:
            out.append(Note(t, beats * BEAT_S * 0.98, m + 12 * octave, vel))
        t += beats * BEAT_S
    return out


def arpeggio(n: int, vel: int, beats: float = 4.0) -> list[Note]:
    """왼손 8분음 아르페지오: 근음–5도–옥타브–10도"""
    ch = CHORDS[chord_of_bar(n)]
    r = ch["root"] + 12
    pat = [r, r + 7, r + 12, ch["tones"][1] + 12 if chord_of_bar(n) != "G" else r + 16]
    pat = pat + [pat[2], pat[1], pat[2], pat[3]]
    out = []
    for i in range(int(beats * 2)):
        t = bar_t(n, i * 0.5)
        out.append(Note(t, BEAT_S * 0.9, pat[i % 8], vel - (6 if i % 2 else 0)))
    return out


def chord_notes(n: int, prog: str, vel: int, beats: float = 4.0, start_beat: float = 0) -> list[Note]:
    ch = CHORDS[chord_of_bar(n)]
    t = bar_t(n, start_beat)
    d = beats * BEAT_S
    if prog == "cello":
        return [Note(t, d, ch["root"], vel), Note(t, d, ch["root"] + 7, vel - 15)]
    if prog == "choir":
        tones = [x + 12 for x in ch["tones"]] + [ch["tones"][0] + 24]
        return [Note(t, d, m, vel) for m in tones]
    # strings: 중음역 3화음 + 위 옥타브 근음
    tones = ch["tones"] + [ch["root"] + 24]
    return [Note(t, d, m, vel) for m in tones]


def motif(t: float, vel: int = 96) -> list[Note]:
    return [Note(t + i * BEAT_S * 0.5, BEAT_S * 1.6, m, vel) for i, m in enumerate(MOTIF)]


def compose():
    """구간 표(지시서 4장)를 그대로 노트로 옮긴다. 반환: {구간: {악기: [Note]}}"""
    pre = {k: [] for k in PROG}
    post = {k: [] for k in PROG}
    P = pre["piano"]
    # 마디 2–4: 피아노 단음 (마디 2 첫 음 A3 길게)
    P.append(Note(bar_t(2), BAR_S * 1.0, 57, 70))
    P.append(Note(bar_t(3), BAR_S * 0.95, 53, 64))
    P.append(Note(bar_t(3, 2), BAR_S * 0.45, 60, 54))
    P.append(Note(bar_t(4), BAR_S * 0.95, 55, 64))
    P.append(Note(bar_t(4, 2), BAR_S * 0.45, 62, 54))
    # 마디 5–11: 왼손 아르페지오 (작게 → 점점)
    for n in range(5, 12):
        P.extend(arpeggio(n, 52 + (n - 5) * 3))
    # 마디 6–9: 주제 선율 진입, 10–11: 앞 두 마디를 옥타브 겹쳐 반복
    for i, n in enumerate(range(6, 10)):
        P.extend(theme_bar(bar_t(n), i, 66 + i * 2))
    for i, n in enumerate(range(10, 12)):
        P.extend(theme_bar(bar_t(n), i, 76))
        P.extend(theme_bar(bar_t(n), i, 60, octave=1))
    # 마디 8–11: 현악 + 첼로 진입, 점점 크게 / 마디 12 앞부분: 현악이 서서히 빠짐
    for i, n in enumerate(range(8, 12)):
        pre["strings"].extend(chord_notes(n, "strings", 58 + i * 8))
        pre["cello"].extend(chord_notes(n, "cello", 64 + i * 8))
    pre["strings"].extend(chord_notes(12, "strings", 70, beats=2.2))
    pre["cello"].extend(chord_notes(12, "cello", 70, beats=2.2))
    # 마디 13–14: 하린 발언 — 첼레스타 모티프(정적 끝) + 아주 낮은 현악 지속음
    pre["strings"].append(Note(bar_t(13), BAR_S * 2, 45, 44))
    pre["strings"].append(Note(bar_t(13), BAR_S * 2, 52, 38))
    pre["cello"].append(Note(bar_t(13), BAR_S, 33, 40))
    pre["cello"].append(Note(bar_t(14), BAR_S, 29, 40))
    # 마디 15–16: 클라이맥스 — 합창 + 현악 + 피아노 전부
    for n in (15, 16):
        pre["choir"].extend(chord_notes(n, "choir", 108))
        pre["strings"].extend(chord_notes(n, "strings", 112))
        pre["cello"].extend(chord_notes(n, "cello", 112))
        P.extend(arpeggio(n, 84))
        ch = CHORDS[chord_of_bar(n)]
        P.append(Note(bar_t(n), BAR_S, ch["root"] - 12, 90))
    P.extend(theme_bar(bar_t(15), 2, 104, octave=1))
    P.extend(theme_bar(bar_t(16), 3, 104, octave=1))
    P.extend(theme_bar(bar_t(15), 2, 92))
    P.extend(theme_bar(bar_t(16), 3, 92))
    # 첼레스타 4회: ①②③ 앞 구간, ④ 뒤 구간
    c = EV["celesta"]
    for fr in c[:3]:
        pre["celesta"].extend(motif(f2s(fr)))
    # ---- 뒤 구간(0:53.3–1:00): 시간은 CUT_S 기준 상대값
    Q = post["piano"]
    for nt in theme_bar(bar_t(17, 1.5), 0, 34):
        Q.append(Note(nt.t - CUT_S, nt.dur, nt.midi, nt.vel))
    Q.append(Note(bar_t(17, 1.5) - CUT_S, BAR_S * 0.8, 41 + 12, 30))
    post["celesta"].extend(Note(n.t - CUT_S, n.dur, n.midi, n.vel) for n in motif(f2s(c[3]), 70))
    # Csus4 → C 장조 (열차가 멈추는 순간 해결)
    t_sus = bar_t(18, 1.0) - CUT_S
    t_c = f2s(EV["trainStop"]) - CUT_S
    for m in (48, 53, 55, 60, 65):
        Q.append(Note(t_sus, t_c - t_sus, m, 46))
    for m in (36, 48, 55, 60, 64, 67, 72):
        Q.append(Note(t_c, TOTAL_S - CUT_S - t_c + 1.0, m, 72))
    return pre, post


# ---------------------------------------------------------------- 사운드폰트 렌더
def ensure_sf2():
    if not os.path.exists(SF2):
        os.makedirs(os.path.dirname(os.path.dirname(SF2)), exist_ok=True)
        subprocess.run(["git", "clone", "--depth", "1", SF2_REPO, os.path.dirname(SF2)], check=True)


def render_stem(prog: int, notes: list[Note], length_s: float) -> np.ndarray:
    synth = tinysoundfont.Synth(samplerate=SR, gain=-6)
    sfid = synth.sfload(SF2)
    synth.program_select(0, sfid, 0, prog)
    events = []
    for n in notes:
        events.append((n.t, 1, n.midi, n.vel))
        events.append((n.t + n.dur, 0, n.midi, 0))
    events.sort(key=lambda e: (e[0], e[1]))
    total = int(round(length_s * SR))
    out = np.zeros((total, 2), dtype=np.float32)
    pos = 0
    for t, on, m, v in events:
        s = min(total, max(pos, int(round(t * SR))))
        if s > pos:
            out[pos:s] = np.frombuffer(synth.generate(s - pos), dtype=np.float32).reshape(-1, 2)
            pos = s
        if on:
            synth.noteon(0, m, v)
        else:
            synth.noteoff(0, m)
    if pos < total:
        out[pos:] = np.frombuffer(synth.generate(total - pos), dtype=np.float32).reshape(-1, 2)
    return out


def music_bus(stems: dict[str, np.ndarray]) -> np.ndarray:
    mix = (
        stems["piano"] * 1.0
        + stems["strings"] * 0.9
        + stems["cello"] * 0.8
        + stems["choir"] * 0.85
        + stems["celesta"] * 0.9
    )
    board = Pedalboard(
        [
            Compressor(threshold_db=-20, ratio=2.0, attack_ms=20, release_ms=250),
            Reverb(room_size=0.85, wet_level=0.3, dry_level=0.7, width=1.0),
        ]
    )
    return board(mix.T.astype(np.float32), SR).T


# ---------------------------------------------------------------- 효과음 (모두 직접 합성)
rng = np.random.default_rng(23)


def sec(t: float) -> int:
    return int(round(t * SR))


def bp(x, lo, hi, order=4):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, hi, order=4):
    sos = signal.butter(order, hi, btype="low", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def env_ad(n, a, d):
    """a, d: 샘플 수. 빠른 어택 + 지수 감쇠"""
    t = np.arange(n)
    e = np.minimum(1.0, t / max(1, a)) * np.exp(-np.maximum(0, t - a) / max(1, d))
    return e


def place(bus, t, x, gain=1.0, pan=0.0):
    s = sec(t)
    if s >= len(bus):
        return
    x = x[: len(bus) - s]
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    bus[s : s + len(x), 0] += x * gain * l * 1.414
    bus[s : s + len(x), 1] += x * gain * r * 1.414


def crayon(bus, t0, t1, gain, lo=2000, hi=8000, rate=16):
    """크레용 사각사각: 2–8kHz 노이즈 알갱이"""
    t = t0
    while t < t1:
        dur = 0.03 + rng.random() * 0.05
        n = sec(dur)
        g = bp(rng.standard_normal(n), lo, hi) * env_ad(n, sec(0.004), sec(dur * 0.4))
        g *= 0.6 + 0.4 * np.sin(np.linspace(0, np.pi * (1 + rng.random()), n)) ** 2
        place(bus, t, g, gain * (0.6 + rng.random() * 0.5), pan=0.15)
        t += 1 / rate * (0.6 + rng.random() * 0.8)


def phone_buzz(bus, t):
    n = sec(0.3)
    tt = np.arange(n) / SR
    saw = signal.sawtooth(2 * np.pi * 165 * tt)
    am = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 28 * tt))
    x = bp(saw * am, 120, 2400) * np.minimum(1, np.arange(n) / sec(0.01)) * np.minimum(1, (n - np.arange(n)) / sec(0.03))
    place(bus, t, x, 0.16, pan=-0.1)


def breath(bus, t, inhale=True):
    n = sec(1.1)
    x = bp(rng.standard_normal(n), 400, 2200, 2)
    e = np.sin(np.linspace(0, np.pi, n)) ** (1.5 if inhale else 2.5)
    place(bus, t, x * e, 0.035, pan=0.2)


def latch_clunk(bus, t):
    """현관문 '철컥'"""
    n = sec(0.35)
    tt = np.arange(n) / SR
    click = bp(rng.standard_normal(n), 1500, 7000) * env_ad(n, 10, sec(0.008))
    ring = (np.sin(2 * np.pi * 1850 * tt) + 0.6 * np.sin(2 * np.pi * 3120 * tt)) * env_ad(n, 20, sec(0.06))
    thud = np.sin(2 * np.pi * 90 * tt) * env_ad(n, sec(0.003), sec(0.08))
    x = click * 0.8 + ring * 0.25 + thud * 0.7
    place(bus, t, x, 0.22)
    place(bus, t + 0.07, click * 0.5 + ring * 0.15, 0.18)


def door_thump(bus, t, g=0.4):
    """지하철 문 '쿵'"""
    n = sec(0.6)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 58 * tt) * env_ad(n, sec(0.004), sec(0.16)) + lp(rng.standard_normal(n), 500) * env_ad(n, 5, sec(0.05)) * 0.8
    place(bus, t, x, g)


def rails(bus, t0, t1):
    """레일 '덜컹덜컹' + 낮은 웅웅거림 (화면 흔들림과 같은 12.5프레임 주기)"""
    n = sec(t1 - t0)
    rumble = lp(rng.standard_normal(n), 180) * 0.6
    rumble *= np.minimum(1, np.arange(n) / sec(0.3)) * np.minimum(1, (n - np.arange(n)) / sec(0.2))
    place(bus, t0, rumble, 0.22)
    k = 0
    period = 12.5 / FPS
    while t0 + k * period < t1 - 0.1:
        for j, dt in enumerate((0.0, 0.085)):
            m = sec(0.14)
            tt = np.arange(m) / SR
            hit = np.sin(2 * np.pi * (110 - j * 20) * tt) * env_ad(m, 30, sec(0.04)) + bp(rng.standard_normal(m), 800, 4000) * env_ad(m, 5, sec(0.01)) * 0.3
            place(bus, t0 + k * period + dt, hit, 0.18)
        k += 1


def spoon_clink(bus, t):
    n = sec(0.3)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 2650 * tt) + 0.5 * np.sin(2 * np.pi * 4120 * tt) + 0.3 * np.sin(2 * np.pi * 6200 * tt)) * env_ad(n, 8, sec(0.07))
    place(bus, t, x, 0.06, pan=-0.2)


def card_swish(bus, t, g):
    """카드 '사락'"""
    n = sec(0.16)
    x = bp(rng.standard_normal(n), 1200, 7000) * np.sin(np.linspace(0, np.pi, n)) ** 2
    place(bus, t, x, g, pan=(rng.random() - 0.5) * 1.2)


def engine(bus, t0, t1, gain, rpm0=1.0, rpm1=1.0, muffle=900):
    n = sec(t1 - t0)
    tt = np.arange(n) / SR
    rpm = np.linspace(rpm0, rpm1, n)
    ph = 2 * np.pi * np.cumsum(38 * rpm) / SR
    x = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph + 0.4) + 0.25 * lp(rng.standard_normal(n), 300)
    x *= 0.85 + 0.15 * np.sin(2 * np.pi * 7 * tt)
    x = lp(x, muffle)
    fade = np.minimum(1, np.arange(n) / sec(0.25)) * np.minimum(1, (n - np.arange(n)) / sec(0.25))
    place(bus, t0, x * fade, gain)


def glass_tap(bus, t):
    n = sec(0.12)
    tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 1250 * tt) * 0.6 + bp(rng.standard_normal(n), 600, 3000)) * env_ad(n, 10, sec(0.018))
    place(bus, t, x, 0.35, pan=0.25)


def ambience(bus, t0, t1, gain, lo, hi, mod=0.3):
    n = sec(t1 - t0)
    x = bp(rng.standard_normal(n), lo, hi, 2)
    x *= 1 + mod * np.sin(2 * np.pi * 0.23 * np.arange(n) / SR)
    fade = np.minimum(1, np.arange(n) / sec(0.4)) * np.minimum(1, (n - np.arange(n)) / sec(0.4))
    place(bus, t0, x * fade, gain)


def murmur(bus, t0, t1, gain, ramp=True):
    """광장 웅성거림: 여러 '목소리' 대역 노이즈를 음절 리듬으로 흔든다(실제 말소리 없음)"""
    n = sec(t1 - t0)
    out = np.zeros(n)
    for v in range(14):
        f = 280 + rng.random() * 900
        x = bp(rng.standard_normal(n), f, f * 2.6, 2)
        syl = 0.5 + 0.5 * np.sin(2 * np.pi * (3 + rng.random() * 3) * np.arange(n) / SR + rng.random() * 6)
        out += x * syl**2
    out /= 6
    e = np.linspace(0.4, 1.0, n) if ramp else np.ones(n)
    e *= np.minimum(1, np.arange(n) / sec(0.5)) * np.minimum(1, (n - np.arange(n)) / sec(0.3))
    place(bus, t0, out * e, gain)


def lighter_click(bus, t):
    n = sec(0.05)
    x = bp(rng.standard_normal(n), 2500, 9000) * env_ad(n, 4, sec(0.006))
    place(bus, t, x, 0.25, pan=(rng.random() - 0.5))


def applause(bus, t0, dur, gain):
    n = sec(dur)
    out = np.zeros(n)
    count = int(dur * 260)
    for _ in range(count):
        s = int(rng.random() ** 1.3 * (n - sec(0.03)))
        m = sec(0.02)
        clap = bp(rng.standard_normal(m), 900, 4500, 2) * env_ad(m, 3, sec(0.004))
        out[s : s + m] += clap * (0.5 + rng.random() * 0.5)
    out *= np.minimum(1, np.arange(n) / sec(0.08)) * np.exp(-np.arange(n) / sec(dur * 0.6))
    place(bus, t0, out, gain)


def train_arrive(bus, t0, t_stop):
    """열차 진입: 다가오는 웅웅거림 + 느려지는 덜컹 + 멈출 때 '쉬익'(분홍 지하철 그림이므로 장난감처럼 부드럽게)"""
    n = sec(t_stop - t0 + 0.4)
    tt = np.arange(n) / SR
    rumble = lp(rng.standard_normal(n), 220) * np.clip(tt / (t_stop - t0), 0, 1) ** 1.5
    rumble *= np.minimum(1, (n - np.arange(n)) / sec(0.4))
    place(bus, t0, rumble, 0.5, pan=-0.3)
    t, period = t0 + 0.2, 0.16
    while t < t_stop:
        m = sec(0.1)
        hit = np.sin(2 * np.pi * 140 * np.arange(m) / SR) * env_ad(m, 30, sec(0.03))
        place(bus, t, hit, 0.18 * min(1, (t - t0) / 0.6), pan=-0.4 + 0.6 * (t - t0) / (t_stop - t0))
        t += period
        period *= 1.12
    m = sec(0.7)
    hiss = bp(rng.standard_normal(m), 2500, 9000, 2) * env_ad(m, sec(0.02), sec(0.25))
    place(bus, t_stop + 0.05, hiss, 0.08)
    door_thump(bus, t_stop, 0.18)


def wind(bus, t0, t1, gain):
    n = sec(t1 - t0)
    x = bp(rng.standard_normal(n), 120, 700, 2)
    x *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * np.arange(n) / SR)
    fade = np.minimum(1, np.arange(n) / sec(0.2)) * np.minimum(1, (n - np.arange(n)) / sec(0.2))
    place(bus, t0, x * fade, gain)


def build_sfx():
    pre = np.zeros((N, 2))
    post = np.zeros((N, 2))
    S = TL["scenes"]
    # S1 크레용 (선이 그려지는 동안 + 화면 밖으로 이어지는 마지막 한 획)
    crayon(pre, f2s(2), f2s(74), 0.16)
    crayon(pre, f2s(76), f2s(98), 0.2, rate=22)
    # S2 진동 2번
    for b in EV["phoneBuzz"]:
        phone_buzz(pre, f2s(b))
    ambience(pre, f2s(S["S02"]["from"]), f2s(S["S04"]["from"]), 0.01, 200, 1200)
    # S3 하린 숨소리 + 현관문 철컥(J컷)
    for k in range(3):
        breath(pre, f2s(S["S03"]["from"]) + 0.2 + k * 2.86, True)
        breath(pre, f2s(S["S03"]["from"]) + 1.6 + k * 2.86, False)
    latch_clunk(pre, f2s(EV["doorClunk"]))
    # S4 지하철 문 '쿵' + 레일, 저녁 식탁 숟가락
    door_thump(pre, f2s(EV["subwayDoor"]))
    rails(pre, f2s(S["S04"]["from"]), f2s(TL["sub"]["S04B"]))
    for fr in (430, 470, 490):
        spoon_clink(pre, f2s(fr))
    # S5 펜 긁는 소리(할머니·상인) → 크레용(하린)
    s5 = S["S05"]["from"]
    crayon(pre, f2s(s5 + 1), f2s(s5 + 26), 0.08, lo=3000, hi=9500, rate=24)
    crayon(pre, f2s(s5 + 34), f2s(s5 + 59), 0.08, lo=3000, hi=9500, rate=24)
    crayon(pre, f2s(s5 + 67), f2s(s5 + 94), 0.13)
    # S6 카드 '사락' 점점 겹쳐 커짐
    s6 = S["S06"]["from"]
    for i in range(30):
        delay = 64 if i == 29 else i * 2.1
        card_swish(pre, f2s(s6 + delay + 8), 0.05 + 0.1 * i / 29)
    # S7–S9 버스
    ambience(pre, f2s(S["S07"]["from"]), f2s(S["S08"]["from"]), 0.012, 300, 3000)
    engine(pre, f2s(S["S07"]["from"]), f2s(S["S08"]["from"] + 56), 0.09, 0.8, 0.85, 600)
    ambience(pre, f2s(S["S08"]["from"]), f2s(S["S09"]["from"]), 0.012, 150, 500)  # 유리 너머 먹먹한 바깥
    glass_tap(pre, f2s(EV["glassTap"]))
    engine(pre, f2s(S["S08"]["from"] + 50), f2s(S["S10"]["from"] + 15), 0.12, 0.85, 1.5, 700)
    ambience(pre, f2s(S["S09"]["from"]), f2s(S["S10"]["from"] + 15), 0.02, 80, 400)
    # S10 광장 웅성거림 + 촛불 '딸깍'
    murmur(pre, f2s(S["S10"]["from"]), f2s(S["S11"]["from"]), 0.05)
    for fr in (1012, 1030, 1052, 1080, 1110, 1131):
        lighter_click(pre, f2s(fr))
    # S11 정적: 바람 소리만 아주 작게 (S12까지 이어짐)
    wind(pre, f2s(S["S11"]["from"]), f2s(S["S13"]["from"]), 0.012)
    murmur(pre, f2s(S["S12"]["from"]), f2s(S["S13"]["from"]), 0.008, ramp=False)
    # S13 박수와 함께 클라이맥스
    applause(pre, f2s(EV["applause"]), CUT_S - f2s(EV["applause"]), 0.22)
    # --- 뒤 구간(컷 이후)
    engine(post, 0.0, f2s(TL["sub"]["S14B"]) - CUT_S + 0.3, 0.14, 0.9, 0.9, 500)
    ambience(post, f2s(TL["sub"]["S14B"]) - CUT_S, TOTAL_S - CUT_S, 0.006, 300, 1500)
    train_arrive(post, f2s(EV["trainArrive"]) - CUT_S, f2s(EV["trainStop"]) - CUT_S)
    fx = Pedalboard([Reverb(room_size=0.3, wet_level=0.1, dry_level=0.9)])
    pre = fx(pre.T.astype(np.float32), SR).T
    post = fx(post.T.astype(np.float32), SR).T
    return pre, post


# ---------------------------------------------------------------- 믹스·음량
SECTIONS = [
    # (이름, 시작, 끝, 목표 RMS dB)
    ("마디1 크레용만", 0.0, bar_t(2), -30),
    ("마디2–5 피아노 단음→아르페지오", bar_t(2), bar_t(6), -24),
    ("마디6–7 주제 선율", bar_t(6), bar_t(8), -20),
    ("마디8–9 현악·첼로 진입", bar_t(8), bar_t(10), -17),
    ("마디10–11 점점 크게", bar_t(10), bar_t(12), -15),
    ("36.7–38.5 현악 빠짐", bar_t(12), SIL_FROM, -22),
    ("38.5–40.0 완전 정적", SIL_FROM, SIL_TO, -40),
    ("40.0–46.7 하린 발언", SIL_TO, bar_t(15), -26),
    ("46.7–53.3 클라이맥스", bar_t(15), CUT_S, -12),
    ("53.3–56.7 엔진→피아노", CUT_S, bar_t(18), -26),
    ("56.7–60.0 엔딩", bar_t(18), TOTAL_S, -18),
]


def rms_db(x: np.ndarray) -> float:
    return 10 * np.log10(np.mean(x.astype(np.float64) ** 2) + 1e-20)


def true_peak_db(x: np.ndarray) -> float:
    up = signal.resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-20)


def gain_envelope(gains: list[float]) -> np.ndarray:
    """구간별 게인(선형)을 짧은 램프로 잇는다. 정적 진입·0:53.3 컷은 램프 없이."""
    g = np.zeros(N)
    for (name, a, b, _), k in zip(SECTIONS, gains):
        g[sec(a) : sec(b)] = k
    hard = {sec(CUT_S)}
    ramp = sec(0.08)
    for _, a, _, _ in SECTIONS[1:]:
        s = sec(a)
        if s in hard:
            continue
        lo, hi = max(0, s - ramp), min(N, s + ramp)
        g[lo:hi] = np.linspace(g[lo - 1] if lo > 0 else g[lo], g[hi] if hi < N else g[hi - 1], hi - lo)
    return g


def main():
    ensure_sf2()
    os.makedirs(os.path.join(HERE, "stems"), exist_ok=True)
    pre_notes, post_notes = compose()

    def bus_for(notes, length):
        stems = {k: render_stem(PROG[k], v, length) if v else np.zeros((sec(length), 2), np.float32) for k, v in notes.items()}
        return music_bus(stems), stems

    pre_music, pre_stems = bus_for(pre_notes, TOTAL_S)
    post_music, _ = bus_for(post_notes, TOTAL_S - CUT_S)
    sfx_pre, sfx_post = build_sfx()

    # 음악 버스 자동화: 36.7→38.5 현악이 서서히 빠지고 38.5–40.0은 음악 0
    m_env = np.ones(N)
    a, b = sec(bar_t(12)), sec(SIL_FROM)
    m_env[a:b] = np.linspace(1, 0, b - a) ** 1.5
    m_env[b : sec(SIL_TO)] = 0.0
    pre_music[: N] *= m_env[:, None]

    # 목소리 파일이 있으면 0:40–0:46.7에 넣고 음악을 −8dB 덕킹
    voice_path = os.path.join(ROOT, "assets", "voice_harin.wav")
    voice = np.zeros((N, 2))
    if os.path.exists(voice_path):
        v, vsr = sf.read(voice_path, always_2d=True)
        if vsr != SR:
            v = signal.resample_poly(v, SR, vsr, axis=0)
        v = np.repeat(v[:, :1], 2, axis=1) if v.shape[1] == 1 else v[:, :2]
        s, e = sec(SIL_TO), sec(bar_t(15))
        v = v[: e - s]
        voice[s : s + len(v)] = v
        duck = np.ones(N)
        duck[s:e] = 10 ** (-8 / 20)
        pre_music *= duck[:, None]

    # 앞 구간: 0:53.3에서 30ms 페이드로 칼같이 끊는다(잔향 꼬리 포함)
    cut = sec(CUT_S)
    fade = sec(0.03)
    pre = pre_music[:N] + sfx_pre + voice
    pre[cut:] = 0
    pre[cut - fade : cut] *= np.linspace(1, 0, fade)[:, None]
    post = np.zeros((N, 2))
    post_len = N - cut
    post[cut:] = post_music[:post_len] + sfx_post[:post_len]
    raw = pre + post

    # 구간별 목표 RMS 맞추기(두 번 반복)
    # 클라이맥스는 리미터에 더 세게 넣는다(CLIMAX_DRIVE dB). 통합 음량이 주로 클라이맥스에서 정해지므로
    # −14 LUFS로 맞출 때 나머지 구간이 지시서 목표치에 더 가깝게 남는다.
    CLIMAX_DRIVE = float(os.environ.get("CLIMAX_DRIVE", "8.3"))
    # 보정: 정적은 '−40 이하'를 확실히(−42로 성형), 엔딩은 리미터가 깎는 만큼(+2) 미리 올린다
    adj = {"클라이맥스": CLIMAX_DRIVE, "완전 정적": -2.0, "엔딩": 1.0}
    shape = [t + next((v for k, v in adj.items() if n.endswith(k)), 0.0) for (n, _, _, t) in SECTIONS]
    gains = [1.0] * len(SECTIONS)
    mix = raw
    for _ in range(3):
        mix = raw * gain_envelope(gains)[:, None]
        for i, (_, a, b, _t) in enumerate(SECTIONS):
            cur = rms_db(mix[sec(a) : sec(b)])
            gains[i] *= 10 ** ((shape[i] - cur) / 20)
    mix = raw * gain_envelope(gains)[:, None]

    # 통합 −14 LUFS + 트루피크 −1 dBTP:
    # pedalboard Limiter(JUCE)는 출력 최대치를 0 dBFS로 맞추므로,
    # 앞단 드라이브(offset)로 얼마나 누를지 정하고, 뒤에서 4배 오버샘플 트루피크가 −1.15 dBTP가 되도록 출력 레벨을 정한다.
    # 그다음 통합 음량을 재서 드라이브를 조정 — 이를 수렴할 때까지 반복.
    meter = pyln.Meter(SR)
    limiter = Pedalboard([Limiter(threshold_db=-1.0, release_ms=120)])
    peak0 = 20 * np.log10(np.max(np.abs(mix)) + 1e-20)
    offset = -peak0  # 처음엔 피크가 0 dBFS가 되도록만
    out = mix
    for _ in range(20):
        lim = limiter((mix * 10 ** (offset / 20)).T.astype(np.float32), SR).T.astype(np.float64)
        out = lim * 10 ** ((-1.15 - true_peak_db(lim)) / 20)
        lufs = meter.integrated_loudness(out)
        if abs(lufs + 14.0) < 0.05:
            break
        offset += (-14.0 - lufs) * 1.2

    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    sf.write(os.path.join(ROOT, "out", "soundtrack.wav"), out.astype(np.float32), SR, subtype="PCM_24")
    for k, v in pre_stems.items():
        sf.write(os.path.join(HERE, "stems", f"{k}.wav"), v, SR, subtype="PCM_16")

    # 보고
    report = {
        "integrated_lufs": round(meter.integrated_loudness(out), 2),
        "true_peak_dbtp": round(true_peak_db(out), 2),
        "sample_peak_dbfs": round(20 * np.log10(np.max(np.abs(out))), 2),
        "clipped_samples": int(np.sum(np.abs(out) >= 1.0)),
        "duration_s": round(len(out) / SR, 4),
        "sections": [],
    }
    for name, a, b, target in SECTIONS:
        seg = out[sec(a) : sec(b)]
        report["sections"].append({"name": name, "from": round(a, 2), "to": round(b, 2), "target_rms_db": target, "rms_db": round(rms_db(seg), 1)})
    # 컷 직후 10ms와 직전 비교
    report["cut_check"] = {
        "rms_before_50ms_db": round(rms_db(out[cut - sec(0.08) : cut - sec(0.03)]), 1),
        "rms_after_cut_first_10ms_db": round(rms_db(out[cut : cut + sec(0.01)]), 1),
    }
    report["celesta_s"] = [round(f2s(x), 2) for x in EV["celesta"]]
    report["voice_used"] = os.path.exists(voice_path)
    json.dump(report, open(os.path.join(HERE, "report.json"), "w"), ensure_ascii=False, indent=2)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    sys.exit(main())
