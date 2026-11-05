// 지시서 2장 팔레트. 이 파일에 없는 색은 쓰지 않는다.
export const INK = '#3A3346'; // 손그림 선
export const PAPER = '#FBF6EC'; // 종이
export const WHITE = '#FFFFFF'; // 자막 전용

export const DAWN = {deep: '#1E2A44', mid: '#3B4A6B', pale: '#8FA3C7', lamp: '#F6C77A'};
export const DAY = {cream: '#F7EBD7', sand: '#F4D9B0', amber: '#E9A86B', sun: '#FFE2A8'};
export const PLAZA = {night: '#22264F', violet: '#4B4A86', shadow: '#2E2B45', flame: '#FFB45A', halo: '#FFD9A0'};
export const HOME = {night: '#1B2233', slate: '#2D3850', phone: '#A9C1FF'};
/** 분홍은 8호선과 하린에게만 */
export const PINK = {line8: '#E8508A', crayon: '#F07AAE'};

// 팔레트 안에서 고른 캐릭터 색 대응표
export const SKIN = DAY.sand; // 피부
export const HAIR = INK; // 검은 머리
export const BLUSH_OTHER = DAY.amber; // 하린이 아닌 인물의 볼터치(분홍 금지)
export const JUMPER = DAWN.lamp; // 하린의 노란 점퍼
export const COAT = DAWN.mid; // 아빠 남색 코트
export const COAT_DARK = DAWN.deep;
export const CARDIGAN = DAY.amber; // 할머니 연갈색 카디건
export const SILVER = DAWN.pale; // 은발
