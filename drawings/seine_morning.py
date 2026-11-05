"""수채화: 파리 센강의 아침 — 아침 안개 속 에펠탑, 돌다리, 오스만 건물, 강물 위 햇빛 길, 작은 배.
python3 seine_morning.py [out.png] [--stages DIR]
"""
import os, sys
sys.path.insert(0, os.path.expanduser('~/.claude/skills/claude-drawing-skill/lib'))
import numpy as np
from PIL import Image, ImageDraw
from watercolor import Watercolor, hexc
from core import spline, curve, blur

out = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'seine_morning.png'
stages = sys.argv[sys.argv.index('--stages') + 1] if '--stages' in sys.argv else None

W, H = 1920, 1080
p = Watercolor(W, H, seed=923)
p.paper()
p.stage('paper')
rng = p.rng
Y0 = 640                      # 수면선
SUN = (820, 300)


def rects(items):
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    for (x0, y0, x1, y1) in items:
        d.rectangle([x0, y0, x1, y1], fill=255)
    return np.asarray(im, np.float32) / 255


def polys(items):
    im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
    for pts in items:
        d.polygon([tuple(map(float, q)) for q in pts], fill=255)
    return np.asarray(im, np.float32) / 255


# ---- 하늘: 위는 연한 하늘색, 지평선 쪽은 복숭아빛 아침
p.gradient_wash(0, Y0, top=hexc('#9dbad6'), bottom=hexc('#f7d9b0'), strength=0.55, soft_bottom=40)
glow = np.exp(-(((p.XX - SUN[0]) / 420) ** 2 + ((p.YY - SUN[1]) / 300) ** 2))
p.glaze(glow * (p.YY < Y0 + 10), hexc('#f3c27a'), 0.35, edge=0.0, gran=0.2)
p.lift(np.exp(-(((p.XX - SUN[0]) ** 2 + (p.YY - SUN[1]) ** 2) / (2 * 55 ** 2))), 0.95)   # 해: 종이 흰색으로 남김
clouds = p.blobs([(x, rng.uniform(120, 200), rng.uniform(60, 120), rng.uniform(14, 26)) for x in np.linspace(1150, 1800, 9)], rough=0.3, soft=14)
p.glaze(clouds, hexc('#c9a9b6'), 0.25, edge=0.2, gran=0.3)
clouds2 = p.blobs([(x, rng.uniform(90, 150), rng.uniform(50, 100), rng.uniform(10, 20)) for x in np.linspace(80, 560, 7)], rough=0.3, soft=14)
p.glaze(clouds2, hexc('#c9a9b6'), 0.2, edge=0.2, gran=0.3)
p.stage('sky')

BX0, BX1, DECK = 360, 1700, 548
BEHIND = 1 - np.clip(((p.XX > BX0 - 4) & (p.XX < BX1 + 4) & (p.YY > DECK - 18)).astype(np.float32), 0, 1)

# ---- 먼 에펠탑 (안개 낀 푸른 회색)
TX, TB, TT = 1420, 532, 96          # 중심 x, 밑, 꼭대기
def half(sgn):
    ys = np.linspace(TB, TT, 40)
    t = (TB - ys) / (TB - TT)
    w = 118 * (1 - t) ** 2.4 + 5
    return [(TX + sgn * wi, y) for wi, y in zip(w, ys)]
tower = half(-1) + half(1)[::-1]
tm = p.shape(tower, soft=1.5, ragged=0.15)
arch = p.shape([(TX - 72 + 144 * u, TB - 62 * np.sin(np.pi * u)) for u in np.linspace(0, 1, 30)] + [(TX + 72, TB + 10), (TX - 72, TB + 10)], soft=1.2, ragged=0.1)
tm = np.clip(tm - arch, 0, 1)
fade = np.clip(0.55 + (p.YY - TT) / 900, 0, 1)            # 위쪽이 더 안개에 묻힘
p.glaze(tm * fade * BEHIND, hexc('#7f8aac'), 0.55, edge=0.35, gran=0.4)
for y, wv in [(468, 76), (370, 44), (236, 20)]:
    if y > DECK - 22: continue            # 전망대 층
    p.line([(TX - wv, y), (TX + wv, y)], 3.2, hexc('#5f6888'), 0.6)
