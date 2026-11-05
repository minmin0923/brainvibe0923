import React from 'react';
import {AbsoluteFill, random, Sequence, useCurrentFrame} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, circle, ellipse, line, path, rect, useTwos} from '../lib/rough';
import {DAWN, DAY, HOME, PAPER} from '../lib/palette';
import {Dad, DadHead} from '../chars/Dad';
import {Harin} from '../chars/Harin';
import {Silhouette} from '../chars/Crowd';
import {Narration} from '../lib/Caption';
import {SCENES, SUB} from '../timeline';

const A_DUR = SUB.S04B - SCENES.S04.from; // 100
const B_DUR = SCENES.S04.to - SUB.S04B; // 100 (+15 디졸브 꼬리)

/** S4-A. 만원 1호선 — 손잡이를 잡은 아빠, 창에 비친 졸린 얼굴. 레일 리듬에 맞춰 3px 흔들림. */
const S04A: React.FC = () => {
  const frame = useCurrentFrame();
  // 덜컹덜컹: 1박(25프레임)에 두 번 튀는 리듬
  const ph = frame % 12.5;
  const bump = ph < 3 ? -3 * Math.sin((ph / 3) * Math.PI) : 0;
  return (
    <AbsoluteFill style={{transform: `translateY(${bump}px)`}}>
      <Paper color={DAWN.mid} />
      <Camera dur={A_DUR} from={{s: 1.0, x: 10}} to={{s: 1.05, x: -20}} origin={[560, 900]}>
        <Stage>
          {/* 창: 바깥 어둠 + 빗금처럼 지나가는 불빛 */}
          <Rough boil="bg" shape={rect(40, 600, 1000, 520)} seed={1} solid={DAWN.deep} o={{fill: DAWN.deep, strokeWidth: 7}} />
          <defs>
            <clipPath id="s04-win">
              <rect x={44} y={604} width={992} height={512} />
            </clipPath>
          </defs>
          <g clipPath="url(#s04-win)">
            {Array.from({length: 9}).map((_, i) => {
              const speed = 38 + random(`sp${i}`) * 20;
              const x = 1300 - ((frame * speed + i * 260) % 1700);
              const y = 640 + random(`y${i}`) * 440;
              return <line key={i} x1={x} y1={y} x2={x + 260} y2={y - 30} stroke={DAWN.lamp} strokeWidth={6} opacity={0.75} strokeLinecap="round" />;
            })}
            {/* 창에 비친 졸린 얼굴 */}
            <g opacity={0.32} transform="translate(250 860) scale(0.9)">
              <DadHead cx={0} cy={0} eyes="closed" mouth="flat" seed={600} />
            </g>
          </g>
          {/* 손잡이 봉 + 손잡이 */}
          <Rough boil="bg" shape={line(-40, 450, 1120, 450)} seed={3} o={{strokeWidth: 9, stroke: DAWN.pale}} />
          {[180, 420, 640, 860].map((sx, i) => (
            <g key={i} transform={`rotate(${Math.sin(frame / 8 + i) * 4} ${sx} 450)`}>
              <Rough boil="char" shape={line(sx, 450, sx, 510)} seed={5 + i} o={{strokeWidth: 5, stroke: DAWN.pale}} />
              <Rough boil="char" shape={circle(sx, 532, 46)} seed={10 + i} o={{strokeWidth: 6, stroke: DAWN.pale}} />
            </g>
          ))}
          {/* 승객 실루엣 */}
          <Silhouette x={120} y={1700} s={1.6} color={DAWN.deep} seed={1501} />
          <Silhouette x={960} y={1760} s={1.7} color={DAWN.deep} seed={1505} />
          {/* 아빠: 오른손으로 손잡이 */}
          <Dad x={560} y={1960} scale={1.45} pose={{handR: [640, 545], armL: 4, mouth: 'flat', eyes: frame % 70 < 8 ? 'closed' : 'open', headTilt: 4}} />
          <Silhouette x={330} y={1980} s={1.3} color={HOME.night} seed={1510} />
        </Stage>
      </Camera>
      <Narration lines={['매일, 같은 길']} y={300} from={6} to={A_DUR} />
    </AbsoluteFill>
  );
};

