import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const card = z.object({
  title: z.string(),
  text: z.string(),
  href: z.string(),
  image: z.string(),
});

// One Markdown file per page and language: src/content/pages/<lang>/<path>.md.
// Pages that exist in several languages share a `key`.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    key: z.string().optional(),
    description: z.string().optional(),
    // index: the page lists its child pages (newest first) after its own text.
    layout: z.enum(['page', 'home', 'index']).default('page'),
    // Home layout only. The Markdown body is the introduction.
    headline: z.string().optional(),
    cards: z.array(card).optional(),
    cta: z.object({ label: z.string(), href: z.string() }).optional(),
  }),
});

export const collections = { pages };
