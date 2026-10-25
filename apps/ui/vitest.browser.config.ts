import solid from "@solidjs/vite-plugin";
import cssints, { targets } from "cssints/vite";
import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

// The copied conformance test runs in a real Chromium: the scenario walk needs a real
// DOM and Solid 2's reactivity, not a simulated one.
export default defineConfig({
  plugins: [cssints(), solid()],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  test: {
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
