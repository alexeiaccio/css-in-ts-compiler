import { r as Decl, t as BcdKey } from "./author-types-C1AhsnrT.mjs";
import { t as ClassValue } from "./runtime-Dt4Tm0Q7.mjs";
import { createRequire } from "node:module";
import { CSS, CSS as CSS$1, CSSColorValue, CSSColorValue as CSSColorValue$1, CSSImageValue, CSSImageValue as CSSImageValue$1, CSSStyleValue, CSSStyleValue as CSSStyleValue$1, CSSUnitValue, CSSUnitValue as CSSUnitValue$1 } from "@cssints/css-grammar/values";
import { properties } from "@cssints/css-grammar/mdn";
import { DTCG_TYPES, DtcgType, Grammar, StyleObject, Syntax, TOKEN_TYPES, Token, TokenFn, TokenName, TokenSetFn, TokenType, ValidSyntax, ValidToken } from "@cssints/css-grammar/token";
import { FurthestIn, Hint, LengthUnit, MatchesValue, Sentinel, Sentinels, Unexpected, ValidIn } from "@cssints/css-grammar/css";
import { Condition, ValidSelector } from "@cssints/css-grammar/query";
//#endregion
//#region src/parts.d.ts
/** One value of a `firstThatWorks`: a string or a Typed OM value (a token). */
type Alt = string | CSSStyleValue;
/** What firstThatWorks() gives: its values, the wanted one first. A part of a property, not a Typed OM value. */
interface Fallback<V extends readonly Alt[] = readonly Alt[]> {
  readonly __fallback: V;
}
/** A value part: a string, a Typed OM value, a `firstThatWorks`, or a lone number (the spacing scale in spacing properties). */
type Part = string | number | CSSStyleValue | Fallback;
/** What every member returns: a class string. It is a string (`className`), but only members make one. */
type Style = string & {
  readonly __cssints: "style";
};
type Text$2<P> = P extends Style ? "⟨style⟩" : P extends string ? P extends "" ? "⟨empty⟩" : P : P extends number ? `${P}` : P extends CSSStyleValue<infer T> ? Sentinel<T> : P extends Fallback<infer V> ? Text$2<V[0]> : never;
type Join$1<A extends readonly Part[]> = A extends readonly [infer H, ...infer R extends readonly Part[]] ? R extends readonly [] ? Text$2<H> : `${Text$2<H>} ${Join$1<R>}` : "";
type Spacing = "padding" | "margin" | "inset" | "gap" | "row-gap" | "column-gap";
type Value<Sp extends boolean | string, A extends readonly Part[]> = A extends readonly [number] ? Sp extends true | Spacing | `${Spacing}-${string}` ? "⟨length⟩" : Join$1<A> : Join$1<A>;
type Bad$3<A extends readonly Part[], Pre extends string, Seen extends string = "", I extends 0[] = []> = A extends readonly [infer H, ...infer R extends readonly Part[]] ? (Seen extends "" ? Text$2<H> : `${Seen} ${Text$2<H>}`) extends (infer J extends string) ? J extends `${Pre}${string}` ? `${I["length"]}` : Bad$3<R, Pre, J, [...I, 0]> : never : "0";
type Others<Label extends string, G extends string, Vs extends readonly Part[], Pre extends string, Suf extends string> = Vs extends readonly [infer H, ...infer T extends readonly Part[]] ? `${Pre}${Text$2<H>}${Suf}` extends (infer S extends string) ? ValidIn<Label, G, S> extends (infer V) ? V extends S ? Others<Label, G, T, Pre, Suf> : V : never : never : true;
type Alts<Label extends string, G extends string, A extends readonly Part[], Rest extends readonly Part[] = A, Pre extends string = "", I extends 0[] = []> = Rest extends readonly [infer H, ...infer R extends readonly Part[]] ? H extends Fallback<infer Vs extends readonly [Alt, ...Alt[]]> ? [Extract<R[number], Fallback>] extends [never] ? Vs extends readonly [unknown, ...infer O extends readonly Part[]] ? Others<Label, G, O, Pre, R extends readonly [] ? "" : ` ${Join$1<R>}`> extends (infer M) ? M extends true ? A : { [K in keyof A]: K extends `${I["length"]}` ? M : A[K]; } : never : A : { [K in keyof A]: K extends `${I["length"]}` ? "firstThatWorks: one per declaration" : A[K]; } : Alts<Label, G, A, R, `${Pre}${Text$2<H>} `, [...I, 0]> : A;
/**
 * The parameters of a call with parts `A`, checked against grammar `G` (called `Label` in the message; `Sp`: a lone
 * number is the spacing scale). `A` itself when valid, else the message on the bad argument.
 */
type CheckIn<Label extends string, G extends string, Sp extends boolean | string, A extends readonly Part[]> = ValidIn<Label, G, Value<Sp, A>> extends (infer V) ? V extends Value<Sp, A> ? A[number] extends string | number | CSSStyleValue ? A : Alts<Label, G, A> : A extends readonly [] ? [value: V] : Locate<Label, G, A, V, Value<Sp, A>> : never;
type Locate<Label extends string, G extends string, A extends readonly Part[], V, S extends string> = FurthestIn<G, S> extends (infer F extends string) ? S extends `${infer Pre}${F}` ? { [K in keyof A]: K extends Bad$3<A, Pre> ? V | Hint<Label, A[K] extends string ? A[K] : never> : A[K]; } : { [K in keyof A]: V; } : never;
type Check<P extends keyof typeof properties, A extends readonly Part[]> = CheckIn<P, (typeof properties)[P], P, A>;
//#endregion
//#region src/function-types.d.ts
type Atom = string | number | CSSStyleValue;
/** One part of a call: a string, a number, a Typed OM value (a token, another call), or an array of those joined by a space (`[t.color.bg, "25%"]`, a colour stop). */
type Arg = Atom | readonly Atom[];
type Op = "+" | "-" | "*" | "/";
type Text$1<P> = P extends string ? P : P extends number ? `${P}` : P extends CSSStyleValue<infer T> ? Sentinel<T> : P extends readonly Atom[] ? Join<P, " "> : never;
type Glue<Prev, H, Sep extends string> = [Prev] extends [Op] ? " " : [H] extends [Op] ? " " : Sep;
type Next<Prev, H, Sep extends string> = [Prev] extends [never] ? "" : Glue<Prev, H, Sep>;
type Join<A extends readonly Arg[], Sep extends string, Acc extends string = "", Prev = never> = A extends readonly [infer H, ...infer R extends readonly Arg[]] ? Join<R, Sep, `${Acc}${Next<Prev, H, Sep>}${Text$1<H>}`, H> : Acc;
type Call<N extends string, Sep extends string, A extends readonly Arg[]> = `${N}(${Join<A, Sep>})`;
type Stop<N extends string, Sep extends string, A extends readonly Arg[], Acc extends string = `${N}(`, Prev = never, I extends 0[] = []> = A extends readonly [infer H, ...infer R extends readonly Arg[]] ? `${Acc}${Next<Prev, H, Sep>}${Text$1<H>}` extends (infer J extends string) ? MatchesValue<`<${N}()>`, `${J}${Glue<H, "", Sep>}var(--x))`> extends true ? Stop<N, Sep, R, J, H, [...I, 0]> : MatchesValue<`<${N}()>`, `${J})`> extends true ? Stop<N, Sep, R, J, H, [...I, 0]> : [at: `${I["length"]}`, n: [...I, 0]["length"], bad: Text$1<H>] : never : [at: `${Dec<I>["length"]}`, n: I["length"], bad: ""];
/**
 * The parameters of a call to function `N` joined by `Sep`: `A` when the call is a valid `<N()>`, else the twin's message,
 * with the position of the argument, on the argument where the text stops matching the grammar.
 */
type CheckFn<N extends string, Sep extends string, A extends readonly Arg[]> = ValidIn<`${N}()`, `<${N}()>`, Call<N, Sep, A>> extends (infer V) ? V extends Call<N, Sep, A> ? A : A extends readonly [] ? [value: V] : Stop<N, Sep, A> extends [infer At extends string, infer Pos extends number, infer Bad extends string] ? { [K in keyof A]: K extends At ? `${N}(): ${Unexpected<Bad>} in "${Call<N, Sep, A>}", grammar <${N}()> (${Bad extends "" ? "after " : ""}argument ${Pos})` : A[K]; } : never : never;
/** `rgb`, `linearGradient`, `lightDark`: a call whose result is a `<N()>`, a part wherever the grammar takes one. */
type Fn<N extends string, Sep extends string> = <const A extends readonly Arg[]>(...parts: CheckFn<N, Sep, A>) => CSSStyleValue<N extends "url" | "src" ? "url" : `${N}()`>;
type Known = "length" | "percentage" | "angle" | "time" | "resolution";
type StrKind<S extends string> = S extends `${number}%` ? "percentage" : S extends `${number}${LengthUnit}` ? "length" : S extends `${number}${"deg" | "grad" | "rad" | "turn"}` ? "angle" : S extends `${number}${"s" | "ms"}` ? "time" : S extends `${number}${"dpi" | "dpcm" | "dppx" | "x"}` ? "resolution" : S extends `${number}` ? "number" : S extends "up" | "down" | "nearest" | "to-zero" ? "mode" : "any";
type TypeKind<T extends string> = [Sentinels] extends [T] ? "any" : [T] extends ["number" | "integer"] ? "number" : [T] extends [Known] ? T : "other";
type KindOf$1<H> = H extends number ? "number" : H extends string ? StrKind<H> : H extends CSSStyleValue<infer T> ? TypeKind<T> : "any";
type Show<K> = [K] extends ["percentage"] ? "percentage" : Exclude<K, "percentage"> extends (infer B extends string) ? "percentage" extends K ? `${B}-percentage` : B : never;
type Err$1<I extends 0[], M extends string> = [at: `${I["length"]}`, message: M];
type IsErr<R> = [R] extends [readonly [string, string]] ? true : false;
type Dec<I extends 0[]> = I extends [0, ...infer T extends 0[]] ? T : [];
type AddK<P, K, I extends 0[]> = [P] extends ["any"] ? K : [K] extends ["any"] ? P : [P] extends [K] ? [K] extends [P] ? P : Mix<P, K, I> : Mix<P, K, I>;
type Mix<P, K, I extends 0[]> = [Exclude<P | K, "percentage">] extends ["length"] | ["angle"] ? "percentage" extends P | K ? P | K : Err$1<I, `cannot add ${Show<P>} and ${Show<K>}`> : Err$1<I, `cannot add ${Show<P>} and ${Show<K>}`>;
type MulK<P, K, I extends 0[]> = [P] extends ["any"] ? [K] extends ["number"] ? "any" : K : [K] extends ["any"] ? [P] extends ["number"] ? "any" : P : [P] extends ["number"] ? K : [K] extends ["number"] ? P : Err$1<I, `cannot multiply ${Show<P>} by ${Show<K>}`>;
type DivK<P, K, I extends 0[]> = [P] extends ["any"] ? "any" : [K] extends ["any" | "number"] ? P : [P] extends [K] ? [K] extends [P] ? "number" : Err$1<I, `cannot divide ${Show<P>} by ${Show<K>}`> : Err$1<I, `cannot divide ${Show<P>} by ${Show<K>}`>;
type Fold<Sum, Prod, I extends 0[]> = [Sum] extends [never] ? Prod : AddK<Sum, Prod, I>;
type Join2<Acc, G, I extends 0[]> = [Acc] extends [never] ? G : AddK<Acc, G, I>;
type Walk<A extends readonly Arg[], Acc, Sum, Prod, Pend extends string, I extends 0[] = []> = A extends readonly [infer H, ...infer R extends readonly Arg[]] ? [H] extends [Op] ? Walk<R, Acc, Sum, Prod, H, [...I, 0]> : KindOf$1<H> extends (infer k) ? [k] extends ["mode"] ? Walk<R, Acc, Sum, Prod, Pend, [...I, 0]> : [k] extends ["other"] ? Err$1<I, `${Text$1<H>} is not a number or a dimension`> : [Prod] extends [never] ? Walk<R, Acc, Sum, k, "", [...I, 0]> : Step<R, Acc, Sum, Prod, Pend, k, I> : never : [Prod] extends [never] ? Acc : Join2<Acc, Fold<Sum, Prod, Dec<I>>, Dec<I>>;
type Step<R extends readonly Arg[], Acc, Sum, Prod, Pend extends string, k, I extends 0[]> = Pend extends "*" ? MulK<Prod, k, I> extends (infer X) ? IsErr<X> extends true ? X : Walk<R, Acc, Sum, X, "", [...I, 0]> : never : Pend extends "/" ? DivK<Prod, k, I> extends (infer X) ? IsErr<X> extends true ? X : Walk<R, Acc, Sum, X, "", [...I, 0]> : never : Pend extends "+" | "-" ? Fold<Sum, Prod, I> extends (infer X) ? IsErr<X> extends true ? X : Walk<R, Acc, X, k, "", [...I, 0]> : never : Join2<Acc, Fold<Sum, Prod, I>, I> extends (infer X) ? IsErr<X> extends true ? X : Walk<R, X, never, k, "", [...I, 0]> : never;
/** The parameters of a math call: `A`, or the message of the first operation that mixes kinds, on its argument. */
type CheckMath<A extends readonly Arg[]> = Walk<A, never, never, never, ""> extends (infer R) ? R extends readonly [infer At extends string, infer M extends string] ? { [K in keyof A]: K extends At ? M : A[K]; } : A : never;
type Result<C extends string, A extends readonly Arg[]> = C extends "same" ? Walk<A, never, never, never, ""> extends (infer R) ? [R] extends [never] ? Sentinels : IsErr<R> extends true ? Sentinels : [R] extends ["any"] ? Sentinels : R & string : never : C;
/**
 * A math function: its result is of the kind its arguments have (`same`: `min`, `calc`, `clamp`), or a number or an angle.
 * `calc(t.space.md, "*", 2)` is a length, `calc(t.space.md, "+", t.time.fast)` is an error on `t.time.fast`.
 */
type MathCall<C extends "same" | "number" | "angle"> = <const A extends readonly Arg[]>(...parts: CheckMath<A>) => CSSStyleValue<Result<C, A>>;
/**
 * `var(token, fallback?)`: the token's own type, the fallback checked as a value of it (a string, a Typed OM value of its type, or
 * a call, which the build checks).
 * The first argument is a token, never a name.
 */
