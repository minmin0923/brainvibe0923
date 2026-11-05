import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {FPS, HEIGHT, SCENES, SUB, TOTAL, WIDTH} from './timeline';
import {GlobalDefs, TextureOverlay} from './lib/paper';
import {S03} from './scenes/S03';
import {S07} from './scenes/S07';
import {S10} from './scenes/S10';
import {S14B} from './scenes/S14';

/** 장면 하나를 공통 질감 레이어와 함께 미리 보기 위한 래퍼 */
const Frame: React.FC<{children: React.ReactNode; vignette?: number}> = ({children, vignette}) => (
  <AbsoluteFill>
    <GlobalDefs />
    {children}
    <TextureOverlay vignette={vignette} />
  </AbsoluteFill>
);

const len = (id: keyof typeof SCENES) => SCENES[id].to - SCENES[id].from;

export const Root: React.FC = () => (
  <>
    <Composition id="S03" component={() => <Frame><S03 /></Frame>} durationInFrames={len('S03')} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="S07" component={() => <Frame vignette={0.22}><S07 /></Frame>} durationInFrames={len('S07')} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="S10" component={() => <Frame><S10 /></Frame>} durationInFrames={len('S10')} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="S14B" component={() => <Frame vignette={0.2}><S14B /></Frame>} durationInFrames={TOTAL - SUB.S14B} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
