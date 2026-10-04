// Engine cost on sky (cssints-lfoi), not part of `bun run test`. Prints one table; every number is a median of RUNS runs,
// each in a fresh process.
//   node scripts/perf.mjs                 everything: build, dev, hmr, profile, types
//   node scripts/perf.mjs build|dev|profile|types         one part
//   RUNS=3 node scripts/perf.mjs          fewer runs
// Parts:
//   build    `vite build` wall (CLI, cold process); in process: the same build with the plugin's hooks timed (the union of
//            their intervals is the engine's wall time), and a replay build where the plugin only hands back what the first
//            build recorded (every transformed module, the sheet): what the build costs without the engine's work.
//   dev      server up, then every route's module graph requested in Chrome (playwright-core), HMR on a style and a component edit.
//   profile  every module with sites requested one at a time on a dev server under the inspector's CPU profiler: the time of
//            each cssints transform, its samples split by bucket (oxc walk, Module Runner eval, twin checks, support
//            warnings, LightningCSS lowering, sheet render, ...) and the hot functions.
//   types    tsgo and tsc 5.9 `--extendedDiagnostics` over sky, and tsgo's language server on a sky file (bench/lsp.mjs).
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { Session } from "node:inspector/promises";
import { cpus, totalmem } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { createServer, build, loadConfigFromFile } from "vite";

const root = join(import.meta.dirname, "..");
const repo = join(root, "../..");
const RUNS = Number(process.env.RUNS ?? 5);
const [cmd = "all", ...rest] = process.argv.slice(2);

const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] ?? 0;
const ms = (x) => `${Math.round(x)} ms`;
const here = (...args) => [import.meta.filename, ...args];

// ---------- in-process child: one build, hooks timed
const union = (iv) => {
  let total = 0;
  let end = -Infinity;
  for (const [a, b] of iv.sort((x, y) => x[0] - y[0])) {
    if (b > end) total += b - Math.max(a, end);
    end = Math.max(end, b);
  }
  return total;
};

if (cmd === "_build") {
  const mode = rest[0]; // timed | record | replay
  const cache = join(repo, "node_modules/.cache/sky-perf.json");
  process.chdir(root);
  const loaded = await loadConfigFromFile(
    { command: "build", mode: "production" },
    undefined,
    root,
  );
  const config = loaded.config;
  const plugins = (config.plugins ?? []).flat(Infinity).filter(Boolean);
  const spans = {};
  const rec = { code: {}, load: {} };
  const timed = (name, fn) =>
    async function (...a) {
      const t0 = performance.now();
      try {
        return await fn.apply(this, a);
      } finally {
        (spans[name] ??= []).push([t0, performance.now()]);
      }
    };
  const main = plugins.find((p) => p.name === "cssints");
  const out = plugins.map((p) => {
    if (p !== main) return p;
    if (mode === "replay") {
      const r = JSON.parse(readFileSync(cache, "utf8"));
      return {
        name: "replay",
        enforce: "pre",
        resolveId: main.resolveId,
        load: (id) => r.load[id],
        transform: { order: "pre", handler: (_, id) => r.code[id] },
      };
    }
    const q = { ...main, transform: { ...main.transform } };
    for (const h of ["buildStart", "buildEnd", "closeBundle", "renderChunk"])
      q[h] = timed(h, main[h]);
    q.transform.handler = timed("transform", async function (code, id) {
      const r = await main.transform.handler.call(this, code, id);
      if (r) rec.code[id] = typeof r === "string" ? r : r.code;
      return r;
    });
    q.load = function (id) {
      const r = main.load.call(this, id);
      if (r !== undefined && r !== null) rec.load[id] = r;
      return r;
    };
    return q;
  });
  const t0 = performance.now();
  const result = await build({
    ...config,
    root,
    configFile: false,
    logLevel: "silent",
    plugins: out,
    build: { ...config.build, write: false },
  });
  const wall = performance.now() - t0;
  const bytes = [result]
    .flat()
    .flatMap((o) => o.output.map((f) => `${f.fileName}:${(f.code ?? f.source).length}`));
  if (process.env.SHOW) console.error(bytes.join("\n"));
  if (mode === "record") {
    rec.load["\0virtual:cssints.css"] = main.api.sheet();
    mkdirSync(join(repo, "node_modules/.cache"), { recursive: true });
    writeFileSync(cache, JSON.stringify(rec));
  }
  console.log(
    JSON.stringify({
      wall,
      ...Object.fromEntries(Object.entries(spans).map(([k, v]) => [k, union(v)])),
    }),
  );
  process.exit(0);
}

