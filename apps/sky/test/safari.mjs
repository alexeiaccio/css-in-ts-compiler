// apps/sky built with its default targets, read in Chrome (the reference), in the WebKit builds of Safari 17 and 18 and in the
// real Safari on this Mac (cssints-7gq2; not in `test`: needs the builds below, and Safari's remote automation). Per engine:
//   - the decisions: does the browser have style queries (then `data-cssints-poly` stays off, else the frame/surface runtime
//     must be on) and does it parse every probe literal of the derived tokens (then nothing is written on <html>, else the
//     derived-token runtime writes the colours)
//   - the settings page: the four accent steps, the label of the preview button and the page background (as painted: 8-bit
//     sRGB, within 3/255 of Chrome) at the hue slider's 0 and 90 in light, dim and dark; the frame radii of the preview button
//   - the post card (dev/posts, in the same build): frame() radii and padding, surface() lightnesses, the layout of the embeds,
//     the line clamp, all equal to Chrome's (lightness within 0.01)
//   - screenshots of the same elements, saved to $SHOTS (default node_modules/.safari-shots at the repo root) and compared with
//     Chrome's in Chrome's own canvas: the share of pixels that differ by more than 24/255 (reported, not asserted: fonts differ)
// WebKit builds come from the playwright-core of their own release (docs/research/plugins-proto/README.md "Old browsers"):
//   S=$PWD/node_modules/.old-browsers; export PLAYWRIGHT_SKIP_BROWSER_GC=1   # else each install deletes the others' browsers
//   for v in 1.36.2 1.40.1 1.45.3 1.46.1 1.49.1 1.53.2; do mkdir -p $S/pw-$v && (cd $S/pw-$v && npm init -y && npm i playwright-core@$v \
//     && PLAYWRIGHT_BROWSERS_PATH=$S/browsers node node_modules/playwright-core/cli.js install webkit); done
//   # 1.36.2 WebKit 17.0 (build 1869), 1.40.1 17.4 (1944), 1.45.3 17.4 (2035), 1.46.1 18.0 (2051), 1.49.1 18.2 (2104), 1.53.2 18.5 (2182)
//   node test/safari.mjs                       # every pw-<v> that has a WebKit, the WebKit of this repo's Playwright, Safari
//   ENGINES=1.36.2,1.53.2 SAFARI=0 node test/safari.mjs
// Known: WebKit 17.0 (build 1869) fails the post card's radii (cssints-z7lt, a first-paint bug of that build); 17.4 and later pass.
// The safaridriver client has not run against a real session yet (remote automation was off when it was written).
// Safari needs "Allow remote automation" (Safari > Settings > Advanced > Show features for web developers; then Developer menu),
// or once, as an administrator: sudo safaridriver --enable. Without it the Safari run is skipped with that message. Safari
// follows the system appearance and paints at the display's scale, so every Playwright engine is read in the system's scheme
// (macOS AppleInterfaceStyle; SCHEME=light|dark overrides) at SCALE (default 2, a Retina display).
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import { build, preview } from "vite";

