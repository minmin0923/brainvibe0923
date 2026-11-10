#!/usr/bin/env node
/*
 * 의정부 지역매체 언론 동향 보고서 만들기
 *
 * 쓰는 법: node scripts/uijeongbu-news-report.js 2026-11-11
 *
 * 읽는 것 (reports/uijeongbu-news/<날짜>/):
 *   articles.json  수집한 기사와 언론사별 접속 결과
 *   brief.json     {"highlights": ["오늘의 핵심 한 줄", ...], "notes": ["확인하지 못한 점", ...]}
 * 만드는 것:
 *   index.html     보고서 (templates/documents/report.html 양식, DESIGN.md 토큰)
 *   report.png     같은 내용의 한 장짜리 이미지
 *   ../history.json 날짜별 기사 수 기록 (최근 7일 추이에 씀)
 */
const fs = require("fs");
const path = require("path");

const date = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
  console.error("날짜를 YYYY-MM-DD로 적어 주세요.");
  process.exit(1);
}
const root = path.join(__dirname, "..", "reports", "uijeongbu-news");
const dir = path.join(root, date);
const data = JSON.parse(fs.readFileSync(path.join(dir, "articles.json"), "utf8"));
const briefPath = path.join(dir, "brief.json");
const brief = fs.existsSync(briefPath) ? JSON.parse(fs.readFileSync(briefPath, "utf8")) : {};
const highlights = brief.highlights || [];
const notes = brief.notes || [];

const CATEGORIES = ["시정·행정", "의회·정치", "개발·교통", "복지·교육", "경제", "사건·사고", "문화·체육", "기타"];
const TONES = ["우호", "중립", "비판"];
const TONE_CLASS = { 우호: "pos", 중립: "neu", 비판: "neg" };

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "#");

const outlets = data.outlets || [];
const articles = (data.articles || []).slice().sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")));
const total = articles.length;
const failed = outlets.filter((o) => o.status !== "확인함");
const count = (fn) => articles.filter(fn).length;
const labelOf = (name) => (outlets.find((o) => o.name === name) || {}).client_label || "";

/* ----- 기록 (최근 7일 추이) ----- */
const histPath = path.join(root, "history.json");
const history = fs.existsSync(histPath) ? JSON.parse(fs.readFileSync(histPath, "utf8")) : {};
history[date] = {
  total,
  tone: Object.fromEntries(TONES.map((t) => [t, count((a) => a.tone === t)])),
  failed_outlets: failed.map((o) => o.name),
};
fs.writeFileSync(histPath, JSON.stringify(Object.fromEntries(Object.entries(history).sort()), null, 2) + "\n");
const last7 = Object.keys(history).sort().filter((d) => d <= date).slice(-7);

/* ----- 차트 (SVG) ----- */
let figNo = 0;
function barChart(title, rows, caption) {
  // rows: [{label, value, dim, note}]
  figNo += 1;
  const id = "fig" + figNo;
  const max = Math.max(1, ...rows.map((r) => r.value));
  const rowH = 32, left = 150, right = 600, top = 8;
  const h = top + rows.length * rowH + 8;
  const body = rows
    .map((r, i) => {
      const y = top + i * rowH;
      const w = Math.round(((right - left) * r.value) / max);
      const val = r.note ? r.note : r.value + "건";
      return (
        `<text class="axis" x="${left - 12}" y="${y + 19}" text-anchor="end">${esc(r.label)}</text>` +
        (r.value > 0 ? `<rect class="bar${r.dim ? " dim" : ""}" x="${left}" y="${y + 6}" width="${Math.max(w, 2)}" height="18" rx="2"/>` : "") +
        `<text class="lbl" x="${left + (r.value > 0 ? Math.max(w, 2) + 8 : 0)}" y="${y + 20}">${esc(val)}</text>`
      );
    })
    .join("\n");
  const desc = rows.map((r) => `${r.label} ${r.note || r.value + "건"}`).join(", ");
  return `<figure class="chart">
<svg viewBox="0 0 660 ${h}" role="img" aria-labelledby="${id}"><title id="${id}">${esc(title)}. ${esc(desc)}</title>
${body}
</svg>
<figcaption>그림 ${figNo}. ${esc(caption || title)}</figcaption>
</figure>`;
}

