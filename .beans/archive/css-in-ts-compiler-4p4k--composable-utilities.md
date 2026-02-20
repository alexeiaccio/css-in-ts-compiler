---
# css-in-ts-compiler-4p4k
title: Composable Utilities
status: completed
type: epic
priority: normal
created_at: 2026-02-18T10:13:57Z
updated_at: 2026-02-18T10:49:05Z
parent: css-in-ts-compiler-8gcl
---

Create curated composable utilities for common patterns.

## Scope
~20 utilities organized by category:

### Flex (6)
flex(), items(), justify(), direction(), wrap(), gap()

### Grid (4)
grid(), cols(), rows(), areas()

### Positioning (5)
absolute(), relative(), fixed(), sticky(), inset()

### Sizing (6)
w(), h(), minW(), minH(), maxW(), maxH()

### Text (4)
text(), font(), weight(), leading()

### Overflow (5)
overflow(), overflowX(), overflowY(), hidden(), scroll()

## Usage
css.flex(css.items('center'), css.justify('center'))
// → { display: 'flex', alignItems: 'center', justifyContent: 'center' }
