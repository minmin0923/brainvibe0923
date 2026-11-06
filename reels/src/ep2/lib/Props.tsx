import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {Rough, RoughBase, circle, ellipse, path, rect} from '../../lib/rough';
import {COAT, COLD_SKIN, EP2, HAIR, INK, PAPER, SKIN, WHITE} from '../../lib/palette';
import {HarinDrawing} from '../../lib/HarinDrawing';
import {GOWUN} from '../../lib/Caption';
import {Limb} from '../../chars/parts';

/** 바깥 장면: 크레용 틈 사이 바탕도 차가운 회색으로(따뜻한 색 금지) */
export const Cold: React.FC<{children: React.ReactNode}> = ({children}) => <RoughBase color={EP2.office}>{children}</RoughBase>;

/**
 * 아빠의 휴대폰. 잠금화면 배경은 하린의 분홍 크레용 지하철 그림.
 * 원점 = 화면 중심, 화면 크기 w×h. children이 있으면 잠금화면 대신 그 내용을 보여준다.
 */
export const Phone: React.FC<{
  x: number;
  y: number;
  s?: number;
  rot?: number;
  time?: string;
  screenOn?: number;
  children?: React.ReactNode;
  id: string;
}> = ({x, y, s = 1, rot = 0, time, screenOn = 1, children, id}) => {
  const w = 300;
  const h = 560;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Rough shape={rect(-w / 2 - 20, -h / 2 - 30, w + 40, h + 60)} seed={2200} solid={INK} o={{fill: INK}} />
      <defs>
        <clipPath id={`ph-${id}`}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} />
        </clipPath>
      </defs>
      <g clipPath={`url(#ph-${id})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={EP2.night} />
        <g opacity={screenOn}>
          {children ?? (
            <>
              <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={PAPER} />
              <g transform={`translate(${-w / 2 - 140} ${-h / 2 + 120}) scale(0.58)`}>
                <HarinDrawing />
              </g>
            </>
          )}
          {time && (
            <text x={0} y={-h / 2 + 110} textAnchor="middle" fontFamily={GOWUN} fontSize={92} fill={WHITE} style={{textShadow: 'none'}} stroke={EP2.night} strokeWidth={2} paintOrder="stroke">
              {time}
            </text>
          )}
        </g>
      </g>
    </g>
  );
};

/** 닳은 교통카드 지갑(모서리가 해져 있다) */
export const Wallet: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <Rough shape={path('M -110 -70 L 96 -70 Q 110 -70 110 -56 L 110 60 Q 110 70 96 70 L -100 70 Q -110 70 -110 58 Z')} seed={2300} solid={EP2.subway} o={{fill: EP2.officeNight, hachureGap: 8}} />
    {/* 해진 모서리 */}
    <g stroke={EP2.office} strokeWidth={3} fill="none" strokeLinecap="round">
      <path d="M 96 -70 q 10 4 14 14 M 90 -66 q 12 6 16 18" />
      <path d="M -100 70 q -8 -4 -10 -14 M -96 64 q -8 -2 -10 -10" />
    </g>
    <Rough shape={rect(-80, -40, 120, 70)} seed={2301} o={{stroke: EP2.office, strokeWidth: 3}} />
  </g>
);

/** 입김 한 번(시작 프레임 at) */
export const Breath: React.FC<{x: number; y: number; at: number; s?: number}> = ({x, y, at, s = 1}) => {
  const f = useCurrentFrame();
  const a = f - at;
  if (a < 0 || a > 36) return null;
  const p = a / 36;
  return (
    <g opacity={(1 - p) * 0.85} transform={`translate(${x + p * 60 * s} ${y - p * 50 * s}) scale(${s * (0.5 + p * 1.2)})`}>
      <circle cx={0} cy={0} r={28} fill={WHITE} opacity={0.7} filter="url(#glow-blur)" />
      <circle cx={22} cy={-10} r={20} fill={WHITE} opacity={0.6} filter="url(#glow-blur)" />
    </g>
  );
};

/** 아빠 뒷모습(쪼그려 앉기 0~1). 원점 = 발 사이. 오른팔 손 목표점(월드)을 주면 IK로 뻗는다 */
export const DadBack: React.FC<{x: number; y: number; s?: number; crouch?: number; reach?: [number, number]; tone?: 'cold' | 'warm'; seed?: number}> = ({
  x,
  y,
  s = 1,
  crouch = 0,
  reach,
  tone = 'cold',
  seed = 2400,
}) => {
  const skin = tone === 'cold' ? COLD_SKIN : SKIN;
  const drop = crouch * 300;
  const sh: [number, number] = [96, -600 + drop];
  const hand: [number, number] = reach ? [(reach[0] - x) / s, (reach[1] - y) / s] : [110, -360 + drop];
  const mid: [number, number] = [(sh[0] + hand[0]) / 2 + 20, (sh[1] + hand[1]) / 2 + 30];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* 다리(쪼그려 앉으면 접힌다) */}
      <Rough shape={rect(-80, -330 + drop, 160, 320 - drop * 0.9)} seed={seed} solid={EP2.night} o={{fill: EP2.night}} />
      {/* 코트 등판 */}
      <Rough shape={path(`M -110 ${-610 + drop} Q 0 ${-640 + drop} 110 ${-610 + drop} L 128 ${-250 + drop * 0.7} L -128 ${-250 + drop * 0.7} Z`)} seed={seed + 1} solid={COAT} o={{fill: COAT}} />
      <Rough shape={path(`M 0 ${-620 + drop} L 0 ${-280 + drop * 0.7}`)} seed={seed + 2} o={{strokeWidth: 4}} />
      {/* 오른팔(문틈으로 뻗음) */}
      <Limb pts={[sh, mid, hand]} w={58} color={COAT} seed={seed + 3} hand={48} handColor={skin} />
      {/* 뒤통수 + 귀 */}
      <Rough shape={ellipse(-86, -700 + drop, 26, 40)} seed={seed + 6} solid={skin} o={{strokeWidth: 4}} />
      <Rough shape={ellipse(86, -700 + drop, 26, 40)} seed={seed + 7} solid={skin} o={{strokeWidth: 4}} />
      <Rough shape={circle(0, -712 + drop, 176)} seed={seed + 8} solid={HAIR} o={{fill: HAIR, hachureGap: 6}} />
      <Rough shape={rect(-28, -640 + drop, 56, 30)} seed={seed + 9} solid={skin} o={{strokeWidth: 4}} />
    </g>
  );
};

/** 만원 승객 실루엣 무리(차가운 색) */
export const Crowd: React.FC<{n: number; y: number; color: string; seed: string; s?: number; spread?: number}> = ({n, y, color, seed, s = 1, spread = 1200}) => (
  <g>
    {Array.from({length: n}).map((_, i) => {
      const cx = -60 + (i + random(`${seed}x${i}`) * 0.6) * (spread / n);
      const cy = y + random(`${seed}y${i}`) * 60;
      const k = s * (0.85 + random(`${seed}s${i}`) * 0.3);
      return (
        <g key={i} transform={`translate(${cx} ${cy}) scale(${k})`}>
          <ellipse cx={0} cy={-250} rx={66} ry={72} fill={color} />
          <path d="M -120 0 Q -120 -170 0 -175 Q 120 -170 120 0 Z" fill={color} />
        </g>
      );
    })}
  </g>
);

/** 장소 표기 자막(좌하단) */
export const PlaceTag: React.FC<{text: string; from?: number}> = ({text, from = 0}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [from, from + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 80, top: 1384, opacity: o, fontFamily: GOWUN, fontSize: 46, color: WHITE, letterSpacing: '0.04em', textShadow: `0 2px 10px ${EP2.night}`}}>
      <span style={{display: 'inline-block', width: 40, height: 3, background: WHITE, verticalAlign: 'middle', marginRight: 16, opacity: 0.8}} />
      {text}
    </div>
  );
};

export const Fill: React.FC<{color: string}> = ({color}) => <AbsoluteFill style={{backgroundColor: color}} />;
