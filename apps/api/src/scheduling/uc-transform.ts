export type GameBlock = { a: string; b: string; c: string; d: string };
export type PairingMode = 'each-vs-both' | 'one-each';

export function expandBlock(block: GameBlock, mode: PairingMode) {
  if (mode === 'one-each') {
    return [
      { home: block.a, away: block.c },
      { home: block.b, away: block.d },
    ];
  }
  // default: each-vs-both
  return [
    { home: block.a, away: block.c },
    { home: block.a, away: block.d },
    { home: block.b, away: block.c },
    { home: block.b, away: block.d },
  ];
}
