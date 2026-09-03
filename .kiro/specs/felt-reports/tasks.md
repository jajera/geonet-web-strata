# Felt reports - Tasks

Source of truth for progress.

- **Requirements**: agreed
- **Design**: agreed

## Tasks

- [x] T1 Declare `feature-felt-reports@1` with `requiresBase: ">=1 <2"` and the
      `hero` / `body` slot map
- [x] T2 Hero fragment using the beta `page-hero` + `page-hero-callout` pattern (R9)
- [x] T3 Body fragment: summary list plus intensity table, Extreme down to Weak,
      beta `felttable` markup (R1, R5, R10)
- [x] T4 Swatches as squares with intensity-scaled size and `aria-hidden` (R8)
- [x] T5 `summarise()` with the MMI 2 exclusion and MMI 9 clamp (R3, R4)
- [x] T6 `paint()` patching counts, `.-empty` toggling and summary values (R2, R5)
- [x] T7 Fixture-first data resolution, live fetch fallback (R6)
- [x] T8 Live region status messages for live, fixture, empty and error (R7)
- [x] T9 Fixtures for `empty`, `overflow` and `extreme`
- [x] T10 Feature CSS using base tokens only, with fallbacks

## Verification

- [x] `npm run build` passes
- [x] Live preview renders with real data from `intensity?type=reported`
- [x] All three fixture states render with no network call
- [x] `summarise()` output checked against the live endpoint and each fixture
- [x] Guardrails checked: bad base version, wrong slice kind, unsatisfiable base
      range and missing fixture all fail the build
- [ ] Reviewed on the preview URL by a second person
- [ ] Checked at 320px wide and 400% zoom

## Follow-ups

- `feature-felt-reports@2`: per-quake felt reports via `&publicID=`.
- Combined home `felttable` with `feature-quake-counts@1`.
- Decide whether te reo Māori labels belong in this slice or the base.
