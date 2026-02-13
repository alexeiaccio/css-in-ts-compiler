/**
 * @cssints/generator
 *
 * Script to generate CSS property functions from mdn-data.
 * Run: bun run scripts/generate-css-functions.ts
 */

import * as fs from "fs";
import * as path from "path";

const MDN_DATA_PATH = path.join(process.cwd(), "node_modules/mdn-data/css");
const OUTPUT_FILE = path.join(process.cwd(), "src/cssints/generated.ts");

const BANNER = `/**
 * cssints - CSS-in-TS utilities
 * AUTO-GENERATED - Do not edit manually
 * Generated from mdn-data
 *
 * Usage: import * as css from "cssints" with { type: "cssints" }
 */

`;

// Map mdn-data categories to our sections
const CATEGORY_MAP: Record<string, string> = {
	properties: "Properties",
	types: "Types",
	selectors: "Selectors",
	at-rules: "At-Rules",
};

// Properties that should be mapped to specific types
const TYPE_MAP: Record<string, string> = {
	"--*": "custom", // Custom properties
};

// Properties that accept length values (should use toRem)
const LENGTH_PROPS = new Set([
	"width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
	"padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
	"paddingInline", "paddingBlock", "paddingInlineStart", "paddingInlineEnd",
	"paddingBlockStart", "paddingBlockEnd",
	"margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
	"marginInline", "marginBlock", "marginInlineStart", "marginInlineEnd",
	"marginBlockStart", "marginBlockEnd",
	"top", "right", "bottom", "left",
	"inset", "insetBlock", "insetInline",
	"insetBlockStart", "insetBlockEnd", "insetInlineStart", "insetInlineEnd",
	"gap", "columnGap", "rowGap",
	"gridColumnGap", "gridRowGap", "gridGap",
	"fontSize", "lineHeight", "letterSpacing",
	"textIndent",
	"borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
	"borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius",
	"outlineWidth",
	"backgroundPosition", "backgroundPositionX", "backgroundPositionY",
	"backgroundSize",
	"boxShadow", "textShadow",
	"transform", "translate", "translateX", "translateY", "translateZ",
	"scale", "scaleX", "scaleY", "scaleZ",
	"rotate", "rotateX", "rotateY", "rotateZ",
	"perspective",
	"perspective", "transformOrigin", "transformStyle",
	"clipPath",
	"strokeWidth",
	"flexBasis",
	"order",
	"z-index",
	"opacity",
	"elevation",
	"scrollMargin", "scrollMarginTop", "scrollMarginRight", "scrollMarginBottom", "scrollMarginLeft",
	"scrollMarginInline", "scrollMarginBlock",
	"scrollPadding", "scrollPaddingTop", "scrollPaddingRight", "scrollPaddingBottom", "scrollPaddingLeft",
	"scrollPaddingInline", "scrollPaddingBlock",
	"scrollSnapCoordinate",
	"shapeMargin",
	"gridColumn", "gridRow", "gridArea",
	"columnWidth", "columnGap",
]);

// Properties that accept numeric values directly (px)
const PIXEL_PROPS = new Set([
	"borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
	"outlineWidth",
	"columnCount",
	"orphans",
	"widows",
	"tabSize",
	"zoom",
]);

