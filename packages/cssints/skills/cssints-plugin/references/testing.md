# Testing a plugin

Three layers, as every `@cssints/*` package does them (`packages/balance`, `packages/stuck`, `packages/squircle` in
the cssints repo are the models): fixtures through the engine, a type test, and a browser test when there is a
runtime or a visual claim. Tests are plain `node` scripts with `node:assert`; no test runner.

```
packages/<name>/
  src/index.ts          the scope
  src/runtime.ts        a browser script, if any (no imports)
  test/<name>.mjs       fixtures through the engine
  test/fixtures/*.ts    modules that use the members (some invalid on purpose)
  test/types/<name>.ts  the type test
  test/browsers.mjs     Chrome, Firefox and WebKit (optional)
```

## Fixtures through the engine

A Vite dev server in middleware mode with the plugin, a client transform per fixture, and the sheet of a module:

```js
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

const root = `${import.meta.dirname}/fixtures`;
const mode = process.argv[2];
const warnings = [];
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${root}/${f}`]);
const flat = (css) => css.replace(/\s+/g, " ").trim();

const use = await code("use.ts"); // class strings in place of the calls
const out = flat(sheet("use.ts")); // the CSS of that module
const runtime = (await client.transformRequest("virtual:cssints/runtime/x.fb")).code;

assert.match(use, /export const a = "_x-core _\w+";/);
assert.ok(out.includes("._x-core{display:flex}"), out);
assert.deepEqual(warnings, []); // no support warning left uncovered
await assert.rejects(
  code("conflict.ts"),
  /x: kernel core sets display \(this style also sets display\)/,
);
await assert.rejects(code("condition.ts"), /:hover wraps _x-core, the marker of kernel x\.core/);
```

Then the targets: run the same file again per browserslist, in a child process (the query is read once per
process):

```js
if (mode) {
  assert.equal(runtime === "export {};", mode === "native"); // empty where every target has the feature
  assert.equal(out.includes("@supports not"), mode === "old"); // fallback CSS only where needed
  await server.close();
  process.exit(0);
}
await server.close();
for (const [m, targets] of [
  ["native", "chrome 130, safari 18, firefox 130"],
  ["old", "chrome 110, safari 17.3, firefox 120"],
])
  execFileSync(process.execPath, [import.meta.filename, m], {
    env: { ...process.env, BROWSERSLIST: targets },
    stdio: "inherit",
  });
```

What to cover: the output of each member and method; each build error (`assert.rejects` with the message); the
warnings for the default targets (none, or the intended ones); the runtime module and the fallback CSS for a modern
and an old target set; a member under a condition (a method: fine; marker only: the error); nesting (a member inside
another one does not inherit its custom properties).

To look at one fixture by hand inside the cssints repo: `cd packages/cssints/test && node run.mjs fixtures/x.ts`
prints the code and the CSS (a plugin fixture must live where `cssints` resolves). With the MCP server, `compile`.

## The type test

`test/types/<name>.ts`, checked by the package's `typecheck` (`tsgo -p tsconfig.json --noEmit`, with
`test/types/*.ts` in `include`):

```ts
import { ring } from "../../src/index.ts";

export const a: string = ring().width("2px").color("red");
// @ts-expect-error not a width
export const e1 = ring().width("red");
// @ts-expect-error a method is used once
export const e2 = ring().width("1px").width("2px");
```

A value member's result goes into a property in the type test (`color(tint("red", "20%"))`), to catch a result type
the grammar rejects. Some errors only the build sees (a range in some positions, `em` where px is computed): test
those in the fixtures, not with `@ts-expect-error`.

## Browser tests

`test/browsers.mjs`, run by `bun run test:browsers` (not in `test`: it needs the browsers). The shape:

1. Build a fixture app with `vite build` (`write: false`) and a `BROWSERSLIST` that makes the fallback ship; set
   `NODE_ENV=development` so the runtime resolves to `src/`.
2. Assert on the built CSS and JS first (the `@supports not` rule is there, the script is in the bundle once).
3. Open it in Chrome (`chromium.launch({ channel: "chrome" })`), Firefox and WebKit from `playwright-core`.
4. For each browser, three runs:
   - **native**: the feature works by itself, the fallback stays off;
   - **fallback forced**: the native feature switched off (an `!important` override, or the declaration cut out of
     the CSS), the runtime or fallback CSS must produce the same result;
   - **control**: the same, with the fallback disabled (its observers replaced by no-ops, its rules removed). This
     run **must fail** the check: it proves that the test can see the difference.
5. Measure something visible: line widths, pixels of a screenshot, computed styles, the phase of an animation.

A check without a control that fails is not a test of the fallback. `BROWSERS=chrome,webkit node test/browsers.mjs`
runs some.
