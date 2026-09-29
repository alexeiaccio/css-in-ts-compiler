/* oxlint-disable */
// Cost of the runtime fallback against @container style(), on nested trees (every element is frame + surface).
// Median of N fresh runs, ms. "runtime" = fallback CSS + engine; "runtime + w" = also a transition sentinel (.w)
// on every element, the worst case of watching CSS-driven changes (:hover, media, container queries).
import { BROWSER, FEATS, SITES, css, engine, launch } from "./lib.mjs";

const N = 9;
const sites = SITES.replace(
  /\}$/,
  ".t .r{--_p:3px}.t .u{--_d:.03}.r{--_r:16px;--_p:2px;--_b:1px}.u{--_d:.02}}",
);
const el = (cls, inner) => `<div class="${cls}">${inner}</div>`;
const tree = (d, w, cls) =>
  d === 0 ? "" : Array.from({ length: w }, () => el(cls, tree(d - 1, w, cls))).join("");
const chain = (d, cls) => (d === 0 ? "" : el(cls, chain(d - 1, cls)));
const cases = {
  "5 461 nested (fan-out 4, depth 6)": (c) =>
    `<div id=root class="${c} base">${tree(6, 4, c)}</div>`,
  "19 531 nested (fan-out 5, depth 6)": (c) =>
    `<div id=root class="${c} base">${tree(6, 5, c)}</div>`,
  "chain, depth 300": (c) => `<div id=root class="${c} base">${chain(300, c)}</div>`,
};
const median = (a) => a.sort((x, y) => x - y)[a.length >> 1];

const ops = {
  "class toggle on root (whole tree)": `document.getElementById("root").classList.toggle("t");`,
  "class toggle on a depth-3 node": `document.querySelector("#root > div > div > div").classList.toggle("t");`,
  "insert a 1 000-element subtree": `document.querySelector("#root > div > div").insertAdjacentHTML("beforeend", window.__sub);`,
};

// in the page: mutate, wait for the observer's microtask, read the deepest element, force layout
const measure = (page, op) =>
  page.evaluate(
    async ([op, n]) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        await new Promise((r) => setTimeout(r, 40));
        document.body.offsetHeight;
        const run = new Function(`return async () => { ${op} }`)();
        const t = performance.now();
        await run();
        const last = document.getElementById("root").querySelector("div:last-child");
        getComputedStyle(last).borderTopLeftRadius;
        getComputedStyle(last).backgroundColor;
        document.body.offsetHeight;
        out.push(performance.now() - t);
      }
      return out;
    },
    [op, N],
  );

const modes = {
  sq: ["sq", "f s r u", false],
  runtime: ["poly", "f s r u", true],
  "runtime + w": ["poly", "f s r u w", true],
};
const b = await launch();
console.log(BROWSER, b.version(), `| median of ${N} | ms`);
for (const [cname, html] of Object.entries(cases)) {
  const res = {};
  for (const [mname, [mode, cls, poly]] of Object.entries(modes)) {
    const doc = `@layer k,s;${css[mode].replace(/^@layer k,s;/, "").replace(/@layer s\{[\s\S]*$/, "")}${sites}`;
    const initial = [];
    let page;
    for (let i = 0; i < 5; i++) {
      page?.close();
      page = await b.newPage({ viewport: { width: 1000, height: 800 } });
      // one task: parse the tree, (runtime: run the engine), force style + layout, read the deepest element
      await page.setContent(
        `<style>${doc}</style><body><script>window.t0=performance.now()</script>${html(cls)}<script>
        ${poly ? `${engine}; window.__poly(${JSON.stringify(FEATS)}, true);` : ""}
        document.body.offsetHeight; getComputedStyle(document.getElementById("root").querySelector("div:last-child")).borderTopLeftRadius; window.t1=performance.now()</script></body>`,
      );
      initial.push(await page.evaluate(() => t1 - t0));
    }
    await page.evaluate(() => {
      window.__sub = Array.from(
        { length: 10 },
        () =>
          `<div class="__C">${Array.from({ length: 9 }, () => `<div class="__C"><div class="__C"></div></div>`).join("")}</div>`,
      ).join("");
    });
    await page.evaluate((c) => {
      window.__sub = window.__sub.replaceAll("__C", c);
    }, cls);
    res[mname] = { initial: median(initial) };
    for (const [oname, op] of Object.entries(ops))
      res[mname][oname] = median(await measure(page, op));
    res[mname].count = await page.evaluate(() => document.querySelectorAll("#root div").length + 1);
    await page.close();
  }
  console.log(`\n${cname}`);
  console.log("operation".padEnd(38), ...Object.keys(modes).map((m) => m.padStart(13)));
  for (const k of ["initial (parse+style+layout)", ...Object.keys(ops)]) {
    const key = k.startsWith("initial") ? "initial" : k;
    console.log(
      k.padEnd(38),
      ...Object.keys(modes).map((m) => res[m][key].toFixed(1).padStart(13)),
    );
  }
}
await b.close();
