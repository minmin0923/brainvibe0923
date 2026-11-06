import React from 'react';
import {AbsoluteFill, interpolate, random, Sequence, useCurrentFrame} from 'remotion';
import {Camera, Stage, Wash} from '../../lib/paper';
import {Rough, circle, ellipse, line, path, rect, useTwos} from '../../lib/rough';
import {COAT, COLD_SKIN, EP2, INK, JUMPER, PAPER, WHITE} from '../../lib/palette';
import {GOWUN, Handwrite, Narration} from '../../lib/Caption';
import {Dad, DadHead} from '../../chars/Dad';
import {HarinHead} from '../../chars/Harin';
import {HarinDrawing} from '../../lib/HarinDrawing';
import {Cold, Crowd, Fill, Phone, Wallet} from '../lib/Props';
import {WallClock} from '../lib/WallClock';
import {ChatBubble} from '../lib/ChatBubble';
import {EVENTS, SCENES, SUB} from '../timeline';

/** 레일 리듬 흔들림(오스티나토 박자 = 12.5프레임) */
const railBump = (f: number) => {
  const ph = f % 12.5;
  return ph < 3 ? -3 * Math.sin((ph / 3) * Math.PI) : 0;
};

/** S4. 서서 가는 1호선 — 손잡이 + 가슴에 안은 서류가방, 창밖은 어둠에서 새벽빛으로. */
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const t2 = useTwos();
  const dur = SCENES.S04.to - SCENES.S04.from;
  const dawn = interpolate(f, [0, dur], [0, 1]);
  const jolt = EVENTS.wakeJolt - SCENES.S04.from; // 62
  const eyes = t2 >= 30 && t2 < jolt ? 'closed' : 'open';
  const badge = f < 84 ? '+23' : '+41';
  return (
    <AbsoluteFill style={{transform: `translateY(${railBump(f) + (f >= jolt && f < jolt + 4 ? -6 : 0)}px)`}}>
      <Fill color={EP2.subwayPale} />
      <Cold>
        <Camera dur={dur} from={{s: 1.0, x: 10}} to={{s: 1.05, x: -16}} origin={[540, 1000]}>
          <Stage>
            {/* 창: 어둠 → 새벽빛(차가운 푸른 회색) */}
            <Rough boil="bg" shape={rect(40, 600, 1000, 520)} seed={1} solid={EP2.night} o={{fill: EP2.night, strokeWidth: 7}} />
            <rect x={44} y={604} width={992} height={512} fill={EP2.office} opacity={dawn * 0.75} />
            <defs>
              <clipPath id="ep2s4-win">
                <rect x={44} y={604} width={992} height={512} />
              </clipPath>
            </defs>
            <g clipPath="url(#ep2s4-win)">
              {Array.from({length: 7}).map((_, i) => {
                const x = 1300 - ((f * (40 + random(`v${i}`) * 20) + i * 260) % 1700);
                const y = 640 + random(`w${i}`) * 440;
                return <line key={i} x1={x} y1={y} x2={x + 240} y2={y - 26} stroke={EP2.phone} strokeWidth={5} opacity={0.7 * (1 - dawn * 0.6)} strokeLinecap="round" />;
              })}
              {/* 창에 비친 얼굴 */}
              <g opacity={0.3} transform="translate(300 850) scale(0.85)">
                <DadHead cx={0} cy={0} eyes={eyes} mouth="flat" version="out" tone="cold" seed={610} />
              </g>
            </g>
            <Rough boil="bg" shape={line(-40, 450, 1120, 450)} seed={3} o={{strokeWidth: 9, stroke: EP2.subway}} />
            {[180, 420, 860].map((sx, i) => (
              <g key={i} transform={`rotate(${Math.sin(f / 8 + i) * 4} ${sx} 450)`}>
                <Rough shape={line(sx, 450, sx, 510)} seed={5 + i} o={{strokeWidth: 5, stroke: EP2.subway}} />
                <Rough shape={circle(sx, 532, 46)} seed={10 + i} o={{strokeWidth: 6, stroke: EP2.subway}} />
              </g>
            ))}
            <Crowd n={3} y={1980} color={EP2.subway} seed="c4" s={1.6} spread={1300} />
            {/* 아빠: 오른손 손잡이, 왼팔로 서류가방을 가슴에 */}
            <Dad x={600} y={1990} scale={1.45} version="out" tone="cold" pose={{handR: [640, 545], handL: [600, 1320], eyes, mouth: 'flat', headTilt: eyes === 'closed' ? 6 : 0}} />
            <Rough shape={rect(470, 1280, 260, 180)} seed={20} solid={EP2.officeNight} o={{fill: INK, hachureGap: 12}} />
            <Rough shape={path('M 560 1282 q 40 -40 80 0')} seed={21} o={{strokeWidth: 6}} />
          </Stage>
        </Camera>
      </Cold>
      {/* 인서트: 회사 단톡 알림 숫자가 늘어남 */}
      <Sequence from={74} durationInFrames={26}>
        <AbsoluteFill>
          <Fill color={EP2.night} />
          <Stage>
            <Phone x={540} y={960} s={1.6} id="s4" time="06:38">
              <rect x={-150} y={-280} width={300} height={560} fill={EP2.subway} />
              <circle cx={60} cy={60} r={64} fill={EP2.phone} />
              <text x={60} y={84} textAnchor="middle" fontFamily={GOWUN} fontSize={64} fill={EP2.night}>
                {badge}
              </text>
              <rect x={-110} y={-10} width={110} height={140} rx={20} fill={EP2.office} />
            </Phone>
          </Stage>
        </AbsoluteFill>
      </Sequence>
      <Narration lines={['앉을 자리는 없고,', '졸 틈도 없습니다']} y={400} from={6} to={74} backdrop />
    </AbsoluteFill>
  );
};

