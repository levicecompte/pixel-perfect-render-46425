import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { SYMBOLS } from "@/lib/slot/engine";
import { SymbolIcon } from "./SymbolIcon";

/** Glassmorphic paytable drawer. */
export function Paytable({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-[color-mix(in_oklab,var(--neon-gold)_30%,transparent)] bg-white/5 p-5 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-[var(--neon-gold)]">PAYTABLE</h2>
              <button
                onClick={onClose}
                aria-label="Close paytable"
                className="rounded-lg border border-white/15 p-1.5 text-foreground/70 transition hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-3 grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-2 text-[0.65rem] tracking-[0.2em] text-muted-foreground">
              <span />
              <span className="text-right">3x</span>
              <span className="text-right">4x</span>
              <span className="text-right">5x</span>
            </div>

            <ul className="space-y-2">
              {SYMBOLS.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <span className="flex items-center gap-2" style={{ color: s.tone }}>
                    <SymbolIcon id={s.id} size={22} />
                    <span className="text-xs text-foreground/80">{s.label}</span>
                  </span>
                  {s.id === "scatter" ? (
                    <span className="col-span-3 text-right text-xs text-[var(--neon-cyan)]">
                      3+ anywhere = 10 free spins, x3 multiplier
                    </span>
                  ) : (
                    s.pays.map((p, i) => (
                      <span key={i} className="text-right font-display text-sm tabular-nums">
                        {p}
                      </span>
                    ))
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              20 fixed paylines. WILD substitutes for every symbol except SCATTER. Five DIAMONDS on
              a payline or three SCATTERS trigger the MEGA JACKPOT. Payouts are multipliers of the
              line bet (total bet / 20). Fun chips only — no real money, no purchases, no cash-out.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
