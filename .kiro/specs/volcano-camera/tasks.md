# Volcano cameras - Tasks

Source of truth for progress. Do not start until requirements and design are agreed.

- **Requirements**: agreed
- **Design**: agreed

## Tasks

- [x] T1 Rewrite `requirements.md` as a beta `/volcano/cameras` replica (R1–R10)
- [x] T2 Rewrite `design.md` (hero+tabs slot split, live img refs, no slice JS)
- [x] T3 Replace `slices/feature-volcano-camera/v1/slice.yaml`
  - slots `hero` + `body`; config for heading/lead/imageBase/detailBase/aboutHref/mapHref
  - `remoteCss`: beta `tab-bar.css` only; remove card remoteCss and slice js/css
  - _Requirements: R7, R8, R10_
- [x] T4 Author `slots/hero.html` (page-hero + tab-bar) and `slots/body.html` (media-gallery of 11 live stills in beta order)
  - Absolute image and detail URLs via config; macrons and alts match beta
  - _Requirements: R1–R6, R10_
- [x] T5 Delete invented kit surface: `fixtures/*`, `public/assets/volcano-camera/*`, `js/volcano-camera.mjs`, `css/volcano-camera.css`
  - _Requirements: R9_
- [x] T6 Update `compositions/volcano-camera-beta/stack.yaml` to live-only (no `preview`, no fixture states); summary describes the beta replica
  - _Requirements: R8, R9_
- [x] T7 `npm run build`; confirm `/c/volcano-camera-beta/` emits and stills load from `images.geonet.org.nz`
  - _Requirements: Acceptance_

## Verification

- [x] `npm run build` passes
- [x] Live preview renders with real stills from `images.geonet.org.nz`
- [x] Camera set, order and names match https://beta.geonet.org.nz/volcano/cameras
- [x] No `cameras.geonet.org.nz` requests from the preview
- [ ] Compared next to beta at desktop and 320px
