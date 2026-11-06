// Column widths of a Google Sites section.
// Google Sites lays out each section on a 12-column grid. A class `hJDwNd-AhqUyc-<code>` on each column
// gives its width on wide screens. Columns fill the row from left to right and wrap after 12.

const SPANS = {
  R6PoUb: 1,
  ibL1re: 2,
  c5RTEf: 3,
  II5mzb: 4,
  wNfPc: 5,
  qWD73c: 6,
  OwsYgb: 7,
  OiUrBf: 8,
  uQSCkd: 12,
};

/** Top-level columns of a section, each with its start column (1–12) and span. */
export function columnsOf($, section) {
  let cursor = 1;
  return section
    .find('div.JNdkSc')
    .filter((_, el) => $(el).parentsUntil(section, 'div.JNdkSc').length === 0)
    .toArray()
    .map((el) => {
      const code = ($(el).attr('class') ?? '').match(/\bhJDwNd-AhqUyc-(\w+)/)?.[1];
      const span = SPANS[code] ?? 12;
      if (cursor + span > 13) cursor = 1;
      const start = cursor;
      cursor = start + span > 12 ? 1 : start + span;
      return { column: $(el), start, span, centered: isCentered($, $(el)) };
    });
}

// A column is centred when every text block in it is centred.
function isCentered($, column) {
  const blocks = column
    .find('p, h1, h2, h3, h4, h5, h6')
    .toArray()
    .filter((el) => $(el).text().trim());
  return blocks.length > 0 && blocks.every((el) => /text-align:\s*center/.test($(el).attr('style') ?? ''));
}

/** The opening tag of a column in Markdown. Prose.astro reads --start and --span on wide screens. */
export const colTag = ({ start, span, centered }) =>
  `<div class="col${centered ? ' center' : ''}" style="--start: ${start}; --span: ${span}">`;
