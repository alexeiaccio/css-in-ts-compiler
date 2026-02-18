/**
 * CSS Types - AUTO-GENERATED
 * Do not edit manually. Run: bun run scripts/generate-all.ts
 * 
 * Generated from mdn-data/css/syntaxes.json
 */



// ============================================================================
// Primitive CSS Value Types
// ============================================================================

export type CSSNumber = number;
export type CSSInteger = number;

export type Percentage = `${number}%`;

export type Px = `${number}px`;
export type Rem = `${number}rem`;
export type Em = `${number}em`;
export type Ch = `${number}ch`;
export type Vw = `${number}vw`;
export type Vh = `${number}vh`;
export type Vmin = `${number}vmin`;
export type Vmax = `${number}vmax`;

export type Length = CSSNumber | Px | Rem | Em | Ch | Vw | Vh | Vmin | Vmax | `${number}${string}`;

export type Deg = `${number}deg`;
export type Rad = `${number}rad`;
export type Grad = `${number}grad`;
export type Turn = `${number}turn`;

export type Angle = CSSNumber | Deg | Rad | Grad | Turn;

export type Seconds = `${number}s`;
export type Milliseconds = `${number}ms`;

export type Time = Seconds | Milliseconds;

export type Hz = `${number}Hz`;
export type kHz = `${number}kHz`;

export type Frequency = Hz | kHz;

export type Dpi = `${number}dpi`;
export type Dppx = `${number}dppx`;

export type Resolution = Dpi | Dppx;

export type Url = string;
export type Image = string;
export type Position = string;

// Named colors are just strings for now
export type NamedColor = string;
export type HexColor = `#${string}`;
export type RgbColor = `rgb(${string})`;
export type HslColor = `hsl(${string})`;
export type OklchColor = `oklch(${string})`;

export type Color = NamedColor | HexColor | RgbColor | HslColor | OklchColor | string;

// Composite types
export type LengthPercentage = Length | Percentage;
export type AnglePercentage = Angle | Percentage;
export type TimePercentage = Time | Percentage;

// Unit helpers (runtime values)
export const px = (v: number): Px => `${v}px`;
export const rem = (v: number): Rem => `${v}rem`;
export const em = (v: number): Em => `${v}em`;
export const vw = (v: number): Vw => `${v}vw`;
export const vh = (v: number): Vh => `${v}vh`;
export const pct = (v: number): Percentage => `${v}%`;
export const deg = (v: number): Deg => `${v}deg`;
export const turn = (v: number): Turn => `${v}turn`;
export const sec = (v: number): Seconds => `${v}s`;
export const ms = (v: number): Milliseconds => `${v}ms`;



// ============================================================================
// CSS Syntax Types
// ============================================================================



/** abs() - abs( <calc-sum> ) */
export type abs = string;

/** absolute-size - xx-small | x-small | small | medium | large | x-large | xx-large | xxx-large */
export type absoluteSize = string;

/** acos() - acos( <calc-sum> ) */
export type acos = string;

/** alpha-value - <number> | <percentage> */
export type alphaValue = Percentage;

/** an+b - odd | even | <integer> | <n-dimension> | '+'?† n | -n | <ndashdigit-dimension> | '+'?† <ndashdigit-i */
export type anB = CSSInteger;

/** anchor() - anchor( <anchor-name>? && <anchor-side>, <length-percentage>? ) */
export type anchor = string;

/** anchor-name - <dashed-ident> */
export type anchorName = string;

/** anchor-side - inside | outside | top | left | right | bottom | start | end | self-start | self-end | <percentage>  */
export type anchorSide = Percentage;

/** anchor-size - width | height | block | inline | self-block | self-inline */
export type anchorSize = string;

/** angle-percentage - <angle> | <percentage> */
export type anglePercentage = AnglePercentage;

/** angular-color-hint - <angle-percentage> | <zero> */
export type angularColorHint = string;

/** angular-color-stop - <color> <color-stop-angle>? */
export type angularColorStop = Color;

/** angular-color-stop-list - <angular-color-stop> , [ <angular-color-hint>? , <angular-color-stop> ]#? */
export type angularColorStopList = string;

/** animateable-feature - scroll-position | contents | <custom-ident> */
export type animateableFeature = string;

/** animation-action - none | play | play-once | play-forwards | play-backwards | pause | reset | replay */
export type animationAction = string;

/** asin() - asin( <calc-sum> ) */
export type asin = string;

/** atan() - atan( <calc-sum> ) */
export type atan = string;

/** atan2() - atan2( <calc-sum>, <calc-sum> ) */
export type atan2 = string;

/** attachment - scroll | fixed | local */
export type attachment = string;

/** attr() - attr( <attr-name> <attr-type>? , <declaration-value>? ) */
export type attr = string;

/** attr-matcher - [ '~' | '|' | '^' | '$' | '*' ]? '=' */
export type attrMatcher = string;

/** attr-modifier - i | s */
export type attrModifier = string;

/** attr-type - type( <syntax> ) | raw-string | number | <attr-unit> */
export type attrType = string;

/** attribute-selector - '[' <wq-name> ']' | '[' <wq-name> <attr-matcher> [ <string-token> | <ident-token> ] <attr-modifier>? */
export type attributeSelector = string;

/** auto-repeat - repeat( [ auto-fill | auto-fit ] , [ <line-names>? <fixed-size> ]+ <line-names>? ) */
export type autoRepeat = string;

