import { clipPath } from "cssints/baseline-2020" with { type: "cssints" };
import { color as color2023 } from "cssints/baseline-2023" with { type: "cssints" };
import { color as color2024 } from "cssints/baseline-2024" with { type: "cssints" };
import { inlineSize } from "cssints/widely-available" with { type: "cssints" };
import { inlineSize as inlineSizeDown } from "cssints/widely-available/with-downstream" with { type: "cssints" };

export const a = [
  clipPath("border-box"),
  color2023("color-mix(in oklab, red, blue)"),
  color2024("light-dark(white, black)"),
  inlineSize("fit-content"),
  inlineSizeDown("10rem"),
];
