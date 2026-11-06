import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {GOWUN} from '../../lib/Caption';
import {EP2, WHITE} from '../../lib/palette';
import {SCENES, TIMER} from '../timeline';
import {WallClock} from './WallClock';

/** 구간 키프레임을 선형으로 이은 분 값 */
const minutesAt = (keys: [number, number][], f: number) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) {
      const [f0, m0] = keys[i - 1];
      const [f1, m1] = keys[i];
      return m0 + ((m1 - m0) * (f - f0)) / Math.max(1, f1 - f0);
    }
  }
  return keys[keys.length - 1][1];
};

export const fmt = (min: number) => {
  const m = Math.floor(min + 1e-6);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

/** 타이머가 보이는 구간(아빠가 길 위·회사에 있을 때). 집 장면(S8, S11)에서는 감춘다. */
const visibleAt = (f: number) =>
  f >= 190 && f < TIMER.hide && !(f >= SCENES.S08.from && f < SCENES.S08.to) && !(f >= SCENES.S11.from && f < SCENES.S12.from);

const Line: React.FC<{text: string; label?: string; pop?: number; dim?: boolean; size?: number}> = ({text, label, pop = 1, dim, size = 44}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, transform: `scale(${pop})`, transformOrigin: 'left center', opacity: dim ? 0.75 : 1, padding: '6px 22px 6px 12px', borderRadius: 40, background: 'rgba(30,42,68,0.42)', alignSelf: 'flex-start'}}>
    <svg width={size} height={size} viewBox="0 0 60 60" style={{overflow: 'visible'}}>
      <WallClock x={30} y={30} r={24} time="10:08" face="none" ink={WHITE} seed={2100} />
    </svg>
    <span style={{fontFamily: GOWUN, fontSize: size, color: WHITE, opacity: 0.88, letterSpacing: '0.02em', textShadow: `0 2px 10px ${EP2.night}`}}>
      {text}
    </span>
    {label && (
      <span style={{fontFamily: GOWUN, fontSize: size * 0.62, color: WHITE, opacity: 0.75, marginLeft: 6, textShadow: `0 2px 8px ${EP2.night}`}}>{label}</span>
    )}
  </div>
);

/**
 * ① 길 위의 시간. 화면 좌상단(x 80, y 280), 44px, 반투명 흰색 + 손그림 시계.
 * 아침 0:00→1:32(멈추며 spring) / 저녁 0:00→1:48, 0:37.5에 합쳐져 "오늘, 길 위에서 3시간 20분".
 * S10 분할 화면에서는 아래(아빠) 패널 안에만 보인다.
 */
export const CommuteTimer: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!visibleAt(f)) return null;
  const morning = minutesAt(TIMER.morning, f);
  const evening = minutesAt(TIMER.evening, f);
  const eveningOn = f >= SCENES.S07.from;
  const mPop = 1 + 0.18 * (1 - spring({frame: f - TIMER.morningStop, fps, config: {damping: 7, stiffness: 180}})) * (f >= TIMER.morningStop ? 1 : 0);
  const ePop = 1 + 0.18 * (1 - spring({frame: f - TIMER.eveningStop, fps, config: {damping: 7, stiffness: 180}})) * (f >= TIMER.eveningStop ? 1 : 0);
  const inSplit = f >= SCENES.S10.from && f < SCENES.S10.to;
  const top = inSplit ? 1000 : 280;
  // 합계로 합쳐지기
  const mergeP = interpolate(f, [TIMER.merge, TIMER.merge + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.25, 1)});
  const fadeOut = interpolate(f, [TIMER.hide - 10, TIMER.hide], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const total = Math.round(92 + 108);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: fadeOut}}>
      {mergeP < 1 && (
        <div
          style={{
            position: 'absolute',
            left: 80 + mergeP * 200,
            top: top + mergeP * 520,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            opacity: 1 - mergeP,
          }}
        >
          {!eveningOn ? (
            <Line text={`길 위의 시간  ${fmt(morning)}`} label={f >= TIMER.morningStop ? '아침' : undefined} pop={mPop} />
          ) : (
            <>
              <Line text={`길 위의 시간  ${fmt(evening)}`} label={f >= TIMER.eveningStop ? '저녁' : undefined} pop={ePop} />
              <Line text={`아침  ${fmt(92)}`} dim size={30} />
            </>
          )}
        </div>
      )}
      {mergeP > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 60,
            width: 880,
            top: 800,
            textAlign: 'center',
            fontFamily: GOWUN,
            color: WHITE,
            opacity: mergeP,
            padding: '30px 0',
            borderRadius: 40,
            background: `rgba(30,42,68,${0.72 * mergeP})`,
            transform: `scale(${0.85 + mergeP * 0.15})`,
            textShadow: `0 3px 18px ${EP2.night}`,
          }}
        >
          <div style={{fontSize: 40, opacity: 0.8}}>아침 1:32 + 저녁 1:48</div>
          <div style={{fontSize: 66, marginTop: 14, letterSpacing: '0.02em'}}>
            오늘, 길 위에서 {Math.floor(total / 60)}시간 {total % 60}분
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
