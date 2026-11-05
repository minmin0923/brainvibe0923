import React from 'react';
import {Rough, circle, ellipse, path, rect, line} from '../lib/rough';
import {DAWN, DAY, HAIR, JUMPER, PAPER, PINK, SKIN} from '../lib/palette';
import {Cheeks, DotEyes, Limb, MouthShape, ik, reach, toLocal, type Mouth} from './parts';

export type HarinPose = {
  /** 팔 각도(도). 0 = 아래, 양수 = 몸 바깥으로 들어 올림 */
  armL?: number;
  armR?: number;
  /** 손 목표점(월드 좌표). 주면 IK로 팔을 맞춘다 */
  handL?: [number, number];
  handR?: [number, number];
  /** 팔꿈치 굽힘(도) */
  elbowL?: number;
  elbowR?: number;
  eyes?: 'open' | 'closed';
  look?: number;
  mouth?: Mouth;
  headTilt?: number;
  /** 까치발(0~1) */
  tiptoe?: number;
};

/**
 * 하린(7세). 원점 = 두 발 사이 바닥, 키 약 400.
 * 양갈래 머리 + 분홍 머리끈, 노란 점퍼, 분홍 끈 운동화.
 */
export const Harin: React.FC<{x: number; y: number; scale?: number; flip?: boolean; pose?: HarinPose; seed?: number}> = ({
  x,
  y,
  scale = 1,
  flip,
  pose = {},
  seed = 100,
}) => {
  const {handL, handR, armL = 8, armR = 8, elbowL = 0, elbowR = 0, eyes = 'open', look = 0, mouth = 'smile', headTilt = 0, tiptoe = 0} =
    pose;
  const lift = tiptoe * 14;
  const shL: [number, number] = [-46, -205];
  const shR: [number, number] = [46, -205];
  const elL0 = reach(shL, -armL, 48);
  const elR0 = reach(shR, armR, 48);
  const hdL0 = reach(elL0, -(armL + elbowL), 46);
  const hdR0 = reach(elR0, armR + elbowR, 46);
  const [elL, hdL] = handL ? ik(shL, toLocal(handL, x, y, scale, flip), 48, 46, 1) : [elL0, hdL0];
  const [elR, hdR] = handR ? ik(shR, toLocal(handR, x, y, scale, flip), 48, 46, -1) : [elR0, hdR0];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <g transform={`translate(0 ${-lift})`}>
        {/* 다리 */}
        <Rough shape={rect(-33, -100, 27, 88)} seed={seed + 1} solid={DAWN.mid} o={{fill: DAWN.mid, strokeWidth: 5}} />
        <Rough shape={rect(6, -100, 27, 88)} seed={seed + 2} solid={DAWN.mid} o={{fill: DAWN.mid, strokeWidth: 5}} />
        {/* 운동화 + 분홍 끈 */}
        <g transform={`rotate(${tiptoe * -18} -22 -4)`}>
          <Rough shape={ellipse(-24, -6, 50, 24)} seed={seed + 3} solid={PAPER} o={{strokeWidth: 5}} />
          <Rough shape={line(-32, -12, -16, -10)} seed={seed + 4} o={{stroke: PINK.line8, strokeWidth: 5}} />
        </g>
        <g transform={`rotate(${tiptoe * 18} 22 -4)`}>
          <Rough shape={ellipse(24, -6, 50, 24)} seed={seed + 5} solid={PAPER} o={{strokeWidth: 5}} />
          <Rough shape={line(16, -10, 32, -12)} seed={seed + 6} o={{stroke: PINK.line8, strokeWidth: 5}} />
        </g>
        {/* 노란 점퍼 */}
        <Rough
          shape={path('M -50 -214 Q 0 -232 50 -214 L 68 -96 Q 0 -84 -68 -96 Z')}
          seed={seed + 7}
          solid={JUMPER}
          o={{fill: JUMPER, hachureGap: 7}}
        />
        <Rough shape={line(0, -222, 0, -94)} seed={seed + 8} o={{strokeWidth: 4}} />
        {/* 팔 */}
        <Limb pts={[shL, elL, hdL]} w={30} color={JUMPER} seed={seed + 10} hand={30} />
        <Limb pts={[shR, elR, hdR]} w={30} color={JUMPER} seed={seed + 14} hand={30} />
        {/* 머리 */}
        <g transform={`rotate(${headTilt} 0 -225)`}>
          <HarinHead cx={0} cy={-292} eyes={eyes} look={look} mouth={mouth} seed={seed + 20} />
        </g>
      </g>
    </g>
  );
};

