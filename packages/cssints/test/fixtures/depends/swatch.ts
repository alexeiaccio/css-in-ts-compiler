// A plain plugin function that reads a file at build time (depends-on.mjs).
import { readFileSync } from "node:fs";

import { color } from "cssints" with { type: "cssints" };
import { dependsOn } from "cssints/plugin";

export const swatch = (file: string) => {
  dependsOn(file);
  return color(readFileSync(file, "utf8").trim());
};
