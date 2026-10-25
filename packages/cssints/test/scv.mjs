// scv(): slot variants. One function, a class string per slot, from one cv() config per slot. Run: node scv.mjs
import assert from "node:assert/strict";

import { createServer } from "vite";

import cssints from "../src/plugin.ts";
import { _scv } from "../src/runtime.ts";

const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null },
  plugins: cssints(),
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
const fails = async (f) =>
  client.transformRequest(`/fixtures/${f}`).then(
    () => "",
    (e) => e.message,
  );

const out = await code("scv.ts");
assert.match(out, /^import \{ _scv as __scv \} from /, "the plugin imports the slot runtime");
assert.equal((out.match(/__scv\(/g) ?? []).length, 2, "one call per scv() site");
const configs = [...out.matchAll(/__scv\((\{[\s\S]*?\n[\t ]*\})\)/g)].map((m) => JSON.parse(m[1]));
const [config, inline] = configs;
const { base: b, label: l, icon: i } = config;
const one = (s) => s.split(" ");

// the client holds class strings only, one cv() config per slot
assert.deepEqual(Object.keys(config), ["base", "label", "icon"]);
assert.deepEqual(Object.keys(config.base), [
  "base",
  "variants",
  "defaultVariants",
  "drops",
  "compound",
]);
assert.deepEqual(i.defaultVariants, { size: "sm", disabled: false });

const button = _scv(config);
assert.deepEqual(Object.keys(button()), ["base", "label", "icon"]);
// a slot with no value of a variant keeps the key: a compound matches on the props, not on the slot's values
assert.deepEqual(i.variants.size, {});
assert.deepEqual(l.variants.tone, {});

// no props: every slot's base, and a bare style variant styles the base slot only
assert.ok(!one(button().base).includes(b.drops.size.sm), "size.sm drops the base's padding");
assert.ok(one(button().base).includes(b.drops.tone.quiet), "size.sm leaves the base's color");
assert.ok(one(button().base).includes(b.variants.disabled.false));
assert.equal(button().label, l.base, "size.sm has no value for the label");
assert.equal(button().icon, i.base);

// a record by slot: size.lg styles the base and the label, and drops what each replaces
const lg = button({ size: "lg" });
assert.deepEqual(
  l.drops,
  { size: { lg: l.base } },
  "the label's font-size is dropped by size.lg's",
);
assert.ok(!one(lg.base).includes(b.drops.size.sm));
assert.ok(one(lg.base).includes(b.variants.size.lg));
assert.equal(
  lg.label,
  `${l.variants.size.lg} ${l.compound[0].class}`,
  "the variant, then the compound",
);
assert.equal(lg.icon, i.base);

// tone.loud styles two slots: its own color class each, and it drops the base's color on the base slot
const loud = button({ tone: "loud" });
assert.equal(loud.icon, `${i.base} ${i.variants.tone.loud}`);
assert.ok(!one(loud.base).includes(b.drops.tone.loud), "tone.loud drops the base's color");
assert.ok(one(loud.base).includes(b.variants.tone.loud));

// a compound: `class` is the base slot, a slot name styles that slot; it drops the base's padding and size.lg's
const both = button({ size: "lg", tone: "loud" });
assert.equal(b.compound[0].when.size, "lg");
assert.deepEqual(
  one(b.compound[0].drops).sort(),
  [b.drops.size.sm, b.variants.size.lg].sort(),
  "the compound drops the base's padding and size.lg's",
);
assert.ok(one(both.base).includes(b.compound[0].class));
assert.ok(!one(both.base).includes(b.drops.size.sm));
assert.ok(!one(both.base).includes(b.variants.size.lg));
assert.equal(
  both.label,
  `${l.variants.size.lg} ${l.compound[0].class}`,
  "a compound with no value for a slot adds nothing there",
);

// a boolean variant, and its default
const off = button({ disabled: true });
assert.ok(one(off.base).includes(b.variants.disabled.true));
assert.ok(!one(off.base).includes(b.variants.disabled.false));
assert.equal(off.label, l.base);

// the compiled module: the call at the top of the module, and the scv() inside a function
const body = out.replace(/^import .*\n/, "").replaceAll("export const ", "const ");
// oxlint-disable-next-line typescript/no-implied-eval -- the compiled module is the thing under test
const mod = new Function("__scv", `${body}\nreturn { button, classes, badge };`)(_scv);
assert.deepEqual(mod.classes, button({ size: "lg" }), "the call at the top of the module");
assert.deepEqual(mod.badge({ size: "lg" }), _scv(inline)({ size: "lg" }));
assert.equal(mod.badge({}).label, inline.label.base, "the default of the scv() inside a function");

// a build error names the slot it is in, at the scv() call
for (const [f, re, line] of [
  [
    "scv-overlap.ts",
    /scv\(\) slot base: base and variant active\.yes: border-bottom and border-color overlap without one containing the other/,
    4,
  ],
  [
    "scv-unknown-slot.ts",
    /scv\(\) variant size\.sm styles labl, which is not a slot: base, label/,
    4,
  ],
  [
    "scv-compound-slot.ts",
    /scv\(\) compoundVariants\[0\] styles labl, which is not a slot: base, label/,
    4,
  ],
  [
    "scv-no-base.ts",
    /scv\(\) variant size\.sm is a style, and slots has no slot named base: name it, \{ base: … \}, or write \{ trigger: … \}/,
    4,
  ],
]) {
  const message = await fails(f);
  assert.match(message, re);
  assert.equal((await client.transformRequest(`/fixtures/${f}`).catch((e) => e)).loc?.line, line);
}

// an export group has it, as it has cv()
const grouped = await code("scv-group.ts");
assert.match(grouped, /^import \{ _scv as __scv \} from /);
const groupedConfig = JSON.parse(/__scv\((\{[\s\S]*?\n[\t ]*\})\)/.exec(grouped)[1]);
assert.deepEqual(Object.keys(groupedConfig), ["base", "label"]);
assert.equal(_scv(groupedConfig)({ size: "lg" }).label, groupedConfig.label.variants.size.lg);

await server.close();
console.log("scv ok");
