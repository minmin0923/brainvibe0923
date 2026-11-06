import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {FPS, HEIGHT, SCENES, SUB, TOTAL, WIDTH, type SceneId} from './timeline';
import {GlobalDefs, TextureOverlay} from './lib/paper';
import {Reels} from './Reels';
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
import {S14, S14B} from './scenes/S14';
import {CharacterSheet} from './sheets/CharacterSheet';
import {Reels2} from './ep2/Reels2';
import {CharacterSheet2} from './ep2/CharacterSheet2';

/** 장면 하나를 공통 질감 레이어와 함께 미리 보기 위한 래퍼 */
const Frame: React.FC<{children: React.ReactNode; vignette?: number}> = ({children, vignette}) => (
  <AbsoluteFill>
    <GlobalDefs />
    {children}
    <TextureOverlay vignette={vignette} />
  </AbsoluteFill>
);

const SCENE_COMPS: Record<SceneId, React.FC> = {S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14};
const len = (id: SceneId) => SCENES[id].to - SCENES[id].from;
const common = {fps: FPS, width: WIDTH, height: HEIGHT};

export const Root: React.FC = () => (
  <>
    {/* 2탄 「다녀올게, 다녀왔어」 */}
    <Composition id="EP2" component={Reels2} durationInFrames={TOTAL} {...common} />
    <Composition id="EP2Sheet" component={() => <Frame vignette={0.12}><CharacterSheet2 /></Frame>} durationInFrames={30} {...common} />
    {/* 본편 60초 */}
    <Composition id="Reels" component={Reels} durationInFrames={TOTAL} {...common} />
    {/* 장면별 미리보기 */}
    {(Object.keys(SCENES) as SceneId[]).map((id) => {
      const C = SCENE_COMPS[id];
      return <Composition key={id} id={id} component={() => <Frame><C /></Frame>} durationInFrames={len(id)} {...common} />;
    })}
    <Composition id="S14B" component={() => <Frame vignette={0.2}><S14B /></Frame>} durationInFrames={TOTAL - SUB.S14B} {...common} />
    <Composition id="CharacterSheet" component={() => <Frame vignette={0.12}><CharacterSheet /></Frame>} durationInFrames={30} {...common} />
  </>
);
