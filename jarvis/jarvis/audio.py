"""귀: 마이크에서 가까운 내 목소리만 골라 글로 바꾼다. 전부 내 컴퓨터에서 처리한다 (사용량 0).

거르는 순서
1. 마이크 자체 (헤드셋, 단일지향성 마이크, NVIDIA Broadcast 잡음 제거)
2. 소리 크기: min_speech_dbfs보다 작은 소리(멀리서 나는 소리, TV)는 버린다
3. 말소리 감지(Silero VAD): 사람 말소리가 아니면 버린다
4. 목소리 확인(선택): 등록한 내 목소리가 아니면 버린다
5. 부르는 말: 이름("자비스")을 부르거나 단축키를 누른 뒤의 말만 지시로 받는다
자비스가 말하는 동안에는 듣지 않는다 (자기 목소리를 지시로 착각하지 않도록). 단축키로는 끊을 수 있다.
"""
from __future__ import annotations

import collections
import os
import queue
import re
import sys
import threading
import time
from pathlib import Path
from typing import Callable

import numpy as np

from .config import DATA_DIR

RATE = 16000
FRAME = 512                     # Silero VAD가 받는 길이 (32ms)
FRAME_SEC = FRAME / RATE

# Whisper가 조용한 소리에서 지어내는 흔한 문장
HALLUCINATIONS = ("시청해 주셔서 감사합니다", "구독과 좋아요", "자막 제공", "자막by", "MBC 뉴스", "감사합니다.",
                  "다음 영상에서 만나요", "Thank you for watching", "ご視聴")
FILLER_RE = r"^\s*(?:헤이|hey|야|저기|어|음|오케이|ok)[\s,.!~]+"


def dbfs(x: np.ndarray) -> float:
    rms = float(np.sqrt(np.mean(np.square(x.astype(np.float32))) + 1e-12))
    return 20 * np.log10(rms + 1e-9)


_EDGES = np.unique(np.geomspace(3, 256, 33).astype(int))   # 약 90Hz~8kHz를 32칸으로 (로그 간격)
_WIN = np.hanning(1024).astype(np.float32)


def bands(x: np.ndarray) -> list[float]:
    """화면의 음성 그래프용: 최근 1024개 소리 조각을 주파수 칸별 세기(0~1)로 바꾼다."""
    if len(x) < 1024:
        x = np.pad(x, (1024 - len(x), 0))
    spec = np.abs(np.fft.rfft(x[-1024:] * _WIN))
    out = []
    for lo, hi in zip(_EDGES[:-1], _EDGES[1:]):
        v = 20 * np.log10(float(spec[lo:hi].mean()) + 1e-6)          # 조용한 방 약 -15, 가까운 말소리 약 +25
        out.append(round(min(1.0, max(0.0, (v + 20) / 45)), 2))
    return out


def _norm(s: str) -> str:
    return re.sub(r"[\s,.!?~\-]+", "", s).lower()


def strip_wake(text: str, words: list[str]) -> tuple[bool, str]:
    """'자비스, 오늘 일정 알려 줘' → (True, '오늘 일정 알려 줘'). 이름이 앞쪽에 없으면 (False, text)."""
    t = text.strip()
    for _ in range(2):                                  # '헤이', '야' 같은 앞말 제거
        m = re.match(FILLER_RE, t, flags=re.IGNORECASE)
        if m:
            t = t[m.end():]
    for w in sorted(words, key=len, reverse=True):
        pat = r"^\s*" + r"\s*".join(map(re.escape, w.replace(" ", ""))) + r"(?:야|아|님|씨)?[\s,.!?~]*"
        m = re.match(pat, t, flags=re.IGNORECASE)
        if m:
            return True, t[m.end():].strip()
    return False, text


