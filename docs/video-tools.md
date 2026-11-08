# 영상 제작 도구 모음

2026-11-08에 GitHub에서 받아 설치한 영상 편집·제작 도구입니다. 모든 출처와 커밋은 `skills-lock.json`과 `.gitmodules`에 고정되어 있습니다.

## 1. 바로 쓰는 스킬 (`.claude/skills`, 83개)

레포를 열면 Claude가 자동으로 불러옵니다. 다시 받거나 버전을 올릴 때는 `python3 scripts/install-video-skills.py`를 실행합니다.

| 묶음 | 출처 | 스킬 |
|---|---|---|
| Remotion 공식 (13) | remotion-dev/skills | remotion-best-practices(시작점), remotion-create, remotion-render, remotion-studio, remotion-captions, remotion-markup, remotion-multimedia, remotion-maps, remotion-interactivity, remotion-saas, remotion-docs, remotion-upgrade, remotion-license |
| FFmpeg 편집 (1) | kajisho5/ffmpeg-skill | ffmpeg-skill: 자르기, 이어 붙이기, 화면비, 자막, 무음 제거, 음량, 플랫폼별 내보내기 |
| 제품 홍보 영상 (1) | Vincentwei1021/video-shotcraft | video-shotcraft |
| 내레이션 설명 영상 (1) | Vincentwei1021/video-talkcraft | video-talkcraft |
| 주제 → 설명 영상 (1) | Vincentwei1021/anything2explainer | anything2explainer |
| 3D 카툰 쇼츠 (1) | mromidev/claude-animated-shorts | cartoon-3d-short |
| 영상 보기·분석 (1) | jordanrendric/claude-video-vision | video-perception (아래 MCP와 함께 씀) |
| HyperFrames (9) | heygen-com/hyperframes | hyperframes(시작점), hyperframes-cli, hyperframes-registry, media-use, reverse-any-video, remotion-to-hyperframes, style-sampling, slideshow, figma |
| 모션그래픽 (55) | iart-ai/*-skills 19개 팩 | 쇼츠(short-form-video, caption-animation, countdown-video), 광고(ad-creative-video, launch-video, testimonial-video), 커머스(promo-video, product-demo-video, photo-slideshow), 데이터(chart-animation, animated-infographic, presentation-video), 설명(explainer-video, diagram-animation, whiteboard-animation, isometric-animation, wrapped-video), 유튜브(youtube-intro-outro, audiogram), 모션 디자인 9개, 웹 애니메이션 9개, WebGL 3개, 프리랜서 업무 5개, 그 밖에 lower-thirds, talking-head, talking-head-b-roll, kinetic-typography, manim, map-animation, generative-illustration, javascript-animation, soundtrack, text-message-animation |

- 영상·음성·GIF, 1MB가 넘는 이미지, 갤러리 폴더는 용량 때문에 빼고 복사했습니다. 스킬이 예시 영상을 찾으면 원본 저장소에서 봅니다.
- 이름이 겹친 `lower-thirds`는 iart-ai/lower-thirds-skills 것을 썼습니다.
- `zhuyansen/awesome-claude-video-skills`는 스킬이 아니라 목록이라 설치하지 않았습니다. 다른 스킬을 찾을 때 참고합니다.

## 2. 작업 공간 (`vendor/`, 서브모듈)

스킬이 저장소 안의 스크립트·설정과 함께 동작하므로 저장소째 연결했습니다. 해당 폴더에서 Claude를 열어야 그 안의 스킬이 켜집니다.

| 폴더 | 무엇 | 처음 한 번 | 라이선스 |
|---|---|---|---|
| `vendor/OpenMontage` | 영상 제작 전 과정 시스템 (제작 흐름 12개, 스킬 49개) | `pip install -r requirements.txt` | AGPL-3.0 |
| `vendor/herk-edit-kit` | 릴스·쇼츠·유튜브 편집 키트 (스킬 15개, 무음·실수 자르기) | `npm install` | MIT |
| `vendor/Concat` | 로컬 영상 편집 프로그램 (데스크톱 앱) | 저장소 README대로 내 컴퓨터에서 빌드 | AGPL-3.0 |

새로 클론한 곳에서는 서브모듈을 따로 받아야 합니다.

```bash
git submodule update --init --depth 1
```

AGPL 저장소(OpenMontage, Concat)는 고쳐서 서비스로 내놓으면 소스를 공개해야 합니다.

## 3. MCP 서버 (`.mcp.json`)

| 이름 | 하는 일 | 필요한 것 |
|---|---|---|
| `blender` | Claude가 Blender 장면을 보고 코드로 조작 (mcp-for-blender 2.2.7) | 내 컴퓨터에 Blender와 애드온. 클라우드 세션에서는 서버만 켜지고 Blender에는 연결되지 않음 |
| `claude-video-vision` | 영상 프레임·음성을 뽑아 Claude가 영상을 봄 (1.4.0) | ffmpeg (클라우드에는 설치되어 있음) |

Blender 애드온 설치: [mcp-for-blender](https://github.com/ahujasid/mcp-for-blender)에서 `addon.py`를 받아 Blender **Edit → Preferences → Add-ons → Install…**로 넣고 켭니다. 이 애드온은 Claude가 보낸 Python 코드를 Blender에서 그대로 실행하므로, 중요한 파일은 저장해 두고 씁니다. 사용 기록 전송은 `DISABLE_TELEMETRY`로 꺼 두었습니다.

## 어떤 걸 쓰나

| 하고 싶은 것 | 먼저 쓸 것 |
|---|---|
| 가지고 있는 영상 자르기·자막·내보내기 | ffmpeg-skill |
| 영상 내용 파악·리뷰 | video-perception + claude-video-vision |
| 코드로 모션그래픽 영상 만들기 | remotion-best-practices 또는 hyperframes |
| 쇼츠·릴스 | short-form-video, caption-animation (편집은 vendor/herk-edit-kit) |
| 제품 홍보·광고 | video-shotcraft, launch-video, promo-video |
| 설명·교육 영상 | anything2explainer, video-talkcraft, explainer-video |
| 처음부터 끝까지 맡기기 | vendor/OpenMontage |
| 3D | blender MCP, cartoon-3d-short |
