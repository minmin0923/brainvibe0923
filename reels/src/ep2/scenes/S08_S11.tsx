import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {Camera, Stage, Wash} from '../../lib/paper';
import {Rough, circle, line, path, rect, useTwos} from '../../lib/rough';
import {DAWN, DAY, EP2, HOME, INK, JUMPER, PAPER, WHITE} from '../../lib/palette';
import {GOWUN, Narration} from '../../lib/Caption';
import {Harin, HarinHead} from '../../chars/Harin';
import {Dad} from '../../chars/Dad';
import {Mom} from '../../chars/Mom';
import {HarinDrawing} from '../../lib/HarinDrawing';
import {Breath, Cold, Fill, Phone} from '../lib/Props';
import {WallClock} from '../lib/WallClock';
import {SplitScreen} from '../lib/SplitScreen';
import {EVENTS, SCENES, SUB} from '../timeline';

/** 집 부엌 공통: 찌개 냄비 + 김 */
const Stew: React.FC<{x: number; y: number; ladle?: boolean; fire?: number}> = ({x, y, ladle, fire = 0}) => {
  const f = useCurrentFrame();
  return (
    <g>
      {/* 가스레인지 */}
      <Rough boil="bg" shape={rect(x - 170, y + 40, 340, 60)} seed={300} solid={EP2.subwayPale} o={{fill: EP2.subway}} />
      {fire > 0 &&
        [0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M ${x - 60 + i * 30} ${y + 40} q 6 ${-26 * fire - Math.sin(f + i) * 6} 12 0`} fill={EP2.phone} opacity={0.9} />
        ))}
      {/* 냄비 */}
      <Rough shape={path(`M ${x - 140} ${y - 90} L ${x + 140} ${y - 90} L ${x + 120} ${y + 40} L ${x - 120} ${y + 40} Z`)} seed={301} solid={EP2.homeAmber} o={{fill: INK, hachureGap: 14}} />
      <Rough shape={line(x - 170, y - 80, x - 140, y - 80)} seed={302} o={{strokeWidth: 8}} />
      <Rough shape={line(x + 140, y - 80, x + 170, y - 80)} seed={303} o={{strokeWidth: 8}} />
      {ladle && <Rough shape={path(`M ${x + 60} ${y - 92} L ${x + 150} ${y - 220} q 20 -10 30 6`)} seed={304} o={{strokeWidth: 8}} />}
      {/* 찌개 김 */}
      {[0, 1, 2].map((i) => {
        const ph = ((f + i * 14) % 42) / 42;
        return (
          <path
            key={i}
            d={`M ${x - 50 + i * 50} ${y - 100 - ph * 160} q 20 -30 0 -60 q -20 -30 0 -60`}
            stroke={WHITE}
            strokeWidth={8}
            fill="none"
            opacity={(1 - ph) * 0.7}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

/** S8. 엄마의 저녁 — 1탄 S4-B와 같은 앵글(하린 + 맞은편 빈 의자)로 시작해 카메라가 뒤로 빠지면 엄마가 보인다. */
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const t2 = useTwos();
  const dur = SCENES.S08.to - SCENES.S08.from;
  const pull = interpolate(f, [8, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.25, 1)});
  const scale = 1.0 - pull * 0.3;
  const bowlTimes = EVENTS.bowls.map((b) => b - SCENES.S08.from);
  const bowlSpots: [number, number][] = [
    [300, 1290],
    [820, 1290],
    [1080, 1290],
  ];
  const placed = bowlTimes.filter((b) => f >= b).length;
  const nextIdx = Math.min(2, placed);
  const handTarget: [number, number] = placed < 3 ? bowlSpots[nextIdx] : [1220, 1100];
  const glance = (t2 >= 22 && t2 < 32) || (t2 >= 62 && t2 < 72);
  return (
    <AbsoluteFill>
      <Fill color={HOME.night} />
      <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '240px 1200px'}}>
        <Wash
          blobs={[
            {x: 520, y: 900, r: 560, color: EP2.bulb, o: 0.42},
            {x: 1300, y: 1100, r: 500, color: EP2.bulb, o: 0.35},
            {x: 520, y: 1400, r: 420, color: DAY.amber, o: 0.25},
          ]}
          blur={80}
          blend="screen"
        />
        <Stage>
          {/* 1탄 S4-B와 같은 배치: 창, 펜던트 등, 하린, 빈 의자, 식탁 */}
          <Rough boil="bg" shape={rect(80, 420, 380, 420)} seed={30} solid={DAWN.deep} o={{fill: DAWN.mid, hachureGap: 14, strokeWidth: 6}} />
          <Rough boil="bg" shape={line(270, 420, 270, 840)} seed={31} o={{strokeWidth: 5}} />
          <Rough boil="bg" shape={line(560, -200, 560, 560)} seed={32} o={{strokeWidth: 4}} />
          <Rough shape={path('M 480 620 L 640 620 L 600 560 L 520 560 Z')} seed={33} solid={EP2.bulb} o={{fill: EP2.bulb}} />
          <WallClock x={980} y={520} r={70} time="20:31" />
          {/* 하린: 크레용으로 그림을 그리다 현관 쪽(왼쪽)을 힐끔 */}
          <Harin x={300} y={1490} scale={1.15} pose={{handR: [380 + Math.sin(t2 * 0.9) * 16, 1300], armL: 20, elbowL: 50, look: glance ? -7 : 3, headTilt: glance ? -14 : 4, mouth: 'flat'}} />
          {/* 빈 의자(아빠 자리) */}
          <Rough boil="bg" shape={rect(720, 980, 200, 300)} seed={40} solid={DAY.amber} o={{fill: DAY.amber, hachureGap: 10}} />
          <Rough boil="bg" shape={rect(700, 1280, 240, 40)} seed={41} solid={DAY.amber} o={{fill: DAY.amber}} />
          <Rough boil="bg" shape={line(720, 1320, 720, 1640)} seed={42} o={{strokeWidth: 8}} />
          <Rough boil="bg" shape={line(920, 1320, 920, 1640)} seed={43} o={{strokeWidth: 8}} />
          {/* 식탁(뒤로 빠지면 오른쪽으로 이어짐) */}
          <Rough boil="bg" shape={rect(40, 1320, 1220, 70)} seed={44} solid={DAY.amber} o={{fill: DAY.amber, hachureGap: 9}} />
          <Rough boil="bg" shape={rect(80, 1390, 40, 400)} seed={45} solid={DAY.amber} o={{fill: DAY.amber}} />
          <Rough boil="bg" shape={rect(1180, 1390, 40, 400)} seed={46} solid={DAY.amber} o={{fill: DAY.amber}} />
          {/* 그림 그리는 종이 */}
          <g transform="translate(330 1288) rotate(-4) scale(0.12)">
            <rect x={0} y={60} width={1000} height={760} fill={PAPER} />
            <HarinDrawing boil="bg" />
          </g>
          {/* 밥그릇 세 개 */}
          {bowlSpots.map(([bx, by], i) =>
            i < placed ? <Rough key={i} shape={path(`M ${bx - 60} ${by} Q ${bx} ${by + 60} ${bx + 60} ${by} Z`)} seed={50 + i} solid={PAPER} /> : null,
          )}
          {/* 가스레인지 앞의 엄마 + 찌개 */}
          <Rough boil="bg" shape={rect(1260, 1240, 520, 680)} seed={60} solid={EP2.homeSand} o={{fill: EP2.homeAmber, hachureGap: 14}} />
          <Stew x={1400} y={1150} fire={1} />
          <Mom x={1180} y={1900} scale={1.05} flip pose={{handR: handTarget, armL: 10, look: -4, mouth: 'smile'}} />
        </Stage>
      </AbsoluteFill>
      <Narration lines={['엄마는 오늘도', '세 그릇을 놓습니다']} y={290} from={8} to={dur + 2} />
    </AbsoluteFill>
  );
};

/** S9-A. 의정부역 출구 계단을 뛰어 내려오는 아빠 */
const RunDown: React.FC = () => {
  const t2 = useTwos();
  const y = 1700 + t2 * 6;
  const sw = Math.sin(t2 * 0.8);
  return (
    <AbsoluteFill>
      <Fill color={EP2.night} />
      <Cold>
        <Camera dur={35} from={{s: 1.05}} to={{s: 1.0}}>
          <Stage>
            <Rough boil="bg" shape={rect(240, 300, 600, 160)} seed={70} solid={EP2.night3} o={{fill: EP2.night3, strokeWidth: 6}} />
            <text x={540} y={410} textAnchor="middle" fontFamily={GOWUN} fontSize={84} fill={WHITE}>
              의정부역
            </text>
            {Array.from({length: 10}).map((_, i) => (
              <Rough key={i} boil="bg" shape={line(100, 600 + i * 140, 980, 600 + i * 140)} seed={71 + i} o={{stroke: EP2.night3, strokeWidth: 6}} />
            ))}
            <Dad x={540} y={y} scale={1.2} version="home" tone="cold" pose={{armL: 30 + sw * 30, armR: 30 - sw * 30, elbowL: 30, briefcase: true, mouth: 'o', headTilt: sw * 4}} />
          </Stage>
        </Camera>
      </Cold>
    </AbsoluteFill>
  );
};

/** S9-B. 눈앞에서 떠나는 버스, 다음 버스 19분, 무릎을 짚고 숨을 몰아쉬는 아빠 */
const MissedBus: React.FC = () => {
  const f = useCurrentFrame();
  const dur = SCENES.S09.to - SUB.S09B;
  const leave = EVENTS.busLeaves - SUB.S09B;
  const busX = interpolate(f, [leave, dur], [380, 1700], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  return (
    <AbsoluteFill>
      <Fill color={EP2.night} />
      <Cold>
        {/* 카메라가 천천히 뒤로 빠지며 텅 빈 정류장 */}
        <Camera dur={dur} from={{s: 1.18}} to={{s: 1.0}} origin={[400, 1400]}>
          <Stage>
            <Rough boil="bg" shape={rect(-40, 1500, 1160, 500)} seed={80} solid={EP2.night2} o={{fill: EP2.night, hachureGap: 16}} />
            {/* 떠나는 버스(미등은 차가운 빛으로 — 바깥에 따뜻한 색 없음) */}
            <g transform={`translate(${busX} 0)`}>
              <Rough boil="bg" shape={path('M 0 820 L 900 820 L 900 1460 L 0 1460 Z')} seed={81} solid={EP2.night3} o={{fill: EP2.night3, hachureGap: 11}} />
              <circle cx={30} cy={1360} r={26} fill={EP2.phone} />
              <circle cx={30} cy={1360} r={60} fill={EP2.phone} opacity={0.3} />
              <Rough boil="bg" shape={circle(200, 1460, 150)} seed={82} solid={INK} o={{fill: INK}} />
            </g>
            {/* 정류장 안내판(손그림) */}
            <Rough boil="bg" shape={line(160, 900, 160, 1520)} seed={83} o={{stroke: EP2.subwayPale, strokeWidth: 10}} />
            <Rough boil="bg" shape={rect(40, 780, 300, 220)} seed={84} solid={EP2.night3} o={{fill: EP2.night3, stroke: EP2.office, strokeWidth: 5}} />
            <text x={190} y={866} textAnchor="middle" fontFamily={GOWUN} fontSize={46} fill={WHITE}>
              다음 버스
            </text>
            <text x={190} y={950} textAnchor="middle" fontFamily={GOWUN} fontSize={68} fill={WHITE}>
              19분
            </text>
            {/* 무릎을 짚고 숨을 몰아쉬는 아빠 + 입김 세 번 */}
            <Dad x={520} y={1580} scale={0.95} version="home" tone="cold" pose={{crouch: 0.55, handL: [470, 1330], handR: [575, 1330], mouth: 'o', eyes: 'closed', headTilt: 10}} />
            {EVENTS.breathPuffs.map((b, i) => (
              <Breath key={i} x={560} y={950} at={b - SUB.S09B} s={1.1} />
            ))}
          </Stage>
        </Camera>
      </Cold>
    </AbsoluteFill>
  );
};

export const S09: React.FC = () => {
  const split = SUB.S09B - SCENES.S09.from;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={split}>
        <RunDown />
      </Sequence>
      <Sequence from={split}>
        <MissedBus />
      </Sequence>
      <Narration lines={['눈앞에서', '버스가 떠났습니다']} y={400} from={split + 10} to={SCENES.S09.to - SCENES.S09.from} />
    </AbsoluteFill>
  );
};

/** S10 위: 부엌 — 식은 찌개 아래 가스불을 다시 켜는 엄마, 냄비에 걸쳐 둔 국자, 벽시계 21:12 */
const KitchenTop: React.FC = () => {
  const f = useCurrentFrame();
  const ignite = EVENTS.stoveIgnite - SCENES.S10.from;
  const fire = interpolate(f, [ignite, ignite + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const buzz = EVENTS.momBuzz - SCENES.S10.from;
  const shake = f >= buzz && f < buzz + 8 ? Math.sin((f - buzz) * 2.6) * 6 : 0;
  const flipped = f >= buzz + 14;
  const hand: [number, number] = f < ignite + 4 ? [620, 1100] : f >= buzz + 4 ? [300 + shake, 1120] : [540, 1000];
  return (
    <AbsoluteFill>
      <Fill color={HOME.night} />
      <Wash blobs={[{x: 540, y: 900, r: 520, color: EP2.bulb, o: 0.45}]} blur={80} blend="screen" />
      <Stage>
        <WallClock x={880} y={640} r={78} time="21:12" />
        <Rough boil="bg" shape={rect(-40, 1140, 1160, 400)} seed={90} solid={EP2.homeSand} o={{fill: EP2.homeAmber, hachureGap: 14}} />
        <Stew x={640} y={1060} ladle fire={fire} />
        {/* 엄마 휴대폰(진동 → 확인 → 엎어 놓음) */}
        <g transform={`translate(${300 + shake} 1130)`}>
          <Rough shape={rect(-50, -16, 100, 32)} seed={91} solid={flipped ? INK : EP2.phone} o={{strokeWidth: 4}} />
        </g>
        <Mom x={200} y={1740} scale={0.9} pose={{handR: hand, armL: 8, mouth: flipped ? 'flat' : 'smile', eyes: flipped ? 'tired' : 'open', look: 4}} />
      </Stage>
    </AbsoluteFill>
  );
};

/** S10 아래: 정류장 — "미안 30분만 더…"를 썼다 지우고 "미안"만 보낸다. 휴대폰 시계 21:12 */
const StopBottom: React.FC = () => {
  const f = useCurrentFrame();
  const draft = '미안 30분만 더…';
  const typed = Math.max(0, Math.min(draft.length, Math.floor((f - 14) / 2.2)));
  const deleted = Math.max(0, Math.floor((f - 48) / 2));
  const shown = f < 48 ? draft.slice(0, typed) : draft.slice(0, Math.max(2, draft.length - deleted));
  const sent = f >= EVENTS.dadSend - SCENES.S10.from;
  return (
    <AbsoluteFill>
      <Fill color={EP2.night} />
      <Cold>
        <Stage>
          <Rough boil="bg" shape={rect(-40, 1380, 1160, 600)} seed={95} solid={EP2.night2} o={{fill: EP2.night, hachureGap: 16}} />
          <Dad x={300} y={1620} scale={0.95} version="home" tone="cold" pose={{handR: [520, 1090], handL: [480, 1120], mouth: 'flat', headTilt: 12, look: 6}} />
          <Phone x={700} y={980} s={1.0} id="s10">
            <rect x={-150} y={-280} width={300} height={560} fill={EP2.night2} />
            <text x={0} y={-90} textAnchor="middle" fontFamily={GOWUN} fontSize={64} fill={WHITE}>
              21:12
            </text>
            {sent ? (
              <g>
                <rect x={-20} y={60} width={150} height={74} rx={30} fill={EP2.office} />
                <text x={55} y={110} textAnchor="middle" fontFamily={GOWUN} fontSize={40} fill={INK}>
                  미안
                </text>
              </g>
            ) : (
              <g>
                <rect x={-140} y={180} width={280} height={70} rx={16} fill={EP2.office} />
                <text x={-126} y={226} fontFamily={GOWUN} fontSize={32} fill={INK}>
                  {shown}
                  {Math.floor(f / 8) % 2 ? '|' : ''}
                </text>
              </g>
            )}
          </Phone>
        </Stage>
      </Cold>
    </AbsoluteFill>
  );
};

/** S10. 같은 시각, 다른 자리 — 세로 2분할, 두 시계 모두 21:12 */
export const S10: React.FC = () => {
  const dur = SCENES.S10.to - SCENES.S10.from;
  return (
    <AbsoluteFill>
      <Fill color={EP2.night} />
      <SplitScreen top={<KitchenTop />} bottom={<StopBottom />} expandTopFrom={dur - 12} topOffset={480} bottomOffset={560} />
      <Narration lines={["'미안해'를", '썼다 지웠다']} y={800} from={30} to={dur - 12} size={54} />
    </AbsoluteFill>
  );
};

/** S11. 기다리다 잠든 아이 — 노란 잠옷, 분홍 그림을 품에 안고 소파에서. 엄마가 담요를 덮고 TV를 끈다. */
export const S11: React.FC = () => {
  const f = useCurrentFrame();
  const t2 = useTwos();
  const dur = SCENES.S11.to - SCENES.S11.from;
  const tvOff = EVENTS.tvOff - SCENES.S11.from;
  const tv = f < tvOff ? 0.35 + 0.2 * Math.abs(Math.sin(f * 0.7)) : 0;
  const blanket = interpolate(t2, [8, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const breathe = Math.sin(t2 * 0.14) * 4;
  const lookDoor = t2 >= 66 && t2 < 92;
  return (
    <AbsoluteFill>
      <Fill color={HOME.night} />
      <Camera dur={dur + 15} from={{s: 1.0}} to={{s: 1.06}} origin={[520, 1250]}>
        <Wash
          blobs={[
            {x: 900, y: 900, r: 360, color: EP2.bulb, o: 0.5},
            {x: 200, y: 900, r: 420, color: EP2.phone, o: tv},
          ]}
          blur={80}
          blend="screen"
        />
        <Stage>
          {/* 스탠드 */}
          <Rough boil="bg" shape={line(900, 760, 900, 1400)} seed={1} o={{strokeWidth: 6}} />
          <Rough shape={path('M 830 760 L 970 760 L 940 680 L 860 680 Z')} seed={2} solid={EP2.bulb} o={{fill: EP2.bulb}} />
          {/* 소파 */}
          <Rough boil="bg" shape={rect(80, 1000, 780, 320)} seed={3} solid={EP2.homeAmber} o={{fill: EP2.homeAmber, hachureGap: 10}} />
          <Rough boil="bg" shape={rect(60, 1260, 840, 220)} seed={4} solid={EP2.homeSand} o={{fill: EP2.homeAmber, hachureGap: 12}} />
          {/* 잠든 하린 + 품에 안은 분홍 그림 */}
          <g transform={`translate(0 ${breathe * 0.4})`}>
            <Rough shape={path('M 320 1250 Q 470 1150 700 1210 L 740 1290 L 300 1300 Z')} seed={10} solid={JUMPER} o={{fill: JUMPER}} />
            <g transform="translate(450 1150) rotate(-22) scale(0.2)">
              <rect x={0} y={60} width={1000} height={760} fill={PAPER} />
              <HarinDrawing boil="bg" />
            </g>
            <g transform="translate(250 1190) rotate(-70) scale(0.75)">
              <HarinHead cx={0} cy={0} eyes="closed" mouth="o" seed={195} />
            </g>
          </g>
          {/* 담요 */}
          <g opacity={blanket} transform={`translate(${(1 - blanket) * 200} 0)`}>
            <Rough shape={path('M 380 1230 Q 560 1170 760 1220 L 800 1300 L 360 1310 Z')} seed={20} solid={EP2.sage} o={{fill: EP2.sage, hachureGap: 9}} />
          </g>
          {/* 엄마 */}
          <Mom x={760} y={1720} scale={0.9} flip pose={{handR: blanket < 1 ? [560, 1240] : [900, 1100], armL: 8, look: lookDoor ? 8 : -4, headTilt: lookDoor ? 10 : -6, mouth: 'flat'}} />
        </Stage>
      </Camera>
      <Narration lines={['기다리다', '잠이 들었습니다']} y={290} from={6} to={dur + 15} />
    </AbsoluteFill>
  );
};
