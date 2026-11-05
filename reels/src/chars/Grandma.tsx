import React from 'react';
import {Rough, circle, ellipse, line, path, rect} from '../lib/rough';
import {BLUSH_OTHER, CARDIGAN, DAWN, INK, PAPER, SILVER, SKIN} from '../lib/palette';
import {Cheeks, DotEyes, Limb, MouthShape, ik, reach, toLocal, type Mouth} from './parts';

/** 내부 축소 배율: 할머니는 아빠보다 확실히 작고 아담하게 */
const GS = 0.92;

export type GrandmaPose = {
  armL?: number;
  armR?: number;
  elbowL?: number;
  elbowR?: number;
  /** 손 목표점(월드 좌표). 주면 IK로 팔을 맞춘다 */
  handL?: [number, number];
  handR?: [number, number];
  eyes?: 'open' | 'closed';
  look?: number;
  mouth?: Mouth;
  headTilt?: number;
};

/**
 * 할머니(70대). 원점 = 두 발 사이 바닥, 키 약 670(쪽머리 포함).
 * 은발 쪽머리, 돋보기 안경, 연갈색 카디건.
 */
export const Grandma: React.FC<{x: number; y: number; scale?: number; flip?: boolean; pose?: GrandmaPose; seed?: number}> = ({
  x,
  y,
  scale = 1,
  flip,
  pose = {},
  seed = 800,
}) => {
  const {handL, handR, armL = 6, armR = 6, elbowL = 0, elbowR = 0, eyes = 'open', look = 0, mouth = 'smile', headTilt = 0} = pose;
  const shL: [number, number] = [-78, -500];
  const shR: [number, number] = [78, -500];
  const elL0 = reach(shL, -armL, 105);
  const elR0 = reach(shR, armR, 105);
  const hdL0 = reach(elL0, -(armL + elbowL), 100);
  const hdR0 = reach(elR0, armR + elbowR, 100);
  const [elL, hdL] = handL ? ik(shL, toLocal(handL, x, y, scale * GS, flip), 105, 100, 1) : [elL0, hdL0];
  const [elR, hdR] = handR ? ik(shR, toLocal(handR, x, y, scale * GS, flip), 105, 100, -1) : [elR0, hdR0];
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -scale : scale) * GS} ${scale * GS})`}>
      {/* 다리 + 신발 */}
      <Rough shape={rect(-46, -150, 36, 136)} seed={seed + 1} solid={SKIN} o={{strokeWidth: 5}} />
      <Rough shape={rect(10, -150, 36, 136)} seed={seed + 2} solid={SKIN} o={{strokeWidth: 5}} />
      <Rough shape={ellipse(-34, -10, 70, 28)} seed={seed + 3} solid={INK} o={{fill: INK}} />
      <Rough shape={ellipse(34, -10, 70, 28)} seed={seed + 4} solid={INK} o={{fill: INK}} />
      {/* 치마 */}
      <Rough
        shape={path('M -82 -330 L 82 -330 L 104 -140 Q 0 -124 -104 -140 Z')}
        seed={seed + 5}
        solid={DAWN.mid}
        o={{fill: DAWN.mid, hachureGap: 9}}
      />
      {/* 블라우스 + 카디건 */}
      <Rough shape={path('M -50 -512 L 50 -512 L 44 -300 L -44 -300 Z')} seed={seed + 6} solid={PAPER} o={{fill: undefined}} />
      <Rough
        shape={path('M -86 -508 Q -58 -524 -34 -512 L -12 -380 L -20 -290 L -100 -296 Q -104 -420 -86 -508 Z')}
        seed={seed + 7}
        solid={CARDIGAN}
        o={{fill: CARDIGAN}}
      />
      <Rough
        shape={path('M 86 -508 Q 58 -524 34 -512 L 12 -380 L 20 -290 L 100 -296 Q 104 -420 86 -508 Z')}
        seed={seed + 8}
        solid={CARDIGAN}
        o={{fill: CARDIGAN}}
      />
      {/* 카디건 단추 */}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={-18} cy={-460 + i * 50} r={6} fill={INK} />
      ))}
      {/* 팔 */}
      <Limb pts={[shL, elL, hdL]} w={48} color={CARDIGAN} seed={seed + 10} hand={40} />
      <Limb pts={[shR, elR, hdR]} w={48} color={CARDIGAN} seed={seed + 14} hand={40} />
      {/* 목 + 머리 */}
      <g transform={`rotate(${headTilt} 0 -520)`}>
        <Rough shape={rect(-18, -538, 36, 32)} seed={seed + 20} solid={SKIN} o={{strokeWidth: 4}} />
        <GrandmaHead cx={0} cy={-610} eyes={eyes} look={look} mouth={mouth} seed={seed + 30} />
      </g>
    </g>
  );
};

export const GrandmaHead: React.FC<{
  cx: number;
  cy: number;
  eyes?: 'open' | 'closed';
  look?: number;
  mouth?: Mouth;
  seed?: number;
}> = ({cx, cy, eyes = 'open', look = 0, mouth = 'smile', seed = 830}) => (
  <g>
    {/* 쪽머리 */}
    <Rough shape={circle(cx, cy - 92, 76)} seed={seed} solid={SILVER} o={{fill: SILVER, hachureGap: 6}} />
    <Rough shape={line(cx - 34, cy - 104, cx + 34, cy - 82)} seed={seed + 1} o={{strokeWidth: 5, stroke: CARDIGAN}} />
    <Rough shape={circle(cx, cy, 160)} seed={seed + 2} solid={SKIN} />
    {/* 은발 */}
    <Rough
      shape={path(
        `M ${cx - 80} ${cy + 6} C ${cx - 86} ${cy - 98}, ${cx + 86} ${cy - 98}, ${cx + 80} ${cy + 6} C ${cx + 70} ${cy - 34}, ${cx + 30} ${cy - 52}, ${cx} ${cy - 50} C ${cx - 30} ${cy - 52}, ${cx - 70} ${cy - 34}, ${cx - 80} ${cy + 6} Z`,
      )}
      seed={seed + 3}
      solid={SILVER}
      o={{fill: SILVER, hachureGap: 6}}
    />
    <DotEyes x={cx} y={cy + 8} gap={54} closed={eyes === 'closed'} look={look} r={5.5} />
    {/* 돋보기 안경 */}
    <g stroke={INK} strokeWidth={4} fill="none">
      <circle cx={cx - 27} cy={cy + 8} r={21} />
      <circle cx={cx + 27} cy={cy + 8} r={21} />
      <path d={`M ${cx - 6} ${cy + 6} q 6 -6 12 0`} />
    </g>
    {/* 눈가 주름 */}
    <g stroke={INK} strokeWidth={3} fill="none" opacity={0.45} strokeLinecap="round">
      <path d={`M ${cx - 58} ${cy + 2} l -10 -4 M ${cx - 58} ${cy + 12} l -10 4`} />
      <path d={`M ${cx + 58} ${cy + 2} l 10 -4 M ${cx + 58} ${cy + 12} l 10 4`} />
    </g>
    <Cheeks x={cx} y={cy + 40} gap={92} color={BLUSH_OTHER} o={0.45} />
    <MouthShape x={cx} y={cy + 48} kind={mouth} />
  </g>
);
