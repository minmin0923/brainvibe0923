// src/ep2/timeline.ts → music/ep2_timeline.json (2탄 음악 스크립트용)
import {writeFileSync} from 'node:fs';
import {BAR, BEAT, DISSOLVES, EVENTS, FPS, SCENES, SUB, TIMER, TOTAL} from '../src/ep2/timeline';

writeFileSync('music/ep2_timeline.json', JSON.stringify({fps: FPS, total: TOTAL, beat: BEAT, bar: BAR, bpm: 72, scenes: SCENES, sub: SUB, dissolves: DISSOLVES, timer: TIMER, events: EVENTS}, null, 2));
console.log('music/ep2_timeline.json written');
