// 본편(Reels)의 지정 프레임들을 한 번의 번들로 스틸 렌더한다.
// 사용: npx tsx scripts/stills.ts out/keyframes 45 450 ...
import path from 'node:path';
import {mkdirSync} from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [outDir, ...frames] = process.argv.slice(2);
const compId = process.env.COMP ?? 'Reels';
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';

const main = async () => {
  mkdirSync(outDir, {recursive: true});
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
  const composition = await selectComposition({serveUrl, id: compId, browserExecutable});
  for (const f of frames.map(Number)) {
    const s = (f / 30).toFixed(1).padStart(4, '0');
    const output = path.join(outDir, `${compId}_f${String(f).padStart(4, '0')}_${s}s.png`);
    await renderStill({serveUrl, composition, frame: f, output, browserExecutable, chromiumOptions: {gl: 'swangle'}, timeoutInMilliseconds: 120000});
    console.log(output);
  }
};
main();
