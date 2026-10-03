---
# cssints-mbky
title: 'cv(): base and variants that overlap without containment'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T16:38:32Z
updated_at: 2026-10-03T10:27:03Z
parent: cssints-co8y
---

## Question

Found in cssints-5d42: a `borderColor` in a `cv()` variant lost to a `borderBottom` in the base; they overlap without containment (both set border-bottom-color), and the sheet orders them by leaf count, not by intent. `cn()` refuses such pairs (cssints-33ah), but `cv()` joins base and variant classes at runtime through `_cv`, so the build never compares them. cv() knows its base and every variant at build time: check base against each variant (and compound variants) with the same `relation()`, and raise the same overlap error at the cv() call. Decide whether same-property-in-base-and-variant should be allowed (the variant is meant to win: today it wins only if the sort puts it later, which for the same property is the class hash): probably the variant's declaration must win, which needs it later in the sheet or a dropped base declaration when that variant is active.