/** S5-A. 환승 계단 하이앵글 — 수백 개의 발(회색) 중 아빠의 낡은 구두만 선명 */
const Stairs: React.FC = () => {
  const t2 = useTwos();
  const steps = 14;
  return (
    <AbsoluteFill>
      <Fill color={EP2.subway} />
      <Cold>
        <Camera dur={60} from={{s: 1.0, y: 0}} to={{s: 1.05, y: 30}}>
          <Stage>
            {Array.from({length: steps}).map((_, i) => (
              <Rough key={i} boil="bg" shape={line(-40, 200 + i * 130, 1120, 160 + i * 130)} seed={30 + i} o={{stroke: EP2.subwayPale, strokeWidth: 6}} />
            ))}
            {Array.from({length: 46}).map((_, i) => {
              const col = i % 8;
              const row = Math.floor(i / 8);
              const climb = (t2 * 6 + row * 40) % 260;
              const x = 70 + col * 132 + random(`fx${i}`) * 40;
              const y = 1800 - row * 300 - climb + random(`fy${i}`) * 60;
              const step = Math.floor(t2 / 6 + i) % 2;
              const dad = i === 19;
              const c = dad ? INK : EP2.subwayPale;
              return (
                <g key={i} opacity={dad ? 1 : 0.75}>
                  <Rough boil={dad ? 'char' : 'bg'} shape={ellipse(x, y - step * 30, 46, 92)} seed={100 + i} solid={c} o={{fill: c, stroke: dad ? INK : EP2.subway, strokeWidth: dad ? 6 : 4}} />
                  <Rough boil={dad ? 'char' : 'bg'} shape={ellipse(x + 56, y + 40 - (1 - step) * 30, 46, 92)} seed={200 + i} solid={c} o={{fill: c, stroke: dad ? INK : EP2.subway, strokeWidth: dad ? 6 : 4}} />
                  {dad && (
                    // 낡은 구두: 해진 앞코와 주름
                    <g stroke={EP2.office} strokeWidth={3} fill="none">
                      <path d={`M ${x - 12} ${y - step * 30 - 30} q 12 -8 24 0`} />
                      <path d={`M ${x + 44} ${y + 10 - (1 - step) * 30} q 12 -8 24 0`} />
                    </g>
                  )}
                </g>
              );
            })}
          </Stage>
        </Camera>
      </Cold>
    </AbsoluteFill>
  );
};

/** S5-B. 출입 게이트 — 닳은 교통카드 지갑, 벽시계 07:24 */
const Gate: React.FC = () => {
  const f = useCurrentFrame();
  const tap = EVENTS.gateBeep - SUB.S05B; // 11
  const handX = interpolate(f, [0, tap], [900, 560], {extrapolateRight: 'clamp'});
  const lit = f >= tap && f < tap + 10;
  return (
    <AbsoluteFill>
      <Fill color={EP2.office} />
      <Cold>
        <Camera dur={41} from={{s: 1.0}} to={{s: 1.05}} origin={[520, 1100]}>
          <Stage>
            <WallClock x={820} y={600} r={86} time="07:24" face={PAPER} />
            <Rough boil="bg" shape={rect(160, 1000, 640, 900)} seed={40} solid={EP2.subwayPale} o={{fill: EP2.subway, hachureGap: 12}} />
            <Rough boil="bg" shape={rect(360, 1060, 240, 150)} seed={41} solid={lit ? EP2.phone : EP2.night3} o={{strokeWidth: 6}} />
            <Rough shape={path(`M 1200 1220 L ${handX + 160} 1150 L ${handX + 170} 1260 L 1200 1330 Z`)} seed={42} solid={COAT} o={{fill: COAT}} />
            <Wallet x={handX} y={1140} s={1.25} rot={-6} />
            <Rough shape={ellipse(handX + 110, 1190, 140, 110)} seed={43} solid={COLD_SKIN} />
          </Stage>
        </Camera>
      </Cold>
    </AbsoluteFill>
  );
};