const root = join(import.meta.dirname, "..");
process.chdir(root);
delete process.env.BROWSERSLIST;
const repo = join(root, "../..");
const scratch = join(repo, "node_modules/.old-browsers");
const shots = process.env.SHOTS ?? join(repo, "node_modules/.safari-shots");
mkdirSync(shots, { recursive: true });
const load = (file) => import(pathToFileURL(file).href);
const modules = join(repo, "node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
// this repo's Playwright first: its WebKit is in the default browsers path, the old ones in the scratch one
const current = await load(join(modules, pw, "node_modules/playwright-core/index.mjs"));
process.env.PLAYWRIGHT_BROWSERS_PATH = join(scratch, "browsers");

// ---------- the page: one function for every engine (Playwright evaluates it, WebDriver gets its source)
function inPage(op, arg) {
  const root = document.documentElement;
  const q = (sel) => document.querySelector(sel);
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const paint = (c) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#f0f";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data];
  };
  const light = (c) => {
    const [r, g, b, a] = paint(c);
    if (!a) return null;
    const [lr, lg, lb] = [r, g, b].map((v) =>
      v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4,
    );
    const [l, m, s] = [
      0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
      0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
      0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
    ].map(Math.cbrt);
    return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  };
  const ops = {
    state() {
      const style = document.createElement("style");
      style.textContent = "@container style(--q:1){.qi{--h:1}}";
      const box = document.createElement("div");
      box.style.setProperty("--q", "1");
      box.innerHTML = "<i class=qi></i>";
      document.head.append(style);
      document.body.append(box);
      const styleQueries = cs(box.firstChild, "--h") === "1";
      style.remove();
      box.remove();
      let probes = [];
      try {
        const raw = cs(root, "--_derived").trim();
        probes = JSON.parse(raw.slice(1, -1).replace(/\\(.)/g, "$1")).p;
      } catch {}
      return {
        ua: navigator.userAgent,
        styleQueries,
        poly: root.hasAttribute("data-cssints-poly"),
        probes: probes.length,
        parsesAll: probes.every((p) => CSS.supports("color", p)),
        wrote: root.style.cssText.includes("--color-"),
      };
    },
    ready(sel) {
      return !!q(sel);
    },
    postsReady() {
      return document.querySelectorAll("[data-sample]").length === 19;
    },
    // the CDN is offline here: every image is a flat tile (layout is measured, not pictures)
    flatten() {
      const tile =
        "data:image/svg+xml," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#8aa4c8"/></svg>',
        );
      for (const i of document.images) {
        i.removeAttribute("srcset");
        i.loading = "eager";
        i.src = tile;
      }
    },
    imagesDone() {
      return [...document.images].every((i) => i.complete);
    },
    pick({ mode, shift }) {
      q(`input[type=radio][value=${mode}]`).click();
      const el = q('input[aria-label="Accent hue"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(
        el,
        String(shift),
      );
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    settings() {
      const bgOf = (id) => paint(cs(q(`[data-testid=${id}]`), "background-color"));
      const label = q("[data-testid=button-label]");
      return {
        steps: ["accent", "hover", "strong", "soft"].map((n) => bgOf(`swatch-${n}`)),
        ink: paint(cs(label, "color")),
        page: paint(cs(root, "background-color")),
        radius: {
          outer: cs(label.parentElement, "border-top-left-radius"),
          inner: cs(label, "border-top-left-radius"),
        },
        padding: { outer: cs(label.parentElement, "padding-top"), inner: cs(label, "padding-top") },
      };
    },
    posts() {
      const sample = (name) => document.querySelector(`[data-sample=${name}]`);
      const q1 = sample("quoteImages").querySelector("article").firstElementChild;
      const quote = [...q1.querySelectorAll("._f")].find(
        (e) => cs(e, "border-top-width") === "1px" && e.querySelector("a"),
      );
      const inner = quote.querySelector("._f");
      const mediaBox = (name) =>
        sample(name).querySelector("article a[target=_blank] > img").closest("a").parentElement;
      const desc = sample("externalLong").querySelector("article a[href^=http] p");
      const lineHeight = parseFloat(cs(desc, "line-height"));
      return {
        width: Math.round(q1.getBoundingClientRect().width),
        clampLines: Math.round(desc.getBoundingClientRect().height / lineHeight),
        radius: {
          card: cs(q1, "border-radius"),
          cardMedia: cs(mediaBox("images2"), "border-radius"),
          quote: cs(quote, "border-radius"),
          quoteMedia: cs(inner, "border-radius"),
        },
        padding: { card: cs(q1, "padding-top"), quote: cs(quote, "padding-top") },
        lightness: {
          feed: light(cs(sample("quoteImages").parentElement, "background-color")),
          card: light(cs(q1, "background-color")),
          quote: light(cs(quote, "background-color")),
          external: light(
            cs(sample("external").querySelector("article a[href^=http]"), "background-color"),
          ),
        },
        // the largest image of each sample (an embed's box: width, height; the avatars are smaller)
        embeds: Object.fromEntries(
          [...document.querySelectorAll("[data-sample]")].map((e) => {
            const [r] = [...e.querySelectorAll("article img")]
              .map((i) => i.getBoundingClientRect())
              .sort((a, b) => b.width * b.height - a.width * a.height);
            return [e.dataset.sample, r ? `${Math.round(r.width)}x${Math.round(r.height)}` : ""];
          }),
        ),
        layout: {
          images3: cs(mediaBox("images3"), "grid-template-columns").split(" ").length,
          images4: cs(mediaBox("images4"), "grid-template-columns").split(" ").length,
          gallery: cs(mediaBox("gallery"), "grid-template-columns").split(" ").length,
        },
      };
    },
  };
  return ops[op](arg);
}

