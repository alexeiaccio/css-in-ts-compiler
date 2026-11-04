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
    include: ["test/**/*.browser.test.tsx", "test/**/*.test.ts"],
    // The differential walks are bounded by `runs` x `steps`, not by wall time, and one walk of the treeview's seven
    // nodes costs seconds on a quiet machine: beside other suites (a dozen worktrees of this repo run theirs in
    // parallel) the vitest default of 15 s is the load average talking, not a hung primitive. A genuinely stuck walk
    // still fails, at 60 s rather than 15. Same reasoning as tools/ai-automation's 30 s and apg-specs' 300 s.
    testTimeout: 60_000,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      viewport: { width: 1280, height: 1024 },
      instances: [{ browser: "chromium" }],
    },
  },
});
