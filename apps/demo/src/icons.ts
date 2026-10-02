import { icons } from "@cssints/icons" with { type: "cssints" };

// A build-time module: it reads @iconify-json/mdi from node_modules while the build runs. The type argument gives
// mdi("...") its names, so a typo is an error in the editor; in a build it fails with the nearest name.
export const mdi = icons<typeof import("@iconify-json/mdi/icons.json")>({
  provider: "iconify-json",
  collection: "mdi",
});
