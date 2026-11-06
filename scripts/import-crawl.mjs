// Converts the Google Sites crawl in crawl/html into Markdown content files.
// Run with: pnpm import-crawl (add -- --force to overwrite pages that already exist).
// Pages with `layout: "home"` are built by hand and are never overwritten.
// The imported pages were then corrected by hand. Running with --force discards those corrections.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import TurndownService from 'turndown';
import { colTag, columnsOf } from './column-layout.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const crawlDir = join(root, 'crawl');
const contentDir = join(root, 'src', 'content', 'pages');

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

// Headings longer than this are styled body text in Google Sites, not real headings.
const MAX_HEADING_LENGTH = 110;

const pathOf = (file) => file.replace(/\.html$/, '').split('__').join('/').normalize('NFC');

// URL on the new site for a page path in a language.
function newUrl(lang, path) {
  const prefix = lang === 'en' ? '' : `/${lang}`;
  if (path === HOME_SLUGS[lang]) return prefix || '/';
  return `${prefix}/${path}`;
}

// Image URLs differ only by a size suffix such as "=w1280". crawl/images-local.json maps them to files in public/images.
const imageKey = (url) => url.replace(/=[a-z0-9-]+$/i, '');
const localImages = JSON.parse(readFileSync(join(crawlDir, 'images-local.json'), 'utf8'));

const report = { pages: 0, skipped: 0, keptHome: 0, imagesLocal: 0, imagesRemote: [], iframes: 0, grids: 0, buttons: 0 };

function resolveImage(src) {
  const local = localImages[imageKey(src)];
  if (local) {
    report.imagesLocal += 1;
    return local;
  }
  report.imagesRemote.push(src);
  return src;
}

// Newsletter tracking links, resolved to their destinations. They also contain a subscriber id.
const MAILCHIMP_LINKS = {
  '17c008e44b': 'https://www.effectivealtruism.org/virtual-programs/introductory-program',
  eb20860a7e: 'https://linktr.ee/nudrama',
  '9c0a8834f1': 'https://www.linkedin.com/in/ana-luna-hern%C3%A1ndez/',
  '485140799c': 'https://www.who.int/health-topics/one-health',
  '82a809ae48': 'https://www.againstmalaria.com/',
  e5821783d9: 'https://lu.ma/0fe3ptgb',
};

