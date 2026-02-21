/**
 * Composable CSS Utilities
 *
 * Curated utilities for common CSS patterns.
 * Usage: css.flex(css.items("center"), css.justify("center"))
 */

import { createTyped, type Typed } from "./core";
import type { Length, Auto } from "./core";
import { scaleValue } from "./scale";

// ============================================================================
// Types
// ============================================================================

export type CSSProperties = Record<string, string | number>;

export type FlexUtil = CSSProperties;
export type GridUtil = CSSProperties;
export type PositionUtil = CSSProperties;
export type SizeUtil = CSSProperties;
export type TextUtil = CSSProperties;
export type OverflowUtil = CSSProperties;

// ============================================================================
// Flex Utilities
// ============================================================================

/**
 * Create a flex container with composable utilities.
 * 
 * @example
 * flex(items("center"), justify("center"))
 * // → { display: "flex", alignItems: "center", justifyContent: "center" }
 */
export const flex = createTyped<(...utils: FlexUtil[]) => CSSProperties, "FlexFn">(
	(...utils) => ({
		display: "flex",
		...Object.assign({}, ...utils),
	}),
);

/**
 * Set align-items.
 * 
 * @example
 * items("center")  // → { alignItems: "center" }
 */
export const items = createTyped<
	(v: "start" | "end" | "center" | "baseline" | "stretch") => FlexUtil,
	"ItemsFn"
>((v) => ({
	alignItems: v === "start" ? "flex-start" : v === "end" ? "flex-end" : v,
}));

/**
 * Set justify-content.
 * 
 * @example
 * justify("center")   // → { justifyContent: "center" }
 * justify("between")  // → { justifyContent: "space-between" }
 */
export const justify = createTyped<
	(v: "start" | "end" | "center" | "between" | "around" | "evenly") => FlexUtil,
	"JustifyFn"
>((v) => {
	const map: Record<string, string> = {
		start: "flex-start",
		end: "flex-end",
		center: "center",
		between: "space-between",
		around: "space-around",
		evenly: "space-evenly",
	};
	return { justifyContent: map[v] ?? v };
});

/**
 * Set flex-direction.
 * 
 * @example
 * direction("column")  // → { flexDirection: "column" }
 */
export const direction = createTyped<
	(v: "row" | "column" | "row-reverse" | "column-reverse") => FlexUtil,
	"DirectionFn"
>((v) => ({ flexDirection: v }));

/**
 * Set flex-wrap.
 * 
 * @example
 * wrap()         // → { flexWrap: "wrap" }
 * wrap("nowrap") // → { flexWrap: "nowrap" }
 */
export const wrap = createTyped<
	(v?: "wrap" | "nowrap" | "wrap-reverse") => FlexUtil,
	"WrapFn"
>((v = "wrap") => ({ flexWrap: v }));

/**
 * Set gap.
 * 
 * @example
 * gap(4)          // → { gap: "1rem" }
 * gap("1rem")     // → { gap: "1rem" }
 */
export const gap = createTyped<
	(v: Length | number | string) => FlexUtil,
	"GapFn"
>((v) => ({ gap: typeof v === "number" ? scaleValue(v) : v }));

/**
 * Set row-gap.
 */
export const rowGap = createTyped<
	(v: Length | number | string) => FlexUtil,
	"RowGapFn"
>((v) => ({ rowGap: typeof v === "number" ? scaleValue(v) : v }));

/**
 * Set column-gap.
 */
export const colGap = createTyped<
	(v: Length | number | string) => FlexUtil,
	"ColGapFn"
>((v) => ({ columnGap: typeof v === "number" ? scaleValue(v) : v }));

// ============================================================================
// Grid Utilities
// ============================================================================

/**
 * Create a grid container with composable utilities.
 * 
 * @example
 * grid(cols("1fr 1fr"), rows("auto"))
 * // → { display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto" }
 */
export const grid = createTyped<(...utils: GridUtil[]) => CSSProperties, "GridFn">(
	(...utils) => ({
		display: "grid",
		...Object.assign({}, ...utils),
	}),
);

/**
 * Set grid-template-columns.
 * 
 * @example
 * cols("1fr 1fr")  // → { gridTemplateColumns: "1fr 1fr" }
 * cols("repeat(3, 1fr)")  // → { gridTemplateColumns: "repeat(3, 1fr)" }
 */
export const cols = createTyped<(v: string) => GridUtil, "ColsFn">(
	(v) => ({ gridTemplateColumns: v }),
);

/**
 * Set grid-template-rows.
 */
export const rows = createTyped<(v: string) => GridUtil, "RowsFn">(
	(v) => ({ gridTemplateRows: v }),
);

/**
 * Set grid-template-areas.
 */
export const areas = createTyped<(v: string) => GridUtil, "AreasFn">(
	(v) => ({ gridTemplateAreas: v }),
);

// ============================================================================
// Positioning Utilities
// ============================================================================

/**
 * Create an absolutely positioned element.
 * 
 * @example
 * absolute(insetAll(0))  // → { position: "absolute", top: "0", ... }
 */
