// S7 단체 사진 + CTA — outro-group-photo-launch 적응판.
// 원본: demos/outro/outro-group-photo-launch/OutroGroupPhotoLaunch.tsx
// 그대로 둔 것: 앞 장면의 대표 요소가 cue 4부터 3f 간격으로 12f 동안 사방에서 날아옴(시작 오프셋 ±360–500,
//   FLY_EASE bezier(0.34,1.4,0.44,1)로 진짜 과충), 비행 중 회전 ×2 → 안착 각도(±5° 안), 1.12→1,
//   화면 속도 기반 방향 블러(0.3×, 최대 22), cue+9→16 착지 압축(접촉 그림자 조임 + 1.5% 눌림),
//   단체 사진 층에 크레인(perspective 1400 rotateX 4°→0, scale 1.06→1, 0–40f) 후 0 속도 출발 완만한 확대,
//   2–14f 빛 띠, 42–58f 무대 조명, 워드마크 등장 때 조연 −12% 물러남, 마크가 글자보다 4f 먼저 압인,
//   글자 지연 42+i·1.8, 8f, 58→70f 밑줄 + 양끝 190px 연장선, 떠오르는 먼지 20개(인덱스에서 결정).
// 바꾼 것: 금빛 → 브랜드 옐로, 바탕 페이지 텍스처 대신 지도 바탕, 끝 페이드 아웃 대신 CTA 블록
//   (네이버카페 검색 3f/글자 타이핑 → 가입 버튼 → 탭) 후 1초 이상 정지. 이 영상의 목적이 행동 유도라서.
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { EASE, Grain, SpeedBlur, mix, ramp, softShadow, velocity } from '../lib/Polish';
import { springAt } from '../lib/Look';
import { C, FONT, alpha } from '../theme';
import { SHAPES } from './S3Unlock';

const FLY_EASE = Easing.bezier(0.34, 1.4, 0.44, 1);
const CRANE_EASE = Easing.bezier(0.3, 0, 0.2, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const WM_Y = 640; // 워드마크 중심 y
const TYPE0 = 100; // 검색어 타이핑 시작
const QUERY = '의정부혜택지도';
const BTN = 126; // 가입 버튼 등장
const TAP = 140; // 탭

const Glyph: React.FC<{ shape: number; size: number; color: string; knock: string }> = ({ shape, size, color, knock }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }}>{SHAPES[shape](color, knock)}</svg>
);

