// S6 계속 커지는 중 — crane-rise-reveal 적응판.
// 원본: demos/opening/crane-rise-reveal/CraneRiseReveal.tsx
// 그대로 둔 것: transform-origin 좌상단 + translate = 화면 중심 − 조준점×scale, 조준점과 scale이 같은
//   bezier(0.2,0,0.25,1) 진행값 하나를 공유(카메라 한 번의 움직임), 3.0배 클로즈업 hold 중 1.5% 숨 들이쉬기,
//   클로즈업 동안 추적 대상만 선명하고 나머지는 38%로 눌렀다가 출발 후 26f에 복귀, 보이는 영역 가장자리가
//   요소를 처음 넘는 프레임에 그 요소가 반응(프레임별로 미리 계산해 카메라와 정확히 동기),
//   빠른 앞부분만 CameraMotionBlur, 안착 후 추적 카드의 상태가 바뀌는 작은 사건 하나(spring damping 16).
// 바꾼 것: 데이터 표 → 도시 지도와 가맹점 핀, 행 세척광 → 핀이 화면에 들어올 때 톡 튀어나옴,
//   추적 행 → "새로 합류한 가게" 카드(합류 예정 → 합류 완료), 120f로 압축(이동 80f), 위쪽 고정 제목.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { EASE, Grain, bezier, mix, ramp, softShadow } from '../lib/Polish';
import { springAt, TextReveal } from '../lib/Look';
import { C, FONT, alpha } from '../theme';
import { SHAPES } from './S3Unlock';

const HOLD = 14;
const MOVE_END = 76;
const BLUR_END = 36;
const FLIP = 80;
const crane = bezier(0.2, 0, 0.25, 1);

const PLATE = { x: 48, y: 600, w: 984, h: 1240 };
const CARD = { x: 500, y: 1270, w: 480, h: 160 }; // 추적 대상: 새로 합류한 가게
const F0 = { x: CARD.x + CARD.w / 2, y: CARD.y + CARD.h / 2 };
const F1 = { x: 600, y: 1130 };
const S0 = 3.0;
const S1 = 1.3; // 크레인 끝 배율: 카드 글자가 휴대폰에서도 읽히도록 1.0까지 빼지 않음

const camAt = (frame: number) => {
  const breath = ramp(frame, 0, HOLD, EASE.smooth);
  const e = crane(Math.min(1, Math.max(0, (frame - HOLD) / (MOVE_END - HOLD))));
  const s0 = S0 * (1 + 0.015 * breath);
  const s = mix(s0, S1, e);
  const fx = mix(F0.x, F1.x, e);
  const fy = mix(F0.y, F1.y, e);
  return { s, e, tx: 540 - fx * s, ty: 960 - fy * s, fx, fy };
};

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry32(8030);
const SHAPE_SET = [0, 1, 2, 3, 4, 5, 13, 14, 12, 7];
const PINS: { x: number; y: number; shape: number; trig: number; isNew: boolean }[] = [];
for (let i = 0; PINS.length < 64 && i < 2000; i++) {
  const x = PLATE.x + 60 + rnd() * (PLATE.w - 120);
  const y = PLATE.y + 60 + rnd() * (PLATE.h - 120);
  const shape = SHAPE_SET[Math.floor(rnd() * SHAPE_SET.length)];
  if (x > CARD.x - 70 && x < CARD.x + CARD.w + 70 && y > CARD.y - 90 && y < CARD.y + CARD.h + 60) continue;
  if (PINS.some((p) => Math.hypot(p.x - x, p.y - y) < 104)) continue;
  // 보이는 영역 가장자리가 이 핀을 처음 넘는 프레임(카메라와 프레임 단위로 동기)
  let trig = -1;
  const inside = (f: number) => { const c = camAt(f); return Math.abs(x - c.fx) < 540 / c.s - 20 && Math.abs(y - c.fy) < 960 / c.s - 20; };
  if (!inside(HOLD)) { trig = MOVE_END; for (let f = HOLD; f <= MOVE_END; f++) if (inside(f)) { trig = f; break; } }
  PINS.push({ x, y, shape, trig, isNew: false });
}
// 마지막에 화면에 들어오는 핀 몇 개에 NEW 배지
[...PINS].sort((a, b) => b.trig - a.trig).slice(0, 5).forEach((p) => { p.isNew = true; });

const Glyph: React.FC<{ shape: number; size: number; color: string; knock: string }> = ({ shape, size, color, knock }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>{SHAPES[shape](color, knock)}</svg>
);

