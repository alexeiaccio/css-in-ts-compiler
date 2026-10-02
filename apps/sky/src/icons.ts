import { icons } from "@cssints/icons" with { type: "cssints" };

export const mdi = icons<typeof import("@iconify-json/mdi/icons.json")>({
  provider: "iconify-json",
  collection: "mdi",
});
