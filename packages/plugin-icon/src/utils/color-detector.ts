import { parseColors, SVG } from "@iconify/tools";

export type RenderMethod = "mask" | "background";

export function detectRenderMethod(svgContent: string): RenderMethod {
  try {
    const parsed = new SVG(svgContent);
    const result = parseColors(parsed, {});

    const hasNonTransparentColor = result.colors.some((color) => {
      if (typeof color === "string") {
        return color !== "none" && color !== "transparent";
      }
      return true;
    });

    return hasNonTransparentColor ? "background" : "mask";
  } catch {
    return "mask";
  }
}