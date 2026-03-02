---
# css-in-ts-compiler-y8bu
title: Implement AST Walkers
status: completed
type: task
priority: normal
created_at: 2026-03-01T15:31:15Z
updated_at: 2026-03-01T16:53:48Z
---

Walk and transform CSS AST: visitor pattern for traversing nodes, rewrite rules for optimizations, selector specificity helpers


## Summary

- Created walker module with selector traversal utilities:
  - walkSelector: traverse all nodes in a selector
  - collectSelectorNodes: collect all nodes into array
  - findSelectorNodes: find nodes matching predicate
  - mapSelector: transform selector nodes
  - filterSelector: filter selector nodes
  - Specificity helpers: calculateSpecificity, specificityToNumber, compareSpecificity
  - Type-specific getters: getTypeSelectors, getClassSelectors, getIdSelectors, getAttributeSelectors, getPseudoClasses, getPseudoElements, getCombinators
- All 109 css-syntax tests pass
- Lint clean