def _add_cuda_dlls() -> None:
    """Windows에서 faster-whisper가 그래픽카드 라이브러리(cuBLAS, cuDNN)를 찾도록 경로를 더한다."""
    if sys.platform != "win32":
        return
    dirs = []
    try:
        import torch
        dirs.append(Path(torch.__file__).parent / "lib")
    except Exception:  # noqa: BLE001
        pass
    for base in map(Path, sys.path):
        nv = base / "nvidia"
        if nv.is_dir():
            dirs += [p for p in nv.glob("*/bin") if p.is_dir()]
    for d in dirs:
        if d.is_dir():
            os.add_dll_directory(str(d))
            os.environ["PATH"] = str(d) + os.pathsep + os.environ.get("PATH", "")


class Transcriber:
    def __init__(self, cfg: dict, log: Callable[[str], None] = print):
        _add_cuda_dlls()
        from faster_whisper import WhisperModel
        s = cfg["stt"]
        self.language = s["language"]
        self.prompt = "자비스, " + ", ".join(cfg["apps"].keys()) if cfg.get("apps") else "자비스"
        try:
            self.model = WhisperModel(s["model"], device=s["device"], compute_type=s["compute_type"])
            self.where = f"{s['model']} / {s['device']}"
        except Exception as e:  # noqa: BLE001  그래픽카드가 안 잡히면 CPU용 작은 모델로
            log(f"그래픽카드로 음성 인식을 시작하지 못해 CPU로 바꿉니다: {e}")
            self.model = WhisperModel("small", device="cpu", compute_type="int8")
            self.where = "small / cpu"

    def __call__(self, audio: np.ndarray) -> str:
        segs, _ = self.model.transcribe(audio, language=self.language, beam_size=1, vad_filter=False,
                                        condition_on_previous_text=False, initial_prompt=self.prompt,
                                        without_timestamps=True)
        out = []
        for seg in segs:
            if seg.no_speech_prob > 0.6 and seg.avg_logprob < -1.0:
                continue
            out.append(seg.text)
        text = " ".join(t.strip() for t in out).strip()
        if not text or any(h in text for h in HALLUCINATIONS) and len(text) < 30:
            return ""
        return text


class VoiceCheck:
    """등록한 내 목소리인지 확인한다 (SpeechBrain ECAPA, 내 컴퓨터에서 실행)."""
    PRINT = DATA_DIR / "voiceprint.npy"

    def __init__(self, device: str = "cuda"):
        import torch
        from speechbrain.inference.speaker import EncoderClassifier
        self.torch = torch
        dev = device if device == "cuda" and torch.cuda.is_available() else "cpu"
        kw = dict(source="speechbrain/spkrec-ecapa-voxceleb", savedir=str(DATA_DIR / "models" / "ecapa"),
                  run_opts={"device": dev})
        try:
            from speechbrain.utils.fetching import LocalStrategy
            self.clf = EncoderClassifier.from_hparams(**kw, local_strategy=LocalStrategy.COPY)
        except (ImportError, TypeError):
            self.clf = EncoderClassifier.from_hparams(**kw)
        self.ref = np.load(self.PRINT) if self.PRINT.exists() else None

    def embed(self, audio: np.ndarray) -> np.ndarray:
        with self.torch.no_grad():
            e = self.clf.encode_batch(self.torch.from_numpy(audio.astype(np.float32))[None])
        v = e.squeeze().cpu().numpy()
        return v / (np.linalg.norm(v) + 1e-9)

    def score(self, audio: np.ndarray) -> float:
        if self.ref is None:
            return 1.0
        return float(np.dot(self.embed(audio), self.ref))

    def enroll(self, clips: list[np.ndarray]) -> None:
        v = np.mean([self.embed(c) for c in clips], axis=0)
        self.ref = v / (np.linalg.norm(v) + 1e-9)
        np.save(self.PRINT, self.ref)


def find_device(name: str | None):
    if not name:
        return None
    import sounddevice as sd
    for i, d in enumerate(sd.query_devices()):
        if d["max_input_channels"] > 0 and name.lower() in d["name"].lower():
            return i
    return None


