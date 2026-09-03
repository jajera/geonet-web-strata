# Volcanic alert levels - Tasks

Source of truth for progress.

- **Requirements**: agreed
- **Design**: agreed

## Tasks

- [x] T1 Declare `feature-volcano-val@1` with `requiresBase: ">=1 <2"`, the `body`
      slot map, and `heading` / `endpoint` / `show` config defaults
- [x] T2 Body fragment: `home-volcano` block with one `card-volcano` per monitored
      volcano, display names and type tags from beta (R1, R10)
- [x] T3 `remoteCss` for `card.css` and `card-volcano.css` so the cards are styled
      by beta's own component CSS
- [x] T4 `summarise()` keyed by `volcanoID`, level clamped 0-5, standard wording
      fallback (R5)
- [x] T5 `paint()` setting level, `-level-N` modifier and activity, and leaving
      unmentioned volcanoes on placeholders (R1, R4)
- [x] T6 `show` filter via beta's `-hidden` modifier (R3)
- [x] T7 Highest-first reordering of existing card nodes (R2)
- [x] T8 Fixture-first data resolution, live fetch fallback (R6)
- [x] T9 Live region status messages for live, fixture, quiet and error (R7)
- [x] T10 Fixtures for `quiet`, `unrest` and `eruption`
- [x] T11 Feature CSS: status line plus alert palette and `-hidden` fallbacks

## Verification

- [x] `npm run build` passes
- [x] Live preview renders with real data from `volcano/val`
- [x] All three fixture states render with no network call
- [x] Ordering is highest-first on the `eruption` fixture
- [x] `show: all` renders twelve cards, `show: unrest` renders only raised ones
- [ ] Reviewed on the preview URL by a second person
- [ ] Checked at 320px wide and 400% zoom
- [ ] Compared side by side with the `home-volcano` block on beta

## Follow-ups

- `feature-volcano-bulletins@1`: the Latest Volcanic activity bulletins list that
  sits under this block on beta. Contentful, so fixtures only.
- Aviation Colour Code slice reusing this endpoint's `acc` field.
- Decide whether the "View bulletin" link inside a card belongs here or comes from
  the bulletins slice, since it needs Contentful ids.
