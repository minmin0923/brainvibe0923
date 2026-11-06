import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera, Stage, Wash} from '../../lib/paper';
import {FreezeBoil, Rough, ellipse, line, path, rect, useTwos} from '../../lib/rough';
import {COAT, DAY, EP2, HOME, INK, JUMPER, PAPER, PINK, SKIN, WHITE} from '../../lib/palette';
import {GOWUN, Handwrite, Narration, PEN} from '../../lib/Caption';
import {Dad, DadHead} from '../../chars/Dad';
import {HarinHead} from '../../chars/Harin';
import {Mom, MomHead} from '../../chars/Mom';
import {TRAIN_STOP_X} from '../../lib/HarinDrawing';
import {Cold, Fill} from '../lib/Props';
import {WallClock} from '../lib/WallClock';
import {DrawingEP2} from '../lib/DrawingEP2';
import {EVENTS, SCENES, SUB} from '../timeline';

/** S12-A. 아파트 복도 — 엘리베이터 '띵', 넥타이를 반쯤 푼 아빠(퇴근 버전)가 걸어온다. 벽시계 21:46 */
const Corridor: React.FC = () => {
  const f = useCurrentFrame();
  const t2 = useTwos();
  const dur = SUB.S12B - SCENES.S12.from;
  const walk = interpolate(f, [0, dur], [0, 1]);
  const bob = Math.abs(Math.sin(t2 * 0.35)) * -8;
  return (
    <AbsoluteFill>
      <Fill color={EP2.night2} />
      <Cold>
        <Camera dur={dur} from={{s: 1.0}} to={{s: 1.05}} origin={[540, 1100]}>
          <Wash blobs={[{x: 540, y: 300, r: 500, color: EP2.office, o: 0.35}]} blur={80} blend="screen" />
          <Stage>
            {/* 원근 복도 */}
            <path d="M 0 0 L 380 700 L 700 700 L 1080 0 Z" fill={EP2.subway} opacity={0.5} />
            <path d="M 0 1920 L 380 1100 L 700 1100 L 1080 1920 Z" fill={EP2.night} opacity={0.6} />
            <Rough boil="bg" shape={rect(380, 700, 320, 400)} seed={1} solid={EP2.subwayPale} o={{fill: EP2.subway, strokeWidth: 5}} />
            <Rough boil="bg" shape={line(540, 700, 540, 1100)} seed={2} o={{strokeWidth: 4}} />
            <circle cx={540} cy={670} r={12} fill={EP2.office} />
            {[0, 1, 2].map((i) => (
              <Rough key={i} boil="bg" shape={rect(40 + i * 40, 520 + i * 260, 120 - i * 30, 360 - i * 80)} seed={4 + i} solid={EP2.night3} o={{strokeWidth: 4}} />
            ))}
            <WallClock x={880} y={600} r={64} time="21:46" face={EP2.office} />
            <Dad x={540} y={1400 + walk * 320 + bob} scale={0.75 + walk * 0.35} version="home" tone="cold" pose={{briefcase: true, armL: 8, mouth: 'flat', eyes: 'open', headTilt: 6}} />
          </Stage>
        </Camera>
      </Cold>
    </AbsoluteFill>
  );
};

