import { readdirSync } from "node:fs";

import { defineConfig } from "vite-plus";

// the variants (scripts/variants.ts): one module per subpath `@cssints/reset/<id>`
const groups = Object.fromEntries(
  readdirSync("src/groups", { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".ts"))
    .map((f) => [`groups/${f.replace(/\.ts$/, "")}`, `src/groups/${f}`]),
);

// `vp pack` writes dist/, which `bun run pack:tgz` stages into a tarball (see publishConfig in package.json).
export default defineConfig({
  pack: [
    // The build-time side, run by Node; its declarations are the types of the "types" condition (generated from the code).
    {
      entry: { index: "src/index.ts", ...groups },
      platform: "node",
      format: "esm",
      target: "node22",
      fixedExtension: true,
      dts: true,
      clean: true,
    },
  ],
});
