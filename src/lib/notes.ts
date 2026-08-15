import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'notes'>;

/** All published notes, sorted by last-updated (newest first). */
export async function getAllNotes(opts: { includeDrafts?: boolean } = {}): Promise<Note[]> {
  const all = await getCollection('notes');
  const notes = opts.includeDrafts ? all : all.filter((n) => !n.data.draft);
  return notes.sort((a, b) => updated(b).getTime() - updated(a).getTime());
}

/** URL slug of a note: file name (basename) without extension. */
export function noteSlug(note: Note): string {
  return note.id.split('/').pop() ?? note.id;
}

export function updated(note: Note): Date {
  return note.data.updated ?? note.data.created;
}

/** Estimated reading time in minutes (CJK + latin aware). */
export function readingTime(note: Note): number {
  const text = note.body ?? '';
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 350 + latin / 220));
}

export function wordCount(note: Note): number {
  const text = note.body ?? '';
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z0-9]+/g) ?? []).length;
  return cjk + latin;
}

export interface SubCategoryCount {
  name: string;
  count: number;
}

export interface CategoryCount {
  name: string;
  count: number;
  subcategories: SubCategoryCount[];
}

export function categoryCounts(notes: Note[]): CategoryCount[] {
  const map = new Map<string, { count: number; subs: Map<string, number> }>();
  for (const n of notes) {
    let entry = map.get(n.data.category);
    if (!entry) {
      entry = { count: 0, subs: new Map() };
      map.set(n.data.category, entry);
    }
    entry.count += 1;
    const sub = n.data.subcategory;
    if (sub) entry.subs.set(sub, (entry.subs.get(sub) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, e]) => ({
    name,
    count: e.count,
    subcategories: [...e.subs.entries()]
      .map(([subName, count]) => ({ name: subName, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  }));
}

export interface TagCount {
  tag: string;
  count: number;
}

export function tagCounts(notes: Note[]): TagCount[] {
  const map = new Map<string, number>();
  for (const n of notes) {
    for (const t of n.data.tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** All tags as a flat string array. */
export function allTags(notes: Note[]): string[] {
  const set = new Set<string>();
  for (const n of notes) for (const t of n.data.tags) set.add(t);
  return [...set].sort();
}