/** S12-B. 도어락 — 한 손으로 감싸 소리를 막고 천천히 누른다. 문틈의 따뜻한 빛이 처음으로 아빠 얼굴에 닿는다. */
const DoorLock: React.FC = () => {
  const f = useCurrentFrame();
  const beeps = EVENTS.lockBeeps.map((b) => b - SUB.S12B);
  const press = beeps.findIndex((b) => f >= b && f < b + 5);
  const open = EVENTS.doorOpen - SUB.S12B; // 33
  const light = interpolate(f, [open, open + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const keyPos = (i: number): [number, number] => [430 + (i % 3) * 70, 900 + Math.floor(i / 3) * 70];
  const order = [1, 4, 6, 8];
  const finger = press >= 0 ? keyPos(order[press]) : keyPos(order[Math.min(3, beeps.filter((b) => f >= b).length)]);
  return (
    <AbsoluteFill>
      <Fill color={EP2.night} />
      <Camera dur={45} from={{s: 1.0}} to={{s: 1.04}} origin={[600, 1000]}>
        <Cold>
          <Stage>
            {/* 현관문 */}
            <Rough boil="bg" shape={rect(220, 200, 640, 1620)} seed={10} solid={EP2.night3} o={{fill: EP2.night2, hachureGap: 12}} />
            {/* 도어락 키패드 */}
            <Rough shape={rect(380, 820, 280, 340)} seed={11} solid={EP2.night} o={{strokeWidth: 6, stroke: EP2.subwayPale}} />
            {Array.from({length: 12}).map((_, i) => {
              const [kx, ky] = keyPos(i);
              const lit = press >= 0 && order[press] === i;
              return <circle key={i} cx={kx} cy={ky} r={20} fill={lit ? EP2.phone : EP2.subway} />;
            })}
          </Stage>
        </Cold>
        {/* 문틈으로 새는 스탠드의 따뜻한 빛 */}
        <Stage>
          <path d={`M 860 200 L ${860 + light * 60} 200 L ${860 + light * 420} 1820 L 860 1820 Z`} fill={EP2.bulb} opacity={light * 0.6} />
        </Stage>
        <Wash blobs={[{x: 960, y: 900, r: 380 * light + 10, color: EP2.bulb, o: 0.65 * light}]} blur={70} blend="screen" />
        <Cold>
          <Stage>
            {/* 소리를 막으려 키패드를 감싼 왼손 + 누르는 오른손 검지 */}
            <Rough shape={path('M -60 900 L 360 820 L 380 1000 L -60 1100 Z')} seed={20} solid={COAT} o={{fill: COAT}} />
            <Rough shape={path('M 330 800 Q 420 760 470 820 L 470 990 Q 400 1010 330 980 Z')} seed={21} solid={EP2.office} o={{strokeWidth: 5}} />
            <Rough shape={path(`M 1140 ${finger[1] + 160} L ${finger[0] + 60} ${finger[1] + 60} L ${finger[0] + 40} ${finger[1] + 150} L 1140 ${finger[1] + 260} Z`)} seed={22} solid={COAT} o={{fill: COAT}} />
            <Rough shape={ellipse(finger[0] + 50, finger[1] + 50, 110, 90)} seed={23} solid={EP2.office} />
            <Rough shape={ellipse(finger[0] + 4, finger[1] + 6, 38, 70)} seed={24} solid={EP2.office} o={{strokeWidth: 4}} style={{transform: 'rotate(-35deg)', transformOrigin: `${finger[0]}px ${finger[1]}px`}} />
          </Stage>
        </Cold>
        {/* 아빠 얼굴(오른쪽): 차가운 톤 → 따뜻한 빛이 닿으며 따뜻한 톤 */}
        <Stage>
          <g transform="translate(980 560) scale(1.5)">
            <g opacity={1 - light}>
              <Cold>
                <DadHead cx={0} cy={0} version="home" tone="cold" mouth="flat" look={-8} seed={640} />
              </Cold>
            </g>
            <g opacity={light}>
              <DadHead cx={0} cy={0} version="home" tone="warm" mouth="flat" look={-8} eyes={light > 0.9 ? 'open' : 'open'} seed={640} />
            </g>
          </g>
        </Stage>
      </Camera>
    </AbsoluteFill>
  );
};

export const S12: React.FC = () => {
  const split = SUB.S12B - SCENES.S12.from;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={split}>
        <Corridor />
      </Sequence>
      <Sequence from={split}>
        <DoorLock />
      </Sequence>
    </AbsoluteFill>
  );
};

/** S13-A. 어두운 식탁 — 엎드려 졸던 엄마가 고개를 든다. 랩 씌운 그릇 둘 + 비어 있는 하린의 그릇 */
const MomWakes: React.FC = () => {
  const t2 = useTwos();
  const lift = interpolate(t2, [4, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Fill color={HOME.night} />
      <Camera dur={51} from={{s: 1.0}} to={{s: 1.05}} origin={[540, 1100]}>
        <Wash blobs={[{x: 700, y: 700, r: 420, color: EP2.bulb, o: 0.4}]} blur={80} blend="screen" />
        <Stage>
          <Rough boil="bg" shape={rect(-40, 1200, 1160, 120)} seed={1} solid={DAY.amber} o={{fill: DAY.amber, hachureGap: 10}} />
          {/* 랩 씌운 그릇 두 개 + 빈 하린 그릇 */}
          {[620, 820].map((bx, i) => (
            <g key={i}>
              <Rough shape={path(`M ${bx - 70} 1200 Q ${bx} 1270 ${bx + 70} 1200 Z`)} seed={10 + i} solid={PAPER} />
              <path d={`M ${bx - 74} 1196 Q ${bx} 1170 ${bx + 74} 1196`} stroke={WHITE} strokeWidth={4} fill="none" opacity={0.8} />
              <path d={`M ${bx - 40} 1188 l 20 -6 M ${bx + 10} 1184 l 22 4`} stroke={WHITE} strokeWidth={3} opacity={0.7} />
            </g>
          ))}
          <Rough shape={path('M 960 1200 Q 1010 1250 1060 1200 Z')} seed={13} solid={PAPER} o={{strokeWidth: 4}} />
          {/* 엄마: 팔에 엎드렸다가 고개를 든다 */}
          <Rough shape={path('M 80 1200 Q 160 1100 420 1110 L 470 1200 Z')} seed={20} solid={EP2.sage} o={{fill: EP2.sage}} />
          <g transform={`translate(${280 + (1 - lift) * 40} ${1150 - lift * 170}) rotate(${(1 - lift) * 70})`}>
            <MomHead cx={0} cy={0} eyes={lift > 0.6 ? 'tired' : 'closed'} mouth={lift > 0.8 ? 'smile' : 'flat'} seed={1650} />
          </g>
          <Rough shape={path('M 120 1920 Q 140 1120 300 1080 Q 460 1120 480 1920 Z')} seed={21} solid={EP2.sage} o={{fill: EP2.sage}} />
          <Rough shape={path('M 210 1920 L 220 1200 L 380 1200 L 390 1920 Z')} seed={22} solid={EP2.homeSand} o={{fill: EP2.homeSand, hachureGap: 12}} />
        </Stage>
      </Camera>
      <Handwrite lines={['"왔어?"']} y={600} from={EVENTS.momWake - SCENES.S13.from} size={96} color={PAPER} />
    </AbsoluteFill>
  );
};

/** S13-B. 소파 옆에 무릎 꿇은 아빠가 잠든 하린의 머리를 쓰다듬는다 */
const Kneel: React.FC = () => {
  const t2 = useTwos();
  const stroke = Math.sin(t2 * 0.22) * 22;
  return (
    <AbsoluteFill>
      <Fill color={HOME.night} />
      <Camera dur={48} from={{s: 1.04}} to={{s: 1.08}} origin={[540, 1200]}>
        <Wash blobs={[{x: 860, y: 800, r: 420, color: EP2.bulb, o: 0.5}]} blur={80} blend="screen" />
        <Stage>
          <Rough boil="bg" shape={rect(-40, 1060, 760, 300)} seed={1} solid={EP2.homeAmber} o={{fill: EP2.homeAmber, hachureGap: 10}} />
          <g transform="translate(260 1150) rotate(-70) scale(0.9)">
            <HarinHead cx={0} cy={0} eyes="closed" mouth="o" seed={196} />
          </g>
          <Rough shape={path('M 330 1240 Q 480 1160 720 1220 L 740 1320 L 320 1330 Z')} seed={2} solid={EP2.sage} o={{fill: EP2.sage}} />
          <Dad x={760} y={1900} scale={1.1} flip version="home" tone="warm" pose={{crouch: 1, handR: [300 + stroke, 1080], armL: 10, mouth: 'smile', eyes: 'open', look: -6, headTilt: -10}} />
        </Stage>
      </Camera>
      <Handwrite lines={['"다녀왔어."']} y={560} from={EVENTS.dadSays - SUB.S13B} size={92} color={PAPER} />
    </AbsoluteFill>
  );
};

/** S13-C. 그림 공개 — 1탄의 분홍 지하철과 "우리집", 그리고 처음 보이는 오른쪽 아래(세 사람 + "아빠 일찍 와") */
const Reveal: React.FC = () => {
  const f = useCurrentFrame();
  const slide = interpolate(f, [0, 12], [260, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <Fill color={HOME.night} />
      {/* 그림 전체 → 오른쪽 아래(세 사람 + 글씨)로 밀고 들어간다 */}
      <Camera dur={51} from={{s: 1.0, y: 0}} to={{s: 1.22, y: -40}} origin={[560, 1260]}>
        <Wash blobs={[{x: 540, y: 1000, r: 600, color: EP2.bulb, o: 0.45}]} blur={80} blend="screen" />
        <Stage>
          <g transform={`translate(0 ${slide})`}>
            <rect x={30} y={360} width={1020} height={1180} fill={PAPER} transform="rotate(-1.5 540 960)" />
            <g transform="translate(60 420) scale(0.96)">
              <DrawingEP2 boil="char" />
            </g>
            {/* 그림을 쥔 아빠 두 손 */}
            <Rough shape={ellipse(50, 1400, 140, 120)} seed={30} solid={SKIN} />
            <Rough shape={ellipse(1030, 1380, 140, 120)} seed={31} solid={SKIN} />
          </g>
        </Stage>
      </Camera>
    </AbsoluteFill>
  );
};

/** S13-D. 아빠 눈 클로즈업 — 눈가 반짝임과 볼터치 번짐(눈물 방울은 그리지 않음), 떨리는 손가락 */
const Eyes: React.FC = () => {
  const f = useCurrentFrame();
  const well = interpolate(f, [4, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tremble = Math.sin(f * 2.7) * 2.5;
  return (
    <AbsoluteFill>
      <Fill color={HOME.night} />
      <Camera dur={50} from={{s: 1.0}} to={{s: 1.06}} origin={[540, 1000]}>
        <Wash blobs={[{x: 540, y: 1200, r: 600, color: EP2.bulb, o: 0.45}]} blur={80} blend="screen" />
        <Stage>
          <g transform="translate(540 1040) scale(4.1)">
            <DadHead cx={0} cy={0} version="home" tone="warm" mouth="flat" welling={well} seed={650} />
          </g>
          <g transform={`translate(${tremble} 1720)`}>
            <rect x={240} y={-40} width={600} height={260} fill={PAPER} stroke={INK} strokeWidth={5} />
            <Rough shape={ellipse(250, 60, 150, 130)} seed={40} solid={SKIN} />
            <Rough shape={ellipse(830, 60, 150, 130)} seed={41} solid={SKIN} />
          </g>
        </Stage>
      </Camera>
      <Narration lines={['아빠도,', '일찍 오고 싶어.']} y={300} from={10} to={52} size={58} />
    </AbsoluteFill>
  );
};

/** S13. 다녀왔어 (0:40.0–0:46.7) */
export const S13: React.FC = () => {
  const a = SUB.S13B - SCENES.S13.from;
  const b = SUB.S13C - SCENES.S13.from;
  const c = SUB.S13D - SCENES.S13.from;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={a}>
        <MomWakes />
      </Sequence>
      <Sequence from={a} durationInFrames={b - a}>
        <Kneel />
      </Sequence>
      <Sequence from={b} durationInFrames={c - b}>
        <Reveal />
      </Sequence>
      <Sequence from={c}>
        <Eyes />
      </Sequence>
    </AbsoluteFill>
  );
};

/** 한 획씩 써지는 카드 글씨(왼→오 드러남) */
const WritingLine: React.FC<{x: number; y: number; text: string; from: number; to: number; size?: number; id: string}> = ({x, y, text, from, to, size = 80, id}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [from, to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const w = text.length * size * 0.62;
  return (
    <g>
      <defs>
        <clipPath id={`wl-${id}`}>
          <rect x={x - 10} y={y - size} width={10 + p * w} height={size * 1.4} />
        </clipPath>
      </defs>
      <text x={x} y={y} fontFamily={PEN} fontSize={size} fill={INK} clipPath={`url(#wl-${id})`}>
        {text}
      </text>
    </g>
  );
};

/** S14-A. 늦은 밤 식탁 — 냉장고 자석 아래 있던 염원 카드에 아빠가 쓰고, 엄마가 한 줄을 더한다. */
const Card: React.FC = () => {
  const f = useCurrentFrame();
  const t2 = useTwos();
  const momIn = interpolate(f, [56, 66], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dadWriting = f < 62;
  const pen = dadWriting
    ? [220 + ((f - 4) / 58) * 560, f < 32 ? 1010 : 1120]
    : [230 + Math.max(0, (f - 70) / 28) * 600, 1260];
  const jit = Math.sin(t2 * 1.3) * 5;
  return (
    <AbsoluteFill>
      <Fill color={HOME.night} />
      <Camera dur={100} from={{s: 1.0}} to={{s: 1.05}} origin={[540, 1100]}>
        <Wash blobs={[{x: 820, y: 640, r: 460, color: EP2.bulb, o: 0.55}, {x: 540, y: 1150, r: 520, color: EP2.bulb, o: 0.3}]} blur={80} blend="screen" />
        <Stage>
          {/* 스탠드 하나 */}
          <Rough boil="bg" shape={line(860, 300, 860, 760)} seed={1} o={{strokeWidth: 6}} />
          <Rough shape={path('M 790 520 L 930 520 L 900 440 L 820 440 Z')} seed={2} solid={EP2.bulb} o={{fill: EP2.bulb}} />
          <Rough boil="bg" shape={rect(-40, 760, 1160, 1200)} seed={3} solid={DAY.amber} o={{fill: DAY.amber, hachureGap: 12}} />
          {/* 아빠 어깨(왼쪽 위) */}
          <Rough shape={path('M -60 400 Q 200 380 330 560 L 260 760 L -60 760 Z')} seed={4} solid={COAT} o={{fill: COAT}} />
          {/* 염원 카드(1탄의 그 카드, 로고 없는 손그림) */}
          <Rough shape={rect(140, 880, 820, 480)} seed={5} solid={PAPER} o={{fill: undefined, strokeWidth: 5}} />
          <circle cx={550} cy={860} r={26} fill={EP2.homeAmber} stroke={INK} strokeWidth={4} />
          <WritingLine x={200} y={1010} text="딸이 잠들기 전에" from={4} to={32} id="a" />
          <WritingLine x={200} y={1120} text="집에 오고 싶다" from={32} to={60} id="b" />
          <WritingLine x={200} y={1260} text="셋이 같이 저녁 먹는 날" from={70} to={98} size={70} id="c" />
          {/* 연필 쥔 손: 아빠(코트 소매) → 엄마(니트 소매) */}
          <g transform={`translate(${pen[0] + jit} ${pen[1]})`}>
            <Rough shape={path('M 0 0 L 10 -8 L 120 110 L 104 124 Z')} seed={10} solid={EP2.homeAmber} o={{fill: INK, hachureGap: 6, strokeWidth: 4}} />
            <Rough shape={ellipse(110, 150, 150, 120)} seed={11} solid={SKIN} />
            <Rough shape={path('M 150 180 L 560 400 L 500 560 L 100 260 Z')} seed={12} solid={dadWriting ? COAT : EP2.sage} o={{fill: dadWriting ? COAT : EP2.sage}} />
          </g>
          {/* 엄마 손이 아빠 어깨 위에 */}
          <g opacity={momIn} transform={`translate(0 ${(1 - momIn) * -120})`}>
            <Rough shape={path('M 380 -40 L 300 380 L 200 380 L 260 -40 Z')} seed={13} solid={EP2.sage} o={{fill: EP2.sage}} />
            <Rough shape={ellipse(240, 440, 130, 100)} seed={14} solid={SKIN} />
          </g>
        </Stage>
      </Camera>
    </AbsoluteFill>
  );
};

/** S14-B. 현관 앞 — 하린의 운동화 옆에 아빠의 낡은 구두와 엄마의 운동화, 노란 가방에 그림과 카드 */
const Shoes: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const placeDad = spring({frame: f - 4, fps, config: {damping: 14}});
  const placeMom = spring({frame: f - 14, fps, config: {damping: 14}});
  return (
    <AbsoluteFill>
      <Fill color={HOME.night} />
      <Camera dur={100} from={{s: 1.0}} to={{s: 1.07}} origin={[540, 1200]}>
        <Wash blobs={[{x: 900, y: 500, r: 400, color: EP2.office, o: 0.3}, {x: 400, y: 1300, r: 520, color: EP2.bulb, o: 0.35}]} blur={80} blend="screen" />
        <Stage>
          {/* 창밖 아주 옅은 새벽빛 */}
          <Rough boil="bg" shape={rect(700, 300, 300, 420)} seed={1} solid={EP2.night3} o={{fill: EP2.night3, strokeWidth: 6}} />
          <rect x={704} y={304} width={292} height={412} fill={EP2.office} opacity={interpolate(f, [0, 100], [0.05, 0.35])} />
          <Rough boil="bg" shape={rect(-40, 1360, 1160, 600)} seed={2} solid={EP2.homeSand} o={{fill: EP2.homeAmber, hachureGap: 14}} />
          {/* 노란 가방 + 그림·카드 */}
          <Rough boil="bg" shape={line(160, 600, 160, 640)} seed={3} o={{strokeWidth: 6}} />
          <Rough shape={path('M 70 760 Q 160 600 250 760 L 270 1040 L 50 1040 Z')} seed={4} solid={JUMPER} o={{fill: JUMPER}} />
          <g transform="translate(120 690) rotate(-8)">
            <rect x={0} y={0} width={120} height={150} fill={PAPER} stroke={INK} strokeWidth={4} />
            <rect x={14} y={60} width={92} height={36} fill={PINK.crayon} />
          </g>
          <g transform="translate(200 700) rotate(10)">
            <rect x={0} y={0} width={100} height={130} fill={PAPER} stroke={INK} strokeWidth={4} />
            <line x1={14} y1={40} x2={80} y2={40} stroke={INK} strokeWidth={3} />
            <line x1={14} y1={70} x2={70} y2={70} stroke={INK} strokeWidth={3} />
          </g>
          {/* 하린 운동화(분홍 끈) */}
          <g>
            {[300, 380].map((sx, i) => (
              <g key={i}>
                <Rough shape={ellipse(sx, 1480, 90, 46)} seed={10 + i} solid={PAPER} o={{strokeWidth: 5}} />
                <Rough shape={line(sx - 20, 1470, sx + 14, 1464)} seed={12 + i} o={{stroke: PINK.line8, strokeWidth: 5}} />
              </g>
            ))}
          </g>
          {/* 아빠의 낡은 구두 */}
          <g opacity={placeDad} transform={`translate(0 ${(1 - placeDad) * -60})`}>
            {[520, 640].map((sx, i) => (
              <g key={i}>
                <Rough shape={ellipse(sx, 1490, 130, 58)} seed={20 + i} solid={INK} o={{fill: INK}} />
                <path d={`M ${sx - 30} ${1474} q 14 -8 28 0`} stroke={EP2.subwayPale} strokeWidth={3} fill="none" />
              </g>
            ))}
          </g>
          {/* 엄마 운동화 */}
          <g opacity={placeMom} transform={`translate(0 ${(1 - placeMom) * -60})`}>
            {[790, 890].map((sx, i) => (
              <Rough key={i} shape={ellipse(sx, 1486, 110, 50)} seed={30 + i} solid={EP2.sage} o={{strokeWidth: 5}} />
            ))}
          </g>
        </Stage>
      </Camera>
      <Narration lines={['그래서 이번 주말,', '우리 가족은 광화문에 갑니다']} y={300} from={Math.round(50.3 * 30) - SUB.S14B} to={115} />
    </AbsoluteFill>
  );
};

/** S14. 그래서 우리는 — 2탄 절정 */
export const S14: React.FC = () => {
  const split = SUB.S14B - SCENES.S14.from;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={split}>
        <Card />
      </Sequence>
      <Sequence from={split}>
        <Shoes />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * S15. 시리즈 엔딩 — 1탄 엔딩과 같은 장면·같은 프레임.
 * 분홍 지하철이 달려와 "우리집" 앞에 멈추고(1탄과 같은 시각), 2탄에서만 막대 인형 아빠가 내려 집에 들어가며
 * 창에 불이 켜지고 식탁의 빈자리가 채워진다.
 */
export const S15: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const abs = SCENES.S15.from + frame;
  const hold = EVENTS.holdFrom;
  const a = Math.min(abs, hold);
  const moveFrom = EVENTS.trainMoveFrom;
  const stopAt = EVENTS.trainStop;
  const run = interpolate(a, [moveFrom, stopAt - 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.6, 0.35, 1)});
  const settle = spring({frame: a - (stopAt - 4), fps, config: {damping: 9, stiffness: 160, mass: 0.6}});
  const overshoot = a >= stopAt - 4 ? (1 - settle) * -14 + Math.sin(settle * Math.PI) * 10 : 0;
  const startX = -900;
  const tx = startX + (TRAIN_STOP_X - startX) * run + overshoot;
  const moving = a > moveFrom && a < stopAt + 6;
  const bob = moving ? Math.sin(a * 1.6) * 3 : 0;
  const wheel = ((tx - startX) / 23) * (180 / Math.PI);
  const doll = interpolate(a, [EVENTS.dollOut, EVENTS.dollIn + 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const windowOn = interpolate(a, [EVENTS.windowOn, EVENTS.windowOn + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const seat = interpolate(a, [EVENTS.seatFill, EVENTS.seatFill + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const glow = interpolate(a, [stopAt, stopAt + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fade = (at: number, d = 10) => interpolate(a, [at, at + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleIn = fade(EVENTS.endTitle);
  const body = (
    <AbsoluteFill>
      <Fill color={HOME.night} />
      <Camera dur={hold - SCENES.S15.from} from={{s: 1.0}} to={{s: 1.05}} origin={[600, 1100]}>
        <Stage>
          <Rough boil="bg" shape={path('M -40 1640 Q 300 1580 600 1660 T 1120 1620 L 1120 1980 L -40 1980 Z')} seed={2} solid={HOME.slate} o={{fill: HOME.slate, hachureGap: 12}} />
          <g transform="rotate(-1.6 540 960)">
            <rect x={14} y={210} width={1052} height={1440} fill={PAPER} />
            <Rough boil="bg" shape={rect(14, 210, 1052, 1440)} seed={3} o={{strokeWidth: 3, stroke: DAY.sand, roughness: 0.8}} />
          </g>
        </Stage>
        <Wash
          blobs={[
            {x: 660, y: 1100, r: 520 * (0.4 + glow * 0.7), color: DAY.sun, o: 0.85 * glow},
            {x: 700, y: 760, r: 200 + 200 * windowOn, color: EP2.bulb, o: 0.5 * windowOn},
          ]}
          blur={70}
        />
        <Stage>
          <g transform="translate(160 560) scale(0.77)">
            <DrawingEP2 trainX={tx} trainBob={bob} wheel={wheel} glow={glow} doll={doll} windowOn={windowOn} seatFill={seat} />
          </g>
        </Stage>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 70% 55% at 55% 60%, rgba(27,34,51,0) ${62 + glow * 20}%, rgba(27,34,51,${0.55 - glow * 0.35}) 100%)`,
          }}
        />
      </Camera>
      {/* 1탄과 같은 엔딩 타이틀(120px + 크레용 질감) */}
      <div style={{position: 'absolute', left: 60, width: 880, top: 268, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 18}px)`}}>
        <svg width={880} height={290} style={{overflow: 'visible'}}>
          <g filter="url(#crayon-text)" fontFamily={GOWUN} fontSize={120} textAnchor="middle">
            <text x={440} y={112} fill={PINK.line8}>
              8호선,
            </text>
            <text x={440} y={252} fill={INK}>
              의정부까지.
            </text>
          </g>
        </svg>
      </div>
      <div style={{position: 'absolute', left: 60, width: 880, top: 1352, textAlign: 'center', fontFamily: GOWUN, fontSize: 38, color: INK, opacity: fade(EVENTS.endEp1, 8)}}>
        1탄 「의정부의 염원을 싣고」로 이어집니다
      </div>
      <div style={{position: 'absolute', left: 60, width: 880, top: 1408, textAlign: 'center', fontFamily: GOWUN, fontSize: 44, color: INK, opacity: fade(EVENTS.endSub, 8)}}>
        프로필 링크에서 서명해 주세요
      </div>
    </AbsoluteFill>
  );
  return abs >= hold ? <FreezeBoil at={hold}>{body}</FreezeBoil> : body;
};

export {Mom};
