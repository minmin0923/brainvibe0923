"""
2탄 「다녀올게, 다녀왔어」 60초 사운드트랙.

1탄 music/score.py의 악기 로딩(GeneralUser GS), 잔향, 효과음 합성, 음량 처리를 그대로 가져다 쓰고
2탄 장치만 더한다:
  ① 시계 오스티나토 — 아빠가 길 위에 있을 때만: 피아노 A4 8분음 스타카토(벨로시티 0.35, 0.12초) + 박마다 초침 '틱'
     (퇴근 S7·S9에서는 16분음으로 촘촘하게)
  ② 아빠 모티프 — 첼로 A3–G3–E3, 딱 3번(S2 집을 나설 때 / S9 버스를 놓쳤을 때 / S13 그림을 볼 때)
하린 모티프(첼레스타 E6–C6–A5)는 S11·S13·S15 세 번. 마지막 3.3초는 1탄 엔딩과 같은 노트·효과음·잔향으로 다시 만든다.

사용: python3 music/ep2_score.py   (reels/ 에서)
출력: out/ep2_soundtrack.wav, music/ep2_report.json
"""
from __future__ import annotations

import json
import os
import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from pedalboard import Limiter, Pedalboard, Reverb

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import score as s1  # noqa: E402  1탄 스크립트(악기·잔향·효과음·음량 함수)

SR = s1.SR
N = s1.N
TL = json.load(open(os.path.join(HERE, "ep2_timeline.json")))
EV = TL["events"]
SC = TL["scenes"]
SUB = TL["sub"]
f2s = s1.f2s
bar_t = s1.bar_t
BEAT_S = s1.BEAT_S
BAR_S = s1.BAR_S
Note = s1.Note
sec = s1.sec

DAD_MOTIF = [57, 55, 52]  # A3–G3–E3
PROG = dict(s1.PROG, xylo=13)


def dad_motif(t: float, vel: int = 84) -> list:
    """한숨처럼 내려가는 세 음: 1박·1박·2박"""
    out, tt = [], t
    for m, beats in zip(DAD_MOTIF, (1, 1, 2)):
        out.append(Note(tt, beats * BEAT_S * 0.98, m, vel))
        tt += beats * BEAT_S
    return out


def ostinato(t0: float, t1: float, sixteenth: bool = False, vel: int = 45) -> list:
    """피아노 A4 스타카토(0.12초) 반복 — 기계적인 출퇴근 리듬"""
    step = BEAT_S / (4 if sixteenth else 2)
    out, t = [], t0
    while t < t1 - 1e-6:
        out.append(Note(t, 0.12, 69, vel))
        t += step
    return out


def compressed_theme(t0: float, bars=(0, 1), vel=70, speed=2.0, octave=0) -> list:
    """주제 선율을 speed배 빠르게(1마디 안에 2마디) — '잠깐의 희망'"""
    out, t = [], t0
    for b in bars:
        for m, beats in s1.THEME[b]:
            d = beats * BEAT_S / speed
            if m is not None:
                out.append(Note(t, d * 0.97, m + 12 * octave, vel))
            t += d
    return out


