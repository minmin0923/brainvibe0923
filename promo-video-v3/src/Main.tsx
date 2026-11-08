import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { FontGate } from './lib/Fonts';
import { SHOTS } from './timeline';
import { S1Hook } from './scenes/S1Hook';
import { S2Brand } from './scenes/S2Brand';
import { S3Unlock } from './scenes/S3Unlock';
import { S4Everyone } from './scenes/S4Everyone';
import { S5Map } from './scenes/S5Map';
import { S6Grow } from './scenes/S6Grow';
import { S7Outro } from './scenes/S7Outro';

export type PromoProps = { bgm: boolean; audio: boolean };

const SCENES: [keyof typeof SHOTS, React.FC][] = [
  ['hook', S1Hook], ['brand', S2Brand], ['unlock', S3Unlock], ['everyone', S4Everyone],
  ['map', S5Map], ['grow', S6Grow], ['outro', S7Outro],
];

export const Main: React.FC<PromoProps> = ({ bgm, audio }) => (
  <AbsoluteFill style={{ background: '#F4FAF6' }}>
    <FontGate>
      {SCENES.map(([key, Scene]) => (
        <Sequence key={key} name={key} from={SHOTS[key].from} durationInFrames={SHOTS[key].duration}>
          <Scene />
        </Sequence>
      ))}
    </FontGate>
    {/* 음악과 효과음은 score/ 에서 같은 시간표로 합성한 WAV. bgm=false 면 효과음만 있는 판 */}
    {audio && <Audio src={staticFile(bgm ? 'audio/score.wav' : 'audio/sfx-only.wav')} />}
  </AbsoluteFill>
);
