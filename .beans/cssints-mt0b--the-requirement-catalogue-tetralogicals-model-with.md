---
# cssints-mt0b
title: 'The requirement catalogue: TetraLogical''s model, with Quint where it is behaviour'
status: completed
type: task
priority: normal
created_at: 2026-10-30T10:51:18Z
updated_at: 2026-10-30T18:29:37Z
---

TetraLogical (docs/research/references-2026-10.md §6) publishes per component: the problem, when to use and when not, the accessibility requirements by ten themes, each requirement as a Gherkin scenario run by Cucumber+Playwright, and an assistive-technology compatibility table with @automatic/@manual tags.

We do not need Cucumber: the behaviour half is already Quint (specs + bridges + scenario walks, differential tests) and the DOM half is the browser tests. What is missing is the written requirement per component and the AT table, and the rule for which requirement goes where.

- [x] the split, written down: a requirement that is state/transitions -> Quint spec + walk; a requirement about attributes, focus order, hit area, contrast -> a browser test; anything a screen reader says -> the AT table, manual
- [x] one component end to end as the template (tabs is the richest: arrows, Home/End, activation on up, no-JS fallback, accordion below 800px, 24/44px targets, 4.5:1)
- [x] the numbers as data, not prose: 24x24 AA / 44x44 AAA target, 4.5:1 text / 3:1 non-text, 2px focus appearance
- [x] decide where the catalogue lives: a docs page per component in the cssints repo, or records (ing.lexicon.plugin.release metadata) next to the package
- [x] the no-JS fallback rule: every component states one (cssints renders CSS-first, so this is ours to keep)

## Summary of Changes

`packages/headless/docs/requirements/README.md` sets the model: the ten TetraLogical themes, the three destinations (state and transitions to `specs/apg/<pattern>.qnt` plus its walks; attributes, focus order, hit area, contrast, activation event and no-JS to a browser test; what a screen reader says to the AT table, `@manual`), the rule for a requirement that fits none (host obligation or N/A, never an invented test), the numbers as a data table (24x24 / 44x44, 4.5:1 / 3:1 / 7:1, 2px focus, activation on up, `prefers-reduced-motion`, 800px, 200% / 320px), the no-JS fallback shape, and where the catalogue lives (a docs page per component, not a lexicon record: reviewed in the diff, no schema, not shipped).

`packages/headless/docs/requirements/tabs.md` is the worked template: problem, when to use and when not, forty-odd requirements each naming the invariant, scenario id or manual AT row that holds it, the AT table (JAWS+Chrome, NVDA+Firefox, VoiceOver macOS/iOS, TalkBack, Voice Access, contrast themes, zoom, reduced motion) with `@automatic`/`@manual` and `not run` as the honest status, the deliberate divergences (conditional panel tab stop, four-tab model, close/rename extension, RTL), and 12 numbered gaps: reflow and text scaling, the narrow accordion, roles and names, contrast, icons, trap and hidden-panel focus, focus appearance, activation on the up event, target size, the no-JS fallback, RTL, and the AT pass itself.

Linked from `packages/headless/README.md` and `docs/API.md`. No changeset: `release:check` does not require one, `docs/` is not in the package's `files`, and a changeset would bump all 27 fixed-group packages for a change to no published artifact.
