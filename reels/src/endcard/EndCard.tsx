import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {Camera, GlobalDefs, Stage, TextureOverlay, Wash} from '../lib/paper';
import {Rough, path, rect} from '../lib/rough';
import {DAY, EP2, HOME, INK, PAPER, PINK, PLAZA} from '../lib/palette';
import {GOWUN, PEN} from '../lib/Caption';
import {HarinDrawing} from '../lib/HarinDrawing';
import {EVENT} from '../lib/copy';

export const ENDCARD_FRAMES = 180; // 6초

/** 등장: at 프레임부터 d 프레임 동안 아래에서 살짝 올라오며 나타난다 */
const useIn = (at: number, d = 12) => {
  const f = useCurrentFrame();
  return interpolate(f, [at, at + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
};

const Appear: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
  const p = useIn(at);
  return <div style={{position: 'absolute', left: 60, width: 880, textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 16}px)`, ...style}}>{children}</div>;
};

/** 크레용 촛불(종이컵 + 불꽃 + 후광). 촛불마다 다른 주기로 일렁인다 */
const CrayonCandle: React.FC<{x: number; y: number; s?: number; id: number; lit: number}> = ({x, y, s = 1, id, lit}) => {
  const f = useCurrentFrame();
  const fl = 0.8 + 0.2 * noise2D(`ec${id}`, f * 0.09, id);
  const sway = noise2D(`es${id}`, f * 0.12, 0) * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={-40} r={90 * lit * fl} fill={PLAZA.halo} opacity={0.45 * lit} filter="url(#glow-blur)" />
      <Rough shape={rect(-30, -10, 60, 76)} seed={3000 + id} solid={PAPER} o={{fill: DAY.sand, hachureGap: 8, strokeWidth: 5}} />
      <Rough shape={path('M -30 6 L 30 6')} seed={3010 + id} o={{stroke: DAY.amber, strokeWidth: 5}} />
      <g opacity={lit}>
        <path d={`M 0 ${-66 * fl} C ${12 + sway} -40, 12 -18, 0 -14 C -12 -18, ${-12 + sway} -40, 0 ${-66 * fl} Z`} fill={PLAZA.flame} stroke={INK} strokeWidth={3} />
        <path d={`M 0 ${-46 * fl} C ${5 + sway} -32, 5 -22, 0 -20 C -5 -22, ${-5 + sway} -32, 0 ${-46 * fl} Z`} fill={PLAZA.halo} />
      </g>
    </g>
  );
};

/**
 * 8호선 연장촉구 「희망이음 촛불문화제」 엔딩 카드.
 * 1·2탄의 마지막 장면(어두운 이불 위 아이보리 종이 + 따뜻한 번짐)과 같은 바탕에 행사 안내를 크레용으로 그린다.
 */
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const candlesLit = (i: number) => interpolate(f, [40 + i * 5, 46 + i * 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const glow = interpolate(f, [0, 60], [0.6, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <GlobalDefs />
      <AbsoluteFill style={{backgroundColor: HOME.night}} />
      <Camera dur={ENDCARD_FRAMES} from={{s: 1.0}} to={{s: 1.03}} origin={[540, 900]}>
        <Stage>
          <Rough boil="bg" shape={path('M -40 1640 Q 300 1580 600 1660 T 1120 1620 L 1120 1980 L -40 1980 Z')} seed={2} solid={HOME.slate} o={{fill: HOME.slate, hachureGap: 12}} />
          <g transform="rotate(-1.6 540 960)">
            <rect x={14} y={210} width={1052} height={1440} fill={PAPER} />
            <Rough boil="bg" shape={rect(14, 210, 1052, 1440)} seed={3} o={{strokeWidth: 3, stroke: DAY.sand, roughness: 0.8}} />
          </g>
        </Stage>
        <Wash
          blobs={[
            {x: 500, y: 860, r: 520 * glow, color: DAY.sun, o: 0.75},
            {x: 500, y: 1300, r: 420, color: EP2.bulb, o: 0.35},
          ]}
          blur={80}
        />
        <Stage>
          {/* 하린의 분홍 지하철(1·2탄과 같은 그림) */}
          <g transform="translate(237 -14) scale(0.5)" opacity={useIn(6)}>
            <HarinDrawing scenery={false} />
          </g>
          {/* 촛불 다섯 개: 왼쪽부터 하나씩 켜진다 */}
          {[0, 1, 2, 3, 4].map((i) => (
            <CrayonCandle key={i} id={i} x={180 + i * 160} y={872 + (i % 2) * 12} s={0.9} lit={candlesLit(i)} />
          ))}
          {/* 태그라인 배너 */}
          <g opacity={useIn(72)}>
            <Rough shape={path('M 100 1184 Q 500 1160 900 1184 L 892 1280 Q 500 1300 108 1280 Z')} seed={3100} solid={DAY.sun} o={{fill: DAY.amber, hachureGap: 12, strokeWidth: 5}} />
          </g>
          {/* 구분선 */}
          <g opacity={useIn(90)}>
            <Rough shape={path('M 200 1312 Q 500 1304 800 1312')} seed={3101} o={{stroke: DAY.amber, strokeWidth: 4}} />
          </g>
        </Stage>
      </Camera>

      {/* 글자는 카메라 밖(화면 고정)에 두어 안전 영역 안에 정확히 놓는다 */}
      <Appear at={14} style={{top: 392, fontFamily: GOWUN, fontSize: 58, letterSpacing: '0.04em', color: INK}}>
        <span style={{color: PINK.line8}}>8호선</span> 연장촉구
      </Appear>
      <Appear at={22} style={{top: 470}}>
        <svg width={880} height={300} style={{overflow: 'visible'}}>
          <g filter="url(#crayon-text)" fontFamily={GOWUN} textAnchor="middle" fill={INK}>
            <text x={440} y={118} fontSize={124}>
              {EVENT.title[0]}
            </text>
            <text x={440} y={262} fontSize={124}>
              {EVENT.title[1]}
            </text>
          </g>
        </svg>
      </Appear>
      <Appear at={56} style={{top: 984, fontFamily: GOWUN, fontSize: 54, color: INK, lineHeight: 1.25}}>
        <div>{EVENT.date}</div>
        <div style={{fontSize: 74, marginTop: 4}}>{EVENT.place}</div>
      </Appear>
      <Appear at={74} style={{top: 1192, fontFamily: PEN, fontSize: 70, color: INK}}>
        {EVENT.tagline}
      </Appear>
      <Appear at={92} style={{top: 1326, fontFamily: GOWUN, fontSize: 31, color: INK, lineHeight: 1.55}}>
        <div style={{opacity: 0.9}}>
          <div>{EVENT.performers.slice(0, 3).join(' · ')}</div>
          <div>{EVENT.performers.slice(3).join(' · ')}</div>
        </div>
      </Appear>
      <Appear at={104} style={{top: 1432, fontFamily: GOWUN, fontSize: 27, color: INK, lineHeight: 1.5}}>
        <div style={{opacity: 0.8}}>
          {EVENT.host} · {EVENT.partner}
        </div>
      </Appear>
      <TextureOverlay vignette={0.22} />
    </AbsoluteFill>
  );
};
