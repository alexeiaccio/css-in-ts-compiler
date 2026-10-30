---
# cssints-mt0b
title: 'The requirement catalogue: TetraLogical''s model, with Quint where it is behaviour'
status: todo
type: task
created_at: 2026-10-30T10:51:18Z
updated_at: 2026-10-30T10:51:18Z
---

TetraLogical (docs/research/references-2026-10.md §6) publishes per component: the problem, when to use and when not, the accessibility requirements by ten themes, each requirement as a Gherkin scenario run by Cucumber+Playwright, and an assistive-technology compatibility table with @automatic/@manual tags.

We do not need Cucumber: the behaviour half is already Quint (specs + bridges + scenario walks, differential tests) and the DOM half is the browser tests. What is missing is the written requirement per component and the AT table, and the rule for which requirement goes where.

- [ ] the split, written down: a requirement that is state/transitions -> Quint spec + walk; a requirement about attributes, focus order, hit area, contrast -> a browser test; anything a screen reader says -> the AT table, manual
- [ ] one component end to end as the template (tabs is the richest: arrows, Home/End, activation on up, no-JS fallback, accordion below 800px, 24/44px targets, 4.5:1)
- [ ] the numbers as data, not prose: 24x24 AA / 44x44 AAA target, 4.5:1 text / 3:1 non-text, 2px focus appearance
- [ ] decide where the catalogue lives: a docs page per component in the cssints repo, or records (ing.lexicon.plugin.release metadata) next to the package
- [ ] the no-JS fallback rule: every component states one (cssints renders CSS-first, so this is ours to keep)
