import solid from "@solidjs/vite-plugin";
import cssints, { targets } from "cssints/vite";
import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

// The conformance test a starter arrives with runs in a real Chromium: the scenario walk needs a
// real DOM and Solid 2's reactivity, not a simulated one.
export default defineConfig({
  // `evaluation.inline`: a browser-mode runner inlines everything as ESM, so the plugin's own
  // evaluation server keeps the framework's packages inlined (Solid resolves its client build by
  // them) and the rest external (Node loads their CJS). Without it, a click's target resolves
  // against a second copy of Solid and the walk reads a state the page never changed.
  plugins: [
    cssints({ evaluation: { inline: ["solid-js", "@solidjs/web", "@solidjs/signals"] } }),
    solid(),
  ],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  // The plugin adds `import derived from "cssints/derived"` to a client module after the dep
  // scanner has run; pre-bundling it here is what keeps that from reloading the page mid-test.
  optimizeDeps: { include: ["cssints/derived"] },
  test: {
    // a browser test has no app entry: the sheet of the modules the test imports arrives through
    // `virtual:cssints.css`, and vitest drops CSS imports unless it is told to process them
    css: true,
    // the sheet is loaded by the test's imports, not before them
    setupFiles: ["src/sheet.ts"],
    include: ["src/components/ui/**/*.browser.test.tsx"],
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
