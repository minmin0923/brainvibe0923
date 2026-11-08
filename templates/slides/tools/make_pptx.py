"""DESIGN.md 기준 PowerPoint 양식(design-template.pptx)을 만듭니다.

사용법:
    pip install python-pptx
    python3 templates/slides/tools/make_pptx.py

색과 글꼴은 DESIGN.md 2~3장 값을 그대로 씁니다. 받는 컴퓨터에 Pretendard가
없으면 PowerPoint가 비슷한 고딕 글꼴로 대신 보여 줍니다.
"""
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Pt

OUT = Path(__file__).resolve().parent.parent / "design-template.pptx"

BG = RGBColor(0xFF, 0xFF, 0xFF)
SURFACE = RGBColor(0xF6, 0xF7, 0xF8)
BORDER = RGBColor(0xE4, 0xE6, 0xE9)
TEXT = RGBColor(0x11, 0x13, 0x15)
MUTED = RGBColor(0x5D, 0x63, 0x6B)
ACCENT = RGBColor(0x0F, 0x6E, 0x5C)
FONT = "Pretendard"

# 1280 x 720 기준 '디자인 px'를 EMU로 바꿉니다 (13.333in x 7.5in 슬라이드).
PX = 9525


def px(v):
    return Emu(int(v * PX))


prs = Presentation()
prs.slide_width, prs.slide_height = px(1280), px(720)
BLANK = prs.slide_layouts[6]


def new_slide(bg=BG):
    s = prs.slides.add_slide(BLANK)
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = bg
    return s


def text(slide, x, y, w, h, value, size=20, bold=False, color=TEXT, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.TOP, spacing=1.3):
    box = slide.shapes.add_textbox(px(x), px(y), px(w), px(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    lines = value if isinstance(value, list) else [value]
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        r = p.add_run()
        r.text = line
        r.font.name = FONT
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.color.rgb = color
    return box


def _drop_style(shape):
    """테마 기본 효과(그림자 등)를 떼어 내 선이 번져 보이지 않게 합니다."""
    style = shape._element.find(qn("p:style"))
    if style is not None:
        shape._element.remove(style)


def rule(slide, x, y, w, color=BORDER, weight=1):
    ln = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, px(x), px(y), px(x + w), px(y))
    ln.line.color.rgb = color
    ln.line.width = Pt(weight * 0.75)
    _drop_style(ln)
    return ln


def box(slide, x, y, w, h, line=BORDER, fill=None):
    b = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, px(x), px(y), px(w), px(h))
    b.adjustments[0] = 12 / min(w, h)
    if fill is None:
        b.fill.background()
    else:
        b.fill.solid()
        b.fill.fore_color.rgb = fill
    b.line.color.rgb = line
    b.line.width = Pt(0.75)
    _drop_style(b)
    return b


def footer(slide, left, no):
    text(slide, 96, 650, 800, 24, left, size=10, color=MUTED)
    text(slide, 1084, 650, 100, 24, f"{no:02d}", size=10, color=MUTED, align=PP_ALIGN.RIGHT)


def notes(slide, value):
    slide.notes_slide.notes_text_frame.text = value


# 01 표지
s = new_slide()
text(s, 96, 300, 900, 30, "2026 하반기 운영 계획", size=14, bold=True, color=ACCENT)
text(s, 96, 340, 960, 180, ["문서 양식을 하나로 맞추면", "보고 시간이 줄어듭니다"], size=44, bold=True, spacing=1.1)
text(s, 96, 500, 900, 60, "팀별로 흩어진 보고서, 회의록, 발표 자료를 공통 양식으로 정리한 결과", size=18, color=MUTED)
text(s, 96, 600, 900, 30, "경영지원팀 문서표준 TF   ·   2026. 10. 13", size=12, color=MUTED)
notes(s, "표지: 제목은 결론 한 문장으로 씁니다. 두 줄을 넘기지 않습니다.")