// the source of a call of inPage, for both kinds of engine
const invoke = (op, arg) => `(${inPage.toString()})(${op}, ${arg})`;

const SCHEME =
  process.env.SCHEME ??
  (spawnSync("defaults", ["read", "-g", "AppleInterfaceStyle"], {
    encoding: "utf8",
  }).stdout.trim() === "Dark"
    ? "dark"
    : "light");
const SCALE = Number(process.env.SCALE ?? 2);

// ---------- engines: { name, ua, eval(op, arg), goto(url), shot(selector) -> Buffer, close() }
const playwright = async (name, kind, ctxOptions = {}) => {
  const browser = await kind;
  const page = await (
    await browser.newContext({
      viewport: { width: 1000, height: 900 },
      colorScheme: SCHEME,
      deviceScaleFactor: SCALE,
      ...ctxOptions,
    })
  ).newPage();
  await page.route(/cdn\.bsky\.app|video\.bsky\.app/, (route) => route.abort());
  return {
    name: `${name} ${browser.version()}`,
    eval: (op, arg) => page.evaluate(invoke(JSON.stringify(op), JSON.stringify(arg ?? null))),
    goto: (url) => page.goto(url),
    // a clip of the page, not locator.screenshot(): its wait for a stable element timed out in one WebKit build
    shot: async (sel) =>
      page.screenshot({
        fullPage: true,
        clip: await page.locator(sel).evaluate((e) => {
          const r = e.getBoundingClientRect();
          return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
        }),
      }),
    close: () => browser.close(),
  };
};

