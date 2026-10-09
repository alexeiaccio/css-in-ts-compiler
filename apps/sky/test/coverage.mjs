// CSS coverage per route (playwright-core from node_modules/.bun, Chrome's rule usage through page.coverage; not in `test`: a
// measurement, not a check). The built app is served with the API stubbed by the recorded fixtures, as the other browser tests do,
// and each route is opened in its own page with coverage on: on load, then after what it reacts to (the widths across Mu's
// breakpoints and the 500 px container of the column, hover and keyboard focus on every link, button and tab, the tabs, paging, the
// thread's "Show more", the error states, a dark browser and reduced motion; on /settings every mode, the hue, the square shapes).
// /dev/posts (every embed kind, dev server only) is measured on the dev server, its rules matched to the build's by at-rules and
// selector. The dev server also gives the sheet's source map (class -> first css.* call), which names the unused rules' sources.
// Prints, per route and for the union: bytes and rules used / total, what only that route uses, and every rule no route uses.
//   node test/coverage.mjs        (JSON=<file> also writes the numbers)
/* oxlint-disable playwright/no-nth-methods -- first(): any card or tab of the kind will do, the styles are what is measured */
import assert from "node:assert/strict";
import { once } from "node:events";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer as createNetServer } from "node:net";
import { join, relative } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import { build, createServer, preview } from "vite";

