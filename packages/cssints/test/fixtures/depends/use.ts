import { swatch } from "./swatch.ts" with { type: "cssints" };

// relative to the working directory, outside the server's root
export const box = swatch("out/swatch.txt");
