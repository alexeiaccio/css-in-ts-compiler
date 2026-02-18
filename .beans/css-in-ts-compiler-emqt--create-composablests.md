---
# css-in-ts-compiler-emqt
title: Create composables.ts
status: completed
type: task
priority: normal
created_at: 2026-02-18T10:18:17Z
updated_at: 2026-02-18T10:33:27Z
parent: css-in-ts-compiler-4p4k
---

- [x] Create lib/composables.ts
- [x] Define FlexUtil, GridUtil, etc. types
- [x] Export all composable utilities
- [x] Follow typed.ts createTyped pattern



## Summary

Created lib/composables.ts with:
- Flex: flex(), items(), justify(), direction(), wrap(), gap()
- Grid: grid(), cols(), rows(), areas()
- Positioning: absolute(), relative(), fixed(), sticky(), inset()
- Sizing: w(), h(), minW(), maxW(), minH(), maxH()
- Text: text(), font(), weight(), leading(), size()
- Overflow: overflow(), hidden(), scroll()
- Shorthands: m(), p(), mx(), my(), px(), py()
