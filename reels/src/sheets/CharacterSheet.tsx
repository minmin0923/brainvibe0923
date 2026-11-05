import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Paper, Stage, Wash} from '../lib/paper';
import {Rough, line} from '../lib/rough';
import {DAY, DAWN, INK, PAPER} from '../lib/palette';
import {GOWUN, PEN} from '../lib/Caption';
import {Harin, HarinHead} from '../chars/Harin';
import {Dad, DadHead} from '../chars/Dad';
import {Grandma, GrandmaHead} from '../chars/Grandma';
import type {Mouth} from '../chars/parts';

const FLOOR = 1080;

const Label: React.FC<{x: number; y: number; title: string; sub: string[]}> = ({x, y, title, sub}) => (
  <g>
    <text x={x} y={y} textAnchor="middle" fontFamily={GOWUN} fontSize={38} fill={INK}>
      {title}
    </text>
    {sub.map((l, i) => (
      <text key={i} x={x} y={y + 40 + i * 30} textAnchor="middle" fontFamily={GOWUN} fontSize={23} fill={INK} opacity={0.7}>
        {l}
      </text>
    ))}
  </g>
);

type Expr = {eyes?: 'open' | 'closed'; mouth: Mouth; look?: number; label: string; tearful?: boolean};

const HARIN_EXPR: Expr[] = [
  {mouth: 'smile', label: '기본'},
  {mouth: 'o', eyes: 'closed', label: '잠듦'},
  {mouth: 'flat', look: 4, label: '창밖 보기'},
  {mouth: 'o', label: '마이크 앞'},
];
const DAD_EXPR: Expr[] = [
  {mouth: 'flat', label: '피곤함'},
  {mouth: 'grin', label: '눈 맞춤'},
  {mouth: 'sad', tearful: true, label: '객석에서 울컥'},
  {mouth: 'sing', label: '함께 노래'},
];
const GRANDMA_EXPR: Expr[] = [
  {mouth: 'smile', label: '기본'},
  {mouth: 'o', label: '"꼭 전해줘"'},
  {mouth: 'smile', eyes: 'closed', label: '기도'},
];

/** 2단계 캐릭터 시트: 키 비교 라인업 + 표정 */
export const CharacterSheet: React.FC = () => (
  <AbsoluteFill>
    <Paper color={PAPER} />
    <Wash
      blobs={[
        {x: 200, y: 700, r: 360, color: DAY.sun, o: 0.5},
        {x: 860, y: 520, r: 380, color: DAY.sand, o: 0.45},
        {x: 540, y: 1600, r: 600, color: DAY.cream, o: 0.6},
      ]}
      blur={80}
    />
    <Stage>
      <text x={60} y={110} fontFamily={GOWUN} fontSize={56} fill={INK}>
        캐릭터 시트
      </text>
      <text x={60} y={160} fontFamily={PEN} fontSize={44} fill={INK} opacity={0.75}>
        의정부의 염원을 싣고 · 크레용 그림책
      </text>

      {/* 키 안내선 */}
      {[
        {y: FLOOR - 806 * 0.95, t: '아빠'},
        {y: FLOOR - 670 * 0.95, t: '할머니'},
        {y: FLOOR - 375 * 0.95, t: '하린 ≈ 아빠 허리'},
      ].map((g, i) => (
        <g key={i} opacity={0.5}>
          <line x1={40} x2={1040} y1={g.y} y2={g.y} stroke={DAWN.pale} strokeWidth={2} strokeDasharray="10 10" />
          <text x={40} y={g.y - 8} fontFamily={GOWUN} fontSize={22} fill={DAWN.mid}>
            {g.t}
          </text>
        </g>
      ))}
      <Rough boil="bg" shape={line(30, FLOOR + 4, 1050, FLOOR - 2)} seed={3} o={{strokeWidth: 5, stroke: DAY.amber}} />

      {/* 라인업 */}
      <Harin x={185} y={FLOOR} scale={0.95} pose={{armL: 14, armR: 14}} />
      <Grandma x={480} y={FLOOR} scale={0.95} pose={{handL: [470, FLOOR - 370], handR: [492, FLOOR - 370]}} />
      <Dad x={800} y={FLOOR} scale={0.95} pose={{armR: 4, briefcase: true, mouth: 'flat'}} />

      <Label x={185} y={FLOOR + 56} title="하린 (7세)" sub={['양갈래·분홍 머리끈', '노란 점퍼·분홍 끈 운동화']} />
      <Label x={480} y={FLOOR + 56} title="할머니 (70대)" sub={['은발 쪽머리·돋보기 안경', '연갈색 카디건']} />
      <Label x={800} y={FLOOR + 56} title="아빠 (30대 후반)" sub={['남색 코트·풀린 넥타이', '낡은 서류가방·눈 밑 그늘']} />

      {/* 표정 */}
      <line x1={40} x2={1040} y1={1270} y2={1270} stroke={INK} strokeWidth={2} opacity={0.25} />
      {HARIN_EXPR.map((e, i) => {
        const cx = 150 + i * 240;
        return (
          <g key={`h${i}`}>
            <g transform={`translate(${cx} 1380) scale(0.62)`}>
              <HarinHead cx={0} cy={0} eyes={e.eyes} mouth={e.mouth} look={e.look} seed={140 + i * 10} />
            </g>
            <text x={cx} y={1462} textAnchor="middle" fontFamily={GOWUN} fontSize={24} fill={INK}>
              {e.label}
            </text>
          </g>
        );
      })}
      {DAD_EXPR.map((e, i) => {
        const cx = 150 + i * 240;
        return (
          <g key={`d${i}`}>
            <g transform={`translate(${cx} 1580) scale(0.6)`}>
              <DadHead cx={0} cy={0} eyes={e.eyes} mouth={e.mouth} tearful={e.tearful} seed={560 + i * 10} />
            </g>
            <text x={cx} y={1666} textAnchor="middle" fontFamily={GOWUN} fontSize={24} fill={INK}>
              {e.label}
            </text>
          </g>
        );
      })}
      {GRANDMA_EXPR.map((e, i) => {
        const cx = 150 + i * 240;
        return (
          <g key={`g${i}`}>
            <g transform={`translate(${cx} 1790) scale(0.6)`}>
              <GrandmaHead cx={0} cy={0} eyes={e.eyes} mouth={e.mouth} seed={860 + i * 10} />
            </g>
            <text x={cx} y={1870} textAnchor="middle" fontFamily={GOWUN} fontSize={24} fill={INK}>
              {e.label}
            </text>
          </g>
        );
      })}
      <text x={870} y={1800} textAnchor="middle" fontFamily={PEN} fontSize={34} fill={INK} opacity={0.7}>
        <tspan x={870} dy={0}>분홍은 하린과</tspan>
        <tspan x={870} dy={40}>8호선에게만</tspan>
      </text>
    </Stage>
  </AbsoluteFill>
);