/** 하린 얼굴(양갈래 포함). 잠든 장면 등에서도 쓴다. */
export const HarinHead: React.FC<{
  cx: number;
  cy: number;
  eyes?: 'open' | 'closed';
  look?: number;
  mouth?: Mouth;
  seed?: number;
}> = ({cx, cy, eyes = 'open', look = 0, mouth = 'smile', seed = 120}) => (
  <g>
    {/* 양갈래 */}
    <Rough shape={ellipse(cx - 96, cy + 14, 54, 92)} seed={seed} solid={HAIR} o={{fill: HAIR, hachureGap: 6}} />
    <Rough shape={ellipse(cx + 96, cy + 14, 54, 92)} seed={seed + 1} solid={HAIR} o={{fill: HAIR, hachureGap: 6}} />
    {/* 얼굴 */}
    <Rough shape={circle(cx, cy, 164)} seed={seed + 2} solid={SKIN} />
    {/* 머리카락 */}
    <Rough
      shape={path(
        `M ${cx - 82} ${cy + 4} C ${cx - 86} ${cy - 104}, ${cx + 86} ${cy - 104}, ${cx + 82} ${cy + 4} C ${cx + 66} ${cy - 30}, ${cx + 26} ${cy - 46}, ${cx + 4} ${cy - 30} C ${cx - 18} ${cy - 48}, ${cx - 62} ${cy - 30}, ${cx - 82} ${cy + 4} Z`,
      )}
      seed={seed + 3}
      solid={HAIR}
      o={{fill: HAIR, hachureGap: 6}}
    />
    {/* 분홍 머리끈 */}
    <Rough shape={circle(cx - 76, cy - 18, 24)} seed={seed + 4} solid={PINK.line8} o={{fill: PINK.line8, strokeWidth: 4}} />
    <Rough shape={circle(cx + 76, cy - 18, 24)} seed={seed + 5} solid={PINK.line8} o={{fill: PINK.line8, strokeWidth: 4}} />
    <DotEyes x={cx} y={cy + 10} gap={56} closed={eyes === 'closed'} look={look} />
    <Cheeks x={cx} y={cy + 34} gap={96} color={PINK.crayon} />
    <MouthShape x={cx} y={cy + 42} kind={mouth} />
  </g>
);

/** S3: 옆에서 본 침대 위, 이불 덮고 잠든 하린 + 이불 밖으로 나온 작은 발. 원점 = 머리 중심 */
export const HarinAsleep: React.FC<{x: number; y: number; scale?: number; breathe?: number; seed?: number}> = ({
  x,
  y,
  scale = 1,
  breathe = 0,
  seed = 300,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {/* 매트리스 + 침대 프레임 */}
    <Rough shape={rect(-170, 92, 600, 70)} seed={seed} solid={PAPER} o={{fill: DAWN.pale, hachureGap: 12, strokeWidth: 5}} />
    <Rough shape={rect(-190, 30, 34, 230)} seed={seed + 1} solid={DAY.amber} o={{fill: DAY.amber, strokeWidth: 5}} />
    <Rough shape={rect(-170, 162, 600, 50)} seed={seed + 2} solid={DAY.amber} o={{fill: DAY.amber, hachureGap: 10, strokeWidth: 5}} />
    {/* 베개 */}
    <Rough shape={ellipse(-20, 70, 290, 100)} seed={seed + 3} solid={PAPER} o={{fill: DAWN.pale, hachureGap: 11}} />
    <g transform="rotate(-14 0 0)">
      <HarinHead cx={0} cy={0} eyes="closed" mouth="o" seed={seed + 10} />
    </g>
    {/* 이불 (숨 쉴 때 살짝 오르내림) */}
    <g transform={`translate(0 ${breathe * -5})`}>
      <Rough
        shape={path('M 70 40 C 130 -40, 250 -30, 300 30 C 330 60, 350 70, 370 96 L 350 118 L 60 118 C 50 90, 55 60, 70 40 Z')}
        seed={seed + 20}
        solid={DAWN.pale}
        o={{fill: DAWN.mid, hachureGap: 9}}
      />
      <Rough shape={path('M 80 40 C 110 70, 100 100, 90 116')} seed={seed + 21} o={{strokeWidth: 5}} />
    </g>
    {/* 이불 밖으로 나온 작은 발 */}
    <g transform="rotate(-20 395 80)">
      <Rough shape={ellipse(398, 78, 66, 44)} seed={seed + 30} solid={SKIN} />
    </g>
  </g>
);
