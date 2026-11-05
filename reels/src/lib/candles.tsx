import React from 'react';
import {interpolate, random, useCurrentFrame, Easing} from 'remotion';
import {noise2D} from '@remotion/noise';
import {PLAZA} from './palette';

/** 공통 그라디언트 정의 (Stage 안에 한 번) */
export const CandleDefs: React.FC = () => (
  <defs>
    <radialGradient id="candle-halo">
      <stop offset="0%" stopColor={PLAZA.halo} stopOpacity={0.75} />
      <stop offset="35%" stopColor={PLAZA.halo} stopOpacity={0.28} />
      <stop offset="100%" stopColor={PLAZA.halo} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="candle-core">
      <stop offset="0%" stopColor={PLAZA.halo} stopOpacity={1} />
      <stop offset="60%" stopColor={PLAZA.flame} stopOpacity={1} />
      <stop offset="100%" stopColor={PLAZA.flame} stopOpacity={0} />
    </radialGradient>
  </defs>
);

/** 촛불마다 다른 주기로 일렁이는 밝기(noise2D) */
export const useFlicker = (id: number, speed = 0.08) => {
  const f = useCurrentFrame();
  return 0.78 + 0.22 * noise2D(`c${id}`, f * speed, id * 0.37);
};

/** 촛불 한 개. lit: 0~1 (켜지며 후광 scale 0→1) */
export const Candle: React.FC<{x: number; y: number; s?: number; lit?: number; id: number; halo?: number; cup?: boolean}> = ({
  x,
  y,
  s = 1,
  lit = 1,
  id,
  halo = 1,
  cup = true,
}) => {
  const fl = useFlicker(id);
  const f = useCurrentFrame();
  if (lit <= 0) {
    return cup ? (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <rect x={-9} y={-6} width={18} height={26} rx={4} fill={PLAZA.violet} opacity={0.8} />
      </g>
    ) : null;
  }
  const sway = noise2D(`s${id}`, f * 0.1, 0) * 3;
  const hs = Easing.out(Easing.back(2))(Math.min(1, lit));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={-14} r={70 * halo * hs * (0.9 + fl * 0.15)} fill="url(#candle-halo)" opacity={fl} />
      {cup && <rect x={-9} y={-6} width={18} height={26} rx={4} fill={PLAZA.halo} opacity={0.9} />}
      <path
        d={`M 0 ${-30 * hs} C ${7 + sway} ${-18 * hs}, 7 -6, 0 -4 C -7 -6, ${-7 + sway} ${-18 * hs}, 0 ${-30 * hs} Z`}
        fill="url(#candle-core)"
        opacity={Math.min(1, lit * 2) * (0.85 + fl * 0.15)}
      />
    </g>
  );
};

export type CandleSpot = {x: number; y: number; s: number; id: number; order: number};

/** 원근이 있는 광장 위 촛불 배치. far(위)일수록 작고 촘촘하다. */
export const plazaCandles = (
  n: number,
  area: {x0: number; x1: number; y0: number; y1: number},
  seed = 'p',
): CandleSpot[] => {
  const spots: CandleSpot[] = [];
  for (let i = 0; i < n; i++) {
    const depth = Math.pow(random(`${seed}y${i}`), 0.8); // 0 = 먼 곳
    const y = area.y0 + depth * (area.y1 - area.y0);
    const spread = 0.55 + depth * 0.45;
    const cx = (area.x0 + area.x1) / 2;
    const x = cx + (random(`${seed}x${i}`) - 0.5) * (area.x1 - area.x0) * spread;
    const s = 0.35 + depth * 0.9;
    // 왼쪽 아래 → 오른쪽 위 순서
    const order = (1 - depth) * 0.6 + ((x - area.x0) / (area.x1 - area.x0)) * 0.4 + random(`${seed}o${i}`) * 0.08;
    spots.push({x, y, s, id: i, order});
  }
  spots.sort((a, b) => a.y - b.y);
  return spots;
};

/** 켜지는 순서대로 lit 값 계산 (간격 frames) */
export const litAt = (frame: number, start: number, rank: number, gap: number) =>
  interpolate(frame, [start + rank * gap, start + rank * gap + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
