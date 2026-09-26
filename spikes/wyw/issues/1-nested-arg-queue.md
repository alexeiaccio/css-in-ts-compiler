# Nested processor calls receive their neighbours' arguments (flat expression-value queue in `buildParams`)

> Template: 🐛 Report a bug

## Environment

- wyw-in-js version: `@wyw-in-js/transform` 2.5.1, `@wyw-in-js/processor-utils` / `@wyw-in-js/shared` 2.5.0 (code is unchanged on `main` at `2ee2b73`)
- custom processor: yes (minimal one inline below)
- Bundler (+ version): none, `transform()` called directly (same result through `@wyw-in-js/vite` 2.5.1 + Vite 8.3.0)
- Node.js version: 24.21.0
- OS: macOS 15.7 (arm64)

## Description

When one processor call contains **two or more** processor calls as arguments, the calls get the wrong arguments. The outer call and the nested calls take arguments from one flat list, one by one, in source order. The outer call therefore takes an argument that belongs to its first nested call, and every later call is shifted by one.

With only one nested call the order happens to line up, so the bug only shows with two or more.

Chained calls fail the same way. In our real processor, `css.flex(center).p(2)` was built as `flex(2).p(2)`, and `css.flex().items("center").justify("x")` failed with `TypeError: _exp is not a function` at eval time.

## Reproducible Demo

`processor.cjs`: logs the params it receives and the values it is built with.

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

`css.js`: the tag's runtime, used when wyw evaluates hoisted arguments.

```js
export const css = new Proxy({}, { get: (_, name) => () => `eval:${String(name)}` });
```

`nested.js`:

```js
import { css } from "./css.js";

export const a = css.flex(css.items("center"), css.justify("end"));
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

Run `node run.mjs nested.js`.

**Expected** (`params` lines appear once per pass)

```
params flex(css.items("center"), css.justify("end"))
params items("center")
params justify("end")
...
build  flex("eval:items", "eval:justify")
build  items("center")
build  justify("end")
export const a = "flex(\"eval:items\", \"eval:justify\")";
```

**Actual**

```
params flex(css.items("center"), "center")
params items(css.justify("end"))
params justify("end")
params flex(css.items("center"), "center")
build  flex("eval:items", "center")
params items(css.justify("end"))
build  items("eval:justify")
params justify("end")
build  justify("end")
export const a = "flex(\"eval:items\", \"center\")";
```

`flex` receives `"center"`, which is `items`' argument. `items` receives `css.justify("end")`, which is `flex`'s second argument. The same happens with `eval.strategy: "hybrid"`.

## Cause

`applyOxcProcessors` passes one `templateExpressionValues` array to `buildParams` for every usage in the file:

https://github.com/wyw-in-js/wyw-in-js/blob/2ee2b736aaeba4eed596031e8e5c912f0395ac4d/packages/transform/src/utils/applyOxcProcessors/applyOxcProcessors.ts#L373-L381

`buildParams` and `buildCalleeParams` take each argument with `shiftExpressionValue`, which calls `expressionValues.shift()` without checking that the value belongs to that argument:

https://github.com/wyw-in-js/wyw-in-js/blob/2ee2b736aaeba4eed596031e8e5c912f0395ac4d/packages/transform/src/utils/applyOxcProcessors/expressionValues.ts#L163-L177
https://github.com/wyw-in-js/wyw-in-js/blob/2ee2b736aaeba4eed596031e8e5c912f0395ac4d/packages/transform/src/utils/applyOxcProcessors/expressionValues.ts#L303-L313

The list is in source order: `[css.items("center"), "center", css.justify("end"), "end"]`. The usages expect their own arguments to be next to each other: `flex` → 2, then `items` → 1, then `justify` → 1. For one nested call the two orders match, so that case works by accident.

## Suggested fix

Look each value up by the argument node's span (`expression.start`/`end`, or the `loc` already stored on each value) instead of `shift()`ing from a shared queue. The same applies to `zipTemplate` and to the `call` arguments inside `buildCalleeParams` (chains).
