import { font } from "../../src/index.ts" with { type: "cssints" };

export const body = font("Brand", { provider: "fs", files: ["test/fixtures/no-such.woff2"] });
