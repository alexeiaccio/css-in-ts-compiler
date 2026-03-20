import { Schema } from "effect";

import { Selector } from "./circular/BuiltinPseudoElement.js";
import { DimensionPercentage_for_Angle } from "./circular/Calc_for_DimensionPercentage_for_Angle.js";
import { DimensionPercentage_for_LengthValue } from "./circular/Calc_for_DimensionPercentage_for_LengthValue.js";
import { Length } from "./circular/Calc_for_Length.js";
import { TokenOrValue, EnvironmentVariable } from "./circular/EnvironmentVariable.js";
import { MediaCondition } from "./circular/MediaCondition.js";
import { ParsedComponent } from "./circular/ParsedComponent.js";
import { SupportsCondition } from "./circular/SupportsCondition.js";

export const AbsoluteFontSizeSchema = Schema.Literals([
	"xx-small",
	"x-small",
	"small",
	"medium",
	"large",
	"x-large",
	"xx-large",
	"xxx-large",
]);
export const AbsoluteFontWeightSchema = Schema.TaggedUnion({ weight: { value: Schema.Number }, normal: {}, bold: {} });
export const BaselinePositionSchema = Schema.Union([Schema.Literal("first"), Schema.Literal("last")]);
export const ContentDistributionSchema = Schema.Union([
	Schema.Literal("space-between"),
	Schema.Literal("space-around"),
	Schema.Literal("space-evenly"),
	Schema.Literal("stretch"),
]);
export const OverflowPositionSchema = Schema.Union([Schema.Literal("safe"), Schema.Literal("unsafe")]);
export const AlignContentSchema = Schema.TaggedUnion({
	normal: {},
	"baseline-position": { value: BaselinePositionSchema },
	"content-distribution": { value: ContentDistributionSchema },
	"content-position": {
		overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])),
		value: Schema.Unknown,
	},
});
export const AlignItemsSchema = Schema.TaggedUnion({
	normal: {},
	stretch: {},
	"baseline-position": { value: BaselinePositionSchema },
	"self-position": {
		overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])),
		value: Schema.Unknown,
	},
});
export const AlignSelfSchema = Schema.TaggedUnion({
	auto: {},
	normal: {},
	stretch: {},
	"baseline-position": { value: BaselinePositionSchema },
	"self-position": {
		overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])),
		value: Schema.Unknown,
	},
});
export const AngleSchema = Schema.TaggedUnion({
	deg: { value: Schema.Number },
	rad: { value: Schema.Number },
	grad: { value: Schema.Number },
	turn: { value: Schema.Number },
});
export const AnimationSchema = Schema.Struct({
	delay: Schema.Unknown,
	direction: Schema.Unknown,
	duration: Schema.Unknown,
	fillMode: Schema.Unknown,
	iterationCount: Schema.Unknown,
	name: Schema.Unknown,
	playState: Schema.Unknown,
	timeline: Schema.Unknown,
	timingFunction: Schema.Unknown,
});
export const AnimationAttachmentRangeSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Struct({
		lengthpercentage: Schema.suspend(
			(): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue,
		),
	}),
	Schema.Struct({ timelinerange: Schema.Struct({ name: Schema.Unknown, offset: Schema.Unknown }) }),
]);
export const AnimationCompositionSchema = Schema.Union([
	Schema.Literal("replace"),
	Schema.Literal("add"),
	Schema.Literal("accumulate"),
]);
export const AnimationDirectionSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Literal("reverse"),
	Schema.Literal("alternate"),
	Schema.Literal("alternate-reverse"),
]);
export const AnimationFillModeSchema = Schema.Union([
	Schema.Literal("none"),
	Schema.Literal("forwards"),
	Schema.Literal("backwards"),
	Schema.Literal("both"),
]);
export const AnimationIterationCountSchema = Schema.TaggedUnion({ number: { value: Schema.Number }, infinite: {} });
export const StringSchema = Schema.String;
export const AnimationNameSchema = Schema.TaggedUnion({
	none: {},
	ident: { value: Schema.String },
	string: { value: Schema.String },
});
export const AnimationPlayStateSchema = Schema.Union([Schema.Literal("running"), Schema.Literal("paused")]);
export const AnimationRangeSchema = Schema.Struct({ end: Schema.Unknown, start: Schema.Unknown });
export const AnimationRangeEndSchema = Schema.Unknown;
export const AnimationRangeStartSchema = Schema.Unknown;
export const ScrollTimelineSchema = Schema.Struct({ axis: Schema.Unknown, scroller: Schema.Unknown });
export const ViewTimelineSchema = Schema.Struct({ axis: Schema.Unknown, inset: Schema.Unknown });
export const AnimationTimelineSchema = Schema.TaggedUnion({
	auto: {},
	none: {},
	"dashed-ident": { value: Schema.String },
	scroll: { value: ScrollTimelineSchema },
	view: { value: ViewTimelineSchema },
});
export const AppearanceSchema = Schema.String;
export const RatioSchema = Schema.Array(Schema.Unknown);
export const AspectRatioSchema = Schema.Struct({
	auto: Schema.Boolean,
	ratio: Schema.optionalKey(Schema.Union([RatioSchema, Schema.Null])),
});
export const AttrSelectorOperatorSchema = Schema.Literals([
	"equal",
	"includes",
	"dash-match",
	"prefix",
	"substring",
	"suffix",
]);
export const AttrOperationSchema = Schema.Struct({
	caseSensitivity: Schema.optionalKey(Schema.Unknown),
	operator: AttrSelectorOperatorSchema,
	value: Schema.String,
});
export const AutoFlowDirectionSchema = Schema.Literals(["row", "column"]);
export const BackfaceVisibilitySchema = Schema.Literals(["visible", "hidden"]);
export const BackgroundSchema = Schema.Struct({
	attachment: Schema.Unknown,
	clip: Schema.Unknown,
	color: Schema.Unknown,
	image: Schema.Unknown,
	origin: Schema.Unknown,
	position: Schema.Unknown,
	repeat: Schema.Unknown,
	size: Schema.Unknown,
});
export const BackgroundAttachmentSchema = Schema.Union([
	Schema.Literal("scroll"),
	Schema.Literal("fixed"),
	Schema.Literal("local"),
]);
export const BackgroundClipSchema = Schema.Union([
	Schema.Literal("border-box"),
	Schema.Literal("padding-box"),
	Schema.Literal("content-box"),
	Schema.Literal("border"),
	Schema.Literal("text"),
]);
export const BackgroundOriginSchema = Schema.Union([
	Schema.Literal("border-box"),
	Schema.Literal("padding-box"),
	Schema.Literal("content-box"),
]);
export const BackgroundPositionSchema = Schema.Struct({ x: Schema.Unknown, y: Schema.Unknown });
export const BackgroundRepeatSchema = Schema.Struct({ x: Schema.Unknown, y: Schema.Unknown });
export const BackgroundRepeatKeywordSchema = Schema.Union([
	Schema.Literal("repeat"),
	Schema.Literal("space"),
	Schema.Literal("round"),
	Schema.Literal("no-repeat"),
]);
export const BackgroundSizeSchema = Schema.TaggedUnion({
	explicit: { height: Schema.Unknown, width: Schema.Unknown },
	cover: {},
	contain: {},
});
export const BasePaletteSchema = Schema.TaggedUnion({ light: {}, dark: {}, integer: { value: Schema.Number } });
export const InsetRectSchema = Schema.Struct({ radius: Schema.Unknown, rect: Schema.Unknown });
export const Circle2Schema = Schema.Struct({ position: Schema.Unknown, radius: Schema.Unknown });
export const Ellipse2Schema = Schema.Struct({
	position: Schema.Unknown,
	radiusX: Schema.Unknown,
	radiusY: Schema.Unknown,
});
export const PointSchema = Schema.Struct({ x: Schema.Unknown, y: Schema.Unknown });
export const PolygonSchema = Schema.Struct({ fillRule: Schema.Unknown, points: Schema.Array(PointSchema) });
export const BasicShapeSchema = Schema.TaggedUnion({
	inset: { value: InsetRectSchema },
	circle: { value: Circle2Schema },
	ellipse: { value: Ellipse2Schema },
	polygon: { value: PolygonSchema },
});
export const BlendModeSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Literal("multiply"),
	Schema.Literal("screen"),
	Schema.Literal("overlay"),
	Schema.Literal("darken"),
	Schema.Literal("lighten"),
	Schema.Literal("color-dodge"),
	Schema.Literal("color-burn"),
	Schema.Literal("hard-light"),
	Schema.Literal("soft-light"),
	Schema.Literal("difference"),
	Schema.Literal("exclusion"),
	Schema.Literal("hue"),
	Schema.Literal("saturation"),
	Schema.Literal("color"),
	Schema.Literal("luminosity"),
	Schema.Literal("plus-darker"),
	Schema.Literal("plus-lighter"),
]);
export const BorderBlockColorSchema = Schema.Struct({ end: Schema.Unknown, start: Schema.Unknown });
export const BorderBlockStyleSchema = Schema.Struct({ end: Schema.Unknown, start: Schema.Unknown });
export const BorderBlockWidthSchema = Schema.Struct({ end: Schema.Unknown, start: Schema.Unknown });
export const BorderColorSchema = Schema.Struct({
	bottom: Schema.Unknown,
	left: Schema.Unknown,
	right: Schema.Unknown,
	top: Schema.Unknown,
});
export const BorderImageSchema = Schema.Struct({
	outset: Schema.Unknown,
	repeat: Schema.Unknown,
	slice: Schema.Unknown,
	source: Schema.Unknown,
	width: Schema.Unknown,
});
export const BorderImageRepeatSchema = Schema.Struct({ horizontal: Schema.Unknown, vertical: Schema.Unknown });
export const BorderImageRepeatKeywordSchema = Schema.Union([
	Schema.Literal("stretch"),
	Schema.Literal("repeat"),
	Schema.Literal("round"),
	Schema.Literal("space"),
]);
export const BorderImageSideWidthSchema = Schema.TaggedUnion({
	number: { value: Schema.Number },
	"length-percentage": {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	auto: {},
});
export const BorderImageSliceSchema = Schema.Struct({ fill: Schema.Boolean, offsets: Schema.Unknown });
export const BorderInlineColorSchema = Schema.Struct({ end: Schema.Unknown, start: Schema.Unknown });
export const BorderInlineStyleSchema = Schema.Struct({ end: Schema.Unknown, start: Schema.Unknown });
export const BorderInlineWidthSchema = Schema.Struct({ end: Schema.Unknown, start: Schema.Unknown });
export const BorderRadiusSchema = Schema.Struct({
	bottomLeft: Schema.Unknown,
	bottomRight: Schema.Unknown,
	topLeft: Schema.Unknown,
	topRight: Schema.Unknown,
});
export const BorderSideWidthSchema = Schema.TaggedUnion({
	thin: {},
	medium: {},
	thick: {},
	length: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
});
export const BorderStyleSchema = Schema.Struct({
	bottom: Schema.Unknown,
	left: Schema.Unknown,
	right: Schema.Unknown,
	top: Schema.Unknown,
});
export const BorderWidthSchema = Schema.Struct({
	bottom: Schema.Unknown,
	left: Schema.Unknown,
	right: Schema.Unknown,
	top: Schema.Unknown,
});
export const BoxAlignSchema = Schema.Union([
	Schema.Literal("start"),
	Schema.Literal("end"),
	Schema.Literal("center"),
	Schema.Literal("baseline"),
	Schema.Literal("stretch"),
]);
export const BoxDecorationBreakSchema = Schema.Union([Schema.Literal("slice"), Schema.Literal("clone")]);
export const BoxDirectionSchema = Schema.Union([Schema.Literal("normal"), Schema.Literal("reverse")]);
export const BoxLinesSchema = Schema.Union([Schema.Literal("single"), Schema.Literal("multiple")]);
export const BoxOrientSchema = Schema.Union([
	Schema.Literal("horizontal"),
	Schema.Literal("vertical"),
	Schema.Literal("inline-axis"),
	Schema.Literal("block-axis"),
]);
export const BoxPackSchema = Schema.Union([
	Schema.Literal("start"),
	Schema.Literal("end"),
	Schema.Literal("center"),
	Schema.Literal("justify"),
]);
export const BoxShadowSchema = Schema.Struct({
	blur: Schema.Unknown,
	color: Schema.Unknown,
	inset: Schema.Boolean,
	spread: Schema.Unknown,
	xOffset: Schema.Unknown,
	yOffset: Schema.Unknown,
});
export const BoxSizingSchema = Schema.Union([Schema.Literal("content-box"), Schema.Literal("border-box")]);
export const CSSWideKeywordSchema = Schema.Union([
	Schema.Literal("initial"),
	Schema.Literal("inherit"),
	Schema.Literal("unset"),
	Schema.Literal("revert"),
	Schema.Literal("revert-layer"),
]);
export const CaretSchema = Schema.Struct({ color: Schema.Unknown, shape: Schema.Unknown });
export const CaretShapeSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("bar"),
	Schema.Literal("block"),
	Schema.Literal("underscore"),
]);
export const ShapeExtentSchema = Schema.Union([
	Schema.Literal("closest-side"),
	Schema.Literal("farthest-side"),
	Schema.Literal("closest-corner"),
	Schema.Literal("farthest-corner"),
]);
export const CircleSchema = Schema.TaggedUnion({
	radius: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
	extent: { value: ShapeExtentSchema },
});
export const UrlSchema = Schema.Struct({ loc: Schema.Unknown, url: Schema.Unknown });
export const GeometryBoxSchema = Schema.Union([
	Schema.Literal("border-box"),
	Schema.Literal("padding-box"),
	Schema.Literal("content-box"),
	Schema.Literal("margin-box"),
	Schema.Literal("fill-box"),
	Schema.Literal("stroke-box"),
	Schema.Literal("view-box"),
]);
export const ClipPathSchema = Schema.TaggedUnion({
	none: {},
	url: { value: UrlSchema },
	shape: { referenceBox: Schema.Unknown, shape: Schema.Unknown },
	box: { value: GeometryBoxSchema },
});
export const ColorInterpolationSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("srgb"),
	Schema.Literal("linearrgb"),
]);
export const CssColorSchema = Schema.Union([
	Schema.Unknown,
	Schema.Unknown,
	Schema.Unknown,
	Schema.Unknown,
	Schema.Unknown,
	Schema.Unknown,
	Schema.Unknown,
]);
export const ColorOrAutoSchema = Schema.TaggedUnion({ auto: {}, color: { value: CssColorSchema } });
export const ColorRenderingSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("optimizespeed"),
	Schema.Literal("optimizequality"),
]);
export const ColorSchemeSchema = Schema.Struct({ dark: Schema.Boolean, light: Schema.Boolean, only: Schema.Boolean });
export const CombinatorSchema = Schema.Union([
	Schema.Literals(["child", "descendant", "next-sibling", "later-sibling"]),
	Schema.Literal("pseudo-element"),
	Schema.Literal("slot-assignment"),
	Schema.Literal("part"),
	Schema.Literal("deep-descendant"),
	Schema.Literal("deep"),
]);
export const SpecifierSchema = Schema.TaggedUnion({
	global: {},
	file: { value: Schema.String },
	"source-index": { value: Schema.Number },
});
export const ComposesSchema = Schema.Struct({
	from: Schema.optionalKey(Schema.Union([SpecifierSchema, Schema.Null])),
	loc: Schema.Unknown,
	names: Schema.Array(Schema.String),
});
export const ContainerSchema = Schema.Struct({ containerType: Schema.Unknown, name: Schema.Unknown });
export const ContainerNameListSchema = Schema.TaggedUnion({ none: {}, names: { value: Schema.Array(Schema.String) } });
export const ContainerSizeFeatureIdSchema = Schema.Union([
	Schema.Literal("width"),
	Schema.Literal("height"),
	Schema.Literal("inline-size"),
	Schema.Literal("block-size"),
	Schema.Literal("aspect-ratio"),
	Schema.Literal("orientation"),
]);
export const ContainerTypeSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Literal("inline-size"),
	Schema.Literal("size"),
	Schema.Literal("scroll-state"),
]);
export const ContentPositionSchema = Schema.Union([
	Schema.Literal("center"),
	Schema.Literal("start"),
	Schema.Literal("end"),
	Schema.Literal("flex-start"),
	Schema.Literal("flex-end"),
]);
export const PredefinedCounterStyleSchema = Schema.Literals([
	"decimal",
	"decimal-leading-zero",
	"arabic-indic",
	"armenian",
	"upper-armenian",
	"lower-armenian",
	"bengali",
	"cambodian",
	"khmer",
	"cjk-decimal",
	"devanagari",
	"georgian",
	"gujarati",
	"gurmukhi",
	"hebrew",
	"kannada",
	"lao",
	"malayalam",
	"mongolian",
	"myanmar",
	"oriya",
	"persian",
	"lower-roman",
	"upper-roman",
	"tamil",
	"telugu",
	"thai",
	"tibetan",
	"lower-alpha",
	"lower-latin",
	"upper-alpha",
	"upper-latin",
	"lower-greek",
	"hiragana",
	"hiragana-iroha",
	"katakana",
	"katakana-iroha",
	"disc",
	"circle",
	"square",
	"disclosure-open",
	"disclosure-closed",
	"cjk-earthly-branch",
	"cjk-heavenly-stem",
	"japanese-informal",
	"japanese-formal",
	"korean-hangul-formal",
	"korean-hanja-informal",
	"korean-hanja-formal",
	"simp-chinese-informal",
	"simp-chinese-formal",
	"trad-chinese-informal",
	"trad-chinese-formal",
	"ethiopic-numeric",
]);
export const GradientItem_for_DimensionPercentage_for_LengthValueSchema = Schema.TaggedUnion({
	"color-stop": {
		color: Schema.Unknown,
		position: Schema.optionalKey(
			Schema.Union([
				Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
				Schema.Null,
			]),
		),
	},
	hint: {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
});
export const GradientItem_for_DimensionPercentage_for_AngleSchema = Schema.TaggedUnion({
	"color-stop": {
		color: Schema.Unknown,
		position: Schema.optionalKey(
			Schema.Union([
				Schema.suspend((): Schema.Codec<DimensionPercentage_for_Angle> => DimensionPercentage_for_Angle),
				Schema.Null,
			]),
		),
	},
	hint: { value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_Angle> => DimensionPercentage_for_Angle) },
});
export const WebKitColorStopSchema = Schema.Struct({ color: Schema.Unknown, position: Schema.Number });
export const GradientSchema = Schema.TaggedUnion({
	linear: {
		direction: Schema.Unknown,
		items: Schema.Array(GradientItem_for_DimensionPercentage_for_LengthValueSchema),
		vendorPrefix: Schema.Unknown,
	},
	"repeating-linear": {
		direction: Schema.Unknown,
		items: Schema.Array(GradientItem_for_DimensionPercentage_for_LengthValueSchema),
		vendorPrefix: Schema.Unknown,
	},
	radial: {
		items: Schema.Array(GradientItem_for_DimensionPercentage_for_LengthValueSchema),
		position: Schema.Unknown,
		shape: Schema.Unknown,
		vendorPrefix: Schema.Unknown,
	},
	"repeating-radial": {
		items: Schema.Array(GradientItem_for_DimensionPercentage_for_LengthValueSchema),
		position: Schema.Unknown,
		shape: Schema.Unknown,
		vendorPrefix: Schema.Unknown,
	},
	conic: {
		angle: Schema.Unknown,
		items: Schema.Array(GradientItem_for_DimensionPercentage_for_AngleSchema),
		position: Schema.Unknown,
	},
	"repeating-conic": {
		angle: Schema.Unknown,
		items: Schema.Array(GradientItem_for_DimensionPercentage_for_AngleSchema),
		position: Schema.Unknown,
	},
	"webkit-gradient": {},
});
export const ImageSetOptionSchema = Schema.Struct({
	fileType: Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])),
	image: Schema.Unknown,
	resolution: Schema.Unknown,
});
export const ImageSetSchema = Schema.Struct({
	options: Schema.Array(ImageSetOptionSchema),
	vendorPrefix: Schema.Unknown,
});
export const ImageSchema = Schema.TaggedUnion({
	none: {},
	url: { value: UrlSchema },
	gradient: { value: GradientSchema },
	"image-set": { value: ImageSetSchema },
});
export const SymbolSchema = Schema.TaggedUnion({ string: { value: Schema.String }, image: { value: ImageSchema } });
export const CounterStyleSchema = Schema.TaggedUnion({
	predefined: { value: PredefinedCounterStyleSchema },
	name: { value: Schema.String },
	symbols: { symbols: Schema.Array(SymbolSchema), system: Schema.optionalKey(Schema.Unknown) },
});
export const CounterStyleRuleSchema = Schema.Struct({
	declarations: Schema.Unknown,
	loc: Schema.Unknown,
	name: Schema.Unknown,
});
export const CurrentColorSchema = Schema.TaggedUnion({ currentcolor: {} });
export const CursorImageSchema = Schema.Struct({
	hotspot: Schema.optionalKey(Schema.NullOr(Schema.Array(Schema.Unknown))),
	url: Schema.Unknown,
});
export const CursorSchema = Schema.Struct({ images: Schema.Array(CursorImageSchema), keyword: Schema.Unknown });
export const CursorKeywordSchema = Schema.Literals([
	"auto",
	"default",
	"none",
	"context-menu",
	"help",
	"pointer",
	"progress",
	"wait",
	"cell",
	"crosshair",
	"text",
	"vertical-text",
	"alias",
	"copy",
	"move",
	"no-drop",
	"not-allowed",
	"grab",
	"grabbing",
	"e-resize",
	"n-resize",
	"ne-resize",
	"nw-resize",
	"s-resize",
	"se-resize",
	"sw-resize",
	"w-resize",
	"ew-resize",
	"ns-resize",
	"nesw-resize",
	"nwse-resize",
	"col-resize",
	"row-resize",
	"all-scroll",
	"zoom-in",
	"zoom-out",
]);
export const CustomMediaRuleSchema = Schema.Struct({
	loc: Schema.Unknown,
	name: Schema.Unknown,
	query: Schema.Unknown,
});
export const CustomPropertySchema = Schema.Struct({
	name: Schema.Unknown,
	value: Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue)),
});
export const CustomPropertyNameSchema = Schema.Union([Schema.Unknown, Schema.Unknown]);
export const DashedIdentReferenceSchema = Schema.Struct({
	from: Schema.optionalKey(Schema.Union([SpecifierSchema, Schema.Null])),
	ident: Schema.Unknown,
});
export const PositionComponent_for_HorizontalPositionKeywordSchema = Schema.TaggedUnion({
	center: {},
	length: {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	side: {
		offset: Schema.optionalKey(
			Schema.Union([
				Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
				Schema.Null,
			]),
		),
		side: Schema.Unknown,
	},
});
export const PositionComponent_for_VerticalPositionKeywordSchema = Schema.TaggedUnion({
	center: {},
	length: {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	side: {
		offset: Schema.optionalKey(
			Schema.Union([
				Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
				Schema.Null,
			]),
		),
		side: Schema.Unknown,
	},
});
export const PrefixSchema = Schema.Literals(["none", "webkit", "moz", "ms", "o"]);
export const VendorPrefixSchema = Schema.Array(PrefixSchema);
export const DisplayKeywordSchema = Schema.Literals([
	"none",
	"contents",
	"table-row-group",
	"table-header-group",
	"table-footer-group",
	"table-row",
	"table-cell",
	"table-column-group",
	"table-column",
	"table-caption",
	"ruby-base",
	"ruby-text",
	"ruby-base-container",
	"ruby-text-container",
]);
export const DisplaySchema = Schema.TaggedUnion({
	keyword: { value: DisplayKeywordSchema },
	pair: { inside: Schema.Unknown, isListItem: Schema.Boolean, outside: Schema.Unknown },
});
export const VisibilitySchema = Schema.Union([
	Schema.Literal("visible"),
	Schema.Literal("hidden"),
	Schema.Literal("collapse"),
]);
export const SizeSchema = Schema.TaggedUnion({
	auto: {},
	"length-percentage": {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	"min-content": { vendorPrefix: VendorPrefixSchema },
	"max-content": { vendorPrefix: VendorPrefixSchema },
	"fit-content": { vendorPrefix: VendorPrefixSchema },
	"fit-content-function": {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	stretch: { vendorPrefix: VendorPrefixSchema },
	contain: {},
});
export const MaxSizeSchema = Schema.TaggedUnion({
	none: {},
	"length-percentage": {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	"min-content": { vendorPrefix: VendorPrefixSchema },
	"max-content": { vendorPrefix: VendorPrefixSchema },
	"fit-content": { vendorPrefix: VendorPrefixSchema },
	"fit-content-function": {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	stretch: { vendorPrefix: VendorPrefixSchema },
	contain: {},
});
export const OverflowSchema = Schema.Struct({ x: Schema.Unknown, y: Schema.Unknown });
export const OverflowKeywordSchema = Schema.Union([
	Schema.Literal("visible"),
	Schema.Literal("hidden"),
	Schema.Literal("clip"),
	Schema.Literal("scroll"),
	Schema.Literal("auto"),
]);
export const TextOverflowSchema = Schema.Union([Schema.Literal("clip"), Schema.Literal("ellipsis")]);
export const Position2Schema = Schema.TaggedUnion({
	static: {},
	relative: {},
	absolute: {},
	sticky: { value: VendorPrefixSchema },
	fixed: {},
});
export const LengthPercentageOrAutoSchema = Schema.TaggedUnion({
	auto: {},
	"length-percentage": {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
});
export const InsetBlockSchema = Schema.Struct({ blockEnd: Schema.Unknown, blockStart: Schema.Unknown });
export const InsetInlineSchema = Schema.Struct({ inlineEnd: Schema.Unknown, inlineStart: Schema.Unknown });
export const InsetSchema = Schema.Struct({
	bottom: Schema.Unknown,
	left: Schema.Unknown,
	right: Schema.Unknown,
	top: Schema.Unknown,
});
export const Size2D_for_LengthSchema = Schema.Array(Schema.Unknown);
export const LineStyleSchema = Schema.Union([
	Schema.Literal("none"),
	Schema.Literal("hidden"),
	Schema.Literal("inset"),
	Schema.Literal("groove"),
	Schema.Literal("outset"),
	Schema.Literal("ridge"),
	Schema.Literal("dotted"),
	Schema.Literal("dashed"),
	Schema.Literal("solid"),
	Schema.Literal("double"),
]);
export const Size2D_for_DimensionPercentage_for_LengthValueSchema = Schema.Array(Schema.Unknown);
export const Rect_for_LengthOrNumberSchema = Schema.Array(Schema.Unknown);
export const Rect_for_BorderImageSideWidthSchema = Schema.Array(Schema.Unknown);
export const GenericBorder_for_LineStyle_and_10Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_LineStyle_and_0Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_LineStyle_and_2Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_LineStyle_and_3Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_LineStyle_and_1Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_LineStyle_and_8Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_LineStyle_and_4Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_LineStyle_and_5Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_LineStyle_and_9Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_LineStyle_and_6Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_LineStyle_and_7Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const GenericBorder_for_OutlineStyle_and_11Schema = Schema.Struct({
	color: Schema.Unknown,
	style: Schema.Unknown,
	width: Schema.Unknown,
});
export const OutlineStyleSchema = Schema.TaggedUnion({ auto: {}, "line-style": { value: LineStyleSchema } });
export const FlexDirectionSchema = Schema.Union([
	Schema.Literal("row"),
	Schema.Literal("row-reverse"),
	Schema.Literal("column"),
	Schema.Literal("column-reverse"),
]);
export const FlexWrapSchema = Schema.Union([
	Schema.Literal("nowrap"),
	Schema.Literal("wrap"),
	Schema.Literal("wrap-reverse"),
]);
export const FlexFlowSchema = Schema.Struct({ direction: Schema.Unknown, wrap: Schema.Unknown });
export const FlexSchema = Schema.Struct({ basis: Schema.Unknown, grow: Schema.Number, shrink: Schema.Number });
export const JustifyContentSchema = Schema.TaggedUnion({
	normal: {},
	"content-distribution": { value: ContentDistributionSchema },
	"content-position": {
		overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])),
		value: Schema.Unknown,
	},
	left: { overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])) },
	right: { overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])) },
});
export const PlaceContentSchema = Schema.Struct({ align: Schema.Unknown, justify: Schema.Unknown });
export const JustifySelfSchema = Schema.TaggedUnion({
	auto: {},
	normal: {},
	stretch: {},
	"baseline-position": { value: BaselinePositionSchema },
	"self-position": {
		overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])),
		value: Schema.Unknown,
	},
	left: { overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])) },
	right: { overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])) },
});
export const PlaceSelfSchema = Schema.Struct({ align: Schema.Unknown, justify: Schema.Unknown });
export const LegacyJustifySchema = Schema.Union([
	Schema.Literal("left"),
	Schema.Literal("right"),
	Schema.Literal("center"),
]);
export const JustifyItemsSchema = Schema.TaggedUnion({
	normal: {},
	stretch: {},
	"baseline-position": { value: BaselinePositionSchema },
	"self-position": {
		overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])),
		value: Schema.Unknown,
	},
	left: { overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])) },
	right: { overflow: Schema.optionalKey(Schema.Union([OverflowPositionSchema, Schema.Null])) },
	legacy: { value: LegacyJustifySchema },
});
export const PlaceItemsSchema = Schema.Struct({ align: Schema.Unknown, justify: Schema.Unknown });
export const GapValueSchema = Schema.TaggedUnion({
	normal: {},
	"length-percentage": {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
});
export const GapSchema = Schema.Struct({ column: Schema.Unknown, row: Schema.Unknown });
export const FlexPackSchema = Schema.Union([
	Schema.Literal("start"),
	Schema.Literal("end"),
	Schema.Literal("center"),
	Schema.Literal("justify"),
	Schema.Literal("distribute"),
]);
export const FlexItemAlignSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("start"),
	Schema.Literal("end"),
	Schema.Literal("center"),
	Schema.Literal("baseline"),
	Schema.Literal("stretch"),
]);
export const FlexLinePackSchema = Schema.Union([
	Schema.Literal("start"),
	Schema.Literal("end"),
	Schema.Literal("center"),
	Schema.Literal("justify"),
	Schema.Literal("distribute"),
	Schema.Literal("stretch"),
]);
export const TrackBreadthSchema = Schema.TaggedUnion({
	length: {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	flex: { value: Schema.Number },
	"min-content": {},
	"max-content": {},
	auto: {},
});
export const TrackSizeSchema = Schema.TaggedUnion({
	"track-breadth": { value: TrackBreadthSchema },
	"min-max": { max: Schema.Unknown, min: Schema.Unknown },
	"fit-content": {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
});
export const TrackRepeatSchema = Schema.Struct({
	count: Schema.Unknown,
	lineNames: Schema.Array(Schema.Array(Schema.String)),
	trackSizes: Schema.Array(TrackSizeSchema),
});
export const TrackListItemSchema = Schema.TaggedUnion({
	"track-size": { value: TrackSizeSchema },
	"track-repeat": { value: TrackRepeatSchema },
});
export const TrackSizingSchema = Schema.TaggedUnion({
	none: {},
	"track-list": { items: Schema.Array(TrackListItemSchema), lineNames: Schema.Array(Schema.Array(Schema.String)) },
});
export const GridAutoFlowSchema = Schema.Struct({ dense: Schema.Boolean, direction: Schema.Unknown });
export const GridTemplateAreasSchema = Schema.TaggedUnion({
	none: {},
	areas: { areas: Schema.Array(Schema.NullOr(Schema.String)), columns: Schema.Number },
});
export const GridTemplateSchema = Schema.Struct({
	areas: Schema.Unknown,
	columns: Schema.Unknown,
	rows: Schema.Unknown,
});
export const GridSchema = Schema.Struct({
	areas: Schema.Unknown,
	autoColumns: Schema.Array(TrackSizeSchema),
	autoFlow: Schema.Unknown,
	autoRows: Schema.Array(TrackSizeSchema),
	columns: Schema.Unknown,
	rows: Schema.Unknown,
});
export const GridLineSchema = Schema.TaggedUnion({
	auto: {},
	area: { name: Schema.Unknown },
	line: { index: Schema.Number, name: Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])) },
	span: { index: Schema.Number, name: Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])) },
});
export const GridRowSchema = Schema.Struct({ end: Schema.Unknown, start: Schema.Unknown });
export const GridColumnSchema = Schema.Struct({ end: Schema.Unknown, start: Schema.Unknown });
export const GridAreaSchema = Schema.Struct({
	columnEnd: Schema.Unknown,
	columnStart: Schema.Unknown,
	rowEnd: Schema.Unknown,
	rowStart: Schema.Unknown,
});
export const MarginBlockSchema = Schema.Struct({ blockEnd: Schema.Unknown, blockStart: Schema.Unknown });
export const MarginInlineSchema = Schema.Struct({ inlineEnd: Schema.Unknown, inlineStart: Schema.Unknown });
export const MarginSchema = Schema.Struct({
	bottom: Schema.Unknown,
	left: Schema.Unknown,
	right: Schema.Unknown,
	top: Schema.Unknown,
});
export const PaddingBlockSchema = Schema.Struct({ blockEnd: Schema.Unknown, blockStart: Schema.Unknown });
export const PaddingInlineSchema = Schema.Struct({ inlineEnd: Schema.Unknown, inlineStart: Schema.Unknown });
export const PaddingSchema = Schema.Struct({
	bottom: Schema.Unknown,
	left: Schema.Unknown,
	right: Schema.Unknown,
	top: Schema.Unknown,
});
export const ScrollMarginBlockSchema = Schema.Struct({ blockEnd: Schema.Unknown, blockStart: Schema.Unknown });
export const ScrollMarginInlineSchema = Schema.Struct({ inlineEnd: Schema.Unknown, inlineStart: Schema.Unknown });
export const ScrollMarginSchema = Schema.Struct({
	bottom: Schema.Unknown,
	left: Schema.Unknown,
	right: Schema.Unknown,
	top: Schema.Unknown,
});
export const ScrollPaddingBlockSchema = Schema.Struct({ blockEnd: Schema.Unknown, blockStart: Schema.Unknown });
export const ScrollPaddingInlineSchema = Schema.Struct({ inlineEnd: Schema.Unknown, inlineStart: Schema.Unknown });
export const ScrollPaddingSchema = Schema.Struct({
	bottom: Schema.Unknown,
	left: Schema.Unknown,
	right: Schema.Unknown,
	top: Schema.Unknown,
});
export const FontWeightSchema = Schema.TaggedUnion({
	absolute: { value: AbsoluteFontWeightSchema },
	bolder: {},
	lighter: {},
});
export const RelativeFontSizeSchema = Schema.Literals(["smaller", "larger"]);
export const FontSizeSchema = Schema.TaggedUnion({
	length: {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	absolute: { value: AbsoluteFontSizeSchema },
	relative: { value: RelativeFontSizeSchema },
});
export const FontStretchKeywordSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Literal("ultra-condensed"),
	Schema.Literal("extra-condensed"),
	Schema.Literal("condensed"),
	Schema.Literal("semi-condensed"),
	Schema.Literal("semi-expanded"),
	Schema.Literal("expanded"),
	Schema.Literal("extra-expanded"),
	Schema.Literal("ultra-expanded"),
]);
export const FontStretchSchema = Schema.TaggedUnion({
	keyword: { value: FontStretchKeywordSchema },
	percentage: { value: Schema.Number },
});
export const FontFamilySchema = Schema.Union([Schema.Unknown, Schema.Unknown]);
export const FontStyleSchema = Schema.TaggedUnion({ normal: {}, italic: {}, oblique: { value: AngleSchema } });
export const FontVariantCapsSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Literal("small-caps"),
	Schema.Literal("all-small-caps"),
	Schema.Literal("petite-caps"),
	Schema.Literal("all-petite-caps"),
	Schema.Literal("unicase"),
	Schema.Literal("titling-caps"),
]);
export const LineHeightSchema = Schema.TaggedUnion({
	normal: {},
	number: { value: Schema.Number },
	length: {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
});
export const FontSchema = Schema.Struct({
	family: Schema.Array(FontFamilySchema),
	lineHeight: Schema.Unknown,
	size: Schema.Unknown,
	stretch: Schema.Unknown,
	style: Schema.Unknown,
	variantCaps: Schema.Unknown,
	weight: Schema.Unknown,
});
export const VerticalAlignKeywordSchema = Schema.Union([
	Schema.Literal("baseline"),
	Schema.Literal("sub"),
	Schema.Literal("super"),
	Schema.Literal("top"),
	Schema.Literal("text-top"),
	Schema.Literal("middle"),
	Schema.Literal("bottom"),
	Schema.Literal("text-bottom"),
]);
export const VerticalAlignSchema = Schema.TaggedUnion({
	keyword: { value: VerticalAlignKeywordSchema },
	length: {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
});
export const PropertyIdSchema = Schema.Union([
	Schema.Struct({ property: Schema.Literal("background-color") }),
	Schema.Struct({ property: Schema.Literal("background-image") }),
	Schema.Struct({ property: Schema.Literal("background-position-x") }),
	Schema.Struct({ property: Schema.Literal("background-position-y") }),
	Schema.Struct({ property: Schema.Literal("background-position") }),
	Schema.Struct({ property: Schema.Literal("background-size") }),
	Schema.Struct({ property: Schema.Literal("background-repeat") }),
	Schema.Struct({ property: Schema.Literal("background-attachment") }),
	Schema.Struct({ property: Schema.Literal("background-clip"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("background-origin") }),
	Schema.Struct({ property: Schema.Literal("background") }),
	Schema.Struct({ property: Schema.Literal("box-shadow"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("opacity") }),
	Schema.Struct({ property: Schema.Literal("color") }),
	Schema.Struct({ property: Schema.Literal("display") }),
	Schema.Struct({ property: Schema.Literal("visibility") }),
	Schema.Struct({ property: Schema.Literal("width") }),
	Schema.Struct({ property: Schema.Literal("height") }),
	Schema.Struct({ property: Schema.Literal("min-width") }),
	Schema.Struct({ property: Schema.Literal("min-height") }),
	Schema.Struct({ property: Schema.Literal("max-width") }),
	Schema.Struct({ property: Schema.Literal("max-height") }),
	Schema.Struct({ property: Schema.Literal("block-size") }),
	Schema.Struct({ property: Schema.Literal("inline-size") }),
	Schema.Struct({ property: Schema.Literal("min-block-size") }),
	Schema.Struct({ property: Schema.Literal("min-inline-size") }),
	Schema.Struct({ property: Schema.Literal("max-block-size") }),
	Schema.Struct({ property: Schema.Literal("max-inline-size") }),
	Schema.Struct({ property: Schema.Literal("box-sizing"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("aspect-ratio") }),
	Schema.Struct({ property: Schema.Literal("overflow") }),
	Schema.Struct({ property: Schema.Literal("overflow-x") }),
	Schema.Struct({ property: Schema.Literal("overflow-y") }),
	Schema.Struct({ property: Schema.Literal("text-overflow"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("position") }),
	Schema.Struct({ property: Schema.Literal("top") }),
	Schema.Struct({ property: Schema.Literal("bottom") }),
	Schema.Struct({ property: Schema.Literal("left") }),
	Schema.Struct({ property: Schema.Literal("right") }),
	Schema.Struct({ property: Schema.Literal("inset-block-start") }),
	Schema.Struct({ property: Schema.Literal("inset-block-end") }),
	Schema.Struct({ property: Schema.Literal("inset-inline-start") }),
	Schema.Struct({ property: Schema.Literal("inset-inline-end") }),
	Schema.Struct({ property: Schema.Literal("inset-block") }),
	Schema.Struct({ property: Schema.Literal("inset-inline") }),
	Schema.Struct({ property: Schema.Literal("inset") }),
	Schema.Struct({ property: Schema.Literal("border-spacing") }),
	Schema.Struct({ property: Schema.Literal("border-top-color") }),
	Schema.Struct({ property: Schema.Literal("border-bottom-color") }),
	Schema.Struct({ property: Schema.Literal("border-left-color") }),
	Schema.Struct({ property: Schema.Literal("border-right-color") }),
	Schema.Struct({ property: Schema.Literal("border-block-start-color") }),
	Schema.Struct({ property: Schema.Literal("border-block-end-color") }),
	Schema.Struct({ property: Schema.Literal("border-inline-start-color") }),
	Schema.Struct({ property: Schema.Literal("border-inline-end-color") }),
	Schema.Struct({ property: Schema.Literal("border-top-style") }),
	Schema.Struct({ property: Schema.Literal("border-bottom-style") }),
	Schema.Struct({ property: Schema.Literal("border-left-style") }),
	Schema.Struct({ property: Schema.Literal("border-right-style") }),
	Schema.Struct({ property: Schema.Literal("border-block-start-style") }),
	Schema.Struct({ property: Schema.Literal("border-block-end-style") }),
	Schema.Struct({ property: Schema.Literal("border-inline-start-style") }),
	Schema.Struct({ property: Schema.Literal("border-inline-end-style") }),
	Schema.Struct({ property: Schema.Literal("border-top-width") }),
	Schema.Struct({ property: Schema.Literal("border-bottom-width") }),
	Schema.Struct({ property: Schema.Literal("border-left-width") }),
	Schema.Struct({ property: Schema.Literal("border-right-width") }),
	Schema.Struct({ property: Schema.Literal("border-block-start-width") }),
	Schema.Struct({ property: Schema.Literal("border-block-end-width") }),
	Schema.Struct({ property: Schema.Literal("border-inline-start-width") }),
	Schema.Struct({ property: Schema.Literal("border-inline-end-width") }),
	Schema.Struct({ property: Schema.Literal("border-top-left-radius"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("border-top-right-radius"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("border-bottom-left-radius"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("border-bottom-right-radius"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("border-start-start-radius") }),
	Schema.Struct({ property: Schema.Literal("border-start-end-radius") }),
	Schema.Struct({ property: Schema.Literal("border-end-start-radius") }),
	Schema.Struct({ property: Schema.Literal("border-end-end-radius") }),
	Schema.Struct({ property: Schema.Literal("border-radius"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("border-image-source") }),
	Schema.Struct({ property: Schema.Literal("border-image-outset") }),
	Schema.Struct({ property: Schema.Literal("border-image-repeat") }),
	Schema.Struct({ property: Schema.Literal("border-image-width") }),
	Schema.Struct({ property: Schema.Literal("border-image-slice") }),
	Schema.Struct({ property: Schema.Literal("border-image"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("border-color") }),
	Schema.Struct({ property: Schema.Literal("border-style") }),
	Schema.Struct({ property: Schema.Literal("border-width") }),
	Schema.Struct({ property: Schema.Literal("border-block-color") }),
	Schema.Struct({ property: Schema.Literal("border-block-style") }),
	Schema.Struct({ property: Schema.Literal("border-block-width") }),
	Schema.Struct({ property: Schema.Literal("border-inline-color") }),
	Schema.Struct({ property: Schema.Literal("border-inline-style") }),
	Schema.Struct({ property: Schema.Literal("border-inline-width") }),
	Schema.Struct({ property: Schema.Literal("border") }),
	Schema.Struct({ property: Schema.Literal("border-top") }),
	Schema.Struct({ property: Schema.Literal("border-bottom") }),
	Schema.Struct({ property: Schema.Literal("border-left") }),
	Schema.Struct({ property: Schema.Literal("border-right") }),
	Schema.Struct({ property: Schema.Literal("border-block") }),
	Schema.Struct({ property: Schema.Literal("border-block-start") }),
	Schema.Struct({ property: Schema.Literal("border-block-end") }),
	Schema.Struct({ property: Schema.Literal("border-inline") }),
	Schema.Struct({ property: Schema.Literal("border-inline-start") }),
	Schema.Struct({ property: Schema.Literal("border-inline-end") }),
	Schema.Struct({ property: Schema.Literal("outline") }),
	Schema.Struct({ property: Schema.Literal("outline-color") }),
	Schema.Struct({ property: Schema.Literal("outline-style") }),
	Schema.Struct({ property: Schema.Literal("outline-width") }),
	Schema.Struct({ property: Schema.Literal("flex-direction"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-wrap"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-flow"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-grow"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-shrink"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-basis"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("order"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("align-content"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("justify-content"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("place-content") }),
	Schema.Struct({ property: Schema.Literal("align-self"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("justify-self") }),
	Schema.Struct({ property: Schema.Literal("place-self") }),
	Schema.Struct({ property: Schema.Literal("align-items"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("justify-items") }),
	Schema.Struct({ property: Schema.Literal("place-items") }),
	Schema.Struct({ property: Schema.Literal("row-gap") }),
	Schema.Struct({ property: Schema.Literal("column-gap") }),
	Schema.Struct({ property: Schema.Literal("gap") }),
	Schema.Struct({ property: Schema.Literal("box-orient"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-direction"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-ordinal-group"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-align"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-flex"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-flex-group"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-pack"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-lines"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-pack"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-order"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-align"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-item-align"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-line-pack"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-positive"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-negative"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-preferred-size"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("grid-template-columns") }),
	Schema.Struct({ property: Schema.Literal("grid-template-rows") }),
	Schema.Struct({ property: Schema.Literal("grid-auto-columns") }),
	Schema.Struct({ property: Schema.Literal("grid-auto-rows") }),
	Schema.Struct({ property: Schema.Literal("grid-auto-flow") }),
	Schema.Struct({ property: Schema.Literal("grid-template-areas") }),
	Schema.Struct({ property: Schema.Literal("grid-template") }),
	Schema.Struct({ property: Schema.Literal("grid") }),
	Schema.Struct({ property: Schema.Literal("grid-row-start") }),
	Schema.Struct({ property: Schema.Literal("grid-row-end") }),
	Schema.Struct({ property: Schema.Literal("grid-column-start") }),
	Schema.Struct({ property: Schema.Literal("grid-column-end") }),
	Schema.Struct({ property: Schema.Literal("grid-row") }),
	Schema.Struct({ property: Schema.Literal("grid-column") }),
	Schema.Struct({ property: Schema.Literal("grid-area") }),
	Schema.Struct({ property: Schema.Literal("margin-top") }),
	Schema.Struct({ property: Schema.Literal("margin-bottom") }),
	Schema.Struct({ property: Schema.Literal("margin-left") }),
	Schema.Struct({ property: Schema.Literal("margin-right") }),
	Schema.Struct({ property: Schema.Literal("margin-block-start") }),
	Schema.Struct({ property: Schema.Literal("margin-block-end") }),
	Schema.Struct({ property: Schema.Literal("margin-inline-start") }),
	Schema.Struct({ property: Schema.Literal("margin-inline-end") }),
	Schema.Struct({ property: Schema.Literal("margin-block") }),
	Schema.Struct({ property: Schema.Literal("margin-inline") }),
	Schema.Struct({ property: Schema.Literal("margin") }),
	Schema.Struct({ property: Schema.Literal("padding-top") }),
	Schema.Struct({ property: Schema.Literal("padding-bottom") }),
	Schema.Struct({ property: Schema.Literal("padding-left") }),
	Schema.Struct({ property: Schema.Literal("padding-right") }),
	Schema.Struct({ property: Schema.Literal("padding-block-start") }),
	Schema.Struct({ property: Schema.Literal("padding-block-end") }),
	Schema.Struct({ property: Schema.Literal("padding-inline-start") }),
	Schema.Struct({ property: Schema.Literal("padding-inline-end") }),
	Schema.Struct({ property: Schema.Literal("padding-block") }),
	Schema.Struct({ property: Schema.Literal("padding-inline") }),
	Schema.Struct({ property: Schema.Literal("padding") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-top") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-bottom") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-left") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-right") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-block-start") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-block-end") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-inline-start") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-inline-end") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-block") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-inline") }),
	Schema.Struct({ property: Schema.Literal("scroll-margin") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-top") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-bottom") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-left") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-right") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-block-start") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-block-end") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-inline-start") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-inline-end") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-block") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-inline") }),
	Schema.Struct({ property: Schema.Literal("scroll-padding") }),
	Schema.Struct({ property: Schema.Literal("font-weight") }),
	Schema.Struct({ property: Schema.Literal("font-size") }),
	Schema.Struct({ property: Schema.Literal("font-stretch") }),
	Schema.Struct({ property: Schema.Literal("font-family") }),
	Schema.Struct({ property: Schema.Literal("font-style") }),
	Schema.Struct({ property: Schema.Literal("font-variant-caps") }),
	Schema.Struct({ property: Schema.Literal("line-height") }),
	Schema.Struct({ property: Schema.Literal("font") }),
	Schema.Struct({ property: Schema.Literal("vertical-align") }),
	Schema.Struct({ property: Schema.Literal("font-palette") }),
	Schema.Struct({ property: Schema.Literal("transition-property"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("transition-duration"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("transition-delay"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("transition-timing-function"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("transition"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("animation-name"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("animation-duration"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("animation-timing-function"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("animation-iteration-count"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("animation-direction"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("animation-play-state"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("animation-delay"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("animation-fill-mode"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("animation-composition") }),
	Schema.Struct({ property: Schema.Literal("animation-timeline") }),
	Schema.Struct({ property: Schema.Literal("animation-range-start") }),
	Schema.Struct({ property: Schema.Literal("animation-range-end") }),
	Schema.Struct({ property: Schema.Literal("animation-range") }),
	Schema.Struct({ property: Schema.Literal("animation"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("transform"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("transform-origin"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("transform-style"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("transform-box") }),
	Schema.Struct({ property: Schema.Literal("backface-visibility"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("perspective"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("perspective-origin"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("translate") }),
	Schema.Struct({ property: Schema.Literal("rotate") }),
	Schema.Struct({ property: Schema.Literal("scale") }),
	Schema.Struct({ property: Schema.Literal("text-transform") }),
	Schema.Struct({ property: Schema.Literal("white-space") }),
	Schema.Struct({ property: Schema.Literal("tab-size"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("word-break") }),
	Schema.Struct({ property: Schema.Literal("line-break") }),
	Schema.Struct({ property: Schema.Literal("hyphens"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("overflow-wrap") }),
	Schema.Struct({ property: Schema.Literal("word-wrap") }),
	Schema.Struct({ property: Schema.Literal("text-align") }),
	Schema.Struct({ property: Schema.Literal("text-align-last"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("text-justify") }),
	Schema.Struct({ property: Schema.Literal("word-spacing") }),
	Schema.Struct({ property: Schema.Literal("letter-spacing") }),
	Schema.Struct({ property: Schema.Literal("text-indent") }),
	Schema.Struct({ property: Schema.Literal("text-decoration-line"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("text-decoration-style"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("text-decoration-color"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("text-decoration-thickness") }),
	Schema.Struct({ property: Schema.Literal("text-decoration"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("text-decoration-skip-ink"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("text-emphasis-style"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("text-emphasis-color"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("text-emphasis"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("text-emphasis-position"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("text-shadow") }),
	Schema.Struct({ property: Schema.Literal("text-size-adjust"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("direction") }),
	Schema.Struct({ property: Schema.Literal("unicode-bidi") }),
	Schema.Struct({ property: Schema.Literal("box-decoration-break"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("resize") }),
	Schema.Struct({ property: Schema.Literal("cursor") }),
	Schema.Struct({ property: Schema.Literal("caret-color") }),
	Schema.Struct({ property: Schema.Literal("caret-shape") }),
	Schema.Struct({ property: Schema.Literal("caret") }),
	Schema.Struct({ property: Schema.Literal("user-select"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("accent-color") }),
	Schema.Struct({ property: Schema.Literal("appearance"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("list-style-type") }),
	Schema.Struct({ property: Schema.Literal("list-style-image") }),
	Schema.Struct({ property: Schema.Literal("list-style-position") }),
	Schema.Struct({ property: Schema.Literal("list-style") }),
	Schema.Struct({ property: Schema.Literal("marker-side") }),
	Schema.Struct({ property: Schema.Literal("composes") }),
	Schema.Struct({ property: Schema.Literal("fill") }),
	Schema.Struct({ property: Schema.Literal("fill-rule") }),
	Schema.Struct({ property: Schema.Literal("fill-opacity") }),
	Schema.Struct({ property: Schema.Literal("stroke") }),
	Schema.Struct({ property: Schema.Literal("stroke-opacity") }),
	Schema.Struct({ property: Schema.Literal("stroke-width") }),
	Schema.Struct({ property: Schema.Literal("stroke-linecap") }),
	Schema.Struct({ property: Schema.Literal("stroke-linejoin") }),
	Schema.Struct({ property: Schema.Literal("stroke-miterlimit") }),
	Schema.Struct({ property: Schema.Literal("stroke-dasharray") }),
	Schema.Struct({ property: Schema.Literal("stroke-dashoffset") }),
	Schema.Struct({ property: Schema.Literal("marker-start") }),
	Schema.Struct({ property: Schema.Literal("marker-mid") }),
	Schema.Struct({ property: Schema.Literal("marker-end") }),
	Schema.Struct({ property: Schema.Literal("marker") }),
	Schema.Struct({ property: Schema.Literal("color-interpolation") }),
	Schema.Struct({ property: Schema.Literal("color-interpolation-filters") }),
	Schema.Struct({ property: Schema.Literal("color-rendering") }),
	Schema.Struct({ property: Schema.Literal("shape-rendering") }),
	Schema.Struct({ property: Schema.Literal("text-rendering") }),
	Schema.Struct({ property: Schema.Literal("image-rendering") }),
	Schema.Struct({ property: Schema.Literal("clip-path"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("clip-rule") }),
	Schema.Struct({ property: Schema.Literal("mask-image"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-mode") }),
	Schema.Struct({ property: Schema.Literal("mask-repeat"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-position-x") }),
	Schema.Struct({ property: Schema.Literal("mask-position-y") }),
	Schema.Struct({ property: Schema.Literal("mask-position"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-clip"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-origin"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-size"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-composite") }),
	Schema.Struct({ property: Schema.Literal("mask-type") }),
	Schema.Struct({ property: Schema.Literal("mask"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-border-source") }),
	Schema.Struct({ property: Schema.Literal("mask-border-mode") }),
	Schema.Struct({ property: Schema.Literal("mask-border-slice") }),
	Schema.Struct({ property: Schema.Literal("mask-border-width") }),
	Schema.Struct({ property: Schema.Literal("mask-border-outset") }),
	Schema.Struct({ property: Schema.Literal("mask-border-repeat") }),
	Schema.Struct({ property: Schema.Literal("mask-border") }),
	Schema.Struct({ property: Schema.Literal("-webkit-mask-composite") }),
	Schema.Struct({ property: Schema.Literal("mask-source-type"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-box-image"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-box-image-source"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-box-image-slice"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-box-image-width"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-box-image-outset"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mask-box-image-repeat"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("filter"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("backdrop-filter"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("mix-blend-mode") }),
	Schema.Struct({ property: Schema.Literal("z-index") }),
	Schema.Struct({ property: Schema.Literal("container-type") }),
	Schema.Struct({ property: Schema.Literal("container-name") }),
	Schema.Struct({ property: Schema.Literal("container") }),
	Schema.Struct({ property: Schema.Literal("view-transition-name") }),
	Schema.Struct({ property: Schema.Literal("view-transition-class") }),
	Schema.Struct({ property: Schema.Literal("view-transition-group") }),
	Schema.Struct({ property: Schema.Literal("color-scheme") }),
	Schema.Struct({ property: Schema.Literal("print-color-adjust"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("all") }),
	Schema.Struct({ property: Schema.String }),
]);
export const TimeSchema = Schema.TaggedUnion({
	seconds: { value: Schema.Number },
	milliseconds: { value: Schema.Number },
});
export const EasingFunctionSchema = Schema.TaggedUnion({
	linear: {},
	ease: {},
	"ease-in": {},
	"ease-out": {},
	"ease-in-out": {},
	"cubic-bezier": { x1: Schema.Number, x2: Schema.Number, y1: Schema.Number, y2: Schema.Number },
	steps: { count: Schema.Number, position: Schema.optionalKey(Schema.Unknown) },
});
export const TransitionSchema = Schema.Struct({
	delay: Schema.Unknown,
	duration: Schema.Unknown,
	property: Schema.Unknown,
	timingFunction: Schema.Unknown,
});
export const NumberOrPercentageSchema = Schema.TaggedUnion({
	number: { value: Schema.Number },
	percentage: { value: Schema.Number },
});
export const Matrix_for_floatSchema = Schema.Struct({
	a: Schema.Number,
	b: Schema.Number,
	c: Schema.Number,
	d: Schema.Number,
	e: Schema.Number,
	f: Schema.Number,
});
export const Matrix3d_for_floatSchema = Schema.Struct({
	m11: Schema.Number,
	m12: Schema.Number,
	m13: Schema.Number,
	m14: Schema.Number,
	m21: Schema.Number,
	m22: Schema.Number,
	m23: Schema.Number,
	m24: Schema.Number,
	m31: Schema.Number,
	m32: Schema.Number,
	m33: Schema.Number,
	m34: Schema.Number,
	m41: Schema.Number,
	m42: Schema.Number,
	m43: Schema.Number,
	m44: Schema.Number,
});
export const TransformSchema = Schema.TaggedUnion({
	translate: { value: Schema.Array(Schema.Unknown) },
	translateX: {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	translateY: {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	translateZ: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
	translate3d: { value: Schema.Array(Schema.Unknown) },
	scale: { value: Schema.Array(Schema.Unknown) },
	scaleX: { value: NumberOrPercentageSchema },
	scaleY: { value: NumberOrPercentageSchema },
	scaleZ: { value: NumberOrPercentageSchema },
	scale3d: { value: Schema.Array(Schema.Unknown) },
	rotate: { value: AngleSchema },
	rotateX: { value: AngleSchema },
	rotateY: { value: AngleSchema },
	rotateZ: { value: AngleSchema },
	rotate3d: { value: Schema.Array(Schema.Unknown) },
	skew: { value: Schema.Array(Schema.Unknown) },
	skewX: { value: AngleSchema },
	skewY: { value: AngleSchema },
	perspective: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
	matrix: { value: Matrix_for_floatSchema },
	matrix3d: { value: Matrix3d_for_floatSchema },
});
export const PositionSchema = Schema.Struct({ x: Schema.Unknown, y: Schema.Unknown });
export const TransformStyleSchema = Schema.Literals(["flat", "preserve3d"]);
export const TransformBoxSchema = Schema.Union([
	Schema.Literal("content-box"),
	Schema.Literal("border-box"),
	Schema.Literal("fill-box"),
	Schema.Literal("stroke-box"),
	Schema.Literal("view-box"),
]);
export const PerspectiveSchema = Schema.TaggedUnion({
	none: {},
	length: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
});
export const TranslateSchema = Schema.Union([
	Schema.Literal("none"),
	Schema.Struct({ xyz: Schema.Struct({ x: Schema.Unknown, y: Schema.Unknown, z: Schema.Unknown }) }),
]);
export const RotateSchema = Schema.Union([
	Schema.Literal("none"),
	Schema.Struct({
		xyz: Schema.Struct({ angle: Schema.Unknown, x: Schema.Number, y: Schema.Number, z: Schema.Number }),
	}),
]);
export const ScaleSchema = Schema.Union([
	Schema.Literal("none"),
	Schema.Struct({ xyz: Schema.Struct({ x: Schema.Unknown, y: Schema.Unknown, z: Schema.Unknown }) }),
]);
export const TextTransformSchema = Schema.Struct({
	case: Schema.Unknown,
	fullSizeKana: Schema.Boolean,
	fullWidth: Schema.Boolean,
});
export const WhiteSpaceSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Literal("pre"),
	Schema.Literal("nowrap"),
	Schema.Literal("pre-wrap"),
	Schema.Literal("break-spaces"),
	Schema.Literal("pre-line"),
]);
export const LengthOrNumberSchema = Schema.TaggedUnion({
	number: { value: Schema.Number },
	length: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
});
export const WordBreakSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Literal("keep-all"),
	Schema.Literal("break-all"),
	Schema.Literal("break-word"),
]);
export const LineBreakSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("loose"),
	Schema.Literal("normal"),
	Schema.Literal("strict"),
	Schema.Literal("anywhere"),
]);
export const HyphensSchema = Schema.Union([Schema.Literal("none"), Schema.Literal("manual"), Schema.Literal("auto")]);
export const OverflowWrapSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Literal("anywhere"),
	Schema.Literal("break-word"),
]);
export const TextAlignSchema = Schema.Union([
	Schema.Literal("start"),
	Schema.Literal("end"),
	Schema.Literal("left"),
	Schema.Literal("right"),
	Schema.Literal("center"),
	Schema.Literal("justify"),
	Schema.Literal("match-parent"),
	Schema.Literal("justify-all"),
]);
export const TextAlignLastSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("start"),
	Schema.Literal("end"),
	Schema.Literal("left"),
	Schema.Literal("right"),
	Schema.Literal("center"),
	Schema.Literal("justify"),
	Schema.Literal("match-parent"),
]);
export const TextJustifySchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("none"),
	Schema.Literal("inter-word"),
	Schema.Literal("inter-character"),
]);
export const SpacingSchema = Schema.TaggedUnion({
	normal: {},
	length: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
});
export const TextIndentSchema = Schema.Struct({
	eachLine: Schema.Boolean,
	hanging: Schema.Boolean,
	value: Schema.Unknown,
});
export const ExclusiveTextDecorationLineSchema = Schema.Literals(["none", "spelling-error", "grammar-error"]);
export const OtherTextDecorationLineSchema = Schema.Literals(["underline", "overline", "line-through", "blink"]);
export const TextDecorationLineSchema = Schema.Union([
	ExclusiveTextDecorationLineSchema,
	Schema.Array(OtherTextDecorationLineSchema),
]);
export const TextDecorationStyleSchema = Schema.Union([
	Schema.Literal("solid"),
	Schema.Literal("double"),
	Schema.Literal("dotted"),
	Schema.Literal("dashed"),
	Schema.Literal("wavy"),
]);
export const TextDecorationThicknessSchema = Schema.TaggedUnion({
	auto: {},
	"from-font": {},
	"length-percentage": {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
});
export const TextDecorationSchema = Schema.Struct({
	color: Schema.Unknown,
	line: Schema.Unknown,
	style: Schema.Unknown,
	thickness: Schema.Unknown,
});
export const TextDecorationSkipInkSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("none"),
	Schema.Literal("all"),
]);
export const TextEmphasisShapeSchema = Schema.Union([
	Schema.Literal("dot"),
	Schema.Literal("circle"),
	Schema.Literal("double-circle"),
	Schema.Literal("triangle"),
	Schema.Literal("sesame"),
]);
export const TextEmphasisStyleSchema = Schema.TaggedUnion({
	none: {},
	keyword: { fill: Schema.Unknown, shape: Schema.optionalKey(Schema.Union([TextEmphasisShapeSchema, Schema.Null])) },
	string: { value: Schema.String },
});
export const TextEmphasisSchema = Schema.Struct({ color: Schema.Unknown, style: Schema.Unknown });
export const TextEmphasisPositionSchema = Schema.Struct({ horizontal: Schema.Unknown, vertical: Schema.Unknown });
export const TextShadowSchema = Schema.Struct({
	blur: Schema.Unknown,
	color: Schema.Unknown,
	spread: Schema.Unknown,
	xOffset: Schema.Unknown,
	yOffset: Schema.Unknown,
});
export const TextSizeAdjustSchema = Schema.TaggedUnion({ auto: {}, none: {}, percentage: { value: Schema.Number } });
export const Direction2Schema = Schema.Union([Schema.Literal("ltr"), Schema.Literal("rtl")]);
export const UnicodeBidiSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Literal("embed"),
	Schema.Literal("isolate"),
	Schema.Literal("bidi-override"),
	Schema.Literal("isolate-override"),
	Schema.Literal("plaintext"),
]);
export const ResizeSchema = Schema.Union([
	Schema.Literal("none"),
	Schema.Literal("both"),
	Schema.Literal("horizontal"),
	Schema.Literal("vertical"),
	Schema.Literal("block"),
	Schema.Literal("inline"),
]);
export const UserSelectSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("text"),
	Schema.Literal("none"),
	Schema.Literal("contain"),
	Schema.Literal("all"),
]);
export const ListStyleTypeSchema = Schema.TaggedUnion({
	none: {},
	string: { value: Schema.String },
	"counter-style": { value: CounterStyleSchema },
});
export const ListStylePositionSchema = Schema.Union([Schema.Literal("inside"), Schema.Literal("outside")]);
export const ListStyleSchema = Schema.Struct({
	image: Schema.Unknown,
	listStyleType: Schema.Unknown,
	position: Schema.Unknown,
});
export const MarkerSideSchema = Schema.Literals(["match-self", "match-parent"]);
export const SVGPaintFallbackSchema = Schema.TaggedUnion({ none: {}, color: { value: CssColorSchema } });
export const SVGPaintSchema = Schema.TaggedUnion({
	url: { fallback: Schema.optionalKey(Schema.Union([SVGPaintFallbackSchema, Schema.Null])), url: Schema.Unknown },
	color: { value: CssColorSchema },
	"context-fill": {},
	"context-stroke": {},
	none: {},
});
export const FillRuleSchema = Schema.Union([Schema.Literal("nonzero"), Schema.Literal("evenodd")]);
export const StrokeLinecapSchema = Schema.Union([
	Schema.Literal("butt"),
	Schema.Literal("round"),
	Schema.Literal("square"),
]);
export const StrokeLinejoinSchema = Schema.Union([
	Schema.Literal("miter"),
	Schema.Literal("miter-clip"),
	Schema.Literal("round"),
	Schema.Literal("bevel"),
	Schema.Literal("arcs"),
]);
export const StrokeDasharraySchema = Schema.TaggedUnion({
	none: {},
	values: {
		value: Schema.Array(
			Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
		),
	},
});
export const MarkerSchema = Schema.TaggedUnion({ none: {}, url: { value: UrlSchema } });
export const ShapeRenderingSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("optimizespeed"),
	Schema.Literal("crispedges"),
	Schema.Literal("geometricprecision"),
]);
export const TextRenderingSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("optimizespeed"),
	Schema.Literal("optimizelegibility"),
	Schema.Literal("geometricprecision"),
]);
export const ImageRenderingSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("optimizespeed"),
	Schema.Literal("optimizequality"),
]);
export const MaskModeSchema = Schema.Union([
	Schema.Literal("luminance"),
	Schema.Literal("alpha"),
	Schema.Literal("match-source"),
]);
export const MaskClipSchema = Schema.TaggedUnion({ "geometry-box": { value: GeometryBoxSchema }, "no-clip": {} });
export const MaskCompositeSchema = Schema.Union([
	Schema.Literal("add"),
	Schema.Literal("subtract"),
	Schema.Literal("intersect"),
	Schema.Literal("exclude"),
]);
export const MaskTypeSchema = Schema.Union([Schema.Literal("luminance"), Schema.Literal("alpha")]);
export const MaskSchema = Schema.Struct({
	clip: Schema.Unknown,
	composite: Schema.Unknown,
	image: Schema.Unknown,
	mode: Schema.Unknown,
	origin: Schema.Unknown,
	position: Schema.Unknown,
	repeat: Schema.Unknown,
	size: Schema.Unknown,
});
export const MaskBorderModeSchema = Schema.Union([Schema.Literal("luminance"), Schema.Literal("alpha")]);
export const MaskBorderSchema = Schema.Struct({
	mode: Schema.Unknown,
	outset: Schema.Unknown,
	repeat: Schema.Unknown,
	slice: Schema.Unknown,
	source: Schema.Unknown,
	width: Schema.Unknown,
});
export const WebKitMaskCompositeSchema = Schema.Union([
	Schema.Literals([
		"clear",
		"copy",
		"source-atop",
		"destination-over",
		"destination-in",
		"destination-out",
		"destination-atop",
	]),
	Schema.Literal("source-over"),
	Schema.Literal("source-in"),
	Schema.Literal("source-out"),
	Schema.Literal("xor"),
]);
export const WebKitMaskSourceTypeSchema = Schema.Union([
	Schema.Literal("auto"),
	Schema.Literal("luminance"),
	Schema.Literal("alpha"),
]);
export const DropShadowSchema = Schema.Struct({
	blur: Schema.Unknown,
	color: Schema.Unknown,
	xOffset: Schema.Unknown,
	yOffset: Schema.Unknown,
});
export const FilterSchema = Schema.TaggedUnion({
	blur: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
	brightness: { value: NumberOrPercentageSchema },
	contrast: { value: NumberOrPercentageSchema },
	grayscale: { value: NumberOrPercentageSchema },
	"hue-rotate": { value: AngleSchema },
	invert: { value: NumberOrPercentageSchema },
	opacity: { value: NumberOrPercentageSchema },
	saturate: { value: NumberOrPercentageSchema },
	sepia: { value: NumberOrPercentageSchema },
	"drop-shadow": { value: DropShadowSchema },
	url: { value: UrlSchema },
});
export const FilterListSchema = Schema.TaggedUnion({ none: {}, filters: { value: Schema.Array(FilterSchema) } });
export const ZIndexSchema = Schema.TaggedUnion({ auto: {}, integer: { value: Schema.Number } });
export const ViewTransitionNameSchema = Schema.Union([
	Schema.Literal("none"),
	Schema.Literal("auto"),
	Schema.Struct({ custom: Schema.String }),
]);
export const NoneOrCustomIdentListSchema = Schema.Union([
	Schema.Literal("none"),
	Schema.Struct({ idents: Schema.Array(Schema.String) }),
]);
export const ViewTransitionGroupSchema = Schema.Union([
	Schema.Literal("normal"),
	Schema.Literal("contain"),
	Schema.Literal("nearest"),
	Schema.Struct({ custom: Schema.String }),
]);
export const PrintColorAdjustSchema = Schema.Union([Schema.Literal("economy"), Schema.Literal("exact")]);
export const UnparsedPropertySchema = Schema.Struct({
	propertyId: Schema.Unknown,
	value: Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue)),
});
export const DeclarationSchema = Schema.Union([
	Schema.Struct({ property: Schema.Literal("background-color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("background-image"), value: Schema.Array(ImageSchema) }),
	Schema.Struct({
		property: Schema.Literal("background-position-x"),
		value: Schema.Array(PositionComponent_for_HorizontalPositionKeywordSchema),
	}),
	Schema.Struct({
		property: Schema.Literal("background-position-y"),
		value: Schema.Array(PositionComponent_for_VerticalPositionKeywordSchema),
	}),
	Schema.Struct({ property: Schema.Literal("background-position"), value: Schema.Array(BackgroundPositionSchema) }),
	Schema.Struct({ property: Schema.Literal("background-size"), value: Schema.Array(BackgroundSizeSchema) }),
	Schema.Struct({ property: Schema.Literal("background-repeat"), value: Schema.Array(BackgroundRepeatSchema) }),
	Schema.Struct({ property: Schema.Literal("background-attachment"), value: Schema.Array(BackgroundAttachmentSchema) }),
	Schema.Struct({
		property: Schema.Literal("background-clip"),
		value: Schema.Array(BackgroundClipSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("background-origin"), value: Schema.Array(BackgroundOriginSchema) }),
	Schema.Struct({ property: Schema.Literal("background"), value: Schema.Array(BackgroundSchema) }),
	Schema.Struct({
		property: Schema.Literal("box-shadow"),
		value: Schema.Array(BoxShadowSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("opacity"), value: Schema.Number }),
	Schema.Struct({ property: Schema.Literal("color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("display"), value: DisplaySchema }),
	Schema.Struct({ property: Schema.Literal("visibility"), value: VisibilitySchema }),
	Schema.Struct({ property: Schema.Literal("width"), value: SizeSchema }),
	Schema.Struct({ property: Schema.Literal("height"), value: SizeSchema }),
	Schema.Struct({ property: Schema.Literal("min-width"), value: SizeSchema }),
	Schema.Struct({ property: Schema.Literal("min-height"), value: SizeSchema }),
	Schema.Struct({ property: Schema.Literal("max-width"), value: MaxSizeSchema }),
	Schema.Struct({ property: Schema.Literal("max-height"), value: MaxSizeSchema }),
	Schema.Struct({ property: Schema.Literal("block-size"), value: SizeSchema }),
	Schema.Struct({ property: Schema.Literal("inline-size"), value: SizeSchema }),
	Schema.Struct({ property: Schema.Literal("min-block-size"), value: SizeSchema }),
	Schema.Struct({ property: Schema.Literal("min-inline-size"), value: SizeSchema }),
	Schema.Struct({ property: Schema.Literal("max-block-size"), value: MaxSizeSchema }),
	Schema.Struct({ property: Schema.Literal("max-inline-size"), value: MaxSizeSchema }),
	Schema.Struct({ property: Schema.Literal("box-sizing"), value: BoxSizingSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("aspect-ratio"), value: AspectRatioSchema }),
	Schema.Struct({ property: Schema.Literal("overflow"), value: OverflowSchema }),
	Schema.Struct({ property: Schema.Literal("overflow-x"), value: OverflowKeywordSchema }),
	Schema.Struct({ property: Schema.Literal("overflow-y"), value: OverflowKeywordSchema }),
	Schema.Struct({
		property: Schema.Literal("text-overflow"),
		value: TextOverflowSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("position"), value: Position2Schema }),
	Schema.Struct({ property: Schema.Literal("top"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("bottom"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("left"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("right"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("inset-block-start"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("inset-block-end"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("inset-inline-start"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("inset-inline-end"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("inset-block"), value: InsetBlockSchema }),
	Schema.Struct({ property: Schema.Literal("inset-inline"), value: InsetInlineSchema }),
	Schema.Struct({ property: Schema.Literal("inset"), value: InsetSchema }),
	Schema.Struct({ property: Schema.Literal("border-spacing"), value: Size2D_for_LengthSchema }),
	Schema.Struct({ property: Schema.Literal("border-top-color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-bottom-color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-left-color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-right-color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-block-start-color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-block-end-color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-inline-start-color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-inline-end-color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-top-style"), value: LineStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-bottom-style"), value: LineStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-left-style"), value: LineStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-right-style"), value: LineStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-block-start-style"), value: LineStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-block-end-style"), value: LineStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-inline-start-style"), value: LineStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-inline-end-style"), value: LineStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-top-width"), value: BorderSideWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border-bottom-width"), value: BorderSideWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border-left-width"), value: BorderSideWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border-right-width"), value: BorderSideWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border-block-start-width"), value: BorderSideWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border-block-end-width"), value: BorderSideWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border-inline-start-width"), value: BorderSideWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border-inline-end-width"), value: BorderSideWidthSchema }),
	Schema.Struct({
		property: Schema.Literal("border-top-left-radius"),
		value: Size2D_for_DimensionPercentage_for_LengthValueSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("border-top-right-radius"),
		value: Size2D_for_DimensionPercentage_for_LengthValueSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("border-bottom-left-radius"),
		value: Size2D_for_DimensionPercentage_for_LengthValueSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("border-bottom-right-radius"),
		value: Size2D_for_DimensionPercentage_for_LengthValueSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("border-start-start-radius"),
		value: Size2D_for_DimensionPercentage_for_LengthValueSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("border-start-end-radius"),
		value: Size2D_for_DimensionPercentage_for_LengthValueSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("border-end-start-radius"),
		value: Size2D_for_DimensionPercentage_for_LengthValueSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("border-end-end-radius"),
		value: Size2D_for_DimensionPercentage_for_LengthValueSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("border-radius"),
		value: BorderRadiusSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("border-image-source"), value: ImageSchema }),
	Schema.Struct({ property: Schema.Literal("border-image-outset"), value: Rect_for_LengthOrNumberSchema }),
	Schema.Struct({ property: Schema.Literal("border-image-repeat"), value: BorderImageRepeatSchema }),
	Schema.Struct({ property: Schema.Literal("border-image-width"), value: Rect_for_BorderImageSideWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border-image-slice"), value: BorderImageSliceSchema }),
	Schema.Struct({
		property: Schema.Literal("border-image"),
		value: BorderImageSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("border-color"), value: BorderColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-style"), value: BorderStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-width"), value: BorderWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border-block-color"), value: BorderBlockColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-block-style"), value: BorderBlockStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-block-width"), value: BorderBlockWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border-inline-color"), value: BorderInlineColorSchema }),
	Schema.Struct({ property: Schema.Literal("border-inline-style"), value: BorderInlineStyleSchema }),
	Schema.Struct({ property: Schema.Literal("border-inline-width"), value: BorderInlineWidthSchema }),
	Schema.Struct({ property: Schema.Literal("border"), value: GenericBorder_for_LineStyle_and_10Schema }),
	Schema.Struct({ property: Schema.Literal("border-top"), value: GenericBorder_for_LineStyle_and_0Schema }),
	Schema.Struct({ property: Schema.Literal("border-bottom"), value: GenericBorder_for_LineStyle_and_2Schema }),
	Schema.Struct({ property: Schema.Literal("border-left"), value: GenericBorder_for_LineStyle_and_3Schema }),
	Schema.Struct({ property: Schema.Literal("border-right"), value: GenericBorder_for_LineStyle_and_1Schema }),
	Schema.Struct({ property: Schema.Literal("border-block"), value: GenericBorder_for_LineStyle_and_8Schema }),
	Schema.Struct({ property: Schema.Literal("border-block-start"), value: GenericBorder_for_LineStyle_and_4Schema }),
	Schema.Struct({ property: Schema.Literal("border-block-end"), value: GenericBorder_for_LineStyle_and_5Schema }),
	Schema.Struct({ property: Schema.Literal("border-inline"), value: GenericBorder_for_LineStyle_and_9Schema }),
	Schema.Struct({ property: Schema.Literal("border-inline-start"), value: GenericBorder_for_LineStyle_and_6Schema }),
	Schema.Struct({ property: Schema.Literal("border-inline-end"), value: GenericBorder_for_LineStyle_and_7Schema }),
	Schema.Struct({ property: Schema.Literal("outline"), value: GenericBorder_for_OutlineStyle_and_11Schema }),
	Schema.Struct({ property: Schema.Literal("outline-color"), value: CssColorSchema }),
	Schema.Struct({ property: Schema.Literal("outline-style"), value: OutlineStyleSchema }),
	Schema.Struct({ property: Schema.Literal("outline-width"), value: BorderSideWidthSchema }),
	Schema.Struct({
		property: Schema.Literal("flex-direction"),
		value: FlexDirectionSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("flex-wrap"), value: FlexWrapSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-flow"), value: FlexFlowSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-grow"), value: Schema.Number, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-shrink"), value: Schema.Number, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({
		property: Schema.Literal("flex-basis"),
		value: LengthPercentageOrAutoSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("flex"), value: FlexSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("order"), value: Schema.Number, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({
		property: Schema.Literal("align-content"),
		value: AlignContentSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("justify-content"),
		value: JustifyContentSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("place-content"), value: PlaceContentSchema }),
	Schema.Struct({ property: Schema.Literal("align-self"), value: AlignSelfSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("justify-self"), value: JustifySelfSchema }),
	Schema.Struct({ property: Schema.Literal("place-self"), value: PlaceSelfSchema }),
	Schema.Struct({ property: Schema.Literal("align-items"), value: AlignItemsSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("justify-items"), value: JustifyItemsSchema }),
	Schema.Struct({ property: Schema.Literal("place-items"), value: PlaceItemsSchema }),
	Schema.Struct({ property: Schema.Literal("row-gap"), value: GapValueSchema }),
	Schema.Struct({ property: Schema.Literal("column-gap"), value: GapValueSchema }),
	Schema.Struct({ property: Schema.Literal("gap"), value: GapSchema }),
	Schema.Struct({ property: Schema.Literal("box-orient"), value: BoxOrientSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({
		property: Schema.Literal("box-direction"),
		value: BoxDirectionSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("box-ordinal-group"),
		value: Schema.Number,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("box-align"), value: BoxAlignSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-flex"), value: Schema.Number, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-flex-group"), value: Schema.Number, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-pack"), value: BoxPackSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("box-lines"), value: BoxLinesSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-pack"), value: FlexPackSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-order"), value: Schema.Number, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-align"), value: BoxAlignSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({
		property: Schema.Literal("flex-item-align"),
		value: FlexItemAlignSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("flex-line-pack"),
		value: FlexLinePackSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("flex-positive"), value: Schema.Number, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("flex-negative"), value: Schema.Number, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({
		property: Schema.Literal("flex-preferred-size"),
		value: LengthPercentageOrAutoSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("grid-template-columns"), value: TrackSizingSchema }),
	Schema.Struct({ property: Schema.Literal("grid-template-rows"), value: TrackSizingSchema }),
	Schema.Struct({ property: Schema.Literal("grid-auto-columns"), value: Schema.Array(TrackSizeSchema) }),
	Schema.Struct({ property: Schema.Literal("grid-auto-rows"), value: Schema.Array(TrackSizeSchema) }),
	Schema.Struct({ property: Schema.Literal("grid-auto-flow"), value: GridAutoFlowSchema }),
	Schema.Struct({ property: Schema.Literal("grid-template-areas"), value: GridTemplateAreasSchema }),
	Schema.Struct({ property: Schema.Literal("grid-template"), value: GridTemplateSchema }),
	Schema.Struct({ property: Schema.Literal("grid"), value: GridSchema }),
	Schema.Struct({ property: Schema.Literal("grid-row-start"), value: GridLineSchema }),
	Schema.Struct({ property: Schema.Literal("grid-row-end"), value: GridLineSchema }),
	Schema.Struct({ property: Schema.Literal("grid-column-start"), value: GridLineSchema }),
	Schema.Struct({ property: Schema.Literal("grid-column-end"), value: GridLineSchema }),
	Schema.Struct({ property: Schema.Literal("grid-row"), value: GridRowSchema }),
	Schema.Struct({ property: Schema.Literal("grid-column"), value: GridColumnSchema }),
	Schema.Struct({ property: Schema.Literal("grid-area"), value: GridAreaSchema }),
	Schema.Struct({ property: Schema.Literal("margin-top"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("margin-bottom"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("margin-left"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("margin-right"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("margin-block-start"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("margin-block-end"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("margin-inline-start"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("margin-inline-end"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("margin-block"), value: MarginBlockSchema }),
	Schema.Struct({ property: Schema.Literal("margin-inline"), value: MarginInlineSchema }),
	Schema.Struct({ property: Schema.Literal("margin"), value: MarginSchema }),
	Schema.Struct({ property: Schema.Literal("padding-top"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("padding-bottom"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("padding-left"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("padding-right"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("padding-block-start"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("padding-block-end"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("padding-inline-start"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("padding-inline-end"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("padding-block"), value: PaddingBlockSchema }),
	Schema.Struct({ property: Schema.Literal("padding-inline"), value: PaddingInlineSchema }),
	Schema.Struct({ property: Schema.Literal("padding"), value: PaddingSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-top"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-bottom"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-left"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-right"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-block-start"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-block-end"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-inline-start"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-inline-end"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-block"), value: ScrollMarginBlockSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin-inline"), value: ScrollMarginInlineSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-margin"), value: ScrollMarginSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-top"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-bottom"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-left"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-right"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-block-start"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-block-end"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-inline-start"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-inline-end"), value: LengthPercentageOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-block"), value: ScrollPaddingBlockSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding-inline"), value: ScrollPaddingInlineSchema }),
	Schema.Struct({ property: Schema.Literal("scroll-padding"), value: ScrollPaddingSchema }),
	Schema.Struct({ property: Schema.Literal("font-weight"), value: FontWeightSchema }),
	Schema.Struct({ property: Schema.Literal("font-size"), value: FontSizeSchema }),
	Schema.Struct({ property: Schema.Literal("font-stretch"), value: FontStretchSchema }),
	Schema.Struct({ property: Schema.Literal("font-family"), value: Schema.Array(FontFamilySchema) }),
	Schema.Struct({ property: Schema.Literal("font-style"), value: FontStyleSchema }),
	Schema.Struct({ property: Schema.Literal("font-variant-caps"), value: FontVariantCapsSchema }),
	Schema.Struct({ property: Schema.Literal("line-height"), value: LineHeightSchema }),
	Schema.Struct({ property: Schema.Literal("font"), value: FontSchema }),
	Schema.Struct({ property: Schema.Literal("vertical-align"), value: VerticalAlignSchema }),
	Schema.Struct({ property: Schema.Literal("font-palette"), value: DashedIdentReferenceSchema }),
	Schema.Struct({
		property: Schema.Literal("transition-property"),
		value: Schema.Array(PropertyIdSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("transition-duration"),
		value: Schema.Array(TimeSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("transition-delay"),
		value: Schema.Array(TimeSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("transition-timing-function"),
		value: Schema.Array(EasingFunctionSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("transition"),
		value: Schema.Array(TransitionSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("animation-name"),
		value: Schema.Array(AnimationNameSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("animation-duration"),
		value: Schema.Array(TimeSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("animation-timing-function"),
		value: Schema.Array(EasingFunctionSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("animation-iteration-count"),
		value: Schema.Array(AnimationIterationCountSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("animation-direction"),
		value: Schema.Array(AnimationDirectionSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("animation-play-state"),
		value: Schema.Array(AnimationPlayStateSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("animation-delay"),
		value: Schema.Array(TimeSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("animation-fill-mode"),
		value: Schema.Array(AnimationFillModeSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("animation-composition"), value: Schema.Array(AnimationCompositionSchema) }),
	Schema.Struct({ property: Schema.Literal("animation-timeline"), value: Schema.Array(AnimationTimelineSchema) }),
	Schema.Struct({ property: Schema.Literal("animation-range-start"), value: Schema.Array(AnimationRangeStartSchema) }),
	Schema.Struct({ property: Schema.Literal("animation-range-end"), value: Schema.Array(AnimationRangeEndSchema) }),
	Schema.Struct({ property: Schema.Literal("animation-range"), value: Schema.Array(AnimationRangeSchema) }),
	Schema.Struct({
		property: Schema.Literal("animation"),
		value: Schema.Array(AnimationSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("transform"),
		value: Schema.Array(TransformSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("transform-origin"),
		value: PositionSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("transform-style"),
		value: TransformStyleSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("transform-box"), value: TransformBoxSchema }),
	Schema.Struct({
		property: Schema.Literal("backface-visibility"),
		value: BackfaceVisibilitySchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("perspective"),
		value: PerspectiveSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("perspective-origin"),
		value: PositionSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("translate"), value: TranslateSchema }),
	Schema.Struct({ property: Schema.Literal("rotate"), value: RotateSchema }),
	Schema.Struct({ property: Schema.Literal("scale"), value: ScaleSchema }),
	Schema.Struct({ property: Schema.Literal("text-transform"), value: TextTransformSchema }),
	Schema.Struct({ property: Schema.Literal("white-space"), value: WhiteSpaceSchema }),
	Schema.Struct({
		property: Schema.Literal("tab-size"),
		value: LengthOrNumberSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("word-break"), value: WordBreakSchema }),
	Schema.Struct({ property: Schema.Literal("line-break"), value: LineBreakSchema }),
	Schema.Struct({ property: Schema.Literal("hyphens"), value: HyphensSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("overflow-wrap"), value: OverflowWrapSchema }),
	Schema.Struct({ property: Schema.Literal("word-wrap"), value: OverflowWrapSchema }),
	Schema.Struct({ property: Schema.Literal("text-align"), value: TextAlignSchema }),
	Schema.Struct({
		property: Schema.Literal("text-align-last"),
		value: TextAlignLastSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("text-justify"), value: TextJustifySchema }),
	Schema.Struct({ property: Schema.Literal("word-spacing"), value: SpacingSchema }),
	Schema.Struct({ property: Schema.Literal("letter-spacing"), value: SpacingSchema }),
	Schema.Struct({ property: Schema.Literal("text-indent"), value: TextIndentSchema }),
	Schema.Struct({
		property: Schema.Literal("text-decoration-line"),
		value: TextDecorationLineSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("text-decoration-style"),
		value: TextDecorationStyleSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("text-decoration-color"),
		value: CssColorSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("text-decoration-thickness"), value: TextDecorationThicknessSchema }),
	Schema.Struct({
		property: Schema.Literal("text-decoration"),
		value: TextDecorationSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("text-decoration-skip-ink"),
		value: TextDecorationSkipInkSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("text-emphasis-style"),
		value: TextEmphasisStyleSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("text-emphasis-color"),
		value: CssColorSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("text-emphasis"),
		value: TextEmphasisSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("text-emphasis-position"),
		value: TextEmphasisPositionSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("text-shadow"), value: Schema.Array(TextShadowSchema) }),
	Schema.Struct({
		property: Schema.Literal("text-size-adjust"),
		value: TextSizeAdjustSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("direction"), value: Direction2Schema }),
	Schema.Struct({ property: Schema.Literal("unicode-bidi"), value: UnicodeBidiSchema }),
	Schema.Struct({
		property: Schema.Literal("box-decoration-break"),
		value: BoxDecorationBreakSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("resize"), value: ResizeSchema }),
	Schema.Struct({ property: Schema.Literal("cursor"), value: CursorSchema }),
	Schema.Struct({ property: Schema.Literal("caret-color"), value: ColorOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("caret-shape"), value: CaretShapeSchema }),
	Schema.Struct({ property: Schema.Literal("caret"), value: CaretSchema }),
	Schema.Struct({ property: Schema.Literal("user-select"), value: UserSelectSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("accent-color"), value: ColorOrAutoSchema }),
	Schema.Struct({ property: Schema.Literal("appearance"), value: AppearanceSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("list-style-type"), value: ListStyleTypeSchema }),
	Schema.Struct({ property: Schema.Literal("list-style-image"), value: ImageSchema }),
	Schema.Struct({ property: Schema.Literal("list-style-position"), value: ListStylePositionSchema }),
	Schema.Struct({ property: Schema.Literal("list-style"), value: ListStyleSchema }),
	Schema.Struct({ property: Schema.Literal("marker-side"), value: MarkerSideSchema }),
	Schema.Struct({ property: Schema.Literal("composes"), value: ComposesSchema }),
	Schema.Struct({ property: Schema.Literal("fill"), value: SVGPaintSchema }),
	Schema.Struct({ property: Schema.Literal("fill-rule"), value: FillRuleSchema }),
	Schema.Struct({ property: Schema.Literal("fill-opacity"), value: Schema.Number }),
	Schema.Struct({ property: Schema.Literal("stroke"), value: SVGPaintSchema }),
	Schema.Struct({ property: Schema.Literal("stroke-opacity"), value: Schema.Number }),
	Schema.Struct({
		property: Schema.Literal("stroke-width"),
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	}),
	Schema.Struct({ property: Schema.Literal("stroke-linecap"), value: StrokeLinecapSchema }),
	Schema.Struct({ property: Schema.Literal("stroke-linejoin"), value: StrokeLinejoinSchema }),
	Schema.Struct({ property: Schema.Literal("stroke-miterlimit"), value: Schema.Number }),
	Schema.Struct({ property: Schema.Literal("stroke-dasharray"), value: StrokeDasharraySchema }),
	Schema.Struct({
		property: Schema.Literal("stroke-dashoffset"),
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	}),
	Schema.Struct({ property: Schema.Literal("marker-start"), value: MarkerSchema }),
	Schema.Struct({ property: Schema.Literal("marker-mid"), value: MarkerSchema }),
	Schema.Struct({ property: Schema.Literal("marker-end"), value: MarkerSchema }),
	Schema.Struct({ property: Schema.Literal("marker"), value: MarkerSchema }),
	Schema.Struct({ property: Schema.Literal("color-interpolation"), value: ColorInterpolationSchema }),
	Schema.Struct({ property: Schema.Literal("color-interpolation-filters"), value: ColorInterpolationSchema }),
	Schema.Struct({ property: Schema.Literal("color-rendering"), value: ColorRenderingSchema }),
	Schema.Struct({ property: Schema.Literal("shape-rendering"), value: ShapeRenderingSchema }),
	Schema.Struct({ property: Schema.Literal("text-rendering"), value: TextRenderingSchema }),
	Schema.Struct({ property: Schema.Literal("image-rendering"), value: ImageRenderingSchema }),
	Schema.Struct({ property: Schema.Literal("clip-path"), value: ClipPathSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ property: Schema.Literal("clip-rule"), value: FillRuleSchema }),
	Schema.Struct({
		property: Schema.Literal("mask-image"),
		value: Schema.Array(ImageSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("mask-mode"), value: Schema.Array(MaskModeSchema) }),
	Schema.Struct({
		property: Schema.Literal("mask-repeat"),
		value: Schema.Array(BackgroundRepeatSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("mask-position-x"),
		value: Schema.Array(PositionComponent_for_HorizontalPositionKeywordSchema),
	}),
	Schema.Struct({
		property: Schema.Literal("mask-position-y"),
		value: Schema.Array(PositionComponent_for_VerticalPositionKeywordSchema),
	}),
	Schema.Struct({
		property: Schema.Literal("mask-position"),
		value: Schema.Array(PositionSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("mask-clip"),
		value: Schema.Array(MaskClipSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("mask-origin"),
		value: Schema.Array(GeometryBoxSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("mask-size"),
		value: Schema.Array(BackgroundSizeSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("mask-composite"), value: Schema.Array(MaskCompositeSchema) }),
	Schema.Struct({ property: Schema.Literal("mask-type"), value: MaskTypeSchema }),
	Schema.Struct({
		property: Schema.Literal("mask"),
		value: Schema.Array(MaskSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("mask-border-source"), value: ImageSchema }),
	Schema.Struct({ property: Schema.Literal("mask-border-mode"), value: MaskBorderModeSchema }),
	Schema.Struct({ property: Schema.Literal("mask-border-slice"), value: BorderImageSliceSchema }),
	Schema.Struct({ property: Schema.Literal("mask-border-width"), value: Rect_for_BorderImageSideWidthSchema }),
	Schema.Struct({ property: Schema.Literal("mask-border-outset"), value: Rect_for_LengthOrNumberSchema }),
	Schema.Struct({ property: Schema.Literal("mask-border-repeat"), value: BorderImageRepeatSchema }),
	Schema.Struct({ property: Schema.Literal("mask-border"), value: MaskBorderSchema }),
	Schema.Struct({ property: Schema.Literal("-webkit-mask-composite"), value: Schema.Array(WebKitMaskCompositeSchema) }),
	Schema.Struct({
		property: Schema.Literal("mask-source-type"),
		value: Schema.Array(WebKitMaskSourceTypeSchema),
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("mask-box-image"),
		value: BorderImageSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("mask-box-image-source"),
		value: ImageSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("mask-box-image-slice"),
		value: BorderImageSliceSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("mask-box-image-width"),
		value: Rect_for_BorderImageSideWidthSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("mask-box-image-outset"),
		value: Rect_for_LengthOrNumberSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({
		property: Schema.Literal("mask-box-image-repeat"),
		value: BorderImageRepeatSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("filter"), value: FilterListSchema, vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({
		property: Schema.Literal("backdrop-filter"),
		value: FilterListSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("mix-blend-mode"), value: BlendModeSchema }),
	Schema.Struct({ property: Schema.Literal("z-index"), value: ZIndexSchema }),
	Schema.Struct({ property: Schema.Literal("container-type"), value: ContainerTypeSchema }),
	Schema.Struct({ property: Schema.Literal("container-name"), value: ContainerNameListSchema }),
	Schema.Struct({ property: Schema.Literal("container"), value: ContainerSchema }),
	Schema.Struct({ property: Schema.Literal("view-transition-name"), value: ViewTransitionNameSchema }),
	Schema.Struct({ property: Schema.Literal("view-transition-class"), value: NoneOrCustomIdentListSchema }),
	Schema.Struct({ property: Schema.Literal("view-transition-group"), value: ViewTransitionGroupSchema }),
	Schema.Struct({ property: Schema.Literal("color-scheme"), value: ColorSchemeSchema }),
	Schema.Struct({
		property: Schema.Literal("print-color-adjust"),
		value: PrintColorAdjustSchema,
		vendorPrefix: VendorPrefixSchema,
	}),
	Schema.Struct({ property: Schema.Literal("all"), value: CSSWideKeywordSchema }),
	Schema.Struct({ property: Schema.Literal("unparsed"), value: UnparsedPropertySchema }),
	Schema.Struct({ property: Schema.Literal("custom"), value: CustomPropertySchema }),
]);
export const DeclarationBlockSchema = Schema.Struct({
	declarations: Schema.optionalKey(Schema.Array(DeclarationSchema)),
	importantDeclarations: Schema.optionalKey(Schema.Array(DeclarationSchema)),
});
export const DirectionSchema = Schema.Union([Schema.Literal("ltr"), Schema.Literal("rtl")]);
export const DisplayInsideSchema = Schema.TaggedUnion({
	flow: {},
	"flow-root": {},
	table: {},
	flex: { vendorPrefix: VendorPrefixSchema },
	box: { vendorPrefix: VendorPrefixSchema },
	grid: {},
	ruby: {},
});
export const DisplayOutsideSchema = Schema.Literals(["block", "inline", "run-in"]);
export const EllipseSchema = Schema.TaggedUnion({
	size: { x: Schema.Unknown, y: Schema.Unknown },
	extent: { value: ShapeExtentSchema },
});
export const EndingShapeSchema = Schema.TaggedUnion({
	ellipse: { value: EllipseSchema },
	circle: { value: CircleSchema },
});
export const UAEnvironmentVariableSchema = Schema.Union([
	Schema.Literal("safe-area-inset-top"),
	Schema.Literal("safe-area-inset-right"),
	Schema.Literal("safe-area-inset-bottom"),
	Schema.Literal("safe-area-inset-left"),
	Schema.Literal("viewport-segment-width"),
	Schema.Literal("viewport-segment-height"),
	Schema.Literal("viewport-segment-top"),
	Schema.Literal("viewport-segment-left"),
	Schema.Literal("viewport-segment-bottom"),
	Schema.Literal("viewport-segment-right"),
]);
export const EnvironmentVariableNameSchema = Schema.TaggedUnion({
	ua: { value: UAEnvironmentVariableSchema },
	custom: { from: Schema.optionalKey(Schema.Union([SpecifierSchema, Schema.Null])), ident: Schema.Unknown },
	unknown: { value: Schema.String },
});
export const FloatColorSchema = Schema.TaggedUnion({
	rgb: { alpha: Schema.Number, b: Schema.Number, g: Schema.Number, r: Schema.Number },
	hsl: { alpha: Schema.Number, h: Schema.Number, l: Schema.Number, s: Schema.Number },
	hwb: { alpha: Schema.Number, b: Schema.Number, h: Schema.Number, w: Schema.Number },
});
export const FontFormatSchema = Schema.TaggedUnion({
	woff: {},
	woff2: {},
	truetype: {},
	opentype: {},
	"embedded-opentype": {},
	collection: {},
	svg: {},
	string: { value: Schema.String },
});
export const FontTechnologySchema = Schema.Union([
	Schema.Literal("features-opentype"),
	Schema.Literal("features-aat"),
	Schema.Literal("features-graphite"),
	Schema.Literal("color-colrv0"),
	Schema.Literal("color-colrv1"),
	Schema.Literal("color-svg"),
	Schema.Literal("color-sbix"),
	Schema.Literal("color-cbdt"),
	Schema.Literal("variations"),
	Schema.Literal("palettes"),
	Schema.Literal("incremental"),
]);
export const UrlSourceSchema = Schema.Struct({
	format: Schema.optionalKey(Schema.Union([FontFormatSchema, Schema.Null])),
	tech: Schema.Array(FontTechnologySchema),
	url: Schema.Unknown,
});
export const SourceSchema = Schema.TaggedUnion({ url: { value: UrlSourceSchema }, local: { value: FontFamilySchema } });
export const Size2D_for_AngleSchema = Schema.Array(Schema.Unknown);
export const FontStyle2Schema = Schema.TaggedUnion({
	normal: {},
	italic: {},
	oblique: { value: Size2D_for_AngleSchema },
});
export const Size2D_for_FontWeightSchema = Schema.Array(Schema.Unknown);
export const Size2D_for_FontStretchSchema = Schema.Array(Schema.Unknown);
export const UnicodeRangeSchema = Schema.Struct({ end: Schema.Number, start: Schema.Number });
export const FontFacePropertySchema = Schema.TaggedUnion({
	source: { value: Schema.Array(SourceSchema) },
	"font-family": { value: FontFamilySchema },
	"font-style": { value: FontStyle2Schema },
	"font-weight": { value: Size2D_for_FontWeightSchema },
	"font-stretch": { value: Size2D_for_FontStretchSchema },
	"unicode-range": { value: Schema.Array(UnicodeRangeSchema) },
	custom: { value: CustomPropertySchema },
});
export const FontFaceRuleSchema = Schema.Struct({
	loc: Schema.Unknown,
	properties: Schema.Array(FontFacePropertySchema),
});
export const FontFeatureSubruleSchema = Schema.Struct({
	declarations: Schema.Unknown,
	loc: Schema.Unknown,
	name: Schema.Unknown,
});
export const FontFeatureSubruleTypeSchema = Schema.Union([
	Schema.Literal("stylistic"),
	Schema.Literal("historical-forms"),
	Schema.Literal("styleset"),
	Schema.Literal("character-variant"),
	Schema.Literal("swash"),
	Schema.Literal("ornaments"),
	Schema.Literal("annotation"),
]);
export const FontFeatureValuesRuleSchema = Schema.Struct({
	loc: Schema.Unknown,
	name: Schema.Array(Schema.String),
	rules: Schema.Unknown,
});
export const OverrideColorsSchema = Schema.Struct({ color: Schema.Unknown, index: Schema.Number });
export const FontPaletteValuesPropertySchema = Schema.TaggedUnion({
	"font-family": { value: FontFamilySchema },
	"base-palette": { value: BasePaletteSchema },
	"override-colors": { value: Schema.Array(OverrideColorsSchema) },
	custom: { value: CustomPropertySchema },
});
export const FontPaletteValuesRuleSchema = Schema.Struct({
	loc: Schema.Unknown,
	name: Schema.Unknown,
	properties: Schema.Array(FontPaletteValuesPropertySchema),
});
export const GenericFontFamilySchema = Schema.Literals([
	"serif",
	"sans-serif",
	"cursive",
	"fantasy",
	"monospace",
	"system-ui",
	"emoji",
	"math",
	"fangsong",
	"ui-serif",
	"ui-sans-serif",
	"ui-monospace",
	"ui-rounded",
	"initial",
	"inherit",
	"unset",
	"default",
	"revert",
	"revert-layer",
]);
export const HorizontalPositionKeywordSchema = Schema.Union([Schema.Literal("left"), Schema.Literal("right")]);
export const ImportRuleSchema = Schema.Struct({
	layer: Schema.optionalKey(Schema.NullOr(Schema.Array(Schema.String))),
	loc: Schema.Unknown,
	media: Schema.optionalKey(Schema.Unknown),
	supports: Schema.optionalKey(
		Schema.Union([Schema.suspend((): Schema.Codec<SupportsCondition> => SupportsCondition), Schema.Null]),
	),
	url: Schema.Unknown,
});
export const TimelineRangePercentageSchema = Schema.Struct({ name: Schema.Unknown, percentage: Schema.Number });
export const KeyframeSelectorSchema = Schema.TaggedUnion({
	percentage: { value: Schema.Number },
	from: {},
	to: {},
	"timeline-range-percentage": { value: TimelineRangePercentageSchema },
});
export const KeyframeSchema = Schema.Struct({
	declarations: Schema.Unknown,
	selectors: Schema.Array(KeyframeSelectorSchema),
});
export const KeyframesNameSchema = Schema.TaggedUnion({
	ident: { value: Schema.String },
	custom: { value: Schema.String },
});
export const KeyframesRuleSchema = Schema.Struct({
	keyframes: Schema.Array(KeyframeSchema),
	loc: Schema.Unknown,
	name: Schema.Unknown,
	vendorPrefix: Schema.Unknown,
});
export const LABColorSchema = Schema.TaggedUnion({
	lab: { a: Schema.Number, alpha: Schema.Number, b: Schema.Number, l: Schema.Number },
	lch: { alpha: Schema.Number, c: Schema.Number, h: Schema.Number, l: Schema.Number },
	oklab: { a: Schema.Number, alpha: Schema.Number, b: Schema.Number, l: Schema.Number },
	oklch: { alpha: Schema.Number, c: Schema.Number, h: Schema.Number, l: Schema.Number },
});
export const LayerStatementRuleSchema = Schema.Struct({
	loc: Schema.Unknown,
	names: Schema.Array(Schema.Array(Schema.String)),
});
export const LengthUnitSchema = Schema.Union([
	Schema.Literal("px"),
	Schema.Literal("in"),
	Schema.Literal("cm"),
	Schema.Literal("mm"),
	Schema.Literal("q"),
	Schema.Literal("pt"),
	Schema.Literal("pc"),
	Schema.Literal("em"),
	Schema.Literal("rem"),
	Schema.Literal("ex"),
	Schema.Literal("rex"),
	Schema.Literal("ch"),
	Schema.Literal("rch"),
	Schema.Literal("cap"),
	Schema.Literal("rcap"),
	Schema.Literal("ic"),
	Schema.Literal("ric"),
	Schema.Literal("lh"),
	Schema.Literal("rlh"),
	Schema.Literal("vw"),
	Schema.Literal("lvw"),
	Schema.Literal("svw"),
	Schema.Literal("dvw"),
	Schema.Literal("cqw"),
	Schema.Literal("vh"),
	Schema.Literal("lvh"),
	Schema.Literal("svh"),
	Schema.Literal("dvh"),
	Schema.Literal("cqh"),
	Schema.Literal("vi"),
	Schema.Literal("svi"),
	Schema.Literal("lvi"),
	Schema.Literal("dvi"),
	Schema.Literal("cqi"),
	Schema.Literal("vb"),
	Schema.Literal("svb"),
	Schema.Literal("lvb"),
	Schema.Literal("dvb"),
	Schema.Literal("cqb"),
	Schema.Literal("vmin"),
	Schema.Literal("svmin"),
	Schema.Literal("lvmin"),
	Schema.Literal("dvmin"),
	Schema.Literal("cqmin"),
	Schema.Literal("vmax"),
	Schema.Literal("svmax"),
	Schema.Literal("lvmax"),
	Schema.Literal("dvmax"),
	Schema.Literal("cqmax"),
]);
export const LengthValueSchema = Schema.Struct({ unit: Schema.Unknown, value: Schema.Number });
export const LightDarkSchema = Schema.TaggedUnion({ "light-dark": { dark: CssColorSchema, light: CssColorSchema } });
export const VerticalPositionKeywordSchema = Schema.Union([Schema.Literal("top"), Schema.Literal("bottom")]);
export const LineDirectionSchema = Schema.TaggedUnion({
	angle: { value: AngleSchema },
	horizontal: { value: HorizontalPositionKeywordSchema },
	vertical: { value: VerticalPositionKeywordSchema },
	corner: { horizontal: Schema.Unknown, vertical: Schema.Unknown },
});
export const LocationSchema = Schema.Struct({ column: Schema.Number, line: Schema.Number });
export const Location2Schema = Schema.Struct({
	column: Schema.Number,
	line: Schema.Number,
	source_index: Schema.Number,
});
export const MediaFeatureComparisonSchema = Schema.Union([
	Schema.Literal("equal"),
	Schema.Literal("greater-than"),
	Schema.Literal("greater-than-equal"),
	Schema.Literal("less-than"),
	Schema.Literal("less-than-equal"),
]);
export const MediaFeatureIdSchema = Schema.Union([
	Schema.Literal("width"),
	Schema.Literal("height"),
	Schema.Literal("aspect-ratio"),
	Schema.Literal("orientation"),
	Schema.Literal("overflow-block"),
	Schema.Literal("overflow-inline"),
	Schema.Literal("horizontal-viewport-segments"),
	Schema.Literal("vertical-viewport-segments"),
	Schema.Literal("display-mode"),
	Schema.Literal("resolution"),
	Schema.Literal("scan"),
	Schema.Literal("grid"),
	Schema.Literal("update"),
	Schema.Literal("environment-blending"),
	Schema.Literal("color"),
	Schema.Literal("color-index"),
	Schema.Literal("monochrome"),
	Schema.Literal("color-gamut"),
	Schema.Literal("dynamic-range"),
	Schema.Literal("inverted-colors"),
	Schema.Literal("pointer"),
	Schema.Literal("hover"),
	Schema.Literal("any-pointer"),
	Schema.Literal("any-hover"),
	Schema.Literal("nav-controls"),
	Schema.Literal("video-color-gamut"),
	Schema.Literal("video-dynamic-range"),
	Schema.Literal("scripting"),
	Schema.Literal("prefers-reduced-motion"),
	Schema.Literal("prefers-reduced-transparency"),
	Schema.Literal("prefers-contrast"),
	Schema.Literal("forced-colors"),
	Schema.Literal("prefers-color-scheme"),
	Schema.Literal("prefers-reduced-data"),
	Schema.Literal("device-width"),
	Schema.Literal("device-height"),
	Schema.Literal("device-aspect-ratio"),
	Schema.Literal("-webkit-device-pixel-ratio"),
	Schema.Literal("-moz-device-pixel-ratio"),
]);
export const MediaFeatureName_for_ContainerSizeFeatureIdSchema = Schema.Union([
	Schema.Unknown,
	Schema.Unknown,
	Schema.Unknown,
]);
export const MediaFeatureName_for_MediaFeatureIdSchema = Schema.Union([Schema.Unknown, Schema.Unknown, Schema.Unknown]);
export const MediaFeatureName_for_ScrollStateFeatureIdSchema = Schema.Union([
	Schema.Unknown,
	Schema.Unknown,
	Schema.Unknown,
]);
export const ResolutionSchema = Schema.TaggedUnion({
	dpi: { value: Schema.Number },
	dpcm: { value: Schema.Number },
	dppx: { value: Schema.Number },
});
export const MediaFeatureValueSchema = Schema.TaggedUnion({
	length: { value: Schema.suspend((): Schema.Codec<Length> => Length) },
	number: { value: Schema.Number },
	integer: { value: Schema.Number },
	boolean: { value: Schema.Boolean },
	resolution: { value: ResolutionSchema },
	ratio: { value: RatioSchema },
	ident: { value: Schema.String },
	env: { value: Schema.suspend((): Schema.Codec<EnvironmentVariable> => EnvironmentVariable) },
});
export const QualifierSchema = Schema.Union([Schema.Literal("only"), Schema.Literal("not")]);
export const MediaQuerySchema = Schema.Struct({
	condition: Schema.optionalKey(
		Schema.Union([Schema.suspend((): Schema.Codec<MediaCondition> => MediaCondition), Schema.Null]),
	),
	mediaType: Schema.Unknown,
	qualifier: Schema.optionalKey(Schema.Union([QualifierSchema, Schema.Null])),
});
export const MediaListSchema = Schema.Struct({ mediaQueries: Schema.Array(MediaQuerySchema) });
export const MediaTypeSchema = Schema.String;
export const MultiplierSchema = Schema.TaggedUnion({ none: {}, space: {}, comma: {} });
export const NamespaceConstraintSchema = Schema.TaggedUnion({
	any: {},
	specific: { prefix: Schema.String, url: Schema.String },
});
export const NamespaceRuleSchema = Schema.Struct({
	loc: Schema.Unknown,
	prefix: Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])),
	url: Schema.Unknown,
});
export const NavigationSchema = Schema.Union([Schema.Literal("none"), Schema.Literal("auto")]);
export const NestedDeclarationsRuleSchema = Schema.Struct({ declarations: Schema.Unknown, loc: Schema.Unknown });
export const NestingRule_for_DefaultAtRuleSchema = Schema.Struct({ loc: Schema.Unknown, style: Schema.Unknown });
export const OperatorSchema = Schema.Union([Schema.Literal("and"), Schema.Literal("or")]);
export const PageMarginBoxSchema = Schema.Union([
	Schema.Literal("top-left-corner"),
	Schema.Literal("top-left"),
	Schema.Literal("top-center"),
	Schema.Literal("top-right"),
	Schema.Literal("top-right-corner"),
	Schema.Literal("left-top"),
	Schema.Literal("left-middle"),
	Schema.Literal("left-bottom"),
	Schema.Literal("right-top"),
	Schema.Literal("right-middle"),
	Schema.Literal("right-bottom"),
	Schema.Literal("bottom-left-corner"),
	Schema.Literal("bottom-left"),
	Schema.Literal("bottom-center"),
	Schema.Literal("bottom-right"),
	Schema.Literal("bottom-right-corner"),
]);
export const PageMarginRuleSchema = Schema.Struct({
	declarations: Schema.Unknown,
	loc: Schema.Unknown,
	marginBox: Schema.Unknown,
});
export const PagePseudoClassSchema = Schema.Union([
	Schema.Literal("left"),
	Schema.Literal("right"),
	Schema.Literal("first"),
	Schema.Literal("last"),
	Schema.Literal("blank"),
]);
export const PageSelectorSchema = Schema.Struct({
	name: Schema.optionalKey(Schema.Union([Schema.String, Schema.Null])),
	pseudoClasses: Schema.Array(PagePseudoClassSchema),
});
export const PageRuleSchema = Schema.Struct({
	declarations: Schema.Unknown,
	loc: Schema.Unknown,
	rules: Schema.Array(PageMarginRuleSchema),
	selectors: Schema.Array(PageSelectorSchema),
});
export const ParsedCaseSensitivitySchema = Schema.Literals([
	"explicit-case-sensitive",
	"ascii-case-insensitive",
	"case-sensitive",
	"ascii-case-insensitive-if-in-html-element-in-html-document",
]);
export const PredefinedColorSchema = Schema.TaggedUnion({
	srgb: { alpha: Schema.Number, b: Schema.Number, g: Schema.Number, r: Schema.Number },
	"srgb-linear": { alpha: Schema.Number, b: Schema.Number, g: Schema.Number, r: Schema.Number },
	"display-p3": { alpha: Schema.Number, b: Schema.Number, g: Schema.Number, r: Schema.Number },
	"a98-rgb": { alpha: Schema.Number, b: Schema.Number, g: Schema.Number, r: Schema.Number },
	"prophoto-rgb": { alpha: Schema.Number, b: Schema.Number, g: Schema.Number, r: Schema.Number },
	rec2020: { alpha: Schema.Number, b: Schema.Number, g: Schema.Number, r: Schema.Number },
	"xyz-d50": { alpha: Schema.Number, x: Schema.Number, y: Schema.Number, z: Schema.Number },
	"xyz-d65": { alpha: Schema.Number, x: Schema.Number, y: Schema.Number, z: Schema.Number },
});
export const PropertyRuleSchema = Schema.Struct({
	inherits: Schema.Boolean,
	initialValue: Schema.optionalKey(
		Schema.Union([Schema.suspend((): Schema.Codec<ParsedComponent> => ParsedComponent), Schema.Null]),
	),
	loc: Schema.Unknown,
	name: Schema.Unknown,
	syntax: Schema.Unknown,
});
export const WebKitScrollbarPseudoClassSchema = Schema.Union([
	Schema.Literal("horizontal"),
	Schema.Literal("vertical"),
	Schema.Literal("decrement"),
	Schema.Literal("increment"),
	Schema.Literal("start"),
	Schema.Literal("end"),
	Schema.Literal("double-button"),
	Schema.Literal("single-button"),
	Schema.Literal("no-button"),
	Schema.Literal("corner-present"),
	Schema.Literal("window-inactive"),
]);
export const PseudoClassSchema = Schema.Union([
	Schema.Struct({ kind: Schema.Literal("lang"), languages: Schema.Array(Schema.String) }),
	Schema.Struct({ direction: Schema.Unknown, kind: Schema.Literal("dir") }),
	Schema.Struct({ kind: Schema.Literal("hover") }),
	Schema.Struct({ kind: Schema.Literal("active") }),
	Schema.Struct({ kind: Schema.Literal("focus") }),
	Schema.Struct({ kind: Schema.Literal("focus-visible") }),
	Schema.Struct({ kind: Schema.Literal("focus-within") }),
	Schema.Struct({ kind: Schema.Literal("current") }),
	Schema.Struct({ kind: Schema.Literal("past") }),
	Schema.Struct({ kind: Schema.Literal("future") }),
	Schema.Struct({ kind: Schema.Literal("playing") }),
	Schema.Struct({ kind: Schema.Literal("paused") }),
	Schema.Struct({ kind: Schema.Literal("seeking") }),
	Schema.Struct({ kind: Schema.Literal("buffering") }),
	Schema.Struct({ kind: Schema.Literal("stalled") }),
	Schema.Struct({ kind: Schema.Literal("muted") }),
	Schema.Struct({ kind: Schema.Literal("volume-locked") }),
	Schema.Struct({ kind: Schema.Literal("fullscreen"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ kind: Schema.Literal("open") }),
	Schema.Struct({ kind: Schema.Literal("closed") }),
	Schema.Struct({ kind: Schema.Literal("modal") }),
	Schema.Struct({ kind: Schema.Literal("picture-in-picture") }),
	Schema.Struct({ kind: Schema.Literal("popover-open") }),
	Schema.Struct({ kind: Schema.Literal("defined") }),
	Schema.Struct({ kind: Schema.Literal("any-link"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ kind: Schema.Literal("link") }),
	Schema.Struct({ kind: Schema.Literal("local-link") }),
	Schema.Struct({ kind: Schema.Literal("target") }),
	Schema.Struct({ kind: Schema.Literal("target-within") }),
	Schema.Struct({ kind: Schema.Literal("visited") }),
	Schema.Struct({ kind: Schema.Literal("enabled") }),
	Schema.Struct({ kind: Schema.Literal("disabled") }),
	Schema.Struct({ kind: Schema.Literal("read-only"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ kind: Schema.Literal("read-write"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ kind: Schema.Literal("placeholder-shown"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ kind: Schema.Literal("default") }),
	Schema.Struct({ kind: Schema.Literal("checked") }),
	Schema.Struct({ kind: Schema.Literal("indeterminate") }),
	Schema.Struct({ kind: Schema.Literal("blank") }),
	Schema.Struct({ kind: Schema.Literal("valid") }),
	Schema.Struct({ kind: Schema.Literal("invalid") }),
	Schema.Struct({ kind: Schema.Literal("in-range") }),
	Schema.Struct({ kind: Schema.Literal("out-of-range") }),
	Schema.Struct({ kind: Schema.Literal("required") }),
	Schema.Struct({ kind: Schema.Literal("optional") }),
	Schema.Struct({ kind: Schema.Literal("user-valid") }),
	Schema.Struct({ kind: Schema.Literal("user-invalid") }),
	Schema.Struct({ kind: Schema.Literal("autofill"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ kind: Schema.Literal("active-view-transition") }),
	Schema.Struct({ kind: Schema.Literal("active-view-transition-type"), type: Schema.Array(Schema.String) }),
	Schema.Struct({ kind: Schema.Literal("state"), state: Schema.Unknown }),
	Schema.Struct({ kind: Schema.Literal("local"), selector: Schema.Unknown }),
	Schema.Struct({ kind: Schema.Literal("global"), selector: Schema.Unknown }),
	Schema.Struct({ kind: Schema.Literal("webkit-scrollbar"), value: WebKitScrollbarPseudoClassSchema }),
	Schema.Struct({ kind: Schema.Literal("custom"), name: Schema.Unknown }),
	Schema.Struct({
		arguments: Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue)),
		kind: Schema.Literal("custom-function"),
		name: Schema.Unknown,
	}),
]);
export const WebKitScrollbarPseudoElementSchema = Schema.Union([
	Schema.Literal("scrollbar"),
	Schema.Literal("button"),
	Schema.Literal("track"),
	Schema.Literal("track-piece"),
	Schema.Literal("thumb"),
	Schema.Literal("corner"),
	Schema.Literal("resizer"),
]);
export const PseudoElementSchema = Schema.Union([
	Schema.Struct({ kind: Schema.Literal("after") }),
	Schema.Struct({ kind: Schema.Literal("before") }),
	Schema.Struct({ kind: Schema.Literal("first-line") }),
	Schema.Struct({ kind: Schema.Literal("first-letter") }),
	Schema.Struct({ kind: Schema.Literal("details-content") }),
	Schema.Struct({ kind: Schema.Literal("target-text") }),
	Schema.Struct({ kind: Schema.Literal("selection"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ kind: Schema.Literal("placeholder"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ kind: Schema.Literal("highlight-function"), name: Schema.Unknown }),
	Schema.Struct({ kind: Schema.Literal("marker") }),
	Schema.Struct({ kind: Schema.Literal("backdrop"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ kind: Schema.Literal("file-selector-button"), vendorPrefix: VendorPrefixSchema }),
	Schema.Struct({ kind: Schema.Literal("webkit-scrollbar"), value: WebKitScrollbarPseudoElementSchema }),
	Schema.Struct({ kind: Schema.Literal("cue") }),
	Schema.Struct({ kind: Schema.Literal("cue-region") }),
	Schema.Struct({ kind: Schema.Literal("cue-function"), selector: Schema.Unknown }),
	Schema.Struct({ kind: Schema.Literal("cue-region-function"), selector: Schema.Unknown }),
	Schema.Struct({ kind: Schema.Literal("view-transition") }),
	Schema.Struct({ kind: Schema.Literal("view-transition-group"), part: Schema.Unknown }),
	Schema.Struct({ kind: Schema.Literal("view-transition-image-pair"), part: Schema.Unknown }),
	Schema.Struct({ kind: Schema.Literal("view-transition-old"), part: Schema.Unknown }),
	Schema.Struct({ kind: Schema.Literal("view-transition-new"), part: Schema.Unknown }),
	Schema.Struct({ identifier: Schema.Unknown, kind: Schema.Literal("picker-function") }),
	Schema.Struct({ kind: Schema.Literal("picker-icon") }),
	Schema.Struct({ kind: Schema.Literal("checkmark") }),
	Schema.Struct({ kind: Schema.Literal("grammar-error") }),
	Schema.Struct({ kind: Schema.Literal("spelling-error") }),
	Schema.Struct({ kind: Schema.Literal("custom"), name: Schema.Unknown }),
	Schema.Struct({
		arguments: Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue)),
		kind: Schema.Literal("custom-function"),
		name: Schema.Unknown,
	}),
]);
export const QueryFeature_for_ContainerSizeFeatureIdSchema = Schema.TaggedUnion({
	plain: { name: Schema.Unknown, value: Schema.Unknown },
	boolean: { name: Schema.Unknown },
	range: { name: Schema.Unknown, operator: Schema.Unknown, value: Schema.Unknown },
	interval: {
		end: Schema.Unknown,
		endOperator: Schema.Unknown,
		name: Schema.Unknown,
		start: Schema.Unknown,
		startOperator: Schema.Unknown,
	},
});
export const QueryFeature_for_MediaFeatureIdSchema = Schema.TaggedUnion({
	plain: { name: Schema.Unknown, value: Schema.Unknown },
	boolean: { name: Schema.Unknown },
	range: { name: Schema.Unknown, operator: Schema.Unknown, value: Schema.Unknown },
	interval: {
		end: Schema.Unknown,
		endOperator: Schema.Unknown,
		name: Schema.Unknown,
		start: Schema.Unknown,
		startOperator: Schema.Unknown,
	},
});
export const QueryFeature_for_ScrollStateFeatureIdSchema = Schema.TaggedUnion({
	plain: { name: Schema.Unknown, value: Schema.Unknown },
	boolean: { name: Schema.Unknown },
	range: { name: Schema.Unknown, operator: Schema.Unknown, value: Schema.Unknown },
	interval: {
		end: Schema.Unknown,
		endOperator: Schema.Unknown,
		name: Schema.Unknown,
		start: Schema.Unknown,
		startOperator: Schema.Unknown,
	},
});
export const RGBColorSchema = Schema.TaggedUnion({
	rgb: { alpha: Schema.Number, b: Schema.Number, g: Schema.Number, r: Schema.Number },
});
export const Rect_for_DimensionPercentage_for_LengthValueSchema = Schema.Array(Schema.Unknown);
export const Rect_for_NumberOrPercentageSchema = Schema.Array(Schema.Unknown);
export const RepeatCountSchema = Schema.TaggedUnion({
	number: { value: Schema.Number },
	"auto-fill": {},
	"auto-fit": {},
});
export const RoundingStrategySchema = Schema.Union([
	Schema.Literal("nearest"),
	Schema.Literal("up"),
	Schema.Literal("down"),
	Schema.Literal("to-zero"),
]);
export const ScrollAxisSchema = Schema.Union([
	Schema.Literal("block"),
	Schema.Literal("inline"),
	Schema.Literal("x"),
	Schema.Literal("y"),
]);
export const ScrollStateFeatureIdSchema = Schema.Union([
	Schema.Literal("stuck"),
	Schema.Literal("snapped"),
	Schema.Literal("scrollable"),
	Schema.Literal("scrolled"),
]);
export const ScrollerSchema = Schema.Union([Schema.Literal("root"), Schema.Literal("nearest"), Schema.Literal("self")]);
export const SelectorListSchema = Schema.Array(Schema.suspend((): Schema.Codec<Selector> => Selector));
export const SelfPositionSchema = Schema.Union([
	Schema.Literal("center"),
	Schema.Literal("start"),
	Schema.Literal("end"),
	Schema.Literal("self-start"),
	Schema.Literal("self-end"),
	Schema.Literal("flex-start"),
	Schema.Literal("flex-end"),
]);
export const ShapeRadiusSchema = Schema.TaggedUnion({
	"length-percentage": {
		value: Schema.suspend((): Schema.Codec<DimensionPercentage_for_LengthValue> => DimensionPercentage_for_LengthValue),
	},
	"closest-side": {},
	"farthest-side": {},
});
export const Size2D_for_LengthPercentageOrAutoSchema = Schema.Array(Schema.Unknown);
export const StepPositionSchema = Schema.TaggedUnion({ start: {}, end: {}, "jump-none": {}, "jump-both": {} });
export const SymbolsTypeSchema = Schema.Literals(["cyclic", "numeric", "alphabetic", "symbolic", "fixed"]);
export const SyntaxComponentSchema = Schema.Struct({ kind: Schema.Unknown, multiplier: Schema.Unknown });
export const SyntaxComponentKindSchema = Schema.TaggedUnion({
	length: {},
	number: {},
	percentage: {},
	"length-percentage": {},
	string: {},
	color: {},
	image: {},
	url: {},
	integer: {},
	angle: {},
	time: {},
	resolution: {},
	"transform-function": {},
	"transform-list": {},
	"custom-ident": {},
	literal: { value: Schema.String },
});
export const SyntaxStringSchema = Schema.TaggedUnion({
	components: { value: Schema.Array(SyntaxComponentSchema) },
	universal: {},
});
export const SystemColorSchema = Schema.Union([
	Schema.Literal("accentcolor"),
	Schema.Literal("accentcolortext"),
	Schema.Literal("activetext"),
	Schema.Literal("buttonborder"),
	Schema.Literal("buttonface"),
	Schema.Literal("buttontext"),
	Schema.Literal("canvas"),
	Schema.Literal("canvastext"),
	Schema.Literal("field"),
	Schema.Literal("fieldtext"),
	Schema.Literal("graytext"),
	Schema.Literal("highlight"),
	Schema.Literal("highlighttext"),
	Schema.Literal("linktext"),
	Schema.Literal("mark"),
	Schema.Literal("marktext"),
	Schema.Literal("selecteditem"),
	Schema.Literal("selecteditemtext"),
	Schema.Literal("visitedtext"),
	Schema.Literal("activeborder"),
	Schema.Literal("activecaption"),
	Schema.Literal("appworkspace"),
	Schema.Literal("background"),
	Schema.Literal("buttonhighlight"),
	Schema.Literal("buttonshadow"),
	Schema.Literal("captiontext"),
	Schema.Literal("inactiveborder"),
	Schema.Literal("inactivecaption"),
	Schema.Literal("inactivecaptiontext"),
	Schema.Literal("infobackground"),
	Schema.Literal("infotext"),
	Schema.Literal("menu"),
	Schema.Literal("menutext"),
	Schema.Literal("scrollbar"),
	Schema.Literal("threeddarkshadow"),
	Schema.Literal("threedface"),
	Schema.Literal("threedhighlight"),
	Schema.Literal("threedlightshadow"),
	Schema.Literal("threedshadow"),
	Schema.Literal("window"),
	Schema.Literal("windowframe"),
	Schema.Literal("windowtext"),
]);
export const TextEmphasisFillModeSchema = Schema.Union([Schema.Literal("filled"), Schema.Literal("open")]);
export const TextEmphasisPositionHorizontalSchema = Schema.Union([Schema.Literal("left"), Schema.Literal("right")]);
export const TextEmphasisPositionVerticalSchema = Schema.Union([Schema.Literal("over"), Schema.Literal("under")]);
export const TextTransformCaseSchema = Schema.Union([
	Schema.Literal("none"),
	Schema.Literal("uppercase"),
	Schema.Literal("lowercase"),
	Schema.Literal("capitalize"),
]);
export const TimelineRangeNameSchema = Schema.Union([
	Schema.Literal("cover"),
	Schema.Literal("contain"),
	Schema.Literal("entry"),
	Schema.Literal("exit"),
	Schema.Literal("entry-crossing"),
	Schema.Literal("exit-crossing"),
]);
export const TokenSchema = Schema.TaggedUnion({
	ident: { value: Schema.String },
	"at-keyword": { value: Schema.String },
	hash: { value: Schema.String },
	"id-hash": { value: Schema.String },
	string: { value: Schema.String },
	"unquoted-url": { value: Schema.String },
	delim: { value: Schema.String },
	number: { value: Schema.Number },
	percentage: { value: Schema.Number },
	dimension: { unit: Schema.Unknown, value: Schema.Number },
	"white-space": { value: Schema.String },
	comment: { value: Schema.String },
	colon: {},
	semicolon: {},
	comma: {},
	"include-match": {},
	"dash-match": {},
	"prefix-match": {},
	"suffix-match": {},
	"substring-match": {},
	cdo: {},
	cdc: {},
	function: { value: Schema.String },
	"parenthesis-block": {},
	"square-bracket-block": {},
	"curly-bracket-block": {},
	"bad-url": { value: Schema.String },
	"bad-string": { value: Schema.String },
	"close-parenthesis": {},
	"close-square-bracket": {},
	"close-curly-bracket": {},
});
export const UnknownAtRuleSchema = Schema.Struct({
	block: Schema.optionalKey(
		Schema.NullOr(Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue))),
	),
	loc: Schema.Unknown,
	name: Schema.Unknown,
	prelude: Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue)),
});
export const ViewTransitionPartNameSchema = Schema.String;
export const ViewTransitionPartSelectorSchema = Schema.Struct({
	classes: Schema.Array(Schema.String),
	name: Schema.optionalKey(Schema.Union([ViewTransitionPartNameSchema, Schema.Null])),
});
export const ViewTransitionPropertySchema = Schema.Union([
	Schema.Struct({ property: Schema.Literal("navigation"), value: NavigationSchema }),
	Schema.Struct({ property: Schema.Literal("types"), value: NoneOrCustomIdentListSchema }),
	Schema.Struct({ property: Schema.Literal("custom"), value: CustomPropertySchema }),
]);
export const ViewTransitionRuleSchema = Schema.Struct({
	loc: Schema.Unknown,
	properties: Schema.Array(ViewTransitionPropertySchema),
});
export const ViewportRuleSchema = Schema.Struct({
	declarations: Schema.Unknown,
	loc: Schema.Unknown,
	vendorPrefix: Schema.Unknown,
});
export const WebKitGradientPointSchema = Schema.Struct({ x: Schema.Unknown, y: Schema.Unknown });
export const WebKitGradientPointComponent_for_HorizontalPositionKeywordSchema = Schema.TaggedUnion({
	center: {},
	number: { value: NumberOrPercentageSchema },
	side: { value: HorizontalPositionKeywordSchema },
});
export const WebKitGradientPointComponent_for_VerticalPositionKeywordSchema = Schema.TaggedUnion({
	center: {},
	number: { value: NumberOrPercentageSchema },
	side: { value: VerticalPositionKeywordSchema },
});

export const DefaultAtRuleSchema = Schema.Unknown;