function stackedChart(title, rows, caption) {
  // rows: [{label, counts: {우호, 중립, 비판}}]
  figNo += 1;
  const id = "fig" + figNo;
  const rowH = 36, left = 150, right = 640, top = 8;
  const max = Math.max(1, ...rows.map((r) => TONES.reduce((s, t) => s + (r.counts[t] || 0), 0)));
  const h = top + rows.length * rowH + 8;
  const body = rows
    .map((r, i) => {
      const y = top + i * rowH;
      let x = left;
      const sum = TONES.reduce((s, t) => s + (r.counts[t] || 0), 0);
      const segs = TONES.map((t) => {
        const v = r.counts[t] || 0;
        if (!v) return "";
        const w = Math.max(Math.round(((right - left - 80) * v) / max), 18);
        const seg =
          `<rect class="seg ${TONE_CLASS[t]}" x="${x}" y="${y + 6}" width="${w - 2}" height="20" rx="2"/>` +
          `<text class="seglbl ${TONE_CLASS[t]}" x="${x + (w - 2) / 2}" y="${y + 21}" text-anchor="middle">${v}</text>`;
        x += w;
        return seg;
      }).join("");
      return (
        `<text class="axis" x="${left - 12}" y="${y + 21}" text-anchor="end">${esc(r.label)}</text>` +
        segs +
        `<text class="lbl" x="${x + 6}" y="${y + 21}">${sum ? "계 " + sum + "건" : "기사 없음"}</text>`
      );
    })
    .join("\n");
  const desc = rows.map((r) => `${r.label}: ` + TONES.map((t) => `${t} ${r.counts[t] || 0}건`).join(", ")).join(". ");
  return `<figure class="chart">
<ul class="legend" aria-hidden="true"><li><i class="pos"></i>우호</li><li><i class="neu"></i>중립</li><li><i class="neg"></i>비판</li></ul>
<svg viewBox="0 0 660 ${h}" role="img" aria-labelledby="${id}"><title id="${id}">${esc(title)}. ${esc(desc)}</title>
${body}
</svg>
<figcaption>그림 ${figNo}. ${esc(caption || title)}</figcaption>
</figure>`;
}

const toneCounts = (list) => Object.fromEntries(TONES.map((t) => [t, list.filter((a) => a.tone === t).length]));

const outletChart = barChart(
  "언론사별 의정부 관련 기사 수",
  outlets
    .filter((o) => !/같은 누리집/.test(o.note || "") || o.article_count > 0)
    .map((o) => {
      const v = count((a) => a.outlet === o.name);
      return { label: o.name, value: v, note: o.status !== "확인함" ? "접속 실패" : null };
    }),
  "언론사별 의정부 관련 기사 수. 접속하지 못한 곳은 \"접속 실패\"로 적었습니다."
);
const catChart = barChart(
  "분야별 기사 수",
  CATEGORIES.map((c) => ({ label: c, value: count((a) => a.category === c), dim: false }))
);
const toneChart = stackedChart("시정에 대한 논조 분포", [{ label: "전체", counts: toneCounts(articles) }]);
const labels = [...new Set(outlets.map((o) => o.client_label || "분류 미정"))];
const labelChart = stackedChart(
  "성향 분류(의뢰자 분류)별 논조 비교",
  labels.map((l) => ({
    label: l,
    counts: toneCounts(articles.filter((a) => (labelOf(a.outlet) || "분류 미정") === l)),
  })),
  "성향 분류(의뢰자 분류)별 논조 비교. 분류는 의뢰자가 정한 것이고, 논조는 기사 내용만 보고 판단했습니다."
);
const trendChart = barChart(
  "최근 7일 기사 수 추이",
  last7.map((d) => ({ label: d.slice(5).replace("-", ". "), value: history[d].total, dim: d !== date })),
  last7.length < 2
    ? "최근 7일 기사 수 추이. 오늘이 첫 기록이라 하루치만 있습니다. 기록이 쌓이면 늘어납니다."
    : `최근 7일 기사 수 추이 (기록이 있는 ${last7.length}일).`
);

