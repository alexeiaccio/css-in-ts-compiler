import solid from "@solidjs/vite-plugin";
import cssints, { targets } from "cssints/vite";
import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

// The conformance test a starter arrives with runs in a real Chromium: the scenario walk needs a
// real DOM and Solid 2's reactivity, not a simulated one.
export default defineConfig({
  plugins: [cssints(), solid()],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  test: {
    include: ["src/components/ui/**/*.browser.test.tsx"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      viewport: { width: 1280, height: 1024 },
      instances: [{ browser: "chromium" }],
    },
  },
});
