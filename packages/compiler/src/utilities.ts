// Non-size-based utility functions

import type { CSSProperties } from "./types";

// Display
export const display = (value: string): CSSProperties => ({ display: value });
export const block = (): CSSProperties => ({ display: "block" });
export const inline = (): CSSProperties => ({ display: "inline" });
export const flex = (): CSSProperties => ({ display: "flex" });
export const inlineFlex = (): CSSProperties => ({ display: "inline-flex" });
export const grid = (): CSSProperties => ({ display: "grid" });
export const hidden = (): CSSProperties => ({ display: "none" });

// Flexbox
export const flexDirection = (value: "row" | "row-reverse" | "column" | "column-reverse"): CSSProperties => ({
	flexDirection: value,
});

export const flexWrap = (value: "nowrap" | "wrap" | "wrap-reverse"): CSSProperties => ({
	flexWrap: value,
});

export const alignItems = (value: "flex-start" | "flex-end" | "center" | "stretch" | "baseline"): CSSProperties => ({
	alignItems: value,
});

export const justifyContent = (
	value: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly",
): CSSProperties => ({
	justifyContent: value,
});

export const flexShrink = (value: number | "0" | "1"): CSSProperties => ({
	flexShrink: typeof value === "number" ? value : Number(value),
});

export const flexGrow = (value: number | "0" | "1"): CSSProperties => ({
	flexGrow: typeof value === "number" ? value : Number(value),
});

export const flex1 = (): CSSProperties => ({ flex: "1" });
export const flexAuto = (): CSSProperties => ({ flex: "auto" });
export const flexNone = (): CSSProperties => ({ flex: "none" });

// For setting the flex shorthand property directly
export const flexProperty = (value: string | number): CSSProperties => ({ flex: value });

// Grid
export const gridTemplateColumns = (value: string): CSSProperties => ({
	gridTemplateColumns: value,
});

export const gridTemplateRows = (value: string): CSSProperties => ({
	gridTemplateRows: value,
});

export const gridColumn = (value: string): CSSProperties => ({ gridColumn: value });
export const gridRow = (value: string): CSSProperties => ({ gridRow: value });

// Convenience functions for grid
export const gridCols = (value: number): CSSProperties => ({
	gridTemplateColumns: `repeat(${value}, minmax(0, 1fr))`,
});

export const gridRows = (value: number): CSSProperties => ({
	gridTemplateRows: `repeat(${value}, minmax(0, 1fr))`,
});

export const colSpan = (value: number): CSSProperties => ({
	gridColumn: `span ${value} / span ${value}`,
});

export const rowSpan = (value: number): CSSProperties => ({
	gridRow: `span ${value} / span ${value}`,
});

// Position
export const position = (value: "static" | "relative" | "absolute" | "fixed" | "sticky"): CSSProperties => ({
	position: value,
});

export const relative = (): CSSProperties => ({ position: "relative" });
export const absolute = (): CSSProperties => ({ position: "absolute" });
export const fixed = (): CSSProperties => ({ position: "fixed" });
export const sticky = (): CSSProperties => ({ position: "sticky" });

export const inset = (value: number | string): CSSProperties => ({
	top: typeof value === "number" ? `${value}px` : value,
	right: typeof value === "number" ? `${value}px` : value,
	bottom: typeof value === "number" ? `${value}px` : value,
	left: typeof value === "number" ? `${value}px` : value,
});

export const top = (value: number | string): CSSProperties => ({
	top: typeof value === "number" ? `${value}px` : value,
});

export const right = (value: number | string): CSSProperties => ({
	right: typeof value === "number" ? `${value}px` : value,
});

export const bottom = (value: number | string): CSSProperties => ({
	bottom: typeof value === "number" ? `${value}px` : value,
});

export const left = (value: number | string): CSSProperties => ({
	left: typeof value === "number" ? `${value}px` : value,
});

export const zIndex = (value: number): CSSProperties => ({ zIndex: value });

// Overflow
export const overflow = (value: "visible" | "hidden" | "scroll" | "auto"): CSSProperties => ({
	overflow: value,
});