const root = join(import.meta.dirname, "..");
process.chdir(root);
const modules = join(root, "../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const fixture = (name) => readFileSync(join(root, `test/fixtures/${name}.json`), "utf8");
const discover1 = JSON.parse(fixture("home-discover-1"));

// ---- the sheet as rules -------------------------------------------------------------------------
// Every leaf rule of a sheet (a style rule, @font-face, @property, @keyframes) with its [start, end) and the at-rules around it.
// Selectors and at-rules are normalised so that the dev sheet (pretty) and the build's (minified) give the same keys.
const norm = (s) =>
  s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*([,>+~(){}:<=])\s*/g, "$1")
    .replace(/=(["'])([\w-]+)\1\]/g, "=$2]");
function skipString(text, i) {
  const q = text[i];
  for (i++; i < text.length && text[i] !== q; i++) if (text[i] === "\\") i++;
  return i + 1;
}
function rulesOf(text) {
  const out = [];
  const at = [];
  let start = -1;
  for (let i = 0; i < text.length;) {
    const c = text[i];
    if (c === "/" && text[i + 1] === "*") i = text.indexOf("*/", i + 2) + 2;
    else if (c === '"' || c === "'") i = skipString(text, i);
    else if (c === "}" || c === ";") {
      if (c === "}") at.pop();
      start = -1;
      i++;
    } else if (c === "{") {
      const prelude = text.slice(start, i);
      if (/^@(media|supports|container|layer|scope|starting-style)\b/.test(prelude)) {
        at.push(norm(prelude));
        start = -1;
        i++;
        continue;
      }
      let depth = 0;
      let j = i;
      for (; j < text.length; j++) {
        if (text[j] === '"' || text[j] === "'") j = skipString(text, j) - 1;
        else if (text[j] === "{") depth++;
        else if (text[j] === "}" && --depth === 0) break;
      }
      out.push({ start, end: j + 1, prelude: norm(prelude), at: [...at] });
      start = -1;
      i = j + 1;
    } else {
      if (start < 0 && !/\s/.test(c)) start = i;
      i++;
    }
  }
  // a key per rule: its at-rules and selector, with the occurrence when the same pair comes twice
  const seen = new Map();
  for (const r of out) {
    const k = [...r.at, r.prelude].join(" » ");
    seen.set(k, (seen.get(k) ?? 0) + 1);
    r.key = `${k} #${seen.get(k)}`;
  }
  return out;
}

// Rule usage straight from CDP (CSS.takeCoverageDelta), not page.coverage: Chrome reports an @layer block as one used range from
// its name to its closing brace when any rule inside it is used, and page.coverage merges the ranges, so every rule in a layer
// would count (cssints puts everything in layers: that is how cssints-0a3p read 79 % of the demo's sheet). Here a used entry
// counts for the leaf rule that contains it, and the layer's own entry for none. Chrome does not track @property, @font-face or
// @keyframes: they are counted apart. The cssints sheet is the one that starts with its layer order.
let tracker; // the page being measured: go() flushes it before each navigation, as the sheets of the old page go away
async function track(page) {
  const cdp = await page.context().newCDPSession(page);
  const texts = new Map(); // styleSheetId -> text
  const keys = new Set();
  cdp.on("CSS.styleSheetAdded", ({ header }) =>
    texts.set(
      header.styleSheetId,
      cdp.send("CSS.getStyleSheetText", { styleSheetId: header.styleSheetId }).then(
        (r) => r.text,
        () => "",
      ),
    ),
  );
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  await cdp.send("CSS.startRuleUsageTracking");
  const flush = async () => {
    const { coverage } = await cdp.send("CSS.takeCoverageDelta");
    for (const u of coverage.filter((x) => x.used)) {
      const fresh = await cdp.send("CSS.getStyleSheetText", { styleSheetId: u.styleSheetId }).then(
        (r) => r.text,
        () => undefined,
      );
      const text = fresh ?? (await texts.get(u.styleSheetId)) ?? "";
      if (!text.startsWith("@layer _.k")) continue;
      const leaf = rulesOfText(text).find((r) => r.start <= u.startOffset && u.endOffset <= r.end);
      if (leaf) keys.add(leaf.key);
    }
    return new Set(keys);
  };
  return { flush };
}
const parsed = new Map();
const rulesOfText = (text) => parsed.get(text) ?? parsed.set(text, rulesOf(text)).get(text);

// ---- the API, from the recorded fixtures ----------------------------------------------------------
const tile =
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#8aa4c8"/></svg>';
const threads = { "3focus": "thread-deep", gone: "thread-notfound", blocked: "thread-blocked" };
async function stub(page) {
  await page.route(/cdn\.bsky\.app|video\.bsky\.app/, (r) =>
    r.fulfill({ contentType: "image/svg+xml", body: tile }),
  );
  await page.route(/public\.api\.bsky\.app\/xrpc\//, async (route) => {
    const u = new URL(route.request().url());
    const method = u.pathname.replace("/xrpc/app.bsky.", "");
    const p = Object.fromEntries(u.searchParams);
    const headers = { "access-control-allow-origin": "*" };
    const send = (body, status = 200) =>
      route.fulfill({ status, contentType: "application/json", headers, body });
    switch (method) {
      case "feed.getFeed": {
        await sleep(p.cursor ? 0 : 400); // the skeletons stay on screen for a moment
        const feed = p.feed.split("/").pop();
        if (feed === "whats-hot" && !p.cursor) return send(fixture("home-discover-1"));
        if (feed === "whats-hot" && p.cursor === discover1.cursor)
          return send(fixture("home-discover-2"));
        if (feed === "for-science" && !p.cursor) return send(fixture("home-science-1"));
        return route.fulfill({ status: 414, headers, body: "URI Too Long" });
      }
      case "actor.getProfile":
        if (p.actor === "down.test") return route.abort("connectionrefused");
        return p.actor === "gone.test"
          ? send('{"error":"InvalidRequest","message":"Profile not found"}', 400)
          : send(fixture("profile-head"));
      case "feed.getAuthorFeed": {
        const name = { posts_with_replies: "replies", posts_with_media: "media" }[p.filter];
        const feed = JSON.parse(
          fixture(p.cursor ? "profile-replies" : `profile-${name ?? "posts"}`),
        );
        return send(JSON.stringify(p.cursor ? { ...feed, cursor: undefined } : feed));
      }
      case "feed.getPostThread": {
        const rkey = p.uri.split("/").pop();
        if (rkey === "error") return send('{"error":"InternalServerError","message":"x"}', 500);
        return send(fixture(threads[rkey] ?? "thread"));
      }
      default:
        return send(fixture("posts"));
    }
  });
}

// ---- what each route reacts to --------------------------------------------------------------------
const WIDTHS = [360, 499, 500, 799, 800, 1099, 1100, 1299, 1300, 1400]; // both sides of each breakpoint
const settle = () => sleep(150);
async function sweep(page) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await settle();
  }
  await page.setViewportSize({ width: 1280, height: 900 });
}
// hover and keyboard focus on what can be pointed at (the first 60 of them in view), and the first cards
async function point(page) {
  const targets = await page
    .locator("a:visible, button:visible, [role=tab]:visible, label:visible")
    .all();
  const cards = await page.locator("article").all();
  for (const el of [...targets.slice(0, 60), ...cards.slice(0, 5)])
    await el.hover({ timeout: 1000 }).catch(() => {}); // one that moved away meanwhile is skipped
  for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
  await page.mouse.move(0, 0);
}
async function schemes(page) {
  for (const media of [{ colorScheme: "dark" }, { reducedMotion: "reduce" }]) {
    await page.emulateMedia(media);
    await settle();
  }
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
}
const toBottom = (page) => page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
async function go(page, path, ready) {
  await tracker?.flush();
  await page.goto(base + path);
  await page.locator(ready).first().waitFor();
}

