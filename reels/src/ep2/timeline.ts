// 2탄 「다녀올게, 다녀왔어」 타임라인. 1탄과 같은 72BPM·1마디 100프레임·18마디.
import {BAR, BEAT, FPS, HEIGHT, TOTAL, WIDTH, bar, sec} from '../timeline';
export {BAR, BEAT, FPS, HEIGHT, TOTAL, WIDTH, bar, sec};
import {EVENTS as EP1} from '../timeline';

export type SceneId =
  | 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07' | 'S08'
  | 'S09' | 'S10' | 'S11' | 'S12' | 'S13' | 'S14' | 'S15';

export const SCENES: Record<SceneId, {from: number; to: number}> = {
  S01: {from: bar(1), to: bar(2)}, // 0:00 잠금화면
  S02: {from: bar(2), to: bar(3)}, // 0:03.3 다녀올게
  S03: {from: bar(3), to: bar(4)}, // 0:06.7 첫차
  S04: {from: bar(4), to: bar(5)}, // 0:10.0 서서 가는 1호선
  S05: {from: bar(5), to: bar(6)}, // 0:13.3 환승 계단 / 게이트
  S06: {from: bar(6), to: bar(7)}, // 0:16.7 하루가 지나간 창
  S07: {from: bar(7), to: bar(8)}, // 0:20.0 퇴근 1호선
  S08: {from: bar(8), to: bar(9)}, // 0:23.3 엄마의 저녁
  S09: {from: bar(9), to: bar(10)}, // 0:26.7 놓친 버스
  S10: {from: bar(10), to: bar(11)}, // 0:30.0 같은 시각, 다른 자리
  S11: {from: bar(11), to: bar(12)}, // 0:33.3 기다리다 잠든 아이
  S12: {from: bar(12), to: bar(13)}, // 0:36.7 21:46
  S13: {from: bar(13), to: bar(15)}, // 0:40.0 다녀왔어
  S14: {from: bar(15), to: bar(17)}, // 0:46.7 그래서 우리는
  S15: {from: bar(17), to: TOTAL}, // 0:53.3 시리즈 엔딩
};

/** 장면 내부 분할(절대 프레임) */
export const SUB = {
  S05B: sec(15.3), // 459
  S06B: sec(18.7), // 561
  S09B: bar(9) + 35,
  S12B: sec(38.5), // 1155
  S13B: sec(41.7), // 1251
  S13C: sec(43.3), // 1299
  S13D: sec(45.0), // 1350
  S14B: bar(16), // 1500
  S15B: bar(18), // 1700
};

export const DISSOLVE = 30;
/** 1초 디졸브: S11→S12, S14→S15 */
export const DISSOLVES = [SCENES.S12.from, SCENES.S15.from];

/** 길 위의 시간(분). [프레임, 분] 구간을 선형으로 잇는다 */
export const TIMER = {
  morning: [
    [190, 0],
    [SCENES.S03.to, 18],
    [SCENES.S04.to, 65],
    [470, 92],
  ] as [number, number][],
  evening: [
    [SCENES.S07.from, 0],
    [SCENES.S07.to, 41],
    [SCENES.S09.from, 41],
    [SCENES.S09.to, 72],
    [SCENES.S10.to, 90],
    [SCENES.S12.from, 90],
    [SCENES.S12.from + 18, 108],
  ] as [number, number][],
  morningStop: 470,
  eveningStop: SCENES.S12.from + 18, // 1118
  merge: sec(37.5), // 1125
  hide: sec(39.5), // 1185
};

export const EVENTS = {
  phoneBuzz: [8, 26],
  swipe: 56,
  screenOff: 70,
  dadMotif: [SCENES.S02.from + 10, SCENES.S09.from + 50, SUB.S13B + 20],
  doorClunk: 190,
  busArrive: SCENES.S03.from + 30,
  busDoor: SCENES.S03.from + 76,
  railFrom: SCENES.S04.from,
  wakeJolt: SCENES.S04.from + 62,
  gateBeep: 470,
  msgIn: SUB.S06B + 4,
  msgSend: SUB.S06B + 32,
  harinVideoNote: SCENES.S07.from + 12,
  trainHalt: sec(22.3), // 669
  bowls: [SCENES.S08.from + 18, SCENES.S08.from + 38, SCENES.S08.from + 58],
  busLeaves: SUB.S09B + 6, // 841 음악 하드 스톱
  breathPuffs: [SUB.S09B + 16, SUB.S09B + 34, SUB.S09B + 52],
  stoveIgnite: SCENES.S10.from + 24,
  dadSend: SCENES.S10.from + 74,
  momBuzz: SCENES.S10.from + 78,
  celesta: [SCENES.S11.from + 10, SUB.S13C + 6, EP1.celesta[3]],
  tvOff: SCENES.S11.from + 52,
  elevatorDing: SCENES.S12.from + 2,
  silenceFrom: sec(38.5),
  silenceTo: bar(13),
  lockBeeps: [sec(38.5) + 6, sec(38.5) + 13, sec(38.5) + 20, sec(38.5) + 27],
  doorOpen: sec(38.5) + 33,
  momWake: SCENES.S13.from + 12,
  dadSays: SUB.S13B + 10,
  pencil: [SCENES.S14.from + 6, SCENES.S14.from + 70],
  climaxFadeFrom: SCENES.S15.from,
  // 시리즈 엔딩: 1탄과 같은 프레임(같은 소리·같은 움직임)
  trainMoveFrom: EP1.celesta[3] - 2,
  trainArrive: EP1.trainArrive,
  trainStop: EP1.trainStop,
  dollOut: EP1.trainStop + 2,
  dollIn: EP1.trainStop + 12,
  windowOn: EP1.trainStop + 13,
  seatFill: EP1.trainStop + 16,
  endTitle: sec(57.0),
  endEp1: sec(58.2),
  endSub: sec(58.8),
  holdFrom: EP1.holdFrom,
} as const;
