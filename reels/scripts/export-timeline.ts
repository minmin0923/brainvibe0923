// timeline.ts → music/timeline.json (Python 음악 스크립트가 같은 시각을 쓰도록)
import {writeFileSync} from 'node:fs';
import {BAR, BEAT, DISSOLVE, DISSOLVES, EVENTS, FPS, SCENES, SUB, TOTAL} from '../src/timeline';

const json = {fps: FPS, total: TOTAL, beat: BEAT, bar: BAR, bpm: 72, scenes: SCENES, sub: SUB, dissolve: DISSOLVE, dissolves: DISSOLVES, events: EVENTS};
writeFileSync('music/timeline.json', JSON.stringify(json, null, 2));
console.log('music/timeline.json written');