type VarCall = <const K extends TokenType, const F extends string = never>(token: Token<K, boolean, string>, fallback?: ValidSyntax<Syntax<K>, F> | CSSStyleValue<(typeof TOKEN_TYPES)[K]["sentinels"][number] | `${string}()`>) => CSSStyleValue<(typeof TOKEN_TYPES)[K]["sentinels"][number]>;
declare namespace members_d_exports {
  export { FlexMethods, GridMethods, WebkitBoxOrient, WebkitBoxReflect, WebkitLineClamp, WebkitTapHighlightColor, WebkitTextFillColor, WebkitTextStroke, WebkitTextStrokeColor, WebkitTextStrokeWidth, WebkitTouchCallout, WebkitUserModify, abs, accentColor, acos, active, alignContent, alignItems, alignSelf, alignmentBaseline, all, anchor, anchorName, anchorScope, anchorSize, animation, animationComposition, animationDelay, animationDirection, animationDuration, animationFillMode, animationIterationCount, animationName, animationPlayState, animationRange, animationRangeEnd, animationRangeStart, animationTimeline, animationTimingFunction, animationTrigger, anyLink, appearance, asin, aspectRatio, atan, atan2, attrFn, autofill, backdropFilter, backfaceVisibility, background, backgroundAttachment, backgroundBlendMode, backgroundClip, backgroundColor, backgroundImage, backgroundOrigin, backgroundPosition, backgroundPositionX, backgroundPositionY, backgroundRepeat, backgroundSize, baselineShift, baselineSource, bg, blockSize, blur, border, borderBlock, borderBlockColor, borderBlockEnd, borderBlockEndColor, borderBlockEndStyle, borderBlockEndWidth, borderBlockStart, borderBlockStartColor, borderBlockStartStyle, borderBlockStartWidth, borderBlockStyle, borderBlockWidth, borderBottom, borderBottomColor, borderBottomLeftRadius, borderBottomRightRadius, borderBottomStyle, borderBottomWidth, borderCollapse, borderColor, borderEndEndRadius, borderEndStartRadius, borderImage, borderImageOutset, borderImageRepeat, borderImageSlice, borderImageSource, borderImageWidth, borderInline, borderInlineColor, borderInlineEnd, borderInlineEndColor, borderInlineEndStyle, borderInlineEndWidth, borderInlineStart, borderInlineStartColor, borderInlineStartStyle, borderInlineStartWidth, borderInlineStyle, borderInlineWidth, borderLeft, borderLeftColor, borderLeftStyle, borderLeftWidth, borderRadius, borderRight, borderRightColor, borderRightStyle, borderRightWidth, borderSpacing, borderStartEndRadius, borderStartStartRadius, borderStyle, borderTop, borderTopColor, borderTopLeftRadius, borderTopRightRadius, borderTopStyle, borderTopWidth, borderWidth, bottom, boxDecorationBreak, boxShadow, boxSizing, breakAfter, breakBefore, breakInside, brightness, buffering, calc, calcSize, captionSide, caret, caretAnimation, caretColor, caretShape, checked, circle, clamp, clear, clipPath, clipRule, color, colorFn, colorInterpolationFilters, colorMix, colorScheme, columnCount, columnFill, columnGap, columnHeight, columnRule, columnRuleColor, columnRuleStyle, columnRuleWidth, columnSpan, columnWidth, columnWrap, columns, conicGradient, contain, containIntrinsicBlockSize, containIntrinsicHeight, containIntrinsicInlineSize, containIntrinsicSize, containIntrinsicWidth, containerName, containerType, content, contentVisibility, contrast, contrastColor, cornerBlockEndShape, cornerBlockStartShape, cornerBottomLeftShape, cornerBottomRightShape, cornerBottomShape, cornerEndEndShape, cornerEndStartShape, cornerInlineEndShape, cornerInlineStartShape, cornerLeftShape, cornerRightShape, cornerShape, cornerStartEndShape, cornerStartStartShape, cornerTopLeftShape, cornerTopRightShape, cornerTopShape, cos, counter, counterIncrement, counterReset, counterSet, counters, crossFade, cubicBezier, cursor, cx, cy, d, defined, direction, disabled, display, dominantBaseline, dropShadow, dynamicRangeLimit, dynamicRangeLimitMix, element, ellipse, empty, emptyCells, enabled, env, exp, fieldSizing, fill, fillOpacity, fillRule, filter, firstChild, firstOfType, fitContent, flex, flexBasis, flexDirection, flexFlow, flexGrow, flexShrink, flexWrap, float, floodColor, floodOpacity, flowTolerance, focus, focusVisible, focusWithin, font, fontFamily, fontFeatureSettings, fontKerning, fontLanguageOverride, fontOpticalSizing, fontPalette, fontSize, fontSizeAdjust, fontStyle, fontSynthesis, fontSynthesisPosition, fontSynthesisSmallCaps, fontSynthesisStyle, fontSynthesisWeight, fontVariant, fontVariantAlternates, fontVariantCaps, fontVariantEastAsian, fontVariantEmoji, fontVariantLigatures, fontVariantNumeric, fontVariantPosition, fontVariationSettings, fontWeight, fontWidth, forcedColorAdjust, fullscreen, future, gap, grayscale, grid, gridArea, gridAutoColumns, gridAutoFlow, gridAutoRows, gridColumn, gridColumnEnd, gridColumnStart, gridRow, gridRowEnd, gridRowStart, gridTemplate, gridTemplateAreas, gridTemplateColumns, gridTemplateRows, hangingPunctuation, height, hover, hsl, hsla, hueRotate, hwb, hyphenateCharacter, hyphenateLimitChars, hyphens, hypot, image, imageOrientation, imageRendering, imageResolution, imageSet, inRange, indeterminate, initialLetter, initialLetterAlign, inlineSize, inset, insetBlock, insetBlockEnd, insetBlockStart, insetFn, insetInline, insetInlineEnd, insetInlineStart, interactivity, interestDelay, interestDelayEnd, interestDelayStart, interpolateSize, invalid, invert, isolation, justifyContent, justifyItems, justifySelf, lab, lastChild, lastOfType, layer, lch, leader, left, letterSpacing, lightDark, lightingColor, lineBreak, lineClamp, lineHeight, lineHeightStep, linear, linearGradient, link, listStyle, listStyleImage, listStylePosition, listStyleType, log, m, margin, marginBlock, marginBlockEnd, marginBlockStart, marginBottom, marginInline, marginInlineEnd, marginInlineStart, marginLeft, marginRight, marginTop, marginTrim, marker, markerEnd, markerMid, markerStart, mask, maskBorder, maskBorderMode, maskBorderOutset, maskBorderRepeat, maskBorderSlice, maskBorderSource, maskBorderWidth, maskClip, maskComposite, maskImage, maskMode, maskOrigin, maskPosition, maskRepeat, maskSize, maskType, mathDepth, mathShift, mathStyle, matrix, matrix3d, max, maxBlockSize, maxHeight, maxInlineSize, maxLines, maxWidth, mb, min, minBlockSize, minHeight, minInlineSize, minWidth, minmax, mixBlendMode, ml, mod, modal, mr, mt, muted, objectFit, objectPosition, objectViewBox, offset, offsetAnchor, offsetDistance, offsetPath, offsetPosition, offsetRotate, oklab, oklch, onlyChild, onlyOfType, opacity, opacityFn, open, optional, order, orphans, outOfRange, outline, outlineColor, outlineOffset, outlineStyle, outlineWidth, overflow, overflowAnchor, overflowBlock, overflowClipMargin, overflowInline, overflowWrap, overflowX, overflowY, overlay, overscrollBehavior, overscrollBehaviorBlock, overscrollBehaviorInline, overscrollBehaviorX, overscrollBehaviorY, p, padding, paddingBlock, paddingBlockEnd, paddingBlockStart, paddingBottom, paddingInline, paddingInlineEnd, paddingInlineStart, paddingLeft, paddingRight, paddingTop, page, paint, paintOrder, paletteMix, past, path, paused, pb, perspective, perspectiveFn, perspectiveOrigin, pictureInPicture, pl, placeContent, placeItems, placeSelf, placeholderShown, playing, pointerEvents, polygon, popoverOpen, position, positionAnchor, positionArea, positionTry$1 as positionTry, positionTryFallbacks, positionTryOrder, positionVisibility, pow, pr, printColorAdjust, pt, quotes, r, radialGradient, ray, readOnly, readWrite, readingFlow, readingOrder, rect, rem, repeatingConicGradient, repeatingLinearGradient, repeatingRadialGradient, required, resize, rgb, rgba, right, root, rotate, rotate3d, rotateFn, rotateX, rotateY, rotateZ, round, rowGap, rubyAlign, rubyMerge, rubyOverhang, rubyPosition, rx, ry, saturate, scale, scale3d, scaleFn, scaleX, scaleY, scaleZ, scope$1 as scope, scroll, scrollBehavior, scrollInitialTarget, scrollMargin, scrollMarginBlock, scrollMarginBlockEnd, scrollMarginBlockStart, scrollMarginBottom, scrollMarginInline, scrollMarginInlineEnd, scrollMarginInlineStart, scrollMarginLeft, scrollMarginRight, scrollMarginTop, scrollMarkerGroup, scrollPadding, scrollPaddingBlock, scrollPaddingBlockEnd, scrollPaddingBlockStart, scrollPaddingBottom, scrollPaddingInline, scrollPaddingInlineEnd, scrollPaddingInlineStart, scrollPaddingLeft, scrollPaddingRight, scrollPaddingTop, scrollSnapAlign, scrollSnapStop, scrollSnapType, scrollTargetGroup, scrollTimeline, scrollTimelineAxis, scrollTimelineName, scrollbarColor, scrollbarGutter, scrollbarWidth, seeking, sepia, shapeImageThreshold, shapeMargin, shapeOutside, shapeRendering, sign, sin, skew, skewX, skewY, speakAs, sqrt, src, stalled, steps, stopColor, stopOpacity, stroke, strokeColor, strokeDasharray, strokeDashoffset, strokeLinecap, strokeLinejoin, strokeMiterlimit, strokeOpacity, strokeWidth, superellipse, symbols, tabSize, tableLayout, tan, target, targetCounter, targetCounters, targetText, textAlign, textAlignLast, textAnchor, textAutospace, textBox, textBoxEdge, textBoxTrim, textCombineUpright, textDecoration, textDecorationColor, textDecorationInset, textDecorationLine, textDecorationSkip, textDecorationSkipInk, textDecorationStyle, textDecorationThickness, textEmphasis, textEmphasisColor, textEmphasisPosition, textEmphasisStyle, textIndent, textJustify, textOrientation, textOverflow, textRendering, textShadow, textSizeAdjust, textSpacingTrim, textTransform, textUnderlineOffset, textUnderlinePosition, textWrap, textWrapMode, textWrapStyle, timelineScope, timelineTrigger, timelineTriggerExitRange, timelineTriggerExitRangeEnd, timelineTriggerExitRangeStart, timelineTriggerName, timelineTriggerRange, timelineTriggerRangeEnd, timelineTriggerRangeStart, timelineTriggerSource, top, touchAction, transform, transformBox, transformOrigin, transformStyle, transition, transitionBehavior, transitionDelay, transitionDuration, transitionProperty, transitionTimingFunction, translate, translate3d, translateFn, translateX, translateY, translateZ, triggerScope, unicodeBidi, url, userInvalid, userSelect, userValid, valid, _var as var, vectorEffect, verticalAlign, view, viewTimeline, viewTimelineAxis, viewTimelineInset, viewTimelineName, viewTransitionClass, viewTransitionName, visibility, visited, volumeLocked, whiteSpace, whiteSpaceCollapse, widows, width, willChange, wordBreak, wordSpacing, wordWrap, writingMode, x, xywh, y, zIndex, zoom };
}
/** `horizontal | vertical | inline-axis | block-axis` */
declare const WebkitBoxOrient: Prop<"-webkit-box-orient">;
/** `[ above | below | right | left ]? <length>? <image>?`. Chrome 4, Edge 79, Firefox no, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/-webkit-box-reflect) */
declare const WebkitBoxReflect: Prop<"-webkit-box-reflect">;
/** `none | <integer [1,∞]>`. [MDN](https://developer.mozilla.org/docs/Web/CSS/-webkit-line-clamp) */
declare const WebkitLineClamp: Prop<"-webkit-line-clamp">;
/** `<color>`. Chrome 16, Edge 12, Firefox no, Safari no, iOS 4, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/-webkit-tap-highlight-color) */
declare const WebkitTapHighlightColor: Prop<"-webkit-tap-highlight-color">;
/** `<color>`. Chrome 1, Edge 12, Firefox 49, Safari 3, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/-webkit-text-fill-color) */
declare const WebkitTextFillColor: Prop<"-webkit-text-fill-color">;
/** `<length> || <color>`. Chrome 4, Edge 15, Firefox 49, Safari 3, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/-webkit-text-stroke) */
declare const WebkitTextStroke: Prop<"-webkit-text-stroke">;
/** `<color>`. Chrome 1, Edge 15, Firefox 49, Safari 3, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/-webkit-text-stroke-color) */
declare const WebkitTextStrokeColor: Prop<"-webkit-text-stroke-color">;
/** `<length>`. Chrome 1, Edge 15, Firefox 49, Safari 3, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/-webkit-text-stroke-width) */
declare const WebkitTextStrokeWidth: Prop<"-webkit-text-stroke-width">;
/** `default | none`. Chrome no, Edge no, Firefox no, Safari no, iOS 2, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/-webkit-touch-callout) */
declare const WebkitTouchCallout: Prop<"-webkit-touch-callout">;
/** `read-only | read-write | read-write-plaintext-only` */
declare const WebkitUserModify: Prop<"-webkit-user-modify">;
/** `auto | <color>`. Chrome 93, Edge 93, Firefox 92, Safari 26.2, iOS 26.2, Android 93. [MDN](https://developer.mozilla.org/docs/Web/CSS/accent-color) */
declare const accentColor: Prop<"accent-color">;
/** `normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>`. Chrome 29, Edge 12, Firefox 28, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/align-content) */
declare const alignContent: Prop<"align-content">;
/** `normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ] | anchor-center`. Chrome 29, Edge 12, Firefox 20, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/align-items) */
declare const alignItems: Prop<"align-items">;
/** `auto | normal | stretch | <baseline-position> | <overflow-position>? <self-position> | anchor-center`. Chrome 29, Edge 12, Firefox 20, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/align-self) */
declare const alignSelf: Prop<"align-self">;
/** `baseline | alphabetic | ideographic | middle | central | mathematical | text-before-edge | text-after-edge`. Chrome 1, Edge 79, Firefox 149, Safari 5.1, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/alignment-baseline) */
declare const alignmentBaseline: Prop<"alignment-baseline">;
/** `initial | inherit | unset | revert | revert-layer`. Chrome 37, Edge 79, Firefox 27, Safari 9.1, iOS 9.3, Android 37. [MDN](https://developer.mozilla.org/docs/Web/CSS/all) */
declare const all: Prop<"all">;
/** `none | <dashed-ident>#`. Chrome 125, Edge 125, Firefox 147, Safari 26, iOS 26, Android 125. [MDN](https://developer.mozilla.org/docs/Web/CSS/anchor-name) */
declare const anchorName: Prop<"anchor-name">;
/** `none | all | <dashed-ident>#`. Chrome 131, Edge 131, Firefox 147, Safari 26, iOS 26, Android 131. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/anchor-scope) */
declare const anchorScope: Prop<"anchor-scope">;
/** `<single-animation>#`. Chrome 43, Edge 12, Firefox 16, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation) */
declare const animation: Prop<"animation">;
/** `<single-animation-composition>#`. Chrome 112, Edge 112, Firefox 115, Safari 16, iOS 16, Android 112. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-composition) */
declare const animationComposition: Prop<"animation-composition">;
/** `<time>#`. Chrome 43, Edge 12, Firefox 16, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-delay) */
declare const animationDelay: Prop<"animation-delay">;
/** `<single-animation-direction>#`. Chrome 43, Edge 12, Firefox 16, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-direction) */
declare const animationDirection: Prop<"animation-direction">;
/** `[ auto | <time [0s,∞]> ]#`. Chrome 43, Edge 12, Firefox 16, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-duration) */
declare const animationDuration: Prop<"animation-duration">;
/** `<single-animation-fill-mode>#`. Chrome 43, Edge 12, Firefox 16, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-fill-mode) */
declare const animationFillMode: Prop<"animation-fill-mode">;
/** `<single-animation-iteration-count>#`. Chrome 43, Edge 12, Firefox 16, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-iteration-count) */
declare const animationIterationCount: Prop<"animation-iteration-count">;
/** `[ none | <keyframes-name> ]#`. Chrome 43, Edge 12, Firefox 16, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-name) */
declare const animationName: Prop<"animation-name">;
/** `<single-animation-play-state>#`. Chrome 43, Edge 12, Firefox 16, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-play-state) */
declare const animationPlayState: Prop<"animation-play-state">;
/** `[ <'animation-range-start'> <'animation-range-end'>? ]#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-range) */
declare const animationRange: Prop<"animation-range">;
/** `[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-range-end) */
declare const animationRangeEnd: Prop<"animation-range-end">;
/** `[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-range-start) */
declare const animationRangeStart: Prop<"animation-range-start">;
/** `<single-animation-timeline>#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-timeline) */
declare const animationTimeline: Prop<"animation-timeline">;
/** `<easing-function>#`. Chrome 43, Edge 12, Firefox 16, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-timing-function) */
declare const animationTimingFunction: Prop<"animation-timing-function">;
/** `[ none | [ <dashed-ident> <animation-action>+ ]+ ]#`. Chrome 146, Edge 146, Firefox no, Safari no, iOS no, Android 146. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/animation-trigger) */
declare const animationTrigger: Prop<"animation-trigger">;
/** `none | auto | <compat-auto> | <compat-special>`. Chrome 84, Edge 84, Firefox 80, Safari 15.4, iOS 15.4, Android 84. [MDN](https://developer.mozilla.org/docs/Web/CSS/appearance) */
declare const appearance: Prop<"appearance">;
/** `auto || <ratio>`. Chrome 88, Edge 88, Firefox 89, Safari 15, iOS 15, Android 88. [MDN](https://developer.mozilla.org/docs/Web/CSS/aspect-ratio) */
declare const aspectRatio: Prop<"aspect-ratio">;
/** `none | <filter-value-list>`. Chrome 76, Edge 79, Firefox 103, Safari 18, iOS 18, Android 76. [MDN](https://developer.mozilla.org/docs/Web/CSS/backdrop-filter) */
declare const backdropFilter: Prop<"backdrop-filter">;
/** `visible | hidden`. Chrome 36, Edge 12, Firefox 16, Safari 15.4, iOS 15.4, Android 36. [MDN](https://developer.mozilla.org/docs/Web/CSS/backface-visibility) */
declare const backfaceVisibility: Prop<"backface-visibility">;
/** `<bg-layer>#? , <final-bg-layer>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background) */
declare const background: Prop<"background">;
/** `<attachment>#`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-attachment) */
declare const backgroundAttachment: Prop<"background-attachment">;
/** `<blend-mode>#`. Chrome 35, Edge 79, Firefox 30, Safari 8, iOS 8, Android 35. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-blend-mode) */
declare const backgroundBlendMode: Prop<"background-blend-mode">;
/** `<bg-clip>#`. Chrome 1, Edge 12, Firefox 4, Safari 5, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-clip) */
declare const backgroundClip: Prop<"background-clip">;
/** `<color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-color) */
declare const backgroundColor: Prop<"background-color">;
/** `<bg-image>#`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-image) */
declare const backgroundImage: Prop<"background-image">;
/** `<visual-box>#`. Chrome 1, Edge 12, Firefox 4, Safari 3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-origin) */
declare const backgroundOrigin: Prop<"background-origin">;
/** `<bg-position>#`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-position) */
declare const backgroundPosition: Prop<"background-position">;
/** `[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#`. Chrome 1, Edge 12, Firefox 49, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-position-x) */
declare const backgroundPositionX: Prop<"background-position-x">;
/** `[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#`. Chrome 1, Edge 12, Firefox 49, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-position-y) */
declare const backgroundPositionY: Prop<"background-position-y">;
/** `<repeat-style>#`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-repeat) */
declare const backgroundRepeat: Prop<"background-repeat">;
/** `<bg-size>#`. Chrome 3, Edge 12, Firefox 4, Safari 5, iOS 4.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-size) */
declare const backgroundSize: Prop<"background-size">;
/** `<length-percentage> | sub | super | baseline`. Chrome 1, Edge 79, Firefox 149, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/baseline-shift) */
declare const baselineShift: Prop<"baseline-shift">;
/** `auto | first | last`. Chrome 111, Edge 111, Firefox 115, Safari no, iOS no, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/baseline-source) */
declare const baselineSource: Prop<"baseline-source">;
/** `<color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/background-color) */
declare const bg: Prop<"background-color">;
/** `<'width'>`. Chrome 57, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/block-size) */
declare const blockSize: Prop<"block-size">;
/** `<line-width> || <line-style> || <color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border) */
declare const border: Prop<"border">;
/** `<'border-block-start'>`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block) */
declare const borderBlock: Prop<"border-block">;
/** `<'border-top-color'>{1,2}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-color) */
declare const borderBlockColor: Prop<"border-block-color">;
/** `<'border-top-width'> || <'border-top-style'> || <color>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-end) */
declare const borderBlockEnd: Prop<"border-block-end">;
/** `<'border-top-color'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-end-color) */
declare const borderBlockEndColor: Prop<"border-block-end-color">;
/** `<'border-top-style'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-end-style) */
declare const borderBlockEndStyle: Prop<"border-block-end-style">;
/** `<'border-top-width'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-end-width) */
declare const borderBlockEndWidth: Prop<"border-block-end-width">;
/** `<'border-top-width'> || <'border-top-style'> || <color>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-start) */
declare const borderBlockStart: Prop<"border-block-start">;
/** `<'border-top-color'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-start-color) */
declare const borderBlockStartColor: Prop<"border-block-start-color">;
/** `<'border-top-style'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-start-style) */
declare const borderBlockStartStyle: Prop<"border-block-start-style">;
/** `<'border-top-width'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-start-width) */
declare const borderBlockStartWidth: Prop<"border-block-start-width">;
/** `<'border-top-style'>{1,2}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-style) */
declare const borderBlockStyle: Prop<"border-block-style">;
/** `<'border-top-width'>{1,2}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-block-width) */
declare const borderBlockWidth: Prop<"border-block-width">;
/** `<line-width> || <line-style> || <color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-bottom) */
declare const borderBottom: Prop<"border-bottom">;
/** `<'border-top-color'>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-bottom-color) */
declare const borderBottomColor: Prop<"border-bottom-color">;
/** `<length-percentage [0,∞]>{1,2}`. Chrome 4, Edge 12, Firefox 4, Safari 5, iOS 4.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-bottom-left-radius) */
declare const borderBottomLeftRadius: Prop<"border-bottom-left-radius">;
/** `<length-percentage [0,∞]>{1,2}`. Chrome 4, Edge 12, Firefox 4, Safari 5, iOS 4.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-bottom-right-radius) */
declare const borderBottomRightRadius: Prop<"border-bottom-right-radius">;
/** `<line-style>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-bottom-style) */
declare const borderBottomStyle: Prop<"border-bottom-style">;
/** `<line-width>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-bottom-width) */
declare const borderBottomWidth: Prop<"border-bottom-width">;
/** `separate | collapse`. Chrome 1, Edge 12, Firefox 1, Safari 1.1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-collapse) */
declare const borderCollapse: Prop<"border-collapse">;
/** `<color>{1,4}`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-color) */
declare const borderColor: Prop<"border-color">;
/** `<'border-top-left-radius'>`. Chrome 89, Edge 89, Firefox 66, Safari 15, iOS 15, Android 89. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-end-end-radius) */
declare const borderEndEndRadius: Prop<"border-end-end-radius">;
/** `<'border-top-left-radius'>`. Chrome 89, Edge 89, Firefox 66, Safari 15, iOS 15, Android 89. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-end-start-radius) */
declare const borderEndStartRadius: Prop<"border-end-start-radius">;
/** `<'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>`. Chrome 16, Edge 12, Firefox 15, Safari 6, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-image) */
declare const borderImage: Prop<"border-image">;
/** `[ <length [0,∞]> | <number [0,∞]> ]{1,4}`. Chrome 15, Edge 12, Firefox 15, Safari 6, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-image-outset) */
declare const borderImageOutset: Prop<"border-image-outset">;
/** `[ stretch | repeat | round | space ]{1,2}`. Chrome 15, Edge 12, Firefox 15, Safari 6, iOS 9.3, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-image-repeat) */
declare const borderImageRepeat: Prop<"border-image-repeat">;
/** `[ <number [0,∞]> | <percentage [0,∞]> ]{1,4} && fill?`. Chrome 15, Edge 12, Firefox 15, Safari 6, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-image-slice) */
declare const borderImageSlice: Prop<"border-image-slice">;
/** `none | <image>`. Chrome 15, Edge 12, Firefox 15, Safari 6, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-image-source) */
declare const borderImageSource: Prop<"border-image-source">;
/** `[ <length-percentage [0,∞]> | <number [0,∞]> | auto ]{1,4}`. Chrome 16, Edge 12, Firefox 13, Safari 6, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-image-width) */
declare const borderImageWidth: Prop<"border-image-width">;
/** `<'border-block-start'>`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline) */
declare const borderInline: Prop<"border-inline">;
/** `<'border-top-color'>{1,2}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-color) */
declare const borderInlineColor: Prop<"border-inline-color">;
/** `<'border-top-width'> || <'border-top-style'> || <color>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-end) */
declare const borderInlineEnd: Prop<"border-inline-end">;
/** `<'border-top-color'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-end-color) */
declare const borderInlineEndColor: Prop<"border-inline-end-color">;
/** `<'border-top-style'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-end-style) */
declare const borderInlineEndStyle: Prop<"border-inline-end-style">;
/** `<'border-top-width'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-end-width) */
declare const borderInlineEndWidth: Prop<"border-inline-end-width">;
/** `<'border-top-width'> || <'border-top-style'> || <color>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-start) */
declare const borderInlineStart: Prop<"border-inline-start">;
/** `<'border-top-color'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-start-color) */
declare const borderInlineStartColor: Prop<"border-inline-start-color">;
/** `<'border-top-style'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-start-style) */
declare const borderInlineStartStyle: Prop<"border-inline-start-style">;
/** `<'border-top-width'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-start-width) */
declare const borderInlineStartWidth: Prop<"border-inline-start-width">;
/** `<'border-top-style'>{1,2}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-style) */
declare const borderInlineStyle: Prop<"border-inline-style">;
/** `<'border-top-width'>{1,2}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-inline-width) */
declare const borderInlineWidth: Prop<"border-inline-width">;
/** `<line-width> || <line-style> || <color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-left) */
declare const borderLeft: Prop<"border-left">;
/** `<color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-left-color) */
declare const borderLeftColor: Prop<"border-left-color">;
/** `<line-style>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-left-style) */
declare const borderLeftStyle: Prop<"border-left-style">;
/** `<line-width>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-left-width) */
declare const borderLeftWidth: Prop<"border-left-width">;
/** `<length-percentage [0,∞]>{1,4} [ / <length-percentage [0,∞]>{1,4} ]?`. Chrome 4, Edge 12, Firefox 4, Safari 5, iOS 4.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-radius) */
declare const borderRadius: Prop<"border-radius">;
/** `<line-width> || <line-style> || <color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-right) */
declare const borderRight: Prop<"border-right">;
/** `<color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-right-color) */
declare const borderRightColor: Prop<"border-right-color">;
/** `<line-style>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-right-style) */
declare const borderRightStyle: Prop<"border-right-style">;
/** `<line-width>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-right-width) */
declare const borderRightWidth: Prop<"border-right-width">;
/** `<length [0,∞]>{1,2}`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-spacing) */
declare const borderSpacing: Prop<"border-spacing">;
/** `<'border-top-left-radius'>`. Chrome 89, Edge 89, Firefox 66, Safari 15, iOS 15, Android 89. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-start-end-radius) */
declare const borderStartEndRadius: Prop<"border-start-end-radius">;
/** `<'border-top-left-radius'>`. Chrome 89, Edge 89, Firefox 66, Safari 15, iOS 15, Android 89. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-start-start-radius) */
declare const borderStartStartRadius: Prop<"border-start-start-radius">;
/** `<line-style>{1,4}`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-style) */
declare const borderStyle: Prop<"border-style">;
/** `<line-width> || <line-style> || <color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-top) */
declare const borderTop: Prop<"border-top">;
/** `<color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-top-color) */
declare const borderTopColor: Prop<"border-top-color">;
/** `<length-percentage [0,∞]>{1,2}`. Chrome 4, Edge 12, Firefox 4, Safari 5, iOS 4.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-top-left-radius) */
declare const borderTopLeftRadius: Prop<"border-top-left-radius">;
/** `<length-percentage [0,∞]>{1,2}`. Chrome 4, Edge 12, Firefox 4, Safari 5, iOS 4.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-top-right-radius) */
declare const borderTopRightRadius: Prop<"border-top-right-radius">;
/** `<line-style>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-top-style) */
declare const borderTopStyle: Prop<"border-top-style">;
/** `<line-width>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-top-width) */
declare const borderTopWidth: Prop<"border-top-width">;
/** `<line-width>{1,4}`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 3, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/border-width) */
declare const borderWidth: Prop<"border-width">;
/** `auto | <length-percentage> | <anchor()> | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/bottom) */
declare const bottom: Prop<"bottom">;
/** `slice | clone`. Chrome 130, Edge 130, Firefox 32, Safari no, iOS no, Android 130. [MDN](https://developer.mozilla.org/docs/Web/CSS/box-decoration-break) */
declare const boxDecorationBreak: Prop<"box-decoration-break">;
/** `none | <shadow>#`. Chrome 10, Edge 12, Firefox 4, Safari 5.1, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/box-shadow) */
declare const boxShadow: Prop<"box-shadow">;
/** `content-box | border-box`. Chrome 10, Edge 12, Firefox 29, Safari 5.1, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/box-sizing) */
declare const boxSizing: Prop<"box-sizing">;
/** `auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region`. Chrome 50, Edge 12, Firefox 65, Safari 10, iOS 10, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/break-after) */
declare const breakAfter: Prop<"break-after">;
/** `auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region`. Chrome 50, Edge 12, Firefox 65, Safari 10, iOS 10, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/break-before) */
declare const breakBefore: Prop<"break-before">;
/** `auto | avoid | avoid-page | avoid-column | avoid-region`. Chrome 50, Edge 12, Firefox 65, Safari 10, iOS 10, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/break-inside) */
declare const breakInside: Prop<"break-inside">;
/** `top | bottom`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/caption-side) */
declare const captionSide: Prop<"caption-side">;
/** `<'caret-color'> || <'caret-animation'> || <'caret-shape'>` */
declare const caret: Prop<"caret">;
/** `auto | manual`. Chrome 140, Edge 140, Firefox no, Safari no, iOS no, Android 140. [MDN](https://developer.mozilla.org/docs/Web/CSS/caret-animation) */
declare const caretAnimation: Prop<"caret-animation">;
/** `auto | <color>`. Chrome 57, Edge 79, Firefox 53, Safari 11.1, iOS 11.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/caret-color) */
declare const caretColor: Prop<"caret-color">;
/** `auto | bar | block | underscore`. Chrome 144, Edge 144, Firefox no, Safari no, iOS no, Android 144. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/caret-shape) */
declare const caretShape: Prop<"caret-shape">;
/** `none | left | right | both | inline-start | inline-end`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/clear) */
declare const clear: Prop<"clear">;
/** `<clip-source> | [ <basic-shape> || <geometry-box> ] | none`. Chrome 55, Edge 79, Firefox 3.5, Safari 9.1, iOS 9.3, Android 55. [MDN](https://developer.mozilla.org/docs/Web/CSS/clip-path) */
declare const clipPath: Prop<"clip-path">;
/** `nonzero | evenodd`. Chrome ≤15, Edge 79, Firefox 3.5, Safari ≤5, iOS ≤4.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/clip-rule) */
declare const clipRule: Prop<"clip-rule">;
/** `<color>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/color) */
declare const color: Prop<"color">;
/** `auto | sRGB | linearRGB`. Chrome 1, Edge 79, Firefox 3, Safari 3, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/color-interpolation-filters) */
declare const colorInterpolationFilters: Prop<"color-interpolation-filters">;
/** `normal | [ light | dark | <custom-ident> ]+ && only?`. Chrome 81, Edge 81, Firefox 96, Safari 13, iOS 13, Android 81. [MDN](https://developer.mozilla.org/docs/Web/CSS/color-scheme) */
declare const colorScheme: Prop<"color-scheme">;
/** `<integer [1,∞]> | auto`. Chrome 50, Edge 12, Firefox 52, Safari 9, iOS 9, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-count) */
declare const columnCount: Prop<"column-count">;
/** `auto | balance`. Chrome 50, Edge 12, Firefox 52, Safari 9, iOS 9, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-fill) */
declare const columnFill: Prop<"column-fill">;
/** `normal | <length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1.5, Safari 3, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-gap) */
declare const columnGap: Prop<"column-gap">;
/** `auto | <length [0,∞]>`. Chrome 145, Edge 145, Firefox no, Safari no, iOS no, Android 145. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-height) */
declare const columnHeight: Prop<"column-height">;
/** `<gap-rule-list> | <gap-auto-rule-list>`. Chrome 50, Edge 12, Firefox 52, Safari 9, iOS 9, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-rule) */
declare const columnRule: Prop<"column-rule">;
/** `<line-color-list> | <auto-line-color-list>`. Chrome 50, Edge 12, Firefox 52, Safari 9, iOS 9, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-rule-color) */
declare const columnRuleColor: Prop<"column-rule-color">;
/** `<line-style-list> | <auto-line-style-list>`. Chrome 50, Edge 12, Firefox 52, Safari 9, iOS 9, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-rule-style) */
declare const columnRuleStyle: Prop<"column-rule-style">;
/** `<line-width-list> | <auto-line-width-list>`. Chrome 50, Edge 12, Firefox 52, Safari 9, iOS 9, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-rule-width) */
declare const columnRuleWidth: Prop<"column-rule-width">;
/** `none | all`. Chrome 50, Edge 12, Firefox 71, Safari 9, iOS 9, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-span) */
declare const columnSpan: Prop<"column-span">;
/** `auto | <length [0,∞]>`. Chrome 50, Edge 12, Firefox 50, Safari 9, iOS 9, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-width) */
declare const columnWidth: Prop<"column-width">;
/** `auto | nowrap | wrap`. Chrome 145, Edge 145, Firefox no, Safari no, iOS no, Android 145. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-wrap) */
declare const columnWrap: Prop<"column-wrap">;
/** `[ <'column-width'> || <'column-count'> ] [ / <'column-height'> ]?`. Chrome 50, Edge 12, Firefox 52, Safari 9, iOS 9, Android 50. [MDN](https://developer.mozilla.org/docs/Web/CSS/columns) */
declare const columns: Prop<"columns">;
/** `none | strict | content | [ [size | inline-size] || layout || style || paint ]`. Chrome 52, Edge 79, Firefox 69, Safari 15.4, iOS 15.4, Android 52. [MDN](https://developer.mozilla.org/docs/Web/CSS/contain) */
declare const contain: Prop<"contain">;
/** `auto? [ none | <length [0,∞]> ]`. Chrome 95, Edge 95, Firefox 107, Safari 17, iOS 17, Android 95. [MDN](https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-block-size) */
declare const containIntrinsicBlockSize: Prop<"contain-intrinsic-block-size">;
/** `auto? [ none | <length [0,∞]> ]`. Chrome 95, Edge 95, Firefox 107, Safari 17, iOS 17, Android 95. [MDN](https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-height) */
declare const containIntrinsicHeight: Prop<"contain-intrinsic-height">;
/** `auto? [ none | <length [0,∞]> ]`. Chrome 95, Edge 95, Firefox 107, Safari 17, iOS 17, Android 95. [MDN](https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-inline-size) */
declare const containIntrinsicInlineSize: Prop<"contain-intrinsic-inline-size">;
/** `[ auto? [ none | <length [0,∞]> ] ]{1,2}`. Chrome 83, Edge 83, Firefox 107, Safari 17, iOS 17, Android 83. [MDN](https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-size) */
declare const containIntrinsicSize: Prop<"contain-intrinsic-size">;
/** `auto? [ none | <length [0,∞]> ]`. Chrome 95, Edge 95, Firefox 107, Safari 17, iOS 17, Android 95. [MDN](https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-width) */
declare const containIntrinsicWidth: Prop<"contain-intrinsic-width">;
/** `none | <custom-ident>+`. Chrome 105, Edge 105, Firefox 110, Safari 16, iOS 16, Android 105. [MDN](https://developer.mozilla.org/docs/Web/CSS/container-name) */
declare const containerName: Prop<"container-name">;
/** `normal | [ [ size | inline-size ] || scroll-state ]`. Chrome 105, Edge 105, Firefox 110, Safari 16, iOS 16, Android 105. [MDN](https://developer.mozilla.org/docs/Web/CSS/container-type) */
declare const containerType: Prop<"container-type">;
/** `normal | none | [ <content-replacement> | <content-list> ] [ / [ <string> | <counter> | <attr()> ]+ ]?`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/content) */
declare const content: Prop<"content">;
/** `visible | auto | hidden`. Chrome 85, Edge 85, Firefox 125, Safari 18, iOS 18, Android 85. [MDN](https://developer.mozilla.org/docs/Web/CSS/content-visibility) */
declare const contentVisibility: Prop<"content-visibility">;
/** `<corner-shape-value>{1,2}`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-block-end-shape) */
declare const cornerBlockEndShape: Prop<"corner-block-end-shape">;
/** `<corner-shape-value>{1,2}`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-block-start-shape) */
declare const cornerBlockStartShape: Prop<"corner-block-start-shape">;
/** `<corner-shape-value>`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-bottom-left-shape) */
declare const cornerBottomLeftShape: Prop<"corner-bottom-left-shape">;
/** `<corner-shape-value>`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-bottom-right-shape) */
declare const cornerBottomRightShape: Prop<"corner-bottom-right-shape">;
/** `<corner-shape-value>{1,2}`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-bottom-shape) */
declare const cornerBottomShape: Prop<"corner-bottom-shape">;
/** `<corner-shape-value>`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-end-end-shape) */
declare const cornerEndEndShape: Prop<"corner-end-end-shape">;
/** `<corner-shape-value>`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-end-start-shape) */
declare const cornerEndStartShape: Prop<"corner-end-start-shape">;
/** `<corner-shape-value>{1,2}`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-inline-end-shape) */
declare const cornerInlineEndShape: Prop<"corner-inline-end-shape">;
/** `<corner-shape-value>{1,2}`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-inline-start-shape) */
declare const cornerInlineStartShape: Prop<"corner-inline-start-shape">;
/** `<corner-shape-value>{1,2}`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-left-shape) */
declare const cornerLeftShape: Prop<"corner-left-shape">;
/** `<corner-shape-value>{1,2}`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-right-shape) */
declare const cornerRightShape: Prop<"corner-right-shape">;
/** `<corner-shape-value>{1,4}`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-shape) */
declare const cornerShape: Prop<"corner-shape">;
/** `<corner-shape-value>`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-start-end-shape) */
declare const cornerStartEndShape: Prop<"corner-start-end-shape">;
/** `<corner-shape-value>`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-start-start-shape) */
declare const cornerStartStartShape: Prop<"corner-start-start-shape">;
/** `<corner-shape-value>`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-top-left-shape) */
declare const cornerTopLeftShape: Prop<"corner-top-left-shape">;
/** `<corner-shape-value>`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-top-right-shape) */
declare const cornerTopRightShape: Prop<"corner-top-right-shape">;
/** `<corner-shape-value>{1,2}`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/corner-top-shape) */
declare const cornerTopShape: Prop<"corner-top-shape">;
/** `[ <counter-name> <integer>? ]+ | none`. Chrome 2, Edge 12, Firefox 1, Safari 3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/counter-increment) */
declare const counterIncrement: Prop<"counter-increment">;
/** `[ <counter-name> <integer>? | <reversed-counter-name> <integer>? ]+ | none`. Chrome 2, Edge 12, Firefox 1, Safari 3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/counter-reset) */
declare const counterReset: Prop<"counter-reset">;
/** `[ <counter-name> <integer>? ]+ | none`. Chrome 85, Edge 85, Firefox 68, Safari 17.2, iOS 17.2, Android 85. [MDN](https://developer.mozilla.org/docs/Web/CSS/counter-set) */
declare const counterSet: Prop<"counter-set">;
/** `[ [ <url> [ <x> <y> ]? , ]* <cursor-predefined> ]`. Chrome 1, Edge 12, Firefox 1, Safari 1.2, iOS 13.4, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/cursor) */
declare const cursor: Prop<"cursor">;
/** `<length-percentage>`. Chrome 43, Edge 79, Firefox 69, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/cx) */
declare const cx: Prop<"cx">;
/** `<length-percentage>`. Chrome 43, Edge 79, Firefox 69, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/cy) */
declare const cy: Prop<"cy">;
/** `none | path(<string>)`. Chrome 52, Edge 79, Firefox 97, Safari no, iOS no, Android 52. [MDN](https://developer.mozilla.org/docs/Web/CSS/d) */
declare const d: Prop<"d">;
/** `ltr | rtl`. Chrome 2, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/direction) */
declare const direction: Prop<"direction">;
/** `[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy> | grid-lanes | inline-grid-lanes | <display-outside> || [ <display-inside> | math ]`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/display) */
declare const display: Prop<"display">;
/** `auto | text-bottom | alphabetic | ideographic | middle | central | mathematical | hanging | text-top`. Chrome 1, Edge 79, Firefox 1, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/dominant-baseline) */
declare const dominantBaseline: Prop<"dominant-baseline">;
/** `standard | no-limit | constrained | <dynamic-range-limit-mix()>`. Chrome 136, Edge 136, Firefox no, Safari 26, iOS 26, Android 136. [MDN](https://developer.mozilla.org/docs/Web/CSS/dynamic-range-limit) */
declare const dynamicRangeLimit: Prop<"dynamic-range-limit">;
/** `show | hide`. Chrome 1, Edge 12, Firefox 1, Safari 1.2, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/empty-cells) */
declare const emptyCells: Prop<"empty-cells">;
/** `content | fixed`. Chrome 123, Edge 123, Firefox 152, Safari 26.2, iOS 26.2, Android 123. [MDN](https://developer.mozilla.org/docs/Web/CSS/field-sizing) */
declare const fieldSizing: Prop<"field-sizing">;
/** `<paint>`. Chrome 1, Edge ≤15, Firefox 3, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/fill) */
declare const fill: Prop<"fill">;
/** `<'opacity'>`. Chrome 1, Edge ≤15, Firefox 1, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/fill-opacity) */
declare const fillOpacity: Prop<"fill-opacity">;
/** `nonzero | evenodd`. Chrome 1, Edge ≤15, Firefox 3, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/fill-rule) */
declare const fillRule: Prop<"fill-rule">;
/** `none | <filter-value-list>`. Chrome 53, Edge 12, Firefox 35, Safari 9.1, iOS 9.3, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter) */
declare const filter: Prop<"filter">;
/** `content | <'width'>`. Chrome 29, Edge 12, Firefox 22, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/flex-basis) */
declare const flexBasis: Prop<"flex-basis">;
/** `row | row-reverse | column | column-reverse`. Chrome 29, Edge 12, Firefox 22, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/flex-direction) */
declare const flexDirection: Prop<"flex-direction">;
/** `<'flex-direction'> || <'flex-wrap'>`. Chrome 29, Edge 12, Firefox 28, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/flex-flow) */
declare const flexFlow: Prop<"flex-flow">;
/** `<number [0,∞]>`. Chrome 29, Edge 12, Firefox 20, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/flex-grow) */
declare const flexGrow: Prop<"flex-grow">;
/** `<number [0,∞]>`. Chrome 29, Edge 12, Firefox 20, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/flex-shrink) */
declare const flexShrink: Prop<"flex-shrink">;
/** `nowrap | [ wrap | wrap-reverse ] || balance`. Chrome 29, Edge 12, Firefox 28, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/flex-wrap) */
declare const flexWrap: Prop<"flex-wrap">;
/** `left | right | none | inline-start | inline-end`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/float) */
declare const float: Prop<"float">;
/** `<color>`. Chrome 5, Edge 12, Firefox 3, Safari 6, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/flood-color) */
declare const floodColor: Prop<"flood-color">;
/** `<'opacity'>`. Chrome 5, Edge 12, Firefox 3, Safari 6, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/flood-opacity) */
declare const floodOpacity: Prop<"flood-opacity">;
/** `normal | <length-percentage [0,∞]> | infinite`. Chrome no, Edge no, Firefox no, Safari 26.4, iOS 26.4, Android no */
declare const flowTolerance: Prop<"flow-tolerance">;
/** `[ [ <'font-style'> || <font-variant-css2> || <'font-weight'> || <font-width-css3> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'># ] | <system-family-name>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/font) */
declare const font: Prop<"font">;
/** `[ <family-name> | <generic-family> ]#`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-family) */
declare const fontFamily: Prop<"font-family">;
/** `normal | <feature-tag-value>#`. Chrome 48, Edge 15, Firefox 34, Safari 9.1, iOS 9.3, Android 48. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-feature-settings) */
declare const fontFeatureSettings: Prop<"font-feature-settings">;
/** `auto | normal | none`. Chrome 33, Edge 79, Firefox 32, Safari 9, iOS 9, Android 33. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-kerning) */
declare const fontKerning: Prop<"font-kerning">;
/** `normal | <string>`. Chrome 143, Edge 143, Firefox 34, Safari no, iOS no, Android 143. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-language-override) */
declare const fontLanguageOverride: Prop<"font-language-override">;
/** `auto | none`. Chrome 79, Edge 17, Firefox 62, Safari 13.1, iOS 13.4, Android 79. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-optical-sizing) */
declare const fontOpticalSizing: Prop<"font-optical-sizing">;
/** `normal | light | dark | <palette-identifier> | <palette-mix()>`. Chrome 101, Edge 101, Firefox 107, Safari 15.4, iOS 15.4, Android 101. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-palette) */
declare const fontPalette: Prop<"font-palette">;
/** `<absolute-size> | <relative-size> | <length-percentage [0,∞]> | math`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-size) */
declare const fontSize: Prop<"font-size">;
/** `none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number [0,∞]> ]`. Chrome 127, Edge 127, Firefox 3, Safari 16.4, iOS 16.4, Android 127. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-size-adjust) */
declare const fontSizeAdjust: Prop<"font-size-adjust">;
/** `normal | italic | oblique <angle [-90deg,90deg]>?`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-style) */
declare const fontStyle: Prop<"font-style">;
/** `none | [ weight || style || small-caps || position]`. Chrome 97, Edge 97, Firefox 34, Safari 9, iOS 9, Android 97. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-synthesis) */
declare const fontSynthesis: Prop<"font-synthesis">;
/** `auto | none`. Chrome no, Edge no, Firefox 118, Safari no, iOS no, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-synthesis-position) */
declare const fontSynthesisPosition: Prop<"font-synthesis-position">;
/** `auto | none`. Chrome 97, Edge 97, Firefox 111, Safari 16.4, iOS 16.4, Android 97. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-synthesis-small-caps) */
declare const fontSynthesisSmallCaps: Prop<"font-synthesis-small-caps">;
/** `auto | none`. Chrome 97, Edge 97, Firefox 111, Safari 16.4, iOS 16.4, Android 97. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-synthesis-style) */
declare const fontSynthesisStyle: Prop<"font-synthesis-style">;
/** `auto | none`. Chrome 97, Edge 97, Firefox 111, Safari 16.4, iOS 16.4, Android 97. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-synthesis-weight) */
declare const fontSynthesisWeight: Prop<"font-synthesis-weight">;
/** `normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-variant) */
declare const fontVariant: Prop<"font-variant">;
/** `normal | [ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]`. Chrome 111, Edge 111, Firefox 34, Safari 9.1, iOS 9.3, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-variant-alternates) */
declare const fontVariantAlternates: Prop<"font-variant-alternates">;
/** `normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps`. Chrome 52, Edge 79, Firefox 34, Safari 9.1, iOS 9.3, Android 52. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-variant-caps) */
declare const fontVariantCaps: Prop<"font-variant-caps">;
/** `normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]`. Chrome 63, Edge 79, Firefox 34, Safari 9.1, iOS 9.3, Android 63. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-variant-east-asian) */
declare const fontVariantEastAsian: Prop<"font-variant-east-asian">;
/** `normal | text | emoji | unicode`. Chrome 131, Edge 131, Firefox 141, Safari no, iOS no, Android 131. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-variant-emoji) */
declare const fontVariantEmoji: Prop<"font-variant-emoji">;
/** `normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]`. Chrome 34, Edge 79, Firefox 34, Safari 9.1, iOS 9.3, Android 34. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-variant-ligatures) */
declare const fontVariantLigatures: Prop<"font-variant-ligatures">;
/** `normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]`. Chrome 52, Edge 79, Firefox 34, Safari 9.1, iOS 9.3, Android 52. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-variant-numeric) */
declare const fontVariantNumeric: Prop<"font-variant-numeric">;
/** `normal | sub | super`. Chrome 117, Edge 117, Firefox 34, Safari 9.1, iOS 9.3, Android 117. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-variant-position) */
declare const fontVariantPosition: Prop<"font-variant-position">;
/** `normal | [ <string> <number> ]#`. Chrome 62, Edge 17, Firefox 62, Safari 11, iOS 11, Android 62. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-variation-settings) */
declare const fontVariationSettings: Prop<"font-variation-settings">;
/** `<font-weight-absolute> | bolder | lighter`. Chrome 2, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-weight) */
declare const fontWeight: Prop<"font-weight">;
/** `normal | <percentage [0,∞]> | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded`. Chrome no, Edge no, Firefox 155, Safari 18.4, iOS 18.4, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/font-width) */
declare const fontWidth: Prop<"font-width">;
/** `auto | none | preserve-parent-color`. Chrome 89, Edge 79, Firefox 113, Safari no, iOS no, Android 89. [MDN](https://developer.mozilla.org/docs/Web/CSS/forced-color-adjust) */
declare const forcedColorAdjust: Prop<"forced-color-adjust">;
/** `<'row-gap'> <'column-gap'>?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/gap) */
declare const gap: Prop<"gap">;
/** `<grid-line> [ / <grid-line> ]{0,3}`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-area) */
declare const gridArea: Prop<"grid-area">;
/** `<track-size>+`. Chrome 57, Edge 16, Firefox 70, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-auto-columns) */
declare const gridAutoColumns: Prop<"grid-auto-columns">;
/** `[ row | column ] || dense`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-auto-flow) */
declare const gridAutoFlow: Prop<"grid-auto-flow">;
/** `<track-size>+`. Chrome 57, Edge 16, Firefox 70, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-auto-rows) */
declare const gridAutoRows: Prop<"grid-auto-rows">;
/** `<grid-line> [ / <grid-line> ]?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-column) */
declare const gridColumn: Prop<"grid-column">;
/** `<grid-line>`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-column-end) */
declare const gridColumnEnd: Prop<"grid-column-end">;
/** `<grid-line>`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-column-start) */
declare const gridColumnStart: Prop<"grid-column-start">;
/** `<grid-line> [ / <grid-line> ]?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-row) */
declare const gridRow: Prop<"grid-row">;
/** `<grid-line>`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-row-end) */
declare const gridRowEnd: Prop<"grid-row-end">;
/** `<grid-line>`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-row-start) */
declare const gridRowStart: Prop<"grid-row-start">;
/** `none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-template) */
declare const gridTemplate: Prop<"grid-template">;
/** `none | <string>+`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-template-areas) */
declare const gridTemplateAreas: Prop<"grid-template-areas">;
/** `none | <track-list> | <auto-track-list> | subgrid <line-name-list>?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-template-columns) */
declare const gridTemplateColumns: Prop<"grid-template-columns">;
/** `none | <track-list> | <auto-track-list> | subgrid <line-name-list>?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-template-rows) */
declare const gridTemplateRows: Prop<"grid-template-rows">;
/** `none | [ first || [ force-end | allow-end ] || last ]`. Chrome no, Edge no, Firefox no, Safari 26.5, iOS 26.5, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/hanging-punctuation) */
declare const hangingPunctuation: Prop<"hanging-punctuation">;
/** `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/height) */
declare const height: Prop<"height">;
/** `auto | <string>`. Chrome 106, Edge 106, Firefox 98, Safari 17, iOS 17, Android 106. [MDN](https://developer.mozilla.org/docs/Web/CSS/hyphenate-character) */
declare const hyphenateCharacter: Prop<"hyphenate-character">;
/** `[ auto | <integer [0,∞]> ]{1,3}`. Chrome 109, Edge 109, Firefox 137, Safari no, iOS no, Android 109. [MDN](https://developer.mozilla.org/docs/Web/CSS/hyphenate-limit-chars) */
declare const hyphenateLimitChars: Prop<"hyphenate-limit-chars">;
/** `none | manual | auto`. Chrome 55, Edge 79, Firefox 43, Safari 17, iOS 17, Android 55. [MDN](https://developer.mozilla.org/docs/Web/CSS/hyphens) */
declare const hyphens: Prop<"hyphens">;
/** `from-image | none`. Chrome 81, Edge 81, Firefox 26, Safari 13.1, iOS 13.4, Android 81. [MDN](https://developer.mozilla.org/docs/Web/CSS/image-orientation) */
declare const imageOrientation: Prop<"image-orientation">;
/** `auto | crisp-edges | pixelated | smooth`. Chrome 13, Edge 79, Firefox 3.6, Safari 6, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/image-rendering) */
declare const imageRendering: Prop<"image-rendering">;
/** `[ from-image || <resolution> ] && snap?`. [MDN](https://developer.mozilla.org/docs/Web/CSS/image-resolution) */
declare const imageResolution: Prop<"image-resolution">;
/** `normal | <number [1,∞]> <integer [1,∞]> | <number [1,∞]> && [ drop | raise ]?`. Chrome 110, Edge 110, Firefox no, Safari no, iOS no, Android 110. [MDN](https://developer.mozilla.org/docs/Web/CSS/initial-letter) */
declare const initialLetter: Prop<"initial-letter">;
/** `[ auto | alphabetic | hanging | ideographic ]` */
declare const initialLetterAlign: Prop<"initial-letter-align">;
/** `<'width'>`. Chrome 57, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/inline-size) */
declare const inlineSize: Prop<"inline-size">;
/** `<'top'>{1,4}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/inset) */
declare const inset: Prop<"inset">;
/** `<'top'>{1,2}`. Chrome 87, Edge 87, Firefox 63, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/inset-block) */
declare const insetBlock: Prop<"inset-block">;
/** `<'top'>`. Chrome 87, Edge 87, Firefox 63, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/inset-block-end) */
declare const insetBlockEnd: Prop<"inset-block-end">;
/** `<'top'>`. Chrome 87, Edge 87, Firefox 63, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/inset-block-start) */
declare const insetBlockStart: Prop<"inset-block-start">;
/** `<'top'>{1,2}`. Chrome 87, Edge 87, Firefox 63, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/inset-inline) */
declare const insetInline: Prop<"inset-inline">;
/** `<'top'>`. Chrome 87, Edge 87, Firefox 63, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/inset-inline-end) */
declare const insetInlineEnd: Prop<"inset-inline-end">;
/** `<'top'>`. Chrome 87, Edge 87, Firefox 63, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/inset-inline-start) */
declare const insetInlineStart: Prop<"inset-inline-start">;
/** `auto | inert`. Chrome 135, Edge 135, Firefox no, Safari no, iOS no, Android 135. [MDN](https://developer.mozilla.org/docs/Web/CSS/interactivity) */
declare const interactivity: Prop<"interactivity">;
/** `<'interest-delay-start'>{1,2}`. Chrome 142, Edge 142, Firefox no, Safari no, iOS no, Android 142. [MDN](https://developer.mozilla.org/docs/Web/CSS/interest-delay-end) */
declare const interestDelay: Prop<"interest-delay">;
/** `normal | <time>`. Chrome 142, Edge 142, Firefox no, Safari no, iOS no, Android 142. [MDN](https://developer.mozilla.org/docs/Web/CSS/interest-delay-end) */
declare const interestDelayEnd: Prop<"interest-delay-end">;
/** `normal | <time>`. Chrome 142, Edge 142, Firefox no, Safari no, iOS no, Android 142. [MDN](https://developer.mozilla.org/docs/Web/CSS/interest-delay-start) */
declare const interestDelayStart: Prop<"interest-delay-start">;
/** `numeric-only | allow-keywords`. Chrome 129, Edge 129, Firefox no, Safari no, iOS no, Android 129. [MDN](https://developer.mozilla.org/docs/Web/CSS/interpolate-size) */
declare const interpolateSize: Prop<"interpolate-size">;
/** `auto | isolate`. Chrome 41, Edge 79, Firefox 36, Safari 8, iOS 8, Android 41. [MDN](https://developer.mozilla.org/docs/Web/CSS/isolation) */
declare const isolation: Prop<"isolation">;
/** `normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]`. Chrome 29, Edge 12, Firefox 20, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/justify-content) */
declare const justifyContent: Prop<"justify-content">;
/** `normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ] | anchor-center`. Chrome 52, Edge 12, Firefox 20, Safari 9, iOS 9, Android 52. [MDN](https://developer.mozilla.org/docs/Web/CSS/justify-items) */
declare const justifyItems: Prop<"justify-items">;
/** `auto | normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | anchor-center`. Chrome 57, Edge 16, Firefox 45, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/justify-self) */
declare const justifySelf: Prop<"justify-self">;
/** `auto | <length-percentage> | <anchor()> | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/left) */
declare const left: Prop<"left">;
/** `normal | <length-percentage>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/letter-spacing) */
declare const letterSpacing: Prop<"letter-spacing">;
/** `<color>`. Chrome 5, Edge 12, Firefox 3, Safari 6, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/lighting-color) */
declare const lightingColor: Prop<"lighting-color">;
/** `auto | loose | normal | strict | anywhere`. Chrome 58, Edge 14, Firefox 69, Safari 11, iOS 11, Android 58. [MDN](https://developer.mozilla.org/docs/Web/CSS/line-break) */
declare const lineBreak: Prop<"line-break">;
/** `none | <integer [1,∞]>`. Chrome no, Edge no, Firefox no, Safari no, iOS no, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/line-clamp) */
declare const lineClamp: Prop<"line-clamp">;
/** `normal | <number [0,∞]> | <length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/line-height) */
declare const lineHeight: Prop<"line-height">;
/** `<length [0,∞]>`. [MDN](https://developer.mozilla.org/docs/Web/CSS/line-height-step) */
declare const lineHeightStep: Prop<"line-height-step">;
/** `<'list-style-type'> || <'list-style-position'> || <'list-style-image'>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/list-style) */
declare const listStyle: Prop<"list-style">;
/** `<image> | none`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/list-style-image) */
declare const listStyleImage: Prop<"list-style-image">;
/** `inside | outside`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/list-style-position) */
declare const listStylePosition: Prop<"list-style-position">;
/** `<counter-style> | <string> | none`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/list-style-type) */
declare const listStyleType: Prop<"list-style-type">;
/** `<'margin-top'>{1,4}`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin) */
declare const m: Prop<"margin">;
/** `<'margin-top'>{1,4}`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin) */
declare const margin: Prop<"margin">;
/** `<'margin-top'>{1,2}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-block) */
declare const marginBlock: Prop<"margin-block">;
/** `<'margin-top'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-block-end) */
declare const marginBlockEnd: Prop<"margin-block-end">;
/** `<'margin-top'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-block-start) */
declare const marginBlockStart: Prop<"margin-block-start">;
/** `<length-percentage> | auto | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-bottom) */
declare const marginBottom: Prop<"margin-bottom">;
/** `<'margin-top'>{1,2}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-inline) */
declare const marginInline: Prop<"margin-inline">;
/** `<'margin-top'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-inline-end) */
declare const marginInlineEnd: Prop<"margin-inline-end">;
/** `<'margin-top'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-inline-start) */
declare const marginInlineStart: Prop<"margin-inline-start">;
/** `<length-percentage> | auto | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-left) */
declare const marginLeft: Prop<"margin-left">;
/** `<length-percentage> | auto | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-right) */
declare const marginRight: Prop<"margin-right">;
/** `<length-percentage> | auto | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-top) */
declare const marginTop: Prop<"margin-top">;
/** `none | in-flow | all`. Chrome 155, Edge 155, Firefox no, Safari 16.4, iOS 16.4, Android 155. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-trim) */
declare const marginTrim: Prop<"margin-trim">;
/** `none | <url>`. Chrome 1, Edge ≤15, Firefox 3, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/marker) */
declare const marker: Prop<"marker">;
/** `none | <url>`. Chrome 1, Edge ≤15, Firefox 3, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/marker-end) */
declare const markerEnd: Prop<"marker-end">;
/** `none | <url>`. Chrome 1, Edge ≤15, Firefox 3, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/marker-mid) */
declare const markerMid: Prop<"marker-mid">;
/** `none | <url>`. Chrome 1, Edge ≤15, Firefox 3, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/marker-start) */
declare const markerStart: Prop<"marker-start">;
/** `<mask-layer>#`. Chrome 120, Edge 120, Firefox 53, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask) */
declare const mask: Prop<"mask">;
/** `<'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>`. Chrome no, Edge no, Firefox no, Safari 17.2, iOS 17.2, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-border) */
declare const maskBorder: Prop<"mask-border">;
/** `luminance | alpha`. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-border-mode) */
declare const maskBorderMode: Prop<"mask-border-mode">;
/** `<'border-image-outset'>`. Chrome no, Edge no, Firefox no, Safari 17.2, iOS 17.2, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-border-outset) */
declare const maskBorderOutset: Prop<"mask-border-outset">;
/** `[ stretch | repeat | round | space ]{1,2}`. Chrome no, Edge no, Firefox no, Safari 17.2, iOS 17.2, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-border-repeat) */
declare const maskBorderRepeat: Prop<"mask-border-repeat">;
/** `<number-percentage>{1,4} fill?`. Chrome no, Edge no, Firefox no, Safari 17.2, iOS 17.2, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-border-slice) */
declare const maskBorderSlice: Prop<"mask-border-slice">;
/** `none | <image>`. Chrome no, Edge no, Firefox no, Safari 17.2, iOS 17.2, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-border-source) */
declare const maskBorderSource: Prop<"mask-border-source">;
/** `<'border-image-width'>`. Chrome no, Edge no, Firefox no, Safari 17.2, iOS 17.2, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-border-width) */
declare const maskBorderWidth: Prop<"mask-border-width">;
/** `[ <coord-box> | no-clip ]#`. Chrome 120, Edge 120, Firefox 53, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-clip) */
declare const maskClip: Prop<"mask-clip">;
/** `<compositing-operator>#`. Chrome 120, Edge 120, Firefox 53, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-composite) */
declare const maskComposite: Prop<"mask-composite">;
/** `<mask-reference>#`. Chrome 120, Edge 120, Firefox 53, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-image) */
declare const maskImage: Prop<"mask-image">;
/** `<masking-mode>#`. Chrome 120, Edge 120, Firefox 53, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-mode) */
declare const maskMode: Prop<"mask-mode">;
/** `<coord-box>#`. Chrome 120, Edge 120, Firefox 53, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-origin) */
declare const maskOrigin: Prop<"mask-origin">;
/** `<position>#`. Chrome 120, Edge 120, Firefox 53, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-position) */
declare const maskPosition: Prop<"mask-position">;
/** `<repeat-style>#`. Chrome 120, Edge 120, Firefox 53, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-repeat) */
declare const maskRepeat: Prop<"mask-repeat">;
/** `<bg-size>#`. Chrome 120, Edge 120, Firefox 53, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-size) */
declare const maskSize: Prop<"mask-size">;
/** `luminance | alpha`. Chrome 24, Edge 79, Firefox 35, Safari 7, iOS 7, Android 25. [MDN](https://developer.mozilla.org/docs/Web/CSS/mask-type) */
declare const maskType: Prop<"mask-type">;
/** `auto-add | add(<integer>) | <integer>`. Chrome 109, Edge 109, Firefox 117, Safari 26.4, iOS 26.4, Android 109. [MDN](https://developer.mozilla.org/docs/Web/CSS/math-depth) */
declare const mathDepth: Prop<"math-depth">;
/** `normal | compact`. Chrome 109, Edge 109, Firefox 146, Safari 26.2, iOS 26.2, Android 109. [MDN](https://developer.mozilla.org/docs/Web/CSS/math-shift) */
declare const mathShift: Prop<"math-shift">;
/** `normal | compact`. Chrome 109, Edge 109, Firefox 117, Safari 14.1, iOS 14.5, Android 109. [MDN](https://developer.mozilla.org/docs/Web/CSS/math-style) */
declare const mathStyle: Prop<"math-style">;
/** `<'max-width'>`. Chrome 57, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/max-block-size) */
declare const maxBlockSize: Prop<"max-block-size">;
/** `none | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1.3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/max-height) */
declare const maxHeight: Prop<"max-height">;
/** `<'max-width'>`. Chrome 57, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/max-inline-size) */
declare const maxInlineSize: Prop<"max-inline-size">;
/** `none | <integer [1,∞]>`. Chrome no, Edge no, Firefox no, Safari no, iOS no, Android no */
declare const maxLines: Prop<"max-lines">;
/** `none | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/max-width) */
declare const maxWidth: Prop<"max-width">;
/** `<length-percentage> | auto | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-bottom) */
declare const mb: Prop<"margin-bottom">;
/** `<'min-width'>`. Chrome 57, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/min-block-size) */
declare const minBlockSize: Prop<"min-block-size">;
/** `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`. Chrome 1, Edge 12, Firefox 3, Safari 1.3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/min-height) */
declare const minHeight: Prop<"min-height">;
/** `<'min-width'>`. Chrome 57, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/min-inline-size) */
declare const minInlineSize: Prop<"min-inline-size">;
/** `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/min-width) */
declare const minWidth: Prop<"min-width">;
/** `<blend-mode> | plus-lighter`. Chrome 41, Edge 79, Firefox 32, Safari 8, iOS 8, Android 41. [MDN](https://developer.mozilla.org/docs/Web/CSS/mix-blend-mode) */
declare const mixBlendMode: Prop<"mix-blend-mode">;
/** `<length-percentage> | auto | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-left) */
declare const ml: Prop<"margin-left">;
/** `<length-percentage> | auto | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-right) */
declare const mr: Prop<"margin-right">;
/** `<length-percentage> | auto | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/margin-top) */
declare const mt: Prop<"margin-top">;
/** `fill | contain | cover | none | scale-down`. Chrome 32, Edge 79, Firefox 36, Safari 10, iOS 10, Android 32. [MDN](https://developer.mozilla.org/docs/Web/CSS/object-fit) */
declare const objectFit: Prop<"object-fit">;
/** `<position>`. Chrome 32, Edge 79, Firefox 36, Safari 10, iOS 10, Android 32. [MDN](https://developer.mozilla.org/docs/Web/CSS/object-position) */
declare const objectPosition: Prop<"object-position">;
/** `none | <basic-shape-rect>`. Chrome 104, Edge 104, Firefox no, Safari no, iOS no, Android 104. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/object-view-box) */
declare const objectViewBox: Prop<"object-view-box">;
/** `[ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?`. Chrome 55, Edge 79, Firefox 72, Safari 16, iOS 16, Android 55. [MDN](https://developer.mozilla.org/docs/Web/CSS/offset) */
declare const offset: Prop<"offset">;
/** `auto | <position>`. Chrome 116, Edge 116, Firefox 72, Safari 16, iOS 16, Android 116. [MDN](https://developer.mozilla.org/docs/Web/CSS/offset-anchor) */
declare const offsetAnchor: Prop<"offset-anchor">;
/** `<length-percentage>`. Chrome 55, Edge 79, Firefox 72, Safari 16, iOS 16, Android 55. [MDN](https://developer.mozilla.org/docs/Web/CSS/offset-distance) */
declare const offsetDistance: Prop<"offset-distance">;
/** `none | <offset-path> || <coord-box>`. Chrome 55, Edge 79, Firefox 72, Safari 15.4, iOS 15.4, Android 55. [MDN](https://developer.mozilla.org/docs/Web/CSS/offset-path) */
declare const offsetPath: Prop<"offset-path">;
/** `normal | auto | <position>`. Chrome 116, Edge 116, Firefox 122, Safari 16, iOS 16, Android 116. [MDN](https://developer.mozilla.org/docs/Web/CSS/offset-position) */
declare const offsetPosition: Prop<"offset-position">;
/** `[ auto | reverse ] || <angle>`. Chrome 56, Edge 79, Firefox 72, Safari 16, iOS 16, Android 56. [MDN](https://developer.mozilla.org/docs/Web/CSS/offset-rotate) */
declare const offsetRotate: Prop<"offset-rotate">;
/** `<opacity-value>`. Chrome 1, Edge 12, Firefox 1, Safari 2, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/opacity) */
declare const opacity: Prop<"opacity">;
/** `<integer>`. Chrome 29, Edge 12, Firefox 20, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/order) */
declare const order: Prop<"order">;
/** `<integer [1,∞]>`. Chrome 25, Edge 12, Firefox no, Safari 1.3, iOS 1, Android 25. [MDN](https://developer.mozilla.org/docs/Web/CSS/orphans) */
declare const orphans: Prop<"orphans">;
/** `<'outline-width'> || <'outline-style'> || <'outline-color'>`. Chrome 94, Edge 94, Firefox 88, Safari 16.4, iOS 16.4, Android 94. [MDN](https://developer.mozilla.org/docs/Web/CSS/outline) */
declare const outline: Prop<"outline">;
/** `<color>`. Chrome 1, Edge 12, Firefox 1.5, Safari 1.2, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/outline-color) */
declare const outlineColor: Prop<"outline-color">;
/** `<length>`. Chrome 1, Edge 15, Firefox 1.5, Safari 1.2, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/outline-offset) */
declare const outlineOffset: Prop<"outline-offset">;
/** `auto | <outline-line-style>`. Chrome 1, Edge 12, Firefox 1.5, Safari 1.2, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/outline-style) */
declare const outlineStyle: Prop<"outline-style">;
/** `<line-width>`. Chrome 1, Edge 12, Firefox 1.5, Safari 1.2, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/outline-width) */
declare const outlineWidth: Prop<"outline-width">;
/** `[ visible | hidden | clip | scroll | auto ]{1,2}`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/overflow) */
declare const overflow: Prop<"overflow">;
/** `auto | none`. Chrome 56, Edge 79, Firefox 66, Safari 27, iOS 27, Android 56. [MDN](https://developer.mozilla.org/docs/Web/CSS/overflow-anchor) */
declare const overflowAnchor: Prop<"overflow-anchor">;
/** `visible | hidden | clip | scroll | auto`. Chrome 135, Edge 135, Firefox 69, Safari 26, iOS 26, Android 135. [MDN](https://developer.mozilla.org/docs/Web/CSS/overflow-block) */
declare const overflowBlock: Prop<"overflow-block">;
/** `<visual-box> || <length>`. Chrome 90, Edge 90, Firefox 102, Safari no, iOS no, Android 90. [MDN](https://developer.mozilla.org/docs/Web/CSS/overflow-clip-margin) */
declare const overflowClipMargin: Prop<"overflow-clip-margin">;
/** `visible | hidden | clip | scroll | auto`. Chrome 135, Edge 135, Firefox 69, Safari 26, iOS 26, Android 135. [MDN](https://developer.mozilla.org/docs/Web/CSS/overflow-inline) */
declare const overflowInline: Prop<"overflow-inline">;
/** `normal | break-word | anywhere`. Chrome 23, Edge 18, Firefox 49, Safari 7, iOS 7, Android 25. [MDN](https://developer.mozilla.org/docs/Web/CSS/overflow-wrap) */
declare const overflowWrap: Prop<"overflow-wrap">;
/** `visible | hidden | clip | scroll | auto`. Chrome 1, Edge 12, Firefox 3.5, Safari 3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/overflow-x) */
declare const overflowX: Prop<"overflow-x">;
/** `visible | hidden | clip | scroll | auto`. Chrome 1, Edge 12, Firefox 3.5, Safari 3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/overflow-y) */
declare const overflowY: Prop<"overflow-y">;
/** `none | auto`. Chrome 117, Edge 117, Firefox no, Safari no, iOS no, Android 117. [MDN](https://developer.mozilla.org/docs/Web/CSS/overlay) */
declare const overlay: Prop<"overlay">;
/** `[ contain | none | auto | chain ]{1,2}`. Chrome 144, Edge 18, Firefox 150, Safari 16, iOS 16, Android 144. [MDN](https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior) */
declare const overscrollBehavior: Prop<"overscroll-behavior">;
/** `contain | none | auto | chain`. Chrome 144, Edge 144, Firefox 150, Safari 16, iOS 16, Android 144. [MDN](https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-block) */
declare const overscrollBehaviorBlock: Prop<"overscroll-behavior-block">;
/** `contain | none | auto | chain`. Chrome 144, Edge 144, Firefox 150, Safari 16, iOS 16, Android 144. [MDN](https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-inline) */
declare const overscrollBehaviorInline: Prop<"overscroll-behavior-inline">;
/** `contain | none | auto | chain`. Chrome 144, Edge 18, Firefox 150, Safari 16, iOS 16, Android 144. [MDN](https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-x) */
declare const overscrollBehaviorX: Prop<"overscroll-behavior-x">;
/** `contain | none | auto | chain`. Chrome 144, Edge 18, Firefox 150, Safari 16, iOS 16, Android 144. [MDN](https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-y) */
declare const overscrollBehaviorY: Prop<"overscroll-behavior-y">;
/** `<'padding-top'>{1,4}`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding) */
declare const p: Prop<"padding">;
/** `<'padding-top'>{1,4}`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding) */
declare const padding: Prop<"padding">;
/** `<'padding-top'>{1,2}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-block) */
declare const paddingBlock: Prop<"padding-block">;
/** `<'padding-top'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-block-end) */
declare const paddingBlockEnd: Prop<"padding-block-end">;
/** `<'padding-top'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-block-start) */
declare const paddingBlockStart: Prop<"padding-block-start">;
/** `<length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-bottom) */
declare const paddingBottom: Prop<"padding-bottom">;
/** `<'padding-top'>{1,2}`. Chrome 87, Edge 87, Firefox 66, Safari 14.1, iOS 14.5, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-inline) */
declare const paddingInline: Prop<"padding-inline">;
/** `<'padding-top'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-inline-end) */
declare const paddingInlineEnd: Prop<"padding-inline-end">;
/** `<'padding-top'>`. Chrome 69, Edge 79, Firefox 41, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-inline-start) */
declare const paddingInlineStart: Prop<"padding-inline-start">;
/** `<length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-left) */
declare const paddingLeft: Prop<"padding-left">;
/** `<length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-right) */
declare const paddingRight: Prop<"padding-right">;
/** `<length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-top) */
declare const paddingTop: Prop<"padding-top">;
/** `auto | <custom-ident>`. Chrome 85, Edge 85, Firefox 110, Safari 1, iOS 1, Android 85. [MDN](https://developer.mozilla.org/docs/Web/CSS/page) */
declare const page: Prop<"page">;
/** `normal | [ fill || stroke || markers ]`. Chrome 123, Edge 123, Firefox 60, Safari 11, iOS 11, Android 123. [MDN](https://developer.mozilla.org/docs/Web/CSS/paint-order) */
declare const paintOrder: Prop<"paint-order">;
/** `<length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-bottom) */
declare const pb: Prop<"padding-bottom">;
/** `none | <length [0,∞]>`. Chrome 36, Edge 12, Firefox 16, Safari 9, iOS 9, Android 36. [MDN](https://developer.mozilla.org/docs/Web/CSS/perspective) */
declare const perspective: Prop<"perspective">;
/** `<position>`. Chrome 36, Edge 12, Firefox 16, Safari 9, iOS 9, Android 36. [MDN](https://developer.mozilla.org/docs/Web/CSS/perspective-origin) */
declare const perspectiveOrigin: Prop<"perspective-origin">;
/** `<length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-left) */
declare const pl: Prop<"padding-left">;
/** `<'align-content'> <'justify-content'>?`. Chrome 59, Edge 79, Firefox 45, Safari 9, iOS 9, Android 59. [MDN](https://developer.mozilla.org/docs/Web/CSS/place-content) */
declare const placeContent: Prop<"place-content">;
/** `<'align-items'> <'justify-items'>?`. Chrome 59, Edge 79, Firefox 45, Safari 11, iOS 11, Android 59. [MDN](https://developer.mozilla.org/docs/Web/CSS/place-items) */
declare const placeItems: Prop<"place-items">;
/** `<'align-self'> <'justify-self'>?`. Chrome 59, Edge 79, Firefox 45, Safari 11, iOS 11, Android 59. [MDN](https://developer.mozilla.org/docs/Web/CSS/place-self) */
declare const placeSelf: Prop<"place-self">;
/** `auto | bounding-box | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | none`. Chrome 1, Edge 12, Firefox 1.5, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/pointer-events) */
declare const pointerEvents: Prop<"pointer-events">;
/** `static | relative | absolute | sticky | fixed`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/position) */
declare const position: Prop<"position">;
/** `auto | none | <anchor-name>`. Chrome 151, Edge 151, Firefox 151, Safari 27, iOS 27, Android 151. [MDN](https://developer.mozilla.org/docs/Web/CSS/position-anchor) */
declare const positionAnchor: Prop<"position-anchor">;
/** `none | <position-area>`. Chrome 129, Edge 129, Firefox 147, Safari 26, iOS 26, Android 129. [MDN](https://developer.mozilla.org/docs/Web/CSS/position-area) */
declare const positionArea: Prop<"position-area">;
/** `<'position-try-order'>? <'position-try-fallbacks'>`. Chrome 125, Edge 125, Firefox 147, Safari 26, iOS 26, Android 125. [MDN](https://developer.mozilla.org/docs/Web/CSS/position-try) */
declare const positionTry$1: Prop<"position-try">;
/** `none | [ [<dashed-ident> || <try-tactic>] | <position-area> ]#`. Chrome 128, Edge 128, Firefox 147, Safari 26, iOS 26, Android 128. [MDN](https://developer.mozilla.org/docs/Web/CSS/position-try-fallbacks) */
declare const positionTryFallbacks: Prop<"position-try-fallbacks">;
/** `normal | <try-size>`. Chrome 125, Edge 125, Firefox 148, Safari 26, iOS 26, Android 125. [MDN](https://developer.mozilla.org/docs/Web/CSS/position-try-order) */
declare const positionTryOrder: Prop<"position-try-order">;
/** `always | [ anchors-valid || anchors-visible || no-overflow ]`. Chrome 125, Edge 125, Firefox 147, Safari 26.2, iOS 26.2, Android 125. [MDN](https://developer.mozilla.org/docs/Web/CSS/position-visibility) */
declare const positionVisibility: Prop<"position-visibility">;
/** `<length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-right) */
declare const pr: Prop<"padding-right">;
/** `economy | exact`. Chrome 136, Edge 136, Firefox 97, Safari 15.4, iOS 15.4, Android 136. [MDN](https://developer.mozilla.org/docs/Web/CSS/print-color-adjust) */
declare const printColorAdjust: Prop<"print-color-adjust">;
/** `<length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/padding-top) */
declare const pt: Prop<"padding-top">;
/** `none | auto | [ <string> <string> ]+`. Chrome 11, Edge 12, Firefox 1.5, Safari 9, iOS 9, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/quotes) */
declare const quotes: Prop<"quotes">;
/** `<length-percentage>`. Chrome 43, Edge 79, Firefox 69, Safari 9, iOS 9, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/r) */
declare const r: Prop<"r">;
/** `normal | source-order | flex-visual | flex-flow | grid-rows | grid-columns | grid-order`. Chrome 137, Edge 137, Firefox no, Safari no, iOS no, Android 137. [MDN](https://developer.mozilla.org/docs/Web/CSS/reading-flow) */
declare const readingFlow: Prop<"reading-flow">;
/** `<integer>`. Chrome 137, Edge 137, Firefox no, Safari no, iOS no, Android 137. [MDN](https://developer.mozilla.org/docs/Web/CSS/reading-order) */
declare const readingOrder: Prop<"reading-order">;
/** `none | both | horizontal | vertical | block | inline`. Chrome 1, Edge 79, Firefox 4, Safari 3, iOS no, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/resize) */
declare const resize: Prop<"resize">;
/** `auto | <length-percentage> | <anchor()> | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/right) */
declare const right: Prop<"right">;
/** `none | <angle> | [ x | y | z | <number>{3} ] && <angle>`. Chrome 104, Edge 104, Firefox 72, Safari 14.1, iOS 14.5, Android 104. [MDN](https://developer.mozilla.org/docs/Web/CSS/rotate) */
declare const rotate: Prop<"rotate">;
/** `normal | <length-percentage [0,∞]>`. Chrome 47, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 47. [MDN](https://developer.mozilla.org/docs/Web/CSS/row-gap) */
declare const rowGap: Prop<"row-gap">;
/** `start | center | space-between | space-around`. Chrome 128, Edge 128, Firefox 38, Safari 18.2, iOS 18.2, Android 128. [MDN](https://developer.mozilla.org/docs/Web/CSS/ruby-align) */
declare const rubyAlign: Prop<"ruby-align">;
/** `separate | collapse | auto` */
declare const rubyMerge: Prop<"ruby-merge">;
/** `auto | none`. Chrome 151, Edge 151, Firefox no, Safari 18.2, iOS 18.2, Android 151. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/ruby-overhang) */
declare const rubyOverhang: Prop<"ruby-overhang">;
/** `[ alternate || [ over | under ] ] | inter-character`. Chrome 84, Edge 84, Firefox 38, Safari 18.2, iOS 18.2, Android 84. [MDN](https://developer.mozilla.org/docs/Web/CSS/ruby-position) */
declare const rubyPosition: Prop<"ruby-position">;
/** `<length-percentage> | auto`. Chrome 43, Edge 79, Firefox 69, Safari 17.4, iOS 17.4, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/rx) */
declare const rx: Prop<"rx">;
/** `<length-percentage> | auto`. Chrome 43, Edge 79, Firefox 69, Safari 17.4, iOS 17.4, Android 43. [MDN](https://developer.mozilla.org/docs/Web/CSS/ry) */
declare const ry: Prop<"ry">;
/** `none | [ <number> | <percentage> ]{1,3}`. Chrome 104, Edge 104, Firefox 72, Safari 14.1, iOS 14.5, Android 104. [MDN](https://developer.mozilla.org/docs/Web/CSS/scale) */
declare const scale: Prop<"scale">;
/** `auto | smooth`. Chrome 61, Edge 79, Firefox 36, Safari 15.4, iOS 15.4, Android 61. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-behavior) */
declare const scrollBehavior: Prop<"scroll-behavior">;
/** `none | nearest`. Chrome 133, Edge 133, Firefox no, Safari no, iOS no, Android 133. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/scroll-initial-target) */
declare const scrollInitialTarget: Prop<"scroll-initial-target">;
/** `<length>{1,4}`. Chrome 69, Edge 79, Firefox 90, Safari 14.1, iOS 14.5, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin) */
declare const scrollMargin: Prop<"scroll-margin">;
/** `<length>{1,2}`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block) */
declare const scrollMarginBlock: Prop<"scroll-margin-block">;
/** `<length>`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block-end) */
declare const scrollMarginBlockEnd: Prop<"scroll-margin-block-end">;
/** `<length>`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block-start) */
declare const scrollMarginBlockStart: Prop<"scroll-margin-block-start">;
/** `<length>`. Chrome 69, Edge 79, Firefox 68, Safari 14.1, iOS 14.5, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin-bottom) */
declare const scrollMarginBottom: Prop<"scroll-margin-bottom">;
/** `<length>{1,2}`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline) */
declare const scrollMarginInline: Prop<"scroll-margin-inline">;
/** `<length>`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline-end) */
declare const scrollMarginInlineEnd: Prop<"scroll-margin-inline-end">;
/** `<length>`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline-start) */
declare const scrollMarginInlineStart: Prop<"scroll-margin-inline-start">;
/** `<length>`. Chrome 69, Edge 79, Firefox 68, Safari 14.1, iOS 14.5, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin-left) */
declare const scrollMarginLeft: Prop<"scroll-margin-left">;
/** `<length>`. Chrome 69, Edge 79, Firefox 68, Safari 14.1, iOS 14.5, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin-right) */
declare const scrollMarginRight: Prop<"scroll-margin-right">;
/** `<length>`. Chrome 69, Edge 79, Firefox 68, Safari 14.1, iOS 14.5, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-margin-top) */
declare const scrollMarginTop: Prop<"scroll-margin-top">;
/** `none | before | after`. Chrome 135, Edge 135, Firefox no, Safari no, iOS no, Android 135. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-marker-group) */
declare const scrollMarkerGroup: Prop<"scroll-marker-group">;
/** `[ auto | <length-percentage [0,∞]> ]{1,4}`. Chrome 69, Edge 79, Firefox 68, Safari 14.1, iOS 14.5, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding) */
declare const scrollPadding: Prop<"scroll-padding">;
/** `[ auto | <length-percentage [0,∞]> ]{1,2}`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block) */
declare const scrollPaddingBlock: Prop<"scroll-padding-block">;
/** `auto | <length-percentage [0,∞]>`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block-end) */
declare const scrollPaddingBlockEnd: Prop<"scroll-padding-block-end">;
/** `auto | <length-percentage [0,∞]>`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block-start) */
declare const scrollPaddingBlockStart: Prop<"scroll-padding-block-start">;
/** `auto | <length-percentage [0,∞]>`. Chrome 69, Edge 79, Firefox 68, Safari 14.1, iOS 14.5, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-bottom) */
declare const scrollPaddingBottom: Prop<"scroll-padding-bottom">;
/** `[ auto | <length-percentage [0,∞]> ]{1,2}`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline) */
declare const scrollPaddingInline: Prop<"scroll-padding-inline">;
/** `auto | <length-percentage [0,∞]>`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline-end) */
declare const scrollPaddingInlineEnd: Prop<"scroll-padding-inline-end">;
/** `auto | <length-percentage [0,∞]>`. Chrome 69, Edge 79, Firefox 68, Safari 15, iOS 15, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline-start) */
declare const scrollPaddingInlineStart: Prop<"scroll-padding-inline-start">;
/** `auto | <length-percentage [0,∞]>`. Chrome 69, Edge 79, Firefox 68, Safari 14.1, iOS 14.5, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-left) */
declare const scrollPaddingLeft: Prop<"scroll-padding-left">;
/** `auto | <length-percentage [0,∞]>`. Chrome 69, Edge 79, Firefox 68, Safari 14.1, iOS 14.5, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-right) */
declare const scrollPaddingRight: Prop<"scroll-padding-right">;
/** `auto | <length-percentage [0,∞]>`. Chrome 69, Edge 79, Firefox 68, Safari 14.1, iOS 14.5, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-padding-top) */
declare const scrollPaddingTop: Prop<"scroll-padding-top">;
/** `[ none | start | end | center ]{1,2}`. Chrome 69, Edge 79, Firefox 68, Safari 11, iOS 11, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-snap-align) */
declare const scrollSnapAlign: Prop<"scroll-snap-align">;
/** `normal | always`. Chrome 75, Edge 79, Firefox 103, Safari 15, iOS 15, Android 75. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-snap-stop) */
declare const scrollSnapStop: Prop<"scroll-snap-stop">;
/** `none | [ x | y | block | inline | both ] [ mandatory | proximity ]?`. Chrome 69, Edge 79, Firefox 99, Safari 11, iOS 11, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-snap-type) */
declare const scrollSnapType: Prop<"scroll-snap-type">;
/** `none | auto`. Chrome 140, Edge 140, Firefox no, Safari no, iOS no, Android 140. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-target-group) */
declare const scrollTargetGroup: Prop<"scroll-target-group">;
/** `[ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-timeline) */
declare const scrollTimeline: Prop<"scroll-timeline">;
/** `[ block | inline | x | y ]#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-timeline-axis) */
declare const scrollTimelineAxis: Prop<"scroll-timeline-axis">;
/** `[ none | <dashed-ident> ]#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/scroll-timeline-name) */
declare const scrollTimelineName: Prop<"scroll-timeline-name">;
/** `auto | <color>{2}`. Chrome 121, Edge 121, Firefox 64, Safari 26.2, iOS 26.2, Android 121. [MDN](https://developer.mozilla.org/docs/Web/CSS/scrollbar-color) */
declare const scrollbarColor: Prop<"scrollbar-color">;
/** `auto | stable && both-edges?`. Chrome 94, Edge 94, Firefox 97, Safari 18.2, iOS 18.2, Android 94. [MDN](https://developer.mozilla.org/docs/Web/CSS/scrollbar-gutter) */
declare const scrollbarGutter: Prop<"scrollbar-gutter">;
/** `auto | thin | none`. Chrome 121, Edge 121, Firefox 64, Safari 18.2, iOS 18.2, Android 121. [MDN](https://developer.mozilla.org/docs/Web/CSS/scrollbar-width) */
declare const scrollbarWidth: Prop<"scrollbar-width">;
/** `<opacity-value>`. Chrome 37, Edge 79, Firefox 62, Safari 10.1, iOS 10.3, Android 37. [MDN](https://developer.mozilla.org/docs/Web/CSS/shape-image-threshold) */
declare const shapeImageThreshold: Prop<"shape-image-threshold">;
/** `<length-percentage [0,∞]>`. Chrome 37, Edge 79, Firefox 62, Safari 10.1, iOS 10.3, Android 37. [MDN](https://developer.mozilla.org/docs/Web/CSS/shape-margin) */
declare const shapeMargin: Prop<"shape-margin">;
/** `none | [ <shape-box> || <basic-shape> ] | <image>`. Chrome 37, Edge 79, Firefox 62, Safari 10.1, iOS 10.3, Android 37. [MDN](https://developer.mozilla.org/docs/Web/CSS/shape-outside) */
declare const shapeOutside: Prop<"shape-outside">;
/** `auto | optimizeSpeed | crispEdges | geometricPrecision`. Chrome 1, Edge 79, Firefox 3, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/shape-rendering) */
declare const shapeRendering: Prop<"shape-rendering">;
/** `normal | spell-out || digits || [ literal-punctuation | no-punctuation ]`. Chrome no, Edge no, Firefox no, Safari 11.1, iOS 11.3, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/speak-as) */
declare const speakAs: Prop<"speak-as">;
/** `<'color'>`. Chrome 1, Edge ≤15, Firefox 3, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/stop-color) */
declare const stopColor: Prop<"stop-color">;
/** `<'opacity'>`. Chrome 1, Edge ≤15, Firefox 3, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/stop-opacity) */
declare const stopOpacity: Prop<"stop-opacity">;
/** `<paint>`. Chrome 1, Edge ≤15, Firefox 1.5, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/stroke) */
declare const stroke: Prop<"stroke">;
/** `<color>`. Chrome no, Edge no, Firefox no, Safari 11.1, iOS 11.3, Android no */
declare const strokeColor: Prop<"stroke-color">;
/** `none | <dasharray>`. Chrome 1, Edge ≤15, Firefox 1.5, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/stroke-dasharray) */
declare const strokeDasharray: Prop<"stroke-dasharray">;
/** `<length-percentage> | <number>`. Chrome 1, Edge ≤15, Firefox 1.5, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/stroke-dashoffset) */
declare const strokeDashoffset: Prop<"stroke-dashoffset">;
/** `butt | round | square`. Chrome 1, Edge ≤15, Firefox 1.5, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/stroke-linecap) */
declare const strokeLinecap: Prop<"stroke-linecap">;
/** `miter | miter-clip | round | bevel | arcs`. Chrome 1, Edge ≤15, Firefox 1.5, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/stroke-linejoin) */
declare const strokeLinejoin: Prop<"stroke-linejoin">;
/** `<number>`. Chrome 1, Edge ≤15, Firefox 1.5, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/stroke-miterlimit) */
declare const strokeMiterlimit: Prop<"stroke-miterlimit">;
/** `<'opacity'>`. Chrome 1, Edge ≤15, Firefox 1.5, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/stroke-opacity) */
declare const strokeOpacity: Prop<"stroke-opacity">;
/** `<length-percentage> | <number>`. Chrome 1, Edge ≤15, Firefox 1.5, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/stroke-width) */
declare const strokeWidth: Prop<"stroke-width">;
/** `<number [0,∞]> | <length [0,∞]>`. Chrome 21, Edge 79, Firefox 91, Safari 7, iOS 7, Android 25. [MDN](https://developer.mozilla.org/docs/Web/CSS/tab-size) */
declare const tabSize: Prop<"tab-size">;
/** `auto | fixed`. Chrome 14, Edge 12, Firefox 1, Safari 1, iOS 3, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/table-layout) */
declare const tableLayout: Prop<"table-layout">;
/** `start | end | left | right | center | justify | match-parent`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-align) */
declare const textAlign: Prop<"text-align">;
/** `auto | start | end | left | right | center | justify`. Chrome 47, Edge 12, Firefox 49, Safari 16, iOS 16, Android 47. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-align-last) */
declare const textAlignLast: Prop<"text-align-last">;
/** `start | middle | end`. Chrome 1, Edge ≤14, Firefox 3, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-anchor) */
declare const textAnchor: Prop<"text-anchor">;
/** `normal | <autospace> | auto`. Chrome 140, Edge 140, Firefox 145, Safari 18.4, iOS 18.4, Android 140. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-autospace) */
declare const textAutospace: Prop<"text-autospace">;
/** `normal | <'text-box-trim'> || <'text-box-edge'>`. Chrome 133, Edge 133, Firefox 154, Safari 18.2, iOS 18.2, Android 133. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-box) */
declare const textBox: Prop<"text-box">;
/** `auto | <text-edge>`. Chrome 133, Edge 133, Firefox 154, Safari 18.2, iOS 18.2, Android 133. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-box-edge) */
declare const textBoxEdge: Prop<"text-box-edge">;
/** `none | trim-start | trim-end | trim-both`. Chrome 133, Edge 133, Firefox 154, Safari 18.2, iOS 18.2, Android 133. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/text-box-trim) */
declare const textBoxTrim: Prop<"text-box-trim">;
/** `none | all | [ digits <integer [2,4]>? ]`. Chrome 48, Edge 79, Firefox 48, Safari 15.4, iOS 15.4, Android 48. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-combine-upright) */
declare const textCombineUpright: Prop<"text-combine-upright">;
/** `<'text-decoration-line'> || <'text-decoration-style'> || <'text-decoration-color'> || <'text-decoration-thickness'>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-decoration) */
declare const textDecoration: Prop<"text-decoration">;
/** `<color>`. Chrome 57, Edge 79, Firefox 36, Safari 12.1, iOS 12.2, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-decoration-color) */
declare const textDecorationColor: Prop<"text-decoration-color">;
/** `<length>{1,2} | auto`. Chrome no, Edge no, Firefox 146, Safari no, iOS no, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-decoration-inset) */
declare const textDecorationInset: Prop<"text-decoration-inset">;
/** `none | [ underline || overline || line-through || blink ] | spelling-error | grammar-error`. Chrome 57, Edge 79, Firefox 36, Safari 12.1, iOS 12.2, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-decoration-line) */
declare const textDecorationLine: Prop<"text-decoration-line">;
/** `none | [ objects || [ spaces | [ leading-spaces || trailing-spaces ] ] || edges || box-decoration ]`. Chrome no, Edge no, Firefox no, Safari 12.1, iOS 12.2, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-decoration-skip) */
declare const textDecorationSkip: Prop<"text-decoration-skip">;
/** `auto | all | none`. Chrome 64, Edge 79, Firefox 70, Safari 15.4, iOS 15.4, Android 64. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-decoration-skip-ink) */
declare const textDecorationSkipInk: Prop<"text-decoration-skip-ink">;
/** `solid | double | dotted | dashed | wavy`. Chrome 57, Edge 79, Firefox 36, Safari 12.1, iOS 12.2, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-decoration-style) */
declare const textDecorationStyle: Prop<"text-decoration-style">;
/** `auto | from-font | <length> | <percentage>`. Chrome 89, Edge 89, Firefox 70, Safari 12.1, iOS 12.2, Android 89. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-decoration-thickness) */
declare const textDecorationThickness: Prop<"text-decoration-thickness">;
/** `<'text-emphasis-style'> || <'text-emphasis-color'>`. Chrome 99, Edge 99, Firefox 46, Safari 7, iOS 7, Android 99. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-emphasis) */
declare const textEmphasis: Prop<"text-emphasis">;
/** `<color>`. Chrome 99, Edge 99, Firefox 46, Safari 7, iOS 7, Android 99. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-emphasis-color) */
declare const textEmphasisColor: Prop<"text-emphasis-color">;
/** `[ over | under ] && [ right | left ]?`. Chrome 99, Edge 99, Firefox 46, Safari 7, iOS 7, Android 99. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-emphasis-position) */
declare const textEmphasisPosition: Prop<"text-emphasis-position">;
/** `none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>`. Chrome 99, Edge 99, Firefox 46, Safari 7, iOS 7, Android 99. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-emphasis-style) */
declare const textEmphasisStyle: Prop<"text-emphasis-style">;
/** `<length-percentage> && hanging? && each-line?`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-indent) */
declare const textIndent: Prop<"text-indent">;
/** `auto | inter-character | inter-word | none`. Chrome 145, Edge 145, Firefox 55, Safari no, iOS no, Android 145. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-justify) */
declare const textJustify: Prop<"text-justify">;
/** `mixed | upright | sideways`. Chrome 48, Edge 79, Firefox 41, Safari 14, iOS 14, Android 48. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-orientation) */
declare const textOrientation: Prop<"text-orientation">;
/** `[ clip | ellipsis | <string> ]{1,2}`. Chrome 1, Edge 12, Firefox 7, Safari 1.3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-overflow) */
declare const textOverflow: Prop<"text-overflow">;
/** `auto | optimizeSpeed | optimizeLegibility | geometricPrecision`. Chrome 4, Edge 79, Firefox 1, Safari 5, iOS 4.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-rendering) */
declare const textRendering: Prop<"text-rendering">;
/** `none | <shadow-t>#`. Chrome 2, Edge 12, Firefox 3.5, Safari 1.1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-shadow) */
declare const textShadow: Prop<"text-shadow">;
/** `none | auto | <percentage [0,∞]>`. Chrome 54, Edge 79, Firefox no, Safari no, iOS no, Android 54. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-size-adjust) */
declare const textSizeAdjust: Prop<"text-size-adjust">;
/** `space-all | normal | space-first | trim-start`. Chrome 123, Edge 123, Firefox no, Safari no, iOS no, Android 123. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-spacing-trim) */
declare const textSpacingTrim: Prop<"text-spacing-trim">;
/** `none | [ capitalize | uppercase | lowercase ] || full-width || full-size-kana | math-auto`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-transform) */
declare const textTransform: Prop<"text-transform">;
/** `auto | <length-percentage>`. Chrome 87, Edge 87, Firefox 70, Safari 12.1, iOS 12.2, Android 87. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-underline-offset) */
declare const textUnderlineOffset: Prop<"text-underline-offset">;
/** `auto | [ from-font | under ] || [ left | right ]`. Chrome 33, Edge 12, Firefox 74, Safari 12.1, iOS 12.2, Android 33. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-underline-position) */
declare const textUnderlinePosition: Prop<"text-underline-position">;
/** `<'text-wrap-mode'> || <'text-wrap-style'>`. Chrome 114, Edge 114, Firefox 121, Safari 17.4, iOS 17.4, Android 114. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-wrap) */
declare const textWrap: Prop<"text-wrap">;
/** `wrap | nowrap`. Chrome 130, Edge 130, Firefox 124, Safari 17.4, iOS 17.4, Android 130. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-wrap-mode) */
declare const textWrapMode: Prop<"text-wrap-mode">;
/** `auto | balance | stable | pretty`. Chrome 130, Edge 130, Firefox 124, Safari 17.5, iOS 17.5, Android 130. [MDN](https://developer.mozilla.org/docs/Web/CSS/text-wrap-style) */
declare const textWrapStyle: Prop<"text-wrap-style">;
/** `none | <dashed-ident>#`. Chrome 116, Edge 116, Firefox no, Safari 26, iOS 26, Android 116. [MDN](https://developer.mozilla.org/docs/Web/CSS/timeline-scope) */
declare const timelineScope: Prop<"timeline-scope">;
/** `none | [ <'timeline-trigger-name'> <'timeline-trigger-source'> <'timeline-trigger-range'> [ '/' <'timeline-trigger-exit-range'> ]? ]#`. Chrome 146, Edge 146, Firefox no, Safari no, iOS no, Android 146. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-trigger) */
declare const timelineTrigger: Prop<"timeline-trigger">;
/** `[ <'timeline-trigger-exit-range-start'> <'timeline-trigger-exit-range-end'>? ]#`. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-trigger-exit-range) */
declare const timelineTriggerExitRange: Prop<"timeline-trigger-exit-range">;
/** `[ auto | normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-trigger-exit-range-end) */
declare const timelineTriggerExitRangeEnd: Prop<"timeline-trigger-exit-range-end">;
/** `[ auto | normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-trigger-exit-range-start) */
declare const timelineTriggerExitRangeStart: Prop<"timeline-trigger-exit-range-start">;
/** `none | <dashed-ident>#`. Chrome 146, Edge 146, Firefox no, Safari no, iOS no, Android 146. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-trigger-name) */
declare const timelineTriggerName: Prop<"timeline-trigger-name">;
/** `[ <'timeline-trigger-range-start'> <'timeline-trigger-range-end'>? ]#`. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-trigger-range) */
declare const timelineTriggerRange: Prop<"timeline-trigger-range">;
/** `[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-trigger-range-end) */
declare const timelineTriggerRangeEnd: Prop<"timeline-trigger-range-end">;
/** `[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#`. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-trigger-range-start) */
declare const timelineTriggerRangeStart: Prop<"timeline-trigger-range-start">;
/** `<single-animation-timeline>#`. Chrome 146, Edge 146, Firefox no, Safari no, iOS no, Android 146. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/timeline-trigger-source) */
declare const timelineTriggerSource: Prop<"timeline-trigger-source">;
/** `auto | <length-percentage> | <anchor()> | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/top) */
declare const top: Prop<"top">;
/** `auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation`. Chrome 36, Edge 12, Firefox 52, Safari 13, iOS 9.3, Android 36. [MDN](https://developer.mozilla.org/docs/Web/CSS/touch-action) */
declare const touchAction: Prop<"touch-action">;
/** `none | <transform-list>`. Chrome 36, Edge 12, Firefox 16, Safari 9, iOS 9, Android 36. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform) */
declare const transform: Prop<"transform">;
/** `content-box | border-box | fill-box | stroke-box | view-box`. Chrome 64, Edge 79, Firefox 55, Safari 11, iOS 11, Android 64. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-box) */
declare const transformBox: Prop<"transform-box">;
/** `[ left | center | right | top | bottom | <length-percentage> ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ] <length>? | [ [ center | left | right ] && [ center | top | bottom ] ] <length>?`. Chrome 36, Edge 12, Firefox 16, Safari 9, iOS 9, Android 36. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-origin) */
declare const transformOrigin: Prop<"transform-origin">;
/** `flat | preserve-3d`. Chrome 36, Edge 12, Firefox 16, Safari 9, iOS 9, Android 36. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-style) */
declare const transformStyle: Prop<"transform-style">;
/** `<single-transition>#`. Chrome 26, Edge 12, Firefox 16, Safari 9, iOS 9, Android 26. [MDN](https://developer.mozilla.org/docs/Web/CSS/transition) */
declare const transition: Prop<"transition">;
/** `<transition-behavior-value>#`. Chrome 117, Edge 117, Firefox 129, Safari 17.4, iOS 17.4, Android 117. [MDN](https://developer.mozilla.org/docs/Web/CSS/transition-behavior) */
declare const transitionBehavior: Prop<"transition-behavior">;
/** `<time>#`. Chrome 26, Edge 12, Firefox 16, Safari 9, iOS 9, Android 26. [MDN](https://developer.mozilla.org/docs/Web/CSS/transition-delay) */
declare const transitionDelay: Prop<"transition-delay">;
/** `<time [0s,∞]>#`. Chrome 26, Edge 12, Firefox 16, Safari 9, iOS 9, Android 26. [MDN](https://developer.mozilla.org/docs/Web/CSS/transition-duration) */
declare const transitionDuration: Prop<"transition-duration">;
/** `none | <single-transition-property>#`. Chrome 26, Edge 12, Firefox 16, Safari 9, iOS 9, Android 26. [MDN](https://developer.mozilla.org/docs/Web/CSS/transition-property) */
declare const transitionProperty: Prop<"transition-property">;
/** `<easing-function>#`. Chrome 26, Edge 12, Firefox 16, Safari 9, iOS 9, Android 26. [MDN](https://developer.mozilla.org/docs/Web/CSS/transition-timing-function) */
declare const transitionTimingFunction: Prop<"transition-timing-function">;
/** `none | <length-percentage> [ <length-percentage> <length>? ]?`. Chrome 104, Edge 104, Firefox 72, Safari 14.1, iOS 14.5, Android 104. [MDN](https://developer.mozilla.org/docs/Web/CSS/translate) */
declare const translate: Prop<"translate">;
/** `none | all | <dashed-ident>#`. Chrome 146, Edge 146, Firefox no, Safari no, iOS no, Android 146. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/trigger-scope) */
declare const triggerScope: Prop<"trigger-scope">;
/** `normal | embed | isolate | bidi-override | isolate-override | plaintext`. Chrome 2, Edge 12, Firefox 1, Safari 1.3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/unicode-bidi) */
declare const unicodeBidi: Prop<"unicode-bidi">;
/** `auto | text | none | all`. Chrome 54, Edge 79, Firefox 69, Safari no, iOS no, Android 54. [MDN](https://developer.mozilla.org/docs/Web/CSS/user-select) */
declare const userSelect: Prop<"user-select">;
/** `none | non-scaling-stroke | non-scaling-size | non-rotation | fixed-position`. Chrome 6, Edge 79, Firefox 15, Safari 5.1, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/vector-effect) */
declare const vectorEffect: Prop<"vector-effect">;
/** `baseline | sub | super | text-top | text-bottom | middle | top | bottom | <percentage> | <length>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/vertical-align) */
declare const verticalAlign: Prop<"vertical-align">;
/** `[ <'view-timeline-name'> [ <'view-timeline-axis'> || <'view-timeline-inset'> ]? ]#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/view-timeline) */
declare const viewTimeline: Prop<"view-timeline">;
/** `[ block | inline | x | y ]#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/view-timeline-axis) */
declare const viewTimelineAxis: Prop<"view-timeline-axis">;
/** `[ [ auto | <length-percentage> ]{1,2} ]#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/view-timeline-inset) */
declare const viewTimelineInset: Prop<"view-timeline-inset">;
/** `[ none | <dashed-ident> ]#`. Chrome 115, Edge 115, Firefox no, Safari 26, iOS 26, Android 115. [MDN](https://developer.mozilla.org/docs/Web/CSS/view-timeline-name) */
declare const viewTimelineName: Prop<"view-timeline-name">;
/** `none | <custom-ident>+`. Chrome 125, Edge 125, Firefox 144, Safari 18.2, iOS 18.2, Android 125. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/view-transition-class) */
declare const viewTransitionClass: Prop<"view-transition-class">;
/** `none | <custom-ident> | match-element`. Chrome 111, Edge 111, Firefox 144, Safari 18, iOS 18, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/view-transition-name) */
declare const viewTransitionName: Prop<"view-transition-name">;
/** `visible | hidden | collapse`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/visibility) */
declare const visibility: Prop<"visibility">;
/** `normal | pre | pre-wrap | pre-line | <'white-space-collapse'> || <'text-wrap-mode'>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/white-space) */
declare const whiteSpace: Prop<"white-space">;
/** `collapse | preserve | preserve-breaks | preserve-spaces | break-spaces`. Chrome 114, Edge 114, Firefox 124, Safari 17.4, iOS 17.4, Android 114. [MDN](https://developer.mozilla.org/docs/Web/CSS/white-space-collapse) */
declare const whiteSpaceCollapse: Prop<"white-space-collapse">;
/** `<integer [1,∞]>`. Chrome 25, Edge 12, Firefox no, Safari 1.3, iOS 1, Android 25. [MDN](https://developer.mozilla.org/docs/Web/CSS/widows) */
declare const widows: Prop<"widows">;
/** `auto | <length-percentage [0,∞]> | min-content | max-content | fit-content | fit-content(<length-percentage [0,∞]>) | <calc-size()> | <anchor-size()>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/width) */
declare const width: Prop<"width">;
/** `auto | <animateable-feature>#`. Chrome 36, Edge 79, Firefox 36, Safari 9.1, iOS 9.3, Android 36. [MDN](https://developer.mozilla.org/docs/Web/CSS/will-change) */
declare const willChange: Prop<"will-change">;
/** `normal | break-all | keep-all | break-word | auto-phrase`. Chrome 1, Edge 12, Firefox 15, Safari 3, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/word-break) */
declare const wordBreak: Prop<"word-break">;
/** `normal | <length-percentage>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/word-spacing) */
declare const wordSpacing: Prop<"word-spacing">;
/** `normal | break-word | anywhere`. [MDN](https://developer.mozilla.org/docs/Web/CSS/overflow-wrap) */
declare const wordWrap: Prop<"word-wrap">;
/** `horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr`. Chrome 48, Edge 12, Firefox 41, Safari 10.1, iOS 10.3, Android 48. [MDN](https://developer.mozilla.org/docs/Web/CSS/writing-mode) */
declare const writingMode: Prop<"writing-mode">;
/** `<length-percentage>`. Chrome 42, Edge 79, Firefox 69, Safari 9, iOS 9, Android 42. [MDN](https://developer.mozilla.org/docs/Web/CSS/x) */
declare const x: Prop<"x">;
/** `<length-percentage>`. Chrome 42, Edge 79, Firefox 69, Safari 9, iOS 9, Android 42. [MDN](https://developer.mozilla.org/docs/Web/CSS/y) */
declare const y: Prop<"y">;
/** `auto | <integer>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/z-index) */
declare const zIndex: Prop<"z-index">;
/** `normal | <number [0,∞]> | <percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 126, Safari 3.1, iOS 3, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/zoom) */
declare const zoom: Prop<"zoom">;
/** Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:active) */
declare const active: StateWrap;
/** Chrome 65, Edge 79, Firefox 50, Safari 9, iOS 9, Android 65. [MDN](https://developer.mozilla.org/docs/Web/CSS/:any-link) */
declare const anyLink: StateWrap;
/** Chrome 110, Edge 110, Firefox 86, Safari 15, iOS 15, Android 110. [MDN](https://developer.mozilla.org/docs/Web/CSS/:autofill) */
declare const autofill: StateWrap;
/** Chrome no, Edge no, Firefox 150, Safari 15.4, iOS 15.4, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/:buffering) */
declare const buffering: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:checked) */
declare const checked: StateWrap;
/** Chrome 54, Edge 79, Firefox 63, Safari 10, iOS 10, Android 54. [MDN](https://developer.mozilla.org/docs/Web/CSS/:defined) */
declare const defined: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:disabled) */
declare const disabled: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:empty) */
declare const empty: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:enabled) */
declare const enabled: StateWrap;
/** Chrome 4, Edge 12, Firefox 3, Safari 3.1, iOS 4, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:first-child) */
declare const firstChild: StateWrap;
/** Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:first-of-type) */
declare const firstOfType: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:focus) */
declare const focus: StateWrap;
/** Chrome 86, Edge 86, Firefox 85, Safari 15.4, iOS 15.4, Android 86. [MDN](https://developer.mozilla.org/docs/Web/CSS/:focus-visible) */
declare const focusVisible: StateWrap;
/** Chrome 60, Edge 79, Firefox 52, Safari 10.1, iOS 10.3, Android 60. [MDN](https://developer.mozilla.org/docs/Web/CSS/:focus-within) */
declare const focusWithin: StateWrap;
/** Chrome 71, Edge 12, Firefox 64, Safari 16.4, iOS 16.4, Android 71. [MDN](https://developer.mozilla.org/docs/Web/CSS/:fullscreen) */
declare const fullscreen: StateWrap;
/** Chrome 23, Edge 79, Firefox no, Safari 7, iOS 7, Android 25. [MDN](https://developer.mozilla.org/docs/Web/CSS/:future) */
declare const future: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 2, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:hover) */
declare const hover: StateWrap;
/** Chrome 10, Edge 13, Firefox 29, Safari 5.1, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:in-range) */
declare const inRange: StateWrap;
/** Chrome 1, Edge 12, Firefox 2, Safari 3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:indeterminate) */
declare const indeterminate: StateWrap;
/** Chrome 10, Edge 12, Firefox 4, Safari 5, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:invalid) */
declare const invalid: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:last-child) */
declare const lastChild: StateWrap;
/** Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:last-of-type) */
declare const lastOfType: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:link) */
declare const link: StateWrap;
/** Chrome 105, Edge 105, Firefox 103, Safari 15.6, iOS 15.6, Android 105. [MDN](https://developer.mozilla.org/docs/Web/CSS/:modal) */
declare const modal: StateWrap;
/** Chrome no, Edge no, Firefox 150, Safari 15.4, iOS 15.4, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/:muted) */
declare const muted: StateWrap;
/** Chrome 2, Edge 12, Firefox 1.5, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:only-child) */
declare const onlyChild: StateWrap;
/** Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:only-of-type) */
declare const onlyOfType: StateWrap;
/** Chrome 133, Edge 133, Firefox 136, Safari 26.5, iOS 26.5, Android 133. [MDN](https://developer.mozilla.org/docs/Web/CSS/:open) */
declare const open: StateWrap;
/** Chrome 10, Edge 12, Firefox 4, Safari 5, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:optional) */
declare const optional: StateWrap;
/** Chrome 10, Edge 13, Firefox 29, Safari 5.1, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:out-of-range) */
declare const outOfRange: StateWrap;
/** Chrome 23, Edge 79, Firefox no, Safari 7, iOS 7, Android 25. [MDN](https://developer.mozilla.org/docs/Web/CSS/:past) */
declare const past: StateWrap;
/** Chrome no, Edge no, Firefox 150, Safari 15.4, iOS 15.4, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/:paused) */
declare const paused: StateWrap;
/** Chrome 110, Edge 110, Firefox 153, Safari 13.1, iOS 13.4, Android 110. [MDN](https://developer.mozilla.org/docs/Web/CSS/:picture-in-picture) */
declare const pictureInPicture: StateWrap;
/** Chrome 47, Edge 79, Firefox 51, Safari 9, iOS 9, Android 47. [MDN](https://developer.mozilla.org/docs/Web/CSS/:placeholder-shown) */
declare const placeholderShown: StateWrap;
/** Chrome no, Edge no, Firefox 150, Safari 15.4, iOS 15.4, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/:playing) */
declare const playing: StateWrap;
/** Chrome 114, Edge 114, Firefox 125, Safari 17, iOS 17, Android 114. [MDN](https://developer.mozilla.org/docs/Web/CSS/:popover-open) */
declare const popoverOpen: StateWrap;
/** Chrome 1, Edge 13, Firefox 78, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:read-only) */
declare const readOnly: StateWrap;
/** Chrome 1, Edge 13, Firefox 78, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:read-write) */
declare const readWrite: StateWrap;
/** Chrome 10, Edge 12, Firefox 4, Safari 5, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:required) */
declare const required: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:root) */
declare const root: StateWrap;
/** Chrome 27, Edge 79, Firefox 32, Safari 7, iOS 7, Android 27. [MDN](https://developer.mozilla.org/docs/Web/CSS/:scope) */
declare const scope$1: StateWrap;
/** Chrome no, Edge no, Firefox 150, Safari 15.4, iOS 15.4, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/:seeking) */
declare const seeking: StateWrap;
/** Chrome no, Edge no, Firefox 150, Safari 15.4, iOS 15.4, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/:stalled) */
declare const stalled: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 1.3, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:target) */
declare const target: StateWrap;
/** Chrome 119, Edge 119, Firefox 88, Safari 16.5, iOS 16.5, Android 119. [MDN](https://developer.mozilla.org/docs/Web/CSS/:user-invalid) */
declare const userInvalid: StateWrap;
/** Chrome 119, Edge 119, Firefox 88, Safari 16.5, iOS 16.5, Android 119. [MDN](https://developer.mozilla.org/docs/Web/CSS/:user-valid) */
declare const userValid: StateWrap;
/** Chrome 10, Edge 12, Firefox 4, Safari 5, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:valid) */
declare const valid: StateWrap;
/** Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/:visited) */
declare const visited: StateWrap;
/** Chrome no, Edge no, Firefox 150, Safari 15.4, iOS 15.4, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/:volume-locked) */
declare const volumeLocked: StateWrap;
/** `abs( <calc-sum> )`. Chrome 138, Edge 138, Firefox 118, Safari 15.4, iOS 15.4, Android 138. [MDN](https://developer.mozilla.org/docs/Web/CSS/abs) */
declare const abs: MathCall<"same">;
/** `acos( <calc-sum> )`. Chrome 111, Edge 111, Firefox 108, Safari 15.4, iOS 15.4, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/acos) */
declare const acos: MathCall<"angle">;
/** `anchor( <anchor-name>? && <anchor-side>, <length-percentage>? )`. Chrome 125, Edge 125, Firefox 147, Safari 26, iOS 26, Android 125. [MDN](https://developer.mozilla.org/docs/Web/CSS/anchor) */
declare const anchor: Fn<"anchor", ", ">;
/** `anchor-size( [ <anchor-name> || <anchor-size> ]? , <length-percentage>? )`. Chrome 125, Edge 125, Firefox 147, Safari 26, iOS 26, Android 125. [MDN](https://developer.mozilla.org/docs/Web/CSS/anchor-size) */
declare const anchorSize: Fn<"anchor-size", ", ">;
/** `asin( <calc-sum> )`. Chrome 111, Edge 111, Firefox 108, Safari 15.4, iOS 15.4, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/asin) */
declare const asin: MathCall<"angle">;
/** `atan( <calc-sum> )`. Chrome 111, Edge 111, Firefox 108, Safari 15.4, iOS 15.4, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/atan) */
declare const atan: MathCall<"angle">;
/** `atan2( <calc-sum>, <calc-sum> )`. Chrome 111, Edge 111, Firefox 108, Safari 15.4, iOS 15.4, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/atan2) */
declare const atan2: MathCall<"angle">;
/** `attr( <attr-name> <attr-type>? , <declaration-value>? )`. Chrome 2, Edge 12, Firefox 1, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/attr) */
declare const attrFn: Fn<"attr", ", ">;
/** `blur( <length>? )`. Chrome 18, Edge 12, Firefox 35, Safari 6, iOS 6, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter-function/blur) */
declare const blur: Fn<"blur", " ">;
/** `brightness( [ <number> | <percentage> ]? )`. Chrome 18, Edge 12, Firefox 35, Safari 6, iOS 6, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter-function/brightness) */
declare const brightness: Fn<"brightness", " ">;
/** `calc( <calc-sum> )`. Chrome 26, Edge 12, Firefox 16, Safari 7, iOS 7, Android 28. [MDN](https://developer.mozilla.org/docs/Web/CSS/calc) */
declare const calc: MathCall<"same">;
/** `calc-size( <calc-size-basis>, <calc-sum> )`. Chrome 129, Edge 129, Firefox no, Safari no, iOS no, Android 129. [MDN](https://developer.mozilla.org/docs/Web/CSS/calc-size) */
declare const calcSize: Fn<"calc-size", ", ">;
/** `circle( <radial-size>? [ at <position> ]? )`. Chrome 37, Edge 79, Firefox 54, Safari 10.1, iOS 10.3, Android 37. [MDN](https://developer.mozilla.org/docs/Web/CSS/basic-shape/circle) */
declare const circle: Fn<"circle", " ">;
/** `clamp( <calc-sum>#{3} )`. Chrome 79, Edge 79, Firefox 75, Safari 13.1, iOS 13.4, Android 79. [MDN](https://developer.mozilla.org/docs/Web/CSS/clamp) */
declare const clamp: MathCall<"same">;
/** `color( [ from <color> ]? <colorspace-params> [ / [ <alpha-value> | none ] ]? )`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/color) */
declare const colorFn: Fn<"color", " ">;
/** `color-mix( <color-interpolation-method> , [ <color> && <percentage [0,100]>? ]#{2})`. Chrome 111, Edge 111, Firefox 113, Safari 16.2, iOS 16.2, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/color-mix) */
declare const colorMix: Fn<"color-mix", ", ">;
/** `conic-gradient( [ <conic-gradient-syntax> ] )`. Chrome 69, Edge 79, Firefox 83, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/gradient/conic-gradient) */
declare const conicGradient: Fn<"conic-gradient", ", ">;
/** `contrast( [ <number> | <percentage> ]? )`. Chrome 18, Edge 12, Firefox 35, Safari 6, iOS 6, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter-function/contrast) */
declare const contrast: Fn<"contrast", " ">;
/** `contrast-color( <color> )`. Chrome 147, Edge 147, Firefox 146, Safari 26, iOS 26, Android 147. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/color_value/contrast-color) */
declare const contrastColor: Fn<"contrast-color", " ">;
/** `cos( <calc-sum> )`. Chrome 111, Edge 111, Firefox 108, Safari 15.4, iOS 15.4, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/cos) */
declare const cos: MathCall<"number">;
/** `counter( <counter-name>, <counter-style>? )`. Chrome 1, Edge 12, Firefox 1, Safari 3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/counter) */
declare const counter: Fn<"counter", ", ">;
/** `counters( <counter-name>, <string>, <counter-style>? )`. Chrome 1, Edge 12, Firefox 1.5, Safari 3, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/counters) */
declare const counters: Fn<"counters", ", ">;
/** `cross-fade( <cf-mixing-image> , <cf-final-image>? )`. Chrome no, Edge no, Firefox no, Safari 10, iOS 9.3, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/cross-fade) */
declare const crossFade: Fn<"cross-fade", ", ">;
/** `cubic-bezier( [ <number [0,1]>, <number> ]#{2} )`. Chrome 16, Edge 12, Firefox 4, Safari 6, iOS 6, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/easing-function/cubic-bezier) */
declare const cubicBezier: Fn<"cubic-bezier", ", ">;
/** `drop-shadow( [ <color>? && <length>{2,3} ] )`. Chrome 18, Edge 12, Firefox 35, Safari 6, iOS 6, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter-function/drop-shadow) */
declare const dropShadow: Fn<"drop-shadow", " ">;
/** `dynamic-range-limit-mix( [ <'dynamic-range-limit'> && <percentage [0,100]> ]#{2,} )`. Chrome 136, Edge 136, Firefox no, Safari no, iOS no, Android 136. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/dynamic-range-limit-mix) */
declare const dynamicRangeLimitMix: Fn<"dynamic-range-limit-mix", ", ">;
/** `element( <id-selector> )`. Chrome no, Edge no, Firefox no, Safari no, iOS no, Android no. [MDN](https://developer.mozilla.org/docs/Web/CSS/element) */
declare const element: Fn<"element", " ">;
/** `ellipse( <radial-size>? [ at <position> ]? )`. Chrome 37, Edge 79, Firefox 54, Safari 10.1, iOS 10.3, Android 37. [MDN](https://developer.mozilla.org/docs/Web/CSS/basic-shape/ellipse) */
declare const ellipse: Fn<"ellipse", " ">;
/** `env( <custom-ident> , <declaration-value>? )`. Chrome 69, Edge 79, Firefox 65, Safari 11.1, iOS 11.3, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/env) */
declare const env: Fn<"env", ", ">;
/** `exp( <calc-sum> )`. Chrome 120, Edge 120, Firefox 118, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/exp) */
declare const exp: MathCall<"number">;
/** `fit-content( <length-percentage [0,∞]> )`. [MDN](https://developer.mozilla.org/docs/Web/CSS/fit-content_function) */
declare const fitContent: Fn<"fit-content", " ">;
/** `grayscale( [ <number> | <percentage> ]? )`. Chrome 18, Edge 12, Firefox 35, Safari 6, iOS 6, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter-function/grayscale) */
declare const grayscale: Fn<"grayscale", " ">;
/** `hsl( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsl( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )`. Chrome 1, Edge 12, Firefox 1, Safari 3.1, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/hsl) */
declare const hsl: Fn<"hsl", ", ">;
/** `hsla( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsla( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )`. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/hsl) */
declare const hsla: Fn<"hsla", ", ">;
/** `hue-rotate( [ <angle> | <zero> ]? )`. Chrome 18, Edge 12, Firefox 35, Safari 6, iOS 6, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter-function/hue-rotate) */
declare const hueRotate: Fn<"hue-rotate", " ">;
/** `hwb( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <alpha-value> | none ] ]? )`. Chrome 101, Edge 101, Firefox 96, Safari 15, iOS 15, Android 101. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/hwb) */
declare const hwb: Fn<"hwb", " ">;
/** `hypot( <calc-sum># )`. Chrome 120, Edge 120, Firefox 118, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/hypot) */
declare const hypot: MathCall<"same">;
/** `image( <image-tags>? [ <image-src>? , <color>? ]! )`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/image/image) */
declare const image: Fn<"image", ", ">;
/** `image-set( <image-set-option># )`. Chrome 113, Edge 113, Firefox 89, Safari 17, iOS 17, Android 113. [MDN](https://developer.mozilla.org/docs/Web/CSS/image/image-set) */
declare const imageSet: Fn<"image-set", ", ">;
/** `inset( <length-percentage>{1,4} [ round <'border-radius'> ]? )`. Chrome 37, Edge 79, Firefox 54, Safari 10.1, iOS 10.3, Android 37. [MDN](https://developer.mozilla.org/docs/Web/CSS/basic-shape/inset) */
declare const insetFn: Fn<"inset", " ">;
/** `invert( [ <number> | <percentage> ]? )`. Chrome 18, Edge 12, Firefox 35, Safari 6, iOS 6, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter-function/invert) */
declare const invert: Fn<"invert", " ">;
/** `lab( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )`. Chrome 111, Edge 111, Firefox 113, Safari 15, iOS 15, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/lab) */
declare const lab: Fn<"lab", " ">;
/** `layer( <layer-name> )`. [MDN](https://developer.mozilla.org/docs/Web/CSS/@import/layer_function) */
declare const layer: Fn<"layer", " ">;
/** `lch( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )`. Chrome 111, Edge 111, Firefox 113, Safari 15, iOS 15, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/lch) */
declare const lch: Fn<"lch", " ">;
/** `leader( <leader-type> )` */
declare const leader: Fn<"leader", " ">;
/** `light-dark( <color>, <color> )`. Chrome 123, Edge 123, Firefox 120, Safari 17.5, iOS 17.5, Android 123. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/light-dark) */
declare const lightDark: Fn<"light-dark", ", ">;
/** `linear( [ <number> && <percentage>{0,2} ]# )`. [MDN](https://developer.mozilla.org/docs/Web/CSS/easing-function/linear) */
declare const linear: Fn<"linear", ", ">;
/** `linear-gradient( [ <linear-gradient-syntax> ] )`. Chrome 26, Edge 12, Firefox 16, Safari 7, iOS 7, Android 26. [MDN](https://developer.mozilla.org/docs/Web/CSS/gradient/linear-gradient) */
declare const linearGradient: Fn<"linear-gradient", ", ">;
/** `log( <calc-sum>, <calc-sum>? )`. Chrome 120, Edge 120, Firefox 118, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/log) */
declare const log: MathCall<"number">;
/** `matrix( <number>#{6} )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/matrix) */
declare const matrix: Fn<"matrix", ", ">;
/** `matrix3d( <number>#{16} )`. Chrome 12, Edge 12, Firefox 10, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/matrix3d) */
declare const matrix3d: Fn<"matrix3d", ", ">;
/** `max( <calc-sum># )`. Chrome 79, Edge 79, Firefox 75, Safari 11.1, iOS 11.3, Android 79. [MDN](https://developer.mozilla.org/docs/Web/CSS/max) */
declare const max: MathCall<"same">;
/** `min( <calc-sum># )`. Chrome 79, Edge 79, Firefox 75, Safari 11.1, iOS 11.3, Android 79. [MDN](https://developer.mozilla.org/docs/Web/CSS/min) */
declare const min: MathCall<"same">;
/** `minmax( [ <length-percentage> | min-content | max-content | auto ] , [ <length-percentage> | <flex> | min-content | max-content | auto ] )`. [MDN](https://developer.mozilla.org/docs/Web/CSS/minmax) */
declare const minmax: Fn<"minmax", ", ">;
/** `mod( <calc-sum>, <calc-sum> )`. Chrome 125, Edge 125, Firefox 118, Safari 15.4, iOS 15.4, Android 125. [MDN](https://developer.mozilla.org/docs/Web/CSS/mod) */
declare const mod: MathCall<"same">;
/** `oklab( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ / [<alpha-value> | none] ]? )`. Chrome 111, Edge 111, Firefox 113, Safari 15.4, iOS 15.4, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/oklab) */
declare const oklab: Fn<"oklab", " ">;
/** `oklch( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha-value> | none] ]? )`. Chrome 111, Edge 111, Firefox 113, Safari 15.4, iOS 15.4, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/oklch) */
declare const oklch: Fn<"oklch", " ">;
/** `opacity( [ <number> | <percentage> ]? )`. Chrome 18, Edge 12, Firefox 35, Safari 6, iOS 6, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter-function/opacity) */
declare const opacityFn: Fn<"opacity", " ">;
/** `paint( <ident>, <declaration-value>? )`. Chrome 65, Edge 79, Firefox no, Safari no, iOS no, Android 65. [MDN](https://developer.mozilla.org/docs/Web/CSS/image/paint) */
declare const paint: Fn<"paint", ", ">;
/** `palette-mix(<color-interpolation-method> , [ [normal | light | dark | <palette-identifier> | <palette-mix()> ] && <percentage [0,100]>? ]#{2})`. [MDN](https://developer.mozilla.org/docs/Web/CSS/font-palette/palette-mix) */
declare const paletteMix: Fn<"palette-mix", ", ">;
/** `path( <'fill-rule'>? , <string> )`. Chrome 52, Edge 79, Firefox 72, Safari 13.1, iOS 13, Android 52. [MDN](https://developer.mozilla.org/docs/Web/CSS/basic-shape/path) */
declare const path: Fn<"path", ", ">;
/** `perspective( [ <length [0,∞]> | none ] )`. Chrome 12, Edge 12, Firefox 10, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/perspective) */
declare const perspectiveFn: Fn<"perspective", " ">;
/** `polygon( <'fill-rule'>? , [ <length-percentage> <length-percentage> ]# )`. Chrome 37, Edge 79, Firefox 54, Safari 10.1, iOS 10.3, Android 37. [MDN](https://developer.mozilla.org/docs/Web/CSS/basic-shape/polygon) */
declare const polygon: Fn<"polygon", ", ">;
/** `pow( <calc-sum>, <calc-sum> )`. Chrome 120, Edge 120, Firefox 118, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/pow) */
declare const pow: MathCall<"number">;
/** `radial-gradient( [ <radial-gradient-syntax> ] )`. Chrome 26, Edge 12, Firefox 16, Safari 7, iOS 7, Android 26. [MDN](https://developer.mozilla.org/docs/Web/CSS/gradient/radial-gradient) */
declare const radialGradient: Fn<"radial-gradient", ", ">;
/** `ray( <angle> && <ray-size>? && contain? && [at <position>]? )`. Chrome 116, Edge 116, Firefox 122, Safari 16, iOS 16, Android 116. [MDN](https://developer.mozilla.org/docs/Web/CSS/ray) */
declare const ray: Fn<"ray", " ">;
/** `rect( [ <length-percentage> | auto ]{4} [ round <'border-radius'> ]? )`. Chrome 119, Edge 119, Firefox 122, Safari 17.2, iOS 17.2, Android 119. [MDN](https://developer.mozilla.org/docs/Web/CSS/basic-shape/rect) */
declare const rect: Fn<"rect", " ">;
/** `rem( <calc-sum>, <calc-sum> )`. Chrome 125, Edge 125, Firefox 118, Safari 15.4, iOS 15.4, Android 125. [MDN](https://developer.mozilla.org/docs/Web/CSS/rem) */
declare const rem: MathCall<"same">;
/** `repeating-conic-gradient( [ <conic-gradient-syntax> ] )`. Chrome 69, Edge 79, Firefox 83, Safari 12.1, iOS 12.2, Android 69. [MDN](https://developer.mozilla.org/docs/Web/CSS/gradient/repeating-conic-gradient) */
declare const repeatingConicGradient: Fn<"repeating-conic-gradient", ", ">;
/** `repeating-linear-gradient( [ <linear-gradient-syntax> ] )`. Chrome 26, Edge 12, Firefox 16, Safari 7, iOS 7, Android 26. [MDN](https://developer.mozilla.org/docs/Web/CSS/gradient/repeating-linear-gradient) */
declare const repeatingLinearGradient: Fn<"repeating-linear-gradient", ", ">;
/** `repeating-radial-gradient( [ <radial-gradient-syntax> ] )`. Chrome 26, Edge 12, Firefox 16, Safari 7, iOS 7, Android 26. [MDN](https://developer.mozilla.org/docs/Web/CSS/gradient/repeating-radial-gradient) */
declare const repeatingRadialGradient: Fn<"repeating-radial-gradient", ", ">;
/** `rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? ) | rgb( [ <number> | <percentage> | none ]{3} [ / [ <alpha-value> | none ] ]? )`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/rgb) */
declare const rgb: Fn<"rgb", ", ">;
/** `rgba( <percentage>#{3} , <alpha-value>? ) | rgba( <number>#{3} , <alpha-value>? ) | rgba( [ <number> | <percentage> | none ]{3} [ / [ <alpha-value> | none ] ]? )`. [MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/rgb) */
declare const rgba: Fn<"rgba", ", ">;
/** `rotate3d( <number> , <number> , <number> , [ <angle> | <zero> ] )`. Chrome 12, Edge 12, Firefox 10, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/rotate3d) */
declare const rotate3d: Fn<"rotate3d", ", ">;
/** `rotate( [ <angle> | <zero> ] )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/rotate) */
declare const rotateFn: Fn<"rotate", " ">;
/** `rotateX( [ <angle> | <zero> ] )`. Chrome 12, Edge 12, Firefox 10, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/rotateX) */
declare const rotateX: Fn<"rotateX", " ">;
/** `rotateY( [ <angle> | <zero> ] )`. Chrome 12, Edge 12, Firefox 10, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/rotateY) */
declare const rotateY: Fn<"rotateY", " ">;
/** `rotateZ( [ <angle> | <zero> ] )`. Chrome 12, Edge 12, Firefox 10, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/rotateZ) */
declare const rotateZ: Fn<"rotateZ", " ">;
/** `round( <rounding-strategy>?, <calc-sum>, <calc-sum> )`. Chrome 125, Edge 125, Firefox 118, Safari 15.4, iOS 15.4, Android 125. [MDN](https://developer.mozilla.org/docs/Web/CSS/round) */
declare const round: MathCall<"same">;
/** `saturate( [ <number> | <percentage> ]? )`. Chrome 18, Edge 12, Firefox 35, Safari 6, iOS 6, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter-function/saturate) */
declare const saturate: Fn<"saturate", " ">;
/** `scale3d( [ <number> | <percentage> ]#{3} )`. Chrome 12, Edge 12, Firefox 10, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/scale3d) */
declare const scale3d: Fn<"scale3d", ", ">;
/** `scale( [ <number> | <percentage> ]#{1,2} )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/scale) */
declare const scaleFn: Fn<"scale", ", ">;
/** `scaleX( [ <number> | <percentage> ] )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/scaleX) */
declare const scaleX: Fn<"scaleX", " ">;
/** `scaleY( [ <number> | <percentage> ] )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/scaleY) */
declare const scaleY: Fn<"scaleY", " ">;
/** `scaleZ( [ <number> | <percentage> ] )`. Chrome 12, Edge 12, Firefox 10, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/scaleZ) */
declare const scaleZ: Fn<"scaleZ", " ">;
/** `scroll( [ <scroller> || <axis> ]? )`. Chrome 147, Edge 147, Firefox no, Safari 26.5, iOS 26.5, Android 147. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-timeline/scroll) */
declare const scroll: Fn<"scroll", " ">;
/** `sepia( [ <number> | <percentage> ]? )`. Chrome 18, Edge 12, Firefox 35, Safari 6, iOS 6, Android 53. [MDN](https://developer.mozilla.org/docs/Web/CSS/filter-function/sepia) */
declare const sepia: Fn<"sepia", " ">;
/** `sign( <calc-sum> )`. Chrome 138, Edge 138, Firefox 118, Safari 15.4, iOS 15.4, Android 138. [MDN](https://developer.mozilla.org/docs/Web/CSS/sign) */
declare const sign: MathCall<"number">;
/** `sin( <calc-sum> )`. Chrome 111, Edge 111, Firefox 108, Safari 15.4, iOS 15.4, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/sin) */
declare const sin: MathCall<"number">;
/** `skew( [ <angle> | <zero> ] , [ <angle> | <zero> ]? )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/skew) */
declare const skew: Fn<"skew", ", ">;
/** `skewX( [ <angle> | <zero> ] )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/skewX) */
declare const skewX: Fn<"skewX", " ">;
/** `skewY( [ <angle> | <zero> ] )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/skewY) */
declare const skewY: Fn<"skewY", " ">;
/** `sqrt( <calc-sum> )`. Chrome 120, Edge 120, Firefox 118, Safari 15.4, iOS 15.4, Android 120. [MDN](https://developer.mozilla.org/docs/Web/CSS/sqrt) */
declare const sqrt: MathCall<"number">;
/** `src( <string> <url-modifier>* )` */
declare const src: Fn<"src", " ">;
/** `steps( <integer>, <step-position>? )`. Chrome 8, Edge 12, Firefox 4, Safari 5.1, iOS 5, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/easing-function/steps) */
declare const steps: Fn<"steps", ", ">;
/** `superellipse( [ <number> | infinity | -infinity ] )`. Chrome 139, Edge 139, Firefox no, Safari no, iOS no, Android 139. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/superellipse) */
declare const superellipse: Fn<"superellipse", " ">;
/** `symbols( <symbols-type>? [ <string> | <image> ]+ )`. [MDN](https://developer.mozilla.org/docs/Web/CSS/symbols) */
declare const symbols: Fn<"symbols", " ">;
/** `tan( <calc-sum> )`. Chrome 111, Edge 111, Firefox 108, Safari 15.4, iOS 15.4, Android 111. [MDN](https://developer.mozilla.org/docs/Web/CSS/tan) */
declare const tan: MathCall<"number">;
/** `target-counter( [ <string> | <url> ] , <custom-ident> , <counter-style>? )` */
declare const targetCounter: Fn<"target-counter", ", ">;
/** `target-counters( [ <string> | <url> ] , <custom-ident> , <string> , <counter-style>? )` */
declare const targetCounters: Fn<"target-counters", ", ">;
/** `target-text( [ <string> | <url> ] , [ content | before | after | first-letter ]? )` */
declare const targetText: Fn<"target-text", ", ">;
/** `translate3d( <length-percentage> , <length-percentage> , <length> )`. Chrome 12, Edge 12, Firefox 10, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/translate3d) */
declare const translate3d: Fn<"translate3d", ", ">;
/** `translate( <length-percentage> , <length-percentage>? )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/translate) */
declare const translateFn: Fn<"translate", ", ">;
/** `translateX( <length-percentage> )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/translateX) */
declare const translateX: Fn<"translateX", " ">;
/** `translateY( <length-percentage> )`. Chrome 1, Edge 12, Firefox 3.5, Safari 3.1, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/translateY) */
declare const translateY: Fn<"translateY", " ">;
/** `translateZ( <length> )`. Chrome 12, Edge 12, Firefox 10, Safari 4, iOS 3.2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/transform-function/translateZ) */
declare const translateZ: Fn<"translateZ", " ">;
/** `url( <string> <url-modifier>* ) | <url-token>`. Chrome 1, Edge 12, Firefox 1, Safari 1, iOS 1, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/url_function) */
declare const url: Fn<"url", " ">;
/** `var( <custom-property-name> , <declaration-value>? )`. Chrome 49, Edge 15, Firefox 31, Safari 9.1, iOS 9.3, Android 49. [MDN](https://developer.mozilla.org/docs/Web/CSS/var) */
declare const _var: VarCall;
/** `view([<axis> || <'view-timeline-inset'>]?)`. [MDN](https://developer.mozilla.org/docs/Web/CSS/animation-timeline/view) */
declare const view: Fn<"view", " ">;
/** `xywh( <length-percentage>{2} <length-percentage [0,∞]>{2} [ round <'border-radius'> ]? )`. Chrome 119, Edge 119, Firefox 122, Safari 17.2, iOS 17.2, Android 119. [MDN](https://developer.mozilla.org/docs/Web/CSS/basic-shape/xywh) */
declare const xywh: Fn<"xywh", " ">;
type FlexMethods = {
  /** `row | row-reverse | column | column-reverse`. Chrome 29, Edge 12, Firefox 22, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/flex-direction) */
  direction: "flex-direction";
  /** `nowrap | [ wrap | wrap-reverse ] || balance`. Chrome 29, Edge 12, Firefox 28, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/flex-wrap) */
  wrap: "flex-wrap";
  /** `<'flex-direction'> || <'flex-wrap'>`. Chrome 29, Edge 12, Firefox 28, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/flex-flow) */
  flow: "flex-flow";
  /** `normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ] | anchor-center`. Chrome 29, Edge 12, Firefox 20, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/align-items) */
  alignItems: "align-items";
  /** `normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>`. Chrome 29, Edge 12, Firefox 28, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/align-content) */
  alignContent: "align-content";
  /** `normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]`. Chrome 29, Edge 12, Firefox 20, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/justify-content) */
  justifyContent: "justify-content";
  /** `<'align-content'> <'justify-content'>?`. Chrome 59, Edge 79, Firefox 45, Safari 9, iOS 9, Android 59. [MDN](https://developer.mozilla.org/docs/Web/CSS/place-content) */
  placeContent: "place-content";
  /** `<'row-gap'> <'column-gap'>?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/gap) */
  gap: "gap";
  /** `normal | <length-percentage [0,∞]>`. Chrome 47, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 47. [MDN](https://developer.mozilla.org/docs/Web/CSS/row-gap) */
  rowGap: "row-gap";
  /** `normal | <length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1.5, Safari 3, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-gap) */
  columnGap: "column-gap";
};
type GridMethods = {
  /** `none | <track-list> | <auto-track-list> | subgrid <line-name-list>?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-template-columns) */
  templateColumns: "grid-template-columns";
  /** `none | <track-list> | <auto-track-list> | subgrid <line-name-list>?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-template-rows) */
  templateRows: "grid-template-rows";
  /** `none | <string>+`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-template-areas) */
  templateAreas: "grid-template-areas";
  /** `none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-template) */
  template: "grid-template";
  /** `[ row | column ] || dense`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-auto-flow) */
  autoFlow: "grid-auto-flow";
  /** `<track-size>+`. Chrome 57, Edge 16, Firefox 70, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-auto-columns) */
  autoColumns: "grid-auto-columns";
  /** `<track-size>+`. Chrome 57, Edge 16, Firefox 70, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid-auto-rows) */
  autoRows: "grid-auto-rows";
  /** `normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ] | anchor-center`. Chrome 29, Edge 12, Firefox 20, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/align-items) */
  alignItems: "align-items";
  /** `normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ] | anchor-center`. Chrome 52, Edge 12, Firefox 20, Safari 9, iOS 9, Android 52. [MDN](https://developer.mozilla.org/docs/Web/CSS/justify-items) */
  justifyItems: "justify-items";
  /** `<'align-items'> <'justify-items'>?`. Chrome 59, Edge 79, Firefox 45, Safari 11, iOS 11, Android 59. [MDN](https://developer.mozilla.org/docs/Web/CSS/place-items) */
  placeItems: "place-items";
  /** `normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>`. Chrome 29, Edge 12, Firefox 28, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/align-content) */
  alignContent: "align-content";
  /** `normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]`. Chrome 29, Edge 12, Firefox 20, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/justify-content) */
  justifyContent: "justify-content";
  /** `<'align-content'> <'justify-content'>?`. Chrome 59, Edge 79, Firefox 45, Safari 9, iOS 9, Android 59. [MDN](https://developer.mozilla.org/docs/Web/CSS/place-content) */
  placeContent: "place-content";
  /** `<'row-gap'> <'column-gap'>?`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/gap) */
  gap: "gap";
  /** `normal | <length-percentage [0,∞]>`. Chrome 47, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 47. [MDN](https://developer.mozilla.org/docs/Web/CSS/row-gap) */
  rowGap: "row-gap";
  /** `normal | <length-percentage [0,∞]>`. Chrome 1, Edge 12, Firefox 1.5, Safari 3, iOS 2, Android 18. [MDN](https://developer.mozilla.org/docs/Web/CSS/column-gap) */
  columnGap: "column-gap";
};
/** `none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]`. Chrome 29, Edge 12, Firefox 22, Safari 9, iOS 9, Android 29. [MDN](https://developer.mozilla.org/docs/Web/CSS/flex) */
declare const flex: Layout<"flex", FlexMethods>;
/** `<'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>`. Chrome 57, Edge 16, Firefox 52, Safari 10.1, iOS 10.3, Android 57. [MDN](https://developer.mozilla.org/docs/Web/CSS/grid) */
declare const grid: Layout<"grid", GridMethods>;
declare namespace types_d_exports {
  export { AttrOp, CSS$1 as CSS, CSSColorValue$1 as CSSColorValue, CSSImageValue$1 as CSSImageValue, CSSStyleValue$1 as CSSStyleValue, CSSUnitValue$1 as CSSUnitValue, Chain$1 as Chain, CheckOverrides, ClassValue, CvConfig, CvProps, CvValue, DtcgColor, DtcgCubicBezier, DtcgShadow, DtcgUnit, DtcgValue, Fallback, FlexMethods, GridMethods, Keyframes, Layout, Overrides, Part, PositionTry, Prop, QueryWrap, StateWrap, Steps, Style, Tokens, WebkitBoxOrient, WebkitBoxReflect, WebkitLineClamp, WebkitTapHighlightColor, WebkitTextFillColor, WebkitTextStroke, WebkitTextStrokeColor, WebkitTextStrokeWidth, WebkitTouchCallout, WebkitUserModify, Wrap, abs, accentColor, acos, active, alignContent, alignItems, alignSelf, alignmentBaseline, all, anchor, anchorName, anchorScope, anchorSize, animation, animationComposition, animationDelay, animationDirection, animationDuration, animationFillMode, animationIterationCount, animationName, animationPlayState, animationRange, animationRangeEnd, animationRangeStart, animationTimeline, animationTimingFunction, animationTrigger, anyLink, appearance, asin, aspectRatio, atan, atan2, attr, attrFn, autofill, backdropFilter, backfaceVisibility, background, backgroundAttachment, backgroundBlendMode, backgroundClip, backgroundColor, backgroundImage, backgroundOrigin, backgroundPosition, backgroundPositionX, backgroundPositionY, backgroundRepeat, backgroundSize, baselineShift, baselineSource, bg, blockSize, blur, border, borderBlock, borderBlockColor, borderBlockEnd, borderBlockEndColor, borderBlockEndStyle, borderBlockEndWidth, borderBlockStart, borderBlockStartColor, borderBlockStartStyle, borderBlockStartWidth, borderBlockStyle, borderBlockWidth, borderBottom, borderBottomColor, borderBottomLeftRadius, borderBottomRightRadius, borderBottomStyle, borderBottomWidth, borderCollapse, borderColor, borderEndEndRadius, borderEndStartRadius, borderImage, borderImageOutset, borderImageRepeat, borderImageSlice, borderImageSource, borderImageWidth, borderInline, borderInlineColor, borderInlineEnd, borderInlineEndColor, borderInlineEndStyle, borderInlineEndWidth, borderInlineStart, borderInlineStartColor, borderInlineStartStyle, borderInlineStartWidth, borderInlineStyle, borderInlineWidth, borderLeft, borderLeftColor, borderLeftStyle, borderLeftWidth, borderRadius, borderRight, borderRightColor, borderRightStyle, borderRightWidth, borderSpacing, borderStartEndRadius, borderStartStartRadius, borderStyle, borderTop, borderTopColor, borderTopLeftRadius, borderTopRightRadius, borderTopStyle, borderTopWidth, borderWidth, bottom, boxDecorationBreak, boxShadow, boxSizing, breakAfter, breakBefore, breakInside, brightness, buffering, calc, calcSize, captionSide, caret, caretAnimation, caretColor, caretShape, check, checked, circle, clamp, clear, clipPath, clipRule, cn, color, colorFn, colorInterpolationFilters, colorMix, colorScheme, columnCount, columnFill, columnGap, columnHeight, columnRule, columnRuleColor, columnRuleStyle, columnRuleWidth, columnSpan, columnWidth, columnWrap, columns, conicGradient, contain, containIntrinsicBlockSize, containIntrinsicHeight, containIntrinsicInlineSize, containIntrinsicSize, containIntrinsicWidth, container, containerName, containerType, content, contentVisibility, contrast, contrastColor, cornerBlockEndShape, cornerBlockStartShape, cornerBottomLeftShape, cornerBottomRightShape, cornerBottomShape, cornerEndEndShape, cornerEndStartShape, cornerInlineEndShape, cornerInlineStartShape, cornerLeftShape, cornerRightShape, cornerShape, cornerStartEndShape, cornerStartStartShape, cornerTopLeftShape, cornerTopRightShape, cornerTopShape, cos, counter, counterIncrement, counterReset, counterSet, counters, createGlobalTheme, createTokens, crossFade, css, cubicBezier, cursor, cv, cx, cy, d, defined, direction, disabled, display, dominantBaseline, dropShadow, dynamicRangeLimit, dynamicRangeLimitMix, element, ellipse, empty, emptyCells, enabled, env, exp, fieldSizing, fill, fillOpacity, fillRule, filter, firstChild, firstOfType, firstThatWorks, fitContent, flex, flexBasis, flexDirection, flexFlow, flexGrow, flexShrink, flexWrap, float, floodColor, floodOpacity, flowTolerance, focus, focusVisible, focusWithin, font, fontFamily, fontFeatureSettings, fontKerning, fontLanguageOverride, fontOpticalSizing, fontPalette, fontSize, fontSizeAdjust, fontStyle, fontSynthesis, fontSynthesisPosition, fontSynthesisSmallCaps, fontSynthesisStyle, fontSynthesisWeight, fontVariant, fontVariantAlternates, fontVariantCaps, fontVariantEastAsian, fontVariantEmoji, fontVariantLigatures, fontVariantNumeric, fontVariantPosition, fontVariationSettings, fontWeight, fontWidth, forcedColorAdjust, fullscreen, future, gap, global, grayscale, grid, gridArea, gridAutoColumns, gridAutoFlow, gridAutoRows, gridColumn, gridColumnEnd, gridColumnStart, gridRow, gridRowEnd, gridRowStart, gridTemplate, gridTemplateAreas, gridTemplateColumns, gridTemplateRows, group, hangingPunctuation, height, hover, hsl, hsla, hueRotate, hwb, hyphenateCharacter, hyphenateLimitChars, hyphens, hypot, image, imageOrientation, imageRendering, imageResolution, imageSet, inRange, indeterminate, initialLetter, initialLetterAlign, inlineSize, inset, insetBlock, insetBlockEnd, insetBlockStart, insetFn, insetInline, insetInlineEnd, insetInlineStart, interactivity, interestDelay, interestDelayEnd, interestDelayStart, interpolateSize, invalid, invert, isolation, justifyContent, justifyItems, justifySelf, keyframes, lab, lastChild, lastOfType, layer, layers, lch, leader, left, letterSpacing, lightDark, lightingColor, lineBreak, lineClamp, lineHeight, lineHeightStep, linear, linearGradient, link, listStyle, listStyleImage, listStylePosition, listStyleType, log, m, margin, marginBlock, marginBlockEnd, marginBlockStart, marginBottom, marginInline, marginInlineEnd, marginInlineStart, marginLeft, marginRight, marginTop, marginTrim, marker, markerEnd, markerMid, markerStart, mask, maskBorder, maskBorderMode, maskBorderOutset, maskBorderRepeat, maskBorderSlice, maskBorderSource, maskBorderWidth, maskClip, maskComposite, maskImage, maskMode, maskOrigin, maskPosition, maskRepeat, maskSize, maskType, mathDepth, mathShift, mathStyle, matrix, matrix3d, max, maxBlockSize, maxHeight, maxInlineSize, maxLines, maxWidth, mb, media, min, minBlockSize, minHeight, minInlineSize, minWidth, minmax, mixBlendMode, ml, mod, modal, mr, mt, muted, objectFit, objectPosition, objectViewBox, offset, offsetAnchor, offsetDistance, offsetPath, offsetPosition, offsetRotate, oklab, oklch, onlyChild, onlyOfType, opacity, opacityFn, open, optional, order, orphans, outOfRange, outline, outlineColor, outlineOffset, outlineStyle, outlineWidth, overflow, overflowAnchor, overflowBlock, overflowClipMargin, overflowInline, overflowWrap, overflowX, overflowY, overlay, overscrollBehavior, overscrollBehaviorBlock, overscrollBehaviorInline, overscrollBehaviorX, overscrollBehaviorY, p, padding, paddingBlock, paddingBlockEnd, paddingBlockStart, paddingBottom, paddingInline, paddingInlineEnd, paddingInlineStart, paddingLeft, paddingRight, paddingTop, page, paint, paintOrder, paletteMix, past, path, paused, pb, perspective, perspectiveFn, perspectiveOrigin, pictureInPicture, pl, placeContent, placeItems, placeSelf, placeholderShown, playing, pointerEvents, polygon, popoverOpen, position, positionAnchor, positionArea, positionTry, positionTryFallbacks, positionTryOrder, positionVisibility, pow, pr, printColorAdjust, pt, quotes, r, radialGradient, ray, readOnly, readWrite, readingFlow, readingOrder, rect, rem, repeatingConicGradient, repeatingLinearGradient, repeatingRadialGradient, required, resize, rgb, rgba, right, root, rotate, rotate3d, rotateFn, rotateX, rotateY, rotateZ, round, rowGap, rubyAlign, rubyMerge, rubyOverhang, rubyPosition, rx, ry, saturate, scale, scale3d, scaleFn, scaleX, scaleY, scaleZ, scope$1 as scope, scroll, scrollBehavior, scrollInitialTarget, scrollMargin, scrollMarginBlock, scrollMarginBlockEnd, scrollMarginBlockStart, scrollMarginBottom, scrollMarginInline, scrollMarginInlineEnd, scrollMarginInlineStart, scrollMarginLeft, scrollMarginRight, scrollMarginTop, scrollMarkerGroup, scrollPadding, scrollPaddingBlock, scrollPaddingBlockEnd, scrollPaddingBlockStart, scrollPaddingBottom, scrollPaddingInline, scrollPaddingInlineEnd, scrollPaddingInlineStart, scrollPaddingLeft, scrollPaddingRight, scrollPaddingTop, scrollSnapAlign, scrollSnapStop, scrollSnapType, scrollTargetGroup, scrollTimeline, scrollTimelineAxis, scrollTimelineName, scrollbarColor, scrollbarGutter, scrollbarWidth, seeking, sepia, shapeImageThreshold, shapeMargin, shapeOutside, shapeRendering, sign, sin, skew, skewX, skewY, speakAs, sqrt, src, stalled, steps, stopColor, stopOpacity, stroke, strokeColor, strokeDasharray, strokeDashoffset, strokeLinecap, strokeLinejoin, strokeMiterlimit, strokeOpacity, strokeWidth, style, superellipse, supports, symbols, tabSize, tableLayout, tan, target, targetCounter, targetCounters, targetText, textAlign, textAlignLast, textAnchor, textAutospace, textBox, textBoxEdge, textBoxTrim, textCombineUpright, textDecoration, textDecorationColor, textDecorationInset, textDecorationLine, textDecorationSkip, textDecorationSkipInk, textDecorationStyle, textDecorationThickness, textEmphasis, textEmphasisColor, textEmphasisPosition, textEmphasisStyle, textIndent, textJustify, textOrientation, textOverflow, textRendering, textShadow, textSizeAdjust, textSpacingTrim, textTransform, textUnderlineOffset, textUnderlinePosition, textWrap, textWrapMode, textWrapStyle, timelineScope, timelineTrigger, timelineTriggerExitRange, timelineTriggerExitRangeEnd, timelineTriggerExitRangeStart, timelineTriggerName, timelineTriggerRange, timelineTriggerRangeEnd, timelineTriggerRangeStart, timelineTriggerSource, token, top, touchAction, transform, transformBox, transformOrigin, transformStyle, transition, transitionBehavior, transitionDelay, transitionDuration, transitionProperty, transitionTimingFunction, translate, translate3d, translateFn, translateX, translateY, translateZ, triggerScope, unicodeBidi, url, userInvalid, userSelect, userValid, valid, _var as var, vectorEffect, verticalAlign, view, viewTimeline, viewTimelineAxis, viewTimelineInset, viewTimelineName, viewTransitionClass, viewTransitionName, visibility, visited, volumeLocked, whiteSpace, whiteSpaceCollapse, widows, width, willChange, within, wordBreak, wordSpacing, wordWrap, writingMode, x, xywh, y, zIndex, zoom };
}
/** One property: parts are checked against its mdn grammar; `R` is what the call gives (a chain method: the chain). */
type Prop<P extends keyof typeof properties, R = Style> = <const A extends readonly Part[]>(...parts: Check<P, A>) => R;
/** `flex` and `grid`: no argument is the layout context (`display`, chaining `M`), parts are the property of that name. */
interface Layout<P extends "flex" | "grid", M extends Record<string, keyof typeof properties>> {
  /** The layout context: sets `display` and chains its container properties. */
  (): Chain$1<M>;
  /** The shorthand property of this name: parts are checked against its mdn grammar. A plain style, it does not chain. */
  <const A extends readonly Part[]>(...parts: Check<P, A>): Style;
}
/** A style you can chain container properties on (flex() and grid()), and use as a class string. `M`: method -> property. */
type Chain$1<M extends Record<string, keyof typeof properties>> = Style & { readonly [K in keyof M]: Prop<M[K], Chain$1<M>>; };
/** A condition: styles in, the same styles under it out (media(), container(), supports(), hover, ...). */
type Wrap = (...styles: Style[]) => Style;
/** A condition on the element's own state: the pseudo-class wrappers (`hover`) and `attr(...)`; `within()` takes one. */
type StateWrap = Wrap & {
  readonly __state: true;
};
/** What media() and container() give: a condition that createGlobalTheme takes (a pseudo-class wrapper is not one). */
type QueryWrap = Wrap & {
  readonly __query: true;
};
/** The value a variant takes: its keys, or a boolean when they are only `true` and `false`. */
type CvValue<V> = [keyof V] extends ["true" | "false"] ? boolean : `${keyof V & (string | number)}`;
/** The props of a `cv()` function: one optional value per variant. */
type CvProps<V> = { [K in keyof V]?: CvValue<V[K]> | undefined; };
interface CvConfig<V extends Record<string, Record<string, Style>>> {
  base?: Style;
  variants?: V;
  defaultVariants?: CvProps<NoInfer<V>>;
  /** Styles added when every value named here is active, and that win over the variants they combine. */
  compoundVariants?: (CvProps<NoInfer<V>> & {
    class: Style;
  })[];
}
/**
 * Merges styles into one class string. What is known at build time merges (the later property wins); a runtime value
 * (`on && p(4)`, `props.class`, a state call) is joined when the code runs, and a style in it replaces the classes it
 * overrides while it is active.
 */