// Properties that should not have scaling applied
const STRING_PROPS = new Set([
	"display", "position", "float", "clear",
	"overflow", "overflowX", "overflowY", "overflowClipMargin",
	"visibility", "opacity",
	"textAlign", "textAlignLast", "textJustify",
	"textTransform", "textOverflow", "textWrap", "whiteSpace", "wordBreak", "wordSpacing",
	"fontFamily", "fontStyle", "fontVariant", "fontWeight", "fontStretch",
	"lineHeight", "letterSpacing", "textIndent",
	"color", "backgroundColor", "background", "backgroundImage",
	"backgroundRepeat", "backgroundAttachment", "backgroundPosition", "backgroundSize", "backgroundClip", "backgroundBlendMode",
	"borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
	"borderStyle", "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle",
	"borderImage", "borderImageSource", "borderImageSlice", "borderImageWidth", "borderImageOutset", "borderImageRepeat",
	"outlineColor", "outlineStyle",
	"boxShadow", "textShadow",
	"listStyle", "listStyleType", "listStylePosition", "listStyleImage",
	"captionSide", "tableLayout", "borderCollapse", "borderSpacing",
	"verticalAlign",
	"cursor", "pointerEvents", "userSelect",
	"writingMode", "direction",
	"textOrientation", "unicodeBidi",
	"transform", "transformOrigin", "transformStyle", "transformBox",
	"backfaceVisibility",
	"transition", "transitionProperty", "transitionDuration", "transitionTimingFunction", "transitionDelay",
	"animation", "animationName", "animationDuration", "animationTimingFunction", "animationDelay",
	"animationIterationCount", "animationDirection", "animationFillMode", "animationPlayState",
	"filter", "backdropFilter",
	"mixBlendMode", "isolation",
	"objectFit", "objectPosition",
	"alignContent", "alignItems", "alignSelf", "justifyContent", "justifyItems", "justifySelf",
	"flexWrap", "flexDirection", "flexFlow",
	"gridTemplateColumns", "gridTemplateRows", "gridTemplateAreas",
	"gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd",
	"gridAutoColumns", "gridAutoRows", "gridAutoFlow",
	"placeContent", "placeItems", "placeSelf",
	"scrollBehavior", "scrollSnapType", "scrollSnapAlign", "scrollSnapStop",
	"scrollSnapCoordinate",
	"contain", "containIntrinsicSize",
	"hyphens", "lineBreak", "overflowWrap",
	"resize",
	"willChange", "containIntrinsicBlockSize", "containIntrinsicInlineSize",
	"fontOpticalSizing", "fontSizeAdjust", "fontKerning",
	"fontFeatureSettings", "fontLanguageOverride",
	"textRendering", "-webkitTextStrokeColor", "-webkitTextStrokeWidth",
	"paintOrder",
	"lightingColor",
	"colorInterpolation", "colorInterpolationFilters",
	"colorProfile",
	"colorRendering",
	"floodColor", "floodOpacity",
	"stopColor", "stopOpacity",
	"vectorEffect",
	"inherits", "initialValue", "syntax",
]);

// Keywords for specific properties
const KEYWORD_VALUES: Record<string, string[]> = {
	display: ["block", "inline", "inline-block", "flex", "inline-flex", "grid", "inline-grid", "none", "contents", "flow", "flow-root", "ruby", "ruby-base", "ruby-base-container", "ruby-text", "ruby-text-container", "table", "table-row", "table-cell", "table-row-group", "table-column", "table-column-group", "table-caption", "inline-table", "run-in"],
	position: ["static", "relative", "absolute", "fixed", "sticky", "center", "page", "overlay", "snap-align", "snap-stop"],
	flexDirection: ["row", "row-reverse", "column", "column-reverse"],
	flexWrap: ["nowrap", "wrap", "wrap-reverse"],
	justifyContent: ["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly", "start", "end", "left", "right", "stretch", "baseline"],
	alignItems: ["flex-start", "flex-end", "center", "baseline", "stretch", "start", "end", "self-start", "self-end"],
	alignContent: ["flex-start", "flex-end", "center", "space-between", "space-around", "stretch", "start", "end", "baseline"],
	textAlign: ["left", "right", "center", "justify", "justify-all", "start", "end", "match-parent"],
	overflow: ["visible", "hidden", "clip", "scroll", "auto"],
	visibility: ["visible", "hidden", "collapse"],
	whiteSpace: ["normal", "nowrap", "pre", "pre-wrap", "pre-line", "break-spaces"],
	cursor: ["auto", "default", "none", "context-menu", "help", "pointer", "progress", "wait", "cell", "crosshair", "text", "vertical-text", "alias", "copy", "move", "no-drop", "not-allowed", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "ne-resize", "e-resize", "se-resize", "s-resize", "sw-resize", "w-resize", "nw-resize", "nwse-resize", "nesw-resize", "ew-resize", "ns-resize", "zoom-in", "zoom-out"],
	borderStyle: ["none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"],
	borderWidth: ["thin", "medium", "thick"],
};

