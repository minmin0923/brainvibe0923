import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, curve, line, path, rect} from '../lib/rough';
import {PAPER, PINK, PLAZA} from '../lib/palette';
import {Candle, CandleDefs, litAt, plazaCandles} from '../lib/candles';
import {Narration} from '../lib/Caption';
import {SCENES} from '../timeline';

const DUR = SCENES.S10.to - SCENES.S10.from;

/** 광화문: 전통 지붕 실루엣 + 넓은 광장으로만 단순화 */
export const Gate: React.FC<{x: number; y: number; s?: number; boil?: 'bg' | 'char'}> = ({x, y, s = 1, boil = 'bg'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* 석축 + 홍예문 3개 */}
    <Rough boil={boil} shape={rect(-330, 120, 660, 200)} seed={1} solid={PLAZA.shadow} o={{fill: PLAZA.violet, hachureGap: 12, strokeWidth: 5}} />
    {[-170, 0, 170].map((ax, i) => (
      <Rough
        key={i}
        boil={boil}
        shape={path(`M ${ax - 50} 320 L ${ax - 50} 220 Q ${ax} 160 ${ax + 50} 220 L ${ax + 50} 320 Z`)}
        seed={2 + i}
        solid={PLAZA.night}
        o={{strokeWidth: 5}}
      />
    ))}
    {/* 아래층 누각 */}
    <Rough boil={boil} shape={rect(-240, 40, 480, 80)} seed={6} solid={PLAZA.shadow} o={{strokeWidth: 5}} />
    {[-200, -120, -40, 40, 120, 200].map((cx, i) => (
      <Rough key={i} boil={boil} shape={rect(cx - 6, 44, 12, 74)} seed={7 + i} solid={PLAZA.violet} o={{strokeWidth: 3}} />
    ))}
    {/* 아래 지붕 (처마 끝이 들림) */}
    <Rough
      boil={boil}
      shape={path('M -380 30 Q -330 46 -260 22 L -200 -30 L 200 -30 L 260 22 Q 330 46 380 30 Q 320 60 250 50 L -250 50 Q -320 60 -380 30 Z')}
      seed={14}
      solid={PLAZA.shadow}
      o={{fill: PLAZA.night, hachureGap: 10}}
    />
    {/* 위층 */}
    <Rough boil={boil} shape={rect(-180, -90, 360, 64)} seed={15} solid={PLAZA.shadow} o={{strokeWidth: 5}} />
    <Rough
      boil={boil}
      shape={path('M -300 -96 Q -250 -80 -190 -104 L -120 -170 L 120 -170 L 190 -104 Q 250 -80 300 -96 Q 250 -66 180 -74 L -180 -74 Q -250 -66 -300 -96 Z')}
      seed={16}
      solid={PLAZA.shadow}
      o={{fill: PLAZA.night, hachureGap: 10}}
    />
  </g>
);

/** 바람에 흔들리는 염원 카드 줄 */
export const CardLine: React.FC<{y: number; sag?: number; n?: number; seed?: number; pinkAt?: number}> = ({
  y,
  sag = 70,
  n = 15,
  seed = 40,
  pinkAt = -1,
}) => {
  const f = useCurrentFrame();
  const pts: [number, number][] = Array.from({length: 9}).map((_, i) => {
    const t = i / 8;
    return [-40 + t * 1160, y + Math.sin(t * Math.PI) * sag];
  });
  return (
    <g>
      <Rough boil="bg" shape={curve(pts)} seed={seed} o={{strokeWidth: 3, stroke: PLAZA.halo, roughness: 0.8}} opacity={0.7} />
      {Array.from({length: n}).map((_, i) => {
        const t = (i + 0.5) / n;
        const cx = -40 + t * 1160;
        const cy = y + Math.sin(t * Math.PI) * sag;
        const sw = Math.sin(f / 9 + i * 1.3) * 9;
        const isPink = i === pinkAt;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) rotate(${sw})`}>
            <line x1={0} y1={0} x2={0} y2={10} stroke={PLAZA.halo} strokeWidth={2} />
            <Rough
              boil="char"
              shape={rect(-22, 10, 44, 58)}
              seed={seed + 10 + i}
              solid={isPink ? PINK.crayon : i % 2 ? PLAZA.halo : PAPER}
              o={{strokeWidth: 3, fill: undefined}}
            />
          </g>
        );
      })}
    </g>
  );
};

/** S10. 광화문, 불이 켜지다 — 왼쪽 아래에서 오른쪽 위로 촛불이 0.08초 간격으로 번져 나간다. */
export const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const spots = useMemo(() => plazaCandles(64, {x0: -60, x1: 1000, y0: 1180, y1: 1900}, 's10'), []);
  const ranked = useMemo(() => [...spots].sort((a, b) => a.order - b.order).map((c) => c.id), [spots]);
  const rankOf = (id: number) => ranked.indexOf(id);
  return (
    <AbsoluteFill>
      <Paper color={PLAZA.night} />
      {/* 카메라 천천히 위로 틸트 */}
      <Camera dur={DUR} from={{s: 1.04, y: -70}} to={{s: 1.04, y: 30}}>
        <Wash
          blobs={[
            {x: 540, y: 1000, r: 620, color: PLAZA.violet, o: 0.85},
            {x: 150, y: 300, r: 380, color: PLAZA.violet, o: 0.4},
            {x: 300, y: 1700, r: 500, color: PLAZA.flame, o: 0.12 + 0.18 * Math.min(1, frame / DUR)},
          ]}
          blur={80}
          blend="screen"
        />
        <Stage>
          <CandleDefs />
          <CardLine y={500} sag={70} n={14} seed={40} pinkAt={9} />
          <Gate x={470} y={830} s={1.05} />
          {/* 광장 바닥 */}
          <Rough boil="bg" shape={path('M -60 1170 L 1140 1170 L 1140 2000 L -60 2000 Z')} seed={30} solid={PLAZA.shadow} o={{fill: PLAZA.night, hachureGap: 18, strokeWidth: 4}} />
          {/* 광장 바닥 원근선 */}
          {[-700, -100, 1040, 1640].map((bx, i) => (
            <Rough key={i} boil="bg" shape={line(470 + (bx - 470) * 0.3, 1180, bx, 2000)} seed={50 + i} o={{stroke: PLAZA.violet, strokeWidth: 4}} opacity={0.6} />
          ))}
          {/* 사람들 실루엣(촛불을 든) */}
          {spots.map((c) => {
            const lit = litAt(frame, 10, rankOf(c.id), 2.4);
            return (
              <g key={`p${c.id}`} opacity={0.35 + lit * 0.5}>
                <ellipse cx={c.x} cy={c.y - 70 * c.s} rx={22 * c.s} ry={24 * c.s} fill={PLAZA.night} />
                <path
                  d={`M ${c.x - 40 * c.s} ${c.y + 30 * c.s} Q ${c.x} ${c.y - 70 * c.s} ${c.x + 40 * c.s} ${c.y + 30 * c.s} Z`}
                  fill={PLAZA.night}
                />
              </g>
            );
          })}
          {spots.map((c) => (
            <Candle key={c.id} id={c.id} x={c.x + 14 * c.s} y={c.y - 10 * c.s} s={c.s} lit={litAt(frame, 10, rankOf(c.id), 2.4)} />
          ))}
        </Stage>
      </Camera>
      <Narration lines={['광화문,', '의정부의 염원이 도착했습니다']} y={290} from={14} to={DUR + 8} />
    </AbsoluteFill>
  );
};
