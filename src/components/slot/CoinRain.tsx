import { useEffect, useRef } from "react";

interface Coin {
  x: number;
  y: number;
  vy: number;
  vx: number;
  r: number;
  spin: number;
  phase: number;
}

/** Canvas shower of 200 gold coins, used for jackpot celebrations. */
export function CoinRain({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const coins: Coin[] = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * canvas.height,
      vy: 2 + Math.random() * 5,
      vx: (Math.random() - 0.5) * 1.5,
      r: 7 + Math.random() * 11,
      spin: 0.04 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const c of coins) {
        c.y += c.vy;
        c.x += c.vx;
        c.phase += c.spin;
        if (c.y - c.r > canvas.height) {
          c.y = -c.r;
          c.x = Math.random() * canvas.width;
        }
        const w = Math.abs(Math.cos(c.phase)) * c.r + 1.5;
        const g = ctx.createLinearGradient(c.x - w, c.y - c.r, c.x + w, c.y + c.r);
        g.addColorStop(0, "#fff3b0");
        g.addColorStop(0.5, "#f5c542");
        g.addColorStop(1, "#b07d12");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, w, c.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,240,180,0.85)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active) return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-40" />;
}
