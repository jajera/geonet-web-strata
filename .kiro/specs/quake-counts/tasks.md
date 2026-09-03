# Quake counts - Tasks

Source of truth for progress.

- **Requirements**: agreed
- **Design**: agreed

## Tasks

- [x] T1 Declare `feature-quake-counts@1` with `requiresBase: ">=1 <2"`, `hero` /
      `body` slots, and `heading` / `endpoint` config defaults
- [x] T2 Hero fragment with earthquake page-hero pattern and All earthquakes callout
- [x] T3 Body fragment: summary plus intensity table, Extreme down to Weak, circle
      markers sized to match beta (R1, R6, R10)
- [x] T4 `summarise()` with last-hour window, deleted exclusion, MMI 2 exclusion
      and MMI 9 clamp (R3–R5)
- [x] T5 `fixtureNow()` so fixture windows stay self-consistent (R7)
- [x] T6 `paint()` patching counts, `.-empty` toggling and summary values (R2, R6)
- [x] T7 Fixture-first data resolution, live fetch fallback (R7)
- [x] T8 Live region status messages for live, fixture, empty and error (R8)
- [x] T9 Fixtures for `empty`, `busy` and `extreme`
- [x] T10 Feature CSS using base tokens only, with fallbacks

## Verification

- [x] `npm run build` passes
- [x] Live preview renders against `quake?MMI=3`
- [x] All three fixture states render with no network call
- [x] `summarise()` checked against each fixture
- [ ] Reviewed on the preview URL by a second person
- [ ] Checked at 320px wide and 400% zoom

## Follow-ups

- Combined home `felttable` (this slice + `feature-felt-reports@1` as one table).
- Haz map slice that sits above this table on the home page.
