import { resolve } from "node:path";

import wyw from "@wyw-in-js/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    wyw({
      eval: { strategy: "execute" },
      tagResolver: (source, tag) => (source === "../css.js" && tag === "css" ? resolve(import.meta.dirname, "../processor.cjs") : null),
    }),
  ],
});
