// groove 악보를 OfflineAudioContext로 렌더해 public/audio/score.wav(BGM+효과음)와 sfx-only.wav(효과음만)를 만든다.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const groove = fs.readFileSync(path.join(dir, 'groove.js'), 'utf8');
const def = fs.readFileSync(path.join(dir, 'score-def.js'), 'utf8');
// 브라우저 경로를 직접 줄 수 있다(클라우드 세션: 미리 설치된 Chromium)
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
await page.addScriptTag({ content: groove + '\nwindow.buildGroove = buildGroove;\n' + def });
for (const [name, withBgm] of [['score', true], ['sfx-only', false]]) {
  const b64 = await page.evaluate(async (withBgm) => {
    const d = window.SCORE_DEF, SR = 48000;
    const ac = new OfflineAudioContext(2, Math.ceil(SR * d.dur), SR);
    window.buildGroove(ac, { ...d, sections: withBgm ? d.sections : [] });
    const buf = await ac.startRendering();
    const n = buf.length, ch = [buf.getChannelData(0), buf.getChannelData(1)];
    const out = new DataView(new ArrayBuffer(44 + n * 4));
    const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true);
    out.setUint32(24, SR, true); out.setUint32(28, SR * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) out.setInt16(44 + i * 4 + c * 2, Math.max(-1, Math.min(1, ch[c][i])) * 32767, true);
    let s = ''; const u = new Uint8Array(out.buffer); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode(...u.subarray(i, i + 32768));
    return btoa(s);
  }, withBgm);
  const file = path.join(dir, '..', 'public', 'audio', `${name}.wav`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  console.log('wrote', file);
}
const cues = await page.evaluate(() => window.SCORE_DEF.cues);
fs.writeFileSync(path.join(dir, '..', 'out', 'promo.cues.json'), JSON.stringify(cues));
await browser.close();
