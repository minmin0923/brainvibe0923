import React from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, line, useTwos} from '../lib/rough';
import {DAY, INK, JUMPER, PAPER, PINK} from '../lib/palette';
import {HarinDrawing, TRAIN_STOP_X} from '../lib/HarinDrawing';
import {Hand} from '../chars/Crowd';
import {Handwrite, Narration} from '../lib/Caption';
import {EVENTS, SCENES} from '../timeline';

const DUR = SCENES.S01.to - SCENES.S01.from;
const DS = 1.9; // 그림 확대 배율(익스트림 클로즈업)
const DX = -80;
const DY = -190;
/** S2 전깃줄과 같은 화면 높이(선 매치컷) */
export const MATCH_LINE_Y = 640;

/** S1. 크레용 지하철 — 분홍 선이 실시간으로 그려지며 지하철이 된다. */
export const S01: React.FC = () => {
  const t2 = useTwos(); // 손은 on twos
  const drawn = interpolate(t2, [2, 74], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // 크레용 끝: 뒤칸 왼쪽 → 앞머리 오른쪽으로 이동(로컬 좌표)
  const lx = TRAIN_STOP_X - 350 + drawn * 712;
  const ly = 548 + 60 + Math.sin(t2 * 0.9) * 46;
  const tipX = DX + lx * DS;
  const tipY = DY + ly * DS;
  // 마지막: 선이 화면 밖으로 길게 이어진다(→ 전깃줄 매치컷)
  const extend = interpolate(t2, [76, 98], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const endX = DX + (TRAIN_STOP_X + 362) * DS;
  const hx = extend > 0 ? endX + extend * 700 : tipX;
  const hy = extend > 0 ? MATCH_LINE_Y : tipY;
  return (
    <AbsoluteFill>
      <Paper color={PAPER} />
      {/* 카메라는 선을 따라 천천히 오른쪽으로 팬 */}
      <Camera dur={DUR} from={{s: 1.04, x: 140}} to={{s: 1.0, x: -300}} origin={[540, 960]}>
        <Wash blobs={[{x: 400, y: 1300, r: 500, color: DAY.sun, o: 0.35}]} blur={80} />
        <Stage>
          <g transform={`translate(${DX} ${DY}) scale(${DS})`}>
            <HarinDrawing drawn={drawn} scenery={false} />
          </g>
          {extend > 0 && (
            <Rough
              shape={line(endX - 40, (548 + 96) * DS + DY, endX + 1400, MATCH_LINE_Y)}
              seed={31}
              o={{stroke: PINK.line8, strokeWidth: 12, roughness: 1.4}}
              drawn={extend}
            />
          )}
          {/* 크레용 가루 6개 */}
          {Array.from({length: 6}).map((_, i) => {
            const born = 10 + i * 11;
            const age = t2 - born;
            if (age < 0 || age > 30) return null;
            const bx = DX + (TRAIN_STOP_X - 350 + ((born - 2) / 72) * 712) * DS + random(`cx${i}`) * 30;
            const by = DY + (548 + 70) * DS + age * age * 0.25 + age * 2;
            return <circle key={i} cx={bx + age * (random(`cv${i}`) - 0.5) * 3} cy={by} r={4 + random(`cr${i}`) * 3} fill={PINK.crayon} opacity={1 - age / 30} />;
          })}
          {/* 하린의 손(노란 소매) + 분홍 크레용 */}
          <Hand x={hx} y={hy} rot={-6} s={1.1} kind="child" sleeve={JUMPER} tool="crayon" />
        </Stage>
      </Camera>
      {/* 훅 자막: 0초 즉시, 첫 2초 안에 읽힘 */}
      <Narration lines={['일곱 살 하린이가', '광화문 무대에 섰습니다']} y={290} from={-10} to={DUR + 6} color={INK} size={60} />
      <Handwrite lines={['"안녕하세요… 저는 민락동에 사는…"']} y={1370} from={EVENTS.harinLine} to={DUR + 4} size={74} />
    </AbsoluteFill>
  );
};
