import solid from "@solidjs/vite-plugin";
import cssints, { targets } from "cssints/vite";
import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

export default defineConfig({
  plugins: [
    cssints({ evaluation: { inline: ["solid-js", "@solidjs/web", "@solidjs/signals"] } }),
    solid(),
  ],
  css: { transformer: "lightningcss", lightningcss: { targets } },
  resolve: { dedupe: ["solid-js", "@solidjs/web", "@solidjs/signals"] },
  test: {
    include: ["test/**/*.browser.test.tsx"],
    css: true,
    setupFiles: ["test/setup.browser.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      viewport: { width: 1280, height: 1024 },
      instances: [{ browser: "chromium" }],
      connectTimeout: 120_000,
      env: { VITEST_BROWSER_IFRAME_TIMEOUT: "120000" },
    },
  },
});
