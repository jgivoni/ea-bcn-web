import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://eabarcelona.org',
  trailingSlash: 'never',
  build: { format: 'file' },
  // The design system page is a reference for editors, not content.
  integrations: [sitemap({ filter: (page) => !page.includes('/design-system') })],
});
