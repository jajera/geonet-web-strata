# <feature> - Design

- **Requirements**: `./requirements.md`
- **Status**: draft | agreed

## Approach

One or two paragraphs. What the slice does, and why this shape.

## Slots used

| Slot | Fragment | Why |
| ---- | -------- | --- |

Note which slots are left empty, and whether a composition is expected to move any
fragment with `at:`.

## Config

| Key | Default | Why it is a knob |
| --- | ------- | ---------------- |

Only copy or endpoints a composition may reasonably vary. Anything a reviewer would
never change is not config.

## Markup

The block class, the child class names, and the modifiers. Cite the beta pattern
being followed.

## Data flow

Where the data comes from, what transforms it, and what happens on failure.

## Tokens and styling

Which tokens are used. Anything that had to be added and why.

## Accessibility

Live regions, captions, heading levels, colour-independence.

## Handoff notes

What a GeoNet developer has to do to lift this into the real repo.

## Rejected alternatives

What was considered and why not.
