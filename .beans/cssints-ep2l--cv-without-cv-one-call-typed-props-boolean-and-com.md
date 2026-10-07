---
# cssints-ep2l
title: 'cv() without _cv: one call, typed props, boolean and compound variants'
status: completed
type: feature
created_at: 2026-10-07T10:13:23Z
updated_at: 2026-10-07T10:13:23Z
---

Asked by the user (2026-10-07): _cv(cv({...})) is a strange API. Decided: keep the name cv and the key defaultVariants; the plugin replaces a cv({...}) site by the runtime call itself (injecting the runtime import), so user code writes one call and gets (props?) => string.
- [x] cv({ base, variants, defaultVariants, compoundVariants }) returns a function at the type level: props inferred from variants (typo in a name or a value is a type error); defaultVariants checked against the variants.
- [x] Boolean variants: a variant whose keys are true/false takes a boolean prop (button({ disabled: true })); default works as for string variants.
- [x] compoundVariants: [{ size: "lg", tone: "loud", class: cn(...) }] (match on several values, the class added when all match; key name as in cva); cascade/drops rules stay correct (a compound style overrides its variants: say how the sheet orders it).
- [x] The plugin puts the runtime call in place of the site and adds the runtime import itself (instrument.ts / plugin.ts); top-level and in-function sites, published libraries (tsdown output, test/pkg/ui), dev and HMR; the eval-time cv returns the same function during evaluation.
- [x] _cv leaves user code, docs, README, demo, sky, tests (keep it internal; decide whether "cssints" still exports it: a plain _cv(cv(...)) in old code should be a clear error or keep working, say which).
- [x] runtime.ts stays import-free and small: size before/after (min+gzip).
- [x] Tests (fixtures, runtime.mjs, cascade.mjs, cv-chrome.mjs, types), API.md, budgets, perf.mjs if per-site paths change.

## Summary of Changes

- **API.** `const button = cv({ base, variants, defaultVariants, compoundVariants })`, `button({ size: "lg" })`. `cv` is typed `(props?: CvProps<V>) => string` (types.ts: `CvConfig<V>`, `CvProps`, `CvValue`); props, `defaultVariants` and `compoundVariants` are checked against `variants` (`NoInfer` keeps `variants` the only source). A variant whose keys are only `true`/`false` takes a boolean. `_cv` is no longer exported by "cssints" (types or eval-time).
- **Plugin.** A cv site is replaced by `__cv({...class strings...})` and the module gets `import { _cv as __cv } from "cssints"` (plugin.ts, `CV_CALL` in instrument.ts). During evaluation `cv()` returns a function (built lazily with cvOf, memoised) that carries the config, so a top-level `button({...})` works (fixture cv-top.ts). Published libraries and HMR need nothing else: the library keeps `cv({...})` with the attribute, its `.d.ts` has the typed function (test/packages.mjs checks it).
- **compoundVariants.** Key `class` (as in cva; `style` would read as an inline `style()`, `css` is the namespace). Runtime config `compound: [{ when, class, drops? }]`; `settled()` (lib.ts) drops, for a compound, the base classes and the classes of the variant values it combines that it sets again under the same condition, so the compound wins whatever the sheet order (Chrome checked in test/cv-chrome.mjs). A compound and a variant of a key it does not name, or two compounds that can be active together, that set the same property, are a build error as for two variants.
- **Runtime.** `_cv` resolves the value of each variant (`props[name] ?? default`, a boolean by its text), so `false` is a value; the compound loop and one final filter of the dropped classes. Variants are taken in the order they were declared, not the order of the props. min+gzip 492/323 B before, 470/344 B after (bun build --minify; +21 B gzip).
- **Old code.** An import of `_cv` from "cssints" in a module the plugin handles is a build error at the import (instrument.ts) with the new form in the message, and a type error. It does not keep working: `_cv(cv(...))` would hand a function to the runtime. fixtures/cv-old.ts.
- **Type imports.** `import type { CvProps } from "cssints"` (or `import { type X }`) was a build error ("build-time ... without the attribute"); type imports are erased, so instrument.ts now skips them (fixtures/type-import.ts).
- **Migrated:** demo (Card, Showcase), sky (Shell, TabBar, Post, Avatar, Embed, Profile, Thread; Shell's `icon: Style` also keeps oxlint's `import/namespace` quiet, which stays silent only when the file has a plain import from "cssints"), tests (fixtures, runtime.mjs, cascade.mjs, cv-chrome.mjs, types/chain.ts, smoke, perf.mjs, pkg/ui), API.md, README, AGENTS.md.
- **Checks.** Green: root test, test:mbt, test:smoke, test:browsers, typecheck, lint 0/0, diff:check, demo build, sky test/build/test:browser/test:posts/test:dev, Chrome cv-chrome.mjs. Not green on master either: `vp fmt --check` (four package.json files) and `bun run bench` (errors.ts 13 errors against 12 expected, "tighten" rows); the cssints bench users.ts is +160 instantiations (884096 against 883936 on master, budget 919954). perf.mjs A/B (200 modules, `seq`): instrument 0.19 ms either way, transform median within noise (about 3%).
