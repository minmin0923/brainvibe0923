"""대답을 소리로 읽는다. 내 컴퓨터에서 처리하므로 Claude 사용량이 들지 않는다.

- edge  : Microsoft Edge의 무료 한국어 음성(InJoon, SunHi). 자연스럽지만 인터넷이 필요하다.
- system: Windows에 들어 있는 음성(SAPI). 오프라인에서도 된다.
- none  : 소리 없이 화면에만 (시험용)
문장 단위로 끊어서, 첫 문장을 읽는 동안 다음 문장을 미리 만든다.
"""
from __future__ import annotations

import asyncio
import queue
import re
import tempfile
import threading
import time
from pathlib import Path
from typing import Callable


def sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?。])\s+", text.strip())
    return [p.strip() for p in parts if p and p.strip()]


class Speaker:
    def __init__(self, cfg: dict, on_start: Callable[[], None], on_end: Callable[[], None]):
        self.cfg = cfg["tts"]
        self.engine = self.cfg["engine"]
        self.on_start, self.on_end = on_start, on_end
        self.q: queue.Queue[str] = queue.Queue()
        self._stop = threading.Event()
        self.speaking = False
        self.last_spoken = ""
        self.tmp = Path(tempfile.mkdtemp(prefix="jarvis-tts-"))
        self._sapi = None
        if self.engine == "edge":
            try:
                import edge_tts  # noqa: F401  설치 여부만 확인
                import pygame
                pygame.mixer.init()
            except Exception:  # noqa: BLE001
                self.engine = "system"
        threading.Thread(target=self._loop, daemon=True).start()

    def say(self, text: str) -> None:
        if text and self.engine != "none":
            self.q.put(text)

    def stop(self) -> None:
        self._stop.set()
        while not self.q.empty():
            try:
                self.q.get_nowait()
            except queue.Empty:
                break
        if self.engine == "edge":
            try:
                import pygame
                pygame.mixer.music.stop()
            except Exception:  # noqa: BLE001
                pass
        elif self._sapi is not None:
            try:
                self._sapi.stop()
            except Exception:  # noqa: BLE001
                pass

    # ---- 내부 ----
    def _loop(self) -> None:
        while True:
            text = self.q.get()
            self._stop.clear()
            self.speaking = True
            self.last_spoken = text
            self.on_start()
            try:
                if self.engine == "edge":
                    self._edge(text)
                else:
                    self._system(text)
            except Exception:  # noqa: BLE001  edge가 안 되면 기본 음성으로
                if self.engine == "edge" and not self._stop.is_set():
                    self.engine = "system"
                    self._system(text)
            finally:
                self.speaking = False
                if self.q.empty():
                    self.on_end()

    def _edge_file(self, text: str, i: int) -> Path:
        import edge_tts
        path = self.tmp / f"s{i % 4}.mp3"
        asyncio.run(edge_tts.Communicate(text, self.cfg["voice"], rate=self.cfg["rate"]).save(str(path)))
        return path

    def _edge(self, text: str) -> None:
        import pygame
        parts = sentences(text) or [text]
        nxt: dict[int, Path] = {}
        ready = threading.Event()

        def prefetch(i: int) -> None:
            try:
                nxt[i] = self._edge_file(parts[i], i)
            finally:
                ready.set()

        current = self._edge_file(parts[0], 0)
        for i in range(len(parts)):
            if self._stop.is_set():
                return
            ready.clear()
            if i + 1 < len(parts):
                threading.Thread(target=prefetch, args=(i + 1,), daemon=True).start()
            pygame.mixer.music.load(str(current))
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                if self._stop.is_set():
                    pygame.mixer.music.stop()
                    return
                time.sleep(0.03)
            pygame.mixer.music.unload()
            if i + 1 < len(parts):
                ready.wait(timeout=15)
                if i + 1 not in nxt:
                    return
                current = nxt[i + 1]

    def _system(self, text: str) -> None:
        import pyttsx3
        if self._sapi is None:
            self._sapi = pyttsx3.init()
            for v in self._sapi.getProperty("voices"):
                if "ko" in (str(v.languages) + v.id + v.name).lower() or "korean" in v.name.lower():
                    self._sapi.setProperty("voice", v.id)
                    break
        for part in sentences(text) or [text]:
            if self._stop.is_set():
                return
            self._sapi.say(part)
            self._sapi.runAndWait()
