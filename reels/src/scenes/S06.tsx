import React from 'react';
import {AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, line, rect} from '../lib/rough';
import {DAWN, DAY, INK, PAPER} from '../lib/palette';
import {HarinDrawing} from '../lib/HarinDrawing';
import {Narration} from '../lib/Caption';
import {SCENES} from '../timeline';

const DUR = SCENES.S06.to - SCENES.S06.from;
const N = 30;
const BOX = {x: 200, y: 640, w: 680, h: 860};

/** S6. 카드가 모이다 — 위에서 내려다본 투명 상자로 카드 30장이 각기 다른 속도로 회전하며 내려앉는다. */
export const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <Paper color={DAY.cream} />
      <Camera dur={DUR} from={{s: 1.0}} to={{s: 1.06}} origin={[540, 1070]}>
        <Wash blobs={[{x: 540, y: 1000, r: 600, color: DAY.sand, o: 0.6}, {x: 900, y: 400, r: 400, color: DAY.sun, o: 0.6}]} blur={80} />
        <Stage>
          {/* 상자 바닥(안쪽) + 벽 원근 */}
          <rect x={BOX.x + 60} y={BOX.y + 60} width={BOX.w - 120} height={BOX.h - 120} fill={DAWN.pale} opacity={0.18} />
          <Rough boil="bg" shape={rect(BOX.x + 60, BOX.y + 60, BOX.w - 120, BOX.h - 120)} seed={2} o={{strokeWidth: 4, stroke: DAWN.pale}} />
          {[
            [BOX.x, BOX.y, BOX.x + 60, BOX.y + 60],
            [BOX.x + BOX.w, BOX.y, BOX.x + BOX.w - 60, BOX.y + 60],
            [BOX.x, BOX.y + BOX.h, BOX.x + 60, BOX.y + BOX.h - 60],
            [BOX.x + BOX.w, BOX.y + BOX.h, BOX.x + BOX.w - 60, BOX.y + BOX.h - 60],
          ].map(([a, b, c, d], i) => (
            <Rough key={i} boil="bg" shape={line(a, b, c, d)} seed={3 + i} o={{strokeWidth: 4, stroke: DAWN.pale}} />
          ))}
          {/* 카드 */}
          {Array.from({length: N}).map((_, i) => {
            const last = i === N - 1;
            const delay = last ? 64 : i * 2.1;
            const sp = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 70 + random(`k${i}`) * 80, mass: 0.7}});
            const ang = random(`a${i}`) * Math.PI * 2;
            const sx = 540 + Math.cos(ang) * 1300;
            const sy = 1000 + Math.sin(ang) * 1400;
            const ex = last ? 540 : BOX.x + 130 + random(`ex${i}`) * (BOX.w - 260);
            const ey = last ? 1040 : BOX.y + 140 + random(`ey${i}`) * (BOX.h - 280);
            const x = sx + (ex - sx) * sp;
            const y = sy + (ey - sy) * sp;
            const rot = (1 - sp) * (random(`r${i}`) - 0.5) * 720 + (random(`rr${i}`) - 0.5) * (last ? 8 : 40);
            const sc = 1 + (1 - sp) * 0.5;
            if (frame < delay) return null;
            return (
              <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`}>
                <Rough boil="char" shape={rect(-110, -75, 220, 150)} seed={60 + i} solid={i % 4 === 0 ? DAY.sun : PAPER} o={{strokeWidth: 4, fill: undefined}} />
                {last ? (
                  <g transform="translate(-102 -105) scale(0.205)">
                    <HarinDrawing />
                  </g>
                ) : (
                  [0, 1, 2].map((l) => (
                    <Rough key={l} boil="char" shape={line(-80, -36 + l * 30, 40 + random(`l${i}${l}`) * 40, -36 + l * 30)} seed={100 + i * 3 + l} o={{strokeWidth: 3, roughness: 2}} />
                  ))
                )}
              </g>
            );
          })}
          {/* 상자 윗면 테두리(투명) */}
          <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} fill={PAPER} opacity={0.12} />
          <Rough boil="bg" shape={rect(BOX.x, BOX.y, BOX.w, BOX.h)} seed={1} o={{strokeWidth: 7}} />
        </Stage>
      </Camera>
      <Narration lines={['의정부 사람들이', '저마다의 바람을 적었습니다']} y={290} from={6} to={DUR} color={INK} />
    </AbsoluteFill>
  );
};
