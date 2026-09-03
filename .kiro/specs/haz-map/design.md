# Haz map - Design

- **Requirements**: `./requirements.md`
- **Status**: agreed

## Approach

Do not reimplement the map. Fetch beta's modules at build time, put their
dependencies on the import map, load MapLibre as a classic global, and mount the
same markup beta uses for `#geonet-haz-map`. The entry module decides it is a home
map because the kit path is not `/earthquake/…`.

That keeps the slice liftable: the HTML fragment is what a Go template would emit,
and the JS stays GeoNet's.

## Slots used

| Slot | Fragment | Why |
| ---- | -------- | --- |
| `body` | `slots/body.html` | Map sits in the main column; no page hero |

On `home-beta` it mounts first in `body`, above the intensity tables.

## Config

| Key | Default | Why it is a knob |
| --- | ------- | ---------------- |
| `heading` | `Shaking in the last hour` | Beta home wording |
| `actionLabel` | `View all earthquakes` | Button label |
| `actionHref` | `https://beta.geonet.org.nz/earthquake` | Absolute so it works off beta's origin |

## Markup

```html
<div class="home-shaking">
  <h2 class="title">…</h2>
  <div class="buttons">…</div>
  <div class="haz-map -full-width">
    <div id="geonet-haz-map" class="map"></div>
    <div class="footer">…copyright…fullscreen…</div>
  </div>
</div>
<dialog id="haz-map-modal" class="haz-map-modal">…</dialog>
```

`id="geonet-haz-map"` is required: beta's `initBaseMap("geonet-haz-map", …)` hardcodes it.
The fullscreen helper moves that node into the dialog and back.

## Asset wiring

| Kind | Manifest key | Role |
| ---- | ------------ | ---- |
| Classic script | `remoteScripts` | `maplibre-gl.js` global |
| Entry module | `remoteJs` | `geonet-map-quake.mjs` |
| Import-map only | `remoteImports` | `geonet-map`, `iconUtils`, `dateUtils`, `shakingUtils` |
| Styles | `remoteCss` | `haz-map`, MapLibre, `geonet-maplibre` |

Root-relative `/assets/…` strings inside fetched modules are rewritten to
`https://beta.geonet.org.nz/assets/…` at emit time so basemap switcher icons load
from a localhost preview. Stylesheets stay linked from beta, so their own
`url(/assets/…)` references already resolve on beta's origin.

## Tokens and styling

Height and button row come from beta `home.css` (already on the base) plus a local
fallback height for `designSystem: none`. Expand-icon mask URL is pointed at beta
in the slice CSS so it still works if the remote sheet's root-relative mask 404s.

## Accessibility

- Map container has `role="region"` and an `aria-label`.
- Copyright control uses the native `popover` attribute, as on beta.
- Full-screen is a `<dialog>` with an explicit Close button.

## Handoff notes

- Fragment maps to the home template's haz-map include.
- Do not send the kit's `remoteImports` rewrite logic to GeoNet; on their origin
  `/assets/…` already works.
- MapLibre and the GeoNet map modules are the source of truth — bump the hashed
  URLs in `slice.yaml` when beta redeploys them.

## Rejected alternatives

- **A thin MapLibre wrapper of our own.** Would diverge immediately from layer
  filters, legends and geohash behaviour.
- **Fixture states for quiet/busy maps.** Beta's modules own the fetches; faking
  them would mean forking those modules.
- **Loading every dependency as a `<script type="module">`.** Only the entry has
  side effects; the rest belong on the import map only.
