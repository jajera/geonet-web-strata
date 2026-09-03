# Beta shell - Requirements

- **Slice**: `base@1`
- **Composition**: `beta-shell` (`base@1`)
- **Preview**: `/c/beta-shell/`
- **Status**: agreed

## Problem

Every feature preview has to sit in the same page frame as beta.geonet.org.nz:
alert bar, header, layout grid, footer. If that frame is invented, a reviewed
feature will not look like GeoNet and will not lift into a Go template. The base
slice is the contract for that frame. Features must not fork it.

This is a shell spec, not a user-facing feature. There is no GeoNet API and no
empty/overflow/extreme data state. The review question is: does the chrome match
beta closely enough that a feature mounted into a slot looks at home.

## In scope

- Alert bar, header (logo, primary nav, secondary nav, mobile menu), layout
  container, footer (link lists, logos, imprint).
- Slot contract: `alert`, `hero`, `bandBefore`, `body`, `sidebar`, `bandAfter`.
- Linking the live beta design system, fonts, layout, page-hero and marker CSS.
- A kit-only preview banner so this is never mistaken for production GeoNet.
- Collapsing an empty sidebar or band so a one-column feature is not left with a hole.

## Out of scope

- Home-page content (shaking map, volcano cards, news). Those are features.
- Classic www (`geonet-bootstrap`, jQuery). This base targets beta only.
- Vendoring the design-system CSS/icons (private GeoNet package).
- Contentful 911 / notice bars (live data). The `alert` slot is the mount point.
- Changing GeoNet's own header or footer copy, except rewriting site-relative
  URLs so they resolve on beta.

## Requirements

1. **R1** Header and footer markup matches the live beta page frame (same blocks,
   classes, nav items). Site-relative `href`/`src` resolve to
   `https://beta.geonet.org.nz` so assets and nav work from a kit preview.
2. **R2** Provide slots `alert`, `hero`, `bandBefore`, `body`, `sidebar` and
   `bandAfter`, and nothing else. Features mount only into those. Chrome (header,
   footer, kit banner) is not a slot and must not be restyled by a feature.
3. **R3** `body` is the primary content slot and maps to
   `{{template "body" .}}` in the GeoNet Go templates.
4. **R4** An unused `sidebar` does not leave an empty column, and an unused band
   does not leave an empty full-width row. An unused `hero` or `alert` slot leaves
   no visible hole.
5. **R5** Preview pages link the live beta design system, Aspekta, Soehne,
   layout, page-hero and marker stylesheets. Hero pattern images that are
   root-relative on beta are rewritten so they load here.
6. **R6** Design-system JS that drives header menus is served same-origin.
   Beta does not send CORS on that module.
7. **R7** A site-alert banner states this is a GeoNet Strata preview, names the
   composition and stack, and is visually distinct from a production 911 bar.
8. **R8** Token and class names stay those of beta (`geonet-header`,
   `geonet-footer`, `layout-container`, `page-hero`, `--space-*`, `--puia-*`).
   The kit does not invent a parallel design system.
9. **R9** A composition may pin `base@1` with an empty feature list so the shell
   can be reviewed alone.
10. **R10** A composition may place a feature in any slot the base provides via
   `at:`, without the feature slice changing. A slot the base does not provide, or
   a slot the feature does not fill, fails the build.
11. **R11** Adding a slot to this base is additive: existing compositions render
   the same apart from the collapsed wrapper, so no version bump. Removing or
   renaming a slot is breaking and needs `base@2`. A different site's shell
   (classic www) is a separate slice id, not a version of this one.

## States

| State | Trigger | Expected |
| ----- | ------- | -------- |
| Shell only | `beta-shell` composition | Header, footer, kit banner; empty content column; no feature UI |
| Feature mounted | Any composition that adds a feature | Feature fills its slots; chrome unchanged |
| Feature remapped | Composition uses `at:` | Feature renders in the target slot; band takes full page width |
| `designSystem: none` | Theme flag | Fallback CSS still produces a readable page without beta stylesheets |
| Narrow viewport | 320px / mobile menu | Header uses beta's mobile menu; footer stacks |

## Acceptance

- [x] `npm run build` emits `/c/beta-shell/`
- [x] Header and footer present with beta class names and logos
- [x] Empty sidebar does not occupy a second column
- [x] Empty band renders no visible row
- [x] `at:` into an unknown slot fails the build with a message naming the real slots
- [ ] Reviewed next to https://beta.geonet.org.nz/ at desktop and 320px
