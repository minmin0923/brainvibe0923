// S5 지도에서 한눈에 — pill-slot-cycle 적응판 + 업종별 지도 핀.
// 원본: demos/typography/pill-slot-cycle/PillSlotCycle.tsx
// 그대로 둔 것: 줄기 문구는 왼쪽 끝 고정(flex 가운데 정렬 금지), 한 박 21f 중 앞 8f에 교체, 새 알약은 아래 +120에서
//   snappy로 들어오며 rotateX -38°→0, 0.94→1, 속도 기반 세로 블러(≤14), 옛 알약은 -130으로 exit 가속 + 0→34°,
//   보이지 않는 자리 알약으로 칸 폭 유지, 마무리는 마지막 알약 7f 퇴장 후 결론 문구 back(1.4) 과충 14f,
//   결론 문구는 줄기와 같은 크기·굵기, 마무리 후 45f 안팎 정지.
// 바꾼 것: 세로 화면이라 줄기(1줄)와 칸(2줄)을 두 줄로, 결론 후 가운데 이동 생략(왼쪽 정렬 유지),
//   알약이 바뀔 때마다 아래 지도에 그 업종 핀이 뜸(무엇을 찾는지 눈으로 보이게).
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { EASE, Grain, innerHighlight, mix, ramp, softShadow } from '../lib/Polish';
import { C, FONT, alpha } from '../theme';
import { SHAPES } from './S3Unlock';

const PILLS = [
  { label: '카페', shape: 0 },
  { label: '음식점', shape: 1 },
  { label: '미용실', shape: 2 },
  { label: '생활 서비스', shape: 4 },
];
const STEM = '지도에서 찾는';
const FINAL = '내 주변 가맹점.';
const BEAT = 20, INTRO = 8, SWAP = 8, FIN = 14; // 결론 문구 정지 48f(카드 기준 ≥45f)
const CYCLES = PILLS.length;
const CYCLE_END = INTRO + CYCLES * BEAT; // 88
const LEFT = 96;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const stemStyle: React.CSSProperties = { fontFamily: FONT, fontWeight: 800, fontSize: 108, color: C.ink, letterSpacing: '-0.04em', whiteSpace: 'nowrap', lineHeight: 1.15 };

const Glyph: React.FC<{ shape: number; size: number; color: string; knock: string }> = ({ shape, size, color, knock }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>{SHAPES[shape](color, knock)}</svg>
);

