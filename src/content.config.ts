import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per page and language: src/content/pages/<lang>/<path>.md.
// Pages that exist in several languages share a `key`.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    key: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { pages };