// ---------- in-process child: dev server + Chrome
if (cmd === "_dev") {
  const fresh = rest[0] === "cold"; // cold: the optimizer's cache is gone as well
  if (fresh) rmSync(join(root, "node_modules/.vite"), { recursive: true, force: true });
  const modules = join(repo, "node_modules/.bun");
  const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
  const { chromium } = await import(
    pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
  );
  const fixture = (name) => readFileSync(join(root, `test/fixtures/${name}.json`), "utf8");
  const api = [
    [/getAuthorFeed/, "author-feed"],
    [/getProfile/, "profile"],
    [/getPostThread/, "thread"],
    [/getFeed|getTimeline/, "home-discover-1"],
  ];
  const t0 = performance.now();
  const server = await createServer({ root, logLevel: "error", server: { port: 0 } });
  await server.listen();
  const tServer = performance.now() - t0;
  const base = server.resolvedUrls.local[0];
  const client = server.environments.client;
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route(/cdn\.bsky\.app|video\.bsky\.app/, (r) => r.abort());
  await page.route(/public\.api\.bsky\.app\/xrpc\//, (r) => {
    const hit = api.find(([re]) => re.test(r.request().url()));
    return r.fulfill({
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: hit ? fixture(hit[1]) : "{}",
    });
  });
  const routes = [
    "",
    "profile/someone.test",
    "profile/someone.test/post/3focus",
    "settings",
    "dev/posts",
    "nowhere",
  ];
  const visit = [];
  for (const r of routes) {
    const t = performance.now();
    await page.goto(base + r, { waitUntil: "load" });
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Main"]'));
    // oxlint-disable-next-line playwright/no-networkidle -- the point: every module of the route has been asked for and served
    await page.waitForLoadState("networkidle");
    visit.push(performance.now() - t);
  }
  await page.goto(`${base}settings`);
  await page.locator("h1").waitFor();

  // HMR: the file is written, the page shows the change. `sent` is what the server told the browser meanwhile.
  const file = join(root, "src/Shell.tsx");
  const original = readFileSync(file, "utf8");
  const sent = [];
  const send = client.hot.send.bind(client.hot);
  let mark = 0;
  client.hot.send = (payload, ...a) => (
    payload.type === "update" &&
      sent.push([performance.now() - mark, payload.updates.map((u) => u.path)]),
    send(payload, ...a)
  );
  const hmr = async (from, to, probe) => {
    sent.length = 0;
    const [change, back] = [original.replace(from, to), original];
    if (change === original) throw new Error(`no ${from}`);
    const apply = async (text, want) => {
      mark = performance.now();
      writeFileSync(file, text);
      await page.waitForFunction(probe, want, { polling: "raf", timeout: 20000 });
      return performance.now() - mark;
    };
    const ms = await apply(change, true);
    const server = sent.map((s) => s[0]);
    await apply(back, false);
    return { ms, server: median(server) };
  };
  const style = [];
  const component = [];
  try {
    for (let i = 0; i < 4; i++) {
      style.push(
        await hmr(
          "css.fontWeight(t.fontWeight.medium),",
          "css.fontWeight(t.fontWeight.normal),",
          (on) =>
            [...document.querySelectorAll('nav[aria-label="Main"] a[aria-label]')].some(
              (a) => getComputedStyle(a).fontWeight === "400",
            ) === on,
        ),
      );
      component.push(
        await hmr(
          "{props.title}</h1>",
          "{props.title}!</h1>",
          (on) => document.querySelector("h1").textContent.endsWith("!") === on,
        ),
      );
    }
  } finally {
    writeFileSync(file, original);
  }
  await browser.close();
  await server.close();
  console.log(JSON.stringify({ tServer, visit, style, component }));
  process.exit(0);
}