export const overflowX = (value: "visible" | "hidden" | "scroll" | "auto"): CSSProperties => ({
	overflowX: value,
});

export const overflowY = (value: "visible" | "hidden" | "scroll" | "auto"): CSSProperties => ({
	overflowY: value,
});

export const overflowAuto = (): CSSProperties => ({ overflow: "auto" });
export const overflowHidden = (): CSSProperties => ({ overflow: "hidden" });
export const overflowVisible = (): CSSProperties => ({ overflow: "visible" });
export const overflowScroll = (): CSSProperties => ({ overflow: "scroll" });

// Text
export const fontSize = (value: number | string): CSSProperties => ({
	fontSize: typeof value === "number" ? `${value}px` : value,
});

export const fontWeight = (value: number | string): CSSProperties => ({ fontWeight: value });

export const textAlign = (value: "left" | "center" | "right" | "justify"): CSSProperties => ({
	textAlign: value,
});

export const textTransform = (value: "uppercase" | "lowercase" | "capitalize" | "none"): CSSProperties => ({
	textTransform: value,
});

export const textDecoration = (value: "none" | "underline" | "line-through"): CSSProperties => ({
	textDecoration: value,
});

export const lineHeight = (value: number | string): CSSProperties => ({
	lineHeight: typeof value === "number" ? value : value,
});

export const letterSpacing = (value: number | string): CSSProperties => ({
	letterSpacing: typeof value === "number" ? `${value}em` : value,
});

// Convenience functions for text
export const fontBold = (): CSSProperties => ({ fontWeight: "bold" });
export const fontSemibold = (): CSSProperties => ({ fontWeight: 600 });
export const fontMedium = (): CSSProperties => ({ fontWeight: 500 });
export const fontNormal = (): CSSProperties => ({ fontWeight: "normal" });
export const fontLight = (): CSSProperties => ({ fontWeight: 300 });

export const textLeft = (): CSSProperties => ({ textAlign: "left" });
export const textCenter = (): CSSProperties => ({ textAlign: "center" });
export const textRight = (): CSSProperties => ({ textAlign: "right" });
export const textJustify = (): CSSProperties => ({ textAlign: "justify" });

export const uppercase = (): CSSProperties => ({ textTransform: "uppercase" });
export const lowercase = (): CSSProperties => ({ textTransform: "lowercase" });
export const capitalize = (): CSSProperties => ({ textTransform: "capitalize" });

export const underline = (): CSSProperties => ({ textDecoration: "underline" });
export const noUnderline = (): CSSProperties => ({ textDecoration: "none" });
export const lineThrough = (): CSSProperties => ({ textDecoration: "line-through" });

export const leading = (value: number | string): CSSProperties => ({
	lineHeight: typeof value === "number" ? value : value,
});

export const tracking = (value: number | string): CSSProperties => ({
	letterSpacing: typeof value === "number" ? `${value}em` : value,
});

// Background
export const backgroundColor = (value: string): CSSProperties => ({ backgroundColor: value });
export const bg = (color: string): CSSProperties => ({ backgroundColor: color });

export const backgroundImage = (value: string): CSSProperties => ({ backgroundImage: value });

export const bgGradient = (direction: string, ...colors: string[]): CSSProperties => ({
	backgroundImage: `linear-gradient(${direction}, ${colors.join(", ")})`,
});

// Text color
export const color = (value: string): CSSProperties => ({ color });
export const textCol = (color: string): CSSProperties => ({ color });

// Border
export const borderStyle = (value: "solid" | "dashed" | "dotted" | "double"): CSSProperties => ({
	borderStyle: value,
});

export const borderColor = (value: string): CSSProperties => ({ borderColor: value });

export const borderWidth = (value: number | string): CSSProperties => ({
	borderWidth: typeof value === "number" ? `${value}px` : value,
});

export const borderRadius = (value: number | string): CSSProperties => ({
	borderRadius: typeof value === "number" ? `${value}px` : value,
});

