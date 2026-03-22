/**
 * CSS Property Functions
 *
 * Each function generates an atomic CSS class at build time.
 * Use with oxc-macro for build-time evaluation.
 *
 * @example
 * ```ts
 * import { display, p, bg, color } from "cssints/css" with { type: "macro" };
 *
 * const cls = display("flex"); // → "_a1b2c3d4"
 * // CSS emitted: ._a1b2c3d4 { display: flex; }
 * ```
 */

function generateHash(content: string, length: number = 8): string {
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = ((hash << 5) - hash + char) | 0;
	}
	return Math.abs(hash).toString(36).substring(0, length);
}

/**
 * Create a CSS property function that generates atomic CSS.
 *
 * At build time (with oxc-macro), this returns a function that:
 * - Takes a CSS value
 * - Generates a hashed class name
 * - Emits the CSS as an asset
 * - Returns the class name
 */
function cssPropertyFn(property: string) {
	return (value: string) => {
		const content = `${property}:${value}`;
		const className = `_${generateHash(content)}`;
		const css = `.${className} { ${property}: ${value}; }`;
		return {
			value: className,
			assets: [{ type: "css", content: css }],
		};
	};
}

// Layout
export const display = cssPropertyFn("display");
export const position = cssPropertyFn("position");
export const flex = cssPropertyFn("display");
export const flexDirection = cssPropertyFn("flex-direction");
export const flexGrow = cssPropertyFn("flex-grow");
export const flexShrink = cssPropertyFn("flex-shrink");
export const items = cssPropertyFn("align-items");
export const justify = cssPropertyFn("justify-content");
export const gap = cssPropertyFn("gap");
export const flexWrap = cssPropertyFn("flex-wrap");
export const width = cssPropertyFn("width");
export const height = cssPropertyFn("height");
export const maxWidth = cssPropertyFn("max-width");
export const maxHeight = cssPropertyFn("max-height");
export const overflow = cssPropertyFn("overflow");

// Spacing
export const padding = cssPropertyFn("padding");
export const paddingTop = cssPropertyFn("padding-top");
export const paddingRight = cssPropertyFn("padding-right");
export const paddingBottom = cssPropertyFn("padding-bottom");
export const paddingLeft = cssPropertyFn("padding-left");
export const margin = cssPropertyFn("margin");
export const marginTop = cssPropertyFn("margin-top");
export const marginRight = cssPropertyFn("margin-right");
export const marginBottom = cssPropertyFn("margin-bottom");
export const marginLeft = cssPropertyFn("margin-left");

// Typography
export const fontSize = cssPropertyFn("font-size");
export const fontWeight = cssPropertyFn("font-weight");
export const fontFamily = cssPropertyFn("font-family");
export const lineHeight = cssPropertyFn("line-height");
export const letterSpacing = cssPropertyFn("letter-spacing");
export const textAlign = cssPropertyFn("text-align");
export const textDecoration = cssPropertyFn("text-decoration");
export const textTransform = cssPropertyFn("text-transform");
export const whiteSpace = cssPropertyFn("white-space");

// Visual
export const color = cssPropertyFn("color");
export const bg = cssPropertyFn("background-color");
export const background = cssPropertyFn("background");
export const border = cssPropertyFn("border");
export const borderColor = cssPropertyFn("border-color");
export const borderWidth = cssPropertyFn("border-width");
export const borderStyle = cssPropertyFn("border-style");
export const borderRadius = cssPropertyFn("border-radius");
export const boxShadow = cssPropertyFn("box-shadow");
export const opacity = cssPropertyFn("opacity");

// Effects
export const transition = cssPropertyFn("transition");
export const transform = cssPropertyFn("transform");
export const cursor = cssPropertyFn("cursor");
export const zIndex = cssPropertyFn("z-index");

// Shortcuts
export const p = cssPropertyFn("padding");
export const pt = cssPropertyFn("padding-top");
export const pr = cssPropertyFn("padding-right");
export const pb = cssPropertyFn("padding-bottom");
export const pl = cssPropertyFn("padding-left");
export const m = cssPropertyFn("margin");
export const mt = cssPropertyFn("margin-top");
export const mr = cssPropertyFn("margin-right");
export const mb = cssPropertyFn("margin-bottom");
export const ml = cssPropertyFn("margin-left");
