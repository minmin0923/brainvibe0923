import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, line, path, rect} from '../lib/rough';
import {DAWN, DAY, INK, PLAZA, WHITE} from '../lib/palette';
import {GOWUN, Narration} from '../lib/Caption';
import {SCENES} from '../timeline';

const DUR = SCENES.S09.to - SCENES.S09.from + 15; // 디졸브 꼬리 포함

/** 도로 표지판(팔레트에 초록이 없어 남색으로 단순화) */
const Sign: React.FC<{x: number; y: number; s: number; text: string; arrow?: boolean}> = ({x, y, s, text, arrow}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Rough boil="bg" shape={line(-120, 0, -120, 600)} seed={3} o={{strokeWidth: 10, stroke: INK}} />
    <Rough boil="bg" shape={line(120, 0, 120, 600)} seed={4} o={{strokeWidth: 10, stroke: INK}} />
    <Rough boil="char" shape={rect(-220, -170, 440, 200)} seed={5} solid={DAWN.mid} o={{fill: DAWN.mid, stroke: WHITE, strokeWidth: 6}} />
    <text x={0} y={-40} textAnchor="middle" fontFamily={GOWUN} fontSize={92} fill={WHITE}>
      {text}
    </text>
    {arrow && <Rough boil="char" shape={path('M 150 -70 L 190 -70 L 190 -100 L 210 -70 L 190 -40 L 190 -70')} seed={6} o={{stroke: WHITE, strokeWidth: 5}} />}
  </g>
);

/** S9. 의정부를 떠나 — 차창 밖 노을. 가드레일(빠름)·표지판(중간)·산 능선(느림) 패럴랙스 3겹. */
export const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const far = -frame * 1.2;
  const mid = -frame * 14;
  const near = -frame * 46;
  // '의정부' 표지판은 뒤로 지나가고 '서울' 표지판이 다가온다
  const s1x = 520 + mid;
  const s2s = interpolate(frame, [20, DUR], [0.45, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s2x = interpolate(frame, [20, DUR], [1150, 720], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Paper color={DAY.amber} />
      <Camera dur={DUR} from={{s: 1.0}} to={{s: 1.04}} origin={[540, 1100]}>
        <Wash
          blobs={[
            {x: 760, y: 1000, r: 380, color: DAY.sun, o: 0.95},
            {x: 300, y: 400, r: 600, color: PLAZA.violet, o: 0.45},
            {x: 540, y: 1500, r: 600, color: DAY.amber, o: 0.5},
          ]}
          blur={80}
        />
        <Stage>
          {/* 산 능선(느림) */}
          <g transform={`translate(${far} 0)`}>
            <Rough boil="bg" shape={path('M -100 1180 Q 120 960 320 1100 Q 520 900 760 1080 Q 960 940 1200 1120 L 1200 1300 L -100 1300 Z')} seed={10} solid={PLAZA.violet} o={{fill: PLAZA.shadow, hachureGap: 14, strokeWidth: 5}} />
          </g>
          {/* 표지판(중간) */}
          <Sign x={s1x} y={760} s={0.9} text="의정부" />
          <Sign x={s2x} y={820 - (s2s - 0.45) * 140} s={s2s} text="서울" arrow />
          {/* 도로 */}
          <Rough boil="bg" shape={rect(-40, 1290, 1160, 700)} seed={12} solid={PLAZA.shadow} o={{fill: PLAZA.shadow}} />
          {/* 가드레일(빠름) */}
          <g transform={`translate(${near % 160} 0)`}>
            <Rough boil="bg" shape={line(-200, 1400, 1300, 1400)} seed={13} o={{strokeWidth: 12, stroke: DAY.sand}} />
            {Array.from({length: 10}).map((_, i) => (
              <Rough key={i} boil="bg" shape={line(-160 + i * 160, 1380, -160 + i * 160, 1520)} seed={20 + i} o={{strokeWidth: 10, stroke: DAY.sand}} />
            ))}
          </g>
          {/* 모션 블러 빗금 */}
          {Array.from({length: 8}).map((_, i) => {
            const x = 1200 - ((frame * 60 + i * 230) % 1500);
            return <line key={i} x1={x} y1={1560 + i * 40} x2={x + 300} y2={1560 + i * 40} stroke={DAY.sand} strokeWidth={4} opacity={0.5} />;
          })}
        </Stage>
      </Camera>
      <Narration lines={['의정부에서 광화문까지']} y={300} from={8} to={DUR} />
    </AbsoluteFill>
  );
};
