import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import manifest from './fonts.json';

/**
 * Gowun Dodum / Nanum Pen Script (Google Fonts).
 * scripts/fetch-fonts.ts가 @remotion/google-fonts 정보로 필요한 조각만 public/fonts에 받아 둔다.
 */
for (const f of manifest) {
  loadFont({family: f.family, url: staticFile(`fonts/${f.file}`), weight: '400', unicodeRange: f.unicodeRange});
}

export const GOWUN = "'Gowun Dodum'";
export const PEN = "'Nanum Pen Script'";
