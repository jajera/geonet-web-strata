# Beta shell - Design

- **Requirements**: `./requirements.md`
- **Status**: agreed

## Approach

The shell is copied from the served beta HTML, not redesigned. `shell.html` is the
page frame. Features inject HTML into named slots. That is the same split as
GeoNet's `border.html` plus `{{template "body" .}}`.

CSS for chrome comes from beta by URL. The kit only adds:

- rewritten hero-pattern `url()`s (beta's are root-relative and 404 here)
- empty-sidebar and empty-band collapse
- composition-index styles

## Slots

| Slot | Beta region | Who fills it |
| ---- | ----------- | ------------ |
| `alert` | inside `.alert-container`, after the kit banner | Features that need a notice; 911/notice-bar later |
| `hero` | `.page-hero-container` | Features that need a page title + callout |
| `bandBefore` | `.layout-container-band` above the grid | A feature that wants the full page width, beta home-page style |
| `body` | first column of `.layout-container > .layout-two-col` | Primary feature content |
| `sidebar` | second column | Optional; hidden when empty (R4) |
| `bandAfter` | `.layout-container-band` below the grid | As `bandBefore`, after the main content |

Header, footer and the kit preview banner are owned by the base. They are not slots.

Bands are wrappers the shell always emits, so any fragment mounted there gets the
full-width row without shaping itself as a band. Unused wrappers are hidden with
`:not(:has(*))` rather than `:empty`, which whitespace would defeat.

Which slot a feature lands in is the composition's call (R10): a feature lists the
slots it can fill and the composition may remap them with `at:`. Keeping placement
out of the slice is what stops near-duplicate slices whose only difference is where
they sit on a page.

## Markup

`slices/base/v1/shell.html` is the live beta header and footer, with
`href="/…"` and `src="/…"` rewritten to `https://beta.geonet.org.nz/…`. Nav labels
and destinations are not paraphrased.

The kit banner uses beta's `.site-alert` so it picks up the same type and colour,
with copy that says this is a preview (R7).

## Tokens and styling

Linked from beta (R5):

- `geonet-design-system.css`
- Aspekta and Soehne
- `layout.css`, `page-hero.css`, `marker.css`, `home.css`

`css/base.css` is kit-only overrides, not a second design system (R8).

`geonet-design-system.mjs` is fetched at build time and emitted under `/assets/js`
so header menus run same-origin (R6).

## Accessibility

- Header/footer keep beta's structure (`aria-controls`, `inert` menus, mobile
  menu button).
- Kit banner is a heading + sentence, not a live region.
- Features still own their own captions, live regions and heading levels. The
  shell does not supply an `<h1>`; the `hero` slot should.

## Handoff notes

- `shell.html` corresponds to `border.html` in www-geonet / the beta equivalent.
- Slot `body` is the `{{define "body"}}` block.
- Do not send `css/base.css` to GeoNet; it only exists because we are not on their
  origin.
- Header/footer markup should be re-copied from beta when they change it, not
  drifted by hand.

## Rejected alternatives

- **Invented chrome with "GeoNet Strata" wordmark.** Fast, but reviews were of the
  kit, not of GeoNet.
- **Astro/React shell.** Cannot lift into Go templates.
- **Vendoring the design system.** Those assets are marked private.
- **Putting shell requirements in the felt-reports spec.** The chrome would churn
  with a feature that does not own it.
- **A `base@2` per page layout.** Every home-page-shaped or article-shaped variant
  would be a new base, and every feature would have to widen `requiresBase` to be
  usable on it. Slots plus composition-level `at:` cover the same ground on one
  base. `base@2` is reserved for a breaking change to this contract.
- **Placement declared in the feature slice.** Would force a second slice whenever
  the same block appears in a sidebar on one page and a band on another.
