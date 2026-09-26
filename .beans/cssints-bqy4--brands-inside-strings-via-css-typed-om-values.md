---
# cssints-bqy4
title: Brands inside strings via CSS Typed OM values
status: draft
type: feature
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

How a token or constructed value (`CSSUnitValue`, `CSSColorValue`) goes inside a string-form CSS value.

Options to decide:
- a second typed parameter: `border("1px solid", accent)`
- a tagged template: `css.border\`1px solid ${accent}\``, where the recognizer treats an interpolation as one token of the value's type

Constructors follow Typed OM (`CSS.px(4)`, `CSSMathSum`), serialized with `toString()`. Needs a design decision before it can be worked on.
