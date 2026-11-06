import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {HEIGHT, WIDTH} from '../timeline';
import {INK} from '../../lib/palette';

/**
 * 세로 2분할. 위·아래 패널이 spring으로 미끄러져 들어오고, expandTopFrom부터 위 패널이 내려와 전체 화면이 된다.
 * 각 패널의 내용은 1080×1920 좌표로 그리되, 패널 높이(960)에 맞춰 잘린다.
 */
export const SplitScreen: React.FC<{top: React.ReactNode; bottom: React.ReactNode; expandTopFrom?: number; topOffset?: number; bottomOffset?: number}> = ({
  top,
  bottom,
  expandTopFrom,
  topOffset = 480,
  bottomOffset = 480,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inP = spring({frame: f, fps, config: {damping: 16, stiffness: 120}});
  const ex = expandTopFrom === undefined ? 0 : interpolate(f, [expandTopFrom, expandTopFrom + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const half = HEIGHT / 2;
  const topH = half + ex * half;
  return (
    <AbsoluteFill>
      {/* 아래(아빠·정류장) */}
      <div style={{position: 'absolute', left: 0, top: half + (1 - inP) * half, width: WIDTH, height: half, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: -bottomOffset, width: WIDTH, height: HEIGHT}}>{bottom}</div>
      </div>
      {/* 위(엄마·부엌) */}
      <div style={{position: 'absolute', left: 0, top: -(1 - inP) * half, width: WIDTH, height: topH, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: -topOffset * (1 - ex), width: WIDTH, height: HEIGHT}}>{top}</div>
      </div>
      {/* 분할선 */}
      <div style={{position: 'absolute', left: 0, top: topH - 3 - (1 - inP) * half, width: WIDTH, height: 6, background: INK, opacity: 1 - ex}} />
    </AbsoluteFill>
  );
};
