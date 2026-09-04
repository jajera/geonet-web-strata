# Volcano cameras - Design

- **Requirements**: `./requirements.md`
- **Status**: agreed

## Approach

Replica of beta's `/volcano/cameras` page. Do not invent a card grid or snapshot
pipeline. Ship the same `page-hero`, `tab-bar` and `media-gallery` markup beta
serves, with live `<img src="https://images.geonet.org.nz/volcano/cameras/latest/…">`
already in the HTML. No slice JavaScript: stills need none, and caption toggles are
handled by the design-system module the base already vendors (`data-gds-details`).

`<img>` display does not need CORS. Absolute image and detail URLs keep the kit
preview working off localhost the same way other replicas point links at beta.

## Slots used

| Slot | Fragment | Why |
| ---- | -------- | --- |
| `hero` | `slots/hero.html` | Page hero **and** tab bar. On beta both sit outside `layout-container`; the base shell only exposes that region via `hero`, so the tab bar rides here to keep DOM order faithful |
| `body` | `slots/body.html` | `media-gallery` only — the shell already wraps `body` in `layout-container` / `layout-main` |

No sidebar, no band slots. This is a dedicated page composition, not a home section.

## Config

| Key | Default | Why it is a knob |
| --- | ------- | ---------------- |
| `heading` | `Volcano Cameras` | Page title; a composition might shorten it |
| `lead` | beta's lead paragraph (single line) | Copy may be edited without touching markup structure |
| `imageBase` | `https://images.geonet.org.nz/volcano/cameras/latest` | Point a preview at a stand-in host without editing eleven `src`s |
| `detailBase` | `https://beta.geonet.org.nz/volcano/cameras` | Absolute detail links off localhost |
| `aboutHref` | `https://beta.geonet.org.nz/about/volcano/cameras` | Tab target |
| `mapHref` | `https://beta.geonet.org.nz/volcano/cameras/map` | Tab target |

Per-camera id / name / alt stay literal in the fragment (R10): the builder's config
values are scalars and cannot express the list, and beta's template keeps them
static for the same reason.

## Markup

Hero + tabs (in `hero`):

```html
<div class="page-hero-container">
  <div class="page-hero -pattern -volcano-undulating">
    <div class="content">
      <h1 class="title">{{config.heading}}</h1>
      <p class="lead">{{config.lead}}</p>
    </div>
  </div>
</div>

<nav class="tab-bar" aria-label="Page tabs">
  <ul class="list">
    <li class="item"><a class="link" href="{{config.aboutHref}}">About</a></li>
    <li class="item"><a class="link" aria-current="page" href="{{config.detailBase}}">Cameras</a></li>
    <li class="item"><a class="link" href="{{config.mapHref}}">Cameras Map</a></li>
  </ul>
</nav>
```

Gallery (in `body`), one figure per camera:

```html
<div class="media-gallery">
  <div class="gallery">
    <figure class="media-block">
      <a class="image" href="{{config.detailBase}}/raoulisland">
        <img width="100%" src="{{config.imageBase}}/raoulisland.jpg" alt="Raoul Island.">
      </a>
      <figcaption class="figcaption">
        <details class="details" data-gds-details="true">
          <summary class="summary -chevron"
            data-gds-open-text="Hide caption"
            data-gds-closed-text="Show caption">Show caption</summary>
          <div class="media-caption">
            <p class="info">Raoul Island</p>
          </div>
        </details>
      </figcaption>
    </figure>
    <!-- …ten more in beta order… -->
  </div>
</div>
```

## Data flow

1. Build substitutes `{{config.*}}` scalars into the fragments.
2. Browser requests each `img` from `imageBase` on first paint.
3. GDS module enhances `data-gds-details` caption toggles (already on the base).
4. There is no fixture path and no fetch from slice code (R9).

## Tokens and styling

| Sheet | Where | Role |
| ----- | ----- | ---- |
| `page-hero.css` | base `remoteCss` | Hero pattern including `-volcano-undulating` |
| design system | base `remoteCss` | `.media-gallery`, `.media-block`, details/summary |
| `tab-bar.css` | slice `remoteCss` | Tab bar (hash re-checked from beta) |

No slice CSS unless a tiny `designSystem: none` fallback is needed later; review
requires `designSystem: link` (R8). Do **not** link `camera-gallery.css` — that is a
different, unused pattern on this page.

## Accessibility

- Page has one `<h1>` in the hero (feature owns the page).
- Tab bar has `aria-label="Page tabs"`; Cameras tab has `aria-current="page"`.
- Each image has a descriptive `alt` matching beta (R6).
- Caption disclosure is a native `<details>` / `<summary>` enhanced by GDS.

## Handoff notes

- Fragments map to the volcano cameras template includes (hero, tabs, gallery).
- On GeoNet's origin, `detailBase` / tab hrefs can become root-relative; `imageBase`
  can stay on `images.geonet.org.nz` or become whatever the template already uses.
- Re-check the `tab-bar.css` content hash when beta redeploys.

## Rejected alternatives

- **Invented `card-camera` grid with capture time / stale labels.** Not what beta
  ships; drifted immediately from the live page.
- **Build-time snapshot fixtures and a `cameras.geonet.org.nz` story.** Wrong host;
  live `<img>` to `images.geonet.org.nz` works from the kit without CORS.
- **Slice JS to assign `src` at runtime.** Unnecessary — beta inlines the URLs.
- **Putting the tab bar in `body`.** Would nest it inside `layout-main`; beta keeps
  it between hero and `layout-container`.
