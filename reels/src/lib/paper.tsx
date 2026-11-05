import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../timeline';
import {PAPER} from './palette';

export const EASE = Easing.bezier(0.45, 0, 0.25, 1);

/** 화면 전체에서 한 번만 두는 SVG 필터 정의 */
export const GlobalDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      {/* 선: 크레용처럼 살짝 흔들리고 군데군데 끊긴다 */}
      <filter id="crayon-line" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={4} result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale={3} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={11} result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.6" result="mask" />
        <feComposite in="d" in2="mask" operator="in" />
      </filter>
      {/* 면: 가장자리를 거칠게 + 종이 결 사이로 흰 틈이 보이게 */}
      <filter id="crayon-fill" x="-6%" y="-6%" width="112%" height="112%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={7} result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale={9} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.55 0.9" numOctaves={2} seed={21} result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.05" result="mask" />
        <feComposite in="d" in2="mask" operator="in" />
      </filter>
      {/* 엔딩 타이틀 등 글자용 크레용 질감 */}
      <filter id="crayon-text" x="-5%" y="-10%" width="110%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={2} result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale={4} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.7 1.1" numOctaves={2} seed={5} result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.15" result="mask" />
        <feComposite in="d" in2="mask" operator="in" />
      </filter>
      <filter id="soft-blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={18} />
      </filter>
      <filter id="glow-blur" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation={10} />
      </filter>
    </defs>
  </svg>
);

/** 바탕 종이 + 장면 색 */
export const Paper: React.FC<{color?: string}> = ({color = PAPER}) => (
  <AbsoluteFill style={{backgroundColor: color}} />
);

export type Blob = {x: number; y: number; r: number; color: string; o?: number};

/** 수채 번짐: 블러 처리한 큰 원을 multiply로 겹친다 */
export const Wash: React.FC<{blobs: Blob[]; blur?: number; blend?: React.CSSProperties['mixBlendMode']}> = ({
  blobs,
  blur = 60,
  blend = 'multiply',
}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {blobs.map((b, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: b.x - b.r,
          top: b.y - b.r,
          width: b.r * 2,
          height: b.r * 2,
          borderRadius: '50%',
          background: b.color,
          opacity: b.o ?? 0.5,
          filter: `blur(${blur}px)`,
          mixBlendMode: blend,
        }}
      />
    ))}
  </AbsoluteFill>
);

/** 장면 전체 SVG 캔버스(1080×1920 좌표) */
export const Stage: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg
    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    width={WIDTH}
    height={HEIGHT}
    style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}
  >
    {children}
  </svg>
);

/**
 * 카메라: 모든 컷에 최소한의 움직임을 준다(30fps로 부드럽게).
 * scale 1.0→1.06 줌, 또는 x/y 2~4% 팬. 중심점(ox, oy)을 향해 밀고 들어간다.
 */
export const Camera: React.FC<{
  dur: number;
  from?: {s?: number; x?: number; y?: number};
  to?: {s?: number; x?: number; y?: number};
  origin?: [number, number];
  children: React.ReactNode;
  offset?: {x?: number; y?: number};
}> = ({dur, from = {}, to = {}, origin = [WIDTH / 2, HEIGHT / 2], children, offset}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
  const s = (from.s ?? 1) + ((to.s ?? 1) - (from.s ?? 1)) * t;
  const x = (from.x ?? 0) + ((to.x ?? 0) - (from.x ?? 0)) * t + (offset?.x ?? 0);
  const y = (from.y ?? 0) + ((to.y ?? 0) - (from.y ?? 0)) * t + (offset?.y ?? 0);
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}px, ${y}px) scale(${s})`,
        transformOrigin: `${origin[0]}px ${origin[1]}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** 맨 위 공통 질감: 종이 결 + 필름 그레인 + 비네팅 */
export const TextureOverlay: React.FC<{vignette?: number; paper?: number}> = ({vignette = 0.35, paper = 0.1}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* 종이 결 (고정) */}
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: paper}}>
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85 0.6" numOctaves={3} seed={17} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.40  0 0 0 0 0.34  0 0 0 1.6 -0.2" />
        </filter>
        <rect width={WIDTH} height={HEIGHT} filter="url(#paper-grain)" />
        <filter id="paper-fiber">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.08" numOctaves={2} seed={3} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 1.4 -0.45" />
        </filter>
        <rect width={WIDTH} height={HEIGHT} filter="url(#paper-fiber)" />
      </svg>
      {/* 필름 그레인 (매 프레임 바뀜) */}
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, opacity: 0.06, mixBlendMode: 'overlay'}}>
        <filter id={`film-${frame % 6}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={1} seed={frame % 97} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={WIDTH} height={HEIGHT} filter={`url(#film-${frame % 6})`} />
      </svg>
      {/* 비네팅 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 62% at 50% 48%, rgba(30,42,68,0) 55%, rgba(30,42,68,${vignette}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
