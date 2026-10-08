---
# cssints-pnnw
title: 'Value members: positional arguments with an options object, and sub-members (fluid.container)'
status: completed
type: feature
priority: low
created_at: 2026-10-08T09:42:20Z
updated_at: 2026-10-08T11:07:47Z
---

Found by fluid() (cssints-ni5c, repros under "## Engine gaps").

- A value member's `args` is only a grammar string; call members take a tuple ending in an options object, value members do not. fluid wraps a four-length member in a plain function, and passes `zoom: false` as a trailing `unchecked` keyword part.
- A member key cannot contain a dot and value members have no methods, so `fluid.container` is a member `fluidContainer` attached by hand, and its errors say `fluidContainer:`.

## Todo
- [x] tuple args (with a trailing options object) for value members
- [x] a label override or dotted names for errors

## Summary of Changes

- **Tuple args for value members.** `ValueDef.args` is an `ArgsDef`, as a call member's. The types share `Callable` (call and value members). The runtime shares `argsOf`, split out of `callOf`. `value` gets an array: a grammar's parts one by one, as before, or the arguments as `build` gets them (an options object that is left out is `{}`).
- **`fn({ args, value })`** (cssints/plugin) is an identity function. A table cannot type `value` from the `args` beside it: through `Valid` the parameter came out `never` or implicit `any`, because TypeScript does not infer the table type through a context-sensitive function in it. This is why call members use `build()`. A value member returns a value, not a style, so it uses this call. The types reject a tuple or `arg<T>()` value member written without `fn()`.
- **`label?: string`** on a value member names it in the type and build errors. It was chosen over dotted keys, because every key check, `uses` path and export walk reads a dot as an embedded scope. It was chosen over member methods, because those would be a new kind of entry. `label` is one optional field.
- **fluid.** `fluid` is `fn({ args: ["<length [0,∞]>", "<length [0,∞]>", { "from?", "to?", "zoom?": arg<boolean>() }], value })`. `fluidContainer` has `label: "fluid.container"`. The plain wrapper and the `unchecked` part are gone: `fluid = Object.assign(members.fluid, { container: members.fluidContainer })`. The grammar error is now `fluid.container(2): unexpected "red" in "red", expected <length>`. The `Length` and `Range` types are removed. Lost: `em` is no longer a type error, only a build error, because a grammar cannot name units. README and tests are updated.
- **Type cost.** A tuple value member costs about 1.06k instantiations per call (tsc, 32 calls of fluid's shape). The table checks add about 1.3k to plugins-defs.ts. Calls of the existing members do not change. The bench reads the tracked dist/, so these numbers come from a local rebuild. dist/ is not rebuilt in this branch.
