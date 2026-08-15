// ---------------------------------------------------------------------------
// graph.ts — knowledge graph visualization (canvas).
// A dependency-free force-directed layout built from graph-data.json (wiki
// links extracted from the Markdown files). Supports drag, hover tooltips,
// click-to-open, wheel zoom, pinch zoom, pan and category filtering.
// ---------------------------------------------------------------------------

interface GraphNodeData {
  slug: string;
  title: string;
  category: string;
  subcategory?: string;
  tags: string[];
  links: string[];
  unresolved: number;
}

interface GraphLinkData {
  source: string;
  target: string;
}

interface GraphPayload {
  nodes: GraphNodeData[];
  links: GraphLinkData[];
}

interface SimNode extends GraphNodeData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  degree: number;
  color: string;
  hidden: boolean;
}

const stage = document.querySelector<HTMLElement>('.graph-stage');
const canvas = document.getElementById('graph-canvas') as HTMLCanvasElement | null;
if (stage && canvas) init(stage, canvas);

const CATEGORY_VARS = ['--accent', '--st-note', '--st-imp', '--st-warn', '--st-tip', '--st-danger'];

function init(stage: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const base = document.documentElement.dataset.base || '/';
  const withBase = (p: string) => (base === '/' ? p : base.replace(/\/$/, '') + p);
  const tooltip = document.getElementById('graph-tooltip') as HTMLDivElement | null;
  const legend = document.getElementById('graph-legend');
  const fallback = document.getElementById('graph-fallback-list');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;

  let nodes: SimNode[] = [];
  let adj = new Map<string, Set<string>>();
  let categories: string[] = [];
  let hiddenCats = new Set<string>();

  // view transform
  let scale = 1;
  let tx = 0;
  let ty = 0;

  // interaction state
  let hoverNode: SimNode | null = null;
  let dragNode: SimNode | null = null;
  let panning = false;
  let panStart = { x: 0, y: 0, tx: 0, ty: 0 };
  let moved = false;
  let raf = 0;
  let running = true;

  let colors = new Map<string, string>();
  let labelColor = '#8a8f94';

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    colors = new Map(
      CATEGORY_VARS.map((v) => [v, cs.getPropertyValue(v).trim() || '#0f766e'])
    );
    labelColor = cs.getPropertyValue('--muted').trim() || '#8a8f94';
  }

  function resize() {
    w = stage!.clientWidth;
    h = stage!.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * DPR));
    canvas.height = Math.max(1, Math.floor(h * DPR));
    ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
  }

  function worldToScreen(n: SimNode): { x: number; y: number } {
    return { x: n.x * scale + tx, y: n.y * scale + ty };
  }

  function screenToWorld(x: number, y: number): { x: number; y: number } {
    return { x: (x - tx) / scale, y: (y - ty) / scale };
  }

  function nodeRadius(n: SimNode): number {
    return Math.min(9, 3 + Math.sqrt(n.degree) * 1.6);
  }

  function buildSim(data: GraphPayload) {
    categories = [...new Set(data.nodes.map((n) => n.category))];
    adj = new Map();
    for (const n of data.nodes) adj.set(n.slug, new Set());
    for (const l of data.links) {
      adj.get(l.source)?.add(l.target);
      adj.get(l.target)?.add(l.source);
    }

    nodes = data.nodes.map((n, i) => {
      const angle = (i / Math.max(1, data.nodes.length)) * Math.PI * 2;
      const radius = Math.min(w, h) * 0.32;
      return {
        ...n,
        degree: adj.get(n.slug)?.size ?? 0,
        color: colors.get(CATEGORY_VARS[categories.indexOf(n.category) % CATEGORY_VARS.length]) ?? '#0f766e',
        hidden: false,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    renderLegend();
    renderFallback();
    if (reduced.matches) draw();
    else start();
  }

  function renderLegend() {
    if (!legend) return;
    legend.innerHTML = '';
    for (const cat of categories) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.setAttribute('aria-pressed', 'true');
      const dot = document.createElement('span');
      dot.className = 'status-dot';
      dot.style.background = colors.get(CATEGORY_VARS[categories.indexOf(cat) % CATEGORY_VARS.length]) ?? '';
      const count = nodes.filter((n) => n.category === cat).length;
      chip.appendChild(dot);
      chip.appendChild(document.createTextNode(cat));
      const c = document.createElement('span');
      c.className = 'chip-count';
      c.textContent = String(count);
      chip.appendChild(c);
      chip.addEventListener('click', () => {
        if (hiddenCats.has(cat)) {
          hiddenCats.delete(cat);
          chip.classList.add('active');
        } else {
          hiddenCats.add(cat);
          chip.classList.remove('active');
        }
        chip.setAttribute('aria-pressed', String(!hiddenCats.has(cat)));
        for (const n of nodes) n.hidden = hiddenCats.has(n.category);
      });
      chip.classList.add('active');
      legend.appendChild(chip);
    }
  }

  function renderFallback() {
    if (!fallback) return;
    fallback.innerHTML = '';
    const sorted = [...nodes].sort((a, b) => a.title.localeCompare(b.title));
    for (const n of sorted) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = withBase('/notes/' + n.slug + '/');
      a.innerHTML =
        '<span class="text-xs text-subtle font-mono mr-2">' +
        n.category +
        '</span>' +
        '<span class="text-fg">' +
        escapeHtml(n.title) +
        '</span>';
      li.appendChild(a);
      fallback.appendChild(li);
    }
  }

  function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ----------------------------------------------------------- physics ----
  function physicsStep() {
    const k = 62;
    const k2 = k * k;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = Math.max(dx * dx + dy * dy, 0.01);
        const f = k2 / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    const rest = 88;
    for (const [src, targets] of adj) {
      const a = nodes.find((n) => n.slug === src);
      if (!a) continue;
      for (const t of targets) {
        const b = nodes.find((n) => n.slug === t);
        if (!b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
        const f = (d - rest) * 0.006;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }

    for (const n of nodes) {
      if (n === dragNode) continue;
      // gentle gravity toward the center
      n.vx -= n.x * 0.0009;
      n.vy -= n.y * 0.0009;
      n.vx *= 0.86;
      n.vy *= 0.86;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  // ---------------------------------------------------------- rendering ----
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    // edges
    ctx.lineWidth = 1 / scale;
    for (const [src, targets] of adj) {
      const a = nodes.find((n) => n.slug === src);
      if (!a || a.hidden) continue;
      for (const t of targets) {
        const b = nodes.find((n) => n.slug === t);
        if (!b || b.hidden) continue;
        const pa = worldToScreen(a);
        const pb = worldToScreen(b);
        const highlight = hoverNode === a || hoverNode === b;
        ctx.strokeStyle = highlight
          ? a.color
          : 'rgba(128,128,128,0.22)';
        ctx.globalAlpha = highlight ? 0.9 : 0.6;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // nodes
    for (const n of nodes) {
      if (n.hidden) continue;
      const p = worldToScreen(n);
      const r = nodeRadius(n) * Math.max(scale, 0.7);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.globalAlpha = hoverNode === n ? 1 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (hoverNode === n) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // labels for well-connected nodes or at higher zoom
      if ((n.degree >= 2 || scale > 1.35 || hoverNode === n) && scale > 0.5) {
        ctx.font = `${11 / Math.min(scale, 1.6)}px 'JetBrains Mono Variable', ui-monospace, monospace`;
        ctx.fillStyle = hoverNode === n ? n.color : labelColor;
        ctx.textAlign = 'center';
        ctx.fillText(n.title, p.x, p.y - r - 6 / scale);
      }
    }
  }

  function frame() {
    if (!running || reduced.matches) return;
    for (let i = 0; i < 3; i++) physicsStep();
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

  // --------------------------------------------------------- interaction ---
  function findNodeAt(x: number, y: number): SimNode | null {
    const wpt = screenToWorld(x, y);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (n.hidden) continue;
      const dx = n.x - wpt.x;
      const dy = n.y - wpt.y;
      const r = Math.max(nodeRadius(n) + 5 / scale, 8 / scale);
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }

  function pointerPos(e: { clientX: number; clientY: number }) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function showTooltip(e: PointerEvent, n: SimNode) {
    if (!tooltip) return;
    const rect = stage!.getBoundingClientRect();
    tooltip.textContent = n.title + ' · ' + n.category + (n.degree > 0 ? ' · ' + n.degree + ' 条链接' : '');
    tooltip.classList.add('visible');
    const pad = 12;
    let left = e.clientX - rect.left + pad;
    let top = e.clientY - rect.top + pad;
    if (left + tooltip.offsetWidth > rect.width) left = e.clientX - rect.left - tooltip.offsetWidth - pad;
    if (top + tooltip.offsetHeight > rect.height) top = e.clientY - rect.top - tooltip.offsetHeight - pad;
    tooltip.style.left = Math.max(4, left) + 'px';
    tooltip.style.top = Math.max(4, top) + 'px';
  }

  function hideTooltip() {
    tooltip?.classList.remove('visible');
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const p = pointerPos(e);
    const n = findNodeAt(p.x, p.y);
    moved = false;
    if (n) {
      dragNode = n;
      n.vx = 0;
      n.vy = 0;
    } else {
      panning = true;
      canvas.classList.add('dragging');
      panStart = { x: p.x, y: p.y, tx, ty };
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const p = pointerPos(e);
    if (dragNode) {
      const wpt = screenToWorld(p.x, p.y);
      const dx = wpt.x - dragNode.x;
      const dy = wpt.y - dragNode.y;
      if (Math.abs(dx) + Math.abs(dy) > 2 / scale) moved = true;
      dragNode.x = wpt.x;
      dragNode.y = wpt.y;
      hideTooltip();
      return;
    }
    if (panning) {
      tx = panStart.tx + (p.x - panStart.x);
      ty = panStart.ty + (p.y - panStart.y);
      return;
    }
    const n = findNodeAt(p.x, p.y);
    if (n !== hoverNode) {
      hoverNode = n;
      canvas.style.cursor = n ? 'pointer' : 'grab';
      if (n) showTooltip(e, n);
      else hideTooltip();
    } else if (n) {
      showTooltip(e, n);
    }
  });

  canvas.addEventListener('pointerup', () => {
    if (dragNode && !moved) {
      window.location.href = withBase('/notes/' + dragNode.slug + '/');
    }
    dragNode = null;
    panning = false;
    canvas.classList.remove('dragging');
  });

  canvas.addEventListener('pointerleave', () => {
    hoverNode = null;
    hideTooltip();
    if (!panning) canvas.style.cursor = 'grab';
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = pointerPos(e);
    const factor = Math.exp(-e.deltaY * 0.0012);
    const next = Math.min(3, Math.max(0.35, scale * factor));
    tx = p.x - ((p.x - tx) / scale) * next;
    ty = p.y - ((p.y - ty) / scale) * next;
    scale = next;
  }, { passive: false });

  // pinch zoom (basic two-pointer)
  let pinchDist = 0;
  const pointers = new Map<number, { x: number; y: number }>();

  canvas.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, pointerPos(e));
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      panning = false;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, pointerPos(e));
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0) {
        const factor = d / pinchDist;
        const next = Math.min(3, Math.max(0.35, scale * factor));
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        tx = mid.x - ((mid.x - tx) / scale) * next;
        ty = mid.y - ((mid.y - ty) / scale) * next;
        scale = next;
      }
      pinchDist = d;
    }
  });

  const releasePointer = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    pinchDist = 0;
  };
  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);

  // controls
  document.getElementById('graph-zoom-in')?.addEventListener('click', () => {
    scale = Math.min(3, scale * 1.25);
  });
  document.getElementById('graph-zoom-out')?.addEventListener('click', () => {
    scale = Math.max(0.35, scale / 1.25);
  });
  document.getElementById('graph-reset')?.addEventListener('click', resetView);

  // ------------------------------------------------------------- boot -----
  resize();
  readColors();
  fetch(base + 'graph-data.json')
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json() as Promise<GraphPayload>;
    })
    .then((data) => buildSim(data))
    .catch((err) => {
      stage!.innerHTML =
        '<div class="empty-state">知识图谱加载失败：' +
        escapeHtml(String(err?.message ?? err)) +
        '</div>';
    });

  window.addEventListener('resize', () => {
    resize();
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
