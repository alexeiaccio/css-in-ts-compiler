import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

import { transform, TransformCacheCollection } from "@wyw-in-js/transform";

const root = import.meta.dirname;
const entry = resolve(root, process.argv[2] ?? "fixtures/risk1.ts");

const resolver = async (what, importer) => {
  if (what.startsWith(".") || what.startsWith("/")) {
    const base = resolve(dirname(importer), what);
    return ["", ".ts", ".tsx", ".js", ".mjs"].map((e) => base + e).find(existsSync) ?? base;
  }
  try {
    return createRequire(importer).resolve(what);
  } catch {
    return null;
  }
};

try {
  const result = await transform(
    {
      cache: new TransformCacheCollection(),
      options: {
        filename: entry,
        root,
        pluginOptions: {
          configFile: false,
          prefixer: false,
          eval: { strategy: process.env.STRATEGY ?? "execute" },
        },
      },
    },
    readFileSync(entry, "utf8"),
    resolver,
  );
  console.log("--- code\n" + result.code);
  console.log("--- css\n" + (result.cssText || "(empty)"));
  console.log("--- dependencies\n" + JSON.stringify(result.dependencies ?? null));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  // ponytail: the eval broker child keeps the loop alive; exit instead of wiring disposeEvalBroker(scope).
  process.exit(process.exitCode ?? 0);
}
