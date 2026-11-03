import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.eabarcelona.org',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
});
