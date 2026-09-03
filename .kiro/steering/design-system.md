# Design system steering

Read from the served beta CSS. These are observations of the real thing, not a
parallel design system.

## Class naming

Beta uses a block plus scoped-child pattern with dash-prefixed modifiers:

```html
<div class="page-hero -altogether -pattern">
  <div class="content">
    <h1 class="title">…</h1>
  </div>
</div>
```

- Block gets the semantic name: `page-hero`, `home-shaking`, `felttable`, `card`.
- Children use short generic names scoped by the block: `.content`, `.title`,
  `.body`, `.text`, `.list`, `.item`, `.link`, `.footer`.
- Modifiers are dash-prefixed: `-full-width`, `-plain`, `-secondary`, `-small`,
  `-on-dark`, `-forward-arrow`, `-inline`.
- CSS uses native nesting and child selectors, so children only style inside their
  block. Follow that or styles will leak.

Match this in feature CSS. A slice that invents `felt-reports__row--empty` will not
be liftable.

## Tokens

| Token                 | Use                                    |
| --------------------- | -------------------------------------- |
| `--space-3xs … --space-xl` | all spacing                       |
| `--page-margin`       | horizontal page gutter                 |
| `--max-content-width` | content column cap                     |
| `--puia-00`, `--puia-90` | surface tints and dark surfaces     |

Fonts are Aspekta (display) and Soehne (body).

## MMI palette

From beta's `marker.css`. Swatches are `<svg class="marker-mmi">` with a child whose
class is the level; the child gets the fill, never the svg.

| Level | Colour    | Label        |
| ----- | --------- | ------------ |
| mmi1  | `#FFF7F3` | Unnoticeable |
| mmi2  | `#FEEDDE` | Unnoticeable |
| mmi3  | `#FDD0A2` | Weak         |
| mmi4  | `#FDAE6B` | Light        |
| mmi5  | `#FD8D3C` | Moderate     |
| mmi6  | `#F16913` | Strong       |
| mmi7  | `#D9480F` | Severe       |
| mmi8  | `#BD0026` | Extreme      |
| mmi9  | `#A30021` | Extreme      |

Quakes are drawn as circles, felt reports as squares, and marker size grows with
intensity. Keep that mapping: shape carries meaning here, not just colour.

## Tables

Beta's table pattern is `class="geonet-table -plain -full-width"`, header cells
`class="theader"`, body rows `class="trow"`. The home page shaking table adds a
`felttable` block class.
