// ---------------------------------------------------------------------------
// hero.ts — very restrained animated background for the home hero.
// A sparse field of slowly drifting nodes with faint connections: a quiet
// nod to the knowledge graph. Low opacity, capped DPR, paused when the tab is
// hidden and disabled entirely under prefers-reduced-motion.
// ---------------------------------------------------------------------------

const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
if (canvas) init(canvas);

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function init(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const COUNT = 44;
  const LINK_DIST = 120;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let w = 0;
  let h = 0;
  let raf = 0;
  let running = true;
  let dots: Dot[] = [];
  let dotRgb: Rgb = { r: 130, g: 130, b: 120 };
  let linkRgb: Rgb = { r: 15, g: 118, b: 110 };

  function parseHex(hex: string): Rgb {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    if (!m) return { r: 120, g: 120, b: 120 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    linkRgb = parseHex(cs.getPropertyValue('--accent').trim());
    dotRgb = parseHex(cs.getPropertyValue('--border-strong').trim());
  }

  function rgba(c: Rgb, a: number): string {
    return `rgba(${c.r},${c.g},${c.b},${a})`;
  }

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * DPR));
    canvas.height = Math.max(1, Math.floor(h * DPR));
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function seed() {
    dots = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      r: 0.7 + Math.random() * 1.1,
    }));
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];
      for (let j = i + 1; j < dots.length; j++) {
        const b = dots[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const t = 1 - Math.sqrt(d2) / LINK_DIST;
          ctx.strokeStyle = rgba(linkRgb, t * t * 0.16);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = rgba(dotRgb, 0.45);
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step() {
    for (const d of dots) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < -10) d.x = w + 10;
      if (d.x > w + 10) d.x = -10;
      if (d.y < -10) d.y = h + 10;
      if (d.y > h + 10) d.y = -10;
    }
  }

  function frame() {
    if (!running || reduced.matches) return;
    step();
    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduced.matches) {
      draw();
      return;
    }
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  resize();
  seed();
  readColors();
  start();

  window.addEventListener('resize', () => {
    resize();
    seed();
    if (reduced.matches) draw();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  window.addEventListener('themechange', () => {
    readColors();
    if (reduced.matches) draw();
  });
}

export {};
