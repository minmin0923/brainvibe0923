// 영상에 쓰는 글자가 든 한글 글꼴 조각만 내려받아 public/fonts에 둔다.
// (렌더용 Chromium이 샌드박스 프록시 인증서를 믿지 않아서 Google Fonts를 직접 못 받는다)
import {execFileSync} from 'node:child_process';
import {writeFileSync, mkdirSync} from 'node:fs';
import {getInfo as gowun} from '@remotion/google-fonts/GowunDodum';
import {getInfo as pen} from '@remotion/google-fonts/NanumPenScript';
import {ALL_TEXT} from '../src/lib/copy';
import {neededSubsets} from '../src/lib/subsets';

mkdirSync('public/fonts', {recursive: true});
const manifest: {family: string; file: string; unicodeRange: string}[] = [];
for (const [info, slug] of [[gowun(), 'gowun'], [pen(), 'pen']] as const) {
  const ranges = info.unicodeRanges as Record<string, string>;
  const fonts = (info.fonts as any).normal['400'] as Record<string, string>;
  for (const key of neededSubsets(ranges, ALL_TEXT)) {
    const file = `${slug}-${key.replace(/[\[\]]/g, '')}.woff2`;
    execFileSync('curl', ['-sSfL', '-o', `public/fonts/${file}`, fonts[key]]);
    manifest.push({family: info.fontFamily, file, unicodeRange: ranges[key]});
  }
}
writeFileSync('src/lib/fonts.json', JSON.stringify(manifest, null, 1));
console.log(`fonts: ${manifest.length} files`);
