// One server build to dist/main.js, run with `bun dist/main.js`. The JSX goes through Solid's universal transform with
// @opentui/solid as the renderer, as @opentui/solid's own Bun preload does (scripts/solid-transform.js). solid-js is
// pointed at its client build, the one @opentui/solid imports (solid-js/dist/solid.js), so both share one runtime;
// the server conditions would pick dist/server.js otherwise. @opentui/core stays external: it loads its native
// library at run time.
// The build is an environment of its own, "tui", not "ssr": cssints evaluates style modules in the "ssr" environment
// and makes the JSX of every module there inert, which would leave no app to run.
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
  environments: {
    tui: {
      consumer: "server",
      resolve: { noExternal: true, external: ["@opentui/core"] },
      build: {
        outDir: "dist",
        target: "esnext",
        minify: false,
        rollupOptions: { input: "src/main.tsx", output: { entryFileNames: "main.js" } },
      },
    },
  },
  builder: {
    buildApp: async (builder) => {
      await builder.build(builder.environments.tui!);
    },
  },
});
