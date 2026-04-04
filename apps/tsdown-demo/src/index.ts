/**
 * tsdown-macro Demo
 *
 * Demonstrates CSS-in-TS with tsdown-macro:
 * - CSS property functions (display, p, bg, color, etc.)
 * - Atomic CSS generation at build time
 * - CSS emitted as separate asset file
 */

import {
	display, flexDirection, gap, padding, fontSize, fontWeight,
	color, bg, borderRadius, border, margin, maxWidth, flexWrap,
} from "cssints" with { type: "macro" };

// Layout styles — each call generates a hashed class + CSS asset
const page = [display("flex"), flexDirection("column"), gap("1rem")];
const container = [maxWidth("800px"), margin("0 auto")];

// Typography
const h1 = [fontSize("2rem"), fontWeight("700"), color("#111827")];
const subtitle = [color("#6b7280"), fontSize("1.125rem")];

// Components
const card = [
	padding("1.5rem"), bg("white"), borderRadius("0.5rem"),
	border("1px solid #e5e7eb"),
];
const row = [display("flex"), gap("0.5rem"), flexWrap("wrap")];

// Export for use as a library
export const styles = {
	page,
	container,
	h1,
	subtitle,
	card,
	row,
};

// Export individual helpers for direct use
export { display, flexDirection, gap, padding, fontSize, fontWeight, color, bg, borderRadius, border, margin };