declare function cn(...styles: Style[]): Style;
declare function cn(...parts: ClassValue[]): string;
/** The name of a `keyframes()` rule: a `<custom-ident>` for `animation` and `animationName`. */
interface Keyframes extends CSSStyleValue<"custom-ident"> {
  readonly "~keyframes": true;
}
/** The name of a `positionTry()` rule: a `<dashed-ident>` for `positionTryFallbacks`. */
interface PositionTry extends CSSStyleValue<"dashed-ident"> {
  readonly "~positionTry": true;
}
/** The steps of a `@keyframes` rule: `from`, `to` and percentages, each a style of declarations. */
interface Steps {
  from?: Style;
  to?: Style;
  [percent: `${number}%`]: Style;
}
/**
 * `keyframes({ from: opacity(0), to: opacity(1) })`: a `@keyframes` rule named by a hash of its content, in the sheet of
 * the modules that use the name. Each step is checked like a class; no conditions.
 */
declare const keyframes: (steps: Steps) => Keyframes;
/**
 * `positionTry(cn(top("anchor(bottom)"), margin(2)))`: a `@position-try` rule, in the sheet of the modules that use its
 * name. Only inset, margin, sizing, self-alignment, `position-anchor` and `position-area` are allowed (a build error).
 * `position-try` is also a property: with value parts (`positionTry("flip-block")`) it is that shorthand, as before.
 */
