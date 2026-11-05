import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, ellipse, line, path, rect, useTwos} from '../lib/rough';
import {COAT, PAPER, PLAZA, SKIN} from '../lib/palette';
import {Harin} from '../chars/Harin';
import {DadHead} from '../chars/Dad';
import {Candle, CandleDefs, plazaCandles} from '../lib/candles';
import {WordByWord} from '../lib/Caption';
import {COPY} from '../lib/copy';
import {EVENTS, SCENES} from '../timeline';
import {Mic} from './S11';

const DUR = SCENES.S12.to - SCENES.S12.from; // 200
const at = (abs: number) => abs - SCENES.S12.from;
const INS = [at(EVENTS.dadInsert[0]), at(EVENTS.dadInsert[1])]; // 120, 135

/** 객석 촛불 (화면 아래를 채움) */
export const Audience: React.FC<{n?: number; y0?: number; seed?: string}> = ({n = 70, y0 = 1500, seed = 'aud'}) => {
  const spots = useMemo(() => plazaCandles(n, {x0: -100, x1: 1180, y0, y1: 1900}, seed), [n, y0, seed]);
  // 화면 밖(아래)으로 넘치는 부분은 잘라 둔다: 넘친 내용이 왼쪽 위에 겹쳐 그려지는 Chromium 문제를 피함
  return (
    <g clipPath="url(#aud-clip)">
      <defs>
        <clipPath id="aud-clip">
          <rect x={-60} y={0} width={1200} height={1920} />
        </clipPath>
      </defs>
      {spots.map((c) => (
        <g key={c.id}>
          <ellipse cx={c.x} cy={c.y - 60 * c.s} rx={26 * c.s} ry={28 * c.s} fill={PLAZA.shadow} />
          <path d={`M ${c.x - 46 * c.s} ${c.y + 40 * c.s} Q ${c.x} ${c.y - 80 * c.s} ${c.x + 46 * c.s} ${c.y + 40 * c.s} Z`} fill={PLAZA.shadow} />
          <Candle id={c.id + 500} x={c.x + 16 * c.s} y={c.y - 4 * c.s} s={c.s * 1.2} />
        </g>
      ))}
    </g>
  );
};

/** 인서트: 객석에서 입을 막고 우는 아빠 (0.5초) */
const DadInsert: React.FC = () => (
  <AbsoluteFill>
    <Paper color={PLAZA.night} />
    <Wash blobs={[{x: 540, y: 1300, r: 500, color: PLAZA.flame, o: 0.45}]} blur={70} blend="screen" />
    <Stage>
      <CandleDefs />
      <g transform="translate(540 900) scale(3.2)">
        <DadHead cx={0} cy={0} mouth="sad" tearful seed={570} />
      </g>
      {/* 입을 막은 손 */}
      <Rough shape={path('M 60 1960 Q 90 1300 540 1240 Q 990 1300 1020 1960 Z')} seed={590} solid={COAT} o={{fill: COAT}} />
      {/* 입을 막은 손 + 소매 */}
      <Rough shape={path('M 200 1700 L 380 1160 L 520 1200 L 400 1760 Z')} seed={589} solid={COAT} o={{fill: COAT}} />
      <Rough shape={ellipse(520, 1130, 260, 150)} seed={591} solid={SKIN} />
      {[0, 1, 2].map((i) => (
        <Rough key={i} shape={ellipse(600, 1068 + i * 44, 170, 48)} seed={592 + i} solid={SKIN} o={{strokeWidth: 5}} />
      ))}
      <Candle id={999} x={540} y={1760} s={2.4} />
    </Stage>
  </AbsoluteFill>
);

/** S12. 하린의 말 (0:40.0–0:46.7) */
export const S12: React.FC = () => {
  const frame = useCurrentFrame();
  const t2 = useTwos();
  const talking = EVENTS.speech.some((s) => frame >= at(s) && frame < at(s) + 40);
  const mouth = talking ? (Math.floor(t2 / 4) % 2 ? 'o' : 'flat') : 'smile';
  const handsY = 1340;
  return (
    <AbsoluteFill>
      <Paper color={PLAZA.night} />
      <Camera dur={DUR} from={{s: 1.0}} to={{s: 1.08}} origin={[540, 1150]}>
        <Wash
          blobs={[
            {x: 540, y: 1000, r: 420, color: PLAZA.halo, o: 0.35},
            {x: 540, y: 1720, r: 460, color: PLAZA.flame, o: 0.35},
          ]}
          blur={80}
          blend="screen"
        />
        <Stage>
          <CandleDefs />
          {/* 무대 + 스포트라이트 */}
          <path d="M 400 0 L 680 0 L 860 1460 L 220 1460 Z" fill={PLAZA.halo} opacity={0.12} />
          <Rough boil="bg" shape={rect(-40, 1440, 1160, 90)} seed={1} solid={PLAZA.violet} o={{fill: PLAZA.shadow, hachureGap: 12}} />
          <Rough boil="bg" shape={line(-40, 1440, 1120, 1440)} seed={2} o={{strokeWidth: 6}} />
          {/* 하린: 까치발, 두 손으로 발언문 */}
          <Harin x={500} y={1440} scale={1.25} pose={{handL: [470, handsY], handR: [560, handsY], tiptoe: 0.7, mouth, look: 2}} />
          <g transform={`translate(0 ${Math.sin(frame * 2.9) * 1.5})`}>
            <Rough shape={rect(450, handsY - 70, 130, 100)} seed={20} solid={PAPER} o={{strokeWidth: 4}} />
          </g>
          <Mic x={790} y={1440} h={200} s={1.25} />
          {/* 객석 촛불 */}
          <Audience />
        </Stage>
      </Camera>
      <WordByWord
        y={300}
        lines={[
          {at: at(EVENTS.speech[0]), text: COPY.s12[0]},
          {at: at(EVENTS.speech[1]), text: COPY.s12[1]},
          {at: at(EVENTS.speech[2]), text: COPY.s12[2]},
          {at: at(EVENTS.speech[3]), text: COPY.s12[3]},
        ]}
        size={90}
        perWord={8}
      />
      <Sequence from={INS[0]} durationInFrames={INS[1] - INS[0]}>
        <DadInsert />
        <WordByWord
          y={300}
          lines={[
            {at: at(EVENTS.speech[0]) - INS[0], text: COPY.s12[0]},
            {at: at(EVENTS.speech[1]) - INS[0], text: COPY.s12[1]},
            {at: at(EVENTS.speech[2]) - INS[0], text: COPY.s12[2]},
          ]}
          size={90}
          perWord={8}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
