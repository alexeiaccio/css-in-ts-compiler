import { parseColors, SVG } from "@iconify/tools";
import { log } from "../config";

export type RenderMethod = "mask" | "background";

export function detectRenderMethod(svg: string): RenderMethod {
  try {
    const svg = new SVG(svg);
    const colors = parseColors(svg, {});

    const hasNonTransparentColor = colors.some(
      color => color !== "none" && color !== "transparent"
    );

    return hasNonTransparentColor ? "background" : "mask";
  } catch (e) {
    log.debug(`Failed to detect render mode, defaulting to mask: ${e}`);
    return "mask";
  }
}
