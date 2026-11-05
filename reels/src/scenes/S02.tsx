import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, curve, ellipse, line, path, rect, useTwos} from '../lib/rough';
import {DAWN, HOME, INK, SKIN} from '../lib/palette';
import {GOWUN, Narration} from '../lib/Caption';
import {EVENTS, SCENES} from '../timeline';
import {MATCH_LINE_Y} from './S01';

const DUR = SCENES.S02.to - SCENES.S02.from;

/** S2. 새벽 5시 40분 — 머리맡 휴대폰이 진동하고, 이불 밖으로 나온 손이 알람을 끈다. */
export const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const t2 = useTwos();
  const buzzes = EVENTS.phoneBuzz.map((b) => b - SCENES.S02.from);
  // 진동: 각 0.3초(9프레임) 좌우로 떨림
  const shake = buzzes.reduce((acc, b) => {
    const a = frame - b;
    return a >= 0 && a < 9 ? acc + Math.sin(a * 2.6) * 9 : acc;
  }, 0);
  // 손: 48프레임부터 더듬어 다가와(on twos) 74에서 탭 → 화면 꺼짐
  const reachP = interpolate(t2, [44, 72], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fumble = Math.sin(t2 * 0.5) * 18 * (1 - reachP);
  const off = interpolate(frame, [74, 80], [1, 0.15], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const handX = 1180 - reachP * 560 + fumble;
  const handY = 1430 - reachP * 70;
  return (
    <AbsoluteFill>
      <Paper color={DAWN.deep} />
      <Camera dur={DUR} from={{s: 1.0, y: 0}} to={{s: 1.05, y: -30}} origin={[560, 1300]}>
        <Wash
          blobs={[
            {x: 540, y: 600, r: 500, color: DAWN.mid, o: 0.8},
            {x: 560, y: 1360, r: 260 * off + 20, color: HOME.phone, o: 0.35 * off},
          ]}
          blur={70}
          blend="screen"
        />
        <Stage>
          {/* 창 너머 새벽 하늘과 전깃줄(S1 크레용 선과 같은 높이) */}
          <Rough boil="bg" shape={rect(110, 330, 860, 640)} seed={1} solid={DAWN.mid} o={{fill: DAWN.pale, hachureGap: 16, strokeWidth: 6}} />
          <Rough boil="bg" shape={line(540, 330, 540, 970)} seed={2} o={{strokeWidth: 6}} />
          <Rough boil="bg" shape={curve([[110, MATCH_LINE_Y - 30], [400, MATCH_LINE_Y + 10], [700, MATCH_LINE_Y + 6], [970, MATCH_LINE_Y - 24]])} seed={3} o={{strokeWidth: 5}} />
          <Rough boil="bg" shape={rect(150, 620, 80, 350)} seed={4} solid={DAWN.deep} o={{fill: DAWN.deep, strokeWidth: 4}} />
          <Rough boil="bg" shape={rect(780, 560, 120, 410)} seed={5} solid={DAWN.deep} o={{fill: DAWN.deep, strokeWidth: 4}} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={800 + (i % 2) * 50} y={600 + i * 90} width={30} height={34} fill={DAWN.lamp} opacity={0.8} />
          ))}
          {/* 베개·이불 */}
          <Rough boil="bg" shape={rect(-40, 1180, 1160, 800)} seed={6} solid={DAWN.mid} o={{fill: DAWN.deep, hachureGap: 12}} />
          <Rough boil="bg" shape={ellipse(380, 1240, 640, 200)} seed={7} solid={DAWN.pale} o={{fill: DAWN.mid, hachureGap: 11}} />
          {/* 휴대폰 */}
          <g transform={`translate(${560 + shake} 1360) rotate(${-8 + shake * 0.3})`}>
            <Rough shape={rect(-90, -150, 180, 300)} seed={10} solid={INK} o={{fill: INK}} />
            <rect x={-74} y={-130} width={148} height={256} rx={10} fill={HOME.phone} opacity={off} />
            <text x={0} y={-30} textAnchor="middle" fontFamily={GOWUN} fontSize={56} fill={DAWN.deep} opacity={off}>
              {'05:40'}
            </text>
            <Rough shape={ellipse(0, 70, 70, 70)} seed={11} o={{stroke: DAWN.deep, strokeWidth: 4}} opacity={off} />
          </g>
          {/* 이불 밖으로 나온 손(아빠) */}
          <g>
            <Rough shape={path(`M 1200 ${handY + 80} L ${handX + 70} ${handY + 40} L ${handX + 80} ${handY + 120} L 1200 ${handY + 170} Z`)} seed={20} solid={DAWN.pale} o={{fill: DAWN.mid, hachureGap: 10}} />
            <Rough shape={ellipse(handX + 30, handY + 70, 120, 86)} seed={21} solid={SKIN} />
            {[0, 1, 2].map((i) => (
              <Rough key={i} shape={ellipse(handX - 30, handY + 42 + i * 26, 64, 26)} seed={22 + i} solid={SKIN} o={{strokeWidth: 4}} />
            ))}
          </g>
        </Stage>
      </Camera>
      <Narration lines={['아빠는 오늘도', '해 뜨기 전에 집을 나섭니다']} y={300} from={6} to={DUR + 40} />
    </AbsoluteFill>
  );
};