// W3C WebDriver over HTTP, no dependency
const safari = async () => {
  const port = 4444 + Math.floor(Math.random() * 500);
  const driver = spawn("safaridriver", ["-p", String(port)], { stdio: "ignore" });
  const call = async (method, path, body) => {
    const r = await fetch(`http://localhost:${port}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const { value } = await r.json();
    if (value?.error) throw new Error(`${value.error}: ${value.message}`);
    return value;
  };
  try {
    let created;
    for (let i = 0; !created && i < 20; i++)
      try {
        created = await call("POST", "/session", {
          capabilities: { alwaysMatch: { browserName: "safari" } },
        });
      } catch (e) {
        if (e.cause?.code !== "ECONNREFUSED") throw e;
        await sleep(250);
      }
    const s = `/session/${created.sessionId}`;
    await call("POST", `${s}/window/rect`, { width: 1000, height: 1000 });
    return {
      name: `safari ${created.capabilities.browserVersion}`,
      eval: (op, arg) =>
        call("POST", `${s}/execute/sync`, {
          script: `return ${invoke("arguments[0]", "arguments[1]")}`,
          args: [op, arg ?? null],
        }),
      goto: (url) => call("POST", `${s}/url`, { url }),
      shot: async (sel) => {
        const el = await call("POST", `${s}/element`, { using: "css selector", value: sel });
        const id = Object.values(el)[0];
        return Buffer.from(await call("GET", `${s}/element/${String(id)}/screenshot`), "base64");
      },
      close: async () => {
        await call("DELETE", s).catch(() => {});
        driver.kill();
      },
    };
  } catch (e) {
    driver.kill();
    throw e;
  }
};

// ---------- the app: one build, default targets; the dev page is compiled in (the route is `import.meta.env.DEV` only)
const outDir = "node_modules/.sky-safari";
const config = {
  root,
  logLevel: "warn",
  define: { "import.meta.env.DEV": "true" },
  build: { outDir, emptyOutDir: true },
};
await build(config);
const server = await preview({ ...config, preview: { port: 0 } });
const base = server.resolvedUrls.local[0];

const until = async (engine, op, arg) => {
  for (let i = 0; i < 100; i++) {
    if (await engine.eval(op, arg)) return;
    await sleep(100);
  }
  throw new Error(`${engine.name}: ${op} never held`);
};

// every engine's reading, as plain data
const MODES = ["light", "dim", "dark"];
const SHIFTS = [0, 90];
const SHOTS = {
  settings: ["settings", "#root"],
  images3: ["dev/posts?w=600", "[data-sample=images3]"],
  external: ["dev/posts?w=600", "[data-sample=external]"],
  quoteImages: ["dev/posts?w=600", "[data-sample=quoteImages]"],
};
async function read(engine) {
  const out = { shots: {} };
  await engine.goto(`${base}settings`);
  await until(engine, "ready", 'input[aria-label="Accent hue"]');
  await sleep(300);
  out.state = await engine.eval("state");
  out.shots.settings = await engine.shot("#root");
  out.matrix = {};
  for (const mode of MODES)
    for (const shift of SHIFTS) {
      await engine.eval("pick", { mode, shift });
      await sleep(150);
      out.matrix[`${mode} ${shift}`] = await engine.eval("settings");
    }
  out.afterSettings = await engine.eval("state");
  await engine.goto(`${base}dev/posts?w=600`);
  await until(engine, "postsReady");
  await engine.eval("flatten");
  await until(engine, "imagesDone");
  await sleep(300);
  out.posts = await engine.eval("posts");
  for (const name of ["images3", "external", "quoteImages"])
    out.shots[name] = await engine.shot(SHOTS[name][1]);
  return out;
}

// what differs from the reference: colours within 3/255, lightness within 0.01, everything else equal
function differences(got, want, path = "") {
  if (Array.isArray(want) && typeof want[0] === "number")
    return want.some((v, i) => Math.abs(v - got?.[i]) > 3)
      ? [`${path}: ${String(got)} vs ${String(want)}`]
      : [];
  if (want && typeof want === "object")
    return Object.entries(want).flatMap(([k, v]) => differences(got?.[k], v, `${path}/${k}`));
  const same =
    typeof want === "number"
      ? Math.abs(got - want) <= (path.includes("lightness") ? 0.01 : 0)
      : got === want;
  return same ? [] : [`${path}: ${got} vs ${want}`];
}

// two PNGs compared in Chrome's canvas (the second drawn at the first's size): the share of pixels that differ by more
// than 24/255, and a mask of them
function compare(page, reference, other) {
  return page.evaluate(
    async ([a, b]) => {
      const bitmap = async (x) =>
        createImageBitmap(await (await fetch(`data:image/png;base64,${x}`)).blob());
      const [ra, rb] = [await bitmap(a), await bitmap(b)];
      const c = new OffscreenCanvas(ra.width, ra.height);
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(ra, 0, 0);
      const da = g.getImageData(0, 0, ra.width, ra.height);
      g.clearRect(0, 0, ra.width, ra.height);
      g.drawImage(rb, 0, 0, ra.width, ra.height);
      const db = g.getImageData(0, 0, ra.width, ra.height);
      let n = 0;
      const mask = g.createImageData(ra.width, ra.height);
      for (let i = 0; i < da.data.length; i += 4) {
        const d = Math.max(...[0, 1, 2].map((k) => Math.abs(da.data[i + k] - db.data[i + k])));
        mask.data.set(d > 24 ? [255, 0, 0, 255] : [255, 255, 255, 255], i);
        n += d > 24 ? 1 : 0;
      }
      g.putImageData(mask, 0, 0);
      const blob = await c.convertToBlob({ type: "image/png" });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (const v of bytes) s += String.fromCharCode(v);
      return {
        share: n / (da.data.length / 4),
        size: `${ra.width}x${ra.height} vs ${rb.width}x${rb.height}`,
        mask: btoa(s),
      };
    },
    [reference.toString("base64"), other.toString("base64")],
  );
}

// ---------- which engines
const only = process.env.ENGINES?.split(",");
/** @type {[string, () => Promise<any>][]} */
const engines = [];
const skipped = [];
engines.push([
  "chrome",
  () => playwright("chrome", current.chromium.launch({ channel: "chrome" })),
]);
for (const dir of readdirSync(scratch).filter((d) => d.startsWith("pw-") && d !== "pw-1.29.2")) {
  const v = dir.slice(3);
  if (only && !only.includes(v)) continue;
  const kind = (await load(join(scratch, dir, "node_modules/playwright-core/index.mjs"))).webkit;
  engines.push([`webkit (playwright-core ${v})`, () => playwright("webkit", kind.launch())]);
}
if (!only)
  engines.push([
    "webkit (this repo's playwright-core)",
    () => playwright("webkit", current.webkit.launch()),
  ]);
if (process.env.SAFARI !== "0") engines.push(["safari (safaridriver)", safari]);

// ---------- run
let reference;
let failed = 0;
const refPage = await (await current.chromium.launch({ channel: "chrome" })).newPage();
try {
  for (const [label, start] of engines) {
    let engine;
    try {
      engine = await start();
    } catch (e) {
      const why = String(e.message).split("\n")[0];
      skipped.push(`${label}: ${why}`);
      console.log(`SKIPPED ${label}: ${why}`);
      continue;
    }
    try {
      const r = await read(engine);
      const tag = `${engine.name} ${label}`.replace(/[^\w.]+/g, "_");
      for (const [name, png] of Object.entries(r.shots))
        writeFileSync(join(shots, `${tag}-${name}.png`), png);
      const bad = [];
      const { state, afterSettings } = r;
      // the decisions: the runtime is on exactly where the browser lacks style queries; derived tokens write where it lacks a probe
      if (state.poly === state.styleQueries)
        bad.push(
          `frame/surface runtime ${state.poly ? "on" : "off"} with style queries ${state.styleQueries}`,
        );
      if (afterSettings.wrote === afterSettings.parsesAll)
        bad.push(
          `derived runtime ${afterSettings.wrote ? "wrote" : "idle"} with every probe parsed ${afterSettings.parsesAll}`,
        );
      for (const k of [0, 1, 2, 3])
        if (!differences(r.matrix["light 0"].steps[k], r.matrix["light 90"].steps[k]).length)
          bad.push(`the slider moved step ${k} nothing`);
      if (!reference) reference = r;
      else {
        for (const k of Object.keys(r.matrix))
          bad.push(...differences(r.matrix[k], reference.matrix[k], k));
        bad.push(...differences(r.posts, reference.posts, "posts"));
      }
      const diffs = [];
      if (r !== reference)
        for (const [name, png] of Object.entries(r.shots)) {
          const d = await compare(refPage, reference.shots[name], png);
          writeFileSync(join(shots, `${tag}-${name}-diff.png`), Buffer.from(d.mask, "base64"));
          diffs.push(`${name} ${(d.share * 100).toFixed(1)}% (${d.size})`);
        }
      failed += bad.length;
      console.log(
        `${engine.name} [${label}]\n  ${state.ua}\n  style queries ${state.styleQueries}, frame/surface runtime ${state.poly ? "on" : "off"}; derived: ${state.probes} probes, parsed ${state.parsesAll}, runtime ${afterSettings.wrote ? "writing" : "idle"}\n  ${bad.length ? `FAIL\n    ${bad.join("\n    ")}` : r === reference ? "reference" : "settings (3 modes x 2 hues) and post card equal to Chrome"}${diffs.length ? `\n  screenshots differing from Chrome: ${diffs.join(", ")}` : ""}`,
      );
    } catch (e) {
      failed++;
      console.log(`FAIL ${engine.name}: ${e.stack}`);
    } finally {
      await engine.close();
    }
  }
} finally {
  await refPage.context().browser().close();
  await server.close();
}
console.log(skipped.length ? `skipped:\n  ${skipped.join("\n  ")}` : "skipped: none");
console.log(`screenshots: ${shots}`);
assert.equal(failed, 0, `${failed} failed`);
