# Tech steering

## Stack

- Node >=22 (`.nvmrc` pins 24.19.0; make sure nvm is active, `/usr/bin/node` is an
  unrelated apt Node).
- One dependency: `yaml`, used by the builder to read manifests.
- Output is plain HTML, CSS and ES modules. No bundler, no framework, no TypeScript
  build step.

## Commands

```bash
npm install
npm run build     # resolve compositions -> site/dist
npm run serve     # preview on http://localhost:4321
npm run dev       # build then serve
npm test          # syntax-check the Node entrypoints
```

Set `STRATA_BASE=/geonet-web-strata` (no trailing slash) when building for GitHub
Pages project sites so `/assets` and `/c` links resolve under the repo path.
Local previews leave it unset.

## How the builder works

`site/build.mjs`:

1. Loads every `slices/<id>/v<n>/slice.yaml` and checks id/version match the path.
2. Loads every `compositions/<name>/stack.yaml`.
3. Resolves the stack: base must be a base, features must be features, each
   feature's `requiresBase` range must hold, and every slot it fills — after any
   composition `at:` remap — must exist on the base.
4. Merges each feature's `config:` defaults with the composition's overrides,
   rejecting keys the slice does not declare.
5. Copies slice CSS and JS to `/assets/<kind>/<hash>-<name>` and computes SRI, the
   same shape beta serves. `remoteCss` entries stay links to beta; `remoteJs` /
   `remoteImports` are fetched and re-emitted locally (ESM needs same-origin);
   `remoteScripts` are classic scripts (e.g. MapLibre) loaded before modules.
   Root-relative `/assets/…` strings inside fetched JS are rewritten to absolute
   beta URLs so icons still load from a kit preview.
6. Renders slot fragments (`{{config.<key>}}`, HTML-escaped) then the base shell
   (`{{name}}` values and `{{slot name}}` mount points).
7. Emits `/c/<composition>/` for live data plus `/c/<composition>/<state>/` for each
   fixture state.

Any violation is a hard build failure, including an unknown placeholder in a shell
or fragment. An illegal stack must never render.

## Conventions

- Slot fragments are HTML files under `slots/`, one per slot.
- Placement is the composition's call (`at:` / `omit:`), not the slice's. Do not
  fork a slice just to move it, drop its hero, or retitle it; declare `config:`
  defaults and override them.
- `config:` values are scalars substituted into fragments. Anything conditional goes
  in a data attribute the CSS or module reads; the builder is not a template engine.
- Modules patch server-rendered DOM. Do not build markup in JavaScript.
- Read fixture payloads from the inlined
  `script[type="application/json"][data-strata-fixture="<slice-id>"]`; if absent,
  fetch live.
- Use design system token names (`--space-m`, `--puia-00`) with a local fallback
  value so the `designSystem: none` theme still looks sane.
- Reuse a beta component by linking its stylesheet through `remoteCss` and using its
  class names. Do not reimplement a component in slice CSS; slice CSS is for the
  bits beta has no component for, plus fallbacks.
- Version bump rules: adding a slot or a `config:` default is additive and stays on
  the current version. Removing or renaming a slot, or changing a token contract, is
  a new major, and a feature that needs it declares the new range. A different
  site's shell is a new slice id (`base-classic`), not a version of `base`.

## GeoNet APIs used

| Purpose            | Endpoint                                              |
| ------------------ | ----------------------------------------------------- |
| Reported shaking   | `https://api.geonet.org.nz/intensity?type=reported`   |
| Measured shaking   | `https://api.geonet.org.nz/intensity?type=measured`   |
| Quakes above MMI   | `https://api.geonet.org.nz/quake?MMI=3`               |
| Volcanic alert     | `https://api.geonet.org.nz/volcano/val`               |

These send permissive CORS headers, so browser fetches work from a static preview.
Camera metadata and FDSN waveforms do not; those need a snapshot or a proxy.
