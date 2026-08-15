// ---------------------------------------------------------------------------
// remark-wiki-links.mjs
// Turns [[Note Title]] and [[Note Title|label]] into links to the matching
// note. Titles are resolved against the frontmatter `title` of every file in
// src/content/notes at config-load time. Unresolved targets render as a
// styled "unresolved concept" span (the digital-garden convention).
//
// Note: the title map is built once when the Astro config loads. In `astro
// dev`, restart the dev server after renaming a note so the map refreshes.
// ---------------------------------------------------------------------------
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

// Resolved against process.cwd() (the project root in dev and build), because
// import.meta.url would point into Astro's bundled config chunk.
const NOTES_DIR = join(process.cwd(), 'src', 'content', 'notes');

function walkFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

// Punctuation-aware normalization: Astro's smartypants (enabled by default)
// turns straight quotes into curly ones in rendered prose, while the raw
// frontmatter keeps straight quotes. Normalizing both sides makes matching
// robust regardless of which variant an author typed.
function normalize(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\s+/g, ' ');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTitleToSlug() {
  const map = new Map();
  try {
    for (const file of walkFiles(NOTES_DIR)) {
      const { data } = matter(readFileSync(file, 'utf8'));
      if (data && typeof data.title === 'string' && data.title.trim()) {
        const slug = file.split(/[\\/]/).pop().replace(/\.md$/i, '');
        map.set(normalize(data.title), slug);
      }
    }
  } catch (err) {
    console.warn('[remark-wiki-links] could not scan notes:', err.message);
  }
  return map;
}

// Built lazily on first markdown render (not at module load), because the
// module can be evaluated in contexts where cwd differs from the project root
// (e.g. Astro's bundled config). At render time cwd is always the project root.
let titleToSlugCache = null;

function getTitleToSlug() {
  if (!titleToSlugCache) titleToSlugCache = buildTitleToSlug();
  return titleToSlugCache;
}

const WIKI_RE = /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g;

function transformText(value, titleToSlug) {
  const nodes = [];
  let last = 0;
  let m;
  WIKI_RE.lastIndex = 0;
  while ((m = WIKI_RE.exec(value)) !== null) {
    if (m.index > last) nodes.push({ type: 'text', value: value.slice(last, m.index) });
    const target = m[1].trim();
    const label = (m[2] || m[1]).trim();
    const slug = titleToSlug.get(normalize(target));
    if (slug) {
      // Relative URL works under any Astro `base` (GitHub Pages sub-path or root).
      nodes.push({
        type: 'link',
        url: '../' + slug + '/',
        children: [{ type: 'text', value: label }],
        data: { hProperties: { class: 'wiki-link', 'data-wiki-target': target } },
      });
    } else {
      nodes.push({
        type: 'html',
        value:
          '<span class="wiki-link unresolved" data-wiki-target="' +
          escapeHtml(target) +
          '" title="Unresolved note: ' +
          escapeHtml(target) +
          '">' +
          escapeHtml(label) +
          '</span>',
      });
    }
    last = m.index + m[0].length;
  }
  if (last < value.length) nodes.push({ type: 'text', value: value.slice(last) });
  return nodes;
}

function transformChildren(children, titleToSlug) {
  const out = [];
  for (const node of children) {
    if (node.type === 'text') {
      out.push(...transformText(node.value, titleToSlug));
    } else {
      if (node.children) node.children = transformChildren(node.children, titleToSlug);
      out.push(node);
    }
  }
  return out;
}

export function remarkWikiLinks() {
  return (tree) => {
    const titleToSlug = getTitleToSlug();
    tree.children = transformChildren(tree.children, titleToSlug);
  };
}