/** auto-track-list - [ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>? <auto-repeat>
[ <line-names>? [ < */
export type autoTrackList = string;

/** axis - block | inline | x | y */
export type axis = string;

/** baseline-position - [ first | last ]? baseline */
export type baselinePosition = string;

/** basic-shape - <inset()> | <xywh()> | <rect()> | <circle()> | <ellipse()> | <polygon()> | <path()> */
export type basicShape = string;

/** basic-shape-rect - <inset()> | <rect()> | <xywh()> */
export type basicShapeRect = string;

/** bg-clip - <visual-box> | border-area | text */
export type bgClip = string;

/** bg-image - <image> | none */
export type bgImage = Image;

/** bg-layer - <bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <visual-box> || <v */
export type bgLayer = string;

/** bg-position - [ [ left | center | right | top | bottom | <length-percentage> ] | [ left | center | right | <length */
export type bgPosition = string;

/** bg-size - [ <length-percentage [0,∞]> | auto ]{1,2} | cover | contain */
export type bgSize = string;

/** blend-mode - normal | multiply | screen | overlay | darken | lighten | color-dodge | color-burn | hard-light | so */
export type blendMode = string;

/** blur() - blur( <length>? ) */
export type blur = Length;

/** brightness() - brightness( [ <number> | <percentage> ]? ) */
export type brightness = Percentage;

/** calc() - calc( <calc-sum> ) */
export type calc = string;

/** calc-constant - e | pi | infinity | -infinity | NaN */
export type calcConstant = string;

/** calc-product - <calc-value> [ '*' <calc-value> | '/' <number> ]* */
export type calcProduct = CSSNumber;

/** calc-size() - calc-size( <calc-size-basis>, <calc-sum> ) */
export type calcSize = string;

/** calc-size-basis - <intrinsic-size-keyword> | <calc-size()> | any | <calc-sum> */
export type calcSizeBasis = string;

/** calc-sum - <calc-product> [ [ '+' | '-' ] <calc-product> ]* */
export type calcSum = string;

/** calc-value - <number> | <dimension> | <percentage> | <calc-constant> | ( <calc-sum> ) */
export type calcValue = Percentage;

/** cf-final-image - <image> | <color> */
export type cfFinalImage = Color;

/** cf-mixing-image - <percentage>? && <image> */
export type cfMixingImage = Percentage;

/** circle() - circle( <radial-size>? [ at <position> ]? ) */
export type circle = string;

/** clamp() - clamp( <calc-sum>#{3} ) */
export type clamp = string;

/** class-selector - '.' <ident-token> */
export type classSelector = string;

/** clip-source - <url> */
export type clipSource = URL;

/** color() - color( [ from <color> ]? <colorspace-params> [ / [ <alpha-value> | none ] ]? ) */
export type color = Color;

/** color-base - <hex-color> | <color-function> | <named-color> | <color-mix()> | transparent */
export type colorBase = string;

/** color-function - <rgb()> | <rgba()> | <hsl()> | <hsla()> | <hwb()> | <lab()> | <lch()> | <oklab()> | <oklch()> | <col */
export type colorFunction = string;

/** color-interpolation-method - in [ <rectangular-color-space> | <polar-color-space> <hue-interpolation-method>? | <custom-color-spa */
export type colorInterpolationMethod = string;

/** color-mix() - color-mix( <color-interpolation-method> , [ <color> && <percentage [0,100]>? ]#{2}) */
export type colorMix = Color;

/** color-stop - <color-stop-length> | <color-stop-angle> */
export type colorStop = string;

/** color-stop-angle - [ <angle-percentage> | <zero> ]{1,2} */
export type colorStopAngle = string;

/** color-stop-length - <length-percentage>{1,2} */
export type colorStopLength = string;

/** color-stop-list - <linear-color-stop> , [ <linear-color-hint>? , <linear-color-stop> ]#? */
export type colorStopList = string;

/** colorspace-params - [<custom-params> | <predefined-rgb-params> | <xyz-params>] */
export type colorspaceParams = string;

/** combinator - '>' | '+' | '~' | [ '||' ] */
export type combinator = string;

/** common-lig-values - [ common-ligatures | no-common-ligatures ] */
export type commonLigValues = string;

/** compat-auto - searchfield | textarea | checkbox | radio | menulist | listbox | meter | progress-bar | button */
export type compatAuto = string;

/** compat-special - textfield | menulist-button */
export type compatSpecial = string;

/** complex-selector - <compound-selector> [ <combinator>? <compound-selector> ]* */
export type complexSelector = string;

/** complex-selector-list - <complex-selector># */
export type complexSelectorList = string;

/** composite-style - clear | copy | source-over | source-in | source-out | source-atop | destination-over | destination-i */
export type compositeStyle = string;

/** compositing-operator - add | subtract | intersect | exclude */
export type compositingOperator = string;

/** compound-selector - [ <type-selector>? <subclass-selector>* [ <pseudo-element-selector> <pseudo-class-selector>* ]* ]! */
export type compoundSelector = string;

/** compound-selector-list - <compound-selector># */
export type compoundSelectorList = string;

/** conic-gradient() - conic-gradient( [ <conic-gradient-syntax> ] ) */
export type conicGradient = string;

/** conic-gradient-syntax - [ [ [ from [ <angle> | <zero> ] ]? [ at <position> ]? ] || <color-interpolation-method> ]? , <angula */
export type conicGradientSyntax = Angle;

