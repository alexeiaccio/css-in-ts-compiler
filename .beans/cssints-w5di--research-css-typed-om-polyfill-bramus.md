---
# cssints-w5di
title: Research css-typed-om polyfill (bramus)
status: completed
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

## Summary of Changes
- The polyfill has a tokenizer, a calc parser and the Typed OM value classes, but no property grammars (it delegates to the browser).
- Conclusion: our value constructors should be standard Typed OM objects (`CSSUnitValue`, `CSSMathSum`, `CSSColorValue`), not invented brands. The twin can be diff-tested against Chrome's `CSSStyleValue.parse`.
- Layering table in the wayfinder: Grammar (mdn-data), Values (Typed OM), Build (Module Runner).
