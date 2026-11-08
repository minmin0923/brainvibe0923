import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

// Pretendard Variable을 한 번 불러오고, 글꼴이 준비될 때까지 렌더를 멈춘다.
let loaded: Promise<void> | null = null;
const load = () => {
  if (!loaded) {
    const face = new FontFace('Pretendard Variable', `url(${staticFile('fonts/PretendardVariable.woff2')}) format('woff2')`, {
      weight: '45 920',
    });
    loaded = face.load().then((f) => {
      document.fonts.add(f);
    });
  }
  return loaded;
};

export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender('load Pretendard'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    load().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready ? <>{children}</> : null;
};