/** container-condition - [ <container-name>? <container-query>? ]! */
export type containerCondition = string;

/** container-name - <custom-ident> */
export type containerName = string;

/** container-query - not <query-in-parens> | <query-in-parens> [ [ and <query-in-parens> ]* | [ or <query-in-parens> ]* ] */
export type containerQuery = string;

/** content-distribution - space-between | space-around | space-evenly | stretch */
export type contentDistribution = string;

/** content-list - [ <string> | <image> | <attr()> | <quote> | <counter> ]+ */
export type contentList = string;

/** content-position - center | start | end | flex-start | flex-end */
export type contentPosition = string;

/** content-replacement - <image> */
export type contentReplacement = Image;

/** contextual-alt-values - [ contextual | no-contextual ] */
export type contextualAltValues = string;

/** contrast() - contrast( [ <number> | <percentage> ]? ) */
export type contrast = Percentage;

/** coord-box - <paint-box> | view-box */
export type coordBox = string;

/** corner-shape-value - round | scoop | bevel | notch | square | squircle | <superellipse()> */
export type cornerShapeValue = string;

/** cos() - cos( <calc-sum> ) */
export type cos = string;

/** counter - <counter()> | <counters()> */
export type counter = string;

/** counter-name - <custom-ident> */
export type counterName = string;

/** counter-style - <counter-style-name> | symbols() */
export type counterStyle = string;

/** counter-style-name - <custom-ident> */
export type counterStyleName = string;

/** counters() - counters( <counter-name>, <string>, <counter-style>? ) */
export type counters = string;

/** cross-fade() - cross-fade( <cf-mixing-image> , <cf-final-image>? ) */
export type crossFade = string;

/** cubic-bezier() - cubic-bezier( [ <number [0,1]>, <number> ]#{2} ) */
export type cubicBezier = CSSNumber;

/** cubic-bezier-easing-function - ease | ease-in | ease-out | ease-in-out | <cubic-bezier()> */
export type cubicBezierEasingFunction = string;

/** cursor-predefined - auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text |  */
export type cursorPredefined = string;

/** custom-color-space - <dashed-ident> */
export type customColorSpace = string;

/** custom-params - <dashed-ident> [ <number> | <percentage> | none ]+ */
export type customParams = Percentage;

/** dasharray - [ [ <length-percentage> | <number> ]+ ]# */
export type dasharray = CSSNumber;

/** dashndashdigit-ident - <ident-token> */
export type dashndashdigitIdent = string;

/** deprecated-system-color - ActiveBorder | ActiveCaption | AppWorkspace | Background | ButtonHighlight | ButtonShadow | CaptionT */
export type deprecatedSystemColor = string;

/** discretionary-lig-values - [ discretionary-ligatures | no-discretionary-ligatures ] */
export type discretionaryLigValues = string;

/** display-box - contents | none */
export type displayBox = string;

/** display-inside - flow | flow-root | table | flex | grid | ruby */
export type displayInside = string;

/** display-internal - table-row-group | table-header-group | table-footer-group | table-row | table-cell | table-column-gr */
export type displayInternal = string;

/** display-legacy - inline-block | inline-list-item | inline-table | inline-flex | inline-grid */
export type displayLegacy = string;

/** display-listitem - <display-outside>? && [ flow | flow-root ]? && list-item */
export type displayListitem = string;

/** display-outside - block | inline | run-in */
export type displayOutside = string;

/** drop-shadow() - drop-shadow( [ <color>? && <length>{2,3} ] ) */
export type dropShadow = Length;

/** dynamic-range-limit-mix() - dynamic-range-limit-mix( [ <'dynamic-range-limit'> && <percentage [0,100]> ]#{2,} ) */
export type dynamicRangeLimitMix = string;

/** easing-function - <linear-easing-function> | <cubic-bezier-easing-function> | <step-easing-function> */
export type easingFunction = string;

/** east-asian-variant-values - [ jis78 | jis83 | jis90 | jis04 | simplified | traditional ] */
export type eastAsianVariantValues = string;

/** east-asian-width-values - [ full-width | proportional-width ] */
export type eastAsianWidthValues = string;

/** element() - element( <id-selector> ) */
export type element = string;

/** ellipse() - ellipse( <radial-size>? [ at <position> ]? ) */
export type ellipse = string;

/** env() - env( <custom-ident> , <declaration-value>? ) */
export type env = string;

/** exp() - exp( <calc-sum> ) */
export type exp = string;

/** explicit-track-list - [ <line-names>? <track-size> ]+ <line-names>? */
export type explicitTrackList = string;

/** family-name - <string> | <custom-ident>+ */
export type familyName = string;

/** feature-tag-value - <string> [ <integer> | on | off ]? */
export type featureTagValue = CSSInteger;

/** feature-type - @stylistic | @historical-forms | @styleset | @character-variant | @swash | @ornaments | @annotation */
export type featureType = string;

/** feature-value-block - <feature-type> '{' <feature-value-declaration-list> '}' */
export type featureValueBlock = string;

/** feature-value-block-list - <feature-value-block>+ */
export type featureValueBlockList = string;

/** feature-value-declaration - <custom-ident>: <integer>+; */
export type featureValueDeclaration = CSSInteger;

/** feature-value-declaration-list - <feature-value-declaration> */
export type featureValueDeclarationList = string;

