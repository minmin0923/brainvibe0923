const parseRanges = (s: string): [number, number][] =>
  s.split(',').map((part) => {
    const p = part.trim().replace(/^U\+/i, '');
    const [a, b] = p.split('-');
    const lo = parseInt(a.replace(/\?/g, '0'), 16);
    const hi = b ? parseInt(b, 16) : parseInt(a.replace(/\?/g, 'f'), 16);
    return [lo, hi];
  });

/** text에 들어 있는 글자를 포함하는 글꼴 조각 키만 고른다 */
export const neededSubsets = (ranges: Record<string, string>, text: string) => {
  const cps = [...new Set([...text].map((c) => c.codePointAt(0)!))];
  return Object.entries(ranges)
    .filter(([, r]) => {
      const rs = parseRanges(r);
      return cps.some((cp) => rs.some(([lo, hi]) => cp >= lo && cp <= hi));
    })
    .map(([k]) => k);
};
