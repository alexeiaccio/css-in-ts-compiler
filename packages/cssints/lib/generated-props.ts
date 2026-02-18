/**
 * CSS Properties - AUTO-GENERATED
 * Do not edit manually. Run: bun run scripts/generate-all.ts
 * 
 * Generated from @webref/css
 * 
 * Property Signatures:
 * - Single value: display('flex')
 * - Number scale: padding(4) → '1rem' (scale: 0.25)
 * - Multi-param: padding(1, 2, 3, 4) → '0.25rem 0.5rem 0.75rem 1rem'
 */

import type { Length } from "./generated-types";
import { scaleValue, type ScaleValue } from "./scale";


/**
 * CSS `accent-color` property.
 *
 * **Syntax**: `auto | <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const accentColor: (value: string | number) => string = (value) => `accent-color: ${value}`;

/**
 * CSS `align-content` property.
 *
 * **Syntax**: `normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const alignContent: (value: string | number) => string = (value) => `align-content: ${value}`;

/**
 * CSS `align-items` property.
 *
 * **Syntax**: `normal | stretch | <baseline-position> | <overflow-position>? <self-position> | anchor-center`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const alignItems: (value: string | number) => string = (value) => `align-items: ${value}`;

/**
 * CSS `alignment-baseline` property.
 *
 * **Syntax**: `baseline | text-bottom | alphabetic | ideographic | middle | central | mathematical | text-top`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const alignmentBaseline: (value: string | number) => string = (value) => `alignment-baseline: ${value}`;

/**
 * CSS `align-self` property.
 *
 * **Syntax**: `auto | <overflow-position>? [ normal | <self-position> ]| stretch | <baseline-position> | anchor-center`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const alignSelf: (value: string | number) => string = (value) => `align-self: ${value}`;

/**
 * CSS `all` property.
 *
 * **Syntax**: `initial | inherit | unset | revert | revert-layer | revert-rule`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-cascade-5
 */
export const all: (value: string | number) => string = (value) => `all: ${value}`;

/**
 * CSS `anchor-name` property.
 *
 * **Syntax**: `none | <anchor-name>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-anchor-position-1
 */
export const anchorName: (value: string | number) => string = (value) => `anchor-name: ${value}`;

/**
 * CSS `anchor-scope` property.
 *
 * **Syntax**: `none | all | <anchor-name>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-anchor-position-1
 */
export const anchorScope: (value: string | number) => string = (value) => `anchor-scope: ${value}`;

/**
 * CSS `animation` property.
 *
 * **Syntax**: `<single-animation>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-1
 */
export const animation: (value: string | number) => string = (value) => `animation: ${value}`;

/**
 * CSS `animation-composition` property.
 *
 * **Syntax**: `<single-animation-composition>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const animationComposition: (value: string | number) => string = (value) => `animation-composition: ${value}`;

/**
 * CSS `animation-delay` property.
 *
 * **Syntax**: `<time>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-1
 */
export const animationDelay: (value: string | number) => string = (value) => `animation-delay: ${value}`;

/**
 * CSS `animation-direction` property.
 *
 * **Syntax**: `<single-animation-direction>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-1
 */
export const animationDirection: (value: string | number) => string = (value) => `animation-direction: ${value}`;

/**
 * CSS `animation-duration` property.
 *
 * **Syntax**: `[ auto | <time [0s,∞]> ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const animationDuration: (value: string | number) => string = (value) => `animation-duration: ${value}`;

/**
 * CSS `animation-fill-mode` property.
 *
 * **Syntax**: `<single-animation-fill-mode>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-1
 */
export const animationFillMode: (value: string | number) => string = (value) => `animation-fill-mode: ${value}`;

/**
 * CSS `animation-iteration-count` property.
 *
 * **Syntax**: `<single-animation-iteration-count>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-1
 */
export const animationIterationCount: (value: string | number) => string = (value) => `animation-iteration-count: ${value}`;

/**
 * CSS `animation-name` property.
 *
 * **Syntax**: `[ none | <keyframes-name> ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-1
 */
export const animationName: (value: string | number) => string = (value) => `animation-name: ${value}`;

/**
 * CSS `animation-play-state` property.
 *
 * **Syntax**: `<single-animation-play-state>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-1
 */
export const animationPlayState: (value: string | number) => string = (value) => `animation-play-state: ${value}`;

/**
 * CSS `animation-range` property.
 *
 * **Syntax**: `[ <'animation-range-start'> <'animation-range-end'>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const animationRange: (value: string | number) => string = (value) => `animation-range: ${value}`;

/**
 * CSS `animation-range-center` property.
 *
 * **Syntax**: `[ normal | [ <length-percentage> | <timeline-range-center-subject> <length-percentage>? ] ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec pointer-animations-1
 */
export const animationRangeCenter: (value: string | number) => string = (value) => `animation-range-center: ${value}`;

/**
 * CSS `animation-range-end` property.
 *
 * **Syntax**: `[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const animationRangeEnd: (value: string | number) => string = (value) => `animation-range-end: ${value}`;

/**
 * CSS `animation-range-start` property.
 *
 * **Syntax**: `[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const animationRangeStart: (value: string | number) => string = (value) => `animation-range-start: ${value}`;

/**
 * CSS `animation-timeline` property.
 *
 * **Syntax**: `<single-animation-timeline>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const animationTimeline: (value: string | number) => string = (value) => `animation-timeline: ${value}`;

/**
 * CSS `animation-timing-function` property.
 *
 * **Syntax**: `<easing-function>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-1
 */
export const animationTimingFunction: (value: string | number) => string = (value) => `animation-timing-function: ${value}`;

/**
 * CSS `animation-trigger` property.
 *
 * **Syntax**: `[ none | [ <dashed-ident> <animation-action>+ ]+ ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const animationTrigger: (value: string | number) => string = (value) => `animation-trigger: ${value}`;

/**
 * CSS `appearance` property.
 *
 * **Syntax**: `none | auto | base | base-select | <compat-auto> | <compat-special> | base`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const appearance: (value: string | number) => string = (value) => `appearance: ${value}`;

/**
 * CSS `aspect-ratio` property.
 *
 * **Syntax**: `auto || <ratio>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-4
 */
export const aspectRatio: (value: string | number) => string = (value) => `aspect-ratio: ${value}`;

/**
 * CSS `backdrop-filter` property.
 *
 * **Syntax**: `none | <filter-value-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec filter-effects-2
 */
export const backdropFilter: (value: string | number) => string = (value) => `backdrop-filter: ${value}`;

/**
 * CSS `backface-visibility` property.
 *
 * **Syntax**: `visible | hidden`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transforms-2
 */
export const backfaceVisibility: (value: string | number) => string = (value) => `backface-visibility: ${value}`;

/**
 * CSS `background` property.
 *
 * **Syntax**: `<bg-layer>#? , <final-bg-layer>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const background: (value: string | number) => string = (value) => `background: ${value}`;

/**
 * CSS `background-attachment` property.
 *
 * **Syntax**: `<attachment>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundAttachment: (value: string | number) => string = (value) => `background-attachment: ${value}`;

/**
 * CSS `background-blend-mode` property.
 *
 * **Syntax**: `<'mix-blend-mode'>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec compositing-2
 */
export const backgroundBlendMode: (value: string | number) => string = (value) => `background-blend-mode: ${value}`;

/**
 * CSS `background-clip` property.
 *
 * **Syntax**: `<bg-clip>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundClip: (value: string | number) => string = (value) => `background-clip: ${value}`;

/**
 * CSS `background-color` property.
 *
 * **Syntax**: `<color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundColor: (value: string | number) => string = (value) => `background-color: ${value}`;

/**
 * CSS `background-image` property.
 *
 * **Syntax**: `<bg-image>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundImage: (value: string | number) => string = (value) => `background-image: ${value}`;

/**
 * CSS `background-origin` property.
 *
 * **Syntax**: `<visual-box>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundOrigin: (value: string | number) => string = (value) => `background-origin: ${value}`;

/**
 * CSS `background-position` property.
 *
 * **Syntax**: `<bg-position>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundPosition: (value: string | number) => string = (value) => `background-position: ${value}`;

/**
 * CSS `background-position-block` property.
 *
 * **Syntax**: `[ center | [ [ start | end ]? <length-percentage>? ]! ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundPositionBlock: (value: string | number) => string = (value) => `background-position-block: ${value}`;

/**
 * CSS `background-position-inline` property.
 *
 * **Syntax**: `[ center | [ [ start | end ]? <length-percentage>? ]! ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundPositionInline: (value: string | number) => string = (value) => `background-position-inline: ${value}`;

/**
 * CSS `background-position-x` property.
 *
 * **Syntax**: `[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundPositionX: (value: string | number) => string = (value) => `background-position-x: ${value}`;

/**
 * CSS `background-position-y` property.
 *
 * **Syntax**: `[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundPositionY: (value: string | number) => string = (value) => `background-position-y: ${value}`;

/**
 * CSS `background-repeat` property.
 *
 * **Syntax**: `<repeat-style>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundRepeat: (value: string | number) => string = (value) => `background-repeat: ${value}`;

/**
 * CSS `background-repeat-block` property.
 *
 * **Syntax**: `<repetition>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundRepeatBlock: (value: string | number) => string = (value) => `background-repeat-block: ${value}`;

/**
 * CSS `background-repeat-inline` property.
 *
 * **Syntax**: `<repetition>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundRepeatInline: (value: string | number) => string = (value) => `background-repeat-inline: ${value}`;

/**
 * CSS `background-repeat-x` property.
 *
 * **Syntax**: `<repetition>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundRepeatX: (value: string | number) => string = (value) => `background-repeat-x: ${value}`;

/**
 * CSS `background-repeat-y` property.
 *
 * **Syntax**: `<repetition>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundRepeatY: (value: string | number) => string = (value) => `background-repeat-y: ${value}`;

/**
 * CSS `background-size` property.
 *
 * **Syntax**: `<bg-size>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundSize: (value: string | number) => string = (value) => `background-size: ${value}`;

/**
 * CSS `background-tbd` property.
 *
 * **Syntax**: `<bg-layer>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-backgrounds-4
 */
export const backgroundTbd: (value: string | number) => string = (value) => `background-tbd: ${value}`;

/**
 * CSS `baseline-shift` property.
 *
 * **Syntax**: `<length-percentage> | sub | super | top | center | bottom`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const baselineShift: (value: string | number) => string = (value) => `baseline-shift: ${value}`;

/**
 * CSS `baseline-source` property.
 *
 * **Syntax**: `auto | first | last`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const baselineSource: (value: string | number) => string = (value) => `baseline-source: ${value}`;

/**
 * CSS `block-ellipsis` property.
 *
 * **Syntax**: `no-ellipsis | auto | <string>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const blockEllipsis: (value: string | number) => string = (value) => `block-ellipsis: ${value}`;

/**
 * CSS `block-size` property.
 *
 * **Syntax**: `<'width'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const blockSize: (value: string | number) => string = (value) => `block-size: ${value}`;

/**
 * CSS `block-step` property.
 *
 * **Syntax**: `<'block-step-size'> || <'block-step-insert'> || <'block-step-align'> || <'block-step-round'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-rhythm-1
 */
export const blockStep: (value: string | number) => string = (value) => `block-step: ${value}`;

/**
 * CSS `block-step-align` property.
 *
 * **Syntax**: `auto | center | start | end`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-rhythm-1
 */
export const blockStepAlign: (value: string | number) => string = (value) => `block-step-align: ${value}`;

/**
 * CSS `block-step-insert` property.
 *
 * **Syntax**: `margin-box | padding-box | content-box`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-rhythm-1
 */
export const blockStepInsert: (value: string | number) => string = (value) => `block-step-insert: ${value}`;

/**
 * CSS `block-step-round` property.
 *
 * **Syntax**: `up | down | nearest`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-rhythm-1
 */
export const blockStepRound: (value: string | number) => string = (value) => `block-step-round: ${value}`;

/**
 * CSS `block-step-size` property.
 *
 * **Syntax**: `none | <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-rhythm-1
 */
export const blockStepSize: (value: string | number) => string = (value) => `block-step-size: ${value}`;

/**
 * CSS `bookmark-label` property.
 *
 * **Syntax**: `<content-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-content-3
 */
export const bookmarkLabel: (value: string | number) => string = (value) => `bookmark-label: ${value}`;

/**
 * CSS `bookmark-level` property.
 *
 * **Syntax**: `none | <integer [1,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-content-3
 */
export const bookmarkLevel: (value: string | number) => string = (value) => `bookmark-level: ${value}`;

/**
 * CSS `bookmark-state` property.
 *
 * **Syntax**: `open | closed`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-content-3
 */
export const bookmarkState: (value: string | number) => string = (value) => `bookmark-state: ${value}`;

/**
 * CSS `border` property.
 *
 * **Syntax**: `<line-width> || <line-style> || <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const border: (value: string | number) => string = (value) => `border: ${value}`;

/**
 * CSS `border-block` property.
 *
 * **Syntax**: `<'border-block-start'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlock: (value: string | number) => string = (value) => `border-block: ${value}`;

/**
 * CSS `border-block-clip` property.
 *
 * **Syntax**: `<'border-top-clip'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockClip: (value: string | number) => string = (value) => `border-block-clip: ${value}`;

/**
 * CSS `border-block-color` property.
 *
 * **Syntax**: `<'border-top-color'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockColor: (value: string | number) => string = (value) => `border-block-color: ${value}`;

/**
 * CSS `border-block-end` property.
 *
 * **Syntax**: `<line-width> || <line-style> || <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockEnd: (value: string | number) => string = (value) => `border-block-end: ${value}`;

/**
 * CSS `border-block-end-clip` property.
 *
 * **Syntax**: `none | [ <length-percentage [0,∞]> | <flex> ]+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockEndClip: (value: string | number) => string = (value) => `border-block-end-clip: ${value}`;

/**
 * CSS `border-block-end-color` property.
 *
 * **Syntax**: `<color> | <image-1D>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockEndColor: (value: string | number) => string = (value) => `border-block-end-color: ${value}`;

/**
 * CSS `border-block-end-radius` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockEndRadius: (value: string | number) => string = (value) => `border-block-end-radius: ${value}`;

/**
 * CSS `border-block-end-style` property.
 *
 * **Syntax**: `<line-style>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockEndStyle: (value: string | number) => string = (value) => `border-block-end-style: ${value}`;

/**
 * CSS `border-block-end-width` property.
 *
 * **Syntax**: `<line-width>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockEndWidth: (value: string | number) => string = (value) => `border-block-end-width: ${value}`;

/**
 * CSS `border-block-start` property.
 *
 * **Syntax**: `<line-width> || <line-style> || <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockStart: (value: string | number) => string = (value) => `border-block-start: ${value}`;

/**
 * CSS `border-block-start-clip` property.
 *
 * **Syntax**: `none | [ <length-percentage [0,∞]> | <flex> ]+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockStartClip: (value: string | number) => string = (value) => `border-block-start-clip: ${value}`;

/**
 * CSS `border-block-start-color` property.
 *
 * **Syntax**: `<color> | <image-1D>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockStartColor: (value: string | number) => string = (value) => `border-block-start-color: ${value}`;

/**
 * CSS `border-block-start-radius` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockStartRadius: (value: string | number) => string = (value) => `border-block-start-radius: ${value}`;

/**
 * CSS `border-block-start-style` property.
 *
 * **Syntax**: `<line-style>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockStartStyle: (value: string | number) => string = (value) => `border-block-start-style: ${value}`;

/**
 * CSS `border-block-start-width` property.
 *
 * **Syntax**: `<line-width>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockStartWidth: (value: string | number) => string = (value) => `border-block-start-width: ${value}`;

/**
 * CSS `border-block-style` property.
 *
 * **Syntax**: `<'border-top-style'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockStyle: (value: string | number) => string = (value) => `border-block-style: ${value}`;

/**
 * CSS `border-block-width` property.
 *
 * **Syntax**: `<'border-top-width'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBlockWidth: (value: string | number) => string = (value) => `border-block-width: ${value}`;

/**
 * CSS `border-bottom` property.
 *
 * **Syntax**: `<line-width> || <line-style> || <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBottom: (value: string | number) => string = (value) => `border-bottom: ${value}`;

/**
 * CSS `border-bottom-clip` property.
 *
 * **Syntax**: `none | [ <length-percentage [0,∞]> | <flex> ]+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBottomClip: (value: string | number) => string = (value) => `border-bottom-clip: ${value}`;

/**
 * CSS `border-bottom-color` property.
 *
 * **Syntax**: `<color> | <image-1D>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBottomColor: (value: string | number) => string = (value) => `border-bottom-color: ${value}`;

/**
 * CSS `border-bottom-left-radius` property.
 *
 * **Syntax**: `<border-radius>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBottomLeftRadius: (value: string | number) => string = (value) => `border-bottom-left-radius: ${value}`;

/**
 * CSS `border-bottom-radius` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBottomRadius: (value: string | number) => string = (value) => `border-bottom-radius: ${value}`;

/**
 * CSS `border-bottom-right-radius` property.
 *
 * **Syntax**: `<border-radius>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBottomRightRadius: (value: string | number) => string = (value) => `border-bottom-right-radius: ${value}`;

/**
 * CSS `border-bottom-style` property.
 *
 * **Syntax**: `<line-style>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBottomStyle: (value: string | number) => string = (value) => `border-bottom-style: ${value}`;

/**
 * CSS `border-bottom-width` property.
 *
 * **Syntax**: `<line-width>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderBottomWidth: (value: string | number) => string = (value) => `border-bottom-width: ${value}`;

/**
 * CSS `border-boundary` property.
 *
 * **Syntax**: `none | parent | display`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-round-display-1
 */
export const borderBoundary: (value: string | number) => string = (value) => `border-boundary: ${value}`;

/**
 * CSS `border-clip` property.
 *
 * **Syntax**: `<'border-top-clip'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderClip: (value: string | number) => string = (value) => `border-clip: ${value}`;

/**
 * CSS `border-collapse` property.
 *
 * **Syntax**: `separate | collapse`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-tables-3
 */
export const borderCollapse: (value: string | number) => string = (value) => `border-collapse: ${value}`;

