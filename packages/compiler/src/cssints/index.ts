/**
 * cssints - Compile-time CSS-in-TS utilities
 *
 * Usage: import * as css from "cssints" with { type: "cssints" }
 *
 * Functions accept string | number:
 * - Numbers are scaled by theme scale (default: 0.25rem per unit)
 * - Strings are passed through as-is
 */

export type CSSValue = string | number;

export interface CSSProperties {
	[key: string]: CSSValue | CSSProperties | undefined;
}

export interface ScaleOptions {
	scale?: number;
}

const DEFAULT_SCALE = 0.25;

let currentScale = DEFAULT_SCALE;

export function setScale(scale: number): void {
	currentScale = scale;
}

export function getScale(): number {
	return currentScale;
}

function toRem(value: number | string): string {
	if (typeof value === "number") {
		return `${value * currentScale}rem`;
	}
	return value;
}

function toPixel(value: number | string): string {
	if (typeof value === "number") {
		return `${value * currentScale * 16}px`;
	}
	return value;
}

// =============================================================================
// Display & Layout
// =============================================================================

export function display(value: string | number): CSSProperties {
	return { display: toRem(value) as string };
}

export function flex(): CSSProperties {
	return { display: "flex" };
}

export function flexInline(): CSSProperties {
	return { display: "inline-flex" };
}

export function grid(): CSSProperties {
	return { display: "grid" };
}

export function gridInline(): CSSProperties {
	return { display: "inline-grid" };
}

export function block(): CSSProperties {
	return { display: "block" };
}

export function inline(): CSSProperties {
	return { display: "inline" };
}

export function inlineBlock(): CSSProperties {
	return { display: "inline-block" };
}

export function none(): CSSProperties {
	return { display: "none" };
}

export function contents(): CSSProperties {
	return { display: "contents" };
}

// =============================================================================
// Flexbox
// =============================================================================

export function flexDirection(value: string | number): CSSProperties {
	return { flexDirection: toRem(value) as string };
}

export function flexWrap(value: string | number): CSSProperties {
	return { flexWrap: toRem(value) as string };
}

export function flexFlow(value: string | number): CSSProperties {
	return { flexFlow: toRem(value) as string };
}

export function justifyContent(value: string | number): CSSProperties {
	return { justifyContent: toRem(value) as string };
}

export function justifyItems(value: string | number): CSSProperties {
	return { justifyItems: toRem(value) as string };
}

export function justifySelf(value: string | number): CSSProperties {
	return { justifySelf: toRem(value) as string };
}

export function alignContent(value: string | number): CSSProperties {
	return { alignContent: toRem(value) as string };
}

export function alignItems(value: string | number): CSSProperties {
	return { alignItems: toRem(value) as string };
}

export function alignSelf(value: string | number): CSSProperties {
	return { alignSelf: toRem(value) as string };
}

export function flexGrow(value: string | number): CSSProperties {
	return { flexGrow: toRem(value) as string };
}

export function flexShrink(value: string | number): CSSProperties {
	return { flexShrink: toRem(value) as string };
}

export function flexBasis(value: string | number): CSSProperties {
	return { flexBasis: toRem(value) as string };
}

export function order(value: string | number): CSSProperties {
	return { order: toRem(value) as string };
}

export function gap(value: string | number): CSSProperties {
	return { gap: toRem(value) as string };
}

export function columnGap(value: string | number): CSSProperties {
	return { columnGap: toRem(value) as string };
}

export function rowGap(value: string | number): CSSProperties {
	return { rowGap: toRem(value) as string };
}

// Shortcuts
export function col(value?: string | number): CSSProperties {
	const props: CSSProperties = { flexDirection: "column" };
	if (value) Object.assign(props, gap(value));
	return props;
}

export function row(value?: string | number): CSSProperties {
	const props: CSSProperties = { flexDirection: "row" };
	if (value) Object.assign(props, gap(value));
	return props;
}

export function wrap(value?: string | number): CSSProperties {
	const props: CSSProperties = { flexWrap: "wrap" };
	if (value) Object.assign(props, gap(value));
	return props;
}

export function noWrap(value?: string | number): CSSProperties {
	const props: CSSProperties = { flexWrap: "nowrap" };
	if (value) Object.assign(props, gap(value));
	return props;
}

