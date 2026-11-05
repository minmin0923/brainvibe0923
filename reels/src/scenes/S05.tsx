import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {Camera, Paper, Stage, Wash} from '../lib/paper';
import {Rough, rect} from '../lib/rough';
import {CARDIGAN, DAY, INK, JUMPER, PAPER} from '../lib/palette';
import {Hand} from '../chars/Crowd';
import {HarinDrawing} from '../lib/HarinDrawing';
import {PEN} from '../lib/Caption';
import {COPY} from '../lib/copy';
import {SCENES} from '../timeline';

const DUR = SCENES.S05.to - SCENES.S05.from;
/** 세 손의 펜 끝이 오는 화면상의 같은 자리(모션 매치) */
const TIP: [number, number] = [880, 1060];
const PART = [0, 33, 66, DUR];

/** 글씨가 한 획씩 써지는 카드. 펜 끝은 고정, 카드가 펜 아래로 흘러간다. */
const WritingCard: React.FC<{
  text?: string;
  drawing?: boolean;
  kind: 'grandma' | 'vendor' | 'child';
  sleeve: string;
  dur: number;
  tint: string;
}> = ({text, drawing, kind, sleeve, dur, tint}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [1, dur - 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const textW = drawing ? 470 : 740;
  // 카드는 왼쪽으로 흘러 펜 끝 아래에 '지금 쓰는 글자'가 오게 한다
  const startX = TIP[0] + 20;
  const cardX = startX - p * textW;
  const wob = Math.sin(frame * 1.7) * 6;
  return (
    <AbsoluteFill>
      <Paper color={DAY.cream} />
      <Camera dur={dur} from={{s: 1.0}} to={{s: 1.04}} origin={TIP}>
        <Wash blobs={[{x: TIP[0], y: TIP[1], r: 520, color: tint, o: 0.55}]} blur={80} />
        <Stage>
          <g transform={`translate(${cardX} 0)`}>
            <Rough shape={rect(-80, 820, textW + 220, 420)} seed={40} solid={PAPER} o={{fill: undefined, strokeWidth: 5}} />
            {text && (
              <>
                <defs>
                  <clipPath id={`clip-${kind}`}>
                    <rect x={-60} y={850} width={40 + p * textW} height={360} />
                  </clipPath>
                </defs>
                <text x={-20} y={1086} fontFamily={PEN} fontSize={84} fill={INK} clipPath={`url(#clip-${kind})`}>
                  {text}
                </text>
              </>
            )}
            {drawing && (
              <g transform="translate(-140 650) scale(0.66)">
                <HarinDrawing drawn={p} scenery={false} />
              </g>
            )}
          </g>
          <Hand x={TIP[0]} y={TIP[1] + wob * 0.4} rot={-8 + wob * 0.3} s={kind === 'child' ? 0.85 : 1.05} kind={kind} sleeve={sleeve} tool={kind === 'child' ? 'crayon' : 'pen'} seed={1200 + kind.length * 10} />
        </Stage>
      </Camera>
    </AbsoluteFill>
  );
};

/** S5. 염원을 적다 — 할머니 → 시장 상인 → 하린, 각 1초. */
export const S05: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={PART[1]}>
      <WritingCard text={COPY.s5Cards[0]} kind="grandma" sleeve={CARDIGAN} dur={PART[1]} tint={DAY.sand} />
    </Sequence>
    <Sequence from={PART[1]} durationInFrames={PART[2] - PART[1]}>
      <WritingCard text={COPY.s5Cards[1]} kind="vendor" sleeve={DAY.amber} dur={PART[2] - PART[1]} tint={DAY.amber} />
    </Sequence>
    <Sequence from={PART[2]}>
      <WritingCard drawing kind="child" sleeve={JUMPER} dur={PART[3] - PART[2]} tint={DAY.sun} />
    </Sequence>
  </AbsoluteFill>
);
