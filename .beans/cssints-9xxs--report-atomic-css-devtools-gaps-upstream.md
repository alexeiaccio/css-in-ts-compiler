---
# cssints-9xxs
title: Report atomic-css-devtools gaps upstream
status: in-progress
type: task
priority: normal
created_at: 2026-10-09T07:45:40Z
updated_at: 2026-10-09T08:31:13Z
parent: cssints-dk1q
---

From cssints-0a3p (docs/research/devtools.md, repro sheets in its section 1). astahmer/atomic-css-devtools src/inspect-api.ts findMatchingRules recurses into @media and @layer only: @container, @supports, @scope (and nesting) rules are missed. src/lib/rules.ts computeStyles lets the last rule win after a layer sort: specificity is ignored (._h:hover before a @media ._m in one layer shows the media value), and inspectElement sorts unlayered rules first, so they lose to layers. Open issues (or a PR) with the minimal sheets.