export function flexCenter(value?: string | number): CSSProperties {
	const props: CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center" };
	if (value) Object.assign(props, gap(value));
	return props;
}

// =============================================================================
// Grid
// =============================================================================

export function gridTemplateColumns(value: string | number): CSSProperties {
	return { gridTemplateColumns: toRem(value) as string };
}

export function gridTemplateRows(value: string | number): CSSProperties {
	return { gridTemplateRows: toRem(value) as string };
}

export function gridTemplateAreas(value: string | number): CSSProperties {
	return { gridTemplateAreas: toRem(value) as string };
}

export function gridColumn(value: string | number): CSSProperties {
	return { gridColumn: toRem(value) as string };
}

export function gridRow(value: string | number): CSSProperties {
	return { gridRow: toRem(value) as string };
}

export function gridArea(value: string | number): CSSProperties {
	return { gridArea: toRem(value) as string };
}

export function justifyItemsStart(): CSSProperties {
	return { justifyItems: "start" };
}

export function justifyItemsEnd(): CSSProperties {
	return { justifyItems: "end" };
}

export function justifyItemsCenter(): CSSProperties {
	return { justifyItems: "center" };
}

export function justifyItemsStretch(): CSSProperties {
	return { justifyItems: "stretch" };
}

// =============================================================================
// Spacing - Padding
// =============================================================================

export function p(value: string | number): CSSProperties {
	return { padding: toRem(value) };
}

export function px(value: string | number): CSSProperties {
	return { paddingLeft: toRem(value), paddingRight: toRem(value) };
}

export function py(value: string | number): CSSProperties {
	return { paddingTop: toRem(value), paddingBottom: toRem(value) };
}

export function pt(value: string | number): CSSProperties {
	return { paddingTop: toRem(value) };
}

export function pr(value: string | number): CSSProperties {
	return { paddingRight: toRem(value) };
}

export function pb(value: string | number): CSSProperties {
	return { paddingBottom: toRem(value) };
}

export function pl(value: string | number): CSSProperties {
	return { paddingLeft: toRem(value) };
}

export function pX(value: string | number): CSSProperties {
	return { paddingInline: toRem(value) };
}

export function pY(value: string | number): CSSProperties {
	return { paddingBlock: toRem(value) };
}

export function ptStart(value: string | number): CSSProperties {
	return { paddingBlockStart: toRem(value) };
}

export function ptEnd(value: string | number): CSSProperties {
	return { paddingBlockEnd: toRem(value) };
}

// =============================================================================
// Spacing - Margin
// =============================================================================

export function m(value: string | number): CSSProperties {
	return { margin: toRem(value) };
}

export function mx(value: string | number): CSSProperties {
	return { marginLeft: toRem(value), marginRight: toRem(value) };
}

export function my(value: string | number): CSSProperties {
	return { marginTop: toRem(value), marginBottom: toRem(value) };
}

export function mt(value: string | number): CSSProperties {
	return { marginTop: toRem(value) };
}

export function mr(value: string | number): CSSProperties {
	return { marginRight: toRem(value) };
}

export function mb(value: string | number): CSSProperties {
	return { marginBottom: toRem(value) };
}

export function ml(value: string | number): CSSProperties {
	return { marginLeft: toRem(value) };
}

export function mX(value: string | number): CSSProperties {
	return { marginInline: toRem(value) };
}

export function mY(value: string | number): CSSProperties {
	return { marginBlock: toRem(value) };
}

// Negative margins
export function negMargin(value: string | number): CSSProperties {
	const val = typeof value === "number" ? -value : `-${value}`;
	return { margin: toRem(val as number) };
}

export function negMx(value: string | number): CSSProperties {
	const val = typeof value === "number" ? -value : `-${value}`;
	return { marginLeft: toRem(val as number), marginRight: toRem(val as number) };
}

export function negMy(value: string | number): CSSProperties {
	const val = typeof value === "number" ? -value : `-${value}`;
	return { marginTop: toRem(val as number), marginBottom: toRem(val as number) };
}

// =============================================================================
// Sizing
// =============================================================================

export function w(value: string | number): CSSProperties {
	return { width: toRem(value) };
}

export function h(value: string | number): CSSProperties {
	return { height: toRem(value) };
}

export function minW(value: string | number): CSSProperties {
	return { minWidth: toRem(value) };
}

