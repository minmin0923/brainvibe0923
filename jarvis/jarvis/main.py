"""자비스 시작점.

  python -m jarvis              음성 + 화면 (평소)
  python -m jarvis --text       마이크 없이 화면/터미널에서 글로만
  python -m jarvis --calibrate  내 마이크 소리 크기 재기 (가까운 목소리 기준 정하기)
  python -m jarvis --enroll     내 목소리 등록 (다른 사람 목소리 무시)
  python -m jarvis --demo       Claude 없이 화면만 시험 (개발용)
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import threading
import time
import webbrowser

from . import config
from .brain import Brain, ClaudeError, is_work
from .hub import Hub
from .router import Reply, Router
from .server import make_server
from .tasks import TaskRunner


class DemoBrain:
    """화면 시험용. Claude를 부르지 않는다."""
    def __init__(self, *_):
        pass

    def ask(self, text: str):
        time.sleep(0.6)
        return (f"시험 모드라 Claude에 묻지 않았어요. 받은 말은 '{text[:40]}'입니다.",
                "- 실제 모드에서는 이 자리에 출처와 자세한 내용이 나옵니다.")


class App:
    def __init__(self, cfg: dict, *, audio: bool = True, demo: bool = False):
        self.cfg, self.demo = cfg, demo
        self.hub = Hub(cfg["name"])
        self.lock = threading.Lock()
        if not audio:
            cfg["tts"]["engine"] = "none"
        from .tts import Speaker
        self.speaker = Speaker(cfg, on_start=lambda: self.hub.set_state("speaking", ""), on_end=self._spoken_end)
        self.tasks = TaskRunner(cfg, self.hub, on_done=self._task_done)
        self.router = Router(cfg, self.hub, self.tasks)
        self.brain = DemoBrain() if demo else Brain(cfg, self.hub)
        self.ear = None
        if audio:
            from .audio import Ear
            self.hub.set_state("thinking", "음성 인식 모델을 불러오는 중")
            self.ear = Ear(cfg, self.hub, self.command, is_speaking=lambda: self.speaker.speaking,
                           stop_speaking=self.stop_speaking)
            self.ear.start()
        self.hub.set_state("idle")

    def info(self) -> dict:
        w = self.cfg["wake"]
        return {"wake_mode": w["mode"], "hotkey": w.get("hotkey", ""), "audio": self.ear is not None,
                "stt": getattr(getattr(self.ear, "stt", None), "where", ""), "demo": self.demo,
                "quick_model": self.cfg["claude"]["quick_model"], "work_model": self.cfg["claude"]["work_model"]}

    # ---- 화면/단축키에서 부르는 것 ----
    def listen(self) -> None:
        if self.ear:
            self.ear.on_hotkey()

    def stop_speaking(self) -> None:
        self.speaker.stop()
        self.hub.set_state("idle")

    # ---- 지시 처리 ----
    def command(self, text: str, source: str = "voice", stt_ms: int | None = None) -> None:
        self.hub.add_message("user", text, source=source, meta={"stt_ms": stt_ms} if stt_ms else None)
        threading.Thread(target=self._handle, args=(text,), daemon=True).start()

    def _handle(self, text: str) -> None:
        with self.lock:                     # 한 번에 하나씩 대답한다 (뒤에서 하는 작업은 따로 돈다)
            t0 = time.time()
            try:
                reply = self.router.handle(text)
                if reply and reply.stop_speaking:
                    self.stop_speaking()
                    return
                if reply is None and is_work(text):
                    task = self.tasks.start(text[:60], text)
                    reply = Reply("알겠습니다. 뒤에서 처리하고 끝나면 알려 드릴게요.", detail=f"작업 번호 {task['id']}",
                                  source="task")
                if reply is None:
                    self.hub.set_state("thinking", "Claude에게 묻는 중")
                    spoken, detail = self.brain.ask(text)
                    reply = Reply(spoken, detail, source="claude")
            except ClaudeError as e:
                reply = Reply("Claude에 연결하지 못했어요. 터미널에서 claude를 한 번 실행해 로그인 상태를 확인해 주세요.", detail=str(e), source="error")
            except Exception as e:  # noqa: BLE001
                reply = Reply("처리하다 문제가 생겼어요. 자세한 내용은 화면에 띄워 둘게요.", detail=str(e), source="error")
            self.respond(reply, ms=int((time.time() - t0) * 1000))

    def respond(self, reply: Reply, ms: int | None = None) -> None:
        self.hub.add_message("jarvis", reply.spoken, detail=reply.detail, source=reply.source,
                             meta={"ms": ms} if ms is not None else None)
        if self.speaker.engine != "none" and reply.spoken:
            self.speaker.say(reply.spoken)
        else:
            self.hub.set_state("idle")

    def _spoken_end(self) -> None:
        if self.ear:
            self.ear.follow_up()
        else:
            self.hub.set_state("idle")

    def _task_done(self, task: dict) -> None:
        if task["status"] == "done":
            text = f"{task['title'][:30]} 작업을 끝냈어요. {task.get('summary', '')}"
            self.respond(Reply(text, detail=f"보고서: {task['report']}\n{task.get('saved', '')}", source="task"))
        else:
            self.respond(Reply(f"{task['title'][:30]} 작업이 실패했어요.", detail=task.get("summary", ""),
                               source="error"))


def open_window(url: str) -> None:
    edge = shutil.which("msedge") or r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if sys.platform == "win32":
        try:
            subprocess.Popen([edge, f"--app={url}", "--window-size=1100,800"])
            return
        except OSError:
            pass
    webbrowser.open(url)


def calibrate(cfg: dict) -> None:
    import numpy as np
    import sounddevice as sd
    from .audio import FRAME, RATE, dbfs, find_device
    dev = find_device(cfg["mic"].get("device"))
    print("마이크 소리 크기를 잽니다. 5초는 조용히, 다음 5초는 평소처럼 말해 보세요.\n")
    res = {}
    for label in ("조용히 있을 때", "말할 때"):
        input(f"[Enter]를 누르고 {label}의 소리를 5초 동안 잽니다...")
        rec = sd.rec(int(RATE * 5), samplerate=RATE, channels=1, dtype="float32", device=dev)
        sd.wait()
        frames = rec[: len(rec) // FRAME * FRAME, 0].reshape(-1, FRAME)
        levels = np.array([dbfs(f) for f in frames])
        res[label] = levels
        print(f"  평균 {levels.mean():.1f} dBFS, 큰 쪽 {np.percentile(levels, 90):.1f} dBFS")
    quiet = np.percentile(res["조용히 있을 때"], 95)
    loud = np.percentile(res["말할 때"], 60)
    rec_db = round(float((quiet + loud) / 2))
    print(f"\n추천값: config.yaml의 mic.min_speech_dbfs: {rec_db}")
    if loud - quiet < 10:
        print("말소리와 배경 소리 차이가 작습니다. 마이크를 입 가까이 두거나 NVIDIA Broadcast 잡음 제거를 켜 보세요.")


def enroll(cfg: dict) -> None:
    import sounddevice as sd
    from .audio import RATE, VoiceCheck, find_device
    lines = ["자비스, 오늘 일정 알려 줘.", "이번 주에 만든 것들을 정리해서 문서로 남겨 줘.",
             "어제 회의에서 정한 내용을 다시 읽어 줄래?", "새 프로젝트 아이디어를 메모해 줘.",
             "지금 진행 중인 작업 상태가 어떻게 돼?"]
    dev = find_device(cfg["mic"].get("device"))
    vc = VoiceCheck(cfg["stt"]["device"])
    clips = []
    print("내 목소리를 등록합니다. 문장마다 [Enter]를 누르고 4초 안에 평소처럼 읽어 주세요.\n")
    for ln in lines:
        input(f"  \"{ln}\"  [Enter]")
        rec = sd.rec(int(RATE * 4), samplerate=RATE, channels=1, dtype="float32", device=dev)
        sd.wait()
        clips.append(rec[:, 0])
    vc.enroll(clips)
    scores = [vc.score(c) for c in clips]
    print(f"\n등록했습니다. 내 목소리 점수 {min(scores):.2f}~{max(scores):.2f}")
    print("config.yaml에서 speaker.verify: true 로 바꾸면 켜집니다.")


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(prog="jarvis")
    ap.add_argument("--text", action="store_true", help="마이크 없이 글로만")
    ap.add_argument("--demo", action="store_true", help="Claude 없이 화면만 시험")
    ap.add_argument("--calibrate", action="store_true")
    ap.add_argument("--enroll", action="store_true")
    ap.add_argument("--no-window", action="store_true")
    ap.add_argument("--config")
    a = ap.parse_args(argv)
    if sys.stdout is None or sys.stderr is None:       # 창 없이(pythonw) 실행하면 기록을 파일로
        config.DATA_DIR.mkdir(parents=True, exist_ok=True)
        log = open(config.DATA_DIR / "jarvis.log", "a", encoding="utf-8", buffering=1)  # noqa: SIM115
        sys.stdout = sys.stderr = log
    cfg = config.load(a.config)
    if a.calibrate:
        return calibrate(cfg)
    if a.enroll:
        return enroll(cfg)

    app = App(cfg, audio=not (a.text or a.demo), demo=a.demo)
    _, url = make_server(app, int(cfg["ui"]["port"]))
    print(f"{cfg['name']} 화면: {url}")
    if cfg["ui"]["open_window"] and not a.no_window:
        open_window(url)
    if app.ear and cfg.get("greeting"):
        app.speaker.say(cfg["greeting"])
    try:
        if a.text and sys.stdin and sys.stdin.isatty():
            print("글로 지시하세요. 끝내려면 Ctrl+C.")
            for line in sys.stdin:
                if line.strip():
                    app.command(line.strip(), source="typed")
        else:
            while True:
                time.sleep(3600)
    except KeyboardInterrupt:
        pass
