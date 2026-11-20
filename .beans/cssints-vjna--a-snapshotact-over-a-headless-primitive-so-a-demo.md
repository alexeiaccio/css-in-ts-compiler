---
# cssints-vjna
title: a snapshot()/act() over a headless primitive, so a demo is agent-drivable
status: completed
type: feature
priority: low
tags:
    - wayfinder:task
created_at: 2026-11-19T21:45:58Z
updated_at: 2026-11-19T21:45:58Z
---

From UI SDK's sink (https://ui-sdk.dev/sink, read 2026-11-20): one demo reads "a scripted agent reads the form with snapshot(), then fills it with act()" — an API over the behaviour's own state, so a test or an agent drives exactly what a person drives.

Ours is close in shape: a primitive in `@cssints/headless` is plain state plus attribute objects (createListbox, createSlider, createCombobox, ...). What is missing is the entry point:

- `snapshot()`: the widget's *observable* state in one object (value, open, active option, disabled options, the announcement) — what a test would assert and an agent would read.
- `act(intent)`: the same intents the keys and pointers produce (`next`, `select(x)`, `open`, `type(sa)`), so a script drives the state machine rather than synthesising DOM events.

Why it is worth it: the kit's demos could then be driven without a browser (today a headless test mounts Solid and dispatches events), `@cssints/mcp` could act on a live page's widget, and the docs could ship a scripted demo. Contract sketch: one intent list per primitive, the same one its keymap already switches on; `snapshot()` returns only what the ARIA attributes expose, so it cannot drift from what a reader hears.

Not started: the sink page landed first (the page that would show it).

## Done (2026-11-20)

First primitive: `createRadioGroup` (wayfinder entry, same date). `snapshot()` returns JSON of what ARIA says
(`checked`, `focused`, `count`, `disabled`, `flavor`, `orientation`); `act()` takes `next` / `previous` / `first` / `last`,
`focus` and `check`, through the keys' and the pointer's own functions. Five browser tests, one of which caught a real bug
(an all-disabled group could focus index `count()`).

Second: `createListbox` (same day), with the distinction the radio did not have — a list moves by DOM focus, so `act` focuses
the option's element and the state follows `focusin`; its two controlled props stopped being effect-written signals in the
same change.

Left: the rest of the patterns, and a `Driver` over `act`/`snapshot` so a ported scenario runs against the primitive without
a DOM — the reason the vocabulary is per pattern rather than a generic step type.