export function maxW(value: string | number): CSSProperties {
	return { maxWidth: toRem(value) };
}

export function minH(value: string | number): CSSProperties {
	return { minHeight: toRem(value) };
}

export function maxH(value: string | number): CSSProperties {
	return { maxHeight: toRem(value) };
}

export function boxSize(value: string | number): CSSProperties {
	return { boxSizing: toRem(value) as string };
}

export function aspect(value: string | number): CSSProperties {
	return { aspectRatio: toRem(value) as string };
}

// =============================================================================
// Typography
// =============================================================================

export function fontFamily(value: string | number): CSSProperties {
	return { fontFamily: toRem(value) as string };
}

export function fontSize(value: string | number): CSSProperties {
	return { fontSize: toRem(value) };
}

export function fontWeight(value: string | number): CSSProperties {
	return { fontWeight: toRem(value) as string };
}

export function fontStyle(value: string | number): CSSProperties {
	return { fontStyle: toRem(value) as string };
}

export function fontStretch(value: string | number): CSSProperties {
	return { fontStretch: toRem(value) as string };
}

export function fontVariant(value: string | number): CSSProperties {
	return { fontVariant: toRem(value) as string };
}

export function lineHeight(value: string | number): CSSProperties {
	return { lineHeight: toRem(value) };
}

export function letterSpacing(value: string | number): CSSProperties {
	return { letterSpacing: toRem(value) };
}

export function textAlign(value: string | number): CSSProperties {
	return { textAlign: toRem(value) as string };
}

export function textJustify(value: string | number): CSSProperties {
	return { textJustify: toRem(value) as string };
}

export function textIndent(value: string | number): CSSProperties {
	return { textIndent: toRem(value) };
}

export function textTransform(value: string | number): CSSProperties {
	return { textTransform: toRem(value) as string };
}

export function textDecoration(value: string | number): CSSProperties {
	return { textDecoration: toRem(value) as string };
}

export function textDecorationLine(value: string | number): CSSProperties {
	return { textDecorationLine: toRem(value) as string };
}

export function textDecorationStyle(value: string | number): CSSProperties {
	return { textDecorationStyle: toRem(value) as string };
}

export function textDecorationColor(value: string | number): CSSProperties {
	return { textDecorationColor: toRem(value) as string };
}

export function textShadow(value: string | number): CSSProperties {
	return { textShadow: toRem(value) as string };
}

export function textOverflow(value: string | number): CSSProperties {
	return { textOverflow: toRem(value) as string };
}

export function textWrap(value: string | number): CSSProperties {
	return { textWrap: toRem(value) as string };
}

export function wordBreak(value: string | number): CSSProperties {
	return { wordBreak: toRem(value) as string };
}

export function wordSpacing(value: string | number): CSSProperties {
	return { wordSpacing: toRem(value) };
}

export function whiteSpace(value: string | number): CSSProperties {
	return { whiteSpace: toRem(value) as string };
}

// Shortcuts
export function text(value: string | number): CSSProperties {
	return fontSize(value);
}

export function font(value: string | number): CSSProperties {
	return { font: toRem(value) as string };
}

export function leading(value: string | number): CSSProperties {
	return lineHeight(value);
}

export function tracking(value: string | number): CSSProperties {
	return letterSpacing(value);
}

// =============================================================================
// Color
// =============================================================================

export function color(value: string | number): CSSProperties {
	return { color: toRem(value) as string };
}

export function bg(value: string | number): CSSProperties {
	return { backgroundColor: toRem(value) as string };
}

export function bgColor(value: string | number): CSSProperties {
	return { backgroundColor: toRem(value) as string };
}

export function background(value: string | number): CSSProperties {
	return { background: toRem(value) as string };
}

export function backgroundImage(value: string | number): CSSProperties {
	return { backgroundImage: toRem(value) as string };
}

export function backgroundPosition(value: string | number): CSSProperties {
	return { backgroundPosition: toRem(value) as string };
}

export function backgroundSize(value: string | number): CSSProperties {
	return { backgroundSize: toRem(value) as string };
}

export function backgroundRepeat(value: string | number): CSSProperties {
	return { backgroundRepeat: toRem(value) as string };
}

export function backgroundAttachment(value: string | number): CSSProperties {
	return { backgroundAttachment: toRem(value) as string };
}

