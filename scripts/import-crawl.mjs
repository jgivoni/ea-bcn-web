// Converts the Google Sites crawl in crawl/html into Markdown content files.
// Run with: pnpm import-crawl (add -- --force to overwrite pages that already exist)
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import TurndownService from 'turndown';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const crawlDir = join(root, 'crawl');
const contentDir = join(root, 'src', 'content', 'pages');
const imageDir = join(root, 'public', 'images');

const HOSTS = {
  'www.eabarcelona.org': 'en',
  'ca.eabarcelona.org': 'ca',
  'es.eabarcelona.org': 'es',
};

// Pages that exist in several languages share a key. The key drives the
// language switcher and the hreflang links.
const SHARED_KEYS = {
  en: {
    home: 'home',
    about: 'about',
    'take-action': 'take-action',
    'get-involved': 'get-involved',
    'events/upcoming-events': 'upcoming-events',
    'events/past-events': 'past-events',
    'events/past-events/events-2024/jan-jun-2024': 'past-2024-h1',
    'events/past-events/events-2024/july-2024': 'past-2024-07',
    'events/past-events/events-2024/august-2024': 'past-2024-08',
    'events/past-events/events-2024/september-2024': 'past-2024-09',
    'events/past-events/events-2024/october-2024': 'past-2024-10',
    'events/past-events/events-2024/november-2024': 'past-2024-11',
    'events/past-events/events-2024/december-2024': 'past-2024-12',
  },
  ca: {
    inici: 'home',
    'qui-som': 'about',
    actua: 'take-action',
    contacte: 'get-involved',
    'esdeveniments/propers-esdeveniments': 'upcoming-events',
    'esdeveniments/esdeveniments-passats': 'past-events',
    'esdeveniments/esdeveniments-passats/gener-juny-2024': 'past-2024-h1',
    'esdeveniments/esdeveniments-passats/juliol-2024': 'past-2024-07',
    'esdeveniments/esdeveniments-passats/agost-2024': 'past-2024-08',
    'esdeveniments/esdeveniments-passats/setembre-2024': 'past-2024-09',
    'esdeveniments/esdeveniments-passats/octubre-2024': 'past-2024-10',
    'esdeveniments/esdeveniments-passats/novembre-2024': 'past-2024-11',
    'esdeveniments/esdeveniments-passats/desembre-2024': 'past-2024-12',
  },
  es: {
    inicio: 'home',
    'sobre-nosotros': 'about',
    actúa: 'take-action',
    contacto: 'get-involved',
    'eventos/próximos-eventos': 'upcoming-events',
    'eventos/eventos-pasados': 'past-events',
    'eventos/eventos-pasados/enero-junio-2024': 'past-2024-h1',
    'eventos/eventos-pasados/julio-2024': 'past-2024-07',
    'eventos/eventos-pasados/agosto-2024': 'past-2024-08',
    'eventos/eventos-pasados/septiembre-2024': 'past-2024-09',
    'eventos/eventos-pasados/octubre-2024': 'past-2024-10',
    'eventos/eventos-pasados/noviembre-2024': 'past-2024-11',
    'eventos/eventos-pasados/diciembre-2024': 'past-2024-12',
  },
};

const HOME_SLUGS = { en: 'home', ca: 'inici', es: 'inicio' };

const pathOf = (file) => file.replace(/\.html$/, '').split('__').join('/').normalize('NFC');

// URL on the new site for a page path in a language.
function newUrl(lang, path) {
  const prefix = lang === 'en' ? '' : `/${lang}`;
  if (path === HOME_SLUGS[lang]) return prefix || '/';
  return `${prefix}/${path}`;
}

// Image URLs differ only by a size suffix such as "=w1280".
const imageKey = (url) => url.replace(/=[a-z0-9-]+$/i, '');

const imageIndex = new Map();
const imagesJson = JSON.parse(readFileSync(join(crawlDir, 'images.json'), 'utf8'));
for (const [url, localName] of imagesJson) {
  imageIndex.set(imageKey(url), localName);
}

const report = { pages: 0, imagesLocal: 0, imagesRemote: [], iframes: [], emptyPages: [] };
const copiedImages = new Set();

function resolveImage(src) {
  const localName = imageIndex.get(imageKey(src));
  const localFile = localName && join(crawlDir, 'images', localName);
  if (localFile && existsSync(localFile)) {
    if (!copiedImages.has(localName)) {
      mkdirSync(imageDir, { recursive: true });
      copyFileSync(localFile, join(imageDir, localName));
      copiedImages.add(localName);
    }
    report.imagesLocal += 1;
    return `/images/${localName}`;
  }
  report.imagesRemote.push(src);
  return src;
}