/* ----- 표 ----- */
const fmtTime = (s) => {
  if (!s) return "확인 못 함";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  return m ? `${+m[2]}. ${+m[3]}${m[4] ? ` ${m[4]}:${m[5]}` : ""}` : s;
};
const toneTag = (t) => `<span class="tone ${TONE_CLASS[t] || "neu"}">${esc(t || "중립")}</span>`;

const articleItems = articles
  .map(
    (a, i) => `<article class="item">
  <h3><span class="idx num">${String(i + 1).padStart(2, "0")}</span><a href="${esc(safeUrl(a.url))}" rel="noopener noreferrer">${esc(a.title)}</a></h3>
  <p class="item-meta"><span>${esc(a.outlet)}</span><span${a.published_at ? ' class="num"' : ""}>${a.published_at ? "" : "게재 시각 "}${esc(fmtTime(a.published_at))}</span><span>${esc(a.category || "기타")}</span>${toneTag(a.tone)}${a.paywalled ? "<span>유료·로그인 기사 (공개된 부분만 확인)</span>" : ""}</p>
  <p>${esc(a.summary)}</p>
  <p class="basis"><b>논조 근거</b> ${esc(a.tone_basis || "근거 표현 없음")}</p>
  ${a.note ? `<p class="basis"><b>참고</b> ${esc(a.note)}</p>` : ""}
</article>`
  )
  .join("\n");

const outletRows = outlets
  .map((o) => {
    const ok = o.status === "확인함";
    return `<tr><td>${esc(o.name)}<br><span class="muted small">${esc(o.site)}</span></td><td>${esc(o.group || "")}</td><td>${esc(o.client_label || "분류 미정")}</td><td>${ok ? "확인함" : '<span class="tone neg">접속 실패</span>'}</td><td class="r">${ok ? count((a) => a.outlet === o.name) : "-"}</td><td class="small">${esc([o.method, o.error, o.note].filter(Boolean).join(" / "))}</td></tr>`;
  })
  .join("\n");

const critical = articles.filter((a) => a.tone === "비판");
const tc = toneCounts(articles);
const [y, m, d] = date.split("-").map(Number);
const dateKo = `${y}. ${m}. ${d}`;
const win = data.window || {};

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>의정부 지역매체 언론 동향 ${dateKo}</title>
<meta name="description" content="의정부 관련 지역언론 기사 ${total}건을 언론사, 분야, 논조별로 정리한 일일 보고서.">
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0B0C0E" media="(prefers-color-scheme: dark)">
<link rel="preload" href="../../../templates/assets/fonts/PretendardVariable.woff2" as="font" type="font/woff2" crossorigin>
<style>
/* 양식: templates/documents/report.html. 토큰: DESIGN.md 2~3장 */
@font-face { font-family: "Pretendard Variable"; font-weight: 45 920; font-style: normal; font-display: swap;
  src: local("Pretendard Variable"), url("../../../templates/assets/fonts/PretendardVariable.woff2") format("woff2-variations"), url("../../../templates/assets/fonts/PretendardVariable.woff2") format("woff2"); }
@font-face { font-family: "Geist Mono"; font-weight: 100 900; font-style: normal; font-display: swap;
  src: local("Geist Mono"), url("../../../templates/assets/fonts/GeistMono.woff2") format("woff2"); }