/** feature-value-name - <custom-ident> */
export type featureValueName = string;

/** filter-function - <blur()> | <brightness()> | <contrast()> | <drop-shadow()> | <grayscale()> | <hue-rotate()> | <inver */
export type filterFunction = string;

/** filter-value-list - [ <filter-function> | <url> ]+ */
export type filterValueList = URL;

/** final-bg-layer - <bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <visual-box> || <v */
export type finalBgLayer = string;

/** fit-content() - fit-content( <length-percentage [0,∞]> ) */
export type fitContent = string;

/** fixed-breadth - <length-percentage> */
export type fixedBreadth = string;

/** fixed-repeat - repeat( [ <integer [1,∞]> ] , [ <line-names>? <fixed-size> ]+ <line-names>? ) */
export type fixedRepeat = string;

/** fixed-size - <fixed-breadth> | minmax( <fixed-breadth> , <track-breadth> ) | minmax( <inflexible-breadth> , <fixe */
export type fixedSize = string;

/** font-stretch-absolute - normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | */
export type fontStretchAbsolute = Percentage;

/** font-variant-css2 - normal | small-caps */
export type fontVariantCss2 = string;

/** font-weight-absolute - normal | bold | <number [1,1000]> */
export type fontWeightAbsolute = string;

/** font-width-css3 - normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | */
export type fontWidthCss3 = string;

/** form-control-identifier - select */
export type formControlIdentifier = string;

/** frequency-percentage - <frequency> | <percentage> */
export type frequencyPercentage = Percentage;

/** generic-complete - serif | sans-serif | system-ui | cursive | fantasy | math | monospace */
export type genericComplete = string;

/** general-enclosed - [ <function-token> <any-value> ) ] | ( <ident> <any-value> ) */
export type generalEnclosed = string;

/** generic-family - <generic-complete> | <generic-incomplete> | emoji | fangsong */
export type genericFamily = string;

/** generic-incomplete - ui-serif | ui-sans-serif | ui-monospace | ui-rounded */
export type genericIncomplete = string;

/** geometry-box - <shape-box> | fill-box | stroke-box | view-box */
export type geometryBox = string;

/** gradient - <linear-gradient()> | <repeating-linear-gradient()> | <radial-gradient()> | <repeating-radial-gradie */
export type gradient = string;

/** grayscale() - grayscale( [ <number> | <percentage> ]? ) */
export type grayscale = Percentage;

/** grid-line - auto | <custom-ident> | [ <integer> && <custom-ident>? ] | [ span && [ <integer> || <custom-ident> ] */
export type gridLine = CSSInteger;

/** historical-lig-values - [ historical-ligatures | no-historical-ligatures ] */
export type historicalLigValues = string;

/** hsl() - hsl( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsl( [ <hue> | none ] [ <percentage> | <n */
export type hsl = Percentage;

/** hsla() - hsla( <hue>, <percentage>, <percentage>, <alpha-value>? ) | hsla( [ <hue> | none ] [ <percentage> |  */
export type hsla = Percentage;

/** hue - <number> | <angle> */
export type hue = Angle;

/** hue-interpolation-method - [ shorter | longer | increasing | decreasing ] hue */
export type hueInterpolationMethod = string;

/** hue-rotate() - hue-rotate( [ <angle> | <zero> ]? ) */
export type hueRotate = Angle;

/** hwb() - hwb( [ <hue> | none ] [ <percentage> | <number> | none ] [ <percentage> | <number> | none ] [ / [ <a */
export type hwb = Percentage;

/** hypot() - hypot( <calc-sum># ) */
export type hypot = string;

/** id-selector - <hash-token> */
export type idSelector = string;

/** image() - image( <image-tags>? [ <image-src>? , <color>? ]! ) */
export type image = Color;

/** image-set() - image-set( <image-set-option># ) */
export type imageSet = string;

/** image-set-option - [ <image> | <string> ] [ <resolution> || type(<string>) ] */
export type imageSetOption = string;

/** image-src - <url> | <string> */
export type imageSrc = string;

/** image-tags - ltr | rtl */
export type imageTags = string;

/** inflexible-breadth - <length-percentage> | min-content | max-content | auto */
export type inflexibleBreadth = string;

/** inset() - inset( <length-percentage>{1,4} [ round <'border-radius'> ]? ) */
export type inset = string;

/** invert() - invert( [ <number> | <percentage> ]? ) */
export type invert = Percentage;

/** keyframe-block - <keyframe-selector># {
  <declaration-list>
} */
export type keyframeBlock = string;

/** keyframe-selector - from | to | <percentage [0,100]> | <timeline-range-name> <percentage> */
export type keyframeSelector = Percentage;

/** keyframes-name - <custom-ident> | <string> */
export type keyframesName = string;

/** lab() - lab( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> |  */
export type lab = Percentage;

/** layer() - layer( <layer-name> ) */
export type layer = string;

/** layer-name - <ident> [ '.' <ident> ]* */
export type layerName = string;

/** lch() - lch( [<percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alpha- */
export type lch = Percentage;

/** leader() - leader( <leader-type> ) */
export type leader = string;

/** leader-type - dotted | solid | space | <string> */
export type leaderType = string;

/** length-percentage - <length> | <percentage> */
export type lengthPercentage = LengthPercentage;

/** light-dark() - light-dark( <color>, <color> ) */
export type lightDark = Color;

