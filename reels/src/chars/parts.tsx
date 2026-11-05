import React from 'react';
import {Rough, polygon, circle, ellipse} from '../lib/rough';
import {INK, SKIN} from '../lib/palette';

type P = [number, number];

/** 관절 두 개짜리 팔·다리를 굵기 있는 다각형으로 만든다 */
export const limbPoly = (pts: P[], w: number): P[] => {
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * (w / 2);
    const ny = (dx / len) * (w / 2);
    left.push([pts[i][0] + nx, pts[i][1] + ny]);
    right.push([pts[i][0] - nx, pts[i][1] - ny]);
  }
  return [...left, ...right.reverse()];
};

/** 각도(도, 0 = 아래로 늘어뜨림, +는 몸 바깥/앞쪽으로)와 길이로 끝점 계산 */
export const reach = (from: P, deg: number, len: number): P => {
  const r = (deg * Math.PI) / 180;
  return [from[0] + Math.sin(r) * len, from[1] + Math.cos(r) * len];
};

/** 2관절 IK: 어깨에서 목표점까지 팔꿈치 위치를 구한다. bend = 1/-1 (굽는 방향) */
export const ik = (sh: P, target: P, l1: number, l2: number, bend: 1 | -1): [P, P] => {
  const dx = target[0] - sh[0];
  const dy = target[1] - sh[1];
  let d = Math.hypot(dx, dy);
  const maxd = l1 + l2 - 0.5;
  let t: P = target;
  if (d > maxd) {
    t = [sh[0] + (dx / d) * maxd, sh[1] + (dy / d) * maxd];
    d = maxd;
  }
  const a = Math.atan2(dy, dx);
  const cosB = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const ang = a + bend * Math.acos(cosB);
  return [[sh[0] + Math.cos(ang) * l1, sh[1] + Math.sin(ang) * l1], t];
};

/** 월드 좌표 → 캐릭터 로컬 좌표 */
export const toLocal = (w: P, x: number, y: number, scale: number, flip?: boolean): P => [
  ((w[0] - x) / scale) * (flip ? -1 : 1),
  (w[1] - y) / scale,
];

export const Limb: React.FC<{
  pts: P[];
  w: number;
  color: string;
  seed: number;
  hand?: number;
  handColor?: string;
}> = ({pts, w, color, seed, hand, handColor = SKIN}) => {
  const end = pts[pts.length - 1];
  return (
    <g>
      <Rough shape={polygon(limbPoly(pts, w))} seed={seed} solid={color} o={{fill: color, hachureGap: 8, strokeWidth: 5}} />
      {hand ? (
        <Rough shape={circle(end[0], end[1], hand)} seed={seed + 3} solid={handColor} o={{fill: undefined, strokeWidth: 5}} />
      ) : null}
    </g>
  );
};

/** 점 눈 */
export const DotEyes: React.FC<{x: number; y: number; gap: number; r?: number; closed?: boolean; look?: number}> = ({
  x,
  y,
  gap,
  r = 6.5,
  closed,
  look = 0,
}) =>
  closed ? (
    <g stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round">
      <path d={`M ${x - gap / 2 - 11} ${y} q 11 9 22 0`} />
      <path d={`M ${x + gap / 2 - 11} ${y} q 11 9 22 0`} />
    </g>
  ) : (
    <g fill={INK}>
      <circle cx={x - gap / 2 + look} cy={y} r={r} />
      <circle cx={x + gap / 2 + look} cy={y} r={r} />
    </g>
  );

export const Cheeks: React.FC<{x: number; y: number; gap: number; color: string; w?: number; o?: number}> = ({
  x,
  y,
  gap,
  color,
  w = 30,
  o = 0.75,
}) => (
  <g opacity={o}>
    <Rough shape={ellipse(x - gap / 2, y, w, w * 0.6)} seed={77} solid={color} o={{stroke: 'none', fill: color, fillStyle: 'solid'}} />
    <Rough shape={ellipse(x + gap / 2, y, w, w * 0.6)} seed={78} solid={color} o={{stroke: 'none', fill: color, fillStyle: 'solid'}} />
  </g>
);

export type Mouth = 'smile' | 'grin' | 'o' | 'flat' | 'sad' | 'sing';
export const MouthShape: React.FC<{x: number; y: number; kind: Mouth; s?: number}> = ({x, y, kind, s = 1}) => {
  const common = {stroke: INK, strokeWidth: 5, fill: 'none', strokeLinecap: 'round' as const};
  switch (kind) {
    case 'smile':
      return <path d={`M ${x - 12 * s} ${y} q ${12 * s} ${11 * s} ${24 * s} 0`} {...common} />;
    case 'grin':
      return <path d={`M ${x - 16 * s} ${y - 2} q ${16 * s} ${18 * s} ${32 * s} 0 z`} {...common} fill={INK} />;
    case 'o':
      return <ellipse cx={x} cy={y + 3} rx={7 * s} ry={9 * s} {...common} fill={INK} />;
    case 'sing':
      return <ellipse cx={x} cy={y + 4} rx={10 * s} ry={13 * s} {...common} fill={INK} />;
    case 'sad':
      return <path d={`M ${x - 11 * s} ${y + 6} q ${11 * s} ${-9 * s} ${22 * s} 0`} {...common} />;
    case 'flat':
    default:
      return <path d={`M ${x - 10 * s} ${y + 2} l ${20 * s} 0`} {...common} />;
  }
};
