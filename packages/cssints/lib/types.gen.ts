/**
 * CSS IDL Types - AUTO-GENERATED
 * Generated from @webref/idl
 * Do not edit manually.
 */


// ============================================================================
// CSS Typed OM Interfaces
// ============================================================================

/** LayoutWorklet */
export interface LayoutChild {
  styleMap: StylePropertyMapReadOnly;
  intrinsicSizes(): Promise<IntrinsicSizes>;
  layoutNextFragment(constraints: LayoutConstraintsOptions, breakToken: ChildBreakToken): Promise<LayoutFragment>;
}

/** LayoutWorklet */
export interface LayoutFragment {
  inlineSize: number;
  blockSize: number;
  inlineOffset: number;
  blockOffset: number;
  data: any;
  breakToken: any | null;
}

/** LayoutWorklet */
export interface LayoutConstraints {
  availableInlineSize: number;
  availableBlockSize: number;
  fixedInlineSize: any | null;
  fixedBlockSize: any | null;
  percentageInlineSize: number;
  percentageBlockSize: number;
  blockFragmentationOffset: any | null;
  blockFragmentationType: BlockFragmentationType;
  data: any;
}

/** LayoutWorklet */
export interface LayoutEdges {
  inlineStart: number;
  inlineEnd: number;
  blockStart: number;
  blockEnd: number;
  inline: number;
  block: number;
}

/** Window */
export interface AnimationTimeline {
}

/** Window */
export interface Animation {
  id: string;
  effect: any | null;
  timeline: any | null;
  playbackRate: number;
  playState: AnimationPlayState;
  replaceState: AnimationReplaceState;
  pending: boolean;
  ready: Promise<Animation>;
  finished: Promise<Animation>;
  onfinish: EventHandler;
  oncancel: EventHandler;
  onremove: EventHandler;
  cancel(): undefined;
  finish(): undefined;
  play(): undefined;
  pause(): undefined;
  updatePlaybackRate(playbackRate: number): undefined;
  reverse(): undefined;
  persist(): undefined;
  commitStyles(): undefined;
}

/** Window */
export interface AnimationEffect {
  getTiming(): EffectTiming;
  getComputedTiming(): ComputedEffectTiming;
  updateTiming(timing?: OptionalEffectTiming): undefined;
}

/** Window */
export interface KeyframeEffect {
  target: any | null;
  pseudoElement: any | null;
  composite: CompositeOperation;
  getKeyframes(): sequence<object>;
  setKeyframes(keyframes: any | null): undefined;
}

/** Window */
export interface AnimationEvent {
  animationName: string;
  elapsedTime: number;
  pseudoElement: string;
}

/** Window */
export interface TransitionEvent {
  propertyName: string;
  elapsedTime: number;
  pseudoElement: string;
}

/** PaintWorklet */
export interface PaintRenderingContext2D {
}

/** PaintWorklet */
export interface PaintSize {
  width: number;
  height: number;
}

/** Window */
export interface MediaList {
  mediaText: string;
  length: number;
  item(index: number): any | null;
  appendMedium(medium: string): undefined;
  deleteMedium(medium: string): undefined;
}

/** Window */
export interface StyleSheet {
  type: string;
  href: any | null;
  ownerNode: string;
  parentStyleSheet: any | null;
  title: any | null;
  media: MediaList;
  disabled: boolean;
}

/** Window */
export interface CSSStyleSheet {
  ownerRule: any | null;
  cssRules: CSSRuleList;
  insertRule(rule: string, index?: number): number;
  deleteRule(index: number): undefined;
  replace(text: string): Promise<CSSStyleSheet>;
  replaceSync(text: string): undefined;
  rules: CSSRuleList;
  addRule(selector?: string, style?: string, index?: number): number;
  removeRule(index?: number): undefined;
}

/** Window */
export interface StyleSheetList {
  item(index: number): any | null;
  length: number;
}

export interface LinkStyle {
  sheet: any | null;
}

/** Window */
export interface CSSRule {
  cssText: string;
  parentRule: any | null;
  parentStyleSheet: any | null;
  type: number;
}

/** Window */
export interface CSSStyleRule {
  selectorText: string;
  style: CSSStyleProperties;
}

/** Window */
export interface CSSStyleDeclaration {
  cssText: string;
  length: number;
  item(index: number): string;
  getPropertyValue(property: string): string;
  getPropertyPriority(property: string): string;
  setProperty(property: string, value: string, priority?: string): undefined;
  removeProperty(property: string): string;
  parentRule: any | null;
}

export interface ElementCSSInlineStyle {
  attributeStyleMap: StylePropertyMap;
}