/** S4-B. 저녁 식탁 — 하린 혼자 숟가락질, 맞은편 빈 의자와 엎어 둔 밥그릇. */
const S04B: React.FC = () => {
  const t2 = useTwos();
  // 숟가락: 그릇 ↔ 입 (40프레임 주기), 40~64 창밖을 돌아봄
  const looking = t2 >= 36 && t2 < 62;
  const cyc = looking ? 0 : (Math.sin((t2 / 40) * Math.PI * 2) + 1) / 2;
  const spoon: [number, number] = [330 + cyc * 10, 1290 - cyc * 110];
  return (
    <AbsoluteFill>
      <Paper color={HOME.night} />
      {/* 카메라는 빈 의자 쪽으로 천천히 팬 */}
      <Camera dur={B_DUR} from={{s: 1.04, x: 60}} to={{s: 1.06, x: -50}} origin={[560, 1200]}>
        <Wash
          blobs={[
            {x: 520, y: 900, r: 520, color: DAWN.lamp, o: 0.35},
            {x: 520, y: 1400, r: 420, color: DAY.amber, o: 0.25},
          ]}
          blur={80}
          blend="screen"
        />
        <Stage>
          {/* 창(밖은 어둠) */}
          <Rough boil="bg" shape={rect(80, 420, 380, 420)} seed={30} solid={DAWN.deep} o={{fill: DAWN.mid, hachureGap: 14, strokeWidth: 6}} />
          <Rough boil="bg" shape={line(270, 420, 270, 840)} seed={31} o={{strokeWidth: 5}} />
          {/* 펜던트 등 */}
          <Rough boil="bg" shape={line(560, 0, 560, 560)} seed={32} o={{strokeWidth: 4}} />
          <Rough shape={path('M 480 620 L 640 620 L 600 560 L 520 560 Z')} seed={33} solid={DAWN.lamp} o={{fill: DAWN.lamp}} />
          {/* 하린 */}
          <Harin x={300} y={1490} scale={1.15} pose={{handR: spoon, armL: 20, elbowL: 50, look: looking ? -6 : 2, headTilt: looking ? -14 : 0, mouth: cyc > 0.8 ? 'o' : 'flat'}} />
          {/* 빈 의자 */}
          <Rough boil="bg" shape={rect(720, 980, 200, 300)} seed={40} solid={DAY.amber} o={{fill: DAY.amber, hachureGap: 10}} />
          <Rough boil="bg" shape={rect(700, 1280, 240, 40)} seed={41} solid={DAY.amber} o={{fill: DAY.amber}} />
          <Rough boil="bg" shape={line(720, 1320, 720, 1640)} seed={42} o={{strokeWidth: 8}} />
          <Rough boil="bg" shape={line(920, 1320, 920, 1640)} seed={43} o={{strokeWidth: 8}} />
          {/* 식탁 */}
          <Rough boil="bg" shape={rect(40, 1320, 1000, 70)} seed={44} solid={DAY.amber} o={{fill: DAY.amber, hachureGap: 9}} />
          <Rough boil="bg" shape={rect(80, 1390, 40, 400)} seed={45} solid={DAY.amber} o={{fill: DAY.amber}} />
          <Rough boil="bg" shape={rect(960, 1390, 40, 400)} seed={46} solid={DAY.amber} o={{fill: DAY.amber}} />
          {/* 하린 밥그릇 */}
          <Rough shape={path('M 210 1290 Q 300 1360 390 1290 Z')} seed={50} solid={PAPER} />
          {/* 맞은편: 엎어 둔 밥그릇 + 숟가락 */}
          <Rough shape={path('M 760 1320 Q 820 1236 880 1320 Z')} seed={51} solid={PAPER} o={{fill: DAWN.pale, hachureGap: 9}} />
          <Rough shape={line(690, 1310, 750, 1300)} seed={52} o={{strokeWidth: 5}} />
          <Rough shape={ellipse(696, 1310, 22, 12)} seed={53} solid={PAPER} o={{strokeWidth: 4}} />
        </Stage>
      </Camera>
      <Narration lines={['하린이는 오늘도', '아빠 없이 저녁을 먹습니다']} y={290} from={8} to={B_DUR + 14} />
    </AbsoluteFill>
  );
};

export const S04: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={A_DUR}>
      <S04A />
    </Sequence>
    <Sequence from={A_DUR}>
      <S04B />
    </Sequence>
  </AbsoluteFill>
);