/** line-name-list - [ <line-names> | <name-repeat> ]+ */
export type lineNameList = string;

/** line-names - '[' <custom-ident>* ']' */
export type lineNames = string;

/** line-style - none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset */
export type lineStyle = string;

/** line-width - <length> | thin | medium | thick */
export type lineWidth = Length;

/** linear() - linear( [ <number> && <percentage>{0,2} ]# ) */
export type linear = Percentage;

/** linear-color-hint - <length-percentage> */
export type linearColorHint = string;

/** linear-color-stop - <color> <color-stop-length>? */
export type linearColorStop = Color;

/** linear-easing-function - linear | <linear()> */
export type linearEasingFunction = string;

/** linear-gradient() - linear-gradient( [ <linear-gradient-syntax> ] ) */
export type linearGradient = string;

/** linear-gradient-syntax - [ [ <angle> | <zero> | to <side-or-corner> ] || <color-interpolation-method> ]? , <color-stop-list> */
export type linearGradientSyntax = Angle;

/** log() - log( <calc-sum>, <calc-sum>? ) */
export type log = string;

/** mask-layer - <mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || <geometry-box> || [ <geometry-b */
export type maskLayer = string;

/** mask-position - [ <length-percentage> | left | center | right ] [ <length-percentage> | top | center | bottom ]? */
export type maskPosition = string;

/** mask-reference - none | <image> | <mask-source> */
export type maskReference = Image;

/** mask-source - <url> */
export type maskSource = URL;

/** masking-mode - alpha | luminance | match-source */
export type maskingMode = string;

/** matrix() - matrix( <number>#{6} ) */
export type matrix = CSSNumber;

/** matrix3d() - matrix3d( <number>#{16} ) */
export type matrix3D = CSSNumber;

/** max() - max( <calc-sum># ) */
export type max = string;

/** media-and - <media-in-parens> [ and <media-in-parens> ]+ */
export type mediaAnd = string;

/** media-condition - <media-not> | <media-and> | <media-or> | <media-in-parens> */
export type mediaCondition = string;

/** media-condition-without-or - <media-not> | <media-and> | <media-in-parens> */
export type mediaConditionWithoutOr = string;

/** media-feature - ( [ <mf-plain> | <mf-boolean> | <mf-range> ] ) */
export type mediaFeature = string;

/** media-in-parens - ( <media-condition> ) | <media-feature> | <general-enclosed> */
export type mediaInParens = string;

/** media-not - not <media-in-parens> */
export type mediaNot = string;

/** media-or - <media-in-parens> [ or <media-in-parens> ]+ */
export type mediaOr = string;

/** media-query - <media-condition> | [ not | only ]? <media-type> [ and <media-condition-without-or> ]? */
export type mediaQuery = string;

/** media-query-list - <media-query># */
export type mediaQueryList = string;

/** media-type - <ident> */
export type mediaType = string;

/** mf-boolean - <mf-name> */
export type mfBoolean = string;

/** mf-name - <ident> */
export type mfName = string;

/** mf-plain - <mf-name> : <mf-value> */
export type mfPlain = string;

/** mf-range - <mf-name> [ '<' | '>' ]? '='? <mf-value>
| <mf-value> [ '<' | '>' ]? '='? <mf-name>
| <mf-value> '<' */
export type mfRange = string;

/** mf-value - <number> | <dimension> | <ident> | <ratio> */
export type mfValue = CSSNumber;

/** min() - min( <calc-sum># ) */
export type min = string;

/** minmax() - minmax( [ <length-percentage> | min-content | max-content | auto ] , [ <length-percentage> | <flex>  */
export type minmax = string;

/** mod() - mod( <calc-sum>, <calc-sum> ) */
export type mod = string;

/** n-dimension - <dimension-token> */
export type nDimension = string;

/** name-repeat - repeat( [ <integer [1,∞]> | auto-fill ], <line-names>+ ) */
export type nameRepeat = string;

/** named-color - aliceblue | antiquewhite | aqua | aquamarine | azure | beige | bisque | black | blanchedalmond | blu */
export type namedColor = string;

/** namespace-prefix - <ident> */
export type namespacePrefix = string;

/** ndash-dimension - <dimension-token> */
export type ndashDimension = string;

/** ndashdigit-dimension - <dimension-token> */
export type ndashdigitDimension = string;

/** ndashdigit-ident - <ident-token> */
export type ndashdigitIdent = string;

/** ns-prefix - [ <ident-token> | '*' ]? '|' */
export type nsPrefix = string;

/** number-percentage - <number> | <percentage> */
export type numberPercentage = Percentage;

/** numeric-figure-values - [ lining-nums | oldstyle-nums ] */
export type numericFigureValues = string;

/** numeric-fraction-values - [ diagonal-fractions | stacked-fractions ] */
export type numericFractionValues = string;

/** numeric-spacing-values - [ proportional-nums | tabular-nums ] */
export type numericSpacingValues = string;

/** offset-path - <ray()> | <url> | <basic-shape> */
export type offsetPath = URL;

/** oklab() - oklab( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <percentage> | <number> */
export type oklab = Percentage;

/** oklch() - oklch( [ <percentage> | <number> | none] [ <percentage> | <number> | none] [ <hue> | none] [ / [<alp */
export type oklch = Percentage;

/** opacity() - opacity( [ <number> | <percentage> ]? ) */
export type opacity = Percentage;