function resolveLink(href, lang) {
  if (!href) return '';
  if (href.startsWith('#')) return '';
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return href;
  let url = href;
  // Google wraps outbound links in a redirect.
  const wrapped = url.match(/^https?:\/\/www\.google\.com\/url\?q=([^&]+)/);
  if (wrapped) url = decodeURIComponent(wrapped[1]);
  const tracked = url.match(/list-manage\.com\/track\/click\?.*[?&]id=([0-9a-f]+)/);
  if (tracked && MAILCHIMP_LINKS[tracked[1]]) return MAILCHIMP_LINKS[tracked[1]];
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

// Wraps the visible part of `content` in a marker and keeps outer whitespace outside it.
function wrapInline(content, marker) {
  const match = content.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return match[2] ? `${match[1]}${marker}${match[2]}${marker}${match[3]}` : content;
}

// `page` holds state for one page: the first h1 stays h1, later ones become h2.
function makeConverter(lang, page, { inColumn = false } = {}) {
  const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
  td.addRule('heading', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: (content, node) => {
      const text = node.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return '';
      let level = inColumn ? 3 : Number(node.nodeName[1]);
      if (level === 1) {
        if (!page.h1) {
          page.h1 = true;
          return `\n\n# ${text}\n\n`;
        }
        level = 2;
      }
      // Keep the links of long styled text that is not a real heading.
      if (text.length > MAX_HEADING_LENGTH) return `\n\n${content.replace(/\s+/g, ' ').trim()}\n\n`;
      return `\n\n${'#'.repeat(level)} ${text}\n\n`;
    },
  });
  // Turndown checks the most recently added rule first, so specific rules come after general ones.
  td.addRule('link', {
    filter: 'a',
    replacement: (content, node) => {
      const href = resolveLink(node.getAttribute('href'), lang);
      const text = content.replace(/\s+/g, ' ').trim();
      if (!href) return text;
      return text ? `[${text}](${href})` : '';
    },
  });
  // A Google Sites link preview: an image and a long title plus description. Keep only the title as a link.
  td.addRule('linkPreview', {
    filter: (node) => node.nodeName === 'A' && node.querySelector('img') && node.textContent.trim().length > 60,
    replacement: (_content, node) => {
      const href = resolveLink(node.getAttribute('href'), lang);
      const title = node.textContent.trim().split(/(?<=[a-z])(?=[A-Z])/)[0].replace(/\s+/g, ' ').trim();
      return href ? `\n\n[${title}](${href})\n\n` : '';
    },
  });
  td.addRule('button', {
    filter: (node) => node.nodeName === 'A' && /\bFKF6mc\b/.test(node.getAttribute('class') || ''),
    replacement: (content, node) => {
      const href = resolveLink(node.getAttribute('href'), lang);
      const text = content.replace(/\s+/g, ' ').trim();
      if (!href || !text) return text;
      report.buttons += 1;
      return `\n\n<a class="button" href="${href}">${text}</a>\n\n`;
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
      report.iframes += 1;
      const title = (node.getAttribute('title') || '').replace(/"/g, '&quot;');
      return `\n\n<iframe src="${src}" title="${title}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>\n\n`;
    },
  });
  td.addRule('listItem', {
    filter: 'li',
    replacement: (content, node) => {
      const parent = node.parentNode;
      const index = Array.prototype.indexOf.call(parent.children, node);
      const prefix = parent.nodeName === 'OL' ? `${index + 1}. ` : '- ';
      const body = content.trim().replace(/\n{2,}/g, '\n').replace(/\n/g, `\n${' '.repeat(prefix.length)}`);
      return `${prefix}${body}\n`;
    },
  });
  td.addRule('divs', { filter: ['div', 'section'], replacement: (content) => `\n${content}\n` });
  td.addRule('spans', {
    filter: 'span',
    replacement: (content, node) => {
      const style = node.getAttribute('style') || '';
      let out = content;
      if (/font-weight:\s*(600|700|800|900|bold)/.test(style)) out = wrapInline(out, '**');
      if (/font-style:\s*italic/.test(style)) out = wrapInline(out, '_');
      return out;
    },
  });
  return td;
}

// Joins runs of two or more paragraphs into a list:
// paragraphs that are each only a link become a bullet list, and "1\. text" paragraphs become a numbered list.
function paragraphsToLists(md) {
  const blocks = md.split(/\n{2,}/);
  const out = [];
  let run = [];
  let kind = null;
  const flush = () => {
    if (run.length >= 2) out.push(run.map((b) => (kind === 'link' ? `- ${b}` : b.replace(/^(\d+)\\\.\s*/, '$1. '))).join('\n'));
    else out.push(...run);
    run = [];
    kind = null;
  };
  for (const raw of blocks) {
    const block = raw.trim();
    const blockKind = /^\[[^\]\n]+\]\([^)\s]+\)\s*\S{0,3}$/.test(block) ? 'link' : /^\d+\\\.\s/.test(block) && !block.includes('\n') ? 'number' : null;
    if (blockKind && (kind === null || kind === blockKind)) {
      kind = blockKind;
      run.push(block);
      continue;
    }
    flush();
    if (blockKind) {
      kind = blockKind;
      run.push(block);
    } else out.push(raw);
  }
  flush();
  return out.join('\n\n');
}