// Convenience functions for border
export const border = (value?: number | string, color?: string): CSSProperties => {
	if (value === undefined && color === undefined) {
		return {
			borderStyle: "solid",
			borderColor: "currentColor",
			borderWidth: "1px",
		};
	}
	if (typeof value === "string") {
		return { border: value };
	}
	return {
		borderStyle: "solid",
		borderColor: color || "currentColor",
		borderWidth: `${value || 1}px`,
	};
};

export const borderT = (value?: number | string, color?: string): CSSProperties => {
	if (value === undefined && color === undefined) {
		return {
			borderTopStyle: "solid",
			borderTopColor: "currentColor",
			borderTopWidth: "1px",
		};
	}
	if (typeof value === "string") {
		return { borderTop: value };
	}
	return {
		borderTopStyle: "solid",
		borderTopColor: color || "currentColor",
		borderTopWidth: `${value || 1}px`,
	};
};

export const borderB = (value?: number | string, color?: string): CSSProperties => {
	if (value === undefined && color === undefined) {
		return {
			borderBottomStyle: "solid",
			borderBottomColor: "currentColor",
			borderBottomWidth: "1px",
		};
	}
	if (typeof value === "string") {
		return { borderBottom: value };
	}
	return {
		borderBottomStyle: "solid",
		borderBottomColor: color || "currentColor",
		borderBottomWidth: `${value || 1}px`,
	};
};

export const borderL = (value?: number | string, color?: string): CSSProperties => {
	if (value === undefined && color === undefined) {
		return {
			borderLeftStyle: "solid",
			borderLeftColor: "currentColor",
			borderLeftWidth: "1px",
		};
	}
	if (typeof value === "string") {
		return { borderLeft: value };
	}
	return {
		borderLeftStyle: "solid",
		borderLeftColor: color || "currentColor",
		borderLeftWidth: `${value || 1}px`,
	};
};

export const borderR = (value?: number | string, color?: string): CSSProperties => {
	if (value === undefined && color === undefined) {
		return {
			borderRightStyle: "solid",
			borderRightColor: "currentColor",
			borderRightWidth: "1px",
		};
	}
	if (typeof value === "string") {
		return { borderRight: value };
	}
	return {
		borderRightStyle: "solid",
		borderRightColor: color || "currentColor",
		borderRightWidth: `${value || 1}px`,
	};
};

// Shadow
export const boxShadow = (value: string): CSSProperties => ({ boxShadow: value });
export const shadow = (value: string): CSSProperties => ({ boxShadow: value });

