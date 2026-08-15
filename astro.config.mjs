// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypePrettyCode from 'rehype-pretty-code';
import { remarkWikiLinks } from './src/lib/markdown/remark-wiki-links.mjs';
import { remarkMermaid } from './src/lib/markdown/remark-mermaid.mjs';
import { rehypeCallouts, rehypeLineNumbers } from './src/lib/markdown/rehype-plugins.mjs';

// `base` and `site` are set through environment variables so the same config
// works locally (/) and on GitHub Pages (/<repo>/). See .github/workflows/deploy.yml
// and README.md. For a user site (username.github.io) set ASTRO_BASE to "/".
const base = process.env.ASTRO_BASE || '/';
const site = process.env.ASTRO_SITE || 'https://example.com';

/** @type {any} */
const tailwindPlugin = tailwindcss();

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !['/search-index.json', '/graph-data.json'].includes(page),
    }),
  ],
  vite: {
    plugins: [tailwindPlugin],
  },
  markdown: {
    syntaxHighlight: false, // rehype-pretty-code handles highlighting
    // Footnotes ([^1]) are provided by Astro's built-in GFM support.
    remarkPlugins: [
      remarkMath,
      remarkWikiLinks,
      remarkMermaid,
    ],
    rehypePlugins: [
      [
        rehypeKatex,
        {
          // Common macros for mathematical notes.
          macros: {
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
            '\\Z': '\\mathbb{Z}',
            '\\Q': '\\mathbb{Q}',
            '\\C': '\\mathbb{C}',
            '\\E': '\\mathbb{E}',
            '\\P': '\\mathbb{P}',
            '\\argmin': '\\operatorname*{arg\\,min}',
            '\\argmax': '\\operatorname*{arg\\,max}',
          },
        },
      ],
      [
        rehypePrettyCode,
        {
          theme: {
            light: 'github-light',
            dark: 'github-dark',
          },
          keepBackground: false,
          defaultLang: 'plaintext',
        },
      ],
      rehypeCallouts,
      rehypeLineNumbers,
    ],
  },
});

