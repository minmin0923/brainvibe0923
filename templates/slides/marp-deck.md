---
marp: true
theme: default
paginate: true
size: 16:9
lang: ko
title: 주간 업무 공유
footer: 플랫폼개발팀 · 주간 공유
style: |
  /* DESIGN.md 토큰을 Marp 기본 테마 위에 덮어씁니다 */
  section {
    --bg: #FFFFFF; --surface: #F6F7F8; --border: #E4E6E9;
    --text: #111315; --text-muted: #5D636B; --accent: #0F6E5C;
    background: var(--bg);
    color: var(--text);
    font-family: "Pretendard Variable", Pretendard, system-ui, sans-serif;
    font-size: 26px;
    line-height: 1.6;
    padding: 80px 96px;
    word-break: keep-all;
  }
  h1 { font-size: 56px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.2; color: var(--text); }
  h2 { font-size: 40px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: var(--text); margin-bottom: 32px; }
  h3 { font-size: 26px; font-weight: 600; color: var(--accent); }
  strong { font-weight: 700; color: var(--text); }
  a { color: var(--accent); }
  ul > li::marker { color: var(--accent); }
  table { font-size: 22px; border-collapse: collapse; }
  table tr { background: transparent !important; }
  table th, table td { border: 0 !important; border-bottom: 1px solid var(--border) !important; padding: 12px 24px 12px 0; text-align: left; background: transparent !important; }
  table th { color: var(--text-muted); font-weight: 600; }
  blockquote { border-left: 3px solid var(--accent); color: var(--text); font-size: 34px; font-weight: 600; padding-left: 32px; }
  code { font-family: "Geist Mono", ui-monospace, monospace; background: var(--surface); }
  footer, section::after { color: var(--text-muted); font-size: 16px; }
  section.lead { justify-content: flex-end; }
  section.lead h1 { font-size: 64px; max-width: 18ch; }
  section.lead p { color: var(--text-muted); font-size: 28px; }
  section.divider { background: var(--surface); justify-content: center; }
  section.divider h1 { font-size: 64px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
  .kpi { font-size: 88px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
  .muted { color: var(--text-muted); }
---

<!-- _class: lead -->
<!-- _paginate: false -->
<!-- _footer: '' -->

### 10월 2주차 주간 공유

# 결제 오류율을 0.8%에서 0.3%로 낮췄습니다

플랫폼개발팀 · 2026. 10. 13

---

## 이번 주 요약

- **결제 재시도 로직 배포** 후 오류율이 0.8% → 0.3%로 내려갔습니다
- **관리자 화면 검색**이 평균 2.4초에서 0.6초로 빨라졌습니다
- 다음 주에는 **정산 보고서 자동 발송**을 마무리합니다

---

<!-- _class: divider -->

### 01

# 완료한 일

---

## 숫자로 보는 한 주

<div class="cols">
<div>

<div class="kpi">0.3%</div>

결제 오류율 <span class="muted">(지난주 0.8%)</span>

</div>
<div>

<div class="kpi">0.6초</div>

관리자 검색 응답 <span class="muted">(지난주 2.4초)</span>

</div>
</div>

---

## 작업 현황

| 작업 | 담당 | 상태 |
|---|---|---|
| 결제 재시도 로직 | 이도윤 | 완료 |
| 관리자 검색 색인 | 최하은 | 완료 |
| 정산 보고서 자동 발송 | 정우진 | 진행 중 (70%) |
| 앱 푸시 설정 화면 | 한소율 | 다음 주 시작 |

---

## 다음 주 계획과 도움이 필요한 일

<div class="cols">
<div>

### 계획

- 정산 보고서 발송 완료
- 푸시 설정 화면 설계 검토
- 결제 로그 보관 정책 정리

</div>
<div>

### 도움 요청

- 재무팀: 정산 보고서 수신자 명단 확정 (10/17까지)
- 디자인팀: 푸시 설정 화면 시안 1차

</div>
</div>

---

> 재시도 간격을 지수형으로 바꾼 것만으로 오류의 3분의 2가 사라졌습니다.

<span class="muted">이도윤, 결제 담당</span>

---

<!-- _class: lead -->

# 질문과 의견

#플랫폼개발 채널이나 platform@company.example로 보내 주세요
