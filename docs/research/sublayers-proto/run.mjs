// Each case of cases.mjs through the plugin, then through Chrome: the computed style of the element against what the author
// meant. Run: node run.mjs [id ...]      writes fixtures/ (generated), results.json, and prints one line per case.
//
// The intent is built in the same page: a reference element gets the items as inline declarations, in the order the author
// means (the items as written, but a shorthand before the properties Chrome says it contains; conditional items after the
// unconditional ones, a layer at a time), so Chrome's own cascade does the resolving.
// Four sheets are tried on every case: `engine` (sheet.ts as it is), `mdn` (the same comparator rebuilt in lib.mjs: it must
// agree with the engine), `truth` (the comparator on Chrome's leaf count) and `sublayers` (one sublayer per nesting depth).
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { cases } from "./cases.mjs";
import { here, launch, lightningcss, pkg, sheetOf, truthOf, vite } from "./lib.mjs";

const { PROPS, PSEUDOS } = await import(pathToFileURL(join(pkg, "src/lib.ts")).href);
const cssints = (await import(pathToFileURL(join(pkg, "src/plugin.ts")).href)).default;

const only = process.argv.slice(2);
const chosen = cases.filter((c) => !only.length || only.includes(c.id));

// --- fixtures
const fixtures = join(here, "fixtures");
rmSync(fixtures, { recursive: true, force: true });
mkdirSync(fixtures);
const MEDIA = { md: 640, lg: 960 };
const call = (i) =>
  i.w?.length
    ? `${MEDIA[i.w[0]] ? i.w[0] : `css.${i.w[0]}`}(${call({ ...i, w: i.w.slice(1) })})`
    : `css.${i.m}(${JSON.stringify(i.v)})`;
const HEAD = `import * as css from "cssints" with { type: "cssints" };\nconst md = css.media("(width >= 40rem)");\nconst lg = css.media("(width >= 60rem)");\n`;
const files = {}; // id -> { ab: [file, ...], ba: [file, ...] } for modules, else one file
for (const c of chosen) {
  if (c.modules) {
    c.items.forEach((it, k) =>
      writeFileSync(join(fixtures, `${c.id}_${k}.ts`), `${HEAD}export const s = ${call(it)};\n`),
    );
  } else {
    const ab = `css.cn(${c.items.map(call).join(", ")})`;
    const ba = `css.cn(${c.items.toReversed().map(call).join(", ")})`;
    writeFileSync(
      join(fixtures, `${c.id}.ts`),
      `${HEAD}export const ab = ${ab};\nexport const ba = ${ba};\n`,
    );
  }
}