declare const positionTry: ((style: Style) => PositionTry) & Prop<"position-try">;
/**
 * `minHeight(firstThatWorks("100dvh", "100vh"))`: the value you want, then what to use where it fails. A part of any
 * property; the build emits one class with all the declarations, the wanted one last. Each value is checked for the property.
 */
declare const firstThatWorks: <const V extends readonly [Alt, Alt, ...Alt[]]>(...values: V) => Fallback<V>;
/** Query strings are checked against the mdn-data grammar: `media("(width >= 40rem)")`. Several give a tuple, an object an object. */
declare const media: Condition<"media", QueryWrap>;
declare const container: Condition<"container", QueryWrap>;
declare const supports: Condition<"supports", Wrap>;
/** An attribute or a group name: no space, brackets, quotes, `=`, `.` or `#` (the build checks the rest). */
type Name<N extends string> = N extends "" | `${string}${" " | "[" | "]" | "=" | '"' | "'" | "." | "#"}${string}` ? `"${N}" is not a name` : N;
type AttrOp = "=" | "~=" | "|=" | "^=" | "$=" | "*=";
/**
 * `attr("aria-current", "page")(color(...))` is `._x[aria-current="page"]`; no value is `[disabled]`. The value is
 * quoted for you. `op` is how the value is compared: `=` (default), `~=` (a word), `|=`, `^=`, `$=`, `*=`. One condition.
 */
