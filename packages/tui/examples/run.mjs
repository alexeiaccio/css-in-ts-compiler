// Builds examples/bomb.ts with the cssints plugin (an SSR build, as a terminal app is built) and runs it.
// Run: bun run example (node examples/run.mjs)
import cssints from "cssints/vite";
import { build } from "vite";

process.env.NODE_ENV = "development"; // the plugin resolves cssints/tui from src (dist/ is built on master)
await build({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "warn",
  plugins: cssints(),
  build: {
    ssr: "bomb.ts",
    outDir: "out",
    emptyOutDir: true,
    minify: false,
    rolldownOptions: { external: [/^@bomb\.sh\//] },
  },
});
await import("./out/bomb.js");