const routes = [
  {
    name: "home",
    path: "",
    ready: "[role=tabpanel] article",
    async act(page) {
      await toBottom(page);
      await page.waitForFunction(() => document.querySelectorAll("article").length > 30);
      await page.getByRole("tab", { name: "Science" }).click();
      await page.locator("[aria-label=Science] article").first().waitFor();
      await toBottom(page);
      await page.getByTestId("end").waitFor();
      await page.emulateMedia({ reducedMotion: "reduce" }); // the skeletons again, standing still
      await go(page, "", "[data-testid=skeleton]");
      await page.locator("[role=tabpanel] article").first().waitFor();
      await page.emulateMedia({ reducedMotion: "no-preference" });
    },
  },
  {
    name: "profile",
    path: "profile/bsky.app",
    ready: "[data-profile-avatar]",
    async act(page) {
      for (const tab of ["Replies", "Media", "Posts"]) {
        await page.getByRole("tab", { name: tab }).click();
        await settle();
      }
      await toBottom(page);
      await settle();
      for (const handle of ["gone.test", "down.test"]) {
        await go(page, `profile/${handle}`, "main");
        await settle();
      }
    },
  },
  {
    name: "thread",
    path: "profile/someone.test/post/3focus",
    ready: "[data-row]",
    async act(page) {
      const more = page.getByRole("button", { name: /^Show \d+ more repl/ });
      while (await more.count()) await more.first().click();
      for (const rkey of ["gone", "blocked", "error"]) {
        await go(page, `profile/someone.test/post/${rkey}`, "main");
        await page.waitForFunction(() => !document.querySelector("[data-testid=skeleton]"));
        await settle();
      }
    },
  },
  {
    name: "settings",
    path: "settings",
    ready: "[data-testid=swatch-accent]",
    async act(page) {
      for (const mode of ["light", "dim", "dark", "system"]) {
        await page.getByRole("radio", { name: mode }).check();
        await settle();
      }
      for (const shift of ["90", "-180", "0"]) await page.getByLabel("Accent hue").fill(shift);
      for (const box of await page.getByRole("checkbox").all()) {
        await box.check();
        await settle();
        await box.uncheck();
      }
    },
  },
  { name: "404", path: "nowhere", ready: "main" },
];

async function measure(page, route) {
  tracker = await track(page);
  await go(page, route.path, route.ready);
  await settle();
  const load = await tracker.flush();
  await sweep(page);
  await point(page);
  await schemes(page);
  await route.act?.(page);
  await sweep(page);
  await point(page);
  const all = await tracker.flush();
  tracker = undefined;
  return { load, all };
}

// ---- the build ------------------------------------------------------------------------------------
const outDir = "node_modules/.sky-coverage";
const config = { root, logLevel: "warn", build: { outDir, emptyOutDir: true } };
await build(config);
const asset = readdirSync(join(outDir, "assets")).find((f) => f.endsWith(".css"));
const sheet = readFileSync(join(outDir, "assets", asset), "utf8");
const all = rulesOf(sheet);
const tracked = (r) => !/^@(property|font-face|keyframes)/.test(r.prelude);
const rules = all.filter(tracked);
const untracked = all.filter((r) => !tracked(r));
const server = await preview({ ...config, preview: { port: 0 } });
let base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: "chrome" });

