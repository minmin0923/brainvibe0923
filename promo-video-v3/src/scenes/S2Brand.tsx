// S2 브랜드 — brand-ink-open 적응판.
// 원본: demos/typography/brand-ink-open/BrandInkOpen.tsx
// 그대로 둔 것: 십자 조준선 세로 0→9f / 가로 8→18f 그린 뒤 24→34f 사라짐, 글자 i 지연 10+i·3, 12f,
//   scale 1.6→1(origin center bottom) + blur 6→0, 글자 밑 강조색 glint, 부제 타자 0.7f/글자 + 블록 커서,
//   완성 후 1초 이상 정지, 7f 상승+축소+페이드 퇴장.
// 바꾼 것: 세리프 → Pretendard 800(DESIGN 기준, 세리프 금지), 호박색 → 브랜드 그린/옐로, 조준선을 지도 조준 원과 함께.
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { Grain } from '../lib/Polish';
import { C, FONT } from '../theme';

const WORDMARK = '의정부혜택지도';
const KICKER = '의정부 동네 혜택을 지도 한 장에';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const EXIT = 97;

export const S2Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const vDraw = interpolate(frame, [0, 9], [100, 0], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const hDraw = interpolate(frame, [8, 18], [100, 0], { ...clamp, easing: Easing.linear });
  const crossFade = interpolate(frame, [24, 34], [1, 0], clamp);

  const perChar = 0.7;
  const kickStart = 30;
  const kickChars = Math.floor(Math.max(0, frame - kickStart) / perChar);
  const kickDone = kickStart + KICKER.length * perChar;
  const cursorOn = frame >= kickStart && (frame < kickDone || (frame <= 90 && Math.floor((frame - kickDone) / 2) % 2 === 0));

  const out = interpolate(frame, [EXIT, EXIT + 7], [0, 1], { ...clamp, easing: Easing.bezier(0.4, 0, 0.5, 1) });

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', fontFamily: FONT }}>
      <div style={{ textAlign: 'center', opacity: 1 - out, transform: `translateY(${-out * 40}px) scale(${1 - out * 0.12})` }}>
        <svg width={120} height={120} viewBox="0 0 120 120" style={{ display: 'block', margin: '0 auto 48px', opacity: crossFade }}>
          <line x1={60} y1={4} x2={60} y2={116} stroke={C.green} strokeWidth={7} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={vDraw} />
          <line x1={4} y1={60} x2={116} y2={60} stroke={C.green} strokeWidth={7} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={hDraw} />
        </svg>
        <div style={{ fontSize: 128, fontWeight: 800, color: C.ink, letterSpacing: '-0.04em', lineHeight: 1, whiteSpace: 'pre', display: 'inline-flex', alignItems: 'flex-end' }}>
          {WORDMARK.split('').map((ch, i) => {
            const delay = 10 + i * 3;
            const t = interpolate(frame, [delay, delay + 12], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0.7, 0.25, 1) });
            const g = interpolate(frame, [delay + 8, delay + 12, delay + 16], [0, 1, 0], clamp);
            return (
              <span key={i} style={{ position: 'relative', display: 'inline-block', opacity: t, transform: `scale(${1.6 - 0.6 * t})`, transformOrigin: 'center bottom', filter: `blur(${(1 - t) * 6}px)` }}>
                {ch}
                <span style={{ position: 'absolute', left: '50%', bottom: -10, transform: 'translateX(-50%)', width: `${g * 100}%`, height: 6, background: C.yellow, opacity: g, borderRadius: 3 }} />
              </span>
            );
          })}
        </div>
        <div style={{ fontSize: 48, fontWeight: 600, letterSpacing: '-0.01em', color: C.muted, marginTop: 40, height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ whiteSpace: 'pre' }}>{KICKER.slice(0, kickChars)}</span>
          <span style={{ display: 'inline-block', width: 20, height: 50, marginLeft: 6, background: C.yellow, opacity: cursorOn ? 0.95 : 0 }} />
        </div>
      </div>
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};
