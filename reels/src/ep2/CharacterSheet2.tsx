import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Paper, Stage, Wash} from '../lib/paper';
import {Rough, line} from '../lib/rough';
import {DAY, DAWN, EP2, INK} from '../lib/palette';
import {GOWUN, PEN} from '../lib/Caption';
import {Dad, DadHead} from '../chars/Dad';
import {Mom, MomHead} from '../chars/Mom';
import {Harin} from '../chars/Harin';
import {Cold} from './lib/Props';

const FLOOR = 1060;
const Label: React.FC<{x: number; y: number; title: string; sub: string[]}> = ({x, y, title, sub}) => (
  <g>
    <text x={x} y={y} textAnchor="middle" fontFamily={GOWUN} fontSize={34} fill={INK}>{title}</text>
    {sub.map((l, i) => (
      <text key={i} x={x} y={y + 36 + i * 28} textAnchor="middle" fontFamily={GOWUN} fontSize={21} fill={INK} opacity={0.75}>{l}</text>
    ))}
  </g>
);

/** 2탄 캐릭터 시트: 아빠(출근·퇴근), 엄마(신규), 하린 */
export const CharacterSheet2: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <Wash blobs={[{x: 200, y: 700, r: 360, color: EP2.office, o: 0.6}, {x: 820, y: 700, r: 380, color: DAY.sun, o: 0.5}]} blur={80} />
    <Stage>
      <text x={60} y={110} fontFamily={GOWUN} fontSize={54} fill={INK}>캐릭터 시트 · 2탄</text>
      <text x={60} y={160} fontFamily={PEN} fontSize={44} fill={INK} opacity={0.75}>다녀올게, 다녀왔어</text>
      <Rough boil="bg" shape={line(30, FLOOR + 4, 1050, FLOOR - 2)} seed={3} o={{strokeWidth: 5, stroke: DAY.amber}} />
      <Cold>
        <Dad x={150} y={FLOOR} scale={0.82} version="out" tone="cold" pose={{briefcase: true, mouth: 'flat'}} />
      </Cold>
      <Dad x={420} y={FLOOR} scale={0.82} version="home" tone="warm" pose={{armL: 10, mouth: 'smile'}} />
      <Mom x={680} y={FLOOR} scale={0.92} pose={{handL: [670, FLOOR - 400], handR: [700, FLOOR - 400]}} />
      <Harin x={900} y={FLOOR} scale={0.92} pose={{armL: 14, armR: 14}} />
      <Label x={150} y={FLOOR + 54} title="아빠 · 출근" sub={['넥타이 단정·머리 정돈', '바깥: 차가운 톤']} />
      <Label x={420} y={FLOOR + 54} title="아빠 · 퇴근" sub={['넥타이 느슨·앞머리 흐트러짐', '어깨 구겨짐·그늘 선 2개']} />
      <Label x={680} y={FLOOR + 54} title="엄마 (신규)" sub={['단발 + 갈색 집게핀', '세이지 그린 니트·베이지 앞치마']} />
      <Label x={900} y={FLOOR + 54} title="하린 (7세)" sub={['1탄과 동일', '집에서는 노란 잠옷']} />
      <line x1={40} x2={1040} y1={1250} y2={1250} stroke={INK} strokeWidth={2} opacity={0.25} />
      {/* 표정 */}
      <Cold>
        <g transform="translate(150 1390) scale(0.6)"><DadHead cx={0} cy={0} version="out" tone="cold" mouth="flat" /></g>
      </Cold>
      <g transform="translate(390 1390) scale(0.6)"><DadHead cx={0} cy={0} version="home" tone="warm" mouth="sad" /></g>
      <g transform="translate(630 1390) scale(0.6)"><DadHead cx={0} cy={0} version="home" tone="warm" mouth="flat" welling={1} /></g>
      <g transform="translate(870 1390) scale(0.6)"><MomHead cx={0} cy={0} eyes="tired" mouth="smile" /></g>
      {['출근길(창백)', '퇴근길', '그림을 본 뒤', '엄마 · 지친 미소'].map((t, i) => (
        <text key={i} x={150 + i * 240} y={1490} textAnchor="middle" fontFamily={GOWUN} fontSize={24} fill={INK}>{t}</text>
      ))}
      <text x={540} y={1600} textAnchor="middle" fontFamily={PEN} fontSize={40} fill={DAWN.mid}>바깥은 차갑게, 따뜻한 색은 집에만 · 분홍은 하린과 8호선에게만</text>
    </Stage>
  </AbsoluteFill>
);
