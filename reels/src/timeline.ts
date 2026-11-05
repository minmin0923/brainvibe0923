// 영상·음악 공통 타임라인. 모든 시각은 여기서 한 번만 정의한다.
// 72BPM 4/4 → 1박 25프레임, 1마디 100프레임(3.333초), 18마디 = 1800프레임 = 60초.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const BEAT = 25;
export const BAR = 100;
export const TOTAL = 1800;

/** 초 → 프레임 */
export const sec = (s: number) => Math.round(s * FPS);
/** 마디 번호(1부터) → 시작 프레임 */
export const bar = (n: number) => (n - 1) * BAR;

export type SceneId =
  | 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07'
  | 'S08' | 'S09' | 'S10' | 'S11' | 'S12' | 'S13' | 'S14';

/** 각 장면의 [시작, 끝) 프레임 */
export const SCENES: Record<SceneId, {from: number; to: number}> = {
  S01: {from: bar(1), to: bar(2)}, // 0:00.0
  S02: {from: bar(2), to: bar(3)}, // 0:03.3
  S03: {from: bar(3), to: bar(4)}, // 0:06.7
  S04: {from: bar(4), to: bar(6)}, // 0:10.0 (A 300–400, B 400–500)
  S05: {from: bar(6), to: bar(7)}, // 0:16.7
  S06: {from: bar(7), to: bar(8)}, // 0:20.0
  S07: {from: bar(8), to: bar(9)}, // 0:23.3
  S08: {from: bar(9), to: bar(10)}, // 0:26.7
  S09: {from: bar(10), to: bar(11)}, // 0:30.0
  S10: {from: bar(11), to: sec(38.5)}, // 0:33.3–0:38.5
  S11: {from: sec(38.5), to: bar(13)}, // 0:38.5–0:40.0 정적
  S12: {from: bar(13), to: bar(15)}, // 0:40.0–0:46.7 하린의 말
  S13: {from: bar(15), to: bar(17)}, // 0:46.7–0:53.3 클라이맥스
  S14: {from: bar(17), to: TOTAL}, // 0:53.3–1:00.0 엔딩
};

/** 장면 내부 분할 지점(절대 프레임) */
export const SUB = {
  S04B: sec(13.3333), // 400
  S13B: bar(16), // 1500
  S14B: bar(18), // 1700
};

/** 1초 디졸브 (컷 지점을 중심으로 앞뒤 15프레임) */
export const DISSOLVE = 30;
export const DISSOLVES = [SCENES.S05.from, SCENES.S10.from];

/** 음악·효과음이 함께 쓰는 이벤트 시각(절대 프레임) */
export const EVENTS = {
  hookCaption: 0,
  harinLine: sec(1.5),
  phoneBuzz: [SCENES.S02.from + 8, SCENES.S02.from + 26],
  pianoFirstNote: SCENES.S02.from,
  doorClunk: SCENES.S03.to - sec(0.2), // J컷: 컷 0.2초 전
  subwayDoor: SCENES.S04.from,
  arpeggioStart: SUB.S04B,
  themeIn: SCENES.S05.from,
  // 첼레스타(하린 모티프) 딱 4번: ① S5 하린의 손이 그림을 그릴 때 ② S11 정적이 끝나는 순간(마이크 앞)
  // ③ S8 하린이 버스 유리에 손바닥을 댈 때 ④ S14B 그림 속 지하철이 움직이기 시작할 때
  celesta: [SCENES.S05.from + 66, SCENES.S08.from + 48, bar(13), SUB.S14B + 8],
  stringsIn: SCENES.S07.from,
  glassTap: SCENES.S08.from + 48,
  candleSpread: SCENES.S10.from + 10,
  stringsFadeOut: sec(36.6667),
  silenceFrom: sec(38.5),
  silenceTo: bar(13),
  speech: [sec(40.3), sec(42.0), sec(43.8), sec(45.2)],
  dadInsert: [sec(44.0), sec(44.5)],
  applause: SCENES.S13.from,
  climaxCut: bar(17),
  trainArrive: SUB.S14B + 20,
  trainStop: SUB.S14B + 62,
  endTitle: sec(57.5),
  endSub: sec(58.6),
  holdFrom: TOTAL - sec(0.6),
} as const;
