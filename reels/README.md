# 의정부의 염원을 싣고 — 60초 세로 릴스

크레용 그림책 화풍의 1080×1920 / 30fps / 60.0초 애니메이션. Remotion(React) + roughjs, 음악은 Python(tinysoundfont + GeneralUser GS + pedalboard).

## 결과물

| 파일 | 내용 |
| --- | --- |
| `out/reels_60s.mp4` | 최종 영상 (H.264 yuv420p CRF 20 +faststart, AAC 48kHz 스테레오 256kbps) |
| `out/cover.jpg` | 1080×1920 썸네일(마지막 정지 프레임) |
| `out/soundtrack.wav` | 사운드트랙 48kHz 24bit (−14 LUFS, 트루피크 −1.15 dBTP) |
| `out/style/`, `out/keyframes/` | 단계별 점검 스틸 |
| `music/report.json`, `out/audio_levels.png` | 구간별 음량 보고 |

## 다시 만들기

```bash
npm install
npx tsx scripts/fetch-fonts.ts        # 자막에 쓰는 글자의 한글 글꼴 조각만 public/fonts로
npx tsx scripts/export-timeline.ts    # src/timeline.ts → music/timeline.json
pip install numpy scipy soundfile pedalboard pyloudnorm Pillow && pip install --no-deps tinysoundfont
python3 music/score.py                # out/soundtrack.wav (사운드폰트는 처음 실행 때 자동으로 받음)
npm run render                        # out/video_muted.mp4
bash scripts/finish.sh                # 음악 합치기 → out/reels_60s.mp4, out/cover.jpg
```

미리보기: `npm run studio`. 스틸: `npx tsx scripts/stills.ts out/check 45 450` (환경변수 `COMP`로 장면 지정).

## 구조

- `src/timeline.ts` — 모든 TC를 프레임 단위로 한 번만 정의(72BPM, 1마디 = 100프레임). 음악도 이 값을 쓴다.
- `src/scenes/S01.tsx` … `S14.tsx` — 장면별 컴포넌트, `src/Reels.tsx` — 본편(하드 컷 + 디졸브 2곳)
- `src/lib/rough.tsx` — roughjs 래퍼(라인 보일: 캐릭터 4프레임·배경 12프레임, on twos)
- `src/lib/paper.tsx` — 종이 질감·수채 번짐·크레용 필터·카메라, `src/lib/Caption.tsx` — 자막 3종, `src/lib/candles.tsx` — 촛불
- `src/chars/` — 하린·아빠·할머니·군중, `src/lib/HarinDrawing.tsx` — 하린의 그림(S1·S3·S5·S6·S14 공용)
- `music/score.py` — 작곡·렌더·효과음 합성·믹스·음량

목소리 파일 `assets/voice_harin.wav`를 넣고 `python3 music/score.py`를 다시 실행하면 0:40–0:46.7에 들어가고 음악은 −8dB 덕킹된다.

---

# 2탄 「다녀올게, 다녀왔어」

1탄과 같은 세계·가족·화풍으로, 하린이 아빠의 하루(새벽 5:40 → 밤 9:46)를 따라가는 60초 릴스.

| 파일 | 내용 |
| --- | --- |
| `out/ep2_reels_60s.mp4` | 최종 영상(1탄과 같은 사양) |
| `out/ep2_cover.jpg` | 썸네일(마지막 정지 프레임) |
| `out/ep2_soundtrack.wav` | 사운드트랙(−14 LUFS, 마지막 3초는 1탄 엔딩과 같은 소리) |
| `out/ep2_style/` | 스타일 프레임 4장, 1탄 비교 이미지, 캐릭터 시트 |
| `music/ep2_report.json`, `out/ep2_verify.json` | 음량·사양 점검 결과 |

```bash
npx tsx scripts/fetch-fonts.ts
npx tsx scripts/export-timeline-ep2.ts          # src/ep2/timeline.ts → music/ep2_timeline.json
python3 music/ep2_score.py                       # out/ep2_soundtrack.wav (1탄 out/soundtrack.wav가 먼저 있어야 엔딩이 같아짐)
bash scripts/render_chunks.sh EP2 out/ep2_video_muted.mp4
bash scripts/finish.sh ep2_                      # → out/ep2_reels_60s.mp4, out/ep2_cover.jpg
python3 scripts/verify.py ep2_ && python3 scripts/warm_check.py out/ep2_reels_60s.mp4
```

구조: `src/ep2/timeline.ts`(TC·타이머·이벤트), `src/ep2/scenes/`(S1–S15), `src/ep2/lib/`(CommuteTimer 길 위의 시간, WallClock 손그림 벽시계,
ChatBubble 손그림 말풍선, SplitScreen 분할 화면, DrawingEP2 = 1탄 그림 + 오른쪽 아래 레이어, Props), `src/chars/Mom.tsx`(엄마),
`src/chars/Dad.tsx`의 `version`(출근 out / 퇴근 home)·`tone`(바깥 cold / 집 warm). 1탄의 rough·paper·Caption·캐릭터·그림을 그대로 import한다.
목소리: `assets/voice_dad.wav`("다녀올게"·"다녀왔어"), `assets/voice_mom.wav`("왔어?")가 있으면 `music/ep2_score.py`가 해당 컷에 넣고 음악을 −8dB 덕킹한다.
