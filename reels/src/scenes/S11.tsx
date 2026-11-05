import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, circle, ellipse, line, path, rect, useTwos} from '../lib/rough';
import {COAT, INK, PAPER, PLAZA, SKIN} from '../lib/palette';
import {Harin, HarinHead} from '../chars/Harin';
import {SCENES} from '../timeline';

const DUR = SCENES.S11.to - SCENES.S11.from; // 45
const CUT = 22;

/** 마이크 스탠드. 원점 = 바닥, 높이 h */
export const Mic: React.FC<{x: number; y: number; h: number; s?: number}> = ({x, y, h, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rough shape={ellipse(0, 0, 160, 34)} seed={300} solid={INK} o={{fill: INK}} />
    <Rough shape={line(0, 0, 0, -h)} seed={301} o={{strokeWidth: 10}} />
    <Rough shape={line(0, -h, -60, -h - 30)} seed={302} o={{strokeWidth: 8}} />
    <Rough shape={path(`M -60 ${-h - 30} L -84 ${-h - 50} L -104 ${-h - 70}`)} seed={303} o={{strokeWidth: 8}} />
    <Rough shape={ellipse(-116, -h - 82, 50, 70)} seed={304} solid={INK} o={{fill: PLAZA.violet, hachureGap: 5}} />
  </g>
);

/** S11-a: 하린 키보다 높은 마이크 → 아빠 손이 들어와 마이크를 낮춘다 */
const Lower: React.FC = () => {
  const t2 = useTwos();
  const h = interpolate(t2, [4, 18], [520, 220], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const handIn = interpolate(t2, [0, 6, 18, 22], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const micTop: [number, number] = [720 - 60 * 1.3, 1600 - (h + 30) * 1.3];
  return (
    <AbsoluteFill>
      <Paper color={PLAZA.night} />
      <Camera dur={CUT} from={{s: 1.3}} to={{s: 1.34}} origin={[560, 1320]}>
        <Wash blobs={[{x: 540, y: 1700, r: 600, color: PLAZA.flame, o: 0.25}]} blur={80} blend="screen" />
        <Stage>
          <Harin x={420} y={1600} scale={1.3} pose={{armL: 6, armR: 6, look: 6, mouth: 'flat', headTilt: 6}} />
          <Mic x={720} y={1600} h={h} s={1.3} />
          {/* 아빠 손(오른쪽 위에서) */}
          <g opacity={handIn}>
            <Rough shape={path(`M 1200 ${micTop[1] - 160} L ${micTop[0] + 60} ${micTop[1] - 40} L ${micTop[0] + 70} ${micTop[1] + 40} L 1200 ${micTop[1] - 60} Z`)} seed={320} solid={COAT} o={{fill: COAT}} />
            <Rough shape={ellipse(micTop[0] + 30, micTop[1], 110, 80)} seed={321} solid={SKIN} />
          </g>
        </Stage>
      </Camera>
    </AbsoluteFill>
  );
};

/** S11-b: 하린 얼굴 클로즈업, 눈동자에 촛불 두 점. 발언문을 쥔 손이 미세하게 떨림. 비네팅이 점점 강해진다. */
const Face: React.FC = () => {
  const frame = useCurrentFrame();
  const dur = DUR - CUT;
  const tremble = Math.sin(frame * 2.9) * 2; // 2px, 빠르게
  const vig = interpolate(frame, [0, dur], [0.35, 0.8], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Paper color={PLAZA.night} />
      <Camera dur={dur} from={{s: 1.0}} to={{s: 1.05}} origin={[540, 860]}>
        <Wash blobs={[{x: 540, y: 1500, r: 600, color: PLAZA.flame, o: 0.3}]} blur={80} blend="screen" />
        <Stage>
          <g transform="translate(540 860) scale(4.2)">
            <HarinHead cx={0} cy={0} mouth="flat" seed={170} />
            {/* 눈동자 속 촛불 두 점 */}
            <circle cx={-26} cy={8} r={2} fill={PLAZA.halo} />
            <circle cx={30} cy={8} r={2} fill={PLAZA.halo} />
          </g>
          {/* 발언문을 쥔 손 */}
          <g transform={`translate(${tremble} ${1500 + tremble * 0.5}) rotate(-4 540 0)`}>
            <Rough shape={rect(330, -60, 420, 300)} seed={180} solid={PAPER} o={{strokeWidth: 5}} />
            {[0, 1, 2, 3].map((l) => (
              <Rough key={l} shape={line(370, l * 50, 700 - (l % 2) * 80, l * 50)} seed={181 + l} o={{strokeWidth: 3}} />
            ))}
            <Rough shape={circle(340, 60, 110)} seed={186} solid={SKIN} />
            <Rough shape={circle(740, 70, 110)} seed={187} solid={SKIN} />
          </g>
        </Stage>
      </Camera>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 50% at 50% 45%, rgba(34,38,79,0) 30%, rgba(34,38,79,${vig}) 100%)`}} />
    </AbsoluteFill>
  );
};

/** S11. 마이크 앞 (0:38.5–0:40.0) — 정적 1.5초 */
export const S11: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={CUT}>
      <Lower />
    </Sequence>
    <Sequence from={CUT}>
      <Face />
    </Sequence>
  </AbsoluteFill>
);
