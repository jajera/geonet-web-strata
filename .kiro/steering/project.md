# Project steering

## What this repo is

A feature kit for the GeoNet website. It produces two things:

1. Reviewable static previews of one feature at a time, on a shell that looks like
   beta.geonet.org.nz.
2. Specs that describe those features precisely enough to be implemented in the real
   GeoNet repo.

It is not the website, it does not deploy anything public, and nothing here is an
official GeoNet product.

## What this repo is not

- Not an emergency alerting channel. Previews may show stale or wrong data. Civil
  Defence and NEMA guidance always wins.
- Not a fork of the GeoNet shell. If a feature needs the shell changed, that is a
  base slice change, discussed first.
- Not a home for vendored GeoNet assets. The design system is referenced by URL.

## Handoff target

Beta. A finished slice should be liftable by a GeoNet developer as:

- an HTML fragment that drops into a Go `html/template` block,
- one CSS file using existing design system tokens,
- one ES module registered in the import map.

Anything that cannot be expressed that way is out of scope for a slice.

## Definition of done for a feature

- Requirements, design and tasks agreed before code.
- Spec bound to a composition via `spec:` in `stack.yaml`.
- Live preview renders with real API data.
- Every fixture state listed in the composition renders.
- Empty, loading and error states are all designed, not afterthoughts.
- No new dependency without a note in the spec design saying why.

## Definition of done for the base

- Shell-only composition (`beta-shell`) builds and is listed under Shell on `/`.
- Spec at `.kiro/specs/base/` covers the slot contract and chrome rules.
- Preview compared to beta at desktop and 320px before calling a major done.