type El = { cue?: number; key: string; cx: number; cy: number; w: number; h: number; dx: number; dy: number; rot: number; radius: number; node: React.ReactNode };
const keycap = (shape: number, tint: string) => (
  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${tint} 0%, ${tint} 100%)`, display: 'grid', placeItems: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}>
    <Glyph shape={shape} size={62} color={alpha(C.ink, 0.86)} knock={tint} />
  </div>
);
const pill = (shape: number, label: string) => (
  <div style={{ position: 'absolute', inset: 0, background: C.card, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px 0 12px', fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.greenInk, letterSpacing: '-0.03em', border: `2px solid ${alpha(C.ink, 0.08)}`, borderRadius: 999 }}>
    <span style={{ width: 60, height: 60, borderRadius: 18, background: alpha(C.green, 0.14), display: 'grid', placeItems: 'center' }}><Glyph shape={shape} size={38} color={C.green} knock="#E5F6EE" /></span>
    {label}
  </div>
);
const EL_BASE: El[] = [
  { key: 'cap-coffee', cx: 170, cy: 330, w: 120, h: 120, dx: -420, dy: -380, rot: -6, radius: 30, node: keycap(0, C.yellow) },
  { key: 'pill-cafe', cx: 760, cy: 300, w: 236, h: 84, dx: 460, dy: -400, rot: 4, radius: 999, node: pill(0, '카페') },
  { key: 'pin', cx: 950, cy: 440, w: 120, h: 120, dx: 500, dy: -120, rot: 5, radius: 999, node: (
    <div style={{ position: 'absolute', inset: 0, background: C.card, border: `6px solid ${C.green}`, borderRadius: '50%', display: 'grid', placeItems: 'center' }}><Glyph shape={1} size={60} color={C.green} knock={C.card} /></div>
  ) },
  { key: 'everyone', cx: 300, cy: 900, w: 360, h: 92, dx: -480, dy: 360, rot: -3, radius: 999, node: (
    <div style={{ position: 'absolute', inset: 0, background: C.greenDeep, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: FONT, fontWeight: 800, fontSize: 38, letterSpacing: '-0.02em' }}>
      <span style={{ display: 'flex', gap: 6 }}>{[0, 1, 2].map((i) => <i key={i} style={{ width: 18, height: 18, borderRadius: 9, background: C.yellow, display: 'block', boxShadow: `0 0 10px ${alpha(C.yellow, 0.8)}` }} />)}</span>
      시민 누구나
    </div>
  ) },
  { key: 'cap-scissors', cx: 880, cy: 880, w: 120, h: 120, dx: 440, dy: 420, rot: 6, radius: 30, node: keycap(2, '#54CC84') },
  { key: 'new', cx: 150, cy: 470, w: 120, h: 60, dx: -460, dy: 60, rot: -5, radius: 999, node: (
    <div style={{ position: 'absolute', inset: 0, background: C.yellow, color: C.ink, display: 'grid', placeItems: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: '0.02em' }}>NEW</div>
  ) },
  { key: 'joined', cx: 640, cy: 960, w: 250, h: 72, dx: 120, dy: 480, rot: 3, radius: 999, node: (
    <div style={{ position: 'absolute', inset: 0, background: '#E3F5EC', color: C.greenInk, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: FONT, fontWeight: 800, fontSize: 32 }}>
      <svg width={26} height={26} viewBox="0 0 14 14"><path d="M2.5 7.4 L5.6 10.2 L11.5 3.8" fill="none" stroke={C.greenInk} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>합류 완료
    </div>
  ) },
  { key: 'pill-food', cx: 420, cy: 270, w: 270, h: 84, dx: -120, dy: -480, rot: -4, radius: 999, node: pill(1, '음식점') },
];
const EL_LIST = EL_BASE.map((e, i) => ({ ...e, cue: 4 + i * 3 }));

const DUST = Array.from({ length: 20 }, (_, i) => ({
  x: (i * 439 + 137) % 1080, y0: (i * 613 + 271) % 1920, rise: 0.3 + (i % 5) * 0.11, swayAmp: 9 + (i % 4) * 5,
  swayFreq: 0.022 + (i % 3) * 0.008, phase: (i * 0.83) % (Math.PI * 2), size: 3 + (i % 3) * 1.1, opacity: 0.35 + ((i * 7) % 5) * 0.09,
}));

export const S7Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const craneT = interpolate(frame, [0, 40], [0, 1], { ...clamp, easing: CRANE_EASE });
  const pushT = ramp(frame, 36, 144, EASE.smooth);
  const camScale = 1.06 - 0.06 * craneT + 0.035 * pushT;
  const camTilt = 4 * (1 - craneT);
  const recede = interpolate(frame, [42, 50], [0, 1], clamp);
  const sweepX = interpolate(frame, [2, 14], [-500, 1580], { ...clamp, easing: Easing.bezier(0.4, 0, 0.6, 1) });
  const sweepOp = interpolate(frame, [2, 5, 11, 14], [0, 0.18, 0.18, 0], clamp);
  const stageLight = interpolate(frame, [42, 50, 58], [0, 0.6, 0.38], clamp);
  const rule = interpolate(frame, [58, 70], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const ruleExt = interpolate(frame, [58, 66], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const ruleExtFade = interpolate(frame, [66, 72], [1, 0], clamp);
  const wordSpacing = interpolate(frame, [62, 66], [-0.04, -0.03], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });

  const cap = ramp(frame, 84, 14, EASE.out);
  const sb = ramp(frame, 88, 16, EASE.snappy);
  const chars = Math.max(0, Math.min(QUERY.length, Math.floor((frame - TYPE0) / 3) + 1));
  const typed = frame >= TYPE0 ? QUERY.slice(0, chars) : '';
  const caretOn = frame < TYPE0 + QUERY.length * 3 + 2 || Math.floor(frame / 8) % 2 === 0;
  const btnIn = frame >= BTN ? springAt(frame, BTN, { damping: 14, stiffness: 220 }) : 0;
  const press = interpolate(frame, [TAP, TAP + 3, TAP + 9], [0, 1, 0], clamp);
  const ripple = ramp(frame, TAP, 18, EASE.out);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden', fontFamily: FONT }}>
      {/* 바탕: 흐린 지도 */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 50% at 50% 34%, #FFFFFF 0%, ${C.bg} 60%, #E6F2EB 100%)` }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: 0.55, filter: 'blur(6px)' }}>
        <path d="M 760 -40 C 680 400, 900 760, 720 1100 S 560 1600, 660 1980" fill="none" stroke={C.river} strokeWidth={90} />
        {['M -20 380 L 1100 300', 'M -20 1180 L 1100 1100', 'M 260 -20 L 320 1940', 'M 560 -20 L 600 1940'].map((d) => <path key={d} d={d} fill="none" stroke="#FFFFFF" strokeWidth={26} />)}
      </svg>

      {/* 단체 사진 층: 크레인 */}
      <AbsoluteFill style={{ transform: `perspective(1400px) rotateX(${camTilt}deg) scale(${camScale})`, transformOrigin: '50% 30%' }}>
        {EL_LIST.map((el) => {
          if (frame < el.cue) return null;
          const tAt = (f: number) => interpolate(f, [el.cue, el.cue + 12], [0, 1], { ...clamp, easing: FLY_EASE });
          const t = tAt(frame);
          const op = interpolate(frame, [el.cue, el.cue + 3], [0, 1], clamp) * (1 - 0.12 * recede);
          const vx = velocity((f) => el.dx * (1 - tAt(f)), frame);
          const vy = velocity((f) => el.dy * (1 - tAt(f)), frame);
          const land = interpolate(frame, [el.cue + 9, el.cue + 12, el.cue + 16], [0, 1, 0], clamp);
          const air = Math.max(0, 1 - t);
          return (
            <SpeedBlur key={el.key} vx={vx} vy={vy} amount={0.3} max={22}>
              <div style={{
                position: 'absolute', left: el.cx - el.w / 2, top: el.cy - el.h / 2, width: el.w, height: el.h, borderRadius: el.radius, overflow: 'hidden',
                transform: `translate(${el.dx * (1 - t)}px, ${el.dy * (1 - t)}px) rotate(${el.rot * (2 - t)}deg) scale(${(1.12 - 0.12 * t) * (1 - 0.015 * land)})`,
                boxShadow: air > 0.01 ? `0 ${10 + 26 * air}px ${24 + 46 * air}px rgba(14,26,20,${0.16 + 0.1 * air})` : `0 ${10 - 5 * land}px ${24 - 12 * land}px rgba(14,26,20,${0.16 + 0.06 * land}), 0 2px 6px rgba(14,26,20,0.08)`,
                opacity: op, filter: `saturate(${1 - 0.08 * recede})`,
              }}>
                {el.node}
              </div>
            </SpeedBlur>
          );
        })}
      </AbsoluteFill>

      {/* 떠오르는 옐로 먼지 */}
      {DUST.map((d, i) => {
        const y = (((d.y0 - frame * d.rise) % 1920) + 1920) % 1920;
        const x = d.x + Math.sin(frame * d.swayFreq + d.phase) * d.swayAmp;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: d.size, height: d.size, borderRadius: '50%', background: C.yellow, opacity: d.opacity * (0.7 + 0.3 * Math.sin(frame * 0.21 + d.phase * 3)), boxShadow: `0 0 ${d.size * 2.5}px ${d.size * 0.6}px ${alpha(C.yellow, 0.6)}` }} />;
      })}
      {sweepOp > 0 && <div style={{ position: 'absolute', top: 0, bottom: 0, left: sweepX - 260, width: 520, background: 'linear-gradient(90deg, rgba(255,250,220,0), rgba(255,250,220,1) 50%, rgba(255,250,220,0))', opacity: sweepOp, mixBlendMode: 'overlay' }} />}
      {stageLight > 0 && <AbsoluteFill style={{ background: `radial-gradient(520px 300px at 540px ${WM_Y}px, rgba(255,255,255,0.98), rgba(255,255,255,0.4) 55%, rgba(255,255,255,0) 75%)`, opacity: stageLight }} />}

      {/* 워드마크 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: WM_Y - 80, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', fontSize: 112, fontWeight: 800, color: C.ink, letterSpacing: `${wordSpacing}em`, lineHeight: 1.18, textShadow: '0 14px 36px rgba(14,26,20,0.12)' }}>
          {(() => {
            const t = interpolate(frame, [38, 46], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0.75, 0.3, 1) });
            return (
              <div style={{ marginRight: 26, opacity: t, transform: `translateY(${(1 - t) * 28}px) scale(${1.35 - 0.35 * t})`, filter: t < 0.995 ? `blur(${(1 - t) * 8}px)` : undefined }}>
                <div style={{ width: 120, height: 120, borderRadius: 32, background: C.green, display: 'grid', placeItems: 'center' }}><Glyph shape={10} size={76} color="#FFFFFF" knock={C.green} /></div>
              </div>
            );
          })()}
          {Array.from('의정부혜택지도').map((ch, i) => {
            const delay = Math.round(42 + i * 1.8);
            const t = interpolate(frame, [delay, delay + 8], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0.75, 0.3, 1) });
            return <span key={i} style={{ display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 28}px) scale(${1.35 - 0.35 * t})`, filter: `blur(${(1 - t) * 8}px)` }}>{ch}</span>;
          })}
        </div>
        <div style={{ position: 'relative', height: 10, width: 300, margin: '28px auto 0' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 5, background: C.yellow, transform: `scaleX(${rule})` }} />
          {ruleExt > 0 && ruleExtFade > 0 && (
            <>
              <div style={{ position: 'absolute', top: 4, height: 2, right: '100%', width: 190 * ruleExt, background: C.yellow, opacity: ruleExtFade }} />
              <div style={{ position: 'absolute', top: 4, height: 2, left: '100%', width: 190 * ruleExt, background: C.yellow, opacity: ruleExtFade }} />
            </>
          )}
        </div>
      </div>

      {/* CTA: 네이버카페 검색 + 가입 버튼 */}
      <div style={{ position: 'absolute', left: 72, right: 72, top: 1130 }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', opacity: cap, transform: `translateY(${(1 - cap) * 20}px)` }}>
          자세한 혜택은 <span style={{ color: C.greenInk }}>네이버카페</span>에서
        </div>
        <div style={{ marginTop: 28, height: 156, borderRadius: 36, background: C.card, border: `3px solid ${C.green}`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px 0 22px', opacity: sb, transform: `translateY(${(1 - sb) * 48}px)`, boxShadow: softShadow(10, { color: '#0e1a14' }) }}>
          <span style={{ height: 100, padding: '0 26px', borderRadius: 24, background: C.ink, color: '#FFFFFF', display: 'flex', alignItems: 'center', fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', flexShrink: 0 }}>네이버카페</span>
          <span style={{ fontSize: 60, fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>{typed}</span>
          <span style={{ width: 5, height: 66, background: C.green, marginLeft: -16, opacity: caretOn && sb > 0.5 ? 1 : 0 }} />
          <svg width={64} height={64} viewBox="0 0 24 24" style={{ marginLeft: 'auto', flexShrink: 0 }}><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke={C.greenInk} strokeWidth="2.4" /><path d="M15.5 15.5 21 21" stroke={C.greenInk} strokeWidth="2.6" strokeLinecap="round" /></svg>
        </div>
        <div style={{ position: 'relative', marginTop: 40, height: 188, borderRadius: 40, background: C.yellow, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, fontSize: 76, fontWeight: 800, letterSpacing: '-0.03em', opacity: Math.min(1, btnIn * 2), transform: `translateY(${(1 - btnIn) * 60}px) scale(${1 - press * 0.05})`, boxShadow: `0 ${18 - press * 10}px ${44 - press * 20}px ${alpha('#8A6D00', 0.35)}`, overflow: 'hidden' }}>
          지금 가입하기
          <svg width={70} height={70} viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {frame >= TAP && ripple < 1 && (
            <div style={{ position: 'absolute', left: 700 - 60, top: 94 - 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', transform: `scale(${1 + ripple * 6})`, opacity: (1 - ripple) * 0.8 }} />
          )}
        </div>
      </div>
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};
