# Haz map - Tasks

Source of truth for progress.

- **Requirements**: agreed
- **Design**: agreed

## Tasks

- [x] T1 Builder: `remoteImports` (import-map only), `remoteScripts` (classic), and
      `/assets/` rewrite in fetched JS
- [x] T2 Shell: `{{scripts}}` slot before `{{modules}}`
- [x] T3 Declare `feature-haz-map@1` with remote MapLibre + map module graph (R2, R3)
- [x] T4 Body fragment: home-shaking wrapper, haz-map, copyright, fullscreen dialog (R1, R4)
- [x] T5 Slice CSS for height / expand-icon fallback
- [x] T6 Composition `haz-map-beta` + spec folder
- [x] T7 Wire into `home-beta` above the intensity tables

## Verification

- [x] `npm run build` passes
- [x] Import map lists map deps; only `geonet-map-quake.mjs` is an entry script
- [x] MapLibre classic script precedes module tags
- [x] Fetched JS contains rewritten `https://beta.geonet.org.nz/assets/` icon paths
- [ ] Live preview shows basemap tiles and last-hour overlays
- [ ] Full-screen open/close on desktop
- [ ] Side-by-side with beta home at desktop and 320px

## Follow-ups

- Combined home `felttable` under the map.
- Quake-detail map modes if a quake page composition appears later.
