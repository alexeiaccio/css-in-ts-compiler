import solid from "@solidjs/vite-plugin";
import cssints, { targets } from "cssints/vite";
import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

// The copied conformance test runs in a real Chromium: the scenario walk needs a real
// DOM and Solid 2's reactivity, not a simulated one.
export default defineConfig({
  // `evaluation.inline`: a browser-mode runner inlines everything as ESM, so the plugin's own evaluation server keeps the
  // framework's packages inlined (Solid resolves its client build by them) and the rest external (Node loads their CJS).
  plugins: [
    cssints({ evaluation: { inline: ["solid-js", "@solidjs/web", "@solidjs/signals"] } }),
    solid(),
  ],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  // One Solid for the test and for the packages it exercises. The registry resolves `@cssints/*` from source
  // (`development`), and a second copy of Solid gives that copy its own "inside an effect callback" state: the
  // dev-only assertions then never fire, so a package can violate a reactivity rule and the suite stays green.
  // The starter has one copy by construction (installed tarballs), which is why only its smoke caught it.
  resolve: { dedupe: ["solid-js", "@solidjs/web", "@solidjs/signals"] },
  test: {
    // The conformance walks are bounded by `runs` x `steps`, not by wall time, and the treeview's (seven nodes, 15 runs
    // of 25 steps) takes ~15 s on a CI runner beside a dozen other jobs, which is the default's own limit: the run then
    // fails on a test that was halfway through its last steps. A genuinely stuck walk still fails, at 60 s. Same
    // reasoning as packages/headless and packages/apg-specs.
    testTimeout: 60_000,
    // a browser test has no app entry: the sheet a component's class belongs to arrives through `virtual:cssints.css`, and
    // vitest drops CSS imports unless it is told to process them
    css: true,
    // the sheet of the modules a test imports: a test page has no app entry to bring it in, and
    // Solid's dev diagnostics become failures (see `diagnostics.ts`)
    setupFiles: ["src/registry/sheet.ts", "src/registry/diagnostics.ts"],
    // `src/components/ui/` is where a copy lands; `registry/` is where the items are authored
    // in this repository, next to the page that renders them.
    include: ["src/components/ui/**/*.browser.test.tsx", "src/registry/**/*.browser.test.tsx"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      viewport: { width: 1280, height: 1024 },
      instances: [{ browser: "chromium" }],
      // The default waits 60 s for a worker's iframe to come up, which a busy machine (or a CI runner with a dozen other
      // jobs) misses: the run then fails as `the iframe did not become ready` with no test having run. Nothing about a
      // test gets longer; this is the browser starting.
      connectTimeout: 120_000,
      // the iframe ready timeout is read from the config's own env, not from the process that started the run
      env: { VITEST_BROWSER_IFRAME_TIMEOUT: "120000" },
    },
  },
});
