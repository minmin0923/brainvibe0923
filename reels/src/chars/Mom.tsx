import React from 'react';
import {Rough, circle, ellipse, line, path, rect} from '../lib/rough';
import {BLUSH_OTHER, EP2, HAIR, INK, SKIN} from '../lib/palette';
import {Cheeks, DotEyes, Limb, MouthShape, ik, reach, toLocal, type Mouth} from './parts';

export type MomPose = {
  armL?: number;
  armR?: number;
  elbowL?: number;
  elbowR?: number;
  handL?: [number, number];
  handR?: [number, number];
  eyes?: 'open' | 'closed' | 'tired';
  look?: number;
  mouth?: Mouth;
  headTilt?: number;
};

const KNIT = EP2.sage; // 세이지 그린 니트 #9DB89A
const APRON = EP2.homeSand; // 베이지 앞치마
const CLIP = EP2.homeAmber; // 갈색 집게핀
const PANTS = EP2.subway;

/**
 * 엄마(30대 중반, 2탄 신규). 원점 = 두 발 사이 바닥, 키 약 760.
 * 어깨 길이 단발 + 갈색 집게핀, 세이지 그린 니트, 베이지 앞치마. 둥근 얼굴·점 눈·볼터치(1탄 규칙).
 */
export const Mom: React.FC<{x: number; y: number; scale?: number; flip?: boolean; pose?: MomPose; seed?: number}> = ({
  x,
  y,
  scale = 1,
  flip,
  pose = {},
  seed = 1600,
}) => {
  const {handL, handR, armL = 6, armR = 6, elbowL = 0, elbowR = 0, eyes = 'open', look = 0, mouth = 'smile', headTilt = 0} = pose;
  const shL: [number, number] = [-76, -530];
  const shR: [number, number] = [76, -530];
  const elL0 = reach(shL, -armL, 115);
  const elR0 = reach(shR, armR, 115);
  const hdL0 = reach(elL0, -(armL + elbowL), 108);
  const hdR0 = reach(elR0, armR + elbowR, 108);
  const [elL, hdL] = handL ? ik(shL, toLocal(handL, x, y, scale, flip), 115, 108, 1) : [elL0, hdL0];
  const [elR, hdR] = handR ? ik(shR, toLocal(handR, x, y, scale, flip), 115, 108, -1) : [elR0, hdR0];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* 다리 */}
      <Rough shape={rect(-50, -280, 42, 266)} seed={seed + 1} solid={PANTS} o={{fill: PANTS}} />
      <Rough shape={rect(8, -280, 42, 266)} seed={seed + 2} solid={PANTS} o={{fill: PANTS}} />
      <Rough shape={ellipse(-34, -10, 74, 28)} seed={seed + 3} solid={EP2.subwayPale} o={{strokeWidth: 5}} />
      <Rough shape={ellipse(34, -10, 74, 28)} seed={seed + 4} solid={EP2.subwayPale} o={{strokeWidth: 5}} />
      {/* 니트 */}
      <Rough shape={path('M -80 -540 Q 0 -560 80 -540 L 92 -270 Q 0 -256 -92 -270 Z')} seed={seed + 5} solid={KNIT} o={{fill: KNIT, hachureGap: 7}} />
      {/* 앞치마 + 끈 */}
      <Rough shape={path('M -52 -470 L 52 -470 L 70 -170 Q 0 -158 -70 -170 Z')} seed={seed + 6} solid={APRON} o={{fill: APRON, hachureGap: 10}} />
      <Rough shape={line(-52, -470, -30, -536)} seed={seed + 7} o={{strokeWidth: 4}} />
      <Rough shape={line(52, -470, 30, -536)} seed={seed + 8} o={{strokeWidth: 4}} />
      <Rough shape={rect(-30, -390, 60, 44)} seed={seed + 9} o={{strokeWidth: 3}} />
      {/* 팔 */}
      <Limb pts={[shL, elL, hdL]} w={44} color={KNIT} seed={seed + 10} hand={38} />
      <Limb pts={[shR, elR, hdR]} w={44} color={KNIT} seed={seed + 14} hand={38} />
      {/* 목 + 머리 */}
      <g transform={`rotate(${headTilt} 0 -550)`}>
        <Rough shape={rect(-17, -566, 34, 32)} seed={seed + 20} solid={SKIN} o={{strokeWidth: 4}} />
        <MomHead cx={0} cy={-640} eyes={eyes} look={look} mouth={mouth} seed={seed + 30} />
      </g>
    </g>
  );
};

export const MomHead: React.FC<{
  cx: number;
  cy: number;
  eyes?: 'open' | 'closed' | 'tired';
  look?: number;
  mouth?: Mouth;
  seed?: number;
}> = ({cx, cy, eyes = 'open', look = 0, mouth = 'smile', seed = 1630}) => (
  <g>
    {/* 어깨 길이 단발(뒷머리) */}
    <Rough
      shape={path(`M ${cx - 92} ${cy + 70} C ${cx - 112} ${cy - 110}, ${cx + 112} ${cy - 110}, ${cx + 92} ${cy + 70} Q ${cx} ${cy + 92} ${cx - 92} ${cy + 70} Z`)}
      seed={seed}
      solid={HAIR}
      o={{fill: HAIR, hachureGap: 6}}
    />
    <Rough shape={circle(cx, cy, 160)} seed={seed + 1} solid={SKIN} />
    {/* 앞머리(옆으로 넘김) */}
    <Rough
      shape={path(`M ${cx - 80} ${cy + 8} C ${cx - 84} ${cy - 96}, ${cx + 84} ${cy - 96}, ${cx + 80} ${cy + 8} C ${cx + 50} ${cy - 50}, ${cx - 10} ${cy - 40}, ${cx - 80} ${cy + 8} Z`)}
      seed={seed + 2}
      solid={HAIR}
      o={{fill: HAIR, hachureGap: 6}}
    />
    {/* 갈색 집게핀 */}
    <Rough shape={path(`M ${cx + 40} ${cy - 70} l 34 -6 l 6 18 l -34 8 Z`)} seed={seed + 3} solid={CLIP} o={{fill: CLIP, strokeWidth: 4}} />
    {eyes === 'tired' ? (
      <g stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round">
        <path d={`M ${cx - 38 + look} ${cy + 10} l 20 0`} />
        <path d={`M ${cx + 18 + look} ${cy + 10} l 20 0`} />
      </g>
    ) : (
      <DotEyes x={cx} y={cy + 10} gap={56} closed={eyes === 'closed'} look={look} />
    )}
    <Cheeks x={cx} y={cy + 36} gap={96} color={BLUSH_OTHER} o={0.5} />
    <MouthShape x={cx} y={cy + 44} kind={mouth} />
  </g>
);
