import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

export default defineConfig({
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
    include: ["test/**/*.browser.test.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      viewport: { width: 1280, height: 1024 },
      instances: [{ browser: "chromium" }],
    },
  },
});
