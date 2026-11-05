import React from 'react';
import {Rough, circle, curve, line, linear, path, rect} from './rough';
import {DAWN, DAY, INK, PAPER, PINK} from './palette';
import {PEN} from './Caption';

/** 크레용 한 자루로 그린 듯한 굵은 선 */
const C = (color: string, w = 9) => ({stroke: color, strokeWidth: w, roughness: 2.1, bowing: 1.6, hachureGap: 9, fillWeight: 4});

export const TRAIN_STOP_X = 520;

/**
 * 하린이 분홍 크레용으로 그린 "우리 집 앞에 서는 지하철".
 * 로컬 좌표 1000×1000. S1·S3·S5·S6·S14에서 같은 그림을 쓴다(복선 일치).
 */
export const HarinDrawing: React.FC<{
  /** 지하철 앞머리(왼쪽 끝) x */
  trainX?: number;
  /** 차체 흔들림(px) */
  trainBob?: number;
  /** 바퀴 회전(도) */
  wheel?: number;
  /** 0~1 기차 윤곽이 그려진 정도(S1) */
  drawn?: number;
  /** 배경(집·선로·해) 보이기 */
  scenery?: boolean;
  glow?: number;
  boil?: 'char' | 'bg' | 'none';
}> = ({trainX = TRAIN_STOP_X, trainBob = 0, wheel = 0, drawn = 1, scenery = true, glow = 0, boil = 'char'}) => {
  const tx = trainX;
  const ty = 548 + trainBob;
  const show = (a: number, b: number) => Math.max(0, Math.min(1, (drawn - a) / (b - a)));
  return (
    <g>
      {glow > 0 && (
        <ellipse cx={tx + 170} cy={ty + 60} rx={300} ry={200} fill={DAY.sun} opacity={0.55 * glow} filter="url(#soft-blur)" />
      )}
      {scenery && (
        <g>
          {/* 하늘 낙서 */}
          {[0, 1, 2].map((i) => (
            <Rough
              key={i}
              boil={boil}
              shape={curve([
                [40 + i * 30, 300 + i * 70],
                [200 + i * 20, 270 + i * 70],
                [360, 310 + i * 70],
                [480, 280 + i * 70],
              ])}
              seed={900 + i}
              o={C(DAWN.pale, 7)}
            />
          ))}
          {/* 해 */}
          <Rough boil={boil} shape={circle(150, 150, 150)} seed={910} solid={DAWN.lamp} o={{...C(DAY.amber, 7), fill: DAWN.lamp}} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <Rough
                key={i}
                boil={boil}
                shape={line(150 + Math.cos(a) * 95, 150 + Math.sin(a) * 95, 150 + Math.cos(a) * 140, 150 + Math.sin(a) * 140)}
                seed={920 + i}
                o={C(DAY.amber, 7)}
              />
            );
          })}
          <g transform="translate(0 -70)">
          {/* 우리집 */}
          <Rough boil={boil} shape={rect(620, 300, 270, 250)} seed={930} solid={DAY.sun} o={{...C(INK, 8), fill: DAY.sand}} />
          <Rough
            boil={boil}
            shape={path('M 596 312 L 755 170 L 914 312 Z')}
            seed={931}
            solid={DAY.amber}
            o={{...C(INK, 8), fill: DAY.amber}}
          />
          <Rough boil={boil} shape={rect(730, 420, 66, 130)} seed={932} solid={DAY.amber} o={{...C(INK, 7)}} />
          <Rough boil={boil} shape={rect(645, 345, 64, 58)} seed={933} solid={DAWN.lamp} o={{...C(INK, 6)}} />
          <Rough boil={boil} shape={line(677, 345, 677, 403)} seed={934} o={C(INK, 5)} />
          <Rough boil={boil} shape={rect(815, 345, 50, 50)} seed={935} solid={DAWN.lamp} o={{...C(INK, 6)}} />
          <text
            x={755}
            y={150}
            textAnchor="middle"
            fontFamily={PEN}
            fontSize={84}
            fill={PINK.line8}
            filter="url(#crayon-text)"
            transform="rotate(-4 755 150)"
          >
            우리집
          </text>
          {/* 아빠·하린 막대 인형 */}
          <g>
            <Rough boil={boil} shape={circle(560, 380, 44)} seed={940} o={C(INK, 6)} />
            <Rough boil={boil} shape={linear([[560, 402], [560, 470]])} seed={941} o={C(INK, 6)} />
            <Rough boil={boil} shape={linear([[530, 430], [560, 418], [590, 430]])} seed={942} o={C(INK, 6)} />
            <Rough boil={boil} shape={linear([[540, 510], [560, 470], [580, 510]])} seed={943} o={C(INK, 6)} />
            <Rough boil={boil} shape={circle(505, 440, 34)} seed={944} o={C(INK, 6)} />
            <Rough boil={boil} shape={circle(484, 432, 14)} seed={945} solid={PINK.line8} o={{...C(PINK.line8, 5)}} />
            <Rough boil={boil} shape={circle(526, 432, 14)} seed={946} solid={PINK.line8} o={{...C(PINK.line8, 5)}} />
            <Rough boil={boil} shape={linear([[505, 457], [505, 492]])} seed={947} o={C(INK, 6)} />
            <Rough boil={boil} shape={linear([[490, 515], [505, 492], [520, 515]])} seed={948} o={C(INK, 6)} />
            <Rough boil={boil} shape={linear([[505, 470], [530, 430]])} seed={949} o={C(INK, 6)} />
          </g>
          </g>
        </g>
      )}
      {/* 선로 (크레용) */}
      <Rough boil={boil} shape={line(-40, 708, 1040, 700)} seed={950} o={C(INK, 8)} drawn={show(0.55, 0.85)} />
      <Rough boil={boil} shape={line(-40, 742, 1040, 736)} seed={951} o={C(INK, 8)} drawn={show(0.6, 0.9)} />
      {Array.from({length: 14}).map((_, i) => (
        <Rough
          key={i}
          boil={boil}
          shape={line(-20 + i * 78, 694, -32 + i * 78, 756)}
          seed={960 + i}
          o={C(INK, 6)}
          opacity={drawn >= 0.9 ? 1 : 0}
        />
      ))}
      {/* 분홍 지하철: 앞칸(오른쪽이 앞머리) + 뒤칸 */}
      <g>
        {[0, 1].map((car) => {
          const x0 = car === 0 ? tx : tx - 350;
          const filled = drawn >= 0.98;
          const nose = car === 0;
          const body = nose
            ? `M ${x0} ${ty} L ${x0 + 300} ${ty} Q ${x0 + 360} ${ty + 4} ${x0 + 362} ${ty + 70} L ${x0 + 362} ${ty + 130} L ${x0} ${ty + 130} Z`
            : `M ${x0} ${ty + 6} L ${x0 + 330} ${ty + 6} L ${x0 + 330} ${ty + 130} L ${x0} ${ty + 130} Z`;
          const a0 = car === 0 ? 0 : 0.2;
          return (
            <g key={car}>
              <Rough
                boil={boil}
                shape={path(body)}
                seed={970 + car * 30}
                solid={filled ? PINK.crayon : undefined}
                o={{...C(PINK.line8, 10), fill: filled ? PINK.line8 : undefined}}
                drawn={show(a0, a0 + 0.3)}
              />
              {[0, 1, 2].map((i) => (
                <Rough
                  key={i}
                  boil={boil}
                  shape={rect(x0 + 30 + i * 84, ty + 26, 58, 48)}
                  seed={975 + car * 30 + i}
                  solid={filled ? PAPER : undefined}
                  o={C(PINK.line8, 7)}
                  drawn={show(0.45 + i * 0.04, 0.55 + i * 0.04)}
                />
              ))}
              {nose && (
                <>
                  {/* 앞 유리 + 전조등 */}
                  <Rough
                    boil={boil}
                    shape={path(`M ${x0 + 290} ${ty + 22} L ${x0 + 318} ${ty + 22} Q ${x0 + 346} ${ty + 30} ${x0 + 348} ${ty + 72} L ${x0 + 290} ${ty + 72} Z`)}
                    seed={979}
                    solid={filled ? PAPER : undefined}
                    o={C(PINK.line8, 7)}
                    drawn={show(0.55, 0.62)}
                  />
                  <Rough boil={boil} shape={circle(x0 + 342, ty + 104, 22)} seed={989} solid={filled ? DAWN.lamp : undefined} o={C(INK, 5)} drawn={show(0.6, 0.66)} />
                </>
              )}
              {/* 바퀴 */}
              {[55, 135, 225, 300].map((wx, i) => (
                <g key={i} transform={`rotate(${wheel} ${x0 + wx} ${ty + 140})`}>
                  <Rough
                    boil={boil}
                    shape={circle(x0 + wx, ty + 140, 46)}
                    seed={980 + car * 30 + i}
                    solid={filled ? INK : undefined}
                    o={C(INK, 7)}
                    drawn={show(0.7 + i * 0.05, 0.8 + i * 0.05)}
                  />
                  <Rough boil={boil} shape={line(x0 + wx - 16, ty + 140, x0 + wx + 16, ty + 140)} seed={985 + car * 30 + i} o={C(PAPER, 5)} opacity={filled ? 1 : 0} />
                </g>
              ))}
            </g>
          );
        })}
        {/* 연결부 */}
        <Rough boil={boil} shape={line(tx - 22, ty + 96, tx + 2, ty + 96)} seed={1010} o={C(INK, 8)} opacity={drawn >= 0.98 ? 1 : 0} />
      </g>
    </g>
  );
};
