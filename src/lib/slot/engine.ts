// Core slot machine logic. Pure functions, no React, no real money.

export type SymbolId =
  | "cherry"
  | "lemon"
  | "bell"
  | "bar"
  | "seven"
  | "diamond"
  | "wild"
  | "scatter";

export interface SymbolDef {
  id: SymbolId;
  label: string;
  /** CSS custom property used for the neon glow of this symbol. */
  tone: string;
  weight: number;
  /** Payout multiplier of the line bet for 3 / 4 / 5 of a kind. */
  pays: [number, number, number];
}

export const SYMBOLS: SymbolDef[] = [
  { id: "cherry", label: "Cherry", tone: "var(--neon-red)", weight: 22, pays: [5, 15, 50] },
  { id: "lemon", label: "Lemon", tone: "var(--neon-lime)", weight: 22, pays: [5, 15, 50] },
  { id: "bell", label: "Bell", tone: "var(--neon-gold)", weight: 18, pays: [10, 30, 100] },
  { id: "bar", label: "Bar", tone: "var(--neon-cyan)", weight: 14, pays: [15, 50, 150] },
  { id: "seven", label: "Seven", tone: "var(--neon-pink)", weight: 10, pays: [25, 100, 300] },
  { id: "diamond", label: "Diamond", tone: "var(--neon-violet)", weight: 6, pays: [50, 200, 1000] },
  { id: "wild", label: "Wild", tone: "var(--neon-gold)", weight: 4, pays: [75, 300, 1500] },
  { id: "scatter", label: "Scatter", tone: "var(--neon-cyan)", weight: 4, pays: [0, 0, 0] },
];

export const SYMBOL_MAP = Object.fromEntries(SYMBOLS.map((s) => [s.id, s])) as Record<
  SymbolId,
  SymbolDef
>;

export const REELS = 5;
export const ROWS = 3;

/** 20 paylines, each entry is the row index picked on reels 0..4. */
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 2, 1, 0, 1],
  [1, 0, 1, 2, 1],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [0, 2, 0, 2, 0],
];

export const BET_STEPS = [1, 2, 5, 10, 20, 50, 100];

const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);

export function randomSymbol(): SymbolId {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const s of SYMBOLS) {
    roll -= s.weight;
    if (roll <= 0) return s.id;
  }
  return "cherry";
}

/** Grid is indexed [reel][row]. */
export type Grid = SymbolId[][];

export function randomGrid(): Grid {
  return Array.from({ length: REELS }, () =>
    Array.from({ length: ROWS }, () => randomSymbol()),
  );
}

export interface LineWin {
  lineIndex: number;
  symbol: SymbolId;
  count: number;
  amount: number;
  /** [reel, row] cells that form the win. */
  cells: [number, number][];
}

export interface SpinResult {
  grid: Grid;
  lineWins: LineWin[];
  scatterCount: number;
  scatterCells: [number, number][];
  totalWin: number;
  jackpot: boolean;
  freeSpinsAwarded: number;
  winningCells: string[];
}

export function evaluate(grid: Grid, bet: number, multiplier = 1): SpinResult {
  const lineBet = bet / 20;
  const lineWins: LineWin[] = [];

  PAYLINES.forEach((line, lineIndex) => {
    const firstRow = line[0]!;
    const first = grid[0]![firstRow]!;
    // A line cannot start on a scatter; wilds adopt the next real symbol.
    let base: SymbolId | null = first === "wild" ? null : first;
    if (first === "scatter") return;

    const cells: [number, number][] = [[0, firstRow]];
    let count = 1;

    for (let reel = 1; reel < REELS; reel++) {
      const row = line[reel]!;
      const sym = grid[reel]![row]!;
      if (sym === "scatter") break;
      if (sym === "wild" || base === null || sym === base) {
        if (base === null && sym !== "wild") base = sym;
        cells.push([reel, row]);
        count++;
      } else break;
    }

    const resolved: SymbolId = base ?? "wild";
    if (count >= 3) {
      const pay = SYMBOL_MAP[resolved].pays[count - 3] ?? 0;
      if (pay > 0) {
        lineWins.push({
          lineIndex,
          symbol: resolved,
          count,
          amount: Math.round(pay * lineBet * multiplier),
          cells,
        });
      }
    }
  });

  const scatterCells: [number, number][] = [];
  grid.forEach((reel, r) =>
    reel.forEach((sym, row) => {
      if (sym === "scatter") scatterCells.push([r, row]);
    }),
  );
  const scatterCount = scatterCells.length;

  const diamondCount = grid.filter((reel) => reel.includes("diamond")).length;
  const fiveDiamonds = PAYLINES.some((line) =>
    line.every((row, reel) => grid[reel]![row] === "diamond"),
  );
  const jackpot = fiveDiamonds || scatterCount >= 3;

  let totalWin = lineWins.reduce((sum, w) => sum + w.amount, 0);
  if (scatterCount >= 3) totalWin += Math.round(bet * 2 * multiplier);

  const winningCells = [
    ...lineWins.flatMap((w) => w.cells),
    ...(scatterCount >= 3 ? scatterCells : []),
  ].map(([r, row]) => `${r}-${row}`);

  return {
    grid,
    lineWins,
    scatterCount,
    scatterCells,
    totalWin,
    jackpot: jackpot && diamondCount >= 0,
    freeSpinsAwarded: scatterCount >= 3 ? 10 : 0,
    winningCells: Array.from(new Set(winningCells)),
  };
}

export function spin(bet: number, multiplier = 1): SpinResult {
  return evaluate(randomGrid(), bet, multiplier);
}

export function formatChips(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
