import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {FreezeBoil, Rough, ellipse, line, path, rect, useTwos} from '../lib/rough';
import {COAT, DAWN, DAY, HOME, INK, JUMPER, PAPER, PINK, SKIN, WHITE} from '../lib/palette';
import {DadHead} from '../chars/Dad';
import {HarinHead} from '../chars/Harin';
import {HarinDrawing, TRAIN_STOP_X} from '../lib/HarinDrawing';
import {GOWUN, Narration} from '../lib/Caption';
import {EVENTS, SCENES, SUB, TOTAL} from '../timeline';

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

const A_DUR = SUB.S14B - SCENES.S14.from; // 100

/** S14-A. 어두운 귀가 버스 — 아빠 품에 잠든 하린, 구겨진 발언문. 창밖으로 '의정부시' 표지판이 지나간다. */
export const S14A: React.FC = () => {
  const frame = useCurrentFrame();
  const t2 = useTwos();
  const signX = interpolate(frame, [10, 90], [1300, -500], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sweep = ((frame * 22) % 1600) - 300; // 가로등 빛이 지나감
  const breathe = Math.sin(t2 * 0.12) * 4;
  const bump = frame % 50 < 3 ? -2 : 0;
  return (
    <AbsoluteFill style={{transform: `translateY(${bump}px)`}}>
      <Paper color={HOME.night} />
      <Camera dur={A_DUR} from={{s: 1.0}} to={{s: 1.05}} origin={[520, 1250]}>
        <Stage>
          {/* 창 + 바깥 */}
          <Rough boil="bg" shape={rect(60, 420, 960, 520)} seed={1} solid={HOME.night} o={{fill: HOME.slate, hachureGap: 16, strokeWidth: 7}} />
          <defs>
            <clipPath id="s14a-win">
              <rect x={64} y={424} width={952} height={512} />
            </clipPath>
          </defs>
          <g clipPath="url(#s14a-win)">
            <g transform={`translate(${signX} 0)`}>
              <Rough boil="bg" shape={line(-100, 700, -100, 960)} seed={3} o={{strokeWidth: 9, stroke: INK}} />
              <Rough boil="bg" shape={line(160, 700, 160, 960)} seed={4} o={{strokeWidth: 9, stroke: INK}} />
              <Rough boil="char" shape={rect(-200, 520, 460, 190)} seed={5} solid={DAWN.mid} o={{fill: DAWN.mid, stroke: WHITE, strokeWidth: 5}} />
              <text x={30} y={648} textAnchor="middle" fontFamily={GOWUN} fontSize={84} fill={WHITE}>
                의정부시
              </text>
            </g>
            <rect x={sweep} y={424} width={200} height={512} fill={HOME.phone} opacity={0.18} />
          </g>
          <Rough boil="bg" shape={line(540, 420, 540, 940)} seed={6} o={{strokeWidth: 6}} />
        </Stage>
        <Wash blobs={[{x: sweep + 100, y: 1300, r: 300, color: HOME.phone, o: 0.18}]} blur={80} blend="screen" />
        <Stage>
          {/* 좌석 등받이 */}
          <Rough boil="bg" shape={rect(160, 980, 760, 1000)} seed={10} solid={HOME.slate} o={{fill: HOME.night, hachureGap: 12}} />
          {/* 아빠 상체(앉아서) */}
          <Rough shape={path('M 110 1980 Q 130 1200 600 1130 Q 1010 1200 1030 1980 Z')} seed={20} solid={COAT} o={{fill: COAT}} />
          <Rough shape={path('M 530 1140 L 680 1140 L 630 1360 L 590 1360 Z')} seed={21} solid={PAPER} />
          <g transform="translate(610 930) scale(2.0) rotate(10)">
            <DadHead cx={0} cy={0} eyes="closed" mouth="smile" seed={580} />
          </g>
          {/* 품에 잠든 하린 */}
          <g transform={`translate(0 ${breathe})`}>
            <Rough shape={path('M 250 1980 Q 270 1600 450 1540 Q 650 1560 690 1980 Z')} seed={30} solid={JUMPER} o={{fill: JUMPER}} />
            <g transform="translate(450 1400) scale(1.65) rotate(-20)">
              <HarinHead cx={0} cy={0} eyes="closed" mouth="o" seed={190} />
            </g>
            {/* 구겨진 발언문을 꼭 쥔 손 */}
            <Rough shape={path('M 560 1700 L 650 1668 L 716 1720 L 676 1774 L 610 1792 L 578 1750 Z')} seed={40} solid={PAPER} o={{strokeWidth: 4}} />
            <Rough shape={ellipse(612, 1752, 96, 80)} seed={41} solid={SKIN} />
          </g>
          {/* 아빠 팔이 하린을 감싼다 */}
          <Rough shape={path('M 970 1450 Q 880 1780 580 1830 L 560 1910 Q 900 1890 1020 1560 Z')} seed={50} solid={COAT} o={{fill: COAT}} />
          <Rough shape={ellipse(560, 1866, 120, 86)} seed={51} solid={SKIN} />
        </Stage>
      </Camera>
      <Narration lines={['이제, 이루어지기를.']} y={300} from={20} to={A_DUR} />
    </AbsoluteFill>
  );
};

/** S14 전체: A(귀가 버스) → B(그림이 달린다) */
export const S14: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={A_DUR}>
      <S14A />
    </Sequence>
    <Sequence from={A_DUR}>
      <S14B />
    </Sequence>
  </AbsoluteFill>
);
