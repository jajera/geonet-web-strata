# Volcanic alert levels - Design

- **Requirements**: `./requirements.md`
- **Status**: agreed

## Approach

Every monitored volcano has a card in `slots/body.html`, and the module fills in
level and activity. The list of volcanoes is fixed and changes on a scale of years,
while their display names and type tags are not in the feed at all, so the markup
is the right home for them. That is also how GeoNet's own template works: static
volcano metadata, `range` over it, alert level from the feed.

The consequence is that filtering and ordering happen on cards that already exist:
the module toggles beta's own `-hidden` modifier and reorders existing nodes. It
never constructs a card. A Go template would filter and sort server-side, and the
fragment would be unchanged.

## Slots used

| Slot | Fragment | Why |
| ---- | -------- | --- |
| `body` | `slots/body.html` | The whole block is one column of content |

No `hero`: this block is a section of a page, not a page. On `home-beta` the
composition moves it with `at: { body: sidebar }` into the second column, which is
where beta's home page puts it. The slice does not know or care.

## Config

| Key | Default | Why it is a knob |
| --- | ------- | ---------------- |
| `heading` | `Volcanic alert level summary` | Beta's home wording; a dedicated page would say something shorter |
| `endpoint` | `https://api.geonet.org.nz/volcano/val` | Point a preview at a stand-in host without editing JavaScript |
| `show` | `unrest` | `unrest` is the home page subset, `all` is the `/volcano` page list (R3) |

`show` is read from `data-show` by the module. Any value other than `all` is
treated as `unrest`, so a typo fails safe towards the smaller, calmer list.

## Markup

Follows the beta `home-volcano` block:

```html
<li id="ruapehu" class="card-volcano" data-val-card data-volcano="ruapehu">
  <div class="number card-val -level-0" data-val-number>
    <data class="level" value="0" data-val-level>—</data>
    <div class="description">Alert level</div>
  </div>
  <div class="header">
    <a href="…/volcano/ruapehu">Ruapehu</a>
    <span class="tag-volcano -cone"><span class="text">Cone</span></span>
  </div>
  <p class="description" data-val-activity>—</p>
</li>
```

- Block classes are beta's (`home-volcano`, `card-list`, `card-volcano`,
  `card-val -level-N`, `tag-volcano -cone`, `notes`), so `card.css`,
  `card-volcano.css` and the design system style it with no CSS of ours (R10).
- `<data value="…">` carries the level as a machine value as well as text.
- Data hooks are `data-val-*` attributes, kept separate from class names so
  styling and scripting can change independently.
- Deliberate deviation: beta wraps the type tag in a `tooltip-icon` whose button
  has no accessible name. That tooltip is omitted here rather than copied with the
  defect; see Handoff notes.

## Data flow

1. Module looks for `script[type="application/json"][data-strata-fixture="feature-volcano-val"]`.
2. If present, it parses that and paints. No fetch (R6).
3. If absent, it fetches `data-endpoint` from the block element.
4. `summarise()` keys features by `volcanoID`, clamps level to 0-5 (R5), and
   substitutes standard wording when `activity` is blank.
5. `paint()` sets the level number and `value`, swaps the `-level-N` modifier,
   writes the activity, toggles `-hidden` per `show` (R3), leaves unmentioned
   volcanoes alone (R4), then reorders cards highest-first (R2).
6. `setStatus()` writes one message into the live region with a `data-state` of
   `live`, `fixture` or `error` (R7).

A rejected fetch or non-2xx leaves the placeholders and sets the error status. Cards
start visible with em-dash placeholders rather than hidden, so a page whose
JavaScript never runs shows the volcano list rather than an empty block.

## Tokens and styling

Card layout, the alert level palette and the type tag all come from beta, linked
via `remoteCss` in the slice manifest (`card.css`, `card-volcano.css`). The slice's
own CSS is the status line, list reset, and a `--function-volcanic-alert-*` fallback
palette plus `-hidden` for the `designSystem: none` theme.

## Accessibility

- Level is a number and the activity wording is a sentence, so colour is never the
  only signal (R8).
- One polite live region for the whole block, written once per load (R7).
- Cards are an ordered list, which matches "highest first" being meaningful.
- `-hidden` uses `display: none`, so filtered-out volcanoes are out of the
  accessibility tree rather than silently focusable.
- The block heading is an `h2`; the slice supplies no `h1`, so it can sit on any
  page.

## Handoff notes

- `slots/body.html` is the `home-volcano` block. In the real repo the card list
  becomes a `range` over GeoNet's volcano metadata, joined to the VAL feed
  server-side, and both the `show` filter and the ordering move into the template.
- Volcano display names and type tags in the fragment came from beta's own
  `/volcano` page, not from the API.
- Flag to GeoNet: the `tooltip-icon` button on the type tag has no accessible name
  on the live site. It is a `<button>` with no text, no `aria-label` and no title,
  so a screen reader announces "button". Worth fixing in the design system rather
  than per page.
- The `acc` field is in the feed and unused here; an Aviation Colour Code slice
  would not need a new endpoint.

## Rejected alternatives

- **Building cards in JavaScript from the feed.** Shorter fragment, but the markup
  would no longer be liftable into a Go template, which is the point of the kit.
- **Two slices for "home subset" and "full list".** Identical markup, one filter
  apart. That is what `config.show` is for.
- **Hiding quiet volcanoes with the `hidden` attribute.** Beta already has a
  `-hidden` modifier on `card-volcano`; using it keeps the CSS contract theirs.
- **Fetching display names from the API.** They are not there, and the API's own
  names (`White Island`, `Taupo`) are not the ones beta shows.
