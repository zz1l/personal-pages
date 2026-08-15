import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getAllNotes, noteSlug, updated } from '../lib/notes';
import { SITE } from '../config';

export const GET: APIRoute = async (context) => {
  const notes = await getAllNotes();
  const site = context.site ?? new URL('https://example.com');
  const base = (import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL).replace(/\/$/, '');

  return rss({
    title: SITE.title,
    description: SITE.description,
    site,
    items: notes.slice(0, 30).map((n) => ({
      title: n.data.title,
      description: n.data.description || undefined,
      link: new URL(base + '/notes/' + noteSlug(n) + '/', site).href,
      pubDate: updated(n),
      categories: [n.data.category, ...n.data.tags],
    })),
    customData: '<language>zh-cn</language>',
  });
};
