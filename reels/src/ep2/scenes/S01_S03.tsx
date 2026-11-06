import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Camera, Stage, Wash} from '../../lib/paper';
import {Rough, circle, ellipse, line, path, rect, useTwos} from '../../lib/rough';
import {COAT, COLD_SKIN, DAWN, EP2, INK, PAPER} from '../../lib/palette';
import {Handwrite, Narration} from '../../lib/Caption';
import {HarinAsleep} from '../../chars/Harin';
import {Dad} from '../../chars/Dad';
import {Breath, Cold, Crowd, DadBack, Fill, Phone, PlaceTag} from '../lib/Props';
import {WallClock} from '../lib/WallClock';
import {EVENTS, SCENES} from '../timeline';

/** S1. 잠금화면 — 하린의 분홍 지하철 그림 위 05:40. 아빠 엄지가 그림을 한 번 쓸어 알람을 끈다. */
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const t2 = useTwos();
  const dur = SCENES.S01.to - SCENES.S01.from;
  const shake = EVENTS.phoneBuzz.reduce((acc, b) => (f - b >= 0 && f - b < 9 ? acc + Math.sin((f - b) * 2.6) * 10 : acc), 0);
  // 엄지: 오른쪽에서 들어와 그림 위를 왼쪽으로 한 번 쓸고 빠진다(on twos)
  const thumbX = interpolate(t2, [36, 50, 62, 74], [1250, 760, 330, 1250], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const screen = interpolate(f, [EVENTS.screenOff, EVENTS.screenOff + 10], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Fill color={EP2.night} />
      <Cold>
        <Camera dur={dur} from={{s: 1.0}} to={{s: 1.06}} origin={[540, 1100]}>
          <Wash blobs={[{x: 540, y: 1080, r: 420 * screen + 40, color: EP2.phone, o: 0.45 * screen}]} blur={80} blend="screen" />
          <Stage>
            {/* 베개 */}
            <Rough boil="bg" shape={ellipse(540, 1500, 1300, 520)} seed={1} solid={EP2.night2} o={{fill: EP2.night3, hachureGap: 13}} />
            <Phone x={540 + shake} y={1080} s={1.75} rot={-4 + shake * 0.2} time="05:40" screenOn={screen} id="s1" />
            {/* 아빠 엄지 */}
            <g transform={`translate(${thumbX} 1180) rotate(-18)`}>
              <Rough shape={path('M 0 0 Q -20 -60 30 -80 Q 90 -90 110 -30 L 400 120 L 330 260 Z')} seed={10} solid={COLD_SKIN} o={{strokeWidth: 5}} />
              <Rough shape={path('M 330 70 L 700 200 L 620 380 L 300 240 Z')} seed={11} solid={EP2.night3} o={{fill: EP2.night2}} />
            </g>
          </Stage>
        </Camera>
      </Cold>
      {/* 훅 자막: 0초 즉시 */}
      <Narration lines={['아빠가 깨어 있는 하린이를 본 건', '지난 주말이 마지막이었습니다']} y={290} from={-10} to={dur + 4} size={56} />
    </AbsoluteFill>
  );
};

