import React, {createContext, useContext, useMemo} from 'react';
import rough from 'roughjs';
import type {Options} from 'roughjs/bin/core';
import {useCurrentFrame} from 'remotion';
import {INK, PAPER} from './palette';

const gen = rough.generator();

/** 라인 보일 주기: 캐릭터·소품 4프레임, 배경 12프레임 */
export type Boil = 'char' | 'bg' | 'none';
const RATE: Record<Exclude<Boil, 'none'>, number> = {char: 4, bg: 12};

/** 정지 프레임(카드 문구 등)에서 보일을 끄고 싶을 때 쓰는 고정 프레임 */
const FrozenFrame = createContext<number | null>(null);
export const FreezeBoil: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => (
  <FrozenFrame.Provider value={at}>{children}</FrozenFrame.Provider>
);

export const useBoilSeed = (seed: number, boil: Boil) => {
  const frame = useCurrentFrame();
  const frozen = useContext(FrozenFrame);
  if (boil === 'none') return seed;
  const f = frozen ?? frame;
  // 4가지 변형을 순환시키면 떨림이 '살아 있는' 정도로만 유지된다
  return seed + (Math.floor(f / RATE[boil]) % 4) * 101;
};

/** 캐릭터 동작용 on twos(2프레임 단위) 프레임 */
export const useTwos = () => {
  const f = useCurrentFrame();
  return f - (f % 2);
};

export const BASE: Options = {
  roughness: 1.6,
  bowing: 1.2,
  stroke: INK,
  strokeWidth: 6,
  fillStyle: 'hachure',
  hachureGap: 7,
  hachureAngle: -41,
  fillWeight: 2.6,
  disableMultiStroke: false,
};

type Shape =
  | {k: 'rect'; x: number; y: number; w: number; h: number}
  | {k: 'ellipse'; x: number; y: number; w: number; h: number}
  | {k: 'circle'; x: number; y: number; d: number}
  | {k: 'line'; x1: number; y1: number; x2: number; y2: number}
  | {k: 'polygon'; pts: [number, number][]}
  | {k: 'curve'; pts: [number, number][]}
  | {k: 'linear'; pts: [number, number][]}
  | {k: 'path'; d: string};

const draw = (s: Shape, o: Options) => {
  switch (s.k) {
    case 'rect':
      return gen.rectangle(s.x, s.y, s.w, s.h, o);
    case 'ellipse':
      return gen.ellipse(s.x, s.y, s.w, s.h, o);
    case 'circle':
      return gen.circle(s.x, s.y, s.d, o);
    case 'line':
      return gen.line(s.x1, s.y1, s.x2, s.y2, o);
    case 'polygon':
      return gen.polygon(s.pts, o);
    case 'curve':
      return gen.curve(s.pts, o);
    case 'linear':
      return gen.linearPath(s.pts, o);
    case 'path':
      return gen.path(s.d, o);
  }
};

const shapeKey = (s: Shape) => JSON.stringify(s);

export type RoughProps = {
  shape: Shape;
  seed: number;
  boil?: Boil;
  /** 크레용 질감 단색 바탕(가장자리를 feDisplacementMap으로 거칠게) */
  solid?: string;
  solidOpacity?: number;
  o?: Options;
  opacity?: number;
  /** 크레용 틈 사이로 보이는 바탕(기본: 캐릭터는 종이색, 배경은 투명) */
  base?: string | null;
  /** 0~1: stroke-dashoffset로 선이 그려지는 정도 */
  drawn?: number;
  style?: React.CSSProperties;
};

/** roughjs 손그림 도형. 보일(seed 교체)과 크레용 바탕을 함께 처리한다. */
export const Rough: React.FC<RoughProps> = ({
  shape,
  seed,
  boil = 'char',
  solid,
  solidOpacity = 1,
  o,
  opacity = 1,
  drawn,
  style,
  base,
}) => {
  const s = useBoilSeed(seed, boil);
  const key = shapeKey(shape);
  const paths = useMemo(() => {
    const opts: Options = {...BASE, ...o, seed: s};
    return gen.toPaths(draw(shape, opts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, s, JSON.stringify(o)]);
  const solidPaths = useMemo(() => {
    if (!solid) return null;
    return gen.toPaths(
      draw(shape, {...BASE, ...o, seed: s + 7, fill: solid, fillStyle: 'solid', stroke: 'none', roughness: 0.6}),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, s, solid, JSON.stringify(o)]);

  const dash = drawn === undefined ? undefined : {strokeDasharray: 1, strokeDashoffset: 1 - drawn};
  return (
    <g opacity={opacity} style={style}>
      {solidPaths && (base ?? (boil === 'char' ? PAPER : null)) && (
        <g opacity={solidOpacity}>
          {solidPaths.map((p, i) => (
            <path key={i} d={p.d} fill={(base ?? PAPER) as string} stroke="none" />
          ))}
        </g>
      )}
      {solidPaths && (
        <g filter="url(#crayon-fill)" opacity={solidOpacity}>
          {solidPaths.map((p, i) => (
            <path key={i} d={p.d} fill={p.fill ?? 'none'} stroke="none" />
          ))}
        </g>
      )}
      <g filter="url(#crayon-line)">
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.fill ?? 'none'}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={dash ? 1 : undefined}
            style={dash}
          />
        ))}
      </g>
    </g>
  );
};

// 짧게 쓰기 위한 헬퍼
export const rect = (x: number, y: number, w: number, h: number): Shape => ({k: 'rect', x, y, w, h});
export const ellipse = (x: number, y: number, w: number, h: number): Shape => ({k: 'ellipse', x, y, w, h});
export const circle = (x: number, y: number, d: number): Shape => ({k: 'circle', x, y, d});
export const line = (x1: number, y1: number, x2: number, y2: number): Shape => ({k: 'line', x1, y1, x2, y2});
export const polygon = (pts: [number, number][]): Shape => ({k: 'polygon', pts});
export const curve = (pts: [number, number][]): Shape => ({k: 'curve', pts});
export const linear = (pts: [number, number][]): Shape => ({k: 'linear', pts});
export const path = (d: string): Shape => ({k: 'path', d});