const World: React.FC<{ frame: number }> = ({ frame }) => {
  const cam = camAt(frame);
  const focus = mix(0.38, 1, ramp(frame, HOLD, 26, EASE.out));
  const flip = springAt(frame, FLIP, { damping: 16, stiffness: 190 });
  const done = frame >= FLIP + 2;
  const check = ramp(frame, FLIP + 4, 10, EASE.out);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${cam.tx.toFixed(2)}px, ${cam.ty.toFixed(2)}px) scale(${cam.s.toFixed(5)})` }}>
      <div style={{ position: 'absolute', left: PLATE.x, top: PLATE.y, width: PLATE.w, height: PLATE.h, borderRadius: 44, background: C.map, border: `2px solid ${C.line}`, overflow: 'hidden', boxShadow: softShadow(12, { color: '#0e1a14' }) }}>
        <svg width={PLATE.w} height={PLATE.h} style={{ position: 'absolute', inset: 0, opacity: focus }}>
          <path d="M 700 -20 C 600 260, 820 520, 660 800 S 560 1100, 620 1260" fill="none" stroke={C.river} strokeWidth={70} strokeLinecap="round" />
          {['M -20 260 L 1004 200', 'M -20 600 L 1004 540', 'M -20 940 L 1004 900', 'M 250 -20 L 290 1260', 'M 520 -20 L 540 1260', 'M 790 -20 L 770 1260', 'M 0 80 L 984 1180'].map((d) => (
            <path key={d} d={d} fill="none" stroke="#FFFFFF" strokeWidth={22} strokeLinecap="round" />
          ))}
        </svg>
      </div>
      {PINS.map((p, i) => {
        const pp = p.trig < 0 ? 1 : ramp(frame, p.trig, 10, EASE.linear);
        const s = p.trig < 0 ? 1 : pp > 0 ? EASE.overshoot(pp) : 0;
        const badge = p.isNew ? ramp(frame, Math.max(p.trig, 0) + 6, 10, EASE.linear) : 0;
        return (
          <div key={i} style={{ position: 'absolute', left: p.x - 46, top: p.y - 46, width: 92, height: 92, opacity: (p.trig < 0 ? focus : 1) * Math.min(1, pp * 3), transform: `scale(${s.toFixed(4)})` }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.card, border: `5px solid ${C.green}`, display: 'grid', placeItems: 'center', boxShadow: softShadow(5, { color: '#0e1a14' }) }}>
              <Glyph shape={p.shape} size={46} color={C.green} knock={C.card} />
            </div>
            {badge > 0 && (
              <div style={{ position: 'absolute', left: 50, top: -30, height: 44, padding: '0 14px', borderRadius: 999, background: C.yellow, color: C.ink, fontFamily: FONT, fontWeight: 800, fontSize: 26, lineHeight: '44px', letterSpacing: '0.02em', transformOrigin: '0 100%', transform: `scale(${EASE.overshoot(badge).toFixed(4)})` }}>NEW</div>
            )}
          </div>
        );
      })}
      {/* 추적 대상 카드 */}
      <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 28, background: C.card, border: `2px solid ${C.line}`, boxShadow: softShadow(mix(18, 8, cam.e), { color: '#0e1a14' }), display: 'flex', alignItems: 'center', gap: 18, padding: '0 22px', fontFamily: FONT }}>
        <div style={{ width: 104, height: 104, borderRadius: 26, background: C.green, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Glyph shape={4} size={62} color="#FFFFFF" knock={C.green} />
        </div>
        <div>
          <div style={{ fontSize: 46, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.15 }}>새 가맹점</div>
          <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, height: 50, padding: '0 18px', borderRadius: 25, background: done ? alpha(C.green, 0.14) : alpha(C.yellow, 0.35), transform: `scale(${frame >= FLIP ? 0.86 + 0.14 * flip : 1})`, transformOrigin: '0 50%' }}>
            {done ? (
              <svg width={30} height={30} viewBox="0 0 14 14"><path d="M2.5 7.4 L5.6 10.2 L11.5 3.8" fill="none" stroke={C.greenInk} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - check} /></svg>
            ) : (
              <div style={{ width: 12, height: 12, borderRadius: 6, background: '#9A7A00' }} />
            )}
            <span style={{ fontSize: 36, fontWeight: 800, color: done ? C.greenInk : '#6B5500' }}>{done ? '합류 완료' : '합류 예정'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const S6Grow: React.FC = () => {
  const frame = useCurrentFrame();
  const fast = frame >= HOLD && frame < BLUR_END;
  const title = ramp(frame, 22, 16, EASE.out);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden', fontFamily: FONT }}>
      {fast ? (
        <CameraMotionBlur shutterAngle={180} samples={6}>
          <AbsoluteFill><WorldAt /></AbsoluteFill>
        </CameraMotionBlur>
      ) : (
        <World frame={frame} />
      )}
      {/* 위쪽 고정 제목(화면 좌표). 지도가 올라오는 동안 읽힌다 */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${alpha(C.bg, 0.96)} 0%, ${alpha(C.bg, 0.9)} 24%, ${alpha(C.bg, 0)} 33%)`, opacity: title }} />
      <div style={{ position: 'absolute', left: 96, right: 96, top: 250 }}>
        <div style={{ fontSize: 100, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.12, color: C.ink }}>
          <TextReveal text="혜택지도는" start={22} each={18} gap={4} />
        </div>
        <div style={{ fontSize: 112, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.12, color: C.ink, marginTop: 4, position: 'relative', display: 'inline-block' }}>
          <span style={{ position: 'absolute', left: -8, right: -8, bottom: 14, height: 44, background: C.yellow, transformOrigin: '0 50%', transform: `scaleX(${ramp(frame, 48, 10, EASE.out).toFixed(4)})`, borderRadius: 6 }} />
          <span style={{ position: 'relative' }}><TextReveal text="계속 커지는 중" start={30} each={18} gap={4} /></span>
        </div>
      </div>
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};

// CameraMotionBlur는 자식이 useCurrentFrame()으로 프레임을 읽어야 샘플마다 다른 장면을 그린다
const WorldAt: React.FC = () => {
  const frame = useCurrentFrame();
  return <World frame={frame} />;
};
