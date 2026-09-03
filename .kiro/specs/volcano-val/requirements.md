# Volcanic alert levels - Requirements

- **Slice**: `feature-volcano-val@1`
- **Composition**: `volcano-val-beta` (`base@1 + feature-volcano-val@1`)
- **Preview**: `/c/volcano-val-beta/`
- **Status**: agreed

## Problem

Someone hears that a volcano is doing something, or lives near one, and opens
GeoNet. The question is narrow: what level is it at now, and has that changed. The
Volcanic Alert Level is GeoNet's official answer, so the block has to state the
level plainly, in the same visual language as the rest of the site, and never imply
a level we do not have data for.

The beta home page carries this as the `home-volcano` block: only the volcanoes
above level 0, highest first, then a link to the full list. The same block on
`/volcano` shows all twelve. That difference is a setting, not two features.

## In scope

- Current Volcanic Alert Level per monitored volcano, with GeoNet's activity
  wording for that level.
- Highest-first ordering, matching the beta home page.
- A `show` setting for the home page subset (above level 0) or the full list.
- A route to the full alert level page.

## Out of scope

- Volcanic Alert Bulletins (VABs). They are Contentful content and their own
  slice, `feature-volcano-bulletins`.
- Aviation Colour Code. The feed carries `acc` but beta does not show it in this
  block; a separate slice can.
- Per-volcano detail pages, cameras, sensor plots, quake stats.
- The volcano map. That is the haz-map slice.

## Data

Source: `https://api.geonet.org.nz/volcano/val`, a GeoJSON FeatureCollection with
one feature per monitored volcano (twelve at the time of writing).

| Field | Source | Notes |
| ----- | ------ | ----- |
| Volcano identity | `properties.volcanoID` | Joins the feed to the card in the fragment |
| Alert level | `properties.level` | Integer 0-5, clamped to that range |
| Activity summary | `properties.activity` | Falls back to the standard wording for the level |
| Display name | **not in the feed** | Static in the fragment (`Whakaari/White Island`, `Taranaki Maunga`) |
| Volcano type | **not in the feed** | Static in the fragment (Cone, Caldera, Vent, Volcanic Field) |

The feed carries the API's own names (`White Island`, `Taupo`), which are not the
names beta displays. Names and types therefore live in the markup, which is also
where GeoNet's own template keeps them.

## Requirements

1. **R1** Show, for each volcano, its alert level as a number, the words "Alert
   level", its display name, its type tag, and the activity summary for that level.
2. **R2** Order cards by alert level, highest first.
3. **R3** With `show: unrest`, display only volcanoes above level 0, matching the
   beta home page. With `show: all`, display every volcano.
4. **R4** A volcano the feed does not mention keeps its placeholder and is not
   claimed to be at level 0.
5. **R5** Clamp levels to 0-5. A level outside the published scale must not produce
   an unstyled card.
6. **R6** Use live API data on the default preview; use inlined fixture data on a
   state preview, with no network call.
7. **R7** Announce the outcome once through a polite live region, including a
   distinct message for the all-quiet case.
8. **R8** Never rely on colour alone to convey level (see `a11y-content.md`). The
   number and the activity wording carry it.
9. **R9** Link to the full alert level list using beta's `notes` link pattern.
10. **R10** Reuse the beta `home-volcano` / `card-volcano` / `card-val` markup so
    the fragment can be lifted into a Go template unchanged.

## States

| State | Trigger | Expected |
| ----- | ------- | -------- |
| Loading | Initial render before fetch resolves | Cards present with em-dash placeholders; status reads "Loading volcanic alert levels…" |
| Populated | Live fetch returns levels | Levels, colours and activity filled; raised volcanoes first; status names the count and highest level |
| Quiet | `quiet` fixture | No cards shown under `show: unrest`; status reads "All 12 volcanoes are at alert level 0" |
| Unrest | `unrest` fixture | Two cards, level 2 above level 1, matching the ordinary live picture |
| Eruption | `eruption` fixture | Five cards, levels 4 down to 1; level 3+ swatches use light text |
| Error | Fetch rejects or non-2xx | Status explains the failure in the error style; placeholders remain |

## Acceptance

- [x] `npm run build` emits the live preview and all three fixture previews
- [x] Levels and activity wording verified against the live endpoint
- [x] Ordering verified highest-first on the `eruption` fixture
- [x] `show: all` verified via the composition setting, with no slice change
- [ ] Reviewed on the preview URL by a second person
- [ ] Checked at 320px wide and 400% zoom
