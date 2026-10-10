// Builds apps/sky-tui's styles.ts with the cssints plugin into a module of prop objects, in a process of its own
// (plugin/tui.ts runs it). The engine's registry is process-global, and cssints/tui's createTokens declares its tokens
// there as the web one does: sky-tui's `--color-bg` would clash with the site's in the docs' own build (cssints-ey13,
// "Engine gaps"). Run: node plugin/tui-styles.ts <outDir>
import { join } from "node:path";

import cssints from "cssints/vite";
import { build } from "vite";

const outDir = process.argv[2];
if (!outDir) throw new Error("usage: node plugin/tui-styles.ts <outDir>");
await build({
  root: join(import.meta.dirname, "../../sky-tui/src"),
  configFile: false,
  logLevel: "warn",
  plugins: cssints(),
  build: {
    ssr: "styles.ts",
    outDir,
    emptyOutDir: true,
    minify: false,
    rolldownOptions: { output: { entryFileNames: "styles.mjs" } },
  },
});