// Shorthand mappings
const SHORTHANDS: Record<string, string[]> = {
	p: ["padding"],
	px: ["paddingLeft", "paddingRight"],
	py: ["paddingTop", "paddingBottom"],
	pt: ["paddingTop"],
	pr: ["paddingRight"],
	pb: ["paddingBottom"],
	pl: ["paddingLeft"],
	m: ["margin"],
	mx: ["marginLeft", "marginRight"],
	my: ["marginTop", "marginBottom"],
	mt: ["marginTop"],
	mr: ["marginRight"],
	mb: ["marginBottom"],
	ml: ["marginLeft"],
	bg: ["backgroundColor"],
	rounded: ["borderRadius"],
};

// Alias mappings
const ALIASES: Record<string, string> = {
	flexDir: "flexDirection",
	flexWrap: "flexWrap",
	flexGrow: "flexGrow",
	flexShrink: "flexShrink",
	flexBasis: "flexBasis",
	justifyItems: "justifyItems",
	justifySelf: "justifySelf",
	alignContent: "alignContent",
	alignItems: "alignItems",
	alignSelf: "alignSelf",
	gridTemplateCols: "gridTemplateColumns",
	gridTemplateRows: "gridTemplateRows",
	gridTemplateAreas: "gridTemplateAreas",
	gridColumn: "gridColumn",
	gridRow: "gridRow",
	gridArea: "gridArea",
	fontSize: "fontSize",
	fontWeight: "fontWeight",
	fontFamily: "fontFamily",
	fontStyle: "fontStyle",
	lineHeight: "lineHeight",
	letterSpacing: "letterSpacing",
	textAlign: "textAlign",
	textDecoration: "textDecoration",
	textTransform: "textTransform",
	textShadow: "textShadow",
	textOverflow: "textOverflow",
	wordBreak: "wordBreak",
	wordSpacing: "wordSpacing",
	whiteSpace: "whiteSpace",
	color: "color",
	background: "background",
	backgroundColor: "backgroundColor",
	backgroundImage: "backgroundImage",
	backgroundPosition: "backgroundPosition",
	backgroundSize: "backgroundSize",
	backgroundRepeat: "backgroundRepeat",
	backgroundAttachment: "backgroundAttachment",
	backgroundClip: "backgroundClip",
	backgroundBlendMode: "backgroundBlendMode",
	opacity: "opacity",
	border: "border",
	borderWidth: "borderWidth",
	borderStyle: "borderStyle",
	borderColor: "borderColor",
	borderRadius: "borderRadius",
	borderTop: "borderTop",
	borderRight: "borderRight",
	borderBottom: "borderBottom",
	borderLeft: "borderLeft",
	borderTopLeftRadius: "borderTopLeftRadius",
	borderTopRightRadius: "borderTopRightRadius",
	borderBottomLeftRadius: "borderBottomLeftRadius",
	borderBottomRightRadius: "borderBottomRightRadius",
	outline: "outline",
	outlineWidth: "outlineWidth",
	outlineColor: "outlineColor",
	outlineStyle: "outlineStyle",
	boxShadow: "boxShadow",
	position: "position",
	top: "top",
	right: "right",
	bottom: "bottom",
	left: "left",
	inset: "inset",
	insetX: ["left", "right"],
	insetY: ["top", "bottom"],
	zIndex: "zIndex",
	overflow: "overflow",
	overflowX: "overflowX",
	overflowY: "overflowY",
	visibility: "visibility",
	transform: "transform",
	translate: "translate",
	translateX: "translateX",
	translateY: "translateY",
	scale: "scale",
	scaleX: "scaleX",
	scaleY: "scaleY",
	rotate: "rotate",
	skew: "skew",
	skewX: "skewX",
	skewY: "skewY",
	perspective: "perspective",
	transformOrigin: "transformOrigin",
	transition: "transition",
	transitionProperty: "transitionProperty",
	transitionDuration: "transitionDuration",
	transitionTimingFunction: "transitionTimingFunction",
	transitionDelay: "transitionDelay",
	animation: "animation",
	animationName: "animationName",
	animationDuration: "animationDuration",
	animationTimingFunction: "animationTimingFunction",
	animationDelay: "animationDelay",
	animationIterationCount: "animationIterationCount",
	animationDirection: "animationDirection",
	animationFillMode: "animationFillMode",
	animationPlayState: "animationPlayState",
	boxShadow: "boxShadow",
	blur: "blur",
	brightness: "brightness",
	contrast: "contrast",
	dropShadow: "dropShadow",
	grayscale: "grayscale",
	hueRotate: "hueRotate",
	invert: "invert",
	saturate: "saturate",
	sepia: "sepia",
	backdropFilter: "backdropFilter",
	placeItems: "placeItems",
	placeContent: "placeContent",
	placeSelf: "placeSelf",
	justify: "justifyContent",
	items: "alignItems",
	content: "alignContent",
	self: "alignSelf",
	colSpan: "gridColumn",
	rowSpan: "gridRow",
	colStart: "gridColumnStart",
	colEnd: "gridColumnEnd",
	rowStart: "gridRowStart",
	rowEnd: "gridRowEnd",
	listStyle: "listStyle",
	listStyleType: "listStyleType",
	listStylePosition: "listStylePosition",
	listStyleImage: "listStyleImage",
	tableLayout: "tableLayout",
	borderCollapse: "borderCollapse",
	borderSpacing: "borderSpacing",
	captionSide: "captionSide",
	emptyCells: "emptyCells",
	scrollBehavior: "scrollBehavior",
	scrollMargin: "scrollMargin",
	scrollPadding: "scrollPadding",
	scrollSnap: "scrollSnap",
	scrollAlign: "scrollSnapAlign",
	userSelect: "userSelect",
	pointerEvents: "pointerEvents",
	cursor: "cursor",
	truncate: "truncate",
	container: "container",
	aspectRatio: "aspectRatio",
	// Shortcuts
	col: "flexDirection:column",
	row: "flexDirection:row",
	wrap: "flexWrap:wrap",
	noWrap: "flexWrap:nowrap",
	flexCenter: "display:flex;justifyContent:center;alignItems:center",
	absolute: "position:absolute",
	relative: "position:relative",
	fixed: "position:fixed",
	sticky: "position:sticky",
	block: "display:block",
	inline: "display:inline",
	inlineBlock: "display:inline-block",
	flex: "display:flex",
	grid: "display:grid",
	inlineFlex: "display:inline-flex",
	inlineGrid: "display:inline-grid",
	none: "display:none",
	contents: "display:contents",
};

