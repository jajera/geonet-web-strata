# Beta shell - Tasks

Source of truth for progress.

- **Requirements**: agreed
- **Design**: agreed

## Tasks

- [x] T1 `base@1` manifest with slots `alert`, `hero`, `body`, `sidebar` (R2, R3)
- [x] T2 Lift live beta header and footer into `shell.html`; rewrite asset and
      route URLs to beta (R1)
- [x] T3 Kit preview banner using `.site-alert` (R7)
- [x] T4 Link live design-system, fonts, layout, page-hero, marker CSS; rewrite
      hero pattern URLs (R5, R8)
- [x] T5 Same-origin copy of `geonet-design-system.mjs` for header menus (R6)
- [x] T6 Hide empty sidebar so a one-column feature does not leave a hole (R4)
- [x] T7 Composition `beta-shell` pinning `base@1` with no features (R9)

## Verification

- [x] `npm run build` emits `/c/beta-shell/`
- [ ] Preview compared to https://beta.geonet.org.nz/ at desktop width
- [ ] Preview compared at 320px; mobile menu opens
- [ ] `felt-reports-beta` still mounts into this shell with chrome unchanged

## Follow-ups

- Re-copy header/footer when beta's nav changes.
- `base@2` only if classic www needs its own shell.
- Optional `alert` feature for Contentful notice/911 bars.
