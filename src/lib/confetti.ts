// ── Canvas confetti — zero dependencies ───────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "rect" | "circle" | "triangle";
}

const COLORS = ["#cafd00", "#ff51fa", "#f3ffca", "#ffd166", "#06d6a0", "#ff5c3a", "#b9f2ff"];

export function launchConfetti(duration = 3000) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  const particles: Particle[] = [];
  const count = Math.min(120, Math.floor(window.innerWidth / 8));

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      shape: (["rect", "circle", "triangle"] as const)[Math.floor(Math.random() * 3)],
    });
  }

  const start = Date.now();
  let raf: number;

  function draw() {
    const elapsed = Date.now() - start;
    const progress = elapsed / duration;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - Math.max(0, progress - 0.6) / 0.4);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(p.size / 2, p.size / 2);
        ctx.lineTo(-p.size / 2, p.size / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    if (elapsed < duration) {
      raf = requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }

  raf = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(raf); canvas.remove(); };
}
