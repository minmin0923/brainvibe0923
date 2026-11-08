import React from 'react';
import { Composition } from 'remotion';
import { Main, PromoProps } from './Main';
import { TOTAL } from './timeline';

export const Root: React.FC = () => (
  <Composition
    id="BenefitMapPromo"
    component={Main as React.FC<PromoProps>}
    durationInFrames={TOTAL}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ bgm: true, audio: true } as PromoProps}
  />
);
