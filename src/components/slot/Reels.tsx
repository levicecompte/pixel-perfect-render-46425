import { useMemo } from "react";
import { motion } from "motion/react";
import {
  PAYLINES,
  REELS,
  ROWS,
  SYMBOL_MAP,
  randomSymbol,
  type Grid,
  type LineWin,
  type SymbolId,
} from "@/lib/slot/engine";
import { SymbolIcon } from "./SymbolIcon";

const CELL = 88;
const FILLER = 24;

function Cell({
  id,
  winning,
  idle,
}: {
  id: SymbolId;
  winning?: boolean;
  idle?: boolean;
}) {
  const tone = SYMBOL_MAP[id].tone;
  return (
    <motion.div
      animate={winning ? { scale: [1, 1.28, 1.12], rotate: [0, -3, 3, 0] } : { scale: 1 }}
      transition={
        winning
          ? { duration: 0.7, repeat: Infinity, repeatType: "reverse" }
          : { duration: 0.2 }
      }
      className="relative flex items-center justify-center rounded-xl border"
      style={{
        height: CELL - 8,
        margin: 4,
        color: tone,
        borderColor: winning ? tone : "color-mix(in oklab, var(--neon-gold) 18%, transparent)",
        background: winning
          ? `radial-gradient(circle at 50% 40%, color-mix(in oklab, ${tone} 35%, transparent), transparent 70%)`
          : "linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.01))",
        boxShadow: winning
          ? `0 0 34px ${tone}, inset 0 0 26px color-mix(in oklab, ${tone} 45%, transparent)`
          : `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 18px color-mix(in oklab, ${tone} ${idle ? 14 : 8}%, transparent)`,
        filter: winning ? `drop-shadow(0 0 12px ${tone})` : undefined,
      }}
    >
      <SymbolIcon id={id} />
    </motion.div>
  );
}

function Reel({
  index,
  final,
  spinId,
  spinning,
  stopped,
  turbo,
  winningCells,
}: {
  index: number;
  final: SymbolId[];
  spinId: number;
  spinning: boolean;
  stopped: boolean;
  turbo: boolean;
  winningCells: string[];
}) {
  const strip = useMemo(
    () => [...Array.from({ length: FILLER }, randomSymbol), ...final],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spinId],
  );

  const duration = (turbo ? 0.45 : 0.9) + index * (turbo ? 0.1 : 0.22);

  return (
    <div className="relative overflow-hidden" style={{ height: ROWS * CELL }}>
      {spinning ? (
        <motion.div
          key={spinId}
          initial={{ y: 0 }}
          animate={{ y: -(FILLER * CELL) }}
          transition={{ duration, ease: [0.12, 0.72, 0.16, 1.04] }}
          style={{ filter: stopped ? "none" : "blur(3px)" }}
        >
          {strip.map((id, i) => (
            <Cell key={i} id={id} />
          ))}
        </motion.div>
      ) : (
        <motion.div initial={{ y: -10 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 14 }}>
          {final.map((id, row) => (
            <Cell key={row} id={id} winning={winningCells.includes(`${index}-${row}`)} idle />
          ))}
        </motion.div>
      )}
    </div>
  );
}

/** The 5x3 reel grid with neon separators and animated payline overlay. */
export function ReelGrid({
  grid,
  spinId,
  spinningReels,
  turbo,
  winningCells,
  activeLine,
}: {
  grid: Grid;
  spinId: number;
  spinningReels: boolean[];
  turbo: boolean;
  winningCells: string[];
  activeLine: LineWin | null;
}) {
  const colW = 100;
  const points = activeLine
    ? (PAYLINES[activeLine.lineIndex] ?? [])
        .map((row, reel) => `${reel * colW + colW / 2},${row * CELL + CELL / 2}`)
        .join(" ")
    : "";

  return (
    <div className="relative rounded-2xl border border-[color-mix(in_oklab,var(--neon-gold)_25%,transparent)] bg-black/50 p-2 shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]">
      <div className="relative grid grid-cols-5 gap-1">
        {Array.from({ length: REELS }, (_, i) => (
          <div
            key={i}
            className="rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]"
          >
            <Reel
              index={i}
              final={grid[i] ?? []}
              spinId={spinId}
              spinning={spinningReels[i] ?? false}
              stopped={!spinningReels[i]}
              turbo={turbo}
              winningCells={winningCells}
            />
          </div>
        ))}

        {activeLine && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${REELS * colW} ${ROWS * CELL}`}
            preserveAspectRatio="none"
          >
            <motion.polyline
              points={points}
              fill="none"
              stroke={SYMBOL_MAP[activeLine.symbol].tone}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="18 14"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -64] }}
              transition={{
                pathLength: { duration: 0.4 },
                opacity: { duration: 0.2 },
                strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" },
              }}
              style={{ filter: `drop-shadow(0 0 8px ${SYMBOL_MAP[activeLine.symbol].tone})` }}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
