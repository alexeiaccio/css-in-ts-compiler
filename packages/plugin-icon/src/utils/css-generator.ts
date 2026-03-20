import { getIconCSS } from "@iconify/utils";

import type { RenderMethod } from "./color-detector.js";

export interface IconCacheEntry {
	svg: string;
	mode: RenderMethod;
}

export function generateIconCSS(entry: IconCacheEntry): string {
	const { svg, mode } = entry;
	const iconData = parseSVGToIconifyIcon(svg);

	return getIconCSS(iconData, {
		mode,
		iconSelector: ".icon",
		varName: "svg",
	});
}

function parseSVGToIconifyIcon(svg: string): { body: string; width: number; height: number } {
	const viewBoxMatch = svg.match(/viewBox="([^"]*)"/);
	const widthMatch = svg.match(/width="([^"]*)"/);
	const heightMatch = svg.match(/height="([^"]*)"/);
	const bodyMatch = svg.match(/<svg[^>]*>(.+?)<\/svg>/s);

	return {
		body: bodyMatch?.[1] ?? svg,
		width: parseInt(widthMatch?.[1] ?? "24", 10),
		height: parseInt(heightMatch?.[1] ?? "24", 10),
	};
}