for k in range(14):                                        # 철골 격자 몇 줄
    y = 520 - k * 28
    if y < TT + 40: break
    t = (TB - y) / (TB - TT); wv = 118 * (1 - t) ** 2.4 + 5
    p.line([(TX - wv, y), (TX + wv * 0.2, y - 26)], 1.0, hexc('#6c7697'), 0.25)
    p.line([(TX + wv, y), (TX - wv * 0.2, y - 26)], 1.0, hexc('#6c7697'), 0.25)
p.line([(TX, TT), (TX, TT - 38)], 2.0, hexc('#6c7697'), 0.6)

# ---- 오른쪽 둑의 먼 나무숲
tower_trees = p.blobs([(x, DECK - rng.uniform(5, 25), rng.uniform(40, 70), rng.uniform(20, 34)) for x in np.linspace(1250, 1600, 7)], rough=0.3, soft=8)
p.glaze(tower_trees * BEHIND, hexc('#a3ae8f'), 0.4, edge=0.3, gran=0.45)
far_trees = p.blobs([(x, Y0 - rng.uniform(25, 60), rng.uniform(40, 70), rng.uniform(26, 44)) for x in np.linspace(1560, 1960, 12)], rough=0.3, soft=6)
p.glaze(far_trees * BEHIND, hexc('#93a68a'), 0.45, edge=0.35, gran=0.45)
p.stage('distance')

# ---- 왼쪽 둑의 오스만 건물들 (아침 햇살 받은 크림색 벽 + 푸른 회색 망사르드 지붕)
quay_trees = p.blobs([(x, Y0 - rng.uniform(40, 80), rng.uniform(40, 70), rng.uniform(30, 50)) for x in np.linspace(-20, 560, 9)], rough=0.32, soft=5)
OCC = BEHIND * (1 - np.clip(quay_trees * 1.3, 0, 1))
blds = []
x = -20
while x < 640:
    w = rng.uniform(95, 150); top = rng.uniform(330, 400) + max(0, x - 300) * 0.18
    blds.append((x, x + w, top)); x += w - 4