// ---------- in-process child: dev server, every module with sites requested one at a time under the inspector's profiler
// The self time of every sample inside a cssints transform goes to a bucket: the nearest frame up the stack that a rule knows.
const BUCKETS = [
  "oxc walk (instrument, parse, inert JSX)",
  "Vite: fetch and ssr transform of imported modules",
  "Module Runner: loading and running module bodies",
  "twin / grammar checks",
  "support warnings",
  "LightningCSS lowering (lowered.ts)",
  "sheet render (sheet.ts)",
  "LightningCSS, other",
  "engine library (sites, tokens, themes)",
  "icons()",
  "idle (threads, I/O), GC, plugin glue, rest",
];
const B = Object.fromEntries(
  ["oxc", "vite", "run", "twin", "support", "lowered", "sheet", "css", "lib", "icons", "rest"].map(
    (k, i) => [k, i],
  ),
);
const bucketOf = (stack) => {
  for (const f of stack) {
    const u = f.url;
    if (f.fn === "(idle)" || f.fn === "(program)" || f.fn === "(garbage collector)") return B.rest;
    if (/lightningcss/.test(u))
      return stack.some((g) => /cssints\/src\/lowered\.ts/.test(g.url)) ? B.lowered : B.css;
    if (/cssints\/src\/lowered\.ts/.test(u)) return B.lowered;
    if (/cssints\/src\/sheet\.ts/.test(u)) return B.sheet;
    if (/css-grammar\/src\/(support|browsers)\.ts|browser-compat-data/.test(u)) return B.support;
    if (/css-grammar\/src\//.test(u)) return B.twin;
    if (
      /cssints\/src\/instrument\.ts|oxc-parser|oxc-transform/.test(u) ||
      f.fn === "transformWithOxc"
    )
      return B.oxc;
    if (/vite\/node\/chunks|rolldown\/shared/.test(u)) return B.vite;
    if (/module-runner|cssints\/src\/evaluate\.ts|^node:internal\/(modules|source_map)|^$/.test(u))
      return B.run;
    if (/packages\/icons\//.test(u)) return B.icons;
    if (/cssints\/src\/(?!plugin)/.test(u)) return B.lib;
  }
  return B.rest;
};

if (cmd === "_modules") {
  // effect is a dependency of cssints, not of sky: the instance that instrument() runs on.
  const { instrument } = await import("../../../packages/cssints/src/plugin.ts");
  const { Effect } = await import(
    pathToFileURL(createRequire(join(repo, "packages/cssints/package.json")).resolve("effect")).href
  );
  const loaded = await loadConfigFromFile(
    { command: "serve", mode: "development" },
    undefined,
    root,
  );
  const windows = [];
  const plugins = (loaded.config.plugins ?? [])
    .flat(Infinity)
    .filter(Boolean)
    .map((p) => {
      if (p.name !== "cssints") return p;
      const handler = p.transform.handler;
      return {
        ...p,
        transform: {
          ...p.transform,
          async handler(code, id) {
            const t0 = performance.now();
            const r = await handler.call(this, code, id);
            if (r && this.environment.name === "client")
              windows.push({ id, t0, t1: performance.now() });
            return r;
          },
        },
      };
    });
  const server = await createServer({
    ...loaded.config,
    configFile: false,
    root,
    logLevel: "silent",
    plugins,
    server: { port: 0, watch: null, hmr: false, preTransformRequests: false },
  });
  await server.listen();
  const files = readdirSync(join(root, "src"), { recursive: true })
    .filter((f) => /\.tsx?$/.test(f))
    .sort();
  const session = new Session();
  session.connect();
  await session.post("Profiler.enable");
  await session.post("Profiler.setSamplingInterval", { interval: 100 });
  const origin = performance.now();
  await session.post("Profiler.start");
  // a helper that only build-time code imports (icons.ts) is never asked for by the client: it fails here, and is skipped
  for (const f of files)
    await server.environments.client.transformRequest(`/src/${String(f)}`).catch(() => {});
  const { profile } = await session.post("Profiler.stop");
  const offset = profile.startTime / 1000 - origin;
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const parent = new Map(profile.nodes.flatMap((n) => (n.children ?? []).map((c) => [c, n.id])));
  const frame = (n) => ({
    fn: n.callFrame.functionName,
    url: n.callFrame.url.replace(/^file:\/\//, ""),
    line: n.callFrame.lineNumber + 1,
  });
  const mods = windows.map((w) => ({
    ...w,
    ms: w.t1 - w.t0,
    split: Array(BUCKETS.length).fill(0),
    self: new Map(),
  }));
  let at = profile.startTime / 1000;
  profile.samples.forEach((id, i) => {
    const dt = profile.timeDeltas[i] / 1000;
    at += dt;
    const t = at - offset;
    const m = mods.find((x) => t >= x.t0 && t <= x.t1);
    if (!m) return;
    const stack = [];
    for (let c = id; c !== undefined; c = parent.get(c)) stack.push(frame(byId.get(c)));
    const b = bucketOf(stack);
    m.split[b] += dt;
    const k = `${stack[0].fn || "(anon)"} ${stack[0].url.replace(/.*node_modules\//, "").replace(/.*\/(packages|apps)\//, "$1/")}:${stack[0].line}`;
    m.self.set(k, [(m.self.get(k)?.[0] ?? 0) + dt, b]);
  });
  const sites = (m) => {
    const file = join(root, m.id.slice(m.id.indexOf("/src/") + 1));
    try {
      return Effect.runSync(instrument(readFileSync(file, "utf8"), file))?.sites.length ?? 0;
    } catch {
      return 0;
    }
  };
  const self = new Map();
  for (const m of mods)
    for (const [k, [v, b]] of m.self) self.set(k, [(self.get(k)?.[0] ?? 0) + v, b]);
  console.log(
    JSON.stringify({
      modules: mods.map((m) => ({
        id: m.id.slice(m.id.indexOf("/src/") + 5),
        ms: m.ms,
        split: m.split,
        sites: sites(m),
        hot: [...m.self]
          .sort((a, b) => b[1][0] - a[1][0])
          .slice(0, 12)
          .map(([k, [v, b]]) => [k, Math.round(v), b]),
      })),
      hot: [...self]
        .sort((a, b) => b[1][0] - a[1][0])
        .slice(0, 14)
        .map(([k, [v, b]]) => [k, v, b]),
    }),
  );
  await server.close();
  process.exit(0);
}

const child = (...args) =>
  JSON.parse(execFileSync("node", here(...args), { cwd: root }).toString());
const wallOf = (argv, opts = {}) => {
  const t0 = performance.now();
  spawnSync(argv[0], argv.slice(1), { cwd: root, stdio: "ignore", ...opts });
  return performance.now() - t0;
};
const times = (n, f) => Array.from({ length: n }, f);
const col = (rows, k) => median(rows.map((r) => r[k] ?? 0));

const rows = [];
const row = (part, what, value, note = "") => rows.push([part, what, value, note]);
const extra = []; // blocks printed after the table

const buildPart = () => {
  const vp = join(repo, "node_modules/.bin/vp");
  const cli = median(times(RUNS, () => wallOf([vp, "build"])));
  child("_build", "record");
  const timed = times(RUNS, () => child("_build", "timed"));
  const replay = times(RUNS, () => child("_build", "replay"));
  const wall = col(timed, "wall");
  const base = col(replay, "wall");
  row("build", "vp build (CLI, cold process)", ms(cli));
  row("build", "build() in process, plugin on", ms(wall));
  row("build", "build() in process, plugin replays recorded output", ms(base));
  row(
    "build",
    "engine's share (on - replay)",
    ms(wall - base),
    `${Math.round(((wall - base) / wall) * 100)}%`,
  );
  for (const h of ["buildStart", "transform", "renderChunk", "buildEnd", "closeBundle"])
    row("build", `  hook ${h} (union of intervals)`, ms(col(timed, h)));
};

const devPart = () => {
  for (const mode of ["cold", "warm"]) {
    const runs = times(RUNS, () => child("_dev", mode));
    const first = col(runs, "tServer") + median(runs.map((r) => r.visit[0]));
    row("dev", `${mode} start: server up`, ms(col(runs, "tServer")));
    row(
      "dev",
      `${mode} start: first page (server up + / until the nav is up and the net idle)`,
      ms(first),
    );
    row(
      "dev",
      `${mode}: every route after the first (median of 5)`,
      ms(median(runs.flatMap((r) => r.visit.slice(1)))),
    );
    if (mode === "warm") {
      const m = (k, f) => median(runs.flatMap((r) => r[k].map(f)));
      row(
        "dev",
        "HMR style edit: write to DOM (first of a run)",
        ms(median(runs.map((r) => r.style[0].ms))),
      );
      row("dev", "HMR style edit: write to DOM (next)", ms(m("style", (x) => x.ms)));
      row("dev", "HMR style edit: write to update sent", ms(m("style", (x) => x.server)));
      row(
        "dev",
        "HMR component edit: write to DOM (first of a run)",
        ms(median(runs.map((r) => r.component[0].ms))),
      );
      row("dev", "HMR component edit: write to DOM (next)", ms(m("component", (x) => x.ms)));
      row("dev", "HMR component edit: write to update sent", ms(m("component", (x) => x.server)));
    }
  }
};

const profilePart = () => {
  const runs = times(RUNS, () => child("_modules"));
  // per module, the median over runs of its time and of each bucket
  const ids = runs[0].modules.map((m) => m.id);
  const mods = ids.map((id) => {
    const of = runs.flatMap((r) => r.modules.filter((m) => m.id === id));
    return {
      id,
      sites: of[0].sites,
      ms: median(of.map((m) => m.ms)),
      split: BUCKETS.map((_, b) => median(of.map((m) => m.split[b]))),
    };
  });
  const total = mods.reduce((a, m) => a + m.ms, 0);
  const first = mods.reduce((a, m) => (m.ms > a.ms ? m : a), mods[0]);
  const rest = mods.filter((m) => m !== first);
  row("modules", `${mods.length} modules with sites, sequential in dev: total`, ms(total));
  row("modules", `first (cold library: ${first.id})`, ms(first.ms));
  row("modules", "median of the rest", ms(median(rest.map((m) => m.ms))));
  row(
    "modules",
    "median of the rest, per site",
    `${median(rest.map((m) => m.ms / m.sites)).toFixed(1)} ms`,
  );
  BUCKETS.forEach((name, b) => {
    const v = mods.reduce((a, m) => a + m.split[b], 0);
    row("modules", `  ${name}`, ms(v), `${Math.round((v / total) * 100)}%`);
  });
  extra.push(
    "top 10 modules by transform time (median of runs):",
    ...[...mods]
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 10)
      .map((m) => {
        const [b] = m.split.map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]);
        return `  ${m.id.padEnd(24)} ${String(m.sites).padStart(3)} sites  ${ms(m.ms).padStart(7)}  mostly ${BUCKETS[b[1]].split(" (")[0]} ${Math.round(b[0])} ms`;
      }),
    "hot functions (self time summed over the modules, mean of runs):",
  );
  const hot = new Map();
  for (const r of runs)
    for (const [k, v, b] of r.hot) hot.set(k, [(hot.get(k)?.[0] ?? 0) + v / RUNS, b]);
  for (const [k, [v, b]] of [...hot]
    .sort((a, b) => b[1][0] - a[1][0])
    .filter(([k]) => !/^\(/.test(k))
    .slice(0, 10))
    extra.push(`  ${ms(v).padStart(7)}  ${k}  [${BUCKETS[b].split(" (")[0]}]`);
};

const typesPart = () => {
  const stat = (out, k) => Number(new RegExp(`^${k}:\\s+([\\d.]+)`, "m").exec(out)?.[1]);
  const diag = (bin, args) => {
    const out = spawnSync(
      bin,
      [...args, "-p", "tsconfig.json", "--noEmit", "--extendedDiagnostics"],
      { cwd: root, encoding: "utf8" },
    ).stdout;
    return {
      inst: stat(out, "Instantiations"),
      check: stat(out, "Check time") * 1000,
      total: stat(out, "Total time") * 1000,
      files: stat(out, "Files"),
    };
  };
  for (const [name, bin, args] of [
    ["tsgo", join(repo, "node_modules/.bin/tsgo"), []],
    ["tsc 5.9", "node", [join(repo, "node_modules/typescript/bin/tsc")]],
  ]) {
    const r = times(Math.min(RUNS, 3), () => diag(bin, args));
    row(
      "types",
      `${String(name)}: total / check`,
      `${ms(col(r, "total"))} / ${ms(col(r, "check"))}`,
      `${(r[0].inst / 1e6).toFixed(2)} M instantiations, ${r[0].files} files`,
    );
  }
  // tsc 5.9 trace: checkSourceFile per file
  const dir = mkdtempSync(join(repo, "node_modules/.cache/sky-trace-"));
  mkdirSync(dir, { recursive: true });
  spawnSync(
    "node",
    [
      join(repo, "node_modules/typescript/bin/tsc"),
      "-p",
      "tsconfig.json",
      "--noEmit",
      "--generateTrace",
      dir,
    ],
    { cwd: root },
  );
  const ev = JSON.parse(readFileSync(join(dir, "trace.json"), "utf8"));
  rmSync(dir, { recursive: true, force: true });
  const files = [];
  let open;
  for (const e of ev) {
    if (e.name !== "checkSourceFile") continue;
    if (e.ph === "B") open = e;
    else
      files.push([
        (e.ts - open.ts) / 1000,
        open.args.path.replace(/.*sky-perf\//, "").replace(/.*css-in-ts-compiler\//, ""),
      ]);
  }
  extra.push(
    "top 10 files by check time (tsc 5.9 trace; tsgo has no per-file trace):",
    ...files
      .sort((a, b) => b[0] - a[0])
      .slice(0, 10)
      .map(([t, f]) => `  ${ms(t).padStart(7)}  ${f}`),
  );
  const lsp = times(Math.min(RUNS, 3), () => {
    const out = execFileSync("node", [join(repo, "packages/cssints/bench/lsp.mjs")], {
      env: { ...process.env, APP: "sky" },
      encoding: "utf8",
    });
    const get = (re) => [...out.matchAll(re)].map((m) => Number(m[1]));
    return {
      first: get(/^first diagnostics (\d+)/gm),
      valid: get(/^valid edit\s+(\d+)/gm),
      invalid: get(/^invalid edit\s+(\d+)/gm),
      bad: get(/^bad 2nd part\s+(\d+)/gm),
    };
  });
  const m = (k) => median(lsp.flatMap((r) => r[k]));
  row(
    "types",
    "editor (tsgo LSP, src/Shell.tsx): first diagnostics, project load included",
    ms(m("first")),
  );
  row("types", "editor: diagnostics after a valid edit", ms(m("valid")));
  row("types", "editor: after an invalid edit", ms(m("invalid")));
  row("types", "editor: after an edit with a bad 2nd part", ms(m("bad")));
};

const run = { build: buildPart, dev: devPart, profile: profilePart, types: typesPart };
const parts = cmd === "all" ? Object.keys(run) : cmd === "lsp" ? ["types"] : [cmd];
for (const p of parts) await run[p]();

const w = [0, 1, 2].map((i) => Math.max(...rows.map((r) => r[i].length)));
console.log(
  `\nsky perf: ${cpus()[0].model}, ${cpus().length} cores, ${Math.round(totalmem() / 2 ** 30)} GB, node ${process.version}, median of ${RUNS}`,
);
for (const r of rows)
  console.log(`${r[0].padEnd(w[0])}  ${r[1].padEnd(w[1])}  ${r[2].padStart(w[2])}  ${r[3]}`);
for (const l of extra) console.log(l);
