// The cascade of one class string: the sheet puts a shorthand before every longhand it contains (counts from Chrome's
// expansion, css-grammar longhands.ts), and cn() keeps the later of the same property, keeps both under different
// conditions, and refuses two properties that overlap without one containing the other. Run: node cascade.mjs
import assert from "node:assert/strict";

const { createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");
const { relation } = await import("../src/leaves.ts");

// containment, logical against physical, aliases
for (const [a, b, want] of [
  ["border", "border-inline", "contains"],
  ["border-color", "border-inline", "overlap"],
  ["margin", "margin-inline-start", "contains"],
  ["margin-left", "margin-inline", "overlap"],
  ["margin-left", "margin-right", "apart"],
  ["border-top", "border-color", "overlap"],
  ["width", "inline-size", "overlap"],
  ["word-wrap", "overflow-wrap", "same"],
  ["all", "padding", "contains"],
  ["font-variant", "font-variant-caps", "contains"],
])
  assert.equal(relation(a, b), want, `${a} / ${b}`);

const plugins = cssints();
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "silent",
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${import.meta.dirname}/fixtures/${f}`]);
const classes = (out, n) => new RegExp(`export const ${n} = "([^"]+)"`).exec(out)?.[1].split(" ");

// the shorthand's rule comes first, so the longhand wins whatever the order of the arguments
const contain = await code("cn-contain.ts");
const css = await sheet("cn-contain.ts");
for (let i = 1; i <= 10; i++) {
  const [longhand, shorthand] = classes(contain, `c${i}`);
  assert.ok(
    css.indexOf(`.${shorthand}{`) < css.indexOf(`.${longhand}{`),
    `c${i}: the shorthand comes before its longhand\n${css}`,
  );
}

const merge = await code("cn-merge.ts");
assert.equal(classes(merge, "again").length, 1, "the same property again: the later one stays");
assert.equal(classes(merge, "layered").length, 2, "under another condition both stay");
assert.equal(classes(merge, "nested").length, 2, "nested cn(): p(4) is replaced, pl(1) stays");
assert.equal(classes(merge, "contained").length, 2, "a longhand inside a shorthand stays");
assert.equal(classes(merge, "alias").length, 1, "an alias is the same property");
assert.equal(classes(merge, "hovered").length, 1, "the same under one condition");
assert.match(await sheet("cn-merge.ts"), /padding:0\.5rem/);

await assert.rejects(code("cn-overlap.ts"), (e) => {
  assert.match(e.message, /border-top and border-color overlap without one containing the other/);
  assert.equal(e.loc?.line, 4);
  return true;
});

// cv(): base and variants join at runtime, so the build compares them. The variant wins for the same property (the base
// class is dropped while its value is active), a longhand inside a shorthand is ordered by the sheet, and an overlap
// without containment is an error at the cv() call.
const { _cv } = await import("../src/runtime.ts");
const cvIn = (out, n) =>
  JSON.parse(new RegExp(`export const ${n} = __cv\\((\\{[\\s\\S]*?\\n\\})\\);`).exec(out)[1]);
const variant = await code("cv-cascade.ts");
const cvCss = await sheet("cv-cascade.ts");
const rules = (c) => c.split(" ").map((x) => cvCss.indexOf(`.${x}{`));
const same = cvIn(variant, "same");
assert.deepEqual(same.drops, { tone: { blue: same.base } });
assert.equal(
  _cv(same)({ tone: "blue" }),
  same.variants.tone.blue,
  "the same property: the variant only",
);
assert.equal(
  _cv(same)({ tone: "plain" }),
  `${same.base} ${same.variants.tone.plain}`,
  "another value: the base stays",
);
assert.equal(_cv(same)(), same.base, "no variant: the base stays");
const covers = cvIn(variant, "covers");
assert.equal(
  _cv(covers)({ size: "lg" }),
  covers.variants.size.lg,
  "a shorthand over the base's longhand replaces it",
);
assert.equal(_cv(covers)(), covers.base);
const inside = cvIn(variant, "inside");
assert.equal(inside.drops, undefined, "a longhand inside the base's shorthand drops nothing");
assert.ok(
  rules(inside.base)[0] < rules(inside.variants.active.yes)[0],
  "the shorthand's rule comes first",
);
assert.equal(
  cvIn(variant, "layered").drops,
  undefined,
  "another condition: another layer, nothing to drop",
);
assert.equal(cvIn(variant, "peers").drops, undefined);
// a dropped class is a class of the base only: the rule of the variant is still in the sheet
assert.ok(cvCss.includes(`.${covers.variants.size.lg}{`));

// compound variants win over the base and the variants they combine: those classes are dropped while it is active
const cmp = cvIn(variant, "compound");
const button = _cv(cmp);
const { size, tone, disabled } = cmp.variants;
const [cp, cbg] = cmp.compound[0].class.split(" ");
const [loudColor] = tone.loud.split(" ");
assert.equal(
  button(),
  `${size.sm} ${tone.quiet} ${disabled.false}`,
  "defaults; the variants replace the base's padding and color",
);
assert.equal(
  button({ size: "lg", tone: "loud" }),
  `${loudColor} ${disabled.false} ${cp} ${cbg}`,
  "the compound's padding and background replace the base's, size.lg's and tone.loud's",
);
assert.equal(
  button({ size: "lg", tone: "loud", disabled: true }),
  `${loudColor} ${cp} ${cbg} ${cmp.compound[1].class}`,
  "two compounds at once; the second replaces the boolean variant's opacity",
);
assert.equal(
  button({ tone: "loud", disabled: true }),
  `${size.sm} ${tone.loud} ${cmp.compound[1].class}`,
  "a compound needs all its values",
);
assert.equal(cmp.compound[0].when.size, "lg");
assert.equal(cmp.defaultVariants.disabled, false, "a boolean default stays a boolean");

for (const [f, re, line] of [
  [
    "cv-overlap.ts",
    /cv\(\) base and variant active\.yes: border-bottom and border-color overlap without one containing the other, so the sheet cannot order them/,
    4,
  ],
  [
    "cv-overlap-keys.ts",
    /cv\(\) variants a\.x and b\.x: border-bottom and border-color overlap without one containing the other/,
    4,
  ],
  [
    "cv-same-keys.ts",
    /cv\(\) variants a\.x and b\.x both set color and can be active together, so nothing says which wins/,
    4,
  ],
  [
    "cv-compound-keys.ts",
    /cv\(\) compoundVariants\[0\] and variant tone\.loud both set color and can be active together/,
    4,
  ],
  [
    "cv-compound-pair.ts",
    /cv\(\) compoundVariants\[0\] and compoundVariants\[1\] both set color and can be active together/,
    4,
  ],
])
  await assert.rejects(code(f), (e) => {
    assert.match(e.message, re);
    assert.equal(e.loc?.line, line);
    return true;
  });

await server.close();
console.log("cascade ok");