// --- the plugin
const plugins = cssints();
const server = await vite.createServer({
  root: here,
  configFile: false,
  logLevel: "warn",
  resolve: { alias: { cssints: join(pkg, "src/index.ts") } },
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const classes = async (file, name) => {
  const { code } = await client.transformRequest(`/fixtures/${file}`);
  const m = code.match(new RegExp(`export const ${name} = ("[^"]*")`));
  if (!m) throw new Error(`${file}: no ${name} in\n${code}`);
  return JSON.parse(m[1]);
};
const elements = []; // { id, order, cls, items, ... }
for (const c of chosen) {
  const items = c.items.map((it) => ({ ...it, prop: PROPS[it.m] }));
  for (const order of ["ab", "ba"]) {
    const list = order === "ab" ? items : items.toReversed();
    let cls;
    let sheetFiles;
    if (c.modules) {
      const idx = list.map((it) => items.indexOf(it));
      cls = (await Promise.all(idx.map((k) => classes(`${c.id}_${k}.ts`, "s")))).join(" ");
      sheetFiles = idx.map((k) => join(fixtures, `${c.id}_${k}.ts`));
    } else {
      cls = await classes(`${c.id}.ts`, order);
      sheetFiles = [join(fixtures, `${c.id}.ts`)];
    }
    elements.push({ c, order, list, cls, sheetFiles });
  }
}
const rules = globalThis.__cssints.rules;
const allFiles = [...new Set(elements.flatMap((e) => e.sheetFiles))];
const engine = plugins[0].api.sheet(allFiles);
// the sheet does not depend on the order the modules are given in
const reversed = plugins[0].api.sheet(allFiles.toReversed());
const sheetsAgree = engine === reversed;
// `min` is the engine's sheet through LightningCSS's minifier, as the build runs it
const sheets = {
  engine,
  min: lightningcss
    .transform({ filename: "sheet.css", code: Buffer.from(engine), minify: true })
    .code.toString(),
  mdn: sheetOf(rules, "mdn"),
};

// reachability of the `container` shorthand: css.container is the wrapper
let containerProperty;
try {
  writeFileSync(
    join(fixtures, "container.ts"),
    `${HEAD}export const s = css.container("inline-size / side");\n`,
  );
  await client.transformRequest("/fixtures/container.ts");
  containerProperty = "reachable";
} catch (e) {
  containerProperty = `not a property: ${e.message.split("\n")[0]}`;
}
await server.close();

// --- Chrome
const browser = await launch();
const chrome = browser.version();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const props = [...new Set(Object.values(PROPS))];
const truth = await truthOf(page, props);
sheets.truth = sheetOf(rules, "truth", truth);
sheets.where = sheetOf(rules, "where", truth);
sheets.sublayers = sheetOf(rules, "sublayers");

// A before B when A's leaves strictly contain B's.
const contains = (a, b) => {
  const A = new Set(truth[a] ?? [a]);
  const B = truth[b] ?? [b];
  return B.length < A.size && B.every((l) => A.has(l));
};
// The condition of an item as the sheet orders it: the widest min-width, then the ranks of its pseudo-classes.
const condKey = (i) => {
  let width = 0;
  const ranks = [];
  for (const c of i.w ?? [])
    if (MEDIA[c]) width = Math.max(width, MEDIA[c]);
    else ranks.push(PSEUDOS[c].rank);
  return i.w?.length ? [width, ...ranks] : [];
};
const cmpKey = (a, b) =>
  a.reduce((d, x, k) => d || (k < b.length ? x - b[k] : 0), 0) || a.length - b.length;
// The order of the items that the author means. A: by layer (number of conditions), then as written but containers first.
// B: the same, but items under different conditions in the order the sheet gives the conditions (breakpoints narrow to wide,
// then pseudo-classes by rank), and containers first only among items of one condition.
const intent = (list, byCond) => {
  const left = [...list];
  const out = [];
  while (left.length) {
    const layer = Math.min(...left.map((i) => i.w?.length ?? 0));
    const inLayer = left.filter((i) => (i.w?.length ?? 0) === layer);
    const first = byCond
      ? inLayer.reduce((m, i) => (cmpKey(condKey(i), m) < 0 ? condKey(i) : m), condKey(inLayer[0]))
      : null;
    const group = inLayer.filter((i) => !byCond || cmpKey(condKey(i), first) === 0);
    const next = group.find((i) => !group.some((o) => o !== i && contains(o.prop, i.prop)));
    out.push(left.splice(left.indexOf(next), 1)[0]);
  }
  return out;
};

const results = {};
for (const [name, css] of Object.entries(sheets)) {
  await page.setContent("<!doctype html><body></body>");
  await page.addStyleTag({ content: `${css}\n.pos{position:relative!important}` });
  for (const e of elements) {
    const longhands = [...new Set(e.list.flatMap((i) => truth[i.prop] ?? [i.prop]))].sort();
    await page.evaluate(
      ({ cls, decls, declsB }) => {
        for (const [className, style] of [
          [cls, ""],
          ["", decls],
          ["", declsB],
        ]) {
          const el = document.createElement("div");
          el.className = `pos ${className}`;
          el.setAttribute("style", style);
          el.tabIndex = 0;
          el.textContent = "x";
          document.body.append(el);
        }
      },
      {
        cls: e.cls,
        decls: intent(e.list, false)
          .map((i) => `${i.prop}:${i.v}`)
          .join(";"),
        declsB: intent(e.list, true)
          .map((i) => `${i.prop}:${i.v}`)
          .join(";"),
      },
    );
    const [el, ref, refB] = (await page.$$("body > div")).slice(-3);
    if (e.list.some((i) => i.w?.includes("hover"))) await el.hover();
    if (e.list.some((i) => i.w?.includes("focus"))) await el.focus();
    const read = (h) =>
      h.evaluate((node, ls) => {
        const cs = getComputedStyle(node);
        return Object.fromEntries(ls.map((l) => [l, cs.getPropertyValue(l)]));
      }, longhands);
    const got = await read(el);
    const verdict = (want) => {
      const diff = longhands.filter((l) => got[l] !== want[l]);
      return diff.length
        ? {
            diff: diff.slice(0, 4).map((l) => `${l}: got ${got[l]}, want ${want[l]}`),
            n: diff.length,
          }
        : "ok";
    };
    const wantA = await read(ref);
    const wantB = await read(refB);
    await page.mouse.move(0, 0);
    const res = (results[e.c.id] ??= { kind: e.c.kind, title: e.c.title, items: e.c.items });
    (res.run ??= {})[`${name}.${e.order}`] = verdict(wantA);
    (res.runB ??= {})[`${name}.${e.order}`] = verdict(wantB);
  }
}
await browser.close();

// the order of the case's rules in the engine sheet
for (const e of elements)
  if (e.order === "ab")
    results[e.c.id].engineOrder = engine.split("\n").flatMap((line) => {
      const cls = [...e.cls.split(" ")].find(
        (k) => line.includes(`.${k}{`) || line.includes(`.${k}:`),
      );
      const r = cls && rules.get(cls);
      return r ? [`${r.layer}${r.cond.length ? `[${r.cond}]` : ""} ${r.prop}`] : [];
    });

const lines = [];
let bad = 0;
const VARIANTS = ["engine", "min", "mdn", "truth", "where", "sublayers"];
for (const [id, r] of Object.entries(results)) {
  const cell = (run, v) =>
    (run[`${v}.ab`] === "ok" ? "ab" : "--") + (run[`${v}.ba`] === "ok" ? "ba" : "--");
  const row = (run) => VARIANTS.map((v) => `${v}:${cell(run, v)}`.padEnd(14)).join("");
  lines.push(`${id.padEnd(4)}${r.kind.padEnd(8)}${row(r.run)}${r.title}`);
  if (JSON.stringify(r.runB) !== JSON.stringify(r.run))
    lines.push(`${"".padEnd(12)}${row(r.runB)}(by condition order)`);
  if (cell(r.run, "engine") !== cell(r.run, "mdn") || cell(r.run, "engine") !== cell(r.run, "min"))
    bad++;
}
console.log(lines.join("\n"));
console.log(
  `\nsheet independent of module order: ${sheetsAgree}; container shorthand: ${containerProperty}`,
);
if (bad)
  console.log(
    `WARNING: ${bad} cases where the rebuilt mdn comparator or the minified sheet disagrees with sheet.ts`,
  );
writeFileSync(
  join(here, "results.json"),
  `${JSON.stringify({ chrome, sheetsAgree, containerProperty, results }, null, 1)}\n`,
);
process.exit(0);