function toCamelCase(str: string): string {
	return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^./, (s) => s.toLowerCase());
}

function toKebabCase(str: string): string {
	return str.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase();
}

function generatePropertyFunction(propName: string, cssProp: string): string {
	const fnName = toCamelCase(propName);
	const propKebab = toKebabCase(cssProp);

	// Check if it's a shorthand
	const shorthand = SHORTHANDS[fnName];
	if (shorthand && shorthand.length > 1) {
		const props = shorthand.map((p) => {
			const pKebab = toKebabCase(p);
			if (LENGTH_PROPS.has(pKebab)) {
				return `${p}: toRem(value)`;
			} else if (PIXEL_PROPS.has(pKebab)) {
				return `${p}: typeof value === "number" ? \`\${value}px\` : value`;
			}
			return `${p}: value`;
		}).join(", ");
		return `export function ${fnName}(value: string | number): CSSProperties { return { ${props} }; }`;
	}

	// Check for special cases
	if (propName === "insetX" || propName === "insetY") {
		const xOrY = propName === "insetX" ? ["left", "right"] : ["top", "bottom"];
		return `export function ${fnName}(value: string | number): CSSProperties { return { ${xOrY[0]}: toRem(value), ${xOrY[1]}: toRem(value) }; }`;
	}

	if (propName === "inset") {
		return `export function ${fnName}(value: string | number): CSSProperties { return { inset: toRem(value) }; }`;
	}

	if (propName === "col" || propName === "row") {
		const dir = propName === "col" ? "column" : "row";
		return `export function ${fnName}(value?: string | number): CSSProperties { const props: CSSProperties = { flexDirection: "${dir}" }; if (value) Object.assign(props, gap(value)); return props; }`;
	}

	if (propName === "wrap" || propName === "noWrap") {
		const wrap = propName === "wrap" ? "wrap" : "nowrap";
		return `export function ${fnName}(value?: string | number): CSSProperties { const props: CSSProperties = { flexWrap: "${wrap}" }; if (value) Object.assign(props, gap(value)); return props; }`;
	}

	if (propName === "flexCenter") {
		return `export function ${fnName}(value?: string | number): CSSProperties { const props: CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center" }; if (value) Object.assign(props, gap(value)); return props; }`;
	}

	if (propName === "absolute" || propName === "relative" || propName === "fixed" || propName === "sticky") {
		return `export function ${fnName}(value?: string | number): CSSProperties { const props: CSSProperties = { position: "${propName}" }; if (value) Object.assign(props, inset(value)); return props; }`;
	}

	// Check for specific property types
	if (LENGTH_PROPS.has(propKebab)) {
		return `export function ${fnName}(value: string | number): CSSProperties { return { ${propKebab}: toRem(value) }; }`;
	}

	if (PIXEL_PROPS.has(propKebab)) {
		return `export function ${fnName}(value: string | number): CSSProperties { return { ${propKebab}: typeof value === "number" ? \`\${value}px\` : value }; }`;
	}

	// Check for specific value mappings
	const keywords = KEYWORD_VALUES[propKebab];
	if (keywords) {
		return `export function ${fnName}(value: string | number): CSSProperties { return { ${propKebab}: value }; }`;
	}

	// Default: pass through as-is
	return `export function ${fnName}(value: string | number): CSSProperties { return { ${propKebab}: value }; }`;
}