def beep(freq: int = 880, ms: int = 70) -> None:
    if sys.platform == "win32":
        import winsound
        threading.Thread(target=winsound.Beep, args=(freq, ms), daemon=True).start()


class Ear:
    def __init__(self, cfg: dict, hub, on_command: Callable[[str], None], *,
                 is_speaking: Callable[[], bool], stop_speaking: Callable[[], None]):
        self.cfg, self.hub, self.on_command = cfg, hub, on_command
        self.is_speaking, self.stop_speaking = is_speaking, stop_speaking
        self.w, self.m = cfg["wake"], cfg["mic"]
        self.awake_until = 0.0
        self.utterances: queue.Queue[tuple[np.ndarray, bool]] = queue.Queue()
        self.stt = Transcriber(cfg, log=lambda s: hub.add_message("system", s))
        self.voice = None
        if cfg["speaker"]["verify"]:
            try:
                self.voice = VoiceCheck(cfg["stt"]["device"])
                if self.voice.ref is None:
                    hub.add_message("system", "목소리가 등록되지 않아 목소리 확인을 건너뜁니다. --enroll로 등록해 주세요.")
            except Exception as e:  # noqa: BLE001
                hub.add_message("system", f"목소리 확인을 켜지 못했습니다: {e}")
        from silero_vad import load_silero_vad
        import torch
        self.torch = torch
        self.vad = load_silero_vad()
        self.oww = None
        if self.w["mode"] == "oww":
            import openwakeword
            from openwakeword.model import Model
            openwakeword.utils.download_models(["hey_jarvis"])
            self.oww = Model(wakeword_models=["hey_jarvis"], inference_framework="onnx")
            self.oww_buf = np.zeros(0, dtype=np.int16)

    # ---- 외부에서 부르는 것 ----
    def wake(self, seconds: float = 6.0) -> None:
        self.awake_until = time.time() + seconds
        self.hub.set_state("listening", "말씀하세요")
        beep()

    def follow_up(self) -> None:
        """대답이 끝난 뒤 잠깐은 이름을 부르지 않아도 듣는다."""
        self.awake_until = time.time() + float(self.w["follow_up_seconds"])
        self.hub.set_state("listening", "이어서 말씀하셔도 됩니다")

    def on_hotkey(self) -> None:
        if self.is_speaking():
            self.stop_speaking()
        self.wake()

    def start(self) -> None:
        if self.w.get("hotkey"):
            try:
                import keyboard
                keyboard.add_hotkey(self.w["hotkey"], self.on_hotkey)
            except Exception as e:  # noqa: BLE001
                self.hub.add_message("system", f"단축키를 등록하지 못했습니다: {e}")
        threading.Thread(target=self._capture, daemon=True).start()
        threading.Thread(target=self._process, daemon=True).start()

    @property
    def awake(self) -> bool:
        return time.time() < self.awake_until

    # ---- 듣기 ----
    def _capture(self) -> None:
        import sounddevice as sd
        dev = find_device(self.m.get("device"))
        while True:                                     # 마이크가 빠지거나 멈춰도 다시 연결한다
            try:
                with sd.InputStream(samplerate=RATE, channels=1, dtype="int16", blocksize=FRAME, device=dev) as st:
                    self.hub.add_message("system", f"마이크 연결됨: {sd.query_devices(st.device)['name']}")
                    self._listen(st)
            except Exception as e:  # noqa: BLE001
                self.hub.set_state("error", f"마이크 문제: {e}")
                time.sleep(3)

    def _listen(self, stream) -> None:
        pre = collections.deque(maxlen=int(0.4 / FRAME_SEC))
        buf: list[np.ndarray] = []
        in_utt, voiced, silence, n = False, 0, 0.0, 0
        utt_awake = False                               # 말을 시작할 때 불린 상태였는지
        min_db, vth = float(self.m["min_speech_dbfs"]), float(self.m["vad_threshold"])
        was_awake = False
        recent = np.zeros(1024, dtype=np.float32)
        while True:
            data, _ = stream.read(FRAME)
            frame = data[:, 0].copy()
            n += 1
            f32 = frame.astype(np.float32) / 32768.0
            recent = np.concatenate([recent[FRAME:], f32]) if n > 1 else np.pad(f32, (1024 - FRAME, 0))
            db = dbfs(f32)
            if n % 2 == 0:                              # 약 15번/초 화면의 음성 그래프로 보낸다
                self.hub.set_level(db, bands(recent) if db > -75 else None)
            if self.is_speaking():                      # 말하는 동안은 듣지 않는다
                pre.clear(); buf, in_utt, voiced = [], False, 0
                continue
            if self.oww is not None and not self.awake:
                self.oww_buf = np.concatenate([self.oww_buf, frame])
                while len(self.oww_buf) >= 1280:
                    score = self.oww.predict(self.oww_buf[:1280]).get("hey_jarvis", 0)
                    self.oww_buf = self.oww_buf[1280:]
                    if score >= float(self.w["oww_threshold"]):
                        self.oww.reset()
                        self.wake()
            prob = float(self.vad(self.torch.from_numpy(f32), RATE).item())
            speech = prob >= vth and db >= min_db
            if not in_utt:
                pre.append(f32)
                voiced = voiced + 1 if speech else 0
                if voiced >= 3:
                    in_utt, buf, silence = True, list(pre), 0.0
                    utt_awake = self.awake
                    self.hub.set_state("listening", "듣는 중")
            else:
                buf.append(f32)
                silence = 0.0 if prob >= vth * 0.6 and db >= min_db - 8 else silence + FRAME_SEC
                too_long = len(buf) * FRAME_SEC > float(self.m["max_utterance_seconds"])
                if silence >= float(self.m["silence_end_seconds"]) or too_long:
                    audio = np.concatenate(buf)
                    cut = int(max(0.0, silence - 0.2) * RATE)
                    self.utterances.put((audio[:-cut] if cut else audio, utt_awake or self.awake))
                    in_utt, voiced, buf = False, 0, []
                    pre.clear()
                    if not self.awake:
                        self.hub.set_state("idle")
            if was_awake and not self.awake and not in_utt and self.hub.state == "listening":
                self.hub.set_state("idle")
            was_awake = self.awake

    def _process(self) -> None:
        while True:
            audio, was_awake = self.utterances.get()
            try:
                self._handle(audio, was_awake)
            except Exception as e:  # noqa: BLE001
                self.hub.add_message("system", f"음성 처리 오류: {e}")
                self.hub.set_state("idle")

    def _handle(self, audio: np.ndarray, was_awake: bool) -> None:
        if len(audio) < RATE * 0.35:
            return
        frames = audio[: len(audio) // FRAME * FRAME].reshape(-1, FRAME)
        levels = np.sort([dbfs(f) for f in frames])[::-1]
        loud = float(np.mean(levels[: max(1, len(levels) // 2)]))
        if loud < float(self.m["min_speech_dbfs"]):
            return                                      # 멀리서 난 소리
        if self.voice is not None and self.voice.ref is not None:
            s = self.voice.score(audio)
            if s < float(self.cfg["speaker"]["threshold"]):
                self.hub.emit("ignored", {"reason": "다른 목소리", "score": round(s, 2)})
                return
        mode = self.w["mode"]
        if not was_awake and mode != "whisper":
            return                                      # 호출어/단축키 없이 한 말은 버린다
        t0 = time.time()
        text = self.stt(audio)
        if not text:
            return
        if not was_awake:
            called, rest = strip_wake(text, self.w["words"])
            if not called:
                return
            if not rest:
                self.wake()
                return
            text = rest
        self.awake_until = 0
        self.on_command(text, stt_ms=int((time.time() - t0) * 1000))
