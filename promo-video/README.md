# 의정부혜택지도 홍보 영상

- 완성본: `의정부혜택지도_홍보영상_9x16.mp4` (1080×1920, 30fps, 20.5초, 음악·효과음 포함)
- 미리보기: `index.html`을 브라우저로 열면 재생됩니다.

## 구성

| 시간 | 장면 | 메시지 |
|---|---|---|
| 0–2.7초 | 질문 | 의정부에서 쓰는 돈, 그냥 내고 계셨나요? |
| 2.6–6초 | 브랜드 | 지도에 길과 핀이 그려지고 "의정부혜택지도" 등장 |
| 6–9.6초 | 혜택 1 | 가입만 해도 가맹점 할인 (영수증에 할인 도장) |
| 9.6–13초 | 혜택 2 | 의정부시민 누구나, 가입 한 번이면 됩니다 |
| 13–16.5초 | 혜택 3 | 내 주변 가맹점, 업종별로 지도에서 한눈에 |
| 16.4–20.5초 | CTA | 지금 가입하고 혜택 받으세요 + 가입 버튼 + 검색창 |

## 다시 만들기

```bash
npm i playwright          # 또는 전역 설치된 playwright 사용
node audio.mjs            # out/audio.wav
node render.mjs           # out/video-silent.mp4 (프레임 단위 캡처)
ffmpeg -y -i out/video-silent.mp4 -i out/audio.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart 의정부혜택지도_홍보영상_9x16.mp4
```

문구와 타이밍은 `index.html`의 `render(t)`와 `data-in` 값, 효과음 타이밍은 `audio.mjs`에서 고칩니다.

글꼴: Pretendard, Geist Mono (SIL OFL). 아이콘: Phosphor Icons (MIT).
