import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {FreezeBoil, Rough, path, rect} from '../lib/rough';
import {DAY, HOME, INK, PAPER, PINK} from '../lib/palette';
import {HarinDrawing, TRAIN_STOP_X} from '../lib/HarinDrawing';
import {GOWUN} from '../lib/Caption';
import {EVENTS, SUB, TOTAL} from '../timeline';

const B_DUR = TOTAL - SUB.S14B; // 100
const TITLE_AT = EVENTS.endTitle - SUB.S14B; // 25
const SUB_AT = EVENTS.endSub - SUB.S14B; // 58
const HOLD_AT = EVENTS.holdFrom - SUB.S14B; // 82
const MOVE_FROM = 6;
const STOP_AT = EVENTS.trainStop - SUB.S14B; // 62

const DS = 0.94; // 그림 배율
const DX = 34;
const DY = 560;

/** S14-B. 하린 머리맡의 분홍 크레용 지하철 그림이 진짜로 달려와 "우리집" 앞에 멈춘다. */
export const S14B: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = Math.min(frame, HOLD_AT); // 마지막 0.6초 정지(썸네일 겸용)
  // 달려오기: 감속하며 다가오고, 멈출 때 살짝 반동
  const run = interpolate(f, [MOVE_FROM, STOP_AT - 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.6, 0.35, 1),
  });
  const settle = spring({frame: f - (STOP_AT - 4), fps, config: {damping: 9, stiffness: 160, mass: 0.6}});
  const overshoot = f >= STOP_AT - 4 ? (1 - settle) * -14 + Math.sin(settle * Math.PI) * 10 : 0;
  const startX = -900;
  const tx = startX + (TRAIN_STOP_X - startX) * run + overshoot;
  const moving = f > MOVE_FROM && f < STOP_AT + 6;
  const bob = moving ? Math.sin(f * 1.6) * 3 : 0;
  // 바퀴 회전: 이동 거리 / 반지름
  const wheel = ((tx - startX) / 23) * (180 / Math.PI);
  const glow = interpolate(f, [STOP_AT, STOP_AT + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleIn = interpolate(f, [TITLE_AT, TITLE_AT + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const subIn = interpolate(f, [SUB_AT, SUB_AT + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const body = (
    <AbsoluteFill>
      <Paper color={HOME.night} />
      <Camera dur={HOLD_AT} from={{s: 1.0}} to={{s: 1.05}} origin={[600, 1180]}>
        <Stage>
          {/* 이불·베개 가장자리(어두운 방) */}
          <Rough boil="bg" shape={path('M -40 1580 Q 300 1520 600 1600 T 1120 1560 L 1120 1980 L -40 1980 Z')} seed={2} solid={HOME.slate} o={{fill: HOME.slate, hachureGap: 12}} />
          {/* 종이 한 장 */}
          <g transform="rotate(-1.6 540 960)">
            <rect x={14} y={210} width={1052} height={1400} fill={PAPER} />
            <Rough boil="bg" shape={rect(14, 210, 1052, 1400)} seed={3} o={{strokeWidth: 3, stroke: DAY.sand, roughness: 0.8}} />
          </g>
        </Stage>
        {/* 멈추는 순간 따뜻한 빛이 번진다 */}
        <Wash
          blobs={[
            {x: 660, y: 1150, r: 520 * (0.4 + glow * 0.7), color: DAY.sun, o: 0.85 * glow},
          ]}
          blur={70}
        />
        <Stage>
          <g transform={`translate(${DX} ${DY}) scale(${DS})`}>
            <HarinDrawing trainX={tx} trainBob={bob} wheel={wheel} glow={glow} />
          </g>
        </Stage>
        {/* 방 안의 어둠이 걷히는 비네팅 */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 70% 55% at 55% 60%, rgba(27,34,51,0) ${62 + glow * 20}%, rgba(27,34,51,${0.55 - glow * 0.35}) 100%)`,
          }}
        />
      </Camera>
      {/* 엔딩 타이틀: 120px + 크레용 질감 */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          width: 880,
          top: 268,
          textAlign: 'center',
          fontFamily: GOWUN,
          fontSize: 120,
          lineHeight: 1.12,
          letterSpacing: '0.02em',
          color: INK,
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 18}px)`,
        }}
      >
        <svg width={880} height={290} style={{overflow: 'visible'}}>
          <g filter="url(#crayon-text)" fontFamily={GOWUN} fontSize={120} textAnchor="middle">
            <text x={440} y={112}>
              <tspan fill={PINK.line8}>8호선,</tspan>
            </text>
            <text x={440} y={252} fill={INK}>
              의정부까지.
            </text>
          </g>
        </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          width: 880,
          top: 1392,
          textAlign: 'center',
          fontFamily: GOWUN,
          fontSize: 46,
          letterSpacing: '0.02em',
          color: INK,
          opacity: subIn,
        }}
      >
        프로필 링크에서 서명해 주세요
      </div>
    </AbsoluteFill>
  );
  return frame >= HOLD_AT ? <FreezeBoil at={HOLD_AT}>{body}</FreezeBoil> : body;
};

export const S14B_DUR = B_DUR;