export const shadowSm = (): CSSProperties => ({ boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" });
export const shadowMd = (): CSSProperties => ({
	boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
});
export const shadowLg = (): CSSProperties => ({
	boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
});
export const shadowXl = (): CSSProperties => ({
	boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
});
export const shadowNone = (): CSSProperties => ({ boxShadow: "none" });

// Opacity
export const opacity = (value: number): CSSProperties => ({ opacity: value });

// Cursor
export const cursor = (
	value: "pointer" | "default" | "move" | "not-allowed" | "text" | "wait" | "grab" | "grabbing",
): CSSProperties => ({
	cursor: value,
});

export const cursorPointer = (): CSSProperties => ({ cursor: "pointer" });
export const cursorDefault = (): CSSProperties => ({ cursor: "default" });
export const cursorMove = (): CSSProperties => ({ cursor: "move" });
export const cursorNot = (): CSSProperties => ({ cursor: "not-allowed" });

// Transition
export const transition = (
	props: string = "all",
	duration: number = 150,
	timing: string = "ease-in-out",
): CSSProperties => ({
	transition: `${props} ${duration}ms ${timing}`,
});

export const transitionProperty = (value: string): CSSProperties => ({ transitionProperty: value });
export const transitionDuration = (value: number | string): CSSProperties => ({
	transitionDuration: typeof value === "number" ? `${value}ms` : value,
});

export const transitionTimingFunction = (value: string): CSSProperties => ({
	transitionTimingFunction: value,
});

export const transitionDelay = (value: number | string): CSSProperties => ({
	transitionDelay: typeof value === "number" ? `${value}ms` : value,
});

// Transform
export const transform = (value: string): CSSProperties => ({ transform: value });
export const rotate = (value: number | string): CSSProperties => ({
	transform: `rotate(${typeof value === "number" ? `${value}deg` : value})`,
});
export const scale = (value: number | string): CSSProperties => ({ transform: `scale(${value})` });
export const translateX = (value: number | string): CSSProperties => ({
	transform: `translateX(${typeof value === "number" ? `${value}px` : value})`,
});
export const translateY = (value: number | string): CSSProperties => ({
	transform: `translateY(${typeof value === "number" ? `${value}px` : value})`,
});

// Width/Height
export const width = (value: number | string): CSSProperties => ({
	width: typeof value === "number" ? `${value}px` : value,
});

export const height = (value: number | string): CSSProperties => ({
	height: typeof value === "number" ? `${value}px` : value,
});

export const minWidth = (value: number | string): CSSProperties => ({
	minWidth: typeof value === "number" ? `${value}px` : value,
});

export const minHeight = (value: number | string): CSSProperties => ({
	minHeight: typeof value === "number" ? `${value}px` : value,
});

export const maxWidth = (value: number | string): CSSProperties => ({
	maxWidth: typeof value === "number" ? `${value}px` : value,
});

export const maxHeight = (value: number | string): CSSProperties => ({
	maxHeight: typeof value === "number" ? `${value}px` : value,
});

// Margin/Padding
export const margin = (value: number | string): CSSProperties => ({
	margin: typeof value === "number" ? `${value}px` : value,
});

export const marginTop = (value: number | string): CSSProperties => ({
	marginTop: typeof value === "number" ? `${value}px` : value,
});

export const marginRight = (value: number | string): CSSProperties => ({
	marginRight: typeof value === "number" ? `${value}px` : value,
});

export const marginBottom = (value: number | string): CSSProperties => ({
	marginBottom: typeof value === "number" ? `${value}px` : value,
});

export const marginLeft = (value: number | string): CSSProperties => ({
	marginLeft: typeof value === "number" ? `${value}px` : value,
});

export const padding = (value: number | string): CSSProperties => ({
	padding: typeof value === "number" ? `${value}px` : value,
});

export const paddingTop = (value: number | string): CSSProperties => ({
	paddingTop: typeof value === "number" ? `${value}px` : value,
});

export const paddingRight = (value: number | string): CSSProperties => ({
	paddingRight: typeof value === "number" ? `${value}px` : value,
});

export const paddingBottom = (value: number | string): CSSProperties => ({
	paddingBottom: typeof value === "number" ? `${value}px` : value,
});

export const paddingLeft = (value: number | string): CSSProperties => ({
	paddingLeft: typeof value === "number" ? `${value}px` : value,
});

// Gap
export const gap = (value: number | string): CSSProperties => ({
	gap: typeof value === "number" ? `${value}px` : value,
});

export const columnGap = (value: number | string): CSSProperties => ({
	columnGap: typeof value === "number" ? `${value}px` : value,
});

export const rowGap = (value: number | string): CSSProperties => ({
	rowGap: typeof value === "number" ? `${value}px` : value,
});

// Custom utility (for plugins)
export const custom = (props: CSSProperties): CSSProperties => props;

// Pseudo-states
export const hover = (props: CSSProperties): CSSProperties => ({ "&:hover": props });
export const focus = (props: CSSProperties): CSSProperties => ({ "&:focus": props });
export const active = (props: CSSProperties): CSSProperties => ({ "&:active": props });
export const disabled = (props: CSSProperties): CSSProperties => ({ "&:disabled": props });

// Pseudo-elements
export const before = (props: CSSProperties): CSSProperties => ({ "&::before": props });
export const after = (props: CSSProperties): CSSProperties => ({ "&::after": props });

// Group states (for parent-child relationships)
export const groupHover = (props: CSSProperties): CSSProperties => ({ ".group:hover &": props });
export const groupFocus = (props: CSSProperties): CSSProperties => ({ ".group:focus &": props });