# 02 목차
s = new_slide()
text(s, 96, 80, 600, 30, "목차", size=14, bold=True, color=ACCENT)
text(s, 96, 116, 1000, 70, "오늘 다룰 내용", size=30, bold=True)
items = [("지금 문서 작성 방식", "팀별 양식 현황과 걸리는 시간"), ("공통 양식 12종", "보고서, 회의록, 발표, 대시보드"),
         ("시범 운영 결과", "3개 팀, 6주간 측정한 수치"), ("전사 적용 일정", "11월부터 단계적으로 전환")]
for i, (t, d) in enumerate(items):
    x = 96 + (i % 2) * 560
    y = 240 + (i // 2) * 130
    rule(s, x, y, 520)
    text(s, x, y + 24, 60, 30, f"{i + 1:02d}", size=14, bold=True, color=ACCENT)
    text(s, x + 64, y + 20, 440, 36, t, size=20, bold=True)
    text(s, x + 64, y + 58, 440, 30, d, size=14, color=MUTED)
footer(s, "문서표준 TF", 2)

# 03 구역 구분
s = new_slide(SURFACE)
text(s, 96, 220, 400, 110, "01", size=72, bold=True, color=ACCENT)
text(s, 96, 340, 1000, 80, "지금 문서 작성 방식", size=44, bold=True)
text(s, 96, 450, 1000, 40, "같은 내용을 팀마다 다른 모양으로 만들고 있습니다", size=18, color=MUTED)

# 04 핵심 메시지 + 요점
s = new_slide()
text(s, 96, 80, 600, 30, "현황", size=14, bold=True, color=ACCENT)
text(s, 96, 130, 440, 220, ["양식을 고르는 데만", "보고서 한 건당", "40분을 씁니다"], size=32, bold=True, spacing=1.2)
points = ["양식 27종이 공유 드라이브에 흩어져 있고, 최신본을 찾기 어렵습니다.",
          "같은 주간 보고라도 팀마다 항목 순서가 달라 취합에 시간이 듭니다.",
          "발표 자료는 매번 새로 만들어 글꼴과 색이 제각각입니다."]
for i, p in enumerate(points):
    y = 140 + i * 100
    rule(s, 600, y + 14, 12, ACCENT, 2)
    text(s, 632, y, 560, 90, p, size=18, spacing=1.5)
footer(s, "출처: 9월 사내 설문 (응답 212명)", 4)

# 05 2단 비교
s = new_slide()
text(s, 96, 80, 600, 30, "선택지", size=14, bold=True, color=ACCENT)
text(s, 96, 116, 1000, 70, "두 가지 방법을 검토했습니다", size=30, bold=True)
cols = [("A. 외부 양식 구매", ["바로 쓸 수 있지만 연 480만 원이 듭니다", "사내 용어와 결재 항목을 따로 고쳐야 합니다", "글꼴 라이선스를 별도로 확인해야 합니다"], BORDER),
        ("B. 공통 양식 직접 제작 (추천)", ["추가 비용 없이 기존 디자인 기준을 따릅니다", "하나의 원본으로 화면, 발표, PDF를 만듭니다", "필요한 양식을 팀이 직접 늘릴 수 있습니다"], ACCENT)]
for i, (t, lines, line) in enumerate(cols):
    x = 96 + i * 560
    box(s, x, 220, 528, 380, line=line)
    text(s, x + 40, 256, 450, 40, t, size=20, bold=True)
    text(s, x + 40, 316, 450, 260, ["· " + l for l in lines], size=16, spacing=1.8)
footer(s, "문서표준 TF", 5)

# 06 큰 숫자
s = new_slide()
text(s, 96, 80, 600, 30, "시범 운영 결과 · 6주", size=14, bold=True, color=ACCENT)
text(s, 96, 116, 1000, 70, "세 팀 모두 작성 시간이 줄었습니다", size=30, bold=True)
kpis = [("보고서 작성 시간", "-38%", "평균 2시간 10분 → 1시간 21분"), ("취합 단계 수정 요청", "-61%", "주당 18건 → 7건"),
        ("양식 재사용률", "92%", "새 문서 중 공통 양식 사용 비율")]
for i, (label, value, delta) in enumerate(kpis):
    x = 96 + i * 370
    rule(s, x, 360, 340, ACCENT if i == 0 else TEXT, 2)
    text(s, x, 384, 340, 30, label, size=14, color=MUTED)
    text(s, x, 420, 340, 100, value, size=60, bold=True)
    text(s, x, 530, 340, 30, delta, size=14, color=MUTED)
footer(s, "측정 기간 8.25 ~ 10.3", 6)

# 07 표
s = new_slide()
text(s, 96, 80, 600, 30, "양식 구성", size=14, bold=True, color=ACCENT)
text(s, 96, 116, 1000, 70, "먼저 다섯 가지 양식을 배포합니다", size=30, bold=True)
rows = [("양식", "주 사용처", "월 사용 예상", "형식"), ("주간 업무 보고", "전 부서", "640", "문서, 마크다운"),
        ("회의록", "전 부서", "410", "문서, 마크다운"), ("기획·제안서", "기획, 영업", "85", "문서"),
        ("발표 자료", "전 부서", "120", "슬라이드, PPTX"), ("성과 대시보드", "경영, 영업", "30", "대시보드")]
shape = s.shapes.add_table(len(rows), 4, px(96), px(220), px(1088), px(360))
tbl = shape.table
tbl.first_row = False
tbl.horz_banding = False
for c, w in enumerate((340, 280, 200, 268)):
    tbl.columns[c].width = px(w)
for r, row in enumerate(rows):
    for c, val in enumerate(row):
        cell = tbl.cell(r, c)
        cell.fill.background()
        cell.margin_left = px(0 if c == 0 else 16)
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = cell.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.RIGHT if c == 2 else PP_ALIGN.LEFT
        run = p.add_run()
        run.text = val
        run.font.name = FONT
        run.font.size = Pt(13 if r == 0 else 15)
        run.font.bold = r == 0 or r == 1
        run.font.color.rgb = MUTED if r == 0 else TEXT
for r in range(len(rows) + 1):
    rule(s, 96, 220 + r * 60, 1088)
footer(s, "월 사용 예상은 9월 실제 문서 수 기준", 7)

# 08 일정
s = new_slide()
text(s, 96, 80, 600, 30, "적용 일정", size=14, bold=True, color=ACCENT)
text(s, 96, 116, 1000, 70, "11월부터 네 단계로 전환합니다", size=30, bold=True)
steps = [("10월 1주", "양식 확정", "시범 팀 의견 반영 완료", True), ("10월 4주", "사내 공지", "사용 안내서와 교육 영상 배포", True),
         ("11월", "전 부서 적용", "기존 양식은 읽기 전용으로 보관", False), ("12월", "효과 측정", "작성 시간, 수정 요청 재측정", False)]
for i, (when, title, desc, done) in enumerate(steps):
    x = 96 + i * 278
    rule(s, x, 400, 254, ACCENT if done else BORDER, 2)
    text(s, x, 424, 254, 24, when, size=13, color=MUTED)
    text(s, x, 456, 254, 32, title, size=18, bold=True)
    text(s, x, 496, 254, 60, desc, size=13, color=MUTED, spacing=1.5)
footer(s, "문서표준 TF", 8)

# 09 마무리
s = new_slide()
text(s, 96, 120, 600, 30, "요청 사항", size=14, bold=True, color=ACCENT)
text(s, 96, 160, 1000, 160, ["10월 24일까지 팀별 담당자", "한 명을 정해 주세요"], size=44, bold=True, spacing=1.15)
for i, (k, v) in enumerate([("담당", "문서표준 TF 김서연"), ("메일", "docs-tf@company.example"), ("문의 채널", "#문서표준")]):
    x = 96 + i * 360
    text(s, x, 560, 320, 24, k, size=12, color=MUTED)
    text(s, x, 588, 320, 30, v, size=16)

prs.save(OUT)
print("saved", OUT)
