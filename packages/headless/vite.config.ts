import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

// Browser mode: real Chromium, real DOM, real Solid 2 reactivity. `vp pack` writes dist/ (see publishConfig in package.json).
export default defineConfig({
  plugins: [solid()],
  pack: [
    {
      entry: { index: "src/index.ts" },
      platform: "neutral",
      format: "esm",
      target: "es2022",
      fixedExtension: true,
      dts: true,
      clean: true,
    },
  ],
  test: {
    include: ["test/**/*.browser.test.tsx"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      viewport: { width: 1280, height: 1024 },
      instances: [{ browser: "chromium" }],
    },
  },
});
