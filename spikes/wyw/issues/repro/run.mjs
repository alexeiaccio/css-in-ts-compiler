// node run.mjs <file> [execute|hybrid]
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { transform, TransformCacheCollection } from "@wyw-in-js/transform";

const filename = resolve(process.argv[2]);
const strategy = process.argv[3] ?? "execute";

try {
  const { code } = await transform(
    {
      cache: new TransformCacheCollection(),
      options: {
        filename,
        root: import.meta.dirname,
        pluginOptions: {
          configFile: false,
          eval: { strategy },
          tagResolver: (source, tag) => (source === "./css.js" && tag === "css" ? resolve(import.meta.dirname, "processor.cjs") : null),
        },
      },
    },
    readFileSync(filename, "utf8"),
    async (what, importer) => resolve(importer, "..", what),
  );
  console.log(code);
} catch (error) {
  console.error(String(error));
} finally {
  process.exit(); // the eval broker keeps the event loop alive
}
