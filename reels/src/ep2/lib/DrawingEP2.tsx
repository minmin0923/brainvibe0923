import React from 'react';
import {interpolate} from 'remotion';
import {Rough, circle, line, linear, rect} from '../../lib/rough';
import {EP2, INK, PINK} from '../../lib/palette';
import {PEN} from '../../lib/Caption';
import {HarinDrawing, TRAIN_STOP_X} from '../../lib/HarinDrawing';

/** 1탄과 같은 크레용 선 */
const C = (color: string, w = 9) => ({stroke: color, strokeWidth: w, roughness: 2.1, bowing: 1.6, hachureGap: 9, fillWeight: 4});

/** 막대 인형(로컬 좌표, 원점 = 발) */
const Stick: React.FC<{x: number; y: number; h: number; seed: number; color?: string; pigtails?: boolean; bob?: boolean; opacity?: number; dashed?: boolean}> = ({
  x,
  y,
  h,
  seed,
  color = INK,
  pigtails,
  bob,
  opacity = 1,
  dashed,
}) => {
  const head = h * 0.22;
  const o = C(color, 6);
  return (
    <g opacity={opacity} style={{strokeDasharray: dashed ? '12 10' : undefined}}>
      <Rough shape={circle(x, y - h + head / 2, head)} seed={seed} o={o} />
      {pigtails && (
        <>
          <Rough shape={circle(x - head * 0.6, y - h + head * 0.45, head * 0.4)} seed={seed + 1} solid={PINK.line8} o={C(PINK.line8, 5)} />
          <Rough shape={circle(x + head * 0.6, y - h + head * 0.45, head * 0.4)} seed={seed + 2} solid={PINK.line8} o={C(PINK.line8, 5)} />
        </>
      )}
      {bob && <Rough shape={linear([[x - head * 0.55, y - h + head * 0.9], [x - head * 0.6, y - h + head * 0.2], [x + head * 0.6, y - h + head * 0.2], [x + head * 0.55, y - h + head * 0.9]])} seed={seed + 3} o={C(INK, 6)} />}
      <Rough shape={linear([[x, y - h + head], [x, y - h * 0.38]])} seed={seed + 4} o={o} />
      <Rough shape={linear([[x - h * 0.2, y - h * 0.6], [x, y - h * 0.68], [x + h * 0.2, y - h * 0.6]])} seed={seed + 5} o={o} />
      <Rough shape={linear([[x - h * 0.13, y], [x, y - h * 0.38], [x + h * 0.13, y]])} seed={seed + 6} o={o} />
    </g>
  );
};

/**
 * 2탄의 하린 그림 = 1탄 그림 + 1탄에서 화면 밖이던 오른쪽 아래(식탁의 세 사람 + "아빠 일찍 와").
 * seatFill: 0이면 아빠 자리는 연한 점선(아직 비어 있음), 1이면 꽉 찬 선.
 * doll: 0~1 막대 인형 아빠가 지하철에서 내려 집으로 들어가는 진행도. windowOn: 창에 불.
 */
export const DrawingEP2: React.FC<{
  trainX?: number;
  trainBob?: number;
  wheel?: number;
  glow?: number;
  seatFill?: number;
  doll?: number;
  windowOn?: number;
  boil?: 'char' | 'bg' | 'none';
}> = ({trainX = TRAIN_STOP_X, trainBob = 0, wheel = 0, glow = 0, seatFill = 0, doll = 0, windowOn = 0, boil = 'char'}) => {
  // 인형 경로: 앞칸 문(선로 위) → 집 현관(집은 1탄 그림에서 y -70 이동)
  const dx = interpolate(doll, [0, 0.25, 1], [TRAIN_STOP_X + 200, TRAIN_STOP_X + 214, 763], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dy = interpolate(doll, [0, 0.25, 1], [690, 690, 480], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dollOpacity = interpolate(doll, [0, 0.08, 0.86, 1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g>
      <HarinDrawing trainX={trainX} trainBob={trainBob} wheel={wheel} glow={glow} boil={boil} />
      {/* 창에 불이 켜짐 (집 안의 따뜻한 빛) */}
      {windowOn > 0 && (
        <g opacity={windowOn}>
          <rect x={648} y={278} width={58} height={52} fill={EP2.bulb} />
          <rect x={818} y={278} width={44} height={44} fill={EP2.bulb} />
          <circle cx={680} cy={302} r={70} fill={EP2.bulb} opacity={0.35} filter="url(#glow-blur)" />
        </g>
      )}
      {/* 지하철에서 내려 집으로 들어가는 막대 인형 아빠 */}
      {doll > 0 && <Stick x={dx} y={dy - Math.abs(Math.sin(doll * 18)) * 6} h={112} seed={1700} opacity={dollOpacity} />}
      {/* ---- 오른쪽 아래: 식탁에 둘러앉은 세 사람 */}
      <Rough boil={boil} shape={rect(600, 880, 330, 22)} seed={1710} solid={EP2.homeAmber} o={{...C(INK, 7), fill: EP2.homeAmber}} />
      <Rough boil={boil} shape={line(625, 902, 620, 985)} seed={1711} o={C(INK, 7)} />
      <Rough boil={boil} shape={line(905, 902, 910, 985)} seed={1712} o={C(INK, 7)} />
      {/* 밥그릇 세 개 */}
      {[660, 765, 870].map((bx, i) => (
        <Rough key={i} boil={boil} shape={rect(bx - 22, 856, 44, 24)} seed={1713 + i} o={C(INK, 5)} />
      ))}
      <Stick x={655} y={960} h={120} seed={1720} pigtails />
      <Stick x={765} y={960} h={150} seed={1730} bob />
      {/* 아빠 자리: 처음엔 연한 점선, 엔딩에서 채워진다 */}
      <Stick x={875} y={960} h={172} seed={1740} opacity={0.35 + seatFill * 0.65} dashed={seatFill < 0.5} />
      {/* 삐뚤빼뚤한 크레용 글씨 */}
      <text x={110} y={935} fontFamily={PEN} fontSize={94} fill={PINK.line8} filter="url(#crayon-text)" transform="rotate(-5 330 900)">
        아빠 일찍 와
      </text>
    </g>
  );
};
