# 원본 양식 출처

GitHub 공개 저장소에서 받아 온 양식입니다. 각 폴더에 원본 라이선스 파일을 함께 두었습니다.
받은 날짜: 2026-10-13. 커밋은 받을 때의 기본 브랜치 최신 커밋입니다.

| 폴더 | 원본 저장소 | 커밋/태그 | 라이선스 | 가져온 것 |
|---|---|---|---|---|
| `bootstrap-examples/` | [twbs/bootstrap](https://github.com/twbs/bootstrap) | `v5.3.8` | MIT | `site/src/assets/examples`의 예제 18종, `dist`의 CSS/JS |
| `sb-admin/` | [startbootstrap/startbootstrap-sb-admin](https://github.com/startbootstrap/startbootstrap-sb-admin) | `adde34b` | MIT | `dist/` 전체 |
| `reveal.js/` | [hakimel/reveal.js](https://github.com/hakimel/reveal.js) | `e240e17` | MIT | `dist/`의 핵심 파일, white·simple 테마, notes 플러그인 |
| `marp-themes/` | [marp-team/marp-core](https://github.com/marp-team/marp-core) | `01ef3a4` | MIT | `themes/`의 테마 3종과 예시 |
| `simple-html-invoice/` | [sparksuite/simple-html-invoice-template](https://github.com/sparksuite/simple-html-invoice-template) | `7d74fe3` | MIT | `invoice.html` |
| `madr/` | [adr/madr](https://github.com/adr/madr) | `ba75bb1` | MIT 또는 CC0-1.0 | `template/`의 결정 기록 양식 |
| `postmortem-templates/` | [dastergon/postmortem-templates](https://github.com/dastergon/postmortem-templates) | `ebdaf8f` | CC0-1.0 | `templates/`의 장애 회고 양식 7종 |
| `rust-rfc-template/` | [rust-lang/rfcs](https://github.com/rust-lang/rfcs) | `d2705ad` | MIT 또는 Apache-2.0 | `0000-template.md` |
| `best-readme-template/` | [othneildrew/Best-README-Template](https://github.com/othneildrew/Best-README-Template) | `fc444eb` | Unlicense | `README.md`, `BLANK_README.md` |
| `keep-a-changelog/` | [olivierlacan/keep-a-changelog](https://github.com/olivierlacan/keep-a-changelog) | `08d0df5` | MIT | `CHANGELOG.md` (형식의 실제 예) |
| `github-issue-templates/` | [stevemao/github-issue-templates](https://github.com/stevemao/github-issue-templates) | `82f4289` | CC0 | 이슈/PR 양식 5종 |

글꼴(`../assets/fonts/`):

| 파일 | 원본 저장소 | 라이선스 |
|---|---|---|
| `PretendardVariable.woff2` | [orioncactus/pretendard](https://github.com/orioncactus/pretendard) | SIL OFL 1.1 |
| `GeistMono.woff2` | [vercel/geist-font](https://github.com/vercel/geist-font) | SIL OFL 1.1 |

아이콘은 [phosphor-icons/core](https://github.com/phosphor-icons/core)(MIT)의 regular 아이콘 경로를 각 HTML 파일 안에 넣어 썼습니다.

## 바꾼 점

- **Bootstrap 예제:** 원본은 Astro 컴포넌트(`.astro`)라 그대로 열리지 않아, 같은 레이아웃 셸(`ExamplesLayout.astro`)을 펼쳐 일반 HTML로 바꿨습니다. 자리표시 이미지 컴포넌트는 같은 모양의 SVG로, 문서 사이트 경로는 getbootstrap.com 주소로 바꿨습니다. 색 모드 전환 버튼은 뺐습니다.
- **reveal.js:** 용량을 줄이려고 `dist/`의 핵심 파일과 테마 2개, notes 플러그인만 남기고, DESIGN.md 색과 글꼴을 입힌 `example.html`을 추가했습니다.
- 나머지는 원본 그대로입니다.

## 주의

- Bootstrap 대시보드 예제와 SB Admin은 Chart.js, Font Awesome, simple-datatables를 인터넷(CDN)에서 불러옵니다. 인터넷이 없으면 차트와 아이콘 자리가 비어 보입니다.
- 직접 만든 양식(`slides/`, `documents/`, `dashboards/`)은 외부 연결 없이 동작합니다.

## 다시 받기

```bash
git clone --depth 1 https://github.com/<저장소>.git
# Bootstrap 예제는 태그를 지정하고 필요한 폴더만 받습니다
git clone --depth 1 --branch v5.3.8 --filter=blob:none --sparse https://github.com/twbs/bootstrap.git
git -C bootstrap sparse-checkout set site/src/assets/examples site/src/layouts dist/css dist/js
```
