import { masonry } from "../../src/index.ts" with { type: "cssints" };

// a build resolves @cssints/masonry to dist/, which is not built in the repo: the source, as a relative import
export const wall = masonry().columns("12rem").gap(4);
