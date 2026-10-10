// One SSR build to dist/main.js, run with `bun dist/main.js`. The JSX goes through Solid's universal transform with
// @opentui/solid as the renderer, as @opentui/solid's own Bun preload does (scripts/solid-transform.js). solid-js is
// pointed at its client build, the one @opentui/solid imports (solid-js/dist/solid.js), so both share one runtime;
// the server conditions would pick dist/server.js otherwise. @cssints/tui has no dist in the repository: its source.
// @opentui/core stays external: it loads its native library at run time.
import { fileURLToPath } from "node:url";

import cssints from "cssints/vite";
import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";

const tui = (file: string) =>
  fileURLToPath(new URL(`../../packages/tui/src/${file}`, import.meta.url));

export default defineConfig({
  plugins: [cssints(), solid({ solid: { generate: "universal", moduleName: "@opentui/solid" } })],
  resolve: {
    alias: [
      { find: /^solid-js$/, replacement: "solid-js/dist/solid.js" },
      { find: /^solid-js\/store$/, replacement: "solid-js/store/dist/store.js" },
      { find: /^@cssints\/tui$/, replacement: tui("index.ts") },
      { find: /^@cssints\/tui\/opentui$/, replacement: tui("opentui.ts") },
      { find: /^@cssints\/tui\/system$/, replacement: tui("system.ts") },
    ],
  },
  ssr: { noExternal: true, external: ["@opentui/core"] },
  build: {
    ssr: "src/main.tsx",
    outDir: "dist",
    target: "esnext",
    minify: false,
    rollupOptions: { output: { entryFileNames: "main.js" } },
  },
});
