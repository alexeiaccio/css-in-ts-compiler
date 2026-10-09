import { font } from "../../src/index.ts" with { type: "cssints" };

// fonts.mjs writes test/fixtures/out/dev.woff, then another font in its place (dev, cssints-04u8)
export const dev = font("Dev", { provider: "fs", files: ["test/fixtures/out/dev.woff"] });