def compose():
    st = {k: [] for k in PROG}
    P, S, C = st["piano"], st["strings"], st["cello"]
    # 마디 2: 피아노 단음 A3 + 아빠 모티프 ①
    P.append(Note(bar_t(2), BAR_S, 57, 64))
    st["cello"].extend(dad_motif(f2s(EV["dadMotif"][0])))
    # 마디 3–5: 시계 오스티나토 + 낮은 현악 지속음(레일 리듬과 같은 박)
    P.extend(ostinato(bar_t(3), bar_t(6)))
    for n in (3, 4, 5):
        S.extend(s1.chord_notes(n, "strings", 46))
        C.append(Note(bar_t(n), BAR_S, s1.CHORDS[s1.chord_of_bar(n)]["root"], 50))
    # 마디 6: 오스티나토 멈춤, 주제 선율 2마디(잠깐의 희망)
    P.extend(compressed_theme(bar_t(6), (0, 1), vel=72))
    P.append(Note(bar_t(6), BAR_S, 41 + 12, 46))
    # 마디 7: 16분음 오스티나토 → 열차가 멈출 때 뚝
    halt = f2s(EV["trainHalt"])
    P.extend(ostinato(bar_t(7), halt, sixteenth=True, vel=48))
    S.append(Note(bar_t(7), halt - bar_t(7), 45, 48))
    S.append(Note(bar_t(7), halt - bar_t(7), 52, 44))
    # 마디 8: 집 — 따뜻한 피아노 주제 선율
    P.extend(s1.theme_bar(bar_t(8), 0, 70))
    P.extend(s1.arpeggio(8, 50))
    # 마디 9: 뛰어 내려오는 16분음 → 버스가 떠나는 순간 하드 스톱, 아빠 모티프 ②
    leave = f2s(EV["busLeaves"])
    P.extend(ostinato(bar_t(9), leave, sixteenth=True, vel=52))
    C.extend(dad_motif(f2s(EV["dadMotif"][1]), 80))
    # 마디 10: 피아노 단음만 띄엄띄엄
    for t, m in ((bar_t(10), 57), (bar_t(10, 2.0), 64), (bar_t(10, 3.0), 60)):
        P.append(Note(t, BEAT_S * 1.6, m, 50))
    # 마디 11: 하린 모티프 ① + 아주 작은 피아노
    st["celesta"].extend(s1.motif(f2s(EV["celesta"][0]), 88))
    for t, m in ((bar_t(11, 1.5), 64), (bar_t(11, 3.0), 69)):
        P.append(Note(t, BEAT_S * 1.5, m, 34))
    # 마디 12: 페이드아웃(피아노 하나가 사그라듦)
    P.append(Note(bar_t(12), BAR_S * 0.5, 55, 36))
    # 마디 13–14: 정적에서 현악이 부풀어 오름 → 아빠 모티프 ③ → 하린 모티프 ②
    for n in (13, 14):
        S.extend(s1.chord_notes(n, "strings", 60 if n == 13 else 80))
        C.append(Note(bar_t(n), BAR_S, s1.CHORDS[s1.chord_of_bar(n)]["root"] - 12, 56))
    C.extend(dad_motif(f2s(EV["dadMotif"][2]), 92))
    st["celesta"].extend(s1.motif(f2s(EV["celesta"][1]), 92))
    # 마디 15–16: 2탄 절정 — 피아노 주제 + 현악 + 첼로 + 옅은 합창 패드
    for i, n in enumerate((15, 16)):
        S.extend(s1.chord_notes(n, "strings", 100))
        C.extend(s1.chord_notes(n, "cello", 100))
        st["choir"].extend(s1.chord_notes(n, "choir", 52))
        P.extend(s1.arpeggio(n, 74))
        P.extend(s1.theme_bar(bar_t(n), i, 96))
        P.extend(s1.theme_bar(bar_t(n), i, 80, octave=1))
    # 마디 17: 절정이 1초에 걸쳐 줄고 피아노 주제만 남음(마디 18은 1탄 엔딩 재사용)
    P.extend(s1.theme_bar(bar_t(17), 2, 52))
    P.append(Note(bar_t(17), BAR_S, 41 + 12, 40))
    return st


def ep1_tail():
    """1탄 엔딩(마디 18)과 같은 소리: 1탄 compose()의 뒤 구간 노트 중 마디 18 것 + 열차 진입음, 같은 잔향."""
    _, post = s1.compose()
    t18 = bar_t(18) - s1.CUT_S
    notes = {k: [n for n in v if n.t >= t18 - 1e-6] for k, v in post.items()}
    length = s1.TOTAL_S - s1.CUT_S
    stems = {k: s1.render_stem(s1.PROG[k], v, length) if v else np.zeros((sec(length), 2), np.float32) for k, v in notes.items()}
    music = s1.music_bus(stems)
    fx = np.zeros((sec(length) + 10, 2))
    s1.ambience(fx, t18, length, 0.006, 300, 1500)
    s1.train_arrive(fx, f2s(s1.EV["trainArrive"]) - s1.CUT_S, f2s(s1.EV["trainStop"]) - s1.CUT_S)
    fx = Pedalboard([Reverb(room_size=0.3, wet_level=0.1, dry_level=0.9)])(fx.T.astype(np.float32), SR).T
    out = np.zeros((N, 2))
    s = sec(s1.CUT_S)
    out[s:] = music[: N - s] + fx[: N - s]
    # 마디 18 이전(엔진 등)은 쓰지 않는다
    out[: sec(bar_t(18))] = 0
    return out


