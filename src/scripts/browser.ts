// ---------------------------------------------------------------------------
// browser.ts — client-side notes browser (category / tag / search / sort /
// difficulty / status filters). Data is inlined into the page as JSON, so the
// browser works entirely offline and without extra requests.
// ---------------------------------------------------------------------------

interface BrowserNote {
  slug: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  status: string;
  statusLabel: string;
  difficulty: string;
  created: string;
  updated: string;
  minutes: number;
}

const dataEl = document.getElementById('notes-data-host');
if (dataEl?.dataset.notes) init(JSON.parse(dataEl.dataset.notes) as BrowserNote[]);

function init(notes: BrowserNote[]) {
  const base = document.documentElement.dataset.base || '/';
  const withBase = (p: string) => (base === '/' ? p : base.replace(/\/$/, '') + p);

  const list = document.getElementById('browser-list')!;
  const count = document.getElementById('browser-count')!;
  const search = document.getElementById('browser-search') as HTMLInputElement | null;
  const sortEl = document.getElementById('browser-sort') as HTMLSelectElement | null;
  const diffEl = document.getElementById('browser-difficulty') as HTMLSelectElement | null;
  const statusEl = document.getElementById('browser-status') as HTMLSelectElement | null;
  const tagRow = document.getElementById('browser-tags');

  const params = new URLSearchParams(window.location.search);
  const state = {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    subcategory: params.get('subcategory') ?? '',
    tag: params.get('tag') ?? '',
    sort: params.get('sort') ?? 'updated',
    difficulty: params.get('difficulty') ?? '',
    status: params.get('status') ?? '',
  };

  if (search) {
    search.value = state.q;
    let timer = 0;
    search.addEventListener('input', () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        state.q = search.value.trim();
        render();
      }, 140);
    });
  }
  sortEl?.addEventListener('change', () => ((state.sort = sortEl.value), render()));
  diffEl?.addEventListener('change', () => ((state.difficulty = diffEl.value), render()));
  statusEl?.addEventListener('change', () => ((state.status = statusEl.value), render()));

  // tag chips (single-select toggle)
  if (tagRow) {
    tagRow.querySelectorAll<HTMLButtonElement>('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag ?? '';
        state.tag = state.tag === tag ? '' : tag;
        tagRow.querySelectorAll<HTMLButtonElement>('.chip').forEach((c) => c.classList.toggle('active', c.dataset.tag === state.tag));
        render();
      });
      if (chip.dataset.tag === state.tag) chip.classList.add('active');
    });
  }

  // sidebar category / subcategory
  document.querySelectorAll<HTMLButtonElement>('.sidebar-category').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.category ?? '';
      state.category = cat;
      state.subcategory = '';
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>('.sidebar-sub').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sub = btn.dataset.sub ?? '';
      state.subcategory = state.subcategory === sub ? '' : sub;
      render();
    });
  });

  function matches(n: BrowserNote): boolean {
    if (state.category && n.category !== state.category) return false;
    if (state.subcategory && n.subcategory !== state.subcategory) return false;
    if (state.tag && !n.tags.includes(state.tag)) return false;
    if (state.difficulty && n.difficulty !== state.difficulty) return false;
    if (state.status && n.status !== state.status) return false;
    if (state.q) {
      const hay = (n.title + ' ' + n.description + ' ' + n.tags.join(' ') + ' ' + n.category).toLowerCase();
      if (!hay.includes(state.q.toLowerCase())) return false;
    }
    return true;
  }

  function render() {
    const filtered = notes
      .filter(matches)
      .sort((a, b) => {
        if (state.sort === 'created') return b.created.localeCompare(a.created);
        if (state.sort === 'title') return a.title.localeCompare(b.title);
        return b.updated.localeCompare(a.updated);
      });

    // update sidebar active states
    document.querySelectorAll<HTMLButtonElement>('.sidebar-category').forEach((btn) => {
      btn.classList.toggle('active', (btn.dataset.category ?? '') === state.category);
    });
    document.querySelectorAll<HTMLButtonElement>('.sidebar-sub').forEach((btn) => {
      btn.classList.toggle('active', (btn.dataset.sub ?? '') === state.subcategory);
    });

    count.textContent = filtered.length + ' / ' + notes.length + ' 篇笔记';

    list.innerHTML = '';
    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state">没有符合当前筛选条件的笔记。</div>';
      return;
    }
    for (const n of filtered) list.appendChild(buildCard(n));
  }

  function buildCard(n: BrowserNote): HTMLElement {
    const a = document.createElement('a');
    a.className = 'note-card';
    a.href = withBase('/notes/' + n.slug + '/');

    const top = document.createElement('div');
    top.className = 'flex items-center justify-between gap-3';
    const cat = document.createElement('span');
    cat.className = 'text-xs text-subtle font-mono';
    cat.textContent = n.subcategory ? n.category + ' · ' + n.subcategory : n.category;
    const badge = document.createElement('span');
    badge.className = 'status-badge status-' + n.status;
    badge.innerHTML = '<span class="status-dot" aria-hidden="true"></span>' + n.statusLabel;
    top.appendChild(cat);
    top.appendChild(badge);

    const title = document.createElement('h3');
    title.className = 'note-card-title';
    title.textContent = n.title;

    const desc = document.createElement('p');
    desc.className = 'note-card-desc';
    desc.textContent = n.description || '';

    const meta = document.createElement('div');
    meta.className = 'note-card-meta';
    for (const t of n.tags.slice(0, 4)) {
      const s = document.createElement('span');
      s.className = 'text-accent';
      s.textContent = '#' + t;
      meta.appendChild(s);
    }
    meta.appendChild(sep());
    const time = document.createElement('time');
    time.dateTime = n.updated;
    time.textContent = formatShort(new Date(n.updated));
    meta.appendChild(time);
    meta.appendChild(sep());
    const mins = document.createElement('span');
    mins.textContent = '约 ' + n.minutes + ' 分钟';
    meta.appendChild(mins);

    a.appendChild(top);
    a.appendChild(title);
    if (n.description) a.appendChild(desc);
    a.appendChild(meta);
    return a;
  }

  function sep(): HTMLSpanElement {
    const s = document.createElement('span');
    s.setAttribute('aria-hidden', 'true');
    s.textContent = '·';
    return s;
  }

  function formatShort(d: Date): string {
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  render();
}

export {};
