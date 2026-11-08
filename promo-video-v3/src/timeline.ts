// 시간표의 단일 출처. 장면 길이, 음악 BPM, 효과음 시점이 모두 여기서 나온다.
export const FPS = 30;
export const BPM = 120;
export const BEAT = (FPS * 60) / BPM; // 15f
export const beatF = (n: number) => n * BEAT;

export const SHOTS = {
  hook: { from: 0, duration: 90 },
  brand: { from: 90, duration: 105 },
  unlock: { from: 195, duration: 150 },
  everyone: { from: 345, duration: 105 },
  map: { from: 450, duration: 150 },
  grow: { from: 600, duration: 120 },
  outro: { from: 720, duration: 180 },
} as const;

export const TOTAL = SHOTS.outro.from + SHOTS.outro.duration; // 900f = 30s

// 장면 경계(초). soundtrack sync-check에 쓰는 cue 목록.
export const CUES = Object.values(SHOTS).slice(1).map((s) => s.from / FPS);
