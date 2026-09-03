# Quake counts - Requirements

- **Slice**: `feature-quake-counts@1`
- **Composition**: `quake-counts-beta` (`base@1 + feature-quake-counts@1`)
- **Preview**: `/c/quake-counts-beta/`
- **Status**: agreed

## Problem

Someone opens GeoNet after feeling a shake, or after hearing that something
happened. They want to know whether an earthquake was recorded and how strong it
was. The beta home page answers this in the Quakes column of a combined intensity
table. This slice isolates that column so it can be reviewed and reused on its
own.

Quake counts are instrument detections, not public felt reports. The design must
not blur that line: circles for quakes, squares for reports.

## In scope

- Quakes of MMI 3 and above in the last hour, aggregated by Modified Mercalli
  Intensity.
- Total count and strongest intensity.
- A route to the full earthquake list on beta.

## Out of scope

- Felt report counts. That is `feature-felt-reports@1`.
- The combined home-page `felttable` with both columns. A later slice or
  composition owns that assembly.
- The haz map.
- Per-quake detail pages, waveforms, or felt reports for a publicID.
- Quakes older than the last hour.

## Data

Source: `https://api.geonet.org.nz/quake?MMI=3`, a GeoJSON FeatureCollection.
Unlike the intensity feed, this endpoint returns more than an hour of history, so
aggregation filters in the module.

| Field | Source | Notes |
| ----- | ------ | ----- |
| Per-intensity counts | derived | Features in the last hour, `quality` not `deleted`, MMI ≥ 3 |
| Total quakes | derived | Sum of those counts |
| Strongest | derived | Highest MMI with a non-zero count |
| Time window | `properties.time` | Live: last hour from `Date.now()`. Fixture: last hour from newest feature + 1ms |

## Requirements

1. **R1** Show one row per intensity from Extreme (MMI 8) down to Weak (MMI 3),
   with the GeoNet label and a circle swatch (not a square).
2. **R2** Rows with zero quakes stay visible and de-emphasised.
3. **R3** Exclude MMI below 3 and events with `quality: deleted`.
4. **R4** Fold MMI 9 and above into Extreme, matching the home page clamp.
5. **R5** Count only events whose `time` falls in the last hour.
6. **R6** Show total quakes and strongest intensity as a summary above the table.
7. **R7** Use live API data on the default preview; use inlined fixture data on a
   state preview, with no network call. Fixture time windows are relative to the
   newest event in the payload so fixtures stay reviewable.
8. **R8** Announce the outcome once through a polite live region, including a
   distinct message for the empty case.
9. **R9** Never rely on colour alone to convey intensity.
10. **R10** Reuse the beta `felttable` / `geonet-table` markup and circle
    `marker-mmi` sizes so the fragment can be lifted into a Go template unchanged.

## States

| State | Trigger | Expected |
| ----- | ------- | -------- |
| Loading | Initial render before fetch resolves | Table present with em-dash placeholders; status reads "Loading quakes…" |
| Populated | Live fetch returns quakes in the last hour | Counts filled, summary filled, status names the total |
| Empty | `empty` fixture, or a quiet hour | All rows zero; status reads no-quakes message; strongest reads "None" |
| Busy | `busy` fixture | Several rows filled; deleted and out-of-window events ignored |
| Extreme | `extreme` fixture | MMI 9 folded into Extreme; MMI 2 excluded; total is 3 |
| Error | Fetch rejects or non-2xx | Status explains the failure; placeholders remain |

## Acceptance

- [x] `npm run build` emits the live preview and all three fixture previews
- [x] Aggregation verified against fixtures (empty, busy, extreme)
- [x] MMI 9 clamp and deleted/out-of-window exclusion verified
- [ ] Reviewed on the preview URL by a second person
- [ ] Checked at 320px wide and 400% zoom