export const absolute = createTyped<(...utils: PositionUtil[]) => CSSProperties, "AbsoluteFn">(
	(...utils) => ({
		position: "absolute",
		...Object.assign({}, ...utils),
	}),
);

/**
 * Create a relatively positioned element.
 */
export const relative = createTyped<(...utils: PositionUtil[]) => CSSProperties, "RelativeFn">(
	(...utils) => ({
		position: "relative",
		...Object.assign({}, ...utils),
	}),
);

/**
 * Create a fixed positioned element.
 */
export const fixed = createTyped<(...utils: PositionUtil[]) => CSSProperties, "FixedFn">(
	(...utils) => ({
		position: "fixed",
		...Object.assign({}, ...utils),
	}),
);

/**
 * Create a sticky positioned element.
 */
export const sticky = createTyped<(...utils: PositionUtil[]) => CSSProperties, "StickyFn">(
	(...utils) => ({
		position: "sticky",
		...Object.assign({}, ...utils),
	}),
);

/**
 * Set all inset values at once (top, right, bottom, left).
 * 
 * @example
 * insetAll(0)          // → { top: "0", right: "0", bottom: "0", left: "0" }
 * insetAll(4)          // → { top: "1rem", right: "1rem", bottom: "1rem", left: "1rem" }
 * insetAll("auto")     // → { top: "auto", right: "auto", bottom: "auto", left: "auto" }
 */
export const insetAll = createTyped<
	(v: Length | number | "auto" | string) => PositionUtil,
	"InsetAllFn"
>((v) => {
	const value = typeof v === "number" ? scaleValue(v) : v;
	return { top: value, right: value, bottom: value, left: value };
});

/**
 * Set top.
 */
export const top = createTyped<
	(v: Length | number | "auto" | string) => PositionUtil,
	"TopFn"
>((v) => ({ top: typeof v === "number" ? scaleValue(v) : v }));

/**
 * Set right.
 */
export const right = createTyped<
	(v: Length | number | "auto" | string) => PositionUtil,
	"RightFn"
>((v) => ({ right: typeof v === "number" ? scaleValue(v) : v }));

/**
 * Set bottom.
 */
export const bottom = createTyped<
	(v: Length | number | "auto" | string) => PositionUtil,
	"BottomFn"
>((v) => ({ bottom: typeof v === "number" ? scaleValue(v) : v }));

/**
 * Set left.
 */
export const left = createTyped<
	(v: Length | number | "auto" | string) => PositionUtil,
	"LeftFn"
>((v) => ({ left: typeof v === "number" ? scaleValue(v) : v }));

// ============================================================================
// Sizing Utilities
// ============================================================================

/**
 * Set width.
 * 
 * @example
 * w(100)        // → { width: "25rem" }
 * w("100%")     // → { width: "100%" }
 * w("auto")     // → { width: "auto" }
 */
export const w = createTyped<
	(v: Length | number | "auto" | string) => SizeUtil,
	"WFn"
>((v) => ({ width: typeof v === "number" ? scaleValue(v) : v }));

/**
 * Set height.
 */
export const h = createTyped<
	(v: Length | number | "auto" | string) => SizeUtil,
	"HFn"
>((v) => ({ height: typeof v === "number" ? scaleValue(v) : v }));

/**
 * Set min-width.
 */
export const minW = createTyped<
	(v: Length | number | string) => SizeUtil,
	"MinWFn"
>((v) => ({ minWidth: typeof v === "number" ? scaleValue(v) : v }));

/**
 * Set min-height.
 */
export const minH = createTyped<
	(v: Length | number | string) => SizeUtil,
	"MinHFn"
>((v) => ({ minHeight: typeof v === "number" ? scaleValue(v) : v }));

/**
 * Set max-width.
 */
export const maxW = createTyped<
	(v: Length | number | string) => SizeUtil,
	"MaxWFn"
>((v) => ({ maxWidth: typeof v === "number" ? scaleValue(v) : v }));

/**
 * Set max-height.
 */
export const maxH = createTyped<
	(v: Length | number | string) => SizeUtil,
	"MaxHFn"
>((v) => ({ maxHeight: typeof v === "number" ? scaleValue(v) : v }));

// ============================================================================
// Text Utilities
// ============================================================================

/**
 * Set text-align.
 * 
 * @example
 * text("center")  // → { textAlign: "center" }
 */
export const text = createTyped<
	(v: "left" | "right" | "center" | "justify" | "start" | "end") => TextUtil,
	"TextFn"
>((v) => ({ textAlign: v }));

/**
 * Set font-family.
 */
export const font = createTyped<(v: string) => TextUtil, "FontFn">(
	(v) => ({ fontFamily: v }),
);

/**
 * Set font-weight.
 * 
 * @example
 * weight("bold")   // → { fontWeight: "bold" }
 * weight(700)      // → { fontWeight: "700" }
 */
export const weight = createTyped<(v: number | string) => TextUtil, "WeightFn">(
	(v) => ({ fontWeight: String(v) }),
);

