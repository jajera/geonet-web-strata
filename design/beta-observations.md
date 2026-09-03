# Beta observations

Notes taken from the served HTML and CSS of beta.geonet.org.nz. Source of truth for
the shell and design system is beta itself; this is a working summary, not a copy.

## Page frame

```text
.alert-container > .site-alert          site alert / 911 bar
header.geonet-header                    logo, mobilemenu, #primarynav, .divider
.page-hero-container > .page-hero       h1.title + p.lead, aside.page-hero-callout
.layout-container > .layout-two-col     main content grid
footer                                  social icons, ESNZ / government logos
```

## Asset delivery

- Content-hashed filenames: `/assets/css-dev/d1118d9f-home.css`,
  `/assets/js/a32b8ef9-geonet-map-quake.mjs`.
- The hash is the first 8 hex characters of the file's SHA-256. Confirmed by
  accident: the builder's own hash of the fetched `geonet-design-system.mjs` came
  out as `3e5697c0`, which is the prefix beta already had on it. So the kit's
  `/assets` naming is not merely similar to beta's, it is the same function.
- One CSS file per component: `layout`, `header`, `home`, `card`, `card-quake`,
  `marker`, `haz-map`, `page-hero`, `tab-bar`, `filter-box`, `geonet-legacy`.
- ES modules loaded through an `importmap` with an `integrity` block, plus
  `es-module-shims` for older browsers.
- CSP with a per-request nonce and `strict-dynamic`; SRI on every asset.
- Maps are MapLibre GL over LINZ Basemaps, not Leaflet.
- Images come through `/images/sm/<space>/<asset>/<hash>/<name>.jpg`, a Contentful
  path shape.

## Component inventory seen on the home page

| Component | Classes |
| --------- | ------- |
| Site alert | `.alert-container`, `.site-alert > .heading/.message` |
| Header nav | `.geonet-header`, `.primarynav > .list > .item > .link -chevron`, `.geonet-menu` |
| Page hero | `.page-hero -altogether -pattern`, `.page-hero-callout` |
| Button | `.button -medium -secondary -small -tertiary -forward-arrow` |
| Shaking table | `.felttable.geonet-table -plain -full-width`, `.theader`, `.trow` |
| MMI marker | `.marker-mmi > .mmi0 … .mmi9` |
| Haz map | `.haz-map -full-width > .map/.footer`, `.tooltip-icon`, `popover` |
| Cards | `.card`, `.card-quake`, `.card-volcano`, `.card-vab`, `.card-news`, `.card-acc`, `.card-major-event` |
| Content summary | `.content-summary` |

Note the use of native HTML `popover` for the map copyright, and `inert` on closed
menu panels. Beta is happy with modern platform features.

## Home page, block by block

Read off the served home page, in document order, with the slice each block maps to.
This is the à-la-carte inventory: every row is one candidate slice.

| Block | Markup | Where it sits | Slice |
| ----- | ------ | ------------- | ----- |
| Page hero | `.page-hero -altogether -pattern` + `.page-hero-callout` | above the grid | part of `feature-felt-reports@1`'s `hero` |
| Shaking | `.home-shaking` > `h2.title`, `.buttons`, `.haz-map`, `.felttable` | first column | `feature-haz-map@1` + `feature-quake-counts@1` + `feature-felt-reports@1` |
| Volcanic alert levels | `.home-volcano` > `ol.card-list > li.card-volcano`, `a.notes` | second column | `feature-volcano-val@1` |
| Latest bulletins | `.content-summary` + `ol.card-list -no-border > li.card-vab` | second column | not built (Contentful) |
| Map modal | `dialog.haz-map-modal` | after the grid | part of the haz map slice |
| Latest news | `.home-news > .content` > `.content-summary`, `.card-list -grid` | after the grid, full bleed | not built (Contentful) |

Two structural details worth keeping in mind:

- The home page's `felttable` is one table with **both** quake counts and felt
  report counts per intensity. `feature-quake-counts@1` and
  `feature-felt-reports@1` each own one half as a standalone table. A later slice
  can own the joined markup when the home assembly needs pixel fidelity.
- `.home-news` is a sibling of `.layout-container`, not a child, and does its own
  full-bleed grid with a `--puia-00` background. That is a different mechanism from
  `.layout-container-band`, which bleeds from inside the container. A news slice
  will need a mount point outside the container; `base@1` does not have one yet.

## Home page data calls

`home.go` in the classic repo, mirrored on beta:

| Call | Purpose |
| ---- | ------- |
| `/volcano/val` | Volcanic alert level summary, filtered to level > 0, highest first |
| `/quake?MMI=3` | Quake counts, filtered to the last hour, excluding `quality: deleted` |
| `/intensity?type=reported&geohash=5` | Felt reports |
| `/intensity?type=measured` | Measured shaking |

Both shaking totals subtract the MMI 2 bucket, and quake MMI above 8 is clamped to 8.
Volcano titles are rewritten server-side: Taranaki to "Taranaki Maunga", White Island
to "Whakaari/White Island". The volcano type tags (Cone, Caldera, Vent, Volcanic
Field) and the type tooltips are not in the feed either; they come from beta's own
volcano metadata, so a slice has to carry them in markup.

## Things not to copy

- `geonet-legacy.css` exists to carry old markup forward. New slices should not need
  it.
- Classic www is still Bootstrap 5 plus jQuery. Beta is not. Do not mix the two.
