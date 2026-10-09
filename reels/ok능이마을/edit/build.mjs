// 사용법: node build.mjs [cuts.json]
// cuts.json의 컷을 잘라 9:16으로 맞추고, 자막을 입히고, 혜택지도 엔딩카드를 붙여 out/OK능이마을_릴스.mp4를 만든다.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cfgPath = path.resolve(dir, process.argv[2] || 'cuts.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const rel = p => path.resolve(path.dirname(cfgPath), p);
const out = path.join(dir, 'out'), tmp = path.join(out, 'tmp');
fs.mkdirSync(tmp, { recursive: true });

const W = 1080, H = 1920, FPS = 30;
const ff = args => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
const probe = (f, q) => execFileSync('ffprobe', ['-v', 'error', ...q, '-of', 'csv=p=0', f]).toString().trim();
const hasAudio = f => probe(f, ['-select_streams', 'a', '-show_entries', 'stream=index']) !== '';
const ENC = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-crf', '18', '-preset', 'medium', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '192k'];

// 1) 컷마다 잘라서 1080x1920 30fps로 맞춘다 (가로 영상은 가운데를 잘라 세로로)
const missing = cfg.cuts.map(c => c.file).filter((f, i, a) => a.indexOf(f) === i && !fs.existsSync(path.join(rel(cfg.clipsDir), f)));
if (missing.length) { console.error('clips 폴더에 없는 파일:', missing.join(', ')); process.exit(1); }

const segs = [];
let t = 0;
const timeline = [];
cfg.cuts.forEach((c, i) => {
  const src = path.join(rel(cfg.clipsDir), c.file), sp = c.speed || 1, srcDur = c.dur * sp;
  const seg = path.join(tmp, `seg${String(i).padStart(2, '0')}.mp4`);
  const vf = [`setpts=(PTS-STARTPTS)/${sp}`, `scale=${W}:${H}:force_original_aspect_ratio=increase`, `crop=${W}:${H}`, 'setsar=1', `fps=${FPS}`];
  if (cfg.warm) vf.push('eq=saturation=1.1:contrast=1.03', 'colorbalance=rs=0.03:bs=-0.03:rm=0.02:bm=-0.02');
  const inputs = ['-ss', String(c.in), '-t', String(srcDur), '-i', src];
  let af;
  if (hasAudio(src)) {
    af = ['-af', `${sp !== 1 ? `atempo=${sp},` : ''}apad,atrim=0:${c.dur},asetpts=PTS-STARTPTS`];
  } else {
    inputs.push('-f', 'lavfi', '-t', String(c.dur), '-i', 'anullsrc=r=48000:cl=stereo');
    af = ['-map', '0:v', '-map', '1:a'];
  }
  ff([...inputs, '-vf', vf.join(','), ...af, '-t', String(c.dur), ...ENC, seg]);
  segs.push(seg);
  timeline.push({ start: t, cut: c });
  t += c.dur;
});
const bodyDur = t;

// 2) 자막(ASS). 역할마다 스타일 하나. {hl}…{/hl}는 강조색.
const assColor = hex => { const h = hex.replace('#', ''); return `&H00${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase(); };
const ts = s => { const cs = Math.round(s * 100); return `${Math.floor(cs / 360000)}:${String(Math.floor(cs / 6000) % 60).padStart(2, '0')}:${String(Math.floor(cs / 100) % 60).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`; };
const styles = Object.entries(cfg.styles).map(([n, s]) =>
  `Style: ${n},${s.font},${s.size},${assColor(s.color)},&H000000FF,${assColor(s.outline)},&H64000000,0,0,0,0,100,100,0,${s.angle || 0},1,${s.outlineW},2,${s.align},60,60,${s.marginV},1`);
// 등장 효과: hook은 튀어나오기, accent는 확대, sfx는 흔들림, info는 페이드
const enter = { hook: '{\\fscx70\\fscy70\\t(0,140,\\fscx108\\fscy108)\\t(140,220,\\fscx100\\fscy100)}', accent: '{\\fscx50\\fscy50\\t(0,180,\\fscx100\\fscy100)}', sfx: '{\\t(0,80,\\frz-4)\\t(80,160,\\frz4)\\t(160,240,\\frz0)}', info: '{\\fad(120,0)}' };
const events = [];
for (const { start, cut } of timeline) {
  for (const s of cut.subs || []) {
    const st = cfg.styles[s.role], a = start + (s.at || 0), b = start + cut.dur - 0.02;
    const text = s.text.replace(/\{hl\}/g, `{\\c${assColor(st.highlight)}}`).replace(/\{\/hl\}/g, `{\\c${assColor(st.color)}}`);
    const size = s.size ? `{\\fs${s.size}}` : '';
    events.push(`Dialogue: 0,${ts(a)},${ts(b)},${s.role},,0,0,0,,${size}${enter[s.role] || ''}${text}`);
  }
}
const ass = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n${styles.join('\n')}\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${events.join('\n')}\n`;
const assPath = path.join(tmp, 'subs.ass');
fs.writeFileSync(assPath, ass);

// 3) 본편 이어 붙이고 자막 입히기
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, segs.map(s => `file '${s}'`).join('\n'));
const body = path.join(tmp, 'body.mp4');
const fontsDir = path.join(dir, 'fonts');
ff(['-f', 'concat', '-safe', '0', '-i', list, '-vf', `subtitles=${assPath}:fontsdir=${fontsDir}`, ...ENC, body]);

// 4) 엔딩카드 (무음이면 무음 트랙을 붙인다)
const endSrc = rel(cfg.endcard), end = path.join(tmp, 'end.mp4');
const endDur = parseFloat(probe(endSrc, ['-show_entries', 'format=duration']));
if (hasAudio(endSrc)) ff(['-i', endSrc, ...ENC, end]);
else ff(['-i', endSrc, '-f', 'lavfi', '-t', String(endDur), '-i', 'anullsrc=r=48000:cl=stereo', '-map', '0:v', '-map', '1:a', '-shortest', ...ENC, end]);

const joined = path.join(tmp, 'joined.mp4');
fs.writeFileSync(list, [body, end].map(s => `file '${s}'`).join('\n'));
ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', joined]);

// 5) 배경음악 (있으면): 현장음은 그대로, 음악은 작게 깔고 마지막 1초 페이드아웃
const total = bodyDur + endDur;
const final = path.join(out, 'OK능이마을_릴스.mp4');
if (cfg.bgm) {
  const v = cfg.bgmVolume ?? 0.25;
  ff(['-i', joined, '-stream_loop', '-1', '-i', rel(cfg.bgm), '-filter_complex',
    `[1:a]atrim=0:${total},volume=${v},afade=t=out:st=${total - 1}:d=1[m];[0:a][m]amix=inputs=2:duration=first:normalize=0[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final]);
} else {
  ff(['-i', joined, '-c', 'copy', '-movflags', '+faststart', final]);
}
console.log(`완성: ${final} (${total.toFixed(1)}초, 본편 ${bodyDur.toFixed(1)}초 + 엔딩 ${endDur.toFixed(1)}초)`);
