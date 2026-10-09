# OK능이마을 릴스 만들기

- 기획: `릴스기획.md`
- 엔딩카드 (의정부혜택지도 10% 할인, 5.5초): `endcard/out/endcard.mp4`
  - 다시 만들기: `cd endcard && node render.mjs` (문구는 `endcard/index.html`)
- 편집: `edit/cuts.json`에 컷 순서, 쓸 구간, 자막을 적고 `cd edit && node build.mjs`
  - 원본 영상은 `clips/` 폴더에 넣는다 (GitHub에는 올리지 않음)
  - 결과: `edit/out/OK능이마을_릴스.mp4` (1080×1920, 30fps)
  - 배경음악을 넣으려면 `cuts.json`의 `bgm`에 파일 경로를 적는다. 인스타그램 앱 음악을 쓸 거면 비워 두고 앱에서 얹는다.
- 필요한 것: Node 18+, ffmpeg, Playwright(엔딩카드 렌더할 때만)
- 글꼴: Pretendard (SIL OFL 1.1)