declare const attr: {
  <const N extends string>(name: Name<N>): StateWrap;
  <const N extends string>(name: Name<N>, value: string, op?: AttrOp): StateWrap;
};
/**
 * `group()` is the marker class `_g` for the element whose state `within()` reads; `group("row")` is `_g-row`, for a
 * nested group. It has no CSS of its own.
 */
declare const group: <const N extends string = never>(name?: Name<N>) => Style;
/**
 * `within(hover)(color("red"))` is the style while a marked ancestor is hovered: `:where(._g:hover) ._x`, one class of
 * specificity, one condition. `within(hover, "row")` reads the `group("row")` ancestor.
 */
declare const within: <const N extends string = never>(state: StateWrap, name?: Name<N>) => Wrap;
/**
 * `global(":root", media(dark)(colorScheme("dark")))`: a rule with no class, in layer `_.k`, in the sheet of the module
 * that calls it. The selector is a `<complex-selector-list>` (the build reads it, the types check the brackets and
 * quotes); the styles are plain declarations, under media(), container() or supports() if you like.
 */
declare const global: <const S extends string>(selector: ValidSelector<S>, ...styles: Style[]) => void;
/** `token.<type>(initial, name?)`: a Typed OM value of the type, `var(--name)`. With a name it can be set. */
declare const token: { readonly [K in TokenType]: TokenFn<K>; } & {
  readonly set: TokenSetFn;
};
/** css values (declarations, no conditions) and `token.set()` results, as an inline `style` object. */
declare const style: (...styles: (Style | StyleObject)[]) => StyleObject;
/** The plugin replaces the call by a runtime function of class strings: `button({ size: "lg" })` gives the class names. */
declare const cv: <V extends Record<string, Record<string, Style>> = Record<never, never>>(config: CvConfig<V>) => (props?: CvProps<V>) => string;
declare const css: typeof members_d_exports & {
  cn: typeof cn;
  firstThatWorks: typeof firstThatWorks;
  keyframes: typeof keyframes;
  positionTry: typeof positionTry;
  media: typeof media;
  container: typeof container;
  supports: typeof supports;
  attr: typeof attr;
  group: typeof group;
  within: typeof within;
  global: typeof global;
  layers: typeof layers;
  token: typeof token;
  style: typeof style;
  cv: typeof cv;
  CSS: typeof CSS;
  CSSColorValue: typeof CSSColorValue;
  CSSImageValue: typeof CSSImageValue;
  CSSStyleValue: typeof CSSStyleValue;
  CSSUnitValue: typeof CSSUnitValue;
};
//#endregion
//#region src/theme-types.d.ts
type Component = number | "none";
type FontWeightName = "thin" | "hairline" | "extra-light" | "ultra-light" | "light" | "normal" | "regular" | "book" | "medium" | "semi-bold" | "demi-bold" | "bold" | "extra-bold" | "ultra-bold" | "black" | "heavy" | "extra-black" | "ultra-black";
/** A DTCG colour: components in the ranges of docs/research/design-tokens.md; `hex` is a fallback and is ignored. */
interface DtcgColor {
  readonly colorSpace: "srgb" | "srgb-linear" | "hsl" | "hwb" | "lab" | "lch" | "oklab" | "oklch" | "display-p3" | "a98-rgb" | "prophoto-rgb" | "rec2020" | "xyz-d65" | "xyz-d50";
  readonly components: readonly [Component, Component, Component];
  readonly alpha?: number;
  readonly hex?: string;
}
interface DtcgUnit<U extends string> {
  readonly value: number;
  readonly unit: U;
}
type DtcgCubicBezier = readonly [number, number, number, number];
/** A DTCG shadow: a colour and four dimensions, each a DTCG value or a CSS string. */
interface DtcgShadow {
  readonly color: DtcgColor | string;
  readonly offsetX: DtcgUnit<"px" | "rem"> | string;
  readonly offsetY: DtcgUnit<"px" | "rem"> | string;
  readonly blur: DtcgUnit<"px" | "rem"> | string;
  readonly spread: DtcgUnit<"px" | "rem"> | string;
  readonly inset?: boolean;
}
/** The object forms of a DTCG `$value` (a CSS string is always allowed, a number for `number` and `fontWeight`). */
type DtcgValue<D extends DtcgType> = D extends "color" ? DtcgColor : D extends "dimension" ? DtcgUnit<"px" | "rem"> : D extends "duration" ? DtcgUnit<"ms" | "s"> : D extends "fontWeight" ? number | FontWeightName : D extends "cubicBezier" ? DtcgCubicBezier : D extends "shadow" ? DtcgShadow | readonly DtcgShadow[] : number;
type Kind$1<D> = D extends DtcgType ? (typeof DTCG_TYPES)[D] : never;
type TypeOf<N, Inherited> = N extends {
  readonly $type: infer Y;
} ? Y : Inherited;
type KindOf<V, Ty, Root> = Ty extends DtcgType ? Kind$1<Ty> : V extends `{${infer P}}` ? KindAt<Root, P, Root> : TokenType;
type KindAt<N, P extends string, Root, Inherited = undefined> = P extends `${infer H}.${infer R}` ? H extends keyof N ? KindAt<N[H], R, Root, TypeOf<N[H], Inherited>> : never : P extends keyof N ? N[P] extends {
  readonly $value: infer V;
} ? KindOf<V, TypeOf<N[P], Inherited>, Root> : never : never;
type Text<V> = V extends string ? V : V extends number ? `${V}` : V extends {
  readonly value: infer N extends number;
  readonly unit: infer U extends string;
} ? `${N}${U}` : string;
type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
/**
 * The tokens of a `const` DTCG object: every leaf `{ $value }` is a named token of the type its `$type` maps to, carrying the
 * definition's value as text. A key that starts with a digit is read as `_<key>` (`t.space._2xs`).
 */