:root {
  --bg: #FFFFFF; --surface: #F6F7F8; --border: #E4E6E9; --text: #111315; --text-muted: #5D636B;
  --accent: #0F6E5C; --accent-contrast: #FFFFFF; --negative: #A2413A; --caution: #8A5A12;
  --font: "Pretendard Variable", Pretendard, system-ui, -apple-system, sans-serif;
  --mono: "Geist Mono", ui-monospace, SFMono-Regular, monospace;
  --ease: cubic-bezier(0.2, 0, 0, 1);
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0B0C0E; --surface: #141619; --border: #25282D; --text: #ECEDEF; --text-muted: #9AA0A8;
    --accent: #3FB59A; --accent-contrast: #06231D; --negative: #E3877F; --caution: #D6A55C; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0B0C0E; --surface: #141619; --border: #25282D; --text: #ECEDEF; --text-muted: #9AA0A8;
  --accent: #3FB59A; --accent-contrast: #06231D; --negative: #E3877F; --caution: #D6A55C; color-scheme: dark;
}
*, *::before, *::after { box-sizing: border-box; }
.skip { position: absolute; left: 16px; top: -100px; z-index: 100; background: var(--accent); color: var(--accent-contrast); padding: 8px 16px; border-radius: 8px; font-weight: 600; }
.skip:focus-visible { top: 12px; text-decoration: none; }
html { -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; scroll-padding-top: 88px; }
body { margin: 0; background: var(--surface); color: var(--text); font-family: var(--font); font-size: 16px; line-height: 1.7; word-break: keep-all; overflow-wrap: break-word; -webkit-font-smoothing: antialiased; }
@media (min-width: 1024px) { body { font-size: 17px; } }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.icon { width: 20px; height: 20px; flex: none; fill: currentColor; }
.num { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.muted { color: var(--text-muted); }
.small { font-size: 13px; }

.toolbar { position: sticky; top: 0; z-index: 10; background: var(--bg); border-bottom: 1px solid var(--border); }
.toolbar-inner { max-width: 1200px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; gap: 12px; }
.toolbar .crumb { flex: 1 1 auto; min-width: 0; font-size: 14px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.toolbar .crumb b { color: var(--text); font-weight: 600; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 20px; border-radius: 8px; border: 1px solid transparent; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background-color 200ms var(--ease), border-color 200ms var(--ease); touch-action: manipulation; }
.btn-secondary { background: transparent; color: var(--text); border-color: var(--border); }
.btn-secondary:hover { background: var(--surface); }
.btn-secondary:active { background: var(--border); }

.page { max-width: 840px; margin: 32px auto 96px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 64px 72px; }
@media screen and (max-width: 767px) { .page { margin: 0; border: 0; border-radius: 0; padding: 32px 20px 64px; } }

.doc-kind { font-size: 14px; font-weight: 600; color: var(--accent); margin: 0 0 12px; }
.doc-title { font-size: 32px; font-weight: 700; line-height: 1.25; letter-spacing: -0.02em; margin: 0; text-wrap: balance; }
@media (min-width: 1024px) { .doc-title { font-size: 40px; } }
.doc-sub { margin: 12px 0 0; color: var(--text-muted); max-width: 65ch; }
.doc-head { padding-bottom: 32px; border-bottom: 1px solid var(--text); }
.meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; margin: 0; border-bottom: 1px solid var(--border); }
.meta > div { padding: 16px 16px 16px 0; }
.meta dt { font-size: 13px; color: var(--text-muted); }
.meta dd { margin: 4px 0 0; font-size: 15px; font-weight: 500; }
@media screen and (max-width: 767px) { .meta { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.doc-body { counter-reset: sec; }
.doc-body section { margin-top: 48px; }
.doc-body h2 { counter-increment: sec; font-size: 24px; font-weight: 600; line-height: 1.3; letter-spacing: -0.01em; margin: 0 0 16px; display: flex; gap: 12px; align-items: baseline; }
.doc-body h2::before { content: counter(sec) "."; font-family: var(--mono); font-size: 18px; color: var(--accent); }
.doc-body h3 { font-size: 18px; font-weight: 600; line-height: 1.4; margin: 32px 0 8px; }
.doc-body p, .doc-body li { max-width: 65ch; }
.doc-body p { margin: 0 0 16px; }
.doc-body ul, .doc-body ol { margin: 0 0 16px; padding-left: 1.25em; }
.doc-body li + li { margin-top: 4px; }
@media (min-width: 1024px) { .doc-body h2 { font-size: 28px; } .doc-body h3 { font-size: 20px; } }

.summary { background: var(--surface); border-radius: 12px; padding: 24px 24px 8px; margin-top: 32px; }
.summary h2 { font-size: 16px !important; color: var(--text-muted); counter-increment: none !important; margin-bottom: 8px !important; }
.summary h2::before { content: none !important; }
.summary ul { padding-left: 1.1em; }
.summary b { font-weight: 600; }

.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 24px 0 0; border-bottom: 1px solid var(--border); }
.stats > div { padding: 16px 16px 16px 0; }
.stats dt { font-size: 13px; color: var(--text-muted); }
.stats dd { margin: 4px 0 0; font-family: var(--mono); font-size: 28px; font-weight: 500; line-height: 1.2; font-variant-numeric: tabular-nums; }
.stats dd small { font-family: var(--font); font-size: 14px; font-weight: 400; color: var(--text-muted); margin-left: 4px; }
@media screen and (max-width: 767px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.callout { border-left: 3px solid var(--accent); padding: 4px 0 4px 20px; margin: 24px 0; }
.callout p:last-child, .callout ul:last-child { margin-bottom: 0; }
.callout .label { display: block; font-size: 13px; font-weight: 600; color: var(--accent); margin-bottom: 4px; }

.table-wrap { overflow-x: auto; margin: 16px 0 24px; }
table.data { width: 100%; border-collapse: collapse; font-size: 15px; }
table.data caption { caption-side: bottom; text-align: left; font-size: 13px; color: var(--text-muted); padding-top: 8px; }
table.data th, table.data td { text-align: left; padding: 12px 16px 12px 0; border-bottom: 1px solid var(--border); vertical-align: top; }
table.data thead th { font-size: 13px; font-weight: 600; color: var(--text-muted); border-bottom-color: var(--text); white-space: nowrap; }
table.data .r { text-align: right; font-family: var(--mono); font-variant-numeric: tabular-nums; padding-left: 16px; }
table.data td.small { font-size: 13px; color: var(--text-muted); min-width: 180px; }

figure { margin: 24px 0; }
figcaption { font-size: 13px; color: var(--text-muted); margin-top: 8px; }
.chart { overflow-x: auto; }
.chart svg { width: 100%; min-width: 520px; height: auto; display: block; }
.chart .axis { fill: var(--text-muted); font-size: 13px; font-family: var(--font); }
.chart .lbl { fill: var(--text); font-size: 13px; font-weight: 600; font-family: var(--font); }
.chart .bar { fill: var(--accent); }
.chart .bar.dim { fill: var(--text-muted); opacity: 0.4; }
.chart .seg.pos { fill: var(--accent); }
.chart .seg.neu { fill: var(--border); }
.chart .seg.neg { fill: var(--negative); }
.chart .seglbl { font-size: 12px; font-weight: 600; font-family: var(--mono); }
.chart .seglbl.pos { fill: var(--accent-contrast); }
.chart .seglbl.neu { fill: var(--text); }
.chart .seglbl.neg { fill: var(--bg); }
.legend { display: flex; gap: 20px; flex-wrap: wrap; font-size: 13px; color: var(--text-muted); margin: 0 0 8px; padding: 0 !important; list-style: none; }
.legend li { display: inline-flex; align-items: center; gap: 8px; margin: 0 !important; }
.legend i { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
.legend i.pos { background: var(--accent); }
.legend i.neu { background: var(--border); }
.legend i.neg { background: var(--negative); }

.tone { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
.tone::before { content: ""; width: 8px; height: 8px; border-radius: 999px; background: currentColor; }
.tone.pos { color: var(--accent); }
.tone.neu { color: var(--text-muted); }
.tone.neg { color: var(--negative); }

.item { padding: 24px 0; border-bottom: 1px solid var(--border); }
.item:first-of-type { border-top: 1px solid var(--text); }
.item h3 { margin: 0 0 8px; display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: baseline; }
.item h3 a { color: var(--text); }
.item h3 a:hover { color: var(--accent); }
.item .idx { font-size: 14px; font-weight: 500; color: var(--accent); }
.item-meta { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 14px; color: var(--text-muted); margin: 0 0 12px !important; max-width: none !important; }
.item p { margin-bottom: 8px; }
.item .basis { font-size: 14px; color: var(--text-muted); margin-bottom: 4px; }
.item .basis b { font-weight: 600; color: var(--text); margin-right: 8px; }

.foot { margin-top: 64px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 13px; color: var(--text-muted); display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

@page { size: A4; margin: 18mm 16mm 20mm; }
@media print {
  :root { --bg: #fff; --surface: #F6F7F8; --border: #E4E6E9; --text: #111315; --text-muted: #5D636B; --accent: #0F6E5C; --negative: #A2413A; }
  body { background: #fff; font-size: 10.5pt; }
  .toolbar { display: none; }
  .page { max-width: none; margin: 0; padding: 0; border: 0; }
  h2, h3 { break-after: avoid; }
  table.data tr, figure, .callout, .summary, .item { break-inside: avoid; }
  .summary, .chart rect { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
html.shot .toolbar { display: none; }
html.shot body { background: var(--bg); }
html.shot .page { margin: 0 auto; border: 0; border-radius: 0; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-print" viewBox="0 0 256 256"><path d="M214.67,72H200V40a8,8,0,0,0-8-8H64a8,8,0,0,0-8,8V72H41.33C27.36,72,16,82.77,16,96v80a8,8,0,0,0,8,8H56v32a8,8,0,0,0,8,8H192a8,8,0,0,0,8-8V184h32a8,8,0,0,0,8-8V96C240,82.77,228.64,72,214.67,72ZM72,48H184V72H72ZM184,208H72V160H184Zm40-40H200V152a8,8,0,0,0-8-8H64a8,8,0,0,0-8,8v16H32V96c0-4.41,4.19-8,9.33-8H214.67c5.14,0,9.33,3.59,9.33,8Zm-24-52a12,12,0,1,1-12-12A12,12,0,0,1,200,116Z"/></symbol>
</svg>
<header class="toolbar">
  <div class="toolbar-inner">
    <span class="crumb">언론 동향 보고 / <b>${dateKo}</b></span>
    <button class="btn btn-secondary" type="button" onclick="window.print()"><svg class="icon" aria-hidden="true"><use href="#i-print"/></svg>인쇄 / PDF</button>
  </div>
</header>
<main class="page" id="main">
  <header class="doc-head">
    <p class="doc-kind">일일 언론 동향 보고</p>
    <h1 class="doc-title">의정부 지역매체 언론 동향</h1>
    <p class="doc-sub">지역 밀착 매체와 광역 매체 ${outlets.length}곳의 누리집에서 최근 24시간 동안 실린 의정부 관련 기사를 모아 언론사, 분야, 논조별로 정리했습니다.</p>
  </header>
  <dl class="meta">
    <div><dt>보고일</dt><dd class="num">${dateKo}</dd></div>
    <div><dt>수집 범위</dt><dd class="num">${esc(fmtTime(win.from))} ~ ${esc(fmtTime(win.to))}</dd></div>
    <div><dt>확인한 언론사</dt><dd><span class="num">${outlets.length - failed.length}</span>곳 / <span class="num">${outlets.length}</span>곳</dd></div>
    <div><dt>작성</dt><dd>에이전트 본부 (자동 작성)</dd></div>
  </dl>

  <div class="doc-body">
    <div class="summary">
      <h2>오늘의 핵심</h2>
      <ul>
${(highlights.length ? highlights : [total ? "핵심 요약이 작성되지 않았습니다." : "해당 기사 없음. 확인한 언론사 목록은 아래 표에 있습니다."]).map((h) => `        <li>${esc(h)}</li>`).join("\n")}
      </ul>
    </div>

    <dl class="stats">
      <div><dt>전체 기사</dt><dd>${total}<small>건</small></dd></div>
      <div><dt>우호</dt><dd>${tc["우호"]}<small>건</small></dd></div>
      <div><dt>중립</dt><dd>${tc["중립"]}<small>건</small></dd></div>
      <div><dt>비판</dt><dd>${tc["비판"]}<small>건</small></dd></div>
    </dl>

${critical.length ? `    <div class="callout">
      <span class="label">비판 논조 기사 ${critical.length}건</span>
      <ul>
${critical.map((a) => `        <li><a href="${esc(safeUrl(a.url))}" rel="noopener noreferrer">${esc(a.title)}</a> <span class="muted">(${esc(a.outlet)})</span></li>`).join("\n")}
      </ul>
    </div>` : ""}

    <section>
      <h2>한눈에 보기</h2>
      <h3>언론사별 기사 수</h3>
      ${outletChart}
      <h3>분야별 기사 수</h3>
      ${catChart}
      <h3>논조 분포</h3>
      ${toneChart}
      <h3>성향 분류별 논조 비교</h3>
      ${labelChart}
      <h3>최근 7일 추이</h3>
      ${trendChart}
    </section>

    <section>
      <h2>기사 목록</h2>
      ${total ? `<p class="muted">게재 시각이 늦은 순서입니다. 제목을 누르면 원문으로 갑니다. 요약은 기사 내용을 줄여 쓴 것이고 본문을 그대로 옮기지 않았습니다.</p>\n${articleItems}` : "<p>해당 기사 없음.</p>"}
    </section>

    <section>
      <h2>확인한 언론사</h2>
      <div class="table-wrap">
      <table class="data">
        <caption>표 1. 언론사별 확인 결과. 성향은 의뢰자 분류이며, 기사 논조 판단에는 쓰지 않았습니다.</caption>
        <thead><tr><th scope="col">언론사</th><th scope="col">구분</th><th scope="col">성향 (의뢰자 분류)</th><th scope="col">확인</th><th scope="col" class="r">기사</th><th scope="col">방법과 참고</th></tr></thead>
        <tbody>
${outletRows}
        </tbody>
      </table>
      </div>
    </section>

    <section>
      <h2>작성 기준과 한계</h2>
      <ul>
        <li>언론사 누리집에 실제로 실린 기사만 담았습니다. 접속하지 못한 언론사는 "접속 실패"로 적고 내용을 채우지 않았습니다.</li>
        <li>논조는 의정부 시정에 대한 기사 표현을 기준으로 우호, 중립, 비판으로 나눴습니다. 시정과 직접 관련이 없는 기사는 중립으로 두었습니다. 자동 분류이므로 중요한 기사는 원문 확인을 권합니다.</li>
        <li>인물과 정당에 대한 평가는 담지 않았습니다. 기사가 무엇을 어떻게 다뤘는지만 적었습니다.</li>
${notes.map((n) => `        <li>${esc(n)}</li>`).join("\n")}
      </ul>
    </section>
  </div>

  <footer class="foot"><span>의정부 지역매체 언론 동향 · <span class="num">${dateKo}</span></span><span>수집 완료 <span class="num">${esc(fmtTime(data.collected_at))}</span></span></footer>
</main>
</body>
</html>
`;

fs.writeFileSync(path.join(dir, "index.html"), html);
console.log(`index.html 작성: 기사 ${total}건, 접속 실패 ${failed.length}곳`);

/* ----- 한 장짜리 이미지 ----- */
(async () => {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    console.error("playwright가 없어 report.png를 만들지 못했습니다.");
    process.exit(2);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 880, height: 1200 }, deviceScaleFactor: 2, colorScheme: "light" });
  await page.goto("file://" + path.join(dir, "index.html"));
  await page.evaluate(() => document.documentElement.classList.add("shot"));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(dir, "report.png"), fullPage: true });
  await browser.close();
  console.log("report.png 작성");
})();
