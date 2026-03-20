/**
 * Virtual CSS module handling for development mode
 *
 * Manages generated CSS as virtual modules with HMR support
 */

import type { Plugin } from "vite";

const VIRTUAL_CSS_PREFIX = "virtual:cssints";
const VIRTUAL_CSS_ID = "\0" + VIRTUAL_CSS_PREFIX;

/** Store for generated CSS content */
const cssStore = new Map<string, string>();

/**
 * Get the virtual CSS module ID for a source file
 */
export function getVirtualCssId(sourceId: string): string {
	return `${VIRTUAL_CSS_ID}:${sourceId}`;
}

/**
 * Check if a module ID is a virtual CSS module
 */
export function isVirtualCssId(id: string): boolean {
	return id.startsWith(VIRTUAL_CSS_ID);
}

/**
 * Extract the source file ID from a virtual CSS module ID
 */
export function getSourceIdFromVirtual(id: string): string {
	return id.slice(VIRTUAL_CSS_ID.length + 1);
}

/**
 * Store CSS content for a source file
 */
export function storeCss(sourceId: string, css: string): void {
	cssStore.set(sourceId, css);
}

/**
 * Get CSS content for a source file
 */
export function getCss(sourceId: string): string | undefined {
	return cssStore.get(sourceId);
}

/**
 * Clear all stored CSS
 */
export function clearAllCss(): void {
	cssStore.clear();
}

/**
 * Get all stored CSS as a single string (for production)
 */
export function getAllCss(): string {
	return Array.from(cssStore.values()).join("\n\n");
}

/**
 * Create Vite plugin for virtual CSS module resolution
 */
export function createVirtualCssPlugin(): Plugin {
	return {
		name: "cssints-virtual-css",
		resolveId(id) {
			if (id.startsWith(VIRTUAL_CSS_PREFIX)) {
				return "\0" + id;
			}
			return null;
		},
		load(id) {
			if (isVirtualCssId(id)) {
				const sourceId = getSourceIdFromVirtual(id);
				const css = getCss(sourceId);
				if (css) {
					return css;
				}
			}
			return null;
		},
	};
}

/**
 * Inject CSS import into transformed code
 */
export function injectCssImport(code: string, sourceId: string): string {
	const virtualId = `${VIRTUAL_CSS_PREFIX}:${sourceId}`;
	const importStatement = `import "${virtualId}";\n`;
	return importStatement + code;
}