export function backgroundBlendMode(value: string | number): CSSProperties {
	return { backgroundBlendMode: toRem(value) as string };
}

export function backgroundClip(value: string | number): CSSProperties {
	return { backgroundClip: toRem(value) as string };
}

export function opacity(value: string | number): CSSProperties {
	return { opacity: toRem(value) as string };
}

export function gradient(value: string | number): CSSProperties {
	return { backgroundImage: toRem(value) as string };
}

// Shortcuts
export function textCol(value: string | number): CSSProperties {
	return color(value);
}

export function textColor(value: string | number): CSSProperties {
	return color(value);
}

// =============================================================================
// Borders
// =============================================================================

export function border(value: string | number): CSSProperties {
	if (typeof value === "number") {
		return { border: `${value}px` };
	}
	return { border: toRem(value) as string };
}

export function borderWidth(value: string | number): CSSProperties {
	if (typeof value === "number") {
		return { borderWidth: `${value}px` };
	}
	return { borderWidth: toRem(value) as string };
}

export function borderStyle(value: string | number): CSSProperties {
	return { borderStyle: toRem(value) as string };
}

export function borderColor(value: string | number): CSSProperties {
	return { borderColor: toRem(value) as string };
}

export function borderRadius(value: string | number): CSSProperties {
	return { borderRadius: toRem(value) };
}

export function borderTop(value: string | number): CSSProperties {
	if (typeof value === "number") {
		return { borderTop: `${value}px` };
	}
	return { borderTop: toRem(value) as string };
}

export function borderRight(value: string | number): CSSProperties {
	if (typeof value === "number") {
		return { borderRight: `${value}px` };
	}
	return { borderRight: toRem(value) as string };
}

export function borderBottom(value: string | number): CSSProperties {
	if (typeof value === "number") {
		return { borderBottom: `${value}px` };
	}
	return { borderBottom: toRem(value) as string };
}

export function borderLeft(value: string | number): CSSProperties {
	if (typeof value === "number") {
		return { borderLeft: `${value}px` };
	}
	return { borderLeft: toRem(value) as string };
}

export function borderTopLeftRadius(value: string | number): CSSProperties {
	return { borderTopLeftRadius: toRem(value) };
}

export function borderTopRightRadius(value: string | number): CSSProperties {
	return { borderTopRightRadius: toRem(value) };
}

export function borderBottomLeftRadius(value: string | number): CSSProperties {
	return { borderBottomLeftRadius: toRem(value) };
}

export function borderBottomRightRadius(value: string | number): CSSProperties {
	return { borderBottomRightRadius: toRem(value) };
}

export function borderImage(value: string | number): CSSProperties {
	return { borderImage: toRem(value) as string };
}

export function outline(value: string | number): CSSProperties {
	if (typeof value === "number") {
		return { outline: `${value}px` };
	}
	return { outline: toRem(value) as string };
}

export function outlineWidth(value: string | number): CSSProperties {
	if (typeof value === "number") {
		return { outlineWidth: `${value}px` };
	}
	return { outlineWidth: toRem(value) as string };
}

export function outlineColor(value: string | number): CSSProperties {
	return { outlineColor: toRem(value) as string };
}

export function outlineStyle(value: string | number): CSSProperties {
	return { outlineStyle: toRem(value) as string };
}

// Shortcuts
export function rounded(value: string | number): CSSProperties {
	return borderRadius(value);
}

export function roundedT(value: string | number): CSSProperties {
	return {
		borderTopLeftRadius: toRem(value),
		borderTopRightRadius: toRem(value),
	};
}

export function roundedB(value: string | number): CSSProperties {
	return {
		borderBottomLeftRadius: toRem(value),
		borderBottomRightRadius: toRem(value),
	};
}

export function roundedL(value: string | number): CSSProperties {
	return {
		borderTopLeftRadius: toRem(value),
		borderBottomLeftRadius: toRem(value),
	};
}

export function roundedR(value: string | number): CSSProperties {
	return {
		borderTopRightRadius: toRem(value),
		borderBottomRightRadius: toRem(value),
	};
}

export function roundedFull(value?: string | number): CSSProperties {
	return { borderRadius: value ? toRem(value) as string : "9999px" };
}

