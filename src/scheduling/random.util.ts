/** Deterministic pseudo-random in [0, 1). Depends only on (i,j). */
export function hash2(i: number, j: number): number {
  // Two large coprime multipliers; simple xorshift-ish mixing
  let x = ((i + 1) * 73856093) ^ ((j + 1) * 19349663);
  x ^= x >>> 13;
  x ^= x << 17;
  x ^= x >>> 5;
  // to unsigned, then scale
  const u = (x >>> 0) % 1000000;
  return u / 1000000; // 0 .. 0.999999
}
