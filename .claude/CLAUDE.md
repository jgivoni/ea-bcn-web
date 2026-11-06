# EA Barcelona website

Astro site for eabarcelona.org in English (root), Catalan (`/ca/`) and Spanish (`/es/`). Content is Markdown in `src/content/pages/<lang>/`. Pages with the same `key` in frontmatter are translations of each other.

## Design system rules

The catalogue is the `/design-system` page (`src/pages/design-system.astro`). Keep it current when a component changes.

- Compose every page only from the components in `src/components/`. A page or layout has no styles of its own.
- A component looks and works the same on every page and in every language. Do not make a variant for one page.
- Page content (Markdown) uses only these HTML patterns: column rows (`<div class="cols">`, `<div class="col">`, `col center`, with `--start` and `--span`), buttons (`<a class="button">`) and embeds (`<iframe>`).
- A style that a component and Markdown share is defined once, in `src/styles/components.css`.
- All colours, sizes and spaces come from `src/styles/tokens.css`.
- An exception must be a deliberate decision. List it under "Deliberate exceptions" on the design system page.

## Content

- `pnpm import-crawl -- --force` overwrites hand edits in the Markdown. Do not run it without a reason.
- `scripts/column-layout.mjs` reads the column widths of the old Google Sites pages.
