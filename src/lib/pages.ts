import { getCollection, type CollectionEntry } from 'astro:content';

export const LANGS = ['en', 'ca', 'es'] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_NAMES: Record<Lang, string> = { en: 'English', ca: 'Català', es: 'Español' };
export const LANG_LABELS: Record<Lang, string> = { en: 'EN', ca: 'CA', es: 'ES' };
export const HOME_SLUGS: Record<Lang, string> = { en: 'home', ca: 'inici', es: 'inicio' };
export const OG_LOCALES: Record<Lang, string> = { en: 'en_GB', ca: 'ca_ES', es: 'es_ES' };

export type Page = {
  entry: CollectionEntry<'pages'>;
  lang: Lang;
  path: string;
  url: string;
  key?: string;
};

export function urlFor(lang: Lang, path: string): string {
  const prefix = lang === 'en' ? '' : `/${lang}`;
  if (path === HOME_SLUGS[lang]) return prefix || '/';
  return `${prefix}/${path}`;
}

let cache: Promise<Page[]> | undefined;

// The glob loader slugifies entry ids, so the real path comes from the file path.
export function loadPages(): Promise<Page[]> {
  cache ??= getCollection('pages').then((entries) =>
    entries.map((entry) => {
      const relative = (entry.filePath ?? '').split('src/content/pages/')[1].replace(/\.md$/, '').normalize('NFC');
      const [lang, ...rest] = relative.split('/');
      const path = rest.join('/');
      return { entry, lang: lang as Lang, path, url: urlFor(lang as Lang, path), key: entry.data.key };
    }),
  );
  return cache;
}

export function findByKey(pages: Page[], lang: Lang, key: string): Page | undefined {
  return pages.find((page) => page.lang === lang && page.key === key);
}

export function alternatesFor(pages: Page[], page: Page): Partial<Record<Lang, string>> {
  const result: Partial<Record<Lang, string>> = { [page.lang]: page.url };
  if (!page.key) return result;
  for (const lang of LANGS) {
    const match = findByKey(pages, lang, page.key);
    if (match) result[lang] = match.url;
  }
  return result;
}

const MONTHS: Record<string, number> = {};
const MONTH_NAMES = [
  ['jan', 'january', 'gener', 'enero'],
  ['feb', 'february', 'febrer', 'febrero'],
  ['mar', 'march', 'març', 'marzo'],
  ['apr', 'april', 'abril'],
  ['may', 'maig', 'mayo'],
  ['jun', 'june', 'juny', 'junio'],
  ['jul', 'july', 'juliol', 'julio'],
  ['aug', 'august', 'agost', 'agosto'],
  ['sep', 'september', 'setembre', 'septiembre'],
  ['oct', 'october', 'octubre'],
  ['nov', 'november', 'novembre', 'noviembre'],
  ['dec', 'december', 'desembre', 'diciembre'],
];
MONTH_NAMES.forEach((names, index) => names.forEach((name) => (MONTHS[name] = index + 1)));

// Sort key from a slug such as "jan-jun-2024" (2024-06) or "events-2025" (2025, end of year).
// The last month in the slug counts, so a range sorts by the month it ends.
export function slugDate(path: string): number {
  const tokens = (path.split('/').pop() ?? '').toLowerCase().split('-');
  const year = Number(tokens.find((token) => /^\d{4}$/.test(token)) ?? 0);
  const months = tokens.map((token) => MONTHS[token]).filter(Boolean);
  return year * 100 + (months.length ? months[months.length - 1] : 12);
}

const parentPath = (path: string) => path.split('/').slice(0, -1).join('/');

export function parentOf(pages: Page[], page: Page): Page | undefined {
  const path = parentPath(page.path);
  return path ? pages.find((other) => other.lang === page.lang && other.path === path) : undefined;
}

// Direct children of a page, newest first.
export function childrenOf(pages: Page[], page: Page): Page[] {
  return pages
    .filter((other) => other.lang === page.lang && parentPath(other.path) === page.path)
    .sort((a, b) => slugDate(b.path) - slugDate(a.path));
}

const isIndex = (page: Page | undefined) => page?.entry.data.layout === 'index';

// The pages that older/newer links step through, newest first.
// A recap steps through all recaps under its topmost index ancestor, across year folders.
// An index page (such as a year) steps through its siblings.
export function recapSeries(pages: Page[], page: Page): Page[] {
  const parent = parentOf(pages, page);
  if (!parent) return [];
  if (isIndex(page)) return childrenOf(pages, parent);
  let root = parent;
  for (let up = parentOf(pages, root); isIndex(up); up = parentOf(pages, up!)) root = up!;
  return pages
    .filter((other) => other.lang === page.lang && other.path.startsWith(`${root.path}/`) && !isIndex(other))
    .sort((a, b) => slugDate(b.path) - slugDate(a.path));
}

// The URL of the page in another language. A page without a translation falls back to the nearest
// ancestor that has one, then to the home page of that language.
export function translatedUrl(pages: Page[], page: Page | undefined, lang: Lang): string {
  if (page?.lang === lang) return page.url;
  for (let current = page; current; current = parentOf(pages, current)) {
    const match = current.key ? findByKey(pages, lang, current.key) : undefined;
    if (match) return match.url;
  }
  return urlFor(lang, HOME_SLUGS[lang]);
}

// The first "# " heading of the Markdown body, or the frontmatter title.
export function headingOf(page: Page): string {
  return (page.entry.body ?? '').match(/^# (.+)$/m)?.[1].trim() ?? page.entry.data.title;
}

// The first image of the page, or of its newest child when the page has no image itself.
export function thumbnailOf(pages: Page[], page: Page): string | undefined {
  const own = (page.entry.body ?? '').match(/!\[[^\]]*\]\(([^)\s]+)\)/)?.[1];
  if (own) return own;
  const [first] = childrenOf(pages, page);
  return first ? thumbnailOf(pages, first) : undefined;
}

export function describe(page: Page): string {
  if (page.entry.data.description) return page.entry.data.description;
  const text = (page.entry.body ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= 160) return text;
  return `${text.slice(0, 157).replace(/\s+\S*$/, '')}…`;
}
