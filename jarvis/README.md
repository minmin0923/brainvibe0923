# 자비스 (Windows 음성 비서)

컴퓨터를 켜면 자동으로 뜨고, "자비스, ○○ 해 줘"라고 말하면 듣고, 처리하고, 목소리로 대답하고, 한 일을 문서로 남기는 개인 비서입니다.

- **듣기, 읽어 주기는 전부 내 컴퓨터에서** 처리합니다 (그래픽카드 사용, 사용량 0).
- 간단한 명령(시간, 메모, 기억, 프로그램 열기, 에이전트 지시)은 **Claude를 거치지 않고** 바로 처리합니다.
- 생각이 필요한 일만 내 컴퓨터의 **Claude Code**로 보냅니다. 지금 쓰는 요금제 그대로이고, 같은 문장을 타자로 친 것과 같은 양만 씁니다.
- 오래 걸리는 일(조사, 보고서)은 뒤에서 처리하고, 끝나면 말로 알려 주고 `docs/jarvis/reports/`에 보고서를 남깁니다.

## 준비물

| 항목 | 내용 |
|---|---|
| 컴퓨터 | Windows 10/11, NVIDIA RTX 그래픽카드 (없어도 되지만 느려짐) |
| 마이크 | 헤드셋이나 입 가까이 두는 마이크가 가장 좋습니다. 지금 쓰는 조이트론 마이크로 시작하고, 잡음이 많으면 아래 "잡음 줄이기"를 보세요 |
| 웹캠 (얼굴 로그인) | **Windows Hello 지원 IR 웹캠**. 추천: Lenovo Performance FHD Webcam. 일반 웹캠은 안 됩니다 |
| 프로그램 | [Python 3.12](https://www.python.org/downloads/) (설치할 때 "Add to PATH" 체크), [Git](https://git-scm.com/download/win), Claude Code |

## 설치 (처음 한 번, 20~30분)

PowerShell을 열고 한 줄씩 실행합니다.

```powershell
irm https://claude.ai/install.ps1 | iex
```
```powershell
claude
```
(Claude Code 설치 후 한 번 실행해서 로그인하고 `/exit`로 나옵니다.)

```powershell
git clone https://github.com/minmin0923/brainvibe0923.git $HOME\brainvibe0923
```
```powershell
cd $HOME\brainvibe0923\jarvis
```
```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

설치가 끝나면 바탕화면에 **자비스** 바로가기가 생기고, Windows에 로그인할 때마다 자동으로 켜집니다.

## 처음 맞추기 (5분)

1. **마이크 기준 맞추기:** 아래를 실행하고 안내대로 5초 조용히, 5초 말합니다. 나온 추천값을 `config.yaml`의 `mic.min_speech_dbfs`에 적습니다. 이 값보다 작은 소리(멀리서 나는 소리, TV)는 무시합니다.
   ```powershell
   .\.venv\Scripts\python -m jarvis --calibrate
   ```
2. **내 목소리만 듣기 (선택):** 다섯 문장을 읽어 목소리를 등록한 뒤, `config.yaml`에서 `speaker.verify: true`로 바꿉니다.
   ```powershell
   .\.venv\Scripts\python -m jarvis --enroll
   ```
3. **시작:** 바탕화면의 자비스를 누르거나 아래를 실행합니다. 창이 뜨고 "자비스 준비됐습니다"라고 말하면 준비 끝입니다.
   ```powershell
   .\start-jarvis.bat
   ```

## 쓰는 법

부르는 방법은 두 가지입니다. **"자비스, ○○"**처럼 이름을 먼저 부르거나, 언제든 **Ctrl+Alt+J**를 누르고 말합니다. 대답이 끝난 뒤 8초 동안은 이름 없이 이어서 말해도 됩니다. 말하는 중에 Ctrl+Alt+J를 누르면 말을 끊습니다.

| 이렇게 말하면 | 하는 일 | Claude 사용 |
|---|---|---|
| 지금 몇 시야 / 오늘 며칠이야 | 바로 대답 | 없음 |
| 메모해 ○○ | `data/memo.md`에 적음 | 없음 |
| ○○라고 기억해 / ○○ 잊어 | `data/memory.md`에 적거나 지움. 이후 대답할 때 참고 | 없음 |
| 메모장 열어 / 관제실 열어 | `config.yaml`의 `apps`에 등록한 것만 실행 | 없음 |
| 에이전트한테 시켜 ○○ | `agent/INBOX.md`에 넣고 GitHub에 올림. 클라우드 에이전트가 다음 실행 때 처리 | 없음 |
| 작업 상태 어때 | 뒤에서 하는 일 알려 줌 | 없음 |
| 그만 / 멈춰 | 말 멈춤 | 없음 |
| 오늘 정리해 | 오늘 대화, 메모, 끝낸 작업으로 `docs/journal/날짜.md` 업무 일지 작성 | 작업 모델 1번 |
| ○○ 조사해서 보고서로 / 정리해서 문서로 | 뒤에서 처리 → `docs/jarvis/reports/`에 보고서, 끝나면 말로 알림 | 작업 모델 |
| 그 밖의 질문, 검색 | 짧게 말로 대답, 자세한 내용과 출처는 화면에 | 가벼운 모델 |

화면에서는 글로도 지시할 수 있고, 지금까지 대화, 진행 중인 작업, **타임라인**(끝낸 작업과 하루 정리가 날짜순으로 쌓이는 곳)을 볼 수 있습니다. 항목을 누르면 문서가 열립니다.

### 음성 그래프

화면 가운데 원은 자비스가 무엇을 하는지 보여 줍니다.

- **켜질 때:** 고리가 한 바퀴 그려지며 켜집니다.
- **듣는 중:** 원 둘레의 막대가 마이크 소리에 맞춰 실시간으로 움직입니다 (낮은 음은 위, 높은 음은 아래).
- **생각 중:** 호 두 개가 돕니다.
- **말하는 중:** 막대가 말하듯 출렁입니다.
- **대기 중:** 멈춰 있습니다.

## 문서로 남는 곳

| 위치 | 내용 | GitHub에 올라감 |
|---|---|---|
| `docs/jarvis/timeline.md` | 끝낸 일과 하루 정리 목록 (최근 것이 위) | 예 |
| `docs/jarvis/reports/` | 작업 보고서 | 예 |
| `docs/journal/` | 하루 업무 일지 | 예 |
| `jarvis/data/journal/` | 모든 대화 원본 (하루 한 파일) | 아니요, 내 컴퓨터에만 |
| `jarvis/data/memo.md`, `memory.md` | 메모, 기억 | 아니요 |

## 사용량 아끼는 장치

- 듣기(faster-whisper), 부르는 말 감지, 읽어 주기(Edge 음성)는 내 컴퓨터에서 처리합니다.
- Claude에는 글로 바뀐 지시와 최근 대화 4개, 기억 최대 40줄만 보냅니다.
- 짧은 질문은 `haiku`, 긴 작업만 `sonnet`을 씁니다 (`config.yaml`의 `claude`에서 바꿈).
- 자비스 이름을 부르지 않은 말, 멀리서 난 소리, (설정하면) 다른 사람 목소리는 글로 바꾸기 전에 버립니다.

## 잡음 줄이기

1. **NVIDIA Broadcast**를 설치하고 마이크 "잡음 제거"를 켭니다. 그다음 `config.yaml`에서 `mic.device: "NVIDIA Broadcast"`로 바꿉니다. RTX 그래픽카드에서 가장 효과가 큽니다.
2. 마이크를 입에서 한 뼘 안쪽에 둡니다. 멀리 두면 내 목소리와 배경 소리의 크기 차이가 줄어 거르기 어려워집니다.
3. `--calibrate`를 다시 해서 기준값을 맞춥니다.
4. 그래도 다른 소리에 반응하면 `wake.mode: hotkey`로 바꿔 단축키를 눌렀을 때만 듣게 합니다.

## 얼굴 로그인 (Windows Hello)

1. Windows Hello 지원 IR 웹캠을 연결합니다.
2. 설정 → 계정 → 로그인 옵션 → **얼굴 인식(Windows Hello)** → 설정.
3. 이제 컴퓨터를 켜고 화면을 보면 로그인되고, 로그인과 함께 자비스가 켜집니다. 인증은 Windows가 맡으므로 사진으로는 뚫리지 않습니다.

## 문제 해결

| 증상 | 확인할 것 |
|---|---|
| 창이 안 뜸 | `start-jarvis.bat`으로 켜서 검은 창에 나오는 오류를 봅니다. 바로가기로 켰다면 `data/jarvis.log` |
| "그래픽카드로 음성 인식을 시작하지 못해 CPU로 바꿉니다" | NVIDIA 드라이버를 최신으로 올리고 `install.ps1`을 다시 실행 |
| 이름을 불러도 반응이 없음 | 화면 위 소리 막대가 움직이는지 확인. 안 움직이면 `mic.device`, 움직이면 `--calibrate`로 기준값을 낮춤 |
| 엉뚱한 말에 반응 | 기준값을 높이거나 `speaker.verify: true`, 또는 `wake.mode: hotkey` |
| "Claude에 연결하지 못했어요" | PowerShell에서 `claude`를 실행해 로그인 상태 확인 |
| 목소리가 기계음 | 인터넷이 끊겨 Windows 기본 음성으로 바뀐 것. 인터넷 연결 후 다시 시작 |

## 안전장치

- 화면 서버는 내 컴퓨터(127.0.0.1)에서만 열리고, 켤 때마다 새 접속 열쇠를 만듭니다.
- Claude는 명령어 실행(Bash)을 쓸 수 없습니다. 프로그램 실행은 `apps`에 등록한 것만 자비스가 직접 합니다.
- 웹 페이지나 파일 안에 적힌 지시는 따르지 않도록 했습니다.
- 작업 담당은 저장소 안의 파일만 고칠 수 있고, 보고서 파일만 쓰도록 지시받습니다. 모든 변경은 git 기록에 남으므로 되돌릴 수 있습니다.

## 참고한 오픈소스

직접 가져다 쓴 부품: [faster-whisper](https://github.com/SYSTRAN/faster-whisper), [Silero VAD](https://github.com/snakers4/silero-vad), [openWakeWord](https://github.com/dscripka/openWakeWord), [edge-tts](https://github.com/rany2/edge-tts), [SpeechBrain](https://github.com/speechbrain/speechbrain), [Phosphor Icons](https://phosphoricons.com).

설계를 참고한 프로젝트:
- [AllanHert/jarvis](https://github.com/AllanHert/jarvis): 명령을 단계별로 나눠 싼 길부터 처리, Whisper로 한국어 이름 호출 확인, 말할 때 자기 목소리 무시, 짧은 말 + 화면의 자세한 내용, 등록된 동작만 실행.
- [TorMartin-ops/jarvis-voice](https://github.com/TorMartin-ops/jarvis-voice): 긴 일은 뒤에서 Claude Code 작업으로 돌리고 끝나면 알림, 꺼졌다 켜지면 하던 작업을 '중단됨'으로 표시, 마이크가 끊겨도 다시 연결.
- [Nitro70/ai-jarvis](https://github.com/Nitro70/ai-jarvis): 기억을 사람이 고칠 수 있는 마크다운 한 파일로 관리.

## 개발자용

```powershell
.\.venv\Scripts\python -m pytest tests
```
```powershell
.\.venv\Scripts\python -m jarvis --demo
```
(`--demo`는 Claude와 마이크 없이 화면만 띄웁니다. `--text`는 마이크 없이 실제 Claude로 글 지시를 처리합니다.)