const Pill: React.FC<{ label: string; shape: number; lift?: number; style?: React.CSSProperties }> = ({ label, shape, lift = 0, style }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 22, padding: '16px 44px 16px 18px', borderRadius: 999,
    background: 'linear-gradient(180deg, #ffffff 0%, #fafcfb 100%)', border: `2px solid ${alpha(C.ink, 0.08)}`,
    boxShadow: `${innerHighlight(0.95)}, ${softShadow(6 + lift * 30, { color: '#0e1a14' })}`,
    fontFamily: FONT, fontWeight: 800, fontSize: 88, letterSpacing: '-0.035em', color: C.greenInk, whiteSpace: 'nowrap', ...style,
  }}>
    <span style={{ width: 96, height: 96, borderRadius: 28, background: alpha(C.green, 0.14), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Glyph shape={shape} size={58} color={C.green} knock="#E5F6EE" />
    </span>
    {label}
  </div>
);

const VBlur: React.FC<{ id: string; std: number }> = ({ id, std }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
    <filter id={id} x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation={`0 ${std.toFixed(2)}`} /></filter>
  </svg>
);
const inYAt = (bf: number) => mix(120, 0, ramp(bf, 0, SWAP, EASE.snappy));
const outYAt = (bf: number) => mix(0, -130, ramp(bf, 0, SWAP - 1, EASE.exit));

// 지도 카드(가로 936 × 세로 900) 안의 업종별 가맹점 위치
const MAP = { x: 72, y: 740, w: 936, h: 900 };
const SPOTS: [number, number][][] = [
  [[150, 190], [560, 130], [730, 690], [330, 760]],
  [[330, 520], [120, 700], [790, 330], [520, 820]],
  [[610, 470], [270, 230], [170, 450], [800, 560]],
  [[800, 120], [430, 690], [620, 260], [120, 120]],
];

export const S5Map: React.FC = () => {
  const frame = useCurrentFrame();
  const stemT = ramp(frame, 0, INTRO, EASE.out);
  const rel = frame - INTRO;
  const idx = Math.max(0, Math.min(Math.floor(rel / BEAT), CYCLES - 1));
  const beatFrame = rel - idx * BEAT;
  const isFinale = frame >= CYCLE_END;
  const finT = interpolate(frame, [CYCLE_END, CYCLE_END + FIN], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });

  let slot: React.ReactNode = null;
  if (!isFinale && rel >= 0) {
    const incoming = PILLS[idx];
    const outgoing = idx > 0 ? PILLS[idx - 1] : null;
    const inT = ramp(beatFrame, 0, SWAP, EASE.snappy);
    const inBlur = Math.min(14, Math.abs(inYAt(beatFrame + 0.5) - inYAt(beatFrame - 0.5)) * 0.55);
    const outT = ramp(beatFrame, 0, SWAP - 1, EASE.exit);
    const outBlur = Math.min(12, Math.abs(outYAt(beatFrame + 0.5) - outYAt(beatFrame - 0.5)) * 0.45);
    slot = (
      <div style={{ position: 'relative', display: 'inline-block', perspective: 1400 }}>
        <VBlur id="s5-in" std={inBlur} />
        <VBlur id="s5-out" std={outBlur} />
        <Pill label={incoming.label} shape={incoming.shape} style={{ visibility: 'hidden' }} />
        {outgoing && outT < 1 && (
          <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '50% 100%', transform: `translateY(${outYAt(beatFrame).toFixed(2)}px) rotateX(${(34 * outT).toFixed(2)}deg) scale(${mix(1, 0.94, outT).toFixed(4)})`, opacity: 1 - outT, filter: outBlur > 0.3 ? 'url(#s5-out)' : undefined }}>
            <Pill label={outgoing.label} shape={outgoing.shape} lift={outT} />
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '50% 0%', transform: `translateY(${inYAt(beatFrame).toFixed(2)}px) rotateX(${(-38 * (1 - inT)).toFixed(2)}deg) scale(${mix(0.94, 1, inT).toFixed(4)})`, opacity: idx === 0 ? inT : Math.min(1, inT * 1.6), filter: inBlur > 0.3 ? 'url(#s5-in)' : undefined }}>
          <Pill label={incoming.label} shape={incoming.shape} lift={1 - inT} />
        </div>
      </div>
    );
  } else if (isFinale) {
    const lastOutT = ramp(frame, CYCLE_END, 7, EASE.exit);
    const fy = (f: number) => interpolate(f, [CYCLE_END, CYCLE_END + FIN], [90, 0], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
    const finBlur = Math.min(10, Math.abs(fy(frame + 0.5) - fy(frame - 0.5)) * 0.5);
    slot = (
      <div style={{ position: 'relative', display: 'inline-block', perspective: 1400 }}>
        <VBlur id="s5-fin" std={finBlur} />
        <VBlur id="s5-last" std={Math.min(12, lastOutT * 12)} />
        <span style={{ ...stemStyle, display: 'inline-block', opacity: Math.min(1, finT * 1.4), transform: `translateY(${((1 - finT) * 90).toFixed(2)}px)`, filter: finBlur > 0.3 ? 'url(#s5-fin)' : undefined }}>
          내 주변 <span style={{ color: C.greenInk }}>가맹점.</span>
        </span>
        {lastOutT < 1 && (
          <div style={{ position: 'absolute', left: 0, top: -8, transformOrigin: '50% 100%', transform: `translateY(${(-130 * lastOutT).toFixed(2)}px) rotateX(${(34 * lastOutT).toFixed(2)}deg) scale(${mix(1, 0.94, lastOutT).toFixed(4)})`, opacity: 1 - lastOutT, filter: lastOutT > 0.03 ? 'url(#s5-last)' : undefined }}>
            <Pill label={PILLS[CYCLES - 1].label} shape={PILLS[CYCLES - 1].shape} lift={lastOutT} />
          </div>
        )}
      </div>
    );
  }

  // 지도 카드: 줄기와 함께 올라오고, 업종 박자마다 그 업종 핀이 뜸
  const mapIn = ramp(frame, 4, 18, EASE.snappy);
  const active = isFinale ? CYCLES : rel < 0 ? -1 : idx;
  const ring = isFinale ? ramp(frame, CYCLE_END + 6, 24, EASE.out) : -1;

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden', fontFamily: FONT }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 40% at 30% 20%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 72%), radial-gradient(ellipse 60% 40% at 80% 90%, ${alpha(C.green, 0.08)} 0%, ${alpha(C.green, 0)} 72%)` }} />
      {/* 줄기(왼쪽 고정) */}
      <div style={{ position: 'absolute', left: LEFT, top: 250, opacity: stemT, transform: `translateY(${((1 - stemT) * 50).toFixed(2)}px)`, filter: stemT < 0.98 ? `blur(${((1 - stemT) * 6).toFixed(2)}px)` : undefined }}>
        <div style={stemStyle}>{STEM}</div>
      </div>
      {/* 칸(둘째 줄, 왼쪽 고정) */}
      <div style={{ position: 'absolute', left: LEFT - 6, top: 400, opacity: stemT }}>{slot}</div>

      {/* 지도 */}
      <div style={{ position: 'absolute', left: MAP.x, top: MAP.y, width: MAP.w, height: MAP.h, borderRadius: 40, overflow: 'hidden', background: C.map, border: `2px solid ${C.line}`, opacity: mapIn, transform: `translateY(${(1 - mapIn) * 80}px)`, boxShadow: softShadow(10, { color: '#0e1a14' }) }}>
        <svg width={MAP.w} height={MAP.h} style={{ position: 'absolute', inset: 0 }}>
          <path d="M 660 -20 C 580 220, 780 420, 640 620 S 540 820, 580 920" fill="none" stroke={C.river} strokeWidth={60} strokeLinecap="round" />
          {['M -20 300 L 956 240', 'M -20 640 L 956 580', 'M 230 -20 L 270 920', 'M 480 -20 L 500 920', 'M 0 40 L 936 880'].map((d) => (
            <path key={d} d={d} fill="none" stroke="#FFFFFF" strokeWidth={20} strokeLinecap="round" />
          ))}
        </svg>
        {SPOTS.map((group, c) => group.map(([x, y], j) => {
          const a = INTRO + c * BEAT + 3 + j * 3;
          const p = ramp(frame, a, 12, EASE.linear);
          const s = p > 0 ? EASE.overshoot(p) : 0;
          const dim = active > c && !isFinale ? 0.45 : 1;
          return (
            <div key={`${c}-${j}`} style={{ position: 'absolute', left: x - 56, top: y - 56, width: 112, height: 112, borderRadius: '50%', background: C.card, border: `6px solid ${C.green}`, display: 'grid', placeItems: 'center', transform: `scale(${s.toFixed(4)})`, opacity: Math.min(1, p * 3) * dim, boxShadow: softShadow(6, { color: '#0e1a14' }) }}>
              <Glyph shape={PILLS[c].shape} size={58} color={C.green} knock={C.card} />
            </div>
          );
        }))}
        {/* 내 위치 */}
        <div style={{ position: 'absolute', left: 468 - 26, top: 450 - 26, width: 52, height: 52, borderRadius: '50%', background: C.ink, border: '8px solid #fff', boxShadow: softShadow(4) }} />
        {ring >= 0 && ring < 1 && (
          <div style={{ position: 'absolute', left: 468 - 26, top: 450 - 26, width: 52, height: 52, borderRadius: '50%', border: `5px solid ${C.ink}`, transform: `scale(${1 + ring * 5})`, opacity: 1 - ring }} />
        )}
      </div>
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};
