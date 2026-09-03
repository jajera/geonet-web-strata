# Accessibility and content steering

GeoNet is read during emergencies, on bad connections, by people who are stressed.
That sets the bar.

## Accessibility

- Never encode meaning in colour alone. The MMI scale pairs colour with a text
  label and a shape/size difference; keep all three.
- Decorative swatches get `aria-hidden="true"`. The adjacent text cell carries the
  meaning.
- Data that changes after load lives in a container with `role="status"` and
  `aria-live="polite"` so a screen reader hears the update without being hijacked.
- Tables get a `<caption>`, visually hidden if the visible heading already says it.
  Header cells get `scope`.
- One `<h1>` per page, from the `hero` slot. Features in `body` start at `<h2>`.
- Everything works at 400% zoom and down to 320px wide.
- Do not rely on hover or pointer events for anything essential.

## Content

- Plain New Zealand English. "Shaking", not "seismic intensity", in user-facing copy.
- Use macrons: Aotearoa, Whakaari, Taranaki Maunga, te reo Māori.
- Numbers stay numerals. Never round a report count.
- Times display in Pacific/Auckland with the timezone named.
- Say what an empty state means. "No felt reports in the last hour" beats "0", which
  reads like a failure.
- Error copy says what failed and what the reader can do; it never blames them and
  never shows a raw stack trace.
- Felt reports are public submissions. Never imply an individual report is a
  measurement, and never expose anything that could identify a reporter.
