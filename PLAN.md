# geonet-web-strata - Plan

Spec driven feature kit for the GeoNet website (https://beta.geonet.org.nz/).

This repo is not the GeoNet website. It is a reusable kit for designing and
specifying features that will later land in the real site repo.

## What the real site actually is

Checked against the `www-geonet` source drop and the live beta HTML:

- **Server**: Go, `html/template`, one binary per site (`cmd/www-geonet`, `cmd/felt`).
- **Shell**: `border.html` defines the frame and pages fill `{{template "body" .}}`.
  That is already a base-plus-slot model, which is why the slice concept fits.
- **Front end**: no JS framework. Import maps, ES modules (`geonet-map-quake.mjs`),
  content-hashed assets under `/assets`, CSP nonces and SRI hashes.
- **Styling**: beta uses `geonet-design-system` (Aspekta + Soehne, `--space-*`,
  `--puia-*` tokens); classic www still uses `geonet-bootstrap` + `geonet.v7.css`.
- **Content**: Contentful for news, the 911 bar and notice bars.
- **Beta source is not public.** The zip we have is the classic origin server, and
  beta is linked from it as a separate site. Design and markup can be read from the
  served HTML and CSS; the templates cannot.

## Locked decisions

- **Target**: beta. Slices mirror the beta shell and design system, not classic www.
- **Renderer**: plain static HTML, CSS and ES modules. No framework. `site/build.mjs`
  is a Node script that resolves a composition and emits `/assets` with
  content-hashed filenames and an import map, the same shape beta serves. Astro was
  considered and dropped: it cannot produce the Go template contract, so slices
  built on it would never lift into the real repo.
- **Toolchain**: Node only (>=22), one dependency (`yaml`). Go is not installed here,
  so we do not attempt to run their server; a slice is HTML fragment + CSS + `.mjs`,
  which is exactly the unit a Go template consumes.
- **Data**: live GeoNet API calls from the browser, so a preview shows real current
  data. Fixtures are inlined per state for empty / overflow / extreme cases that live
  data cannot produce on demand. Trade-off accepted: live previews are not
  reproducible between viewings; fixture previews are.
- **Design system**: referenced by URL from beta (`theme.designSystem: link`), never
  vendored - those assets are marked private in the GeoNet repo. `base@1` ships a
  `@layer strata-fallback` so previews still render standalone with `none`.
- **Composition model**: versioned slices assembled into named compositions that pin
  exact versions. Specs bind to a composition, never to "latest".
- **Placement is a composition concern**: a feature declares which slots it can fill,
  and the composition may move it with `at:` and tune it with `config:`. So the same
  slice can be a main-column block on one page and a sidebar or full-width band on
  another without forking it.
- **Versioning rule**: bump a slice version only for a breaking change to its
  contract (removing or renaming a slot, changing what a slot expects, dropping a
  config key). Adding a slot or a config default is additive and stays on the same
  version, because unused slots render as nothing.
- **Variants are separate ids, not versions**: a classic-www shell would be
  `base-classic@1`, not `base@2`. `base@2` would mean "beta shell, new contract" and
  force every feature to widen `requiresBase` for a change that is not about them.
- **First sample feature**: felt reports widget.
- **Workspace**: Cursor remote-SSH window on workstation01 at /workspace/jajera/geonet-web-strata.

## Concepts

- **Slice** - one a-la-carte unit, versioned. Either a `base` (shell, tokens, slots)
  or a `feature` (mounts into base slots). `slice.yaml` declares id, version, kind,
  required base range, and which slots it fills.
- **Composition** - a named, pinned stack such as `base@1 + feature-felt-reports@1`.
  Only compositions get built and previewed, which avoids a combinatorial explosion.
- **Spec** - a Kiro spec folder that binds to one composition and carries
  requirements, design, and tasks.

## Slots

`base@1` slots map onto the beta page frame:

| Slot         | Beta region                                        |
| ------------ | -------------------------------------------------- |
| `alert`      | `.alert-container` / `.site-alert`, 911 bar        |
| `hero`       | `.page-hero-container`                             |
| `bandBefore` | `.layout-container-band` above the grid, full width |
| `body`       | `{{template "body" .}}` inside `.layout-container` |
| `sidebar`    | second column of `.layout-two-col`                 |
| `bandAfter`  | `.layout-container-band` below the grid, full width |

Band wrappers are always emitted and collapse via `:not(:has(*))` when unused, so
any fragment can be dropped into a band with `at:` and get the full-width row.

## Layout

```text
geonet-web-strata/
  README.md
  PLAN.md
  docs/workflow.md
  design/            # tokens, component inventory, page patterns
  slices/
    base/v1/{slice.yaml,shell.html,css/}
    feature-felt-reports/v1/{slice.yaml,slots/,css/,js/,fixtures/}
    feature-quake-counts/v1/{slice.yaml,slots/,css/,js/,fixtures/}
    feature-haz-map/v1/{slice.yaml,slots/,css/}
    feature-volcano-val/v1/{slice.yaml,slots/,css/,js/,fixtures/}
  compositions/
    <name>/stack.yaml
  site/
    build.mjs        # resolve stack, validate, emit static output
    serve.mjs        # local preview server
    dist/            # build output, gitignored
  .kiro/
    steering/        # project.md, design-system.md, a11y-content.md, tech.md
    specs/
      _template/{requirements,design,tasks}.md
      <feature>/
```

## Working rules

- One feature = one slice = one spec folder.
- Do not start tasks until requirements and design are agreed.
- `tasks.md` is the source of truth for progress.
- Base owns tokens, shell and layout. Features use slots and tokens only; they never
  fork the shell.
- Feature markup lives in HTML fragments, not in JS. Modules patch server-rendered
  DOM in place so the fragment stays liftable into a Go template.
- A feature manifest declares its required base range so an illegal stack fails the
  build.
- A feature never hardcodes copy or endpoints a composition may want to vary: declare
  them under `config:` with a default and read them as `{{config.<key>}}`.
- The composition preview URL is the review artifact.

## Status

Done:

1. Static renderer under `site/` with a passing build (`npm run build`).
2. `base@1` beta-aligned shell with `alert`, `hero`, `body`, `sidebar` slots.
3. `feature-felt-reports@1` wired to the live reported intensity endpoint, with
   `empty` / `overflow` / `extreme` fixtures.
4. Composition `felt-reports-beta` pinning `base@1 + feature-felt-reports@1`.
5. Composition `beta-shell` (shell only) and `.kiro/specs/base/` for the chrome
   contract. Landing page groups Shell vs Features and links each bound spec.
6. À-la-carte assembly: full-width band slots on `base@1`, composition-level `at:`
   placement, and per-feature `config:` with unknown keys rejected at build time.
7. `feature-volcano-val@1` (live `volcano/val`, `quiet` / `unrest` / `eruption`
   fixtures, `show: unrest|all`) with `.kiro/specs/volcano-val/`.
8. Beta stylesheets are declared per slice (`remoteCss`) instead of hardcoded in the
   builder, so a feature can bring the component CSS its markup needs.
9. Composition `home-beta`: felt reports in `body`, volcanic alert levels moved to
   `sidebar` by the composition. First proof that à-la-carte assembly needs no
   slice changes.
10. Home page block-by-block inventory in `design/beta-observations.md`, mapping
   each beta block to the slice that owns it.
11. `feature-quake-counts@1` (live `quake?MMI=3`, last-hour + deleted filter,
    `empty` / `busy` / `extreme` fixtures, circle markers) with
    `.kiro/specs/quake-counts/`.
12. Composition-level `omit:` so an assembly can drop a feature's hero (used by
    `home-beta`).
13. `feature-haz-map@1` reusing beta's MapLibre + `geonet-map-quake.mjs` stack
    (`remoteScripts` / `remoteImports` / `/assets/` rewrite). Spec at
    `.kiro/specs/haz-map/`. `home-beta` now leads with the map.
14. GitHub Actions matching jajera standards (`actionsforge/actions` reusables for
    markdown lint, commit messages, Dependabot auto-merge, Node CI; Pages build
    with `STRATA_BASE` for project-site paths).

Next steps:

1. Push and enable GitHub Pages (Settings → Pages → GitHub Actions). Review
   `/c/haz-map-beta/` and `/c/home-beta/` next to https://beta.geonet.org.nz/.
2. Next slices: volcanic activity bulletins, then news (needs a new base slot
   outside `.layout-container`).
3. Combined quakes+felt `felttable` when home assembly needs pixel fidelity.