/** opacity-value - <number> | <percentage> */
export type opacityValue = Percentage;

/** outline-line-style - none | dotted | dashed | solid | double | groove | ridge | inset | outset */
export type outlineLineStyle = string;

/** outline-radius - <length> | <percentage> */
export type outlineRadius = LengthPercentage;

/** overflow-position - unsafe | safe */
export type overflowPosition = string;

/** page-body - <declaration>? [ ; <page-body> ]? | <page-margin-box> <page-body> */
export type pageBody = string;

/** page-margin-box - <page-margin-box-type> '{' <declaration-list> '}' */
export type pageMarginBox = string;

/** page-margin-box-type - @top-left-corner | @top-left | @top-center | @top-right | @top-right-corner | @bottom-left-corner |  */
export type pageMarginBoxType = string;

/** page-selector - <pseudo-page>+ | <ident> <pseudo-page>* */
export type pageSelector = string;

/** page-selector-list - [ <page-selector># ]? */
export type pageSelectorList = string;

/** page-size - A5 | A4 | A3 | B5 | B4 | JIS-B5 | JIS-B4 | letter | legal | ledger */
export type pageSize = string;

/** paint - none | <color> | <url> [none | <color>]? | context-fill | context-stroke */
export type paint = Color;

/** paint-box - <visual-box> | fill-box | stroke-box */
export type paintBox = string;

/** palette-identifier - <dashed-ident> */
export type paletteIdentifier = string;

/** palette-mix() - palette-mix(<color-interpolation-method> , [ [normal | light | dark | <palette-identifier> | <palett */
export type paletteMix = string;

/** path() - path( <'fill-rule'>? , <string> ) */
export type path = string;

/** perspective() - perspective( [ <length [0,∞]> | none ] ) */
export type perspective = string;

/** polar-color-space - hsl | hwb | lch | oklch */
export type polarColorSpace = string;

/** polygon() - polygon( <'fill-rule'>? , [ <length-percentage> <length-percentage> ]# ) */
export type polygon = string;

/** position-area - [ left | center | right | span-left | span-right | x-start | x-end | span-x-start | span-x-end | x-s */
export type positionArea = string;

/** pow() - pow( <calc-sum>, <calc-sum> ) */
export type pow = string;

/** predefined-rgb - srgb | srgb-linear | display-p3 | display-p3-linear | a98-rgb | prophoto-rgb | rec2020 */
export type predefinedRgb = string;

/** predefined-rgb-params - <predefined-rgb> [ <number> | <percentage> | none ]{3} */
export type predefinedRgbParams = Percentage;

/** pseudo-class-selector - ':' <ident-token> | ':' <function-token> <any-value> ')' */
export type pseudoClassSelector = string;

/** pseudo-element-selector - ':' <pseudo-class-selector> */
export type pseudoElementSelector = string;

/** pseudo-page - : [ left | right | first | blank ] */
export type pseudoPage = string;

/** query-in-parens - ( <container-query> ) | ( <size-feature> ) | style( <style-query> ) | scroll-state( <scroll-state-qu */
export type queryInParens = string;

/** quote - open-quote | close-quote | no-open-quote | no-close-quote */
export type quote = string;

/** radial-extent - closest-corner | closest-side | farthest-corner | farthest-side */
export type radialExtent = string;

/** radial-gradient() - radial-gradient( [ <radial-gradient-syntax> ] ) */
export type radialGradient = string;

/** radial-gradient-syntax - [ [ [ <radial-shape> || <radial-size> ]? [ at <position> ]? ] || <color-interpolation-method> ]? , < */
export type radialGradientSyntax = string;

/** radial-shape - circle | ellipse */
export type radialShape = string;

/** radial-size - <radial-extent> | <length [0,∞]> | <length-percentage [0,∞]>{2} */
export type radialSize = string;

/** ratio - <number [0,∞]> [ / <number [0,∞]> ]? */
export type ratio = string;

/** ray() - ray( <angle> && <ray-size>? && contain? && [at <position>]? ) */
export type ray = Angle;

/** ray-size - closest-side | closest-corner | farthest-side | farthest-corner | sides */
export type raySize = string;

/** rect() - rect( [ <length-percentage> | auto ]{4} [ round <'border-radius'> ]? ) */
export type rect = string;

/** rectangular-color-space - srgb | srgb-linear | display-p3 | display-p3-linear | a98-rgb | prophoto-rgb | rec2020 | lab | oklab */
export type rectangularColorSpace = string;

/** relative-selector - <combinator>? <complex-selector> */
export type relativeSelector = string;

/** relative-selector-list - <relative-selector># */
export type relativeSelectorList = string;

/** relative-size - larger | smaller */
export type relativeSize = string;

/** rem() - rem( <calc-sum>, <calc-sum> ) */
export type rem = string;

/** repeat-style - repeat-x | repeat-y | [ repeat | space | round | no-repeat ]{1,2} */
export type repeatStyle = string;

/** repeating-conic-gradient() - repeating-conic-gradient( [ <conic-gradient-syntax> ] ) */
export type repeatingConicGradient = string;

/** repeating-linear-gradient() - repeating-linear-gradient( [ <linear-gradient-syntax> ] ) */
export type repeatingLinearGradient = string;

/** repeating-radial-gradient() - repeating-radial-gradient( [ <radial-gradient-syntax> ] ) */
export type repeatingRadialGradient = string;

