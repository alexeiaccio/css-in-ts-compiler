---
# cssints-5y5a
title: Derived tokens and JSON token input
status: todo
type: task
tags:
    - wayfinder:grilling
created_at: 2026-10-02T09:06:46Z
updated_at: 2026-10-02T09:06:46Z
parent: cssints-9js6
---

## Question

From the 0.1 fog (cssints-exof) and what surface() showed: (1) derived tokens: a token defined from another (`derive(t.color.brand, (c) => ...)` computed at build time with culori, or emitted as CSS `color-mix()`/relative colour/`contrast-color()` so a theme change propagates); which, how typed, how themes interact (a derived token must follow its source when a theme overrides the source). (2) JSON token input: read DTCG 2025.10 JSON (`createTokens(json)` or an import of a .tokens.json) with generated or inferred types. Decide the shape with the user, then an implementation ticket.