/** Window */
export interface CSSFontFaceDescriptors {
  src: string;
  fontFamily: string;
  fontStyle: string;
  fontWeight: string;
  fontStretch: string;
  fontWidth: string;
  fontSize: string;
  sizeAdjust: string;
  unicodeRange: string;
  fontFeatureSettings: string;
  fontVariationSettings: string;
  fontNamedInstance: string;
  fontDisplay: string;
  fontLanguageOverride: string;
  ascentOverride: string;
  descentOverride: string;
  lineGapOverride: string;
  superscriptPositionOverride: string;
  subscriptPositionOverride: string;
  superscriptSizeOverride: string;
  subscriptSizeOverride: string;
}

/** Window */
export interface Highlight {
  priority: number;
  type: HighlightType;
}

/** Window */
export interface HighlightRegistry {
  highlightsFromPoint(x: number, y: number, options?: HighlightsFromPointOptions): sequence<HighlightHitResult>;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSStyleValue {
  (): any;
  parse(property: string, cssText: string): CSSStyleValue;
  parseAll(property: string, cssText: string): sequence<CSSStyleValue>;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface StylePropertyMapReadOnly {
  get(property: string): string;
  getAll(property: string): sequence<CSSStyleValue>;
  has(property: string): boolean;
  size: number;
}

/** Window */
export interface StylePropertyMap {
  set(property: string, values: string): undefined;
  append(property: string, values: string): undefined;
  delete(property: string): undefined;
  clear(): undefined;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSUnparsedValue {
  length: number;
  (index: number): CSSUnparsedSegment;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSVariableReferenceValue {
  variable: string;
  fallback: any | null;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSKeywordValue {
  value: string;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSNumericValue {
  add(values: CSSNumberish): CSSNumericValue;
  sub(values: CSSNumberish): CSSNumericValue;
  mul(values: CSSNumberish): CSSNumericValue;
  div(values: CSSNumberish): CSSNumericValue;
  min(values: CSSNumberish): CSSNumericValue;
  max(values: CSSNumberish): CSSNumericValue;
  equals(value: CSSNumberish): boolean;
  to(unit: string): CSSUnitValue;
  toSum(units: string): CSSMathSum;
  type(): CSSNumericType;
  parse(cssText: string): CSSNumericValue;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSUnitValue {
  value: number;
  unit: string;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSMathValue {
  operator: CSSMathOperator;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSMathSum {
  values: CSSNumericArray;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSMathProduct {
  values: CSSNumericArray;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSMathNegate {
  value: CSSNumericValue;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSMathInvert {
  value: CSSNumericValue;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSMathMin {
  values: CSSNumericArray;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSMathMax {
  values: CSSNumericArray;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSTransformValue {
  length: number;
  (index: number): CSSTransformComponent;
  is2D: boolean;
  toMatrix(): DOMMatrix;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSTransformComponent {
  (): any;
  is2D: boolean;
  toMatrix(): DOMMatrix;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSTranslate {
  x: CSSNumericValue;
  y: CSSNumericValue;
  z: CSSNumericValue;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSRotate {
  x: CSSNumberish;
  y: CSSNumberish;
  z: CSSNumberish;
  angle: CSSNumericValue;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSScale {
  x: CSSNumberish;
  y: CSSNumberish;
  z: CSSNumberish;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSSkew {
  ax: CSSNumericValue;
  ay: CSSNumericValue;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSSkewX {
  ax: CSSNumericValue;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSSkewY {
  ay: CSSNumericValue;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSPerspective {
  length: CSSPerspectiveValue;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSMatrixComponent {
  matrix: DOMMatrix;
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSImageValue {
}

/** [object Object], [object Object], [object Object], [object Object] */
export interface CSSColorValue {
  parse(cssText: string): string;
}

// ============================================================================
// CSS Dictionaries
// ============================================================================

export interface EffectTiming {
  fill?: FillMode;
  iterationStart?: number;
  iterations?: number;
  direction?: PlaybackDirection;
  easing?: string;
}

export interface ComputedEffectTiming {
  progress?: any | null;
  currentIteration?: any | null;
}

export interface KeyframeAnimationOptions {
  id?: string;
  timeline?: any | null;
}

export interface FragmentResultOptions {
  inlineSize?: number;
  blockSize?: number;
  autoBlockSize?: number;
  childFragments?: sequence<LayoutFragment>;
  data?: any;
  breakToken?: BreakTokenOptions;
}

export interface IntrinsicSizesResultOptions {
  maxContentSize?: number;
  minContentSize?: number;
}

export interface BaseKeyframe {
  offset?: any | null;
  easing?: string;
  composite?: CompositeOperationOrAuto;
}
