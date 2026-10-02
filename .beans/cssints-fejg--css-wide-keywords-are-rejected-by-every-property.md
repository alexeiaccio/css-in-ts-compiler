---
# cssints-fejg
title: CSS-wide keywords are rejected by every property
status: in-progress
type: bug
priority: high
created_at: 2026-10-02T16:29:21Z
updated_at: 2026-10-02T16:29:21Z
parent: cssints-co8y
---

## Problem

Found in cssints-11l0: `color("inherit")`, `fontFamily("inherit")`, `font("inherit")` fail in the types and at build time. Every property accepts the CSS-wide keywords (css-values-4 §6.1: `initial`, `inherit`, `unset`, `revert`, `revert-layer`) as the whole value. Accept them in the type-level recogniser (`Valid`/`MatchesValue`: a whole value equal to a CSS-wide keyword is valid for any property; cheap, since it is a whole-string check before the grammar) and in the twin, and in plugin grammars (`property()`/`method()`)? Decide for plugin grammars (they set custom properties: probably yes for property(), no need for methods). Keep `bun run bench` within budget; fixtures and cases both ways; then sky drops the plain-CSS `font-family: inherit` rule.
