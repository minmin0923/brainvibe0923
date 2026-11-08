// S3 가입 하나면 모든 혜택 — icon-field-colorize 적응판.
// 원본: demos/opening/icon-field-colorize/IconFieldColorize.tsx
// 그대로 둔 것: 꺼진 키캡이 중심에서 바깥으로 10묶음 엇갈려 떠오름(0.6→1.06→1 과충 + 10px 상승),
//   정지 한 박 + 마지막 구간 12% 어둡게 숨 들이쉬기, 4줄 색 파도(행 차 1.4f + 열 0.25f + ≤1.5f 흔들림),
//   키캡 하나당 4f 동안 위에서 아래로 clip 채움 + 1.22배 pop + 채운 뒤 5f 흰 번쩍임, 행 뒤 빛 번짐,
//   가운데 어둠막 + 두 줄 제목 상승, 전체 4% 천천히 확대. 파도는 같은 색 계열(무지개 금지).
// 바꾼 것: 세로 8×14 격자, 업종 아이콘(카페·음식점·미용·옷·가게…), 색 파도 = 옐로 → 라임 → 그린 → 브랜드 그린,
//   어두운 바탕은 브랜드 잉크색. 시간표를 150f에 맞게 압축.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE, Grain, Vignette, mix, ramp } from '../lib/Polish';
import { TextReveal } from '../lib/Look';
import { C, FONT, alpha } from '../theme';

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 업종 아이콘(24 viewBox, 채움). 알아볼 수 있는 실루엣이 목표.
export type Shape = (c: string, k: string) => React.ReactNode;
export const SHAPES: Shape[] = [
  // 커피잔
  (c) => <><path fill={c} d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path fill={c} d="M16 9.5h1.6a2.9 2.9 0 0 1 0 5.8H16v-1.8h1.6a1.1 1.1 0 0 0 0-2.2H16z" /><rect fill={c} x="3" y="20" width="14" height="1.8" rx=".9" /><path fill={c} d="M8 2.5c1 1-1 2 0 3.5h-1.6C5.6 4.6 7.4 3.7 6.6 2.5zM12 2.5c1 1-1 2 0 3.5h-1.6c-.8-1.4 1-2.3.2-3.5z" /></>,
  // 포크·나이프
  (c) => <><path fill={c} d="M6 2h1.4v5h1V2h1.4v5h1V2h1.4v6.5a2.8 2.8 0 0 1-2.2 2.7V22H8.2V11.2A2.8 2.8 0 0 1 6 8.5z" /><path fill={c} d="M16 2c2 1.2 3 3.6 3 6.5V13h-1.8v9H15.2V2.6z" /></>,
  // 가위
  (c, k) => <><circle fill={c} cx="6.5" cy="17.5" r="3.6" /><circle fill={c} cx="17.5" cy="17.5" r="3.6" /><circle fill={k} cx="6.5" cy="17.5" r="1.7" /><circle fill={k} cx="17.5" cy="17.5" r="1.7" /><path fill={c} d="M8.6 14.6 17.8 2.4l1.4 1-8.4 12.6zM15.4 14.6 6.2 2.4l-1.4 1 8.4 12.6z" /></>,
  // 티셔츠
  (c) => <path fill={c} d="M8.5 3 3 5.8l1.8 4.6 2.4-1V21h9.6V9.4l2.4 1L21 5.8 15.5 3a3.6 3.6 0 0 1-7 0z" />,
  // 가게
  (c, k) => <><path fill={c} d="M3 4h18l1.2 5.2a2.6 2.6 0 0 1-4.8 1.4 2.6 2.6 0 0 1-4.7 0 2.6 2.6 0 0 1-4.7 0A2.6 2.6 0 0 1 1.8 9.2z" /><path fill={c} d="M4 12.6h16V21H4z" /><rect fill={k} x="9.5" y="15" width="5" height="6" /></>,
  // 쇼핑백
  (c, k) => <><path fill={c} d="M4.5 7.5h15l-1 14h-13z" /><path fill="none" stroke={k} strokeWidth="1.7" d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" /></>,
  // 선물
  (c, k) => <><rect fill={c} x="3" y="8" width="18" height="4" rx="1" /><rect fill={c} x="5" y="12" width="14" height="9" rx="1" /><rect fill={k} x="10.9" y="8" width="2.2" height="13" /><path fill={c} d="M12 8C10 4 6.5 4 7 6.5S12 8 12 8zm0 0c2-4 5.5-4 5-1.5S12 8 12 8z" /></>,
  // 하트
  (c) => <path fill={c} d="M12 21s-7.5-4.7-9.6-9C.9 8.7 2.7 5 6.2 5c2 0 3.3 1 4 2.1h3.6C14.5 6 15.8 5 17.8 5c3.5 0 5.3 3.7 3.8 7-2.1 4.3-9.6 9-9.6 9z" transform="scale(0.92) translate(1,0)" />,
  // 별
  (c) => <path fill={c} d="M12 2l2.7 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16.2 6.1 19.8l1.6-6.6L2.5 8.8l6.8-.5z" />,
  // 할인 태그
  (c, k) => <><path fill={c} d="M3 3h8.5l9.5 9.5-8.5 8.5L3 11.5z" /><circle fill={k} cx="7.5" cy="7.5" r="1.8" /></>,
  // 지도 핀
  (c) => <path fill={c} d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" transform="scale(0.9) translate(1.2,0.5)" />,
  // 집
  (c) => <path fill={c} d="M3.5 10L12 3l8.5 7V21h-6v-6h-5v6h-6z" />,
  // 책
  (c, k) => <><path fill={c} d="M4 3.5h11a3 3 0 0 1 3 3V21H7a3 3 0 0 1-3-3z" /><rect fill={k} x="6.5" y="16" width="11.5" height="2" /></>,
  // 아령
  (c) => <><rect fill={c} x="1.5" y="8" width="3" height="8" rx="1" /><rect fill={c} x="4.5" y="6" width="3" height="12" rx="1" /><rect fill={c} x="19.5" y="8" width="3" height="8" rx="1" /><rect fill={c} x="16.5" y="6" width="3" height="12" rx="1" /><rect fill={c} x="7.5" y="10.8" width="9" height="2.4" /></>,
  // 약국 십자
  (c) => <path fill={c} d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />,
  // 자동차
  (c, k) => <><path fill={c} d="M5 10l2-5h10l2 5h1.5a1.5 1.5 0 0 1 1.5 1.5V17h-2v2.5h-3V17H7v2.5H4V17H2v-5.5A1.5 1.5 0 0 1 3.5 10z" /><circle fill={k} cx="6.5" cy="13.5" r="1.5" /><circle fill={k} cx="17.5" cy="13.5" r="1.5" /></>,
];

