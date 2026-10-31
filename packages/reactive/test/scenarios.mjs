// The model's traces on the page: specs/patterns/reactive.qnt (bean cssints-tm9j) replayed against
// fixtures/model.js in real browsers through playwright-core, beside the hand-written cases of
// test/browsers.mjs.
//
// The generated reference model is the oracle: every scenario in
// scenarios/patterns/reactive*.json runs on the page through @cssints/apg-specs's replay engine
// (the spec driver checks every invariant after every step, the DOM driver reads the page), and two
// seeded differential walks send the same random steps to both.
//
// One flush: after each step the page is read with no frame waited and again two frames later; a
// difference between the two is a late paint, and the model's observed state must match the first.
//
//   bun run build:packages && node test/scenarios.mjs        BROWSERS=chrome,firefox,webkit node test/scenarios.mjs
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import cssints from "cssints/vite";
import { build } from "vite";
import { decodeDefinition, makeReferenceModel } from "@quint-machine/core";
import {
  differentialWalk,
  parseScenarioFile,
  replayScenario,
  specDriver,
} from "@cssints/apg-specs/scenario";
import {
  REACTIVE_PARTS,
  reactiveBridge,
  reactiveProbe,
  reactiveSteps,
} from "@cssints/apg-specs/patterns/reactive.bridge";
import definitionJson from "@cssints/apg-specs/patterns/reactive.model.json" with { type: "json" };
import scenariosJson from "@cssints/apg-specs/scenarios/patterns/reactive.spec.json" with { type: "json" };
import ownersJson from "@cssints/apg-specs/scenarios/patterns/reactive.owners.spec.json" with { type: "json" };

const here = import.meta.dirname;
const model = makeReferenceModel(decodeDefinition(definitionJson));

// a production build would ask for dist/; the workspace packages resolve to src/ by their "development" condition
process.env.NODE_ENV = "development";
const out = await build({
  root: join(here, "fixtures"),
  configFile: false,
  logLevel: "silent",
  plugins: cssints(),
  build: {
    write: false,
    minify: false,
    cssMinify: "lightningcss",
    rollupOptions: { input: join(here, "fixtures/model.js") },
  },
});
const files = [out].flat().flatMap((o) => o.output);
const text = (ext) =>
  files
    .filter((f) => f.fileName.endsWith(ext))
    .map((f) => String(f.code ?? f.source))
    .join("\n");
const js = text(".js");
const css = text(".css");
// the runtime is the feature: it is in the bundle, and the conditions are in the sheet
assert.equal(js.split("data-reactive-").length > 1, true, "the runtime is in the bundle");
assert.match(css, /data-reactive-open/, css);

const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium, firefox, webkit } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const launchers = {
  chrome: () => chromium.launch({ channel: "chrome" }),
  firefox: () => firefox.launch(),
  webkit: () => webkit.launch(),
};

const serve = async (browser) => {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.route("http://app.test/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const [body, contentType] =
      path === "/app.js"
        ? [js, "text/javascript"]
        : path === "/app.css"
          ? [css, "text/css"]
          : [
              "<!doctype html><link rel=stylesheet href=/app.css><body><script type=module src=/app.js></script>",
              "text/html",
            ];
    return route.fulfill({ body, contentType });
  });
  await page.goto("http://app.test/");
  return { page, errors };
};

const frames = (page) =>
  page.evaluate(
    () =>
      // oxlint-disable-next-line promise/avoid-new -- a wait in the page
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
      ),
  );

// every part's attributes and computed display, as the bridge's observer reads them
const observe = (page) =>
  page.evaluate(
    (parts) => {
      const state = {};
      for (const id of parts) {
        const el = document.getElementById(id);
        const attrs = {};
        for (const name of el.getAttributeNames()) attrs[name] = el.getAttribute(name);
        state[id] = { attrs, display: getComputedStyle(el).display };
      }
      return state;
    },
    [...REACTIVE_PARTS],
  );

// a fresh page: the runtime initialised both owners on load
const reset = async (page) => {
  await page.reload();
  await page.locator("#outer[data-reactive-open]").waitFor({ state: "attached" });
  const owners = await page.evaluate(() =>
    ["outer", "inner"].map((id) => ({
      id,
      names: document
        .getElementById(id)
        .getAttributeNames()
        .filter((name) => name.startsWith("data-reactive-"))
        .sort(),
    })),
  );
  for (const owner of owners) {
    assert.deepEqual(
      owner.names,
      ["data-reactive-open", "data-reactive-tab"],
      `${owner.id}: exactly the declared data-reactive-<name> attributes`,
    );
  }
};

// the DOM side of the spec's steps; the observer reads the last observation, and every step proves
// that the flush is complete before a frame (no intermediate paint) and that nothing settles later
const domDriver = async (page) => {
  let seen = await observe(page);
  return {
    perform: async (step) => {
      switch (step.event) {
        case "click":
          // a hidden panel cannot be clicked by the pointer; dispatch the event it would get
          if (step.target === "inner-panel") {
            await page.locator("#inner-panel").dispatchEvent("click");
          } else {
            await page.locator(`#${step.target}`).click();
          }
          break;
        case "change":
          if (step.target === "outer-field") {
            await page.locator("#outer-field").selectOption(String(step.value));
          } else {
            await page.locator("#inner-check").setChecked(step.value === true);
          }
          break;
        case "key":
          await page.locator(`#${step.target}`).focus();
          await page.keyboard.press(step.key ?? "Enter");
          break;
        default:
          throw new Error(`unmodelled step ${JSON.stringify(step)}`);
      }
      const immediate = await observe(page);
      await frames(page);
      const settled = await observe(page);
      assert.deepEqual(
        settled,
        immediate,
        `${step.event} on ${step.target}: the page settled after a frame (one event is one flush)`,
      );
      seen = immediate;
    },
    observer: {
      focus: () => null,
      attr: (target, name) => {
        const part = seen[target];
        if (part === undefined) return null;
        return name === "display" ? part.display : (part.attrs[name] ?? null);
      },
      visible: () => [],
      events: () => [],
    },
  };
};

const scenarioFiles = [scenariosJson, ownersJson].map((json) => parseScenarioFile(json));

const run = async (page) => {
  let count = 0;
  for (const file of scenarioFiles) {
    for (const scenario of file.scenarios) {
      const result = await replayScenario(scenario, reactiveBridge, async () => {
        await reset(page);
        return domDriver(page);
      });
      assert.equal(result.status, "passed", `${scenario.id}: ${result.reason ?? ""}`);
      count += 1;
    }
  }
  for (const seed of [7, 23]) {
    await differentialWalk({
      alphabet: reactiveSteps,
      probe: reactiveProbe,
      makePair: async () => {
        await reset(page);
        return [specDriver(model, reactiveBridge, {}), await domDriver(page)];
      },
      runs: 2,
      steps: 12,
      seed,
    });
    count += 1;
  }
  return count;
};

let failed = 0;
for (const name of (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",")) {
  const browser = await launchers[name]();
  console.log(`${name} ${browser.version()}`);
  const { page, errors } = await serve(browser);
  try {
    const count = await run(page);
    if (errors.length) throw new Error(`console: ${errors.join("; ")}`);
    console.log(`  ok (${count} scenarios and walks)`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL\n    ${error.message}`);
  }
  await page.close();
  await browser.close();
}
console.log(failed ? `${failed} failed` : "scenarios: ok");
process.exit(failed ? 1 : 0);
