# Workflow

## Once

```bash
nvm use          # .nvmrc pins 24.19.0
npm install
```

## Every day

```bash
npm run dev      # build, then preview on http://localhost:4321
```

`http://localhost:4321/` lists compositions under **Shell** and **Features**, with
links to the preview, the bound spec, and each fixture state.

## Specs

Every composition that is a review artifact should declare `spec: <folder>` in
`stack.yaml`, pointing at `.kiro/specs/<folder>/`. The builder fails if that
folder is missing. Specs are emitted to `/specs/<folder>/` on the preview site.

The **base** has its own spec (shell contract), bound to the shell-only composition
`beta-shell`. Feature specs stay separate.

## Adding a feature

1. **Spec first.** Copy `.kiro/specs/_template/` to `.kiro/specs/<feature>/` and
   fill in `requirements.md`. Agree it before writing code.
2. **Design.** Fill in `design.md`, including the states table and the handoff notes.
   Agree that too.
3. **Create the slice.**

   ```text
   slices/feature-<name>/v1/
     slice.yaml
     slots/body.html
     css/<name>.css
     js/<name>.mjs
     fixtures/empty.json
   ```

   `slice.yaml` must declare `kind: feature`, a `requiresBase` range, and a `slots`
   map of slot name to fragment path. Copy or an endpoint a composition might want
   to vary goes under `config:` with a default, read as `{{config.<key>}}` in the
   fragment.

   If the markup reuses a beta component the base does not already link (say
   `card-volcano.css`), list that stylesheet URL under `remoteCss:` rather than
   restyling the component yourself. Copy the URL, hash and all, from the live
   page's `<link>` tags.

   For a beta ES module graph (maps): put the entry under `remoteJs:`, its
   import-map-only deps under `remoteImports:`, and any classic global (MapLibre)
   under `remoteScripts:`.
4. **Create the composition.**

   ```yaml
   name: <name>-beta
   base: base@1
   features:
     - feature-<name>@1
   spec: <name>
   theme:
     designSystem: link
   data:
     mode: live
     states: [empty]
   ```

5. **Build and review.** `npm run build`, then walk the live preview and every
   fixture state. The preview URL is the review artifact.
6. **Track progress in `tasks.md`.** Not in your head, not in chat.

## Assembling à la carte

A feature declares which slots it *can* fill; the composition decides where it
actually lands and how it is configured:

```yaml
features:
  # 1. as the slice ships it
  - feature-felt-reports@1

  # 2. moved, retitled, or with a slot dropped
  - slice: feature-felt-reports@1
    at: { body: bandAfter }        # a single-slot slice can use `at: bandAfter`
    omit: [hero]                   # keep the body without the page hero
    config:
      heading: Reported shaking, last hour
```

`bandBefore` and `bandAfter` are full-width rows either side of the two-column
grid, so a block can take the whole page width like beta's home-page rows. Both
forms can be mixed in one list. The build fails if `at:` names a slot the base
does not provide or the feature does not fill, if `omit:` names a slot the
feature does not fill, or if `config:` sets a key the slice does not declare —
so a typo is caught rather than silently ignored.

Reach for a new slice only when the markup differs. Same markup in a different
place or with different copy is a composition, not a slice.

## Changing the base

The shell has its own composition (`beta-shell`) and spec (`.kiro/specs/base/`).
Review chrome there, not on a feature composition.

- **Adding a slot** is additive: unused slots render as nothing, so it stays on the
  same base version and no feature has to change.
- **Removing or renaming a slot**, or changing what a slot expects, is breaking:
  new base major, and features that need it widen `requiresBase`.
- **A different site's shell** (classic www) is a new slice id such as
  `base-classic`, not `base@2`. A version means "same shell, new contract".

## Changing an existing slice

- Backwards-compatible fix, or a new `config:` default: edit in place, note it in
  the spec.
- Anything that changes markup contract, slots or config keys features rely on: new
  version directory (`v2`), leave `v1` alone. Existing compositions keep pointing at
  `v1`, so old specs keep rendering.

## Fixtures

Live data cannot produce a quiet hour or a magnitude 7 on demand, so each state that
matters gets a fixture. A fixture is the raw API payload, unmodified in shape, saved
under the slice's `fixtures/`. The builder inlines it and the module reads it instead
of fetching.

Name states after what they show (`empty`, `overflow`, `eruption`), and note that a
state has to exist for every feature in the composition that declares it. Two
features with different state vocabularies belong on separate compositions, which is
why the multi-feature `home-beta` is live-only.

Keep fixtures honest: same field names, same nesting, same types as the real feed. A
fixture that has been "tidied up" will hide bugs.

## Reviewing

Walk these in order:

1. Live preview. Does it show real current data?
2. Each fixture state. Empty, overflow, extreme.
3. Kill your network and reload. Does the error state read like a sentence?
4. 320px wide, then 400% zoom.
5. Tab through it. Then read `a11y-content.md` and check each point.
6. For shell reviews, open `/c/beta-shell/` next to https://beta.geonet.org.nz/.
