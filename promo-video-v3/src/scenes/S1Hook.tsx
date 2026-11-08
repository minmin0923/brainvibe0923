// S1 후킹 — lead-word-zoom-assemble 적응판.
// 원본: demos/typography/lead-word-zoom-assemble/LeadWordZoomAssemble.tsx
// 그대로 둔 것: 2.3배 시작 + hold 12f 동안 6% 추가 확대, 축소·좌측 슬라이드가 같은 ZOOM_EASE 한 곡선,
//   뒤 단어는 0.5em 밀려 들어옴(2f 페이드), 피벗 = 첫 단어 중심 % + 기준선 px(마운트 때 실측),
//   f32–46 줄 상승과 부제를 같은 시간창에, 끝 12f crash-zoom.
// 바꾼 것: 문구(한국어), 글자 크기 120px(세로 화면), 위쪽 눈썹 문구, 브랜드 팔레트 배경.
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Grain, Vignette } from '../lib/Polish';
import { C, FONT, alpha } from '../theme';

const WORDS = ['제값', '다', '내세요?'];
const FONT_SIZE = 132;
const INITIAL_SCALE = 2.3;
const INTRO_DURATION = 6;
const HOLD_DURATION = 12;
const PUSH_SCALE = 1.06;
const RECEDE_DURATION = 12;
const ASSEMBLE_DURATION = 24;
const WORD_DELAY = 6;
const WORD_STAGGER = 4;
const WORD_DURATION = 12;
const WORD_PUSH = 0.5;
const WORD_FADE = 2;
const LIFT: [number, number] = [32, 46];
const LIFT_DISTANCE = -64;
const CRASH_FRAMES = 12;
const CRASH_SCALE = 0.2;
const CRASH_BLUR = 9;

