// ==============================================================================
// CSS Property Functions - AUTO-GENERATED
// Do not edit manually.
// ==============================================================================

import { createValueAST } from "../core/ast.js";
import { Style, createStyle } from "../core/style.js";

/**
 * Sets the color of the elements accent
 *
 * **Syntax:** `auto | <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 93 |
 * | Firefox | 92 |
 * | FFA | 92 |
 * | Chrome | 93 |
 * | Opera | 79 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/accent-color
 */
export function accentColor(value: ColorValue): Style {
	return createStyle({
		property: "accent-color",
		value: String(value),
		description: "Sets the color of the elements accent",
		syntax: "auto | <color>",
		browserCompat: ["E93", "FF92", "FFA92", "C93", "O79"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Aligns a flex container's lines within the flex container when there is extra
 * space in the cross-axis, similar to how 'justify-content' aligns individual
 * items within the main-axis.
 *
 * **Syntax:** `normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 28 |
 * | FFA | 28 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 11 |
 * | Opera | 16 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/align-content
 */
export function alignContent(value: StringValue): Style {
	return createStyle({
		property: "align-content",
		value: String(value),
		description:
			"Aligns a flex container's lines within the flex container when there is extra space in the cross-axis, similar to how 'justify-content' aligns individual items within the main-axis.",
		syntax: "normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>",
		browserCompat: ["E12", "FF28", "FFA28", "S9", "SM9", "C29", "CA29", "IE11", "O16"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Aligns flex items along the cross axis of the current line of the flex
 * container.
 *
 * **Syntax:** `normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ] | anchor-center`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 20 |
 * | FFA | 20 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 11 |
 * | Opera | 16 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/align-items
 */
export function alignItems(value: StringValue): Style {
	return createStyle({
		property: "align-items",
		value: String(value),
		description: "Aligns flex items along the cross axis of the current line of the flex container.",
		syntax: "normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ] | anchor-center",
		browserCompat: ["E12", "FF20", "FFA20", "S9", "SM9", "C29", "CA29", "IE11", "O16"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Allows the default alignment along the cross axis to be overridden for
 * individual flex items.
 *
 * **Syntax:** `auto | normal | stretch | <baseline-position> | <overflow-position>? <self-position> | anchor-center`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 20 |
 * | FFA | 20 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 10 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/align-self
 */
export function alignSelf(value: StringValue): Style {
	return createStyle({
		property: "align-self",
		value: String(value),
		description: "Allows the default alignment along the cross axis to be overridden for individual flex items.",
		syntax: "auto | normal | stretch | <baseline-position> | <overflow-position>? <self-position> | anchor-center",
		browserCompat: ["E12", "FF20", "FFA20", "S9", "SM9", "C29", "CA29", "IE10", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The align-tracks CSS property sets the alignment in the masonry axis for grid
 * containers that have masonry in their block axis.
 *
 * **Syntax:** `[ normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position> ]#`
 */
export function alignTracks(value: StringValue): Style {
	return createStyle({
		property: "align-tracks",
		value: String(value),
		description:
			"The align-tracks CSS property sets the alignment in the masonry axis for grid containers that have masonry in their block axis.",
		syntax: "[ normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position> ]#",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand that resets all properties except 'direction' and 'unicode-bidi'.
 *
 * **Syntax:** `initial | inherit | unset | revert | revert-layer`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 27 |
 * | FFA | 27 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 * | Chrome | 37 |
 * | CA | 37 |
 * | Opera | 24 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/all
 */
export function all(value: KeywordValue): Style {
	return createStyle({
		property: "all",
		value: String(value),
		description: "Shorthand that resets all properties except 'direction' and 'unicode-bidi'.",
		syntax: "initial | inherit | unset | revert | revert-layer",
		browserCompat: ["E79", "FF27", "FFA27", "S9.1", "SM9.3", "C37", "CA37", "O24"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The anchor-name property declares that an element is an anchor element, and
 * gives it a list of anchor names to be targeted by.
 *
 * **Syntax:** `none | <dashed-ident>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 125 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 125 |
 * | CA | 125 |
 * | Opera | 111 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/anchor-name
 */
export function anchorName(value: DashedIdentValue): Style {
	return createStyle({
		property: "anchor-name",
		value: String(value),
		description:
			"The anchor-name property declares that an element is an anchor element, and gives it a list of anchor names to be targeted by.",
		syntax: "none | <dashed-ident>#",
		browserCompat: ["E125", "FFpreview", "S26", "SM26", "C125", "CA125", "O111"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * This property scopes the specified anchor names, and lookups for these anchor
 * names, to this element’s subtree
 *
 * **Syntax:** `none | all | <dashed-ident>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 131 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 131 |
 * | CA | 131 |
 * | Opera | 116 |
 *
 * **Baseline:** ❌ Limited support
 */
export function anchorScope(value: DashedIdentValue): Style {
	return createStyle({
		property: "anchor-scope",
		value: String(value),
		description:
			"This property scopes the specified anchor names, and lookups for these anchor names, to this element’s subtree",
		syntax: "none | all | <dashed-ident>#",
		browserCompat: ["E131", "FFpreview", "S26", "SM26", "C131", "CA131", "O116"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property combines six of the animation properties into a single
 * property.
 *
 * **Syntax:** `<single-animation>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | IE | 10 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation
 */
export function animation(value: StringValue): Style {
	return createStyle({
		property: "animation",
		value: String(value),
		description: "Shorthand property combines six of the animation properties into a single property.",
		syntax: "<single-animation>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C43", "CA43", "IE10", "O30"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The composite operation to use when multiple animations affect the same
 * property.
 *
 * **Syntax:** `<single-animation-composition>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 112 |
 * | Firefox | 115 |
 * | FFA | 115 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 112 |
 * | CA | 112 |
 * | Opera | 98 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-composition
 */
export function animationComposition(value: StringValue): Style {
	return createStyle({
		property: "animation-composition",
		value: String(value),
		description: "The composite operation to use when multiple animations affect the same property.",
		syntax: "<single-animation-composition>#",
		browserCompat: ["E112", "FF115", "FFA115", "S16", "SM16", "C112", "CA112", "O98"],
		baseline: { status: "low", baseline_low_date: "2023-07-04" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines when the animation will start.
 *
 * **Syntax:** `<time>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | IE | 10 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-delay
 */
export function animationDelay(value: TimeValue): Style {
	return createStyle({
		property: "animation-delay",
		value: String(value),
		description: "Defines when the animation will start.",
		syntax: "<time>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C43", "CA43", "IE10", "O30"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines whether or not the animation should play in reverse on alternate
 * cycles.
 *
 * **Syntax:** `<single-animation-direction>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | IE | 10 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-direction
 */
export function animationDirection(value: StringValue): Style {
	return createStyle({
		property: "animation-direction",
		value: String(value),
		description: "Defines whether or not the animation should play in reverse on alternate cycles.",
		syntax: "<single-animation-direction>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C43", "CA43", "IE10", "O30"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the length of time that an animation takes to complete one cycle.
 *
 * **Syntax:** `[ auto | <time [0s,∞]> ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | IE | 10 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-duration
 */
export function animationDuration(value: StringValue): Style {
	return createStyle({
		property: "animation-duration",
		value: String(value),
		description: "Defines the length of time that an animation takes to complete one cycle.",
		syntax: "[ auto | <time [0s,∞]> ]#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C43", "CA43", "IE10", "O30"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines what values are applied by the animation outside the time it is
 * executing.
 *
 * **Syntax:** `<single-animation-fill-mode>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | IE | 10 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-fill-mode
 */
export function animationFillMode(value: StringValue): Style {
	return createStyle({
		property: "animation-fill-mode",
		value: String(value),
		description: "Defines what values are applied by the animation outside the time it is executing.",
		syntax: "<single-animation-fill-mode>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C43", "CA43", "IE10", "O30"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the number of times an animation cycle is played. The default value is
 * one, meaning the animation will play from beginning to end once.
 *
 * **Syntax:** `<single-animation-iteration-count>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | IE | 10 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-iteration-count
 */
export function animationIterationCount(value: StringValue): Style {
	return createStyle({
		property: "animation-iteration-count",
		value: String(value),
		description:
			"Defines the number of times an animation cycle is played. The default value is one, meaning the animation will play from beginning to end once.",
		syntax: "<single-animation-iteration-count>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C43", "CA43", "IE10", "O30"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines a list of animations that apply. Each name is used to select the
 * keyframe at-rule that provides the property values for the animation.
 *
 * **Syntax:** `[ none | <keyframes-name> ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | IE | 10 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-name
 */
export function animationName(value: StringValue): Style {
	return createStyle({
		property: "animation-name",
		value: String(value),
		description:
			"Defines a list of animations that apply. Each name is used to select the keyframe at-rule that provides the property values for the animation.",
		syntax: "[ none | <keyframes-name> ]#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C43", "CA43", "IE10", "O30"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines whether the animation is running or paused.
 *
 * **Syntax:** `<single-animation-play-state>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | IE | 10 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-play-state
 */
export function animationPlayState(value: StringValue): Style {
	return createStyle({
		property: "animation-play-state",
		value: String(value),
		description: "Defines whether the animation is running or paused.",
		syntax: "<single-animation-play-state>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C43", "CA43", "IE10", "O30"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The animation-range CSS shorthand property is used to set the start and end of
 * an animation's attachment range along its timeline, i.e. where along the
 * timeline an animation will start and end.
 *
 * **Syntax:** `[ <'animation-range-start'> <'animation-range-end'>? ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-range
 */
export function animationRange(value: StringValue): Style {
	return createStyle({
		property: "animation-range",
		value: String(value),
		description:
			"The animation-range CSS shorthand property is used to set the start and end of an animation's attachment range along its timeline, i.e. where along the timeline an animation will start and end.",
		syntax: "[ <'animation-range-start'> <'animation-range-end'>? ]#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The animation-range-end CSS property is used to set the end of an animation's
 * attachment range along its timeline, i.e. where along the timeline an
 * animation will end.
 *
 * **Syntax:** `[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-range-end
 */
export function animationRangeEnd(value: LengthPercentageValue): Style {
	return createStyle({
		property: "animation-range-end",
		value: String(value),
		description:
			"The animation-range-end CSS property is used to set the end of an animation's attachment range along its timeline, i.e. where along the timeline an animation will end.",
		syntax: "[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The animation-range-start CSS property is used to set the start of an
 * animation's attachment range along its timeline, i.e. where along the timeline
 * an animation will start.
 *
 * **Syntax:** `[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-range-start
 */
export function animationRangeStart(value: LengthPercentageValue): Style {
	return createStyle({
		property: "animation-range-start",
		value: String(value),
		description:
			"The animation-range-start CSS property is used to set the start of an animation's attachment range along its timeline, i.e. where along the timeline an animation will start.",
		syntax: "[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes how the animation will progress over one cycle of its duration.
 *
 * **Syntax:** `<easing-function>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | IE | 10 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-timing-function
 */
export function animationTimingFunction(value: StringValue): Style {
	return createStyle({
		property: "animation-timing-function",
		value: String(value),
		description: "Describes how the animation will progress over one cycle of its duration.",
		syntax: "<easing-function>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C43", "CA43", "IE10", "O30"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the names of one or more @scroll-timeline at-rules to describe the
 * element's scroll animations.
 *
 * **Syntax:** `<single-animation-timeline>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-timeline
 */
export function animationTimeline(value: StringValue): Style {
	return createStyle({
		property: "animation-timeline",
		value: String(value),
		description:
			"Specifies the names of one or more @scroll-timeline at-rules to describe the element's scroll animations.",
		syntax: "<single-animation-timeline>#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Changes the appearance of buttons and other controls to resemble native
 * controls.
 *
 * **Syntax:** `none | auto | <compat-auto> | <compat-special>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 84 |
 * | Firefox | 80 |
 * | FFA | 80 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 84 |
 * | CA | 84 |
 * | Opera | 70 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/appearance
 */
export function appearance(value: StringValue): Style {
	return createStyle({
		property: "appearance",
		value: String(value),
		description: "Changes the appearance of buttons and other controls to resemble native controls.",
		syntax: "none | auto | <compat-auto> | <compat-special>",
		browserCompat: ["E84", "FF80", "FFA80", "S15.4", "SM15.4", "C84", "CA84", "O70"],
		baseline: { status: "high", baseline_low_date: "2022-03-14", baseline_high_date: "2024-09-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The aspect-ratio   CSS property sets a preferred aspect ratio for the box,
 * which will be used in the calculation of auto sizes and some other layout
 * functions.
 *
 * **Syntax:** `auto || <ratio>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 88 |
 * | Firefox | 89 |
 * | FFA | 89 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 88 |
 * | CA | 88 |
 * | Opera | 74 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/aspect-ratio
 */
export function aspectRatio(value: RatioValue): Style {
	return createStyle({
		property: "aspect-ratio",
		value: String(value),
		description:
			"The aspect-ratio   CSS property sets a preferred aspect ratio for the box, which will be used in the calculation of auto sizes and some other layout functions.",
		syntax: "auto || <ratio>",
		browserCompat: ["E88", "FF89", "FFA89", "S15", "SM15", "C88", "CA88", "O74"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<angle>|[[left-side|far-left|left|center-left|center|center-right|right|far-right|right-side]||behind]|leftwards|rightwards`
 */
export function azimuth(value: AngleValue): Style {
	return createStyle({
		property: "azimuth",
		value: String(value),
		description: undefined,
		syntax:
			"<angle>|[[left-side|far-left|left|center-left|center|center-right|right|far-right|right-side]||behind]|leftwards|rightwards",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The backdrop-filter CSS property lets you apply graphical effects such as
 * blurring or color shifting to the area behind an element. Because it applies
 * to everything behind the element, to see the effect you must make the element
 * or its background at least partially transparent.
 *
 * **Syntax:** `none | <filter-value-list>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 103 |
 * | FFA | 103 |
 * | Safari | 18 |
 * | SM | 18 |
 * | Chrome | 76 |
 * | CA | 76 |
 * | Opera | 63 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/backdrop-filter
 */
export function backdropFilter(value: StringValue): Style {
	return createStyle({
		property: "backdrop-filter",
		value: String(value),
		description:
			"The backdrop-filter CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element. Because it applies to everything behind the element, to see the effect you must make the element or its background at least partially transparent.",
		syntax: "none | <filter-value-list>",
		browserCompat: ["E79", "FF103", "FFA103", "S18", "SM18", "C76", "CA76", "O63"],
		baseline: { status: "low", baseline_low_date: "2024-09-16" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines whether or not the 'back' side of a transformed element is visible
 * when facing the viewer. With an identity transform, the front side of an
 * element faces the viewer.
 *
 * **Syntax:** `visible | hidden`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 36 |
 * | CA | 36 |
 * | IE | 10 |
 * | Opera | 23 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/backface-visibility
 */
export function backfaceVisibility(value: KeywordValue): Style {
	return createStyle({
		property: "backface-visibility",
		value: String(value),
		description:
			"Determines whether or not the 'back' side of a transformed element is visible when facing the viewer. With an identity transform, the front side of an element faces the viewer.",
		syntax: "visible | hidden",
		browserCompat: ["E12", "FF16", "FFA16", "S15.4", "SM15.4", "C36", "CA36", "IE10", "O23"],
		baseline: { status: "high", baseline_low_date: "2022-03-14", baseline_high_date: "2024-09-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property for setting most background properties at the same place in
 * the style sheet.
 *
 * **Syntax:** `<bg-layer>#? , <final-bg-layer>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background
 */
export function background(value: StringValue): Style {
	return createStyle({
		property: "background",
		value: String(value),
		description: "Shorthand property for setting most background properties at the same place in the style sheet.",
		syntax: "<bg-layer>#? , <final-bg-layer>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies whether the background images are fixed with regard to the viewport
 * ('fixed') or scroll along with the element ('scroll') or its contents
 * ('local').
 *
 * **Syntax:** `<attachment>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-attachment
 */
export function backgroundAttachment(value: StringValue): Style {
	return createStyle({
		property: "background-attachment",
		value: String(value),
		description:
			"Specifies whether the background images are fixed with regard to the viewport ('fixed') or scroll along with the element ('scroll') or its contents ('local').",
		syntax: "<attachment>#",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM3.2", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the blending mode of each background layer.
 *
 * **Syntax:** `<blend-mode>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 30 |
 * | FFA | 30 |
 * | Safari | 8 |
 * | SM | 8 |
 * | Chrome | 35 |
 * | CA | 35 |
 * | Opera | 22 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-blend-mode
 */
export function backgroundBlendMode(value: StringValue): Style {
	return createStyle({
		property: "background-blend-mode",
		value: String(value),
		description: "Defines the blending mode of each background layer.",
		syntax: "<blend-mode>#",
		browserCompat: ["E79", "FF30", "FFA30", "S8", "SM8", "C35", "CA35", "O22"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the background painting area.
 *
 * **Syntax:** `<bg-clip>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 4 |
 * | FFA | 4 |
 * | Safari | 5 |
 * | SM | 5 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 9 |
 * | Opera | 10.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-clip
 */
export function backgroundClip(value: StringValue): Style {
	return createStyle({
		property: "background-clip",
		value: String(value),
		description: "Determines the background painting area.",
		syntax: "<bg-clip>#",
		browserCompat: ["E12", "FF4", "FFA4", "S5", "SM5", "C1", "CA18", "IE9", "O10.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the background color of an element.
 *
 * **Syntax:** `<color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-color
 */
export function backgroundColor(value: ColorValue): Style {
	return createStyle({
		property: "background-color",
		value: String(value),
		description: "Sets the background color of an element.",
		syntax: "<color>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the background image(s) of an element.
 *
 * **Syntax:** `<bg-image>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-image
 */
export function backgroundImage(value: StringValue): Style {
	return createStyle({
		property: "background-image",
		value: String(value),
		description: "Sets the background image(s) of an element.",
		syntax: "<bg-image>#",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * For elements rendered as a single box, specifies the background positioning
 * area. For elements rendered as multiple boxes (e.g., inline boxes on several
 * lines, boxes on several pages) specifies which boxes 'box-decoration-break'
 * operates on to determine the background positioning area(s).
 *
 * **Syntax:** `<visual-box>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 4 |
 * | FFA | 4 |
 * | Safari | 3 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 9 |
 * | Opera | 10.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-origin
 */
export function backgroundOrigin(value: StringValue): Style {
	return createStyle({
		property: "background-origin",
		value: String(value),
		description:
			"For elements rendered as a single box, specifies the background positioning area. For elements rendered as multiple boxes (e.g., inline boxes on several lines, boxes on several pages) specifies which boxes 'box-decoration-break' operates on to determine the background positioning area(s).",
		syntax: "<visual-box>#",
		browserCompat: ["E12", "FF4", "FFA4", "S3", "SM1", "C1", "CA18", "IE9", "O10.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the initial position of the background image(s) (after any resizing)
 * within their corresponding background positioning area.
 *
 * **Syntax:** `<bg-position>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-position
 */
export function backgroundPosition(value: StringValue): Style {
	return createStyle({
		property: "background-position",
		value: String(value),
		description:
			"Specifies the initial position of the background image(s) (after any resizing) within their corresponding background positioning area.",
		syntax: "<bg-position>#",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * If background images have been specified, this property specifies their
 * initial position (after any resizing) within their corresponding background
 * positioning area.
 *
 * **Syntax:** `[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 49 |
 * | FFA | 49 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 6 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-position-x
 */
export function backgroundPositionX(value: LengthPercentageValue): Style {
	return createStyle({
		property: "background-position-x",
		value: String(value),
		description:
			"If background images have been specified, this property specifies their initial position (after any resizing) within their corresponding background positioning area.",
		syntax: "[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#",
		browserCompat: ["E12", "FF49", "FFA49", "S1", "SM1", "C1", "CA18", "IE6", "O15"],
		baseline: { status: "high", baseline_low_date: "2016-09-20", baseline_high_date: "2019-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * If background images have been specified, this property specifies their
 * initial position (after any resizing) within their corresponding background
 * positioning area.
 *
 * **Syntax:** `[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 49 |
 * | FFA | 49 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 6 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-position-y
 */
export function backgroundPositionY(value: LengthPercentageValue): Style {
	return createStyle({
		property: "background-position-y",
		value: String(value),
		description:
			"If background images have been specified, this property specifies their initial position (after any resizing) within their corresponding background positioning area.",
		syntax: "[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#",
		browserCompat: ["E12", "FF49", "FFA49", "S1", "SM1", "C1", "CA18", "IE6", "O15"],
		baseline: { status: "high", baseline_low_date: "2016-09-20", baseline_high_date: "2019-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how background images are tiled after they have been sized and
 * positioned.
 *
 * **Syntax:** `<repeat-style>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-repeat
 */
export function backgroundRepeat(value: StringValue): Style {
	return createStyle({
		property: "background-repeat",
		value: String(value),
		description: "Specifies how background images are tiled after they have been sized and positioned.",
		syntax: "<repeat-style>#",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the size of the background images.
 *
 * **Syntax:** `<bg-size>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 4 |
 * | FFA | 4 |
 * | Safari | 5 |
 * | SM | 4.2 |
 * | Chrome | 3 |
 * | CA | 18 |
 * | IE | 9 |
 * | Opera | 10 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/background-size
 */
export function backgroundSize(value: StringValue): Style {
	return createStyle({
		property: "background-size",
		value: String(value),
		description: "Specifies the size of the background images.",
		syntax: "<bg-size>#",
		browserCompat: ["E12", "FF4", "FFA4", "S5", "SM4.2", "C3", "CA18", "IE9", "O10"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Size of an element in the direction opposite that of the direction specified
 * by 'writing-mode'.
 *
 * **Syntax:** `<'width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/block-size
 */
export function blockSize(value: StringValue): Style {
	return createStyle({
		property: "block-size",
		value: String(value),
		description: "Size of an element in the direction opposite that of the direction specified by 'writing-mode'.",
		syntax: "<'width'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property for setting border width, style, and color.
 *
 * **Syntax:** `<line-width> || <line-style> || <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border
 */
export function border(value: ColorValue): Style {
	return createStyle({
		property: "border",
		value: String(value),
		description: "Shorthand property for setting border width, style, and color.",
		syntax: "<line-width> || <line-style> || <color>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-block CSS property is a shorthand property for setting the
 * individual logical block border property values in a single place in the style
 * sheet.
 *
 * **Syntax:** `<'border-block-start'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block
 */
export function borderBlock(value: StringValue): Style {
	return createStyle({
		property: "border-block",
		value: String(value),
		description:
			"The border-block CSS property is a shorthand property for setting the individual logical block border property values in a single place in the style sheet.",
		syntax: "<'border-block-start'>",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-block-color CSS property defines the color of the logical block
 * borders of an element, which maps to a physical border color depending on the
 * element's writing mode, directionality, and text orientation. It corresponds
 * to the border-top-color and border-bottom-color, or border-right-color and
 * border-left-color property depending on the values defined for writing-mode,
 * direction, and text-orientation.
 *
 * **Syntax:** `<'border-top-color'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-color
 */
export function borderBlockColor(value: StringValue): Style {
	return createStyle({
		property: "border-block-color",
		value: String(value),
		description:
			"The border-block-color CSS property defines the color of the logical block borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-color and border-bottom-color, or border-right-color and border-left-color property depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'border-top-color'>{1,2}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-block-style CSS property defines the style of the logical block
 * borders of an element, which maps to a physical border style depending on the
 * element's writing mode, directionality, and text orientation. It corresponds
 * to the border-top-style and border-bottom-style, or border-left-style and
 * border-right-style properties depending on the values defined for
 * writing-mode, direction, and text-orientation.
 *
 * **Syntax:** `<'border-top-style'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-style
 */
export function borderBlockStyle(value: StringValue): Style {
	return createStyle({
		property: "border-block-style",
		value: String(value),
		description:
			"The border-block-style CSS property defines the style of the logical block borders of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-style and border-bottom-style, or border-left-style and border-right-style properties depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'border-top-style'>{1,2}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-block-width CSS property defines the width of the logical block
 * borders of an element, which maps to a physical border width depending on the
 * element's writing mode, directionality, and text orientation. It corresponds
 * to the border-top-width and border-bottom-width, or border-left-width, and
 * border-right-width property depending on the values defined for writing-mode,
 * direction, and text-orientation.
 *
 * **Syntax:** `<'border-top-width'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-width
 */
export function borderBlockWidth(value: StringValue): Style {
	return createStyle({
		property: "border-block-width",
		value: String(value),
		description:
			"The border-block-width CSS property defines the width of the logical block borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-width and border-bottom-width, or border-left-width, and border-right-width property depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'border-top-width'>{1,2}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-bottom'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-width'> || <'border-top-style'> || <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end
 */
export function borderBlockEnd(value: ColorValue): Style {
	return createStyle({
		property: "border-block-end",
		value: String(value),
		description:
			"Logical 'border-bottom'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-width'> || <'border-top-style'> || <color>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-bottom-color'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-color'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end-color
 */
export function borderBlockEndColor(value: StringValue): Style {
	return createStyle({
		property: "border-block-end-color",
		value: String(value),
		description:
			"Logical 'border-bottom-color'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-color'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-bottom-style'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-style'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end-style
 */
export function borderBlockEndStyle(value: StringValue): Style {
	return createStyle({
		property: "border-block-end-style",
		value: String(value),
		description:
			"Logical 'border-bottom-style'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-style'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-bottom-width'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-end-width
 */
export function borderBlockEndWidth(value: StringValue): Style {
	return createStyle({
		property: "border-block-end-width",
		value: String(value),
		description:
			"Logical 'border-bottom-width'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-width'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-top'. Mapping depends on the parent element's 'writing-mode',
 * 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-width'> || <'border-top-style'> || <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start
 */
export function borderBlockStart(value: ColorValue): Style {
	return createStyle({
		property: "border-block-start",
		value: String(value),
		description:
			"Logical 'border-top'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-width'> || <'border-top-style'> || <color>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-top-color'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-color'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start-color
 */
export function borderBlockStartColor(value: StringValue): Style {
	return createStyle({
		property: "border-block-start-color",
		value: String(value),
		description:
			"Logical 'border-top-color'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-color'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-top-style'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-style'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start-style
 */
export function borderBlockStartStyle(value: StringValue): Style {
	return createStyle({
		property: "border-block-start-style",
		value: String(value),
		description:
			"Logical 'border-top-style'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-style'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-top-width'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-block-start-width
 */
export function borderBlockStartWidth(value: StringValue): Style {
	return createStyle({
		property: "border-block-start-width",
		value: String(value),
		description:
			"Logical 'border-top-width'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-width'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property for setting border width, style and color.
 *
 * **Syntax:** `<line-width> || <line-style> || <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom
 */
export function borderBottom(value: ColorValue): Style {
	return createStyle({
		property: "border-bottom",
		value: String(value),
		description: "Shorthand property for setting border width, style and color.",
		syntax: "<line-width> || <line-style> || <color>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the color of the bottom border.
 *
 * **Syntax:** `<'border-top-color'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-color
 */
export function borderBottomColor(value: StringValue): Style {
	return createStyle({
		property: "border-bottom-color",
		value: String(value),
		description: "Sets the color of the bottom border.",
		syntax: "<'border-top-color'>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the radii of the bottom left outer border edge.
 *
 * **Syntax:** `<length-percentage [0,∞]>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 4 |
 * | FFA | 4 |
 * | Safari | 5 |
 * | SM | 4.2 |
 * | Chrome | 4 |
 * | CA | 18 |
 * | IE | 9 |
 * | Opera | 10.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-left-radius
 */
export function borderBottomLeftRadius(value: StringValue): Style {
	return createStyle({
		property: "border-bottom-left-radius",
		value: String(value),
		description: "Defines the radii of the bottom left outer border edge.",
		syntax: "<length-percentage [0,∞]>{1,2}",
		browserCompat: ["E12", "FF4", "FFA4", "S5", "SM4.2", "C4", "CA18", "IE9", "O10.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the radii of the bottom right outer border edge.
 *
 * **Syntax:** `<length-percentage [0,∞]>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 4 |
 * | FFA | 4 |
 * | Safari | 5 |
 * | SM | 4.2 |
 * | Chrome | 4 |
 * | CA | 18 |
 * | IE | 9 |
 * | Opera | 10.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-right-radius
 */
export function borderBottomRightRadius(value: StringValue): Style {
	return createStyle({
		property: "border-bottom-right-radius",
		value: String(value),
		description: "Defines the radii of the bottom right outer border edge.",
		syntax: "<length-percentage [0,∞]>{1,2}",
		browserCompat: ["E12", "FF4", "FFA4", "S5", "SM4.2", "C4", "CA18", "IE9", "O10.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the style of the bottom border.
 *
 * **Syntax:** `<line-style>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-style
 */
export function borderBottomStyle(value: StringValue): Style {
	return createStyle({
		property: "border-bottom-style",
		value: String(value),
		description: "Sets the style of the bottom border.",
		syntax: "<line-style>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE5.5", "O9.2"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the thickness of the bottom border.
 *
 * **Syntax:** `<line-width>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-bottom-width
 */
export function borderBottomWidth(value: StringValue): Style {
	return createStyle({
		property: "border-bottom-width",
		value: String(value),
		description: "Sets the thickness of the bottom border.",
		syntax: "<line-width>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Selects a table's border model.
 *
 * **Syntax:** `separate | collapse`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1.1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-collapse
 */
export function borderCollapse(value: KeywordValue): Style {
	return createStyle({
		property: "border-collapse",
		value: String(value),
		description: "Selects a table's border model.",
		syntax: "separate | collapse",
		browserCompat: ["E12", "FF1", "FFA4", "S1.1", "SM1", "C1", "CA18", "IE5", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The color of the border around all four edges of an element.
 *
 * **Syntax:** `<color>{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-color
 */
export function borderColor(value: ColorValue): Style {
	return createStyle({
		property: "border-color",
		value: String(value),
		description: "The color of the border around all four edges of an element.",
		syntax: "<color>{1,4}",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-end-end-radius CSS property defines a logical border radius on an
 * element, which maps to a physical border radius that depends on on the
 * element's writing-mode, direction, and text-orientation.
 *
 * **Syntax:** `<'border-top-left-radius'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 89 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 89 |
 * | CA | 89 |
 * | Opera | 75 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-end-end-radius
 */
export function borderEndEndRadius(value: StringValue): Style {
	return createStyle({
		property: "border-end-end-radius",
		value: String(value),
		description:
			"The border-end-end-radius CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on on the element's writing-mode, direction, and text-orientation.",
		syntax: "<'border-top-left-radius'>",
		browserCompat: ["E89", "FF66", "FFA66", "S15", "SM15", "C89", "CA89", "O75"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-end-start-radius CSS property defines a logical border radius on an
 * element, which maps to a physical border radius depending on the element's
 * writing-mode, direction, and text-orientation.
 *
 * **Syntax:** `<'border-top-left-radius'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 89 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 89 |
 * | CA | 89 |
 * | Opera | 75 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-end-start-radius
 */
export function borderEndStartRadius(value: StringValue): Style {
	return createStyle({
		property: "border-end-start-radius",
		value: String(value),
		description:
			"The border-end-start-radius CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's writing-mode, direction, and text-orientation.",
		syntax: "<'border-top-left-radius'>",
		browserCompat: ["E89", "FF66", "FFA66", "S15", "SM15", "C89", "CA89", "O75"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property for setting 'border-image-source', 'border-image-slice',
 * 'border-image-width', 'border-image-outset' and 'border-image-repeat'. Omitted
 * values are set to their initial values.
 *
 * **Syntax:** `<'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 15 |
 * | FFA | 15 |
 * | Safari | 6 |
 * | SM | 6 |
 * | Chrome | 16 |
 * | CA | 18 |
 * | IE | 11 |
 * | Opera | 11 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image
 */
export function borderImage(value: StringValue): Style {
	return createStyle({
		property: "border-image",
		value: String(value),
		description:
			"Shorthand property for setting 'border-image-source', 'border-image-slice', 'border-image-width', 'border-image-outset' and 'border-image-repeat'. Omitted values are set to their initial values.",
		syntax:
			"<'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>",
		browserCompat: ["E12", "FF15", "FFA15", "S6", "SM6", "C16", "CA18", "IE11", "O11"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The values specify the amount by which the border image area extends beyond
 * the border box on the top, right, bottom, and left sides respectively. If the
 * fourth value is absent, it is the same as the second. If the third one is also
 * absent, it is the same as the first. If the second one is also absent, it is
 * the same as the first. Numbers represent multiples of the corresponding
 * border-width.
 *
 * **Syntax:** `[ <length [0,∞]> | <number [0,∞]> ]{1,4}  `
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 15 |
 * | FFA | 15 |
 * | Safari | 6 |
 * | SM | 6 |
 * | Chrome | 15 |
 * | CA | 18 |
 * | IE | 11 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-outset
 */
export function borderImageOutset(value: StringValue): Style {
	return createStyle({
		property: "border-image-outset",
		value: String(value),
		description:
			"The values specify the amount by which the border image area extends beyond the border box on the top, right, bottom, and left sides respectively. If the fourth value is absent, it is the same as the second. If the third one is also absent, it is the same as the first. If the second one is also absent, it is the same as the first. Numbers represent multiples of the corresponding border-width.",
		syntax: "[ <length [0,∞]> | <number [0,∞]> ]{1,4}  ",
		browserCompat: ["E12", "FF15", "FFA15", "S6", "SM6", "C15", "CA18", "IE11", "O15"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how the images for the sides and the middle part of the border image
 * are scaled and tiled. If the second keyword is absent, it is assumed to be the
 * same as the first.
 *
 * **Syntax:** `[ stretch | repeat | round | space ]{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 15 |
 * | FFA | 15 |
 * | Safari | 6 |
 * | SM | 9.3 |
 * | Chrome | 15 |
 * | CA | 18 |
 * | IE | 11 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-repeat
 */
export function borderImageRepeat(value: StringValue): Style {
	return createStyle({
		property: "border-image-repeat",
		value: String(value),
		description:
			"Specifies how the images for the sides and the middle part of the border image are scaled and tiled. If the second keyword is absent, it is assumed to be the same as the first.",
		syntax: "[ stretch | repeat | round | space ]{1,2}",
		browserCompat: ["E12", "FF15", "FFA15", "S6", "SM9.3", "C15", "CA18", "IE11", "O15"],
		baseline: { status: "high", baseline_low_date: "2016-03-21", baseline_high_date: "2018-09-21" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies inward offsets from the top, right, bottom, and left edges of the
 * image, dividing it into nine regions: four corners, four edges and a middle.
 *
 * **Syntax:** `[ <number [0,∞]> | <percentage [0,∞]> ]{1,4}  && fill?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 15 |
 * | FFA | 15 |
 * | Safari | 6 |
 * | SM | 6 |
 * | Chrome | 15 |
 * | CA | 18 |
 * | IE | 11 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-slice
 */
export function borderImageSlice(value: StringValue): Style {
	return createStyle({
		property: "border-image-slice",
		value: String(value),
		description:
			"Specifies inward offsets from the top, right, bottom, and left edges of the image, dividing it into nine regions: four corners, four edges and a middle.",
		syntax: "[ <number [0,∞]> | <percentage [0,∞]> ]{1,4}  && fill?",
		browserCompat: ["E12", "FF15", "FFA15", "S6", "SM6", "C15", "CA18", "IE11", "O15"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies an image to use instead of the border styles given by the
 * 'border-style' properties and as an additional background layer for the
 * element. If the value is 'none' or if the image cannot be displayed, the
 * border styles will be used.
 *
 * **Syntax:** `none | <image>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 15 |
 * | FFA | 15 |
 * | Safari | 6 |
 * | SM | 6 |
 * | Chrome | 15 |
 * | CA | 18 |
 * | IE | 11 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-source
 */
export function borderImageSource(value: ImageValue): Style {
	return createStyle({
		property: "border-image-source",
		value: String(value),
		description:
			"Specifies an image to use instead of the border styles given by the 'border-style' properties and as an additional background layer for the element. If the value is 'none' or if the image cannot be displayed, the border styles will be used.",
		syntax: "none | <image>",
		browserCompat: ["E12", "FF15", "FFA15", "S6", "SM6", "C15", "CA18", "IE11", "O15"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The four values of 'border-image-width' specify offsets that are used to
 * divide the border image area into nine parts. They represent inward distances
 * from the top, right, bottom, and left sides of the area, respectively.
 *
 * **Syntax:** `[ <length-percentage [0,∞]> | <number [0,∞]> | auto ]{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 13 |
 * | FFA | 14 |
 * | Safari | 6 |
 * | SM | 6 |
 * | Chrome | 16 |
 * | CA | 18 |
 * | IE | 11 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-image-width
 */
export function borderImageWidth(value: StringValue): Style {
	return createStyle({
		property: "border-image-width",
		value: String(value),
		description:
			"The four values of 'border-image-width' specify offsets that are used to divide the border image area into nine parts. They represent inward distances from the top, right, bottom, and left sides of the area, respectively.",
		syntax: "[ <length-percentage [0,∞]> | <number [0,∞]> | auto ]{1,4}",
		browserCompat: ["E12", "FF13", "FFA14", "S6", "SM6", "C16", "CA18", "IE11", "O15"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-inline CSS property is a shorthand property for setting the
 * individual logical inline border property values in a single place in the
 * style sheet.
 *
 * **Syntax:** `<'border-block-start'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline
 */
export function borderInline(value: StringValue): Style {
	return createStyle({
		property: "border-inline",
		value: String(value),
		description:
			"The border-inline CSS property is a shorthand property for setting the individual logical inline border property values in a single place in the style sheet.",
		syntax: "<'border-block-start'>",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-right'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-width'> || <'border-top-style'> || <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end
 */
export function borderInlineEnd(value: ColorValue): Style {
	return createStyle({
		property: "border-inline-end",
		value: String(value),
		description:
			"Logical 'border-right'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-width'> || <'border-top-style'> || <color>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-inline-color CSS property defines the color of the logical inline
 * borders of an element, which maps to a physical border color depending on the
 * element's writing mode, directionality, and text orientation. It corresponds
 * to the border-top-color and border-bottom-color, or border-right-color and
 * border-left-color property depending on the values defined for writing-mode,
 * direction, and text-orientation.
 *
 * **Syntax:** `<'border-top-color'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-color
 */
export function borderInlineColor(value: StringValue): Style {
	return createStyle({
		property: "border-inline-color",
		value: String(value),
		description:
			"The border-inline-color CSS property defines the color of the logical inline borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-color and border-bottom-color, or border-right-color and border-left-color property depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'border-top-color'>{1,2}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-inline-style CSS property defines the style of the logical inline
 * borders of an element, which maps to a physical border style depending on the
 * element's writing mode, directionality, and text orientation. It corresponds
 * to the border-top-style and border-bottom-style, or border-left-style and
 * border-right-style properties depending on the values defined for
 * writing-mode, direction, and text-orientation.
 *
 * **Syntax:** `<'border-top-style'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-style
 */
export function borderInlineStyle(value: StringValue): Style {
	return createStyle({
		property: "border-inline-style",
		value: String(value),
		description:
			"The border-inline-style CSS property defines the style of the logical inline borders of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-style and border-bottom-style, or border-left-style and border-right-style properties depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'border-top-style'>{1,2}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-inline-width CSS property defines the width of the logical inline
 * borders of an element, which maps to a physical border width depending on the
 * element's writing mode, directionality, and text orientation. It corresponds
 * to the border-top-width and border-bottom-width, or border-left-width, and
 * border-right-width property depending on the values defined for writing-mode,
 * direction, and text-orientation.
 *
 * **Syntax:** `<'border-top-width'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-width
 */
export function borderInlineWidth(value: StringValue): Style {
	return createStyle({
		property: "border-inline-width",
		value: String(value),
		description:
			"The border-inline-width CSS property defines the width of the logical inline borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the border-top-width and border-bottom-width, or border-left-width, and border-right-width property depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'border-top-width'>{1,2}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-right-color'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-color'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end-color
 */
export function borderInlineEndColor(value: StringValue): Style {
	return createStyle({
		property: "border-inline-end-color",
		value: String(value),
		description:
			"Logical 'border-right-color'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-color'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-right-style'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-style'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end-style
 */
export function borderInlineEndStyle(value: StringValue): Style {
	return createStyle({
		property: "border-inline-end-style",
		value: String(value),
		description:
			"Logical 'border-right-style'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-style'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-right-width'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-end-width
 */
export function borderInlineEndWidth(value: StringValue): Style {
	return createStyle({
		property: "border-inline-end-width",
		value: String(value),
		description:
			"Logical 'border-right-width'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-width'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-left'. Mapping depends on the parent element's 'writing-mode',
 * 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-width'> || <'border-top-style'> || <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start
 */
export function borderInlineStart(value: ColorValue): Style {
	return createStyle({
		property: "border-inline-start",
		value: String(value),
		description:
			"Logical 'border-left'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-width'> || <'border-top-style'> || <color>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-left-color'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-color'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start-color
 */
export function borderInlineStartColor(value: StringValue): Style {
	return createStyle({
		property: "border-inline-start-color",
		value: String(value),
		description:
			"Logical 'border-left-color'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-color'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-left-style'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-style'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start-style
 */
export function borderInlineStartStyle(value: StringValue): Style {
	return createStyle({
		property: "border-inline-start-style",
		value: String(value),
		description:
			"Logical 'border-left-style'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-style'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'border-left-width'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'border-top-width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-inline-start-width
 */
export function borderInlineStartWidth(value: StringValue): Style {
	return createStyle({
		property: "border-inline-start-width",
		value: String(value),
		description:
			"Logical 'border-left-width'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'border-top-width'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property for setting border width, style and color
 *
 * **Syntax:** `<line-width> || <line-style> || <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left
 */
export function borderLeft(value: ColorValue): Style {
	return createStyle({
		property: "border-left",
		value: String(value),
		description: "Shorthand property for setting border width, style and color",
		syntax: "<line-width> || <line-style> || <color>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the color of the left border.
 *
 * **Syntax:** `<color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left-color
 */
export function borderLeftColor(value: ColorValue): Style {
	return createStyle({
		property: "border-left-color",
		value: String(value),
		description: "Sets the color of the left border.",
		syntax: "<color>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the style of the left border.
 *
 * **Syntax:** `<line-style>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 14 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left-style
 */
export function borderLeftStyle(value: StringValue): Style {
	return createStyle({
		property: "border-left-style",
		value: String(value),
		description: "Sets the style of the left border.",
		syntax: "<line-style>",
		browserCompat: ["E12", "FF1", "FFA14", "S1", "SM1", "C1", "CA18", "IE5.5", "O9.2"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the thickness of the left border.
 *
 * **Syntax:** `<line-width>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-left-width
 */
export function borderLeftWidth(value: StringValue): Style {
	return createStyle({
		property: "border-left-width",
		value: String(value),
		description: "Sets the thickness of the left border.",
		syntax: "<line-width>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the radii of the outer border edge.
 *
 * **Syntax:** `<length-percentage [0,∞]>{1,4} [ / <length-percentage [0,∞]>{1,4} ]?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 4 |
 * | FFA | 4 |
 * | Safari | 5 |
 * | SM | 4.2 |
 * | Chrome | 4 |
 * | CA | 18 |
 * | IE | 9 |
 * | Opera | 10.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-radius
 */
export function borderRadius(value: StringValue): Style {
	return createStyle({
		property: "border-radius",
		value: String(value),
		description: "Defines the radii of the outer border edge.",
		syntax: "<length-percentage [0,∞]>{1,4} [ / <length-percentage [0,∞]>{1,4} ]?",
		browserCompat: ["E12", "FF4", "FFA4", "S5", "SM4.2", "C4", "CA18", "IE9", "O10.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property for setting border width, style and color
 *
 * **Syntax:** `<line-width> || <line-style> || <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 14 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right
 */
export function borderRight(value: ColorValue): Style {
	return createStyle({
		property: "border-right",
		value: String(value),
		description: "Shorthand property for setting border width, style and color",
		syntax: "<line-width> || <line-style> || <color>",
		browserCompat: ["E12", "FF1", "FFA14", "S1", "SM1", "C1", "CA18", "IE5.5", "O9.2"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the color of the right border.
 *
 * **Syntax:** `<color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right-color
 */
export function borderRightColor(value: ColorValue): Style {
	return createStyle({
		property: "border-right-color",
		value: String(value),
		description: "Sets the color of the right border.",
		syntax: "<color>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the style of the right border.
 *
 * **Syntax:** `<line-style>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 14 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right-style
 */
export function borderRightStyle(value: StringValue): Style {
	return createStyle({
		property: "border-right-style",
		value: String(value),
		description: "Sets the style of the right border.",
		syntax: "<line-style>",
		browserCompat: ["E12", "FF1", "FFA14", "S1", "SM1", "C1", "CA18", "IE5.5", "O9.2"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the thickness of the right border.
 *
 * **Syntax:** `<line-width>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-right-width
 */
export function borderRightWidth(value: StringValue): Style {
	return createStyle({
		property: "border-right-width",
		value: String(value),
		description: "Sets the thickness of the right border.",
		syntax: "<line-width>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The lengths specify the distance that separates adjoining cell borders. If one
 * length is specified, it gives both the horizontal and vertical spacing. If two
 * are specified, the first gives the horizontal spacing and the second the
 * vertical spacing. Lengths may not be negative.
 *
 * **Syntax:** `<length>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-spacing
 */
export function borderSpacing(value: LengthValue): Style {
	return createStyle({
		property: "border-spacing",
		value: String(value),
		description:
			"The lengths specify the distance that separates adjoining cell borders. If one length is specified, it gives both the horizontal and vertical spacing. If two are specified, the first gives the horizontal spacing and the second the vertical spacing. Lengths may not be negative.",
		syntax: "<length>{1,2}",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE8", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-start-end-radius CSS property defines a logical border radius on an
 * element, which maps to a physical border radius depending on the element's
 * writing-mode, direction, and text-orientation.
 *
 * **Syntax:** `<'border-top-left-radius'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 89 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 89 |
 * | CA | 89 |
 * | Opera | 75 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-start-end-radius
 */
export function borderStartEndRadius(value: StringValue): Style {
	return createStyle({
		property: "border-start-end-radius",
		value: String(value),
		description:
			"The border-start-end-radius CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's writing-mode, direction, and text-orientation.",
		syntax: "<'border-top-left-radius'>",
		browserCompat: ["E89", "FF66", "FFA66", "S15", "SM15", "C89", "CA89", "O75"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The border-start-start-radius CSS property defines a logical border radius on
 * an element, which maps to a physical border radius that depends on the
 * element's writing-mode, direction, and text-orientation.
 *
 * **Syntax:** `<'border-top-left-radius'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 89 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 89 |
 * | CA | 89 |
 * | Opera | 75 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-start-start-radius
 */
export function borderStartStartRadius(value: StringValue): Style {
	return createStyle({
		property: "border-start-start-radius",
		value: String(value),
		description:
			"The border-start-start-radius CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on the element's writing-mode, direction, and text-orientation.",
		syntax: "<'border-top-left-radius'>",
		browserCompat: ["E89", "FF66", "FFA66", "S15", "SM15", "C89", "CA89", "O75"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The style of the border around edges of an element.
 *
 * **Syntax:** `<line-style>{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-style
 */
export function borderStyle(value: StringValue): Style {
	return createStyle({
		property: "border-style",
		value: String(value),
		description: "The style of the border around edges of an element.",
		syntax: "<line-style>{1,4}",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property for setting border width, style and color
 *
 * **Syntax:** `<line-width> || <line-style> || <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top
 */
export function borderTop(value: ColorValue): Style {
	return createStyle({
		property: "border-top",
		value: String(value),
		description: "Shorthand property for setting border width, style and color",
		syntax: "<line-width> || <line-style> || <color>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the color of the top border.
 *
 * **Syntax:** `<color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-color
 */
export function borderTopColor(value: ColorValue): Style {
	return createStyle({
		property: "border-top-color",
		value: String(value),
		description: "Sets the color of the top border.",
		syntax: "<color>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the radii of the top left outer border edge.
 *
 * **Syntax:** `<length-percentage [0,∞]>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 4 |
 * | FFA | 4 |
 * | Safari | 5 |
 * | SM | 4.2 |
 * | Chrome | 4 |
 * | CA | 18 |
 * | IE | 9 |
 * | Opera | 10.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-left-radius
 */
export function borderTopLeftRadius(value: StringValue): Style {
	return createStyle({
		property: "border-top-left-radius",
		value: String(value),
		description: "Defines the radii of the top left outer border edge.",
		syntax: "<length-percentage [0,∞]>{1,2}",
		browserCompat: ["E12", "FF4", "FFA4", "S5", "SM4.2", "C4", "CA18", "IE9", "O10.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the radii of the top right outer border edge.
 *
 * **Syntax:** `<length-percentage [0,∞]>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 4 |
 * | FFA | 4 |
 * | Safari | 5 |
 * | SM | 4.2 |
 * | Chrome | 4 |
 * | CA | 18 |
 * | IE | 9 |
 * | Opera | 10.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-right-radius
 */
export function borderTopRightRadius(value: StringValue): Style {
	return createStyle({
		property: "border-top-right-radius",
		value: String(value),
		description: "Defines the radii of the top right outer border edge.",
		syntax: "<length-percentage [0,∞]>{1,2}",
		browserCompat: ["E12", "FF4", "FFA4", "S5", "SM4.2", "C4", "CA18", "IE9", "O10.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the style of the top border.
 *
 * **Syntax:** `<line-style>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-style
 */
export function borderTopStyle(value: StringValue): Style {
	return createStyle({
		property: "border-top-style",
		value: String(value),
		description: "Sets the style of the top border.",
		syntax: "<line-style>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE5.5", "O9.2"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the thickness of the top border.
 *
 * **Syntax:** `<line-width>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-top-width
 */
export function borderTopWidth(value: StringValue): Style {
	return createStyle({
		property: "border-top-width",
		value: String(value),
		description: "Sets the thickness of the top border.",
		syntax: "<line-width>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand that sets the four 'border-*-width' properties. If it has four
 * values, they set top, right, bottom and left in that order. If left is
 * missing, it is the same as right; if bottom is missing, it is the same as top;
 * if right is missing, it is the same as top.
 *
 * **Syntax:** `<line-width>{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 3 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border-width
 */
export function borderWidth(value: StringValue): Style {
	return createStyle({
		property: "border-width",
		value: String(value),
		description:
			"Shorthand that sets the four 'border-*-width' properties. If it has four values, they set top, right, bottom and left in that order. If left is missing, it is the same as right; if bottom is missing, it is the same as top; if right is missing, it is the same as top.",
		syntax: "<line-width>{1,4}",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM3", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how far an absolutely positioned box's bottom margin edge is offset
 * above the bottom edge of the box's 'containing block'.
 *
 * **Syntax:** `auto | <length-percentage> | <anchor()> | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5 |
 * | Opera | 6 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/bottom
 */
export function bottom(value: LengthPercentageValue): Style {
	return createStyle({
		property: "bottom",
		value: String(value),
		description:
			"Specifies how far an absolutely positioned box's bottom margin edge is offset above the bottom edge of the box's 'containing block'.",
		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE5", "O6"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The box-align CSS property specifies how an element aligns its contents across
 * its layout in a perpendicular direction. The effect of the property is only
 * visible if there is extra space in the box.
 *
 * **Syntax:** `start | center | end | baseline | stretch`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-align
 */
export function boxAlign(value: KeywordValue): Style {
	return createStyle({
		property: "box-align",
		value: String(value),
		description:
			"The box-align CSS property specifies how an element aligns its contents across its layout in a perpendicular direction. The effect of the property is only visible if there is extra space in the box.",
		syntax: "start | center | end | baseline | stretch",
		browserCompat: ["O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies whether individual boxes are treated as broken pieces of one
 * continuous box, or whether each box is individually wrapped with the border
 * and padding.
 *
 * **Syntax:** `slice | clone`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 130 |
 * | Firefox | 32 |
 * | FFA | 32 |
 * | Chrome | 130 |
 * | CA | 130 |
 * | Opera | 115 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-decoration-break
 */
export function boxDecorationBreak(value: KeywordValue): Style {
	return createStyle({
		property: "box-decoration-break",
		value: String(value),
		description:
			"Specifies whether individual boxes are treated as broken pieces of one continuous box, or whether each box is individually wrapped with the border and padding.",
		syntax: "slice | clone",
		browserCompat: ["E130", "FF32", "FFA32", "C130", "CA130", "O115"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The box-direction CSS property specifies whether a box lays out its contents
 * normally (from the top or left edge), or in reverse (from the bottom or right
 * edge).
 *
 * **Syntax:** `normal | reverse | inherit`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-direction
 */
export function boxDirection(value: KeywordValue): Style {
	return createStyle({
		property: "box-direction",
		value: String(value),
		description:
			"The box-direction CSS property specifies whether a box lays out its contents normally (from the top or left edge), or in reverse (from the bottom or right edge).",
		syntax: "normal | reverse | inherit",
		browserCompat: ["O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The -moz-box-flex and -webkit-box-flex CSS properties specify how a -moz-box
 * or -webkit-box grows to fill the box that contains it, in the direction of the
 * containing box's layout.
 *
 * **Syntax:** `<number>`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-flex
 */
export function boxFlex(value: NumberValue): Style {
	return createStyle({
		property: "box-flex",
		value: String(value),
		description:
			"The -moz-box-flex and -webkit-box-flex CSS properties specify how a -moz-box or -webkit-box grows to fill the box that contains it, in the direction of the containing box's layout.",
		syntax: "<number>",
		browserCompat: ["O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The box-flex-group CSS property assigns the flexbox's child elements to a flex
 * group.
 *
 * **Syntax:** `<integer>`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-flex-group
 */
export function boxFlexGroup(value: IntegerValue): Style {
	return createStyle({
		property: "box-flex-group",
		value: String(value),
		description: "The box-flex-group CSS property assigns the flexbox's child elements to a flex group.",
		syntax: "<integer>",
		browserCompat: ["O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The box-lines CSS property determines whether the box may have a single or
 * multiple lines (rows for horizontally oriented boxes, columns for vertically
 * oriented boxes).
 *
 * **Syntax:** `single | multiple`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-lines
 */
export function boxLines(value: KeywordValue): Style {
	return createStyle({
		property: "box-lines",
		value: String(value),
		description:
			"The box-lines CSS property determines whether the box may have a single or multiple lines (rows for horizontally oriented boxes, columns for vertically oriented boxes).",
		syntax: "single | multiple",
		browserCompat: ["O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The box-ordinal-group CSS property assigns the flexbox's child elements to an
 * ordinal group.
 *
 * **Syntax:** `<integer>`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-ordinal-group
 */
export function boxOrdinalGroup(value: IntegerValue): Style {
	return createStyle({
		property: "box-ordinal-group",
		value: String(value),
		description: "The box-ordinal-group CSS property assigns the flexbox's child elements to an ordinal group.",
		syntax: "<integer>",
		browserCompat: ["O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The box-orient CSS property specifies whether an element lays out its contents
 * horizontally or vertically.
 *
 * **Syntax:** `horizontal | vertical | inline-axis | block-axis | inherit`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-orient
 */
export function boxOrient(value: KeywordValue): Style {
	return createStyle({
		property: "box-orient",
		value: String(value),
		description:
			"The box-orient CSS property specifies whether an element lays out its contents horizontally or vertically.",
		syntax: "horizontal | vertical | inline-axis | block-axis | inherit",
		browserCompat: ["O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The -moz-box-pack and -webkit-box-pack CSS properties specify how a -moz-box
 * or -webkit-box packs its contents in the direction of its layout. The effect
 * of this is only visible if there is extra space in the box.
 *
 * **Syntax:** `start | center | end | justify`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-pack
 */
export function boxPack(value: KeywordValue): Style {
	return createStyle({
		property: "box-pack",
		value: String(value),
		description:
			"The -moz-box-pack and -webkit-box-pack CSS properties specify how a -moz-box or -webkit-box packs its contents in the direction of its layout. The effect of this is only visible if there is extra space in the box.",
		syntax: "start | center | end | justify",
		browserCompat: ["O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Attaches one or more drop-shadows to the box. The property is a
 * comma-separated list of shadows, each specified by 2-4 length values, an
 * optional color, and an optional 'inset' keyword. Omitted lengths are 0;
 * omitted colors are a user agent chosen color.
 *
 * **Syntax:** `none | <shadow>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 4 |
 * | FFA | 4 |
 * | Safari | 5.1 |
 * | SM | 5 |
 * | Chrome | 10 |
 * | CA | 18 |
 * | IE | 9 |
 * | Opera | 10.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-shadow
 */
export function boxShadow(value: StringValue): Style {
	return createStyle({
		property: "box-shadow",
		value: String(value),
		description:
			"Attaches one or more drop-shadows to the box. The property is a comma-separated list of shadows, each specified by 2-4 length values, an optional color, and an optional 'inset' keyword. Omitted lengths are 0; omitted colors are a user agent chosen color.",
		syntax: "none | <shadow>#",
		browserCompat: ["E12", "FF4", "FFA4", "S5.1", "SM5", "C10", "CA18", "IE9", "O10.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the behavior of the 'width' and 'height' properties.
 *
 * **Syntax:** `content-box | border-box`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 29 |
 * | FFA | 29 |
 * | Safari | 5.1 |
 * | SM | 6 |
 * | Chrome | 10 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/box-sizing
 */
export function boxSizing(value: KeywordValue): Style {
	return createStyle({
		property: "box-sizing",
		value: String(value),
		description: "Specifies the behavior of the 'width' and 'height' properties.",
		syntax: "content-box | border-box",
		browserCompat: ["E12", "FF29", "FFA29", "S5.1", "SM6", "C10", "CA18", "IE8", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes the page/column/region break behavior after the generated box.
 *
 * **Syntax:** `auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 65 |
 * | FFA | 65 |
 * | Safari | 10 |
 * | SM | 10 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 37 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/break-after
 */
export function breakAfter(value: KeywordValue): Style {
	return createStyle({
		property: "break-after",
		value: String(value),
		description: "Describes the page/column/region break behavior after the generated box.",
		syntax:
			"auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region",
		browserCompat: ["E12", "FF65", "FFA65", "S10", "SM10", "C50", "CA50", "IE10", "O37"],
		baseline: { status: "high", baseline_low_date: "2019-01-29", baseline_high_date: "2021-07-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes the page/column/region break behavior before the generated box.
 *
 * **Syntax:** `auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 65 |
 * | FFA | 65 |
 * | Safari | 10 |
 * | SM | 10 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 37 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/break-before
 */
export function breakBefore(value: KeywordValue): Style {
	return createStyle({
		property: "break-before",
		value: String(value),
		description: "Describes the page/column/region break behavior before the generated box.",
		syntax:
			"auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region",
		browserCompat: ["E12", "FF65", "FFA65", "S10", "SM10", "C50", "CA50", "IE10", "O37"],
		baseline: { status: "high", baseline_low_date: "2019-01-29", baseline_high_date: "2021-07-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes the page/column/region break behavior inside the principal box.
 *
 * **Syntax:** `auto | avoid | avoid-page | avoid-column | avoid-region`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 65 |
 * | FFA | 65 |
 * | Safari | 10 |
 * | SM | 10 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 37 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/break-inside
 */
export function breakInside(value: KeywordValue): Style {
	return createStyle({
		property: "break-inside",
		value: String(value),
		description: "Describes the page/column/region break behavior inside the principal box.",
		syntax: "auto | avoid | avoid-page | avoid-column | avoid-region",
		browserCompat: ["E12", "FF65", "FFA65", "S10", "SM10", "C50", "CA50", "IE10", "O37"],
		baseline: { status: "high", baseline_low_date: "2019-01-29", baseline_high_date: "2021-07-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the position of the caption box with respect to the table box.
 *
 * **Syntax:** `top | bottom`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/caption-side
 */
export function captionSide(value: KeywordValue): Style {
	return createStyle({
		property: "caption-side",
		value: String(value),
		description: "Specifies the position of the caption box with respect to the table box.",
		syntax: "top | bottom",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE8", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand for setting caret-color and caret-shape.
 *
 * **Syntax:** `<'caret-color'> || <'caret-shape'>`
 */
export function caret(value: StringValue): Style {
	return createStyle({
		property: "caret",
		value: String(value),
		description: "Shorthand for setting caret-color and caret-shape.",
		syntax: "<'caret-color'> || <'caret-shape'>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls the color of the text insertion indicator.
 *
 * **Syntax:** `auto | <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 53 |
 * | FFA | 53 |
 * | Safari | 11.1 |
 * | SM | 11.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/caret-color
 */
export function caretColor(value: ColorValue): Style {
	return createStyle({
		property: "caret-color",
		value: String(value),
		description: "Controls the color of the text insertion indicator.",
		syntax: "auto | <color>",
		browserCompat: ["E79", "FF53", "FFA53", "S11.1", "SM11.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the desired shape of the text insertion caret.
 *
 * **Syntax:** `auto | bar | block | underscore`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 124 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/caret-shape
 */
export function caretShape(value: KeywordValue): Style {
	return createStyle({
		property: "caret-shape",
		value: String(value),
		description: "Specifies the desired shape of the text insertion caret.",
		syntax: "auto | bar | block | underscore",
		browserCompat: ["O124"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Indicates which sides of an element's box(es) may not be adjacent to an
 * earlier floating box. The 'clear' property does not consider floats inside the
 * element itself or in other block formatting contexts.
 *
 * **Syntax:** `none | left | right | both | inline-start | inline-end`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clear
 */
export function clear(value: KeywordValue): Style {
	return createStyle({
		property: "clear",
		value: String(value),
		description:
			"Indicates which sides of an element's box(es) may not be adjacent to an earlier floating box. The 'clear' property does not consider floats inside the element itself or in other block formatting contexts.",
		syntax: "none | left | right | both | inline-start | inline-end",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Deprecated. Use the 'clip-path' property when support allows. Defines the
 * visible portion of an element's box.
 *
 * **Syntax:** `<shape> | auto`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clip
 */
export function clip(value: ShapeValue): Style {
	return createStyle({
		property: "clip",
		value: String(value),
		description:
			"Deprecated. Use the 'clip-path' property when support allows. Defines the visible portion of an element's box.",
		syntax: "<shape> | auto",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies a clipping path where everything inside the path is visible and
 * everything outside is clipped out.
 *
 * **Syntax:** `<clip-source> | [ <basic-shape> || <geometry-box> ] | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 3.5 |
 * | FFA | 4 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 * | Chrome | 55 |
 * | CA | 55 |
 * | IE | 10 |
 * | Opera | 42 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clip-path
 */
export function clipPath(value: StringValue): Style {
	return createStyle({
		property: "clip-path",
		value: String(value),
		description:
			"Specifies a clipping path where everything inside the path is visible and everything outside is clipped out.",
		syntax: "<clip-source> | [ <basic-shape> || <geometry-box> ] | none",
		browserCompat: ["E79", "FF3.5", "FFA4", "S9.1", "SM9.3", "C55", "CA55", "IE10", "O42"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Indicates the algorithm which is to be used to determine what parts of the
 * canvas are included inside the shape.
 *
 * **Syntax:** `nonzero | evenodd`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 3.5 |
 * | FFA | 4 |
 * | Safari | 5 |
 * | SM | 4.2 |
 * | Chrome | 15 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/clip-rule
 */
export function clipRule(value: KeywordValue): Style {
	return createStyle({
		property: "clip-rule",
		value: String(value),
		description:
			"Indicates the algorithm which is to be used to determine what parts of the canvas are included inside the shape.",
		syntax: "nonzero | evenodd",
		browserCompat: ["E79", "FF3.5", "FFA4", "S5", "SM4.2", "C15", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the color of an element's text
 *
 * **Syntax:** `<color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/color
 */
export function color(value: ColorValue): Style {
	return createStyle({
		property: "color",
		value: String(value),
		description: "Sets the color of an element's text",
		syntax: "<color>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the color space for imaging operations performed via filter effects.
 *
 * **Syntax:** `auto | sRGB | linearRGB`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 3 |
 * | SM | 2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/color-interpolation-filters
 */
export function colorInterpolationFilters(value: StringValue): Style {
	return createStyle({
		property: "color-interpolation-filters",
		value: String(value),
		description: "Specifies the color space for imaging operations performed via filter effects.",
		syntax: "auto | sRGB | linearRGB",
		browserCompat: ["E79", "FF3", "FFA4", "S3", "SM2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The color-scheme CSS property allows an element to indicate which color
 * schemes it can comfortably be rendered in.
 *
 * **Syntax:** `normal | [ light | dark | <custom-ident> ]+ && only?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 81 |
 * | Firefox | 96 |
 * | FFA | 96 |
 * | Safari | 13 |
 * | SM | 13 |
 * | Chrome | 81 |
 * | CA | 81 |
 * | Opera | 68 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/color-scheme
 */
export function colorScheme(value: CustomIdentValue): Style {
	return createStyle({
		property: "color-scheme",
		value: String(value),
		description:
			"The color-scheme CSS property allows an element to indicate which color schemes it can comfortably be rendered in.",
		syntax: "normal | [ light | dark | <custom-ident> ]+ && only?",
		browserCompat: ["E81", "FF96", "FFA96", "S13", "SM13", "C81", "CA81", "O68"],
		baseline: { status: "high", baseline_low_date: "2022-01-11", baseline_high_date: "2024-07-11" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes the optimal number of columns into which the content of the element
 * will be flowed.
 *
 * **Syntax:** `<integer> | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 37 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-count
 */
export function columnCount(value: IntegerValue): Style {
	return createStyle({
		property: "column-count",
		value: String(value),
		description: "Describes the optimal number of columns into which the content of the element will be flowed.",
		syntax: "<integer> | auto",
		browserCompat: ["E12", "FF52", "FFA52", "S9", "SM9", "C50", "CA50", "IE10", "O37"],
		baseline: { status: "high", baseline_low_date: "2017-03-07", baseline_high_date: "2019-09-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * In continuous media, this property will only be consulted if the length of
 * columns has been constrained. Otherwise, columns will automatically be
 * balanced.
 *
 * **Syntax:** `auto | balance`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 37 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-fill
 */
export function columnFill(value: KeywordValue): Style {
	return createStyle({
		property: "column-fill",
		value: String(value),
		description:
			"In continuous media, this property will only be consulted if the length of columns has been constrained. Otherwise, columns will automatically be balanced.",
		syntax: "auto | balance",
		browserCompat: ["E12", "FF52", "FFA52", "S9", "SM9", "C50", "CA50", "IE10", "O37"],
		baseline: { status: "high", baseline_low_date: "2017-03-07", baseline_high_date: "2019-09-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the gap between columns. If there is a column rule between columns, it
 * will appear in the middle of the gap.
 *
 * **Syntax:** `normal | <length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 3 |
 * | SM | 2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 10 |
 * | Opera | 11.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-gap
 */
export function columnGap(value: LengthPercentageValue): Style {
	return createStyle({
		property: "column-gap",
		value: String(value),
		description:
			"Sets the gap between columns. If there is a column rule between columns, it will appear in the middle of the gap.",
		syntax: "normal | <length-percentage>",
		browserCompat: ["E12", "FF1.5", "FFA4", "S3", "SM2", "C1", "CA18", "IE10", "O11.1"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand for setting 'column-rule-width', 'column-rule-style', and
 * 'column-rule-color' at the same place in the style sheet. Omitted values are
 * set to their initial values.
 *
 * **Syntax:** `<'column-rule-width'> || <'column-rule-style'> || <'column-rule-color'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 11.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule
 */
export function columnRule(value: StringValue): Style {
	return createStyle({
		property: "column-rule",
		value: String(value),
		description:
			"Shorthand for setting 'column-rule-width', 'column-rule-style', and 'column-rule-color' at the same place in the style sheet. Omitted values are set to their initial values.",
		syntax: "<'column-rule-width'> || <'column-rule-style'> || <'column-rule-color'>",
		browserCompat: ["E12", "FF52", "FFA52", "S9", "SM9", "C50", "CA50", "IE10", "O11.1"],
		baseline: { status: "high", baseline_low_date: "2017-03-07", baseline_high_date: "2019-09-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the color of the column rule
 *
 * **Syntax:** `<color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 11.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule-color
 */
export function columnRuleColor(value: ColorValue): Style {
	return createStyle({
		property: "column-rule-color",
		value: String(value),
		description: "Sets the color of the column rule",
		syntax: "<color>",
		browserCompat: ["E12", "FF52", "FFA52", "S9", "SM9", "C50", "CA50", "IE10", "O11.1"],
		baseline: { status: "high", baseline_low_date: "2017-03-07", baseline_high_date: "2019-09-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the style of the rule between columns of an element.
 *
 * **Syntax:** `<'border-style'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 11.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule-style
 */
export function columnRuleStyle(value: StringValue): Style {
	return createStyle({
		property: "column-rule-style",
		value: String(value),
		description: "Sets the style of the rule between columns of an element.",
		syntax: "<'border-style'>",
		browserCompat: ["E12", "FF52", "FFA52", "S9", "SM9", "C50", "CA50", "IE10", "O11.1"],
		baseline: { status: "high", baseline_low_date: "2017-03-07", baseline_high_date: "2019-09-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the width of the rule between columns. Negative values are not allowed.
 *
 * **Syntax:** `<'border-width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 11.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-rule-width
 */
export function columnRuleWidth(value: StringValue): Style {
	return createStyle({
		property: "column-rule-width",
		value: String(value),
		description: "Sets the width of the rule between columns. Negative values are not allowed.",
		syntax: "<'border-width'>",
		browserCompat: ["E12", "FF52", "FFA52", "S9", "SM9", "C50", "CA50", "IE10", "O11.1"],
		baseline: { status: "high", baseline_low_date: "2017-03-07", baseline_high_date: "2019-09-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes the page/column break behavior after the generated box.
 *
 * **Syntax:** `none | all`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 71 |
 * | FFA | 79 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 37 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-span
 */
export function columnSpan(value: KeywordValue): Style {
	return createStyle({
		property: "column-span",
		value: String(value),
		description: "Describes the page/column break behavior after the generated box.",
		syntax: "none | all",
		browserCompat: ["E12", "FF71", "FFA79", "S9", "SM9", "C50", "CA50", "IE10", "O37"],
		baseline: { status: "high", baseline_low_date: "2020-07-28", baseline_high_date: "2023-01-28" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes the width of columns in multicol elements.
 *
 * **Syntax:** `<length> | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 50 |
 * | FFA | 50 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 11.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/column-width
 */
export function columnWidth(value: LengthValue): Style {
	return createStyle({
		property: "column-width",
		value: String(value),
		description: "Describes the width of columns in multicol elements.",
		syntax: "<length> | auto",
		browserCompat: ["E12", "FF50", "FFA50", "S9", "SM9", "C50", "CA50", "IE10", "O11.1"],
		baseline: { status: "high", baseline_low_date: "2016-11-15", baseline_high_date: "2019-05-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * A shorthand property which sets both 'column-width' and 'column-count'.
 *
 * **Syntax:** `<'column-width'> || <'column-count'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 50 |
 * | CA | 50 |
 * | IE | 10 |
 * | Opera | 11.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/columns
 */
export function columns(value: StringValue): Style {
	return createStyle({
		property: "columns",
		value: String(value),
		description: "A shorthand property which sets both 'column-width' and 'column-count'.",
		syntax: "<'column-width'> || <'column-count'>",
		browserCompat: ["E12", "FF52", "FFA52", "S9", "SM9", "C50", "CA50", "IE10", "O11.1"],
		baseline: { status: "high", baseline_low_date: "2017-03-07", baseline_high_date: "2019-09-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Indicates that an element and its contents are, as much as possible,
 * independent of the rest of the document tree.
 *
 * **Syntax:** `none | strict | content | [ [ size || inline-size ] || layout || style || paint ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 52 |
 * | CA | 52 |
 * | Opera | 39 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain
 */
export function contain(value: StringValue): Style {
	return createStyle({
		property: "contain",
		value: String(value),
		description:
			"Indicates that an element and its contents are, as much as possible, independent of the rest of the document tree.",
		syntax: "none | strict | content | [ [ size || inline-size ] || layout || style || paint ]",
		browserCompat: ["E79", "FF69", "FFA79", "S15.4", "SM15.4", "C52", "CA52", "O39"],
		baseline: { status: "high", baseline_low_date: "2022-03-14", baseline_high_date: "2024-09-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Size of an element when the element is subject to size containment.
 *
 * **Syntax:** `[ auto? [ none | <length> ] ]{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 83 |
 * | Firefox | 107 |
 * | FFA | 107 |
 * | Safari | 17 |
 * | SM | 17 |
 * | Chrome | 83 |
 * | CA | 83 |
 * | Opera | 69 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-size
 */
export function containIntrinsicSize(value: LengthValue): Style {
	return createStyle({
		property: "contain-intrinsic-size",
		value: String(value),
		description: "Size of an element when the element is subject to size containment.",
		syntax: "[ auto? [ none | <length> ] ]{1,2}",
		browserCompat: ["E83", "FF107", "FFA107", "S17", "SM17", "C83", "CA83", "O69"],
		baseline: { status: "low", baseline_low_date: "2023-09-18" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Block size of an element when the element is subject to size containment.
 *
 * **Syntax:** `auto? [ none | <length> ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 95 |
 * | Firefox | 107 |
 * | FFA | 107 |
 * | Safari | 17 |
 * | SM | 17 |
 * | Chrome | 95 |
 * | CA | 95 |
 * | Opera | 81 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-block-size
 */
export function containIntrinsicBlockSize(value: LengthValue): Style {
	return createStyle({
		property: "contain-intrinsic-block-size",
		value: String(value),
		description: "Block size of an element when the element is subject to size containment.",
		syntax: "auto? [ none | <length> ]",
		browserCompat: ["E95", "FF107", "FFA107", "S17", "SM17", "C95", "CA95", "O81"],
		baseline: { status: "low", baseline_low_date: "2023-09-18" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Height of an element when the element is subject to size containment.
 *
 * **Syntax:** `auto? [ none | <length> ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 95 |
 * | Firefox | 107 |
 * | FFA | 107 |
 * | Safari | 17 |
 * | SM | 17 |
 * | Chrome | 95 |
 * | CA | 95 |
 * | Opera | 81 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-height
 */
export function containIntrinsicHeight(value: LengthValue): Style {
	return createStyle({
		property: "contain-intrinsic-height",
		value: String(value),
		description: "Height of an element when the element is subject to size containment.",
		syntax: "auto? [ none | <length> ]",
		browserCompat: ["E95", "FF107", "FFA107", "S17", "SM17", "C95", "CA95", "O81"],
		baseline: { status: "low", baseline_low_date: "2023-09-18" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Inline size of an element when the element is subject to size containment.
 *
 * **Syntax:** `auto? [ none | <length> ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 95 |
 * | Firefox | 107 |
 * | FFA | 107 |
 * | Safari | 17 |
 * | SM | 17 |
 * | Chrome | 95 |
 * | CA | 95 |
 * | Opera | 81 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-inline-size
 */
export function containIntrinsicInlineSize(value: LengthValue): Style {
	return createStyle({
		property: "contain-intrinsic-inline-size",
		value: String(value),
		description: "Inline size of an element when the element is subject to size containment.",
		syntax: "auto? [ none | <length> ]",
		browserCompat: ["E95", "FF107", "FFA107", "S17", "SM17", "C95", "CA95", "O81"],
		baseline: { status: "low", baseline_low_date: "2023-09-18" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Width of an element when the element is subject to size containment.
 *
 * **Syntax:** `auto? [ none | <length> ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 95 |
 * | Firefox | 107 |
 * | FFA | 107 |
 * | Safari | 17 |
 * | SM | 17 |
 * | Chrome | 95 |
 * | CA | 95 |
 * | Opera | 81 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/contain-intrinsic-width
 */
export function containIntrinsicWidth(value: LengthValue): Style {
	return createStyle({
		property: "contain-intrinsic-width",
		value: String(value),
		description: "Width of an element when the element is subject to size containment.",
		syntax: "auto? [ none | <length> ]",
		browserCompat: ["E95", "FF107", "FFA107", "S17", "SM17", "C95", "CA95", "O81"],
		baseline: { status: "low", baseline_low_date: "2023-09-18" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The container shorthand CSS property establishes the element as a query
 * container and specifies the name or name for the containment context used in a
 * container query.
 *
 * **Syntax:** `<'container-name'> [ / <'container-type'> ]?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 105 |
 * | Firefox | 110 |
 * | FFA | 110 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 105 |
 * | CA | 105 |
 * | Opera | 91 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/container
 */
export function container(value: StringValue): Style {
	return createStyle({
		property: "container",
		value: String(value),
		description:
			"The container shorthand CSS property establishes the element as a query container and specifies the name or name for the containment context used in a container query.",
		syntax: "<'container-name'> [ / <'container-type'> ]?",
		browserCompat: ["E105", "FF110", "FFA110", "S16", "SM16", "C105", "CA105", "O91"],
		baseline: { status: "high", baseline_low_date: "2023-02-14", baseline_high_date: "2025-08-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The container-name CSS property specifies a list of query container names used
 * by the @container at-rule in a container query.
 *
 * **Syntax:** `none | <custom-ident>+`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 105 |
 * | Firefox | 110 |
 * | FFA | 110 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 105 |
 * | CA | 105 |
 * | Opera | 91 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/container-name
 */
export function containerName(value: CustomIdentValue): Style {
	return createStyle({
		property: "container-name",
		value: String(value),
		description:
			"The container-name CSS property specifies a list of query container names used by the @container at-rule in a container query.",
		syntax: "none | <custom-ident>+",
		browserCompat: ["E105", "FF110", "FFA110", "S16", "SM16", "C105", "CA105", "O91"],
		baseline: { status: "high", baseline_low_date: "2023-02-14", baseline_high_date: "2025-08-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The container-type CSS property is used to define the type of containment used
 * in a container query.
 *
 * **Syntax:** `normal | [ [ size | inline-size ] || scroll-state ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 105 |
 * | Firefox | 110 |
 * | FFA | 110 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 105 |
 * | CA | 105 |
 * | Opera | 91 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/container-type
 */
export function containerType(value: StringValue): Style {
	return createStyle({
		property: "container-type",
		value: String(value),
		description: "The container-type CSS property is used to define the type of containment used in a container query.",
		syntax: "normal | [ [ size | inline-size ] || scroll-state ]",
		browserCompat: ["E105", "FF110", "FFA110", "S16", "SM16", "C105", "CA105", "O91"],
		baseline: { status: "high", baseline_low_date: "2023-02-14", baseline_high_date: "2025-08-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines which page-based occurrence of a given element is applied to a
 * counter or string value.
 *
 * **Syntax:** `normal | none | [ <content-replacement> | <content-list> ] [ / [ <string> | <counter> | <attr()> ]+ ]?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/content
 */
export function content(value: StringValue): Style {
	return createStyle({
		property: "content",
		value: String(value),
		description: "Determines which page-based occurrence of a given element is applied to a counter or string value.",
		syntax: "normal | none | [ <content-replacement> | <content-list> ] [ / [ <string> | <counter> | <attr()> ]+ ]?",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE8", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls whether or not an element renders its contents at all, along with
 * forcing a strong set of containments, allowing user agents to potentially omit
 * large swathes of layout and rendering work until it becomes needed.
 *
 * **Syntax:** `visible | auto | hidden`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 85 |
 * | Firefox | 125 |
 * | FFA | 125 |
 * | Safari | 18 |
 * | SM | 18 |
 * | Chrome | 85 |
 * | CA | 85 |
 * | Opera | 71 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/content-visibility
 */
export function contentVisibility(value: KeywordValue): Style {
	return createStyle({
		property: "content-visibility",
		value: String(value),
		description:
			"Controls whether or not an element renders its contents at all, along with forcing a strong set of containments, allowing user agents to potentially omit large swathes of layout and rendering work until it becomes needed.",
		syntax: "visible | auto | hidden",
		browserCompat: ["E85", "FF125", "FFA125", "S18", "SM18", "C85", "CA85", "O71"],
		baseline: { status: "low", baseline_low_date: "2024-09-16" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Manipulate the value of existing counters.
 *
 * **Syntax:** `[ <counter-name> <integer>? ]+ | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 25 |
 * | Safari | 3 |
 * | SM | 1 |
 * | Chrome | 2 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/counter-increment
 */
export function counterIncrement(value: IntegerValue): Style {
	return createStyle({
		property: "counter-increment",
		value: String(value),
		description: "Manipulate the value of existing counters.",
		syntax: "[ <counter-name> <integer>? ]+ | none",
		browserCompat: ["E12", "FF1", "FFA25", "S3", "SM1", "C2", "CA18", "IE8", "O9.2"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Property accepts one or more names of counters (identifiers), each one
 * optionally followed by an integer. The integer gives the value that the
 * counter is set to on each occurrence of the element.
 *
 * **Syntax:** `[ <counter-name> <integer>? | <reversed-counter-name> <integer>? ]+ | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 25 |
 * | Safari | 3 |
 * | SM | 1 |
 * | Chrome | 2 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/counter-reset
 */
export function counterReset(value: IntegerValue): Style {
	return createStyle({
		property: "counter-reset",
		value: String(value),
		description:
			"Property accepts one or more names of counters (identifiers), each one optionally followed by an integer. The integer gives the value that the counter is set to on each occurrence of the element.",
		syntax: "[ <counter-name> <integer>? | <reversed-counter-name> <integer>? ]+ | none",
		browserCompat: ["E12", "FF1", "FFA25", "S3", "SM1", "C2", "CA18", "IE8", "O9.2"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The counter-set CSS property sets a CSS counter to a given value. It
 * manipulates the value of existing counters, and will only create new counters
 * if there isn't already a counter of the given name on the element.
 *
 * **Syntax:** `[ <counter-name> <integer>? ]+ | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 85 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 17.2 |
 * | SM | 17.2 |
 * | Chrome | 85 |
 * | CA | 85 |
 * | Opera | 71 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/counter-set
 */
export function counterSet(value: IntegerValue): Style {
	return createStyle({
		property: "counter-set",
		value: String(value),
		description:
			"The counter-set CSS property sets a CSS counter to a given value. It manipulates the value of existing counters, and will only create new counters if there isn't already a counter of the given name on the element.",
		syntax: "[ <counter-name> <integer>? ]+ | none",
		browserCompat: ["E85", "FF68", "FFA68", "S17.2", "SM17.2", "C85", "CA85", "O71"],
		baseline: { status: "low", baseline_low_date: "2023-12-11" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Allows control over cursor appearance in an element
 *
 * **Syntax:** `[ [ <url> [ <x> <y> ]? , ]* <cursor-predefined> ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 95 |
 * | Safari | 1.2 |
 * | SM | 13.4 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/cursor
 */
export function cursor(value: UrlValue): Style {
	return createStyle({
		property: "cursor",
		value: String(value),
		description: "Allows control over cursor appearance in an element",
		syntax: "[ [ <url> [ <x> <y> ]? , ]* <cursor-predefined> ]",
		browserCompat: ["E12", "FF1", "FFA95", "S1.2", "SM13.4", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "high", baseline_low_date: "2021-12-07", baseline_high_date: "2024-06-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The d CSS property defines a path to be drawn by the SVG path element. If
 * present, it overrides the element's d attribute.
 *
 * **Syntax:** `none | path(<string>)`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 97 |
 * | FFA | 97 |
 * | Chrome | 52 |
 * | CA | 52 |
 * | Opera | 39 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/d
 */
export function d(value: StringValue): Style {
	return createStyle({
		property: "d",
		value: String(value),
		description:
			"The d CSS property defines a path to be drawn by the SVG path element. If present, it overrides the element's d attribute.",
		syntax: "none | path(<string>)",
		browserCompat: ["E79", "FF97", "FFA97", "C52", "CA52", "O39"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The cx CSS property defines the x-axis center point of an SVG circle or
 * ellipse element. If present, it overrides the element's cx attribute.
 *
 * **Syntax:** `<length> | <percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/cx
 */
export function cx(value: LengthValue): Style {
	return createStyle({
		property: "cx",
		value: String(value),
		description:
			"The cx CSS property defines the x-axis center point of an SVG circle or ellipse element. If present, it overrides the element's cx attribute.",
		syntax: "<length> | <percentage>",
		browserCompat: ["E79", "FF69", "FFA79", "S9", "SM9", "C43", "CA43", "O30"],
		baseline: { status: "high", baseline_low_date: "2020-07-28", baseline_high_date: "2023-01-28" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The cy CSS property defines the y-axis center point of an SVG circle or
 * ellipse elements. If present, it overrides the element's cy attribute.
 *
 * **Syntax:** `<length> | <percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/cy
 */
export function cy(value: LengthValue): Style {
	return createStyle({
		property: "cy",
		value: String(value),
		description:
			"The cy CSS property defines the y-axis center point of an SVG circle or ellipse elements. If present, it overrides the element's cy attribute.",
		syntax: "<length> | <percentage>",
		browserCompat: ["E79", "FF69", "FFA79", "S9", "SM9", "C43", "CA43", "O30"],
		baseline: { status: "high", baseline_low_date: "2020-07-28", baseline_high_date: "2023-01-28" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the inline base direction or directionality of any bidi paragraph,
 * embedding, isolate, or override established by the box. Note: for HTML content
 * use the 'dir' attribute and 'bdo' element rather than this property.
 *
 * **Syntax:** `ltr | rtl`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 2 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/direction
 */
export function direction(value: KeywordValue): Style {
	return createStyle({
		property: "direction",
		value: String(value),
		description:
			"Specifies the inline base direction or directionality of any bidi paragraph, embedding, isolate, or override established by the box. Note: for HTML content use the 'dir' attribute and 'bdo' element rather than this property.",
		syntax: "ltr | rtl",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C2", "CA18", "IE5.5", "O9.2"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * In combination with 'float' and 'position', determines the type of box or
 * boxes that are generated for an element.
 *
 * **Syntax:** `[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/display
 */
export function display(value: StringValue): Style {
	return createStyle({
		property: "display",
		value: String(value),
		description:
			"In combination with 'float' and 'position', determines the type of box or boxes that are generated for an element.",
		syntax:
			"[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The dominant-baseline CSS property specifies the specific baseline used to
 * align the box's text and inline-level contents. It also indicates the default
 * alignment baseline of any boxes participating in baseline alignment in the
 * box's alignment context. If present, it overrides the shape's
 * dominant-baseline attribute.
 *
 * **Syntax:** `auto | text-bottom | alphabetic | ideographic | middle | central | mathematical | hanging | text-top`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/dominant-baseline
 */
export function dominantBaseline(value: KeywordValue): Style {
	return createStyle({
		property: "dominant-baseline",
		value: String(value),
		description:
			"The dominant-baseline CSS property specifies the specific baseline used to align the box's text and inline-level contents. It also indicates the default alignment baseline of any boxes participating in baseline alignment in the box's alignment context. If present, it overrides the shape's dominant-baseline attribute.",
		syntax: "auto | text-bottom | alphabetic | ideographic | middle | central | mathematical | hanging | text-top",
		browserCompat: ["E79", "FF1", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * In the separated borders model, this property controls the rendering of
 * borders and backgrounds around cells that have no visible content.
 *
 * **Syntax:** `show | hide`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1.2 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/empty-cells
 */
export function emptyCells(value: KeywordValue): Style {
	return createStyle({
		property: "empty-cells",
		value: String(value),
		description:
			"In the separated borders model, this property controls the rendering of borders and backgrounds around cells that have no visible content.",
		syntax: "show | hide",
		browserCompat: ["E12", "FF1", "FFA4", "S1.2", "SM1", "C1", "CA18", "IE8", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The field-sizing CSS property enables you to control the sizing behavior of
 * elements that are given a default preferred size, such as form control
 * elements. This property enables you to override the default sizing behavior,
 * allowing form controls to adjust in size to fit their contents.
 *
 * **Syntax:** `content | fixed`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 123 |
 * | Chrome | 123 |
 * | CA | 123 |
 * | Opera | 109 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/field-sizing
 */
export function fieldSizing(value: KeywordValue): Style {
	return createStyle({
		property: "field-sizing",
		value: String(value),
		description:
			"The field-sizing CSS property enables you to control the sizing behavior of elements that are given a default preferred size, such as form control elements. This property enables you to override the default sizing behavior, allowing form controls to adjust in size to fit their contents.",
		syntax: "content | fixed",
		browserCompat: ["E123", "Spreview", "C123", "CA123", "O109"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Paints the interior of the given graphical element.
 *
 * **Syntax:** `<paint>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/fill
 */
export function fill(value: StringValue): Style {
	return createStyle({
		property: "fill",
		value: String(value),
		description: "Paints the interior of the given graphical element.",
		syntax: "<paint>",
		browserCompat: ["E15", "FF3", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the opacity of the painting operation used to paint the interior the
 * current object.
 *
 * **Syntax:** `<'opacity'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/fill-opacity
 */
export function fillOpacity(value: StringValue): Style {
	return createStyle({
		property: "fill-opacity",
		value: String(value),
		description: "Specifies the opacity of the painting operation used to paint the interior the current object.",
		syntax: "<'opacity'>",
		browserCompat: ["E15", "FF1", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Indicates the algorithm (or winding rule) which is to be used to determine
 * what parts of the canvas are included inside the shape.
 *
 * **Syntax:** `nonzero | evenodd`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/fill-rule
 */
export function fillRule(value: KeywordValue): Style {
	return createStyle({
		property: "fill-rule",
		value: String(value),
		description:
			"Indicates the algorithm (or winding rule) which is to be used to determine what parts of the canvas are included inside the shape.",
		syntax: "nonzero | evenodd",
		browserCompat: ["E15", "FF3", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Processes an element's rendering before it is displayed in the document, by
 * applying one or more filter effects.
 *
 * **Syntax:** `none | <filter-value-list>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 35 |
 * | FFA | 35 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 * | Chrome | 53 |
 * | CA | 53 |
 * | Opera | 40 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/filter
 */
export function filter(value: StringValue): Style {
	return createStyle({
		property: "filter",
		value: String(value),
		description:
			"Processes an element's rendering before it is displayed in the document, by applying one or more filter effects.",
		syntax: "none | <filter-value-list>",
		browserCompat: ["E12", "FF35", "FFA35", "S9.1", "SM9.3", "C53", "CA53", "O40"],
		baseline: { status: "high", baseline_low_date: "2016-09-07", baseline_high_date: "2019-03-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the components of a flexible length: the flex grow factor and flex
 * shrink factor, and the flex basis.
 *
 * **Syntax:** `none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 22 |
 * | FFA | 22 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 11 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex
 */
export function flex(value: StringValue): Style {
	return createStyle({
		property: "flex",
		value: String(value),
		description:
			"Specifies the components of a flexible length: the flex grow factor and flex shrink factor, and the flex basis.",
		syntax: "none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]",
		browserCompat: ["E12", "FF22", "FFA22", "S9", "SM9", "C29", "CA29", "IE11", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the flex basis.
 *
 * **Syntax:** `content | <'width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 22 |
 * | FFA | 22 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 11 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-basis
 */
export function flexBasis(value: StringValue): Style {
	return createStyle({
		property: "flex-basis",
		value: String(value),
		description: "Sets the flex basis.",
		syntax: "content | <'width'>",
		browserCompat: ["E12", "FF22", "FFA22", "S9", "SM9", "C29", "CA29", "IE11", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how flex items are placed in the flex container, by setting the
 * direction of the flex container's main axis.
 *
 * **Syntax:** `row | row-reverse | column | column-reverse`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 22 |
 * | FFA | 22 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 11 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-direction
 */
export function flexDirection(value: KeywordValue): Style {
	return createStyle({
		property: "flex-direction",
		value: String(value),
		description:
			"Specifies how flex items are placed in the flex container, by setting the direction of the flex container's main axis.",
		syntax: "row | row-reverse | column | column-reverse",
		browserCompat: ["E12", "FF22", "FFA22", "S9", "SM9", "C29", "CA29", "IE11", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how flexbox items are placed in the flexbox.
 *
 * **Syntax:** `<'flex-direction'> || <'flex-wrap'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 28 |
 * | FFA | 28 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 11 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-flow
 */
export function flexFlow(value: StringValue): Style {
	return createStyle({
		property: "flex-flow",
		value: String(value),
		description: "Specifies how flexbox items are placed in the flexbox.",
		syntax: "<'flex-direction'> || <'flex-wrap'>",
		browserCompat: ["E12", "FF28", "FFA28", "S9", "SM9", "C29", "CA29", "IE11", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the flex grow factor. Negative numbers are invalid.
 *
 * **Syntax:** `<number>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 20 |
 * | FFA | 20 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 11 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-grow
 */
export function flexGrow(value: NumberValue): Style {
	return createStyle({
		property: "flex-grow",
		value: String(value),
		description: "Sets the flex grow factor. Negative numbers are invalid.",
		syntax: "<number>",
		browserCompat: ["E12", "FF20", "FFA20", "S9", "SM9", "C29", "CA29", "IE11", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the flex shrink factor. Negative numbers are invalid.
 *
 * **Syntax:** `<number>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 20 |
 * | FFA | 20 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 10 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-shrink
 */
export function flexShrink(value: NumberValue): Style {
	return createStyle({
		property: "flex-shrink",
		value: String(value),
		description: "Sets the flex shrink factor. Negative numbers are invalid.",
		syntax: "<number>",
		browserCompat: ["E12", "FF20", "FFA20", "S9", "SM9", "C29", "CA29", "IE10", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls whether the flex container is single-line or multi-line, and the
 * direction of the cross-axis, which determines the direction new lines are
 * stacked in.
 *
 * **Syntax:** `nowrap | wrap | wrap-reverse`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 28 |
 * | FFA | 28 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 11 |
 * | Opera | 16 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flex-wrap
 */
export function flexWrap(value: KeywordValue): Style {
	return createStyle({
		property: "flex-wrap",
		value: String(value),
		description:
			"Controls whether the flex container is single-line or multi-line, and the direction of the cross-axis, which determines the direction new lines are stacked in.",
		syntax: "nowrap | wrap | wrap-reverse",
		browserCompat: ["E12", "FF28", "FFA28", "S9", "SM9", "C29", "CA29", "IE11", "O16"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how a box should be floated. It may be set for any element, but only
 * applies to elements that generate boxes that are not absolutely positioned.
 *
 * **Syntax:** `left | right | none | inline-start | inline-end`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/float
 */
export function float(value: KeywordValue): Style {
	return createStyle({
		property: "float",
		value: String(value),
		description:
			"Specifies how a box should be floated. It may be set for any element, but only applies to elements that generate boxes that are not absolutely positioned.",
		syntax: "left | right | none | inline-start | inline-end",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property for setting 'font-style', 'font-variant', 'font-weight',
 * 'font-size', 'line-height', and 'font-family', at the same place in the style
 * sheet. The syntax of this property is based on a traditional typographical
 * shorthand notation to set multiple properties related to fonts.
 *
 * **Syntax:** `[ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-family-name>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font
 */
export function font(value: StringValue): Style {
	return createStyle({
		property: "font",
		value: String(value),
		description:
			"Shorthand property for setting 'font-style', 'font-variant', 'font-weight', 'font-size', 'line-height', and 'font-family', at the same place in the style sheet. The syntax of this property is based on a traditional typographical shorthand notation to set multiple properties related to fonts.",
		syntax:
			"[ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-family-name>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies a prioritized list of font family names or generic family names. A
 * user agent iterates through the list of family names until it matches an
 * available font that contains a glyph for the character to be rendered.
 *
 * **Syntax:** `<family-name>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-family
 */
export function fontFamily(value: StringValue): Style {
	return createStyle({
		property: "font-family",
		value: String(value),
		description:
			"Specifies a prioritized list of font family names or generic family names. A user agent iterates through the list of family names until it matches an available font that contains a glyph for the character to be rendered.",
		syntax: "<family-name>#",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Provides low-level control over OpenType font features. It is intended as a
 * way of providing access to font features that are not widely used but are
 * needed for a particular use case.
 *
 * **Syntax:** `normal | <feature-tag-value>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 34 |
 * | FFA | 34 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 * | Chrome | 48 |
 * | CA | 48 |
 * | IE | 10 |
 * | Opera | 35 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-feature-settings
 */
export function fontFeatureSettings(value: StringValue): Style {
	return createStyle({
		property: "font-feature-settings",
		value: String(value),
		description:
			"Provides low-level control over OpenType font features. It is intended as a way of providing access to font features that are not widely used but are needed for a particular use case.",
		syntax: "normal | <feature-tag-value>#",
		browserCompat: ["E15", "FF34", "FFA34", "S9.1", "SM9.3", "C48", "CA48", "IE10", "O35"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Kerning is the contextual adjustment of inter-glyph spacing. This property
 * controls metric kerning, kerning that utilizes adjustment data contained in
 * the font.
 *
 * **Syntax:** `auto | normal | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 32 |
 * | FFA | 32 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 33 |
 * | CA | 33 |
 * | Opera | 20 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-kerning
 */
export function fontKerning(value: KeywordValue): Style {
	return createStyle({
		property: "font-kerning",
		value: String(value),
		description:
			"Kerning is the contextual adjustment of inter-glyph spacing. This property controls metric kerning, kerning that utilizes adjustment data contained in the font.",
		syntax: "auto | normal | none",
		browserCompat: ["E79", "FF32", "FFA32", "S9", "SM9", "C33", "CA33", "O20"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The value of 'normal' implies that when rendering with OpenType fonts the
 * language of the document is used to infer the OpenType language system, used
 * to select language specific features when rendering.
 *
 * **Syntax:** `normal | <string>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 34 |
 * | FFA | 34 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-language-override
 */
export function fontLanguageOverride(value: StringValue): Style {
	return createStyle({
		property: "font-language-override",
		value: String(value),
		description:
			"The value of 'normal' implies that when rendering with OpenType fonts the language of the document is used to infer the OpenType language system, used to select language specific features when rendering.",
		syntax: "normal | <string>",
		browserCompat: ["FF34", "FFA34"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The font-optical-sizing CSS property allows developers to control whether
 * browsers render text with slightly differing visual representations to
 * optimize viewing at different sizes, or not. This only works for fonts that
 * have an optical size variation axis.
 *
 * **Syntax:** `auto | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 17 |
 * | Firefox | 62 |
 * | FFA | 62 |
 * | Safari | 13.1 |
 * | SM | 13.4 |
 * | Chrome | 79 |
 * | CA | 79 |
 * | Opera | 66 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-optical-sizing
 */
export function fontOpticalSizing(value: KeywordValue): Style {
	return createStyle({
		property: "font-optical-sizing",
		value: String(value),
		description:
			"The font-optical-sizing CSS property allows developers to control whether browsers render text with slightly differing visual representations to optimize viewing at different sizes, or not. This only works for fonts that have an optical size variation axis.",
		syntax: "auto | none",
		browserCompat: ["E17", "FF62", "FFA62", "S13.1", "SM13.4", "C79", "CA79", "O66"],
		baseline: { status: "high", baseline_low_date: "2020-03-24", baseline_high_date: "2022-09-24" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The font-palette CSS property allows specifying one of the many palettes
 * contained in a font that a user agent should use for the font. Users can also
 * override the values in a palette or create a new palette by using the
 * @font-palette-values at-rule.
 *
 * **Syntax:** `normal | light | dark | <palette-identifier> | <palette-mix()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 101 |
 * | Firefox | 107 |
 * | FFA | 107 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 101 |
 * | CA | 101 |
 * | Opera | 87 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-palette
 */
export function fontPalette(value: StringValue): Style {
	return createStyle({
		property: "font-palette",
		value: String(value),
		description:
			"The font-palette CSS property allows specifying one of the many palettes contained in a font that a user agent should use for the font. Users can also override the values in a palette or create a new palette by using the @font-palette-values at-rule.",
		syntax: "normal | light | dark | <palette-identifier> | <palette-mix()>",
		browserCompat: ["E101", "FF107", "FFA107", "S15.4", "SM15.4", "C101", "CA101", "O87"],
		baseline: { status: "high", baseline_low_date: "2022-11-15", baseline_high_date: "2025-05-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The font-variation-settings CSS property provides low-level control over
 * OpenType or TrueType font variations, by specifying the four letter axis names
 * of the features you want to vary, along with their variation values.
 *
 * **Syntax:** `normal | [ <string> <number> ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 17 |
 * | Firefox | 62 |
 * | FFA | 62 |
 * | Safari | 11 |
 * | SM | 11 |
 * | Chrome | 62 |
 * | CA | 62 |
 * | Opera | 49 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variation-settings
 */
export function fontVariationSettings(value: NumberValue): Style {
	return createStyle({
		property: "font-variation-settings",
		value: String(value),
		description:
			"The font-variation-settings CSS property provides low-level control over OpenType or TrueType font variations, by specifying the four letter axis names of the features you want to vary, along with their variation values.",
		syntax: "normal | [ <string> <number> ]#",
		browserCompat: ["E17", "FF62", "FFA62", "S11", "SM11", "C62", "CA62", "O49"],
		baseline: { status: "high", baseline_low_date: "2018-09-05", baseline_high_date: "2021-03-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Indicates the desired height of glyphs from the font. For scalable fonts, the
 * font-size is a scale factor applied to the EM unit of the font. (Note that
 * certain glyphs may bleed outside their EM box.) For non-scalable fonts, the
 * font-size is converted into absolute units and matched against the declared
 * font-size of the font, using the same absolute coordinate space for both of
 * the matched values.
 *
 * **Syntax:** `<absolute-size> | <relative-size> | <length-percentage [0,∞]> | math`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-size
 */
export function fontSize(value: StringValue): Style {
	return createStyle({
		property: "font-size",
		value: String(value),
		description:
			"Indicates the desired height of glyphs from the font. For scalable fonts, the font-size is a scale factor applied to the EM unit of the font. (Note that certain glyphs may bleed outside their EM box.) For non-scalable fonts, the font-size is converted into absolute units and matched against the declared font-size of the font, using the same absolute coordinate space for both of the matched values.",
		syntax: "<absolute-size> | <relative-size> | <length-percentage [0,∞]> | math",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE5.5", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Preserves the readability of text when font fallback occurs by adjusting the
 * font-size so that the x-height is the same regardless of the font used.
 *
 * **Syntax:** `none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number> ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 127 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 16.4 |
 * | SM | 16.4 |
 * | Chrome | 127 |
 * | CA | 127 |
 * | Opera | 113 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-size-adjust
 */
export function fontSizeAdjust(value: NumberValue): Style {
	return createStyle({
		property: "font-size-adjust",
		value: String(value),
		description:
			"Preserves the readability of text when font fallback occurs by adjusting the font-size so that the x-height is the same regardless of the font used.",
		syntax: "none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number> ]",
		browserCompat: ["E127", "FF3", "FFA4", "S16.4", "SM16.4", "C127", "CA127", "O113"],
		baseline: { status: "low", baseline_low_date: "2024-07-25" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The font-smooth CSS property controls the application of anti-aliasing when
 * fonts are rendered.
 *
 * **Syntax:** `auto | never | always | <absolute-size> | <length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-smooth
 */
export function fontSmooth(value: LengthValue): Style {
	return createStyle({
		property: "font-smooth",
		value: String(value),
		description: "The font-smooth CSS property controls the application of anti-aliasing when fonts are rendered.",
		syntax: "auto | never | always | <absolute-size> | <length>",
		browserCompat: ["O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Selects a normal, condensed, or expanded face from a font family.
 *
 * **Syntax:** `<font-stretch-absolute>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 9 |
 * | FFA | 9 |
 * | Safari | 11 |
 * | SM | 11 |
 * | Chrome | 60 |
 * | CA | 60 |
 * | IE | 9 |
 * | Opera | 47 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-stretch
 */
export function fontStretch(value: StringValue): Style {
	return createStyle({
		property: "font-stretch",
		value: String(value),
		description: "Selects a normal, condensed, or expanded face from a font family.",
		syntax: "<font-stretch-absolute>{1,2}",
		browserCompat: ["E12", "FF9", "FFA9", "S11", "SM11", "C60", "CA60", "IE9", "O47"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Allows italic or oblique faces to be selected. Italic forms are generally
 * cursive in nature while oblique faces are typically sloped versions of the
 * regular face.
 *
 * **Syntax:** `normal | italic | oblique <angle>{0,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-style
 */
export function fontStyle(value: AngleValue): Style {
	return createStyle({
		property: "font-style",
		value: String(value),
		description:
			"Allows italic or oblique faces to be selected. Italic forms are generally cursive in nature while oblique faces are typically sloped versions of the regular face.",
		syntax: "normal | italic | oblique <angle>{0,2}",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls whether user agents are allowed to synthesize bold or oblique font
 * faces when a font family lacks bold or italic faces.
 *
 * **Syntax:** `none | [ weight || style || small-caps || position]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 97 |
 * | Firefox | 34 |
 * | FFA | 34 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 97 |
 * | CA | 97 |
 * | Opera | 83 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis
 */
export function fontSynthesis(value: StringValue): Style {
	return createStyle({
		property: "font-synthesis",
		value: String(value),
		description:
			"Controls whether user agents are allowed to synthesize bold or oblique font faces when a font family lacks bold or italic faces.",
		syntax: "none | [ weight || style || small-caps || position]",
		browserCompat: ["E97", "FF34", "FFA34", "S9", "SM9", "C97", "CA97", "O83"],
		baseline: { status: "high", baseline_low_date: "2022-01-06", baseline_high_date: "2024-07-06" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The font-synthesis-position CSS property lets you specify whether or not a
 * browser may synthesize the subscript and superscript "position" typefaces when
 * they are missing in a font family, while using font-variant-position to set
 * the positions.
 *
 * **Syntax:** `auto | none`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 118 |
 * | FFA | 118 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-position
 */
export function fontSynthesisPosition(value: KeywordValue): Style {
	return createStyle({
		property: "font-synthesis-position",
		value: String(value),
		description:
			'The font-synthesis-position CSS property lets you specify whether or not a browser may synthesize the subscript and superscript "position" typefaces when they are missing in a font family, while using font-variant-position to set the positions.',
		syntax: "auto | none",
		browserCompat: ["FF118", "FFA118"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The font-synthesis-small-caps CSS property lets you specify whether or not the
 * browser may synthesize small-caps typeface when it is missing in a font
 * family. Small-caps glyphs typically use the form of uppercase letters but are
 * reduced to the size of lowercase letters.
 *
 * **Syntax:** `auto | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 97 |
 * | Firefox | 111 |
 * | FFA | 111 |
 * | Safari | 16.4 |
 * | SM | 16.4 |
 * | Chrome | 97 |
 * | CA | 97 |
 * | Opera | 83 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-small-caps
 */
export function fontSynthesisSmallCaps(value: KeywordValue): Style {
	return createStyle({
		property: "font-synthesis-small-caps",
		value: String(value),
		description:
			"The font-synthesis-small-caps CSS property lets you specify whether or not the browser may synthesize small-caps typeface when it is missing in a font family. Small-caps glyphs typically use the form of uppercase letters but are reduced to the size of lowercase letters.",
		syntax: "auto | none",
		browserCompat: ["E97", "FF111", "FFA111", "S16.4", "SM16.4", "C97", "CA97", "O83"],
		baseline: { status: "high", baseline_low_date: "2023-03-27", baseline_high_date: "2025-09-27" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The font-synthesis-style CSS property lets you specify whether or not the
 * browser may synthesize the oblique typeface when it is missing in a font
 * family.
 *
 * **Syntax:** `auto | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 97 |
 * | Firefox | 111 |
 * | FFA | 111 |
 * | Safari | 16.4 |
 * | SM | 16.4 |
 * | Chrome | 97 |
 * | CA | 97 |
 * | Opera | 83 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-style
 */
export function fontSynthesisStyle(value: KeywordValue): Style {
	return createStyle({
		property: "font-synthesis-style",
		value: String(value),
		description:
			"The font-synthesis-style CSS property lets you specify whether or not the browser may synthesize the oblique typeface when it is missing in a font family.",
		syntax: "auto | none",
		browserCompat: ["E97", "FF111", "FFA111", "S16.4", "SM16.4", "C97", "CA97", "O83"],
		baseline: { status: "high", baseline_low_date: "2023-03-27", baseline_high_date: "2025-09-27" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The font-synthesis-weight CSS property lets you specify whether or not the
 * browser may synthesize the bold typeface when it is missing in a font family.
 *
 * **Syntax:** `auto | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 97 |
 * | Firefox | 111 |
 * | FFA | 111 |
 * | Safari | 16.4 |
 * | SM | 16.4 |
 * | Chrome | 97 |
 * | CA | 97 |
 * | Opera | 83 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-synthesis-weight
 */
export function fontSynthesisWeight(value: KeywordValue): Style {
	return createStyle({
		property: "font-synthesis-weight",
		value: String(value),
		description:
			"The font-synthesis-weight CSS property lets you specify whether or not the browser may synthesize the bold typeface when it is missing in a font family.",
		syntax: "auto | none",
		browserCompat: ["E97", "FF111", "FFA111", "S16.4", "SM16.4", "C97", "CA97", "O83"],
		baseline: { status: "high", baseline_low_date: "2023-03-27", baseline_high_date: "2025-09-27" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies variant representations of the font
 *
 * **Syntax:** `normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant
 */
export function fontVariant(value: StringValue): Style {
	return createStyle({
		property: "font-variant",
		value: String(value),
		description: "Specifies variant representations of the font",
		syntax:
			"normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * For any given character, fonts can provide a variety of alternate glyphs in
 * addition to the default glyph for that character. This property provides
 * control over the selection of these alternate glyphs.
 *
 * **Syntax:** `normal | [ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 111 |
 * | Firefox | 34 |
 * | FFA | 34 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 * | Chrome | 111 |
 * | CA | 111 |
 * | Opera | 97 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-alternates
 */
export function fontVariantAlternates(value: StringValue): Style {
	return createStyle({
		property: "font-variant-alternates",
		value: String(value),
		description:
			"For any given character, fonts can provide a variety of alternate glyphs in addition to the default glyph for that character. This property provides control over the selection of these alternate glyphs.",
		syntax:
			"normal | [ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]",
		browserCompat: ["E111", "FF34", "FFA34", "S9.1", "SM9.3", "C111", "CA111", "O97"],
		baseline: { status: "high", baseline_low_date: "2023-03-13", baseline_high_date: "2025-09-13" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies control over capitalized forms.
 *
 * **Syntax:** `normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 34 |
 * | FFA | 34 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 * | Chrome | 52 |
 * | CA | 52 |
 * | Opera | 39 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-caps
 */
export function fontVariantCaps(value: KeywordValue): Style {
	return createStyle({
		property: "font-variant-caps",
		value: String(value),
		description: "Specifies control over capitalized forms.",
		syntax: "normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps",
		browserCompat: ["E79", "FF34", "FFA34", "S9.1", "SM9.3", "C52", "CA52", "O39"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Allows control of glyph substitute and positioning in East Asian text.
 *
 * **Syntax:** `normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 34 |
 * | FFA | 34 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 * | Chrome | 63 |
 * | CA | 63 |
 * | Opera | 50 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-east-asian
 */
export function fontVariantEastAsian(value: StringValue): Style {
	return createStyle({
		property: "font-variant-east-asian",
		value: String(value),
		description: "Allows control of glyph substitute and positioning in East Asian text.",
		syntax: "normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]",
		browserCompat: ["E79", "FF34", "FFA34", "S9.1", "SM9.3", "C63", "CA63", "O50"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The font-variant-emoji CSS property specifies the default presentation style
 * for displaying emojis.
 *
 * **Syntax:** `normal | text | emoji | unicode`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 131 |
 * | Firefox | 141 |
 * | FFA | 141 |
 * | Chrome | 131 |
 * | CA | 131 |
 * | Opera | 116 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-emoji
 */
export function fontVariantEmoji(value: KeywordValue): Style {
	return createStyle({
		property: "font-variant-emoji",
		value: String(value),
		description: "The font-variant-emoji CSS property specifies the default presentation style for displaying emojis.",
		syntax: "normal | text | emoji | unicode",
		browserCompat: ["E131", "FF141", "FFA141", "C131", "CA131", "O116"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies control over which ligatures are enabled or disabled. A value of
 * 'normal' implies that the defaults set by the font are used.
 *
 * **Syntax:** `normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 34 |
 * | FFA | 34 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 * | Chrome | 34 |
 * | CA | 34 |
 * | Opera | 21 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-ligatures
 */
export function fontVariantLigatures(value: StringValue): Style {
	return createStyle({
		property: "font-variant-ligatures",
		value: String(value),
		description:
			"Specifies control over which ligatures are enabled or disabled. A value of 'normal' implies that the defaults set by the font are used.",
		syntax:
			"normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]",
		browserCompat: ["E79", "FF34", "FFA34", "S9.1", "SM9.3", "C34", "CA34", "O21"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies control over numerical forms.
 *
 * **Syntax:** `normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 34 |
 * | FFA | 34 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 * | Chrome | 52 |
 * | CA | 52 |
 * | Opera | 39 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-numeric
 */
export function fontVariantNumeric(value: StringValue): Style {
	return createStyle({
		property: "font-variant-numeric",
		value: String(value),
		description: "Specifies control over numerical forms.",
		syntax:
			"normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]",
		browserCompat: ["E79", "FF34", "FFA34", "S9.1", "SM9.3", "C52", "CA52", "O39"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the vertical position
 *
 * **Syntax:** `normal | sub | super`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 34 |
 * | FFA | 34 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-variant-position
 */
export function fontVariantPosition(value: KeywordValue): Style {
	return createStyle({
		property: "font-variant-position",
		value: String(value),
		description: "Specifies the vertical position",
		syntax: "normal | sub | super",
		browserCompat: ["FF34", "FFA34", "S9.1", "SM9.3"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies weight of glyphs in the font, their degree of blackness or stroke
 * thickness.
 *
 * **Syntax:** `<font-weight-absolute>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 2 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-weight
 */
export function fontWeight(value: StringValue): Style {
	return createStyle({
		property: "font-weight",
		value: String(value),
		description: "Specifies weight of glyphs in the font, their degree of blackness or stroke thickness.",
		syntax: "<font-weight-absolute>{1,2}",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C2", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Allows authors to opt certain elements out of forced colors mode. This then
 * restores the control of those values to CSS
 *
 * **Syntax:** `auto | none | preserve-parent-color`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 113 |
 * | FFA | 113 |
 * | Chrome | 89 |
 * | CA | 89 |
 * | IE | 10 |
 * | Opera | 75 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/forced-color-adjust
 */
export function forcedColorAdjust(value: KeywordValue): Style {
	return createStyle({
		property: "forced-color-adjust",
		value: String(value),
		description:
			"Allows authors to opt certain elements out of forced colors mode. This then restores the control of those values to CSS",
		syntax: "auto | none | preserve-parent-color",
		browserCompat: ["E79", "FF113", "FFA113", "C89", "CA89", "IE10", "O75"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The gap CSS property is a shorthand property for row-gap and column-gap
 * specifying the gutters between grid rows and columns.
 *
 * **Syntax:** `<'row-gap'> <'column-gap'>?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/gap
 */
export function gap(value: StringValue): Style {
	return createStyle({
		property: "gap",
		value: String(value),
		description:
			"The gap CSS property is a shorthand property for row-gap and column-gap specifying the gutters between grid rows and columns.",
		syntax: "<'row-gap'> <'column-gap'>?",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The grid CSS property is a shorthand property that sets all of the explicit
 * grid properties ('grid-template-rows', 'grid-template-columns', and
 * 'grid-template-areas'), and all the implicit grid properties
 * ('grid-auto-rows', 'grid-auto-columns', and 'grid-auto-flow'), in a single
 * declaration.
 *
 * **Syntax:** `<'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid
 */
export function grid(value: StringValue): Style {
	return createStyle({
		property: "grid",
		value: String(value),
		description:
			"The grid CSS property is a shorthand property that sets all of the explicit grid properties ('grid-template-rows', 'grid-template-columns', and 'grid-template-areas'), and all the implicit grid properties ('grid-auto-rows', 'grid-auto-columns', and 'grid-auto-flow'), in a single declaration.",
		syntax:
			"<'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determine a grid item's size and location within the grid by contributing a
 * line, a span, or nothing (automatic) to its grid placement. Shorthand for
 * 'grid-row-start', 'grid-column-start', 'grid-row-end', and 'grid-column-end'.
 *
 * **Syntax:** `<grid-line> [ / <grid-line> ]{0,3}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-area
 */
export function gridArea(value: StringValue): Style {
	return createStyle({
		property: "grid-area",
		value: String(value),
		description:
			"Determine a grid item's size and location within the grid by contributing a line, a span, or nothing (automatic) to its grid placement. Shorthand for 'grid-row-start', 'grid-column-start', 'grid-row-end', and 'grid-column-end'.",
		syntax: "<grid-line> [ / <grid-line> ]{0,3}",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the size of implicitly created columns.
 *
 * **Syntax:** `<track-size>+`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 70 |
 * | FFA | 79 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | IE | 10 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-auto-columns
 */
export function gridAutoColumns(value: StringValue): Style {
	return createStyle({
		property: "grid-auto-columns",
		value: String(value),
		description: "Specifies the size of implicitly created columns.",
		syntax: "<track-size>+",
		browserCompat: ["E16", "FF70", "FFA79", "S10.1", "SM10.3", "C57", "CA57", "IE10", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-07-28", baseline_high_date: "2023-01-28" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls how the auto-placement algorithm works, specifying exactly how
 * auto-placed items get flowed into the grid.
 *
 * **Syntax:** `[ row | column ] || dense`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-auto-flow
 */
export function gridAutoFlow(value: StringValue): Style {
	return createStyle({
		property: "grid-auto-flow",
		value: String(value),
		description:
			"Controls how the auto-placement algorithm works, specifying exactly how auto-placed items get flowed into the grid.",
		syntax: "[ row | column ] || dense",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the size of implicitly created rows.
 *
 * **Syntax:** `<track-size>+`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 70 |
 * | FFA | 79 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | IE | 10 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-auto-rows
 */
export function gridAutoRows(value: StringValue): Style {
	return createStyle({
		property: "grid-auto-rows",
		value: String(value),
		description: "Specifies the size of implicitly created rows.",
		syntax: "<track-size>+",
		browserCompat: ["E16", "FF70", "FFA79", "S10.1", "SM10.3", "C57", "CA57", "IE10", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-07-28", baseline_high_date: "2023-01-28" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand for 'grid-column-start' and 'grid-column-end'.
 *
 * **Syntax:** `<grid-line> [ / <grid-line> ]?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-column
 */
export function gridColumn(value: StringValue): Style {
	return createStyle({
		property: "grid-column",
		value: String(value),
		description: "Shorthand for 'grid-column-start' and 'grid-column-end'.",
		syntax: "<grid-line> [ / <grid-line> ]?",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determine a grid item's size and location within the grid by contributing a
 * line, a span, or nothing (automatic) to its grid placement.
 *
 * **Syntax:** `<grid-line>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-column-end
 */
export function gridColumnEnd(value: StringValue): Style {
	return createStyle({
		property: "grid-column-end",
		value: String(value),
		description:
			"Determine a grid item's size and location within the grid by contributing a line, a span, or nothing (automatic) to its grid placement.",
		syntax: "<grid-line>",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the gutters between grid columns. Replaced by 'column-gap' property.
 *
 * **Syntax:** `<length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 52 |
 * | Chrome | 57 |
 * | Safari | 10.1 |
 * | Opera | 44 |
 */
export function gridColumnGap(value: LengthPercentageValue): Style {
	return createStyle({
		property: "grid-column-gap",
		value: String(value),
		description: "Specifies the gutters between grid columns. Replaced by 'column-gap' property.",
		syntax: "<length-percentage>",
		browserCompat: ["FF52", "C57", "S10.1", "O44"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determine a grid item's size and location within the grid by contributing a
 * line, a span, or nothing (automatic) to its grid placement.
 *
 * **Syntax:** `<grid-line>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-column-start
 */
export function gridColumnStart(value: StringValue): Style {
	return createStyle({
		property: "grid-column-start",
		value: String(value),
		description:
			"Determine a grid item's size and location within the grid by contributing a line, a span, or nothing (automatic) to its grid placement.",
		syntax: "<grid-line>",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand that specifies the gutters between grid columns and grid rows in one
 * declaration. Replaced by 'gap' property.
 *
 * **Syntax:** `<'grid-row-gap'> <'grid-column-gap'>?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 52 |
 * | Chrome | 57 |
 * | Safari | 10.1 |
 * | Opera | 44 |
 */
export function gridGap(value: StringValue): Style {
	return createStyle({
		property: "grid-gap",
		value: String(value),
		description:
			"Shorthand that specifies the gutters between grid columns and grid rows in one declaration. Replaced by 'gap' property.",
		syntax: "<'grid-row-gap'> <'grid-column-gap'>?",
		browserCompat: ["FF52", "C57", "S10.1", "O44"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand for 'grid-row-start' and 'grid-row-end'.
 *
 * **Syntax:** `<grid-line> [ / <grid-line> ]?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-row
 */
export function gridRow(value: StringValue): Style {
	return createStyle({
		property: "grid-row",
		value: String(value),
		description: "Shorthand for 'grid-row-start' and 'grid-row-end'.",
		syntax: "<grid-line> [ / <grid-line> ]?",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determine a grid item's size and location within the grid by contributing a
 * line, a span, or nothing (automatic) to its grid placement.
 *
 * **Syntax:** `<grid-line>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-row-end
 */
export function gridRowEnd(value: StringValue): Style {
	return createStyle({
		property: "grid-row-end",
		value: String(value),
		description:
			"Determine a grid item's size and location within the grid by contributing a line, a span, or nothing (automatic) to its grid placement.",
		syntax: "<grid-line>",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the gutters between grid rows. Replaced by 'row-gap' property.
 *
 * **Syntax:** `<length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 52 |
 * | Chrome | 57 |
 * | Safari | 10.1 |
 * | Opera | 44 |
 */
export function gridRowGap(value: LengthPercentageValue): Style {
	return createStyle({
		property: "grid-row-gap",
		value: String(value),
		description: "Specifies the gutters between grid rows. Replaced by 'row-gap' property.",
		syntax: "<length-percentage>",
		browserCompat: ["FF52", "C57", "S10.1", "O44"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determine a grid item's size and location within the grid by contributing a
 * line, a span, or nothing (automatic) to its grid placement.
 *
 * **Syntax:** `<grid-line>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-row-start
 */
export function gridRowStart(value: StringValue): Style {
	return createStyle({
		property: "grid-row-start",
		value: String(value),
		description:
			"Determine a grid item's size and location within the grid by contributing a line, a span, or nothing (automatic) to its grid placement.",
		syntax: "<grid-line>",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand for setting grid-template-columns, grid-template-rows, and
 * grid-template-areas in a single declaration.
 *
 * **Syntax:** `none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template
 */
export function gridTemplate(value: StringValue): Style {
	return createStyle({
		property: "grid-template",
		value: String(value),
		description:
			"Shorthand for setting grid-template-columns, grid-template-rows, and grid-template-areas in a single declaration.",
		syntax:
			"none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies named grid areas, which are not associated with any particular grid
 * item, but can be referenced from the grid-placement properties.
 *
 * **Syntax:** `none | <string>+`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-areas
 */
export function gridTemplateAreas(value: StringValue): Style {
	return createStyle({
		property: "grid-template-areas",
		value: String(value),
		description:
			"Specifies named grid areas, which are not associated with any particular grid item, but can be referenced from the grid-placement properties.",
		syntax: "none | <string>+",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * specifies, as a space-separated track list, the line names and track sizing
 * functions of the grid.
 *
 * **Syntax:** `none | <track-list> | <auto-track-list> | subgrid <line-name-list>?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | IE | 10 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-columns
 */
export function gridTemplateColumns(value: StringValue): Style {
	return createStyle({
		property: "grid-template-columns",
		value: String(value),
		description: "specifies, as a space-separated track list, the line names and track sizing functions of the grid.",
		syntax: "none | <track-list> | <auto-track-list> | subgrid <line-name-list>?",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "IE10", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * specifies, as a space-separated track list, the line names and track sizing
 * functions of the grid.
 *
 * **Syntax:** `none | <track-list> | <auto-track-list> | subgrid <line-name-list>?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | IE | 10 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/grid-template-rows
 */
export function gridTemplateRows(value: StringValue): Style {
	return createStyle({
		property: "grid-template-rows",
		value: String(value),
		description: "specifies, as a space-separated track list, the line names and track sizing functions of the grid.",
		syntax: "none | <track-list> | <auto-track-list> | subgrid <line-name-list>?",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C57", "CA57", "IE10", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The hanging-punctuation CSS property specifies whether a punctuation mark
 * should hang at the start or end of a line of text. Hanging punctuation may be
 * placed outside the line box.
 *
 * **Syntax:** `none | [ first || [ force-end | allow-end ] || last ]`
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hanging-punctuation
 */
export function hangingPunctuation(value: StringValue): Style {
	return createStyle({
		property: "hanging-punctuation",
		value: String(value),
		description:
			"The hanging-punctuation CSS property specifies whether a punctuation mark should hang at the start or end of a line of text. Hanging punctuation may be placed outside the line box.",
		syntax: "none | [ first || [ force-end | allow-end ] || last ]",
		browserCompat: undefined,
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the height of the content area, padding area or border area
 * (depending on 'box-sizing') of certain boxes.
 *
 * **Syntax:** `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/height
 */
export function height(value: StringValue): Style {
	return createStyle({
		property: "height",
		value: String(value),
		description:
			"Specifies the height of the content area, padding area or border area (depending on 'box-sizing') of certain boxes.",
		syntax:
			"auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * A hyphenate character used at the end of a line.
 *
 * **Syntax:** `auto | <string>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 106 |
 * | Firefox | 98 |
 * | FFA | 98 |
 * | Safari | 17 |
 * | SM | 17 |
 * | Chrome | 106 |
 * | CA | 106 |
 * | Opera | 92 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hyphenate-character
 */
export function hyphenateCharacter(value: StringValue): Style {
	return createStyle({
		property: "hyphenate-character",
		value: String(value),
		description: "A hyphenate character used at the end of a line.",
		syntax: "auto | <string>",
		browserCompat: ["E106", "FF98", "FFA98", "S17", "SM17", "C106", "CA106", "O92"],
		baseline: { status: "low", baseline_low_date: "2023-09-18" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The hyphenate-limit-chars CSS property specifies the minimum word length to
 * allow hyphenation of words as well as the minimum number of characters before
 * and after the hyphen.
 *
 * **Syntax:** `[ auto | <integer> ]{1,3}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 109 |
 * | Firefox | 137 |
 * | FFA | 137 |
 * | Chrome | 109 |
 * | CA | 109 |
 * | Opera | 95 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hyphenate-limit-chars
 */
export function hyphenateLimitChars(value: IntegerValue): Style {
	return createStyle({
		property: "hyphenate-limit-chars",
		value: String(value),
		description:
			"The hyphenate-limit-chars CSS property specifies the minimum word length to allow hyphenation of words as well as the minimum number of characters before and after the hyphen.",
		syntax: "[ auto | <integer> ]{1,3}",
		browserCompat: ["E109", "FF137", "FFA137", "C109", "CA109", "O95"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls whether hyphenation is allowed to create more break opportunities
 * within a line of text.
 *
 * **Syntax:** `none | manual | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 43 |
 * | FFA | 43 |
 * | Safari | 17 |
 * | SM | 17 |
 * | Chrome | 55 |
 * | CA | 55 |
 * | IE | 10 |
 * | Opera | 42 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/hyphens
 */
export function hyphens(value: KeywordValue): Style {
	return createStyle({
		property: "hyphens",
		value: String(value),
		description: "Controls whether hyphenation is allowed to create more break opportunities within a line of text.",
		syntax: "none | manual | auto",
		browserCompat: ["E79", "FF43", "FFA43", "S17", "SM17", "C55", "CA55", "IE10", "O42"],
		baseline: { status: "low", baseline_low_date: "2023-09-18" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies an orthogonal rotation to be applied to an image before it is laid
 * out.
 *
 * **Syntax:** `from-image | <angle> | [ <angle>? flip ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 81 |
 * | Firefox | 26 |
 * | FFA | 26 |
 * | Safari | 13.1 |
 * | SM | 13.4 |
 * | Chrome | 81 |
 * | CA | 81 |
 * | Opera | 67 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/image-orientation
 */
export function imageOrientation(value: AngleValue): Style {
	return createStyle({
		property: "image-orientation",
		value: String(value),
		description: "Specifies an orthogonal rotation to be applied to an image before it is laid out.",
		syntax: "from-image | <angle> | [ <angle>? flip ]",
		browserCompat: ["E81", "FF26", "FFA26", "S13.1", "SM13.4", "C81", "CA81", "O67"],
		baseline: { status: "high", baseline_low_date: "2020-04-13", baseline_high_date: "2022-10-13" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Provides a hint to the user-agent about what aspects of an image are most
 * important to preserve when the image is scaled, to aid the user-agent in the
 * choice of an appropriate scaling algorithm.
 *
 * **Syntax:** `auto | crisp-edges | pixelated | smooth`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 3.6 |
 * | FFA | 4 |
 * | Safari | 6 |
 * | SM | 6 |
 * | Chrome | 13 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/image-rendering
 */
export function imageRendering(value: KeywordValue): Style {
	return createStyle({
		property: "image-rendering",
		value: String(value),
		description:
			"Provides a hint to the user-agent about what aspects of an image are most important to preserve when the image is scaled, to aid the user-agent in the choice of an appropriate scaling algorithm.",
		syntax: "auto | crisp-edges | pixelated | smooth",
		browserCompat: ["E79", "FF3.6", "FFA4", "S6", "SM6", "C13", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The image-resolution property specifies the intrinsic resolution of all raster
 * images used in or on the element. It affects both content images (e.g.
 * replaced elements and generated content) and decorative images (such as
 * background-image). The intrinsic resolution of an image is used to determine
 * the image’s intrinsic dimensions.
 *
 * **Syntax:** `[ from-image || <resolution> ] && snap?`
 */
export function imageResolution(value: ResolutionValue): Style {
	return createStyle({
		property: "image-resolution",
		value: String(value),
		description:
			"The image-resolution property specifies the intrinsic resolution of all raster images used in or on the element. It affects both content images (e.g. replaced elements and generated content) and decorative images (such as background-image). The intrinsic resolution of an image is used to determine the image’s intrinsic dimensions.",
		syntax: "[ from-image || <resolution> ] && snap?",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls the state of the input method editor for text fields.
 *
 * **Syntax:** `auto | normal | active | inactive | disabled`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 3 |
 * | FFA | 4 |
 * | IE | 5 |
 *
 * **Baseline:** ❌ Limited support
 */
export function imeMode(value: KeywordValue): Style {
	return createStyle({
		property: "ime-mode",
		value: String(value),
		description: "Controls the state of the input method editor for text fields.",
		syntax: "auto | normal | active | inactive | disabled",
		browserCompat: ["FF3", "FFA4", "IE5"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The initial-letter CSS property specifies styling for dropped, raised, and
 * sunken initial letters.
 *
 * **Syntax:** `normal | [ <number> <integer>? ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 110 |
 * | Chrome | 110 |
 * | CA | 110 |
 * | Opera | 96 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/initial-letter
 */
export function initialLetter(value: NumberValue): Style {
	return createStyle({
		property: "initial-letter",
		value: String(value),
		description: "The initial-letter CSS property specifies styling for dropped, raised, and sunken initial letters.",
		syntax: "normal | [ <number> <integer>? ]",
		browserCompat: ["E110", "C110", "CA110", "O96"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The initial-letter-align CSS property specifies the alignment of initial
 * letters within a paragraph.
 *
 * **Syntax:** `[ auto | alphabetic | hanging | ideographic ]`
 */
export function initialLetterAlign(value: StringValue): Style {
	return createStyle({
		property: "initial-letter-align",
		value: String(value),
		description: "The initial-letter-align CSS property specifies the alignment of initial letters within a paragraph.",
		syntax: "[ auto | alphabetic | hanging | ideographic ]",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Size of an element in the direction specified by 'writing-mode'.
 *
 * **Syntax:** `<'width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inline-size
 */
export function inlineSize(value: StringValue): Style {
	return createStyle({
		property: "inline-size",
		value: String(value),
		description: "Size of an element in the direction specified by 'writing-mode'.",
		syntax: "<'width'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `auto|none`
 */
export function inputSecurity(value: KeywordValue): Style {
	return createStyle({
		property: "input-security",
		value: String(value),
		description: undefined,
		syntax: "auto|none",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The inset CSS property defines the logical block and inline start and end
 * offsets of an element, which map to physical offsets depending on the
 * element's writing mode, directionality, and text orientation. It corresponds
 * to the top and bottom, or right and left properties depending on the values
 * defined for writing-mode, direction, and text-orientation.
 *
 * **Syntax:** `<'top'>{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset
 */
export function inset(value: StringValue): Style {
	return createStyle({
		property: "inset",
		value: String(value),
		description:
			"The inset CSS property defines the logical block and inline start and end offsets of an element, which map to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the top and bottom, or right and left properties depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'top'>{1,4}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The inset-block CSS property defines the logical block start and end offsets
 * of an element, which maps to physical offsets depending on the element's
 * writing mode, directionality, and text orientation. It corresponds to the top
 * and bottom, or right and left properties depending on the values defined for
 * writing-mode, direction, and text-orientation.
 *
 * **Syntax:** `<'top'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 63 |
 * | FFA | 63 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-block
 */
export function insetBlock(value: StringValue): Style {
	return createStyle({
		property: "inset-block",
		value: String(value),
		description:
			"The inset-block CSS property defines the logical block start and end offsets of an element, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the top and bottom, or right and left properties depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'top'>{1,2}",
		browserCompat: ["E87", "FF63", "FFA63", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The inset-block-end CSS property defines the logical block end offset of an
 * element, which maps to a physical offset depending on the element's writing
 * mode, directionality, and text orientation. It corresponds to the top, right,
 * bottom, or left property depending on the values defined for writing-mode,
 * direction, and text-orientation.
 *
 * **Syntax:** `<'top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 63 |
 * | FFA | 63 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-block-end
 */
export function insetBlockEnd(value: StringValue): Style {
	return createStyle({
		property: "inset-block-end",
		value: String(value),
		description:
			"The inset-block-end CSS property defines the logical block end offset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the top, right, bottom, or left property depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'top'>",
		browserCompat: ["E87", "FF63", "FFA63", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The inset-block-start CSS property defines the logical block start offset of
 * an element, which maps to a physical offset depending on the element's writing
 * mode, directionality, and text orientation. It corresponds to the top, right,
 * bottom, or left property depending on the values defined for writing-mode,
 * direction, and text-orientation.
 *
 * **Syntax:** `<'top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 63 |
 * | FFA | 63 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-block-start
 */
export function insetBlockStart(value: StringValue): Style {
	return createStyle({
		property: "inset-block-start",
		value: String(value),
		description:
			"The inset-block-start CSS property defines the logical block start offset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the top, right, bottom, or left property depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'top'>",
		browserCompat: ["E87", "FF63", "FFA63", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The inset-inline CSS property defines the logical block start and end offsets
 * of an element, which maps to physical offsets depending on the element's
 * writing mode, directionality, and text orientation. It corresponds to the top
 * and bottom, or right and left properties depending on the values defined for
 * writing-mode, direction, and text-orientation.
 *
 * **Syntax:** `<'top'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 63 |
 * | FFA | 63 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-inline
 */
export function insetInline(value: StringValue): Style {
	return createStyle({
		property: "inset-inline",
		value: String(value),
		description:
			"The inset-inline CSS property defines the logical block start and end offsets of an element, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the top and bottom, or right and left properties depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'top'>{1,2}",
		browserCompat: ["E87", "FF63", "FFA63", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The inset-inline-end CSS property defines the logical inline end inset of an
 * element, which maps to a physical inset depending on the element's writing
 * mode, directionality, and text orientation. It corresponds to the top, right,
 * bottom, or left property depending on the values defined for writing-mode,
 * direction, and text-orientation.
 *
 * **Syntax:** `<'top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 63 |
 * | FFA | 63 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-inline-end
 */
export function insetInlineEnd(value: StringValue): Style {
	return createStyle({
		property: "inset-inline-end",
		value: String(value),
		description:
			"The inset-inline-end CSS property defines the logical inline end inset of an element, which maps to a physical inset depending on the element's writing mode, directionality, and text orientation. It corresponds to the top, right, bottom, or left property depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'top'>",
		browserCompat: ["E87", "FF63", "FFA63", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The inset-inline-start CSS property defines the logical inline start inset of
 * an element, which maps to a physical offset depending on the element's writing
 * mode, directionality, and text orientation. It corresponds to the top, right,
 * bottom, or left property depending on the values defined for writing-mode,
 * direction, and text-orientation.
 *
 * **Syntax:** `<'top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 63 |
 * | FFA | 63 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/inset-inline-start
 */
export function insetInlineStart(value: StringValue): Style {
	return createStyle({
		property: "inset-inline-start",
		value: String(value),
		description:
			"The inset-inline-start CSS property defines the logical inline start inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the top, right, bottom, or left property depending on the values defined for writing-mode, direction, and text-orientation.",
		syntax: "<'top'>",
		browserCompat: ["E87", "FF63", "FFA63", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The interpolate-size CSS property allows you to enable animations and
 * transitions between a <length-percentage> value and an intrinsic size value
 * such as auto, fit-content, or max-content.
 *
 * **Syntax:** `numeric-only | allow-keywords`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 129 |
 * | Chrome | 129 |
 * | CA | 129 |
 * | Opera | 115 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/interpolate-size
 */
export function interpolateSize(value: KeywordValue): Style {
	return createStyle({
		property: "interpolate-size",
		value: String(value),
		description:
			"The interpolate-size CSS property allows you to enable animations and transitions between a <length-percentage> value and an intrinsic size value such as auto, fit-content, or max-content.",
		syntax: "numeric-only | allow-keywords",
		browserCompat: ["E129", "C129", "CA129", "O115"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * In CSS setting to 'isolate' will turn the element into a stacking context. In
 * SVG, it defines whether an element is isolated or not.
 *
 * **Syntax:** `auto | isolate`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 36 |
 * | FFA | 36 |
 * | Safari | 8 |
 * | SM | 8 |
 * | Chrome | 41 |
 * | CA | 41 |
 * | Opera | 28 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/isolation
 */
export function isolation(value: KeywordValue): Style {
	return createStyle({
		property: "isolation",
		value: String(value),
		description:
			"In CSS setting to 'isolate' will turn the element into a stacking context. In SVG, it defines whether an element is isolated or not.",
		syntax: "auto | isolate",
		browserCompat: ["E79", "FF36", "FFA36", "S8", "SM8", "C41", "CA41", "O28"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Aligns flex items along the main axis of the current line of the flex
 * container.
 *
 * **Syntax:** `normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 20 |
 * | FFA | 20 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 11 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/justify-content
 */
export function justifyContent(value: StringValue): Style {
	return createStyle({
		property: "justify-content",
		value: String(value),
		description: "Aligns flex items along the main axis of the current line of the flex container.",
		syntax: "normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]",
		browserCompat: ["E12", "FF20", "FFA20", "S9", "SM9", "C29", "CA29", "IE11", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the default justify-self for all items of the box, giving them the
 * default way of justifying each box along the appropriate axis
 *
 * **Syntax:** `normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ] | anchor-center`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 20 |
 * | FFA | 20 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 52 |
 * | CA | 52 |
 * | IE | 11 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/justify-items
 */
export function justifyItems(value: StringValue): Style {
	return createStyle({
		property: "justify-items",
		value: String(value),
		description:
			"Defines the default justify-self for all items of the box, giving them the default way of justifying each box along the appropriate axis",
		syntax:
			"normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ] | anchor-center",
		browserCompat: ["E12", "FF20", "FFA20", "S9", "SM9", "C52", "CA52", "IE11", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2016-07-27", baseline_high_date: "2019-01-27" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the way of justifying a box inside its container along the appropriate
 * axis.
 *
 * **Syntax:** `auto | normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | anchor-center`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 45 |
 * | FFA | 45 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | IE | 10 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/justify-self
 */
export function justifySelf(value: StringValue): Style {
	return createStyle({
		property: "justify-self",
		value: String(value),
		description: "Defines the way of justifying a box inside its container along the appropriate axis.",
		syntax:
			"auto | normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | anchor-center",
		browserCompat: ["E16", "FF45", "FFA45", "S10.1", "SM10.3", "C57", "CA57", "IE10", "O44"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The justify-tracks CSS property sets the alignment in the masonry axis for
 * grid containers that have masonry in their inline axis
 *
 * **Syntax:** `[ normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ] ]#`
 */
export function justifyTracks(value: StringValue): Style {
	return createStyle({
		property: "justify-tracks",
		value: String(value),
		description:
			"The justify-tracks CSS property sets the alignment in the masonry axis for grid containers that have masonry in their inline axis",
		syntax: "[ normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ] ]#",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how far an absolutely positioned box's left margin edge is offset to
 * the right of the left edge of the box's 'containing block'.
 *
 * **Syntax:** `auto | <length-percentage> | <anchor()> | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/left
 */
export function left(value: LengthPercentageValue): Style {
	return createStyle({
		property: "left",
		value: String(value),
		description:
			"Specifies how far an absolutely positioned box's left margin edge is offset to the right of the left edge of the box's 'containing block'.",
		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE5.5", "O5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the minimum, maximum, and optimal spacing between grapheme clusters.
 *
 * **Syntax:** `normal | <length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/letter-spacing
 */
export function letterSpacing(value: LengthValue): Style {
	return createStyle({
		property: "letter-spacing",
		value: String(value),
		description: "Specifies the minimum, maximum, and optimal spacing between grapheme clusters.",
		syntax: "normal | <length>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies what set of line breaking restrictions are in effect within the
 * element.
 *
 * **Syntax:** `auto | loose | normal | strict | anywhere`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 14 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 11 |
 * | SM | 11 |
 * | Chrome | 58 |
 * | CA | 58 |
 * | IE | 5.5 |
 * | Opera | 45 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/line-break
 */
export function lineBreak(value: KeywordValue): Style {
	return createStyle({
		property: "line-break",
		value: String(value),
		description: "Specifies what set of line breaking restrictions are in effect within the element.",
		syntax: "auto | loose | normal | strict | anywhere",
		browserCompat: ["E14", "FF69", "FFA79", "S11", "SM11", "C58", "CA58", "IE5.5", "O45"],
		baseline: { status: "high", baseline_low_date: "2020-07-28", baseline_high_date: "2023-01-28" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The line-clamp property allows limiting the contents of a block container to
 * the specified number of lines; remaining content is fragmented away and
 * neither rendered nor measured. Optionally, it also allows inserting content
 * into the last line box to indicate the continuity of truncated/interrupted
 * content.
 *
 * **Syntax:** `none | <integer>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/line-clamp
 */
export function lineClamp(value: IntegerValue): Style {
	return createStyle({
		property: "line-clamp",
		value: String(value),
		description:
			"The line-clamp property allows limiting the contents of a block container to the specified number of lines; remaining content is fragmented away and neither rendered nor measured. Optionally, it also allows inserting content into the last line box to indicate the continuity of truncated/interrupted content.",
		syntax: "none | <integer>",
		browserCompat: ["O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the block-progression dimension of the text content area of an
 * inline box.
 *
 * **Syntax:** `normal | <number> | <length> | <percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/line-height
 */
export function lineHeight(value: LengthValue): Style {
	return createStyle({
		property: "line-height",
		value: String(value),
		description: "Determines the block-progression dimension of the text content area of an inline box.",
		syntax: "normal | <number> | <length> | <percentage>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The line-height-step CSS property defines the step units for line box heights.
 * When the step unit is positive, line box heights are rounded up to the closest
 * multiple of the unit. Negative values are invalid.
 *
 * **Syntax:** `<length>`
 */
export function lineHeightStep(value: LengthValue): Style {
	return createStyle({
		property: "line-height-step",
		value: String(value),
		description:
			"The line-height-step CSS property defines the step units for line box heights. When the step unit is positive, line box heights are rounded up to the closest multiple of the unit. Negative values are invalid.",
		syntax: "<length>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand for setting 'list-style-type', 'list-style-position' and
 * 'list-style-image'
 *
 * **Syntax:** `<'list-style-type'> || <'list-style-position'> || <'list-style-image'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style
 */
export function listStyle(value: StringValue): Style {
	return createStyle({
		property: "list-style",
		value: String(value),
		description: "Shorthand for setting 'list-style-type', 'list-style-position' and 'list-style-image'",
		syntax: "<'list-style-type'> || <'list-style-position'> || <'list-style-image'>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the image that will be used as the list item marker. When the image is
 * available, it will replace the marker set with the 'list-style-type' marker.
 *
 * **Syntax:** `<image> | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style-image
 */
export function listStyleImage(value: ImageValue): Style {
	return createStyle({
		property: "list-style-image",
		value: String(value),
		description:
			"Sets the image that will be used as the list item marker. When the image is available, it will replace the marker set with the 'list-style-type' marker.",
		syntax: "<image> | none",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the position of the '::marker' pseudo-element's box in the list
 * item.
 *
 * **Syntax:** `inside | outside`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style-position
 */
export function listStylePosition(value: KeywordValue): Style {
	return createStyle({
		property: "list-style-position",
		value: String(value),
		description: "Specifies the position of the '::marker' pseudo-element's box in the list item.",
		syntax: "inside | outside",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Used to construct the default contents of a list item's marker
 *
 * **Syntax:** `<counter-style> | <string> | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/list-style-type
 */
export function listStyleType(value: StringValue): Style {
	return createStyle({
		property: "list-style-type",
		value: String(value),
		description: "Used to construct the default contents of a list item's marker",
		syntax: "<counter-style> | <string> | none",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property to set values for the thickness of the margin area. If left
 * is omitted, it is the same as right. If bottom is omitted it is the same as
 * top, if right is omitted it is the same as top. Negative values for margin
 * properties are allowed, but there may be implementation-specific limits.
 *
 * **Syntax:** `<'margin-top'>{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin
 */
export function margin(value: StringValue): Style {
	return createStyle({
		property: "margin",
		value: String(value),
		description:
			"Shorthand property to set values for the thickness of the margin area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. Negative values for margin properties are allowed, but there may be implementation-specific limits.",
		syntax: "<'margin-top'>{1,4}",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The margin-block CSS property defines the logical block start and end margins
 * of an element, which maps to physical margins depending on the element's
 * writing mode, directionality, and text orientation.
 *
 * **Syntax:** `<'margin-top'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-block
 */
export function marginBlock(value: StringValue): Style {
	return createStyle({
		property: "margin-block",
		value: String(value),
		description:
			"The margin-block CSS property defines the logical block start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.",
		syntax: "<'margin-top'>{1,2}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'margin-bottom'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'margin-top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-block-end
 */
export function marginBlockEnd(value: StringValue): Style {
	return createStyle({
		property: "margin-block-end",
		value: String(value),
		description:
			"Logical 'margin-bottom'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'margin-top'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'margin-top'. Mapping depends on the parent element's 'writing-mode',
 * 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'margin-top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-block-start
 */
export function marginBlockStart(value: StringValue): Style {
	return createStyle({
		property: "margin-block-start",
		value: String(value),
		description:
			"Logical 'margin-top'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'margin-top'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property to set values for the thickness of the margin area. If left
 * is omitted, it is the same as right. If bottom is omitted it is the same as
 * top, if right is omitted it is the same as top. Negative values for margin
 * properties are allowed, but there may be implementation-specific limits..
 *
 * **Syntax:** `<length-percentage> | auto | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-bottom
 */
export function marginBottom(value: LengthPercentageValue): Style {
	return createStyle({
		property: "margin-bottom",
		value: String(value),
		description:
			"Shorthand property to set values for the thickness of the margin area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. Negative values for margin properties are allowed, but there may be implementation-specific limits..",
		syntax: "<length-percentage> | auto | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The margin-inline CSS property defines the logical inline start and end
 * margins of an element, which maps to physical margins depending on the
 * element's writing mode, directionality, and text orientation.
 *
 * **Syntax:** `<'margin-top'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-inline
 */
export function marginInline(value: StringValue): Style {
	return createStyle({
		property: "margin-inline",
		value: String(value),
		description:
			"The margin-inline CSS property defines the logical inline start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.",
		syntax: "<'margin-top'>{1,2}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'margin-right'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'margin-top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-inline-end
 */
export function marginInlineEnd(value: StringValue): Style {
	return createStyle({
		property: "margin-inline-end",
		value: String(value),
		description:
			"Logical 'margin-right'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'margin-top'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'margin-left'. Mapping depends on the parent element's 'writing-mode',
 * 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'margin-top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-inline-start
 */
export function marginInlineStart(value: StringValue): Style {
	return createStyle({
		property: "margin-inline-start",
		value: String(value),
		description:
			"Logical 'margin-left'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'margin-top'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property to set values for the thickness of the margin area. If left
 * is omitted, it is the same as right. If bottom is omitted it is the same as
 * top, if right is omitted it is the same as top. Negative values for margin
 * properties are allowed, but there may be implementation-specific limits..
 *
 * **Syntax:** `<length-percentage> | auto | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-left
 */
export function marginLeft(value: LengthPercentageValue): Style {
	return createStyle({
		property: "margin-left",
		value: String(value),
		description:
			"Shorthand property to set values for the thickness of the margin area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. Negative values for margin properties are allowed, but there may be implementation-specific limits..",
		syntax: "<length-percentage> | auto | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property to set values for the thickness of the margin area. If left
 * is omitted, it is the same as right. If bottom is omitted it is the same as
 * top, if right is omitted it is the same as top. Negative values for margin
 * properties are allowed, but there may be implementation-specific limits..
 *
 * **Syntax:** `<length-percentage> | auto | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-right
 */
export function marginRight(value: LengthPercentageValue): Style {
	return createStyle({
		property: "margin-right",
		value: String(value),
		description:
			"Shorthand property to set values for the thickness of the margin area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. Negative values for margin properties are allowed, but there may be implementation-specific limits..",
		syntax: "<length-percentage> | auto | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property to set values for the thickness of the margin area. If left
 * is omitted, it is the same as right. If bottom is omitted it is the same as
 * top, if right is omitted it is the same as top. Negative values for margin
 * properties are allowed, but there may be implementation-specific limits..
 *
 * **Syntax:** `<length-percentage> | auto | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-top
 */
export function marginTop(value: LengthPercentageValue): Style {
	return createStyle({
		property: "margin-top",
		value: String(value),
		description:
			"Shorthand property to set values for the thickness of the margin area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. Negative values for margin properties are allowed, but there may be implementation-specific limits..",
		syntax: "<length-percentage> | auto | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The margin-trim property allows the container to trim the margins of its
 * children where they adjoin the container’s edges.
 *
 * **Syntax:** `none | in-flow | all`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 16.4 |
 * | SM | 16.4 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/margin-trim
 */
export function marginTrim(value: KeywordValue): Style {
	return createStyle({
		property: "margin-trim",
		value: String(value),
		description:
			"The margin-trim property allows the container to trim the margins of its children where they adjoin the container’s edges.",
		syntax: "none | in-flow | all",
		browserCompat: ["S16.4", "SM16.4"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the marker symbol that shall be used for all points on the sets the
 * value for all vertices on the given 'path' element or basic shape.
 *
 * **Syntax:** `none | <url>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker
 */
export function marker(value: UrlValue): Style {
	return createStyle({
		property: "marker",
		value: String(value),
		description:
			"Specifies the marker symbol that shall be used for all points on the sets the value for all vertices on the given 'path' element or basic shape.",
		syntax: "none | <url>",
		browserCompat: ["E15", "FF3", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the marker that will be drawn at the last vertices of the given
 * markable element.
 *
 * **Syntax:** `none | <url>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker-end
 */
export function markerEnd(value: UrlValue): Style {
	return createStyle({
		property: "marker-end",
		value: String(value),
		description: "Specifies the marker that will be drawn at the last vertices of the given markable element.",
		syntax: "none | <url>",
		browserCompat: ["E15", "FF3", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the marker that will be drawn at all vertices except the first and
 * last.
 *
 * **Syntax:** `none | <url>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker-mid
 */
export function markerMid(value: UrlValue): Style {
	return createStyle({
		property: "marker-mid",
		value: String(value),
		description: "Specifies the marker that will be drawn at all vertices except the first and last.",
		syntax: "none | <url>",
		browserCompat: ["E15", "FF3", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the marker that will be drawn at the first vertices of the given
 * markable element.
 *
 * **Syntax:** `none | <url>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/marker-start
 */
export function markerStart(value: UrlValue): Style {
	return createStyle({
		property: "marker-start",
		value: String(value),
		description: "Specifies the marker that will be drawn at the first vertices of the given markable element.",
		syntax: "none | <url>",
		browserCompat: ["E15", "FF3", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The mask CSS property alters the visibility of an element by either partially
 * or fully hiding it. This is accomplished by either masking or clipping the
 * image at specific points.
 *
 * **Syntax:** `<mask-layer>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 120 |
 * | Firefox | 53 |
 * | FFA | 53 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 120 |
 * | CA | 120 |
 * | Opera | 106 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask
 */
export function mask(value: StringValue): Style {
	return createStyle({
		property: "mask",
		value: String(value),
		description:
			"The mask CSS property alters the visibility of an element by either partially or fully hiding it. This is accomplished by either masking or clipping the image at specific points.",
		syntax: "<mask-layer>#",
		browserCompat: ["E120", "FF53", "FFA53", "S15.4", "SM15.4", "C120", "CA120", "O106"],
		baseline: { status: "low", baseline_low_date: "2023-12-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The mask-border CSS property lets you create a mask along the edge of an
 * element's border.

This property is a shorthand for mask-border-source,
 * mask-border-slice, mask-border-width, mask-border-outset, mask-border-repeat,
 * and mask-border-mode. As with all shorthand properties, any omitted sub-values
 * will be set to their initial value.
 *
 * **Syntax:** `<'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>`
 *
 * **Browser Support:**
 * 
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 17.2 |
 * | SM | 17.2 |
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border
 */
export function maskBorder(value: StringValue): Style {
	return createStyle({
		property: "mask-border",
		value: String(value),
		description:
			"The mask-border CSS property lets you create a mask along the edge of an element's border.\n\nThis property is a shorthand for mask-border-source, mask-border-slice, mask-border-width, mask-border-outset, mask-border-repeat, and mask-border-mode. As with all shorthand properties, any omitted sub-values will be set to their initial value.",
		syntax:
			"<'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>",
		browserCompat: ["S17.2", "SM17.2", "O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The mask-border-mode CSS property specifies the blending mode used in a mask
 * border.
 *
 * **Syntax:** `luminance | alpha`
 */
export function maskBorderMode(value: KeywordValue): Style {
	return createStyle({
		property: "mask-border-mode",
		value: String(value),
		description: "The mask-border-mode CSS property specifies the blending mode used in a mask border.",
		syntax: "luminance | alpha",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The mask-border-outset CSS property specifies the distance by which an
 * element's mask border is set out from its border box.
 *
 * **Syntax:** `[ <length> | <number> ]{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 17.2 |
 * | SM | 17.2 |
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-outset
 */
export function maskBorderOutset(value: LengthValue): Style {
	return createStyle({
		property: "mask-border-outset",
		value: String(value),
		description:
			"The mask-border-outset CSS property specifies the distance by which an element's mask border is set out from its border box.",
		syntax: "[ <length> | <number> ]{1,4}",
		browserCompat: ["S17.2", "SM17.2", "O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The mask-border-repeat CSS property defines how the edge regions of a source
 * image are adjusted to fit the dimensions of an element's mask border.
 *
 * **Syntax:** `[ stretch | repeat | round | space ]{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 17.2 |
 * | SM | 17.2 |
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-repeat
 */
export function maskBorderRepeat(value: StringValue): Style {
	return createStyle({
		property: "mask-border-repeat",
		value: String(value),
		description:
			"The mask-border-repeat CSS property defines how the edge regions of a source image are adjusted to fit the dimensions of an element's mask border.",
		syntax: "[ stretch | repeat | round | space ]{1,2}",
		browserCompat: ["S17.2", "SM17.2", "O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The mask-border-slice CSS property divides the image specified by
 * mask-border-source into regions. These regions are used to form the components
 * of an element's mask border.
 *
 * **Syntax:** `<number-percentage>{1,4} fill?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 17.2 |
 * | SM | 17.2 |
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-slice
 */
export function maskBorderSlice(value: StringValue): Style {
	return createStyle({
		property: "mask-border-slice",
		value: String(value),
		description:
			"The mask-border-slice CSS property divides the image specified by mask-border-source into regions. These regions are used to form the components of an element's mask border.",
		syntax: "<number-percentage>{1,4} fill?",
		browserCompat: ["S17.2", "SM17.2", "O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The mask-border-source CSS property specifies the source image used to create
 * an element's mask border.

The mask-border-slice property is used to divide
 * the source image into regions, which are then dynamically applied to the final
 * mask border.
 *
 * **Syntax:** `none | <image>`
 *
 * **Browser Support:**
 * 
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 17.2 |
 * | SM | 17.2 |
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-source
 */
export function maskBorderSource(value: ImageValue): Style {
	return createStyle({
		property: "mask-border-source",
		value: String(value),
		description:
			"The mask-border-source CSS property specifies the source image used to create an element's mask border.\n\nThe mask-border-slice property is used to divide the source image into regions, which are then dynamically applied to the final mask border.",
		syntax: "none | <image>",
		browserCompat: ["S17.2", "SM17.2", "O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The mask-border-width CSS property specifies the width of an element's mask
 * border.
 *
 * **Syntax:** `[ <length-percentage> | <number> | auto ]{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 17.2 |
 * | SM | 17.2 |
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-border-width
 */
export function maskBorderWidth(value: LengthPercentageValue): Style {
	return createStyle({
		property: "mask-border-width",
		value: String(value),
		description: "The mask-border-width CSS property specifies the width of an element's mask border.",
		syntax: "[ <length-percentage> | <number> | auto ]{1,4}",
		browserCompat: ["S17.2", "SM17.2", "O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The mask-clip CSS property determines the area, which is affected by a mask.
 * The painted content of an element must be restricted to this area.
 *
 * **Syntax:** `[ <coord-box> | no-clip ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 120 |
 * | Firefox | 53 |
 * | FFA | 53 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 120 |
 * | CA | 120 |
 * | Opera | 106 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-clip
 */
export function maskClip(value: StringValue): Style {
	return createStyle({
		property: "mask-clip",
		value: String(value),
		description:
			"The mask-clip CSS property determines the area, which is affected by a mask. The painted content of an element must be restricted to this area.",
		syntax: "[ <coord-box> | no-clip ]#",
		browserCompat: ["E120", "FF53", "FFA53", "S15.4", "SM15.4", "C120", "CA120", "O106"],
		baseline: { status: "low", baseline_low_date: "2023-12-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The mask-composite CSS property represents a compositing operation used on the
 * current mask layer with the mask layers below it.
 *
 * **Syntax:** `<compositing-operator>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 120 |
 * | Firefox | 53 |
 * | FFA | 53 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 120 |
 * | CA | 120 |
 * | Opera | 106 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-composite
 */
export function maskComposite(value: StringValue): Style {
	return createStyle({
		property: "mask-composite",
		value: String(value),
		description:
			"The mask-composite CSS property represents a compositing operation used on the current mask layer with the mask layers below it.",
		syntax: "<compositing-operator>#",
		browserCompat: ["E120", "FF53", "FFA53", "S15.4", "SM15.4", "C120", "CA120", "O106"],
		baseline: { status: "low", baseline_low_date: "2023-12-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the mask layer image of an element.
 *
 * **Syntax:** `<mask-reference>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 120 |
 * | Firefox | 53 |
 * | FFA | 53 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 120 |
 * | CA | 120 |
 * | Opera | 15 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-image
 */
export function maskImage(value: StringValue): Style {
	return createStyle({
		property: "mask-image",
		value: String(value),
		description: "Sets the mask layer image of an element.",
		syntax: "<mask-reference>#",
		browserCompat: ["E120", "FF53", "FFA53", "S15.4", "SM15.4", "C120", "CA120", "O15"],
		baseline: { status: "low", baseline_low_date: "2023-12-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Indicates whether the mask layer image is treated as luminance mask or alpha
 * mask.
 *
 * **Syntax:** `<masking-mode>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 120 |
 * | Firefox | 53 |
 * | FFA | 53 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 120 |
 * | CA | 120 |
 * | Opera | 106 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-mode
 */
export function maskMode(value: StringValue): Style {
	return createStyle({
		property: "mask-mode",
		value: String(value),
		description: "Indicates whether the mask layer image is treated as luminance mask or alpha mask.",
		syntax: "<masking-mode>#",
		browserCompat: ["E120", "FF53", "FFA53", "S15.4", "SM15.4", "C120", "CA120", "O106"],
		baseline: { status: "low", baseline_low_date: "2023-12-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the mask positioning area.
 *
 * **Syntax:** `<coord-box>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 120 |
 * | Firefox | 53 |
 * | FFA | 53 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 120 |
 * | CA | 120 |
 * | Opera | 106 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-origin
 */
export function maskOrigin(value: StringValue): Style {
	return createStyle({
		property: "mask-origin",
		value: String(value),
		description: "Specifies the mask positioning area.",
		syntax: "<coord-box>#",
		browserCompat: ["E120", "FF53", "FFA53", "S15.4", "SM15.4", "C120", "CA120", "O106"],
		baseline: { status: "low", baseline_low_date: "2023-12-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how mask layer images are positioned.
 *
 * **Syntax:** `<position>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 120 |
 * | Firefox | 53 |
 * | FFA | 53 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 120 |
 * | CA | 120 |
 * | Opera | 106 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-position
 */
export function maskPosition(value: PositionValue): Style {
	return createStyle({
		property: "mask-position",
		value: String(value),
		description: "Specifies how mask layer images are positioned.",
		syntax: "<position>#",
		browserCompat: ["E120", "FF53", "FFA53", "S15.4", "SM15.4", "C120", "CA120", "O106"],
		baseline: { status: "low", baseline_low_date: "2023-12-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how mask layer images are tiled after they have been sized and
 * positioned.
 *
 * **Syntax:** `<repeat-style>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 120 |
 * | Firefox | 53 |
 * | FFA | 53 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 120 |
 * | CA | 120 |
 * | Opera | 106 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-repeat
 */
export function maskRepeat(value: StringValue): Style {
	return createStyle({
		property: "mask-repeat",
		value: String(value),
		description: "Specifies how mask layer images are tiled after they have been sized and positioned.",
		syntax: "<repeat-style>#",
		browserCompat: ["E120", "FF53", "FFA53", "S15.4", "SM15.4", "C120", "CA120", "O106"],
		baseline: { status: "low", baseline_low_date: "2023-12-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the size of the mask layer images.
 *
 * **Syntax:** `<bg-size>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 120 |
 * | Firefox | 53 |
 * | FFA | 53 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 120 |
 * | CA | 120 |
 * | Opera | 106 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-size
 */
export function maskSize(value: StringValue): Style {
	return createStyle({
		property: "mask-size",
		value: String(value),
		description: "Specifies the size of the mask layer images.",
		syntax: "<bg-size>#",
		browserCompat: ["E120", "FF53", "FFA53", "S15.4", "SM15.4", "C120", "CA120", "O106"],
		baseline: { status: "low", baseline_low_date: "2023-12-07" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines whether the content of the <mask> element is treated as as luminance
 * mask or alpha mask.
 *
 * **Syntax:** `luminance | alpha`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 35 |
 * | FFA | 35 |
 * | Safari | 7 |
 * | SM | 7 |
 * | Chrome | 24 |
 * | CA | 25 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mask-type
 */
export function maskType(value: KeywordValue): Style {
	return createStyle({
		property: "mask-type",
		value: String(value),
		description: "Defines whether the content of the <mask> element is treated as as luminance mask or alpha mask.",
		syntax: "luminance | alpha",
		browserCompat: ["E79", "FF35", "FFA35", "S7", "SM7", "C24", "CA25", "O15"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The masonry-auto-flow CSS property modifies how items are placed when using
 * masonry in CSS Grid Layout.
 *
 * **Syntax:** `[ pack | next ] || [ definite-first | ordered ]`
 */
export function masonryAutoFlow(value: StringValue): Style {
	return createStyle({
		property: "masonry-auto-flow",
		value: String(value),
		description:
			"The masonry-auto-flow CSS property modifies how items are placed when using masonry in CSS Grid Layout.",
		syntax: "[ pack | next ] || [ definite-first | ordered ]",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Describe a notion of "depth" for each element of a mathematical formula, with
 * respect to the top-level container of that formula.
 *
 * **Syntax:** `auto-add | add(<integer>) | <integer>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 109 |
 * | Firefox | 117 |
 * | FFA | 117 |
 * | Chrome | 109 |
 * | CA | 109 |
 * | Opera | 95 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/math-depth
 */
export function mathDepth(value: IntegerValue): Style {
	return createStyle({
		property: "math-depth",
		value: String(value),
		description:
			'Describe a notion of "depth" for each element of a mathematical formula, with respect to the top-level container of that formula.',
		syntax: "auto-add | add(<integer>) | <integer>",
		browserCompat: ["E109", "FF117", "FFA117", "C109", "CA109", "O95"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Used for positioning superscript during the layout of MathML scripted
 * elements.
 *
 * **Syntax:** `normal | compact`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 109 |
 * | Chrome | 109 |
 * | CA | 109 |
 * | Opera | 95 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/math-shift
 */
export function mathShift(value: KeywordValue): Style {
	return createStyle({
		property: "math-shift",
		value: String(value),
		description: "Used for positioning superscript during the layout of MathML scripted elements.",
		syntax: "normal | compact",
		browserCompat: ["E109", "Spreview", "C109", "CA109", "O95"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The math-style property indicates whether MathML equations should render with
 * normal or compact height.
 *
 * **Syntax:** `normal | compact`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 109 |
 * | Firefox | 117 |
 * | FFA | 117 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 109 |
 * | CA | 109 |
 * | Opera | 95 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/math-style
 */
export function mathStyle(value: KeywordValue): Style {
	return createStyle({
		property: "math-style",
		value: String(value),
		description:
			"The math-style property indicates whether MathML equations should render with normal or compact height.",
		syntax: "normal | compact",
		browserCompat: ["E109", "FF117", "FFA117", "S14.1", "SM14.5", "C109", "CA109", "O95"],
		baseline: { status: "low", baseline_low_date: "2023-08-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Maximum size of an element in the direction opposite that of the direction
 * specified by 'writing-mode'.
 *
 * **Syntax:** `<'max-width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-block-size
 */
export function maxBlockSize(value: StringValue): Style {
	return createStyle({
		property: "max-block-size",
		value: String(value),
		description:
			"Maximum size of an element in the direction opposite that of the direction specified by 'writing-mode'.",
		syntax: "<'max-width'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Allows authors to constrain content height to a certain range.
 *
 * **Syntax:** `none | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1.3 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 7 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-height
 */
export function maxHeight(value: StringValue): Style {
	return createStyle({
		property: "max-height",
		value: String(value),
		description: "Allows authors to constrain content height to a certain range.",
		syntax:
			"none | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1.3", "SM1", "C1", "CA18", "IE7", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Maximum size of an element in the direction specified by 'writing-mode'.
 *
 * **Syntax:** `<'max-width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-inline-size
 */
export function maxInlineSize(value: StringValue): Style {
	return createStyle({
		property: "max-inline-size",
		value: String(value),
		description: "Maximum size of an element in the direction specified by 'writing-mode'.",
		syntax: "<'max-width'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The max-lines property forces a break after a set number of lines
 *
 * **Syntax:** `none | <integer>`
 */
export function maxLines(value: IntegerValue): Style {
	return createStyle({
		property: "max-lines",
		value: String(value),
		description: "The max-lines property forces a break after a set number of lines",
		syntax: "none | <integer>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Allows authors to constrain content width to a certain range.
 *
 * **Syntax:** `none | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 7 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/max-width
 */
export function maxWidth(value: StringValue): Style {
	return createStyle({
		property: "max-width",
		value: String(value),
		description: "Allows authors to constrain content width to a certain range.",
		syntax:
			"none | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE7", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Minimal size of an element in the direction opposite that of the direction
 * specified by 'writing-mode'.
 *
 * **Syntax:** `<'min-width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-block-size
 */
export function minBlockSize(value: StringValue): Style {
	return createStyle({
		property: "min-block-size",
		value: String(value),
		description:
			"Minimal size of an element in the direction opposite that of the direction specified by 'writing-mode'.",
		syntax: "<'min-width'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Allows authors to constrain content height to a certain range.
 *
 * **Syntax:** `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 1.3 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 7 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-height
 */
export function minHeight(value: StringValue): Style {
	return createStyle({
		property: "min-height",
		value: String(value),
		description: "Allows authors to constrain content height to a certain range.",
		syntax:
			"auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>",
		browserCompat: ["E12", "FF3", "FFA4", "S1.3", "SM1", "C1", "CA18", "IE7", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Minimal size of an element in the direction specified by 'writing-mode'.
 *
 * **Syntax:** `<'min-width'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-inline-size
 */
export function minInlineSize(value: StringValue): Style {
	return createStyle({
		property: "min-inline-size",
		value: String(value),
		description: "Minimal size of an element in the direction specified by 'writing-mode'.",
		syntax: "<'min-width'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Allows authors to constrain content width to a certain range.
 *
 * **Syntax:** `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 7 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/min-width
 */
export function minWidth(value: StringValue): Style {
	return createStyle({
		property: "min-width",
		value: String(value),
		description: "Allows authors to constrain content width to a certain range.",
		syntax:
			"auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE7", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the formula that must be used to mix the colors with the backdrop.
 *
 * **Syntax:** `<blend-mode> | plus-darker | plus-lighter`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 32 |
 * | FFA | 32 |
 * | Safari | 8 |
 * | SM | 8 |
 * | Chrome | 41 |
 * | CA | 41 |
 * | Opera | 28 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/mix-blend-mode
 */
export function mixBlendMode(value: StringValue): Style {
	return createStyle({
		property: "mix-blend-mode",
		value: String(value),
		description: "Defines the formula that must be used to mix the colors with the backdrop.",
		syntax: "<blend-mode> | plus-darker | plus-lighter",
		browserCompat: ["E79", "FF32", "FFA32", "S8", "SM8", "C41", "CA41", "O28"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how the contents of a replaced element should be scaled relative to
 * the box established by its used height and width.
 *
 * **Syntax:** `fill | contain | cover | none | scale-down`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 36 |
 * | FFA | 36 |
 * | Safari | 10 |
 * | SM | 10 |
 * | Chrome | 32 |
 * | CA | 32 |
 * | Opera | 19 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/object-fit
 */
export function objectFit(value: KeywordValue): Style {
	return createStyle({
		property: "object-fit",
		value: String(value),
		description:
			"Specifies how the contents of a replaced element should be scaled relative to the box established by its used height and width.",
		syntax: "fill | contain | cover | none | scale-down",
		browserCompat: ["E79", "FF36", "FFA36", "S10", "SM10", "C32", "CA32", "O19"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the alignment of the replaced element inside its box.
 *
 * **Syntax:** `<position>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 36 |
 * | FFA | 36 |
 * | Safari | 10 |
 * | SM | 10 |
 * | Chrome | 32 |
 * | CA | 32 |
 * | Opera | 19 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/object-position
 */
export function objectPosition(value: PositionValue): Style {
	return createStyle({
		property: "object-position",
		value: String(value),
		description: "Determines the alignment of the replaced element inside its box.",
		syntax: "<position>",
		browserCompat: ["E79", "FF36", "FFA36", "S10", "SM10", "C32", "CA32", "O19"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The offset CSS property is a shorthand property for animating an element along
 * a defined path.
 *
 * **Syntax:** `[ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 72 |
 * | FFA | 79 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 55 |
 * | CA | 55 |
 * | Opera | 42 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset
 */
export function offset(value: StringValue): Style {
	return createStyle({
		property: "offset",
		value: String(value),
		description: "The offset CSS property is a shorthand property for animating an element along a defined path.",
		syntax:
			"[ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?",
		browserCompat: ["E79", "FF72", "FFA79", "S16", "SM16", "C55", "CA55", "O42"],
		baseline: { status: "high", baseline_low_date: "2022-09-12", baseline_high_date: "2025-03-12" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines an anchor point of the box positioned along the path. The anchor point
 * specifies the point of the box which is to be considered as the point that is
 * moved along the path.
 *
 * **Syntax:** `auto | <position>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 116 |
 * | Firefox | 72 |
 * | FFA | 79 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 116 |
 * | CA | 116 |
 * | Opera | 102 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-anchor
 */
export function offsetAnchor(value: PositionValue): Style {
	return createStyle({
		property: "offset-anchor",
		value: String(value),
		description:
			"Defines an anchor point of the box positioned along the path. The anchor point specifies the point of the box which is to be considered as the point that is moved along the path.",
		syntax: "auto | <position>",
		browserCompat: ["E116", "FF72", "FFA79", "S16", "SM16", "C116", "CA116", "O102"],
		baseline: { status: "low", baseline_low_date: "2023-08-21" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The offset-distance CSS property specifies a position along an offset-path.
 *
 * **Syntax:** `<length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 72 |
 * | FFA | 79 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 55 |
 * | CA | 55 |
 * | Opera | 42 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-distance
 */
export function offsetDistance(value: LengthPercentageValue): Style {
	return createStyle({
		property: "offset-distance",
		value: String(value),
		description: "The offset-distance CSS property specifies a position along an offset-path.",
		syntax: "<length-percentage>",
		browserCompat: ["E79", "FF72", "FFA79", "S16", "SM16", "C55", "CA55", "O42"],
		baseline: { status: "high", baseline_low_date: "2022-09-12", baseline_high_date: "2025-03-12" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The offset-path CSS property specifies the offset path where the element gets
 * positioned. The exact element’s position on the offset path is determined by
 * the offset-distance property. An offset path is either a specified path with
 * one or multiple sub-paths or the geometry of a not-styled basic shape. Each
 * shape or path must define an initial position for the computed value of "0"
 * for offset-distance and an initial direction which specifies the rotation of
 * the object to the initial position.

In this specification, a direction (or
 * rotation) of 0 degrees is equivalent to the direction of the positive x-axis
 * in the object’s local coordinate system. In other words, a rotation of 0
 * degree points to the right side of the UA if the object and its ancestors have
 * no transformation applied.
 *
 * **Syntax:** `none | <offset-path> || <coord-box>`
 *
 * **Browser Support:**
 * 
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 72 |
 * | FFA | 79 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 55 |
 * | CA | 55 |
 * | Opera | 45 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-path
 */
export function offsetPath(value: StringValue): Style {
	return createStyle({
		property: "offset-path",
		value: String(value),
		description:
			'The offset-path CSS property specifies the offset path where the element gets positioned. The exact element’s position on the offset path is determined by the offset-distance property. An offset path is either a specified path with one or multiple sub-paths or the geometry of a not-styled basic shape. Each shape or path must define an initial position for the computed value of "0" for offset-distance and an initial direction which specifies the rotation of the object to the initial position.\n\nIn this specification, a direction (or rotation) of 0 degrees is equivalent to the direction of the positive x-axis in the object’s local coordinate system. In other words, a rotation of 0 degree points to the right side of the UA if the object and its ancestors have no transformation applied.',
		syntax: "none | <offset-path> || <coord-box>",
		browserCompat: ["E79", "FF72", "FFA79", "S15.4", "SM15.4", "C55", "CA55", "O45"],
		baseline: { status: "high", baseline_low_date: "2022-03-14", baseline_high_date: "2024-09-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the initial position of the offset path. If position is specified
 * with static, offset-position would be ignored.
 *
 * **Syntax:** `normal | auto | <position>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 116 |
 * | Firefox | 122 |
 * | FFA | 122 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 116 |
 * | CA | 116 |
 * | Opera | 102 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-position
 */
export function offsetPosition(value: PositionValue): Style {
	return createStyle({
		property: "offset-position",
		value: String(value),
		description:
			"Specifies the initial position of the offset path. If position is specified with static, offset-position would be ignored.",
		syntax: "normal | auto | <position>",
		browserCompat: ["E116", "FF122", "FFA122", "S16", "SM16", "C116", "CA116", "O102"],
		baseline: { status: "low", baseline_low_date: "2024-01-23" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The offset-rotate CSS property defines the direction of the element while
 * positioning along the offset path.
 *
 * **Syntax:** `[ auto | reverse ] || <angle>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 72 |
 * | FFA | 79 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 56 |
 * | CA | 56 |
 * | Opera | 43 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/offset-rotate
 */
export function offsetRotate(value: AngleValue): Style {
	return createStyle({
		property: "offset-rotate",
		value: String(value),
		description:
			"The offset-rotate CSS property defines the direction of the element while positioning along the offset path.",
		syntax: "[ auto | reverse ] || <angle>",
		browserCompat: ["E79", "FF72", "FFA79", "S16", "SM16", "C56", "CA56", "O43"],
		baseline: { status: "high", baseline_low_date: "2022-09-12", baseline_high_date: "2025-03-12" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Opacity of an element's text, where 1 is opaque and 0 is entirely transparent.
 *
 * **Syntax:** `<opacity-value>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 2 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 9 |
 * | Opera | 9 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/opacity
 */
export function opacity(value: StringValue): Style {
	return createStyle({
		property: "opacity",
		value: String(value),
		description: "Opacity of an element's text, where 1 is opaque and 0 is entirely transparent.",
		syntax: "<opacity-value>",
		browserCompat: ["E12", "FF1", "FFA4", "S2", "SM1", "C1", "CA18", "IE9", "O9"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls the order in which children of a flex container appear within the
 * flex container, by assigning them to ordinal groups.
 *
 * **Syntax:** `<integer>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 20 |
 * | FFA | 20 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 29 |
 * | CA | 29 |
 * | IE | 11 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/order
 */
export function order(value: IntegerValue): Style {
	return createStyle({
		property: "order",
		value: String(value),
		description:
			"Controls the order in which children of a flex container appear within the flex container, by assigning them to ordinal groups.",
		syntax: "<integer>",
		browserCompat: ["E12", "FF20", "FFA20", "S9", "SM9", "C29", "CA29", "IE11", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the minimum number of line boxes in a block container that must be
 * left in a fragment before a fragmentation break.
 *
 * **Syntax:** `<integer>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Safari | 1.3 |
 * | SM | 1 |
 * | Chrome | 25 |
 * | CA | 25 |
 * | IE | 8 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/orphans
 */
export function orphans(value: IntegerValue): Style {
	return createStyle({
		property: "orphans",
		value: String(value),
		description:
			"Specifies the minimum number of line boxes in a block container that must be left in a fragment before a fragmentation break.",
		syntax: "<integer>",
		browserCompat: ["E12", "S1.3", "SM1", "C25", "CA25", "IE8", "O9.2"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property for 'outline-style', 'outline-width', and 'outline-color'.
 *
 * **Syntax:** `<'outline-width'> || <'outline-style'> || <'outline-color'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 94 |
 * | Firefox | 88 |
 * | FFA | 88 |
 * | Safari | 16.4 |
 * | SM | 16.4 |
 * | Chrome | 94 |
 * | CA | 94 |
 * | IE | 8 |
 * | Opera | 80 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline
 */
export function outline(value: StringValue): Style {
	return createStyle({
		property: "outline",
		value: String(value),
		description: "Shorthand property for 'outline-style', 'outline-width', and 'outline-color'.",
		syntax: "<'outline-width'> || <'outline-style'> || <'outline-color'>",
		browserCompat: ["E94", "FF88", "FFA88", "S16.4", "SM16.4", "C94", "CA94", "IE8", "O80"],
		baseline: { status: "high", baseline_low_date: "2023-03-27", baseline_high_date: "2025-09-27" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The color of the outline.
 *
 * **Syntax:** `auto | <color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 1.2 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-color
 */
export function outlineColor(value: ColorValue): Style {
	return createStyle({
		property: "outline-color",
		value: String(value),
		description: "The color of the outline.",
		syntax: "auto | <color>",
		browserCompat: ["E12", "FF1.5", "FFA4", "S1.2", "SM1", "C1", "CA18", "IE8", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Offset the outline and draw it beyond the border edge.
 *
 * **Syntax:** `<length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 1.2 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 9.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-offset
 */
export function outlineOffset(value: LengthValue): Style {
	return createStyle({
		property: "outline-offset",
		value: String(value),
		description: "Offset the outline and draw it beyond the border edge.",
		syntax: "<length>",
		browserCompat: ["E15", "FF1.5", "FFA4", "S1.2", "SM1", "C1", "CA18", "O9.5"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Style of the outline.
 *
 * **Syntax:** `auto | <outline-line-style>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 1.2 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-style
 */
export function outlineStyle(value: StringValue): Style {
	return createStyle({
		property: "outline-style",
		value: String(value),
		description: "Style of the outline.",
		syntax: "auto | <outline-line-style>",
		browserCompat: ["E12", "FF1.5", "FFA4", "S1.2", "SM1", "C1", "CA18", "IE8", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Width of the outline.
 *
 * **Syntax:** `<line-width>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 1.2 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/outline-width
 */
export function outlineWidth(value: StringValue): Style {
	return createStyle({
		property: "outline-width",
		value: String(value),
		description: "Width of the outline.",
		syntax: "<line-width>",
		browserCompat: ["E12", "FF1.5", "FFA4", "S1.2", "SM1", "C1", "CA18", "IE8", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand for setting 'overflow-x' and 'overflow-y'.
 *
 * **Syntax:** `[ visible | hidden | clip | scroll | auto ]{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow
 */
export function overflow(value: StringValue): Style {
	return createStyle({
		property: "overflow",
		value: String(value),
		description: "Shorthand for setting 'overflow-x' and 'overflow-y'.",
		syntax: "[ visible | hidden | clip | scroll | auto ]{1,2}",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The overflow-anchor CSS property provides a way to opt out browser scroll
 * anchoring behavior which adjusts scroll position to minimize content shifts.
 *
 * **Syntax:** `auto | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Chrome | 56 |
 * | CA | 56 |
 * | Opera | 43 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-anchor
 */
export function overflowAnchor(value: KeywordValue): Style {
	return createStyle({
		property: "overflow-anchor",
		value: String(value),
		description:
			"The overflow-anchor CSS property provides a way to opt out browser scroll anchoring behavior which adjusts scroll position to minimize content shifts.",
		syntax: "auto | none",
		browserCompat: ["E79", "FF66", "FFA66", "Spreview", "C56", "CA56", "O43"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The overflow-block CSS media feature can be used to test how the output device
 * handles content that overflows the initial containing block along the block
 * axis.
 *
 * **Syntax:** `visible | hidden | clip | scroll | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 135 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 135 |
 * | CA | 135 |
 * | Opera | 120 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-block
 */
export function overflowBlock(value: KeywordValue): Style {
	return createStyle({
		property: "overflow-block",
		value: String(value),
		description:
			"The overflow-block CSS media feature can be used to test how the output device handles content that overflows the initial containing block along the block axis.",
		syntax: "visible | hidden | clip | scroll | auto",
		browserCompat: ["E135", "FF69", "FFA79", "S26", "SM26", "C135", "CA135", "O120"],
		baseline: { status: "low", baseline_low_date: "2025-09-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The overflow-clip-box CSS property specifies relative to which box the
 * clipping happens when there is an overflow. It is short hand for the
 * overflow-clip-box-inline and overflow-clip-box-block properties.
 *
 * **Syntax:** `padding-box | content-box`
 */
export function overflowClipBox(value: KeywordValue): Style {
	return createStyle({
		property: "overflow-clip-box",
		value: String(value),
		description:
			"The overflow-clip-box CSS property specifies relative to which box the clipping happens when there is an overflow. It is short hand for the overflow-clip-box-inline and overflow-clip-box-block properties.",
		syntax: "padding-box | content-box",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The overflow-clip-margin CSS property determines how far outside its bounds an
 * element with overflow: clip may be painted before being clipped.
 *
 * **Syntax:** `<visual-box> || <length [0,∞]>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 76 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-clip-margin
 */
export function overflowClipMargin(value: StringValue): Style {
	return createStyle({
		property: "overflow-clip-margin",
		value: String(value),
		description:
			"The overflow-clip-margin CSS property determines how far outside its bounds an element with overflow: clip may be painted before being clipped.",
		syntax: "<visual-box> || <length [0,∞]>",
		browserCompat: ["O76"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The overflow-inline CSS media feature can be used to test how the output
 * device handles content that overflows the initial containing block along the
 * inline axis.
 *
 * **Syntax:** `visible | hidden | clip | scroll | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 135 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 135 |
 * | CA | 135 |
 * | Opera | 120 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-inline
 */
export function overflowInline(value: KeywordValue): Style {
	return createStyle({
		property: "overflow-inline",
		value: String(value),
		description:
			"The overflow-inline CSS media feature can be used to test how the output device handles content that overflows the initial containing block along the inline axis.",
		syntax: "visible | hidden | clip | scroll | auto",
		browserCompat: ["E135", "FF69", "FFA79", "S26", "SM26", "C135", "CA135", "O120"],
		baseline: { status: "low", baseline_low_date: "2025-09-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies whether the UA may break within a word to prevent overflow when an
 * otherwise-unbreakable string is too long to fit within the line box.
 *
 * **Syntax:** `normal | break-word | anywhere`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 18 |
 * | Firefox | 49 |
 * | FFA | 49 |
 * | Safari | 7 |
 * | SM | 7 |
 * | Chrome | 23 |
 * | CA | 25 |
 * | IE | 5.5 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-wrap
 */
export function overflowWrap(value: KeywordValue): Style {
	return createStyle({
		property: "overflow-wrap",
		value: String(value),
		description:
			"Specifies whether the UA may break within a word to prevent overflow when an otherwise-unbreakable string is too long to fit within the line box.",
		syntax: "normal | break-word | anywhere",
		browserCompat: ["E18", "FF49", "FFA49", "S7", "SM7", "C23", "CA25", "IE5.5", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2018-10-02", baseline_high_date: "2021-04-02" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the handling of overflow in the horizontal direction.
 *
 * **Syntax:** `visible | hidden | clip | scroll | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 3.5 |
 * | FFA | 4 |
 * | Safari | 3 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5 |
 * | Opera | 9.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-x
 */
export function overflowX(value: KeywordValue): Style {
	return createStyle({
		property: "overflow-x",
		value: String(value),
		description: "Specifies the handling of overflow in the horizontal direction.",
		syntax: "visible | hidden | clip | scroll | auto",
		browserCompat: ["E12", "FF3.5", "FFA4", "S3", "SM1", "C1", "CA18", "IE5", "O9.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the handling of overflow in the vertical direction.
 *
 * **Syntax:** `visible | hidden | clip | scroll | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 3.5 |
 * | FFA | 4 |
 * | Safari | 3 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5 |
 * | Opera | 9.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overflow-y
 */
export function overflowY(value: KeywordValue): Style {
	return createStyle({
		property: "overflow-y",
		value: String(value),
		description: "Specifies the handling of overflow in the vertical direction.",
		syntax: "visible | hidden | clip | scroll | auto",
		browserCompat: ["E12", "FF3.5", "FFA4", "S3", "SM1", "C1", "CA18", "IE5", "O9.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The overlay CSS property specifies whether an element appearing in the top
 * layer (for example, a shown popover or modal {{htmlelement("dialog")}}
 * element) is actually rendered in the top layer. This property is only relevant
 * within a list of transition-property values, and only if allow-discrete is set
 * as the transition-behavior.
 *
 * **Syntax:** `none | auto`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 117 |
 * | Chrome | 117 |
 * | CA | 117 |
 * | Opera | 103 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overlay
 */
export function overlay(value: KeywordValue): Style {
	return createStyle({
		property: "overlay",
		value: String(value),
		description:
			'The overlay CSS property specifies whether an element appearing in the top layer (for example, a shown popover or modal {{htmlelement("dialog")}} element) is actually rendered in the top layer. This property is only relevant within a list of transition-property values, and only if allow-discrete is set as the transition-behavior.',
		syntax: "none | auto",
		browserCompat: ["E117", "C117", "CA117", "O103"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The overscroll-behavior CSS property is shorthand for the
 * overscroll-behavior-x and overscroll-behavior-y properties, which allow you to
 * control the browser's scroll overflow behavior — what happens when the
 * boundary of a scrolling area is reached.
 *
 * **Syntax:** `[ contain | none | auto ]{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 18 |
 * | Firefox | 59 |
 * | FFA | 59 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 63 |
 * | CA | 63 |
 * | Opera | 50 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overscroll-behavior
 */
export function overscrollBehavior(value: StringValue): Style {
	return createStyle({
		property: "overscroll-behavior",
		value: String(value),
		description:
			"The overscroll-behavior CSS property is shorthand for the overscroll-behavior-x and overscroll-behavior-y properties, which allow you to control the browser's scroll overflow behavior — what happens when the boundary of a scrolling area is reached.",
		syntax: "[ contain | none | auto ]{1,2}",
		browserCompat: ["E18", "FF59", "FFA59", "S16", "SM16", "C63", "CA63", "O50"],
		baseline: { status: "high", baseline_low_date: "2022-09-12", baseline_high_date: "2025-03-12" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The overscroll-behavior-block CSS property sets the browser's behavior when
 * the block direction boundary of a scrolling area is reached.
 *
 * **Syntax:** `contain | none | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 73 |
 * | FFA | 79 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 77 |
 * | CA | 77 |
 * | Opera | 64 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overscroll-behavior-block
 */
export function overscrollBehaviorBlock(value: KeywordValue): Style {
	return createStyle({
		property: "overscroll-behavior-block",
		value: String(value),
		description:
			"The overscroll-behavior-block CSS property sets the browser's behavior when the block direction boundary of a scrolling area is reached.",
		syntax: "contain | none | auto",
		browserCompat: ["E79", "FF73", "FFA79", "S16", "SM16", "C77", "CA77", "O64"],
		baseline: { status: "high", baseline_low_date: "2022-09-12", baseline_high_date: "2025-03-12" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The overscroll-behavior-inline CSS property sets the browser's behavior when
 * the inline direction boundary of a scrolling area is reached.
 *
 * **Syntax:** `contain | none | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 73 |
 * | FFA | 79 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 77 |
 * | CA | 77 |
 * | Opera | 64 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overscroll-behavior-inline
 */
export function overscrollBehaviorInline(value: KeywordValue): Style {
	return createStyle({
		property: "overscroll-behavior-inline",
		value: String(value),
		description:
			"The overscroll-behavior-inline CSS property sets the browser's behavior when the inline direction boundary of a scrolling area is reached.",
		syntax: "contain | none | auto",
		browserCompat: ["E79", "FF73", "FFA79", "S16", "SM16", "C77", "CA77", "O64"],
		baseline: { status: "high", baseline_low_date: "2022-09-12", baseline_high_date: "2025-03-12" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The overscroll-behavior-x CSS property is allows you to control the browser's
 * scroll overflow behavior — what happens when the boundary of a scrolling area
 * is reached — in the x axis direction.
 *
 * **Syntax:** `contain | none | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 18 |
 * | Firefox | 59 |
 * | FFA | 59 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 63 |
 * | CA | 63 |
 * | Opera | 50 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overscroll-behavior-x
 */
export function overscrollBehaviorX(value: KeywordValue): Style {
	return createStyle({
		property: "overscroll-behavior-x",
		value: String(value),
		description:
			"The overscroll-behavior-x CSS property is allows you to control the browser's scroll overflow behavior — what happens when the boundary of a scrolling area is reached — in the x axis direction.",
		syntax: "contain | none | auto",
		browserCompat: ["E18", "FF59", "FFA59", "S16", "SM16", "C63", "CA63", "O50"],
		baseline: { status: "high", baseline_low_date: "2022-09-12", baseline_high_date: "2025-03-12" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The overscroll-behavior-y CSS property is allows you to control the browser's
 * scroll overflow behavior — what happens when the boundary of a scrolling area
 * is reached — in the y axis direction.
 *
 * **Syntax:** `contain | none | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 18 |
 * | Firefox | 59 |
 * | FFA | 59 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 63 |
 * | CA | 63 |
 * | Opera | 50 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/overscroll-behavior-y
 */
export function overscrollBehaviorY(value: KeywordValue): Style {
	return createStyle({
		property: "overscroll-behavior-y",
		value: String(value),
		description:
			"The overscroll-behavior-y CSS property is allows you to control the browser's scroll overflow behavior — what happens when the boundary of a scrolling area is reached — in the y axis direction.",
		syntax: "contain | none | auto",
		browserCompat: ["E18", "FF59", "FFA59", "S16", "SM16", "C63", "CA63", "O50"],
		baseline: { status: "high", baseline_low_date: "2022-09-12", baseline_high_date: "2025-03-12" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property to set values for the thickness of the padding area. If
 * left is omitted, it is the same as right. If bottom is omitted it is the same
 * as top, if right is omitted it is the same as top. The value may not be
 * negative.
 *
 * **Syntax:** `<'padding-top'>{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding
 */
export function padding(value: StringValue): Style {
	return createStyle({
		property: "padding",
		value: String(value),
		description:
			"Shorthand property to set values for the thickness of the padding area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. The value may not be negative.",
		syntax: "<'padding-top'>{1,4}",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The padding-block CSS property defines the logical block start and end padding
 * of an element, which maps to physical padding properties depending on the
 * element's writing mode, directionality, and text orientation.
 *
 * **Syntax:** `<'padding-top'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-block
 */
export function paddingBlock(value: StringValue): Style {
	return createStyle({
		property: "padding-block",
		value: String(value),
		description:
			"The padding-block CSS property defines the logical block start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.",
		syntax: "<'padding-top'>{1,2}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'padding-bottom'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'padding-top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-block-end
 */
export function paddingBlockEnd(value: StringValue): Style {
	return createStyle({
		property: "padding-block-end",
		value: String(value),
		description:
			"Logical 'padding-bottom'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'padding-top'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'padding-top'. Mapping depends on the parent element's 'writing-mode',
 * 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'padding-top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-block-start
 */
export function paddingBlockStart(value: StringValue): Style {
	return createStyle({
		property: "padding-block-start",
		value: String(value),
		description:
			"Logical 'padding-top'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'padding-top'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property to set values for the thickness of the padding area. If
 * left is omitted, it is the same as right. If bottom is omitted it is the same
 * as top, if right is omitted it is the same as top. The value may not be
 * negative.
 *
 * **Syntax:** `<length-percentage [0,∞]>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-bottom
 */
export function paddingBottom(value: StringValue): Style {
	return createStyle({
		property: "padding-bottom",
		value: String(value),
		description:
			"Shorthand property to set values for the thickness of the padding area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. The value may not be negative.",
		syntax: "<length-percentage [0,∞]>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The padding-inline CSS property defines the logical inline start and end
 * padding of an element, which maps to physical padding properties depending on
 * the element's writing mode, directionality, and text orientation.
 *
 * **Syntax:** `<'padding-top'>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 66 |
 * | FFA | 66 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-inline
 */
export function paddingInline(value: StringValue): Style {
	return createStyle({
		property: "padding-inline",
		value: String(value),
		description:
			"The padding-inline CSS property defines the logical inline start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.",
		syntax: "<'padding-top'>{1,2}",
		browserCompat: ["E87", "FF66", "FFA66", "S14.1", "SM14.5", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'padding-right'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'padding-top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-inline-end
 */
export function paddingInlineEnd(value: StringValue): Style {
	return createStyle({
		property: "padding-inline-end",
		value: String(value),
		description:
			"Logical 'padding-right'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'padding-top'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'padding-left'. Mapping depends on the parent element's
 * 'writing-mode', 'direction', and 'text-orientation'.
 *
 * **Syntax:** `<'padding-top'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-inline-start
 */
export function paddingInlineStart(value: StringValue): Style {
	return createStyle({
		property: "padding-inline-start",
		value: String(value),
		description:
			"Logical 'padding-left'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "<'padding-top'>",
		browserCompat: ["E79", "FF41", "FFA41", "S12.1", "SM12.2", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property to set values for the thickness of the padding area. If
 * left is omitted, it is the same as right. If bottom is omitted it is the same
 * as top, if right is omitted it is the same as top. The value may not be
 * negative.
 *
 * **Syntax:** `<length-percentage [0,∞]>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-left
 */
export function paddingLeft(value: StringValue): Style {
	return createStyle({
		property: "padding-left",
		value: String(value),
		description:
			"Shorthand property to set values for the thickness of the padding area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. The value may not be negative.",
		syntax: "<length-percentage [0,∞]>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property to set values for the thickness of the padding area. If
 * left is omitted, it is the same as right. If bottom is omitted it is the same
 * as top, if right is omitted it is the same as top. The value may not be
 * negative.
 *
 * **Syntax:** `<length-percentage [0,∞]>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-right
 */
export function paddingRight(value: StringValue): Style {
	return createStyle({
		property: "padding-right",
		value: String(value),
		description:
			"Shorthand property to set values for the thickness of the padding area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. The value may not be negative.",
		syntax: "<length-percentage [0,∞]>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property to set values for the thickness of the padding area. If
 * left is omitted, it is the same as right. If bottom is omitted it is the same
 * as top, if right is omitted it is the same as top. The value may not be
 * negative.
 *
 * **Syntax:** `<length-percentage [0,∞]>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/padding-top
 */
export function paddingTop(value: StringValue): Style {
	return createStyle({
		property: "padding-top",
		value: String(value),
		description:
			"Shorthand property to set values for the thickness of the padding area. If left is omitted, it is the same as right. If bottom is omitted it is the same as top, if right is omitted it is the same as top. The value may not be negative.",
		syntax: "<length-percentage [0,∞]>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The page CSS property is used to specify the named page, a specific type of
 * page defined by the @page at-rule.
 *
 * **Syntax:** `auto | <custom-ident>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 85 |
 * | Firefox | 110 |
 * | FFA | 110 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 85 |
 * | CA | 85 |
 * | Opera | 71 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page
 */
export function page(value: CustomIdentValue): Style {
	return createStyle({
		property: "page",
		value: String(value),
		description:
			"The page CSS property is used to specify the named page, a specific type of page defined by the @page at-rule.",
		syntax: "auto | <custom-ident>",
		browserCompat: ["E85", "FF110", "FFA110", "S1", "SM1", "C85", "CA85", "O71"],
		baseline: { status: "high", baseline_low_date: "2023-02-14", baseline_high_date: "2025-08-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines rules for page breaks after an element.
 *
 * **Syntax:** `auto | always | avoid | left | right | recto | verso`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1.2 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page-break-after
 */
export function pageBreakAfter(value: KeywordValue): Style {
	return createStyle({
		property: "page-break-after",
		value: String(value),
		description: "Defines rules for page breaks after an element.",
		syntax: "auto | always | avoid | left | right | recto | verso",
		browserCompat: ["E12", "FF1", "FFA4", "S1.2", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines rules for page breaks before an element.
 *
 * **Syntax:** `auto | always | avoid | left | right | recto | verso`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1.2 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page-break-before
 */
export function pageBreakBefore(value: KeywordValue): Style {
	return createStyle({
		property: "page-break-before",
		value: String(value),
		description: "Defines rules for page breaks before an element.",
		syntax: "auto | always | avoid | left | right | recto | verso",
		browserCompat: ["E12", "FF1", "FFA4", "S1.2", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines rules for page breaks inside an element.
 *
 * **Syntax:** `auto | avoid`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 19 |
 * | FFA | 19 |
 * | Safari | 1.3 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 7 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/page-break-inside
 */
export function pageBreakInside(value: KeywordValue): Style {
	return createStyle({
		property: "page-break-inside",
		value: String(value),
		description: "Defines rules for page breaks inside an element.",
		syntax: "auto | avoid",
		browserCompat: ["E12", "FF19", "FFA19", "S1.3", "SM1", "C1", "CA18", "IE8", "O7"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls the order that the three paint operations that shapes and text are
 * rendered with: their fill, their stroke and any markers they might have.
 *
 * **Syntax:** `normal | [ fill || stroke || markers ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 123 |
 * | Firefox | 60 |
 * | FFA | 60 |
 * | Safari | 11 |
 * | SM | 11 |
 * | Chrome | 123 |
 * | CA | 123 |
 * | Opera | 109 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/paint-order
 */
export function paintOrder(value: StringValue): Style {
	return createStyle({
		property: "paint-order",
		value: String(value),
		description:
			"Controls the order that the three paint operations that shapes and text are rendered with: their fill, their stroke and any markers they might have.",
		syntax: "normal | [ fill || stroke || markers ]",
		browserCompat: ["E123", "FF60", "FFA60", "S11", "SM11", "C123", "CA123", "O109"],
		baseline: { status: "low", baseline_low_date: "2024-03-22" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Applies the same transform as the perspective(<number>) transform function,
 * except that it applies only to the positioned or transformed children of the
 * element, not to the transform on the element itself.
 *
 * **Syntax:** `none | <length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 36 |
 * | CA | 36 |
 * | IE | 10 |
 * | Opera | 23 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/perspective
 */
export function perspective(value: LengthValue): Style {
	return createStyle({
		property: "perspective",
		value: String(value),
		description:
			"Applies the same transform as the perspective(<number>) transform function, except that it applies only to the positioned or transformed children of the element, not to the transform on the element itself.",
		syntax: "none | <length>",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C36", "CA36", "IE10", "O23"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Establishes the origin for the perspective property. It effectively sets the X
 * and Y position at which the viewer appears to be looking at the children of
 * the element.
 *
 * **Syntax:** `<position>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 36 |
 * | CA | 36 |
 * | IE | 10 |
 * | Opera | 23 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/perspective-origin
 */
export function perspectiveOrigin(value: PositionValue): Style {
	return createStyle({
		property: "perspective-origin",
		value: String(value),
		description:
			"Establishes the origin for the perspective property. It effectively sets the X and Y position at which the viewer appears to be looking at the children of the element.",
		syntax: "<position>",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C36", "CA36", "IE10", "O23"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The place-content CSS shorthand property sets both the align-content and
 * justify-content properties.
 *
 * **Syntax:** `<'align-content'> <'justify-content'>?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 45 |
 * | FFA | 45 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 59 |
 * | CA | 59 |
 * | Opera | 46 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/place-content
 */
export function placeContent(value: StringValue): Style {
	return createStyle({
		property: "place-content",
		value: String(value),
		description: "The place-content CSS shorthand property sets both the align-content and justify-content properties.",
		syntax: "<'align-content'> <'justify-content'>?",
		browserCompat: ["E79", "FF45", "FFA45", "S9", "SM9", "C59", "CA59", "O46"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The CSS place-items shorthand property sets both the align-items and
 * justify-items properties. The first value is the align-items property value,
 * the second the justify-items one. If the second value is not present, the
 * first value is also used for it.
 *
 * **Syntax:** `<'align-items'> <'justify-items'>?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 45 |
 * | FFA | 45 |
 * | Safari | 11 |
 * | SM | 11 |
 * | Chrome | 59 |
 * | CA | 59 |
 * | Opera | 46 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/place-items
 */
export function placeItems(value: StringValue): Style {
	return createStyle({
		property: "place-items",
		value: String(value),
		description:
			"The CSS place-items shorthand property sets both the align-items and justify-items properties. The first value is the align-items property value, the second the justify-items one. If the second value is not present, the first value is also used for it.",
		syntax: "<'align-items'> <'justify-items'>?",
		browserCompat: ["E79", "FF45", "FFA45", "S11", "SM11", "C59", "CA59", "O46"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The place-self CSS property is a shorthand property sets both the align-self
 * and justify-self properties. The first value is the align-self property value,
 * the second the justify-self one. If the second value is not present, the first
 * value is also used for it.
 *
 * **Syntax:** `<'align-self'> <'justify-self'>?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 45 |
 * | FFA | 45 |
 * | Safari | 11 |
 * | SM | 11 |
 * | Chrome | 59 |
 * | CA | 59 |
 * | Opera | 46 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/place-self
 */
export function placeSelf(value: StringValue): Style {
	return createStyle({
		property: "place-self",
		value: String(value),
		description:
			"The place-self CSS property is a shorthand property sets both the align-self and justify-self properties. The first value is the align-self property value, the second the justify-self one. If the second value is not present, the first value is also used for it.",
		syntax: "<'align-self'> <'justify-self'>?",
		browserCompat: ["E79", "FF45", "FFA45", "S11", "SM11", "C59", "CA59", "O46"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies under what circumstances a given element can be the target element
 * for a pointer event.
 *
 * **Syntax:** `auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 11 |
 * | Opera | 9 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/pointer-events
 */
export function pointerEvents(value: StringValue): Style {
	return createStyle({
		property: "pointer-events",
		value: String(value),
		description: "Specifies under what circumstances a given element can be the target element for a pointer event.",
		syntax:
			"auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit",
		browserCompat: ["E12", "FF1.5", "FFA4", "S4", "SM3.2", "C1", "CA18", "IE11", "O9"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The position CSS property sets how an element is positioned in a document. The
 * top, right, bottom, and left properties determine the final location of
 * positioned elements.
 *
 * **Syntax:** `static | relative | absolute | sticky | fixed`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position
 */
export function position(value: KeywordValue): Style {
	return createStyle({
		property: "position",
		value: String(value),
		description:
			"The position CSS property sets how an element is positioned in a document. The top, right, bottom, and left properties determine the final location of positioned elements.",
		syntax: "static | relative | absolute | sticky | fixed",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The position-anchor property defines the default anchor specifier for all
 * anchor functions on the element, allowing multiple elements to use the same
 * set of anchor functions (and position options lists!) while changing which
 * anchor element each is referring to.
 *
 * **Syntax:** `auto | <anchor-name>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 125 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 125 |
 * | CA | 125 |
 * | Opera | 111 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-anchor
 */
export function positionAnchor(value: StringValue): Style {
	return createStyle({
		property: "position-anchor",
		value: String(value),
		description:
			"The position-anchor property defines the default anchor specifier for all anchor functions on the element, allowing multiple elements to use the same set of anchor functions (and position options lists!) while changing which anchor element each is referring to.",
		syntax: "auto | <anchor-name>",
		browserCompat: ["E125", "FFpreview", "S26", "SM26", "C125", "CA125", "O111"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The position-area CSS property enables an anchor-positioned element to be
 * positioned relative to the edges of its associated anchor element by placing
 * the positioned element on one or more tiles of an implicit 3x3 grid, where the
 * anchoring element is the center cell.
 *
 * **Syntax:** `none | <position-area>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 129 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 129 |
 * | CA | 129 |
 * | Opera | 115 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-area
 */
export function positionArea(value: StringValue): Style {
	return createStyle({
		property: "position-area",
		value: String(value),
		description:
			"The position-area CSS property enables an anchor-positioned element to be positioned relative to the edges of its associated anchor element by placing the positioned element on one or more tiles of an implicit 3x3 grid, where the anchoring element is the center cell.",
		syntax: "none | <position-area>",
		browserCompat: ["E129", "FFpreview", "S26", "SM26", "C129", "CA129", "O115"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * This shorthand sets both position-try-options and position-try-order. If
 * <'position-try-order'> is omitted, it’s set to the property’s initial value.
 *
 * **Syntax:** `<'position-try-order'>? <'position-try-fallbacks'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 125 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 125 |
 * | CA | 125 |
 * | Opera | 111 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-try
 */
export function positionTry(value: StringValue): Style {
	return createStyle({
		property: "position-try",
		value: String(value),
		description:
			"This shorthand sets both position-try-options and position-try-order. If <'position-try-order'> is omitted, it’s set to the property’s initial value.",
		syntax: "<'position-try-order'>? <'position-try-fallbacks'>",
		browserCompat: ["E125", "FFpreview", "S26", "SM26", "C125", "CA125", "O111"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The position-try-fallbacks CSS property enables you to specify a list of one
 * or more alternative position try fallback options for anchor-positioned
 * elements to be placed relative to their associated anchor elements. When the
 * element would otherwise overflow its inset-modified containing block, the
 * browser will try placing the positioned element in these different fallback
 * positions, in the order provided, until it finds a value that stops it from
 * overflowing its container or the viewport.
 *
 * **Syntax:** `none | [ [<dashed-ident> || <try-tactic>] | <'position-area'> ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 128 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 128 |
 * | CA | 128 |
 * | Opera | 114 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-try-fallbacks
 */
export function positionTryFallbacks(value: DashedIdentValue): Style {
	return createStyle({
		property: "position-try-fallbacks",
		value: String(value),
		description:
			"The position-try-fallbacks CSS property enables you to specify a list of one or more alternative position try fallback options for anchor-positioned elements to be placed relative to their associated anchor elements. When the element would otherwise overflow its inset-modified containing block, the browser will try placing the positioned element in these different fallback positions, in the order provided, until it finds a value that stops it from overflowing its container or the viewport.",
		syntax: "none | [ [<dashed-ident> || <try-tactic>] | <'position-area'> ]#",
		browserCompat: ["E128", "FFpreview", "S26", "SM26", "C128", "CA128", "O114"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * This property specifies the order in which the position options list will be
 * tried.
 *
 * **Syntax:** `normal | <try-size>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 125 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 125 |
 * | CA | 125 |
 * | Opera | 111 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-try-order
 */
export function positionTryOrder(value: StringValue): Style {
	return createStyle({
		property: "position-try-order",
		value: String(value),
		description: "This property specifies the order in which the position options list will be tried.",
		syntax: "normal | <try-size>",
		browserCompat: ["E125", "S26", "SM26", "C125", "CA125", "O111"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * There are times when an element’s anchors are not appropriate for positioning
 * the element with, and it would be better to simply not display the element at
 * all. position-visibility provides several conditions where this could be the
 * case.
 *
 * **Syntax:** `always | [ anchors-valid || anchors-visible || no-overflow ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 125 |
 * | Chrome | 125 |
 * | CA | 125 |
 * | Opera | 111 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/position-visibility
 */
export function positionVisibility(value: StringValue): Style {
	return createStyle({
		property: "position-visibility",
		value: String(value),
		description:
			"There are times when an element’s anchors are not appropriate for positioning the element with, and it would be better to simply not display the element at all. position-visibility provides several conditions where this could be the case.",
		syntax: "always | [ anchors-valid || anchors-visible || no-overflow ]",
		browserCompat: ["E125", "FFpreview", "C125", "CA125", "O111"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines what optimization the user agent is allowed to do when adjusting the
 * appearance for an output device.
 *
 * **Syntax:** `economy | exact`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 136 |
 * | Firefox | 97 |
 * | FFA | 97 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 136 |
 * | CA | 136 |
 * | Opera | 121 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/print-color-adjust
 */
export function printColorAdjust(value: KeywordValue): Style {
	return createStyle({
		property: "print-color-adjust",
		value: String(value),
		description:
			"Defines what optimization the user agent is allowed to do when adjusting the appearance for an output device.",
		syntax: "economy | exact",
		browserCompat: ["E136", "FF97", "FFA97", "S15.4", "SM15.4", "C136", "CA136", "O121"],
		baseline: { status: "low", baseline_low_date: "2025-05-01" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies quotation marks for any number of embedded quotations.
 *
 * **Syntax:** `none | auto | [ <string> <string> ]+`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 11 |
 * | CA | 18 |
 * | IE | 8 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/quotes
 */
export function quotes(value: StringValue): Style {
	return createStyle({
		property: "quotes",
		value: String(value),
		description: "Specifies quotation marks for any number of embedded quotations.",
		syntax: "none | auto | [ <string> <string> ]+",
		browserCompat: ["E12", "FF1.5", "FFA4", "S9", "SM9", "C11", "CA18", "IE8", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The r CSS property defines the radius of a circle. It can only be used with
 * the SVG circle element. If present, it overrides the circle's r attribute.
 *
 * **Syntax:** `<length> | <percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | Opera | 30 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/r
 */
export function r(value: LengthValue): Style {
	return createStyle({
		property: "r",
		value: String(value),
		description:
			"The r CSS property defines the radius of a circle. It can only be used with the SVG circle element. If present, it overrides the circle's r attribute.",
		syntax: "<length> | <percentage>",
		browserCompat: ["E79", "FF69", "FFA79", "S9", "SM9", "C43", "CA43", "O30"],
		baseline: { status: "high", baseline_low_date: "2020-07-28", baseline_high_date: "2023-01-28" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies whether or not an element is resizable by the user, and if so, along
 * which axis/axes.
 *
 * **Syntax:** `none | both | horizontal | vertical | block | inline`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 4 |
 * | Safari | 3 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/resize
 */
export function resize(value: KeywordValue): Style {
	return createStyle({
		property: "resize",
		value: String(value),
		description: "Specifies whether or not an element is resizable by the user, and if so, along which axis/axes.",
		syntax: "none | both | horizontal | vertical | block | inline",
		browserCompat: ["E79", "FF4", "S3", "C1", "CA18", "O12.1"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how far an absolutely positioned box's right margin edge is offset
 * to the left of the right edge of the box's 'containing block'.
 *
 * **Syntax:** `auto | <length-percentage> | <anchor()> | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/right
 */
export function right(value: LengthPercentageValue): Style {
	return createStyle({
		property: "right",
		value: String(value),
		description:
			"Specifies how far an absolutely positioned box's right margin edge is offset to the left of the right edge of the box's 'containing block'.",
		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE5.5", "O5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The rotate CSS property allows you to specify rotation transforms individually
 * and independently of the transform property. This maps better to typical user
 * interface usage, and saves having to remember the exact order of transform
 * functions to specify in the transform value.
 *
 * **Syntax:** `none | <angle> | [ x | y | z | <number>{3} ] && <angle>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 104 |
 * | Firefox | 72 |
 * | FFA | 79 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 104 |
 * | CA | 104 |
 * | Opera | 90 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/rotate
 */
export function rotate(value: AngleValue): Style {
	return createStyle({
		property: "rotate",
		value: String(value),
		description:
			"The rotate CSS property allows you to specify rotation transforms individually and independently of the transform property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the transform value.",
		syntax: "none | <angle> | [ x | y | z | <number>{3} ] && <angle>",
		browserCompat: ["E104", "FF72", "FFA79", "S14.1", "SM14.5", "C104", "CA104", "O90"],
		baseline: { status: "high", baseline_low_date: "2022-08-05", baseline_high_date: "2025-02-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The row-gap CSS property specifies the gutter between grid rows.
 *
 * **Syntax:** `normal | <length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 16 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 47 |
 * | CA | 47 |
 * | Opera | 34 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/row-gap
 */
export function rowGap(value: LengthPercentageValue): Style {
	return createStyle({
		property: "row-gap",
		value: String(value),
		description: "The row-gap CSS property specifies the gutter between grid rows.",
		syntax: "normal | <length-percentage>",
		browserCompat: ["E16", "FF52", "FFA52", "S10.1", "SM10.3", "C47", "CA47", "O34"],
		baseline: { status: "high", baseline_low_date: "2017-10-17", baseline_high_date: "2020-04-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how text is distributed within the various ruby boxes when their
 * contents do not exactly fill their respective boxes.
 *
 * **Syntax:** `start | center | space-between | space-around`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 128 |
 * | Firefox | 38 |
 * | FFA | 38 |
 * | Safari | 18.2 |
 * | SM | 18.2 |
 * | Chrome | 128 |
 * | CA | 128 |
 * | Opera | 114 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/ruby-align
 */
export function rubyAlign(value: KeywordValue): Style {
	return createStyle({
		property: "ruby-align",
		value: String(value),
		description:
			"Specifies how text is distributed within the various ruby boxes when their contents do not exactly fill their respective boxes.",
		syntax: "start | center | space-between | space-around",
		browserCompat: ["E128", "FF38", "FFA38", "S18.2", "SM18.2", "C128", "CA128", "O114"],
		baseline: { status: "low", baseline_low_date: "2024-12-11" },
		ast: createValueAST(String(value)),
	});
}

/**
 * This property controls how ruby annotation boxes should be rendered when there
 * are more than one in a ruby container box: whether each pair should be kept
 * separate, the annotations should be collapsed and rendered as a group, or the
 * separation should be determined based on the space available.
 *
 * **Syntax:** `separate | collapse | auto`
 */
export function rubyMerge(value: KeywordValue): Style {
	return createStyle({
		property: "ruby-merge",
		value: String(value),
		description:
			"This property controls how ruby annotation boxes should be rendered when there are more than one in a ruby container box: whether each pair should be kept separate, the annotations should be collapsed and rendered as a group, or the separation should be determined based on the space available.",
		syntax: "separate | collapse | auto",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Used by the parent of elements with display: ruby-text to control the position
 * of the ruby text with respect to its base.
 *
 * **Syntax:** `[ alternate || [ over | under ] ] | inter-character`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 84 |
 * | Firefox | 38 |
 * | FFA | 38 |
 * | Safari | 18.2 |
 * | SM | 18.2 |
 * | Chrome | 84 |
 * | CA | 84 |
 * | Opera | 70 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/ruby-position
 */
export function rubyPosition(value: StringValue): Style {
	return createStyle({
		property: "ruby-position",
		value: String(value),
		description:
			"Used by the parent of elements with display: ruby-text to control the position of the ruby text with respect to its base.",
		syntax: "[ alternate || [ over | under ] ] | inter-character",
		browserCompat: ["E84", "FF38", "FFA38", "S18.2", "SM18.2", "C84", "CA84", "O70"],
		baseline: { status: "low", baseline_low_date: "2024-12-11" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The rx CSS property defines the x-axis, or horizontal, radius of an SVG
 * ellipse and the horizontal curve of the corners of an SVG rect rectangle. If
 * present, it overrides the shape's rx attribute.
 *
 * **Syntax:** `<length> | <percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 17.4 |
 * | SM | 17.4 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | Opera | 30 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/rx
 */
export function rx(value: LengthValue): Style {
	return createStyle({
		property: "rx",
		value: String(value),
		description:
			"The rx CSS property defines the x-axis, or horizontal, radius of an SVG ellipse and the horizontal curve of the corners of an SVG rect rectangle. If present, it overrides the shape's rx attribute.",
		syntax: "<length> | <percentage>",
		browserCompat: ["E79", "FF69", "FFA79", "S17.4", "SM17.4", "C43", "CA43", "O30"],
		baseline: { status: "low", baseline_low_date: "2024-03-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The ry CSS property defines the y-axis, or vertical, radius of an SVG ellipse
 * and the vertical curve of the corners of an SVG rect rectangle. If present, it
 * overrides the shape's ry attribute.
 *
 * **Syntax:** `<length> | <percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 17.4 |
 * | SM | 17.4 |
 * | Chrome | 43 |
 * | CA | 43 |
 * | Opera | 30 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/ry
 */
export function ry(value: LengthValue): Style {
	return createStyle({
		property: "ry",
		value: String(value),
		description:
			"The ry CSS property defines the y-axis, or vertical, radius of an SVG ellipse and the vertical curve of the corners of an SVG rect rectangle. If present, it overrides the shape's ry attribute.",
		syntax: "<length> | <percentage>",
		browserCompat: ["E79", "FF69", "FFA79", "S17.4", "SM17.4", "C43", "CA43", "O30"],
		baseline: { status: "low", baseline_low_date: "2024-03-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scale CSS property allows you to specify scale transforms individually and
 * independently of the transform property. This maps better to typical user
 * interface usage, and saves having to remember the exact order of transform
 * functions to specify in the transform value.
 *
 * **Syntax:** `none | [ <number> | <percentage> ]{1,3}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 104 |
 * | Firefox | 72 |
 * | FFA | 79 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 104 |
 * | CA | 104 |
 * | Opera | 90 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scale
 */
export function scale(value: PercentageValue): Style {
	return createStyle({
		property: "scale",
		value: String(value),
		description:
			"The scale CSS property allows you to specify scale transforms individually and independently of the transform property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the transform value.",
		syntax: "none | [ <number> | <percentage> ]{1,3}",
		browserCompat: ["E104", "FF72", "FFA79", "S14.1", "SM14.5", "C104", "CA104", "O90"],
		baseline: { status: "high", baseline_low_date: "2022-08-05", baseline_high_date: "2025-02-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scrollbar-color CSS property sets the color of the scrollbar track and
 * thumb.
 *
 * **Syntax:** `auto | <color>{2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 121 |
 * | Firefox | 64 |
 * | FFA | 64 |
 * | Chrome | 121 |
 * | CA | 121 |
 * | Opera | 107 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scrollbar-color
 */
export function scrollbarColor(value: ColorValue): Style {
	return createStyle({
		property: "scrollbar-color",
		value: String(value),
		description: "The scrollbar-color CSS property sets the color of the scrollbar track and thumb.",
		syntax: "auto | <color>{2}",
		browserCompat: ["E121", "FF64", "FFA64", "C121", "CA121", "O107"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scrollbar-gutter CSS property allows authors to reserve space for the
 * scrollbar, preventing unwanted layout changes as the content grows while also
 * avoiding unnecessary visuals when scrolling isn't needed.
 *
 * **Syntax:** `auto | stable && both-edges?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 94 |
 * | Firefox | 97 |
 * | FFA | 97 |
 * | Safari | 18.2 |
 * | SM | 18.2 |
 * | Chrome | 94 |
 * | CA | 94 |
 * | Opera | 80 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scrollbar-gutter
 */
export function scrollbarGutter(value: StringValue): Style {
	return createStyle({
		property: "scrollbar-gutter",
		value: String(value),
		description:
			"The scrollbar-gutter CSS property allows authors to reserve space for the scrollbar, preventing unwanted layout changes as the content grows while also avoiding unnecessary visuals when scrolling isn't needed.",
		syntax: "auto | stable && both-edges?",
		browserCompat: ["E94", "FF97", "FFA97", "S18.2", "SM18.2", "C94", "CA94", "O80"],
		baseline: { status: "low", baseline_low_date: "2024-12-11" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scrollbar-width property allows the author to set the maximum thickness of
 * an element’s scrollbars when they are shown.
 *
 * **Syntax:** `auto | thin | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 121 |
 * | Firefox | 64 |
 * | FFA | 64 |
 * | Safari | 18.2 |
 * | SM | 18.2 |
 * | Chrome | 121 |
 * | CA | 121 |
 * | Opera | 107 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scrollbar-width
 */
export function scrollbarWidth(value: KeywordValue): Style {
	return createStyle({
		property: "scrollbar-width",
		value: String(value),
		description:
			"The scrollbar-width property allows the author to set the maximum thickness of an element’s scrollbars when they are shown. ",
		syntax: "auto | thin | none",
		browserCompat: ["E121", "FF64", "FFA64", "S18.2", "SM18.2", "C121", "CA121", "O107"],
		baseline: { status: "low", baseline_low_date: "2024-12-11" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the scrolling behavior for a scrolling box, when scrolling happens
 * due to navigation or CSSOM scrolling APIs.
 *
 * **Syntax:** `auto | smooth`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 36 |
 * | FFA | 36 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 61 |
 * | CA | 61 |
 * | Opera | 48 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-behavior
 */
export function scrollBehavior(value: KeywordValue): Style {
	return createStyle({
		property: "scroll-behavior",
		value: String(value),
		description:
			"Specifies the scrolling behavior for a scrolling box, when scrolling happens due to navigation or CSSOM scrolling APIs.",
		syntax: "auto | smooth",
		browserCompat: ["E79", "FF36", "FFA36", "S15.4", "SM15.4", "C61", "CA61", "O48"],
		baseline: { status: "high", baseline_low_date: "2022-03-14", baseline_high_date: "2024-09-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin property is a shorthand property which sets all of the
 * scroll-margin longhands, assigning values much like the margin property does
 * for the margin-* longhands.
 *
 * **Syntax:** `<length>{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 90 |
 * | FFA | 90 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin
 */
export function scrollMargin(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin",
		value: String(value),
		description:
			"The scroll-margin property is a shorthand property which sets all of the scroll-margin longhands, assigning values much like the margin property does for the margin-* longhands.",
		syntax: "<length>{1,4}",
		browserCompat: ["E79", "FF90", "FFA90", "S14.1", "SM14.5", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-07-13", baseline_high_date: "2024-01-13" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin-block property is a shorthand property which sets the
 * scroll-margin longhands in the block dimension.
 *
 * **Syntax:** `<length>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-block
 */
export function scrollMarginBlock(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin-block",
		value: String(value),
		description:
			"The scroll-margin-block property is a shorthand property which sets the scroll-margin longhands in the block dimension.",
		syntax: "<length>{1,2}",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin-block-start property defines the margin of the scroll snap
 * area at the start of the block dimension that is used for snapping this box to
 * the snapport. The scroll snap area is determined by taking the transformed
 * border box, finding its rectangular bounding box (axis-aligned in the scroll
 * container’s coordinate space), then adding the specified outsets.
 *
 * **Syntax:** `<length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-block-start
 */
export function scrollMarginBlockStart(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin-block-start",
		value: String(value),
		description:
			"The scroll-margin-block-start property defines the margin of the scroll snap area at the start of the block dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets.",
		syntax: "<length>",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin-block-end property defines the margin of the scroll snap
 * area at the end of the block dimension that is used for snapping this box to
 * the snapport. The scroll snap area is determined by taking the transformed
 * border box, finding its rectangular bounding box (axis-aligned in the scroll
 * container’s coordinate space), then adding the specified outsets.
 *
 * **Syntax:** `<length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-block-end
 */
export function scrollMarginBlockEnd(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin-block-end",
		value: String(value),
		description:
			"The scroll-margin-block-end property defines the margin of the scroll snap area at the end of the block dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets.",
		syntax: "<length>",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin-bottom property defines the bottom margin of the scroll snap
 * area that is used for snapping this box to the snapport. The scroll snap area
 * is determined by taking the transformed border box, finding its rectangular
 * bounding box (axis-aligned in the scroll container’s coordinate space), then
 * adding the specified outsets.
 *
 * **Syntax:** `<length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-bottom
 */
export function scrollMarginBottom(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin-bottom",
		value: String(value),
		description:
			"The scroll-margin-bottom property defines the bottom margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets.",
		syntax: "<length>",
		browserCompat: ["E79", "FF68", "FFA68", "S14.1", "SM14.5", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin-inline property is a shorthand property which sets the
 * scroll-margin longhands in the inline dimension.
 *
 * **Syntax:** `<length>{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-inline
 */
export function scrollMarginInline(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin-inline",
		value: String(value),
		description:
			"The scroll-margin-inline property is a shorthand property which sets the scroll-margin longhands in the inline dimension.",
		syntax: "<length>{1,2}",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin-inline-start property defines the margin of the scroll snap
 * area at the start of the inline dimension that is used for snapping this box
 * to the snapport. The scroll snap area is determined by taking the transformed
 * border box, finding its rectangular bounding box (axis-aligned in the scroll
 * container’s coordinate space), then adding the specified outsets.
 *
 * **Syntax:** `<length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-inline-start
 */
export function scrollMarginInlineStart(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin-inline-start",
		value: String(value),
		description:
			"The scroll-margin-inline-start property defines the margin of the scroll snap area at the start of the inline dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets.",
		syntax: "<length>",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin-inline-end property defines the margin of the scroll snap
 * area at the end of the inline dimension that is used for snapping this box to
 * the snapport. The scroll snap area is determined by taking the transformed
 * border box, finding its rectangular bounding box (axis-aligned in the scroll
 * container’s coordinate space), then adding the specified outsets.
 *
 * **Syntax:** `<length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-inline-end
 */
export function scrollMarginInlineEnd(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin-inline-end",
		value: String(value),
		description:
			"The scroll-margin-inline-end property defines the margin of the scroll snap area at the end of the inline dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets.",
		syntax: "<length>",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin-left property defines the left margin of the scroll snap
 * area that is used for snapping this box to the snapport. The scroll snap area
 * is determined by taking the transformed border box, finding its rectangular
 * bounding box (axis-aligned in the scroll container’s coordinate space), then
 * adding the specified outsets.
 *
 * **Syntax:** `<length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-left
 */
export function scrollMarginLeft(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin-left",
		value: String(value),
		description:
			"The scroll-margin-left property defines the left margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets.",
		syntax: "<length>",
		browserCompat: ["E79", "FF68", "FFA68", "S14.1", "SM14.5", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin-right property defines the right margin of the scroll snap
 * area that is used for snapping this box to the snapport. The scroll snap area
 * is determined by taking the transformed border box, finding its rectangular
 * bounding box (axis-aligned in the scroll container’s coordinate space), then
 * adding the specified outsets.
 *
 * **Syntax:** `<length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-right
 */
export function scrollMarginRight(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin-right",
		value: String(value),
		description:
			"The scroll-margin-right property defines the right margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets.",
		syntax: "<length>",
		browserCompat: ["E79", "FF68", "FFA68", "S14.1", "SM14.5", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-margin-top property defines the top margin of the scroll snap area
 * that is used for snapping this box to the snapport. The scroll snap area is
 * determined by taking the transformed border box, finding its rectangular
 * bounding box (axis-aligned in the scroll container’s coordinate space), then
 * adding the specified outsets.
 *
 * **Syntax:** `<length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-margin-top
 */
export function scrollMarginTop(value: LengthValue): Style {
	return createStyle({
		property: "scroll-margin-top",
		value: String(value),
		description:
			"The scroll-margin-top property defines the top margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container’s coordinate space), then adding the specified outsets.",
		syntax: "<length>",
		browserCompat: ["E79", "FF68", "FFA68", "S14.1", "SM14.5", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding property is a shorthand property which sets all of the
 * scroll-padding longhands, assigning values much like the padding property does
 * for the padding-* longhands.
 *
 * **Syntax:** `[ auto | <length-percentage> ]{1,4}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding
 */
export function scrollPadding(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding",
		value: String(value),
		description:
			"The scroll-padding property is a shorthand property which sets all of the scroll-padding longhands, assigning values much like the padding property does for the padding-* longhands.",
		syntax: "[ auto | <length-percentage> ]{1,4}",
		browserCompat: ["E79", "FF68", "FFA68", "S14.1", "SM14.5", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding-block property is a shorthand property which sets the
 * scroll-padding longhands for the block dimension.
 *
 * **Syntax:** `[ auto | <length-percentage> ]{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-block
 */
export function scrollPaddingBlock(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding-block",
		value: String(value),
		description:
			"The scroll-padding-block property is a shorthand property which sets the scroll-padding longhands for the block dimension.",
		syntax: "[ auto | <length-percentage> ]{1,2}",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding-block-start property defines offsets for the start edge in
 * the block dimension of the optimal viewing region of the scrollport: the
 * region used as the target region for placing things in view of the user. This
 * allows the author to exclude regions of the scrollport that are obscured by
 * other content (such as fixed-positioned toolbars or sidebars) or simply to put
 * more breathing room between a targeted element and the edges of the
 * scrollport.
 *
 * **Syntax:** `auto | <length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-block-start
 */
export function scrollPaddingBlockStart(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding-block-start",
		value: String(value),
		description:
			"The scroll-padding-block-start property defines offsets for the start edge in the block dimension of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport.",
		syntax: "auto | <length-percentage>",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding-block-end property defines offsets for the end edge in the
 * block dimension of the optimal viewing region of the scrollport: the region
 * used as the target region for placing things in view of the user. This allows
 * the author to exclude regions of the scrollport that are obscured by other
 * content (such as fixed-positioned toolbars or sidebars) or simply to put more
 * breathing room between a targeted element and the edges of the scrollport.
 *
 * **Syntax:** `auto | <length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-block-end
 */
export function scrollPaddingBlockEnd(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding-block-end",
		value: String(value),
		description:
			"The scroll-padding-block-end property defines offsets for the end edge in the block dimension of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport.",
		syntax: "auto | <length-percentage>",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding-bottom property defines offsets for the bottom of the
 * optimal viewing region of the scrollport: the region used as the target region
 * for placing things in view of the user. This allows the author to exclude
 * regions of the scrollport that are obscured by other content (such as
 * fixed-positioned toolbars or sidebars) or simply to put more breathing room
 * between a targeted element and the edges of the scrollport.
 *
 * **Syntax:** `auto | <length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-bottom
 */
export function scrollPaddingBottom(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding-bottom",
		value: String(value),
		description:
			"The scroll-padding-bottom property defines offsets for the bottom of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport.",
		syntax: "auto | <length-percentage>",
		browserCompat: ["E79", "FF68", "FFA68", "S14.1", "SM14.5", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding-inline property is a shorthand property which sets the
 * scroll-padding longhands for the inline dimension.
 *
 * **Syntax:** `[ auto | <length-percentage> ]{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-inline
 */
export function scrollPaddingInline(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding-inline",
		value: String(value),
		description:
			"The scroll-padding-inline property is a shorthand property which sets the scroll-padding longhands for the inline dimension.",
		syntax: "[ auto | <length-percentage> ]{1,2}",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding-inline-start property defines offsets for the start edge in
 * the inline dimension of the optimal viewing region of the scrollport: the
 * region used as the target region for placing things in view of the user. This
 * allows the author to exclude regions of the scrollport that are obscured by
 * other content (such as fixed-positioned toolbars or sidebars) or simply to put
 * more breathing room between a targeted element and the edges of the
 * scrollport.
 *
 * **Syntax:** `auto | <length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-inline-start
 */
export function scrollPaddingInlineStart(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding-inline-start",
		value: String(value),
		description:
			"The scroll-padding-inline-start property defines offsets for the start edge in the inline dimension of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport.",
		syntax: "auto | <length-percentage>",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding-inline-end property defines offsets for the end edge in the
 * inline dimension of the optimal viewing region of the scrollport: the region
 * used as the target region for placing things in view of the user. This allows
 * the author to exclude regions of the scrollport that are obscured by other
 * content (such as fixed-positioned toolbars or sidebars) or simply to put more
 * breathing room between a targeted element and the edges of the scrollport.
 *
 * **Syntax:** `auto | <length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-inline-end
 */
export function scrollPaddingInlineEnd(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding-inline-end",
		value: String(value),
		description:
			"The scroll-padding-inline-end property defines offsets for the end edge in the inline dimension of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport.",
		syntax: "auto | <length-percentage>",
		browserCompat: ["E79", "FF68", "FFA68", "S15", "SM15", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-09-20", baseline_high_date: "2024-03-20" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding-left property defines offsets for the left of the optimal
 * viewing region of the scrollport: the region used as the target region for
 * placing things in view of the user. This allows the author to exclude regions
 * of the scrollport that are obscured by other content (such as fixed-positioned
 * toolbars or sidebars) or simply to put more breathing room between a targeted
 * element and the edges of the scrollport.
 *
 * **Syntax:** `auto | <length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-left
 */
export function scrollPaddingLeft(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding-left",
		value: String(value),
		description:
			"The scroll-padding-left property defines offsets for the left of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport.",
		syntax: "auto | <length-percentage>",
		browserCompat: ["E79", "FF68", "FFA68", "S14.1", "SM14.5", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding-right property defines offsets for the right of the optimal
 * viewing region of the scrollport: the region used as the target region for
 * placing things in view of the user. This allows the author to exclude regions
 * of the scrollport that are obscured by other content (such as fixed-positioned
 * toolbars or sidebars) or simply to put more breathing room between a targeted
 * element and the edges of the scrollport.
 *
 * **Syntax:** `auto | <length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-right
 */
export function scrollPaddingRight(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding-right",
		value: String(value),
		description:
			"The scroll-padding-right property defines offsets for the right of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport.",
		syntax: "auto | <length-percentage>",
		browserCompat: ["E79", "FF68", "FFA68", "S14.1", "SM14.5", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-padding-top property defines offsets for the top of the optimal
 * viewing region of the scrollport: the region used as the target region for
 * placing things in view of the user. This allows the author to exclude regions
 * of the scrollport that are obscured by other content (such as fixed-positioned
 * toolbars or sidebars) or simply to put more breathing room between a targeted
 * element and the edges of the scrollport.
 *
 * **Syntax:** `auto | <length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-padding-top
 */
export function scrollPaddingTop(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-padding-top",
		value: String(value),
		description:
			"The scroll-padding-top property defines offsets for the top of the optimal viewing region of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or simply to put more breathing room between a targeted element and the edges of the scrollport.",
		syntax: "auto | <length-percentage>",
		browserCompat: ["E79", "FF68", "FFA68", "S14.1", "SM14.5", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2021-04-26", baseline_high_date: "2023-10-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-snap-align property specifies the box’s snap position as an
 * alignment of its snap area (as the alignment subject) within its snap
 * container’s snapport (as the alignment container). The two values specify the
 * snapping alignment in the block axis and inline axis, respectively. If only
 * one value is specified, the second value defaults to the same value.
 *
 * **Syntax:** `[ none | start | end | center ]{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 68 |
 * | FFA | 68 |
 * | Safari | 11 |
 * | SM | 11 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-snap-align
 */
export function scrollSnapAlign(value: StringValue): Style {
	return createStyle({
		property: "scroll-snap-align",
		value: String(value),
		description:
			"The scroll-snap-align property specifies the box’s snap position as an alignment of its snap area (as the alignment subject) within its snap container’s snapport (as the alignment container). The two values specify the snapping alignment in the block axis and inline axis, respectively. If only one value is specified, the second value defaults to the same value.",
		syntax: "[ none | start | end | center ]{1,2}",
		browserCompat: ["E79", "FF68", "FFA68", "S11", "SM11", "C69", "CA69", "O56"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the x and y coordinate within the element which will align with the
 * nearest ancestor scroll container's snap-destination for the respective axis.
 *
 * **Syntax:** `none | <position>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 39 |
 */
export function scrollSnapCoordinate(value: PositionValue): Style {
	return createStyle({
		property: "scroll-snap-coordinate",
		value: String(value),
		description:
			"Defines the x and y coordinate within the element which will align with the nearest ancestor scroll container's snap-destination for the respective axis.",
		syntax: "none | <position>#",
		browserCompat: ["FF39"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Define the x and y coordinate within the scroll container's visual viewport
 * which element snap points will align with.
 *
 * **Syntax:** `<position>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 39 |
 */
export function scrollSnapDestination(value: PositionValue): Style {
	return createStyle({
		property: "scroll-snap-destination",
		value: String(value),
		description:
			"Define the x and y coordinate within the scroll container's visual viewport which element snap points will align with.",
		syntax: "<position>",
		browserCompat: ["FF39"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the positioning of snap points along the x axis of the scroll
 * container it is applied to.
 *
 * **Syntax:** `none | repeat( <length-percentage> )`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 39 |
 */
export function scrollSnapPointsX(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-snap-points-x",
		value: String(value),
		description: "Defines the positioning of snap points along the x axis of the scroll container it is applied to.",
		syntax: "none | repeat( <length-percentage> )",
		browserCompat: ["FF39"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the positioning of snap points along the y axis of the scroll
 * container it is applied to.
 *
 * **Syntax:** `none | repeat( <length-percentage> )`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 39 |
 */
export function scrollSnapPointsY(value: LengthPercentageValue): Style {
	return createStyle({
		property: "scroll-snap-points-y",
		value: String(value),
		description: "Defines the positioning of snap points along the y axis of the scroll container it is applied to.",
		syntax: "none | repeat( <length-percentage> )",
		browserCompat: ["FF39"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-snap-stop CSS property defines whether the scroll container is
 * allowed to "pass over" possible snap positions.
 *
 * **Syntax:** `normal | always`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 103 |
 * | FFA | 103 |
 * | Safari | 15 |
 * | SM | 15 |
 * | Chrome | 75 |
 * | CA | 75 |
 * | Opera | 62 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-snap-stop
 */
export function scrollSnapStop(value: KeywordValue): Style {
	return createStyle({
		property: "scroll-snap-stop",
		value: String(value),
		description:
			'The scroll-snap-stop CSS property defines whether the scroll container is allowed to "pass over" possible snap positions.',
		syntax: "normal | always",
		browserCompat: ["E79", "FF103", "FFA103", "S15", "SM15", "C75", "CA75", "O62"],
		baseline: { status: "high", baseline_low_date: "2022-07-26", baseline_high_date: "2025-01-26" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines how strictly snap points are enforced on the scroll container.
 *
 * **Syntax:** `none | [ x | y | block | inline | both ] [ mandatory | proximity ]?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 99 |
 * | FFA | 68 |
 * | Safari | 11 |
 * | SM | 11 |
 * | Chrome | 69 |
 * | CA | 69 |
 * | IE | 10 |
 * | Opera | 56 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-snap-type
 */
export function scrollSnapType(value: StringValue): Style {
	return createStyle({
		property: "scroll-snap-type",
		value: String(value),
		description: "Defines how strictly snap points are enforced on the scroll container.",
		syntax: "none | [ x | y | block | inline | both ] [ mandatory | proximity ]?",
		browserCompat: ["E79", "FF99", "FFA68", "S11", "SM11", "C69", "CA69", "IE10", "O56"],
		baseline: { status: "high", baseline_low_date: "2022-04-05", baseline_high_date: "2024-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-snap-type-x CSS property defines how strictly snap points are
 * enforced on the horizontal axis of the scroll container in case there is
 * one.

Specifying any precise animations or physics used to enforce those snap
 * points is not covered by this property but instead left up to the user agent.
 *
 * **Syntax:** `none | mandatory | proximity`
 */
export function scrollSnapTypeX(value: KeywordValue): Style {
	return createStyle({
		property: "scroll-snap-type-x",
		value: String(value),
		description:
			"The scroll-snap-type-x CSS property defines how strictly snap points are enforced on the horizontal axis of the scroll container in case there is one.\n\nSpecifying any precise animations or physics used to enforce those snap points is not covered by this property but instead left up to the user agent.",
		syntax: "none | mandatory | proximity",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The scroll-snap-type-y CSS property defines how strictly snap points are
 * enforced on the vertical axis of the scroll container in case there is
 * one.

Specifying any precise animations or physics used to enforce those snap
 * points is not covered by this property but instead left up to the user agent.
 *
 * **Syntax:** `none | mandatory | proximity`
 */
export function scrollSnapTypeY(value: KeywordValue): Style {
	return createStyle({
		property: "scroll-snap-type-y",
		value: String(value),
		description:
			"The scroll-snap-type-y CSS property defines how strictly snap points are enforced on the vertical axis of the scroll container in case there is one.\n\nSpecifying any precise animations or physics used to enforce those snap points is not covered by this property but instead left up to the user agent.",
		syntax: "none | mandatory | proximity",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines a name that can be used to identify the source element of a scroll
 * timeline, along with the scrollbar axis that should provide the timeline.
 *
 * **Syntax:** `[ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-timeline
 */
export function scrollTimeline(value: StringValue): Style {
	return createStyle({
		property: "scroll-timeline",
		value: String(value),
		description:
			"Defines a name that can be used to identify the source element of a scroll timeline, along with the scrollbar axis that should provide the timeline.",
		syntax: "[ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the scrollbar that will be used to provide the timeline for a
 * scroll-timeline animation
 *
 * **Syntax:** `[ block | inline | x | y ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-timeline-axis
 */
export function scrollTimelineAxis(value: StringValue): Style {
	return createStyle({
		property: "scroll-timeline-axis",
		value: String(value),
		description: "Specifies the scrollbar that will be used to provide the timeline for a scroll-timeline animation",
		syntax: "[ block | inline | x | y ]#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines a name that can be used to identify an element as the source of a
 * scroll-timeline.
 *
 * **Syntax:** `[ none | <dashed-ident> ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-timeline-name
 */
export function scrollTimelineName(value: DashedIdentValue): Style {
	return createStyle({
		property: "scroll-timeline-name",
		value: String(value),
		description: "Defines a name that can be used to identify an element as the source of a scroll-timeline.",
		syntax: "[ none | <dashed-ident> ]#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the alpha channel threshold used to extract the shape using an image.
 * A value of 0.5 means that the shape will enclose all the pixels that are more
 * than 50% opaque.
 *
 * **Syntax:** `<opacity-value>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 62 |
 * | FFA | 62 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 37 |
 * | CA | 37 |
 * | Opera | 24 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-image-threshold
 */
export function shapeImageThreshold(value: StringValue): Style {
	return createStyle({
		property: "shape-image-threshold",
		value: String(value),
		description:
			"Defines the alpha channel threshold used to extract the shape using an image. A value of 0.5 means that the shape will enclose all the pixels that are more than 50% opaque.",
		syntax: "<opacity-value>",
		browserCompat: ["E79", "FF62", "FFA62", "S10.1", "SM10.3", "C37", "CA37", "O24"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Adds a margin to a 'shape-outside'. This defines a new shape that is the
 * smallest contour that includes all the points that are the 'shape-margin'
 * distance outward in the perpendicular direction from a point on the underlying
 * shape.
 *
 * **Syntax:** `<length-percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 62 |
 * | FFA | 62 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 37 |
 * | CA | 37 |
 * | Opera | 24 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-margin
 */
export function shapeMargin(value: LengthPercentageValue): Style {
	return createStyle({
		property: "shape-margin",
		value: String(value),
		description:
			"Adds a margin to a 'shape-outside'. This defines a new shape that is the smallest contour that includes all the points that are the 'shape-margin' distance outward in the perpendicular direction from a point on the underlying shape.",
		syntax: "<length-percentage>",
		browserCompat: ["E79", "FF62", "FFA62", "S10.1", "SM10.3", "C37", "CA37", "O24"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies an orthogonal rotation to be applied to an image before it is laid
 * out.
 *
 * **Syntax:** `none | [ <shape-box> || <basic-shape> ] | <image>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 62 |
 * | FFA | 62 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 37 |
 * | CA | 37 |
 * | Opera | 24 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-outside
 */
export function shapeOutside(value: ImageValue): Style {
	return createStyle({
		property: "shape-outside",
		value: String(value),
		description: "Specifies an orthogonal rotation to be applied to an image before it is laid out.",
		syntax: "none | [ <shape-box> || <basic-shape> ] | <image>",
		browserCompat: ["E79", "FF62", "FFA62", "S10.1", "SM10.3", "C37", "CA37", "O24"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Provides hints about what tradeoffs to make as it renders vector graphics
 * elements such as <path> elements and basic shapes such as circles and
 * rectangles.
 *
 * **Syntax:** `auto | optimizeSpeed | crispEdges | geometricPrecision`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/shape-rendering
 */
export function shapeRendering(value: StringValue): Style {
	return createStyle({
		property: "shape-rendering",
		value: String(value),
		description:
			"Provides hints about what tradeoffs to make as it renders vector graphics elements such as <path> elements and basic shapes such as circles and rectangles.",
		syntax: "auto | optimizeSpeed | crispEdges | geometricPrecision",
		browserCompat: ["E79", "FF3", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Paints along the outline of the given graphical element.
 *
 * **Syntax:** `<paint>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke
 */
export function stroke(value: StringValue): Style {
	return createStyle({
		property: "stroke",
		value: String(value),
		description: "Paints along the outline of the given graphical element.",
		syntax: "<paint>",
		browserCompat: ["E15", "FF1.5", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls the pattern of dashes and gaps used to stroke paths.
 *
 * **Syntax:** `none | <dasharray>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-dasharray
 */
export function strokeDasharray(value: StringValue): Style {
	return createStyle({
		property: "stroke-dasharray",
		value: String(value),
		description: "Controls the pattern of dashes and gaps used to stroke paths.",
		syntax: "none | <dasharray>",
		browserCompat: ["E15", "FF1.5", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the distance into the dash pattern to start the dash.
 *
 * **Syntax:** `<length-percentage> | <number>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-dashoffset
 */
export function strokeDashoffset(value: LengthPercentageValue): Style {
	return createStyle({
		property: "stroke-dashoffset",
		value: String(value),
		description: "Specifies the distance into the dash pattern to start the dash.",
		syntax: "<length-percentage> | <number>",
		browserCompat: ["E15", "FF1.5", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the shape to be used at the end of open subpaths when they are
 * stroked.
 *
 * **Syntax:** `butt | round | square`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-linecap
 */
export function strokeLinecap(value: KeywordValue): Style {
	return createStyle({
		property: "stroke-linecap",
		value: String(value),
		description: "Specifies the shape to be used at the end of open subpaths when they are stroked.",
		syntax: "butt | round | square",
		browserCompat: ["E15", "FF1.5", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the shape to be used at the corners of paths or basic shapes when
 * they are stroked.
 *
 * **Syntax:** `miter | miter-clip | round | bevel | arcs`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-linejoin
 */
export function strokeLinejoin(value: KeywordValue): Style {
	return createStyle({
		property: "stroke-linejoin",
		value: String(value),
		description: "Specifies the shape to be used at the corners of paths or basic shapes when they are stroked.",
		syntax: "miter | miter-clip | round | bevel | arcs",
		browserCompat: ["E15", "FF1.5", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * When two line segments meet at a sharp angle and miter joins have been
 * specified for 'stroke-linejoin', it is possible for the miter to extend far
 * beyond the thickness of the line stroking the path.
 *
 * **Syntax:** `<number>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-miterlimit
 */
export function strokeMiterlimit(value: NumberValue): Style {
	return createStyle({
		property: "stroke-miterlimit",
		value: String(value),
		description:
			"When two line segments meet at a sharp angle and miter joins have been specified for 'stroke-linejoin', it is possible for the miter to extend far beyond the thickness of the line stroking the path.",
		syntax: "<number>",
		browserCompat: ["E15", "FF1.5", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the opacity of the painting operation used to stroke the current
 * object.
 *
 * **Syntax:** `<'opacity'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-opacity
 */
export function strokeOpacity(value: StringValue): Style {
	return createStyle({
		property: "stroke-opacity",
		value: String(value),
		description: "Specifies the opacity of the painting operation used to stroke the current object.",
		syntax: "<'opacity'>",
		browserCompat: ["E15", "FF1.5", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the width of the stroke on the current object.
 *
 * **Syntax:** `<length-percentage> | <number>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 1.5 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stroke-width
 */
export function strokeWidth(value: LengthPercentageValue): Style {
	return createStyle({
		property: "stroke-width",
		value: String(value),
		description: "Specifies the width of the stroke on the current object.",
		syntax: "<length-percentage> | <number>",
		browserCompat: ["E15", "FF1.5", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the width of the tab character (U+0009), in space characters
 * (U+0020), when rendered.
 *
 * **Syntax:** `<integer> | <length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 91 |
 * | FFA | 91 |
 * | Safari | 7 |
 * | SM | 7 |
 * | Chrome | 21 |
 * | CA | 25 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/tab-size
 */
export function tabSize(value: LengthValue): Style {
	return createStyle({
		property: "tab-size",
		value: String(value),
		description: "Determines the width of the tab character (U+0009), in space characters (U+0020), when rendered.",
		syntax: "<integer> | <length>",
		browserCompat: ["E79", "FF91", "FFA91", "S7", "SM7", "C21", "CA25", "O15"],
		baseline: { status: "high", baseline_low_date: "2021-08-10", baseline_high_date: "2024-02-10" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls the algorithm used to lay out the table cells, rows, and columns.
 *
 * **Syntax:** `auto | fixed`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 3 |
 * | Chrome | 14 |
 * | CA | 18 |
 * | IE | 5 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/table-layout
 */
export function tableLayout(value: KeywordValue): Style {
	return createStyle({
		property: "table-layout",
		value: String(value),
		description: "Controls the algorithm used to lay out the table cells, rows, and columns.",
		syntax: "auto | fixed",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM3", "C14", "CA18", "IE5", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes how inline contents of a block are horizontally aligned if the
 * contents do not completely fill the line box.
 *
 * **Syntax:** `start | end | left | right | center | justify | match-parent`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-align
 */
export function textAlign(value: KeywordValue): Style {
	return createStyle({
		property: "text-align",
		value: String(value),
		description:
			"Describes how inline contents of a block are horizontally aligned if the contents do not completely fill the line box.",
		syntax: "start | end | left | right | center | justify | match-parent",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes how the last line of a block or a line right before a forced line
 * break is aligned when 'text-align' is set to 'justify'.
 *
 * **Syntax:** `auto | start | end | left | right | center | justify`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 49 |
 * | FFA | 49 |
 * | Safari | 16 |
 * | SM | 16 |
 * | Chrome | 47 |
 * | CA | 47 |
 * | IE | 5.5 |
 * | Opera | 34 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-align-last
 */
export function textAlignLast(value: KeywordValue): Style {
	return createStyle({
		property: "text-align-last",
		value: String(value),
		description:
			"Describes how the last line of a block or a line right before a forced line break is aligned when 'text-align' is set to 'justify'.",
		syntax: "auto | start | end | left | right | center | justify",
		browserCompat: ["E12", "FF49", "FFA49", "S16", "SM16", "C47", "CA47", "IE5.5", "O34"],
		baseline: { status: "high", baseline_low_date: "2022-09-12", baseline_high_date: "2025-03-12" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Used to align (start-, middle- or end-alignment) a string of text relative to
 * a given point.
 *
 * **Syntax:** `start | middle | end`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 14 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-anchor
 */
export function textAnchor(value: KeywordValue): Style {
	return createStyle({
		property: "text-anchor",
		value: String(value),
		description: "Used to align (start-, middle- or end-alignment) a string of text relative to a given point.",
		syntax: "start | middle | end",
		browserCompat: ["E14", "FF3", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2016-08-02", baseline_high_date: "2019-02-02" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-combine-upright CSS property specifies the combination of multiple
 * characters into the space of a single character. If the combined text is wider
 * than 1em, the user agent must fit the contents within 1em. The resulting
 * composition is treated as a single upright glyph for layout and decoration.
 * This property only has an effect in vertical writing modes.

This is used to
 * produce an effect that is known as tate-chū-yoko (縦中横) in Japanese, or as 直書橫向
 * in Chinese.
 *
 * **Syntax:** `none | all | [ digits <integer>? ]`
 *
 * **Browser Support:**
 * 
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 48 |
 * | FFA | 48 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 48 |
 * | CA | 48 |
 * | IE | 11 |
 * | Opera | 35 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-combine-upright
 */
export function textCombineUpright(value: IntegerValue): Style {
	return createStyle({
		property: "text-combine-upright",
		value: String(value),
		description:
			"The text-combine-upright CSS property specifies the combination of multiple characters into the space of a single character. If the combined text is wider than 1em, the user agent must fit the contents within 1em. The resulting composition is treated as a single upright glyph for layout and decoration. This property only has an effect in vertical writing modes.\n\nThis is used to produce an effect that is known as tate-chū-yoko (縦中横) in Japanese, or as 直書橫向 in Chinese.",
		syntax: "none | all | [ digits <integer>? ]",
		browserCompat: ["E79", "FF48", "FFA48", "S15.4", "SM15.4", "C48", "CA48", "IE11", "O35"],
		baseline: { status: "high", baseline_low_date: "2022-03-14", baseline_high_date: "2024-09-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Decorations applied to font used for an element's text.
 *
 * **Syntax:** `<'text-decoration-line'> || <'text-decoration-style'> || <'text-decoration-color'> || <'text-decoration-thickness'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration
 */
export function textDecoration(value: StringValue): Style {
	return createStyle({
		property: "text-decoration",
		value: String(value),
		description: "Decorations applied to font used for an element's text.",
		syntax:
			"<'text-decoration-line'> || <'text-decoration-style'> || <'text-decoration-color'> || <'text-decoration-thickness'>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the color of text decoration (underlines overlines, and
 * line-throughs) set on the element with text-decoration-line.
 *
 * **Syntax:** `<color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 36 |
 * | FFA | 36 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-color
 */
export function textDecorationColor(value: ColorValue): Style {
	return createStyle({
		property: "text-decoration-color",
		value: String(value),
		description:
			"Specifies the color of text decoration (underlines overlines, and line-throughs) set on the element with text-decoration-line.",
		syntax: "<color>",
		browserCompat: ["E79", "FF36", "FFA36", "S12.1", "SM12.2", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies what line decorations, if any, are added to the element.
 *
 * **Syntax:** `none | [ underline || overline || line-through || blink ] | spelling-error | grammar-error`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 36 |
 * | FFA | 36 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-line
 */
export function textDecorationLine(value: StringValue): Style {
	return createStyle({
		property: "text-decoration-line",
		value: String(value),
		description: "Specifies what line decorations, if any, are added to the element.",
		syntax: "none | [ underline || overline || line-through || blink ] | spelling-error | grammar-error",
		browserCompat: ["E79", "FF36", "FFA36", "S12.1", "SM12.2", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-decoration-skip CSS property specifies what parts of the element’s
 * content any text decoration affecting the element must skip over. It controls
 * all text decoration lines drawn by the element and also any text decoration
 * lines drawn by its ancestors.
 *
 * **Syntax:** `none | [ objects || [ spaces | [ leading-spaces || trailing-spaces ] ] || edges || box-decoration ]`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Opera | 44 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-skip
 */
export function textDecorationSkip(value: StringValue): Style {
	return createStyle({
		property: "text-decoration-skip",
		value: String(value),
		description:
			"The text-decoration-skip CSS property specifies what parts of the element’s content any text decoration affecting the element must skip over. It controls all text decoration lines drawn by the element and also any text decoration lines drawn by its ancestors.",
		syntax: "none | [ objects || [ spaces | [ leading-spaces || trailing-spaces ] ] || edges || box-decoration ]",
		browserCompat: ["S12.1", "SM12.2", "O44"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-decoration-skip-ink CSS property specifies how overlines and
 * underlines are drawn when they pass over glyph ascenders and descenders.
 *
 * **Syntax:** `auto | all | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 70 |
 * | FFA | 79 |
 * | Safari | 15.4 |
 * | SM | 15.4 |
 * | Chrome | 64 |
 * | CA | 64 |
 * | Opera | 50 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-skip-ink
 */
export function textDecorationSkipInk(value: KeywordValue): Style {
	return createStyle({
		property: "text-decoration-skip-ink",
		value: String(value),
		description:
			"The text-decoration-skip-ink CSS property specifies how overlines and underlines are drawn when they pass over glyph ascenders and descenders.",
		syntax: "auto | all | none",
		browserCompat: ["E79", "FF70", "FFA79", "S15.4", "SM15.4", "C64", "CA64", "O50"],
		baseline: { status: "high", baseline_low_date: "2022-03-14", baseline_high_date: "2024-09-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the line style for underline, line-through and overline text
 * decoration.
 *
 * **Syntax:** `solid | double | dotted | dashed | wavy`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 36 |
 * | FFA | 36 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 57 |
 * | CA | 57 |
 * | Opera | 44 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-style
 */
export function textDecorationStyle(value: KeywordValue): Style {
	return createStyle({
		property: "text-decoration-style",
		value: String(value),
		description: "Specifies the line style for underline, line-through and overline text decoration.",
		syntax: "solid | double | dotted | dashed | wavy",
		browserCompat: ["E79", "FF36", "FFA36", "S12.1", "SM12.2", "C57", "CA57", "O44"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-decoration-thickness CSS property sets the thickness, or width, of
 * the decoration line that is used on text in an element, such as a
 * line-through, underline, or overline.
 *
 * **Syntax:** `auto | from-font | <length> | <percentage> `
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 89 |
 * | Firefox | 70 |
 * | FFA | 79 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 89 |
 * | CA | 89 |
 * | Opera | 75 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-decoration-thickness
 */
export function textDecorationThickness(value: LengthValue): Style {
	return createStyle({
		property: "text-decoration-thickness",
		value: String(value),
		description:
			"The text-decoration-thickness CSS property sets the thickness, or width, of the decoration line that is used on text in an element, such as a line-through, underline, or overline.",
		syntax: "auto | from-font | <length> | <percentage> ",
		browserCompat: ["E89", "FF70", "FFA79", "S12.1", "SM12.2", "C89", "CA89", "O75"],
		baseline: { status: "high", baseline_low_date: "2021-03-04", baseline_high_date: "2023-09-04" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-emphasis CSS property is a shorthand property for setting
 * text-emphasis-style and text-emphasis-color in one declaration. This property
 * will apply the specified emphasis mark to each character of the element's
 * text, except separator characters, like spaces,  and control characters.
 *
 * **Syntax:** `<'text-emphasis-style'> || <'text-emphasis-color'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 99 |
 * | Firefox | 46 |
 * | FFA | 46 |
 * | Safari | 7 |
 * | SM | 7 |
 * | Chrome | 99 |
 * | CA | 99 |
 * | Opera | 85 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis
 */
export function textEmphasis(value: StringValue): Style {
	return createStyle({
		property: "text-emphasis",
		value: String(value),
		description:
			"The text-emphasis CSS property is a shorthand property for setting text-emphasis-style and text-emphasis-color in one declaration. This property will apply the specified emphasis mark to each character of the element's text, except separator characters, like spaces,  and control characters.",
		syntax: "<'text-emphasis-style'> || <'text-emphasis-color'>",
		browserCompat: ["E99", "FF46", "FFA46", "S7", "SM7", "C99", "CA99", "O85"],
		baseline: { status: "high", baseline_low_date: "2022-03-03", baseline_high_date: "2024-09-03" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-emphasis-color CSS property defines the color used to draw emphasis
 * marks on text being rendered in the HTML document. This value can also be set
 * and reset using the text-emphasis shorthand.
 *
 * **Syntax:** `<color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 99 |
 * | Firefox | 46 |
 * | FFA | 46 |
 * | Safari | 7 |
 * | SM | 7 |
 * | Chrome | 99 |
 * | CA | 99 |
 * | Opera | 85 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis-color
 */
export function textEmphasisColor(value: ColorValue): Style {
	return createStyle({
		property: "text-emphasis-color",
		value: String(value),
		description:
			"The text-emphasis-color CSS property defines the color used to draw emphasis marks on text being rendered in the HTML document. This value can also be set and reset using the text-emphasis shorthand.",
		syntax: "<color>",
		browserCompat: ["E99", "FF46", "FFA46", "S7", "SM7", "C99", "CA99", "O85"],
		baseline: { status: "high", baseline_low_date: "2022-03-03", baseline_high_date: "2024-09-03" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-emphasis-position CSS property describes where emphasis marks are
 * drawn at. The effect of emphasis marks on the line height is the same as for
 * ruby text: if there isn't enough place, the line height is increased.
 *
 * **Syntax:** `auto | [ over | under ] && [ right | left ]?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 99 |
 * | Firefox | 46 |
 * | FFA | 46 |
 * | Safari | 7 |
 * | SM | 7 |
 * | Chrome | 99 |
 * | CA | 99 |
 * | Opera | 85 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis-position
 */
export function textEmphasisPosition(value: StringValue): Style {
	return createStyle({
		property: "text-emphasis-position",
		value: String(value),
		description:
			"The text-emphasis-position CSS property describes where emphasis marks are drawn at. The effect of emphasis marks on the line height is the same as for ruby text: if there isn't enough place, the line height is increased.",
		syntax: "auto | [ over | under ] && [ right | left ]?",
		browserCompat: ["E99", "FF46", "FFA46", "S7", "SM7", "C99", "CA99", "O85"],
		baseline: { status: "high", baseline_low_date: "2022-03-03", baseline_high_date: "2024-09-03" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-emphasis-style CSS property defines the type of emphasis used. It can
 * also be set, and reset, using the text-emphasis shorthand.
 *
 * **Syntax:** `none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 99 |
 * | Firefox | 46 |
 * | FFA | 46 |
 * | Safari | 7 |
 * | SM | 7 |
 * | Chrome | 99 |
 * | CA | 99 |
 * | Opera | 85 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-emphasis-style
 */
export function textEmphasisStyle(value: StringValue): Style {
	return createStyle({
		property: "text-emphasis-style",
		value: String(value),
		description:
			"The text-emphasis-style CSS property defines the type of emphasis used. It can also be set, and reset, using the text-emphasis shorthand.",
		syntax: "none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>",
		browserCompat: ["E99", "FF46", "FFA46", "S7", "SM7", "C99", "CA99", "O85"],
		baseline: { status: "high", baseline_low_date: "2022-03-03", baseline_high_date: "2024-09-03" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the indentation applied to lines of inline content in a block. The
 * indentation only affects the first line of inline content in the block unless
 * the 'hanging' keyword is specified, in which case it affects all lines except
 * the first.
 *
 * **Syntax:** `<length-percentage> && hanging? && each-line?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 3 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-indent
 */
export function textIndent(value: LengthPercentageValue): Style {
	return createStyle({
		property: "text-indent",
		value: String(value),
		description:
			"Specifies the indentation applied to lines of inline content in a block. The indentation only affects the first line of inline content in the block unless the 'hanging' keyword is specified, in which case it affects all lines except the first.",
		syntax: "<length-percentage> && hanging? && each-line?",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE3", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Selects the justification algorithm used when 'text-align' is set to
 * 'justify'. The property applies to block containers, but the UA may (but is
 * not required to) also support it on inline elements.
 *
 * **Syntax:** `auto | inter-character | inter-word | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 55 |
 * | FFA | 55 |
 * | IE | 11 |
 * | Opera | 19 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-justify
 */
export function textJustify(value: KeywordValue): Style {
	return createStyle({
		property: "text-justify",
		value: String(value),
		description:
			"Selects the justification algorithm used when 'text-align' is set to 'justify'. The property applies to block containers, but the UA may (but is not required to) also support it on inline elements.",
		syntax: "auto | inter-character | inter-word | none",
		browserCompat: ["FF55", "FFA55", "IE11", "O19"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the orientation of text within a line.
 *
 * **Syntax:** `mixed | upright | sideways`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 14 |
 * | SM | 14 |
 * | Chrome | 48 |
 * | CA | 48 |
 * | Opera | 35 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-orientation
 */
export function textOrientation(value: KeywordValue): Style {
	return createStyle({
		property: "text-orientation",
		value: String(value),
		description: "Specifies the orientation of text within a line.",
		syntax: "mixed | upright | sideways",
		browserCompat: ["E79", "FF41", "FFA41", "S14", "SM14", "C48", "CA48", "O35"],
		baseline: { status: "high", baseline_low_date: "2020-09-16", baseline_high_date: "2023-03-16" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Text can overflow for example when it is prevented from wrapping.
 *
 * **Syntax:** `[ clip | ellipsis | <string> ]{1,2}`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 7 |
 * | FFA | 7 |
 * | Safari | 1.3 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 6 |
 * | Opera | 11 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-overflow
 */
export function textOverflow(value: StringValue): Style {
	return createStyle({
		property: "text-overflow",
		value: String(value),
		description: "Text can overflow for example when it is prevented from wrapping.",
		syntax: "[ clip | ellipsis | <string> ]{1,2}",
		browserCompat: ["E12", "FF7", "FFA7", "S1.3", "SM1", "C1", "CA18", "IE6", "O11"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The creator of SVG content might want to provide a hint to the implementation
 * about what tradeoffs to make as it renders text. The 'text-rendering' property
 * provides these hints.
 *
 * **Syntax:** `auto | optimizeSpeed | optimizeLegibility | geometricPrecision`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 1 |
 * | FFA | 46 |
 * | Safari | 5 |
 * | SM | 4.2 |
 * | Chrome | 4 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-rendering
 */
export function textRendering(value: StringValue): Style {
	return createStyle({
		property: "text-rendering",
		value: String(value),
		description:
			"The creator of SVG content might want to provide a hint to the implementation about what tradeoffs to make as it renders text. The 'text-rendering' property provides these hints.",
		syntax: "auto | optimizeSpeed | optimizeLegibility | geometricPrecision",
		browserCompat: ["E79", "FF1", "FFA46", "S5", "SM4.2", "C4", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Enables shadow effects to be applied to the text of the element.
 *
 * **Syntax:** `none | <shadow-t>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 3.5 |
 * | FFA | 4 |
 * | Safari | 1.1 |
 * | SM | 1 |
 * | Chrome | 2 |
 * | CA | 18 |
 * | IE | 10 |
 * | Opera | 9.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-shadow
 */
export function textShadow(value: StringValue): Style {
	return createStyle({
		property: "text-shadow",
		value: String(value),
		description: "Enables shadow effects to be applied to the text of the element.",
		syntax: "none | <shadow-t>#",
		browserCompat: ["E12", "FF3.5", "FFA4", "S1.1", "SM1", "C2", "CA18", "IE10", "O9.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-size-adjust CSS property controls the text inflation algorithm used
 * on some smartphones and tablets. Other browsers will ignore this property.
 *
 * **Syntax:** `none | auto | <percentage>`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Chrome | 54 |
 * | CA | 54 |
 * | Opera | 41 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-size-adjust
 */
export function textSizeAdjust(value: PercentageValue): Style {
	return createStyle({
		property: "text-size-adjust",
		value: String(value),
		description:
			"The text-size-adjust CSS property controls the text inflation algorithm used on some smartphones and tablets. Other browsers will ignore this property.",
		syntax: "none | auto | <percentage>",
		browserCompat: ["E79", "C54", "CA54", "O41"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-spacing-trim CSS property controls the internal spacing set on
 * Chinese/Japanese/Korean (CJK) punctuation characters between adjacent
 * characters (kerning) and at the start or end of text lines.
 *
 * **Syntax:** `space-all | normal | space-first | trim-start`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 123 |
 * | Chrome | 123 |
 * | CA | 123 |
 * | Opera | 109 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-spacing-trim
 */
export function textSpacingTrim(value: KeywordValue): Style {
	return createStyle({
		property: "text-spacing-trim",
		value: String(value),
		description:
			"The text-spacing-trim CSS property controls the internal spacing set on Chinese/Japanese/Korean (CJK) punctuation characters between adjacent characters (kerning) and at the start or end of text lines.",
		syntax: "space-all | normal | space-first | trim-start",
		browserCompat: ["E123", "C123", "CA123", "O109"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls capitalization effects of an element's text.
 *
 * **Syntax:** `none | [ capitalize | uppercase | lowercase ] || full-width || full-size-kana | math-auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 7 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-transform
 */
export function textTransform(value: StringValue): Style {
	return createStyle({
		property: "text-transform",
		value: String(value),
		description: "Controls capitalization effects of an element's text.",
		syntax: "none | [ capitalize | uppercase | lowercase ] || full-width || full-size-kana | math-auto",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O7"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-underline-offset CSS property sets the offset distance of an
 * underline text decoration line (applied using text-decoration) from its
 * original position.
 *
 * **Syntax:** `auto | <length> | <percentage> `
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 87 |
 * | Firefox | 70 |
 * | FFA | 79 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 87 |
 * | CA | 87 |
 * | Opera | 73 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-underline-offset
 */
export function textUnderlineOffset(value: LengthValue): Style {
	return createStyle({
		property: "text-underline-offset",
		value: String(value),
		description:
			"The text-underline-offset CSS property sets the offset distance of an underline text decoration line (applied using text-decoration) from its original position.",
		syntax: "auto | <length> | <percentage> ",
		browserCompat: ["E87", "FF70", "FFA79", "S12.1", "SM12.2", "C87", "CA87", "O73"],
		baseline: { status: "high", baseline_low_date: "2020-11-19", baseline_high_date: "2023-05-19" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Sets the position of an underline specified on the same element: it does not
 * affect underlines specified by ancestor elements. This property is typically
 * used in vertical writing contexts such as in Japanese documents where it often
 * desired to have the underline appear 'over' (to the right of) the affected run
 * of text
 *
 * **Syntax:** `auto | from-font | [ under || [ left | right ] ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 74 |
 * | FFA | 79 |
 * | Safari | 12.1 |
 * | SM | 12.2 |
 * | Chrome | 33 |
 * | CA | 33 |
 * | IE | 6 |
 * | Opera | 20 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-underline-position
 */
export function textUnderlinePosition(value: StringValue): Style {
	return createStyle({
		property: "text-underline-position",
		value: String(value),
		description:
			"Sets the position of an underline specified on the same element: it does not affect underlines specified by ancestor elements. This property is typically used in vertical writing contexts such as in Japanese documents where it often desired to have the underline appear 'over' (to the right of) the affected run of text",
		syntax: "auto | from-font | [ under || [ left | right ] ]",
		browserCompat: ["E12", "FF74", "FFA79", "S12.1", "SM12.2", "C33", "CA33", "IE6", "O20"],
		baseline: { status: "high", baseline_low_date: "2020-07-28", baseline_high_date: "2023-01-28" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-wrap CSS property controls how text inside an element is wrapped.
 *
 * **Syntax:** `<'text-wrap-mode'> || <'text-wrap-style'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 114 |
 * | Firefox | 121 |
 * | FFA | 121 |
 * | Safari | 17.4 |
 * | SM | 17.4 |
 * | Chrome | 114 |
 * | CA | 114 |
 * | Opera | 100 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-wrap
 */
export function textWrap(value: StringValue): Style {
	return createStyle({
		property: "text-wrap",
		value: String(value),
		description: "The text-wrap CSS property controls how text inside an element is wrapped.",
		syntax: "<'text-wrap-mode'> || <'text-wrap-style'>",
		browserCompat: ["E114", "FF121", "FFA121", "S17.4", "SM17.4", "C114", "CA114", "O100"],
		baseline: { status: "low", baseline_low_date: "2024-03-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-wrap-mode CSS property controls whether the text inside an element is
 * wrapped. The different values provide alternate ways of wrapping the content
 * of a block element. It can also be set, and reset, using the
 * {{CSSXRef("text-wrap")}} shorthand.
 *
 * **Syntax:** `wrap | nowrap`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 130 |
 * | Firefox | 124 |
 * | FFA | 124 |
 * | Safari | 17.4 |
 * | SM | 17.4 |
 * | Chrome | 130 |
 * | CA | 130 |
 * | Opera | 115 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-wrap-mode
 */
export function textWrapMode(value: KeywordValue): Style {
	return createStyle({
		property: "text-wrap-mode",
		value: String(value),
		description:
			'The text-wrap-mode CSS property controls whether the text inside an element is wrapped. The different values provide alternate ways of wrapping the content of a block element. It can also be set, and reset, using the {{CSSXRef("text-wrap")}} shorthand.',
		syntax: "wrap | nowrap",
		browserCompat: ["E130", "FF124", "FFA124", "S17.4", "SM17.4", "C130", "CA130", "O115"],
		baseline: { status: "low", baseline_low_date: "2024-10-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-wrap-style CSS property controls how text inside an element is
 * wrapped. The different values provide alternate ways of wrapping the content
 * of a block element. It can also be set, and reset, using the
 * {{CSSXRef("text-wrap")}} shorthand.
 *
 * **Syntax:** `auto | balance | stable | pretty`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 130 |
 * | Firefox | 124 |
 * | FFA | 124 |
 * | Safari | 17.5 |
 * | SM | 17.5 |
 * | Chrome | 130 |
 * | CA | 130 |
 * | Opera | 115 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-wrap-style
 */
export function textWrapStyle(value: KeywordValue): Style {
	return createStyle({
		property: "text-wrap-style",
		value: String(value),
		description:
			'The text-wrap-style CSS property controls how text inside an element is wrapped. The different values provide alternate ways of wrapping the content of a block element. It can also be set, and reset, using the {{CSSXRef("text-wrap")}} shorthand.',
		syntax: "auto | balance | stable | pretty",
		browserCompat: ["E130", "FF124", "FFA124", "S17.5", "SM17.5", "C130", "CA130", "O115"],
		baseline: { status: "low", baseline_low_date: "2024-10-17" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The timeline-scope CSS property modifies the scope of a named animation
 * timeline.
 *
 * **Syntax:** `none | <dashed-ident>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 116 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 116 |
 * | CA | 116 |
 * | Opera | 102 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-scope
 */
export function timelineScope(value: DashedIdentValue): Style {
	return createStyle({
		property: "timeline-scope",
		value: String(value),
		description: "The timeline-scope CSS property modifies the scope of a named animation timeline.",
		syntax: "none | <dashed-ident>#",
		browserCompat: ["E116", "S26", "SM26", "C116", "CA116", "O102"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how far an absolutely positioned box's top margin edge is offset
 * below the top edge of the box's 'containing block'.
 *
 * **Syntax:** `auto | <length-percentage> | <anchor()> | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5 |
 * | Opera | 6 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/top
 */
export function top(value: LengthPercentageValue): Style {
	return createStyle({
		property: "top",
		value: String(value),
		description:
			"Specifies how far an absolutely positioned box's top margin edge is offset below the top edge of the box's 'containing block'.",
		syntax: "auto | <length-percentage> | <anchor()> | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE5", "O6"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines whether touch input may trigger default behavior supplied by user
 * agent.
 *
 * **Syntax:** `auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 52 |
 * | FFA | 52 |
 * | Safari | 13 |
 * | SM | 9.3 |
 * | Chrome | 36 |
 * | CA | 36 |
 * | IE | 11 |
 * | Opera | 23 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/touch-action
 */
export function touchAction(value: StringValue): Style {
	return createStyle({
		property: "touch-action",
		value: String(value),
		description: "Determines whether touch input may trigger default behavior supplied by user agent.",
		syntax:
			"auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation",
		browserCompat: ["E12", "FF52", "FFA52", "S13", "SM9.3", "C36", "CA36", "IE11", "O23"],
		baseline: { status: "high", baseline_low_date: "2019-09-19", baseline_high_date: "2022-03-19" },
		ast: createValueAST(String(value)),
	});
}

/**
 * A two-dimensional transformation is applied to an element through the
 * 'transform' property. This property contains a list of transform functions
 * similar to those allowed by SVG.
 *
 * **Syntax:** `none | <transform-list>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 36 |
 * | CA | 36 |
 * | IE | 10 |
 * | Opera | 23 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform
 */
export function transform(value: TransformListValue): Style {
	return createStyle({
		property: "transform",
		value: String(value),
		description:
			"A two-dimensional transformation is applied to an element through the 'transform' property. This property contains a list of transform functions similar to those allowed by SVG.",
		syntax: "none | <transform-list>",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C36", "CA36", "IE10", "O23"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The transform-box CSS property defines the layout box to which the transform
 * and transform-origin properties relate.
 *
 * **Syntax:** `content-box | border-box | fill-box | stroke-box | view-box`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 55 |
 * | FFA | 55 |
 * | Safari | 11 |
 * | SM | 11 |
 * | Chrome | 64 |
 * | CA | 64 |
 * | Opera | 51 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform-box
 */
export function transformBox(value: KeywordValue): Style {
	return createStyle({
		property: "transform-box",
		value: String(value),
		description:
			"The transform-box CSS property defines the layout box to which the transform and transform-origin properties relate.",
		syntax: "content-box | border-box | fill-box | stroke-box | view-box",
		browserCompat: ["E79", "FF55", "FFA55", "S11", "SM11", "C64", "CA64", "O51"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Establishes the origin of transformation for an element.
 *
 * **Syntax:** `[ <length-percentage> | left | center | right | top | bottom ] | [ [ <length-percentage> | left | center | right ] && [ <length-percentage> | top | center | bottom ] ] <length>?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 36 |
 * | CA | 36 |
 * | IE | 10 |
 * | Opera | 23 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform-origin
 */
export function transformOrigin(value: LengthValue): Style {
	return createStyle({
		property: "transform-origin",
		value: String(value),
		description: "Establishes the origin of transformation for an element.",
		syntax:
			"[ <length-percentage> | left | center | right | top | bottom ] | [ [ <length-percentage> | left | center | right ] && [ <length-percentage> | top | center | bottom ] ] <length>?",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C36", "CA36", "IE10", "O23"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines how nested elements are rendered in 3D space.
 *
 * **Syntax:** `flat | preserve-3d`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 36 |
 * | CA | 36 |
 * | Opera | 23 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transform-style
 */
export function transformStyle(value: StringValue): Style {
	return createStyle({
		property: "transform-style",
		value: String(value),
		description: "Defines how nested elements are rendered in 3D space.",
		syntax: "flat | preserve-3d",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C36", "CA36", "O23"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property combines four of the transition properties into a single
 * property.
 *
 * **Syntax:** `<single-transition>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 26 |
 * | CA | 26 |
 * | IE | 10 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition
 */
export function transition(value: StringValue): Style {
	return createStyle({
		property: "transition",
		value: String(value),
		description: "Shorthand property combines four of the transition properties into a single property.",
		syntax: "<single-transition>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C26", "CA26", "IE10", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The transition-behavior CSS property specifies whether transitions will be
 * started for properties whose animation behavior is discrete.
 *
 * **Syntax:** `<transition-behavior-value>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 117 |
 * | Firefox | 129 |
 * | FFA | 129 |
 * | Safari | 17.4 |
 * | SM | 17.4 |
 * | Chrome | 117 |
 * | CA | 117 |
 * | Opera | 103 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-behavior
 */
export function transitionBehavior(value: StringValue): Style {
	return createStyle({
		property: "transition-behavior",
		value: String(value),
		description:
			"The transition-behavior CSS property specifies whether transitions will be started for properties whose animation behavior is discrete.",
		syntax: "<transition-behavior-value>#",
		browserCompat: ["E117", "FF129", "FFA129", "S17.4", "SM17.4", "C117", "CA117", "O103"],
		baseline: { status: "low", baseline_low_date: "2024-08-06" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines when the transition will start. It allows a transition to begin
 * execution some period of time from when it is applied.
 *
 * **Syntax:** `<time>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 26 |
 * | CA | 26 |
 * | IE | 10 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-delay
 */
export function transitionDelay(value: TimeValue): Style {
	return createStyle({
		property: "transition-delay",
		value: String(value),
		description:
			"Defines when the transition will start. It allows a transition to begin execution some period of time from when it is applied.",
		syntax: "<time>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C26", "CA26", "IE10", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how long the transition from the old value to the new value should
 * take.
 *
 * **Syntax:** `<time>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 26 |
 * | CA | 26 |
 * | IE | 10 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-duration
 */
export function transitionDuration(value: TimeValue): Style {
	return createStyle({
		property: "transition-duration",
		value: String(value),
		description: "Specifies how long the transition from the old value to the new value should take.",
		syntax: "<time>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C26", "CA26", "IE10", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the name of the CSS property to which the transition is applied.
 *
 * **Syntax:** `none | <single-transition-property>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 26 |
 * | CA | 26 |
 * | IE | 10 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-property
 */
export function transitionProperty(value: StringValue): Style {
	return createStyle({
		property: "transition-property",
		value: String(value),
		description: "Specifies the name of the CSS property to which the transition is applied.",
		syntax: "none | <single-transition-property>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C26", "CA26", "IE10", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes how the intermediate values used during a transition will be
 * calculated.
 *
 * **Syntax:** `<easing-function>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 16 |
 * | FFA | 16 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 26 |
 * | CA | 26 |
 * | IE | 10 |
 * | Opera | 12.1 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/transition-timing-function
 */
export function transitionTimingFunction(value: StringValue): Style {
	return createStyle({
		property: "transition-timing-function",
		value: String(value),
		description: "Describes how the intermediate values used during a transition will be calculated.",
		syntax: "<easing-function>#",
		browserCompat: ["E12", "FF16", "FFA16", "S9", "SM9", "C26", "CA26", "IE10", "O12.1"],
		baseline: { status: "high", baseline_low_date: "2015-09-30", baseline_high_date: "2018-03-30" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The translate CSS property allows you to specify translation transforms
 * individually and independently of the transform property. This maps better to
 * typical user interface usage, and saves having to remember the exact order of
 * transform functions to specify in the transform value.
 *
 * **Syntax:** `none | <length-percentage> [ <length-percentage> <length>? ]?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 104 |
 * | Firefox | 72 |
 * | FFA | 79 |
 * | Safari | 14.1 |
 * | SM | 14.5 |
 * | Chrome | 104 |
 * | CA | 104 |
 * | Opera | 90 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/translate
 */
export function translate(value: LengthValue): Style {
	return createStyle({
		property: "translate",
		value: String(value),
		description:
			"The translate CSS property allows you to specify translation transforms individually and independently of the transform property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the transform value.",
		syntax: "none | <length-percentage> [ <length-percentage> <length>? ]?",
		browserCompat: ["E104", "FF72", "FFA79", "S14.1", "SM14.5", "C104", "CA104", "O90"],
		baseline: { status: "high", baseline_low_date: "2022-08-05", baseline_high_date: "2025-02-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The level of embedding with respect to the bidirectional algorithm.
 *
 * **Syntax:** `normal | embed | isolate | bidi-override | isolate-override | plaintext`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1.3 |
 * | SM | 1 |
 * | Chrome | 2 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/unicode-bidi
 */
export function unicodeBidi(value: KeywordValue): Style {
	return createStyle({
		property: "unicode-bidi",
		value: String(value),
		description: "The level of embedding with respect to the bidirectional algorithm.",
		syntax: "normal | embed | isolate | bidi-override | isolate-override | plaintext",
		browserCompat: ["E12", "FF1", "FFA4", "S1.3", "SM1", "C2", "CA18", "IE5.5", "O9.2"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls the appearance of selection.
 *
 * **Syntax:** `auto | text | none | all`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Chrome | 54 |
 * | CA | 54 |
 * | IE | 10 |
 * | Opera | 41 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/user-select
 */
export function userSelect(value: KeywordValue): Style {
	return createStyle({
		property: "user-select",
		value: String(value),
		description: "Controls the appearance of selection.",
		syntax: "auto | text | none | all",
		browserCompat: ["E79", "FF69", "FFA79", "C54", "CA54", "IE10", "O41"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The vector-effect CSS property suppresses specific transformation effects in
 * SVG, thus permitting effects like a road on a map staying the same width no
 * matter how the map is zoomed, or allowing a diagram key to retain its position
 * and size regardless of other transforms. It can only be used with SVG elements
 * that accept the vector-effect attribute. When used, the CSS value overrides
 * any values of the element's vector-effect attribute.
 *
 * **Syntax:** `none | non-scaling-stroke | non-scaling-size | non-rotation | fixed-position`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 15 |
 * | FFA | 15 |
 * | Safari | 5.1 |
 * | SM | 5 |
 * | Chrome | 6 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/vector-effect
 */
export function vectorEffect(value: KeywordValue): Style {
	return createStyle({
		property: "vector-effect",
		value: String(value),
		description:
			"The vector-effect CSS property suppresses specific transformation effects in SVG, thus permitting effects like a road on a map staying the same width no matter how the map is zoomed, or allowing a diagram key to retain its position and size regardless of other transforms. It can only be used with SVG elements that accept the vector-effect attribute. When used, the CSS value overrides any values of the element's vector-effect attribute.",
		syntax: "none | non-scaling-stroke | non-scaling-size | non-rotation | fixed-position",
		browserCompat: ["E79", "FF15", "FFA15", "S5.1", "SM5", "C6", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Affects the vertical positioning of the inline boxes generated by an
 * inline-level element inside a line box.
 *
 * **Syntax:** `baseline | sub | super | text-top | text-bottom | middle | top | bottom | <percentage> | <length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/vertical-align
 */
export function verticalAlign(value: LengthValue): Style {
	return createStyle({
		property: "vertical-align",
		value: String(value),
		description:
			"Affects the vertical positioning of the inline boxes generated by an inline-level element inside a line box.",
		syntax: "baseline | sub | super | text-top | text-bottom | middle | top | bottom | <percentage> | <length>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The view-timeline CSS shorthand property is used to define a named view
 * progress timeline, which is progressed through based on the change in
 * visibility of an element (known as the subject) inside a scrollable element
 * (scroller). view-timeline is set on the subject.
 *
 * **Syntax:** `[ <'view-timeline-name'> [ <'view-timeline-axis'> || <'view-timeline-inset'> ]? ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline
 */
export function viewTimeline(value: StringValue): Style {
	return createStyle({
		property: "view-timeline",
		value: String(value),
		description:
			"The view-timeline CSS shorthand property is used to define a named view progress timeline, which is progressed through based on the change in visibility of an element (known as the subject) inside a scrollable element (scroller). view-timeline is set on the subject.",
		syntax: "[ <'view-timeline-name'> [ <'view-timeline-axis'> || <'view-timeline-inset'> ]? ]#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The view-timeline-axis CSS property is used to specify the scrollbar direction
 * that will be used to provide the timeline for a named view progress timeline
 * animation, which is progressed through based on the change in visibility of an
 * element (known as the subject) inside a scrollable element (scroller).
 * view-timeline-axis is set on the subject. See CSS scroll-driven animations for
 * more details.
 *
 * **Syntax:** `[ block | inline | x | y ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline-axis
 */
export function viewTimelineAxis(value: StringValue): Style {
	return createStyle({
		property: "view-timeline-axis",
		value: String(value),
		description:
			"The view-timeline-axis CSS property is used to specify the scrollbar direction that will be used to provide the timeline for a named view progress timeline animation, which is progressed through based on the change in visibility of an element (known as the subject) inside a scrollable element (scroller). view-timeline-axis is set on the subject. See CSS scroll-driven animations for more details.",
		syntax: "[ block | inline | x | y ]#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The view-timeline-inset CSS property is used to specify one or two values
 * representing an adjustment to the position of the scrollport (see Scroll
 * container for more details) in which the subject element of a named view
 * progress timeline animation is deemed to be visible. Put another way, this
 * allows you to specify start and/or end inset (or outset) values that offset
 * the position of the timeline.
 *
 * **Syntax:** `[ [ auto | <length-percentage> ]{1,2} ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline-inset
 */
export function viewTimelineInset(value: LengthPercentageValue): Style {
	return createStyle({
		property: "view-timeline-inset",
		value: String(value),
		description:
			"The view-timeline-inset CSS property is used to specify one or two values representing an adjustment to the position of the scrollport (see Scroll container for more details) in which the subject element of a named view progress timeline animation is deemed to be visible. Put another way, this allows you to specify start and/or end inset (or outset) values that offset the position of the timeline.",
		syntax: "[ [ auto | <length-percentage> ]{1,2} ]#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The view-timeline-name CSS property is used to define the name of a named view
 * progress timeline, which is progressed through based on the change in
 * visibility of an element (known as the subject) inside a scrollable element
 * (scroller). view-timeline is set on the subject.
 *
 * **Syntax:** `[ none | <dashed-ident> ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 115 |
 * | Safari | 26 |
 * | SM | 26 |
 * | Chrome | 115 |
 * | CA | 115 |
 * | Opera | 101 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-timeline-name
 */
export function viewTimelineName(value: DashedIdentValue): Style {
	return createStyle({
		property: "view-timeline-name",
		value: String(value),
		description:
			"The view-timeline-name CSS property is used to define the name of a named view progress timeline, which is progressed through based on the change in visibility of an element (known as the subject) inside a scrollable element (scroller). view-timeline is set on the subject.",
		syntax: "[ none | <dashed-ident> ]#",
		browserCompat: ["E115", "S26", "SM26", "C115", "CA115", "O101"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The view-transition-name CSS property provides the selected element with a
 * distinct identifying name (a custom-ident) and causes it to participate in a
 * separate view transition from the root view transition — or no view transition
 * if the none value is specified.
 *
 * **Syntax:** `none | <custom-ident> | match-element`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 111 |
 * | Firefox | 144 |
 * | FFA | 144 |
 * | Safari | 18 |
 * | SM | 18 |
 * | Chrome | 111 |
 * | CA | 111 |
 * | Opera | 97 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-transition-name
 */
export function viewTransitionName(value: CustomIdentValue): Style {
	return createStyle({
		property: "view-transition-name",
		value: String(value),
		description:
			"The view-transition-name CSS property provides the selected element with a distinct identifying name (a custom-ident) and causes it to participate in a separate view transition from the root view transition — or no view transition if the none value is specified.",
		syntax: "none | <custom-ident> | match-element",
		browserCompat: ["E111", "FF144", "FFA144", "S18", "SM18", "C111", "CA111", "O97"],
		baseline: { status: "low", baseline_low_date: "2025-10-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies whether the boxes generated by an element are rendered. Invisible
 * boxes still affect layout (set the 'display' property to 'none' to suppress
 * box generation altogether).
 *
 * **Syntax:** `visible | hidden | collapse`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/visibility
 */
export function visibility(value: KeywordValue): Style {
	return createStyle({
		property: "visibility",
		value: String(value),
		description:
			"Specifies whether the boxes generated by an element are rendered. Invisible boxes still affect layout (set the 'display' property to 'none' to suppress box generation altogether).",
		syntax: "visible | hidden | collapse",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies how whitespace is handled in an element.
 *
 * **Syntax:** `normal | pre | pre-wrap | pre-line | <'white-space-collapse'> || <'text-wrap-mode'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/white-space
 */
export function whiteSpace(value: StringValue): Style {
	return createStyle({
		property: "white-space",
		value: String(value),
		description: "Specifies how whitespace is handled in an element.",
		syntax: "normal | pre | pre-wrap | pre-line | <'white-space-collapse'> || <'text-wrap-mode'>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE5.5", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The white-space-collapse CSS property controls how white space inside an
 * element is collapsed.
 *
 * **Syntax:** `collapse | preserve | preserve-breaks | preserve-spaces | break-spaces`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 114 |
 * | Firefox | 124 |
 * | FFA | 124 |
 * | Safari | 17.4 |
 * | SM | 17.4 |
 * | Chrome | 114 |
 * | CA | 114 |
 * | Opera | 100 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/white-space-collapse
 */
export function whiteSpaceCollapse(value: KeywordValue): Style {
	return createStyle({
		property: "white-space-collapse",
		value: String(value),
		description: "The white-space-collapse CSS property controls how white space inside an element is collapsed.",
		syntax: "collapse | preserve | preserve-breaks | preserve-spaces | break-spaces",
		browserCompat: ["E114", "FF124", "FFA124", "S17.4", "SM17.4", "C114", "CA114", "O100"],
		baseline: { status: "low", baseline_low_date: "2024-03-19" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the minimum number of line boxes of a block container that must be
 * left in a fragment after a break.
 *
 * **Syntax:** `<integer>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Safari | 1.3 |
 * | SM | 1 |
 * | Chrome | 25 |
 * | CA | 25 |
 * | IE | 8 |
 * | Opera | 9.2 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/widows
 */
export function widows(value: IntegerValue): Style {
	return createStyle({
		property: "widows",
		value: String(value),
		description:
			"Specifies the minimum number of line boxes of a block container that must be left in a fragment after a break.",
		syntax: "<integer>",
		browserCompat: ["E12", "S1.3", "SM1", "C25", "CA25", "IE8", "O9.2"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the width of the content area, padding area or border area
 * (depending on 'box-sizing') of certain boxes.
 *
 * **Syntax:** `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/width
 */
export function width(value: StringValue): Style {
	return createStyle({
		property: "width",
		value: String(value),
		description:
			"Specifies the width of the content area, padding area or border area (depending on 'box-sizing') of certain boxes.",
		syntax:
			"auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Provides a rendering hint to the user agent, stating what kinds of changes the
 * author expects to perform on the element.
 *
 * **Syntax:** `auto | <animateable-feature>#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 36 |
 * | FFA | 36 |
 * | Safari | 9.1 |
 * | SM | 9.3 |
 * | Chrome | 36 |
 * | CA | 36 |
 * | Opera | 23 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/will-change
 */
export function willChange(value: StringValue): Style {
	return createStyle({
		property: "will-change",
		value: String(value),
		description:
			"Provides a rendering hint to the user agent, stating what kinds of changes the author expects to perform on the element.",
		syntax: "auto | <animateable-feature>#",
		browserCompat: ["E79", "FF36", "FFA36", "S9.1", "SM9.3", "C36", "CA36", "O23"],
		baseline: { status: "high", baseline_low_date: "2020-01-15", baseline_high_date: "2022-07-15" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies line break opportunities for non-CJK scripts.
 *
 * **Syntax:** `normal | break-all | keep-all | break-word | auto-phrase`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 15 |
 * | FFA | 15 |
 * | Safari | 3 |
 * | SM | 2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/word-break
 */
export function wordBreak(value: KeywordValue): Style {
	return createStyle({
		property: "word-break",
		value: String(value),
		description: "Specifies line break opportunities for non-CJK scripts.",
		syntax: "normal | break-all | keep-all | break-word | auto-phrase",
		browserCompat: ["E12", "FF15", "FFA15", "S3", "SM2", "C1", "CA18", "IE5.5", "O15"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies additional spacing between "words".
 *
 * **Syntax:** `normal | <length>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 6 |
 * | Opera | 3.5 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/word-spacing
 */
export function wordSpacing(value: LengthValue): Style {
	return createStyle({
		property: "word-spacing",
		value: String(value),
		description: 'Specifies additional spacing between "words".',
		syntax: "normal | <length>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE6", "O3.5"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies whether the UA may break within a word to prevent overflow when an
 * otherwise-unbreakable string is too long to fit.
 *
 * **Syntax:** `normal | break-word`
 */
export function wordWrap(value: KeywordValue): Style {
	return createStyle({
		property: "word-wrap",
		value: String(value),
		description:
			"Specifies whether the UA may break within a word to prevent overflow when an otherwise-unbreakable string is too long to fit.",
		syntax: "normal | break-word",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * This is a shorthand property for both 'direction' and 'block-progression'.
 *
 * **Syntax:** `horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 41 |
 * | FFA | 41 |
 * | Safari | 10.1 |
 * | SM | 10.3 |
 * | Chrome | 48 |
 * | CA | 48 |
 * | IE | 9 |
 * | Opera | 35 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/writing-mode
 */
export function writingMode(value: KeywordValue): Style {
	return createStyle({
		property: "writing-mode",
		value: String(value),
		description: "This is a shorthand property for both 'direction' and 'block-progression'.",
		syntax: "horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr",
		browserCompat: ["E12", "FF41", "FFA41", "S10.1", "SM10.3", "C48", "CA48", "IE9", "O35"],
		baseline: { status: "high", baseline_low_date: "2017-03-27", baseline_high_date: "2019-09-27" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The x CSS property defines the x-axis coordinate of the top left corner of the
 * SVG rect shape, image image, foreignObject viewport or nested svg viewport
 * relative to the nearest <svg> ancestor's user coordinate system. If present,
 * it overrides the element's x attribute.
 *
 * **Syntax:** `<length> | <percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 42 |
 * | CA | 42 |
 * | Opera | 29 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/x
 */
export function x(value: LengthValue): Style {
	return createStyle({
		property: "x",
		value: String(value),
		description:
			"The x CSS property defines the x-axis coordinate of the top left corner of the SVG rect shape, image image, foreignObject viewport or nested svg viewport relative to the nearest <svg> ancestor's user coordinate system. If present, it overrides the element's x attribute.",
		syntax: "<length> | <percentage>",
		browserCompat: ["E79", "FF69", "FFA79", "S9", "SM9", "C42", "CA42", "O29"],
		baseline: { status: "high", baseline_low_date: "2020-07-28", baseline_high_date: "2023-01-28" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The y CSS property defines the y-axis coordinate of the top left corner of the
 * SVG rect shape, image image, foreignObject viewport and nested svg viewport
 * relative to the nearest <svg> ancestor's user coordinate system. If present,
 * it overrides the element's y attribute.
 *
 * **Syntax:** `<length> | <percentage>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Firefox | 69 |
 * | FFA | 79 |
 * | Safari | 9 |
 * | SM | 9 |
 * | Chrome | 42 |
 * | CA | 42 |
 * | Opera | 29 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/y
 */
export function y(value: LengthValue): Style {
	return createStyle({
		property: "y",
		value: String(value),
		description:
			"The y CSS property defines the y-axis coordinate of the top left corner of the SVG rect shape, image image, foreignObject viewport and nested svg viewport relative to the nearest <svg> ancestor's user coordinate system. If present, it overrides the element's y attribute.",
		syntax: "<length> | <percentage>",
		browserCompat: ["E79", "FF69", "FFA79", "S9", "SM9", "C42", "CA42", "O29"],
		baseline: { status: "high", baseline_low_date: "2020-07-28", baseline_high_date: "2023-01-28" },
		ast: createValueAST(String(value)),
	});
}

/**
 * For a positioned box, the 'z-index' property specifies the stack level of the
 * box in the current stacking context and whether the box establishes a local
 * stacking context.
 *
 * **Syntax:** `auto | <integer>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 1 |
 * | FFA | 4 |
 * | Safari | 1 |
 * | SM | 1 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 4 |
 * | Opera | 4 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/z-index
 */
export function zIndex(value: IntegerValue): Style {
	return createStyle({
		property: "z-index",
		value: String(value),
		description:
			"For a positioned box, the 'z-index' property specifies the stack level of the box in the current stacking context and whether the box establishes a local stacking context.",
		syntax: "auto | <integer>",
		browserCompat: ["E12", "FF1", "FFA4", "S1", "SM1", "C1", "CA18", "IE4", "O4"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Non-standard. Specifies the magnification scale of the object. See 'transform:
 * scale()' for a standards-based alternative.
 *
 * **Syntax:** `normal | reset | <number [0,∞]> || <percentage [0,∞]>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 126 |
 * | FFA | 126 |
 * | Safari | 3.1 |
 * | SM | 3 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | IE | 5.5 |
 * | Opera | 15 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/zoom
 */
export function zoom(value: StringValue): Style {
	return createStyle({
		property: "zoom",
		value: String(value),
		description:
			"Non-standard. Specifies the magnification scale of the object. See 'transform: scale()' for a standards-based alternative.",
		syntax: "normal | reset | <number [0,∞]> || <percentage [0,∞]>",
		browserCompat: ["E12", "FF126", "FFA126", "S3.1", "SM3", "C1", "CA18", "IE5.5", "O15"],
		baseline: { status: "low", baseline_low_date: "2024-05-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The alignment-baseline CSS property specifies the specific baseline used to
 * align the box's text and inline-level contents. Baseline alignment is the
 * relationship among the baselines of multiple alignment subjects within an
 * alignment context. When performing baseline alignment, the alignment-baseline
 * property value specifies which baseline of the box is aligned to the
 * corresponding baseline of its alignment context.
 *
 * **Syntax:** `baseline | alphabetic | ideographic | middle | central | mathematical | text-before-edge | text-after-edge`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Safari | 5.1 |
 * | SM | 5 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/alignment-baseline
 */
export function alignmentBaseline(value: KeywordValue): Style {
	return createStyle({
		property: "alignment-baseline",
		value: String(value),
		description:
			"The alignment-baseline CSS property specifies the specific baseline used to align the box's text and inline-level contents. Baseline alignment is the relationship among the baselines of multiple alignment subjects within an alignment context. When performing baseline alignment, the alignment-baseline property value specifies which baseline of the box is aligned to the corresponding baseline of its alignment context.",
		syntax:
			"baseline | alphabetic | ideographic | middle | central | mathematical | text-before-edge | text-after-edge",
		browserCompat: ["E79", "S5.1", "SM5", "C1", "CA18", "O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Allows repositioning of the dominant-baseline relative to the
 * dominant-baseline of the parent text content element. The shifted object might
 * be a sub- or superscript.
 *
 * **Syntax:** `<length-percentage> | sub | super | baseline`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 79 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ❌ Limited support
 */
export function baselineShift(value: LengthPercentageValue): Style {
	return createStyle({
		property: "baseline-shift",
		value: String(value),
		description:
			"Allows repositioning of the dominant-baseline relative to the dominant-baseline of the parent text content element. The shifted object might be a sub- or superscript.",
		syntax: "<length-percentage> | sub | super | baseline",
		browserCompat: ["E79", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * IE only. Used to extend behaviors of the browser.
 *
 * **Syntax:** `<url>+`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | IE | 6 |
 */
export function behavior(value: UrlValue): Style {
	return createStyle({
		property: "behavior",
		value: String(value),
		description: "IE only. Used to extend behaviors of the browser.",
		syntax: "<url>+",
		browserCompat: ["IE6"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<'cue-before'> <'cue-after'>?`
 */
export function cue(value: StringValue): Style {
	return createStyle({
		property: "cue",
		value: String(value),
		description: undefined,
		syntax: "<'cue-before'> <'cue-after'>?",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<url> <decibel>?|none`
 */
export function cueAfter(value: UrlValue): Style {
	return createStyle({
		property: "cue-after",
		value: String(value),
		description: undefined,
		syntax: "<url> <decibel>?|none",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<url> <decibel>?|none`
 */
export function cueBefore(value: UrlValue): Style {
	return createStyle({
		property: "cue-before",
		value: String(value),
		description: undefined,
		syntax: "<url> <decibel>?|none",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls glyph orientation when the inline-progression-direction is
 * horizontal.
 *
 * **Syntax:** `<angle>`
 */
export function glyphOrientationHorizontal(value: AngleValue): Style {
	return createStyle({
		property: "glyph-orientation-horizontal",
		value: String(value),
		description: "Controls glyph orientation when the inline-progression-direction is horizontal.",
		syntax: "<angle>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Controls glyph orientation when the inline-progression-direction is vertical.
 *
 * **Syntax:** `<angle>`
 *
 * @deprecated
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 4 |
 * | SM | 3.2 |
 *
 * **Baseline:** ❌ Limited support
 */
export function glyphOrientationVertical(value: AngleValue): Style {
	return createStyle({
		property: "glyph-orientation-vertical",
		value: String(value),
		description: "Controls glyph orientation when the inline-progression-direction is vertical.",
		syntax: "<angle>",
		browserCompat: ["S4", "SM3.2"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Indicates whether the user agent should adjust inter-glyph spacing based on
 * kerning tables that are included in the relevant font or instead disable
 * auto-kerning and set inter-character spacing to a specific length.
 *
 * **Syntax:** `auto|<svg-length>`
 */
export function kerning(value: StringValue): Style {
	return createStyle({
		property: "kerning",
		value: String(value),
		description:
			"Indicates whether the user agent should adjust inter-glyph spacing based on kerning tables that are included in the relevant font or instead disable auto-kerning and set inter-character spacing to a specific length.",
		syntax: "auto|<svg-length>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<'pause-before'> <'pause-after'>?`
 */
export function pause(value: StringValue): Style {
	return createStyle({
		property: "pause",
		value: String(value),
		description: undefined,
		syntax: "<'pause-before'> <'pause-after'>?",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<time>|none|x-weak|weak|medium|strong|x-strong`
 */
export function pauseAfter(value: TimeValue): Style {
	return createStyle({
		property: "pause-after",
		value: String(value),
		description: undefined,
		syntax: "<time>|none|x-weak|weak|medium|strong|x-strong",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<time>|none|x-weak|weak|medium|strong|x-strong`
 */
export function pauseBefore(value: TimeValue): Style {
	return createStyle({
		property: "pause-before",
		value: String(value),
		description: undefined,
		syntax: "<time>|none|x-weak|weak|medium|strong|x-strong",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<'rest-before'> <'rest-after'>?`
 */
export function rest(value: StringValue): Style {
	return createStyle({
		property: "rest",
		value: String(value),
		description: undefined,
		syntax: "<'rest-before'> <'rest-after'>?",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<time>|none|x-weak|weak|medium|strong|x-strong`
 */
export function restAfter(value: TimeValue): Style {
	return createStyle({
		property: "rest-after",
		value: String(value),
		description: undefined,
		syntax: "<time>|none|x-weak|weak|medium|strong|x-strong",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<time>|none|x-weak|weak|medium|strong|x-strong`
 */
export function restBefore(value: TimeValue): Style {
	return createStyle({
		property: "rest-before",
		value: String(value),
		description: undefined,
		syntax: "<time>|none|x-weak|weak|medium|strong|x-strong",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * @font-face descriptor. Specifies the resource containing font data. It is
 * required, whether the font is downloadable or locally installed.
 *
 * **Syntax:** `[ <url> [ format( <string># ) ]? | local( <family-name> ) ]#`
 */
export function src(value: StringValue): Style {
	return createStyle({
		property: "src",
		value: String(value),
		description:
			"@font-face descriptor. Specifies the resource containing font data. It is required, whether the font is downloadable or locally installed.",
		syntax: "[ <url> [ format( <string># ) ]? | local( <family-name> ) ]#",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `auto|never|always`
 */
export function speak(value: KeywordValue): Style {
	return createStyle({
		property: "speak",
		value: String(value),
		description: undefined,
		syntax: "auto|never|always",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The speak-as descriptor specifies how a counter symbol constructed with a
 * given @counter-style will be represented in the spoken form. For example, an
 * author can specify a counter symbol to be either spoken as its numerical value
 * or just represented with an audio cue.
 *
 * **Syntax:** `auto | bullets | numbers | words | spell-out | <counter-style-name>`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 11.1 |
 * | SM | 11.3 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/speak-as
 */
export function speakAs(value: StringValue): Style {
	return createStyle({
		property: "speak-as",
		value: String(value),
		description:
			"The speak-as descriptor specifies how a counter symbol constructed with a given @counter-style will be represented in the spoken form. For example, an author can specify a counter symbol to be either spoken as its numerical value or just represented with an audio cue.",
		syntax: "auto | bullets | numbers | words | spell-out | <counter-style-name>",
		browserCompat: ["S11.1", "SM11.3"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * @font-face descriptor. Defines the set of Unicode codepoints that may be
 * supported by the font face for which it is declared.
 *
 * **Syntax:** `<unicode-range-token>#`
 */
export function unicodeRange(value: StringValue): Style {
	return createStyle({
		property: "unicode-range",
		value: String(value),
		description:
			"@font-face descriptor. Defines the set of Unicode codepoints that may be supported by the font face for which it is declared.",
		syntax: "<unicode-range-token>#",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<number>|left|center|right|leftwards|rightwards`
 */
export function voiceBalance(value: NumberValue): Style {
	return createStyle({
		property: "voice-balance",
		value: String(value),
		description: undefined,
		syntax: "<number>|left|center|right|leftwards|rightwards",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `auto|<time>`
 */
export function voiceDuration(value: TimeValue): Style {
	return createStyle({
		property: "voice-duration",
		value: String(value),
		description: undefined,
		syntax: "auto|<time>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `[[<family-name>|<generic-voice>] ,]* [<family-name>|<generic-voice>]|preserve`
 */
export function voiceFamily(value: StringValue): Style {
	return createStyle({
		property: "voice-family",
		value: String(value),
		description: undefined,
		syntax: "[[<family-name>|<generic-voice>] ,]* [<family-name>|<generic-voice>]|preserve",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]`
 */
export function voicePitch(value: PercentageValue): Style {
	return createStyle({
		property: "voice-pitch",
		value: String(value),
		description: undefined,
		syntax: "<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]`
 */
export function voiceRange(value: PercentageValue): Style {
	return createStyle({
		property: "voice-range",
		value: String(value),
		description: undefined,
		syntax: "<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `[normal|x-slow|slow|medium|fast|x-fast]||<percentage>`
 */
export function voiceRate(value: PercentageValue): Style {
	return createStyle({
		property: "voice-rate",
		value: String(value),
		description: undefined,
		syntax: "[normal|x-slow|slow|medium|fast|x-fast]||<percentage>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `normal|strong|moderate|none|reduced`
 */
export function voiceStress(value: KeywordValue): Style {
	return createStyle({
		property: "voice-stress",
		value: String(value),
		description: undefined,
		syntax: "normal|strong|moderate|none|reduced",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `silent|[[x-soft|soft|medium|loud|x-loud]||<decibel>]`
 */
export function voiceVolume(value: StringValue): Style {
	return createStyle({
		property: "voice-volume",
		value: String(value),
		description: undefined,
		syntax: "silent|[[x-soft|soft|medium|loud|x-loud]||<decibel>]",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `none|discard-before||discard-after||discard-inner`
 */
export function whiteSpaceTrim(value: StringValue): Style {
	return createStyle({
		property: "white-space-trim",
		value: String(value),
		description: undefined,
		syntax: "none|discard-before||discard-after||discard-inner",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * @counter-style descriptor. Specifies the symbols used by the
 * marker-construction algorithm specified by the system descriptor. Needs to be
 * specified if the counter system is 'additive'.
 *
 * **Syntax:** `[ <integer [0,∞]> && <symbol> ]#`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 33 |
 */
export function additiveSymbols(value: StringValue): Style {
	return createStyle({
		property: "additive-symbols",
		value: String(value),
		description:
			"@counter-style descriptor. Specifies the symbols used by the marker-construction algorithm specified by the system descriptor. Needs to be specified if the counter system is 'additive'.",
		syntax: "[ <integer [0,∞]> && <symbol> ]#",
		browserCompat: ["FF33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Provides alternative text for assistive technology to replace the generated
 * content of a ::before or ::after element.
 *
 * **Syntax:** ``
 *
 * @deprecated
 *
 * **Baseline:** ❌ Limited support
 */
export function alt(value: StringValue): Style {
	return createStyle({
		property: "alt",
		value: String(value),
		description:
			"Provides alternative text for assistive technology to replace the generated content of a ::before or ::after element.",
		syntax: "",
		browserCompat: undefined,
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Deprecated. Use 'isolation' property instead when support allows. Specifies
 * how the accumulation of the background image is managed.
 *
 * **Syntax:** ``
 */
export function enableBackground(value: StringValue): Style {
	return createStyle({
		property: "enable-background",
		value: String(value),
		description:
			"Deprecated. Use 'isolation' property instead when support allows. Specifies how the accumulation of the background image is managed.",
		syntax: "",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * @counter-style descriptor. Specifies a fallback counter style to be used when
 * the current counter style can't create a representation for a given counter
 * value.
 *
 * **Syntax:** `<counter-style-name>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 33 |
 */
export function fallback(value: StringValue): Style {
	return createStyle({
		property: "fallback",
		value: String(value),
		description:
			"@counter-style descriptor. Specifies a fallback counter style to be used when the current counter style can't create a representation for a given counter value.",
		syntax: "<counter-style-name>",
		browserCompat: ["FF33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Indicates what color to use to flood the current filter primitive subregion.
 *
 * **Syntax:** `<color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 6 |
 * | SM | 6 |
 * | Chrome | 5 |
 * | CA | 18 |
 * | IE | 11 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flood-color
 */
export function floodColor(value: ColorValue): Style {
	return createStyle({
		property: "flood-color",
		value: String(value),
		description: "Indicates what color to use to flood the current filter primitive subregion.",
		syntax: "<color>",
		browserCompat: ["E12", "FF3", "FFA4", "S6", "SM6", "C5", "CA18", "IE11", "O15"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Indicates what opacity to use to flood the current filter primitive subregion.
 *
 * **Syntax:** `<'opacity'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 6 |
 * | SM | 6 |
 * | Chrome | 5 |
 * | CA | 18 |
 * | IE | 11 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/flood-opacity
 */
export function floodOpacity(value: StringValue): Style {
	return createStyle({
		property: "flood-opacity",
		value: String(value),
		description: "Indicates what opacity to use to flood the current filter primitive subregion.",
		syntax: "<'opacity'>",
		browserCompat: ["E12", "FF3", "FFA4", "S6", "SM6", "C5", "CA18", "IE11", "O15"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the color of the light source for filter primitives
 * 'feDiffuseLighting' and 'feSpecularLighting'.
 *
 * **Syntax:** `<color>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 12 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 6 |
 * | SM | 6 |
 * | Chrome | 5 |
 * | CA | 18 |
 * | IE | 11 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/lighting-color
 */
export function lightingColor(value: ColorValue): Style {
	return createStyle({
		property: "lighting-color",
		value: String(value),
		description:
			"Defines the color of the light source for filter primitives 'feDiffuseLighting' and 'feSpecularLighting'.",
		syntax: "<color>",
		browserCompat: ["E12", "FF3", "FFA4", "S6", "SM6", "C5", "CA18", "IE11", "O15"],
		baseline: { status: "high", baseline_low_date: "2015-07-29", baseline_high_date: "2018-01-29" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Shorthand property for setting 'motion-path', 'motion-offset' and
 * 'motion-rotation'.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Chrome | 46 |
 * | Opera | 33 |
 */
export function motion(value: StringValue): Style {
	return createStyle({
		property: "motion",
		value: String(value),
		description: "Shorthand property for setting 'motion-path', 'motion-offset' and 'motion-rotation'.",
		syntax: "",
		browserCompat: ["C46", "O33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * A distance that describes the position along the specified motion path.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Chrome | 46 |
 * | Opera | 33 |
 */
export function motionOffset(value: StringValue): Style {
	return createStyle({
		property: "motion-offset",
		value: String(value),
		description: "A distance that describes the position along the specified motion path.",
		syntax: "",
		browserCompat: ["C46", "O33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the motion path the element gets positioned at.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Chrome | 46 |
 * | Opera | 33 |
 */
export function motionPath(value: StringValue): Style {
	return createStyle({
		property: "motion-path",
		value: String(value),
		description: "Specifies the motion path the element gets positioned at.",
		syntax: "",
		browserCompat: ["C46", "O33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the direction of the element while positioning along the motion path.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Chrome | 46 |
 * | Opera | 33 |
 */
export function motionRotation(value: StringValue): Style {
	return createStyle({
		property: "motion-rotation",
		value: String(value),
		description: "Defines the direction of the element while positioning along the motion path.",
		syntax: "",
		browserCompat: ["C46", "O33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Provides an way to control directional focus navigation.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 9.5 |
 */
export function navDown(value: StringValue): Style {
	return createStyle({
		property: "nav-down",
		value: String(value),
		description: "Provides an way to control directional focus navigation.",
		syntax: "",
		browserCompat: ["O9.5"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Provides an input-method-neutral way of specifying the sequential navigation
 * order (also known as 'tabbing order').
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 9.5 |
 */
export function navIndex(value: StringValue): Style {
	return createStyle({
		property: "nav-index",
		value: String(value),
		description:
			"Provides an input-method-neutral way of specifying the sequential navigation order (also known as 'tabbing order').",
		syntax: "",
		browserCompat: ["O9.5"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Provides an way to control directional focus navigation.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 9.5 |
 */
export function navLeft(value: StringValue): Style {
	return createStyle({
		property: "nav-left",
		value: String(value),
		description: "Provides an way to control directional focus navigation.",
		syntax: "",
		browserCompat: ["O9.5"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Provides an way to control directional focus navigation.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 9.5 |
 */
export function navRight(value: StringValue): Style {
	return createStyle({
		property: "nav-right",
		value: String(value),
		description: "Provides an way to control directional focus navigation.",
		syntax: "",
		browserCompat: ["O9.5"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Provides an way to control directional focus navigation.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 9.5 |
 */
export function navUp(value: StringValue): Style {
	return createStyle({
		property: "nav-up",
		value: String(value),
		description: "Provides an way to control directional focus navigation.",
		syntax: "",
		browserCompat: ["O9.5"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * @counter-style descriptor. Defines how to alter the representation when the
 * counter value is negative.
 *
 * **Syntax:** `<symbol> <symbol>?`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 33 |
 */
export function negative(value: StringValue): Style {
	return createStyle({
		property: "negative",
		value: String(value),
		description:
			"@counter-style descriptor. Defines how to alter the representation when the counter value is negative.",
		syntax: "<symbol> <symbol>?",
		browserCompat: ["FF33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'bottom'. Mapping depends on the parent element's 'writing-mode',
 * 'direction', and 'text-orientation'.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 41 |
 */
export function offsetBlockEnd(value: StringValue): Style {
	return createStyle({
		property: "offset-block-end",
		value: String(value),
		description:
			"Logical 'bottom'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "",
		browserCompat: ["FF41"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'top'. Mapping depends on the parent element's 'writing-mode',
 * 'direction', and 'text-orientation'.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 41 |
 */
export function offsetBlockStart(value: StringValue): Style {
	return createStyle({
		property: "offset-block-start",
		value: String(value),
		description:
			"Logical 'top'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "",
		browserCompat: ["FF41"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'right'. Mapping depends on the parent element's 'writing-mode',
 * 'direction', and 'text-orientation'.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 41 |
 */
export function offsetInlineEnd(value: StringValue): Style {
	return createStyle({
		property: "offset-inline-end",
		value: String(value),
		description:
			"Logical 'right'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "",
		browserCompat: ["FF41"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Logical 'left'. Mapping depends on the parent element's 'writing-mode',
 * 'direction', and 'text-orientation'.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 41 |
 */
export function offsetInlineStart(value: StringValue): Style {
	return createStyle({
		property: "offset-inline-start",
		value: String(value),
		description:
			"Logical 'left'. Mapping depends on the parent element's 'writing-mode', 'direction', and 'text-orientation'.",
		syntax: "",
		browserCompat: ["FF41"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * @counter-style descriptor. Specifies a "fixed-width" counter style, where
 * representations shorter than the pad value are padded with a particular
 * <symbol>
 *
 * **Syntax:** `<integer [0,∞]> && <symbol>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 33 |
 */
export function pad(value: StringValue): Style {
	return createStyle({
		property: "pad",
		value: String(value),
		description:
			'@counter-style descriptor. Specifies a "fixed-width" counter style, where representations shorter than the pad value are padded with a particular <symbol>',
		syntax: "<integer [0,∞]> && <symbol>",
		browserCompat: ["FF33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * @counter-style descriptor. Specifies a <symbol> that is prepended to the
 * marker representation.
 *
 * **Syntax:** `<symbol>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 33 |
 */
export function prefix(value: StringValue): Style {
	return createStyle({
		property: "prefix",
		value: String(value),
		description: "@counter-style descriptor. Specifies a <symbol> that is prepended to the marker representation.",
		syntax: "<symbol>",
		browserCompat: ["FF33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * @counter-style descriptor. Defines the ranges over which the counter style is
 * defined.
 *
 * **Syntax:** `[ [ <integer> | infinite ]{2} ]# | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 33 |
 */
export function range(value: IntegerValue): Style {
	return createStyle({
		property: "range",
		value: String(value),
		description: "@counter-style descriptor. Defines the ranges over which the counter style is defined.",
		syntax: "[ [ <integer> | infinite ]{2} ]# | auto",
		browserCompat: ["FF33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines whether, and on which side, ruby text is allowed to partially
 * overhang any adjacent text in addition to its own base, when the ruby text is
 * wider than the ruby base.
 *
 * **Syntax:** `auto | none`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 18.2 |
 * | SM | 18.2 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/ruby-overhang
 */
export function rubyOverhang(value: KeywordValue): Style {
	return createStyle({
		property: "ruby-overhang",
		value: String(value),
		description:
			"Determines whether, and on which side, ruby text is allowed to partially overhang any adjacent text in addition to its own base, when the ruby text is wider than the ruby base.",
		syntax: "auto | none",
		browserCompat: ["S18.2", "SM18.2"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines whether, and on which side, ruby text is allowed to partially
 * overhang any adjacent text in addition to its own base, when the ruby text is
 * wider than the ruby base.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 10 |
 */
export function rubySpan(value: StringValue): Style {
	return createStyle({
		property: "ruby-span",
		value: String(value),
		description:
			"Determines whether, and on which side, ruby text is allowed to partially overhang any adjacent text in addition to its own base, when the ruby text is wider than the ruby base.",
		syntax: "",
		browserCompat: ["FF10"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the color of the top and left edges of the scroll box and scroll
 * arrows of a scroll bar.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | IE | 6 |
 */
export function scrollbar3dlightColor(value: StringValue): Style {
	return createStyle({
		property: "scrollbar-3dlight-color",
		value: String(value),
		description: "Determines the color of the top and left edges of the scroll box and scroll arrows of a scroll bar.",
		syntax: "",
		browserCompat: ["IE6"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the color of the arrow elements of a scroll arrow.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | IE | 6 |
 */
export function scrollbarArrowColor(value: StringValue): Style {
	return createStyle({
		property: "scrollbar-arrow-color",
		value: String(value),
		description: "Determines the color of the arrow elements of a scroll arrow.",
		syntax: "",
		browserCompat: ["IE6"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the color of the main elements of a scroll bar, which include the
 * scroll box, track, and scroll arrows.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | IE | 6 |
 */
export function scrollbarBaseColor(value: StringValue): Style {
	return createStyle({
		property: "scrollbar-base-color",
		value: String(value),
		description:
			"Determines the color of the main elements of a scroll bar, which include the scroll box, track, and scroll arrows.",
		syntax: "",
		browserCompat: ["IE6"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the color of the gutter of a scroll bar.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | IE | 6 |
 */
export function scrollbarDarkshadowColor(value: StringValue): Style {
	return createStyle({
		property: "scrollbar-darkshadow-color",
		value: String(value),
		description: "Determines the color of the gutter of a scroll bar.",
		syntax: "",
		browserCompat: ["IE6"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the color of the scroll box and scroll arrows of a scroll bar.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | IE | 6 |
 */
export function scrollbarFaceColor(value: StringValue): Style {
	return createStyle({
		property: "scrollbar-face-color",
		value: String(value),
		description: "Determines the color of the scroll box and scroll arrows of a scroll bar.",
		syntax: "",
		browserCompat: ["IE6"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the color of the top and left edges of the scroll box and scroll
 * arrows of a scroll bar.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | IE | 6 |
 */
export function scrollbarHighlightColor(value: StringValue): Style {
	return createStyle({
		property: "scrollbar-highlight-color",
		value: String(value),
		description: "Determines the color of the top and left edges of the scroll box and scroll arrows of a scroll bar.",
		syntax: "",
		browserCompat: ["IE6"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the color of the bottom and right edges of the scroll box and
 * scroll arrows of a scroll bar.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | IE | 6 |
 */
export function scrollbarShadowColor(value: StringValue): Style {
	return createStyle({
		property: "scrollbar-shadow-color",
		value: String(value),
		description:
			"Determines the color of the bottom and right edges of the scroll box and scroll arrows of a scroll bar.",
		syntax: "",
		browserCompat: ["IE6"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Determines the color of the track element of a scroll bar.
 *
 * **Syntax:** ``
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | IE | 6 |
 */
export function scrollbarTrackColor(value: StringValue): Style {
	return createStyle({
		property: "scrollbar-track-color",
		value: String(value),
		description: "Determines the color of the track element of a scroll bar.",
		syntax: "",
		browserCompat: ["IE6"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The size CSS at-rule descriptor, used with the @page at-rule, defines the size
 * and orientation of the box which is used to represent a page. Most of the
 * time, this size corresponds to the target size of the printed page if
 * applicable.
 *
 * **Syntax:** `<length [0,∞]>{1,2} | auto | [ <page-size> || [ portrait | landscape ] ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Opera | 8 |
 */
export function size(value: StringValue): Style {
	return createStyle({
		property: "size",
		value: String(value),
		description:
			"The size CSS at-rule descriptor, used with the @page at-rule, defines the size and orientation of the box which is used to represent a page. Most of the time, this size corresponds to the target size of the printed page if applicable.",
		syntax: "<length [0,∞]>{1,2} | auto | [ <page-size> || [ portrait | landscape ] ]",
		browserCompat: ["C", "O8"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Indicates what color to use at that gradient stop.
 *
 * **Syntax:** `<'color'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stop-color
 */
export function stopColor(value: StringValue): Style {
	return createStyle({
		property: "stop-color",
		value: String(value),
		description: "Indicates what color to use at that gradient stop.",
		syntax: "<'color'>",
		browserCompat: ["E15", "FF3", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines the opacity of a given gradient stop.
 *
 * **Syntax:** `<'opacity'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 15 |
 * | Firefox | 3 |
 * | FFA | 4 |
 * | Safari | 4 |
 * | SM | 3.2 |
 * | Chrome | 1 |
 * | CA | 18 |
 * | Opera | 15 |
 *
 * **Baseline:** ✅ Widely available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/stop-opacity
 */
export function stopOpacity(value: StringValue): Style {
	return createStyle({
		property: "stop-opacity",
		value: String(value),
		description: "Defines the opacity of a given gradient stop.",
		syntax: "<'opacity'>",
		browserCompat: ["E15", "FF3", "FFA4", "S4", "SM3.2", "C1", "CA18", "O15"],
		baseline: { status: "high", baseline_low_date: "2017-04-05", baseline_high_date: "2019-10-05" },
		ast: createValueAST(String(value)),
	});
}

/**
 * @counter-style descriptor. Specifies a <symbol> that is appended to the marker
 * representation.
 *
 * **Syntax:** `<symbol>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 33 |
 */
export function suffix(value: StringValue): Style {
	return createStyle({
		property: "suffix",
		value: String(value),
		description: "@counter-style descriptor. Specifies a <symbol> that is appended to the marker representation.",
		syntax: "<symbol>",
		browserCompat: ["FF33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * @counter-style descriptor. Specifies which algorithm will be used to construct
 * the counter's representation based on the counter value.
 *
 * **Syntax:** `cyclic | numeric | alphabetic | symbolic | additive | [ fixed <integer>? ] | [ extends <counter-style-name> ]`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 33 |
 */
export function system(value: IntegerValue): Style {
	return createStyle({
		property: "system",
		value: String(value),
		description:
			"@counter-style descriptor. Specifies which algorithm will be used to construct the counter's representation based on the counter value.",
		syntax:
			"cyclic | numeric | alphabetic | symbolic | additive | [ fixed <integer>? ] | [ extends <counter-style-name> ]",
		browserCompat: ["FF33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * @counter-style descriptor. Specifies the symbols used by the
 * marker-construction algorithm specified by the system descriptor.
 *
 * **Syntax:** `<symbol>+`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Firefox | 33 |
 */
export function symbols(value: StringValue): Style {
	return createStyle({
		property: "symbols",
		value: String(value),
		description:
			"@counter-style descriptor. Specifies the symbols used by the marker-construction algorithm specified by the system descriptor.",
		syntax: "<symbol>+",
		browserCompat: ["FF33"],
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `normal | <percentage [0,∞]> | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 18.4 |
 *
 * **Baseline:** ❌ Limited support
 */
export function fontWidth(value: StringValue): Style {
	return createStyle({
		property: "font-width",
		value: String(value),
		description: undefined,
		syntax:
			"normal | <percentage [0,∞]> | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded",
		browserCompat: ["S18.4"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Defines a rectangle as a viewable area (viewbox) within a replaced element,
 * enabling the content of the replaced element to be zoomed or panned.
 *
 * **Syntax:** `none | <basic-shape-rect>`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 104 |
 * | Chrome | 104 |
 * | CA | 104 |
 * | Opera | 90 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/object-view-box
 */
export function objectViewBox(value: StringValue): Style {
	return createStyle({
		property: "object-view-box",
		value: String(value),
		description:
			"Defines a rectangle as a viewable area (viewbox) within a replaced element, enabling the content of the replaced element to be zoomed or panned.",
		syntax: "none | <basic-shape-rect>",
		browserCompat: ["E104", "C104", "CA104", "O90"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `none | nearest`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 133 |
 * | Chrome | 133 |
 * | CA | 133 |
 * | Opera | 118 |
 *
 * **Baseline:** ❌ Limited support
 */
export function scrollInitialTarget(value: KeywordValue): Style {
	return createStyle({
		property: "scroll-initial-target",
		value: String(value),
		description: undefined,
		syntax: "none | nearest",
		browserCompat: ["E133", "C133", "CA133", "O118"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `<color>`
 *
 * @experimental
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Safari | 11.1 |
 * | SM | 11.3 |
 *
 * **Baseline:** ❌ Limited support
 */
export function strokeColor(value: ColorValue): Style {
	return createStyle({
		property: "stroke-color",
		value: String(value),
		description: undefined,
		syntax: "<color>",
		browserCompat: ["S11.1", "SM11.3"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `normal | <autospace> | auto`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 140 |
 * | Firefox | 145 |
 * | FFA | 145 |
 * | Safari | 18.4 |
 * | SM | 18.4 |
 * | Chrome | 140 |
 * | CA | 140 |
 * | Opera | 124 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-autospace
 */
export function textAutospace(value: StringValue): Style {
	return createStyle({
		property: "text-autospace",
		value: String(value),
		description: undefined,
		syntax: "normal | <autospace> | auto",
		browserCompat: ["E140", "FF145", "FFA145", "S18.4", "SM18.4", "C140", "CA140", "O124"],
		baseline: { status: "low", baseline_low_date: "2025-11-11" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-box CSS property is a shorthand that corresponds to the text-box-trim
 * and text-box-edge properties, which together specify the amount of space to
 * trim from the block-start edge and block-end edge of a text element's block
 * container.
 *
 * **Syntax:** `normal | <'text-box-trim'> || <'text-box-edge'>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 133 |
 * | Safari | 18.2 |
 * | SM | 18.2 |
 * | Chrome | 133 |
 * | CA | 133 |
 * | Opera | 118 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-box
 */
export function textBox(value: StringValue): Style {
	return createStyle({
		property: "text-box",
		value: String(value),
		description:
			"The text-box CSS property is a shorthand that corresponds to the text-box-trim and text-box-edge properties, which together specify the amount of space to trim from the block-start edge and block-end edge of a text element's block container.",
		syntax: "normal | <'text-box-trim'> || <'text-box-edge'>",
		browserCompat: ["E133", "S18.2", "SM18.2", "C133", "CA133", "O118"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-box-edge CSS property specifies an amount of space to trim from a
 * text element's block container.
 *
 * **Syntax:** `auto | <text-edge>`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 133 |
 * | Safari | 18.2 |
 * | SM | 18.2 |
 * | Chrome | 133 |
 * | CA | 133 |
 * | Opera | 118 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-box-edge
 */
export function textBoxEdge(value: StringValue): Style {
	return createStyle({
		property: "text-box-edge",
		value: String(value),
		description:
			"The text-box-edge CSS property specifies an amount of space to trim from a text element's block container.",
		syntax: "auto | <text-edge>",
		browserCompat: ["E133", "S18.2", "SM18.2", "C133", "CA133", "O118"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The text-box-trim CSS property specifies which of the over and under edges of
 * text content to trim from a text element's block container.
 *
 * **Syntax:** `none | trim-start | trim-end | trim-both`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 133 |
 * | Safari | 18.2 |
 * | SM | 18.2 |
 * | Chrome | 133 |
 * | CA | 133 |
 * | Opera | 118 |
 *
 * **Baseline:** ❌ Limited support
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-box-trim
 */
export function textBoxTrim(value: KeywordValue): Style {
	return createStyle({
		property: "text-box-trim",
		value: String(value),
		description:
			"The text-box-trim CSS property specifies which of the over and under edges of text content to trim from a text element's block container.",
		syntax: "none | trim-start | trim-end | trim-both",
		browserCompat: ["E133", "S18.2", "SM18.2", "C133", "CA133", "O118"],
		baseline: { status: "false" },
		ast: createValueAST(String(value)),
	});
}

/**
 * The view-transition-class CSS property provides the selected elements with an
 * identifying class (a custom-ident), providing an additional method of styling
 * the view transitions for those elements.
 *
 * **Syntax:** `none | <custom-ident>+`
 *
 * **Browser Support:**
 *
 * | Browser | Version |
 * |:-------:|:-------:|
 * | Edge | 125 |
 * | Firefox | 144 |
 * | FFA | 144 |
 * | Safari | 18.2 |
 * | SM | 18.2 |
 * | Chrome | 125 |
 * | CA | 125 |
 * | Opera | 111 |
 *
 * **Baseline:** 🆕 Newly available
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-transition-class
 */
export function viewTransitionClass(value: CustomIdentValue): Style {
	return createStyle({
		property: "view-transition-class",
		value: String(value),
		description:
			"The view-transition-class CSS property provides the selected elements with an identifying class (a custom-ident), providing an additional method of styling the view transitions for those elements.",
		syntax: "none | <custom-ident>+",
		browserCompat: ["E125", "FF144", "FFA144", "S18.2", "SM18.2", "C125", "CA125", "O111"],
		baseline: { status: "low", baseline_low_date: "2025-10-14" },
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes the ascent metric of a font.
 *
 * **Syntax:** `normal | <percentage>`
 */
export function ascentOverride(value: PercentageValue): Style {
	return createStyle({
		property: "ascent-override",
		value: String(value),
		description: "Describes the ascent metric of a font.",
		syntax: "normal | <percentage>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes the descent metric of a font.
 *
 * **Syntax:** `normal | <percentage>`
 */
export function descentOverride(value: PercentageValue): Style {
	return createStyle({
		property: "descent-override",
		value: String(value),
		description: "Describes the descent metric of a font.",
		syntax: "normal | <percentage>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The font-display descriptor determines how a font face is displayed based on
 * whether and when it is downloaded and ready to use.
 *
 * **Syntax:** `auto | block | swap | fallback | optional`
 */
export function fontDisplay(value: KeywordValue): Style {
	return createStyle({
		property: "font-display",
		value: String(value),
		description:
			"The font-display descriptor determines how a font face is displayed based on whether and when it is downloaded and ready to use.",
		syntax: "auto | block | swap | fallback | optional",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Describes the line-gap metric of a font.
 *
 * **Syntax:** `normal | <percentage>`
 */
export function lineGapOverride(value: PercentageValue): Style {
	return createStyle({
		property: "line-gap-override",
		value: String(value),
		description: "Describes the line-gap metric of a font.",
		syntax: "normal | <percentage>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * A multiplier for glyph outlines and metrics of a font.
 *
 * **Syntax:** `<percentage>`
 */
export function sizeAdjust(value: PercentageValue): Style {
	return createStyle({
		property: "size-adjust",
		value: String(value),
		description: "A multiplier for glyph outlines and metrics of a font.",
		syntax: "<percentage>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The base-palette CSS descriptor is used to specify the name or index of a
 * pre-defined palette to be used for creating a new palette. If the specified
 * base-palette does not exist, then the palette defined at index 0 will be used.
 *
 * **Syntax:** `light | dark | <integer [0,∞]>`
 */
export function basePalette(value: StringValue): Style {
	return createStyle({
		property: "base-palette",
		value: String(value),
		description:
			"The base-palette CSS descriptor is used to specify the name or index of a pre-defined palette to be used for creating a new palette. If the specified base-palette does not exist, then the palette defined at index 0 will be used.",
		syntax: "light | dark | <integer [0,∞]>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The override-colors CSS descriptor is used to override colors in the chosen
 * base-palette for a color font.
 *
 * **Syntax:** `[ <integer [0,∞]> <color> ]#`
 */
export function overrideColors(value: ColorValue): Style {
	return createStyle({
		property: "override-colors",
		value: String(value),
		description:
			"The override-colors CSS descriptor is used to override colors in the chosen base-palette for a color font.",
		syntax: "[ <integer [0,∞]> <color> ]#",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The bleed CSS at-rule descriptor, used with the @page at-rule, specifies the
 * extent of the page bleed area outside the page box. This property only has
 * effect if crop marks are enabled using the marks property.
 *
 * **Syntax:** `auto | <length>`
 */
export function bleed(value: LengthValue): Style {
	return createStyle({
		property: "bleed",
		value: String(value),
		description:
			"The bleed CSS at-rule descriptor, used with the @page at-rule, specifies the extent of the page bleed area outside the page box. This property only has effect if crop marks are enabled using the marks property.",
		syntax: "auto | <length>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The marks CSS at-rule descriptor, used with the @page at-rule, adds crop
 * and/or cross marks to the presentation of the document. Crop marks indicate
 * where the page should be cut. Cross marks are used to align sheets.
 *
 * **Syntax:** `none | [ crop || cross ]`
 */
export function marks(value: StringValue): Style {
	return createStyle({
		property: "marks",
		value: String(value),
		description:
			"The marks CSS at-rule descriptor, used with the @page at-rule, adds crop and/or cross marks to the presentation of the document. Crop marks indicate where the page should be cut. Cross marks are used to align sheets.",
		syntax: "none | [ crop || cross ]",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * The page-orientation CSS descriptor for the @page at-rule controls the
 * rotation of a printed page. It handles the flow of content across pages when
 * the orientation of a page is changed. This behavior differs from the size
 * descriptor in that a user can define the direction in which to rotate the
 * page.
 *
 * **Syntax:** `upright | rotate-left | rotate-right `
 */
export function pageOrientation(value: KeywordValue): Style {
	return createStyle({
		property: "page-orientation",
		value: String(value),
		description:
			"The page-orientation CSS descriptor for the @page at-rule controls the rotation of a printed page. It handles the flow of content across pages when the orientation of a page is changed. This behavior differs from the size descriptor in that a user can define the direction in which to rotate the page.",
		syntax: "upright | rotate-left | rotate-right ",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the inherit flag of the custom property registration represented by
 * the @property rule, controlling whether or not the property inherits by
 * default.
 *
 * **Syntax:** `true | false`
 */
export function inherits(value: KeywordValue): Style {
	return createStyle({
		property: "inherits",
		value: String(value),
		description:
			"Specifies the inherit flag of the custom property registration represented by the @property rule, controlling whether or not the property inherits by default.",
		syntax: "true | false",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the initial value of the custom property registration represented by
 * the @property rule, controlling the property’s initial value.
 *
 * **Syntax:** `<declaration-value>?`
 */
export function initialValue(value: StringValue): Style {
	return createStyle({
		property: "initial-value",
		value: String(value),
		description:
			"Specifies the initial value of the custom property registration represented by the @property rule, controlling the property’s initial value.",
		syntax: "<declaration-value>?",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 * Specifies the syntax of the custom property registration represented by the
 * @property rule, controlling how the property’s value is parsed at computed
 * value time.
 *
 * **Syntax:** `<string>`
 */
export function syntax(value: StringValue): Style {
	return createStyle({
		property: "syntax",
		value: String(value),
		description:
			"Specifies the syntax of the custom property registration represented by the @property rule, controlling how the property’s value is parsed at computed value time.",
		syntax: "<string>",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `auto | none`
 */
export function navigation(value: KeywordValue): Style {
	return createStyle({
		property: "navigation",
		value: String(value),
		description: undefined,
		syntax: "auto | none",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}

/**
 *
 * **Syntax:** `none | <custom-ident>+`
 */
export function types(value: CustomIdentValue): Style {
	return createStyle({
		property: "types",
		value: String(value),
		description: undefined,
		syntax: "none | <custom-ident>+",
		browserCompat: undefined,
		baseline: undefined,
		ast: createValueAST(String(value)),
	});
}
