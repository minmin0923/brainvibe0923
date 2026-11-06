import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {GOWUN, PEN} from './fonts';
import {INK, WHITE} from './palette';

export {GOWUN, PEN};

/** 인스타그램 안전 영역: 자막은 y 260~1480, 좌 60 / 우 140 여백 */
export const SAFE = {top: 260, bottom: 1480, left: 60, right: 140};
const SAFE_W = 1080 - SAFE.left - SAFE.right; // 880

type Common = {
  /** 장면 내부 프레임 기준 등장/퇴장 */
  from?: number;
  to?: number;
  /** 자막 블록의 위쪽 y (안전 영역 안) */
  y: number;
  color?: string;
  align?: 'center' | 'left';
  fade?: number;
};

const useFade = (from: number, to: number | undefined, fade: number) => {
  const f = useCurrentFrame();
  const inO = interpolate(f, [from, from + fade], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const outO =
    to === undefined ? 1 : interpolate(f, [to - fade, to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return Math.min(inO, outO);
};

const box = (y: number, align: 'center' | 'left'): React.CSSProperties => ({
  position: 'absolute',
  left: SAFE.left,
  width: SAFE_W,
  top: y,
  textAlign: align,
  wordBreak: 'keep-all',
});

/** 내레이션 자막 (Gowun Dodum 56px) */
export const Narration: React.FC<Common & {lines: string[]; size?: number; backdrop?: boolean}> = ({
  lines,
  from = 0,
  to,
  y,
  color = WHITE,
  align = 'center',
  fade = 8,
  size = 56,
  backdrop = false,
}) => {
  const o = useFade(from, to, fade);
  const dark = color !== WHITE;
  return (
    <div
      style={{
        ...box(y, align),
        opacity: o,
        fontFamily: GOWUN,
        fontSize: size,
        lineHeight: 1.45,
        letterSpacing: '0.02em',
        color,
        textShadow: dark ? '0 0 18px rgba(251,246,236,0.9)' : '0 2px 14px rgba(30,42,68,0.75), 0 0 3px rgba(30,42,68,0.6)',
      }}
    >
      <span
        style={
          backdrop
            ? {display: 'inline-block', padding: '10px 34px', borderRadius: 28, background: 'rgba(30,42,68,0.5)'}
            : {display: 'inline-block'}
        }
      >
        {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
      </span>
    </div>
  );
};

/** 하린의 말·손글씨 카드 (Nanum Pen Script 70~96px) */
export const Handwrite: React.FC<Common & {lines: string[]; size?: number; rotate?: number}> = ({
  lines,
  from = 0,
  to,
  y,
  color = INK,
  align = 'center',
  fade = 6,
  size = 84,
  rotate = -1.5,
}) => {
  const o = useFade(from, to, fade);
  const dark = color !== WHITE;
  return (
    <div
      style={{
        ...box(y, align),
        opacity: o,
        fontFamily: PEN,
        fontSize: size,
        lineHeight: 1.15,
        color,
        transform: `rotate(${rotate}deg)`,
        textShadow: dark ? '0 0 16px rgba(251,246,236,0.95)' : '0 2px 14px rgba(30,42,68,0.8)',
      }}
    >
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

/** 단어 단위로 말하듯 나타나는 자막 (S12) */
export const WordByWord: React.FC<
  Common & {lines: {at: number; text: string}[]; size?: number; perWord?: number; font?: 'pen' | 'gowun'}
> = ({lines, y, to, color = WHITE, align = 'center', size = 92, perWord = 7, font = 'pen'}) => {
  const f = useCurrentFrame();
  const outO =
    to === undefined ? 1 : interpolate(f, [to - 8, to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        ...box(y, align),
        opacity: outO,
        fontFamily: font === 'pen' ? PEN : GOWUN,
        fontSize: size,
        lineHeight: 1.15,
        color,
        textShadow: '0 2px 16px rgba(34,38,79,0.85)',
      }}
    >
      {lines.map((l, li) => (
        <div key={li}>
          {l.text.split(' ').map((w, wi) => {
            const start = l.at + wi * perWord;
            const p = interpolate(f, [start, start + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <span
                key={wi}
                style={{
                  display: 'inline-block',
                  opacity: p,
                  transform: `translateY(${(1 - p) * 14}px)`,
                  marginRight: '0.28em',
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
