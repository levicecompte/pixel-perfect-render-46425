import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatChips } from "@/lib/slot/engine";

/** Fullscreen MEGA WIN celebration with a counting odometer and chromatic 3D text. */
export function MegaWinModal({
  amount,
  open,
  onClose,
}: {
  amount: number;
  open: boolean;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!open) return;
    setShown(0);
    const start = performance.now();
    const duration = 2200;
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setShown(Math.round(amount * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, amount]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/80 backdrop-blur-md"
        >
          {/* Spotlight sweep */}
          <motion.div
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]"
          />

          <motion.div
            initial={{ scale: 0.6, rotateX: 40, opacity: 0 }}
            animate={{ scale: 1, rotateX: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 14 }}
            className="relative px-6 text-center"
          >
            <motion.h2
              animate={{ textShadow: [
                "3px 0 var(--neon-pink), -3px 0 var(--neon-cyan), 0 0 40px var(--neon-gold)",
                "-3px 0 var(--neon-pink), 3px 0 var(--neon-cyan), 0 0 70px var(--neon-gold)",
              ] }}
              transition={{ duration: 0.28, repeat: Infinity, repeatType: "reverse" }}
              className="font-display text-5xl font-black tracking-tight text-[var(--neon-gold)] sm:text-7xl"
            >
              MEGA WIN
            </motion.h2>

            <div className="mt-4 font-display text-4xl font-bold tabular-nums text-foreground drop-shadow-[0_0_24px_var(--neon-gold)] sm:text-6xl">
              {formatChips(shown)}
            </div>
            <p className="mt-2 text-sm tracking-[0.35em] text-[var(--neon-pink)]">FUN CHIPS</p>

            <button
              onClick={onClose}
              className="mt-8 rounded-full border border-[var(--neon-gold)]/60 bg-[var(--neon-gold)]/10 px-8 py-3 text-sm font-semibold tracking-[0.25em] text-[var(--neon-gold)] transition hover:scale-105 hover:bg-[var(--neon-gold)]/20"
            >
              COLLECT
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