// `titleLevel` is the heading level for short lines that are fully bold. Google Sites used bold text where a heading belongs.
const cleanMarkdown = (md, titleLevel = 2) =>
  paragraphsToLists(
    md
      .replace(/[⁠​]/g, '') // invisible word joiners from copy and paste
      .replace(/[ \t ]+$/gm, '')
      .replace(/(\S)[  ]{2,}(?=\S)/g, '$1 ')
      .replace(/\*\*\*\*/g, '') // joins neighbouring bold spans
      .replace(/\*\*(\s*)\*\*/g, '$1')
      .replace(/\*\*([^\p{L}\p{N}*\n]{1,6})\*\*/gu, '$1') // bold emoji or punctuation
      .replace(/\[\*\*([^\]*]*)\*\*\]/g, '[$1]') // links are already emphasised
      // A bold span that ends inside link text: "**watch [here**](url)" becomes "**watch** [here](url)".
      .replace(/\*\*([^*\n]*?)\[([^\]\n]*?)\*\*\]\(([^)\s]+)\)/g, (_m, before, text, url) =>
        before.trim() ? `**${before.trim()}** [${text}](${url})` : `[${text}](${url})`,
      )
      .replace(/^\*\*([^*\n]{1,160})\*\*([  ]*[^\p{L}\p{N}\s*]{1,8})?$/gmu, (_m, title, emoji = '') => `${'#'.repeat(titleLevel)} ${title}${emoji}`)
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );

// A column that holds only linked icons (the social links row) is dropped: the site footer has these links.
function isIconRow($, column) {
  const text = column.text().replace(/\s+/g, '');
  const images = column.find('img');
  return !text && images.length > 0 && images.toArray().every((img) => $(img).closest('a').length > 0);
}

function hasContent(column) {
  return Boolean(column.text().replace(/\s+/g, '')) || column.find('img, iframe').length > 0;
}

function convertSection($, section, lang, page) {
  const columns = columnsOf($, section).filter(({ column }) => hasContent(column) && !isIconRow($, column));
  if (columns.length === 0) {
    return hasContent(section) && !isIconRow($, section) ? cleanMarkdown(makeConverter(lang, page).turndown($.html(section))) : '';
  }
  if (columns.length === 1) return cleanMarkdown(makeConverter(lang, page).turndown($.html(columns[0].column)));
  const cells = columns
    .map((layout) => ({
      layout,
      markdown: cleanMarkdown(makeConverter(lang, page, { inColumn: true }).turndown($.html(layout.column)), 3),
    }))
    .filter((cell) => cell.markdown);
  if (cells.length === 1) return cells[0].markdown;
  report.grids += 1;
  return ['<div class="cols">', ...cells.map((cell) => `${colTag(cell.layout)}\n\n${cell.markdown}\n\n</div>`), '</div>'].join('\n\n');
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

for (const [host, lang] of Object.entries(HOSTS)) {
  const dir = join(crawlDir, 'html', host);
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.html') || file === 'index.html') continue;
    const path = pathOf(file);
    const out = join(contentDir, lang, `${path}.md`);
    if (existsSync(out)) {
      if (/^layout:\s*"?home"?\s*$/m.test(readFileSync(out, 'utf8'))) {
        report.keptHome += 1;
        continue;
      }
      if (!force) {
        report.skipped += 1;
        continue;
      }
    }

    const $ = load(readFileSync(join(dir, file), 'utf8'));
    const container = $('div.UtePc').first();
    container.find('svg, script, style, button, noscript').remove();
    container.find('h1, h2, h3, h4, h5, h6').find('br').replaceWith(' ');
    const page = { h1: false };
    const sections = container.find('section').toArray();
    const markdown = sections
      .map((section) => convertSection($, $(section), lang, page))
      .filter(Boolean)
      .join('\n\n');

    const key = SHARED_KEYS[lang][path] ?? null;
    // The calendar goes before a closing button, so the button stays last.
    const body =
      key === 'upcoming-events'
        ? markdown.replace(/(\n\n<a class="button"[^\n]*<\/a>)?$/, (button) => `\n\n${lumaEmbed(lang)}${button}`)
        : markdown;
    const front = ['---', `title: ${yaml(pageTitle($))}`, ...(key ? [`key: ${yaml(key)}`] : []), '---', ''].join('\n');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${front}\n${body}\n`);
    report.pages += 1;
  }
}

writeFileSync(join(crawlDir, 'import-report.json'), JSON.stringify(report, null, 2));
console.log(
  `pages: ${report.pages}, home kept: ${report.keptHome}, skipped: ${report.skipped}, images local: ${report.imagesLocal}, images remote: ${report.imagesRemote.length}, iframes: ${report.iframes}, grids: ${report.grids}, buttons: ${report.buttons}`,
);
