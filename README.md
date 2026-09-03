# geonet-web-strata

Spec driven feature kit for the GeoNet website.

This is **not** the GeoNet website. It is a workspace for designing one website
feature at a time, previewing it on a shell that looks like
[beta.geonet.org.nz](https://beta.geonet.org.nz), and writing a spec precise enough
to be implemented in the real GeoNet repo. Nothing here is an official GeoNet
product, and previews are not a source of emergency information.

## Quick start

```bash
nvm use
npm install
npm run dev      # http://localhost:4321
```

CI and GitHub Pages use the same `actionsforge/actions` reusables as the rest of
the jajera repos (markdown lint, commit messages, Dependabot auto-merge, Node CI).
Pages builds with `STRATA_BASE=/geonet-web-strata` so asset links work under the
project site at `https://jajera.github.io/geonet-web-strata/`.

## How it fits together

- **Slice** - one versioned unit. A `base` owns the shell, tokens and slots. A
  `feature` mounts into those slots.
- **Composition** - a named stack pinning exact versions, e.g.
  `base@1 + feature-felt-reports@1`. Only compositions get built. A composition can
  also place a feature in a different slot (`at:`) and override its declared
  defaults (`config:`), so à-la-carte assembly does not need a forked slice.
- **Spec** - a folder under `.kiro/specs/` bound to one composition.

Output is plain HTML, CSS and ES modules with content-hashed asset names and an
import map, matching how beta serves its front end. No framework, one dependency.

A finished slice is an HTML fragment, one CSS file and one ES module, which is
exactly what a GeoNet Go template consumes.

## Layout

```text
slices/          versioned bases and features
compositions/    pinned stacks
site/            build.mjs, serve.mjs, dist/
.kiro/           steering and specs
docs/workflow.md how to add a feature
design/          notes taken from the live beta CSS
PLAN.md          decisions and current status
```

## Current state

- **Shell**: `beta-shell` pins `base@1` alone. Spec at `/specs/base/`.
- **Feature**: `felt-reports-beta` pins `base@1 + feature-felt-reports@1`, with live
  felt reports plus `empty` / `overflow` / `extreme` fixtures. Spec at
  `/specs/felt-reports/`.
- **Feature**: `quake-counts-beta` pins `base@1 + feature-quake-counts@1`, with live
  quake counts plus `empty` / `busy` / `extreme` fixtures. Spec at
  `/specs/quake-counts/`.
- **Feature**: `haz-map-beta` pins `base@1 + feature-haz-map@1`, live MapLibre
  shaking map (no fixtures). Spec at `/specs/haz-map/`.
- **Feature**: `volcano-val-beta` pins `base@1 + feature-volcano-val@1`, with live
  volcanic alert levels plus `quiet` / `unrest` / `eruption` fixtures. Spec at
  `/specs/volcano-val/`.
- **Assembly**: `home-beta` puts map, quakes, felt reports and volcanoes on one
  page (heroes omitted, volcanoes in the sidebar). No spec; review each feature
  on its own.

See [PLAN.md](./PLAN.md) for decisions and [docs/workflow.md](./docs/workflow.md) to
add a feature.
