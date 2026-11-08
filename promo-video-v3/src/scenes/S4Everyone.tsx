// S4 의정부시민 누구나 — radial-wave 적응판.
// 원본: demos/ui-entrance/radial-wave/RadialWave.tsx
// 그대로 둔 것: 점마다 정규화 거리 dist, 1파 seg(t, dist·0.35, +0.18, outCubic) + scale w1·(1+0.5·sin(w1π)),
//   2파는 바깥부터 거꾸로 모이는 순수 펄스(scale +0.8, 불투명도 +0.25), pulse2>0.3에서 강조색으로 딱 바뀌고 빛남,
//   상시 바닥 불투명도 0.25.
// 바꾼 것: 세로 9×15 격자, 어두운 남색 → 브랜드 그린 바탕(밝은 바탕에선 펄스가 안 보여서), 2파 시작 0.55로 당겨
//   마지막 프레임이 깨끗하게 끝나게 함(카드의 '알려진 함정' 처리), 위·아래 문구 띠.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { E, seg } from '../lib/Motion';
import { Grain } from '../lib/Polish';
import { TextReveal } from '../lib/Look';
import { C, FONT, alpha } from '../theme';

const COLS = 9, ROWS = 15;
const CX = (COLS - 1) / 2, CY = (ROWS - 1) / 2 + 1; // 문구 아래쪽(화면 중앙 약간 아래)에서 파도 시작
const MAX_D = Math.max(...Array.from({ length: ROWS * COLS }, (_, i) => Math.hypot((i % COLS) - CX, Math.floor(i / COLS) - CY)));
const DOT = 30;
const DOTS = Array.from({ length: ROWS * COLS }, (_, i) => {
  const r = Math.floor(i / COLS), c = i % COLS;
  return { x: ((c + 0.5) / COLS) * 1080, y: ((r + 0.5) / ROWS) * 1920, dist: Math.hypot(c - CX, r - CY) / MAX_D };
});

export const S4Everyone: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = Math.min(1, frame / (durationInFrames - 1));
  const sub = seg(frame, 46, 62, E.outCubic);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 60% at 50% 58%, #00905A 0%, ${C.greenDeep} 60%, #006B42 100%)`, fontFamily: FONT, overflow: 'hidden' }}>
      {DOTS.map(({ x, y, dist }, i) => {
        const w1 = seg(t, dist * 0.35, dist * 0.35 + 0.18, E.outCubic);
        const w2 = seg(t, 0.55 + (1 - dist) * 0.25, 0.55 + (1 - dist) * 0.25 + 0.15);
        const pulse2 = Math.sin(w2 * Math.PI);
        const s = w1 * (1 + 0.5 * Math.sin(w1 * Math.PI)) + pulse2 * 0.8;
        const hot = pulse2 > 0.3;
        return (
          <div key={i} style={{
            position: 'absolute', left: x - DOT / 2, top: y - DOT / 2, width: DOT, height: DOT, borderRadius: '50%',
            background: hot ? C.yellow : '#9BEBC4', transform: `scale(${s})`,
            opacity: 0.25 + w1 * 0.5 + pulse2 * 0.25,
            boxShadow: hot ? `0 0 28px ${alpha(C.yellow, 0.9)}` : 'none',
          }} />
        );
      })}
      {/* 문구 띠: 점 위에서도 글자가 읽히도록 위·아래만 어둡게 */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${alpha('#00321F', 0.82)} 0%, ${alpha('#00321F', 0.6)} 30%, ${alpha('#00321F', 0)} 44%, ${alpha('#00321F', 0)} 70%, ${alpha('#00321F', 0.7)} 84%, ${alpha('#00321F', 0.85)} 100%)` }} />
      <div style={{ position: 'absolute', left: 96, right: 96, top: 250, color: '#FFFFFF' }}>
        <div style={{ fontSize: 100, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          <TextReveal text="의정부시민이라면" start={4} each={18} by="char" gap={1.6} />
        </div>
        <div style={{ fontSize: 210, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.05, color: C.yellow, marginTop: 6 }}>
          <TextReveal text="누구나" start={16} each={20} by="char" gap={3} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 96, right: 96, top: 1530, color: '#FFFFFF', opacity: sub, transform: `translateY(${(1 - sub) * 24}px)` }}>
        <div style={{ fontSize: 60, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.35 }}>복잡한 조건 없이,<br />가입 한 번이면 끝.</div>
      </div>
      <Grain opacity={0.06} blend="soft-light" />
    </AbsoluteFill>
  );
};