const COLS = 8, ROWS = 14;
const CELL_X = 128, CELL_Y = 128;
const TILE = 96, GLYPH = 50;
const X0 = (1080 - ((COLS - 1) * CELL_X + CELL_X / 2 + TILE)) / 2;
const Y0 = (1920 - ((ROWS - 1) * CELL_Y + TILE)) / 2;
const GRAYS = ['#4f6157', '#5c6e64', '#45564d'];
type RGB = [number, number, number];
// 같은 색 계열 4줄: 옐로 → 라임 → 연그린 → 브랜드 그린 (뒤 파도가 더 아래 행을 덮음)
const WAVES: { color: RGB; fromRow: number; start: number }[] = [
  { color: [255, 212, 59], fromRow: 0, start: 58 },
  { color: [188, 224, 82], fromRow: 4, start: 63 },
  { color: [84, 204, 132], fromRow: 7, start: 68 },
  { color: [0, 168, 107], fromRow: 10, start: 73 },
];
const shade = (c: RGB, k: number): RGB => c.map((v) => Math.round(Math.max(0, Math.min(255, v + k * 255)))) as RGB;
const css = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const FLIP = 4;
const TITLE = 94;

const rnd = mulberry32(20261108);
const ICONS = Array.from({ length: ROWS * COLS }, (_, idx) => {
  const r = Math.floor(idx / COLS);
  const c = idx % COLS;
  const r1 = rnd(), r2 = rnd(), r3 = rnd();
  const x = X0 + c * CELL_X + (r % 2) * (CELL_X / 2);
  const y = Y0 + r * CELL_Y;
  const d = Math.hypot(x + TILE / 2 - 540, y + TILE / 2 - 960) / Math.hypot(540, 960);
  const batch = Math.min(9, Math.floor((d * 0.75 + r1 * 0.35) * 10));
  return {
    r, c, x, y,
    t0: 2 + batch * 3.6 + r2 * 3,
    gray: GRAYS[Math.floor(r2 * GRAYS.length)],
    jit: (r1 - 0.5) * 0.08,
    shape: SHAPES[(idx * 7 + Math.floor(r3 * 3)) % SHAPES.length],
    arrive: WAVES.filter((w) => r >= w.fromRow).map((w) => ({ w, at: w.start + (r - w.fromRow) * 1.4 + c * 0.25 + r3 * 1.5 })),
  };
});

