// The cost of value functions: colorMix(), min(), max(), clamp() as user code writes them (tokens and strings as
// arguments). Value members of a scope (the plugin author's side) are in plugins.ts. Checked next to users.ts by `bun run bench`.
import {
  backgroundColor,
  borderColor,
  clamp,
  color,
  colorMix,
  fontSize,
  height,
  marginInline,
  max,
  maxWidth,
  min,
  minHeight,
  opacity,
  padding,
  token,
  width,
} from "cssints";

const accent = token.color("#1d4ed8", "accent");
const muted = token.color("#6b7280");
const gap = token.length("16px", "gap");

export const calls = [
  color(colorMix("oklab", accent, "black 15%")),
  color(colorMix("oklab", accent, muted)),
  color(colorMix("srgb", "red", "blue")),
  color(colorMix("oklch longer hue", "red 30%", accent)),
  backgroundColor(colorMix("oklab", "white 20%", accent)),
  backgroundColor(colorMix("display-p3", accent, "transparent 50%")),
  borderColor(colorMix("oklab", muted, "white")),
  borderColor(colorMix("lab", "#fff", "#000 10%")),
  width(min("100%", "48rem")),
  width(min(gap, "50%")),
  maxWidth(max("20rem", "50vw")),
  maxWidth(max(gap, "10vw", "12rem")),
  height(clamp("10rem", "50vh", "30rem")),
  minHeight(clamp(gap, "10vh", "20rem")),
  fontSize(clamp("1rem", "2.5vw", "2rem")),
  fontSize(clamp(gap, "2vw", "1.5rem")),
  padding(clamp("1rem", "4vw", "3rem")),
  padding(min(gap, "2rem"), max("1rem", gap)),
  marginInline(clamp("0.5rem", gap, "2rem")),
  opacity(clamp<"number">(0, 0.5, 1)),
  opacity(min<"number">(1, 0.8)),
  maxWidth(min("100vw", "50rem")),
  fontSize(max("1rem", "14px")),
];
