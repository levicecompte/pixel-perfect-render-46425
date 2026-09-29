import { motion } from "motion/react";
import { formatChips } from "@/lib/slot/engine";

export interface JackpotState {
  mini: number;
  minor: number;
  major: number;
  mega: number;
}

const TIERS: { key: keyof JackpotState; label: string; tone: string }[] = [
  { key: "mini", label: "MINI", tone: "var(--neon-cyan)" },
  { key: "minor", label: "MINOR", tone: "var(--neon-lime)" },
  { key: "major", label: "MAJOR", tone: "var(--neon-violet)" },
  { key: "mega", label: "MEGA", tone: "var(--neon-gold)" },
];

/** Four progressive jackpot meters that pulse continuously. */
export function JackpotBar({ jackpots }: { jackpots: JackpotState }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TIERS.map((tier, i) => (
        <motion.div
          key={tier.key}
          animate={{ opacity: [0.78, 1, 0.78] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25 }}
          className="rounded-xl border bg-white/5 px-3 py-2 text-center backdrop-blur-xl"
          style={{
            borderColor: `color-mix(in oklab, ${tier.tone} 45%, transparent)`,
            boxShadow: `0 0 26px color-mix(in oklab, ${tier.tone} 35%, transparent), inset 0 0 18px color-mix(in oklab, ${tier.tone} 12%, transparent)`,
          }}
        >
          <div
            className="text-[0.65rem] font-semibold tracking-[0.3em]"
            style={{ color: tier.tone }}
          >
            {tier.label}
          </div>
          <div
            className="font-display text-lg font-bold tabular-nums sm:text-xl"
            style={{ color: tier.tone, textShadow: `0 0 16px ${tier.tone}` }}
          >
            {formatChips(jackpots[tier.key])}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
