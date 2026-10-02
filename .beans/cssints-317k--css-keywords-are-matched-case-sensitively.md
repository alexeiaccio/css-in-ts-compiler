---
# cssints-317k
title: CSS keywords are matched case-sensitively
status: todo
type: bug
priority: high
created_at: 2026-10-02T08:51:17Z
updated_at: 2026-10-02T08:51:17Z
parent: cssints-9js6
---

## Problem

CSS keywords are ASCII case-insensitive (css-values-4 §2.4: `RED`, `Canvas`, `canvas` are the same keyword), but the twin and the type-level recogniser match them case-sensitively: `color("canvas")` and `color("RED")` fail while `Canvas` and `red` pass (found in cssints-vsc9). Decide: accept any case in the twin and the types (cost: `Lowercase<>` in the recogniser's keyword path, measure with `bun run bench`), or accept only the canonical case at the type level and any case at build time, or reject non-canonical case on purpose with a message saying so. Custom idents and function names have their own rules (function names are case-insensitive too).
