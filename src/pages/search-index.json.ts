import type { APIRoute } from 'astro';
import { getAllNotes, noteSlug, updated } from '../lib/notes';

// Static JSON search index consumed by the ⌘K palette (Fuse.js, lazy).
export const GET: APIRoute = async () => {
  const notes = await getAllNotes();
  const docs = notes.map((n) => ({
    slug: noteSlug(n),
    title: n.data.title,
    category: n.data.category,
    subcategory: n.data.subcategory ?? '',
    tags: n.data.tags,
    description: n.data.description,
    created: n.data.created.toISOString(),
    updated: updated(n).toISOString(),
    content: n.body ?? '',
  }));
  return new Response(JSON.stringify(docs), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