/** S5. 환승 계단 → 회사 출입 게이트 */
export const S05: React.FC = () => {
  const split = SUB.S05B - SCENES.S05.from;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={split}>
        <Stairs />
      </Sequence>
      <Sequence from={split}>
        <Gate />
      </Sequence>
      <Narration lines={['회사에 닿기도 전에', '하루가 지쳐 있습니다']} y={400} from={8} to={SCENES.S05.to - SCENES.S05.from} backdrop />
    </AbsoluteFill>
  );
};

/** S6-A. 하루가 지나간 창 — 타임랩스로 해가 뜨고 지며 사무실 불이 하나씩 꺼지고 아빠 자리만 남는다. */
const Timelapse: React.FC = () => {
  const f = useCurrentFrame();
  const dur = SUB.S06B - SCENES.S06.from;
  const p = f / dur;
  const sky = p < 0.5 ? EP2.office : EP2.officeNight;
  const offAt = (i: number) => 0.45 + i * 0.09;
  return (
    <AbsoluteFill>
      <Fill color={EP2.officeNight} />
      <Cold>
        <Camera dur={dur} from={{s: 1.0}} to={{s: 1.05}} origin={[540, 1200]}>
          <Wash blobs={[{x: 540 + Math.cos(p * Math.PI) * 400, y: 760 - Math.sin(p * Math.PI) * 300, r: 160, color: WHITE, o: 0.6 * Math.sin(p * Math.PI)}]} blur={60} blend="screen" />
          <Stage>
            <rect x={60} y={420} width={960} height={760} fill={sky} opacity={0.85} />
            <rect x={60} y={420} width={960} height={760} fill={EP2.office} opacity={p < 0.5 ? 0 : (1 - (p - 0.5) * 2) * 0.6} />
            {[0, 1, 2, 3].map((i) => (
              <Rough key={i} boil="bg" shape={rect(110 + i * 230, 760 + (i % 2) * 80, 180, 420 - (i % 2) * 80)} seed={50 + i} solid={EP2.subway} o={{fill: EP2.subway, hachureGap: 14, strokeWidth: 4}} />
            ))}
            <Rough boil="bg" shape={rect(60, 420, 960, 760)} seed={55} o={{strokeWidth: 8}} />
            <Rough boil="bg" shape={line(540, 420, 540, 1180)} seed={56} o={{strokeWidth: 6}} />
            {/* 천장 조명: 하나씩 꺼진다 */}
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={40 + i * 210} y={260} width={160} height={24} fill={p < offAt(i) ? EP2.office : EP2.night3} />
            ))}
            {/* 책상들: 아빠 자리만 모니터 빛이 남는다 */}
            {[0, 1, 2].map((i) => {
              const on = i === 1 ? true : p < offAt(i + 1);
              return (
                <g key={i}>
                  <Rough boil="bg" shape={rect(40 + i * 350, 1460, 300, 30)} seed={60 + i} solid={EP2.subway} o={{fill: EP2.subway}} />
                  <Rough boil="bg" shape={rect(90 + i * 350, 1260, 200, 150)} seed={64 + i} solid={on ? EP2.phone : EP2.night2} o={{strokeWidth: 5}} />
                  {on && <circle cx={190 + i * 350} cy={1330} r={170} fill={EP2.phone} opacity={0.18} />}
                </g>
              );
            })}
            {/* 모니터 옆에 꽂힌 하린의 그림 */}
            <g transform="translate(605 1270) rotate(6) scale(0.13)">
              <rect x={0} y={60} width={1000} height={760} fill={PAPER} />
              <HarinDrawing boil="bg" />
            </g>
            {/* 아빠 뒷모습 실루엣(책상 앞) */}
            <ellipse cx={540} cy={1560} rx={70} ry={76} fill={EP2.night} />
            <path d="M 400 1920 Q 410 1660 540 1640 Q 670 1660 680 1920 Z" fill={EP2.night} />
          </Stage>
        </Camera>
      </Cold>
    </AbsoluteFill>
  );
};

