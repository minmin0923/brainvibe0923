# 양식 모음

발표 자료, 문서, 대시보드를 만들 때 고르는 양식입니다. 브라우저로 [`index.html`](index.html)을 열면 전체를 한눈에 보고 바로 열어 볼 수 있습니다.

- **바로 쓰는 양식:** DESIGN.md의 색, 글꼴, 여백을 따릅니다. 내용만 바꿔 쓰면 됩니다.
- **원본 참고(`vendor/`):** GitHub에서 받은 공개 양식입니다. 구성과 항목을 참고하는 용도이며, 그대로 쓰면 DESIGN.md와 모양이 다릅니다.

## 상황별로 고르기

| 이런 걸 만들 때 | 쓸 양식 | 형식 |
|---|---|---|
| 발표 자료를 새로 시작 | [`slides/presentation-layouts.html`](slides/presentation-layouts.html) 에서 필요한 장만 골라 쓰기 | HTML, 16:9 |
| 분기·월간 보고, 프로젝트 중간 점검 발표 | [`slides/project-report-deck.html`](slides/project-report-deck.html) | HTML, 16:9 |
| PowerPoint 파일을 달라고 할 때 | [`slides/design-template.pptx`](slides/design-template.pptx) | PPTX |
| 글로 쓰고 슬라이드는 자동으로 | [`slides/marp-deck.md`](slides/marp-deck.md) | Markdown (Marp) |
| 데이터로 원인과 대책을 보고 | [`documents/report.html`](documents/report.html) | HTML, A4 |
| 예산·인력 승인 요청 | [`documents/proposal.html`](documents/proposal.html) | HTML, A4 |
| 회의 결과 공유 | [`documents/meeting-notes.html`](documents/meeting-notes.html) 또는 [`documents/markdown/meeting-notes.md`](documents/markdown/meeting-notes.md) | HTML / Markdown |
| 기능 요구사항 정리 | [`documents/markdown/prd.md`](documents/markdown/prd.md) | Markdown |
| 기술 설계 리뷰 | [`documents/markdown/design-doc.md`](documents/markdown/design-doc.md) | Markdown |
| 기술·정책 결정의 이유 기록 | [`documents/markdown/decision-record.md`](documents/markdown/decision-record.md) | Markdown |
| 프로젝트 시작 전 방향 맞추기 | [`documents/markdown/project-brief.md`](documents/markdown/project-brief.md) | Markdown |
| 주간 업무 보고 | [`documents/markdown/weekly-report.md`](documents/markdown/weekly-report.md) | Markdown |
| 장애 회고 | [`documents/markdown/postmortem.md`](documents/markdown/postmortem.md) | Markdown |
| 스프린트·프로젝트 회고 | [`documents/markdown/retrospective.md`](documents/markdown/retrospective.md) | Markdown |
| 버전별 변경 기록 | [`documents/markdown/release-notes.md`](documents/markdown/release-notes.md) | Markdown |
| 정기적으로 보는 숫자 (매출, 사용자, 전환율) | [`dashboards/kpi-dashboard.html`](dashboards/kpi-dashboard.html) | HTML |
| 프로젝트 진행 현황 | [`dashboards/project-tracker.html`](dashboards/project-tracker.html) | HTML |
| 청구서, 견적서 | [`vendor/simple-html-invoice/invoice.html`](vendor/simple-html-invoice/invoice.html) 구성을 참고해 DESIGN.md로 다시 만들기 | 참고 |
| 관리자 화면, 로그인, 가격표 같은 화면 배치 | [`vendor/bootstrap-examples/`](vendor/bootstrap-examples/), [`vendor/sb-admin/`](vendor/sb-admin/) | 참고 |

## 폴더 구조

```text
templates/
├── index.html                 전체 양식 갤러리
├── assets/fonts/              Pretendard, Geist Mono (SIL OFL)
├── slides/
│   ├── presentation-layouts.html   레이아웃 12종
│   ├── project-report-deck.html    분기 보고 8장
│   ├── design-template.pptx        PowerPoint 9장
│   ├── marp-deck.md                Marp 마크다운 덱
│   └── tools/make_pptx.py          PPTX를 다시 만드는 스크립트
├── documents/
│   ├── report.html, proposal.html, meeting-notes.html
│   └── markdown/              PRD, 설계, ADR, 회의록 등 9종
├── dashboards/
│   ├── kpi-dashboard.html
│   └── project-tracker.html
└── vendor/                    GitHub 원본 (출처: vendor/SOURCES.md)
```

## 쓰는 방법

### HTML 양식 (발표, 문서, 대시보드)

1. 파일을 복사해 새 이름으로 저장하고 내용을 바꿉니다.
2. 대시보드는 `<script>` 안의 `데이터: 이 부분만 바꾸면 됩니다` 블록만 고치면 그래프와 표가 같이 바뀝니다.
3. 파일 하나에 CSS와 JS가 모두 들어 있어, 그대로 Claude 아티팩트로 올리거나 메일로 보낼 수 있습니다. `assets/fonts`가 없는 곳에서는 시스템 고딕 글꼴로 보입니다.
4. PDF가 필요하면 브라우저 인쇄(Ctrl/Cmd + P)에서 "PDF로 저장"을 고릅니다. 발표 덱은 한 장에 슬라이드 하나, 문서는 A4로 나옵니다.

### 발표 덱 단축키

| 키 | 동작 |
|---|---|
| `발표 시작` 버튼 | 한 장씩 보는 발표 모드 |
| → Space PageDown | 다음 |
| ← PageUp | 이전 |
| Home / End | 처음 / 끝 |
| F | 전체 화면 |
| Esc | 발표 모드 끝내기 |

### PowerPoint 양식 다시 만들기

```bash
pip install python-pptx
python3 templates/slides/tools/make_pptx.py
```

### Marp 마크다운을 PPTX, PDF로

```bash
npx @marp-team/marp-cli templates/slides/marp-deck.md --pptx   # PowerPoint
npx @marp-team/marp-cli templates/slides/marp-deck.md --pdf    # PDF
```

## 양식을 추가할 때

- 새 양식도 DESIGN.md를 따르고, 기존 양식의 `:root` 토큰 블록을 그대로 복사해 씁니다.
- 상태 색이 필요하면 대시보드 양식의 `--negative`(빨강 계열), `--caution`(황토 계열)을 씁니다. 둘 다 채도를 낮춘 색이며, 색만으로 뜻을 전하지 않도록 아이콘과 글자를 함께 둡니다.
- 만든 뒤 `index.html`과 이 README의 표에 한 줄씩 추가합니다.
- 외부 양식을 더 받아 오면 `vendor/`에 라이선스 파일과 함께 넣고 `vendor/SOURCES.md`에 출처를 적습니다.