# ---------------------------------------------------------------- 2탄 효과음(직접 합성)
rng = s1.rng


def tone(freq, dur, decay, harm=(1.0,), amp=1.0):
    n = sec(dur)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * freq * (k + 1) * t) for k, a in enumerate(harm))
    return x * s1.env_ad(n, 20, sec(decay)) * amp


def tick(bus, t, g):
    """초침 '틱'"""
    n = sec(0.03)
    x = s1.bp(rng.standard_normal(n), 2500, 7000) * s1.env_ad(n, 3, sec(0.004))
    s1.place(bus, t, x, g, pan=0.3)


def air_brake(bus, t):
    n = sec(0.7)
    x = s1.bp(rng.standard_normal(n), 1500, 7000, 2) * s1.env_ad(n, sec(0.02), sec(0.3))
    s1.place(bus, t, x, 0.18)


def bus_door(bus, t):
    x = tone(180, 0.2, 0.05, (1, 0.5)) + s1.lp(rng.standard_normal(sec(0.2)), 900) * s1.env_ad(sec(0.2), 5, sec(0.03))
    s1.place(bus, t, x, 0.35)


def footsteps(bus, t0, t1, density=14, g=0.06):
    t = t0
    while t < t1:
        n = sec(0.06)
        x = s1.lp(rng.standard_normal(n), 1200) * s1.env_ad(n, 5, sec(0.015))
        s1.place(bus, t, x, g * (0.6 + rng.random() * 0.6), pan=rng.random() * 1.4 - 0.7)
        t += 1 / density * (0.5 + rng.random())


def gate_beep(bus, t):
    s1.place(bus, t, tone(1950, 0.12, 0.08), 0.12)


def keyboard(bus, t0, t1):
    t = t0
    while t < t1:
        n = sec(0.025)
        x = s1.bp(rng.standard_normal(n), 2000, 6000) * s1.env_ad(n, 3, sec(0.006))
        s1.place(bus, t, x, 0.05, pan=0.2)
        t += 0.06 + rng.random() * 0.12


def screech(bus, t):
    """터널에서 열차가 멈추는 '끼익'"""
    n = sec(0.9)
    tt = np.arange(n) / SR
    f = 2600 - 900 * tt / 0.9
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + s1.bp(rng.standard_normal(n), 2000, 5000) * 0.3
    x *= s1.env_ad(n, sec(0.05), sec(0.4))
    s1.place(bus, t, x, 0.12)
    s1.door_thump(bus, t, 0.35)


def bubbling(bus, t0, t1, g=0.05):
    t = t0
    while t < t1:
        f0 = 140 + rng.random() * 200
        s1.place(bus, t, tone(f0, 0.08, 0.03), g * (0.5 + rng.random()), pan=0.4)
        t += 0.05 + rng.random() * 0.12


def bowl_tok(bus, t):
    s1.place(bus, t, tone(1200, 0.15, 0.04, (1, 0.4, 0.2)), 0.12, pan=0.2)


def car_pass(bus, t, g=0.18):
    n = sec(1.6)
    x = s1.bp(rng.standard_normal(n), 120, 1600, 2) * np.sin(np.linspace(0, np.pi, n)) ** 3
    s1.place(bus, t, x, g, pan=0.0)


def panting(bus, t0, k=4):
    for i in range(k):
        n = sec(0.45)
        x = s1.bp(rng.standard_normal(n), 500, 2600, 2) * np.sin(np.linspace(0, np.pi, n)) ** 2
        s1.place(bus, t0 + i * 0.5, x, 0.06)


