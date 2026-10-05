// 영상 타임라인에 맞춘 배경음과 효과음을 직접 합성해 WAV로 저장한다.
import fs from 'node:fs';
const SR = 44100, DUR = 20.5, N = Math.round(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function add(t0, len, fn, gain = 1, pan = 0) {
  const s0 = Math.round(t0 * SR), n = Math.round(len * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n && s0 + i < N; i++) { const v = fn(i / SR); L[s0 + i] += v * gl; R[s0 + i] += v * gr; }
}
const pluck = (t, m, g = 0.18, pan = 0) => add(t, 1.2, x => {
  const f = hz(m), e = Math.exp(-x * 6) * Math.min(1, x * 400);
  return e * (Math.sin(2 * Math.PI * f * x) + 0.35 * Math.sin(4 * Math.PI * f * x) * Math.exp(-x * 10));
}, g, pan);
const kick = (t, g = 0.5) => add(t, 0.35, x => Math.sin(2 * Math.PI * (45 + 90 * Math.exp(-x * 30)) * x) * Math.exp(-x * 12), g);
const tick = (t, g = 0.08, f = 3200) => add(t, 0.05, x => Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 120), g);
const hat = (t, g = 0.03) => add(t, 0.06, x => rnd() * Math.exp(-x * 90), g);
function whoosh(t, len = 0.5, g = 0.16) {
  let y = 0;
  add(t - len * 0.8, len, x => { const p = x / len, c = 0.02 + 0.25 * Math.sin(Math.PI * p); y += c * (rnd() - y); return y * Math.sin(Math.PI * p); }, g * 3);
}
function pad(t, len, notes, g = 0.05) {
  add(t, len, x => {
    const e = Math.min(1, x / 0.6) * Math.min(1, (len - x) / 0.8);
    let v = 0; for (const m of notes) { const f = hz(m); v += Math.sin(2 * Math.PI * f * x) + 0.5 * Math.sin(2 * Math.PI * f * 1.004 * x + 1); }
    return e * v / notes.length;
  }, g);
}

// 배경 화음 (C - Am - F - G - C)
pad(0, 2.8, [48, 55, 64, 71]);
pad(2.6, 3.5, [45, 52, 60, 67]);
pad(5.95, 3.7, [41, 48, 57, 64]);
pad(9.55, 3.5, [43, 50, 59, 62]);
pad(12.95, 3.6, [45, 52, 60, 64]);
pad(16.4, 4.1, [48, 55, 64, 67, 72], 0.06);

// 리듬 (브랜드 등장부터 CTA 직전까지)
for (let t = 2.6; t < 16.3; t += 0.5) { kick(t, 0.32); hat(t + 0.25); }
for (let t = 16.9; t < 19.0; t += 0.5) { kick(t, 0.36); hat(t + 0.25, 0.035); }

// 효과음
[0.25, 0.55, 0.75].forEach((t, i) => pluck(t, [72, 74, 76][i], 0.14));
tick(1.2, 0.06, 2400);
[2.6, 5.95, 9.55, 12.95].forEach(t => whoosh(t));
whoosh(16.45, 0.7, 0.22);
[3.0, 3.12, 3.24, 3.36, 3.48, 3.6, 3.72].forEach((t, i) => pluck(t + 0.2, [72, 74, 76, 79, 81, 84, 86][i], 0.12, i % 2 ? 0.4 : -0.4));
[60, 64, 67, 72].forEach(m => pluck(4.05, m, 0.12));
pluck(6.2, 69, 0.13); pluck(6.45, 72, 0.13);
kick(8.0, 0.7); [72, 76, 79].forEach(m => pluck(8.0, m, 0.12));
for (let k = 0; k < 48; k += 4) tick(10.3 + k * 0.022, 0.05, 2600 + k * 30);
pluck(10.05, 76, 0.13);
pluck(13.2, 72, 0.13); pluck(13.45, 76, 0.13);
[0, 1, 2, 3].forEach(c => pluck(14.0 + c * 0.6, [67, 69, 72, 74][c], 0.12));
[16.9, 17.05, 17.2].forEach((t, i) => pluck(t, [76, 79, 84][i], 0.12));
pluck(18.25, 72, 0.12);
tick(19.17, 0.25, 1800); [72, 76, 79, 84].forEach(m => pluck(19.2, m, 0.12));
for (let i = 0; i < 7; i++) tick(19.6 + i * 0.07, 0.04, 4200);

// 마무리: 끝 0.4초 페이드아웃, 정규화 후 16bit WAV
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = 0.89 / peak, buf = Buffer.alloc(44 + N * 4);
for (let i = 0; i < N; i++) {
  const f = Math.min(1, (N - i) / (0.4 * SR)) * norm;
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * f) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * f) * 32767), 46 + i * 4);
}
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/audio.wav', buf);
console.log('wrote out/audio.wav');