/** S6-B. 휴대폰: 엄마 메시지 → 아빠 답장, 벽시계 19:58 */
const Messages: React.FC = () => (
  <AbsoluteFill>
    <Fill color={EP2.officeNight} />
    <Cold>
      <Camera dur={40} from={{s: 1.0}} to={{s: 1.04}}>
        <Stage>
          <WallClock x={880} y={560} r={74} time="19:58" face={EP2.office} />
          <Phone x={500} y={1060} s={2.0} id="s6" time="19:58">
            <rect x={-150} y={-280} width={300} height={560} fill={EP2.night2} />
          </Phone>
          <ChatBubble x={130} y={880} w={640} text="오늘은 일찍 와? 하린이가 기다려" side="left" from={EVENTS.msgIn - SUB.S06B} size={46} />
          <ChatBubble x={420} y={1080} w={300} text="지금 출발!" side="right" from={EVENTS.msgIn - SUB.S06B + 10} typeFrom={EVENTS.msgIn - SUB.S06B + 12} typeRate={2.4} size={52} fill={EP2.office} />
        </Stage>
      </Camera>
    </Cold>
  </AbsoluteFill>
);

export const S06: React.FC = () => {
  const split = SUB.S06B - SCENES.S06.from;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={split}>
        <Timelapse />
      </Sequence>
      <Sequence from={split}>
        <Messages />
      </Sequence>
    </AbsoluteFill>
  );
};

/** 휴대폰 속 영상: 집에서 그림을 흔드는 하린(따뜻한 집 색은 화면 속에만) */
const HarinVideo: React.FC<{t2: number}> = ({t2}) => {
  const wave = Math.sin(t2 * 0.55) * 14;
  const open = Math.floor(t2 / 4) % 2 === 0;
  return (
    <g>
      <rect x={-150} y={-280} width={300} height={560} fill={EP2.homeCream} />
      <circle cx={-60} cy={-160} r={140} fill={EP2.bulb} opacity={0.5} />
      <g transform="translate(0 40) scale(0.85)">
        <HarinHead cx={0} cy={0} mouth={open ? 'sing' : 'smile'} seed={175} />
      </g>
      <Rough shape={path('M -120 280 Q -100 140 0 130 Q 100 140 120 280 Z')} seed={176} solid={JUMPER} o={{fill: JUMPER}} />
      <g transform={`translate(${-10 + wave} -170) rotate(${wave * 0.6})`}>
        <rect x={-110} y={-70} width={220} height={150} fill={PAPER} stroke={INK} strokeWidth={4} />
        <g transform="translate(-110 -88) scale(0.22)">
          <HarinDrawing boil="bg" scenery={false} />
        </g>
      </g>
    </g>
  );
};

/** S7. 퇴근 1호선 — 문에 밀착된 아빠, 휴대폰 속 하린 → 터널 안에서 열차가 덜컥 멈춘다. */
export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const t2 = useTwos();
  const dur = SCENES.S07.to - SCENES.S07.from;
  const halt = EVENTS.trainHalt - SCENES.S07.from; // 69
  const flicker = f >= halt && f < halt + 6 ? (f - halt < 3 ? 0.85 : 0) : 0;
  const smiling = f >= 20 && f < halt + 10;
  const mouth = smiling ? 'smile' : f >= halt + 10 ? 'sad' : 'flat';
  const jolt = f >= halt && f < halt + 5 ? 8 : 0;
  return (
    <AbsoluteFill style={{transform: `translate(${jolt}px, ${f < halt ? railBump(f) : 0}px)`}}>
      <Fill color={EP2.subway} />
      <Cold>
        <Camera dur={dur} from={{s: 1.0}} to={{s: 1.06}} origin={[540, 900]}>
          <Stage>
            {/* 문 유리(터널 어둠) */}
            <Rough boil="bg" shape={rect(160, 260, 760, 1000)} seed={1} solid={EP2.night} o={{fill: EP2.night, strokeWidth: 7}} />
            {f < halt &&
              Array.from({length: 5}).map((_, i) => {
                const y = 300 + ((f * 55 + i * 230) % 950);
                return <line key={i} x1={180} y1={y} x2={900} y2={y + 30} stroke={EP2.subwayPale} strokeWidth={4} opacity={0.5} />;
              })}
            <Crowd n={4} y={1990} color={EP2.subwayPale} seed="c7" s={1.7} spread={1300} />
            <Dad x={540} y={1980} scale={1.5} version="home" tone="cold" pose={{handR: [610, 1380], handL: [500, 1420], mouth, look: 2, headTilt: 4}} />
            {/* 휴대폰 속 영상 */}
            <Phone x={560} y={1350} s={0.95} id="s7" rot={-4}>
              <HarinVideo t2={t2} />
            </Phone>
          </Stage>
        </Camera>
      </Cold>
      <AbsoluteFill style={{background: EP2.night, opacity: flicker}} />
      <Handwrite lines={['"아빠 빨리 와!"']} y={420} from={10} to={halt - 2} size={84} color={PAPER} />
      <Narration lines={['퇴근길은 늘', '출근길보다 깁니다']} y={400} from={halt + 4} to={dur + 4} backdrop />
    </AbsoluteFill>
  );
};