def stove(bus, t):
    for i in range(3):
        n = sec(0.03)
        s1.place(bus, t + i * 0.12, s1.bp(rng.standard_normal(n), 2500, 8000) * s1.env_ad(n, 3, sec(0.006)), 0.2)
    n = sec(1.0)
    whoosh = s1.bp(rng.standard_normal(n), 200, 1800, 2) * s1.env_ad(n, sec(0.05), sec(0.5))
    s1.place(bus, t + 0.38, whoosh, 0.16)


def elevator_ding(bus, t):
    s1.place(bus, t, tone(1318, 0.9, 0.35, (1, 0.3)), 0.07)
    s1.place(bus, t + 0.28, tone(1046, 1.0, 0.4, (1, 0.3)), 0.06)


def lock_beep(bus, t):
    """손으로 감싼 도어락 '삑'(먹먹하게 아주 작게)"""
    s1.place(bus, t, s1.lp(tone(2100, 0.1, 0.05), 900), 0.02)


def xylophone(notes: list, length=s1.TOTAL_S):
    return s1.render_stem(PROG["xylo"], notes, length)


def build_sfx():
    bus = np.zeros((N, 2))
    # 초침: 아빠가 길 위에 있을 때만(박마다)
    windows = [(0.0, bar_t(6), 0.05), (bar_t(7), f2s(EV["trainHalt"]), 0.05), (bar_t(9), bar_t(10), 0.05), (bar_t(10), bar_t(11), 0.11), (bar_t(12), f2s(EV["silenceFrom"]), 0.03)]
    for a, b, g in windows:
        t = np.ceil(a / BEAT_S) * BEAT_S
        while t < b:
            tick(bus, t, g)
            t += BEAT_S
    for b in EV["phoneBuzz"]:
        s1.phone_buzz(bus, f2s(b))
    # 새벽 방의 공기음(진동 사이가 정적 구간보다 조용해지지 않도록)
    s1.ambience(bus, 0, bar_t(3), 0.03, 150, 1500)
    # S2 숨소리 + 현관문
    s1.breath(bus, bar_t(2) + 0.3, True)
    s1.breath(bus, bar_t(2) + 1.7, False)
    s1.latch_clunk(bus, f2s(EV["doorClunk"]))
    # S3 첫차
    s1.ambience(bus, bar_t(3), bar_t(4), 0.02, 100, 900)
    s1.engine(bus, bar_t(3), bar_t(4), 0.08, 0.8, 0.85, 600)
    air_brake(bus, f2s(EV["busArrive"]))
    bus_door(bus, f2s(EV["busDoor"]))
    # S4 레일(오스티나토와 같은 박) + 졸다가 덜컹
    s1.rails(bus, bar_t(4), bar_t(5))
    s1.door_thump(bus, f2s(EV["wakeJolt"]), 0.25)
    # S5 계단 발소리 무리 + 게이트
    footsteps(bus, bar_t(5), f2s(SUB["S05B"]), density=26, g=0.07)
    gate_beep(bus, f2s(EV["gateBeep"]))
    # S6 키보드
    keyboard(bus, bar_t(6), f2s(SUB["S06B"]))
    # S7 퇴근 1호선 → '끼익'
    s1.rails(bus, bar_t(7), f2s(EV["trainHalt"]))
    screech(bus, f2s(EV["trainHalt"]))
    # S8 집: 찌개, 그릇 '톡', 크레용
    bubbling(bus, bar_t(8), bar_t(9))
    for b in EV["bowls"]:
        bowl_tok(bus, f2s(b))
    s1.crayon(bus, bar_t(8), bar_t(9), 0.03)
    # S9 계단·숨·떠나는 버스·차 소리·바람
    footsteps(bus, bar_t(9), f2s(SUB["S09B"]), density=7, g=0.12)
    s1.engine(bus, bar_t(9) + 0.6, bar_t(10), 0.12, 1.0, 1.6, 700)
    air_brake(bus, f2s(EV["busLeaves"]) - 0.2)
    panting(bus, f2s(EV["breathPuffs"][0]) - 0.2)
    car_pass(bus, bar_t(9) + 1.9)
    s1.wind(bus, f2s(EV["busLeaves"]), bar_t(11), 0.03)
    # S10 가스레인지 다시 켜기, 휴대폰 진동, 지나가는 차
    stove(bus, f2s(EV["stoveIgnite"]))
    s1.phone_buzz(bus, f2s(EV["momBuzz"]))
    car_pass(bus, bar_t(10) + 0.4, 0.12)
    # S11 하린 숨소리
    s1.breath(bus, bar_t(11) + 0.4, True)
    s1.breath(bus, bar_t(11) + 1.9, False)
    # S12 엘리베이터 '띵', 복도
    elevator_ding(bus, f2s(EV["elevatorDing"]))
    footsteps(bus, bar_t(12) + 0.3, f2s(EV["silenceFrom"]) - 0.1, density=2.4, g=0.1)
    s1.ambience(bus, bar_t(12), f2s(EV["silenceFrom"]), 0.01, 100, 600)
    # 정적: 도어락 '삑' 4번만 아주 작게
    for b in EV["lockBeeps"]:
        lock_beep(bus, f2s(b))
    # S13 숨소리 / S14 연필로 카드 쓰는 소리
    s1.breath(bus, bar_t(13) + 1.9, True)
    s1.crayon(bus, f2s(EV["pencil"][0]), f2s(EV["pencil"][0]) + 1.8, 0.05, lo=2500, hi=9000, rate=20)
    s1.crayon(bus, f2s(EV["pencil"][1]), f2s(EV["pencil"][1]) + 0.95, 0.05, lo=2500, hi=9000, rate=20)
    bus = Pedalboard([Reverb(room_size=0.3, wet_level=0.1, dry_level=0.9)])(bus.T.astype(np.float32), SR).T
    # 실로폰(알림 2음, 영상 속 하린 한 음) — 실제 앱 효과음 대신
    xy = xylophone(
        [
            Note(f2s(EV["msgIn"]), 0.3, 79, 80),
            Note(f2s(EV["msgIn"]) + 0.14, 0.4, 84, 80),
            Note(f2s(EV["msgSend"]), 0.3, 84, 60),
            Note(f2s(EV["msgSend"]) + 0.14, 0.4, 79, 60),
            Note(f2s(EV["harinVideoNote"]), 0.5, 81, 70),
        ]
    )
    return bus + xy[:N] * 0.6


