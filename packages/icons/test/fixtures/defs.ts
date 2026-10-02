import { icons } from "../../src/index.ts" with { type: "cssints" };

// Definition sites: build-time modules that hold what `icons()` configured.
export const mdi = icons({ provider: "iconify-json", collection: "mdi" });
export const brand = icons({ provider: "fs", dir: "test/fixtures/svg" });
