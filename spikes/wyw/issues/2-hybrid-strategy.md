# `eval.strategy: "hybrid"` resolves a processor-bound local to the processor's runtime `value` instead of its eval-time replacement

> Template: 🐛 Report a bug

## Environment

- wyw-in-js version: `@wyw-in-js/transform` 2.5.1, `@wyw-in-js/processor-utils` / `@wyw-in-js/shared` 2.5.0 (code is unchanged on `main` at `2ee2b73`)
- custom processor: yes (minimal one inline below)
- Bundler (+ version): none, `transform()` called directly (same result through `@wyw-in-js/vite` 2.5.1 + Vite 8.3.0, where `hybrid` is the default)
- Node.js version: 24.21.0
- OS: macOS 15.7 (arm64)

## Description

A processor can use `doEvaltimeReplacement()` to give a call one value at eval time and another value (`get value()`) at runtime. For example, it can pass structured data to an outer call at eval time and emit a class-name string at runtime.

If the processor call is bound to a local and the local is then passed to another processor call, the two strategies differ:

- `execute`: the outer call receives the eval-time replacement. This is correct.
- `hybrid` (the default): the outer call receives the processor's runtime `value`, and the evaluator is never asked.

The docs describe `hybrid` as "resolve values that can be proven static first, then fall back to the build-time evaluator". A value that the evaluator would compute differently was not proven. The docs also describe `value` as the value that "will replace the tagged template **at runtime**".

Returning `context.unresolved(...)` from `getStaticValue` does not change the result. The docs say to use it "when a value is intentionally not statically representable".

In our real processor, `value` is empty until `build()` runs, so `hybrid` passed `""` to the outer call. `execute` works. We use it as a workaround, but the migration guide describes it as a compatibility escape hatch.

## Reproducible Demo

Same `processor.cjs`, `css.js` and `run.mjs` as in <!-- TODO: link to the nested-arguments issue once filed --> the nested-arguments issue. They are copied here so this issue stands alone.

`processor.cjs`:

```js
const { BaseProcessor } = require("@wyw-in-js/processor-utils");
const { ValueType } = require("@wyw-in-js/shared");

// css.name(...args). Eval-time value is "eval:name"; runtime value is "name(args)" once built, else the class name.
class Processor extends BaseProcessor {
  constructor(params, ...rest) {
    super([params[0]], ...rest);
    const call = params.find((p) => p[0] === "call");
    if (!call) throw BaseProcessor.SKIP;
    this.name = params.find((p) => p[0] === "member")?.[1] ?? params[0][1].property?.name;
    this.args = call.slice(1);
    this.dependencies.push(...this.args.filter((a) => a.kind !== ValueType.CONST));
    console.log(`params ${this.name}(${this.args.map((a) => a.source).join(", ")})`);
  }
  get asSelector() { return `.${this.className}`; }
  get value() { return this.astService.stringLiteral(this.built ?? this.className); }
  build(values) {
    const args = this.args.map((a) => (a.kind === ValueType.CONST ? a.value : values.get(a.ex.name)));
    this.built = `${this.name}(${args.map((v) => JSON.stringify(v)).join(", ")})`;
    console.log(`build  ${this.built}`);
    const rule = { className: this.className, cssText: "--x:1", displayName: this.displayName, start: this.location?.start };
    this.artifacts.push(["css", [{ [this.asSelector]: rule }, []]]);
  }
  doEvaltimeReplacement() { this.replacer(this.astService.stringLiteral(`eval:${this.name}`), false); }
  doRuntimeReplacement() { this.replacer(this.value, false); }
}
module.exports = { default: Processor };
```

`css.js`:

```js
export const css = new Proxy({}, { get: (_, name) => () => `eval:${String(name)}` });
```

`run.mjs`:

```js
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { transform, TransformCacheCollection } from "@wyw-in-js/transform";

const filename = resolve(process.argv[2]);
try {
  const { code } = await transform(
    {
      cache: new TransformCacheCollection(),
      options: {
        filename,
        root: import.meta.dirname,
        pluginOptions: {
          configFile: false,
          eval: { strategy: process.argv[3] ?? "execute" },
          tagResolver: (source, tag) => (source === "./css.js" && tag === "css" ? resolve(import.meta.dirname, "processor.cjs") : null),
        },
      },
    },
    readFileSync(filename, "utf8"),
    async (what, importer) => resolve(importer, "..", what),
  );
  console.log(code);
} finally {
  process.exit(); // the eval broker keeps the event loop alive
}
```

`local.js`:

```js
import { css } from "./css.js";

const center = css.items("center");

export const a = css.flex(center);
```

```
$ node run.mjs local.js execute | grep build
build  items("center")
build  flex("eval:items")        <- expected: the eval-time replacement

$ node run.mjs local.js hybrid | grep build
build  items("center")
build  flex("cx4yzyd")           <- actual: items' runtime value (its class name, as build() has not run yet)
```

Tests we ran on top of this:

- `get value()` returns `stringLiteral("runtime-value")` → hybrid builds `flex("runtime-value")`.
- `getStaticValue(ctx) { return ctx.unresolved("eval-only"); }` → hybrid still builds `flex("cx4yzyd")`.

## Cause

When the static-value contract gives no answer, the same-file resolver falls back to reading the processor's runtime `value` expression:

https://github.com/wyw-in-js/wyw-in-js/blob/2ee2b736aaeba4eed596031e8e5c912f0395ac4d/packages/transform/src/utils/applyOxcProcessors/sameFileStaticValues.ts#L236-L247

An `unresolved` result maps to `unknownProcessorStaticValue`, so it takes the same fallback. The cross-file className map has the same assumption: a string-literal `value` is taken as the binding's value.

https://github.com/wyw-in-js/wyw-in-js/blob/2ee2b736aaeba4eed596031e8e5c912f0395ac4d/packages/transform/src/utils/applyOxcProcessors/applyOxcProcessors.ts#L424-L438

This is correct for processors whose eval-time and runtime values are the same (the built-in `css`). It is not correct for a processor that overrides `doEvaltimeReplacement` with something else.

## Related

#362 added `preeval-call` manifest semantics for this kind of processor: a runtime class string with a structured eval-time value. We could not use it, for two reasons:

- The preeval function gets only the resolved call arguments (`target(...args)`, [declarativeSemantics.ts#L593-L621](https://github.com/wyw-in-js/wyw-in-js/blob/2ee2b736aaeba4eed596031e8e5c912f0395ac4d/packages/transform/src/processors/declarativeSemantics.ts#L593-L621)). It does not get the member name, so member-style APIs such as `css.flex(...)` / `css.items(...)` behind one tag cannot be described.
- If any input is not statically known, the declarative resolver returns `null`, and `resolveLocal` still falls back to `processor.value` (link above).

`preeval-call` is also not mentioned on the website yet.

#367 / #373 fixed static values overriding evaluated ones in `execute` mode. That is a different code path.

## Suggested fix

Either of these would work for us:

1. Treat an explicit `getStaticValue()` → `unresolved` as "use the evaluator", and skip the `processor.value` fallbacks linked above. This matches the docs and lets a processor opt out.
2. Or skip the `processor.value` fallback when a processor overrides `doEvaltimeReplacement`.

If this is intended, please document that `hybrid` assumes a processor-bound local evaluates to the processor's runtime `value`, and say how a processor can opt out.
