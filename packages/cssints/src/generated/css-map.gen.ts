import type { Style } from "./core/style.js";
import type { PropertyValueTypeMap } from "./types.gen.js";

/**
 * CSS Property Map
 * Provides type-safe access to CSS property functions
 */
export const CSS = {
	/** Sets the color of the elements accent */
	"accent-color": accentColor,
	/** Aligns a flex container's lines within the flex container when there is extra space in the cross-axis, similar to how 'justify-content' aligns individual items within the main-axis. */
	"align-content": alignContent,
	/** Aligns flex items along the cross axis of the current line of the flex container. */
	"align-items": alignItems,
	/** Allows the default alignment along the cross axis to be overridden for individual flex items. */
	"align-self": alignSelf,
	/** The align-tracks CSS property sets the alignment in the masonry axis for grid containers that have masonry in their block axis. */
	"align-tracks": alignTracks,
	/** Shorthand that resets all properties except 'direction' and 'unicode-bidi'. */
	all: all,
	/** The anchor-name property declares that an element is an anchor element, and gives it a list of anchor names to be targeted by. */
	"anchor-name": anchorName,
	/** This property scopes the specified anchor names, and lookups for these anchor names, to this element’s subtree */
	"anchor-scope": anchorScope,
	/** Shorthand property combines six of the animation properties into a single property. */
	animation: animation,
	/** The composite operation to use when multiple animations affect the same property. */
	"animation-composition": animationComposition,
	/** Defines when the animation will start. */
	"animation-delay": animationDelay,
	/** Defines whether or not the animation should play in reverse on alternate cycles. */
	"animation-direction": animationDirection,
	/** Defines the length of time that an animation takes to complete one cycle. */
	"animation-duration": animationDuration,
	/** Defines what values are applied by the animation outside the time it is executing. */
	"animation-fill-mode": animationFillMode,
	/** Defines the number of times an animation cycle is played. The default value is one, meaning the animation will play from beginning to end once. */
	"animation-iteration-count": animationIterationCount,
	/** Defines a list of animations that apply. Each name is used to select the keyframe at-rule that provides the property values for the animation. */
	"animation-name": animationName,
	/** Defines whether the animation is running or paused. */
	"animation-play-state": animationPlayState,
	/** The animation-range CSS shorthand property is used to set the start and end of an animation's attachment range along its timeline, i.e. where along the timeline an animation will start and end. */
	"animation-range": animationRange,
	/** The animation-range-end CSS property is used to set the end of an animation's attachment range along its timeline, i.e. where along the timeline an animation will end. */
	"animation-range-end": animationRangeEnd,
	/** The animation-range-start CSS property is used to set the start of an animation's attachment range along its timeline, i.e. where along the timeline an animation will start. */
	"animation-range-start": animationRangeStart,
	/** Describes how the animation will progress over one cycle of its duration. */
	"animation-timing-function": animationTimingFunction,
	/** Specifies the names of one or more @scroll-timeline at-rules to describe the element's scroll animations. */
	"animation-timeline": animationTimeline,
	/** Changes the appearance of buttons and other controls to resemble native controls. */
	appearance: appearance,
	/** The aspect-ratio   CSS property sets a preferred aspect ratio for the box, which will be used in the calculation of auto sizes and some other layout functions. */
	"aspect-ratio": aspectRatio,
	/** azimuth */
	azimuth: azimuth,
	/** The backdrop-filter CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element. Because it applies to everything behind the element, to see the effect you must make the element or its background at least partially transparent. */
	"backdrop-filter": backdropFilter,
	/** Determines whether or not the 'back' side of a transformed element is visible when facing the viewer. With an identity transform, the front side of an element faces the viewer. */
	"backface-visibility": backfaceVisibility,
	/** Shorthand property for setting most background properties at the same place in the style sheet. */
	background: background,
	/** Specifies whether the background images are fixed with regard to the viewport ('fixed') or scroll along with the element ('scroll') or its contents ('local'). */
	"background-attachment": backgroundAttachment,
	/** Defines the blending mode of each background layer. */
	"background-blend-mode": backgroundBlendMode,
	/** Determines the background painting area. */
	"background-clip": backgroundClip,
	/** Sets the background color of an element. */
	"background-color": backgroundColor,
	/** Sets the background image(s) of an element. */
	"background-image": backgroundImage,
	/** For elements rendered as a single box, specifies the background positioning area. For elements rendered as multiple boxes (e.g., inline boxes on several lines, boxes on several pages) specifies which boxes 'box-decoration-break' operates on to determine the background positioning area(s). */
	"background-origin": backgroundOrigin,
	/** Specifies the initial position of the background image(s) (after any resizing) within their corresponding background positioning area. */
	"background-position": backgroundPosition,
	/** If background images have been specified, this property specifies their initial position (after any resizing) within their corresponding background positioning area. */
	"background-position-x": backgroundPositionX,
	/** If background images have been specified, this property specifies their initial position (after any resizing) within their corresponding background positioning area. */
	"background-position-y": backgroundPositionY,
	/** Specifies how background images are tiled after they have been sized and positioned. */
	"background-repeat": backgroundRepeat,
	/** Specifies the size of the background images. */
	"background-size": backgroundSize,
	/** Size of an element in the direction opposite that of the direction specified by 'writing-mode'. */
	"block-size": blockSize,
	/** Shorthand property for setting border width, style, and color. */
	border: border,
	/** The border-block CSS property is a shorthand property for setting the individual logical block border property values in a single place in the style sheet. */
	"border-block": borderBlock,
	/** The border-block-color CSS property defines the color of the logical block borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-color and border-bottom-color, or border-right-color and border-left-color property depending on the values defined for writing-mode, direction, and text-orientation. */
	"border-block-color": borderBlockColor,
	/** The border-block-style CSS property defines the style of the logical block borders of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-style and border-bottom-style, or border-left-style and border-right-style properties depending on the values defined for writing-mode, direction, and text-orientation. */
	"border-block-style": borderBlockStyle,
	/** The border-block-width CSS property defines the width of the logical block borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-width and border-bottom-width, or border-left-width, and border-right-width property depending on the values defined for writing-mode, direction, and text-orientation. */
	"border-block-width": borderBlockWidth,
	/** Logical 'border-bottom'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-block-end": borderBlockEnd,
	/** Logical 'border-bottom-color'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-block-end-color": borderBlockEndColor,
	/** Logical 'border-bottom-style'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-block-end-style": borderBlockEndStyle,
	/** Logical 'border-bottom-width'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-block-end-width": borderBlockEndWidth,
	/** Logical 'border-top'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-block-start": borderBlockStart,
	/** Logical 'border-top-color'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-block-start-color": borderBlockStartColor,
	/** Logical 'border-top-style'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-block-start-style": borderBlockStartStyle,
	/** Logical 'border-top-width'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-block-start-width": borderBlockStartWidth,
	/** Shorthand property for setting border width, style and color. */
	"border-bottom": borderBottom,
	/** Sets the color of the bottom border. */
	"border-bottom-color": borderBottomColor,
	/** Defines the radii of the bottom left outer border edge. */
	"border-bottom-left-radius": borderBottomLeftRadius,
	/** Defines the radii of the bottom right outer border edge. */
	"border-bottom-right-radius": borderBottomRightRadius,
	/** Sets the style of the bottom border. */
	"border-bottom-style": borderBottomStyle,
	/** Sets the thickness of the bottom border. */
	"border-bottom-width": borderBottomWidth,
	/** Selects a table's border model. */
	"border-collapse": borderCollapse,
	/** The color of the border around all four edges of an element. */
	"border-color": borderColor,
	/** The border-end-end-radius CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on on the element's writing-mode, direction, and text-orientation. */
	"border-end-end-radius": borderEndEndRadius,
	/** The border-end-start-radius CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's writing-mode, direction, and text-orientation. */
	"border-end-start-radius": borderEndStartRadius,
	/** Shorthand property for setting 'border-image-source', 'border-image-slice', 'border-image-width', 'border-image-outset' and 'border-image-repeat'. Omitted values are set to their initial values. */
	"border-image": borderImage,
	/** The values specify the amount by which the border image area extends beyond the border box on the top, right, bottom, and left sides respectively. If the fourth value is absent, it is the same as the second. If the third one is also absent, it is the same as the first. If the second one is also absent, it is the same as the first. Numbers represent multiples of the corresponding border-width. */
	"border-image-outset": borderImageOutset,
	/** Specifies how the images for the sides and the middle part of the border image are scaled and tiled. If the second keyword is absent, it is assumed to be the same as the first. */
	"border-image-repeat": borderImageRepeat,
	/** Specifies inward offsets from the top, right, bottom, and left edges of the image, dividing it into nine regions: four corners, four edges and a middle. */
	"border-image-slice": borderImageSlice,
	/** Specifies an image to use instead of the border styles given by the 'border-style' properties and as an additional background layer for the element. If the value is 'none' or if the image cannot be displayed, the border styles will be used. */
	"border-image-source": borderImageSource,
	/** The four values of 'border-image-width' specify offsets that are used to divide the border image area into nine parts. They represent inward distances from the top, right, bottom, and left sides of the area, respectively. */
	"border-image-width": borderImageWidth,
	/** The border-inline CSS property is a shorthand property for setting the individual logical inline border property values in a single place in the style sheet. */
	"border-inline": borderInline,
	/** Logical 'border-right'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-inline-end": borderInlineEnd,
	/** The border-inline-color CSS property defines the color of the logical inline borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-color and border-bottom-color, or border-right-color and border-left-color property depending on the values defined for writing-mode, direction, and text-orientation. */
	"border-inline-color": borderInlineColor,
	/** The border-inline-style CSS property defines the style of the logical inline borders of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-style and border-bottom-style, or border-left-style and border-right-style properties depending on the values defined for writing-mode, direction, and text-orientation. */
	"border-inline-style": borderInlineStyle,
	/** The border-inline-width CSS property defines the width of the logical inline borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-width and border-bottom-width, or border-left-width, and border-right-width property depending on the values defined for writing-mode, direction, and text-orientation. */
	"border-inline-width": borderInlineWidth,
	/** Logical 'border-right-color'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-inline-end-color": borderInlineEndColor,
	/** Logical 'border-right-style'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-inline-end-style": borderInlineEndStyle,
	/** Logical 'border-right-width'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-inline-end-width": borderInlineEndWidth,
	/** Logical 'border-left'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-inline-start": borderInlineStart,
	/** Logical 'border-left-color'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-inline-start-color": borderInlineStartColor,
	/** Logical 'border-left-style'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-inline-start-style": borderInlineStartStyle,
	/** Logical 'border-left-width'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"border-inline-start-width": borderInlineStartWidth,
	/** Shorthand property for setting border width, style and color */
	"border-left": borderLeft,
	/** Sets the color of the left border. */
	"border-left-color": borderLeftColor,
	/** Sets the style of the left border. */
	"border-left-style": borderLeftStyle,
	/** Sets the thickness of the left border. */
	"border-left-width": borderLeftWidth,
	/** Defines the radii of the outer border edge. */
	"border-radius": borderRadius,
	/** Shorthand property for setting border width, style and color */
	"border-right": borderRight,
	/** Sets the color of the right border. */
	"border-right-color": borderRightColor,
	/** Sets the style of the right border. */
	"border-right-style": borderRightStyle,
	/** Sets the thickness of the right border. */
	"border-right-width": borderRightWidth,
	/** The lengths specify the distance that separates adjoining cell borders. If one length is specified, it gives both the horizontal and vertical spacing. If two are specified, the first gives the horizontal spacing and the second the vertical spacing. Lengths may not be negative. */
	"border-spacing": borderSpacing,
	/** The border-start-end-radius CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's writing-mode, direction, and text-orientation. */
	"border-start-end-radius": borderStartEndRadius,
	/** The border-start-start-radius CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on the element's writing-mode, direction, and text-orientation. */
	"border-start-start-radius": borderStartStartRadius,
	/** The style of the border around edges of an element. */
	"border-style": borderStyle,
	/** Shorthand property for setting border width, style and color */
	"border-top": borderTop,
	/** Sets the color of the top border. */
	"border-top-color": borderTopColor,
	/** Defines the radii of the top left outer border edge. */
	"border-top-left-radius": borderTopLeftRadius,
	/** Defines the radii of the top right outer border edge. */
	"border-top-right-radius": borderTopRightRadius,
	/** Sets the style of the top border. */
	"border-top-style": borderTopStyle,
	/** Sets the thickness of the top border. */
	"border-top-width": borderTopWidth,
	/** Shorthand that sets the four 'border-*-width' properties. If it has four values, they set top, right, bottom and left in that order. If left is missing, it is the same as right; if bottom is missing, it is the same as top; if right is missing, it is the same as top. */
	"border-width": borderWidth,
	/** Specifies how far an absolutely positioned box's bottom margin edge is offset above the bottom edge of the box's 'containing block'. */
	bottom: bottom,
	/** The box-align CSS property specifies how an element aligns its contents across its layout in a perpendicular direction. The effect of the property is only visible if there is extra space in the box. */
	"box-align": boxAlign,
	/** Specifies whether individual boxes are treated as broken pieces of one continuous box, or whether each box is individually wrapped with the border and padding. */
	"box-decoration-break": boxDecorationBreak,
	/** The box-direction CSS property specifies whether a box lays out its contents normally (from the top or left edge), or in reverse (from the bottom or right edge). */
	"box-direction": boxDirection,
	/** The -moz-box-flex and -webkit-box-flex CSS properties specify how a -moz-box or -webkit-box grows to fill the box that contains it, in the direction of the containing box's layout. */
	"box-flex": boxFlex,
	/** The box-flex-group CSS property assigns the flexbox's child elements to a flex group. */
	"box-flex-group": boxFlexGroup,
	/** The box-lines CSS property determines whether the box may have a single or multiple lines (rows for horizontally oriented boxes, columns for vertically oriented boxes). */
	"box-lines": boxLines,
	/** The box-ordinal-group CSS property assigns the flexbox's child elements to an ordinal group. */
	"box-ordinal-group": boxOrdinalGroup,
	/** The box-orient CSS property specifies whether an element lays out its contents horizontally or vertically. */
	"box-orient": boxOrient,
	/** The -moz-box-pack and -webkit-box-pack CSS properties specify how a -moz-box or -webkit-box packs its contents in the direction of its layout. The effect of this is only visible if there is extra space in the box. */
	"box-pack": boxPack,
	/** Attaches one or more drop-shadows to the box. The property is a comma-separated list of shadows, each specified by 2-4 length values, an optional color, and an optional 'inset' keyword. Omitted lengths are 0; omitted colors are a user agent chosen color. */
	"box-shadow": boxShadow,
	/** Specifies the behavior of the 'width' and 'height' properties. */
	"box-sizing": boxSizing,
	/** Describes the page/column/region break behavior after the generated box. */
	"break-after": breakAfter,
	/** Describes the page/column/region break behavior before the generated box. */
	"break-before": breakBefore,
	/** Describes the page/column/region break behavior inside the principal box. */
	"break-inside": breakInside,
	/** Specifies the position of the caption box with respect to the table box. */
	"caption-side": captionSide,
	/** Shorthand for setting caret-color and caret-shape. */
	caret: caret,
	/** Controls the color of the text insertion indicator. */
	"caret-color": caretColor,
	/** Specifies the desired shape of the text insertion caret. */
	"caret-shape": caretShape,
	/** Indicates which sides of an element's box(es) may not be adjacent to an earlier floating box. The 'clear' property does not consider floats inside the element itself or in other block formatting contexts. */
	clear: clear,
	/** Deprecated. Use the 'clip-path' property when support allows. Defines the visible portion of an element's box. */
	clip: clip,
	/** Specifies a clipping path where everything inside the path is visible and everything outside is clipped out. */
	"clip-path": clipPath,
	/** Indicates the algorithm which is to be used to determine what parts of the canvas are included inside the shape. */
	"clip-rule": clipRule,
	/** Sets the color of an element's text */
	color: color,
	/** Specifies the color space for imaging operations performed via filter effects. */
	"color-interpolation-filters": colorInterpolationFilters,
	/** The color-scheme CSS property allows an element to indicate which color schemes it can comfortably be rendered in. */
	"color-scheme": colorScheme,
	/** Describes the optimal number of columns into which the content of the element will be flowed. */
	"column-count": columnCount,
	/** In continuous media, this property will only be consulted if the length of columns has been constrained. Otherwise, columns will automatically be balanced. */
	"column-fill": columnFill,
	/** Sets the gap between columns. If there is a column rule between columns, it will appear in the middle of the gap. */
	"column-gap": columnGap,
	/** Shorthand for setting 'column-rule-width', 'column-rule-style', and 'column-rule-color' at the same place in the style sheet. Omitted values are set to their initial values. */
	"column-rule": columnRule,
	/** Sets the color of the column rule */
	"column-rule-color": columnRuleColor,
	/** Sets the style of the rule between columns of an element. */
	"column-rule-style": columnRuleStyle,
	/** Sets the width of the rule between columns. Negative values are not allowed. */
	"column-rule-width": columnRuleWidth,
	/** Describes the page/column break behavior after the generated box. */
	"column-span": columnSpan,
	/** Describes the width of columns in multicol elements. */
	"column-width": columnWidth,
	/** A shorthand property which sets both 'column-width' and 'column-count'. */
	columns: columns,
	/** Indicates that an element and its contents are, as much as possible, independent of the rest of the document tree. */
	contain: contain,
	/** Size of an element when the element is subject to size containment. */
	"contain-intrinsic-size": containIntrinsicSize,
	/** Block size of an element when the element is subject to size containment. */
	"contain-intrinsic-block-size": containIntrinsicBlockSize,
	/** Height of an element when the element is subject to size containment. */
	"contain-intrinsic-height": containIntrinsicHeight,
	/** Inline size of an element when the element is subject to size containment. */
	"contain-intrinsic-inline-size": containIntrinsicInlineSize,
	/** Width of an element when the element is subject to size containment. */
	"contain-intrinsic-width": containIntrinsicWidth,
	/** The container shorthand CSS property establishes the element as a query container and specifies the name or name for the containment context used in a container query. */
	container: container,
	/** The container-name CSS property specifies a list of query container names used by the @container at-rule in a container query. */
	"container-name": containerName,
	/** The container-type CSS property is used to define the type of containment used in a container query. */
	"container-type": containerType,
	/** Determines which page-based occurrence of a given element is applied to a counter or string value. */
	content: content,
	/** Controls whether or not an element renders its contents at all, along with forcing a strong set of containments, allowing user agents to potentially omit large swathes of layout and rendering work until it becomes needed. */
	"content-visibility": contentVisibility,
	/** Manipulate the value of existing counters. */
	"counter-increment": counterIncrement,
	/** Property accepts one or more names of counters (identifiers), each one optionally followed by an integer. The integer gives the value that the counter is set to on each occurrence of the element. */
	"counter-reset": counterReset,
	/** The counter-set CSS property sets a CSS counter to a given value. It manipulates the value of existing counters, and will only create new counters if there isn't already a counter of the given name on the element. */
	"counter-set": counterSet,
	/** Allows control over cursor appearance in an element */
	cursor: cursor,
	/** The d CSS property defines a path to be drawn by the SVG path element. If present, it overrides the element's d attribute. */
	d: d,
	/** The cx CSS property defines the x-axis center point of an SVG circle or ellipse element. If present, it overrides the element's cx attribute. */
	cx: cx,
	/** The cy CSS property defines the y-axis center point of an SVG circle or ellipse elements. If present, it overrides the element's cy attribute. */
	cy: cy,
	/** Specifies the inline base direction or directionality of any bidi paragraph, embedding, isolate, or override established by the box. Note: for HTML content use the 'dir' attribute and 'bdo' element rather than this property. */
	direction: direction,
	/** In combination with 'float' and 'position', determines the type of box or boxes that are generated for an element. */
	display: display,
	/** The dominant-baseline CSS property specifies the specific baseline used to align the box's text and inline-level contents. It also indicates the default alignment baseline of any boxes participating in baseline alignment in the box's alignment context. If present, it overrides the shape's dominant-baseline attribute. */
	"dominant-baseline": dominantBaseline,
	/** In the separated borders model, this property controls the rendering of borders and backgrounds around cells that have no visible content. */
	"empty-cells": emptyCells,
	/** The field-sizing CSS property enables you to control the sizing behavior of elements that are given a default preferred size, such as form control elements. This property enables you to override the default sizing behavior, allowing form controls to adjust in size to fit their contents. */
	"field-sizing": fieldSizing,
	/** Paints the interior of the given graphical element. */
	fill: fill,
	/** Specifies the opacity of the painting operation used to paint the interior the current object. */
	"fill-opacity": fillOpacity,
	/** Indicates the algorithm (or winding rule) which is to be used to determine what parts of the canvas are included inside the shape. */
	"fill-rule": fillRule,
	/** Processes an element's rendering before it is displayed in the document, by applying one or more filter effects. */
	filter: filter,
	/** Specifies the components of a flexible length: the flex grow factor and flex shrink factor, and the flex basis. */
	flex: flex,
	/** Sets the flex basis. */
	"flex-basis": flexBasis,
	/** Specifies how flex items are placed in the flex container, by setting the direction of the flex container's main axis. */
	"flex-direction": flexDirection,
	/** Specifies how flexbox items are placed in the flexbox. */
	"flex-flow": flexFlow,
	/** Sets the flex grow factor. Negative numbers are invalid. */
	"flex-grow": flexGrow,
	/** Sets the flex shrink factor. Negative numbers are invalid. */
	"flex-shrink": flexShrink,
	/** Controls whether the flex container is single-line or multi-line, and the direction of the cross-axis, which determines the direction new lines are stacked in. */
	"flex-wrap": flexWrap,
	/** Specifies how a box should be floated. It may be set for any element, but only applies to elements that generate boxes that are not absolutely positioned. */
	float: float,
	/** Shorthand property for setting 'font-style', 'font-variant', 'font-weight', 'font-size', 'line-height', and 'font-family', at the same place in the style sheet. The syntax of this property is based on a traditional typographical shorthand notation to set multiple properties related to fonts. */
	font: font,
	/** Specifies a prioritized list of font family names or generic family names. A user agent iterates through the list of family names until it matches an available font that contains a glyph for the character to be rendered. */
	"font-family": fontFamily,
	/** Provides low-level control over OpenType font features. It is intended as a way of providing access to font features that are not widely used but are needed for a particular use case. */
	"font-feature-settings": fontFeatureSettings,
	/** Kerning is the contextual adjustment of inter-glyph spacing. This property controls metric kerning, kerning that utilizes adjustment data contained in the font. */
	"font-kerning": fontKerning,
	/** The value of 'normal' implies that when rendering with OpenType fonts the language of the document is used to infer the OpenType language system, used to select language specific features when rendering. */
	"font-language-override": fontLanguageOverride,
	/** The font-optical-sizing CSS property allows developers to control whether browsers render text with slightly differing visual representations to optimize viewing at different sizes, or not. This only works for fonts that have an optical size variation axis. */
	"font-optical-sizing": fontOpticalSizing,
	/** The font-palette CSS property allows specifying one of the many palettes contained in a font that a user agent should use for the font. Users can also override the values in a palette or create a new palette by using the @font-palette-values at-rule. */
	"font-palette": fontPalette,
	/** The font-variation-settings CSS property provides low-level control over OpenType or TrueType font variations, by specifying the four letter axis names of the features you want to vary, along with their variation values. */
	"font-variation-settings": fontVariationSettings,
	/** Indicates the desired height of glyphs from the font. For scalable fonts, the font-size is a scale factor applied to the EM unit of the font. (Note that certain glyphs may bleed outside their EM box.) For non-scalable fonts, the font-size is converted into absolute units and matched against the declared font-size of the font, using the same absolute coordinate space for both of the matched values. */
	"font-size": fontSize,
	/** Preserves the readability of text when font fallback occurs by adjusting the font-size so that the x-height is the same regardless of the font used. */
	"font-size-adjust": fontSizeAdjust,
	/** The font-smooth CSS property controls the application of anti-aliasing when fonts are rendered. */
	"font-smooth": fontSmooth,
	/** Selects a normal, condensed, or expanded face from a font family. */
	"font-stretch": fontStretch,
	/** Allows italic or oblique faces to be selected. Italic forms are generally cursive in nature while oblique faces are typically sloped versions of the regular face. */
	"font-style": fontStyle,
	/** Controls whether user agents are allowed to synthesize bold or oblique font faces when a font family lacks bold or italic faces. */
	"font-synthesis": fontSynthesis,
	/** The font-synthesis-position CSS property lets you specify whether or not a browser may synthesize the subscript and superscript "position" typefaces when they are missing in a font family, while using font-variant-position to set the positions. */
	"font-synthesis-position": fontSynthesisPosition,
	/** The font-synthesis-small-caps CSS property lets you specify whether or not the browser may synthesize small-caps typeface when it is missing in a font family. Small-caps glyphs typically use the form of uppercase letters but are reduced to the size of lowercase letters. */
	"font-synthesis-small-caps": fontSynthesisSmallCaps,
	/** The font-synthesis-style CSS property lets you specify whether or not the browser may synthesize the oblique typeface when it is missing in a font family. */
	"font-synthesis-style": fontSynthesisStyle,
	/** The font-synthesis-weight CSS property lets you specify whether or not the browser may synthesize the bold typeface when it is missing in a font family. */
	"font-synthesis-weight": fontSynthesisWeight,
	/** Specifies variant representations of the font */
	"font-variant": fontVariant,
	/** For any given character, fonts can provide a variety of alternate glyphs in addition to the default glyph for that character. This property provides control over the selection of these alternate glyphs. */
	"font-variant-alternates": fontVariantAlternates,
	/** Specifies control over capitalized forms. */
	"font-variant-caps": fontVariantCaps,
	/** Allows control of glyph substitute and positioning in East Asian text. */
	"font-variant-east-asian": fontVariantEastAsian,
	/** The font-variant-emoji CSS property specifies the default presentation style for displaying emojis. */
	"font-variant-emoji": fontVariantEmoji,
	/** Specifies control over which ligatures are enabled or disabled. A value of 'normal' implies that the defaults set by the font are used. */
	"font-variant-ligatures": fontVariantLigatures,
	/** Specifies control over numerical forms. */
	"font-variant-numeric": fontVariantNumeric,
	/** Specifies the vertical position */
	"font-variant-position": fontVariantPosition,
	/** Specifies weight of glyphs in the font, their degree of blackness or stroke thickness. */
	"font-weight": fontWeight,
	/** Allows authors to opt certain elements out of forced colors mode. This then restores the control of those values to CSS */
	"forced-color-adjust": forcedColorAdjust,
	/** The gap CSS property is a shorthand property for row-gap and column-gap specifying the gutters between grid rows and columns. */
	gap: gap,
	/** The grid CSS property is a shorthand property that sets all of the explicit grid properties ('grid-template-rows', 'grid-template-columns', and 'grid-template-areas'), and all the implicit grid properties ('grid-auto-rows', 'grid-auto-columns', and 'grid-auto-flow'), in a single declaration. */
	grid: grid,
	/** Determine a grid item's size and location within the grid by contributing a line, a span, or nothing (automatic) to its grid placement. Shorthand for 'grid-row-start', 'grid-column-start', 'grid-row-end', and 'grid-column-end'. */
	"grid-area": gridArea,
	/** Specifies the size of implicitly created columns. */
	"grid-auto-columns": gridAutoColumns,
	/** Controls how the auto-placement algorithm works, specifying exactly how auto-placed items get flowed into the grid. */
	"grid-auto-flow": gridAutoFlow,
	/** Specifies the size of implicitly created rows. */
	"grid-auto-rows": gridAutoRows,
	/** Shorthand for 'grid-column-start' and 'grid-column-end'. */
	"grid-column": gridColumn,
	/** Determine a grid item's size and location within the grid by contributing a line, a span, or nothing (automatic) to its grid placement. */
	"grid-column-end": gridColumnEnd,
	/** Specifies the gutters between grid columns. Replaced by 'column-gap' property. */
	"grid-column-gap": gridColumnGap,
	/** Determine a grid item's size and location within the grid by contributing a line, a span, or nothing (automatic) to its grid placement. */
	"grid-column-start": gridColumnStart,
	/** Shorthand that specifies the gutters between grid columns and grid rows in one declaration. Replaced by 'gap' property. */
	"grid-gap": gridGap,
	/** Shorthand for 'grid-row-start' and 'grid-row-end'. */
	"grid-row": gridRow,
	/** Determine a grid item's size and location within the grid by contributing a line, a span, or nothing (automatic) to its grid placement. */
	"grid-row-end": gridRowEnd,
	/** Specifies the gutters between grid rows. Replaced by 'row-gap' property. */
	"grid-row-gap": gridRowGap,
	/** Determine a grid item's size and location within the grid by contributing a line, a span, or nothing (automatic) to its grid placement. */
	"grid-row-start": gridRowStart,
	/** Shorthand for setting grid-template-columns, grid-template-rows, and grid-template-areas in a single declaration. */
	"grid-template": gridTemplate,
	/** Specifies named grid areas, which are not associated with any particular grid item, but can be referenced from the grid-placement properties. */
	"grid-template-areas": gridTemplateAreas,
	/** specifies, as a space-separated track list, the line names and track sizing functions of the grid. */
	"grid-template-columns": gridTemplateColumns,
	/** specifies, as a space-separated track list, the line names and track sizing functions of the grid. */
	"grid-template-rows": gridTemplateRows,
	/** The hanging-punctuation CSS property specifies whether a punctuation mark should hang at the start or end of a line of text. Hanging punctuation may be placed outside the line box. */
	"hanging-punctuation": hangingPunctuation,
	/** Specifies the height of the content area, padding area or border area (depending on 'box-sizing') of certain boxes. */
	height: height,
	/** A hyphenate character used at the end of a line. */
	"hyphenate-character": hyphenateCharacter,
	/** The hyphenate-limit-chars CSS property specifies the minimum word length to allow hyphenation of words as well as the minimum number of characters before and after the hyphen. */
	"hyphenate-limit-chars": hyphenateLimitChars,
	/** Controls whether hyphenation is allowed to create more break opportunities within a line of text. */
	hyphens: hyphens,
	/** Specifies an orthogonal rotation to be applied to an image before it is laid out. */
	"image-orientation": imageOrientation,
	/** Provides a hint to the user-agent about what aspects of an image are most important to preserve when the image is scaled, to aid the user-agent in the choice of an appropriate scaling algorithm. */
	"image-rendering": imageRendering,
	/** The image-resolution property specifies the intrinsic resolution of all raster images used in or on the element. It affects both content images (e.g. replaced elements and generated content) and decorative images (such as background-image). The intrinsic resolution of an image is used to determine the image’s intrinsic dimensions. */
	"image-resolution": imageResolution,
	/** Controls the state of the input method editor for text fields. */
	"ime-mode": imeMode,
	/** The initial-letter CSS property specifies styling for dropped, raised, and sunken initial letters. */
	"initial-letter": initialLetter,
	/** The initial-letter-align CSS property specifies the alignment of initial letters within a paragraph. */
	"initial-letter-align": initialLetterAlign,
	/** Size of an element in the direction specified by 'writing-mode'. */
	"inline-size": inlineSize,
	/** input-security */
	"input-security": inputSecurity,
	/** The inset CSS property defines the logical block and inline start and end offsets of an element, which map to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the top and bottom, or right and left properties depending on the values defined for writing-mode, direction, and text-orientation. */
	inset: inset,
	/** The inset-block CSS property defines the logical block start and end offsets of an element, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the top and bottom, or right and left properties depending on the values defined for writing-mode, direction, and text-orientation. */
	"inset-block": insetBlock,
	/** The inset-block-end CSS property defines the logical block end offset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the top, right, bottom, or left property depending on the values defined for writing-mode, direction, and text-orientation. */
	"inset-block-end": insetBlockEnd,
	/** The inset-block-start CSS property defines the logical block start offset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the top, right, bottom, or left property depending on the values defined for writing-mode, direction, and text-orientation. */
	"inset-block-start": insetBlockStart,
	/** The inset-inline CSS property defines the logical block start and end offsets of an element, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the top and bottom, or right and left properties depending on the values defined for writing-mode, direction, and text-orientation. */
	"inset-inline": insetInline,
	/** The inset-inline-end CSS property defines the logical inline end inset of an element, which maps to a physical inset depending on the element's writing mode, directionality, and text orientation. It corresponds to the top, right, bottom, or left property depending on the values defined for writing-mode, direction, and text-orientation. */
	"inset-inline-end": insetInlineEnd,
	/** The inset-inline-start CSS property defines the logical inline start inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the top, right, bottom, or left property depending on the values defined for writing-mode, direction, and text-orientation. */
	"inset-inline-start": insetInlineStart,
	/** The interpolate-size CSS property allows you to enable animations and transitions between a <length-percentage> value and an intrinsic size value such as auto, fit-content, or max-content. */
	"interpolate-size": interpolateSize,
	/** In CSS setting to 'isolate' will turn the element into a stacking context. In SVG, it defines whether an element is isolated or not. */
	isolation: isolation,
	/** Aligns flex items along the main axis of the current line of the flex container. */
	"justify-content": justifyContent,
	/** Defines the default justify-self for all items of the box, giving them the default way of justifying each box along the appropriate axis */
	"justify-items": justifyItems,
	/** Defines the way of justifying a box inside its container along the appropriate axis. */
	"justify-self": justifySelf,
	/** The justify-tracks CSS property sets the alignment in the masonry axis for grid containers that have masonry in their inline axis */
	"justify-tracks": justifyTracks,
	/** Specifies how far an absolutely positioned box's left margin edge is offset to the right of the left edge of the box's 'containing block'. */
	left: left,
	/** Specifies the minimum, maximum, and optimal spacing between grapheme clusters. */
	"letter-spacing": letterSpacing,
	/** Specifies what set of line breaking restrictions are in effect within the element. */
	"line-break": lineBreak,
	/** The line-clamp property allows limiting the contents of a block container to the specified number of lines; remaining content is fragmented away and neither rendered nor measured. Optionally, it also allows inserting content into the last line box to indicate the continuity of truncated/interrupted content. */
	"line-clamp": lineClamp,
	/** Determines the block-progression dimension of the text content area of an inline box. */
	"line-height": lineHeight,
	/** The line-height-step CSS property defines the step units for line box heights. When the step unit is positive, line box heights are rounded up to the closest multiple of the unit. Negative values are invalid. */
	"line-height-step": lineHeightStep,
	/** Shorthand for setting 'list-style-type', 'list-style-position' and 'list-style-image' */
	"list-style": listStyle,
	/** Sets the image that will be used as the list item marker. When the image is available, it will replace the marker set with the 'list-style-type' marker. */
	"list-style-image": listStyleImage,
	/** Specifies the position of the '::marker' pseudo-element's box in the list item. */
	"list-style-position": listStylePosition,
	/** Used to construct the default contents of a list item's marker */
	"list-style-type": listStyleType,
	/** Shorthand property to set values for the thickness of the margin area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. Negative values for margin properties are allowed, but there may be implementation-specific limits. */
	margin: margin,
	/** The margin-block CSS property defines the logical block start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation. */
	"margin-block": marginBlock,
	/** Logical 'margin-bottom'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"margin-block-end": marginBlockEnd,
	/** Logical 'margin-top'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"margin-block-start": marginBlockStart,
	/** Shorthand property to set values for the thickness of the margin area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. Negative values for margin properties are allowed, but there may be implementation-specific limits.. */
	"margin-bottom": marginBottom,
	/** The margin-inline CSS property defines the logical inline start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation. */
	"margin-inline": marginInline,
	/** Logical 'margin-right'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"margin-inline-end": marginInlineEnd,
	/** Logical 'margin-left'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"margin-inline-start": marginInlineStart,
	/** Shorthand property to set values for the thickness of the margin area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. Negative values for margin properties are allowed, but there may be implementation-specific limits.. */
	"margin-left": marginLeft,
	/** Shorthand property to set values for the thickness of the margin area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. Negative values for margin properties are allowed, but there may be implementation-specific limits.. */
	"margin-right": marginRight,
	/** Shorthand property to set values for the thickness of the margin area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. Negative values for margin properties are allowed, but there may be implementation-specific limits.. */
	"margin-top": marginTop,
	/** The margin-trim property allows the container to trim the margins of its children where they adjoin the container’s edges. */
	"margin-trim": marginTrim,
	/** Specifies the marker symbol that shall be used for all points on the sets the value for all vertices on the given 'path' element or basic shape. */
	marker: marker,
	/** Specifies the marker that will be drawn at the last vertices of the given markable element. */
	"marker-end": markerEnd,
	/** Specifies the marker that will be drawn at all vertices except the first and last. */
	"marker-mid": markerMid,
	/** Specifies the marker that will be drawn at the first vertices of the given markable element. */
	"marker-start": markerStart,
	/** The mask CSS property alters the visibility of an element by either partially or fully hiding it. This is accomplished by either masking or clipping the image at specific points. */
	mask: mask,
	/** The mask-border CSS property lets you create a mask along the edge of an element's border.

This property is a shorthand for mask-border-source, mask-border-slice, mask-border-width, mask-border-outset, mask-border-repeat, and mask-border-mode. As with all shorthand properties, any omitted sub-values will be set to their initial value. */
	"mask-border": maskBorder,
	/** The mask-border-mode CSS property specifies the blending mode used in a mask border. */
	"mask-border-mode": maskBorderMode,
	/** The mask-border-outset CSS property specifies the distance by which an element's mask border is set out from its border box. */
	"mask-border-outset": maskBorderOutset,
	/** The mask-border-repeat CSS property defines how the edge regions of a source image are adjusted to fit the dimensions of an element's mask border. */
	"mask-border-repeat": maskBorderRepeat,
	/** The mask-border-slice CSS property divides the image specified by mask-border-source into regions. These regions are used to form the components of an element's mask border. */
	"mask-border-slice": maskBorderSlice,
	/** The mask-border-source CSS property specifies the source image used to create an element's mask border.

The mask-border-slice property is used to divide the source image into regions, which are then dynamically applied to the final mask border. */
	"mask-border-source": maskBorderSource,
	/** The mask-border-width CSS property specifies the width of an element's mask border. */
	"mask-border-width": maskBorderWidth,
	/** The mask-clip CSS property determines the area, which is affected by a mask. The painted content of an element must be restricted to this area. */
	"mask-clip": maskClip,
	/** The mask-composite CSS property represents a compositing operation used on the current mask layer with the mask layers below it. */
	"mask-composite": maskComposite,
	/** Sets the mask layer image of an element. */
	"mask-image": maskImage,
	/** Indicates whether the mask layer image is treated as luminance mask or alpha mask. */
	"mask-mode": maskMode,
	/** Specifies the mask positioning area. */
	"mask-origin": maskOrigin,
	/** Specifies how mask layer images are positioned. */
	"mask-position": maskPosition,
	/** Specifies how mask layer images are tiled after they have been sized and positioned. */
	"mask-repeat": maskRepeat,
	/** Specifies the size of the mask layer images. */
	"mask-size": maskSize,
	/** Defines whether the content of the <mask> element is treated as as luminance mask or alpha mask. */
	"mask-type": maskType,
	/** The masonry-auto-flow CSS property modifies how items are placed when using masonry in CSS Grid Layout. */
	"masonry-auto-flow": masonryAutoFlow,
	/** Describe a notion of "depth" for each element of a mathematical formula, with respect to the top-level container of that formula. */
	"math-depth": mathDepth,
	/** Used for positioning superscript during the layout of MathML scripted elements. */
	"math-shift": mathShift,
	/** The math-style property indicates whether MathML equations should render with normal or compact height. */
	"math-style": mathStyle,
	/** Maximum size of an element in the direction opposite that of the direction specified by 'writing-mode'. */
	"max-block-size": maxBlockSize,
	/** Allows authors to constrain content height to a certain range. */
	"max-height": maxHeight,
	/** Maximum size of an element in the direction specified by 'writing-mode'. */
	"max-inline-size": maxInlineSize,
	/** The max-lines property forces a break after a set number of lines */
	"max-lines": maxLines,
	/** Allows authors to constrain content width to a certain range. */
	"max-width": maxWidth,
	/** Minimal size of an element in the direction opposite that of the direction specified by 'writing-mode'. */
	"min-block-size": minBlockSize,
	/** Allows authors to constrain content height to a certain range. */
	"min-height": minHeight,
	/** Minimal size of an element in the direction specified by 'writing-mode'. */
	"min-inline-size": minInlineSize,
	/** Allows authors to constrain content width to a certain range. */
	"min-width": minWidth,
	/** Defines the formula that must be used to mix the colors with the backdrop. */
	"mix-blend-mode": mixBlendMode,
	/** Specifies how the contents of a replaced element should be scaled relative to the box established by its used height and width. */
	"object-fit": objectFit,
	/** Determines the alignment of the replaced element inside its box. */
	"object-position": objectPosition,
	/** The offset CSS property is a shorthand property for animating an element along a defined path. */
	offset: offset,
	/** Defines an anchor point of the box positioned along the path. The anchor point specifies the point of the box which is to be considered as the point that is moved along the path. */
	"offset-anchor": offsetAnchor,
	/** The offset-distance CSS property specifies a position along an offset-path. */
	"offset-distance": offsetDistance,
	/** The offset-path CSS property specifies the offset path where the element gets positioned. The exact element’s position on the offset path is determined by the offset-distance property. An offset path is either a specified path with one or multiple sub-paths or the geometry of a not-styled basic shape. Each shape or path must define an initial position for the computed value of "0" for offset-distance and an initial direction which specifies the rotation of the object to the initial position.

In this specification, a direction (or rotation) of 0 degrees is equivalent to the direction of the positive x-axis in the object’s local coordinate system. In other words, a rotation of 0 degree points to the right side of the UA if the object and its ancestors have no transformation applied. */
	"offset-path": offsetPath,
	/** Specifies the initial position of the offset path. If position is specified with static, offset-position would be ignored. */
	"offset-position": offsetPosition,
	/** The offset-rotate CSS property defines the direction of the element while positioning along the offset path. */
	"offset-rotate": offsetRotate,
	/** Opacity of an element's text, where 1 is opaque and 0 is entirely transparent. */
	opacity: opacity,
	/** Controls the order in which children of a flex container appear within the flex container, by assigning them to ordinal groups. */
	order: order,
	/** Specifies the minimum number of line boxes in a block container that must be left in a fragment before a fragmentation break. */
	orphans: orphans,
	/** Shorthand property for 'outline-style', 'outline-width', and 'outline-color'. */
	outline: outline,
	/** The color of the outline. */
	"outline-color": outlineColor,
	/** Offset the outline and draw it beyond the border edge. */
	"outline-offset": outlineOffset,
	/** Style of the outline. */
	"outline-style": outlineStyle,
	/** Width of the outline. */
	"outline-width": outlineWidth,
	/** Shorthand for setting 'overflow-x' and 'overflow-y'. */
	overflow: overflow,
	/** The overflow-anchor CSS property provides a way to opt out browser scroll anchoring behavior which adjusts scroll position to minimize content shifts. */
	"overflow-anchor": overflowAnchor,
	/** The overflow-block CSS media feature can be used to test how the output device handles content that overflows the initial containing block along the block axis. */
	"overflow-block": overflowBlock,
	/** The overflow-clip-box CSS property specifies relative to which box the clipping happens when there is an overflow. It is short hand for the overflow-clip-box-inline and overflow-clip-box-block properties. */
	"overflow-clip-box": overflowClipBox,
	/** The overflow-clip-margin CSS property determines how far outside its bounds an element with overflow: clip may be painted before being clipped. */
	"overflow-clip-margin": overflowClipMargin,
	/** The overflow-inline CSS media feature can be used to test how the output device handles content that overflows the initial containing block along the inline axis. */
	"overflow-inline": overflowInline,
	/** Specifies whether the UA may break within a word to prevent overflow when an otherwise-unbreakable string is too long to fit within the line box. */
	"overflow-wrap": overflowWrap,
	/** Specifies the handling of overflow in the horizontal direction. */
	"overflow-x": overflowX,
	/** Specifies the handling of overflow in the vertical direction. */
	"overflow-y": overflowY,
	/** The overlay CSS property specifies whether an element appearing in the top layer (for example, a shown popover or modal {{htmlelement("dialog")}} element) is actually rendered in the top layer. This property is only relevant within a list of transition-property values, and only if allow-discrete is set as the transition-behavior. */
	overlay: overlay,
	/** The overscroll-behavior CSS property is shorthand for the overscroll-behavior-x and overscroll-behavior-y properties, which allow you to control the browser's scroll overflow behavior — what happens when the boundary of a scrolling area is reached. */
	"overscroll-behavior": overscrollBehavior,
	/** The overscroll-behavior-block CSS property sets the browser's behavior when the block direction boundary of a scrolling area is reached. */
	"overscroll-behavior-block": overscrollBehaviorBlock,
	/** The overscroll-behavior-inline CSS property sets the browser's behavior when the inline direction boundary of a scrolling area is reached. */
	"overscroll-behavior-inline": overscrollBehaviorInline,
	/** The overscroll-behavior-x CSS property is allows you to control the browser's scroll overflow behavior — what happens when the boundary of a scrolling area is reached — in the x axis direction. */
	"overscroll-behavior-x": overscrollBehaviorX,
	/** The overscroll-behavior-y CSS property is allows you to control the browser's scroll overflow behavior — what happens when the boundary of a scrolling area is reached — in the y axis direction. */
	"overscroll-behavior-y": overscrollBehaviorY,
	/** Shorthand property to set values for the thickness of the padding area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. The value may not be negative. */
	padding: padding,
	/** The padding-block CSS property defines the logical block start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation. */
	"padding-block": paddingBlock,
	/** Logical 'padding-bottom'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"padding-block-end": paddingBlockEnd,
	/** Logical 'padding-top'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"padding-block-start": paddingBlockStart,
	/** Shorthand property to set values for the thickness of the padding area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. The value may not be negative. */
	"padding-bottom": paddingBottom,
	/** The padding-inline CSS property defines the logical inline start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation. */
	"padding-inline": paddingInline,
	/** Logical 'padding-right'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"padding-inline-end": paddingInlineEnd,
	/** Logical 'padding-left'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"padding-inline-start": paddingInlineStart,
	/** Shorthand property to set values for the thickness of the padding area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. The value may not be negative. */
	"padding-left": paddingLeft,
	/** Shorthand property to set values for the thickness of the padding area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. The value may not be negative. */
	"padding-right": paddingRight,
	/** Shorthand property to set values for the thickness of the padding area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. The value may not be negative. */
	"padding-top": paddingTop,
	/** The page CSS property is used to specify the named page, a specific type of page defined by the @page at-rule. */
	page: page,
	/** Defines rules for page breaks after an element. */
	"page-break-after": pageBreakAfter,
	/** Defines rules for page breaks before an element. */
	"page-break-before": pageBreakBefore,
	/** Defines rules for page breaks inside an element. */
	"page-break-inside": pageBreakInside,
	/** Controls the order that the three paint operations that shapes and text are rendered with: their fill, their stroke and any markers they might have. */
	"paint-order": paintOrder,
	/** Applies the same transform as the perspective(<number>) transform function, except that it applies only to the positioned or transformed children of the element, not to the transform on the element itself. */
	perspective: perspective,
	/** Establishes the origin for the perspective property. It effectively sets the X and Y position at which the viewer appears to be looking at the children of the element. */
	"perspective-origin": perspectiveOrigin,
	/** The place-content CSS shorthand property sets both the align-content and justify-content properties. */
	"place-content": placeContent,
	/** The CSS place-items shorthand property sets both the align-items and justify-items properties. The first value is the align-items property value, the second the justify-items one. If the second value is not present, the first value is also used for it. */
	"place-items": placeItems,
	/** The place-self CSS property is a shorthand property sets both the align-self and justify-self properties. The first value is the align-self property value, the second the justify-self one. If the second value is not present, the first value is also used for it. */
	"place-self": placeSelf,
	/** Specifies under what circumstances a given element can be the target element for a pointer event. */
	"pointer-events": pointerEvents,
	/** The position CSS property sets how an element is positioned in a document. The top, right, bottom, and left properties determine the final location of positioned elements. */
	position: position,
	/** The position-anchor property defines the default anchor specifier for all anchor functions on the element, allowing multiple elements to use the same set of anchor functions (and position options lists!) while changing which anchor element each is referring to. */
	"position-anchor": positionAnchor,
	/** The position-area CSS property enables an anchor-positioned element to be positioned relative to the edges of its associated anchor element by placing the positioned element on one or more tiles of an implicit 3x3 grid, where the anchoring element is the center cell. */
	"position-area": positionArea,
	/** This shorthand sets both position-try-options and position-try-order. If <'position-try-order'> is omitted, it’s set to the property’s initial value. */
	"position-try": positionTry,
	/** The position-try-fallbacks CSS property enables you to specify a list of one or more alternative position try fallback options for anchor-positioned elements to be placed relative to their associated anchor elements. When the element would otherwise overflow its inset-modified containing block, the browser will try placing the positioned element in these different fallback positions, in the order provided, until it finds a value that stops it from overflowing its container or the viewport. */
	"position-try-fallbacks": positionTryFallbacks,
	/** This property specifies the order in which the position options list will be tried. */
	"position-try-order": positionTryOrder,
	/** There are times when an element’s anchors are not appropriate for positioning the element with, and it would be better to simply not display the element at all. position-visibility provides several conditions where this could be the case. */
	"position-visibility": positionVisibility,
	/** Defines what optimization the user agent is allowed to do when adjusting the appearance for an output device. */
	"print-color-adjust": printColorAdjust,
	/** Specifies quotation marks for any number of embedded quotations. */
	quotes: quotes,
	/** The r CSS property defines the radius of a circle. It can only be used with the SVG circle element. If present, it overrides the circle's r attribute. */
	r: r,
	/** Specifies whether or not an element is resizable by the user, and if so, along which axis/axes. */
	resize: resize,
	/** Specifies how far an absolutely positioned box's right margin edge is offset to the left of the right edge of the box's 'containing block'. */
	right: right,
	/** The rotate CSS property allows you to specify rotation transforms individually and independently of the transform property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the transform value. */
	rotate: rotate,
	/** The row-gap CSS property specifies the gutter between grid rows. */
	"row-gap": rowGap,
	/** Specifies how text is distributed within the various ruby boxes when their contents do not exactly fill their respective boxes. */
	"ruby-align": rubyAlign,
	/** This property controls how ruby annotation boxes should be rendered when there are more than one in a ruby container box: whether each pair should be kept separate, the annotations should be collapsed and rendered as a group, or the separation should be determined based on the space available. */
	"ruby-merge": rubyMerge,
	/** Used by the parent of elements with display: ruby-text to control the position of the ruby text with respect to its base. */
	"ruby-position": rubyPosition,
	/** The rx CSS property defines the x-axis, or horizontal, radius of an SVG ellipse and the horizontal curve of the corners of an SVG rect rectangle. If present, it overrides the shape's rx attribute. */
	rx: rx,
	/** The ry CSS property defines the y-axis, or vertical, radius of an SVG ellipse and the vertical curve of the corners of an SVG rect rectangle. If present, it overrides the shape's ry attribute. */
	ry: ry,
	/** The scale CSS property allows you to specify scale transforms individually and independently of the transform property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the transform value. */
	scale: scale,
	/** The scrollbar-color CSS property sets the color of the scrollbar track and thumb. */
	"scrollbar-color": scrollbarColor,
	/** The scrollbar-gutter CSS property allows authors to reserve space for the scrollbar, preventing unwanted layout changes as the content grows while also avoiding unnecessary visuals when scrolling isn't needed. */
	"scrollbar-gutter": scrollbarGutter,
	/** The scrollbar-width property allows the author to set the maximum thickness of an element’s scrollbars when they are shown.  */
	"scrollbar-width": scrollbarWidth,
	/** Specifies the scrolling behavior for a scrolling box, when scrolling happens due to navigation or CSSOM scrolling APIs. */
	"scroll-behavior": scrollBehavior,
	/** The scroll-margin property is a shorthand property which sets all of the scroll-margin longhands, assigning values much like the margin property does for the margin-* longhands. */
	"scroll-margin": scrollMargin,
	/** The scroll-margin-block property is a shorthand property which sets the scroll-margin longhands in the block dimension. */
	"scroll-margin-block": scrollMarginBlock,
	/** The scroll-margin-block-start property defines the margin of the scroll snap area at the start of the block dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets. */
	"scroll-margin-block-start": scrollMarginBlockStart,
	/** The scroll-margin-block-end property defines the margin of the scroll snap area at the end of the block dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets. */
	"scroll-margin-block-end": scrollMarginBlockEnd,
	/** The scroll-margin-bottom property defines the bottom margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets. */
	"scroll-margin-bottom": scrollMarginBottom,
	/** The scroll-margin-inline property is a shorthand property which sets the scroll-margin longhands in the inline dimension. */
	"scroll-margin-inline": scrollMarginInline,
	/** The scroll-margin-inline-start property defines the margin of the scroll snap area at the start of the inline dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets. */
	"scroll-margin-inline-start": scrollMarginInlineStart,
	/** The scroll-margin-inline-end property defines the margin of the scroll snap area at the end of the inline dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets. */
	"scroll-margin-inline-end": scrollMarginInlineEnd,
	/** The scroll-margin-left property defines the left margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets. */
	"scroll-margin-left": scrollMarginLeft,
	/** The scroll-margin-right property defines the right margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets. */
	"scroll-margin-right": scrollMarginRight,
	/** The scroll-margin-top property defines the top margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets. */
	"scroll-margin-top": scrollMarginTop,
	/** The scroll-padding property is a shorthand property which sets all of the scroll-padding longhands, assigning values much like the padding property does for the padding-* longhands. */
	"scroll-padding": scrollPadding,
	/** The scroll-padding-block property is a shorthand property which sets the scroll-padding longhands for the block dimension. */
	"scroll-padding-block": scrollPaddingBlock,
	/** The scroll-padding-block-start property defines offsets for the start edge in the block dimension of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport. */
	"scroll-padding-block-start": scrollPaddingBlockStart,
	/** The scroll-padding-block-end property defines offsets for the end edge in the block dimension of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport. */
	"scroll-padding-block-end": scrollPaddingBlockEnd,
	/** The scroll-padding-bottom property defines offsets for the bottom of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport. */
	"scroll-padding-bottom": scrollPaddingBottom,
	/** The scroll-padding-inline property is a shorthand property which sets the scroll-padding longhands for the inline dimension. */
	"scroll-padding-inline": scrollPaddingInline,
	/** The scroll-padding-inline-start property defines offsets for the start edge in the inline dimension of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport. */
	"scroll-padding-inline-start": scrollPaddingInlineStart,
	/** The scroll-padding-inline-end property defines offsets for the end edge in the inline dimension of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport. */
	"scroll-padding-inline-end": scrollPaddingInlineEnd,
	/** The scroll-padding-left property defines offsets for the left of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport. */
	"scroll-padding-left": scrollPaddingLeft,
	/** The scroll-padding-right property defines offsets for the right of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport. */
	"scroll-padding-right": scrollPaddingRight,
	/** The scroll-padding-top property defines offsets for the top of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport. */
	"scroll-padding-top": scrollPaddingTop,
	/** The scroll-snap-align property specifies the box’s snap position as an alignment of its snap area (as the alignment subject) within its snap container’s snapport (as the alignment container). The two values specify the snapping alignment in the block axis and inline axis, respectively. If only one value is specified, the second value defaults to the same value. */
	"scroll-snap-align": scrollSnapAlign,
	/** Defines the x and y coordinate within the element which will align with the nearest ancestor scroll container's snap-destination for the respective axis. */
	"scroll-snap-coordinate": scrollSnapCoordinate,
	/** Define the x and y coordinate within the scroll container's visual viewport which element snap points will align with. */
	"scroll-snap-destination": scrollSnapDestination,
	/** Defines the positioning of snap points along the x axis of the scroll container it is applied to. */
	"scroll-snap-points-x": scrollSnapPointsX,
	/** Defines the positioning of snap points along the y axis of the scroll container it is applied to. */
	"scroll-snap-points-y": scrollSnapPointsY,
	/** The scroll-snap-stop CSS property defines whether the scroll container is allowed to "pass over" possible snap positions. */
	"scroll-snap-stop": scrollSnapStop,
	/** Defines how strictly snap points are enforced on the scroll container. */
	"scroll-snap-type": scrollSnapType,
	/** The scroll-snap-type-x CSS property defines how strictly snap points are enforced on the horizontal axis of the scroll container in case there is one.

Specifying any precise animations or physics used to enforce those snap points is not covered by this property but instead left up to the user agent. */
	"scroll-snap-type-x": scrollSnapTypeX,
	/** The scroll-snap-type-y CSS property defines how strictly snap points are enforced on the vertical axis of the scroll container in case there is one.

Specifying any precise animations or physics used to enforce those snap points is not covered by this property but instead left up to the user agent. */
	"scroll-snap-type-y": scrollSnapTypeY,
	/** Defines a name that can be used to identify the source element of a scroll timeline, along with the scrollbar axis that should provide the timeline. */
	"scroll-timeline": scrollTimeline,
	/** Specifies the scrollbar that will be used to provide the timeline for a scroll-timeline animation */
	"scroll-timeline-axis": scrollTimelineAxis,
	/** Defines a name that can be used to identify an element as the source of a scroll-timeline. */
	"scroll-timeline-name": scrollTimelineName,
	/** Defines the alpha channel threshold used to extract the shape using an image. A value of 0.5 means that the shape will enclose all the pixels that are more than 50% opaque. */
	"shape-image-threshold": shapeImageThreshold,
	/** Adds a margin to a 'shape-outside'. This defines a new shape that is the smallest contour that includes all the points that are the 'shape-margin' distance outward in the perpendicular direction from a point on the underlying shape. */
	"shape-margin": shapeMargin,
	/** Specifies an orthogonal rotation to be applied to an image before it is laid out. */
	"shape-outside": shapeOutside,
	/** Provides hints about what tradeoffs to make as it renders vector graphics elements such as <path> elements and basic shapes such as circles and rectangles. */
	"shape-rendering": shapeRendering,
	/** Paints along the outline of the given graphical element. */
	stroke: stroke,
	/** Controls the pattern of dashes and gaps used to stroke paths. */
	"stroke-dasharray": strokeDasharray,
	/** Specifies the distance into the dash pattern to start the dash. */
	"stroke-dashoffset": strokeDashoffset,
	/** Specifies the shape to be used at the end of open subpaths when they are stroked. */
	"stroke-linecap": strokeLinecap,
	/** Specifies the shape to be used at the corners of paths or basic shapes when they are stroked. */
	"stroke-linejoin": strokeLinejoin,
	/** When two line segments meet at a sharp angle and miter joins have been specified for 'stroke-linejoin', it is possible for the miter to extend far beyond the thickness of the line stroking the path. */
	"stroke-miterlimit": strokeMiterlimit,
	/** Specifies the opacity of the painting operation used to stroke the current object. */
	"stroke-opacity": strokeOpacity,
	/** Specifies the width of the stroke on the current object. */
	"stroke-width": strokeWidth,
	/** Determines the width of the tab character (U+0009), in space characters (U+0020), when rendered. */
	"tab-size": tabSize,
	/** Controls the algorithm used to lay out the table cells, rows, and columns. */
	"table-layout": tableLayout,
	/** Describes how inline contents of a block are horizontally aligned if the contents do not completely fill the line box. */
	"text-align": textAlign,
	/** Describes how the last line of a block or a line right before a forced line break is aligned when 'text-align' is set to 'justify'. */
	"text-align-last": textAlignLast,
	/** Used to align (start-, middle- or end-alignment) a string of text relative to a given point. */
	"text-anchor": textAnchor,
	/** The text-combine-upright CSS property specifies the combination of multiple characters into the space of a single character. If the combined text is wider than 1em, the user agent must fit the contents within 1em. The resulting composition is treated as a single upright glyph for layout and decoration. This property only has an effect in vertical writing modes.

This is used to produce an effect that is known as tate-chū-yoko (縦中横) in Japanese, or as 直書橫向 in Chinese. */
	"text-combine-upright": textCombineUpright,
	/** Decorations applied to font used for an element's text. */
	"text-decoration": textDecoration,
	/** Specifies the color of text decoration (underlines overlines, and line-throughs) set on the element with text-decoration-line. */
	"text-decoration-color": textDecorationColor,
	/** Specifies what line decorations, if any, are added to the element. */
	"text-decoration-line": textDecorationLine,
	/** The text-decoration-skip CSS property specifies what parts of the element’s content any text decoration affecting the element must skip over. It controls all text decoration lines drawn by the element and also any text decoration lines drawn by its ancestors. */
	"text-decoration-skip": textDecorationSkip,
	/** The text-decoration-skip-ink CSS property specifies how overlines and underlines are drawn when they pass over glyph ascenders and descenders. */
	"text-decoration-skip-ink": textDecorationSkipInk,
	/** Specifies the line style for underline, line-through and overline text decoration. */
	"text-decoration-style": textDecorationStyle,
	/** The text-decoration-thickness CSS property sets the thickness, or width, of the decoration line that is used on text in an element, such as a line-through, underline, or overline. */
	"text-decoration-thickness": textDecorationThickness,
	/** The text-emphasis CSS property is a shorthand property for setting text-emphasis-style and text-emphasis-color in one declaration. This property will apply the specified emphasis mark to each character of the element's text, except separator characters, like spaces,  and control characters. */
	"text-emphasis": textEmphasis,
	/** The text-emphasis-color CSS property defines the color used to draw emphasis marks on text being rendered in the HTML document. This value can also be set and reset using the text-emphasis shorthand. */
	"text-emphasis-color": textEmphasisColor,
	/** The text-emphasis-position CSS property describes where emphasis marks are drawn at. The effect of emphasis marks on the line height is the same as for ruby text: if there isn't enough place, the line height is increased. */
	"text-emphasis-position": textEmphasisPosition,
	/** The text-emphasis-style CSS property defines the type of emphasis used. It can also be set, and reset, using the text-emphasis shorthand. */
	"text-emphasis-style": textEmphasisStyle,
	/** Specifies the indentation applied to lines of inline content in a block. The indentation only affects the first line of inline content in the block unless the 'hanging' keyword is specified, in which case it affects all lines except the first. */
	"text-indent": textIndent,
	/** Selects the justification algorithm used when 'text-align' is set to 'justify'. The property applies to block containers, but the UA may (but is not required to) also support it on inline elements. */
	"text-justify": textJustify,
	/** Specifies the orientation of text within a line. */
	"text-orientation": textOrientation,
	/** Text can overflow for example when it is prevented from wrapping. */
	"text-overflow": textOverflow,
	/** The creator of SVG content might want to provide a hint to the implementation about what tradeoffs to make as it renders text. The 'text-rendering' property provides these hints. */
	"text-rendering": textRendering,
	/** Enables shadow effects to be applied to the text of the element. */
	"text-shadow": textShadow,
	/** The text-size-adjust CSS property controls the text inflation algorithm used on some smartphones and tablets. Other browsers will ignore this property. */
	"text-size-adjust": textSizeAdjust,
	/** The text-spacing-trim CSS property controls the internal spacing set on Chinese/Japanese/Korean (CJK) punctuation characters between adjacent characters (kerning) and at the start or end of text lines. */
	"text-spacing-trim": textSpacingTrim,
	/** Controls capitalization effects of an element's text. */
	"text-transform": textTransform,
	/** The text-underline-offset CSS property sets the offset distance of an underline text decoration line (applied using text-decoration) from its original position. */
	"text-underline-offset": textUnderlineOffset,
	/** Sets the position of an underline specified on the same element: it does not affect underlines specified by ancestor elements. This property is typically used in vertical writing contexts such as in Japanese documents where it often desired to have the underline appear 'over' (to the right of) the affected run of text */
	"text-underline-position": textUnderlinePosition,
	/** The text-wrap CSS property controls how text inside an element is wrapped. */
	"text-wrap": textWrap,
	/** The text-wrap-mode CSS property controls whether the text inside an element is wrapped. The different values provide alternate ways of wrapping the content of a block element. It can also be set, and reset, using the {{CSSXRef("text-wrap")}} shorthand. */
	"text-wrap-mode": textWrapMode,
	/** The text-wrap-style CSS property controls how text inside an element is wrapped. The different values provide alternate ways of wrapping the content of a block element. It can also be set, and reset, using the {{CSSXRef("text-wrap")}} shorthand. */
	"text-wrap-style": textWrapStyle,
	/** The timeline-scope CSS property modifies the scope of a named animation timeline. */
	"timeline-scope": timelineScope,
	/** Specifies how far an absolutely positioned box's top margin edge is offset below the top edge of the box's 'containing block'. */
	top: top,
	/** Determines whether touch input may trigger default behavior supplied by user agent. */
	"touch-action": touchAction,
	/** A two-dimensional transformation is applied to an element through the 'transform' property. This property contains a list of transform functions similar to those allowed by SVG. */
	transform: transform,
	/** The transform-box CSS property defines the layout box to which the transform and transform-origin properties relate. */
	"transform-box": transformBox,
	/** Establishes the origin of transformation for an element. */
	"transform-origin": transformOrigin,
	/** Defines how nested elements are rendered in 3D space. */
	"transform-style": transformStyle,
	/** Shorthand property combines four of the transition properties into a single property. */
	transition: transition,
	/** The transition-behavior CSS property specifies whether transitions will be started for properties whose animation behavior is discrete. */
	"transition-behavior": transitionBehavior,
	/** Defines when the transition will start. It allows a transition to begin execution some period of time from when it is applied. */
	"transition-delay": transitionDelay,
	/** Specifies how long the transition from the old value to the new value should take. */
	"transition-duration": transitionDuration,
	/** Specifies the name of the CSS property to which the transition is applied. */
	"transition-property": transitionProperty,
	/** Describes how the intermediate values used during a transition will be calculated. */
	"transition-timing-function": transitionTimingFunction,
	/** The translate CSS property allows you to specify translation transforms individually and independently of the transform property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the transform value. */
	translate: translate,
	/** The level of embedding with respect to the bidirectional algorithm. */
	"unicode-bidi": unicodeBidi,
	/** Controls the appearance of selection. */
	"user-select": userSelect,
	/** The vector-effect CSS property suppresses specific transformation effects in SVG, thus permitting effects like a road on a map staying the same width no matter how the map is zoomed, or allowing a diagram key to retain its position and size regardless of other transforms. It can only be used with SVG elements that accept the vector-effect attribute. When used, the CSS value overrides any values of the element's vector-effect attribute. */
	"vector-effect": vectorEffect,
	/** Affects the vertical positioning of the inline boxes generated by an inline-level element inside a line box. */
	"vertical-align": verticalAlign,
	/** The view-timeline CSS shorthand property is used to define a named view progress timeline, which is progressed through based on the change in visibility of an element (known as the subject) inside a scrollable element (scroller). view-timeline is set on the subject. */
	"view-timeline": viewTimeline,
	/** The view-timeline-axis CSS property is used to specify the scrollbar direction that will be used to provide the timeline for a named view progress timeline animation, which is progressed through based on the change in visibility of an element (known as the subject) inside a scrollable element (scroller). view-timeline-axis is set on the subject. See CSS scroll-driven animations for more details. */
	"view-timeline-axis": viewTimelineAxis,
	/** The view-timeline-inset CSS property is used to specify one or two values representing an adjustment to the position of the scrollport (see Scroll container for more details) in which the subject element of a named view progress timeline animation is deemed to be visible. Put another way, this allows you to specify start and/or end inset (or outset) values that offset the position of the timeline. */
	"view-timeline-inset": viewTimelineInset,
	/** The view-timeline-name CSS property is used to define the name of a named view progress timeline, which is progressed through based on the change in visibility of an element (known as the subject) inside a scrollable element (scroller). view-timeline is set on the subject. */
	"view-timeline-name": viewTimelineName,
	/** The view-transition-name CSS property provides the selected element with a distinct identifying name (a custom-ident) and causes it to participate in a separate view transition from the root view transition — or no view transition if the none value is specified. */
	"view-transition-name": viewTransitionName,
	/** Specifies whether the boxes generated by an element are rendered. Invisible boxes still affect layout (set the 'display' property to 'none' to suppress box generation altogether). */
	visibility: visibility,
	/** Specifies how whitespace is handled in an element. */
	"white-space": whiteSpace,
	/** The white-space-collapse CSS property controls how white space inside an element is collapsed. */
	"white-space-collapse": whiteSpaceCollapse,
	/** Specifies the minimum number of line boxes of a block container that must be left in a fragment after a break. */
	widows: widows,
	/** Specifies the width of the content area, padding area or border area (depending on 'box-sizing') of certain boxes. */
	width: width,
	/** Provides a rendering hint to the user agent, stating what kinds of changes the author expects to perform on the element. */
	"will-change": willChange,
	/** Specifies line break opportunities for non-CJK scripts. */
	"word-break": wordBreak,
	/** Specifies additional spacing between "words". */
	"word-spacing": wordSpacing,
	/** Specifies whether the UA may break within a word to prevent overflow when an otherwise-unbreakable string is too long to fit. */
	"word-wrap": wordWrap,
	/** This is a shorthand property for both 'direction' and 'block-progression'. */
	"writing-mode": writingMode,
	/** The x CSS property defines the x-axis coordinate of the top left corner of the SVG rect shape, image image, foreignObject viewport or nested svg viewport relative to the nearest <svg> ancestor's user coordinate system. If present, it overrides the element's x attribute. */
	x: x,
	/** The y CSS property defines the y-axis coordinate of the top left corner of the SVG rect shape, image image, foreignObject viewport and nested svg viewport relative to the nearest <svg> ancestor's user coordinate system. If present, it overrides the element's y attribute. */
	y: y,
	/** For a positioned box, the 'z-index' property specifies the stack level of the box in the current stacking context and whether the box establishes a local stacking context. */
	"z-index": zIndex,
	/** Non-standard. Specifies the magnification scale of the object. See 'transform: scale()' for a standards-based alternative. */
	zoom: zoom,
	/** The alignment-baseline CSS property specifies the specific baseline used to align the box's text and inline-level contents. Baseline alignment is the relationship among the baselines of multiple alignment subjects within an alignment context. When performing baseline alignment, the alignment-baseline property value specifies which baseline of the box is aligned to the corresponding baseline of its alignment context. */
	"alignment-baseline": alignmentBaseline,
	/** Allows repositioning of the dominant-baseline relative to the dominant-baseline of the parent text content element. The shifted object might be a sub- or superscript. */
	"baseline-shift": baselineShift,
	/** IE only. Used to extend behaviors of the browser. */
	behavior: behavior,
	/** cue */
	cue: cue,
	/** cue-after */
	"cue-after": cueAfter,
	/** cue-before */
	"cue-before": cueBefore,
	/** Controls glyph orientation when the inline-progression-direction is horizontal. */
	"glyph-orientation-horizontal": glyphOrientationHorizontal,
	/** Controls glyph orientation when the inline-progression-direction is vertical. */
	"glyph-orientation-vertical": glyphOrientationVertical,
	/** Indicates whether the user agent should adjust inter-glyph spacing based on kerning tables that are included in the relevant font or instead disable auto-kerning and set inter-character spacing to a specific length. */
	kerning: kerning,
	/** pause */
	pause: pause,
	/** pause-after */
	"pause-after": pauseAfter,
	/** pause-before */
	"pause-before": pauseBefore,
	/** rest */
	rest: rest,
	/** rest-after */
	"rest-after": restAfter,
	/** rest-before */
	"rest-before": restBefore,
	/** @font-face descriptor. Specifies the resource containing font data. It is required, whether the font is downloadable or locally installed. */
	src: src,
	/** speak */
	speak: speak,
	/** The speak-as descriptor specifies how a counter symbol constructed with a given @counter-style will be represented in the spoken form. For example, an author can specify a counter symbol to be either spoken as its numerical value or just represented with an audio cue. */
	"speak-as": speakAs,
	/** @font-face descriptor. Defines the set of Unicode codepoints that may be supported by the font face for which it is declared. */
	"unicode-range": unicodeRange,
	/** voice-balance */
	"voice-balance": voiceBalance,
	/** voice-duration */
	"voice-duration": voiceDuration,
	/** voice-family */
	"voice-family": voiceFamily,
	/** voice-pitch */
	"voice-pitch": voicePitch,
	/** voice-range */
	"voice-range": voiceRange,
	/** voice-rate */
	"voice-rate": voiceRate,
	/** voice-stress */
	"voice-stress": voiceStress,
	/** voice-volume */
	"voice-volume": voiceVolume,
	/** white-space-trim */
	"white-space-trim": whiteSpaceTrim,
	/** @counter-style descriptor. Specifies the symbols used by the marker-construction algorithm specified by the system descriptor. Needs to be specified if the counter system is 'additive'. */
	"additive-symbols": additiveSymbols,
	/** Provides alternative text for assistive technology to replace the generated content of a ::before or ::after element. */
	alt: alt,
	/** Deprecated. Use 'isolation' property instead when support allows. Specifies how the accumulation of the background image is managed. */
	"enable-background": enableBackground,
	/** @counter-style descriptor. Specifies a fallback counter style to be used when the current counter style can't create a representation for a given counter value. */
	fallback: fallback,
	/** Indicates what color to use to flood the current filter primitive subregion. */
	"flood-color": floodColor,
	/** Indicates what opacity to use to flood the current filter primitive subregion. */
	"flood-opacity": floodOpacity,
	/** Defines the color of the light source for filter primitives 'feDiffuseLighting' and 'feSpecularLighting'. */
	"lighting-color": lightingColor,
	/** Shorthand property for setting 'motion-path', 'motion-offset' and 'motion-rotation'. */
	motion: motion,
	/** A distance that describes the position along the specified motion path. */
	"motion-offset": motionOffset,
	/** Specifies the motion path the element gets positioned at. */
	"motion-path": motionPath,
	/** Defines the direction of the element while positioning along the motion path. */
	"motion-rotation": motionRotation,
	/** Provides an way to control directional focus navigation. */
	"nav-down": navDown,
	/** Provides an input-method-neutral way of specifying the sequential navigation order (also known as 'tabbing order'). */
	"nav-index": navIndex,
	/** Provides an way to control directional focus navigation. */
	"nav-left": navLeft,
	/** Provides an way to control directional focus navigation. */
	"nav-right": navRight,
	/** Provides an way to control directional focus navigation. */
	"nav-up": navUp,
	/** @counter-style descriptor. Defines how to alter the representation when the counter value is negative. */
	negative: negative,
	/** Logical 'bottom'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"offset-block-end": offsetBlockEnd,
	/** Logical 'top'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"offset-block-start": offsetBlockStart,
	/** Logical 'right'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"offset-inline-end": offsetInlineEnd,
	/** Logical 'left'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'. */
	"offset-inline-start": offsetInlineStart,
	/** @counter-style descriptor. Specifies a "fixed-width" counter style, where representations shorter than the pad value are padded with a particular <symbol> */
	pad: pad,
	/** @counter-style descriptor. Specifies a <symbol> that is prepended to the marker representation. */
	prefix: prefix,
	/** @counter-style descriptor. Defines the ranges over which the counter style is defined. */
	range: range,
	/** Determines whether, and on which side, ruby text is allowed to partially overhang any adjacent text in addition to its own base, when the ruby text is wider than the ruby base. */
	"ruby-overhang": rubyOverhang,
	/** Determines whether, and on which side, ruby text is allowed to partially overhang any adjacent text in addition to its own base, when the ruby text is wider than the ruby base. */
	"ruby-span": rubySpan,
	/** Determines the color of the top and left edges of the scroll box and scroll arrows of a scroll bar. */
	"scrollbar-3dlight-color": scrollbar3dlightColor,
	/** Determines the color of the arrow elements of a scroll arrow. */
	"scrollbar-arrow-color": scrollbarArrowColor,
	/** Determines the color of the main elements of a scroll bar, which include the scroll box, track, and scroll arrows. */
	"scrollbar-base-color": scrollbarBaseColor,
	/** Determines the color of the gutter of a scroll bar. */
	"scrollbar-darkshadow-color": scrollbarDarkshadowColor,
	/** Determines the color of the scroll box and scroll arrows of a scroll bar. */
	"scrollbar-face-color": scrollbarFaceColor,
	/** Determines the color of the top and left edges of the scroll box and scroll arrows of a scroll bar. */
	"scrollbar-highlight-color": scrollbarHighlightColor,
	/** Determines the color of the bottom and right edges of the scroll box and scroll arrows of a scroll bar. */
	"scrollbar-shadow-color": scrollbarShadowColor,
	/** Determines the color of the track element of a scroll bar. */
	"scrollbar-track-color": scrollbarTrackColor,
	/** The size CSS at-rule descriptor, used with the @page at-rule, defines the size and orientation of the box which is used to represent a page. Most of the time, this size corresponds to the target size of the printed page if applicable. */
	size: size,
	/** Indicates what color to use at that gradient stop. */
	"stop-color": stopColor,
	/** Defines the opacity of a given gradient stop. */
	"stop-opacity": stopOpacity,
	/** @counter-style descriptor. Specifies a <symbol> that is appended to the marker representation. */
	suffix: suffix,
	/** @counter-style descriptor. Specifies which algorithm will be used to construct the counter's representation based on the counter value. */
	system: system,
	/** @counter-style descriptor. Specifies the symbols used by the marker-construction algorithm specified by the system descriptor. */
	symbols: symbols,
	/** font-width */
	"font-width": fontWidth,
	/** Defines a rectangle as a viewable area (viewbox) within a replaced element, enabling the content of the replaced element to be zoomed or panned. */
	"object-view-box": objectViewBox,
	/** scroll-initial-target */
	"scroll-initial-target": scrollInitialTarget,
	/** stroke-color */
	"stroke-color": strokeColor,
	/** text-autospace */
	"text-autospace": textAutospace,
	/** The text-box CSS property is a shorthand that corresponds to the text-box-trim and text-box-edge properties, which together specify the amount of space to trim from the block-start edge and block-end edge of a text element's block container. */
	"text-box": textBox,
	/** The text-box-edge CSS property specifies an amount of space to trim from a text element's block container. */
	"text-box-edge": textBoxEdge,
	/** The text-box-trim CSS property specifies which of the over and under edges of text content to trim from a text element's block container. */
	"text-box-trim": textBoxTrim,
	/** The view-transition-class CSS property provides the selected elements with an identifying class (a custom-ident), providing an additional method of styling the view transitions for those elements. */
	"view-transition-class": viewTransitionClass,
	/** Describes the ascent metric of a font. */
	"ascent-override": ascentOverride,
	/** Describes the descent metric of a font. */
	"descent-override": descentOverride,
	/** The font-display descriptor determines how a font face is displayed based on whether and when it is downloaded and ready to use. */
	"font-display": fontDisplay,
	/** Describes the line-gap metric of a font. */
	"line-gap-override": lineGapOverride,
	/** A multiplier for glyph outlines and metrics of a font. */
	"size-adjust": sizeAdjust,
	/** The base-palette CSS descriptor is used to specify the name or index of a pre-defined palette to be used for creating a new palette. If the specified base-palette does not exist, then the palette defined at index 0 will be used. */
	"base-palette": basePalette,
	/** The override-colors CSS descriptor is used to override colors in the chosen base-palette for a color font. */
	"override-colors": overrideColors,
	/** The bleed CSS at-rule descriptor, used with the @page at-rule, specifies the extent of the page bleed area outside the page box. This property only has effect if crop marks are enabled using the marks property. */
	bleed: bleed,
	/** The marks CSS at-rule descriptor, used with the @page at-rule, adds crop and/or cross marks to the presentation of the document. Crop marks indicate where the page should be cut. Cross marks are used to align sheets. */
	marks: marks,
	/** The page-orientation CSS descriptor for the @page at-rule controls the rotation of a printed page. It handles the flow of content across pages when the orientation of a page is changed. This behavior differs from the size descriptor in that a user can define the direction in which to rotate the page. */
	"page-orientation": pageOrientation,
	/** Specifies the inherit flag of the custom property registration represented by the @property rule, controlling whether or not the property inherits by default. */
	inherits: inherits,
	/** Specifies the initial value of the custom property registration represented by the @property rule, controlling the property’s initial value. */
	"initial-value": initialValue,
	/** Specifies the syntax of the custom property registration represented by the @property rule, controlling how the property’s value is parsed at computed value time. */
	syntax: syntax,
	/** navigation */
	navigation: navigation,
	/** types */
	types: types,
} as const;

export type CSSPropertyName = keyof typeof CSS;
