/*
 * scenes.js — 생 초보를 위한 AI 공부법
 * 세계: 밤의 종이 작업대 (storyboard.md 세계관 설정). 카메라는 #world 위를 이동하고,
 * 모든 움직임은 tl 위에서 큐 시간에 묶여 있다. onFrame은 t와 tl이 움직이는 값만 읽는다.
 */
Video.define(({ tl, cue, onFrame, rand, stage, W, H }) => {
  const $ = (s, r = stage) => r.querySelector(s);
  const $$ = (s, r = stage) => Array.from(r.querySelectorAll(s));
  const C = (id) => cue(id);
  const S = (id) => cue(id).start;

  /* ---------- 종이 텍스처 굽기 (빌드 때 한 번) ---------- */
  function noise(seed) {
    const N = 256, g = new Float32Array(N * N), r = rand(seed);
    for (let i = 0; i < N * N; i++) g[i] = r();
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const x0 = xi & 255, x1 = (xi + 1) & 255, y0 = (yi & 255) * N, y1 = ((yi + 1) & 255) * N;
      const a = g[y0 + x0], b = g[y0 + x1], c = g[y1 + x0], d = g[y1 + x1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  function paper(w, h, base, seed, o = {}) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'), im = x.createImageData(w, h), px = im.data;
    const n1 = noise(seed), n2 = noise(seed + 7), n3 = noise(seed + 13);
    const sc = o.scale || 1, rel = o.relief ?? 2.4, light = o.light || null;
    const L = [-0.5, -0.62, 0.6]; const ll = Math.hypot(...L); L[0] /= ll; L[1] /= ll; L[2] /= ll;
    const hf = (i, j) => {
      const X = i * sc, Y = j * sc;
      const f = n3(X / 1.4, Y / 26);
      return 0.5 * n1(X / 42, Y / 42) + 0.28 * n2(X / 10, Y / 10) + 0.12 * n3(X / 2.6, Y / 2.6) + 0.3 * f * f * f;
    };
    let k = 0;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++, k += 4) {
      const hx = hf(i + 1, j) - hf(i - 1, j), hy = hf(i, j + 1) - hf(i, j - 1);
      let nx = -hx * rel, ny = -hy * rel, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      let s = 0.8 + 0.34 * (nx * L[0] + ny * L[1] + nz * L[2]) - 0.2;
      if (light) { // 큰 판: 스탠드 쪽이 밝고 멀어질수록 어두움
        const dx = i / w - light[0], dy = j / h - light[1];
        s *= 1.18 - Math.min(1, Math.hypot(dx * 1.1, dy * 1.6)) * 0.62;
      }
      const fl = n2(i * sc / 0.8, j * sc / 0.8) > 0.93 ? 0.92 : 1;
      px[k] = Math.min(255, base[0] * s * fl); px[k + 1] = Math.min(255, base[1] * s * fl);
      px[k + 2] = Math.min(255, base[2] * s * fl); px[k + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return cv;
  }
  const url = (cv) => `url(${cv.toDataURL('image/png')})`;
  const tCream = paper(512, 512, [246, 234, 210], 11, { relief: 2.2 });
  const tAmber = paper(512, 512, [255, 206, 128], 23, { relief: 2.0 });
  const tTeal = paper(512, 512, [42, 92, 102], 31, { relief: 3.0 });
  const tDeep = paper(512, 512, [24, 62, 72], 37, { relief: 3.2 });
  const tWall = paper(1650, 580, [34, 82, 94], 41, { scale: 2, relief: 3.4, light: [0.12, 0.0] });
  stage.style.setProperty('--t-cream', url(tCream));
  stage.style.setProperty('--t-amber', url(tAmber));
  stage.style.setProperty('--t-wall', url(tWall));
  $('#wall').style.backgroundImage = url(tWall);

  /* ---------- 먼 종이 원판 (시차 0.45) ---------- */
  const mid = $('#mid'); const rm = rand(5); const mids = [];
  for (let i = 0; i < 26; i++) {
    const d = document.createElement('div'); d.className = 'md';
    const sz = 260 + rm() * 520; d.style.width = d.style.height = sz + 'px';
    d.style.backgroundImage = url(i % 3 ? tDeep : tTeal);
    mid.appendChild(d);
    mids.push({ el: d, x: -200 + i * 470 + rm() * 200, y: (i % 2 ? -120 : 640) + rm() * 260, sz });
  }

  /* ---------- 전경 실루엣 (시차 1.7, 시그니처 전환) ---------- */
  const fore = $('#fore'); const fores = [];
  const blob = (w, h, seed, top) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d');
    const r = rand(seed); x.filter = 'blur(26px)';
    x.fillStyle = '#06161b'; x.beginPath();
    const cx = w / 2, n = 9;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI, rr = (w * 0.36) * (0.8 + r() * 0.35);
      const px = cx + Math.cos(a) * rr, py = top ? Math.sin(a) * h * 0.82 : h - Math.sin(a) * h * 0.82;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.closePath(); x.fill(); return cv;
  };
  [2180, 4600, 10300, 13300, 19200].forEach((m, i) => {
    const a = blob(900, 900, 70 + i, i % 2 === 0); a.style.opacity = 0.92;
    const b = blob(700, 760, 90 + i, i % 2 === 1); b.style.opacity = 0.85;
    fore.appendChild(a); fore.appendChild(b);
    fores.push({ el: a, m, off: -160, y: i % 2 === 0 ? -80 : 300, w: 900 });
    fores.push({ el: b, m, off: 380, y: i % 2 === 1 ? -60 : 380, w: 700 });
  });
  const foreA = { o: 1 };

  /* ---------- 실(부탁 리본): 세계를 한 줄로 꿰는 종이 띠 ---------- */
  let d = '';
  for (let x = -200; x <= 26400; x += 100) {
    const y = 948 + Math.sin(x / 900) * 16 + Math.sin(x / 2300 + 1) * 10;
    d += (d ? ' L ' : 'M ') + x + ' ' + y.toFixed(1);
  }
  const thP = $$('#thread path'); thP.forEach((p) => p.setAttribute('d', d));
  const thLen = thP[1].getTotalLength();
  thP.forEach((p) => { p.style.strokeDasharray = `${thLen} ${thLen}`; });

  /* ---------- 카메라 ---------- */
  const cam = { x: 960, y: 540, s: 1.14 }; const thr = { x: 1700 };
  let cur = { ...cam }, curT = thr.x;
  function move(pos, to, dur, ease = 'power3.inOut') {
    const next = { ...cur, ...to };
    tl.fromTo(cam, { ...cur }, { ...next, duration: dur, ease, immediateRender: false }, pos);
    const nt = Math.max(curT, (to.x ?? cur.x) + 1100);
    if (nt !== curT) tl.fromTo(thr, { x: curT }, { x: nt, duration: dur, ease, immediateRender: false }, pos);
    cur = next; curT = nt;
  }
  const lamp = $('#lamp'), cool = $('#cool');
  gsap.set(lamp, { '--lx': '16%', '--ly': '4%', '--li': 0.75 });
  gsap.set(cool, { opacity: 0 });

  /* ---------- 작은 도우미 ---------- */
  const inn = (t, pos, from = {}, dur = 0.9, ease = 'expo.out', extra = {}) =>
    tl.fromTo(t, { autoAlpha: 0, y: 40, ...from }, { autoAlpha: 1, y: 0, x: 0, scale: 1, rotation: 0, duration: dur, ease, ...extra, immediateRender: true }, pos);
  const words = (sel) => SplitText.create(sel, { type: 'words' }).words;
  const chars = (sel) => SplitText.create(sel, { type: 'chars' }).chars;
  const dim = (t, pos, a = 0.18, dur = 0.8) => tl.to(t, { autoAlpha: a, duration: dur, ease: 'power2.inOut' }, pos);
  const draw = (p, pos, dur = 1.0) => {
    const ps = typeof p === 'string' ? $$(p) : [p];
    ps.forEach((el) => tl.fromTo(el, { drawSVG: '0%' }, { drawSVG: '100%', duration: dur, ease: 'power2.inOut', immediateRender: true }, pos));
  };

  /* ===================== A · 도입 (c01–c05) ===================== */
  const scr = $('#scraps'); const r1 = rand(3); const scraps = [];
  const texs = [tCream, tCream, tCream, tAmber, tTeal];
  const tUrls = texs.map(url);
  for (let i = 0; i < 46; i++) {
    const e = document.createElement('div'); e.className = 'sc cut';
    const w = 36 + r1() * 110, h = 24 + r1() * 70; e.style.width = w + 'px'; e.style.height = h + 'px';
    e.style.backgroundImage = tUrls[i % 5];
    if (i % 5 === 3) e.style.backgroundColor = '#ffce80';
    if (i % 7 === 0) { e.style.backgroundImage = 'none'; e.style.backgroundColor = '#e8674c'; }
    scr.appendChild(e);
    let bx = 60 + r1() * 1800, by = 70 + r1() * 820;
    if (bx > 520 && bx < 1400 && by > 160 && by < 600) by = r1() < 0.5 ? 70 + r1() * 90 : 610 + r1() * 280;
    scraps.push({ e, bx, by, w, h, ph: r1() * 6.28, sp: 0.6 + r1(), rot: -30 + r1() * 60,
      kx: 620 + r1() * 680, ky: 600 + r1() * 220 });
  }
  const sA = { e: 0, m: 0 };
  tl.fromTo(sA, { e: 0 }, { e: 1, duration: 3.2, ease: 'power3.out', immediateRender: false }, 0.15);
  tl.fromTo(sA, { m: 0 }, { m: 1, duration: 1.8, ease: 'power3.inOut', immediateRender: false }, C('c02').about('막상') - 0.2);

  const aiC = chars('.hero-ai');
  tl.fromTo(aiC, { autoAlpha: 0, y: -90, rotation: (i) => (i ? 9 : -9) }, { autoAlpha: 1, y: 0, rotation: 0, duration: 1.3, ease: 'expo.out', stagger: 0.14, immediateRender: true }, 'c01+=0.15');
  move(0.3, { s: 1.0 }, 9.5, 'sine.inOut');
  gsap.set('.hero-ai', { transformOrigin: '50% 0%' });
  tl.to('.hero-ai', { y: -80, scale: 0.45, duration: 1.2, ease: 'power3.inOut' }, S('c02') + 0.1);
  draw('.knot path', C('c02').about('막상') + 0.4, 1.8);
  inn(chars('.q-what'), C('c02').about('막막') - 0.3, { y: 30, scale: 0.8 }, 0.8, 'back.out(1.6)', { stagger: 0.05 });
  // c03: 질문과 엉킨 띠가 물러나고, 세 깃발의 번호가 먼저 선다
  dim('.q-what', S('c03') + 0.2, 0, 0.6);
  tl.to('.knot', { autoAlpha: 0.22, y: 80, duration: 1.2, ease: 'power2.inOut' }, S('c03') + 0.2);
  ['.f1 .fn', '.f2 .fn', '.f3 .fn'].forEach((s, i) => inn(s, C('c03').about('세 가지') + i * 0.22, { y: 20 }, 0.7));
  inn('.f1 .fw', C('c04').about('왜') - 0.15, { y: 60, rotation: -4 }, 1.0);
  inn('.f2 .fw', C('c04').about('어떻게') - 0.15, { y: 60, rotation: -4 }, 1.0);
  inn('.f3 .fw', C('c05').about('바이브') - 0.15, { y: 60, rotation: -4 }, 1.0);
  tl.to('.f1 .fw', { color: '#ffb54a', duration: 0.6 }, S('c06') - 0.3);
  move(S('c03'), { s: 1.04, y: 520 }, C('c03').duration + C('c04').duration + C('c05').duration, 'sine.inOut');

  /* ===================== B · 왜 (c06–c11) ===================== */
  move(S('c06') - 0.6, { x: 3400, y: 540, s: 1 }, 2.6);
  inn(chars('#sB .h1:not(.h-same)'), S('c06') + 1.3, { y: 50 }, 0.9, 'expo.out', { stagger: 0.035 });
  const c7 = C('c07');
  inn('.d-say', c7.about('사람의 말') - 0.3, { scale: 0.6, y: 0 }, 0.8, 'back.out(1.7)');
  inn('.d-ai', c7.about('알아듣고'), { scale: 0.55, y: 0 }, 0.9, 'back.out(1.6)');
  const fl = $$('#sB .flow path');
  draw(fl[0], c7.about('알아듣고') - 0.4, 0.8); draw(fl[1], c7.about('알아듣고') - 0.4, 0.8);
  [['글이나', 1], ['그림', 2], ['코드를', 3]].forEach(([w, k], i) => {
    const p = c7.about(w) - 0.35;
    draw(fl[k * 2], p, 0.7); draw(fl[k * 2 + 1], p, 0.7);
    inn('.o' + k, p + 0.35, { x: -30, y: 0 }, 0.8);
  });
  tl.to('.d-ai', { boxShadow: 'inset 2px 2px 0 rgba(255,251,240,.75), inset -2px -3px 0 rgba(90,70,40,.18), 4px 6px 3px rgba(3,14,18,.35), 0 0 90px rgba(255,181,74,.55)', duration: 1.2 }, c7.about('만들어 주는'));
  inn('.n1', C('c08').about('챗GPT') - 0.2, { y: 30 }, 0.8);
  inn('.n2', C('c08').about('클로드') - 0.2, { y: 30 }, 0.8);

  move(S('c09') - 0.5, { y: 1640 }, 2.2);
  inn(words('.h-same'), S('c09') + 0.7, { y: 50 }, 0.9, 'expo.out', { stagger: 0.12 });
  const lane = (sel, p) => {
    inn(sel + ' .rib', p, { x: -60, y: 0 }, 0.8);
    inn(sel + ' .arr', p + 0.35, { x: -30, y: 0 }, 0.6);
    inn(sel + ' .page', p + 0.6, { scale: 0.7, y: 0 }, 0.8, 'back.out(1.5)');
  };
  lane('.l1', S('c09') + 1.4);
  lane('.l2', C('c09').about('결과는'));
  tl.to('.l2 .rib', { '--ul': 1, duration: 0.8, ease: 'power3.inOut' }, C('c10').about('분명하게') - 0.2);
  inn('.t-clear', C('c10').about('분명하게'), { y: 20 }, 0.7);
  dim('.l1', C('c10').about('분명하게'), 0.35);
  draw('.neat .ok path', C('c10').about('쓸 만한') - 0.2, 0.6);
  // c11: 두 줄이 물러나고 결론이 선다
  dim(['.l1', '.l2', '.t-clear', '.h-same'], S('c11') + 0.2, 0.0, 0.7);
  inn('.h-not', S('c11') + 0.5, { y: 40 }, 0.9);
  tl.to('.h-not', { '--st': 1, duration: 0.8, ease: 'power3.inOut' }, C('c11').about('아니라') - 0.2);
  tl.to('.h-not', { autoAlpha: 0.35, duration: 0.6 }, C('c11').about('아니라') + 0.6);
  inn(words('.h-trust'), C('c11').about('맡기고') - 0.3, { y: 50 }, 1.0, 'expo.out', { stagger: 0.18 });
  move(S('c11'), { s: 1.05 }, C('c11').duration, 'sine.inOut');

  /* ===================== C · 어떻게 (c12–c20) ===================== */
  move(S('c12'), { x: 3400, y: 1100, s: 0.5 }, 2.4);
  move(S('c13') + 0.6, { x: 5800, y: 540, s: 1 }, 3.0);
  inn(chars('.h-order'), S('c13') + 3.0, { y: 40 }, 0.8, 'expo.out', { stagger: 0.03 });
  const stand = (sel, p) => inn(sel, p, { y: 140, rotation: -6, scale: 0.92 }, 1.2, 'expo.out');
  dim('.h-order', S('c14') + 0.2, 0, 0.6);
  stand('.n-1', S('c14') + 0.1);
  inn(words('.s1t'), C('c14').about('실제 일') - 0.6, { y: 40 }, 0.9, 'expo.out', { stagger: 0.12 });
  [['메일', 1], ['회의', 2], ['여행', 3]].forEach(([w, k]) => inn('.ob' + k, C('c15').about(w) - 0.2, { y: 60, rotation: k === 3 ? -12 : 0 }, 0.9, 'back.out(1.4)'));
  move(S('c14'), { s: 1.03 }, C('c14').duration + C('c15').duration, 'sine.inOut');

  move(S('c16') - 0.5, { x: 7600, s: 1 }, 2.2);
  stand('.n-2', S('c16') + 0.5);
  inn(words('.s2t'), S('c16') + 0.9, { y: 40 }, 0.9, 'expo.out', { stagger: 0.12 });
  inn('.rib3', S('c16') + 1.4, { x: -80, y: 0 }, 1.0);
  gsap.set('.rib3 .g', { color: 'rgba(24,56,64,0)' });
  const segL = $$('.seg-l span');
  [['무엇을 위한', 0], ['어떤 조건', 1], ['어떤 모양', 2]].forEach(([w, i]) => inn(segL[i], C('c16').about(w) - 0.2, { y: 20 }, 0.7));
  [['생일 문자', '.g1'], ['세 줄로', '.g2'], ['따뜻한', '.g3']].forEach(([w, s]) =>
    tl.to(s, { color: 'rgba(24,56,64,1)', duration: 0.6, ease: 'power2.out' }, C('c17').about(w) - 0.3));

  move(S('c18') - 0.5, { x: 9400 }, 2.2);
  stand('.n-3', S('c18') + 0.5);
  inn(words('.s3t'), S('c18') + 0.9, { y: 40 }, 0.9, 'expo.out', { stagger: 0.12 });
  gsap.set('.sheet .fix', { autoAlpha: 0, height: 0, marginBottom: 0 });
  inn('.sheet', S('c18') + 1.3, { y: 60, rotation: 2 }, 1.0);
  tl.to('.sheet .bad', { '--st': 1, duration: 0.7, ease: 'power3.inOut' }, C('c18').about('마음에') - 0.1);
  tl.to('.sheet .bad', { color: 'rgba(24,56,64,.4)', duration: 0.5 }, C('c18').about('마음에') + 0.4);
  tl.to('.sheet .fix', { autoAlpha: 1, height: 50, marginBottom: 22, duration: 0.8, ease: 'expo.out' }, C('c18').about('고치게') - 0.3);
  inn('.n-warn', C('c19').about('그럴듯하게') - 0.3, { y: 30 }, 0.8);
  inn('.stamp', C('c19').about('직접 확인') - 0.25, { scale: 1.7, rotation: -24, y: 0 }, 0.55, 'power4.in', { rotation: -8 });
  move(S('c20'), { x: 7200, y: 600, s: 0.4 }, 2.6);
  [['맡겨 보고', '.n-1'], ['자세히', '.n-2'], ['확인하는', '.n-3']].forEach(([w, s]) => {
    tl.to(s, { color: '#ffb54a', duration: 0.5, ease: 'power2.out' }, C('c20').about(w) - 0.2);
  });

  /* ===================== D · 바이브 코딩 (c21–c26) ===================== */
  move(S('c21') - 0.6, { x: 12000, y: 540, s: 1 }, 3.2);
  tl.to(lamp, { '--li': 0.28, duration: 2.6, ease: 'power2.inOut' }, S('c21') - 0.2);
  tl.to(cool, { opacity: 1, duration: 2.6, ease: 'power2.inOut' }, S('c21') + 0.2);
  inn('.d-step', S('c21') + 2.2, { y: 20 }, 0.7);
  inn('.d-rib', S('c21') + 2.6, { x: -80, y: 0 }, 1.0);
  const dTxt = $('.d-txt'); const dFrom = dTxt.textContent, dTo = '<ul class="todo"></ul>';
  const glyphs = '{}<>/=;()[]';
  const sc22 = { p: 0 };
  tl.fromTo(sc22, { p: 0 }, { p: 1, duration: 1.6, ease: 'power1.inOut', immediateRender: false }, C('c22').about('프로그램까지') - 0.2);
  gsap.set('.d-txt', { fontFamily: "'Pretendard', sans-serif" });
  inn(chars('.d-vibe'), C('c22').about('바이브 코딩') - 0.35, { y: 70 }, 1.0, 'expo.out', { stagger: 0.06 });
  inn('.d-en', C('c22').about('바이브 코딩') + 0.5, { y: 20 }, 0.8);
  // c23: 날짜 — 앞의 것들은 물러남
  dim(['.d-step', '.d-rib', '.d-vibe', '.d-en'], S('c23') + 0.1, 0.12, 0.7);
  move(S('c23') - 0.2, { x: 12260, y: 400, s: 1.08 }, 2.2);
  inn(chars('.d-date'), C('c23').about('2025년') - 0.3, { y: 60 }, 1.0, 'expo.out', { stagger: 0.06 });
  inn('.d-who', C('c23').about('카파시') - 0.4, { y: 24 }, 0.8);
  // c24: 두 방식 비교
  dim(['.d-date', '.d-who', '.d-step', '.d-rib', '.d-vibe', '.d-en'], S('c24') - 0.3, 0, 0.6);
  move(S('c24') - 0.3, { x: 12000, y: 560, s: 1 }, 1.8);
  inn('.c-hand', S('c24') + 0.2, { x: -40, y: 0 }, 0.8);
  inn('.c-talk', S('c24') + 0.6, { x: 40, y: 0 }, 0.8);
  const slowCode = 'const list = [];\n\nfunction add(item) {\n  list.push(item);\n  draw();\n}\n';
  const fastCode = '<ul class="todo"></ul>\n<input id="new">\n<button>추가</button>\n<script>\n  const list = [];\n  function add() {\n    list.push(input.value);\n    draw();\n  }\n</script>';
  const slowEl = $('.code.slow'), fastEl = $('.code.fast');
  const ty = { a: 0, b: 0 };
  tl.fromTo(ty, { a: 0 }, { a: 0.42, duration: C('c24').duration, ease: 'none', immediateRender: false }, S('c24') + 0.6);
  tl.fromTo(ty, { b: 0 }, { b: 1, duration: 1.6, ease: 'power1.in', immediateRender: false }, C('c24').about('AI가 코드를'));
  // c25: 아래로, 사전
  move(S('c25') - 0.5, { y: 1640 }, 2.2);
  inn('.dict', C('c25').about('콜린스') - 0.3, { y: 80, rotation: -9 }, 1.1, 'expo.out', { rotation: -3 });
  tl.fromTo('.dict .dk', { color: '#b06a12' }, { color: '#e28a1a', duration: 0.6 }, C('c25').about('올해의 단어') - 0.2);
  inn(words('.d-start'), C('c26').about('말할 수 있으면') - 0.4, { y: 40 }, 0.9, 'expo.out', { stagger: 0.12 });

  /* ===================== E · 무엇을 만들까 (c27–c30) ===================== */
  move(S('c27') - 0.6, { x: 14600, y: 540, s: 1 }, 3.2);
  tl.to(lamp, { '--li': 0.75, duration: 2.6, ease: 'power2.inOut' }, S('c27'));
  tl.to(cool, { opacity: 0, duration: 2.6, ease: 'power2.inOut' }, S('c27'));
  inn(chars('.e-q'), S('c27') + 2.4, { y: 40 }, 0.8, 'expo.out', { stagger: 0.03 });
  const c28 = C('c28');
  inn('.win', c28.about('가계부') - 0.4, { y: 80, scale: 0.94 }, 1.0);
  $$('.win .row').forEach((r, i) => inn(r, c28.about('가계부') + 0.3 + i * 0.28, { x: -30, y: 0 }, 0.6));
  const sum = { v: 0 };
  tl.fromTo(sum, { v: 0 }, { v: 29950, duration: 1.6, ease: 'power3.out', immediateRender: false }, c28.about('가계부') + 1.8);
  const sumEl = $('.sum');
  inn('.e-l1', c28.about('작은 웹') - 0.4, { y: 30 }, 0.8);
  move(S('c28'), { s: 1.03 }, c28.duration, 'sine.inOut');

  move(S('c29') - 0.5, { x: 16400, s: 1 }, 2.2);
  inn(words('.e-h2'), S('c29') + 1.0, { y: 40 }, 0.8, 'expo.out', { stagger: 0.1 });
  const files = $('#files');
  const oldN = ['IMG_2041.jpg', 'IMG_2042.jpg', 'IMG_2043.jpg', 'IMG_2044.jpg', 'IMG_2045.jpg', 'IMG_2046.jpg'];
  const newN = ['제주-01.jpg', '제주-02.jpg', '제주-03.jpg', '제주-04.jpg', '제주-05.jpg', '제주-06.jpg'];
  const fileEls = oldN.map((n, i) => {
    const f = document.createElement('div'); f.className = 'fc cut';
    f.innerHTML = '<i></i><span></span>'; f.querySelector('span').textContent = n;
    f.style.left = 170 + i * 150 + 'px'; f.style.top = 300 + i * 66 + 'px';
    f.style.transform = `rotate(${(i % 2 ? 1.5 : -1.5)}deg)`;
    files.appendChild(f); return f.querySelector('span');
  });
  $$('#files .fc').forEach((f, i) => inn(f, S('c29') + 1.3 + i * 0.12, { y: 50 }, 0.7));
  const ren = { p: 0 };
  tl.fromTo(ren, { p: 0 }, { p: 1, duration: 2.0, ease: 'none', immediateRender: false }, C('c29').about('파일 이름') - 0.2);
  inn('.e-l2', C('c29').about('엑셀') - 0.5, { y: 30 }, 0.8);

  move(S('c30') - 0.5, { x: 18200 }, 2.2);
  inn('.film', S('c30') + 0.9, { y: 60, scale: 0.92 }, 1.1);
  inn(chars('.mini-in .pt'), S('c30') + 1.4, { y: -50 }, 1.0, 'expo.out', { stagger: 0.12 });
  inn(words('.e-this'), C('c30').about('이 영상도') - 0.2, { y: 40 }, 0.9, 'expo.out', { stagger: 0.1 });
  inn('.e-l3', C('c30').about('대본과') - 0.5, { y: 30 }, 0.8);

  /* ===================== 요령 (c31–c34) ===================== */
  move(S('c31') - 0.5, { x: 20200 }, 2.4);
  inn(words('.t-h'), S('c31') + 1.6, { y: 40 }, 0.9, 'expo.out', { stagger: 0.12 });
  inn('.ghost', C('c31').about('요령') - 0.3, { scale: 0.85, y: 0 }, 1.0);
  tl.to('.ghost', { scale: 0.24, autoAlpha: 0, duration: 0.9, ease: 'power3.inOut' }, C('c32').about('큰 것') + 0.2);
  const blocks = $('#blocks');
  const bp = [[300, 740], [470, 740], [640, 740], [385, 620], [555, 620], [470, 500]];
  const bc = ['#f1e6d0', '#ffce80', '#f1e6d0', '#9cc3a4', '#f1e6d0', '#ffce80'];
  const bEls = bp.map(([x, y], i) => {
    const b = document.createElement('div'); b.className = 'bk cut';
    b.style.cssText = `left:${x}px;top:${y}px;width:160px;height:110px;background-color:${bc[i]}`;
    if (bc[i] !== '#f1e6d0') b.style.backgroundImage = i % 3 === 1 ? 'var(--t-amber)' : 'none';
    blocks.appendChild(b); return b;
  });
  inn(bEls[0], C('c32').about('버튼 하나') - 0.3, { y: -160, autoAlpha: 0 }, 0.7, 'bounce.out');
  bEls.slice(1).forEach((b, i) => inn(b, C('c32').about('화면 하나') + i * 0.45, { y: -160 }, 0.7, 'bounce.out'));
  inn(words('.t-l1'), C('c32').about('작게') - 0.3, { y: 30 }, 0.8, 'expo.out', { stagger: 0.1 });

  move(S('c33') - 0.5, { x: 21900 }, 2.2);
  inn('.bwrap', S('c33') + 0.8, { y: 60, scale: 0.9 }, 0.9);
  inn(words('.t-l2'), C('c33').about('열어 보고') - 0.3, { y: 40 }, 0.9, 'expo.out', { stagger: 0.12 });
  inn('.cursor', C('c33').about('열어 보고'), { x: 260, y: 200 }, 1.0, 'power3.out');
  const pressAt = C('c33').about('눌러 보면서') - 0.1;
  tl.to('.cursor', { x: -40, y: -60, duration: 0.5, ease: 'power2.inOut' }, pressAt - 0.5);
  tl.to('.btn', { y: 8, boxShadow: 'inset 2px 2px 0 rgba(255,251,240,.75), inset -2px -3px 0 rgba(90,70,40,.18), 1px 2px 1px rgba(3,14,18,.35), 4px 6px 8px rgba(3,14,18,.42)', duration: 0.12, ease: 'power2.in' }, pressAt);
  tl.to('.cursor', { scale: 0.92, duration: 0.12 }, pressAt);
  tl.to('.btn', { y: 0, boxShadow: 'inset 2px 2px 0 rgba(255,251,240,.75), inset -2px -3px 0 rgba(90,70,40,.18), 4px 6px 3px rgba(3,14,18,.35), 14px 22px 30px rgba(3,14,18,.42)', duration: 0.35, ease: 'power2.out' }, pressAt + 0.2);
  tl.to('.cursor', { scale: 1, duration: 0.3 }, pressAt + 0.2);

  move(S('c34') - 0.5, { x: 23600 }, 2.2);
  inn('.t-msg', C('c34').about('이상한 곳') - 0.3, { x: -60, y: 0 }, 0.8);
  inn(words('.t-l3'), C('c34').about('말로 설명') - 0.5, { y: 40 }, 0.9, 'expo.out', { stagger: 0.1 });
  inn('.t-rep', C('c34').about('다시 고치게') - 0.2, { x: -60, y: 0 }, 0.8);
  draw('.t-rep .ok path', C('c34').about('다시 고치게') + 0.5, 0.5);

  /* ===================== 정리 (c35–c38) ===================== */
  tl.to(foreA, { o: 0, duration: 0.8 }, S('c35') - 0.4);
  move(S('c35') - 0.3, { x: 12700, y: 1000, s: 0.072 }, 3.6, 'power2.inOut');
  inn(words('.hud1'), C('c36').about('맡기는 방법') - 0.6, { y: 40 }, 0.9, 'expo.out', { stagger: 0.12 });
  inn(words('.hud2'), C('c37').about('연습이') - 0.3, { y: 30 }, 0.9, 'expo.out', { stagger: 0.12 });
  tl.to(['.hud1', '.hud2'], { autoAlpha: 0, y: -30, duration: 0.6, ease: 'power2.in' }, S('c38') - 0.3);
  move(S('c38') - 0.3, { x: 25600, y: 540, s: 1 }, 2.8, 'power3.inOut');
  tl.to(lamp, { '--lx': '50%', '--ly': '36%', '--li': 1, duration: 2.4, ease: 'power2.inOut' }, S('c38') + 0.6);
  inn(words('.end'), S('c38') + 1.6, { y: 50 }, 1.0, 'expo.out', { stagger: 0.12 });
  // 영상 끝: 마지막 문장을 잠시 더 보여 준다
  tl.to({}, { duration: 2.5 }, C('c38').end);

  /* ---------- 매 프레임 (t와 tl의 값만 읽음) ---------- */
  const world = $('#world'), wall = $('#wall');
  let lastKey = '';
  onFrame((t) => {
    const s = cam.s;
    world.style.transform = `translate(${960 - cam.x * s}px, ${540 - cam.y * s}px) scale(${s})`;
    wall.style.transform = `translate(${-cam.x * 0.05}px, ${-(cam.y - 540) * 0.03}px)`;
    const ms = 1 + (s - 1) * 0.35;
    for (const m of mids) {
      const x = (m.x - cam.x * 0.45) * ms + 960 * (1 - ms), y = (m.y - (cam.y - 540) * 0.45) * ms + 540 * (1 - ms);
      m.el.style.transform = `translate(${x}px, ${y}px) scale(${ms})`;
    }
    for (const f of fores) {
      const x = 960 + (f.m - cam.x) * 1.7 + f.off - f.w / 2;
      const vis = x > -1100 && x < 2100 && foreA.o > 0.01;
      f.el.style.visibility = vis ? 'visible' : 'hidden';
      if (vis) f.el.style.transform = `translate(${x}px, ${f.y}px)`;
      f.el.style.opacity = (0.9 * foreA.o).toFixed(3);
    }
    const p = Math.min(1, Math.max(0, (thr.x + 200) / 26600));
    thP.forEach((el) => { el.style.strokeDashoffset = Math.max(0, thLen * (1 - p) - 900); });

    // A: 종이 조각
    const e = sA.e, mm = sA.m;
    for (const c of scraps) {
      const dx = Math.sin(t * 0.35 * c.sp + c.ph) * 22, dy = Math.cos(t * 0.28 * c.sp + c.ph) * 16;
      const x0 = c.bx + dx, y0 = c.by + dy - (1 - e) * (420 + c.ph * 40);
      const k = mm * mm * (3 - 2 * mm);
      const x = x0 + (c.kx - x0) * k, y = y0 + (c.ky - y0) * k;
      const rot = c.rot + Math.sin(t * 0.4 + c.ph) * 8 + k * 120;
      c.e.style.transform = `translate(${x - c.w / 2}px, ${y - c.h / 2}px) rotate(${rot}deg) scale(${1 - k * 0.7})`;
      c.e.style.opacity = (Math.min(1, e * 1.6) * (1 - k)).toFixed(3);
    }

    // D: 부탁 글자가 코드로
    const q = sc22.p, n = Math.max(dFrom.length, dTo.length), kq = Math.floor(q * n);
    const txt = q <= 0 ? dFrom : q >= 1 ? dTo : dTo.slice(0, kq) + glyphs[kq % glyphs.length] + dFrom.slice(kq + 1);
    if (dTxt.textContent !== txt) dTxt.textContent = txt;
    if (q > 0.5 && dTxt.style.fontFamily.indexOf('D2') < 0) dTxt.style.fontFamily = "'D2Coding', 'Pretendard', monospace";
    if (q <= 0.5 && dTxt.style.fontFamily.indexOf('D2') >= 0) dTxt.style.fontFamily = "'Pretendard', sans-serif";
    const sl = slowCode.slice(0, Math.floor(ty.a * slowCode.length)) + (ty.a > 0 && ty.a < 0.42 && Math.floor(t * 2) % 2 ? '_' : '');
    if (slowEl.textContent !== sl) slowEl.textContent = sl;
    const fa = fastCode.slice(0, Math.floor(ty.b * fastCode.length));
    if (fastEl.textContent !== fa) fastEl.textContent = fa;

    // E: 합계, 파일 이름
    const sv = Math.round(sum.v).toLocaleString('ko-KR') + '원';
    if (sumEl.textContent !== sv) sumEl.textContent = sv;
    fileEls.forEach((el, i) => {
      const nm = ren.p * 7 - i > 0.5 ? newN[i] : oldN[i];
      if (el.textContent !== nm) el.textContent = nm;
    });
  });
});
