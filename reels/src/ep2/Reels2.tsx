import React from 'react';
import {AbsoluteFill, Freeze, Sequence, useCurrentFrame} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {GlobalDefs, TextureOverlay} from '../lib/paper';
import {EP2} from '../lib/palette';
import {DISSOLVE, SCENES, type SceneId} from './timeline';
import {S01, S02, S03} from './scenes/S01_S03';
import {S04, S05, S06, S07} from './scenes/S04_S07';
import {S08, S09, S10, S11} from './scenes/S08_S11';
import {S12, S13, S14, S15} from './scenes/S12_S15';
import {CommuteTimer} from './lib/CommuteTimer';

const HALF = DISSOLVE / 2;
export const EP2_SCENES: Record<SceneId, React.FC> = {S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15};

/** 바깥 장면은 비네팅을 강하게(0.5), 집 장면은 약하게(0.25) */
const VIGNETTE: Record<SceneId, number> = {
  S01: 0.4, S02: 0.4, S03: 0.5, S04: 0.5, S05: 0.5, S06: 0.5, S07: 0.5, S08: 0.25,
  S09: 0.5, S10: 0.4, S11: 0.25, S12: 0.5, S13: 0.25, S14: 0.25, S15: 0.25,
};
const sceneAt = (f: number) => (Object.keys(SCENES) as SceneId[]).find((id) => f >= SCENES[id].from && f < SCENES[id].to) ?? 'S15';

const LeadIn: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Freeze frame={HALF} active={(f) => f < HALF}>
    <Sequence from={HALF}>{children}</Sequence>
  </Freeze>
);

/** 2탄 본편 60초: 컷은 TC에 맞추고, 디졸브 두 곳(S11→S12, S14→S15)은 컷 지점 중심 1초 */
export const Reels2: React.FC = () => {
  const f = useCurrentFrame();
  const ids = Object.keys(SCENES) as SceneId[];
  const items: React.ReactNode[] = [];
  ids.forEach((id) => {
    const Comp = EP2_SCENES[id];
    const out = id === 'S11' || id === 'S14';
    const inn = id === 'S12' || id === 'S15';
    const dur = SCENES[id].to - SCENES[id].from + (out ? HALF : 0) + (inn ? HALF : 0);
    items.push(
      <TransitionSeries.Sequence key={id} durationInFrames={dur}>
        {inn ? (
          <LeadIn>
            <Comp />
          </LeadIn>
        ) : (
          <Comp />
        )}
      </TransitionSeries.Sequence>,
    );
    if (out) items.push(<TransitionSeries.Transition key={`${id}-fade`} presentation={fade()} timing={linearTiming({durationInFrames: DISSOLVE})} />);
  });
  return (
    <AbsoluteFill style={{backgroundColor: EP2.night}}>
      <GlobalDefs />
      <TransitionSeries>{items}</TransitionSeries>
      <CommuteTimer />
      <TextureOverlay vignette={VIGNETTE[sceneAt(f)]} />
    </AbsoluteFill>
  );
};