function resolveLink(href, lang) {
  if (!href) return '';
  if (href.startsWith('#')) return '';
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return href;
  let url = href;
  // Google wraps outbound links in a redirect.
  const wrapped = url.match(/^https?:\/\/www\.google\.com\/url\?q=([^&]+)/);
  if (wrapped) url = decodeURIComponent(wrapped[1]);
  try {
    const parsed = new URL(url, `https://${Object.keys(HOSTS).find((h) => HOSTS[h] === lang)}/`);
    const targetLang = HOSTS[parsed.hostname];
    if (targetLang) {
      const path = decodeURIComponent(parsed.pathname).replace(/^\//, '').replace(/\/$/, '').normalize('NFC');
      return newUrl(targetLang, path || HOME_SLUGS[targetLang]) + parsed.hash;
    }
    return parsed.href;
  } catch {
    return url;
  }
}

// Google Sites adds an encrypted embed_config and an origin that only work on the old domain.
export function cleanEmbed(src) {
  const youtube = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/);
  return youtube ? `https://www.youtube-nocookie.com/embed/${youtube[1]}` : src;
}

function makeConverter(lang) {
  const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
  td.addRule('heading', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: (_content, node) => {
      const text = node.textContent.replace(/\s+/g, ' ').trim();
      return text ? `\n\n${'#'.repeat(Number(node.nodeName[1]))} ${text}\n\n` : '';
    },
  });
  td.addRule('link', {
    filter: 'a',
    replacement: (content, node) => {
      const href = resolveLink(node.getAttribute('href'), lang);
      const text = content.replace(/\s+/g, ' ').trim();
      if (!href) return text;
      return text ? `[${text}](${href})` : '';
    },
  });
  td.addRule('image', {
    filter: 'img',
    replacement: (_content, node) => {
      const src = node.getAttribute('src');
      if (!src) return '';
      const alt = (node.getAttribute('alt') || '').replace(/[[\]]/g, '');
      return `\n\n![${alt}](${resolveImage(src)})\n\n`;
    },
  });
  td.addRule('iframe', {
    filter: 'iframe',
    replacement: (_content, node) => {
      const raw = node.getAttribute('src') || node.getAttribute('data-src');
      if (!raw) return '';
      const src = cleanEmbed(raw);
      report.iframes.push(src);
      const title = (node.getAttribute('title') || '').replace(/"/g, '&quot;');
      return `\n\n<iframe src="${src}" title="${title}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>\n\n`;
    },
  });
  td.addRule('divs', { filter: ['div', 'section'], replacement: (content) => `\n${content}\n` });
  td.addRule('spans', { filter: 'span', replacement: (content) => content });
  return td;
}

function pageTitle($) {
  return $('title').first().text().replace(/\s+/g, ' ').trim();
}

const yaml = (value) => JSON.stringify(value);

// Google Sites builds the Luma calendar iframe with JavaScript, so the crawled HTML has no iframe.
const LUMA_CALENDAR = 'cal-9tdD2nUvxmygpXa';
const LUMA_TITLES = { en: 'EA Barcelona events calendar', ca: 'Calendari d’esdeveniments d’EA Barcelona', es: 'Calendario de eventos de EA Barcelona' };
const lumaEmbed = (lang) =>
  `<iframe src="https://lu.ma/embed/calendar/${LUMA_CALENDAR}/events" title="${LUMA_TITLES[lang]}" loading="lazy" allowfullscreen></iframe>`;

// Pages are edited by hand after the first import. Existing files are kept unless --force is given.
const force = process.argv.includes('--force');
report.skipped = 0;

for (const [host, lang] of Object.entries(HOSTS)) {
  const dir = join(crawlDir, 'html', host);
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.html') || file === 'index.html') continue;
    const path = pathOf(file);
    const $ = load(readFileSync(join(dir, file), 'utf8'));
    const container = $('div.UtePc').first();
    container.find('svg, script, style, button, noscript').remove();
    container.find('h1, h2, h3, h4, h5, h6').find('br').replaceWith(' ');
    // Google Sites iframes sit inside wrapper divs. The embed src is on the iframe or a data attribute.
    const markdown = makeConverter(lang)
      .turndown(container.html() || '')
      .replace(/[ \t]+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!markdown) report.emptyPages.push(`${host}/${file}`);

    const key = SHARED_KEYS[lang][path] ?? null;
    const body = key === 'upcoming-events' ? `${markdown}\n\n${lumaEmbed(lang)}` : markdown;
    const front = ['---', `title: ${yaml(pageTitle($))}`, ...(key ? [`key: ${yaml(key)}`] : []), '---', ''].join('\n');
    const out = join(contentDir, lang, `${path}.md`);
    if (existsSync(out) && !force) {
      report.skipped += 1;
      continue;
    }
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${front}\n${body}\n`);
    report.pages += 1;
  }
}

writeFileSync(join(crawlDir, 'import-report.json'), JSON.stringify(report, null, 2));
console.log(
  `pages: ${report.pages}, images local: ${report.imagesLocal}, images remote fallback: ${report.imagesRemote.length}, iframes: ${report.iframes.length}, empty pages: ${report.emptyPages.length}`,
);
