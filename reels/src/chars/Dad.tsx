import React from 'react';
import {Rough, circle, path, ellipse, line, rect} from '../lib/rough';
import {BLUSH_OTHER, COAT, COLD_SKIN, DAWN, DAY, EP2, HAIR, INK, PAPER, SKIN} from '../lib/palette';
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
 * 2탄용 옷차림·색조.
 * version: 'ep1' = 1탄(풀린 넥타이) / 'out' = 출근(넥타이 단정, 머리 정돈) / 'home' = 퇴근(넥타이 느슨, 앞머리 흐트러짐, 어깨 구겨짐, 그늘 선 2개)
 * tone: 'cold' = 바깥(형광등·가로등 아래, 따뜻한 색 없음) / 'warm' = 집 안
 */
export type DadLook = {version?: 'ep1' | 'out' | 'home'; tone?: 'warm' | 'cold'};
const skinOf = (tone?: string) => (tone === 'cold' ? COLD_SKIN : SKIN);

/**
 * 아빠(30대 후반). 원점 = 두 발 사이 바닥, 키 약 860.
 * 남색 코트, 느슨하게 풀린 넥타이, 낡은 서류가방, 눈 밑 연한 그늘 선.
 */
export const Dad: React.FC<{x: number; y: number; scale?: number; flip?: boolean; pose?: DadPose; seed?: number} & DadLook> = ({
  x,
  y,
  scale = 1,
  flip,
  pose = {},
  seed = 500,
  version = 'ep1',
  tone = 'warm',
}) => {
  const skin = skinOf(tone);
  const tieColor = tone === 'cold' ? EP2.subwayPale : DAY.amber;
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
        {version === 'out' ? (
          // 단정한 넥타이: 목까지 조인 매듭 + 곧게 내려옴
          <Rough shape={path('M -12 -608 L 12 -608 L 22 -430 L 0 -404 L -22 -430 Z')} seed={seed + 6} solid={tieColor} o={{fill: tieColor, strokeWidth: 4}} />
        ) : (
          <Rough shape={path('M -8 -566 L 14 -566 L 26 -420 L 6 -396 L -6 -424 Z')} seed={seed + 6} solid={tieColor} o={{fill: tieColor, strokeWidth: 4}} />
        )}
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
        {version === 'home' && (
          // 구겨진 코트 어깨
          <g>
            <Rough shape={path('M -104 -590 q 14 10 28 0 q 10 -8 20 2')} seed={seed + 40} o={{strokeWidth: 3}} />
            <Rough shape={path('M 70 -596 q 12 10 24 -2')} seed={seed + 41} o={{strokeWidth: 3}} />
            <Rough shape={path('M -100 -540 l 18 12')} seed={seed + 42} o={{strokeWidth: 3}} />
          </g>
        )}
      </g>
      {/* 팔 */}
      <Limb pts={[shL, elL, hdL]} w={60} color={COAT} seed={seed + 11} hand={50} handColor={skin} />
      <Limb pts={[shR, elR, hdR]} w={60} color={COAT} seed={seed + 15} hand={50} handColor={skin} />
      {briefcase && (
        <g>
          <Rough shape={rect(hdR[0] - 70, hdR[1] + 16, 140, 100)} seed={seed + 19} solid={tone === 'cold' ? EP2.officeNight : DAY.amber} o={{fill: INK, hachureGap: 12}} />
          <Rough shape={path(`M ${hdR[0] - 24} ${hdR[1] + 18} q 24 -30 48 0`)} seed={seed + 20} o={{strokeWidth: 5}} />
        </g>
      )}
      {/* 목 + 머리 */}
      <g transform={`translate(0 ${drop}) rotate(${headTilt} 0 -630)`}>
        <Rough shape={rect(-22, -650, 44, 40)} seed={seed + 21} solid={skin} o={{strokeWidth: 4}} />
        <DadHead cx={0} cy={-718} eyes={eyes} look={look} mouth={mouth} seed={seed + 30} version={version} tone={tone} />
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
  /** 0~1: 눈가 반짝임 + 볼터치 번짐(눈물 방울은 그리지 않음) */
  welling?: number;
} & DadLook> = ({cx, cy, eyes = 'open', look = 0, mouth = 'smile', seed = 530, tearful, welling = 0, version = 'ep1', tone = 'warm'}) => (
  <g>
    <Rough shape={circle(cx, cy, 176)} seed={seed} solid={skinOf(tone)} />
    {/* 짧은 머리 */}
    <Rough
      shape={path(
        `M ${cx - 88} ${cy + 2} C ${cx - 96} ${cy - 112}, ${cx + 96} ${cy - 112}, ${cx + 88} ${cy + 2} C ${cx + 80} ${cy - 40}, ${cx + 40} ${cy - 58}, ${cx - 20} ${cy - 46} C ${cx - 50} ${cy - 40}, ${cx - 76} ${cy - 30}, ${cx - 88} ${cy + 2} Z`,
      )}
      seed={seed + 1}
      solid={HAIR}
      o={{fill: HAIR, hachureGap: 6}}
    />
    {version === 'home' && (
      // 흐트러진 앞머리
      <g stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round">
        <path d={`M ${cx - 26} ${cy - 44} q -8 22 4 34`} />
        <path d={`M ${cx - 6} ${cy - 46} q 6 18 -4 28`} />
      </g>
    )}
    <DotEyes x={cx} y={cy + 8} gap={62} closed={eyes === 'closed'} look={look} r={7} />
    {/* 눈 밑 연한 그늘 선 */}
    <g stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.28}>
      <path d={`M ${cx - 42} ${cy + 30} q 11 4 22 0`} />
      <path d={`M ${cx + 20} ${cy + 30} q 11 4 22 0`} />
      {version === 'home' && (
        <>
          <path d={`M ${cx - 40} ${cy + 38} q 9 4 18 0`} />
          <path d={`M ${cx + 22} ${cy + 38} q 9 4 18 0`} />
        </>
      )}
    </g>
    {tone === 'cold' ? (
      <Cheeks x={cx} y={cy + 40} gap={104} color={EP2.subwayPale} o={0.3} />
    ) : (
      <Cheeks x={cx} y={cy + 40} gap={104 + welling * 10} color={BLUSH_OTHER} o={0.45 + welling * 0.3} w={30 + welling * 14} />
    )}
    {welling > 0 && (
      // 눈가 반짝임
      <g fill={PAPER} opacity={welling}>
        <circle cx={cx - 27 + look} cy={cy + 3} r={3.2} />
        <circle cx={cx + 35 + look} cy={cy + 3} r={3.2} />
        <path d={`M ${cx - 46} ${cy + 18} q 18 8 36 0`} stroke={PAPER} strokeWidth={3} fill="none" />
        <path d={`M ${cx + 16} ${cy + 18} q 18 8 36 0`} stroke={PAPER} strokeWidth={3} fill="none" />
      </g>
    )}
    <MouthShape x={cx} y={cy + 50} kind={mouth} />
    {tearful && (
      <g fill={DAWN.pale}>
        <ellipse cx={cx - 36} cy={cy + 40} rx={5} ry={9} />
      </g>
    )}
  </g>
);
