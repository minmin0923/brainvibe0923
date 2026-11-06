import React from 'react';
import {Rough, circle, line} from '../../lib/rough';
import {INK, PAPER} from '../../lib/palette';

/** "HH:MM" → [시침 각도, 분침 각도] (12시 = 0도, 시계 방향) */
export const handAngles = (time: string): [number, number] => {
  const [h, m] = time.split(':').map(Number);
  return [((h % 12) + m / 60) * 30, m * 6];
};

/** 손그림 벽시계. 바늘 각도는 time에서 계산한다. 아빠 쪽·엄마 쪽에 같은 시계를 쓴다. */
export const WallClock: React.FC<{x: number; y: number; r?: number; time: string; face?: string; ink?: string; seed?: number}> = ({
  x,
  y,
  r = 70,
  time,
  face = PAPER,
  ink = INK,
  seed = 1900,
}) => {
  const [ha, ma] = handAngles(time);
  const tip = (deg: number, len: number): [number, number] => [x + Math.sin((deg * Math.PI) / 180) * len, y - Math.cos((deg * Math.PI) / 180) * len];
  const [hx, hy] = tip(ha, r * 0.5);
  const [mx, my] = tip(ma, r * 0.78);
  return (
    <g>
      <Rough shape={circle(x, y, r * 2)} seed={seed} solid={face === 'none' ? undefined : face} base={face === 'none' ? null : undefined} o={{stroke: ink, strokeWidth: 6, fill: undefined}} />
      {Array.from({length: 12}).map((_, i) => {
        const [ax, ay] = tip(i * 30, r * 0.8);
        const [bx, by] = tip(i * 30, r * (i % 3 === 0 ? 0.62 : 0.7));
        return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={ink} strokeWidth={i % 3 === 0 ? 5 : 3} strokeLinecap="round" />;
      })}
      <Rough shape={line(x, y, hx, hy)} seed={seed + 1} o={{stroke: ink, strokeWidth: 8}} />
      <Rough shape={line(x, y, mx, my)} seed={seed + 2} o={{stroke: ink, strokeWidth: 5}} />
      <circle cx={x} cy={y} r={6} fill={ink} />
    </g>
  );
};