/**
 * Set line-height.
 * 
 * @example
 * leading(1.5)      // → { lineHeight: "1.5" }
 * leading("2rem")   // → { lineHeight: "2rem" }
 */
export const leading = createTyped<
	(v: number | string) => TextUtil,
	"LeadingFn"
>((v) => ({ lineHeight: typeof v === "number" ? String(v) : v }));

/**
 * Set font-size.
 */
export const size = createTyped<
	(v: Length | number | string) => TextUtil,
	"SizeFn"
>((v) => ({ fontSize: typeof v === "number" ? scaleValue(v) : v }));

// ============================================================================
// Overflow Utilities
// ============================================================================

/**
 * Set overflow.
 * 
 * @example
 * overflow("hidden")  // → { overflow: "hidden" }
 */
export const overflow = createTyped<
	(v: "visible" | "hidden" | "clip" | "scroll" | "auto") => OverflowUtil,
	"OverflowFn"
>((v) => ({ overflow: v }));

/**
 * Set overflow-x.
 */
export const overflowX = createTyped<
	(v: "visible" | "hidden" | "clip" | "scroll" | "auto") => OverflowUtil,
	"OverflowXFn"
>((v) => ({ overflowX: v }));

/**
 * Set overflow-y.
 */
export const overflowY = createTyped<
	(v: "visible" | "hidden" | "clip" | "scroll" | "auto") => OverflowUtil,
	"OverflowYFn"
>((v) => ({ overflowY: v }));

/**
 * Shorthand for overflow: hidden.
 */
export const hidden = createTyped<() => OverflowUtil, "HiddenFn">(
	() => ({ overflow: "hidden" }),
);

/**
 * Shorthand for overflow: scroll.
 */
export const scroll = createTyped<() => OverflowUtil, "ScrollFn">(
	() => ({ overflow: "scroll" }),
);

// ============================================================================
// Display Utilities
// ============================================================================

/**
 * Set display.
 */
export const display = createTyped<
	(v: "block" | "inline" | "inline-block" | "flex" | "grid" | "none") => CSSProperties,
	"DisplayFn"
>((v) => ({ display: v }));

/**
 * Shorthand for display: block.
 */
export const block = createTyped<() => CSSProperties, "BlockFn">(
	() => ({ display: "block" }),
);

/**
 * Shorthand for display: inline.
 */
export const inline = createTyped<() => CSSProperties, "InlineFn">(
	() => ({ display: "inline" }),
);

/**
 * Shorthand for display: none.
 */
export const none = createTyped<() => CSSProperties, "NoneFn">(
	() => ({ display: "none" }),
);

// ============================================================================
// Margin & Padding Shorthands
// ============================================================================

/**
 * Set margin with scale support.
 * 
 * @example
 * m(4)           // → { margin: "1rem" }
 * m(1, 2)        // → { margin: "0.25rem 0.5rem" }
 * m(1, 2, 3, 4)  // → { margin: "0.25rem 0.5rem 0.75rem 1rem" }
 */
export const m = createTyped<
	(v1: number | string, v2?: number | string, v3?: number | string, v4?: number | string) => CSSProperties,
	"MFn"
>((v1, v2, v3, v4) => {
	const values = [v1, v2, v3, v4].filter((v) => v !== undefined);
	const scaled = values.map((v) => (typeof v === "number" ? scaleValue(v) : v));
	return { margin: scaled.join(" ") };
});

/**
 * Set padding with scale support.
 */
export const p = createTyped<
	(v1: number | string, v2?: number | string, v3?: number | string, v4?: number | string) => CSSProperties,
	"PFn"
>((v1, v2, v3, v4) => {
	const values = [v1, v2, v3, v4].filter((v) => v !== undefined);
	const scaled = values.map((v) => (typeof v === "number" ? scaleValue(v) : v));
	return { padding: scaled.join(" ") };
});

/**
 * Set margin-x (left and right).
 */
export const mx = createTyped<(v: number | string) => CSSProperties, "MxFn">(
	(v) => ({ marginLeft: typeof v === "number" ? scaleValue(v) : v, marginRight: typeof v === "number" ? scaleValue(v) : v }),
);

/**
 * Set margin-y (top and bottom).
 */
export const my = createTyped<(v: number | string) => CSSProperties, "MyFn">(
	(v) => ({ marginTop: typeof v === "number" ? scaleValue(v) : v, marginBottom: typeof v === "number" ? scaleValue(v) : v }),
);

/**
 * Set padding-x (left and right).
 */
export const padX = createTyped<(v: number | string) => CSSProperties, "PadXFn">(
	(v) => ({ paddingLeft: typeof v === "number" ? scaleValue(v) : v, paddingRight: typeof v === "number" ? scaleValue(v) : v }),
);

/**
 * Set padding-y (top and bottom).
 */
export const padY = createTyped<(v: number | string) => CSSProperties, "PadYFn">(
	(v) => ({ paddingTop: typeof v === "number" ? scaleValue(v) : v, paddingBottom: typeof v === "number" ? scaleValue(v) : v }),
);
