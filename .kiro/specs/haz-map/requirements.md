# Haz map - Requirements

- **Slice**: `feature-haz-map@1`
- **Composition**: `haz-map-beta` (`base@1 + feature-haz-map@1`)
- **Preview**: `/c/haz-map-beta/`
- **Status**: agreed

## Problem

The beta home page leads with a map of the last hour's shaking: quakes as circles,
measured shaking and felt reports as overlays, on a LINZ basemap. Reviewing
intensity tables without that map leaves out the spatial answer people actually
look for first. This slice mounts that map so it can be reviewed on its own and
assembled into a home page composition.

Reimplementing MapLibre wiring would drift from GeoNet's modules. The slice
therefore reuses beta's own `geonet-map-quake.mjs` stack.

## In scope

- Home shaking map (`MapType.HOME`): last-hour quakes, measured shaking, felt reports.
- Copyright popover and full-screen dialog, matching beta markup.
- Heading and "View all earthquakes" action above the map.

## Out of scope

- Quake / felt / shaking detail maps (`/earthquake/…` path modes).
- Shaking-layer contours for a single publicID.
- Intensity tables (separate slices).
- Vendoring MapLibre or rewriting GeoNet's map modules.
- Offline / fixture map states. Layers are fetched by beta's modules.

## Data

Fetched by beta's map modules (not by a kit script):

| Layer | Endpoint |
| ----- | -------- |
| Quakes (last hour) | `https://api.geonet.org.nz/quake?MMI=3` |
| Measured shaking | `https://api.geonet.org.nz/intensity?type=measured` |
| Felt reports | `https://api.geonet.org.nz/intensity?type=reported` |
| Basemap styles | `https://static.geonet.org.nz/dist/geonet-linz-styles/…` |

Map type is chosen from `location.pathname`. Any kit path that is not under
`/earthquake/` stays on `HOME`, which is what we want for `/c/…` previews.

## Requirements

1. **R1** Render beta's `.haz-map -full-width` block with `#geonet-haz-map` as the
   MapLibre container, plus copyright popover and full-screen dialog.
2. **R2** Load MapLibre as a classic script, then beta's `geonet-map-quake.mjs`
   entry with its import-map dependencies (`geonet-map`, `iconUtils`, `dateUtils`,
   `shakingUtils`).
3. **R3** Link beta's `haz-map.css`, MapLibre CSS and `geonet-maplibre.css`.
4. **R4** Show a heading and secondary action link above the map (home-shaking
   pattern).
5. **R5** `designSystem: link` is required for a reviewable preview; `none` is not
   a supported review state for this slice.
6. **R6** No fixture states. Live layers only.
7. **R7** The map region has an accessible name. Full-screen open/close uses beta's
   existing controls.

## States

| State | Trigger | Expected |
| ----- | ------- | -------- |
| Loading | MapLibre / style loading | Empty map container, then basemap tiles |
| Populated | Overlay fetches succeed | Quake / shaking / felt markers for the last hour |
| Quiet hour | No recent activity | Basemap only, or empty overlay layers |
| Full screen | "View full screen map" | Dialog opens with the same map moved into it |
| Error | Tile or API failure | MapLibre / module console errors; page chrome still intact |

## Acceptance

- [x] `npm run build` emits `/c/haz-map-beta/`
- [x] Entry module and import-map deps are hashed under `/assets/js`
- [x] MapLibre classic script precedes the ES module tags
- [ ] Reviewed live: basemap tiles and last-hour overlays appear
- [ ] Full-screen open/close checked on desktop
- [ ] Compared next to https://beta.geonet.org.nz/ at desktop and 320px
