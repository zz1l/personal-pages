import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

// ---------------------------------------------------------------------------
// Knowledge graph derived directly from the Markdown source of truth:
// wiki links ([[...]]) between notes are extracted from the raw files, so the
// graph always reflects the content — no extra config needed.
//
// Resolved against process.cwd() (Astro always runs from the project root)
// because import.meta.url points into the bundled chunk at build time.
// ---------------------------------------------------------------------------

const NOTES_DIR = join(process.cwd(), 'src', 'content', 'notes');

export interface GraphNote {
  slug: string;
  title: string;
  category: string;
  subcategory?: string;
  tags: string[];
  links: string[];
  unresolved: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNote[];
  links: GraphLink[];
}

export interface RelatedNote {
  slug: string;
  title: string;
  category: string;
  subcategory?: string;
  tags: string[];
  score: number;
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkFiles(full));
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

/** [[Target]] titles in a markdown document, ignoring code blocks/spans. */
export function extractWikiTargets(md: string): string[] {
  const stripped = md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const re = /\[\[([^[\]|]+)(?:\|[^\]]+)?\]\]/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped))) out.push(m[1].trim());
  return out;
}

// Punctuation-aware normalization so wiki links match frontmatter titles
// regardless of straight vs curly quotes/dashes (smartypants compatibility).
function normalize(s: string): string {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\s+/g, ' ');
}

interface GraphCache {
  data: GraphData;
  titleToSlug: Map<string, string>;
  bySlug: Map<string, GraphNote>;
}

let cache: GraphCache | null = null;

export function getGraph(): GraphCache {
  if (cache) return cache;

  const titleToSlug = new Map<string, string>();
  const raw: { note: GraphNote; targets: string[] }[] = [];

  for (const file of walkFiles(NOTES_DIR)) {
    const src = readFileSync(file, 'utf8');
    const { data } = matter(src);
    const slug = file.split(/[\\/]/).pop()!.replace(/\.md$/i, '');
    const title = typeof data.title === 'string' && data.title ? data.title : slug;
    titleToSlug.set(normalize(title), slug);
    raw.push({
      note: {
        slug,
        title,
        category: String(data.category ?? 'Other'),
        subcategory: data.subcategory ? String(data.subcategory) : undefined,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        links: [],
        unresolved: 0,
      },
      targets: extractWikiTargets(src),
    });
  }

  const bySlug = new Map<string, GraphNote>();
  for (const r of raw) bySlug.set(r.note.slug, r.note);

  const links: GraphLink[] = [];
  for (const r of raw) {
    for (const t of r.targets) {
      const target = titleToSlug.get(normalize(t));
      if (target && bySlug.has(target) && target !== r.note.slug) {
        if (!r.note.links.includes(target)) r.note.links.push(target);
        if (!links.some((l) => l.source === r.note.slug && l.target === target)) {
          links.push({ source: r.note.slug, target });
        }
      } else {
        r.note.unresolved += 1;
      }
    }
  }

  cache = { data: { nodes: [...bySlug.values()], links }, titleToSlug, bySlug };
  return cache;
}

/**
 * Related notes scored by shared tags (+3), category (+2), subcategory (+1),
 * direct wiki links (+5) and shared link targets (+1). First version is
 * deliberately rule-based — no embeddings needed.
 */
export function relatedNotes(slug: string, limit = 5): RelatedNote[] {
  const { bySlug } = getGraph();
  const current = bySlug.get(slug);
  if (!current) return [];

  const scored: RelatedNote[] = [];
  for (const other of bySlug.values()) {
    if (other.slug === slug) continue;
    let score = 0;
    score += other.tags.filter((t) => current.tags.includes(t)).length * 3;
    if (other.category === current.category) score += 2;
    if (other.subcategory && other.subcategory === current.subcategory) score += 1;
    if (current.links.includes(other.slug) || other.links.includes(slug)) score += 5;
    score += other.links.filter((l) => current.links.includes(l)).length;
    if (score > 0) {
      scored.push({
        slug: other.slug,
        title: other.title,
        category: other.category,
        subcategory: other.subcategory,
        tags: other.tags,
        score,
      });
    }
  }
  return scored
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/** Notes that link to the given note. */
export function backlinks(slug: string): GraphNote[] {
  const { bySlug } = getGraph();
  return [...bySlug.values()].filter((n) => n.links.includes(slug));
}