type Tokens<G, Inherited = undefined, Root = G> = { readonly [K in keyof G as K extends `$${string}` ? never : K extends `${Digit}${string}` ? `_${K}` : K]: G[K] extends {
  readonly $value: infer V;
} ? Token<KindOf<V, TypeOf<G[K], Inherited>, Root>, true, Text<V>> : Tokens<G[K], TypeOf<G[K], Inherited>, Root>; };
type Bad$2<Why extends string> = {
  readonly $error: `cssints: ${Why}`;
};
type Fits<V, R> = [R] extends [V] ? true : Bad$2<R extends string ? R : "not a value of this type">;
type Valid$1<Kd extends TokenType, V extends string> = Kd extends "color" ? V extends `#${string}${" " | "," | "(" | ")" | "/"}${string}` ? ValidToken<Kd, V> : V extends `#${string}` ? V : ValidToken<Kd, V> : ValidToken<Kd, V>;
type Sentinel$1<K> = K extends TokenType ? `⟨${(typeof TOKEN_TYPES)[K]["sentinels"][0]}⟩` : never;
type Subst<V extends string, Root> = V extends `${infer A}{${infer P}}${infer B}` ? [KindAt<Root, P, Root>] extends [never] ? never : `${A}${Sentinel$1<KindAt<Root, P, Root>>}${Subst<B, Root>}` : V;
type CheckString<V extends string, Ty extends DtcgType, Root> = V extends `${string}{${string}}${string}` ? [Subst<V, Root>] extends [never] ? Bad$2<"a reference {…} has no token"> : Fits<Subst<V, Root>, Valid$1<Kind$1<Ty>, Subst<V, Root>>> : Ty extends "fontWeight" ? V extends FontWeightName ? true : Fits<V, ValidSyntax<"number", V>> : Fits<V, Valid$1<Kind$1<Ty>, V>>;
type CheckValue<V, Ty, Root> = string extends Ty ? true : V extends `{${infer P}}` ? [KindAt<Root, P, Root>] extends [never] ? Bad$2<`no token at ${P}`> : true : Ty extends DtcgType ? V extends string ? CheckString<V, Ty, Root> : V extends DtcgValue<Ty> ? true : Bad$2<`not a DTCG ${Ty}`> : Bad$2<`$type ${Ty extends string ? `"${Ty}"` : "missing"} has no token type (color, dimension, number, duration, fontWeight, cubicBezier, shadow)`>;
type ValidLeaf<L, Ty, Root> = L extends {
  readonly $value: infer V;
} ? CheckValue<V, Ty, Root> extends (infer R) ? [R] extends [true] ? L : R : never : never;
type ValidGroup<G, Inherited, Root> = { [K in keyof G]: K extends `$${string}` ? G[K] : G[K] extends {
  readonly $value: unknown;
} ? ValidLeaf<G[K], TypeOf<G[K], Inherited>, Root> : ValidGroup<G[K], TypeOf<G[K], Inherited>, Root>; };
/**
 * Tokens from an inline DTCG-shaped `const` object: `$type` is inherited through groups, a leaf is `{ $value }`, a value is
 * a DTCG value or a CSS string of the type's grammar, an alias is `"{group.token}"`. The variable is the kebab-case path
 * (`--color-bg`), or what the mapper returns for the path.
 */
