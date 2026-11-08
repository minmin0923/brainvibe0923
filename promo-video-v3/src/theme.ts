// 영상 전용 팔레트(v2에서 사용자 확정) + 글꼴. 모든 장면은 여기 값만 쓴다.
export const C = {
  bg: '#F4FAF6',
  card: '#FFFFFF',
  line: '#DCE9E1',
  map: '#E9F4EE',
  river: '#CDEBDD',
  ink: '#0E1A14',
  muted: '#4C5B53',
  green: '#00A86B',
  greenInk: '#00804F',
  greenDeep: '#00804F',
  yellow: '#FFD43B',
};

export const FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif';

export const W = 1080;
export const H = 1920;

const rgbOf = (hex: string) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};
export const alpha = (hex: string, a: number) => `rgba(${rgbOf(hex)},${a})`;