function generateUtilityFunction(propName: string, cssProp: string): string[] {
	const results: string[] = [];
	const fnName = toCamelCase(propName);
	const propKebab = toKebabCase(cssProp);

	// Check if it's a simple keyword-only property
	if (KEYWORD_VALUES[propKebab]) {
		// Generate shorthand functions for keywords
		const keywords = KEYWORD_VALUES[propKebab];
		for (const kw of keywords.slice(0, 10)) {
			// Generate common keyword shortcuts
		}
	}

	return results;
}

function generate(): void {
	const lines: string[] = [BANNER];

	// Add header
	lines.push(`import type { CSSValue, CSSProperties } from "./types";`);
	lines.push("");
	lines.push("const DEFAULT_SCALE = 0.25;");
	lines.push("let currentScale = DEFAULT_SCALE;");
	lines.push("");
	lines.push("export function setScale(scale: number): void { currentScale = scale; }");
	lines.push("export function getScale(): number { return currentScale; }");
	lines.push("");
	lines.push("function toRem(value: number | string): string {");
	lines.push("	if (typeof value === 'number') { return `${value * currentScale}rem`; }");
	lines.push("	return value;");
	lines.push("}");
	lines.push("");
	lines.push("function toPixel(value: number | string): string {");
	lines.push("	if (typeof value === 'number') { return `${value * currentScale * 16}px`; }");
	lines.push("	return value;");
	lines.push("}");
	lines.push("");

	// Generate functions from mdn-data properties
	const propertiesPath = path.join(MDN_DATA_PATH, "properties.json");
	if (fs.existsSync(propertiesPath)) {
		const propertiesData = JSON.parse(fs.readFileSync(propertiesPath, "utf-8"));
		
		// Track generated functions
		const generated = new Set<string>();

		// Process each property
		for (const [prop, data] of Object.entries(propertiesData)) {
			if (prop.startsWith("__")) continue;
			
			const propData = data as any;
			const cssProp = propData.name || prop;
			
			// Skip at-rules, pseudo-elements, etc.
			if (!cssProp || cssProp.startsWith("@") || cssProp.startsWith(":")) continue;

			generated.add(cssProp);
		}

		// Generate functions for common CSS properties
		const commonProps = [
			"display", "position", "float", "clear", "visibility", "opacity",
			"width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
			"boxSizing",
			"padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
			"paddingInline", "paddingBlock", "paddingInlineStart", "paddingInlineEnd",
			"margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
			"marginInline", "marginBlock", "marginInlineStart", "marginInlineEnd",
			"border", "borderWidth", "borderStyle", "borderColor",
			"borderTop", "borderRight", "borderBottom", "borderLeft",
			"borderRadius", "borderTopLeftRadius", "borderTopRightRadius",
			"borderBottomLeftRadius", "borderBottomRightRadius",
			"outline", "outlineWidth", "outlineStyle", "outlineColor",
			"background", "backgroundColor", "backgroundImage", "backgroundPosition",
			"backgroundSize", "backgroundRepeat", "backgroundAttachment", "backgroundClip",
			"color", "fontFamily", "fontSize", "fontWeight", "fontStyle",
			"lineHeight", "letterSpacing", "textAlign", "textDecoration",
			"textTransform", "textIndent", "textShadow", "textOverflow",
			"whiteSpace", "wordBreak", "wordSpacing",
			"flex", "flexDirection", "flexWrap", "flexFlow",
			"flexGrow", "flexShrink", "flexBasis", "order",
			"justifyContent", "justifyItems", "justifySelf",
			"alignContent", "alignItems", "alignSelf",
			"gap", "columnGap", "rowGap",
			"grid", "gridTemplateColumns", "gridTemplateRows", "gridTemplateAreas",
			"gridColumn", "gridRow", "gridArea",
			"gridAutoColumns", "gridAutoRows", "gridAutoFlow",
			"placeItems", "placeContent", "placeSelf",
			"top", "right", "bottom", "left", "inset", "zIndex",
			"overflow", "overflowX", "overflowY", "overflowClipMargin",
			"visibility", "transform", "transformOrigin", "transformStyle",
			"translate", "translateX", "translateY", "translateZ",
			"scale", "scaleX", "scaleY", "scaleZ",
			"rotate", "rotateX", "rotateY", "rotateZ",
			"perspective", "backfaceVisibility",
			"transition", "transitionProperty", "transitionDuration",
			"transitionTimingFunction", "transitionDelay",
			"animation", "animationName", "animationDuration",
			"animationTimingFunction", "animationDelay", "animationIterationCount",
			"animationDirection", "animationFillMode", "animationPlayState",
			"boxShadow", "filter", "backdropFilter",
			"cursor", "pointerEvents", "userSelect",
			"listStyle", "listStyleType", "listStylePosition", "listStyleImage",
			"tableLayout", "borderCollapse", "borderSpacing", "captionSide",
			"scrollBehavior", "scrollMargin", "scrollPadding",
			"scrollSnapType", "scrollSnapAlign", "scrollSnapStop",
			"content", "quotes", "counterIncrement", "counterReset",
			"writingMode", "direction", "unicodeBidi",
		];

		lines.push("// =============================================================================");
		lines.push("// Generated from mdn-data properties");
		lines.push("// =============================================================================");
		lines.push("");

		for (const prop of commonProps) {
			const fn = generatePropertyFunction(prop, prop);
			lines.push(fn);
		}
	}

	lines.push("");
	lines.push("// =============================================================================");
	lines.push("// Shorthand aliases");
	lines.push("// =============================================================================");
	lines.push("");

	// Add shorthand mappings
	for (const [alias, original] of Object.entries(ALIASES)) {
		if (typeof original === "string" && original.includes(":")) {
			const [prop, val] = original.split(":");
			lines.push(`export function ${alias}(value?: string | number): CSSProperties {`);
			lines.push(`	const props: CSSProperties = { ${prop}: "${val}" };`);
			lines.push(`	if (value) Object.assign(props, { gap: toRem(value) });`);
			lines.push(`	return props;`);
			lines.push(`}`);
		} else if (typeof original === "string") {
			const fnName = toCamelCase(original);
			lines.push(`export const ${alias} = ${fnName};`);
		}
	}

	// Write output
	const output = lines.join("\n") + "\n";
	fs.writeFileSync(OUTPUT_FILE, output);
	console.log(`Generated ${OUTPUT_FILE}`);
	console.log(`Run "bun run format" to format the output.`);
}

generate();