declare const createTokens: <const T extends {
  readonly [name: string]: unknown;
}>(tokens: T & ValidGroup<T, undefined, T>, name?: (path: readonly string[]) => string | TokenName) => Tokens<T>;
type Kinds = { readonly [K in DtcgType]: (typeof DTCG_TYPES)[K]; };
type ObjectValue<K extends TokenType> = K extends Kinds["color"] ? DtcgColor : K extends Kinds["dimension"] ? DtcgUnit<"px" | "rem"> : K extends Kinds["duration"] ? DtcgUnit<"ms" | "s"> : K extends Kinds["cubicBezier"] ? DtcgCubicBezier : K extends Kinds["shadow"] ? DtcgShadow | readonly DtcgShadow[] : number;
/**
 * The values a theme may set: the paths of the tokens, each a value of the token's type, or a DTCG leaf `{ $value }` (the
 * file of another mode, whose `$type` and `$extensions` are skipped). A token `_500` is also `500`, as in the data.
 */
type Overrides<X> = { readonly [K in keyof X as K | (K extends `_${infer D extends `${Digit}${string}`}` ? D : never)]?: X[K] extends {
  readonly "~token": infer Kd extends TokenType;
} ? string | number | ObjectValue<Kd> | {
  readonly $value: unknown;
} : Overrides<X[K]>; };
type KindIn<X, P extends string> = P extends `${infer H}.${infer R}` ? H extends keyof X ? KindIn<X[H], R> : never : P extends keyof X ? X[P] extends {
  readonly "~token": infer Kd extends TokenType;
} ? Kd : never : never;
type SubstIn<V extends string, X> = V extends `${infer A}{${infer P}}${infer B}` ? [KindIn<X, P>] extends [never] ? never : `${A}${Sentinel$1<KindIn<X, P>>}${SubstIn<B, X>}` : V;
type CheckRefs<V extends string, Kd extends TokenType, X> = V extends `{${infer P}}` ? [KindIn<X, P>] extends [never] ? Bad$2<`a reference {${P}} has no token`> : [KindIn<X, P>] extends [Kd] ? V : Bad$2<`{${P}} is a ${KindIn<X, P>}, not a ${Kd}`> : [SubstIn<V, X>] extends [never] ? Bad$2<"a reference {…} has no token"> : Fits<SubstIn<V, X>, Valid$1<Kd, SubstIn<V, X>>> extends (infer R) ? [R] extends [true] ? V : R : never;
type CheckOverride<T, V, Root> = T extends {
  readonly "~token": infer Kd extends TokenType;
} ? V extends string ? V extends FontWeightName ? V : V extends `${string}{${string}}${string}` ? CheckRefs<V, Kd, Root> : Fits<V, Valid$1<Kd, V>> extends (infer R) ? [R] extends [true] ? V : R : never : V : CheckOverrides<T, V, Root>;
type CheckOverrides<X, O, Root = X> = { [K in keyof O]: K extends `$${string}` ? O[K] : K extends keyof X ? CheckOverride<X[K], O[K], Root> : K extends `${Digit}${string}` ? `_${K}` extends keyof X ? CheckOverride<X[`_${K}`], O[K], Root> : Bad$2<"no token at this path"> : Bad$2<"no token at this path">; };
/**
 * Re-declares the overridden tokens under a media or container condition (on `:root`), or under a selector, and the
 * aliases that depend on them. An unknown path and a value that is not of the token's type are type errors.
 * `layer` puts the rule in a top-level layer that `layers()` declares (the build checks that it does); `scope` (with a
 * selector) confines it to a subtree: `@scope (<scope>) { ... }`.
 */
