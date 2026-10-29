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
  test: {
    // a browser test has no app entry: the sheet a component's class belongs to arrives through `virtual:cssints.css`, and
    // vitest drops CSS imports unless it is told to process them
    css: true,
    // `src/components/ui/` is where a copy lands; `registry/` is where the items are authored
    // in this repository, next to the page that renders them.
    include: ["src/components/ui/**/*.browser.test.tsx", "src/registry/**/*.browser.test.tsx"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      viewport: { width: 1280, height: 1024 },
      instances: [{ browser: "chromium" }],
    },
  },
});
