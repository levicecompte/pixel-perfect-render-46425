// Lightweight Web Audio synthesiser — no audio files required.

let ctx: AudioContext | null = null;
let muted = false;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(value: boolean) {
  muted = value;
}

interface ToneOptions {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  sweepTo?: number;
  delay?: number;
}

function tone({ freq, duration, type = "sine", gain = 0.08, sweepTo, delay = 0 }: ToneOptions) {
  const ac = audio();
  if (!ac || muted) return;
  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, start + duration);
  vol.gain.setValueAtTime(0.0001, start);
  vol.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  vol.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(vol).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export const sfx = {
  spinStart() {
    tone({ freq: 160, sweepTo: 520, duration: 0.35, type: "sawtooth", gain: 0.05 });
  },
  tick(index = 0) {
    tone({ freq: 900 + index * 40, duration: 0.05, type: "square", gain: 0.02 });
  },
  reelStop(index = 0) {
    tone({ freq: 220 + index * 30, sweepTo: 110, duration: 0.18, type: "triangle", gain: 0.06 });
  },
  coin() {
    tone({ freq: 1200, duration: 0.09, type: "square", gain: 0.03 });
    tone({ freq: 1800, duration: 0.09, type: "square", gain: 0.02, delay: 0.05 });
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) =>
      tone({ freq: f, duration: 0.22, type: "triangle", gain: 0.06, delay: i * 0.08 }),
    );
  },
  bigWin() {
    [392, 523, 659, 784, 1046, 1318].forEach((f, i) =>
      tone({ freq: f, duration: 0.3, type: "sawtooth", gain: 0.05, delay: i * 0.1 }),
    );
  },
  jackpot() {
    for (let i = 0; i < 6; i++) {
      tone({ freq: 440, sweepTo: 1200, duration: 0.3, type: "sawtooth", gain: 0.07, delay: i * 0.3 });
      tone({ freq: 1200, sweepTo: 440, duration: 0.3, type: "sawtooth", gain: 0.05, delay: i * 0.3 + 0.15 });
    }
  },
};