/** reversed-counter-name - reversed( <counter-name> ) */
export type reversedCounterName = string;

/** rgb() - rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? ) | rgb( [ <number> |  */
export type rgb = Percentage;

/** rgba() - rgba( <percentage>#{3} , <alpha-value>? ) | rgba( <number>#{3} , <alpha-value>? ) | rgba( [ <number> */
export type rgba = Percentage;

/** rotate() - rotate( [ <angle> | <zero> ] ) */
export type rotate = Angle;

/** rotate3d() - rotate3d( <number> , <number> , <number> , [ <angle> | <zero> ] ) */
export type rotate3D = Angle;

/** rotateX() - rotateX( [ <angle> | <zero> ] ) */
export type rotateX = Angle;

/** rotateY() - rotateY( [ <angle> | <zero> ] ) */
export type rotateY = Angle;

/** rotateZ() - rotateZ( [ <angle> | <zero> ] ) */
export type rotateZ = Angle;

/** round() - round( <rounding-strategy>?, <calc-sum>, <calc-sum> ) */
export type round = string;

/** rounding-strategy - nearest | up | down | to-zero */
export type roundingStrategy = string;

/** saturate() - saturate( [ <number> | <percentage> ]? ) */
export type saturate = Percentage;

/** scale() - scale( [ <number> | <percentage> ]#{1,2} ) */
export type scale = Percentage;

/** scale3d() - scale3d( [ <number> | <percentage> ]#{3} ) */
export type scale3D = Percentage;

/** scaleX() - scaleX( [ <number> | <percentage> ] ) */
export type scaleX = Percentage;

/** scaleY() - scaleY( [ <number> | <percentage> ] ) */
export type scaleY = Percentage;

/** scaleZ() - scaleZ( [ <number> | <percentage> ] ) */
export type scaleZ = Percentage;

/** scope-end - <selector-list> */
export type scopeEnd = string;

/** scope-start - <selector-list> */
export type scopeStart = string;

/** scroll() - scroll( [ <scroller> || <axis> ]? ) */
export type scroll = string;

/** scroller - root | nearest | self */
export type scroller = string;

/** scroll-state-feature - <media-query-list> */
export type scrollStateFeature = string;

/** scroll-state-in-parens - ( <scroll-state-query> ) | ( <scroll-state-feature> ) | <general-enclosed> */
export type scrollStateInParens = string;

/** scroll-state-query - not <scroll-state-in-parens> | <scroll-state-in-parens> [ [ and <scroll-state-in-parens> ]* | [ or < */
export type scrollStateQuery = string;

/** selector-list - <complex-selector-list> */
export type selectorList = string;

/** self-position - center | start | end | self-start | self-end | flex-start | flex-end */
export type selfPosition = string;

/** sepia() - sepia( [ <number> | <percentage> ]? ) */
export type sepia = Percentage;

/** shadow - inset? && <length>{2,4} && <color>? */
export type shadow = Length;

/** shadow-t - [ <length>{2,3} && <color>? ] */
export type shadowT = Length;

/** shape - rect(<top>, <right>, <bottom>, <left>) */
export type shape = string;

/** shape-box - <visual-box> | margin-box */
export type shapeBox = string;

/** side-or-corner - [ left | right ] || [ top | bottom ] */
export type sideOrCorner = string;

/** sign() - sign( <calc-sum> ) */
export type sign = string;

/** signed-integer - <number-token> */
export type signedInteger = string;

/** signless-integer - <number-token> */
export type signlessInteger = string;

/** sin() - sin( <calc-sum> ) */
export type sin = string;

/** single-animation - <'animation-duration'> || <easing-function> || <'animation-delay'> || <single-animation-iteration-co */
export type singleAnimation = string;

/** single-animation-composition - replace | add | accumulate */
export type singleAnimationComposition = string;

/** single-animation-direction - normal | reverse | alternate | alternate-reverse */
export type singleAnimationDirection = string;

/** single-animation-fill-mode - none | forwards | backwards | both */
export type singleAnimationFillMode = string;

/** single-animation-iteration-count - infinite | <number> */
export type singleAnimationIterationCount = CSSNumber;

/** single-animation-play-state - running | paused */
export type singleAnimationPlayState = string;

/** single-animation-timeline - auto | none | <dashed-ident> | <scroll()> | <view()> */
export type singleAnimationTimeline = string;

/** single-transition - [ none | <single-transition-property> ] || <time> || <easing-function> || <time> || <transition-beha */
export type singleTransition = Time;

/** single-transition-property - all | <custom-ident> */
export type singleTransitionProperty = string;

/** size - closest-side | farthest-side | closest-corner | farthest-corner | <length> | <length-percentage>{2} */
export type size = Length;

/** size-feature - <media-query-list> */
export type sizeFeature = string;

/** skew() - skew( [ <angle> | <zero> ] , [ <angle> | <zero> ]? ) */
export type skew = Angle;

/** skewX() - skewX( [ <angle> | <zero> ] ) */
export type skewX = Angle;

/** skewY() - skewY( [ <angle> | <zero> ] ) */
export type skewY = Angle;

/** sqrt() - sqrt( <calc-sum> ) */
export type sqrt = string;

/** step-position - jump-start | jump-end | jump-none | jump-both | start | end */
export type stepPosition = string;

/** step-easing-function - step-start | step-end | <steps()> */
export type stepEasingFunction = string;

