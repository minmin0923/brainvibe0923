import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Rough, path} from '../../lib/rough';
import {INK, PAPER} from '../../lib/palette';
import {PEN} from '../../lib/Caption';

/**
 * 손그림 말풍선(실제 메신저 화면을 흉내 내지 않는다).
 * typeFrom이 있으면 그 프레임부터 글자가 한 자씩 타이핑된다. side: 왼쪽(받은 말) / 오른쪽(보낸 말)
 */
export const ChatBubble: React.FC<{
  x: number;
  y: number;
  w: number;
  text: string;
  side?: 'left' | 'right';
  from?: number;
  typeFrom?: number;
  typeRate?: number;
  fill?: string;
  size?: number;
  seed?: number;
}> = ({x, y, w, text, side = 'left', from = 0, typeFrom, typeRate = 1.5, fill = PAPER, size = 62, seed = 2000}) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const pop = interpolate(f, [from, from + 6], [0.7, 1], {extrapolateRight: 'clamp'});
  const shown = typeFrom === undefined ? text : text.slice(0, Math.max(0, Math.floor((f - typeFrom) / typeRate)));
  const h = size * 1.6;
  const tail = side === 'left' ? `M ${x + 30} ${y + h} l -18 34 l 46 -34` : `M ${x + w - 30} ${y + h} l 18 34 l -46 -34`;
  return (
    <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${pop}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
      <Rough
        shape={path(`M ${x + 30} ${y} L ${x + w - 30} ${y} Q ${x + w} ${y} ${x + w} ${y + 30} L ${x + w} ${y + h - 30} Q ${x + w} ${y + h} ${x + w - 30} ${y + h} L ${x + 30} ${y + h} Q ${x} ${y + h} ${x} ${y + h - 30} L ${x} ${y + 30} Q ${x} ${y} ${x + 30} ${y} Z`)}
        seed={seed}
        solid={fill}
        o={{strokeWidth: 5, fill: undefined}}
      />
      <Rough shape={path(tail)} seed={seed + 1} solid={fill} o={{strokeWidth: 5}} />
      <text x={x + 28} y={y + h * 0.66} fontFamily={PEN} fontSize={size} fill={INK}>
        {shown}
      </text>
    </g>
  );
};