SECTIONS = [
    ("마디1 진동+초침", 0.0, bar_t(2), -32),
    ("마디2 단음+아빠 모티프①", bar_t(2), bar_t(3), -26),
    ("마디3–5 시계 오스티나토", bar_t(3), bar_t(6), -20),
    ("마디6 잠깐의 희망", bar_t(6), bar_t(7), -21),
    ("마디7 16분음→끼익", bar_t(7), bar_t(8), -19),
    ("마디8 집의 선율", bar_t(8), bar_t(9), -22),
    ("마디9 하드 스톱+모티프②", bar_t(9), bar_t(10), -27),
    ("마디10 초침·피아노 단음", bar_t(10), bar_t(11), -25),
    ("마디11 하린 모티프①", bar_t(11), bar_t(12), -26),
    ("36.7–38.5 페이드아웃", bar_t(12), 38.5, -30),
    ("38.5–40.0 완전 정적", 38.5, 40.0, -42),
    ("40.0–43.3 현악이 부풀어 오름", 40.0, bar_t(14), -20),
    ("43.3–46.7 모티프③·첼레스타②", bar_t(14), bar_t(15), -16),
    ("46.7–53.3 2탄 절정", bar_t(15), bar_t(17), -13),
    ("53.3–56.7 피아노 주제만", bar_t(17), bar_t(18), -22),
    ("56.7–60.0 시리즈 시그니처", bar_t(18), s1.TOTAL_S, -18),
]