export function ring(value?: string | number): CSSProperties {
	const width = value ? toRem(value) : "3px";
	const color = value ? "" : "var(--color-ring, #000)";
	const props: CSSProperties = {
		boxShadow: `0 0 0 ${width}${color ? ` ${color}` : ""}`,
	};
	return props;
}

// =============================================================================
// Positioning
// =============================================================================

export function position(value: string | number): CSSProperties {
	return { position: toRem(value) as string };
}

export function top(value: string | number): CSSProperties {
	return { top: toRem(value) };
}

export function right(value: string | number): CSSProperties {
	return { right: toRem(value) };
}

export function bottom(value: string | number): CSSProperties {
	return { bottom: toRem(value) };
}

export function left(value: string | number): CSSProperties {
	return { left: toRem(value) };
}

export function inset(value: string | number): CSSProperties {
	return { inset: toRem(value) };
}

export function insetX(value: string | number): CSSProperties {
	return { left: toRem(value), right: toRem(value) };
}

export function insetY(value: string | number): CSSProperties {
	return { top: toRem(value), bottom: toRem(value) };
}

export function zIndex(value: string | number): CSSProperties {
	return { zIndex: toRem(value) as string };
}

// Shortcuts
export function absolute(value?: string | number): CSSProperties {
	const props: CSSProperties = { position: "absolute" };
	if (value) Object.assign(props, inset(value));
	return props;
}

export function relative(value?: string | number): CSSProperties {
	const props: CSSProperties = { position: "relative" };
	if (value) Object.assign(props, inset(value));
	return props;
}

export function fixed(value?: string | number): CSSProperties {
	const props: CSSProperties = { position: "fixed" };
	if (value) Object.assign(props, inset(value));
	return props;
}

export function sticky(value?: string | number): CSSProperties {
	const props: CSSProperties = { position: "sticky" };
	if (value) Object.assign(props, inset(value));
	return props;
}

// =============================================================================
// Overflow
// =============================================================================

export function overflow(value: string | number): CSSProperties {
	return { overflow: toRem(value) as string };
}

export function overflowX(value: string | number): CSSProperties {
	return { overflowX: toRem(value) as string };
}

export function overflowY(value: string | number): CSSProperties {
	return { overflowY: toRem(value) as string };
}

export function overflowWrap(value: string | number): CSSProperties {
	return { overflowWrap: toRem(value) as string };
}

export function textOverflowProp(value: string | number): CSSProperties {
	return { textOverflow: toRem(value) as string };
}

// Shortcuts
export function overflowAuto(): CSSProperties {
	return { overflow: "auto" };
}

export function overflowHidden(): CSSProperties {
	return { overflow: "hidden" };
}

export function overflowScroll(): CSSProperties {
	return { overflow: "scroll" };
}

export function overflowVisible(): CSSProperties {
	return { overflow: "visible" };
}

export function overflowClip(): CSSProperties {
	return { overflow: "clip" };
}

// =============================================================================
// Visibility
// =============================================================================

export function visibility(value: string | number): CSSProperties {
	return { visibility: toRem(value) as string };
}

export function opacityProp(value: string | number): CSSProperties {
	return opacity(value);
}

// =============================================================================
// Transforms
// =============================================================================

export function transform(value: string | number): CSSProperties {
	return { transform: toRem(value) as string };
}

export function translate(value: string | number): CSSProperties {
	return { transform: `translate(${toRem(value)})` };
}

export function translateX(value: string | number): CSSProperties {
	return { transform: `translateX(${toRem(value)})` };
}

export function translateY(value: string | number): CSSProperties {
	return { transform: `translateY(${toRem(value)})` };
}

export function scale(value: string | number): CSSProperties {
	return { transform: `scale(${toRem(value) as string})` };
}

export function scaleX(value: string | number): CSSProperties {
	return { transform: `scaleX(${toRem(value) as string})` };
}

export function scaleY(value: string | number): CSSProperties {
	return { transform: `scaleY(${toRem(value) as string})` };
}

export function rotate(value: string | number): CSSProperties {
	return { transform: `rotate(${toRem(value) as string})` };
}

export function skew(value: string | number): CSSProperties {
	return { transform: `skew(${toRem(value) as string})` };
}

export function skewX(value: string | number): CSSProperties {
	return { transform: `skewX(${toRem(value) as string})` };
}

