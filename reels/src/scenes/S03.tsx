import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, circle, ellipse, path, polygon, rect, useTwos} from '../lib/rough';
import {COAT, DAWN, DAY, PAPER, SKIN} from '../lib/palette';
import {HarinAsleep} from '../chars/Harin';
import {HarinDrawing} from '../lib/HarinDrawing';
import {Narration} from '../lib/Caption';
import {SCENES} from '../timeline';

const DUR = SCENES.S03.to - SCENES.S03.from;

/** S3. 문틈 — 복도에서 본 하린 방. 아빠 손이 손잡이를 잡고 1초 멈췄다가 풀린다. */
export const S03: React.FC<{caption?: boolean}> = ({caption = true}) => {
  const t2 = useTwos();
  // 0~30: 손 들어옴, 30~60: 정지(1초), 60~: 손가락이 살짝 풀림
  const release = interpolate(t2, [62, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const breathe = (Math.sin((t2 / 30) * Math.PI * 2 * 0.35) + 1) / 2;
  return (
    <AbsoluteFill>
      <Paper color={DAWN.deep} />
      <Camera dur={DUR} from={{s: 1}} to={{s: 1.06}} origin={[430, 1080]}>
        <Wash
          blobs={[
            {x: 200, y: 300, r: 420, color: DAWN.mid, o: 0.7},
            {x: 900, y: 1500, r: 500, color: DAWN.mid, o: 0.5},
            {x: 380, y: 950, r: 360, color: DAWN.lamp, o: 0.25},
          ]}
          blur={70}
          blend="screen"
        />
        <Stage>
          {/* 방 안(문틈 너머) */}
          <defs>
            <clipPath id="s03-gap">
              <polygon points="170,520 690,520 690,1650 170,1650" />
            </clipPath>
          </defs>
          <g clipPath="url(#s03-gap)">
            <rect x={150} y={500} width={560} height={1180} fill={DAWN.mid} />
            <Rough boil="bg" shape={rect(150, 1420, 560, 270)} seed={10} solid={DAWN.deep} o={{fill: DAWN.mid, hachureGap: 12, strokeWidth: 4}} />
            {/* 수면등 빛 */}
            <radialGradient id="s03-lamp" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={DAWN.lamp} stopOpacity={0.45} />
              <stop offset="100%" stopColor={DAWN.lamp} stopOpacity={0} />
            </radialGradient>
            <circle cx={236} cy={1060} r={420} fill="url(#s03-lamp)" />
            {/* 협탁 + 수면등 */}
            <Rough boil="bg" shape={rect(166, 1090, 100, 170)} seed={11} solid={DAY.amber} o={{fill: DAWN.deep, hachureGap: 11, strokeWidth: 5}} />
            <Rough shape={path('M 184 1090 L 248 1090 L 236 1020 L 196 1020 Z')} seed={13} solid={DAWN.lamp} o={{fill: DAWN.lamp, strokeWidth: 4}} />
            <circle cx={216} cy={1050} r={80} fill={DAWN.lamp} opacity={0.45} filter="url(#glow-blur)" />
            <HarinAsleep x={325} y={1190} scale={0.8} breathe={breathe} />
            {/* 머리맡 분홍 그림 (엔딩 복선) */}
            <g transform="translate(300 790) rotate(-5)">
              <g transform="scale(0.2)">
                <rect x={-20} y={40} width={1040} height={780} fill={PAPER} />
                <HarinDrawing boil="bg" />
              </g>
              <Rough boil="bg" shape={rect(-4, 8, 208, 156)} seed={12} o={{strokeWidth: 3}} />
            </g>
          </g>
          {/* 문틀 */}
          <Rough boil="bg" shape={rect(150, 500, 760, 1200)} seed={20} o={{strokeWidth: 7}} />
          {/* 열린 문(원근) */}
          <Rough
            boil="bg"
            shape={polygon([
              [690, 520],
              [900, 470],
              [900, 1760],
              [690, 1650],
            ])}
            seed={21}
            solid={DAWN.mid}
            o={{fill: DAWN.deep, hachureGap: 9}}
          />
          {/* 문틈으로 새는 빛 */}
          <polygon points="684,520 712,520 712,1650 684,1650" fill={DAWN.lamp} opacity={0.5} filter="url(#glow-blur)" />
          {/* 손잡이 */}
          <Rough shape={circle(735, 1110, 52)} seed={22} solid={DAWN.pale} o={{fill: DAWN.pale}} />
          {/* 아빠 손: 오른쪽 밖에서 들어와 손잡이를 쥔다 */}
          <g transform={`translate(${interpolate(t2, [0, 24], [220, 0], {extrapolateRight: 'clamp'})} 0)`}>
            <Rough
              shape={path('M 1120 1060 L 820 1080 Q 790 1084 790 1112 L 792 1150 Q 794 1176 820 1176 L 1120 1200 Z')}
              seed={30}
              solid={COAT}
              o={{fill: DAWN.deep}}
            />
            <Rough shape={rect(772, 1074, 34, 112)} seed={31} solid={DAWN.pale} o={{strokeWidth: 4}} />
            {/* 손등 */}
            <Rough shape={ellipse(750, 1118, 96, 84)} seed={32} solid={SKIN} />
            {/* 손가락 4개: 풀릴 때 살짝 펴진다 */}
            {[0, 1, 2, 3].map((i) => (
              <Rough
                key={i}
                shape={ellipse(712 - release * 10, 1086 + i * 21, 46 + release * 12, 22)}
                seed={33 + i}
                solid={SKIN}
                o={{strokeWidth: 4}}
                style={{transform: `rotate(${release * -8}deg)`, transformOrigin: '750px 1118px'}}
              />
            ))}
          </g>
          {/* 복도 바닥선 */}
          <Rough boil="bg" shape={path('M 0 1760 L 1080 1700')} seed={40} o={{stroke: DAWN.pale, strokeWidth: 5}} />
        </Stage>
      </Camera>
      {caption && <Narration lines={['아빠는 오늘도', '해 뜨기 전에 집을 나섭니다']} y={300} from={-20} to={DUR + 30} />}
    </AbsoluteFill>
  );
};