/**
 * CSS `border-color` property.
 *
 * **Syntax**: `[ <color> | <image-1D> ]{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderColor: (borderColor: ScaleValue, borderColor2?: ScaleValue, borderColor3?: ScaleValue, borderColor4?: ScaleValue) => string = (borderColor, borderColor2, borderColor3, borderColor4) => {
			const values = [borderColor, borderColor2, borderColor3, borderColor4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `border-color: ${scaled.join(' ')}`;
		};

/**
 * CSS `border-end-end-radius` property.
 *
 * **Syntax**: `<border-radius>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderEndEndRadius: (value: string | number) => string = (value) => `border-end-end-radius: ${value}`;

/**
 * CSS `border-end-start-radius` property.
 *
 * **Syntax**: `<border-radius>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderEndStartRadius: (value: string | number) => string = (value) => `border-end-start-radius: ${value}`;

/**
 * CSS `border-image` property.
 *
 * **Syntax**: `<'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderImage: (value: string | number) => string = (value) => `border-image: ${value}`;

/**
 * CSS `border-image-outset` property.
 *
 * **Syntax**: `[ <length [0,∞]> | <number [0,∞]> ]{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderImageOutset: (value: string | number) => string = (value) => `border-image-outset: ${value}`;

/**
 * CSS `border-image-repeat` property.
 *
 * **Syntax**: `[ stretch | repeat | round | space ]{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderImageRepeat: (value: string | number) => string = (value) => `border-image-repeat: ${value}`;

/**
 * CSS `border-image-slice` property.
 *
 * **Syntax**: `[<number [0,∞]> | <percentage [0,∞]>]{1,4} && fill?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderImageSlice: (value: string | number) => string = (value) => `border-image-slice: ${value}`;

/**
 * CSS `border-image-source` property.
 *
 * **Syntax**: `none | <image>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderImageSource: (value: string | number) => string = (value) => `border-image-source: ${value}`;

/**
 * CSS `border-image-width` property.
 *
 * **Syntax**: `[ <length-percentage [0,∞]> | <number [0,∞]> | auto ]{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderImageWidth: (value: string | number) => string = (value) => `border-image-width: ${value}`;

/**
 * CSS `border-inline` property.
 *
 * **Syntax**: `<'border-block-start'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInline: (value: string | number) => string = (value) => `border-inline: ${value}`;

/**
 * CSS `border-inline-clip` property.
 *
 * **Syntax**: `<'border-top-clip'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineClip: (value: string | number) => string = (value) => `border-inline-clip: ${value}`;

/**
 * CSS `border-inline-color` property.
 *
 * **Syntax**: `<'border-top-color'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineColor: (value: string | number) => string = (value) => `border-inline-color: ${value}`;

/**
 * CSS `border-inline-end` property.
 *
 * **Syntax**: `<line-width> || <line-style> || <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineEnd: (value: string | number) => string = (value) => `border-inline-end: ${value}`;

/**
 * CSS `border-inline-end-clip` property.
 *
 * **Syntax**: `none | [ <length-percentage [0,∞]> | <flex> ]+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineEndClip: (value: string | number) => string = (value) => `border-inline-end-clip: ${value}`;

/**
 * CSS `border-inline-end-color` property.
 *
 * **Syntax**: `<color> | <image-1D>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineEndColor: (value: string | number) => string = (value) => `border-inline-end-color: ${value}`;

/**
 * CSS `border-inline-end-radius` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineEndRadius: (value: string | number) => string = (value) => `border-inline-end-radius: ${value}`;

/**
 * CSS `border-inline-end-style` property.
 *
 * **Syntax**: `<line-style>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineEndStyle: (value: string | number) => string = (value) => `border-inline-end-style: ${value}`;

/**
 * CSS `border-inline-end-width` property.
 *
 * **Syntax**: `<line-width>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineEndWidth: (value: string | number) => string = (value) => `border-inline-end-width: ${value}`;

/**
 * CSS `border-inline-start` property.
 *
 * **Syntax**: `<line-width> || <line-style> || <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineStart: (value: string | number) => string = (value) => `border-inline-start: ${value}`;

/**
 * CSS `border-inline-start-clip` property.
 *
 * **Syntax**: `none | [ <length-percentage [0,∞]> | <flex> ]+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineStartClip: (value: string | number) => string = (value) => `border-inline-start-clip: ${value}`;

/**
 * CSS `border-inline-start-color` property.
 *
 * **Syntax**: `<color> | <image-1D>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineStartColor: (value: string | number) => string = (value) => `border-inline-start-color: ${value}`;

/**
 * CSS `border-inline-start-radius` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineStartRadius: (value: string | number) => string = (value) => `border-inline-start-radius: ${value}`;

/**
 * CSS `border-inline-start-style` property.
 *
 * **Syntax**: `<line-style>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineStartStyle: (value: string | number) => string = (value) => `border-inline-start-style: ${value}`;

/**
 * CSS `border-inline-start-width` property.
 *
 * **Syntax**: `<line-width>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineStartWidth: (value: string | number) => string = (value) => `border-inline-start-width: ${value}`;

/**
 * CSS `border-inline-style` property.
 *
 * **Syntax**: `<'border-top-style'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineStyle: (value: string | number) => string = (value) => `border-inline-style: ${value}`;

/**
 * CSS `border-inline-width` property.
 *
 * **Syntax**: `<'border-top-width'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderInlineWidth: (value: string | number) => string = (value) => `border-inline-width: ${value}`;

/**
 * CSS `border-left` property.
 *
 * **Syntax**: `<line-width> || <line-style> || <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderLeft: (value: string | number) => string = (value) => `border-left: ${value}`;

/**
 * CSS `border-left-clip` property.
 *
 * **Syntax**: `none | [ <length-percentage [0,∞]> | <flex> ]+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderLeftClip: (value: string | number) => string = (value) => `border-left-clip: ${value}`;

/**
 * CSS `border-left-color` property.
 *
 * **Syntax**: `<color> | <image-1D>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderLeftColor: (value: string | number) => string = (value) => `border-left-color: ${value}`;

/**
 * CSS `border-left-radius` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderLeftRadius: (value: string | number) => string = (value) => `border-left-radius: ${value}`;

/**
 * CSS `border-left-style` property.
 *
 * **Syntax**: `<line-style>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderLeftStyle: (value: string | number) => string = (value) => `border-left-style: ${value}`;

/**
 * CSS `border-left-width` property.
 *
 * **Syntax**: `<line-width>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderLeftWidth: (value: string | number) => string = (value) => `border-left-width: ${value}`;

/**
 * CSS `border-limit` property.
 *
 * **Syntax**: `all | [ sides | corners ] <length-percentage [0,∞]>? | [ top | right | bottom | left ] <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderLimit: (value: string | number) => string = (value) => `border-limit: ${value}`;

/**
 * CSS `border-radius` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>{1,4} [ / <length-percentage [0,∞]>{1,4} ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderRadius: (borderRadius: ScaleValue, borderRadius2?: ScaleValue, borderRadius3?: ScaleValue, borderRadius4?: ScaleValue) => string = (borderRadius, borderRadius2, borderRadius3, borderRadius4) => {
			const values = [borderRadius, borderRadius2, borderRadius3, borderRadius4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `border-radius: ${scaled.join(' ')}`;
		};

/**
 * CSS `border-right` property.
 *
 * **Syntax**: `<line-width> || <line-style> || <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderRight: (value: string | number) => string = (value) => `border-right: ${value}`;

/**
 * CSS `border-right-clip` property.
 *
 * **Syntax**: `none | [ <length-percentage [0,∞]> | <flex> ]+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderRightClip: (value: string | number) => string = (value) => `border-right-clip: ${value}`;

/**
 * CSS `border-right-color` property.
 *
 * **Syntax**: `<color> | <image-1D>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderRightColor: (value: string | number) => string = (value) => `border-right-color: ${value}`;

/**
 * CSS `border-right-radius` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderRightRadius: (value: string | number) => string = (value) => `border-right-radius: ${value}`;

/**
 * CSS `border-right-style` property.
 *
 * **Syntax**: `<line-style>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderRightStyle: (value: string | number) => string = (value) => `border-right-style: ${value}`;

/**
 * CSS `border-right-width` property.
 *
 * **Syntax**: `<line-width>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderRightWidth: (value: string | number) => string = (value) => `border-right-width: ${value}`;

/**
 * CSS `border-shape` property.
 *
 * **Syntax**: `none | [ <basic-shape> <geometry-box>?]{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderShape: (value: string | number) => string = (value) => `border-shape: ${value}`;

/**
 * CSS `border-spacing` property.
 *
 * **Syntax**: `<length>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-tables-3
 */