export function skewY(value: string | number): CSSProperties {
	return { transform: `skewY(${toRem(value) as string})` };
}

export function perspective(value: string | number): CSSProperties {
	return { perspective: toRem(value) as string };
}

export function transformOrigin(value: string | number): CSSProperties {
	return { transformOrigin: toRem(value) as string };
}

export function transformStyle(value: string | number): CSSProperties {
	return { transformStyle: toRem(value) as string };
}

export function backfaceVisibility(value: string | number): CSSProperties {
	return { backfaceVisibility: toRem(value) as string };
}

// =============================================================================
// Transitions & Animations
// =============================================================================

export function transition(value: string | number): CSSProperties {
	return { transition: toRem(value) as string };
}

export function transitionProperty(value: string | number): CSSProperties {
	return { transitionProperty: toRem(value) as string };
}

export function transitionDuration(value: string | number): CSSProperties {
	return { transitionDuration: toRem(value) as string };
}

export function transitionTimingFunction(value: string | number): CSSProperties {
	return { transitionTimingFunction: toRem(value) as string };
}

export function transitionDelay(value: string | number): CSSProperties {
	return { transitionDelay: toRem(value) as string };
}

export function animation(value: string | number): CSSProperties {
	return { animation: toRem(value) as string };
}

export function animationName(value: string | number): CSSProperties {
	return { animationName: toRem(value) as string };
}

export function animationDuration(value: string | number): CSSProperties {
	return { animationDuration: toRem(value) as string };
}

export function animationTimingFunction(value: string | number): CSSProperties {
	return { animationTimingFunction: toRem(value) as string };
}

export function animationDelay(value: string | number): CSSProperties {
	return { animationDelay: toRem(value) as string };
}

export function animationIterationCount(value: string | number): CSSProperties {
	return { animationIterationCount: toRem(value) as string };
}

export function animationDirection(value: string | number): CSSProperties {
	return { animationDirection: toRem(value) as string };
}

export function animationFillMode(value: string | number): CSSProperties {
	return { animationFillMode: toRem(value) as string };
}

export function animationPlayState(value: string | number): CSSProperties {
	return { animationPlayState: toRem(value) as string };
}

// Shortcuts
export function duration(value: string | number): CSSProperties {
	return transitionDuration(value);
}

export function ease(value?: string): CSSProperties {
	return { transitionTimingFunction: value || "cubic-bezier(0.4, 0, 0.2, 1)" };
}

export function delay(value: string | number): CSSProperties {
	return transitionDelay(value);
}

// =============================================================================
// Effects
// =============================================================================

export function boxShadow(value: string | number): CSSProperties {
	return { boxShadow: toRem(value) as string };
}

export function blur(value: string | number): CSSProperties {
	return { filter: `blur(${toRem(value) as string})` };
}

export function brightness(value: string | number): CSSProperties {
	return { filter: `brightness(${toRem(value) as string})` };
}

export function contrast(value: string | number): CSSProperties {
	return { filter: `contrast(${toRem(value) as string})` };
}

export function dropShadow(value: string | number): CSSProperties {
	return { filter: `drop-shadow(${toRem(value) as string})` };
}

export function grayscale(value: string | number): CSSProperties {
	return { filter: `grayscale(${toRem(value) as string})` };
}

export function hueRotate(value: string | number): CSSProperties {
	return { filter: `hue-rotate(${toRem(value) as string})` };
}

export function invert(value: string | number): CSSProperties {
	return { filter: `invert(${toRem(value) as string})` };
}

export function saturate(value: string | number): CSSProperties {
	return { filter: `saturate(${toRem(value) as string})` };
}

export function sepia(value: string | number): CSSProperties {
	return { filter: `sepia(${toRem(value) as string})` };
}

export function backdropFilter(value: string | number): CSSProperties {
	return { backdropFilter: toRem(value) as string };
}

// =============================================================================
// Flex/Grid Shortcuts
// =============================================================================

export function placeItems(value: string | number): CSSProperties {
	return { placeItems: toRem(value) as string };
}

export function placeContent(value: string | number): CSSProperties {
	return { placeContent: toRem(value) as string };
}

export function placeSelf(value: string | number): CSSProperties {
	return { placeSelf: toRem(value) as string };
}

