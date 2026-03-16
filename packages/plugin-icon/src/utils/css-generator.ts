import { getIconCSS } from "@iconify/utils";
import { log } from "../config";
import type { RenderMethod } from "./color-detector";

export interface IconCacheEntry {
  svg: string;
  mode: RenderMethod;
}

export function generateIconCSS(entry: IconCacheEntry): string {
  const { svg, mode } = entry;

  log.debug(`Generating CSS for icon (mode: ${mode})`);

  const iconData = parseSVGToIconifyIcon(svg);

  return getIconCSS(iconData, {
    mode,
    iconSelector: ".icon",
    varName: "svg",
  });
}

function parseSVGToIconifyIcon(svg: string): any {
  const viewBoxMatch = svg.match(/viewBox="([^"]*)"/);
  const widthMatch = svg.match(/width="([^"]*)"/);
  const heightMatch = svg.match(/height="([^"]*)"/);
  const bodyMatch = svg.match(/<svg[^>]*>(.+?)<\/svg>/s);

  return {
    body: bodyMatch?.[1] || svg,
    width: parseInt(widthMatch?.[1]) || 24,
    height: parseInt(heightMatch?.[1]) || 24,
    viewBox: viewBoxMatch?.[1] || "0 0 24 24",
  };
}
