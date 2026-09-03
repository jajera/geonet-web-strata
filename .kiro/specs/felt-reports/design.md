# Felt reports - Design

- **Requirements**: `./requirements.md`
- **Status**: agreed

## Approach

The whole table is rendered in the HTML fragment with placeholder cells, and the ES
module only patches values into it. Nothing is constructed in JavaScript.

That choice is what makes the slice liftable. `slots/body.html` is already the shape
a Go `html/template` block needs, so a GeoNet developer replaces the placeholder
cells with `{{.ReportedCount 8}}` and deletes the module, or keeps the module and
serves the fragment as-is. Either path works without redesigning anything.

## Slots used

| Slot | Fragment | Why |
| ---- | -------- | --- |
| `hero` | `slots/hero.html` | Carries the single `<h1>` and the "Felt It?" callout, matching beta's `page-hero` plus `page-hero-callout` |
| `body` | `slots/body.html` | The summary and the intensity table |

`sidebar` and `alert` are deliberately left empty; this feature has nothing that
belongs there. A composition can move either fragment elsewhere with `at:` — for
example `at: { body: bandAfter }` to run the table full width — without this slice
changing.

## Config

| Key | Default | Why it is a knob |
| --- | ------- | ---------------- |
| `heading` | `Shaking reported in the last hour` | The block reads differently as a page's main content than as a home-page row |
| `endpoint` | `https://api.geonet.org.nz/intensity?type=reported` | Point a preview at measured intensity or a stand-in host without editing JavaScript |

Both land in `slots/body.html` as `{{config.heading}}` and `{{config.endpoint}}`,
HTML-escaped by the builder. A composition setting any other key fails the build.

## Markup

Follows the beta home page shaking table:

```html
<table class="felttable geonet-table -plain -full-width">
  <tr class="trow" data-mmi="8">
    <td>Extreme</td>
    <td><svg class="marker-mmi" aria-hidden="true"><rect class="mmi8"/></svg></td>
    <td data-felt-count>—</td>
  </tr>
</table>
```

- Block `felt-reports`, children `.title`, `.status`, `.summary`, `.pair`, `.note`.
- Swatch size shrinks with intensity (18px at Extreme down to 8px at Weak), so size
  reinforces the scale alongside colour (R8).
- Squares, not circles: beta uses squares for felt reports and circles for quakes.
- Data hooks are `data-felt-*` attributes, kept separate from class names so styling
  and scripting can change independently.

## Data flow

1. Module looks for `script[type="application/json"][data-strata-fixture="feature-felt-reports"]`.
2. If present, it parses that and paints. No fetch (R6).
3. If absent, it fetches `data-endpoint` from the section element.
4. `summarise()` prefers the top-level `count_mmi` rollup and falls back to summing
   each feature's `count_mmi`, clamping MMI 9+ into 8 (R4) and dropping MMI below 3
   (R3).
5. `paint()` writes counts, toggles `.-empty` on zero rows (R2), and fills the
   summary (R5).
6. `setStatus()` writes one message into the live region with a `data-state` of
   `live`, `fixture` or `error` (R7).

A rejected fetch or non-2xx leaves the placeholders and sets the error status. The
endpoint lives in a data attribute rather than the module, fed by `config.endpoint`,
so a composition can point a preview at a different host without editing JavaScript.

## Tokens and styling

Only base tokens: `--space-*`, `--ink-muted`, `--font-display`. Each `var()` carries
a fallback value so the `designSystem: none` theme renders sanely. Counts use
`font-variant-numeric: tabular-nums` so the overflow state does not jitter.

No new tokens were needed.

## Accessibility

- `role="status"` and `aria-live="polite"` on the status paragraph; exactly one
  message per load.
- Visually hidden `<caption>` describes the table; the visible `<h2>` is not
  duplicated as a caption.
- Swatch SVGs are `aria-hidden="true"`; the adjacent label cell carries meaning.
- `<h1>` comes from the hero slot, the feature starts at `<h2>`.
- Zero rows are de-emphasised with colour *and* remain in the reading order with a
  literal `0`.

## Handoff notes

- The fragment maps to a `{{define "body"}}` block. Placeholder cells correspond to
  `home.go`'s `ReportedCount` helper, which already applies the same MMI 2 exclusion
  and MMI 8 clamp, so server-side rendering needs no new logic.
- `css/felt-reports.css` becomes another file under `assets/css-dev/`.
- `js/felt-reports.mjs` becomes an entry in the import map. It is side-effect-only
  at the bottom and exports `summarise` for testing.
- Server-rendered counts make the module optional: if GeoNet renders values
  directly, the module can be dropped without touching markup or CSS.

## Rejected alternatives

- **Build markup in JS.** Fastest to write, but the fragment would stop being the
  source of truth and could not be lifted into a Go template.
- **Build-time data fetch.** Reproducible, but a preview would show stale data and
  hide the loading and error states, which are half the design.
- **Reproducing beta's full combined quakes-and-felt table.** Larger than the
  feature, and the quake half belongs to a different slice.
- **Vendoring the design system CSS.** Higher fidelity offline, but those assets are
  marked private in the GeoNet repo, so it is referenced by URL instead.
