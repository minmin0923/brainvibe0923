import React from 'react';
import {Rough, circle, ellipse, path, rect, line} from '../lib/rough';
import {BLUSH_OTHER, CARDIGAN, DAWN, DAY, HAIR, INK, PAPER, PINK, SILVER, SKIN} from '../lib/palette';
import {Cheeks, DotEyes, MouthShape, type Mouth} from './parts';

/**
 * 손. 원점 = 손끝(펜/크레용 끝 근처). rot 도 단위.
 * kind: grandma(주름), vendor(장갑 벗은 손), child(작은 손), adult
 */
export const Hand: React.FC<{
  x: number;
  y: number;
  rot?: number;
  s?: number;
  kind?: 'grandma' | 'vendor' | 'child' | 'adult';
  sleeve?: string;
  tool?: 'pen' | 'crayon' | 'none';
  seed?: number;
}> = ({x, y, rot = 0, s = 1, kind = 'adult', sleeve = CARDIGAN, tool = 'pen', seed = 1200}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {/* 소매 */}
    <Rough shape={path('M 120 120 L 520 260 L 470 420 L 70 270 Z')} seed={seed} solid={sleeve} o={{fill: sleeve, hachureGap: 9}} />
    {/* 도구 */}
    {tool === 'pen' && <Rough shape={path('M 0 0 L 12 -8 L 150 120 L 132 138 Z')} seed={seed + 1} solid={INK} o={{fill: INK, strokeWidth: 4}} />}
    {tool === 'crayon' && (
      <g>
        <Rough shape={path('M 0 0 L 22 -12 L 150 106 L 126 132 Z')} seed={seed + 1} solid={PINK.line8} o={{fill: PINK.line8, strokeWidth: 4}} />
        <Rough shape={path('M 70 44 L 92 26 L 130 64 L 108 82 Z')} seed={seed + 2} solid={PAPER} o={{strokeWidth: 3}} />
      </g>
    )}
    {/* 손바닥/손등 */}
    <Rough shape={ellipse(150, 170, 180, 140)} seed={seed + 3} solid={SKIN} />
    {/* 손가락(펜을 쥔) */}
    <Rough shape={ellipse(78, 92, 92, 44)} seed={seed + 4} solid={SKIN} o={{strokeWidth: 5}} style={{transform: 'rotate(40deg)', transformOrigin: '78px 92px'}} />
    <Rough shape={ellipse(96, 140, 96, 44)} seed={seed + 5} solid={SKIN} o={{strokeWidth: 5}} style={{transform: 'rotate(20deg)', transformOrigin: '96px 140px'}} />
    <Rough shape={ellipse(118, 186, 88, 40)} seed={seed + 6} solid={SKIN} o={{strokeWidth: 5}} />
    {kind === 'grandma' && (
      <g stroke={INK} strokeWidth={3} fill="none" opacity={0.5} strokeLinecap="round">
        <path d="M 150 150 q 20 8 40 0 M 160 180 q 20 8 40 0 M 170 210 q 16 6 32 0" />
      </g>
    )}
    {kind === 'vendor' && (
      // 벗어 둔 고무장갑 자국(손목의 고무줄 자국)
      <Rough shape={line(210, 230, 250, 150)} seed={seed + 7} o={{stroke: DAY.amber, strokeWidth: 6}} />
    )}
  </g>
);

export type HairStyle = 'short' | 'bob' | 'cap' | 'bun';

/** 군중 얼굴(학생·상인·어르신 등). 실존 인물과 닮지 않은 단순형 */
export const PersonHead: React.FC<{
  cx: number;
  cy: number;
  hair: HairStyle;
  mouth?: Mouth;
  eyes?: 'open' | 'closed';
  seed?: number;
  glasses?: boolean;
}> = ({cx, cy, hair, mouth = 'sing', eyes = 'open', seed = 1400, glasses}) => {
  const hairColor = hair === 'bun' ? SILVER : HAIR;
  return (
    <g>
      {hair === 'bun' && <Rough shape={circle(cx, cy - 92, 72)} seed={seed} solid={SILVER} o={{fill: SILVER}} />}
      {hair === 'bob' && (
        <Rough
          shape={path(`M ${cx - 92} ${cy + 50} C ${cx - 110} ${cy - 110}, ${cx + 110} ${cy - 110}, ${cx + 92} ${cy + 50} Z`)}
          seed={seed + 1}
          solid={HAIR}
          o={{fill: HAIR}}
        />
      )}
      <Rough shape={circle(cx, cy, 164)} seed={seed + 2} solid={SKIN} />
      {hair !== 'cap' && (
        <Rough
          shape={path(
            `M ${cx - 82} ${cy + 4} C ${cx - 86} ${cy - 104}, ${cx + 86} ${cy - 104}, ${cx + 82} ${cy + 4} C ${cx + 60} ${cy - 36}, ${cx - 60} ${cy - 36}, ${cx - 82} ${cy + 4} Z`,
          )}
          seed={seed + 3}
          solid={hairColor}
          o={{fill: hairColor}}
        />
      )}
      {hair === 'cap' && (
        <g>
          <Rough shape={path(`M ${cx - 86} ${cy - 10} C ${cx - 86} ${cy - 110}, ${cx + 86} ${cy - 110}, ${cx + 86} ${cy - 10} Z`)} seed={seed + 4} solid={DAWN.mid} o={{fill: DAWN.mid}} />
          <Rough shape={rect(cx - 96, cy - 22, 192, 22)} seed={seed + 5} solid={DAWN.deep} o={{fill: DAWN.deep}} />
        </g>
      )}
      <DotEyes x={cx} y={cy + 10} gap={56} closed={eyes === 'closed'} />
      {glasses && (
        <g stroke={INK} strokeWidth={4} fill="none">
          <circle cx={cx - 28} cy={cy + 10} r={20} />
          <circle cx={cx + 28} cy={cy + 10} r={20} />
        </g>
      )}
      <Cheeks x={cx} y={cy + 36} gap={96} color={BLUSH_OTHER} o={0.5} />
      <MouthShape x={cx} y={cy + 44} kind={mouth} />
    </g>
  );
};

/** 어두운 실루엣 사람(승객·관객) */
export const Silhouette: React.FC<{x: number; y: number; s?: number; color: string; seed?: number}> = ({x, y, s = 1, color, seed = 1500}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rough boil="bg" shape={circle(0, -250, 130)} seed={seed} solid={color} o={{fill: color, stroke: color}} />
    <Rough boil="bg" shape={path('M -120 0 Q -120 -170 0 -175 Q 120 -170 120 0 Z')} seed={seed + 1} solid={color} o={{fill: color, stroke: color}} />
  </g>
);