/** steps() - steps( <integer>, <step-position>? ) */
export type steps = CSSInteger;

/** style-feature - <declaration> */
export type styleFeature = string;

/** style-in-parens - ( <style-query> ) | ( <style-feature> ) | <general-enclosed> */
export type styleInParens = string;

/** style-query - not <style-in-parens> | <style-in-parens> [ [ and <style-in-parens> ]* | [ or <style-in-parens> ]* ] */
export type styleQuery = string;

/** subclass-selector - <id-selector> | <class-selector> | <attribute-selector> | <pseudo-class-selector> */
export type subclassSelector = string;

/** superellipse() - superellipse( [ <number> | infinity | -infinity ] ) */
export type superellipse = CSSNumber;

/** supports-condition - not <supports-in-parens> | <supports-in-parens> [ and <supports-in-parens> ]* | <supports-in-parens> */
export type supportsCondition = string;

/** supports-decl - ( <declaration> ) */
export type supportsDecl = string;

/** supports-feature - <supports-decl> | <supports-selector-fn> */
export type supportsFeature = string;

/** supports-in-parens - ( <supports-condition> ) | <supports-feature> | <general-enclosed> */
export type supportsInParens = string;

/** supports-selector-fn - selector( <complex-selector> ) */
export type supportsSelectorFn = string;

/** symbol - <string> | <image> | <custom-ident> */
export type cssSymbol = string;

/** symbols() - symbols( <symbols-type>? [ <string> | <image> ]+ ) */
export type symbols = string;

/** symbols-type - cyclic | numeric | alphabetic | symbolic | fixed */
export type symbolsType = string;

/** system-color - AccentColor | AccentColorText | ActiveText | ButtonBorder | ButtonFace | ButtonText | Canvas | Canva */
export type systemColor = string;

/** system-family-name - caption | icon | menu | message-box | small-caption | status-bar */
export type systemFamilyName = string;

/** tan() - tan( <calc-sum> ) */
export type tan = string;

/** target - <target-counter()> | <target-counters()> | <target-text()> */
export type target = string;

/** target-counter() - target-counter( [ <string> | <url> ] , <custom-ident> , <counter-style>? ) */
export type targetCounter = string;

/** target-counters() - target-counters( [ <string> | <url> ] , <custom-ident> , <string> , <counter-style>? ) */
export type targetCounters = string;

/** target-text() - target-text( [ <string> | <url> ] , [ content | before | after | first-letter ]? ) */
export type targetText = string;

/** text-edge - [ text | cap | ex | ideographic | ideographic-ink ] [ text | alphabetic | ideographic | ideographic- */
export type textEdge = string;

/** time-percentage - <time> | <percentage> */
export type timePercentage = TimePercentage;

/** timeline-range-name - cover | contain | entry | exit | entry-crossing | exit-crossing */
export type timelineRangeName = string;

/** track-breadth - <length-percentage> | <flex> | min-content | max-content | auto */
export type trackBreadth = string;

/** track-list - [ <line-names>? [ <track-size> | <track-repeat> ] ]+ <line-names>? */
export type trackList = string;

/** track-repeat - repeat( [ <integer [1,∞]> ] , [ <line-names>? <track-size> ]+ <line-names>? ) */
export type trackRepeat = string;

/** track-size - <track-breadth> | minmax( <inflexible-breadth> , <track-breadth> ) | fit-content( <length-percentage */
export type trackSize = string;

/** transform-function - <matrix()> | <translate()> | <translateX()> | <translateY()> | <scale()> | <scaleX()> | <scaleY()> | */
export type transformFunction = string;

/** transform-list - <transform-function>+ */
export type transformList = string;

/** transition-behavior-value - normal | allow-discrete */
export type transitionBehaviorValue = string;

/** translate() - translate( <length-percentage> , <length-percentage>? ) */
export type translate = string;

/** translate3d() - translate3d( <length-percentage> , <length-percentage> , <length> ) */
export type translate3D = Length;

/** translateX() - translateX( <length-percentage> ) */
export type translateX = string;

/** translateY() - translateY( <length-percentage> ) */
export type translateY = string;

/** translateZ() - translateZ( <length> ) */
export type translateZ = Length;

/** try-size - most-width | most-height | most-block-size | most-inline-size */
export type trySize = string;

/** try-tactic - flip-block || flip-inline || flip-start */
export type tryTactic = string;

/** type-or-unit - string | color | url | integer | number | length | angle | time | frequency | cap | ch | em | ex | i */
export type typeOrUnit = string;

/** type-selector - <wq-name> | <ns-prefix>? '*' */
export type typeSelector = string;

/** var() - var( <custom-property-name> , <declaration-value>? ) */
export type cssVar = string;

/** view() - view([<axis> || <'view-timeline-inset'>]?) */
export type view = string;

/** viewport-length - auto | <length-percentage> */
export type viewportLength = string;

/** visual-box - content-box | padding-box | border-box */
export type visualBox = string;

/** wq-name - <ns-prefix>? <ident-token> */
export type wqName = string;

/** xywh() - xywh( <length-percentage>{2} <length-percentage [0,∞]>{2} [ round <'border-radius'> ]? ) */
export type xywh = string;

/** xyz - xyz | xyz-d50 | xyz-d65 */
export type xyz = string;

/** xyz-params - <xyz> [ <number> | <percentage> | none ]{3} */
export type xyzParams = Percentage;