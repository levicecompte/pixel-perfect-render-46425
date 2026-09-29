import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import {
  BookOpen,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";

import {
  BET_STEPS,
  formatChips,
  randomGrid,
  spin as spinEngine,
  type Grid,
  type LineWin,
  type SpinResult,
} from "@/lib/slot/engine";
import { setMuted, sfx } from "@/lib/slot/sound";
import { NeonBackground } from "@/components/slot/NeonBackground";
import { ReelGrid } from "@/components/slot/Reels";
import { JackpotBar, type JackpotState } from "@/components/slot/JackpotBar";
import { Paytable } from "@/components/slot/Paytable";
import { CoinRain } from "@/components/slot/CoinRain";
import { MegaWinModal } from "@/components/slot/MegaWinModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neon Mega Jackpot — Luxury Fun-Chip Slot Machine" },
      {
        name: "description",
        content:
          "Neon Mega Jackpot is a 5x3, 20-payline luxury slot demo played entirely with fictional fun chips. Free spins, progressive meters, no real money.",
      },
      { property: "og:title", content: "Neon Mega Jackpot — Luxury Fun-Chip Slot Machine" },
      {
        property: "og:description",
        content:
          "Spin a Las Vegas-futurist slot machine with neon paylines, free spins and progressive jackpots. 100% fictional chips, no real money.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

const STARTING_BALANCE = 10000;
const DEFAULT_JACKPOTS: JackpotState = {
  mini: 1200,
  minor: 8500,
  major: 42000,
  mega: 250000,
};

/** Animated odometer for the balance counter. */
function useOdometer(value: number) {
  const [display, setDisplay] = useState(value);
  const ref = useRef(value);
  useEffect(() => {
    const from = ref.current;
    const start = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 600);
      const next = from + (value - from) * (1 - Math.pow(1 - p, 3));
      setDisplay(next);
      if (p < 1) frame = requestAnimationFrame(tick);
      else ref.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return display;
}

function Game() {
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [betIndex, setBetIndex] = useState(2);
  const [grid, setGrid] = useState<Grid>(() => randomGrid());
  const [spinId, setSpinId] = useState(0);
  const [spinningReels, setSpinningReels] = useState([false, false, false, false, false]);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [activeLine, setActiveLine] = useState<LineWin | null>(null);
  const [jackpots, setJackpots] = useState<JackpotState>(DEFAULT_JACKPOTS);
  const [freeSpins, setFreeSpins] = useState(0);
  const [muted, setMutedState] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [auto, setAuto] = useState(false);
  const [paytableOpen, setPaytableOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const [strobe, setStrobe] = useState(false);
  const [coins, setCoins] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hoverSpin, setHoverSpin] = useState(false);

  const busy = spinningReels.some(Boolean);
  const bet = BET_STEPS[betIndex] ?? 5;
  const displayBalance = useOdometer(balance);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- persistence -------------------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem("neon-mega-jackpot");
      if (raw) {
        const saved = JSON.parse(raw) as {
          balance?: number;
          jackpots?: JackpotState;
          betIndex?: number;
        };
        if (typeof saved.balance === "number") setBalance(saved.balance);
        if (saved.jackpots) setJackpots(saved.jackpots);
        if (typeof saved.betIndex === "number") setBetIndex(saved.betIndex);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "neon-mega-jackpot",
        JSON.stringify({ balance, jackpots, betIndex }),
      );
    } catch {
      /* storage unavailable */
    }
  }, [balance, jackpots, betIndex]);

  useEffect(() => setMuted(muted), [muted]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Progressive meters creep upward continuously.
  useEffect(() => {
    const id = setInterval(() => {
      setJackpots((j) => ({
        mini: j.mini + Math.random() * 2,
        minor: j.minor + Math.random() * 6,
        major: j.major + Math.random() * 14,
        mega: j.mega + Math.random() * 40,
      }));
    }, 900);
    return () => clearInterval(id);
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const celebrate = useCallback((res: SpinResult, stake: number) => {
    setStrobe(true);
    later(() => setStrobe(false), 1400);

    if (res.jackpot) {
      sfx.jackpot();
      setShake(true);
      setCoins(true);
      setMegaOpen(true);
      confetti({ particleCount: 220, spread: 120, origin: { y: 0.6 }, startVelocity: 55 });
      later(() => confetti({ particleCount: 160, spread: 160, origin: { x: 0.1, y: 0.7 } }), 300);
      later(() => confetti({ particleCount: 160, spread: 160, origin: { x: 0.9, y: 0.7 } }), 600);
      later(() => setShake(false), 1200);
      later(() => setCoins(false), 7000);
    } else if (res.totalWin >= stake * 10) {
      sfx.bigWin();
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.65 } });
    } else if (res.totalWin > 0) {
      sfx.win();
    }
  }, []);

  const doSpin = useCallback(() => {
    if (busy) return;
    const usingFree = freeSpins > 0;
    if (!usingFree && balance < bet) {
      setToast("Not enough chips — reset your fun balance below.");
      later(() => setToast(null), 2600);
      return;
    }

    const multiplier = usingFree ? 3 : 1;
    if (usingFree) setFreeSpins((f) => f - 1);
    else {
      setBalance((b) => b - bet);
      // 0.1% of every stake feeds the MEGA meter.
      setJackpots((j) => ({ ...j, mega: j.mega + bet * 0.001 }));
    }

    setResult(null);
    setActiveLine(null);
    setMegaOpen(false);
    sfx.spinStart();

    const res = spinEngine(bet, multiplier);
    setGrid(res.grid);
    setSpinId((n) => n + 1);
    setSpinningReels([true, true, true, true, true]);

    const base = turbo ? 450 : 900;
    const step = turbo ? 100 : 220;
    for (let i = 0; i < 5; i++) {
      later(() => sfx.tick(i), i * 120);
      later(() => {
        sfx.reelStop(i);
        setSpinningReels((prev) => prev.map((s, idx) => (idx === i ? false : s)));
      }, base + i * step);
    }

    later(() => {
      setResult(res);
      if (res.totalWin > 0) {
        setBalance((b) => b + res.totalWin);
        sfx.coin();
        celebrate(res, bet);
        setToast(
          res.jackpot
            ? `JACKPOT! +${formatChips(res.totalWin)} chips`
            : `Win +${formatChips(res.totalWin)} chips`,
        );
        later(() => setToast(null), 3000);
      }
      if (res.freeSpinsAwarded) {
        setFreeSpins((f) => f + res.freeSpinsAwarded);
        setToast(`${res.freeSpinsAwarded} FREE SPINS · x3 multiplier`);
        later(() => setToast(null), 3400);
      }
    }, base + 4 * step + 120);
  }, [balance, bet, busy, celebrate, freeSpins, turbo]);

  // Cycle through winning paylines once the reels settle.
  useEffect(() => {
    if (!result?.lineWins.length) {
      setActiveLine(null);
      return;
    }
    let i = 0;
    setActiveLine(result.lineWins[0] ?? null);
    const id = setInterval(() => {
      i = (i + 1) % result.lineWins.length;
      setActiveLine(result.lineWins[i] ?? null);
    }, 1400);
    return () => clearInterval(id);
  }, [result]);

  // Auto-spin loop.
  useEffect(() => {
    if (!auto || busy) return;
    const id = setTimeout(doSpin, 1500);
    return () => clearTimeout(id);
  }, [auto, busy, doSpin]);

  // Keyboard + swipe to spin.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        doSpin();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doSpin]);

  const touchStart = useRef<number | null>(null);
  const winningCells = useMemo(() => result?.winningCells ?? [], [result]);

  return (
    <main className="relative min-h-screen overflow-x-hidden px-3 py-5 sm:px-6 sm:py-8">
      <NeonBackground freeSpins={freeSpins > 0} />
      <CoinRain active={coins} />
      {strobe && (
        <div className="strobe-flash pointer-events-none fixed inset-0 z-30 bg-white" />
      )}

      <div className="mx-auto w-full max-w-4xl">
        {/* Top bar ------------------------------------------------------- */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-[var(--neon-gold)] drop-shadow-[0_0_20px_var(--neon-gold)] sm:text-3xl">
              NEON MEGA JACKPOT
            </h1>
            <p className="text-[0.65rem] tracking-[0.3em] text-[var(--neon-pink)]">
              FUN CHIPS ONLY · NO REAL MONEY
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-[var(--neon-gold)]/35 bg-white/5 px-4 py-2 text-right backdrop-blur-xl">
              <div className="text-[0.6rem] tracking-[0.25em] text-muted-foreground">BALANCE</div>
              <div className="font-display text-xl font-bold tabular-nums text-[var(--neon-gold)]">
                {formatChips(displayBalance)}
              </div>
            </div>
            <IconButton
              label="Shop (demo)"
              onClick={() => {
                setToast("The shop is decorative — nothing is for sale here.");
                later(() => setToast(null), 2600);
              }}
            >
              <ShoppingBag size={18} />
            </IconButton>
            <IconButton label="Paytable" onClick={() => setPaytableOpen(true)}>
              <BookOpen size={18} />
            </IconButton>
            <IconButton
              label={muted ? "Unmute" : "Mute"}
              onClick={() => setMutedState((m) => !m)}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </IconButton>
          </div>
        </header>

        <JackpotBar jackpots={jackpots} />

        {/* Machine -------------------------------------------------------- */}
        <motion.section
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setTilt({
              x: ((e.clientY - r.top) / r.height - 0.5) * -8,
              y: ((e.clientX - r.left) / r.width - 0.5) * 8,
            });
          }}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          onTouchStart={(e) => (touchStart.current = e.touches[0]?.clientY ?? null)}
          onTouchEnd={(e) => {
            if (touchStart.current === null) return;
            if (touchStart.current - (e.changedTouches[0]?.clientY ?? 0) > 60) doSpin();
            touchStart.current = null;
          }}
          animate={{
            rotateX: tilt.x,
            rotateY: tilt.y,
            x: shake ? [0, -14, 12, -8, 6, 0] : hoverSpin ? [0, -1.5, 1.5, 0] : 0,
            y: shake ? [0, 10, -8, 5, 0] : 0,
          }}
          transition={
            shake
              ? { duration: 0.35, repeat: 3 }
              : hoverSpin
                ? { duration: 0.25, repeat: Infinity }
                : { type: "spring", stiffness: 140, damping: 18 }
          }
          style={{ transformPerspective: 1200 }}
          className="mt-4 rounded-3xl border-2 border-[var(--neon-gold)]/25 bg-white/5 p-3 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),inset_0_0_80px_rgba(255,214,102,0.06)] sm:p-5"
        >
          {freeSpins > 0 && (
            <div className="mb-3 rounded-xl border border-[var(--neon-violet)]/50 bg-[var(--neon-violet)]/10 py-2 text-center font-display text-sm tracking-[0.2em] text-[var(--neon-violet)]">
              FREE SPINS: {freeSpins} · MULTIPLIER x3
            </div>
          )}

          <ReelGrid
            grid={grid}
            spinId={spinId}
            spinningReels={spinningReels}
            turbo={turbo}
            winningCells={winningCells}
            activeLine={activeLine}
          />

          {/* Controls ---------------------------------------------------- */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-2 py-1.5">
              <IconButton
                label="Lower bet"
                onClick={() => setBetIndex((i) => Math.max(0, i - 1))}
              >
                <Minus size={16} />
              </IconButton>
              <div className="min-w-20 text-center">
                <div className="text-[0.55rem] tracking-[0.25em] text-muted-foreground">BET</div>
                <div className="font-display text-lg font-bold tabular-nums text-foreground">
                  {bet}
                </div>
              </div>
              <IconButton
                label="Raise bet"
                onClick={() => setBetIndex((i) => Math.min(BET_STEPS.length - 1, i + 1))}
              >
                <Plus size={16} />
              </IconButton>
            </div>

            <button
              onClick={() => setBetIndex(BET_STEPS.length - 1)}
              className="rounded-xl border border-[var(--neon-pink)]/45 px-4 py-3 font-display text-xs tracking-[0.2em] text-[var(--neon-pink)] transition hover:scale-105 hover:bg-[var(--neon-pink)]/10"
            >
              MAX BET
            </button>

            <motion.button
              onClick={doSpin}
              disabled={busy}
              onHoverStart={() => setHoverSpin(true)}
              onHoverEnd={() => setHoverSpin(false)}
              whileTap={{ scale: 0.94 }}
              className="rounded-full bg-[linear-gradient(135deg,var(--neon-gold),oklch(0.72_0.18_60),var(--neon-gold))] px-10 py-4 font-display text-lg font-black tracking-[0.2em] text-[oklch(0.15_0.03_60)] shadow-[0_0_50px_rgba(234,179,8,0.7)] transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "SPINNING" : freeSpins > 0 ? "FREE SPIN" : "SPIN"}
            </motion.button>

            <button
              onClick={() => setAuto((a) => !a)}
              className={`rounded-xl border px-4 py-3 font-display text-xs tracking-[0.2em] transition hover:scale-105 ${
                auto
                  ? "border-[var(--neon-lime)] bg-[var(--neon-lime)]/15 text-[var(--neon-lime)]"
                  : "border-white/20 text-foreground/70"
              }`}
            >
              AUTO
            </button>

            <button
              onClick={() => setTurbo((t) => !t)}
              aria-label="Turbo mode"
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-3 font-display text-xs tracking-[0.2em] transition hover:scale-105 ${
                turbo
                  ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)]"
                  : "border-white/20 text-foreground/70"
              }`}
            >
              <Zap size={14} /> TURBO
            </button>
          </div>
        </motion.section>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            Swipe up or press Space to spin. 20 paylines. Every chip here is fictional — this is a
            visual demo, not gambling.
          </p>
          <button
            onClick={() => {
              setBalance(STARTING_BALANCE);
              setFreeSpins(0);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 transition hover:bg-white/10"
          >
            <RefreshCw size={13} /> Reset fun balance
          </button>
        </footer>
      </div>

      {/* Win toast -------------------------------------------------------- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-[var(--neon-gold)]/60 bg-black/80 px-6 py-2.5 font-display text-sm tracking-[0.15em] text-[var(--neon-gold)] backdrop-blur-xl shadow-[0_0_40px_rgba(234,179,8,0.45)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <Paytable open={paytableOpen} onClose={() => setPaytableOpen(false)} />
      <MegaWinModal
        open={megaOpen}
        amount={result?.totalWin ?? 0}
        onClose={() => setMegaOpen(false)}
      />
    </main>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-xl border border-white/15 bg-white/5 p-2.5 text-foreground/80 backdrop-blur-xl transition hover:scale-105 hover:border-[var(--neon-gold)]/50 hover:text-[var(--neon-gold)]"
    >
      {children}
    </button>
  );
}
