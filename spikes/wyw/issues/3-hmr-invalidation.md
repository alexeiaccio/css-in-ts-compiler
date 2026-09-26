# Shared dependency edit reaches only the first importer re-transformed in Vite dev

**Recommendation: do not open a new issue.** The root cause is already fixed by commit `180bccb7` ("fix(transform): retain shared dependency changes for every consumer") in open PR #427:
https://github.com/wyw-in-js/wyw-in-js/pull/427

That PR targets the `anber/transactional-cache-recovery` branch (#424, for #422), not `main`. No 2.5.x release includes it yet. The commit message says it was reproduced "with concurrent re-export consumers and an edit preserving mtime". Our case is simpler: sequential, a plain edit, no re-export, plain Vite dev. It may be worth adding as a regression case, so the draft below is a **comment on #427**.

---

## Comment draft (for #427)

Another reproducer for the stale-consumer case that `180bccb7` fixes. This one is not concurrent, has no re-export, uses a normal edit (mtime changes), and runs in `@wyw-in-js/vite` dev. Versions: `@wyw-in-js/transform` / `@wyw-in-js/vite` 2.5.1, Vite 8.3.0, Node 24.21.0, macOS 15.7.

`a.js` and `b.js` both read `space.md` from `tokens.js`. We edit `tokens.js` on a running dev server, then re-request both files. Only the file requested first sees the new value:

```
$ node run.mjs
a.js  p(4) -> p(6)  fresh
b.js  p(4) -> p(4)  STALE

$ node run.mjs b-first
b.js  p(4) -> p(6)  fresh
a.js  p(4) -> p(4)  STALE
```

Trace (wrapping `TransformCacheCollection.prototype` methods): `didDependencyChange(tokens.js)` returns `true` while checking `a.js`, then returns `false` while checking `b.js`. `b.js` is never invalidated and reuses its cached eval result. `invalidateIfChangedInternal` stores the dependency's new hash during the first consumer's check ([cache.ts#L662-L672](https://github.com/wyw-in-js/wyw-in-js/blob/2ee2b736aaeba4eed596031e8e5c912f0395ac4d/packages/transform/src/cache.ts#L662-L672), reached from [#L929-L939](https://github.com/wyw-in-js/wyw-in-js/blob/2ee2b736aaeba4eed596031e8e5c912f0395ac4d/packages/transform/src/cache.ts#L929-L939)).

On 2.5.1, a one-line change in the Vite plugin also invalidates the affected targets themselves in `handleHotUpdate`, and it fixes both orders for us. It may be a useful belt-and-braces change until the cache fix ships ([vite/src/index.ts#L972](https://github.com/wyw-in-js/wyw-in-js/blob/2ee2b736aaeba4eed596031e8e5c912f0395ac4d/packages/vite/src/index.ts#L972)):

```diff
-      const deps = affected.flatMap((target) => target.dependencies);
+      const deps = affected.flatMap((target) => [target.id, ...target.dependencies]);
```

<details><summary>Repro files</summary>

`processor.cjs`: any processor that emits CSS works. The Vite plugin only tracks HMR targets for files with CSS. This one's runtime value shows the value it was built with.

```js
const { BaseProcessor } = require("@wyw-in-js/processor-utils");
const { ValueType } = require("@wyw-in-js/shared");

class Processor extends BaseProcessor {
  constructor(params, ...rest) {
    super([params[0]], ...rest);
    const call = params.find((p) => p[0] === "call");
    if (!call) throw BaseProcessor.SKIP;
    this.name = params.find((p) => p[0] === "member")?.[1] ?? params[0][1].property?.name;
    this.args = call.slice(1);
    this.dependencies.push(...this.args.filter((a) => a.kind !== ValueType.CONST));
  }
  get asSelector() { return `.${this.className}`; }
  get value() { return this.astService.stringLiteral(this.built ?? this.className); }
  build(values) {
    const args = this.args.map((a) => (a.kind === ValueType.CONST ? a.value : values.get(a.ex.name)));
    this.built = `${this.name}(${args.map((v) => JSON.stringify(v)).join(", ")})`;
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

`hmr/vite.config.js`:

```js
import { resolve } from "node:path";
import wyw from "@wyw-in-js/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    wyw({
      eval: { strategy: "execute" },
      tagResolver: (source, tag) => (source === "../css.js" && tag === "css" ? resolve(import.meta.dirname, "../processor.cjs") : null),
    }),
  ],
});
```

`hmr/tokens.js`:

```js
export const space = { md: 4 };
```

`hmr/a.js` (`hmr/b.js` is the same with `b`):

```js
import { css } from "../css.js";
import { space } from "./tokens.js";

export const a = css.p(space.md);
```

`hmr/run.mjs`:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "vite";

const root = import.meta.dirname;
const tokens = `${root}/tokens.js`;
const original = readFileSync(tokens, "utf8");
const order = process.argv[2] === "b-first" ? ["b", "a"] : ["a", "b"];

const server = await createServer({ root, configFile: `${root}/vite.config.js`, logLevel: "warn" });
await server.listen();
const values = async () => {
  const out = {};
  for (const name of order) out[name] = (await server.transformRequest(`/${name}.js`)).code.match(/= "(.*)"/)[1];
  return out;
};

try {
  const before = await values();
  const changed = new Promise((r) => server.watcher.once("change", r));
  writeFileSync(tokens, original.replace("md: 4", "md: 6"));
  await changed;
  await new Promise((r) => setTimeout(r, 1000));
  const after = await values();
  for (const name of order) console.log(`${name}.js  ${before[name]} -> ${after[name]}  ${before[name] === after[name] ? "STALE" : "fresh"}`);
} finally {
  writeFileSync(tokens, original);
  await server.close();
  process.exit();
}
```

</details>

---

## If a standalone issue is preferred instead

Title: `Vite dev: editing a shared dependency updates only the first importer re-transformed`. Use the same body as above, and reference #427 / `180bccb7` as the likely fix.