const PUSH_EASE = Easing.bezier(0.25, 1, 0.5, 1);
const ZOOM_EASE = Easing.bezier(0.5, 0, 0.05, 1);
const WORD_EASE = Easing.bezier(0.22, 0.8, 0.36, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const MESH_BG =
  `radial-gradient(60% 40% at 24% 22%, ${alpha(C.green, 0.16)} 0%, ${alpha(C.green, 0)} 72%),` +
  `radial-gradient(56% 36% at 82% 84%, ${alpha(C.yellow, 0.22)} 0%, ${alpha(C.yellow, 0)} 72%),` +
  `radial-gradient(70% 50% at 50% 48%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%),` +
  `linear-gradient(180deg, ${C.bg} 0%, #EAF4EE 100%)`;

const lineScale = (f: number) =>
  interpolate(f, [0, HOLD_DURATION], [INITIAL_SCALE, INITIAL_SCALE * PUSH_SCALE], { ...clamp, easing: PUSH_EASE }) +
  interpolate(f, [HOLD_DURATION, HOLD_DURATION + RECEDE_DURATION], [0, 1 - INITIAL_SCALE * PUSH_SCALE], { ...clamp, easing: ZOOM_EASE });

const TextReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const lineRef = useRef<HTMLSpanElement>(null);
  const leadRef = useRef<HTMLSpanElement>(null);
  const baselineRef = useRef<HTMLSpanElement>(null);
  const [handle] = useState(() => delayRender('S1: measure line'));
  const [m, setM] = useState<{ lineWidth: number; leadRatio: number; baseline: number } | null>(null);

  useEffect(() => {
    const line = lineRef.current;
    const lead = leadRef.current;
    if (!line || !lead) {
      continueRender(handle);
      return;
    }
    setM({
      lineWidth: line.offsetWidth,
      leadRatio: (lead.offsetLeft + lead.offsetWidth / 2) / line.offsetWidth,
      baseline: baselineRef.current?.offsetTop ?? line.offsetHeight * 0.8,
    });
  }, [handle]);
  useEffect(() => {
    if (m) continueRender(handle);
  }, [m, handle]);

  const leadRatio = m?.leadRatio ?? 0.14;
  const lineWidth = m?.lineWidth ?? width * 0.6;
  const baseline = m?.baseline ?? FONT_SIZE * 0.88;
  const slideDistance = lineWidth * (0.5 - leadRatio);
  const introBlur = interpolate(frame, [0, INTRO_DURATION], [8 / INITIAL_SCALE, 0], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <span
        ref={lineRef}
        style={{
          position: 'relative', display: 'inline-block', fontSize: FONT_SIZE, fontWeight: 800, color: C.ink,
          letterSpacing: '-0.04em', lineHeight: 1.1, whiteSpace: 'nowrap', fontFamily: FONT,
          transformOrigin: `${leadRatio * 100}% ${baseline}px`,
          scale: lineScale(frame),
          filter: (() => {
            const v = Math.abs(lineScale(frame + 0.5) - lineScale(frame - 0.5));
            const b = Math.min(3.5, v * 10) + introBlur;
            return b > 0.05 ? `blur(${b.toFixed(2)}px)` : undefined;
          })(),
          translate: `${interpolate(frame, [HOLD_DURATION, HOLD_DURATION + ASSEMBLE_DURATION], [slideDistance, 0], { ...clamp, easing: ZOOM_EASE })}px`,
          opacity: m ? 1 : 0,
        }}
      >
        {WORDS.map((word, i) => {
          const isLead = i === 0;
          const pushStart = HOLD_DURATION + WORD_DELAY + (i - 1) * WORD_STAGGER;
          const opacity = isLead
            ? interpolate(frame, [0, INTRO_DURATION], [0, 1], clamp)
            : interpolate(frame, [pushStart, pushStart + WORD_FADE], [0, 1], clamp);
          return (
            <Fragment key={i}>
              <span
                ref={isLead ? leadRef : undefined}
                style={{
                  display: 'inline-block', opacity, color: isLead ? C.greenInk : undefined,
                  translate: isLead ? undefined : `${interpolate(frame, [pushStart, pushStart + WORD_DURATION], [WORD_PUSH * FONT_SIZE, 0], { ...clamp, easing: WORD_EASE })}px`,
                }}
              >
                {word}
              </span>
              {i < WORDS.length - 1 ? ' ' : null}
            </Fragment>
          );
        })}
        <span ref={baselineRef} style={{ display: 'inline-block', width: 0, height: 0 }} />
      </span>
    </AbsoluteFill>
  );
};

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const lift = interpolate(frame, LIFT, [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const crash = interpolate(frame, [durationInFrames - CRASH_FRAMES, durationInFrames - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  // 눈썹 문구: 첫 단어가 줄어든 직후(f18) 대상을 부른다. 그 전에는 2.3배 '제값'과 겹치므로 숨김
  const brow = interpolate(frame, [18, 28], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: MESH_BG, fontFamily: FONT }}>
      <AbsoluteFill style={{ transform: `scale(${1 + crash * CRASH_SCALE})`, filter: crash > 0.01 ? `blur(${crash * CRASH_BLUR}px)` : undefined, opacity: 1 - crash * 0.55 }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%', marginTop: -250, textAlign: 'center',
          fontSize: 64, fontWeight: 700, color: C.muted, letterSpacing: '-0.02em',
          opacity: brow, transform: `translateY(${(1 - brow) * 18 + lift * LIFT_DISTANCE}px)`,
        }}>
          의정부 사는 분, 아직도
        </div>
        <AbsoluteFill style={{ transform: `translateY(${lift * LIFT_DISTANCE}px)` }}>
          <TextReveal />
        </AbsoluteFill>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%', marginTop: 70, textAlign: 'center',
          opacity: lift, transform: `translateY(${(1 - lift) * 16}px)`,
        }}>
          <div style={{ fontSize: 48, fontWeight: 600, color: C.muted, letterSpacing: '-0.01em' }}>지금까지 받은 동네 할인</div>
          <div style={{ fontSize: 150, fontWeight: 800, color: C.ink, letterSpacing: '-0.05em', lineHeight: 1.05, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            0<span style={{ fontSize: 84 }}>원</span>
          </div>
        </div>
      </AbsoluteFill>
      <Vignette strength={0.12} inner={0.5} color="#1d2a22" />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};
