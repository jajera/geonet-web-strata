# Volcano cameras - Requirements

- **Slice**: `feature-volcano-camera@1`
- **Composition**: `volcano-camera-beta` (`base@1 + feature-volcano-camera@1`)
- **Preview**: `/c/volcano-camera-beta/`
- **Status**: agreed

## Problem

Someone wants to see GeoNet's volcano cameras right now — the same gallery as
[beta.geonet.org.nz/volcano/cameras](https://beta.geonet.org.nz/volcano/cameras):
latest stills from the remote network, named, linked through to each camera's page.
Reviewing an invented card grid with placeholder art is not useful. This slice
replicas that page so it can be reviewed next to beta and later lifted into a Go
template.

## In scope

- Page hero ("Volcano Cameras" + lead copy), matching beta's volcano undulating pattern.
- Tab bar: About / Cameras (current) / Cameras Map, with About and Map linking out to beta.
- Media gallery of all eleven live stills, in beta's order and with beta's display names.
- Each still links to that camera's page on beta; captions use the GDS details pattern.
- Live images from `https://images.geonet.org.nz/volcano/cameras/latest/…`.

## Out of scope

- Cameras Map page content and About page content.
- Per-camera detail pages, timelapse, 1-second burst, or historical archives.
- Invented capture-time / stale labelling, snapshot fixture assets, or a
  `cameras.geonet.org.nz` host (beta does not use that host for these stills).
- Volcanic Alert Levels, bulletins, sensor plots, and the volcano map (other slices).

## Data

Live stills published under `https://images.geonet.org.nz/volcano/cameras/latest/`,
refreshed by GeoNet about every ten minutes. Names, alts, and detail paths are
static in the fragment — the same place beta keeps them.

| Field | Source | Notes |
| ----- | ------ | ----- |
| Camera id | static in markup | Path segment, e.g. `ruapehunorth` |
| Display name | static in markup | e.g. `Whakatāne`, `Taranaki Maunga` |
| Image URL | `images.geonet.org.nz/…/latest/{id}.jpg` | Absolute so the kit preview loads off localhost |
| Detail href | `beta.geonet.org.nz/volcano/cameras/{id}` | Absolute for the same reason |
| Alt text | static in markup | Matches beta (name + period) |

Cameras in beta order: Raoul Island, Te Kaha, Whakatāne, Tongariro, Tongariro Te
Maari Crater, Ruapehu North, Ngauruhoe, Ruapehu East, Ngauruhoe & Tongariro,
Ruapehu South, Taranaki Maunga.

## Requirements

1. **R1** Render beta's `page-hero` with the volcano undulating pattern, the heading
   "Volcano Cameras", and the lead copy from the live page.
2. **R2** Render beta's `tab-bar` with About, Cameras (aria-current), and Cameras Map;
   About and Map link to the corresponding pages on beta.
3. **R3** Render beta's `media-gallery` / `media-block` markup for every camera in
   the Data table order, with live `<img>` sources on `images.geonet.org.nz`.
4. **R4** Each still is wrapped in a link to that camera's page on beta; the caption
   uses the GDS `details` / `summary -chevron` pattern with the display name.
5. **R5** Display names carry correct macrons (e.g. Whakatāne) and match beta.
6. **R6** Alt text describes the camera by name (as beta does) and is not the bare
   word "image".
7. **R7** Link beta's `tab-bar.css`. Media-gallery / media-block styling comes from
   the design system already on the base; page-hero CSS is already on the base.
8. **R8** `designSystem: link` is required for a reviewable preview; `none` is not a
   supported review state for this slice.
9. **R9** No fixture states. Live stills only (same posture as haz-map).
10. **R10** Emit hero + gallery as HTML fragments whose markup and class names
    require no edits to be placed in a Go `html/template`, using only
    server-substitutable config for copy knobs.

## States

| State | Trigger | Expected |
| ----- | ------- | -------- |
| Loading | Images resolving | Gallery figures present; browser shows empty/`width=100%` boxes until decode |
| Populated | Stills return 200 | All eleven latest frames visible with captions |
| Single failure | One still 404s | Browser broken-image for that tile; other stills unaffected; page chrome intact |
| Error | Image host unreachable | Broken images; hero, tabs and chrome still intact |

## Acceptance

- [x] `npm run build` emits `/c/volcano-camera-beta/`
- [x] Live preview loads stills from `images.geonet.org.nz` (no `cameras.geonet.org.nz`)
- [x] Camera set, order and names match https://beta.geonet.org.nz/volcano/cameras
- [ ] Compared next to beta at desktop and 320px
- [ ] Reviewed on the preview URL by a second person