export function justify(value: string | number): CSSProperties {
	return { justifyContent: toRem(value) as string };
}

export function items(value: string | number): CSSProperties {
	return { alignItems: toRem(value) as string };
}

export function content(value: string | number): CSSProperties {
	return { alignContent: toRem(value) as string };
}

export function self(value: string | number): CSSProperties {
	return { alignSelf: toRem(value) as string };
}

// Grid column/row shortcuts
export function colSpan(value: string | number): CSSProperties {
	return { gridColumn: `span ${toRem(value) as string}` };
}

export function rowSpan(value: string | number): CSSProperties {
	return { gridRow: `span ${toRem(value) as string}` };
}

export function colStart(value: string | number): CSSProperties {
	return { gridColumnStart: toRem(value) as string };
}

export function colEnd(value: string | number): CSSProperties {
	return { gridColumnEnd: toRem(value) as string };
}

export function rowStart(value: string | number): CSSProperties {
	return { gridRowStart: toRem(value) as string };
}

export function rowEnd(value: string | number): CSSProperties {
	return { gridRowEnd: toRem(value) as string };
}

// =============================================================================
// List
// =============================================================================

export function listStyle(value: string | number): CSSProperties {
	return { listStyle: toRem(value) as string };
}

export function listStyleType(value: string | number): CSSProperties {
	return { listStyleType: toRem(value) as string };
}

export function listStylePosition(value: string | number): CSSProperties {
	return { listStylePosition: toRem(value) as string };
}

export function listStyleImage(value: string | number): CSSProperties {
	return { listStyleImage: toRem(value) as string };
}

// =============================================================================
// Table
// =============================================================================

export function tableLayout(value: string | number): CSSProperties {
	return { tableLayout: toRem(value) as string };
}

export function borderCollapse(value: string | number): CSSProperties {
	return { borderCollapse: toRem(value) as string };
}

export function borderSpacing(value: string | number): CSSProperties {
	return { borderSpacing: toRem(value) };
}

export function captionSide(value: string | number): CSSProperties {
	return { captionSide: toRem(value) as string };
}

export function emptyCells(value: string | number): CSSProperties {
	return { emptyCells: toRem(value) as string };
}

// =============================================================================
// Scroll
// =============================================================================

export function scrollBehavior(value: string | number): CSSProperties {
	return { scrollBehavior: toRem(value) as string };
}

export function scrollMargin(value: string | number): CSSProperties {
	return { scrollMargin: toRem(value) };
}

export function scrollPadding(value: string | number): CSSProperties {
	return { scrollPadding: toRem(value) };
}

export function scrollSnap(value: string | number): CSSProperties {
	return { scrollSnapType: toRem(value) as string };
}

export function scrollAlign(value: string | number): CSSProperties {
	return { scrollSnapAlign: toRem(value) as string };
}

// =============================================================================
// User Select
// =============================================================================

export function userSelect(value: string | number): CSSProperties {
	return { userSelect: toRem(value) as string };
}

export function pointerEvents(value: string | number): CSSProperties {
	return { pointerEvents: toRem(value) as string };
}

export function cursor(value: string | number): CSSProperties {
	return { cursor: toRem(value) as string };
}

// =============================================================================
// Whitespace
// =============================================================================

export function truncate(): CSSProperties {
	return {
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	};
}

// =============================================================================
// Aspect Ratio
// =============================================================================

export function aspectRatio(value: string | number): CSSProperties {
	return aspect(value);
}

// =============================================================================
// Utilities
// =============================================================================

export function pxToRem(px: string | number): string {
	if (typeof px === "number") {
		return `${px / 16}rem`;
	}
	// If string, assume it's already in px
	const num = parseFloat(px);
	if (isNaN(num)) return px;
	return `${num / 16}rem`;
}

export function remToPx(rem: string | number): string {
	if (typeof rem === "number") {
		return `${rem * 16}px`;
	}
	const num = parseFloat(rem);
	if (isNaN(num)) return rem;
	return `${num * 16}px`;
}

// =============================================================================
// Pseudo-classes (applied via nesting)
// =============================================================================

export function hover(styles: CSSProperties): CSSProperties {
	return { "&:hover": styles };
}

export function focus(styles: CSSProperties): CSSProperties {
	return { "&:focus": styles };
}

