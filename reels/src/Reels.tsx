import React from 'react';
import {AbsoluteFill, Freeze, Sequence} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {DISSOLVE, SCENES, type SceneId} from './timeline';
import {GlobalDefs, TextureOverlay} from './lib/paper';
import {DAWN} from './lib/palette';
import {S01} from './scenes/S01';
import {S02} from './scenes/S02';
import {S03} from './scenes/S03';
import {S04} from './scenes/S04';
import {S05} from './scenes/S05';
import {S06} from './scenes/S06';
import {S07} from './scenes/S07';
import {S08} from './scenes/S08';
import {S09} from './scenes/S09';
import {S10} from './scenes/S10';
import {S11} from './scenes/S11';
import {S12} from './scenes/S12';
import {S13} from './scenes/S13';
import {S14} from './scenes/S14';

const HALF = DISSOLVE / 2;

const COMPONENTS: Record<SceneId, React.FC> = {
  S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14,
};

/** 디졸브로 들어오는 장면: 앞 15프레임은 첫 프레임에 멈춘 채 겹쳐 보이고, 컷 지점(TC)부터 재생된다. */
const LeadIn: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Freeze frame={HALF} active={(f) => f < HALF}>
    <Sequence from={HALF}>{children}</Sequence>
  </Freeze>
);

const len = (id: SceneId) => SCENES[id].to - SCENES[id].from;

/**
 * 60초 본편. 컷은 timeline.ts의 TC에 정확히 맞춘다.
 * 디졸브(1초) 두 곳: S4→S5, S9→S10 — 컷 지점을 중심으로 앞뒤 15프레임씩 겹친다.
 */
export const Reels: React.FC = () => {
  const ids = Object.keys(SCENES) as SceneId[];
  const items: React.ReactNode[] = [];
  ids.forEach((id) => {
    const Comp = COMPONENTS[id];
    const dissolveOut = id === 'S04' || id === 'S09';
    const dissolveIn = id === 'S05' || id === 'S10';
    const dur = len(id) + (dissolveOut ? HALF : 0) + (dissolveIn ? HALF : 0);
    items.push(
      <TransitionSeries.Sequence key={id} durationInFrames={dur}>
        {dissolveIn ? (
          <LeadIn>
            <Comp />
          </LeadIn>
        ) : (
          <Comp />
        )}
      </TransitionSeries.Sequence>,
    );
    if (dissolveOut) {
      items.push(
        <TransitionSeries.Transition key={`${id}-fade`} presentation={fade()} timing={linearTiming({durationInFrames: DISSOLVE})} />,
      );
    }
  });
  return (
    <AbsoluteFill style={{backgroundColor: DAWN.deep}}>
      <GlobalDefs />
      <TransitionSeries>{items}</TransitionSeries>
      <TextureOverlay vignette={0.3} />
    </AbsoluteFill>
  );
};
