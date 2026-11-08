// 이 영상만을 위한 악보. 시간표는 src/timeline.ts 와 같다(120 BPM, 1마디 = 2초 = 60f).
// 장면 시작(초): hook 0, brand 3.0, unlock 6.5, everyone 11.5, map 15.0, grow 20.0, outro 24.0
window.SCORE_DEF = {
  dur: 30, bpm: 120, kit: 'electro', harmony: 'bright', key: 2, gain: 0.9, sfxGain: 0.85,
  sections: [
    [0, 1, ['padSoft', 'kick2', 'hat8']],
    [1, 2, ['padSoft', 'kick2', 'hat8', 'bassHalf']],
    [2, 3, ['pad', 'kick4', 'hat8', 'bassHalf']],
    [3, 5, ['pad', 'kick4', 'hat8', 'bass8']],
    [5, 7, ['pad', 'kick4', 'hat8', 'bass8', 'clap', 'pluck']],
    [7, 11, ['pad', 'kick4', 'hat16', 'bass8', 'clap', 'lead']],
    [11, 12, []],                                               // 브레이크: 크레인 업 후반, 효과음만
    [12, 15, ['pad', 'kick4', 'hat16', 'bass8', 'clap', 'lead', 'crash']],
  ],
  // [초, 효과음] — 화면 동작 하나에 소리 하나
  events: [
    [0.0, 'thud'], [0.42, 'swish'], [1.08, 'clack'], [2.62, 'whooshOut'],
    [3.03, 'swish'], [3.35, 'tick'], [3.55, 'tick'], [3.75, 'tick'], [4.02, 'click'], [4.14, 'click'], [4.26, 'click'], [4.38, 'click'], [6.25, 'whoosh'],
    [6.6, 'tick'], [6.95, 'tick'], [7.3, 'tick'], [8.1, 'whooshIn'], [8.45, 'ding'], [9.63, 'thud'],
    [11.53, 'whoosh'], [11.66, 'tick'], [13.4, 'swish'],
    [15.02, 'swish'], [15.4, 'switch'], [16.1, 'switch'], [16.8, 'switch'], [17.5, 'switch'], [18.2, 'clack'], [18.4, 'swish'],
    [20.47, 'whooshOut'], [20.75, 'tick'], [23.27, 'ding'],
    [24.13, 'whoosh'], [24.43, 'swish'], [24.73, 'whoosh'], [25.27, 'thud'], [25.93, 'ding'],
    [26.93, 'swish'], [27.33, 'click'], [27.43, 'click'], [27.53, 'click'], [27.63, 'click'], [27.73, 'click'], [27.83, 'click'], [27.93, 'click'],
    [28.2, 'whooshIn'], [28.67, 'clack'],
  ],
  cues: [3.0, 6.5, 11.5, 15.0, 20.0, 24.0],
};