walls = rects([(a, t, b, Y0 - 30) for a, b, t in blds])
p.glaze(walls * OCC, hexc('#ecd3a6'), 0.45, edge=0.4, gran=0.35)
shade_side = rects([(b - 22, t, b, Y0 - 30) for a, b, t in blds])          # 햇빛 반대편 그늘
p.glaze(shade_side * walls * OCC, hexc('#c4a985'), 0.35, edge=0.2)
roofs = polys([[(a - 4, t), (a + 14, t - 52), (b - 14, t - 52), (b + 4, t)] for a, b, t in blds])
p.glaze(p.soften(roofs, 1.5, 0.15), hexc('#7d8eaa'), 0.62, edge=0.45, gran=0.45)
cxs = [a + rng.uniform(20, 60) for a, b, t in blds]
chim = rects([(c, t - 78, c + 14, t - 50) for c, (a, b, t) in zip(cxs, blds)])
p.glaze(p.soften(chim, 1.2, 0.1), hexc('#b0786a'), 0.55, edge=0.3)
wins = []
for a, b, t in blds:
    for row in range(5):
        y = t + 22 + row * 44
        if y > Y0 - 70: break
        n = int((b - a) // 30)
        for c in range(n):
            wx = a + 12 + c * (b - a - 24) / max(1, n)
            wins.append((wx, y, wx + 10, y + 22))
    wins += [(a + 6 + k * 20, t - 38, a + 16 + k * 20, t - 22) for k in range(int((b - a - 20) // 40))]  # 지붕창
p.glaze(p.soften(rects(wins), 0.8, 0.1) * OCC, hexc('#6c6a78'), 0.5, edge=0.3, gran=0.2)
for a, b, t in blds:                                       # 발코니 난간 선
    for y in (t + 58, t + 146):
        xe = min(b, BX0) if y > DECK - 24 else b
        if y < Y0 - 110 and xe - a > 30:
            p.line([(a + 6, y), (xe - 6, y)], 1.6, hexc('#4c4a52'), 0.45)
p.glaze(quay_trees * BEHIND, hexc('#a7b36f'), 0.6, edge=0.4, gran=0.45, bloom=1)
p.glaze(quay_trees * BEHIND * np.clip(blur(quay_trees, 1) * 1.2, 0, 1) * np.clip((p.YY - (Y0 - 90)) / 60, 0, 1), hexc('#5f7a4e'), 0.45, edge=0.3)
p.stage('buildings')

# ---- 돌다리 (다섯 아치)
deck = [(BX0, DECK + 10), (BX0 + 20, DECK), (BX1 - 20, DECK), (BX1, DECK + 10), (BX1, Y0 + 2), (BX0, Y0 + 2)]
bm = p.shape(deck, soft=1.5, ragged=0.12)
arches = []
centres = np.linspace(BX0 + 150, BX1 - 150, 5)
for cx in centres:
    rx, ry = 104, 64
    arches.append([(cx - rx + 2 * rx * u, Y0 + 2 - ry * np.sin(np.pi * u) ** 0.8) for u in np.linspace(0, 1, 40)])
am = polys(arches)
bm = np.clip(bm - p.soften(am, 1.2, 0.1), 0, 1)
p.glaze(bm, hexc('#d9c29a'), 0.55, edge=0.45, gran=0.5)
p.glaze(p.soften(am, 1.5, 0.15) * (p.YY < Y0 + 2), hexc('#5d6b8a'), 0.55, edge=0.4)   # 아치 아래 그늘
p.glaze(rects([(BX0, DECK - 16, BX1, DECK + 4)]), hexc('#c4ab82'), 0.5, edge=0.3)        # 난간
for cx in centres:                                                                       # 교각 그늘 면
    for s in (-1, 1):
        x = cx + s * 104
        p.line([(x, DECK + 34), (x, Y0)], 1.4, hexc('#7b6a55'), 0.4)
p.line([(BX0, DECK + 6), (BX1, DECK + 6)], 1.6, hexc('#7b6a55'), 0.5)
for x in np.arange(BX0 + 30, BX1, 34):                                                   # 난간 기둥
    p.line([(x, DECK - 14), (x, DECK + 2)], 1.0, hexc('#8b7a62'), 0.35)
for cx in [BX0 + 60, BX1 - 60] + list((centres[:-1] + centres[1:]) / 2):                 # 가로등
    p.line([(cx, DECK - 16), (cx, DECK - 62)], 2.0, hexc('#3f4250'), 0.75)
    p.glaze(p.shape([(cx - 6, DECK - 70), (cx + 6, DECK - 70), (cx + 4, DECK - 60), (cx - 4, DECK - 60)], soft=0.8), hexc('#3f4250'), 0.8, edge=0.2)
p.stage('bridge')

# ---- 강물: 하늘빛이 가까울수록 진해짐 + 반사
water = np.clip((p.YY - Y0) / 3, 0, 1)
p.glaze(water * np.clip(0.3 + (p.YY - Y0) / 520, 0, 1), hexc('#7aa0b4'), 0.55, edge=0.05, gran=0.35, variation=0.3)
p.glaze(p.mirror(glow, Y0, soft=6, breakup=0.3) * water, hexc('#f0c47c'), 0.3, edge=0.05)
p.glaze(p.mirror(bm, Y0, soft=6, breakup=0.45), hexc('#cbb38d'), 0.35, edge=0.1)
p.glaze(p.mirror(p.soften(am, 1.5) * (p.YY < Y0 + 2), Y0, soft=6, breakup=0.4), hexc('#4f5d7c'), 0.35, edge=0.1)
p.glaze(p.mirror((walls + roofs * 0.8) * OCC, Y0, soft=8, breakup=0.55), hexc('#b9a68c'), 0.3, edge=0.1)
p.glaze(p.mirror(quay_trees, Y0, soft=8, breakup=0.55), hexc('#7f9460'), 0.3, edge=0.1)
p.glaze(p.mirror(far_trees, Y0, soft=8, breakup=0.55), hexc('#7f9460'), 0.25, edge=0.1)
# 햇빛 길: 해 아래로 가로 물결을 들어내기
rip = np.zeros((H, W), np.float32)
for _ in range(60):
    y = rng.uniform(Y0 + 10, 1060)
    spread = 40 + (y - Y0) * 0.45
    x = SUN[0] + rng.normal(0, spread * 0.6); ln = rng.uniform(40, 160) * (0.6 + (y - Y0) / 400)
    rip = np.maximum(rip, p.band([(x - ln / 2, y), (x + ln / 2, y + rng.normal(0, 1.2))], rng.uniform(2, 4.5), soft=1.0))
p.lift(rip * water, 0.75)
rip2 = np.zeros((H, W), np.float32)
for _ in range(36):
    y = rng.uniform(Y0 + 30, 1060); x = rng.uniform(-50, 1900); ln = rng.uniform(100, 360)
    rip2 = np.maximum(rip2, p.band([(x, y), (x + ln, y + rng.normal(0, 1.5))], rng.uniform(1.5, 3), soft=1.2))
p.lift(rip2 * water, 0.35)
mist = np.exp(-((p.YY - (Y0 - 6)) / 22) ** 2)                # 수면 위 얇은 아침 안개
p.lift(mist * (0.6 + 0.4 * p.noise(180, 3)), 0.35)
p.stage('river')

# ---- 강 위의 작은 배 (짙은 남색 선체 + 빨간 줄)
CX, CY = 1180, 790
hull = [(CX - 196, CY - 22), (CX - 192, CY + 2), (CX - 176, CY + 14)] + [(CX + 120 + 70 * np.sin(a), CY - 24 + 38 * np.cos(a)) for a in np.linspace(0, np.pi / 2, 12)][::-1][::-1] + [(CX - 196, CY - 22)]
hm = p.shape(hull, soft=1.2, ragged=0.08)
p.glaze(hm, hexc('#2f3f5e'), 0.9, edge=0.4, gran=0.2)
p.glaze(p.band([(CX - 182, CY - 12), (CX + 190, CY - 15)], 6, soft=0.8), hexc('#c23b2e'), 0.9, edge=0.2)
cab = p.shape([(CX - 70, CY - 20), (CX - 64, CY - 62), (CX + 70, CY - 62), (CX + 80, CY - 20)], soft=1, ragged=0.08)
p.glaze(cab, hexc('#efe6d2'), 0.5, edge=0.4)
p.glaze(p.soften(rects([(CX - 52 + k * 30, CY - 52, CX - 38 + k * 30, CY - 34) for k in range(5)]), 0.8), hexc('#5d6b8a'), 0.55, edge=0.2)
p.line([(CX - 140, CY - 18), (CX - 140, CY - 70)], 1.6, hexc('#3f4250'), 0.7)
p.glaze(p.shape([(CX - 140, CY - 70), (CX - 112, CY - 64), (CX - 140, CY - 58)], soft=0.8), hexc('#c23b2e'), 0.85, edge=0.2)  # 작은 깃발
p.glaze(p.mirror(hm + cab * 0.5, CY + 14, soft=5, breakup=0.5), hexc('#3a4868'), 0.4, edge=0.1)
p.lift(p.band([(CX + 200, CY - 4), (CX + 420, CY + 2)], 3, soft=2) + p.band([(CX + 200, CY + 6), (CX + 380, CY + 20)], 2, soft=2), 0.6)  # 배 뒤 물살
p.stage('boat')

# ---- 앞쪽: 왼쪽 아래 돌 강둑과 가로등, 오른쪽 위에서 늘어진 플라타너스 가지
quay = [(0, 1080), (0, 860), (300, 880), (620, 960), (800, 1080)]
qm = p.shape(quay, soft=3, ragged=0.3)
p.glaze(qm, hexc('#d8bf92'), 0.55, edge=0.5, gran=0.6, bloom=1)
p.glaze(qm * np.clip((p.YY - 900) / 200, 0, 1), hexc('#a98e6a'), 0.35, edge=0.1)
for k in range(5):                                          # 돌 줄눈
    y0 = 900 + k * 34
    p.line([(0, y0), (min(800, 300 + (y0 - 870) * 2.6), y0 + 30)], 1.2, hexc('#8a7558'), 0.35)
for k in range(5):
    y0 = 900 + k * 34
    for x in np.arange(30 + (k % 2) * 45, 760, 90):
        if y0 < 870 + x * 0.25 and x < 800: continue
        if x > 300 + (y0 - 870) * 2.6: continue
        p.line([(x, y0 + x * 0.1 * 0), (x + 4, y0 + 32)], 1.1, hexc('#8a7558'), 0.3)
p.glaze(p.band([(0, 862), (300, 882), (620, 962), (800, 1080)], 10, soft=1.5), hexc('#a8936c'), 0.5, edge=0.2)  # 둑 위 갓돌
LX = 230
p.stroke([(LX, 884), (LX, 640)], 9, hexc('#2f3340'), 0.9, dry=0.15, taper=(0.02, 0.05))
lamp = p.shape([(LX - 20, 640), (LX + 20, 640), (LX + 14, 600), (LX - 14, 600)], soft=1, ragged=0.08)
p.glaze(lamp, hexc('#3a3e4c'), 0.85, edge=0.3)
p.glaze(p.shape([(LX - 24, 602), (LX + 24, 602), (LX, 578)], soft=1), hexc('#2f3340'), 0.9, edge=0.2)
p.glaze(p.shape([(LX - 9, 636), (LX + 9, 636), (LX + 7, 608), (LX - 7, 608)], soft=1), hexc('#f2cf7f'), 0.6, edge=0.2)
for sgn in (-1, 1):                                          # 곡선 팔과 작은 등 두 개
    p.stroke(spline([(LX, 700), (LX + sgn * 30, 690), (LX + sgn * 48, 672)], 8), 3.5, hexc('#2f3340'), 0.85, dry=0.1, taper=(0.1, 0.3))
    gx = LX + sgn * 50
    p.glaze(p.shape([(gx - 9, 672), (gx + 9, 672), (gx + 6, 650), (gx - 6, 650)], soft=1), hexc('#f2cf7f'), 0.55, edge=0.3)
    p.glaze(p.shape([(gx - 11, 652), (gx + 11, 652), (gx, 640)], soft=1), hexc('#2f3340'), 0.85, edge=0.2)
p.stroke([(LX - 12, 884), (LX + 12, 884), (LX + 8, 840), (LX - 8, 840)], 6, hexc('#2f3340'), 0.8, dry=0.1, taper=(0.1, 0.1))
# 플라타너스 가지
for (sx, sy, ex, ey, w) in [(1980, -10, 1600, 210, 14), (1760, 80, 1640, 300, 6), (1980, 160, 1720, 330, 8)]:
    p.stroke(curve((sx, sy), (ex, ey), -40, 16, wig=4, seed=int(sx + sy)), w, hexc('#6b5a45'), 0.8, dry=0.35, taper=(0.05, 0.7))
leaves = p.blobs([(rng.uniform(1560, 1960), rng.uniform(-40, 320), rng.uniform(40, 90), rng.uniform(26, 60)) for _ in range(16)], rough=0.4, soft=4, ragged=0.5)
p.glaze(leaves, hexc('#c7cf6c'), 0.65, edge=0.5, gran=0.45, bloom=2)
p.glaze(leaves * np.clip(blur(leaves, 2) * 1.2, 0, 1) * np.clip((p.YY - 40) / 200, 0.2, 1), hexc('#6e8b4a'), 0.45, edge=0.4, bloom=1)
for _ in range(14):
    x, y = rng.uniform(1580, 1900), rng.uniform(40, 330)
    lm = p.shape(Watercolor.petal_pts(x, y, rng.uniform(0, 6.28), rng.uniform(18, 28), rng.uniform(7, 10)), soft=1, ragged=0.1)
    p.glaze(lm, hexc(rng.choice(['#8fa64f', '#b9c35a', '#6e8b4a'])), 0.75, edge=0.5)
# 갈매기 몇 마리
for (bx, by, s) in [(980, 230, 16), (1040, 205, 12), (1090, 250, 10)]:
    p.line([(bx - s, by), (bx - s * 0.4, by - s * 0.45), (bx, by)], 1.8, hexc('#5b5a66'), 0.7)
    p.line([(bx, by), (bx + s * 0.4, by - s * 0.45), (bx + s, by)], 1.8, hexc('#5b5a66'), 0.7)
p.splatter(hexc('#e2b06a'), 18, box=(500, 120, 1300, 520), size=(1.2, 3), strength=0.4)

p.save(out, stages_dir=stages)
print('saved', out)
