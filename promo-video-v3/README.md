# 의정부혜택지도 홍보 영상 v3 (Remotion)

새로 설치한 영상 스킬로 다시 만든 30초 세로 영상입니다.

- **완성본:** `의정부혜택지도_홍보영상_v3.mp4` (1080×1920, 30fps, 30초, 음악+효과음)
- **효과음만 판:** `의정부혜택지도_홍보영상_v3_효과음만.mp4` (배경음 없이 효과음만 있음. 직접 음악을 붙일 때 씀)
- **설계 문서:** `docs/design-spec.md` (제품 브리프, 색 기준, 샷 카드 매핑, 스토리보드, 일부러 바꾼 점)

## 쓴 스킬

| 스킬 | 쓴 곳 |
|---|---|
| video-shotcraft (자주 자유 창작 모드) | 전체 제작 흐름, 샷 카드 7장, 미적 기준(aesthetic-rules), 독립 최종 검수 |
| 샷 카드 | lead-word-zoom-assemble, brand-ink-open, icon-field-colorize, radial-wave, pill-slot-cycle, crane-rise-reveal, outro-group-photo-launch |
| remotion-best-practices / remotion-render | React로 장면을 만들고 프레임 단위로 렌더 |
| soundtrack | 코드로 합성한 음악과 효과음(groove), 장면 전환 박자 검사(sync-check) |
| short-form-video, ad-creative-video | 첫 1초 후킹, 9:16 안전 영역, CTA 구성 |

## 다시 만들기

```bash
npm install
node score/render-score.mjs        # public/audio/score.wav, sfx-only.wav
npx remotion render src/index.ts BenefitMapPromo out/promo.mp4
npx remotion render src/index.ts BenefitMapPromo out/promo-nobgm.mp4 --props='{"bgm":false,"audio":true}'
node ../.claude/skills/soundtrack/scripts/sync-check.mjs out/promo.mp4 --cues-file out/promo.cues.json
```

- 클라우드 세션에서는 `remotion.config.ts`가 미리 설치된 Chromium headless shell을 씁니다. 내 컴퓨터에서는 그 줄을 지우면 Remotion이 알아서 받습니다.
- 시간표는 `src/timeline.ts` 하나에서 나옵니다. 장면 길이를 바꾸면 `score/score-def.js`의 효과음 시각도 같이 고칩니다.
- 미리보기: `npm run dev` (Remotion Studio)

## 라이선스 메모

- 렌더 엔진 Remotion은 개인과 작은 팀은 무료이고, 회사는 유료일 수 있습니다: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md
- 글꼴 Pretendard(SIL OFL). 음악과 효과음은 코드로 합성해 외부 음원이 없습니다.
