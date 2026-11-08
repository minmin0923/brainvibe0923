// demos/_fixtures/Look.tsx 에서 이 영상에 필요한 것만 그대로 가져왔다(springAt, TextReveal).
import React from 'react';
import { spring, useCurrentFrame } from 'remotion';
import { EASE } from './Polish';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const springAt = (frame: number, start: number, opts: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  spring({ frame: frame - start, fps: 30, config: { damping: opts.damping ?? 18, stiffness: opts.stiffness ?? 170, mass: opts.mass ?? 1 } });

// 단어/글자 단위 상승 등장(rise). 마스크 안에서 아래에서 올라온다.
export const TextReveal: React.FC<{
  text: string; start?: number; by?: 'char' | 'word'; each?: number; gap?: number; style?: React.CSSProperties;
}> = ({ text, start = 0, by = 'word', each = 18, gap, style }) => {
  const frame = useCurrentFrame();
  const units = by === 'word' ? text.split(/(\s+)/) : Array.from(text);
  const g = gap ?? (by === 'char' ? 1.6 : 4);
  let k = 0;
  return (
    <span style={{ display: 'inline', whiteSpace: 'pre', ...style }}>
      {units.map((u, i) => {
        if (/^\s+$/.test(u)) return <span key={i}>{u}</span>;
        const idx = k++;
        const p = EASE.snappy(clamp01((frame - start - idx * g) / each));
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.06em 0.02em 0.22em', margin: '-0.06em -0.02em -0.22em' }}>
            <span style={{ display: 'inline-block', transform: `translateY(calc(${((1 - p) * 105).toFixed(2)}% + ${((1 - p) * 0.3).toFixed(3)}em))` }}>{u}</span>
          </span>
        );
      })}
    </span>
  );
};
