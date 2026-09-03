# Felt reports - Requirements

- **Slice**: `feature-felt-reports@1`
- **Composition**: `felt-reports-beta` (`base@1 + feature-felt-reports@1`)
- **Preview**: `/c/felt-reports-beta/`
- **Status**: agreed

## Problem

Someone has just felt shaking, or has heard that others did, and opens GeoNet. They
want two things quickly: confirmation that other people felt it too, and a sense of
how strong it was where people were. The beta home page answers this inside a
combined quakes-and-felt-reports table. This slice isolates the felt reports half so
it can be reviewed, and reused on its own.

Felt reports are public submissions, not instrument measurements. The design must
not blur that line.

## In scope

- Reported shaking for the last hour, aggregated by Modified Mercalli Intensity.
- Total report count, number of distinct places reporting, and the strongest
  intensity reported.
- A route to submit a report (felt.geonet.org.nz).

## Out of scope

- Quake counts and the quake column of the home table. That is a separate slice.
- Measured shaking (`type=measured`).
- Per-quake felt reports (`&publicID=`). Candidate for `feature-felt-reports@2`.
- Maps. The haz map is its own slice.
- Submitting a report inline. That is a separate Go service (`cmd/felt`).

## Data

Source: `https://api.geonet.org.nz/intensity?type=reported`, a GeoJSON
FeatureCollection covering the last hour.

| Field                          | Source                     | Notes                                     |
| ------------------------------ | -------------------------- | ----------------------------------------- |
| Per-intensity report counts    | top-level `count_mmi`      | Falls back to summing `features[].properties.count_mmi` |
| Total reports                  | derived                    | Sum of counts for MMI 3 and above         |
| Places reporting               | `features.length`          | Each feature is a location cluster        |
| Strongest reported intensity   | derived                    | Highest MMI with a non-zero count         |

## Requirements

1. **R1** Show one row per intensity level from Extreme (MMI 8) down to Weak
   (MMI 3), in that order, with the GeoNet label and a colour swatch.
2. **R2** Rows with zero reports stay visible and de-emphasised, so the intensity
   scale still reads as a scale.
3. **R3** Exclude unnoticeable reports (MMI 2 and below) from the total, matching
   the behaviour of the GeoNet home page.
4. **R4** Fold MMI 9 and above into the Extreme row, matching the home page clamp.
5. **R5** Show total reports, places reporting, and strongest intensity as a
   summary above the table.
6. **R6** Use live API data on the default preview; use inlined fixture data on a
   state preview, with no network call.
7. **R7** Announce the outcome once through a polite live region, including a
   distinct message for the empty case.
8. **R8** Never rely on colour alone to convey intensity (see
   `a11y-content.md`).
9. **R9** Link to felt.geonet.org.nz using the beta hero callout pattern.
10. **R10** Reuse the beta `felttable` / `geonet-table` markup so the fragment can be
    lifted into a Go template unchanged.

## States

| State | Trigger | Expected |
| ----- | ------- | -------- |
| Loading | Initial render before fetch resolves | Table present with em-dash placeholders; status reads "Loading felt reports…" |
| Populated | Live fetch returns reports | Counts filled, summary filled, status names totals and places |
| Empty | `empty` fixture, or a quiet hour | All rows zero and de-emphasised; status reads "No felt reports in the last hour"; strongest reads "None" |
| Overflow | `overflow` fixture | Five-figure counts do not break the table or the summary layout |
| Extreme | `extreme` fixture | MMI 9 folded into Extreme; strongest reads "Extreme (MMI 8)" |
| Error | Fetch rejects or non-2xx | Status explains the failure in the error style; placeholders remain |

## Acceptance

- [x] `npm run build` emits the live preview and all three fixture previews
- [x] Aggregation verified against the live endpoint and all three fixtures
- [x] MMI 9 clamp verified (`extreme` fixture totals 591, matching `count`)
- [x] Illegal stacks fail the build rather than rendering
- [ ] Reviewed on the preview URL by a second person
