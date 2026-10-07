---
# cssints-ep2l
title: 'cv() without _cv: one call, typed props, boolean and compound variants'
status: in-progress
type: feature
created_at: 2026-10-07T10:13:23Z
updated_at: 2026-10-07T10:13:23Z
---

Asked by the user (2026-10-07): _cv(cv({...})) is a strange API. Decided: keep the name cv and the key defaultVariants; the plugin replaces a cv({...}) site by the runtime call itself (injecting the runtime import), so user code writes one call and gets (props?) => string.
- [ ] cv({ base, variants, defaultVariants, compoundVariants }) returns a function at the type level: props inferred from variants (typo in a name or a value is a type error); defaultVariants checked against the variants.
- [ ] Boolean variants: a variant whose keys are true/false takes a boolean prop (button({ disabled: true })); default works as for string variants.
- [ ] compoundVariants: [{ size: "lg", tone: "loud", style: cn(...) }] (match on several values, the class added when all match; key name as in cva); cascade/drops rules stay correct (a compound style overrides its variants: say how the sheet orders it).
- [ ] The plugin puts the runtime call in place of the site and adds the runtime import itself (instrument.ts / plugin.ts); top-level and in-function sites, published libraries (tsdown output, test/pkg/ui), dev and HMR; the eval-time cv returns the same function during evaluation.
- [ ] _cv leaves user code, docs, README, demo, sky, tests (keep it internal; decide whether "cssints" still exports it: a plain _cv(cv(...)) in old code should be a clear error or keep working, say which).
- [ ] runtime.ts stays import-free and small: size before/after (min+gzip).
- [ ] Tests (fixtures, runtime.mjs, cascade.mjs, cv-chrome.mjs, types), API.md, budgets, perf.mjs if per-site paths change.
