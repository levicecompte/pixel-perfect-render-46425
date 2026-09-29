import { useEffect, useRef } from "react";

/** Animated mesh gradient + floating bokeh particles + vignette. */
export function NeonBackground({ freeSpins = false }: { freeSpins?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const palette = ["255,214,102", "255,71,148", "168,110,255", "96,229,255"];
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 2 + Math.random() * 26,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.1 - Math.random() * 0.35,
      alpha: 0.05 + Math.random() * 0.22,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y + p.r < 0) {
          p.y = canvas.height + p.r;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -p.r) p.x = canvas.width + p.r;
        if (p.x > canvas.width + p.r) p.x = -p.r;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(${p.color},${p.alpha})`);
        g.addColorStop(1, `rgba(${p.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className={`absolute -inset-1/4 animate-mesh blur-3xl transition-opacity duration-700 ${
          freeSpins ? "opacity-80" : "opacity-50"
        }`}
        style={{
          background: freeSpins
            ? "radial-gradient(40% 40% at 25% 30%, var(--neon-violet), transparent 70%), radial-gradient(45% 45% at 75% 35%, var(--neon-pink), transparent 70%), radial-gradient(50% 50% at 50% 80%, var(--neon-cyan), transparent 70%)"
            : "radial-gradient(40% 40% at 25% 30%, var(--neon-gold), transparent 70%), radial-gradient(45% 45% at 75% 35%, var(--neon-pink), transparent 70%), radial-gradient(50% 50% at 50% 80%, var(--neon-violet), transparent 70%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </div>
  );
}