export const borderSpacing: (borderSpacing: ScaleValue, borderSpacing2?: ScaleValue, borderSpacing3?: ScaleValue, borderSpacing4?: ScaleValue) => string = (borderSpacing, borderSpacing2, borderSpacing3, borderSpacing4) => {
			const values = [borderSpacing, borderSpacing2, borderSpacing3, borderSpacing4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `border-spacing: ${scaled.join(' ')}`;
		};

/**
 * CSS `border-start-end-radius` property.
 *
 * **Syntax**: `<border-radius>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderStartEndRadius: (value: string | number) => string = (value) => `border-start-end-radius: ${value}`;

/**
 * CSS `border-start-start-radius` property.
 *
 * **Syntax**: `<border-radius>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderStartStartRadius: (value: string | number) => string = (value) => `border-start-start-radius: ${value}`;

/**
 * CSS `border-style` property.
 *
 * **Syntax**: `<'border-top-style'>{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderStyle: (borderStyle: ScaleValue, borderStyle2?: ScaleValue, borderStyle3?: ScaleValue, borderStyle4?: ScaleValue) => string = (borderStyle, borderStyle2, borderStyle3, borderStyle4) => {
			const values = [borderStyle, borderStyle2, borderStyle3, borderStyle4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `border-style: ${scaled.join(' ')}`;
		};

/**
 * CSS `border-top` property.
 *
 * **Syntax**: `<line-width> || <line-style> || <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderTop: (value: string | number) => string = (value) => `border-top: ${value}`;

/**
 * CSS `border-top-clip` property.
 *
 * **Syntax**: `none | [ <length-percentage [0,∞]> | <flex> ]+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderTopClip: (value: string | number) => string = (value) => `border-top-clip: ${value}`;

/**
 * CSS `border-top-color` property.
 *
 * **Syntax**: `<color> | <image-1D>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderTopColor: (value: string | number) => string = (value) => `border-top-color: ${value}`;

/**
 * CSS `border-top-left-radius` property.
 *
 * **Syntax**: `<border-radius>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderTopLeftRadius: (value: string | number) => string = (value) => `border-top-left-radius: ${value}`;

/**
 * CSS `border-top-radius` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>{1,2} [ / <length-percentage [0,∞]>{1,2} ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderTopRadius: (value: string | number) => string = (value) => `border-top-radius: ${value}`;

/**
 * CSS `border-top-right-radius` property.
 *
 * **Syntax**: `<border-radius>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderTopRightRadius: (value: string | number) => string = (value) => `border-top-right-radius: ${value}`;

/**
 * CSS `border-top-style` property.
 *
 * **Syntax**: `<line-style>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderTopStyle: (value: string | number) => string = (value) => `border-top-style: ${value}`;

/**
 * CSS `border-top-width` property.
 *
 * **Syntax**: `<line-width>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderTopWidth: (value: string | number) => string = (value) => `border-top-width: ${value}`;

/**
 * CSS `border-width` property.
 *
 * **Syntax**: `<'border-top-width'>{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const borderWidth: (borderWidth: ScaleValue, borderWidth2?: ScaleValue, borderWidth3?: ScaleValue, borderWidth4?: ScaleValue) => string = (borderWidth, borderWidth2, borderWidth3, borderWidth4) => {
			const values = [borderWidth, borderWidth2, borderWidth3, borderWidth4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `border-width: ${scaled.join(' ')}`;
		};

/**
 * CSS `bottom` property.
 *
 * **Syntax**: `auto | <length-percentage> | <anchor()> | <anchor-size()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const bottom: (value: Length | number | string) => string = (value) => `bottom: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `box-decoration-break` property.
 *
 * **Syntax**: `slice | clone`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-break-4
 */
export const boxDecorationBreak: (value: string | number) => string = (value) => `box-decoration-break: ${value}`;

/**
 * CSS `box-shadow` property.
 *
 * **Syntax**: `<spread-shadow>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const boxShadow: (value: string | number) => string = (value) => `box-shadow: ${value}`;

/**
 * CSS `box-shadow-blur` property.
 *
 * **Syntax**: `<length [0,∞]>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const boxShadowBlur: (value: string | number) => string = (value) => `box-shadow-blur: ${value}`;

/**
 * CSS `box-shadow-color` property.
 *
 * **Syntax**: `<color>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const boxShadowColor: (value: string | number) => string = (value) => `box-shadow-color: ${value}`;

/**
 * CSS `box-shadow-offset` property.
 *
 * **Syntax**: `[ none | <length>{1,2} ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const boxShadowOffset: (value: string | number) => string = (value) => `box-shadow-offset: ${value}`;

/**
 * CSS `box-shadow-position` property.
 *
 * **Syntax**: `[ outset | inset ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const boxShadowPosition: (value: string | number) => string = (value) => `box-shadow-position: ${value}`;

/**
 * CSS `box-shadow-spread` property.
 *
 * **Syntax**: `<length>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const boxShadowSpread: (value: string | number) => string = (value) => `box-shadow-spread: ${value}`;

/**
 * CSS `box-sizing` property.
 *
 * **Syntax**: `content-box | border-box`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-3
 */
export const boxSizing: (value: string | number) => string = (value) => `box-sizing: ${value}`;

/**
 * CSS `box-snap` property.
 *
 * **Syntax**: `none | block-start | block-end | center | baseline | last-baseline`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-line-grid-1
 */
export const boxSnap: (value: string | number) => string = (value) => `box-snap: ${value}`;

/**
 * CSS `break-after` property.
 *
 * **Syntax**: `auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-break-4
 */
export const breakAfter: (value: string | number) => string = (value) => `break-after: ${value}`;

/**
 * CSS `break-before` property.
 *
 * **Syntax**: `auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-break-4
 */
export const breakBefore: (value: string | number) => string = (value) => `break-before: ${value}`;

/**
 * CSS `break-inside` property.
 *
 * **Syntax**: `auto | avoid | avoid-page | avoid-column | avoid-region`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-break-4
 */
export const breakInside: (value: string | number) => string = (value) => `break-inside: ${value}`;

/**
 * CSS `caption-side` property.
 *
 * **Syntax**: `top | bottom`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-tables-3
 */
export const captionSide: (value: string | number) => string = (value) => `caption-side: ${value}`;

/**
 * CSS `caret` property.
 *
 * **Syntax**: `<'caret-color'> || <'caret-animation'> || <'caret-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const caret: (value: string | number) => string = (value) => `caret: ${value}`;

/**
 * CSS `caret-animation` property.
 *
 * **Syntax**: `auto | manual`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const caretAnimation: (value: string | number) => string = (value) => `caret-animation: ${value}`;

/**
 * CSS `caret-color` property.
 *
 * **Syntax**: `auto | <color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const caretColor: (value: string | number) => string = (value) => `caret-color: ${value}`;

/**
 * CSS `caret-shape` property.
 *
 * **Syntax**: `auto | bar | block | underscore`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const caretShape: (value: string | number) => string = (value) => `caret-shape: ${value}`;

/**
 * CSS `clear` property.
 *
 * **Syntax**: `inline-start | inline-end | block-start | block-end | left | right | top | bottom | both-inline | both-block | both | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-page-floats-3
 */
export const clear: (value: string | number) => string = (value) => `clear: ${value}`;

/**
 * CSS `clip` property.
 *
 * **Syntax**: `<rect()> | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const clip: (value: string | number) => string = (value) => `clip: ${value}`;

/**
 * CSS `clip-path` property.
 *
 * **Syntax**: `<clip-source> | [ <basic-shape> || <geometry-box> ] | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const clipPath: (value: string | number) => string = (value) => `clip-path: ${value}`;

/**
 * CSS `clip-rule` property.
 *
 * **Syntax**: `nonzero | evenodd`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const clipRule: (value: string | number) => string = (value) => `clip-rule: ${value}`;

/**
 * CSS `color` property.
 *
 * **Syntax**: `<color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-color-4
 */
export const color: (value: string | number) => string = (value) => `color: ${value}`;

/**
 * CSS `color-adjust` property.
 *
 * **Syntax**: `<'print-color-adjust'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-color-adjust-1
 */
export const colorAdjust: (value: string | number) => string = (value) => `color-adjust: ${value}`;

/**
 * CSS `color-interpolation` property.
 *
 * **Syntax**: `auto | sRGB | linearRGB`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const colorInterpolation: (value: string | number) => string = (value) => `color-interpolation: ${value}`;

/**
 * CSS `color-interpolation-filters` property.
 *
 * **Syntax**: `auto | sRGB | linearRGB`
 *
 * **Status**: 🟢 modern
 *
 * @spec filter-effects-1
 */
export const colorInterpolationFilters: (value: string | number) => string = (value) => `color-interpolation-filters: ${value}`;

/**
 * CSS `color-scheme` property.
 *
 * **Syntax**: `normal | [ light | dark | <custom-ident> ]+ && only?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-color-adjust-1
 */
export const colorScheme: (value: string | number) => string = (value) => `color-scheme: ${value}`;

/**
 * CSS `column-count` property.
 *
 * **Syntax**: `auto | <integer [1,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-multicol-2
 */
export const columnCount: (value: string | number) => string = (value) => `column-count: ${value}`;

/**
 * CSS `column-fill` property.
 *
 * **Syntax**: `auto | balance | balance-all`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-multicol-2
 */
export const columnFill: (value: string | number) => string = (value) => `column-fill: ${value}`;

/**
 * CSS `column-gap` property.
 *
 * **Syntax**: `normal | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const columnGap: (value: Length | number | string) => string = (value) => `column-gap: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `column-height` property.
 *
 * **Syntax**: `auto | <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-multicol-2
 */
export const columnHeight: (value: string | number) => string = (value) => `column-height: ${value}`;

/**
 * CSS `column-rule` property.
 *
 * **Syntax**: `<gap-rule-list> | <gap-auto-rule-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRule: (value: string | number) => string = (value) => `column-rule: ${value}`;

/**
 * CSS `column-rule-break` property.
 *
 * **Syntax**: `none | spanning-item | intersection`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleBreak: (value: string | number) => string = (value) => `column-rule-break: ${value}`;

/**
 * CSS `column-rule-color` property.
 *
 * **Syntax**: `<line-color-list> | <auto-line-color-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleColor: (value: string | number) => string = (value) => `column-rule-color: ${value}`;

/**
 * CSS `column-rule-edge-inset` property.
 *
 * **Syntax**: `<length-percentage> [ <length-percentage> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleEdgeInset: (value: string | number) => string = (value) => `column-rule-edge-inset: ${value}`;

/**
 * CSS `column-rule-edge-inset-end` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleEdgeInsetEnd: (value: string | number) => string = (value) => `column-rule-edge-inset-end: ${value}`;

/**
 * CSS `column-rule-edge-inset-start` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleEdgeInsetStart: (value: string | number) => string = (value) => `column-rule-edge-inset-start: ${value}`;

/**
 * CSS `column-rule-inset` property.
 *
 * **Syntax**: `<length-percentage> <length-percentage>? [/ <length-percentage> <length-percentage>?]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleInset: (value: string | number) => string = (value) => `column-rule-inset: ${value}`;

/**
 * CSS `column-rule-inset-end` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleInsetEnd: (value: string | number) => string = (value) => `column-rule-inset-end: ${value}`;

/**
 * CSS `column-rule-inset-start` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleInsetStart: (value: string | number) => string = (value) => `column-rule-inset-start: ${value}`;

/**
 * CSS `column-rule-interior-inset` property.
 *
 * **Syntax**: `<length-percentage> [ <length-percentage> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleInteriorInset: (value: string | number) => string = (value) => `column-rule-interior-inset: ${value}`;

/**
 * CSS `column-rule-interior-inset-end` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleInteriorInsetEnd: (value: string | number) => string = (value) => `column-rule-interior-inset-end: ${value}`;

/**
 * CSS `column-rule-interior-inset-start` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleInteriorInsetStart: (value: string | number) => string = (value) => `column-rule-interior-inset-start: ${value}`;

/**
 * CSS `column-rule-style` property.
 *
 * **Syntax**: `<line-style-list> | <auto-line-style-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleStyle: (value: string | number) => string = (value) => `column-rule-style: ${value}`;

/**
 * CSS `column-rule-visibility-items` property.
 *
 * **Syntax**: `all | around | between`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleVisibilityItems: (value: string | number) => string = (value) => `column-rule-visibility-items: ${value}`;

/**
 * CSS `column-rule-width` property.
 *
 * **Syntax**: `<line-width-list> | <auto-line-width-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const columnRuleWidth: (value: string | number) => string = (value) => `column-rule-width: ${value}`;

/**
 * CSS `columns` property.
 *
 * **Syntax**: `[ <'column-width'> || <'column-count'> ] [ / <'column-height'> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-multicol-2
 */
export const columns: (value: string | number) => string = (value) => `columns: ${value}`;

/**
 * CSS `column-span` property.
 *
 * **Syntax**: `none | <integer [1,∞]> | all | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-multicol-2
 */
export const columnSpan: (value: string | number) => string = (value) => `column-span: ${value}`;

/**
 * CSS `column-width` property.
 *
 * **Syntax**: `auto | <length [0,∞]> | min-content | max-content | fit-content(<length-percentage>)`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-multicol-2
 */
export const columnWidth: (value: string | number) => string = (value) => `column-width: ${value}`;

/**
 * CSS `column-wrap` property.
 *
 * **Syntax**: `auto | nowrap | wrap`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-multicol-2
 */
export const columnWrap: (value: string | number) => string = (value) => `column-wrap: ${value}`;

/**
 * CSS `contain` property.
 *
 * **Syntax**: `none | strict | content | [ [size | inline-size] || layout || style || paint ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-contain-2
 */
export const contain: (value: string | number) => string = (value) => `contain: ${value}`;

/**
 * CSS `container` property.
 *
 * **Syntax**: `<'container-name'> [ / <'container-type'> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-conditional-5
 */
export const container: (value: string | number) => string = (value) => `container: ${value}`;

/**
 * CSS `container-name` property.
 *
 * **Syntax**: `none | <custom-ident>+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-conditional-5
 */
export const containerName: (value: string | number) => string = (value) => `container-name: ${value}`;

/**
 * CSS `container-type` property.
 *
 * **Syntax**: `normal | [ [ size | inline-size ] || scroll-state ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-conditional-5
 */
export const containerType: (value: string | number) => string = (value) => `container-type: ${value}`;

/**
 * CSS `contain-intrinsic-block-size` property.
 *
 * **Syntax**: `[ auto | from-element ]? [ none | <length [0,∞]> ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-4
 */
export const containIntrinsicBlockSize: (value: string | number) => string = (value) => `contain-intrinsic-block-size: ${value}`;

/**
 * CSS `contain-intrinsic-height` property.
 *
 * **Syntax**: `[ auto | from-element ]? [ none | <length [0,∞]> ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-4
 */
export const containIntrinsicHeight: (value: string | number) => string = (value) => `contain-intrinsic-height: ${value}`;

/**
 * CSS `contain-intrinsic-inline-size` property.
 *
 * **Syntax**: `[ auto | from-element ]? [ none | <length [0,∞]> ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-4
 */
export const containIntrinsicInlineSize: (value: string | number) => string = (value) => `contain-intrinsic-inline-size: ${value}`;

/**
 * CSS `contain-intrinsic-size` property.
 *
 * **Syntax**: `[ [ auto | from-element ]? [ none | <length [0,∞]> ] ]{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-4
 */
export const containIntrinsicSize: (value: string | number) => string = (value) => `contain-intrinsic-size: ${value}`;

/**
 * CSS `contain-intrinsic-width` property.
 *
 * **Syntax**: `[ auto | from-element ]? [ none | <length [0,∞]> ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-4
 */
export const containIntrinsicWidth: (value: string | number) => string = (value) => `contain-intrinsic-width: ${value}`;

/**
 * CSS `content` property.
 *
 * **Syntax**: `normal | none | [ <content-replacement> | <content-list> ] [/ [ <string> | <counter> | <attr()> ]+ ]? | <element()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-content-3
 */
export const content: (value: string | number) => string = (value) => `content: ${value}`;

/**
 * CSS `content-visibility` property.
 *
 * **Syntax**: `visible | auto | hidden`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-contain-2
 */
export const contentVisibility: (value: string | number) => string = (value) => `content-visibility: ${value}`;

/**
 * CSS `copy-into` property.
 *
 * **Syntax**: `none | [ [ <custom-ident> <content-level>] [, <custom-ident> <content-level>]* ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gcpm-4
 */
export const copyInto: (value: string | number) => string = (value) => `copy-into: ${value}`;

/**
 * CSS `corner` property.
 *
 * **Syntax**: `<'border-radius'> || <'corner-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const corner: (value: string | number) => string = (value) => `corner: ${value}`;

/**
 * CSS `corner-block-end` property.
 *
 * **Syntax**: `<'border-top-radius'> || <'corner-top-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerBlockEnd: (value: string | number) => string = (value) => `corner-block-end: ${value}`;

/**
 * CSS `corner-block-end-shape` property.
 *
 * **Syntax**: `<'corner-top-left-shape'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerBlockEndShape: (value: string | number) => string = (value) => `corner-block-end-shape: ${value}`;

/**
 * CSS `corner-block-start` property.
 *
 * **Syntax**: `<'border-top-radius'> || <'corner-top-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerBlockStart: (value: string | number) => string = (value) => `corner-block-start: ${value}`;

/**
 * CSS `corner-block-start-shape` property.
 *
 * **Syntax**: `<'corner-top-left-shape'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerBlockStartShape: (value: string | number) => string = (value) => `corner-block-start-shape: ${value}`;

/**
 * CSS `corner-bottom` property.
 *
 * **Syntax**: `<'border-top-radius'> || <'corner-top-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerBottom: (value: string | number) => string = (value) => `corner-bottom: ${value}`;

/**
 * CSS `corner-bottom-left` property.
 *
 * **Syntax**: `<'border-top-left-radius'> || <'corner-top-left-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerBottomLeft: (value: string | number) => string = (value) => `corner-bottom-left: ${value}`;

/**
 * CSS `corner-bottom-left-shape` property.
 *
 * **Syntax**: `<corner-shape-value>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerBottomLeftShape: (value: string | number) => string = (value) => `corner-bottom-left-shape: ${value}`;

/**
 * CSS `corner-bottom-right` property.
 *
 * **Syntax**: `<'border-top-left-radius'> || <'corner-top-left-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerBottomRight: (value: string | number) => string = (value) => `corner-bottom-right: ${value}`;

/**
 * CSS `corner-bottom-right-shape` property.
 *
 * **Syntax**: `<corner-shape-value>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerBottomRightShape: (value: string | number) => string = (value) => `corner-bottom-right-shape: ${value}`;

/**
 * CSS `corner-bottom-shape` property.
 *
 * **Syntax**: `<'corner-top-left-shape'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerBottomShape: (value: string | number) => string = (value) => `corner-bottom-shape: ${value}`;

/**
 * CSS `corner-end-end` property.
 *
 * **Syntax**: `<'border-top-left-radius'> || <'corner-top-left-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerEndEnd: (value: string | number) => string = (value) => `corner-end-end: ${value}`;

/**
 * CSS `corner-end-end-shape` property.
 *
 * **Syntax**: `<corner-shape-value>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerEndEndShape: (value: string | number) => string = (value) => `corner-end-end-shape: ${value}`;

/**
 * CSS `corner-end-start` property.
 *
 * **Syntax**: `<'border-top-left-radius'> || <'corner-top-left-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerEndStart: (value: string | number) => string = (value) => `corner-end-start: ${value}`;

/**
 * CSS `corner-end-start-shape` property.
 *
 * **Syntax**: `<corner-shape-value>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerEndStartShape: (value: string | number) => string = (value) => `corner-end-start-shape: ${value}`;

/**
 * CSS `corner-inline-end` property.
 *
 * **Syntax**: `<'border-top-radius'> || <'corner-top-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerInlineEnd: (value: string | number) => string = (value) => `corner-inline-end: ${value}`;

/**
 * CSS `corner-inline-end-shape` property.
 *
 * **Syntax**: `<'corner-top-left-shape'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerInlineEndShape: (value: string | number) => string = (value) => `corner-inline-end-shape: ${value}`;

/**
 * CSS `corner-inline-start` property.
 *
 * **Syntax**: `<'border-top-radius'> || <'corner-top-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerInlineStart: (value: string | number) => string = (value) => `corner-inline-start: ${value}`;

/**
 * CSS `corner-inline-start-shape` property.
 *
 * **Syntax**: `<'corner-top-left-shape'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerInlineStartShape: (value: string | number) => string = (value) => `corner-inline-start-shape: ${value}`;

/**
 * CSS `corner-left` property.
 *
 * **Syntax**: `<'border-top-radius'> || <'corner-top-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerLeft: (value: string | number) => string = (value) => `corner-left: ${value}`;

/**
 * CSS `corner-left-shape` property.
 *
 * **Syntax**: `<'corner-top-left-shape'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerLeftShape: (value: string | number) => string = (value) => `corner-left-shape: ${value}`;

/**
 * CSS `corner-right` property.
 *
 * **Syntax**: `<'border-top-radius'> || <'corner-top-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerRight: (value: string | number) => string = (value) => `corner-right: ${value}`;

/**
 * CSS `corner-right-shape` property.
 *
 * **Syntax**: `<'corner-top-left-shape'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerRightShape: (value: string | number) => string = (value) => `corner-right-shape: ${value}`;

/**
 * CSS `corner-shape` property.
 *
 * **Syntax**: `<'corner-top-left-shape'>{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerShape: (value: string | number) => string = (value) => `corner-shape: ${value}`;

/**
 * CSS `corner-start-end` property.
 *
 * **Syntax**: `<'border-top-left-radius'> || <'corner-top-left-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerStartEnd: (value: string | number) => string = (value) => `corner-start-end: ${value}`;

/**
 * CSS `corner-start-end-shape` property.
 *
 * **Syntax**: `<corner-shape-value>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerStartEndShape: (value: string | number) => string = (value) => `corner-start-end-shape: ${value}`;

/**
 * CSS `corner-start-start` property.
 *
 * **Syntax**: `<'border-top-left-radius'> || <'corner-top-left-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerStartStart: (value: string | number) => string = (value) => `corner-start-start: ${value}`;

/**
 * CSS `corner-start-start-shape` property.
 *
 * **Syntax**: `<corner-shape-value>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerStartStartShape: (value: string | number) => string = (value) => `corner-start-start-shape: ${value}`;

/**
 * CSS `corner-top` property.
 *
 * **Syntax**: `<'border-top-radius'> || <'corner-top-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerTop: (value: string | number) => string = (value) => `corner-top: ${value}`;

/**
 * CSS `corner-top-left` property.
 *
 * **Syntax**: `<'border-top-left-radius'> || <'corner-top-left-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerTopLeft: (value: string | number) => string = (value) => `corner-top-left: ${value}`;

/**
 * CSS `corner-top-left-shape` property.
 *
 * **Syntax**: `<corner-shape-value>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerTopLeftShape: (value: string | number) => string = (value) => `corner-top-left-shape: ${value}`;

/**
 * CSS `corner-top-right` property.
 *
 * **Syntax**: `<'border-top-left-radius'> || <'corner-top-left-shape'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerTopRight: (value: string | number) => string = (value) => `corner-top-right: ${value}`;

/**
 * CSS `corner-top-right-shape` property.
 *
 * **Syntax**: `<corner-shape-value>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerTopRightShape: (value: string | number) => string = (value) => `corner-top-right-shape: ${value}`;

/**
 * CSS `corner-top-shape` property.
 *
 * **Syntax**: `<'corner-top-left-shape'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-borders-4
 */
export const cornerTopShape: (value: string | number) => string = (value) => `corner-top-shape: ${value}`;

/**
 * CSS `counter-increment` property.
 *
 * **Syntax**: `[ <counter-name> <integer>? ]+ | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-lists-3
 */
export const counterIncrement: (value: string | number) => string = (value) => `counter-increment: ${value}`;

/**
 * CSS `counter-reset` property.
 *
 * **Syntax**: `[ <counter-name> <integer>? | <reversed-counter-name> <integer>? ]+ | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-lists-3
 */
export const counterReset: (value: string | number) => string = (value) => `counter-reset: ${value}`;

/**
 * CSS `counter-set` property.
 *
 * **Syntax**: `[ <counter-name> <integer>? ]+ | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-lists-3
 */
export const counterSet: (value: string | number) => string = (value) => `counter-set: ${value}`;

/**
 * CSS `continue` property.
 *
 * **Syntax**: `auto | discard | collapse | -webkit-legacy | overflow | paginate | fragments`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const cssContinue: (value: string | number) => string = (value) => `continue: ${value}`;

/**
 * CSS `cue` property.
 *
 * **Syntax**: `<'cue-before'> <'cue-after'>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const cue: (value: string | number) => string = (value) => `cue: ${value}`;

/**
 * CSS `cue-after` property.
 *
 * **Syntax**: `<uri> <decibel>? | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const cueAfter: (value: string | number) => string = (value) => `cue-after: ${value}`;

/**
 * CSS `cue-before` property.
 *
 * **Syntax**: `<uri> <decibel>? | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const cueBefore: (value: string | number) => string = (value) => `cue-before: ${value}`;

/**
 * CSS `cursor` property.
 *
 * **Syntax**: `[<cursor-image>,]* <cursor-predefined>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const cursor: (value: string | number) => string = (value) => `cursor: ${value}`;

/**
 * CSS `cx` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const cx: (value: string | number) => string = (value) => `cx: ${value}`;

/**
 * CSS `cy` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const cy: (value: string | number) => string = (value) => `cy: ${value}`;

/**
 * CSS `d` property.
 *
 * **Syntax**: `none | <string>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const d: (value: string | number) => string = (value) => `d: ${value}`;

/**
 * CSS `direction` property.
 *
 * **Syntax**: `ltr | rtl`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-writing-modes-4
 */
export const direction: (value: string | number) => string = (value) => `direction: ${value}`;

/**
 * CSS `display` property.
 *
 * **Syntax**: `[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy> | grid-lanes | inline-grid-lanes | ruby | ruby-base | ruby-text | ruby-base-container | ruby-text-container | <display-outside> || [ <display-inside> | math ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-display-4
 */
export const display: (value: string | number) => string = (value) => `display: ${value}`;

/**
 * CSS `dominant-baseline` property.
 *
 * **Syntax**: `auto | text-bottom | alphabetic | ideographic | middle | central | mathematical | hanging | text-top`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const dominantBaseline: (value: string | number) => string = (value) => `dominant-baseline: ${value}`;

/**
 * CSS `dynamic-range-limit` property.
 *
 * **Syntax**: `standard | no-limit | constrained | <dynamic-range-limit-mix()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-color-hdr-1
 */
export const dynamicRangeLimit: (value: string | number) => string = (value) => `dynamic-range-limit: ${value}`;

/**
 * CSS `empty-cells` property.
 *
 * **Syntax**: `show | hide`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-tables-3
 */
export const emptyCells: (value: string | number) => string = (value) => `empty-cells: ${value}`;

/**
 * CSS `event-trigger` property.
 *
 * **Syntax**: `none | [ <'event-trigger-name'> <'event-trigger-source'> ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const eventTrigger: (value: string | number) => string = (value) => `event-trigger: ${value}`;

/**
 * CSS `event-trigger-name` property.
 *
 * **Syntax**: `none | <dashed-ident>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const eventTriggerName: (value: string | number) => string = (value) => `event-trigger-name: ${value}`;

/**
 * CSS `event-trigger-source` property.
 *
 * **Syntax**: `[ none | <event-trigger-event>+ [ / <event-trigger-event>+ ]? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const eventTriggerSource: (value: string | number) => string = (value) => `event-trigger-source: ${value}`;

/**
 * CSS `field-sizing` property.
 *
 * **Syntax**: `fixed | content`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-forms-1
 */
export const fieldSizing: (value: string | number) => string = (value) => `field-sizing: ${value}`;

/**
 * CSS `fill` property.
 *
 * **Syntax**: `<paint>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const fill: (value: string | number) => string = (value) => `fill: ${value}`;

/**
 * CSS `fill-break` property.
 *
 * **Syntax**: `bounding-box | slice | clone`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const fillBreak: (value: string | number) => string = (value) => `fill-break: ${value}`;

/**
 * CSS `fill-color` property.
 *
 * **Syntax**: `<color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const fillColor: (value: string | number) => string = (value) => `fill-color: ${value}`;

/**
 * CSS `fill-image` property.
 *
 * **Syntax**: `<paint>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const fillImage: (value: string | number) => string = (value) => `fill-image: ${value}`;

/**
 * CSS `fill-opacity` property.
 *
 * **Syntax**: `<'opacity'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const fillOpacity: (value: string | number) => string = (value) => `fill-opacity: ${value}`;

/**
 * CSS `fill-origin` property.
 *
 * **Syntax**: `match-parent | fill-box | stroke-box | content-box | padding-box | border-box`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const fillOrigin: (value: string | number) => string = (value) => `fill-origin: ${value}`;

/**
 * CSS `fill-position` property.
 *
 * **Syntax**: `<position>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const fillPosition: (value: string | number) => string = (value) => `fill-position: ${value}`;

/**
 * CSS `fill-repeat` property.
 *
 * **Syntax**: `<repeat-style>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const fillRepeat: (value: string | number) => string = (value) => `fill-repeat: ${value}`;

/**
 * CSS `fill-rule` property.
 *
 * **Syntax**: `nonzero | evenodd`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const fillRule: (value: string | number) => string = (value) => `fill-rule: ${value}`;

/**
 * CSS `fill-size` property.
 *
 * **Syntax**: `<bg-size>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const fillSize: (value: string | number) => string = (value) => `fill-size: ${value}`;

/**
 * CSS `filter` property.
 *
 * **Syntax**: `none | <filter-value-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec filter-effects-1
 */
export const filter: (value: string | number) => string = (value) => `filter: ${value}`;

/**
 * CSS `flex` property.
 *
 * **Syntax**: `none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-flexbox-1
 */
export const flex: (value: string | number) => string = (value) => `flex: ${value}`;

/**
 * CSS `flex-basis` property.
 *
 * **Syntax**: `content | <'width'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-flexbox-1
 */
export const flexBasis: (value: string | number) => string = (value) => `flex-basis: ${value}`;

/**
 * CSS `flex-direction` property.
 *
 * **Syntax**: `row | row-reverse | column | column-reverse`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-flexbox-1
 */
export const flexDirection: (value: string | number) => string = (value) => `flex-direction: ${value}`;

/**
 * CSS `flex-flow` property.
 *
 * **Syntax**: `<'flex-direction'> || <'flex-wrap'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-flexbox-1
 */
export const flexFlow: (value: string | number) => string = (value) => `flex-flow: ${value}`;

/**
 * CSS `flex-grow` property.
 *
 * **Syntax**: `<number [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-flexbox-1
 */
export const flexGrow: (value: string | number) => string = (value) => `flex-grow: ${value}`;

/**
 * CSS `flex-shrink` property.
 *
 * **Syntax**: `<number [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-flexbox-1
 */
export const flexShrink: (value: string | number) => string = (value) => `flex-shrink: ${value}`;

/**
 * CSS `flex-wrap` property.
 *
 * **Syntax**: `nowrap | wrap | wrap-reverse`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-flexbox-1
 */
export const flexWrap: (value: string | number) => string = (value) => `flex-wrap: ${value}`;

/**
 * CSS `float` property.
 *
 * **Syntax**: `block-start | block-end | inline-start | inline-end | snap-block | <snap-block()> | snap-inline | <snap-inline()> | left | right | top | bottom | none | footnote`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-page-floats-3
 */
export const float: (value: string | number) => string = (value) => `float: ${value}`;

/**
 * CSS `float-defer` property.
 *
 * **Syntax**: `<integer> | last | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-page-floats-3
 */
export const floatDefer: (value: string | number) => string = (value) => `float-defer: ${value}`;

/**
 * CSS `float-offset` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-page-floats-3
 */
export const floatOffset: (value: string | number) => string = (value) => `float-offset: ${value}`;

/**
 * CSS `float-reference` property.
 *
 * **Syntax**: `inline | column | region | page`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-page-floats-3
 */
export const floatReference: (value: string | number) => string = (value) => `float-reference: ${value}`;

/**
 * CSS `flood-color` property.
 *
 * **Syntax**: `<color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec filter-effects-1
 */
export const floodColor: (value: string | number) => string = (value) => `flood-color: ${value}`;

/**
 * CSS `flood-opacity` property.
 *
 * **Syntax**: `<'opacity'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec filter-effects-1
 */
export const floodOpacity: (value: string | number) => string = (value) => `flood-opacity: ${value}`;

/**
 * CSS `flow-from` property.
 *
 * **Syntax**: `<custom-ident> | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-regions-1
 */
export const flowFrom: (value: string | number) => string = (value) => `flow-from: ${value}`;

/**
 * CSS `flow-into` property.
 *
 * **Syntax**: `none | <custom-ident> [element | content]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-regions-1
 */
export const flowInto: (value: string | number) => string = (value) => `flow-into: ${value}`;

/**
 * CSS `flow-tolerance` property.
 *
 * **Syntax**: `normal | <length-percentage> | infinite`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-3
 */
export const flowTolerance: (value: string | number) => string = (value) => `flow-tolerance: ${value}`;

/**
 * CSS `font` property.
 *
 * **Syntax**: `[ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-family-name>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const font: (value: string | number) => string = (value) => `font: ${value}`;

/**
 * CSS `font-family` property.
 *
 * **Syntax**: `[ <family-name> | <generic-family> ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontFamily: (value: string | number) => string = (value) => `font-family: ${value}`;

/**
 * CSS `font-feature-settings` property.
 *
 * **Syntax**: `normal | <feature-tag-value>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontFeatureSettings: (value: string | number) => string = (value) => `font-feature-settings: ${value}`;

/**
 * CSS `font-kerning` property.
 *
 * **Syntax**: `auto | normal | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontKerning: (value: string | number) => string = (value) => `font-kerning: ${value}`;

/**
 * CSS `font-language-override` property.
 *
 * **Syntax**: `normal | <string>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontLanguageOverride: (value: string | number) => string = (value) => `font-language-override: ${value}`;

/**
 * CSS `font-optical-sizing` property.
 *
 * **Syntax**: `auto | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontOpticalSizing: (value: string | number) => string = (value) => `font-optical-sizing: ${value}`;

/**
 * CSS `font-palette` property.
 *
 * **Syntax**: `normal | light | dark | <palette-identifier> | <palette-mix()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontPalette: (value: string | number) => string = (value) => `font-palette: ${value}`;

/**
 * CSS `font-size` property.
 *
 * **Syntax**: `<absolute-size> | <relative-size> | <length-percentage [0,∞]> | math`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontSize: (value: Length | number | string) => string = (value) => `font-size: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `font-size-adjust` property.
 *
 * **Syntax**: `none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number [0,∞]> ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-5
 */
export const fontSizeAdjust: (value: string | number) => string = (value) => `font-size-adjust: ${value}`;

/**
 * CSS `font-stretch` property.
 *
 * **Syntax**: `normal | <percentage [0,∞]> | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontStretch: (value: string | number) => string = (value) => `font-stretch: ${value}`;

/**
 * CSS `font-style` property.
 *
 * **Syntax**: `normal | italic | left | right | oblique <angle [-90deg,90deg]>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontStyle: (value: string | number) => string = (value) => `font-style: ${value}`;

/**
 * CSS `font-synthesis` property.
 *
 * **Syntax**: `none | [ weight || style || small-caps || position]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontSynthesis: (value: string | number) => string = (value) => `font-synthesis: ${value}`;

/**
 * CSS `font-synthesis-position` property.
 *
 * **Syntax**: `auto | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontSynthesisPosition: (value: string | number) => string = (value) => `font-synthesis-position: ${value}`;

/**
 * CSS `font-synthesis-small-caps` property.
 *
 * **Syntax**: `auto | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontSynthesisSmallCaps: (value: string | number) => string = (value) => `font-synthesis-small-caps: ${value}`;

/**
 * CSS `font-synthesis-style` property.
 *
 * **Syntax**: `auto | none | oblique-only`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontSynthesisStyle: (value: string | number) => string = (value) => `font-synthesis-style: ${value}`;

/**
 * CSS `font-synthesis-weight` property.
 *
 * **Syntax**: `auto | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontSynthesisWeight: (value: string | number) => string = (value) => `font-synthesis-weight: ${value}`;

/**
 * CSS `font-variant` property.
 *
 * **Syntax**: `normal | none | [ [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ] || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || [ stylistic(<feature-value-name>) || historical-forms || styleset(<feature-value-name>#) || character-variant(<feature-value-name>#) || swash(<feature-value-name>) || ornaments(<feature-value-name>) || annotation(<feature-value-name>) ] || [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ] || [ <east-asian-variant-values> || <east-asian-width-values> || ruby ] || [ sub | super ] || [ text | emoji | unicode ] ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontVariant: (value: string | number) => string = (value) => `font-variant: ${value}`;

/**
 * CSS `font-variant-alternates` property.
 *
 * **Syntax**: `normal | [ stylistic(<feature-value-name>) || historical-forms || styleset(<feature-value-name>#) || character-variant(<feature-value-name>#) || swash(<feature-value-name>) || ornaments(<feature-value-name>) || annotation(<feature-value-name>) ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontVariantAlternates: (value: string | number) => string = (value) => `font-variant-alternates: ${value}`;

/**
 * CSS `font-variant-caps` property.
 *
 * **Syntax**: `normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontVariantCaps: (value: string | number) => string = (value) => `font-variant-caps: ${value}`;

/**
 * CSS `font-variant-east-asian` property.
 *
 * **Syntax**: `normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontVariantEastAsian: (value: string | number) => string = (value) => `font-variant-east-asian: ${value}`;

/**
 * CSS `font-variant-emoji` property.
 *
 * **Syntax**: `normal | text | emoji | unicode`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontVariantEmoji: (value: string | number) => string = (value) => `font-variant-emoji: ${value}`;

/**
 * CSS `font-variant-ligatures` property.
 *
 * **Syntax**: `normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontVariantLigatures: (value: string | number) => string = (value) => `font-variant-ligatures: ${value}`;

/**
 * CSS `font-variant-numeric` property.
 *
 * **Syntax**: `normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontVariantNumeric: (value: string | number) => string = (value) => `font-variant-numeric: ${value}`;

/**
 * CSS `font-variant-position` property.
 *
 * **Syntax**: `normal | sub | super`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontVariantPosition: (value: string | number) => string = (value) => `font-variant-position: ${value}`;

/**
 * CSS `font-variation-settings` property.
 *
 * **Syntax**: `normal | [ <opentype-tag> <number> ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontVariationSettings: (value: string | number) => string = (value) => `font-variation-settings: ${value}`;

/**
 * CSS `font-weight` property.
 *
 * **Syntax**: `<font-weight-absolute> | bolder | lighter`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontWeight: (value: string | number) => string = (value) => `font-weight: ${value}`;

/**
 * CSS `font-width` property.
 *
 * **Syntax**: `normal | <percentage [0,∞]> | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-fonts-4
 */
export const fontWidth: (value: string | number) => string = (value) => `font-width: ${value}`;

/**
 * CSS `footnote-display` property.
 *
 * **Syntax**: `block | inline | compact`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gcpm-3
 */
export const footnoteDisplay: (value: string | number) => string = (value) => `footnote-display: ${value}`;

/**
 * CSS `footnote-policy` property.
 *
 * **Syntax**: `auto | line | block`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gcpm-3
 */
export const footnotePolicy: (value: string | number) => string = (value) => `footnote-policy: ${value}`;

/**
 * CSS `forced-color-adjust` property.
 *
 * **Syntax**: `auto | none | preserve-parent-color`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-color-adjust-1
 */
export const forcedColorAdjust: (value: string | number) => string = (value) => `forced-color-adjust: ${value}`;

/**
 * CSS `gap` property.
 *
 * **Syntax**: `<'row-gap'> <'column-gap'>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const gap: (value: Length | number | string) => string = (value) => `gap: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `glyph-orientation-vertical` property.
 *
 * **Syntax**: `auto | 0deg | 90deg | 0 | 90`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-writing-modes-4
 */
export const glyphOrientationVertical: (value: string | number) => string = (value) => `glyph-orientation-vertical: ${value}`;

/**
 * CSS `grid` property.
 *
 * **Syntax**: `<'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const grid: (value: string | number) => string = (value) => `grid: ${value}`;

/**
 * CSS `grid-area` property.
 *
 * **Syntax**: `<grid-line> [ / <grid-line> ]{0,3}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridArea: (value: string | number) => string = (value) => `grid-area: ${value}`;

/**
 * CSS `grid-auto-columns` property.
 *
 * **Syntax**: `<track-size>+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridAutoColumns: (value: string | number) => string = (value) => `grid-auto-columns: ${value}`;

/**
 * CSS `grid-auto-flow` property.
 *
 * **Syntax**: `[ row | column ] || dense`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridAutoFlow: (value: string | number) => string = (value) => `grid-auto-flow: ${value}`;

/**
 * CSS `grid-auto-rows` property.
 *
 * **Syntax**: `<track-size>+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridAutoRows: (value: string | number) => string = (value) => `grid-auto-rows: ${value}`;

/**
 * CSS `grid-column` property.
 *
 * **Syntax**: `<grid-line> [ / <grid-line> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridColumn: (value: string | number) => string = (value) => `grid-column: ${value}`;

/**
 * CSS `grid-column-end` property.
 *
 * **Syntax**: `<grid-line>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridColumnEnd: (value: string | number) => string = (value) => `grid-column-end: ${value}`;

/**
 * CSS `grid-column-gap` property.
 *
 * **Syntax**: `normal | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const gridColumnGap: (value: string | number) => string = (value) => `grid-column-gap: ${value}`;

/**
 * CSS `grid-column-start` property.
 *
 * **Syntax**: `<grid-line>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridColumnStart: (value: string | number) => string = (value) => `grid-column-start: ${value}`;

/**
 * CSS `grid-gap` property.
 *
 * **Syntax**: `<'row-gap'> <'column-gap'>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const gridGap: (value: string | number) => string = (value) => `grid-gap: ${value}`;

/**
 * CSS `grid-row` property.
 *
 * **Syntax**: `<grid-line> [ / <grid-line> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridRow: (value: string | number) => string = (value) => `grid-row: ${value}`;

/**
 * CSS `grid-row-end` property.
 *
 * **Syntax**: `<grid-line>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridRowEnd: (value: string | number) => string = (value) => `grid-row-end: ${value}`;

/**
 * CSS `grid-row-gap` property.
 *
 * **Syntax**: `normal | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const gridRowGap: (value: string | number) => string = (value) => `grid-row-gap: ${value}`;

/**
 * CSS `grid-row-start` property.
 *
 * **Syntax**: `<grid-line>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridRowStart: (value: string | number) => string = (value) => `grid-row-start: ${value}`;

/**
 * CSS `grid-template` property.
 *
 * **Syntax**: `none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridTemplate: (value: string | number) => string = (value) => `grid-template: ${value}`;

/**
 * CSS `grid-template-areas` property.
 *
 * **Syntax**: `none | <string>+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridTemplateAreas: (value: string | number) => string = (value) => `grid-template-areas: ${value}`;

/**
 * CSS `grid-template-columns` property.
 *
 * **Syntax**: `none | <track-list> | <auto-track-list> | subgrid <line-name-list>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridTemplateColumns: (value: string | number) => string = (value) => `grid-template-columns: ${value}`;

/**
 * CSS `grid-template-rows` property.
 *
 * **Syntax**: `none | <track-list> | <auto-track-list> | subgrid <line-name-list>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-grid-2
 */
export const gridTemplateRows: (value: string | number) => string = (value) => `grid-template-rows: ${value}`;

/**
 * CSS `hanging-punctuation` property.
 *
 * **Syntax**: `none | [ first || [ force-end | allow-end ] || last ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const hangingPunctuation: (value: string | number) => string = (value) => `hanging-punctuation: ${value}`;

/**
 * CSS `height` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | fit-content | contain`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-3
 */
export const height: (value: Length | number | string) => string = (value) => `height: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `hyphenate-character` property.
 *
 * **Syntax**: `auto | <string>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const hyphenateCharacter: (value: string | number) => string = (value) => `hyphenate-character: ${value}`;

/**
 * CSS `hyphenate-limit-chars` property.
 *
 * **Syntax**: `[ auto | <integer> ]{1,3}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const hyphenateLimitChars: (value: string | number) => string = (value) => `hyphenate-limit-chars: ${value}`;

/**
 * CSS `hyphenate-limit-last` property.
 *
 * **Syntax**: `none | always | column | page | spread`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const hyphenateLimitLast: (value: string | number) => string = (value) => `hyphenate-limit-last: ${value}`;

/**
 * CSS `hyphenate-limit-lines` property.
 *
 * **Syntax**: `no-limit | <integer>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const hyphenateLimitLines: (value: string | number) => string = (value) => `hyphenate-limit-lines: ${value}`;

/**
 * CSS `hyphenate-limit-zone` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const hyphenateLimitZone: (value: string | number) => string = (value) => `hyphenate-limit-zone: ${value}`;

/**
 * CSS `hyphens` property.
 *
 * **Syntax**: `none | manual | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const hyphens: (value: string | number) => string = (value) => `hyphens: ${value}`;

/**
 * CSS `image-orientation` property.
 *
 * **Syntax**: `from-image | none | [ <angle> || flip ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-images-3
 */
export const imageOrientation: (value: string | number) => string = (value) => `image-orientation: ${value}`;

/**
 * CSS `image-rendering` property.
 *
 * **Syntax**: `auto | smooth | high-quality | pixelated | crisp-edges`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-images-3
 */
export const imageRendering: (value: string | number) => string = (value) => `image-rendering: ${value}`;

/**
 * CSS `image-resolution` property.
 *
 * **Syntax**: `[ from-image || <resolution> ] && snap?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-images-4
 */
export const imageResolution: (value: string | number) => string = (value) => `image-resolution: ${value}`;

/**
 * CSS `initial-letter` property.
 *
 * **Syntax**: `normal | <number [1,∞]> <integer [1,∞]> | <number [1,∞]> && [ drop | raise ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const initialLetter: (value: string | number) => string = (value) => `initial-letter: ${value}`;

/**
 * CSS `initial-letter-align` property.
 *
 * **Syntax**: `[ border-box? [ alphabetic | ideographic | hanging | leading ]? ]!`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const initialLetterAlign: (value: string | number) => string = (value) => `initial-letter-align: ${value}`;

/**
 * CSS `initial-letter-wrap` property.
 *
 * **Syntax**: `none | first | all | grid | <length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const initialLetterWrap: (value: string | number) => string = (value) => `initial-letter-wrap: ${value}`;

/**
 * CSS `inline-size` property.
 *
 * **Syntax**: `<'width'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const inlineSize: (value: string | number) => string = (value) => `inline-size: ${value}`;

/**
 * CSS `inline-sizing` property.
 *
 * **Syntax**: `normal | stretch`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const inlineSizing: (value: string | number) => string = (value) => `inline-sizing: ${value}`;

/**
 * CSS `input-security` property.
 *
 * **Syntax**: `auto | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-forms-1
 */
export const inputSecurity: (value: string | number) => string = (value) => `input-security: ${value}`;

/**
 * CSS `inset` property.
 *
 * **Syntax**: `<'top'>{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const inset: (inset: ScaleValue, inset2?: ScaleValue, inset3?: ScaleValue, inset4?: ScaleValue) => string = (inset, inset2, inset3, inset4) => {
			const values = [inset, inset2, inset3, inset4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `inset: ${scaled.join(' ')}`;
		};

/**
 * CSS `inset-block` property.
 *
 * **Syntax**: `<'top'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const insetBlock: (value: string | number) => string = (value) => `inset-block: ${value}`;

/**
 * CSS `inset-block-end` property.
 *
 * **Syntax**: `auto | <length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const insetBlockEnd: (value: string | number) => string = (value) => `inset-block-end: ${value}`;

/**
 * CSS `inset-block-start` property.
 *
 * **Syntax**: `auto | <length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const insetBlockStart: (value: string | number) => string = (value) => `inset-block-start: ${value}`;

/**
 * CSS `inset-inline` property.
 *
 * **Syntax**: `<'top'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const insetInline: (value: string | number) => string = (value) => `inset-inline: ${value}`;

/**
 * CSS `inset-inline-end` property.
 *
 * **Syntax**: `auto | <length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const insetInlineEnd: (value: string | number) => string = (value) => `inset-inline-end: ${value}`;

/**
 * CSS `inset-inline-start` property.
 *
 * **Syntax**: `auto | <length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const insetInlineStart: (value: string | number) => string = (value) => `inset-inline-start: ${value}`;

/**
 * CSS `interactivity` property.
 *
 * **Syntax**: `auto | inert`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const interactivity: (value: string | number) => string = (value) => `interactivity: ${value}`;

/**
 * CSS `interest-delay` property.
 *
 * **Syntax**: `<'interest-delay-start'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const interestDelay: (value: string | number) => string = (value) => `interest-delay: ${value}`;

/**
 * CSS `interest-delay-end` property.
 *
 * **Syntax**: `normal | <time>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const interestDelayEnd: (value: string | number) => string = (value) => `interest-delay-end: ${value}`;

/**
 * CSS `interest-delay-start` property.
 *
 * **Syntax**: `normal | <time>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const interestDelayStart: (value: string | number) => string = (value) => `interest-delay-start: ${value}`;

/**
 * CSS `interpolate-size` property.
 *
 * **Syntax**: `numeric-only | allow-keywords`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-values-5
 */
export const interpolateSize: (value: string | number) => string = (value) => `interpolate-size: ${value}`;

/**
 * CSS `isolation` property.
 *
 * **Syntax**: `<isolation-mode>`
 *
 * **Status**: 🟢 modern
 *
 * @spec compositing-2
 */
export const isolation: (value: string | number) => string = (value) => `isolation: ${value}`;

/**
 * CSS `justify-content` property.
 *
 * **Syntax**: `normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const justifyContent: (value: string | number) => string = (value) => `justify-content: ${value}`;

/**
 * CSS `justify-items` property.
 *
 * **Syntax**: `normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ] | anchor-center`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const justifyItems: (value: string | number) => string = (value) => `justify-items: ${value}`;

/**
 * CSS `justify-self` property.
 *
 * **Syntax**: `auto | <overflow-position>? [ normal | <self-position> | left | right ] | stretch | <baseline-position> | anchor-center`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const justifySelf: (value: string | number) => string = (value) => `justify-self: ${value}`;

/**
 * CSS `left` property.
 *
 * **Syntax**: `auto | <length-percentage> | <anchor()> | <anchor-size()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const left: (value: Length | number | string) => string = (value) => `left: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `letter-spacing` property.
 *
 * **Syntax**: `normal | <length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const letterSpacing: (value: Length | number | string) => string = (value) => `letter-spacing: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `lighting-color` property.
 *
 * **Syntax**: `<color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec filter-effects-1
 */
export const lightingColor: (value: string | number) => string = (value) => `lighting-color: ${value}`;

/**
 * CSS `line-break` property.
 *
 * **Syntax**: `auto | loose | normal | strict | anywhere`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const lineBreak: (value: string | number) => string = (value) => `line-break: ${value}`;

/**
 * CSS `line-clamp` property.
 *
 * **Syntax**: `none | [<integer [1,∞]> || <'block-ellipsis'>] -webkit-legacy?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const lineClamp: (value: string | number) => string = (value) => `line-clamp: ${value}`;

/**
 * CSS `line-fit-edge` property.
 *
 * **Syntax**: `leading | <text-edge>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const lineFitEdge: (value: string | number) => string = (value) => `line-fit-edge: ${value}`;

/**
 * CSS `line-grid` property.
 *
 * **Syntax**: `match-parent | create`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-line-grid-1
 */
export const lineGrid: (value: string | number) => string = (value) => `line-grid: ${value}`;

/**
 * CSS `line-height` property.
 *
 * **Syntax**: `normal | <number [0,∞]> | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const lineHeight: (value: Length | number | string) => string = (value) => `line-height: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `line-height-step` property.
 *
 * **Syntax**: `<length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-rhythm-1
 */
export const lineHeightStep: (value: string | number) => string = (value) => `line-height-step: ${value}`;

/**
 * CSS `line-padding` property.
 *
 * **Syntax**: `<length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const linePadding: (value: string | number) => string = (value) => `line-padding: ${value}`;

/**
 * CSS `line-snap` property.
 *
 * **Syntax**: `none | baseline | contain`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-line-grid-1
 */
export const lineSnap: (value: string | number) => string = (value) => `line-snap: ${value}`;

/**
 * CSS `link-parameters` property.
 *
 * **Syntax**: `none | <param()>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-link-params-1
 */
export const linkParameters: (value: string | number) => string = (value) => `link-parameters: ${value}`;

/**
 * CSS `list-style` property.
 *
 * **Syntax**: `<'list-style-position'> || <'list-style-image'> || <'list-style-type'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-lists-3
 */
export const listStyle: (value: string | number) => string = (value) => `list-style: ${value}`;

/**
 * CSS `list-style-image` property.
 *
 * **Syntax**: `<image> | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-lists-3
 */
export const listStyleImage: (value: string | number) => string = (value) => `list-style-image: ${value}`;

/**
 * CSS `list-style-position` property.
 *
 * **Syntax**: `inside | outside`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-lists-3
 */
export const listStylePosition: (value: string | number) => string = (value) => `list-style-position: ${value}`;

/**
 * CSS `list-style-type` property.
 *
 * **Syntax**: `<counter-style> | <string> | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-lists-3
 */
export const listStyleType: (value: string | number) => string = (value) => `list-style-type: ${value}`;

/**
 * CSS `margin` property.
 *
 * **Syntax**: `<'margin-top'>{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const margin: (margin: ScaleValue, margin2?: ScaleValue, margin3?: ScaleValue, margin4?: ScaleValue) => string = (margin, margin2, margin3, margin4) => {
			const values = [margin, margin2, margin3, margin4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `margin: ${scaled.join(' ')}`;
		};

/**
 * CSS `margin-block` property.
 *
 * **Syntax**: `<'margin-top'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const marginBlock: (value: string | number) => string = (value) => `margin-block: ${value}`;

/**
 * CSS `margin-block-end` property.
 *
 * **Syntax**: `<'margin-top'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const marginBlockEnd: (value: string | number) => string = (value) => `margin-block-end: ${value}`;

/**
 * CSS `margin-block-start` property.
 *
 * **Syntax**: `<'margin-top'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const marginBlockStart: (value: string | number) => string = (value) => `margin-block-start: ${value}`;

/**
 * CSS `margin-bottom` property.
 *
 * **Syntax**: `<length-percentage> | auto | <anchor-size()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const marginBottom: (marginBottom: ScaleValue, marginBottom2?: ScaleValue, marginBottom3?: ScaleValue, marginBottom4?: ScaleValue) => string = (marginBottom, marginBottom2, marginBottom3, marginBottom4) => {
			const values = [marginBottom, marginBottom2, marginBottom3, marginBottom4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `margin-bottom: ${scaled.join(' ')}`;
		};

/**
 * CSS `margin-break` property.
 *
 * **Syntax**: `auto | keep | discard`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-break-4
 */
export const marginBreak: (value: string | number) => string = (value) => `margin-break: ${value}`;

/**
 * CSS `margin-inline` property.
 *
 * **Syntax**: `<'margin-top'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const marginInline: (value: string | number) => string = (value) => `margin-inline: ${value}`;

/**
 * CSS `margin-inline-end` property.
 *
 * **Syntax**: `<'margin-top'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const marginInlineEnd: (value: string | number) => string = (value) => `margin-inline-end: ${value}`;

/**
 * CSS `margin-inline-start` property.
 *
 * **Syntax**: `<'margin-top'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const marginInlineStart: (value: string | number) => string = (value) => `margin-inline-start: ${value}`;

/**
 * CSS `margin-left` property.
 *
 * **Syntax**: `<length-percentage> | auto | <anchor-size()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const marginLeft: (marginLeft: ScaleValue, marginLeft2?: ScaleValue, marginLeft3?: ScaleValue, marginLeft4?: ScaleValue) => string = (marginLeft, marginLeft2, marginLeft3, marginLeft4) => {
			const values = [marginLeft, marginLeft2, marginLeft3, marginLeft4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `margin-left: ${scaled.join(' ')}`;
		};

/**
 * CSS `margin-right` property.
 *
 * **Syntax**: `<length-percentage> | auto | <anchor-size()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const marginRight: (marginRight: ScaleValue, marginRight2?: ScaleValue, marginRight3?: ScaleValue, marginRight4?: ScaleValue) => string = (marginRight, marginRight2, marginRight3, marginRight4) => {
			const values = [marginRight, marginRight2, marginRight3, marginRight4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `margin-right: ${scaled.join(' ')}`;
		};

/**
 * CSS `margin-top` property.
 *
 * **Syntax**: `<length-percentage> | auto | <anchor-size()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const marginTop: (marginTop: ScaleValue, marginTop2?: ScaleValue, marginTop3?: ScaleValue, marginTop4?: ScaleValue) => string = (marginTop, marginTop2, marginTop3, marginTop4) => {
			const values = [marginTop, marginTop2, marginTop3, marginTop4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `margin-top: ${scaled.join(' ')}`;
		};

/**
 * CSS `margin-trim` property.
 *
 * **Syntax**: `none | [ block || inline ] | [ block-start || inline-start || block-end || inline-end ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const marginTrim: (value: string | number) => string = (value) => `margin-trim: ${value}`;

/**
 * CSS `marker` property.
 *
 * **Syntax**: `none | <marker-ref>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const marker: (value: string | number) => string = (value) => `marker: ${value}`;

/**
 * CSS `marker-end` property.
 *
 * **Syntax**: `none | <marker-ref>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const markerEnd: (value: string | number) => string = (value) => `marker-end: ${value}`;

/**
 * CSS `marker-mid` property.
 *
 * **Syntax**: `none | <marker-ref>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const markerMid: (value: string | number) => string = (value) => `marker-mid: ${value}`;

/**
 * CSS `marker-side` property.
 *
 * **Syntax**: `match-self | match-parent`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-lists-3
 */
export const markerSide: (value: string | number) => string = (value) => `marker-side: ${value}`;

/**
 * CSS `marker-start` property.
 *
 * **Syntax**: `none | <marker-ref>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const markerStart: (value: string | number) => string = (value) => `marker-start: ${value}`;

/**
 * CSS `mask` property.
 *
 * **Syntax**: `<mask-layer>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const mask: (value: string | number) => string = (value) => `mask: ${value}`;

/**
 * CSS `mask-border` property.
 *
 * **Syntax**: `<'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskBorder: (value: string | number) => string = (value) => `mask-border: ${value}`;

/**
 * CSS `mask-border-mode` property.
 *
 * **Syntax**: `luminance | alpha`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskBorderMode: (value: string | number) => string = (value) => `mask-border-mode: ${value}`;

/**
 * CSS `mask-border-outset` property.
 *
 * **Syntax**: `[ <length> | <number> ]{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskBorderOutset: (value: string | number) => string = (value) => `mask-border-outset: ${value}`;

/**
 * CSS `mask-border-repeat` property.
 *
 * **Syntax**: `[ stretch | repeat | round | space ]{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskBorderRepeat: (value: string | number) => string = (value) => `mask-border-repeat: ${value}`;

/**
 * CSS `mask-border-slice` property.
 *
 * **Syntax**: `[ <number> | <percentage> ]{1,4} fill?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskBorderSlice: (value: string | number) => string = (value) => `mask-border-slice: ${value}`;

/**
 * CSS `mask-border-source` property.
 *
 * **Syntax**: `none | <image>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskBorderSource: (value: string | number) => string = (value) => `mask-border-source: ${value}`;

/**
 * CSS `mask-border-width` property.
 *
 * **Syntax**: `[ <length-percentage> | <number> | auto ]{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskBorderWidth: (value: string | number) => string = (value) => `mask-border-width: ${value}`;

/**
 * CSS `mask-clip` property.
 *
 * **Syntax**: `[ <coord-box> | no-clip ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskClip: (value: string | number) => string = (value) => `mask-clip: ${value}`;

/**
 * CSS `mask-composite` property.
 *
 * **Syntax**: `<compositing-operator>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskComposite: (value: string | number) => string = (value) => `mask-composite: ${value}`;

/**
 * CSS `mask-image` property.
 *
 * **Syntax**: `<mask-reference>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskImage: (value: string | number) => string = (value) => `mask-image: ${value}`;

/**
 * CSS `mask-mode` property.
 *
 * **Syntax**: `<masking-mode>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskMode: (value: string | number) => string = (value) => `mask-mode: ${value}`;

/**
 * CSS `mask-origin` property.
 *
 * **Syntax**: `<coord-box>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskOrigin: (value: string | number) => string = (value) => `mask-origin: ${value}`;

/**
 * CSS `mask-position` property.
 *
 * **Syntax**: `<position>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskPosition: (value: string | number) => string = (value) => `mask-position: ${value}`;

/**
 * CSS `mask-repeat` property.
 *
 * **Syntax**: `<repeat-style>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskRepeat: (value: string | number) => string = (value) => `mask-repeat: ${value}`;

/**
 * CSS `mask-size` property.
 *
 * **Syntax**: `<bg-size>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskSize: (value: string | number) => string = (value) => `mask-size: ${value}`;

/**
 * CSS `mask-type` property.
 *
 * **Syntax**: `luminance | alpha`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-masking-1
 */
export const maskType: (value: string | number) => string = (value) => `mask-type: ${value}`;

/**
 * CSS `math-depth` property.
 *
 * **Syntax**: `auto-add | add(<integer>) | <integer>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const mathDepth: (value: string | number) => string = (value) => `math-depth: ${value}`;

/**
 * CSS `math-shift` property.
 *
 * **Syntax**: `normal | compact`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const mathShift: (value: string | number) => string = (value) => `math-shift: ${value}`;

/**
 * CSS `math-style` property.
 *
 * **Syntax**: `normal | compact`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const mathStyle: (value: string | number) => string = (value) => `math-style: ${value}`;

/**
 * CSS `max-block-size` property.
 *
 * **Syntax**: `<'max-width'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const maxBlockSize: (value: string | number) => string = (value) => `max-block-size: ${value}`;

/**
 * CSS `max-height` property.
 *
 * **Syntax**: `none | <length-percentage [0,∞]> | min-content | max-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | fit-content | contain`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-3
 */
export const maxHeight: (value: Length | number | string) => string = (value) => `max-height: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `max-inline-size` property.
 *
 * **Syntax**: `<'max-width'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const maxInlineSize: (value: string | number) => string = (value) => `max-inline-size: ${value}`;

/**
 * CSS `max-lines` property.
 *
 * **Syntax**: `none | <integer [1,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const maxLines: (value: string | number) => string = (value) => `max-lines: ${value}`;

/**
 * CSS `max-width` property.
 *
 * **Syntax**: `none | <length-percentage [0,∞]> | min-content | max-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | fit-content | contain`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-3
 */
export const maxWidth: (value: Length | number | string) => string = (value) => `max-width: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `min-block-size` property.
 *
 * **Syntax**: `<'min-width'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const minBlockSize: (value: string | number) => string = (value) => `min-block-size: ${value}`;

/**
 * CSS `min-height` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | fit-content | contain`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-3
 */
export const minHeight: (value: Length | number | string) => string = (value) => `min-height: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `min-inline-size` property.
 *
 * **Syntax**: `<'min-width'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const minInlineSize: (value: string | number) => string = (value) => `min-inline-size: ${value}`;

/**
 * CSS `min-intrinsic-sizing` property.
 *
 * **Syntax**: `legacy | zero-if-scroll || zero-if-extrinsic`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-4
 */
export const minIntrinsicSizing: (value: string | number) => string = (value) => `min-intrinsic-sizing: ${value}`;

/**
 * CSS `min-width` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | fit-content | contain`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-3
 */
export const minWidth: (value: Length | number | string) => string = (value) => `min-width: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `mix-blend-mode` property.
 *
 * **Syntax**: `<blend-mode> | plus-lighter`
 *
 * **Status**: 🟢 modern
 *
 * @spec compositing-2
 */
export const mixBlendMode: (value: string | number) => string = (value) => `mix-blend-mode: ${value}`;

/**
 * CSS `nav-down` property.
 *
 * **Syntax**: `auto | <id> [ current | root | <target-name> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const navDown: (value: string | number) => string = (value) => `nav-down: ${value}`;

/**
 * CSS `nav-left` property.
 *
 * **Syntax**: `auto | <id> [ current | root | <target-name> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const navLeft: (value: string | number) => string = (value) => `nav-left: ${value}`;

/**
 * CSS `nav-right` property.
 *
 * **Syntax**: `auto | <id> [ current | root | <target-name> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const navRight: (value: string | number) => string = (value) => `nav-right: ${value}`;

/**
 * CSS `nav-up` property.
 *
 * **Syntax**: `auto | <id> [ current | root | <target-name> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const navUp: (value: string | number) => string = (value) => `nav-up: ${value}`;

/**
 * CSS `object-fit` property.
 *
 * **Syntax**: `fill | none | [contain | cover] || scale-down`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-images-4
 */
export const objectFit: (value: string | number) => string = (value) => `object-fit: ${value}`;

/**
 * CSS `object-position` property.
 *
 * **Syntax**: `<position>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-images-3
 */
export const objectPosition: (value: string | number) => string = (value) => `object-position: ${value}`;

/**
 * CSS `object-view-box` property.
 *
 * **Syntax**: `none | <basic-shape-rect>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-images-5
 */
export const objectViewBox: (value: string | number) => string = (value) => `object-view-box: ${value}`;

/**
 * CSS `offset` property.
 *
 * **Syntax**: `[ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec motion-1
 */
export const offset: (value: string | number) => string = (value) => `offset: ${value}`;

/**
 * CSS `offset-anchor` property.
 *
 * **Syntax**: `auto | <position>`
 *
 * **Status**: 🟢 modern
 *
 * @spec motion-1
 */
export const offsetAnchor: (value: string | number) => string = (value) => `offset-anchor: ${value}`;

/**
 * CSS `offset-distance` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec motion-1
 */
export const offsetDistance: (value: string | number) => string = (value) => `offset-distance: ${value}`;

/**
 * CSS `offset-path` property.
 *
 * **Syntax**: `none | <offset-path> || <coord-box>`
 *
 * **Status**: 🟢 modern
 *
 * @spec motion-1
 */
export const offsetPath: (value: string | number) => string = (value) => `offset-path: ${value}`;

/**
 * CSS `offset-position` property.
 *
 * **Syntax**: `normal | auto | <position>`
 *
 * **Status**: 🟢 modern
 *
 * @spec motion-1
 */
export const offsetPosition: (value: string | number) => string = (value) => `offset-position: ${value}`;

/**
 * CSS `offset-rotate` property.
 *
 * **Syntax**: `[ auto | reverse ] || <angle>`
 *
 * **Status**: 🟢 modern
 *
 * @spec motion-1
 */
export const offsetRotate: (value: string | number) => string = (value) => `offset-rotate: ${value}`;

/**
 * CSS `opacity` property.
 *
 * **Syntax**: `<opacity-value>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-color-4
 */
export const opacity: (value: string | number) => string = (value) => `opacity: ${value}`;

/**
 * CSS `order` property.
 *
 * **Syntax**: `<integer>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-display-4
 */
export const order: (value: string | number) => string = (value) => `order: ${value}`;

/**
 * CSS `orphans` property.
 *
 * **Syntax**: `<integer [1,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-break-4
 */
export const orphans: (value: string | number) => string = (value) => `orphans: ${value}`;

/**
 * CSS `outline` property.
 *
 * **Syntax**: `<'outline-width'> || <'outline-style'> || <'outline-color'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const outline: (value: string | number) => string = (value) => `outline: ${value}`;

/**
 * CSS `outline-color` property.
 *
 * **Syntax**: `auto | <'border-top-color'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const outlineColor: (value: string | number) => string = (value) => `outline-color: ${value}`;

/**
 * CSS `outline-offset` property.
 *
 * **Syntax**: `<length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const outlineOffset: (value: Length | number | string) => string = (value) => `outline-offset: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `outline-style` property.
 *
 * **Syntax**: `auto | <outline-line-style>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const outlineStyle: (value: string | number) => string = (value) => `outline-style: ${value}`;

/**
 * CSS `outline-width` property.
 *
 * **Syntax**: `<line-width>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const outlineWidth: (value: Length | number | string) => string = (value) => `outline-width: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `overflow` property.
 *
 * **Syntax**: `<'overflow-block'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-3
 */
export const overflow: (value: string | number) => string = (value) => `overflow: ${value}`;

/**
 * CSS `overflow-anchor` property.
 *
 * **Syntax**: `auto | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-anchoring-1
 */
export const overflowAnchor: (value: string | number) => string = (value) => `overflow-anchor: ${value}`;

/**
 * CSS `overflow-block` property.
 *
 * **Syntax**: `visible | hidden | clip | scroll | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-3
 */
export const overflowBlock: (value: string | number) => string = (value) => `overflow-block: ${value}`;

/**
 * CSS `overflow-clip-margin` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMargin: (value: string | number) => string = (value) => `overflow-clip-margin: ${value}`;

/**
 * CSS `overflow-clip-margin-block` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMarginBlock: (value: string | number) => string = (value) => `overflow-clip-margin-block: ${value}`;

/**
 * CSS `overflow-clip-margin-block-end` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMarginBlockEnd: (value: string | number) => string = (value) => `overflow-clip-margin-block-end: ${value}`;

/**
 * CSS `overflow-clip-margin-block-start` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMarginBlockStart: (value: string | number) => string = (value) => `overflow-clip-margin-block-start: ${value}`;

/**
 * CSS `overflow-clip-margin-bottom` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMarginBottom: (value: string | number) => string = (value) => `overflow-clip-margin-bottom: ${value}`;

/**
 * CSS `overflow-clip-margin-inline` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMarginInline: (value: string | number) => string = (value) => `overflow-clip-margin-inline: ${value}`;

/**
 * CSS `overflow-clip-margin-inline-end` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMarginInlineEnd: (value: string | number) => string = (value) => `overflow-clip-margin-inline-end: ${value}`;

/**
 * CSS `overflow-clip-margin-inline-start` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMarginInlineStart: (value: string | number) => string = (value) => `overflow-clip-margin-inline-start: ${value}`;

/**
 * CSS `overflow-clip-margin-left` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMarginLeft: (value: string | number) => string = (value) => `overflow-clip-margin-left: ${value}`;

/**
 * CSS `overflow-clip-margin-right` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMarginRight: (value: string | number) => string = (value) => `overflow-clip-margin-right: ${value}`;

/**
 * CSS `overflow-clip-margin-top` property.
 *
 * **Syntax**: `<visual-box> || <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const overflowClipMarginTop: (value: string | number) => string = (value) => `overflow-clip-margin-top: ${value}`;

/**
 * CSS `overflow-inline` property.
 *
 * **Syntax**: `visible | hidden | clip | scroll | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-3
 */
export const overflowInline: (value: string | number) => string = (value) => `overflow-inline: ${value}`;

/**
 * CSS `overflow-wrap` property.
 *
 * **Syntax**: `normal | break-word | anywhere`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const overflowWrap: (value: string | number) => string = (value) => `overflow-wrap: ${value}`;

/**
 * CSS `overflow-x` property.
 *
 * **Syntax**: `visible | hidden | clip | scroll | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-3
 */
export const overflowX: (value: string | number) => string = (value) => `overflow-x: ${value}`;

/**
 * CSS `overflow-y` property.
 *
 * **Syntax**: `visible | hidden | clip | scroll | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-3
 */
export const overflowY: (value: string | number) => string = (value) => `overflow-y: ${value}`;

/**
 * CSS `overlay` property.
 *
 * **Syntax**: `none | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-4
 */
export const overlay: (value: string | number) => string = (value) => `overlay: ${value}`;

/**
 * CSS `overscroll-behavior` property.
 *
 * **Syntax**: `[ contain | none | auto ]{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overscroll-1
 */
export const overscrollBehavior: (value: string | number) => string = (value) => `overscroll-behavior: ${value}`;

/**
 * CSS `overscroll-behavior-block` property.
 *
 * **Syntax**: `contain | none | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overscroll-1
 */
export const overscrollBehaviorBlock: (value: string | number) => string = (value) => `overscroll-behavior-block: ${value}`;

/**
 * CSS `overscroll-behavior-inline` property.
 *
 * **Syntax**: `contain | none | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overscroll-1
 */
export const overscrollBehaviorInline: (value: string | number) => string = (value) => `overscroll-behavior-inline: ${value}`;

/**
 * CSS `overscroll-behavior-x` property.
 *
 * **Syntax**: `contain | none | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overscroll-1
 */
export const overscrollBehaviorX: (value: string | number) => string = (value) => `overscroll-behavior-x: ${value}`;

/**
 * CSS `overscroll-behavior-y` property.
 *
 * **Syntax**: `contain | none | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overscroll-1
 */
export const overscrollBehaviorY: (value: string | number) => string = (value) => `overscroll-behavior-y: ${value}`;

/**
 * CSS `padding` property.
 *
 * **Syntax**: `<'padding-top'>{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const padding: (padding: ScaleValue, padding2?: ScaleValue, padding3?: ScaleValue, padding4?: ScaleValue) => string = (padding, padding2, padding3, padding4) => {
			const values = [padding, padding2, padding3, padding4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `padding: ${scaled.join(' ')}`;
		};

/**
 * CSS `padding-block` property.
 *
 * **Syntax**: `<'padding-top'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const paddingBlock: (value: string | number) => string = (value) => `padding-block: ${value}`;

/**
 * CSS `padding-block-end` property.
 *
 * **Syntax**: `<'padding-top'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const paddingBlockEnd: (value: string | number) => string = (value) => `padding-block-end: ${value}`;

/**
 * CSS `padding-block-start` property.
 *
 * **Syntax**: `<'padding-top'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const paddingBlockStart: (value: string | number) => string = (value) => `padding-block-start: ${value}`;

/**
 * CSS `padding-bottom` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const paddingBottom: (paddingBottom: ScaleValue, paddingBottom2?: ScaleValue, paddingBottom3?: ScaleValue, paddingBottom4?: ScaleValue) => string = (paddingBottom, paddingBottom2, paddingBottom3, paddingBottom4) => {
			const values = [paddingBottom, paddingBottom2, paddingBottom3, paddingBottom4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `padding-bottom: ${scaled.join(' ')}`;
		};

/**
 * CSS `padding-inline` property.
 *
 * **Syntax**: `<'padding-top'>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const paddingInline: (value: string | number) => string = (value) => `padding-inline: ${value}`;

/**
 * CSS `padding-inline-end` property.
 *
 * **Syntax**: `<'padding-top'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const paddingInlineEnd: (value: string | number) => string = (value) => `padding-inline-end: ${value}`;

/**
 * CSS `padding-inline-start` property.
 *
 * **Syntax**: `<'padding-top'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-logical-1
 */
export const paddingInlineStart: (value: string | number) => string = (value) => `padding-inline-start: ${value}`;

/**
 * CSS `padding-left` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const paddingLeft: (paddingLeft: ScaleValue, paddingLeft2?: ScaleValue, paddingLeft3?: ScaleValue, paddingLeft4?: ScaleValue) => string = (paddingLeft, paddingLeft2, paddingLeft3, paddingLeft4) => {
			const values = [paddingLeft, paddingLeft2, paddingLeft3, paddingLeft4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `padding-left: ${scaled.join(' ')}`;
		};

/**
 * CSS `padding-right` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const paddingRight: (paddingRight: ScaleValue, paddingRight2?: ScaleValue, paddingRight3?: ScaleValue, paddingRight4?: ScaleValue) => string = (paddingRight, paddingRight2, paddingRight3, paddingRight4) => {
			const values = [paddingRight, paddingRight2, paddingRight3, paddingRight4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `padding-right: ${scaled.join(' ')}`;
		};

/**
 * CSS `padding-top` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-box-4
 */
export const paddingTop: (paddingTop: ScaleValue, paddingTop2?: ScaleValue, paddingTop3?: ScaleValue, paddingTop4?: ScaleValue) => string = (paddingTop, paddingTop2, paddingTop3, paddingTop4) => {
			const values = [paddingTop, paddingTop2, paddingTop3, paddingTop4].filter(v => v !== undefined);
			const scaled = values.map(v => typeof v === 'number' ? scaleValue(v) : v);
			return `padding-top: ${scaled.join(' ')}`;
		};

/**
 * CSS `page` property.
 *
 * **Syntax**: `auto | <custom-ident>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-page-3
 */
export const page: (value: string | number) => string = (value) => `page: ${value}`;

/**
 * CSS `page-break-after` property.
 *
 * **Syntax**: `auto | always | avoid | left | right | inherit`
 *
 * **Status**: 🟢 modern
 *
 * @spec css2
 */
export const pageBreakAfter: (value: string | number) => string = (value) => `page-break-after: ${value}`;

/**
 * CSS `page-break-before` property.
 *
 * **Syntax**: `auto | always | avoid | left | right | inherit`
 *
 * **Status**: 🟢 modern
 *
 * @spec css2
 */
export const pageBreakBefore: (value: string | number) => string = (value) => `page-break-before: ${value}`;

/**
 * CSS `page-break-inside` property.
 *
 * **Syntax**: `avoid | auto | inherit`
 *
 * **Status**: 🟢 modern
 *
 * @spec css2
 */
export const pageBreakInside: (value: string | number) => string = (value) => `page-break-inside: ${value}`;

/**
 * CSS `paint-order` property.
 *
 * **Syntax**: `normal | [ fill || stroke || markers ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const paintOrder: (value: string | number) => string = (value) => `paint-order: ${value}`;

/**
 * CSS `pause` property.
 *
 * **Syntax**: `<'pause-before'> <'pause-after'>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const pause: (value: string | number) => string = (value) => `pause: ${value}`;

/**
 * CSS `pause-after` property.
 *
 * **Syntax**: `<time [0s,∞]> | none | x-weak | weak | medium | strong | x-strong`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const pauseAfter: (value: string | number) => string = (value) => `pause-after: ${value}`;

/**
 * CSS `pause-before` property.
 *
 * **Syntax**: `<time [0s,∞]> | none | x-weak | weak | medium | strong | x-strong`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const pauseBefore: (value: string | number) => string = (value) => `pause-before: ${value}`;

/**
 * CSS `perspective` property.
 *
 * **Syntax**: `none | <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transforms-2
 */
export const perspective: (value: string | number) => string = (value) => `perspective: ${value}`;

/**
 * CSS `perspective-origin` property.
 *
 * **Syntax**: `<position>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transforms-2
 */
export const perspectiveOrigin: (value: string | number) => string = (value) => `perspective-origin: ${value}`;

/**
 * CSS `place-content` property.
 *
 * **Syntax**: `<'align-content'> <'justify-content'>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const placeContent: (value: string | number) => string = (value) => `place-content: ${value}`;

/**
 * CSS `place-items` property.
 *
 * **Syntax**: `<'align-items'> <'justify-items'>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const placeItems: (value: string | number) => string = (value) => `place-items: ${value}`;

/**
 * CSS `place-self` property.
 *
 * **Syntax**: `<'align-self'> <'justify-self'>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const placeSelf: (value: string | number) => string = (value) => `place-self: ${value}`;

/**
 * CSS `pointer-events` property.
 *
 * **Syntax**: `auto | bounding-box | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const pointerEvents: (value: string | number) => string = (value) => `pointer-events: ${value}`;

/**
 * CSS `pointer-timeline` property.
 *
 * **Syntax**: `[ <'pointer-timeline-name'> <'pointer-timeline-axis'>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec pointer-animations-1
 */
export const pointerTimeline: (value: string | number) => string = (value) => `pointer-timeline: ${value}`;

/**
 * CSS `pointer-timeline-axis` property.
 *
 * **Syntax**: `[ block | inline | x | y ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec pointer-animations-1
 */
export const pointerTimelineAxis: (value: string | number) => string = (value) => `pointer-timeline-axis: ${value}`;

/**
 * CSS `pointer-timeline-name` property.
 *
 * **Syntax**: `[ none | <dashed-ident> ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec pointer-animations-1
 */
export const pointerTimelineName: (value: string | number) => string = (value) => `pointer-timeline-name: ${value}`;

/**
 * CSS `position` property.
 *
 * **Syntax**: `static | relative | absolute | sticky | fixed | <running()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const position: (value: string | number) => string = (value) => `position: ${value}`;

/**
 * CSS `position-anchor` property.
 *
 * **Syntax**: `normal | none | auto | <anchor-name>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-anchor-position-1
 */
export const positionAnchor: (value: string | number) => string = (value) => `position-anchor: ${value}`;

/**
 * CSS `position-area` property.
 *
 * **Syntax**: `none | <position-area>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-anchor-position-1
 */
export const positionArea: (value: string | number) => string = (value) => `position-area: ${value}`;

/**
 * CSS `position-try` property.
 *
 * **Syntax**: `<'position-try-order'>? <'position-try-fallbacks'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-anchor-position-1
 */
export const positionTry: (value: string | number) => string = (value) => `position-try: ${value}`;

/**
 * CSS `position-try-fallbacks` property.
 *
 * **Syntax**: `none | [ [<dashed-ident> || <try-tactic>] | <position-area> ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-anchor-position-1
 */
export const positionTryFallbacks: (value: string | number) => string = (value) => `position-try-fallbacks: ${value}`;

/**
 * CSS `position-try-order` property.
 *
 * **Syntax**: `normal | <try-size>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-anchor-position-1
 */
export const positionTryOrder: (value: string | number) => string = (value) => `position-try-order: ${value}`;

/**
 * CSS `position-visibility` property.
 *
 * **Syntax**: `always | [ anchors-valid || anchors-visible || no-overflow ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-anchor-position-1
 */
export const positionVisibility: (value: string | number) => string = (value) => `position-visibility: ${value}`;

/**
 * CSS `print-color-adjust` property.
 *
 * **Syntax**: `economy | exact`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-color-adjust-1
 */
export const printColorAdjust: (value: string | number) => string = (value) => `print-color-adjust: ${value}`;

/**
 * CSS `quotes` property.
 *
 * **Syntax**: `auto | none | match-parent | [ <string> <string> ]+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-content-3
 */
export const quotes: (value: string | number) => string = (value) => `quotes: ${value}`;

/**
 * CSS `r` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const r: (value: string | number) => string = (value) => `r: ${value}`;

/**
 * CSS `reading-flow` property.
 *
 * **Syntax**: `normal | source-order | flex-visual | flex-flow | grid-rows | grid-columns | grid-order`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-display-4
 */
export const readingFlow: (value: string | number) => string = (value) => `reading-flow: ${value}`;

/**
 * CSS `reading-order` property.
 *
 * **Syntax**: `<integer>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-display-4
 */
export const readingOrder: (value: string | number) => string = (value) => `reading-order: ${value}`;

/**
 * CSS `region-fragment` property.
 *
 * **Syntax**: `auto | break`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-regions-1
 */
export const regionFragment: (value: string | number) => string = (value) => `region-fragment: ${value}`;

/**
 * CSS `resize` property.
 *
 * **Syntax**: `none | both | horizontal | vertical | block | inline`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const resize: (value: string | number) => string = (value) => `resize: ${value}`;

/**
 * CSS `rest` property.
 *
 * **Syntax**: `<'rest-before'> <'rest-after'>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const rest: (value: string | number) => string = (value) => `rest: ${value}`;

/**
 * CSS `rest-after` property.
 *
 * **Syntax**: `<time [0s,∞]> | none | x-weak | weak | medium | strong | x-strong`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const restAfter: (value: string | number) => string = (value) => `rest-after: ${value}`;

/**
 * CSS `rest-before` property.
 *
 * **Syntax**: `<time [0s,∞]> | none | x-weak | weak | medium | strong | x-strong`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const restBefore: (value: string | number) => string = (value) => `rest-before: ${value}`;

/**
 * CSS `right` property.
 *
 * **Syntax**: `auto | <length-percentage> | <anchor()> | <anchor-size()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const right: (value: Length | number | string) => string = (value) => `right: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `rotate` property.
 *
 * **Syntax**: `none | <angle> | [ x | y | z | <number>{3} ] && <angle>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transforms-2
 */
export const rotate: (value: string | number) => string = (value) => `rotate: ${value}`;

/**
 * CSS `row-gap` property.
 *
 * **Syntax**: `normal | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-align-3
 */
export const rowGap: (value: Length | number | string) => string = (value) => `row-gap: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `row-rule` property.
 *
 * **Syntax**: `<gap-rule-list> | <gap-auto-rule-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRule: (value: string | number) => string = (value) => `row-rule: ${value}`;

/**
 * CSS `row-rule-break` property.
 *
 * **Syntax**: `none | spanning-item | intersection`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleBreak: (value: string | number) => string = (value) => `row-rule-break: ${value}`;

/**
 * CSS `row-rule-color` property.
 *
 * **Syntax**: `<line-color-list> | <auto-line-color-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleColor: (value: string | number) => string = (value) => `row-rule-color: ${value}`;

/**
 * CSS `row-rule-edge-inset` property.
 *
 * **Syntax**: `<length-percentage> [ <length-percentage> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleEdgeInset: (value: string | number) => string = (value) => `row-rule-edge-inset: ${value}`;

/**
 * CSS `row-rule-edge-inset-end` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleEdgeInsetEnd: (value: string | number) => string = (value) => `row-rule-edge-inset-end: ${value}`;

/**
 * CSS `row-rule-edge-inset-start` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleEdgeInsetStart: (value: string | number) => string = (value) => `row-rule-edge-inset-start: ${value}`;

/**
 * CSS `row-rule-inset` property.
 *
 * **Syntax**: `<length-percentage> <length-percentage>? [/ <length-percentage> <length-percentage>?]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleInset: (value: string | number) => string = (value) => `row-rule-inset: ${value}`;

/**
 * CSS `row-rule-inset-end` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleInsetEnd: (value: string | number) => string = (value) => `row-rule-inset-end: ${value}`;

/**
 * CSS `row-rule-inset-start` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleInsetStart: (value: string | number) => string = (value) => `row-rule-inset-start: ${value}`;

/**
 * CSS `row-rule-interior-inset` property.
 *
 * **Syntax**: `<length-percentage> [ <length-percentage> ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleInteriorInset: (value: string | number) => string = (value) => `row-rule-interior-inset: ${value}`;

/**
 * CSS `row-rule-interior-inset-end` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleInteriorInsetEnd: (value: string | number) => string = (value) => `row-rule-interior-inset-end: ${value}`;

/**
 * CSS `row-rule-interior-inset-start` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleInteriorInsetStart: (value: string | number) => string = (value) => `row-rule-interior-inset-start: ${value}`;

/**
 * CSS `row-rule-style` property.
 *
 * **Syntax**: `<line-style-list> | <auto-line-style-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleStyle: (value: string | number) => string = (value) => `row-rule-style: ${value}`;

/**
 * CSS `row-rule-visibility-items` property.
 *
 * **Syntax**: `all | around | between`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleVisibilityItems: (value: string | number) => string = (value) => `row-rule-visibility-items: ${value}`;

/**
 * CSS `row-rule-width` property.
 *
 * **Syntax**: `<line-width-list> | <auto-line-width-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rowRuleWidth: (value: string | number) => string = (value) => `row-rule-width: ${value}`;

/**
 * CSS `ruby-align` property.
 *
 * **Syntax**: `start | center | space-between | space-around`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ruby-1
 */
export const rubyAlign: (value: string | number) => string = (value) => `ruby-align: ${value}`;

/**
 * CSS `ruby-merge` property.
 *
 * **Syntax**: `separate | merge | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ruby-1
 */
export const rubyMerge: (value: string | number) => string = (value) => `ruby-merge: ${value}`;

/**
 * CSS `ruby-overhang` property.
 *
 * **Syntax**: `auto | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ruby-1
 */
export const rubyOverhang: (value: string | number) => string = (value) => `ruby-overhang: ${value}`;

/**
 * CSS `ruby-position` property.
 *
 * **Syntax**: `[ alternate || [ over | under ] ] | inter-character`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ruby-1
 */
export const rubyPosition: (value: string | number) => string = (value) => `ruby-position: ${value}`;

/**
 * CSS `rule` property.
 *
 * **Syntax**: `<'column-rule'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const rule: (value: string | number) => string = (value) => `rule: ${value}`;

/**
 * CSS `rule-break` property.
 *
 * **Syntax**: `<'column-rule-break'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleBreak: (value: string | number) => string = (value) => `rule-break: ${value}`;

/**
 * CSS `rule-color` property.
 *
 * **Syntax**: `<'column-rule-color'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleColor: (value: string | number) => string = (value) => `rule-color: ${value}`;

/**
 * CSS `rule-edge-inset` property.
 *
 * **Syntax**: `<'column-rule-edge-inset'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleEdgeInset: (value: string | number) => string = (value) => `rule-edge-inset: ${value}`;

/**
 * CSS `rule-inset` property.
 *
 * **Syntax**: `<'column-rule-inset'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleInset: (value: string | number) => string = (value) => `rule-inset: ${value}`;

/**
 * CSS `rule-inset-end` property.
 *
 * **Syntax**: `<'column-rule-inset-end'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleInsetEnd: (value: string | number) => string = (value) => `rule-inset-end: ${value}`;

/**
 * CSS `rule-inset-start` property.
 *
 * **Syntax**: `<'column-rule-inset-start'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleInsetStart: (value: string | number) => string = (value) => `rule-inset-start: ${value}`;

/**
 * CSS `rule-interior-inset` property.
 *
 * **Syntax**: `<'column-rule-interior-inset'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleInteriorInset: (value: string | number) => string = (value) => `rule-interior-inset: ${value}`;

/**
 * CSS `rule-overlap` property.
 *
 * **Syntax**: `row-over-column | column-over-row`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleOverlap: (value: string | number) => string = (value) => `rule-overlap: ${value}`;

/**
 * CSS `rule-style` property.
 *
 * **Syntax**: `<'column-rule-style'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleStyle: (value: string | number) => string = (value) => `rule-style: ${value}`;

/**
 * CSS `rule-visibility-items` property.
 *
 * **Syntax**: `<'column-rule-visibility-items'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleVisibilityItems: (value: string | number) => string = (value) => `rule-visibility-items: ${value}`;

/**
 * CSS `rule-width` property.
 *
 * **Syntax**: `<'column-rule-width'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-gaps-1
 */
export const ruleWidth: (value: string | number) => string = (value) => `rule-width: ${value}`;

/**
 * CSS `rx` property.
 *
 * **Syntax**: `<length-percentage> | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const rx: (value: string | number) => string = (value) => `rx: ${value}`;

/**
 * CSS `ry` property.
 *
 * **Syntax**: `<length-percentage> | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const ry: (value: string | number) => string = (value) => `ry: ${value}`;

/**
 * CSS `scale` property.
 *
 * **Syntax**: `none | [ <number> | <percentage> ]{1,3}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transforms-2
 */
export const scale: (value: string | number) => string = (value) => `scale: ${value}`;

/**
 * CSS `scrollbar-color` property.
 *
 * **Syntax**: `auto | <color>{2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scrollbars-1
 */
export const scrollbarColor: (value: string | number) => string = (value) => `scrollbar-color: ${value}`;

/**
 * CSS `scrollbar-gutter` property.
 *
 * **Syntax**: `auto | stable && both-edges?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-3
 */
export const scrollbarGutter: (value: string | number) => string = (value) => `scrollbar-gutter: ${value}`;

/**
 * CSS `scrollbar-width` property.
 *
 * **Syntax**: `auto | thin | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scrollbars-1
 */
export const scrollbarWidth: (value: string | number) => string = (value) => `scrollbar-width: ${value}`;

/**
 * CSS `scroll-behavior` property.
 *
 * **Syntax**: `auto | smooth`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-3
 */
export const scrollBehavior: (value: string | number) => string = (value) => `scroll-behavior: ${value}`;

/**
 * CSS `scroll-initial-target` property.
 *
 * **Syntax**: `none | nearest`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-2
 */
export const scrollInitialTarget: (value: string | number) => string = (value) => `scroll-initial-target: ${value}`;

/**
 * CSS `scroll-margin` property.
 *
 * **Syntax**: `<length>{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMargin: (value: string | number) => string = (value) => `scroll-margin: ${value}`;

/**
 * CSS `scroll-margin-block` property.
 *
 * **Syntax**: `<length>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMarginBlock: (value: string | number) => string = (value) => `scroll-margin-block: ${value}`;

/**
 * CSS `scroll-margin-block-end` property.
 *
 * **Syntax**: `<length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMarginBlockEnd: (value: string | number) => string = (value) => `scroll-margin-block-end: ${value}`;

/**
 * CSS `scroll-margin-block-start` property.
 *
 * **Syntax**: `<length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMarginBlockStart: (value: string | number) => string = (value) => `scroll-margin-block-start: ${value}`;

/**
 * CSS `scroll-margin-bottom` property.
 *
 * **Syntax**: `<length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMarginBottom: (value: string | number) => string = (value) => `scroll-margin-bottom: ${value}`;

/**
 * CSS `scroll-margin-inline` property.
 *
 * **Syntax**: `<length>{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMarginInline: (value: string | number) => string = (value) => `scroll-margin-inline: ${value}`;

/**
 * CSS `scroll-margin-inline-end` property.
 *
 * **Syntax**: `<length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMarginInlineEnd: (value: string | number) => string = (value) => `scroll-margin-inline-end: ${value}`;

/**
 * CSS `scroll-margin-inline-start` property.
 *
 * **Syntax**: `<length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMarginInlineStart: (value: string | number) => string = (value) => `scroll-margin-inline-start: ${value}`;

/**
 * CSS `scroll-margin-left` property.
 *
 * **Syntax**: `<length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMarginLeft: (value: string | number) => string = (value) => `scroll-margin-left: ${value}`;

/**
 * CSS `scroll-margin-right` property.
 *
 * **Syntax**: `<length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMarginRight: (value: string | number) => string = (value) => `scroll-margin-right: ${value}`;

/**
 * CSS `scroll-margin-top` property.
 *
 * **Syntax**: `<length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollMarginTop: (value: string | number) => string = (value) => `scroll-margin-top: ${value}`;

/**
 * CSS `scroll-marker-group` property.
 *
 * **Syntax**: `none | before | after`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-5
 */
export const scrollMarkerGroup: (value: string | number) => string = (value) => `scroll-marker-group: ${value}`;

/**
 * CSS `scroll-padding` property.
 *
 * **Syntax**: `[ auto | <length-percentage [0,∞]> ]{1,4}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPadding: (value: string | number) => string = (value) => `scroll-padding: ${value}`;

/**
 * CSS `scroll-padding-block` property.
 *
 * **Syntax**: `[ auto | <length-percentage [0,∞]> ]{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPaddingBlock: (value: string | number) => string = (value) => `scroll-padding-block: ${value}`;

/**
 * CSS `scroll-padding-block-end` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPaddingBlockEnd: (value: string | number) => string = (value) => `scroll-padding-block-end: ${value}`;

/**
 * CSS `scroll-padding-block-start` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPaddingBlockStart: (value: string | number) => string = (value) => `scroll-padding-block-start: ${value}`;

/**
 * CSS `scroll-padding-bottom` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPaddingBottom: (value: string | number) => string = (value) => `scroll-padding-bottom: ${value}`;

/**
 * CSS `scroll-padding-inline` property.
 *
 * **Syntax**: `[ auto | <length-percentage [0,∞]> ]{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPaddingInline: (value: string | number) => string = (value) => `scroll-padding-inline: ${value}`;

/**
 * CSS `scroll-padding-inline-end` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPaddingInlineEnd: (value: string | number) => string = (value) => `scroll-padding-inline-end: ${value}`;

/**
 * CSS `scroll-padding-inline-start` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPaddingInlineStart: (value: string | number) => string = (value) => `scroll-padding-inline-start: ${value}`;

/**
 * CSS `scroll-padding-left` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPaddingLeft: (value: string | number) => string = (value) => `scroll-padding-left: ${value}`;

/**
 * CSS `scroll-padding-right` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPaddingRight: (value: string | number) => string = (value) => `scroll-padding-right: ${value}`;

/**
 * CSS `scroll-padding-top` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollPaddingTop: (value: string | number) => string = (value) => `scroll-padding-top: ${value}`;

/**
 * CSS `scroll-snap-align` property.
 *
 * **Syntax**: `[ none | start | end | center ]{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollSnapAlign: (value: string | number) => string = (value) => `scroll-snap-align: ${value}`;

/**
 * CSS `scroll-snap-stop` property.
 *
 * **Syntax**: `normal | always`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollSnapStop: (value: string | number) => string = (value) => `scroll-snap-stop: ${value}`;

/**
 * CSS `scroll-snap-type` property.
 *
 * **Syntax**: `none | [ x | y | block | inline | both ] [ mandatory | proximity ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-scroll-snap-1
 */
export const scrollSnapType: (value: string | number) => string = (value) => `scroll-snap-type: ${value}`;

/**
 * CSS `scroll-target-group` property.
 *
 * **Syntax**: `none | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-5
 */
export const scrollTargetGroup: (value: string | number) => string = (value) => `scroll-target-group: ${value}`;

/**
 * CSS `scroll-timeline` property.
 *
 * **Syntax**: `[ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const scrollTimeline: (value: string | number) => string = (value) => `scroll-timeline: ${value}`;

/**
 * CSS `scroll-timeline-axis` property.
 *
 * **Syntax**: `[ block | inline | x | y ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const scrollTimelineAxis: (value: string | number) => string = (value) => `scroll-timeline-axis: ${value}`;

/**
 * CSS `scroll-timeline-name` property.
 *
 * **Syntax**: `[ none | <dashed-ident> ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const scrollTimelineName: (value: string | number) => string = (value) => `scroll-timeline-name: ${value}`;

/**
 * CSS `shape-image-threshold` property.
 *
 * **Syntax**: `<opacity-value>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-shapes-1
 */
export const shapeImageThreshold: (value: string | number) => string = (value) => `shape-image-threshold: ${value}`;

/**
 * CSS `shape-inside` property.
 *
 * **Syntax**: `auto | outside-shape | [ <basic-shape> || shape-box ] | <image> | display`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-shapes-2
 */
export const shapeInside: (value: string | number) => string = (value) => `shape-inside: ${value}`;

/**
 * CSS `shape-margin` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-shapes-1
 */
export const shapeMargin: (value: string | number) => string = (value) => `shape-margin: ${value}`;

/**
 * CSS `shape-outside` property.
 *
 * **Syntax**: `none | [ <basic-shape> || <shape-box> ] | <image>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-shapes-1
 */
export const shapeOutside: (value: string | number) => string = (value) => `shape-outside: ${value}`;

/**
 * CSS `shape-padding` property.
 *
 * **Syntax**: `<length-percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-shapes-2
 */
export const shapePadding: (value: string | number) => string = (value) => `shape-padding: ${value}`;

/**
 * CSS `shape-rendering` property.
 *
 * **Syntax**: `auto | optimizeSpeed | crispEdges | geometricPrecision`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const shapeRendering: (value: string | number) => string = (value) => `shape-rendering: ${value}`;

/**
 * CSS `shape-subtract` property.
 *
 * **Syntax**: `none | [ <basic-shape> | <uri> ]+`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const shapeSubtract: (value: string | number) => string = (value) => `shape-subtract: ${value}`;

/**
 * CSS `slider-orientation` property.
 *
 * **Syntax**: `auto | left-to-right | right-to-left | top-to-bottom | bottom-to-top`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-forms-1
 */
export const sliderOrientation: (value: string | number) => string = (value) => `slider-orientation: ${value}`;

/**
 * CSS `spatial-navigation-action` property.
 *
 * **Syntax**: `auto | focus | scroll`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-nav-1
 */
export const spatialNavigationAction: (value: string | number) => string = (value) => `spatial-navigation-action: ${value}`;

/**
 * CSS `spatial-navigation-contain` property.
 *
 * **Syntax**: `auto | contain`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-nav-1
 */
export const spatialNavigationContain: (value: string | number) => string = (value) => `spatial-navigation-contain: ${value}`;

/**
 * CSS `spatial-navigation-function` property.
 *
 * **Syntax**: `normal | grid`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-nav-1
 */
export const spatialNavigationFunction: (value: string | number) => string = (value) => `spatial-navigation-function: ${value}`;

/**
 * CSS `speak` property.
 *
 * **Syntax**: `auto | never | always`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const speak: (value: string | number) => string = (value) => `speak: ${value}`;

/**
 * CSS `speak-as` property.
 *
 * **Syntax**: `normal | spell-out || digits || [ literal-punctuation | no-punctuation ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const speakAs: (value: string | number) => string = (value) => `speak-as: ${value}`;

/**
 * CSS `stop-color` property.
 *
 * **Syntax**: `<'color'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const stopColor: (value: string | number) => string = (value) => `stop-color: ${value}`;

/**
 * CSS `stop-opacity` property.
 *
 * **Syntax**: `<'opacity'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const stopOpacity: (value: string | number) => string = (value) => `stop-opacity: ${value}`;

/**
 * CSS `string-set` property.
 *
 * **Syntax**: `none | [ <custom-ident> <string>+ ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-content-3
 */
export const stringSet: (value: string | number) => string = (value) => `string-set: ${value}`;

/**
 * CSS `stroke` property.
 *
 * **Syntax**: `<paint>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const stroke: (value: string | number) => string = (value) => `stroke: ${value}`;

/**
 * CSS `stroke-align` property.
 *
 * **Syntax**: `center | inset | outset`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeAlign: (value: string | number) => string = (value) => `stroke-align: ${value}`;

/**
 * CSS `stroke-alignment` property.
 *
 * **Syntax**: `center | inner | outer`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const strokeAlignment: (value: string | number) => string = (value) => `stroke-alignment: ${value}`;

/**
 * CSS `stroke-break` property.
 *
 * **Syntax**: `bounding-box | slice | clone`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeBreak: (value: string | number) => string = (value) => `stroke-break: ${value}`;

/**
 * CSS `stroke-color` property.
 *
 * **Syntax**: `<color>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeColor: (value: string | number) => string = (value) => `stroke-color: ${value}`;

/**
 * CSS `stroke-dashadjust` property.
 *
 * **Syntax**: `none | [stretch | compress] [dashes | gaps]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const strokeDashadjust: (value: string | number) => string = (value) => `stroke-dashadjust: ${value}`;

/**
 * CSS `stroke-dasharray` property.
 *
 * **Syntax**: `none | [<length-percentage> | <number>]+#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeDasharray: (value: string | number) => string = (value) => `stroke-dasharray: ${value}`;

/**
 * CSS `stroke-dashcorner` property.
 *
 * **Syntax**: `none | <length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const strokeDashcorner: (value: string | number) => string = (value) => `stroke-dashcorner: ${value}`;

/**
 * CSS `stroke-dash-corner` property.
 *
 * **Syntax**: `none | <length>`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeDashCorner: (value: string | number) => string = (value) => `stroke-dash-corner: ${value}`;

/**
 * CSS `stroke-dash-justify` property.
 *
 * **Syntax**: `none | [ stretch | compress ] || [ dashes || gaps ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeDashJustify: (value: string | number) => string = (value) => `stroke-dash-justify: ${value}`;

/**
 * CSS `stroke-dashoffset` property.
 *
 * **Syntax**: `<length-percentage> | <number>`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeDashoffset: (value: string | number) => string = (value) => `stroke-dashoffset: ${value}`;

/**
 * CSS `stroke-image` property.
 *
 * **Syntax**: `<paint>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeImage: (value: string | number) => string = (value) => `stroke-image: ${value}`;

/**
 * CSS `stroke-linecap` property.
 *
 * **Syntax**: `butt | round | square`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeLinecap: (value: string | number) => string = (value) => `stroke-linecap: ${value}`;

/**
 * CSS `stroke-linejoin` property.
 *
 * **Syntax**: `[ crop | arcs | miter ] || [ bevel | round | fallback ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeLinejoin: (value: string | number) => string = (value) => `stroke-linejoin: ${value}`;

/**
 * CSS `stroke-miterlimit` property.
 *
 * **Syntax**: `<number>`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeMiterlimit: (value: string | number) => string = (value) => `stroke-miterlimit: ${value}`;

/**
 * CSS `stroke-opacity` property.
 *
 * **Syntax**: `<'opacity'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeOpacity: (value: string | number) => string = (value) => `stroke-opacity: ${value}`;

/**
 * CSS `stroke-origin` property.
 *
 * **Syntax**: `match-parent | fill-box | stroke-box | content-box | padding-box | border-box`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeOrigin: (value: string | number) => string = (value) => `stroke-origin: ${value}`;

/**
 * CSS `stroke-position` property.
 *
 * **Syntax**: `<position>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokePosition: (value: string | number) => string = (value) => `stroke-position: ${value}`;

/**
 * CSS `stroke-repeat` property.
 *
 * **Syntax**: `<repeat-style>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeRepeat: (value: string | number) => string = (value) => `stroke-repeat: ${value}`;

/**
 * CSS `stroke-size` property.
 *
 * **Syntax**: `<bg-size>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeSize: (value: string | number) => string = (value) => `stroke-size: ${value}`;

/**
 * CSS `stroke-width` property.
 *
 * **Syntax**: `[<length-percentage> | <number>]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec fill-stroke-3
 */
export const strokeWidth: (value: string | number) => string = (value) => `stroke-width: ${value}`;

/**
 * CSS `table-layout` property.
 *
 * **Syntax**: `auto | fixed`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-tables-3
 */
export const tableLayout: (value: string | number) => string = (value) => `table-layout: ${value}`;

/**
 * CSS `tab-size` property.
 *
 * **Syntax**: `<number [0,∞]> | <length [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const tabSize: (value: string | number) => string = (value) => `tab-size: ${value}`;

/**
 * CSS `text-align` property.
 *
 * **Syntax**: `start | end | left | right | center | <string> | justify | match-parent | justify-all`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textAlign: (value: string | number) => string = (value) => `text-align: ${value}`;

/**
 * CSS `text-align-all` property.
 *
 * **Syntax**: `start | end | left | right | center | <string> | justify | match-parent`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textAlignAll: (value: string | number) => string = (value) => `text-align-all: ${value}`;

/**
 * CSS `text-align-last` property.
 *
 * **Syntax**: `auto | start | end | left | right | center | justify | match-parent`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textAlignLast: (value: string | number) => string = (value) => `text-align-last: ${value}`;

/**
 * CSS `text-anchor` property.
 *
 * **Syntax**: `start | middle | end`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const textAnchor: (value: string | number) => string = (value) => `text-anchor: ${value}`;

/**
 * CSS `text-autospace` property.
 *
 * **Syntax**: `normal | <autospace> | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textAutospace: (value: string | number) => string = (value) => `text-autospace: ${value}`;

/**
 * CSS `text-box` property.
 *
 * **Syntax**: `normal | <'text-box-trim'> || <'text-box-edge'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const textBox: (value: string | number) => string = (value) => `text-box: ${value}`;

/**
 * CSS `text-box-edge` property.
 *
 * **Syntax**: `auto | <text-edge>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const textBoxEdge: (value: string | number) => string = (value) => `text-box-edge: ${value}`;

/**
 * CSS `text-box-trim` property.
 *
 * **Syntax**: `none | trim-start | trim-end | trim-both`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const textBoxTrim: (value: string | number) => string = (value) => `text-box-trim: ${value}`;

/**
 * CSS `text-combine-upright` property.
 *
 * **Syntax**: `none | all | [ digits <integer [2,4]>? ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-writing-modes-4
 */
export const textCombineUpright: (value: string | number) => string = (value) => `text-combine-upright: ${value}`;

/**
 * CSS `text-decoration` property.
 *
 * **Syntax**: `<'text-decoration-line'> || <'text-decoration-thickness'> || <'text-decoration-style'> || <'text-decoration-color'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecoration: (value: string | number) => string = (value) => `text-decoration: ${value}`;

/**
 * CSS `text-decoration-color` property.
 *
 * **Syntax**: `<color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecorationColor: (value: string | number) => string = (value) => `text-decoration-color: ${value}`;

/**
 * CSS `text-decoration-inset` property.
 *
 * **Syntax**: `<length>{1,2} | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecorationInset: (value: string | number) => string = (value) => `text-decoration-inset: ${value}`;

/**
 * CSS `text-decoration-line` property.
 *
 * **Syntax**: `none | [ underline || overline || line-through || blink ] | spelling-error | grammar-error`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecorationLine: (value: string | number) => string = (value) => `text-decoration-line: ${value}`;

/**
 * CSS `text-decoration-skip` property.
 *
 * **Syntax**: `none | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecorationSkip: (value: string | number) => string = (value) => `text-decoration-skip: ${value}`;

/**
 * CSS `text-decoration-skip-box` property.
 *
 * **Syntax**: `none | all`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecorationSkipBox: (value: string | number) => string = (value) => `text-decoration-skip-box: ${value}`;

/**
 * CSS `text-decoration-skip-ink` property.
 *
 * **Syntax**: `auto | none | all`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecorationSkipInk: (value: string | number) => string = (value) => `text-decoration-skip-ink: ${value}`;

/**
 * CSS `text-decoration-skip-self` property.
 *
 * **Syntax**: `auto | skip-all | [ skip-underline || skip-overline || skip-line-through ] | no-skip`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecorationSkipSelf: (value: string | number) => string = (value) => `text-decoration-skip-self: ${value}`;

/**
 * CSS `text-decoration-skip-spaces` property.
 *
 * **Syntax**: `none | all | [ start || end ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecorationSkipSpaces: (value: string | number) => string = (value) => `text-decoration-skip-spaces: ${value}`;

/**
 * CSS `text-decoration-style` property.
 *
 * **Syntax**: `solid | double | dotted | dashed | wavy`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecorationStyle: (value: string | number) => string = (value) => `text-decoration-style: ${value}`;

/**
 * CSS `text-decoration-thickness` property.
 *
 * **Syntax**: `auto | from-font | <length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textDecorationThickness: (value: string | number) => string = (value) => `text-decoration-thickness: ${value}`;

/**
 * CSS `text-emphasis` property.
 *
 * **Syntax**: `<'text-emphasis-style'> || <'text-emphasis-color'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textEmphasis: (value: string | number) => string = (value) => `text-emphasis: ${value}`;

/**
 * CSS `text-emphasis-color` property.
 *
 * **Syntax**: `<color>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textEmphasisColor: (value: string | number) => string = (value) => `text-emphasis-color: ${value}`;

/**
 * CSS `text-emphasis-position` property.
 *
 * **Syntax**: `[ over | under ] && [ right | left ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textEmphasisPosition: (value: string | number) => string = (value) => `text-emphasis-position: ${value}`;

/**
 * CSS `text-emphasis-skip` property.
 *
 * **Syntax**: `spaces || punctuation || symbols || narrow`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textEmphasisSkip: (value: string | number) => string = (value) => `text-emphasis-skip: ${value}`;

/**
 * CSS `text-emphasis-style` property.
 *
 * **Syntax**: `none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textEmphasisStyle: (value: string | number) => string = (value) => `text-emphasis-style: ${value}`;

/**
 * CSS `text-group-align` property.
 *
 * **Syntax**: `none | start | end | left | right | center`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textGroupAlign: (value: string | number) => string = (value) => `text-group-align: ${value}`;

/**
 * CSS `text-indent` property.
 *
 * **Syntax**: `[ <length-percentage> ] && hanging? && each-line?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textIndent: (value: string | number) => string = (value) => `text-indent: ${value}`;

/**
 * CSS `text-justify` property.
 *
 * **Syntax**: `[ auto | none | inter-word | inter-character | ruby ] || no-compress`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textJustify: (value: string | number) => string = (value) => `text-justify: ${value}`;

/**
 * CSS `text-orientation` property.
 *
 * **Syntax**: `mixed | upright | sideways`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-writing-modes-4
 */
export const textOrientation: (value: string | number) => string = (value) => `text-orientation: ${value}`;

/**
 * CSS `text-overflow` property.
 *
 * **Syntax**: `[ clip | ellipsis | <string> | fade | <fade()> ]{1,2}`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-overflow-4
 */
export const textOverflow: (value: string | number) => string = (value) => `text-overflow: ${value}`;

/**
 * CSS `text-rendering` property.
 *
 * **Syntax**: `auto | optimizeSpeed | optimizeLegibility | geometricPrecision`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const textRendering: (value: string | number) => string = (value) => `text-rendering: ${value}`;

/**
 * CSS `text-shadow` property.
 *
 * **Syntax**: `none | <shadow>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textShadow: (value: string | number) => string = (value) => `text-shadow: ${value}`;

/**
 * CSS `text-size-adjust` property.
 *
 * **Syntax**: `auto | none | <percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-size-adjust-1
 */
export const textSizeAdjust: (value: string | number) => string = (value) => `text-size-adjust: ${value}`;

/**
 * CSS `text-spacing` property.
 *
 * **Syntax**: `none | auto | <spacing-trim> || <autospace>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textSpacing: (value: string | number) => string = (value) => `text-spacing: ${value}`;

/**
 * CSS `text-spacing-trim` property.
 *
 * **Syntax**: `<spacing-trim> | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textSpacingTrim: (value: string | number) => string = (value) => `text-spacing-trim: ${value}`;

/**
 * CSS `text-transform` property.
 *
 * **Syntax**: `none | [capitalize | uppercase | lowercase ] || full-width || full-size-kana | math-auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textTransform: (value: string | number) => string = (value) => `text-transform: ${value}`;

/**
 * CSS `text-underline-offset` property.
 *
 * **Syntax**: `auto | <length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textUnderlineOffset: (value: string | number) => string = (value) => `text-underline-offset: ${value}`;

/**
 * CSS `text-underline-position` property.
 *
 * **Syntax**: `auto | [ from-font | under ] || [ left | right ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-decor-4
 */
export const textUnderlinePosition: (value: string | number) => string = (value) => `text-underline-position: ${value}`;

/**
 * CSS `text-wrap` property.
 *
 * **Syntax**: `<'text-wrap-mode'> || <'text-wrap-style'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textWrap: (value: string | number) => string = (value) => `text-wrap: ${value}`;

/**
 * CSS `text-wrap-mode` property.
 *
 * **Syntax**: `wrap | nowrap`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textWrapMode: (value: string | number) => string = (value) => `text-wrap-mode: ${value}`;

/**
 * CSS `text-wrap-style` property.
 *
 * **Syntax**: `auto | balance | stable | pretty | avoid-orphans`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const textWrapStyle: (value: string | number) => string = (value) => `text-wrap-style: ${value}`;

/**
 * CSS `timeline-scope` property.
 *
 * **Syntax**: `none | all | <dashed-ident>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const timelineScope: (value: string | number) => string = (value) => `timeline-scope: ${value}`;

/**
 * CSS `timeline-trigger` property.
 *
 * **Syntax**: `none | [ <'timeline-trigger-name'> <'timeline-trigger-source'> <'timeline-trigger-range'> [ '/' <'timeline-trigger-exit-range'> ]? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const timelineTrigger: (value: string | number) => string = (value) => `timeline-trigger: ${value}`;

/**
 * CSS `timeline-trigger-exit-range` property.
 *
 * **Syntax**: `[ <'timeline-trigger-exit-range-start'> <'timeline-trigger-exit-range-end'>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const timelineTriggerExitRange: (value: string | number) => string = (value) => `timeline-trigger-exit-range: ${value}`;

/**
 * CSS `timeline-trigger-exit-range-end` property.
 *
 * **Syntax**: `[ auto | normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const timelineTriggerExitRangeEnd: (value: string | number) => string = (value) => `timeline-trigger-exit-range-end: ${value}`;

/**
 * CSS `timeline-trigger-exit-range-start` property.
 *
 * **Syntax**: `[ auto | normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const timelineTriggerExitRangeStart: (value: string | number) => string = (value) => `timeline-trigger-exit-range-start: ${value}`;

/**
 * CSS `timeline-trigger-name` property.
 *
 * **Syntax**: `none | <dashed-ident>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const timelineTriggerName: (value: string | number) => string = (value) => `timeline-trigger-name: ${value}`;

/**
 * CSS `timeline-trigger-range` property.
 *
 * **Syntax**: `[ <'timeline-trigger-range-start'> <'timeline-trigger-range-end'>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const timelineTriggerRange: (value: string | number) => string = (value) => `timeline-trigger-range: ${value}`;

/**
 * CSS `timeline-trigger-range-end` property.
 *
 * **Syntax**: `[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const timelineTriggerRangeEnd: (value: string | number) => string = (value) => `timeline-trigger-range-end: ${value}`;

/**
 * CSS `timeline-trigger-range-start` property.
 *
 * **Syntax**: `[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const timelineTriggerRangeStart: (value: string | number) => string = (value) => `timeline-trigger-range-start: ${value}`;

/**
 * CSS `timeline-trigger-source` property.
 *
 * **Syntax**: `<single-animation-timeline>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const timelineTriggerSource: (value: string | number) => string = (value) => `timeline-trigger-source: ${value}`;

/**
 * CSS `top` property.
 *
 * **Syntax**: `auto | <length-percentage> | <anchor()> | <anchor-size()>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-position-3
 */
export const top: (value: Length | number | string) => string = (value) => `top: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `touch-action` property.
 *
 * **Syntax**: `auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const touchAction: (value: string | number) => string = (value) => `touch-action: ${value}`;

/**
 * CSS `transform` property.
 *
 * **Syntax**: `none | <transform-list>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transforms-1
 */
export const transform: (value: string | number) => string = (value) => `transform: ${value}`;

/**
 * CSS `transform-box` property.
 *
 * **Syntax**: `content-box | border-box | fill-box | stroke-box | view-box`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transforms-1
 */
export const transformBox: (value: string | number) => string = (value) => `transform-box: ${value}`;

/**
 * CSS `transform-origin` property.
 *
 * **Syntax**: `[ left | center | right | top | bottom | <length-percentage> ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ] <length>? | [ [ center | left | right ] && [ center | top | bottom ] ] <length>?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transforms-1
 */
export const transformOrigin: (value: string | number) => string = (value) => `transform-origin: ${value}`;

/**
 * CSS `transform-style` property.
 *
 * **Syntax**: `flat | preserve-3d`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transforms-2
 */
export const transformStyle: (value: string | number) => string = (value) => `transform-style: ${value}`;

/**
 * CSS `transition` property.
 *
 * **Syntax**: `<single-transition>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transitions-1
 */
export const transition: (value: string | number) => string = (value) => `transition: ${value}`;

/**
 * CSS `transition-behavior` property.
 *
 * **Syntax**: `<transition-behavior-value>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transitions-2
 */
export const transitionBehavior: (value: string | number) => string = (value) => `transition-behavior: ${value}`;

/**
 * CSS `transition-delay` property.
 *
 * **Syntax**: `<time>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transitions-1
 */
export const transitionDelay: (value: string | number) => string = (value) => `transition-delay: ${value}`;

/**
 * CSS `transition-duration` property.
 *
 * **Syntax**: `<time [0s,∞]>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transitions-1
 */
export const transitionDuration: (value: string | number) => string = (value) => `transition-duration: ${value}`;

/**
 * CSS `transition-property` property.
 *
 * **Syntax**: `none | <single-transition-property>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transitions-1
 */
export const transitionProperty: (value: string | number) => string = (value) => `transition-property: ${value}`;

/**
 * CSS `transition-timing-function` property.
 *
 * **Syntax**: `<easing-function>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transitions-1
 */
export const transitionTimingFunction: (value: string | number) => string = (value) => `transition-timing-function: ${value}`;

/**
 * CSS `translate` property.
 *
 * **Syntax**: `none | <length-percentage> [ <length-percentage> <length>? ]?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-transforms-2
 */
export const translate: (value: string | number) => string = (value) => `translate: ${value}`;

/**
 * CSS `trigger-scope` property.
 *
 * **Syntax**: `none | all | <dashed-ident>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-animations-2
 */
export const triggerScope: (value: string | number) => string = (value) => `trigger-scope: ${value}`;

/**
 * CSS `unicode-bidi` property.
 *
 * **Syntax**: `normal | embed | isolate | bidi-override | isolate-override | plaintext`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-writing-modes-4
 */
export const unicodeBidi: (value: string | number) => string = (value) => `unicode-bidi: ${value}`;

/**
 * CSS `user-select` property.
 *
 * **Syntax**: `auto | text | none | contain | all`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-ui-4
 */
export const userSelect: (value: string | number) => string = (value) => `user-select: ${value}`;

/**
 * CSS `vector-effect` property.
 *
 * **Syntax**: `none | non-scaling-stroke | non-scaling-size | non-rotation | fixed-position`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const vectorEffect: (value: string | number) => string = (value) => `vector-effect: ${value}`;

/**
 * CSS `vertical-align` property.
 *
 * **Syntax**: `[ first | last] || <'alignment-baseline'> || <'baseline-shift'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-inline-3
 */
export const verticalAlign: (value: string | number) => string = (value) => `vertical-align: ${value}`;

/**
 * CSS `view-timeline` property.
 *
 * **Syntax**: `[ <'view-timeline-name'> [ <'view-timeline-axis'> || <'view-timeline-inset'> ]? ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const viewTimeline: (value: string | number) => string = (value) => `view-timeline: ${value}`;

/**
 * CSS `view-timeline-axis` property.
 *
 * **Syntax**: `[ block | inline | x | y ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const viewTimelineAxis: (value: string | number) => string = (value) => `view-timeline-axis: ${value}`;

/**
 * CSS `view-timeline-inset` property.
 *
 * **Syntax**: `[ [ auto | <length-percentage> ]{1,2} ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const viewTimelineInset: (value: string | number) => string = (value) => `view-timeline-inset: ${value}`;

/**
 * CSS `view-timeline-name` property.
 *
 * **Syntax**: `[ none | <dashed-ident> ]#`
 *
 * **Status**: 🟢 modern
 *
 * @spec scroll-animations-1
 */
export const viewTimelineName: (value: string | number) => string = (value) => `view-timeline-name: ${value}`;

/**
 * CSS `view-transition-class` property.
 *
 * **Syntax**: `none | <custom-ident>+`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-view-transitions-2
 */
export const viewTransitionClass: (value: string | number) => string = (value) => `view-transition-class: ${value}`;

/**
 * CSS `view-transition-group` property.
 *
 * **Syntax**: `normal | contain | nearest | <custom-ident>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-view-transitions-2
 */
export const viewTransitionGroup: (value: string | number) => string = (value) => `view-transition-group: ${value}`;

/**
 * CSS `view-transition-name` property.
 *
 * **Syntax**: `none | <custom-ident>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-view-transitions-2
 */
export const viewTransitionName: (value: string | number) => string = (value) => `view-transition-name: ${value}`;

/**
 * CSS `view-transition-scope` property.
 *
 * **Syntax**: `none | auto`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-view-transitions-2
 */
export const viewTransitionScope: (value: string | number) => string = (value) => `view-transition-scope: ${value}`;

/**
 * CSS `visibility` property.
 *
 * **Syntax**: `visible | hidden | force-hidden | collapse`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-display-4
 */
export const visibility: (value: string | number) => string = (value) => `visibility: ${value}`;

/**
 * CSS `voice-balance` property.
 *
 * **Syntax**: `<number> | left | center | right | leftwards | rightwards`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const voiceBalance: (value: string | number) => string = (value) => `voice-balance: ${value}`;

/**
 * CSS `voice-duration` property.
 *
 * **Syntax**: `auto | <time [0s,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const voiceDuration: (value: string | number) => string = (value) => `voice-duration: ${value}`;

/**
 * CSS `voice-family` property.
 *
 * **Syntax**: `[ <voice-family-name> | <generic-voice> ]# | preserve`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const voiceFamily: (value: string | number) => string = (value) => `voice-family: ${value}`;

/**
 * CSS `voice-pitch` property.
 *
 * **Syntax**: `<frequency [0Hz,∞]> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency [0Hz,∞]> | <semitones> | <percentage> ] ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const voicePitch: (value: string | number) => string = (value) => `voice-pitch: ${value}`;

/**
 * CSS `voice-range` property.
 *
 * **Syntax**: `<frequency [0Hz,∞]> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency [0Hz,∞]> | <semitones> | <percentage> ] ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const voiceRange: (value: string | number) => string = (value) => `voice-range: ${value}`;

/**
 * CSS `voice-rate` property.
 *
 * **Syntax**: `[ normal | x-slow | slow | medium | fast | x-fast ] || <percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const voiceRate: (value: string | number) => string = (value) => `voice-rate: ${value}`;

/**
 * CSS `voice-stress` property.
 *
 * **Syntax**: `normal | strong | moderate | none | reduced`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const voiceStress: (value: string | number) => string = (value) => `voice-stress: ${value}`;

/**
 * CSS `voice-volume` property.
 *
 * **Syntax**: `silent | [ [ x-soft | soft | medium | loud | x-loud ] || <decibel> ]`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-speech-1
 */
export const voiceVolume: (value: string | number) => string = (value) => `voice-volume: ${value}`;

/**
 * CSS `white-space` property.
 *
 * **Syntax**: `normal | pre | pre-wrap | pre-line | <'white-space-collapse'> || <'text-wrap-mode'> || <'white-space-trim'>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const whiteSpace: (value: string | number) => string = (value) => `white-space: ${value}`;

/**
 * CSS `white-space-collapse` property.
 *
 * **Syntax**: `collapse | discard | preserve | preserve-breaks | preserve-spaces | break-spaces`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const whiteSpaceCollapse: (value: string | number) => string = (value) => `white-space-collapse: ${value}`;

/**
 * CSS `white-space-trim` property.
 *
 * **Syntax**: `none | discard-before || discard-after || discard-inner`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const whiteSpaceTrim: (value: string | number) => string = (value) => `white-space-trim: ${value}`;

/**
 * CSS `widows` property.
 *
 * **Syntax**: `<integer [1,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-break-4
 */
export const widows: (value: string | number) => string = (value) => `widows: ${value}`;

/**
 * CSS `width` property.
 *
 * **Syntax**: `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()> | stretch | fit-content | contain`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-sizing-3
 */
export const width: (value: Length | number | string) => string = (value) => `width: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `will-change` property.
 *
 * **Syntax**: `auto | <animateable-feature>#`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-will-change-1
 */
export const willChange: (value: string | number) => string = (value) => `will-change: ${value}`;

/**
 * CSS `word-break` property.
 *
 * **Syntax**: `normal | break-all | keep-all | manual | auto-phrase | break-word`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const wordBreak: (value: string | number) => string = (value) => `word-break: ${value}`;

/**
 * CSS `word-space-transform` property.
 *
 * **Syntax**: `none | [ space | ideographic-space ] && auto-phrase?`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const wordSpaceTransform: (value: string | number) => string = (value) => `word-space-transform: ${value}`;

/**
 * CSS `word-spacing` property.
 *
 * **Syntax**: `normal | <length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const wordSpacing: (value: Length | number | string) => string = (value) => `word-spacing: ${typeof value === 'number' ? scaleValue(value) : value}`;

/**
 * CSS `word-wrap` property.
 *
 * **Syntax**: `normal | break-word | anywhere`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const wordWrap: (value: string | number) => string = (value) => `word-wrap: ${value}`;

/**
 * CSS `wrap-after` property.
 *
 * **Syntax**: `auto | avoid | avoid-line | avoid-flex | line | flex`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const wrapAfter: (value: string | number) => string = (value) => `wrap-after: ${value}`;

/**
 * CSS `wrap-before` property.
 *
 * **Syntax**: `auto | avoid | avoid-line | avoid-flex | line | flex`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const wrapBefore: (value: string | number) => string = (value) => `wrap-before: ${value}`;

/**
 * CSS `wrap-flow` property.
 *
 * **Syntax**: `auto | both | start | end | minimum | maximum | clear`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-exclusions-1
 */
export const wrapFlow: (value: string | number) => string = (value) => `wrap-flow: ${value}`;

/**
 * CSS `wrap-inside` property.
 *
 * **Syntax**: `auto | avoid`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-text-4
 */
export const wrapInside: (value: string | number) => string = (value) => `wrap-inside: ${value}`;

/**
 * CSS `wrap-through` property.
 *
 * **Syntax**: `wrap | none`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-exclusions-1
 */
export const wrapThrough: (value: string | number) => string = (value) => `wrap-through: ${value}`;

/**
 * CSS `writing-mode` property.
 *
 * **Syntax**: `horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-writing-modes-4
 */
export const writingMode: (value: string | number) => string = (value) => `writing-mode: ${value}`;

/**
 * CSS `x` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const x: (value: string | number) => string = (value) => `x: ${value}`;

/**
 * CSS `y` property.
 *
 * **Syntax**: `<length-percentage>`
 *
 * **Status**: 🟢 modern
 *
 * @spec unknown
 */
export const y: (value: string | number) => string = (value) => `y: ${value}`;

/**
 * CSS `z-index` property.
 *
 * **Syntax**: `auto | <integer> | inherit`
 *
 * **Status**: 🟢 modern
 *
 * @spec css2
 */
export const zIndex: (value: string | number) => string = (value) => `z-index: ${value}`;

/**
 * CSS `zoom` property.
 *
 * **Syntax**: `<number [0,∞]> | <percentage [0,∞]>`
 *
 * **Status**: 🟢 modern
 *
 * @spec css-viewport
 */
export const zoom: (value: string | number) => string = (value) => `zoom: ${value}`;