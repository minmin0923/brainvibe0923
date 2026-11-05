import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, circle, line, path, rect, useTwos} from '../lib/rough';
import {DAY, DAWN, INK, PAPER} from '../lib/palette';
import {Harin} from '../chars/Harin';
import {Dad} from '../chars/Dad';
import {SCENES} from '../timeline';
import {HarinDrawing} from '../lib/HarinDrawing';

const DUR = SCENES.S07.to - SCENES.S07.from;

/** 투명 염원함(카드가 가득). 손잡이 두 개. */
export const WishBox: React.FC<{x: number; y: number; tilt?: number; s?: number}> = ({x, y, tilt = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
    {/* 안의 카드들 */}
    {Array.from({length: 9}).map((_, i) => (
      <Rough
        key={i}
        shape={rect(-112 + (i % 5) * 42, -60 + Math.floor(i / 5) * 34 + (i % 2) * 8, 66, 46)}
        seed={700 + i}
        solid={i % 3 === 0 ? DAY.sun : PAPER}
        o={{strokeWidth: 3, fill: undefined}}
        style={{transform: `rotate(${(i % 3) * 9 - 9}deg)`, transformOrigin: `${-80 + (i % 5) * 42}px ${-40 + Math.floor(i / 5) * 34}px`}}
      />
    ))}
    {/* 맨 위 하린의 그림 */}
    <g transform="translate(-30 -96) rotate(-8) scale(0.1)">
      <rect x={0} y={60} width={1000} height={760} fill={PAPER} />
      <HarinDrawing boil="bg" />
    </g>
    {/* 투명 상자 */}
    <rect x={-150} y={-90} width={300} height={190} fill={PAPER} opacity={0.28} />
    <Rough shape={rect(-150, -90, 300, 190)} seed={720} o={{strokeWidth: 6}} />
    <Rough shape={line(-150, -60, 150, -60)} seed={721} o={{strokeWidth: 3, stroke: DAWN.pale}} />
    {/* 손잡이 */}
    <Rough shape={path('M -150 -40 q -44 0 -44 34 q 0 34 44 34')} seed={722} o={{strokeWidth: 7}} />
    <Rough shape={path('M 150 -40 q 44 0 44 34 q 0 34 -44 34')} seed={723} o={{strokeWidth: 7}} />
    {/* 반사광 */}
    <Rough shape={line(-120, 70, -60, -70)} seed={724} o={{strokeWidth: 4, stroke: PAPER}} />
  </g>
);

/** S7. 함께 들다 — 골든아워 역광, 버스 앞에서 하린과 아빠가 염원함을 함께 든다. */
export const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const t2 = useTwos();
  // 상자가 하린 쪽으로 기울었다가(0~30) 아빠가 무릎을 굽혀 맞춘다(30~55) → 눈 맞춤·웃음(60~)
  const crouch = interpolate(t2, [28, 56], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tilt = interpolate(t2, [0, 20, 30, 56], [0, -9, -9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const smile = t2 > 60;
  // 상자 손잡이의 월드 좌표 → 두 사람의 손이 IK로 따라간다
  const BX = 460;
  const BY = 1420 + (1 - crouch) * -40;
  const BS = 1.05;
  const rad = (tilt * Math.PI) / 180;
  const handle = (lx: number): [number, number] => [
    BX + (lx * Math.cos(rad) - -6 * Math.sin(rad)) * BS,
    BY + (lx * Math.sin(rad) + -6 * Math.cos(rad)) * BS,
  ];
  const hL = handle(-178);
  const hR = handle(178);
  return (
    <AbsoluteFill>
      <Paper color={DAY.cream} />
      <Camera dur={DUR} from={{s: 1.12, x: 12}} to={{s: 1.17, x: -14}} origin={[500, 1560]}>
        <Wash
          blobs={[
            {x: 860, y: 420, r: 520, color: DAY.sun, o: 0.9},
            {x: 200, y: 700, r: 420, color: DAY.sand, o: 0.7},
            {x: 600, y: 1700, r: 600, color: DAY.amber, o: 0.45},
          ]}
          blur={80}
        />
        <Stage>
          {/* 먼 아파트 실루엣 */}
          {[
            [-20, 470, 200],
            [200, 540, 150],
            [380, 430, 170],
            [600, 520, 130],
            [760, 460, 190],
          ].map(([ax, ay, aw], i) => (
            <g key={i}>
              <Rough boil="bg" shape={rect(ax, ay, aw, 760 - ay)} seed={1 + i} solid={DAY.sand} o={{fill: DAY.amber, hachureGap: 16, strokeWidth: 4}} />
              {Array.from({length: Math.floor((760 - ay) / 60)}).map((_, r) => (
                <Rough key={r} boil="bg" shape={line(ax + 18, ay + 30 + r * 60, ax + aw - 18, ay + 30 + r * 60)} seed={20 + i * 10 + r} o={{strokeWidth: 3, stroke: DAY.amber}} />
              ))}
            </g>
          ))}
          {/* 버스 (옆면, 둥근 지붕, 앞문, 바퀴) */}
          <g>
            <Rough
              boil="bg"
              shape={path('M -40 760 L 980 760 Q 1060 760 1070 840 L 1080 1270 L -40 1270 Z')}
              seed={60}
              solid={DAY.amber}
              o={{fill: DAY.amber, hachureGap: 10}}
            />
            {[0, 1, 2].map((i) => (
              <Rough key={i} boil="bg" shape={rect(10 + i * 230, 810, 200, 170)} seed={61 + i} solid={DAY.sun} o={{fill: undefined, strokeWidth: 5}} />
            ))}
            {/* 앞문 */}
            <Rough boil="bg" shape={rect(720, 810, 150, 440)} seed={65} solid={DAY.sun} o={{fill: undefined, strokeWidth: 5}} />
            <Rough boil="bg" shape={line(795, 810, 795, 1250)} seed={66} o={{strokeWidth: 4}} />
            {/* 앞 유리 */}
            <Rough boil="bg" shape={path('M 900 810 L 990 810 Q 1040 815 1046 880 L 1050 980 L 900 980 Z')} seed={67} solid={DAY.sun} o={{fill: undefined, strokeWidth: 5}} />
            <Rough boil="bg" shape={line(-40, 1040, 700, 1040)} seed={68} o={{strokeWidth: 5}} />
            {/* 전조등 */}
            <Rough boil="bg" shape={circle(1030, 1160, 40)} seed={69} solid={DAY.sun} o={{strokeWidth: 4}} />
            {/* 바퀴 */}
            {[580, 1040].map((wx, i) => (
              <g key={i}>
                <Rough boil="bg" shape={circle(wx, 1270, 170)} seed={70 + i} solid={INK} o={{fill: INK}} />
                <Rough boil="bg" shape={circle(wx, 1270, 70)} seed={72 + i} solid={DAY.sand} o={{strokeWidth: 4}} />
              </g>
            ))}
          </g>
          {/* 바닥 */}
          <Rough boil="bg" shape={rect(-40, 1350, 1160, 700)} seed={12} solid={DAY.sand} o={{fill: DAY.amber, hachureGap: 16, strokeWidth: 4}} />
          {/* 그림자 */}
          <ellipse cx={330} cy={1640} rx={110} ry={20} fill={DAY.amber} opacity={0.6} />
          <ellipse cx={740} cy={1640} rx={170} ry={24} fill={DAY.amber} opacity={0.6} />
          {/* 인물 + 상자 */}
          <Harin x={175} y={1640} scale={1.08} pose={{handR: hL, look: 5, mouth: smile ? 'grin' : 'smile', headTilt: smile ? 8 : 4}} />
          <Dad
            x={790}
            y={1640}
            pose={{handL: hR, armR: 6, crouch, look: -7, mouth: smile ? 'grin' : 'smile', headTilt: -6 - crouch * 5}}
          />
          <WishBox x={BX} y={BY} tilt={tilt} s={BS} />
          {/* 빛 먼지 */}
          {Array.from({length: 26}).map((_, i) => {
            const bx = random(`dx${i}`) * 1080;
            const by = 300 + random(`dy${i}`) * 1300 - ((frame * (0.4 + random(`ds${i}`) * 0.6)) % 200);
            const r = 3 + random(`dr${i}`) * 5;
            const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / 12 + i));
            return <circle key={i} cx={bx} cy={by} r={r} fill={DAY.sun} opacity={0.85 * tw} />;
          })}
        </Stage>
      </Camera>
    </AbsoluteFill>
  );
};
