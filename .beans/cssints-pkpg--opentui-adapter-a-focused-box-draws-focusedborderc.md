---
# cssints-pkpg
title: 'OpenTUI adapter: a focused box draws focusedBorderColor, not the :focus borderColor'
status: todo
type: bug
created_at: 2026-10-10T16:03:52Z
updated_at: 2026-10-10T16:03:52Z
parent: cssints-06ws
---

Found by cssints-m0yj (sky-tui on cssints/tui).

A box draws `focusedBorderColor` (default `#00AAFF`) instead of `borderColor` while it or a descendant has focus (@opentui/core BoxRenderable.renderSelf: `hasFocusWithin ? this._focusedBorderColor : this._borderColor`). So `css.focus(css.borderColor(accent))` on a `focusable` box sets `borderColor` to the accent, and the frame shows #00AAFF: the props are right, the drawing is not. Even without a `:focus` style, a focused box with a border colour of the style turns #00AAFF.

Repro: in apps/sky-tui, a row with `css.focus(css.borderColor(c.color.accent))`, `focusable` and `r.focus()`: `row.borderColor` is #3b9cf0, the drawn border (captureSpans) is #00aaff.

Fix idea: the adapter sets `focusedBorderColor` too, to the border colour of the style in the focus state (`resolve(style, { ...state, focus: true }).borderColor`), on every apply; a test in test/render.ts that reads the drawn colour of a focused box.

Workaround in sky-tui (src/Post.tsx Row): an effect sets `r.focusedBorderColor` from `resolve(style, { focus: true }, theme)`.

## Todo

- [ ] the adapter keeps focusedBorderColor in step with the style
- [ ] a test on the drawn border of a focused box
