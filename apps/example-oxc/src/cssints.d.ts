/**
 * Type declarations for cssints module
 * 
 * Usage: import * as css from "cssints" with { type: "cssints" }
 * 
 * Note: At compile time, the transformer replaces function calls with class name strings.
 * So all functions return string (the generated class name).
 */

declare module "cssints" {
	// Branded type for CSSints function return values
	type CSSintsClassName = string & { readonly __cssints: unique symbol };

	// Display & Layout
	function display(value: string | number): CSSintsClassName;
	function flex(): CSSintsClassName;
	function flexInline(): CSSintsClassName;
	function grid(): CSSintsClassName;
	function block(): CSSintsClassName;
	function inline(): CSSintsClassName;
	function none(): CSSintsClassName;

	// Flexbox
	function flexDirection(value: string): CSSintsClassName;
	function flexWrap(value: string): CSSintsClassName;
	function justifyContent(value: string): CSSintsClassName;
	function alignItems(value: string): CSSintsClassName;
	function alignContent(value: string): CSSintsClassName;
	function alignSelf(value: string): CSSintsClassName;
	function gap(value: string | number): CSSintsClassName;
	function rowGap(value: string | number): CSSintsClassName;
	function columnGap(value: string | number): CSSintsClassName;

	// Shortcuts
	function col(value?: number): CSSintsClassName;
	function row(value?: number): CSSintsClassName;
	function wrap(value?: number): CSSintsClassName;
	function flexCenter(value?: number): CSSintsClassName;
	function items(value: string): CSSintsClassName;
	function justify(value: string): CSSintsClassName;

	// Spacing - Padding
	function p(value: string | number): CSSintsClassName;
	function px(value: string | number): CSSintsClassName;
	function py(value: string | number): CSSintsClassName;
	function pt(value: string | number): CSSintsClassName;
	function pr(value: string | number): CSSintsClassName;
	function pb(value: string | number): CSSintsClassName;
	function pl(value: string | number): CSSintsClassName;

	// Spacing - Margin
	function m(value: string | number): CSSintsClassName;
	function mx(value: string | number): CSSintsClassName;
	function my(value: string | number): CSSintsClassName;
	function mt(value: string | number): CSSintsClassName;
	function mr(value: string | number): CSSintsClassName;
	function mb(value: string | number): CSSintsClassName;
	function ml(value: string | number): CSSintsClassName;

	// Sizing
	function w(value: string | number): CSSintsClassName;
	function h(value: string | number): CSSintsClassName;
	function minW(value: string | number): CSSintsClassName;
	function maxW(value: string | number): CSSintsClassName;
	function minH(value: string | number): CSSintsClassName;
	function maxH(value: string | number): CSSintsClassName;

	// Typography
	function fontSize(value: string | number): CSSintsClassName;
	function fontWeight(value: string | number): CSSintsClassName;
	function fontFamily(value: string): CSSintsClassName;
	function textAlign(value: string): CSSintsClassName;
	function text(value: string | number): CSSintsClassName;
	function font(value: string): CSSintsClassName;
	function leading(value: string | number): CSSintsClassName;

	// Color
	function color(value: string): CSSintsClassName;
	function bg(value: string): CSSintsClassName;
	function bgColor(value: string): CSSintsClassName;
	function opacity(value: string | number): CSSintsClassName;

	// Borders
	function border(value: string | number): CSSintsClassName;
	function borderRadius(value: string | number): CSSintsClassName;
	function rounded(value: string | number): CSSintsClassName;
	function roundedFull(value?: string | number): CSSintsClassName;

	// Positioning
	function position(value: string): CSSintsClassName;
	function top(value: string | number): CSSintsClassName;
	function right(value: string | number): CSSintsClassName;
	function bottom(value: string | number): CSSintsClassName;
	function left(value: string | number): CSSintsClassName;
	function inset(value: string | number): CSSintsClassName;
	function absolute(value?: string | number): CSSintsClassName;
	function relative(value?: string | number): CSSintsClassName;
	function fixed(value?: string | number): CSSintsClassName;
	function sticky(value?: string | number): CSSintsClassName;

	// Overflow
	function overflow(value: string): CSSintsClassName;
	function overflowX(value: string): CSSintsClassName;
	function overflowY(value: string): CSSintsClassName;
	function overflowHidden(): CSSintsClassName;
	function overflowAuto(): CSSintsClassName;

	// Effects
	function boxShadow(value: string): CSSintsClassName;
	function blur(value: string | number): CSSintsClassName;

	// Pseudo-classes (accept CSSintsClassName and return CSSintsClassName)
	function hover(styles: CSSintsClassName): CSSintsClassName;
	function focus(styles: CSSintsClassName): CSSintsClassName;
	function active(styles: CSSintsClassName): CSSintsClassName;

	// Media Queries
	function sm(styles: CSSintsClassName): CSSintsClassName;
	function md(styles: CSSintsClassName): CSSintsClassName;
	function lg(styles: CSSintsClassName): CSSintsClassName;
	function dark(styles: CSSintsClassName): CSSintsClassName;

	// Utilities
	function truncate(): CSSintsClassName;
	function pxToRem(px: string | number): string;
	function remToPx(rem: string | number): string;

	// cn function for merging class names
	function cn(...styles: (CSSintsClassName | string | undefined | null | false)[]): string;
}
