import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ---------------------------------------------------------------------------
// Notes — the core collection. Every note is a Markdown file under
// src/content/notes/<category>/<file>.md. The route is derived from the file
// name (basename, without extension), so file names must be unique across the
// whole notes/ tree.
// ---------------------------------------------------------------------------
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    category: z.string(),
    subcategory: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['seed', 'sprout', 'growing', 'evergreen']).default('seed'),
    difficulty: z.enum(['introductory', 'intermediate', 'advanced']).default('intermediate'),
    created: z.coerce.date(),
    updated: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

// ---------------------------------------------------------------------------
// Projects — one Markdown file per project under src/content/projects/.
// ---------------------------------------------------------------------------
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['active', 'maintained', 'archived', 'idea']).default('active'),
    tech: z.array(z.string()).default([]),
    github: z.string().url().optional(),
    demo: z.string().url().optional(),
    paper: z.string().url().optional(),
    year: z.number().optional(),
    featured: z.boolean().default(false),
  }),
});

// ---------------------------------------------------------------------------
// Research — publications, ideas and experiments under src/content/research/.
// ---------------------------------------------------------------------------
const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    type: z.enum(['publication', 'idea', 'experiment']),
    title: z.string(),
    description: z.string().default(''),
    authors: z.array(z.string()).default([]),
    venue: z.string().optional(),
    year: z.number().optional(),
    paper: z.string().url().optional(),
    code: z.string().url().optional(),
    status: z.string().optional(),
  }),
});

export const collections = { notes, projects, research };