const Key: React.FC<{ shape: Shape; gray: string; tint: RGB | null; glowK?: number }> = ({ shape, gray, tint, glowK = 1 }) => {
  const lit = tint !== null;
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 24,
      background: lit ? `linear-gradient(180deg, ${css(shade(tint, 0.08))} 0%, ${css(tint)} 55%, ${css(shade(tint, -0.08))} 100%)` : 'linear-gradient(180deg, #1d2c24 0%, #15211b 100%)',
      boxShadow: lit
        ? `inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -3px 0 ${css(shade(tint, -0.2), 0.5)}, 0 0 ${(30 * glowK).toFixed(1)}px ${css(tint, 0.42 * glowK)}, 0 12px 26px -10px ${css(shade(tint, -0.3), 0.6)}`
        : 'inset 0 1px 0 rgba(210,255,230,0.07), inset 0 0 0 1px rgba(190,240,215,0.06), 0 8px 16px -8px rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox="0 0 24 24" width={GLYPH} height={GLYPH} style={{ display: 'block' }}>
        {shape(lit ? alpha(C.ink, 0.86) : gray, lit ? css(tint) : '#17231d')}
      </svg>
    </div>
  );
};

export const S3Unlock: React.FC = () => {
  const frame = useCurrentFrame();
  const inhale = ramp(frame, 50, 8, EASE.smooth) * (1 - ramp(frame, 58, 8, EASE.out));
  const rowLit = new Array(ROWS).fill(0);
  const rowColor: (RGB | null)[] = new Array(ROWS).fill(null);

  const icons = ICONS.map((ic) => {
    const op = ramp(frame, ic.t0, 7, EASE.out);
    if (op <= 0) return null;
    const appearScale = mix(0.6, 1, ramp(frame, ic.t0, 13, EASE.overshoot));
    const lift = (1 - ramp(frame, ic.t0, 13, EASE.snappy)) * 10;
    let prev: RGB | null = null, cur: RGB | null = null, p = 0, since = -1;
    for (const a of ic.arrive) {
      const q = Math.min(1, Math.max(0, (frame - a.at) / FLIP));
      if (q > 0) { prev = cur; cur = shade(a.w.color, ic.jit); p = q; since = frame - a.at; }
    }
    if (cur) { rowLit[ic.r] += 1 / COLS; rowColor[ic.r] = cur; }
    const flipping = p > 0 && p < 1;
    const pop = flipping ? 1 + Math.sin(p * Math.PI) * 0.22 : 1;
    const flash = since >= FLIP ? Math.max(0, 1 - (since - FLIP) / 5) : 0;
    const glowK = since >= 0 ? 1 + 1.2 * Math.max(0, 1 - since / 12) : 1;
    return (
      <div key={`${ic.r}-${ic.c}`} style={{ position: 'absolute', left: ic.x, top: ic.y + lift, width: TILE, height: TILE, opacity: op, transform: `scale(${(appearScale * pop).toFixed(4)})` }}>
        <Key shape={ic.shape} gray={ic.gray} tint={flipping ? prev : cur} glowK={glowK} />
        {flipping && (
          <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 ${((1 - EASE.out(p)) * 100).toFixed(2)}% 0 round 24px)` }}>
            <Key shape={ic.shape} gray={ic.gray} tint={cur} glowK={glowK} />
          </div>
        )}
        {flash > 0 && <div style={{ position: 'absolute', inset: 0, borderRadius: 24, mixBlendMode: 'screen', background: `rgba(246,255,236,${(0.45 * flash).toFixed(3)})` }} />}
      </div>
    );
  });

  const push = 1 + 0.04 * ramp(frame, 0, 150, EASE.smooth);
  const veil = ramp(frame, TITLE - 4, 20, EASE.out);
  const litAll = ramp(frame, 58, 30, EASE.out);
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: 'hidden', fontFamily: FONT }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${alpha('#9fe8c4', 0.10 + 0.12 * litAll)} 0%, rgba(0,0,0,0) 70%), linear-gradient(180deg, #14231b 0%, ${C.ink} 60%, #08110c 100%)` }} />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        {rowColor.map((c, r) => c && (
          <div key={r} style={{
            position: 'absolute', left: -100, right: -100, top: Y0 + r * CELL_Y + TILE / 2 - CELL_Y * 1.1, height: CELL_Y * 2.2,
            background: `linear-gradient(180deg, ${css(c, 0)} 0%, ${css(c, 0.16 * rowLit[r])} 50%, ${css(c, 0)} 100%)`,
          }} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${push})`, opacity: 1 - 0.12 * inhale }}>{icons}</AbsoluteFill>
      <Vignette strength={0.55} inner={0.45} color="#000000" />
      <AbsoluteFill style={{ opacity: veil, background: `radial-gradient(ellipse 62% 30% at 50% 50%, ${alpha('#06100b', 0.92)} 0%, ${alpha('#06100b', 0.8)} 50%, ${alpha('#06100b', 0)} 100%)` }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, color: '#FFFFFF' }}>
          <TextReveal text="가입 하나면" start={TITLE} each={20} gap={5} />
        </div>
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, color: C.yellow, marginTop: 8 }}>
          <TextReveal text="모든 혜택, 그냥" start={TITLE + 8} each={20} gap={5} />
        </div>
      </AbsoluteFill>
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
