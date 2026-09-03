# Quake counts - Design

- **Requirements**: `./requirements.md`
- **Status**: agreed

## Approach

Same shape as `feature-felt-reports@1`: a server-rendered intensity table the
module patches in place. The differences that matter are the data source (quake
feed, not intensity), the marker shape (circles, matching beta), and the need to
filter a one-hour window client-side because `/quake?MMI=3` returns more history
than an hour.

## Slots used

| Slot | Fragment | Why |
| ---- | -------- | --- |
| `hero` | `slots/hero.html` | Page title and callout to the full earthquake list |
| `body` | `slots/body.html` | Summary and intensity table |

## Config

| Key | Default | Why it is a knob |
| --- | ------- | ---------------- |
| `heading` | `Quakes in the last hour` | Wording shifts when the block sits under a shared "Shaking" heading |
| `endpoint` | `https://api.geonet.org.nz/quake?MMI=3` | Point a preview at a stand-in host without editing JavaScript |

## Markup

Follows the Quakes half of the beta home `felttable`:

- Circles, sized 26px (Extreme) down to 16px (Weak), matching beta.
- Block `quake-counts`, children `.title`, `.status`, `.summary`, `.pair`, `.note`.
- Data hooks `data-quake-*`, kept separate from class names.

## Data flow

1. Module looks for `script[type="application/json"][data-strata-fixture="feature-quake-counts"]`.
2. If present, `summarise(fixture, { now: fixtureNow(fixture) })` and paint. No fetch (R7).
3. If absent, fetch `data-endpoint`, then `summarise(collection)` with `Date.now()`.
4. `summarise()` skips `quality: deleted`, skips times outside the hour window, skips
   MMI below 3, clamps MMI 9+ into 8 (R3–R5).
5. `paint()` writes counts, toggles `.-empty`, fills the summary (R2, R6).
6. `setStatus()` writes one message into the live region (R8).

`fixtureNow()` returns one millisecond after the newest feature time so a fixture's
internal timeline stays coherent forever. An empty fixture falls back to `Date.now()`.

## Tokens and styling

Only base tokens. Circle fills come from beta `marker.css` / the base fallback MMI
palette. Counts use `font-variant-numeric: tabular-nums`.

## Accessibility

- Intensity is a label plus a count; colour is never the only signal (R9).
- Swatches are `aria-hidden`; the caption describes the table.
- One polite live region for the whole block.

## Handoff notes

- `slots/body.html` is the Quakes half of the home `felttable`. In the real repo
  the hour filter and deleted exclusion already happen server-side in `home.go`;
  the Go template would range over pre-bucketed counts.
- Circles vs squares is intentional: beta uses circles for quakes and squares for
  felt reports.
- The combined two-column home table is not this slice. Compose it later as its
  own slice, or lift both halves into one template.

## Rejected alternatives

- **Building rows in JavaScript.** Would not lift into a Go template.
- **A 15&nbsp;000-feature overflow fixture.** The quake feed has no `count_mmi`
  rollup, so five-figure counts would mean a multi-megabyte fixture. Layout stress
  for large numbers is already covered by `feature-felt-reports@1`'s overflow
  state; this slice uses a lean `busy` fixture instead.
- **Skipping the time filter and trusting the endpoint.** The live feed returns
  days of history; without the filter the table would not match the home page.
