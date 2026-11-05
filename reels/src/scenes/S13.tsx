import React, {useMemo} from 'react';
import {AbsoluteFill, random, Sequence, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, path} from '../lib/rough';
import {COAT, CARDIGAN, DAWN, DAY, PLAZA} from '../lib/palette';
import {DadHead} from '../chars/Dad';
import {PersonHead, type HairStyle} from '../chars/Crowd';
import {Candle, CandleDefs} from '../lib/candles';
import {Narration} from '../lib/Caption';
import {SCENES, SUB} from '../timeline';
import {Gate} from './S10';

const A_DUR = SUB.S13B - SCENES.S13.from; // 100
const B_DUR = SCENES.S13.to - SUB.S13B; // 100
const FACE = 25; // 얼굴당 25프레임(≈0.83초) × 4

type Face = {kind: 'dad' | HairStyle; body: string; glasses?: boolean};
const FACES: Face[] = [
  {kind: 'dad', body: COAT},
  {kind: 'bun', body: CARDIGAN, glasses: true}, // 할머니처럼 보이는 어르신
  {kind: 'bob', body: DAWN.mid}, // 학생
  {kind: 'cap', body: DAY.amber}, // 상인
];

/** 노래하는 얼굴 클로즈업 — 볼에 촛불 빛 */
const SingingFace: React.FC<{face: Face; i: number}> = ({face, i}) => {
  const frame = useCurrentFrame();
  const mouthOpen = Math.floor(frame / 6) % 3 !== 0;
  return (
    <AbsoluteFill>
      <Paper color={PLAZA.night} />
      <Camera dur={FACE} from={{s: 1.0, x: i % 2 ? 10 : -10}} to={{s: 1.05, x: i % 2 ? -10 : 10}} origin={[540, 900]}>
        <Wash
          blobs={[
            {x: 540, y: 1300, r: 520, color: PLAZA.flame, o: 0.5},
            {x: 540, y: 900, r: 380, color: PLAZA.halo, o: 0.25},
          ]}
          blur={70}
          blend="screen"
        />
        <Stage>
          <CandleDefs />
          <Rough shape={path('M 140 1960 Q 160 1340 540 1300 Q 920 1340 940 1960 Z')} seed={700 + i} solid={face.body} o={{fill: face.body}} />
          <g transform="translate(540 860) scale(3.4)">
            {face.kind === 'dad' ? (
              <DadHead cx={0} cy={0} mouth={mouthOpen ? 'sing' : 'smile'} seed={575} />
            ) : (
              <PersonHead cx={0} cy={0} hair={face.kind} mouth={mouthOpen ? 'sing' : 'smile'} glasses={face.glasses} seed={1400 + i * 10} />
            )}
          </g>
          {/* 아래쪽 볼을 비추는 촛불 */}
          <Candle id={900 + i} x={540} y={1560} s={2.6} />
        </Stage>
      </Camera>
    </AbsoluteFill>
  );
};

/** 내려다본 광장의 촛불 수천 개(은하수처럼) */
const CandleSea: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = useMemo(() => {
    const arr: {x: number; y: number; r: number; id: number}[] = [];
    for (let i = 0; i < 2600; i++) {
      // 광장 모양(아래로 넓어지는 사다리꼴) + 가운데 띠가 촘촘한 은하수 분포
      const v = random(`v${i}`);
      const y = 860 + Math.pow(v, 0.9) * 1150;
      const half = 180 + (y - 860) * 0.62;
      const band = (random(`u${i}`) + random(`w${i}`) + random(`z${i}`)) / 3 - 0.5;
      const x = 540 + band * 2 * half + Math.sin(y / 140) * 40;
      arr.push({x, y, r: 1.4 + (y - 860) / 380 + random(`r${i}`) * 1.2, id: i});
    }
    return arr;
  }, []);
  return (
    <AbsoluteFill>
      <Paper color={PLAZA.night} />
      {/* 천천히 줌아웃 */}
      <Camera dur={B_DUR} from={{s: 1.18}} to={{s: 1.0}} origin={[540, 1200]}>
        <Wash
          blobs={[
            {x: 540, y: 1300, r: 520, color: PLAZA.flame, o: 0.35},
            {x: 540, y: 1700, r: 600, color: PLAZA.halo, o: 0.2},
          ]}
          blur={90}
          blend="screen"
        />
        <Stage>
          <Gate x={540} y={620} s={0.55} />
          {dots.map((d) => {
            const fl = 0.55 + 0.45 * noise2D('sea', d.id * 0.13, frame * 0.07);
            return <circle key={d.id} cx={d.x} cy={d.y} r={d.r} fill={d.id % 5 ? PLAZA.flame : PLAZA.halo} opacity={fl} />;
          })}
        </Stage>
      </Camera>
    </AbsoluteFill>
  );
};

/** S13. 촛불의 바다 (0:46.7–0:53.3) — 클라이맥스 */
export const S13: React.FC = () => (
  <AbsoluteFill>
    {FACES.map((f, i) => (
      <Sequence key={i} from={i * FACE} durationInFrames={FACE}>
        <SingingFace face={f} i={i} />
      </Sequence>
    ))}
    <Sequence from={A_DUR}>
      <CandleSea />
    </Sequence>
    <Sequence durationInFrames={A_DUR}>
      <Narration lines={['이 작은 빛 하나하나가']} y={300} from={4} to={A_DUR} />
    </Sequence>
    <Sequence from={A_DUR}>
      <Narration lines={['의정부의 바람입니다']} y={300} from={6} to={B_DUR + 10} />
    </Sequence>
  </AbsoluteFill>
);
