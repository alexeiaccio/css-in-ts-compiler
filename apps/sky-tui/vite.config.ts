// One SSR build to dist/main.js, run with `bun dist/main.js`. The JSX goes through Solid's universal transform with
// @opentui/solid as the renderer, as @opentui/solid's own Bun preload does (scripts/solid-transform.js). solid-js is
// pointed at its client build, the one @opentui/solid imports (solid-js/dist/solid.js), so both share one runtime;
// the server conditions would pick dist/server.js otherwise.
// @opentui/core stays external: it loads its native library at run time.
import cssints from "cssints/vite";
import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [cssints(), solid({ solid: { generate: "universal", moduleName: "@opentui/solid" } })],
  resolve: {
    alias: [
      { find: /^solid-js$/, replacement: "solid-js/dist/solid.js" },
      { find: /^solid-js\/store$/, replacement: "solid-js/store/dist/store.js" },
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