declare const createGlobalTheme: <const X extends object, const O extends Overrides<X>, const S extends string>(tokens: X, condition: QueryWrap | string, overrides: O & CheckOverrides<X, O>, options?: {
  readonly layer?: string;
  readonly scope?: ValidSelector<S>;
}) => void;
/**
 * Declares top-level layers in order, printed once after the engine's own (`@layer app, author, viewer;`), so what is in
 * them beats the engine's `:root` fallbacks; `{ before: true }` at the end prints them before the engine's, below every
 * class (`layers("reset", { before: true })`). A theme's `layer` and a plugin's rules must name a declared layer. The
 * same names again are fine; the same names in another order, or both before and after, are a build error.
 */
declare const layers: (...names: readonly [string, ...string[]] | readonly [string, ...string[], {
  readonly before: boolean;
}]) => void;
/** Build-time checks over tokens. */
declare const check: {
  /**
   * WCAG 2.x contrast of `fg` on `bg`, for the defaults and every theme that affects either; below `min` is a build error.
   * A token from a JSON import has every type to the editor, so it fits; the build checks it is a colour.
   */
  readonly contrast: <F extends TokenType, B extends TokenType>(fg: Token<F, boolean> & ColourOrAny<F>, bg: Token<B, boolean> & ColourOrAny<B>, options: {
    readonly min: number;
  }) => void;
};
type ColourOrAny<K extends TokenType> = "color" extends K ? unknown : never;
//#endregion
//#region src/scope.d.ts
/** A selector of `nest()`: one with `&`, the kernel's class (`& > *`, `& p`, `:root:has(&)`, `.x &`); the build reads the rest. */
type NestSelector<S extends string> = S extends `${string}&${string}` ? S : `nest(): "${S}" has no &`;
/** What only a kernel written as styles has, besides all of "cssints". */
interface KernelCss {
  /**
   * `nest("& > *")(flexGrow(1))`: styles under a selector around the kernel's class (`._k > *`, `:root:has(._k)`). A
   * condition inside applies to its subject (`& > *:hover`), one around it to the element (`._k:hover > *`,
   * `:root:has(._k:hover)`). One condition. When the subject is another element (`&` not in the last compound), what it
   * sets is not the element's, so a member's derived conflicts leave it out; `.x &` is the element's.
   */
  nest: <const S extends string>(selector: NestSelector<S>) => Wrap;
  /**
   * `vars({ "--_gap": "1rem" })`: custom properties on the element (`--_x` is `--<scope>-x`), values not checked. A
   * `keyframes()` or `positionTry()` name is a value too: its rule goes with the kernel. Not part of derived conflicts.
   */
  vars: (set: {
    readonly [name: `--${string}`]: string | number | CSSStyleValue;
  }) => Style;
}
/** The `css` a kernel written as styles is handed: all of "cssints", as user code has it, and `nest` and `vars`. */
type Css = typeof types_d_exports & KernelCss;
/**
 * A kernel: global CSS printed once, bound to a class. `&` stands for the class the engine mints for it (`&(mod.key)`: the
 * class of the kernel `key` of an embedded scope `mod`), `--_x` for the custom property `--<scope>-x`. `css` is verbatim
 * CSS, or styles (`(css) => css.outline("var(--_w)", "solid")`: declarations checked like a user's, printed as `&{...}`).
 */
interface KernelDef {
  css: string | ((css: Css) => Style | readonly Style[]);
  atProperty?: string;
  requires?: (BcdKey | {
    key: BcdKey;
    exact: true;
  })[];
}
/** A static global rule; `layer` is a top-level layer that `layers` declares (a contract's name: never namespaced). */
interface GlobalDef {
  rule: string;
  layer?: string;
}
/** Top-level layers to declare, in order: after the engine's layers, or with `before: true` before them (below every class). */
interface LayersDef {
  layers: readonly string[];
  before?: boolean;
}
interface ParentVar {
  marker: "&";
  read: `--_${string}`;
  write: `--_${string}`;
  watch?: `--_${string}`;
}
/** The browser half, delivered when a target lacks a polyfilled feature (`virtual:cssints/runtime/<scope>.<entry>`); `&` is the marker of the member's first kernel. */
interface RuntimeDef {
  polyfills: BcdKey[];
  parentVars?: ParentVar[];
  css?: string;
  /** A module specifier the app resolves (a package subpath, `"@cssints/balance/runtime"`): imported when a target lacks a polyfilled feature. */
  script?: string;
}
/** A build error when one `cn()` holds the member's marker and a property listed here (a name, or a pattern). */
interface ConflictDef {
  props: (string | RegExp)[];
  message: string;
}
/** A token set the scope owns: its paths become syntax aliases (`<brand.color.accent>` is the token's type). */
interface TokensDef {
  tokens: object;
}
/** One method of a chain. `args: ""` takes no value; a lone number is a spacing step with `spacing`. */
interface MethodDef<G extends string = string, Sp extends boolean = boolean, X extends string = string> {
  readonly args: G;
  readonly spacing?: Sp;
  readonly excludes?: readonly X[];
  readonly emit: (value: string) => Decl[];
}
declare const typed: unique symbol;
/** An argument whose type is TypeScript's, not CSS's (`arg<"home" | "star">()`); the member's `build` checks it at build time. */
interface Typed<T> {
  readonly [typed]: T;
}
/** `arg<T>()`: one value of the TypeScript type `T`. */
declare const arg: <T>() => Typed<T>;
/** One argument: a grammar (aliases of the table allowed), `"$tokens"` (a token set), `"$overrides"` (values for the paths of the `$tokens` before it), `"$selector"` (a CSS selector list) or `arg<T>()`. */
type Leaf = string | Typed<unknown>;
/** An object argument of named leaves (`"key?"` is optional). */
interface RecordDef {
  readonly [key: string]: Leaf;
}
/**
 * What a call takes: a grammar (the parts, joined by a space, as a property takes them), `arg<T>()`, or a tuple of
 * positional arguments, each a `Leaf` or one `RecordDef` (an object; it may be left out when all its keys are optional).
 */
type ArgsDef = Leaf | readonly (Leaf | RecordDef)[];
/** What a member's build gives: declarations, and what else it needs by name (`uses`), globals, themes and layers. */
interface Made {
  decls?: Decl[];
  /** Entries of the table (kernels, globals, layers, runtimes, conflicts) chosen by this call; `module.entry` for an embedded scope. */
  uses?: readonly string[];
  /** A rule that is not a class: identified by its content, forgotten with the file that made it. */
  globals?: {
    css: string;
    layer?: string;
  }[];
  /** As `createGlobalTheme(tokens, selector, overrides, { layer, scope })`: registered like any theme. */
  themes?: {
    tokens: object;
    overrides: object;
    selector: string;
    layer?: string;
    scope?: string;
  }[];
  /** Top-level layers to declare, in order: a list, printed after the engine's layers, or `{ layers, before: true }`. */
  layers?: readonly string[] | LayersDef;
}
interface ChainDef {
  chain: {
    readonly [method: string]: MethodDef;
  };
  uses?: readonly string[];
  /** Every style of the member carries the group marker `_g-<scope>`, which `within(state, "<scope>")` reads. */
  group?: true;
}
/** A member that takes arguments and gives declarations: its function is the entry of the same name in `.build()`. */
interface CallDef {
  args: ArgsDef;
  uses?: readonly string[];
  /** Every style of the member carries the group marker `_g-<scope>`, which `within(state, "<scope>")` reads. */
  group?: true;
}
/**
 * A member computed at build time into a value. `value` gets the arguments in an array: a grammar's parts as text, one by
 * one; a tuple's arguments or `arg<T>()` as `build` would, which needs `fn({ args, value })` to type them. `label` names
 * the member in its errors (the key by default).
 */
interface ValueDef {
  args: ArgsDef;
  value(parts: string[]): string | CSSStyleValue;
  label?: string;
}
/**
 * A value member whose `args` is a tuple or `arg<T>()`: `value` gets the arguments as a call member's `build` does. A
 * table cannot type `value` from the `args` beside it (as `build()` does for call members); this call can.
 */
declare const fn: <const D extends ArgsDef, R extends string | CSSStyleValue, const L extends string = never>(def: {
  args: D;
  label?: L;
  value: (args: Params<D>) => R;
}) => {
  args: D;
  label?: L;
  value(args: never): R;
};
interface ModuleLike {
  readonly "~scope": string;
  readonly "~table": object;
  readonly "~aliases": object;
  readonly "~usable": string;
}
type Entry = string | ModuleLike | ChainDef | CallDef | ValueDef | KernelDef | GlobalDef | LayersDef | RuntimeDef | ConflictDef | TokensDef;
interface Table {
  readonly [key: string]: Entry;
}
type Kind<K, V> = V extends string ? K extends `-${string}` ? "prop" : "alias" : V extends ModuleLike ? "module" : V extends {
  chain: unknown;
} ? "chain" : V extends {
  args: unknown;
  value: unknown;
} ? "value" : V extends {
  args: unknown;
} ? "call" : V extends {
  tokens: unknown;
} ? "tokens" : V extends {
  polyfills: unknown;
} ? "runtime" : V extends {
  props: unknown;
} ? "conflicts" : V extends {
  rule: unknown;
} ? "global" : V extends {
  layers: unknown;
} ? "layers" : V extends {
  css: unknown;
} ? "kernel" : never;
type Strip<K> = K extends `#${infer R}` ? R : K;
type Private<K> = K extends `#${string}` ? true : false;
type Usable = "kernel" | "global" | "layers" | "runtime" | "conflicts";
type Camel<S extends string> = S extends `-${infer H}` ? Camel<H> : S extends `${infer A}-${infer B}` ? `${A}${Capitalize<Camel<B>>}` : S;
/** `<name>` of the table in place, as a group; what is not an alias of the table is left to mdn. The runtime `expand` does the same. */
type Expand<G extends string, A, D extends 0[] = []> = D["length"] extends 6 ? G : G extends `${infer Pre}<${infer N}>${infer Post}` ? N extends keyof A ? A[N] extends (infer S extends string) ? `${Pre}[ ${Expand<S, A, [...D, 0]>} ]${Expand<Post, A, D>}` : G : `${Pre}<${N}>${Expand<Post, A, D>}` : G;
type Own<T> = { [K in keyof T & string as Kind<K, T[K]> extends "alias" ? Strip<K> : never]: T[K]; };
type Resolved<A> = { [N in keyof A]: A[N] extends string ? Expand<A[N], A> : never; };
type Paths<X, P extends string = ""> = { [K in keyof X & string]: X[K] extends {
  readonly "~token": infer Kd extends TokenType;
} ? { [Q in `${P}${K}`]: Grammar<Kd>; } : Paths<X[K], `${P}${K}.`>; }[keyof X & string];
type Flat<U> = (U extends unknown ? (x: U) => void : never) extends ((x: infer I) => void) ? I : never;
type ModAliases<T> = Flat<{ [K in keyof T & string]: Kind<K, T[K]> extends "module" ? T[K] extends {
  "~aliases": infer MA;
} ? { [N in keyof MA & string as `${K}.${N}`]: MA[N]; } : never : Kind<K, T[K]> extends "tokens" ? T[K] extends {
  tokens: infer X;
} ? Flat<Paths<X, `${K}.`>> : never : never; }[keyof T & string]>;
type AliasesOf<T> = Own<T> & ModAliases<T>;
type Public<T> = Resolved<{ [K in keyof Own<T> as Private<K> extends true ? never : K]: Own<T>[K]; }>;
type UsableOf<T> = { [K in keyof T & string]: Kind<K, T[K]> extends Usable ? Strip<K> : Kind<K, T[K]> extends "module" ? T[K] extends {
  "~usable": infer U extends string;
} ? `${K}.${U}` : never : never; }[keyof T & string];
type PublicUsable<T> = { [K in keyof T & string]: Private<K> extends true ? never : Kind<K, T[K]> extends Usable ? K : Kind<K, T[K]> extends "module" ? T[K] extends {
  "~usable": infer U extends string;
} ? `${K}.${U}` : never : never; }[keyof T & string];
type Excluded<X extends string> = string extends X ? never : X;
/** The chain of a context: each method is checked against its grammar and leaves the chain, so it is used once. */
type Chain<L extends string, M, A> = Style & { readonly [K in keyof M & string]: M[K] extends MethodDef<infer G, infer Sp, infer X> ? string extends G ? (...parts: [`${L}.${K}: the grammar is not a literal type: write it as const`]) => never : G extends "" ? () => Chain<L, Omit<M, K | Excluded<X>>, A> : <const P extends readonly Part[]>(...parts: CheckIn<`${L}.${K}`, Expand<G, A>, boolean extends Sp ? false : Sp, P>) => Chain<L, Omit<M, K | Excluded<X>>, A> : never; };
type Err<Why extends string> = {
  readonly $error: Why;
};
type Gram<L extends string, G extends string, V extends Part> = CheckIn<L, G, false, [V]>[0] extends (infer R) ? [V] extends [R] ? V : R extends string ? Err<R> : never : never;
type Req<D> = { [K in keyof D as K extends `${string}?` ? never : K]: unknown; };
type DefOf<D, K> = K extends keyof D ? D[K] : `${K & string}?` extends keyof D ? D[`${K & string}?`] : never;
type One<L extends string, A, S, V, Tok> = S extends "$tokens" ? V extends object ? V : Err<`${L}: expected a token set (createTokens)`> : S extends "$overrides" ? [Tok] extends [never] ? Err<`${L}: "$overrides" needs a "$tokens" before it`> : CheckOverrides<Tok, V> : S extends "$selector" ? V extends string ? ValidSelector<V> extends V ? V : Err<ValidSelector<V>> : Err<`${L}: expected a selector`> : S extends string ? V extends Part ? Gram<L, Expand<S, A>, V> : Err<`${L}: expected a value`> : S extends Typed<infer T> ? V extends T ? V : Err<`${L}: wrong type`> : V extends object ? { [K in keyof V]: One<`${L}.${K & string}`, A, DefOf<S, K>, V[K], never>; } & Req<S> : Err<`${L}: expected an object`>;
type TokensAt<D extends readonly unknown[], P extends readonly unknown[]> = D extends readonly [infer H, ...infer R] ? H extends "$tokens" ? P extends readonly [infer X, ...unknown[]] ? X : never : P extends readonly [unknown, ...infer Q] ? TokensAt<R, Q> : never : never;
type CheckAll<L extends string, A, D extends readonly unknown[], P extends readonly unknown[]> = { [K in keyof P]: K extends keyof D ? One<L, A, D[K], P[K], TokensAt<D, P>> : P[K]; };
type Arity<D extends readonly unknown[]> = D extends readonly [...infer R, infer Last] ? Last extends string | Typed<unknown> ? { readonly [K in keyof D]: unknown; } : [keyof Req<Last>] extends [never] ? readonly [...{ [K in keyof R]: unknown; }, unknown?] : { readonly [K in keyof D]: unknown; } : readonly [];
type Param<Def> = Def extends "$tokens" ? object : Def extends "$overrides" ? {
  readonly [group: string]: unknown;
} : Def extends "$selector" ? string : Def extends string ? string : Def extends Typed<infer T> ? T : { -readonly [K in keyof Def as K extends `${string}?` ? never : K]: Param<Def[K]>; } & { -readonly [K in keyof Def as K extends `${infer R}?` ? R : never]?: Param<Def[K]>; };
type Params<D> = D extends string ? [value: string] : D extends Typed<infer T> ? [value: T] : D extends readonly unknown[] ? D extends readonly [...infer R, infer Last] ? Last extends string | Typed<unknown> ? { -readonly [K in keyof D]: Param<D[K]>; } : [keyof Req<Last>] extends [never] ? [...{ -readonly [K in keyof R]: Param<R[K]>; }, Param<Last>] : { -readonly [K in keyof D]: Param<D[K]>; } : [] : never;
type Callable<L extends string, D, A, R> = D extends string ? <const P extends readonly Part[]>(...parts: CheckIn<L, Expand<D, A>, false, P>) => R : D extends Typed<infer X> ? (value: X) => R : D extends readonly unknown[] ? <const P extends Arity<D>>(...args: P & CheckAll<L, A, D, P>) => R : never;
type Label<K extends string, V> = V extends {
  label?: infer L;
} ? NonNullable<L> extends (infer S extends string) ? [S] extends [never] ? K : S : K : K;
type Opaque<R> = R extends string ? string : R;
type MemberOf<K extends string, V, A> = Kind<K, V> extends "chain" ? V extends {
  chain: infer M;
} ? () => Chain<K, M, A> : never : Kind<K, V> extends "call" ? V extends {
  args: infer D;
} ? Callable<K, D, A, Style> : never : Kind<K, V> extends "value" ? V extends {
  args: infer D;
  value: (args: never) => infer R;
} ? Callable<Label<K, V>, D, A, Opaque<R>> : never : Kind<K, V> extends "prop" ? V extends (infer G extends string) ? <const P extends readonly Part[]>(...parts: CheckIn<K, Expand<G, A>, false, P>) => Style : never : never;
/** What `.export()` gives: the members of the table, typed from it (a `-prefixed` property is camel-cased, an embedded scope nests). */
type Members<T> = { [K in keyof T & string as Private<K> extends true ? never : Kind<K, T[K]> extends "chain" | "call" | "value" ? K : Kind<K, T[K]> extends "prop" ? Camel<K> : Kind<K, T[K]> extends "module" ? K : never]: Kind<K, T[K]> extends "module" ? T[K] extends {
  "~scope": string;
  "~table": infer MT;
} ? Members<MT> : never : MemberOf<K, T[K], AliasesOf<T>>; };
type Bad$1<Why extends string> = {
  readonly $error: `cssints: ${Why}`;
};
type BadUses<N extends string, T, V> = V extends {
  uses: readonly (infer U extends string)[];
} ? [Exclude<U, UsableOf<T>>] extends [never] ? unknown : Bad$1<`${N}: uses ${Exclude<U, UsableOf<T>>}, which is not a kernel, global, layers, runtime or conflicts of this scope`> : unknown;
type Clash<N extends string, T, K> = K extends `#${infer R}` ? R extends keyof T ? Bad$1<`${N}: ${K} and ${R} share a name: rename one`> : unknown : unknown;
type BadValue<N extends string, K, V> = V extends {
  args: infer D;
  value: (args: infer P) => unknown;
} ? D extends string ? unknown : [P] extends [never] ? unknown : Bad$1<`${N}: ${K & string}: a value member with a tuple or arg<T>() is written fn({ args, value })`> : unknown;
type Valid<N extends string, T> = { readonly [K in keyof T]: BadUses<N, T, T[K]> & Clash<N, T, K> & BadValue<N, K, T[K]>; };
type CallKeys<T> = { [K in keyof T & string]: Kind<K, T[K]> extends "call" ? K : never; }[keyof T & string];
type ArgsOf<E> = E extends {
  args: infer D;
} ? D : never;
/** The `build` of each call member, typed from its `args`. */
type Impl<T> = { readonly [K in CallKeys<T>]: (...args: Params<ArgsOf<T[K]>>) => Made; };
interface Scope<N extends string, T> {
  readonly "~scope": N;
  readonly "~table": T;
  /** The public aliases, resolved: what an embedding scope reads as `<key.alias>`. */
  readonly "~aliases": Public<T>;
  readonly "~usable": PublicUsable<T>;
  readonly name: N;
  /** The typed members of the table: `export const { ring } = scope("ring", { ... }).export()`. */
  export(): Members<T>;
}
/** A scope with call members (`args`) is not usable until `.build()` gives the function of each: typed from its `args`. */
interface Pending<N extends string, T> {
  build(impl: Impl<T>): Scope<N, T>;
}
/**
 * A plugin is a scope: `scope("name", table)`. The table holds, by shape: syntax aliases (a string), typed properties (a
 * `-vendor-prop` key with a grammar), kernels, static globals, layers, runtimes, conflicts, token sets and embedded scopes,
 * and the members (`chain`, `args` + `build`, `args` + `value`). A key starting `#` is private. Everything it declares is
 * namespaced by `name`, which is unique in the process (`cssints` and `derived` are reserved).
 */
declare function scope<const N extends string, const T extends Table>(name: N, table: T & Valid<N, T>): [CallKeys<T>] extends [never] ? Scope<N, T> : Pending<N, T>;
/**
 * The build's targets that lack one of the BCD keys, as browserslist names them (`["firefox 140"]`), by the rules of the
 * support warnings (`partial_implementation` lacks); empty when every target has them all. Build time, like `scope()`.
 */
declare const lacking: (...keys: BcdKey[]) => string[];
/**
 * Tells the engine that the module being evaluated read the file at `path` (relative to the working directory): in dev, an
 * edit of the file runs that module again, as an edit of a module it imports does; in `vite build --watch`, it is a watched
 * file. Build time, like `scope()`: in a member's functions or in the plugin's own.
 */
declare const dependsOn: (path: string) => void;
/**
 * Whether a declaration is in an export group (`cssints/widely-available`, `baseline-2022/with-downstream`, ...): the group
 * has the property and the value holds no word the group bans. A property cssints has no member for (a custom property, a
 * vendor-prefixed one) is in every group. A plugin that has a variant per group emits only what passes. Build time, like
 * `scope()`; an unknown group is an error.
 */
declare const inGroup: (group: string, property: string, value: string) => boolean;
//#endregion
export { inGroup as _, Entry as a, Part as b, Made as c, Scope as d, Table as f, fn as g, dependsOn as h, Css as i, Members as l, arg as m, ArgsDef as n, Impl as o, Typed as p, Chain as r, KernelDef as s, AliasesOf as t, Pending as u, lacking as v, Style as x, scope as y };