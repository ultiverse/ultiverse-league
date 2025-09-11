import { GameBlock, HistoryState } from './types';

type NumMap = Record<string, number>;
type NumNumMap = Record<string, NumMap>;

export function cloneHistory(h?: HistoryState): HistoryState {
  if (!h) return {};
  const deep: HistoryState = {};
  const copyM = (m?: NumNumMap): NumNumMap | undefined => {
    if (!m) return undefined;
    const out: NumNumMap = {};
    for (const a of Object.keys(m)) {
      out[a] = { ...m[a] };
    }
    return out;
  };
  deep.partneredCounts = copyM(h.partneredCounts);
  deep.opposedCounts = copyM(h.opposedCounts);
  deep.lastPartneredRound = copyM(h.lastPartneredRound as NumNumMap);
  deep.lastOpposedRound = copyM(h.lastOpposedRound as NumNumMap);
  return deep;
}

function ensureRow(map: NumNumMap, a: string): NumMap {
  if (!map[a]) map[a] = {};
  return map[a];
}

export function applyRoundToHistory(
  history: HistoryState,
  blocks: GameBlock[],
  roundIndex: number,
): void {
  const pC = (history.partneredCounts ??= {} as NumNumMap);
  const oC = (history.opposedCounts ??= {} as NumNumMap);
  const lP = (history.lastPartneredRound ??= {} as NumNumMap);
  const lO = (history.lastOpposedRound ??= {} as NumNumMap);

  for (const { a, b, c, d } of blocks) {
    // partners
    const rowAB = ensureRow(pC, a);
    const rowBA = ensureRow(pC, b);
    rowAB[b] = (rowAB[b] ?? 0) + 1;
    rowBA[a] = (rowBA[a] ?? 0) + 1;

    ensureRow(lP, a)[b] = roundIndex;
    ensureRow(lP, b)[a] = roundIndex;

    // opponents (cross-pairs)
    const cross: [string, string][] = [
      [a, c],
      [a, d],
      [b, c],
      [b, d],
    ];
    for (const [x, y] of cross) {
      const rowXY = ensureRow(oC, x);
      const rowYX = ensureRow(oC, y);
      rowXY[y] = (rowXY[y] ?? 0) + 1;
      rowYX[x] = (rowYX[x] ?? 0) + 1;

      ensureRow(lO, x)[y] = roundIndex;
      ensureRow(lO, y)[x] = roundIndex;
    }
  }
}