const used = {}; // route -> { load, all }: Set<rule> of the build's sheet
const report = {};
try {
  for (const route of routes) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: "light",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await stub(page);
    const keys = await measure(page, route);
    assert.deepEqual(errors, [], route.name);
    used[route.name] = {
      load: new Set(rules.filter((r) => keys.load.has(r.key))),
      all: new Set(rules.filter((r) => keys.all.has(r.key))),
    };
    assert.ok(used[route.name].load.size > 0, `${route.name}: rules of ${asset} used`);
    await context.close();
  }
  await server.close();

  // ---- /dev/posts and the source map, on the dev server ---------------------------------------------
  process.env.NODE_ENV = "development"; // build() set it to production, which drops the dev route
  // a port of its own for the HMR socket: the default one may be another dev server's
  const free = createNetServer().listen(0);
  await once(free, "listening");
  const hmr = { port: free.address().port };
  free.close();
  const dev = await createServer({ root, logLevel: "error", server: { port: 0, hmr } });
  await dev.listen();
  base = dev.resolvedUrls.local[0];
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(120_000); // the first load evaluates every module
  await stub(page);
  const ready = "[data-sample=quoteImages] article";
  const keys = await measure(page, {
    path: "dev/posts",
    ready,
    async act(p) {
      for (const w of [360, 600]) await go(p, `dev/posts?w=${w}`, ready);
    },
  });
  const devText = await page.evaluate(
    () => document.querySelector("style[data-vite-dev-id$='virtual:cssints.css']").textContent,
  );
  const devRules = rulesOf(devText).filter(tracked);
  const byKey = new Set(rules.map((r) => r.key));
  const unmatched = devRules.filter((r) => !byKey.has(r.key));
  used["dev/posts"] = { all: new Set(rules.filter((r) => keys.all.has(r.key))) };

  // the sheet's dev source map: each line that holds a class points at the css.* call that made it first
  const loaded = await dev.environments.client.pluginContainer.load("\0virtual:cssints.css");
  const site = sourcesOf(loaded.code, loaded.map);
  await dev.close();

  // ---- the report -----------------------------------------------------------------------------------
  const textOf = (set) => [...set].map((r) => sheet.slice(r.start, r.end)).join("");
  const size = (set) => ({ bytes: textOf(set).length, gzip: gzipSync(textOf(set)).length });
  const pct = (a, b) => `${((100 * a) / b).toFixed(1)} %`.padStart(7);
  const total = { bytes: sheet.length, gzip: gzipSync(sheet).length, rules: rules.length };
  const ruleBytes = size(new Set(rules)).bytes;
  const shipped = routes.map((r) => r.name);
  const union = new Set(shipped.flatMap((n) => [...used[n].all]));
  const every = new Set(rules.filter((r) => shipped.every((n) => used[n].all.has(r))));
  const unused = rules.filter((r) => !union.has(r));
  const devOnly = unused.filter((r) => used["dev/posts"].all.has(r));
  const dead = unused.filter((r) => !used["dev/posts"].all.has(r));

  const u = size(new Set(untracked));
  console.log(
    `${asset}: ${total.bytes} bytes (${total.gzip} gzip): ${rules.length} style rules in ${ruleBytes} bytes, ` +
      `${untracked.length} @property/@font-face/@keyframes in ${u.bytes} (not tracked by Chrome), the rest @layer/@media/@container/@supports wrappers`,
  );
  console.log(
    `dev sheet: ${devRules.length} style rules, ${devRules.length - unmatched.length} matched to the build's by at-rules and selector\n`,
  );
  const label = (r) => {
    const from = [...r.prelude.matchAll(/\.(_[\w-]+)/g)]
      .map((m) => site.get(m[1]))
      .findLast(Boolean);
    const at = r.at.filter((a) => !a.startsWith("@layer")).join(" ");
    return `${(at ? `${at} ` : "") + r.prelude.slice(0, 100)}${from ? `  <- ${from}` : ""}`;
  };
  console.log(`(% of the ${ruleBytes} bytes and ${rules.length} style rules)`);
  const cell = (set) => {
    const { bytes } = size(set);
    return `${String(bytes).padStart(6)} ${pct(bytes, ruleBytes)}  ${String(set.size).padStart(3)} ${pct(set.size, rules.length)}`;
  };
  console.log(
    "               on load                           after interactions                only here (classes)",
  );
  console.log(
    "route          bytes     %      rules    %       bytes     %      rules    %       rules bytes gzip",
  );
  const onlyOf = {};
  for (const name of [...shipped, "dev/posts"]) {
    const x = used[name];
    const others = new Set(shipped.filter((n) => n !== name).flatMap((n) => [...used[n].all]));
    // a rule of a component: the themes (:root.dark, .square-buttons) apply on every route once stored, so they stay shared
    const only = new Set([...x.all].filter((r) => !others.has(r) && /\._/.test(r.prelude)));
    onlyOf[name] = only;
    const o = size(only);
    console.log(
      `${name.padEnd(12)} ${x.load ? cell(x.load) : "(dev server)".padEnd(31)}    ${cell(x.all)}    ${String(only.size).padStart(5)} ${String(o.bytes).padStart(5)} ${String(only.size ? o.gzip : 0).padStart(4)}`,
    );
    report[name] = {
      load: x.load && { rules: x.load.size, ...size(x.load) },
      all: { rules: x.all.size, ...size(x.all) },
      only: { rules: only.size, ...o, list: [...only].map(label) },
    };
  }
  const un = size(union);
  console.log(`union        ${"".padEnd(31)}    ${cell(union)}`);
  console.log(
    `used by every route: ${every.size} rules, ${size(every).bytes} bytes (${size(every).gzip} gzip)`,
  );
  console.log(
    `unused by every route: ${unused.length} rules, ${size(new Set(unused)).bytes} bytes (${size(new Set(unused)).gzip} gzip); ` +
      `${devOnly.length} of them used on /dev/posts\n`,
  );
  // a sheet per route: the one sheet without the rules that only other routes use (an upper bound of what splitting saves)
  console.log("a sheet per route instead of the one: bytes, gzip, saved");
  for (const name of shipped) {
    const drop = shipped.filter((n) => n !== name).flatMap((n) => [...onlyOf[n]]);
    let text = sheet;
    for (const r of drop.toSorted((a, b) => b.start - a.start))
      text = text.slice(0, r.start) + text.slice(r.end);
    const z = gzipSync(text).length;
    const saved = `${total.bytes - text.length} (${pct(total.bytes - text.length, total.bytes).trim()}), ${total.gzip - z} gzip (${pct(total.gzip - z, total.gzip).trim()})`;
    console.log(`  ${name.padEnd(10)} ${text.length} ${z}   ${saved}`);
    report[name].split = { bytes: text.length, gzip: z };
  }
  console.log("");
  console.log("used on /dev/posts only (embeds and states the route fixtures lack):");
  for (const r of devOnly) console.log(`  ${label(r)}`);
  console.log("\nused nowhere, not even on /dev/posts:");
  for (const r of dead) console.log(`  ${label(r)}`);
  if (unmatched.length) {
    console.log("\ndev rules with no build twin (their use on /dev/posts is not counted):");
    for (const r of unmatched) console.log(`  ${label(r)}`);
  }
  Object.assign(report, {
    total,
    union: { rules: union.size, ...un },
    every: { rules: every.size, ...size(every) },
    devOnly: devOnly.map(label),
    dead: dead.map(label),
  });
  if (process.env.JSON) writeFileSync(process.env.JSON, JSON.stringify(report, null, 2));
  assert.ok(union.size < rules.length, "some rules are unused: the layers do not count as used");
  assert.ok(unmatched.length < devRules.length / 10, "the dev sheet matches the build's");
} finally {
  await browser.close();
}
process.exit(0);

// class -> "src/file.tsx:line" from a source map whose lines each map their first segment
function sourcesOf(code, map) {
  const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const vlq = (s) => {
    const out = [];
    let v = 0;
    let shift = 0;
    for (const ch of s) {
      const d = B64.indexOf(ch);
      v += (d & 31) << shift;
      if (d & 32) shift += 5;
      else {
        out.push(v & 1 ? -(v >> 1) : v >> 1);
        v = 0;
        shift = 0;
      }
    }
    return out;
  };
  const out = new Map();
  const lines = code.split("\n");
  let [src, line] = [0, 0];
  map.mappings.split(";").forEach((m, i) => {
    if (!m) return;
    const [, s, l] = vlq(m.split(",")[0]);
    src += s;
    line += l;
    const at = `${relative(root, map.sources[src])}:${line + 1}`;
    for (const [, c] of lines[i].matchAll(/\.(_[\w-]+)/g)) if (!out.has(c)) out.set(c, at);
  });
  return out;
}