def gain_envelope(gains):
    g = np.zeros(N)
    for (_, a, b, _), k in zip(SECTIONS, gains):
        g[sec(a) : sec(b)] = k
    hard = {sec(f2s(EV["busLeaves"]))}
    ramp = sec(0.08)
    for _, a, _, _ in SECTIONS[1:]:
        s = sec(a)
        lo, hi = max(0, s - ramp), min(N, s + ramp)
        g[lo:hi] = np.linspace(g[lo - 1] if lo > 0 else g[lo], g[hi] if hi < N else g[hi - 1], hi - lo)
    return g


def main():
    s1.ensure_sf2()
    st = compose()
    stems = {k: s1.render_stem(PROG[k], v, s1.TOTAL_S) if v else np.zeros((N, 2), np.float32) for k, v in st.items() if k != "xylo"}
    # 절정 → 마디 17: 피아노를 뺀 악기는 1초 페이드(잔향 전)
    a, b = sec(bar_t(17)), sec(bar_t(17) + 1.0)
    for k in ("strings", "cello", "choir"):
        stems[k][a:b] *= np.linspace(1, 0, b - a)[:, None]
        stems[k][b:] = 0
    music = s1.music_bus(stems)[:N]
    # 음악 자동화: 버스가 떠나는 순간 하드 스톱(잔향까지) / 36.7→38.5 페이드아웃, 38.5–40.0 음악 0 / 마디 18은 1탄 엔딩으로 교체
    env = np.ones(N)
    hs = sec(f2s(EV["busLeaves"]))
    env[hs : hs + sec(0.03)] = np.linspace(1, 0, sec(0.03))
    env[hs + sec(0.03) : sec(f2s(EV["dadMotif"][1])) - sec(0.02)] = 0
    lo, hi = sec(bar_t(12)), sec(38.5)
    env[lo:hi] = np.linspace(1, 0, hi - lo) ** 1.5
    env[hi : sec(40.0)] = 0
    t18 = sec(bar_t(18))
    env[t18 - sec(0.25) : t18] = np.linspace(1, 0, sec(0.25))
    env[t18:] = 0
    music *= env[:, None]
    # 버스가 떠난 뒤 첼로 모티프②는 다시 들어오도록 그 구간만 따로 렌더해 더한다
    motif2 = s1.music_bus({"piano": np.zeros((N, 2), np.float32), "strings": np.zeros((N, 2), np.float32), "cello": s1.render_stem(PROG["cello"], dad_motif(f2s(EV["dadMotif"][1]), 80), s1.TOTAL_S), "choir": np.zeros((N, 2), np.float32), "celesta": np.zeros((N, 2), np.float32)})[:N]
    m2 = np.zeros(N)
    m2[sec(f2s(EV["dadMotif"][1])) - sec(0.02) : sec(bar_t(10))] = 1
    music += motif2 * m2[:, None]
    tail = ep1_tail()
    sfx = build_sfx()
    sfx[t18:] = 0  # 마디 18의 효과음은 1탄 엔딩(열차 진입음)으로
    # 목소리 파일이 있으면 해당 컷에 넣고 음악 −8dB 덕킹(기본은 자막만)
    #   voice_dad.wav: "다녀올게"(S2) → "다녀왔어"(S13) 두 마디를 순서대로 담은 파일이면 앞뒤를 나눠 쓴다
    used = []
    voice = np.zeros((N, 2))
    duck = np.ones(N)

    def put(path, at, max_len):
        v, vsr = sf.read(path, always_2d=True)
        if vsr != SR:
            from scipy import signal as _sig
            v = _sig.resample_poly(v, SR, vsr, axis=0)
        v = np.repeat(v[:, :1], 2, axis=1) if v.shape[1] == 1 else v[:, :2]
        s0 = sec(at)
        v = v[: min(len(v), sec(max_len), N - s0)]
        voice[s0 : s0 + len(v)] += v
        duck[s0 : s0 + len(v)] = 10 ** (-8 / 20)

    pd = os.path.join(ROOT, "assets", "voice_dad.wav")
    if os.path.exists(pd):
        put(pd, f2s(SC["S02"]["from"]) + 0.7, 1.6)
        put(pd, f2s(EV["dadSays"]), 1.6)
        used.append("voice_dad.wav")
    pm = os.path.join(ROOT, "assets", "voice_mom.wav")
    if os.path.exists(pm):
        put(pm, f2s(EV["momWake"]), 1.2)
        used.append("voice_mom.wav")
    raw = music * duck[:, None] + sfx + tail + voice

    # 구간 목표 RMS 성형 → −14 LUFS / 트루피크 −1.7 dBTP (1탄과 같은 방식)
    drive = float(os.environ.get("CLIMAX_DRIVE", "0"))
    # 절정은 1탄(−11.4)보다 약 1dB 작게, 정적은 −42 이하를 확실히, 절정 직전은 절정과 대비가 나도록 조금 낮춘다
    adj = {"2탄 절정": drive, "완전 정적": -14.0, "모티프③·첼레스타②": -2.5}
    shape = [t + next((v for k, v in adj.items() if n.endswith(k)), 0.0) for (n, _, _, t) in SECTIONS]
    gains = [1.0] * len(SECTIONS)
    mix = raw
    for _ in range(3):
        mix = raw * gain_envelope(gains)[:, None]
        for i, (_, a_, b_, _t) in enumerate(SECTIONS):
            cur = s1.rms_db(mix[sec(a_) : sec(b_)])
            gains[i] *= 10 ** ((shape[i] - cur) / 20)
    mix = raw * gain_envelope(gains)[:, None]
    meter = pyln.Meter(SR)
    limiter = Pedalboard([Limiter(threshold_db=-1.0, release_ms=120)])
    offset = -20 * np.log10(np.max(np.abs(mix)) + 1e-20)
    out = mix
    for _ in range(20):
        lim = limiter((mix * 10 ** (offset / 20)).T.astype(np.float32), SR).T.astype(np.float64)
        out = lim * 10 ** ((-1.7 - s1.true_peak_db(lim)) / 20)
        lufs = meter.integrated_loudness(out)
        if abs(lufs + 14.0) < 0.05:
            break
        offset += (-14.0 - lufs) * 1.2

    # 시리즈 시그니처: 57.0초부터는 1탄 최종 마스터(out/soundtrack.wav)를 그대로 이어 붙여 두 편의 끝소리를 같게
    ep1_path = os.path.join(ROOT, "out", "soundtrack.wav")
    if os.path.exists(ep1_path):
        ep1, _ = sf.read(ep1_path, always_2d=True)
        j, xf = sec(57.0), sec(0.1)
        w = np.linspace(0, 1, xf)[:, None]
        out[j - xf : j] = out[j - xf : j] * (1 - w) + ep1[j - xf : j] * w
        out[j:] = ep1[j:N]
    os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
    sf.write(os.path.join(ROOT, "out", "ep2_soundtrack.wav"), out.astype(np.float32), SR, subtype="PCM_24")
    rep = {
        "integrated_lufs": round(meter.integrated_loudness(out), 2),
        "true_peak_dbtp": round(s1.true_peak_db(out), 2),
        "clipped_samples": int(np.sum(np.abs(out) >= 1.0)),
        "sections": [{"name": n, "from": round(a_, 2), "to": round(b_, 2), "target_rms_db": t, "rms_db": round(s1.rms_db(out[sec(a_) : sec(b_)]), 1)} for (n, a_, b_, t) in SECTIONS],
        "bus_hard_stop": {"before_db": round(s1.rms_db(out[hs - sec(0.08) : hs - sec(0.02)]), 1), "after_db": round(s1.rms_db(out[hs + sec(0.04) : hs + sec(0.1)]), 1)},
        "celesta_s": [round(f2s(x), 2) for x in EV["celesta"]],
        "dad_motif_s": [round(f2s(x), 2) for x in EV["dadMotif"]],
        "voice_used": used,
    }
    json.dump(rep, open(os.path.join(HERE, "ep2_report.json"), "w"), ensure_ascii=False, indent=2)
    print(json.dumps({k: v for k, v in rep.items() if k != "sections"}, ensure_ascii=False))
    for x in rep["sections"]:
        print(f"{x['name']:<26} 목표 {x['target_rms_db']:>4}  실제 {x['rms_db']:>6}")


if __name__ == "__main__":
    sys.exit(main())
