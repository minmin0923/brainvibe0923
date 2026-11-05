import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {Paper, Stage, Wash, Camera} from '../lib/paper';
import {Rough, ellipse, line, rect, useTwos} from '../lib/rough';
import {DAWN, DAY, INK, SKIN} from '../lib/palette';
import {Grandma} from '../chars/Grandma';
import {HarinHead} from '../chars/Harin';
import {Handwrite, Narration} from '../lib/Caption';
import {EVENTS, SCENES} from '../timeline';

const DUR = SCENES.S08.to - SCENES.S08.from;
const TAP = EVENTS.glassTap - SCENES.S08.from; // 48
const DEPART = 56;

/** S8. 배웅 — 버스 창 안에서 본 바깥. 할머니가 두 손 모았다가 흔들고, 유리에 하린 얼굴이 비친다. */
export const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const t2 = useTwos();
  const go = interpolate(frame, [DEPART, DUR], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const gx = 520 - go * 620;
  const gs = 1.0 - go * 0.35;
  const blur = go * 6;
  // 0~20 두 손 모음, 20~ 흔들기
  const waving = t2 >= 20;
  const wave = Math.sin(t2 * 0.45) * 26;
  const palm = interpolate(frame, [TAP - 4, TAP], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const press = frame >= TAP && frame < TAP + 4 ? 0.96 : 1;
  return (
    <AbsoluteFill>
      <Paper color={DAY.cream} />
      <Camera dur={DUR} from={{s: 1.02}} to={{s: 1.06}} origin={[540, 1000]}>
        {/* 창밖(먹먹한 바깥) */}
        <AbsoluteFill style={{filter: `blur(${blur * 0.4}px)`}}>
          <Wash blobs={[{x: 300, y: 600, r: 520, color: DAY.sun, o: 0.8}, {x: 800, y: 1300, r: 500, color: DAY.sand, o: 0.7}]} blur={80} />
          <Stage>
            <g transform={`translate(${-go * 900} 0)`}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Rough key={i} boil="bg" shape={rect(-100 + i * 300, 560 - (i % 2) * 80, 240, 700)} seed={1 + i} solid={DAY.sand} o={{fill: DAY.amber, hachureGap: 16, strokeWidth: 4}} />
              ))}
              <Rough boil="bg" shape={rect(-200, 1260, 2400, 700)} seed={8} solid={DAY.sand} o={{fill: DAY.amber, hachureGap: 18, strokeWidth: 4}} />
            </g>
          </Stage>
        </AbsoluteFill>
        <AbsoluteFill style={{filter: `blur(${blur}px)`}}>
          <Stage>
            <Grandma
              x={gx}
              y={1500}
              scale={gs * 1.25}
              pose={
                waving
                  ? {handR: [gx + 170 * gs + wave * gs, 1500 - 760 * gs], armL: 8, mouth: frame < 50 ? (Math.floor(t2 / 6) % 2 ? 'o' : 'smile') : 'smile'}
                  : {handL: [gx - 10, 1500 - 470 * gs * 1.25], handR: [gx + 14, 1500 - 470 * gs * 1.25], eyes: 'closed'}
              }
            />
          </Stage>
        </AbsoluteFill>
        {/* 유리에 비친 하린 (반사 레이어 0.4) */}
        <Stage style={{opacity: 0.4}}>
          <g transform="translate(700 760) scale(1.6)">
            <HarinHead cx={0} cy={0} look={-6} mouth="flat" seed={160} />
          </g>
        </Stage>
        {/* 유리에 닿은 손바닥(안쪽, 실제 손) */}
        <Stage style={{opacity: palm}}>
          <g transform={`translate(760 1180) scale(${press})`}>
            <Rough shape={ellipse(0, 0, 150, 170)} seed={70} solid={SKIN} />
            {[-48, -16, 16, 46].map((fx, i) => (
              <Rough key={i} shape={ellipse(fx, -110 - (i === 1 || i === 2 ? 14 : 0), 34, 90)} seed={71 + i} solid={SKIN} o={{strokeWidth: 4}} />
            ))}
            <Rough shape={ellipse(-88, -10, 34, 80)} seed={76} solid={SKIN} o={{strokeWidth: 4}} style={{transform: 'rotate(-30deg)', transformOrigin: '-88px -10px'}} />
          </g>
        </Stage>
        {/* 버스 창틀 */}
        <Stage>
          {[
            [-20, -20, 1120, 280],
            [-20, 1560, 1120, 400],
            [-20, 260, 90, 1300],
            [1010, 260, 90, 1300],
          ].map(([fx, fy, fw, fh], i) => (
            <Rough key={i} boil="bg" shape={rect(fx, fy, fw, fh)} seed={80 + i * 3} solid={DAWN.mid} o={{fill: DAWN.deep, hachureGap: 12, stroke: 'none'}} />
          ))}
          <Rough boil="bg" shape={rect(70, 260, 940, 1300)} seed={81} o={{strokeWidth: 8}} />
          {/* 출발 후 창밖 흐름(모션 블러 빗금) */}
          {go > 0.3 &&
            Array.from({length: 10}).map((_, i) => {
              const y = 320 + random(`b${i}`) * 1180;
              const x = 1010 - ((frame * 70 + i * 190) % 1100);
              return <line key={i} x1={x} y1={y} x2={x + 220} y2={y} stroke={DAY.sun} strokeWidth={5} opacity={(go - 0.3) * 1.2} strokeLinecap="round" />;
            })}
          <Rough boil="bg" shape={line(70, 1560, 1010, 1560)} seed={82} o={{strokeWidth: 10, stroke: INK}} />
        </Stage>
      </Camera>
      <Handwrite lines={['"꼭 전해줘"']} y={330} from={18} to={DEPART - 2} size={90} color={INK} />
      <Narration lines={['가지 못하는 이웃의', '마음까지 싣고']} y={300} from={DEPART} to={DUR + 4} />
    </AbsoluteFill>
  );
};
