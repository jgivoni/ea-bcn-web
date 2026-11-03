# EA Barcelona site audit (2026-10-17)

Source: three Google Sites, crawled with plain HTTP (no blocking, no robots.txt, no sitemap.xml).
Raw HTML: `crawl/html/<host>/`. Page analysis: `crawl/analysis.json`. Images: `crawl/images/`.

## Sitemap

- `www.eabarcelona.org` (English, 26 pages)
  - `/home`, `/about`, `/take-action`, `/get-involved`
  - `/events/upcoming-events`
  - `/events/past-events` with `events-2024` (index + 8 month pages) and `events-2025` (index + 11 month pages)
- `ca.eabarcelona.org` (Catalan, 14 pages)
  - `/inici`, `/qui-som`, `/actua`, `/contacte`
  - `/esdeveniments/propers-esdeveniments`, `/esdeveniments/esdeveniments-passats` + 7 month pages (2024)
- `es.eabarcelona.org` (Spanish, 14 pages)
  - `/inicio`, `/sobre-nosotros`, `/actúa`, `/contacto`
  - `/eventos/próximos-eventos`, `/eventos/eventos-pasados` + 7 month pages (2024)

## Languages and translation coverage

- Three separate sites, one per language. The CAT/ESP/ENG links in the navigation point to the other subdomains.
- Every page has `<html lang="en-US">`, including the Catalan and Spanish pages.
- Missing in Catalan and Spanish:
  - All 2025 event pages (11 month pages and the index).
  - The "Get involved" page with the onboarding guide. `/contacte` and `/contacto` carry only the contact paragraph.
- Untranslated text on Catalan and Spanish pages:
  - Google Sites footer and cookie banner.
  - The Luma embed title and the sentence "Effective Altruism is a philosophy and a global community…".
- Catalan and Spanish "Upcoming events" pages have an extra paragraph (not all events are organised by EA Barcelona). The English page does not.

## Static and dynamic content

- Static (rendered in the HTML): all page text, including the onboarding guide on `/get-involved` and all past-event recaps.
- Dynamic or external:
  - Luma calendar iframe on the upcoming-events pages (`lu.ma/embed/calendar/cal-9tdD2nUvxmygpXa`). The event list is not in the HTML.
  - YouTube embeds: `/about` (4), `/qui-som` (4), `/sobre-nosotros` (4), August 2024 pages (1 each).
  - Links to Google Docs (code of conduct, WhatsApp guidelines, event notes) and Google Forms (feedback, sign-up).
  - Links to LinkedIn, YouTube, Facebook, Meetup, Luma.
  - Google Sites site search.
- The "Upcoming events" content is therefore the only live data. It lives in Luma.

## Match with downloaded assets

- `EA Barcelona Code of Conduct.docx`: matches the linked Google Doc (text similarity 0.998). The site links to the doc, it does not host the text.
- An old welcome text (Meetup/Slack/Facebook, names former organisers). Not on the site. Kept outside this repository.
- `Code of conduct template.docx`, `Notes on community norms.docx`, `Image consent print out.docx`: not on the site.
- Onboarding guide text on `/get-involved`: no matching file in the download. The linked "WhatsApp Community Guidelines" doc is a different document.
- Images: no byte-identical or same-size match. Google re-encodes uploads, so this does not prove a mismatch. 160 of 233 site images returned 403, so the check is incomplete. Logos (`white logo.png`, `EA Bcn horizontal.png`) not identified on the site.
