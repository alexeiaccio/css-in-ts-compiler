# Prohibited: the CSS we do not generate

CSS that is legal, and that this repository still does not write. Each line says **what holds it** — a compiler refusal, a
gate, or a reviewer — because a rule nobody enforces is a preference, and a preference becomes three styles in a month.

The list is short on purpose. `packages/css-grammar` already refuses most of what a linter would catch (`css.padding("red")`,
`flex: 1px`, five stacked conditions, a `css.*` call that is not a known member): **the compiler is the first reviewer**, and
anything it can decide belongs there, not here.

## Refused by the compiler

- **An unknown property or value.** `css.padding("red")` is a build error, and so is a shorthand with one wrong part.
- **A stylesheet with no layer.** Every class is emitted into `_.*`; there is no API that prints an unlayered rule.
- **`!important`.** cssints has no member for it. The devtools overlay _reports_ one when a foreign sheet has it, which is
  the only place the word should ever appear in this repo.
- **A style that is both a plain style and a chain.** `plain styles do not chain` — the value is a declaration or a chain,
  never both.

## Refused by a gate

- **A prose comment on an added line** (`diff:check`, `no-prose-comments`). The reason goes in the commit and
  `docs/wayfinder.md`.
- **`setTimeout` in a test file** (`lint:flakes`, `no-test-sleep`), and a raised test timeout without an allowlist entry.
  A test waits on the event; a zero-delay hop is not reported.
- **A package over its prose-comment budget** (`lint:comments`, `comment-budget.json`). The budget only goes down.
- **A starter that lies about its interface** (`apps/ui`'s conformance suite) and **a kit component that loses its boundary
  under forced colours** (`apps/ui/test/forced-colors.mjs`).

## Review only

These are judgment calls the tooling cannot decide, so they are what a reviewer (human or agent) is _for_:

- **A literal where a token exists.** `css.color("#3b82f6")` is legal and wrong in the kit: the theme has the colour, the
  contrast gate has checked it, and the mode has a dark block for it. The devtools overlay names the token the winner reads;
  use it. A literal is only right inside a token definition (`tokens.ts`, `theme.ts`).
- **Colour as the only channel for state.** Selected, invalid, disabled, checked: the state must also be a shape (a thicker
  underline, a border, a glyph) or words. `forced-colors` removes every colour it cannot map, and the forced-colours test
  holds the three components that have a state today; a fourth needs its own line there.
- **`z-index` as a magic number.** The theme declares the scale (`z.popover` 10, `z.dialog` 20, `z.toast` 30, read as
  `var(--z-popover)`), and an overlay's layer is claimed through `claimOverlay` rather than numbered. `board` still uses 2 and
  3 for its own stacking — that is the exception to name out loud if it grows a fourth level.
- **A selector the kit cannot name.** `css.hover`, `within`, `attr`, `media`, `container`, `scope` are the vocabulary of the
  wrapper API; a raw selector string that reproduces one of them is how two spellings of the same rule appear.
- **A component that claims RTL, and a physical property inside it.** The decision (measured 2026-11-22): the kit and the
  packages hold **233 physical property calls against 53 logical ones**, and the split is deliberate rather than an
  oversight — ~160 of the 233 are `width`/`height` (graphical sizing, not direction), the `borderBottom` that dominates the
  rest is the tabs' rule and must stay on the _visual_ bottom even in a vertical writing mode, and `left`/`top`/`right`/
  `bottom` are absolutely positioned overlays anchored to a side by their own API (`side="left"`). What is left is
  **5 calls** of a flow-relative side — three `marginLeft`, one `marginTop`, one `paddingTop` — which should become
  `marginInlineStart`/`marginBlockStart`/`paddingBlockStart` when touched. RTL is claimed by the sliders and the multi-thumb slider, which have
  `dir: "rtl"` cases in their browser tests; a component that claims RTL gets the same test, and until then it is LTR-only by
  statement rather than by accident.

## Adding to this list

Add an item only with the gate that holds it, or with the sentence that says why no gate can. A prohibition without an
enforcement is the thing this page is against.
