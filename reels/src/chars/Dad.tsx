import React from 'react';
import {Rough, circle, path, ellipse, line, rect} from '../lib/rough';
import {BLUSH_OTHER, COAT, DAWN, DAY, HAIR, INK, PAPER, SKIN} from '../lib/palette';
import {Cheeks, DotEyes, Limb, MouthShape, ik, reach, toLocal, type Mouth} from './parts';

export type DadPose = {
  armL?: number;
  armR?: number;
  elbowL?: number;
  /** 손 목표점(월드 좌표). 주면 IK로 팔을 맞춘다 */
  handL?: [number, number];
  handR?: [number, number];
  elbowR?: number;
  /** 무릎 굽힘 0~1 */
  crouch?: number;
  eyes?: 'open' | 'closed';
  look?: number;
  mouth?: Mouth;
  headTilt?: number;
  briefcase?: boolean;
};

/**
 * 아빠(30대 후반). 원점 = 두 발 사이 바닥, 키 약 860.
 * 남색 코트, 느슨하게 풀린 넥타이, 낡은 서류가방, 눈 밑 연한 그늘 선.
 */
export const Dad: React.FC<{x: number; y: number; scale?: number; flip?: boolean; pose?: DadPose; seed?: number}> = ({
  x,
  y,
  scale = 1,
  flip,
  pose = {},
  seed = 500,
}) => {
  const {
    handL,
    handR,
    armL = 6,
    armR = 6,
    elbowL = 0,
    elbowR = 0,
    crouch = 0,
    eyes = 'open',
    look = 0,
    mouth = 'smile',
    headTilt = 0,
    briefcase = false,
  } = pose;
  const drop = crouch * 150;
  const hipY = -330 + drop;
  const kneeOut = crouch * 60;
  const shL: [number, number] = [-92, -600 + drop];
  const shR: [number, number] = [92, -600 + drop];
  const elL0 = reach(shL, -armL, 125);
  const elR0 = reach(shR, armR, 125);
  const hdL0 = reach(elL0, -(armL + elbowL), 120);
  const hdR0 = reach(elR0, armR + elbowR, 120);
  const [elL, hdL] = handL ? ik(shL, toLocal(handL, x, y, scale, flip), 125, 120, 1) : [elL0, hdL0];
  const [elR, hdR] = handR ? ik(shR, toLocal(handR, x, y, scale, flip), 125, 120, -1) : [elR0, hdR0];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* 다리(무릎 굽힘) */}
      <Limb pts={[[-38, hipY], [-44 - kneeOut, (hipY - 20) / 2], [-46, -22]]} w={56} color={DAWN.deep} seed={seed + 1} />
      <Limb pts={[[38, hipY], [44 + kneeOut, (hipY - 20) / 2], [46, -22]]} w={56} color={DAWN.deep} seed={seed + 2} />
      <Rough shape={ellipse(-52, -14, 92, 34)} seed={seed + 3} solid={INK} o={{fill: INK}} />
      <Rough shape={ellipse(52, -14, 92, 34)} seed={seed + 4} solid={INK} o={{fill: INK}} />
      {/* 셔츠 + 풀린 넥타이 */}
      <g transform={`translate(0 ${drop})`}>
        <Rough shape={path('M -70 -612 L 70 -612 L 62 -300 L -62 -300 Z')} seed={seed + 5} solid={PAPER} o={{fill: undefined}} />
        <Rough
          shape={path('M -8 -566 L 14 -566 L 26 -420 L 6 -396 L -6 -424 Z')}
          seed={seed + 6}
          solid={DAY.amber}
          o={{fill: DAY.amber, strokeWidth: 4}}
        />
        {/* 코트 */}
        <Rough
          shape={path('M -96 -612 Q -60 -626 -30 -612 L 0 -470 L -10 -250 L -118 -258 Q -122 -440 -96 -612 Z')}
          seed={seed + 7}
          solid={COAT}
          o={{fill: COAT}}
        />
        <Rough
          shape={path('M 96 -612 Q 60 -626 30 -612 L 8 -470 L 14 -250 L 118 -258 Q 122 -440 96 -612 Z')}
          seed={seed + 8}
          solid={COAT}
          o={{fill: COAT}}
        />
        <Rough shape={line(-30, -612, -6, -500)} seed={seed + 9} o={{strokeWidth: 4}} />
        <Rough shape={line(30, -612, 6, -500)} seed={seed + 10} o={{strokeWidth: 4}} />
      </g>
      {/* 팔 */}
      <Limb pts={[shL, elL, hdL]} w={60} color={COAT} seed={seed + 11} hand={50} />
      <Limb pts={[shR, elR, hdR]} w={60} color={COAT} seed={seed + 15} hand={50} />
      {briefcase && (
        <g>
          <Rough shape={rect(hdR[0] - 70, hdR[1] + 16, 140, 100)} seed={seed + 19} solid={DAY.amber} o={{fill: INK, hachureGap: 12}} />
          <Rough shape={path(`M ${hdR[0] - 24} ${hdR[1] + 18} q 24 -30 48 0`)} seed={seed + 20} o={{strokeWidth: 5}} />
        </g>
      )}
      {/* 목 + 머리 */}
      <g transform={`translate(0 ${drop}) rotate(${headTilt} 0 -630)`}>
        <Rough shape={rect(-22, -650, 44, 40)} seed={seed + 21} solid={SKIN} o={{strokeWidth: 4}} />
        <DadHead cx={0} cy={-730} eyes={eyes} look={look} mouth={mouth} seed={seed + 30} />
      </g>
    </g>
  );
};

export const DadHead: React.FC<{
  cx: number;
  cy: number;
  eyes?: 'open' | 'closed';
  look?: number;
  mouth?: Mouth;
  seed?: number;
  tearful?: boolean;
}> = ({cx, cy, eyes = 'open', look = 0, mouth = 'smile', seed = 530, tearful}) => (
  <g>
    <Rough shape={circle(cx, cy, 176)} seed={seed} solid={SKIN} />
    {/* 짧은 머리 */}
    <Rough
      shape={path(
        `M ${cx - 88} ${cy + 2} C ${cx - 96} ${cy - 112}, ${cx + 96} ${cy - 112}, ${cx + 88} ${cy + 2} C ${cx + 80} ${cy - 40}, ${cx + 40} ${cy - 58}, ${cx - 20} ${cy - 46} C ${cx - 50} ${cy - 40}, ${cx - 76} ${cy - 30}, ${cx - 88} ${cy + 2} Z`,
      )}
      seed={seed + 1}
      solid={HAIR}
      o={{fill: HAIR, hachureGap: 6}}
    />
    <DotEyes x={cx} y={cy + 8} gap={62} closed={eyes === 'closed'} look={look} r={7} />
    {/* 눈 밑 연한 그늘 선 */}
    <g stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.35}>
      <path d={`M ${cx - 40} ${cy + 22} q 9 5 18 0`} />
      <path d={`M ${cx + 22} ${cy + 22} q 9 5 18 0`} />
    </g>
    <Cheeks x={cx} y={cy + 40} gap={104} color={BLUSH_OTHER} o={0.45} />
    <MouthShape x={cx} y={cy + 50} kind={mouth} />
    {tearful && (
      <g fill={DAWN.pale}>
        <ellipse cx={cx - 36} cy={cy + 40} rx={5} ry={9} />
      </g>
    )}
  </g>
);
