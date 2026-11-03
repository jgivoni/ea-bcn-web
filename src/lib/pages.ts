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
