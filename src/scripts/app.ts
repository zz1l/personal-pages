// ---------------------------------------------------------------------------
// app.ts — global client behaviours (small, dependency-free core bundle)
// theme · header · mobile menu · reading progress · back-to-top · reveal
// code copy · table of contents · mermaid (lazy) · command palette (lazy Fuse)
// ---------------------------------------------------------------------------

const root = document.documentElement;
const base = root.dataset.base || '/';
const withBase = (p: string) => (base === '/' ? p : base.replace(/\/$/, '') + p);

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- theme ---
function currentTheme(): 'light' | 'dark' {
  return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function setTheme(theme: 'light' | 'dark') {
  root.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('kb-theme', theme);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

// ---------------------------------------------------------------- toast ---
function showToast(message: string) {
  const host = document.getElementById('toast-root')!;
  const wrap = host.querySelector('.toast-wrap') ?? (() => {
    const w = document.createElement('div');
    w.className = 'toast-wrap';
    host.appendChild(w);
    return w;
  })();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  wrap.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// ------------------------------------------------------------ code copy ---
function enhanceCodeBlocks() {
  document
    .querySelectorAll<HTMLElement>('figure[data-rehype-pretty-code-figure]')
    .forEach((figure) => {
      if (figure.parentElement?.classList.contains('code-block')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      figure.parentNode!.insertBefore(wrapper, figure);

      const head = document.createElement('div');
      head.className = 'code-head';

      const lang = document.createElement('span');
      lang.className = 'code-lang';
      lang.textContent = figure.dataset.language || 'code';

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'code-copy';
      copy.textContent = '复制';
      copy.addEventListener('click', () => {
        const pre = figure.querySelector('pre');
        const text = pre?.innerText ?? '';
        const done = () => {
          copy.textContent = '已复制 ✓';
          setTimeout(() => (copy.textContent = '复制'), 1600);
          showToast('代码已复制到剪贴板');
        };
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
        } else {
          fallbackCopy(text, done);
        }
      });

      head.appendChild(lang);
      head.appendChild(copy);
      wrapper.appendChild(head);
      wrapper.appendChild(figure);
    });
}

function fallbackCopy(text: string, done: () => void) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    done();
  } catch {
    showToast('复制失败，请手动选择代码');
  }
  ta.remove();
}

// ------------------------------------------------------------------ toc ---
function slugify(text: string): string {
  const s = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'section';
}

function initToc() {
  const list = document.getElementById('toc-list');
  const content = document.querySelector<HTMLElement>('.article-content');
  if (!list || !content) return;

  const headings = Array.from(content.querySelectorAll<HTMLElement>('h2, h3'));
  if (headings.length < 2) {
    const toc = document.querySelector('.article-toc');
    toc?.remove();
    return;
  }

  const used = new Set<string>();
  headings.forEach((h) => {
    const baseSlug = slugify(h.textContent ?? '');
    let slug = baseSlug;
    let n = 1;
    while (used.has(slug)) slug = `${baseSlug}-${++n}`;
    used.add(slug);
    h.id = slug;

    const li = document.createElement('li');
    li.className = h.tagName === 'H3' ? 'toc-h3' : 'toc-h2';
    const a = document.createElement('a');
    a.href = `#${slug}`;
    a.textContent = h.textContent;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${slug}`);
    });
    li.appendChild(a);
    list.appendChild(li);

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            li.classList.toggle('active', en.isIntersecting);
            if (en.isIntersecting && list.scrollHeight > list.clientHeight) {
              list.scrollTop = (li as HTMLElement & { offsetTop: number }).offsetTop - 60;
            }
          });
        },
        { rootMargin: '-90px 0px -72% 0px', threshold: 0 }
      );
      obs.observe(h);
    }
  });
}

// --------------------------------------------------------------- mermaid ---
type MermaidApi = {
  initialize: (opts: Record<string, unknown>) => void;
  run: (opts: { nodes?: HTMLElement[]; querySelector?: string }) => Promise<unknown>;
};

let mermaidPromise: Promise<MermaidApi> | null = null;

function initMermaid() {
  const blocks = document.querySelectorAll<HTMLElement>('.mermaid');
  if (!blocks.length) return;

  blocks.forEach((el) => {
    if (!el.dataset.code) el.dataset.code = el.textContent ?? '';
  });

  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const mermaid = mod.default as unknown as MermaidApi;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: currentTheme() === 'dark' ? 'dark' : 'neutral',
      });
      return mermaid;
    });
  }

  mermaidPromise
    .then((mermaid) => mermaid.run({ querySelector: '.mermaid' }))
    .catch(() => {
      blocks.forEach((el) => {
        el.classList.add('mermaid-error');
        el.textContent = 'Failed to render diagram.';
      });
    });
}

// -------------------------------------------------------- command palette ---
interface SearchDoc {
  slug: string;
  title: string;
  category: string;
  subcategory?: string;
  tags: string[];
  description: string;
  created: string;
  updated: string;
  content: string;
}

interface PaletteItem {
  key: string;
  label: string;
  hint: string;
  icon: string;
  href?: string;
  action?: () => void;
}

const COMMANDS: PaletteItem[] = [
  { key: 'home', label: '前往首页', hint: '页面', icon: '⌂', href: withBase('/') },
  { key: 'notes', label: '浏览笔记', hint: '页面', icon: '▤', href: withBase('/notes/') },
  { key: 'projects', label: '打开项目', hint: '页面', icon: '⌘', href: withBase('/projects/') },
  { key: 'research', label: '打开研究', hint: '页面', icon: '✎', href: withBase('/research/') },
  { key: 'graph', label: '打开知识图谱', hint: '页面', icon: '◉', href: withBase('/graph/') },
  { key: 'timeline', label: '打开时间线', hint: '页面', icon: '≡', href: withBase('/timeline/') },
  { key: 'stats', label: '打开统计', hint: '页面', icon: 'Σ', href: withBase('/stats/') },
  { key: 'about', label: '打开关于', hint: '页面', icon: '◎', href: withBase('/about/') },
  {
    key: 'theme',
    label: '切换深色模式',
    hint: '操作',
    icon: '◐',
    action: () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark'),
  },
];

let fusePromise: Promise<{ search: (q: string, opts?: { limit?: number }) => { item: SearchDoc }[] }> | null = null;

function getFuse() {
  if (!fusePromise) {
    fusePromise = Promise.all([
      fetch(base + 'search-index.json').then((r) => r.json() as Promise<SearchDoc[]>),
      import('fuse.js'),
    ]).then(([docs, mod]) => {
      const Fuse = mod.default as new (
        docs: SearchDoc[],
        opts: Record<string, unknown>
      ) => { search: (q: string, opts?: { limit?: number }) => { item: SearchDoc }[] };
      return new Fuse(docs, {
        keys: [
          { name: 'title', weight: 4 },
          { name: 'tags', weight: 3 },
          { name: 'category', weight: 2 },
          { name: 'subcategory', weight: 1.5 },
          { name: 'description', weight: 2 },
          { name: 'content', weight: 0.5 },
        ],
        threshold: 0.42,
        ignoreLocation: true,
        minMatchCharLength: 2,
      });
    });
  }
  return fusePromise;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function initPalette() {
  const dialog = document.getElementById('command-palette') as HTMLDialogElement;
  const openBtn = document.getElementById('palette-open')!;
  const input = document.getElementById('palette-input') as HTMLInputElement;
  const results = document.getElementById('palette-results')!;

  let items: PaletteItem[] = [];
  let selected = 0;

  const kbdHint = document.getElementById('kbd-hint');
  if (kbdHint) {
    const isMac = /mac/i.test(navigator.platform || navigator.userAgent);
    kbdHint.textContent = isMac ? '⌘ K' : 'Ctrl K';
  }

  function renderCommands(list: PaletteItem[]) {
    results.innerHTML = '';
    const group = document.createElement('li');
    group.className = 'palette-group';
    group.textContent = '命令';
    results.appendChild(group);
    list.forEach((item, i) => results.appendChild(buildItem(item, i)));
  }

  function renderNotes(docs: SearchDoc[]) {
    results.innerHTML = '';
    const group = document.createElement('li');
    group.className = 'palette-group';
    group.textContent = '笔记';
    results.appendChild(group);
    docs.forEach((doc, i) =>
      results.appendChild(
        buildItem(
          {
            key: 'note:' + doc.slug,
            label: doc.title,
            hint: doc.category + (doc.subcategory ? ' · ' + doc.subcategory : ''),
            icon: '¶',
            href: withBase('/notes/' + doc.slug + '/'),
          },
          i
        )
      )
    );
  }

  function renderLoading() {
    results.innerHTML = '<li class="palette-empty">搜索中…</li>';
  }

  function renderEmpty() {
    results.innerHTML = '<li class="palette-empty">未找到 “' + escapeHtml(input!.value) + '”</li>';
  }

  function buildItem(item: PaletteItem, index: number): HTMLLIElement {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.className = 'palette-item';
    li.dataset.index = String(index);
    li.innerHTML =
      '<span class="item-icon">' + escapeHtml(item.icon) + '</span>' +
      '<span class="item-title">' + escapeHtml(item.label) + '</span>' +
      '<span class="item-hint">' + escapeHtml(item.hint) + '</span>';
    li.addEventListener('mousemove', () => select(index));
    li.addEventListener('click', () => activate(item));
    return li;
  }

  function select(index: number) {
    selected = index;
    Array.from(results.querySelectorAll<HTMLElement>('.palette-item')).forEach((el, i) => {
      const on = i === index;
      el.classList.toggle('selected', on);
      el.setAttribute('aria-selected', String(on));
      if (on) el.scrollIntoView({ block: 'nearest' });
    });
  }

  function activate(item: PaletteItem | undefined) {
    if (!item) return;
    if (item.action) item.action();
    if (item.href) window.location.href = item.href;
    dialog!.close();
  }

  function refresh() {
    const q = input!.value.trim();
    if (!q) {
      items = COMMANDS;
      renderCommands(items);
      select(0);
      return;
    }
    const commandHits = COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()));
    const hits: PaletteItem[] = [...commandHits];
    if (commandHits.length) {
      // show only commands while a command matches
      items = hits;
      renderCommands(hits);
      select(0);
      return;
    }
    renderLoading();
    getFuse()
      .then((fuse) => {
        if (!dialog.open) return;
        const docs = fuse.search(q, { limit: 9 }).map((r) => r.item);
        if (!docs.length) {
          items = [];
          renderEmpty();
          selected = 0;
          return;
        }
        items = docs.map((doc) => ({
          key: 'note:' + doc.slug,
          label: doc.title,
          hint: doc.category + (doc.subcategory ? ' · ' + doc.subcategory : ''),
          icon: '¶',
          href: withBase('/notes/' + doc.slug + '/'),
        }));
        renderNotes(docs);
        select(0);
      })
      .catch(() => {
        if (dialog.open) renderEmpty();
      });
  }

  function open() {
    input!.value = '';
    refresh();
    dialog!.showModal();
    requestAnimationFrame(() => input!.focus());
  }

  openBtn.addEventListener('click', open);

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialog.open) dialog.close();
      else open();
      return;
    }
    if (!dialog.open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length) select(Math.min(selected + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length) select(Math.max(selected - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(items[selected]);
    }
  });

  input.addEventListener('input', refresh);

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    input.value = '';
    items = [];
    selected = 0;
    results.innerHTML = '';
  });
}

// ------------------------------------------------------------- page init ---
function init() {
  document.documentElement.classList.add('js');

  // theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });

  // header shadow + reading progress + back-to-top
  const header = document.getElementById('site-header');
  const progress = document.getElementById('reading-progress');
  const topBtn = document.getElementById('back-to-top');
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const st = window.scrollY || document.documentElement.scrollTop;
      header?.classList.toggle('scrolled', st > 8);
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? Math.min(100, (st / h) * 100) : 0) + '%';
      }
      topBtn?.classList.toggle('visible', st > 480);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  topBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });

  // mobile menu
  const menuBtn = document.getElementById('mobile-menu-btn');
  const panel = document.getElementById('mobile-panel');
  if (menuBtn && panel) {
    menuBtn.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    panel.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        panel.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      })
    );
  }

  // scroll reveal
  if ('IntersectionObserver' in window && !prefersReducedMotion()) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('revealed');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -36px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('revealed'));
  }

  // article enhancements
  enhanceCodeBlocks();
  initToc();
  initMermaid();
  initPalette();

  // re-render mermaid after a theme switch
  window.addEventListener('themechange', () => {
    if (!mermaidPromise) return;
    mermaidPromise.then((mermaid) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: currentTheme() === 'dark' ? 'dark' : 'neutral',
      });
      document.querySelectorAll<HTMLElement>('.mermaid').forEach((el) => {
        if (el.dataset.code) {
          el.textContent = el.dataset.code;
          el.classList.remove('mermaid-error');
        }
      });
      mermaid.run({ querySelector: '.mermaid' }).catch(() => {});
    });
  });
}

init();

export {};