/** S2. 다녀올게 — 아빠 등 뒤에서 본 하린 방문(1탄 S3의 반대편). 손을 뻗었다 닿기 직전에 거둔다. */
export const S02: React.FC = () => {
  const t2 = useTwos();
  const dur = SCENES.S02.to - SCENES.S02.from;
  // 0~8: 문틈 빛(S1 화면 빛과 매치) / 10~40 손 뻗음 → 40~52 멈춤 → 52~66 거둠 / 66~84 일어섬 + 넥타이
  const reachP = interpolate(t2, [10, 40, 52, 66], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const crouch = interpolate(t2, [66, 84], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const hand: [number, number] = [interpolate(reachP, [0, 1], [520, 700]), interpolate(reachP, [0, 1], [1460, 1310])];
  const breathe = (Math.sin((t2 / 30) * Math.PI * 2 * 0.35) + 1) / 2;
  return (
    <AbsoluteFill>
      <Fill color={EP2.night} />
      <Camera dur={dur} from={{s: 1.04}} to={{s: 1.0}} origin={[700, 1200]}>
        <Stage>
          {/* 문틈 너머 하린 방(하린이 있는 곳 = 따뜻한 수면등) */}
          <defs>
            <clipPath id="ep2s2-gap">
              <polygon points="610,560 860,560 860,1640 610,1640" />
            </clipPath>
            <radialGradient id="ep2s2-lamp">
              <stop offset="0%" stopColor={DAWN.lamp} stopOpacity={0.6} />
              <stop offset="100%" stopColor={DAWN.lamp} stopOpacity={0} />
            </radialGradient>
          </defs>
          <g clipPath="url(#ep2s2-gap)">
            <rect x={600} y={540} width={280} height={1120} fill={DAWN.mid} />
            <circle cx={760} cy={1100} r={420} fill="url(#ep2s2-lamp)" />
            <Rough boil="bg" shape={rect(600, 1420, 280, 240)} seed={2} solid={DAWN.deep} o={{fill: DAWN.mid, hachureGap: 12, strokeWidth: 4}} />
            {/* 1탄과 같은 잠든 하린 — 이번엔 발 쪽이 가깝다 */}
            <g transform="translate(1150 1240) scale(-0.95 0.95)">
              <HarinAsleep x={0} y={0} breathe={breathe} />
            </g>
          </g>
        </Stage>
        <Cold>
          <Stage>
            {/* 복도 벽·문틀·문 */}
            <Rough boil="bg" shape={rect(560, 520, 360, 1160)} seed={3} o={{strokeWidth: 7, stroke: INK}} />
            <Rough boil="bg" shape={path('M 860 560 L 1040 520 L 1040 1720 L 860 1640 Z')} seed={4} solid={EP2.night3} o={{fill: EP2.night2, hachureGap: 9}} />
            <polygon points="852,560 872,560 872,1640 852,1640" fill={DAWN.lamp} opacity={0.45} filter="url(#glow-blur)" />
            <Rough boil="bg" shape={line(-40, 1700, 1120, 1660)} seed={5} o={{stroke: EP2.night3, strokeWidth: 5}} />
            {/* 아빠 뒷모습: 쪼그려 앉아 문틈으로 손을 뻗었다가 거둔다 */}
            <DadBack x={360} y={1880} s={1.25} crouch={crouch} reach={crouch > 0.5 ? hand : undefined} tone="cold" />
          </Stage>
        </Cold>
      </Camera>
      <Handwrite lines={['"다녀올게."']} y={330} from={20} to={dur} size={84} color={PAPER} />
    </AbsoluteFill>
  );
};

/** S3. 첫차 — 새벽 가로등 아래 정류장. 이미 꽉 찬 버스, 맨 끝에 겨우 타는 아빠, 문에 낀 코트 자락. */
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const t2 = useTwos();
  const dur = SCENES.S03.to - SCENES.S03.from;
  const arrive = EVENTS.busArrive - SCENES.S03.from; // 30
  const busX = interpolate(f, [0, arrive], [1500, 330], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const squat = f >= arrive && f < arrive + 10 ? Math.sin(((f - arrive) / 10) * Math.PI) * 10 : 0;
  const board = interpolate(t2, [44, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const doorT = EVENTS.busDoor - SCENES.S03.from; // 76
  const doorClosed = interpolate(f, [doorT - 4, doorT], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flap = f >= doorT && f < doorT + 12 ? 1 : 0;
  return (
    <AbsoluteFill>
      <Fill color={EP2.night} />
      <Cold>
        {/* 카메라는 버스를 따라 짧게 팬 */}
        <Camera dur={dur} from={{s: 1.02, x: 30}} to={{s: 1.06, x: -40}} origin={[540, 1200]}>
          <Wash blobs={[{x: 200, y: 700, r: 260, color: EP2.office, o: 0.35}, {x: 700, y: 400, r: 600, color: EP2.night3, o: 0.6}]} blur={70} blend="screen" />
          <Stage>
            {/* 가로등(차가운 흰빛) + 정류장 기둥 시계 05:52 */}
            <Rough boil="bg" shape={line(200, 560, 200, 1500)} seed={1} o={{stroke: EP2.subwayPale, strokeWidth: 10}} />
            <Rough boil="bg" shape={path('M 160 560 L 240 560 L 220 520 L 180 520 Z')} seed={2} solid={EP2.office} o={{fill: EP2.office}} />
            <Rough boil="bg" shape={rect(60, 720, 26, 780)} seed={3} solid={EP2.night3} o={{fill: EP2.night3}} />
            <WallClock x={73} y={760} r={56} time="05:52" face={EP2.office} />
            {/* 줄 선 사람들 + 입김 */}
            <Crowd n={5} y={1520} color={EP2.night2} seed="q" s={0.9} spread={700} />
            {[120, 260, 400, 540].map((bx, i) => (
              <Breath key={i} x={bx} y={1220} at={(i * 13) % 40} s={0.8} />
            ))}
            {[60, 100].map((d, i) => (
              <Breath key={`b${i}`} x={200 + i * 260} y={1220} at={d} s={0.8} />
            ))}
            {/* 꽉 찬 버스(차가운 남색, 창 안 실루엣) */}
            <g transform={`translate(${busX} ${squat})`}>
              <Rough boil="bg" shape={path('M 0 700 L 980 700 Q 1050 700 1060 770 L 1070 1420 L 0 1420 Z')} seed={10} solid={EP2.night3} o={{fill: EP2.night3, hachureGap: 11}} />
              {[0, 1, 2, 3].map((i) => (
                <g key={i}>
                  <Rough boil="bg" shape={rect(40 + i * 230, 770, 200, 220)} seed={11 + i} solid={EP2.subwayPale} o={{fill: undefined, strokeWidth: 5}} />
                  {[0, 1, 2].map((k) => (
                    <ellipse key={k} cx={80 + i * 230 + k * 60} cy={900 + (k % 2) * 16} rx={26} ry={30} fill={EP2.night2} />
                  ))}
                </g>
              ))}
              {/* 앞문 */}
              <Rough boil="bg" shape={rect(-150 + 150 * doorClosed, 760, 150, 640)} seed={16} solid={EP2.subway} o={{fill: EP2.subway}} />
              <Rough boil="bg" shape={circle(180, 1420, 170)} seed={17} solid={INK} o={{fill: INK}} />
              <Rough boil="bg" shape={circle(860, 1420, 170)} seed={18} solid={INK} o={{fill: INK}} />
            </g>
            {/* 아빠: 맨 끝에 서 있다가 버스에 오른다 */}
            {f < doorT + 2 && (
              <g opacity={1 - board * 0.9}>
                <Dad x={busX + 30 - board * 120} y={1560 - board * 40} scale={0.78} version="out" tone="cold" pose={{briefcase: true, mouth: 'flat', look: 5}} />
              </g>
            )}
            {/* 닫히는 문에 낀 코트 자락 */}
            {flap > 0 && <Rough shape={path(`M ${busX + 2} 1180 l -60 20 l 10 50 l 50 -30 Z`)} seed={20} solid={EP2.night3} o={{fill: COAT}} />}
            <Rough boil="bg" shape={rect(-40, 1580, 1160, 400)} seed={21} solid={EP2.night2} o={{fill: EP2.night, hachureGap: 16}} />
          </Stage>
        </Camera>
      </Cold>
      <PlaceTag text="05:52, 고산동" from={6} />
    </AbsoluteFill>
  );
};
