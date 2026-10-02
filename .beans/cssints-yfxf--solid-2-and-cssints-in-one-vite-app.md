---
# cssints-yfxf
title: Solid 2 and cssints in one Vite app
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T14:20:14Z
updated_at: 2026-10-02T14:35:36Z
parent: cssints-co8y
---

## Question

cssints has only run with React. Does it work with Solid 2 RC unchanged? Build the smallest `apps/sky` skeleton: Solid 2 (`solid-js@next`, `@solidjs/web`, `@solidjs/vite-plugin`, its Oxc compiler), cssints' Vite plugin, one component using `css.*` in `class={...}`, a `cv()` with a reactive variant, a token, a `frame()`, a `container()` condition and an icon. Check: plugin order (our transform vs Solid's JSX compile, in the client and in the Module Runner's ssr environment that evaluates sites), dev server with HMR on a style edit and on a component edit, `vite build`, and type checks with tsgo and tsc 5.9 (`jsxImportSource: "@solidjs/web"`, our members in Solid's `class` attribute, which takes strings, objects and arrays in 2.0).

Answer: what works, what breaks and the fix (in the engine if it is ours, a documented setting if it is configuration), committed as the skeleton plus a test like apps/demo's build check. Engine fixes go with tests.

## Resolution

apps/sky is a working Solid 2 skeleton on cssints. Versions: solid-js 2.0.0-rc.13 and @solidjs/web 2.0.0-rc.13 (the `next` tags), @solidjs/vite-plugin 3.0.0-next.47 (its `latest` tag; `next` is the older .35; there is no 2.0 line, 3.0 is the Solid 2 plugin; its default compiler is the native one, @solidjs/compiler), Vite 8 from the repo catalog (vite-plus-core 1.0.0), tsgo and tsc 5.9.

**Works unchanged:** css.* in `class={...}` (string, array, object; `cx` is not needed), `_cv(cv(...))` with a variant driven by a signal, createTokens plus a dark theme, frame() (24px card, 7px field in Chrome), container() (column at 300px), an mdi icon, the sheet, the vite build (one CSS file, Solid inlines the static classes into its template, no engine code in the JS), HMR in dev (style edit: App.tsx and the sheet update, no reload; component edit: App.tsx only, state below resets, Solid's refresh), tsgo and tsc 5.9 (bad values fail on the part; `className` is an error in Solid's JSX types).

**Broke, and the fix (ours, in the engine):**
1. Dev: the Module Runner evaluates a module in the ssr environment, and Solid (with `ssr` off) compiles DOM output there too; @solidjs/web resolves to its server build in that environment, whose `template()` throws "Client-only API called on the server side" at the top of the module. The runner needs no render output at all, so it does not need Solid's SSR output either.
2. Build: the private evaluation server has no Solid plugin and tsconfig `jsx: "preserve"` left JSX that import analysis cannot parse.
3. Plugin order: with `solid()` listed before `cssints()` the sites were evaluated in Solid's output.

Fix (packages/cssints, test/jsx.mjs): in the ssr environment the instrumented module goes through oxc once more with JSX turned into calls of a no-op `__jsx` (a binding of DomEvaluator); and the transform hook has `order: "pre"`, so cssints sees the source before any JSX plugin whatever the order in vite.config. test/jsx.mjs fails without the change (EvalError) and passes with it, in dev and in build.

**Tests:** apps/sky `test` = test/build.mjs (build check like the demo's) + test/dev.mjs (HMR on a style edit and on a component edit, driven by the payloads of the client hot channel); `bun run typecheck` now includes apps/sky; README has a "Frameworks" section with the Solid setup. Also checked once by hand in Chrome through playwright-core (computed styles, click flips the variant, container query, HMR with no reload).

**Not covered / next:** Solid reads a module-level class const through an effect (`readShallow`), a small cost per element; `@solidjs/vite-plugin` is on an `-next` line, re-check on each RC.