export function active(styles: CSSProperties): CSSProperties {
	return { "&:active": styles };
}

export function visited(styles: CSSProperties): CSSProperties {
	return { "&:visited": styles };
}

export function focusWithin(styles: CSSProperties): CSSProperties {
	return { "&:focus-within": styles };
}

export function focusVisible(styles: CSSProperties): CSSProperties {
	return { "&:focus-visible": styles };
}

export function first(styles: CSSProperties): CSSProperties {
	return { "&:first-child": styles };
}

export function last(styles: CSSProperties): CSSProperties {
	return { "&:last-child": styles };
}

export function odd(styles: CSSProperties): CSSProperties {
	return { "&:nth-child(odd)": styles };
}

export function even(styles: CSSProperties): CSSProperties {
	return { "&:nth-child(even)": styles };
}

export function notFirst(styles: CSSProperties): CSSProperties {
	return { "&:not(:first-child)": styles };
}

export function notLast(styles: CSSProperties): CSSProperties {
	return { "&:not(:last-child)": styles };
}

export function disabled(styles: CSSProperties): CSSProperties {
	return { "&:disabled": styles };
}

export function enabled(styles: CSSProperties): CSSProperties {
	return { "&:enabled": styles };
}

export function checked(styles: CSSProperties): CSSProperties {
	return { "&:checked": styles };
}

export function readOnly(styles: CSSProperties): CSSProperties {
	return { "&:read-only": styles };
}

export function readWrite(styles: CSSProperties): CSSProperties {
	return { "&:read-write": styles };
}

// =============================================================================
// Pseudo-elements
// =============================================================================

export function before(styles: CSSProperties): CSSProperties {
	return { "&::before": styles };
}

export function after(styles: CSSProperties): CSSProperties {
	return { "&::after": styles };
}

export function firstLetter(styles: CSSProperties): CSSProperties {
	return { "&::first-letter": styles };
}

export function firstLine(styles: CSSProperties): CSSProperties {
	return { "&::first-line": styles };
}

export function selection(styles: CSSProperties): CSSProperties {
	return { "&::selection": styles };
}

export function marker(styles: CSSProperties): CSSProperties {
	return { "&::marker": styles };
}

export function placeholder(styles: CSSProperties): CSSProperties {
	return { "&::placeholder": styles };
}

// =============================================================================
// Media Queries (responsive)
// =============================================================================

export function sm(styles: CSSProperties): CSSProperties {
	return { "@media (min-width: 640px)": styles };
}

export function md(styles: CSSProperties): CSSProperties {
	return { "@media (min-width: 768px)": styles };
}

export function lg(styles: CSSProperties): CSSProperties {
	return { "@media (min-width: 1024px)": styles };
}

export function xl(styles: CSSProperties): CSSProperties {
	return { "@media (min-width: 1280px)": styles };
}

export function xxl(styles: CSSProperties): CSSProperties {
	return { "@media (min-width: 1536px)": styles };
}

export function dark(styles: CSSProperties): CSSProperties {
	return { "@media (prefers-color-scheme: dark)": styles };
}

export function light(styles: CSSProperties): CSSProperties {
	return { "@media (prefers-color-scheme: light)": styles };
}

export function motion(styles: CSSProperties): CSSProperties {
	return { "@media (prefers-reduced-motion: no-preference)": styles };
}

export function motionReduce(styles: CSSProperties): CSSProperties {
	return { "@media (prefers-reduced-motion: reduce)": styles };
}

// =============================================================================
// Container Queries
// =============================================================================

export function container(value?: string): CSSProperties {
	return { container: value || "inline-size" };
}

export function cqw(value: string | number): CSSProperties {
	return { width: toRem(value) };
}

export function cqh(value: string | number): CSSProperties {
	return { height: toRem(value) };
}

// =============================================================================
// Print
// =============================================================================

export function print(styles: CSSProperties): CSSProperties {
	return { "@media print": styles };
}

export function landscape(styles: CSSProperties): CSSProperties {
	return { "@media (orientation: landscape)": styles };
}

export function portrait(styles: CSSProperties): CSSProperties {
	return { "@media (orientation: portrait)": styles };
}

// =============================================================================
// Arbitrary values
// =============================================================================

export function any(value: string): CSSProperties {
	return { value } as CSSProperties;
}
